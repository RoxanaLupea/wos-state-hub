// Writing a stretch of time the way the app says it everywhere: "Sat 7 Nov",
// "Mon 2 – Sat 7 Nov", "Fri 30 Oct 10:00 – Fri 6 Nov 22:00".
import { MINUTES_PER_DAY } from './days.ts';
import { clockText, shownMinute } from './time-mode.ts';
import { MONTH_SHORT, WEEKDAY_SHORT } from '../ui/day-names.ts';
import { weekdayOf, yearAndMonthOf } from './days.ts';

export interface SpanParts {
  firstDay: number;
  lastDay: number;
  // Empty when the stretch starts or ends at midnight, where no time is worth saying.
  startTime: string;
  endTime: string;
}

export function spanParts(startMinute: number, endMinute: number): SpanParts {
  const start = shownMinute(startMinute);
  const end = shownMinute(endMinute);
  const endsAtMidnight = end % MINUTES_PER_DAY === 0;
  return {
    firstDay: Math.floor(start / MINUTES_PER_DAY),
    lastDay: Math.floor(end / MINUTES_PER_DAY) - (endsAtMidnight ? 1 : 0),
    startTime: start % MINUTES_PER_DAY === 0 ? '' : clockText(startMinute),
    endTime: endsAtMidnight ? '' : clockText(endMinute)
  };
}

function dayText(day: number): string {
  const { month, dayOfMonth } = yearAndMonthOf(day);
  return WEEKDAY_SHORT[weekdayOf(day)] + ' ' + dayOfMonth + ' ' + MONTH_SHORT[month];
}

export function dayRangeText(firstDay: number, lastDay: number): string {
  if (firstDay === lastDay) return dayText(firstDay);
  const first = yearAndMonthOf(firstDay);
  const last = yearAndMonthOf(lastDay);
  if (first.month === last.month) {
    return WEEKDAY_SHORT[weekdayOf(firstDay)] + ' ' + first.dayOfMonth + ' – ' + dayText(lastDay);
  }
  return dayText(firstDay) + ' – ' + dayText(lastDay);
}

function spanTimeText(parts: SpanParts): string {
  if (parts.startTime && parts.endTime) return parts.startTime + ' – ' + parts.endTime;
  if (parts.startTime) return 'from ' + parts.startTime;
  if (parts.endTime) return 'until ' + parts.endTime;
  return '';
}

export function spanText(startMinute: number, endMinute: number): string {
  const parts = spanParts(startMinute, endMinute);
  if (parts.firstDay === parts.lastDay || !parts.startTime) {
    const timeText = spanTimeText(parts);
    return dayRangeText(parts.firstDay, parts.lastDay) + (timeText ? ' · ' + timeText : '');
  }
  return dayText(parts.firstDay) + ' ' + parts.startTime + ' – ' +
    dayText(parts.lastDay) + (parts.endTime ? ' ' + parts.endTime : '');
}
