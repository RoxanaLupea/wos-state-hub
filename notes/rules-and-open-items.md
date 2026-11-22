# Game rules and open items

Working notes so nothing from the design sessions gets lost between sessions.
The structure these feed into is in supabase/schema.sql.

## Game rules confirmed in game

### Bear Hunt
- Cooldown between traps is 47.5 hours.
- Only R4 and above can set a trap.
- The two traps' time slots must not overlap.
- Rewards are issued after both traps expire.
- Personal damage rewards go only to members in the alliance at the tally. Leaving
  resets points even if the person rejoins.
- Achievements count across both traps.
- You must stay in the alliance until the tally, which is immediately after the hunt.

### Star Ratings
- Alliance Showdown and Alliance Championship each have their own rating; one does not
  change the other.
- Showdown's rewards differ by Star Rating band (1–2, 3–5, 6–9, 10+).
- Alliance Championship has Tiers: Iron, Bronze, Silver, Gold, Diamond, Ultimate. All
  alliances start in Iron and move up by earning Stars; an alliance can drop a tier
  only from Diamond or Ultimate. Rewards depend on the tier.
- Stars per final group rank, by tier:

  | Rank | Iron | Bronze | Silver | Gold | Diamond | Ultimate |
  |------|------|--------|--------|------|---------|----------|
  | 1    | +4   | +4     | +3     | +3   | +3      | +2       |
  | 2–3  | +3   | +3     | +2     | +2   | +2      | +1       |
  | 4–5  | +2   | +2     | +1     | +1   | +1      | −1       |
  | 6    | +1   | +1     | +1     | +1   | −1      | −2       |

### Tundra Arms League match mail
- Every TAL match sends a mail laid out like the Foundry battle mail: victory or
  defeat, both sides' state, alliance and Arsenal Points, the rewards, the Legion
  Tally (Imperial Foundry Control Duration; Control, Gathering, Loot and KO Rewards
  with their MVPs; Sieges by Mercenaries) and Personal Arsenal Points.
- Personal Arsenal Points lists every registered member of the legion, 0 included.

### Sunfire Castle and Castle Battle
- SvS Battle is won through Castle Battle.
- Invaders, alliances from another state marked "(Invader)", only take part in the SvS
  Castle Battle. Sunfire is fought inside the state.
