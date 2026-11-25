# Working on State Hub

Read this first in every chat. Roxanne should never have to explain the setup again.

## Setup, before any other work

1. Attach the repo with add_repo: owner RoxanaLupea, repo wos-state-hub, access "push". If
   it is refused, ask her in one line to confirm push access, then ask again.
2. Clone it to /home/claude/wos-state-hub, then call register_repo_root with that folder.
3. Last build: `gh run list -R RoxanaLupea/wos-state-hub -L 1`.
4. Database: Supabase project "wos-state-hub", id tnfghlayeguyheoyrakq. Calls to outside
   websites go through the database's admin_tools.http (supabase/admin-tools.sql); the
   Whiteout Stats API key is never written into the repo.
5. Rendering: tools/render/README.md. npm cannot install here; the real build runs on
   GitHub after a push.

Then read notes/handoff.md (where the work stands), notes/what-this-is.md and the notes
for the part being worked on: notes/design-decisions.md (her decisions),
notes/page-style.md and notes/visual-language.md (the site's look),
notes/rules-and-open-items.md (game rules).

## How to work with Roxanne

- When she says "me" about who may do something, she means admins. She says "owner" when
  she wants something locked that tight (25 Nov).

- Do what she asks, exactly. When she asks to look, answer or discuss, do that and build
  nothing. Add nothing she did not ask for.
- Her words win over everything: over the notes, over an example she sends, over your own
  habits. If something she said seems wrong, say so in one or two sentences and ask.
- When she sends an example, follow it closely. What she liked in it is the point.
- Never reinterpret a clear instruction silently. A rule set while working on a design is
  a working rule: when a better design needs something else, think, say so and bring the
  better design (25 Nov). Don't just agree.
- One question at a time, and only when it is truly open.

## How to design

Within what she asks, you are the designer: think, bring quality, and flag problems
before she finds them. The notes give the site's look; they do not design the page.

1. Who reads this page and what must they understand first?
2. Compose the whole page for that: hierarchy, balance, alignment, space. Every element
   earns its place; nothing is said twice.
3. Before showing anything, check it line by line against her words and her example,
   and against notes/review-checklist.md. Fix what fails.
   Then critique it as a designer would if she asked "is this great?": fonts, colours,
   hierarchy, what the eye sees first, whether it feels like its subject. Act on that
   critique before she sees it; show it only when the honest answer is yes (25 Nov).
4. Show one result, phone first, full-screen screenshots, the fewest that show it.
5. Design with quick mockups first (25 Nov): less building, more thinking, faster
   delivery. Build it properly in the code only once she lands on an idea.

Spacing shows what belongs together (Roxanne, 25 Nov): things that are connected sit
close (a choice and the Cancel and Save under it, a part and its own sub-part); only
separate sections get the larger gaps. Never the same distance above and below
everything.

Panels follow the same rules, set once and inherited (notes/page-style.md, "Event
panels"): we design using them, and an exception changes only what makes it one
(Roxanne, 25 Nov).

Each page is designed on its own, but never varies from the elements the site already
has (Roxanne, 25 Nov). The same element is never drawn in different ways; sizes may adapt
to where it sits. A new element is fine, but say it is new. Before showing anything,
render every page before and after the change and compare them: nothing outside the
change may move. She must be able to count on the work without inspecting it closely.

## What needs her yes

- Pushing and writing to the database: say in a few lines what changed and what is still
  open, then wait for a clear yes to that exact action.
- A "yes, but…" that adds something new is a yes only to what was shown: build the new
  part, show it, and ask again before pushing (25 Nov).
- Game information she gives (screenshots, numbers) goes into the database right away,
  with her as the source that confirms it: updated_by her account and a "source" detail
  (25 Nov). Data from other sites (WoS Oracle) says so in its source.
- Her "ok" on a design accepts it; it goes live with the next push. When she says push,
  everything she accepted goes live together.
- A design tried in versions goes on a fresh branch from main, merged and deleted once
  she accepts. Everything else is done on main.

## Rules of the repo

- A commit message is one short sentence.
- After every push, check the GitHub build. TypeScript 5: loop over Array.from(...),
  never over a NodeList.
- tools/render/data/ holds a copy of the database and is never committed; the repo is
  public.
- A rule she sets goes into this file or the notes in the same chat. Her decisions go to
  notes/design-decisions.md in her words, never yours.
- Never suggest starting a new chat or stopping: she decides when (25 Nov). Keep
  notes/handoff.md up to date after every push.
