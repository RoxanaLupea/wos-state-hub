// What the game says about a player's accounts, read by the database from the Whiteout
// Stats API (supabase/game-data.sql and game-refresh.sql). The site only reads it, looks
// up a typed in-game ID, and asks for a fresh read.
import { database } from './database.ts';
import type { Row } from './records.ts';

// The rows of the given in-game IDs, as the database keeps them.
export async function readGamePlayers(ids: string[]): Promise<Row[]> {
  const numbers = ids.filter(id => /^\d+$/.test(id)).map(Number);
  if (numbers.length === 0) return [];
  const { data, error } = await database().from('game_players')
    .select('player_id, state_number, alliance_tag, data, read_at, game_read_at, refresh_asked_at').in('player_id', numbers);
  if (error) throw new Error(error.message);
  return (data ?? []) as Row[];
}

// The given players' places on their states' top-100 boards (supabase/state-ranks.sql):
// one row per board they are on, for every state the site reads.
export async function readStateRanks(ids: string[]): Promise<Row[]> {
  const numbers = ids.filter(id => /^\d+$/.test(id)).map(Number);
  if (numbers.length === 0) return [];
  const { data, error } = await database().rpc('game_state_ranks', { player_ids: numbers });
  if (error) throw new Error(error.message);
  return (data ?? []) as Row[];
}

// The alliances' rosters (game_alliances): the main alliances are read every hour, the
// academies twice a day. Each member carries name, picture, power, furnace level, kills
// and rank, often newer than the player's own read (twice a day).
export async function readGameRosters(): Promise<Row[]> {
  // Only what the pages use of each member (supabase/roster-members.sql).
  const { data, error } = await database().rpc('game_rosters');
  if (error) throw new Error(error.message);
  return (data ?? []) as Row[];
}

// What a typed ID is in the game, so the player sees it is the right account before
// adding it. Null when the game has no such player.
export interface LookedUp { name: string; avatar: string | null; power: number | null; state: number | null; alliance: string | null; furnace: number | null }

export async function lookUpGameAccount(id: string): Promise<LookedUp | null> {
  const { data, error } = await database().rpc('look_up_game_account', { player_number: Number(id) });
  if (error) throw new Error(error.message);
  return data && (data as LookedUp).name ? data as LookedUp : null;
}

// Asks for a fresh read of one account. The database allows it once the game was last
// read over an hour ago; within the hour it only answers when that was.
export async function askGameRefresh(id: string): Promise<void> {
  const { error } = await database().rpc('ask_game_refresh', { player_number: Number(id) });
  if (error) throw new Error(error.message);
}

// The skill levels of Exalted troops, kept per in-game ID (supabase/exalted-skill-levels.sql).
export async function readSkillLevels(ids: string[]): Promise<Row[]> {
  const numbers = ids.filter(id => /^\d+$/.test(id)).map(Number);
  if (numbers.length === 0) return [];
  const { data, error } = await database().from('exalted_skill_levels').select('*').in('player_id', numbers);
  if (error) throw new Error(error.message);
  return (data ?? []) as Row[];
}

// Sets one troop type's level: 0 for None, 1 to 3, or null to clear it.
export async function setSkillLevel(id: string, troop: string, level: number | null): Promise<void> {
  const { error } = await database().rpc('set_skill_level', { player_number: Number(id), troop, level });
  if (error) throw new Error(error.message);
}

// Each player's alliance (supabase/accounts-from-game.sql): it changes only after 24
// hours in a row somewhere new, or when the move is confirmed; a dismissed move waits 3
// days. While the game shows the account somewhere else, the moving columns say where and
// since when.
export async function readPlayerAlliances(ids: string[]): Promise<Row[]> {
  const numbers = ids.filter(id => /^\d+$/.test(id)).map(Number);
  if (numbers.length === 0) return [];
  const { data, error } = await database().from('game_player_alliances')
    .select('player_id, state_number, alliance_tag, moving_state, moving_tag, moving_since, dismissed_until').in('player_id', numbers);
  if (error) throw new Error(error.message);
  return (data ?? []) as Row[];
}

// The account's owner, its R4s or an admin confirms the move (the alliance becomes the
// one the game shows now) or dismisses it (the alliance stays for 3 days).
export async function settleAllianceMove(id: string, choice: 'confirm' | 'dismiss'): Promise<void> {
  const { error } = await database().rpc(choice + '_alliance_move', { player_number: Number(id) });
  if (error) throw new Error(error.message);
}
