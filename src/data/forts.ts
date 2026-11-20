// Who holds each fortress and stronghold, read from the database.
import { database } from './database.ts';

export interface FortAssignment {
  id: number;
  season: number;
  phase: number;
  fort: string;
  allianceId: string;
  // Who the rewards count for. Empty means the holder itself, or for an academy its
  // main alliance. 'shared' means the whole state.
  creditedTo: string;
  reservedForLeads: number;
}

export async function loadFortAssignments(season: number): Promise<FortAssignment[]> {
  const { data, error } = await database()
    .from('fort_assignments')
    .select('id, season, phase, fort, alliance_id, credited_to, reserved_for_leads')
    .eq('season', season)
    .order('phase');

  if (error) throw new Error('Could not read the fortress board: ' + error.message);

  return (data ?? []).map(row => ({
    id: row.id,
    season: row.season,
    phase: row.phase,
    fort: row.fort,
    allianceId: row.alliance_id,
    creditedTo: row.credited_to ?? '',
    reservedForLeads: row.reserved_for_leads ?? 0
  }));
}

// A state rally lead. A castle lead collects more of each buff than a turret lead;
// how many of each is kept in the settings.
export interface RallyLead {
  id: number;
  allianceId: string;
  inGameName: string;
  inGameId: string;
  tier: string;
  sortOrder: number;
}

// Which lead collects which fort's buff, and how many.
export interface BuffAllocation {
  id: number;
  fortAssignmentId: number;
  rallyLeadId: number;
  quantity: number;
}

export async function loadRallyLeads(): Promise<RallyLead[]> {
  const { data, error } = await database()
    .from('rally_leads')
    .select('id, alliance_id, in_game_name, in_game_id, tier, sort_order')
    .order('sort_order');

  if (error) throw new Error('Could not read the rally leads: ' + error.message);

  return (data ?? []).map(row => ({
    id: row.id,
    allianceId: row.alliance_id,
    inGameName: row.in_game_name ?? '',
    inGameId: row.in_game_id ?? '',
    tier: row.tier ?? 'turret',
    sortOrder: row.sort_order ?? 0
  }));
}

export async function loadBuffAllocations(assignmentIds: number[]): Promise<BuffAllocation[]> {
  if (!assignmentIds.length) return [];
  const { data, error } = await database()
    .from('buff_allocations')
    .select('id, fort_assignment_id, rally_lead_id, quantity')
    .in('fort_assignment_id', assignmentIds);

  if (error) throw new Error('Could not read the buff plan: ' + error.message);

  return (data ?? []).map(row => ({
    id: row.id,
    fortAssignmentId: row.fort_assignment_id,
    rallyLeadId: row.rally_lead_id,
    quantity: row.quantity ?? 0
  }));
}
