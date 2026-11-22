// Results: how each run went, in the event's Results tab, and the form that records
// it. State results (SvS, Tyrant, TAL played by a state alliance) are entered by
// admins; an alliance's own results by its alliance managers. The SvS and TAL history
// collected from the game before the site existed is shown with them.
import { escapeForPage } from './escape.ts';
import { dataTable, rowForm, text, type Column, type Field } from './data-table.ts';
import type { Row } from '../data/records.ts';
import { allianceTag } from '../data/alliances.ts';
import { eventTypeName } from '../data/catalog.ts';
import { longDayText, shortDayText } from './day-names.ts';
import { dayFromText } from '../calendar/days.ts';
import type { WorkContext } from './working-pages.ts';
import type { ShowdownScore } from './showdown-score.ts';
import svsHistory from '../../seed/svs-results.json';
import talHistory from '../../seed/tal-results.json';

const SVS_FAMILY = ['svs', 'svs-matchmaking', 'svs-prep', 'svs-battle', 'castle-battle', 'svs-triage'];
// The events an alliance records for itself.
export const ALLIANCE_RESULT_EVENTS = ['showdown', 'foundry', 'canyon', 'winter-siege', 'alliance-championship'];

export interface ResultsOptions {
  context: WorkContext;
  eventTypeId: string;
  // The run open on the page, as a date ("2026-11-28").
  runDate: string;
  // Events an alliance switched off in its results section.
  isSwitchedOff: (allianceId: string, eventTypeId: string) => boolean;
}

interface ResultView {
  row: Row;
  details: Map<string, string>;
  opponents: Row[];
}

function resultsOf(context: WorkContext, eventTypeId: string): ResultView[] | null {
  const results = context.rowsOf('results');
  const details = context.rowsOf('result_details');
  const opponents = context.rowsOf('result_opponents');
  if (!results || !details || !opponents) return null;
  return results.filter(one => one.event_type_id === eventTypeId).map(row => ({
    row,
    details: new Map(details.filter(one => one.result_id === row.id)
      .map(one => [String(one.detail_key), String(one.detail_value ?? '')])),
    opponents: opponents.filter(one => one.result_id === row.id)
      .sort((left, right) => Number(left.slot) - Number(right.slot))
  })).sort((left, right) => String(right.row.event_date).localeCompare(String(left.row.event_date)));
}

function dateCell(date: unknown): string {
  return date ? escapeForPage(shortDayText(dayFromText(String(date)))) +
    `<small>${escapeForPage(String(date).slice(0, 4))}</small>` : '—';
}

function outcomeText(value: unknown): string {
  return value === 'win' ? 'Win' : value === 'loss' ? 'Loss' : value === 'draw' ? 'Draw' : '—';
}

function opponentText(opponent: Row | undefined): string {
  if (!opponent) return '—';
  const parts = [opponent.opponent_alliance ? String(opponent.opponent_alliance) : '',
    opponent.opponent_state ? '#' + opponent.opponent_state : ''].filter(Boolean);
  return parts.length ? escapeForPage(parts.join(' ')) : '—';
}

const OUTCOMES: [string, string][] = [['', 'Not known'], ['win', 'Win'], ['loss', 'Loss']];

// The key a result's form saves under: the event, the date, the alliance (empty for a
// state result) and the row being changed, if there is one.
function formKey(eventTypeId: string, date: string, allianceId: string, existing: ResultView | undefined): string {
  return [eventTypeId, date, allianceId, existing ? String(existing.row.id) : ''].join('|');
}

// The Results tab of an event, or empty for an event without results.
export function resultsTab(options: ResultsOptions): string {
  const eventTypeId = options.eventTypeId;
  if (SVS_FAMILY.includes(eventTypeId)) return svsResults(options);
  if (eventTypeId === 'hellfire') return talResults(options);
  if (eventTypeId === 'tyrant') return tyrantResults(options);
  if (ALLIANCE_RESULT_EVENTS.includes(eventTypeId)) return allianceResults(options);
  return '';
}

// ---------------------------------------------------------------------------
// SvS: one record per SvS, as the old sheet kept it.
// ---------------------------------------------------------------------------

