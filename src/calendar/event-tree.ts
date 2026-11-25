// What one run of an event looks like from the inside: every moment of it, in order,
// as rows of a timeline.
//
// An event is rarely one thing. SvS is matchmaking, preparation, a battle and field
// triage, with Castle Battle inside the battle day. Tundra Arms League runs for weeks
// with phases, named days, timed steps, and predictions that open and close beside it.
// All of those become rows here, at two levels: the main line, and what hangs under it.

import { MINUTES_PER_DAY } from './days.ts';
import { phaseMinutes, type EventPhase } from './bars.ts';
import { nowMinute } from './time-mode.ts';
import type { Occurrence } from './occurrences.ts';
import { playWindowsIn } from './day-timeline.ts';
import type { EventStep } from './day-timeline.ts';

export interface TreeRow {
  minute: number;
  // Where a phase ends, used to gather the rows that belong inside it.
  endMinute?: number;
  label: string;
  // A smaller line under the label, used for an opening's own name.
  subLabel?: string;
  // An event played at set times each day (Wild Brawl): each window is a row where it
  // opens, carrying when it closes, and a row where it closes. The line between the two
  // is lit.
  playOpensUntil?: number;
  isPlayClose?: boolean;
  note?: string;
  eventTypeId: string;
  occurrence: Occurrence;
  // 0 is the main line, 1 is a row hanging under it.
  level: number;
  // A stage of the event (State of Power's Matchmaking, Preparation, Battle, Field
  // Triage), written in capitals.
  isStage?: boolean;
  dayNumber?: number;
  pointSourceIds: string[];
  // Rows of a part drawn on its own line beside the main one.
  isSideRow?: boolean;
  isSideStep?: boolean;
  isSideEnd?: boolean;
  // The cap at the very end of the run.
  isEndRow?: boolean;
  isCancelled?: boolean;
  // Rows of a part that is only open at certain times.
  openingPartKey?: string;
  openingStart?: number;
  openingEnd?: number;
  // Filled in once the rows are in order.
  key?: string;
  isCurrent?: boolean;
  // Tapped (or the day tapped on the calendar): highlighted, without the pin.
  isPicked?: boolean;
}

export interface SidePart {
  occurrence: Occurrence;
  openings: { start: number; end: number; label: string }[] | null;
}

export interface EventTree {
  rows: TreeRow[];
  side: SidePart | null;
  openingSides: SidePart[];
  // True when any row has scoring rows of its own, so the event's own list is not
  // repeated underneath.
  hasPoints: boolean;
  currentRowKey: string;
}

export interface TreeOptions {
  phasesByEventType: Map<string, EventPhase[]>;
  stepsByEventType: Map<string, EventStep[]>;
  minutesFromTime: (time: string | null) => number;
  partOfByEventTypeId: Map<string, string | null>;
  nameOf: (eventTypeId: string) => string;
  // A stage's name (State of Power: Matchmaking, Preparation, Battle, Field Triage), or
  // empty for an event that is not a stage. A stage is written in capitals in the timeline.
  stageNameOf: (eventTypeId: string) => string;
  shortNameOf: (eventTypeId: string) => string;
  phaseNameOf: (phaseId: string) => string;
  stepLabel: (stepId: string) => string;
  // Events whose times of a day are one line on the day's row (Wild Brawl).
  timesInLine: (eventTypeId: string) => boolean;
  // A phase's or a step's instructions, opened from its row like points.
  phaseNoteOf: (phaseId: string) => string;
  stepNoteOf: (stepId: string) => string;
  dayNameOf: (eventTypeId: string, dayNumber: number) => string;
  // The scoring rows of one day, by their ids.
  pointSourceIdsForDay: (eventTypeId: string, dayNumber: number) => string[];
  // Whether a day of this event has scoring rows of its own.
  hasOwnPoints: (eventTypeId: string, dayNumber: number) => boolean;
  openingsOf: (occurrence: Occurrence) => { start: number; end: number; label: string }[] | null;
  marksOpeningsByLabel: (eventTypeId: string) => boolean;
  // The row the player tapped, which stays marked.
  pickedRowKey?: string | null;
  // What was tapped to open the event (a bar, a day of it, a part on it) and the minute
  // it starts. When the event is not running, the row it points to is marked.
  tappedKey?: string | null;
  tappedMinute?: number;
}

function byMinute(left: { minute: number }, right: { minute: number }): number {
  return left.minute - right.minute;
}

