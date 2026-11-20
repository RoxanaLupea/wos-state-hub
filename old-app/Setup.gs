/**
 * WOS Events Calendar – State 1458
 * Setup: creates the sheet tabs and fills in the starting data.
 *
 * Run runSetup() from the script editor: once at the start, and once again after each update.
 * Running it again is safe: it only adds what is missing and fixes old starting values
 * that nobody has changed. Everything else (Code.gs) is the app itself.
 */

// The repo folder with the event icons (an admin can change it in Admin → Images).
const DEFAULT_IMAGE_BASE_URL = 'https://raw.githubusercontent.com/RoxanaLupea/form_assets/main/events/';

// Fortress Battles: battle day (Friday) of phase 1 of the season running in November 2026.
const DEFAULT_FORTRESS_SEASON_START = '2026-10-30';

// Hero's Mission note; {eventsHero} becomes the hero of 2 generations back (Xura in Gen 11).
const HEROS_MISSION_NOTE = 'Help {eventsHero} capture the Reapers and the hero joins your city. The hero changes with each generation.';
// Schedule notes for dates seen in game, where the repeat still comes from guides.
const SNOWBUSTERS_NOTE = 'Transfer week. Seen in game 10–12 Nov 2026; every 4 weeks is from guides';
const MERCS_NOTE = 'Seen in game 14–16 Nov 2026; every 4 weeks is from guides';
// The event runs until Monday 24:00 UTC; Monday is when alliances usually summon the bosses, at the time each one sets.
const MERCS_EVENT_NOTE = 'Personal Challenges for 3 days; each alliance sets when it summons the bosses.';
// Winter Siege, from the game's rules (11 Nov 2026).
// Winter Siege, from the game's rules (11 Nov 2026). Requirements under the name; what to do under each phase.
const WINTER_SIEGE_NOTE = '';
const WINTER_SIEGE_ALLIANCE_REQUIREMENT = 'Top 20';
const WINTER_SIEGE_PLAYER_REQUIREMENT = 'Furnace 25';
const WINTER_SIEGE_MATCHMAKING_NOTE = 'Only chiefs in the alliance at this moment can take part.';
const WINTER_SIEGE_PREPARATION_NOTE = 'Your squads are locked at the end.';
const WINTER_SIEGE_BATTLE_NOTE = 'Each squad starts with 3 attacks and regains 1 every 2 hours, up to 10 attacks in total. ' +
  'Every squad in a stronghold has to be defeated before the next connected stronghold can be attacked.';
// Alliance Showdown, from the game's rules (12 Nov 2026). Matchmaking is on the Sunday before the event, at 23:00 UTC.
const SHOWDOWN_ALLIANCE_REQUIREMENT = 'Top 20';
const SHOWDOWN_MATCHMAKING_NOTE = 'Only chiefs in the alliance at this moment can take part.';

/* ------------------------------------------------------------------ */
/* Setup (run once from the editor)                                    */
/* ------------------------------------------------------------------ */

function runSetup() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  PropertiesService.getScriptProperties().setProperty('spreadsheetId', spreadsheet.getId());

  Object.keys(TABLES).forEach(function (tableName) {
    getSheet_(tableName);
  });

  const ownerEmail = normalizeEmail_(Session.getEffectiveUser().getEmail());
  const today = todayText_();

  if (readTable_('Settings').length === 0) {
    appendRows_('Settings', [
      { key: 'stateNumber', value: String(STATE_NUMBER) },
      { key: 'ownerEmail', value: ownerEmail },
      { key: 'transferFollows', value: 'svs' },
      { key: 'imageBaseUrl', value: DEFAULT_IMAGE_BASE_URL }
    ]);
  }
  // Older sheets: fill in the image folder and the Fortress season if they were never set.
  if (!readSettings_().imageBaseUrl) upsertRow_('Settings', 'key', { key: 'imageBaseUrl', value: DEFAULT_IMAGE_BASE_URL });
  if (!readSettings_().fortressSeasonStart) upsertRow_('Settings', 'key', { key: 'fortressSeasonStart', value: DEFAULT_FORTRESS_SEASON_START });
  // An empty row for the sign-in app's link, so the owner can paste it straight into the Settings tab.
  if (!readTable_('Settings').some(function (row) { return row.key === 'signInUrl'; })) appendRows_('Settings', [{ key: 'signInUrl', value: '' }]);
  if (readTable_('Admins').length === 0) {
    appendRows_('Admins', [{ email: ownerEmail, addedBy: ownerEmail, addedOn: today }]);
  }
  // Starting rows are only added when their id is not in the sheet yet, so running setup again is safe.
  appendMissingRows_('EventTypes', STARTING_EVENT_TYPES);
  appendMissingRows_('Schedules', STARTING_SCHEDULES);
  // Columns added by newer versions are filled in for the starting rows, only where the cell is still empty.
  fillEmptyStartingValues_('EventTypes', STARTING_EVENT_TYPES, ['imageFile', 'partOf', 'groupName', 'groupCount', 'opponentCount', 'opponentHasAlliance', 'resultType', 'hasPresident', 'slotTimes', 'colorEnd', 'typeLabel', 'otherName', 'timelineColor', 'barSubtitle', 'pointsTitle', 'allianceRequirement', 'playerRequirement', 'openWindows', 'windowMark']);
  fillEmptyStartingValues_('Schedules', STARTING_SCHEDULES, ['groupNumber', 'sinceDate', 'shiftWithMoves']);
  applyStartingFixes_();
  moveOldCategories_();
  removeRetiredStartingRows_();
  // The state's alliances, only on a sheet that has none yet.
  if (readTable_('Alliances').length === 0) appendRows_('Alliances', STARTING_ALLIANCES);
  addMissingAllianceDefaults_();
  // Steps written by an older version that have changed since (only rows nobody edited).
  updateStartingSteps_();
  removeRetiredStartingSteps_();
  removeRetiredTimedSteps_();
  removeRetiredStartingPhases_();
  // New starting steps are always added at the end of the list, so their ids stay the same.
  // Retired steps keep their place in the list (so the ids after them do not change) but are not added.
  appendMissingRows_('EventSteps', STARTING_EVENT_STEPS.map(function (step, index) {
    return {
      id: 'st' + (index + 1),
      eventTypeId: step[0],
      dayNumber: String(step[1]),
      startTimeUtc: step[2],
      endTimeUtc: step[3],
      label: step[4],
      sortOrder: String(index + 1),
      note: step[5] || '',
      barMark: step[6] ? 'yes' : ''
    };
  }).filter(function (step) { return RETIRED_STEP_IDS.indexOf(step.id) === -1 && RETIRED_TIMED_STEP_IDS.indexOf(step.id) === -1; }));
  // Phases: added once each (same rule as the steps: new ones go at the end, ids stay the same).
  // Phases: [event, from day, to day, name, no bar of its own, start time, end time, note].
  appendMissingRows_('EventPhases', STARTING_EVENT_PHASES.map(function (phase, index) {
    return { id: 'ph' + (index + 1), eventTypeId: phase[0], fromDay: String(phase[1]), toDay: String(phase[2]), name: phase[3], hideBar: phase[4] ? 'yes' : '',
      sortOrder: String(index + 1), startTimeUtc: phase[5] || '', endTimeUtc: phase[6] || '', note: phase[7] || '' };
  }).filter(function (phase) { return RETIRED_PHASE_IDS.indexOf(phase.id) === -1; }));
  if (readTable_('PointSources').length === 0) {
    appendRows_('PointSources', STARTING_POINT_SOURCES.map(function (source, index) {
      return {
        id: 'p' + (index + 1),
        eventTypeId: source[0],
        dayNumber: source[1] ? String(source[1]) : '',
        dayName: source[2],
        task: source[3],
        points: source[4],
        sortOrder: String(index + 1)
      };
    }));
  }
  appendMissingRows_('PointSources', ADDED_POINT_SOURCES);
  appendMissingRows_('PointSources', GAME_LISTS_NOV_11.filter(function (row) { return RETIRED_POINT_SOURCES.indexOf(row.id) === -1; }));
  appendMissingRows_('PointSources', GAME_LISTS_NOV_17);
  // Reward items and the reward lists of Alliance Showdown and Winter Siege (added once each, fixed ids).
  appendMissingRows_('Items', STARTING_ITEMS);
  removeRetiredItems_();
  removeRetiredRewards_();
  replaceRenamedItems_();
  appendMissingRows_('Rewards', startingRewards_());
  markRewardsSeenInGame_();
  if (readTable_('FortRewards').length === 0) {
    const fortRewardRows = [];
    STARTING_FORT_REWARDS.forEach(function (fortRow) {
      fortRow.slice(1).forEach(function (reward, phaseIndex) {
        const amount = fortRewardAmount_(reward);
        fortRewardRows.push({ id: 'fr-' + fortRow[0] + '-' + (phaseIndex + 1), fort: fortRow[0], phase: String(phaseIndex + 1), reward: reward,
          quantity: amount.quantity, tile: amount.tile });
      });
    });
    appendRows_('FortRewards', fortRewardRows);
  }
  fillFortRewardAmounts_();
  addStartingFortHolders_();
  addStartingDateChanges_();
  moveMercenaryAllianceTimes_();
  // The generation the Fortress rewards' hero names are written for (1458 was Gen 11 in November 2026).
  if (!readSettings_().fortRewardsGeneration) upsertRow_('Settings', 'key', { key: 'fortRewardsGeneration', value: '11' });
  removeRetiredPointSources_();
  if (readTable_('TransferGroups').length === 0) {
    appendRows_('TransferGroups', STARTING_TRANSFER_GROUPS.map(function (group, index) {
      return {
        id: 'tg' + (index + 1),
        transferDate: group[0],
        fromState: String(group[1]),
        toState: String(group[2]),
        generation: group[3],
        furnaceCap: String(group[4])
      };
    }));
  }
  return 'Setup done. Owner: ' + ownerEmail;
}

/* ------------------------------------------------------------------ */
/* Updating sheets made by older versions                              */
/* ------------------------------------------------------------------ */

// Alliance Championship (seen in game 17 Nov 2026): what can be done in each part of a round.
const ALLIANCE_CHAMPIONSHIP_REGISTRATION_NOTE = 'Each chief signs up, picks a lane and places troops.';
const ALLIANCE_CHAMPIONSHIP_LANES_NOTE = 'The Leader and R4s can move troops between the 3 lanes or swap single armies in a lane.';
const ALLIANCE_CHAMPIONSHIP_BATTLE_NOTE = 'Lanes cannot be changed during the battle.';

// Corrections to starting data written by older versions. Each one only changes a cell
// that still holds the old starting value, so anything an admin edited is left alone.
const STARTING_FIXES = [
  // Flame and Fangs comes every 2 weeks (seen in game on 2 and 16 Nov 2026).
  ['Schedules', 's-flame', 'repeatEveryDays', '28', '14'],
  // 16 Nov 2026: resource chests of level 1 and 2 share one picture; the secured ones get the shield on top.
  ['Items', 'secured-resource-supply-chest', 'imageFile', 'items/secured-resource-supply-chest.png', 'items/resource-chest-lvl-1-2.png'],
  ['Items', 'custom-secured-resource-chest-2', 'imageFile', 'items/custom-secured-resource-chest.png', 'items/custom-resource-chest-lvl-1-2.png'],
  // 16 Nov 2026: Field Triage fades from SvS Battle's red to teal.
  ['EventTypes', 'svs-triage', 'color', '#5FB8A8', '#E05A5A'],
  ['EventTypes', 'svs-triage', 'colorEnd', '#3E9C9A', '#5FB8A8'],
  ['EventTypes', 'svs-triage', 'timelineColor', '#5FB8A8', '#CF7F86>#5FB8A8'],
  // 17 Nov 2026: Field Triage is mostly teal, with only a hint of SvS Battle's red at its start (from its timeline colour).
  ['EventTypes', 'svs-triage', 'color', '#E05A5A', '#5FB8A8'],
  ['EventTypes', 'svs-triage', 'colorEnd', '#5FB8A8', '#3E9C9A'],
  // 16 Nov 2026: all picture file names are lowercase (GitHub treats upper and lower case as different files).
  ['EventTypes', 'fortress-battles', 'imageFile', 'fortressBattle', 'fortress-battle'],
  ['EventTypes', 'crazy-joe', 'imageFile', 'crazyJoe', 'crazy-joe'],
  ['EventTypes', 'vision-of-dawn', 'imageFile', 'visionOfDawn', 'vision-of-dawn'],
  // 16 Nov 2026: the hero shard pictures (an empty picture gets its file; one someone set stays). All file names are lowercase.
  ['Items', 'fred-shards', 'imageFile', '', 'heroes/fred-shard.png'],
  ['Items', 'blanchette-shards', 'imageFile', '', 'heroes/blanchette-shard.png'],
  ['Items', 'xura-shards', 'imageFile', '', 'heroes/xura-shard.png'],
  ['Items', 'gregory-shards', 'imageFile', '', 'heroes/gregory-shard.png'],
  ['Items', 'eleonora-shards', 'imageFile', '', 'heroes/eleonora-shard.png'],
  ['Items', 'lloyd-shards', 'imageFile', '', 'heroes/lloyd-shard.png'],
  ['Items', 'karol-shards', 'imageFile', '', 'heroes/karol-shard.png'],
  ['Items', 'ligeia-shards', 'imageFile', '', 'heroes/ligeia-shard.png'],
  ['Items', 'lloyd-shards', 'imageFile', 'heroes/Lloyd-shard.png', 'heroes/lloyd-shard.png'],
  ['Items', 'karol-shards', 'imageFile', 'heroes/Karol-shard.png', 'heroes/karol-shard.png'],
  ['Items', 'ligeia-shards', 'imageFile', 'heroes/Ligeia-shard.png', 'heroes/ligeia-shard.png'],
  // 16 Nov 2026: Alliance Showdown's score uses the gold horn only.
  ['Items', 'showdown-win-horn', 'imageFile', 'items/showdown-win-horn.png', 'items/horn-gold.png'],
  // 16 Nov 2026: the game's names (Tundra Arms League, TAL); its rules moved to its Info, Predictions and Rewards tabs.
  ['EventTypes', 'hellfire', 'name', 'Tundra Hellfire', 'Tundra Arms League'],
  ['EventTypes', 'hellfire', 'shortName', 'Hellfire', 'TAL'],
  ['EventTypes', 'hellfire', 'notes', 'Tundra Arms League. Be in the right alliance before sign-up. Each legion picks 3 battle times from 02:00, 07:00, 12:00, 14:00, 19:00 UTC', ''],
  // Flame and Fangs ends with its shop on day 2 at 24:00 UTC (seen in game 16 Nov 2026).
  ['Schedules', 's-flame', 'lengthDays', '3', '2'],
  ['Schedules', 's-flame', 'note', 'Monday of SvS prep, every 4 weeks', 'Monday, every 2 weeks'],
  ['EventTypes', 'svs-battle', 'notes', 'Castle Battle 12:00–17:00 UTC', ''],
  ['EventTypes', 'castle-battle', 'notes', 'An alliance that holds the castle 2.5 hours in a row wins; otherwise the longest total hold wins.', ''],
  ['EventTypes', 'castle-battle', 'detailsOnly', '', 'yes'],
  ['EventTypes', 'hellfire', 'detailsOnly', 'yes', ''],
  ['EventTypes', 'svs-matchmaking', 'imageFile', '', 'svs-prep'],
  ['EventTypes', 'svs-prep', 'imageFile', '', 'svs-prep'],
  ['EventTypes', 'svs-battle', 'imageFile', '', 'svs-prep'],
  ['EventTypes', 'castle-battle', 'imageFile', '', 'castle-battle'],
  ['EventTypes', 'sunfire', 'imageFile', '', 'castle-battle'],
  // November 2026: full event list, new filters and parts.
  ['EventTypes', 'dreamscape', 'name', 'Dreamscape', 'Dreamscape Memory'],
  ['EventTypes', 'mercenaries', 'name', 'Mercenaries', 'Mercenary Prestige'],
  ['EventTypes', 'mercenaries', 'notes', '', 'Personal Challenges and Alliance Challenges'],
  ['EventTypes', 'tyrant', 'name', 'Tyrant', 'Frostdragon Tyrant'],
  ['EventTypes', 'snowbusters', 'category', 'timed', 'minigames'],
  ['EventTypes', 'dreamscape', 'category', 'timed', 'minigames'],
  ['EventTypes', 'mergeventure', 'category', 'personal', 'minigames'],
  ['EventTypes', 'lucky-wheel', 'category', 'personal', 'shops'],
  ['EventTypes', 'frosty-fortune', 'category', 'personal', 'shops'],
  ['EventTypes', 'frosty-fortune', 'notes', 'Includes the Treasure Hunt Drill', ''],
  ['EventTypes', 'emporium-of-enigma', 'category', 'deals', 'shops'],
  ['EventTypes', 'emporium-of-enigma', 'detailsOnly', '', 'yes'],
  ['EventTypes', 'emporium-of-enigma', 'sortOrder', '27', '2'],
  ['EventTypes', 'hall-of-heroes', 'category', 'deals', 'shops'],
  ['EventTypes', 'svs-matchmaking', 'sortOrder', '2', '1'],
  ['EventTypes', 'svs-prep', 'sortOrder', '3', '2'],
  ['EventTypes', 'svs-battle', 'sortOrder', '4', '3'],
  ['EventTypes', 'castle-battle', 'sortOrder', '5', '4'],
  ['Schedules', 's-tyrant', 'firstDate', '2026-10-25', '2026-10-19'],
  ['Schedules', 's-tyrant', 'lengthDays', '1', '9'],
  ['Schedules', 's-tyrant', 'note', 'Every 2 months (8 weeks) for now', 'Every 2 months (8 weeks)'],
  ['Schedules', 's-vault', 'repeatEveryDays', '0', '28'],
  ['Schedules', 's-vault', 'note', 'Monthly; exact cycle not known yet', 'SvS prep week. Every 4 weeks is not confirmed yet'],
  ['Schedules', 's-joe', 'repeatEveryDays', '0', '14'],
  ['Schedules', 's-joe', 'note', 'Window for the alliances\' 2 sessions', 'Tuesday to Thursday of the SvS and KOI weeks; each alliance sets its 2 sessions'],
  ['Schedules', 's-sunfire', 'endTimeUtc', '', '17:00'],
  ['Schedules', 's-showdown', 'note', '', 'Ends Sunday 12:00 UTC'],
  // Foundry and Canyon now cover their whole week (voting, registration, matchmaking, battle).
  ['Schedules', 's-canyon', 'firstDate', '2026-10-31', '2026-10-26'],
  ['Schedules', 's-canyon', 'lengthDays', '1', '6'],
  ['Schedules', 's-foundry', 'firstDate', '2026-11-01', '2026-10-26'],
  ['Schedules', 's-foundry', 'lengthDays', '1', '7'],
  ['Schedules', 's-hellfire', 'repeatEveryDays', '0', '112'],
  ['Schedules', 's-hellfire', 'note', '', 'Every 4 months. Each legion picks 3 battle times from 02:00, 07:00, 12:00, 14:00, 19:00 UTC'],
  // Later in November 2026: player information moved from schedule notes (admin only) to the event notes,
  // the "Leagues & Tyrant" filter removed, SvS in the game's blue and red, Castle Battle shown under SvS Battle.
  ['Schedules', 's-showdown', 'note', 'Ends Sunday 12:00 UTC', ''],
  ['Schedules', 's-joe', 'note', 'Tuesday to Thursday of the SvS and KOI weeks; each alliance sets its 2 sessions', 'Tuesday to Thursday of the SvS and KOI weeks'],
  ['Schedules', 's-hellfire', 'note', 'Every 4 months. Each legion picks 3 battle times from 02:00, 07:00, 12:00, 14:00, 19:00 UTC', 'Every 4 months'],
  ['Schedules', 's-frostfire', 'note', 'Tuesday of the Crazy Joe week. Each chief picks one of the game\'s slots (30 minutes): sign in and use the pencil to save yours.', 'Tuesday of the Crazy Joe week'],
  ['Schedules', 's-flame', 'note', 'Collect cores Monday–Tuesday of SvS prep; day 3 is exchange only', 'Monday of SvS prep, every 4 weeks'],
  ['Schedules', 's-bia', 'note', 'Friday 00:00 to Sunday 00:00 UTC, Sunfire week', 'Sunfire week'],
  ['Schedules', 's-traderoute', 'note', 'With Alliance Showdown. Day 6 loot can be collected until Sunday 04:00 UTC', 'With Alliance Showdown'],
  ['Schedules', 's-mercs', 'note', 'Ends Monday around 18:00 UTC. Mercenaries, Snowbusters, Dreamscape and one more take turns, one per week', 'Mercenaries, Snowbusters, Dreamscape and one more take turns, one per week'],
  ['EventTypes', 'showdown', 'notes', '', 'Ends Sunday 12:00 UTC'],
  ['EventTypes', 'hellfire', 'notes', 'Tundra Arms League', 'Tundra Arms League. Each legion picks 3 battle times from 02:00, 07:00, 12:00, 14:00, 19:00 UTC'],
  ['EventTypes', 'frostfire', 'notes', '', 'Each chief picks one of the game\'s slots (30 minutes). Sign in and tap Mine to save yours.'],
  ['EventTypes', 'flame-and-fang', 'notes', '', 'Collect cores Monday–Tuesday; day 3 is exchange only'],
  ['EventTypes', 'bia', 'notes', 'Kill Event', 'Kill Event. Friday 00:00 to Sunday 00:00 UTC'],
  ['EventTypes', 'mercenaries', 'notes', 'Personal Challenges and Alliance Challenges', 'Personal Challenges and Alliance Challenges. Ends Monday around 18:00 UTC'],
  ['EventTypes', 'crazy-joe', 'notes', '', 'Each alliance runs 2 sessions in this window'],
  ['EventTypes', 'tyrant', 'category', 'phases', 'state'],
  ['EventTypes', 'hellfire', 'category', 'phases', 'state'],
  ['EventTypes', 'tal-schedule-info', 'category', 'phases', 'state'],
  ['EventTypes', 'tal-match-missions', 'category', 'phases', 'state'],
  ['EventTypes', 'frostwind-journey', 'category', 'phases', 'state'],
  ['EventTypes', 'dragonborn-truck', 'category', 'phases', 'state'],
  ['EventTypes', 'tyrant-prediction', 'category', 'phases', 'state'],
  ['EventTypes', 'icefire-league', 'category', 'phases', 'personal'],
  ['EventTypes', 'svs', 'color', '#6F9BE6', '#5C8FE8'],
  ['EventTypes', 'svs-matchmaking', 'color', '#6F9BE6', '#6E87B8'],
  ['EventTypes', 'svs-prep', 'color', '#6F9BE6', '#5C8FE8'],
  ['EventTypes', 'castle-battle', 'color', '#E0B44E', '#9B6AD0'],
  ['EventTypes', 'castle-battle', 'detailsOnly', 'yes', ''],
  ['EventTypes', 'officer-project', 'shortName', 'Officer Project', 'Officer'],
  // November 2026, third round: 5 filters (State, Alliance, Personal, Deals, Transfers); events in the game's Events tab are personal;
  // Trade Route is part of Alliance Showdown; Alliance Championship and Fortress Battles phases; Crazy Joe has 2 set times per alliance.
  ['EventTypes', 'mobilization', 'category', 'state', 'alliance'],
  ['EventTypes', 'showdown', 'category', 'state', 'alliance'],
  ['EventTypes', 'trade-route', 'category', 'state', 'alliance'],
  ['EventTypes', 'trade-route', 'partOf', '', 'showdown'],
  ['EventTypes', 'trade-route', 'sortOrder', '35', '1'],
  ['EventTypes', 'flame-and-fang', 'category', 'state', 'personal'],
  ['EventTypes', 'lucky-wheel', 'category', 'shops', 'personal'],
  ['EventTypes', 'frosty-fortune', 'category', 'shops', 'personal'],
  ['EventTypes', 'treasure-hunt-drill', 'category', 'shops', 'personal'],
  ['EventTypes', 'emporium-of-enigma', 'category', 'shops', 'personal'],
  ['EventTypes', 'trading-station', 'category', 'shops', 'personal'],
  ['EventTypes', 'snowbusters', 'category', 'minigames', 'personal'],
  ['EventTypes', 'dreamscape', 'category', 'minigames', 'personal'],
  ['EventTypes', 'mergeventure', 'category', 'minigames', 'personal'],
  ['EventTypes', 'fishing', 'category', 'minigames', 'personal'],
  ['EventTypes', 'treasure-hunter', 'category', 'minigames', 'personal'],
  ['EventTypes', 'tundra-adventure', 'category', 'minigames', 'personal'],
  ['EventTypes', 'tundra-games', 'category', 'minigames', 'personal'],
  ['EventTypes', 'mia-fortune', 'category', 'minigames', 'deals'],
  ['EventTypes', 'silver-shell', 'category', 'minigames', 'deals'],
  // Foundry and Canyon: the voting and registration days are for each player; the legion battles are alliance times.
  ['EventTypes', 'foundry', 'category', 'battle', 'personal'],
  ['EventTypes', 'canyon', 'category', 'battle', 'personal'],
  ['EventTypes', 'alliance-championship', 'category', 'battle', 'alliance'],
  ['EventTypes', 'alliance-championship', 'resultType', 'winloss', 'rank'],
  ['EventTypes', 'alliance-championship', 'notes', '', 'Registration Monday 00:00 to Tuesday 23:00 UTC. 5 rounds: 11 hours to set lanes, then a 1-hour battle. Lanes cannot be changed once the battle starts.'],
  ['EventTypes', 'fortress-battles', 'category', 'battle', 'alliance'],
  ['EventTypes', 'fortress-battles', 'notes', '', 'Registration until Thursday 24:00 UTC. On Friday each fortress and stronghold has its own battle time; its rewards expire 24 hours after its battle.'],
  ['EventTypes', 'bear', 'category', 'timed', 'alliance'],
  ['EventTypes', 'crazy-joe', 'category', 'timed', 'alliance'],
  ['EventTypes', 'crazy-joe', 'notes', 'Each alliance runs 2 sessions in this window', 'Each alliance sets 2 times: Tuesday and Thursday'],
  ['EventTypes', 'mercenaries', 'category', 'timed', 'personal'],
  ['EventTypes', 'mercenaries', 'notes', 'Personal Challenges and Alliance Challenges. Ends Monday around 18:00 UTC', 'Personal Challenges for 3 days; each alliance sets when it summons the bosses. Ends Monday around 18:00 UTC'],
  ['Schedules', 's-ac', 'lengthDays', '7', '5'],
  ['Schedules', 's-merge', 'repeatEveryDays', '0', '28'],
  ['Schedules', 's-mercs', 'note', 'Mercenaries, Snowbusters, Dreamscape and one more take turns, one per week', ''],
  // November 2026, fourth round: times and names checked against the game's event calendar (5 Nov 2026).
  // Academies are alliances of their own; State Transfer is a state event starting the day after the SvS Battle.
  ['Alliances', 'dvl-academy', 'followsMain', 'yes', ''],
  ['Alliances', 'top-academy', 'followsMain', 'yes', ''],
  ['Alliances', 'sky-academy', 'followsMain', 'yes', ''],
  ['EventTypes', 'transfer', 'category', 'transfer', 'state'],
  ['EventTypes', 'transfer', 'name', 'Transfers', 'State Transfer'],
  ['EventTypes', 'transfer', 'shortName', 'Transfers', 'State Transfer'],
  ['EventTypes', 'frostfire', 'slotTimes', '02:00,06:00,10:00,14:00,18:00,22:00', '02:00,05:00,11:00,14:00,16:00,18:00,21:00'],
  ['EventTypes', 'flame-and-fang', 'name', 'Flame and Fang', 'Flame and Fangs'],
  ['EventTypes', 'flame-and-fang', 'shortName', 'Flame and Fang', 'Flame and Fangs'],
  ['EventTypes', 'defeat-beasts', 'shortName', 'Beasts', 'Defeat nearby beasts'],
  ['EventTypes', 'mia-fortune', 'name', 'Mia\'s Fortune', 'Mia\'s Fortune Hut'],
  ['EventTypes', 'silver-shell', 'name', 'Silver Shell event', 'Silver Shell Shop'],
  ['EventTypes', 'frosty-fortune', 'notes', '', 'Treasure Hunt Drill and Frosty Fortune; the Emporium of Enigma shop stays open one day longer.'],
  ['Schedules', 's-svsprep', 'lengthDays', '5', '6'],
  ['Schedules', 's-svsprep', 'endTimeUtc', '', '10:00'],
  ['Schedules', 's-showdown', 'endTimeUtc', '', '12:00'],
  ['Schedules', 's-traderoute', 'lengthDays', '6', '7'],
  ['Schedules', 's-traderoute', 'endTimeUtc', '', '04:00'],
  ['Schedules', 's-ac', 'endTimeUtc', '', '12:00'],
  ['Schedules', 's-icefire', 'lengthDays', '7', '6'],
  ['Schedules', 's-frosty', 'lengthDays', '7', '8'],
  ['Schedules', 's-armament-plan', 'label', 'Design Plan', ''],
  ['Schedules', 's-officer-stone', 'label', 'Essence Stone', ''],
  ['Schedules', 's-snowbusters', 'note', 'Transfer week. Days not confirmed yet', 'Transfer week (from guides; not seen in game yet)'],
  // Event notes only keep what is not already shown by the phases, times and schedule.
  ['EventTypes', 'foundry', 'notes', '', 'Be in the right alliance before registration ends.'],
  ['EventTypes', 'canyon', 'notes', '', 'Be in the right alliance before registration ends.'],
  ['EventTypes', 'tyrant', 'notes', '', 'Be in the right alliance before sign-up starts.'],
  ['EventTypes', 'hellfire', 'notes', 'Tundra Arms League. Each legion picks 3 battle times from 02:00, 07:00, 12:00, 14:00, 19:00 UTC', 'Tundra Arms League. Be in the right alliance before sign-up. Each legion picks 3 battle times from 02:00, 07:00, 12:00, 14:00, 19:00 UTC'],
  ['EventTypes', 'transfer', 'notes', '', 'No moves during Pre-Transfer.'],
  ['EventTypes', 'alliance-championship', 'notes', 'Registration Monday 00:00 to Tuesday 23:00 UTC. 5 rounds: 11 hours to set lanes, then a 1-hour battle. Lanes cannot be changed once the battle starts.', 'Lanes cannot be changed once a battle starts.'],
  ['EventTypes', 'fortress-battles', 'notes', 'Registration until Thursday 24:00 UTC. On Friday each fortress and stronghold has its own battle time; its rewards expire 24 hours after its battle.', 'The rewards of each fortress and stronghold expire 24 hours after its battle.'],
  ['EventTypes', 'showdown', 'notes', 'Ends Sunday 12:00 UTC', ''],
  ['EventTypes', 'bia', 'notes', 'Kill Event. Friday 00:00 to Sunday 00:00 UTC', 'Kill Event'],
  ['EventTypes', 'flame-and-fang', 'notes', 'Collect cores Monday–Tuesday; day 3 is exchange only', ''],
  ['EventTypes', 'frosty-fortune', 'notes', 'Treasure Hunt Drill and Frosty Fortune; the Emporium of Enigma shop stays open one day longer.', ''],
  // Colours taken from each event's logo (November 2026). colorEnd is filled in from the starting values.
  ['EventTypes', 'hellfire', 'color', '#EE8A5C', '#E0A24A'],
  ['EventTypes', 'koi', 'color', '#4FB8C4', '#EDC650'],
  ['EventTypes', 'koi', 'shortName', 'King of Icefield', 'KOI'],
  ['EventTypes', 'sunfire', 'color', '#EE8A5C', '#E8B85A'],
  ['EventTypes', 'bia', 'color', '#D46A6A', '#7A90C8'],
  ['EventTypes', 'transfer', 'color', '#8FB0C9', '#D9C084'],
  ['EventTypes', 'mobilization', 'color', '#7F8FEA', '#8B78D3'],
  ['EventTypes', 'bear', 'color', '#C9A27A', '#A9C4D6'],
  ['EventTypes', 'alliance-championship', 'color', '#5FA8D3', '#3E60A8'],
  ['EventTypes', 'fortress-battles', 'color', '#C98F5E', '#A3A8BC'],
  ['EventTypes', 'crazy-joe', 'color', '#D98CB3', '#D0605A'],
  ['EventTypes', 'showdown', 'color', '#9C86E6', '#4F86C6'],
  ['EventTypes', 'trade-route', 'color', '#B8956A', '#D69A4E'],
  ['EventTypes', 'winter-siege', 'color', '#5B7FD9', '#5B7FD9'],
  ['EventTypes', 'foundry', 'color', '#6CB87C', '#9CC07A'],
  ['EventTypes', 'canyon', 'color', '#E07A94', '#E08A45'],
  ['EventTypes', 'armament', 'color', '#A98BD9', '#B5835E'],
  ['EventTypes', 'officer-project', 'color', '#7BA7D9', '#A0704E'],
  ['EventTypes', 'frosty-fortune', 'color', '#E6C25A', '#5A7EC0'],
  ['EventTypes', 'icefire-league', 'color', '#E0708A', '#5A78C8'],
  ['EventTypes', 'frostfire', 'color', '#F2A07A', '#5B6CC8'],
  ['EventTypes', 'mercenaries', 'color', '#8FB0C9', '#C2554A'],
  ['EventTypes', 'lucky-wheel', 'color', '#5FB4E8', '#5EA4D6'],
  ['EventTypes', 'mergeventure', 'color', '#B784D6', '#D2864E'],
  ['EventTypes', 'flame-and-fang', 'color', '#E8705A', '#6E5AB4'],
  ['EventTypes', 'defeat-beasts', 'color', '#C9A27A', '#D8C49A'],
  ['EventTypes', 'snowbusters', 'color', '#7FC8E8', '#8FA2CC'],
  ['EventTypes', 'wild-brawl', 'color', '#D9774E', '#E07A48'],
  ['EventTypes', 'hall-of-heroes', 'color', '#E6B84E', '#E8CF78'],
  ['EventTypes', 'vault-of-enigma', 'color', '#D9925A', '#C98A56'],
  ['EventTypes', 'svs-triage', 'color', '#B97C86', '#5FB8A8'],
  ['EventTypes', 'bia', 'notes', 'Kill Event', ''],
  ['EventTypes', 'trade-route', 'notes', 'Day 6 loot can be collected until Sunday 04:00 UTC', ''],
  ['EventTypes', 'alliance-championship', 'notes', 'Lanes cannot be changed once a battle starts.', ''],
  // Players' own ranks are no longer kept; Frostfire's slots are picked right in its details.
  ['EventTypes', 'koi', 'resultType', 'myrank', ''],
  ['EventTypes', 'frostfire', 'resultType', 'myrank', ''],
  ['EventTypes', 'wild-brawl', 'resultType', 'myrank', ''],
  ['EventTypes', 'icefire-league', 'resultType', 'myrank', ''],
  ['EventTypes', 'frostfire', 'notes', 'Each chief picks one of the game\'s slots (30 minutes). Sign in and tap Mine to save yours.', 'Each chief picks one of the game\'s slots (30 minutes).'],
  // Seen in game on 11 Nov 2026.
  ['Schedules', 's-snowbusters', 'firstDate', '2026-11-13', '2026-11-10'],
  ['Schedules', 's-snowbusters', 'note', 'Transfer week (from guides; not seen in game yet)', SNOWBUSTERS_NOTE],
  ['Schedules', 's-mercs', 'firstDate', '2026-11-07', '2026-11-14'],
  ['Schedules', 's-mercs', 'note', '', MERCS_NOTE],
  ['Schedules', 's-armament-plan', 'repeatEveryDays', '14', '0'],
  ['Schedules', 's-officer-stone', 'repeatEveryDays', '14', '0'],
  ['Schedules', 's-officer-stone', 'note', 'Not seen in game yet', ''],
  ['EventTypes', 'heros-mission', 'notes', '', HEROS_MISSION_NOTE],
  ['EventTypes', 'vision-of-dawn', 'notes', '', 'Tasks reset at 00:00 UTC.'],
  // Winter Siege from the game's rules; short name for Fortress Battles; the Bazaar's extra day.
  ['EventTypes', 'winter-siege', 'notes', 'Top 20 alliances, Furnace 25. Each player garrisons 2 squads during Preparation; setups lock for Scouting. The alliance with more Stronghold Stars left after the battle wins.', WINTER_SIEGE_NOTE],
  ['Schedules', 's-wintersiege', 'lengthDays', '6', '7'],
  ['EventPhases', 'ph34', 'name', 'Scouting', 'Scout'],
  ['EventPhases', 'ph32', 'endTimeUtc', '', '23:00'],
  ['EventPhases', 'ph33', 'note', '', WINTER_SIEGE_PREPARATION_NOTE],
  ['EventPhases', 'ph35', 'note', '', WINTER_SIEGE_BATTLE_NOTE],
  ['EventTypes', 'fortress-battles', 'shortName', 'Fortress Battles', 'Fort Battles'],
  ['EventTypes', 'armament', 'name', 'Armament Competition', 'Armament'],
  // 17 Nov 2026: Mercenary Prestige runs until Monday 24:00 UTC (not 18:00).
  ['EventTypes', 'mercenaries', 'notes', 'Personal Challenges for 3 days; each alliance sets when it summons the bosses. Ends Monday around 18:00 UTC', MERCS_EVENT_NOTE],
  // 17 Nov 2026: Mystery Pack is drawn by the app (no picture file).
  ['Items', 'mystery-pack', 'imageFile', 'items/mystery-pack.png', ''],
  // 17 Nov 2026: Alliance Championship instructions on Registration and on each round's lanes and battle.
  ['EventPhases', 'ph1', 'note', '', ALLIANCE_CHAMPIONSHIP_REGISTRATION_NOTE],
  ['EventSteps', 'st67', 'note', '', ALLIANCE_CHAMPIONSHIP_LANES_NOTE],
  ['EventSteps', 'st69', 'note', '', ALLIANCE_CHAMPIONSHIP_LANES_NOTE],
  ['EventSteps', 'st71', 'note', '', ALLIANCE_CHAMPIONSHIP_LANES_NOTE],
  ['EventSteps', 'st73', 'note', '', ALLIANCE_CHAMPIONSHIP_LANES_NOTE],
  ['EventSteps', 'st75', 'note', '', ALLIANCE_CHAMPIONSHIP_LANES_NOTE],
  ['EventSteps', 'st68', 'note', '', ALLIANCE_CHAMPIONSHIP_BATTLE_NOTE],
  ['EventSteps', 'st70', 'note', '', ALLIANCE_CHAMPIONSHIP_BATTLE_NOTE],
  ['EventSteps', 'st72', 'note', '', ALLIANCE_CHAMPIONSHIP_BATTLE_NOTE],
  ['EventSteps', 'st74', 'note', '', ALLIANCE_CHAMPIONSHIP_BATTLE_NOTE],
  ['EventSteps', 'st76', 'note', '', ALLIANCE_CHAMPIONSHIP_BATTLE_NOTE],
  ['PointSources', 'pwt6', 'task', 'Bizarre Bazaar, prices in Wonderstar Coins. Coins left when the event ends turn into 1 Gem each.', 'Bizarre Bazaar (open 1 day after the missions end), prices in Wonderstar Coins. Coins left when the event ends turn into 1 Gem each.']
];

