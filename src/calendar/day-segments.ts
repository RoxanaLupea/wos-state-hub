// The named days of an event, as stretches of its bar.
//
// Some events give each of their days a name — SvS preparation's Troop Revival, Hero
// Recruitment and so on. Those names are written along the bar, divided by white
// lines. An event whose days all carry the same note has no named days: that note is
// about the event, not about one day of it.
import { MINUTES_PER_DAY } from './days.ts';
import type { Bar } from './bars.ts';
import type { NamedSpan } from './week-bars.ts';

export function daySegments(
  bar: Bar,
  nameOfDay: (eventTypeId: string, dayNumber: number) => string
): NamedSpan[] {
  if (bar.count) return [];
  const eventStart = bar.fullStartMinute;
  const eventEnd = bar.fullEndMinute;

  const named: { dayNumber: number; name: string }[] = [];
  for (let dayNumber = 1; dayNumber <= (bar.lengthDays || 1); dayNumber++) {
    const name = nameOfDay(bar.eventTypeId, dayNumber);
    if (name) named.push({ dayNumber, name });
  }
  if (named.length < 2) return [];
  // A note repeated on every day is not a day's name.
  const distinct = new Set(named.map(entry => entry.name));
  if (distinct.size !== named.length) return [];

  return named.map((entry, index) => {
    const next = named[index + 1];
    const start = entry.dayNumber === 1
      ? eventStart
      : (bar.startDay + entry.dayNumber - 1) * MINUTES_PER_DAY;
    const end = next
      ? (bar.startDay + next.dayNumber - 1) * MINUTES_PER_DAY
      : eventEnd;
    return {
      name: entry.name,
      shortName: 'Day ' + entry.dayNumber,
      start: Math.max(start, eventStart),
      end: Math.min(end, eventEnd)
    };
  }).filter(segment => segment.end > segment.start);
}
