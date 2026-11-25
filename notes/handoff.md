# Handover: where the work stands

Do CLAUDE.md's setup first. Updated 25 Nov 2026.

## Now

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
    the edit icon after the number, red with a dot a month after it was set (that month
    is not confirmed by her yet: ask).
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
