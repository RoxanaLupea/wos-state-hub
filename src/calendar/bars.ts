// Turning runs of events into the bars drawn on the calendar.
//
// A bar is one coloured block on the grid. Most come straight from a run of an event,
// but four things change that:
//   an event with phases becomes one bar per phase, so Fortress reads Registration
//     then Battles;
//   every alliance's run of the same event on the same day becomes one bar with a
//     count, so sixteen bear traps read "Bear Hunt x16" instead of sixteen rows;
//   a part that runs for days inside its own event (Trade Route) is not a bar of its
//     own but a line under its event's bar;
//   an event where the player has picked a time shows only its logo at that time.

import { MINUTES_PER_DAY, startOfWeek } from './days.ts';
import { shownDayOf, windowOfShownDay } from './time-mode.ts';
import type { Occurrence } from './occurrences.ts';

export interface EventPhase {
  id: string;
  eventTypeId: string;
  fromDay: number;
  toDay: number;
  startTimeUtc: string | null;
  endTimeUtc: string | null;
  hideBar: boolean;
  sortOrder: number;
}

// A time marked on a bar instead of the bar being drawn across the whole day: the
// player's own slot, or each alliance time they follow.
export interface Marker {
  minute: number;
  title: string;
}

export interface Bar {
  key: string;
  eventTypeId: string;
  scheduleId: string;
  allianceIds: string[];
  groupNumber: number | null;
  // How many alliance runs were gathered into this one bar. 0 means it is not a
  // gathered bar.
  count: number;
  startMinute: number;
  endMinute: number;
  // Where the whole event starts and ends, when this bar is only one phase of it.
  fullStartMinute: number;
  fullEndMinute: number;
  startDay: number;
  lengthDays: number;
  startTimeUtc: string;
  endTimeUtc: string;
  phaseId: string | null;
  wasCancelled: boolean;
  // The day is still a guess until an admin confirms it.
  isProvisional: boolean;
  // Only the marked times show, as logos, instead of a block across the day.
  markers: Marker[] | null;
  // Parts running for days inside this event, drawn as lines under the bar.
  stripes: Occurrence[];
}

export interface BuildBarsOptions {
  phasesByEventType: Map<string, EventPhase[]>;
  minutesFromTime: (time: string | null) => number;
  isDetailsOnly: (eventTypeId: string) => boolean;
  categoryOf: (eventTypeId: string) => string;
  partOfByEventTypeId: Map<string, string | null>;
  shownCategories: Set<string>;
  // Events the player has unticked inside a filter, as "category|eventTypeId".
  hiddenEvents?: Set<string>;
  // The alliances whose times the player wants to see. Empty means none picked yet.
  myAllianceIds?: string[];
  // Events where the player follows particular alliance times rather than all of
  // them, and the schedules they follow.
  followsTimesOf?: (eventTypeId: string) => boolean;
  followedScheduleIds?: Set<string>;
  // The player's own picked time for an event, by run key.
  myTimeByKey?: Map<string, string>;
}

function dayOfMinute(minute: number): number {
  return Math.floor(minute / MINUTES_PER_DAY);
}

// A run set for one alliance is an alliance event. Everything else uses its own
// category: state, personal or deals.
export function categoryOfOccurrence(
  occurrence: Occurrence,
  categoryOf: (eventTypeId: string) => string
): string {
  return occurrence.allianceIds.length === 0 ? categoryOf(occurrence.eventTypeId) : 'alliance';
}

// Which filter row an event sits under. A part is filtered with its whole event, so
// unticking Tundra Arms League also hides its predictions.
export function filterKey(
  category: string,
  eventTypeId: string,
  partOfByEventTypeId: Map<string, string | null>
): string {
  return category + '|' + (partOfByEventTypeId.get(eventTypeId) ?? eventTypeId);
}

