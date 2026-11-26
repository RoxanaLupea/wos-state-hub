// Transfers · Invites and Records (Roxanne, 26 Nov), as drawn in the accepted mockup
// tools/mockups/invites/invites_status.py and decided in notes/design-decisions.md.
//
// Invites is a planning page: the current transfer (the next in the queue, until the
// Monday after it ends) and the ones after it, never past ones. Three lists, Special
// Invites, Ordinary Invites and Open Transfer, each player on the shared row
// (invite-row.ts). On a computer the lists scroll in their own box beside a card with the
// transfer's numbers, or the profile of the player opened. On a phone the title holds the
// phase and the time left, and Details opens the card from the bottom.
//
// Records: past transfers, newest first, two side by side on a computer, one at a time on
// a phone; who came, as they were.
import './invites.css';
import { escapeForPage } from './escape.ts';
import { pictureOf, filterId } from './player-profile.ts';
import { playerSearchField, playerSearchChoice, playerSearchTyped, forgetPlayerSearch, type FoundPlayer } from './player-search.ts';
import { EDIT_ICON } from './edit-forms.ts';
import {
  inviteRow, STAR, allianceTagPill, shortNumber, statusIcon, lineIcon, COMPACT_HEAD, ADD_ICON, DETAILS_ICON, STATUS_WORDS
} from './invite-row.ts';
import {
  INVITE_LISTS, INVITE_STATUSES, listOf, statusOf, phaseOf, timesOf, countdownText, currentTransferDate, placesOf,
  specialsOf, capOf, groupColours, addInvite, changeInvite, removeInvite, changeTransfer,
  type Invite, type InviteList, type InviteStatus, type Transfer, type TransferPhase
} from '../data/transfer-invites.ts';
import type { Alliance } from '../data/alliances.ts';
import type { LookedUp } from '../data/game-data.ts';
import { MONTH_SHORT } from './day-names.ts';

// ---------------------------------------------------------------------------
// What the page is given

export interface InvitesContext {
  now: number;
  // Every transfer date known (the published groups and the transfers kept), oldest first.
  dates: string[];
  transfers: Transfer[];
  invites: Invite[];
  alliances: Alliance[];
  // 1458's group on a date ("1428 – 1491"), and its hero generation, when known.
  groupOf(date: string): string | null;
  generationOf(date: string): number | null;
  signedIn: boolean;
  isAdmin: boolean;
  // Admins and R4s add, move, group and remove (Roxanne, 26 Nov).
  mayChangeLists: boolean;
  // The transfer manager and admins change the status.
  managesTransfer(transfer: Transfer | undefined): boolean;
  // The player's profile, as the profile page draws it.
  profileOf(invite: Invite): string;
  lookUp(id: string): Promise<LookedUp | null>;
  // The transfer manager is set with the president of the SvS before the transfer; it is
  // changed here only when we won its Preparation and lost its Battle (Roxanne, 26 Nov).
  managerChangeable(date: string): boolean;
  // The president in office for a transfer, as the SvS results tell it: shown on Records
  // where the transfer manager was not recorded (Roxanne, 26 Nov).
  presidentAtTransfer(date: string): FoundPlayer | null;
  redraw(): void;
  reload(): Promise<void>;
}

// ---------------------------------------------------------------------------
// The page's own state, kept while the site is open.

type Popup =
  | { kind: 'add'; id: string; looking: boolean; found: LookedUp | null; missing: boolean; list: InviteList | null; saving: boolean }
  | { kind: 'remove'; inviteId: number }
  | { kind: 'new-group'; how: 'custom' | 'state' | 'contact'; pick: string; ticked: Set<number>; forInvite: number | null }
  | { kind: 'leave'; then: () => void };

const state = {
  shownDate: '',
  views: { special: 'details', ordinary: 'compact', open: 'compact' } as Record<InviteList, 'compact' | 'details'>,
  recordViews: { special: 'compact', ordinary: 'compact', open: 'compact' } as Record<InviteList, 'compact' | 'details'>,
  editing: false,
  // The transfer's own settings (manager, power cap, Ordinary or Leading) have their own
  // Edit on the card, edited in place (Roxanne, 26 Nov).
  cardEditing: false,
  groupDraft: new Map<number, number | null>(),
  groupPickFor: null as number | null,
  statusPickFor: null as number | null,
  tipFor: null as number | null,
  // Which past transfer's note is open on Records.
  recordTipDate: null as string | null,
  // The record whose "received on" note is open.
  receivedTipFor: null as number | null,
  copiedId: '',
  profileFor: null as number | null,
  detailsOpen: false,
  popup: null as Popup | null,
  recordIndex: 0,
  // The past transfer whose transfer manager an admin is changing on Records.
  recordEditDate: null as string | null,
  problem: '',
  // While a row is carried: where it would land.
  drag: null as null | { inviteId: number; list: InviteList; before: number | null }
};

let lookUpTimer = 0;

// Only the phone's or the computer's parts are drawn: an icon's colour comes from the first
// gradient of its name on the page, and one inside a hidden part draws nothing.
export function onComputer(): boolean {
  return window.innerWidth >= 1000;
}

// Editing with changes not saved yet, in the lists or on the card.
export function invitesEditing(): boolean {
  return (state.editing && invitesSaveLit()) || (state.cardEditing && cardSaveLit());
}

// ---------------------------------------------------------------------------
// Words and small pieces

const LIST_TITLES: Record<InviteList, string> = { special: 'SPECIAL INVITES', ordinary: 'ORDINARY INVITES', open: 'OPEN TRANSFER' };
const LIST_COLOURS: Record<InviteList, string> = { special: '#F0D99D', ordinary: '#B0AAF1', open: '#8BB7F4' };
const KIND_WORDS: Record<InviteList, string> = { special: 'Special', ordinary: 'Ordinary', open: 'Open' };

function dateText(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  return `${day} ${MONTH_SHORT[month - 1]} ${year}`;
}

const gradient = (id: string) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color: var(--section)"/>` +
  '<stop offset="1" style="stop-color: var(--text)"/></linearGradient></defs>';
const PIN_ICON = `<svg class="line-icon" viewBox="0 0 24 24" aria-hidden="true">${gradient('pin-cur-colour')}<g fill="none" stroke="url(#pin-cur-colour)"` +
  ' stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21.6c-.6-.5-7-6.3-7-11.6a7 7 0 0 1 14 0c0 5.3-6.4 11.1-7 11.6z"/>' +
  '<circle cx="12" cy="10" r="2.8"/></g></svg>';
const ARROW_LEFT = `<svg class="line-icon" viewBox="0 0 24 24" aria-hidden="true">${gradient('arr-l-colour')}<path d="M14.5 6l-6 6 6 6" fill="none"` +
  ' stroke="url(#arr-l-colour)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ARROW_RIGHT = `<svg class="line-icon" viewBox="0 0 24 24" aria-hidden="true">${gradient('arr-r-colour')}<path d="M9.5 6l6 6-6 6" fill="none"` +
  ' stroke="url(#arr-r-colour)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CANCEL_ICON = lineIcon('cancel-icon-colour', 'M6 6l12 12M18 6L6 18');
const SAVE_ICON = lineIcon('save-icon-colour', 'M4.5 12.5l5 5L19.5 6.5');
// The views' icons in the colour of their list's line, with the chosen view's mark lying on
// that line (Roxanne, 26 Nov: "the icons have to have the colour of the bar"). Each list
// has its own gradient, as a gradient's colour is the first of its name on the page.
function viewIcon(mode: 'compact' | 'details', id: string): string {
  const colour = `<defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="24" y2="24">` +
    '<stop offset="0" style="stop-color: var(--lc)"/><stop offset="1" style="stop-color: color-mix(in srgb, var(--lc) 45%, var(--text))"/></linearGradient></defs>';
  const dot = (y: string) => `<circle cx="${mode === 'compact' ? 5 : 7}" cy="${y}" r="1.6" fill="url(#${id})" stroke="none"/>`;
  const shape = mode === 'compact'
    ? `${dot('6.5')}<path d="M9 6.5 h11"/>${dot('12')}<path d="M9 12 h11"/>${dot('17.5')}<path d="M9 17.5 h11"/>`
    : `<rect x="3.5" y="3.5" width="17" height="7.5" rx="2"/><rect x="3.5" y="13" width="17" height="7.5" rx="2"/>${dot('7.25')}${dot('16.75')}<path d="M10.5 7.25h6.5M10.5 16.75h6.5"/>`;
  return `<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">${colour}` +
    `<g fill="none" stroke="url(#${id})" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${shape}</g></svg>`;
}

