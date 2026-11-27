# Design decisions

What Roxanne says in the chat wins over anything in these notes. Earlier chats wrote some
entries in their own words; when an entry and her words differ, follow her words.

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
- Section colours (Roxanne, 24 Nov): every section has its own colour, and all of them
  have the same lightness and the same amount of colour; only the tint changes. Measured
  as the accepted ones are: about 75–81% lightness and 72–83% saturation in HSL (the
  amount of white), not by OKLCH, which made the gold and amber too dark. The
  Calendar's tint is the blue of its logo (public/images/events/calendar.png). The 1458
  takes the open section's colour. Buttons on a page are in that page's colour. The
  second colour is almost white with the section's tint, much lighter than the main one.
  Pop-ups use the page's two colours too (24 Nov).
- A whole page has one first colour and one second colour, everywhere: its accent, its
  buttons, what it marks (current phase, holders, our group) and its pop-ups. No other
  accent colour on the page (Roxanne, 24 Nov).
  The rule is kept to avoid clutter; "however, if a page has 5 types of something I might
  choose to use 5 colours" (Roxanne, 26 Nov).
  Fortress's second colour is 35% of its violet with white (Roxanne, 24 Nov; she tried
  55% and went back to 35%). Tyrant's is 50% of its cyan. The Tyrant section reads
  "Frostdragon TYRANT" (TYRANT in capitals in the first colour) (24 Nov).
  Accepted 24 Nov: Calendar #8BB7F4, Fortress #B0AAF1 (gold and cyan at the same
  strength looked too dark to read and are being lightened).
- The open section shows its logo (the Calendar has its own, calendar.png) and its full
  name in its colour, with the line under it on the band's lower edge; the other
  sections keep their short names. On a computer the band keeps its height with the
  logo, sections, clock and Sign in centred on one line. The page's own event title is
  gone: the band names the section (the Tyrant pages' titles are the day only). Built on
  profile-draft 24 Nov.
- Transfers keeps the light gold as its second colour and has a third, only for the
  Timeline's highlight: the blue (#4FA5FC) that lights our group and, stronger, our
  range; our range is written in gold (Roxanne, 24 Nov).
- Transfers #F0D99D and Tyrant #9DDCF0 (lightened 24 Nov, "ok, better"). SvS and
  Hellfire take one of their logo's colours: SvS's blue #8FB5F4 at the sections' strength
  (red read too pink, then too red) and the league's amber #F0CB9D, at the sections' strength
  too (24 Nov). SvS and
  Hellfire's second colour is 35% of their colour with white, as Fortress's. State, My alliance and Map use the Calendar's
  blue.
- Every pop-up uses the page's two colours (Filters, Save for which accounts, the menu
  under the name), and the phone's back closes open Filters before anything else.
- The player page has the colour of the account's alliance: the 1458, its accent and its
  second colour all come from it, one accent and one second colour for the whole page
  (Roxanne, 24 Nov). The alliance's colour is evened first: its tint kept, at the
  sections' lightness and strength, so every alliance reads as clearly (24 Nov).
- The phone's own back does what the site's Back does and nothing more (see "Calendar
  selection" below). It never moves from one section to another: sections are opened
  by tapping them.

### Page names inside a section
- Uppercase, a little bold.
- The open one is in the section's colour, slightly larger, with a line under it. The
  closed ones are in the section's second colour, almost white (24 Nov).
- On a phone they sit centred and scroll sideways when they do not fit; on a computer
  they start at the left edge, in line with the content, and the page's own controls sit
  at the right of the same row (24 Nov).
- Switching between them is animated.
- This is how every section moves between its pages. Only the colours change.

### Records keep the player as they were (site-wide)
- Players change names but keep their ID. A record keeps the name, picture and power the
  player had at the time, and is linked to the ID, so the site knows who that account is
  now under its present name. Records are any closed event: the president list, old
  event lists, transfers (Roxanne, 26 Nov).
- On the transfer list, name, picture and power update hourly until the player is a
  confirmed transfer; then they are locked as a record on the transfer page. Their
  profile and new data keep updating, but not the records (Roxanne, 26 Nov).
- Reads for the transfer list: "we really only need an accurate read before reset"
  (Roxanne, 26 Nov), instead of hourly reads.
- Power over the cap: "having the status set as over cap is enough" (Roxanne, 26 Nov),
  no red power; the table still shows every player's power as a number ("we want to
  record the 650m too, not all players are over cap"). FC level and three troop tiers
  (infantry, lancers, marksmen) in the table; skills are not known unless the players
  update them (Roxanne, 26 Nov). Setting the status to sent asks for a fresh read, which brings the new
  power, under the cap once the player has dropped troops.
- Hourly power reads from when the invitation phase opens (not before) until the transfer
  is confirmed, changing
  the status from over cap when the player is under it, even before the invite is sent
  (Roxanne, 26 Nov). Only for those not transferred yet: "it will just be 1 day or 2 for
  those who come in late".
- The Invites page has a countdown to the invitation phase and shows when the transfer is
  ongoing (Roxanne, 26 Nov).

### Transfers
- 1458 is an ordinary state by default; an admin sets Leading when it is (Roxanne,
  26 Nov).
- Invites page: "Same thing they do in those spreadsheets, only better because we have
  the means to make it better" (Roxanne, 26 Nov). Three lists, special invites, normal
  invites and open spots, each with its limit. 1458's Contact column is the alliance
  the player goes to (her assumption).
- Rows: "we are going to build our rows in the list - by row i mean a template that each
  row will use, not an actual table row with words, just like we built our profile page,
  but more concise" (Roxanne, 26 Nov). WoS Oracle link per player: not decided yet.
- The alliance they go to: admins may also enter alliances we don't know; only NAP
  alliances are recorded, but other alliances live in the state. A top 50 from the API
  is possible but would hardly be used (Roxanne, 26 Nov).
- Contact (Roxanne, 26 Nov): "keep it as contact and we either add an alliance or a name,
  when we add a name we can link it to a player or select the alliance". Contacts seen:
  利姆魯 (RUU, R3, ID 175635265) and Kat (on the same list, ID 155007799).
- Statuses (Roxanne, 26 Nov): "It's overcap, send, transferred. I don't think it's revoked.
  Rejected, I think. That's if they do reject it, like transfer to another state. Otherwise,
  we have expired if they did not reply and they're still in their old state." So: Over cap,
  Sent, Transferred, Rejected, Expired. No Revoked and no "Not sent" (Claude made that one up).
  "Once the transfer opens that label should be displayed, it would be ready/over cap"
  (Roxanne, 26 Nov): every row shows its status from the opening, Ready or Over cap first.
- Statistics, as 1060 had two sets (Roxanne, 26 Nov): during the transfer, how many of
  each list's places (normal and special) are assigned and how many available; after it,
  how many invites were not sent at all. Open transfer arrivals were unknown before; now
  the ones not already on our list can be filled in from WoS Oracle's records.
- When the invitational transfer ends, the places of those who have not transferred go
  to the open transfer list (Roxanne, 26 Nov).
- Records can still be changed afterwards by admins: someone who got an invite without
  being on the list is added, and a player can be moved from one list to another
  (Roxanne, 26 Nov). The lock on a confirmed transfer keeps the name, picture and power of
  that time; which list the player is on stays editable.
- An invited player who arrives in the open phase stays on the invite list; rare, moved
  by a person if needed. The time of the transfer confirmation is kept, "shown only when
  we hover as a date and time" (Roxanne, 26 Nov).
  On a phone the same shows when the transferred mark is tapped.
- Countdown (Roxanne, 26 Nov): the page shows the countdown for the invitation and the
  open transfer, 2 phases, and is marked as over when the time is over.
- The three types of invites use "the gold purple blue system" (Roxanne, 26 Nov).
- WoS Oracle link on each player: no for the first build; decided after seeing it.
- The row's look is designed only after all the data it shows is selected.
- A player added to the transfer list gets a profile, so each row can open the full
  profile. The row also shows the current state, the Labyrinth total and the Migrant
  Score (Roxanne, 26 Nov). No passes on the row: "just the migration scores".
  Kills on the row too: "very low means inactive, high means a concern".
  The Migrant Score is labelled SCORE on the rows: "I think I want to replace transfer with
  SCORE" (Roxanne, 26 Nov).
  The place number is the row's position in its list (1, 2, 3…), not a stored field.
- New players on a list (Roxanne, 26 Nov): "my interest is that when we add new people they
  get the info without me having to tell you we didn't receive it or refresh it".
- Blacklist (Roxanne, 26 Nov): "we will have a blacklist for sure", probably created from
  this page and kept separate; nobody has to look at it, but if an ID is on it, the
  entire row gets flagged.
  1060's CHECK column (🪰 not checked, 🥳 check passed, 🚩 a problem) is not carried over:
  the site always checks, so only the flags are shown, when there are any.
- A player who says no (Roxanne, 26 Nov): removed from the list, or, if the invite was
  sent, it stays sent; "once it's over if they didn't show up it will be ignored or
  rejected". 1060's Pending is not carried over.
  Each transfer keeps the list of those who ignored or rejected us; they are flagged
  along with the blacklist when added again (Roxanne, 26 Nov).
- Special invites available are calculated by the site from the rule and the past
  transfers (specials used, one back each month, up to 3), not typed: "Why can't we just
  have the number up instead of waiting for an input like a lazy site?" (Roxanne, 26 Nov).
  Starting point: 1458 has 3 special invites for the 6 Dec 2026 transfer (Roxanne, 26 Nov).
- 1458's previous transfer records (the month tabs of "1458 transfer December") will be
  imported (Roxanne, 26 Nov). Wasted invites are never shown: "We do not wanna say, look,
  this is what previous leadership wasted"; the page can be seen by everyone.
- 1060's Extra stage was for more people interested than invites. Instead (Roxanne, 26
  Nov): the open list takes more than 20; the first 20 are normal and everything after
  is a little dimmed; rows can be moved up and down the list for that purpose. Linked
  players (a group) ideally stick together, but moving one player moves only that player.
- The invite list stops at 35: "35 is the absolute maximum of people who can accept an
  invite, and we should never send more than 35" (Roxanne, 26 Nov).
- A row is a card (Roxanne, 26 Nov): a graphical element, easy to read like the profile,
  where one look gives all the information; not one column of text after another. One
  card is described and shown for everyone; it is still a list, ordered and moved up and
  down, but not a list of text columns.
- Exalted skill level on the card (Roxanne, 26 Nov): a badge on the troop picture's lower
  left, the counterpart of the FC badge at the top left: the FC10 badge's hexagon and gold
  rim without its flower, a little smaller than the FC badge, the figure centred. Coloured
  by level: 3 red, 2 orange, 1 yellow, 0 purple. No badge when the level was never set.
- Skill levels are set as 0, 1, 2, 3 (replaces None / Lvl. 1 / Lvl. 2 / Lvl. 3 on the
  profile); not set is different from 0 (Roxanne, 26 Nov). To change on the profile when
  this is built.
- Invites page has two views, Compact and Details, switched from the top like the
  calendar's views (icons, not pages): Compact is one narrow line per player, Details is
  the card (Roxanne, 26 Nov). The countdown takes one line at the top on a phone.
- The ID is very important in transfers and has a copy button: the president or transfer
  manager copies it and pastes it in the game to send the invite (Roxanne, 26 Nov). The
  profile opens from the picture, with no extra row for it.
- A player whose ID is linked to a site account (Discord or Google) is marked site-wide,
  as part of their identity, very discreetly (Roxanne, 26 Nov): draft is a small grey link
  on the picture's top corner.
- The third list is "Open Transfer" and shows only once someone is added to it
  (Roxanne, 26 Nov). The middle list is "Ordinary Invites", the game's word.
- Over the cap is shown by the Over cap status; the power is never red: "don't make the
  power red" (Roxanne, 26 Nov, replacing the earlier red-power rule).
- Player rows (Roxanne, 26 Nov):
  - ID and copy: the ID is grey. The copy button is a little bigger, in its original icon
    style, and copies the player's ID: "copying that user copies the id, but we're copying
    the identity of the player". The last player copied keeps the Copied state "so the user
    knows which one was last"; the ID itself never turns yellow.
  - Origin state: in Details after the power; in computer Compact its own State column, the
    last one (after Transfer); in the Add and Remove pop-ups after the power.
  - FC: in Compact a column where the troops were, on the computer and the phone; in Details
    only when the troops are not shown. On the phone the FC column sits a little left,
    leaving room for a normal 16-character name: "If they pick the worst case scenario they
    have to live with it being cut".
  - Details: full names; everything centred in its column; more space between the troop
    icons; the name is 14 px on the computer so a 16-character name fits.
  - Editing is done in place with nothing shifting (the site-wide editing rule, 25 Nov).
