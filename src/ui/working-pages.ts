// The pages that are not designed yet, built as working pages: the information we
// have, in glass sections and tables, with the forms that fill them. Each one is a
// starting point to design from.
import { escapeForPage } from './escape.ts';
import { EXALTED_FC, FC_LEVELS } from '../data/fc-levels.ts';
import { choiceRow, dataTable, formSection, rowButton, rowEditForm, rowForm, rowWord, text, workSection, type Column, type Field } from './data-table.ts';
import type { Row } from '../data/records.ts';
import type { Alliance } from '../data/alliances.ts';
import { allianceTag } from '../data/alliances.ts';
import { eventTypeName } from '../data/catalog.ts';
import { longDayText } from './day-names.ts';
import { dayFromText } from '../calendar/days.ts';
import type { GameRead, RosterEntry } from './player-profile.ts';

// What every working page needs to know.
export interface WorkContext {
  // A table's rows, or null while they are being read.
  rowsOf: (table: string) => Row[] | null;
  alliances: Alliance[];
  myAllianceId: string | null;
  // The signed-in person's account id, or null for a guest.
  userId: string | null;
  // The game account they are on (picked in the menu under their name), or null.
  activeAccount: Row | null;
  // The run the event section is about.
  run: { eventTypeId: string; date: string } | null;
  // The form or question open now (see view.editing in main.ts).
  editing: string | null;
  // The choices made above tables, such as how a list is sorted.
  choiceOf: (name: string) => string;
  isAdmin: boolean;
  // The site's owner, for what she locks to herself (she says "owner" for those).
  isOwner: boolean;
  managesState: boolean;
  managesBattles: boolean;
  leads: (allianceId: string) => boolean;
  // R4s, R5s and admins see the blacklist.
  mayReadBlacklist: boolean;
  // A game account's troops as the game shows them, with the skill levels kept per
  // in-game ID: one tier text ("FC10 Exalted") and skill level per troop type, or null
  // while they are being read. Troops and skill levels are kept in one place only.
  troopsOf: (inGameId: string) => Record<string, { tier: string; skill: number }> | null;
  // What the game says of an account (name, power, alliance), or null while it is read.
  gameOf: (inGameId: string) => GameRead | null;
  // One of our alliances' members from its roster, or null while the rosters are read.
  membersOf: (allianceId: string) => RosterEntry[] | null;
}

const LOADING = '<p class="work-empty">Loading…</p>';

function page(sections: string[]): string {
  return '<div class="work-page">' + sections.join('') + '</div>';
}

function allianceChoices(alliances: Alliance[], emptyLabel = ''): [string, string][] {
  const choices: [string, string][] = alliances
    .slice().sort((left, right) => left.sortOrder - right.sortOrder)
    .map(one => [one.id, one.tag]);
  return emptyLabel ? [['', emptyLabel], ...choices] : choices;
}

// An alliance as a part's title: its tag and name, so an academy whose tag differs only
// in capitals (DVL, dvl) is told apart in the capitals of the title.
function allianceTitle(context: WorkContext, allianceId: string): string {
  const alliance = context.alliances.find(one => one.id === allianceId);
  return alliance ? `${alliance.tag} · ${alliance.name}` : allianceTag(allianceId);
}

function dayText(date: unknown): string {
  return date ? escapeForPage(longDayText(dayFromText(String(date)))) : '—';
}

// The in-game name of a person, for the tables that hold their login: their main
// account's name as the game has it.
function nameOfPerson(context: WorkContext, gameAccounts: Row[], accountId: unknown): string {
  const main = gameAccounts.find(one => one.owner_id === accountId && one.kind === 'main');
  return main ? context.gameOf(String(main.in_game_id ?? ''))?.name || String(main.in_game_id ?? '') : 'Not set';
}

// The run's day. The event's name and logo are in the band above, so the title does
// not repeat them.
function runTitle(run: { eventTypeId: string; date: string }): string {
  return longDayText(dayFromText(run.date));
}

// ---------------------------------------------------------------------------
// Event · Availability
// ---------------------------------------------------------------------------

// Troop tiers, worth one point from FC5 (1) to FC10 (6). Helios, from FC5 up, adds 1;
// Exalted, only on FC10, adds 1 more. Each skill level adds 1, so a troop type tops
// out at 11.
export const TIER_POINTS: Record<string, number> = (() => {
  const points: Record<string, number> = {};
  for (const level of FC_LEVELS) {
    points['FC' + level] = level - 4;
    points[`FC${level} Helios`] = level - 3;
  }
  points[`FC${EXALTED_FC} Exalted`] = EXALTED_FC - 2;
  return points;
})();

