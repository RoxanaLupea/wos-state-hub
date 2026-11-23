# Handoff from 23 Nov 2026: read this before anything else

Written at the end of the chat of 23 Nov. That chat went very badly. Roxanne spent the
whole day on one page layout, it is still not approved, and she ended it in tears.
Read the whole file, then CLAUDE.md's setup, then notes/profile-draft.md.

## 1. Restore the work first: it is not on GitHub

Nothing from 23 Nov was pushed. GitHub's main is still at 59da789. Everything below
exists only in the bundle file Roxanne was given (wos-state-hub-23nov.bundle):

- main: 13 commits on top of GitHub's main (b8664d9 to 82a74ff). The review checklist,
  the design judgment rules, the notes about the game data, and the database files
  game-data.sql and game-refresh.sql.
- profile-draft: main plus 7 commits (8ec5f60 to 8a99c87, then this handoff). The
  profile draft, exalted-skill-levels.sql, game-accounts-from-game.sql, the render
  tools and the latest mockup (tools/mockups/player-page-v2).

To restore, after cloning as CLAUDE.md says:

    cd /home/claude/wos-state-hub
    git fetch /path/to/wos-state-hub-23nov.bundle main:refs/remotes/bundle/main profile-draft:profile-draft
    git merge --ff-only bundle/main
    git checkout profile-draft

profile-draft must never be pushed: Roxanne wants no draft branches on GitHub. main is
pushed only with her yes, after walking her through it and listing the open items.

## 2. What is in the database already, and what waits for her yes

Installed with her yes on 23 Nov (from game-data.sql and game-refresh.sql):
- The game data tables and their access rules, the Whiteout Stats API key in the Vault
  (whiteout_stats_api_key), and the refresh that runs in the database with pg_cron:
  main alliance rosters every hour, academy rosters and every player twice a day,
  never the same account twice within an hour, the stored answer given instead.
- On 23 Nov at 18:06 UTC: 368 of 527 players fully read, no failed runs.

Not run, each needs her clear yes to that exact action:
- supabase/exalted-skill-levels.sql (profile-draft): the Exalted skill level per troop
  type, set by the owner, or by an R4 or admin when the account has no site account.
- supabase/game-accounts-from-game.sql (profile-draft): name, power and alliance copied
  from the game data into the site's accounts.
- The look_up_game_account change in game-refresh.sql (profile-draft) that also returns
  power.

## 3. Starting point: the player page mockup, version 2

tools/mockups/player-page-v2 on profile-draft. Roxanne has seen its screenshots and has
NOT approved it. It is the starting point, not a settled design.

- build_v2.py writes v2-jump.html and v2-long.html; shoot_v2.py renders them at 390px
  (phone) and 1440px (computer) into screenshots/, and copies with guide lines on the
  picture's edges into /tmp for checking. The guide lines are for Claude, never for her.
- main.css is a copy of the site's built CSS; images links to public/images.
- Two players: JumpMstr (R4 of DVL, FC10, Exalted troops, three accounts) and a
  16-character name with symbols (R1 of the academy dvl, which has no logo, FC8, Tier 10
  troops, no foundry power, viewing their alt).

What it shows, top to bottom:
1. Header, by her rules (section 4).
2. Key figures, taken from her wosoracle reference: Kill Count, Furnace Level, The
   Labyrinth, Migrant Score. Two by two. Each is a label, then the value with its rank
   small after it, written like the power in the header. On a computer they fill the
   right of the header row, on the picture's top and bottom edges.
3. Troops: portrait, FC badge on the corner, the type, then the tier (and the skill
   level on Exalted). The pencil for skill levels shows only when there are Exalted
   troops.
4. Arena team: five heroes with EG level, stars and level. They show the game's hero
   numbers because nothing maps the numbers to names yet.
5. The Labyrinth: the six areas, the stage and the rank, in the key figures' style. The
   total is only in the key figures.
6. Your accounts (a decided part of the page): every account side by side with the
   alliance logo, Main/Alt/Farm, name, ID and power, the one the person is on lit, and
   Add. Tapping one switches to it, so the page has no separate swap control.
7. "Updated 12 min ago" at the bottom.
Computer: under the header, troops over the Labyrinth on the left (three columns each,
lined up), the arena team over Your accounts on the right.

Faults Claude sees in it, to fix or raise before showing it again:
- The heroes are empty tiles with numbers.
- On a computer there is a wide empty gap between the alliance and the key figures.
- "Updated" sits alone at the bottom, and refreshing is not shown.
- The account the person is on is marked only by brighter text.
- Missing states, which a mockup must carry because the code follows the mockup:
  skill levels being set, the note asking for skill levels, adding an account by ID,
  a new account with no game data yet, reporting a wrongly claimed account, an R4 or
  admin setting a member's skill levels, someone else's profile (no Your accounts).

