-- Skill levels are kept in one place only: per in-game ID in exalted_skill_levels (run
-- exalted-skill-levels.sql first; it copied the levels typed on accounts there). The
-- copies on the site accounts and in event availability answers go. Availability answers
-- keep only the hours and choices; the site shows each player's troops from the game and
-- skill levels from exalted_skill_levels, as they are now (owner, 24 Nov).

alter table public.game_accounts
  drop column if exists infantry_skill_level,
  drop column if exists lancer_skill_level,
  drop column if exists marksmen_skill_level;

alter table public.accounts
  drop column if exists infantry_skill_level,
  drop column if exists lancer_skill_level,
  drop column if exists marksmen_skill_level;

alter table public.availability
  drop column if exists infantry_tier,
  drop column if exists infantry_skill_level,
  drop column if exists lancer_tier,
  drop column if exists lancer_skill_level,
  drop column if exists marksmen_tier,
  drop column if exists marksmen_skill_level,
  drop column if exists infantry_score,
  drop column if exists lancer_score,
  drop column if exists marksmen_score,
  drop column if exists total_troop_score;

notify pgrst, 'reload schema';
