-- The Invites and Records pages (Roxanne, 26 Nov; notes/design-decisions.md, Transfers).
-- Replaces transfer_candidates and candidate_flags, which never held a row. Safe to run
-- again. Run after fresh-reads.sql, look-up-account.sql and exalted-skill-levels.sql.
--
-- Each player on a transfer's lists carries a copy of what the game says of them (name,
-- picture, power, state, furnace, kills, Labyrinth, Migrant Score, troops, skill levels),
-- so anyone can see the page without reading game_players. On the current transfer's list
-- the copy follows the game until the player is Transferred; then it is the record of that
-- transfer and stays as it was (Roxanne, 26 Nov: "Records keep the player as they were").

drop table if exists public.candidate_flags;
drop table if exists public.transfer_candidates;

-- ---------------------------------------------------------------------------
-- A transfer: its date (the transfer's first day, as the calendar has it), whether 1458
-- is an ordinary or a leading state, the power cap once known (an estimate stands in
-- until then), and its transfer manager, kept as they were.

alter table public.transfer_windows
  add column if not exists manager_id bigint,
  add column if not exists manager_name text,
  add column if not exists manager_avatar text,
  add column if not exists manager_alliance text;

-- ---------------------------------------------------------------------------
-- One player on one of a transfer's three lists.

create table if not exists public.transfer_invites (
  id            bigserial primary key,
  window_id     bigint not null references public.transfer_windows (id) on delete cascade,
  player_id     bigint not null,
  list          text not null check (list in ('special', 'ordinary', 'open')),
  -- The place in its list (1, 2, 3…) is the order of this number.
  position      double precision not null default 0,
  -- Sent, Transferred, Rejected or Expired as set by a person; empty is Ready or Over cap,
  -- worked out from the power and the cap.
  status        text check (status in ('sent', 'transferred', 'rejected', 'expired')),
  transferred_at timestamptz,
  -- Players who come together share a number within the transfer; no name.
  group_number  integer,
  -- Who the player goes to: an alliance tag, or a name (linked to a player when known).
  contact_tag   text,
  contact_name  text,
  contact_player_id bigint,
  -- The game's copy.
  name          text,
  avatar        text,
  power         numeric,
  state_number  integer,
  furnace       integer,
  kills         numeric,
  labyrinth     integer,
  migrant_score numeric,
  troops        jsonb,
  skills        jsonb,
  game_read_at  timestamptz,
  added_by      uuid default auth.uid(),
  added_at      timestamptz not null default now(),
  updated_by    uuid default auth.uid(),
  updated_at    timestamptz not null default now(),
  unique (window_id, player_id)
);

create index if not exists transfer_invites_player on public.transfer_invites (player_id);

-- ---------------------------------------------------------------------------
-- The current transfer: it stays current until the Monday after it ends (its eighth day),
-- then the next one takes its place (Roxanne, 26 Nov).

create or replace function admin_tools.current_transfer_window() returns bigint
language sql stable set search_path = public as $$
  select id from transfer_windows where transfer_date + 8 > (now() at time zone 'utc')::date
  order by transfer_date limit 1
$$;

-- ---------------------------------------------------------------------------
-- The game's copy, taken from game_players and exalted_skill_levels. Only the current
-- transfer's list follows the game; an older record keeps what it had, and one that never
-- had anything (imported from the old sheet) gets it once, with the time it was read, so
-- the page can tell it was received after its transfer (Roxanne, 26 Nov: "we are not gonna
-- mess with older transfers, just this once").

create or replace function admin_tools.copy_invite_game(player_number bigint)
returns void language plpgsql security definer set search_path = public, admin_tools as $$
declare
  answer jsonb;
  read_time timestamptz;
  levels jsonb;
begin
  select data, game_read_at into answer, read_time from game_players where player_id = player_number;
  select jsonb_build_object('infantry', infantry, 'lancer', lancer, 'marksmen', marksmen) into levels
    from exalted_skill_levels where player_id = player_number;
  if answer is null or answer->'player'->>'nick_name' is null then
    update transfer_invites set skills = levels
      where player_id = player_number and window_id = admin_tools.current_transfer_window() and status is distinct from 'transferred';
    return;
  end if;
  update transfer_invites set
      name = answer->'player'->>'nick_name',
      avatar = answer->'player'->>'avatar_url',
      power = nullif(answer->'player'->>'power', '')::numeric,
      state_number = nullif(answer->'player'->>'kid', '')::integer,
      furnace = nullif(answer->'player'->>'furnace_level', '')::integer,
      kills = coalesce(nullif(answer->'player'->>'kills', '')::numeric, nullif(answer->'ranks'->>'kills', '')::numeric, kills),
      labyrinth = coalesce(nullif(answer->'ranks'->>'labyrinth', '')::integer, labyrinth),
      migrant_score = coalesce(nullif(answer->'ranks'->>'migrant_score', '')::numeric, migrant_score),
      troops = coalesce((select jsonb_agg(jsonb_build_object('type', troop->>'type', 'tier', (troop->>'tier')::integer,
                 'fc', (troop->>'fire_crystal_level')::integer))
               from jsonb_array_elements(case when jsonb_typeof(answer->'troops') = 'array' then answer->'troops' else '[]'::jsonb end) troop), troops),
      skills = levels,
      game_read_at = read_time
    where player_id = player_number
      and ((window_id = admin_tools.current_transfer_window() and status is distinct from 'transferred')
        -- An older record without data waits for one good read: a fresh one, not the game's
        -- stale copy (Roxanne, 26 Nov: "one good read and we're good").
        or (game_read_at is null and answer->>'fresh' is distinct from 'false'));
end $$;

create or replace function admin_tools.invite_game_changed() returns trigger
language plpgsql security definer set search_path = public, admin_tools as $$
begin
  perform admin_tools.copy_invite_game(new.player_id);
  return new;
end $$;

drop trigger if exists invite_copy on public.game_players;
create trigger invite_copy after insert or update of data on public.game_players
  for each row when (new.player_id is not null)
  execute function admin_tools.invite_game_changed();

drop trigger if exists invite_skills on public.exalted_skill_levels;
create trigger invite_skills after insert or update on public.exalted_skill_levels
  for each row execute function admin_tools.invite_game_changed();

-- ---------------------------------------------------------------------------
-- Who may change what (Roxanne, 26 Nov): all admins and R4s add, move, group and remove;
-- only the transfer manager and admins change the status.

create or replace function public.manages_transfer(window_number bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from transfer_windows w join game_accounts a on a.in_game_id = w.manager_id::text
    where w.id = window_number and a.owner_id = auth.uid());
$$;

create or replace function admin_tools.invite_changing() returns trigger
language plpgsql security definer set search_path = public, admin_tools as $$
begin
  if tg_op = 'INSERT' then
    -- A new player is read in full at the next minute, and the copy is filled from what the
    -- site already has of them.
    insert into game_players (player_id, state_number, alliance_tag, data, read_at, refresh_asked_at)
      values (new.player_id, null, null, '{}'::jsonb, now() - interval '61 minutes', now())
      on conflict (player_id) do update set refresh_asked_at = coalesce(game_players.refresh_asked_at, now());
    return new;
  end if;
  if new.status is distinct from old.status then
    if auth.uid() is not null and not public.manages_transfer(new.window_id) then
      raise exception 'Only the transfer manager and admins change the status.';
    end if;
    -- The time the transfer was confirmed is kept; leaving Transferred lets the copy
    -- follow the game again.
    if new.status = 'transferred' then new.transferred_at := coalesce(new.transferred_at, now());
    elsif old.status = 'transferred' then new.transferred_at := null; end if;
    -- Sent asks for a fresh read, which brings the power after troops were dropped.
    if new.status = 'sent' then
      update game_players set refresh_asked_at = now() where player_id = new.player_id;
    end if;
  end if;
  if auth.uid() is not null and not public.leads_any_alliance() and (
      new.list is distinct from old.list or new.position is distinct from old.position or
      new.group_number is distinct from old.group_number or new.contact_tag is distinct from old.contact_tag or
      new.contact_name is distinct from old.contact_name or new.contact_player_id is distinct from old.contact_player_id) then
    raise exception 'Only admins and R4s change the lists.';
  end if;
  new.updated_at := now();
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end $$;

drop trigger if exists invite_changing on public.transfer_invites;
create trigger invite_changing before insert or update on public.transfer_invites
  for each row execute function admin_tools.invite_changing();

create or replace function admin_tools.invite_added() returns trigger
language plpgsql security definer set search_path = public, admin_tools as $$
begin
  perform admin_tools.copy_invite_game(new.player_id);
  return new;
end $$;

drop trigger if exists invite_added on public.transfer_invites;
create trigger invite_added after insert on public.transfer_invites
  for each row execute function admin_tools.invite_added();

-- Leaving Transferred: the copy is brought up to date at once.
create or replace function admin_tools.invite_unlocked() returns trigger
language plpgsql security definer set search_path = public, admin_tools as $$
begin
  if old.status = 'transferred' and new.status is distinct from 'transferred' then
    perform admin_tools.copy_invite_game(new.player_id);
  end if;
  return new;
end $$;

drop trigger if exists invite_unlocked on public.transfer_invites;
create trigger invite_unlocked after update of status on public.transfer_invites
  for each row execute function admin_tools.invite_unlocked();

alter table public.transfer_invites enable row level security;
drop policy if exists "anyone reads transfer_invites" on public.transfer_invites;
create policy "anyone reads transfer_invites" on public.transfer_invites for select using (true);
drop policy if exists "leaders add invites" on public.transfer_invites;
create policy "leaders add invites" on public.transfer_invites for insert to authenticated
  with check (public.leads_any_alliance());
drop policy if exists "leaders and the manager change invites" on public.transfer_invites;
create policy "leaders and the manager change invites" on public.transfer_invites for update to authenticated
  using (public.leads_any_alliance() or public.manages_transfer(window_id))
  with check (public.leads_any_alliance() or public.manages_transfer(window_id));
drop policy if exists "leaders remove invites" on public.transfer_invites;
create policy "leaders remove invites" on public.transfer_invites for delete to authenticated
  using (public.leads_any_alliance());
grant select on public.transfer_invites to anon, authenticated;
grant insert, update, delete on public.transfer_invites to authenticated;
grant usage, select on sequence public.transfer_invites_id_seq to authenticated;

-- A transfer is made when its first player is added, by anyone who may add; its cap,
-- type and manager are set by admins.
drop policy if exists "leaders make a transfer" on public.transfer_windows;
create policy "leaders make a transfer" on public.transfer_windows for insert to authenticated
  with check (public.leads_any_alliance());

-- Whether a player on the lists has an account on the site: shown very discreetly on the
-- row (Roxanne, 26 Nov), and readable by anyone without opening game_accounts.
create or replace function public.site_player_ids(player_ids bigint[])
returns setof bigint language sql stable security definer set search_path = public as $$
  select distinct in_game_id::bigint from game_accounts
  where in_game_id ~ '^[0-9]+$' and in_game_id::bigint = any (player_ids);
$$;
revoke all on function public.site_player_ids(bigint[]) from public;
grant execute on function public.site_player_ids(bigint[]) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Reads (Roxanne, 26 Nov): players on the current transfer's list who have not transferred
-- are read like the site's own accounts (every 12 hours), hourly from the invitation phase
-- (the transfer's fourth day) until the transfer ends, and once before each reset ("we
-- really only need an accurate read before reset"). Older lists are not read again ("Only
-- from the current list"); a record that never had the game's data is read once. As
-- fresh-reads.sql, with the lists added.

create or replace function admin_tools.refresh_players() returns integer
language plpgsql set search_path = public, admin_tools as $$
declare
  started timestamptz := clock_timestamp();
  player_number bigint;
  done integer := 0;
  before_reset timestamptz := date_trunc('day', now() at time zone 'utc') at time zone 'utc' + interval '23 hours';
begin
  if not pg_try_advisory_lock(hashtext('refresh_players')) then return 0; end if;
  insert into game_players (player_id, state_number, alliance_tag, data, read_at, refresh_asked_at)
    select distinct in_game_id::bigint, null::integer, null, '{}'::jsonb, now() - interval '61 minutes', now()
    from game_accounts where in_game_id ~ '^[0-9]+$'
    on conflict (player_id) do nothing;
  for player_number in
      select player.player_id from game_players player
      where (
          (player.stale_since > now() - interval '10 minutes' and player.read_at < now() - interval '50 seconds')
          or (player.read_at < now() - interval '1 hour'
            and (player.refresh_asked_at is not null or player.read_at < now() - interval '12 hours'))
          or (player.read_at < now() - interval '1 hour' and player.player_id in (
              select invite.player_id from transfer_invites invite join transfer_windows window_row on window_row.id = invite.window_id
              where invite.status is distinct from 'transferred' and window_row.id = admin_tools.current_transfer_window()
                and now() >= window_row.transfer_date + 3 and now() < window_row.transfer_date + 7))
          or (now() >= before_reset and player.read_at < before_reset and player.player_id in (
              select invite.player_id from transfer_invites invite join transfer_windows window_row on window_row.id = invite.window_id
              where invite.status is distinct from 'transferred' and window_row.id = admin_tools.current_transfer_window()
                and window_row.transfer_date + 7 > now())))
        and (player.state_number = admin_tools.home_state()
          or player.player_id::text in (select in_game_id from game_accounts where in_game_id is not null)
          or player.player_id::text in (select member->>'chief_id' from game_alliances, jsonb_array_elements(data->'members') member)
          or player.player_id in (select player_id from transfer_invites
            where (window_id = admin_tools.current_transfer_window() and status is distinct from 'transferred') or game_read_at is null))
      -- A player just put on the current transfer's list comes first, so their row fills
      -- within a minute or two even when many others wait (Roxanne, 26 Nov: "when we add new
      -- people they get the info without me having to tell you").
      order by (player.player_id in (select invite.player_id from transfer_invites invite
          where invite.window_id = admin_tools.current_transfer_window() and invite.game_read_at is null)) desc,
        (player.stale_since > now() - interval '10 minutes') desc nulls last,
        player.refresh_asked_at nulls last, player.read_at
      limit 40 loop
    exit when clock_timestamp() - started > interval '45 seconds';
    begin
      perform admin_tools.keep_player(player_number,
        admin_tools.api_get('/players/' || player_number || '?include=base,ranks,troops,heroes,chief_gear&wait=15', 20000));
      done := done + 1;
    exception when others then
      raise warning 'player % not read: %', player_number, sqlerrm;
      exit when sqlerrm like '% answered 429:%';
      update game_players set read_at = now(), stale_since = null, refresh_asked_at = null where player_id = player_number;
    end;
    perform pg_sleep(1.05);
  end loop;
  perform pg_advisory_unlock(hashtext('refresh_players'));
  return done;
end $$;

-- ---------------------------------------------------------------------------
-- Looking up an ID (Add player) also gives the power, which the pop-up shows under the name.
-- As look-up-account.sql, with the power added.

create or replace function public.look_up_game_account(player_number bigint) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  stored jsonb;
  answer jsonb;
begin
  if auth.uid() is null then raise exception 'Sign in to look up an account.'; end if;
  select data->'player' into stored from game_players where player_id = player_number;
  if stored is null or stored->>'nick_name' is null then
    begin
      answer := admin_tools.api_get('/players/' || player_number || '?include=base', 6000);
    exception when others then
      return null;
    end;
    -- Kept as asked and over an hour old, so the minute job reads it in full straight away.
    insert into game_players (player_id, state_number, alliance_tag, data, read_at, game_read_at, refresh_asked_at)
      values (player_number, (answer->'player'->>'kid')::integer, answer->'player'->'alliance'->>'abbr', answer,
        now() - interval '61 minutes', admin_tools.game_read_time(answer), now())
      on conflict (player_id) do update set data = excluded.data, game_read_at = excluded.game_read_at,
        read_at = least(game_players.read_at, excluded.read_at), refresh_asked_at = now();
    stored := answer->'player';
  end if;
  return jsonb_build_object('name', stored->>'nick_name', 'avatar', stored->>'avatar_url',
    'state', (stored->>'kid')::integer, 'alliance', stored->'alliance'->>'abbr', 'furnace', (stored->>'furnace_level')::integer,
    'power', nullif(stored->>'power', '')::numeric);
end $$;

revoke all on function public.look_up_game_account(bigint) from public, anon;
grant execute on function public.look_up_game_account(bigint) to authenticated;

-- Refresh: anyone signed in may ask for a fresh read of any player the site keeps; the
-- one-hour limit still holds (Roxanne, 26 Nov: "we will let anyone refresh, we still have
-- the 1h limit"). Same as fresh-reads.sql without the owner, R4 and admin check.
create or replace function public.ask_game_refresh(player_number bigint) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare
  player record;
begin
  select * into player from game_players where player_id = player_number;
  -- Not read yet: the minute job reads every account added on the site, so it is on its way.
  if not found then return null; end if;
  if coalesce(player.game_read_at, player.read_at) > now() - interval '1 hour' then
    return coalesce(player.game_read_at, player.read_at);
  end if;
  update game_players set refresh_asked_at = coalesce(refresh_asked_at, now()),
      -- The copy is over an hour old: ask the API at the next minute.
      read_at = least(read_at, now() - interval '61 minutes')
    where player_id = player_number;
  return coalesce(player.game_read_at, player.read_at);
end $$;

revoke all on function public.ask_game_refresh(bigint) from public, anon;
grant execute on function public.ask_game_refresh(bigint) to authenticated;