function viewIcons(list: InviteList, view: 'compact' | 'details', where: 'invites' | 'records'): string {
  const button = (mode: 'compact' | 'details', icon: string, title: string) =>
    `<button type="button" class="view-icon" aria-pressed="${view === mode}" title="${title}" data-invite-view="${where}|${list}|${mode}">${icon}</button>`;
  return `<div class="view-icons">${button('compact', viewIcon('compact', `view-compact-${where}-${list}`), 'Compact')}` +
    `${button('details', viewIcon('details', `view-details-${where}-${list}`), 'Details')}</div>`;
}

function ring(colour: string, used: number, total: number, left: number): string {
  const radius = 26;
  const length = 2 * Math.PI * radius;
  const share = total ? Math.min(1, used / total) : 0;
  const arc = used === 0 ? '' : `<circle cx="32" cy="32" r="${radius}" fill="none" stroke="${colour}" stroke-width="6" stroke-linecap="round"` +
    ` stroke-dasharray="${(length * share).toFixed(1)} ${length.toFixed(1)}" transform="rotate(-90 32 32)" style="filter: drop-shadow(0 0 4px ${colour}88)"/>`;
  return `<svg class="ring" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="${radius}" fill="none" stroke="rgba(255,255,255,.09)" stroke-width="6"/>${arc}</svg>` +
    `<b class="rn">${left}</b>`;
}

function managerPicture(transfer: Transfer | undefined): string {
  return `<span class="mp">${pictureOf(transfer?.managerAvatar ?? null, transfer?.managerName || '?')}</span>`;
}

// ---------------------------------------------------------------------------
// The transfer shown

interface Shown {
  date: string;
  transfer: Transfer | undefined;
  windowId: number | null;
  phase: TransferPhase;
  isCurrent: boolean;
  cap: number | null;
  places: { special: number; ordinary: number; open: number };
  specialsFrom: string | null;
  lists: Record<InviteList, Invite[]>;
}

function plannedDates(context: InvitesContext): string[] {
  const current = currentTransferDate(context.dates, context.now);
  return current ? context.dates.filter(date => date >= current) : [];
}

function shownTransfer(context: InvitesContext, date: string): Shown {
  const transfer = context.transfers.find(one => one.date === date);
  const windowId = transfer?.id ?? null;
  const places = placesOf(transfer?.stateType ?? 'ordinary');
  const specials = specialsOf(date, context.dates, context.transfers, context.invites);
  const lists = {} as Record<InviteList, Invite[]>;
  for (const list of INVITE_LISTS) lists[list] = windowId === null ? [] : listOf(context.invites, windowId, list);
  return {
    date, transfer, windowId,
    phase: phaseOf(date, context.now),
    isCurrent: date === currentTransferDate(context.dates, context.now),
    cap: capOf(transfer, context.generationOf(date)),
    places: { special: specials.count, ordinary: places.ordinary, open: places.open },
    specialsFrom: specials.restoredOn,
    lists
  };
}

function capText(cap: number | null): string {
  return cap === null ? '' : (cap / 1e9 >= 1 ? (cap / 1e9).toFixed(cap % 1e8 === 0 ? 1 : 2) + 'B' : Math.round(cap / 1e6) + 'M');
}

// The phase named in full and the time left; a later transfer shows its date instead
// (Roxanne, 26 Nov: "Countdown is only for the next/current transfer").
function titleOf(shown: Shown, now: number): { phase: string; value: string } {
  if (!shown.isCurrent) return { phase: 'Upcoming transfer', value: '' };
  const times = timesOf(shown.date);
  if (shown.phase === 'coming') return { phase: 'Invitation transfer in', value: countdownText(times.invitation - now) };
  if (shown.phase === 'invitation') return { phase: 'Invitation transfer', value: countdownText(times.open - now) };
  if (shown.phase === 'open') return { phase: 'Open transfer', value: countdownText(times.end - now) };
  return { phase: 'Transfer', value: 'Over' };
}

// Statuses show once the transfer opens (Roxanne, 26 Nov), Ready or Over cap first.
function statusShown(shown: Shown): boolean {
  return shown.isCurrent && shown.phase !== 'coming';
}

// ---------------------------------------------------------------------------
// The lists

function groupOfInvite(invite: Invite): number | null {
  return state.groupDraft.has(invite.id) ? state.groupDraft.get(invite.id) ?? null : invite.groupNumber;
}

function withDraft(invites: Invite[]): Invite[] {
  return invites.map(invite => state.groupDraft.has(invite.id) ? { ...invite, groupNumber: state.groupDraft.get(invite.id) ?? null } : invite);
}

function groupPick(invite: Invite, all: Invite[], colours: Map<number, string>): string {
  const groups = new Map<number, Invite[]>();
  for (const one of all) {
    const number = groupOfInvite(one);
    if (number === null) continue;
    groups.set(number, [...(groups.get(number) ?? []), one]);
  }
  const faces = (members: Invite[], colour: string) => '<span class="gfaces">' + members.slice(0, 3).map(member =>
    `<i style="--gc: ${colour}">${pictureOf(member.avatar, member.name)}</i>`).join('') + '</span>';
  const rows = [`<button type="button" class="opt gopt" style="--gc: transparent" data-invite-join="${invite.id}|new"><span class="gnew">${ADD_ICON}</span>` +
    '<span class="gname">New group</span></button>'];
  for (const [number, members] of groups) {
    const colour = colours.get(number) ?? 'transparent';
    const names = members.slice(0, 3).map(member => escapeForPage(member.name)).join(', ');
    const more = members.length > 3 ? ` <em>+${members.length - 3}</em>` : '';
    rows.push(`<button type="button" class="opt gopt" style="--gc: ${colour}" data-invite-join="${invite.id}|${number}">${faces(members, colour)}` +
      `<span class="gname">${names}${more}</span></button>`);
  }
  return `<div class="pick gpick">${rows.join('')}</div>`;
}

function listSection(list: InviteList, shown: Shown, context: InvitesContext, all: Invite[], colours: Map<number, string>, dragging: boolean): string {
  const rows = withDraft(shown.lists[list]);
  const total = shown.places[list];
  const view = state.views[list];
  const compact = view === 'compact';
  // The third list shows only once someone is on it, and as a place to drop while a row
  // is carried (Roxanne, 26 Nov).
  if (list === 'open' && rows.length === 0 && !dragging) return '';
  if (list === 'special' && total === 0 && rows.length === 0 && !dragging) return '';
  const manages = context.managesTransfer(shown.transfer);
  const showStatus = statusShown(shown);
  const body = rows.map((invite, index) => {
    const group = invite.groupNumber;
    const previous = rows[index - 1]?.groupNumber ?? null;
    const next = rows[index + 1]?.groupNumber ?? null;
    return inviteRow({
      invite, status: showStatus ? statusOf(invite, shown.cap) : null, cap: shown.cap, alliances: context.alliances,
      groupColour: group !== null ? colours.get(group) ?? null : null,
      groupFirst: group !== previous, groupLast: group !== next,
      copied: state.copiedId === invite.playerId,
      viewing: state.profileFor === invite.id,
      extra: list === 'open' && index >= total,
      compact,
      canMove: context.mayChangeLists && !state.editing,
      canSetStatus: manages && !state.editing,
      editing: state.editing && context.mayChangeLists ? {
        inGroup: group !== null,
        groupPickOpen: state.groupPickFor === invite.id,
        groupPick: state.groupPickFor === invite.id ? groupPick(invite, all, colours) : ''
      } : null,
      statusPickOpen: state.statusPickFor === invite.id,
      tipOpen: state.tipFor === invite.id
    });
  }).join('');
  const empty = rows.length ? '' : dragging ? '<div class="land"></div>' : '<p class="empty">No one yet.</p>';
  const head = compact && rows.length ? COMPACT_HEAD : '';
  return `<section class="il${compact ? ' cmp' : ''}${dragging && list === 'open' && !rows.length ? ' drop' : ''}" style="--lc: ${LIST_COLOURS[list]}" data-invite-list="${list}">` +
    `<h2><span>${LIST_TITLES[list]} · ${rows.length}/${total}</span><span class="hr">${viewIcons(list, view, 'invites')}</span></h2>` +
    head + body + empty + '</section>';
}

// Add and Edit, or Cancel and Save while editing: they belong to the lists (Roxanne, 26 Nov).
function listActions(context: InvitesContext): string {
  if (!context.mayChangeLists) return '';
  if (state.editing) {
    return '<span class="tops edit-actions"><button type="button" class="quiet cancel" data-invites-edit="cancel">' +
      `${CANCEL_ICON}<span class="words">Cancel</span></button><button type="button" class="quiet confirm" data-invites-edit="save"` +
      `${invitesSaveLit() ? '' : ' disabled'}>${SAVE_ICON}<span class="words">Save</span></button></span>`;
  }
  return `<span class="tops"><button type="button" class="edit-button add-player" data-invites-add>${ADD_ICON}<span><span class="words">Add</span></span></button>` +
    `<button type="button" class="edit-button" data-invites-edit="open">${EDIT_ICON}<span><span class="words">Edit</span></span></button></span>`;
}

