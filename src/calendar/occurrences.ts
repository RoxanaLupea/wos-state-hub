// Turning schedules into the actual runs of each event.
//
// A schedule says "every 2 days from 2 November, one day long". An occurrence is one
// of those runs, with the day it starts, the day it ends, and the exact minutes.
//
// Three things complicate it, and all three are real:
//   a date can be moved by hand;
//   moving a date can move the ones predicted from it (shiftWithMoves);
//   an event has a day it was introduced, and nothing exists before that (sinceDate).

import {
  MINUTES_PER_DAY, dayFromText, textFromDay, minutesFromTime
} from './days.ts';

export interface Schedule {
  id: string;
  eventTypeId: string;
  firstDate: string;
  repeatEveryDays: number | null;
  lengthDays: number | null;
  startTimeUtc: string | null;
  endTimeUtc: string | null;
  allianceIds: string | null;
  groupNumber: number | null;
  note: string | null;
  sinceDate: string | null;
  shiftWithMoves: boolean;
}

// A run that was changed by hand: moved to another day, given different times, or
// called off. Keyed by schedule and the day the pattern originally produced.
export interface DateChange {
  scheduleId: string;
  originalDate: string;
  movedToDate: string | null;
  startTimeUtc: string | null;
  endTimeUtc: string | null;
  isCancelled: boolean;
  note: string | null;
}

export interface Occurrence {
  key: string;
  scheduleId: string;
  eventTypeId: string;
  allianceIds: string[];
  groupNumber: number | null;
  startDay: number;
  endDay: number;
  lengthDays: number;
  originalDay: number;
  startTimeUtc: string;
  endTimeUtc: string;
  startMinute: number;
  endMinute: number;
  note: string;
  wasChanged: boolean;
  wasCancelled: boolean;
}

export type ChangesBySchedule = Map<string, Map<string, DateChange>>;

export function groupChanges(changes: DateChange[]): ChangesBySchedule {
  const bySchedule: ChangesBySchedule = new Map();
  for (const change of changes) {
    let forSchedule = bySchedule.get(change.scheduleId);
    if (!forSchedule) {
      forSchedule = new Map();
      bySchedule.set(change.scheduleId, forSchedule);
    }
    forSchedule.set(change.originalDate, change);
  }
  return bySchedule;
}

// The exact start and end of a run, in minutes since 1970.
// No start time means the daily reset. No end time means the reset after the last day.
// An end that lands on or before the start belongs to the next day.
function setMinutes(occurrence: Occurrence): void {
  occurrence.startMinute =
    occurrence.startDay * MINUTES_PER_DAY + Math.max(0, minutesFromTime(occurrence.startTimeUtc));
  const endTime = minutesFromTime(occurrence.endTimeUtc);
  let endMinute = endTime > 0
    ? occurrence.endDay * MINUTES_PER_DAY + endTime
    : (occurrence.endDay + 1) * MINUTES_PER_DAY;
  if (endMinute <= occurrence.startMinute) endMinute += MINUTES_PER_DAY;
  occurrence.endMinute = endMinute;
}

interface Rhythm {
  // No run exists before this day, because the event was not in the game yet.
  introducedDay: number;
  // How many days a run planned for this day moves, because an earlier one was moved.
  shiftFor: (plannedDay: number) => number;
  // The furthest any run has been moved, so the search looks wide enough.
  largestShift: number;
}

const NO_SHIFT: Rhythm = { introducedDay: -Infinity, shiftFor: () => 0, largestShift: 0 };

