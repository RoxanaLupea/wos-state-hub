-- The alliances' rosters as the pages use them (owner, 24 Nov): only each member's ID,
-- name, picture, power and rank, rather than everything the game sends (186 KB for the
-- seven rosters). Kept as a member list under "members", as the page reads it.
-- Run after game-data.sql and fresh-reads.sql. Safe to run again.
create or replace function public.game_rosters()
returns table (state_number integer, tag text, read_at timestamptz, game_read_at timestamptz, data jsonb)
language sql stable security invoker set search_path = public as $$
  select game.state_number, game.tag, game.read_at, game.game_read_at,
    jsonb_build_object('members', coalesce((
      select jsonb_agg(jsonb_build_object('chief_id', member->'chief_id', 'nick_name', member->'nick_name',
        'avatar_url', member->'avatar_url', 'power', member->'power', 'alliance_rank_label', member->'alliance_rank_label'))
      from jsonb_array_elements(coalesce(game.data->'members', '[]'::jsonb)) member), '[]'::jsonb))
  from game_alliances game
$$;
grant execute on function public.game_rosters() to authenticated;
