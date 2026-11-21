import { database } from './database.ts';

export interface Alliance {
  id: string;
  name: string;
  tag: string;
  mainAllianceId: string | null;
  baseColor: string | null;
  secondColor: string | null;
  sortOrder: number;
  // The day the alliance left the state, or null while it is still here.
  leftOn: string | null;
}

export async function loadAlliances(): Promise<Alliance[]> {
  const { data, error } = await database()
    .from('alliances')
    .select('id, name, tag, main_alliance_id, base_color, second_color, sort_order, left_on')
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
    sortOrder: row.sort_order,
    leftOn: row.left_on
  }));
}

// The alliances still in the state. An alliance that left keeps its name on past
// records, such as the forts it held, but is no longer offered anywhere else.
export function alliancesStillHere(alliances: Alliance[]): Alliance[] {
  return alliances.filter(alliance => !alliance.leftOn);
}

// The alliances loaded for this page, so a tag can be looked up wherever a time is
// shown. Filled once the page has them.
let allianceList: Alliance[] = [];

export function rememberAlliances(alliances: Alliance[]): void {
  allianceList = alliances;
}

export function allianceById(id: string): Alliance | undefined {
  return allianceList.find(alliance => alliance.id === id);
}

export function allianceTag(id: string): string {
  return allianceById(id)?.tag ?? id;
}

// An alliance and its academies count as one: a player in an academy wants to see
// the main alliance's times too.
export function allianceFamilyOf(allianceId: string | null): string[] {
  const mine = allianceId ? allianceById(allianceId) : undefined;
  if (!mine) return [];
  const mainId = mine.mainAllianceId ?? mine.id;
  return [mainId].concat(
    allianceList.filter(alliance => alliance.mainAllianceId === mainId).map(alliance => alliance.id));
}
