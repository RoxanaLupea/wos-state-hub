-- Game accounts (23 Nov 2026). A person (their login) can have several game accounts:
-- one main and any number of alts. An alt is a full account of its own, in its own
-- alliance, with its own power, troop tiers and, later, heroes and results. The person
-- picks the account they are on in the menu under their name. Farms are kept in the same
-- table, with a name, an id, an alliance and a power, but they belong to the main: they
-- are not accounts to switch to.
-- Run after schema.sql. Safe to run again.

create table if not exists game_accounts (
  id                      bigserial primary key,
  owner_id                uuid not null references accounts (id) on delete cascade,
  kind                    text not null check (kind in ('main', 'alt', 'farm')),
  in_game_name            text,
  in_game_id              text unique,
  alliance_id             text references alliances (id),
  player_power            numeric,
  player_power_updated_at timestamptz,
  foundry_power           numeric,
  foundry_power_updated_at timestamptz,
  infantry_tier           text,
  infantry_skill_level    integer,
  lancer_tier             text,
  lancer_skill_level      integer,
  marksmen_tier           text,
  marksmen_skill_level    integer,
  sort_order              integer not null default 0,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- A table made before farms were game accounts takes them too.
alter table game_accounts drop constraint if exists game_accounts_kind_check;
alter table game_accounts add constraint game_accounts_kind_check check (kind in ('main', 'alt', 'farm'));

-- One main per person.
create unique index if not exists game_accounts_one_main on game_accounts (owner_id) where kind = 'main';

-- Each person's game details as saved today become their main account.
insert into game_accounts (owner_id, kind, in_game_name, in_game_id, alliance_id, player_power, player_power_updated_at,
  foundry_power, foundry_power_updated_at, infantry_tier, infantry_skill_level, lancer_tier, lancer_skill_level,
  marksmen_tier, marksmen_skill_level)
select id, 'main', in_game_name, in_game_id, alliance_id, player_power, player_power_updated_at,
  foundry_power, foundry_power_updated_at, infantry_tier, infantry_skill_level, lancer_tier, lancer_skill_level,
  marksmen_tier, marksmen_skill_level
from accounts
where not exists (select 1 from game_accounts g where g.owner_id = accounts.id and g.kind = 'main');

-- What was saved as an alt or a farm becomes a game account of its own.
insert into game_accounts (owner_id, kind, in_game_name, in_game_id, sort_order)
select account_id, kind, in_game_name, in_game_id, id from account_alt_accounts where kind in ('alt', 'farm')
on conflict (in_game_id) do nothing;
delete from account_alt_accounts where kind in ('alt', 'farm');

-- Availability answers are given per game account, so one person can answer for their
-- main and for their alt. Answers given so far are their main's.
alter table availability add column if not exists game_account_id bigint references game_accounts (id) on delete cascade;
update availability set game_account_id = g.id from game_accounts g
where availability.game_account_id is null and g.owner_id = availability.account_id and g.kind = 'main';
alter table availability drop constraint if exists availability_event_type_id_event_date_account_id_key;
alter table availability drop constraint if exists availability_event_type_id_event_date_game_account_id_key;
alter table availability add constraint availability_event_type_id_event_date_game_account_id_key
  unique (event_type_id, event_date, game_account_id);

-- Readable like accounts; each person changes only their own (while the site has one
-- user every signed-in person may, as for accounts in access-while-solo.sql).
alter table game_accounts enable row level security;
drop policy if exists "anyone can read game_accounts" on game_accounts;
drop policy if exists "each changes their own game accounts" on game_accounts;
create policy "anyone can read game_accounts" on game_accounts for select using (true);
create policy "each changes their own game accounts" on game_accounts for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
grant select on game_accounts to anon;
grant select, insert, update, delete on game_accounts to authenticated;
grant usage, select on all sequences in schema public to authenticated;
