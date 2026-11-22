// What happens on one day, in the order it happens.
//
// A day has two halves. The all-day items are the events running through it with no
// particular hour. The timeline below them is every moment that lands inside the day:
// an event starting, an event ending, a step of an event beginning.

import { MINUTES_PER_DAY, minutesFromTime } from './days.ts';
import { windowOfShownDay } from './time-mode.ts';
import type { Occurrence } from './occurrences.ts';

export interface EventStep {
  id: string;
  eventTypeId: string;
  dayNumber: number;
  startTimeUtc: string | null;
  endTimeUtc: string | null;
  sortOrder: number;
}

export interface Moment {
  minute: number;
  eventTypeId: string;
  // The run this moment belongs to, so the page can open it.
  occurrenceKey: string;
  title: string;
  isEnd: boolean;
  // An end that falls on the daily reset rather than at a time somebody set.
  isReset: boolean;
  // Ends of steps come after ends of whole events when both land on the same minute.
  priority: number;
}

export interface DayWindow {
  start: number;
  end: number;
}

// A day on the clock the player is reading. On their own clock in UTC+2 a day runs
// from 22:00 the day before to 22:00 in game time.
export function windowOfDay(day: number): DayWindow {
  return windowOfShownDay(day);
}

// Which day of its own event a calendar day is. The first day is 1.
export function dayOfEvent(occurrence: Occurrence, day: number): number {
  return Math.min(Math.max(day - occurrence.startDay + 1, 1), occurrence.lengthDays);
}

export interface MomentOptions {
  stepsByEventType: Map<string, EventStep[]>;
  nameOf: (eventTypeId: string) => string;
  stepLabel: (stepId: string) => string;
  // Which alliance a time belongs to, written after the event's name.
  allianceTagsOf?: (occurrence: Occurrence) => string;
  // Events whose times of a day are one line of times rather than separate moments.
  timesInLine?: (eventTypeId: string) => boolean;
}

// Every moment of one run that falls inside a day.
export function momentsOf(
  occurrence: Occurrence,
  window: DayWindow,
  options: MomentOptions
): Moment[] {
  const name = options.nameOf(occurrence.eventTypeId) +
    (options.allianceTagsOf?.(occurrence) ?? '');
  // A one-day event with a time is just itself happening, not "starting".
  const isTimedOneDay = occurrence.lengthDays === 1 && Boolean(occurrence.startTimeUtc);
  const isInside = (minute: number) => minute >= window.start && minute < window.end;
  const endsInside = (minute: number) => minute > window.start && minute < window.end;
  const moments: Moment[] = [];

  const base = {
    eventTypeId: occurrence.eventTypeId,
    occurrenceKey: occurrence.key
  };

  if (occurrence.startTimeUtc && isInside(occurrence.startMinute)) {
    moments.push({
      ...base, minute: occurrence.startMinute, isEnd: false, isReset: false, priority: 0,
      title: isTimedOneDay ? name : name + ' starts'
    });
  }

  if (occurrence.endTimeUtc && endsInside(occurrence.endMinute)) {
    moments.push({
      ...base, minute: occurrence.endMinute, isEnd: true, isReset: false, priority: 0,
      title: name + ' ends'
    });
  }

  // An event whose times are one line shows them on its all-day row instead.
  const steps = options.timesInLine?.(occurrence.eventTypeId)
    ? [] : options.stepsByEventType.get(occurrence.eventTypeId) ?? [];
  for (const step of steps) {
    if (!step.startTimeUtc || step.dayNumber > occurrence.lengthDays) continue;
    const stepDay = occurrence.startDay + step.dayNumber - 1;
    const start = stepDay * MINUTES_PER_DAY + minutesFromTime(step.startTimeUtc);
    const title = name + ' · ' + options.stepLabel(step.id);
    if (isInside(start)) {
      moments.push({ ...base, minute: start, isEnd: false, isReset: false, priority: 0, title });
    }
    if (step.endTimeUtc) {
      let end = stepDay * MINUTES_PER_DAY + minutesFromTime(step.endTimeUtc);
      // A step ending at or before it starts runs past midnight.
      if (end <= start) end += MINUTES_PER_DAY;
      if (endsInside(end)) {
        moments.push({ ...base, minute: end, isEnd: true, isReset: false, priority: 1, title: title + ' ends' });
      }
    }
  }

  return moments;
}

// Moments in time order.
//
// An ending only gets a row of its own when nothing else starts at that minute,
// because the row below already shows it. Without this the timeline reads
// "X ends / Y starts" at every handover instead of just "Y starts".
export function timelineOrder(moments: Moment[]): Moment[] {
  const minutesSomethingStarts = new Set<number>();
  for (const moment of moments) {
    if (!moment.isEnd) minutesSomethingStarts.add(moment.minute);
  }

  const endsAlreadyShown = new Set<number>();
  const kept = moments
    .slice()
    .sort((left, right) => left.priority - right.priority)
    .filter(moment => {
      if (!moment.isEnd) return true;
      if (minutesSomethingStarts.has(moment.minute)) return false;
      if (endsAlreadyShown.has(moment.minute)) return false;
      endsAlreadyShown.add(moment.minute);
      return true;
    });

  // Earliest first, and where a start and an end share a minute the start goes above.
  kept.sort((left, right) =>
    left.minute - right.minute ||
    Number(left.isEnd) - Number(right.isEnd) ||
    left.title.localeCompare(right.title));
  return kept;
}

