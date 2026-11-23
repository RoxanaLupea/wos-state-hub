// The fortress board, one phase at a time, and the season's reward matrices,
// alliances down and reward items across.
import './fortress.css';
import './pages.css';
import { fortRewardOf, itemLabel, itemName } from '../data/catalog.ts';
import type { FortReward } from '../data/catalog.ts';
import { allianceById } from '../data/alliances.ts';
import {
  FORT_NAMES, FORT_PHASES, SHARED_WITH_STATE, battleDayOf, creditedAllianceId,
  fortFullName, isStronghold
} from '../calendar/fort-season.ts';
import { shortDayText } from './day-names.ts';
import { escapeForPage } from './escape.ts';
import { itemImageUrl } from './event-icon.ts';
import { colorWithAlpha, hexToRgb } from './colors.ts';
import type { FortAssignment } from '../data/forts.ts';
import type { Alliance } from '../data/alliances.ts';

// An academy flies a paler version of its main alliance's colours, so the two read as
// one family without being mistaken for each other.
function mixWithWhite(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  const blend = (channel: number) => Math.round(channel + (255 - channel) * amount);
  return '#' + [blend(rgb.red), blend(rgb.green), blend(rgb.blue)]
    .map(channel => channel.toString(16).padStart(2, '0')).join('');
}

export function bannerStyle(alliance: Alliance): string {
  const main = alliance.mainAllianceId ? allianceById(alliance.mainAllianceId) : undefined;
  const owner = main ?? alliance;
  const base = main
    ? mixWithWhite(owner.baseColor ?? '#6F9BE6', 0.4)
    : owner.baseColor ?? '#6F9BE6';
  return `--banner-base:${base};` +
    `--banner-fill:linear-gradient(90deg,${colorWithAlpha(base, 0.8)} 0%,` +
    `${colorWithAlpha(mixWithWhite(base, 0.18), 0.68)} 40%,` +
    `${colorWithAlpha(mixWithWhite(base, 0.34), 0.58)} 100%);` +
    `--banner-edge:${colorWithAlpha(mixWithWhite(base, 0.18), 0.55)}`;
}

const TILE_COLORS = ['grey', 'green', 'blue', 'purple', 'orange'];

// A reward in its coloured tile with its picture and amount, as in the game.
export function drawnReward(reward: FortReward): string {
  const tile = TILE_COLORS.includes(reward.tile) ? reward.tile : 'none';
  const label = itemLabel(reward.itemId);
  return `<span class="reward-tile tile-${tile}" title="${escapeForPage(itemName(reward.itemId))}">` +
    `<img src="${escapeForPage(itemImageUrl(reward.itemId))}" alt="" loading="lazy">` +
    (label ? `<span class="tile-top">${escapeForPage(label)}</span>` : '') +
    `<span class="tile-qty">${escapeForPage(reward.quantity.toLocaleString('en-US'))}</span></span>`;
}

// The lookup the crediting rule needs: which alliance an academy belongs to.
function mainAllianceIdOf(allianceId: string): string | null {
  const alliance = allianceById(allianceId);
  return alliance ? alliance.mainAllianceId ?? alliance.id : null;
}

export interface FortressBoardOptions {
  season: number;
  phase: number;
  battleDay: number;
  // This phase's holders only.
  assignments: FortAssignment[];
}

const STEP_LEFT = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
  ' stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>';
const STEP_RIGHT = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
  ' stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>';

// In place, for state managers with the pencil on. Two ways are drawn so the owner can
// pick one: 'paint' puts the alliances above the cards as a palette, one is picked and
// every card tapped takes it; 'chips' opens the alliances on the tapped card itself.
// Who a reward counts for (the holder, the state, or another alliance) is picked the
// same way, as a second, smaller row of choices.
export interface InPlaceEditing {
  season: number;
  alliances: Alliance[];
  style: 'paint' | 'chips';
  // Paint: the choice picked in the palette, as "holder|<alliance id or empty>" or
  // "credit|<'' for the holder, 'shared', or an alliance id>".
  brush: string;
  // Chips: the card whose choices are open, as "<season>|<phase>|<fort>".
  openPlace: string;
}

// One choice, drawn as the alliance's own label so the choices look like the result.
function choiceChip(choice: string, label: string, alliance: Alliance | undefined, isOn: boolean, attribute: string): string {
  return `<button type="button" class="fort-choice${alliance ? ' held' : ''}${isOn ? ' on' : ''}" ${attribute}="${escapeForPage(choice)}"` +
    (alliance ? ` style="${bannerStyle(alliance)}"` : '') + `>${escapeForPage(label)}</button>`;
}

