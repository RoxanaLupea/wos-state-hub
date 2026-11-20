// What the transfer groups mean, with nothing to do with where they are stored.
// Kept apart from the loader so it can be checked without a database.

export interface TransferGroup {
  id: string;
  transferDate: string;
  fromState: number;
  toState: number;
  // Hero generation as a number, so it sorts.
  generation: number | null;
  // Position on the furnace ladder, counted in upgrades.
  furnaceCapUpgrades: number | null;
}

// Where a state sits on the furnace ladder, written the way players say it.
//
// The ladder is one upgrade per furnace level up to 30, then five upgrades per Fire
// Crystal level, so FC1 is 35 and FC10 is 80. The Red Chief Gear and the War Academy
// unlock during FC5 and take the two spare numbers between FC5 and FC6.
export function furnaceCapText(upgrades: number | null): string {
  if (upgrades === null) return '';
  if (upgrades <= 30) return 'Furnace ' + upgrades;
  if (upgrades === 56) return 'FC5 · Red Chief Gear';
  if (upgrades === 57) return 'FC5 · War Academy';
  const level = (upgrades - 30) / 5;
  return Number.isInteger(level) ? 'FC' + level : 'FC' + Math.floor(level) + '+';
}

// The same furnace position written to fit a narrow column: the level on its own,
// and a short mark for the two positions that sit between levels.
export function shortFurnaceCapText(upgrades: number | null): string {
  if (upgrades === null) return '';
  if (upgrades <= 30) return String(upgrades);
  if (upgrades === 56) return '5·RC';
  if (upgrades === 57) return '5·WA';
  const level = (upgrades - 30) / 5;
  return Number.isInteger(level) ? String(level) : Math.floor(level) + '+';
}

export function generationText(generation: number | null): string {
  return generation === null ? '' : 'Gen ' + generation;
}

// Whether a state falls inside a group's range.
export function groupHolds(group: TransferGroup, stateNumber: number): boolean {
  return stateNumber >= group.fromState && stateNumber <= group.toState;
}

// The narrow ranges the game publishes are building blocks. Runs of them that touch
// and share a hero generation are one big group, which is what the game shows and
// what the sheet writes down.
//
// The furnace cap is not part of what joins them: a single group can hold states at
// FC10 and states at FC8, so the cap is kept per range and the group reports every
// cap it holds.
export interface BigGroup {
  fromState: number;
  toState: number;
  generation: number | null;
  // One furnace position for the whole group: every range in it shares this.
  furnaceCapUpgrades: number | null;
  parts: TransferGroup[];
}

export function bigGroupsOf(groups: TransferGroup[]): BigGroup[] {
  const sorted = groups.slice().sort((left, right) => left.fromState - right.fromState);
  const big: BigGroup[] = [];
  for (const group of sorted) {
    const last = big[big.length - 1];
    // A player can only move to a state that has the same content released as their
    // own, so a group is the ranges that share a generation and a furnace cap; a
    // difference in either one starts a new group. The list skips the states that no
    // longer exist, and such a skip does not start a new group.
    const joins = last &&
      last.generation === group.generation &&
      last.furnaceCapUpgrades === group.furnaceCapUpgrades;
    if (joins) {
      last.toState = Math.max(last.toState, group.toState);
      last.parts.push(group);
      continue;
    }
    big.push({
      fromState: group.fromState, toState: group.toState,
      generation: group.generation,
      furnaceCapUpgrades: group.furnaceCapUpgrades,
      parts: [group]
    });
  }
  return big;
}

// How a group's furnace positions read together: one number, or each of them.
// What a transfer date follows. Every transfer opens the day after a battle: for
// years that was always the SvS battle, and from late August 2026 they come every
// fortnight, alternating between the SvS battle and Sunfire Castle.
export type TransferFollows = 'svs' | 'sunfire' | 'neither';

export function followsOf(
  transferDay: number,
  svsBattleDays: Set<number>,
  sunfireDays: Set<number>
): TransferFollows {
  if (svsBattleDays.has(transferDay - 1)) return 'svs';
  if (sunfireDays.has(transferDay - 1)) return 'sunfire';
  return 'neither';
}

// The group one state is in on a date, with the ranges it is built from. A state is
// in exactly one group on any date, but it moves between groups as the months pass.
export function groupOfState(groups: BigGroup[], stateNumber: number): BigGroup | undefined {
  return groups.find(one => stateNumber >= one.fromState && stateNumber <= one.toState);
}
