# The old Apps Script app

The calendar as it ran on Google Apps Script, before the move to this site. Kept for
reference only. Nothing here runs, is built or is deployed from this repo.

It is here because a lot was decided and tested in it that has not been carried
across yet — event notes and requirements, point lists, the wording on the pages, and
how each event was presented. When something is missing from the new site, this is
where to look before it gets discussed again.

## The files

- Code.gs — the server side: reading and writing the sheet, sessions, settings.
- Setup.gs — the catalog as it was built into the sheet: events, phases, rewards,
  items, point sources.
- Index.html — the page's markup and styles.
- IndexJS.html — the browser side: the calendar, the panels, the editing.
- SignIn.gs — the separate sign-in project, which read a Google account and sent the
  person back with a signed note.

## What was taken out

SignIn.gs held the deployment link and the secret the two projects shared. Both are
replaced with "PASTE … HERE" so this folder can sit in a public repo. The old secret
should be treated as exposed and the old deployment removed.
