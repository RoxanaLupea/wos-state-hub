-- An alliance's plan for an event, set by its R4s and kept for every run of that event
-- after (Roxanne, 27 Nov): one text per event, by the event's id. Safe to run again.
alter table alliance_records add column if not exists event_notes jsonb not null default '{}';
