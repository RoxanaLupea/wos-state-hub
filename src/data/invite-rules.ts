// The rules the Invites and Records pages go by (Roxanne, 26 Nov; notes/design-decisions.md,
// Transfers), kept apart from the database so they can be checked on their own.
import { dayFromText, textFromDay, weekdayOf, yearAndMonthOf, startOfMonth } from '../calendar/days.ts';
import type { TroopKind } from '../ui/player-profile.ts';

export type InviteList = 'special' | 'ordinary' | 'open';
export const INVITE_LISTS: InviteList[] = ['special', 'ordinary', 'open'];

// What the row shows. Ready and Over cap are worked out from the power and the cap; the
// others are set by the transfer manager or an admin.
export type InviteStatus = 'ready' | 'over' | 'sent' | 'transferred' | 'rejected' | 'expired';
export const INVITE_STATUSES: InviteStatus[] = ['ready', 'over', 'sent', 'transferred', 'rejected', 'expired'];

export interface InviteTroop { tier: number; fc: number }

export interface Invite {
  id: number;
  windowId: number;
  playerId: string;
  list: InviteList;
  position: number;
  setStatus: 'sent' | 'transferred' | 'rejected' | 'expired' | null;
  transferredAt: string | null;
  groupNumber: number | null;
  contactTag: string;
  contactName: string;
  contactPlayerId: string;
  name: string;
  avatar: string | null;
  power: number | null;
  state: number | null;
  furnace: number | null;
  kills: number | null;
  labyrinth: number | null;
  migrantScore: number | null;
  troops: Partial<Record<TroopKind, InviteTroop>>;
  skills: Partial<Record<TroopKind, number | null>>;
  onSite: boolean;
}

export interface Transfer {
  id: number | null;
  date: string;
  stateType: 'ordinary' | 'leading';
  powerCap: number | null;
  managerId: string;
  managerName: string;
  managerAvatar: string | null;
  managerAlliance: string;
}

// ---------------------------------------------------------------------------
// The transfer's phases, by the calendar's Transfer event: Pre-Transfer on days 1 to 3,
// the invitation transfer on days 4 and 5, the open transfer on days 6 and 7, each from
// the reset (00:00 UTC). The date is the transfer's first day.

const DAY = 86400000;

export interface TransferTimes { start: number; invitation: number; open: number; end: number; swap: number }

export function timesOf(date: string): TransferTimes {
  const start = dayFromText(date) * DAY;
  const end = start + 7 * DAY;
  // The transfer stays the current one until the Monday after it ends (Roxanne, 26 Nov:
  // "on Monday the list for the next month will take its place").
  const endDay = end / DAY;
  const toMonday = (7 - weekdayOf(endDay)) % 7;
  return { start, invitation: start + 3 * DAY, open: start + 5 * DAY, end, swap: end + toMonday * DAY };
}

export type TransferPhase = 'coming' | 'invitation' | 'open' | 'over';

// Before the invitation phase the transfer is still to come (Pre-Transfer included).
export function phaseOf(date: string, now: number): TransferPhase {
  const times = timesOf(date);
  if (now < times.invitation) return 'coming';
  if (now < times.open) return 'invitation';
  if (now < times.end) return 'open';
  return 'over';
}

// "1d 14h 20m", as the mockup writes it; under a day, hours and minutes.
export function countdownText(milliseconds: number): string {
  const minutes = Math.max(0, Math.floor(milliseconds / 60000));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const rest = minutes % 60;
  return (days ? days + 'd ' : '') + (days || hours ? hours + 'h ' : '') + String(rest).padStart(days || hours ? 2 : 1, '0') + 'm';
}

// The transfer the page focuses on: the first whose Monday swap has not come yet.
export function currentTransferDate(dates: string[], now: number): string {
  return dates.find(date => timesOf(date).swap > now) ?? '';
}

// ---------------------------------------------------------------------------
// Places

// Ordinary state: 35 by invitation and 20 in the open phase; leading: 20 and 10.
export function placesOf(stateType: string): { ordinary: number; open: number } {
  return stateType === 'leading' ? { ordinary: 20, open: 10 } : { ordinary: 35, open: 20 };
}

// Special invites: an ordinary state banks up to 3, one restored on the 1st of each
// month at 00:00 UTC; a leading state has none. 1458 has 3 for the 6 Dec 2026 transfer
// (Roxanne, 26 Nov); every later one follows from the specials used before it. One
// restored during a transfer's own days counts for that transfer, with the day it
// becomes available (rules-and-open-items.md, "Special invites earned").
const SPECIALS_KNOWN = { date: '2026-12-06', count: 3 };
const SPECIALS_BANK = 3;

