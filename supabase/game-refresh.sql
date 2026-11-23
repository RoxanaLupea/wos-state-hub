-- Keeps the game data (supabase/game-data.sql) up to date from the Whiteout Stats API.
-- Run once after game-data.sql; safe to run again.
--
-- The API key is kept in the database's Vault under the name whiteout_stats_api_key, never
-- in this file (the repo is public). Add it once from the SQL editor:
--   select vault.create_secret('<key>', 'whiteout_stats_api_key', 'Whiteout Stats API key');
--
-- What runs, from decisions in notes/design-decisions.md ("Player data from the game"):
--   every minute   players: first those someone asked to refresh, then any not read in
--                  12 hours (so every known account twice a day)
--   every hour     the state, and the rosters of the main alliances still in the state
--   twice a day    the academies' rosters
--   every day      daily copies older than 30 days are removed
-- The free key allows 60 requests a minute and 5,000 a day. A normal day uses about 1,200.

create extension if not exists pg_cron;

alter table public.game_players add column if not exists refresh_asked_at timestamptz;
comment on column public.game_players.refresh_asked_at is
  'Set when a player, R4 or admin asks for a fresh read; the minute job reads these first.';

-- The key, read from the Vault.
create or replace function admin_tools.api_key() returns text
language sql stable security definer set search_path = public as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'whiteout_stats_api_key' limit 1;
$$;

-- One GET to the API. Returns the answer, or raises the status and the start of the message.
create or replace function admin_tools.api_get(path text, timeout_ms integer default 58000) returns jsonb
language plpgsql security definer set search_path = public, admin_tools as $$
declare
  answer record;
begin
  perform admin_tools.http_set_curlopt('CURLOPT_TIMEOUT_MS', timeout_ms::text);
  select status, content into answer from admin_tools.http(('GET', 'https://api.whiteoutstats.com/v1' || path,
    array[admin_tools.http_header('X-Api-Key', admin_tools.api_key())], null, null)::admin_tools.http_request);
  if answer.status <> 200 then
    raise exception 'Whiteout Stats % answered %: %', path, answer.status, left(answer.content, 300);
  end if;
  return answer.content::jsonb;
end $$;

-- The state number this site is for.
create or replace function admin_tools.home_state() returns integer
language sql stable set search_path = public as $$
  select setting_value::text::integer from settings where setting_key = 'stateNumber' and event_type_id is null limit 1;
$$;

-- Keeps one player's answer: the latest in full, and today's copy without heroes and chief gear.
create or replace function admin_tools.keep_player(player_number bigint, answer jsonb) returns void
language plpgsql set search_path = public as $$
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
end $$;

-- Reads one alliance's roster, keeps it, and adds members not yet known so the player job
-- reads them. They count as last read over an hour ago, because they were never read alone.
create or replace function admin_tools.refresh_alliance(state_to_read integer, alliance_tag text) returns integer
language plpgsql set search_path = public, admin_tools as $$
declare
  answer jsonb;
begin
  answer := admin_tools.api_get('/alliances/' || state_to_read || '/' || alliance_tag || '?include=info,roster&wait=50');
  update game_alliances set data = answer, read_at = now() where state_number = state_to_read and tag = alliance_tag;
  insert into game_daily_copies (kind, item, day, data) values ('alliance', state_to_read || '/' || alliance_tag, current_date, answer)
    on conflict (kind, item, day) do update set data = excluded.data;
  insert into game_players (player_id, state_number, alliance_tag, data, read_at, refresh_asked_at)
    select (member->>'chief_id')::bigint, state_to_read, alliance_tag, jsonb_build_object('player', member), now() - interval '61 minutes', now()
    from jsonb_array_elements(answer->'members') member
    where member->>'chief_id' is not null
    on conflict (player_id) do nothing;
  return jsonb_array_length(answer->'members');
end $$;

-- Reads the rosters of the home state's main alliances (hourly) or academies (twice a day).
create or replace function admin_tools.refresh_rosters(academies boolean) returns void
language plpgsql set search_path = public, admin_tools as $$
declare
  roster record;
begin
  for roster in select game.state_number, game.tag from game_alliances game join alliances site on site.id = game.alliance_id
      where game.state_number = admin_tools.home_state() and site.left_on is null
        and (site.main_alliance_id is not null) = academies loop
    begin
      perform admin_tools.refresh_alliance(roster.state_number, roster.tag);
    exception when others then
      raise warning 'roster %/% not read: %', roster.state_number, roster.tag, sqlerrm;
    end;
  end loop;
end $$;

-- Reads a state's leaderboards (hourly for the home state; the SvS opponent later).
create or replace function admin_tools.refresh_state(state_to_read integer) returns void
language plpgsql set search_path = public, admin_tools as $$
declare
  answer jsonb;
begin
  answer := admin_tools.api_get('/states/' || state_to_read || '?include=boards&wait=50');
  insert into game_states (state_number, data, read_at) values (state_to_read, answer, now())
    on conflict (state_number) do update set data = excluded.data, read_at = excluded.read_at;
  insert into game_daily_copies (kind, item, day, data) values ('state', state_to_read::text, current_date, answer)
    on conflict (kind, item, day) do update set data = excluded.data;