## 4. Decided: her header rules (23 Nov)

1. The picture is as tall as the text on its right.
2. Name, then the ID under it, then the power under that in a bigger font. If there is
   a foundry power, the Foundry logo and the value follow on the power's baseline.
3. The alliance is not bigger than the player and is aligned at the top with the name
   and the picture: logo on the top edge, tag on the bottom edge, a little space
   between, the tag in the normal text colour.
4. A name can be 16 characters long and must fit.
5. "ID" and the number are not the same colour.
6. Nothing sits higher than the picture and the name.
7. The rank (R4) belongs to the person, as a tiny label that takes no row and pushes
   nothing. Not on the picture, not after the name, not on the alliance.
8. The tag stays.
9. No separator lines.

## 5. Decided: her other directions from 23 Nov

- The page has a lot of data; show it. The old draft came from when everything was typed
  by hand.
- Phone: picture on the left with name, ID and power, the alliance on the right, then
  troops, then arena team, then leaderboards.
- Computer: the same layout as the phone; troops and arena heroes on the same line.
- Troop pictures must not be big. Three troops must not take the space of five heroes.
- Use the game's names (Kill Count, Furnace Level, Migrant Score, The Labyrinth, Land of
  Heroes, Cave of Monsters, Charm Mine, Research Center, Gear Forge, Gaia Heart).
- Nothing shown twice. No labels or lists she did not ask for ("did I ask for a list of
  ranks?"). No "in 1458" repeated on labels.
- Exalted skill levels: players with Exalted troops and no level set are asked to put
  them in. Before SvS and Tyrant, players not at Lvl. 3 are asked to update.
- R4s and admins can set skill levels for members with no linked site account.
- Members report a wrongly claimed account; admins handle the reports.
- Never request the same account within an hour; give the last answer instead.

## 6. Her references: use these first

In the attachments (references/), not in the repo because the repo is public:
- game-chief-profile.png: the game's Chief Profile (picture, name with tag, ID, power,
  kills, alliance, state, furnace badge).
- wosoracle-overview-phone.png: wosoracle's player page. Header, chips for state and
  furnace, then a strip of key figures with their rank in the state under them, then
  tabs (Overview, Prep, Heroes & Gear, History).
- wosoracle-history-phone.png: wosoracle's history rows.
She sent these at 17:31 on 23 Nov. They were ignored for the rest of the day.

## 7. How badly the 23 Nov chat went

- Her references were ignored. Claude built layouts from nothing, then at the end
  searched the web for "the best profile pages", brought Discord, Steam and stat
  trackers that are nothing like this page, described pictures it could not see, and
  asked her for screenshots she had already sent.
- Her decisions in the notes were ignored. The mockups dropped Your accounts and put
  the swap back as a control in its own row, both against settled decisions.
- Patches instead of design. Every round fixed one thing and broke another, and she
  found the faults: separator lines everywhere; text not lined up with the picture's
  edges; R4 on the alliance, then on the picture, then after the name; the alliance too
  big and too far; the tag in a mismatched purple; "in 1458" repeated; The Labyrinth
  shown twice; a list of ranks she never asked for; troops bigger than heroes; a
  computer header that made no sense; empty space; guide lines left in screenshots.
- Things she had not asked to change were changed, and versions that were decent in
  some way were lost.
- Mockup data contradicted the game (Exalted troops on an FC8 chief).
- Claude rated its own work 5/10 only when asked, and the faults it listed were faults
  it should have fixed before showing anything.
- Result: a full day on one layout, nothing approved, and the profile, transfer invites
  and alliance pages all still without a layout, though the data for them exists.

## 8. How to work so this does not repeat

- Start from her references and her decisions, never from a blank page.
- Read notes/review-checklist.md and check every screenshot against it, with guide
  lines, before she sees it. Send only the clean full-screen screenshots.
- Show finished versions, not patches. Change only what she pointed at, in proportion,
  and keep everything she already liked.
- A mockup carries every part and state the real page will have.
- Mockup data must be true to the game's rules.
- One question per message, and only about what is genuinely open.
- When unsure whether a source matches what she asked for, say so instead of guessing.
  Never describe a picture that was not seen.

## 9. Still open

- The player page layout (version 2 above is the starting point).
- Layouts for the transfer invites page and the alliance page.
- Hero numbers to names and portraits (portraits exist in public/images/heroes).
- When the SvS and Tyrant skill note shows: 3 days before the start until the end was
  proposed; she has not answered.
- Exalted shown at FC8 and FC9 in the game data, against the rule that Exalted is only
  on FC10.
- The R4s' page for setting members' skill levels (My alliance > Members).
- Troop tier colours (notes/profile-draft.md).
- Where the refresh and "Updated" sit on the page.