function choiceRows(editing: InPlaceEditing, attribute: string, isOn: (choice: string) => boolean): string {
  const sorted = editing.alliances.slice().sort((left, right) => left.sortOrder - right.sortOrder);
  const holders = sorted.map(alliance => choiceChip('holder|' + alliance.id, alliance.tag, alliance, isOn('holder|' + alliance.id), attribute)).join('') +
    choiceChip('holder|', '—', undefined, isOn('holder|'), attribute);
  // A reward counts for the holder unless it is given to someone else, so only the
  // others are offered; giving it to the same one again gives it back to the holder.
  const credits = choiceChip('credit|' + SHARED_WITH_STATE, 'state', undefined, isOn('credit|' + SHARED_WITH_STATE), attribute) +
    sorted.filter(alliance => !alliance.mainAllianceId)
      .map(alliance => choiceChip('credit|' + alliance.id, alliance.tag, undefined, isOn('credit|' + alliance.id), attribute)).join('');
  return `<div class="fort-choices">${holders}</div>` +
    `<div class="fort-choices credits"><span>Reward for</span>${credits}</div>`;
}

// The palette above the cards, for painting.
function paintPalette(editing: InPlaceEditing | null): string {
  if (!editing || editing.style !== 'paint') return '';
  return `<div class="fort-palette">${choiceRows(editing, 'data-fort-brush', choice => choice === editing.brush)}</div>`;
}

// A card or cell while planning: tapping it paints the picked choice on it, or opens
// its choices on it.
function editingAttributes(editing: InPlaceEditing | null, phase: number, fort: string): string {
  if (!editing) return '';
  return ` data-fort-tap="${escapeForPage(editing.season + '|' + phase + '|' + fort)}" role="button" tabindex="0"`;
}

function openChoices(editing: InPlaceEditing | null, phase: number, fort: string, one: FortAssignment | undefined): string {
  if (!editing || editing.style !== 'chips' || editing.openPlace !== editing.season + '|' + phase + '|' + fort) return '';
  return `<div class="fort-card-choices">${choiceRows(editing, 'data-fort-choose', choice =>
    choice === 'holder|' + (one?.allianceId ?? '') || (Boolean(one) && choice === 'credit|' + (one?.creditedTo ?? '')))}</div>`;
}

// The season and phase on screen in the middle, the arrows to the other phases at the
// edges. Board and Planning share it, so both stay on the same phase.
export function phaseHead(
  season: number, phase: number, battleDay: number, isPlayedPhase: boolean, pencil: string
): string {
  return '<div class="fort-board-head">' +
    `<button type="button" class="icon-button fort-step" data-fortress-step="-1" aria-label="Previous phase">${STEP_LEFT}</button>` +
    `<div class="fort-board-title${isPlayedPhase ? ' now' : ''}">` +
    `<strong>Season ${season} · Phase ${phase}${pencil}</strong>` +
    `<span>${escapeForPage(shortDayText(battleDay))}</span></div>` +
    `<button type="button" class="icon-button fort-step" data-fortress-step="1" aria-label="Next phase">${STEP_RIGHT}</button>` +
    '</div>';
}

// The phase being played, to look at, not to plan (planning is on Season):
// "Season N • Phase N" under the tabs, over every fortress, four to a line, and the
// strongholds on a line of their own. A building shows
// the game's name for the fort, its reward in its tile with the amount and the reward's
// name on two lines, and the alliance its reward counts for. Academies are not shown:
// a fort an academy holds counts for its main alliance.
export function fortressBoard(options: FortressBoardOptions): string {
  const held = new Map<string, FortAssignment>();
  for (const one of options.assignments) held.set(one.fort, one);

  // A building: its short name above ("Fort 1", "SH 1"), its reward in the game's own
  // tile, and the alliance that takes it under. The tile is drawn exactly as the game
  // draws it.
  const spot = (fort: string) => {
    const one = held.get(fort);
    const holder = one ? allianceById(one.allianceId) : undefined;
    const main = holder?.mainAllianceId ? allianceById(holder.mainAllianceId) ?? holder : holder;
    const reward = fortRewardOf(fort, options.phase, options.battleDay);
    const shortName = (isStronghold(fort) ? 'SH ' : 'Fort ') + fort.replace(/^\D+/, '');
    return `<article class="fort-spot${main ? ' held' : ''}"` +
      (reward ? ` title="${escapeForPage(itemName(reward.itemId))}"` : '') +
      (main ? ` style="${bannerStyle(main)}"` : '') + '>' +
      `<span class="fort-spot-name">${escapeForPage(shortName)}</span>` +
      (reward ? drawnReward(reward) : '') +
      `<span class="fort-spot-tag">${escapeForPage(main ? main.tag : '—')}</span>` +
      '</article>';
  };

  const forts = FORT_NAMES.filter(fort => !isStronghold(fort)).map(spot).join('');
  const strongholds = FORT_NAMES.filter(isStronghold).map(spot).join('');

  return '<section class="fort-board">' +
    `<h2 class="fort-phase-title">Season ${options.season} • Phase ${options.phase}</h2>` +
    '<hr class="fort-spots-line">' +
    `<div class="fort-spots">${forts}</div>` +
    '<hr class="fort-spots-line">' +
    `<div class="fort-spots strongholds">${strongholds}</div>` +
    '</section>';
}

