-- The transfer dates the site lists (owner, 24 Nov): one row per date, so the page no
-- longer downloads all of transfer_groups (5,826 rows) to find the 66 dates. The groups
-- change rarely (about twice a year). Safe to run again.
create or replace function public.transfer_dates() returns setof date
language sql stable as $$
  select distinct transfer_date from transfer_groups order by transfer_date
$$;
grant execute on function public.transfer_dates() to anon, authenticated;
