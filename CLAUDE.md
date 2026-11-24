# Working on State Hub

Read this first in every chat. Roxanne should never have to explain the setup or her past
work again.

## Setup, before any other work

1. Push access: attach the repo with add_repo, owner RoxanaLupea, repo wos-state-hub,
   access "push". Roxanne has said push access is always needed. If the first request is
   refused, ask her in one line to confirm push access, then ask again. Never carry on
   with a read-only copy and never tell her you cannot push.
2. Clone it to /home/claude/wos-state-hub, then call register_repo_root with that folder.
3. GitHub: `gh run list -R RoxanaLupea/wos-state-hub -L 1` shows the last build.
4. Database: the Supabase project "wos-state-hub", id tnfghlayeguyheoyrakq.
5. Calls to outside websites (this workspace cannot reach them): run them from the
   database with admin_tools.http (see supabase/admin-tools.sql). The Whiteout Stats API
   gives player data by in-game ID; its key is never written into the repo.
6. Rendering: follow tools/render/README.md. npm packages cannot be installed here, so
   the real build only runs on GitHub after a push.

Then read notes/handoff.md before anything else: where the work stands and what is next.

Then read, in full: notes/what-this-is.md, notes/design-decisions.md,
notes/visual-language.md and notes/rules-and-open-items.md. On a draft branch, also
read the notes file it names (for profile-draft: notes/profile-draft.md).

## What needs Roxanne's yes

- Pushing, and writing to the database. Before either, walk her through what changed
  and why, list the items still open, and wait for a clear yes to that exact action.
- Approved changes are kept here and pushed together once enough has gathered, not
  after every change.
- When she says to push, everything goes live: main and whatever is on the draft branch
  together, so she sees it all on the site. Draft or not makes no difference to a push
  she asked for (24 Nov).

## How the work is done

- Only UI and design work goes on a draft branch. Fixes to data, the database and
  how things work are done on main and pushed straight to main, still after walking
  her through them and her yes (24 Nov).
- Every working rule she sets goes into this file, or into the notes it lists, as soon
  as it is said, in the same chat, so the next chat starts with it (24 Nov). Rules of the
  site itself go to notes/design-decisions.md.
- Design work happens on a draft in this workspace. Her approved files stay untouched
  until she says yes.
- Nothing counts as settled until she says so. Settled decisions go into
  notes/design-decisions.md first and into the code second.
- A commit message is one short sentence, with no body.
- After every push, check the GitHub build. It uses TypeScript 5: loop over
  Array.from(...), never over a NodeList.
- tools/render/data/ holds a copy of the database and is never committed. The repo is
  public.

## Design judgment

Roxanne gives the direction. The design quality is Claude's job, and it stays on when
she asks for a change.

- Whatever Roxanne has said once is decided: she thought it through days before, then
  added or removed while building. Never hand her decisions back to her to check, sum
  up or re-approve. Gather them from the notes and past work and design from them. Ask
  her only about what is genuinely open, one thing at a time, and only when design
  cannot settle it.
- Brief first. Before any code, write in the chat, in a few lines, what the page or
  part is for, who uses it and what matters most on it. The brief adds to her
  decisions; it never restates or replaces them.
- Read a request as a goal, not a spec. "Swap between main and alt" means a player
  reaches their other account easily. Where the control goes and how it looks is a
  design decision, made for the whole page and the way a player moves through it.
- Never build something that is clearly bad. When doing exactly what was said would
  hurt how the page works, say so in one or two sentences before building, and build
  the version that reaches her goal. She still gets the literal version if she wants
  it after hearing why, but never silently.
- A change is finished only when the whole flow still works: what a player sees first,
  what they tap, and what happens when a value is empty or long.
- Render every state, not only the easy one: empty, filled, editing, long names,
  errors, every kind of item (main, alt, farm), on a phone and on a computer.
- Before sending any screenshot, check it against notes/review-checklist.md and fix
  what fails. Send full-screen screenshots, never crops.