end $$;

-- The minute job: reads players one at a time, those asked for first, then any not read in
-- 12 hours. No player is read again within an hour of its last read. Players count when
-- they are in the home state, in one of its stored rosters, or added by someone on the site.
-- Stops after 45 seconds and never runs twice at once, and sleeps a second between players
-- to stay under 60 requests a minute.
create or replace function admin_tools.refresh_players() returns integer
language plpgsql set search_path = public, admin_tools as $$
declare
  started timestamptz := clock_timestamp();
  player_number bigint;
  done integer := 0;
begin
  if not pg_try_advisory_lock(hashtext('refresh_players')) then return 0; end if;
  for player_number in
      select player.player_id from game_players player
      where player.read_at < now() - interval '1 hour'
        and (player.refresh_asked_at is not null or player.read_at < now() - interval '12 hours')
        and (player.state_number = admin_tools.home_state()
          or player.player_id::text in (select in_game_id from game_accounts where in_game_id is not null)
          or player.player_id::text in (select member->>'chief_id' from game_alliances, jsonb_array_elements(data->'members') member))
      order by player.refresh_asked_at nulls last, player.read_at
      limit 40 loop
    exit when clock_timestamp() - started > interval '45 seconds';
    begin
      perform admin_tools.keep_player(player_number,
        admin_tools.api_get('/players/' || player_number || '?include=base,ranks,troops,heroes,chief_gear&wait=15', 20000));
      done := done + 1;
    exception when others then
      raise warning 'player % not read: %', player_number, sqlerrm;
      -- Over the API's limit: stop here and carry on next minute.
      exit when sqlerrm like '% answered 429:%';
      -- Any other failure moves it back in the line, so one broken ID does not block the others.
      update game_players set read_at = now(), refresh_asked_at = null where player_id = player_number;
    end;
    perform pg_sleep(1.05);
  end loop;
  perform pg_advisory_unlock(hashtext('refresh_players'));
  return done;
end $$;

revoke all on all functions in schema admin_tools from public, anon, authenticated;

-- For the site --------------------------------------------------------------------------

-- Asks for a fresh read of one account. Allowed for the account's owner, the R4s of its
-- alliance and admins, once the last read is an hour old (the API reads the game at most
-- once an hour). Returns when the account was last read; the page shows that time.
create or replace function public.ask_game_refresh(player_number bigint) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare
  player record;
  site_alliance text;
begin
  select * into player from game_players where player_id = player_number;
  if not found then raise exception 'This account has not been read yet.'; end if;
  select alliance_id into site_alliance from game_alliances
    where state_number = player.state_number and tag = player.alliance_tag;
  if not (public.is_admin()
      or exists (select 1 from game_accounts where owner_id = auth.uid() and in_game_id = player_number::text)
      or (site_alliance is not null and public.leads_alliance(site_alliance))) then
    raise exception 'Only the account''s owner, its R4s and admins can refresh it.';
  end if;
  if player.read_at > now() - interval '1 hour' then return player.read_at; end if;
  update game_players set refresh_asked_at = coalesce(refresh_asked_at, now()) where player_id = player_number;
  return player.read_at;
end $$;

-- Shows the name and picture of a typed in-game ID, so the player sees it is the right
-- account before adding it. Any signed-in person may look up an ID. Answers from the stored
-- read when there is one, otherwise asks the API without waiting; either way the account is
-- then read in full by the minute job.
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
    insert into game_players (player_id, state_number, alliance_tag, data, read_at, refresh_asked_at)
      values (player_number, (answer->'player'->>'kid')::integer, answer->'player'->'alliance'->>'abbr', answer, now(), now())
      on conflict (player_id) do update set data = excluded.data, refresh_asked_at = now();
    stored := answer->'player';
  end if;
  return jsonb_build_object('name', stored->>'nick_name', 'avatar', stored->>'avatar_url', 'power', (stored->>'power')::bigint,
    'state', (stored->>'kid')::integer, 'alliance', stored->'alliance'->>'abbr', 'furnace', (stored->>'furnace_level')::integer);
end $$;

revoke all on function public.ask_game_refresh(bigint) from public, anon;
grant execute on function public.ask_game_refresh(bigint) to authenticated;
revoke all on function public.look_up_game_account(bigint) from public, anon;
grant execute on function public.look_up_game_account(bigint) to authenticated;

-- Accounts from the first pull that came back without heroes and chief gear are read first.
update public.game_players set refresh_asked_at = now() where not data ? 'heroes' and refresh_asked_at is null;

-- Schedules (times in UTC; the game's day starts at 00:00 UTC) ------------------------------

select cron.schedule('game-players', '* * * * *', 'select admin_tools.refresh_players()');
select cron.schedule('game-state', '5 * * * *', 'select admin_tools.refresh_state(admin_tools.home_state())');
select cron.schedule('game-main-rosters', '10 * * * *', 'select admin_tools.refresh_rosters(false)');
select cron.schedule('game-academy-rosters', '20 4,16 * * *', 'select admin_tools.refresh_rosters(true)');
select cron.schedule('game-copies-cleanup', '30 3 * * *',
  $$delete from public.game_daily_copies where day < current_date - 30$$);
