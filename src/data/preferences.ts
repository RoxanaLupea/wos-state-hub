// The player's own choices, kept on this device between visits, as the old app kept
// them: which categories and events show, which alliance times they follow, the
// calendar view, UTC or their own time, and which alliance is theirs.
// Once sign-in works they can also be kept with the account, as the old app did.

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
  // The main and the alts on the profile: one at a time, or side by side.
  accountView?: 'one' | 'both';
}

// Storage can be missing or refuse (private browsing, a full disk), so every read and
// write is allowed to fail quietly: the site then simply starts with its defaults.
export function readPreferences(): Partial<Preferences> {
  try {
    const text = window.localStorage.getItem(STORAGE_KEY);
    if (!text) return {};
    const stored = JSON.parse(text) as Record<string, unknown>;
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
    if (stored.accountView === 'one' || stored.accountView === 'both') read.accountView = stored.accountView;
    const notes = stored.opponentNotes as Record<string, unknown> | undefined;
    if (notes && typeof notes === 'object') {
      read.opponentNotes = { others: notes.others === 'on' ? 'on' : '', all: notes.all === 'on' ? 'on' : '' };
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
