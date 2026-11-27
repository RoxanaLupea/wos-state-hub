// Alliance Championship results, drawn the way the game shows them and added in place
// (Roxanne, 27 Nov). Each round: our flags, the opponent, their flags, and one bar per
// lane, blue for a lane we won and red for one we lost. While adding, a lane is tapped to
// mark it won; the flags and points are worked out from the lanes, never typed. Only the
// rounds already fought are asked for. Once all 5 rounds are in, the group ranking can be
// added: the alliances come from the rounds, the points, flags and defeated are typed, and
// the rows are sorted on save.
import { escapeForPage } from './escape.ts';
import './championship-results.css';

export const CHAMPIONSHIP_EDIT_FORM_ID = 'championship-result';
export const CHAMPIONSHIP_ROUND_COUNT = 5;
// The lanes of a round, left to right, as the game shows them.
const LANE_COUNT = 3;
// The points a round's win earns (the game's mails: "earning 3 Championship Points").
const POINTS_FOR_A_WIN = 3;

export interface ChampionshipRound {
  // 1 to 5.
  number: number;
  opponentState: string;
  // As the game writes it: "[LOV]LoveTherapyInc".
  opponentAlliance: string;
  // One letter per lane, left to right: "o" for a lane we won, "t" for one they won.
  lanes: string;
}

export interface RankingRow {
  state: string;
  alliance: string;
  points: string;
  flags: string;
  defeated: string;
  isUs: boolean;
}

export interface ChampionshipView {
  rounds: ChampionshipRound[];
  ranking: RankingRow[];
  // Our place in the group, once the ranking is in.
  rank: number | null;
}

export interface ChampionshipDrawOptions {
  view: ChampionshipView;
  // Our state's number and our alliance as the game writes it ("[DUB]BAKinDUB").
  ourState: number;
  ourAlliance: string;
  // Rounds whose battle has started: only those are asked for.
  roundsFought: number;
  // Being added or changed in place, and whether the ranking is part of it.
  isEditing: boolean;
  withRanking: boolean;
  // The key the form saves under, and the edit that opens the ranking (for those who may).
  formKey: string;
  addRankingEdit: string;
  // The add icon the site's add buttons use.
  addIcon: string;
  // Everyone who put results in, each once, in the order they did, to give them credit
  // (Roxanne, 27 Nov): their picture and name, drawn already.
  contributors: string[];
  // A member's submission being reviewed by an R4: its ticket.
  submissionId: string;
}

function lanesWon(lanes: string): number {
  return Array.from(lanes).filter(lane => lane === 'o').length;
}

// A round's lanes as letters, a lane not marked won counting as lost.
function fullLanes(lanes: string): string {
  return Array.from({ length: LANE_COUNT }, (_, index) => lanes[index] === 'o' ? 'o' : 't').join('');
}

// What the details of a saved result say.
export function championshipViewOf(details: Map<string, string>, opponents: { slot: number; state: string; alliance: string }[],
  rank: number | null): ChampionshipView {
  const rounds: ChampionshipRound[] = [];
  for (let number = 1; number <= CHAMPIONSHIP_ROUND_COUNT; number++) {
    const lanes = details.get(`round${number}_lanes`);
    if (lanes === undefined) continue;
    const opponent = opponents.find(one => one.slot === number);
    rounds.push({ number, lanes: fullLanes(lanes), opponentState: opponent?.state ?? '', opponentAlliance: opponent?.alliance ?? '' });
  }
  let ranking: RankingRow[] = [];
  try {
    const saved = JSON.parse(details.get('ranking') ?? '[]');
    if (Array.isArray(saved)) ranking = saved as RankingRow[];
  } catch {
    ranking = [];
  }
  return { rounds, ranking, rank };
}

// What a member submitted (the result form's fields), drawn back for an R4 to review.
export function championshipViewOfFields(fields: Record<string, string[]>): ChampionshipView {
  const first = (name: string) => fields[name]?.[0] ?? '';
  const rounds: ChampionshipRound[] = [];
  for (let number = 1; number <= CHAMPIONSHIP_ROUND_COUNT; number++) {
    const lanes = fields[`detail_round${number}_lanes`]?.[0];
    if (lanes === undefined) continue;
    rounds.push({ number, lanes: fullLanes(lanes), opponentState: first(opponentName('opponent_state', number)),
      opponentAlliance: first(opponentName('opponent_alliance', number)) });
  }
  const states = fields.ranking_state ?? [];
  const ranking: RankingRow[] = states.map((state, index) => ({
    state, alliance: fields.ranking_alliance?.[index] ?? '', points: fields.ranking_points?.[index] ?? '',
    flags: fields.ranking_flags?.[index] ?? '', defeated: fields.ranking_defeated?.[index] ?? '',
    isUs: fields.ranking_us?.[index] === '1'
  }));
  return { rounds, ranking, rank: null };
}

