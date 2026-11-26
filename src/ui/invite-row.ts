// The player row (Roxanne, 26 Nov): one template every list of players uses, the Invites
// page and Records alike, "just like we built our profile page, but more concise". Two
// looks of the same element: Compact, one line (picture, name and ID, FC, the numbers,
// power and status, contact), and Details, the card (the troops with their FC and skill
// level, Kills, Labyrinth and Transfer).
import { escapeForPage } from './escape.ts';
import { imageUrl } from './event-icon.ts';
import { pictureOf, type TroopKind } from './player-profile.ts';
import type { Alliance } from '../data/alliances.ts';
import type { Invite, InviteStatus } from '../data/transfer-invites.ts';

// ---------------------------------------------------------------------------
// Icons, in the site's style: one stroke from a colour into white.

const gradient = (id: string, from: string, to = 'var(--text)') =>
  `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color: ${from}"/>` +
  `<stop offset="1" style="stop-color: ${to}"/></linearGradient></defs>`;

export function lineIcon(id: string, path: string): string {
  return `<svg class="line-icon" viewBox="0 0 24 24" aria-hidden="true">${gradient(id, 'var(--quiet-tint)')}` +
    `<path d="${path}" fill="none" stroke="url(#${id})" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

export const ADD_ICON = '<svg class="edit-icon" viewBox="0 0 24 24" aria-hidden="true">' + gradient('add-icon-colour', 'var(--edit-colour)') +
  '<path d="M12 4.5v15M4.5 12h15" fill="none" stroke="url(#add-icon-colour)" stroke-width="2.2" stroke-linecap="round"/></svg>';
export const DETAILS_ICON = '<svg class="edit-icon" viewBox="0 0 24 24" aria-hidden="true">' + gradient('details-icon-colour', 'var(--edit-colour)') +
  '<g fill="none" stroke="url(#details-icon-colour)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
  '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5V12h8.5"/></g></svg>';
const OPEN_ICON = '<svg class="edit-icon" viewBox="0 0 24 24" aria-hidden="true">' + gradient('row-open-colour', 'var(--section)') +
  '<g fill="none" stroke="url(#row-open-colour)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
  '<path d="M10 3.5H7A3.5 3.5 0 0 0 3.5 7v10A3.5 3.5 0 0 0 7 20.5h10a3.5 3.5 0 0 0 3.5-3.5v-3"/><path d="M14.5 3.5h6v6"/><path d="M20.5 3.5L11.5 12.5"/></g></svg>';
const LINK_ICON = '<svg class="lk" viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2.4"' +
  ' stroke-linecap="round" stroke-linejoin="round"><path d="M10 13.5a4.5 4.5 0 0 0 6.4.4l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2"/>' +
  '<path d="M14 10.5a4.5 4.5 0 0 0-6.4-.4l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2"/></g></svg>';
const COPY_ICON = '<svg class="cp" viewBox="0 0 24 24" aria-hidden="true">' + gradient('copy-colour', 'var(--section)') +
  '<g fill="none" stroke="url(#copy-colour)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
  '<rect x="8.5" y="8.5" width="12" height="12" rx="2.5"/><path d="M15.5 8.5V6A2.5 2.5 0 0 0 13 3.5H6A2.5 2.5 0 0 0 3.5 6v7A2.5 2.5 0 0 0 6 15.5h2.5"/></g></svg>';
// The last player copied keeps this look until another is copied (Roxanne, 26 Nov).
const COPIED_ICON = '<svg class="cp" viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 8.5V6A2.5 2.5 0 0 0 13 3.5H6A2.5 2.5 0 0 0 3.5 6v7A2.5 2.5 0 0 0 6 15.5h2.5"' +
  ' fill="none" stroke="var(--section)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><rect x="7.5" y="7.5" width="14" height="14" rx="3" fill="var(--section)"/>' +
  '<path d="M11 14.6l2.4 2.4 4.4-4.8" fill="none" stroke="#0B1222" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
export const GRIP_ICON = '<svg class="grip" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8h12M6 12h12M6 16h12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
export const TICK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
export const GROUP_PATH = 'M8.5 5.3a3.2 3.2 0 1 0 0 6.4a3.2 3.2 0 0 0 0-6.4zM16 6.9a2.6 2.6 0 1 0 0 5.2a2.6 2.6 0 0 0 0-5.2zM3 19c0-3.2 2.5-5.5 5.5-5.5S14 15.8 14 19M14.5 14.2c.5-.2 1-.3 1.5-.3 2.6 0 4.5 2 4.5 4.6';
export const BIN_PATH = 'M4 7h16M9.5 7V4.5h5V7M6.5 7l1 12.5h9l1-12.5M10.2 11v5M13.8 11v5';

// The statuses: an icon and a word in the status's colour, drawn like the Edit and Add
// buttons (Roxanne, 26 Nov: no box, no arrows).
export const STATUS_WORDS: Record<InviteStatus, string> = {
  ready: 'Ready', over: 'Over cap', sent: 'Sent', transferred: 'Transferred', rejected: 'Rejected', expired: 'Expired'
};
const STATUS_PATHS: Record<InviteStatus, string> = {
  ready: 'M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 0 0 0-17zM8 12.3l2.8 2.8L16.2 9.6',
  over: 'M12 19.5V7M6.5 12.5L12 7l5.5 5.5M5 4h14',
  sent: 'M20.5 3.5L10 14M20.5 3.5l-6.5 17-4-6.5-6.5-4z',
  transferred: 'M14 4h3.5A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5H14M4 12h11M11 8l4 4-4 4',
  rejected: 'M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 0 0 0-17zM9 9l6 6M15 9l-6 6',
  expired: 'M7 3.5h10M7 20.5h10M8 3.5c0 4 8 5 8 8.5s-8 4.5-8 8.5M16 3.5c0 4-8 5-8 8.5s8 4.5 8 8.5'
};

// One gradient per status, defined once for the page (an icon's colour is set by the
// first gradient of its name on the page).
export function statusIcon(status: InviteStatus): string {
  return `<svg class="sti" viewBox="0 0 24 24" aria-hidden="true">${gradient('st-' + status, 'var(--sc)', 'color-mix(in srgb, var(--sc) 35%, var(--text))')}` +
    `<path d="${STATUS_PATHS[status]}" fill="none" stroke="url(#st-${status})" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

// ---------------------------------------------------------------------------
// Numbers as the game shortens them: 2.85B, 457.8M, 4.48M. A power within a hair of the
// cap keeps a third decimal, so 1.001B never reads as the cap itself.
export function shortNumber(value: number | null, cap: number | null = null): string {
  if (value === null) return '';
  if (value >= 1e9) {
    const close = cap !== null && Math.round(value / 1e7) === Math.round(cap / 1e7) && value !== cap;
    return (value / 1e9).toFixed(close ? 3 : 2).replace(/\.?0+$/, '') + 'B';
  }
  if (value >= 1e6) return (value / 1e6).toFixed(value < 1e7 ? 2 : 1).replace(/\.?0+$/, '') + 'M';
  if (value >= 1e3) return (value / 1e3).toFixed(1).replace(/\.?0+$/, '') + 'K';
  return String(Math.round(value));
}

// The furnace's Fire Crystal level: furnace 35 is FC1, 80 is FC10; none below FC1.
export function fcOf(furnace: number | null): number | null {
  if (furnace === null || furnace < 35) return null;
  return Math.min(10, Math.floor((furnace - 30) / 5));
}

const TROOP_ORDER: [TroopKind, string][] = [['infantry', 'Infantry'], ['lancer', 'Lancer'], ['marksmen', 'Marksmen']];

function troopFile(kind: TroopKind, tier: number): string {
  return 'troops/' + kind + '-' + (tier >= 12 ? 'exalted' : tier === 11 ? 'helios' : 't' + Math.max(1, Math.min(10, tier)));
}

// An alliance's tag in its own colour (its accent, an academy lighter); another state's
// alliance in the quiet text colour.
export function allianceTagPill(tag: string, alliances: Alliance[]): string {
  if (!tag) return '';
  const alliance = alliances.find(one => one.tag === tag && !one.leftOn);
  const main = alliance?.mainAllianceId ? alliances.find(one => one.id === alliance.mainAllianceId) : undefined;
  const own = (main ?? alliance)?.accentColor ?? (main ?? alliance)?.baseColor ?? '';
  const colour = !own ? 'var(--text-muted)' : main ? `color-mix(in srgb, ${own} 62%, white)` : own;
  return `<span class="tag" style="--c: ${escapeForPage(colour)}">${escapeForPage(tag)}</span>`;
}

// ---------------------------------------------------------------------------
// The row

export interface RowOptions {
  invite: Invite;
  status: InviteStatus | null;
  cap: number | null;
  alliances: Alliance[];
  // The group's colour, and whether this row starts or ends the group's run in its list.
  groupColour: string | null;
  groupFirst: boolean;
  groupLast: boolean;
  copied: boolean;
  viewing: boolean;
  // Past the open list's 20 places: a little dimmed (Roxanne, 26 Nov).
  extra: boolean;
  // Who may do what on this row.
  compact: boolean;
  canMove: boolean;
  canSetStatus: boolean;
  editing: { inGroup: boolean; groupPickOpen: boolean; groupPick: string } | null;
  // The status list opened under the status.
  statusPickOpen: boolean;
  tipOpen: boolean;
  // Records: a row whose game copy was read after its transfer, with the date it was read
  // (Roxanne, 26 Nov: "a tiny star which tells us that the records were received at the x
  // date, not the date of transfer"), and whether its note is open.
  received?: { date: string; open: boolean } | null;
}

// The site's small star; its note shows on a tap or under the pointer.
export const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 16.6l-5.6 3.2 1.3-6.2L3 9.3l6.3-.7z"/></svg>';

function contactOf(invite: Invite, alliances: Alliance[]): string {
  const name = invite.contactName ? `<span class="via">${escapeForPage(invite.contactName)}</span>` : '';
  return name + allianceTagPill(invite.contactTag, alliances);
}

function transferredWhen(invite: Invite): string {
  if (!invite.transferredAt) return '';
  const date = new Date(invite.transferredAt);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}, ` +
    `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')} UTC`;
}