export function troopScore(tier: unknown, skill: unknown): number | null {
  const points = TIER_POINTS[String(tier ?? '')];
  return points === undefined ? null : points + (Number(skill) || 0);
}

function hoursOf(times: Row[]): string {
  if (!times.length) return '—';
  return times.map(one =>
    `${String(one.from_hour_utc).padStart(2, '0')}–${String(one.to_hour_utc).padStart(2, '0')}`).join(', ');
}

function hoursLength(times: Row[]): number {
  return times.reduce((total, one) =>
    total + ((Number(one.to_hour_utc) - Number(one.from_hour_utc) + 24) % 24), 0);
}

export function availabilityPage(context: WorkContext): string {
  if (!context.run) return page([workSection('Availability', '<p class="work-empty">No event is coming up.</p>')]);
  const run = context.run;
  const all = context.rowsOf('availability');
  const allTimes = context.rowsOf('availability_times');
  const gameAccounts = context.rowsOf('game_accounts');
  if (!all || !allTimes || !gameAccounts) return page([workSection('Availability', LOADING)]);
  // Each answer is for one game account: a main or an alt.
  const accountOf = (row: Row) => gameAccounts.find(one => one.id === row.game_account_id);

  const entries = all.filter(one => one.event_type_id === run.eventTypeId && one.event_date === run.date);
  const timesOf = (entry: Row) => allTimes.filter(one => one.availability_id === entry.id);
  // Troops come from the game and skill levels from the player's page, read now; the
  // answer keeps only the hours and choices.
  const troopsOfEntry = (row: Row) => context.troopsOf(String(accountOf(row)?.in_game_id ?? ''));
  const scoreOf = (row: Row): number | null => {
    const troops = troopsOfEntry(row);
    if (!troops) return null;
    const scores = Object.values(troops).map(one => troopScore(one.tier, one.skill)).filter((score): score is number => score !== null);
    return scores.length ? scores.reduce((total, score) => total + score, 0) : null;
  };
  const sort = context.choiceOf('availability-sort') || 'score';
  entries.sort((left, right) =>
    sort === 'answered' ? String(left.created_at ?? '').localeCompare(String(right.created_at ?? '')) :
    sort === 'stay' ? hoursLength(timesOf(right)) - hoursLength(timesOf(left)) :
    (scoreOf(right) ?? 0) - (scoreOf(left) ?? 0));

  const troop = (kind: string) => (row: Row) => {
    const one = troopsOfEntry(row)?.[kind];
    return one ? `${text(one.tier)}${one.tier.endsWith('Exalted') ? `<small>Skill ${one.skill}</small>` : ''}` : '—';
  };
  const columns: Column[] = [
    { label: 'Player', cell: row => escapeForPage(context.gameOf(String(accountOf(row)?.in_game_id ?? ''))?.name ??
      nameOfPerson(context, gameAccounts, row.account_id)) +
      `<small>${text(row.alliance_id ? allianceTag(String(row.alliance_id)) : '')}</small>` },
    { label: 'Plays for', cell: row => text(row.playing_for_alliance_id ? allianceTag(String(row.playing_for_alliance_id)) : '') },
    { label: 'Hours (UTC)', cell: row => row.is_unavailable ? '<span class="muted">Cannot play</span>' : escapeForPage(hoursOf(timesOf(row))) },
    { label: 'Infantry', cell: troop('infantry') },
    { label: 'Lancer', cell: troop('lancer') },
    { label: 'Marksmen', cell: troop('marksmen') },
    { label: 'Score', cell: row => text(scoreOf(row)), isNumber: true },
    { label: 'Monthly card', cell: row => row.has_monthly_card ? 'Yes' : '—' },
    { label: 'Answered', cell: row => dayText(String(row.created_at ?? '').slice(0, 10)) }
  ];

  const active = context.activeAccount;
  const answer = active ? entries.find(one => one.game_account_id === active.id) : undefined;
  const mine = answer;
  const myTimes = answer ? timesOf(answer) : [];
  const form = !context.userId ? '<p class="work-line">Sign in to send when you can play.</p>'
    : !active ? '<p class="work-line">Fill in your details on your page to answer.</p>'
    : rowForm({
        form: 'availability', key: answer ? String(answer.id) : '',
        title: answer ? 'Your answer' : 'When you can play',
        submitLabel: answer ? 'Save' : 'Send',
        fields: [
          { name: 'playing_for_alliance_id', label: 'Playing for', kind: 'select',
            value: mine?.playing_for_alliance_id ?? context.myAllianceId ?? '', choices: allianceChoices(context.alliances, 'Not set') },
          { name: 'from_hour_utc', label: 'From (hour, UTC)', kind: 'number', value: myTimes[0]?.from_hour_utc ?? '', placeholder: '0–23' },
          { name: 'to_hour_utc', label: 'To (hour, UTC)', kind: 'number', value: myTimes[0]?.to_hour_utc ?? '', placeholder: '0–23' },
          { name: 'has_monthly_card', label: 'I have the monthly card', kind: 'checkbox', value: mine?.has_monthly_card },
          { name: 'is_unavailable', label: 'I cannot play this one', kind: 'checkbox', value: mine?.is_unavailable }
        ]
      });

  return page([
    workSection(runTitle(run), form),
    workSection('Answers',
      dataTable(columns, entries, 'Nobody has answered yet.'),
      choiceRow('availability-sort', [['score', 'Troop score'], ['answered', 'When answered'], ['stay', 'How long they stay']], sort))
  ]);
}