function lanesBar(lanes: string, isEditing: boolean, roundNumber: number): string {
  return '<div class="ac-lanes">' + Array.from(fullLanes(lanes)).map((lane, index) => isEditing
    ? `<button type="button" class="ac-lane ${lane}" data-ac-lane="${roundNumber}|${index}" aria-label="Lane ${index + 1}"></button>`
    : `<i class="ac-lane ${lane}"></i>`).join('') + '</div>';
}

function roundRow(round: ChampionshipRound, isEditing: boolean): string {
  const ours = lanesWon(round.lanes);
  const theirs = LANE_COUNT - ours;
  const opponent = isEditing
    ? `<span class="svs-day-name ac-opp">Round ${round.number} · <b>#</b><input class="svs-field ac-state" name="${opponentName('opponent_state', round.number)}"` +
      ` inputmode="numeric" autocomplete="off" placeholder="state" value="${escapeForPage(round.opponentState)}">` +
      `<input class="svs-field ac-alliance" name="${opponentName('opponent_alliance', round.number)}" autocomplete="off"` +
      ` placeholder="alliance" value="${escapeForPage(round.opponentAlliance)}"></span>`
    : `<span class="svs-day-name ac-opp">Round ${round.number}` +
      (round.opponentState ? ` · <b>#${escapeForPage(round.opponentState)}</b>` : '') +
      `<span class="ac-alliance-name">${escapeForPage(round.opponentAlliance)}</span></span>`;
  const hidden = isEditing ? `<input type="hidden" name="detail_round${round.number}_lanes" value="${round.lanes}">` +
    `<input type="hidden" name="detail_round${round.number}_ours" value="${ours}">` +
    `<input type="hidden" name="detail_round${round.number}_theirs" value="${theirs}">` : '';
  return `<div class="svs-day ac-round" data-ac-round="${round.number}"><div class="svs-day-values">` +
    `<span class="${ours > theirs ? 'led' : ''}" data-ac-ours>${ours}</span>${opponent}` +
    `<span class="${theirs > ours ? 'led' : ''}" data-ac-theirs>${theirs}</span></div>` +
    lanesBar(round.lanes, isEditing, round.number) + hidden + '</div>';
}

// The result form's opponent fields: round 1 has no ending, the others "_2" to "_5".
function opponentName(base: string, round: number): string {
  return round === 1 ? base : `${base}_${round}`;
}

function ordinal(rank: number): string {
  return rank === 1 ? '1st' : rank === 2 ? '2nd' : rank === 3 ? '3rd' : `${rank}th`;
}

// The group: us and the alliances we met, in the rounds' order, for a ranking not typed yet.
function groupFromRounds(options: ChampionshipDrawOptions): RankingRow[] {
  const rounds = options.view.rounds;
  const flags = rounds.reduce((sum, round) => sum + lanesWon(round.lanes), 0);
  const points = rounds.filter(round => lanesWon(round.lanes) > LANE_COUNT - lanesWon(round.lanes)).length * POINTS_FOR_A_WIN;
  return [
    { state: String(options.ourState), alliance: options.ourAlliance, points: String(points), flags: String(flags), defeated: '', isUs: true },
    ...rounds.map(round => ({ state: round.opponentState, alliance: round.opponentAlliance, points: '', flags: '', defeated: '', isUs: false }))
  ];
}

// Drawn like the site's buttons (the edit icon's colours), so they read as something to tap.
const ARROW_COLOUR = '<defs><linearGradient id="ac-move-colour" x1="0" y1="0" x2="1" y2="1">' +
  '<stop offset="0" style="stop-color: var(--edit-colour)"/><stop offset="1" style="stop-color: var(--text)"/></linearGradient></defs>';
const UP_ARROW = `<svg viewBox="0 0 14 9" aria-hidden="true">${ARROW_COLOUR}<path d="M1.5 7.5L7 2l5.5 5.5"/></svg>`;
const DOWN_ARROW = `<svg viewBox="0 0 14 9" aria-hidden="true">${ARROW_COLOUR}<path d="M1.5 1.5L7 7l5.5-5.5"/></svg>`;

