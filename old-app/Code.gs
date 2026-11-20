/**
 * WOS Events Calendar – State 1458
 * Server side (Google Apps Script, bound to the Google Sheet).
 *
 * First time: run runSetup() (in Setup.gs) once from the script editor and allow access.
 * Then deploy as a web app: Execute as "Me", Who has access "Anyone".
 */

const APP_TITLE = 'State 1458 · Events';
const STATE_NUMBER = 1458;
const SESSION_LENGTH_DAYS = 60;
const LOGIN_CODE_MINUTES = 10;
const LOGIN_CODE_MAX_TRIES = 5;

// Every sheet tab the app uses, with its columns in order.
// New features (players, sign-up lists, fortress assignments) add their own tabs here.
const TABLES = {
  Settings: ['key', 'value'],
  Admins: ['email', 'addedBy', 'addedOn'],
  Users: ['email', 'name', 'allianceId', 'preferences', 'updatedOn'],
  Sessions: ['token', 'email', 'expiresOn'],
  // An academy is an alliance of its own (own legions, traps, times). Its members and the main alliance's see each other's times.
  // followsMain is no longer used; the column stays so older sheets keep their layout.
  // showdownStars: the alliance's Alliance Showdown Star Rating; winterSiegeTier: its Winter Siege tier (Rookie … Legendary).
  // Both are set by admins and decide which rewards the alliance's members see first.
  Alliances: ['id', 'name', 'tag', 'mainAllianceId', 'logoUrl', 'baseColor', 'secondColor', 'sortOrder', 'followsMain',
    'showdownStars', 'winterSiegeTier'],
  // imageFile: the picture's file name in the image folder, without .png (empty = the event id).
  // partOf: the main event this one belongs to (for example Emporium of Enigma is part of Frosty Fortune).
  // groupName + groupCount: events where each alliance has several groups, for example 2 legions or 2 traps.
  // opponentCount + opponentHasAlliance: who you are matched against (SvS: 1 state; Foundry: 1 state + alliance; Canyon: 2).
  EventTypes: ['id', 'name', 'shortName', 'category', 'color', 'icon', 'iconUrl', 'detailsOnly', 'sortOrder', 'notes', 'pointsNote', 'imageFile',
    'partOf', 'groupName', 'groupCount', 'opponentCount', 'opponentHasAlliance',
    // resultType: 'winloss' (won / lost) or 'rank' (the state's or alliance's rank). Players' own ranks are no longer kept.
    // hasPresident = 'yes': the winner's alliance and president can be noted (Sunfire, Castle Battle).
    'resultType', 'hasPresident',
    // slotTimes: start times a player can pick for themselves, for example Frostfire "02:00,06:00,10:00" (empty = none).
    // colorEnd: a second colour, so the bar fades from color to colorEnd (SvS: blue to red). Empty = one colour.
    // typeLabel: a small label shown with the event, for example "Mini-game" (empty = none).
    'slotTimes', 'colorEnd', 'typeLabel',
    // otherName: another name players use, shown faintly with the notes (Brothers in Arms: "Kill Event").
    // timelineColor: the colour of this event's line in an event timeline (SvS: preparation blue, battle red). Empty = color.
    // Two colours joined by ">" fade from the first to the second (Field Triage: red to teal).
    // barSubtitle: a second line on the event's calendar bar, under its name (Field Triage: "Troop Revival").
    // pointsTitle: the title of the folded list under the event (empty = "Points"), for example "Missions and shop".
    // allianceRequirement / playerRequirement: who can join, in the game's words (shown as "Requirements").
    // openWindows: for a part that is open only at certain times (Match Prediction, Champion Prediction), each opening
    // as "first day HH:MM-last day HH:MM label", separated by ";". Days count from the part's own first day (1);
    // 24:00 is the end of a day. Example: "1 00:00-2 19:00 Round 1; 3 00:00-4 19:00 Round 2". Empty = open all the time.
    // windowMark: how the openings show on the main event's bar, line 2: '' = the part's logo where each opening ends,
    // 'label' = the logo and the opening's label on the opening (Champion Prediction: "×16").
    'otherName', 'timelineColor', 'barSubtitle', 'pointsTitle', 'allianceRequirement', 'playerRequirement', 'openWindows', 'windowMark'],
  // groupNumber: which legion / trap this schedule is for (empty for events without groups).
  // startTimeUtc is the start on the first day; endTimeUtc the end on the last day (empty = reset, 24:00).
  // sinceDate: the day the event came to the game; a repeating schedule shows no date before it (empty = no limit).
  // shiftWithMoves = 'yes': a moved date also moves the dates predicted from it (Tundra Arms League, Frostdragon Tyrant).
  Schedules: ['id', 'eventTypeId', 'allianceIds', 'label', 'firstDate', 'repeatEveryDays', 'lengthDays', 'startTimeUtc', 'endTimeUtc', 'untilDate', 'note',
    'groupNumber', 'sinceDate', 'shiftWithMoves'],
  // One row per changed date: moved, new times, cancelled, state alliance, opponents, note.
  DateChanges: ['id', 'scheduleId', 'originalDate', 'newDate', 'cancelled', 'newStartTimeUtc', 'newEndTimeUtc', 'stateAllianceId', 'note',
    'opponentState1', 'opponentAlliance1', 'opponentState2', 'opponentAlliance2',
    'result', 'rank', 'presidentAllianceId', 'presidentName'],
  TransferGroups: ['id', 'transferDate', 'fromState', 'toState', 'generation', 'furnaceCap'],
  // How to earn points in an event. dayNumber empty = the whole event; points empty = a note line.
  // list: '' = points (or notes) of the event or of one day; 'rules' = the event's Rules, shown in their own fold;
  // 'predictions', 'rewards', 'missions' = notes shown at the top of the event's Predictions, Rewards or Missions tab.
  // imageFile: a picture shown beside a note, path inside the image repo (for example experts/baldur.png).
  PointSources: ['id', 'eventTypeId', 'dayNumber', 'dayName', 'task', 'points', 'sortOrder', 'list', 'imageFile'],
  // Steps inside an event, shown in the day's timeline (sign-up, qualifier, rounds, votes...).
  // dayNumber counts from the event's first day (1 = first day).
  // note: instructions shown under the step's name (smaller, with an instructions icon).
  // barMark: 'yes' = the step is also a white line on the event's bar.
  EventSteps: ['id', 'eventTypeId', 'dayNumber', 'startTimeUtc', 'endTimeUtc', 'label', 'sortOrder', 'note', 'barMark'],
  // Phases of an event (Registration, Battles...): days of the event, counted from its first day (1 = first day).
  // Each phase is its own bar in the calendar, unless hideBar = 'yes' (then it shows only on the event's page).
  // startTimeUtc / endTimeUtc (optional): when the phase starts on its first day and ends on its last day
  // (empty = the day's reset; an end of 00:00 = the end of that day). note: instructions under the phase's name.
  EventPhases: ['id', 'eventTypeId', 'fromDay', 'toDay', 'name', 'hideBar', 'sortOrder', 'startTimeUtc', 'endTimeUtc', 'note'],
  // Each player's own slot in events with slots (Frostfire). Only that player can see their rows.
  // rank and note are no longer filled in; the columns stay so older sheets keep their layout.
  PersonalEntries: ['id', 'email', 'scheduleId', 'originalDate', 'myTime', 'rank', 'note', 'updatedOn'],
  // Fortress Battles: the reward of each fortress / stronghold in each phase (game data, from the Fort Distribution sheet).
  FortRewards: ['id', 'fort', 'phase', 'reward', 'quantity', 'tile'],
  // Fortress Battles: per fortress / stronghold and phase of a season, the alliance that fights for it or took it,
  // and the time of its battle (Friday, UTC).
  FortHolders: ['id', 'seasonStart', 'fort', 'phase', 'allianceId', 'battleTimeUtc'],
  // Reward items, with the game's names. imageFile: path inside the image repo (for example items/gems.png); empty = no
  // picture yet (a "?" shows). label: the small text on top of the tile in the game ("Lv.1", "1 hr(s)", "100 K").
  Items: ['id', 'name', 'imageFile', 'label'],
  // Rewards of an event, one row per item (game data). list: which list the row belongs to (see REWARD_LISTS).
  // band: the Star Rating band ("1-2"), the tier ("Exalted") or the day of the event ("4"), when the list has them.
  // section: 'win', 'lose' or 'streak' when the list is split by result. rowLabel: the words on the row's left
  // (rank "3-5", points "25,000", stronghold, cost). tile: the colour behind the item, as in the game (TILE_COLORS).
  // source: 'guides' when the row is not checked in game yet. note: a short line under the row (for example "Limit 3").
  Rewards: ['id', 'eventTypeId', 'list', 'band', 'section', 'rowLabel', 'itemId', 'quantity', 'tile', 'sortOrder', 'source', 'note'],
  // Alliance Showdown: one row per alliance and run, set by admins. winners: 6 values, one per day, separated by commas
  // (us, them, tie or empty). mvps: 6 names separated by "|" (the day's MVP, empty when not known).
  MatchScores: ['id', 'scheduleId', 'originalDate', 'allianceId', 'opponentState', 'opponentAlliance', 'winners', 'mvps']
};