// ---------------------------------------------------------------------------
// Event · Roster
// ---------------------------------------------------------------------------

const MEMBER_ROLES: [string, string][] = [['joiner', 'Joiner'], ['filler', 'Filler'], ['sub', 'Substitute']];

export function rosterPage(context: WorkContext): string {
  if (!context.run) return page([workSection('Roster', '<p class="work-empty">No event is coming up.</p>')]);
  const run = context.run;
  const rosters = context.rowsOf('rosters');
  const members = context.rowsOf('roster_members');
  if (!rosters || !members) return page([workSection('Roster', LOADING)]);
  const canEdit = context.isAdmin || context.managesBattles;

  const ofRun = rosters.filter(one => one.event_type_id === run.eventTypeId && one.event_date === run.date);
  const sections = ofRun.map(roster => {
    const people = members.filter(one => one.roster_id === roster.id)
      .sort((left, right) => MEMBER_ROLES.findIndex(([role]) => role === left.member_role) -
        MEMBER_ROLES.findIndex(([role]) => role === right.member_role) ||
        (Number(left.sort_order) || 0) - (Number(right.sort_order) || 0));
    const columns: Column[] = [
      { label: 'Name', cell: row => text(row.in_game_name) + `<small>${text(row.in_game_id)}</small>` },
      { label: 'Goes as', cell: row => text(MEMBER_ROLES.find(([role]) => role === row.member_role)?.[1]) },
      { label: 'Note', cell: row => text(row.note), isLong: true }
    ];
    if (canEdit) {
      columns.push({ label: '', cell: row => '<div class="cell-actions">' +
        rowButton('remove|roster_members|' + row.id, 'Remove', context.editing === 'remove|roster_members|' + row.id) + '</div>' });
    }
    const status = roster.status === 'final' ? 'Final' : 'In progress';
    const statusButton = canEdit
      ? rowWord(`data-roster-status="${escapeForPage(String(roster.id))}"`,
        roster.status === 'final' ? 'Mark in progress' : 'Mark final', 'status') : '';
    return workSection(`${allianceTag(String(roster.alliance_id))} · ${status}`,
      dataTable(columns, people, 'Nobody on this roster yet.') +
      (canEdit ? rowForm({
        form: 'roster-member', key: String(roster.id), title: 'Add someone',
        submitLabel: 'Add',
        fields: [
          { name: 'in_game_name', label: 'In-game name', kind: 'text', isRequired: true },
          { name: 'in_game_id', label: 'In-game id', kind: 'text', isRequired: true },
          { name: 'member_role', label: 'Goes as', kind: 'select', value: 'joiner', choices: MEMBER_ROLES },
          { name: 'note', label: 'Note', kind: 'text' }
        ]
      }) : ''),
      statusButton);
  });

  const usedAlliances = new Set(ofRun.map(one => String(one.alliance_id)));
  const addRoster = canEdit
    ? formSection({
        form: 'roster', title: 'Start a roster', submitLabel: 'Start',
        fields: [{ name: 'alliance_id', label: 'For the state alliance', kind: 'select', isRequired: true,
          choices: allianceChoices(context.alliances.filter(one => !usedAlliances.has(one.id)), 'Pick an alliance') }]
      })
    : '';

  return page([
    sections.length ? '' : workSection(runTitle(run), '<p class="work-empty">No roster yet.</p>'),
    ...sections, addRoster
  ]);
}

// ---------------------------------------------------------------------------
// Event · Plan
// ---------------------------------------------------------------------------

