# Player profile draft (branch profile-draft)

History: this was the draft of 23 Nov. Its work is now on main; where things stand is in notes/handoff.md.

This branch holds everything done after commit c146c03 on main. None of it is approved as a whole. Roxanne is very unhappy with the profile design on this branch: the options were built literally from her words instead of designed, faults were left for her to find, and she could not push any of it.

## Start here

1. Work on this branch: `git checkout profile-draft`. Main is the last approved state.
2. Read this file, then notes/design-decisions.md and notes/rules-and-open-items.md. design-decisions.md does not describe this draft yet.
3. To see the profile: follow tools/render/README.md, including `add-test-player.py`. The database query does not fetch accounts, so the profile needs the made-up test player. Then use `shoot-player.py` for screenshots.
4. Before showing anything, check it against the faults listed below.

## Asked for by Roxanne (fine to keep)

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

## Fixes made on 23 Nov, not yet seen by Roxanne

- Above the name, the tag (alliance colour) and Main, Alt or Farm (quiet text colour) are
  separate. While open, Main | Alt | Farm is one switch with the picked one lit.
- M | B is one switch beside the power, the same size as the other switches.
- An empty power or foundry power shows a dash, shown and while typed.
- Foundry power is written 15,230 while typed too.
- While open, the alliance logo has its tag with an arrow in a pill under it.
- Remove this alt or farm is a quiet line under Cancel and Save.
- Side by side, the open half wraps its powers under the name and keeps clear of its pencil.
- The open farm or Add has its line right under its name. Pointing at a tile draws no box.
- On a phone the swap sits in the Player info title's left corner, not on its own row.
- A farm opens showing its saved details with its own pencil; the pencil opens editing.

## Player info as columns (23 Nov), not yet seen by Roxanne

- Player info is drawn like the troops: Alliance, Name, Power and Foundry power as
  columns with the name on top and a thin line between. Two by two on a phone and in
  each half side by side.
- Editing turns each value into the site's own glass field (44px, corner a quarter of
  that) in the same column, the fields on one line; M | B inside the power field;
  Main | Alt | Farm above the name field; the alliance as a field with its logo, tag and
  arrow. An open farm or a new account uses the same columns.
- The title's left corner holds what the account is and the swap ("Main ⇄ Alt"); only
  the swap on a phone.

## Still open

- Where the swap to the other account sits.
- Troop tier colours: the current ones are too bright and hard to read. Two sets were tried and rejected: tier names in plain grey text, and the same colours made lighter. Neither is in the code; start the colours fresh.
- The Tyrant roster picking from accounts, to be settled with Tyrant.
- A new account opens all three troops at once and looks cramped.
- notes/design-decisions.md does not describe this draft yet.

## How Roxanne wants design work done

- Design first, then build: bring real designed options, not a literal reading of her words.
- No big boxes around things, and no control dumped in its own row in the middle of the page.
- Check every screenshot critically before showing it, so she never has to point out faults.
- One question per message.
