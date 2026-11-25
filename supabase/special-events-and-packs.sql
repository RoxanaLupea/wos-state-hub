-- Special events, Hero Ascension Training and the four packs (25 Nov). Run once, together
-- with the push that adds their event types to the catalog; before it the live site would
-- not know them. Web dates name their source in the note; game dates are Roxanne's.
insert into schedules (id, event_type_id, first_date, repeat_every_days, length_days, note, dates_are_estimated, updated_by, updated_at) values
  ('sp-lny-2025', 'lunar-new-year', '2025-01-22', 0, 8, 'Gilded Jade, from Out of Games', false, '1096141f-8fab-4476-9b28-f707e86731da', now()),
  ('sp-lny-2026', 'lunar-new-year', '2026-02-15', 0, 8, 'From Altema', false, '1096141f-8fab-4476-9b28-f707e86731da', now()),
  ('sp-lny-2027', 'lunar-new-year', '2027-02-03', 0, 8, 'Estimated around the Lunar New Year, 6 Feb', true, '1096141f-8fab-4476-9b28-f707e86731da', now()),
  ('sp-val-2025', 'valentines', '2025-02-11', 0, 7, 'Romance of the Snow, from Out of Games', false, '1096141f-8fab-4476-9b28-f707e86731da', now()),
  ('sp-val-2026', 'valentines', '2026-02-10', 0, 5, 'From the Whiteout Survival Wiki', false, '1096141f-8fab-4476-9b28-f707e86731da', now()),
  ('sp-val-2027', 'valentines', '2027-02-10', 0, 5, 'Estimated from 2026', true, '1096141f-8fab-4476-9b28-f707e86731da', now()),
  ('sp-lantern-2026', 'lantern-of-blessings', '2026-02-18', 0, 30, 'From Altema', false, '1096141f-8fab-4476-9b28-f707e86731da', now()),
  ('sp-lantern-2027', 'lantern-of-blessings', '2027-02-08', 0, 30, 'Estimated from Ramadan 2027', true, '1096141f-8fab-4476-9b28-f707e86731da', now()),
  ('sp-anniv-2025', 'anniversary', '2025-03-06', 0, 8, 'Dawn Feasts, from BlueStacks', false, '1096141f-8fab-4476-9b28-f707e86731da', now()),
  ('sp-anniv-2026', 'anniversary', '2026-03-06', 0, 7, 'From Altema', false, '1096141f-8fab-4476-9b28-f707e86731da', now()),
  ('sp-anniv-2027', 'anniversary', '2027-03-06', 0, 7, 'Estimated from 2026', true, '1096141f-8fab-4476-9b28-f707e86731da', now()),
  ('sp-easter-2026', 'easter', '2026-04-01', 0, 7, 'Easter Egg Wonderland, from BitTopup', false, '1096141f-8fab-4476-9b28-f707e86731da', now()),
  ('sp-easter-2027', 'easter', '2027-03-24', 0, 7, 'Estimated around Easter, 28 Mar', true, '1096141f-8fab-4476-9b28-f707e86731da', now()),
  ('sp-moon-2026', 'moonlight-festival', '2026-09-21', 0, 7, 'From Mone and Heaven Guardian', false, '1096141f-8fab-4476-9b28-f707e86731da', now()),
  ('sp-moon-2027', 'moonlight-festival', '2027-09-11', 0, 7, 'Estimated around the Mid-Autumn Festival, 15 Sep', true, '1096141f-8fab-4476-9b28-f707e86731da', now()),
  ('sp-halloween-2025', 'halloween', '2025-10-29', 0, 7, 'From BlueStacks', false, '1096141f-8fab-4476-9b28-f707e86731da', now()),
  ('sp-halloween-2026', 'halloween', '2026-10-27', 0, 7, 'Halloween Party, from Out of Games', false, '1096141f-8fab-4476-9b28-f707e86731da', now()),
  ('sp-halloween-2027', 'halloween', '2027-10-26', 0, 7, 'Estimated from 2026', true, '1096141f-8fab-4476-9b28-f707e86731da', now()),
  ('sp-harvest-2026', 'harvest-festival', '2026-11-24', 0, 7, 'Harvests and Feasts, seen in game', false, '1096141f-8fab-4476-9b28-f707e86731da', now()),
  ('sp-harvest-2027', 'harvest-festival', '2027-11-23', 0, 7, 'Estimated around Thanksgiving, 25 Nov', true, '1096141f-8fab-4476-9b28-f707e86731da', now()),
  ('sp-christmas-2025', 'christmas', '2025-12-23', 0, 8, 'From BlueStacks', false, '1096141f-8fab-4476-9b28-f707e86731da', now()),
  ('sp-christmas-2026', 'christmas', '2026-12-23', 0, 8, 'Estimated from 2025', true, '1096141f-8fab-4476-9b28-f707e86731da', now()),
  ('s-hero-ascension-2026-11', 'hero-ascension-training', '2026-11-23', 0, 28, 'Seen in game', false, '1096141f-8fab-4476-9b28-f707e86731da', now()),
  ('s-mix-match-2026-11', 'mix-and-match', '2026-11-23', 0, 3, 'Seen in game; start day as remembered', false, '1096141f-8fab-4476-9b28-f707e86731da', now()),
  ('s-pet-chest-2026-11', 'custom-pet-chest', '2026-11-23', 0, 7, 'Seen in game; start day as remembered', false, '1096141f-8fab-4476-9b28-f707e86731da', now()),
  ('s-artisans-trove-2026-11', 'artisans-trove', '2026-11-25', 0, 2, 'Seen in game from 25 Nov; start not known', false, '1096141f-8fab-4476-9b28-f707e86731da', now()),
  ('s-gear-special-2026-11', 'exclusive-gear-enhancement', '2026-11-25', 0, 5, 'Seen in game from 25 Nov; start not known', false, '1096141f-8fab-4476-9b28-f707e86731da', now())
on conflict (id) do nothing;