// When a phase of an event begins and ends. Returns nothing when the event is too
// short to reach that phase, or the phase would have no width.
export function phaseMinutes(
  occurrence: Occurrence,
  phase: EventPhase,
  minutesFromTime: (time: string | null) => number
): { start: number; end: number } | null {
  if (phase.fromDay > occurrence.lengthDays) return null;

  let start = phase.fromDay <= 1
    ? occurrence.startMinute
    : (occurrence.startDay + phase.fromDay - 1) * MINUTES_PER_DAY;
  let end = phase.toDay >= occurrence.lengthDays
    ? occurrence.endMinute
    : (occurrence.startDay + phase.toDay) * MINUTES_PER_DAY;

  if (phase.startTimeUtc) {
    start = (occurrence.startDay + phase.fromDay - 1) * MINUTES_PER_DAY + minutesFromTime(phase.startTimeUtc);
  }
  if (phase.endTimeUtc && minutesFromTime(phase.endTimeUtc) > 0) {
    end = (occurrence.startDay + phase.toDay - 1) * MINUTES_PER_DAY + minutesFromTime(phase.endTimeUtc);
  }

  start = Math.max(start, occurrence.startMinute);
  end = Math.min(end, occurrence.endMinute);
  return end > start ? { start, end } : null;
}

// Parts that run for days inside their own event (Trade Route inside the season).
// They get no bar of their own; they become a line under their event's bar.
export function findStripeParts(
  occurrences: Occurrence[],
  partOfByEventTypeId: Map<string, string | null>
): { partKeys: Set<string>; byMainKey: Map<string, Occurrence[]> } {
  const partKeys = new Set<string>();
  const byMainKey = new Map<string, Occurrence[]>();

  for (const part of occurrences) {
    const partOf = partOfByEventTypeId.get(part.eventTypeId);
    if (!partOf) continue;
    if (part.endMinute - part.startMinute <= MINUTES_PER_DAY) continue;
    const main = occurrences.find(other =>
      other.eventTypeId === partOf &&
      other.allianceIds.join(',') === part.allianceIds.join(',') &&
      other.startMinute <= part.startMinute && other.endMinute >= part.endMinute);
    if (!main) continue;
    partKeys.add(part.key);
    const forMain = byMainKey.get(main.key) ?? [];
    forMain.push(part);
    byMainKey.set(main.key, forMain);
  }
  return { partKeys, byMainKey };
}

// The first and last day an alliance run shows on. A run that ends at the daily reset
// belongs to the day before, not the day after.
export function shownDaysOf(occurrence: Occurrence): { first: number; last: number } {
  const first = shownDayOf(occurrence.startMinute);
  let last = shownDayOf(occurrence.endMinute - 1);
  const endsAtReset = !occurrence.endTimeUtc || occurrence.endTimeUtc === '00:00';
  if (occurrence.allianceIds.length > 0 && endsAtReset) {
    last = Math.max(first, Math.min(last, occurrence.endDay));
  }
  return { first, last };
}

function barFromOccurrence(occurrence: Occurrence, changes: Partial<Bar> = {}): Bar {
  return {
    key: occurrence.key,
    eventTypeId: occurrence.eventTypeId,
    scheduleId: occurrence.scheduleId,
    allianceIds: occurrence.allianceIds,
    groupNumber: occurrence.groupNumber,
    count: 0,
    startMinute: occurrence.startMinute,
    endMinute: occurrence.endMinute,
    fullStartMinute: occurrence.startMinute,
    fullEndMinute: occurrence.endMinute,
    startDay: occurrence.startDay,
    lengthDays: occurrence.lengthDays,
    startTimeUtc: occurrence.startTimeUtc,
    endTimeUtc: occurrence.endTimeUtc,
    phaseId: null,
    wasCancelled: occurrence.wasCancelled,
    isProvisional: occurrence.isProvisional,
    markers: null,
    stripes: [],
    ...changes
  };
}

