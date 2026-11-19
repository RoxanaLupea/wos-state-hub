// The month: a row of weekday names, then one row per week.
import './calendar.css';
import { daysInMonth, startOfMonth, startOfWeek } from '../calendar/days.ts';
import { weekRow, weekdayNamesRow, type WeekRowOptions } from './week-row.ts';
import { MONTH_NAMES } from './day-names.ts';
import type { Bar } from '../calendar/bars.ts';

export function monthView(
  year: number, month: number, bars: Bar[], options: WeekRowOptions
): string {
  const firstOfMonth = startOfMonth(year, month);
  const lastOfMonth = firstOfMonth + daysInMonth(year, month) - 1;
  const gridStart = startOfWeek(firstOfMonth);
  const gridEnd = startOfWeek(lastOfMonth) + 6;

  let weeks = '';
  for (let weekStart = gridStart; weekStart <= gridEnd; weekStart += 7) {
    weeks += weekRow(weekStart, bars, { ...options, firstOfMonth, lastOfMonth });
  }
  return weekdayNamesRow() + weeks;
}

// The first and last day a month's grid needs, including the days either side that
// fill its first and last rows.
export function monthGridRange(year: number, month: number): { from: number; to: number } {
  const firstOfMonth = startOfMonth(year, month);
  const lastOfMonth = firstOfMonth + daysInMonth(year, month) - 1;
  return { from: startOfWeek(firstOfMonth), to: startOfWeek(lastOfMonth) + 6 };
}

export function monthTitle(year: number, month: number): string {
  return MONTH_NAMES[month] + ' ' + year;
}