// ---------------------------------------------------------------------------
// The card with the transfer's numbers

function statusCounts(shown: Shown): [InviteStatus, number][] {
  const counts = new Map<InviteStatus, number>();
  for (const list of INVITE_LISTS) for (const invite of shown.lists[list]) {
    const status = statusOf(invite, shown.cap);
    counts.set(status, (counts.get(status) ?? 0) + 1);
  }
  if (shown.phase === 'over') return (['transferred', 'rejected', 'expired'] as InviteStatus[]).map(one => [one, counts.get(one) ?? 0]);
  return INVITE_STATUSES.map(one => [one, counts.get(one) ?? 0]);
}

function arrivedIn(shown: Shown, list: InviteList): number {
  return shown.lists[list].filter(invite => invite.setStatus === 'transferred').length;
}

// Invites sent: every player on the invite lists the invite went to.
function sentOf(lists: Record<InviteList, Invite[]>): number {
  return [...lists.special, ...lists.ordinary].filter(invite => invite.setStatus !== null).length;
}

// The transfer manager, a part of its own before Available invites, its title in the
// page's gold (Roxanne, 26 Nov: "maybe we want to move it before available invites and
// write transfer manager in that yellow").
function managerPart(shown: Shown, context: InvitesContext): string {
  const transfer = shown.transfer;
  // A later transfer's manager is known only after its SvS (Roxanne, 26 Nov).
  const known = transfer?.managerName;
  const editing = state.cardEditing && context.isAdmin && context.managerChangeable(shown.date);
  // Found by typing the name and picking the player the site finds, the in-game ID as
  // the backup (Roxanne, 26 Nov).
  const value = editing ? '<div class="mgr-line who-m">' + playerSearchField({
      key: MANAGER_SEARCH, label: 'Transfer manager', placeholder: 'Name or ID', picture: true,
      shown: known && transfer?.managerId ? { id: transfer.managerId, name: known, avatar: transfer.managerAvatar ?? null, alliance: transfer.managerAlliance ?? null } : null
    }) + '</div>'
    : known ? `<div class="mgr-line who-m">${managerPicture(transfer)}<b>${escapeForPage(known)}</b>${allianceTagPill(transfer?.managerAlliance ?? '', context.alliances)}</div>`
    : shown.isCurrent && shown.phase !== 'coming' ? '<div class="mgr-line who-m tbd">Not set</div>' : '<div class="mgr-line who-m tbd">After SvS</div>';
  return `<h3>Transfer manager</h3>${value}`;
}

const MANAGER_SEARCH = 'transfer-manager';

const transferDraft: { cap?: string; type?: 'ordinary' | 'leading' } = {};

function groupAndCap(shown: Shown, context: InvitesContext): string {
  const editing = state.cardEditing && context.isAdmin;
  const cap = editing
    ? `<input class="info-field cap-field" id="transfer-cap" data-transfer-field="cap" inputmode="decimal" autocomplete="off" aria-label="Power cap"` +
      ` value="${escapeForPage(transferDraft.cap ?? (shown.transfer?.powerCap ? capText(shown.transfer.powerCap) : ''))}" placeholder="${capText(shown.cap)}">`
    : `<b>${capText(shown.cap)}</b>`;
  // Ordinary or Leading is shown to everyone; editing adds the other word beside it
  // (Roxanne, 26 Nov: "we also need to show the ordinary/leading label").
  const chosen = transferDraft.type ?? shown.transfer?.stateType ?? 'ordinary';
  // "State" with it, so it does not read as the Ordinary invites under it.
  const word = (one: 'ordinary' | 'leading') => one === 'ordinary' ? 'Ordinary state' : 'Leading state';
  const type = editing
    ? '<div class="kind-words state-type" role="group" aria-label="1458 is">' + (['ordinary', 'leading'] as const).map(one =>
        `<button type="button" class="kind-word${chosen === one ? ' selected' : ''}" data-transfer-type="${one}">${word(one)}</button>`).join('') + '</div>'
    : `<div class="kind-words state-type shown"><span class="kind-word selected">${word(chosen)}</span></div>`;
  return `<div class="gcp"><div><i>Group</i><b>${escapeForPage(context.groupOf(shown.date) ?? '')}</b></div><div><i>Power cap</i>${cap}</div></div>${type}`;
}

// The card's own Edit, in its top corner for admins; Cancel and Save take its place.
const CARD_CANCEL_ICON = lineIcon('card-cancel-colour', 'M6 6l12 12M18 6L6 18');
const CARD_SAVE_ICON = lineIcon('card-save-colour', 'M4.5 12.5l5 5L19.5 6.5');
function cardActions(context: InvitesContext): string {
  if (!context.isAdmin) return '';
  if (state.cardEditing) {
    return '<span class="tops card-acts edit-actions"><button type="button" class="quiet cancel" aria-label="Cancel" data-transfer-edit="cancel">' +
      `${CARD_CANCEL_ICON}</button><button type="button" class="quiet confirm" aria-label="Save" data-transfer-edit="save"` +
      `${cardSaveLit() ? '' : ' disabled'}>${CARD_SAVE_ICON}</button></span>`;
  }
  return `<span class="tops card-acts"><button type="button" class="edit-button" data-transfer-edit="open">${EDIT_ICON}<span><span class="words">Edit</span></span></button></span>`;
}

// A special invite restored during the transfer itself: a star beside its count, and on a
// tap or under the pointer, when it is generated: the day of the week and the transfer's
// phase that day (Roxanne, 26 Nov).
const SPECIAL_TIP = -1;
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PHASE_NAMES: Record<TransferPhase, string> = { coming: 'Pre-transfer', invitation: 'Invitation transfer', open: 'Open transfer', over: 'transfer' };

function ordinal(number: number): string {
  const ends = number % 100 >= 11 && number % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][number % 10] ?? 'th';
  return number + ends;
}

function specialStar(shown: Shown): string {
  const day = shown.specialsFrom as string;
  const at = Date.parse(day + 'T00:00:00Z');
  const text = `The ${ordinal(shown.places.special)} special invite is only generated on ${WEEKDAYS[new Date(at).getUTCDay()]} ` +
    `${dateText(day)}, during the ${PHASE_NAMES[phaseOf(shown.date, at)]}.`;
  return `<span class="star-tip" role="button" tabindex="0" aria-label="${escapeForPage(text)}" data-invite-tip="${SPECIAL_TIP}">` +
    STAR + `<span class="tip${state.tipFor === SPECIAL_TIP ? ' shown' : ''}">${escapeForPage(text)}</span></span>`;
}

function statsCard(shown: Shown, context: InvitesContext, title: { phase: string; value: string }): string {
  const over = shown.phase === 'over' && shown.isCurrent;
  const counts = statusCounts(shown);
  const bar = counts.filter(([, count]) => count).map(([status, count]) => `<i class="s-${status}" style="flex: ${count}"></i>`).join('');
  const cells = counts.map(([status, count]) => `<div class="sc s-${status}"><span class="stc s-${status}">${statusIcon(status)}` +
    `<span class="words">${STATUS_WORDS[status]}</span></span><b>${count}</b></div>`).join('');
  const place = (list: InviteList, label: string, used: number, left: number, mark = '') =>
    `<div class="pc" style="--lc: ${LIST_COLOURS[list]}"><i>${label}</i><div class="rw">${ring(LIST_COLOURS[list], used, shown.places[list], left)}</div>` +
    `<em>of ${shown.places[list]}${mark}</em></div>`;
  const specialNote = shown.specialsFrom ? specialStar(shown) : '';
  const places = over
    ? '<h3>Arrived</h3><div class="pl">' + INVITE_LISTS.map(list =>
        place(list, KIND_WORDS[list], arrivedIn(shown, list), arrivedIn(shown, list))).join('') + '</div>' +
      `<div class="never"><b>${sentOf(shown.lists)}</b><span>invites sent</span></div>`
    : '<h3>Available invites</h3><div class="pl">' + INVITE_LISTS.map(list => {
        const used = Math.min(shown.lists[list].length, shown.places[list]);
        return place(list, KIND_WORDS[list], used, Math.max(0, shown.places[list] - shown.lists[list].length), list === 'special' ? specialNote : '');
      }).join('') + '</div>';
  const statusPart = statusShown(shown) ? `<h3>Status</h3><div class="sbar">${bar}</div><div class="sg">${cells}</div>` : '';
  return `<section class="glass tstat gold${state.cardEditing ? ' card-editing' : ''}">${cardActions(context)}<div class="cd">` +
    `<div class="cd-ph">${escapeForPage(title.phase)}</div><div class="cd-v">${escapeForPage(title.value)}</div>` +
    groupAndCap(shown, context) + '</div>' + managerPart(shown, context) + places + statusPart + '</section>';
}

// ---------------------------------------------------------------------------
// The pop-ups

