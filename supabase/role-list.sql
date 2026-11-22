-- The roles, as decided on 22 Nov 2026:
-- owner: sets event dates and repeats.
-- admin: can edit anything.
-- alliance_manager: an alliance's R4s and R5s, given for that one alliance.
-- state_manager: the state's planning, except battles.
-- battle_manager: plans the battles.
-- member: a signed-in player.
alter table account_roles drop constraint if exists account_roles_role_check;
alter table account_roles add constraint account_roles_role_check
  check (role in ('member', 'alliance_manager', 'state_manager', 'battle_manager', 'admin', 'owner'));
