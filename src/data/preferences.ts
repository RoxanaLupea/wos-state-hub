// The player's own choices, kept between visits: which categories and events show,
// which alliance times they follow, the calendar view, UTC or their own time, which
// alliance is theirs, and the Transfers page's switches. Kept on this device, and with
// the login once signed in (login_preferences), so they follow the player to every
// device, as the old app did.

import { database } from './database.ts';

const STORAGE_KEY = 'stateHub.preferences';

export interface Preferences {
  categories: string[];
  hiddenEvents: string[];
  followedScheduleIds: string[];
  calendarView: 'week' | 'month' | 'year';
  timeMode: 'game' | 'local';
  myAllianceId: string | null;
  // The event tab looked at last; an event opens on it when it has one (Timeline first).
  openInfoTab?: string;
  // Opponent notes: 'on' hides other alliances' notes, or all of them.
  opponentNotes?: { others: string; all: string };
  // The game account picked in the menu under the player's name.
  activeGameAccountId?: number | null;
  // Transfers: which battles' transfers show, all or our group, ranges or groups.
  transfers?: { svs: boolean; sunfire: boolean; scope: 'all' | 'mine'; groups: boolean };
}

// Storage can be missing or refuse (private browsing, a full disk), so every read and
// write is allowed to fail quietly: the site then simply starts with its defaults.
export function readPreferences(): Partial<Preferences> {
  try {
    const text = window.localStorage.getItem(STORAGE_KEY);
    return text ? preferencesFrom(JSON.parse(text)) : {};
  } catch {
    return {};
  }
}

// The choices from what was stored, here or with the login: anything not understood is
// left out, so the site uses its default for it.
export function preferencesFrom(value: unknown): Partial<Preferences> {
  try {
    if (!value || typeof value !== 'object') return {};
    const stored = value as Record<string, unknown>;
    const strings = (value: unknown) =>
      Array.isArray(value) ? value.filter((one): one is string => typeof one === 'string') : undefined;
    const read: Partial<Preferences> = {};
    const categories = strings(stored.categories);
    if (categories) read.categories = categories;
    const hiddenEvents = strings(stored.hiddenEvents);
    if (hiddenEvents) read.hiddenEvents = hiddenEvents;
    const followed = strings(stored.followedScheduleIds);
    if (followed) read.followedScheduleIds = followed;
    if (stored.calendarView === 'week' || stored.calendarView === 'month' || stored.calendarView === 'year') {
      read.calendarView = stored.calendarView;
    }
    if (stored.timeMode === 'game' || stored.timeMode === 'local') read.timeMode = stored.timeMode;
    if (typeof stored.myAllianceId === 'string' || stored.myAllianceId === null) {
      read.myAllianceId = stored.myAllianceId;
    }
    if (typeof stored.openInfoTab === 'string') read.openInfoTab = stored.openInfoTab;
    if (typeof stored.activeGameAccountId === 'number') read.activeGameAccountId = stored.activeGameAccountId;
    const notes = stored.opponentNotes as Record<string, unknown> | undefined;
    if (notes && typeof notes === 'object') {
      read.opponentNotes = { others: notes.others === 'on' ? 'on' : '', all: notes.all === 'on' ? 'on' : '' };
    }
    const transfers = stored.transfers as Record<string, unknown> | undefined;
    if (transfers && typeof transfers === 'object') {
      const svs = transfers.svs !== false;
      // One of the two always stays on.
      const sunfire = transfers.sunfire !== false || !svs;
      read.transfers = { svs, sunfire, scope: transfers.scope === 'mine' ? 'mine' : 'all', groups: transfers.groups === true };
    }
    return read;
  } catch {
    return {};
  }
}

export function writePreferences(preferences: Preferences): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Not important enough to stop anything: the choices just are not kept.
  }
}

// Keeps the choices with the login, so they follow the player to their other devices.
export async function savePreferencesWithLogin(userId: string, preferences: Preferences): Promise<void> {
  const { error } = await database().from('login_preferences')
    .upsert({ account_id: userId, preferences, updated_at: new Date().toISOString() }, { onConflict: 'account_id' });
  if (error) throw new Error(error.message);
}
