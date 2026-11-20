import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dayFromText, textFromDay, minutesFromTime, weekdayOf, MINUTES_PER_DAY } from '../src/calendar/days.ts';
import {
  buildOccurrences, buildTransfers, expandSchedule, groupChanges,
  type DateChange, type ExpandOptions, type Schedule
} from '../src/calendar/occurrences.ts';

function schedule(changes: Partial<Schedule> = {}): Schedule {
  return {
    id: 's-test', eventTypeId: 'bear', firstDate: '2026-11-02',
    repeatEveryDays: 2, lengthDays: 1,
    startTimeUtc: '02:00', endTimeUtc: null,
    allianceIds: null, groupNumber: null, note: null,
    sinceDate: null, shiftWithMoves: false, datesAreEstimated: false,
    ...changes
  };
}

function options(schedules: Schedule[], changes: DateChange[] = []): ExpandOptions {
  return {
    allSchedules: schedules,
    changesBySchedule: groupChanges(changes),
    partOfByEventTypeId: new Map()
  };
}

function change(bits: Partial<DateChange> & { originalDate: string }): DateChange {
  return {
    scheduleId: 's-test', movedToDate: null, startTimeUtc: null, confirmedDate: null,
    endTimeUtc: null, isCancelled: false, note: null, ...bits
  };
}

test('days convert both ways and know their weekday', () => {
  assert.equal(textFromDay(dayFromText('2026-11-19')), '2026-11-19');
  assert.equal(weekdayOf(dayFromText('2026-11-19')), 3, 'Thursday is 3 when Monday is 0');
  assert.equal(weekdayOf(dayFromText('2026-11-23')), 0, 'Monday is 0');
  assert.ok(Number.isNaN(dayFromText('not a date')));
});

test('a repeating schedule produces its runs inside the range', () => {
  const one = schedule();
  const runs = expandSchedule(one, dayFromText('2026-11-19'), dayFromText('2026-11-25'), options([one]));
  assert.deepEqual(runs.map(run => textFromDay(run.startDay)),
    ['2026-11-20', '2026-11-22', '2026-11-24']);
});

test('it runs backwards from its first date too', () => {
  const one = schedule();
  const runs = expandSchedule(one, dayFromText('2026-10-27'), dayFromText('2026-10-31'), options([one]));
  assert.deepEqual(runs.map(run => textFromDay(run.startDay)),
    ['2026-10-27', '2026-10-29', '2026-10-31']);
});

test('nothing exists before the day the event was introduced', () => {
  const one = schedule({ sinceDate: '2026-10-30' });
  const runs = expandSchedule(one, dayFromText('2026-10-25'), dayFromText('2026-11-02'), options([one]));
  assert.deepEqual(runs.map(run => textFromDay(run.startDay)),
    ['2026-10-31', '2026-11-02']);
});

test('a moved run shows on its new day and is marked as changed', () => {
  const one = schedule();
  const moved = [change({ originalDate: '2026-11-20', movedToDate: '2026-11-21' })];
  const runs = expandSchedule(one, dayFromText('2026-11-19'), dayFromText('2026-11-22'), options([one], moved));
  assert.equal(textFromDay(runs[0].startDay), '2026-11-21');
  assert.equal(runs[0].wasChanged, true);
  assert.equal(runs[1].wasChanged, false);
});

test('without shiftWithMoves, only the moved run moves', () => {
  const one = schedule();
  const moved = [change({ originalDate: '2026-11-20', movedToDate: '2026-11-27' })];
  const runs = expandSchedule(one, dayFromText('2026-11-19'), dayFromText('2026-11-25'), options([one], moved));
  assert.deepEqual(runs.map(run => textFromDay(run.startDay)), ['2026-11-22', '2026-11-24']);
});