// Everything belonging to the same event as this run: its parts, and the whole it is
// a part of. A long event keeps parts that start well after it does.
export function familyOccurrences(
  occurrence: Occurrence,
  allNearby: Occurrence[],
  partOfByEventTypeId: Map<string, string | null>
): Occurrence[] {
  const familyId = partOfByEventTypeId.get(occurrence.eventTypeId) ?? occurrence.eventTypeId;
  // An event with no parts that is not a part itself is its own whole family, as in the
  // old app. Without this, a weekly event (Alliance Championship) pulled in last
  // week's run as if it were part of this one.
  const isPart = Boolean(partOfByEventTypeId.get(occurrence.eventTypeId));
  const hasParts = Array.from(partOfByEventTypeId.values()).includes(familyId);
  if (!isPart && !hasParts) return [occurrence];
  const reach = Math.max(10, occurrence.lengthDays || 0);
  return allNearby.filter(other => {
    const otherFamily = partOfByEventTypeId.get(other.eventTypeId) ?? other.eventTypeId;
    if (otherFamily !== familyId) return false;
    if (other.allianceIds.join(',') !== occurrence.allianceIds.join(',')) return false;
    return Math.abs(other.originalDay - occurrence.originalDay) <= reach;
  }).sort((left, right) => left.startMinute - right.startMinute);
}

// The days and timed steps of one event in the family.
function memberContent(member: Occurrence, options: TreeOptions): TreeRow[] {
  const rows: TreeRow[] = [];

  for (let dayNumber = 1; dayNumber <= member.lengthDays; dayNumber++) {
    const labels: string[] = [];
    // The instructions of the day's steps without a time, which the day's row stands for.
    const notes: string[] = [];
    const dayName = options.dayNameOf(member.eventTypeId, dayNumber);
    if (dayName) labels.push(dayName);
    for (const step of options.stepsByEventType.get(member.eventTypeId) ?? []) {
      if (step.startTimeUtc || step.dayNumber !== dayNumber) continue;
      const label = options.stepLabel(step.id);
      if (!labels.includes(label)) labels.push(label);
      const note = options.stepNoteOf(step.id);
      if (note && !notes.includes(note)) notes.push(note);
    }
    const hasOwnPoints = options.hasOwnPoints(member.eventTypeId, dayNumber);
    if (!labels.length && !hasOwnPoints) continue;
    rows.push({
      minute: dayNumber === 1 ? member.startMinute : (member.startDay + dayNumber - 1) * MINUTES_PER_DAY,
      label: labels.join(' · ') || 'Day ' + dayNumber, note: notes.join(' '),
      eventTypeId: member.eventTypeId, occurrence: member, dayNumber, level: 1,
      pointSourceIds: hasOwnPoints ? options.pointSourceIdsForDay(member.eventTypeId, dayNumber) : []
    });
  }

  // An event played at set times each day: a row where each window opens, named as the
  // game names it, and a row where it closes.
  if (options.timesInLine(member.eventTypeId)) {
    const whole = { start: member.startMinute, end: member.endMinute };
    for (const window of playWindowsIn(member, options.stepsByEventType.get(member.eventTypeId) ?? [], whole)) {
      rows.push({
        minute: window.start, label: options.stepLabel(window.stepId), playOpensUntil: window.end,
        eventTypeId: member.eventTypeId, occurrence: member, level: 0, pointSourceIds: []
      });
      rows.push({
        minute: window.end, label: '', isPlayClose: true,
        eventTypeId: member.eventTypeId, occurrence: member, level: 1, pointSourceIds: []
      });
    }
  }
  const timedSteps = options.timesInLine(member.eventTypeId)
    ? [] : options.stepsByEventType.get(member.eventTypeId) ?? [];
  for (const step of timedSteps) {
    if (!step.startTimeUtc || step.dayNumber > member.lengthDays) continue;
    rows.push({
      minute: (member.startDay + step.dayNumber - 1) * MINUTES_PER_DAY +
        options.minutesFromTime(step.startTimeUtc),
      label: options.stepLabel(step.id), note: options.stepNoteOf(step.id),
      eventTypeId: member.eventTypeId, occurrence: member, level: 1, pointSourceIds: []
    });
  }

  return rows.sort(byMinute);
}

