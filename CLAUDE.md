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
5. Rendering: follow tools/render/README.md. npm packages cannot be installed here, so
   the real build only runs on GitHub after a push.

Then read, in full: notes/what-this-is.md, notes/design-decisions.md,
notes/visual-language.md and notes/rules-and-open-items.md. On a draft branch, also
read the notes file it names (for profile-draft: notes/profile-draft.md).

## What needs Roxanne's yes

- Pushing, and writing to the database. Before either, walk her through what changed
  and why, list the items still open, and wait for a clear yes to that exact action.
- Approved changes are kept here and pushed together once enough has gathered, not
  after every change.

## How the work is done

- Design work happens on a draft in this workspace. Her approved files stay untouched
  until she says yes.
- Show the real page: render it with the real data and send full-screen screenshots,
  never crops. Check every screenshot critically before sending it, so she never has to
  point out the faults.
- Nothing counts as settled until she says so. Settled decisions go into
  notes/design-decisions.md first and into the code second.
- A commit message is one short sentence, with no body.
- After every push, check the GitHub build. It uses TypeScript 5: loop over
  Array.from(...), never over a NodeList.
- tools/render/data/ holds a copy of the database and is never committed. The repo is
  public.
