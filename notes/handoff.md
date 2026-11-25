# Handover: where the work stands

Do CLAUDE.md's setup first. Updated 25 Nov 2026.

## Now

- main is the live site, built and checked on GitHub. Only main is on GitHub.
- Next: the SvS results panel on the SvS event's Results tab, designed from the game
  screens Roxanne sends.
- Roxanne's and Tif's accounts are in 1252 (DUB) until their transfer to 1458.

## The database

Live and checked on 24 Nov:
- Game data tables and the refresh jobs (game-data.sql, game-refresh.sql): main
  alliance rosters every hour, academies and every player twice a day, never the same
  account twice within an hour.
- exalted-skill-levels.sql and skill-levels-in-one-place.sql were run: skill levels are
  kept per in-game ID in exalted_skill_levels only.

Run on 24 Nov (second chat), after the push, and checked:
- supabase/accounts-from-game.sql. Accounts keep only what is typed on the site; the
  copies of name, power, alliance and tiers are gone from game_accounts and accounts,
  and account_alt_accounts is gone. Each player's alliance is kept in
  game_player_alliances (573 players filled from the rosters and reads), with a counter
  only while a change is under way; reads write only when something changes.
  confirm_alliance_move and dismiss_alliance_move (3 days) are for the account's owner,
  its R4s and admins. Players read their own accounts' game data even while not state
  members. The 14:10 UTC roster read ran through it without errors.

Run on 24 Nov (third chat), before the push:
- supabase/fresh-reads.sql. Refresh stayed on "Updating" for hours: a not-fresh answer
  (the API still reading the game) was kept as new and asked again only an hour later,
  when it was old again. Now it is asked again the next minute, for 10 minutes, then
  hourly until fresh; rosters too (new job game-roster-retries). game_read_at (the API's
  cached_at) is what "Updated" and Refresh go by; read_at is when the site asked. The
  page looks again every minute while an account shows Updating.
- The old branch "draft" (21 Nov) is fully in main and is not used.
- supabase/login-preferences.sql: the player's choices (calendar filters, time, account,
  the Transfers switches) kept with the login in login_preferences (owner-only), and on
  the device. Start-up reads in two parallel rounds instead of 11 in a row; a reload keeps
  the profile open. Add account accepts any ID the game has (no digit pattern).
- Later on 24 Nov: supabase/account-kinds.sql (Edit accounts saves Main / Alt / Farm
  together), supabase/state-ranks.sql (our state's boards hourly; other states where a
  site account is, once a day or on a refresh, no daily copies; the page asks only for its
  accounts' ranks through game_state_ranks) and supabase/look-up-account.sql (a newly
  added account is read in full at the next minute).
- Live on 24 Nov: Edit accounts; the menu without the account list; "Save for which
  accounts?" on availability; hero cards for Gen 8 to 12 matched to hero numbers.
- Open: hero numbers before Gen 8 (except Wu Ming, Edith) not matched to cards; the 13
  epic and rare cards still need names; pop-ups to be designed.

## Open

- The pages still to lay out: the alliance page, the transfer Invites page, the State
  page (its leaderboards are listed as open in design-decisions.md).
- Exalted shown at FC8 and FC9 in the game data, against the rule that Exalted is only
  on FC10.
- R4s setting their members' skill levels (the database allows it; the page for it,
  My alliance > Members, is not built).
- 13 hero cards not matched to hero numbers yet (design-decisions.md, Open).
- The calendar controls on a computer were shown (cal-desk) but not separately approved.
- Tundra Arms League's amber is "good enough" and close to the Transfers gold.
- Lazy-loading data/text/en.json and rewards.json (event tabs must not lag).
- The hero form question: which form with all heroes Roxanne meant (unanswered).
- The render copy's transfer dates (tools/render/data) are made up and not linked to
  SvS, so SvS-only shows nothing there.
- Everything else under Open in notes/design-decisions.md.
