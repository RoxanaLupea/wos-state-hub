// One week on its own: the same weekday names and the same week row as the month,
// with nothing dimmed, because every day shown belongs to the week.
import './calendar.css';
import { weekRow, weekdayNamesRow, type WeekRowOptions } from './week-row.ts';
import { MONTH_SHORT } from './day-names.ts';
import { yearAndMonthOf } from '../calendar/days.ts';
import type { Bar } from '../calendar/bars.ts';

export function weekView(weekStart: number, bars: Bar[], options: WeekRowOptions): string {
  return weekdayNamesRow() + `<div class="weeks">${weekRow(weekStart, bars, options)}</div>`;
}

// "2 – 8 Nov 2026", or "30 Nov – 6 Dec 2026" when the week crosses a month.
export function weekTitle(weekStart: number): string {
  const first = yearAndMonthOf(weekStart);
  const last = yearAndMonthOf(weekStart + 6);
  const firstPart = first.month === last.month
    ? String(first.dayOfMonth)
    : first.dayOfMonth + ' ' + MONTH_SHORT[first.month];
  return `${firstPart} – ${last.dayOfMonth} ${MONTH_SHORT[last.month]} ${last.year}`;
}
