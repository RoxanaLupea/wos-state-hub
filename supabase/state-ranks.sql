-- Every account's ranks on its own state's boards (owner, 24 Nov). The boards of each state
-- where a site account plays are read every hour, not only our own state's, so a player
-- in another state (before a transfer) sees all their ranks too. The page asks only for
-- its accounts' rows, rather than downloading whole boards (about 620 KB a state).
-- Run after game-refresh.sql. Safe to run again.

-- Our state and every state a site account is in.
create or replace function admin_tools.refresh_states() returns void
language plpgsql set search_path = public, admin_tools as $$
declare
  state_to_read integer;
begin
  for state_to_read in
      select admin_tools.home_state()
      union
      select distinct player.state_number from game_players player
        where player.state_number is not null
          and player.player_id::text in (select in_game_id from game_accounts where in_game_id is not null) loop
    begin
      perform admin_tools.refresh_state(state_to_read);
    exception when others then
      raise warning 'state % not read: %', state_to_read, sqlerrm;
    end;
  end loop;
end $$;

select cron.schedule('game-state', '5 * * * *', 'select admin_tools.refresh_states()');

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