// What the rows of the Rewards tab can be.
// Alliance Showdown: daily (the day's winner and loser), star (by Star Rating), ranking (by Personal Points rank),
// chests (each day's Daily Chests), expert (extra chests from Baldur's Dawn Hymn), horns (what winning each day is worth).
// Winter Siege: tier (by tier, win streak / victory / loss), conquest (each enemy stronghold), merchant (Winter Merchant).
// Tundra Arms League: missions (Match Missions; band = Daily or Weekly, rowLabel = the mission).
// targets: rewards for reaching a number (points, a level, a chapter, spins); medals: Medal of Honor (King of Icefield).
// group: Alliance Championship Tier Rewards (band = tier; section 'prestige' = the Prestige Rewards, the other rows by
// group rank, note = the Star Rating change). ko: Alliance Championship KO Rewards. shop: an event's shop (rowLabel =
// the price, note = the limit). rates: Lucky Wheel Reward Rates (rowLabel = the chance).
const REWARD_LISTS = ['daily', 'star', 'ranking', 'chests', 'expert', 'horns', 'tier', 'conquest', 'merchant', 'missions', 'glory', 'combatant', 'targets', 'medals',
  'group', 'ko', 'shop', 'rates'];

// Where a point source row shows: '' = the points list, the others are notes (see PointSources above).
const POINT_SOURCE_LISTS = ['', 'rules', 'predictions', 'rewards', 'missions'];

// The colours behind items in the game (empty = no tile, the picture alone).
const TILE_COLORS = ['', 'grey', 'green', 'blue', 'purple', 'orange'];

// Winter Siege tiers, lowest first.
const WINTER_SIEGE_TIERS = ['Rookie', 'Stalwart', 'Pioneer', 'Exalted', 'Mythic', 'Legendary'];

// Alliance Showdown has 6 days that can be won.
const SHOWDOWN_WIN_DAYS = 6;

// The 12 fortresses and 4 strongholds, and the 8 weekly phases of a Fortress season.
const FORT_NAMES = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'SH1', 'SH2', 'SH3', 'SH4'];
const FORT_PHASES = 8;

// What an event's result can be.
const RESULT_TYPES = ['', 'winloss', 'rank'];

// Tables admins may edit from the app, and the column that identifies a row.
const ADMIN_EDITABLE_TABLES = ['Alliances', 'EventTypes', 'Schedules', 'DateChanges', 'TransferGroups', 'PointSources', 'EventSteps', 'EventPhases', 'FortRewards', 'FortHolders',
  'Items', 'Rewards', 'MatchScores'];

// The filters. Times set for one alliance always show under "alliance", whatever the event's category.
const EVENT_CATEGORIES = ['state', 'alliance', 'personal', 'deals'];

// Categories of older versions and the filter they became.
const OLD_CATEGORIES = { battle: 'alliance', timed: 'alliance', minigames: 'personal', shops: 'deals', transfer: 'state' };

// Times every alliance starts with, academies included (00:00 UTC; admins change them per alliance).
// Each row becomes one schedule per alliance.
const ALLIANCE_DEFAULT_SCHEDULES = [
  { key: 'bear-1', eventTypeId: 'bear', groupNumber: '1', firstDate: '2026-11-02', repeatEveryDays: '2' },
  { key: 'bear-2', eventTypeId: 'bear', groupNumber: '2', firstDate: '2026-11-02', repeatEveryDays: '2' },
  { key: 'joe-1', eventTypeId: 'crazy-joe', groupNumber: '1', firstDate: '2026-11-03', repeatEveryDays: '14' },
  { key: 'joe-2', eventTypeId: 'crazy-joe', groupNumber: '2', firstDate: '2026-11-05', repeatEveryDays: '14' },
  { key: 'foundry-1', eventTypeId: 'foundry', groupNumber: '1', firstDate: '2026-11-01', repeatEveryDays: '14' },
  { key: 'foundry-2', eventTypeId: 'foundry', groupNumber: '2', firstDate: '2026-11-01', repeatEveryDays: '14' },
  { key: 'canyon-1', eventTypeId: 'canyon', groupNumber: '1', firstDate: '2026-10-31', repeatEveryDays: '28' },
  { key: 'canyon-2', eventTypeId: 'canyon', groupNumber: '2', firstDate: '2026-10-31', repeatEveryDays: '28' },
  // Mercenary Prestige: alliances usually summon the bosses on the event's last day (Monday).
  { key: 'mercs', eventTypeId: 'mercenaries', groupNumber: '', firstDate: '2026-11-16', repeatEveryDays: '28' }
];

// The most legions / traps an event can have per alliance.
const MAX_GROUPS = 4;

// The most opponents an event can have (Canyon Clash has 2).
const MAX_OPPONENTS = 2;

// Settings an admin may change, with the values allowed (null = any text).
const EDITABLE_SETTINGS = {
  transferFollows: ['svs', 'sunfire'],
  imageBaseUrl: null,
  fortressSeasonStart: null,
  // The generation the Fortress rewards' hero names are written for (their shards move on with the state's generation).
  fortRewardsGeneration: null,
  // The link of the sign-in web app (SignIn.gs), set by the owner.
  signInUrl: null
};

// The schedule id used for transfers, which are worked out from SvS or Sunfire.
const TRANSFER_SCHEDULE_ID = 'transfers';

// The only event whose dates can be cancelled (Brothers in Arms, the Kill Event).
const CANCELLABLE_EVENT_ID = 'bia';

/* ------------------------------------------------------------------ */
/* Web app entry                                                       */
/* ------------------------------------------------------------------ */