export function planPage(context: WorkContext): string {
  if (!context.run) return page([workSection('Plan', '<p class="work-empty">No event is coming up.</p>')]);
  const run = context.run;
  const plans = context.rowsOf('plans');
  if (!plans) return page([workSection('Plan', LOADING)]);
  const canEdit = context.isAdmin || context.managesBattles;
  // A draft is seen only by those who plan; everyone sees a published plan.
  const ofRun = plans.filter(one => one.event_type_id === run.eventTypeId && one.event_date === run.date &&
    (canEdit || one.status === 'published'));

  const sections = ofRun.map(plan => {
    const key = 'plan|' + plan.id;
    if (context.editing === key) return planForm(plan, true);
    return workSection(String(plan.title || 'Plan'),
      `<div class="plan-text">${escapeForPage(String(plan.content ?? '')).replace(/\n/g, '<br>')}</div>`,
      (plan.status === 'published' ? '' : '<span class="work-line">Draft</span>') +
      (canEdit ? rowButton(key, 'Change') : ''));
  });

  return page([
    workSection(runTitle(run), ofRun.length ? '' : '<p class="work-empty">No plan yet.</p>'),
    ...sections,
    canEdit && context.editing !== 'plan|new' ? planForm(null, false) : ''
  ]);
}

function planForm(plan: Row | null, canCancel: boolean): string {
  return formSection({
    form: 'plan', key: plan ? String(plan.id) : '', title: plan ? String(plan.title || 'Plan') : 'New plan',
    canCancel,
    fields: [
      { name: 'title', label: 'Title', kind: 'text', value: plan?.title ?? '', isRequired: true },
      { name: 'status', label: 'Who sees it', kind: 'select', value: plan?.status ?? 'draft',
        choices: [['draft', 'Planners only (draft)'], ['published', 'Everyone (published)']] },
      { name: 'content', label: 'Plan', kind: 'textarea', value: plan?.content ?? '', isRequired: true }
    ]
  });
}

// ---------------------------------------------------------------------------
// My alliance · Members and Academies
// ---------------------------------------------------------------------------

const ROLE_NAMES: Record<string, string> = {
  owner: 'Owner', admin: 'Admin', alliance_manager: 'Alliance manager',
  state_manager: 'State manager', battle_manager: 'Battle manager', member: 'Member'
};

function powerText(value: unknown): string {
  const number = Number(value);
  if (!value || Number.isNaN(number)) return '—';
  return number >= 1e6 ? (number / 1e6).toFixed(1) + 'M' : number.toLocaleString('en-US');
}

export function membersPage(context: WorkContext, familyIds: string[]): string {
  if (!context.myAllianceId) {
    return page([workSection('Members', '<p class="work-empty">The character you are on is not in one of our alliances.</p>')]);
  }
  // The members are the alliance's roster as the game last showed it. A member who has
  // linked the account on the site shows whether it is a main, an alt or a farm (with
  // whose it is), its foundry power and the person's roles.
  const gameAccounts = context.rowsOf('game_accounts');
  const roles = context.rowsOf('account_roles');
  if (!gameAccounts || !roles) return page([workSection('Members', LOADING)]);
  const linkOf = (entry: RosterEntry) => gameAccounts.find(one => String(one.in_game_id ?? '') === String(entry.member.chief_id));
  const mainNameOf = (ownerId: unknown) => {
    const main = gameAccounts.find(one => one.owner_id === ownerId && one.kind === 'main');
    return main ? context.gameOf(String(main.in_game_id ?? ''))?.name ?? '' : '';
  };

  const sections = familyIds.map(allianceId => {
    const members = context.membersOf(allianceId);
    if (!members) return workSection(allianceTitle(context, allianceId), LOADING);
    const people = members.slice().sort((left, right) => (Number(right.member.power) || 0) - (Number(left.member.power) || 0));
    const columns: Column<RosterEntry>[] = [
      { label: 'Name', cell: entry => text(entry.member.nick_name) + `<small>${text(entry.member.chief_id)}</small>` },
      { label: 'Character', cell: entry => {
        const link = linkOf(entry);
        if (!link) return '—';
        return link.kind === 'main' ? 'Main' : `${link.kind === 'farm' ? 'Farm' : 'Alt'}<small>${text(mainNameOf(link.owner_id))}</small>`;
      } },
      { label: 'Power', cell: entry => escapeForPage(powerText(entry.member.power)) +
        `<small>${dayText(entry.readAt.slice(0, 10))}</small>`, isNumber: true },
      { label: 'Foundry power', cell: entry => {
        const link = linkOf(entry);
        return !link || link.kind === 'farm' ? '—' : escapeForPage(powerText(link.foundry_power)) +
          `<small>${dayText(String(link.foundry_power_updated_at ?? '').slice(0, 10))}</small>`;
      }, isNumber: true },
      { label: 'Roles', cell: entry => {
        const link = linkOf(entry);
        if (!link || link.kind !== 'main') return '—';
        const own = roles.filter(one => one.account_id === link.owner_id);
        return own.length ? own.map(one => escapeForPage(ROLE_NAMES[String(one.role)] ?? String(one.role))).join(', ') : '—';
      } }
    ];
    return workSection(allianceTitle(context, allianceId), dataTable(columns, people, "This alliance's roster has not been read yet."));
  });
  return page(sections);
}

