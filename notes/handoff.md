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
