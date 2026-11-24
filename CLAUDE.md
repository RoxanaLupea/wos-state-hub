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
notes/visual-language.md and notes/rules-and-open-items.md. On a design branch, also
read the notes file it names, if any.

## The flow (24 Nov: she wants speed; Claude runs the flow itself)

- Data, database and how-it-works fixes: build on main, check (types, tests, the
  database read back), then in a few lines say what changed and what is open, and ask
  once to push and run.
- UI: build, render, check against notes/review-checklist.md, show phone screenshots
  first. Her "ok" accepts it; it goes live with the next push.
- Every rule she sets goes into this file or the notes at once, and goes out with the
  next push, so a new chat has it.
- Tell her when to start a new chat: right after a push with notes/handoff.md up to
  date, once the chat has run long (many screenshots or big files read) or a large piece
  of work is finished. Long chats are where mistakes creep in.

## What needs Roxanne's yes

- Pushing, and writing to the database. Before either, walk her through what changed
  and why, list the items still open, and wait for a clear yes to that exact action.
- Approved changes are kept here and pushed together once enough has gathered, not
  after every change.
- When she says to push, everything she accepted goes live: main, with every accepted
  design branch merged into it (24 Nov).
- Her "ok" or "looks good" on a design accepts it: it is merged into main and goes live
  with the next push, without asking about it again. Never split a push by branch and
  leave accepted work behind (24 Nov).

## How the work is done

- Each piece of design work gets its own branch, named for what it is (for example
  design/calendar-controls), made from main when the work starts. It is merged into main
  when Roxanne accepts it and then deleted, so a branch always shows what is still being
  worked on and main what is done. No long-lived draft branch (24 Nov).
- Only UI and design work goes on a design branch. Fixes to data, the database and
  how things work are done on main and pushed straight to main, still after walking
  her through them and her yes (24 Nov).
- Every working rule she sets goes into this file, or into the notes it lists, as soon
  as it is said, in the same chat, so the next chat starts with it (24 Nov). Rules of the
  site itself go to notes/design-decisions.md.
- Design work happens on its design branch. Her approved files stay untouched until she
  says yes.
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
- Build only what was discussed. Anything else, including undoing a change of your own,
  is shown to Roxanne (screenshots) before it is made, never after (24 Nov).
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