test('with shiftWithMoves, every later run moves with it', () => {
  const one = schedule({ shiftWithMoves: true, repeatEveryDays: 7, firstDate: '2026-11-02' });
  const moved = [change({ originalDate: '2026-11-16', movedToDate: '2026-11-23' })];
  const runs = expandSchedule(one, dayFromText('2026-11-01'), dayFromText('2026-12-10'), options([one], moved));
  assert.deepEqual(runs.map(run => textFromDay(run.startDay)),
    ['2026-11-02', '2026-11-09', '2026-11-23', '2026-11-30', '2026-12-07'],
    'the 16th moves to the 23rd and the ones after it keep the seven days from there');
});

test('a run with no end time ends at the reset after its last day', () => {
  const one = schedule({ lengthDays: 2, startTimeUtc: '02:00', endTimeUtc: null, repeatEveryDays: null });
  const run = expandSchedule(one, dayFromText('2026-11-01'), dayFromText('2026-11-05'), options([one]))[0];
  assert.equal(run.startMinute, dayFromText('2026-11-02') * MINUTES_PER_DAY + 120);
  assert.equal(run.endMinute, dayFromText('2026-11-04') * MINUTES_PER_DAY);
});

test('an end time at or before the start belongs to the next day', () => {
  const one = schedule({ repeatEveryDays: null, startTimeUtc: '22:00', endTimeUtc: '02:00' });
  const run = expandSchedule(one, dayFromText('2026-11-01'), dayFromText('2026-11-05'), options([one]))[0];
  assert.equal(run.endMinute - run.startMinute, 4 * 60, 'four hours over midnight');
});

test('alliance ids are split, and a group number comes through', () => {
  const one = schedule({ allianceIds: 'dvl, top', groupNumber: 2, repeatEveryDays: null });
  const run = expandSchedule(one, dayFromText('2026-11-01'), dayFromText('2026-11-05'), options([one]))[0];
  assert.deepEqual(run.allianceIds, ['dvl', 'top']);
  assert.equal(run.groupNumber, 2);
});

test('the transfer opens the day after the SvS battle and runs a week', () => {
  const svs: Schedule = schedule({
    id: 's-svsbattle', eventTypeId: 'svs-battle', firstDate: '2026-11-07',
    repeatEveryDays: 28, lengthDays: 1, startTimeUtc: '10:00'
  });
  const runs = buildTransfers(dayFromText('2026-11-01'), dayFromText('2026-12-31'), 'svs', options([svs]));
  assert.deepEqual(runs.map(run => textFromDay(run.startDay)), ['2026-11-08', '2026-12-06']);
  assert.equal(textFromDay(runs[0].endDay), '2026-11-14');
});

test('switching to Sunfire moves the transfer onto those dates instead', () => {
  const sunfire: Schedule = schedule({
    id: 's-sunfire', eventTypeId: 'sunfire', firstDate: '2026-11-21',
    repeatEveryDays: 28, lengthDays: 1
  });
  const runs = buildTransfers(dayFromText('2026-11-01'), dayFromText('2026-12-31'), 'sunfire', options([sunfire]));
  assert.deepEqual(runs.map(run => textFromDay(run.startDay)), ['2026-11-22', '2026-12-20']);
});

test('everything comes back in the order it happens', () => {
  const bear = schedule({ id: 'bear', startTimeUtc: '14:00', repeatEveryDays: null, firstDate: '2026-11-20' });
  const joe = schedule({ id: 'joe', eventTypeId: 'crazy-joe', startTimeUtc: '02:00', repeatEveryDays: null, firstDate: '2026-11-20' });
  const runs = buildOccurrences(dayFromText('2026-11-19'), dayFromText('2026-11-21'), 'svs', options([bear, joe]));
  assert.deepEqual(runs.map(run => run.scheduleId), ['joe', 'bear']);
});

test('a time of day reads as minutes', () => {
  assert.equal(minutesFromTime('02:00'), 120);
  assert.equal(minutesFromTime('23:59'), 1439);
  assert.equal(minutesFromTime(''), 0);
});
