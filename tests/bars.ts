// Turning runs of events into the coloured bars on the month grid.
//
// Three things happen here, and each exists for a reason:
//   a long event is split into its phases, so Fortress shows Registration then Battles;
//   every alliance's run of the same event on the same day becomes one bar with a
//     count, so eight bear traps read as "Bear Hunt x8" instead of eight rows;
//   bars are stacked into lanes within a week so none of them overlap.

import { MINUTES_PER_DAY, startOfWeek } from './days.ts';
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

export interface Bar {
  key: string;
  eventTypeId: string;
  // What to write on it. Empty means the event's own name.
  phaseName: string | null;
  allianceIds: string[];
  // How many alliances share this bar, when their runs were gathered into one.
  count: number;
  startMinute: number;
  endMinute: number;
  wasCancelled: boolean;
  wasChanged: boolean;
}

export interface BarPiece extends Bar {
  // The days this piece covers inside one week, 0 for Monday through 6 for Sunday.
  firstColumn: number;
  lastColumn: number;
  // Whether the bar really begins and ends here, or carries on into the week beside.
  startsHere: boolean;
  endsHere: boolean;
  lane: number;
}

function dayOfMinute(minute: number): number {
  return Math.floor(minute / MINUTES_PER_DAY);
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

export interface BuildBarsOptions {
  phasesByEventType: Map<string, EventPhase[]>;
  minutesFromTime: (time: string | null) => number;
  // Events the catalog marks as details only never get a bar.
  isDetailsOnly: (eventTypeId: string) => boolean;
  // Which categories are ticked. A run with an alliance on it always counts as an
  // alliance event, whatever its own category says.
  shownCategories: Set<string>;
  categoryOf: (eventTypeId: string) => string;
}

// A run set for one alliance is an alliance event. Everything else uses its own
// category: state, personal or deals.
export function categoryOfOccurrence(
  occurrence: Occurrence,
  categoryOf: (eventTypeId: string) => string
): string {
  return occurrence.allianceIds.length === 0 ? categoryOf(occurrence.eventTypeId) : 'alliance';
}

export function buildBars(occurrences: Occurrence[], options: BuildBarsOptions): Bar[] {
  const bars: Bar[] = [];
  const gathered = new Map<string, Bar>();

  for (const occurrence of occurrences) {
    if (options.isDetailsOnly(occurrence.eventTypeId)) continue;
    if (!options.shownCategories.has(categoryOfOccurrence(occurrence, options.categoryOf))) continue;

    // An event with no alliance on it belongs to the whole state.
    if (occurrence.allianceIds.length === 0) {
      const phases = options.phasesByEventType.get(occurrence.eventTypeId);
      if (!phases || phases.length === 0) {
        bars.push(toBar(occurrence, null, occurrence.startMinute, occurrence.endMinute));
        continue;
      }
      for (const phase of phases) {
        // Some phases exist for the event's own page but never get a bar.
        if (phase.hideBar) continue;
        const span = phaseMinutes(occurrence, phase, options.minutesFromTime);
        if (span) bars.push(toBar(occurrence, phase.id, span.start, span.end));
      }
      continue;
    }

    // An alliance event: every alliance running it on the same day shares one bar.
    const firstDay = dayOfMinute(occurrence.startMinute);
    const lastDay = dayOfMinute(occurrence.endMinute - 1);
    for (let day = firstDay; day <= lastDay; day++) {
      const gatherKey = occurrence.eventTypeId + '|' + day;
      let bar = gathered.get(gatherKey);
      if (!bar) {
        bar = {
          key: 'gathered|' + gatherKey,
          eventTypeId: occurrence.eventTypeId,
          phaseName: null,
          allianceIds: [],
          count: 0,
          startMinute: day * MINUTES_PER_DAY,
          endMinute: (day + 1) * MINUTES_PER_DAY,
          wasCancelled: false,
          wasChanged: false
        };
        gathered.set(gatherKey, bar);
      }
      bar.count += 1;
      for (const allianceId of occurrence.allianceIds) {
        if (!bar.allianceIds.includes(allianceId)) bar.allianceIds.push(allianceId);
      }
      if (occurrence.wasChanged) bar.wasChanged = true;
    }
  }

  return bars.concat([...gathered.values()]);
}

function toBar(occurrence: Occurrence, phaseId: string | null, start: number, end: number): Bar {
  return {
    key: occurrence.key + (phaseId ? '|' + phaseId : ''),
    eventTypeId: occurrence.eventTypeId,
    phaseName: phaseId,
    allianceIds: occurrence.allianceIds,
    count: 0,
    startMinute: start,
    endMinute: end,
    wasCancelled: occurrence.wasCancelled,
    wasChanged: occurrence.wasChanged
  };
}

// Cut every bar into the weeks it crosses, and stack the pieces so none overlap.
// A piece keeps whether the bar really starts or ends there, so only the true ends
// get rounded corners.
export function piecesForWeek(bars: Bar[], weekStart: number): BarPiece[] {
  const weekEnd = weekStart + 7;
  const pieces: BarPiece[] = [];

  for (const bar of bars) {
    const firstDay = dayOfMinute(bar.startMinute);
    // A bar ending exactly at a reset belongs to the day before, not the day after.
    const lastDay = dayOfMinute(bar.endMinute - 1);
    if (lastDay < weekStart || firstDay >= weekEnd) continue;

    pieces.push({
      ...bar,
      firstColumn: Math.max(firstDay, weekStart) - weekStart,
      lastColumn: Math.min(lastDay, weekEnd - 1) - weekStart,
      startsHere: firstDay >= weekStart,
      endsHere: lastDay < weekEnd,
      lane: 0
    });
  }

  // Longest first, then earliest, so the bars that cross the week sit at the top and
  // the short ones fill in under them.
  pieces.sort((left, right) => {
    const leftWidth = left.lastColumn - left.firstColumn;
    const rightWidth = right.lastColumn - right.firstColumn;
    if (leftWidth !== rightWidth) return rightWidth - leftWidth;
    if (left.firstColumn !== right.firstColumn) return left.firstColumn - right.firstColumn;
    return left.key.localeCompare(right.key);
  });

  // Each lane remembers the last column it is filled to.
  const laneEnds: number[] = [];
  for (const piece of pieces) {
    let lane = 0;
    while (lane < laneEnds.length && laneEnds[lane] >= piece.firstColumn) lane += 1;
    piece.lane = lane;
    laneEnds[lane] = piece.lastColumn;
  }
  return pieces;
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