// Starting steps that changed: [id, old values, new values], each as [event, day, start, end, step].
// A row is only changed while it still holds all its old values (so admin edits stay).
const CHANGED_STARTING_STEPS = [
  // Tundra Arms League (16 Nov 2026): the battle rows without "(your legion's match slots)".
  ['st10', ['hellfire', '10', '', '', 'Elimination round 1 (your legion\'s match slots)'], ['hellfire', '10', '', '', 'Elimination round 1']],
  ['st11', ['hellfire', '12', '', '', 'Elimination round 2 (your legion\'s match slots)'], ['hellfire', '12', '', '', 'Elimination round 2']],
  ['st12', ['hellfire', '14', '', '', 'Elimination round 3 (your legion\'s match slots)'], ['hellfire', '14', '', '', 'Elimination round 3']],
  ['st13', ['hellfire', '16', '', '', 'Elimination round 4 (your legion\'s match slots)'], ['hellfire', '16', '', '', 'Elimination round 4']],
  ['st14', ['hellfire', '18', '', '', 'Championship round 1 (your legion\'s match slots)'], ['hellfire', '18', '', '', 'Championship round 1']],
  ['st15', ['hellfire', '20', '', '', 'Championship round 2 (your legion\'s match slots)'], ['hellfire', '20', '', '', 'Championship round 2']],
  ['st16', ['hellfire', '22', '', '', 'Championship round 3 (your legion\'s match slots)'], ['hellfire', '22', '', '', 'Championship round 3']],
  // Alliance Championship: each round shows when lanes can be adjusted and when the battle locks them.
  ['st66', ['alliance-championship', '1', '', '', 'Registration (until Tuesday 23:00 UTC)'], ['alliance-championship', '2', '23:00', '00:00', 'Matchmaking']],
  ['st67', ['alliance-championship', '2', '', '', 'Registration closes at 23:00 UTC'], ['alliance-championship', '3', '00:00', '11:00', 'Round 1 · Adjust lanes']],
  ['st68', ['alliance-championship', '2', '23:00', '00:00', 'Matchmaking'], ['alliance-championship', '3', '11:00', '12:00', 'Round 1 · Battle']],
  ['st69', ['alliance-championship', '3', '', '', '11 hours to set lanes before each battle'], ['alliance-championship', '3', '12:00', '23:00', 'Round 2 · Adjust lanes']],
  ['st70', ['alliance-championship', '3', '11:00', '12:00', 'Round 1 battle (lanes locked)'], ['alliance-championship', '3', '23:00', '00:00', 'Round 2 · Battle']],
  ['st71', ['alliance-championship', '3', '23:00', '00:00', 'Round 2 battle (lanes locked)'], ['alliance-championship', '4', '00:00', '11:00', 'Round 3 · Adjust lanes']],
  ['st72', ['alliance-championship', '4', '', '', '11 hours to set lanes before each battle'], ['alliance-championship', '4', '11:00', '12:00', 'Round 3 · Battle']],
  ['st73', ['alliance-championship', '4', '11:00', '12:00', 'Round 3 battle (lanes locked)'], ['alliance-championship', '4', '12:00', '23:00', 'Round 4 · Adjust lanes']],
  ['st74', ['alliance-championship', '4', '23:00', '00:00', 'Round 4 battle (lanes locked)'], ['alliance-championship', '4', '23:00', '00:00', 'Round 4 · Battle']],
  ['st75', ['alliance-championship', '5', '', '', '11 hours to set lanes before the battle'], ['alliance-championship', '5', '00:00', '11:00', 'Round 5 · Adjust lanes']],
  ['st76', ['alliance-championship', '5', '11:00', '12:00', 'Round 5 battle (lanes locked), the last one'], ['alliance-championship', '5', '11:00', '12:00', 'Round 5 · Battle']]
];

// Day notes that only repeated a phase name (phases show those days now). Removed while nobody has edited them.
const RETIRED_STEP_IDS = ['st1', 'st2', 'st19', 'st20', 'st21', 'st22', 'st23', 'st24', 'st27', 'st28', 'st29', 'st30', 'st31', 'st32', 'st33', 'st36',
  'st44', 'st45', 'st46', 'st47', 'st48', 'st49', 'st50', 'st51', 'st52', 'st53', 'st54', 'st55', 'st56',
  'st59', 'st60', 'st61', 'st62', 'st63', 'st64', 'st65', 'st77', 'st78', 'st79', 'st80',
  // Tundra Arms League's "Predictions for round N" (16 Nov 2026): the Match Prediction line shows them now.
  'st37', 'st38', 'st39', 'st40', 'st41', 'st42', 'st43'];

// Phases no longer used: Wander Theater is one bar (its Missions and Bazaar are tabs in the game, shown in its info).
// Removed while nobody has edited them.
// Frosty Fortune's and Flame and Fangs' phases (13 Nov 2026): Treasure Hunt Drill and the Emporium of Enigma run
// beside Frosty Fortune as parts with their own dates, and Flame and Fangs has one white line where collecting ends.
const RETIRED_PHASE_IDS = ['ph40', 'ph41', 'ph36', 'ph37', 'ph38', 'ph39'];

function removeRetiredStartingPhases_() {
  RETIRED_PHASE_IDS.forEach(function (id) {
    const starting = STARTING_EVENT_PHASES[Number(id.slice(2)) - 1];
    deleteRows_('EventPhases', function (row) {
      return row.id === id && row.eventTypeId === starting[0] && row.fromDay === String(starting[1]) && row.toDay === String(starting[2]) && row.name === starting[3];
    });
  });
}

// Timed steps no longer used, removed while nobody has edited them: Winter Siege's Matchmaking (now a phase) and
// Flame and Fangs' day 3 (the event and its shop end together after day 2, seen in game 16 Nov 2026).
const RETIRED_TIMED_STEP_IDS = ['st81', 'st90'];

function removeRetiredTimedSteps_() {
  RETIRED_TIMED_STEP_IDS.forEach(function (id) {
    const starting = STARTING_EVENT_STEPS[Number(id.slice(2)) - 1];
    deleteRows_('EventSteps', function (row) {
      return row.id === id && row.eventTypeId === starting[0] && row.dayNumber === String(starting[1]) &&
        row.startTimeUtc === starting[2] && row.label === starting[4];
    });
  });
}

function removeRetiredStartingSteps_() {
  RETIRED_STEP_IDS.forEach(function (id) {
    const starting = STARTING_EVENT_STEPS[Number(id.slice(2)) - 1];
    deleteRows_('EventSteps', function (row) {
      return row.id === id && row.eventTypeId === starting[0] && row.dayNumber === String(starting[1]) && row.label === starting[4] && !row.startTimeUtc;
    });
  });
}

function updateStartingSteps_() {
  const columns = ['eventTypeId', 'dayNumber', 'startTimeUtc', 'endTimeUtc', 'label'];
  const rowsById = {};
  readTable_('EventSteps').forEach(function (row) { rowsById[row.id] = row; });
  CHANGED_STARTING_STEPS.forEach(function (change) {
    const row = rowsById[change[0]];
    if (!row) return;
    const isUnchanged = columns.every(function (column, index) { return row[column] === change[1][index]; });
    if (!isUnchanged) return;
    const newValues = { id: change[0] };
    columns.forEach(function (column, index) { newValues[column] = change[2][index]; });
    upsertRow_('EventSteps', 'id', newValues);
  });
}

// Older versions had more filters; any event still in one of them moves to the filter that replaced it.
function moveOldCategories_() {
  readTable_('EventTypes').forEach(function (row) {
    if (OLD_CATEGORIES[row.category]) upsertRow_('EventTypes', 'id', { id: row.id, category: OLD_CATEGORIES[row.category] });
  });
}

// Every alliance, academies included, gets the usual times once (Bear, Crazy Joe, legions, mercenaries at 00:00 UTC).
// The Settings tab remembers which alliances already got them, so deleted ones are not added again.
function addMissingAllianceDefaults_() {
  const doneText = readSettings_().allianceDefaultsAddedFor || '';
  const done = doneText ? doneText.split(',') : [];
  readTable_('Alliances').forEach(function (alliance) {
    if (done.indexOf(alliance.id) !== -1) return;
    addAllianceDefaultSchedules_(alliance.id);
    done.push(alliance.id);
  });
  upsertRow_('Settings', 'key', { key: 'allianceDefaultsAddedFor', value: done.join(',') });
}

function applyStartingFixes_() {
  STARTING_FIXES.forEach(function (fix) {
    const tableName = fix[0], id = fix[1], column = fix[2], oldValue = fix[3], newValue = fix[4];
    const row = readTable_(tableName).filter(function (candidate) { return candidate.id === id; })[0];
    if (row && row[column] === oldValue) {
      const change = { id: id };
      change[column] = newValue;
      upsertRow_(tableName, 'id', change);
    }
  });
}

// Adds the starting rows whose id is not in the tab yet.
function appendMissingRows_(tableName, records) {
  const existingIds = readTable_(tableName).map(function (row) { return row.id; });
  appendRows_(tableName, records.filter(function (record) { return existingIds.indexOf(record.id) === -1; }));
}

// For the given columns, copies the starting value into rows where that cell is still empty.
// Used when a newer version adds columns to a sheet that already has data.
function fillEmptyStartingValues_(tableName, records, columns) {
  const rowsById = {};
  readTable_(tableName).forEach(function (row) { rowsById[row.id] = row; });
  records.forEach(function (record) {
    const row = rowsById[record.id];
    if (!row) return;
    const change = { id: record.id };
    let hasChange = false;
    columns.forEach(function (column) {
      if (record[column] && !row[column]) {
        change[column] = record[column];
        hasChange = true;
      }
    });
    if (hasChange) upsertRow_(tableName, 'id', change);
  });
}

// Starting rows that are no longer used. They are only removed if nothing else depends on them.
const RETIRED_EVENT_TYPE_IDS = ['journey-treasures'];
// Crazy Joe no longer has a state-wide window: each alliance has its 2 set times instead.
// The Emporium of Enigma is now the last phase of Frosty Fortune. Armament and Officer each had a second schedule
// in an older version; their dates are now set one by one from the game.
const RETIRED_SCHEDULES = [
  { id: 's-joe', eventTypeId: 'crazy-joe' },
  { id: 's-emporium', eventTypeId: 'emporium-of-enigma' },  // replaced by s-emporium-shop (13 Nov 2026)
  { id: 's-armament-crystal', eventTypeId: 'armament' },
  { id: 's-officer-charm', eventTypeId: 'officer-project' }
];

function removeRetiredStartingRows_() {
  RETIRED_SCHEDULES.forEach(function (retired) {
    const isStillTheStartingRow = function (row) { return row.id === retired.id && row.eventTypeId === retired.eventTypeId && !row.allianceIds; };
    if (!readTable_('Schedules').some(isStillTheStartingRow)) return;
    deleteRows_('Schedules', isStillTheStartingRow);
    deleteRows_('DateChanges', function (row) { return row.scheduleId === retired.id; });
    deleteRows_('PersonalEntries', function (row) { return row.scheduleId === retired.id; });
  });
  const schedules = readTable_('Schedules');
  RETIRED_EVENT_TYPE_IDS.forEach(function (id) {
    const inUse = schedules.some(function (row) { return row.eventTypeId === id; });
    if (!inUse) deleteRows_('EventTypes', function (row) { return row.id === id; });
  });
}

/* ------------------------------------------------------------------ */
/* Starting data (written to the sheet by runSetup; the app reads the sheet) */
/* ------------------------------------------------------------------ */

// Tundra Arms League's Match Prediction openings, one per round (days count from 8 Nov 2026, the first prediction day).
const TAL_MATCH_PREDICTION_WINDOWS = ['Round 1', 'Round 2', 'Round 3', 'Round 4', 'Championship round 1', 'Championship round 2', 'Championship round 3']
  .map(function (round, index) { return (2 * index + 1) + ' 00:00-' + (2 * index + 2) + ' 19:00 ' + round; }).join('; ');

