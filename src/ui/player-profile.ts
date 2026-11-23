// The player's own page: each account as the game shows its chief (picture, name, id,
// alliance, power) with the two things the game does not give, typed here: foundry
// power, and on Exalted troops the skill level. Accounts are added by their in-game id.
// The game's data is read by the database (supabase/game-refresh.sql); a refresh can be
// asked once the last read is an hour old.
// The typing rules are the old forms' own: the same id check, foundry power in full.
import './player-profile.css';
import { escapeForPage } from './escape.ts';
import { imageUrl } from './event-icon.ts';
import { PENCIL_ICON } from './edit-forms.ts';
import type { Alliance } from '../data/alliances.ts';
import { EXALTED_FC } from '../data/fc-levels.ts';
import type { Row } from '../data/records.ts';
import { GEAR } from './shell.ts';

export type TroopKind = 'infantry' | 'lancer' | 'marksmen';
export const TROOP_KINDS: [TroopKind, string][] = [['infantry', 'Infantry'], ['lancer', 'Lancer'], ['marksmen', 'Marksmen']];

export type Generation = '' | 'Helios' | 'Exalted';

export interface TroopTier {
  fc: number | null;
  generation: Generation;
  skill: number;
}

// "FC10 Exalted" and a skill level, as kept on the account, back into their parts.
export function readTier(tier: unknown, skill: unknown): TroopTier {
  const match = /^FC(\d+)(?: (Helios|Exalted))?$/.exec(String(tier ?? '').trim());
  if (!match) return { fc: null, generation: '', skill: 0 };
  const generation = (match[2] ?? '') as Generation;
  return { fc: Number(match[1]), generation, skill: generation === 'Exalted' ? Number(skill) || 0 : 0 };
}

// The parts back into what the account keeps, or null when no FC level is picked.
export function tierText(tier: TroopTier): string | null {
  if (tier.fc === null) return null;
  return 'FC' + tier.fc + (tier.generation ? ' ' + tier.generation : '');
}

// One pick on a troop type. Picking the Helios or Exalted that is already on takes it
// off again. The skill level is None (0) or a level from 1 to 3.
export function changeTier(tier: TroopTier, part: string, value: string): TroopTier {
  const next = { ...tier };
  if (part === 'fc') {
    next.fc = Number(value);
    if (next.fc !== EXALTED_FC && next.generation === 'Exalted') next.generation = '';
  } else if (part === 'generation') {
    if (next.fc === null) return tier;
    if (value === 'Exalted' && next.fc !== EXALTED_FC) return tier;
    next.generation = next.generation === value ? '' : value as Generation;
  } else if (part === 'skill') {
    if (next.generation !== 'Exalted') return tier;
    next.skill = Number(value) || 0;
  }
  if (next.generation !== 'Exalted') next.skill = 0;
  return next;
}

// ---------------------------------------------------------------------------
// Typed values
// ---------------------------------------------------------------------------

export type PowerUnit = 'M' | 'B';

// Power is kept as the whole number. It is typed in millions (1 to 999) or in
// billions (1 to 99.999, up to three decimals).
const POWER_RANGE: Record<PowerUnit, { min: number; max: number; digits: number; decimals: number; size: number }> = {
  M: { min: 1, max: 999, digits: 3, decimals: 0, size: 1e6 },
  B: { min: 1, max: 99.999, digits: 2, decimals: 3, size: 1e9 }
};

export function powerUnitFor(value: unknown): PowerUnit {
  return Number(value) >= 1e9 ? 'B' : 'M';
}

export function powerShown(value: unknown, unit: PowerUnit): string {
  const number = Number(value);
  if (!value || Number.isNaN(number)) return '';
  const range = POWER_RANGE[unit];
  return String(Math.round(number / range.size * 10 ** range.decimals) / 10 ** range.decimals);
}

// What may be typed: digits, and in billions one separator with up to three decimals.
export function filterPower(raw: string, unit: PowerUnit): string {
  const range = POWER_RANGE[unit];
  const kept = raw.replace(/[^0-9.,]/g, '');
  const decimals = range.decimals > 0 ? `([.,][0-9]{0,${range.decimals}})?` : '';
  const match = new RegExp(`^([0-9]{0,${range.digits}})${decimals}`).exec(kept);
  return match ? match[1] + (match[2] ?? '') : '';
}

