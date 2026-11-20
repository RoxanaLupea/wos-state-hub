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

const TARGET = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none"' +
  ' stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">' +
  '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>';


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

function dateBlock(
  date: string, groups: TransferGroup[], follows: TransferFollows, options: PredictionsOptions
): string {
  const everyGroup = bigGroupsOf(groups);
  const watched = options.watchedState === null
    ? undefined : groupOfState(everyGroup, options.watchedState);

  // Either every group of that date, or only the one the watched state is in. A
  // state the game publishes no range for on that date gets an empty column that
  // says so, rather than quietly falling back to the whole list.
  const isWatching = options.scope !== 'all' && options.watchedState !== null;
  const big = isWatching ? (watched ? [watched] : []) : everyGroup;
  const ours = watched;

  // Every published range keeps its own row. They are small units that never get
  // split up in a transfer, and rolling them into their big group would hide the
  // patterns that run down the column. The big group shows as the shading instead.
  const rows = big.map((one, index) => {
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
      return `<div class="${classes.join(' ')}">` +
        rangeCells(part.fromState, part.toState) +
        `<span class="range-fc" title="${escapeForPage(furnaceCapText(part.furnaceCapUpgrades))}">` +
        `${escapeForPage(shortFurnaceCapText(part.furnaceCapUpgrades))}</span>` +
        `<span class="range-gen">${escapeForPage(generationText(part.generation))}</span></div>`;
    }).join('');
  }).join('');

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

// A switch between two ways of looking at the same list.
function viewSwitch(name: string, label: string, isOn: boolean): string {
  return `<button type="button" role="switch" aria-checked="${isOn}" class="filter-switch"` +
    ` data-prediction-filter="${escapeForPage(name + '|toggle')}">` +
    '<span class="switch-track"><span class="switch-knob"></span></span>' +
    `${escapeForPage(label)}</button>`;
}

// The page's own controls, which sit in the page head under the list of pages.
export function predictionsControls(options: PredictionsOptions): string {
  const follows = '<div class="prediction-control">' +
    checkBox('svs', 'svs-battle', 'SvS', options.showsSvs) +
    checkBox('sunfire', 'sunfire', 'Sunfire', options.showsSunfire) + '</div>';

  const scope = viewSwitch('scope', 'Only my group', options.scope === 'mine');

  const rows = viewSwitch('rows', 'Subgroups', !options.mergesGroups);

  // One control takes you back to the transfer that is next, named by its date.
  const backToNext = options.nextDate
    ? '<button type="button" class="prediction-back" data-prediction-back>' +
      `${TARGET}${escapeForPage(dayMonthYearText(dayFromText(options.nextDate)))}</button>`
    : '';

  return '<div class="predictions-head">' + follows + scope + rows + backToNext + '</div>';
}

export function predictionsPage(options: PredictionsOptions): string {
  // Said once, not in every column: the state is nowhere in the published lists.
  const isWatching = options.scope !== 'all' && options.watchedState !== null;
  const showsSomething = options.dates.some(one =>
    !isWatching || groupOfState(bigGroupsOf(one.groups), options.watchedState as number));
  if (options.dates.length && !showsSomething) {
    return '<div class="predictions-page">' +
      '<section class="admin-section glass"><p class="predictions-empty">' +
      `State ${options.watchedState} is not in any published range.</p></section></div>`;
  }

  if (!options.dates.length) {
    return '<div class="predictions-page">' +
      '<section class="admin-section glass"><p class="predictions-empty">' +
      'No transfers of that kind in this stretch.</p></section></div>';
  }

  return '<div class="predictions-page"><div class="prediction-dates">' +
    options.dates.map(one => dateBlock(one.date, one.groups, one.follows, options)).join('') +
    '</div></div>';
}