function addPopup(popup: Extract<Popup, { kind: 'add' }>, shown: Shown): string {
  const found = popup.found;
  const all = INVITE_LISTS.flatMap(list => shown.lists[list]);
  const listed = all.find(invite => invite.playerId === popup.id);
  let answer = '';
  if (found) {
    answer = `<div class="found"><div class="pic">${pictureOf(found.avatar, found.name)}</div><div class="who"><div class="name">${escapeForPage(found.name)}</div>` +
      `<div class="power"><b>${shortNumber(found.power ?? null)}</b>${found.state ? `<span class="pst">#${found.state}</span>` : ''}</div></div></div>`;
  } else if (popup.looking) answer = '<p class="add-answer">Looking for this ID in the game.</p>';
  else if (popup.missing) answer = '<p class="add-answer problem">The game has no player with this ID.</p>';
  let note = '';
  if (found && listed) note = `<p class="add-answer problem">Already in ${LIST_TITLES[listed.list].charAt(0)}${LIST_TITLES[listed.list].slice(1).toLowerCase()}.</p>`;
  const full = (list: InviteList) => list !== 'open' && shown.lists[list].length >= shown.places[list];
  const chosen = popup.list ?? (full('ordinary') ? 'open' : 'ordinary');
  // Special / Ordinary / Open as kind-words, a full list greyed (Roxanne, 26 Nov).
  const kinds = found && !listed ? '<div class="kind-words" role="group" aria-label="List">' + INVITE_LISTS.map(list =>
    `<button type="button" class="kind-word${chosen === list ? ' selected' : ''}" data-invite-add-list="${list}"${full(list) ? ' disabled' : ''}>${KIND_WORDS[list]}</button>`).join('') + '</div>' : '';
  const canSave = !!found && !listed && !full(chosen) && !popup.saving;
  return '<div class="leave-prompt" data-invite-popup-close><div class="leave-prompt-box glass add-invite" role="dialog" aria-modal="true">' +
    '<div class="pp adding"><section class="add"><h2>Add player</h2>' +
    `<div class="add-id"><input class="info-field id-entry" id="invite-add-id" data-invite-add-id inputmode="numeric" autocomplete="off" placeholder="In-game ID"` +
    ` aria-label="In-game ID" value="${escapeForPage(popup.id)}"></div>` + answer + note + kinds +
    '<div class="saverow"><button type="button" class="ghost-button" data-invite-popup-close>Cancel</button>' +
    `<button type="button" class="primary-button save" data-invite-add-save${canSave ? '' : ' disabled'}>Save</button></div>` +
    (state.problem ? `<p class="add-answer problem">${escapeForPage(state.problem)}</p>` : '') +
    '</section></div></div></div>';
}

function removePopup(invite: Invite): string {
  return '<div class="leave-prompt" data-invite-popup-close><div class="leave-prompt-box glass add-invite" role="dialog" aria-modal="true">' +
    '<div class="pp adding"><section class="add"><h2>Remove player</h2>' +
    `<div class="found"><div class="pic">${pictureOf(invite.avatar, invite.name)}</div><div class="who"><div class="name">${escapeForPage(invite.name || invite.playerId)}</div>` +
    `<div class="id"><span class="idg">${escapeForPage(invite.playerId)}</span></div>` +
    `<div class="power"><b>${shortNumber(invite.power)}</b>${invite.state ? `<span class="pst">#${invite.state}</span>` : ''}</div></div></div>` +
    '<div class="saverow"><button type="button" class="ghost-button" data-invite-popup-close>Cancel</button>' +
    `<button type="button" class="danger-button" data-invite-remove-yes="${invite.id}">Remove</button></div></section></div></div></div>`;
}

// A new group (Roxanne, 26 Nov): "select everyone, or select the people with a common
// state... or based on the contact... make it a real pop-up". Custom is picking the
// players one by one.
function newGroupPopup(popup: Extract<Popup, { kind: 'new-group' }>, all: Invite[]): string {
  const hows: [typeof popup.how, string][] = [['custom', 'Custom'], ['state', 'State'], ['contact', 'Contact']];
  const how = '<div class="kind-words ng-how">' + hows.map(([value, word]) =>
    `<button type="button" class="kind-word${popup.how === value ? ' selected' : ''}" data-new-group-how="${value}">${word}</button>`).join('') + '</div>';
  let body = '';
  if (popup.how === 'custom') {
    body = '<div class="ng-list">' + all.map(invite => `<button type="button" class="ng-pick${popup.ticked.has(invite.id) ? ' on' : ''}" data-new-group-tick="${invite.id}">` +
      `<i>${pictureOf(invite.avatar, invite.name)}</i><span>${escapeForPage(invite.name || invite.playerId)}</span><b></b></button>`).join('') + '</div>';
  } else {
    const keyOf = (invite: Invite) => popup.how === 'state' ? (invite.state ? '#' + invite.state : '') : (invite.contactName || invite.contactTag);
    const options = Array.from(new Set(all.map(keyOf).filter(Boolean)));
    const picked = options.includes(popup.pick) ? popup.pick : options[0] ?? '';
    body = '<div class="ng-opts">' + options.map(option =>
      `<button type="button" class="ng-opt${option === picked ? ' on' : ''}" data-new-group-pick="${escapeForPage(option)}">${escapeForPage(option)}</button>`).join('') + '</div>' +
      (options.length ? '<div class="ng-who">' + all.filter(invite => keyOf(invite) === picked).map(invite =>
        `<div class="ng-p"><i>${pictureOf(invite.avatar, invite.name)}</i><span>${escapeForPage(invite.name || invite.playerId)}</span></div>`).join('') + '</div>'
        : '<p class="add-answer">No one on the lists has one yet.</p>');
  }
  return '<div class="leave-prompt" data-invite-popup-close><div class="leave-prompt-box glass add-invite ng" role="dialog" aria-modal="true">' +
    `<div class="pp adding"><section class="add"><h2>New group</h2>${how}${body}` +
    '<div class="saverow"><button type="button" class="ghost-button" data-invite-popup-close>Cancel</button>' +
    '<button type="button" class="primary-button save" data-new-group-create>Create</button></div></section></div></div></div>';
}

function leavePopup(): string {
  return '<div class="leave-prompt"><div class="leave-prompt-box glass" role="dialog" aria-modal="true">' +
    '<p class="leave-prompt-text">Save your changes before you leave?</p><div class="leave-prompt-actions">' +
    '<button type="button" class="ghost-button" data-invite-leave="cancel">Cancel</button>' +
    '<button type="button" class="primary-button" data-invite-leave="save">Save</button></div></div></div>';
}

function popupMarkup(shown: Shown): string {
  const popup = state.popup;
  if (!popup) return '';
  const all = withDraft(INVITE_LISTS.flatMap(list => shown.lists[list]));
  if (popup.kind === 'add') return addPopup(popup, shown);
  if (popup.kind === 'remove') {
    const invite = all.find(one => one.id === popup.inviteId);
    return invite ? removePopup(invite) : '';
  }
  if (popup.kind === 'new-group') return newGroupPopup(popup, all);
  return leavePopup();
}

// ---------------------------------------------------------------------------
// The Invites page

const PIN_BUTTON = (attributes: string) => `<button type="button" class="quiet-button pin-cur" aria-label="Current transfer" title="Back to the current transfer" ${attributes}>${PIN_ICON}</button>`;

function profileCard(invite: Invite, context: InvitesContext, colour: string | null): string {
  const tint = colour ?? 'var(--section)';
  return `<section class="glass prof-card" style="--pc: ${escapeForPage(tint)}">${context.profileOf(invite)}</section>`;
}

