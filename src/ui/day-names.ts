// The names of months and weekdays, and the ways a date is written on the page.
// Every page takes them from here so the same date never appears two different ways.
import { weekdayOf, yearAndMonthOf } from '../calendar/days.ts';

export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// The week starts on Monday, the way the game counts it.
export const WEEKDAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday',
  'Saturday', 'Sunday'];

// "Thursday, 19 Nov" — the heading above a day's details.
export function longDayText(day: number): string {
  const { month, dayOfMonth } = yearAndMonthOf(day);
  return WEEKDAY_NAMES[weekdayOf(day)] + ', ' + dayOfMonth + ' ' + MONTH_SHORT[month];
}

// "Thu 19 Nov" — a date written inside a line of text.
export function shortDayText(day: number): string {
  const { month, dayOfMonth } = yearAndMonthOf(day);
  return WEEKDAY_SHORT[weekdayOf(day)] + ' ' + dayOfMonth + ' ' + MONTH_SHORT[month];
}