export function academiesPage(context: WorkContext): string {
  const mainId = context.myAllianceId
    ? context.alliances.find(one => one.id === context.myAllianceId)?.mainAllianceId ?? context.myAllianceId
    : null;
  if (!mainId) return page([workSection('Academies', '<p class="work-empty">Pick your alliance on your page to see its academies.</p>')]);
  const academies = context.alliances.filter(one => one.mainAllianceId === mainId);
  const canEdit = context.leads(mainId);
  const columns: Column[] = [
    { label: 'Tag', cell: row => text(row.tag) },
    { label: 'Name', cell: row => text(row.name) }
  ];
  if (canEdit) {
    columns.push({ label: '', cell: row => '<div class="cell-actions">' +
      rowButton('unlink|' + row.id, 'Unlink', context.editing === 'unlink|' + row.id) + '</div>' });
  }
  const free = context.alliances.filter(one => !one.mainAllianceId && one.id !== mainId &&
    !context.alliances.some(other => other.mainAllianceId === one.id));
  return page([
    workSection(`Academies of ${allianceTag(mainId)}`,
      dataTable(columns, academies as unknown as Row[], 'No academy is linked.') +
      (canEdit && free.length ? rowForm({
        form: 'academy', key: mainId, title: 'Link an academy', submitLabel: 'Link',
        fields: [{ name: 'alliance_id', label: 'Alliance', kind: 'select', isRequired: true,
          choices: allianceChoices(free, 'Pick an alliance') }]
      }) : ''))
  ]);
}

// ---------------------------------------------------------------------------
// Map · Territory and Facilities
// ---------------------------------------------------------------------------

const MAP_SIZE = 1200;

function facilityName(row: Row): string {
  const type = String(row.facility_type ?? '').replace(/[-_]/g, ' ');
  return type.charAt(0).toUpperCase() + type.slice(1) + (row.facility_level ? ' ' + row.facility_level : '');
}

function buffOf(buffs: Row[], row: Row): string {
  const buff = buffs.find(one => one.facility_type === row.facility_type && one.facility_level === row.facility_level);
  return buff ? `${buff.buff_percent}%` : '—';
}

export function territoryPage(context: WorkContext): string {
  const facilities = context.rowsOf('facilities');
  const objects = context.rowsOf('map_objects');
  if (!facilities || !objects) return page([workSection('Territory', LOADING)]);
  const colorOf = (allianceId: unknown) =>
    context.alliances.find(one => one.id === allianceId)?.baseColor || 'var(--text-faint)';
  // The state's 1200 by 1200 tiles, with y counted upwards as in the game.
  const dot = (x: unknown, y: unknown, size: number, fill: string, label: string) =>
    `<rect x="${Number(x) - size / 2}" y="${MAP_SIZE - Number(y) - size / 2}" width="${size}" height="${size}" rx="${size / 4}"` +
    ` fill="${escapeForPage(fill)}"><title>${escapeForPage(label)}</title></rect>`;
  const marks = facilities.map(one => dot(one.position_x, one.position_y, 18, colorOf(one.alliance_id),
      `${facilityName(one)} · ${one.position_x}, ${one.position_y}${one.alliance_id ? ' · ' + allianceTag(String(one.alliance_id)) : ''}`))
    .concat(objects.map(one => dot(Number(one.position_x) + (Number(one.width) || 1) / 2,
      Number(one.position_y) + (Number(one.height) || 1) / 2, Math.max(8, Number(one.width) || 1),
      colorOf(one.alliance_id), `${one.label || one.kind} · ${one.position_x}, ${one.position_y}`)));
  const legend = context.alliances.filter(one => one.baseColor && facilities.some(row => row.alliance_id === one.id))
    .map(one => `<span class="map-key"><i style="background:${escapeForPage(String(one.baseColor))}"></i>${escapeForPage(one.tag)}</span>`).join('');
  return page([
    workSection('State 1458 · 1200 × 1200',
      `<svg class="map-plot" viewBox="0 0 ${MAP_SIZE} ${MAP_SIZE}" role="img" aria-label="Facilities on the state map">` +
      `<path d="M600 0V1200M0 600H1200" stroke="rgba(255,255,255,0.08)" stroke-width="2"/>${marks.join('')}</svg>` +
      (legend ? `<div class="map-keys">${legend}</div>` : ''))
  ]);
}