export function invitesPage(context: InvitesContext): string {
  const planned = plannedDates(context);
  if (!planned.length) return '<div class="work-page inv"><p class="empty">No transfer is known yet.</p></div>';
  if (!planned.includes(state.shownDate)) state.shownDate = planned[0];
  const shown = shownTransfer(context, state.shownDate);
  const all = INVITE_LISTS.flatMap(list => shown.lists[list]);
  const colours = groupColours(withDraft(all));
  const title = titleOf(shown, context.now);
  const index = planned.indexOf(shown.date);
  const dragging = state.drag !== null;

  const lists = INVITE_LISTS.map(list => listSection(list, shown, context, withDraft(all), colours, dragging)).join('');
  // Phone title: the phase in small capitals, then the countdown for the current
  // transfer or the date for a later one; the pin back to the current one after the date.
  const phoneTitle = '<div class="pbar"><div class="ptitle">' +
    `<span class="cd-k">${escapeForPage(title.phase)}</span><b>${shown.isCurrent ? escapeForPage(title.value) : escapeForPage(dateText(shown.date))}` +
    `${shown.isCurrent ? '' : PIN_BUTTON('data-invites-current')}</b></div>` +
    `<span class="ph-ctl">${listActions(context)}<button type="button" class="edit-button details-btn" aria-label="Details" data-invites-details>` +
    `${DETAILS_ICON}<span><span class="words">Details</span></span></button></span></div>`;
  // Computer: the date above the lists with the pin and the arrows; Add and Edit on its line.
  const listHead = '<div class="lhead"><div class="tdate">' +
    `<span>${escapeForPage(dateText(shown.date))}</span><span class="tarrs">${shown.isCurrent ? '' : PIN_BUTTON('data-invites-current')}` +
    `<button type="button" class="tarr${index === 0 ? ' dim' : ''}" data-invites-step="-1" aria-label="Transfer before">${ARROW_LEFT}</button>` +
    `<button type="button" class="tarr${index === planned.length - 1 ? ' dim' : ''}" data-invites-step="1" aria-label="Transfer after">${ARROW_RIGHT}</button>` +
    `</span></div>${listActions(context)}</div>`;
  const profiled = state.profileFor !== null ? all.find(invite => invite.id === state.profileFor) : undefined;
  if (state.profileFor !== null && !profiled) state.profileFor = null;
  const profileColour = profiled ? colours.get(groupOfInvite(profiled) ?? -1) ?? null : null;
  const computer = onComputer();
  const side = !computer ? '' : profiled
    ? '<aside class="stats prof"><button type="button" class="quiet neutral prof-close" data-invites-profile-close>' +
      `${lineIcon('close-icon-colour', 'M6 6l12 12M18 6L6 18')}<span class="words">Close</span></button>${profileCard(profiled, context, profileColour)}</aside>`
    : `<aside class="stats">${statsCard(shown, context, title)}</aside>`;
  // Phone: Details and a profile open from the bottom.
  const sheet = computer ? '' : state.detailsOpen
    ? `<div class="leave-prompt sheet-wrap" data-invites-sheet-close><div class="sheet"><aside class="stats">${statsCard(shown, context, title)}</aside></div></div>`
    : profiled ? `<div class="leave-prompt sheet-wrap" data-invites-profile-close><div class="sheet profile-sheet">${profileCard(profiled, context, profileColour)}</div></div>` : '';
  const problem = state.problem && !state.popup ? `<p class="inv-problem">${escapeForPage(state.problem)}</p>` : '';
  return `<div class="work-page inv inset${state.editing ? ' editing' : ''}${dragging ? ' dragging' : ''}" data-invites-page>` +
    `<div class="two"><div class="lists">${computer ? listHead : phoneTitle}${problem}${lists}</div>${side}</div>` +
    sheet + popupMarkup(shown) + '</div>';
}

// ---------------------------------------------------------------------------
// Records

function recordHead(shown: Shown, context: InvitesContext, pin: boolean): string {
  const counts = (['transferred', 'rejected', 'expired'] as InviteStatus[]).map(status => {
    const count = INVITE_LISTS.reduce((sum, list) => sum + shown.lists[list].filter(invite => invite.setStatus === status).length, 0);
    return `<span class="rs s-${status}" title="${STATUS_WORDS[status]}">${statusIcon(status)}<b>${count}</b></span>`;
  }).join('');
  const arrived = INVITE_LISTS.map(list => `<span class="ra" style="--lc: ${LIST_COLOURS[list]}"><b>${arrivedIn(shown, list)}</b>/${shown.places[list]}</span>`).join('');
  const group = context.groupOf(shown.date);
  const transfer = shown.transfer;
  // Not recorded: the president of that time, with a star and its note (Roxanne, 26 Nov).
  const president = transfer?.managerName ? null : context.presidentAtTransfer(shown.date);
  const editing = context.isAdmin && state.recordEditDate === shown.date;
  let manager: string;
  if (editing) {
    const shownPlayer = transfer?.managerName ? { id: transfer.managerId ?? '', name: transfer.managerName, avatar: transfer.managerAvatar ?? null, alliance: transfer.managerAlliance ?? null } : president;
    manager = '<span class="rmg editing">' + playerSearchField({ key: RECORD_MANAGER_SEARCH, label: 'Transfer manager', placeholder: 'Name or ID', picture: true, shown: shownPlayer }) + '</span>';
  } else if (transfer?.managerName) {
    manager = `<span class="rmg">${managerPicture(transfer)}<b>${escapeForPage(transfer.managerName)}</b>${allianceTagPill(transfer.managerAlliance, context.alliances)}</span>`;
  } else if (president) {
    const note = 'The transfer manager was not recorded, so the president at the time is shown instead.';
    // The star right after the name, as a footnote mark, so it is never pushed out.
    manager = `<span class="rmg"><span class="mp">${pictureOf(president.avatar, president.name)}</span><b>${escapeForPage(president.name)}</b>` +
      `<span class="star-tip" role="button" tabindex="0" aria-label="${escapeForPage(note)}" data-invite-tip="${RECORD_TIP}">${STAR}` +
      `<span class="tip${state.tipFor === RECORD_TIP && state.recordTipDate === shown.date ? ' shown' : ''}" data-record-tip-date="${shown.date}">${escapeForPage(note)}</span></span>` +
      `${president.alliance ? allianceTagPill(president.alliance, context.alliances) : ''}</span>`;
  } else manager = '<span class="rmg"></span>';
  return '<div class="rhead">' +
    `<div class="rl1"><b class="rd">${escapeForPage(dateText(shown.date))}</b>${pin ? PIN_BUTTON('data-records-recent') : ''}${recordActions(shown.date, context)}` +
    `<span class="rgc">${escapeForPage([group, capText(shown.cap)].filter(Boolean).join(' · '))}</span><span class="rst">${counts}</span></div>` +
    `<div class="rl2">${manager}<span class="rar">${arrived}<span class="rsent"><b>${sentOf(shown.lists)}</b> sent</span></span></div>` +
    (editing && state.problem ? `<p class="inv-problem">${escapeForPage(state.problem)}</p>` : '') + '</div>';
}

const RECORD_MANAGER_SEARCH = 'record-manager';
const RECORD_TIP = -2;

// Admins change a past transfer's manager on Records, in place (Roxanne, 26 Nov: "this should
// be editable for admins"): Edit, then Cancel and Save in its place.
function recordActions(date: string, context: InvitesContext): string {
  if (!context.isAdmin) return '';
  if (state.recordEditDate === date) {
    return '<span class="tops redit edit-actions"><button type="button" class="quiet cancel" aria-label="Cancel" data-record-edit="cancel">' +
      `${lineIcon('record-cancel-colour', 'M6 6l12 12M18 6L6 18')}</button><button type="button" class="quiet confirm" aria-label="Save" data-record-edit="save|${date}">` +
      `${lineIcon('record-save-colour', 'M4.5 12.5l5 5L19.5 6.5')}</button></span>`;
  }
  return `<span class="tops redit"><button type="button" class="edit-button" data-record-edit="open|${date}">${EDIT_ICON}<span><span class="words">Edit</span></span></button></span>`;
}

async function saveRecordManager(date: string): Promise<void> {
  const chosen = playerSearchChoice(RECORD_MANAGER_SEARCH);
  const typed = playerSearchTyped(RECORD_MANAGER_SEARCH)?.trim() ?? '';
  if (chosen === null && typed) throw new Error('Pick the transfer manager from the players found.');
  if (chosen === null) await changeTransfer(date, { manager_id: null, manager_name: null, manager_avatar: null, manager_alliance: null });
  else if (chosen) await changeTransfer(date, { manager_id: chosen.id ? Number(chosen.id) : null, manager_name: chosen.name, manager_avatar: chosen.avatar, manager_alliance: chosen.alliance });
  forgetPlayerSearch(RECORD_MANAGER_SEARCH);
  state.recordEditDate = null;
}

function recordLists(shown: Shown, context: InvitesContext): string {
  return INVITE_LISTS.map(list => {
    // Who came, as they were then, list by list.
    const rows = shown.lists[list].filter(invite => invite.setStatus === 'transferred');
    if (!rows.length) return '';
    const colours = groupColours(INVITE_LISTS.flatMap(one => shown.lists[one]));
    const compact = state.recordViews[list] === 'compact';
    const body = rows.map((invite, index) => {
      const group = invite.groupNumber;
      return inviteRow({
        invite, status: null, cap: shown.cap, alliances: context.alliances,
        groupColour: group !== null ? colours.get(group) ?? null : null,
        groupFirst: group !== (rows[index - 1]?.groupNumber ?? null), groupLast: group !== (rows[index + 1]?.groupNumber ?? null),
        copied: state.copiedId === invite.playerId, viewing: false, extra: false, compact,
        canMove: false, canSetStatus: false, editing: null, statusPickOpen: false, tipOpen: false,
        received: invite.gameReadAt && Date.parse(invite.gameReadAt) > timesOf(shown.date).end
          ? { date: dateText(invite.gameReadAt.slice(0, 10)), open: state.receivedTipFor === invite.id } : null
      });
    }).join('');
    return `<section class="il${compact ? ' cmp' : ''}" style="--lc: ${LIST_COLOURS[list]}"><h2><span>${LIST_TITLES[list]} · ${rows.length}/${shown.places[list]}</span>` +
      `<span class="hr">${viewIcons(list, state.recordViews[list], 'records')}</span></h2>${body}</section>`;
  }).join('');
}