const STARTING_EVENT_TYPES = [
  // State
  // State of Power: its phases are parts of it, so the opponent state is entered once per SvS.
  { id: 'svs', imageFile: 'svs-prep', name: 'State of Power (SvS)', shortName: 'SvS', category: 'state', color: '#5C8FE8', colorEnd: '#E05A5A', icon: 'swords', sortOrder: '2', opponentCount: '1' },
  { id: 'svs-matchmaking', timelineColor: '#8494B5', imageFile: 'svs-prep', name: 'SvS matchmaking', shortName: 'SvS matchmaking', category: 'state', color: '#6E87B8', colorEnd: '#B97C86', icon: 'swords', sortOrder: '1',
    partOf: 'svs', opponentCount: '1' },
  { id: 'svs-prep', timelineColor: '#7C9DD6', imageFile: 'svs-prep', name: 'SvS preparation', shortName: 'SvS preparation', category: 'state', color: '#5C8FE8', colorEnd: '#E05A5A', icon: 'swords', sortOrder: '2',
    partOf: 'svs', opponentCount: '1',
    pointsNote: 'Valeria bonus: her skill "Well Prepared" adds up to +20% to all preparation points (at skill level 10). It depends on your Valeria, so it differs for everyone.',
    resultType: 'winloss' },
  { id: 'svs-battle', timelineColor: '#CF7F86', imageFile: 'svs-prep', name: 'SvS Battle', shortName: 'SvS Battle', category: 'state', color: '#5C8FE8', colorEnd: '#E05A5A', icon: 'swords', sortOrder: '3',
    partOf: 'svs', opponentCount: '1',
    pointsNote: 'Points only count against chiefs within ±3 furnace levels. In a rally, the rally leader\'s level counts.',
    resultType: 'winloss' },
  { id: 'castle-battle', timelineColor: '#D9727A', imageFile: 'castle-battle', name: 'Castle Battle', shortName: 'Castle', category: 'state', color: '#9B6AD0', colorEnd: '#E8484C', icon: 'castle', sortOrder: '4',
    partOf: 'svs', opponentCount: '1',
    resultType: 'winloss', hasPresident: 'yes' },
  { id: 'svs-triage', timelineColor: '#CF7F86>#5FB8A8', imageFile: 'svs-prep', name: 'Field Triage', shortName: 'Field Triage', category: 'state', color: '#5FB8A8', colorEnd: '#3E9C9A', icon: 'swords', sortOrder: '5',
    partOf: 'svs', barSubtitle: 'Troop Revival' },
  { id: 'koi', name: 'King of Icefield', shortName: 'KOI', category: 'state', color: '#EDC650', colorEnd: '#D69A34', icon: 'crown', sortOrder: '7' },
  { id: 'sunfire', imageFile: 'castle-battle', name: 'Sunfire Castle', shortName: 'Sunfire', category: 'state', color: '#E8B85A', colorEnd: '#E07A3C', icon: 'sun', sortOrder: '8',
    hasPresident: 'yes' },
  { id: 'bia', otherName: 'Kill Event', imageFile: 'bia', name: 'Brothers in Arms', shortName: 'Brothers in Arms', category: 'state', color: '#7A90C8', colorEnd: '#56649E', icon: 'swords', sortOrder: '34',
     },
  // Alliance (events played as an alliance; times set for one alliance always show here too)
  { id: 'mobilization', name: 'Alliance Mobilization', shortName: 'Alliance Mobilization', category: 'alliance', color: '#8B78D3', colorEnd: '#C3A0E0', icon: 'flag', sortOrder: '1' },
  { id: 'showdown', name: 'Alliance Showdown', shortName: 'Alliance Showdown', category: 'alliance', color: '#4F86C6', colorEnd: '#3E63A8', icon: 'shield', sortOrder: '6',
    resultType: 'winloss', allianceRequirement: SHOWDOWN_ALLIANCE_REQUIREMENT },
  { id: 'trade-route', imageFile: 'truck', name: 'Tundra Trade Route', shortName: 'Trade Route', category: 'alliance', color: '#D69A4E', colorEnd: '#A8693A', icon: 'arrows', sortOrder: '1', partOf: 'showdown' },
  { id: 'alliance-championship', imageFile: 'alliance_championship', name: 'Alliance Championship', shortName: 'Alliance Championship', category: 'alliance', color: '#3E60A8', colorEnd: '#BC5247', icon: 'trophy', sortOrder: '21',
    resultType: 'rank', allianceRequirement: 'At least 10 members signed up', playerRequirement: 'Furnace 10' },
  { id: 'fortress-battles', imageFile: 'fortress-battle', name: 'Fortress Battles', shortName: 'Fort Battles', category: 'alliance', color: '#A3A8BC', colorEnd: '#7C849E', icon: 'castle', sortOrder: '22',
    resultType: 'winloss',
    notes: 'The rewards of each fortress and stronghold expire 24 hours after its battle.' },
  { id: 'bear', name: 'Bear Hunt', shortName: 'Bear', category: 'alliance', color: '#A9C4D6', colorEnd: '#61BEAE', icon: 'paw', sortOrder: '11', groupName: 'Trap', groupCount: '2' },
  // Winter Siege: once a month from the Monday of the Alliance Showdown week (top 20 alliances).
  { id: 'winter-siege', imageFile: 'wintersiege', name: 'Winter Siege', shortName: 'Winter Siege', category: 'alliance', color: '#5B7FD9', colorEnd: '#4D5E9D', icon: 'castle', sortOrder: '23',
    resultType: 'winloss', notes: WINTER_SIEGE_NOTE,
    allianceRequirement: WINTER_SIEGE_ALLIANCE_REQUIREMENT, playerRequirement: WINTER_SIEGE_PLAYER_REQUIREMENT },
  { id: 'crazy-joe', imageFile: 'crazy-joe', name: 'Crazy Joe', shortName: 'Crazy Joe', category: 'alliance', color: '#D0605A', colorEnd: '#A8403E', icon: 'skull', sortOrder: '12',
    groupName: 'Session', groupCount: '2', playerRequirement: 'Furnace 7',
    notes: 'Each alliance sets 2 times: Tuesday and Thursday' },
  // Personal
  // Foundry and Canyon: the state-wide days (voting, registration) are personal; each legion's battle is an alliance time.
  { id: 'foundry', name: 'Foundry Battle', shortName: 'Foundry', category: 'personal', color: '#9CC07A', colorEnd: '#6E9A55', icon: 'factory', sortOrder: '9', groupName: 'Legion', groupCount: '2',
    opponentCount: '1', opponentHasAlliance: 'yes',
    resultType: 'winloss', notes: 'Be in the right alliance before registration ends.' },
  { id: 'canyon', name: 'Canyon Clash', shortName: 'Canyon', category: 'personal', color: '#E08A45', colorEnd: '#E8B85A', icon: 'mountain', sortOrder: '10', groupName: 'Legion', groupCount: '2',
    opponentCount: '2', opponentHasAlliance: 'yes',
    resultType: 'winloss', notes: 'Be in the right alliance before registration ends.' },
  // Mercenaries: the 3 days are personal; each alliance's boss summon is an alliance time.
  { id: 'mercenaries', imageFile: 'mercs', name: 'Mercenary Prestige', shortName: 'Mercenaries', category: 'personal', color: '#C2554A', colorEnd: '#93394A', icon: 'target', sortOrder: '13',
    notes: MERCS_EVENT_NOTE },
  { id: 'frostfire', name: 'Frostfire Mine', shortName: 'Frostfire', category: 'personal', color: '#5B6CC8', colorEnd: '#7A6AD8', icon: 'flame', sortOrder: '16',
    slotTimes: '02:00,05:00,11:00,14:00,16:00,18:00,21:00',
    notes: 'Each chief picks one of the game\'s slots (30 minutes).', playerRequirement: 'Furnace 16' },
  { id: 'wild-brawl', imageFile: 'brawl', name: 'Wild Brawl', shortName: 'Wild Brawl', category: 'personal', color: '#E07A48', colorEnd: '#C2453E', icon: 'swords', sortOrder: '32' },
  // Seen in the game's calendar on 17 Nov 2026 (18–20 and 18–21 Nov). How often they come back is not known yet.
  { id: 'slush-station', name: 'Slush Station', shortName: 'Slush Station', category: 'personal', color: '#6FB6E0', colorEnd: '#3E86C0', icon: 'snow', sortOrder: '52',
    notes: 'Help Molly make shaved ice desserts.' },
  { id: 'shaved-ice-stall', name: 'Shaved Ice Stall', shortName: 'Shaved Ice Stall', category: 'personal', color: '#6FA8E0', colorEnd: '#E0A04A', icon: 'gift', sortOrder: '53',
    notes: 'Exchange Vivid Vouchers for rewards.' },
  { id: 'flame-and-fang', imageFile: 'flame_fangs', name: 'Flame and Fangs', shortName: 'Flame and Fangs', category: 'personal', color: '#6E5AB4', colorEnd: '#C34C78', icon: 'flame', sortOrder: '33' },
  { id: 'armament', imageFile: 'armament', name: 'Armament', shortName: 'Armament', category: 'personal', color: '#B5835E', colorEnd: '#8C5E44', icon: 'trophy', sortOrder: '36' },
  { id: 'officer-project', imageFile: 'officer', name: 'Officer Project', shortName: 'Officer', category: 'personal', color: '#A0704E', colorEnd: '#D0A84A', icon: 'trophy', sortOrder: '37' },
  { id: 'defeat-beasts', name: 'Defeat nearby beasts', shortName: 'Defeat nearby beasts', category: 'personal', color: '#D8C49A', colorEnd: '#A8805A', icon: 'paw', sortOrder: '25' },
  // Hero's Mission: the hero is the Events hero of 2 generations back, so it changes with the generation ({eventsHero}).
  { id: 'heros-mission', name: 'Hero\'s Mission', shortName: 'Hero\'s Mission', category: 'personal', color: '#C77DA8', icon: 'target', sortOrder: '38',
    notes: HEROS_MISSION_NOTE, pointsTitle: 'Rewards' },
  { id: 'vision-of-dawn', imageFile: 'vision-of-dawn', name: 'Vision of Dawn', shortName: 'Vision of Dawn', category: 'personal', color: '#E6B86A', icon: 'sun', sortOrder: '39',
    notes: 'Tasks reset at 00:00 UTC.', pointsTitle: 'Tasks and rewards' },
  // Wander Theater: Wanderer Missions (daily) and the Bizarre Bazaar shop, which stays open one day longer.
  { id: 'wander-theater', name: 'Wander Theater', shortName: 'Wander Theater', category: 'personal', color: '#6C7FD8', colorEnd: '#B58AD9', icon: 'star', sortOrder: '51',
    pointsTitle: 'Missions and shop' },
  { id: 'lucky-wheel', name: 'Lucky Wheel', shortName: 'Lucky Wheel', category: 'personal', color: '#5EA4D6', colorEnd: '#3E7FC0', icon: 'wheel', sortOrder: '24' },
  // Frosty Fortune: Treasure Hunt Drill, Frosty Fortune and its shop, Emporium of Enigma.
  { id: 'frosty-fortune', imageFile: 'frostyfortune', name: 'Frosty Fortune', shortName: 'Frosty Fortune', category: 'personal', color: '#5A7EC0', colorEnd: '#3E5A98', icon: 'gift', sortOrder: '26' },
  // Frosty Fortune's parts use the item pictures of the same name (17 Nov 2026).
  { id: 'treasure-hunt-drill', imageFile: 'items/trsure-hunt-points', name: 'Treasure Hunt Drill', shortName: 'Treasure Hunt Drill', category: 'personal', color: '#E6C25A', icon: 'star', sortOrder: '1', partOf: 'frosty-fortune' },
  { id: 'emporium-of-enigma', imageFile: 'items/thorn-of-enigma', name: 'Emporium of Enigma', shortName: 'Emporium', category: 'personal', color: '#E07AB0', icon: 'gift', sortOrder: '2', partOf: 'frosty-fortune',
    detailsOnly: 'yes' },
  { id: 'trading-station', imageFile: 'tundra_station', name: 'Tundra Trading Station', shortName: 'Trading Station', category: 'personal', color: '#D9925A', icon: 'arrows', sortOrder: '46' },
  { id: 'treasure-hunter', imageFile: 'pickaxe', name: 'Treasure Hunter', shortName: 'Treasure Hunter', category: 'personal', color: '#6FA8D9', icon: 'gift', sortOrder: '42' },
  { id: 'tundra-adventure', imageFile: 'tundraadventure', name: 'Tundra Adventure', shortName: 'Tundra Adventure', category: 'personal', color: '#E0A85E', icon: 'mountain', sortOrder: '43',
    notes: 'Adventurer Drill, Odyssey of Adventure; the Adventure Caravan shop stays one day longer' },
  { id: 'tundra-games', name: 'Tundra Games', shortName: 'Tundra Games', category: 'personal', color: '#6CC4A8', icon: 'trophy', sortOrder: '45' },
  // Mini-games: personal events that take turns, one per week.
  { id: 'snowbusters', name: 'Snowbusters', shortName: 'Snowbusters', category: 'personal', typeLabel: 'Mini-game', color: '#8FA2CC', colorEnd: '#6D80AE', icon: 'snow', sortOrder: '14' },
  { id: 'dreamscape', name: 'Dreamscape Memory', shortName: 'Dreamscape', category: 'personal', typeLabel: 'Mini-game', color: '#B19FEC', icon: 'star', sortOrder: '15' },
  { id: 'mergeventure', name: 'Mergeventure', shortName: 'Mergeventure', category: 'personal', typeLabel: 'Mini-game', color: '#D2864E', colorEnd: '#E8BC5E', icon: 'star', sortOrder: '17' },
  { id: 'fishing', imageFile: 'fishing', name: 'Fishing Tournament', shortName: 'Fishing', category: 'personal', typeLabel: 'Mini-game', color: '#5FB4C9', icon: 'target', sortOrder: '40' },
  // Frostdragon Tyrant and Tundra Arms League (state events) and Icefire Warhymn League (personal)
  // Tyrant's phases show in day details only (no bar), as asked.
  { id: 'tyrant', name: 'Frostdragon Tyrant', shortName: 'Tyrant', category: 'state', color: '#E36F6F', icon: 'dragon', sortOrder: '18', detailsOnly: 'yes',
    resultType: 'rank', notes: 'Be in the right alliance before sign-up starts.' },
  { id: 'frostwind-journey', name: 'Frostwind Journey', shortName: 'Frostwind Journey', category: 'state', color: '#E36F6F', icon: 'flag', sortOrder: '1', partOf: 'tyrant' },
  { id: 'dragonborn-truck', name: 'Dragonborn\'s Truck', shortName: 'Dragonborn\'s Truck', category: 'state', color: '#E36F6F', icon: 'arrows', sortOrder: '2', partOf: 'tyrant' },
  { id: 'tyrant-prediction', name: 'Championship Prediction', shortName: 'Prediction', category: 'state', color: '#E36F6F', icon: 'star', sortOrder: '3', partOf: 'tyrant' },
  // Tundra Arms League (in the game's calendar "Tundra Hellfire"). Its rules are in TAL_RULES and the other TAL lists.
  { id: 'hellfire', name: 'Tundra Arms League', shortName: 'TAL', category: 'state', color: '#E0A24A', colorEnd: '#C4563C', icon: 'flame', sortOrder: '19', notes: '',
    groupName: 'Legion', groupCount: '2',
    resultType: 'rank',
    allianceRequirement: 'Top 64 legions in the zone, up to 2 per alliance. The second legion unlocks at Alliance Lv. 6 with 40 members logging in during the first week.',
    playerRequirement: 'Furnace 16, in the alliance before sign-up ends, not offline for more than 5 days before the event.' },
  { id: 'tal-schedule-info', name: 'Schedule Info', shortName: 'Schedule Info', category: 'state', color: '#EE8A5C', icon: 'calendar', sortOrder: '1', partOf: 'hellfire' },
  { id: 'tal-match-missions', name: 'Match Missions', shortName: 'Match Missions', category: 'state', color: '#EE8A5C', icon: 'flag', sortOrder: '2', partOf: 'hellfire' },
  // Predictions (16 Nov 2026): lines under Tundra Arms League's bar, drawn only while they are open, in the stakes' colours.
  // Match Prediction: each round from 00:00 UTC the day before its battles until 19:00 UTC on the battle day (the last battle time).
  { id: 'tal-match-prediction', imageFile: 'items/match-stake', name: 'Match Prediction', shortName: 'Match Prediction', category: 'state', color: '#B596F0', icon: 'star', sortOrder: '3', partOf: 'hellfire',
    openWindows: TAL_MATCH_PREDICTION_WINDOWS },
  // Champion Prediction: from Elimination round 3, only on the days without battles, with the round's multiplier.
  { id: 'tal-champion-prediction', imageFile: 'items/champion-stake', name: 'Champion Prediction', shortName: 'Champion Prediction', category: 'state', color: '#F4CF4E', icon: 'trophy', sortOrder: '4', partOf: 'hellfire',
    openWindows: '1 00:00-1 24:00 ×16; 3 00:00-3 24:00 ×8; 5 00:00-5 24:00 ×4; 7 00:00-7 24:00 ×3; 9 00:00-9 24:00 ×2', windowMark: 'label' },
  { id: 'icefire-league', imageFile: 'warhymn', name: 'Icefire Warhymn League', shortName: 'Icefire League', category: 'personal', color: '#5A78C8', colorEnd: '#5BBCE6', icon: 'trophy', sortOrder: '23' },
  // Deals
  { id: 'hall-of-heroes', imageFile: 'hall_heroes', name: 'Hall of Heroes', shortName: 'Hall of Heroes', category: 'deals', color: '#E8CF78', colorEnd: '#CFA44A', icon: 'star', sortOrder: '29' },
  { id: 'crystal-reactivation', name: 'Crystal Reactivation', shortName: 'Crystal Reactivation', category: 'deals', color: '#E07A5A', icon: 'flame', sortOrder: '47' },
  { id: 'vault-of-enigma', imageFile: 'vault_enigma', name: 'Vault of Enigma', shortName: 'Vault', category: 'deals', color: '#C98A56', colorEnd: '#B0603E', icon: 'gift', sortOrder: '28' },
  { id: 'mia-fortune', imageFile: 'mia', name: 'Mia\'s Fortune Hut', shortName: 'Mia\'s Fortune Hut', category: 'deals', color: '#D97FC9', icon: 'star', sortOrder: '41' },
  { id: 'journey-of-light', imageFile: 'journey_of_light', name: 'Journey of Light', shortName: 'Journey of Light', category: 'deals', color: '#7FA8E8', icon: 'star', sortOrder: '48' },
  { id: 'shining-city', name: 'Shining City Pack', shortName: 'Shining City', category: 'deals', color: '#E6C25A', icon: 'castle', sortOrder: '49' },
  { id: 'weekly-benefits', name: 'Weekly Benefits Card', shortName: 'Weekly Benefits', category: 'deals', color: '#8FB0C9', icon: 'calendar', sortOrder: '50' },
  { id: 'silver-shell', name: 'Silver Shell Shop', shortName: 'Silver Shell Shop', category: 'deals', color: '#A9B8C9', icon: 'star', sortOrder: '44' },
  // State Transfer: starts the day after the SvS Battle (worked out by the app, no schedule).
  { id: 'transfer', name: 'State Transfer', shortName: 'State Transfer', category: 'state', color: '#D9C084', colorEnd: '#B98E54', icon: 'arrows', sortOrder: '20',
    notes: 'No moves during Pre-Transfer.' }
];

// The state's alliances by power (November 2026) and the academies of the top 3. Only added to a sheet with no alliances.
// Each academy is an alliance of its own, linked to its main alliance.
const STARTING_ALLIANCES = [
  { id: 'dvl', name: 'DEVILEMPIRE', tag: 'DVL', mainAllianceId: '', logoUrl: '', baseColor: '#E3B04B', secondColor: '#9A5B2E', sortOrder: '1', followsMain: '' },
  { id: 'top', name: 'TOP', tag: 'TOP', mainAllianceId: '', logoUrl: '', baseColor: '#3D63C9', secondColor: '#F2C94C', sortOrder: '2', followsMain: '' },
  { id: 'sky', name: 'LoveAndPeace', tag: 'SKY', mainAllianceId: '', logoUrl: '', baseColor: '#D9483B', secondColor: '#9C7A6B', sortOrder: '3', followsMain: '' },
  { id: 'fun', name: '休閒動物園ღ', tag: 'FUN', mainAllianceId: '', logoUrl: '', baseColor: '#E0552F', secondColor: '#F5A35C', sortOrder: '4', followsMain: '' },
  { id: 'ruu', name: 'なちゅらるぅELT島', tag: 'RUU', mainAllianceId: '', logoUrl: '', baseColor: '#E8603A', secondColor: '#F4F4F4', sortOrder: '5', followsMain: '' },
  { id: 'dvl-academy', name: 'littledvl', tag: 'dvl', mainAllianceId: 'dvl', logoUrl: '', baseColor: '#E0552F', secondColor: '#F4F4F4', sortOrder: '1', followsMain: '' },
  { id: 'top-academy', name: 'TOPacademy', tag: 'top', mainAllianceId: 'top', logoUrl: '', baseColor: '#9B4FD6', secondColor: '#F4F4F4', sortOrder: '1', followsMain: '' },
  { id: 'sky-academy', name: 'SlientAndPeace', tag: 'abc', mainAllianceId: 'sky', logoUrl: '', baseColor: '#9B4FD6', secondColor: '#F4F4F4', sortOrder: '1', followsMain: '' }
];

// The 1458 cycle as of November 2026 (admins can change all of it in the app).
// Seen in game (event calendar, 3–5 Nov 2026): SvS (31 Oct – 9 Nov), Castle Battle 12:00–17:00, Alliance Championship
// (registration to Tuesday 23:00, battles Wednesday–Friday), Fortress Battles (Tuesday–Friday), Crazy Joe window (Tuesday–Thursday),
// Lucky Wheel, Defeat nearby beasts, Frostfire Mine and its slots, Flame and Fangs, Icefire Warhymn League, Vault of Enigma,
// Frosty Fortune with its shop day, Mergeventure, Hall of Heroes (weekly), Tundra Hellfire, State Transfer (from 8 Nov),
// Alliance Showdown (to Sunday 12:00), Tundra Trade Route (to Sunday 04:00), Winter Siege, Foundry Battle, Armament Competition.
// Seen in game on 11 Nov 2026: Snowbusters, Armament Competition, Officer Project, Mercenary Prestige, Hero's Mission,
// Vision of Dawn, Mia's Fortune Hut, Wander Theater, Alliance Showdown's day themes and points.
// From guides (not seen in game yet): Canyon Clash, Sunfire Castle, King of Icefield, Brothers in Arms, Crystal Reactivation,
// Wild Brawl, Frostdragon Tyrant.
const STARTING_SCHEDULES = [
  { id: 's-mob', eventTypeId: 'mobilization', firstDate: '2026-10-26', repeatEveryDays: '28', lengthDays: '6' },
  { id: 's-svsmm', eventTypeId: 'svs-matchmaking', firstDate: '2026-10-31', repeatEveryDays: '28', lengthDays: '2' },
  // SvS preparation runs until the SvS Battle starts (Saturday 10:00 UTC). Field Triage follows the battle until Monday's reset.
  { id: 's-svsprep', eventTypeId: 'svs-prep', firstDate: '2026-11-02', repeatEveryDays: '28', lengthDays: '6', endTimeUtc: '10:00' },
  { id: 's-svsbattle', eventTypeId: 'svs-battle', firstDate: '2026-11-07', repeatEveryDays: '28', lengthDays: '1', startTimeUtc: '10:00', endTimeUtc: '22:00' },
  { id: 's-castle', eventTypeId: 'castle-battle', firstDate: '2026-11-07', repeatEveryDays: '28', lengthDays: '1', startTimeUtc: '12:00', endTimeUtc: '17:00' },
  { id: 's-svstriage', eventTypeId: 'svs-triage', firstDate: '2026-11-07', repeatEveryDays: '28', lengthDays: '3', startTimeUtc: '22:00' },
  { id: 's-showdown', eventTypeId: 'showdown', firstDate: '2026-11-09', repeatEveryDays: '28', lengthDays: '7', endTimeUtc: '12:00' },
  { id: 's-wintersiege', eventTypeId: 'winter-siege', firstDate: '2026-11-09', repeatEveryDays: '28', lengthDays: '7' },
  { id: 's-koi', eventTypeId: 'koi', firstDate: '2026-11-16', repeatEveryDays: '28', lengthDays: '7' },
  { id: 's-sunfire', eventTypeId: 'sunfire', firstDate: '2026-11-21', repeatEveryDays: '28', lengthDays: '1', startTimeUtc: '12:00', endTimeUtc: '17:00' },
  // Foundry and Canyon: the whole week, from voting to the battle (the battle day is the last one). Each legion's time is set per alliance.
  { id: 's-foundry', eventTypeId: 'foundry', firstDate: '2026-10-26', repeatEveryDays: '14', lengthDays: '7' },
  { id: 's-canyon', eventTypeId: 'canyon', firstDate: '2026-10-26', repeatEveryDays: '28', lengthDays: '6' },
  // From the in-game calendar, week of 2 Nov 2026. Repeats only where the cycle is known.
  // Alliance Championship: registration Monday–Tuesday, 5 rounds Wednesday–Friday.
  { id: 's-ac', eventTypeId: 'alliance-championship', firstDate: '2026-11-02', repeatEveryDays: '7', lengthDays: '5', endTimeUtc: '12:00' },
  { id: 's-fortress', eventTypeId: 'fortress-battles', firstDate: '2026-11-03', repeatEveryDays: '7', lengthDays: '4' },
  { id: 's-hoh', eventTypeId: 'hall-of-heroes', firstDate: '2026-11-08', repeatEveryDays: '7', lengthDays: '3' },
  { id: 's-wheel', eventTypeId: 'lucky-wheel', firstDate: '2026-11-03', repeatEveryDays: '14', lengthDays: '3' },
  { id: 's-beasts', eventTypeId: 'defeat-beasts', firstDate: '2026-11-03', repeatEveryDays: '14', lengthDays: '2' },
  { id: 's-frosty', eventTypeId: 'frosty-fortune', firstDate: '2026-10-30', repeatEveryDays: '28', lengthDays: '8' },
  // Parts of Frosty Fortune, drawn as lines under its bar (like Trade Route): Treasure Hunt Drill with Frosty Fortune
  // on days 1-7, the Emporium of Enigma shop one day longer.
  { id: 's-treasure-drill', eventTypeId: 'treasure-hunt-drill', firstDate: '2026-10-30', repeatEveryDays: '28', lengthDays: '7' },
  { id: 's-emporium-shop', eventTypeId: 'emporium-of-enigma', firstDate: '2026-10-30', repeatEveryDays: '28', lengthDays: '8' },
  { id: 's-vault', eventTypeId: 'vault-of-enigma', firstDate: '2026-11-02', repeatEveryDays: '28', lengthDays: '7', note: 'SvS prep week. Every 4 weeks is not confirmed yet' },
  { id: 's-icefire', eventTypeId: 'icefire-league', firstDate: '2026-11-02', repeatEveryDays: '0', lengthDays: '6' },
  // Tundra Arms League's predictions (16 Nov 2026): Match Prediction from the day before Elimination round 1 to the final,
  // Champion Prediction from Elimination round 3 to the day before the final.
  { id: 's-tal-match-prediction', eventTypeId: 'tal-match-prediction', firstDate: '2026-11-08', repeatEveryDays: '112', lengthDays: '14' },
  { id: 's-tal-champion-prediction', eventTypeId: 'tal-champion-prediction', firstDate: '2026-11-12', repeatEveryDays: '112', lengthDays: '9' },
  // Tundra Arms League came to the game on 18 Aug 2025; its seasons are irregular, so a moved season moves the ones
  // predicted from it (16 weeks apart).
  { id: 's-hellfire', eventTypeId: 'hellfire', firstDate: '2026-10-31', repeatEveryDays: '112', lengthDays: '23',
    note: 'Every 4 months', sinceDate: '2025-08-18', shiftWithMoves: 'yes' },
  // Mini-games take turns, one per week: Mergeventure in the SvS week, Snowbusters in the transfer week.
  // Fishing and Dreamscape get their dates once their weeks are known.
  { id: 's-merge', eventTypeId: 'mergeventure', firstDate: '2026-11-06', repeatEveryDays: '28', lengthDays: '3' },
  { id: 's-snowbusters', eventTypeId: 'snowbusters', firstDate: '2026-11-10', repeatEveryDays: '28', lengthDays: '3', note: SNOWBUSTERS_NOTE },
  // Wild Brawl ran on the Sunfire + Tyrant weekend of 24–25 Oct 2026; repeating with Sunfire is a guess.
  { id: 's-brawl', eventTypeId: 'wild-brawl', firstDate: '2026-10-24', repeatEveryDays: '28', lengthDays: '2', note: 'Repeat not confirmed yet' },
  // Tyrant was on Sunday 25 Oct 2026; every 2 months worked out as every 8 weeks.
  // Tyrant runs every 2 months (8 weeks) from Monday sign-up to Tuesday after the battle; the battle is the Sunday of the Sunfire weekend.
  // Frostdragon Tyrant came to the game with the update of 5 Sep 2024.
  { id: 's-tyrant', eventTypeId: 'tyrant', firstDate: '2026-10-19', repeatEveryDays: '56', lengthDays: '9', note: 'Every 2 months (8 weeks)',
    sinceDate: '2024-09-05', shiftWithMoves: 'yes' },
  // Added November 2026 from the full event research, placed with this week's in-game dates as anchors.
  { id: 's-frostfire', eventTypeId: 'frostfire', firstDate: '2026-11-03', repeatEveryDays: '14', lengthDays: '1',
    note: 'Tuesday of the Crazy Joe week' },
  // Seen in game on 2 and 16 Nov 2026: every 2 weeks. Kept 3 days until the shop's dates are checked.
  { id: 's-flame', eventTypeId: 'flame-and-fang', firstDate: '2026-11-02', repeatEveryDays: '14', lengthDays: '2',
    note: 'Monday, every 2 weeks' },
  // Dreamscape Memory, seen in game 18–20 Nov 2026: one of the monthly mini-games.
  { id: 's-dreamscape', eventTypeId: 'dreamscape', firstDate: '2026-11-18', repeatEveryDays: '28', lengthDays: '3', note: 'Monthly mini-game' },
  { id: 's-bia', eventTypeId: 'bia', firstDate: '2026-11-20', repeatEveryDays: '28', lengthDays: '2', note: 'Sunfire week' },
  { id: 's-traderoute', eventTypeId: 'trade-route', firstDate: '2026-11-09', repeatEveryDays: '28', lengthDays: '7', endTimeUtc: '04:00',
    note: 'With Alliance Showdown' },
  { id: 's-crystal', eventTypeId: 'crystal-reactivation', firstDate: '2026-11-20', repeatEveryDays: '28', lengthDays: '2',
    note: 'Sunfire week. Some guides say every 2 weeks' },
  // Armament (9–10 and 13–14 Nov) and Officer Project (11–12 and 15–16 Nov), seen in game. Each date on its own,
  // without a repeat, until the next weeks show the pattern.
  { id: 's-armament-plan', eventTypeId: 'armament', firstDate: '2026-11-09', repeatEveryDays: '0', lengthDays: '2' },
  { id: 's-armament-2', eventTypeId: 'armament', firstDate: '2026-11-13', repeatEveryDays: '0', lengthDays: '2' },
  { id: 's-officer-stone', eventTypeId: 'officer-project', firstDate: '2026-11-11', repeatEveryDays: '0', lengthDays: '2' },
  { id: 's-officer-2', eventTypeId: 'officer-project', firstDate: '2026-11-15', repeatEveryDays: '0', lengthDays: '2', note: 'Different rewards from 11–12 Nov' },
  { id: 's-mercs', eventTypeId: 'mercenaries', firstDate: '2026-11-14', repeatEveryDays: '28', lengthDays: '3', note: MERCS_NOTE },
  // Seen in game on 11 Nov 2026, once each until they come back.
  { id: 's-heros-mission', eventTypeId: 'heros-mission', firstDate: '2026-11-11', repeatEveryDays: '0', lengthDays: '3' },
  { id: 's-vision', eventTypeId: 'vision-of-dawn', firstDate: '2026-11-10', repeatEveryDays: '0', lengthDays: '3' },
  { id: 's-mia', eventTypeId: 'mia-fortune', firstDate: '2026-11-13', repeatEveryDays: '0', lengthDays: '2' },
  // Wander Theater: one bar, 10–16 Nov (Wanderer Missions to 15 Nov, the Bizarre Bazaar one day longer).
  { id: 's-wander', eventTypeId: 'wander-theater', firstDate: '2026-11-10', repeatEveryDays: '0', lengthDays: '7' },
  // Seen in the game's calendar on 17 Nov 2026.
  { id: 's-slush', eventTypeId: 'slush-station', firstDate: '2026-11-18', repeatEveryDays: '0', lengthDays: '3' },
  { id: 's-shaved-ice', eventTypeId: 'shaved-ice-stall', firstDate: '2026-11-18', repeatEveryDays: '0', lengthDays: '4' }
];

// 1458's predicted transfer group per transfer date (from the Predictions 1458 sheet).
const STARTING_TRANSFER_GROUPS = [
  ['2026-11-09', 1428, 1822, 'Gen 11', 10], ['2026-11-23', 1124, 1491, 'Gen 12', 10],
  ['2026-12-07', 1190, 1552, 'Gen 12', 10], ['2026-12-21', 1241, 1615, 'Gen 12', 10],
  ['2027-01-04', 1313, 1680, 'Gen 12', 10], ['2027-01-18', 1367, 1751, 'Gen 12', 10],
  ['2027-02-01', 1428, 1822, 'Gen 12', 10], ['2027-02-15', 1124, 1491, 'Gen 13', 10],
  ['2027-03-01', 1190, 1552, 'Gen 13', 10], ['2027-03-15', 1241, 1615, 'Gen 13', 10],
  ['2027-03-29', 1313, 1680, 'Gen 13', 10], ['2027-04-12', 1367, 1751, 'Gen 13', 10],
  ['2027-04-26', 1428, 1822, 'Gen 13', 10], ['2027-05-10', 1124, 1491, 'Gen 14', 10],
  ['2027-05-24', 1190, 1552, 'Gen 14', 10], ['2027-06-07', 1241, 1615, 'Gen 14', 10],
  ['2027-06-21', 1313, 1680, 'Gen 14', 10], ['2027-07-05', 1367, 1751, 'Gen 14', 10],
  ['2027-07-19', 1428, 1822, 'Gen 14', 10], ['2027-08-02', 1124, 1491, 'Gen 15', 10],
  ['2027-08-16', 1190, 1552, 'Gen 15', 10], ['2027-08-30', 1241, 1615, 'Gen 15', 10],
  ['2027-09-13', 1313, 1680, 'Gen 15', 10], ['2027-09-27', 1367, 1751, 'Gen 15', 10],
  ['2027-10-11', 1428, 1822, 'Gen 15', 10], ['2027-10-25', 1124, 1491, 'Gen 16', 10],
  ['2027-11-08', 1190, 1552, 'Gen 16', 10], ['2027-11-22', 1241, 1615, 'Gen 16', 10],
  ['2027-12-06', 1313, 1680, 'Gen 16', 10], ['2027-12-20', 1367, 1751, 'Gen 16', 10],
  ['2028-01-03', 1428, 1822, 'Gen 16', 10], ['2028-01-17', 1124, 1491, 'Gen 17', 10],
  ['2028-01-31', 1190, 1552, 'Gen 17', 10], ['2028-02-14', 1241, 1615, 'Gen 17', 10],
  ['2028-02-28', 1313, 1680, 'Gen 17', 10], ['2028-03-13', 1367, 1751, 'Gen 17', 10],
  ['2028-03-27', 1428, 1822, 'Gen 17', 10], ['2028-04-10', 1124, 1491, 'Gen 18', 10],
  ['2028-04-24', 1190, 1552, 'Gen 18', 10], ['2028-05-08', 1241, 1615, 'Gen 18', 10],
  ['2028-05-22', 1313, 1680, 'Gen 18', 10], ['2028-06-05', 1367, 1751, 'Gen 18', 10],
  ['2028-06-19', 1428, 1822, 'Gen 18', 10], ['2028-07-03', 1124, 1491, 'Gen 19', 10],
  ['2028-07-17', 1190, 1552, 'Gen 19', 10], ['2028-07-31', 1241, 1615, 'Gen 19', 10],
  ['2028-08-14', 1313, 1680, 'Gen 19', 10], ['2028-08-28', 1367, 1751, 'Gen 19', 10],
  ['2028-09-11', 1428, 1822, 'Gen 19', 10]
];