export function buildEventTree(
  occurrence: Occurrence,
  allNearby: Occurrence[],
  options: TreeOptions
): EventTree {
  const members = familyOccurrences(occurrence, allNearby, options.partOfByEventTypeId)
    .filter(member => !member.wasCancelled || member.key === occurrence.key);

  // A part short enough to sit inside a longer member hangs under it; a long one gets
  // its own line beside the main one.
  const mainMembers: Occurrence[] = [];
  const sideParts: Occurrence[] = [];
  const nestedParts: { part: Occurrence; host: Occurrence }[] = [];

  for (const member of members) {
    const isPart = Boolean(options.partOfByEventTypeId.get(member.eventTypeId));
    const host = isPart ? members.find(other =>
      other !== member && other.startMinute <= member.startMinute &&
      other.endMinute >= member.endMinute &&
      other.endMinute - other.startMinute > member.endMinute - member.startMinute) : undefined;
    if (!host) mainMembers.push(member);
    else if (member.endMinute - member.startMinute > MINUTES_PER_DAY) sideParts.push(member);
    else nestedParts.push({ part: member, host });
  }

  const rows: TreeRow[] = [];
  const isSingle = mainMembers.length === 1;

  for (const member of mainMembers) {
    const content = memberContent(member, options);
    const partsHere: TreeRow[] = nestedParts
      .filter(nested => nested.host === member)
      .map(nested => ({
        minute: nested.part.startMinute,
        label: options.nameOf(nested.part.eventTypeId),
        eventTypeId: nested.part.eventTypeId, occurrence: nested.part, level: 1,
        pointSourceIds: options.pointSourceIdsForDay(nested.part.eventTypeId, 1),
        isCancelled: nested.part.wasCancelled
      }));

    const phaseRows: TreeRow[] = (options.phasesByEventType.get(member.eventTypeId) ?? [])
      .map(phase => {
        const span = phaseMinutes(member, phase, options.minutesFromTime);
        if (!span) return null;
        return {
          minute: span.start, endMinute: span.end, label: options.phaseNameOf(phase.id),
          note: options.phaseNoteOf(phase.id),
          eventTypeId: member.eventTypeId, occurrence: member, level: 0, pointSourceIds: []
        } as TreeRow;
      })
      .filter((row): row is TreeRow => row !== null)
      .sort(byMinute);

    if (isSingle && phaseRows.length) {
      // The phases are the main line; the days and steps of each phase sit under it.
      // A phase is written like State of Power's stages (owner, 25 Nov).
      const inside = content.concat(partsHere);
      phaseRows.forEach((phaseRow, phaseIndex) => {
        rows.push({ ...phaseRow, isStage: true });
        const isLastPhase = phaseIndex === phaseRows.length - 1;
        inside
          .filter(row => row.minute >= phaseRow.minute &&
            (row.minute < (phaseRow.endMinute as number) ||
              (isLastPhase && row.minute === phaseRow.endMinute)))
          .sort(byMinute)
          .forEach(row => rows.push(row));
      });
    } else if (isSingle) {
      // No phases: the days themselves are the main line.
      for (const row of content) rows.push({ ...row, level: 0 });
      for (const row of partsHere) rows.push(row);
    } else {
      // Several events in one run: each on the main line, everything else under it.
      const hasDays = content.some(row => row.dayNumber);
      const stageName = options.stageNameOf(member.eventTypeId);
      rows.push({
        minute: member.startMinute, label: stageName || options.nameOf(member.eventTypeId),
        isStage: Boolean(stageName),
        eventTypeId: member.eventTypeId, occurrence: member, level: 0,
        isCancelled: member.wasCancelled,
        pointSourceIds: hasDays ? [] : options.pointSourceIdsForDay(member.eventTypeId, 1)
      });
      phaseRows.concat(content, partsHere).sort(byMinute)
        .forEach(row => rows.push({ ...row, level: 1 }));
    }
  }

  // Parts that are only open at certain times get their own narrow column, with a row
  // where each opening starts and, unless the openings are named, one where it closes.
  const openingSides = sideParts
    .filter(part => options.openingsOf(part))
    .slice(0, 2)
    .map(part => ({ occurrence: part, openings: options.openingsOf(part) }));

  for (const side of openingSides) {
    const labelled = options.marksOpeningsByLabel(side.occurrence.eventTypeId);
    const name = options.nameOf(side.occurrence.eventTypeId);
    for (const opening of side.openings ?? []) {
      rows.push({
        minute: opening.start,
        label: labelled ? name + (opening.label ? ' ' + opening.label : '') : name,
        subLabel: labelled ? '' : opening.label,
        eventTypeId: side.occurrence.eventTypeId, occurrence: side.occurrence,
        level: 1, isSideRow: true, openingPartKey: side.occurrence.key,
        openingStart: opening.start, pointSourceIds: []
      });
      if (!labelled) {
        rows.push({
          minute: opening.end, label: '',
          eventTypeId: side.occurrence.eventTypeId, occurrence: side.occurrence,
          level: 1, isSideRow: true, openingPartKey: side.occurrence.key,
          openingEnd: opening.end, pointSourceIds: []
        });
      }
    }
  }

  // A part running beside the event for days (Trade Route) gets one line of its own.
  const side: SidePart | null = openingSides.length
    ? null
    : sideParts[0] ? { occurrence: sideParts[0], openings: null } : null;

  if (side) {
    const part = side.occurrence;
    if (!rows.some(row => row.minute === part.startMinute)) {
      rows.push({
        minute: part.startMinute, label: options.shortNameOf(part.eventTypeId) + ' starts',
        eventTypeId: part.eventTypeId, occurrence: part, level: 1, isSideRow: true,
        pointSourceIds: []
      });
    }
    for (const step of options.stepsByEventType.get(part.eventTypeId) ?? []) {
      if (!step.startTimeUtc) continue;
      const minute = (part.startDay + step.dayNumber - 1) * MINUTES_PER_DAY +
        options.minutesFromTime(step.startTimeUtc);
      if (minute <= part.startMinute || minute >= part.endMinute) continue;
      rows.push({
        minute, label: options.stepLabel(step.id), note: options.stepNoteOf(step.id),
        eventTypeId: part.eventTypeId, occurrence: part, level: 1,
        isSideRow: true, isSideStep: true, pointSourceIds: []
      });
    }
    rows.push({
      minute: part.endMinute, label: '', eventTypeId: part.eventTypeId, occurrence: part,
      level: 1, isSideRow: true, isSideEnd: true, pointSourceIds: []
    });
  }

  // Every timeline ends with a cap on the line, showing the time and no words.
  const lastMember = mainMembers.slice().sort((left, right) => left.endMinute - right.endMinute).pop();
  if (lastMember && rows.length) {
    rows.push({
      minute: lastMember.endMinute, label: '', eventTypeId: lastMember.eventTypeId,
      occurrence: lastMember, level: 0, isEndRow: true, pointSourceIds: []
    });
  }

  const ordered = orderRows(rows, isSingle);
  for (const row of ordered) row.key = row.occurrence.key + '|' + row.minute;

  // The marked row: the one tapped, or while the run is on, the last one that started.
  const runStart = Math.min(...members.map(member => member.startMinute));
  const runEnd = Math.max(...members.map(member => member.endMinute));
  const now = nowMinute();
  const picked = options.pickedRowKey
    ? ordered.find(row => row.key === options.pickedRowKey) : undefined;
  const isRunning = now >= runStart && now < runEnd;
  const started = isRunning
    ? ordered.filter(row => row.minute <= now && !row.isSideRow && !row.isEndRow && !row.openingPartKey)
    : [];
  // The pin marks only the row that is on now, while the event runs (owner, 25 Nov). A row
  // tapped, or the row of the day tapped on the calendar, is highlighted instead.
  const current = isRunning ? started[started.length - 1] : undefined;
  if (current) current.isCurrent = true;
  const highlighted = picked ?? (isRunning ? undefined : tappedRow(ordered, options));
  if (highlighted) highlighted.isPicked = true;

  return {
    rows: ordered,
    side,
    openingSides,
    hasPoints: ordered.some(row => row.pointSourceIds.length > 0),
    currentRowKey: current?.key ?? ''
  };
}