// How a schedule's dates follow each other.
//
// With shiftWithMoves on, moving one date moves every date predicted from it: the
// later ones after the first date, the earlier ones before it, until the next moved
// date. Tundra Arms League works this way — each season moved in the game keeps its
// sixteen weeks from there on.
//
// A part of an event, like Match Prediction inside Tundra Arms League, follows the
// moves of the event it belongs to, so moving the main event moves its parts with it.
export function rhythmOf(
  schedule: Schedule,
  partOfEventTypeId: string | null,
  allSchedules: Schedule[],
  changesBySchedule: ChangesBySchedule
): Rhythm {
  let source = schedule;
  let offsetDays = 0;

  if (partOfEventTypeId && !schedule.allianceIds) {
    const mainSchedule = allSchedules.find(other =>
      other.eventTypeId === partOfEventTypeId &&
      !other.allianceIds &&
      other.repeatEveryDays === schedule.repeatEveryDays);
    if (mainSchedule && !Number.isNaN(dayFromText(mainSchedule.firstDate))) {
      source = mainSchedule;
      offsetDays = dayFromText(schedule.firstDate) - dayFromText(mainSchedule.firstDate);
    }
  }

  const ownIntroduced = dayFromText(schedule.sinceDate);
  const mainIntroduced = source !== schedule ? dayFromText(source.sinceDate) + offsetDays : NaN;
  const introducedDay = !Number.isNaN(ownIntroduced) ? ownIntroduced
    : !Number.isNaN(mainIntroduced) ? mainIntroduced
    : -Infinity;

  const repeatEveryDays = source.repeatEveryDays ?? 0;
  if (!source.shiftWithMoves || repeatEveryDays <= 0) {
    return { ...NO_SHIFT, introducedDay };
  }

  const sourceFirstDay = dayFromText(source.firstDate);
  const changes = changesBySchedule.get(source.id);
  const moves: Array<{ plannedDay: number; shift: number }> = [];
  if (changes) {
    for (const change of changes.values()) {
      if (!change.movedToDate) continue;
      const plannedDay = dayFromText(change.originalDate);
      const shift = dayFromText(change.movedToDate) - plannedDay;
      if (Number.isNaN(plannedDay) || Number.isNaN(shift)) continue;
      moves.push({ plannedDay, shift });
    }
  }
  const largestShift = moves.reduce((largest, move) => Math.max(largest, Math.abs(move.shift)), 0);

  const shiftFor = (plannedDay: number): number => {
    const mainDay = plannedDay - offsetDays;
    let closest: { plannedDay: number; shift: number } | null = null;
    for (const move of moves) {
      // After the first date, the latest move at or before this one counts.
      // Before the first date, the nearest move at or after this one counts.
      const counts = mainDay >= sourceFirstDay
        ? move.plannedDay >= sourceFirstDay && move.plannedDay <= mainDay
        : move.plannedDay < sourceFirstDay && move.plannedDay >= mainDay;
      if (!counts) continue;
      if (!closest || Math.abs(mainDay - move.plannedDay) < Math.abs(mainDay - closest.plannedDay)) {
        closest = move;
      }
    }
    return closest ? closest.shift : 0;
  };

  return { introducedDay, shiftFor, largestShift };
}

export interface ExpandOptions {
  allSchedules: Schedule[];
  changesBySchedule: ChangesBySchedule;
  // Which event type each schedule belongs to, when it is a part of a bigger event.
  partOfByEventTypeId: Map<string, string | null>;
}

// Every run of one schedule that touches the days between fromDay and toDay.
export function expandSchedule(
  schedule: Schedule,
  fromDay: number,
  toDay: number,
  options: ExpandOptions
): Occurrence[] {
  const firstDay = dayFromText(schedule.firstDate);
  if (Number.isNaN(firstDay)) return [];

  const repeatEveryDays = schedule.repeatEveryDays ?? 0;
  const lengthDays = Math.max(1, schedule.lengthDays ?? 1);
  const partOf = options.partOfByEventTypeId.get(schedule.eventTypeId) ?? null;
  const rhythm = rhythmOf(schedule, partOf, options.allSchedules, options.changesBySchedule);

  // A moved date can land well away from where it started, so look wider than asked.
  const searchMargin = 60 + rhythm.largestShift;

  const plannedStarts: number[] = [];
  if (repeatEveryDays <= 0) {
    plannedStarts.push(firstDay);
  } else {
    // A repeating schedule also runs backwards from its first date, but never before
    // the day the event was introduced.
    const skipCount = Math.floor((fromDay - searchMargin - firstDay) / repeatEveryDays);
    for (let start = firstDay + skipCount * repeatEveryDays;
         start <= toDay + searchMargin;
         start += repeatEveryDays) {
      plannedStarts.push(start);
    }
  }

  const changes = options.changesBySchedule.get(schedule.id);
  const allianceIds = schedule.allianceIds
    ? schedule.allianceIds.split(',').map(id => id.trim()).filter(Boolean)
    : [];

  const runs: Occurrence[] = [];
  for (const plannedStart of plannedStarts) {
    const plannedText = textFromDay(plannedStart);
    const change = changes?.get(plannedText) ?? null;
    // Its own move if it has one, otherwise the move of the date it follows.
    const startDay = change?.movedToDate
      ? dayFromText(change.movedToDate)
      : plannedStart + rhythm.shiftFor(plannedStart);
    const endDay = startDay + lengthDays - 1;
    if (startDay < rhythm.introducedDay) continue;
    if (endDay < fromDay || startDay > toDay) continue;

    const occurrence: Occurrence = {
      key: schedule.id + '|' + plannedText,
      scheduleId: schedule.id,
      eventTypeId: schedule.eventTypeId,
      allianceIds,
      groupNumber: schedule.groupNumber,
      startDay,
      endDay,
      lengthDays,
      originalDay: plannedStart,
      startTimeUtc: change?.startTimeUtc || schedule.startTimeUtc || '',
      endTimeUtc: change?.endTimeUtc || schedule.endTimeUtc || '',
      startMinute: 0,
      endMinute: 0,
      note: [schedule.note, change?.note].filter(Boolean).join(' · '),
      // Only a moved day or changed times count as changed. A note alone does not.
      wasChanged: Boolean(change && (change.movedToDate || change.startTimeUtc || change.endTimeUtc)),
      wasCancelled: Boolean(change?.isCancelled)
    };
    setMinutes(occurrence);
    runs.push(occurrence);
  }
  return runs;
}