// How to earn points: [event id, day (0 = whole event), day name, task, points (empty = note)].
// Copied from the game in Nov 2026; setup writes it to the PointSources tab, which is what the app reads.
const STARTING_POINT_SOURCES = [
  ['svs-prep', 1, 'City Construction', 'Raise Chief Charm max score by 1', '71.4'],
  ['svs-prep', 1, 'City Construction', 'Use 1 Refined Fire Crystal to upgrade buildings', '30,600'],
  ['svs-prep', 1, 'City Construction', 'Use 1 Refined Fire Crystal for research', '30,600'],
  ['svs-prep', 1, 'City Construction', 'Use 1 Fire Crystal to upgrade buildings', '2,040'],
  ['svs-prep', 1, 'City Construction', 'Use 1 Fire Crystal Shard for research', '1,020'],
  ['svs-prep', 1, 'City Construction', 'Use 1m of speedups for construction (gem speedups excluded)', '30.6'],
  ['svs-prep', 1, 'City Construction', 'Use 1m of speedups for research (gem speedups excluded)', '30.6'],
  ['svs-prep', 1, 'City Construction', 'Use 1m of speedups for troop training/promotion (gem speedups excluded)', '30.6'],
  ['svs-prep', 1, 'City Construction', 'Use 1m of speedups to learn Expert skills (gem speedups excluded)', '30.6'],
  ['svs-prep', 2, 'Basic Skills Up', 'Use 1 Refined Fire Crystal to upgrade buildings', '30,600'],
  ['svs-prep', 2, 'Basic Skills Up', 'Use 1 Refined Fire Crystal for research', '30,600'],
  ['svs-prep', 2, 'Basic Skills Up', 'Use 1 Fire Crystal to upgrade buildings', '2,040'],
  ['svs-prep', 2, 'Basic Skills Up', 'Use 1 Fire Crystal Shard for research', '1,020'],
  ['svs-prep', 2, 'Basic Skills Up', 'Use 1m of speedups for construction (gem speedups excluded)', '30.6'],
  ['svs-prep', 2, 'Basic Skills Up', 'Use 1m of speedups for research (gem speedups excluded)', '30.6'],
  ['svs-prep', 2, 'Basic Skills Up', 'Use 1m of speedups for troop training/promotion (gem speedups excluded)', '30.6'],
  ['svs-prep', 2, 'Basic Skills Up', 'Use 1m of speedups to learn Expert skills (gem speedups excluded)', '30.6'],
  ['svs-prep', 2, 'Basic Skills Up', 'Play Lucky Wheel 1 time', '8,160'],
  ['svs-prep', 2, 'Basic Skills Up', 'Use 1 Rare Hero Shard to ascend heroes', '357'],
  ['svs-prep', 2, 'Basic Skills Up', 'Use 1 Epic Hero Shard to ascend heroes', '1,244.4'],
  ['svs-prep', 2, 'Basic Skills Up', 'Use 1 Mythic Hero Shard to ascend heroes', '3,100.8'],
  ['svs-prep', 2, 'Basic Skills Up', 'Gather 1,000 Meat in the wilderness', '2'],
  ['svs-prep', 2, 'Basic Skills Up', 'Gather 1,000 Wood in the wilderness', '2'],
  ['svs-prep', 2, 'Basic Skills Up', 'Gather 200 Coal in the wilderness', '2'],
  ['svs-prep', 2, 'Basic Skills Up', 'Gather 50 Iron in the wilderness', '2'],
  ['svs-prep', 2, 'Basic Skills Up', 'Use any 1 Expert Sigil (excluding Common Sigils)', '6,120'],
  ['svs-prep', 2, 'Basic Skills Up', 'Use 1 Book of Knowledge', '61.2'],
  ['svs-prep', 3, 'Beast Slay', 'Pet advancement score +1', '51'],
  ['svs-prep', 3, 'Beast Slay', 'Use 1 Advanced Wild Mark to refine pets', '15,300'],
  ['svs-prep', 3, 'Beast Slay', 'Use 1 Common Wild Mark to refine pets', '1,173'],
  ['svs-prep', 3, 'Beast Slay', 'Raise Chief Charm max score by 1', '71.4'],
  ['svs-prep', 3, 'Beast Slay', 'Play Lucky Wheel 1 time', '8,160'],
  ['svs-prep', 3, 'Beast Slay', 'Use 1 Rare Hero Shard to ascend heroes', '357'],
  ['svs-prep', 3, 'Beast Slay', 'Use 1 Epic Hero Shard to ascend heroes', '1,244.4'],
  ['svs-prep', 3, 'Beast Slay', 'Use 1 Mythic Hero Shard to ascend heroes', '3,100.8'],
  ['svs-prep', 3, 'Beast Slay', 'Call a rally and hunt down 1 Polar Terror', '30,600'],
  ['svs-prep', 3, 'Beast Slay', 'Defeat 1 Lv. 1–10 beast', '9,180'],
  ['svs-prep', 3, 'Beast Slay', 'Defeat 1 Lv. 11–15 beast', '9,945'],
  ['svs-prep', 3, 'Beast Slay', 'Defeat 1 Lv. 16–20 beast', '10,710'],
  ['svs-prep', 3, 'Beast Slay', 'Defeat 1 Lv. 21–25 beast', '11,475'],
  ['svs-prep', 3, 'Beast Slay', 'Defeat 1 Lv. 26–30 beast', '12,240'],
  ['svs-prep', 3, 'Beast Slay', 'Use any 1 Expert Sigil (excluding Common Sigils)', '6,120'],
  ['svs-prep', 3, 'Beast Slay', 'Use 1 Book of Knowledge', '61.2'],
  ['svs-prep', 3, 'Beast Slay', 'Use 1m of speedups to learn Expert skills (gem speedups excluded)', '30.6'],
  ['svs-prep', 4, 'Hero Development', 'Raise Chief Charm max score by 1', '71.4'],
  ['svs-prep', 4, 'Hero Development', 'Use 1 Hero Gear Essence Stone', '4,080'],
  ['svs-prep', 4, 'Hero Development', 'Use 1 Widget of any Hero Exclusive Gear', '8,160'],
  ['svs-prep', 4, 'Hero Development', 'Use 1 Mithril', '146,880'],
  ['svs-prep', 4, 'Hero Development', 'Train 1 Lv. 1 troop', '3.1'],
  ['svs-prep', 4, 'Hero Development', 'Train 1 Lv. 2 troop', '4.1'],
  ['svs-prep', 4, 'Hero Development', 'Train 1 Lv. 3 troop', '5.1'],
  ['svs-prep', 4, 'Hero Development', 'Train 1 Lv. 4 troop', '8.2'],
  ['svs-prep', 4, 'Hero Development', 'Train 1 Lv. 5 troop', '12.2'],
  ['svs-prep', 4, 'Hero Development', 'Train 1 Lv. 6 troop', '18.4'],
  ['svs-prep', 4, 'Hero Development', 'Train 1 Lv. 7 troop', '25.5'],
  ['svs-prep', 4, 'Hero Development', 'Train 1 Lv. 8 troop', '35.7'],
  ['svs-prep', 4, 'Hero Development', 'Train 1 Lv. 9 troop', '45.9'],
  ['svs-prep', 4, 'Hero Development', 'Train 1 Lv. 10 troop', '61.2'],
  ['svs-prep', 4, 'Hero Development', 'Train 1 Lv. 11 troop', '76.5'],
  ['svs-prep', 4, 'Hero Development', 'Train 1 Lv. 12 troop', '95.9'],
  ['svs-prep', 4, 'Hero Development', 'Promoting troops gives the difference between the two training levels.', ''],
  ['svs-prep', 5, 'Power Boost', 'Pet advancement score +1', '51'],
  ['svs-prep', 5, 'Power Boost', 'Use 1 Advanced Wild Mark to refine pets', '15,300'],
  ['svs-prep', 5, 'Power Boost', 'Use 1 Common Wild Mark to refine pets', '1,173'],
  ['svs-prep', 5, 'Power Boost', 'Use 1 Mithril', '146,880'],
  ['svs-prep', 5, 'Power Boost', 'Raise max Chief Gear score by 1 (excluding Charm)', '36.7'],
  ['svs-prep', 5, 'Power Boost', 'Use 1 Hero Gear Essence Stone', '4,080'],
  ['svs-prep', 5, 'Power Boost', 'Use 1 Widget of any Hero Exclusive Gear', '8,160'],
  ['svs-prep', 5, 'Power Boost', 'Use 1 Refined Fire Crystal to upgrade buildings', '30,600'],
  ['svs-prep', 5, 'Power Boost', 'Use 1 Refined Fire Crystal for research', '30,600'],
  ['svs-prep', 5, 'Power Boost', 'Use 1 Fire Crystal to upgrade buildings', '2,040'],
  ['svs-prep', 5, 'Power Boost', 'Use 1 Fire Crystal Shard for research', '1,020'],
  ['svs-prep', 5, 'Power Boost', 'Use 1m of speedups for construction (gem speedups excluded)', '30.6'],
  ['svs-prep', 5, 'Power Boost', 'Use 1m of speedups for research (gem speedups excluded)', '30.6'],
  ['svs-prep', 5, 'Power Boost', 'Use 1m of speedups for troop training/promotion (gem speedups excluded)', '30.6'],
  ['svs-prep', 5, 'Power Boost', 'Use 1m of speedups to learn Expert skills (gem speedups excluded)', '30.6'],
  ['svs-battle', 0, '', 'Defeat 1 enemy Lv. 1–2 troop', '1'],
  ['svs-battle', 0, '', 'Defeat 1 enemy Lv. 3 troop', '2'],
  ['svs-battle', 0, '', 'Defeat 1 enemy Lv. 4 troop', '3'],
  ['svs-battle', 0, '', 'Defeat 1 enemy Lv. 5 troop', '4'],
  ['svs-battle', 0, '', 'Defeat 1 enemy Lv. 6 troop', '5'],
  ['svs-battle', 0, '', 'Defeat 1 enemy Lv. 7 troop', '7'],
  ['svs-battle', 0, '', 'Defeat 1 enemy Lv. 8 troop', '9'],
  ['svs-battle', 0, '', 'Defeat 1 enemy Lv. 9 troop', '11'],
  ['svs-battle', 0, '', 'Defeat 1 enemy Lv. 10 troop', '13'],
  ['svs-battle', 0, '', 'Defeat 1 enemy Lv. 11 troop', '15'],
  ['svs-battle', 0, '', 'Lose 1 of your own troops to the other state: same points as defeating that level', ''],
  ['svs-battle', 0, '', 'Hold Sunfire Castle or a Turret: per 1,000 power, every 60 seconds', '1'],
  ['castle-battle', 0, '', 'Carnage points: defeating enemies in the fight for Sunfire Castle and Turrets', ''],
  ['castle-battle', 0, '', "Occupation points: based on your troops' power while occupying Sunfire Castle or Turrets", ''],
  ['castle-battle', 0, '', 'Casualty points: based on your severely injured or lost troops', '']
];

// Points added after the first version. Each has a fixed id, so it is added once to sheets made earlier.
// Brothers in Arms (from guides, not seen in game yet): same wording as SvS Battle.
const ADDED_POINT_SOURCES = [
  { id: 'pbia1', eventTypeId: 'bia', dayNumber: '', dayName: '', task: 'Defeat 1 enemy Lv. 1–2 troop', points: '1', sortOrder: '501' },
  { id: 'pbia2', eventTypeId: 'bia', dayNumber: '', dayName: '', task: 'Defeat 1 enemy Lv. 3 troop', points: '2', sortOrder: '502' },
  { id: 'pbia3', eventTypeId: 'bia', dayNumber: '', dayName: '', task: 'Defeat 1 enemy Lv. 4 troop', points: '3', sortOrder: '503' },
  { id: 'pbia4', eventTypeId: 'bia', dayNumber: '', dayName: '', task: 'Defeat 1 enemy Lv. 5 troop', points: '4', sortOrder: '504' },
  { id: 'pbia5', eventTypeId: 'bia', dayNumber: '', dayName: '', task: 'Defeat 1 enemy Lv. 6 troop', points: '5', sortOrder: '505' },
  { id: 'pbia6', eventTypeId: 'bia', dayNumber: '', dayName: '', task: 'Defeat 1 enemy Lv. 7 troop', points: '7', sortOrder: '506' },
  { id: 'pbia7', eventTypeId: 'bia', dayNumber: '', dayName: '', task: 'Defeat 1 enemy Lv. 8 troop', points: '9', sortOrder: '507' },
  { id: 'pbia8', eventTypeId: 'bia', dayNumber: '', dayName: '', task: 'Defeat 1 enemy Lv. 9 troop', points: '11', sortOrder: '508' },
  { id: 'pbia9', eventTypeId: 'bia', dayNumber: '', dayName: '', task: 'Defeat 1 enemy Lv. 10 troop', points: '13', sortOrder: '509' },
  { id: 'pbia10', eventTypeId: 'bia', dayNumber: '', dayName: '', task: 'Defeat 1 enemy Lv. 11 troop', points: '15', sortOrder: '510' }
];

// Lists copied from the game: [day (0 = whole event), day name, task, points (empty = note), picture (optional)].
// Each list gets fixed ids from its prefix and the row's place, so new rows must go at the end of a list.
// list: '' for points, 'rules' for the event's Rules.
function pointRowsFrom_(idPrefix, eventTypeId, firstSortOrder, rows, list) {
  return rows.map(function (row, index) {
    return { id: idPrefix + (index + 1), eventTypeId: eventTypeId, dayNumber: row[0] ? String(row[0]) : '', dayName: row[1],
      task: row[2], points: row[3], sortOrder: String(firstSortOrder + index), list: list || '', imageFile: row[4] || '' };
  });
}

// Officer Project, from the 11–12 Nov run (the 15–16 Nov run has other rewards; its points are not checked yet).
const OFFICER_PROJECT_POINTS = [
  [0, '', 'Points seen in game for 11–12 Nov 2026.', ''],
  [0, '', 'Raise Chief Charm max score by 1', '70'],
  [0, '', 'Use 1 Hero Gear Essence Stone', '6,000'],
  [0, '', 'Use 1 Widget of any Hero Exclusive Gear', '12,000'],
  [0, '', 'Use 1 Mithril', '216,000'],
  [0, '', 'Train 1 Lv. 1 troop', '1'],
  [0, '', 'Train 1 Lv. 2 troop', '2'],
  [0, '', 'Train 1 Lv. 3 troop', '3'],
  [0, '', 'Train 1 Lv. 4 troop', '4'],
  [0, '', 'Train 1 Lv. 5 troop', '6'],
  [0, '', 'Train 1 Lv. 6 troop', '9'],
  [0, '', 'Train 1 Lv. 7 troop', '12'],
  [0, '', 'Train 1 Lv. 8 troop', '17'],
  [0, '', 'Train 1 Lv. 9 troop', '22'],
  [0, '', 'Train 1 Lv. 10 troop', '30'],
  [0, '', 'Train 1 Lv. 11 troop', '37'],
  [0, '', 'Train 1 Lv. 12 troop', '47'],
  [0, '', 'Promoting troops gives the difference between the two training levels.', '']
];

// Alliance Showdown, day by day (day 1 = Monday), in the game's order.
const SHOWDOWN_ESCORT = ['Escort 1 truck of any grade', '10,000'];
const SHOWDOWN_RAID = ['Raid 1 truck of any grade', '10,000'];
const SHOWDOWN_GEM = ['Use 1 Gem', '1'];
const SHOWDOWN_TOP_UP = ['Get 500 top-up points through payments (top-up, pack purchase, etc.)', '3,000'];
const SHOWDOWN_FIRE_CRYSTALS = [
  ['Use 1 Refined Fire Crystal to upgrade buildings', '18,750'],
  ['Use 1 Refined Fire Crystal for research', '18,750'],
  ['Use 1 Fire Crystal to upgrade buildings', '1,250'],
  ['Use 1 Fire Crystal Shard for research', '625']
];
const SHOWDOWN_SPEEDUPS = [
  ['Use 1m of speedups for construction (gem speedups excluded)', '18'],
  ['Use 1m of speedups for research (gem speedups excluded)', '18'],
  ['Use 1m of speedups for troop training/promotion (gem speedups excluded)', '18'],
  ['Use 1m of speedups to learn Expert skills (gem speedups excluded)', '18']
];
const SHOWDOWN_GATHERING = [
  ['Gather 2,000 Meat in the wilderness', '2'],
  ['Gather 2,000 Wood in the wilderness', '2'],
  ['Gather 400 Coal in the wilderness', '2'],
  ['Gather 100 Iron in the wilderness', '2']
];
const SHOWDOWN_HERO_SHARDS = [
  ['Use 1 Rare Hero Shard to ascend heroes', '210'],
  ['Use 1 Epic Hero Shard to ascend heroes', '750'],
  ['Use 1 Mythic Hero Shard to ascend heroes', '1,875']
];
const SHOWDOWN_PETS = [
  ['Pet advancement score +1', '30'],
  ['Use 1 Advanced Wild Mark to refine pets', '9,370'],
  ['Use 1 Common Wild Mark to refine pets', '680']
];
const SHOWDOWN_GEAR = [
  ['Use 1 Hero Gear Essence Stone', '1,875'],
  ['Use 1 Widget of any Hero Exclusive Gear', '3,750'],
  ['Use 1 Mithril', '67,500']
];
const SHOWDOWN_EXPERTS = [['Use any 1 Expert Sigil (excluding Common Sigils)', '3,600'], ['Use 1 Book of Knowledge', '36']];
const SHOWDOWN_CHARM = ['Raise Chief Charm max score by 1', '45'];
const SHOWDOWN_CHIEF_GEAR = ['Raise max Chief Gear score by 1 (excluding Charm)', '22'];
const SHOWDOWN_TRAINING = [1, 1, 2, 3, 4, 7, 10, 14, 18, 24, 30, 38].map(function (points, index) {
  return ['Train 1 Lv. ' + (index + 1) + ' troop', String(points)];
}).concat([['Promoting troops gives the difference between the two training levels.', '']]);
const SHOWDOWN_DAYS = [
  ['Rise of the City', [SHOWDOWN_ESCORT, SHOWDOWN_RAID].concat(SHOWDOWN_FIRE_CRYSTALS, SHOWDOWN_SPEEDUPS, SHOWDOWN_GATHERING,
    [SHOWDOWN_GEM], SHOWDOWN_EXPERTS, [SHOWDOWN_TOP_UP])],
  ['Hero Development', [SHOWDOWN_ESCORT, SHOWDOWN_RAID].concat(SHOWDOWN_HERO_SHARDS, SHOWDOWN_FIRE_CRYSTALS, SHOWDOWN_SPEEDUPS,
    [SHOWDOWN_GEM], SHOWDOWN_EXPERTS, [SHOWDOWN_TOP_UP])],
  ['Pet Training', [SHOWDOWN_ESCORT, SHOWDOWN_RAID, SHOWDOWN_CHARM].concat(SHOWDOWN_PETS, SHOWDOWN_GATHERING, [SHOWDOWN_GEM, SHOWDOWN_TOP_UP])],
  ['Gear Enhancement', [SHOWDOWN_ESCORT, SHOWDOWN_RAID, SHOWDOWN_CHARM].concat(SHOWDOWN_GEAR, SHOWDOWN_TRAINING, [SHOWDOWN_GEM, SHOWDOWN_TOP_UP])],
  ['Trade Dominion', [SHOWDOWN_ESCORT, SHOWDOWN_RAID, SHOWDOWN_CHIEF_GEAR].concat(SHOWDOWN_FIRE_CRYSTALS, SHOWDOWN_SPEEDUPS, [SHOWDOWN_GEM, SHOWDOWN_TOP_UP])],
  ['Full-Scale Competition', [SHOWDOWN_ESCORT, SHOWDOWN_RAID, SHOWDOWN_CHIEF_GEAR, SHOWDOWN_CHARM].concat(SHOWDOWN_GEAR, SHOWDOWN_HERO_SHARDS,
    SHOWDOWN_PETS, SHOWDOWN_FIRE_CRYSTALS, SHOWDOWN_SPEEDUPS, [SHOWDOWN_GEM, SHOWDOWN_TOP_UP])]
];
const SHOWDOWN_POINTS = [];
SHOWDOWN_DAYS.forEach(function (day, dayIndex) {
  day[1].forEach(function (row) { SHOWDOWN_POINTS.push([dayIndex + 1, day[0], row[0], row[1]]); });
});

// King of Icefield, stage by stage (seen in game 16 Nov 2026): one stage a day, day 1 = Monday. The rows are in the
// game's order, written like Alliance Showdown's.
const KOI_FIRE_CRYSTALS = [
  ['Use 1 Fire Crystal to upgrade buildings', '2,000'],
  ['Use 1 Fire Crystal Shard for research', '1,000'],
  ['Use 1 Refined Fire Crystal to upgrade buildings', '30,000'],
  ['Use 1 Refined Fire Crystal for research', '30,000']
];
const KOI_EXPERT_SPEEDUPS = ['Use 1m of speedups to learn Expert skills (gem speedups excluded)', '30'];
const KOI_SPEEDUPS = [
  KOI_EXPERT_SPEEDUPS,
  ['Use 1m of speedups for construction (gem speedups excluded)', '30'],
  ['Use 1m of speedups for research (gem speedups excluded)', '30'],
  ['Use 1m of speedups for troop training/promotion (gem speedups excluded)', '30']
];
const KOI_CHARM = ['Raise Chief Charm max score by 1', '70'];
const KOI_CHIEF_GEAR = ['Raise max Chief Gear score by 1 (excluding Charm)', '36'];
const KOI_EXPERTS = [['Use any 1 Expert Sigil (excluding Common Sigils)', '6,000'], ['Use 1 Book of Knowledge', '60']];
const KOI_LUCKY_WHEEL = ['Play Lucky Wheel 1 time', '8,000'];
const KOI_HERO_SHARDS = [
  ['Use 1 Rare Hero Shard to ascend heroes', '350'],
  ['Use 1 Epic Hero Shard to ascend heroes', '1,220'],
  ['Use 1 Mythic Hero Shard to ascend heroes', '3,040']
];
const KOI_GEAR = [['Use 1 Hero Gear Essence Stone', '4,000'], ['Use 1 Widget of any Hero Exclusive Gear', '8,000'], ['Use 1 Mithril', '144,000']];
const KOI_PETS = [['Pet advancement score +1', '50'], ['Use 1 Advanced Wild Mark to refine pets', '15,000'], ['Use 1 Common Wild Mark to refine pets', '1,150']];
const KOI_GATHERING = [
  ['Gather 2,000 Meat in the wilderness', '3'],
  ['Gather 2,000 Wood in the wilderness', '3'],
  ['Gather 400 Coal in the wilderness', '3'],
  ['Gather 100 Iron in the wilderness', '3']
];
const KOI_TRAINING = [1, 2, 3, 5, 7, 11, 16, 23, 30, 39, 49, 61].map(function (points, index) {
  return ['Train 1 Lv. ' + (index + 1) + ' troop', String(points)];
}).concat([['Promoting troops gives the difference between the two training levels.', '']]);
const KOI_STAGES = [
  ['City Construction', KOI_FIRE_CRYSTALS.concat(KOI_SPEEDUPS, [KOI_CHARM])],
  ['Hero Development', KOI_FIRE_CRYSTALS.concat(KOI_EXPERTS, KOI_SPEEDUPS, [KOI_LUCKY_WHEEL], KOI_HERO_SHARDS, KOI_GEAR)],
  ['Basic Skills Up', KOI_PETS.concat(KOI_EXPERTS, [KOI_EXPERT_SPEEDUPS, KOI_CHARM, KOI_LUCKY_WHEEL], KOI_HERO_SHARDS)],
  ['Combat Training', [KOI_CHARM].concat(KOI_GEAR, KOI_TRAINING)],
  ['Basic Skills Up', KOI_GEAR.concat(KOI_FIRE_CRYSTALS, KOI_SPEEDUPS)],
  ['Combat Training', [KOI_CHIEF_GEAR].concat(KOI_TRAINING)],
  ['Hero Development', KOI_PETS.concat(KOI_FIRE_CRYSTALS, KOI_SPEEDUPS, [KOI_CHIEF_GEAR], KOI_GATHERING, KOI_HERO_SHARDS)]
];
const KOI_POINTS = [];
KOI_STAGES.forEach(function (stage, stageIndex) {
  stage[1].forEach(function (row) { KOI_POINTS.push([stageIndex + 1, stage[0], row[0], row[1]]); });
});

// Vision of Dawn: coins from the daily tasks, and the rewards at each coin total.
const VISION_OF_DAWN_LIST = [
  [0, '', 'Daily tasks give coins:', ''],
  [0, '', 'Defeat 5 Beasts', '2'],
  [0, '', 'Defeat 15 Beasts', '4'],
  [0, '', 'Call a rally and hunt down 3 Polar Terrors', '2'],
  [0, '', 'Call a rally and hunt down 10 Polar Terrors', '4'],
  [0, '', 'Gather 3,000,000 resources', '2'],
  [0, '', 'Gather 10,000,000 resources', '4'],
  [0, '', 'Use Advanced Recruitment 10 times', '2'],
  [0, '', 'Use Epic Recruitment 10 times', '4'],
  [0, '', 'Use Epic Recruitment 30 times', '10'],
  [0, '', 'Make any payment 1 time', '20'],
  [0, '', 'Rewards at:', ''],
  [0, '', '10 coins: 1,000 Gems ×1, Chief Stamina ×5', ''],
  [0, '', '30 coins: 3h General Speedup ×1, Chief Stamina ×5', ''],
  [0, '', '50 coins: 100 Enhancement XP Component ×5, Chief Stamina ×5', ''],
  [0, '', '80 coins: Fire Crystal ×15, Chief Stamina ×5', ''],
  [0, '', '110 coins: War Chant Custom Chest ×3, Chief Stamina ×20', '']
];

// Hero's Mission: rewards by Reapers captured. {eventsHero} is the hero of 2 generations back.
const HEROS_MISSION_REWARDS = [
  [0, '', '1 Reaper: {eventsHero} Shard ×1, Lv.2 Custom Secured Resource Chest ×10', ''],
  [0, '', '3 Reapers: {eventsHero} Shard ×2, Lucky Hero Gear Chest ×1, Lv.2 Custom Secured Resource Chest ×10', ''],
  [0, '', '5 Reapers: {eventsHero} Shard ×2, Lucky Hero Gear Chest ×1, Lv.2 Custom Secured Resource Chest ×20', ''],
  [0, '', '7 Reapers: {eventsHero} Shard ×2, Essence Stones ×2, Lucky Hero Gear Chest ×1, Lv.2 Custom Secured Resource Chest ×20', ''],
  [0, '', '10 Reapers: {eventsHero} Shard ×3, Essence Stones ×3, Lucky Hero Gear Chest ×2, Lv.2 Custom Secured Resource Chest ×20', '']
];

// Wander Theater: the daily Wanderer Missions and the Bizarre Bazaar (stock in brackets).
const WANDER_THEATER_LIST = [
  [0, '', 'Wanderer Missions: the same 4 every day, refreshed at reset. They give Talismans of Ice, used for Protected Exploration in the Wander Theater.', ''],
  [0, '', 'Call a rally and hunt down 1 Polar Terror', '5'],
  [0, '', 'Make 5 Alliance Contributions', '5'],
  [0, '', 'Train or promote 30,000 troop power', '10'],
  [0, '', 'Make any payment 1 time', '20'],
  [0, '', 'Bizarre Bazaar (open 1 day after the missions end), prices in Wonderstar Coins. Coins left when the event ends turn into 1 Gem each.', ''],
  [0, '', 'Chief Gear Materials Chest ×1 (5 a day)', '180'],
  [0, '', 'Custom Mythic Hero Gear Chest ×1 (stock 2)', '16,000'],
  [0, '', 'Fire Crystal ×1 (stock 300)', '80'],
  [0, '', 'Common Expert Sigil ×1 (stock 500)', '640'],
  [0, '', 'Book of Knowledge ×100 (stock 500)', '740'],
  [0, '', 'Sail of Conquest ×1 (stock 500)', '640'],
  [0, '', 'Charm Secrets ×1 (stock 80)', '3,200'],
  [0, '', 'Charm Guide ×5 (stock 200)', '500'],
  [0, '', 'Charm Design ×5 (stock 200)', '500'],
  [0, '', 'Design Plans ×5 (stock 200)', '500'],
  [0, '', 'Polishing Solution ×25 (stock 200)', '500'],
  [0, '', 'Hardened Alloy ×2,500 (stock 200)', '500'],
  [0, '', 'Mythic General Hero Shard ×1 (stock 50)', '850'],
  [0, '', 'Lucky Hero Gear Chest ×1 (stock 1000)', '280'],
  [0, '', 'Essence Stones ×1 (stock 500)', '280'],
  [0, '', '100 Enhancement XP Component ×1 (stock 200)', '170'],
  [0, '', '1h General Speedup ×5 (stock 400)', '700'],
  [0, '', 'Lv.2 Custom Secured Resource Chest ×1 (stock 99999)', '100']
];