function svsResults(options: ResultsOptions): string {
  const { context } = options;
  const recorded = resultsOf(context, 'svs');
  if (!recorded) return '<p class="work-empty">Loading…</p>';
  const recordedDates = new Set(recorded.map(one => String(one.row.event_date)));
  const history = (svsHistory as Record<string, unknown>[])
    .filter(one => !recordedDates.has(String(one.date)))
    .map(one => ({
      date: one.date, result: one.result, opponent: one.opponentState ? '#' + one.opponentState : '',
      preparation: one.preparation, castle: one.castleBattle, castleAlliance: one.castleAllianceId ?? ''
    }));
  const rows: Row[] = recorded.map(one => ({
    date: one.row.event_date, result: one.details.get('result') ?? one.row.outcome,
    opponent: [one.opponents[0]?.opponent_alliance, one.opponents[0]?.opponent_state ? '#' + one.opponents[0].opponent_state : '']
      .filter(Boolean).join(' '),
    preparation: one.details.get('preparation'), castle: one.details.get('castle_battle'),
    castleAlliance: one.row.state_alliance_id ?? ''
  } as Row)).concat(history as Row[])
    .sort((left, right) => String(right.date).localeCompare(String(left.date)));

  const columns: Column[] = [
    { label: 'Date', cell: row => dateCell(row.date) },
    { label: 'Opponent', cell: row => text(row.opponent) },
    { label: 'Result', cell: row => outcomeText(row.result) },
    { label: 'Preparation', cell: row => outcomeText(row.preparation) },
    { label: 'Castle battle', cell: row => outcomeText(row.castle) },
    { label: 'Castle held by', cell: row => text(row.castleAlliance ? allianceTag(String(row.castleAlliance)) : '') }
  ];
  const existing = recorded.find(one => one.row.event_date === options.runDate);
  // A run already in the history collected before the site fills the form until it is
  // recorded here.
  const known = (svsHistory as Record<string, unknown>[]).find(one => one.date === options.runDate);
  const start = (detail: string, fromHistory: unknown) => existing?.details.get(detail) ?? String(fromHistory ?? '');
  const form = context.isAdmin ? rowForm({
    form: 'result', key: formKey('svs', options.runDate, '', existing),
    title: `SvS of ${longDayText(dayFromText(options.runDate))}`,
    fields: [
      { name: 'opponent_state', label: 'Opponent state', kind: 'number',
        value: existing ? existing.opponents[0]?.opponent_state ?? '' : known?.opponentState ?? '' },
      { name: 'detail_result', label: 'Result', kind: 'select', value: start('result', known?.result),
        choices: [['', 'Not known'], ['win', 'Win'], ['loss', 'Loss'], ['draw', 'Draw']] },
      { name: 'detail_preparation', label: 'Preparation', kind: 'select', value: start('preparation', known?.preparation), choices: OUTCOMES },
      { name: 'detail_castle_battle', label: 'Castle battle', kind: 'select', value: start('castle_battle', known?.castleBattle), choices: OUTCOMES },
      { name: 'state_alliance_id', label: 'Castle held by', kind: 'select',
        value: existing ? existing.row.state_alliance_id ?? '' : known?.castleAllianceId ?? '',
        choices: [['', 'Nobody'], ...context.alliances.map(one => [one.id, one.tag] as [string, string])] },
      { name: 'note', label: 'Note', kind: 'text', value: existing?.row.note ?? '' }
    ]
  }) : '';
  return form + dataTable(columns, rows, 'No SvS is recorded yet.');
}

// ---------------------------------------------------------------------------
// Tundra Arms League: each legion's season, zone and final rank.
// ---------------------------------------------------------------------------

