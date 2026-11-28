# Working on State Hub

Read this first in every chat. Roxanne should never have to explain the setup again.

## Setup, before any other work

1. Attach the repo with add_repo: owner RoxanaLupea, repo wos-state-hub, access "push". If
   it is refused, ask her in one line to confirm push access, then ask again.
2. Clone it to /home/claude/wos-state-hub, then call register_repo_root with that folder.
   If notes/handoff.md on main names a work branch that is not live yet, check it out
   and work there (27 Nov: wip-27-nov).
3. Last build: `gh run list -R RoxanaLupea/wos-state-hub -L 1`.
4. Database: Supabase project "wos-state-hub", id tnfghlayeguyheoyrakq. Calls to outside
   websites go through the database's admin_tools.http (supabase/admin-tools.sql); the
   Whiteout Stats API key is never written into the repo.
5. Rendering: tools/render/README.md. npm cannot install here; the real build runs on
   GitHub after a push. Fetch the database copy with tools/render/fetch-data.sql into
   tools/render/data/main.json (never commit it), run `bash tools/render/rebuild.sh /tmp/rb`,
   then use tools/render/page.py (open_site, click) with
   RENDER_USER_ID=1096141f-8fab-4476-9b28-f707e86731da to see the site as she does. Phone
   first: 384 x 832 at scale 2.8125; her laptop 1536 x 864 at 1.25, her monitor 2560 x 1440
   at 1. Her PC and Chrome are usually open: Claude in Chrome for game guides, the web and the
   live site on her two monitors.