function doGet() {
  const page = HtmlService.createTemplateFromFile('Index');
  page.stateNumber = STATE_NUMBER;
  page.appTitle = APP_TITLE;
  return page.evaluate()
    .setTitle(APP_TITLE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Lets Index.html pull in IndexJS.html.
function include(fileName) {
  return HtmlService.createHtmlOutputFromFile(fileName).getContent();
}

/* ------------------------------------------------------------------ */
/* Data for the page                                                   */
/* ------------------------------------------------------------------ */

// Everything the page needs in one call; the browser does the rest (switching months and years is instant).
function getAllData(sessionToken) {
  const signedInEmail = getSessionEmail_(sessionToken);
  const settings = readSettings_();
  const adminEmails = readTable_('Admins').map(function (row) { return row.email; });
  const isAdmin = !!signedInEmail && adminEmails.indexOf(signedInEmail) !== -1;

  let me = null;
  if (signedInEmail) {
    const userRow = readTable_('Users').filter(function (row) { return row.email === signedInEmail; })[0];
    me = {
      email: signedInEmail,
      name: userRow ? userRow.name : '',
      allianceId: userRow ? userRow.allianceId : '',
      preferences: userRow && userRow.preferences ? safeJsonParse_(userRow.preferences) : null
    };
  }

  return {
    stateNumber: STATE_NUMBER,
    settings: {
      transferFollows: settings.transferFollows || 'svs',
      imageBaseUrl: settings.imageBaseUrl || '',
      fortressSeasonStart: settings.fortressSeasonStart || '',
      fortRewardsGeneration: settings.fortRewardsGeneration || '',
      signInUrl: settings.signInUrl || ''
    },
    alliances: readTable_('Alliances'),
    eventTypes: readTable_('EventTypes'),
    schedules: readTable_('Schedules'),
    dateChanges: readTable_('DateChanges'),
    transferGroups: readTable_('TransferGroups'),
    pointSources: readTable_('PointSources'),
    eventSteps: readTable_('EventSteps'),
    eventPhases: readTable_('EventPhases'),
    fortRewards: readTable_('FortRewards'),
    fortHolders: readTable_('FortHolders'),
    items: readTable_('Items'),
    rewards: readTable_('Rewards'),
    matchScores: readTable_('MatchScores'),
    // Only the signed-in player's own ranks.
    myEntries: signedInEmail ? readTable_('PersonalEntries').filter(function (row) { return row.email === signedInEmail; }) : [],
    me: me,
    isAdmin: isAdmin,
    isOwner: isAdmin && signedInEmail === settings.ownerEmail,
    admins: isAdmin ? readTable_('Admins') : [],
    // The owner picks admins from everyone who has signed in.
    users: isAdmin && signedInEmail === settings.ownerEmail ? readTable_('Users').map(function (row) {
      return { email: row.email, name: row.name, allianceId: row.allianceId };
    }) : [],
    ownerEmail: isAdmin ? settings.ownerEmail : ''
  };
}

/* ------------------------------------------------------------------ */
/* Sign-in with a Google account                                       */
/* ------------------------------------------------------------------ */
// The page's "Sign in with Google" opens a small separate web app (SignIn.gs, its own project, deployed to run as
// the person opening it). It reads their Google email and sends them back here with a signed note
// "email|time|signature". The signature uses a secret shared by both projects, so the note cannot be made up.
// Each note works once, for SIGN_IN_NOTE_MINUTES.

const SIGN_IN_NOTE_MINUTES = 10;

// The shared secret, made once and kept in this project's script properties.
function signInSecret_() {
  const properties = PropertiesService.getScriptProperties();
  let secret = properties.getProperty('signInSecret');
  if (!secret) {
    secret = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
    properties.setProperty('signInSecret', secret);
  }
  return secret;
}

// Run from the script editor (Run → showSignInSetup): writes in the log what to paste into SignIn.gs.
function showSignInSetup() {
  const message = 'In SignIn.gs set SIGN_IN_SECRET = \'' + signInSecret_() + '\' and MAIN_APP_URL = this app\'s link (Deploy → Manage deployments).';
  Logger.log(message);
  return message;
}

// The signature of a sign-in note's text, as hex (the same calculation as in SignIn.gs).
function signInSignature_(text) {
  const bytes = Utilities.computeHmacSha256Signature(text, signInSecret_());
  return bytes.map(function (byte) { return ((byte + 256) % 256).toString(16).padStart(2, '0'); }).join('');
}

function signInWithGoogle(noteText) {
  const parts = String(noteText || '').split('|');
  if (parts.length !== 3) throw new Error('This sign-in link does not work. Please sign in again.');
  const email = normalizeEmail_(parts[0]);
  const issuedAt = Number(parts[1]);
  if (!isValidEmail_(email) || !issuedAt) throw new Error('This sign-in link does not work. Please sign in again.');
  if (signInSignature_(parts[0] + '|' + parts[1]) !== parts[2]) throw new Error('This sign-in link does not work. Please sign in again.');
  const ageMinutes = (Date.now() - issuedAt) / 60000;
  if (ageMinutes > SIGN_IN_NOTE_MINUTES || ageMinutes < -2) throw new Error('This sign-in link has expired. Please sign in again.');
  const cache = CacheService.getScriptCache();
  if (cache.get('usedSignIn:' + parts[2])) throw new Error('This sign-in link was already used. Please sign in again.');
  cache.put('usedSignIn:' + parts[2], '1', (SIGN_IN_NOTE_MINUTES + 5) * 60);
  const sessionToken = startSession_(email);
  return { sessionToken: sessionToken, data: getAllData(sessionToken) };
}

/* ------------------------------------------------------------------ */
/* Sign-in with an email code (no longer offered in the app: emails were blocked; kept for the tests)  */
/* ------------------------------------------------------------------ */

function requestLoginCode(emailText) {
  const email = normalizeEmail_(emailText);
  if (!isValidEmail_(email)) throw new Error('Please enter a valid email address.');

  const cache = CacheService.getScriptCache();
  if (cache.get('loginSentRecently:' + email)) {
    throw new Error('A code was just sent. Please wait a minute before asking again.');
  }
  if (MailApp.getRemainingDailyQuota() < 1) {
    throw new Error('No more sign-in emails can be sent today. Please try again tomorrow.');
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  cache.put('loginCode:' + email, JSON.stringify({ codeHash: hashText_(code), tries: 0 }), LOGIN_CODE_MINUTES * 60);
  cache.put('loginSentRecently:' + email, '1', 60);

  MailApp.sendEmail({
    to: email,
    subject: 'State ' + STATE_NUMBER + ' Events – your sign-in code: ' + code,
    body: 'Your sign-in code is ' + code + '.\n\nIt works for ' + LOGIN_CODE_MINUTES +
      ' minutes. If you did not ask for it, you can ignore this email.'
  });
  return { sent: true };
}

function verifyLoginCode(emailText, codeText) {
  const email = normalizeEmail_(emailText);
  const code = String(codeText || '').replace(/\s/g, '');
  const cache = CacheService.getScriptCache();
  const savedText = cache.get('loginCode:' + email);
  if (!savedText) throw new Error('This code has expired. Please ask for a new one.');

  const saved = JSON.parse(savedText);
  if (saved.tries >= LOGIN_CODE_MAX_TRIES) {
    cache.remove('loginCode:' + email);
    throw new Error('Too many wrong codes. Please ask for a new one.');
  }
  if (hashText_(code) !== saved.codeHash) {
    saved.tries += 1;
    cache.put('loginCode:' + email, JSON.stringify(saved), LOGIN_CODE_MINUTES * 60);
    throw new Error('Wrong code. Please check the email and try again.');
  }
  cache.remove('loginCode:' + email);
  const sessionToken = startSession_(email);
  return { sessionToken: sessionToken, data: getAllData(sessionToken) };
}

// Signs in the given email: a new session (old expired ones are removed) and a Users row if there is none.
function startSession_(email) {
  const sessionToken = Utilities.getUuid();
  withLock_(function () {
    const now = new Date();
    // Remove expired sessions while we are here.
    const stillValid = readTable_('Sessions').filter(function (row) {
      return new Date(row.expiresOn) > now;
    });
    const expiresOn = new Date(now.getTime() + SESSION_LENGTH_DAYS * 24 * 60 * 60 * 1000);
    stillValid.push({ token: sessionToken, email: email, expiresOn: expiresOn.toISOString() });
    replaceTable_('Sessions', stillValid);

    const userExists = readTable_('Users').some(function (row) { return row.email === email; });
    if (!userExists) {
      appendRows_('Users', [{ email: email, name: '', allianceId: '', preferences: '', updatedOn: todayText_() }]);
    }
  });
  return sessionToken;
}

// Test link: the app's link with ?admin=KEY at the end signs in as the owner, without an email.
// Run makeTestAdminLink from the script editor (Run → makeTestAdminLink): it writes the key in the execution log.
// Anyone with the key is signed in as the owner, so keep it to yourself; removeTestAdminLink turns it off.
function makeTestAdminLink() {
  if (!readSettings_().ownerEmail) throw new Error('Run runSetup first.');
  const key = Utilities.getUuid().replace(/-/g, '');
  PropertiesService.getScriptProperties().setProperty('testAdminKey', key);
  const message = 'Add this to the end of the app link: ?admin=' + key + '  (it signs in as ' + readSettings_().ownerEmail + ')';
  Logger.log(message);
  return message;
}

function removeTestAdminLink() {
  PropertiesService.getScriptProperties().deleteProperty('testAdminKey');
  Logger.log('The test link no longer signs anyone in.');
}

function signInWithAdminLink(keyText) {
  const savedKey = PropertiesService.getScriptProperties().getProperty('testAdminKey');
  if (!savedKey || String(keyText || '') !== savedKey) throw new Error('This admin link does not work (any more).');
  const sessionToken = startSession_(readSettings_().ownerEmail);
  return { sessionToken: sessionToken, data: getAllData(sessionToken) };
}

// For when the sign-in email does not arrive: run this from the script editor (Run → makeSignInCode).
// It writes a 6-digit code for the owner in the execution log. In the app: Me → "I have a code".
// Only people who can open the script editor can make a code.
function makeSignInCode() {
  const email = readSettings_().ownerEmail;
  if (!email) throw new Error('Run runSetup first.');
  const code = String(Math.floor(100000 + Math.random() * 900000));
  CacheService.getScriptCache().put('loginCode:' + email, JSON.stringify({ codeHash: hashText_(code), tries: 0 }), LOGIN_CODE_MINUTES * 60);
  const message = 'Sign-in code for ' + email + ': ' + code + ' (works for ' + LOGIN_CODE_MINUTES + ' minutes)';
  Logger.log(message);
  return message;
}

function signOut(sessionToken) {
  if (!sessionToken) return { signedOut: true };
  withLock_(function () {
    deleteRows_('Sessions', function (row) { return row.token === sessionToken; });
  });
  return { signedOut: true };
}

/* ------------------------------------------------------------------ */
/* The signed-in user's own settings                                   */
/* ------------------------------------------------------------------ */

function saveMyProfile(sessionToken, profile) {
  const email = requireSignedIn_(sessionToken);
  const allianceIds = readTable_('Alliances').map(function (row) { return row.id; });
  const name = String(profile.name || '').trim().slice(0, 40);
  const allianceId = String(profile.allianceId || '');
  if (allianceId && allianceIds.indexOf(allianceId) === -1) throw new Error('That alliance no longer exists.');

  withLock_(function () {
    upsertRow_('Users', 'email', { email: email, name: name, allianceId: allianceId, updatedOn: todayText_() });
  });
  return getAllData(sessionToken);
}

// Called quietly when a signed-in user changes filters or views.
function saveMyPreferences(sessionToken, preferences) {
  const email = requireSignedIn_(sessionToken);
  const preferencesText = JSON.stringify(preferences || {}).slice(0, 4000);
  withLock_(function () {
    upsertRow_('Users', 'email', { email: email, preferences: preferencesText, updatedOn: todayText_() });
  });
  return { saved: true };
}

// A player's own slot in an event with slots (Frostfire). An empty slot removes it.
function saveMyEntry(sessionToken, scheduleId, originalDate, entry) {
  const email = requireSignedIn_(sessionToken);
  const schedule = readTable_('Schedules').filter(function (row) { return row.id === String(scheduleId); })[0];
  if (!schedule) throw new Error('This event no longer exists.');
  const eventType = readTable_('EventTypes').filter(function (row) { return row.id === schedule.eventTypeId; })[0];
  const slots = eventType && eventType.slotTimes ? eventType.slotTimes.split(',') : [];
  if (!slots.length) throw new Error('This event has no slots to pick.');
  const dateText = String(originalDate || '');
  checkDate_(dateText, 'Date', false);
  const myTime = String((entry || {}).myTime || '').trim();
  if (myTime && slots.indexOf(myTime) === -1) throw new Error('Please pick one of the game\'s slot times.');

  withLock_(function () {
    const isThisEntry = function (row) { return row.email === email && row.scheduleId === schedule.id && row.originalDate === dateText; };
    const existing = readTable_('PersonalEntries').filter(isThisEntry)[0];
    if (!myTime) {
      deleteRows_('PersonalEntries', isThisEntry);
      return;
    }
    upsertRow_('PersonalEntries', 'id', {
      id: existing ? existing.id : makeId_(), email: email, scheduleId: schedule.id, originalDate: dateText,
      myTime: myTime, rank: '', note: '', updatedOn: todayText_()
    });
  });
  return getAllData(sessionToken);
}

/* ------------------------------------------------------------------ */
/* Admin: edit the calendar                                            */
/* ------------------------------------------------------------------ */

function saveRecord(sessionToken, tableName, record) {
  const adminEmail = requireAdmin_(sessionToken);
  if (ADMIN_EDITABLE_TABLES.indexOf(tableName) === -1) throw new Error('This list cannot be edited.');

  const cleanRecord = validateRecord_(tableName, record || {});
  const isNewAlliance = tableName === 'Alliances' && !cleanRecord.id;
  withLock_(function () {
    if (!cleanRecord.id) cleanRecord.id = makeId_();
    upsertRow_(tableName, 'id', cleanRecord);
    // A new alliance (academies too) starts with the usual times (Bear, Crazy Joe, legions, mercenaries) at 00:00.
    if (isNewAlliance) addAllianceDefaultSchedules_(cleanRecord.id);
  });
  Logger.log(adminEmail + ' saved ' + tableName + ' ' + cleanRecord.id);
  return getAllData(sessionToken);
}

function deleteRecord(sessionToken, tableName, recordId) {
  requireAdmin_(sessionToken);
  if (ADMIN_EDITABLE_TABLES.indexOf(tableName) === -1) throw new Error('This list cannot be edited.');
  const id = String(recordId || '');

  withLock_(function () {
    if (tableName === 'EventTypes') {
      const inUse = readTable_('Schedules').some(function (row) { return row.eventTypeId === id; });
      if (inUse) throw new Error('This event type still has schedules. Delete those first.');
    }
    deleteRows_(tableName, function (row) { return row.id === id; });

    if (tableName === 'EventTypes') {
      // The points list and steps of a deleted event type are no longer needed.
      deleteRows_('PointSources', function (row) { return row.eventTypeId === id; });
      deleteRows_('EventSteps', function (row) { return row.eventTypeId === id; });
      deleteRows_('EventPhases', function (row) { return row.eventTypeId === id; });
      // Its parts become events of their own.
      readTable_('EventTypes').forEach(function (row) {
        if (row.partOf === id) upsertRow_('EventTypes', 'id', { id: row.id, partOf: '' });
      });
    }

    if (tableName === 'Schedules') {
      // The date changes of a deleted schedule are no longer needed.
      deleteRows_('DateChanges', function (row) { return row.scheduleId === id; });
      deleteRows_('PersonalEntries', function (row) { return row.scheduleId === id; });
    }
    if (tableName === 'Alliances') {
      // Academies of a deleted alliance become main alliances.
      readTable_('Alliances').forEach(function (row) {
        if (row.mainAllianceId === id) upsertRow_('Alliances', 'id', { id: row.id, mainAllianceId: '' });
      });
    }
  });
  return getAllData(sessionToken);
}

function saveSetting(sessionToken, key, value) {
  requireAdmin_(sessionToken);
  if (!EDITABLE_SETTINGS.hasOwnProperty(key)) throw new Error('This setting cannot be changed.');
  const allowedValues = EDITABLE_SETTINGS[key];
  let cleanValue = String(value || '').trim();
  if (allowedValues && allowedValues.indexOf(cleanValue) === -1) throw new Error('That value is not allowed.');
  if (key === 'fortressSeasonStart') checkDate_(cleanValue, 'Season start', true);
  if (key === 'fortRewardsGeneration') checkWholeNumber_(cleanValue, 'Generation', true);
  if (key === 'signInUrl') {
    if (getSessionEmail_(sessionToken) !== readSettings_().ownerEmail) throw new Error('Only the owner can do this.');
    if (cleanValue && !/^https:\/\/script\.google\.com\//.test(cleanValue)) throw new Error('The sign-in link must start with https://script.google.com/');
  }
  if (key === 'imageBaseUrl' && cleanValue) {
    if (!/^https:\/\//.test(cleanValue)) throw new Error('The image link must start with https://');
    if (!/\/$/.test(cleanValue)) cleanValue += '/';
  }
  withLock_(function () {
    upsertRow_('Settings', 'key', { key: key, value: cleanValue });
  });
  return getAllData(sessionToken);
}

function addAdmin(sessionToken, emailText) {
  const adminEmail = requireOwner_(sessionToken);
  const email = normalizeEmail_(emailText);
  if (!isValidEmail_(email)) throw new Error('Please enter a valid email address.');
  withLock_(function () {
    const exists = readTable_('Admins').some(function (row) { return row.email === email; });
    if (!exists) appendRows_('Admins', [{ email: email, addedBy: adminEmail, addedOn: todayText_() }]);
  });
  return getAllData(sessionToken);
}

function removeAdmin(sessionToken, emailText) {
  requireOwner_(sessionToken);
  const email = normalizeEmail_(emailText);
  if (email === readSettings_().ownerEmail) throw new Error('The owner cannot be removed.');
  withLock_(function () {
    deleteRows_('Admins', function (row) { return row.email === email; });
  });
  return getAllData(sessionToken);
}

// An admin sets the time of one alliance time (Bear trap, Crazy Joe session, Mercenary bosses, legion), for every
// date of that schedule. Only the time changes; its dates and repeat stay as the owner set them.
function saveAllianceTime(sessionToken, scheduleId, timeText) {
  requireAdmin_(sessionToken);
  const time = String(timeText || '').trim();
  checkTime_(time, 'Time');
  if (!time) throw new Error('Please enter a time.');
  withLock_(function () {
    const schedule = readTable_('Schedules').filter(function (row) { return row.id === String(scheduleId); })[0];
    if (!schedule || !schedule.allianceIds) throw new Error('This alliance time no longer exists.');
    upsertRow_('Schedules', 'id', { id: schedule.id, startTimeUtc: time });
  });
  return getAllData(sessionToken);
}

/* ------------------------------------------------------------------ */
/* Checking what admins send                                           */
/* ------------------------------------------------------------------ */

function validateRecord_(tableName, record) {
  const columns = TABLES[tableName];
  const clean = {};
  columns.forEach(function (column) {
    clean[column] = record[column] === undefined || record[column] === null ? '' : String(record[column]).trim();
  });

  if (tableName === 'Alliances') {
    if (!clean.name) throw new Error('The alliance needs a name.');
    clean.name = clean.name.slice(0, 40);
    clean.tag = clean.tag.slice(0, 6);
    checkColor_(clean.baseColor, 'Base colour');
    checkColor_(clean.secondColor, 'Second colour');
    checkOptionalUrl_(clean.logoUrl, 'Logo link');
    checkWholeNumber_(clean.sortOrder, 'Order', true);
    if (clean.mainAllianceId) {
      const alliances = readTable_('Alliances');
      const mainAlliance = alliances.filter(function (row) { return row.id === clean.mainAllianceId; })[0];
      if (!mainAlliance) throw new Error('The main alliance does not exist.');
      if (clean.mainAllianceId === clean.id) throw new Error('An alliance cannot be its own academy.');
      if (mainAlliance.mainAllianceId) throw new Error('An academy cannot have its own academy.');
      const hasAcademies = clean.id && alliances.some(function (row) { return row.mainAllianceId === clean.id; });
      if (hasAcademies) throw new Error('This alliance has academies, so it cannot become an academy.');
    }
    clean.followsMain = '';
    checkWholeNumber_(clean.showdownStars, 'Showdown Star Rating', true);
    if (clean.winterSiegeTier && WINTER_SIEGE_TIERS.indexOf(clean.winterSiegeTier) === -1) throw new Error('Please pick a Winter Siege tier.');
  }

  if (tableName === 'EventTypes') {
    if (!clean.name) throw new Error('The event needs a name.');
    if (EVENT_CATEGORIES.indexOf(clean.category) === -1) throw new Error('Please pick a category.');
    if (!clean.color) throw new Error('Please pick a colour.');
    checkColor_(clean.color, 'Colour');
    checkColor_(clean.colorEnd, 'Second colour');
    // One colour, or two joined by ">" to fade from the first to the second.
    clean.timelineColor.split('>').forEach(function (part) { checkColor_(part.trim(), 'Timeline colour'); });
    clean.otherName = clean.otherName.slice(0, 40);
    clean.barSubtitle = clean.barSubtitle.slice(0, 40);
    if (clean.icon && !/^[a-z-]+$/.test(clean.icon)) throw new Error('Unknown icon.');
    checkOptionalUrl_(clean.iconUrl, 'Icon image link');
    checkWholeNumber_(clean.sortOrder, 'Order', true);
    clean.detailsOnly = clean.detailsOnly === 'yes' ? 'yes' : '';
    clean.notes = clean.notes.slice(0, 300);
    clean.typeLabel = clean.typeLabel.slice(0, 20);
    clean.pointsNote = clean.pointsNote.slice(0, 300);
    clean.pointsTitle = clean.pointsTitle.slice(0, 40);
    clean.allianceRequirement = clean.allianceRequirement.slice(0, 200);
    clean.playerRequirement = clean.playerRequirement.slice(0, 200);
    // File names are kept exactly as typed (the repo link is case-sensitive), only ".png" is taken off.
    clean.imageFile = clean.imageFile.replace(/\.png$/i, '');
    // A name with a folder ("items/match-stake") is a picture from that folder of the image repo.
    if (clean.imageFile && !/^([A-Za-z0-9_-]+\/)?[A-Za-z0-9_-]+$/.test(clean.imageFile)) throw new Error('Image file name: use letters, numbers, dashes and underscores only, with at most one folder in front (items/...).');
    clean.openWindows = checkOpenWindows_(clean.openWindows);
    clean.windowMark = clean.windowMark === 'label' ? 'label' : '';
    clean.groupName = clean.groupName.slice(0, 20);
    checkWholeNumber_(clean.groupCount, 'Number of groups', true);
    if (Number(clean.groupCount) > MAX_GROUPS) throw new Error('Number of groups: at most ' + MAX_GROUPS + '.');
    if (clean.groupCount === '0') clean.groupCount = '';
    if (clean.groupCount && !clean.groupName) throw new Error('Please name the groups, for example "Legion" or "Trap".');
    if (!clean.groupCount) clean.groupName = '';
    checkWholeNumber_(clean.opponentCount, 'Opponents', true);
    if (Number(clean.opponentCount) > MAX_OPPONENTS) throw new Error('Opponents: at most ' + MAX_OPPONENTS + '.');
    if (clean.opponentCount === '0') clean.opponentCount = '';
    clean.opponentHasAlliance = clean.opponentCount && clean.opponentHasAlliance === 'yes' ? 'yes' : '';
    // Older sheets may still say 'myrank' (players' own ranks): that is no result now.
    if (clean.resultType === 'myrank') clean.resultType = '';
    if (RESULT_TYPES.indexOf(clean.resultType) === -1) throw new Error('Unknown result type.');
    clean.hasPresident = clean.hasPresident === 'yes' ? 'yes' : '';
    // Slot times: "2:00, 06:00" becomes "02:00,06:00", in time order.
    clean.slotTimes = clean.slotTimes.split(',').map(function (time) {
      const trimmed = time.trim();
      return /^\d:\d\d$/.test(trimmed) ? '0' + trimmed : trimmed;
    }).filter(Boolean).map(function (time) {
      checkTime_(time, 'Slot times');
      return time;
    }).sort().join(',');
    if (clean.partOf) {
      const allTypes = readTable_('EventTypes');
      const mainType = allTypes.filter(function (row) { return row.id === clean.partOf; })[0];
      if (!mainType) throw new Error('The main event does not exist.');
      if (clean.id && clean.partOf === clean.id) throw new Error('An event cannot be part of itself.');
      if (mainType.partOf) throw new Error('That event is itself a part of another event. Pick its main event.');
      const hasParts = clean.id && allTypes.some(function (row) { return row.partOf === clean.id; });
      if (hasParts) throw new Error('This event has parts of its own, so it cannot become a part.');
    }
    if (!clean.id) {
      // A new event type gets an id made from its name, with a number added if that id is taken.
      const takenIds = readTable_('EventTypes').map(function (row) { return row.id; });
      const baseId = makeSlug_(clean.name);
      let newId = baseId;
      let counter = 2;
      while (takenIds.indexOf(newId) !== -1) {
        newId = baseId + '-' + counter;
        counter += 1;
      }
      clean.id = newId;
    }
  }

  if (tableName === 'Schedules') {
    const scheduleType = readTable_('EventTypes').filter(function (row) { return row.id === clean.eventTypeId; })[0];
    if (!scheduleType) throw new Error('Please pick an event.');
    checkWholeNumber_(clean.groupNumber, 'Group', true);
    const groupCount = Number(scheduleType.groupCount) || 0;
    if (!groupCount || clean.groupNumber === '0') clean.groupNumber = '';
    if (clean.groupNumber && Number(clean.groupNumber) > groupCount) {
      throw new Error(scheduleType.name + ' has ' + groupCount + ' ' + scheduleType.groupName.toLowerCase() + 's per alliance.');
    }
    checkDate_(clean.firstDate, 'First date', false);
    checkDate_(clean.untilDate, 'Until', true);
    checkDate_(clean.sinceDate, 'Introduced on', true);
    clean.shiftWithMoves = clean.shiftWithMoves === 'yes' ? 'yes' : '';
    checkWholeNumber_(clean.repeatEveryDays, 'Repeat every', true);
    checkWholeNumber_(clean.lengthDays, 'Length', false);
    if (Number(clean.lengthDays) < 1) throw new Error('Length must be at least 1 day.');
    checkTime_(clean.startTimeUtc, 'Start time');
    checkTime_(clean.endTimeUtc, 'End time');
    clean.allianceIds = checkAllianceList_(clean.allianceIds);
    clean.label = clean.label.slice(0, 40);
  }

  if (tableName === 'DateChanges') {
    const scheduleIds = readTable_('Schedules').map(function (row) { return row.id; });
    if (clean.scheduleId !== TRANSFER_SCHEDULE_ID && scheduleIds.indexOf(clean.scheduleId) === -1) {
      throw new Error('The schedule for this date no longer exists.');
    }
    checkDate_(clean.originalDate, 'Original date', false);
    checkDate_(clean.newDate, 'New date', true);
    checkTime_(clean.newStartTimeUtc, 'Start time');
    checkTime_(clean.newEndTimeUtc, 'End time');
    if (clean.stateAllianceId) checkAllianceList_(clean.stateAllianceId);
    // Opponents: only as many as the event has; alliance names only where the event asks for them.
    const changedSchedule = readTable_('Schedules').filter(function (row) { return row.id === clean.scheduleId; })[0];
    const changedType = changedSchedule ? readTable_('EventTypes').filter(function (row) { return row.id === changedSchedule.eventTypeId; })[0] : null;
    // Only Brothers in Arms (the Kill Event) can be cancelled for a date.
    clean.cancelled = clean.cancelled === 'yes' && changedType && changedType.id === CANCELLABLE_EVENT_ID ? 'yes' : '';
    const opponentCount = changedType ? Number(changedType.opponentCount) || 0 : 0;
    for (let number = 1; number <= MAX_OPPONENTS; number++) {
      const stateKey = 'opponentState' + number;
      const allianceKey = 'opponentAlliance' + number;
      if (number > opponentCount) {
        clean[stateKey] = '';
        clean[allianceKey] = '';
        continue;
      }
      checkWholeNumber_(clean[stateKey], 'Opponent state', true);
      if (clean[stateKey].length > 5) throw new Error('Opponent state: please enter the state number.');
      clean[allianceKey] = changedType.opponentHasAlliance === 'yes' ? clean[allianceKey].slice(0, 30) : '';
    }
    // Results: won / lost, or a rank, only for events that have them.
    const resultType = changedType ? changedType.resultType : '';
    if (['', 'win', 'loss'].indexOf(clean.result) === -1) throw new Error('Result: pick won or lost.');
    if (resultType !== 'winloss') clean.result = '';
    checkWholeNumber_(clean.rank, 'Rank', true);
    if (clean.rank.length > 4) throw new Error('Rank: please enter a number.');
    if (resultType !== 'rank') clean.rank = '';
    if (changedType && changedType.hasPresident === 'yes') {
      if (clean.presidentAllianceId) checkAllianceList_(clean.presidentAllianceId);
      clean.presidentName = clean.presidentName.slice(0, 40);
    } else {
      clean.presidentAllianceId = '';
      clean.presidentName = '';
    }
    // One change per schedule date: reuse the existing row if there is one.
    if (!clean.id) {
      const existing = readTable_('DateChanges').filter(function (row) {
        return row.scheduleId === clean.scheduleId && row.originalDate === clean.originalDate;
      })[0];
      if (existing) clean.id = existing.id;
    }
  }

  if (tableName === 'PointSources') {
    const eventTypeIds = readTable_('EventTypes').map(function (row) { return row.id; });
    if (eventTypeIds.indexOf(clean.eventTypeId) === -1) throw new Error('Please pick an event.');
    checkWholeNumber_(clean.dayNumber, 'Day', true);
    checkWholeNumber_(clean.sortOrder, 'Order', true);
    if (!clean.task) throw new Error('Please describe how the points are earned.');
    clean.task = clean.task.slice(0, 200);
    clean.dayName = clean.dayName.slice(0, 40);
    clean.points = clean.points.slice(0, 40);
    if (POINT_SOURCE_LISTS.indexOf(clean.list) === -1) clean.list = '';
    clean.imageFile = checkImagePath_(clean.imageFile, 'Picture');
  }

  if (tableName === 'EventSteps') {
    const eventTypeIds = readTable_('EventTypes').map(function (row) { return row.id; });
    if (eventTypeIds.indexOf(clean.eventTypeId) === -1) throw new Error('Please pick an event.');
    checkWholeNumber_(clean.dayNumber, 'Day of the event', false);
    // 0 = the day before the event (Alliance Showdown's matchmaking is on Sunday, the event starts on Monday).
    checkTime_(clean.startTimeUtc, 'Start time');
    checkTime_(clean.endTimeUtc, 'End time');
    if (clean.endTimeUtc && !clean.startTimeUtc) throw new Error('An end time needs a start time.');
    checkWholeNumber_(clean.sortOrder, 'Order', true);
    if (!clean.label) throw new Error('Please name the step.');
    clean.label = clean.label.slice(0, 80);
    clean.note = clean.note.slice(0, 200);
    // A white line on the bar needs a time.
    clean.barMark = clean.barMark === 'yes' ? 'yes' : '';
    if (clean.barMark && !clean.startTimeUtc) throw new Error('A line on the bar needs a start time.');
  }

  if (tableName === 'EventPhases') {
    const eventTypeIds = readTable_('EventTypes').map(function (row) { return row.id; });
    if (eventTypeIds.indexOf(clean.eventTypeId) === -1) throw new Error('Please pick an event.');
    checkWholeNumber_(clean.fromDay, 'From day', false);
    checkWholeNumber_(clean.toDay, 'To day', false);
    if (Number(clean.fromDay) < 1) throw new Error('Days start at 1 (the first day of the event).');
    if (Number(clean.toDay) < Number(clean.fromDay)) throw new Error('"To day" cannot be before "From day".');
    if (!clean.name) throw new Error('Please name the phase.');
    clean.name = clean.name.slice(0, 40);
    clean.hideBar = clean.hideBar === 'yes' ? 'yes' : '';
    checkWholeNumber_(clean.sortOrder, 'Order', true);
    checkTime_(clean.startTimeUtc, 'Start time');
    checkTime_(clean.endTimeUtc, 'End time');
    clean.note = clean.note.slice(0, 200);
  }

  if (tableName === 'FortRewards' || tableName === 'FortHolders') {
    if (FORT_NAMES.indexOf(clean.fort) === -1) throw new Error('Unknown fortress or stronghold.');
    checkWholeNumber_(clean.phase, 'Phase', false);
    if (Number(clean.phase) < 1 || Number(clean.phase) > FORT_PHASES) throw new Error('Phase: 1 to ' + FORT_PHASES + '.');
    // One row per fortress and phase (and season): reuse the existing row.
    const sameCell = readTable_(tableName).filter(function (row) {
      return row.fort === clean.fort && row.phase === clean.phase && (tableName === 'FortRewards' || row.seasonStart === clean.seasonStart);
    })[0];
    if (sameCell) clean.id = sameCell.id;
  }
  if (tableName === 'FortRewards') {
    clean.reward = clean.reward.slice(0, 60);
    clean.quantity = clean.quantity.slice(0, 12);
    if (TILE_COLORS.indexOf(clean.tile) === -1) throw new Error('Please pick a tile colour.');
  }
  if (tableName === 'FortHolders') {
    checkDate_(clean.seasonStart, 'Season start', false);
    if (clean.allianceId) checkAllianceList_(clean.allianceId);
    checkTime_(clean.battleTimeUtc, 'Battle time');
  }

  if (tableName === 'Items') {
    if (!clean.name) throw new Error('The item needs a name.');
    clean.name = clean.name.slice(0, 60);
    // A new item gets an id from its name; it must not take the id of another item.
    if (!clean.id) {
      clean.id = makeSlug_(clean.name);
      if (readTable_('Items').some(function (row) { return row.id === clean.id; })) throw new Error('An item with this name already exists.');
    }
    clean.imageFile = checkImagePath_(clean.imageFile, 'Picture');
    clean.label = clean.label.slice(0, 12);
  }

  if (tableName === 'Rewards') {
    const eventTypeIds = readTable_('EventTypes').map(function (row) { return row.id; });
    if (eventTypeIds.indexOf(clean.eventTypeId) === -1) throw new Error('Please pick an event.');
    if (REWARD_LISTS.indexOf(clean.list) === -1) throw new Error('Please pick a list.');
    const itemIds = readTable_('Items').map(function (row) { return row.id; });
    if (itemIds.indexOf(clean.itemId) === -1) throw new Error('Please pick an item.');
    if (TILE_COLORS.indexOf(clean.tile) === -1) throw new Error('Please pick a tile colour.');
    if (['', 'win', 'lose', 'streak', 'personal-win', 'personal-lose', 'champion', 'top4'].indexOf(clean.section) === -1) throw new Error('Unknown section.');
    clean.band = clean.band.slice(0, 20);
    clean.rowLabel = clean.rowLabel.slice(0, 80);
    clean.quantity = clean.quantity.slice(0, 12);
    clean.note = clean.note.slice(0, 40);
    clean.source = clean.source === 'guides' ? 'guides' : '';
    checkWholeNumber_(clean.sortOrder, 'Order', true);
  }

  if (tableName === 'MatchScores') {
    if (!readTable_('Schedules').some(function (row) { return row.id === clean.scheduleId; })) throw new Error('Unknown event date.');
    checkDate_(clean.originalDate, 'Date', false);
    if (!clean.allianceId || clean.allianceId.indexOf(',') !== -1) throw new Error('Please pick one alliance.');
    checkAllianceList_(clean.allianceId);
    checkWholeNumber_(clean.opponentState, 'Opponent state', true);
    clean.opponentAlliance = clean.opponentAlliance.slice(0, 30);
    const winners = clean.winners ? clean.winners.split(',').map(function (value) { return value.trim(); }) : [];
    if (winners.length > SHOWDOWN_WIN_DAYS || winners.some(function (value) { return ['', 'us', 'them', 'tie'].indexOf(value) === -1; })) {
      throw new Error('Each day\'s winner must be us, them, tie or empty.');
    }
    clean.winners = winners.join(',');
    const mvps = clean.mvps ? clean.mvps.split('|') : [];
    if (mvps.length > SHOWDOWN_WIN_DAYS) throw new Error('Too many MVP names.');
    clean.mvps = mvps.map(function (name) { return name.trim().slice(0, 30); }).join('|');
    // One row per alliance and run: reuse the existing row.
    const sameRow = readTable_('MatchScores').filter(function (row) {
      return row.scheduleId === clean.scheduleId && row.originalDate === clean.originalDate && row.allianceId === clean.allianceId;
    })[0];
    if (sameRow) clean.id = sameRow.id;
  }

  if (tableName === 'TransferGroups') {
    checkDate_(clean.transferDate, 'Transfer date', false);
    checkWholeNumber_(clean.fromState, 'From state', false);
    checkWholeNumber_(clean.toState, 'To state', false);
    if (Number(clean.fromState) > Number(clean.toState)) throw new Error('"From state" must be lower than "To state".');
    clean.generation = clean.generation.slice(0, 12);
    clean.furnaceCap = clean.furnaceCap.slice(0, 12);
  }

  return clean;
}

function checkDate_(text, fieldName, mayBeEmpty) {
  if (!text && mayBeEmpty) return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new Error(fieldName + ': please pick a date.');
  const parts = text.split('-').map(Number);
  const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  if (date.getUTCMonth() !== parts[1] - 1) throw new Error(fieldName + ': this date does not exist.');
}

function checkTime_(text, fieldName) {
  if (!text) return;
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(text)) throw new Error(fieldName + ': use HH:MM, for example 12:00.');
}

function checkWholeNumber_(text, fieldName, mayBeEmpty) {
  if (!text && mayBeEmpty) return;
  if (!/^\d+$/.test(text)) throw new Error(fieldName + ': please enter a whole number.');
}

function checkColor_(text, fieldName) {
  if (!text) return;
  if (!/^#[0-9A-Fa-f]{6}$/.test(text)) throw new Error(fieldName + ': use a colour like #6F9BE6.');
}

// A picture's path inside the image repo: folders and a file name, nothing that leaves the repo.
// Checks the openings of a part (see EventTypes.openWindows) and writes them the same way each time.
function checkOpenWindows_(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  const windows = text.split(';').map(function (one) { return one.trim(); }).filter(Boolean);
  return windows.map(function (one) {
    const match = one.match(/^(\d+)\s+(\d{1,2}:\d{2})\s*-\s*(\d+)\s+(\d{1,2}:\d{2})(?:\s+(.+))?$/);
    if (!match) throw new Error('Openings: write each one as "1 00:00-2 19:00 Round 1", separated by ";".');
    const times = [match[2], match[4]].map(function (time) {
      const parts = time.split(':').map(Number);
      if (parts[0] > 24 || parts[1] > 59 || (parts[0] === 24 && parts[1] !== 0)) throw new Error('Openings: ' + time + ' is not a time.');
      return (parts[0] < 10 ? '0' : '') + parts[0] + ':' + (parts[1] < 10 ? '0' : '') + parts[1];
    });
    const from = Number(match[1]) * 1440 + Number(times[0].slice(0, 2)) * 60 + Number(times[0].slice(3));
    const to = Number(match[3]) * 1440 + Number(times[1].slice(0, 2)) * 60 + Number(times[1].slice(3));
    if (Number(match[1]) < 1 || to <= from) throw new Error('Openings: "' + one + '" must start on day 1 or later and end after it starts.');
    return match[1] + ' ' + times[0] + '-' + match[3] + ' ' + times[1] + (match[5] ? ' ' + match[5].slice(0, 30) : '');
  }).join('; ');
}

function checkImagePath_(text, fieldName) {
  const path = String(text || '').trim().slice(0, 80);
  if (path && !/^[A-Za-z0-9_\-]+(\/[A-Za-z0-9_\-]+)*\.(png|jpg|jpeg|webp|gif)$/.test(path)) {
    throw new Error(fieldName + ': use a path like items/gems.png.');
  }
  return path;
}

function checkOptionalUrl_(text, fieldName) {
  if (text && !/^https:\/\//.test(text)) throw new Error(fieldName + ' must start with https://');
}

// Turns "a, b" into "a,b" and makes sure every alliance exists.
function checkAllianceList_(text) {
  if (!text) return '';
  const knownIds = readTable_('Alliances').map(function (row) { return row.id; });
  const ids = text.split(',').map(function (id) { return id.trim(); }).filter(Boolean);
  ids.forEach(function (id) {
    if (knownIds.indexOf(id) === -1) throw new Error('One of the chosen alliances no longer exists.');
  });
  return ids.join(',');
}

/* ------------------------------------------------------------------ */
/* Who is calling                                                      */
/* ------------------------------------------------------------------ */

function getSessionEmail_(sessionToken) {
  if (!sessionToken) return '';
  const now = new Date();
  const session = readTable_('Sessions').filter(function (row) {
    return row.token === sessionToken && new Date(row.expiresOn) > now;
  })[0];
  return session ? session.email : '';
}

function requireSignedIn_(sessionToken) {
  const email = getSessionEmail_(sessionToken);
  if (!email) throw new Error('Your sign-in has expired. Please sign in again.');
  return email;
}

// Only the owner (the email in Settings → ownerEmail) picks the admins.
function requireOwner_(sessionToken) {
  const email = requireSignedIn_(sessionToken);
  if (email !== readSettings_().ownerEmail) throw new Error('Only the owner can do this.');
  return email;
}

function requireAdmin_(sessionToken) {
  const email = requireSignedIn_(sessionToken);
  const isAdmin = readTable_('Admins').some(function (row) { return row.email === email; });
  if (!isAdmin) throw new Error('Only admins can do this.');
  return email;
}

/* ------------------------------------------------------------------ */
/* Sheet helpers                                                       */
/* ------------------------------------------------------------------ */

function getSpreadsheet_() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty('spreadsheetId');
  return spreadsheetId ? SpreadsheetApp.openById(spreadsheetId) : SpreadsheetApp.getActiveSpreadsheet();
}

// Tabs already checked in this run, so the header check happens once per tab.
const checkedSheets_ = {};

// Returns the tab, creating it (with its header row, all cells as plain text) if it is missing.
// If a newer version of the app added columns, the header row is brought up to date.
function getSheet_(tableName) {
  if (checkedSheets_[tableName]) return checkedSheets_[tableName];
  const spreadsheet = getSpreadsheet_();
  const columns = TABLES[tableName];
  let sheet = spreadsheet.getSheetByName(tableName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(tableName);
    sheet.setFrozenRows(1);
  }
  const headerRange = sheet.getRange(1, 1, 1, columns.length);
  const currentHeader = headerRange.getValues()[0].map(String);
  if (currentHeader.join('|') !== columns.join('|')) {
    // Plain text stops Sheets from turning dates and times into its own formats.
    sheet.getRange(1, 1, sheet.getMaxRows(), columns.length).setNumberFormat('@');
    headerRange.setValues([columns]).setFontWeight('bold');
  }
  checkedSheets_[tableName] = sheet;
  return sheet;
}

// Reads a tab as a list of objects, one per filled row, every value as text.
function readTable_(tableName) {
  const sheet = getSheet_(tableName);
  const columns = TABLES[tableName];
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const timeZone = getSpreadsheet_().getSpreadsheetTimeZone();
  const values = sheet.getRange(2, 1, lastRow - 1, columns.length).getValues();

  return values
    .filter(function (rowValues) {
      return rowValues.some(function (value) { return value !== '' && value !== null; });
    })
    .map(function (rowValues) {
      const row = {};
      columns.forEach(function (column, columnIndex) {
        row[column] = cellToText_(rowValues[columnIndex], timeZone);
      });
      return row;
    });
}

function cellToText_(value, timeZone) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) {
    const isMidnight = value.getHours() === 0 && value.getMinutes() === 0;
    return Utilities.formatDate(value, timeZone, isMidnight ? 'yyyy-MM-dd' : "yyyy-MM-dd'T'HH:mm:ss");
  }
  if (value === true) return 'yes';
  if (value === false) return '';
  return String(value).trim();
}

function recordToRow_(tableName, record) {
  return TABLES[tableName].map(function (column) {
    return record[column] === undefined || record[column] === null ? '' : String(record[column]);
  });
}

function appendRows_(tableName, records) {
  if (!records.length) return;
  const sheet = getSheet_(tableName);
  const rows = records.map(function (record) { return recordToRow_(tableName, record); });
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setNumberFormat('@').setValues(rows);
}

// Updates the row whose key column matches, keeping columns the record does not mention; adds it if missing.
function upsertRow_(tableName, keyColumn, record) {
  const sheet = getSheet_(tableName);
  const columns = TABLES[tableName];
  const keyIndex = columns.indexOf(keyColumn);
  const lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    const keys = sheet.getRange(2, keyIndex + 1, lastRow - 1, 1).getValues();
    for (let rowIndex = 0; rowIndex < keys.length; rowIndex++) {
      if (String(keys[rowIndex][0]).trim() === String(record[keyColumn])) {
        const rowRange = sheet.getRange(rowIndex + 2, 1, 1, columns.length);
        const timeZone = getSpreadsheet_().getSpreadsheetTimeZone();
        const currentValues = rowRange.getValues()[0];
        const merged = {};
        columns.forEach(function (column, columnIndex) {
          merged[column] = record.hasOwnProperty(column) ? record[column] : cellToText_(currentValues[columnIndex], timeZone);
        });
        rowRange.setNumberFormat('@').setValues([recordToRow_(tableName, merged)]);
        return;
      }
    }
  }
  appendRows_(tableName, [record]);
}

// Deletes every row the test function returns true for (bottom up, so row numbers stay right).
function deleteRows_(tableName, shouldDelete) {
  const sheet = getSheet_(tableName);
  const columns = TABLES[tableName];
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  const timeZone = getSpreadsheet_().getSpreadsheetTimeZone();
  const values = sheet.getRange(2, 1, lastRow - 1, columns.length).getValues();
  for (let rowIndex = values.length - 1; rowIndex >= 0; rowIndex--) {
    const row = {};
    columns.forEach(function (column, columnIndex) {
      row[column] = cellToText_(values[rowIndex][columnIndex], timeZone);
    });
    if (shouldDelete(row)) sheet.deleteRow(rowIndex + 2);
  }
}

// Writes the whole table again (used for the small Sessions list).
function replaceTable_(tableName, records) {
  const sheet = getSheet_(tableName);
  const columns = TABLES[tableName];
  const lastRow = sheet.getLastRow();
  if (lastRow >= 2) sheet.getRange(2, 1, lastRow - 1, columns.length).clearContent();
  if (records.length) {
    const rows = records.map(function (record) { return recordToRow_(tableName, record); });
    sheet.getRange(2, 1, rows.length, columns.length).setNumberFormat('@').setValues(rows);
  }
}

function readSettings_() {
  const settings = {};
  readTable_('Settings').forEach(function (row) { settings[row.key] = row.value; });
  return settings;
}

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

function withLock_(work) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    return work();
  } finally {
    lock.releaseLock();
  }
}

