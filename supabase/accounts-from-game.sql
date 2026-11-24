-- A site account is a link from a login to a player the game data has (owner, 24 Nov).
-- Run after game-refresh.sql and skill-levels-in-one-place.sql. Safe to run again.
--
-- What stays on the site: whose account it is, main, alt or farm, its foundry power (the
-- game does not give it) and its place in the list; on the login, the time zone and the
-- language; and everything else typed on the site (picks, personal entries,
-- availability, skill levels). What goes: the copies of what the game gives (name,
-- power, alliance, troop tiers), on the game accounts and on the login, and the old
-- account_alt_accounts table, which game_accounts replaced.
--
-- Each account also gets its alliance and its temporary alliance (owner, 24 Nov). The
-- temporary alliance is where the game shows the account now. When a read shows it
-- somewhere new, a counter starts; the alliance changes only once the account has been
-- seen there for 24 hours in a row. A move back stops the counter. The player or an admin
-- can confirm the move, which changes the alliance at once.

-- ---------------------------------------------------------------------------
-- The alliance of each player, and a counter only while a change is under way
-- ---------------------------------------------------------------------------

create table if not exists public.game_player_alliances (
  player_id     bigint primary key references public.game_players (player_id) on delete cascade,
  -- The alliance: a state and the game's tag (DVL and dvl differ); no tag for none.
  state_number  integer,
  alliance_tag  text,
  -- Set while the game shows the account somewhere else: where, and since when.
  moving_state  integer,
  moving_tag    text,
  moving_since  timestamptz,
  changed_at    timestamptz not null default now(),
  -- Who confirmed the last change on the site; null when the 24 hours made it.
  confirmed_by  uuid
);
comment on table public.game_player_alliances is
  'Each player''s alliance: it changes after 24 hours in a row somewhere new, or when the player or an admin confirms the move.';

-- Records where a read saw a player. Only a change is written: the first time sets the
-- alliance; after that a new place starts the counter, 24 hours there change the
-- alliance, and a move back clears the counter. A read that shows nothing new writes
-- nothing.
create or replace function admin_tools.note_alliance(player_number bigint, seen_state integer, seen_tag text, seen_at timestamptz)
returns void language plpgsql set search_path = public as $$
declare
  kept record;
begin
  insert into game_player_alliances (player_id, state_number, alliance_tag, changed_at)
    values (player_number, seen_state, seen_tag, seen_at)
    on conflict (player_id) do nothing;
  if found then return; end if;
  select * into kept from game_player_alliances where player_id = player_number for update;
  if (kept.state_number, kept.alliance_tag) is not distinct from (seen_state, seen_tag) then
    -- Still (or back) in its alliance: no move.
    update game_player_alliances set moving_state = null, moving_tag = null, moving_since = null
      where player_id = player_number and moving_since is not null;
  elsif kept.moving_since is not null and (kept.moving_state, kept.moving_tag) is not distinct from (seen_state, seen_tag) then
    -- Seen again where it moved to: 24 hours there make it its alliance.
    if seen_at - kept.moving_since >= interval '24 hours' then
      update game_player_alliances set state_number = seen_state, alliance_tag = seen_tag,
        moving_state = null, moving_tag = null, moving_since = null, changed_at = seen_at, confirmed_by = null
        where player_id = player_number;
    end if;
  else
    -- Somewhere new: the counter starts.
    update game_player_alliances set moving_state = seen_state, moving_tag = seen_tag, moving_since = seen_at
      where player_id = player_number;
  end if;
end $$;

-- A player's own read notes where it is, unless the answer came back stale.
create or replace function admin_tools.keep_player(player_number bigint, answer jsonb) returns void
language plpgsql set search_path = public, admin_tools as $$
begin
  insert into game_players (player_id, state_number, alliance_tag, data, read_at, refresh_asked_at)
    values (player_number, (answer->'player'->>'kid')::integer, answer->'player'->'alliance'->>'abbr', answer, now(), null)
    on conflict (player_id) do update set state_number = coalesce(excluded.state_number, game_players.state_number),
      alliance_tag = excluded.alliance_tag, data = excluded.data, read_at = excluded.read_at,
      -- A read that came back stale is asked again, so it is read again an hour later.
      refresh_asked_at = case when (answer->>'fresh')::boolean then null
        else coalesce(game_players.refresh_asked_at, now()) end;
  insert into game_daily_copies (kind, item, day, data)
    values ('player', player_number::text, current_date, answer - 'heroes' - 'chief_gear')
    on conflict (kind, item, day) do update set data = excluded.data;
  if coalesce((answer->>'fresh')::boolean, true) and answer->'player'->>'kid' is not null then
    perform admin_tools.note_alliance(player_number, (answer->'player'->>'kid')::integer,
      answer->'player'->'alliance'->>'abbr', now());
  end if;
end $$;

-- Each roster read notes where every member is, every hour for the main alliances.
create or replace function admin_tools.refresh_alliance(state_to_read integer, alliance_tag text) returns integer
language plpgsql set search_path = public, admin_tools as $$
declare
  answer jsonb;
  listed jsonb;
