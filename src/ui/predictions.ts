// The transfer predictions, laid out the way the sheet is: one column per transfer
// date, side by side, so a group can be followed from one date to the next.
import './predictions.css';
import './pages.css';
import {
  bigGroupsOf, furnaceCapText, shortFurnaceCapText, generationText, groupOfState,
  type TransferFollows, type TransferGroup
} from '../data/transfer-rules.ts';
import { dayFromText } from '../calendar/days.ts';
import { dayMonthYearText } from './day-names.ts';
import { escapeForPage } from './escape.ts';
import { eventIcon } from './event-icon.ts';

export interface PredictionsOptions {
  // The dates on screen, in order, each with its own groups.
  dates: { date: string; groups: TransferGroup[]; follows: TransferFollows }[];
  // 'all' for every group, 'mine' for our own state's.
  scope: string;
  // What is typed in the state box, kept as written so it can be half-typed.
  // The state whose group is being followed, worked out from the scope.
  watchedState: number | null;
  ourState: number;
  // 'svs', 'sunfire' or '' for both.
  // Which battles' transfers are listed. At least one is always on.
  showsSvs: boolean;
  showsSunfire: boolean;
  // True to show each group as one row instead of its subgroups.
  mergesGroups: boolean;
  // Whether there are earlier or later dates than the ones on screen.
  hasEarlier: boolean;
  hasLater: boolean;
  // The date of the transfer that is next, which the strip opens on.
  nextDate: string;
}

const TICK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
  ' stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M5 13l5 5L19 7"/></svg>';


// A range is written in three parts, not one: the first state against the dash from
// the right, the dash, and the last state away from it to the left. Every dash in a
// column then sits in the same place, however many digits the numbers have.
function rangeCells(from: number, to: number): string {
  if (from === to) {
    return `<span class="range-from">${from}</span><span class="range-dash"></span>` +
      '<span class="range-to"></span>';
  }
  return `<span class="range-from">${from}</span><span class="range-dash">–</span>` +
    `<span class="range-to">${to}</span>`;
}

// With Ours chosen: the states our group covers on any of the dates, from the highest
// range to the lowest. Each date shows those and nothing more (Roxanne, 24 Nov).
interface OursSpan { fromState: number; toState: number; }

function oursSpanOf(options: PredictionsOptions): OursSpan | null {
  if (options.scope === 'all' || options.watchedState === null) return null;
  let span: OursSpan | null = null;
  for (const one of options.dates) {
    const group = groupOfState(bigGroupsOf(one.groups), options.watchedState);
    if (!group) continue;
    span = span ? { fromState: Math.min(span.fromState, group.fromState), toState: Math.max(span.toState, group.toState) }
      : { fromState: group.fromState, toState: group.toState };
  }
  return span;
}

function dateBlock(
  date: string, groups: TransferGroup[], follows: TransferFollows, options: PredictionsOptions, span: OursSpan | null
): string {
  const everyGroup = bigGroupsOf(groups);
  const watched = options.watchedState === null
    ? undefined : groupOfState(everyGroup, options.watchedState);

  // With Ours chosen, the date shows the states our group covers on any date; the lines
  // outside its own group are faint (Roxanne, 24 Nov).
  const isWatching = span !== null;
  const big = everyGroup;
  const ours = watched;

  // Every published range keeps its own row. They are small units that never get
  // split up in a transfer, and rolling them into their big group would hide the
  // patterns that run down the column. The big group shows as the shading instead.
  const rowList = big.map((one, index) => {
    const isOurs = one === ours;
    const isShaded = index % 2 === 1;
    // Subgroups keep their own rows unless the group is asked for as one line.
    const parts = options.mergesGroups
      ? [{ fromState: one.fromState, toState: one.toState,
           furnaceCapUpgrades: one.furnaceCapUpgrades, generation: one.generation }]
      : one.parts;
    return parts.map((part, partIndex) => {
      // Three weights of emphasis: the rest of the list, the group this state is in,
      // and inside it the one range the state actually sits in.
      const holdsUs = options.watchedState !== null &&
        options.watchedState >= part.fromState && options.watchedState <= part.toState;
      const classes = ['group-row'];
      if (partIndex === 0) classes.push('starts');
      if (holdsUs) classes.push('is-us');
      else if (isOurs) classes.push('ours');
      else if (isShaded) classes.push('shaded');
      if (isWatching && !isOurs) classes.push('faint');
      const html = `<div class="${classes.join(' ')}">` +
        rangeCells(part.fromState, part.toState) +
        `<span class="range-fc" title="${escapeForPage(furnaceCapText(part.furnaceCapUpgrades))}">` +
        `${escapeForPage(shortFurnaceCapText(part.furnaceCapUpgrades))}</span>` +
        `<span class="range-gen">${escapeForPage(generationText(part.generation))}</span></div>`;
      return { fromState: part.fromState, toState: part.toState, html };
    });
  }).flat();
  let shownRows = rowList;
  if (span) {
    const first = rowList.findIndex(row => row.toState >= span.fromState);
    let last = -1;
    rowList.forEach((row, index) => { if (row.fromState <= span.toState) last = index; });
    shownRows = first < 0 || last < 0 ? [] : rowList.slice(first, last + 1);
  }
  const rows = shownRows.map(row => row.html).join('');

  // The event the transfer follows is shown as its own logo rather than written out.
  const followedBy = follows === 'sunfire' ? 'sunfire' : follows === 'svs' ? 'svs-battle' : '';

  // The transfer that is next carries the event's colour around its whole column.
  const isNext = date === options.nextDate;

  return `<div class="date-block${isNext ? ' is-next' : ''}"` +
    `${isNext ? ' data-next-transfer' : ''}><div class="date-block-top">` +
    '<div class="date-block-head">' +
    (followedBy ? `<span class="date-block-follows">${eventIcon(followedBy)}</span>` : '') +
    `<span>${escapeForPage(dayMonthYearText(dayFromText(date)))}</span></div>` +
    '<div class="date-block-labels"><span class="range-head">Groups</span>' +
    '<span class="range-fc">FC</span><span class="range-gen">Gen</span></div></div>' +
    '<div class="date-block-scroll"><div class="date-block-rows">' +
    rows +
    '</div></div></div>';
}

