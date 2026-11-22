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

## Settled

### Name
- The site is called State Hub, not State Events. The logo and the browser tab
  change with the header redesign.
- The logo reads "1458 STATE HUB": the state number largest, with STATE over HUB
  stacked to its right.

### Navigation
- The top row is navigation, not a panel. It is a band of its own tone across the
  full width with a line under it, and the logo starts on the same left margin as
  the page content.
- The clock in it always reads game time and takes no setting.
- Sections: Calendar, Fortress, Transfers, the running event, State, My alliance,
  Map, and Admin behind the gear.
- Six sections have pages of their own. Calendar and State have none.

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

## Open

- Roles. For now an alliance's R4 and R5 can do exactly the same things; what each may
  do is decided when roles are designed.
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
- Selecting in the calendar (22 Nov, being designed): tapping a day picks the day;
  tapping a bar, or anything on it such as a ticket, lights the whole event and
  opens its timeline, marked and scrolled to the current phase if it is running,
  otherwise to the phase tapped. Nothing closes the selection; it changes only when
  another bar or a day is tapped. A day and an event are separate: the panel shows the
  day's timeline or the event's timeline, never one from the other. On a computer the
  panel has no Back button. On a phone, Back closes the panel and shows the calendar,
  whether a day or an event was open.
- Everything in "Still to design" in rules-and-open-items.md.

## Data to check at the source

- States 354 to 363 appear in two ranges, 322-363 and 354-399, on 54 of the 66 dates
  in supabase/transfer-group-predictions.csv.
