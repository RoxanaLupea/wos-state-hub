# Handover: read this first in a new chat

Written on 24 Nov 2026 at the end of a chat. Do CLAUDE.md's setup, then read this whole
file, then the notes CLAUDE.md lists.

## 1. Where things stand

- main is the live site, built and checked on GitHub.
- profile-draft holds the same as main. Only UI and design work goes there; data and
  database fixes are made on main (CLAUDE.md). Nothing is pushed without Roxanne's yes.
- tools/render/data/ is not in the repo (the repo is public). Fetch it again as
  tools/render/README.md says; the profile needs add-test-player.py, which now brings
  its own made-up game data (players, two rosters, kept alliances).

## 2. Done and live on 24 Nov

- The player page as approved in mockup version 34 (an earlier chat on 24 Nov), then:
  - Troops: each type's name above its picture, 12px on a phone, 15px on a computer,
    the same size in every state.
  - "Update skill level" after TROOPS: Roxanne's edit icon, words running from a
    tint into white. Two states, different colours: normal in the alliance's purple;
    out of date (levels never set, or not changed for over a month, and one under
    Lvl. 3) in red with a small glass red dot at the top of the words.
  - Editing in the same space as the troops: the pictures shrink under their names
    (animated), each Exalted troop's None / Lvl. 1 / Lvl. 2 / Lvl. 3 show under its
    picture as words one under the other, the picked one bold. Cancel (red cross) and
    Save (green tick) replace "Update skill level" on the title line. While out of
    date, Save is lit without changes so a player can confirm levels as they are.
  - On a phone the alliance badge sits in the bottom right of the header, the tag
    above the logo, so the name has the whole width.
  - The profile shows name, picture, power, alliance and rank from the newer of the
    player's own read and their alliance's hourly roster; troops, heroes and boards
    from the player's own read.
  - The dot on the login button is gone (Roxanne never asked for it).
- Skill levels are kept in one place, exalted_skill_levels, per in-game ID. The Tyrant
  availability form no longer asks for tiers or skill levels; the answers read them
  live from the game data and that table.
- Every decision above is in notes/design-decisions.md (Player page, Player data from
  the game).

## 2b. Fourth chat on 24 Nov: merged into main, waiting for Roxanne's yes to push

Everything below was shown to Roxanne and accepted piece by piece. It is on main; ask
once before pushing, then check the build. Work now goes on main; a branch only when
needed (CLAUDE.md). Roxanne asked for the old branches "draft" and "profile-draft" to be
deleted: both are fully in main, but GitHub refused the deletion from Claude's workspace,
so she deletes them on GitHub (or they can stay, unused).

- Calendar grid: day names in capitals, fixed above the weeks; smaller on a phone;
  today's week in sight when the calendar opens.
- The band: the open section shows its logo (Calendar: images/events/calendar.png) and
  full name in its colour, line on the band's edge; "State TRANSFER", "FORTRESS Battles",
  "Frostdragon TYRANT" (the word in capitals in the first colour, the other in the
  second); the pages' own event titles are gone (Tyrant pages show the day only). On a
  computer, page names on the left, the page's controls on the right; the band keeps its
  height with everything centred. Page names scroll sideways on a phone when they do not
  fit.
- Section colours (design-decisions.md, Navigation): one first and one second colour per
  page, everywhere (accent, buttons, marks, pop-ups). Calendar #8BB7F4, Fortress #B0AAF1
  (second 35%), Transfers #F0D99D (second light gold, third #4FA5FC for the Timeline
  highlight), Tyrant #9DDCF0 (second 50%), SvS #8FB5F4 (its logo's blue), Tundra Arms
  League #F0CB9D. State, My alliance and Map use the Calendar's. The rule is measured as
  the accepted colours are: about 75–81% lightness and 72–83% saturation in HSL. The
  player page takes its alliance's colour, evened (src/ui/even-colour.ts).
- Pop-ups in the page's colours: Filters, "Save for which accounts?", the menu under the
  name. The phone's back closes open Filters first.
- Calendar controls as approved: view icons, Filters sheet / panel, Today only when out
  of sight, UTC swaps to MINE, arrows on a computer.
- Timeline: no empty lines; Ours shows only our group's span, other lines faint; opens
  on SvS only, All and Groups.
- Panels always have a gap between them.
- Bear Hunt's short name is BT (data/text/en.json).
- Database, written 24 Nov: the four main alliances' colours, full and lighter (accent):
  DVL #9A6CCF / #C2A4E8, TOP #5582E0 / #93B4F5, SKY #D15B60 / #ED9A9A, RUU #CA6719 /
  #E7A278. The academies take their main's lighter colour (dvl #C2A4E8, top #93B4F5, abc
  #ED9A9A); FUN, which left the state, is grey #8A8F99.

## 3. The database

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

## 4. Next work

- Live since 24 Nov: every page reads name, power and alliance from the game data; My
  alliance's Members comes from the rosters; "my alliance" is the account's kept
  alliance (game_player_alliances). Roxanne's and Tif's accounts are in 1252 (DUB) until
  their transfer, so My alliance shows no alliance of ours for them until then.
- Live since 24 Nov: a move shown as "X > Y" with Dismiss and Confirm, after 2 hours
  (design-decisions.md); on a computer the badge fills the side down to Updated and
  Refresh. profile-draft is the same as main.

## 5. Open

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

## 6. How to work with Roxanne (learnt the hard way on 23 and 24 Nov)

- Start from her references, the notes and what she already decided. Never design from
  a blank page, and never hand her decisions back to her.
- Check every screenshot against notes/review-checklist.md before she sees it. Send
  full screenshots, phone first. Guide lines are for checking only.
- Change only what she asked, in proportion. Do not swing from one extreme to another
  (too little red, then all red). Keep what she already liked.
- Design it: a request is a goal. Bring the designed version, not text styled bare.
- Never state anything unchecked. Check the code and the database before answering;
  say "I don't know" when that is the answer.
- One question per message, short replies, no long lists when she is tired.
- Pushing and database writes only after a clear yes to that exact action. A commit
  message is one short sentence. Check the GitHub build after every push.
- Never keep the same data in two places.
