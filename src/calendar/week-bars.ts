// Laying one week's bars out in rows.
//
// Bars are not placed one by one. Everything belonging to the same event — its parts,
// its phases, the alliance count bar — is gathered into a family first, and the family
// is placed as a block, so an event's pieces stay together instead of scattering down
// the week. Inside a family three things get folded together:
//   a short part that fits inside a longer bar of the same event is drawn on that bar
//     (Castle Battle inside SvS Battle);
//   parts that follow each other become one long bar (SvS matchmaking, preparation,
//     battle and field triage read as one week of SvS);
//   phases that follow each other become one bar divided by white lines.

import { MINUTES_PER_DAY } from './days.ts';
import { shownMinute, shownDayOf, windowOfShownDay } from './time-mode.ts';
import type { Bar } from './bars.ts';

// A stretch of a bar with its own name: a named day of the event, or one phase.
export interface NamedSpan {
  name: string;
  shortName?: string;
  start: number;
  end: number;
  isFirst?: boolean;
}

// One part of an event following another on the same bar.
export interface ChainPart {
  bar: Bar;
  start: number;
  end: number;
  insideParts: Bar[];
}

export interface WeekPiece {
  bar: Bar;
  start: number;
  end: number;
  firstColumn: number;
  lastColumn: number;
  // Where the bar starts in its first day and ends in its last day, as a share of the
  // day. 0 is midnight, 1 is the next midnight.
  leftFraction: number;
  rightFraction: number;
  segments: NamedSpan[];
  insideParts: Bar[];
  chainParts: ChainPart[];
  phaseParts: NamedSpan[];
  lane: number;
}

export interface WeekPieceOptions {
  // The named days of an event, in order, when it has them.
  daySegmentsOf: (bar: Bar) => NamedSpan[];
  // Which bigger event a part belongs to.
  partOfByEventTypeId: Map<string, string | null>;
  categoryOf: (eventTypeId: string) => string;
  // The order the filter chips are in, so families stack in the same order.
  categoryOrder: string[];
  sortOrderOf: (eventTypeId: string) => number;
  phaseNameOf: (phaseId: string) => string;
  // A shorter name for a phase, used where the full one does not fit.
  phaseShortNameOf?: (phaseId: string) => string;
}

interface Family {
  mainEventTypeId: string;
  category: string;
  pieces: WeekPiece[];
}

function lengthOf(piece: WeekPiece): number {
  return piece.bar.endMinute - piece.bar.startMinute;
}

function overlaps(left: { start: number; end: number }, right: { start: number; end: number }): boolean {
  return left.start < right.end && right.start < left.end;
}

export function weekPieces(
  bars: Bar[],
  weekStart: number,
  options: WeekPieceOptions
): WeekPiece[] {
  const weekStartMinute = windowOfShownDay(weekStart).start;
  const weekEndMinute = windowOfShownDay(weekStart + 6).end;
  const families = new Map<string, Family>();

  for (const bar of bars) {
    if (bar.endMinute <= weekStartMinute || bar.startMinute >= weekEndMinute) continue;
    const start = Math.max(bar.startMinute, weekStartMinute);
    const end = Math.min(bar.endMinute, weekEndMinute);
    const firstColumn = shownDayOf(start) - weekStart;
    const lastColumn = shownDayOf(end - 1) - weekStart;

    // Named days belong to bars of whole events. A phase bar is already one part of
    // its event, so it gets none.
    const allSegments = bar.phaseId ? [] : options.daySegmentsOf(bar);

    const piece: WeekPiece = {
      bar, start, end, firstColumn, lastColumn,
      segments: allSegments
        .map(segment => ({
          name: segment.name, shortName: segment.shortName,
          start: Math.max(segment.start, start), end: Math.min(segment.end, end),
          isFirst: segment.start <= start
        }))
        .filter(segment => segment.end > segment.start &&
          segment.end > bar.startMinute && segment.start < bar.endMinute),
      insideParts: [], chainParts: [], phaseParts: [],
      leftFraction: (shownMinute(start) - (weekStart + firstColumn) * MINUTES_PER_DAY) / MINUTES_PER_DAY,
      rightFraction: (shownMinute(end) - (weekStart + lastColumn) * MINUTES_PER_DAY) / MINUTES_PER_DAY,
      lane: 0
    };

    // An event's own day for the alliances (Foundry Battle, Canyon Clash) belongs to the
    // same family as its phases, so it sits on their row, and the family stacks with the
    // alliance events (Roxanne, 26 Nov: "they should all be tied together in the same row").
    const partOf = options.partOfByEventTypeId.get(bar.eventTypeId);
    const mainEventTypeId = partOf ?? bar.eventTypeId;
    const category = bar.count || bar.allianceIds.length ? 'alliance' : options.categoryOf(bar.eventTypeId);
    let family = families.get(mainEventTypeId);
    if (!family) {
      family = { mainEventTypeId, category, pieces: [] };
      families.set(mainEventTypeId, family);
    }
    if (options.categoryOrder.indexOf(category) < options.categoryOrder.indexOf(family.category)) {
      family.category = category;
    }
    family.pieces.push(piece);
  }

  const familyList = [...families.values()];
  if (!familyList.length) return [];

  foldInsideParts(familyList, options);
  foldChainParts(familyList, options);
  foldPhaseParts(familyList, options);
  sortFamilies(familyList, options);
  return placeInLanes(familyList);
}

