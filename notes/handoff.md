# Handover: where the work stands

Do CLAUDE.md's setup first. Rewritten 27 Nov, night. Keep this file short and current: what
is live, what is next, what is open. What was done goes to notes/history.md, not here.

## Why we are redesigning

The site was first built squeezed into narrow widths, and poor decisions were made for lack
of room. On 26 Nov Roxanne set the common screen, 1920 x 1080, as the resolution we design
for, then the site is made to look the same on every screen ("take back all the poor
decisions we made because we didn't have enough width"; design-decisions.md, "Redesign for
the common screen"). We go through the site screen by screen with her, phone first, and fix
each one for that resolution. That is the list below. It must not be forgotten.

## How to work (her words, 27 Nov night)

"Your job is to be a better chat and be thorough, professional and systematic." The last two
chats applied her rules only on the page she was looking at; she found the gaps herself.
- A rule for panels holds for every event. Build it once in the shared code and data, never
  in one event's branch, and check it on every event: `python3 tools/render/panels.py /tmp/rb
  OUT` renders every event's every tab and writes every timeline row to OUT/panels.txt. Go
  through all of it before showing her anything.
- "Every event" in her words means every event: state events (SvS, Sunfire, Tyrant, TAL),
  alliance events and personal events alike.
- Don't say something is done or live unless it is on main and the build is green.

## Branches

- main (live): this morning's site plus the calendar's Filters/UTC fix and the zoom fix.
- wip-27-nov (not live): all the 27 Nov evening and night work. She wants it checked before it
  goes live ("i don't trust"). It goes into main only with her yes; then check it with her on
  her two monitors (Claude in Chrome sees the live site in her real Chrome).

## Now: the panel audit (27 Nov, night)

She found agreed rules missing from some panels. Found by rendering every panel:
1. Results (fixing now): one rule for every event with results, from the event's own entry in
   event-types.json; no Results tab until the run has results; the trophy Results button in
   the head for whoever may add them, once there is something to record. Was coded only for
   alliance events: SvS and Sunfire showed a Results tab with only the Records link and no
   button; TAL and Tyrant opened straight into a form with Save; Showdown's Total score
   showed an empty 0-0; Foundry and Canyon showed the button from Voting day.
2. Rewards and shops saved as text, so they skip the reward standard and the Merchant tab:
   Hero's Mission and Vision of Dawn rewards, Wander Theater's Bizarre Bazaar. The Emporium of
   Enigma shop shows nowhere from Frosty Fortune; Crazy Joe's rewards are saved but not shown.
3. Shops (her answer, 27 Nov night, design-decisions.md "Shops"): the Merchant tab becomes Shop,
   each offer a card drawn like the game's shop cards in the event's colours. Mockup in progress.
4. Timelines on wip-27-nov: checked row by row, no rewards or mail row anywhere, no time
   written twice.

## Next

1. Finish the audit fixes above, show her the screens (phone first, full screens).
2. The rewards pass (notes/rewards-requests.md 32): every event's Rewards and Merchant tabs
   follow her rules. Found and not fixed yet:
   - King of Icefield's Stage 1-7 and Ranking tabs, and Winter Siege's six tier tabs, are too
     long for a phone line (fitRewardLabels writes them very small). Needs a design: say so, ask.
   - Dreamscape's "Chapter 1"... and Showdown's "Loss or draw" labels go onto two lines.
   - Showdown's Victory Points horn has no tile.
   - Treasure Hunt Drill and Emporium of Enigma not checked.
   - Pictures to come from her: Custom Mythic Hero Gear Chest, Storm of Destruction.
3. The redesign list, screen by screen. For every event panel, ask whether its fold arrows
   stay (removed on Alliance Championship).
   1-4. Month view with the day card; Alliance Championship Timeline, Rules, Rewards: done.
   5. SvS panel. <- next
   6. SvS, Results tab.
   7. Foundry Battle panel.
   8. Filters.
   9. The account menu.
   10. Week view.
   11. Year view.
   12-19. The other pages (Fortress season and rewards, Invites, New group, the State page, My
       alliance pages, the player profile, Submissions, Transfers), one at a time.

## Questions still open (one at a time, never dropped)

- Fishing's ranks with 7 rewards: how should the 7 sit? (built as 3 + 4, not confirmed)
- How many days old is 1458? (the Champion Shop's amounts depend on it; saved: over 448 days)
- Alliance Championship Ultimate rank 2: is the 25.6K orange tile the Championship Badge, and
  should ranks 2-3 be 25,600 (the site has 19,000)? (her mail screenshot: screenshots branch)
- How should "ROUND 1 - GOLD & SILVER" fit on one line on the phone (TAL timeline)?
- The Harvest Festival concierge mockup waits for her feedback and her rewards/packs screenshots.
- Older open items: notes/history.md "Still open" and "Open", and design-decisions.md "Open".

## Waiting for their design (do not build without her)

- Adding results in place for Foundry, Canyon, Showdown, Winter Siege, TAL and Tyrant (their
  Results button opens the old forms meanwhile). Foundry's results element is also TAL's.
- The admin menu, where event dates and repeats will be changed.
- Submissions page design and its GIFs (remind her).
- The event tier's tiny edit picker, the tier saved per run.

## Renders

tools/render/README.md. Phone 384 x 832 at 2.8125, her laptop 1536 x 864 at 1.25, her monitor
2560 x 1440 at 1. Whole panels: tools/render/panels.py.
