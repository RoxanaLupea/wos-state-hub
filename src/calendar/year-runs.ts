// The year view shows only the four things that shape a state's year, each as one
// line per week. A run is one stretch of days where that thing is happening, whatever
// its parts are called: SvS matchmaking, preparation, battle and field triage are one
// SvS run.
import { phaseMinutes, shownDaysOf, type EventPhase } from './bars.ts';
import type { Occurrence } from './occurrences.ts';

export interface YearEntry {
  name: string;
  // The colours the line fades through, along the whole run.
  colors: string;
  logoEventId: string;
  eventTypeIds: string[];
}

export const YEAR_VIEW_EVENTS: YearEntry[] = [
  {
    name: 'SvS', colors: '#3F7FE6 0%, #4F82DE 55%, #E04A4A 75%, #5FB8A8 100%',
    logoEventId: 'svs-prep',
    eventTypeIds: ['svs', 'svs-matchmaking', 'svs-prep', 'svs-battle', 'castle-battle', 'svs-triage']
  },
  { name: 'Tyrant', colors: '#2F5FC8 0%, #A9E3F5 100%', logoEventId: 'tyrant', eventTypeIds: ['tyrant'] },
  { name: 'TAL', colors: '#D49A2E 0%, #F2D98C 100%', logoEventId: 'hellfire', eventTypeIds: ['hellfire'] },
  {
    name: 'Transfer', colors: '#E2C77E 0%, #E2C77E 55%, #D9554A 78%, #5AB4E8 100%',
    logoEventId: 'transfer', eventTypeIds: ['transfer']
  }
];

export interface YearRun {
  entry: YearEntry;
  startDay: number;
  endDay: number;
  occurrences: Occurrence[];
}

export function yearEntryOf(
  eventTypeId: string,
  partOfByEventTypeId: Map<string, string | null>
): YearEntry | null {
  const partOf = partOfByEventTypeId.get(eventTypeId);
  return YEAR_VIEW_EVENTS.find(entry =>
    entry.eventTypeIds.includes(eventTypeId) ||
    (partOf !== null && partOf !== undefined && entry.eventTypeIds.includes(partOf))) ?? null;
}

export interface YearRunOptions {
  partOfByEventTypeId: Map<string, string | null>;
  sortOrderOf: (eventTypeId: string) => number;
}

// Days of the same thing that touch each other become one run.
export function yearViewRuns(occurrences: Occurrence[], options: YearRunOptions): YearRun[] {
  const daysByEntry = YEAR_VIEW_EVENTS.map(() => new Set<number>());
  const occurrencesByEntry = YEAR_VIEW_EVENTS.map(() => [] as Occurrence[]);

  for (const occurrence of occurrences) {
    if (occurrence.wasCancelled) continue;
    const entry = yearEntryOf(occurrence.eventTypeId, options.partOfByEventTypeId);
    if (!entry) continue;
    const index = YEAR_VIEW_EVENTS.indexOf(entry);
    occurrencesByEntry[index].push(occurrence);
    const days = shownDaysOf(occurrence);
    for (let day = days.first; day <= days.last; day++) daysByEntry[index].add(day);
  }

  const runs: YearRun[] = [];
  daysByEntry.forEach((days, index) => {
    let run: YearRun | null = null;
    for (const day of [...days].sort((left, right) => left - right)) {
      if (run && day === run.endDay + 1) {
        run.endDay = day;
        continue;
      }
      run = { entry: YEAR_VIEW_EVENTS[index], startDay: day, endDay: day, occurrences: [] };
      runs.push(run);
    }
  });

  for (const run of runs) {
    const index = YEAR_VIEW_EVENTS.indexOf(run.entry);
    run.occurrences = occurrencesByEntry[index]
      .filter(occurrence => {
        const days = shownDaysOf(occurrence);
        return days.last >= run.startDay && days.first <= run.endDay;
      })
      .sort((left, right) => left.startMinute - right.startMinute ||
        options.sortOrderOf(left.eventTypeId) - options.sortOrderOf(right.eventTypeId));
  }
  return runs;
}

export interface RunStep {
  minute: number;
  name: string;
}

// What happens inside a run, in order: each phase of each event in it, or the event
// itself where it has no phases.
export function yearRunSteps(
  run: YearRun,
  phasesByEventType: Map<string, EventPhase[]>,
  minutesFromTime: (time: string | null) => number,
  phaseNameOf: (phaseId: string) => string,
  nameOf: (eventTypeId: string) => string
): RunStep[] {
  const steps: RunStep[] = [];
  for (const occurrence of run.occurrences) {
    const phases = (phasesByEventType.get(occurrence.eventTypeId) ?? [])
      .map(phase => {
        const span = phaseMinutes(occurrence, phase, minutesFromTime);
        return span ? { minute: span.start, name: phaseNameOf(phase.id) } : null;
      })
      .filter((step): step is RunStep => step !== null);
    if (phases.length) steps.push(...phases);
    else steps.push({ minute: occurrence.startMinute, name: nameOf(occurrence.eventTypeId) });
  }
  return steps.sort((left, right) => left.minute - right.minute);
}

export function runStartMinute(run: YearRun): number {
  return run.occurrences.length ? run.occurrences[0].startMinute : run.startDay * 24 * 60;
}

export function runEndMinute(run: YearRun): number {
  return run.occurrences.reduce(
    (latest, occurrence) => Math.max(latest, occurrence.endMinute), runStartMinute(run));
}

export function runName(run: YearRun): string {
  return run.entry.name + '|' + run.startDay;
}
