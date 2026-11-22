// The fortress battles of a battle day, as the old app had them: each fort's battle
// time and who holds it, for the day's timeline and for the Fortress Battles event.
import { FORT_NAMES, FORT_PHASES, seasonNumberOf, seasonStartFor } from './fort-season.ts';
import { MINUTES_PER_DAY, minutesFromTime } from './days.ts';
import type { FortAssignment } from '../data/forts.ts';

export interface FortBattle {
  fort: string;
  phase: number;
  // When the battle starts, in minutes; null while its time is not set.
  minute: number | null;
  // Who holds the fort this phase; empty when nobody is written down.
  allianceId: string;
}

export interface FortSeasonCount {
  // The first written-down battle day, which every season is counted from.
  firstBattleDay: number;
  // The number of the season that first battle day belongs to.
  firstSeason: number;
}

// When a day is a fortress battle day (the Friday of a phase): its season and phase.
export function fortPhaseOfDay(day: number, count: FortSeasonCount): { season: number; phase: number } | null {
  if (Number.isNaN(count.firstBattleDay)) return null;
  const seasonStart = seasonStartFor(day, count.firstBattleDay);
  const daysAfterStart = day - seasonStart;
  if (daysAfterStart < 0 || daysAfterStart % 7 !== 0) return null;
  const phase = daysAfterStart / 7 + 1;
  if (phase > FORT_PHASES) return null;
  return { season: seasonNumberOf(seasonStart, count.firstBattleDay, count.firstSeason), phase };
}

// The 16 battles of a battle day: the ones with a time first, in time order, then the
// rest in fort order.
export function fortBattlesOnDay(day: number, count: FortSeasonCount, assignments: FortAssignment[]): FortBattle[] {
  const fortDay = fortPhaseOfDay(day, count);
  if (!fortDay) return [];
  const byFort = new Map(assignments
    .filter(one => one.season === fortDay.season && one.phase === fortDay.phase)
    .map(one => [one.fort, one]));
  return FORT_NAMES.map((fort, order) => {
    const held = byFort.get(fort);
    const time = held?.battleTimeUtc ?? null;
    return {
      fort, order, phase: fortDay.phase,
      minute: time ? day * MINUTES_PER_DAY + minutesFromTime(time) : null,
      allianceId: held?.allianceId ?? ''
    };
  }).sort((left, right) =>
    (left.minute === null ? 1 : 0) - (right.minute === null ? 1 : 0) ||
    (left.minute ?? 0) - (right.minute ?? 0) || left.order - right.order)
    .map(({ fort, phase, minute, allianceId }) => ({ fort, phase, minute, allianceId }));
}

// Which battles a player sees: with State ticked, every fort; with only Alliance
// ticked, the forts of their alliance and its academies.
export function fortBattleIsShown(battle: FortBattle, shownCategories: Set<string>, myAllianceIds: string[]): boolean {
  if (shownCategories.has('state')) return true;
  return shownCategories.has('alliance') && Boolean(battle.allianceId) && myAllianceIds.includes(battle.allianceId);
}
