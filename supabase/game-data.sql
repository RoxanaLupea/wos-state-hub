-- Game data from the Whiteout Stats API: the state, its alliances' rosters and its
-- players, as the game shows them. Only the database's admin side writes these tables
-- (the refreshes and the first pull); the site only reads them.
--
-- Who reads them: signed-in players with a game account in our state (the stateNumber
-- setting), players on the "counts as a member" list, and the owner and admins. For now
-- every one of them sees everything; limits per alliance come later.
--
-- Run after schema.sql. Safe to run again.

-- ---------------------------------------------------------------------------
-- The latest answer for each state, alliance and player
-- ---------------------------------------------------------------------------

create table if not exists public.game_states (
  state_number integer primary key,
  data jsonb not null,            -- the whole answer, leaderboards included
  read_at timestamptz not null default now()
);

create table if not exists public.game_alliances (
  state_number integer not null,
  tag text not null,              -- the game's tag, case as in the game (DVL and dvl differ)
  alliance_id text references public.alliances (id) on delete set null,  -- the site's alliance, when it is one of ours
  data jsonb not null,            -- alliance info and roster
  read_at timestamptz not null default now(),
  primary key (state_number, tag)
);

create table if not exists public.game_players (
  player_id bigint primary key,   -- the in-game ID
  state_number integer,
  alliance_tag text,
  data jsonb not null,            -- base data, ranks and troops
  read_at timestamptz not null default now()
);
create index if not exists game_players_by_state on public.game_players (state_number);

-- One copy a day of each, kept for 30 days while the pages are designed.
create table if not exists public.game_daily_copies (
  kind text not null check (kind in ('state', 'alliance', 'player')),
  item text not null,             -- state number, state/tag, or player ID
  day date not null,
  data jsonb not null,
  primary key (kind, item, day)
);

-- ---------------------------------------------------------------------------
-- Players who count as members of our state while their accounts are elsewhere
-- (Tif now; players transferring in later). Admins keep this list.
-- ---------------------------------------------------------------------------

create table if not exists public.state_member_exceptions (
  account_id uuid primary key references public.accounts (id) on delete cascade,
  added_by uuid default auth.uid(),
  added_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Who counts as a member of our state
-- ---------------------------------------------------------------------------

-- True for the owner and admins, for anyone on the exceptions list, and for anyone
-- with a game account (main, alt or farm, or the one kept on the login) that the game
-- shows in our state.
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
          select in_game_id from game_accounts where owner_id = auth.uid() and in_game_id is not null
          union
          select in_game_id from accounts where id = auth.uid() and in_game_id is not null)));
$$;

-- ---------------------------------------------------------------------------
-- Access
-- ---------------------------------------------------------------------------

alter table public.game_states enable row level security;
alter table public.game_alliances enable row level security;
alter table public.game_players enable row level security;
alter table public.game_daily_copies enable row level security;
alter table public.state_member_exceptions enable row level security;

-- Visitors who are not signed in get nothing; signed-in people only read, and only
-- through the rules below. Nobody writes from the site except admins on the list.
revoke all on public.game_states, public.game_alliances, public.game_players,
  public.game_daily_copies, public.state_member_exceptions from anon;
revoke all on public.game_states, public.game_alliances, public.game_players,
  public.game_daily_copies from authenticated;
grant select on public.game_states, public.game_alliances, public.game_players,
  public.game_daily_copies to authenticated;
revoke all on public.state_member_exceptions from authenticated;
grant select, insert, delete on public.state_member_exceptions to authenticated;

drop policy if exists "state members read" on public.game_states;
create policy "state members read" on public.game_states for select to authenticated using (public.is_state_member());
drop policy if exists "state members read" on public.game_alliances;
create policy "state members read" on public.game_alliances for select to authenticated using (public.is_state_member());
drop policy if exists "state members read" on public.game_players;
create policy "state members read" on public.game_players for select to authenticated using (public.is_state_member());
drop policy if exists "state members read" on public.game_daily_copies;
create policy "state members read" on public.game_daily_copies for select to authenticated using (public.is_state_member());

-- The list: admins see and change it; each person sees their own place on it.
drop policy if exists "admins and self read" on public.state_member_exceptions;
create policy "admins and self read" on public.state_member_exceptions for select to authenticated
  using (public.is_admin() or account_id = auth.uid());
drop policy if exists "admins add" on public.state_member_exceptions;
create policy "admins add" on public.state_member_exceptions for insert to authenticated with check (public.is_admin());
drop policy if exists "admins remove" on public.state_member_exceptions;
create policy "admins remove" on public.state_member_exceptions for delete to authenticated using (public.is_admin());

-- Tif counts as a 1458 member while she is in another state (added 23 Nov by Roxanne):
-- insert into public.state_member_exceptions (account_id, added_by)
--   select id, <Roxanne's account id> from accounts where in_game_id = '135786444';

-- Reads one batch of 50 members of a state's stored rosters from the Whiteout Stats API
-- and keeps each player's latest answer and today's copy. Returns how many came back.
-- Run from the database admin side with the key passed in; the key is never stored here.
-- The free plan allows 60 IDs a minute, so wait a minute between batches.
create or replace function admin_tools.pull_player_batch(api_key text, state_to_pull integer, batch_number integer)
returns integer language plpgsql set search_path = public, admin_tools as $function$
declare
  id_list text;
  answer record;
  one_player jsonb;
  player_number bigint;
  stored integer := 0;
begin
  perform admin_tools.http_set_curlopt('CURLOPT_TIMEOUT_MS', '55000');
  select string_agg(chief_id, ',') into id_list from (
    select distinct member->>'chief_id' as chief_id
    from game_alliances, jsonb_array_elements(data->'members') member
    where state_number = state_to_pull order by 1 offset batch_number * 50 limit 50) batch;
  if id_list is null then return 0; end if;
  select status, content into answer from admin_tools.http(('GET',
    'https://api.whiteoutstats.com/v1/players?ids=' || id_list || '&include=base,ranks,troops',
    array[admin_tools.http_header('X-Api-Key', api_key)], null, null)::admin_tools.http_request);
  if answer.status <> 200 then
    raise exception 'batch % answered %: %', batch_number, answer.status, left(answer.content, 300);
  end if;
  for one_player in select * from jsonb_array_elements(answer.content::jsonb->'players') loop
    player_number := coalesce(one_player->>'chief_id', one_player->'player'->>'chief_id')::bigint;
    insert into game_players (player_id, state_number, alliance_tag, data, read_at)
      values (player_number, (one_player->'player'->>'kid')::integer, one_player->'player'->'alliance'->>'abbr', one_player, now())
      on conflict (player_id) do update set state_number = excluded.state_number, alliance_tag = excluded.alliance_tag,
        data = excluded.data, read_at = excluded.read_at;
    insert into game_daily_copies (kind, item, day, data) values ('player', player_number::text, current_date, one_player)
      on conflict (kind, item, day) do update set data = excluded.data;
    stored := stored + 1;
  end loop;
  return stored;
end $function$;
revoke all on function admin_tools.pull_player_batch(text, integer, integer) from public, anon, authenticated;
