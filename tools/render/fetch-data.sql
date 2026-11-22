-- Run this with the Supabase tool (execute_sql, project wos-state-hub) and save the one
-- value it returns as tools/render/data/main.json (about 55 KB). These are the tables
-- the site reads; when the site starts reading another table, add it here.
-- transfer_groups is left out: it is over 1 MB and only the Transfers page uses it. To
-- render that page, fetch it in parts (order by, limit, offset) and add it as
-- "transfer_groups" in main.json.
select json_build_object(
  'alliances',           coalesce((select json_agg(t) from alliances t), '[]'),
  'schedules',           coalesce((select json_agg(t) from schedules t), '[]'),
  'event_occurrences',   coalesce((select json_agg(t) from event_occurrences t), '[]'),
  'settings',            coalesce((select json_agg(t) from settings t), '[]'),
  'transfer_windows',    coalesce((select json_agg(t) from transfer_windows t), '[]'),
  'transfer_candidates', coalesce((select json_agg(t) from transfer_candidates t), '[]'),
  'fort_assignments',    coalesce((select json_agg(t) from fort_assignments t), '[]'),
  'rally_leads',         coalesce((select json_agg(t) from rally_leads t), '[]'),
  'buff_allocations',    coalesce((select json_agg(t) from buff_allocations t), '[]')
) as tables;
