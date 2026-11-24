-- Reads that come back not fresh are asked again until a fresh copy arrives (owner, 24 Nov).
-- Run after game-refresh.sql and accounts-from-game.sql, and again whenever either of
-- them is run again, since they define the same functions. Safe to run again.
--
-- The once-an-hour rule is there so the site does not ask for an account it already has
-- a fresh copy of: asking again then gives nothing new. When the API answers with an old
-- copy because it is still reading the game ("fresh": false, "refresh": "running"), the
-- site asks again the next minute and gets the copy that read makes. It keeps doing so
-- for 10 minutes, then goes back to asking once an hour until a fresh copy arrives.
--
-- Before this, a not-fresh answer was kept as if it were new and the account was asked
-- again only an hour later, when the API's copy was old again: the API started another
-- read, answered with the old copy again, and "Updating" never ended.
--
-- Two times are kept for every player and roster:
--   read_at       when the site last asked the API (what spaces the requests)
--   game_read_at  when the game itself was read (the API's cached_at): what "Updated"
--                 shows and what Refresh goes by
-- stale_since is when the current run of not-fresh answers began; null once fresh.

alter table public.game_players add column if not exists game_read_at timestamptz;
alter table public.game_players add column if not exists stale_since timestamptz;
alter table public.game_alliances add column if not exists game_read_at timestamptz;
alter table public.game_alliances add column if not exists stale_since timestamptz;

comment on column public.game_players.read_at is 'When the site last asked the API for this player.';
comment on column public.game_players.game_read_at is 'When the game was read for the copy kept (the API''s cached_at).';
comment on column public.game_players.stale_since is 'When the current run of not-fresh answers began; null once a fresh copy is kept.';
comment on column public.game_alliances.read_at is 'When the site last asked the API for this roster.';
comment on column public.game_alliances.game_read_at is 'When the game was read for the roster kept (the API''s cached_at).';
comment on column public.game_alliances.stale_since is 'When the current run of not-fresh answers began; null once a fresh copy is kept.';

-- When the game was read for an answer: its cached_at, else now less its age, else now.
create or replace function admin_tools.game_read_time(answer jsonb) returns timestamptz
language sql stable as $$
  select case
    when answer->>'cached_at' ~ '^[0-9.]+$' then to_timestamp((answer->>'cached_at')::double precision)
    when answer->>'age_seconds' ~ '^[0-9.]+$' then now() - make_interval(secs => (answer->>'age_seconds')::double precision)
  end
$$;

-- When a not-fresh run began: kept while it is under an hour old (the 10 minutes of
-- quick asks, then the hourly one), started again after that.
create or replace function admin_tools.stale_start(fresh boolean, known timestamptz) returns timestamptz
language sql stable as $$
  select case when fresh then null
    when known is not null and known > now() - interval '1 hour' then known
    else now() end
$$;

-- Rows kept before this: the time from their answer. A row with no answer of its own yet
-- (added from a roster) stays empty, and the site falls back to read_at for it.
update public.game_players set game_read_at = admin_tools.game_read_time(data)
  where game_read_at is null and data ? 'cached_at';
update public.game_alliances set game_read_at = admin_tools.game_read_time(data)
  where game_read_at is null and data ? 'cached_at';

-- ---------------------------------------------------------------------------
-- A player's answer, kept

create or replace function admin_tools.keep_player(player_number bigint, answer jsonb)
returns void language plpgsql set search_path = public, admin_tools as $$
declare
  is_fresh boolean := coalesce((answer->>'fresh')::boolean, true);
  game_time timestamptz := coalesce(admin_tools.game_read_time(answer), now());
begin
  insert into game_players (player_id, state_number, alliance_tag, data, read_at, game_read_at, stale_since, refresh_asked_at)
    values (player_number, (answer->'player'->>'kid')::integer, answer->'player'->'alliance'->>'abbr', answer, now(),
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
  if is_fresh and answer->'player'->>'kid' is not null then
    perform admin_tools.note_alliance(player_number, (answer->'player'->>'kid')::integer,
      answer->'player'->'alliance'->>'abbr', now());
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- The minute job: reads players one at a time. First the quick asks (a read running at
-- the API, under 10 minutes), then those someone asked to refresh, then any not read in
-- 12 hours.

create or replace function admin_tools.refresh_players() returns integer
language plpgsql set search_path = public, admin_tools as $$
declare
  started timestamptz := clock_timestamp();
  player_number bigint;
  done integer := 0;
begin
  if not pg_try_advisory_lock(hashtext('refresh_players')) then return 0; end if;
  -- An account added on the site that no roster lists (a player in no alliance, or in one
  -- whose roster is not read) has no row yet: it is added here, so it is read like the rest.
  insert into game_players (player_id, state_number, alliance_tag, data, read_at, refresh_asked_at)
    select distinct in_game_id::bigint, null::integer, null, '{}'::jsonb, now() - interval '61 minutes', now()
    from game_accounts where in_game_id ~ '^[0-9]+$'
    on conflict (player_id) do nothing;
  for player_number in
      select player.player_id from game_players player
      where (
          -- The API is reading the game: its copy is ready within a minute or two.
          (player.stale_since > now() - interval '10 minutes' and player.read_at < now() - interval '50 seconds')
          or (player.read_at < now() - interval '1 hour'
            and (player.refresh_asked_at is not null or player.read_at < now() - interval '12 hours')))
        and (player.state_number = admin_tools.home_state()
          or player.player_id::text in (select in_game_id from game_accounts where in_game_id is not null)
          or player.player_id::text in (select member->>'chief_id' from game_alliances, jsonb_array_elements(data->'members') member))
      order by (player.stale_since > now() - interval '10 minutes') desc nulls last,
        player.refresh_asked_at nulls last, player.read_at
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
      update game_players set read_at = now(), stale_since = null, refresh_asked_at = null where player_id = player_number;
    end;
    perform pg_sleep(1.05);
  end loop;
  perform pg_advisory_unlock(hashtext('refresh_players'));
  return done;
end $$;

-- ---------------------------------------------------------------------------
-- One alliance's roster, kept with when the game was read for it

create or replace function admin_tools.refresh_alliance(state_to_read integer, alliance_tag text)
returns integer language plpgsql set search_path = public, admin_tools as $$
declare
  answer jsonb;
  listed jsonb;
  is_fresh boolean;
begin
  answer := admin_tools.api_get('/alliances/' || state_to_read || '/' || alliance_tag || '?include=info,roster&wait=50');
  is_fresh := coalesce((answer->>'fresh')::boolean, true);
  update game_alliances set data = answer, read_at = now(),
      game_read_at = coalesce(admin_tools.game_read_time(answer), now()),
      stale_since = admin_tools.stale_start(is_fresh, stale_since)
    where state_number = state_to_read and tag = alliance_tag;
  insert into game_daily_copies (kind, item, day, data) values ('alliance', state_to_read || '/' || alliance_tag, current_date, answer)
    on conflict (kind, item, day) do update set data = excluded.data;
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

-- Every minute: a roster that came back not fresh in the last 10 minutes is asked again,
-- for the copy the API is making.
create or replace function admin_tools.retry_stale_rosters() returns integer
language plpgsql set search_path = public, admin_tools as $$
declare
  roster record;
  done integer := 0;
begin
  if not pg_try_advisory_lock(hashtext('retry_stale_rosters')) then return 0; end if;
  for roster in select game.state_number, game.tag from game_alliances game join alliances site on site.id = game.alliance_id
      where game.state_number = admin_tools.home_state() and site.left_on is null
        and game.stale_since > now() - interval '10 minutes' and game.read_at < now() - interval '50 seconds'
      order by game.read_at loop
    begin
      perform admin_tools.refresh_alliance(roster.state_number, roster.tag);
      done := done + 1;
    exception when others then
      raise warning 'roster %/% not read: %', roster.state_number, roster.tag, sqlerrm;
    end;
  end loop;
  perform pg_advisory_unlock(hashtext('retry_stale_rosters'));
  return done;
end $$;

select cron.schedule('game-roster-retries', '* * * * *', 'select admin_tools.retry_stale_rosters()');

-- ---------------------------------------------------------------------------
-- Refresh from the site: pointless while the copy kept is under an hour old.

create or replace function public.ask_game_refresh(player_number bigint) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare
  player record;
  site_alliance text;
begin
  select * into player from game_players where player_id = player_number;
  -- Not read yet: the minute job reads every account added on the site, so it is on its way.
  if not found then return null; end if;
  select alliance_id into site_alliance from game_alliances
    where state_number = player.state_number and tag = player.alliance_tag;
  if not (public.is_admin()
      or exists (select 1 from game_accounts where owner_id = auth.uid() and in_game_id = player_number::text)
      or (site_alliance is not null and public.leads_alliance(site_alliance))) then
    raise exception 'Only the account''s owner, its R4s and admins can refresh it.';
  end if;
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

-- Accounts stuck before this (asked, answered not fresh, waiting an hour): asked again now.
update public.game_players set stale_since = now(), read_at = least(read_at, now() - interval '61 minutes')
  where refresh_asked_at is not null and (data->>'fresh') = 'false';
