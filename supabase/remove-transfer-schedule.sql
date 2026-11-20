-- The State Transfer has no schedule of its own. It opens the day after each SvS
-- Battle, or after each Sunfire Castle once the transferFollows setting is switched,
-- and the site works that out from those dates. The row added earlier duplicated it,
-- which put the transfer on the calendar twice.
delete from schedules where id = 's-transfer';
