-- Keeps each site account's name, power and alliance as the game has them. Players no
-- longer type these: they come from the game data (game-data.sql, game-refresh.sql).
-- The rest of the site still reads them from game_accounts, so they are copied there
-- whenever the game data of that in-game ID is read, and when an account is added.
-- The alliance is one of ours only when the player is in our state.
-- Run after game-refresh.sql. Safe to run again.

create or replace function admin_tools.site_alliance_of(game_state integer, game_tag text) returns text
language sql stable set search_path = public as $$
  select site.id from alliances site
  where game_state = admin_tools.home_state() and site.tag = game_tag and site.left_on is null
  order by site.main_alliance_id nulls first limit 1;
$$;

-- From the game data to the site accounts of that ID.
create or replace function admin_tools.copy_game_to_accounts() returns trigger
language plpgsql security definer set search_path = public, admin_tools as $$
begin
  if new.data->'player'->>'nick_name' is null then return new; end if;
  update game_accounts set
    in_game_name = new.data->'player'->>'nick_name',
    player_power = coalesce((new.data->'player'->>'power')::numeric, player_power),
    player_power_updated_at = case when new.data->'player'->>'power' is not null then new.read_at else player_power_updated_at end,
    alliance_id = admin_tools.site_alliance_of(new.state_number, new.alliance_tag),
    updated_at = now()
  where in_game_id = new.player_id::text;
  return new;
end $$;

drop trigger if exists copy_game_to_accounts on public.game_players;
create trigger copy_game_to_accounts after insert or update of data on public.game_players
  for each row execute function admin_tools.copy_game_to_accounts();

-- A new site account takes what the game already says about its ID.
create or replace function admin_tools.fill_account_from_game() returns trigger
language plpgsql security definer set search_path = public, admin_tools as $$
declare
  player record;
begin
  select * into player from game_players where player_id::text = new.in_game_id;
  if found and player.data->'player'->>'nick_name' is not null then
    new.in_game_name := player.data->'player'->>'nick_name';
    new.player_power := coalesce((player.data->'player'->>'power')::numeric, new.player_power);
    new.alliance_id := admin_tools.site_alliance_of(player.state_number, player.alliance_tag);
  end if;
  return new;
end $$;

drop trigger if exists fill_account_from_game on public.game_accounts;
create trigger fill_account_from_game before insert or update of in_game_id on public.game_accounts
  for each row execute function admin_tools.fill_account_from_game();

revoke all on function admin_tools.site_alliance_of(integer, text) from public, anon, authenticated;
revoke all on function admin_tools.copy_game_to_accounts() from public, anon, authenticated;
revoke all on function admin_tools.fill_account_from_game() from public, anon, authenticated;
