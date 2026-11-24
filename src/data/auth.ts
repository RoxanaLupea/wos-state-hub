// Signing in, and who the signed-in person is: their login and their roles. Their game
// accounts (main, alts, farms) are in game_accounts, and everything the game says about
// them in the game data.
//
// Sign-in is through Discord or Google. Discord first, because every alliance already
// uses it. Guests keep browsing without signing in.
import { database } from './database.ts';

export type SignInProvider = 'discord' | 'google';

export interface SignedInPerson {
  userId: string;
  // The name the login gives (Discord or Google), used until a game account is added.
  loginName: string;
  // Roles such as 'owner', 'admin' or 'r4'; a role tied to one alliance carries it.
  roles: { role: string; allianceId: string | null }[];
}

// Who is signed in on this browser, or null for a guest. The login's own row (time zone,
// language) is made the first time, so their game accounts and picks can hang off it.
export async function signedInPerson(): Promise<SignedInPerson | null> {
  const { data } = await database().auth.getSession();
  const user = data.session?.user;
  if (!user) return null;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const loginName = String(meta.full_name ?? meta.name ?? meta.user_name ?? user.email ?? '');

  const [, rolesResult] = await Promise.all([
    database().from('accounts').upsert({ id: user.id }, { onConflict: 'id', ignoreDuplicates: true }),
    database().from('account_roles').select('role, alliance_id').eq('account_id', user.id)
  ]);
  return {
    userId: user.id,
    loginName,
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
