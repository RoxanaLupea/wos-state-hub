// Reading and writing the tables behind the working pages (availability, rosters,
// plans, members, the map, settings, roles, results, notes). Each page reads whole rows
// and shows them; a form writes one row back.
import { database } from './database.ts';

export type Row = Record<string, unknown>;

// Every row of a table, optionally only those whose column equals a value.
export async function loadRows(table: string, filters: [string, unknown][] = []): Promise<Row[]> {
  let query = database().from(table).select('*');
  for (const [column, value] of filters) query = query.eq(column, value);
  const { data, error } = await query;
  if (error) throw new Error(`Could not read ${table}: ${error.message}`);
  return (data ?? []) as Row[];
}

// Writes one row. With an id it changes that row; with the columns that make a row
// unique it adds or replaces; otherwise it adds a new one. Returns the row as saved.
export async function saveRow(table: string, row: Row, uniqueColumns = ''): Promise<Row> {
  const id = row.id;
  const result = id !== undefined && id !== null && id !== ''
    ? await database().from(table).update(withoutId(row)).eq('id', id).select().single()
    : uniqueColumns
      ? await database().from(table).upsert(withoutId(row), { onConflict: uniqueColumns }).select().single()
      : await database().from(table).insert(withoutId(row)).select().single();
  if (result.error) throw new Error(`Could not save: ${result.error.message}`);
  return (result.data ?? row) as Row;
}

export async function deleteRow(table: string, column: string, value: unknown): Promise<void> {
  const { error } = await database().from(table).delete().eq(column, value);
  if (error) throw new Error(`Could not remove it: ${error.message}`);
}

function withoutId(row: Row): Row {
  const copy = { ...row };
  delete copy.id;
  return copy;
}