function talResults(options: ResultsOptions): string {
  const { context } = options;
  const recorded = resultsOf(context, 'hellfire');
  if (!recorded) return '<p class="work-empty">Loading…</p>';
  const rows: Row[] = recorded.map(one => ({
    season: one.details.get('season'), zone: one.details.get('zone'),
    alliance: one.row.alliance_id ? allianceTag(String(one.row.alliance_id)) : one.row.state_alliance_id
      ? allianceTag(String(one.row.state_alliance_id)) : '',
    legion: one.details.get('legion'), rank: one.row.rank
  } as Row)).concat((talHistory as Record<string, unknown>[]).map(one => ({
    season: one.season, zone: one.zone, alliance: one.allianceTag, legion: one.legion, rank: one.rank
  })))
    .sort((left, right) => Number(right.season) - Number(left.season) || Number(left.rank) - Number(right.rank));
  const columns: Column[] = [
    { label: 'Season', cell: row => text(row.season), isNumber: true },
    { label: 'Zone', cell: row => text(row.zone), isNumber: true },
    { label: 'Alliance', cell: row => text(row.alliance) },
    { label: 'Legion', cell: row => text(row.legion), isNumber: true },
    { label: 'Final rank', cell: row => text(row.rank), isNumber: true }
  ];
  const mayRecord = context.isAdmin || context.alliances.some(one => context.leads(one.id));
  const form = mayRecord ? rowForm({
    form: 'result', key: formKey('hellfire', options.runDate, '', undefined),
    title: 'Record a legion',
    fields: [
      { name: 'alliance_id', label: 'Alliance', kind: 'select', isRequired: true,
        choices: [['', 'Pick an alliance'], ...context.alliances
          .filter(one => context.isAdmin || context.leads(one.id)).map(one => [one.id, one.tag] as [string, string])] },
      { name: 'detail_season', label: 'Season', kind: 'number', isRequired: true },
      { name: 'detail_zone', label: 'Zone', kind: 'number' },
      { name: 'detail_legion', label: 'Legion', kind: 'select', value: '1', choices: [['1', '1'], ['2', '2']] },
      { name: 'rank', label: 'Final rank', kind: 'number' }
    ]
  }) : '';
  return form + dataTable(columns, rows, 'No season is recorded yet.');
}

// ---------------------------------------------------------------------------
// Frostdragon Tyrant: the state's rank, and who played as the state alliance.
// ---------------------------------------------------------------------------

function tyrantResults(options: ResultsOptions): string {
  const { context } = options;
  const recorded = resultsOf(context, 'tyrant');
  if (!recorded) return '<p class="work-empty">Loading…</p>';
  const columns: Column[] = [
    { label: 'Date', cell: one => dateCell(one.event_date) },
    { label: 'Played as', cell: one => text(one.state_alliance_id ? allianceTag(String(one.state_alliance_id)) : '') },
    { label: 'Rank', cell: one => text(one.rank), isNumber: true },
    { label: 'Note', cell: one => text(one.note) }
  ];
  const existing = recorded.find(one => one.row.event_date === options.runDate && !one.row.alliance_id);
  const form = context.isAdmin ? rowForm({
    form: 'result', key: formKey('tyrant', options.runDate, '', existing),
    title: `Tyrant of ${longDayText(dayFromText(options.runDate))}`,
    fields: [
      { name: 'state_alliance_id', label: 'Played as', kind: 'select', value: existing?.row.state_alliance_id ?? '',
        choices: [['', 'Not known'], ...context.alliances.map(one => [one.id, one.tag] as [string, string])] },
      { name: 'rank', label: 'Rank', kind: 'number', value: existing?.row.rank ?? '' },
      { name: 'note', label: 'Note', kind: 'text', value: existing?.row.note ?? '' }
    ]
  }) : '';
  return form + dataTable(columns, recorded.map(one => one.row), 'No Tyrant is recorded yet.');
}

// ---------------------------------------------------------------------------
// An alliance's own results: Showdown, Foundry, Canyon, Winter Siege, Championship.
// ---------------------------------------------------------------------------

// The tiers, as the game names them, lowest first.
export const WINTER_SIEGE_TIERS = ['Rookie', 'Stalwart', 'Pioneer', 'Exalted', 'Mythic', 'Legendary'];
export const CHAMPIONSHIP_TIERS = ['Iron', 'Bronze', 'Silver', 'Gold', 'Diamond', 'Ultimate'];

// Stars an alliance gets for its final group rank in the Championship, by its tier.
const STARS_BY_RANK: Record<string, number[]> = {
  //          rank 1, 2, 3, 4, 5, 6
  Iron:     [4, 3, 3, 2, 2, 1],
  Bronze:   [4, 3, 3, 2, 2, 1],
  Silver:   [3, 2, 2, 1, 1, 1],
  Gold:     [3, 2, 2, 1, 1, 1],
  Diamond:  [3, 2, 2, 1, 1, -1],
  Ultimate: [2, 1, 1, -1, -1, -2]
};

export function championshipStars(tier: string, rank: number | null): number {
  if (!rank || rank < 1 || rank > 6) return 0;
  return STARS_BY_RANK[tier]?.[rank - 1] ?? 0;
}

