// One SvS's result, drawn like the game's own screens: the two states with the castle
// on the side where the battle was fought, the Preparation points day by day, the
// Battle's Occupation Ranking, and the State of Power result with its president.
// Our side is always blue and theirs always red, whichever alliance it was.
// A part that is not recorded is simply not shown.
import './svs-results.css';
import { escapeForPage } from './escape.ts';
import { imageUrl } from './event-icon.ts';

export type Outcome = 'win' | 'loss' | 'draw' | '';
export type Side = 'ours' | 'theirs';

export interface SvsHold {
  side: Side;
  // The alliance's tag, as the game shows it.
  tag: string;
  seconds: number;
}

export interface SvsRun {
  opponentState: number | null;
  result: Outcome;
  preparation: Outcome;
  battle: Outcome;
  // Each state's total, then its points for each of the 5 preparation days.
  points: { ours: number; theirs: number; days: [number, number][] } | null;
  // The Occupation Ranking, longest hold first.
  holds: SvsHold[];
  president: { tag: string; name: string } | null;
}

// Which part of the SvS the panel is open on. Preparation and Battle show only their
// own part; the rest of the SvS shows all of it.
export type SvsPart = 'whole' | 'preparation' | 'battle';

export interface SvsResultOptions {
  run: SvsRun;
  part: SvsPart;
  ourState: number;
  // The game's name for a preparation day ("City Construction").
  dayNameOf: (dayNumber: number) => string;
}

const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

// The way from one SvS to the whole history on the State page.
export function historyLink(): string {
  return '<button type="button" class="history-link" data-page="state" data-scroll-to="svs-history">' +
    `Check history${ARROW}</button>`;
}

export function svsResult(options: SvsResultOptions): string {
  const { run, part } = options;
  const parts = [statesHead(options)];
  if (part !== 'battle') parts.push(preparationPart(options));
  if (part !== 'preparation') parts.push(battlePart(run));
  if (part === 'whole') parts.push(stateOfPowerPart(run));
  return '<div class="svs-result">' + parts.join('') + historyLink() + '</div>';
}

// Points as the game's big numbers read at a glance: 11.03B, 645.9M.
function shortPoints(value: number): string {
  if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B';
  if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M';
  return value.toLocaleString('en-US');
}

function outcomeWord(outcome: Outcome): string {
  return outcome === 'win' ? 'Win' : outcome === 'loss' ? 'Loss' : outcome === 'draw' ? 'Draw' : '';
}

function partTitle(name: string, outcome: Outcome): string {
  return `<h3 class="part-title">${escapeForPage(name)}<b>${outcomeWord(outcome)}</b></h3>`;
}

// The battle is fought in the state that lost Preparation.
function battleFoughtIn(run: SvsRun): Side | '' {
  if (run.preparation === 'win') return 'theirs';
  if (run.preparation === 'loss') return 'ours';
  return '';
}

// The two states, ours on the left and theirs on the right, with the castle logo on the
// inside of the state where the battle was fought.
function statesHead(options: SvsResultOptions): string {
  const { run } = options;
  if (!run.opponentState) return '';
  const castle = `<img class="svs-castle" src="${imageUrl('castle-battle')}" alt="">`;
  const foughtIn = battleFoughtIn(run);
  return '<div class="svs-states">' +
    `<span class="svs-state ours">#${options.ourState}${foughtIn === 'ours' ? castle : ''}</span>` +
    '<span class="svs-vs">VS</span>' +
    `<span class="svs-state theirs">${foughtIn === 'theirs' ? castle : ''}#${run.opponentState}</span>` +
    '</div>';
}

// One bar shared by the two sides, split by their shares, with a light line where they meet.
function splitBar(ours: number, theirs: number, isTotal: boolean): string {
  const share = ours + theirs > 0 ? (100 * ours) / (ours + theirs) : 50;
  return `<div class="svs-split${isTotal ? ' total' : ''}" style="--share:${share.toFixed(1)}"></div>`;
}

function preparationPart(options: SvsResultOptions): string {
  const { run } = options;
  if (!run.preparation && !run.points) return '';
  let body = '';
  if (run.points) {
    const { ours, theirs, days } = run.points;
    body += '<div class="svs-totals">' +
      `<strong>${shortPoints(ours)}</strong><strong>${shortPoints(theirs)}</strong></div>` +
      splitBar(ours, theirs, true);
    // The side that led the day is written in white.
    body += '<div class="svs-days">' + days.map(([ourDay, theirDay], index) =>
      '<div class="svs-day"><div class="svs-day-values">' +
        `<span class="${ourDay >= theirDay ? 'led' : ''}">${shortPoints(ourDay)}</span>` +
        `<span class="svs-day-name">${escapeForPage(options.dayNameOf(index + 1))}</span>` +
        `<span class="${theirDay > ourDay ? 'led' : ''}">${shortPoints(theirDay)}</span>` +
      '</div>' + splitBar(ourDay, theirDay, false) + '</div>').join('') + '</div>';
  }
  return '<section class="svs-part preparation">' + partTitle('Preparation', run.preparation) + body + '</section>';
}

function holdTime(seconds: number): string {
  const two = (value: number) => String(value).padStart(2, '0');
  return `${two(Math.floor(seconds / 3600))}:${two(Math.floor((seconds % 3600) / 60))}:${two(seconds % 60)}`;
}

// The game's Occupation Ranking: who held the castle and for how long.
function battlePart(run: SvsRun): string {
  if (!run.battle && !run.holds.length) return '';
  const longest = Math.max(1, ...run.holds.map(hold => hold.seconds));
  const rows = run.holds.map((hold, index) =>
    `<div class="svs-hold ${hold.side}${index === 0 ? ' first' : ''}">` +
      `<span class="svs-rank">${index + 1}</span>` +
      `<span class="fort-spot-tag svs-pill ${hold.side}">${escapeForPage(hold.tag)}</span>` +
      `<span class="svs-track"><i style="--share:${((100 * hold.seconds) / longest).toFixed(1)}"></i></span>` +
      `<time>${holdTime(hold.seconds)}</time>` +
    '</div>').join('');
  return '<section class="svs-part battle">' + partTitle('Battle', run.battle) +
    (rows ? `<div class="svs-holds">${rows}</div>` : '') + '</section>';
}

// The president is always known from our castle records: when we win both parts ours
// becomes Supreme President; when they win both, their invader does; otherwise we keep
// our own President.
function stateOfPowerPart(run: SvsRun): string {
  if (!run.result && !run.president) return '';
  let president = '';
  if (run.president) {
    const isSupreme = !!run.preparation && run.preparation === run.battle;
    const side: Side = run.preparation === 'loss' && run.battle === 'loss' ? 'theirs' : 'ours';
    const title = isSupreme ? 'Supreme President' : 'President';
    president = '<div class="svs-president">' +
      `<img src="${imageUrl(isSupreme ? 'supreme-president' : 'president')}" alt="${title}" title="${title}">` +
      `<span class="${side}">[${escapeForPage(run.president.tag)}]${escapeForPage(run.president.name)}</span></div>`;
  }
  return '<section class="svs-part state-of-power">' + partTitle('State of Power', run.result) + president + '</section>';
}
