-- Database structure for the state 1458 events hub.
-- Everything the game publishes and never changes lives in data/catalog as files.
-- Everything people change lives here.
--
-- Naming: tables and columns are spelled out in full. Times are stored as UTC.
-- Every table people edit carries updated_by and updated_at so a wrong change can be traced.

-- ---------------------------------------------------------------------------
-- Alliances
-- ---------------------------------------------------------------------------

-- Every alliance in the state that uses the hub.
-- The five NAP alliances and their academies are seeded. Anyone outside them can
-- ask for their alliance to be added, and an admin approves it.
create table alliances (
  id                      text primary key,
  name                    text not null,
  tag                     text not null,
  -- Set on an academy, pointing at the main alliance it belongs to.
  -- R4s link academies to their own alliance, admins to any alliance.
  main_alliance_id        text references alliances (id),
  -- Only NAP alliances appear in the fort board and the misconduct log.
  in_nap                  boolean not null default false,
  -- pending alliances appear nowhere except the admin approval list.
  status                  text not null default 'pending'
                            check (status in ('pending', 'approved', 'rejected')),
  requested_by            uuid,
  approved_by             uuid,
  approved_at             timestamptz,
  base_color              text,
  second_color            text,
  logo_file               text,
  sort_order              integer not null default 0,
  -- The day an alliance left the state. It then disappears from the calendar, the
  -- filters and the forms, but its past records (forts, results) keep its name.
  left_on                 date,
  updated_by              uuid,
  updated_at              timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- People
-- ---------------------------------------------------------------------------

-- One row per person who signs in. The in-game id is theirs to set, not something
-- the site verifies, but two accounts cannot hold the same id at once. If someone
-- has taken yours, you flag it and an admin sorts it out.
create table accounts (
  -- Same id as the Supabase login, so deleting the login removes the row with it.
  id                      uuid primary key references auth.users (id) on delete cascade,
  in_game_name            text,
  in_game_id              text unique,
  alliance_id             text references alliances (id),
  display_timezone        text,
  language                text not null default 'en',
  -- Both powers are typed in by the person, an R4 or an admin, and grow with updates.
  -- Anything older than the staleness setting gets asked about by the home prompt.
  player_power            numeric,
  player_power_updated_at timestamptz,
  foundry_power           numeric,
  foundry_power_updated_at timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- A person's farms and alt accounts, kept against their login.
create table account_alt_accounts (
  id                      bigserial primary key,
  account_id              uuid not null references accounts (id) on delete cascade,
  in_game_name            text,
  in_game_id              text unique,
  kind                    text not null check (kind in ('farm', 'alt')),
  created_at              timestamptz not null default now()
);

-- What someone is allowed to do. A role is either global or tied to one alliance.
-- owner sets event dates and repeats; admin can edit anything; alliance_manager is an
-- alliance's R4s and R5s, for that alliance; state_manager does the state's planning
-- except battles; battle_manager plans the battles.
create table account_roles (
  id                      bigserial primary key,
  account_id              uuid not null references accounts (id) on delete cascade,
  role                    text not null
                            check (role in ('member', 'alliance_manager', 'state_manager',
                                            'battle_manager', 'admin', 'owner')),
  -- Null for a role that applies across the whole state.
  alliance_id             text references alliances (id),
  granted_by              uuid,
  granted_at              timestamptz not null default now(),
  unique (account_id, role, alliance_id)
);

-- ---------------------------------------------------------------------------
-- Schedules and occurrences
-- ---------------------------------------------------------------------------

-- A repeating event slot, for example "DVL bear trap 1" or the state's Fortress Battles.
-- Seeded from the old spreadsheet, edited by admins and R4s afterwards.
create table schedules (
  id                      text primary key,
  event_type_id           text not null,
  first_date              date not null,
  repeat_every_days       integer,
  length_days             integer,
  start_time_utc          time,
  end_time_utc            time,
  -- Alliance-run slots name their alliances; state events leave this empty.
  alliance_ids            text,
  group_number            integer,
  note                    text,
  since_date              date,
  shift_with_moves        boolean not null default false,
  -- On for Tundra Arms League, whose date is roughly every 112 days but can land a
  -- week either side. Its occurrences show as provisional until an admin confirms them.
  dates_are_estimated     boolean not null default false,
  updated_by              uuid,
  updated_at              timestamptz not null default now()
);

-- One run of a schedule. A row only exists once something about that run differs from
-- the pattern: a moved date, a confirmation, a state alliance, a prompt switched on.
create table event_occurrences (
  id                      bigserial primary key,
  schedule_id             text not null references schedules (id) on delete cascade,
  -- The date the repeat pattern produced.
  original_date           date not null,
  -- Set when the run actually happens on a different day.
  moved_to_date           date,
  start_time_utc          time,
  end_time_utc            time,
  -- Only meaningful when the schedule's dates are estimated. Until this is set the
  -- date shows as provisional and no prompt, registration or roster opens.
  confirmed_date          date,
  confirmed_by            uuid,
  confirmed_at            timestamptz,
  -- Turns the home-page prompt on for this run.
  asks_for_availability   boolean not null default false,
  note                    text,
  updated_by              uuid,
  updated_at              timestamptz not null default now(),
  unique (schedule_id, original_date)
);

-- The alliances acting as the state alliance for one run. Usually none or one;
-- admins can add a second, and people then pick which one they are going to.
create table occurrence_state_alliances (
  occurrence_id           bigint not null references event_occurrences (id) on delete cascade,
  alliance_id             text not null references alliances (id),
  sort_order              integer not null default 0,
  primary key (occurrence_id, alliance_id)
);

-- ---------------------------------------------------------------------------
-- Fortress Battles
-- ---------------------------------------------------------------------------

-- One planning board per season. The board saves as a draft whatever state it is in,
-- so a half-planned season is never lost, and only publishing checks the rules.
create table fort_plans (
  season                  integer primary key,
  status                  text not null default 'draft'
                            check (status in ('draft', 'published')),
  published_by            uuid,
  published_at            timestamptz,
  updated_by              uuid,
  updated_at              timestamptz not null default now()
);

-- Who holds each fort in each phase of a season.
-- Forts are F1 to F12, strongholds SH1 to SH4, phases 1 to 8.
create table fort_assignments (
  id                      bigserial primary key,
  season                  integer not null references fort_plans (season) on delete cascade,
  phase                   integer not null check (phase between 1 and 8),
  fort                    text not null,
  -- The alliance that registers and attacks. Only this alliance can take the fort.
  alliance_id             text not null references alliances (id),
  -- Who the rewards count for. Null means the default: the holder itself, or for an
  -- academy its main alliance. 'shared' means the whole state. A shell must set this.
  credited_to             text,
  -- How many of this fort's buffs the holding alliance sets aside for leads from
  -- other alliances. Only meaningful on a fort whose reward is a buff.
  reserved_for_leads      integer not null default 0,
  battle_time_utc         timestamptz,
  updated_by              uuid,
  updated_at              timestamptz not null default now(),
  unique (season, phase, fort)
);

-- Rally leads per alliance, reused across phases rather than retyped.
-- A castle lead collects 2 of each buff, a turret lead 1. Those numbers live in
-- settings, not here, because the game can change them.
create table rally_leads (
  id                      bigserial primary key,
  alliance_id             text not null references alliances (id) on delete cascade,
  in_game_name            text not null,
  in_game_id              text,
  tier                    text not null check (tier in ('castle', 'turret')),
  sort_order              integer not null default 0,
  updated_by              uuid,
  updated_at              timestamptz not null default now()
);

-- Which lead collects buffs from which fort. Own-alliance buffs never appear here
-- because the game grants those automatically. One row per lead per buff fort.
-- The quantities on a fort must not exceed that fort's reserved_for_leads.
create table buff_allocations (
  id                      bigserial primary key,
  fort_assignment_id      bigint not null references fort_assignments (id) on delete cascade,
  rally_lead_id           bigint not null references rally_leads (id) on delete cascade,
  quantity                integer not null check (quantity > 0),
  updated_by              uuid,
  updated_at              timestamptz not null default now(),
  unique (fort_assignment_id, rally_lead_id)
);

-- Someone taking a fort that was planned for another alliance. Admin only.
-- Only NAP alliances are recorded, since breaking the agreement is the point.
create table fort_incidents (
  id                      bigserial primary key,
  season                  integer not null,
  phase                   integer not null,
  fort                    text not null,
  taken_by                text not null check (taken_by in ('solo', 'alliance_rally')),
  in_game_name            text,
  in_game_id              text,
  alliance_id             text references alliances (id),
  note                    text,
  recorded_by             uuid,
  recorded_at             timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Results
-- ---------------------------------------------------------------------------

-- How a state or alliance event went. Fortress Battles has no result, because the
-- forts are decided in planning rather than won on the day.
create table results (
  id                      bigserial primary key,
  event_type_id           text not null,
  event_date              date not null,
  -- The alliance whose own result this is; empty for a state result.
  alliance_id             text references alliances (id),
  -- Which of our alliances acted as the state alliance for this one.
  state_alliance_id       text references alliances (id),
  -- Only for events the catalog marks as win or loss.
  outcome                 text check (outcome in ('win', 'loss')),
  -- Only for events the catalog marks as ranked.
  rank                    integer,
  president_alliance_id   text references alliances (id),
  president_name          text,
  note                    text,
  updated_by              uuid,
  updated_at              timestamptz not null default now()
);
-- alliance_records, opponent_notes, personal_entries and the troop columns on accounts
-- are in results-and-notes.sql.

-- Opponents for one result. Its own table because Canyon Clash has two, most events
-- have none, and the SvS phases all read the opponent from the parent SvS row.
create table result_opponents (
  result_id               bigint not null references results (id) on delete cascade,
  slot                    integer not null,
  opponent_state          integer,
  opponent_alliance       text,
  primary key (result_id, slot)
);

-- Extra facts worth keeping per run, different for each event. For Frostdragon Tyrant
-- and Tundra Arms League this is where the states in the zone, the number of alliances
-- or legions that qualified, and the power of the weakest that got in are recorded.
-- The game does not publish the bar, so it is only learnt from past runs.
create table result_details (
  result_id               bigint not null references results (id) on delete cascade,
  detail_key              text not null,
  detail_value            text,
  primary key (result_id, detail_key)
);

-- ---------------------------------------------------------------------------
-- Plans
-- ---------------------------------------------------------------------------

-- The shape of a plan: which fields it has and in what order. Kept so the next plan
-- starts from the last one instead of a blank page.
create table plan_templates (
  id                      bigserial primary key,
  name                    text not null,
  kind                    text not null,
  fields                  jsonb not null,
  updated_by              uuid,
  updated_at              timestamptz not null default now()
);

-- A filled-in plan for one run of an event: pet schedule, rally setup, battle map.
-- Members see it only once it is published.
create table plans (
  id                      bigserial primary key,
  event_type_id           text not null,
  event_date              date not null,
  template_id             bigint references plan_templates (id),
  title                   text,
  status                  text not null default 'draft'
                            check (status in ('draft', 'published')),
  content                 jsonb not null default '{}'::jsonb,
  updated_by              uuid,
  updated_at              timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- What a person sees and when they can play
-- ---------------------------------------------------------------------------

-- Which event slots show in someone's calendar. Only deviations are stored: with no
-- rows at all a person follows their own alliance, so a transfer moves them along too.
-- People can follow another alliance's slot if its time suits them better.
create table schedule_picks (
  account_id              uuid not null references accounts (id) on delete cascade,
  schedule_id             text not null references schedules (id) on delete cascade,
  is_shown                boolean not null,
  updated_at              timestamptz not null default now(),
  primary key (account_id, schedule_id)
);

-- One person's registration for one run of Frostdragon Tyrant or Tundra Arms League.
-- Troop scores are worked out on save so lists sort instantly:
-- FC5 is 1 point rising to FC10 at 6, Helios adds 1, Exalted 1 more, each skill
-- level adds 1. Highest is 11 per troop type and 33 in total.
create table availability (
  id                      bigserial primary key,
  event_type_id           text not null,
  event_date              date not null,
  account_id              uuid not null references accounts (id) on delete cascade,
  alliance_id             text references alliances (id),
  -- Whether they are playing from their own alliance or the state alliance.
  playing_for_alliance_id text references alliances (id),
  is_unavailable          boolean not null default false,
  infantry_tier           text,
  infantry_skill_level    integer,
  lancer_tier             text,
  lancer_skill_level      integer,
  marksmen_tier           text,
  marksmen_skill_level    integer,
  infantry_score          integer,
  lancer_score            integer,
  marksmen_score          integer,
  total_troop_score       integer,
  has_monthly_card        boolean,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (event_type_id, event_date, account_id)
);

-- When someone can attend. Tyrant has one row, a start and an end. Tundra Arms League
-- has one row per time they could make, so the state can pick the hour most can attend.
create table availability_times (
  id                      bigserial primary key,
  availability_id         bigint not null references availability (id) on delete cascade,
  from_hour_utc           integer not null check (from_hour_utc between 0 and 23),
  to_hour_utc             integer not null check (to_hour_utc between 0 and 23)
);

-- ---------------------------------------------------------------------------
-- Rosters
-- ---------------------------------------------------------------------------

-- Who goes where for one run. One roster per state alliance, so one can be settled
-- before the other. Members see it while it is being built, marked as in progress.
create table rosters (
  id                      bigserial primary key,
  event_type_id           text not null,
  event_date              date not null,
  alliance_id             text not null references alliances (id),
  status                  text not null default 'in_progress'
                            check (status in ('in_progress', 'final')),
  updated_by              uuid,
  updated_at              timestamptz not null default now(),
  unique (event_type_id, event_date, alliance_id)
);

-- A person on a roster. Tyrant takes 60 joiners and 40 fillers, of whom only the 60
-- are registered for the battle; Tundra Arms League takes 30 joiners and 20 subs per
-- legion. Fillers are usually people who said they cannot play, and are there to add
-- alliance power. Those numbers live in settings.
create table roster_members (
  id                      bigserial primary key,
  roster_id               bigint not null references rosters (id) on delete cascade,
  in_game_id              text not null,
  in_game_name            text,
  member_role             text not null check (member_role in ('joiner', 'filler', 'sub')),
  note                    text,
  sort_order              integer not null default 0,
  unique (roster_id, in_game_id)
);

-- ---------------------------------------------------------------------------
-- Settings
-- ---------------------------------------------------------------------------

-- Numbers that would otherwise be buried in code. A game rule changes when the game
-- changes; a state choice is how we decided to do things. Admins only.
create table settings (
  id                      bigserial primary key,
  setting_key             text not null,
  -- Null for a setting that applies everywhere.
  event_type_id           text,
  setting_value           text not null,
  setting_kind            text not null check (setting_kind in ('game_rule', 'state_choice')),
  updated_by              uuid,
  updated_at              timestamptz not null default now()
);

-- One row per setting per scope. Written as an index rather than a primary key because
-- a primary key cannot hold a null, and null is what "applies everywhere" means here.
create unique index settings_key_and_scope
  on settings (setting_key, coalesce(event_type_id, ''));

-- ---------------------------------------------------------------------------
-- Transfers
-- ---------------------------------------------------------------------------

-- One transfer event. An ordinary state takes 35 by invitation and 20 in the open
-- phase, and banks up to 3 special invites with 1 restored on the 1st of each month.
-- A leading state takes 20 and 10 and has no specials, except one granted on its third
-- leading transfer in a row, which expires with that window.
create table transfer_windows (
  id                      bigserial primary key,
  transfer_date           date not null unique,
  state_type              text not null check (state_type in ('ordinary', 'leading')),
  -- The threshold the state sets. Anyone above it must shed power or hold a special.
  power_cap               numeric,
  special_invites_available integer not null default 0,
  status                  text not null default 'planning'
                            check (status in ('planning', 'running', 'closed')),
  note                    text,
  updated_by              uuid,
  updated_at              timestamptz not null default now()
);

-- Someone we are inviting. R4s add people, everyone can see the plan.
-- The president can send unlimited invitations, so the quota is on arrivals, not sends:
-- the first 35 who actually transfer use it up.
create table transfer_candidates (
  id                      bigserial primary key,
  window_id               bigint not null references transfer_windows (id) on delete cascade,
  in_game_name            text not null,
  in_game_id              text not null,
  player_power            numeric,
  fc_level                text,
  current_state           integer,
  destination_alliance_id text references alliances (id),
  stage                   text check (stage in ('invitation', 'open', 'special')),
  invite_status           text check (invite_status in ('not_sent', 'sent', 'pending', 'declined')),
  outcome                 text check (outcome in ('transferred', 'rejected', 'no_answer')),
  -- Marked on the people committed to when invites first go out, so the window reads
  -- back as "35 planned, 3 rejected, replaced by these 3".
  in_initial_list         boolean not null default false,
  replaces_candidate_id   bigint references transfer_candidates (id),
  priority                integer not null default 0,
  helios                  text,
  labyrinth               numeric,
  note                    text,
  added_by                uuid,
  added_at                timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- Any member can flag someone they recognise before the invite goes out.
create table candidate_flags (
  id                      bigserial primary key,
  candidate_id            bigint not null references transfer_candidates (id) on delete cascade,
  flagged_by              uuid,
  reason                  text not null,
  created_at              timestamptz not null default now()
);

-- People we know are a problem. A candidate whose id appears here is flagged on sight.
create table blacklist (
  in_game_id              text primary key,
  in_game_name            text,
  reason                  text not null,
  added_by                uuid,
  added_at                timestamptz not null default now()
);

-- The game's published transfer groups: which range of states moves on which date.
-- Reference data, seeded and kept up to date by admins.
create table transfer_groups (
  id                      text primary key,
  transfer_date           date not null,
  from_state              integer not null,
  to_state                integer not null,
  -- Hero generation as a number, so it sorts.
  generation              integer,
  -- Position on one ladder, counted in upgrades: one per furnace level up to 30, then
  -- five per Fire Crystal level, so FC1 is 35 and FC10 is 80. The War Academy and Red
  -- Chief Gear unlock during FC5 and take the spare numbers 56 and 57 between FC5 and
  -- FC6. Those two are positions rather than real upgrade counts.
  furnace_cap_upgrades    integer,
  updated_by              uuid,
  updated_at              timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- The map
-- ---------------------------------------------------------------------------

-- The state is a 1200 by 1200 tile grid, corners at 0,0 and 1199,1199.
-- Nothing reads the game, so everything here is entered by hand in builder mode and
-- is only as current as people keep it.

-- Alliance facilities. Each type and level gives a buff; two of the same type and
-- level do not stack, so a duplicate is waste and a missing one is a lost buff.
-- A complete set is 12: construction and tech at levels 1 and 3, defense and weapons
-- at levels 2 and 4, and one each of training, expedition, production and gathering.
create table facilities (
  id                      bigserial primary key,
  facility_type           text not null,
  facility_level          integer not null,
  position_x              integer not null check (position_x between 0 and 1199),
  position_y              integer not null check (position_y between 0 and 1199),
  alliance_id             text references alliances (id),
  updated_by              uuid,
  updated_at              timestamptz not null default now(),
  unique (position_x, position_y)
);

-- What each facility type and level is worth, so the alliance page can show which
-- buffs are held, which are duplicated and which are missing.
create table facility_buffs (
  facility_type           text not null,
  facility_level          integer not null,
  buff_percent            numeric not null,
  primary key (facility_type, facility_level)
);

-- Everything placed on the map. Cities are 2 by 2, banners 1 by 1 with a 7 by 7
-- territory centred on them, so a banner at x,y claims x-3 to x+3 and y-3 to y+3.
-- Territory starts at an alliance's HQs and spreads through its banners.
-- A city may sit outside territory; it may not sit on mountains, water or a building.
create table map_objects (
  id                      bigserial primary key,
  kind                    text not null
                            check (kind in ('hq', 'banner', 'city', 'trap', 'gathering', 'other')),
  position_x              integer not null check (position_x between 0 and 1199),
  position_y              integer not null check (position_y between 0 and 1199),
  width                   integer not null default 1,
  height                  integer not null default 1,
  -- Who placed it. Only this alliance or an admin may change or remove it; anyone
  -- else who needs it gone asks an admin.
  alliance_id             text references alliances (id),
  -- A city plot can be labelled before anyone is assigned to it.
  label                   text,
  account_id              uuid references accounts (id),
  updated_by              uuid,
  updated_at              timestamptz not null default now()
);

-- Squares nobody can build on, marked by eye as R4s map their area.
-- Shared across alliances: one person maps a mountain range and everyone benefits.
create table terrain_marks (
  position_x              integer not null check (position_x between 0 and 1199),
  position_y              integer not null check (position_y between 0 and 1199),
  terrain_kind            text not null check (terrain_kind in ('mountain', 'water')),
  marked_by               uuid,
  marked_at               timestamptz not null default now(),
  primary key (position_x, position_y)
);

-- Asking an admin to remove something another alliance placed.
create table map_removal_requests (
  id                      bigserial primary key,
  map_object_id           bigint not null references map_objects (id) on delete cascade,
  requested_by            uuid,
  reason                  text not null,
  status                  text not null default 'pending'
                            check (status in ('pending', 'approved', 'declined')),
  decided_by              uuid,
  decided_at              timestamptz,
  created_at              timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Event preparation timelines
-- ---------------------------------------------------------------------------

-- How to get the most out of an event, as a timeline rather than prose, because that
-- is the shape the Discord posts already take. Day offsets are relative to the event's
-- start, so -1 is the day before, which is also where these rows show in the calendar.
create table event_preparation_blocks (
  id                      bigserial primary key,
  event_type_id           text not null,
  day_offset              integer not null,
  from_time_utc           time,
  to_time_utc             time,
  sort_order              integer not null default 0,
  updated_by              uuid,
  updated_at              timestamptz not null default now()
);

-- What to do in that block. The text itself lives in the language files.
create table event_preparation_actions (
  id                      bigserial primary key,
  block_id                bigint not null references event_preparation_blocks (id) on delete cascade,
  action_kind             text not null
                            check (action_kind in ('do', 'do_not', 'claim', 'activate')),
  text_key                text not null,
  sort_order              integer not null default 0
);
