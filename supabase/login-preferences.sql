-- The player's choices kept with their login (owner, 24 Nov): the calendar's filters and
-- view, UTC or their own time, the account they are on, the Transfers page's switches.
-- Kept on the device too; with the login they follow the player to every device.
-- In a table of its own, because everyone signed in can read accounts, and a player's
-- choices are only theirs. Safe to run again.

create table if not exists public.login_preferences (
  account_id uuid primary key references public.accounts(id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.login_preferences enable row level security;

drop policy if exists "each keeps their own choices" on public.login_preferences;
create policy "each keeps their own choices" on public.login_preferences
  for all to authenticated
  using (account_id = auth.uid())
  with check (account_id = auth.uid());

revoke all on public.login_preferences from anon;
grant select, insert, update on public.login_preferences to authenticated;
