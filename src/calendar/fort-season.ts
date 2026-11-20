// The fortress season: eight phases, one battle a week.
//
// Only the first phase's battle day is written down. Everything else is counted from
// it, so a new season needs no new setting.
import { MINUTES_PER_DAY } from './days.ts';

export const FORT_NAMES = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10',
  'F11', 'F12', 'SH1', 'SH2', 'SH3', 'SH4'];
export const FORT_PHASES = 8;

export function isStronghold(fort: string): boolean {
  return fort.startsWith('SH');
}

export function fortFullName(fort: string): string {
  return (isStronghold(fort) ? 'Stronghold No. ' : 'Fortress No. ') + fort.replace(/^\D+/, '');
}

// The first battle day of the season a day falls in. A phase's week starts six days
// before its battle day, which is why the count begins there.
export function seasonStartFor(day: number, firstBattleDay: number): number {
  const seasonLength = FORT_PHASES * 7;
  return firstBattleDay + Math.floor((day - (firstBattleDay - 6)) / seasonLength) * seasonLength;
}

export function phaseOf(battleDay: number, seasonStart: number): number {
  return Math.round((battleDay - seasonStart) / 7) + 1;
}

// Which season a start day belongs to, counting the first written-down season as one.
export function seasonNumberOf(seasonStart: number, firstBattleDay: number, firstSeason: number): number {
  const seasonLength = FORT_PHASES * 7;
  return firstSeason + Math.round((seasonStart - firstBattleDay) / seasonLength);
}

// The battle day of a phase: the Friday at the end of its week.
export function battleDayOf(seasonStart: number, phase: number): number {
  return seasonStart + (phase - 1) * 7;
}

// Who a fort's reward counts for: whoever it is credited to, or the holder's main
// alliance by default. One alliance can take a fort for another, so what the plan
// says always wins.
export const SHARED_WITH_STATE = 'shared';

export function creditedAllianceId(
  held: { allianceId: string; creditedTo: string },
  mainAllianceIdOf: (allianceId: string) => string | null
): string {
  if (held.creditedTo) return held.creditedTo;
  return mainAllianceIdOf(held.allianceId) ?? held.allianceId;
}

export { MINUTES_PER_DAY };