export function facilitiesPage(context: WorkContext): string {
  const facilities = context.rowsOf('facilities');
  const buffs = context.rowsOf('facility_buffs');
  if (!facilities || !buffs) return page([workSection('Facilities', LOADING)]);
  const canEdit = context.managesState;
  const sorted = facilities.slice().sort((left, right) =>
    String(left.facility_type).localeCompare(String(right.facility_type)) ||
    (Number(right.facility_level) || 0) - (Number(left.facility_level) || 0) ||
    (Number(left.position_x) || 0) - (Number(right.position_x) || 0));
  const columns: Column[] = [
    { label: 'Facility', cell: row => escapeForPage(facilityName(row)) },
    { label: 'Position', cell: row => text(`${row.position_x}, ${row.position_y}`) },
    { label: 'Buff', cell: row => escapeForPage(buffOf(buffs, row)), isNumber: true },
    { label: 'Held by', cell: row => text(row.alliance_id ? allianceTag(String(row.alliance_id)) : '') }
  ];
  if (canEdit) {
    columns.push({ label: '', cell: row => context.editing === 'facility|' + row.id ? ''
      : '<div class="cell-actions">' + rowButton('facility|' + row.id, 'Change') + '</div>' });
  }
  const editRow = (row: Row) => context.editing === 'facility|' + row.id
    ? rowEditForm({ form: 'facility', key: String(row.id), title: facilityName(row),
        fields: [{ name: 'alliance_id', label: 'Held by', kind: 'select', value: row.alliance_id ?? '',
          choices: allianceChoices(context.alliances, 'Nobody') }] })
    : '';
  return page([
    workSection('Facilities',
      dataTable(columns, sorted, 'No facility is recorded.', editRow))
  ]);
}

// ---------------------------------------------------------------------------
// Admin · Settings, Roles and Alliance requests
// ---------------------------------------------------------------------------

export function settingsPage(context: WorkContext): string {
  const settings = context.rowsOf('settings');
  if (!settings) return page([workSection('Settings', LOADING)]);
  const sorted = settings.slice().sort((left, right) =>
    String(left.setting_kind).localeCompare(String(right.setting_kind)) ||
    String(left.setting_key).localeCompare(String(right.setting_key)));
  const columns: Column[] = [
    { label: 'Setting', cell: row => text(row.setting_key) +
      (row.event_type_id ? `<small>${escapeForPage(eventTypeName(String(row.event_type_id)))}</small>` : '') },
    { label: 'Kind', cell: row => row.setting_kind === 'game_rule' ? 'Game rule' : 'State choice' },
    { label: 'Value', cell: row => text(row.setting_value) },
    { label: '', cell: row => context.editing === 'setting|' + row.id ? ''
      : '<div class="cell-actions">' + rowButton('setting|' + row.id, 'Change') + '</div>' }
  ];
  const editRow = (row: Row) => context.editing === 'setting|' + row.id
    ? rowEditForm({ form: 'setting', key: String(row.id), title: String(row.setting_key),
        fields: [{ name: 'setting_value', label: 'Value', kind: 'text', value: row.setting_value, isRequired: true }] })
    : '';
  return page([workSection('Settings', dataTable(columns, sorted, 'No setting is stored.', editRow))]);
}