- In Sunfire the president is agreed in advance; the state plays it for the points.
- A state starts with a Sunfire battle every 2 weeks. After 2 to 3 months SvS starts,
  and from then every other castle record is an SvS Castle Battle. A drawn SvS shows
  a numbered President, so the first SvS can come before the first Supreme President.
  In 1458 the first SvS was 12 Oct 2024 (DVL's Glory Path), four weeks before the
  first Supreme President.
- Each alliance's Glory Path (Alliance Info) lists every Cross-State Castle Battle in
  which it took final control of the castle, with the enemy state and the date.
  Holding our own castle counts, so a drawn SvS missing from every alliance's Glory
  Path means we won Preparation and lost the Castle Battle at the opponent's castle.
- An SvS record in the Hall of Fame tells the result. A Supreme President from our
  state: we won both Preparation and Battle. A Supreme President marked Invader: we
  lost both. A numbered President: we lost one of them. If we lost Preparation, we
  won the fight for our own castle; if we won Preparation, we lost the battle for the
  opponent's castle.
- The castle keeps an Occupation Ranking (rank, alliance, leader, total occupation)
  and a Hall of Fame (President No. N or Supreme President, name, alliance, state
  for an invader, date in office). After a state merger, Previous Presidents keeps
  each old state's list.

### Fortress Battles
- Season 16 was running on 19 Nov 2026, phase 4 of 8.
- 12 fortresses and 4 strongholds, 8 phases.
- An alliance may take one new fortress and one new stronghold per phase. Keeping a
  fort it already holds costs nothing; only a takeover counts as new. Phase 1 is all
  new, which is why it needs 12 alliances.
- Strongholds never give a buff. Buffs per phase are 3, 3, 3, 2, 0, 3, 3, 3, so phase 5
  needs no lead planning at all.
- Buff items are Troops Health UP II, Troops Damage UP II and Deployment Capacity
  Boost II. A player can hold 2 of each.
- Your own alliance's buffs are granted automatically. To get one from a fort another
  alliance holds you join that alliance inside a window and come back.
- A castle lead takes 2 of a fort's buff, a turret lead 1, from every buff fort.
- Reward types: Participation (Warrior's Chest, to the 15 in the winning rally, and
  only people in the alliance at registration can join those rallies), Alliance (Ally's
  Chest, to every member), Allocatable (Ruler's Chest x40, handed out by the alliance),
  Control (Controller's Chest, to members of the holding alliance), and the fort's own
  reward, which is also allocated.
- Rewards expire 24 hours after the fort enters its protected stage.
- The chain is: battle time, a 1 or 5 minute rally, a march of 2 to 20 minutes, then
  hold for 30 minutes to enter protected. Only then does the 24 hours start.
- NOT CONFIRMED: whether the Ally's and Controller's Chests go out at the protected
  stage.

### Foundry Battle
- Every two weeks. Each alliance registers up to two legions.
- Only Legion 1's result sets the alliance's Foundry Tier and Alliance Rewards.
- Combatants and substitutes both qualify for the Alliance Rewards.
- Alliance Rewards come from the alliance you were in when registration ended.
- NOT CONFIRMED: whether those rewards still arrive if you have left by the time
  Legion 1 finishes. Until tested, the safe advice is to be back before it ends.

### Frostdragon Tyrant
- Starts Monday, repeats every 8 weeks. Sign-up days 1 to 2, combatant dispatch 3 to 4,
  eve of battle 5 to 6, battle day 7, rearmament 8 to 9.
- Being in the alliance when alliance registration closes is what makes someone
  selectable, regardless of the dispatch phase two days later.
- Up to 60 combatants. The state takes 100 into the alliance: 60 joiners and 40 fillers,
  of whom only the 60 are registered.
- Alliances are ranked by overall alliance power within a zone, and only the top
  qualify. The number is not published and varies with how many states are in the zone,
  so it is recorded per run. Default assumed: 100.

### Tundra Arms League
- Starts Saturday, roughly every 112 days, give or take a week, so its date is treated
  as an estimate until an admin confirms it.
- Preview days 1 to 2, voting 3 to 4, sign-up 5 to 7, matchmaking 8, elimination 9 to 16,
  championship 17 to 23. Sign-up closes at the end of day 7.
- Two legions per alliance; the state can register as many legions as it wants.
- 30 joiners and 20 subs per legion.
- Legion power is the sum of the top 20 registered, joiners and subs alike. The score
  comes from the foundry menu and is different from player power.
- The top 64 legions qualify.

### Flame and Fangs
- Intel missions refresh at 00:00, 08:00 and 16:00 UTC.
- The Lighthouse holds Intel from up to two refresh periods, so leaving it full too long
  costs future missions.
- An uncompleted set lasts about 15 hours before it disappears. Completing without
  claiming parks it safely; leaving a set undone is the part on a clock.
- The shop stays open for a countdown after the event ends.

### State transfers
- Ordinary state: 35 in the invitation phase, 20 in the open phase, 55 total. Banks up
  to 3 special invites, 1 restored on the 1st of each month at 00:00 UTC.
- Leading state: 20 and 10, 30 total. No banked specials, but one is granted on the
  third leading transfer in a row and expires with that window.
- Leading is the top 20 percent by the sum of transfer score of a state's top 100 chiefs,
  so it can change between events. Leading states also get a lower power cap.
- The president can send unlimited invitations; only the first 35 who actually transfer
  use up the quota.
- Anyone above the power cap must shed power or hold a special invite.

### Map
- The state is 1200 by 1200 tiles, corners 0,0 and 1199,1199.
- Cities are 2x2. Banners are 1x1 with a 7x7 territory centred on them.
- Territory starts at an alliance's HQs and spreads through its banners.
- A city may sit outside territory. It may not sit on mountains, water or alliance
  buildings.
- A complete facility set is 12: construction and tech at levels 1 and 3, defense and
  weapons at levels 2 and 4, and one each of training, expedition, production and
  gathering. Two of the same type and level do not stack.
- The site has two maps. The state map holds the facilities, fortresses, strongholds,
  the castle, every alliance's HQs and banners, and the alliance territory they build,
  which branches out to the facilities. Cities are placed on it too.
- The alliance map opens once the alliance's HQ is placed on the state map. It is the
  smaller view where the alliance maps its hive: its cities and everything that blocks
  a tile, such as water, mountains and alliance mills.
- A third map is the castle map, about the size of the alliance map. Players from the
  state are assigned to spots on it. The spots change for every SvS, and each one starts
  as a draft copied from the previous SvS. For SvS, terrain is marked in one colour for
  us and another for the enemy. For Sunfire it is probably split in 4 instead. The user
  will show examples before it is built.
- Event maps, very different from the three above: one each for Winter Siege, Foundry
  Battle and Canyon Clash, and probably one for Wild Brawl.

## Troop score

Used to sort registration lists. One point per tier starting at FC5, so FC5 is 1 and
FC10 is 6. Helios adds 1, Exalted adds 1 more, and each skill level adds 1.
Highest is 11 per troop type and 33 in total. Exalted is only possible on FC10.

## Changes to make in the catalog files

- data/catalog/items.json needs a kind, marking troops-health-up-2, troops-damage-up-2
  and deployment-capacity-boost-2 as buffs.
- data/catalog/event-types.json should drop resultType from fortress-battles.
- seed/schedules.json needs the estimated flag on the hellfire schedule.
- seed/fort-holders.json keys on a season start date and only covers phase 2. It moves
  to season 16 with phases.
- The facilities and their coordinates can be seeded from the 1060 transfer workbook.
- data/catalog/fort-locations.json holds the 1458 fortress and stronghold coordinates
  (from the game, season 16). They are for the map only, not the Fortress page.

## Still to design

- The look of every page: Fortress, State and alliances, the calendar port, the map.
- Roles: member, R4, battle planner, alliance manager, admin, owner, and what each may
  do, in one place rather than scattered across tables.
- Sign-in with Discord and Google.
- Notifications.
- Translations: the PO workflow, the font, and a CJK companion face.
- Accent colours for three of the five alliances.
- The hero planner, which is its own project.

## Facts still needed from the game

- Alliance Showdown Star Rating: a guide (whiteoutsurvival.wiki) says the winning
  alliance gains a star and the losing alliance loses one. Not checked in game.
- Alliance Championship: how many Stars move an alliance up a tier.
- Winter Siege tiers (Rookie, Stalwart, Pioneer, Exalted, Mythic, Legendary): a run
  gives tier points, +1 for a loss, +2 for a victory, +4 for a win streak. Still
  unknown: how many points each tier needs, and whether an alliance can drop a tier.
  Guides do not give it (searched 20 Nov 2026).

- King of Icefield targets, at the highest level. All seven stages are in the
  catalog, from the outof.games guide (Nov 2024), which matches the game in Nov 2026.
  The resources in the third and fourth targets were replaced around the start of
  Nov 2026, so on Stages 1 to 6 the Strength in Unity, the Shot Token and the
  resource chests are worked out from Stage 7 and still to check against the game.

- Strength in Unity: a new item, added around the start of Nov 2026, given by
  whichever weekly event is running (seen in King of Icefield, Alliance Showdown and
  SvS preparation; Alliance Mobilization possibly next).

- How long before bear and foundry someone must be in the alliance, and when they can
  leave, as catalog values.
- The tyrant qualification bar, recorded after the next run.
- Whether foundry alliance rewards survive leaving before Legion 1 ends.
- What coordinates the game gives when you tap something on the map.

## Pictures to add

Item pictures the owner still has to get, for public/images/items/ (lowercase names).

- speedup-healing.png: Healing Speedup (SvS Grants, Tyrant Commendation chests).
- commendation-gold.png, commendation-blue.png, commendation-brown.png: the three
  Commendation chests. SvS calls them General's, Officer's and Soldier's; Tyrant calls
  them Marshal's, General's and Warrior's. Same pictures.
- The grey chief gear chest with a "?" (Recall Road, Tyrant Exclusive Pack). Name not
  confirmed.
- The plain purple puzzle piece (Alliance Mobilization). Name not confirmed.
- ninja-meow.png: Ninja Meow march skin (Recall Road level 25).
- The Recall Road level 15 nameplate. Name not known.
- frost-dragon.png: Frost Dragon march skin (Tyrant).
- dragonis-dominion.png: Dragonis Dominion chief profile skin (Tyrant).
- dragon-pagoda.png: Dragon Pagoda Lv. 1 (Tyrant).
- serpent-sanctuary.png: Serpent Sanctuary Lv. 1 (Tyrant).
- triumph-of-tyrant.png: Triumph of Tyrant, the gold trophy (Tyrant rank 1).
- The silver trophy (Tyrant ranks 2 and 3) and the bronze trophy (ranks 4 to 10). Names
  not known.