Then read notes/handoff.md (why we are redesigning, where the work stands, what is next, the
questions still open; notes/history.md is only the record of past sessions),
notes/rewards-requests.md (her rewards requests in her words), notes/what-this-is.md and the
notes for the part being worked on: notes/design-decisions.md (her decisions),
notes/page-style.md and notes/visual-language.md (the site's look),
notes/rules-and-open-items.md (game rules).

## How to work with Roxanne

- Before working on any event, read everything already known about it: its section in
  notes/rules-and-open-items.md, its file in data/captures/, its entries in
  notes/design-decisions.md and its schedule. What she confirmed is never searched for again
  or presented as new (27 Nov night: "i already sent you 2 intel events in a row and already
  confirmed that the shop stays for another day, do we even remember those confirmations? cause
  we're doing them to confirm our patterns").

- Claude keeps track of what she sees in game (27 Nov night: "you're the one responsible of keeping
  track of what i see in game and we base the info in the site on that"): every fact from her
  screenshots is written down at once with its source (her screenshot, the date), in the event's
  section of notes/rules-and-open-items.md or its data/captures file, and the screenshot is kept.

- When she says "me" about who may do something, she means admins. She says "owner" when
  she wants something locked that tight (25 Nov).

- Use her Chrome (Claude in Chrome) to look things up and to see pictures on the web yourself:
  guides, in-game screenshots on guide sites. Never ask her to fetch what the browser can reach
  (27 Nov night: "Use the chrome from my pc ffs, why do you have it if not to use it so I don't
  have to do that myself?"). Pictures from a site are guide material, not her confirmation.
- Talk to her while working: say what you are about to do before doing it, and never work
  silently for minutes (27 Nov: "you're not talking to me ... i have no idea what you're doing").
- When she asks for a standard to be applied, apply it to every case it covers, check every
  case against her words before showing anything, and show her the screens (27 Nov: she had to
  ask three times for the rewards).
- Do what she asks, exactly. When she asks to look, answer or discuss, do that and build
  nothing. Add nothing she did not ask for.
- Her words win over everything: over the notes, over an example she sends, over your own
  habits. If something she said seems wrong, say so in one or two sentences and ask.
- When she sends an example, follow it closely. What she liked in it is the point.
- Never reinterpret a clear instruction silently. A rule set while working on a design is
  a working rule: when a better design needs something else, think, say so and bring the
  better design (25 Nov). Don't just agree.
- Small or large (Roxanne, 27 Nov night: "when it's 1/2 pages just show me, i am losing it when
  you build entire features without consulting me"): a change to one or two pages is made and
  shown, never asked about first; a whole feature (a new tab, a new element, new data shown) is
  discussed with her before anything is built.
- When she calls a solution bad, it is reverted at once, all of it, back to what was there before
  (27 Nov night: "once i said a solution is bad we revert it, ok? like the bs white around the
  core"). Then ask how she wants it.
- When she points out a problem ("too narrow", "looks wrong"), ask how she wants it fixed
  before building anything; never pick a fix and build it on your own (26 Nov).
  A simple fault with one obvious fix (something shown twice, a stray row) is just fixed,
  not asked about: "This is a simple fix. So you shouldn't be asking for simple fixes like
  this. Something is doubled, it has to not be doubled" (27 Nov).
- When we brainstorm, she sees the ideas rendered before she decides: render each option that is
  on the table and show them, never only describe them and ask which to build (27 Nov night: "When
  we're brainstorming, shouldn't I see what you're doing? Or like what we can do before I can
  decide? I thought we established this a long time ago.").
- When she asks how something should work or where it should go, ask how she wants it before
  mocking or proposing anything: she usually has the idea already (27 Nov). Send screenshots as
  soon as they exist, never hold them back.
- One question at a time, and only when it is truly open.
- What she asked for is decided. Never list it as open or waiting for her ok, and never ask
  her a question her own words already answer (26 Nov).
- Never change saved data from your own reading of a screenshot or a theory: say what you
  think it shows and wait for her to confirm before changing anything (25 Nov).

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
   The computer versions (laptop 1536 x 864 at 1.25, monitor 2560 x 1440 at 1) are never skipped: a
   design is not settled, and building is not proposed, until she has seen it on the computer too
   (28 Nov: "You will never ever just ignore the PC versions").
   For how pages look on real screens (laptop 1920 x 1080 at 125%, monitor 2560 x 1440 at
   100%), ask her for screenshots from her two monitors and judge from those, not from
   renders (26 Nov: "I don't trust"). Check with players who have no game data yet, as the
   live lists have.
   The goal is a site that looks the same on every screen, not one made for her devices:
   her two monitors and her phone only show her the gaps (26 Nov). Spacing and sizes are
   set so their proportions hold on every screen size.
5. Design with quick mockups first (25 Nov): less building, more thinking, faster
   delivery. Build it properly in the code only once she lands on an idea.

Spacing shows what belongs together (Roxanne, 25 Nov): things that are connected sit
close (a choice and the Cancel and Save under it, a part and its own sub-part); only
separate sections get the larger gaps. Never the same distance above and below
everything.

Panels follow the same rules, set once and inherited (notes/page-style.md, "Event
panels"): we design using them, and an exception changes only what makes it one
(Roxanne, 25 Nov).
A rule for panels is built once in the shared code and data (event-panel.ts, the event's entry
in data/catalog/event-types.json), never in one event's branch, and checked on every event
before she sees anything: `python3 tools/render/panels.py /tmp/rb OUT` renders every event's
every tab and writes every timeline row to OUT/panels.txt. "Every event" means state, alliance
and personal events alike (27 Nov: "it's not applied for svs so clearly you didn't cover all
event panels ... be thorough, professional and systematic").

Never change something she approved as a side effect of other work, on any page, without
asking her first (Roxanne, 26 Nov: "why go change something I approved without me even
knowing about it, never allowed, never"). A fix meant for one page stays on that page; if it
would touch an approved element anywhere else, say so and ask before doing it.

Each page is designed on its own, but never varies from the elements the site already
has (Roxanne, 25 Nov). The same element is never drawn in different ways; sizes may adapt
to where it sits. A new element is fine, but say it is new. Before showing anything,
render every page before and after the change and compare them: nothing outside the
change may move. She must be able to count on the work without inspecting it closely.

Sizes are standard (one-line and two-line bars, and so on). When a change moves an element
to another standard size or type (a one-line bar becoming a two-line bar), say so plainly
when showing it; she must never be the one to catch it (Roxanne, 27 Nov).

Every box whose content can be taller than it scrolls, phone and computer, with no
scrollbar drawn anywhere; a fade at its bottom says it scrolls, the standard for the whole
site (main.ts FADING_BOXES); items never touch (Roxanne, 27 Nov: "Make sure you double check
that from now on"). Run tools/render/scroll-audit.py after every change
(notes/review-checklist.md); it shows scrollbars, so drawn ones are caught.

Every picture you crop yourself (a game icon, a building, a reward cut from her screenshots) goes on
notes/crops.md in the same chat, with where it is and the screenshot it came from; she checks each one
herself (Roxanne, 28 Nov night: "From now on, everything you crop yourself, I need to double check myself...
just keep track so you can tell me which ones they are"). When showing a page that uses one, say which.

## What needs her yes

- Pushing and writing to the database: say in a few lines what changed and what is still
  open, then wait for a clear yes to that exact action.
- A "yes, but…" that adds something new is a yes only to what was shown: build the new
  part, show it, and ask again before pushing (25 Nov).
- Game information she gives (screenshots, numbers) goes into the database right away,
  with her as the source that confirms it: updated_by her account and a "source" detail
  (25 Nov). Data from other sites (WoS Oracle) says so in its source.
- Every game screenshot she sends is kept as a file on the branch "screenshots" (no code on
  it), in a folder per event, named by date and what it shows (27 Nov: "keep them on a branch
  in the future, per event, we'll probably have to look back at things"). Work on it in a
  worktree: `git worktree add /home/claude/wos-screenshots screenshots` after fetching it
  (`git fetch --depth=1 origin screenshots:screenshots`).
- Her "ok" on a design accepts it; it goes live with the next push. When she says push,
  everything she accepted goes live together.
- Whatever she accepts is committed right away, so the work is always on a branch (27 Nov:
  "when i accept something then you make the commit"). Pushing still waits for her yes.
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
