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
// The page
// ---------------------------------------------------------------------------

// While open, the player's details keep the shape they have when shown: the alliance's
// logo, the kind and the name with the id under it, then the two powers. Each value
// becomes a field in its own place, the logo opens the list of alliances, and nothing
// else is added to the page.
function inlineInput(field: string, value: string, inputMode: string, label: string, size: string, placeholder = label): string {
  return `<input class="inline-input ${size}" id="player-${field}" data-player-field="${field}" inputmode="${inputMode}"` +
    ` autocomplete="off" placeholder="${placeholder}" aria-label="${label}" value="${escapeForPage(value)}">` +
    `<small class="player-note" data-note-for="${field}"></small>`;
}

function powerInput(field: string, value: unknown): string {
  const unit = powerUnitFor(value);
  const units = (['M', 'B'] as PowerUnit[]).map(one =>
    `<button type="button" class="unit-pick${one === unit ? ' selected' : ''}" data-power-unit="${field}|${one}"` +
    ` aria-pressed="${one === unit}" aria-label="${one === 'M' ? 'Millions' : 'Billions'}">${one}</button>`).join('');
  return `<div class="power-edit"><input class="inline-input inline-fact" id="player-${field}" data-player-field="${field}" data-unit="${unit}"` +
    ` inputmode="decimal" autocomplete="off" aria-label="Power" placeholder="—" value="${escapeForPage(powerShown(value, unit))}">` +
    `<div class="unit-picks">${units}</div></div><small class="player-note" data-note-for="${field}"></small>`;
}

const CHEVRON = '<svg class="picker-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
  ' stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

function logoOf(alliance: Alliance, className: string): string {
  return alliance.logoFile ? `<img class="${className}" src="${imageUrl('alliances/' + alliance.logoFile.replace(/\.png$/, ''))}" alt="">` : '';
}

