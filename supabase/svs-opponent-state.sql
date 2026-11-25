-- The SvS opponent's state is read like a state where a site account plays (Roxanne,
-- 25 Nov): the opponent is recorded in Matchmaking (the line with "vs"), and as soon
-- as it is set, that state's data is asked for. Read within the minute, then once a day,
-- from Matchmaking until Field Triage ends (the SvS row is dated on its Battle day).
-- Replaces refresh_other_states from state-ranks.sql. Safe to run again.

create or replace function admin_tools.refresh_other_states() returns integer
language plpgsql set search_path = public, admin_tools as $$
declare
  state_to_read integer;
  done integer := 0;
begin
  if not pg_try_advisory_lock(hashtext('refresh_other_states')) then return 0; end if;
  for state_to_read in
      select account_state from (
        select player.state_number as account_state from game_players player
          where player.state_number is not null and player.state_number <> admin_tools.home_state()
            and player.player_id::text in (select in_game_id from game_accounts where in_game_id is not null)
        union
        select opponent.opponent_state from result_opponents opponent
          join results result on result.id = opponent.result_id
          where result.event_type_id = 'svs' and opponent.opponent_state is not null
            and opponent.opponent_state <> admin_tools.home_state()
            and result.event_date between current_date - 3 and current_date + 10) wanted
        left join game_states kept on kept.state_number = wanted.account_state
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
