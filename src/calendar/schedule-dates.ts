// Works out when each repeating event actually runs.
// Pure date arithmetic with no database and no page in it, so it can be tested on its
// own. Every date here is a plain 'YYYY-MM-DD' string in UTC.

export interface Schedule {
  id: string;
  eventTypeId: string;
  firstDate: string;
  repeatEveryDays: number | null;
  lengthDays: number | null;
  startTimeUtc: string | null;
  endTimeUtc: string | null;
  allianceIds: string | null;
  groupNumber: number | null;
}

export interface Occurrence {
  scheduleId: string;
  eventTypeId: string;
  startDate: string;
  endDate: string;
  startTimeUtc: string | null;
  allianceIds: string[];
  // Which of a repeated slot this is, for example bear trap 2 of 2.
  groupNumber: number | null;
  // True when this run was moved off the date the repeat produced.
  wasMoved: boolean;
}

// A run that was pushed to a different day, keyed by schedule and original date.
export type MovedDates = Map<string, string>;

export function movedDateKey(scheduleId: string, originalDate: string): string {
  return scheduleId + '@' + originalDate;
}

const MILLISECONDS_IN_A_DAY = 24 * 60 * 60 * 1000;

export function parseDate(date: string): number {
  const parsed = Date.parse(date + 'T00:00:00Z');
  if (Number.isNaN(parsed)) throw new Error('Not a date: ' + date);
  return parsed;
}

export function formatDate(time: number): string {
  return new Date(time).toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  return formatDate(parseDate(date) + days * MILLISECONDS_IN_A_DAY);
}

// How many runs to skip before reaching the first one that has not finished yet.
// An event that started yesterday and lasts four days still counts as running.
function firstRunStillGoing(schedule: Schedule, onDate: string): number {
  const repeat = schedule.repeatEveryDays;
  if (!repeat || repeat <= 0) return 0;

  const lastDayOfFirstRun = parseDate(schedule.firstDate)
    + (lengthInDays(schedule) - 1) * MILLISECONDS_IN_A_DAY;
  const daysBehind = (parseDate(onDate) - lastDayOfFirstRun) / MILLISECONDS_IN_A_DAY;
  if (daysBehind <= 0) return 0;
  return Math.ceil(daysBehind / repeat);
}

function lengthInDays(schedule: Schedule): number {
  return schedule.lengthDays && schedule.lengthDays > 0 ? schedule.lengthDays : 1;
}

function splitAllianceIds(allianceIds: string | null): string[] {
  if (!allianceIds) return [];
  return allianceIds.split(',').map(id => id.trim()).filter(id => id.length > 0);
}

// The next few runs of one schedule, starting with any that is happening right now.
export function nextRunsOfSchedule(
  schedule: Schedule,
  fromDate: string,
  howMany: number,
  movedDates: MovedDates = new Map()
): Occurrence[] {
  const length = lengthInDays(schedule);
  const alliances = splitAllianceIds(schedule.allianceIds);
  const repeat = schedule.repeatEveryDays;
  const runs: Occurrence[] = [];

  // A schedule with no repeat happens once and never again.
  if (!repeat || repeat <= 0) {
    const endDate = addDays(schedule.firstDate, length - 1);
    if (parseDate(endDate) < parseDate(fromDate)) return [];
    return [buildOccurrence(schedule, schedule.firstDate, length, alliances, movedDates)];
  }

  let runNumber = firstRunStillGoing(schedule, fromDate);
  while (runs.length < howMany) {
    const plannedStart = addDays(schedule.firstDate, runNumber * repeat);
    const run = buildOccurrence(schedule, plannedStart, length, alliances, movedDates);
    // Moving a run can push it behind the date we are counting from, so skip those.
    if (parseDate(run.endDate) >= parseDate(fromDate)) runs.push(run);
    runNumber += 1;
    // A guard so a bad repeat value can never spin forever.
    if (runNumber > 10000) break;
  }
  return runs;
}

function buildOccurrence(
  schedule: Schedule,
  plannedStart: string,
  length: number,
  alliances: string[],
  movedDates: MovedDates
): Occurrence {
  const movedTo = movedDates.get(movedDateKey(schedule.id, plannedStart));
  const startDate = movedTo ?? plannedStart;
  return {
    scheduleId: schedule.id,
    eventTypeId: schedule.eventTypeId,
    startDate,
    endDate: addDays(startDate, length - 1),
    startTimeUtc: schedule.startTimeUtc,
    allianceIds: alliances,
    groupNumber: schedule.groupNumber,
    wasMoved: Boolean(movedTo)
  };
}

// Every schedule's next runs, merged and sorted, soonest first.
export function nextRunsAcrossSchedules(
  schedules: Schedule[],
  fromDate: string,
  howMany: number,
  movedDates: MovedDates = new Map()
): Occurrence[] {
  const everything: Occurrence[] = [];
  for (const schedule of schedules) {
    // Each schedule only needs to offer as many runs as we are going to show.
    everything.push(...nextRunsOfSchedule(schedule, fromDate, howMany, movedDates));
  }
  everything.sort((left, right) => {
    if (left.startDate !== right.startDate) {
      return left.startDate < right.startDate ? -1 : 1;
    }
    const leftTime = left.startTimeUtc ?? '';
    const rightTime = right.startTimeUtc ?? '';
    if (leftTime !== rightTime) return leftTime < rightTime ? -1 : 1;
    return left.scheduleId < right.scheduleId ? -1 : 1;
  });
  return everything.slice(0, howMany);
}