export interface SeasonTableOptions {
  seasonNumber: number;
  seasonStart: number;
  // This season's holders only.
  assignments: FortAssignment[];
  // The phase being played, when it is in this season; marked so the eye lands on it.
  playedPhase: number | null;
  pencil: string;
  editing: InPlaceEditing | null;
}

// The whole season at once, laid out the way the sheet is: every fort down the side,
// every phase across the top, and in each cell the reward and the alliance it counts
// for. This is where a season is planned: with the pencil on, a state manager picks in
// each cell who takes that fort in that phase.
export function seasonTable(options: SeasonTableOptions): string {
  const held = new Map<string, FortAssignment>();
  for (const one of options.assignments) held.set(one.fort + '|' + one.phase, one);
  const phases = Array.from({ length: FORT_PHASES }, (_, index) => index + 1);
  const isNow = (phase: number) => phase === options.playedPhase;

  const headings = phases.map(phase =>
    `<th class="${isNow(phase) ? 'now' : ''}">Phase ${phase}` +
    `<br><span>${escapeForPage(shortDayText(battleDayOf(options.seasonStart, phase)))}</span></th>`).join('');

  const rows = FORT_NAMES.map(fort => {
    const cells = phases.map(phase => {
      const one = held.get(fort + '|' + phase);
      const holder = one ? allianceById(one.allianceId) : undefined;
      // Academies are not shown: a fort an academy holds counts for its main alliance.
      const main = holder?.mainAllianceId ? allianceById(holder.mainAllianceId) ?? holder : holder;
      const reward = fortRewardOf(fort, phase, battleDayOf(options.seasonStart, phase));
      const credited = one ? creditedAllianceId(one, mainAllianceIdOf) : '';
      const creditNote = one && main && credited !== main.id
        ? `<span class="fort-cell-credit">for ${escapeForPage(credited === SHARED_WITH_STATE
            ? 'the state' : allianceById(credited)?.tag ?? credited)}</span>`
        : '';
      return `<td class="${isNow(phase) ? 'now' : ''}">` +
        `<span class="fort-cell${main ? ' held' : ''}${options.editing ? ' editable' : ''}"` +
        editingAttributes(options.editing, phase, fort) +
        (main ? ` style="${bannerStyle(main)}"` : '') + '>' +
        (reward ? drawnReward(reward) : '') +
        `<span class="fort-cell-tag">${escapeForPage(main ? main.tag : '—')}</span>` + creditNote +
        (reward ? `<span class="fort-cell-reward">${escapeForPage(itemName(reward.itemId))}</span>` : '') +
        openChoices(options.editing, phase, fort, one) +
        '</span></td>';
    }).join('');
    return `<tr${isStronghold(fort) ? ' class="stronghold"' : ''}>` +
      `<td class="fort-name">${escapeForPage(fortFullName(fort))}</td>${cells}</tr>`;
  }).join('');

  const lastBattleDay = battleDayOf(options.seasonStart, FORT_PHASES);
  return '<section class="fort-board glass fort-season">' +
    '<div class="fort-board-head">' +
    `<button type="button" class="icon-button fort-step" data-fortress-step="-${FORT_PHASES}" aria-label="Previous season">${STEP_LEFT}</button>` +
    `<div class="fort-board-title${options.playedPhase ? ' now' : ''}">` +
    `<strong>Season ${options.seasonNumber}${options.pencil}</strong>` +
    `<span>${escapeForPage(shortDayText(options.seasonStart) + ' – ' + shortDayText(lastBattleDay))}</span></div>` +
    `<button type="button" class="icon-button fort-step" data-fortress-step="${FORT_PHASES}" aria-label="Next season">${STEP_RIGHT}</button>` +
    '</div>' + paintPalette(options.editing) +
    '<div class="fort-grid-wrap"><table class="fort-grid">' +
    `<thead><tr><th class="fort-column">Fort</th>${headings}</tr></thead>` +
    `<tbody>${rows}</tbody></table></div></section>`;
}