export function rolesPage(context: WorkContext): string {
  const roles = context.rowsOf('account_roles');
  const gameAccounts = context.rowsOf('game_accounts');
  if (!roles || !gameAccounts) return page([workSection('Roles', LOADING)]);
  const columns: Column[] = [
    { label: 'Person', cell: row => escapeForPage(nameOfPerson(context, gameAccounts, row.account_id)) },
    { label: 'Role', cell: row => text(ROLE_NAMES[String(row.role)] ?? row.role) },
    { label: 'Alliance', cell: row => text(row.alliance_id ? allianceTag(String(row.alliance_id)) : '') },
    { label: 'Since', cell: row => dayText(String(row.granted_at ?? '').slice(0, 10)) },
    { label: '', cell: row => '<div class="cell-actions">' +
      rowButton('remove|account_roles|' + row.id, 'Remove', context.editing === 'remove|account_roles|' + row.id) + '</div>' }
  ];
  // Each person by their main account, as the game names it.
  const people: [string, string][] = [['', 'Pick a person'], ...gameAccounts
    .filter(one => one.kind === 'main' && one.in_game_id)
    .map(one => [String(one.owner_id), `${nameOfPerson(context, gameAccounts, one.owner_id)} · ${one.in_game_id}`] as [string, string])
    .sort((left, right) => left[1].localeCompare(right[1]))];
  const fields: Field[] = [
    { name: 'account_id', label: 'Person', kind: 'select', choices: people, isRequired: true },
    { name: 'role', label: 'Role', kind: 'select', isRequired: true, choices: [['', 'Pick a role'],
      ...Object.entries(ROLE_NAMES).filter(([role]) => role !== 'member' && role !== 'owner') as [string, string][]] },
    { name: 'alliance_id', label: 'For alliance (alliance managers)', kind: 'select',
      choices: allianceChoices(context.alliances, 'The whole state') }
  ];
  return page([
    workSection('Roles',
      dataTable(columns, roles, 'Nobody has a role yet.') +
      rowForm({ form: 'role', title: 'Give a role', submitLabel: 'Give', fields }))
  ]);
}

export function requestsPage(context: WorkContext): string {
  const all = context.rowsOf('alliances');
  if (!all) return page([workSection('Alliance requests', LOADING)]);
  const waiting = all.filter(one => one.status !== 'approved');
  const columns: Column[] = [
    { label: 'Tag', cell: row => text(row.tag) },
    { label: 'Name', cell: row => text(row.name) },
    { label: 'Status', cell: row => text(row.status) },
    { label: '', cell: row => '<div class="cell-actions">' +
      rowWord(`data-approve-alliance="${escapeForPage(String(row.id))}"`, 'Approve', 'approve') + '</div>' }
  ];
  return page([workSection('Alliances asking to join the site', dataTable(columns, waiting, 'No alliance is waiting.'))]);
}

// ---------------------------------------------------------------------------
// Transfers · Invites: setting up the window, adding people, flags, the blacklist.
// ---------------------------------------------------------------------------

const STAGES: [string, string][] = [['', 'Not set'], ['invitation', 'Invitation'], ['open', 'Open'], ['special', 'Special']];
const INVITE_STATUSES: [string, string][] = [['', 'Not set'], ['not_sent', 'Not sent'], ['sent', 'Sent'], ['pending', 'Pending'], ['declined', 'Declined']];
const OUTCOMES: [string, string][] = [['', 'Not yet'], ['transferred', 'Transferred'], ['rejected', 'Rejected'], ['no_answer', 'No answer']];