- Who may do what on the Invites page (Roxanne, 26 Nov): all admins and R4s can add
  people to the lists; only the transfer manager and admins can change the status (sent,
  over cap and the others). The status is set by tapping it on a phone or clicking it on
  a computer and picking another one; it must be clear it can be tapped.
- Adding a player (Roxanne, 26 Nov): "it should be a pop-up, just like when we add the
  character to our user account. And it should like take in the ID, then show us the person
  which we confirm." Not a row opening in the list.
- Moving players (Roxanne, 26 Nov): "Can we have long tap and then drag for the mobile? And
  the 3 lines in front of the row, and if we click on them, we drag the entire row. Like,
  can that be a way where to move people lower, upper, or even to a different table? And if
  we go all the way down to the invites, we get the option to put it in open." Open Transfer
  shows as a place to drop while dragging, even when it is empty.
- Accepted mockup (Roxanne, 26 Nov: "Much much better"), on phone and computer:
  - One Add for the page: on a phone on the countdown line, on a computer on the tab line at
    the right edge of the lists. The pop-up is Add character's: the ID, the person found,
    then Special / Ordinary / Open as kind-words (a full list greyed), Cancel and Save.
  - The status is an icon and a word in the status's colour, drawn like the Edit and Add
    buttons (no box, no arrows: "They're ugly"). Ready (light blue, ticked circle), Over cap
    (red, arrow up to a line), Sent (section colour, paper plane), Transferred (green, arrow
    in), Rejected (red, crossed circle), Expired (faint, hourglass). In Compact it sits under
    the power, in Details above the contact. Tapping or clicking it opens the list under it,
    the current one ticked.
  - Remove does not go in the status list: "Remove has no business there" (Roxanne, 26 Nov).
    Dragging only moves rows.
  - Removing asks with a pop-up showing the player, as adding does (Roxanne, 26 Nov):
    "Everywhere else, when we delete something, we added a confirmation pop-up. I think that
    would be more appropriate than undo or whatever... the short thing on the card, that's
    what we should do for delete... We show exactly who we're removing and confirm it."
- How a group looks (Roxanne, 26 Nov: "I like the shading. I would keep the ring also",
  then "I like this more"): a shade in the group's colour from the left of the row fading
  out after about 160px, starting a little left of the list so the picture has room, the
  group's first and last rows rounded on the left; the picture's ring in the same colour.
  Each group has its own colour.
- The group buttons while editing (Roxanne, 26 Nov): not "Leave group" ("we are removing them
  from the group, we need better text and gray is not the go to colour"): Ungroup, in the
  group's colour (her "ok"); and "add to group can be smaller, just say Group".
- The transfer manager while editing (Roxanne, 26 Nov): "transfer manager should handle
  typing the name and selecting what the site finds, so a search, id as a backup". The
  state's players come from its alliances' rosters; an in-game ID is looked up in the game.
- The transfer's settings (Roxanne, 26 Nov): "those settings are for the state transfer, not
  for the invitation transfer only".
- The card's own Edit (Roxanne, 26 Nov): "we are gonna have an edit button for the state
  transfer, right? Then we edit in place. Like we normally do, we also need to show the
  ordinary/leading label".
- The president and the transfer manager (Roxanne, 26 Nov): "Setting the president also sets
  the transfer manager and should have the same search system, we are allowed to change it in
  one case only, then we win prep but lose battle".
  And: "if we win the prep and lose the battle then the former president is the transfer
  manager unless we edit it".
- The transfer manager on the card (Roxanne, 26 Nov): "maybe we want to move it before
  available invites and write transfer manager in that yellow, ordinary state looks muddy".
- The lists' views (Roxanne, 26 Nov): the underline under the chosen view sat on top of the
  list's line ("there it wasn't a line sitting on top of a line"); the chosen view's mark now
  lies on the list's own line, "ok, but then the icons have to have the colour of the bar".
- The phone's back (Roxanne, 26 Nov): it closes what is open over the page (Details, a
  profile, a pop-up), and otherwise "phone back should actually go to the previous page, it's
  counterintuitive to leave the page instead".
- While editing, the row's Group (or Ungroup) and Remove end where the statuses end: on the
  right of the column, centred in Details on the computer (her "ok", 26 Nov).
- The phase header (Roxanne, 26 Nov): "I still don't know, we'll keep the phase for now".
- A special invite generated during the transfer (Roxanne, 26 Nov): "i would prefer if we had
  a star on the of 2 and on tab or hover it showed that the 2nd special will only be generated
  on the 1st of the month: the day of the week and which phase of the transfer".
- Reads of listed players (Roxanne, 26 Nov): "Only from the current list, we are not gonna mess
  with older transfers, just this once, after we get the complete list we ask for their info
  and the records will have a tiny star which tells us that the records were received at the
  x date, not the date of transfer for the older ones, from now on we will have them monthly".
  "until they get a fresh read you mean, one good read and we're good".
- Past transfer managers (Roxanne, 26 Nov): "fill in past transfer managers too with a * and a
  note that the transfer manager wasn't recorded so we're displaying the former president
  instead, this should be editable for admins".
