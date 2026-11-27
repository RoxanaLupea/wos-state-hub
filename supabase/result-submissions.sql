-- Results a member submits for an R4 of their alliance to approve, kept as tickets
-- (Roxanne, 27 Nov). The member who sent one and the alliance's R4s (and admins) read it;
-- the R4s approve or reject it, and the result is saved when they approve. Safe to run again.
create table if not exists result_submissions (
  id                      bigserial primary key,
  event_type_id           text not null,
  event_date              date not null,
  alliance_id             text not null references alliances (id),
  -- What was typed in the result's form: each field's name with its values.
  fields                  jsonb not null,
  submitted_by            uuid not null default auth.uid(),
  submitted_at            timestamptz not null default now(),
  status                  text not null default 'open' check (status in ('open', 'approved', 'rejected')),
  resolved_by             uuid,
  resolved_at             timestamptz
);

alter table result_submissions enable row level security;

drop policy if exists "members submit their own" on result_submissions;
create policy "members submit their own" on result_submissions for insert to authenticated
  with check (submitted_by = auth.uid() and status = 'open');
drop policy if exists "the submitter and the alliance's leaders read" on result_submissions;
create policy "the submitter and the alliance's leaders read" on result_submissions for select to authenticated
  using (submitted_by = auth.uid() or leads_alliance(alliance_id));
drop policy if exists "the alliance's leaders resolve" on result_submissions;
create policy "the alliance's leaders resolve" on result_submissions for update to authenticated
  using (leads_alliance(alliance_id)) with check (leads_alliance(alliance_id));

grant select, insert, update on result_submissions to authenticated;
grant usage, select on sequence result_submissions_id_seq to authenticated;
