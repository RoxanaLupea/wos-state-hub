# Handover: where the work stands

Do CLAUDE.md's setup first. Updated 25 Nov 2026.

## Now

- main is the live site, built and checked on GitHub (25 Nov, commit after a2326eb: SvS
  editing worked out live, Matchmaking title, timeline pin, digit-only times). Only main
  is on GitHub.
- Live on 25 Nov: Next up / Now cards per event (State of Power one card, "Now" with its
  stage while it runs); SvS editing with full numbers per day, totals and WIN/LOSS
  worked out from the days and the ranking (svs-results.ts updateSvsEditor, main.ts
  svsDetailsFromEdit); MATCHMAKING title above "#1458 vs #…"; the pin (PIN_ICON in
  edit-forms.ts) in front of an event's current row instead of the tint; times held typed
  as digits only (typeHoldTime). The SvS opponent's state is read by
  admin_tools.refresh_other_states (supabase/svs-opponent-state.sql, run 25 Nov).
- 7 Nov and 10 Oct: the rounded WoS Oracle days were adjusted in the database so they add
  up to the exact totals (her instruction, 25 Nov).
- Open: the State page's Presidency (SvS and Sunfire results, ours and the opponent's
  state) is still to design. "Alliance Championship" runs past its Next up card on a phone
  (flagged, not fixed).
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