// Winter Siege: what applies to the whole event (each phase's instructions are under the phase).
// A note's title comes before the first ": " and shows bold above its text; lines after a line break that start
// with "Disabled:" or "Active:" show as two clearly different lines.
const WINTER_SIEGE_RULES = [
  [0, '', 'Winning:\nThe first alliance to take all of the enemy\'s Stars wins.\nIf neither does, the one with more Stars left wins.\nIf Stars are tied, the one with more Troop Power left in its strongholds wins.\nIf Troop Power is also tied, the alliance that lost its last Star later wins.\nIf both alliances start the Battle with the same number of Stars and end it with the same number, both lose.', ''],
  [0, '', 'Morale: Every defence a garrison squad wins lowers its Morale, and its stats with it, down to 60%. Losing a Heart restores it to 100%.', ''],
  [0, '', 'Bonuses:\nDisabled: Hero Exclusive Gear Skills, Territory bonuses, State Positions, President Skills, City bonuses, and Frostdragon Tyrant Titles\nEnabled: Pet skills - active by default.', ''],
  [0, '', 'Changing alliance: If a chief leaves the alliance during Preparation, their squads are removed from the strongholds. If they leave after Preparation, their squads stay in the strongholds and keep defending. In both cases, the chief can\'t take part in the event until they return to their original alliance.', ''],
  [0, '', 'Rewards: Rewards depend on the alliance\'s tier at the start of the event. They are handed out when the Battle ends, to everyone who is in the alliance at that moment. Winning two events in a row gives Win Streak rewards instead of Victory rewards. An alliance that gets no opponent at Matchmaking receives the Victory rewards straight away.', '']
];

// Alliance Showdown: its Rules (12 Nov 2026). Baldur's note shows his picture.
const SHOWDOWN_RULES = [
  [0, '', 'Winning:\nPersonal Points also count as Alliance Points for the chief\'s alliance.\nEach day, the alliance with more Alliance Points wins the day and earns Victory Points.\nThe alliance with the most Victory Points at the end wins the event.', ''],
  [0, '', 'Daily Chests: Personal Points from each day\'s objectives unlock the Daily Chests.', ''],
  [0, '', 'Baldur:\nDawn Hymn raises Alliance Showdown points by 5% per level, up to 50% at level 10, except for the Tundra Trade Route.\nDawn Hymn adds 1 extra Daily Chest tier, 2 from level 6 and 3 at level 10.', '', 'experts/baldur.png'],
  [0, '', 'MVP: Each day, the top-scoring chief of the winning alliance is the Daily MVP, or of both alliances if the day is tied. The top contributor of the winning side over the season is the Seasonal MVP. If chiefs tie on score, the one who reached it first is MVP.', ''],
  [0, '', 'Changing alliance: If a chief leaves the alliance, their Personal Points are kept and they can keep earning them for Daily Chests in another qualified alliance. Points for their original alliance and for the ranking only count again once they return to it.', ''],
  [0, '', 'Rewards:\nAlliance members are ranked by their total Personal Points, and a higher rank gives bigger Ranking rewards. Alliance Daily, Star and Ranking rewards go to the chiefs who are in the alliance when they are tallied. Ranking rewards are sent on Sunday at 12:00 UTC.\nRequirements for ranking rewards\nAlliance: 20,000,000 points\nPlayer: over 300,000 Personal Points', '']
];

// Tundra Arms League (16 Nov 2026): its Rules (Info tab), Predictions, Rewards and Missions notes.
const TAL_RULES = [
  [0, '', 'Sign-up:\nVoting for battle times runs Monday and Tuesday. Registration runs Wednesday to Friday, until 24:00 UTC, when the lists and battle times lock.\nEach legion registers up to 30 combatants, 20 substitutes and 3 battle times from 02:00, 07:00, 12:00, 14:00 and 19:00 UTC. The game sets each match\'s time from both legions\' picks.\nMembers send a Battle Request to one legion and can switch until registration ends. Legions are ranked by the Troop Power of their top 20 registered chiefs.', ''],
  [0, '', 'Elimination: The loser of each match is out, and the winner of each group of 16 reaches the Championship. The 2 with the most Net Wins Points (Alliance Arsenal Points minus the opponent\'s, over all Elimination matches) start in the Gold group and the other 2 in Silver. A legion without an opponent gets the zone\'s best Net Wins Points for that round.', ''],
  [0, '', 'Championship: A Gold winner stays in Gold and a Gold loser drops to Silver. A Silver winner moves up to Gold and a Silver loser is out. The top Gold and Silver legions play the final.', ''],
  [0, '', 'Foundry Battle: Combatants and substitutes cannot play Foundry Battle while their legion is in the tournament, except those knocked out in Elimination round 1. Results do not change the Foundry Battle Tier.', ''],
  [0, '', 'Pets: Battle-type pet skills are ready at 00:00 UTC on each battle day and again at 00:00 UTC the next day.', ''],
  [0, '', 'Watching: Chiefs of participating states can watch every match in every zone.', '']
];
const TAL_PREDICTIONS = [
  [0, '', 'Match Prediction: Match Prediction opens at 00:00 UTC on the day before each battle and closes when the battle starts. Players can predict up to 3 matches each round. A right prediction pays back double and a wrong one returns half, by mail after the match.', '', 'items/match-stake.png'],
  [0, '', 'Champion Prediction: Champion Prediction opens on Elimination round 3 and takes stakes only on the days without battles. Players can put up to 800 Champion Stakes on a legion of their zone each round, at ×16, ×8, ×4, ×3 and ×2 for the 5 rounds in order. If the legion is knocked out, half the stakes come back then and the rest after the final.', '', 'items/champion-stake.png'],
  [0, '', 'Prediction Shop: Match Stakes are spent in the Ordinary Shop and Champion Stakes in the Champion Shop, both open until the event ends.', '']
];
// Ids stay as they were: ptw1 and ptw2 are retired (see RETIRED_POINT_SOURCES), ptw3 is the Advancement note.
const TAL_REWARD_NOTES = [
  [0, '', 'Combatant Rewards: Combatants and substitutes get them after each battle, based on the legion\'s performance and their own.', ''],
  [0, '', 'Ranking rewards: These are sent at 24:00 UTC on the day the legion is knocked out or wins the title. Legion Ranking Rewards go to its combatants and substitutes. Alliance Ranking Rewards go to the members in its alliance at that time.', ''],
  [0, '', 'Championship Advancement Rewards: Every member of the legion\'s alliance gets them right after all Elimination round 4 battles, if the legion advances. Members who left the alliance before then get none.', '']
];
// A note shown above one list of the Rewards tab: its day name holds the list and the band ("ranking|Legion").
const TAL_REWARD_LIST_NOTES = [
  [0, 'ranking|Legion', 'Sent to the legion\'s combatants and substitutes at 24:00 UTC on every match day, after the league rankings are calculated.', ''],
  [0, 'ranking|Alliance', 'Sent to all members of the legion\'s alliance at 24:00 UTC on every match day, after the league rankings are calculated.', ''],
  [0, 'ranking|State Rewards', 'Chiefs at Furnace 20 or higher in the states of the top 4 legions claim them once the Hall of Heroism begins.', '']
];
// Notes no longer used, removed while nobody has edited them: the Combatant and Ranking notes (16 Nov 2026), now
// shown by the Rewards tab's lists themselves.
const RETIRED_POINT_SOURCES = ['ptw1', 'ptw2'];

function removeRetiredPointSources_() {
  RETIRED_POINT_SOURCES.forEach(function (id) {
    const starting = GAME_LISTS_NOV_11.filter(function (row) { return row.id === id; })[0];
    deleteRows_('PointSources', function (row) { return row.id === id && row.task === starting.task && row.list === starting.list; });
  });
}
const TAL_MISSION_NOTES = [
  [0, '', 'Match Missions run from the first Monday until the event ends. Daily missions refresh at 00:00 UTC, and weekly missions at 00:00 UTC on Mondays.', '']
];

// Added once each to every sheet (fixed ids), after the first points.
const GAME_LISTS_NOV_11 = pointRowsFrom_('poff', 'officer-project', 601, OFFICER_PROJECT_POINTS)
  .concat(pointRowsFrom_('psd', 'showdown', 701, SHOWDOWN_POINTS))
  .concat(pointRowsFrom_('pvod', 'vision-of-dawn', 901, VISION_OF_DAWN_LIST))
  .concat(pointRowsFrom_('phm', 'heros-mission', 951, HEROS_MISSION_REWARDS))
  .concat(pointRowsFrom_('pwt', 'wander-theater', 1001, WANDER_THEATER_LIST))
  .concat(pointRowsFrom_('pws', 'winter-siege', 1101, WINTER_SIEGE_RULES, 'rules'))
  .concat(pointRowsFrom_('psr', 'showdown', 1201, SHOWDOWN_RULES, 'rules'))
  .concat(pointRowsFrom_('ptr', 'hellfire', 1301, TAL_RULES, 'rules'))
  .concat(pointRowsFrom_('ptp', 'hellfire', 1321, TAL_PREDICTIONS, 'predictions'))
  .concat(pointRowsFrom_('ptw', 'hellfire', 1341, TAL_REWARD_NOTES, 'rewards'))
  .concat(pointRowsFrom_('ptm', 'hellfire', 1361, TAL_MISSION_NOTES, 'missions'))
  .concat(pointRowsFrom_('ptl', 'hellfire', 1351, TAL_REWARD_LIST_NOTES, 'rewards'))
  .concat(pointRowsFrom_('pkoi', 'koi', 1401, KOI_POINTS));

// Steps inside events: [event id, day of the event (1 = first day), start UTC, end UTC, step].
// Icefire Warhymn League from the in-game schedule guide; Tundra Arms League match days are a best guess (check them).
const STARTING_EVENT_STEPS = [
  ['icefire-league', 1, '', '', 'Sign-up'],
  ['icefire-league', 2, '', '', 'Sign-up'],
  ['icefire-league', 3, '12:00', '21:00', 'Qualifier'],
  ['icefire-league', 4, '10:00', '', 'Elimination round 1'],
  ['icefire-league', 4, '16:00', '', 'Elimination round 2'],
  ['icefire-league', 4, '22:00', '', 'Elimination round 3'],
  ['icefire-league', 5, '11:00', '', 'Pinnacle round 1 (top 8)'],
  ['icefire-league', 5, '23:00', '', 'Pinnacle round 2 (top 4)'],
  ['icefire-league', 6, '11:00', '', 'Final'],
  ['hellfire', 10, '', '', 'Elimination round 1'],
  ['hellfire', 12, '', '', 'Elimination round 2'],
  ['hellfire', 14, '', '', 'Elimination round 3'],
  ['hellfire', 16, '', '', 'Elimination round 4'],
  ['hellfire', 18, '', '', 'Championship round 1'],
  ['hellfire', 20, '', '', 'Championship round 2'],
  ['hellfire', 22, '', '', 'Championship round 3'],
  ['wild-brawl', 1, '', '', '4 matchmaking windows of 2 hours (times to add)'],
  ['wild-brawl', 2, '', '', '4 matchmaking windows of 2 hours (times to add)'],
  // Added November 2026. New steps always go at the end so the ids of the older ones stay the same.
  // Frostdragon Tyrant, day 1 = Monday of sign-up.
  ['tyrant', 1, '', '', 'Alliance sign-up (be in the right alliance before it starts)'],
  ['tyrant', 2, '', '', 'Alliance sign-up'],
  ['tyrant', 3, '', '', 'Combatant dispatch (member registration)'],
  ['tyrant', 4, '', '', 'Combatant dispatch'],
  ['tyrant', 5, '', '', 'Eve of battle'],
  ['tyrant', 6, '', '', 'Eve of battle'],
  ['tyrant', 7, '11:00', '18:00', 'Battlefield open'],
  ['tyrant', 7, '12:00', '18:00', 'Capital can be taken'],
  ['tyrant', 8, '', '', 'Rearmament'],
  ['tyrant', 9, '', '', 'Rearmament'],
  // Tundra Arms League, day 1 = Saturday of the preview.
  ['hellfire', 1, '', '', 'Preview'],
  ['hellfire', 2, '', '', 'Preview'],
  ['hellfire', 3, '', '', 'Voting (be in the right alliance before sign-up)'],
  ['hellfire', 4, '', '', 'Voting'],
  ['hellfire', 5, '', '', 'Legion sign-up (alliance registration)'],
  ['hellfire', 6, '', '', 'Legion sign-up and member selection'],
  ['hellfire', 7, '', '', 'Member selection closes (combatants and substitutes)'],
  ['hellfire', 8, '', '', 'Matchmaking'],
  ['hellfire', 9, '', '', 'Predictions for round 1'],
  ['hellfire', 11, '', '', 'Predictions for round 2'],
  ['hellfire', 13, '', '', 'Predictions for round 3'],
  ['hellfire', 15, '', '', 'Predictions for round 4'],
  ['hellfire', 17, '', '', 'Predictions for the championship round 1'],
  ['hellfire', 19, '', '', 'Predictions for the championship round 2'],
  ['hellfire', 21, '', '', 'Predictions for the championship round 3'],
  // Foundry, day 1 = Monday; battle on Sunday.
  ['foundry', 1, '', '', 'Voting'],
  ['foundry', 2, '', '', 'Voting'],
  ['foundry', 3, '', '', 'Legion registration (be in the right alliance before it ends)'],
  ['foundry', 4, '', '', 'Legion registration'],
  ['foundry', 5, '', '', 'Matchmaking'],
  ['foundry', 6, '', '', 'Matchmaking'],
  ['foundry', 7, '', '', 'Battle (each legion at its own time)'],
  // Canyon Clash, day 1 = Monday; battle on Saturday.
  ['canyon', 1, '', '', 'Voting'],
  ['canyon', 2, '', '', 'Voting'],
  ['canyon', 3, '', '', 'Legion registration (be in the right alliance before it ends)'],
  ['canyon', 4, '', '', 'Legion registration'],
  ['canyon', 5, '', '', 'Matchmaking'],
  ['canyon', 6, '', '', 'Battle (each legion at its own time)'],
  // Icefire Warhymn League: each prediction round closes when its match starts (seen in game, 5 Nov 2026).
  // Match 1: open from 00:00. Match 2: opens when match 1 starts.
  ['icefire-league', 4, '00:00', '10:00', 'Predictions for elimination match 1'],
  ['icefire-league', 4, '10:00', '16:00', 'Predictions for elimination match 2'],
  // Transfers run 7 days from the transfer date.
  ['transfer', 1, '', '', 'Pre-transfer (no moves yet)'],
  ['transfer', 2, '', '', 'Pre-transfer'],
  ['transfer', 3, '', '', 'Pre-transfer'],
  ['transfer', 4, '', '', 'Invitational transfer'],
  ['transfer', 5, '', '', 'Invitational transfer'],
  ['transfer', 6, '', '', 'Open transfer'],
  ['transfer', 7, '', '', 'Open transfer'],
  // Alliance Championship, day 1 = Monday. Each round: adjust lanes, then the battle (lanes lock when it starts).
  ['alliance-championship', 2, '23:00', '00:00', 'Matchmaking'],
  ['alliance-championship', 3, '00:00', '11:00', 'Round 1 · Adjust lanes', ALLIANCE_CHAMPIONSHIP_LANES_NOTE],
  ['alliance-championship', 3, '11:00', '12:00', 'Round 1 · Battle', ALLIANCE_CHAMPIONSHIP_BATTLE_NOTE],
  ['alliance-championship', 3, '12:00', '23:00', 'Round 2 · Adjust lanes', ALLIANCE_CHAMPIONSHIP_LANES_NOTE],
  ['alliance-championship', 3, '23:00', '00:00', 'Round 2 · Battle', ALLIANCE_CHAMPIONSHIP_BATTLE_NOTE],
  ['alliance-championship', 4, '00:00', '11:00', 'Round 3 · Adjust lanes', ALLIANCE_CHAMPIONSHIP_LANES_NOTE],
  ['alliance-championship', 4, '11:00', '12:00', 'Round 3 · Battle', ALLIANCE_CHAMPIONSHIP_BATTLE_NOTE],
  ['alliance-championship', 4, '12:00', '23:00', 'Round 4 · Adjust lanes', ALLIANCE_CHAMPIONSHIP_LANES_NOTE],
  ['alliance-championship', 4, '23:00', '00:00', 'Round 4 · Battle', ALLIANCE_CHAMPIONSHIP_BATTLE_NOTE],
  ['alliance-championship', 5, '00:00', '11:00', 'Round 5 · Adjust lanes', ALLIANCE_CHAMPIONSHIP_LANES_NOTE],
  ['alliance-championship', 5, '11:00', '12:00', 'Round 5 · Battle', ALLIANCE_CHAMPIONSHIP_BATTLE_NOTE],
  // Fortress Battles, day 1 = Tuesday; battles on Friday.
  ['fortress-battles', 1, '', '', 'Registration (until Thursday 24:00 UTC)'],
  ['fortress-battles', 2, '', '', 'Registration'],
  ['fortress-battles', 3, '', '', 'Registration closes at reset (24:00 UTC)'],
  ['fortress-battles', 4, '', '', 'Battles: each fortress and stronghold at its own time'],
  // Winter Siege, day 1 = Monday.
  ['winter-siege', 2, '23:00', '00:00', 'Matchmaking (you stay with the alliance you are in now)'],
  // Alliance Showdown day themes (seen in game, Nov 2026), day 1 = Monday. Day 6 runs until Sunday 12:00.
  ['showdown', 1, '', '', 'Rise of the City'],
  ['showdown', 2, '', '', 'Hero Development'],
  ['showdown', 3, '', '', 'Pet Training'],
  ['showdown', 4, '', '', 'Gear Enhancement'],
  ['showdown', 5, '', '', 'Trade Dominion'],
  ['showdown', 6, '', '', 'Full-Scale Competition'],
  // Trade Route: after Sunday's reset no trucks can be sent; trucks on the road arrive until 04:00 (st88).
  ['trade-route', 7, '00:00', '', 'No more trucks can be sent'],
  // Added 12 Nov 2026. Day 0 = the day before the event: Showdown's matchmaking, Sunday 23:00 UTC.
  ['showdown', 0, '23:00', '', 'Matchmaking', SHOWDOWN_MATCHMAKING_NOTE],
  // Flame and Fangs: no longer used, the event and its shop end together after day 2 (see RETIRED_TIMED_STEP_IDS).
  ['flame-and-fang', 3, '00:00', '', 'Crystallite Cores can no longer be collected', '', true],
  // Added 17 Nov 2026: Alliance Championship rewards come by mail when round 5 ends (Friday 12:00 UTC).
  ['alliance-championship', 5, '12:00', '', 'Rewards sent by mail', 'Only members in the alliance at this time get them.']
];

// Phases of events: [event id, from day, to day, name, true = no bar of its own (shown on the event's page only)].
// Day 1 = the first day of the event. Each phase is its own bar in the calendar.
const STARTING_EVENT_PHASES = [
  ['alliance-championship', 1, 2, 'Registration', false, '', '', ALLIANCE_CHAMPIONSHIP_REGISTRATION_NOTE],
  ['alliance-championship', 3, 5, 'Battles'],
  ['fortress-battles', 1, 3, 'Registration'],
  ['fortress-battles', 4, 4, 'Battles'],
  // Foundry and Canyon: players vote and register; the legion battles show as each alliance's times.
  ['foundry', 1, 2, 'Voting'],
  ['foundry', 3, 4, 'Registration'],
  ['foundry', 5, 6, 'Matchmaking', true],
  ['foundry', 7, 7, 'Battle', true],
  ['canyon', 1, 2, 'Voting'],
  ['canyon', 3, 4, 'Registration'],
  ['canyon', 5, 5, 'Matchmaking', true],
  ['canyon', 6, 6, 'Battle', true],
  ['hellfire', 1, 2, 'Preview'],
  ['hellfire', 3, 4, 'Voting'],
  ['hellfire', 5, 7, 'Sign-up'],
  ['hellfire', 8, 8, 'Matchmaking'],
  ['hellfire', 9, 16, 'Elimination'],
  ['hellfire', 17, 23, 'Championship'],
  ['icefire-league', 1, 2, 'Sign-up'],
  ['icefire-league', 3, 3, 'Qualifier'],
  ['icefire-league', 4, 4, 'Elimination'],
  ['icefire-league', 5, 5, 'Pinnacle'],
  ['icefire-league', 6, 6, 'Final'],
  ['tyrant', 1, 2, 'Sign-up'],
  ['tyrant', 3, 4, 'Combatant dispatch'],
  ['tyrant', 5, 6, 'Eve of battle'],
  ['tyrant', 7, 7, 'Battle'],
  ['tyrant', 8, 9, 'Rearmament'],
  ['transfer', 1, 3, 'Pre-Transfer'],
  ['transfer', 4, 5, 'Invitational Transfer'],
  ['transfer', 6, 7, 'Open Transfer'],
  ['winter-siege', 1, 2, 'Preview', false, '', '23:00'],
  ['winter-siege', 3, 4, 'Preparation', false, '', '', WINTER_SIEGE_PREPARATION_NOTE],
  ['winter-siege', 5, 5, 'Scout'],
  ['winter-siege', 6, 6, 'Battle', false, '', '', WINTER_SIEGE_BATTLE_NOTE],
  ['frosty-fortune', 1, 7, 'Treasure Hunt Drill and Frosty Fortune'],
  ['frosty-fortune', 8, 8, 'Emporium of Enigma (shop)'],
  ['flame-and-fang', 1, 2, 'Collect cores'],
  ['flame-and-fang', 3, 3, 'Exchange'],
  // Added 11 Nov 2026 (new phases always go at the end). Wander Theater's two are no longer used (see RETIRED_PHASE_IDS).
  ['wander-theater', 1, 6, 'Wanderer Missions'],
  ['wander-theater', 7, 7, 'Bizarre Bazaar (shop)'],
  ['winter-siege', 7, 7, 'Results'],
  // Winter Siege's Matchmaking, one hour (the game lists it as a phase). No bar of its own.
  ['winter-siege', 2, 2, 'Matchmaking', true, '23:00', '00:00', WINTER_SIEGE_MATCHMAKING_NOTE]
];

// Fortress Battles: reward of each fortress / stronghold in phases 1–8 (from the Fort Distribution sheet, Phase_Rewards).
// How much of each Fortress reward a fortress or stronghold gives, and its tile colour (Battle Rewards, seen in game
// 16 Nov 2026). Hero shards: 420 seen for a stronghold; fortresses are assumed the same until seen.
const FORT_REWARD_AMOUNTS = {
  '1h General Speedup': ['400', 'blue'], 'Common Wild Mark': ['600', 'blue'], 'Enhancement XP Component': ['500', 'purple'],
  'Advanced Teleporter': ['90', 'purple'], 'Troops Health UP II': ['60', 'orange'], 'Troops Damage UP II': ['60', 'orange'],
  'Deployment Capacity Boost II': ['60', 'orange'], 'Lucky Hero Gear Chest': ['150', 'orange'],
  'Pet Advancement Materials Custom Chest': ['100', 'orange'], 'Fire Crystals': ['600', 'orange']
};
const FORT_HERO_SHARD_AMOUNT = ['420', 'orange'];

// The quantity and tile of a Fortress reward, by its name. Unknown rewards: empty.
function fortRewardAmount_(rewardName) {
  const name = String(rewardName || '').trim();
  const amount = FORT_REWARD_AMOUNTS[name] || (/ Shards$/.test(name) ? FORT_HERO_SHARD_AMOUNT : ['', '']);
  return { quantity: amount[0], tile: amount[1] };
}

// Older sheets: each Fortress reward without a quantity and tile gets them from its name (cells someone filled stay).
function fillFortRewardAmounts_() {
  readTable_('FortRewards').forEach(function (row) {
    const amount = fortRewardAmount_(row.reward);
    const change = { id: row.id };
    let hasChange = false;
    if (!row.quantity && amount.quantity) { change.quantity = amount.quantity; hasChange = true; }
    if (!row.tile && amount.tile) { change.tile = amount.tile; hasChange = true; }
    if (hasChange) upsertRow_('FortRewards', 'id', change);
  });
}

// Dates of past seasons that the game moved, seen in guides (17 Nov 2026): Tundra Arms League season 5 started on Monday
// 20 Jul 2026 (preview Saturday 18 Jul), a week later than 16 weeks before 31 Oct. As the season's dates are irregular,
// this move also moves the earlier predicted seasons (to 28 Mar 2026 and 6 Dec 2025). Added once, only where that date
// has no change yet: [id, schedule, planned date, actual date].
const STARTING_DATE_CHANGES = [['dc-tal-2026-07-11', 's-hellfire', '2026-07-11', '2026-07-18']];

function addStartingDateChanges_() {
  const existing = readTable_('DateChanges');
  STARTING_DATE_CHANGES.forEach(function (change) {
    const isTaken = existing.some(function (row) { return row.id === change[0] || (row.scheduleId === change[1] && row.originalDate === change[2]); });
    if (!isTaken) appendRows_('DateChanges', [{ id: change[0], scheduleId: change[1], originalDate: change[2], newDate: change[3] }]);
  });
}

// Mercenary Prestige: alliance boss times were set on Sat 7 Nov, a week before the event (14–16 Nov). They move to its
// last day, Mon 16 Nov, where nobody changed them yet (still the old date, every 4 weeks, at 00:00).
function moveMercenaryAllianceTimes_() {
  readTable_('Schedules').forEach(function (row) {
    if (row.eventTypeId === 'mercenaries' && row.allianceIds && row.firstDate === '2026-11-07' && row.repeatEveryDays === '28' &&
        (row.startTimeUtc === '00:00' || !row.startTimeUtc)) {
      upsertRow_('Schedules', 'id', { id: row.id, firstDate: '2026-11-16' });
    }
  });
}

// Who held each fortress and stronghold after the battles of Fri 6 Nov 2026 (phase 2 of the season starting 30 Oct),
// seen in game. Added only where nobody has set that fort and phase yet.
const STARTING_FORT_HOLDERS = {
  seasonStart: '2026-10-30', phase: '2',
  holders: { F1: 'top', F2: 'ruu', F3: 'ruu', F4: 'sky', F5: 'dvl', F6: 'sky', F7: 'fun', F8: 'top', F9: 'dvl-academy', F10: 'top-academy',
    F11: 'fun', F12: 'dvl', SH1: 'sky', SH2: 'dvl', SH3: 'top', SH4: 'fun' }
};

function addStartingFortHolders_() {
  const existing = readTable_('FortHolders').filter(function (row) {
    return row.seasonStart === STARTING_FORT_HOLDERS.seasonStart && String(row.phase) === STARTING_FORT_HOLDERS.phase;
  }).map(function (row) { return row.fort; });
  const allianceIds = readTable_('Alliances').map(function (row) { return row.id; });
  const newRows = Object.keys(STARTING_FORT_HOLDERS.holders).filter(function (fort) {
    return existing.indexOf(fort) === -1 && allianceIds.indexOf(STARTING_FORT_HOLDERS.holders[fort]) !== -1;
  }).map(function (fort) {
    return { id: 'fh-' + STARTING_FORT_HOLDERS.seasonStart + '-' + STARTING_FORT_HOLDERS.phase + '-' + fort, seasonStart: STARTING_FORT_HOLDERS.seasonStart,
      fort: fort, phase: STARTING_FORT_HOLDERS.phase, allianceId: STARTING_FORT_HOLDERS.holders[fort], battleTimeUtc: '' };
  });
  if (newRows.length) appendRows_('FortHolders', newRows);
}