export function powerFromText(text: string, unit: PowerUnit): number | null {
  const number = parseFloat(text.replace(',', '.'));
  return Number.isNaN(number) ? null : Math.round(number * POWER_RANGE[unit].size);
}

// Power must sit between 1M and 99.999B.
export function powerProblem(text: string, unit: PowerUnit): string {
  const range = POWER_RANGE[unit];
  const number = parseFloat(text.replace(',', '.'));
  if (Number.isNaN(number) || number < range.min || number > range.max) {
    return `Between ${range.min.toFixed(range.decimals)} and ${range.max.toFixed(range.decimals)}.`;
  }
  return '';
}

// Foundry power is a much smaller number (around 15,000), typed and shown in full.
export function filterFoundryPower(raw: string): string {
  return raw.replace(/[^0-9]/g, '').slice(0, 9);
}

// Plain ASCII punctuation is blocked, so names written with other symbols still work.
export function filterName(raw: string): string {
  return raw.replace(/[\x21-\x2f\x3a-\x40\x5b-\x60\x7b-\x7e]/g, '').slice(0, 16);
}

export function nameProblem(name: string): string {
  return name.trim().length < 3 ? 'Name must be 3-16 characters.' : '';
}

// 9 digits when the id starts with 1 or 2, 8 when it starts with 7, 8 or 9.
export function filterId(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, '');
  return digits.slice(0, /^[789]/.test(digits) ? 8 : 9);
}

export function idProblem(id: string): string {
  const valid = (id.length === 9 && /^[12]/.test(id)) || (id.length === 8 && /^[789]/.test(id));
  return valid ? '' : 'Please enter a valid ID.';
}

// ---------------------------------------------------------------------------
// What the game says
// ---------------------------------------------------------------------------

// One troop type as the game has it: its tier (10, Helios 11, Exalted 12, or lower on a
// young account) and its FC level (0 before the first one).
export interface GameTroop { tier: number; fc: number }

// An account as the game shows it, read by the database from the Whiteout Stats API.
export interface GameRead {
  name: string;
  avatar: string | null;
  power: number | null;
  state: number | null;
  allianceTag: string | null;
  troops: Partial<Record<TroopKind, GameTroop>>;
  // When the database last read it, and whether a fresh read is on its way.
  readAt: string | null;
  asked: boolean;
}

// The game's troop types are infantry, lancer and marksman; the site's are the camps.
const GAME_TROOP_KINDS: Record<string, TroopKind> = { infantry: 'infantry', lancer: 'lancer', marksman: 'marksmen', marksmen: 'marksmen' };

export function gameReadOf(row: Row | null | undefined): GameRead | null {
  const data = row?.data as Record<string, any> | undefined;
  const player = data?.player as Record<string, any> | undefined;
  if (!row || !player?.nick_name) return null;
  const troops: Partial<Record<TroopKind, GameTroop>> = {};
  for (const troop of Array.isArray(data?.troops) ? data.troops : []) {
    const kind = GAME_TROOP_KINDS[String(troop?.type)];
    if (kind && Number(troop.tier) > 0) troops[kind] = { tier: Number(troop.tier), fc: Number(troop.fire_crystal_level) || 0 };
  }
  return {
    name: String(player.nick_name),
    avatar: player.avatar_url ? String(player.avatar_url) : null,
    power: player.power ? Number(player.power) : null,
    state: player.kid ? Number(player.kid) : row.state_number ? Number(row.state_number) : null,
    allianceTag: player.alliance?.abbr ? String(player.alliance.abbr) : null,
    troops,
    readAt: row.read_at ? String(row.read_at) : null,
    asked: Boolean(row.refresh_asked_at)
  };
}

// The site's alliance for a game tag: one of ours only in our own state, matched as the
// game writes it (DVL and dvl are two alliances).
function siteAllianceOf(game: GameRead | null, alliances: Alliance[], homeState: number): Alliance | undefined {
  if (!game?.allianceTag || game.state !== homeState) return undefined;
  return alliances.find(one => one.tag === game.allianceTag);
}

