// The fortress board and its reward matrices, laid out the way the sheet is: every
// fort down the side, every phase across the top, and the alliance holding it in each
// cell. The rewards are two matrices, alliances down and reward items across.
import './fortress.css';
import './pages.css';
import { fortRewardOf, itemLabel, itemName } from '../data/catalog.ts';
import { allianceById } from '../data/alliances.ts';
import {
  FORT_NAMES, FORT_PHASES, SHARED_WITH_STATE, battleDayOf, creditedAllianceId,
  fortFullName, isStronghold
} from '../calendar/fort-season.ts';
import { shortDayText } from './day-names.ts';
import { escapeForPage } from './escape.ts';
import { imageUrl } from './event-icon.ts';
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

function bannerStyle(alliance: Alliance): string {
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

// A fort's reward for one phase, drawn as the game draws it.
function rewardTile(fort: string, phase: number): string {
  const reward = fortRewardOf(fort, phase);
  if (!reward) return '';
  const tile = TILE_COLORS.includes(reward.tile) ? reward.tile : 'none';
  const label = itemLabel(reward.itemId);
  return `<span class="reward-tile tile-${tile}" title="${escapeForPage(itemName(reward.itemId))}">` +
    `<img src="${escapeForPage(imageUrl('items/' + reward.itemId))}" alt="" loading="lazy">` +
    (label ? `<span class="tile-top">${escapeForPage(label)}</span>` : '') +
    `<span class="tile-qty">${escapeForPage(reward.quantity.toLocaleString('en-US'))}</span></span>`;
}

// The lookup the crediting rule needs: which alliance an academy belongs to.
function mainAllianceIdOf(allianceId: string): string | null {
  const alliance = allianceById(allianceId);
  return alliance ? alliance.mainAllianceId ?? alliance.id : null;
}

export interface FortressBoardOptions {
  seasonNumber: number;
  seasonStart: number;
  assignments: FortAssignment[];
  // The phase being played now.
  playedPhase: number;
}

export function fortressBoard(options: FortressBoardOptions): string {
  const held = new Map<string, FortAssignment>();
  for (const one of options.assignments) held.set(one.fort + '|' + one.phase, one);

  const phases = Array.from({ length: FORT_PHASES }, (_, index) => index + 1);

  const headings = phases.map(phase =>
    `<th class="${phase === options.playedPhase ? 'now' : ''}">Phase ${phase}` +
    `<br><span>${escapeForPage(shortDayText(battleDayOf(options.seasonStart, phase)))}</span></th>`).join('');

  const rows = FORT_NAMES.map(fort => {
    const cells = phases.map(phase => {
      const one = held.get(fort + '|' + phase);
      const alliance = one ? allianceById(one.allianceId) : undefined;
      const reward = fortRewardOf(fort, phase);
      // Where the reward goes to someone other than the holder's own family, the
      // cell says so, because that is the whole reason the field exists.
      const credited = one ? creditedAllianceId(one, mainAllianceIdOf) : '';
      const ownFamily = alliance ? alliance.mainAllianceId ?? alliance.id : '';
      const creditNote = one && credited !== ownFamily
        ? `<span class="fort-cell-credit">${escapeForPage(credited === SHARED_WITH_STATE
            ? 'state' : allianceById(credited)?.tag ?? credited)}</span>`
        : '';

      return `<td class="${phase === options.playedPhase ? 'now' : ''}">` +
        `<span class="fort-cell${alliance ? ' held' : ''}"` +
        (alliance ? ` style="${bannerStyle(alliance)}"` : '') + '>' +
        rewardTile(fort, phase) +
        `<span class="fort-cell-tag">${escapeForPage(alliance ? alliance.tag : '—')}</span>` +
        creditNote +
        (reward ? `<span class="fort-cell-reward">${escapeForPage(itemName(reward.itemId))}</span>` : '') +
        '</span></td>';
    }).join('');
    return `<tr${isStronghold(fort) ? ' class="stronghold"' : ''}>` +
      `<td class="fort-name">${escapeForPage(fortFullName(fort))}</td>${cells}</tr>`;
  }).join('');

  const lastBattleDay = battleDayOf(options.seasonStart, FORT_PHASES);

  return '<section class="admin-section glass">' +
    `<h2>Season ${options.seasonNumber}</h2>` +
    `<p class="admin-help">${escapeForPage(shortDayText(options.seasonStart) + ' – ' + shortDayText(lastBattleDay))}. ` +
    `Phase ${options.playedPhase} is the one being played.</p>` +
    '<div class="fort-grid-wrap"><table class="fort-grid">' +
    `<thead><tr><th class="fort-column">Fort</th>${headings}</tr></thead>` +
    `<tbody>${rows}</tbody></table></div></section>`;
}

// How many of each reward item an alliance wins across the season. Academies count
// toward their main alliance.
interface MatrixRow {
  alliance: Alliance;
  counts: Map<string, number>;
  total: number;
}

function buildMatrix(
  assignments: FortAssignment[],
  wantsStrongholds: boolean
): { items: string[]; rows: MatrixRow[] } {
  const items: string[] = [];
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
      row = { alliance: credited, counts: new Map(), total: 0 };
      byAlliance.set(credited.id, row);
    }
    row.total += 1;

    const reward = fortRewardOf(one.fort, one.phase);
    if (!reward) continue;
    if (!items.includes(reward.itemId)) items.push(reward.itemId);
    row.counts.set(reward.itemId, (row.counts.get(reward.itemId) ?? 0) + 1);
  }

  const rows = [...byAlliance.values()]
    .sort((left, right) => left.alliance.sortOrder - right.alliance.sortOrder);
  return { items, rows };
}

function matrixTable(title: string, what: string, built: { items: string[]; rows: MatrixRow[] }): string {
  if (!built.rows.length) {
    return `<section class="admin-section glass"><h2>${escapeForPage(title)}</h2>` +
      `<span class="admin-item-meta">No ${what} are assigned for this season yet.</span></section>`;
  }

  const headings = built.items.map(itemId =>
    `<th><img class="matrix-icon" src="${escapeForPage(imageUrl('items/' + itemId))}" alt="" loading="lazy">` +
    `<span>${escapeForPage(itemName(itemId))}</span></th>`).join('');

  const rows = built.rows.map(row => {
    const cells = built.items.map(itemId => {
      const count = row.counts.get(itemId) ?? 0;
      return `<td class="${count ? '' : 'zero'}">${count}</td>`;
    }).join('');
    return `<tr><td class="alliance-name">${escapeForPage(row.alliance.tag)}</td>` +
      `${cells}<td class="total">${row.total}</td></tr>`;
  }).join('');

  return `<section class="admin-section glass"><h2>${escapeForPage(title)}</h2>` +
    '<div class="reward-matrix-wrap"><table class="reward-matrix">' +
    `<thead><tr><th class="alliance-column">Alliance</th>${headings}` +
    `<th><span>${escapeForPage(what)}</span></th></tr></thead>` +
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
    matrixTable('Fortress rewards', 'fortresses', buildMatrix(options.assignments, false)) +
    matrixTable('Stronghold rewards', 'strongholds', buildMatrix(options.assignments, true));
}
