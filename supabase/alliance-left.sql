-- An alliance that leaves the state is marked with the day it left instead of being
-- deleted, so its name stays on the records it is part of, such as the forts it held.
-- FUN left 1458 in the transfer that started on 9 Nov 2026: its event times go,
-- the alliance itself stays.
alter table alliances add column if not exists left_on date;

update alliances set left_on = '2026-11-09' where id = 'fun';

delete from schedules where id like 'd-fun-%';
