# Page style

How a page is drawn, taken from the approved pages: the player page, the calendar and
its Filters, Fortress Phase and Season, the Transfers Timeline. Every new page, a basic
one too, is drawn this way from the start. Accepted by Roxanne on 24 Nov. The working
pages (Invites, Records, My alliance, State, the event pages, Map, Admin) follow it
through their shared parts in src/ui/data-table.ts: build new basic pages from those
parts, never from glass sections, browser dropdowns, filled buttons or filled pills.

## Ground
- The page lies on the background. No panel around a page, a part or a list, and never a
  box in a box. Glass is for what sits over the page: event bars, pop-ups, the Filters
  sheet.
- Parts are kept apart by space (26px on a phone, 44px on a computer) and by their
  titles. A thin line in the page's colour only where it heads a set (the forts, the
  strongholds), exactly as wide as what it heads.

## Titles
- A part's title is small spaced capitals (14px, weight 800, 0.14em), in the page's
  colour mixed with the muted text colour. Its actions sit on the same line after it.
- A title in the page only when it says what the band and the page names do not: the
  season and phase, the day (white capitals, centred).
- The section and page names are only in the band and the page-name row.

## Content
- Things sit in centred columns: the picture, the name above or under it, a short detail
  line under it. Three, four, five or seven to a line, filling the width on a phone,
  fixed sizes on a computer. Things on one line line up at every row.
- A value is large and bold with its small muted name above it; a rank after it, small,
  in the page's colour (#2).
- The game's own pictures wherever the thing has one: troops, heroes, rewards, events,
  alliances. Rewards in the game's own tile, untouched.
- An alliance is its pill in its own colours (Fortress) or its badge, the tag over the
  logo (player page).
- Three text tones: white for what matters, muted for names of values, faint for what is
  empty or secondary.
- A list of people or things is one line per row, no card per row.
- An empty value reads as meant: one faint sentence, never an empty box.

## Actions
- No filled buttons, and never a filled blue pill for a picked choice. An action is an
  icon and a word with no box: the icon in the page's colour with a soft glow, the words
  running from a tint into white (Filters, Update skill level, Refresh).
- Cancel and Save are a red cross and a green tick with their words, on the title line
  of the part being edited. Save is dimmed until there is a change.
- A pick among a few is words, the picked one bold and lit, the others quiet (None /
  Lvl. 1 / Lvl. 2 / Lvl. 3; Main / Alt / Farm). Two ways to show the same thing show both
  words with the picked one lit in the page's colour (All | Ours).
- The pencil is the cue to edit in place, beside what it changes.
- No count badges, and no labels or notes that were not asked for.

## Editing
- In place, in the same space as what it changes, with a short animation where it
  helps. No form panel and no box around a form.
- A part that is only a form has Cancel and Save on its own title line. A form inside a
  part has a short title in sentence case with Cancel and Save after it.
- Each field's name sits small and muted above it, as a value's name does.
- A typed value goes in the glass field (Add account). A date uses the device's date
  picker inside that field.
- A pick among up to ten is words (alliances by their tags). Only a longer list, such
  as people, is the glass field with a small arrow that opens the device's list.
- On and off is the switch from Filters, with its words beside it.
- In a table, the row being changed keeps its place; its form opens on the line under
  it, across the whole width: Cancel and Save first, then the fields.
- Leaving with changes not saved asks Save or Cancel.

## Tables
- Working pages show lists of records as tables: column names small, faint capitals; a
  quiet line between rows; no box. Cells stay on one line, except written notes.
- On a phone a table wider than the screen scrolls sideways and fades at the edge with
  more past it. Change is the pencil alone on a phone, the pencil and the word on a
  computer.
- On a computer a table is as wide as its columns, and the page starts on the same left
  edge as the page names.

## Pop-ups
- Solid, in the page's two colours: a line of the first colour along the top edge, the
  title in the second, the action in the first. A sheet from the bottom on a phone, a
  panel on a computer.

## Phone and computer
- The phone is designed first. On a computer the page is centred (up to 1180px), parts
  that belong together sit side by side, and the page's controls sit at the right of the
  page-name row.

## Colour
- One first and one second colour per page (design-decisions.md, Navigation). The player
  page takes its alliance's colour, evened.
- Red only for a notice and Cancel, green only for Save.

## Event panels (owner, 25 Nov: "we need the same rules for panels and we design using them")

Set once in event-panel.css and taken by every panel; a panel with an exception keeps
only what makes it one (the room its letters, digits or bars leave over and under them).
- Spaces, measured on what is drawn: --panel-top 15px from the tabs to the first thing,
  --panel-title-gap 15px from a section's title to its content, --panel-section-gap 25px
  between sections, --panel-bottom 15px after the last thing.
- A section's title: .panel-title, 14px bold capitals with wide spacing, almost white
  (--text). A result (WIN, LOSS) on the right of the same line. A title inside a section
  is one step lower: the words as written, white, bold, 14px.
- The event's colours are in the panel's background (both of its colours, tintedPanelStyle),
  its lines and its icons, never in the titles.
- A way to another page: pageButton (the edit button's style with the open icon), as
  "SvS Records".
- Timelines: phases and stages 13px capitals; days, steps and openings 12px; the current
  row has the pin; lines as soft as State of Power's.
- Font: Roboto everywhere; the short form of an event (SvS, TAL) stays Montserrat.
