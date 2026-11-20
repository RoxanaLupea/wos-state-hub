-- Puts the War Academy and Red Chief Gear onto the same ladder as everything else.
--
-- The earlier conversion kept them in two columns of their own, which lost their
-- place in the order. They are rungs between FC5 and FC6, so they take the spare
-- numbers between 55 and 60:
--
--   30  Furnace 30
--   45  FC3
--   55  FC5
--   56  FC5, Red Chief Gear
--   57  FC5, War Academy
--   70  FC8
--   80  FC10
--
-- 56 and 57 are positions rather than real upgrade counts, since both are unlocks
-- rather than furnace levels. Nothing adds these up, so that costs nothing.

update transfer_groups set furnace_cap_upgrades = 56 where has_red_chief_gear;
update transfer_groups set furnace_cap_upgrades = 57 where has_war_academy;

alter table transfer_groups drop column has_red_chief_gear;
alter table transfer_groups drop column has_war_academy;
