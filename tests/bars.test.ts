import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dayFromText, MINUTES_PER_DAY, minutesFromTime } from '../src/calendar/days.ts';
import {
  buildBarsForRange, filterKey, findStripeParts, phaseMinutes, shownDaysOf, weeksOfMonth,
  type EventPhase
} from '../src/calendar/bars.ts';
import { weekPieces } from '../src/calendar/week-bars.ts';
import { daySegments } from '../src/calendar/day-segments.ts';
import type { Occurrence } from '../src/calendar/occurrences.ts';

function occurrence(bits: {
  key?: string; eventTypeId?: string; startDate: string; days?: number;
  startTime?: string; endTime?: string; allianceIds?: string[];
}): Occurrence {
  const startDay = dayFromText(bits.startDate);
  const lengthDays = bits.days ?? 1;
  const startMinute = startDay * MINUTES_PER_DAY + minutesFromTime(bits.startTime ?? null);
  const endTime = minutesFromTime(bits.endTime ?? null);
  let endMinute = endTime > 0
    ? (startDay + lengthDays - 1) * MINUTES_PER_DAY + endTime
    : (startDay + lengthDays) * MINUTES_PER_DAY;
  if (endMinute <= startMinute) endMinute += MINUTES_PER_DAY;
  return {
    key: bits.key ?? bits.eventTypeId ?? 'k', scheduleId: 's',
    eventTypeId: bits.eventTypeId ?? 'bear',
    allianceIds: bits.allianceIds ?? [], groupNumber: null,
    startDay, endDay: startDay + lengthDays - 1, lengthDays, originalDay: startDay,
    startTimeUtc: bits.startTime ?? '', endTimeUtc: bits.endTime ?? '',
    startMinute, endMinute, note: '', wasChanged: false, wasCancelled: false
  };
}

const noPhases = new Map<string, EventPhase[]>();
const noParts = new Map<string, string | null>();

const options = {
  phasesByEventType: noPhases, minutesFromTime,
  isDetailsOnly: () => false, categoryOf: () => 'state',
  partOfByEventTypeId: noParts, shownCategories: new Set(['state', 'alliance'])
};

test('an event with no phases makes one bar', () => {
  const run = occurrence({ startDate: '2026-11-20', days: 3 });
  const bars = buildBarsForRange([run], dayFromText('2026-11-16'), dayFromText('2026-11-22'), options);
  assert.equal(bars.length, 1);
  assert.equal(bars[0].startMinute, run.startMinute);
});

test('an event with phases makes one bar per phase, skipping the hidden ones', () => {
  const phases: EventPhase[] = [
    { id: 'p1', eventTypeId: 'fort', fromDay: 1, toDay: 2, startTimeUtc: null, endTimeUtc: null, hideBar: false, sortOrder: 1 },
    { id: 'p2', eventTypeId: 'fort', fromDay: 3, toDay: 4, startTimeUtc: null, endTimeUtc: null, hideBar: true, sortOrder: 2 }
  ];
  const run = occurrence({ startDate: '2026-11-16', days: 4, eventTypeId: 'fort' });
  const bars = buildBarsForRange([run], dayFromText('2026-11-16'), dayFromText('2026-11-22'),
    { ...options, phasesByEventType: new Map([['fort', phases]]) });
  assert.deepEqual(bars.map(bar => bar.phaseId), ['p1']);
});

test('every alliance running the same event on a day becomes one bar with a count', () => {
  const runs = ['a', 'b', 'c'].map(id => occurrence({
    key: 'bear-' + id, startDate: '2026-11-20', startTime: '02:00', allianceIds: [id]
  }));
  const bars = buildBarsForRange(runs, dayFromText('2026-11-16'), dayFromText('2026-11-22'),
    { ...options, myAllianceIds: ['a', 'b', 'c'] });
  assert.equal(bars.length, 1);
  assert.equal(bars[0].count, 3);
});

test('alliance times are left out until the player says which alliance is theirs', () => {
  const run = occurrence({ startDate: '2026-11-20', startTime: '02:00', allianceIds: ['a'] });
  const bars = buildBarsForRange([run], dayFromText('2026-11-16'), dayFromText('2026-11-22'), options);
  assert.deepEqual(bars, []);
});

test('an event unticked inside its filter gets no bar', () => {
  const run = occurrence({ startDate: '2026-11-20' });
  const bars = buildBarsForRange([run], dayFromText('2026-11-16'), dayFromText('2026-11-22'),
    { ...options, hiddenEvents: new Set(['state|bear']) });
  assert.deepEqual(bars, []);
});

test('a part is filtered with the event it belongs to', () => {
  assert.equal(filterKey('state', 'svs-battle', new Map([['svs-battle', 'svs']])), 'state|svs');
  assert.equal(filterKey('state', 'bear', new Map([['bear', null]])), 'state|bear');
});