// A short part drawn on top of a longer bar of its own event, rather than beside it.
function foldInsideParts(familyList: Family[], options: WeekPieceOptions): void {
  for (const family of familyList) {
    const isInside = new Set<WeekPiece>();
    const shortestFirst = family.pieces.slice().sort((left, right) => lengthOf(left) - lengthOf(right));
    for (const piece of shortestFirst) {
      const partOf = options.partOfByEventTypeId.get(piece.bar.eventTypeId);
      if (piece.bar.count || !partOf) continue;
      if (lengthOf(piece) > MINUTES_PER_DAY || piece.insideParts.length) continue;
      const host = family.pieces.find(other =>
        other !== piece && !isInside.has(other) && !other.bar.count && !other.segments.length &&
        other.bar.startMinute <= piece.bar.startMinute &&
        other.bar.endMinute >= piece.bar.endMinute && lengthOf(other) > lengthOf(piece));
      if (!host) continue;
      isInside.add(piece);
      host.insideParts.push(piece.bar);
    }
    family.pieces = family.pieces.filter(piece => !isInside.has(piece));
  }
}

// Parts of one event that follow each other become a single bar: the first part in
// the week carries the ones starting before or as it ends.
function foldChainParts(familyList: Family[], options: WeekPieceOptions): void {
  for (const family of familyList) {
    const chained = new Set<WeekPiece>();
    let host: WeekPiece | null = null;
    for (const piece of family.pieces.slice().sort((left, right) => left.start - right.start)) {
      const partOf = options.partOfByEventTypeId.get(piece.bar.eventTypeId);
      if (piece.bar.count || !partOf) continue;
      if (host && piece.start >= host.bar.startMinute && piece.start <= host.end && piece.end > host.end) {
        host.chainParts.push({
          bar: piece.bar, start: Math.max(piece.start, host.end), end: piece.end,
          insideParts: piece.insideParts
        });
        host.end = piece.end;
        host.lastColumn = piece.lastColumn;
        host.rightFraction = piece.rightFraction;
        chained.add(piece);
        continue;
      }
      host = piece;
    }
    family.pieces = family.pieces.filter(piece => !chained.has(piece));
  }
}

