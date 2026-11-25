// One week of the calendar: the seven day boxes, and the bars laid over them.
// The month view and the week view both draw their weeks with this, so a week looks
// the same whichever view it is seen in.
import { textFromDay, todayNumber } from '../calendar/days.ts';
import { weekPieces, type WeekPieceOptions } from '../calendar/week-bars.ts';
import { longDayText, WEEKDAY_NAMES, WEEKDAY_SHORT } from './day-names.ts';
import { escapeForPage } from './escape.ts';
import { renderBar, type BarRenderOptions } from './bar.ts';
import { yearAndMonthOf } from '../calendar/days.ts';
import type { Bar } from '../calendar/bars.ts';

// The days' names over the columns, in capitals: MON, TUE... on a phone, the full name on
// a computer (24 Nov). They sit above the weeks' own box, so only the weeks scroll.
export function weekdayNamesRow(): string {
  return '<div class="grid7 weekday-names">' + WEEKDAY_SHORT.map((name, index) =>
    `<div class="weekday-name${index > 4 ? ' weekend' : ''}">${name}` +
    `<span class="desktop-only-text">${WEEKDAY_NAMES[index].slice(name.length)}</span></div>`).join('') + '</div>';
}

// The dates held under the day names while the month scrolls (owner, 25 Nov): once a
// week's dates have scrolled up to the day names, that week's numbers stay there, and only
// the numbers change when the next week reaches them. Filled in by holdDayNames in main.ts.
export function heldDatesRow(): string {
  let cells = '';
  for (let column = 0; column < 7; column++) {
    cells += `<button type="button" class="held-date${column > 4 ? ' weekend' : ''}" tabindex="-1">` +
      '<span class="day-number"></span></button>';
  }
  return `<div class="grid7 held-dates" aria-hidden="true">${cells}</div>`;
}

export interface WeekRowOptions {
  pieceOptions: WeekPieceOptions;
  barOptions: Omit<BarRenderOptions, 'weekStart'>;
  chosenDay: number | null;
  // Set in the month view, so days either side of the month are dimmed.
  firstOfMonth?: number;
  lastOfMonth?: number;
  // True while an event is open, so no day box looks chosen.
  hasOpenEvent?: boolean;
}

export function weekRow(weekStart: number, bars: Bar[], options: WeekRowOptions): string {
  const today = todayNumber();

  let boxes = '';
  for (let column = 0; column < 7; column++) {
    const day = weekStart + column;
    const classes = ['day-box'];
    if (column > 4) classes.push('weekend');
    if (options.firstOfMonth !== undefined && options.lastOfMonth !== undefined &&
      (day < options.firstOfMonth || day > options.lastOfMonth)) classes.push('other-month');
    if (day === today) classes.push('today');
    if (day === options.chosenDay && !options.hasOpenEvent) classes.push('chosen');
    boxes += `<button type="button" class="${classes.join(' ')}" data-day="${textFromDay(day)}"` +
      ` aria-label="${escapeForPage(longDayText(day))}"${day === today ? ' aria-current="date"' : ''}>` +
      `<span class="day-number">${yearAndMonthOf(day).dayOfMonth}</span></button>`;
  }

  const pieces = weekPieces(bars, weekStart, options.pieceOptions);
  const barMarkup = pieces
    .map(piece => renderBar(piece, { ...options.barOptions, weekStart }))
    .join('');

  return `<div class="week-row"><div class="grid7 day-boxes">${boxes}</div>` +
    `<div class="grid7 bars" data-week-start="${weekStart}">${barMarkup}</div></div>`;
}