// The rounds of a Championship group: each alliance meets the other 5, one round each.
const CHAMPIONSHIP_ROUNDS = 5;
// Foundry and Canyon are recorded per legion.
const LEGION_EVENTS = ['foundry', 'canyon'];

const FOUNDRY_MAIL: [string, string][] = [
  ['our_points', 'Our Arsenal Points'], ['their_points', 'Their Arsenal Points'],
  ['control_duration', 'Imperial Foundry Control Duration'],
  ['control_mvp', 'Control MVP'], ['control_amount', 'Control amount'],
  ['gathering_mvp', 'Gathering MVP'], ['gathering_amount', 'Gathering amount'],
  ['loot_mvp', 'Loot MVP'], ['loot_amount', 'Loot amount'],
  ['ko_mvp', 'KO Rewards MVP'], ['ko_amount', 'KO Rewards amount'],
  ['mercenary_sieges', 'Sieges by Mercenaries']
];
const CANYON_MAIL: [string, string][] = [
  ['our_points', 'Our points'], ['opponent_points', 'First opponent\'s points'], ['opponent_points_2', 'Second opponent\'s points'],
  ...[['fuel', 'Total Fuel Used'], ['squads', 'Enemy Squads Defeated'], ['buildings', 'Occupied Buildings'],
    ['speedups', 'Total Battle Speedups Used'], ['accelerator_1', 'Total March Accelerator I Used'],
    ['accelerator_2', 'Total March Accelerator II Used'], ['retreats', 'Total Retreats'], ['advances', 'Total Advances']]
    .flatMap(([key, label]) => [[key + '_mvp', label + ' MVP'], [key + '_amount', label + ' amount']] as [string, string][])
];

function opponentFields(existing: ResultView | undefined, count: number, words: (slot: number) => string): Field[] {
  const fields: Field[] = [];
  for (let slot = 1; slot <= count; slot++) {
    const suffix = slot === 1 ? '' : '_' + slot;
    const opponent = existing?.opponents.find(one => Number(one.slot) === slot);
    fields.push(
      { name: 'opponent_state' + suffix, label: words(slot) + ' state', kind: 'number', value: opponent?.opponent_state ?? '' },
      { name: 'opponent_alliance' + suffix, label: words(slot) + ' alliance', kind: 'text', value: opponent?.opponent_alliance ?? '' });
  }
  return fields;
}

function detailFields(existing: ResultView | undefined, details: [string, string][]): Field[] {
  return details.map(([key, label]) => ({ name: 'detail_' + key, label, kind: 'text' as const, value: existing?.details.get(key) ?? '' }));
}

