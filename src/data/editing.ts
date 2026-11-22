// Saving what is edited in place: an event's repeat, one date's change, a fort's holder
// and battle time. Who may do which is decided where the pencils are drawn; the
// database's own access rules are the real check.
import { database } from './database.ts';

// A time typed as "20:00" or "2000" is kept as "20:00"; an empty one is no time.
export function cleanTime(typed: string): string | null {
  const digits = typed.replace(/[^0-9]/g, '');
  if (!digits) return null;
  const padded = digits.length <= 2 ? digits.padStart(2, '0') + '00' : digits.padStart(4, '0');
  const hours = Number(padded.slice(0, 2));
  const minutes = Number(padded.slice(2, 4));
  if (hours > 23 || minutes > 59) throw new Error(`"${typed}" is not a time of day.`);
  return padded.slice(0, 2) + ':' + padded.slice(2, 4);
}

function failed(what: string, error: { message: string } | null): void {
  if (error) throw new Error(`Could not save ${what}: ${error.message}`);
}

export interface ScheduleRepeat {
  firstDate: string;
  repeatEveryDays: number | null;
  lengthDays: number | null;
  startTimeUtc: string | null;
  endTimeUtc: string | null;
  datesAreEstimated: boolean;
}

// The owner sets an event's dates and how often it repeats.
export async function saveScheduleRepeat(scheduleId: string, repeat: ScheduleRepeat, userId: string): Promise<void> {
  const { error } = await database().from('schedules').update({
    first_date: repeat.firstDate,
    repeat_every_days: repeat.repeatEveryDays,
    length_days: repeat.lengthDays,
    start_time_utc: repeat.startTimeUtc,
    end_time_utc: repeat.endTimeUtc,
    dates_are_estimated: repeat.datesAreEstimated,
    updated_by: userId,
    updated_at: new Date().toISOString()
  }).eq('id', scheduleId);
  failed('the dates', error);
}

// An alliance's R4 or R5 sets their own alliance's time for the events where the
// alliance picks it.
export async function saveAllianceTime(
  scheduleId: string, times: { startTimeUtc: string | null; endTimeUtc: string | null }, userId: string
): Promise<void> {
  const { error } = await database().from('schedules').update({
    start_time_utc: times.startTimeUtc,
    end_time_utc: times.endTimeUtc,
    updated_by: userId,
    updated_at: new Date().toISOString()
  }).eq('id', scheduleId);
  failed('the time', error);
}

export interface DateChangeEdit {
  movedToDate: string | null;
  startTimeUtc: string | null;
  endTimeUtc: string | null;
  // For an event whose dates are estimated: this run's day is confirmed.
  isConfirmed: boolean;
  note: string | null;
}

// One run that differs from the pattern: moved, other times, confirmed, or a note for
// that date (the state's own rules for one Brothers in Arms, for example).
export async function saveDateChange(
  scheduleId: string, originalDate: string, change: DateChangeEdit, userId: string
): Promise<void> {
  const { error } = await database().from('event_occurrences').upsert({
    schedule_id: scheduleId,
    original_date: originalDate,
    moved_to_date: change.movedToDate,
    start_time_utc: change.startTimeUtc,
    end_time_utc: change.endTimeUtc,
    confirmed_date: change.isConfirmed ? (change.movedToDate ?? originalDate) : null,
    confirmed_by: change.isConfirmed ? userId : null,
    confirmed_at: change.isConfirmed ? new Date().toISOString() : null,
    note: change.note,
    updated_by: userId,
    updated_at: new Date().toISOString()
  }, { onConflict: 'schedule_id,original_date' });
  failed('the change', error);
}

// Who holds a fort in a phase, and when its battle starts.
export async function saveFortAssignment(
  place: { season: number; phase: number; fort: string },
  holding: { allianceId: string; battleAt: string | null },
  userId: string
): Promise<void> {
  const { error } = await database().from('fort_assignments').upsert({
    season: place.season,
    phase: place.phase,
    fort: place.fort,
    alliance_id: holding.allianceId,
    battle_time_utc: holding.battleAt,
    updated_by: userId,
    updated_at: new Date().toISOString()
  }, { onConflict: 'season,phase,fort' });
  failed('the fort', error);
}
