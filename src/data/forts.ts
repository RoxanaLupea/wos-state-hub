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
  // The fort's battle time on its battle day, in UTC ("20:00"), once it is known.
  battleTimeUtc: string | null;
}

// The database keeps a battle's full date and time; the calendar needs its time of day
// in UTC ("20:00").
function timeOfDayUtc(value: unknown): string | null {
  if (!value) return null;
  const when = new Date(String(value));
  if (Number.isNaN(when.getTime())) return null;
  return String(when.getUTCHours()).padStart(2, '0') + ':' + String(when.getUTCMinutes()).padStart(2, '0');
}

// Every season's holders, so the board can step back and forward between seasons.
// There are 16 forts a phase and 8 phases a season: a few hundred rows a year.
export async function loadFortAssignments(): Promise<FortAssignment[]> {
  const { data, error } = await database()
    .from('fort_assignments')
    .select('id, season, phase, fort, alliance_id, credited_to, reserved_for_leads, battle_time_utc')
    .order('season')
    .order('phase')
    .order('fort');

  if (error) throw new Error('Could not read the fortress board: ' + error.message);

  return (data ?? []).map(row => ({
    id: row.id,
    season: row.season,
    phase: row.phase,
    fort: row.fort,
    allianceId: row.alliance_id,
    creditedTo: row.credited_to ?? '',
    reservedForLeads: row.reserved_for_leads ?? 0,
    battleTimeUtc: timeOfDayUtc(row.battle_time_utc)
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