// Phases of one run that follow each other become one bar, each phase named between
// white lines. A short gap with no bar of its own stays with the phase before it.
function foldPhaseParts(familyList: Family[], options: WeekPieceOptions): void {
  for (const family of familyList) {
    const byRun = new Map<string, WeekPiece[]>();
    for (const piece of family.pieces) {
      if (!piece.bar.phaseId || piece.bar.count) continue;
      const runKey = piece.bar.key.split('|')[0];
      const forRun = byRun.get(runKey) ?? [];
      forRun.push(piece);
      byRun.set(runKey, forRun);
    }
    const chained = new Set<WeekPiece>();
    for (const pieces of byRun.values()) {
      let host: WeekPiece | null = null;
      for (const piece of pieces.sort((left, right) => left.start - right.start)) {
        const name = options.phaseNameOf(piece.bar.phaseId as string);
        const shortName = options.phaseShortNameOf?.(piece.bar.phaseId as string) || undefined;
        piece.phaseParts = [{ name, shortName, start: piece.start, end: piece.end }];
        if (host && piece.start - host.end < MINUTES_PER_DAY) {
          const last = host.phaseParts[host.phaseParts.length - 1];
          last.end = Math.max(host.end, piece.start);
          host.phaseParts.push({ name, shortName, start: Math.max(piece.start, host.end), end: piece.end });
          host.end = Math.max(host.end, piece.end);
          host.lastColumn = piece.lastColumn;
          host.rightFraction = piece.rightFraction;
          chained.add(piece);
          continue;
        }
        host = piece;
      }
    }
    family.pieces = family.pieces.filter(piece => !chained.has(piece));
  }
}

// Families stack in the filters' order, then the longest in the week first, then the
// catalog's own order, so the same week always looks the same.
function sortFamilies(familyList: Family[], options: WeekPieceOptions): void {
  const weekLength = (family: Family) =>
    Math.max(...family.pieces.map(piece => piece.end)) -
    Math.min(...family.pieces.map(piece => piece.start));
  familyList.sort((left, right) =>
    options.categoryOrder.indexOf(left.category) - options.categoryOrder.indexOf(right.category) ||
    weekLength(right) - weekLength(left) ||
    options.sortOrderOf(left.mainEventTypeId) - options.sortOrderOf(right.mainEventTypeId) ||
    left.mainEventTypeId.localeCompare(right.mainEventTypeId));
}

// The run a piece belongs to: its schedule and planned date, without the phase.
function runOf(piece: WeekPiece): string {
  return piece.bar.key.split('|').slice(0, 2).join('|');
}

// The blocks a family is placed in. A family with a day for the alliances keeps all of
// its pieces together on one row. Otherwise each run of the event is placed on its own,
// so a run ending early in the week and the next one starting at its end do not have to
// share a row (Roxanne, 26 Nov, Hall of Heroes).
function blocksOf(family: Family): WeekPiece[][] {
  if (family.pieces.some(piece => piece.bar.count)) return [family.pieces];
  const byRun = new Map<string, WeekPiece[]>();
  for (const piece of family.pieces) {
    const run = runOf(piece);
    byRun.set(run, (byRun.get(run) ?? []).concat(piece));
  }
  return [...byRun.values()];
}

// Each block takes the highest set of rows where all of its pieces fit together.
function placeInLanes(familyList: Family[]): WeekPiece[] {
  const lanes: WeekPiece[][] = [];
  const laneIsFree = (lane: number, piece: WeekPiece) =>
    !(lanes[lane] ?? []).some(other => overlaps(other, piece));
  const placed: WeekPiece[] = [];

  for (const block of familyList.flatMap(blocksOf).map(pieces => ({ pieces }))) {
    const family = block;
    family.pieces.sort((left, right) => left.start - right.start);
    // Inside the block a piece only goes under another when their times overlap.
    const ownRows: WeekPiece[][] = [];
    const rowOf = new Map<WeekPiece, number>();
    for (const piece of family.pieces) {
      let row = 0;
      while ((ownRows[row] ?? []).some(other => overlaps(other, piece))) row += 1;
      ownRows[row] = ownRows[row] ?? [];
      ownRows[row].push(piece);
      rowOf.set(piece, row);
    }
    let firstLane = 0;
    while (!family.pieces.every(piece => laneIsFree(firstLane + (rowOf.get(piece) as number), piece))) {
      firstLane += 1;
    }
    for (const piece of family.pieces) {
      const lane = firstLane + (rowOf.get(piece) as number);
      lanes[lane] = lanes[lane] ?? [];
      lanes[lane].push(piece);
      piece.lane = lane;
      placed.push(piece);
    }
  }
  return placed;
}