// One named control: a label, then the choices joined as a single switch, the same
// shape the clock and the calendar views use.
// A box you tick. Several can be on at once, so it is not a choice between them.
function checkBox(value: string, eventTypeId: string, label: string, isOn: boolean): string {
  return `<button type="button" role="checkbox" aria-checked="${isOn}" class="filter-check"` +
    ` data-prediction-filter="${escapeForPage('follows|' + value)}">` +
    `<span class="check-box">${TICK}</span>` +
    `<span class="check-icon">${eventIcon(eventTypeId)}</span>` +
    `${escapeForPage(label)}</button>`;
}

// Two ways of looking at the same list, side by side; tapping the other one switches.
function choicePair(name: string, label: string, words: [string, string], isFirst: boolean): string {
  const button = (word: string, isOn: boolean) =>
    `<button type="button" aria-pressed="${isOn}"` +
    (isOn ? '' : ` data-prediction-filter="${escapeForPage(name + '|toggle')}"`) + `>${escapeForPage(word)}</button>`;
  return `<div class="segmented time-switch prediction-pair" role="group" aria-label="${escapeForPage(label)}">` +
    button(words[0], isFirst) + button(words[1], !isFirst) + '</div>';
}


// The page's own controls, which sit in the page head under the list of pages.
export function predictionsControls(options: PredictionsOptions): string {
  const follows = '<div class="prediction-control">' +
    checkBox('svs', 'svs-battle', 'SvS', options.showsSvs) +
    checkBox('sunfire', 'sunfire', 'Sunfire', options.showsSunfire) + '</div>';

  // Two choices each, the chosen one lit, as UTC | Mine is on the calendar: every
  // state, or only the group 1458 is in; and every range on its own row, or each group
  // as one row, a group being the ranges that share a furnace cap and a generation.
  const scope = choicePair('scope', 'Which states', ['All', 'Ours'], options.scope === 'all');
  const rows = choicePair('rows', 'How groups show', ['Ranges', 'Groups'], !options.mergesGroups);

  return '<div class="predictions-head">' + follows +
    `<div class="prediction-views">${scope}${rows}</div></div>`;
}

// "22 Nov", for the way back to the next transfer.
function shortDateText(date: string): string {
  return dayMonthYearText(dayFromText(date)).replace(/\s\d{4}$/, '');
}

export function predictionsPage(options: PredictionsOptions): string {
  // Said once, not in every column: the state is nowhere in the published lists.
  const isWatching = options.scope !== 'all' && options.watchedState !== null;
  const showsSomething = options.dates.some(one =>
    !isWatching || groupOfState(bigGroupsOf(one.groups), options.watchedState as number));
  if (options.dates.length && !showsSomething) {
    return '<div class="predictions-page">' +
      '<section class="admin-section"><p class="predictions-empty">' +
      `State ${options.watchedState} is not in any published range.</p></section></div>`;
  }

  if (!options.dates.length) {
    return '<div class="predictions-page">' +
      '<section class="admin-section"><p class="predictions-empty">' +
      'No transfers of that kind in this stretch.</p></section></div>';
  }

  // The way back to the next transfer shows only once it is out of sight, on the edge
  // it went off, named by its date (layout-predictions.ts shows and places it).
  const backToNext = options.nextDate
    ? '<button type="button" class="next-transfer-tab" data-prediction-back hidden>' +
      `<span class="tab-arrow" aria-hidden="true"></span>${escapeForPage(shortDateText(options.nextDate))}</button>`
    : '';
  // The way back to our own range, named by the state, shown once it is scrolled out
  // of sight above or below.
  const backToGroup = options.watchedState !== null
    ? '<button type="button" class="next-transfer-tab to-group" data-prediction-group hidden>' +
      `<span class="tab-arrow" aria-hidden="true"></span>${escapeForPage(String(options.watchedState))}</button>`
    : '';
  const span = oursSpanOf(options);
  return '<div class="predictions-page"><div class="prediction-dates"><div class="prediction-sheet">' +
    options.dates.map(one => dateBlock(one.date, one.groups, one.follows, options, span)).join('') +
    '</div></div>' + backToNext + backToGroup + '</div>';
}