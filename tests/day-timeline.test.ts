import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dayFromText, MINUTES_PER_DAY, minutesFromTime } from '../src/calendar/days.ts';
import {
  contentsOfDay, dayOfEvent, momentsOf, timelineOrder, windowOfDay,
  type EventStep, type Moment
} from '../src/calendar/day-timeline.ts';
import type { Occurrence } from '../src/calendar/occurrences.ts';

function occurrence(bits: {
  startDate: string; days?: number; startTime?: string; endTime?: string;
  eventTypeId?: string; key?: string;
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
    key: bits.key ?? 'k', scheduleId: 's', eventTypeId: bits.eventTypeId ?? 'bear',
    allianceIds: [], groupNumber: null,
    startDay, endDay: startDay + lengthDays - 1, lengthDays, originalDay: startDay,
    startTimeUtc: bits.startTime ?? '', endTimeUtc: bits.endTime ?? '',
    startMinute, endMinute, note: '', wasChanged: false, wasCancelled: false,
    isProvisional: false
  };
}

const options = {
  stepsByEventType: new Map<string, EventStep[]>(),
  nameOf: (id: string) => id,
  stepLabel: (id: string) => id,
  phaseNameForDay: () => '',
  dayNameOf: () => '',
  lengthOf: (one: Occurrence) => one.endMinute - one.startMinute
};

test('which day of its own event a date is', () => {
  const run = occurrence({ startDate: '2026-11-16', days: 4 });
  assert.equal(dayOfEvent(run, dayFromText('2026-11-16')), 1);
  assert.equal(dayOfEvent(run, dayFromText('2026-11-19')), 4);
  assert.equal(dayOfEvent(run, dayFromText('2026-11-25')), 4, 'never past the last day');
});

test('a one-day event with a time reads as itself, not as starting', () => {
  const run = occurrence({ startDate: '2026-11-20', startTime: '02:00' });
  const moments = momentsOf(run, windowOfDay(dayFromText('2026-11-20')), options);
  assert.equal(moments.length, 1);
  assert.equal(moments[0].title, 'bear');
});

test('a longer event says when it starts and ends', () => {
  const run = occurrence({ startDate: '2026-11-20', days: 2, startTime: '10:00', endTime: '22:00' });
  const starts = momentsOf(run, windowOfDay(dayFromText('2026-11-20')), options);
  assert.deepEqual(starts.map(m => m.title), ['bear starts']);
  const ends = momentsOf(run, windowOfDay(dayFromText('2026-11-21')), options);
  assert.deepEqual(ends.map(m => m.title), ['bear ends']);
});

test('steps with a time become their own moments', () => {
  const steps: EventStep[] = [
    { id: 'st1', eventTypeId: 'league', dayNumber: 1, startTimeUtc: '12:00', endTimeUtc: '21:00', sortOrder: 1 },
    { id: 'st2', eventTypeId: 'league', dayNumber: 9, startTimeUtc: '10:00', endTimeUtc: null, sortOrder: 2 }
  ];
  const run = occurrence({ startDate: '2026-11-20', days: 2, eventTypeId: 'league' });
  const moments = momentsOf(run, windowOfDay(dayFromText('2026-11-20')),
    { ...options, stepsByEventType: new Map([['league', steps]]), stepLabel: id => id });
  assert.deepEqual(moments.map(m => m.title), ['league · st1', 'league · st1 ends'],
    'the step on day 9 is past the end of a two-day run, so it never happens');
});

test('an ending is dropped when something else starts at the same minute', () => {
  const moments: Moment[] = [
    { minute: 600, eventTypeId: 'a', occurrenceKey: 'a', title: 'A ends', isEnd: true, isReset: false, priority: 0 },
    { minute: 600, eventTypeId: 'b', occurrenceKey: 'b', title: 'B starts', isEnd: false, isReset: false, priority: 0 }
  ];
  assert.deepEqual(timelineOrder(moments).map(m => m.title), ['B starts']);
});

test('an ending on its own keeps its row', () => {
  const moments: Moment[] = [
    { minute: 600, eventTypeId: 'a', occurrenceKey: 'a', title: 'A ends', isEnd: true, isReset: false, priority: 0 }
  ];
  assert.deepEqual(timelineOrder(moments).map(m => m.title), ['A ends']);
});

test('a day separates what runs all day from what happens at a time', () => {
  const day = dayFromText('2026-11-20');
  const contents = contentsOfDay([
    occurrence({ startDate: '2026-11-16', days: 9, eventTypeId: 'svs', key: 'long' }),
    occurrence({ startDate: '2026-11-20', startTime: '02:00', eventTypeId: 'bear', key: 'timed' })
  ], day, options);
  assert.deepEqual(contents.allDayItems.map(item => item.occurrence.key), ['long']);
  assert.deepEqual(contents.moments.map(m => m.title), ['bear']);
});

test('the longest all-day event sits at the top', () => {
  const day = dayFromText('2026-11-20');
  const contents = contentsOfDay([
    occurrence({ startDate: '2026-11-19', days: 3, eventTypeId: 'short', key: 'short' }),
    occurrence({ startDate: '2026-11-01', days: 30, eventTypeId: 'season', key: 'season' })
  ], day, options);
  assert.deepEqual(contents.allDayItems.map(item => item.occurrence.key), ['season', 'short']);
});

test('a cancelled run still shows as an all-day item but adds no moments', () => {
  const day = dayFromText('2026-11-20');
  const cancelled = { ...occurrence({ startDate: '2026-11-20', days: 2, startTime: '10:00' }), wasCancelled: true };
  const contents = contentsOfDay([cancelled], day, options);
  assert.equal(contents.allDayItems.length, 1);
  assert.equal(contents.moments.length, 0);
});