function statusMarkup(options: RowOptions): string {
  const { invite, status } = options;
  if (options.editing) {
    // An admin takes a player out of their group (Roxanne, 26 Nov: "we are removing them from
    // the group"): Ungroup, in the group's own colour; Group in the page's colour ("add to
    // group can be smaller, just say Group").
    // Each row's icon has its own gradient, so it takes its own row's colour.
    const groupWords = options.editing.inGroup ? 'Ungroup' : 'Group';
    const groupButton = `<button type="button" class="quiet ${options.editing.inGroup ? 'ungroup' : 'group-act'}${options.editing.groupPickOpen ? ' open' : ''}"` +
      ` data-invite-group="${invite.id}">${lineIcon('grp-colour-' + invite.id, GROUP_PATH)}<span class="words">${groupWords}</span></button>`;
    return `<span class="stw eacts">${groupButton}<button type="button" class="quiet cancel remove" data-invite-remove="${invite.id}">` +
      `${lineIcon('bin-colour-' + invite.id, BIN_PATH)}<span class="words">Remove</span></button>${options.editing.groupPick}</span>`;
  }
  if (!status) return '';
  const pick = options.statusPickOpen ? '<div class="pick" role="menu">' + (Object.keys(STATUS_WORDS) as InviteStatus[]).map(one =>
    `<button type="button" class="opt s-${one}${one === status ? ' on' : ''}" role="menuitemradio" aria-checked="${one === status}"` +
    ` data-invite-status="${invite.id}|${one}"><span class="ow">${statusIcon(one)}<span>${STATUS_WORDS[one]}</span></span>${one === status ? TICK : ''}</button>`).join('') + '</div>' : '';
  const when = status === 'transferred' ? transferredWhen(invite) : '';
  const tip = when ? `<span class="tip tip-left${options.tipOpen ? ' shown' : ''}"><b>Transferred</b>${escapeForPage(when)}</span>` : '';
  const tappable = options.canSetStatus || when;
  const attribute = options.canSetStatus ? `data-invite-status-open="${invite.id}"` : when ? `data-invite-tip="${invite.id}"` : '';
  return `<span class="stw"><${tappable ? 'button type="button"' : 'span'} class="stc s-${status}${pick ? ' open' : ''}${options.canSetStatus ? ' settable' : ''}" ${attribute}>` +
    `${statusIcon(status)}<span class="words">${STATUS_WORDS[status]}</span></${tappable ? 'button' : 'span'}>${pick}${tip}</span>`;
}

