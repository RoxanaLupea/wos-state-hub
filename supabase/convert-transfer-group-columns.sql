-- Turns the two text columns in transfer_groups into numbers the site can sort and
-- compare. Safe to run whether or not the earlier version of this file was run.
--
-- Hero generation was stored as "Gen 11", which sorts "Gen 9" after "Gen 11".
-- Nine old rows say "Gen 1/2", meaning it was not settled yet for states that were
-- new at the time. Those become 1.
--
-- The furnace cap becomes a position on one ladder, counted in upgrades: one upgrade
-- per furnace level up to 30, then five per Fire Crystal level, so FC1 is 35 and FC10
-- is 80. The War Academy and Red Chief Gear unlock during FC5 and sit between FC5 and
-- FC6, so they take the spare numbers 56 and 57. Those two are positions rather than
-- real upgrade counts, since both are unlocks rather than furnace levels.
--
--   30  Furnace 30
--   45  FC3
--   55  FC5
--   56  FC5, Red Chief Gear
--   57  FC5, War Academy
--   70  FC8
--   80  FC10

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'transfer_groups' and column_name = 'furnace_cap'
  ) then

    -- The earlier version was not run. Convert from the original text.
    update transfer_groups set generation = 'Gen 1' where generation = 'Gen 1/2';

    alter table transfer_groups
      alter column generation type integer
      using nullif(regexp_replace(generation, '[^0-9]', '', 'g'), '')::integer;

    alter table transfer_groups rename column furnace_cap to furnace_cap_upgrades;

    alter table transfer_groups
      alter column furnace_cap_upgrades type integer
      using case furnace_cap_upgrades
        when '5-War Acad' then 57
        when '5-RedCG'    then 56
        -- Anything above 10 is a plain furnace level, so the number is the count.
        -- Anything up to 10 is a Fire Crystal level: 30 upgrades, then five per level.
        else case when furnace_cap_upgrades::integer > 10
                  then furnace_cap_upgrades::integer
                  else 30 + furnace_cap_upgrades::integer * 5 end
      end;

  else

    -- The earlier version was run, so the numbers are already there but the two
    -- unlocks were kept in their own columns. Move them onto the ladder and drop them.
    update transfer_groups set furnace_cap_upgrades = 57 where has_war_academy;
    update transfer_groups set furnace_cap_upgrades = 56 where has_red_chief_gear;

    alter table transfer_groups drop column has_war_academy;
    alter table transfer_groups drop column has_red_chief_gear;

  end if;
end $$;
