-- Who may change what, by role. Replaces access-while-solo.sql once sign-in is open to
-- everyone. Run it only after the owner's own role is in account_roles, or nobody can
-- change anything. Safe to run again.
--
-- owner             sets event dates and repeats
-- admin             can edit anything (the owner counts as an admin)
-- alliance_manager  an alliance's R4s and R5s, for that alliance: its own times, its
--                   results and records, opponent notes, linking its academies
-- state_manager     the state's planning except battles: forts, facilities, the map
-- battle_manager    the battles: rosters and plans
-- member            a signed-in player: their own account, answers and entries
--
-- Reading: what every player sees stays readable by anyone. Personal information
-- (accounts, availability, transfer candidates, the blacklist, incidents, opponent notes,
-- personal entries) is read only by signed-in people, and some of it only by its owner.

-- ---------------------------------------------------------------------------
-- Who the signed-in person is
-- ---------------------------------------------------------------------------

create or replace function public.has_any_role(wanted text[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from account_roles where account_id = auth.uid() and role = any (wanted));
$$;

create or replace function public.is_owner() returns boolean language sql stable as $$
  select public.has_any_role(array['owner']);
$$;

create or replace function public.is_admin() returns boolean language sql stable as $$
  select public.has_any_role(array['owner', 'admin']);
$$;

create or replace function public.manages_state() returns boolean language sql stable as $$
  select public.has_any_role(array['owner', 'admin', 'state_manager']);
$$;

create or replace function public.manages_battles() returns boolean language sql stable as $$
  select public.has_any_role(array['owner', 'admin', 'battle_manager']);
$$;

-- An admin, or an alliance manager of this alliance.
create or replace function public.leads_alliance(alliance text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (
    select 1 from account_roles
    where account_id = auth.uid() and role = 'alliance_manager' and alliance_id = alliance);
$$;

-- An admin, or an alliance manager of any alliance.
create or replace function public.leads_any_alliance() returns boolean language sql stable as $$
  select public.has_any_role(array['owner', 'admin', 'alliance_manager']);
$$;

-- An admin, or a manager of one of the alliances in a schedule's list ("dvl,top").
create or replace function public.leads_schedule_alliances(alliance_list text)
returns boolean language sql stable as $$
  select public.is_admin() or exists (
    select 1 from unnest(string_to_array(coalesce(alliance_list, ''), ',')) as one
    where length(trim(one)) > 0 and public.leads_alliance(trim(one)));
$$;

-- ---------------------------------------------------------------------------
-- Start from nothing: every existing rule on these tables is removed.
-- ---------------------------------------------------------------------------

do $$
declare
  rule record;
begin
  for rule in
    select policyname, tablename from pg_policies where schemaname = 'public'
  loop
    execute format('drop policy if exists %I on public.%I', rule.policyname, rule.tablename);
  end loop;
end $$;

-- Every public table keeps its access rules switched on.
do $$
declare
  one record;
begin
  for one in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', one.tablename);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Readable by anyone
-- ---------------------------------------------------------------------------

do $$
declare
  name text;
begin
  foreach name in array array[
    'alliances', 'schedules', 'event_occurrences', 'settings', 'transfer_groups', 'transfer_windows',
    'fort_assignments', 'fort_plans', 'rally_leads', 'buff_allocations', 'facilities', 'facility_buffs',
    'map_objects', 'terrain_marks', 'results', 'result_details', 'result_opponents', 'alliance_records',
    'rosters', 'roster_members', 'plans', 'plan_templates', 'event_preparation_blocks',
    'event_preparation_actions', 'occurrence_state_alliances', 'account_roles'
  ] loop
    if exists (select 1 from pg_tables where schemaname = 'public' and tablename = name) then
      execute format('create policy "anyone can read %s" on public.%I for select using (true)', name, name);
    end if;
  end loop;
end $$;

-- A draft plan is seen only by those who plan.
drop policy if exists "anyone can read plans" on plans;
create policy "anyone can read published plans" on plans for select
  using (status = 'published' or public.manages_battles());

-- ---------------------------------------------------------------------------
-- Readable by signed-in people
-- ---------------------------------------------------------------------------

create policy "signed in can read accounts" on accounts for select to authenticated using (true);
create policy "signed in can read account_alt_accounts" on account_alt_accounts for select to authenticated using (true);
create policy "signed in can read availability" on availability for select to authenticated using (true);
create policy "signed in can read availability_times" on availability_times for select to authenticated using (true);
create policy "signed in can read transfer_candidates" on transfer_candidates for select to authenticated using (true);
create policy "signed in can read candidate_flags" on candidate_flags for select to authenticated using (true);
create policy "admins read the blacklist" on blacklist for select to authenticated using (public.leads_any_alliance());
create policy "signed in can read fort_incidents" on fort_incidents for select to authenticated using (true);
create policy "leaders read opponent_notes" on opponent_notes for select to authenticated using (public.leads_any_alliance());
create policy "each reads their own personal_entries" on personal_entries for select to authenticated using (account_id = auth.uid());
create policy "signed in can read map_removal_requests" on map_removal_requests for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- Changing
-- ---------------------------------------------------------------------------

-- A person's own account, farms and alts, answers and entries.
create policy "each changes their own account" on accounts for all to authenticated
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
create policy "each changes their own alts" on account_alt_accounts for all to authenticated
  using (account_id = auth.uid() or public.is_admin()) with check (account_id = auth.uid() or public.is_admin());
create policy "each changes their own availability" on availability for all to authenticated
  using (account_id = auth.uid() or public.manages_battles()) with check (account_id = auth.uid() or public.manages_battles());
create policy "each changes their own availability_times" on availability_times for all to authenticated
  using (exists (select 1 from availability a where a.id = availability_id and (a.account_id = auth.uid() or public.manages_battles())))
  with check (exists (select 1 from availability a where a.id = availability_id and (a.account_id = auth.uid() or public.manages_battles())));
create policy "each changes their own personal_entries" on personal_entries for all to authenticated
  using (account_id = auth.uid()) with check (account_id = auth.uid());

-- Roles: admins give and take them; only the owner gives or takes owner and admin.
create policy "admins change roles" on account_roles for all to authenticated
  using (public.is_owner() or (public.is_admin() and role not in ('owner', 'admin')))
  with check (public.is_owner() or (public.is_admin() and role not in ('owner', 'admin')));

-- Event dates: the owner sets dates and repeats; alliance managers change their own
-- alliance's times; admins change one date.
create policy "owner and leaders change schedules" on schedules for update to authenticated
  using (public.is_owner() or (alliance_ids is not null and public.leads_schedule_alliances(alliance_ids)))
  with check (public.is_owner() or (alliance_ids is not null and public.leads_schedule_alliances(alliance_ids)));
create policy "owner adds and removes schedules" on schedules for insert to authenticated with check (public.is_owner());
create policy "owner removes schedules" on schedules for delete to authenticated using (public.is_owner());
create policy "admins change one date" on event_occurrences for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Alliances: admins; an alliance manager links or unlinks its own academies.
create policy "admins change alliances" on alliances for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "leaders link academies" on alliances for update to authenticated
  using (public.leads_any_alliance())
  with check (main_alliance_id is null or public.leads_alliance(main_alliance_id));

-- The state's planning except battles.
do $$
declare
  name text;
begin
  foreach name in array array[
    'fort_assignments', 'fort_plans', 'rally_leads', 'buff_allocations', 'fort_incidents',
    'facilities', 'map_objects', 'terrain_marks'
  ] loop
    execute format('create policy "state managers change %s" on public.%I for all to authenticated ' ||
      'using (public.manages_state()) with check (public.manages_state())', name, name);
  end loop;
end $$;
create policy "anyone signed in asks to remove a map mark" on map_removal_requests for insert to authenticated
  with check (requested_by = auth.uid());
create policy "state managers decide map removals" on map_removal_requests for update to authenticated
  using (public.manages_state()) with check (public.manages_state());

-- Battles.
do $$
declare
  name text;
begin
  foreach name in array array['rosters', 'roster_members', 'plans', 'plan_templates', 'occurrence_state_alliances'] loop
    execute format('create policy "battle managers change %s" on public.%I for all to authenticated ' ||
      'using (public.manages_battles()) with check (public.manages_battles())', name, name);
  end loop;
end $$;

-- Results: a state result by admins, an alliance's own by its managers.
create policy "results by who owns them" on results for all to authenticated
  using (case when alliance_id is null then public.is_admin() else public.leads_alliance(alliance_id) end)
  with check (case when alliance_id is null then public.is_admin() else public.leads_alliance(alliance_id) end);
create policy "result_details with their result" on result_details for all to authenticated
  using (exists (select 1 from results r where r.id = result_id and
    case when r.alliance_id is null then public.is_admin() else public.leads_alliance(r.alliance_id) end))
  with check (exists (select 1 from results r where r.id = result_id and
    case when r.alliance_id is null then public.is_admin() else public.leads_alliance(r.alliance_id) end));
create policy "result_opponents with their result" on result_opponents for all to authenticated
  using (exists (select 1 from results r where r.id = result_id and
    case when r.alliance_id is null then public.is_admin() else public.leads_alliance(r.alliance_id) end))
  with check (exists (select 1 from results r where r.id = result_id and
    case when r.alliance_id is null then public.is_admin() else public.leads_alliance(r.alliance_id) end));
create policy "leaders change their alliance_records" on alliance_records for all to authenticated
  using (public.leads_alliance(alliance_id)) with check (public.leads_alliance(alliance_id));
create policy "leaders write opponent_notes" on opponent_notes for all to authenticated
  using (public.is_admin() or public.leads_alliance(alliance_id))
  with check (public.is_admin() or public.leads_alliance(alliance_id));

-- Transfers: R4s add people, any member flags someone, admins run the window.
create policy "admins change transfer windows" on transfer_windows for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "leaders change transfer candidates" on transfer_candidates for all to authenticated
  using (public.leads_any_alliance()) with check (public.leads_any_alliance());
create policy "members flag candidates" on candidate_flags for insert to authenticated
  with check (flagged_by = auth.uid());
create policy "admins change the blacklist" on blacklist for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Settings, transfer groups, the preparation blocks: admins.
do $$
declare
  name text;
begin
  foreach name in array array['settings', 'transfer_groups', 'event_preparation_blocks', 'event_preparation_actions', 'facility_buffs'] loop
    execute format('create policy "admins change %s" on public.%I for all to authenticated ' ||
      'using (public.is_admin()) with check (public.is_admin())', name, name);
  end loop;
end $$;

-- Visitors who are not signed in no longer read the private tables at all.
revoke select on accounts, account_alt_accounts, availability, availability_times, transfer_candidates,
  candidate_flags, blacklist, fort_incidents, opponent_notes, personal_entries from anon;