begin
  answer := admin_tools.api_get('/alliances/' || state_to_read || '/' || alliance_tag || '?include=info,roster&wait=50');
  update game_alliances set data = answer, read_at = now() where state_number = state_to_read and tag = alliance_tag;
  insert into game_daily_copies (kind, item, day, data) values ('alliance', state_to_read || '/' || alliance_tag, current_date, answer)
    on conflict (kind, item, day) do update set data = excluded.data;
  -- Members not yet known are added so the player job reads them. They count as last
  -- read over an hour ago, because they were never read alone.
  insert into game_players (player_id, state_number, alliance_tag, data, read_at, refresh_asked_at)
    select (member->>'chief_id')::bigint, state_to_read, alliance_tag, jsonb_build_object('player', member), now() - interval '61 minutes', now()
    from jsonb_array_elements(answer->'members') member
    where member->>'chief_id' is not null
    on conflict (player_id) do nothing;
  for listed in select value from jsonb_array_elements(answer->'members') loop
    if listed->>'chief_id' is not null then
      perform admin_tools.note_alliance((listed->>'chief_id')::bigint, state_to_read, alliance_tag, now());
    end if;
  end loop;
  return jsonb_array_length(answer->'members');
end $$;

revoke all on all functions in schema admin_tools from public, anon, authenticated;

-- Every player known today starts with where the game shows it now: the newest roster
-- that lists it, otherwise its own read.
insert into public.game_player_alliances (player_id, state_number, alliance_tag, changed_at)
  select distinct on (member->>'chief_id') (member->>'chief_id')::bigint, roster.state_number, roster.tag, roster.read_at
  from public.game_alliances roster, jsonb_array_elements(roster.data->'members') member
  where member->>'chief_id' is not null
    and exists (select 1 from public.game_players player where player.player_id = (member->>'chief_id')::bigint)
  order by member->>'chief_id', roster.read_at desc
  on conflict (player_id) do nothing;
insert into public.game_player_alliances (player_id, state_number, alliance_tag, changed_at)
  select player_id, coalesce((data->'player'->>'kid')::integer, state_number), alliance_tag, read_at
  from public.game_players
  where data->'player'->>'nick_name' is not null
  on conflict (player_id) do nothing;

-- The player confirms their move, or an admin does: the alliance becomes the one the game
-- shows now. Nothing changes when the account is not moving.
create or replace function public.confirm_alliance_move(player_number bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not (public.is_admin()
      or exists (select 1 from game_accounts where owner_id = auth.uid() and in_game_id = player_number::text)) then
    raise exception 'Only the account''s owner and admins can confirm its move.';
  end if;
  update game_player_alliances set state_number = moving_state, alliance_tag = moving_tag,
    moving_state = null, moving_tag = null, moving_since = null, changed_at = now(), confirmed_by = auth.uid()
    where player_id = player_number and moving_since is not null;
end $$;
revoke all on function public.confirm_alliance_move(bigint) from public, anon;
grant execute on function public.confirm_alliance_move(bigint) to authenticated;

-- ---------------------------------------------------------------------------
-- Who reads the game data
-- ---------------------------------------------------------------------------

-- A member of the state is someone with a game account the game shows in our state (the
-- copy on the login is gone), anyone on the exceptions list, and the owner and admins.
create or replace function public.is_state_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and (
    public.is_admin()
    or exists (select 1 from state_member_exceptions where account_id = auth.uid())
    or exists (
      select 1
      from game_players player
      where player.state_number = (select setting_value::text::integer from settings
                                   where setting_key = 'stateNumber' and event_type_id is null limit 1)
        and player.player_id::text in (
          select in_game_id from game_accounts where owner_id = auth.uid() and in_game_id is not null)));
$$;

-- Everyone reads their own accounts' game data, so their own page shows them even while
-- they are not members of the state; members read everyone's.
alter table public.game_player_alliances enable row level security;
grant select on public.game_player_alliances to authenticated;
drop policy if exists "state members read" on public.game_player_alliances;
create policy "state members read" on public.game_player_alliances for select to authenticated
  using (public.is_state_member()
    or player_id::text in (select in_game_id from public.game_accounts where owner_id = auth.uid()));
drop policy if exists "owners read their own" on public.game_players;
create policy "owners read their own" on public.game_players for select to authenticated
  using (player_id::text in (select in_game_id from public.game_accounts where owner_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- The copies go
-- ---------------------------------------------------------------------------

alter table public.game_accounts
  drop column if exists in_game_name,
  drop column if exists alliance_id,
  drop column if exists player_power,
  drop column if exists player_power_updated_at,
  drop column if exists infantry_tier,
  drop column if exists lancer_tier,
  drop column if exists marksmen_tier;

alter table public.accounts
  drop column if exists in_game_name,
  drop column if exists in_game_id,
  drop column if exists alliance_id,
  drop column if exists player_power,
  drop column if exists player_power_updated_at,
  drop column if exists foundry_power,
  drop column if exists foundry_power_updated_at,
  drop column if exists infantry_tier,
  drop column if exists lancer_tier,
  drop column if exists marksmen_tier;

drop table if exists public.account_alt_accounts;

notify pgrst, 'reload schema';
