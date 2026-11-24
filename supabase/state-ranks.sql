-- Every account's ranks on its own state's boards (owner, 24 Nov). Our state's boards are
-- read every hour; the boards of every other state where a site account plays are read
-- once a day, with no daily copies kept, and a player's own refresh of an account in such
-- a state reads its boards straight away and counts as that day's read. The page asks
-- only for its accounts' rows, rather than downloading whole boards (about 620 KB a
-- state). Run after game-refresh.sql and fresh-reads.sql. Safe to run again.

alter table public.game_states add column if not exists refresh_asked_at timestamptz;
comment on column public.game_states.refresh_asked_at is
  'Set when a player refreshed an account in this state (another state than ours): its boards are read within the minute.';

-- One state's boards. Only our own state keeps a copy a day.
create or replace function admin_tools.refresh_state(state_to_read integer)
returns void language plpgsql set search_path = public, admin_tools as $$
declare
  answer jsonb;
begin
  answer := admin_tools.api_get('/states/' || state_to_read || '?include=boards&wait=50');
  insert into game_states (state_number, data, read_at, refresh_asked_at) values (state_to_read, answer, now(), null)
    on conflict (state_number) do update set data = excluded.data, read_at = excluded.read_at, refresh_asked_at = null;
  if state_to_read = admin_tools.home_state() then
    insert into game_daily_copies (kind, item, day, data) values ('state', state_to_read::text, current_date, answer)
      on conflict (kind, item, day) do update set data = excluded.data;
  end if;
end $$;

-- Every minute: the other states that are due, those a player refreshed an account in,
-- and those not read for a day (a state a site account has just moved to is read too).
create or replace function admin_tools.refresh_other_states() returns integer
language plpgsql set search_path = public, admin_tools as $$
declare
  state_to_read integer;
  done integer := 0;
begin
  if not pg_try_advisory_lock(hashtext('refresh_other_states')) then return 0; end if;
  for state_to_read in
      select account_state from (
        select distinct player.state_number as account_state from game_players player
          where player.state_number is not null and player.state_number <> admin_tools.home_state()
            and player.player_id::text in (select in_game_id from game_accounts where in_game_id is not null)) accounts
        left join game_states kept on kept.state_number = accounts.account_state
        where kept.state_number is null or kept.refresh_asked_at is not null or kept.read_at < now() - interval '24 hours'
        order by kept.refresh_asked_at nulls last, kept.read_at nulls first loop
    begin
      perform admin_tools.refresh_state(state_to_read);
      done := done + 1;
    exception when others then
      raise warning 'state % not read: %', state_to_read, sqlerrm;
      update game_states set refresh_asked_at = null where state_number = state_to_read;
    end;
  end loop;
  perform pg_advisory_unlock(hashtext('refresh_other_states'));
  return done;
end $$;

select cron.schedule('game-other-states', '* * * * *', 'select admin_tools.refresh_other_states()');

-- A player's answer, kept (as fresh-reads.sql has it), and a fresh read that someone asked
-- for of an account in another state asks for that state's boards too.
create or replace function admin_tools.keep_player(player_number bigint, answer jsonb)
returns void language plpgsql set search_path = public, admin_tools as $$
declare
  is_fresh boolean := coalesce((answer->>'fresh')::boolean, true);
  game_time timestamptz := coalesce(admin_tools.game_read_time(answer), now());
  seen_state integer := (answer->'player'->>'kid')::integer;
  was_asked boolean;
begin
  select refresh_asked_at is not null into was_asked from game_players where player_id = player_number;
  insert into game_players (player_id, state_number, alliance_tag, data, read_at, game_read_at, stale_since, refresh_asked_at)
    values (player_number, seen_state, answer->'player'->'alliance'->>'abbr', answer, now(),
      game_time, admin_tools.stale_start(is_fresh, null), case when is_fresh then null else now() end)
    on conflict (player_id) do update set state_number = coalesce(excluded.state_number, game_players.state_number),
      alliance_tag = excluded.alliance_tag, data = excluded.data, read_at = excluded.read_at,
      game_read_at = excluded.game_read_at,
      stale_since = admin_tools.stale_start(is_fresh, game_players.stale_since),
      -- A not-fresh answer stays asked, so it is asked again until a fresh copy arrives.
      refresh_asked_at = case when is_fresh then null else coalesce(game_players.refresh_asked_at, now()) end;
  insert into game_daily_copies (kind, item, day, data)
    values ('player', player_number::text, current_date, answer - 'heroes' - 'chief_gear')
    on conflict (kind, item, day) do update set data = excluded.data;
  if is_fresh and seen_state is not null then
    perform admin_tools.note_alliance(player_number, seen_state, answer->'player'->'alliance'->>'abbr', now());
    if coalesce(was_asked, false) and seen_state <> admin_tools.home_state()
        and player_number::text in (select in_game_id from game_accounts where in_game_id is not null) then
      insert into game_states (state_number, data, read_at, refresh_asked_at)
        values (seen_state, '{}'::jsonb, now() - interval '25 hours', now())
        on conflict (state_number) do update set refresh_asked_at = now();
    end if;
  end if;
end $$;

-- The given players' places on the boards of the states read: one row per board they are
-- on. State members see anyone's; others only their own accounts'.
create or replace function public.game_state_ranks(player_ids bigint[])
returns table (player_id bigint, board text, score numeric, label text, rank integer)
language sql stable security definer set search_path = public as $$
  select (entry->>'chief_id')::bigint, one_board->>'name', (entry->>'score')::numeric, entry->>'score_label', (entry->>'rank')::integer
  from game_states, jsonb_array_elements(data->'boards') one_board, jsonb_array_elements(one_board->'rows') entry
  where entry->>'chief_id' ~ '^[0-9]+$' and (entry->>'chief_id')::bigint = any(player_ids)
    and (public.is_state_member()
      or entry->>'chief_id' in (select in_game_id from game_accounts where owner_id = auth.uid()))
$$;

revoke all on function public.game_state_ranks(bigint[]) from public, anon;
grant execute on function public.game_state_ranks(bigint[]) to authenticated;
