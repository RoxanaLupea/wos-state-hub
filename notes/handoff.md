# Handover: read this first in a new chat

Written on 24 Nov 2026 at the end of a chat. Do CLAUDE.md's setup, then read this whole
file, then the notes CLAUDE.md lists.

## 1. Where things stand

- main (baacc37 and this handover) is the live site, built and checked on GitHub.
- profile-draft holds the same as main. Design work for the next piece starts there,
  in the workspace; nothing reaches main without Roxanne's yes.
- tools/render/data/ is not in the repo (the repo is public). Fetch it again as
  tools/render/README.md says; the profile needs add-test-player.py.

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
- exalted-skill-levels.sql was run: the table, can_set_skill_levels, set_skill_level,
  and Roxanne's levels copied over.
- skill-levels-in-one-place.sql was run: the old skill level copies on accounts and
  the tiers, skill levels and scores in availability are gone.

Not run, and not to run as they are:
- game-accounts-from-game.sql. It copies name, power and alliance onto the site
  accounts, which the decision of 24 Nov (section 4) replaces. Delete it when that
  work is built.
- The change in game-refresh.sql that makes look_up_game_account return power. The
  add-account form saves power from the lookup today, so new accounts get no power.
  Settle it with the work in section 4, where accounts stop keeping power at all.

## 4. Next work: settled, to build

- An account on the site is only a link from a login to a member the game data already
  has, plus main, alt or farm (and the foundry power, which the game does not give).
  Name, power, alliance and rank come only from the game data; My alliance's Members
  comes from the rosters. Switch every page that reads in_game_name, player_power or
  alliance_id from game_accounts to the game data, then remove those columns (and the
  troop tier columns) with Roxanne's yes.
- Alliance and temporary alliance: the temporary alliance follows the hourly rosters;
  the alliance is replaced only after the account has stayed in the new one for 24
  hours (two reads 12 hours apart, still on that alliance's hourly roster). The player
  can also confirm the move on the site, which replaces it at once.
- Today the roster read only adds players it has not seen, so a known player's own row
  keeps its old alliance until their own read. The alliance rule above needs the
  rosters to record where each account is every hour.
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
