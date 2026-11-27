# Review checklist

Every screenshot is checked against this before Roxanne sees it. Each line is a fault she
has had to point out before. When she points out a new kind of fault, it is added here.

## Scrolling and spacing (Roxanne, 27 Nov)
- Every box whose content can be taller than it scrolls, on the phone and the computer, with
  no scrollbar drawn. Nothing is cut off at the bottom of a page, panel, card or pop-up.
- While a pop-up or sheet is open only it scrolls; the page behind stays still.
- Items never touch: rows, cards and picked choices always have space between them.
- Check it after every change: python3 tools/render/scroll-audit.py <build> <out> <port>
  (every page and pop-up, phone and computer: cut-off content, drawn scrollbars, boxes
  touching), then scroll each new box by hand in the render.

## Panels (Roxanne, 27 Nov night)
- Before touching an event: its rules (rules-and-open-items.md), its captures file, its
  decisions. Nothing she confirmed is asked, searched or presented as new.
- A change to one event's panel that is a rule (results, rewards, merchants, timelines, the head)
  is checked on every event: run tools/render/panels.py and go through every tab and
  panels.txt. She found rules applied only on the page she was looking at.
- Results: no Results tab until that run has results; the trophy Results button in the head
  for whoever may add, once something has happened to record. Every event with results.
- Rewards and shops are reward data shown as tiles, never lines of text; every shop is in the
  Merchant tab.
- Timelines: no rewards or mail rows; each moment's time written once.

## The flow
- The phone's back closes what is open over the page first, then goes to the page before,
  never out of the site while there is one (Roxanne, 26 Nov).
- Go through the page as a player would: what they see first, what they tap, where
  they end up. Every step is obvious without being explained.
- A link to another page is the edit button's style with the open icon (a square with an
  arrow leaving it), as "SvS Records" (owner, 25 Nov): pageButton in edit-forms.ts.
- Nothing opens in editing mode or shows Save on its own: a page or panel opens as a
  member sees it, and the edit button (the profile's) swaps it to editing (site-wide rule,
  25 Nov). Editing moves nothing: measure every element's position in both modes; each
  value gets a small box that fits in the space it already has.
- What can be tapped looks tappable. Nothing important hangs on a tiny arrow or icon.
- A picked choice looks picked, not like a stray badge.
- Removing or deleting sits apart from Save and Cancel, never in the same row as an
  equal.
- Leaving with changes not saved is caught.
- Did I build anything I thought was weak? Then it is fixed or raised first.

## The look
- Drawn as notes/page-style.md says, a basic page too: nothing from the working pages'
  glass sections, forms, dropdowns or filled buttons.
- Only the app's own tokens. No colour or styling brought in from elsewhere.
- No big boxes or cards around things. No control alone in its own row in the middle of
  the page.
- No labels, counts or notes she did not ask for. The page is not a notepad.
- The same kind of thing has the same size everywhere (buttons side by side, pills).
- Two different things never share a colour.
- A change asked for (more space, smaller) is made in proportion, not swung to the other
  extreme.
- Nothing is cut while there is empty space beside it: "having wide spacing when an element
  doesn't fit when we could adjust it to properly show them is not justified" (Roxanne,
  26 Nov). Test names of 16 characters (a normal wide one, like MrBoombastic1234) on the
  phone and the computer, in every mode.

## The layout
- Items next to each other share one line: their labels on one line and their values on one
  line, whatever each value is (text, a box, a picture). Roxanne, 26 Nov: "we never ever allow
  this kind of alignment for items that are next to each other, we're careful and
  professional".
- On the phone a list title's line is as wide as the rows under it (Roxanne, 26 Nov: no 4px
  difference); everything on the page starts and ends at the same edges.
- Nothing shown twice. Nothing touching or colliding. Nothing cramped.
- Lines and edges align. A line under something sits right under it. Measure it in the
  screenshot's pixels: words on one line the same height, edges on the same x.
- It works on a phone and on a computer, both checked.

## The content
- Messages to her never name a colour (no hex, no colour words as the point): she judges colours
  only by seeing them with the rest of the screen (27 Nov night: "for the millionth time").
- Text she sends from elsewhere (a Discord message, a guide) is written in the site's own styles
  (12px steps, the three tones), never copied with its bold or colours (27 Nov night).
- A label reads correctly whatever is picked.
- An empty value looks intentionally empty, never broken. Before showing anything as not
  recorded, check whether the records already hold it (the president always is). A part
  of a result that is not recorded is not shown at all, with no line saying so.
- A value is written the same way when shown and when edited.
- Text follows the writing rules in notes/visual-language.md: facts from the game, the
  game's names, full sentences, no filler.

## The states
- Rendered and checked: empty, filled, editing, long names, errors, every kind of item,
  phone and computer.
- A section title in an event's panel is the generic .panel-title (almost white, 14px
  capitals); the event's colours go in the background, lines and icons, never the titles.
- Every box with text keeps at least 3px above and below its letters and 5px after them;
  look for cut shadows and letter edges at the right of names (26 Nov).