test('a phase is cut to the event it belongs to', () => {
  const run = occurrence({ startDate: '2026-11-16', days: 2 });
  const phase: EventPhase = {
    id: 'p', eventTypeId: 'bear', fromDay: 1, toDay: 9,
    startTimeUtc: null, endTimeUtc: null, hideBar: false, sortOrder: 1
  };
  const span = phaseMinutes(run, phase, minutesFromTime);
  assert.equal(span?.end, run.endMinute, 'never past the end of the run');
});

test('a part running for days inside its event becomes a line under it, not a bar', () => {
  const main = occurrence({ key: 'season', eventTypeId: 'season', startDate: '2026-11-01', days: 30 });
  const part = occurrence({ key: 'trade', eventTypeId: 'trade-route', startDate: '2026-11-10', days: 5 });
  const found = findStripeParts([main, part], new Map([['trade-route', 'season']]));
  assert.ok(found.partKeys.has('trade'));
  assert.deepEqual(found.byMainKey.get('season')?.map(one => one.key), ['trade']);
});

test('an alliance run ending at the reset belongs to the day before', () => {
  const run = occurrence({ startDate: '2026-11-20', startTime: '02:00', allianceIds: ['a'] });
  const days = shownDaysOf(run);
  assert.equal(days.first, dayFromText('2026-11-20'));
  assert.equal(days.last, dayFromText('2026-11-20'));
});

test('named days become stretches of the bar, and a repeated note does not', () => {
  const run = occurrence({ startDate: '2026-11-16', days: 3, eventTypeId: 'svs-prep' });
  const bars = buildBarsForRange([run], dayFromText('2026-11-16'), dayFromText('2026-11-22'), options);
  const named = daySegments(bars[0], (_id, day) => ['Troop Revival', 'Hero Recruitment', 'Build'][day - 1]);
  assert.deepEqual(named.map(segment => segment.name), ['Troop Revival', 'Hero Recruitment', 'Build']);
  const repeated = daySegments(bars[0], () => 'Same note');
  assert.deepEqual(repeated, [], 'a note on every day is about the event, not one day');
});

const pieceOptions = {
  daySegmentsOf: () => [],
  partOfByEventTypeId: noParts,
  categoryOf: () => 'state',
  categoryOrder: ['state', 'alliance', 'personal', 'deals'],
  sortOrderOf: () => 1,
  phaseNameOf: (id: string) => id
};

test('bars that overlap in a week go on different rows', () => {
  const runs = [
    occurrence({ key: 'one', eventTypeId: 'one', startDate: '2026-11-16', days: 4 }),
    occurrence({ key: 'two', eventTypeId: 'two', startDate: '2026-11-17', days: 4 })
  ];
  const bars = buildBarsForRange(runs, dayFromText('2026-11-16'), dayFromText('2026-11-22'), options);
  const pieces = weekPieces(bars, dayFromText('2026-11-16'), pieceOptions);
  assert.deepEqual(pieces.map(piece => piece.lane).sort(), [0, 1]);
});

test('bars that do not overlap share a row', () => {
  const runs = [
    occurrence({ key: 'one', eventTypeId: 'one', startDate: '2026-11-16', days: 2 }),
    occurrence({ key: 'two', eventTypeId: 'two', startDate: '2026-11-20', days: 2 })
  ];
  const bars = buildBarsForRange(runs, dayFromText('2026-11-16'), dayFromText('2026-11-22'), options);
  const pieces = weekPieces(bars, dayFromText('2026-11-16'), pieceOptions);
  assert.deepEqual(pieces.map(piece => piece.lane), [0, 0]);
});

test('parts of one event that follow each other become one bar', () => {
  const parts = new Map<string, string | null>([['svs-prep', 'svs'], ['svs-battle', 'svs']]);
  const runs = [
    occurrence({ key: 'prep', eventTypeId: 'svs-prep', startDate: '2026-11-16', days: 4 }),
    occurrence({ key: 'battle', eventTypeId: 'svs-battle', startDate: '2026-11-20', days: 1 })
  ];
  const bars = buildBarsForRange(runs, dayFromText('2026-11-16'), dayFromText('2026-11-22'),
    { ...options, partOfByEventTypeId: parts });
  const pieces = weekPieces(bars, dayFromText('2026-11-16'), { ...pieceOptions, partOfByEventTypeId: parts });
  assert.equal(pieces.length, 1, 'the battle is carried on the preparation bar');
  assert.deepEqual(pieces[0].chainParts.map(part => part.bar.eventTypeId), ['svs-battle']);
});

test('a bar is cut to the days it covers inside the week', () => {
  const run = occurrence({ key: 'long', eventTypeId: 'long', startDate: '2026-11-13', days: 10 });
  const bars = buildBarsForRange([run], dayFromText('2026-11-16'), dayFromText('2026-11-22'), options);
  const pieces = weekPieces(bars, dayFromText('2026-11-16'), pieceOptions);
  assert.equal(pieces[0].firstColumn, 0);
  assert.equal(pieces[0].lastColumn, 6);
});

test('a month shows every week it touches', () => {
  const weeks = weeksOfMonth(dayFromText('2026-11-01'), 30);
  assert.equal(weeks.length, 6);
  assert.equal(weeks[0], dayFromText('2026-10-26'));
});
