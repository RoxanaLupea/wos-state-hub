# Player profile draft (branch profile-draft)

This branch holds everything done after commit c146c03 on main. None of it is approved as a whole. Roxa is very unhappy with the profile design on this branch: the options were built literally from her words instead of designed, faults were left for her to find, and she could not push any of it.

## Asked for by Roxa (fine to keep)

- Images come only from wos-state-hub public/images. The database setting imageBaseUrl is already fixed live; seed.sql, seed/settings.json and design/elements.html are fixed on this branch.
- Admin is in the menu under the name, and the gear is gone from the top bar.
- The menu lists main and alt for switching. It hides that list only when there is no alt.
- Cancel sits beside Save on every edit form. Cancel and Save are the same size; Save looks like Cancel with faint text until something changes.
- Power can be anything from 1M to 99.999B, for main, alts and farms.

## Not approved

- Profile layout:
  - the swap to the other account sits beside the logo (beside or opposite was never answered)
  - the One | Both switch in the Player info title, with split view on PC only
  - Your accounts shows only farms plus Add
  - troop portraits are 88px on PC
- In-place editing: an open account keeps the shape it has when shown, each value is a field in its place, and the logo opens a list of alliances. The old form with big alliance tiles was called an atrocity.

## Faults in the in-place editing, found after showing it

- "DVL · MAIN ALT FARM" reads as "DVL · MAIN" whatever is picked, and DVL and FARM share a colour.
- The M/B switch is two tiny stacked letters; the picked one looks like a stray badge.
- An empty power or foundry power is a bare line under a label and looks broken.
- Foundry power shows 15230 while editing and 15,230 when shown.
- Only a tiny arrow tells that the logo opens the alliance list.
- Remove this farm is a big red box in the same row as Cancel and Save.
- In split view the left half is cramped and its pencil touches "Foundry power".
- The open Add tile has its line far below "Add".

## Still open

- Where the swap to the other account sits.
- Troop tier colours: the current ones are too bright and hard to read. Two softer sets were tried and are not in the code.
- The Tyrant roster picking from accounts, to be settled with Tyrant.
- A new account opens all three troops at once and looks cramped.
- notes/design-decisions.md does not describe this draft yet.

## How Roxa wants design work done

- Design first, then build: bring real designed options, not a literal reading of her words.
- No big boxes around things, and no control dumped in its own row in the middle of the page.
- Check every screenshot critically before showing it, so she never has to point out faults.
- One question per message.
