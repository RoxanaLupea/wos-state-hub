# Design decisions

What has been settled, and what is still open. Only things confirmed out loud go in
the settled part. Anything else belongs under "Open", however likely it looks.

Read this at the start of a session, with what-this-is.md (purpose, scale, who may
do what), visual-language.md (how things are drawn) and rules-and-open-items.md (the
game's own rules). If something in them is wrong, it gets corrected there first and
in the code second.

old-app/ holds the calendar as it ran on Google Apps Script. A lot was settled and
tested there that has not been carried across. When something is missing here, look
there before discussing it again.

## How we work on this

- Design is discussed first and built after, one thing at a time. Nothing counts as
  settled until it is said so out loud, and then it is written here.
- No throwaway mockups. The change goes into the draft branch, the real page is
  rendered from it with the real data, dates and logo, and that is what gets shown.
- The approved files are left alone until the answer is yes.
- The files are handed over when they are asked for, not every time something
  changes. They get run when there is time to run them.
- Unconfirmed experiments are never saved into the kept files.
- Everything in these notes gets built without waiting for its design (asked 22 Nov).
  A page that is not designed yet is built as a working page: the information we have
  in glass sections and tables, with the forms that fill them, so there is something
  real to design from. Pushing and writing to the database still wait for a yes.

## Settled

### Name
- The site is called State Hub, not State Events. The browser tab reads "1458 State Hub".
- The logo reads "1458 STATE HUB": the state number largest, in the accent blue, with
  STATE over HUB stacked to its right in white, the two words the same width and
  together as tall as the number.

### Navigation
- The top row is navigation, not a panel. It is a band of its own tone across the
  full width with a line under it, and the logo starts on the same left margin as
  the page content.
- The clock in it always reads game time and takes no setting.
- Sections: Calendar, Fortress, Transfers, the running event, State, My alliance,
  Map, and Admin behind the gear.
- Six sections have pages of their own. Calendar and State have none.
- On a phone the sections are in the top band too, as its second row: one line that
  scrolls sideways, fading at an edge while there are more past it, with the open one
  kept in view. There is no bar at the bottom of the screen.
- The phone's own back does what the site's Back does and nothing more (see "Calendar
  selection" below). It never moves from one section to another: sections are opened
  by tapping them.

### Page names inside a section
- Uppercase, a little bold.
- The open one is in the header yellow, slightly larger, and centred as the others
  are. The closed ones are the app's blue.
- Switching between them is animated.
- This is how every section moves between its pages. Only the colours change.

### Transfers
- A group is the ranges that share a generation and a furnace cap. A difference in
  either one starts a new group, because a player can only move to a state with the
  same content released as their own.
- A skipped state number is a state that no longer exists. It does not start a new
  group.
- The group is drawn as aligned ranges in three weights. Our group's text is white.
  The range we are in carries light yellow accents, with its text in yellow.
- The furnace cap and the generation are centred, and so are their columns.
- The page is titled "State TRANSFER": the first word as written, the rest in
  capitals, the way the logo sets STATE 1458 against EVENTS. "State" is the logo's
  blue.
- Date headers are parchment with navy ink and keep the glass texture. Every header
  looks the same; the next transfer is marked by its golden border alone.
- The pages are Timeline, Invites and Records.
- The dates scroll sideways as a strip: drag, or the keyboard, snapping on release,
  with one control back to the next transfer. It opens with two whole ranges above
  our group and the whole group in view.
- Where there is not enough to fill the height, the space is not left empty to
  scroll through.
- On a phone two whole dates show side by side, with a fading sliver of the dates on
  either side; the text is smaller so our group's range fits its column. The SvS and
  Sunfire boxes sit on the left of the controls and the two switches on the right
  (23 Nov).
- The way back to the next transfer is a small glass tab with its date at the bottom
  of the dates, on the side the next transfer is on (left or right, arrow pointing
  that way), shown only while the next transfer is out of sight (23 Nov). The
  controls are "All | Ours" and "Ranges | Groups", All and Ranges first and chosen
  by default, each showing both choices with the chosen one lit in the page's
  parchment colour, like the ticked boxes (23 Nov). A group is made of the ranges
  that share a furnace cap and a generation.
- The date columns scroll as one sheet, like a spreadsheet: no scrollbar per column,
  one scroll down for all of them under date heads that stay at the top. The lines
  are as in the sheet: our range is on the same line in every date, from the first
  to the last. Where a column has fewer lines above it (Ours, or Groups), it starts
  lower with empty lines, like empty cells, never a blank gap (23 Nov).
- Up and down and across are two deliberate moves: a swipe moves the sheet one way
  only (23 Nov).
- Two ways back. The next transfer: a tab with its date at the bottom, on the side
  it went off. Our range: a tab with the state number in the middle, at the top or
  the bottom, the side it went off. Each shows only while that place is out of sight.
  With only SvS or only Sunfire ticked, the next transfer is the next one of that
  kind (23 Nov).

### Fortress colours
- From the event's page in the game: violet for the section's colour (the second
  word of the title, the open page, the current phase). The site's own background
  stays as it is; orange in it was tried and dropped (23 Nov).

### Fortress tabs
- Phase · Season · Rewards (23 Nov). Phase is one phase's cards, Season every phase at
  once (forts down, phases across), Rewards the season's reward tables. Planning is
  not a page of its own: planning a season means state managers setting which
  alliance takes which fort or stronghold, which they do in place: the pencil by the
  title on Season turns each cell's alliance into a pick, with a
  smaller pick under it for who the reward counts for (holder, state, or an
  alliance). Each pick is saved as soon as it is made; no forms (23 Nov, as the
  owner asked on 11 Nov). All three tabs stay on the same season and phase.

### Fortress phase
- The Phase tab opens on the phase being played, to look at only: no arrows, no
  picking, no "for the state". Swiping moves to the phase before or after (into the
  season before or after too), the arrow keys do the same on a computer, and tapping
  a phase heading in the Season table opens that phase (23 Nov). Under the tabs one white line reads "SEASON N • PHASE N"; the
  title stays "Fortress BATTLES" alone. White, because the section already has
  enough purple (23 Nov).
- No panels. Each building, four to a line, close together in the middle rather than
  spread over the width, with a thin purple line above the forts and another above
  the strongholds: "Fort 1" or
  "SH 1" above, the reward in the game's own tile with its amount, and the alliance's
  label under it. An academy shows as its main alliance (23 Nov).
- A tile drawn bigger than the game's 44px one scales its frame and its numbers in
  the same proportion (23 Nov).
- Never draw anything on a reward tile's border: the tile stays exactly as the game
  draws it (23 Nov).
- Hero shard rewards follow the state's generation on the phase's battle day, from the
  transfer groups (23 Nov, as the old app did).
- A building that changed hands since the phase before shows both alliances, the one
  before dimmed, then an arrow, then the one now. Two neighbours that both changed
  must still fit side by side on a phone (23 Nov).
- Phase 1 is not compared with the season before: it shows no changes of hands
  (23 Nov).
- Every alliance pill has the same size, alone or in a pair. The buildings stretch
  as wide as the purple lines, with a little room between a line's pills and the
  next line of names (23 Nov).
- On a computer the reward's name sits under its tile. Every name has room for two
  lines, so all the pills sit at the same height (23 Nov).

### Fortress season
- Drawn like the Phase page, with no panels and no change-of-hands pairs: buildings
  down the side ("Fort 1", "SH 1"), phases across, each cell the reward tile and the
  alliance pill under it, the purple lines above the forts and above the strongholds.
  Reward names on a computer only, with room for two lines. A reward counted for
  someone other than the holder says so under the pill (23 Nov).
- On a phone the whole season fits the screen: smaller tiles, quieter pills, and the
  columns headed by the phase only, the dates being under the season's title (23 Nov).

### Fortress rewards
- The season tables have alliances down the side and one column per reward. On a
  phone the columns are headed by the reward only, without its name, so every reward
  fits across the screen and nothing scrolls sideways. Each reward is drawn in its
  game tile (orange, purple, blue) with the amount one fort pays. Every reward column
  has the same width, with the tiles on one line and the names under them. There is
  no total column (23 Nov).
- Reward tiles everywhere (fort board, event panel, tables) show their amounts in a
  normal bold with a soft shadow, smaller than the game's heavy outlined numbers
  (23 Nov).

### King of Icefield
- Its bar shows its seven named days on line 2 on a computer, like SvS preparation
  and Alliance Showdown. Its days repeat names (Basic Skills Up, Combat Training,
  Hero Development), so the rule that drops repeated day names (meant for Wild Brawl,
  where every day carries the same note) must not apply to it.
- On a phone its days show the same way as SvS preparation's and Alliance Showdown's.
  How those show on a phone is still open (short day names where the full ones do
  not fit).

### King of Icefield rewards
- Its targets and rewards change with the player's level. The site records only those
  of the highest level. Whether other events that change with level follow the same
  rule is still open.

### Controls
- Page controls and card controls are two different languages. What a card shows
  belongs to the card's design and is settled with it.
- Page controls do three jobs: which things show, the same content shown another
  way, and moving through.

### Results
- SvS records the opponent state once, for all its phases. Preparation records a win
  or loss. Castle Battle records a win or loss, the president and the president's
  alliance. SvS Battle has no result of its own, because it is won through Castle
  Battle.
- Castle Battle (SvS) records the win or loss, the Supreme President (name, alliance,
  date in office) and, for each alliance in the Occupation Ranking, the alliance,
  whether it is marked "(Invader)" and how long it held the castle. The rank follows
  from the times. The invaders' state is the SvS opponent, recorded once per SvS.
- Sunfire records only the president: number, name, alliance and date in office.
- Each SvS also has one overall result: win (Preparation and Battle), loss (both lost)
  or draw (one of each). 1458's results so far, read from the Hall of Fame and the
  alliances' Glory Path, are in seed/svs-results.json: 28 SvS from 12 Oct 2024 to
  7 Nov 2026, with the opponent state, Preparation and Castle Battle results and the
  alliance that took the castle wherever they are known.
- The one Tundra Arms League result found so far (Glory Path of [ICE]Yeesh: season 5,
  zone 21, Legion 1, rank 2) is in seed/tal-results.json. Its date is not known yet.
  [ICE]Yeesh is a two-member alliance outside the NAP; the owner thinks it was the
  state alliance for that run (not confirmed).
- Tyrant and TAL follow how the state played. If a state alliance played (a shell
  like ICE, or one of ours named as the state's), it is a state result entered by
  admins. Otherwise each alliance records its own if it wants, through its R4 or R5.
- TAL records, per match, everything in the match mail, as Foundry does, and per
  season the season, zone and final rank of each legion.
- The season 6 League Leaderboard (zone 22) gave the ranks of the 1458 legions that
  played: TOP Legion 1 5th, DVL 38th, SKY 45th, TOP Legion 2 48th and FUN 51st. They
  are in seed/tal-results.json. A legion's TAL rank shows in its alliance's info and in
  the state's info.
- For every TAL season the site keeps ranks 1 to 4 of the zone's League Leaderboard
  and the Seasonal MVP and Final MVP boards (MVP, Occupation, Gathering, Looting and
  Kill). They are in seed/tal-seasons.json, starting with season 6, zone 22.
- Tyrant records the alliance's rank with its points, and every player from 1458 who
  ranked in the top 100, with how long they held the capital.
- Each alliance records its own result for alliance events: Foundry, Canyon, Showdown,
  Winter Siege and Alliance Championship. Foundry and Canyon record one result per
  legion.
- Alliance Championship records, per round, the opponent's state and alliance and the
  score as our lanes against theirs; win, draw or loss follows from the score. The
  group rank is entered at the end.
- Showdown records, per alliance and run, the opponent's state and alliance, the
  winner of each of the 6 days (us, them or tie) and each day's MVP.
- Each alliance keeps its Alliance Showdown Star Rating, so its members see their own
  Star Rating band of the Showdown rewards first. The old app had it; the move to the
  new site dropped it. It works like the Winter Siege tier: the alliance's R4 or R5
  sets it, the last one stays saved for the following events, and they can change it
  at any time. Once we know how the game changes it, the site works it out (see
  rules-and-open-items.md).
- Each alliance keeps its Alliance Championship Tier and Stars too. Its R4 or R5 sets
  the starting values; after that the site adds the Stars from each recorded group
  rank, by the alliance's tier (rules-and-open-items.md), and they can correct both
  at any time. Until the promotion rule is known, they also move the tier by hand.
- Winter Siege records, per alliance and run, the opponent's state and alliance and
  win, loss or no opponent. The alliance's tier is entered once; after that the site
  works it out from the results (see rules-and-open-items.md for the missing rule).
  The last tier stays saved, and the alliance's R4 or R5 can change it at any time,
  so it stays right even while the rule is unknown.
- Foundry records, per legion, win or loss and the opponent's state and alliance.
  Canyon records, per legion, its rank among the three (the game gives a rank, not a
  win or loss) and two opponents, each a state and an alliance.
- Foundry can also keep everything in the battle mail: the date and time, both sides'
  Arsenal Points, the Imperial Foundry Control Duration, Control, Gathering, Loot and
  KO Rewards each with its MVP and amount, Sieges by Mercenaries, and every member's
  Personal Arsenal Points.
- Canyon can also keep everything in the battle mail: the date and time, all three
  sides' points, every stat (Total Fuel Used, Enemy Squads Defeated, Occupied
  Buildings, Total Battle Speedups Used, Total March Accelerator I and II Used, Total
  Retreats, Total Advances) with its MVP and amount, and every member's Personal
  Point Ranking.
- Recording results is offered, never required, for every event and every field. An
  alliance records what it wants, or nothing.
- Per-member records, as the xSK sheets kept them, are an option for every alliance:
  each member's attendance, average, best and worst score and absences per event,
  worked out from the member lists in the results. Players are matched by their
  in-game id, and each player keeps their past names so a renamed player still
  matches.
- Entering member lists: first a paste box, where an R4 pastes what any AI app read
  from the screenshots, using a prompt the site gives, and the site matches the
  names. Uploading screenshots straight to the site (a vision model on Cloudflare's
  free plan, through a Supabase function) comes after tests show it reads them
  correctly. Gemini's free tier cannot be used, because its terms allow only paid
  use for users in the EEA, Switzerland and the UK.
- A player's own page shows them their own results and statistics.
- Both of the above come further along the line, not with the first results work.
- An alliance that leaves the state is marked with the day it left, never deleted. It
  disappears from the calendar, the filters and the forms; its past records keep its
  name. FUN left in the transfer that started on 9 Nov 2026: its times are removed, the alliance stays for the
  forts it held in season 16.
- State mergers are part of the logic from the start, even though 1458 has never had
  one. After a merger the game keeps each old state's presidents as Previous
  Presidents, and the site keeps its records the same way: each old state's history
  stays whole, and the merged state's starts at the merger.
- Each alliance's settings have a results section, run by its R4s and R5s, with one
  switch per event, all on by default. Switching an event off hides its results for
  that alliance, both the fields to fill in and where they show. Nothing recorded is
  deleted, so switching it back on brings everything back.
- Results of alliance events (Foundry, Canyon, Showdown, Winter Siege, Alliance
  Championship) are entered by the alliance's own R4 or R5, and only if the alliance
  wants to keep its history.
- An opponent alliance is known by its state and tag, and notes on it stay with it,
  so they are there whenever it shows up again. Only R4s and R5s write and read them.
  They see the notes of every 1458 alliance, and can turn off, in their own settings,
  the notes of other alliances or opponent notes altogether.
- Opponent notes can be translated, because they may be written in Japanese, Chinese,
  Korean, English or Turkish. DeepL's free API does it, called through a Supabase
  function so its key stays secret. A note is translated the first time someone asks
  for it in their language, and the translation is kept with the note.

### Calendar selection, bars and event panel (settled and built 22 Nov)

- Selecting in the calendar: tapping a day picks the day;
  tapping a bar, or anything on it such as a ticket, lights the whole event and
  opens its timeline, marked and scrolled to the current phase if it is running,
  otherwise to the phase tapped. Nothing closes the selection; it changes only when
  another bar or a day is tapped. A day and an event are separate: the panel shows the
  day's timeline or the event's timeline, never one from the other. On a computer the
  panel has no Back button. On a phone, Back closes the panel and shows the calendar,
  whether a day or an event was open. The one exception: an event opened from a day's
  timeline gets a discreet back, to that day, on a computer and on a phone.
- Castle Battle belongs to its State of Power: it shares the SvS's opponent. Tapping it
  inside State of Power's timeline stays in State of Power, with its row marked and its
  info shown, as in the old app.
- A white line on a bar shows its time on hover, as a small label. A tap that does
  land on one shows it too; any other tap on the bar opens the event.
- On a phone the top bar is kept low: a smaller logo, clock and buttons, and the
  signed-in player's name shown in full on the first row, cut short only when it is
  long (23 Nov). Section pages and page controls sit centred under the title.
- On a phone the clock sits right of the middle, clear of the front camera, and the
  sections row is low (23 Nov).
- The open section is shown by accent text with a line under it, on a phone and on a
  computer (23 Nov).
- Every event has the same tabs, in the same order, showing only those it has:
  Timeline, Rules (requirements, rules and predictions together), Points, Rewards,
  the tabs only one kind of event needs (Battles, Total score, Alliance times),
  Missions, Results, Mine (23 Nov). Whether Missions joins Rewards is still open.
- SvS (with its Castle Battle) shows on the event only that date's result; the whole
  history is on the State page, reached from "Check history" under it (23 Nov).
- An opponent is recorded as its state and its alliance, written as text; opponent
  alliances are not added to the site's alliances (23 Nov).
- An event's timeline is the first of its tabs; there is no separate button to switch
  between timeline and info (22 Nov). The panel opens on Timeline, or on the tab the
  player looked at last when the event has it.
- An event's info is in tabs, one per piece: Requirements, Points, Rules, Predictions,
  Rewards, Missions, and the event-specific ones (Showdown's total score, the
  fortress battles, alliance times, results to come). Only the pieces an event has
  get a tab. When the tabs do not fit, they scroll sideways. Each tab is designed
  when we get to it. The other name, the event's note and the date's note show with
  the name at the top, not in a tab.
- An open event's way back, its head and (later) its tabs stay at the top of the panel;
  only what is under them scrolls. Where there is more to scroll, the edge fades out
  instead of cutting the rows off.
- The event open in the panel is marked on every one of its bars with a white line just
  outside the bar (so it never crowds the text) and a small glow in the event's own light
  colour. Its bars are not lightened (that made their text hard to read).
- Text on every bar is white. Names have a thin border in one deep indigo (#2B2752) for
  every event, never black. Small text (the second line, phase names, short names,
  ticket counts) gets only a soft indigo shadow, because a border blurs letters that
  small.
- On a computer, a bar's second line of day names is 10.5px (it was 9px), and 12px on
  screens 1700px and wider, where two-line bars are 2px taller to make room.
- On the SvS bar, Castle Battle showing as its logo instead of its name is fine on a
  computer too: it sits under BATTLE, so the logo says as much as the word.
- An event's short name after its name (SvS, TAL) is in Montserrat, smaller, in spaced
  capitals. Deals have no short name (Frosty Fortune, with Treasure Hunt Drill and
  Emporium of Enigma, is a Deal), and neither do Foundry Battle and Fortress
  Battles. Flame and Fangs is F&F, Frostfire Mine is FF.
- An event played at set times each day (Wild Brawl: four windows a day, open daily):
  on its calendar bar each window is a short white line inside the bar along its
  bottom edge, like the white lines between days, and pointing at one or tapping it
  shows its times. In the day's panel the event stays under All day, and under its
  name a thin, quiet line for the day carries the windows marked in the event's light
  colour, each window written under its mark in the site's text colour as "02–04". A
  time on the hour is written as the hour alone; minutes only when there are some.
  Every window already over is dimmed, on any day; on today the open window, or else
  the next one, stands out with its label in white. No mark for now. On the event's own
  timeline each window is a row where it opens (named as the game names it) and a row
  where it closes; the line between the two is lit in the event's light colour and a
  little thicker, and the rest of the line is quiet. Nothing is dimmed there: dimming
  is only for the line in the day's panel. The open or next window stands out.
- A Missions tab goes on the events whose missions the owner has found in game: TAL,
  Treasure Hunt Drill, Dreamscape Memory (daily missions, list not sent yet) and Wild
  Brawl. More are added as the owner sends them.

### Player page (settled 23-24 Nov, mockup version 34 in tools/mockups/player-page-v2)

The page shows one game account, mostly straight from the game data. The player only sets
the skill levels of Exalted troops and adds their other accounts.

Header
- The account's picture, a little taller than the text beside it, the text centred on
  it, both from the same left edge. No FC badge on the picture.
- Beside it: the name with the rank (R4) after it as a small label tinted in the
  alliance's colour; the ID; the power with its state rank (#2) small after it; the
  Foundry power on its own line under the power, its logo centred on the number.
- The alliance as a small badge in the top right: its logo with the tag close under it.
- "Updated 53 min ago" and Refresh: at the end of the page on a phone, in the top right
  under the badge on a computer. Refresh is lit when it can be used, otherwise it shows
  the time it can be used again.
- Under the header, the photos of the person's other accounts (never the one shown).
  Tapping one swaps to it. On a phone 7 photos fill the line from edge to edge; fewer
  keep that size. On a computer the photos have a fixed size. Adding an account is
  "Add account" in the menu under the name in the top bar.
- The top bar and the menu under the name show the account's picture with its name.

Troops
- The three troop types centred in their columns: the tier portrait with its FC badge
  overlapping its corner, the name in capitals (Infantry, Lancer, Marksmen) at one size
  so the widest is as wide as the picture (on a computer at most 15px), and under it
  the tier written T10, T6 (no space), Helios or Exalted, and for Exalted "· Lvl. 3".
  No red. Below T10, the tier's portrait where the repo has it.
- "Update troops" with a down arrow under them, on the left, in the alliance's colour,
  only on the person's own account and only with Exalted troops. It opens each Exalted
  troop with the None / Lvl. 1 / Lvl. 2 / Lvl. 3 toggle, then Cancel and Save (Save lit
  only with changes). Leaving with changes asks "Save your changes before you leave?"
  with Cancel and Save.
- A note asking for skill levels (never set, or before SvS and Tyrant) sits above
  "Update troops", on the left.

Arena team
- The game's own hero cards (public/images/heroes/cards/, cleaned of the level, stars,
  S mark and red dot); the site writes on the card the level ("Lv. 80", white with a
  dark outline, bottom left) and the stars over the bottom: five six-petal stars, one
  petal lit per step, from the top petal counter-clockwise. The card's class badge stays.
- Under each card: "Widget Lvl. 10". All five lines share one size so the widest fits.
- A hero with no card yet keeps a drawn card in the game's card colours.

Leaderboards
- Short names that fit one line: the power boards keep "Power" (Hero Power, Chief Gear
  Power, Pet Power...), and Labyrinth, Exploration and Island are one word. Each board
  is centred in its column: the name, then the value with its rank small after it.
- More than nine boards with a rank: these nine, in three rows of three: Hero Power,
  Chief Gear Power, Chief Charm Power; Pet Power, Expert Power, Research Power;
  Labyrinth, Exploration, Island. Hero Equip Power takes Hero Power's place when Hero
  Power has no rank.
- Nine or fewer: all the boards the account has a rank on, in that order of groups, the
  Labyrinth's row last. Boards with no rank are left out.
- The Labyrinth always starts its row on the left, with "Labyrinth stages" and a down
  arrow under it, which opens its six areas. With only the Labyrinth: no stages line,
  its total in that place and its areas always shown.
- Kill Count, Furnace level and Migrant Score are not on the profile (Migrant Score
  belongs with transfers).

Colours
- The alliance's colour, softened: the section titles mixed with the quiet text
  colour, "Update troops" and "Labyrinth stages" mixed lighter, and the rank label.
  DVL uses its purple accent; an academy its main alliance's, lighter; an alliance
  without an accent its base colour.

On a computer
- The page centred and wider. Troops and the Arena team side by side, each only as wide
  as its pictures, the Arena team ending at the page's right edge. The troop block
  (pictures and their two lines) is exactly as tall as the hero block (cards and their
  one line); hero cards 20px apart.
- The nine leaderboards on one line in their three groups with a wider gap between
  groups; the Labyrinth's stages open on one line under the whole row.

Game accounts (from 23 Nov, still holds)
- A person has one main and any number of alts and farms. An alt is a full account;
  farms have no troops and are not accounts to switch to. The account the person is on
  is picked in the menu under their name in the top bar; it is the one filled in on
  every page, and its alliance is their alliance.

### Player data from the game (23 Nov)

- Players' game data comes from the Whiteout Stats API (api.whiteoutstats.com), looked up
  by in-game ID: name, state, alliance and rank in it, power, furnace level, kills,
  avatar, and each troop type's tier and FC level. Tested on 23 Nov with the owner's
  account; it matched the game.
- A player adds the ID of every account they have and marks each as main, alt or farm.
  When an ID is typed, its name and picture appear, so the player sees it is the right
  account.
- Every known account is refreshed twice a day, as a slow background pass (the API allows
  60 requests a minute and 5,000 a day on the free key).
- Players can refresh their own accounts, and R4s and admins their alliance. The API reads
  an account from the game at most once an hour, so the refresh waits an hour after the
  last update, and the page shows when the data was last read.
- The rosters of the main alliances still in the state (DVL, TOP, SKY, RUU) are read every
  hour, each call waiting for the API to read the game, so a roster is never more than an
  hour old. A whole roster is one request.
- The academies' rosters (dvl, top, abc) are read twice a day, with the player pass.
- The same account is never requested twice within an hour. Asked again within the hour,
  the site gives the answer from the last call.
- The key is kept in the database's Vault and the refreshes run in the database
  (supabase/game-refresh.sql), set up on 23 Nov.
- Anyone signed in can add any in-game ID as their account, so an ID can be claimed by
  someone it does not belong to. Members can report a wrongly claimed account, and admins
  deal with the reports.
- Storage while the pages are being designed: the latest full answer for every player,
  alliance and state, plus one copy a day of the basic data for the last 30 days (about
  150 MB; heroes and chief gear only as the latest copy). Once the design shows what is
  used, only that is kept, with a longer history.

## Open

- Player page: whether the menu under the name still lists the account the person is on.
- Player page: names for the 13 hero cards not matched yet (9 epic, 4 rare), and hero
  gear (the data has every arena hero's four pieces and their levels).
- State page leaderboards: which of the 26 lead. The owner named The Labyrinth (total),
  Total Pet Power, Total Expert Power and Exploration Stage as needed; the rest is to be
  worked out later.
- Roles. Decided: owner; admins, who can edit anything; alliance manager, one role per
  alliance, held the same by its R4s and R5s; state managers, for the state's planning
  except battles; battle managers, for the battles. Open: exactly which pages and
  actions each one gets, decided as each page is built.
- Alliance colours. None is approved. The site uses the colours from the old sheet's
  Alliances tab for now.
- The shape of each of the three page controls.
- The names of the Timeline's controls, and how they are arranged.
- Where the UTC / Mine choice lives, now that it is out of the navigation. Pages
  other than the calendar also show times.
- How Availability is sorted.
- The header and calendar toolbar redesign (asked 22 Nov): the clock as "UTC" over
  the time, centred together in the top bar; no left and right arrows on a phone,
  where the calendar is swiped instead; Today as one clear button that reads as
  going back to today.
- Bear, Crazy Joe and Frostfire as one-day tiles: whether they show as the logo only,
  like Sunfire Battle. Not decided.
- Where next-up sits on a phone (above the calendar, with notifications later).
- The chosen day's soft white fade at its top and bottom is built but the owner has
  not seen it yet.
- Short names that repeat between events: check the list again (Foundry, Fortress
  and the Deals no longer have one).
- Real short names and initials for every event; initials are a stand-in for now.
- Short day names on a phone for SvS, Showdown and King of Icefield, and King of
  Icefield's days on its bar.
- Colours from their logos for every event that still lacks them.
- The Fortress rewards view needs work and a redesign.
- How results are shown (SvS, Sunfire presidents, TAL ranks and MVPs). A working
  version is built: a Results tab on the event, and My alliance · Results.
- The maps (state, alliance, castle and event maps), described in
  rules-and-open-items.md; the owner will show examples first.
- Everything in "Still to design" in rules-and-open-items.md.

## Built from the list agreed 22 Nov

All nine are built.

1. A day's points arrow opens the points without redrawing the panel.
2. An event's info in tabs (see above).
3. Hero names filled in where the text has {eventsHero} or {luckyWheelHero}, as the old
   app did (fillHeroNames, generationOnDay, HEROES_BY_GENERATION in old-app).
4. Fortress battle times in the day and in the event (old fortMoments and
   renderFortBattlesSection).
5. Showdown's total score (old renderScoreFold).
6. Phase and step notes.
7. The all-day line shows the event, the day's name and its steps, without times.
8. Today picks today.
9. The year view opens the overview on a phone.

## Game data waiting to be used

- data/captures/ holds everything the owner sent from the game, one file per event.
  Rewards and rules there are not yet in data/catalog/; moving each one over is its own
  piece of work.
- Still to come from the owner: Fishing's Fishing Techniques tab and rewards, Alliance
  Mobilization's other tiers, Dreamscape Memory's daily missions, King of Icefield's
  targets 3 and 4 for stages 1 to 6 (next month).
- Pictures still to get: the list in rules-and-open-items.md.

## Data to check at the source

- States 354 to 363 appear in two ranges, 322-363 and 354-399, on 54 of the 66 dates
  in supabase/transfer-group-predictions.csv.
