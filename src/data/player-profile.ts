// Saving a player's game accounts from their page: whose account it is, main, alt or
// farm, and the foundry power. Everything else about it comes from the game data.
import { database } from './database.ts';
import type { Row } from './records.ts';

function problemText(error: { code?: string; message: string }): Error {
  if (error.code === '23505') return new Error('That in-game id is already on another account. Raise it with an admin.');
  return new Error('Could not save: ' + error.message);
}

// Changes a game account, or adds one when it has no id yet. Returns the row as saved.
export async function saveGameAccount(id: number | null, ownerId: string, kind: 'main' | 'alt' | 'farm', fields: Row): Promise<Row> {
  const stamp = { updated_at: new Date().toISOString() };
  const result = id !== null
    ? await database().from('game_accounts').update({ ...fields, ...stamp }).eq('id', id).select().single()
    : await database().from('game_accounts').insert({ owner_id: ownerId, kind, ...fields, ...stamp }).select().single();
  if (result.error) throw problemText(result.error);
  return result.data as Row;
}

// Removes an alt or a farm (never the main, which the page does not offer).
export async function removeGameAccount(id: number): Promise<void> {
  const { error } = await database().from('game_accounts').delete().eq('id', id).neq('kind', 'main');
  if (error) throw new Error('Could not remove it: ' + error.message);
}