function rankingSection(options: ChampionshipDrawOptions): string {
  const { view } = options;
  const editing = options.isEditing && options.withRanking;
  const rows = editing && !view.ranking.length ? groupFromRounds(options) : view.ranking;
  const head = '<span class="head"></span><span class="head"></span><span class="head n">PTS</span>' +
    '<span class="head n">FLAGS</span><span class="head n">DEFEATED</span>';
  const body = rows.map((row, index) => {
    const us = row.isUs ? ' us' : '';
    const who = `<span class="who${us}">${escapeForPage(row.alliance)}<small>#${escapeForPage(row.state)}</small></span>`;
    if (!editing) {
      return `<span class="${us.trim()}">${index + 1}</span>${who}` +
        `<span class="n${us}">${escapeForPage(row.points)}</span><span class="n${us}">${escapeForPage(row.flags)}</span>` +
        `<span class="n${us}">${escapeForPage(row.defeated)}</span>`;
    }
    const field = (name: string, value: string) => `<span class="n"><input class="svs-field" name="ranking_${name}" inputmode="numeric"` +
      ` autocomplete="off" value="${escapeForPage(value)}"></span>`;
    return `<span class="ac-move" data-ac-rank-row>` +
      `<button type="button" data-ac-move="-1" aria-label="Move up">${UP_ARROW}</button>` +
      `<button type="button" data-ac-move="1" aria-label="Move down">${DOWN_ARROW}</button>` +
      `<input type="hidden" name="ranking_state" value="${escapeForPage(row.state)}">` +
      `<input type="hidden" name="ranking_alliance" value="${escapeForPage(row.alliance)}">` +
      `<input type="hidden" name="ranking_us" value="${row.isUs ? '1' : ''}"></span>` + who +
      field('points', row.points) + field('flags', row.flags) + field('defeated', row.defeated);
  }).join('');
  const place = !editing && view.rank ? ordinal(view.rank) : '';
  return '<section class="svs-part ac-ranking-part"><h3 class="panel-title part-title">Group ranking' +
    `<b>${place}</b></h3><div class="ac-rank${editing ? ' editing' : ''}">${head}${body}</div></section>`;
}

// The Results tab of a Championship run: drawn, or being added or changed in place.
export function championshipResult(options: ChampionshipDrawOptions): string {
  const { view, isEditing } = options;
  // While adding, every round already fought is asked for, those not recorded yet empty.
  const shownRounds: ChampionshipRound[] = isEditing
    ? Array.from({ length: Math.min(CHAMPIONSHIP_ROUND_COUNT, Math.max(options.roundsFought, view.rounds.length)) }, (_, index) =>
        view.rounds.find(round => round.number === index + 1) ??
          { number: index + 1, opponentState: '', opponentAlliance: '', lanes: 'ttt' })
    : view.rounds;
  const hint = isEditing ? '<b class="ac-hint">* Select victory lanes</b>' : '<b></b>';
  const rounds = '<section class="svs-part ac-rounds-part"><h3 class="panel-title part-title">Rounds' + hint + '</h3>' +
    `<div class="svs-days">${shownRounds.map(round => roundRow(round, isEditing)).join('')}</div></section>`;
  // The ranking: once it is in, or while it is being added; "Add ranking" once all 5
  // rounds are in, for those who may.
  let ranking = '';
  if (view.ranking.length || (isEditing && options.withRanking)) ranking = rankingSection(options);
  else if (!isEditing && options.addRankingEdit && view.rounds.length === CHAMPIONSHIP_ROUND_COUNT) {
    ranking = '<section class="svs-part ac-ranking-part"><h3 class="panel-title part-title">Group ranking' +
      `<button type="button" class="edit-button ac-add-ranking" data-edit="${escapeForPage(options.addRankingEdit)}">${options.addIcon}` +
      '<span><span class="words">Add ranking</span></span></button></h3></section>';
  }
  // The ranking already saved stays when only the rounds are changed.
  const keptRanking = isEditing && !options.withRanking && view.ranking.length
    ? `<input type="hidden" name="detail_ranking" value="${escapeForPage(JSON.stringify(view.ranking))}">` +
      `<input type="hidden" name="rank" value="${view.rank ?? ''}">` : '';
  const body = rounds + ranking + keptRanking;
  return isEditing
    ? `<form class="svs-result ac-result ac-editing" id="${CHAMPIONSHIP_EDIT_FORM_ID}" data-form="result" data-key="${escapeForPage(options.formKey)}">` +
      body + (options.submissionId ? `<input type="hidden" name="submission_id" value="${escapeForPage(options.submissionId)}">` : '') +
      '<p class="form-message" data-form-message></p></form>'
    : `<div class="svs-result ac-result">${body}` +
      (options.contributors.length ? `<div class="ac-credit"><span>Submitted by</span>${options.contributors.join('')}</div>` : '') + '</div>';
}

