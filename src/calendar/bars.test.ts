import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dayFromText, minutesFromTime, MINUTES_PER_DAY } from '../src/calendar/days.ts';
import { buildBars, piecesForWeek, weeksOfMonth, type EventPhase } from '../src/calendar/bars.ts';
import type { Occurrence } from '../src/calendar/occurrences.ts';

function occurrence(bits: Partial<Occurrence> & { startDate: string; days?: number }): Occurrence {
  const startDay = dayFromText(bits.startDate);
  const lengthDays = bits.days ?? 1;
  return {
    key: bits.key ?? 'k', scheduleId: bits.scheduleId ?? 's', eventTypeId: bits.eventTypeId ?? 'bear',
    allianceIds: bits.allianceIds ?? [], groupNumber: null,
    startDay, endDay: startDay + lengthDays - 1, lengthDays, originalDay: startDay,
    startTimeUtc: '', endTimeUtc: '',
    startMinute: startDay * MINUTES_PER_DAY,
    endMinute: (startDay + lengthDays) * MINUTES_PER_DAY,
    note: '', wasChanged: false, wasCancelled: false
  };
}

const noPhases = {
  phasesByEventType: new Map<string, EventPhase[]>(),
  minutesFromTime,
  isDetailsOnly: () => false,
  // Everything shows, so these tests are about the bars rather than the filters.
  shownCategories: new Set(['state', 'alliance', 'personal', 'deals']),
  categoryOf: () => 'state'
};

test('a state event with no phases makes one bar', () => {
  const bars = buildBars([occurrence({ startDate: '2026-11-20', eventTypeId: 'bia' })], noPhases);
  assert.equal(bars.length, 1);
  assert.equal(bars[0].count, 0);
});

test('an event with phases makes one bar per phase, skipping the hidden ones', () => {
  const phases: EventPhase[] = [
    { id: 'ph1', eventTypeId: 'fortress-battles', fromDay: 1, toDay: 3, startTimeUtc: null, endTimeUtc: null, hideBar: false, sortOrder: 1 },
    { id: 'ph2', eventTypeId: 'fortress-battles', fromDay: 4, toDay: 4, startTimeUtc: null, endTimeUtc: null, hideBar: false, sortOrder: 2 },
    { id: 'ph3', eventTypeId: 'fortress-battles', fromDay: 4, toDay: 4, startTimeUtc: null, endTimeUtc: null, hideBar: true, sortOrder: 3 }
  ];
  const bars = buildBars(
    [occurrence({ startDate: '2026-11-17', days: 4, eventTypeId: 'fortress-battles' })],
    { ...noPhases, phasesByEventType: new Map([['fortress-battles', phases]]) });
  assert.equal(bars.length, 2, 'the hidden phase gets no bar');
  assert.deepEqual(bars.map(bar => bar.phaseName), ['ph1', 'ph2']);
});

test('every alliance running the same event on a day shares one bar with a count', () => {
  const eight = ['dvl', 'top', 'sky', 'fun', 'ruu', 'dvl-academy', 'top-academy', 'sky-academy']
    .flatMap(allianceId => [1, 2].map(group =>
      occurrence({ startDate: '2026-11-20', eventTypeId: 'bear', allianceIds: [allianceId], key: allianceId + group })));
  const bars = buildBars(eight, noPhases);
  assert.equal(bars.length, 1, 'sixteen runs become one bar');
  assert.equal(bars[0].count, 16);
  assert.equal(bars[0].allianceIds.length, 8);
});

test('alliance runs on different days get a bar each', () => {
  const bars = buildBars([
    occurrence({ startDate: '2026-11-20', allianceIds: ['dvl'], key: 'a' }),
    occurrence({ startDate: '2026-11-22', allianceIds: ['dvl'], key: 'b' })
  ], noPhases);
  assert.equal(bars.length, 2);
});

test('a bar crossing a week is cut, and only its real ends are marked', () => {
  const bars = buildBars([occurrence({ startDate: '2026-11-19', days: 9, eventTypeId: 'svs' })], noPhases);
  const firstWeek = piecesForWeek(bars, dayFromText('2026-11-16'));
  const secondWeek = piecesForWeek(bars, dayFromText('2026-11-23'));
  assert.equal(firstWeek[0].startsHere, true);
  assert.equal(firstWeek[0].endsHere, false);
  assert.equal(firstWeek[0].firstColumn, 3, 'Thursday');
  assert.equal(firstWeek[0].lastColumn, 6, 'to Sunday');
  assert.equal(secondWeek[0].startsHere, false);
  assert.equal(secondWeek[0].endsHere, true);
});

test('bars that overlap are stacked, and ones that do not share a lane', () => {
  const bars = buildBars([
    occurrence({ startDate: '2026-11-16', days: 7, eventTypeId: 'svs', key: 'long' }),
    occurrence({ startDate: '2026-11-16', days: 2, eventTypeId: 'bia', key: 'early' }),
    occurrence({ startDate: '2026-11-20', days: 2, eventTypeId: 'foundry', key: 'late' })
  ], noPhases);
  const pieces = piecesForWeek(bars, dayFromText('2026-11-16'));
  const byKey = new Map(pieces.map(piece => [piece.key, piece]));
  assert.equal(byKey.get('long')!.lane, 0, 'the one crossing the whole week sits on top');
  assert.equal(byKey.get('early')!.lane, 1);
  assert.equal(byKey.get('late')!.lane, 1, 'it does not touch the early one, so it shares the lane');
});

test('a month covers whole weeks, Monday to Sunday', () => {
  const weeks = weeksOfMonth(dayFromText('2026-11-01'), 30);
  assert.equal(weeks.length, 6);
  assert.equal(weeks[0], dayFromText('2026-10-26'), 'November 2026 starts on a Sunday, so the first row starts the Monday before');
});

test('a run with an alliance on it counts as an alliance event, whatever its own category', () => {
  const stateOnly = { ...noPhases, shownCategories: new Set(['state']), categoryOf: () => 'state' };
  const bars = buildBars([
    occurrence({ startDate: '2026-11-20', eventTypeId: 'bear', allianceIds: ['dvl'], key: 'alliance-run' }),
    occurrence({ startDate: '2026-11-20', eventTypeId: 'bia', key: 'state-run' })
  ], stateOnly);
  assert.deepEqual(bars.map(bar => bar.eventTypeId), ['bia'],
    'the bear is set per alliance, so it is filtered out with Alliance unticked');
});

test('unticking a category removes its events', () => {
  const nothing = { ...noPhases, shownCategories: new Set<string>() };
  assert.equal(buildBars([occurrence({ startDate: '2026-11-20' })], nothing).length, 0);
});
