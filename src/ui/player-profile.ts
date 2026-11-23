// The player's own details on their page, in the site's own look with the ideas of
// the old Tyrant and SvS registration forms: name, id and power with an M/B switch,
// the alliance as tiles, and each troop type as its FC level (with the game's badge)
// and Helios or Exalted and the skill level. Each part shows what is saved; its pencil
// opens its choices in place, and its Save button stores the changes.
// The rules are the old forms' own: the same name and id checks, power in millions or
// billions, Helios only once an FC level is picked, Exalted only on FC10, and a skill
// level only on Exalted.
import './player-profile.css';
import { escapeForPage } from './escape.ts';
import { imageUrl } from './event-icon.ts';
import { PENCIL_ICON } from './edit-forms.ts';
import type { Alliance } from '../data/alliances.ts';
import { EXALTED_FC, FC_LEVELS } from '../data/fc-levels.ts';
import type { Row } from '../data/records.ts';

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

// Power is kept as the whole number. It is typed in millions (100 to 999) or in
// billions (1 to 99.999, up to three decimals).
const POWER_RANGE: Record<PowerUnit, { min: number; max: number; digits: number; decimals: number; size: number }> = {
  M: { min: 100, max: 999, digits: 3, decimals: 0, size: 1e6 },
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

// The player's power must sit in the old forms' range.
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
// The page
// ---------------------------------------------------------------------------

function textField(field: string, label: string, value: string, inputMode: string): string {
  return `<div class="player-field"><label class="player-label" for="player-${field}">${label}</label>` +
    `<input class="text-input player-input" id="player-${field}" data-player-field="${field}" inputmode="${inputMode}" autocomplete="off"` +
    ` value="${escapeForPage(value)}"><small class="player-note" data-note-for="${field}"></small></div>`;
}

function powerField(field: string, label: string, value: unknown): string {
  const unit = powerUnitFor(value);
  const units = (['M', 'B'] as PowerUnit[]).map(one =>
    `<button type="button" class="unit-pick${one === unit ? ' selected' : ''}" data-power-unit="${field}|${one}">${one}</button>`).join('');
  return `<div class="player-field"><label class="player-label" for="player-${field}">${label}</label>` +
    `<div class="power-row"><input class="text-input player-input" id="player-${field}" data-player-field="${field}" data-unit="${unit}"` +
    ` inputmode="decimal" autocomplete="off" value="${escapeForPage(powerShown(value, unit))}">` +
    `<div class="unit-picks">${units}</div></div><small class="player-note" data-note-for="${field}"></small></div>`;
}

// Main alliances on one line, their academies smaller on the line under them, each
// under its own main alliance. Each tile shows the alliance's logo once it has one and
// its tag (the name belongs on the alliance's own page). A picked tile glows in the
// colour only that alliance has (its accent, else its banner colour); academies take
// their main alliance's colour for now.
function allianceTile(alliance: Alliance, colour: string | null, chosen: string | null, academy: boolean): string {
  return `<button type="button" class="alliance-tile${academy ? ' academy' : ''}${alliance.id === chosen ? ' selected' : ''}"` +
    ` data-alliance-pick="${escapeForPage(alliance.id)}"` + (colour ? ` style="--alliance-colour: ${escapeForPage(colour)}"` : '') + '>' +
    (alliance.logoFile ? `<img class="alliance-logo" src="${imageUrl('alliances/' + alliance.logoFile.replace(/\.png$/, ''))}" alt="">` : '') +
    `<span class="alliance-banner">${escapeForPage(alliance.tag)}</span></button>`;
}

function allianceTiles(alliances: Alliance[], chosen: string | null): string {
  const bySort = (left: Alliance, right: Alliance) => left.sortOrder - right.sortOrder;
  const mains = alliances.filter(one => !one.mainAllianceId).sort(bySort);
  const academiesOf = (main: Alliance) => alliances.filter(one => one.mainAllianceId === main.id).sort(bySort);
  const colourOf = (main: Alliance) => main.accentColor ?? main.baseColor;
  const mainRow = mains.map(main => allianceTile(main, colourOf(main), chosen, false)).join('');
  const academyRow = mains.map(main =>
    '<div class="academy-cell">' + academiesOf(main).map(academy => allianceTile(academy, colourOf(main), chosen, true)).join('') + '</div>').join('');
  const hasAcademies = mains.some(main => academiesOf(main).length > 0);
  return `<div class="alliance-rows" style="--alliance-count: ${mains.length}">` +
    `<div class="alliance-row">${mainRow}</div>` + (hasAcademies ? `<div class="alliance-row academies">${academyRow}</div>` : '') + '</div>';
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
export function sectionTitle(title: string, editKey: string, editing: boolean, hasPencil: boolean, tag: 'h2' | 'h3' = 'h2'): string {
  const label = (editing ? 'Done with ' : 'Change ') + title.toLowerCase();
  return `<div class="player-title-row"><${tag} class="${tag === 'h2' ? 'player-section-title' : 'troop-name'}">${escapeForPage(title)}</${tag}>` +
    (hasPencil ? `<button type="button" class="pencil-button${editing ? ' on' : ''}" data-player-edit="${editKey}"` +
      ` aria-label="${escapeForPage(label)}" title="${escapeForPage(label)}">${PENCIL_ICON}</button>` : '') + '</div>';
}

// What a troop type is now: its tier portrait, large, with its FC badge on its corner,
// and under it the tier and the skill level.
function troopSummary(kind: TroopKind, tier: TroopTier): string {
  if (tier.fc === null) return '<div class="troop-summary empty">Not set</div>';
  const tierName = TIERS.find(([name]) => name === tier.generation) ?? TIERS[0];
  const words = [tierName[1]].concat(tier.skill ? [`Lvl. ${tier.skill}`] : []);
  return `<div class="troop-summary fc${tier.fc}${tier.generation === 'Exalted' ? ' exalted' : ''}">` +
    `<div class="troop-summary-pictures"><img class="troop-summary-portrait" src="${imageUrl('troops/' + kind + '-' + tierName[2])}" alt="">` +
    `<img class="troop-summary-badge" src="${imageUrl('troops/fc' + tier.fc)}" alt="FC${tier.fc}"></div>` +
    `<div class="troop-summary-text">${escapeForPage(words.join(' · '))}</div></div>`;
}

// The Save button under a part open for editing: lit only while it has changes. An alt
// or a farm also gets its Remove beside it.
function saveButton(part: string, changed: boolean, removeLabel = ''): string {
  return '<div class="player-save-row">' +
    (removeLabel ? `<button type="button" class="danger-button player-remove" data-remove-account="${part}">${removeLabel}</button>` : '') +
    `<button type="button" class="primary-button player-save" data-player-save="${part}"` +
    `${changed ? '' : ' disabled'}>Save</button></div>`;
}

// A troop type's levels: its summary, or while it is open for editing, its choices.
// `saved` is what is stored; `tier` holds the changes not saved yet.
function troopBlock(kind: TroopKind, label: string, saved: TroopTier, tier: TroopTier, editing: boolean, changed: boolean, hasPencil: boolean): string {
  const head = sectionTitle(label, 'troop-' + kind, editing, hasPencil, 'h3');
  if (!editing) return `<div class="troop-block">${head}${troopSummary(kind, saved)}</div>`;
  const pick = (part: string, value: string | number) => `data-troop-pick="${kind}|${part}|${value}"`;
  const state = tier.generation ? tier.generation.toLowerCase() : 'base';
  const levels = FC_LEVELS.map(level => {
    const current = tier.fc === level ? ` current ${state}` : '';
    const badge = `<img src="${imageUrl('troops/fc' + level)}" alt="">`;
    return `<button type="button" class="fc-square fc${level}${current}" ${pick('fc', level)}>${badge}<span>FC${level}</span></button>`;
  }).join('');
  // Tier 10 and Helios need an FC level first; Exalted needs FC10.
  const tierTiles = TIERS.map(([name, label, file]) => {
    const usable = name === 'Exalted' ? tier.fc === EXALTED_FC : tier.fc !== null;
    const picked = tier.fc !== null && tier.generation === name;
    return `<button type="button" class="gen-check${picked ? ' checked' : ''}" ${pick('generation', name)}${usable ? '' : ' disabled'}>` +
      `<img src="${imageUrl('troops/' + kind + '-' + file)}" alt=""><span>${label}</span></button>`;
  }).join('');
  // The skill level only exists on Exalted, so its toggle shows only then; None first.
  const skills = tier.generation !== 'Exalted' ? '' : '<div class="lvl-toggle">' + [0, 1, 2, 3].map(level =>
    `<button type="button" class="lvl-check${level ? '' : ' none'}${tier.skill === level ? ' selected' : ''}" ${pick('skill', level)}` +
    ` aria-pressed="${tier.skill === level}">${level ? 'Lvl. ' + level : 'None'}</button>`).join('') + '</div>';
  const groupClass = tier.fc === null ? '' : ` fc${tier.fc} ${state}`;
  return `<div class="troop-block editing">${head}<div class="fc-group">${levels}</div>` +
    `<div class="tier-controls"><div class="gen-row${groupClass}">${tierTiles}</div>` +
    `${skills}</div>${saveButton('troop-' + kind, changed)}</div>`;
}

function powerText(value: unknown): string {
  if (!value) return '—';
  const unit = powerUnitFor(value);
  return powerShown(value, unit) + unit;
}

// The player's details as they are now: the alliance's logo, the name with the id
// under it, and the two powers.
function playerSummary(account: Row | null, alliance: Alliance | undefined): string {
  const fact = (label: string, value: string) =>
    `<div class="player-fact"><span class="player-label">${label}</span><span class="player-fact-value">${escapeForPage(value)}</span></div>`;
  const colour = alliance ? (alliance.accentColor ?? alliance.baseColor) : null;
  return '<div class="player-summary">' +
    `<div class="player-identity"${colour ? ` style="--alliance-colour: ${escapeForPage(colour)}"` : ''}>` +
    (alliance?.logoFile ? `<img class="player-alliance-logo" src="${imageUrl('alliances/' + alliance.logoFile.replace(/\.png$/, ''))}" alt="">` : '') +
    '<div class="player-identity-text">' +
    (alliance ? `<span class="player-alliance-tag">${escapeForPage(alliance.tag)}</span>` : '') +
    `<span class="player-name">${escapeForPage(String(account?.in_game_name ?? ''))}</span>` +
    `<span class="player-id">${escapeForPage(String(account?.in_game_id ?? ''))}</span></div></div>` +
    '<div class="player-facts">' + fact('Power', powerText(account?.player_power)) +
    fact('Foundry power', account?.foundry_power ? Math.round(Number(account.foundry_power)).toLocaleString('en-US') : '—') +
    '</div></div>';
}

export interface PlayerProfileOptions {
  // The account as saved, and the same with the changes not saved yet laid over it.
  saved: Row | null;
  draft: Row | null;
  alliances: Alliance[];
  fallbackAllianceId: string | null;
  // Which parts are open for editing ('info', 'troop-infantry' and so on) and which of
  // those have changes not saved yet.
  editing: ReadonlySet<string>;
  changed: ReadonlySet<string>;
  // A new account not saved yet shows only its details until it is saved.
  showTroops: boolean;
}

// What an account is: the main, an alt or a farm. There is always one main, so the main's
// own toggle cannot be changed: another account is made the main instead.
const ACCOUNT_KINDS: [string, string][] = [['main', 'Main'], ['alt', 'Alt'], ['farm', 'Farm']];

function kindToggle(chosen: string, isMain: boolean): string {
  return '<div class="kind-toggle">' + ACCOUNT_KINDS.map(([kind, label]) =>
    `<button type="button" class="kind-choice${chosen === kind ? ' selected' : ''}" data-kind-pick="${kind}"` +
    ` aria-pressed="${chosen === kind}"${isMain && kind !== 'main' ? ' disabled' : ''}>${label}</button>`).join('') + '</div>';
}

// The details every account has, main, alt or farm alike: name, id, power, foundry power
// (it can stay empty) and alliance; above them, what the account is, when it can change.
function accountFields(draft: Row | null, alliances: Alliance[], allianceId: string | null, toggle: string): string {
  const value = (column: string) => String(draft?.[column] ?? '');
  return toggle + '<div class="player-grid">' +
    textField('in_game_name', 'Name', value('in_game_name'), 'text') +
    '<div class="row-idpower">' +
    textField('in_game_id', 'ID', value('in_game_id'), 'numeric') +
    powerField('player_power', 'Power', draft?.player_power) +
    '</div>' +
    textField('foundry_power', 'Foundry power', draft?.foundry_power ? String(Math.round(Number(draft.foundry_power))) : '', 'numeric') +
    '<div class="player-field alliance-field"><div class="player-label">Alliance</div>' +
    allianceTiles(alliances, allianceId) + '<small class="player-note" data-note-for="alliance_id"></small></div></div>';
}

// A part with nothing saved yet is always open, so a new player can fill it in.
export function playerProfile(options: PlayerProfileOptions): string {
  const { saved, alliances, editing, changed } = options;
  const account = options.draft;
  const allianceIdOf = (row: Row | null) => row ? (row.alliance_id ? String(row.alliance_id) : null) : options.fallbackAllianceId;
  const allianceId = allianceIdOf(account);
  const infoMissing = !saved?.in_game_name || !saved?.in_game_id;
  const infoEditing = editing.has('info') || infoMissing;
  // An alt already saved can be removed while its details are open. The very first
  // account is the main and has no toggle.
  const removable = saved !== null && saved.kind === 'alt';
  const toggle = saved === null ? '' : kindToggle(String(account?.kind ?? saved.kind), saved.kind === 'main');
  const infoBody = !infoEditing
    ? playerSummary(saved, alliances.find(one => one.id === allianceIdOf(saved)))
    : accountFields(account, alliances, allianceId, toggle) +
      saveButton('info', changed.has('info'), removable ? 'Remove this alt' : '');
  const player = '<section class="player-section">' +
    sectionTitle('Player info', 'info', infoEditing, pencilShown('info', !infoMissing, editing)) + infoBody + '</section>';
  if (!options.showTroops) return player;
  const troops = '<section class="player-section"><h2 class="player-section-title">Troop tiers</h2>' +
    '<div class="troop-columns">' + TROOP_KINDS.map(([kind, label]) => {
      const savedTier = readTier(saved?.[kind + '_tier'], saved?.[kind + '_skill_level']);
      const tier = readTier(account?.[kind + '_tier'], account?.[kind + '_skill_level']);
      const part = 'troop-' + kind;
      return troopBlock(kind, label, savedTier, tier, editing.has(part) || savedTier.fc === null, changed.has(part),
        pencilShown(part, savedTier.fc !== null, editing));
    }).join('') +
    '</div><small class="player-note" data-note-for="troops"></small></section>';
  return player + troops;
}

const ACCOUNT_KIND_NAMES: Record<string, string> = { main: 'Main', alt: 'Alt' };

const PROFILE_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"' +
  ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/>' +
  '<path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>';
const SIGN_OUT_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"' +
  ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>' +
  '<path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>';

// The menu under the player's name in the top bar: their game accounts (the main, then
// the alts), the one they are on lit in its alliance's colour; their profile (their
// page, where accounts are also added); and signing out.
export function accountMenu(accounts: Row[], activeId: number | 'new', alliances: Alliance[]): string {
  const choices = accounts.map(account => {
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
    item('data-sign-out', SIGN_OUT_ICON, 'Sign out', ' danger') + '</div>';
}

// "Your accounts", on every account's profile: all the person's accounts side by side
// like the troops, a line between them, each with its alliance's logo, what it is, its
// name, id and power. The one they are on is lit; tapping the main or an alt switches to
// it, tapping a farm opens its details under the row. The last tile adds one more.
export interface AccountsSectionOptions {
  // Main, alts, then farms.
  accounts: Row[];
  activeId: number | 'new';
  alliances: Alliance[];
  // The farm open from the row, or 'new' for one being added, or null; and that
  // account as saved with its changes laid over it.
  openListed: number | 'new' | null;
  draft: Row;
  changed: boolean;
}

export function accountsSection(options: AccountsSectionOptions): string {
  const { accounts, alliances } = options;
  const open = options.openListed;
  const tile = (account: Row) => {
    const alliance = alliances.find(one => one.id === account.alliance_id);
    const colour = alliance ? (alliance.accentColor ?? alliance.baseColor) : null;
    const isFarm = account.kind === 'farm';
    const lit = isFarm ? open === account.id : options.activeId === account.id;
    const action = isFarm ? `data-listed-account="${escapeForPage(String(account.id))}"` : `data-game-account="${escapeForPage(String(account.id))}"`;
    return `<button type="button" class="account-tile${lit ? ' open' : ''}" ${action}` +
      (colour ? ` style="--alliance-colour: ${escapeForPage(colour)}"` : '') + '>' +
      (alliance?.logoFile ? `<img class="account-tile-logo" src="${imageUrl('alliances/' + alliance.logoFile.replace(/\.png$/, ''))}" alt="">`
        : `<span class="account-tile-tag">${escapeForPage(alliance?.tag ?? '')}</span>`) +
      `<span class="account-tile-kind">${ACCOUNT_KINDS.find(([kind]) => kind === account.kind)?.[1] ?? ''}</span>` +
      `<span class="account-tile-name">${escapeForPage(String(account.in_game_name ?? ''))}</span>` +
      `<span class="account-tile-id">${escapeForPage(String(account.in_game_id ?? ''))}</span>` +
      `<span class="account-tile-power">${escapeForPage(powerText(account.player_power))}</span></button>`;
  };
  const adding = `<button type="button" class="account-tile account-add${open === 'new' ? ' open' : ''}" data-listed-account="new">` +
    '<span class="account-tile-plus">+</span><span class="account-tile-name">Add</span></button>';
  let form = '';
  if (open !== null) {
    const draft = options.draft;
    const savedKind = open === 'new' ? '' : String(accounts.find(one => one.id === open)?.kind ?? '');
    form = '<div class="account-form">' +
      accountFields(draft, alliances, draft.alliance_id ? String(draft.alliance_id) : null, kindToggle(String(draft.kind ?? 'alt'), savedKind === 'main')) +
      saveButton('listed', options.changed, open === 'new' ? '' : 'Remove this farm') + '</div>';
  }
  return '<section class="player-section"><h2 class="player-section-title">Your accounts</h2>' +
    `<div class="account-row">${accounts.map(tile).join('')}${adding}</div>${form}</section>`;
}
