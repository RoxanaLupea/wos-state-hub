# Handoff from 23 Nov 2026: read this before anything else

Written at the end of the chat of 23 Nov. That chat went very badly. Roxanne spent the
whole day on one page layout, it is still not approved, and she ended it in tears.
Read the whole file, then do CLAUDE.md's setup, then read notes/profile-draft.md.

## 1. Where the work is

All of the work is on GitHub, on the branch profile-draft (pushed with Roxanne's yes on
23 Nov at 21:30). Check it out after cloning:

    cd /home/claude/wos-state-hub
    git fetch origin profile-draft:profile-draft
    git checkout profile-draft

- GitHub's main is at 59da789 (CLAUDE.md, pushed 23 Nov at 16:48) and is the live site.
- profile-draft holds main plus 13 commits that are not on GitHub's main yet (b8664d9 to
  82a74ff: the review checklist, the design judgment rules, the notes about the game
  data, admin-tools.sql, game-data.sql and game-refresh.sql), then the profile draft,
  exalted-skill-levels.sql, game-accounts-from-game.sql, the render tools, the mockup
  in tools/mockups/player-page-v2 and these notes.
- The site's build runs only for main, so nothing on profile-draft is on the live site.
  Pushing to main needs her yes, after walking her through it and listing the open items.
- Roxanne wants the work carried between chats through CLAUDE.md and this branch, not
  through zip or bundle files.

## 2. What is in the database, and what waits for her yes

Checked in the database on 23 Nov at 21:35:
- admin-tools.sql: the admin_tools schema with the web-call tool is there.
- game-data.sql: the tables game_players, game_alliances and game_states, with row
  access rules on. 527 players are stored.
- game-refresh.sql: the Whiteout Stats API key is in the Vault (whiteout_stats_api_key).
  Five pg_cron jobs are active: game-players every minute (reads up to 40 players that
  are due: asked for, or last read over 12 hours ago, so each player twice a day, never
  within an hour of the last read), game-state at :05 every hour, game-main-rosters at
  :10 every hour, game-academy-rosters at 04:20 and 16:20 UTC, game-copies-cleanup at
  03:30 UTC. The last 20 runs all succeeded.

Not run, each needs her clear yes to that exact action:
- exalted-skill-levels.sql. Skill levels already exist on every site account
  (game_accounts columns infantry_skill_level, lancer_skill_level, marksmen_skill_level).
  This file keeps them per in-game ID instead, so members with no site account can have
  them: R4s of the member's alliance and admins set them, a level set by an R4 stays when
  the player links the account later, and the levels already typed move over once.
- game-accounts-from-game.sql. Copies name, power and alliance from the game data into
  the site accounts of that ID whenever the game data is read, and fills them when an
  account is added.
- The change in game-refresh.sql that makes look_up_game_account also return power. The
  function in the database does not return it yet.

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
6. Your accounts: every account side by side with the alliance logo, Main/Alt/Farm,
   name, ID and power, the one the person is on lit, and Add. Tapping one switches to
   it, so the page has no separate swap control. This follows notes/design-decisions.md
   (Player page, 23 Nov), but it conflicts with what Roxanne said later the same day:
   main and alt are swapped on the profile itself, one account shown at a time, a side
   by side view only on a computer, and Your accounts holds only farms. Ask her which
   stands before building this part; it is one question.
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

Roxanne sent three screenshots at 17:31 on 23 Nov. They were ignored for the rest of the
day. They are not in the repo because it is public; she has them in the zip she was
given that evening. What they show:
- The game's Chief Profile: the picture in its frame on the left; on the right the name
  with the alliance tag in brackets, "ID:" with a copy button, the power with a fist
  icon, Kills, Alliance, State, and the furnace badge (FC10).
- wosoracle.com's player page on a phone, Overview tab: picture in its frame on the left;
  name, the ID under it, then the alliance tag in a pill, the alliance name and R4 in a
  small pill; a rank emblem on the right. Under that, pills for the state and the
  furnace (F 80 (FC10)). Then one strip of key figures: Power, Labyrinth (with "#7 in
  S1252" under it), Passes ("#8 in S1252"), Kills. Then tabs: Overview, Prep, Heroes &
  Gear, History. Then the alliance as a row (tag tile, name, "Alliance · R4") and a list
  of Chief ID, State, Furnace, Power.
- wosoracle's History tab: one row per date, each with the picture, the name, pills for
  furnace, state, power, Labyrinth, kills and passes, and the date on the right.

## 6a. Other things the next chat needs

- Roxanne and Tif are in state 1252 until they transfer to 1458 (about two weeks after
  23 Nov). Players not in 1458 must not see leaderboards, planning or alliance info.
  Tif is on the list of players who count as 1458 members (state_member_exceptions,
  one row, checked in the database); admins keep that list.
- The Transfers section's pages are Timeline, Invites and Records
  (notes/design-decisions.md). "Transfer invites" means the Invites page.
- The profile draft's code (commit 8a99c87) already reads the game data, looks an ID up,
  asks for a refresh, reads and sets skill levels, shows the skill note before SvS and
  Tyrant (SKILL_CHECK_EVENT_IDS, SKILL_CHECK_DAYS_BEFORE = 3) and marks the name in the
  top bar. Its data code can be kept; its layout was rejected.
- Whiteout Stats API (api.whiteoutstats.com/v1, header X-Api-Key, the key only in the
  Vault): 60 requests a minute and 5,000 a day on the free key; it reads an account from
  the game at most once an hour. A player answer has player (name, ID, power, furnace
  level, kills, alliance with tag, rank and rank label), troops (tier 8 to 12, type, FC
  level), ranks (the state leaderboards, The Labyrinth areas as stage values like
  "57-4") and heroes (the arena team as numbers like 50041, with level, stars, skills and
  exclusive gear level). It has no hero names, no Exalted skill level and no foundry
  power.
- The site cannot wait for the API: requests from the site time out after 8 seconds, so
  the site asks for a refresh and the minute job does the read. execute_sql calls stop
  after 2 minutes.
- This workspace cannot load pictures from the game or the API, and pasting base64 by
  hand corrupts them; the mockups use the picture's first letter instead.
- In the mockups, text is lined up with the picture's edges by trimming each line to its
  letters (CSS text-box: trim-both cap alphabetic, works in the installed Chrome).

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
- Things said that were not true: the first version of this handoff said nothing from
  23 Nov was pushed (main had been pushed at 16:48), that the work existed only in a
  bundle file (profile-draft was already on GitHub) and that profile-draft must never be
  pushed; Claude described exalted-skill-levels.sql as where skill levels would be
  stored (they already were); said the long name no longer rose above the picture when
  its own check showed it still did; and described Discord, Steam and Xbox profiles from
  memory as research.
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