const STARTING_FORT_REWARDS = [
  ['F1', 'Fred Shards', 'Troops Health UP II', '1h General Speedup', 'Advanced Teleporter', 'Common Wild Mark', 'Troops Health UP II', '1h General Speedup', 'Enhancement XP Component'],
  ['F2', 'Advanced Teleporter', 'Fred Shards', 'Troops Health UP II', 'Enhancement XP Component', 'Enhancement XP Component', 'Common Wild Mark', 'Troops Health UP II', '1h General Speedup'],
  ['F3', '1h General Speedup', 'Advanced Teleporter', 'Blanchette Shards', 'Troops Health UP II', '1h General Speedup', 'Enhancement XP Component', 'Common Wild Mark', 'Troops Health UP II'],
  ['F4', 'Troops Health UP II', '1h General Speedup', 'Advanced Teleporter', 'Common Wild Mark', 'Advanced Teleporter', '1h General Speedup', 'Enhancement XP Component', 'Common Wild Mark'],
  ['F5', 'Fred Shards', 'Troops Damage UP II', '1h General Speedup', 'Enhancement XP Component', 'Common Wild Mark', 'Troops Damage UP II', '1h General Speedup', 'Enhancement XP Component'],
  ['F6', 'Advanced Teleporter', 'Fred Shards', 'Troops Damage UP II', '1h General Speedup', 'Enhancement XP Component', 'Common Wild Mark', 'Troops Damage UP II', '1h General Speedup'],
  ['F7', '1h General Speedup', 'Advanced Teleporter', 'Blanchette Shards', 'Advanced Teleporter', '1h General Speedup', 'Enhancement XP Component', 'Common Wild Mark', 'Troops Damage UP II'],
  ['F8', 'Troops Damage UP II', '1h General Speedup', 'Advanced Teleporter', 'Common Wild Mark', 'Advanced Teleporter', '1h General Speedup', 'Enhancement XP Component', 'Common Wild Mark'],
  ['F9', 'Fred Shards', 'Deployment Capacity Boost II', '1h General Speedup', 'Enhancement XP Component', 'Common Wild Mark', 'Deployment Capacity Boost II', '1h General Speedup', 'Enhancement XP Component'],
  ['F10', 'Advanced Teleporter', 'Fred Shards', 'Deployment Capacity Boost II', 'Troops Damage UP II', 'Enhancement XP Component', 'Common Wild Mark', 'Deployment Capacity Boost II', '1h General Speedup'],
  ['F11', '1h General Speedup', 'Advanced Teleporter', 'Blanchette Shards', 'Common Wild Mark', '1h General Speedup', 'Enhancement XP Component', 'Common Wild Mark', 'Deployment Capacity Boost II'],
  ['F12', 'Deployment Capacity Boost II', '1h General Speedup', 'Advanced Teleporter', '1h General Speedup', 'Advanced Teleporter', '1h General Speedup', 'Enhancement XP Component', 'Common Wild Mark'],
  ['SH1', 'Xura Shards', 'Pet Advancement Materials Custom Chest', 'Lucky Hero Gear Chest', 'Blanchette Shards', 'Gregory Shards', 'Pet Advancement Materials Custom Chest', 'Lucky Hero Gear Chest', 'Blanchette Shards'],
  ['SH2', 'Fire Crystals', 'Xura Shards', 'Pet Advancement Materials Custom Chest', 'Fire Crystals', 'Fire Crystals', 'Gregory Shards', 'Pet Advancement Materials Custom Chest', 'Fire Crystals'],
  ['SH3', 'Lucky Hero Gear Chest', 'Fire Crystals', 'Gregory Shards', 'Pet Advancement Materials Custom Chest', 'Lucky Hero Gear Chest', 'Fire Crystals', 'Fire Crystals', 'Pet Advancement Materials Custom Chest'],
  ['SH4', 'Pet Advancement Materials Custom Chest', 'Lucky Hero Gear Chest', 'Fire Crystals', 'Gregory Shards', 'Pet Advancement Materials Custom Chest', 'Lucky Hero Gear Chest', 'Gregory Shards', 'Gregory Shards']
];

/* ------------------------------------------------------------------ */
/* Reward items and reward lists (game data, 12 Nov 2026)              */
/* ------------------------------------------------------------------ */

// Items: [id, the game's name, picture in the image repo (empty = no picture yet), small text on top of the tile].
// Speedups of one kind share a picture; the tile's colour and the top text show how long they are.
const STARTING_ITEMS = [
  ['giant-horn', 'Giant Horn Lv.1', 'items/giant-horn.png', 'Lv.1'],
  ['tundra-truck', 'Tundra Truck Lv.1', 'items/tundra-truck.png', 'Lv.1'],
  ['alliance-token', 'Alliance Token', 'items/alliance-token.png', ''],
  ['gems', 'Gems', 'items/gems.png', ''],
  ['gems-1000', '1,000 Gems', 'items/gems-1000.png', '1 K'],
  ['fire-crystal', 'Fire Crystal', 'items/fire-crystals.png', ''],
  ['refined-fire-crystal', 'Refined Fire Crystal', 'items/refined-fire-crystal.png', ''],
  ['fire-crystal-shard', 'Fire Crystal Shard', 'items/fire-crystal-shard.png', ''],
  ['mythic-general-hero-shard', 'Mythic General Hero Shard', 'items/mythic-general-hero-shard.png', ''],
  ['speedup-general-1h', '1h General Speedup', 'items/speedup-general.png', '1 hr(s)'],
  ['speedup-construction-1h', '1h Construction Speedup', 'items/speedup-construction.png', '1 hr(s)'],
  ['speedup-research-1h', '1h Research Speedup', 'items/speedup-research.png', '1 hr(s)'],
  ['speedup-training-1h', '1h Training Speedup', 'items/speedup-training.png', '1 hr(s)'],
  ['speedup-general-5m', '5m General Speedup', 'items/speedup-general.png', '5 min'],
  ['speedup-construction-5m', '5m Construction Speedup', 'items/speedup-construction.png', '5 min'],
  ['speedup-research-5m', '5m Research Speedup', 'items/speedup-research.png', '5 min'],
  ['speedup-training-5m', '5m Training Speedup', 'items/speedup-training.png', '5 min'],
  ['secured-resource-supply-chest', '100K Secured Resource Supply Chest', 'items/resource-chest-lvl-1-2.png', ''],
  ['custom-secured-resource-chest-2', 'Lv.2 Custom Secured Resource Chest', 'items/custom-resource-chest-lvl-1-2.png', ''],
  ['gold-key', 'Gold Key', 'items/gold-key.png', ''],
  ['life-essence', 'Life Essence', 'items/life-essence.png', ''],
  ['meat-100k', '100K Meat (Secured)', 'items/meat.png', '100 K'],
  ['wood-100k', '100K Wood (Secured)', 'items/wood.png', '100 K'],
  ['coal-10k', '10K Coal (Secured)', 'items/coal.png', '10 K'],
  ['iron-10k', '10K Iron (Secured)', 'items/iron.png', '10 K'],
  ['coal-100k', '100K Coal (Secured)', 'items/coal.png', '100 K'],
  ['iron-100k', '100K Iron (Secured)', 'items/iron.png', '100 K'],
  ['enhancement-xp-component', '100 Enhancement XP Component', 'items/enhancement-xp-component.png', '100'],
  ['lucky-hero-gear-chest', 'Lucky Hero Gear Chest', 'items/lucky-hero-gear-chest.png', ''],
  ['truck-voucher', 'Truck Voucher', 'items/truck-voucher.png', ''],
  ['charm-design', 'Charm Design', 'items/charm-design.png', ''],
  ['charm-guide', 'Charm Guide', 'items/charm-guide.png', ''],
  ['design-plans', 'Design Plans', 'items/design-plans.png', ''],
  ['essence-stones', 'Essence Stones', 'items/essence-stones.png', ''],
  ['strength-in-unity', 'Strength in Unity', 'items/strength-in-unity.png', ''],
  ['sail-of-conquest', 'Sail of Conquest', 'items/sail-of-conquest.png', ''],
  ['book-of-knowledge', 'Book of Knowledge', 'items/book-of-knowledge.png', ''],
  ['common-expert-sigil', 'Common Expert Sigil', 'items/common-expert-sigil.png', ''],
  ['furious-sea-fortress', 'Furious Sea Fortress Lv. 1', 'items/furious-sea-fortress.png', 'Lv.1'],
  ['winter-badge', 'Winter Badge', 'items/winter-badge.png', ''],
  ['treasure-box', 'Treasure Box', 'items/treasure-box.png', ''],
  ['showdown-win-horn', 'Horn', 'items/horn-gold.png', ''],
  // Tundra Arms League (16 Nov 2026). Both March Accelerators share one picture; the tile tells them apart
  // (I blue: march time -25%, II purple: -50%).
  ['champion-stake', 'Champion Stake', 'items/champion-stake.png', ''],
  ['match-stake', 'Match Stake', 'items/match-stake.png', ''],
  ['march-accelerator-1', 'March Accelerator I', 'items/march-accelerator.png', ''],
  ['march-accelerator-2', 'March Accelerator II', 'items/march-accelerator.png', ''],
  // Tundra Arms League rewards (16 Nov 2026).
  ['arsenal-token', 'Arsenal Tokens', 'items/arsenal-token.png', ''],
  ['mithril', 'Mithril', 'items/mithril.png', ''],
  ['shot-token', 'Shot Token', 'items/shot-token.png', ''],
  ['gems-100', '100 Gems', 'items/gems-100.png', '100'],
  ['speedup-general-3h', '3h General Speedup', 'items/speedup-general.png', '3 hr(s)'],
  ['hornwrath-herald-30', 'Hornwrath Herald (30-Day)', 'items/hornwrath-herald.png', '30 day(s)'],
  ['fireclaw-hunter-30', 'Fireclaw Hunter (30-Day)', 'items/fireclaw-hunter.png', '30 day(s)'],
  ['fireclaw-hunter-14', 'Fireclaw Hunter (14-Day)', 'items/fireclaw-hunter.png', '14 day(s)'],
  ['battlefield-tyrant', 'Battlefield Tyrant Lv. 1', 'items/battlefield-tyrant.png', 'Lv. 1'],
  ['war-chariot', 'War Chariot Lv. 1', 'items/war-chariot.png', 'Lv. 1'],
  ['alliance-hq-skin', 'Alliance HQ Skin', 'items/alliance-hq-skin.png', ''],
  ['alliance-banner-skin', 'Alliance Banner Skin', 'items/alliance-banner-skin.png', ''],
  ['tundra-warlord', 'Prestige Building - Tundra Warlord', 'items/tundra-warlord.png', ''],
  ['alliance-banner-champion', 'Alliance Banner', 'items/alliance-banner-champion.png', ''],
  ['weapons-master', 'Prestige Building - Weapons Master', 'items/weapons-master.png', ''],
  ['alliance-banner-top4', 'Alliance Banner', 'items/alliance-banner-top4.png', ''],
  // Fortress Battles rewards (names as in the Fort Distribution sheet). Shard pictures are in the heroes folder.
  ['troops-health-up-2', 'Troops Health UP II', 'items/troops-health-up-2.png', ''],
  ['troops-damage-up-2', 'Troops Damage UP II', 'items/troops-damage-up-2.png', ''],
  ['deployment-capacity-boost-2', 'Deployment Capacity Boost II', 'items/deployment-capacity-boost-2.png', ''],
  ['advanced-teleporter', 'Advanced Teleporter', 'items/advanced-teleporter.png', ''],
  ['common-wild-mark', 'Common Wild Mark', 'items/common-wild-mark.png', ''],
  ['pet-advancement-materials-custom-chest', 'Pet Advancement Materials Custom Chest', 'items/pet-advancement-materials-custom-chest.png', ''],
  ['fred-shards', 'Fred Shards', 'heroes/fred-shard.png', ''],
  ['blanchette-shards', 'Blanchette Shards', 'heroes/blanchette-shard.png', ''],
  ['xura-shards', 'Xura Shards', 'heroes/xura-shard.png', ''],
  ['gregory-shards', 'Gregory Shards', 'heroes/gregory-shard.png', ''],
  // Shards of the next generations' heroes: Fortress rewards move to them as the state's generation goes up.
  ['eleonora-shards', 'Eleonora Shards', 'heroes/eleonora-shard.png', ''],
  ['lloyd-shards', 'Lloyd Shards', 'heroes/lloyd-shard.png', ''],
  ['karol-shards', 'Karol Shards', 'heroes/karol-shard.png', ''],
  ['ligeia-shards', 'Ligeia Shards', 'heroes/ligeia-shard.png', ''],
  // Resource chests (backpack, 16 Nov 2026). Level 1 and 2 share one picture, level 3 has its own; the secured ones get
  // the shield on their tile. The 100K Secured Resource Supply Chest and Lv.2 Custom Secured Resource Chest are above.
  ['resource-supply-chest-10k', '10K Resource Supply Chest', 'items/resource-chest-lvl-1-2.png', ''],
  ['secured-resource-supply-chest-10k', '10K Secured Resource Supply Chest', 'items/resource-chest-lvl-1-2.png', ''],
  ['custom-resource-chest-1', 'Lv.1 Custom Resource Chest', 'items/custom-resource-chest-lvl-1-2.png', ''],
  ['custom-resource-chest-2', 'Lv.2 Custom Resource Chest', 'items/custom-resource-chest-lvl-1-2.png', ''],
  ['custom-resource-chest-3', 'Lv.3 Custom Resource Chest', 'items/custom-resource-chest-lvl-3.png', ''],
  ['custom-secured-resource-chest-1', 'Lv.1 Custom Secured Resource Chest', 'items/custom-resource-chest-lvl-1-2.png', ''],
  ['custom-secured-resource-chest-3', 'Lv.3 Custom Secured Resource Chest', 'items/custom-resource-chest-lvl-3.png', ''],
  // Hero XP bottles (Fishing Tournament, King of Icefield).
  ['hero-xp-1k', '1K Hero XP', 'items/hero-xp.png', '1 K'],
  ['hero-xp-5k', '5K Hero XP', 'items/hero-xp.png', '5 K'],
  ['hero-xp-10k', '10K Hero XP', 'items/hero-xp.png', '10 K'],
  // King of Icefield rewards (16 Nov 2026).
  ['meat-10k', '10K Meat (Secured)', 'items/meat.png', '10 K'],
  ['wood-10k', '10K Wood (Secured)', 'items/wood.png', '10 K'],
  ['medal-of-honor', 'Medal of Honor', 'items/medal-of-honor.png', ''],
  ['mythic-expedition-skill-manual', 'Mythic Expedition Skill Manual', 'items/mythic-expedition-skill-manual.png', ''],
  ['mythic-exploration-manual', 'Mythic Exploration Manual', 'items/mythic-exploration-skill-manual.png', ''],
  ['general-accessory-construction-contract', 'General Accessory Construction Contract', 'items/general-accessory-construction-contract.png', ''],
  // Seen in game 17 Nov 2026. Pictures not in the repo yet show a "?" until they are added.
  ['championship-badge', 'Championship Badge', 'items/championship-badge.png', ''],
  ['knight-of-the-watch', 'Knight of the Watch (14d)', 'items/knight-of-the-watch.png', ''],
  ['knight-of-conquest', 'Knight of Conquest (14-Day)', 'items/knight-of-conquest.png', ''],
  ['knights-glory-avatar-frame', 'Knight\'s Glory Avatar Frame (14d)', 'items/knights-glory-avatar-frame.png', ''],
  ['knights-glory-nameplate', 'Knight\'s Glory Nameplate (14d)', 'items/knights-glory-nameplate.png', ''],
  ['coal-1k', '1K Coal (Secured)', 'items/coal.png', '1 K'],
  ['iron-1k', '1K Iron (Secured)', 'items/iron.png', '1 K'],
  ['meat-10k-unsecured', '10K Meat', 'items/meat.png', '10 K'],
  ['wood-10k-unsecured', '10K Wood', 'items/wood.png', '10 K'],
  ['coal-10k-unsecured', '10K Coal', 'items/coal.png', '10 K'],
  ['iron-10k-unsecured', '10K Iron', 'items/iron.png', '10 K'],
  ['meat-1m', '1M Meat (Secured)', 'items/meat.png', '1 M'],
  ['wood-1m', '1M Wood (Secured)', 'items/wood.png', '1 M'],
  ['speedup-experts-1h', '1h Expert Speedup', 'items/speedup-experts.png', '1 hr(s)'],
  ['recall-xp', 'Recall XP', 'items/recall-xp.png', ''],
  ['dream-nest', 'Dream Nest Lv. 1', 'items/dream-nest.png', 'Lv.1'],
  ['chief-gear-materials-chest', 'Chief Gear Materials Chest', 'items/chief-gear-material-chest.png', ''],
  ['polishing-solution', 'Polishing Solution', 'items/polishing-solution.png', ''],
  ['hardened-alloy', 'Hardened Alloy', 'items/hardened-alloy.png', ''],
  ['silver-key', 'Silver Key', 'items/silver-key.png', ''],
  ['mythic-general-decoration-component', 'Mythic General Decoration Component', 'items/mythic-general-decoration-component.png', ''],
  ['energizing-potion', 'Energizing Potion', 'items/energizing-potion.png', ''],
  ['nameplate-30d', 'Nameplate (30-Day)', 'items/koi-nameplate.png', '30 day(s)'],
  ['nameplate-14d', 'Nameplate (14-Day)', 'items/koi-nameplate.png', '14 day(s)'],
  ['nameplate-7d', 'Nameplate (7-Day)', 'items/koi-nameplate.png', '7 day(s)'],
  ['avatar-frame-30d', 'Avatar Frame (30-Day)', 'items/koi-avatar-frame.png', '30 day(s)'],
  ['avatar-frame-14d', 'Avatar Frame (14-Day)', 'items/koi-avatar-frame.png', '14 day(s)'],
  ['avatar-frame-7d', 'Avatar Frame (7-Day)', 'items/koi-avatar-frame.png', '7 day(s)'],
  ['blue-flame-avatar-frame', 'Blue Flame Avatar Frame (14-Day)', 'items/blue-flame-avatar-frame.png', '14 day(s)'],
  ['orichalcum', 'Orichalcum', 'items/orichalcum.png', ''],
  ['crystallite-core', 'Crystallite Core', 'items/crystallite-core.png', ''],
  // Mystery Pack has no picture file: the app draws its yellow question mark.
  ['mystery-pack', 'Mystery Pack', '', ''],
  ['pioneer-badge', 'Pioneer Badge', 'items/pioneer-badge.png', ''],
  // Frosty Fortune (seen in game 17 Nov 2026): Treasure Hunt Drill's Daily Missions and the Emporium of Enigma shop.
  // "{generation}" is the state's current generation (the widget chest is always the current generation's).
  // Pictures not in the repo yet show a "?" until they are added; names not checked in game yet are marked below.
  ['treasure-hunt-points', 'Treasure Hunt Points', 'items/trsure-hunt-points.png', ''],
  ['gem-of-enigma', 'Gem of Enigma', 'items/gem-of-enigma.png', ''],
  ['thorn-of-enigma', 'Thorn of Enigma', 'items/thorn-of-enigma.png', ''],
  ['treasure-hunt-chest', 'Treasure Hunt Chest', 'items/treasure-hunt-chest.png', ''],
  ['enhancement-xp-component-10', '10 Enhancement XP Component', 'items/enhancement-xp-component.png', '10'],
  ['mystery-badge', 'Mystery Badge', 'items/mystery-badge.png', ''],
  ['custom-hero-widget-chest', 'Gen {generation} Custom Hero Widget Chest', 'items/custom-hero-widget-chest.png', 'S{generation}'],
  ['advanced-wild-mark', 'Advanced Wild Mark', 'items/advanced-wild-mark.png', ''],
  ['windmill-village', 'Windmill Village (Permanent)', 'items/windmill-village.png', ''],
  ['forgetown', 'Forgetown (Permanent)', 'items/forgetown.png', ''],
  ['brute-mammoth', 'Brute Mammoth (Permanent)', 'items/brute-mammoth.png', ''],
  ['snowmobile', 'Snowmobile (Permanent)', 'items/snowmobile.png', ''],
  // Names to check in game: the brown pet bag (×1,600) and the Emporium's purple-tile resource chest.
  ['pet-bag', 'Pet bag', 'items/pet-bag.png', ''],
  ['emporium-resource-chest', 'Resource chest', 'items/resource-chest-lvl-1-2.png', '']
].map(function (item) { return { id: item[0], name: item[1], imageFile: item[2], label: item[3] }; });

// Alliance Showdown, Ranking rewards by Star Rating band: per rank, the quantity of each item in SHOWDOWN_RANKING_ITEMS
// (0 = not given). All tiles are orange except the speedup (blue).
const SHOWDOWN_RANKING_ITEMS = ['giant-horn', 'alliance-token', 'gems', 'fire-crystal', 'mythic-general-hero-shard', 'speedup-general-1h'];
const SHOWDOWN_RANKING_TILES = ['orange', 'orange', 'orange', 'orange', 'orange', 'blue'];
const SHOWDOWN_RANKING = {
  '1-2': {
    win: [['1', 5, '500K', '30K', 40, 10, 10], ['2', 3, '300K', '24K', 30, 8, 8], ['3-5', 2, '200K', '18K', 25, 6, 6], ['6-10', 1, '100K', '12K', 20, 4, 4], ['11-20', 0, 0, '6,000', 15, 2, 2], ['21-50', 0, 0, '3,000', 10, 1, 1]],
    lose: [['1', 3, '300K', '15K', 30, 5, 5], ['2', 2, '200K', '12K', 25, 4, 4], ['3-5', 1, '100K', '9,000', 20, 3, 3], ['6-10', 0, 0, '6,000', 15, 2, 2], ['11-20', 0, 0, '3,000', 10, 1, 1], ['21-50', 0, 0, '1,500', 5, 0, 1]]
  },
  '3-5': {
    win: [['1', 5, '500K', '30K', 50, 20, 20], ['2', 3, '300K', '24K', 40, 16, 16], ['3-5', 2, '200K', '18K', 30, 12, 12], ['6-10', 1, '100K', '12K', 25, 8, 8], ['11-20', 0, 0, '6,000', 20, 4, 4], ['21-50', 0, 0, '3,000', 15, 2, 2]],
    lose: [['1', 3, '300K', '15K', 40, 10, 10], ['2', 2, '200K', '12K', 30, 8, 8], ['3-5', 1, '100K', '9,000', 25, 6, 6], ['6-10', 0, 0, '6,000', 20, 4, 4], ['11-20', 0, 0, '3,000', 15, 2, 2], ['21-50', 0, 0, '1,500', 10, 1, 1]]
  },
  '6-9': {
    win: [['1', 5, '500K', '30K', 60, 30, 30], ['2', 4, '400K', '24K', 50, 24, 24], ['3-5', 3, '300K', '18K', 40, 18, 18], ['6-10', 2, '200K', '12K', 30, 12, 12], ['11-20', 1, '100K', '6,000', 25, 6, 6], ['21-50', 0, 0, '3,000', 20, 3, 3]],
    lose: [['1', 3, '300K', '15K', 50, 20, 20], ['2', 2, '200K', '12K', 40, 16, 16], ['3-5', 1, '100K', '9,000', 30, 12, 12], ['6-10', 1, '100K', '6,000', 25, 8, 8], ['11-20', 0, 0, '3,000', 20, 4, 4], ['21-50', 0, 0, '1,500', 15, 2, 2]]
  },
  '10+': {
    win: [['1', 5, '500K', '30K', 70, 40, 40], ['2', 4, '400K', '24K', 60, 32, 32], ['3-5', 3, '300K', '18K', 50, 24, 24], ['6-10', 2, '200K', '12K', 40, 16, 16], ['11-20', 1, '100K', '6,000', 30, 8, 8], ['21-50', 1, '100K', '3,000', 25, 4, 4]],
    lose: [['1', 3, '300K', '15K', 60, 30, 30], ['2', 2, '200K', '12K', 50, 24, 24], ['3-5', 1, '100K', '9,000', 40, 18, 18], ['6-10', 1, '100K', '6,000', 30, 12, 12], ['11-20', 0, 0, '3,000', 25, 6, 6], ['21-50', 0, 0, '1,500', 20, 3, 3]]
  }
};

// Alliance Showdown, Star rewards by Star Rating band. "500|purple" = a quantity with its own tile colour.
const SHOWDOWN_STAR_ITEMS = ['tundra-truck', 'alliance-token', 'gems', 'fire-crystal', 'speedup-general-1h', 'secured-resource-supply-chest'];
const SHOWDOWN_STAR_TILES = ['orange', 'purple', 'orange', 'orange', 'blue', 'purple'];
const SHOWDOWN_STAR = {
  win: { '1-2': [1, '30K', '1,000', 10, 5, 50], '3-5': [1, '30K', '1,500', 15, 6, 75], '6-9': [2, '60K', '2,000', 20, 8, 100], '10+': [3, '80K', '2,500', 25, 10, 125] },
  lose: { '1-2': [0, 0, '500|purple', 5, 2, 25], '3-5': [0, 0, '750|purple', 10, 3, 50], '6-9': [1, '30K', '1,000', 15, 4, 75], '10+': [1, '40K', '1,250', 20, 5, 100] }
};

// Alliance Showdown, Daily rewards: the alliance that wins the day and the one that loses (or ties) it.
const SHOWDOWN_DAILY_ITEMS = ['gold-key', 'life-essence', 'alliance-token', 'speedup-research-1h', 'meat-100k', 'wood-100k', 'coal-10k', 'iron-10k'];
const SHOWDOWN_DAILY_TILES = ['purple', 'purple', 'purple', 'blue', 'blue', 'blue', 'blue', 'blue'];
const SHOWDOWN_DAILY = { win: [2, '2,000', '30K', 2, 2, 2, 4, 2], lose: [1, '1,000', '15K', 1, 1, 1, 2, 1] };

// Alliance Showdown, Daily Chests. Seen in game on day 4 (Gear Enhancement); the other days are from guides:
// the same chests, with each day's own item in the last chest, and more points needed on days 5 and 6.
const SHOWDOWN_CHEST_POINTS = { short: ['100', '25,000', '50,000', '87,500', '125,000'], long: ['100', '37,500', '75,000', '125,000', '187,500'] };
const SHOWDOWN_DAY_ITEMS = [['fire-crystal', 15], ['mythic-general-hero-shard', 5], ['charm-design', 15], ['charm-guide', 15], ['design-plans', 15], ['essence-stones', 8]];
// Each chest: [item, quantity, tile]. 'DAY_ITEM' is the day's own item (orange tile).
const SHOWDOWN_CHESTS = [
  [['enhancement-xp-component', 2, 'purple'], ['meat-100k', 4, 'blue'], ['wood-100k', 4, 'blue']],
  [['lucky-hero-gear-chest', 1, 'blue'], ['coal-10k', 8, 'blue'], ['iron-10k', 2, 'blue']],
  [['truck-voucher', 1, 'orange'], ['speedup-construction-5m', 25, 'green'], ['speedup-research-5m', 25, 'green'], ['speedup-training-5m', 25, 'green']],
  [['gems', '3,500', 'orange'], ['truck-voucher', 1, 'orange'], ['meat-100k', 20, 'blue'], ['wood-100k', 20, 'blue']],
  [['DAY_ITEM', 0, 'orange'], ['truck-voucher', 1, 'orange'], ['strength-in-unity', 1, 'purple'], ['custom-secured-resource-chest-2', 40, 'blue']]
];
// Baldur's extra chests (Dawn Hymn), seen in game on day 4: [points, items].
const SHOWDOWN_EXPERT_CHESTS = [
  ['200,000', [['sail-of-conquest', 1, 'orange'], ['truck-voucher', 1, 'orange'], ['meat-100k', 20, 'blue'], ['wood-100k', 20, 'blue']]],
  ['300,000', [['book-of-knowledge', 200, 'orange'], ['truck-voucher', 1, 'orange'], ['coal-100k', 4, 'blue'], ['iron-100k', 1, 'blue']]],
  ['400,000', [['common-expert-sigil', 2, 'orange'], ['truck-voucher', 1, 'orange'], ['speedup-general-5m', 25, 'green'], ['speedup-training-5m', 25, 'green']]]
];
// How many Victory Points (horns) winning each day is worth.
const SHOWDOWN_DAY_HORNS = [1, 2, 2, 2, 2, 4];

// Winter Siege, Tier rewards: per tier, [tier change, Furious Sea Fortress, Winter Badge, Lucky Hero Gear Chest, 1,000 Gems]
// for a win streak, a victory and a loss (0 = not given). All tiles are orange.
const WINTER_SIEGE_TIER_ITEMS = ['furious-sea-fortress', 'winter-badge', 'lucky-hero-gear-chest', 'gems-1000'];
const WINTER_SIEGE_TIER_REWARDS = {
  Rookie: { streak: ['+4', 1, '8,000', 10, 2], win: ['+2', 1, '8,000', 10, 2], lose: ['+1', 0, '4,000', 5, 1] },
  Stalwart: { streak: ['+4', 1, '9,600', 12, 2], win: ['+2', 1, '9,600', 12, 2], lose: ['+1', 0, '4,800', 6, 1] },
  Pioneer: { streak: ['+3', 2, '11.5K', 15, 2], win: ['+2', 2, '11.5K', 15, 2], lose: ['+0', 1, '5,750', 7, 1] },
  Exalted: { streak: ['+2', 2, '13.8K', 18, 2], win: ['+1', 2, '13.8K', 18, 2], lose: ['+0', 1, '6,900', 9, 1] },
  Mythic: { streak: ['+2', 3, '16.5K', 21, 2], win: ['+1', 3, '16.5K', 21, 2], lose: ['-1', 1, '8,250', 10, 1] },
  Legendary: { streak: ['+2', 3, '20K', 25, 2], win: ['+1', 3, '20K', 25, 2], lose: ['-1', 1, '10K', 12, 1] }
};
// Winter Siege, Stronghold Conquest: each enemy stronghold whose squads are all defeated gives the same number of
// Fire Crystal, Treasure Box and 1h General Speedup.
const WINTER_SIEGE_CONQUEST = [['Stronghold 1', 6], ['Stronghold 2', 4], ['Stronghold 3', 4], ['Stronghold 4', 2], ['Stronghold 5', 2], ['Stronghold 6', 2]];
// Winter Siege, Winter Merchant: [item, cost in Winter Badges, limit, tile].
const WINTER_MERCHANT = [
  ['refined-fire-crystal', '1,000', 1, 'orange'], ['fire-crystal-shard', '30', 50, 'orange'], ['fire-crystal', '50', 30, 'orange'],
  ['charm-design', '100', 50, 'orange'], ['charm-guide', '100', 25, 'orange'], ['mythic-general-hero-shard', '500', 3, 'orange'],
  ['essence-stones', '250', 10, 'orange'], ['enhancement-xp-component', '100', 20, 'purple'],
  ['speedup-general-1h', '80', 20, 'blue'], ['speedup-construction-1h', '80', 20, 'blue'], ['speedup-research-1h', '80', 20, 'blue'], ['speedup-training-1h', '80', 20, 'blue']
];