// The fields of one alliance's result for one run (and one legion, where it has them).
function allianceResultFields(eventTypeId: string, allianceId: string, existing: ResultView | undefined): Field[] {
  const note: Field = { name: 'note', label: 'Note', kind: 'text', value: existing?.row.note ?? '' };
  if (eventTypeId === 'showdown') {
    const fields = opponentFields(existing, 1, () => 'Opponent');
    for (let day = 1; day <= 6; day++) {
      fields.push(
        { name: 'detail_winner' + day, label: `Day ${day} won by`, kind: 'select', value: existing?.details.get('winner' + day) ?? '',
          choices: [['', 'Not played yet'], ['us', allianceTag(allianceId)], ['them', 'Opponent'], ['tie', 'Tie']] },
        { name: 'detail_mvp' + day, label: `Day ${day} MVP`, kind: 'text', value: existing?.details.get('mvp' + day) ?? '' });
    }
    return [...fields, note];
  }
  if (eventTypeId === 'winter-siege') {
    return [...opponentFields(existing, 1, () => 'Opponent'),
      { name: 'detail_outcome', label: 'Result', kind: 'select', value: existing?.details.get('outcome') ?? existing?.row.outcome ?? '',
        choices: [['', 'Not known'], ['win', 'Win'], ['loss', 'Loss'], ['no_opponent', 'No opponent']] }, note];
  }
  if (eventTypeId === 'alliance-championship') {
    const fields: Field[] = [];
    for (let round = 1; round <= CHAMPIONSHIP_ROUNDS; round++) {
      const suffix = round === 1 ? '' : '_' + round;
      const opponent = existing?.opponents.find(one => Number(one.slot) === round);
      fields.push(
        { name: 'opponent_state' + suffix, label: `Round ${round} opponent state`, kind: 'number', value: opponent?.opponent_state ?? '' },
        { name: 'opponent_alliance' + suffix, label: `Round ${round} opponent alliance`, kind: 'text', value: opponent?.opponent_alliance ?? '' },
        { name: `detail_round${round}_ours`, label: `Round ${round} our flags`, kind: 'select', value: existing?.details.get(`round${round}_ours`) ?? '',
          choices: [['', '—'], ['0', '0'], ['1', '1'], ['2', '2'], ['3', '3']] },
        { name: `detail_round${round}_theirs`, label: `Round ${round} their flags`, kind: 'select', value: existing?.details.get(`round${round}_theirs`) ?? '',
          choices: [['', '—'], ['0', '0'], ['1', '1'], ['2', '2'], ['3', '3']] });
    }
    fields.push({ name: 'rank', label: 'Final group rank', kind: 'select', value: String(existing?.row.rank ?? ''),
      choices: [['', 'Not yet'], ...[1, 2, 3, 4, 5, 6].map(rank => [String(rank), String(rank)] as [string, string])] });
    return [...fields, note];
  }
  if (eventTypeId === 'foundry') {
    return [{ name: 'outcome', label: 'Result', kind: 'select', value: existing?.row.outcome ?? '', choices: OUTCOMES },
      ...opponentFields(existing, 1, () => 'Opponent'), ...detailFields(existing, FOUNDRY_MAIL), note];
  }
  if (eventTypeId === 'canyon') {
    return [{ name: 'rank', label: 'Rank among the three', kind: 'select', value: String(existing?.row.rank ?? ''),
        choices: [['', 'Not known'], ['1', '1'], ['2', '2'], ['3', '3']] },
      ...opponentFields(existing, 2, slot => slot === 1 ? 'First opponent' : 'Second opponent'),
      ...detailFields(existing, CANYON_MAIL), note];
  }
  return [note];
}

// A Championship run in a few words: its rounds won, drawn and lost, and its rank.
function championshipText(view: ResultView): string {
  let wins = 0, draws = 0, losses = 0;
  for (let round = 1; round <= CHAMPIONSHIP_ROUNDS; round++) {
    const ours = view.details.get(`round${round}_ours`);
    const theirs = view.details.get(`round${round}_theirs`);
    if (ours === undefined || theirs === undefined) continue;
    if (Number(ours) > Number(theirs)) wins++;
    else if (Number(ours) < Number(theirs)) losses++;
    else draws++;
  }
  const rounds = wins + draws + losses ? `${wins} won, ${draws} drawn, ${losses} lost` : '';
  return [view.row.rank ? `Rank ${view.row.rank}` : '', rounds].filter(Boolean).join(' · ') || '—';
}

function resultText(eventTypeId: string, view: ResultView): string {
  if (eventTypeId === 'showdown') return showdownTotalText(view);
  if (eventTypeId === 'alliance-championship') return escapeForPage(championshipText(view));
  if (eventTypeId === 'canyon') return view.row.rank ? `Rank ${escapeForPage(String(view.row.rank))} of 3` : '—';
  if (eventTypeId === 'winter-siege') return view.details.get('outcome') === 'no_opponent' ? 'No opponent'
    : outcomeText(view.details.get('outcome') ?? view.row.outcome);
  return outcomeText(view.row.outcome);
}

// An alliance's past runs of one event.
function allianceRunsTable(eventTypeId: string, ours: ResultView[]): string {
  const columns: Column[] = [{ label: 'Date', cell: row => dateCell(row.event_date) }];
  if (LEGION_EVENTS.includes(eventTypeId)) {
    columns.push({ label: 'Legion', cell: row => text(ours.find(one => one.row === row)?.details.get('legion')), isNumber: true });
  }
  columns.push(
    { label: eventTypeId === 'alliance-championship' ? 'Opponents' : 'Opponent', cell: row => {
      const view = ours.find(one => one.row === row);
      return view && view.opponents.length ? view.opponents.map(opponentText).join('<br>') : '—';
    } },
    { label: 'Result', cell: row => { const view = ours.find(one => one.row === row); return view ? resultText(eventTypeId, view) : '—'; } },
    { label: 'Note', cell: row => text(row.note) });
  return dataTable(columns, ours.map(one => one.row), 'Nothing is recorded yet.');
}

