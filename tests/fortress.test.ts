import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  FORT_PHASES, SHARED_WITH_STATE, battleDayOf, creditedAllianceId, fortFullName,
  isStronghold, phaseOf, seasonStartFor
} from '../src/calendar/fort-season.ts';
import { dayFromText } from '../src/calendar/days.ts';

// Which alliance each academy belongs to, as the page looks it up.
const MAIN_OF: Record<string, string> = { dvl: 'dvl', littledvl: 'dvl', top: 'top' };
const mainAllianceIdOf = (id: string) => MAIN_OF[id] ?? null;

function held(bits: { allianceId: string; creditedTo?: string }) {
  return { allianceId: bits.allianceId, creditedTo: bits.creditedTo ?? '' };
}

test('a fort credits its holder by default', () => {
  assert.equal(creditedAllianceId(held({ allianceId: 'dvl' }), mainAllianceIdOf), 'dvl');
});

test("an academy's fort credits its main alliance", () => {
  assert.equal(creditedAllianceId(held({ allianceId: 'littledvl' }), mainAllianceIdOf), 'dvl');
});

test('a shell credits whoever the plan says', () => {
  // One alliance can take a fort for another, which is the whole reason the field
  // exists, so what is written always wins over the default.
  assert.equal(creditedAllianceId(held({ allianceId: 'dvl', creditedTo: 'top' }), mainAllianceIdOf), 'top');
});

test('a shared fort credits the whole state', () => {
  assert.equal(creditedAllianceId(held({ allianceId: 'dvl', creditedTo: SHARED_WITH_STATE }), mainAllianceIdOf),
    SHARED_WITH_STATE);
});

test('forts and strongholds are told apart by their name', () => {
  assert.ok(!isStronghold('F12'));
  assert.ok(isStronghold('SH1'));
  assert.equal(fortFullName('F12'), 'Fortress No. 12');
  assert.equal(fortFullName('SH3'), 'Stronghold No. 3');
});

test('the season counts its eight phases from the one battle day written down', () => {
  const first = dayFromText('2026-10-30');
  // A phase's week starts six days before its battle day, so a day inside phase 1's
  // week still belongs to that season.
  assert.equal(seasonStartFor(dayFromText('2026-10-26'), first), first);
  assert.equal(seasonStartFor(dayFromText('2026-11-27'), first), first);
  assert.equal(phaseOf(dayFromText('2026-11-27'), first), 5);
  assert.equal(battleDayOf(first, FORT_PHASES), dayFromText('2026-12-18'));
  // The next season starts after the eighth phase's week.
  assert.equal(seasonStartFor(dayFromText('2026-12-26'), first), first + FORT_PHASES * 7);
});
