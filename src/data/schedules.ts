import { database } from './database.ts';
import { movedDateKey, type MovedDates, type Schedule } from '../calendar/schedule-dates.ts';

export async function loadSchedules(): Promise<Schedule[]> {
  const { data, error } = await database()
    .from('schedules')
    .select('id, event_type_id, first_date, repeat_every_days, length_days, ' +
            'start_time_utc, end_time_utc, alliance_ids, group_number');

  if (error) throw new Error('Could not read the schedules: ' + error.message);

  return (data ?? []).map(row => ({
    id: row.id,
    eventTypeId: row.event_type_id,
    firstDate: row.first_date,
    repeatEveryDays: row.repeat_every_days,
    lengthDays: row.length_days,
    // Postgres hands back times as 'HH:MM:SS'; the page only ever shows hours and
    // minutes, so the seconds are dropped here rather than in every place that shows one.
    startTimeUtc: row.start_time_utc ? String(row.start_time_utc).slice(0, 5) : null,
    endTimeUtc: row.end_time_utc ? String(row.end_time_utc).slice(0, 5) : null,
    allianceIds: row.alliance_ids,
    groupNumber: row.group_number
  }));
}

// Runs that happened on a different day than the repeat produced.
export async function loadMovedDates(): Promise<MovedDates> {
  const { data, error } = await database()
    .from('event_occurrences')
    .select('schedule_id, original_date, moved_to_date')
    .not('moved_to_date', 'is', null);

  if (error) throw new Error('Could not read the moved dates: ' + error.message);

  const moved: MovedDates = new Map();
  for (const row of data ?? []) {
    moved.set(movedDateKey(row.schedule_id, row.original_date), row.moved_to_date);
  }
  return moved;
}