// A lane tapped while adding: it turns won or lost, and its round's flags follow.
export function toggleChampionshipLane(button: HTMLElement): void {
  const round = button.closest<HTMLElement>('[data-ac-round]');
  if (!round) return;
  const isWon = button.classList.contains('o');
  button.classList.toggle('o', !isWon);
  button.classList.toggle('t', isWon);
  const lanes = Array.from(round.querySelectorAll('.ac-lane')).map(lane => lane.classList.contains('o') ? 'o' : 't').join('');
  const ours = lanesWon(lanes);
  const theirs = LANE_COUNT - ours;
  const number = round.dataset.acRound;
  const set = (name: string, value: string) => {
    const input = round.querySelector<HTMLInputElement>(`input[name="${name}"]`);
    if (input) input.value = value;
  };
  set(`detail_round${number}_lanes`, lanes);
  set(`detail_round${number}_ours`, String(ours));
  set(`detail_round${number}_theirs`, String(theirs));
  const oursShown = round.querySelector<HTMLElement>('[data-ac-ours]');
  const theirsShown = round.querySelector<HTMLElement>('[data-ac-theirs]');
  if (oursShown) { oursShown.textContent = String(ours); oursShown.classList.toggle('led', ours > theirs); }
  if (theirsShown) { theirsShown.textContent = String(theirs); theirsShown.classList.toggle('led', theirs > ours); }
}

// A ranking row moved up or down with its arrows: its five cells move together.
export function moveRankingRow(button: HTMLElement): void {
  const mover = button.closest<HTMLElement>('[data-ac-rank-row]');
  const grid = mover?.parentElement;
  if (!mover || !grid) return;
  const cellsPerRow = 5;
  const movers = Array.from(grid.querySelectorAll<HTMLElement>('[data-ac-rank-row]'));
  const index = movers.indexOf(mover);
  const target = index + Number(button.dataset.acMove);
  if (target < 0 || target >= movers.length) return;
  const cellsOf = (start: HTMLElement) => {
    const cells: Element[] = [start];
    let next = start.nextElementSibling;
    while (cells.length < cellsPerRow && next) { cells.push(next); next = next.nextElementSibling; }
    return cells;
  };
  const moving = cellsOf(mover);
  const other = movers[target];
  if (target < index) moving.forEach(cell => grid.insertBefore(cell, other));
  else {
    const after = cellsOf(other)[cellsPerRow - 1].nextElementSibling;
    moving.forEach(cell => grid.insertBefore(cell, after));
  }
}

// The ranking typed in, sorted by points and then flags (rows tied keep the order they
// were put in), as it is saved: the rows, and our place.
export function rankingFromForm(values: FormData): { rows: RankingRow[]; rank: number | null } | null {
  const all = (name: string) => values.getAll('ranking_' + name).map(value => String(value).trim());
  const states = all('state');
  if (!states.length) return null;
  const alliances = all('alliance'), points = all('points'), flags = all('flags'), defeated = all('defeated'), us = all('us');
  const rows: RankingRow[] = states.map((state, index) => ({
    state, alliance: alliances[index] ?? '', points: points[index] ?? '', flags: flags[index] ?? '',
    defeated: defeated[index] ?? '', isUs: us[index] === '1'
  }));
  const numberOf = (value: string) => value === '' || !Number.isFinite(Number(value)) ? -Infinity : Number(value);
  const sorted = rows.map((row, index) => ({ row, index }))
    .sort((left, right) => numberOf(right.row.points) - numberOf(left.row.points) ||
      numberOf(right.row.flags) - numberOf(left.row.flags) || left.index - right.index)
    .map(one => one.row);
  const typed = sorted.some(row => row.points !== '');
  const ourPlace = sorted.findIndex(row => row.isUs);
  return { rows: sorted, rank: typed && ourPlace >= 0 ? ourPlace + 1 : null };
}

// The trophy with a plus, at the top right of an event's head, for those who may add its
// results while it has none (Roxanne, 27 Nov: "it has to be graphical").
export function addResultsButton(edit: string): string {
  return `<button type="button" class="add-results-top" data-edit="${escapeForPage(edit)}">` +
    '<svg class="add-results-icon" viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="add-results-colour" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" style="stop-color: var(--event-color)"/><stop offset="1" style="stop-color: var(--text)"/></linearGradient></defs>' +
    '<g fill="none" stroke="url(#add-results-colour)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M9 5h12v6a6 6 0 0 1-12 0z"/><path d="M9 7H5.5v1.5A4 4 0 0 0 9.5 12.5M21 7h3.5v1.5a4 4 0 0 1-4 4"/>' +
    '<path d="M15 17v4M10.5 25h9l-1-4h-7z"/></g>' +
    '<circle cx="24.5" cy="23.5" r="6" fill="var(--event-color)"/><path d="M24.5 20.5v6M21.5 23.5h6" stroke="#0B1222" stroke-width="2" stroke-linecap="round"/></svg>' +
    '<span>Results</span></button>';
}