function pastDates(context: InvitesContext): string[] {
  // A transfer goes to Records on the Monday after it ends; only those with lists kept.
  return context.transfers.filter(transfer => timesOf(transfer.date).swap <= context.now).map(transfer => transfer.date).sort().reverse();
}

export function recordsPage(context: InvitesContext): string {
  const past = pastDates(context);
  if (!past.length) return '<div class="work-page inv inset records"><p class="empty">No transfer has been recorded yet.</p></div>';
  state.recordIndex = Math.max(0, Math.min(state.recordIndex, past.length - 1));
  const block = (date: string, pin: boolean) => {
    const shown = shownTransfer(context, date);
    return `<div class="rcol">${recordHead(shown, context, pin)}${recordLists(shown, context)}</div>`;
  };
  // Phone: one at a time, swiping; the pin after the date when away from the newest.
  if (!onComputer()) {
    return `<div class="work-page inv inset records" data-records-page><div class="rcols">${block(past[state.recordIndex], state.recordIndex > 0)}</div>` +
      `${state.profileFor !== null ? recordProfile(context) : ''}</div>`;
  }
  // Computer: two side by side, scrolling down to older pairs; the pin on the left one of
  // every pair but the first: those are only seen away from the newest.
  let pairs = '';
  for (let index = 0; index < past.length; index += 2) {
    pairs += block(past[index], index > 0) + (past[index + 1] ? block(past[index + 1], false) : '<div class="rcol"></div>');
  }
  const sheet = state.profileFor !== null ? recordProfile(context) : '';
  return `<div class="work-page inv inset records" data-records-page><div class="rscroll"><div class="rcols">${pairs}</div></div>${sheet}</div>`;
}

// A former transfer opens the player's current profile (Roxanne, 26 Nov).
function recordProfile(context: InvitesContext): string {
  const invite = context.invites.find(one => one.id === state.profileFor);
  if (!invite) { state.profileFor = null; return ''; }
  return `<div class="leave-prompt sheet-wrap record-profile" data-invites-profile-close><div class="sheet profile-sheet">${profileCard(invite, context, null)}</div></div>`;
}

// ---------------------------------------------------------------------------
// Moving between transfers

export function stepTransfer(context: InvitesContext, direction: number, page: 'invites' | 'records'): boolean {
  if (page === 'records') {
    const past = pastDates(context);
    const next = state.recordIndex + direction;
    if (next < 0 || next >= past.length) return false;
    state.recordIndex = next;
    state.profileFor = null;
    return true;
  }
  const planned = plannedDates(context);
  const next = planned.indexOf(state.shownDate) + direction;
  if (next < 0 || next >= planned.length) return false;
  if (invitesEditing()) {
    state.popup = { kind: 'leave', then: () => { state.shownDate = planned[next]; } };
    return true;
  }
  leaveEditing();
  state.shownDate = planned[next];
  state.profileFor = null;
  return true;
}

function leaveEditing(): void {
  state.editing = false;
  state.groupDraft.clear();
  state.groupPickFor = null;
  leaveCardEditing();
}

function leaveCardEditing(): void {
  state.cardEditing = false;
  for (const key of Object.keys(transferDraft) as (keyof typeof transferDraft)[]) delete transferDraft[key];
  forgetPlayerSearch(MANAGER_SEARCH);
}

// Called before the site moves to another page: asks first when editing has changes.
export function invitesMayLeave(then: () => void): boolean {
  if (!invitesEditing()) { leaveEditing(); return true; }
  state.popup = { kind: 'leave', then };
  return false;
}

// ---------------------------------------------------------------------------
// Clicks

function shownNow(context: InvitesContext): Shown {
  const planned = plannedDates(context);
  return shownTransfer(context, planned.includes(state.shownDate) ? state.shownDate : planned[0] ?? '');
}

async function run(context: InvitesContext, work: () => Promise<void>): Promise<void> {
  state.problem = '';
  try {
    await work();
    await context.reload();
  } catch (error) {
    state.problem = error instanceof Error ? error.message : String(error);
  }
  context.redraw();
}

// The lists' groups: a group of one is no group.
async function saveGroups(shown: Shown): Promise<void> {
  const all = withDraft(INVITE_LISTS.flatMap(list => shown.lists[list]));
  const sizes = new Map<number, number>();
  for (const invite of all) if (invite.groupNumber !== null) sizes.set(invite.groupNumber, (sizes.get(invite.groupNumber) ?? 0) + 1);
  const changes: Promise<void>[] = [];
  for (const invite of all) {
    const original = shown.lists[invite.list].find(one => one.id === invite.id);
    const group = invite.groupNumber !== null && (sizes.get(invite.groupNumber) ?? 0) > 1 ? invite.groupNumber : null;
    if (original && original.groupNumber !== group) changes.push(changeInvite(invite.id, { group_number: group }));
  }
  await Promise.all(changes);
  state.editing = false;
  state.groupDraft.clear();
  state.groupPickFor = null;
}

// The transfer's own settings, from the card.
async function saveTransferSettings(shown: Shown): Promise<void> {
  const manager = playerSearchChoice(MANAGER_SEARCH);
  const managerTyped = playerSearchTyped(MANAGER_SEARCH)?.trim() ?? '';
  if (manager === null && managerTyped) throw new Error('Pick the transfer manager from the players found.');
  const fields: Record<string, unknown> = {};
  if (transferDraft.type) fields.state_type = transferDraft.type;
  if (transferDraft.cap !== undefined) {
    const typed = transferDraft.cap.trim().toUpperCase();
    const number = parseFloat(typed);
    fields.power_cap = !typed || Number.isNaN(number) ? null : typed.endsWith('B') ? number * 1e9 : typed.endsWith('M') ? number * 1e6 : number;
  }
  if (manager === null) Object.assign(fields, { manager_id: null, manager_name: null, manager_avatar: null, manager_alliance: null });
  else if (manager) Object.assign(fields, { manager_id: Number(manager.id), manager_name: manager.name, manager_avatar: manager.avatar, manager_alliance: manager.alliance });
  if (Object.keys(fields).length) await changeTransfer(shown.date, fields);
  leaveCardEditing();
}

// Saving before leaving the page: whatever is being edited.
async function saveEditing(shown: Shown): Promise<void> {
  if (state.cardEditing) await saveTransferSettings(shown);
  if (state.editing) await saveGroups(shown);
  leaveEditing();
}

function nextGroupNumber(all: Invite[]): number {
  return all.reduce((top, invite) => Math.max(top, groupOfInvite(invite) ?? 0), 0) + 1;
}

