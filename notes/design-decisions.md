# Design decisions

What has been settled, and what is still open. Only things confirmed out loud go in
the settled part. Anything else belongs under "Open", however likely it looks.

Read this at the start of a session. If something here is wrong, it gets corrected
here first and in the code second.

## Settled

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

### Controls
- Page controls and card controls are two different languages. What a card shows
  belongs to the card's design and is settled with it.
- Page controls do three jobs: which things show, the same content shown another
  way, and moving through.

## Open

- The shape of each of the three page controls.
- The names of the Timeline's controls, and how they are arranged.
- Where the UTC / Mine choice lives, now that it is out of the navigation. Pages
  other than the calendar also show times.
- How Availability is sorted.
- Everything in "Still to design" in rules-and-open-items.md.

## Data to check at the source

- States 354 to 363 appear in two ranges, 322-363 and 354-399, on 54 of the 66 dates
  in supabase/transfer-group-predictions.csv.