// Every bar that falls inside a stretch of days. The runs are built a week wider on
// each side so a bar reaching into the stretch is whole.
export function buildBarsForRange(
  allInRange: Occurrence[],
  fromDay: number,
  toDay: number,
  options: BuildBarsOptions
): Bar[] {
  const rangeStart = windowOfShownDay(fromDay).start;
  const rangeEnd = windowOfShownDay(toDay).end;
  const stripes = findStripeParts(allInRange, options.partOfByEventTypeId);
  const hiddenEvents = options.hiddenEvents ?? new Set<string>();
  const myAllianceIds = options.myAllianceIds ?? [];
  const followedScheduleIds = options.followedScheduleIds ?? new Set<string>();
  const myTimeByKey = options.myTimeByKey ?? new Map<string, string>();

  const isShown = (occurrence: Occurrence) => {
    const category = categoryOfOccurrence(occurrence, options.categoryOf);
    if (!options.shownCategories.has(category)) return false;
    return !hiddenEvents.has(filterKey(category, occurrence.eventTypeId, options.partOfByEventTypeId));
  };

  const occurrences = allInRange.filter(occurrence =>
    occurrence.startMinute < rangeEnd && occurrence.endMinute > rangeStart &&
    isShown(occurrence) && !options.isDetailsOnly(occurrence.eventTypeId) &&
    !stripes.partKeys.has(occurrence.key));

  const bars: Bar[] = [];

  for (const occurrence of occurrences) {
    if (occurrence.allianceIds.length > 0) continue;
    const ownStripes = stripes.byMainKey.get(occurrence.key) ?? [];

    // An event where the player picked a time (Frostfire): only its logo, at that time.
    const myTime = myTimeByKey.get(occurrence.key);
    if (myTime) {
      const slotMinute = occurrence.startDay * MINUTES_PER_DAY + options.minutesFromTime(myTime);
      const slotWindow = windowOfShownDay(shownDayOf(slotMinute));
      bars.push(barFromOccurrence(occurrence, {
        startMinute: slotWindow.start, endMinute: slotWindow.end, stripes: ownStripes,
        markers: [{ minute: slotMinute, title: 'My slot' }]
      }));
      continue;
    }

    const phases = options.phasesByEventType.get(occurrence.eventTypeId);
    if (!phases || phases.length === 0) {
      bars.push(barFromOccurrence(occurrence, { stripes: ownStripes }));
      continue;
    }
    // Phases marked "no bar" only show on the event's own page.
    for (const phase of phases) {
      if (phase.hideBar) continue;
      const span = phaseMinutes(occurrence, phase, options.minutesFromTime);
      if (!span) continue;
      bars.push(barFromOccurrence(occurrence, {
        key: occurrence.key + '|' + phase.id,
        startMinute: span.start, endMinute: span.end,
        phaseId: phase.id, stripes: ownStripes
      }));
    }
  }

  // Alliance runs: all of them on one day become a single bar with a count.
  const gathered = new Map<string, Bar>();
  for (const occurrence of occurrences) {
    if (occurrence.allianceIds.length === 0) continue;
    const visible = occurrence.allianceIds.filter(id => myAllianceIds.includes(id));
    if (!visible.length) continue;

    // Where the player follows particular times of this event, only the followed
    // ones show, as logos at their times.
    const followsSome = options.followsTimesOf?.(occurrence.eventTypeId) ?? false;
    if (followsSome && !followedScheduleIds.has(occurrence.scheduleId)) continue;

    const days = shownDaysOf(occurrence);
    const lastDay = Math.min(days.last, toDay);
    for (let day = Math.max(days.first, fromDay); day <= lastDay; day++) {
      const gatherKey = occurrence.eventTypeId + '|' + day;
      let bar = gathered.get(gatherKey);
      if (!bar) {
        const window = windowOfShownDay(day);
        bar = barFromOccurrence(occurrence, {
          key: 'group|' + gatherKey,
          allianceIds: [],
          startMinute: window.start, endMinute: window.end,
          fullStartMinute: window.start, fullEndMinute: window.end,
          startDay: day, lengthDays: 1, startTimeUtc: '', endTimeUtc: '',
          count: 0, markers: followsSome ? [] : null, stripes: []
        });
        gathered.set(gatherKey, bar);
      }
      bar.count += 1;
      if (followsSome && bar.markers) {
        bar.markers.push({ minute: occurrence.startMinute, title: occurrence.scheduleId });
      }
    }
  }

  return bars.concat([...gathered.values()]);
}

// The weeks a month needs, including the days either side that fill its first and
// last rows.
export function weeksOfMonth(firstDayOfMonth: number, daysInMonth: number): number[] {
  const weeks: number[] = [];
  const firstWeek = startOfWeek(firstDayOfMonth);
  const lastWeek = startOfWeek(firstDayOfMonth + daysInMonth - 1);
  for (let week = firstWeek; week <= lastWeek; week += 7) weeks.push(week);
  return weeks;
}

export { dayOfMinute };