function allianceResults(options: ResultsOptions): string {
  const { context, eventTypeId } = options;
  const allianceId = context.myAllianceId;
  if (!allianceId) return '<p class="work-empty">Pick your alliance on your page to see its results.</p>';
  if (options.isSwitchedOff(allianceId, eventTypeId)) return '';
  const recorded = resultsOf(context, eventTypeId);
  if (!recorded) return '<p class="work-empty">Loading…</p>';
  const ours = recorded.filter(one => one.row.alliance_id === allianceId);
  const runTitle = `${allianceTag(allianceId)} · ${eventTypeName(eventTypeId)} of ${longDayText(dayFromText(options.runDate))}`;

  let forms = '';
  if (context.leads(allianceId)) {
    const legions = LEGION_EVENTS.includes(eventTypeId) ? ['1', '2'] : [''];
    forms = legions.map(legion => {
      const existing = ours.find(one => one.row.event_date === options.runDate &&
        (!legion || one.details.get('legion') === legion));
      const fields = allianceResultFields(eventTypeId, allianceId, existing);
      if (legion) fields.unshift({ name: 'detail_legion', label: 'Legion', kind: 'hidden', value: legion });
      return rowForm({
        form: 'result', key: formKey(eventTypeId, options.runDate, allianceId, existing),
        title: legion ? `${runTitle} · Legion ${legion}` : runTitle, fields
      });
    }).join('');
  }
  return forms + allianceRunsTable(eventTypeId, ours);
}

function showdownTotalText(view: ResultView | undefined): string {
  if (!view) return '—';
  const wins = [1, 2, 3, 4, 5, 6].filter(day => view.details.get('winner' + day) === 'us').length;
  const losses = [1, 2, 3, 4, 5, 6].filter(day => view.details.get('winner' + day) === 'them').length;
  return wins || losses ? `${wins}–${losses} days` : '—';
}

// The Showdown score of a run, for the Total score tab.
export function showdownScoreOf(context: WorkContext, runDate: string): ShowdownScore | null {
  const recorded = resultsOf(context, 'showdown');
  const view = recorded?.find(one => one.row.event_date === runDate && one.row.alliance_id === context.myAllianceId);
  if (!view) return null;
  return {
    opponentState: String(view.opponents[0]?.opponent_state ?? ''),
    opponentAlliance: String(view.opponents[0]?.opponent_alliance ?? ''),
    winners: [1, 2, 3, 4, 5, 6].map(day => view.details.get('winner' + day) ?? ''),
    mvps: [1, 2, 3, 4, 5, 6].map(day => view.details.get('mvp' + day) ?? '')
  };
}

// ---------------------------------------------------------------------------
// My alliance · Results: what the alliance keeps, its ratings and tiers, its history.
// ---------------------------------------------------------------------------

export function allianceResultsPage(context: WorkContext): string {
  const allianceId = context.myAllianceId;
  const wrap = (body: string) => '<div class="work-page">' + body + '</div>';
  const section = (title: string, body: string) =>
    `<section class="work-section glass"><div class="work-head"><h2>${escapeForPage(title)}</h2></div>${body}</section>`;
  if (!allianceId) return wrap(section('Results', '<p class="work-empty">Pick your alliance on your page to see its results.</p>'));
  const records = context.rowsOf('alliance_records');
  const all = context.rowsOf('results');
  if (!records || !all || !context.rowsOf('result_details') || !context.rowsOf('result_opponents')) {
    return wrap(section('Results', '<p class="work-empty">Loading…</p>'));
  }
  const record = records.find(one => one.alliance_id === allianceId);
  const switchedOff = Array.isArray(record?.results_off) ? record.results_off as string[] : [];
  const canEdit = context.leads(allianceId);
  const tierChoices = (tiers: string[]): [string, string][] => [['', 'Not set'], ...tiers.map(tier => [tier, tier] as [string, string])];

  const facts: Column[] = [
    { label: 'Showdown Star Rating', cell: row => text(row.showdown_star_rating), isNumber: true },
    { label: 'Winter Siege tier', cell: row => text(row.winter_siege_tier) },
    { label: 'Championship tier', cell: row => text(row.championship_tier) },
    { label: 'Championship Stars', cell: row => text(row.championship_stars), isNumber: true }
  ];
  const kept = canEdit
    ? rowForm({
        form: 'alliance-records', key: allianceId, title: `${allianceTag(allianceId)} keeps`,
        fields: [
          ...ALLIANCE_RESULT_EVENTS.map(eventTypeId => ({
            name: 'keep_' + eventTypeId, label: eventTypeName(eventTypeId), kind: 'checkbox' as const,
            value: !switchedOff.includes(eventTypeId)
          })),
          { name: 'showdown_star_rating', label: 'Showdown Star Rating', kind: 'number', value: record?.showdown_star_rating ?? '' },
          { name: 'winter_siege_tier', label: 'Winter Siege tier', kind: 'select', value: record?.winter_siege_tier ?? '', choices: tierChoices(WINTER_SIEGE_TIERS) },
          { name: 'championship_tier', label: 'Championship tier', kind: 'select', value: record?.championship_tier ?? '', choices: tierChoices(CHAMPIONSHIP_TIERS) },
          { name: 'championship_stars', label: 'Championship Stars', kind: 'number', value: record?.championship_stars ?? '' }
        ]
      })
    : dataTable(facts, record ? [record] : [], 'Nothing is recorded yet.');

  const histories = ALLIANCE_RESULT_EVENTS.filter(eventTypeId => !switchedOff.includes(eventTypeId)).map(eventTypeId =>
    section(eventTypeName(eventTypeId),
      allianceRunsTable(eventTypeId, (resultsOf(context, eventTypeId) ?? []).filter(one => one.row.alliance_id === allianceId))));
  return wrap(section(allianceTag(allianceId), kept) + histories.join(''));
}

