-- Temporary access rules, for while the site is only used by its owner.
--
-- Postgres on Supabase checks every request against per-table rules. A new table has
-- those checks switched on and no rules written, so it answers nothing to anybody.
-- These rules open everything up so the site can be built against real data:
--   reading  - anyone, signed in or not
--   writing  - anyone signed in, which for now is only you
--
-- REPLACE THESE BEFORE SHARING THE SITE WITH ANYONE.
-- Once roles are designed, writing gets split per table and per role, and the tables
-- holding personal or private information stop being readable by everyone:
-- accounts, account_alt_accounts, account_roles, availability, blacklist,
-- candidate_flags, fort_incidents, transfer_candidates.
--
-- Run this after schema.sql, in the same SQL editor.

alter table alliances enable row level security;

create policy "anyone can read alliances"
  on alliances for select
  using (true);

create policy "signed in can change alliances"
  on alliances for all
  to authenticated
  using (true)
  with check (true);

alter table accounts enable row level security;

create policy "anyone can read accounts"
  on accounts for select
  using (true);

create policy "signed in can change accounts"
  on accounts for all
  to authenticated
  using (true)
  with check (true);

alter table account_alt_accounts enable row level security;

create policy "anyone can read account_alt_accounts"
  on account_alt_accounts for select
  using (true);

create policy "signed in can change account_alt_accounts"
  on account_alt_accounts for all
  to authenticated
  using (true)
  with check (true);

alter table account_roles enable row level security;

create policy "anyone can read account_roles"
  on account_roles for select
  using (true);

create policy "signed in can change account_roles"
  on account_roles for all
  to authenticated
  using (true)
  with check (true);

alter table schedules enable row level security;

create policy "anyone can read schedules"
  on schedules for select
  using (true);

create policy "signed in can change schedules"
  on schedules for all
  to authenticated
  using (true)
  with check (true);

alter table event_occurrences enable row level security;

create policy "anyone can read event_occurrences"
  on event_occurrences for select
  using (true);

create policy "signed in can change event_occurrences"
  on event_occurrences for all
  to authenticated
  using (true)
  with check (true);

alter table occurrence_state_alliances enable row level security;

create policy "anyone can read occurrence_state_alliances"
  on occurrence_state_alliances for select
  using (true);

create policy "signed in can change occurrence_state_alliances"
  on occurrence_state_alliances for all
  to authenticated
  using (true)
  with check (true);

alter table fort_plans enable row level security;

create policy "anyone can read fort_plans"
  on fort_plans for select
  using (true);

create policy "signed in can change fort_plans"
  on fort_plans for all
  to authenticated
  using (true)
  with check (true);

alter table fort_assignments enable row level security;

create policy "anyone can read fort_assignments"
  on fort_assignments for select
  using (true);

create policy "signed in can change fort_assignments"
  on fort_assignments for all
  to authenticated
  using (true)
  with check (true);

alter table rally_leads enable row level security;

create policy "anyone can read rally_leads"
  on rally_leads for select
  using (true);

create policy "signed in can change rally_leads"
  on rally_leads for all
  to authenticated
  using (true)
  with check (true);

alter table buff_allocations enable row level security;

create policy "anyone can read buff_allocations"
  on buff_allocations for select
  using (true);

create policy "signed in can change buff_allocations"
  on buff_allocations for all
  to authenticated
  using (true)
  with check (true);

alter table fort_incidents enable row level security;

create policy "anyone can read fort_incidents"
  on fort_incidents for select
  using (true);

create policy "signed in can change fort_incidents"
  on fort_incidents for all
  to authenticated
  using (true)
  with check (true);

alter table results enable row level security;

create policy "anyone can read results"
  on results for select
  using (true);

create policy "signed in can change results"
  on results for all
  to authenticated
  using (true)
  with check (true);

alter table result_opponents enable row level security;

create policy "anyone can read result_opponents"
  on result_opponents for select
  using (true);

create policy "signed in can change result_opponents"
  on result_opponents for all
  to authenticated
  using (true)
  with check (true);

alter table result_details enable row level security;

create policy "anyone can read result_details"
  on result_details for select
  using (true);

create policy "signed in can change result_details"
  on result_details for all
  to authenticated
  using (true)
  with check (true);

alter table plan_templates enable row level security;

create policy "anyone can read plan_templates"
  on plan_templates for select
  using (true);

create policy "signed in can change plan_templates"
  on plan_templates for all
  to authenticated
  using (true)
  with check (true);

