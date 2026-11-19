import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addDays,
  movedDateKey,
  nextRunsOfSchedule,
  nextRunsAcrossSchedules,
  type Schedule
} from '../src/calendar/schedule-dates.ts';

function schedule(changes: Partial<Schedule> = {}): Schedule {
  return {
    id: 's-test',
    eventTypeId: 'bear',
    firstDate: '2026-11-07',
    repeatEveryDays: 7,
    lengthDays: 1,
    startTimeUtc: null,
    endTimeUtc: null,
    allianceIds: null,
    groupNumber: null,
    ...changes
  };
}

test('adding days crosses month and year ends', () => {
  assert.equal(addDays('2026-11-30', 1), '2026-12-01');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
});

test('a weekly event lists its next runs', () => {
  const runs = nextRunsOfSchedule(schedule(), '2026-11-19', 3);
  assert.deepEqual(runs.map(run => run.startDate),
    ['2026-11-21', '2026-11-28', '2026-12-05']);
});

test('a run that started but has not finished still counts as upcoming', () => {
  // Seven days long, so the run that began on the 14th is still going on the 19th.
  const runs = nextRunsOfSchedule(schedule({ lengthDays: 7 }), '2026-11-19', 2);
  assert.equal(runs[0].startDate, '2026-11-14');
  assert.equal(runs[0].endDate, '2026-11-20');
  assert.equal(runs[1].startDate, '2026-11-21');
});

test('a run that finished yesterday is not listed', () => {
  const runs = nextRunsOfSchedule(schedule(), '2026-11-15', 1);
  assert.equal(runs[0].startDate, '2026-11-21');
});

test('an event that never repeats happens once', () => {
  const once = schedule({ repeatEveryDays: null, firstDate: '2026-12-25' });
  assert.equal(nextRunsOfSchedule(once, '2026-11-19', 5).length, 1);
  assert.equal(nextRunsOfSchedule(once, '2027-01-01', 5).length, 0);
});

test('a moved run shows its new date and is marked as moved', () => {
  const moved = new Map([[movedDateKey('s-test', '2026-11-21'), '2026-11-23']]);
  const runs = nextRunsOfSchedule(schedule(), '2026-11-19', 2, moved);
  assert.equal(runs[0].startDate, '2026-11-23');
  assert.equal(runs[0].wasMoved, true);
  assert.equal(runs[1].wasMoved, false);
});

test('the group number comes through, so trap 1 and trap 2 can be told apart', () => {
  const runs = nextRunsOfSchedule(schedule({ groupNumber: 2 }), '2026-11-19', 1);
  assert.equal(runs[0].groupNumber, 2);
});

test('alliance ids are split and trimmed', () => {
  const runs = nextRunsOfSchedule(schedule({ allianceIds: 'dvl, top ,sky' }), '2026-11-19', 1);
  assert.deepEqual(runs[0].allianceIds, ['dvl', 'top', 'sky']);
});

test('runs from several schedules come back soonest first', () => {
  const runs = nextRunsAcrossSchedules([
    schedule({ id: 'later', firstDate: '2026-11-25', repeatEveryDays: 28 }),
    schedule({ id: 'sooner', firstDate: '2026-11-20', repeatEveryDays: 28 })
  ], '2026-11-19', 2);
  assert.deepEqual(runs.map(run => run.scheduleId), ['sooner', 'later']);
});

test('two runs on the same day are ordered by their time', () => {
  const runs = nextRunsAcrossSchedules([
    { ...schedule({ id: 'evening' }), firstDate: '2026-11-21', startTimeUtc: '19:00' },
    { ...schedule({ id: 'morning' }), firstDate: '2026-11-21', startTimeUtc: '07:00' }
  ], '2026-11-19', 2);
  assert.deepEqual(runs.map(run => run.scheduleId), ['morning', 'evening']);
});
