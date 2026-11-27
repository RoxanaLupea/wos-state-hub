# Visual language

How things are drawn, settled over the design sessions. Where two decisions here
would disagree, the later one won and the earlier is gone.

## The look

- Dark theme, glass transparency, coloured accents, white text.
- Blue, purple and teal, the purple and teal leaning blue. Not monotone: strong
  contrast, like a work of art. Dark enough everywhere for white text.
- Readable on a phone and on a computer. The month fits on one screen on both.
- No week numbers.

## Colour

- Every event carries the colours of its own in-game logo.
- An event's colours are taken from the background of its logo, not from the drawing
  on it: a light tone and a darker one. The light tone can be made lighter until it
  reads well. The prediction tickets were set this way first, and every event gets
  its own colours set the same way.
- Those colours are used everywhere the event appears, not only on its bar: its lines
  and dots in the timelines, and its text.
- Everything runs dark to light, left to right or top to bottom (Roxanne, 25 Nov): a bar
  is one natural fade across its whole width, dark behind the logo to light at the end,
  keeping its transparency; a ticket's line, while it is open, fades the same way, and
  so does its line under the calendar bar. Its text is in the light tone. With two logo
  colours, the darker of the two comes first. SvS is the exception: our blue against
  their red, split on a slant in the middle.
- Week-long events are more see-through.
- Alliance colours: each alliance has two banner colours, one of them its base. An
  academy uses its main alliance's colour, lighter.
- 1458 has two alliances with gold banners and three with red, so each needs an
  accent to tell it apart. DVL is gold with purple; the other gold one is gold with
  blue. The three red ones are not decided.
- Never bring a colour in from outside the app's own tokens.

## Bars

- Bars on the same row never differ in height.
- The event's name sits on one line and is never cut. Small text. Short names are
  fine where the game uses them.
- Where a second line names days, never "Day N". Full names at 9px on a computer;
  on a phone the full name cut with an ellipsis.
- A logo gets a shadow in its own shape, lit from the top left, kept close and scaled
  to the logo's size. No ring around it and no tile behind it.
- Logo padding follows one rule across the whole site, with its size chosen case by
  case: a two-line bar logo, a one-line bar logo, bottom-line logos, part-line end
  logos, the year view.
- Icons have no background and no rounded corners, and stand about as tall as two
  lines of text.

## Timelines

- No connector or branch lines anywhere.
- A step is a smaller circle on its line, with its words on the same row.
- Each date appears once per day.
- A line fades the way the event's bar does, and ends with a cap carrying the time.
  Never the word "ends".
- A part running beside an event, like Trade Route inside Showdown, gets its own line
  under the same rules: circles at its times, words in its lighter colour, smaller
  font.
- An event's whole view is one continuous timeline across all its days.
- A pin marks the row that is on now, while the event runs. Only a row tapped in the
  timeline is tinted, its dot bigger with a soft halo in the phase colour, its text bold;
  opening an event from its bar picks no row (Roxanne, 27 Nov).
- Each phase has its own colour. SvS preparation blue, SvS battle red, Field Triage
  mostly teal with a hint of red.

## Pages

- An event's information is split into tabs. Which tabs depends on the event: Info,
  Predictions, Rewards, Missions.
- Filters are "Show on the calendar": a sheet on a phone, a panel on a computer, each
  category with a switch and its events under it (24 Nov; replaced the chips).
- Panels are never stuck to each other: there is always a gap between two (24 Nov).
- Ticking a filter must not shift the rest of the month. A week grows only when its
  bars no longer fit.
- A pencil is the cue to edit or add. Editing happens in place, where the thing is
  being looked at.
- The year view shows only State Transfer, SvS, Tyrant and TAL, as lines with the
  events' logos to the left of the lines, each in its logo's colours.

## Writing on the page

- Every fact comes from the game. Nothing added, nothing assumed.
- Keep what a player needs. Leave out what the game already enforces and what any
  player knows from playing.
- Requirements go at the top, split into Alliance and Player. Everything else is an
  instruction: what to do.
- Use the game's exact names. An alternative name shows in a less visible colour.
- Full sentences, same neutral tone across a list, no filler.
- No labels, counts or notes that were not asked for. The page is not a notepad.

## Images

- All picture file names are lowercase.
- Event icons, items, heroes and experts live in the repo under their own folders.
- An oversized picture is resized to the standard size without asking.
- The PNGs in public/images are the source and are added as before. The build makes a
  WebP of each at no more than twice the size the site shows it at
  (tools/images/make-webp.py, sizes per folder there), and the site shows those from its
  own address (24 Nov): 34 MB of pictures became 2.7 MB. The imageBaseUrl setting is no
  longer used.
- An item with no picture of its own is drawn by the app rather than stored as one.
