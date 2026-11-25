# Review checklist

Every screenshot is checked against this before Roxanne sees it. Each line is a fault she
has had to point out before. When she points out a new kind of fault, it is added here.

## The flow
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

## The layout
- Nothing shown twice. Nothing touching or colliding. Nothing cramped.
- Lines and edges align. A line under something sits right under it. Measure it in the
  screenshot's pixels: words on one line the same height, edges on the same x.
- It works on a phone and on a computer, both checked.

## The content
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
