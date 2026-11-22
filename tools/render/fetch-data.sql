-- Run this with the Supabase tool (execute_sql, project wos-state-hub) and save the one
-- value it returns as tools/render/data/main.json (about 55 KB). These are the tables
-- the site reads; when the site starts reading another table, add it here.
-- Of transfer_groups (over 1 MB) only 1458's own rows are fetched: the calendar needs
-- them for the hero generation on each date. To render the Transfers page with every
-- state, fetch the whole table in parts (order by, limit, offset) and put it in
-- "transfer_groups" in main.json instead.
select json_build_object(
  'alliances',           coalesce((select json_agg(t) from alliances t), '[]'),
  'schedules',           coalesce((select json_agg(t) from schedules t), '[]'),
  'event_occurrences',   coalesce((select json_agg(t) from event_occurrences t), '[]'),
  'settings',            coalesce((select json_agg(t) from settings t), '[]'),
  'transfer_windows',    coalesce((select json_agg(t) from transfer_windows t), '[]'),
  'transfer_candidates', coalesce((select json_agg(t) from transfer_candidates t), '[]'),
  'fort_assignments',    coalesce((select json_agg(t) from fort_assignments t), '[]'),
  'rally_leads',         coalesce((select json_agg(t) from rally_leads t), '[]'),
  'buff_allocations',    coalesce((select json_agg(t) from buff_allocations t), '[]'),
  'facilities',          coalesce((select json_agg(t) from facilities t), '[]'),
  'facility_buffs',      coalesce((select json_agg(t) from facility_buffs t), '[]'),
  'transfer_groups',     coalesce((select json_agg(t) from transfer_groups t
                                   where from_state <= 1458 and to_state >= 1458), '[]')
) as tables;