export function handleInvitesClick(target: HTMLElement, context: InvitesContext, page: 'invites' | 'records'): boolean {
  const shown = shownNow(context);
  const all = INVITE_LISTS.flatMap(list => shown.lists[list]);
  const attribute = (name: string) => target.closest<HTMLElement>(`[${name}]`)?.getAttribute(name) ?? null;

  // The ID copied: the player's identity, the last one keeping the Copied look.
  const copy = attribute('data-copy-id');
  if (copy !== null) {
    void navigator.clipboard?.writeText(copy).catch(() => undefined);
    state.copiedId = copy;
    context.redraw();
    return true;
  }
  const view = attribute('data-invite-view');
  if (view) {
    const [where, list, mode] = view.split('|') as ['invites' | 'records', InviteList, 'compact' | 'details'];
    (where === 'records' ? state.recordViews : state.views)[list] = mode;
    context.redraw();
    return true;
  }
  const profile = attribute('data-invite-profile');
  if (profile !== null) {
    state.profileFor = state.profileFor === Number(profile) ? null : Number(profile);
    state.detailsOpen = false;
    context.redraw();
    return true;
  }
  if (target.closest('[data-invites-profile-close]') && (target.closest('.prof-close') || !target.closest('.sheet'))) {
    state.profileFor = null;
    context.redraw();
    return true;
  }
  if (page === 'records') {
    const recordEdit = attribute('data-record-edit');
    if (recordEdit) {
      const [action, date] = recordEdit.split('|');
      forgetPlayerSearch(RECORD_MANAGER_SEARCH);
      if (action === 'open') { state.recordEditDate = date; state.problem = ''; context.redraw(); }
      else if (action === 'cancel') { state.recordEditDate = null; context.redraw(); }
      else if (action === 'save') void run(context, () => saveRecordManager(date));
      return true;
    }
    const recordTip = target.closest<HTMLElement>(`[data-invite-tip="${RECORD_TIP}"]`);
    if (recordTip) {
      const date = recordTip.querySelector<HTMLElement>('[data-record-tip-date]')?.dataset.recordTipDate ?? null;
      const open = state.tipFor === RECORD_TIP && state.recordTipDate === date;
      state.tipFor = open ? null : RECORD_TIP;
      state.recordTipDate = open ? null : date;
      context.redraw();
      return true;
    }
    const received = attribute('data-record-received');
    if (received !== null) {
      state.receivedTipFor = state.receivedTipFor === Number(received) ? null : Number(received);
      context.redraw();
      return true;
    }
    if (state.tipFor !== null || state.receivedTipFor !== null) { state.tipFor = null; state.receivedTipFor = null; context.redraw(); }
    if (target.closest('[data-records-recent]')) {
      state.recordIndex = 0;
      document.querySelector('.rscroll')?.scrollTo({ top: 0, behavior: 'smooth' });
      context.redraw();
      return true;
    }
    return false;
  }

  // Pop-ups first: a tap outside the box closes it.
  if (state.popup) return handlePopupClick(target, context, shown, all);

  if (target.closest('[data-invites-details]')) { state.detailsOpen = true; state.profileFor = null; context.redraw(); return true; }
  if (target.closest('[data-invites-sheet-close]') && !target.closest('.sheet')) { state.detailsOpen = false; context.redraw(); return true; }
  if (target.closest('[data-invites-current]')) {
    if (invitesEditing()) { state.popup = { kind: 'leave', then: () => { state.shownDate = ''; } }; context.redraw(); return true; }
    leaveEditing();
    state.shownDate = '';
    state.profileFor = null;
    context.redraw();
    return true;
  }
  const step = attribute('data-invites-step');
  if (step) { if (stepTransfer(context, Number(step), 'invites')) context.redraw(); return true; }

  if (target.closest('[data-invites-add]')) {
    state.popup = { kind: 'add', id: '', looking: false, found: null, missing: false, list: null, saving: false };
    state.problem = '';
    context.redraw();
    window.setTimeout(() => document.querySelector<HTMLInputElement>('[data-invite-add-id]')?.focus(), 0);
    return true;
  }
  const edit = attribute('data-invites-edit');
  if (edit === 'open') { state.editing = true; state.statusPickFor = null; context.redraw(); return true; }
  if (edit === 'cancel') { state.editing = false; state.groupDraft.clear(); state.groupPickFor = null; context.redraw(); return true; }
  if (edit === 'save') { void run(context, () => saveGroups(shown)); return true; }
  const cardEdit = attribute('data-transfer-edit');
  if (cardEdit === 'open') { state.cardEditing = true; context.redraw(); return true; }
  if (cardEdit === 'cancel') { leaveCardEditing(); context.redraw(); return true; }
  if (cardEdit === 'save') { void run(context, () => saveTransferSettings(shown)); return true; }
  const type = attribute('data-transfer-type');
  if (type) { transferDraft.type = type as 'ordinary' | 'leading'; context.redraw(); return true; }

  const remove = attribute('data-invite-remove');
  if (remove) { state.popup = { kind: 'remove', inviteId: Number(remove) }; context.redraw(); return true; }
  const group = attribute('data-invite-group');
  if (group) {
    const invite = all.find(one => one.id === Number(group));
    if (invite && groupOfInvite(invite) !== null) { state.groupDraft.set(invite.id, null); state.groupPickFor = null; }
    else state.groupPickFor = state.groupPickFor === Number(group) ? null : Number(group);
    context.redraw();
    return true;
  }
  const join = attribute('data-invite-join');
  if (join) {
    const [id, to] = join.split('|');
    state.groupPickFor = null;
    if (to === 'new') state.popup = { kind: 'new-group', how: 'custom', pick: '', ticked: new Set([Number(id)]), forInvite: Number(id) };
    else state.groupDraft.set(Number(id), Number(to));
    context.redraw();
    return true;
  }

  const statusOpen = attribute('data-invite-status-open');
  if (statusOpen) { state.statusPickFor = state.statusPickFor === Number(statusOpen) ? null : Number(statusOpen); context.redraw(); return true; }
  const status = attribute('data-invite-status');
  if (status) {
    const [id, value] = status.split('|');
    state.statusPickFor = null;
    // Ready and Over cap follow the power and the cap; picking either clears a set status.
    const setTo = value === 'ready' || value === 'over' ? null : value;
    void run(context, () => changeInvite(Number(id), { status: setTo }));
    return true;
  }
  const tip = attribute('data-invite-tip');
  if (tip) { state.tipFor = state.tipFor === Number(tip) ? null : Number(tip); context.redraw(); return true; }

  // A tap elsewhere closes what was open.
  if (state.statusPickFor !== null || state.groupPickFor !== null || state.tipFor !== null) {
    state.statusPickFor = null; state.groupPickFor = null; state.tipFor = null;
    context.redraw();
    return !!target.closest('[data-invites-page]');
  }
  return false;
}

function handlePopupClick(target: HTMLElement, context: InvitesContext, shown: Shown, all: Invite[]): boolean {
  const popup = state.popup!;
  const inBox = target.closest('.leave-prompt-box');
  const attribute = (name: string) => target.closest<HTMLElement>(`[${name}]`)?.getAttribute(name) ?? null;
  if (popup.kind === 'leave') {
    const answer = attribute('data-invite-leave');
    if (answer === 'cancel') { leaveEditing(); state.popup = null; popup.then(); context.redraw(); }
    if (answer === 'save') {
      state.popup = null;
      void run(context, async () => { await saveEditing(shown); popup.then(); });
    }
    return true;
  }
  if ((target.closest('[data-invite-popup-close]') && !inBox) || target.closest('button[data-invite-popup-close]')) {
    state.popup = null; state.problem = ''; context.redraw(); return true;
  }
  if (popup.kind === 'add') {
    const list = attribute('data-invite-add-list');
    if (list) { popup.list = list as InviteList; context.redraw(); return true; }
    if (target.closest('[data-invite-add-save]') && popup.found) {
      const chosen = popup.list ?? (shown.lists.ordinary.length >= shown.places.ordinary ? 'open' : 'ordinary');
      const last = shown.lists[chosen][shown.lists[chosen].length - 1];
      popup.saving = true;
      context.redraw();
      void run(context, async () => {
        await addInvite(shown.date, popup.id, chosen, (last?.position ?? 0) + 1);
        state.popup = null;
      }).then(() => { if (state.popup?.kind === 'add') state.popup.saving = false; });
    }
    return true;
  }
  if (popup.kind === 'remove') {
    const yes = attribute('data-invite-remove-yes');
    if (yes) { state.popup = null; void run(context, () => removeInvite(Number(yes))); }
    return true;
  }
  if (popup.kind === 'new-group') {
    const how = attribute('data-new-group-how');
    if (how) { popup.how = how as typeof popup.how; popup.pick = ''; context.redraw(); return true; }
    const pick = attribute('data-new-group-pick');
    if (pick !== null) { popup.pick = pick; context.redraw(); return true; }
    const tick = attribute('data-new-group-tick');
    if (tick) {
      const id = Number(tick);
      if (popup.ticked.has(id)) popup.ticked.delete(id); else popup.ticked.add(id);
      context.redraw();
      return true;
    }
    if (target.closest('[data-new-group-create]')) {
      const drafted = withDraft(all);
      let members: number[];
      if (popup.how === 'custom') members = Array.from(popup.ticked);
      else {
        const keyOf = (invite: Invite) => popup.how === 'state' ? (invite.state ? '#' + invite.state : '') : (invite.contactName || invite.contactTag);
        const options = Array.from(new Set(drafted.map(keyOf).filter(Boolean)));
        const picked = options.includes(popup.pick) ? popup.pick : options[0] ?? '';
        members = drafted.filter(invite => picked && keyOf(invite) === picked).map(invite => invite.id);
      }
      if (members.length > 1) {
        const number = nextGroupNumber(drafted);
        for (const id of members) state.groupDraft.set(id, number);
      }
      state.popup = null;
      context.redraw();
    }
    return true;
  }
  return true;
}

