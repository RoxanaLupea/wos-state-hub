import { database } from './database.ts';

export interface Alliance {
  id: string;
  name: string;
  tag: string;
  mainAllianceId: string | null;
  baseColor: string | null;
  secondColor: string | null;
  sortOrder: number;
}

export async function loadAlliances(): Promise<Alliance[]> {
  const { data, error } = await database()
    .from('alliances')
    .select('id, name, tag, main_alliance_id, base_color, second_color, sort_order')
    .eq('status', 'approved')
    .order('sort_order');

  if (error) throw new Error('Could not read the alliances: ' + error.message);

  return (data ?? []).map(row => ({
    id: row.id,
    name: row.name,
    tag: row.tag,
    mainAllianceId: row.main_alliance_id,
    baseColor: row.base_color,
    secondColor: row.second_color,
    sortOrder: row.sort_order
  }));
}