export function transferWorkSections(context: WorkContext, date: string): string {
  const windows = context.rowsOf('transfer_windows');
  const candidates = context.rowsOf('transfer_candidates');
  const flags = context.rowsOf('candidate_flags');
  const blacklist = context.mayReadBlacklist ? context.rowsOf('blacklist') : [];
  if (!windows || !candidates || !flags || !blacklist) return workSection('Invites', LOADING);
  const window = windows.find(one => one.transfer_date === date);
  const canAdd = context.isAdmin || context.alliances.some(one => context.leads(one.id));
  const sections: string[] = [];

  if (context.isAdmin) {
    sections.push(formSection({
      form: 'transfer-window', key: window ? String(window.id) : date, title: window ? 'The window' : 'Set up this window',
      fields: [
        { name: 'state_type', label: 'We are', kind: 'select', value: window?.state_type ?? 'ordinary',
          choices: [['ordinary', 'An ordinary state (35 + 20)'], ['leading', 'A leading state (20 + 10)']] },
        { name: 'power_cap', label: 'Power cap', kind: 'number', value: window?.power_cap ?? '' },
        { name: 'special_invites_available', label: 'Special invites', kind: 'number', value: window?.special_invites_available ?? 0 },
        { name: 'status', label: 'Status', kind: 'select', value: window?.status ?? 'planning',
          choices: [['planning', 'Planning'], ['running', 'Running'], ['closed', 'Closed']] },
        { name: 'note', label: 'Note', kind: 'text', value: window?.note ?? '', isWide: true }
      ]
    }));
  }

  if (window) {
    const people = candidates.filter(one => one.window_id === window.id)
      .sort((left, right) => (Number(right.priority) || 0) - (Number(left.priority) || 0) ||
        (Number(right.player_power) || 0) - (Number(left.player_power) || 0));
    const columns: Column[] = [
      { label: 'Name', cell: row => text(row.in_game_name) + `<small>${text(row.in_game_id)} · #${text(row.current_state)}</small>` },
      { label: 'Power', cell: row => escapeForPage(powerText(row.player_power)), isNumber: true },
      { label: 'FC', cell: row => text(row.fc_level) },
      { label: 'Joins', cell: row => text(row.destination_alliance_id ? allianceTag(String(row.destination_alliance_id)) : '') },
      { label: 'Stage', cell: row => text(STAGES.find(([value]) => value === row.stage)?.[1]) },
      { label: 'Invite', cell: row => text(INVITE_STATUSES.find(([value]) => value === row.invite_status)?.[1]) },
      { label: 'Outcome', cell: row => text(OUTCOMES.find(([value]) => value === row.outcome)?.[1]) },
      { label: 'Flags', cell: row => {
        const own = flags.filter(one => one.candidate_id === row.id);
        return own.length ? own.map(one => escapeForPage(String(one.reason ?? ''))).join('<br>') : '—';
      }, isLong: true },
      { label: 'Note', cell: row => text(row.note), isLong: true },
      { label: '', cell: row => context.editing === 'candidate|' + row.id || context.editing === 'flag|' + row.id ? ''
        : '<div class="cell-actions">' +
          (canAdd ? rowButton('candidate|' + row.id, 'Change') : '') +
          (context.userId ? rowButton('flag|' + row.id, 'Flag') : '') + '</div>' }
    ];
    const editRow = (row: Row) => context.editing === 'candidate|' + row.id
      ? rowEditForm({ form: 'candidate-status', key: String(row.id), title: String(row.in_game_name),
          fields: [
            { name: 'stage', label: 'Stage', kind: 'select', value: row.stage ?? '', choices: STAGES },
            { name: 'invite_status', label: 'Invite', kind: 'select', value: row.invite_status ?? '', choices: INVITE_STATUSES },
            { name: 'outcome', label: 'Outcome', kind: 'select', value: row.outcome ?? '', choices: OUTCOMES },
            { name: 'note', label: 'Note', kind: 'text', value: row.note ?? '', isWide: true }
          ] })
      : context.editing === 'flag|' + row.id
        ? rowEditForm({ form: 'candidate-flag', key: String(row.id), title: 'Flag ' + String(row.in_game_name),
            submitLabel: 'Flag', fields: [{ name: 'reason', label: 'Why', kind: 'text', isRequired: true, isWide: true }] })
        : '';
    sections.push(workSection('People we are inviting',
      dataTable(columns, people, 'Nobody is on the list yet.', editRow) +
      (canAdd ? rowForm({
        form: 'candidate', key: String(window.id), title: 'Add someone', submitLabel: 'Add',
        fields: [
          { name: 'in_game_name', label: 'In-game name', kind: 'text', isRequired: true },
          { name: 'in_game_id', label: 'In-game id', kind: 'text', isRequired: true },
          { name: 'player_power', label: 'Power', kind: 'number' },
          { name: 'fc_level', label: 'FC level', kind: 'text', placeholder: 'FC8' },
          { name: 'current_state', label: 'Current state', kind: 'number' },
          { name: 'destination_alliance_id', label: 'Joins', kind: 'select', choices: allianceChoices(context.alliances, 'Not decided') },
          { name: 'stage', label: 'Stage', kind: 'select', choices: STAGES },
          { name: 'priority', label: 'Priority', kind: 'number', value: 0 },
          { name: 'note', label: 'Note', kind: 'text' }
        ]
      }) : '')));
  }

  if (context.mayReadBlacklist) {
    const columns: Column[] = [
      { label: 'Name', cell: row => text(row.in_game_name) + `<small>${text(row.in_game_id)}</small>` },
      { label: 'Why', cell: row => text(row.reason), isLong: true },
      { label: 'Since', cell: row => dayText(String(row.added_at ?? '').slice(0, 10)) }
    ];
    sections.push(workSection('Blacklist', dataTable(columns, blacklist, 'Nobody is on the blacklist.') +
      (context.isAdmin ? rowForm({
        form: 'blacklist', title: 'Add to the blacklist', submitLabel: 'Add',
        fields: [
          { name: 'in_game_name', label: 'In-game name', kind: 'text' },
          { name: 'in_game_id', label: 'In-game id', kind: 'text', isRequired: true },
          { name: 'reason', label: 'Why', kind: 'text', isRequired: true }
        ]
      }) : '')));
  }
  return sections.join('');
}
