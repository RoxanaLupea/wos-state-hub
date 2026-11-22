# What this is

The site for Whiteout Survival state 1458 and its alliances. Written from the
decisions made over the design sessions, so none of it has to be said twice.

## Purpose

- One place for everything the state plans together: when events happen, who is
  registered, which alliance holds which fort, who is transferring in.
- It replaces the Google Sheet and Apps Script calendar, and the three registration
  forms (Frostdragon Tyrant, State of Power, SvS availability). Their fields and
  their checks carry over.
- Part of the site is open to anyone. The rest is for confirmed 1458 players.

## Scale

- One state, 1458. Five alliances, each with an academy, until FUN left the state in
  the transfer that started on 9 Nov 2026.
- Under 500 people in total, at most about 50 at the same time.

## Where it runs

- A public site on GitHub Pages, in the repo wos-state-hub. The name carries no state
  number, because states change.
- Supabase holds the data and handles sign-in. Chosen over Firestore because the
  player database is where this is heading.
- The free tier is enough, including its 7-day idle pause, because the site is opened
  daily. Everything stays at no cost.
- A domain of its own comes later, once it is all built and working.

## Signing in

- Discord and Google. Discord first, because every alliance already uses it.
- Guests keep browsing without signing in. The sign-in page offers the account, a
  sign-in button and "Continue as a guest", under a fixed title.
- Rejected: an email code (the user's mail blocks the sender), and a name with a
  password and recovery codes (players will not keep codes, and admins would spend
  their time resetting them).

## Who may do what

- The owner sets event dates and repeat intervals.
- Admins do everything else.
- Alliance manager is the role of an alliance's R4s and R5s, given for that one
  alliance; R4 and R5 can do the same things. They set their own alliance's times for
  the events where the alliance picks the time (Bear, Foundry, Canyon, Crazy Joe and
  Mercenary bosses), and record their alliance's results. A result played by an
  alliance used as the state alliance is a state result, entered by admins.
- State managers do the state's planning, except battles: the forts and the rest.
- Battle managers plan the battles. They are a separate group of people.

## Identity and player data

- The login is the record. There is no separate player registry.
- Each person enters their own in-game id and name, and marks their farms and alts.
- The id is unique across accounts. Someone whose id is already taken raises it with
  an admin; the site does not judge the claim.
- Every event list shows the in-game name, never the login one.
- A player's own data holds troop tiers and heroes. Not ratios, which belong to
  planning, and not furnace.
- Availability is a start and an end hour in UTC, or a tick for unavailable. Never a
  zero.
- Player lists sort by when someone answered, by troop tier, or by availability.
  Sorting by availability groups by interval, strongest troops first inside each.

## How the code is organised

- Many small files, one per page or feature, rather than one long one.
- Event types are built as objects: a base type with derived ones for events that
  behave alike, so a fix lands on all of them instead of one.
- TypeScript.
- The work is done bit by bit, fixing what needs fixing as it goes, rather than in
  one jump.
- The build on GitHub uses TypeScript 5 with the "ES2022" and "DOM" libraries. Newer
  TypeScript (the one in Claude's workspace) accepts code that TypeScript 5 rejects,
  such as a for-of loop over a NodeList, so a clean check in the workspace does not
  prove the build passes. Loop over Array.from(...) instead of a NodeList, and check
  the GitHub build after every push.

## Still ahead

- Notifications, and sending events to a personal calendar.
- Translations: Chinese and Japanese first, maybe Spanish. The PO workflow, the font
  and a CJK companion face.
- An SvS planning page: the plan is built on two alliances, one holding the castle
  and one doing counter rallies, covering the pet schedule, the heroes setting the
  rallies, rally ratios and joiners.
- A hero planner, which is its own project.
