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

## 3. The database

Live and checked on 24 Nov:
- Game data tables and the refresh jobs (game-data.sql, game-refresh.sql): main
  alliance rosters every hour, academies and every player twice a day, never the same
  account twice within an hour.
- exalted-skill-levels.sql and skill-levels-in-one-place.sql were run: skill levels are
  kept per in-game ID in exalted_skill_levels only.

Written on 24 Nov (second chat), waiting for Roxanne's yes, to run after the push:
- supabase/accounts-from-game.sql. Accounts keep only what is typed on the site; the
  copies of name, power, alliance and tiers go from game_accounts and accounts, and
  account_alt_accounts goes. Each player's alliance is kept in game_player_alliances,
  with a counter only while a change is under way; reads write only when something
  changes;
  confirm_alliance_move lets the owner or an admin confirm a move. Players read their own
  accounts' game data even while not state members.
- Order: push the site first (it already reads the game data and works without the new
  table), then run the file.

## 4. Next work

- Built on main on 24 Nov, not pushed yet: every page reads name, power and alliance
  from the game data; My alliance's Members comes from the rosters; "my alliance" is the
  account's kept alliance (game_player_alliances). game-accounts-from-game.sql is deleted.
- Still to do: showing a move as "X > Y" with a Confirm button (design-decisions.md),
  UI work on the draft branch.
- The computer layout of the header badge (it is still top right there).

## 5. Open

- The pages still to lay out: the alliance page, the transfer Invites page, the State
  page (its leaderboards are listed as open in design-decisions.md).
- Exalted shown at FC8 and FC9 in the game data, against the rule that Exalted is only
  on FC10.
- R4s setting their members' skill levels (the database allows it; the page for it,
  My alliance > Members, is not built).
- 13 hero cards not matched to hero numbers yet (design-decisions.md, Open).
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
