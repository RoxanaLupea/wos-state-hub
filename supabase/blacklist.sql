-- The state's blacklist (Roxanne, 26 Nov): "we will add a blacklist, but it should be on the
-- state page, even if we don't have it yet, we can add it in the database so we can show the
-- flag, it's gonna start with id and reason and whatever else it has". The page comes later;
-- the lists read it to flag a blacklisted player. Run after schema.sql. Safe to run again.

create table if not exists public.state_blacklist (
  player_id   bigint primary key,
  -- The name as it was written when the player was added.
  name        text,
  reason      text,
  -- Where it came from, such as the old transfer sheet.
  source      text,
  added_by    uuid,
  added_at    timestamptz not null default now()
);

alter table public.state_blacklist enable row level security;

drop policy if exists "anyone reads the blacklist" on public.state_blacklist;
create policy "anyone reads the blacklist" on public.state_blacklist for select using (true);

drop policy if exists "admins change the blacklist" on public.state_blacklist;
create policy "admins change the blacklist" on public.state_blacklist for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