// ---------------------------------------------------------------------------
// My alliance · Opponents: notes on opponent alliances, by state and tag.
// ---------------------------------------------------------------------------

export function opponentNotesPage(context: WorkContext, hidesOthers: boolean, hidesAll: boolean): string {
  const wrap = (body: string) => '<div class="work-page">' + body + '</div>';
  const section = (title: string, body: string, beside = '') =>
    `<section class="work-section glass"><div class="work-head"><h2>${escapeForPage(title)}</h2>${beside}</div>${body}</section>`;
  const mayRead = context.isAdmin || context.alliances.some(one => context.leads(one.id));
  if (!mayRead) return wrap(section('Opponents', '<p class="work-empty">Opponent notes are for R4s and R5s.</p>'));
  const notes = context.rowsOf('opponent_notes');
  if (!notes) return wrap(section('Opponents', '<p class="work-empty">Loading…</p>'));
  const shown = hidesAll ? [] : notes
    .filter(one => !hidesOthers || one.alliance_id === context.myAllianceId)
    .sort((left, right) => Number(left.opponent_state) - Number(right.opponent_state) ||
      String(left.opponent_tag).localeCompare(String(right.opponent_tag)) ||
      String(right.written_at ?? '').localeCompare(String(left.written_at ?? '')));
  const columns: Column[] = [
    { label: 'Opponent', cell: row => text(row.opponent_tag) + `<small>#${text(row.opponent_state)}</small>` },
    { label: 'Note', cell: row => text(row.note) },
    { label: 'By', cell: row => text(row.alliance_id ? allianceTag(String(row.alliance_id)) : '') +
      `<small>${row.written_at ? escapeForPage(shortDayText(dayFromText(String(row.written_at).slice(0, 10)))) : ''}</small>` }
  ];
  const toggles = '<div class="work-choices">' +
    `<button type="button" class="work-choice${hidesOthers ? ' on' : ''}" data-opponent-toggle="others">Only ours</button>` +
    `<button type="button" class="work-choice${hidesAll ? ' on' : ''}" data-opponent-toggle="all">Hide all notes</button></div>`;
  return wrap(
    section('Opponents', dataTable(columns, shown, hidesAll ? 'Opponent notes are hidden.' : 'No note yet.'), toggles) +
    (context.myAllianceId && context.leads(context.myAllianceId) ? section('New note', rowForm({
      form: 'opponent-note', key: context.myAllianceId, title: 'A note on an opponent', submitLabel: 'Add',
      fields: [
        { name: 'opponent_state', label: 'State', kind: 'number', isRequired: true },
        { name: 'opponent_tag', label: 'Alliance tag', kind: 'text', isRequired: true },
        { name: 'note', label: 'Note', kind: 'textarea', isRequired: true }
      ]
    })) : ''));
}