// The row for what was tapped: the last row of the tapped run that has started by the
// tapped minute, or that run's first row. Without a run of its own, the last row of the
// event started by then.
function tappedRow(rows: TreeRow[], options: TreeOptions): TreeRow | undefined {
  const usable = rows.filter(row => !row.isSideRow && !row.isEndRow && !row.openingPartKey);
  if (!usable.length) return undefined;
  const tappedKey = options.tappedKey ?? '';
  const minute = options.tappedMinute ?? NaN;
  const ofTapped = usable.filter(row =>
    tappedKey === row.occurrence.key || tappedKey.startsWith(row.occurrence.key + '|'));
  const pool = ofTapped.length ? ofTapped : usable;
  if (Number.isNaN(minute)) return pool[0];
  const started = pool.filter(row => row.minute <= minute);
  return started[started.length - 1] ?? pool[0];
}

// Main-line order is kept, and the rows under a main row stay under it. Side rows slot
// into time order among the rest.
function orderRows(rows: TreeRow[], isSingle: boolean): TreeRow[] {
  const withOrder = rows.map((row, index) => ({ row, index }));
  const hasPhasesOnMainLine = rows.some(row => row.level === 0 && row.endMinute !== undefined);
  const sorted = isSingle && !hasPhasesOnMainLine
    ? withOrder.slice().sort((left, right) =>
        left.row.minute - right.row.minute ||
        left.row.level - right.row.level ||
        left.index - right.index).map(one => one.row)
    : rows.slice();

  const ordered: TreeRow[] = [];
  for (const row of sorted) {
    if (!row.isSideRow) {
      ordered.push(row);
      continue;
    }
    let at = ordered.length;
    while (at > 0 && ordered[at - 1].minute > row.minute) at -= 1;
    ordered.splice(at, 0, row);
  }
  return ordered;
}
