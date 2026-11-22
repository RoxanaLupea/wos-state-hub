// The game's published transfer groups: which range of states moves on which date.
import { database } from './database.ts';
import type { TransferGroup } from './transfer-rules.ts';

// The groups of a stretch of transfer dates, so several can be shown side by side.
export async function loadTransferGroups(dates: string[]): Promise<TransferGroup[]> {
  if (!dates.length) return [];
  const { data, error } = await database()
    .from('transfer_groups')
    .select('id, transfer_date, from_state, to_state, generation, furnace_cap_upgrades')
    .in('transfer_date', dates)
    .order('from_state');

  if (error) throw new Error('Could not read the transfer groups: ' + error.message);
  return (data ?? []).map(toGroup);
}

// Every date that has groups, newest last.
export async function loadTransferDates(): Promise<string[]> {
  const { data, error } = await database()
    .from('transfer_groups')
    .select('transfer_date')
    .order('transfer_date');

  if (error) throw new Error('Could not read the transfer dates: ' + error.message);
  const dates: string[] = [];
  for (const row of data ?? []) {
    if (!dates.includes(row.transfer_date)) dates.push(row.transfer_date);
  }
  return dates;
}

function toGroup(row: Record<string, unknown>): TransferGroup {
  return {
    id: String(row.id),
    transferDate: String(row.transfer_date),
    fromState: Number(row.from_state),
    toState: Number(row.to_state),
    generation: row.generation === null ? null : Number(row.generation),
    furnaceCapUpgrades: row.furnace_cap_upgrades === null ? null : Number(row.furnace_cap_upgrades)
  };
}

// A state's hero generation on each transfer date: the range the state is in on that
// date carries it. Used to name the heroes that change with the generation.
export async function loadGenerationsOfState(state: number): Promise<{ date: string; generation: number }[]> {
  const { data, error } = await database()
    .from('transfer_groups')
    .select('transfer_date, generation')
    .lte('from_state', state)
    .gte('to_state', state)
    .order('transfer_date');

  if (error) throw new Error('Could not read the hero generations: ' + error.message);
  return (data ?? [])
    .filter(row => row.generation !== null)
    .map(row => ({ date: String(row.transfer_date), generation: Number(row.generation) }));
}
