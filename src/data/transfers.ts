// The state's own transfer windows and the people invited into them.
import { database } from './database.ts';

export interface TransferWindow {
  id: number;
  transferDate: string;
  // An ordinary state takes 35 by invitation and 20 in the open phase. A leading
  // state takes 20 and 10 and has no special invites.
  stateType: string;
  powerCap: number | null;
  specialInvitesAvailable: number;
  status: string;
  note: string;
}

export interface TransferCandidate {
  id: number;
  windowId: number;
  inGameName: string;
  inGameId: string;
  playerPower: number | null;
  fcLevel: string;
  currentState: number | null;
  destinationAllianceId: string;
  stage: string;
  inviteStatus: string;
  outcome: string;
  inInitialList: boolean;
  replacesCandidateId: number | null;
  priority: number;
  helios: string;
  labyrinth: number | null;
  note: string;
  flagCount: number;
  isBlacklisted: boolean;
}

// How many people the state can take, by its type and the stage of the window.
export function placesOf(stateType: string): { invitation: number; open: number } {
  return stateType === 'leading'
    ? { invitation: 20, open: 10 }
    : { invitation: 35, open: 20 };
}

export async function loadTransferWindows(): Promise<TransferWindow[]> {
  const { data, error } = await database()
    .from('transfer_windows')
    .select('id, transfer_date, state_type, power_cap, special_invites_available, status, note')
    .order('transfer_date', { ascending: false });

  if (error) throw new Error('Could not read the transfer windows: ' + error.message);
  return (data ?? []).map(toWindow);
}

// Everyone on the lists of a set of windows, read in one go.
export async function loadCandidatesOf(windowIds: number[]): Promise<TransferCandidate[]> {
  if (!windowIds.length) return [];
  const { data, error } = await database()
    .from('transfer_candidates')
    .select(`id, window_id, in_game_name, in_game_id, player_power, fc_level, current_state,
             destination_alliance_id, stage, invite_status, outcome, in_initial_list,
             replaces_candidate_id, priority, helios, labyrinth, note, candidate_flags (id)`)
    .in('window_id', windowIds)
    .order('priority');

  if (error) throw new Error('Could not read the transfer lists: ' + error.message);
  return (data ?? []).map(toCandidate);
}

export async function loadCandidates(windowId: number): Promise<TransferCandidate[]> {
  const { data, error } = await database()
    .from('transfer_candidates')
    .select(`id, window_id, in_game_name, in_game_id, player_power, fc_level, current_state,
             destination_alliance_id, stage, invite_status, outcome, in_initial_list,
             replaces_candidate_id, priority, helios, labyrinth, note,
             candidate_flags (id), blacklist!inner (in_game_id)`)
    .eq('window_id', windowId)
    .order('priority');

  // The blacklist join is optional, so it is asked for separately when the joined
  // read is not allowed.
  if (error) return loadCandidatesWithoutBlacklist(windowId);
  return (data ?? []).map(toCandidate);
}

async function loadCandidatesWithoutBlacklist(windowId: number): Promise<TransferCandidate[]> {
  const { data, error } = await database()
    .from('transfer_candidates')
    .select(`id, window_id, in_game_name, in_game_id, player_power, fc_level, current_state,
             destination_alliance_id, stage, invite_status, outcome, in_initial_list,
             replaces_candidate_id, priority, helios, labyrinth, note, candidate_flags (id)`)
    .eq('window_id', windowId)
    .order('priority');

  if (error) throw new Error('Could not read the transfer list: ' + error.message);
  return (data ?? []).map(toCandidate);
}

function toWindow(row: Record<string, unknown>): TransferWindow {
  return {
    id: Number(row.id),
    transferDate: String(row.transfer_date),
    stateType: String(row.state_type ?? 'ordinary'),
    powerCap: row.power_cap === null || row.power_cap === undefined ? null : Number(row.power_cap),
    specialInvitesAvailable: Number(row.special_invites_available ?? 0),
    status: String(row.status ?? 'planning'),
    note: String(row.note ?? '')
  };
}

function toCandidate(row: Record<string, unknown>): TransferCandidate {
  const flags = row.candidate_flags;
  return {
    id: Number(row.id),
    windowId: Number(row.window_id),
    inGameName: String(row.in_game_name ?? ''),
    inGameId: String(row.in_game_id ?? ''),
    playerPower: row.player_power === null || row.player_power === undefined
      ? null : Number(row.player_power),
    fcLevel: String(row.fc_level ?? ''),
    currentState: row.current_state === null || row.current_state === undefined
      ? null : Number(row.current_state),
    destinationAllianceId: String(row.destination_alliance_id ?? ''),
    stage: String(row.stage ?? ''),
    inviteStatus: String(row.invite_status ?? 'not_sent'),
    outcome: String(row.outcome ?? ''),
    inInitialList: row.in_initial_list === true,
    replacesCandidateId: row.replaces_candidate_id === null || row.replaces_candidate_id === undefined
      ? null : Number(row.replaces_candidate_id),
    priority: Number(row.priority ?? 0),
    helios: String(row.helios ?? ''),
    labyrinth: row.labyrinth === null || row.labyrinth === undefined ? null : Number(row.labyrinth),
    note: String(row.note ?? ''),
    flagCount: Array.isArray(flags) ? flags.length : 0,
    isBlacklisted: Array.isArray(row.blacklist) ? row.blacklist.length > 0 : false
  };
}
