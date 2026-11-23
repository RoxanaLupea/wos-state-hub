// The game's published transfer groups: which range of states moves on which date.
import { database } from './database.ts';
import type { TransferGroup } from './transfer-rules.ts';

// The database hands back at most this many rows for one request, and the groups of
// every transfer date add up to several thousand. Longer lists are read in pages.
const ROWS_PER_READ = 1000;

type RowsRead = { data: Record<string, unknown>[] | null; error: { message: string } | null; count?: number | null };

// Reads every row of a list in pages. The first page also says how many rows there are,
// so the rest are asked for together rather than one after another.
async function readEveryRow(readRows: (first: number, last: number) => PromiseLike<RowsRead>): Promise<Record<string, unknown>[]> {
  const firstPage = await readRows(0, ROWS_PER_READ - 1);
  if (firstPage.error) throw new Error(firstPage.error.message);
  const rows = firstPage.data ?? [];
  const total = firstPage.count ?? rows.length;
  const laterPages: PromiseLike<RowsRead>[] = [];
  for (let first = ROWS_PER_READ; first < total; first += ROWS_PER_READ) {
    laterPages.push(readRows(first, first + ROWS_PER_READ - 1));
  }
  for (const page of await Promise.all(laterPages)) {
    if (page.error) throw new Error(page.error.message);
    rows.push(...(page.data ?? []));
  }
  return rows;
}

// The groups of a stretch of transfer dates, so several can be shown side by side.
export async function loadTransferGroups(dates: string[]): Promise<TransferGroup[]> {
  if (!dates.length) return [];
  const rows = await readEveryRow((first, last) => database()
    .from('transfer_groups')
    .select('id, transfer_date, from_state, to_state, generation, furnace_cap_upgrades', { count: 'exact' })
    .in('transfer_date', dates)
    .order('transfer_date')
    .order('from_state')
    .order('id')
    .range(first, last)
  ).catch(error => { throw new Error('Could not read the transfer groups: ' + error.message); });
  return rows.map(toGroup);
}

// Every date that has groups, newest last.
export async function loadTransferDates(): Promise<string[]> {
  const rows = await readEveryRow((first, last) => database()
    .from('transfer_groups')
    .select('transfer_date', { count: 'exact' })
    .order('transfer_date')
    .order('id')
    .range(first, last)
  ).catch(error => { throw new Error('Could not read the transfer dates: ' + error.message); });
  const dates: string[] = [];
  for (const row of rows) {
    const date = String(row.transfer_date);
    if (!dates.includes(date)) dates.push(date);
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
