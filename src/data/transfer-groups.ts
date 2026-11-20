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
