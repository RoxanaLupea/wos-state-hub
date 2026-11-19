// Dates are counted as whole days since 1 January 1970, in UTC, the same way the old
// app did. A day number is easier to add to and compare than a date object, and it
// never drifts with daylight saving because UTC has none.

export const MINUTES_PER_DAY = 24 * 60;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

// '2026-11-19' -> the number of days since 1970. Not a date returns NaN.
export function dayFromText(text: string | null | undefined): number {
  if (!text) return NaN;
  const parsed = Date.parse(String(text).slice(0, 10) + 'T00:00:00Z');
  if (Number.isNaN(parsed)) return NaN;
  return Math.round(parsed / MILLISECONDS_PER_DAY);
}

export function textFromDay(day: number): string {
  return new Date(day * MILLISECONDS_PER_DAY).toISOString().slice(0, 10);
}

export function todayNumber(): number {
  return Math.floor(Date.now() / MILLISECONDS_PER_DAY);
}

// '14:30' -> 870. An empty or broken time is 0, which means the daily reset.
export function minutesFromTime(time: string | null | undefined): number {
  if (!time) return 0;
  const parts = String(time).split(':');
  const hours = Number(parts[0]);
  const minutes = Number(parts[1] ?? 0);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;
  return hours * 60 + minutes;
}

export function timeFromMinutes(minutes: number): string {
  const inDay = ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hours = Math.floor(inDay / 60);
  return String(hours).padStart(2, '0') + ':' + String(inDay % 60).padStart(2, '0');
}

// Which weekday a day falls on, Monday first: 0 is Monday, 6 is Sunday.
export function weekdayOf(day: number): number {
  return ((day + 3) % 7 + 7) % 7;
}

export function startOfWeek(day: number): number {
  return day - weekdayOf(day);
}

export function startOfMonth(year: number, month: number): number {
  return Math.round(Date.UTC(year, month, 1) / MILLISECONDS_PER_DAY);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

export function yearAndMonthOf(day: number): { year: number; month: number; dayOfMonth: number } {
  const date = new Date(day * MILLISECONDS_PER_DAY);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth(), dayOfMonth: date.getUTCDate() };
}