// How many of each reward item an alliance wins across the season. Academies count
// toward their main alliance.
interface MatrixRow {
  alliance: Alliance;
  counts: Map<string, number>;
}

interface Matrix {
  items: string[];
  // Each item as a fort pays it, for its tile and amount.
  rewards: Map<string, FortReward>;
  rows: MatrixRow[];
}

function buildMatrix(
  assignments: FortAssignment[],
  seasonStart: number,
  wantsStrongholds: boolean
): Matrix {
  const items: string[] = [];
  const rewards = new Map<string, FortReward>();
  const byAlliance = new Map<string, MatrixRow>();

  for (const one of assignments) {
    if (isStronghold(one.fort) !== wantsStrongholds) continue;
    if (!allianceById(one.allianceId)) continue;
    // The reward counts for whoever it is credited to, which is the holder's main
    // alliance unless the plan says otherwise. A shell credits it elsewhere, and a
    // shared fort gives it to the whole state.
    const creditedId = creditedAllianceId(one, mainAllianceIdOf);
    const credited = creditedId === SHARED_WITH_STATE
      ? { id: SHARED_WITH_STATE, name: 'Shared with the state', tag: 'State',
          mainAllianceId: null, baseColor: null, secondColor: null, sortOrder: 999 } as Alliance
      : allianceById(creditedId);
    if (!credited) continue;

    let row = byAlliance.get(credited.id);
    if (!row) {
      row = { alliance: credited, counts: new Map() };
      byAlliance.set(credited.id, row);
    }

    const reward = fortRewardOf(one.fort, one.phase, battleDayOf(seasonStart, one.phase));
    if (!reward) continue;
    if (!items.includes(reward.itemId)) items.push(reward.itemId);
    rewards.set(reward.itemId, reward);
    row.counts.set(reward.itemId, (row.counts.get(reward.itemId) ?? 0) + 1);
  }

  const rows = [...byAlliance.values()]
    .sort((left, right) => left.alliance.sortOrder - right.alliance.sortOrder);
  return { items, rewards, rows };
}

function matrixTable(title: string, what: string, built: Matrix): string {
  if (!built.rows.length) {
    return `<section class="admin-section glass"><h2>${escapeForPage(title)}</h2>` +
      `<span class="admin-item-meta">No ${what} are assigned for this season yet.</span></section>`;
  }

  // Each column is headed by the reward in its tile, with the amount one fort pays.
  const headings = built.items.map(itemId => {
    const reward = built.rewards.get(itemId);
    return `<th title="${escapeForPage(itemName(itemId))}">` +
      (reward ? drawnReward(reward) : '') +
      `<span class="reward-name">${escapeForPage(itemName(itemId))}</span></th>`;
  }).join('');

  const rows = built.rows.map(row => {
    const cells = built.items.map(itemId => {
      const count = row.counts.get(itemId) ?? 0;
      return `<td class="${count ? '' : 'zero'}">${count}</td>`;
    }).join('');
    return `<tr><td class="alliance-name">${escapeForPage(row.alliance.tag)}</td>` +
      `${cells}</tr>`;
  }).join('');

  return `<section class="admin-section glass"><h2>${escapeForPage(title)}</h2>` +
    '<div class="reward-matrix-wrap"><table class="reward-matrix">' +
    `<thead><tr><th class="alliance-column">Alliance</th>${headings}</tr></thead>` +
    `<tbody>${rows}</tbody></table></div></section>`;
}

export interface SeasonTotalsOptions {
  seasonNumber: number;
  seasonStart: number;
  assignments: FortAssignment[];
}

export function seasonTotals(options: SeasonTotalsOptions): string {
  const lastBattleDay = battleDayOf(options.seasonStart, FORT_PHASES);
  return '<section class="admin-section glass"><h2>Season rewards</h2>' +
    `<p class="admin-help">Season ${options.seasonNumber} · ` +
    `${escapeForPage(shortDayText(options.seasonStart) + ' – ' + shortDayText(lastBattleDay))}. ` +
    'How many of each reward every alliance wins across the season. ' +
    'An academy counts toward its main alliance, and a fort taken for somebody else ' +
    'counts for whoever it is credited to.</p></section>' +
    matrixTable('Fortress rewards', 'fortresses', buildMatrix(options.assignments, options.seasonStart, false)) +
    matrixTable('Stronghold rewards', 'strongholds', buildMatrix(options.assignments, options.seasonStart, true));
}
