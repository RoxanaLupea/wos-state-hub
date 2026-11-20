import { database } from './database.ts';
import type { DateChange, Schedule } from '../calendar/occurrences.ts';

export async function loadSchedules(): Promise<Schedule[]> {
  const { data, error } = await database()
    .from('schedules')
    .select(`id, event_type_id, first_date, repeat_every_days, length_days,
             start_time_utc, end_time_utc, alliance_ids, group_number, note,
             since_date, shift_with_moves, dates_are_estimated`);

  if (error) throw new Error('Could not read the schedules: ' + error.message);

  return (data ?? []).map(row => ({
    id: row.id,
    eventTypeId: row.event_type_id,
    firstDate: row.first_date,
    repeatEveryDays: row.repeat_every_days,
    lengthDays: row.length_days,
    // Postgres hands times back as 'HH:MM:SS'. Nothing on the page shows seconds, so
    // they are dropped here rather than in every place that shows a time.
    startTimeUtc: row.start_time_utc ? String(row.start_time_utc).slice(0, 5) : null,
    endTimeUtc: row.end_time_utc ? String(row.end_time_utc).slice(0, 5) : null,
    allianceIds: row.alliance_ids,
    groupNumber: row.group_number,
    note: row.note,
    sinceDate: row.since_date,
    shiftWithMoves: Boolean(row.shift_with_moves),
    datesAreEstimated: Boolean(row.dates_are_estimated)
  }));
}

// Runs that were changed by hand: moved, given different times, or called off.
export async function loadDateChanges(): Promise<DateChange[]> {
  const { data, error } = await database()
    .from('event_occurrences')
    .select(`schedule_id, original_date, moved_to_date, start_time_utc, end_time_utc,
             confirmed_date, note`);

  if (error) throw new Error('Could not read the changed dates: ' + error.message);

  return (data ?? []).map(row => ({
    scheduleId: row.schedule_id,
    originalDate: row.original_date,
    movedToDate: row.moved_to_date,
    startTimeUtc: row.start_time_utc ? String(row.start_time_utc).slice(0, 5) : null,
    endTimeUtc: row.end_time_utc ? String(row.end_time_utc).slice(0, 5) : null,
    // Only Brothers in Arms can be called off, and that is recorded on the plan
    // rather than here, so nothing sets this yet.
    isCancelled: false,
    confirmedDate: row.confirmed_date ?? null,
    note: row.note
  }));
}

export async function loadSettings(): Promise<Map<string, string>> {
  const { data, error } = await database()
    .from('settings')
    .select('setting_key, event_type_id, setting_value');

  if (error) throw new Error('Could not read the settings: ' + error.message);

  const settings = new Map<string, string>();
  for (const row of data ?? []) {
    // A setting for one event is kept under "key|event"; a global one under its key.
    const key = row.event_type_id ? row.setting_key + '|' + row.event_type_id : row.setting_key;
    settings.set(key, row.setting_value);
  }
  return settings;
}
