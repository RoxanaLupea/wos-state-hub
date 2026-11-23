-- The skill level of each Exalted troop type, kept per in-game ID. The game does not give
-- it (the Whiteout Stats API sends tier and FC level only), so it is typed on the site:
-- by the player on their own page, or, for a member with no account linked on the site,
-- by the R4s of the member's alliance and by admins (owner, 23 Nov). Kept per ID, not on
-- the site account, so a level an R4 set stays when the player links the account later.
-- No row, or no value for a troop type, means it was never set; 0 means None.
-- Run after game-data.sql. Safe to run again.

create table if not exists public.exalted_skill_levels (
  player_id bigint primary key,
  infantry smallint check (infantry between 0 and 3),
  lancer smallint check (lancer between 0 and 3),
  marksmen smallint check (marksmen between 0 and 3),
  updated_by uuid default auth.uid(),
  updated_at timestamptz not null default now()
);

alter table public.exalted_skill_levels enable row level security;
revoke all on public.exalted_skill_levels from anon, authenticated;
grant select on public.exalted_skill_levels to authenticated;

-- Read by the same people who read the game data, and by each player for their own IDs.
drop policy if exists "members and owners read" on public.exalted_skill_levels;
create policy "members and owners read" on public.exalted_skill_levels for select to authenticated
  using (public.is_state_member()
    or player_id::text in (select in_game_id from public.game_accounts where owner_id = auth.uid()));

-- Whether the signed-in person may set a player's skill levels: the owner of the account
-- linked to that ID; admins always; an R4 of the player's alliance (or of its main
-- alliance, for an academy) only while no site account is linked to the ID.
create or replace function public.can_set_skill_levels(player_number bigint) returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (
    public.is_admin()
    or exists (select 1 from game_accounts where owner_id = auth.uid() and in_game_id = player_number::text)
    or (not exists (select 1 from game_accounts where in_game_id = player_number::text)
      and exists (select 1 from game_players player
        join game_alliances game on game.state_number = player.state_number and game.tag = player.alliance_tag
        join alliances site on site.id = game.alliance_id
        where player.player_id = player_number
          and (public.leads_alliance(site.id) or (site.main_alliance_id is not null and public.leads_alliance(site.main_alliance_id))))));
$$;

-- Sets one troop type's level (0 to 3, or null to clear it), if the person may.
create or replace function public.set_skill_level(player_number bigint, troop text, level integer) returns void
language plpgsql security definer set search_path = public as $$
begin
  if troop not in ('infantry', 'lancer', 'marksmen') then raise exception 'Unknown troop type %.', troop; end if;
  if level is not null and (level < 0 or level > 3) then raise exception 'The skill level is None or Lvl. 1 to 3.'; end if;
  if not public.can_set_skill_levels(player_number) then
    raise exception 'Only the player, admins, and the R4s of a member with no linked account can set this.';
  end if;
  insert into exalted_skill_levels (player_id) values (player_number) on conflict (player_id) do nothing;
  execute format('update exalted_skill_levels set %I = $1, updated_by = auth.uid(), updated_at = now() where player_id = $2', troop)
    using level, player_number;
end $$;

revoke all on function public.can_set_skill_levels(bigint) from public, anon;
grant execute on function public.can_set_skill_levels(bigint) to authenticated;
revoke all on function public.set_skill_level(bigint, text, integer) from public, anon;
grant execute on function public.set_skill_level(bigint, text, integer) to authenticated;

-- Levels already typed on site accounts move here once.
insert into public.exalted_skill_levels (player_id, infantry, lancer, marksmen)
  select in_game_id::bigint,
    case when infantry_tier like '%Exalted' then infantry_skill_level end,
    case when lancer_tier like '%Exalted' then lancer_skill_level end,
    case when marksmen_tier like '%Exalted' then marksmen_skill_level end
  from public.game_accounts
  where in_game_id ~ '^[0-9]+$'
    and (infantry_tier like '%Exalted' or lancer_tier like '%Exalted' or marksmen_tier like '%Exalted')
on conflict (player_id) do nothing;
