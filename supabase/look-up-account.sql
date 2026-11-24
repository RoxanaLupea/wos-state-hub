-- An account added on the site is read in full at the next minute (owner, 24 Nov). The
-- quick look-up shown while the ID is typed keeps only the game's base data, and it was
-- kept as a full read made now: the account then waited an hour for its troops and heroes,
-- showing "Updating" and an "Updated" time that was the look-up's, not the game's.
-- Run after game-refresh.sql and fresh-reads.sql. Safe to run again.
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
    'state', (stored->>'kid')::integer, 'alliance', stored->'alliance'->>'abbr', 'furnace', (stored->>'furnace_level')::integer);
end $$;

revoke all on function public.look_up_game_account(bigint) from public, anon;
grant execute on function public.look_up_game_account(bigint) to authenticated;

-- Accounts added before this and still waiting on their first full read: read now.
update public.game_players set read_at = now() - interval '61 minutes',
    game_read_at = coalesce(game_read_at, admin_tools.game_read_time(data))
  where refresh_asked_at is not null and not data ? 'troops_checked_at' and data ? 'player'
    and read_at > now() - interval '1 hour';