// All starting reward rows. Ids come from what the row is (event, list, band, section, row, item), so they stay the same.
// Tundra Arms League, Match Missions (seen in game 15 Nov 2026): each mission and its rewards [item, quantity, tile].
const TAL_MISSIONS = {
  Daily: [
    ['Gather 10,000,000 resources', [['champion-stake', '1', 'orange'], ['match-stake', '100', 'purple'], ['coal-10k', '20', 'blue'], ['iron-10k', '5', 'blue']]],
    ['Call rally and hunt down 5 Polar Terror(s)', [['champion-stake', '2', 'orange'], ['match-stake', '200', 'purple'], ['essence-stones', '1', 'orange'], ['meat-100k', '10', 'blue']]],
    ['Defeat 10 Beasts', [['champion-stake', '2', 'orange'], ['match-stake', '200', 'purple'], ['fire-crystal', '2', 'orange'], ['wood-100k', '10', 'blue']]],
    ['Log in 1 time today', [['champion-stake', '1', 'orange'], ['match-stake', '200', 'purple'], ['meat-100k', '10', 'blue'], ['wood-100k', '10', 'blue']]],
    ['Make 25 Alliance Contribution(s)', [['champion-stake', '2', 'orange'], ['match-stake', '100', 'purple'], ['coal-10k', '20', 'blue'], ['iron-10k', '5', 'blue']]],
    ['Train/Promote up 100,000 Troop Power', [['champion-stake', '2', 'orange'], ['match-stake', '200', 'purple'], ['speedup-training-1h', '2', 'blue'], ['speedup-training-5m', '12', 'green']]]
  ],
  Weekly: [
    ['Make a prediction on 3 match(es).', [['champion-stake', '10', 'orange'], ['match-stake', '1,000', 'purple'], ['mythic-general-hero-shard', '1', 'orange'], ['march-accelerator-1', '2', 'blue']]],
    ['Call rally and hunt down 25 Polar Terror(s)', [['champion-stake', '10', 'orange'], ['match-stake', '1,000', 'purple'], ['essence-stones', '2', 'orange'], ['march-accelerator-2', '3', 'purple']]],
    ['Use 5,000m of Any Speedup', [['champion-stake', '10', 'orange'], ['match-stake', '1,000', 'purple'], ['mythic-general-hero-shard', '1', 'orange'], ['march-accelerator-1', '2', 'blue']]],
    ['Make any payment 1 time(s)', [['champion-stake', '20', 'orange'], ['match-stake', '1,000', 'purple'], ['fire-crystal', '15', 'orange'], ['essence-stones', '3', 'orange']]],
    ['Log in for 5 day(s)', [['champion-stake', '10', 'orange'], ['match-stake', '1,000', 'purple'], ['fire-crystal', '5', 'orange'], ['march-accelerator-2', '3', 'purple']]]
  ]
};

// Items added as "not named yet" (16 Nov 2026): Essence Stones and the Mythic General Hero Shard (already in the list),
// March Accelerator I and II (named since). Their Match Missions rows are removed (the right ones are added again) and
// so are the items, while no other reward uses them and nobody gave them a picture.
const RETIRED_ITEM_IDS = ['tal-item-stone', 'tal-item-puzzle', 'tal-item-blue-troops', 'tal-item-purple-troops'];

function removeRetiredItems_() {
  deleteRows_('Rewards', function (row) {
    return row.eventTypeId === 'hellfire' && row.list === 'missions' && RETIRED_ITEM_IDS.indexOf(row.itemId) !== -1;
  });
  const stillUsed = readTable_('Rewards').map(function (row) { return row.itemId; });
  deleteRows_('Items', function (row) {
    return RETIRED_ITEM_IDS.indexOf(row.id) !== -1 && !row.imageFile && stillUsed.indexOf(row.id) === -1;
  });
}

// Tundra Arms League rewards (seen in game 16 Nov 2026). Ranking: per band (Legion, Alliance, State Rewards), each
// rank and its rewards [item, quantity, tile]. Combatant: per phase, the legion's winners and losers, then the
// personal bonus by Personal Arsenal Points for winning and losing combatants.
const TAL_RANKS = ['1', '2', '3', '4', '5–8', '9–16', '17–32', '33+'];
const TAL_RANKING = {
  Legion: [
    [['hornwrath-herald-30', 1], ['battlefield-tyrant', 1], ['war-chariot', 5], ['champion-stake', '3,600'], ['arsenal-token', '50K'], ['mithril', 3], ['fire-crystal', 150], ['mythic-general-hero-shard', 60], ['shot-token', 10]],
    [['fireclaw-hunter-30', 1], ['war-chariot', 3], ['champion-stake', '2,400'], ['arsenal-token', '45K'], ['mithril', 2], ['fire-crystal', 135], ['mythic-general-hero-shard', 50], ['shot-token', 8]],
    [['fireclaw-hunter-14', 1], ['war-chariot', 2], ['champion-stake', '1,500'], ['arsenal-token', '40K'], ['mithril', 1], ['fire-crystal', 120], ['mythic-general-hero-shard', 45], ['shot-token', 7]],
    [['fireclaw-hunter-14', 1], ['war-chariot', 1], ['champion-stake', '1,000'], ['arsenal-token', '35K'], ['mithril', 1], ['fire-crystal', 100], ['mythic-general-hero-shard', 40], ['shot-token', 7]],
    [['champion-stake', 600], ['arsenal-token', '30K'], ['fire-crystal', 85], ['mythic-general-hero-shard', 35], ['shot-token', 5]],
    [['champion-stake', 400], ['arsenal-token', '25K'], ['fire-crystal', 70], ['mythic-general-hero-shard', 30], ['shot-token', 4]],
    [['champion-stake', 200], ['arsenal-token', '20K'], ['fire-crystal', 50], ['mythic-general-hero-shard', 25], ['shot-token', 3]],
    [['champion-stake', 100], ['arsenal-token', '15K'], ['fire-crystal', 36], ['mythic-general-hero-shard', 20], ['shot-token', 2]]
  ],
  Alliance: [['36K', '6,000', 6, 20], ['30K', '5,500', 5, 15], ['24K', '5,000', 5, 10], ['18K', '4,500', 4, 9], ['12K', '3,500', 3, 8], ['6,000', '3,000', 3, 6], ['3,000', '2,500', 2, 4], ['1,500', '2,000', 1, 2]]
    .map(function (q) { return [['match-stake', q[0], 'purple'], ['arsenal-token', q[1]], ['mythic-general-hero-shard', q[2]], ['speedup-general-3h', q[3], 'purple']]; }),
  'State Rewards': [[50, 10, 10], [40, 8, 8], [30, 6, 6], [20, 5, 5]]
    .map(function (q) { return [['fire-crystal', q[0]], ['essence-stones', q[1]], ['enhancement-xp-component', q[2], 'purple']]; })
};
const TAL_POINT_RANGES = ['2,000–19,999', '20,000–41,999', '42,000–89,999', '90,000–179,999', '180,000+'];
function talPersonal_(steps) {
  return steps.map(function (q) { return [['champion-stake', q[0]], ['match-stake', q[1], 'purple'], ['march-accelerator-2', q[2], 'purple'], ['speedup-training-1h', q[3], 'blue'], ['custom-secured-resource-chest-2', q[4], 'blue']]; });
}
function talLegion_(q) { return [['match-stake', q[0], 'purple'], ['gems-100', q[1], 'purple'], ['advanced-teleporter', q[2], 'purple'], ['gold-key', q[3], 'purple'], ['custom-secured-resource-chest-2', q[4], 'blue']]; }
const TAL_COMBATANT = {
  Elimination: { win: talLegion_(['2,000', 6, 2, 4, 20]), lose: talLegion_(['1,500', 3, 1, 2, 10]),
    'personal-win': talPersonal_([[10, '1,000', 1, 2, 2], [20, '2,000', 2, 4, 4], [30, '3,000', 3, 6, 6], [40, '4,000', 4, 8, 8], [50, '5,000', 5, 10, 10]]),
    'personal-lose': talPersonal_([[5, 500, 1, 1, 1], [10, '1,000', 1, 2, 2], [15, '1,500', 2, 3, 3], [20, '2,000', 2, 4, 4], [25, '2,500', 3, 5, 5]]) },
  Championship: { win: talLegion_(['3,000', 8, 2, 5, 30]), lose: talLegion_(['2,000', 4, 1, 3, 15]),
    'personal-win': talPersonal_([[20, '2,000', 2, 4, 4], [40, '4,000', 4, 8, 8], [60, '6,000', 6, 12, 12], [80, '8,000', 8, 16, 16], [100, '10K', 10, 20, 20]]),
    'personal-lose': talPersonal_([[10, '1,000', 1, 2, 2], [20, '2,000', 2, 4, 4], [30, '3,000', 3, 6, 6], [40, '4,000', 4, 8, 8], [50, '5,000', 5, 10, 10]]) }
};
// The gold chest of Dreamscape Memory and Crazy Joe was named "Chest" (id gold-gear-chest) until its game name was known:
// Chief Gear Materials Chest (17 Nov 2026). Its old reward rows are removed while unedited (the new ones are added with
// the other starting rewards), then the old item if nothing uses it any more.
const RENAMED_ITEMS = [{ oldId: 'gold-gear-chest', oldImageFile: 'items/gold-gear-chest.png', newId: 'chief-gear-materials-chest' }];

function replaceRenamedItems_() {
  const startingRows = startingRewards_();
  RENAMED_ITEMS.forEach(function (renamed) {
    // Each old row is unedited when it matches the new starting row in everything but the item.
    const newRows = {};
    startingRows.filter(function (row) { return row.itemId === renamed.newId; }).forEach(function (row) {
      newRows[[row.eventTypeId, row.list, row.band, row.section, row.rowLabel, row.quantity, row.tile].join('|')] = true;
    });
    deleteRows_('Rewards', function (row) {
      return row.itemId === renamed.oldId && newRows[[row.eventTypeId, row.list, row.band, row.section, row.rowLabel, row.quantity, row.tile].join('|')];
    });
    const stillUsed = readTable_('Rewards').some(function (row) { return row.itemId === renamed.oldId; });
    if (!stillUsed) deleteRows_('Items', function (row) { return row.id === renamed.oldId && row.imageFile === renamed.oldImageFile; });
  });
}

// Reward rows of older versions that were wrong, removed while they still hold what setup wrote:
// [id, item, quantity, tile]. The Medal of Honor shard is Lloyd's, not Ligeia's (17 Nov 2026).
const RETIRED_REWARDS = [['rw-koi-medals-own-10-ligeia-shards', 'ligeia-shards', '1', 'orange'],
  ['rw-koi-medals-own-11-ligeia-shards', 'ligeia-shards', '1', 'orange']];

function removeRetiredRewards_() {
  RETIRED_REWARDS.forEach(function (retired) {
    deleteRows_('Rewards', function (row) {
      return row.id === retired[0] && row.itemId === retired[1] && row.quantity === retired[2] && row.tile === retired[3];
    });
  });
}

// King of Icefield rewards (seen in game 16 Nov 2026). Target Points per stage: [points, [item, quantity, tile]...].
// Stage 1's 190,000 row is not in yet (its quantities were not readable). Medal of Honor: the rows seen so far.
const KOI_TARGETS = {
  'Stage 1': [
    ['3,900', [['meat-10k', 35, 'blue'], ['wood-10k', 35, 'blue'], ['coal-10k', 7, 'blue'], ['iron-10k', 1, 'blue']]],
    ['40,000', [['hero-xp-1k', 50, 'green'], ['speedup-construction-5m', 20, 'green'], ['speedup-research-5m', 20, 'green'], ['speedup-training-5m', 20, 'green']]],
    ['110,000', [['gems', '3,000', 'orange'], ['medal-of-honor', 1, 'purple'], ['strength-in-unity', 1, 'purple'], ['custom-secured-resource-chest-1', 350, 'green']]]
  ]
};
const KOI_MEDALS = [
  ['Own 10', [['general-accessory-construction-contract', 1], ['lloyd-shards', 1], ['mythic-exploration-manual', 2], ['speedup-training-1h', 1, 'blue']]],
  ['Own 11', [['general-accessory-construction-contract', 1], ['lloyd-shards', 1], ['mythic-expedition-skill-manual', 2], ['speedup-training-1h', 1, 'blue']]]
];

/* ---------- Event data seen in game on 17 Nov 2026 ----------
   Alliance Championship, King of Icefield rankings, Dreamscape Memory, Frostfire Mine, Crazy Joe, Defeat nearby beasts,
   Flame and Fangs shop, Lucky Wheel and Wild Brawl. Rows are [item, quantity, tile]. */

// Alliance Championship. Tier Rewards of the Ultimate tier: Prestige Rewards, then per group rank the Star Rating change
// and the rewards. KO Rewards: KO Reward 1 and 2 and the Defeat Rewards.
const ALLIANCE_CHAMPIONSHIP_PRESTIGE = ['knight-of-the-watch', 'knight-of-conquest', 'knights-glory-avatar-frame', 'knights-glory-nameplate'];
const ALLIANCE_CHAMPIONSHIP_TIERS = {
  Ultimate: [
    ['1', 'Star Rating +2', [['speedup-general-5m', 63, 'green'], ['secured-resource-supply-chest-10k', 830, 'green'], ['championship-badge', '23.8K', 'orange']]],
    ['2–3', 'Star Rating +1', [['speedup-general-5m', 55, 'green'], ['secured-resource-supply-chest-10k', 720, 'green'], ['championship-badge', '19K', 'orange']]],
    ['4–5', 'Star Rating −1', [['speedup-general-5m', 48, 'green'], ['secured-resource-supply-chest-10k', 625, 'green'], ['championship-badge', '14.3K', 'orange']]],
    ['6', 'Star Rating −2', [['speedup-general-5m', 41, 'green'], ['secured-resource-supply-chest-10k', 545, 'green'], ['championship-badge', '9,500', 'orange']]]
  ]
};
const ALLIANCE_CHAMPIONSHIP_KO = [
  ['KO Reward 1', [['treasure-box', 1, 'purple'], ['speedup-research-5m', 10, 'green'], ['secured-resource-supply-chest-10k', 80, 'blue']]],
  ['KO Reward 2', [['treasure-box', 1, 'purple'], ['speedup-research-5m', 15, 'green'], ['secured-resource-supply-chest-10k', 120, 'blue']]],
  ['Defeat Rewards', [['speedup-research-5m', 10, 'green'], ['meat-10k', 20, 'blue'], ['wood-10k', 20, 'blue'], ['coal-1k', 40, 'green'], ['iron-1k', 10, 'green']]]
];

// King of Icefield: Stage 2's Target Points, Medal of Honor from Own 2 (Own 10 and 11 are in KOI_MEDALS), and the
// rankings. The shard in Medal of Honor and the rankings is Lloyd's.
const KOI_TARGETS_STAGE_2 = [
  ['5,800', [['meat-10k', 45, 'blue'], ['wood-10k', 45, 'blue'], ['coal-10k', 9, 'blue'], ['iron-10k', 2, 'blue']]],
  ['70,000', [['hero-xp-1k', 65, 'green'], ['speedup-construction-5m', 25, 'green'], ['speedup-research-5m', 25, 'green'], ['speedup-training-5m', 25, 'green']]],
  ['161,000', [['gems', '4,000', 'orange'], ['medal-of-honor', 1, 'purple'], ['strength-in-unity', 1, 'purple'], ['custom-secured-resource-chest-1', 450, 'green']]],
  ['312,000', [['essence-stones', 15, 'orange'], ['medal-of-honor', 1, 'purple'], ['shot-token', 1, 'orange'], ['custom-secured-resource-chest-1', 450, 'green']]]
];
const KOI_MEDALS_MORE = [2, 3, 4, 5, 6, 7, 8, 9].map(function (owned) {
  return ['Own ' + owned, [['lloyd-shards', 1], ['mythic-exploration-manual', 1], ['mythic-expedition-skill-manual', 1], ['speedup-training-1h', 1, 'blue']]];
}).concat([12, 14].map(function (owned) {
  return ['Own ' + owned, [['general-accessory-construction-contract', 1], ['lloyd-shards', 1], ['mythic-exploration-manual', 2], ['speedup-training-1h', 1, 'blue']]];
}), [13].map(function (owned) {
  return ['Own ' + owned, [['general-accessory-construction-contract', 1], ['lloyd-shards', 1], ['mythic-expedition-skill-manual', 2], ['speedup-training-1h', 1, 'blue']]];
}));
const KOI_RANKS = ['1', '2', '3', '4–5', '6–10', '11–20', '21–50', '51–100'];
// Per rank: [gems, gems tile, speedups, gold keys or second speedups, resource chests].
const koiStageRow_ = function (row, secondItem) {
  return [['gems', row[0], row[1]], ['speedup-' + (secondItem ? 'research' : 'training') + '-1h', row[2], 'blue'],
    secondItem ? ['gold-key', row[3], 'purple'] : ['speedup-construction-1h', row[3], 'blue'], ['custom-resource-chest-2', row[4], 'blue']];
};
const KOI_STAGE_QUANTITIES = [['20K', 'orange', 12, 12, 100], ['12K', 'orange', 9, 9, 90], ['7,500', 'orange', 8, 8, 85], ['4,500', 'orange', 7, 7, 80],
  ['2,500', 'orange', 6, 6, 75], ['1,500', 'orange', 5, 5, 70], ['800', 'purple', 4, 4, 60], ['400', 'purple', 3, 3, 50]];
const KOI_STAGE_ONE_KEYS = [3, 2, 2, 1, 1, 1, 1, 1];
const KOI_RANKING = {
  'Stage I': KOI_STAGE_QUANTITIES.map(function (row, index) {
    return koiStageRow_([row[0], row[1], row[2], KOI_STAGE_ONE_KEYS[index], row[4]], true);
  }),
  'Stages II–VII': KOI_STAGE_QUANTITIES.map(function (row) { return koiStageRow_(row, false); }),
  Total: [[300, 150, '20K', 'orange', 90], [150, 75, '15K', 'orange', 63], [80, 40, '10K', 'orange', 54], [50, 25, '4,500', 'orange', 42],
    [30, 15, '2,500', 'orange', 33], [20, 10, '1,500', 'orange', 24], [10, 5, '800', 'purple', 15], [5, 3, '400', 'purple', 9]].map(function (row) {
    return [['lloyd-shards', row[0], 'orange'], ['mythic-expedition-skill-manual', row[1], 'orange'], ['gems', row[2], row[3]], ['speedup-general-1h', row[4], 'blue']];
  })
};
const KOI_CROSS_STATE_RANKS = ['1', '2', '3', '4–5', '6–10', '11–20', '21–50', '51–100', '101–150', '151–300', '301–500', '501–1000'];
// Per rank: [Lloyd shards, nameplate days, avatar frame days, Fire Crystals, gems] (0 = not given).
const KOI_CROSS_STATE = [[120, 30, 30, 100, '80K'], [100, 30, 30, 80, '70K'], [80, 30, 30, 60, '60K'], [60, 30, 30, 50, '50K'], [40, 14, 14, 36, '35K'],
  [25, 14, 14, 24, '18K'], [12, 14, 14, 12, '8,500'], [8, 7, 7, 8, '6,500'], [6, 7, 0, 8, '5,000'], [6, 7, 0, 6, '3,500'], [4, 0, 0, 5, '2,400'], [4, 0, 0, 5, '1,200']];
const KOI_STATE_RANK = [['1', 150, 'gold-key', 6, 'purple', 200], ['2', 120, 'gold-key', 4, 'purple', 150], ['3', 90, 'gold-key', 2, 'purple', 100],
  ['4', 80, 'silver-key', 4, 'blue', 75], ['5–6', 70, 'silver-key', 2, 'blue', 50]];

// Dreamscape Memory: Chapter Rewards.
const DREAMSCAPE_CHAPTERS = [
  [[250, 8, 1, 4], 80], [[360, 10, 1, 8], 60], [[640, 20, 2, 9], 120], [[640, 25, 3, 12], 120], [['1,000', 60, 3, 20], 200]
].map(function (chapter, index) {
  return ['Chapter ' + (index + 1), [['recall-xp', chapter[0][0], 'orange'], ['fire-crystal', chapter[0][1], 'orange'], ['mythic-general-hero-shard', chapter[0][2], 'orange'],
    ['essence-stones', chapter[0][3], 'orange'], ['secured-resource-supply-chest-10k', chapter[1], 'blue']]];
}).concat([['1,200', 6], ['1,200', 7], ['1,440', 8], ['1,440', 9], ['1,800', 10]].map(function (chapter) {
  return ['Chapter ' + chapter[1], [['recall-xp', chapter[0], 'orange'], ['dream-nest', 1, 'orange'], ['fire-crystal', 90, 'orange'], ['chief-gear-materials-chest', 36, 'orange'],
    ['mythic-general-hero-shard', 3, 'orange']]];
}));

// Frostfire Mine: Gathering Rewards by Orichalcum yield, Ranking Rewards and the Smelter Occupation Ranking.
const FROSTFIRE_GATHERING = [['10,000', 0, 4, 240, 48, 12], ['25,000', 0, 4, 240, 48, 12], ['40,000', 0, 4, 240, 48, 12], ['75,000', 10, 4, 320, 64, 0],
  ['100,000', 10, 6, 320, 64, 0], ['150,000', 10, 6, 320, 64, 0]].map(function (row) {
  return [row[0], [['charm-guide', row[1], 'orange'], ['speedup-training-1h', row[2], 'blue'], ['meat-10k-unsecured', row[3], 'blue'], ['wood-10k-unsecured', row[3], 'blue'],
    ['coal-10k-unsecured', row[4], 'blue'], ['iron-10k-unsecured', row[5], 'blue']]];
});
const FROSTFIRE_RANKS = ['1', '2', '3', '4–5', '6–10', '11–20', '21–50', '51–100', '101–200', '201–500'];
// Per rank: [Blue Flame Avatar Frame, Charm Designs, Charm Guides, Shot Tokens, gems, gems tile, resource chests].
const FROSTFIRE_RANKING = [[1, 120, 72, 5, '4,000', 'orange', 150], [1, 85, 58, 5, '3,800', 'orange', 135], [1, 65, 43, 5, '3,600', 'orange', 130],
  [1, 45, 36, 5, '3,400', 'orange', 120], [0, 40, 32, 4, '3,000', 'orange', 110], [0, 35, 28, 4, '2,500', 'orange', 105], [0, 33, 25, 3, '2,000', 'orange', 95],
  [0, 28, 23, 3, '1,200', 'orange', 90], [0, 24, 20, 2, '800', 'purple', 80], [0, 12, 12, 1, '600', 'purple', 75]];
const FROSTFIRE_SMELTER = ['100,000', '80,000', '60,000', '55,000', '50,000', '40,000', '35,000', '30,000', '25,000', '20,000'];

// Crazy Joe: Defense Point levels [personal points, alliance points, item, quantity, tile], then the rankings.
const CRAZY_JOE_LEVELS = [
  ['3,000', '300,000', 'alliance-token', '2,000', 'blue'], ['6,000', '900,000', 'alliance-token', '3,000', 'blue'], ['12,000', '2,400,000', 'alliance-token', '4,000', 'blue'],
  ['18,000', '4,500,000', 'alliance-token', '5,000', 'blue'], ['30,000', '9,000,000', 'alliance-token', '6,000', 'blue'], ['40,000', '12,000,000', 'alliance-token', '7,000', 'blue'],
  ['50,000', '15,000,000', 'alliance-token', '8,000', 'blue'], ['60,000', '18,000,000', 'alliance-token', '9,000', 'blue'], ['70,000', '21,000,000', 'alliance-token', '10K', 'purple'],
  ['80,000', '24,000,000', 'alliance-token', '11K', 'purple'], ['100,000', '27,000,000', 'polishing-solution', 2, 'purple'], ['150,000', '30,000,000', 'hardened-alloy', 200, 'blue'],
  ['200,000', '33,000,000', 'design-plans', 1, 'orange'], ['300,000', '36,000,000', 'polishing-solution', 3, 'purple'], ['400,000', '39,000,000', 'hardened-alloy', 300, 'blue'],
  ['600,000', '42,000,000', 'design-plans', 1, 'orange'], ['800,000', '45,000,000', 'polishing-solution', 5, 'purple'], ['1,000,000', '48,000,000', 'hardened-alloy', 500, 'blue'],
  ['1,500,000', '51,000,000', 'design-plans', 1, 'orange'], ['2,000,000', '54,000,000', 'chief-gear-materials-chest', 1, 'orange'], ['2,300,000', '57,000,000', 'polishing-solution', 5, 'purple'],
  ['2,600,000', '60,000,000', 'hardened-alloy', 500, 'blue'], ['2,900,000', '63,000,000', 'design-plans', 1, 'orange'], ['3,200,000', '66,000,000', 'polishing-solution', 5, 'purple'],
  ['3,500,000', '69,000,000', 'hardened-alloy', 500, 'blue'], ['3,800,000', '72,000,000', 'design-plans', 1, 'orange'], ['4,100,000', '75,000,000', 'polishing-solution', 5, 'purple'],
  ['4,400,000', '78,000,000', 'hardened-alloy', 500, 'blue'], ['4,700,000', '81,000,000', 'design-plans', 1, 'orange'], ['5,000,000', '84,000,000', 'chief-gear-materials-chest', 1, 'orange']
];
// Per rank: [Design Plans, Polishing Solution, Hardened Alloy, resource chests] (0 = not given).
const CRAZY_JOE_RANKING = {
  Personal: [['1', 18, 360, '36K', 400], ['2', 16, 320, '32K', 385], ['3', 15, 300, '30K', 370], ['4', 13, 275, '27.5K', 345], ['5', 11, 275, '27.5K', 330],
    ['6', 10, 275, '27.5K', 320], ['7', 10, 245, '24.5K', 315], ['8', 9, 245, '24.5K', 305], ['9', 9, 245, '24.5K', 300], ['10', 8, 245, '24.5K', 290],
    ['11–15', 8, 220, '22K', 265], ['16–20', 7, 210, '21K', 240], ['21–25', 6, 175, '17.5K', 200], ['26–50', 5, 155, '15.5K', 160], ['51–100', 4, 130, '13K', 130],
    ['101–150', 3, 110, '11K', 115], ['151–200', 2, 90, '9,000', 100], ['201–300', 0, 75, '7,500', 80], ['301–400', 0, 45, '4,500', 55], ['401–500', 0, 20, '2,000', 30],
    ['501–1000', 0, 10, '1,000', 15]],
  Alliance: [['1', 4, 9, 845, 40], ['2', 3, 8, 750, 35], ['3', 2, 7, 650, 30], ['4', 0, 7, 565, 25], ['5', 0, 6, 475, 20], ['6', 0, 5, 375, 18], ['7', 0, 4, 285, 14],
    ['8', 0, 3, 195, 12], ['9', 0, 2, 155, 10], ['10', 0, 1, 115, 8]]
};

// Defeat nearby beasts: Target Points and the Honor Ranking.
const BEAST_TARGETS = [
  ['1', [['charm-guide', 6, 'orange'], ['charm-design', 9, 'orange'], ['meat-10k', 10, 'blue'], ['wood-10k', 10, 'blue']]],
  ['30', [['charm-guide', 8, 'orange'], ['charm-design', 12, 'orange'], ['meat-10k', 50, 'blue'], ['wood-10k', 50, 'blue']]],
  ['50', [['charm-guide', 10, 'orange'], ['charm-design', 15, 'orange'], ['meat-10k', 100, 'blue'], ['wood-10k', 100, 'blue']]],
  ['80', [['charm-guide', 12, 'orange'], ['charm-design', 18, 'orange'], ['shot-token', 1, 'orange'], ['energizing-potion', 5, 'purple']]]
];
// Per rank: [decoration components, gems, gems tile, research speedups, construction speedups, gold keys] (0 = not given).
const BEAST_RANKING = [['1', 10, '20K', 'orange', 10, 10, 3], ['2', 6, '12K', 'orange', 7, 7, 2], ['3', 4, '7,200', 'orange', 6, 6, 1], ['4–5', 3, '4,500', 'orange', 5, 5, 0],
  ['6–10', 1, '2,500', 'orange', 4, 4, 0], ['11–20', 0, '1,500', 'orange', 3, 3, 0], ['21–50', 0, '800', 'purple', 2, 2, 0], ['51–100', 0, '400', 'purple', 1, 1, 0]];

