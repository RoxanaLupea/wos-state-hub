# Handover: where the work stands

Do CLAUDE.md's setup first. Updated 27 Nov 2026.

## Now

### Pushed 27 Nov, 13:00 (her time): the calendar redesign (common-size) merged into main

Everything on common-size went live with her yes ("Push all our work because we're doing a
handover"). The branch is deleted; work goes on main from now on.

## The redesign plan (her words: "highly important")

We go through the redesigned site screen by screen with Roxanne, phone first, and change only
what she asks. For every event panel, ask her whether its fold arrows stay (removed on Alliance
Championship). The 19 review screens are Claude's 1920 x 950 renders (26 Nov):

1. Month view with the day card: done.
2. Alliance Championship panel, Timeline: done.
3. Alliance Championship, Rules: done.
4. Alliance Championship, Rewards: done 27 Nov (see "Rewards, 27 Nov" below).
5. SvS panel. <- next
6. SvS, Results tab.
7. Foundry Battle panel.
8. Filters.
9. The account menu.
10. Week view.
11. Year view.
12-19. The other pages. Their names were never written down (Claude's mistake). They were
    the remaining pages of the site; render each page that is not in 1-11 (Fortress season
    and rewards, Invites, New group, the State page, My alliance pages, the player profile,
    Submissions, Transfers) and go through them with her in turn.

Fishing (done 27 Nov, mockup now live): one-line bar "Fishing SUMMER" with the fish and a white
mark at the end of fishing (the day before the event ends) and a golden Sunken Treasure Hunt
line under it; no Timeline, no Mine, no Edit; Mini-game and Summer in the head; tabs Guide
(how to play, with item pictures) and Rewards (Club as reward tracks, Ranking Rewards). Item
pictures to come from her: notes/images-needed.md. Seasons go winter, spring, summer, autumn,
one a month (catalog seasonOrder/seasonKnown). Next run (Autumn): ask her for that season's
chances (saved for Summer in point-sources list "chances", not shown), the reward item names,
the daily mission amounts and the missions screens; daily and season mission targets are in
data/captures/fishing.md (from WoS Guru, not shown yet).

### Rewards, 27 Nov (rules for every event, in design-decisions.md)

- Every event's reward lists one after another on one page, each under its heading; tiers and
  bands are tabs like the event's own tabs (no boxes inside boxes, no filled pills).
- Rank columns: number right, rewards left. Reward rows divided by space, no lines.
- Notes in Rewards are quiet (11 px, faint). Prestige-type rewards: 2 x 2 big squares, the
  border scaled, how long they last as a label on the reward ("14 days").
- Alliance Championship: Tier Rewards with a tab per tier (all six from the game), the open
  tier's Prestige Rewards (Ultimate only) and its group ranks with "+2 ★"; KO1, KO2, Defeat.
- Reward tracks (Fishing's Club): a band per track under its medal, free / first pack /
  second pack, numbers right; a new element for every event that has tracks.
- Shown to her only for Alliance Championship and Fishing: the one-page look on the other
  events (Showdown, Winter Siege, KoI, Hellfire, Frostfire...) is live but she has not seen it.

### The event head, 27 Nov

- What she approves on one event's head applies to every event. Results sits at the top right
  where it was approved. No Edit in any head (date, repeat and alliance-time edits come back
  later in a design that makes sense; alliance times will be edited in place).
- The alliance's tier under the name in capitals (no word "tier"), a tiny edit for R4s only.
  Open: what R4s see when no tier is set (now "TIER NOT SET"; she does not want the word).
  To build: the tiny edit's picker, and the tier saved per run (a new run takes the current
  tier; a change applies from that run on; past runs keep theirs). Today the tier is per
  alliance (alliance_records.championship_tier, winter_siege_tier); no alliance has one set.
  The screenshots she sent of all six tiers were examples from another state's account.

### Pushed 27 Nov, 07:46 (her time)

Live: Submissions as three columns across the page on a computer (New/Pending, Approved,
Rejected) and three sections that open and close on a phone; a member's seen tickets are kept
in the database (result_submissions.seen_by_submitter, mark_submissions_seen(), run on her
yes), so their dot clears on every device.

### Pushed 27 Nov, 07:40 (her time)

Live: no scrollbar anywhere, boxes that scroll fade at the bottom (FADING_BOXES); scrolled
lists stay in place when something is ticked (KEPT_BOXES). Submissions (submissions.ts,
table result_submissions, created on her yes): members submit Alliance Championship results
(button Submit), R4s get a red dot and the menu's Submissions list, open a ticket to the
event's Results to fix, Approve or Reject; the member gets a dot when it is resolved. Everyone
who contributed is shown under the results with picture and in-game name (person-chip.ts).
Open: remind her to add GIFs to Submissions (approved, rejected, and each column when empty); Foundry and Canyon results by legion need their design (her screenshots are in
data/captures); the Submissions page's design comes later; the bottom-sheet pop-ups later.
Next: the calendar redesign review on common-size, screen 3 onward.

### Pushed 27 Nov, 07:15 (her time)

Live on main: Alliance Championship results (championship-results.ts): the trophy Results
button at the top of the head for R4s once the first battle started and while there are no
results; no Results tab until results exist (also Foundry, Canyon, Showdown, Winter Siege, whose
Results button still opens their old forms, to be redesigned); rounds added in place (only rounds
fought, lanes tapped as won, flags and points worked out); Add ranking once 5 rounds are in
(group from the rounds, arrows side by side, sorted by points then flags on save); "Submitted by"
under the results. Timeline: ROUND n with Adjust lanes under it, then Battle (eventStep .detail
in en.json); the game's notes for rounds and registration removed. The R4s' plan banner under
Registration (plan-note.ts; alliance_records.event_notes, column added on her yes 07:07). No head
Edit on AC (datesLocked). Open: members submit and R4s approve as tickets (her rules in
design-decisions.md, needs new tables); drawn scrollbars on PC wait for her call.
The calendar redesign stays on common-size (built, not live), review continues there.

### Pushed 27 Nov, 06:12 (her time)

Live: a player picture that fails to load shows the WoS logo under a veil with a torn-picture
icon (broken-picture.ts); on the phone Add player and New group open from the bottom (she wants
them redone later); Custom/State/Contact only as wide as its words; 1252's Alliance Championship
captured in data/captures/other-states.md. scroll-audit.py now shows scrollbars (headless hid
them): it finds drawn scrollbars on PC in the event panel, Filters, Fortress Rewards, State,
Invites lists and New group; removing them widens approved boxes, so it waits for her.
Open: Add results for every alliance event (her rules in design-decisions.md, 27 Nov): a
graphical button on top, only past rounds asked, in-place editing (AC lanes tapped as won),
then Add ranking with up/down arrows; who adds (members) and how R4s confirm is still open.

### Pushed 27 Nov, 05:30 (her time)

Live: profiles opened on a phone scroll inside their sheet; the calendar's weeks, the day
panel, admin pages and Fortress Season scroll with no scrollbar; New group rows 4px apart;
tools/render/scroll-audit.py checks every page for cut-off content, scrollbars and boxes
touching. Open: broken player pictures (her ask, 05:29: "something fun", clear it is not
the picture; her examples were sketched animals peeking from an edge; my drawn versions
were rejected, she will send the pictures herself, then a failed picture shows one of hers,
the same one for the same player, through pictureOf in player-profile.ts), the AC results mockup, which list
pop-ups open from the bottom on the phone.

### Pushed 27 Nov, 05:10 (her time)

Live: while a pop-up or a sheet is open, the page behind stays still (tokens.css). Open:
which list pop-ups (Add player, New group, Save for which characters) open from the bottom
on the phone like a player's profile; New group's ticked rows touch (they need a gap); the
Alliance Championship results mockup waits for her verdict.

### Pushed 27 Nov, 04:55 (her time)

Live: the Records pin removed, Invites and Records scrollbars hidden, and the Invites group
fixes: Create in New group saves the group at once (editing stays on); saving puts a group's
people together on their list from where its first one is; the New group list keeps its
scroll while people are ticked (main.ts keeps .inv .ng-list's place). Build green.

The calendar redesign for the common screen is on branch common-size (pushed, not merged; the
site deploys from main only). It has main's commits merged in. The review goes screen by screen
through her 19 screenshots; screen 1 (month view with the day card) is the one in review.
Open on the branch: the row order (fullest rows first) not yet confirmed; the side panels'
fade; the phone nav font; "where's the glass".

### Invites and Records live (26 Nov, second chat)

On her yes (18:20) supabase/transfer-invites.sql and supabase/blacklist.sql were run (the
candidate tables were empty) and everything was pushed.
- Code: src/ui/invites-page.ts (both pages, pop-ups, editing, moving rows), src/ui/invite-row.ts
  (the player row, used by both), src/ui/invites.css (generated from the mockup's CSS by a
  script, scoped to .inv and kept out of the profile card with :not(.in-card *); the page's own
  additions at the end), src/data/transfer-invites.ts (reads and writes), src/data/invite-rules.ts
  (phases, countdown, specials, cap estimate, statuses, group colours; tests/invite-rules.test.ts).
- Only the phone's or the computer's parts are drawn (onComputer): an SVG gradient in a hidden
  part left the visible icons of the same name blank.
- The profile shown in a card keeps the phone layout: player-profile.css's computer rules now
  apply to .pp:where(:not(.in-card)) (no change to the profile page, checked by pixels).
- The old window and candidate forms and the blacklist form left the Invites page (not in the
  mockup); src/ui/transfers.ts, transfers.css and src/data/transfers.ts are gone.
- Renders: tools/render/add-test-transfers.py adds made-up transfers (run after add-test-player.py).
- Every page rendered before and after: only Invites and Records changed.
- Compact rows (16:20): a normal 16-character name fits on a 390 px phone and the computer,
  in view and editing (columns 40 / name / 20 / 92 / 44 on the phone, the same in both modes;
  the computer's FC column 24 px). On a 360 px phone such a name is still cut.
- Computer (16:30, "the computer is the primary target"): the rows start on the list's line,
  the group shade and grips inside it, the picture 30 px in; the number columns gave the room.
  The phone keeps the shade a little left of the list ("it's fine"); on the phone the
  row's visible edges (the shade on the left, the contact on the right) sit 12 px from the
  screen's edges, just outside the list's 16 px; columns 40 / name / 20 / 84 / 42, Group in
  place of Add to group (16:35).
- Records (16:45): rows sit where the Invites rows do: phone 12 px from the screen's edges,
  computer pictures 30 px in. "Leave group" is now
  Ungroup, in the group's colour; each row's icons have their own gradient.
- 17:00: the phone page's content runs 12 px from both edges (list titles' lines as wide as
  the rows). The card's values share one 30 px line (Group and the Power cap box, the manager),
  view and editing alike. Ordinary / Leading only as wide as its words, the chosen one in the
  page's gold (a variant on this card only; the Add pop-ups' kind-words are unchanged). The
  transfer manager is found by name among the state's roster players, or by in-game ID in
  the game; Save asks to pick one. supabase/transfer-invites.sql now also lets anyone signed
  in ask for a Refresh (the hour limit stays).
- 17:20: the card has its own Edit (admins), top corner; Cancel and Save (icons) take its
  place; the lists' Edit no longer edits the card. "Ordinary state" / "Leading state" shows
  to everyone under Group and Power cap; editing adds the other word, so nothing moves down.
  The manager line: value right after its label, the box in its place with the picture.
- The player search is one element, src/ui/player-search.ts and .css (typing never redraws
  the page): the transfer manager on the card, the president in the SvS and Sunfire results.
  The president keeps its in-game ID and picture as details president_id / president_avatar;
  saving a new president of the battle (SvS, or Sunfire if the Transfers setting says so)
  right before a transfer sets that transfer's manager. The card changes the manager only
  when that battle's Preparation was won and its Battle lost; then the former president (the
  newest SvS or Sunfire president before that battle) is set, until edited on the card.
  The manager is set again only when the president or the two results change.
- 17:30: the card's order is the countdown, Group and Power cap, the state, then "Transfer
  manager" as a gold part title like Available invites, 19 px between the parts (phone too).
  The state word is gold text without a fill; the chosen word while editing has a thin gold
  frame.
- Computer, Compact: the first row has the same 5 px above its picture as the others (it had
  2, so a group's shade started right above it); the column heads moved up 3 px instead.
- 17:45: the special invite restored during the transfer is marked only when it adds a place
  (a test covers it); 17:50: as a gold star after "of N", its note on a tap or under the
  pointer (the rows' .tip): "The 2nd special invite is only generated on Monday 1 Feb 2027,
  during the Pre-transfer." Replaces "1 from <date>". Her ok on:
  icon-only Cancel and Save on the card, "Ordinary state", the Records profile pop-up, grips
  on every row, 16-character names cut on 360 px phones ("they can buy better phones").
- 19:00 pushed (her yes, build green) and run on the database: New group's lists scroll on
  the phone (they were cut at 300 px) and the pop-up never runs past the screen; the letter
  pictures there are centred. refresh_players puts the current list's players without data
  first (the import had queued 232 players and reads take up to 15 s each, so the 6 Dec list
  waited). refresh_other_states (now in transfer-invites.sql, built on svs-opponent-state.sql's
  version, SvS opponent kept) also reads the states of the current list's players who have
  not transferred, once a day; their profiles from the lists load those state ranks too
  ("we also need that state's data to get the full profile"). The records star went live.
- Not pushed yet: the pin after the date on Records is gone ("looks wrong, i think we'll
  just remove it"); the Invites lists and Records scroll with no scrollbar seen (its space
  kept, so nothing moves). Open: whether Invites' own pin goes too.
- 18:40: the old sheet imported (her yes): 11 transfers (4 Jan to 6 Dec 2026), 286 rows with
  source "Old transfer sheet "1458 transfer December", <tab> tab" and updated_by her account;
  statuses by her rules (ticked Migration or "ok" Transferred; "Declined"/"rejected" Rejected;
  invited with Migration unticked Expired, except November, whose column was never filled;
  nothing written: Transferred when in 1458 on 26 Nov and on no later list, otherwise empty;
  "Transferred elsewhere", "Reduce power", "replaced" empty). Aunie on April's Open list, the
  three extras under April's 35 on its Open list; December is the 6 Dec list with the
  Terry+Norr group as group 1. transfer_invites.source added. ITACHI on state_blacklist.
  Code not pushed yet: the star on a record read after its transfer ("This record was
  received on <date>, not on the date of the transfer.").
- 18:10: a name cut with "…" (Records manager, card manager, search list) keeps 4 px above and
  below so tall characters are not clipped; the Records manager's name is 13 px (was 14.5).
- 18:05: Records show the president of that time where a transfer's manager was not recorded
  (main.ts presidentAtTransfer, by the manager's rule, from the results and seed/ histories),
  with a gold star after the name and its note; admins change a past manager with Edit after
  the date (the player search). The stars are one element (.star-tip). Only one good (fresh)
  read fills an imported record. New supabase/blacklist.sql (state_blacklist: ID, name, reason,
  source), not run; the flag and the State page come later.
- 17:55: supabase/transfer-invites.sql: only the current transfer's list
  (admin_tools.current_transfer_window(), current until its eighth day) is read and copied;
  an older record keeps its data, one that never had any (imported) is filled once with its
  read time (game_read_at). Tested on local Postgres. Still to build with the import: the
  tiny star on a record whose data was read after its transfer ("received on <date>").
- Next: import "1458 transfer December" (Google Drive, id 1Rx3hPpOL2Y9LgDzh0_wHnTT2Cda_Lx0tBoNd2ixx-jw,
  month tabs, read through the Sheets connector): the December tab is the current 6 Dec list
  (Invites, with the "Terry+Norr group"), the others go to Records. The March tab is the
  29 March transfer. Invited but not migrated with no note is Expired. February and January: who was on
  the list; those in 1458 now are Transferred (her rule). Still open: November's empty
  Migration column, "Transferred elsewhere" (Rejected was suggested, not confirmed), the
  tiny star on records read after their transfer (to build before the import). Then contact editing, flags, the page after the transfer, Add problems.
- 17:40: the phone's back: every page and part (Timeline, Invites, Records…) is a step of the
  history (main.ts placeKey is page|part|level); on Invites and Records each pop-up, Details
  or profile open is a level. Leaving Invites with changes asks first. The calendar's own
  steps work as before (checked against the last commit). Group / Ungroup and Remove sit at
  the right of their column while editing (centred in Details on the computer).
  The phase header stays as it is for now (her choice).
- 17:35: the lists' views (Invites and Records): the chosen view's mark is a short, thicker,
  glowing piece of the list's own line (no underline of its own); both icons in the list's
  colour, each list with its own gradient id.

Mine, not hers, to show her (say so, ask one at a time):
- Before the invitation phase the title reads "INVITATION TRANSFER IN" with the countdown.
- Editing (admins) makes the card's transfer manager (name search, ID as backup), power cap and
  Ordinary / Leading editable in place; nothing else sets them.
- A special restored during a transfer's own days shows "1 from <date>" under the Special ring.
- The profile from Records opens as a pop-up on a computer, from the bottom on a phone.
- The grips show on every row on a computer for those who may move players.
- Not built (still to design with her): contact editing, flags, statistics swap on the phone,
  the page once the transfer is over beyond the card's Arrived and invites sent, Add problems
  beyond "already in a list" and a full list greyed. The phone's back does not close the sheets.

### The spec: tools/mockups/invites/invites_status.py

- Her accepted Invites and Records designs are drawn in this mockup, the spec for the code
  (mockups are the spec: anything left out of the mockup is left out of the code). Her decisions, in her words: notes/design-decisions.md (Invites page, Records
  page, Player rows, group colours, statuses, pop-ups, pin rules).
- Run: build the site with tools/render/build.sh into /tmp/render-build, copy profile-tif.png
  and profile-spickle.png into /tmp/render-build/images/, then
  `python3 invites_status.py out.png 390 844 pop=0 small idline` (phone) or
  `... 1440 900 ...` (computer). Flags: idline (the accepted row look, always on), editing,
  popup (with addstate=ok|missing|listed|black|full|contact), rmv, ngroup, ngcustom,
  records, future, over, profile, spickle, drag, phstats, sheet, rec=dec|nov.
- Phone first, full-screen screenshots, before and after every change.

### Build order

1. Player rows, as in notes/design-decisions.md "Player rows (Roxanne, 26 Nov)". The same
   element is used wherever players are listed, Records included (CLAUDE.md: the same
   element is never drawn in different ways).
2. Invites page: only what notes/design-decisions.md records as her decisions. The list
   "Still to design on the Invites page, in her words" is designed with her first, not built.
3. Records page: as accepted in notes/design-decisions.md ("Records page, accepted"),
   with the pin on the phone and the computer.
4. Specials won on the last day: notes/rules-and-open-items.md, "Special invites earned for
   the next transfer", her words as written there.
- The mockup also holds experiments she turned down. When the mockup and her words in the
  notes disagree, her words win; when unsure, ask her.

### Pushed 26 Nov, 15:30 (her yes)

- Branch wip-25-nov merged into main and deleted: new categories Special events (9 festivals)
  and Packs (4 packs), Hero Ascension Training in Deals, no short tag on special events and
  packs (catalog.ts eventTypeTag); icons and colours are placeholders. Their dates from
  supabase/special-events-and-packs.sql are in the database (run 26 Nov, 27 rows).
- Foundry power is asked for an update once Foundry registration opens (main.ts
  lastFoundryRegistrationStart), not every two weeks.
- The open section is centred in the top menu unless the row was scrolled by hand
  (main.ts centreOpenSection); the divider in the controls row, same order on both screens
  (shell.ts, shell.css; notes/page-style.md "Controls row" and "Top band").
- Notes for the Invites and Records build, and the mockup in tools/mockups/invites/.

### Still open (ask one at a time)

- Her 1252 Foundry Legion 1 screenshot (25 Nov): Roxanne 16,480 (her 1252 main, game_accounts
  id 1), Lord Daddy Tif 32,315 (Tif's 1252 main, id 2), Lordy 20,752 (no site account).
  Asked whether to save the first two with her as the source; not answered. Foundry power
  for players without a site account needs a place per in-game player (to plan).
- Next chat's work (her plan): she gives the list of people moving from 1252 to 1458 at the
  next transfer, and their data is taken from 1252.
- Artisan's Trove: Torxim's calendar shows Charms every Wed-Thu and Chief Gear every Fri-Sat;
  asked whether to save them as weekly estimates. Not answered.
- Pack prices: the orange bubble amount (same for everyone) or her RON price. Not answered.
- Monday and Thursday screenshot reminders (she sends the game calendar Mondays, the
  Top-up Center Mondays and Thursdays). A one-off reminder is set for 7 Dec 10:00.
- Sources found: torxim.com (Game Calendar with packs, irregular event history with exact
  past windows), wostools.net (daily shop checks: /pack-purchase-calculator?seen=DATE).

- main is the live site. Last push 25 Nov, 19:45 (09e8f0f), the profile:
  - No CHARACTERS title: Edit and Add under the photos on a phone, as two dashed places
    after the last photo on a computer. Editing: every character, tap one (ringed), its
    line Main / Alt / Farm (round marks), then Cancel (grey), Remove (bin, red), Save.
    Remove asks "Are you sure you want to remove x?" and removes at once
    (removeGameAccount; its availability answers go with it). The main is not in the
    editing list; the picked photo grows a little on a computer (19:55 push).
  - Labyrinth stages set in from both sides (16 px phone, 48 px computer).
  - 20:05 push: "Add foundry power" never cut (the badge room is the badge's own width
    plus 12 px, measured in fitPlayerPage, which runs again as pictures load; the words
    shrink to fit on narrow phones). The top bar keeps logo, clock and player on one row
    on every phone: under 390 px the logo and clock get smaller, under 360 px the name
    is cut short last (shell.css). 390 px and up unchanged.
  - Menu: Admin, Profile, Sign out. "Account" is "character" wherever players see it.
  - Foundry power in place (part 'foundry' in main.ts): "Add foundry power" when empty,
    the edit icon after the number, red with a dot once a new Foundry Battle registration
    opens after it was set (her rule, 25 Nov; lastFoundryRegistrationStart in main.ts).
  - Leaderboards in her order (Research, Gear, Charms / Hero, Pet, Expert / Exploration,
    Island, Labyrinth); on a computer the groups spread evenly. LABYRINTH STAGES a part
    of its own, capitals, arrow; closed at first on a phone, open on a computer.
  - Picture 128 px on a phone, 160 on a computer; another state written "#1252"; the
    alliance badge sits by the foundry line on a phone, level with the name on a computer.
  - Edit icons share one colour per page (the first SVG gradient of that name wins); the
    red ones on the profile have their own (DUE_EDIT_ICON, NEUTRAL_CANCEL_ICON). Other
    pages with edit icons in different colours still have this bug.
- 20:35 push, the calendar:
  - Phone: the controls are one line (date, views, Filters, UTC; Today and Filters as
    icons; a week's title without its year, the date shrinking on narrow phones,
    fitToolbar in main.ts). Next up and Then open the page above them (next-up.css,
    display: contents on the layout) and shrink and fade as the page scrolls
    (holdDayNames). The controls, then the calendar's top with the day names, stay put on
    the page's own background (fixed page background, the panel's glass drawn in
    .weekday-names.stuck::before); the dates of the week scrolled into stay under the
    day names (heldDatesRow, .held-dates). The phone opens at the top; Today glides down
    to this week (glideDownToToday, 750 ms), as does switching from week to month.
  - Icons in the site's style (one stroke from --section into white, own gradient ids):
    Today is the pin, UTC two curved arrows, Filters a funnel with drops, the views'
    calendar pages; all centred on one line.
  - Computer: the controls end at the calendar's right edge (the space above the right
    column is kept for reminders), Filters opens under its button; held dates on the
    calendar's glass.
  - A bar that is only its logo (Sunfire Castle) no longer shows its short name.
  - 20:50 push: the weeks fade in just under the held dates (computer: a mask on .weeks;
    phone: .held-dates::after, 18 px); the held band's glass copies the panel's
    saturate(140%) so it is not darker (on her phone, still to be confirmed by her); no
    weekend tint in the held dates; the held dates name the week whose bars are under
    them; UTC/Mine keeps one width (time-word-box), so no icon moves.
  - 21:00 push: the year view is set aside, not deleted (YEAR_VIEW_SHOWN = false in
    shell.ts; a kept 'year' opens as the month); Week and Month sit together as one
    choice, apart from Filters and UTC; no sliver under the day names (fractional
    --held-dates-top, the names' band 1 px deeper); a reload on a phone starts at the
    top (scrollRestoration manual at the start of main.ts); the Next up tiles fade in
    every view.
- Earlier on 25 Nov: new-version notice, top bar across the window and held at the top on
  a phone, day names held on a phone.
- New version live: src/ui/new-version.ts checks version.json (written by vite.config.ts)
  every 5 minutes and on coming back; reloads in the background, offers Reload on screen,
  never reloads while editing. A page opened before this needs one manual reload.
- Earlier on 25 Nov: Roboto and the shared panel rules.
  Only main is on GitHub.
- Font: Roboto everywhere (index.html, tokens.css), event short forms stay Montserrat.
  Roboto is installed in the workspace, so renders match the site. The calendar bars and
  cards are laid out again when the font arrives (layOutCalendarAgain in main.ts).
- Event panels share one set of rules (notes/page-style.md, "Event panels";
  event-panel.css): --panel-top 15, --panel-title-gap 15, --panel-section-gap 25,
  --panel-bottom 15, measured on what is drawn; .panel-title (almost white capitals);
  sub-titles written as is, white, bold; panel backgrounds take both event colours
  (tintedPanelStyle); pageButton for links to other pages ("SvS Records"). Rules,
  Rewards, Missions, Points, SvS and Sunfire results follow them.
- Timelines: phases and SvS stages 13px capitals, days and steps 12px, soft line colours
  (softLineColor), SvS line by part (lineColor in event-types.json: blue, red, triage
  green), the pin on the current row.
- SvS results: full totals (11,028,870,560) sized to fit, no number bigger than them;
  editing with full numbers, totals and WIN/LOSS worked out live and on save; times typed
  as digits only.
- SvS results panel (src/ui/svs-results.ts and .css, called from results.ts), designed
  with Roxanne from the game screens and accepted. Her decisions are in
  design-decisions.md under "SvS results panel". Every SvS stage opens the whole State of
  Power (dates, timeline, results); the timeline writes its stages in capitals.
- Sunfire Castle results (src/ui/sunfire-results.ts): Occupation Ranking in each
  alliance's colours, then the president. History on the State page from
  seed/sunfire-results.json. A timeline with nothing in it is not shown.
- seed/svs-results.json holds every SvS's president. The title is worked out from the two
  results: Supreme when one side won both, the invader's when they won both.
- Records: points_ours, points_theirs, points_ours_1..5, points_theirs_1..5; holds hold_1,
  hold_2… as "ours|DVL|7090"; an outside president's tag is detail president_tag.
- Editing results in place (SvS and Sunfire), admins only: the profile's edit button
  (editButton, EDIT_ICON in edit-forms.ts; .edit-button in forms.css) on the tabs' line
  (event panel option tabActions); Cancel and Save take its place; svsDetailsFromEdit in
  main.ts sorts and saves.
- SvS, its parts and Sunfire have locked dates (datesLocked in event-types.json): no edit
  in their head. Other events have the edit button in the head instead of the round
  pencil; every edit button in an event panel takes the event's colour (--event-color).
  The head's button still opens the old forms (to convert, see below).
- Site-wide rule (25 Nov): no page opens in editing mode or shows Save; every editable
  page or panel gets the edit button and edits in place. Still to convert, each with a
  quick mockup first: the head's date/repeat/alliance-time forms, results of TAL, Tyrant
  and the alliance events, My alliance results, Opponents, rosters, plans, Link an
  academy, Give a role, transfers, blacklist, Fortress planning, personal entries,
  availability.
- The president icons are cut out of her screenshot; the real files are to come from her.
- In the database since 25 Nov: 7 Nov SvS (WoS Oracle's points, LLC and DVL holds), 10 Oct
  SvS, 21 Nov Sunfire Castle (ranking and president from her screenshots), each with a
  "source" detail.
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

- Flame and Fangs needs its colour adjusted: its logo is hard to see on the bar (Roxanne,
  26 Nov: "make a note for the future").
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
- Armament Competition and Officer Project: keep tracking their dates. Every two weeks
  (weeks of 7 Dec, 21 Dec, ...) remind Roxanne to tell you which days the game shows,
  and save them with her as the source. A reminder is scheduled in chat for 7 Dec 10:00
  Bucharest; set the next one each time. Seen so far: Armament 9, 13, 27 Nov; Officer
  Project 11, 15, 25, 29 Nov (two days each). A guide (Out of Games) gives Armament
  Mon-Tue and Fri-Sat, Officer Project Wed-Thu and Sun-Mon, every two weeks; the Monday
  Armament did not run on 23 Nov.
- TAL's Hall of Heroism stage (21-29 Nov in the game): to add discreetly, maybe with its
  own switch in the filters; Roxanne decides later.
- The yellow events (Hall of Heroes, TAL, KOI, State Transfer) need telling apart. The
  25 Nov mockup was rejected as brown and depressing; bring a new version.
- Packs category: Roxanne is sending screenshots.
- Special events: icons and colours are placeholders until her logos; New Year (start 1
  Jan only) and the Harvest feast day (1 Dec, top 10 alliances) are not added.
- Packs (Roxanne, 25 Nov): some packs are only for new accounts or once in a lifetime. Her
  1252 account has had them already; her 1458 account is new and has nothing. Mix &
  Match and Custom Pet Chest were on both accounts. Screenshots wanted on Mondays (game
  calendar) and Mondays and Thursdays (Top-up Center).