alter table plans enable row level security;

create policy "anyone can read plans"
  on plans for select
  using (true);

create policy "signed in can change plans"
  on plans for all
  to authenticated
  using (true)
  with check (true);

alter table schedule_picks enable row level security;

create policy "anyone can read schedule_picks"
  on schedule_picks for select
  using (true);

create policy "signed in can change schedule_picks"
  on schedule_picks for all
  to authenticated
  using (true)
  with check (true);

alter table availability enable row level security;

create policy "anyone can read availability"
  on availability for select
  using (true);

create policy "signed in can change availability"
  on availability for all
  to authenticated
  using (true)
  with check (true);

alter table availability_times enable row level security;

create policy "anyone can read availability_times"
  on availability_times for select
  using (true);

create policy "signed in can change availability_times"
  on availability_times for all
  to authenticated
  using (true)
  with check (true);

alter table rosters enable row level security;

create policy "anyone can read rosters"
  on rosters for select
  using (true);

create policy "signed in can change rosters"
  on rosters for all
  to authenticated
  using (true)
  with check (true);

alter table roster_members enable row level security;

create policy "anyone can read roster_members"
  on roster_members for select
  using (true);

create policy "signed in can change roster_members"
  on roster_members for all
  to authenticated
  using (true)
  with check (true);

alter table settings enable row level security;

create policy "anyone can read settings"
  on settings for select
  using (true);

create policy "signed in can change settings"
  on settings for all
  to authenticated
  using (true)
  with check (true);

alter table transfer_windows enable row level security;

create policy "anyone can read transfer_windows"
  on transfer_windows for select
  using (true);

create policy "signed in can change transfer_windows"
  on transfer_windows for all
  to authenticated
  using (true)
  with check (true);

alter table transfer_candidates enable row level security;

create policy "anyone can read transfer_candidates"
  on transfer_candidates for select
  using (true);

create policy "signed in can change transfer_candidates"
  on transfer_candidates for all
  to authenticated
  using (true)
  with check (true);

alter table candidate_flags enable row level security;

create policy "anyone can read candidate_flags"
  on candidate_flags for select
  using (true);

create policy "signed in can change candidate_flags"
  on candidate_flags for all
  to authenticated
  using (true)
  with check (true);

alter table blacklist enable row level security;

create policy "anyone can read blacklist"
  on blacklist for select
  using (true);

create policy "signed in can change blacklist"
  on blacklist for all
  to authenticated
  using (true)
  with check (true);

alter table transfer_groups enable row level security;

create policy "anyone can read transfer_groups"
  on transfer_groups for select
  using (true);

create policy "signed in can change transfer_groups"
  on transfer_groups for all
  to authenticated
  using (true)
  with check (true);

alter table facilities enable row level security;

create policy "anyone can read facilities"
  on facilities for select
  using (true);

create policy "signed in can change facilities"
  on facilities for all
  to authenticated
  using (true)
  with check (true);

alter table facility_buffs enable row level security;

create policy "anyone can read facility_buffs"
  on facility_buffs for select
  using (true);

create policy "signed in can change facility_buffs"
  on facility_buffs for all
  to authenticated
  using (true)
  with check (true);

alter table map_objects enable row level security;

create policy "anyone can read map_objects"
  on map_objects for select
  using (true);

create policy "signed in can change map_objects"
  on map_objects for all
  to authenticated
  using (true)
  with check (true);

alter table terrain_marks enable row level security;

create policy "anyone can read terrain_marks"
  on terrain_marks for select
  using (true);

create policy "signed in can change terrain_marks"
  on terrain_marks for all
  to authenticated
  using (true)
  with check (true);

alter table map_removal_requests enable row level security;

create policy "anyone can read map_removal_requests"
  on map_removal_requests for select
  using (true);

create policy "signed in can change map_removal_requests"
  on map_removal_requests for all
  to authenticated
  using (true)
  with check (true);

alter table event_preparation_blocks enable row level security;

create policy "anyone can read event_preparation_blocks"
  on event_preparation_blocks for select
  using (true);

create policy "signed in can change event_preparation_blocks"
  on event_preparation_blocks for all
  to authenticated
  using (true)
  with check (true);

alter table event_preparation_actions enable row level security;

create policy "anyone can read event_preparation_actions"
  on event_preparation_actions for select
  using (true);

create policy "signed in can change event_preparation_actions"
  on event_preparation_actions for all
  to authenticated
  using (true)
  with check (true);