// Typing the ID in Add: looked up once it is a whole ID.
export function handleInvitesInput(target: HTMLElement, context: InvitesContext): boolean {
  if (target instanceof HTMLInputElement && target.matches('[data-invite-add-id]') && state.popup?.kind === 'add') {
    const popup = state.popup;
    const id = filterId(target.value);
    if (target.value !== id) target.value = id;
    if (id === popup.id) return true;
    popup.id = id; popup.found = null; popup.missing = false; popup.looking = false; popup.list = null;
    window.clearTimeout(lookUpTimer);
    if (/^\d{8,10}$/.test(id)) {
      popup.looking = true;
      lookUpTimer = window.setTimeout(() => {
        void context.lookUp(id).then(found => {
          if (state.popup?.kind !== 'add' || state.popup.id !== id) return;
          state.popup.looking = false; state.popup.found = found; state.popup.missing = !found;
        }).catch(() => {
          if (state.popup?.kind === 'add' && state.popup.id === id) { state.popup.looking = false; state.popup.missing = true; }
        }).then(() => { context.redraw(); keepTyping(); });
      }, 350);
    }
    context.redraw();
    keepTyping();
    return true;
  }
  // The card's Save lights once the transfer manager is typed (player-search.ts lists the
  // players found).
  if (target instanceof HTMLInputElement && target.matches('.tstat [data-player-search-input]')) {
    const save = document.querySelector<HTMLButtonElement>('[data-transfer-edit="save"]');
    if (save) save.disabled = false;
    return true;
  }
  if (target instanceof HTMLInputElement && target.dataset.transferField) {
    transferDraft.cap = target.value;
    const save = document.querySelector<HTMLButtonElement>('[data-transfer-edit="save"]');
    if (save) save.disabled = false;
    return true;
  }
  return false;
}

// The field keeps its focus and caret after the page is drawn again.
function keepTyping(): void {
  const field = document.querySelector<HTMLInputElement>('[data-invite-add-id]');
  if (!field) return;
  field.focus();
  const end = field.value.length;
  field.setSelectionRange(end, end);
}

// The lists' Save is lit once a group changed; the card's once one of its settings did.
export function invitesSaveLit(): boolean {
  return state.groupDraft.size > 0;
}

function cardSaveLit(): boolean {
  return Object.keys(transferDraft).length > 0 || playerSearchChoice(MANAGER_SEARCH) !== undefined;
}

// ---------------------------------------------------------------------------
// Moving players: the three lines before the row on a computer, a long tap on a phone;
// the row lifts and follows, a line shows where it lands, and Open Transfer is there to
// drop on even when empty (Roxanne, 26 Nov). Moving one player moves only that player.

const LONG_PRESS = 450;
let pressTimer = 0;
let carried: { inviteId: number; row: HTMLElement; ghost: HTMLElement; startY: number; pointerId: number } | null = null;

export function startInviteDrag(event: PointerEvent, context: InvitesContext): void {
  if (!context.mayChangeLists || state.editing || state.popup) return;
  const target = event.target as HTMLElement;
  const grip = target.closest<HTMLElement>('[data-invite-grip]');
  const row = target.closest<HTMLElement>('[data-invite-row]');
  if (!row || target.closest('button:not(.grp), .stw, .copy-p')) { if (!grip) return; }
  const begin = () => {
    if (!row) return;
    const id = Number(row.dataset.inviteRow);
    const invite = context.invites.find(one => one.id === id);
    if (!invite) return;
    state.drag = { inviteId: id, list: invite.list, before: null };
    context.redraw();
    const fresh = document.querySelector<HTMLElement>(`[data-invite-row="${id}"]`);
    if (!fresh) return;
    const box = fresh.getBoundingClientRect();
    // The lifted copy sits in an empty copy of its list, so it keeps the list's look.
    const section = fresh.closest<HTMLElement>('.il');
    const shell = (section?.cloneNode(false) ?? document.createElement('section')) as HTMLElement;
    shell.removeAttribute('data-invite-list');
    shell.style.cssText += `;position: fixed; left: ${box.left}px; top: ${box.top}px; width: ${box.width}px; margin: 0; z-index: 60; pointer-events: none;`;
    const copy = fresh.cloneNode(true) as HTMLElement;
    copy.classList.add('lifted');
    copy.removeAttribute('data-invite-row');
    shell.appendChild(copy);
    (fresh.closest('.two') ?? fresh.closest('.inv'))?.appendChild(shell);
    const ghost = shell;
    fresh.classList.add('carried');
    carried = { inviteId: id, row: fresh, ghost, startY: event.clientY - box.top, pointerId: event.pointerId };
  };
  if (grip && event.pointerType !== 'touch') { event.preventDefault(); begin(); return; }
  if (event.pointerType === 'touch' && row) {
    const startX = event.clientX, startY = event.clientY;
    window.clearTimeout(pressTimer);
    pressTimer = window.setTimeout(() => { navigator.vibrate?.(15); begin(); }, LONG_PRESS);
    const cancel = (move: PointerEvent) => {
      if (Math.hypot(move.clientX - startX, move.clientY - startY) > 8 && !carried) { window.clearTimeout(pressTimer); window.removeEventListener('pointermove', cancel); }
    };
    window.addEventListener('pointermove', cancel);
    window.addEventListener('pointerup', () => { window.clearTimeout(pressTimer); window.removeEventListener('pointermove', cancel); }, { once: true });
  }
}

export function moveInviteDrag(event: PointerEvent): void {
  if (!carried || !state.drag) return;
  event.preventDefault();
  carried.ghost.style.top = (event.clientY - carried.startY) + 'px';
  // Where it lands: the list under the finger and the row it goes before.
  const under = document.elementsFromPoint(event.clientX, event.clientY);
  const section = under.map(one => (one as HTMLElement).closest?.('[data-invite-list]')).find(Boolean) as HTMLElement | undefined;
  for (const line of Array.from(document.querySelectorAll('.inv .land-line'))) line.remove();
  if (!section) return;
  const list = section.dataset.inviteList as InviteList;
  const rows = Array.from(section.querySelectorAll<HTMLElement>('[data-invite-row]')).filter(row => !row.classList.contains('carried'));
  const before = rows.find(row => { const box = row.getBoundingClientRect(); return event.clientY < box.top + box.height / 2; });
  state.drag.list = list;
  state.drag.before = before ? Number(before.dataset.inviteRow) : null;
  const line = document.createElement('div');
  line.className = 'land land-line';
  if (before) before.before(line); else section.appendChild(line);
}

// While a row is carried the page does not scroll under the finger, and the swipe that
// changes transfers does not count the carrying.
let dragEndedAt = 0;
export function inviteDragActive(): boolean {
  return carried !== null || Date.now() - dragEndedAt < 400;
}

export function endInviteDrag(context: InvitesContext): void {
  window.clearTimeout(pressTimer);
  if (!carried || !state.drag) return;
  dragEndedAt = Date.now();
  const drag = state.drag;
  const id = carried.inviteId;
  carried.ghost.remove();
  carried = null;
  state.drag = null;
  const shown = shownNow(context);
  const invite = context.invites.find(one => one.id === id);
  const target = shown.lists[drag.list].filter(one => one.id !== id);
  // A full list takes no one more; the open list takes more than its 20.
  const full = drag.list !== 'open' && invite?.list !== drag.list && target.length >= shown.places[drag.list];
  if (!invite || full) { context.redraw(); return; }
  const index = drag.before === null ? target.length : target.findIndex(one => one.id === drag.before);
  const before = target[index - 1]?.position;
  const after = target[index]?.position;
  const position = before === undefined && after === undefined ? 1 : before === undefined ? after! - 1 : after === undefined ? before + 1 : (before + after) / 2;
  if (invite.list === drag.list && invite.position === position) { context.redraw(); return; }
  // Shown at once where it was dropped, then saved.
  invite.list = drag.list;
  invite.position = position;
  context.redraw();
  void run(context, () => changeInvite(id, { list: drag.list, position }));
}

// After drawing: the lists' box fades at the bottom; Records fades at the top too once
// scrolled, and its pins show only then.
export function afterInvitesDrawn(app: HTMLElement): void {
  // A list opened under a row near the bottom of the lists' box opens above it instead.
  const box = app.querySelector<HTMLElement>('.inv .lists');
  for (const pick of Array.from(app.querySelectorAll<HTMLElement>('.inv .pick'))) {
    const bottom = box && getComputedStyle(box).overflowY !== 'visible' ? box.getBoundingClientRect().bottom : window.innerHeight;
    if (pick.getBoundingClientRect().bottom > bottom - 8) pick.classList.add('up');
  }
  const scroller = app.querySelector<HTMLElement>('.rscroll');
  if (scroller) {
    const mark = () => scroller.classList.toggle('more-above', scroller.scrollTop > 4);
    mark();
    scroller.addEventListener('scroll', mark, { passive: true });
  }
}

// How many things are open over the page (a pop-up, Details, a profile), each one step
// of the phone's back (Roxanne, 26 Nov).
export function invitesOverlayCount(): number {
  return (state.popup && state.popup.kind !== 'leave' ? 1 : 0) + (state.detailsOpen ? 1 : 0) + (state.profileFor !== null ? 1 : 0);
}

// Closes the one on top; true when something was open.
export function closeInvitesOverlays(): boolean {
  if (state.popup && state.popup.kind !== 'leave') { state.popup = null; return true; }
  if (state.detailsOpen) { state.detailsOpen = false; return true; }
  if (state.profileFor !== null) { state.profileFor = null; return true; }
  return false;
}

export function inviteProfileId(): number | null {
  return state.profileFor;
}