function receivedStar(options: RowOptions): string {
  if (!options.received) return '';
  const note = `This record was received on ${options.received.date}, not on the date of the transfer.`;
  return `<span class="star-tip" role="button" tabindex="0" aria-label="${escapeForPage(note)}" data-record-received="${options.invite.id}">${STAR}` +
    `<span class="tip${options.received.open ? ' shown' : ''}">${escapeForPage(note)}</span></span>`;
}

export function inviteRow(options: RowOptions): string {
  const { invite } = options;
  const fc = fcOf(invite.furnace);
  const fcPicture = fc ? `<img src="${imageUrl('troops/fc' + fc)}" alt="FC${fc}">` : '';
  const classes = ['ic'];
  if (options.groupColour) classes.push('grouped');
  if (options.groupColour && options.groupFirst) classes.push('g-first');
  if (options.groupColour && options.groupLast) classes.push('g-last');
  if (options.viewing) classes.push('viewing');
  if (options.extra) classes.push('extra-row');
  const style = options.groupColour ? ` style="--gc: ${escapeForPage(options.groupColour)}"` : '';
  const troops = TROOP_ORDER.map(([kind, word]) => {
    const troop = invite.troops[kind];
    if (!troop) return `<span class="tp empty" title="${word}"></span>`;
    const level = troop.tier >= 12 ? invite.skills[kind] : null;
    const badge = level !== null && level !== undefined ? `<span class="sk l${level}"><b>${level}</b></span>` : '';
    return `<span class="tp" title="${word}"><img class="p" src="${imageUrl(troopFile(kind, troop.tier))}" alt="">` +
      (troop.fc ? `<img class="f" src="${imageUrl('troops/fc' + troop.fc)}" alt="FC${troop.fc}">` : '') + badge + '</span>';
  }).join('');
  const copy = `<button type="button" class="copy-p${options.copied ? ' copied' : ''}" data-copy-id="${escapeForPage(invite.playerId)}"` +
    ` aria-label="${options.copied ? 'Copied' : "Copy the player's ID"}" title="Copy the ID">${options.copied ? COPIED_ICON : COPY_ICON}</button>`;
  const power = shortNumber(invite.power, options.cap);
  const status = statusMarkup(options);
  const name = invite.name || invite.playerId;
  return `<div class="${classes.join(' ')}" data-invite-row="${invite.id}"${style}>` +
    (options.canMove ? `<i class="grp" data-invite-grip="${invite.id}" title="Drag to move">${GRIP_ICON}</i>` : '') +
    `<button type="button" class="av" data-invite-profile="${invite.id}" aria-label="${escapeForPage(name)}">${pictureOf(invite.avatar, name)}<i class="pf">${OPEN_ICON}</i></button>` +
    '<div class="who">' +
      `<div class="nm"><b>${escapeForPage(name)}</b>${receivedStar(options)}${invite.onSite ? `<i class="on-site-name" title="On the site">${LINK_ICON}</i>` : ''}</div>` +
      `<div class="id idnew"><span class="idg">${escapeForPage(invite.playerId)}</span>${copy}</div>` +
      `<div class="pw">${power}${invite.state ? `<span class="pst">#${invite.state}</span>` : ''}</div>` +
    '</div>' +
    `<div class="cfc">${fcPicture}</div>` +
    `<div class="cn k">${shortNumber(invite.kills)}</div>` +
    `<div class="cn l">${invite.labyrinth !== null ? invite.labyrinth.toLocaleString('en-US') : ''}</div>` +
    `<div class="cn t">${shortNumber(invite.migrantScore)}</div>` +
    `<div class="cstc">${invite.state ?? ''}</div>` +
    `<div class="cpw">${options.editing ? '' : `<span class="pwn">${power}</span>`}${options.compact ? status : ''}</div>` +
    `<div class="side">${options.compact ? '' : status}<div class="con">${contactOf(invite, options.alliances)}</div></div>` +
    `<div class="line2"><div class="troops">${troops}</div><div class="vals">` +
      `<div><i>Kills</i><b>${shortNumber(invite.kills)}</b></div>` +
      `<div><i>Labyrinth</i><b>${invite.labyrinth !== null ? invite.labyrinth.toLocaleString('en-US') : ''}</b></div>` +
      `<div><i>Score</i><b>${shortNumber(invite.migrantScore)}</b></div>` +
    '</div></div></div>';
}

// The column names over a Compact list on the computer.
export const COMPACT_HEAD = '<div class="chd"><span></span><span></span><span>FC</span><span>Kills</span><span>Labyrinth</span>' +
  '<span>Score</span><span>State</span><span>Power</span><span></span></div>';
