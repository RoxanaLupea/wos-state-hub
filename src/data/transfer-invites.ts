// The players on a transfer's three lists (supabase/transfer-invites.sql), read and written.
// Each row carries the game's copy of the player, kept by the database: it follows the game
// until the player is Transferred, then stays as it was, as the record of that transfer
// (Roxanne, 26 Nov). The rules are in invite-rules.ts.
import { database } from './database.ts';
import { INVITE_LISTS, type Invite, type InviteList, type Transfer } from './invite-rules.ts';
import type { TroopKind } from '../ui/player-profile.ts';

export * from './invite-rules.ts';

const numberOrNull = (value: unknown) =>
  value === null || value === undefined || value === '' || Number.isNaN(Number(value)) ? null : Number(value);

const TROOP_TYPES: Record<string, TroopKind> = { infantry: 'infantry', lancer: 'lancer', marksman: 'marksmen', marksmen: 'marksmen' };

function toInvite(row: Record<string, unknown>, onSite: Set<string>): Invite {
  const troops: Invite['troops'] = {};
  for (const troop of Array.isArray(row.troops) ? row.troops as Record<string, unknown>[] : []) {
    const kind = TROOP_TYPES[String(troop.type)];
    if (kind && Number(troop.tier) > 0) troops[kind] = { tier: Number(troop.tier), fc: Number(troop.fc) || 0 };
  }
  const skillRow = (row.skills ?? {}) as Record<string, unknown>;
  const skills: Invite['skills'] = {};
  for (const kind of ['infantry', 'lancer', 'marksmen'] as TroopKind[]) skills[kind] = numberOrNull(skillRow[kind]);
  const status = String(row.status ?? '');
  const playerId = String(row.player_id ?? '');
  return {
    id: Number(row.id),
    windowId: Number(row.window_id),
    playerId,
    list: (INVITE_LISTS as string[]).includes(String(row.list)) ? row.list as InviteList : 'ordinary',
    position: Number(row.position) || 0,
    setStatus: ['sent', 'transferred', 'rejected', 'expired'].includes(status) ? status as Invite['setStatus'] : null,
    transferredAt: row.transferred_at ? String(row.transferred_at) : null,
    gameReadAt: row.game_read_at ? String(row.game_read_at) : null,
    groupNumber: numberOrNull(row.group_number),
    contactTag: String(row.contact_tag ?? ''),
    contactName: String(row.contact_name ?? ''),
    contactPlayerId: String(row.contact_player_id ?? ''),
    name: String(row.name ?? ''),
    avatar: row.avatar ? String(row.avatar) : null,
    power: numberOrNull(row.power),
    state: numberOrNull(row.state_number),
    furnace: numberOrNull(row.furnace),
    kills: numberOrNull(row.kills),
    labyrinth: numberOrNull(row.labyrinth),
    migrantScore: numberOrNull(row.migrant_score),
    troops,
    skills,
    onSite: onSite.has(playerId)
  };
}

function toTransfer(row: Record<string, unknown>): Transfer {
  return {
    id: Number(row.id),
    date: String(row.transfer_date),
    stateType: row.state_type === 'leading' ? 'leading' : 'ordinary',
    powerCap: numberOrNull(row.power_cap),
    managerId: row.manager_id ? String(row.manager_id) : '',
    managerName: String(row.manager_name ?? ''),
    managerAvatar: row.manager_avatar ? String(row.manager_avatar) : null,
    managerAlliance: String(row.manager_alliance ?? '')
  };
}

// Every transfer the site keeps, oldest first.
export async function loadTransfers(): Promise<Transfer[]> {
  const { data, error } = await database().from('transfer_windows')
    .select('id, transfer_date, state_type, power_cap, manager_id, manager_name, manager_avatar, manager_alliance')
    .order('transfer_date');
  if (error) throw new Error('Could not read the transfers: ' + error.message);
  return (data ?? []).map(toTransfer);
}

// Everyone on the lists, with whether each has an account on the site.
export async function loadInvites(): Promise<Invite[]> {
  const { data, error } = await database().from('transfer_invites').select('*').order('position');
  if (error) throw new Error('Could not read the transfer lists: ' + error.message);
  const rows = (data ?? []) as Record<string, unknown>[];
  const ids = Array.from(new Set(rows.map(row => Number(row.player_id)).filter(Number.isFinite)));
  const onSite = new Set<string>();
  if (ids.length) {
    const answer = await database().rpc('site_player_ids', { player_ids: ids });
    if (!answer.error) for (const one of (answer.data ?? []) as unknown[]) {
      onSite.add(String(typeof one === 'object' && one !== null ? Object.values(one)[0] : one));
    }
  }
  return rows.map(row => toInvite(row, onSite));
}

// The transfer of a date, made when its first player is added.
export async function transferIdOf(date: string): Promise<number> {
  const found = await database().from('transfer_windows').select('id').eq('transfer_date', date).maybeSingle();
  if (found.data?.id) return Number(found.data.id);
  const made = await database().from('transfer_windows')
    .insert({ transfer_date: date, state_type: 'ordinary' }).select('id').single();
  if (made.error) throw new Error('Could not start this transfer: ' + made.error.message);
  return Number(made.data.id);
}

export async function addInvite(date: string, playerId: string, list: InviteList, position: number): Promise<void> {
  const windowId = await transferIdOf(date);
  const { error } = await database().from('transfer_invites')
    .insert({ window_id: windowId, player_id: Number(playerId), list, position });
  if (error) throw new Error('Could not add the player: ' + error.message);
}

export async function changeInvite(id: number, fields: Record<string, unknown>): Promise<void> {
  const { error } = await database().from('transfer_invites').update(fields).eq('id', id);
  if (error) throw new Error('Could not save: ' + error.message);
}

export async function removeInvite(id: number): Promise<void> {
  const { error } = await database().from('transfer_invites').delete().eq('id', id);
  if (error) throw new Error('Could not remove the player: ' + error.message);
}

export async function changeTransfer(date: string, fields: Record<string, unknown>): Promise<void> {
  const id = await transferIdOf(date);
  const { error } = await database().from('transfer_windows').update(fields).eq('id', id);
  if (error) throw new Error('Could not save the transfer: ' + error.message);
}