// How long ago the game was last read, the way the game itself words it.
export function readAgo(readAt: string | null, now: number): string {
  if (!readAt) return '';
  const minutes = Math.max(0, Math.round((now - Date.parse(readAt)) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? '1 day ago' : `${days} days ago`;
}

// The API reads an account from the game at most once an hour, so a refresh is offered
// only once the last read is an hour old.
export function canRefresh(game: GameRead | null, now: number): boolean {
  return Boolean(game?.readAt) && !game?.asked && now - Date.parse(String(game?.readAt)) >= 3600000;
}

// ---------------------------------------------------------------------------
// The page
// ---------------------------------------------------------------------------

function logoOf(alliance: Alliance, className: string): string {
  return alliance.logoFile ? `<img class="${className}" src="${imageUrl('alliances/' + alliance.logoFile.replace(/\.png$/, ''))}" alt="">` : '';
}

function allianceColour(alliance: Alliance | undefined): string | null {
  return alliance ? (alliance.accentColor ?? alliance.baseColor) : null;
}

// The chief's picture from the game; before the game has one, the name's first letter.
function avatarOf(game: GameRead | null, name: string, className: string): string {
  if (game?.avatar) return `<img class="${className}" src="${escapeForPage(game.avatar)}" alt="">`;
  // The first letter or digit, not the decoration many names start with.
  const first = Array.from(name).find(letter => /[\p{L}\p{N}]/u.test(letter)) ?? '?';
  return `<span class="${className} no-picture">${escapeForPage(first.toUpperCase())}</span>`;
}

function powerText(value: unknown): string {
  if (!value) return '—';
  const unit = powerUnitFor(value);
  return powerShown(value, unit) + unit;
}

// Foundry power written in full with its thousands marked, the same while typed and shown.
export function foundryText(value: unknown): string {
  return value ? Math.round(Number(value)).toLocaleString('en-US') : '';
}

const REFRESH_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"' +
  ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>';

// Under the chief: when the game was last read, and the refresh once it is allowed. While
// a fresh read is on its way, it says so instead.
function readLine(game: GameRead | null, id: string, now: number): string {
  if (!game) return `<div class="chief-read waiting">${REFRESH_ICON}<span>Reading from the game</span></div>`;
  if (game.asked) return `<div class="chief-read waiting">${REFRESH_ICON}<span>Updating from the game</span></div>`;
  const refresh = canRefresh(game, now)
    ? `<button type="button" class="chief-refresh" data-game-refresh="${escapeForPage(id)}">${REFRESH_ICON}<span>Refresh</span></button>` : '';
  return `<div class="chief-read"><span>Updated ${escapeForPage(readAgo(game.readAt, now))}</span>${refresh}</div>`;
}

// An account's details, as the game shows its chief: the picture, the name large with
// the id under it, the alliance's logo and tag; then its power and foundry power side by
// side, a thin line between them, like the troops. Foundry power is the one value typed
// here (the game does not give it); while open it is the site's own glass field.
export interface ChiefOptions {
  account: Row | null;
  game: GameRead | null;
  alliances: Alliance[];
  homeState: number;
  now: number;
  editing: boolean;
  foundryDraft: unknown;
  // Whether the time of the last read shows under it, and whether the id and foundry
  // power show (not on an account being added: its id is in the field above it).
  showRead: boolean;
  preview?: boolean;
}

export function chiefHeader(options: ChiefOptions): string {
  const { account, game, alliances, homeState } = options;
  const id = String(account?.in_game_id ?? '');
  const name = game?.name ?? String(account?.in_game_name ?? '');
  const alliance = siteAllianceOf(game, alliances, homeState) ?? (game ? undefined : alliances.find(one => one.id === account?.alliance_id));
  const colour = allianceColour(alliance);
  const tag = alliance?.tag ?? game?.allianceTag ?? '';
  // Another state's chief is marked with the state: our alliances are only ours here.
  const elsewhere = game?.state && game.state !== homeState ? `<span class="chief-state">State ${game.state}</span>` : '';
  const allianceLine = tag || elsewhere
    ? `<span class="chief-alliance">${alliance ? logoOf(alliance, 'chief-logo') : ''}` +
      (tag ? `<span class="chief-tag">${escapeForPage(tag)}</span>` : '') + elsewhere + '</span>' : '';
  const power = game?.power ?? account?.player_power;
  const foundry = options.editing
    ? `<input class="info-field foundry-field" id="player-foundry_power" data-player-field="foundry_power" inputmode="numeric"` +
      ` autocomplete="off" placeholder="—" aria-label="Foundry power" value="${escapeForPage(foundryText(options.foundryDraft))}">` +
      '<small class="player-note" data-note-for="foundry_power"></small>'
    : `<span class="chief-value${account?.foundry_power ? '' : ' empty'}">${escapeForPage(foundryText(account?.foundry_power) || '—')}</span>`;
  return `<div class="chief${options.editing ? ' editing' : ''}"${colour ? ` style="--alliance-colour: ${escapeForPage(colour)}"` : ''}>` +
    `<div class="chief-who">${avatarOf(game, name, 'chief-avatar')}<div class="chief-text">` +
    `<span class="chief-name">${escapeForPage(name)}</span>` +
    (options.preview ? '' : `<span class="chief-id">${escapeForPage(id)}</span>`) + `${allianceLine}</div></div>` +
    '<div class="chief-stats">' +
    `<div class="chief-stat"><h3 class="troop-name">Power</h3><span class="chief-value${power ? '' : ' empty'}">${escapeForPage(powerText(power))}</span></div>` +
    (options.preview ? '' : `<div class="chief-stat"><h3 class="troop-name">Foundry power</h3>${foundry}</div>`) + '</div></div>' +
    (options.showRead ? readLine(game, id, options.now) : '');
}

// The troop's tier: Tier 10 unless it is Helios (XI) or Exalted (XII), each shown with
// the troop's portrait from its camp in the game (troops/infantry-t10.png and so on).
const TIERS: [Generation, string, string][] = [['', 'Tier 10', 't10'], ['Helios', 'Helios', 'helios'], ['Exalted', 'Exalted', 'exalted']];

// Whether a part shows its pencil: only once something is saved in it (a part with
// nothing saved is open without one, there is nothing to close to), and while another
// part is open for editing, only that part's pencil shows until it is saved or closed.
export function pencilShown(part: string, hasSaved: boolean, editing: ReadonlySet<string>): boolean {
  return hasSaved && (editing.size === 0 || editing.has(part));
}

// A section's title with its pencil, the site's cue to edit in place. The pencil is
// lit while the section (or troop) is open for editing.
export function sectionTitle(title: string, editKey: string, editing: boolean, hasPencil: boolean, tag: 'h2' | 'h3' = 'h2', leftCorner = ''): string {
  const label = (editing ? 'Done with ' : 'Change ') + title.toLowerCase();
  return `<div class="player-title-row">${leftCorner ? `<div class="title-left-corner">${leftCorner}</div>` : ''}` +
    `<${tag} class="${tag === 'h2' ? 'player-section-title' : 'troop-name'}">${escapeForPage(title)}</${tag}>` +
    (hasPencil ? `<button type="button" class="pencil-button${editing ? ' on' : ''}" data-player-edit="${editKey}"` +
      ` aria-label="${escapeForPage(label)}" title="${escapeForPage(label)}">${PENCIL_ICON}</button>` : '') + '</div>';
}

// A troop type as the game has it: its tier portrait, large, with its FC badge on its
// corner, and under it the tier and, on Exalted, the skill level the player set. Below
// Tier 10 the game's camp has no portrait here, so the tier shows in words alone.
function troopSummary(kind: TroopKind, troop: GameTroop | undefined, skill: number | null, prompt = false): string {
  if (!troop) return '<div class="troop-summary empty">—</div>';
  const generation: Generation = troop.tier >= 12 ? 'Exalted' : troop.tier === 11 ? 'Helios' : '';
  const tierName = TIERS.find(([name]) => name === generation) ?? TIERS[0];
  const words = troop.tier < 10 ? [`Tier ${troop.tier}`] : [tierName[1]].concat(generation === 'Exalted' && skill ? [`Lvl. ${skill}`] : []);
  // An Exalted troop whose skill level was never set asks for it, in place.
  const ask = prompt && generation === 'Exalted' && skill === null
    ? `<button type="button" class="skill-ask" data-player-edit="troop-${kind}">Set the skill level</button>` : '';
  const badge = troop.fc > 0 ? `<img class="troop-summary-badge" src="${imageUrl('troops/fc' + troop.fc)}" alt="FC${troop.fc}">` : '';
  const pictures = troop.tier < 10 ? '' : `<div class="troop-summary-pictures"><img class="troop-summary-portrait"` +
    ` src="${imageUrl('troops/' + kind + '-' + tierName[2])}" alt="">${badge}</div>`;
  return `<div class="troop-summary${troop.fc ? ' fc' + troop.fc : ''}${generation === 'Exalted' ? ' exalted' : ''}${troop.tier < 10 ? ' low' : ''}">` +
    pictures + `<div class="troop-summary-text">${escapeForPage(words.join(' · '))}</div>${ask}</div>`;
}

// Under a part open for editing: Cancel, which drops the changes and closes it, and Save,
// lit only while there are changes. An alt or a farm also gets its Remove, apart from
// the pair.
function saveButton(part: string, changed: boolean, removeLabel = '', canCancel = true): string {
  return '<div class="player-save-row">' +
    (canCancel ? `<button type="button" class="ghost-button player-cancel" data-cancel-part="${part}">Cancel</button>` : '') +
    `<button type="button" class="primary-button player-save" data-player-save="${part}"` +
    `${changed ? '' : ' disabled'}>Save</button></div>` +
    (removeLabel ? `<button type="button" class="player-remove" data-remove-account="${part}">${removeLabel}</button>` : '');
}

// A troop type: what the game says, and on Exalted the skill level, the one thing the
// game does not give. Its pencil opens the skill level in place; other troops have none.
function troopBlock(kind: TroopKind, label: string, troop: GameTroop | undefined, savedSkill: number | null, skill: number | null,
  editing: boolean, changed: boolean, hasPencil: boolean): string {
  const head = sectionTitle(label, 'troop-' + kind, editing, hasPencil, 'h3');
  if (!editing) return `<div class="troop-block">${head}${troopSummary(kind, troop, savedSkill, hasPencil)}</div>`;
  const pick = (value: number) => `data-troop-pick="${kind}|skill|${value}"`;
  const skills = '<div class="lvl-toggle">' + [0, 1, 2, 3].map(level =>
    `<button type="button" class="lvl-check${level ? '' : ' none'}${skill === level ? ' selected' : ''}" ${pick(level)}` +
    ` aria-pressed="${skill === level}">${level ? 'Lvl. ' + level : 'None'}</button>`).join('') + '</div>';
  return `<div class="troop-block editing">${head}${troopSummary(kind, troop, skill)}${skills}${saveButton('troop-' + kind, changed)}</div>`;
}

// The swap mark: two arrows going opposite ways.
const SWAP_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
  ' stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 4 3 8l4 4"/><path d="M3 8h14"/>' +
  '<path d="m17 20 4-4-4-4"/><path d="M21 16H7"/></svg>';

// In the Player info title's left corner: what this account is, and the way to the
// other one ("Main ⇄ Alt"), tapped to swap it in.
function accountSwitch(kindLabel: string, others: Row[]): string {
  if (!kindLabel) return '';
  // With more than one alt, "Alt" would not say which: each swap then shows the name.
  const named = others.filter(other => other.kind !== 'main').length > 1;
  const swaps = others.map(other => {
    const name = escapeForPage(String(other.in_game_name ?? ''));
    const label = other.kind === 'main' ? 'Main' : named ? name : 'Alt';
    return `<button type="button" class="swap${named && other.kind !== 'main' ? ' named' : ''}" data-game-account="${escapeForPage(String(other.id))}"` +
      ` aria-label="Swap to ${name}" title="Swap to ${name}">${SWAP_ICON}<span>${label}</span></button>`;
  }).join('');
  // On a phone there is no room for several names beside the title: one swap opens the
  // menu under the player's name, which lists every account by name.
  const toMenu = named ? `<button type="button" class="swap swap-to-menu" data-account-menu aria-label="Your accounts" title="Your accounts">` +
    `${SWAP_ICON}<span>Alt</span></button>` : '';
  return `<div class="account-switch${named ? ' several' : ''}"><span class="account-now">${escapeForPage(kindLabel)}</span>${swaps}${toMenu}</div>`;
}

// What an account is: the main, an alt or a farm. There is always one main, so the main's
// own switch cannot be changed: another account is made the main instead.
const ACCOUNT_KINDS: [string, string][] = [['main', 'Main'], ['alt', 'Alt'], ['farm', 'Farm']];

function kindToggle(chosen: string): string {
  return '<div class="kind-words" role="group" aria-label="Account">' + ACCOUNT_KINDS.map(([kind, label]) =>
    `<button type="button" class="kind-word${chosen === kind ? ' selected' : ''}" data-kind-pick="${kind}"` +
    ` aria-pressed="${chosen === kind}">${label}</button>`).join('') + '</div>';
}

export interface PlayerProfileOptions {
  // The account as saved, and the same with the changes not saved yet laid over it.
  saved: Row | null;
  draft: Row | null;
  // What the game says about it, and the skill levels of its Exalted troops (null where
  // never set).
  game: GameRead | null;
  skills: Partial<Record<TroopKind, number | null>>;
  alliances: Alliance[];
  homeState: number;
  now: number;
  // Which parts are open for editing ('info', 'troop-infantry' and so on) and which of
  // those have changes not saved yet.
  editing: ReadonlySet<string>;
  changed: ReadonlySet<string>;
  // With an alt: what this account is (Main or Alt), the other accounts to swap to, and
  // on a computer the One | Both switch, which sits in the title's left corner.
  kindLabel?: string;
  swapTo?: Row[];
  viewToggle?: string;
  // The reminder over the troops before SvS and Tyrant, or empty.
  skillNote?: string;
}

export function playerProfile(options: PlayerProfileOptions): string {
  const parts = profileParts(options);
  return '<section class="player-section">' +
    sectionTitle('Player info', 'info', parts.infoEditing, parts.infoPencil, 'h2', parts.corner + (options.viewToggle ?? '')) + parts.info +
    '</section><section class="player-section"><h2 class="player-section-title">Troop tiers</h2>' +
    (options.skillNote ? `<p class="skill-note">${escapeForPage(options.skillNote)}</p>` : '') + parts.troops + '</section>';
}

// A section's pencil on its own, for a half of a section split between two accounts.
export function partPencil(editKey: string, title: string, editing: boolean): string {
  const label = (editing ? 'Done with ' : 'Change ') + title.toLowerCase();
  return `<button type="button" class="pencil-button${editing ? ' on' : ''}" data-player-edit="${editKey}"` +
    ` aria-label="${escapeForPage(label)}" title="${escapeForPage(label)}">${PENCIL_ICON}</button>`;
}

// One account's profile in its parts, so they can also be laid out side by side: the
// player info (and whether it is open and has a pencil), what goes in its title's left
// corner (what the account is and the swap to the other one), and the troop tiers.
export interface ProfileParts { info: string; infoEditing: boolean; infoPencil: boolean; corner: string; troops: string }

export function profileParts(options: PlayerProfileOptions): ProfileParts {
  const { saved, draft, game, editing, changed } = options;
  const infoEditing = editing.has('info');
  // Open, the player info holds foundry power and, on an alt, what the account is (Main,
  // Alt or Farm) with its Remove apart under the pair.
  const isAlt = saved?.kind === 'alt';
  const openPart = !infoEditing ? '' : '<div class="chief-edit">' +
    (isAlt ? kindToggle(String(draft?.kind ?? saved?.kind)) : '') +
    saveButton('info', changed.has('info'), isAlt ? 'Remove this alt' : '') + '</div>';
  const info = chiefHeader({
    account: saved, game, alliances: options.alliances, homeState: options.homeState, now: options.now,
    editing: infoEditing, foundryDraft: draft?.foundry_power, showRead: !infoEditing
  }) + openPart;
  const corner = accountSwitch(options.kindLabel ?? '', options.swapTo ?? []);
  const troops = '<div class="troop-columns">' + TROOP_KINDS.map(([kind, label]) => {
      const troop = game?.troops[kind];
      const part = 'troop-' + kind;
      const exalted = (troop?.tier ?? 0) >= 12;
      const draftSkill = draft?.[kind + '_skill_level'];
      return troopBlock(kind, label, troop, options.skills[kind] ?? null,
        draftSkill === null || draftSkill === undefined ? null : Number(draftSkill),
        exalted && editing.has(part), changed.has(part), exalted && pencilShown(part, true, editing));
    }).join('') +
    '</div><small class="player-note" data-note-for="troops"></small>';
  return { info, infoEditing, infoPencil: saved !== null && pencilShown('info', true, editing), corner, troops };
}

const ACCOUNT_KIND_NAMES: Record<string, string> = { main: 'Main', alt: 'Alt' };

const PROFILE_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"' +
  ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/>' +
  '<path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>';
const SIGN_OUT_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"' +
  ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>' +
  '<path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>';

// The menu under the player's name in the top bar: their game accounts (the main, then
// the alts, once they have an alt), the one they are on lit in its alliance's colour; their profile (their
// page, where accounts are also added); for admins, the admin pages; and signing out.
export function accountMenu(accounts: Row[], activeId: number | 'new', alliances: Alliance[], isAdmin: boolean): string {
  // With only a main there is nothing to switch to, so the accounts are not listed.
  const choices = accounts.length < 2 ? '' : accounts.map(account => {
    const alliance = alliances.find(one => one.id === account.alliance_id);
    const colour = alliance ? (alliance.accentColor ?? alliance.baseColor) : null;
    return `<button type="button" class="account-choice${activeId === account.id ? ' open' : ''}" role="menuitem"` +
      ` data-game-account="${escapeForPage(String(account.id))}"` + (colour ? ` style="--alliance-colour: ${escapeForPage(colour)}"` : '') + '>' +
      (alliance?.logoFile ? `<img class="account-choice-logo" src="${imageUrl('alliances/' + alliance.logoFile.replace(/\.png$/, ''))}" alt="">`
        : `<span class="account-choice-tag">${escapeForPage(alliance?.tag ?? '')}</span>`) +
      '<span class="account-choice-text">' +
      `<span class="account-choice-kind">${ACCOUNT_KIND_NAMES[String(account.kind)] ?? ''}</span>` +
      `<span class="account-choice-name">${escapeForPage(String(account.in_game_name ?? ''))}</span></span></button>`;
  }).join('');
  const item = (attributes: string, icon: string, label: string, extra = '') =>
    `<button type="button" class="account-menu-item${extra}" role="menuitem" ${attributes}>` +
    `<span class="account-menu-plus">${icon}</span>${label}</button>`;
  return '<div class="account-menu glass" role="menu">' + choices +
    (choices ? '<div class="account-menu-line"></div>' : '') +
    item('data-page="player"', PROFILE_ICON, 'Profile') +
    (isAdmin ? item('data-page="admin"', GEAR, 'Admin') : '') +
    item('data-sign-out', SIGN_OUT_ICON, 'Sign out', ' danger') + '</div>';
}

// How the main and the alts are shown: one at a time (tapping the other swaps it in),
// or all of them side by side, each with its info and troops.
const ONE_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"' +
  ' aria-hidden="true"><rect x="5" y="4" width="14" height="16" rx="2"/></svg>';
const BOTH_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"' +
  ' aria-hidden="true"><rect x="2" y="4" width="9" height="16" rx="2"/><rect x="13" y="4" width="9" height="16" rx="2"/></svg>';

export function accountViewToggle(view: 'one' | 'both'): string {
  const choice = (value: 'one' | 'both', icon: string, label: string) =>
    `<button type="button" class="view-choice${view === value ? ' selected' : ''}" data-account-view="${value}"` +
    ` aria-pressed="${view === value}" aria-label="${label}" title="${label}">${icon}</button>`;
  return '<div class="view-toggle">' +
    choice('one', ONE_ICON, 'One account') + choice('both', BOTH_ICON, 'All accounts side by side') + '</div>';
}

// What a typed id turned out to be in the game, while an account is being added.
export type LookUpState =
  | { kind: 'none' }
  | { kind: 'looking' }
  | { kind: 'missing' }
  | { kind: 'taken' }
  | { kind: 'found'; game: GameRead };

// "Your accounts", on every account's profile: the person's farms side by side like the
// troops, a line between them, each with its alliance's logo, its name, id and power;
// tapping one opens its details under the row. The last tile adds an account: its id is
// typed, the chief it belongs to appears, and the player picks Main, Alt or Farm.
export interface AccountsSectionOptions {
  // Main, alts, then farms.
  accounts: Row[];
  games: ReadonlyMap<string, GameRead>;
  alliances: Alliance[];
  homeState: number;
  now: number;
  // The farm open from the row, or 'new' for one being added, or null; whether it is
  // open for editing, and whether its pencil shows (not while another part is open).
  openListed: number | 'new' | null;
  editing: boolean;
  pencil: boolean;
  draft: Row;
  changed: boolean;
  lookUp: LookUpState;
}

export function accountsSection(options: AccountsSectionOptions): string {
  const { accounts, alliances, games } = options;
  const open = options.openListed;
  const tile = (account: Row) => {
    const game = games.get(String(account.in_game_id ?? '')) ?? null;
    const alliance = siteAllianceOf(game, alliances, options.homeState) ?? (game ? undefined : alliances.find(one => one.id === account.alliance_id));
    const colour = allianceColour(alliance);
    const lit = open === account.id;
    return `<button type="button" class="account-tile${lit ? ' open' : ''}" data-listed-account="${escapeForPage(String(account.id))}"` +
      (colour ? ` style="--alliance-colour: ${escapeForPage(colour)}"` : '') + '>' +
      (alliance?.logoFile ? `<img class="account-tile-logo" src="${imageUrl('alliances/' + alliance.logoFile.replace(/\.png$/, ''))}" alt="">`
        : `<span class="account-tile-tag">${escapeForPage(alliance?.tag ?? game?.allianceTag ?? '')}</span>`) +
      `<span class="account-tile-kind">${ACCOUNT_KINDS.find(([kind]) => kind === account.kind)?.[1] ?? ''}</span>` +
      `<span class="account-tile-name">${escapeForPage(game?.name ?? String(account.in_game_name ?? ''))}</span>` +
      `<span class="account-tile-id">${escapeForPage(String(account.in_game_id ?? ''))}</span>` +
      `<span class="account-tile-power">${escapeForPage(powerText(game?.power ?? account.player_power))}</span></button>`;
  };
  const adding = `<button type="button" class="account-tile account-add${open === 'new' ? ' open' : ''}" data-listed-account="new">` +
    '<span class="account-tile-plus">+</span><span class="account-tile-name">Add</span></button>';
  let form = '';
  const openRow = typeof open === 'number' ? accounts.find(one => one.id === open) ?? null : null;
  if (open === 'new') form = addForm(options);
  else if (openRow) {
    // A farm in the same shape as the player's own details: the game's chief, its
    // foundry power, and while open, what it is and its Remove.
    const game = games.get(String(openRow.in_game_id ?? '')) ?? null;
    form = '<div class="account-form">' + (options.pencil ? partPencil('listed', 'Farm', options.editing) : '') +
      chiefHeader({
        account: openRow, game, alliances, homeState: options.homeState, now: options.now,
        editing: options.editing, foundryDraft: options.draft.foundry_power, showRead: !options.editing
      }) +
      (options.editing ? '<div class="chief-edit">' + kindToggle(String(options.draft.kind ?? openRow.kind)) +
        saveButton('listed', options.changed, 'Remove this farm') + '</div>' : '') + '</div>';
  }
  return '<section class="player-section"><h2 class="player-section-title">Your accounts</h2>' +
    `<div class="account-row">${accounts.filter(one => one.kind === 'farm').map(tile).join('')}${adding}</div>${form}</section>`;
}

// Adding an account: the id is typed in the site's glass field; once it is a whole id, the
// chief it belongs to appears under it, as the game shows them, so the player sees it is
// the right one. Then Main, Alt or Farm, and Save.
function addForm(options: AccountsSectionOptions): string {
  const { draft, lookUp } = options;
  const id = String(draft.in_game_id ?? '');
  const found = lookUp.kind === 'found' ? lookUp.game : null;
  const answer = found
    ? chiefHeader({ account: { in_game_id: id, foundry_power: null }, game: found, alliances: options.alliances,
        homeState: options.homeState, now: options.now, editing: false, foundryDraft: null, showRead: false, preview: true })
    : lookUp.kind === 'looking' ? '<p class="add-answer">Looking for this ID in the game.</p>'
    : lookUp.kind === 'missing' ? '<p class="add-answer problem">The game has no player with this ID.</p>'
    : lookUp.kind === 'taken' ? '<p class="add-answer problem">This ID is already one of your accounts.</p>'
    : '';
  return '<div class="account-form adding">' +
    '<div class="add-id"><input class="info-field id-entry" id="player-in_game_id" data-player-field="in_game_id" inputmode="numeric"' +
    ` autocomplete="off" placeholder="In-game ID" aria-label="In-game ID" value="${escapeForPage(id)}">` +
    '<small class="player-note" data-note-for="in_game_id"></small></div>' + answer +
    '<div class="chief-edit">' + (found ? kindToggle(String(draft.kind ?? 'alt')) : '') +
    saveButton('listed', Boolean(found)) + '</div></div>';
}
