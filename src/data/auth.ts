// Signing in, and who the signed-in person is: their account (in-game name and id,
// their alliance), their farms and alts, and their roles.
//
// Sign-in is through Discord or Google. Discord first, because every alliance already
// uses it. Guests keep browsing without signing in.
import { database } from './database.ts';

export type SignInProvider = 'discord' | 'google';

export interface Account {
  inGameName: string;
  inGameId: string;
  allianceId: string | null;
}

export interface SignedInPerson {
  userId: string;
  // The name the login gives (Discord or Google), used until an in-game name is set.
  loginName: string;
  account: Account | null;
  // Roles such as 'owner', 'admin' or 'r4'; a role tied to one alliance carries it.
  roles: { role: string; allianceId: string | null }[];
}

// Who is signed in on this browser, with their account, or null for a guest.
export async function signedInPerson(): Promise<SignedInPerson | null> {
  const { data } = await database().auth.getSession();
  const user = data.session?.user;
  if (!user) return null;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const loginName = String(meta.full_name ?? meta.name ?? meta.user_name ?? user.email ?? '');

  const [accountResult, rolesResult] = await Promise.all([
    database().from('accounts').select('in_game_name, in_game_id, alliance_id').eq('id', user.id).maybeSingle(),
    database().from('account_roles').select('role, alliance_id').eq('account_id', user.id)
  ]);
  const row = accountResult.data as Record<string, unknown> | null;
  return {
    userId: user.id,
    loginName,
    account: row ? {
      inGameName: String(row.in_game_name ?? ''),
      inGameId: String(row.in_game_id ?? ''),
      allianceId: row.alliance_id ? String(row.alliance_id) : null
    } : null,
    roles: ((rolesResult.data ?? []) as Record<string, unknown>[]).map(one => ({
      role: String(one.role),
      allianceId: one.alliance_id ? String(one.alliance_id) : null
    }))
  };
}

// Sends the browser to Discord or Google; it comes back to this same page signed in.
export async function signInWith(provider: SignInProvider): Promise<void> {
  const { error } = await database().auth.signInWithOAuth({
    provider,
    options: { redirectTo: window.location.origin + window.location.pathname }
  });
  if (error) throw new Error('Could not start signing in: ' + error.message);
}

export async function signOut(): Promise<void> {
  await database().auth.signOut();
}

// The person's own account row: their in-game name and id, and their alliance. The id
// is unique across accounts; someone whose id is taken raises it with an admin.
export async function saveAccount(userId: string, account: Account): Promise<void> {
  const { error } = await database().from('accounts').upsert({
    id: userId,
    in_game_name: account.inGameName || null,
    in_game_id: account.inGameId || null,
    alliance_id: account.allianceId,
    updated_at: new Date().toISOString()
  });
  if (error) {
    if (error.code === '23505') {
      throw new Error('That in-game id is already on another account. Raise it with an admin.');
    }
    throw new Error('Could not save your details: ' + error.message);
  }
}

// What the person may do. The owner sets event dates and repeats; admins can edit
// anything; an alliance manager (the alliance's R4s and R5s) sets their own alliance's
// times; state managers do the state's planning except battles, such as the forts;
// battle managers plan the battles.
export function isOwner(person: SignedInPerson | null): boolean {
  return Boolean(person?.roles.some(one => one.role === 'owner'));
}

export function isAdmin(person: SignedInPerson | null): boolean {
  return Boolean(person?.roles.some(one => one.role === 'owner' || one.role === 'admin'));
}

export function leadsAlliance(person: SignedInPerson | null, allianceId: string): boolean {
  return isAdmin(person) || Boolean(person?.roles.some(one =>
    one.role === 'alliance_manager' && one.allianceId === allianceId));
}

export function managesState(person: SignedInPerson | null): boolean {
  return isAdmin(person) || Boolean(person?.roles.some(one => one.role === 'state_manager'));
}

export function managesBattles(person: SignedInPerson | null): boolean {
  return isAdmin(person) || Boolean(person?.roles.some(one => one.role === 'battle_manager'));
}