function normalizeEmail_(text) {
  return String(text || '').trim().toLowerCase();
}

function isValidEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function hashText_(text) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8);
  return bytes.map(function (byte) { return ((byte + 256) % 256).toString(16).padStart(2, '0'); }).join('');
}

function todayText_() {
  return new Date().toISOString().slice(0, 10);
}

function safeJsonParse_(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
}

// "Bear Hunt" -> "bear-hunt"
function makeSlug_(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || ('item-' + Date.now());
}

function makeId_() {
  return Utilities.getUuid().slice(0, 8);
}

// Adds the usual alliance times (ALLIANCE_DEFAULT_SCHEDULES) for one main alliance, at 00:00 UTC.
// Skips an event and group the alliance already has a schedule for. Returns how many were added.
function addAllianceDefaultSchedules_(allianceId) {
  const schedules = readTable_('Schedules');
  const eventTypeIds = readTable_('EventTypes').map(function (row) { return row.id; });
  const newRows = ALLIANCE_DEFAULT_SCHEDULES.filter(function (template) {
    if (eventTypeIds.indexOf(template.eventTypeId) === -1) return false;
    return !schedules.some(function (row) {
      return row.eventTypeId === template.eventTypeId && (row.groupNumber || '') === template.groupNumber &&
        row.allianceIds.split(',').indexOf(allianceId) !== -1;
    });
  }).map(function (template) {
    return {
      id: 'd-' + allianceId + '-' + template.key, eventTypeId: template.eventTypeId, allianceIds: allianceId, label: '',
      firstDate: template.firstDate, repeatEveryDays: template.repeatEveryDays, lengthDays: '1',
      startTimeUtc: '00:00', endTimeUtc: '', untilDate: '', note: '', groupNumber: template.groupNumber
    };
  });
  appendRows_('Schedules', newRows);
  return newRows.length;
}