// The windows of an event open at set times each day that fall in a stretch of time.
export function playWindowsIn(
  occurrence: Occurrence, steps: EventStep[], window: DayWindow
): { start: number; end: number; stepId: string }[] {
  return steps
    .filter(step => step.startTimeUtc && step.endTimeUtc && step.dayNumber <= occurrence.lengthDays)
    .map(step => {
      const dayStart = (occurrence.startDay + step.dayNumber - 1) * MINUTES_PER_DAY;
      return {
        start: dayStart + minutesFromTime(step.startTimeUtc),
        end: dayStart + minutesFromTime(step.endTimeUtc),
        stepId: step.id
      };
    })
    .filter(one => one.end > window.start && one.start < window.end)
    .sort((left, right) => left.start - right.start);
}

export interface AllDayItem {
  occurrence: Occurrence;
  name: string;
  // An event played at set times each day (Wild Brawl): its windows on this day, and the
  // day itself, so the windows can be marked on a line for the day.
  playWindows?: { start: number; end: number }[];
  dayWindow?: DayWindow;
  // What this day of the event is: its phase, the day's name and the day's steps that
  // have no time of their own, as in the old app ("Preparation · Hero Development").
  shortLine: string;
}

export interface DayContents {
  allDayItems: AllDayItem[];
  moments: Moment[];
}

export interface DayOptions extends MomentOptions {
  phaseNameForDay: (eventTypeId: string, dayOfEvent: number) => string;
  // The name the game gives a day of the event, if it has one.
  dayNameOf: (eventTypeId: string, dayOfEvent: number) => string;
  // The alliances whose times the player wants to see. A run set for any other
  // alliance is left out, the same way it is left out of the calendar.
  myAllianceIds?: string[];
  // How long the event is, used to put the longest all-day items at the top.
  lengthOf: (occurrence: Occurrence) => number;
}

// The phase, the day's name, then each step of the day without a time, each said once.
function allDayLine(occurrence: Occurrence, dayNumber: number, options: DayOptions): string {
  const parts: string[] = [];
  const add = (part: string) => { if (part && !parts.includes(part)) parts.push(part); };
  // The phase line can already hold the day's steps, so it is taken apart first.
  const [phase, ...phaseSteps] = options.phaseNameForDay(occurrence.eventTypeId, dayNumber).split(' · ');
  add(phase);
  add(options.dayNameOf(occurrence.eventTypeId, dayNumber));
  phaseSteps.forEach(add);
  for (const step of options.stepsByEventType.get(occurrence.eventTypeId) ?? []) {
    if (step.dayNumber === dayNumber && !step.startTimeUtc) add(options.stepLabel(step.id));
  }
  return parts.join(' · ');
}

export function contentsOfDay(
  occurrences: Occurrence[],
  day: number,
  options: DayOptions
): DayContents {
  const window = windowOfDay(day);
  const myAllianceIds = options.myAllianceIds ?? [];
  const onThisDay = occurrences.filter(occurrence =>
    occurrence.startMinute < window.end && occurrence.endMinute > window.start &&
    (occurrence.allianceIds.length === 0 ||
      occurrence.allianceIds.some(id => myAllianceIds.includes(id))));

  const allDayItems: AllDayItem[] = [];
  let moments: Moment[] = [];

  for (const occurrence of onThisDay) {
    // A one-day event with a time belongs in the timeline only. Everything else is
    // also an all-day item, because it is running whether or not it starts today.
    const isTimedOneDay = occurrence.lengthDays === 1 && Boolean(occurrence.startTimeUtc);
    const name = options.nameOf(occurrence.eventTypeId) + (options.allianceTagsOf?.(occurrence) ?? '');
    const playWindows = options.timesInLine?.(occurrence.eventTypeId)
      ? playWindowsIn(occurrence, options.stepsByEventType.get(occurrence.eventTypeId) ?? [], window) : null;
    if (!isTimedOneDay) {
      allDayItems.push({
        occurrence, name,
        shortLine: allDayLine(occurrence, dayOfEvent(occurrence, day), options),
        ...(playWindows ? { playWindows, dayWindow: window } : {})
      });
    }
    if (!occurrence.wasCancelled) {
      moments = moments.concat(momentsOf(occurrence, window, options));
    }
  }

  // The longest event first, so a season sits above a single day inside it.
  allDayItems.sort((left, right) =>
    options.lengthOf(right.occurrence) - options.lengthOf(left.occurrence) ||
    left.name.localeCompare(right.name));

  return { allDayItems, moments: timelineOrder(moments) };
}