// The State Transfer is not a schedule of its own. It opens the day after each SvS
// Battle, or after each Sunfire Castle when the state has switched to following those,
// and runs for seven days.
export const TRANSFER_SCHEDULE_ID = 'transfers';
export const TRANSFER_LENGTH_DAYS = 7;

export function buildTransfers(
  fromDay: number,
  toDay: number,
  follows: 'svs' | 'sunfire',
  options: ExpandOptions
): Occurrence[] {
  const followedEventTypeId = follows === 'sunfire' ? 'sunfire' : 'svs-battle';
  const changes = options.changesBySchedule.get(TRANSFER_SCHEDULE_ID);
  const runs: Occurrence[] = [];

  const followed = options.allSchedules.filter(schedule =>
    schedule.eventTypeId === followedEventTypeId && !schedule.allianceIds);

  for (const schedule of followed) {
    // Look wider than asked, because the transfer lands after the event it follows.
    for (const run of expandSchedule(schedule, fromDay - 70, toDay + 70, options)) {
      const plannedDay = run.endDay + 1;
      const plannedText = textFromDay(plannedDay);
      const change = changes?.get(plannedText) ?? null;
      const startDay = change?.movedToDate ? dayFromText(change.movedToDate) : plannedDay;
      if (startDay + TRANSFER_LENGTH_DAYS - 1 < fromDay || startDay > toDay) continue;

      const occurrence: Occurrence = {
        key: TRANSFER_SCHEDULE_ID + '|' + plannedText,
        scheduleId: TRANSFER_SCHEDULE_ID,
        eventTypeId: 'transfer',
        allianceIds: [],
        groupNumber: null,
        startDay,
        endDay: startDay + TRANSFER_LENGTH_DAYS - 1,
        lengthDays: TRANSFER_LENGTH_DAYS,
        originalDay: plannedDay,
        startTimeUtc: change?.startTimeUtc || '',
        endTimeUtc: change?.endTimeUtc || '',
        startMinute: 0,
        endMinute: 0,
        note: change?.note || '',
        wasChanged: Boolean(change && (change.movedToDate || change.startTimeUtc || change.endTimeUtc)),
        wasCancelled: false
      };
      setMinutes(occurrence);
      runs.push(occurrence);
    }
  }
  return runs;
}

// Every run of every schedule that touches the days asked for, soonest first.
export function buildOccurrences(
  fromDay: number,
  toDay: number,
  follows: 'svs' | 'sunfire',
  options: ExpandOptions
): Occurrence[] {
  const everything: Occurrence[] = [];
  for (const schedule of options.allSchedules) {
    everything.push(...expandSchedule(schedule, fromDay, toDay, options));
  }
  everything.push(...buildTransfers(fromDay, toDay, follows, options));
  everything.sort((left, right) =>
    left.startMinute - right.startMinute || left.key.localeCompare(right.key));
  return everything;
}