export interface Specials { count: number; restoredOn: string | null }

function firstsOfMonthIn(from: number, to: number): number[] {
  const days: number[] = [];
  let { year, month } = yearAndMonthOf(Math.floor(from / DAY));
  for (let guard = 0; guard < 60; guard++) {
    const first = startOfMonth(year, month) * DAY;
    if (first > to) break;
    if (first > from) days.push(first);
    month += 1;
    if (month > 11) { month = 0; year += 1; }
  }
  return days;
}

export function specialsOf(date: string, dates: string[], transfers: Transfer[], invites: Invite[]): Specials {
  const typeOf = (one: string) => transfers.find(transfer => transfer.date === one)?.stateType ?? 'ordinary';
  if (typeOf(date) === 'leading') return { count: 0, restoredOn: null };
  if (date <= SPECIALS_KNOWN.date) return { count: SPECIALS_KNOWN.count, restoredOn: null };
  const usedIn = (one: string) => {
    const transfer = transfers.find(item => item.date === one);
    return transfer ? invites.filter(invite => invite.windowId === transfer.id && invite.list === 'special' && invite.setStatus === 'transferred').length : 0;
  };
  const chain = dates.filter(one => one >= SPECIALS_KNOWN.date && one <= date).sort();
  let bank = SPECIALS_KNOWN.count;
  let restoredOn: string | null = null;
  for (let index = 1; index < chain.length; index++) {
    const before = timesOf(chain[index - 1]);
    const now = timesOf(chain[index]);
    const restored = firstsOfMonthIn(before.end, now.end);
    bank = typeOf(chain[index - 1]) === 'leading' ? bank : bank - usedIn(chain[index - 1]);
    // The ones restored before the transfer starts, then the one restored during it; that
    // one is told apart ("1 from <date>") only when it adds a place, as 3 is the most.
    const during = restored.find(first => first > now.start);
    bank = Math.max(0, Math.min(SPECIALS_BANK, bank + restored.filter(first => first !== during).length));
    const adds = during !== undefined && bank < SPECIALS_BANK;
    if (adds) bank += 1;
    restoredOn = index === chain.length - 1 && adds ? textFromDay((during as number) / DAY) : null;
  }
  return { count: bank, restoredOn };
}

// ---------------------------------------------------------------------------
// The power cap: the one recorded, or an estimate from 1458's hero generation on the
// transfer's date (rules-and-open-items.md, State transfers), which acts as the cap until
// confirmed or changed (Roxanne, 26 Nov).

const CAP_BY_GENERATION: Record<number, number> = {
  11: 930e6, 12: 1e9, 13: 1.1e9, 14: 1.15e9, 15: 1.2e9, 16: 1.25e9, 17: 1.3e9, 18: 1.35e9
};

export function capOf(transfer: Transfer | undefined, generation: number | null): number | null {
  if (transfer?.powerCap) return transfer.powerCap;
  if (generation === null) return null;
  return CAP_BY_GENERATION[Math.min(18, generation)] ?? null;
}

// A special invite is not held to the cap.
export function statusOf(invite: Invite, cap: number | null): InviteStatus {
  if (invite.setStatus) return invite.setStatus;
  if (invite.list !== 'special' && cap !== null && invite.power !== null && invite.power > cap) return 'over';
  return 'ready';
}

// ---------------------------------------------------------------------------
// Groups: a group is drawn in its own colour; neighbouring groups never share one, and
// sky, aqua and cobalt sit apart in the order (Roxanne, 26 Nov: "these look good").
export const GROUP_COLOURS = ['#5FD0C2', '#EE8FB8', '#7FC8F2', '#F4A07E', '#A99BF5', '#6FD6EC', '#D98BE6', '#7C92F5'];

// Each group's colour, in the order the groups first appear down the lists.
export function groupColours(invites: Invite[]): Map<number, string> {
  const colours = new Map<number, string>();
  for (const invite of invites) {
    if (invite.groupNumber === null || colours.has(invite.groupNumber)) continue;
    colours.set(invite.groupNumber, GROUP_COLOURS[colours.size % GROUP_COLOURS.length]);
  }
  return colours;
}

// A list in its order.
export function listOf(invites: Invite[], windowId: number | null, list: InviteList): Invite[] {
  return invites.filter(invite => invite.windowId === windowId && invite.list === list)
    .sort((left, right) => left.position - right.position || left.id - right.id);
}