// Flame and Fangs shop: [Crystallite Cores, item, quantity, tile, limit].
const FLAME_AND_FANGS_SHOP = [
  [5, 'fire-crystal', 9, 'orange', 8], [3, 'fire-crystal-shard', 9, 'orange', 5], [30, 'refined-fire-crystal', 2, 'orange', 2],
  [4, 'speedup-research-1h', 2, 'blue', 5], [4, 'speedup-construction-1h', 2, 'blue', 5], [4, 'speedup-training-1h', 2, 'blue', 5], [4, 'speedup-experts-1h', 2, 'blue', 5],
  [3, 'hero-xp-10k', 1, 'purple', 20], [1, 'meat-1m', 1, 'purple', 30], [1, 'wood-1m', 1, 'purple', 30], [1, 'coal-100k', 2, 'blue', 30], [1, 'iron-10k', 5, 'blue', 30]
];

// Lucky Wheel: Reward Rates and the progress chests (shards of the chosen hero, Eleonora when seen).
const LUCKY_WHEEL_RATES = [
  ['4.370%', 'eleonora-shards', 5, 'orange'], ['32.810%', 'eleonora-shards', 1, 'orange'], ['6.560%', 'mystery-pack', 1, 'purple'], ['6.560%', 'mystery-pack', 1, 'purple'],
  ['20.510%', 'speedup-general-1h', 1, 'blue'], ['18.270%', 'hero-xp-10k', 1, 'purple'], ['2.730%', 'iron-10k-unsecured', 20, 'blue'], ['2.730%', 'coal-10k-unsecured', 80, 'blue'],
  ['2.730%', 'wood-10k-unsecured', 400, 'blue'], ['2.730%', 'meat-10k-unsecured', 400, 'blue']
];
const LUCKY_WHEEL_CHESTS = [[5, 5], [15, 10], [35, 20], [70, 30], [120, 50]];

// Event rules and notes (point source rows: [day, day name, text, points]). A day name "list|band" puts a note above
// that list of the Rewards tab.
const ALLIANCE_CHAMPIONSHIP_RULES = [
  [0, '', 'Sign-up: Each chief signs up in the Alliance Championship sign-up area, picks a lane and places troops. These troops do not use march slots and are not killed. Every member who signs up can get rewards, even without battling.', ''],
  [0, '', 'Matchmaking: The game puts 6 alliances of the same or a similar tier in one group. A signed-up alliance cannot disband until the Championship ends. A member who quits during Matchmaking still fights but gets no rewards.', ''],
  [0, '', 'Rounds: Each alliance meets the other 5 of its group, one round each. Before each round\'s battle, the Leader and R4s can move troops between the 3 lanes or swap single armies in a lane.', ''],
  [0, '', 'Battle: In each lane, the troops with the highest Power fight first and each army fights at most twice. The first alliance to defeat all enemy troops in a lane takes its flag. Only expedition hero skills work.', ''],
  [0, '', 'Points: The alliance with more flags wins the round and gets 3 points, and a draw gives both 1 point. Alliances are ranked in their group by Championship Points, and ties are decided by the flags captured and the enemies defeated.', '']
];
const ALLIANCE_CHAMPIONSHIP_REWARD_NOTES = [
  [0, '', 'Rewards are sent by mail when round 5 ends, on Friday at 12:00 UTC, only to the members in the alliance at that time.', ''],
  [0, 'group|Ultimate', 'Prestige Rewards are granted after battling in the Ultimate tier.', ''],
  [0, 'ko', 'KO Rewards are given to the combatants after each round. Defeating 1 enemy team gives KO Reward 1, and defeating 2 teams or staying undefeated gives KO Reward 2. Only the chiefs on the combatant list, the 20 most powerful, can get them, and lane changes can leave some chiefs off it.', '']
];
const KOI_RANKING_NOTES = [
  [0, 'ranking|Stage I', 'The top 100 chiefs of each stage with over 50,000 points get these by mail after the stage.', ''],
  [0, 'ranking|Stages II–VII', 'The top 100 chiefs of each stage with over 50,000 points get these by mail after the stage.', ''],
  [0, 'ranking|Total', 'The top 100 chiefs of the Total Ranking get these by mail after the event.', ''],
  [0, 'ranking|Cross-State', 'The top 1,000 chiefs of the Cross-State Point Total Ranking get these by mail after the event.', ''],
  [0, 'ranking|State Rank', 'Chiefs with 250,000 personal points, in the states ranked top 6 on the event\'s Overall Ranking, get these by mail after the event.', '']
];
const DREAMSCAPE_RULES = [
  [0, '', 'Dream Fishbits: Each chief gets 20 Dream Fishbits at the start, and each chapter costs Fishbits to start. A failed chapter returns 10 Fishbits for Chapter 1, 16 for Chapter 2, 18 for Chapter 3, 16 for Chapter 4 and 10 for Chapter 5, and none for Chapters 6 to 10. Fishbits left at the end of the event are removed.', ''],
  [0, '', 'Chapters: Chapters are played in order, and so are the stages of each chapter. Each stage has a time limit to find all its items. Failing a stage fails the chapter, resets its progress and removes the prizes gathered in it.', ''],
  [0, '', 'Hints and Extra Time: Some stages give free Hints for that stage. After a failed stage, Dreambells add Extra Time with a free Hint, and each further Hint costs more Dreambells.', ''],
  [0, '', 'Express Mode: It unlocks once the state has completed 5 Dreamscape Memory seasons and the chief has reached Lv. 10 in the event. Turned on before a chapter starts, it clears all the chapter\'s stages at once for Fishbits and Dreambells. Once it is unlocked, Fishbits can be exchanged for Dreambells, up to a limit each season.', '']
];
const DREAMSCAPE_REWARD_NOTES = [
  [0, '', 'Chapter rewards are claimed automatically when the chapter is completed. Recall XP raises the Recall Road level. Dream Nest Lv. 1 is a Mythic 3x3 decoration with Troops\' Defense +1.0%, stored in the Island Storehouse.', '']
];
const FROSTFIRE_RULES = [
  [0, '', 'Registration: Chiefs pick a battle time and can change it until registration ends. A chief who misses a battle can register for a later one up to 10 minutes before it starts. No troops may be out of the city when entering the battlefield.', ''],
  [0, '', 'Battle: Each battle lasts 30 minutes. Troops are unlimited, at the chief\'s highest trainable level, and none are killed. Lv. 1 to 3 Veins are guarded by Phaethon Mine Guards, and once they are defeated a squad can hold the Vein to gather Orichalcum. Vein Outbursts appear at times and gather faster. Chiefs can attack Veins held by other chiefs, allies included, but not their cities. Heroes of a defeated squad cannot fight for 5 minutes.', ''],
  [0, '', 'Smelter: The Smelter opens late in each battle. Chiefs who hold it are ranked by how long they held it and get Orichalcum for it at the end.', ''],
  [0, '', 'Teleport: Advanced Teleporters are free in the mine, with a cooldown, and extra ones can be used during the cooldown.', ''],
  [0, '', 'Bonuses: Tech Research, VIP, item and skin bonuses work in the mine. March Speed and Hunting March Speed bonuses do not, except those from Frostfire Skills.', '']
];
const FROSTFIRE_REWARD_NOTES = [
  [0, '', 'Gathering and ranking rewards are given at the end of the event, by the total Orichalcum gathered.', ''],
  [0, 'ranking|Smelter', 'Chiefs who held the Smelter for more than 1 second are ranked by how long they held it.', '']
];
const CRAZY_JOE_RULES = [
  [0, '', 'Start: R4s and the Leader start the event and set its start time. The difficulty is chosen in Settings.', ''],
  [0, '', 'Defense: A defense succeeds when 50% or more of the enemy troops are killed. Bandits attacking the Alliance HQ go to the Tundra HQ first, or to the Icefield HQ if there is none.', ''],
  [0, '', 'More points: Elite Bandits at Lv. 7, 14 and 17 and Crazy Joe at Lv. 10 and 20 give many points. The Elite Bandits attack only online chiefs, and Crazy Joe at Lv. 10 and 20 attacks the Alliance HQ. Reinforcing allies earns points equal to 50% of the defeats, without lowering theirs.', ''],
  [0, '', 'Leaving the alliance: It clears the chief\'s points with that alliance, but not their personal ranking or rewards.', '']
];
const CRAZY_JOE_REWARD_NOTES = [
  [0, '', 'Rewards are sent by mail within 12 hours after the event. Alliance Ranking Rewards go only to members in the alliance at that time.', '']
];
const BEAST_POINTS = [
  [0, '', 'Defeat 1 beast', '1'],
  [0, '', 'Call a rally and hunt down 1 Polar Terror', '3']
];
const BEAST_RULES = [
  [0, '', 'Targets: A higher Furnace level at the start of the event means higher point targets and better rewards.', '']
];
const BEAST_REWARD_NOTES = [
  [0, 'ranking', 'The top 100 chiefs with over 20 points get these by mail.', '']
];
const FLAME_AND_FANGS_NOTES = [
  [0, 'shop', 'Completing Lighthouse Intel gives Crystallite Cores, which are exchanged here.', '']
];
const LUCKY_WHEEL_RULES = [
  [0, '', 'Spins: Lucky Chips pay for spins, or Gems when there are not enough chips, and 10 spins cost 9 Lucky Chips. Each chief can spin 150 times a day. Available spins refresh daily at 00:00 UTC, and the total spin count does not reset during the event.', ''],
  [0, '', 'Hero: Chiefs choose one of up to 3 heroes from Lucky Wheel events, the current generation\'s and the 2 before it. Choosing a hero turns the chest rewards not yet claimed into that hero\'s shards, and claimed ones stay as they are.', ''],
  [0, '', 'Mystery Packs: When a Mystery Pack shows a quantity range, each quantity has the same chance.', '']
];
const LUCKY_WHEEL_REWARD_NOTES = [
  [0, 'targets', 'Each chest opens for free once the total spins reach its number. It gives shards of the chosen hero and both Mythic manuals.', '']
];
const WILD_BRAWL_RULES = [
  [0, '', 'Icebreaker Shop: Pioneer Badges are spent here and can be used only during Wild Brawl.', '']
];

// Frosty Fortune's Treasure Hunt Drill: Daily Missions [mission, [item, quantity, tile]...], and the Emporium of
// Enigma shop [price in Thorns of Enigma, item, quantity, tile, limit]. Seen in game 17 Nov 2026.
const TREASURE_HUNT_MISSIONS = [
  ['Log in', [['treasure-hunt-points', 200, 'purple'], ['gem-of-enigma', 30, 'orange'], ['speedup-general-5m', 10, 'green']]],
  ['Use 1,000m of Any Speedup', [['treasure-hunt-points', 100, 'purple'], ['gem-of-enigma', 30, 'orange'], ['treasure-hunt-chest', 1, 'purple'], ['speedup-general-5m', 20, 'green']]],
  ['Defeat 10 Beasts', [['treasure-hunt-points', 100, 'purple'], ['gem-of-enigma', 30, 'orange'], ['speedup-training-5m', 10, 'green']]],
  ['Use Epic Recruitment 2 time(s)', [['treasure-hunt-points', 100, 'purple'], ['gem-of-enigma', 30, 'orange'], ['speedup-research-5m', 10, 'green']]],
  ['Finish 5 Intel Mission(s)', [['treasure-hunt-points', 100, 'purple'], ['hero-xp-10k', 1, 'purple'], ['resource-supply-chest-10k', 2, 'blue']]],
  ['Train/Promote up 30,000 Troop Power', [['treasure-hunt-points', 100, 'purple'], ['enhancement-xp-component-10', 5, 'green'], ['resource-supply-chest-10k', 2, 'blue']]]
];
const EMPORIUM_OF_ENIGMA_SHOP = [
  [5, 'essence-stones', 1, 'orange', 'Daily Limit 5'], ['1,500', 'windmill-village', 1, 'orange', 'Limit 1'], ['1,500', 'forgetown', 1, 'orange', 'Limit 1'],
  [420, 'brute-mammoth', 1, 'orange', 'Limit 1'], [280, 'snowmobile', 1, 'orange', 'Limit 1'], [10, 'mystery-badge', 500, 'purple', 'Limit 30'],
  [10, 'custom-hero-widget-chest', 1, 'orange', 'Limit 200'], [10, 'mythic-general-hero-shard', 1, 'orange', 'Limit 10'],
  [2, 'enhancement-xp-component', 1, 'purple', 'Limit 50'], [5, 'pet-bag', '1,600', 'blue', 'Limit 200'],
  [10, 'pet-advancement-materials-custom-chest', 4, 'orange', 'Limit 200'], [20, 'advanced-wild-mark', 1, 'orange', 'Limit 100'],
  [2, 'fire-crystal', 1, 'orange', 'Limit 100'], [1, 'speedup-general-1h', 1, 'blue', 'Limit 25'], [1, 'emporium-resource-chest', 1, 'purple', 'Limit 99999']
];
const TREASURE_HUNT_NOTES = [
  [0, '', 'Treasure Hunt Points unlock rewards in the Treasure Hunt Drill, and Gems of Enigma open chests in Frosty Fortune. Daily Missions refresh at 00:00 UTC.', '']
];

// Rows of these lists, added once each with fixed ids (sort orders from 1501).
const GAME_LISTS_NOV_17 = pointRowsFrom_('pac', 'alliance-championship', 1501, ALLIANCE_CHAMPIONSHIP_RULES, 'rules')
  .concat(pointRowsFrom_('pacw', 'alliance-championship', 1511, ALLIANCE_CHAMPIONSHIP_REWARD_NOTES, 'rewards'))
  .concat(pointRowsFrom_('pkoiw', 'koi', 1521, KOI_RANKING_NOTES, 'rewards'))
  .concat(pointRowsFrom_('pds', 'dreamscape', 1531, DREAMSCAPE_RULES, 'rules'))
  .concat(pointRowsFrom_('pdsw', 'dreamscape', 1541, DREAMSCAPE_REWARD_NOTES, 'rewards'))
  .concat(pointRowsFrom_('pff', 'frostfire', 1551, FROSTFIRE_RULES, 'rules'))
  .concat(pointRowsFrom_('pffw', 'frostfire', 1561, FROSTFIRE_REWARD_NOTES, 'rewards'))
  .concat(pointRowsFrom_('pcj', 'crazy-joe', 1571, CRAZY_JOE_RULES, 'rules'))
  .concat(pointRowsFrom_('pcjw', 'crazy-joe', 1581, CRAZY_JOE_REWARD_NOTES, 'rewards'))
  .concat(pointRowsFrom_('pdb', 'defeat-beasts', 1591, BEAST_POINTS))
  .concat(pointRowsFrom_('pdbr', 'defeat-beasts', 1596, BEAST_RULES, 'rules'))
  .concat(pointRowsFrom_('pdbw', 'defeat-beasts', 1598, BEAST_REWARD_NOTES, 'rewards'))
  .concat(pointRowsFrom_('pflw', 'flame-and-fang', 1601, FLAME_AND_FANGS_NOTES, 'rewards'))
  .concat(pointRowsFrom_('plw', 'lucky-wheel', 1611, LUCKY_WHEEL_RULES, 'rules'))
  .concat(pointRowsFrom_('plww', 'lucky-wheel', 1621, LUCKY_WHEEL_REWARD_NOTES, 'rewards'))
  .concat(pointRowsFrom_('pwb', 'wild-brawl', 1631, WILD_BRAWL_RULES, 'rules'))
  .concat(pointRowsFrom_('pthm', 'treasure-hunt-drill', 1641, TREASURE_HUNT_NOTES, 'missions'));

// The reward rows of the lists above, in the order they show.
function rewardsSeenNov17_(add) {
  Object.keys(ALLIANCE_CHAMPIONSHIP_TIERS).forEach(function (tier) {
    ALLIANCE_CHAMPIONSHIP_PRESTIGE.forEach(function (itemId) { add('alliance-championship', 'group', tier, 'prestige', '', itemId, '', 'none'); });
    ALLIANCE_CHAMPIONSHIP_TIERS[tier].forEach(function (rank) {
      rank[2].forEach(function (reward) { add('alliance-championship', 'group', tier, '', rank[0], reward[0], String(reward[1]), reward[2], '', rank[1]); });
    });
  });
  ALLIANCE_CHAMPIONSHIP_KO.forEach(function (row) {
    row[1].forEach(function (reward) { add('alliance-championship', 'ko', '', '', row[0], reward[0], String(reward[1]), reward[2]); });
  });
  KOI_TARGETS_STAGE_2.forEach(function (target) {
    target[1].forEach(function (reward) { add('koi', 'targets', 'Stage 2', '', target[0], reward[0], String(reward[1]), reward[2]); });
  });
  KOI_MEDALS_MORE.forEach(function (row) {
    row[1].forEach(function (reward) { add('koi', 'medals', '', '', row[0], reward[0], String(reward[1]), reward[2] || 'orange'); });
  });
  Object.keys(KOI_RANKING).forEach(function (band) {
    KOI_RANKING[band].forEach(function (rewards, index) {
      rewards.forEach(function (reward) { add('koi', 'ranking', band, '', KOI_RANKS[index], reward[0], String(reward[1]), reward[2]); });
    });
  });
  KOI_CROSS_STATE.forEach(function (row, index) {
    const rank = KOI_CROSS_STATE_RANKS[index];
    add('koi', 'ranking', 'Cross-State', '', rank, 'lloyd-shards', String(row[0]), 'orange');
    if (row[1]) add('koi', 'ranking', 'Cross-State', '', rank, 'nameplate-' + row[1] + 'd', '1', 'purple');
    if (row[2]) add('koi', 'ranking', 'Cross-State', '', rank, 'avatar-frame-' + row[2] + 'd', '1', 'purple');
    add('koi', 'ranking', 'Cross-State', '', rank, 'fire-crystal', String(row[3]), 'orange');
    add('koi', 'ranking', 'Cross-State', '', rank, 'gems', String(row[4]), 'orange');
  });
  KOI_STATE_RANK.forEach(function (row) {
    add('koi', 'ranking', 'State Rank', '', row[0], 'speedup-training-5m', String(row[1]), 'green');
    add('koi', 'ranking', 'State Rank', '', row[0], row[2], String(row[3]), row[4]);
    add('koi', 'ranking', 'State Rank', '', row[0], 'resource-supply-chest-10k', String(row[5]), 'blue');
  });
  DREAMSCAPE_CHAPTERS.forEach(function (chapter) {
    chapter[1].forEach(function (reward) { add('dreamscape', 'targets', '', '', chapter[0], reward[0], String(reward[1]), reward[2]); });
  });
  FROSTFIRE_GATHERING.forEach(function (row) {
    row[1].forEach(function (reward) { if (reward[1]) add('frostfire', 'targets', '', '', row[0], reward[0], String(reward[1]), reward[2]); });
  });
  FROSTFIRE_RANKING.forEach(function (row, index) {
    const rank = FROSTFIRE_RANKS[index];
    if (row[0]) add('frostfire', 'ranking', 'Ranking', '', rank, 'blue-flame-avatar-frame', '1', 'purple');
    add('frostfire', 'ranking', 'Ranking', '', rank, 'charm-design', String(row[1]), 'orange');
    add('frostfire', 'ranking', 'Ranking', '', rank, 'charm-guide', String(row[2]), 'orange');
    add('frostfire', 'ranking', 'Ranking', '', rank, 'shot-token', String(row[3]), 'orange');
    add('frostfire', 'ranking', 'Ranking', '', rank, 'gems', row[4], row[5]);
    add('frostfire', 'ranking', 'Ranking', '', rank, 'custom-resource-chest-2', String(row[6]), 'blue');
  });
  FROSTFIRE_SMELTER.forEach(function (amount, index) { add('frostfire', 'ranking', 'Smelter', '', String(index + 1), 'orichalcum', amount, 'grey'); });
  CRAZY_JOE_LEVELS.forEach(function (row, index) {
    add('crazy-joe', 'targets', '', '', 'Lv. ' + (index + 1), row[2], String(row[3]), row[4], '', 'Personal ' + row[0] + ' · Alliance ' + row[1]);
  });
  Object.keys(CRAZY_JOE_RANKING).forEach(function (band) {
    CRAZY_JOE_RANKING[band].forEach(function (row) {
      [['design-plans', 'orange'], ['polishing-solution', 'purple'], ['hardened-alloy', 'blue'], ['custom-resource-chest-2', 'blue']].forEach(function (item, index) {
        if (row[index + 1]) add('crazy-joe', 'ranking', band, '', row[0], item[0], String(row[index + 1]), item[1]);
      });
    });
  });
  BEAST_TARGETS.forEach(function (target) {
    target[1].forEach(function (reward) { add('defeat-beasts', 'targets', '', '', target[0], reward[0], String(reward[1]), reward[2]); });
  });
  BEAST_RANKING.forEach(function (row) {
    if (row[1]) add('defeat-beasts', 'ranking', '', '', row[0], 'mythic-general-decoration-component', String(row[1]), 'orange');
    add('defeat-beasts', 'ranking', '', '', row[0], 'gems', row[2], row[3]);
    add('defeat-beasts', 'ranking', '', '', row[0], 'speedup-research-1h', String(row[4]), 'blue');
    add('defeat-beasts', 'ranking', '', '', row[0], 'speedup-construction-1h', String(row[5]), 'blue');
    if (row[6]) add('defeat-beasts', 'ranking', '', '', row[0], 'gold-key', String(row[6]), 'purple');
  });
  FLAME_AND_FANGS_SHOP.forEach(function (offer) {
    add('flame-and-fang', 'shop', '', '', String(offer[0]), offer[1], String(offer[2]), offer[3], '', 'Limit ' + offer[4]);
  });
  LUCKY_WHEEL_RATES.forEach(function (row, index) {
    add('lucky-wheel', 'rates', '', '', row[0], row[1], String(row[2]), row[3], '', '', 'row' + (index + 1));
  });
  TREASURE_HUNT_MISSIONS.forEach(function (mission) {
    mission[1].forEach(function (reward) { add('treasure-hunt-drill', 'missions', 'Daily', '', mission[0], reward[0], String(reward[1]), reward[2]); });
  });
  EMPORIUM_OF_ENIGMA_SHOP.forEach(function (offer) {
    add('emporium-of-enigma', 'shop', '', '', String(offer[0]), offer[1], String(offer[2]), offer[3], '', offer[4]);
  });
  LUCKY_WHEEL_CHESTS.forEach(function (chest) {
    [['eleonora-shards'], ['mythic-exploration-manual'], ['mythic-expedition-skill-manual']].forEach(function (item) {
      add('lucky-wheel', 'targets', '', '', '×' + chest[0], item[0], String(chest[1]), 'orange');
    });
  });
}

const TAL_GLORY = { champion: ['alliance-hq-skin', 'alliance-banner-skin', 'tundra-warlord', 'alliance-banner-champion'], top4: ['weapons-master', 'alliance-banner-top4'] };

function startingRewards_() {
  const rows = [];
  // idSuffix: only for rows that would otherwise share an id (the same item twice on one row).
  const add = function (eventTypeId, list, band, section, rowLabel, itemId, quantity, tile, source, note, idSuffix) {
    if (!quantity && quantity !== '0' && list !== 'merchant' && list !== 'glory' && section !== 'prestige') return;
    const parts = String(quantity).split('|');
    rows.push({
      id: ['rw', eventTypeId, list, band, section, rowLabel, itemId].concat(idSuffix ? [idSuffix] : []).join('-').toLowerCase().replace(/[^a-z0-9+]+/g, '-').replace(/-+$/, ''),
      eventTypeId: eventTypeId, list: list, band: band, section: section, rowLabel: rowLabel, itemId: itemId,
      quantity: parts[0], tile: parts[1] || tile, sortOrder: String(rows.length + 1), source: source || '', note: note || ''
    });
  };
  Object.keys(SHOWDOWN_RANKING).forEach(function (band) {
    ['win', 'lose'].forEach(function (section) {
      SHOWDOWN_RANKING[band][section].forEach(function (rank) {
        SHOWDOWN_RANKING_ITEMS.forEach(function (itemId, index) {
          add('showdown', 'ranking', band, section, rank[0], itemId, rank[index + 1], SHOWDOWN_RANKING_TILES[index]);
        });
      });
    });
  });
  ['win', 'lose'].forEach(function (section) {
    Object.keys(SHOWDOWN_STAR[section]).forEach(function (band) {
      SHOWDOWN_STAR_ITEMS.forEach(function (itemId, index) {
        add('showdown', 'star', band, section, '', itemId, SHOWDOWN_STAR[section][band][index], SHOWDOWN_STAR_TILES[index]);
      });
    });
    SHOWDOWN_DAILY_ITEMS.forEach(function (itemId, index) {
      add('showdown', 'daily', '', section, '', itemId, SHOWDOWN_DAILY[section][index], SHOWDOWN_DAILY_TILES[index]);
    });
  });
  SHOWDOWN_DAY_ITEMS.forEach(function (dayItem, dayIndex) {
    const day = String(dayIndex + 1);
    const points = dayIndex >= 4 ? SHOWDOWN_CHEST_POINTS.long : SHOWDOWN_CHEST_POINTS.short;
    // Days 4 and 5 were seen in game; the other days are from guides.
    const source = day === '4' || day === '5' ? '' : 'guides';
    SHOWDOWN_CHESTS.forEach(function (chest, chestIndex) {
      chest.forEach(function (content) {
        const isDayItem = content[0] === 'DAY_ITEM';
        add('showdown', 'chests', day, '', points[chestIndex], isDayItem ? dayItem[0] : content[0], isDayItem ? dayItem[1] : content[1], content[2], source);
      });
    });
    add('showdown', 'horns', day, '', '', 'showdown-win-horn', SHOWDOWN_DAY_HORNS[dayIndex], '');
  });
  SHOWDOWN_EXPERT_CHESTS.forEach(function (chest) {
    chest[1].forEach(function (content) { add('showdown', 'expert', '', '', chest[0], content[0], content[1], content[2]); });
  });
  Object.keys(WINTER_SIEGE_TIER_REWARDS).forEach(function (tier) {
    ['streak', 'win', 'lose'].forEach(function (section) {
      const result = WINTER_SIEGE_TIER_REWARDS[tier][section];
      WINTER_SIEGE_TIER_ITEMS.forEach(function (itemId, index) {
        add('winter-siege', 'tier', tier, section, result[0], itemId, result[index + 1], 'orange');
      });
    });
  });
  WINTER_SIEGE_CONQUEST.forEach(function (stronghold) {
    [['fire-crystal', 'orange'], ['treasure-box', 'purple'], ['speedup-general-1h', 'blue']].forEach(function (item) {
      add('winter-siege', 'conquest', '', '', stronghold[0], item[0], stronghold[1], item[1]);
    });
  });
  Object.keys(TAL_MISSIONS).forEach(function (band) {
    TAL_MISSIONS[band].forEach(function (mission) {
      mission[1].forEach(function (reward) { add('hellfire', 'missions', band, '', mission[0], reward[0], reward[1], reward[2]); });
    });
  });
  WINTER_MERCHANT.forEach(function (offer) {
    add('winter-siege', 'merchant', '', '', offer[1], offer[0], '1', offer[3], '', 'Limit ' + offer[2]);
  });
  // Added 16 Nov 2026 at the end, so the order numbers of the rows before them stay the same.
  Object.keys(KOI_TARGETS).forEach(function (band) {
    KOI_TARGETS[band].forEach(function (target) {
      target[1].forEach(function (reward) { add('koi', 'targets', band, '', target[0], reward[0], String(reward[1]), reward[2]); });
    });
  });
  KOI_MEDALS.forEach(function (row) {
    row[1].forEach(function (reward) { add('koi', 'medals', '', '', row[0], reward[0], String(reward[1]), reward[2] || 'orange'); });
  });
  Object.keys(TAL_GLORY).forEach(function (section) {
    TAL_GLORY[section].forEach(function (itemId) { add('hellfire', 'glory', '', section, '', itemId, '', 'none'); });
  });
  Object.keys(TAL_RANKING).forEach(function (band) {
    TAL_RANKING[band].forEach(function (rewards, index) {
      rewards.forEach(function (reward) { add('hellfire', 'ranking', band, '', TAL_RANKS[index], reward[0], String(reward[1]), reward[2] || 'orange'); });
    });
  });
  Object.keys(TAL_COMBATANT).forEach(function (band) {
    ['win', 'lose'].forEach(function (section) {
      TAL_COMBATANT[band][section].forEach(function (reward) { add('hellfire', 'combatant', band, section, '', reward[0], String(reward[1]), reward[2] || 'orange'); });
    });
    ['personal-win', 'personal-lose'].forEach(function (section) {
      TAL_COMBATANT[band][section].forEach(function (rewards, index) {
        rewards.forEach(function (reward) { add('hellfire', 'combatant', band, section, TAL_POINT_RANGES[index], reward[0], String(reward[1]), reward[2] || 'orange'); });
      });
    });
  });
  // Added 17 Nov 2026 at the end, so the order numbers of the rows before them stay the same.
  rewardsSeenNov17_(add);
  return rows;
}

// Starting reward rows checked in game after they were first added (Alliance Showdown's day 5 chests, 15 Nov 2026)
// lose their "from guides" mark, only where the mark is still the one setup wrote.
function markRewardsSeenInGame_() {
  const seenNow = startingRewards_().filter(function (row) { return row.source === ''; });
  const seenIds = {};
  seenNow.forEach(function (row) { seenIds[row.id] = true; });
  readTable_('Rewards').forEach(function (row) {
    if (seenIds[row.id] && row.source === 'guides') upsertRow_('Rewards', 'id', { id: row.id, source: '' });
  });
}