// The alliance: its logo (or tag) with a small arrow; tapped, a list opens under it with
// each main alliance and its academies under it, the picked one marked.
function alliancePicker(alliances: Alliance[], chosen: string | null): string {
  const bySort = (left: Alliance, right: Alliance) => left.sortOrder - right.sortOrder;
  const mains = alliances.filter(one => !one.mainAllianceId).sort(bySort);
  const colourOf = (main: Alliance) => main.accentColor ?? main.baseColor;
  const choice = (alliance: Alliance, colour: string | null, academy: boolean) =>
    `<button type="button" class="alliance-choice${academy ? ' academy' : ''}${alliance.id === chosen ? ' selected' : ''}"` +
    ` data-alliance-pick="${escapeForPage(alliance.id)}"` + (colour ? ` style="--alliance-colour: ${escapeForPage(colour)}"` : '') + '>' +
    `<span class="alliance-choice-logo">${logoOf(alliance, 'alliance-choice-img')}</span>` +
    `<span class="alliance-choice-tag">${escapeForPage(alliance.tag)}</span>` +
    `<span class="alliance-choice-name">${escapeForPage(alliance.name)}</span></button>`;
  const list = mains.map(main => choice(main, colourOf(main), false) +
    alliances.filter(one => one.mainAllianceId === main.id).sort(bySort).map(academy => choice(academy, colourOf(main), true)).join('')).join('');
  const current = alliances.find(one => one.id === chosen);
  const logo = current?.logoFile ? logoOf(current, 'player-alliance-logo') : '<span class="picker-no-logo"></span>';
  const face = `${logo}<span class="picker-pill">${escapeForPage(current?.tag ?? 'Alliance')}${CHEVRON}</span>`;
  return `<details class="alliance-picker"><summary aria-label="Alliance">${face}</summary>` +
    `<div class="alliance-list">${list}</div></details>`;
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

// Under a part open for editing: Cancel, which drops the changes and closes it, and Save,
// lit only while there are changes. An alt or a farm also gets its Remove. A part with
// nothing saved yet has no Cancel: there is nothing to go back to.
function saveButton(part: string, changed: boolean, removeLabel = '', canCancel = true): string {
  return '<div class="player-save-row">' +
    (canCancel ? `<button type="button" class="ghost-button player-cancel" data-cancel-part="${part}">Cancel</button>` : '') +
    `<button type="button" class="primary-button player-save" data-player-save="${part}"` +
    `${changed ? '' : ' disabled'}>Save</button></div>` +
    (removeLabel ? `<button type="button" class="player-remove" data-remove-account="${part}">${removeLabel}</button>` : '');
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
    `${skills}</div>${saveButton('troop-' + kind, changed, '', saved.fc !== null)}</div>`;
}

// Foundry power written in full with its thousands marked, the same while typed and shown.
export function foundryText(value: unknown): string {
  return value ? Math.round(Number(value)).toLocaleString('en-US') : '';
}

function powerText(value: unknown): string {
  if (!value) return '—';
  const unit = powerUnitFor(value);
  return powerShown(value, unit) + unit;
}

// The player's details as they are now: the alliance's logo, the name with the id
// under it, and the two powers.
// The swap mark: two arrows going opposite ways.
const SWAP_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
  ' stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 4 3 8l4 4"/><path d="M3 8h14"/>' +
  '<path d="m17 20 4-4-4-4"/><path d="M21 16H7"/></svg>';

// Where the swap to the other account sits in the summary row (being compared): beside
// the alliance logo, or at the opposite end of the row, after the powers.
const SWAP_SIDE: 'beside' | 'opposite' = 'beside';

// The other account to swap to: its alliance's logo, small, and under it the swap mark
// with Main or Alt. Tapped, it swaps that account in.
function swapButton(other: Row, alliances: Alliance[]): string {
  const alliance = alliances.find(one => one.id === other.alliance_id);
  const colour = alliance ? (alliance.accentColor ?? alliance.baseColor) : null;
  const logo = alliance?.logoFile ? `<img class="swap-logo" src="${imageUrl('alliances/' + alliance.logoFile.replace(/\.png$/, ''))}" alt="">`
    : `<span class="swap-tag">${escapeForPage(alliance?.tag ?? '')}</span>`;
  const name = escapeForPage(String(other.in_game_name ?? ''));
  return `<button type="button" class="swap" data-game-account="${escapeForPage(String(other.id))}"` +
    (colour ? ` style="--alliance-colour: ${escapeForPage(colour)}"` : '') + ` aria-label="Swap to ${name}" title="Swap to ${name}">` +
    `${logo}<span class="swap-line">${SWAP_ICON}<span class="swap-kind">${other.kind === 'main' ? 'Main' : 'Alt'}</span></span></button>`;
}

function playerSummary(account: Row | null, alliance: Alliance | undefined, kindLabel = '', swaps = ''): string {
  const fact = (label: string, value: string) =>
    `<div class="player-fact"><span class="player-label">${label}</span><span class="player-fact-value">${escapeForPage(value)}</span></div>`;
  const colour = alliance ? (alliance.accentColor ?? alliance.baseColor) : null;
  return '<div class="player-summary">' + (SWAP_SIDE === 'beside' ? swaps : '') +
    `<div class="player-identity"${colour ? ` style="--alliance-colour: ${escapeForPage(colour)}"` : ''}>` +
    (alliance?.logoFile ? `<img class="player-alliance-logo" src="${imageUrl('alliances/' + alliance.logoFile.replace(/\.png$/, ''))}" alt="">` : '') +
    '<div class="player-identity-text">' +
    ((alliance || kindLabel) ? '<span class="player-tag-line">' +
      (alliance ? `<span class="player-alliance-tag">${escapeForPage(alliance.tag)}</span>` : '') +
      (alliance && kindLabel ? '<span class="player-kind-dot">·</span>' : '') +
      (kindLabel ? `<span class="player-kind">${escapeForPage(kindLabel)}</span>` : '') + '</span>' : '') +
    `<span class="player-name">${escapeForPage(String(account?.in_game_name ?? ''))}</span>` +
    `<span class="player-id">${escapeForPage(String(account?.in_game_id ?? ''))}</span></div></div>` +
    '<div class="player-facts">' + fact('Power', powerText(account?.player_power)) +
    fact('Foundry power', foundryText(account?.foundry_power) || '—') +
    '</div>' + (SWAP_SIDE === 'opposite' ? swaps : '') + '</div>';
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
  // With an alt: what this account is (Main or Alt), the other accounts to swap to, and
  // on a computer the One | Both switch, which sits in the title's left corner.
  kindLabel?: string;
  swapTo?: Row[];
  viewToggle?: string;
}

// What an account is: the main, an alt or a farm. There is always one main, so the main's
// own toggle cannot be changed: another account is made the main instead.
const ACCOUNT_KINDS: [string, string][] = [['main', 'Main'], ['alt', 'Alt'], ['farm', 'Farm']];

function kindToggle(chosen: string, isMain: boolean): string {
  if (isMain) return '<span class="player-kind">Main</span>';
  return '<div class="kind-words" role="group" aria-label="Account">' + ACCOUNT_KINDS.map(([kind, label]) =>
    `<button type="button" class="kind-word${chosen === kind ? ' selected' : ''}" data-kind-pick="${kind}"` +
    ` aria-pressed="${chosen === kind}">${label}</button>`).join('') + '</div>';
}

// The details every account has, main, alt or farm alike: name, id, power, foundry power
// (it can stay empty) and alliance; above the name, what the account is, when it can change.
function accountFields(draft: Row | null, alliances: Alliance[], allianceId: string | null, toggle: string): string {
  const value = (column: string) => String(draft?.[column] ?? '');
  const alliance = alliances.find(one => one.id === allianceId);
  const colour = alliance ? (alliance.accentColor ?? alliance.baseColor) : null;
  return '<div class="player-summary player-editor">' +
    `<div class="player-identity"${colour ? ` style="--alliance-colour: ${escapeForPage(colour)}"` : ''}>` +
    '<div class="picker-cell">' + alliancePicker(alliances, allianceId) + '<small class="player-note" data-note-for="alliance_id"></small></div>' +
    '<div class="player-identity-text">' +
    (toggle ? `<div class="kind-line">${toggle}</div>` : '') +
    inlineInput('in_game_name', value('in_game_name'), 'text', 'Name', 'inline-name') +
    inlineInput('in_game_id', value('in_game_id'), 'numeric', 'ID', 'inline-id') + '</div></div>' +
    '<div class="player-facts">' +
    '<div class="player-fact"><label class="player-label" for="player-player_power">Power</label>' + powerInput('player_power', draft?.player_power) + '</div>' +
    '<div class="player-fact"><label class="player-label" for="player-foundry_power">Foundry power</label>' +
    inlineInput('foundry_power', foundryText(draft?.foundry_power), 'numeric', 'Foundry power', 'inline-fact inline-foundry', '—') +
    '</div></div></div>';
}

// A part with nothing saved yet is always open, so a new player can fill it in.
export function playerProfile(options: PlayerProfileOptions): string {
  const parts = profileParts(options);
  const player = '<section class="player-section">' +
    sectionTitle('Player info', 'info', parts.infoEditing, parts.infoPencil, 'h2', options.viewToggle ?? '') + parts.info + '</section>';
  if (parts.troops === null) return player;
  return player + '<section class="player-section"><h2 class="player-section-title">Troop tiers</h2>' + parts.troops + '</section>';
}

// A section's pencil on its own, for a half of a section split between two accounts.
export function partPencil(editKey: string, title: string, editing: boolean): string {
  const label = (editing ? 'Done with ' : 'Change ') + title.toLowerCase();
  return `<button type="button" class="pencil-button${editing ? ' on' : ''}" data-player-edit="${editKey}"` +
    ` aria-label="${escapeForPage(label)}" title="${escapeForPage(label)}">${PENCIL_ICON}</button>`;
}

// One account's profile in its parts: the player info (and whether it is open and has
// a pencil) and the troop tiers, so they can also be laid out side by side.
export interface ProfileParts { info: string; infoEditing: boolean; infoPencil: boolean; troops: string | null }

export function profileParts(options: PlayerProfileOptions): ProfileParts {
  const { saved, alliances, editing, changed } = options;
  const account = options.draft;
  const allianceIdOf = (row: Row | null) => row ? (row.alliance_id ? String(row.alliance_id) : null) : options.fallbackAllianceId;
  const allianceId = allianceIdOf(account);
  const infoMissing = !saved?.in_game_name || !saved?.in_game_id;
  const infoEditing = editing.has('info') || infoMissing;
  // An alt already saved can be removed while its details are open. The very first
  // account is the main and has no toggle.
  const removable = saved !== null && saved.kind === 'alt';
  const toggle = saved === null || (saved.kind === 'main' && !options.kindLabel) ? ''
    : kindToggle(String(account?.kind ?? saved.kind), saved.kind === 'main');
  const infoBody = !infoEditing
    ? playerSummary(saved, alliances.find(one => one.id === allianceIdOf(saved)), options.kindLabel ?? '',
        (options.swapTo ?? []).map(other => swapButton(other, alliances)).join(''))
    : accountFields(account, alliances, allianceId, toggle) +
      saveButton('info', changed.has('info'), removable ? 'Remove this alt' : '', !infoMissing);
  const info = { info: infoBody, infoEditing, infoPencil: pencilShown('info', !infoMissing, editing) };
  if (!options.showTroops) return { ...info, troops: null };
  const troops = '<div class="troop-columns">' + TROOP_KINDS.map(([kind, label]) => {
      const savedTier = readTier(saved?.[kind + '_tier'], saved?.[kind + '_skill_level']);
      const tier = readTier(account?.[kind + '_tier'], account?.[kind + '_skill_level']);
      const part = 'troop-' + kind;
      return troopBlock(kind, label, savedTier, tier, editing.has(part) || savedTier.fc === null, changed.has(part),
        pencilShown(part, savedTier.fc !== null, editing));
    }).join('') +
    '</div><small class="player-note" data-note-for="troops"></small>';
  return { ...info, troops };
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

// "Your accounts", on every account's profile: the person's farms side by side like
// the troops, a line between them, each with its alliance's logo, its name, id and
// power; tapping one opens its details under the row. The last tile adds an account,
// an alt or a farm. The main and the alts are switched at the top of the page.
export interface AccountsSectionOptions {
  // Main, alts, then farms.
  accounts: Row[];
  activeId: number | 'new';
  alliances: Alliance[];
  // The farm open from the row, or 'new' for one being added, or null; and that
  // account as saved with its changes laid over it.
  openListed: number | 'new' | null;
  // Whether it is open for editing or only shown, and whether its pencil shows (not
  // while another part of the page is open).
  editing: boolean;
  pencil: boolean;
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
    const lit = isFarm && open === account.id;
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
  const openRow = typeof open === 'number' ? accounts.find(one => one.id === open) ?? null : null;
  if (open === 'new' || (openRow && options.editing)) {
    const draft = options.draft;
    form = '<div class="account-form">' +
      accountFields(draft, alliances, draft.alliance_id ? String(draft.alliance_id) : null, kindToggle(String(draft.kind ?? 'alt'), false)) +
      saveButton('listed', options.changed, open === 'new' ? '' : 'Remove this farm') + '</div>';
  } else if (openRow) {
    // A farm as it is saved, shown like the player's own details, with its pencil.
    form = '<div class="account-form showing">' + (options.pencil ? partPencil('listed', 'Farm', false) : '') +
      playerSummary(openRow, alliances.find(one => one.id === openRow.alliance_id), 'Farm') + '</div>';
  }
  return '<section class="player-section"><h2 class="player-section-title">Your accounts</h2>' +
    `<div class="account-row">${accounts.filter(one => one.kind === 'farm').map(tile).join('')}${adding}</div>${form}</section>`;
}