- Importing the old transfer sheet (Roxanne, 26 Nov): Aunie, migrated without an invite:
  "probably open if everyone else from the other transferred, but these are old records,
  we'll get what we can". "Terry+Norr group": "this will be a group". "Declined" and
  "Invitation rejected/decline": "so a status". March's arrival times: "we have this too on
  the hover". "Reduce power": "our over cap" (a player left uninvited for being over the cap).
  "replaced on request of onion": "then they didn't make it" (kept as not transferred).
  The March tab is the 29 March 2026 transfer: the original sheet's version history shows
  Angel Ryoko added to it on 17 March (Roxanne's screenshot, 26 Nov).
  Invited, not migrated and no note: "expired".
  The February and January tabs (names and IDs only): imported as who was on the list ("that's
  all we have, we'll figure it out after"); "if they're in the state then they transferred".
  Groups: "we should be able to add names to the groups, optional" (to design).
- Blacklist (Roxanne, 26 Nov): "we will add a blacklist, but it should be on the state page,
  even if we don't have it yet, we can add it in the database so we can show the flag, it's
  gonna start with id and reason and whatever else it has" (supabase/blacklist.sql).
- Ordinary or Leading while editing (Roxanne, 26 Nov): "the row doesn't have to be that wide,
  that doesn't mean that selected one can't have an accent colour".
- Refresh (Roxanne, 26 Nov): "we will let anyone refresh, we still have the 1h limit so it
  shouldn't matter if everyone gets refreshed by others too".
- Making groups (Roxanne, 26 Nov): while editing, each row has Remove and a group button
  ("when we edit, we can remove [or] group"); the contact stays editable, the power gives way
  to the buttons, with their words. A group can be left or joined; joining asks which group.
  "When we create a new group, we should be able to create it custom... select everyone, or
  select the people with a common state. So 1252, if I pick 1252, everyone in 1252 will be
  automatically put into a group, or based on the contact... make it a real pop-up, because it
  will give us options." Many small groups of 2 or 3: "we need many colors that work".
- Balance (Roxanne, 26 Nov): the picture is the tallest thing on a row and everything is
  centred on it; the blocks beside it keep the same rhythm (no tight name and ID beside widely
  spaced buttons). On the computer the right side mimics the phone profile, its width and look;
  the statistics follow it.
- Player profile on the Invites page (Roxanne, 26 Nov): made like the profile, keeping the
  extra characters, "because that will tell us which farms they will bring", "or what other
  big accounts they have when they add them".
  It is the player's actual profile; the transfer's snapshot is in the table: "That's the
  actual profile, and the snapshot will be in the table" (Roxanne, 26 Nov). It shows during
  transfers; tapping a former transfer on Records goes to the player's current profile.
- Computer layout of the Invites page (Roxanne, 26 Nov): the lists scroll in their own box
  and fade at the bottom like the calendar, a small fade ("I just don't want it to be
  suddenly cut"); no panel around the lists ("I don't want the panel for invites"); the
  profile is in a panel card ("like this it just hangs in the air") as tall as the lists'
  box; the group shades keep their rounded left edge inside the box.
  The selected row keeps its group look with a thin border ("keep the same style as the
  group has, but add a thin border"); the profile card takes the group's colour "as a top
  accent", meaning "the background should have some of the colour of the group in it, and
  the bottom line can be the colour you added on top". With no profile open, the transfer's
  numbers are "a panel with a cool design"; "the yellow of the page will only be used as
  accents for the stats panel, the yellow makes it look washed and hard to read, or maybe it
  just has to be darker since we have all the icons there, and group and power cap can be more
  visible" (Roxanne, 26 Nov).
  The statistics panel is the site's glass, tinted gold ("it's ok", Roxanne, 26 Nov).
- The transfer's head (Roxanne, 26 Nov): "group and the cap as one line, transfer manager as
  another, and centered, remember players can have 16 characters in their names plus the
  alliance": TRANSFER: INVITATION (or OPEN), the time left, then "1190 - 1552 · 1.0B". The
  phase bar's words go above the lines, and "OPEN is enough".
- Phone title and Details (Roxanne, 26 Nov: "I'm not sure the call to have 2 views was wise
  since now we have views inside of views, maybe we just need a details button to open the
  card and when we do we open it with title too"): no lists/statistics views; a Details
  button opens the card from the bottom, with its title. The transfer manager's name can be
  16 characters plus the alliance, so the label sits on its own line above the name.
- The card's facts, centred (Roxanne, 26 Nov): group and power cap on one line, each with its
  label above; under them "TRANSFER / MANAGER" as a two-line label beside the name, the name a
  little bigger. No "until…" sentences: "is that how a countdown looks like?". The phone title
  names the phase in full ("Invitation transfer", "Open transfer"); Details does not show the
  phase or countdown again.
- The places section is called "Available invites" (Roxanne, 26 Nov).
- The card's order (Roxanne, 26 Nov: "In the card, the current phase and a times below
  centered, transfer manager under and then the rest, transfer manager on top on the mobile
  card too"): on the computer the phase in full and the time at the top of the card, centred;
  then the transfer manager, group and power cap, available invites, status. The phone's
  Details starts with the transfer manager (the title is above it).
- After the transfer the panel shows the number of invites sent: "let's write the number of
  invites sent instead" (of the invites never sent) (Roxanne, 26 Nov).
- Which transfer the Invites page shows (Roxanne, 26 Nov): "The current transfer stays there
  until Sunday at reset, on Monday the list for the next month will take its place, which is
  what made me realise we need the dates too, because we want to be able to swap to future
  transfers, on Monday the current transfer will go to records, we'll show 2 per page, each
  with their date and statistics".
  "Countdown is only for the next/current transfer" (Roxanne, 26 Nov).
  The Invites page shows the current transfer and future ones only: "we don't show past
  transfers here, just future ones, this is a planning page" (Roxanne, 26 Nov). On the
  computer the date sits above the lists with Add and Edit on its line ("they're about the
  lists not the page"), and the card starts level with it.
  "We won't know the transfer manager, only after we see the svs result" (Roxanne, 26 Nov):
  a later transfer shows "After SvS" in the manager's place.
  "we need a pin like we have on calendar to return to our "current" transfer, the current
  transfer is the one next in our queue, once one closes another comes up, that's what i meant
  earlier with current/next transfer, only one gets the focus and the swap happens on monday"
  (Roxanne, 26 Nov). Only the current transfer has the countdown.
  Phone title: the phase in small capitals, then the countdown for the transfer in progress
  ("no date needed when the transfer is in progress") or the date for an upcoming one; Add,
  Edit and Details centred on the two lines; transfers change by swiping (Roxanne, 26 Nov).
  The pin back to the current transfer shows only away from it, directly after the date, on
  the phone and the computer alike ("stop creating inconsistencies").
- Records only: the group shade stays inside the list (the rows' content 10px in); the Invites
  page keeps the approved look, the shade starting a little left of the list (Roxanne, 26 Nov).
  Later the same day: on the computer the rows of both pages start on the list's line, the
  shade and grips inside it ("the computer is the primary target"); on the phone Records' rows
  sit where the Invites rows do: "I want to not have the 4px difference" (Roxanne, 26 Nov).
  Records use slightly smaller type and tighter rows "to see more" (Roxanne, 26 Nov).
- Records page, accepted (Roxanne, 26 Nov: "ok, i like this"): past transfers newest first,
  two side by side on the computer, scrolling down to older pairs (no paging), each pair
  starting on the same line. On the phone one transfer at a time, swiping to the next
  ("i think on the phone we would like to swipe", Roxanne, 26 Nov).
  "again, a pin to get us to the most recent": the pin sits directly after the date, only when
  away from the most recent transfer. On the computer too: "didn't I ask for records to have a pin? Of
  course they need one" (26 Nov). Each transfer's head is two lines: the date,
  group · cap and how it ended (Transferred, Rejected, Expired counts); the manager, who arrived
  from each list in its colour and the invites sent; then who came, as they were, list by list.
  The scroll box fades at the bottom, and at the top once scrolled.
- Group colours (Roxanne, 26 Nov: "i hate the lime, pick colours that would look good as a
  card", then "these look good"): teal #5FD0C2, pink #EE8FB8, sky #7FC8F2, coral #F4A07E,
  violet #A99BF5, aqua #6FD6EC, orchid #D98BE6, cobalt #7C92F5. No yellow-greens. Neighbouring
  groups never share a colour, and sky, aqua and cobalt are kept apart.
- Still to design on the Invites page, in her words (Roxanne, 26 Nov):
  - Statistics on a phone: "a phone needs to be able to swap between them" (the lists and
    the statistics).
  - "dragging should be available for all lists and from one list to another".
  - "we need to see how the page looks once transfer is over".
  - Flagged rows (blacklist, ignored or rejected before): "put it where the over range is like
    a warning, and show the reason on hover, click takes us to the entry in a former list -
    will be working after we design the blacklist".
  - The transferred time on hover or tap: "ok".
  - Contact: "I have no idea how to do it yet - we type and get suggestions? we include it when
    we add?"
  - Add problems: "not found still lets us add it after a few retries? already on a list means
    we can't add it - we tell them which list, blacklist will say the player is blacklisted in
    the list if we add it but it should also tell us when we add it, list full gives the option
    for open until things are clarified".
  - "custom means we select the players ourselves".
  - Transfer manager: "show it, there's plenty space".
- Groups of players who come together (Roxanne, 26 Nov): no group name; visible as the
  same group in all 3 tables (how it looks, on the picture or the whole row, is decided
  when she sees it). Groups go from 2 to 15 people, so both ways: select several players
  and make them a group, or add them one by one like adding a player, linking each new
  one once there are 2, or link them at the end. No control names are agreed yet.
  A group does not show when one member holds it up (e.g. over the cap): "it creates more
  work to show something it's not even there most of the time, so we end up highlighting a
  problem that then we have to ignore mentally" (Roxanne, 26 Nov).
  A group can come over 2 transfers; how many places a group needs is information, not a
  warning. Players who did not transfer are not carried to the next transfer: "if we want
  that we'll add the id once more" (Roxanne, 26 Nov).
- Each transfer records its transfer manager (Roxanne, 26 Nov: "I mentioned the transfer
  manager rules precisely because of that").
- Power cap: "filling in an estimate of power which acts like the actual cap until
  confirmed or changed", "not about one transfer, I need it for all of them, past
  transfers and future transfers" (Roxanne, 26 Nov). The estimate follows 1458's
  generation and FC on that date (rules-and-open-items.md, State transfers).
  Today's figures are used for past transfers too: "It's fine, we just want an estimate".
- Adding a player to the invites: "when we add a new person we add the id and we get the
  rest" (Roxanne, 26 Nov). The table shows the picture and name with the ID under it.
- A group is the ranges that share a generation and a furnace cap. A difference in
  either one starts a new group, because a player can only move to a state with the
  same content released as their own.
- A skipped state number is a state that no longer exists. It does not start a new
  group.
- The group is drawn as aligned ranges in three weights. Our group's text is white.
  The range we are in carries light yellow accents, with its text in yellow.
- The furnace cap and the generation are centred, and so are their columns.
- The section is named "State TRANSFER" in the band when open: the first word as
  written and in the second colour, the rest in capitals in the first (24 Nov; the
  page's own title is gone). Fortress the other way round: "FORTRESS Battles", FORTRESS
  in the first colour, Battles in the second (24 Nov).
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
  controls are "All | Ours" and "Ranges | Groups", All and Ranges first; the Timeline
  opens on SvS only, All and Groups (Roxanne, 24 Nov), each showing both choices with the chosen one lit in the page's
  parchment colour, like the ticked boxes (23 Nov). A group is made of the ranges
  that share a furnace cap and a generation.
- The date columns scroll as one sheet, like a spreadsheet: no scrollbar per column,
  one scroll down for all of them under date heads that stay at the top. Every column
  starts at its top, as in the spreadsheet: no empty lines are added above a column,
  in any view (Roxanne, 24 Nov: "I never asked for them, I never had them in the
  spreadsheet"). Where the dates list the same ranges, our range is on the same line
  in every date by itself.
- Ours shows the ranges our group covers on any of the dates, from the highest to the
  lowest, and nothing above or below them; on each date the lines outside its own group
  are faint (Roxanne, 24 Nov).
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
- SvS results panel (25 Nov, from the game screens; accepted as the last mockup showed it,
  states and VS at the top): the results are
  for the entire SvS event; opened from Preparation or from SvS Battle, only that part
  shows. WIN and LOSS are written in caps.
- The split bar's meeting point is a line, not a fuzzy dot; on the total it is a line
  that pulses a little light (25 Nov).
- The president is always known from our castle records, never "not recorded": if the
  opponents win both, the invader is the president; if we win both, we get the Supreme
  President; if we win Preparation and lose the battle, we are the president. "Supreme
  President" never shows on a win and a loss: the title is the game's, Supreme
  President or President No. N (25 Nov).
- Check history has an arrow that shows it jumps to another page (25 Nov).
- Alliances in the SvS results take the state colour, not their own: ours blue, the
  opponent always red. DVL shows blue because it acted as the state alliance. "Do this
  for now" (25 Nov).
- The president shows with the alliance they are part of, not the one that won the
  castle. If it is our state (DVL, TOP or whoever), it shows with the alliance's logo and
  all of that; if it is them, just a normal red pill (25 Nov).
- State of Power's stages are Matchmaking, Preparation, Battle and Field Triage: the
  results say Preparation and Battle, not Castle Battle, and the timeline writes the
  stages in uppercase (25 Nov).
- The two states in the results drop the word "State": just the number, a little bigger.
  The castle logo sits next to the state where the battle was fought, on the inside
  (25 Nov).
- The state numbers are bigger than the small label (tried much bigger; she asked for them
  and the castle logo smaller again), and the castle logo is the same height as them, with
  no black shadow. Everything from our side is blue, everything from their side red
  (25 Nov).
- The SvS result and the president show only on the whole State of Power, never on the
  Battle. Its line is "STATE OF POWER" with WIN, LOSS or DRAW (not "SvS result": we are
  already in the results). Under it the president: the game's icon for a President or a
  Supreme President (Roxanne is finding the two icons), then the alliance and the
  president's name written as in game ([DVL]name), blue for ours, red for theirs. No
  title text, no "(Invader)", no alliance logo (25 Nov).
- Points or an Occupation Ranking that are not recorded are simply not shown; no line
  saying they are not recorded (25 Nov).
- Part titles and their results (PREPARATION, BATTLE, WIN, LOSS) are the same height and
  aligned (25 Nov).
- SvS results are entered from Roxanne's screenshots of the game; editing from the page is
  for when someone wants to change them. No form: editing is in place, in the same layout
  as the results, tapping the numbers or selecting them to change them (25 Nov).
- Admins change SvS results ("when I say me I mean admin, I will say owner when I want
  something locked that tight"), so nobody else can ruin these entries; admins will be
  selected carefully (25 Nov).
- Editing the SvS results: the # stays outside the opponent's field (it is always added in
  front of the number); the Battle starts with one field and a + button (25 Nov).
- Rule for the entire site: no page or panel opens in editing mode showing a Save button,
  ever. Every editable page or panel has an edit icon that swaps from what everyone sees
  to editing in place, in the same layout, like the SvS results; Save goes back to what
  everyone sees. That is how we can tell what we are doing (25 Nov).
- The edit icon is not the pencil: it is the edit button from the profile ("Update skill
  level": the edit icon and a word), now shared by every page (edit-forms.ts, forms.css).
  In place means the design doesn't shift up or down or in any way: the numbers get
  edited in place. Each value gets a box that fits in the space it already has (not huge
  boxes), otherwise we don't know anything happened when we pressed it or forget to save;
  a slightly smaller font if the value doesn't fit (25 Nov).
- While editing, every number is the same colour: we only know the winner of a day after,
  same for the Battle. We add the numbers and they get sorted when we save (25 Nov).
- She can't check the full SvS on a phone: tapping its parts shouldn't open the phase but
  the entire event, in the panel on the right (25 Nov). Castle Battle opened with the SvS
  timeline under a Castle Battle header: "it's not correct, if it opens only castle battle
  then it will show only the results from castle battle during svs, otherwise it's svs".
  Built: every stage opens State of Power, its whole dates, timeline and results.
- Sunfire Castle gets the same results as the SvS (Occupation Ranking and president). It is
  entered only from the screenshots she sends; Claude updates the database (25 Nov).
- Sunfire results accepted as mocked ("this looks good", 25 Nov): Occupation Ranking with
  each alliance in its own colours, then the President icon and name. A timeline with
  nothing in it is removed: "we have the date and time at the top anyway" (25 Nov).
- The head's date, repeat and alliance-time forms "don't apply to svs or sunfire, they're
  locked" (25 Nov): no edit in the head of SvS, its parts or Sunfire (datesLocked in
  the catalog).
- The round pencil in an event's head is replaced "with the edit button I already sent
  in the colours of the event" (25 Nov). Every edit button in an event panel takes its
  event's colour.
- The Next up / Then cards say State of Power for its parts, "the stage can be under, so
  State of Power SvS / MATCHMAKING" (25 Nov). "Only where there's space we will write
  the full thing" (as on the calendar's bars: otherwise SvS), and "the size of the stage
  font will be considerably smaller" (25 Nov). Castle Battle opens the whole State of
  Power too, in its colour (her 25 Nov rule that a part opens the whole SvS).
- The cards go per event: "we're not gonna show all of them, it will be shown per event,
  so it will show next up svs matchmaking then it will turn into now svs matchmaking and
  then it will be now svs preparation" (25 Nov). Built: State of Power has one card from
  Next up to its end, "Now" while it runs with its current stage and when that stage
  ends; the other card is the next event. Other events keep Next up / Then.
- "In matchmaking we will record the opponent, so the line with vs, that will give us the
  state we need to see the data, as soon as that is set we will request the other's state
  data" (25 Nov). Prepared in supabase/svs-opponent-state.sql: the opponent's state is
  read within the minute, then daily until Field Triage ends.
- "During preparation, I will insert the full numbers for each day, even if they're
  displayed in short form, we'll keep the full numbers in the database, and the total is
  calculated from that, so for the first day the total will be the first day score, the
  win or loss will also be added based on the total after we put in the result of the
  last day of prep, so where we have the daily detail the phase totals and win/loss is not
  an input but a result, same for battle, we put in the times for all alliances and if
  the alliance with the biggest hold is from our state then it's a win, if not, it's a
  loss" (25 Nov). Built: worked out live while editing and again on saving; a full number
  typed in shows in a slightly smaller font in its box, and its short form once left.
- "Make the font small enough or normal weight to fit the billions we're gonna insert,
  the box can be slightly wider as long as it has a small padding from the widest stage,
  it doesn't change the way we display it, but it will be less confusing when we insert
  it" (25 Nov). Built: while editing, the days show the full numbers in boxes up to a
  small gap from the widest day name, in a normal-weight font that fits ten digits.
- "Instead of having a highlight on the current stage or substage, I was thinking we can
  draw a pin in the same style of the edit, the event colours, that goes in front of the
  current stage" (25 Nov). Accepted ("I love it"), with "the position has to be
  adjusted, aligned to the bottom with the text, it's ok if it's taller than the text".
  Built: the pin replaces the row's tint and the dot's halo.
- The SvS results: "the #1458 vs # should be moved lower and MATCHMAKING added above, to
  be consistent, there's plenty unused space there that makes that part a little
  awkward" (25 Nov).
- "When we edit from the phone, the time, make sure the : are there and we insert the
  number only" (25 Nov). Built: a time held takes digits only and keeps its colons, each
  digit coming in from the right as on a timer (SvS Battle and Sunfire Castle).
- The 7 Nov and 10 Oct SvS days came rounded from WoS Oracle: "add the missing amount to
  the days without changing the rounded numbers, so split that between the 5 days to make
  sure we have the correct total and the short numbers are unchanged, this will only
  happen for those results, we're gonna record them properly moving forward and won't
  take them from wosoracle.com" (25 Nov). Done in the database; their source says so.
- Preparation's totals are shown in full (11,028,870,560): "if the font is a little
  smaller and the text closer to the totals bar it would probably look better" (25 Nov).
  "Then the other numbers for the daily totals and the time from battle have to match
  that font size, it's ok if they're smaller, but not bigger" (25 Nov): the totals' size
  is --total-size; the days and the times never go above it.
- Font (25 Nov): "let's keep roboto everywhere, decision made - except for the event short
  form, that stays unchanged" (Montserrat). Roboto is installed in the workspace, so
  screenshots are what the site shows.
- The SvS panel (25 Nov): "15px from the title to the content, 25px in between sections,
  15 from the top and 15 on the bottom", measured on what is drawn. "In the timeline the
  blue and red from the bar should match the blue and red used in the results tab, with
  peak red in battle going to green for triage" (lineColor in the catalog). "MATCHMAKING,
  PREPARATION, BATTLE, FIELD TRIAGE in a smaller font, bigger than the others but not
  this big" (13px).
- "The section titles in the panels should be the same too, size, colour, padding,
  weight, this is the part where we make sure we make the panel a generic item" (25 Nov).
  Then: "I like the accents but i think we should keep the titles a generic almost white
  colour, it's better to read it like that, the accents are in the background of the
  panel, the lines and icons" (.panel-title in event-panel.css).
- "Keep the same style for SvS Records/Sunfire Records instead of check history" (25 Nov,
  with a picture of the open-in-new icon): the edit button's style with an open icon.
- "The panel background, for svs doesn't seem to use the event colours like sunfire or
  others, all of them should" (25 Nov): every panel and card is tinted with the event's
  two colours as its bar runs, the first from the top left, the second (colorEnd) from
  the bottom right (tintedPanelStyle).
- "Also the same size for things, king of icefield days seem quite big and the colour of
  the timeline bar is too intense, follow the svs example" (25 Nov): a timeline's row
  names are 12px like the SvS days (the stages stay 13px capitals), and every line is as
  soft as State of Power's (softLineColor in event-panel.ts).
- An event's phases are bigger sections: written like State of Power's stages, 13px
  capitals ("Yes, much better", 25 Nov, on Tundra Arms League). Built for every event with
  phases in event-phases.json (event-tree.ts marks phase rows as stages). Day themes such
  as King of Icefield's stay 12px, like the SvS days.
- "The space before matchmaking is a little too big, the space between phases,
  matchmaking and prep and then prep and battle has to be equal" and "the space between
  a phase title and the content has to be the same too" (25 Nov). Measured on what is
  drawn, not on the boxes. "I am a fan of round numbers, so the spacing between sections
  30 px, the space between the title and the content 20 px" (25 Nov).
- "State so far has alliances, presidency, leaderboards, the results from svs and sunfire
  will be in presidency, we'll design a way to see both" (25 Nov): ours and the
  opponent's state. Still to design.
- The Battle's times are in a smaller font; the winner's stays bigger than the rest, but
  only a little (25 Nov).
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

### Calendar grid (24 Nov)

- The day names are in capitals: the full name on a computer (MONDAY), three letters on a
  phone (MON). They stay put above the weeks; only the weeks scroll, in their own box,
  under them (no sticky row with a backing).
- On a phone the day names (10.5 px) and the dates (12 px) are smaller, with less room
  above the bars.
- Calendar controls on a phone (approved 24 Nov, mock-up shop2, built on profile-draft 24 Nov):
  the second row has the three views as calendar-page icons on the left (Week one row of
  days, Month two, Year a stack of pages; the open one bright with a line under it, no
  buttons) and Filters (funnel and word, no box, no count) on the right. Filters opens a
  sheet from the bottom, "Show on the calendar" with Done: each category (State,
  Alliance, Personal, Deals, and Packs to come) with a white-on-glass switch and "6 of 7",
  its events under it in two columns with their logos, on bright, off grey and dim. This
  replaces the category chips of 17 Nov. No filled blue buttons and no count badges, ever.
- Today shows only when today is out of sight (another month or week); the month name
  keeps its place. UTC is one word with a swap icon that flips to MINE.
- On a computer the two rows are one: the month on the left, then the pin and the arrows
  (a computer cannot swipe; see 26 Nov below); the views, UTC and Filters on the
  right. Filters opens as a panel under it, three events to a row, the page not dimmed.
  Shown 24 Nov (cal-desk); the arrows were added in the build.
- Today is always in sight when the calendar opens (the site, the section, Today, another
  month or view): the weeks scroll so today's week is the first one, or to the bottom near
  the month's end.

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
- The alliance as a small badge, the tag above the logo (24 Nov). On a phone it sits in
  the bottom right corner of the header, so the name has the whole width; the lines
  under the name keep clear of it. On a computer it is still in the top right (the
  computer layout follows once the phone is settled).
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
  overlapping its corner, the name in capitals (Infantry, Lancer, Marksmen) above it
  (see below), and under it the tier written T10, T6 (no space), Helios or Exalted, and for Exalted "· Lvl. 3".
  No red. Every tier from T1 to Exalted has its portrait.
- "Update skill level" is one line on the title's line, after TROOPS, in normal letters
  (it changes the levels in place, so no down arrow), only on the person's own account
  and only with Exalted troops (24 Nov). In front of the
  words, the owner's edit icon (a rounded square open at the top right with a pencil
  across it). Its stroke runs from a colour into white, and the words do the same, only
  very faintly. Two states: just the button, for changing them, in the alliance's
  purple; while the levels are out of date (never set, or not changed for over a month)
  and one is under Lvl. 3, a notification in red, with a small red dot after the words,
  at the top of the letters and a little above. The icon and the dot follow the glass
  look. There is no separate note. While out of date, Save is lit without changes, so a
  player can confirm levels that are still right.
- Each troop type's name sits above its picture, in the view and while editing, as the
  title of its column: 12px on a phone (a little larger than the tier line), 15px on a
  computer (24 Nov).
- It opens in the same space as the troops (24 Nov): the three pictures shrink under
  their names, still centred, in a short animation; the tier makes way, and each Exalted
  troop's None / Lvl. 1 / Lvl. 2 / Lvl. 3 show under its picture, one under the other,
  as words: the picked one bold, the others quiet (no boxes, no grid). A troop that is
  not Exalted shows its tier there. The troop names never change size. A quiet Cancel
  and Save take the place of "Update skill level" on the title line, drawn the same
  way: a line icon (a cross, a tick) with a soft glow, then the word, both running from
  a tint into white: red for Cancel, green for Save (Save dimmed until
  there are changes, or lit while the levels are out of date). Closing plays the animation back. Leaving with changes asks
  "Save your changes before you leave?" with Cancel and Save.
- Skill levels are kept in one place only: per in-game ID in exalted_skill_levels
  (24 Nov). Troops come from the game. Event availability answers keep only the hours
  and choices, and show each player's troops and skill levels as they are now.

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
  colour, "Update skill level" and "Labyrinth stages" mixed lighter, and the rank label.
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
  farms have no troops and are not accounts to switch to. Its alliance is their alliance.
- The menu under the name does not list the accounts (24 Nov): the photos under the
  profile's header swap between them. The menu holds Add account, Edit accounts (with a
  second account), Profile, Admin for admins, and Sign out.
- Edit accounts (approved 24 Nov): opens the photo row in place on the profile, drawn
  like the troops' skill levels: the title line ACCOUNTS with Cancel and Save, every
  account (the one shown too) with its picture, its name, and Main / Alt / Farm as words
  one under the other, the picked one bold. Always one main: picking Main on another
  account makes the old one an Alt, and the main's own Alt and Farm cannot be picked. The
  player stays on the account they were on; if it became a farm, they are put on the
  main. Saved together (supabase/account-kinds.sql).
- An event's answer (Tyrant availability and the like) is for accounts, not for the one
  the player is on (24 Nov): with alts, saving asks "Save for which accounts?", listing
  the main and the alts as the menu drew them, each ticked on its own, so one answer can
  go to one account or several; nothing is ticked at first and Save stays dimmed until
  one is. With no alts (only farms) it saves for the main without asking.

### Player data from the game (23 Nov)

- Players' game data comes from the Whiteout Stats API (api.whiteoutstats.com), looked up
  by in-game ID: name, state, alliance and rank in it, power, furnace level, kills,
  avatar, and each troop type's tier and FC level. Tested on 23 Nov with the owner's
  account; it matched the game.
- A player adds the ID of every account they have and marks each as main, alt or farm.
  When an ID is typed, its name and picture appear, so the player sees it is the right
  account.
- The ID is not judged by its digits (24 Nov): IDs grow as accounts are made, so a new
  farm or alt can start with any digit. The field takes digits only, and the check is the
  game itself: an ID the game has a player for can be saved, a made-up number gets "The
  game has no player with this ID." It is looked up once typing pauses with 8 digits or
  more, since an 8-digit start can be part of a longer ID.
- Every known account is refreshed twice a day, as a slow background pass (the API allows
  60 requests a minute and 5,000 a day on the free key).
- Players can refresh their own accounts, and R4s and admins their alliance. The API reads
  an account from the game at most once an hour, so the refresh waits an hour after the
  game was last read, and the page shows when the game was last read ("Updated"), never
  when the site asked.
- The rosters of the main alliances still in the state (DVL, TOP, SKY, RUU) are read every
  hour, each call waiting for the API to read the game, so a roster is never more than an
  hour old. A whole roster is one request.
- The academies' rosters (dvl, top, abc) are read twice a day, with the player pass.
- The site does not ask for an account it already has a fresh copy of: asking again then
  gives nothing new, so it gives the copy it has. When the data is not updated, it makes
  sense to try again to get a read (24 Nov, the reason for the rule): an answer that is
  not fresh (the API still reading the game) is asked again the next minute, for 10
  minutes, then once an hour until a fresh copy arrives. Rosters the same
  (supabase/fresh-reads.sql).
- The key is kept in the database's Vault and the refreshes run in the database
  (supabase/game-refresh.sql), set up on 23 Nov.
- Anyone signed in can add any in-game ID as their account, so an ID can be claimed by
  someone it does not belong to. Members can report a wrongly claimed account, and admins
  deal with the reports.
- Storage while the pages are being designed: the latest full answer for every player,
  alliance and state, plus one copy a day of the basic data for the last 30 days (about
  150 MB; heroes and chief gear only as the latest copy). Once the design shows what is
  used, only that is kept, with a longer history.
- Each account has an alliance and a temporary alliance (24 Nov). Players move between
  alliances often, for events or rewards, so a move is not taken as a change at once.
  The temporary alliance follows the hourly rosters: where the account shows up now.
  When a read shows the account somewhere new, a counter starts; the alliance is
  replaced by the temporary one only once the account has been seen there for 24 hours
  in a row. A move back before then stops the counter. The player, or an admin, can
  also confirm the move on the site, which replaces the alliance straight away.
- While a move is under way, the account shows both alliances, the one it is counted in
  and the one the game shows now, as "X > Y", with Dismiss and Confirm (24 Nov). Confirm
  makes the move at once. It shows only once the account has been in the new alliance
  for 2 hours, so short hops never show (24 Nov). Dismiss keeps the account in its own
  alliance and hides the move for 3 days; if it has not gone back by then, the move is
  made (24 Nov). A move back clears it; a move to a third alliance starts a new count.
  The account's owner, the R4s of its alliance and admins can Confirm or Dismiss. There
  is no separate way to set an alliance by hand: Confirm and Dismiss cover both ways.
- On a phone (approved 24 Nov): the pair takes the badge's corner, the old alliance
  dimmed, an arrow, the new one, as tall as a single badge; Dismiss (red cross) and
  Confirm (green tick), drawn like the troops' Cancel and Save, sit on one line right
  under it, below the header, so the name keeps the whole width. On a computer the
  badge stays at the top right and fills the side down to Updated and Refresh, its tag
  larger too; during a move the pair fills that room with Dismiss and Confirm under it
  (24 Nov).
  While a move is hidden (under 2 hours, or dismissed), the badge and the page's colour
  are the alliance the account counts in.
- An account on the site is only a link from a login to a member the game data already
  has (24 Nov): it holds whose account it is and whether it is a main, alt or farm.
  Name, power, alliance, rank and everything else the game gives are kept in one place,
  the game data, and every page shows them from there; lists such as My alliance's
  Members come from the alliances' rosters. Nothing is copied onto the account.
- What an account keeps is what is typed on the site (24 Nov): main, alt or farm, the
  foundry power, the order of the list; on the login, the time zone and the language;
  and the picks, personal entries, availability answers and skill levels, each in its
  own table. Built in supabase/accounts-from-game.sql: each player's alliance is kept in
  game_player_alliances (per in-game ID), with a counter only while a change is under
  way; a read that shows nothing new writes nothing.
- The state boards (24 Nov): our state's are read every hour. Every other state a site
  account is in is read once a day, with no daily copies kept; a player's own refresh of
  an account there reads that state's boards straight away and counts as that day's
  read. So a player in another state before a transfer sees all their ranks. The page
  asks only for its accounts' places on the boards (supabase/state-ranks.sql).
- The profile uses both reads (24 Nov): troops, heroes and leaderboards from the
  player's own read (twice a day); name, picture, power, alliance and rank from
  whichever is newer, the player's own read or their alliance's roster (every hour for
  the main alliances). "Updated" shows the newer of the two; Refresh still goes by the
  player's own read.

## Open


- Player page: whether the menu under the name still lists the account the person is on.
- Player page: names for the 13 hero cards not matched yet (9 epic, 4 rare), and hero
  gear (the data has every arena hero's four pieces and their levels).
- Player page: hero numbers before Gen 8 (other than Wu Ming 50019 and Edith 50032) are
  not matched to their cards yet; Gen 8 to 12 are (50034 to 50049, 24 Nov), and 50037 is
  not a generation hero.
- State page leaderboards: which of the 26 lead. The owner named The Labyrinth (total),
  Total Pet Power, Total Expert Power and Exploration Stage as needed; the rest is to be
  worked out later.
- Roles. Decided: owner; admins, who can edit anything; alliance manager, one role per
  alliance, held the same by its R4s and R5s; state managers, for the state's planning
  except battles; battle managers, for the battles. Open: exactly which pages and
  actions each one gets, decided as each page is built.
- Alliance colours: approved and written 24 Nov for the four main alliances. Each has a
  full colour (its tags, dots) and, as its accent, that colour's light version at the
  sections' strength (players' pages): DVL purple #9A6CCF / #C2A4E8, TOP blue #5582E0 /
  #93B4F5, SKY red #D15B60 / #ED9A9A, RUU orange #CA6719 / #E7A278. Each academy takes
  its main alliance's lighter colour (dvl #C2A4E8, top #93B4F5, abc #ED9A9A); FUN left the
  state and is grey #8A8F99 (written 24 Nov).
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
- Pop-ups: their design (24 Nov). Until then they stay as they are: "Save for which
  accounts?" as approved (ticked rows outlined, Cancel and Save under them) and the leave
  question.
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
- A new version going live (25 Nov): "how about a reload suggestion when a new version is
  up?", together with the silent reload while the page is in the background; accepted as
  mocked ("yes"): one quiet line at the bottom, "A new version is ready" and Reload in the
  edit button's style. Nothing reloads by itself while someone is editing
  (src/ui/new-version.ts, version.json written by the build).
- The top bar (25 Nov): "it has a problem on pc, it cuts without a reason" (it stopped
  where the page's 1950px ends on a wider screen) "and then I also want it fixed at the
  top, so when we scroll it stays in place". Built: the band runs across the whole window
  on a computer; on a phone it stays at the top while the page scrolls under it.
- "We also said that the MONDAY/TUESDAY and so on will be fixed and only the calendar
  scrolls" (25 Nov): on a phone the day names stay under the top bar while the weeks
  scroll, taking the bar's tone once held; a computer already scrolls only the weeks.
- Day names and dates while the calendar scrolls (25 Nov): "the days and date stay on, once
  we've passed a line of dates - they're not visible anymore or they're next to the days
  bar, then we display them at the top, so only the actual numbers change when we scrolled
  to the next week, on both phone and pc"
- Phone calendar (25 Nov): "the filters and all that should always be visible and the head
  of the table stays the same, only the rest of the calendar scrolls, and when we move from
  week to month i need the month to open at the top and see a short animation of it
  scrolling to the current week"
- Player leaderboards (25 Nov): "research chief gear and charms are a group, in this order,
  then Hero power, pet power, expert power, then Exploration, island, labyrinth".
  "Labyrinth stages will be like a subsection under the leaderboards, I don't like how
  it's hanging now."
- The menu under the name (25 Nov): "Admin, Profile, Edit, Add, sign out - and we need a
  way to remove a character too, and rename accounts to characters". Then: "We're removing
  the edit from there and adding it next to accounts like we did in other pages".
- Characters on the profile (25 Nov): "I think edit and add can go next to characters and
  if someone doesn't have any then we only see the add, that should clean the menu". On
  editing: "I don't like how the edit thing looks, it's hard to use, so what if we see all
  characters and select which one we're editing?" (her screenshots to follow).
- Removing a character (25 Nov): "removing needs a confirmation pop-up".
- Editing characters (25 Nov): "it's not clear that main alt and farm are options, remove
  needs a trashcan like cancel and save"; "remove and the options slightly smaller than the
  character name, same size as the cancel and save font". Pop-up: "Are you sure you want to
  remove x?", nothing under the names but the names.
- Labyrinth stages (25 Nov): "in caps, a slightly smaller font than Leaderboard and an arrow
  to expand, expanded by default on pc".
- Foundry power on the profile (25 Nov): "I also want the foundry logo to show up with an
  edit logo asking to add it if we don't have it and update same as the skill if it's not
  up to date, but in place, once we add it the first time just the icon will be displayed".
- Profile (25 Nov): "I don't think I want the "CHARACTERS" title, instead the Edit and add
  icons go under them on the phone, on the right after the last character on the pc";
  "on pc: TROOPS, ARENA TEAM, LEADERBOARDS all in bigger font or bigger weight or both,
  LABYRINTH STAGES slightly smaller"; "state 1252 becomes #1252"; "the photo should be
  bigger than the total text height, I like the proportions in the ss" (her own profile:
  the picture about a third taller than the text beside it).
- Profile (25 Nov): "save and cancel go under ofc, edit and add have too much space between
  the characters and them, the DVL and alliance logo are too low, align it to the bottom
  with the foundry data". "the way the leaderboard data is centered works very well on
  mobile, not so well on pc, make sure the 3 categories are spaced equally and each
  leaderboard in it".
- Spacing (25 Nov): "I don't like how you add a bunch of space everywhere, same distance
  above and below a row, when some things are connected then it doesn't make sense to
  have them so distanced from each other".
- Editing characters (25 Nov): "on pc it's not obvious which character we're editing, maybe
  we make that pic bigger a little? and the main stays out of it unless we make another one
  a main and save it". "labyrinth stages can have bigger left and right padding to show
  it's a subsection".
- Phone calendar controls (25 Nov): the one line accepted as shown ("I like how the one
  line looks"): the date, the views, Filters and UTC; Filters and Today as icons; a week
  without its year. "but i don't like how the background changes, we should still see the
  top like we do here" (her screenshot: the line on the page, the calendar's rounded top
  with the day names on its glass).
- Calendar icons (25 Nov): UTC's swap and Filters' funnel from her two pictures ("Use these
  as inspiration and the style of icons we used in other pages, and the page colours
  too"); "for consistency today should have the pin icon we use in the panel".
- Phone calendar (25 Nov): icons accepted ("I like this"). "next and then at the top and
  when we scroll they will dissappear and the calendar stays full page, so when we scroll
  first they get smaller and fade away and the calendar with the filters go stick to the
  top, then we scroll through the calendar".
- Calendar on a computer (25 Nov): "the filters should be up to the right edge of the
  calendar, the rest will stay free for notifications like, update skill level/foundry
  power".
- Phone calendar opening (25 Nov, replaces "today's week in sight" on a phone): "Top. If
  we press on today they get smaller, calendar goes to the top and then it's scrolled, a
  tiny animation, not too long, but we need the user to understand what's happening".
- Held dates (25 Nov): "On pc, I need the items to fade a little as they approach the top,
  and try to do the same on the phone"; "the fade happens over a big area, it can bee more
  narrow"; no weekend tint in the held dates ("that doesn't have to happen in this bar
  because it looks funny"); the band never darker than the calendar ("i don't understand
  why the top has to get so dark to make something fade"). "changing from utc to mine
  shouldn't change the positions of the swap icon or the view icons".
- Year view (25 Nov): "I think we can keep only week and month, this is hard to read and
  we already have everything in the monthly view, don't delete it yet, just disable it
  for now, in case we have to bring it back" (YEAR_VIEW_SHOWN in shell.ts). "with the
  extra space see if we can separate the 2 icons better from utc and filters, we don't
  want them to look like 4 settings when there's only 3".
- Timeline pin (25 Nov, correcting the build): "only current stages are marked in the
  timeline, when we select one they don't get a pin, they get a highlight, the pin stays
  on the current day".
- Bar colours (25 Nov): "you know how I said that the colour will be light to dark, left to right? i think we want dark to light left to right for all of them". Events with two logo colours run from the darker of the two to the lighter.
- Reload on the phone (25 Nov): "on reload it still opens an event page on mobile". A reload on the phone opens the calendar; a shared link still opens its event.
- SvS bars (25 Nov): "state of power bar, wouldn't it look better with the colours we use in resouts?", "svs is an exception since it has 2 colours, can we also do the oblic split they do in game?", "now just make the blue and red slightly darker near the left right edges". SvS bars are our blue against their red from the Results, split on a slant in the middle, each side darkest at its own end.
- Special events (25 Nov): "they would be on a special events category, all of them confirmed once they happen and estimated for next events", "add the events with their past dates and the new category". Packs (25 Nov): "I also need a new category for packs, since people might want to plan their budget".
- Foundry power on the profile (25 Nov): "it's every 2 weeks". It asks for an update two weeks after it was set.
- Officer Project and Armament Competition (25 Nov): "we'll just have to keep tracking them and see, i need you to remind me to tell you about them".
- TAL Hall of Heroism (25 Nov): "we should add it but discreetly, like the other bars i guess? - we decide later, maybe we let people uncheck it separately". Not built yet.
- Yellow events mockup (25 Nov, rejected): "they look the same to me, shitty yellow almost brown, depressing and ugly, worse than what we had".
- Deals and Packs (25 Nov): "This is part of deals, idk why or how these work, we'll keep them separate and decide if we want to merge them, deals might be tied to missions in game, packs we just buy them". Packs are what is bought in the Top-up Center.
- Foundry power reminder (25 Nov, replaces "every 2 weeks"): "I want it when registration opens because that's when they can check". The number turns red with a dot when a Foundry Battle registration opens after it was set.

## Redesign for the common screen (branch common-size, 26 Nov)

- The site is designed for a common monitor (1920 × 1080), then made to look the same on
  every screen; nothing stays squeezed or cut because a narrow width once forced it
  (Roxanne, 26 Nov: "take back all the poor decisions we made because we didn't have
  enough width").
- Calendar bars (26 Nov): "we need to define 2 calendar rows or bars, one of 1 line, one
  of 2 lines, and be efficient about how we display them." Fonts and heights the same
  everywhere.
- Phases on one-line bars (26 Nov): "they have to be written in caps", "leave a certain
  amount of space that makes it clear that it's different, and then add the face there",
  "the name of the events will be in normal font", "I do not want that change for events
  where we have 2 rows ... the sub faces stay written like they are right now", and in the
  day's card "where we have registration, battles, those are again faces, need to be
  written in uppercase". The card's icons were "too big for those fonts".
- Rows (26 Nov): an event's battle day goes on the same row as its Voting and
  Registration ("tied together in the same row, even though we have like 2 days of gap");
  a run that is ending and the next one starting do not have to share a row (Hall of
  Heroes). The top band "takes up a lot of the screen, and it shouldn't"; the sections in
  the site's font; no scrollbar on the calendar ("I never asked for a scroll bar"); equal
  edges on both sides; day names never cut; dates a little smaller.
- Text in boxes (26 Nov): "make sure you have at least 2-3 pixels of padding around the
  text in the box ... At least 5 pixels to the right, so you can either center it if it's
  centered or align it to the left and still have room for it to grow."
- Phases on one-line bars, after trying them 12px after the name (26 Nov): "I don't like
  this ... I want it centered ... Yeah, center it." Preview and Matchmaking too.
- Short forms on bars with phases (26 Nov): "we have the AC there because in the case it
  does not fit, then we will use the AC instead of Alliance Championship ... we should have
  in uppercase AC and then the face ... Mobilization, Showdown, Championship are also
  accepted." Built: the full name, then the short name, then the short form, whichever
  shows the phases.
- Top bar (26 Nov): "the logo can be bigger. It does not need that much space in between
  the top and the bottom ... Half of it maybe. And the calendar fortress, the navigation,
  they cannot possibly be that small ... at least as big as ... the state hub."
- Clock and account (26 Nov), from three versions: "The name is enough ... I have the
  picture and the name ... I like the UTC exactly how it was before, so just adjust it for
  the size. And I like how the line looks. Oh, and the arrow down, but ... make it look
  like the site and like icons." Built: UTC over the time (12px / 20px), the thin line,
  the round picture with the page's ring, the name, the arrow in the icons' style; no box.
- Calendar head (26 Nov): "a lot of spacing for Monday, Tuesday ... and then the numbers
  ... that bar at the top for the dates becomes quite tall." Built: 8px from the day names
  to the first dates, dates 6px under a week's line and 4px over its bars.
- The calendar's fade at the bottom (26 Nov): "it should be like half a row, maximum 1
  row. We're wasting a lot of information at the bottom." Built: 16px, half a bar row.
- Calendar month controls like Invites (Roxanne, 26 Nov): "The arrows, I think we already
  established that we are gonna do them in the same style as the icons, and that they will be
  after the month, and the pin icon is missing for when we go to other months ... it has to be
  the same format here too, and on the phone, it has to be consistent". Built: the date, then
  the pin back to today (only while today is out of sight, the icon alone), then the two arrows
  in the icons' style; on a phone the pin after the date and no arrows. The date keeps the room
  of its longest title so the pin and arrows don't move.
- Screen 1 review, computer (Roxanne, 26 Nov):
  - Today's line under the day name: "almost stuck to 26th. It can go up a pixel or two."
  - "Bear Hunt is not BH ... Bear Hunt is BT, because it's Bear Trap 1, Bear Trap 2."
  - SvS Castle Battle: "I don't think we should write Castle Battle under Battle ... just put
    the icon of the castle and the lines where they need to be."
  - The day's card: "if we have timeline and all day, why can't we have the date included in
    that and the panel go higher a little?"; "if we don't have an event set, then it only
    makes sense that the panel borrows the accent of the calendar ... blue, but also some of
    that warm ... peach". Built: the date and "Game time (UTC)" as the card's head, the
    card in the calendar logo's blue and peach.
  - "I do not want a round picture. And make sure it's not stuck on the bottom row."
  - "the clock can be bigger. The numbers ... heavier and bigger, and the UTC is good as it
    is", the clock about the photo's size.
  - Next up and Then: "We either put the face or we don't ... The date has to be in the same
    font, same spot too, and the size of the icon has to be the same ... I would put all 4
    rows aligned to the left and make the icon bigger." Built on the computer; the phone
    tiles are as approved.
- Calendar controls on a computer (Roxanne, 26 Nov): "The entire bar from above the calendar
  can have bigger everything ... the month, I like that it's not as big as before, but this
  is ridiculous. This is way too small. It should still have space at the top, but like be
  positioned better in general, like lower and bigger font ... all the icons to be bigger.
  They're so tiny that you don't even know what you're clicking ... make sure all of those
  are aligned with the arrows, and filters in UTC should be at least as big as the selected
  view". Built: the month 28px ("I need like 28, I think"), every icon 24px (arrows and pin 22px), Filters and UTC 15px,
  all centred on one line, lower in the same row: "The space between the calendar and the top
  needs to be exactly the same" (the calendar starts where it did).
- Calendar views on a computer (Roxanne, 26 Nov): "two icons for weekly and monthly are too
  close together ... put a little space in between now and in between them and the rest":
  12px between them, 20px on each side of the line after them.
- The day's card head on a computer (Roxanne, 26 Nov): "what is that game time UTC note? I
  don't think I asked for it, and maybe we wanna write timeline in caps, and then the day,
  like the date after that on the same line. There's no point in having like 1, 2, 3, 4 of
  them". Built: "TIMELINE" in capitals in the section's colour and the date after it on one
  line, then All day; the "Game time (UTC)" line is gone there (the UTC button says it).
- The phone too (Roxanne, 26 Nov): "apply these changes to the phone too, because we're also
  defining like the panel ... By these I mean the logic changes in like where we moved
  things, not sizes." Built on the phone: the day's card with TIMELINE and the date on one
  line, no "Game time (UTC)" line, the calendar's two colours; Next up and Then with their
  phase on both and the four lines beside the logo, the logos level from the top. Phone
  sizes unchanged (logo, month, icons, spacing).
- Phone tiles (Roxanne, 26 Nov): "it's gonna be next up, it's gonna be SVS and matchmaking,
  but I don't understand why you didn't use AC for Alliance Championship ... I don't
  remember us setting like the title on 2 lines. So it's gonna be AC and registration, and
  like all 4 lines will be aligned and the entire panel should be narrower. It's way too
  tall now for no reason." Built: on a phone the name is one line, the event's short form
  where it has one (SvS, AC); both tiles' four lines level.
- Tile logos (Roxanne, 26 Nov): "We care that they are the same in their own card ... maybe
  5 pixel padding to the left and right, and then centered vertically would be better for
  any icon we'll have from now on. That gives the text also more space, and I like it
  centered on the left and with the date on the same alignment." Built: 5px from the card's
  edge to the logo and from the logo to the text, the logo centred on the four lines.
- Phone bars (Roxanne, 26 Nov): "make the Sunfire Castle logo bigger, center it in the
  battle space, and align it with the text"; "Aren't like all the stages too high? ...
  Preparation, Battle, Field Triage is higher than State of Power. That shouldn't be
  possible. That should be centered. And then City, Basic Skills ... should be centered
  with those lines ... the entire line can still display all of this, but be less tall";
  "You forgot to make matchmaking uppercase ... State of Power and Matchmaking are a pair
  ... they don't have to be so far apart, and second, they have to be centered in the
  space they have. TAL and Preview, the same." Built: every two-line bar on a phone 32px
  (was 34), the name and the parts on one baseline, line 2 close under it with each white
  line centred on its letters, a phase under the name in capitals; the castle 14px in the
  middle of Battle, level with line 2, without its own lines (no room on a phone; the
  computer keeps them).
- Next up / Then, an idea kept for later (Roxanne, 26 Nov): "What if next up and then are
  actually above, are written above the logo and in a whiter font, and then the 3 rows and
  the logo are centered under that." Tried and taken back the same evening: "I like the
  idea, but everything is too low and too much to the left ... I want to put the cards
  layout back and just keep this as an idea for the future when I have time to go over it
  ... it looked better before." The tiles stay label, name, phase and date beside the logo.
- Phone bars, second pass (Roxanne, 26 Nov): "I think we need like 1 or 2 more pixels in
  between them, but also they have too much padding on the top and the bottom right now.
  Make sure all the subfaces and everything have the same size. Like battle and field
  triage in preparation in SVS are for sure smaller than the others." Built: two-line bars
  30px, 2px more between the lines and less above and below; every smaller word 9px (the
  parts were 7.5px, the second names 7.9px).
- Calendar rows (Roxanne, 26 Nov): "I want Foundry and Canyon closer together ...
  mobilization is gonna run for most of the week. It's actually the longest run, which is
  why I would put it first. Then I would put Fortress Battle and TAL because they take up
  a lot of space. Then Alliance Championship and State of Power because then again they take
  up a lot of space ... I like that all the bears are on the same line interconnected with
  the Crazy Joe, because it gives you a bigger picture". Tried: events are packed into rows
  as before, then the fullest rows go first (not yet confirmed).
- SvS's BATTLE on a phone (Roxanne, 27 Nov): asked whether BATTLE may stay smaller or be cut
  like other names that don't fit: "Yes, it was for battle being an exception". BATTLE stays
  7.5px; every other smaller word on a phone bar is 9px.
- Invites groups (Roxanne, 27 Nov): "I don't see it sorted to have groups together after I
  save" and "Creating it should count as saving it. No?" Built: Create in New group saves the
  group at once (editing stays on); saving puts a group's people together on their list, from
  where its first one is. The New group list keeps its scroll while people are ticked ("when
  I tap a new person it jumps at the top").
- Pop-ups and sheets (Roxanne, 27 Nov): "the scroll still works for the page behind it, and
  it shouldn't. Once that is open, that's on top. That's what's active." While any pop-up
  or sheet is open, the page behind does not scroll (tokens.css).
- Rows never touch (Roxanne, 27 Nov): "It is not acceptable to have items stuck to each other.
  Never ... items never stick together on PC either." (New group's ticked rows.)
- Broken player pictures (Roxanne, 27 Nov): "I still wanted to show something, but like it has
  to be clear that it's not the picture"; with the Whiteout Survival logo she sent: "Put a
  transparent picture is not loading over that." Accepted ("That's it."): the logo filling the
  picture's shape, a half-transparent dark veil and a white torn-picture sign in the middle.
  A player with no picture yet keeps their first letter. Built in broken-picture.ts, used by
  every player picture (pictureOf, the top bar).
- Results, every event (Roxanne, 27 Nov): "if at the start, when we have no results recorded, we
  should have a button instead of edit. We should have a button that says add results, and then
  they get the template in which they can fill in stuff, and this should be the common practice.
  Because before they add results, there should not be a results tab." Alliances without
  screenshots sent "have to be able to edit in place".
  Every event means every event with results, state events too (Roxanne, 27 Nov night: "the
  results are added, so then there is no results bar if they're not added and the top bar gets
  an add icon, it's not applied for svs so clearly you didn't cover all event panels").
- Alliance Championship (Roxanne, 27 Nov): she sends screenshots of the rounds and the final
  ranking; the site records every round, the flags and the final ranking from them ("I'm gonna
  just give you the screenshots. That's how I will do it"). Her rule as she said it: "every game,
  you have 3 lanes. If 2 of your lanes win, then you get 2 points ... the ranking is based on
  those points, but if the points are equal, then the flags are gonna be what matters." The
  game's mails (27 Nov) say a win earns 3 Championship Points and a loss none, and flags are
  the lanes won (data/captures/other-states.md).
- Alliance Championship results that alliances fill in (Roxanne, 27 Nov): the site does not
  work out points or flags, because the other games of a round are not known. "If they want to
  add them, great. If not, we show it without the ranking. So if they don't fill up the ranking,
  only show the results for the round if that's what they fill up. It's not mandatory for them
  to fill both."
- Pop-ups on the phone (Roxanne, 27 Nov): Add player and New group open from the bottom, like
  the profile: "I like them from the bottom on the phone. It makes more sense and it's more
  consistent." The Custom / State / Contact choice is only as wide as its words, centred ("it
  should only be as big as the elements inside it and centered"); it may be redesigned later.
- Who adds results (Roxanne, 27 Nov): "Our R4s need to know that add result is an option...
  Members should be able to add them. But they need to be confirmed by an R4."
- Adding results, every alliance event that has or can have results (Roxanne, 27 Nov):
  - The button is generic, "somewhere on top, and again it has to be graphical. It cannot be
    just another text on the ... bars, the navigation in the panel." Never as the last element
    of the timeline: "I hate it."
  - Only what already happened is asked for: "if they're filling in results during round 3,
    but round 3 wasn't fought yet, then you are gonna only ask for the first 2 rounds".
  - Editing in place, matching what is shown: "we show 3 bars. That's how they will input the
    data ... if they tap or click on the lanes, they get selected as victory lanes, and the ones
    that are not selected are losing lanes. If they don't select any of them and they save, then
    all 3 are losing lanes." At most a tiny "select victory lanes" message, "without changing
    how the thing shows ... You're not gonna move elements to add one more line."
  - "the points, you calculate them, so they do not insert numbers."
  - "when they have all 5 rounds filled in, that's when we ... give them another option of add
    ranking", filled in place. While filling, the rank column holds arrows to move a row up and
    down; "If they don't order it properly, then we sort it at the end, so they don't have to."
- Review of results (Roxanne, 27 Nov): "For R4, the button is save. For any other member of the
  alliance who can still add results, the button will become submit. And when results are
  submitted, our R4s will get notifications." An R4 gets "an extra thing in their menu ... for
  review or something, or an inbox": "a message with a red dot telling them that there's work
  for them to review, and a link to that particular event"; on that page "they have the option
  to accept the work someone else did or reject it. And the one who submitted the work gets a
  message telling them that it was accepted or rejected, or it's pending." Members also get "an
  option ... to keep track of this" in the sign-in menu. "This is alliance based, so each person
  can edit the events from their alliance, and the R4s of that alliance get the notifications."
  One R4's answer settles it ("We don't need for our R4s to approve the same thing"); the item
  shows its status, resolved, approved or rejected, and by whom.
- Instructions while editing (Roxanne, 27 Nov): "select victory lanes" rather than "tap the lanes
  you won"; "It doesn't have to be bold, it doesn't have to be that thick, and it can be like
  blue and have a star. Mark it as an instruction." Lanes start red and turn blue when tapped.
- Review items are tickets, not messages (Roxanne, 27 Nov): "they get a red dot when there are
  open tickets. When they are solved, they don't get red dots. But all of them can see the
  history of open tickets and see how it was resolved." The one who submitted gets a
  notification that it was approved (or rejected).
- Add results button (Roxanne, 27 Nov, accepted): a trophy with a plus and "Results" under it, at
  the top right of the event's head ("Yes, I like it. And we're gonna keep it at that for now").
  R4s can edit submitted results before accepting them, "so they can accept the input and just
  fix the mistakes if there are any, without having to write everything from the start."
- Alliance's registration plan (Roxanne, 27 Nov): the game's Registration note goes ("I don't
  like it"); R4s set a message there, "something like register to middle lane with this ratio",
  "shown underneath like all the time, not expandable". The button "Add note" is accepted. A
  note is added once and kept for all future events of that kind ("When we add the note, we add
  it for all future events. And in future events, that changes to edit note. So we only get the
  add once, and then it moves to edit"). Members see only the note, no button; with no note they
  see just Registration. It must look different from an instruction: "These are actual
  instructions, a plan to follow ... it has to be like a banner or something that screams at
  them, look at this."
- Alliance Championship dates (Roxanne, 27 Nov): no Edit in its head. "These are fixed. These
  are not gonna change. It's a fixed event. Those are the times, period. Remove it."
  (datesLocked in event-types.json.)
- The date and repeat forms (Roxanne, 27 Nov): "even if I need it, that is the worst possible way
  to let me edit anything ... It's only confusing me." When the admin menu is designed, changing
  an event's dates is designed anew there, not moved over as these forms.
- Credit for results (Roxanne, 27 Nov): "when we approve something, we will have a message below
  the results saying submitted by and then the user. We want to give credit to them." The
  ranking's up and down arrows look like the site's buttons, so it is clear the rows can be moved.
- Submissions, first version (Roxanne, 27 Nov): "It's enough to have them just as links": a
  Submissions item in the menu with a red dot when something is submitted, opening a page
  reached only from there, "basically just a list for now", each one taking the R4 "to the
  exact page that the result is submitted for", to review it and "approve it or reject it".
  "I don't really care how it looks. I need it to work." The design is revisited later.
- Scrollbars (Roxanne, 27 Nov): "Don't want any scroll bars anywhere. It should just be
  scrollable. We tell them that it's scrollable by having it faded a little at the bottom.
  That's the standard practice for the entire site."
- Lists keep their place (Roxanne, 27 Nov): "Whenever a list is scrollable and I check or uncheck
  a thing ... it jumps to the top ... I don't want my list to jump when I'm selecting things."
  Every box that scrolls on its own is put back where it was after each drawing (main.ts
  KEPT_BOXES), PC and phone.
- Contributors (Roxanne, 27 Nov): results are added round by round, so several members may
  submit for one results screen; each one whose results are approved is added once, in order,
  and all are shown under the results. "I want them to be displayed like with their picture and
  their name from in-game ... I want every spot where a user is shown to be that user, not just
  text." (person-chip.ts, used under results and on Submissions.)
- Submissions GIFs (Roxanne, 27 Nov): "To make the app fun, remind me to add GIFs on the
  submission page. We need something for approved, rejected, and submissions for when they are
  empty." Open: she adds the GIFs; remind her when the Submissions page is next worked on.
- Folds in tabs (Roxanne, 27 Nov): "we do not need the arrow now, since we split it into tabs ...
  remove it for Alliance Championship and ask me if we're gonna keep it for other events as we
  move on." Done for Alliance Championship (event-panel.css); ask for each other event in the
  review.
- Alliance Championship rules and rewards (Roxanne, 27 Nov): they are from the game ("If you
  have full rewards, then they are from the game. Because there's no way I give you all those
  details without giving you everything").

## Fishing's line (27 Nov)

"I really like how they drew the line with the fish, and we are gonna draw a line with the
fish similar to them on the fishing box, and it's gonna end one day prior to the 27th."
"Only what they have on the left": a white line ending with a fish. Fishing runs 24–27 Nov
in the game; the 27th only keeps the tabs open.
"We write on the calendar fishing, then the season in caps summer, and have that bar go at
the bottom instead, like the one with the fish." Seasons follow winter, spring, summer,
autumn, one a month (Century Games' help centre); 24 Nov 2026 is Summer.
Fishing's bar (27 Nov, 08:38), accepted: one line, "Fishing SUMMER", the fish and a white mark
where fishing ends (end of the 26th); under the bar a white line over the fishing days and a
Sunken Treasure Hunt line to the event's end. "Ok, keep it like that and I'll get these 2
logos from the top bars" (the game's tab logos; the Hunt's colour and logo are stand-ins
until then).
Changed 08:40: "the blue phishing square thingy is the phishing event, and it's gonna have a
vertical line with the fish before it, telling us that the actual phishing ended, and then only
have the golden line with the sunken treasure logo at the end." No white line under the bar.
No Timeline for Fishing (27 Nov): "I don't think we need a timeline for fishing. Like, we
already have the start at the top, so, and like the time, so it's fine." The right panel
shows SUMMER under Fishing Tournament, like a phase.
Fishing's panel (27 Nov): tabs Rules, How to fish, Chances; no Edit ("there is nothing to
edit about this fishing tournament"); no Mine ("we're not gonna record shit here"); Mini-game
and the season in the head ("add it to the tournament, not to the rules"). The chances are
Summer's: "So these are the chances for summer. Ask me for the next one next time."
Chances (27 Nov, 08:56): "don't mark them as these are chances in summer, because it's
confusing. We are gonna see what changes next time... save them but don't display them for now.
Don't show the tab for now." They stay in point-sources (list "chances"), with no tab.
Reward tracks (27 Nov): the Ice Fishing Club is drawn like the game, a band per track under
its medal (free, first pack, second pack), no lines between levels. "This layout will be used
for more than just this, because many events unlock things like this, so it's just new, not
unique." Built as one element for every event with tracks. "I don't like how it looks centered
like that."

## Reward lists (27 Nov)

- Rank columns, every event: "rank columns will have the number aligned to the right, and then
  the rewards aligned to the left."
- Notes in a Rewards tab are only notes: lighter and smaller; the mail note in two rows.
- Prestige-type rewards (named rewards): "I want the rewards from Prestige to be 2x2, even if
  that means they're much bigger... This is how we're gonna display like this type of rewards."
  The note under Prestige Rewards on one line.
- Alliance Championship: Prestige, Tier and KO Rewards one after another, not behind buttons:
  "It's one type, tier it's another type, KO it's another type. I don't like how they're split
  like this and have a bunch of text that repeats and empty pages." Group Ranking: "+2 ★".
- The tier: "we need to have the tier set and saved somewhere... all the events that have it,
  we need to be able to set the tier." She did not like "TIER Ultimate" as a line; shown for
  now as a chip in the head ("Ultimate tier").

## Event head (27 Nov)

"If I approved something for the header of Alliance Championship, it's approved for every
other event because they have to be the same." Results sits where it was approved, on every
event. "I said edit will not be there": no Edit in any event's head. The date, repeat and
alliance-time forms it opened go to the admin menu (to be designed).

## Timelines (27 Nov)

- No rewards row in a timeline: Alliance Championship's "Rewards sent by mail" at 12:00 repeated
  the end's 12:00. "Something is doubled, it has to not be doubled. If there's no other rewards
  mentions in the timeline, I don't know why you think there should be one here."
- A phase and its first step at the same time (BATTLES and ROUND 1 at 00:00) keep their own dot
  and time: "battle had a bigger circle than round one".
- Compact rows, on every timeline: "let's make the distances smaller in between them on timeline
  because we have a bunch of space", "I like this much better", "Can we make it standard for
  timelines? ... I mean the spacing, because many of them stretch way too long because of the
  extra spacing." Built: a row is as tall as its words, 7px above and below the words beside the
  line, 5px above and below the date and time; a round's Battle sits closer to its round than to
  the next one (event-panel.css).
- Opening an event from its bar picks no row (Roxanne, 27 Nov): "it selects the entire event and
  then we navigate through the timeline". The pin marks the current stage while the event runs;
  the highlight is only for a row tapped in the timeline ("the highlight only when we select
  something or expand it"). Replaces "opens its timeline, marked and scrolled to ... the phase
  tapped" (22 Nov).
- Lines beside each other in a timeline (Roxanne, 27 Nov): "two lines on the timeline are too close
  to each other, let's establish a standard distance between them". Built: 20px centre to centre,
  a part's line to the main line and two part lines to each other (event-panel.css).
- Each moment's time is written once, on every timeline (Roxanne, 27 Nov): "I've decided we shouldn't
  have the same time twice afterall ... for all events the time showing only once should be the
  standard practice" (replaces the 27 Nov note that a phase and its first step each keep a dot and
  a time). A row at the same moment as the row above has no time and no dot and sits close under
  it; a ticket that opens at that moment starts on that row ("ELIMINATION start at 00 utc, we put
  the round one under and the ticket line on the left also starts at 00 utc").
- Tundra Arms League's Elimination named as Alliance Championship's rounds (Roxanne, 27 Nov): "Round 1,
  Match Predictions, Elimination": ROUND n with Match Predictions under it where the predictions
  open, then Elimination on its battle day. The Championship part waits for her ("i need to see the
  rest to decide how we're gonna split this for championship too").
- Tundra Arms League's sign-up rows (Roxanne, 27 Nov): "Legion & member registration" (Thu, day 6)
  and "Registration deadline" (Fri, day 7, 00:00). The order of the lines beside the timeline, left
  to right: Champion Prediction, Match Prediction, the event's line ("the order should be
  championship tickets then elimination then the event line").
- Tundra Arms League's rounds, both phases (Roxanne, 27 Nov: "each foundry battle will eliminate one
  team, maybe battle is enough"): ROUND n with Match Predictions under it, Champion Prediction xN
  under it where it opens, then Match day on the fight day ("Match day? or is that too much?", 27 Nov, after "i still don't like the
  BAttle"); Championship's rounds numbered from 1. Match Predictions is written in its line's purple
  ("make the purple a little more purple so we can tell it's for the purple line").
- Tundra Arms League match results (Roxanne, 27 Nov, with an old xSK match screen): "we will want to
  record that for the next season, the state's games, we'll decide how we build it in foundry and we
  only change the colours for this". TAL's match results are Foundry's results element, in TAL's
  colours; designed when Foundry's results are (data/captures/tal-match-mail-1060-vs-1040.jpg).
- Tundra Arms League round names (Roxanne, 27 Nov): Elimination's last round is ROUND 4 – QUALIFIER ("it
  would be the last round of elimination, cause only 4 teams get out of groups and into the
  championship"); Championship's are ROUND 1 – GOLD & SILVER, ROUND 2 – SEMI-FINAL, ROUND 3 – FINAL
  ("should we add them as Round 3 - FINAL"). How the Championship runs: data/captures/
  tundra-arms-league-hall-of-heroism.md.
- Notes on reward and mission pages (Roxanne, 27 Nov): "make the long text more white and smaller, I
  still wanna be able to read it". Built: 10.5px in the muted (lighter) tone, every event (replaces
  "11 px, faint" of the Reward lists entry).
- Tundra Arms League's Rewards (Roxanne, 27 Nov): "championship glory seems like something that could
  stand on it's own, so maybe more tabs inside rewards, for this then ranking and whatever else there
  is?" Built for TAL (rewardListTabs): tabs Champion's Glory, Ranking, Combatant; shown to her.
  Champion's Glory: the game's names (Champion Alliance Glory, Top 4 Alliance Glory) on top, the big
  rewards centred under them ("the 1 and 2-4 are too vague and should stand at the top with the
  rewards centered", "why are you cutting out the names they have already?"). Rewards and Missions use
  the defined designs ("we should try to use the defined designs at least") and one set of text
  styles ("the fonts are all over the place too").
- Alliance Championship's Prestige rewards are on purple tiles, as in the game's mail (Roxanne, 27 Nov:
  "Looks like the background was purple for ac skins").
- Champion's Glory frames (Roxanne, 27 Nov, her own drawings of the game's frames): "They will be the
  tall ... backgrounds for those rewards, and try to use them as they are in game". Built: each reward
  inside the frame, picture and name inside, the castle-top frame for Champion Alliance Glory, the
  rounded one for Top 4 Alliance Glory (public/images/frames). Every name gets two lines' room so the
  pictures of a row line up.
- Ranking lists (Roxanne, 27 Nov): "see how the rankings are centered in game. I think that's what we
  want to do also. And I like the 1, 2, 3 badges." Built for Tundra Arms League (rankBadges): every rank
  centred in its column, 1 to 3 as the game's badges (public/images/ranks, cut from the Out of Games
  guide's screenshot; she offered better pictures if these are not good enough).
- Rank badges (27 Nov): her three medals (gold with a red ribbon, silver-blue, bronze), cut out on squares, shown 30 x 30 px ("they're a little too big" at 36). They replaced her shields: "the other are too strong and I can't tell if they are bothering me or the rest".
- Champion's Glory cards (27 Nov): the picture and name sit lower in the frame ("the building is too high
  and the text is too high"), and the cards are smaller and spaced ("making them smaller and spread them ...
  I want more to fit in one screen"): 132 px wide, 30 px apart side by side, 20 px top to bottom, names
  10.5 px and kept inside the frame. "Yes, I like this better."
- Tabs inside a page (27 Nov): "tabs should be centered, they don't look good if they don't take up the
  full length". Every rank-tabs row (reward lists, tiers, missions) is centred. Tundra Arms League's
  second row (Legion, Alliance, State Rewards) is words with no line under it, the open one underlined
  in the event's colour: "yes, better".
- Ranking rows with extra rewards (27 Nov): "common rewards on the 2nd row, extra on the 1st". On
  Tundra Arms League's Legion ranking, the rewards every rank gets sit on the second line,
  the top ranks' extras (skins, mithril) on the first: rank 1 is 4 + 5, ranks 2 to 4 are 3 + 5.
  "ok, i like it, keep it as a practice for other rewards that overflow": every list whose rows run
  over a phone line does the same (today only TAL's Legion ranking).
- Rank medals on every ranking list (27 Nov): asked "should the badges and the centred ranks go on every
  event's ranking lists?", she said "yes". Every ranking list (and Alliance Championship's Group
  Ranking) draws 1, 2, 3 as her medals and centres every rank; the rankBadges flag is gone.
  "it doesn't make sense to use it alone if 2-3 are numbers": medals only when rank 2 has its own row
  (so Alliance Championship's 1, 2–3 stay numbers; Showdown's 1, 2, 3–5 keep two medals).
  "do the same for KO1": Alliance Championship's KO1, KO2 and Defeat are centred in their column too.
- Reward amounts (27 Nov): "200000 is 200k, we don't write big numbers on rewards like that". From
  1,000 up the tiles write K or M with at most one decimal, as the game's 25.6K (reward-amount.ts), on
  event and fortress tiles. Smaller amounts are written in full. From 1,000 on: "numbers can be written smarter, either use the k and m".
- Reward standard (27 Nov): "ok, i like this 6 works, can you make sure the rewards follow these rules,
  all of them, and send me the screens to go through them, but after we finish with tal". Six tiles a
  line filling the panel after the rank column (52 px, 56 px on a phone; ranges break after the dash), every tile on a
  screen the same size, lists with no rank column lined up under the rows. Built in event-panel.css.
  The pass over every event's rewards, with screens for her, comes after Tundra Arms League.
- Win / lose sections (27 Nov): "things like winning alliance/losing or drawing need to be tabs, it's one
  or the other".
- Tabs and tiles (27 Nov): "if we have 4 per line they have no excuse to be bigger, it's the same 6 per
  line size and they all start at the same left coordinates" (flat lists and mission rewards too); "if we
  have rewards separated by if, if it's a win or a rank or a tier, we will show them in tabs"; "if we have
  tabs the line gets split ... the word will be centered and the whole width of the section gets
  highlighted". TAL Combatant: Elimination / Championship, then Win / Loss ("Legion members / WIN / LOSS
  ... also acceptable"), headings Legion members and Combatants, by Personal Arsenal Points.
  Then "do the win loss thing i said": Legion members as two lines, Win and Loss, in the rank column;
  Combatants, by Personal Arsenal Points with Win / Loss tabs under its heading. Every label centred.
  Points in row labels are written short too ("i already asked for it"; "000 and 999 give us no value"):
  "bigger or equal with 20K, smaller than 42 ... one on one row, the other one on the next": ≥20K over
  <42K, and 180K+ as ≥180K; single points as 100K. Ranks,
  written without commas, stay as they are.
- Tile size (27 Nov): "you calculate the height for rewards for width to fit 6, and that's what all
  rewards will use, except the ones that are like 2 by 2 or like 2 per row". The 6-per-line tiles are
  never made smaller to fit a label: a long label goes onto two lines instead.
- Two levels of tabs (27 Nov): "we do not want 2 rows of tabs, so it's tabs and then something else for
  tabs, but not the main tabs". Only the first row of tabs inside a page splits its line; the levels
  under it are the centred words (Legion · Alliance · State Rewards), underlined under the open word.
  "just make them the same width, win and loss": every word of a lower level of tabs gets the widest
  word's width, so the underlines match.
  "all sub-tabs. Make them the same width, a little bigger than the biggest, and place them nicely in
  the center": 10 px more on each side of the widest word, 10 px apart, the row centred.
- Round tile sizes (27 Nov): "I like round numbers ... make them 50 and 60 ... just calculate it in a way
  that doing it like to fill the width will give you the 50 and 60 result". Rank column 52 px on a
  computer (tiles 50 px on her laptop, 60 px on her monitor), 56 px on a phone (36 px on hers, 32 px on
  a 360 px phone).
- Labels and medals fit their column (27 Nov): "fix the numbers too. See which one is the biggest and how
  big can it be ... Make them fit", "1, 2, 3 logos too". Labels 13 px (the widest word but Winter Siege's
  "Stronghold" is Dreamscape's "Chapter", which fits the 52 px column at 13 px); medals as big as a tile,
  never wider than the column (36 px phone, 50 px laptop, 52 px monitor).
- Winter Siege's Stronghold Conquest rows (27 Nov): labelled 1 to 6, not "Stronghold 1" to "Stronghold 6",
  since the heading says it ("yes").
- Labels and rewards (27 Nov): "it's a little too close to rewards for my liking". The label reaches
  10 px into the panel's margin and stays 10 px from the tiles; the tiles keep their size.
- Showdown (27 Nov): "you did not apply the tabs for showdown", then "WIN and LOSS can be on the left for
  those cases". Daily and Star (no ranks) write Win and Loss or draw on the left; Ranking (ranks on the
  left) has Win / Loss or draw tabs under its star tabs.
- Merchant tab (27 Nov): "merchant has to be separate from rewards because many events have one",
  "including TAL ... there's a shop for both types of tickets". Merchants and shops are a tab of their
  own after Rewards (Winter Siege, Flame and Fangs, Emporium of Enigma). TAL's two ticket shops wait for
  her screenshots.
- TAL shops (27 Nov): "search in guides ffs", "Yes, we need these 2 shops too". Saved from Heaven
  Guardian's guide (data/captures/tundra-arms-league-hall-of-heroism.md) as the Merchant tab's Ordinary
  Shop (Match Stakes) and Champion Shop (Champion Stakes).
- Shops (Roxanne, 27 Nov night, with five screens from the game: Mystery Shop, VIP Shop, Labyrinth
  Shop, Foundry Shop, Kasia's Shop; on the screenshots branch, shops/ and harvests-and-feasts/):
  "We are going to replace the merchant name with Shop since it's widely known in game and we'll
  use these to design the shops to keep the familiarity, so instead of a transparent box we'll add
  a graphical element that is drawn based on event and we'll display the shops like this". The tab
  is Shop; each offer is a card drawn like the game's (item, limit, price), in the event's colours.
- Shop cards, first look (Roxanne, 27 Nov night): "the cards are perfect in color. What they're not
  perfect in is like shape and size ... and texture ... I just want it to be more glassy, even if
  it's a glass that you cannot see through. It's more thick. It still has to be glass ... the thing
  on the bottom that's white where we put the prices, that is too tall ... We are gonna optimize it
  just a little bit on the aspect, but other than that, I love them."
- Results button, every event (Roxanne, 27 Nov night): "Yes, I like the add results." The SvS will
  also get rules: "We are gonna also add rules here so everyone can know what we agreed with the
  other state, but that's specific to SES. We're gonna discuss it further along the way".
- SvS results are worked out, never chosen (Roxanne, 27 Nov night): "please tell me the win or loss
  is determined, not chosen, because it's gonna be based on the total of preparation, whoever has
  the bigger total. And then battle ... whomever the state that has the winning alliance, that's the
  winner. So you don't add the times for every single alliance ... you only keep track of the
  biggest time. If the alliance that held it the most is from our state, then we won. If not, we
  lost."
- Ticket lines (Roxanne, 27 Nov night, TAL): "At round 1, the tickets start only when round 1 is
  written, but the 0 is at elimination. So make sure the ticket always is on the right time. Like, it
  has to start at elimination." A ticket line starts on the first row at its moment.
- Shop price bar (Roxanne, 27 Nov night): "I don't like the white. It's too white ... How numbers are
  centered, or how they look in that white thing ... Are they higher than they are supposed to be?
  Make it like a transparent glass, right? So it is gonna be white but see-through." Built: a
  see-through white glass bar, the price in white, the digits centred on it (measured).
- SvS results only from their numbers (Roxanne, 27 Nov night): "I do not want it to be chosen by win
  and loss ... I want the details. Without the details, we have no records. Not from this point on.
  We have that for old records, but that's because that's all we had ... From now on, we do things
  right." Built: no WIN / LOSS to tap in the editor; Preparation from the days (or the two totals),
  Battle from the longest hold; the old records keep their results.
- Shop price bar (Roxanne, 27 Nov night): "a 4th version where they are see-through but whiter, like
  more opaque, but still see-through."
- Shops accepted (Roxanne, 27 Nov night): "Ok, the shops are perfect" (the 4th version).
- Shops on the computer (Roxanne, 27 Nov night): "for PC you are making them feel the width, and we
  don't want that. The proportion we have in the mobile version is perfect. That's what we want,
  even if we are gonna center them a little more and put a bit of space in between." Built: the
  phone's card (92 x 113 px) on every screen, centred, 16 px apart on a computer.
- Shops on big screens (Roxanne, 27 Nov night): "I guess it's fine. They're a little narrow ... The
  edge is just a little too big on the bigger PC ... Maybe we want just to scale them a little. I
  have no idea. Make a proposal for that, and I'll decide after. And tell me what the problems with
  that might be."
- Flame and Fangs (Roxanne, 27 Nov night): "we only have a shop. Mine is only for events that have
  something to record, and we have nothing to record here. Completing Lighthouse, Intel gives
  Crystallite. We do not need this, okay? So what we will have here is a shop, and a timeline, but
  not an event timeline, but an instruction timeline." She is sending the instruction timeline from
  Discord. Built: no Mine, no note; the Shop alone until the timeline comes.
- Flame and Fangs' plan (Roxanne, 27 Nov night, with xSK's Discord plan, the Lighthouse Intel rules and
  Agnes' Efficient Recon; screenshots branch flame-and-fangs/): "it would be a how to that starts before
  the event, some kind of preparation"; "We can include it in the timeline but then we have to add the
  mission refreshes for the event duration, it's 2 days and one to claim rewards if I'm not mistaken".
  From the game: Intel refreshes daily at 00:00, 08:00 and 16:00 UTC and lasts 15 hours; Agnes'
  Efficient Recon refreshes at 00:00 UTC. Mockup: PREPARATION the day before (her plan's three windows),
  then EVENT with every Intel refresh; the claim day is not added (the site has the event as 2 days).
- Flame and Fangs' cores (Roxanne, 27 Nov night): "if we have the core numbers, shouldn't they be in a
  missions tab? that's what they are, no?" Built: a Missions tab (Firebeast 10, Intel mission 1, the
  per-refresh and event totals as its note); the timeline keeps only the plan. Her rule on the plan's
  words: "this cannot be more wordy than the discord message, we are adding all the icons we need ...
  use the hover to show the skill"; the shop's extra day is a dotted line with no name.
- Tab order (Roxanne, 27 Nov night): "no, timeline, missions, shop, shop is always after missions".
