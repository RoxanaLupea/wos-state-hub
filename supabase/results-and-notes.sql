-- Results per alliance, each alliance's own records, opponent notes and personal
-- entries. Safe to run again.

-- An alliance's own result (Showdown, Foundry, Canyon, Winter Siege, Alliance
-- Championship, or its own Tyrant or TAL legion) carries the alliance. A state result
-- leaves it empty. Several alliances record the same run, and an alliance can have two
-- TAL legions in one season, so a run no longer has a single result.
alter table results add column if not exists alliance_id text references alliances (id);
alter table results drop constraint if exists results_event_type_id_event_date_key;

-- What each alliance keeps about itself: the events whose results it does not keep
-- (all kept by default), its Winter Siege tier, and its Alliance Championship tier and
-- stars. Run by its R4s and R5s.
create table if not exists alliance_records (
  alliance_id             text primary key references alliances (id),
  results_off             text[] not null default '{}',
  -- Its Alliance Showdown Star Rating, which decides which rewards band its members see first.
  showdown_star_rating    integer,
  winter_siege_tier       text,
  championship_tier       text,
  championship_stars      integer,
  updated_by              uuid,
  updated_at              timestamptz not null default now()
);

-- For a table made before the Star Rating was added.
alter table alliance_records add column if not exists showdown_star_rating integer;

-- Notes on an opponent alliance, known by its state and tag, so they are there
-- whenever it shows up again. Written and read by R4s and R5s of the state's alliances.
create table if not exists opponent_notes (
  id                      bigserial primary key,
  opponent_state          integer not null,
  opponent_tag            text not null,
  -- The alliance whose R4 or R5 wrote it.
  alliance_id             text references alliances (id),
  note                    text not null,
  written_by              uuid,
  written_at              timestamptz not null default now()
);

-- A player's own entry for one run, as the old app kept it: the time they picked
-- (Frostfire's slot), their rank and a note.
create table if not exists personal_entries (
  id                      bigserial primary key,
  account_id              uuid not null references accounts (id) on delete cascade,
  schedule_id             text not null,
  original_date           date not null,
  my_time                 time,
  rank                    integer,
  note                    text,
  updated_at              timestamptz not null default now(),
  unique (account_id, schedule_id, original_date)
);

alter table alliance_records enable row level security;
alter table opponent_notes enable row level security;
alter table personal_entries enable row level security;

-- While the site is used by its owner only (see access-while-solo.sql): anyone reads
-- alliance records, signed-in people read and write the rest.
drop policy if exists "anyone can read alliance_records" on alliance_records;
create policy "anyone can read alliance_records" on alliance_records for select using (true);
drop policy if exists "signed in can change alliance_records" on alliance_records;
create policy "signed in can change alliance_records" on alliance_records for all to authenticated using (true) with check (true);
drop policy if exists "signed in can read and write opponent_notes" on opponent_notes;
create policy "signed in can read and write opponent_notes" on opponent_notes for all to authenticated using (true) with check (true);
drop policy if exists "signed in can read and write personal_entries" on personal_entries;
create policy "signed in can read and write personal_entries" on personal_entries for all to authenticated using (true) with check (true);

grant select on alliance_records to anon;
grant select, insert, update, delete on alliance_records, opponent_notes, personal_entries to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- A player's own troop tiers and skill levels, kept on their account so every
-- registration starts from them.
alter table accounts add column if not exists infantry_tier text;
alter table accounts add column if not exists infantry_skill_level integer;
alter table accounts add column if not exists lancer_tier text;
alter table accounts add column if not exists lancer_skill_level integer;
alter table accounts add column if not exists marksmen_tier text;
alter table accounts add column if not exists marksmen_skill_level integer;
