// The player's own page (settled 23-24 Nov, mockup version 34 in tools/mockups/player-page-v2):
// one game account as the game shows it. The header with the picture, name, rank, ID,
// power and the alliance's badge; the photos of the person's other accounts; the troops;
// the Arena team; the leaderboards the account is ranked on. The player only sets the
// skill levels of Exalted troops and adds their other accounts.
// The game's data is read by the database (supabase/game-refresh.sql); a refresh can be
// asked once the last read is an hour old.
import './player-profile.css';
import { escapeForPage } from './escape.ts';
import { imageUrl } from './event-icon.ts';
import type { Alliance } from '../data/alliances.ts';
import type { Row } from '../data/records.ts';
import { GEAR } from './shell.ts';
import { clockText } from '../calendar/time-mode.ts';

export type TroopKind = 'infantry' | 'lancer' | 'marksmen';
export const TROOP_KINDS: [TroopKind, string][] = [['infantry', 'Infantry'], ['lancer', 'Lancer'], ['marksmen', 'Marksmen']];

// ---------------------------------------------------------------------------
// Typed values
// ---------------------------------------------------------------------------

// Foundry power is written in full with its thousands marked.
export function filterFoundryPower(raw: string): string {
  return raw.replace(/[^0-9]/g, '').slice(0, 9);
}

export function foundryText(value: unknown): string {
  return value ? Math.round(Number(value)).toLocaleString('en-US') : '';
}

// 9 digits when the ID starts with 1 or 2, 8 when it starts with 7, 8 or 9.
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

// One troop type as the game has it: its tier (1 to 10, Helios 11, Exalted 12) and its
// FC level (0 before the first one).
export interface GameTroop { tier: number; fc: number }

// A hero of the Arena team: its number, its class (from its gear), level, stars (0 to
// 30, six steps to a star) and widget level.
export interface GameHero { id: number; troopClass: string; level: number; star: number; widget: number }

// A leaderboard the account is on: its value, the value as the game writes it (a
// Labyrinth area's "57-4"), and its rank in the state.
export interface BoardEntry { value: number; label: string | null; rank: number | null }

// An account as the game shows it, read by the database from the Whiteout Stats API.
export interface GameRead {
  name: string;
  avatar: string | null;
  power: number | null;
  powerRank: number | null;
  state: number | null;
  allianceTag: string | null;
  // The rank in the alliance, as the game writes it ("R4").
  allianceRank: string | null;
  troops: Partial<Record<TroopKind, GameTroop>>;
  heroes: GameHero[];
  boards: Record<string, BoardEntry>;
  // When the database last read the player on their own (what Refresh goes by), and
  // when anything shown was last read, the alliance's roster included.
  readAt: string | null;
  shownAt: string | null;
  asked: boolean;
}

// The game's troop types are infantry, lancer and marksman; the site's are the camps.
const GAME_TROOP_KINDS: Record<string, TroopKind> = { infantry: 'infantry', lancer: 'lancer', marksman: 'marksmen', marksmen: 'marksmen' };

const numberOrNull = (value: unknown) => value === null || value === undefined || value === '' || Number.isNaN(Number(value)) ? null : Number(value);

export function gameReadOf(row: Row | null | undefined): GameRead | null {
  const data = row?.data as Record<string, any> | undefined;
  const player = data?.player as Record<string, any> | undefined;
  if (!row || !player?.nick_name) return null;
  const troops: Partial<Record<TroopKind, GameTroop>> = {};
  for (const troop of Array.isArray(data?.troops) ? data.troops : []) {
    const kind = GAME_TROOP_KINDS[String(troop?.type)];
    if (kind && Number(troop.tier) > 0) troops[kind] = { tier: Number(troop.tier), fc: Number(troop.fire_crystal_level) || 0 };
  }
  const heroes: GameHero[] = (Array.isArray(data?.heroes) ? data.heroes : [])
    .slice().sort((left: any, right: any) => Number(left?.position ?? 0) - Number(right?.position ?? 0))
    .map((hero: any) => ({
      id: Number(hero?.id),
      troopClass: String((Array.isArray(hero?.gear) ? hero.gear : []).find((piece: any) => piece?.troop_label)?.troop_label ?? ''),
      level: Number(hero?.level) || 0,
      star: Number(hero?.star) || 0,
      widget: Number(hero?.exclusive_gear_level) || 0
    }));
  const boards: Record<string, BoardEntry> = {};
  for (const board of Array.isArray(data?.ranks?.leaderboards) ? data.ranks.leaderboards : []) {
    if (!board?.name) continue;
    boards[String(board.name)] = { value: Number(board.value) || 0, label: board.value_label ? String(board.value_label) : null, rank: numberOrNull(board.state_rank) };
  }
  return {
    name: String(player.nick_name),
    avatar: player.avatar_url ? String(player.avatar_url) : null,
    power: player.power ? Number(player.power) : null,
    powerRank: numberOrNull(data?.ranks?.power_rank) ?? boards['Personal Power']?.rank ?? null,
    state: player.kid ? Number(player.kid) : row.state_number ? Number(row.state_number) : null,
    allianceTag: player.alliance?.abbr ? String(player.alliance.abbr) : null,
    allianceRank: player.alliance?.rank_label ? String(player.alliance.rank_label) : null,
    troops,
    heroes,
    boards,
    readAt: row.read_at ? String(row.read_at) : null,
    shownAt: row.read_at ? String(row.read_at) : null,
    asked: Boolean(row.refresh_asked_at)
  };
}

// A member as an alliance's roster shows them, and when the roster was read.
export interface RosterEntry { member: Record<string, any>; state: number; tag: string; readAt: string }

// Every member of the rosters read, by in-game ID; the newest roster wins when a player
// shows up on two (they moved between reads).
export function rosterEntriesOf(rows: Row[]): Map<string, RosterEntry> {
  const byChief = new Map<string, RosterEntry>();
  for (const row of rows) {
    const members = (row.data as Record<string, any> | undefined)?.members;
    const readAt = String(row.read_at ?? '');
    for (const member of Array.isArray(members) ? members : []) {
      if (!member?.chief_id || !readAt) continue;
      const id = String(member.chief_id);
      const known = byChief.get(id);
      if (known && Date.parse(known.readAt) >= Date.parse(readAt)) continue;
      byChief.set(id, { member, state: Number(row.state_number), tag: String(row.tag), readAt });
    }
  }
  return byChief;
}

// The player as shown: troops, heroes and boards from their own read; name, picture,
// power, alliance and rank from whichever is newer, their own read or their alliance's
// roster (read every hour for the main alliances).
export function withRoster(game: GameRead | null, roster: RosterEntry | undefined): GameRead | null {
  if (!roster) return game;
  const member = roster.member;
  if (game?.readAt && Date.parse(game.readAt) >= Date.parse(roster.readAt)) return game;
  return {
    name: member.nick_name ? String(member.nick_name) : game?.name ?? '',
    avatar: member.avatar_url ? String(member.avatar_url) : game?.avatar ?? null,
    power: member.power ? Number(member.power) : game?.power ?? null,
    powerRank: game?.powerRank ?? null,
    state: roster.state,
    allianceTag: roster.tag,
    allianceRank: member.alliance_rank_label ? String(member.alliance_rank_label) : game?.allianceRank ?? null,
    troops: game?.troops ?? {},
    heroes: game?.heroes ?? [],
    boards: game?.boards ?? {},
    readAt: game?.readAt ?? null,
    shownAt: roster.readAt,
    asked: game?.asked ?? false
  };
}

// The state's top-100 boards, by chief: for each in-game ID, the boards they are on.
export function stateBoardsOf(rows: Row[]): Map<string, Record<string, BoardEntry>> {
  const byChief = new Map<string, Record<string, BoardEntry>>();
  for (const row of rows) {
    const boards = (row.data as Record<string, any> | undefined)?.boards;
    for (const board of Array.isArray(boards) ? boards : []) {
      for (const entry of Array.isArray(board?.rows) ? board.rows : []) {
        if (!entry?.chief_id) continue;
        const id = String(entry.chief_id);
        const chief = byChief.get(id) ?? {};
        chief[String(board.name)] = { value: Number(entry.score) || 0, label: entry.score_label ? String(entry.score_label) : null, rank: numberOrNull(entry.rank) };
        byChief.set(id, chief);
      }
    }
  }
  return byChief;
}

// The site's alliance for a game tag: one of ours only in our own state, matched as the
// game writes it (DVL and dvl are two alliances).
function siteAllianceOf(game: GameRead | null, alliances: Alliance[], homeState: number): Alliance | undefined {
  if (!game?.allianceTag || game.state !== homeState) return undefined;
  return alliances.find(one => one.tag === game.allianceTag);
}

// The alliance's colour on the page: its accent, or its base colour when it has none; an
// academy takes its main alliance's, lighter.
function allianceColour(alliance: Alliance | undefined, alliances: Alliance[]): string | null {
  if (!alliance) return null;
  const main = alliance.mainAllianceId ? alliances.find(one => one.id === alliance.mainAllianceId) : undefined;
  const own = (main ?? alliance).accentColor ?? (main ?? alliance).baseColor;
  if (!own) return null;
  return main ? `color-mix(in srgb, ${own} 62%, white)` : own;
}

// An account's alliance colour, from what the game says of it (or, before the game is
// read, the alliance saved on the account).
export function accountColour(account: Row, game: GameRead | null, alliances: Alliance[], homeState: number): string | null {
  const alliance = siteAllianceOf(game, alliances, homeState) ?? (game ? undefined : alliances.find(one => one.id === account.alliance_id));
  return allianceColour(alliance, alliances);
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

// What a typed ID turned out to be in the game, while an account is being added.
export type LookUpState =
  | { kind: 'none' }
  | { kind: 'looking' }
  | { kind: 'missing' }
  | { kind: 'taken' }
  | { kind: 'found'; game: GameRead };

// ---------------------------------------------------------------------------
// Pieces of the page
// ---------------------------------------------------------------------------

const REFRESH_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" fill="none" ' +
  'stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CHEVRON = '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" ' +
  'stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const HEAD = '<svg class="sil" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="15" r="7"/>' +
  '<path d="M6 38c1-9 7-14 14-14s13 5 14 14z"/></svg>';

// The game's hero cards by hero number (public/images/heroes/cards). The numbers come
// from the state's Hero Power board; a hero whose number has no card yet keeps a drawn card.
const HERO_CARDS: Record<number, string> = { 50019: 'wuming', 50032: 'edith', 50041: 'gregory', 50043: 'blanchette', 50044: 'eleonora', 50046: 'rufus' };

// The game's class icons, cut from the camp tabs.
const CLASS_FILES: Record<string, string> = { Infantry: 'infantry', Lancer: 'lancer', Marksman: 'marksmen' };

// A number as the game shortens it: 3.21B, 53.5M, 451K.
function short(value: number): string {
  for (const [size, unit] of [[1e9, 'B'], [1e6, 'M'], [1e3, 'K']] as [number, string][]) {
    if (value >= size) {
      const shown = value / size;
      return (shown < 10 ? shown.toFixed(2) : shown < 100 ? shown.toFixed(1) : shown.toFixed(0)) + unit;
    }
  }
  return value.toLocaleString('en-US');
}

// The first letter or digit of a name, not the decoration many names start with.
function firstLetter(name: string): string {
  return (Array.from(name).find(letter => /[\p{L}\p{N}]/u.test(letter)) ?? '?').toUpperCase();
}

// An account's picture from the game; before the game has one, the name's first letter.
export function pictureOf(avatar: string | null, name: string): string {
  return avatar ? `<img src="${escapeForPage(avatar)}" alt="">` : `<span>${escapeForPage(firstLetter(name))}</span>`;
}

// A hero's stars as the game draws them: five six-petal stars, one petal per step, lit
// from the top petal counter-clockwise; six steps make a star.
function starsOf(steps: number): string {
  let stars = '';
  for (let star = 0; star < 5; star++) {
    const lit = Math.max(0, Math.min(6, steps - 6 * star));
    let petals = '';
    for (let petal = 0; petal < 6; petal++) {
      petals += `<path class="${petal < lit ? 'on' : 'off'}" transform="rotate(${-60 * petal})" d="M0 -1.2 L2.3 -5.4 L0 -10 L-2.3 -5.4 Z"/>`;
    }
    stars += `<svg viewBox="-11 -11 22 22" aria-hidden="true">${petals}</svg>`;
  }
  const whole = Math.floor(steps / 6);
  return `<span class="stars" title="${whole}-Star${steps % 6 ? ` (${steps % 6} of 6)` : ''}">${stars}</span>`;
}

// When the game was last read, and Refresh: lit once it can be used, otherwise the time
// it can be used again. While a fresh read is on its way, it says so.
function freshLine(game: GameRead | null, id: string, now: number, where: 'top' | 'end'): string {
  if (!game) return `<p class="fresh ${where}">Reading from the game</p>`;
  const when = `Updated ${escapeForPage(readAgo(game.shownAt ?? game.readAt, now))}`;
  let button: string;
  if (game.asked) button = `<button type="button" class="refresh waiting" disabled>${REFRESH_ICON}Updating</button>`;
  else if (canRefresh(game, now)) button = `<button type="button" class="refresh on" data-game-refresh="${escapeForPage(id)}">${REFRESH_ICON}Refresh</button>`;
  else {
    const at = game.readAt ? clockText(Math.floor((Date.parse(game.readAt) + 3600000) / 60000)) : '';
    button = `<button type="button" class="refresh" disabled>${REFRESH_ICON}Refresh${at ? ' at ' + at : ''}</button>`;
  }
  return `<p class="fresh ${where}">${when}${button}</p>`;
}

// The skill levels of Exalted troops are the one thing typed here.
export type SkillLevels = Partial<Record<TroopKind, number | null>>;

const EDIT_ICON = '<svg class="edit-icon" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="edit-icon-colour" x1="0" y1="0" x2="1" y2="1">' +
  '<stop offset="0" style="stop-color: var(--edit-colour)"/><stop offset="1" style="stop-color: var(--text)"/></linearGradient></defs>' +
  '<g fill="none" stroke="url(#edit-icon-colour)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
  '<path d="M11 3.5H7A3.5 3.5 0 0 0 3.5 7v10A3.5 3.5 0 0 0 7 20.5h10a3.5 3.5 0 0 0 3.5-3.5v-4.5"/>' +
  '<path d="M17.6 3.2a2.3 2.3 0 0 1 3.2 3.2L12 15.2l-4.2 1 1-4.2z"/></g></svg>';

// Cancel (a cross) and Save (a tick) in the edit icon's style: a rounded line running from
// the button's tint into white (the tint is set by .quiet.cancel and .quiet.confirm).
function lineIcon(id: string, path: string): string {
  return `<svg class="line-icon" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" style="stop-color: var(--quiet-tint)"/><stop offset="1" style="stop-color: var(--text)"/></linearGradient></defs>` +
    `<path d="${path}" fill="none" stroke="url(#${id})" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
const CANCEL_ICON = lineIcon('cancel-icon-colour', 'M6 6l12 12M18 6L6 18');
const SAVE_ICON = lineIcon('save-icon-colour', 'M4.5 12.5l5 5L19.5 6.5');

// Troops: the three troop types centred in their columns, each type's name above its tier portrait (FC badge on the corner), its tier
// under it ("T10", "Helios", "Exalted · Lvl. 3"). "Update skill level" beside the title
// opens the skill levels in the same space: the pictures shrink under their names and each
// Exalted troop's levels show under its picture, one under the other, with a quiet Cancel
// and Save on the title line.
function troopsSection(options: ProfileOptions, game: GameRead | null): string {
  const kinds = TROOP_KINDS.filter(([kind]) => game?.troops[kind]);
  if (!game || kinds.length === 0) {
    return '<section class="troops"><h2>Troops</h2><p class="nodata">The game data has no troops for this chief.</p></section>';
  }
  const exalted = kinds.filter(([kind]) => (game.troops[kind]?.tier ?? 0) >= 12);
  const editing = options.editingTroops;
  const items = kinds.map(([kind, label]) => {
    const troop = game.troops[kind] as GameTroop;
    const [file, word] = troop.tier >= 12 ? ['exalted', 'Exalted'] : troop.tier === 11 ? ['helios', 'Helios'] : ['t' + troop.tier, 'T' + troop.tier];
    const skill = options.skills[kind];
    const detail = `<span class="q">${word}</span>` + (troop.tier >= 12 && skill ? `<span class="s">Lvl. ${skill}</span>` : '');
    // While editing: the levels of an Exalted troop, one under the other, or the tier of
    // any other troop, under the shrunken picture.
    let pick = '';
    if (editing && troop.tier >= 12) {
      const level = options.skillDraft[kind] ?? null;
      pick = '<div class="pick">' + [0, 1, 2, 3].map(value =>
        `<button type="button" class="lvl${level === value ? ' on' : ''}" data-troop-pick="${kind}|skill|${value}" aria-pressed="${level === value}">` +
        `${value ? 'Lvl. ' + value : 'None'}</button>`).join('') + '</div>';
    } else if (editing) pick = `<span class="pick plain">${word}</span>`;
    // The name above the picture; the picture and, while editing, the levels in one place.
    return `<div class="item"><span class="tname">${label}</span><div class="slot"><div class="art troop">` +
      `<img class="p" src="${imageUrl('troops/' + kind + '-' + file)}" alt="">` +
      (troop.fc ? `<img class="fc" src="${imageUrl('troops/fc' + troop.fc)}" alt="FC${troop.fc}">` : '') + `</div>${pick}</div>` +
      `<span class="detail">${detail}</span></div>`;
  }).join('');
  // The section's state for the animation: opening and closing play once, open stays.
  const state = editing ? (options.troopsMotion === 'opening' ? ' open opening' : ' open') : options.troopsMotion === 'closing' ? ' closing' : '';
  if (editing) {
    // Cancel and Save drawn like "Update skill level": a line icon running from its tint
    // into white, with a soft glow, then the word.
    const actions = `<span class="edit-actions"><button type="button" class="quiet cancel" data-cancel-part="troops">${CANCEL_ICON}<span class="words">Cancel</span></button>` +
      `<button type="button" class="quiet confirm" data-player-save="troops"${options.troopsChanged ? '' : ' disabled'}>${SAVE_ICON}<span class="words">Save</span></button></span>`;
    return `<section class="troops${state}"><h2>Troops${actions}</h2><div class="items three">${items}</div>` +
      '<small class="player-note" data-note-for="troops"></small></section>';
  }
  // Only the skill levels of Exalted troops are set here, so "Update skill level" shows
  // only with them, and only on the person's own main or alt. It turns red with a red dot
  // while the levels are out of date (see skillsDue); otherwise it is just the button.
  const canUpdate = exalted.length > 0 && options.ownAccount;
  // The edit icon (owner's example, 24 Nov): a rounded square open at the top right with a
  // pencil across it, drawn in one stroke that runs from a colour into white (see .remind).
  const update = canUpdate ? `<button type="button" class="remind${options.skillsDue ? ' due' : ''}" data-player-edit="troops">` +
    `${EDIT_ICON}<span><span class="words">Update skill level</span></span></button>` : '';
  return `<section class="troops${state}"><h2>Troops${update}</h2><div class="items three">${items}</div></section>`;
}

// The Arena team: the game's own hero cards, with the level written on the card over the
// stars, and "Widget Lvl. 10" under each.
function arenaSection(game: GameRead | null): string {
  if (!game || game.heroes.length === 0) return '<section class="arena"><h2>Arena team</h2><p class="nodata">The game data has no heroes for this chief.</p></section>';
  const heroes = game.heroes.map(hero => {
    const card = HERO_CARDS[hero.id];
    const classFile = CLASS_FILES[hero.troopClass];
    // The game's card carries its own class badge; the drawn card gets the game's icon.
    const art = card ? `<img class="hp" src="${imageUrl('heroes/cards/' + card)}" alt="">`
      : HEAD + (classFile ? `<span class="cm-badge"><img class="cm" src="${imageUrl('troops/' + classFile + '-class')}" alt="${escapeForPage(hero.troopClass)}"></span>` : '');
    const widget = hero.widget ? `<span class="q">Widget</span> <span class="s">Lvl. ${hero.widget}</span>` : '<span class="q">–</span>';
    return `<div class="item"><div class="art hero${card ? ' known' : ''}">${art}` +
      `<span class="hlv">Lv. ${hero.level}</span>${starsOf(hero.star)}</div><span class="detail">${widget}</span></div>`;
  }).join('');
  return `<section class="arena"><h2>Arena team</h2><div class="items five">${heroes}</div></section>`;
}

// The boards in the order of their groups: gear and heroes, growth, then the stages and
// scores with the Labyrinth's row last. Kill Count, Furnace Level and Migrant Score are
// not on the profile, and Personal Power is the header's power.
const BOARD_ORDER = ['Hero Power', 'Chief Gear Power', 'Chief Charm Power', 'Hero Equip Power', 'Total Pet Power', 'Total Expert Power',
  'Research Power', "Hero's Total Power", 'Troop Power', 'Building Power', 'The Labyrinth', 'Exploration Stage', 'Island Prosperity'];
// With more than nine boards ranked, these nine (Hero Equip Power stands in for Hero Power
// when Hero Power has no rank).
const NINE = ['Hero Power', 'Chief Gear Power', 'Chief Charm Power', 'Total Pet Power', 'Total Expert Power', 'Research Power',
  'The Labyrinth', 'Exploration Stage', 'Island Prosperity'];
const SHORT_NAMES: Record<string, string> = {
  'Total Pet Power': 'Pet Power', 'Total Expert Power': 'Expert Power', 'The Labyrinth': 'Labyrinth',
  'Exploration Stage': 'Exploration', 'Island Prosperity': 'Island'
};
const LABYRINTH_AREAS = ['Land of Heroes', 'Cave of Monsters', 'Charm Mine', 'Research Center', 'Gear Forge', 'Gaia Heart'];

function board(name: string, value: string, rank: number | null, className = 'board'): string {
  return `<div class="${className}"><span class="cap">${escapeForPage(SHORT_NAMES[name] ?? name)}</span>` +
    `<span class="v">${escapeForPage(value)}${rank ? `<span class="r">#${rank}</span>` : ''}</span></div>`;
}

function boardValue(name: string, entry: BoardEntry): string {
  if (entry.label) return entry.label;
  return name.endsWith('Power') ? short(entry.value) : entry.value.toLocaleString('en-US');
}

function boardsSection(boards: Record<string, BoardEntry>, labyrinthOpen: boolean): string {
  const ranked = BOARD_ORDER.filter(name => boards[name]?.rank);
  let shown: string[];
  if (ranked.length > 9) {
    const hero = ranked.includes('Hero Power') ? 'Hero Power' : 'Hero Equip Power';
    shown = [hero, ...NINE.slice(1)].filter(name => ranked.includes(name));
  } else shown = ranked;
  if (shown.length === 0) return '';
  const areas = LABYRINTH_AREAS.filter(name => boards[name])
    .map(name => board(name, boardValue(name, boards[name]), boards[name].rank, 'board area')).join('');
  const cells = shown.map(name => board(name, boardValue(name, boards[name]), boards[name].rank,
    name === 'The Labyrinth' ? 'board lab-first' : 'board')).join('');
  let labyrinth = '';
  if (shown.length === 1 && shown[0] === 'The Labyrinth') {
    // Only the Labyrinth: its total, then its areas, always shown.
    labyrinth = areas ? `<div class="areas">${areas}</div>` : '';
  } else if (shown.includes('The Labyrinth') && areas) {
    // Under the Labyrinth: the line that opens its areas, and closes them again. On a
    // computer the nine are one line in three groups of three, a gap column between groups.
    const index = shown.indexOf('The Labyrinth');
    const deskColumn = Math.floor(index / 3) * 4 + index % 3 + 1;
    labyrinth = `<div class="labmore"><button type="button" class="more" data-labyrinth-stages style="--col: 1; --desk-col: ${deskColumn}"` +
      ` aria-expanded="${labyrinthOpen}">Labyrinth stages${CHEVRON}</button></div>` + (labyrinthOpen ? `<div class="areas">${areas}</div>` : '');
  }
  return `<section class="boards"><h2>Leaderboards</h2><div class="grid">${cells}</div>${labyrinth}</section>`;
}

// ---------------------------------------------------------------------------
// The page
// ---------------------------------------------------------------------------

// Another account of the person's on the photo bar: its picture, and what tapping it does
// (a main or an alt becomes the account they are on; a farm opens on its own).
export interface BarAccount { row: Row; avatar: string | null; name: string; colour: string | null }

export interface ProfileOptions {
  account: Row;
  game: GameRead | null;
  // The state's boards for this account's ID, laid under what the game says of it.
  stateBoards: Record<string, BoardEntry>;
  alliances: Alliance[];
  homeState: number;
  now: number;
  // The person's other accounts, never the one shown.
  others: BarAccount[];
  // Whether this is the person's main or an alt (a farm cannot set skill levels).
  ownAccount: boolean;
  skills: SkillLevels;
  skillDraft: SkillLevels;
  editingTroops: boolean;
  // Whether the troops are just opening or closing for editing (the animation plays once).
  troopsMotion: 'opening' | 'closing' | null;
  troopsChanged: boolean;
  // Whether the skill levels are out of date: never set or not changed for over a month,
  // with one under Lvl. 3. "Update skill level" then carries a red dot.
  skillsDue: boolean;
  labyrinthOpen: boolean;
}

export function playerProfile(options: ProfileOptions): string {
  const { account, game } = options;
  const id = String(account.in_game_id ?? '');
  const name = game?.name ?? String(account.in_game_name ?? '');
  const alliance = siteAllianceOf(game, options.alliances, options.homeState) ??
    (game ? undefined : options.alliances.find(one => one.id === account.alliance_id));
  const colour = allianceColour(alliance, options.alliances);
  const tag = game?.allianceTag ?? alliance?.tag ?? '';
  const logo = alliance?.logoFile ? `<img class="logo" src="${imageUrl('alliances/' + alliance.logoFile.replace(/\.png$/, ''))}" alt="">`
    : tag ? `<span class="logo none">${escapeForPage(firstLetter(tag))}</span>` : '';
  // The tag above the logo.
  const badge = tag ? `<div class="badge"><span class="tag">${escapeForPage(tag)}</span>${logo}</div>` : '<div class="badge"></div>';
  const rank = game?.allianceRank ? `<span class="rank">${escapeForPage(game.allianceRank)}</span>` : '';
  const power = game?.power ?? numberOrNull(account.player_power);
  const powerLine = power ? `<div class="power"><b>${short(power)}</b>${game?.powerRank ? `<span class="pr">#${game.powerRank}</span>` : ''}</div>` : '';
  const foundry = account.foundry_power ? `<div class="foundry"><img src="${imageUrl('events/foundry')}" alt="Foundry"><span>${escapeForPage(foundryText(account.foundry_power))}</span></div>` : '';
  // Another state's chief is marked with the state: our alliances are only ours here.
  const elsewhere = game?.state && game.state !== options.homeState ? ` · State ${game.state}` : '';
  const header = '<header class="chief">' +
    `<div class="pic">${pictureOf(game?.avatar ?? null, name)}</div>` +
    `<div class="who"><div class="name">${escapeForPage(name)}${rank}</div>` +
    `<div class="id"><span class="k">ID</span> ${escapeForPage(id)}${elsewhere}</div>${powerLine}${foundry}</div>` +
    `<div class="side">${badge}${freshLine(game, id, options.now, 'top')}</div></header>`;
  // The person's other accounts; tapping one swaps to it.
  const bar = options.others.length === 0 ? '' : '<nav class="accbar" aria-label="Your other accounts">' + options.others.map(other => {
    const attribute = other.row.kind === 'farm' ? 'data-listed-account' : 'data-game-account';
    return `<button type="button" class="ph" ${attribute}="${escapeForPage(String(other.row.id))}" aria-label="${escapeForPage(other.name)}"` +
      ` title="${escapeForPage(other.name)}">${pictureOf(other.avatar, other.name)}</button>`;
  }).join('') + '</nav>';
  const boards = { ...options.stateBoards, ...(game?.boards ?? {}) };
  return `<div class="pp"${colour ? ` style="--ally: ${escapeForPage(colour)}"` : ''}>${header}${bar}<div class="body">` +
    troopsSection(options, game) + arenaSection(game) + boardsSection(boards, options.labyrinthOpen) +
    `</div>${freshLine(game, id, options.now, 'end')}</div>`;
}

// Adding an account, from "Add account" in the menu under the name (or as the page itself
// before the first one): the ID typed in the site's glass field; once it is a whole ID,
// the chief it belongs to appears under it, so the player sees it is the right one. Then
// Main, Alt or Farm, and Save.
export interface AddOptions {
  draft: Row;
  lookUp: LookUpState;
  alliances: Alliance[];
  homeState: number;
  // The very first account is the main, so it has no choice and nothing to cancel to.
  first: boolean;
  changed: boolean;
}

const ACCOUNT_KINDS: [string, string][] = [['main', 'Main'], ['alt', 'Alt'], ['farm', 'Farm']];

export function addAccountPage(options: AddOptions): string {
  const { draft, lookUp } = options;
  const id = String(draft.in_game_id ?? '');
  const found = lookUp.kind === 'found' ? lookUp.game : null;
  let answer = '';
  if (found) {
    const alliance = siteAllianceOf(found, options.alliances, options.homeState);
    const colour = allianceColour(alliance, options.alliances);
    const tag = found.allianceTag ?? '';
    answer = `<div class="found"${colour ? ` style="--ally: ${escapeForPage(colour)}"` : ''}><div class="pic">${pictureOf(found.avatar, found.name)}</div>` +
      `<div class="who"><div class="name">${escapeForPage(found.name)}</div>` +
      `<div class="id">${escapeForPage(tag)}${found.state && found.state !== options.homeState ? ` · State ${found.state}` : ''}</div>` +
      (found.power ? `<div class="power"><b>${short(found.power)}</b></div>` : '') + '</div></div>';
  } else if (lookUp.kind === 'looking') answer = '<p class="add-answer">Looking for this ID in the game.</p>';
  else if (lookUp.kind === 'missing') answer = '<p class="add-answer problem">The game has no player with this ID.</p>';
  else if (lookUp.kind === 'taken') answer = '<p class="add-answer problem">This ID is already one of your accounts.</p>';
  const chosen = String(draft.kind ?? 'alt');
  const kinds = found && !options.first ? '<div class="kind-words" role="group" aria-label="Account">' + ACCOUNT_KINDS.map(([kind, label]) =>
    `<button type="button" class="kind-word${chosen === kind ? ' selected' : ''}" data-kind-pick="${kind}" aria-pressed="${chosen === kind}">${label}</button>`).join('') + '</div>' : '';
  return '<div class="pp adding"><section class="add"><h2>Add account</h2>' +
    '<div class="add-id"><input class="info-field id-entry" id="player-in_game_id" data-player-field="in_game_id" inputmode="numeric"' +
    ` autocomplete="off" placeholder="In-game ID" aria-label="In-game ID" value="${escapeForPage(id)}">` +
    '<small class="player-note" data-note-for="in_game_id"></small></div>' + answer + kinds +
    '<div class="saverow">' + (options.first ? '' : '<button type="button" class="ghost-button" data-cancel-part="listed">Cancel</button>') +
    `<button type="button" class="primary-button save" data-player-save="listed"${found && options.changed ? '' : ' disabled'}>Save</button></div>` +
    '</section></div>';
}

const PLUS_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"' +
  ' aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
const PROFILE_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"' +
  ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/>' +
  '<path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>';
const SIGN_OUT_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"' +
  ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>' +
  '<path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>';

const ACCOUNT_KIND_NAMES: Record<string, string> = { main: 'Main', alt: 'Alt' };

// The menu under the player's name in the top bar: their main and alts, each with its
// picture and name, the one they are on lit; Add account; their profile; for admins, the
// admin pages; and signing out.
export function accountMenu(accounts: BarAccount[], activeId: number | 'new', isAdmin: boolean): string {
  // With only a main there is nothing to switch to, so the accounts are not listed.
  const choices = accounts.length < 2 ? '' : accounts.map(account =>
    `<button type="button" class="account-choice${activeId === account.row.id ? ' open' : ''}" role="menuitem"` +
    ` data-game-account="${escapeForPage(String(account.row.id))}"` +
    (account.colour ? ` style="--alliance-colour: ${escapeForPage(account.colour)}"` : '') + '>' +
    `<span class="choice-pic">${pictureOf(account.avatar, account.name)}</span><span class="account-choice-text">` +
    `<span class="account-choice-kind">${ACCOUNT_KIND_NAMES[String(account.row.kind)] ?? ''}</span>` +
    `<span class="account-choice-name">${escapeForPage(account.name)}</span></span></button>`).join('');
  const item = (attributes: string, icon: string, label: string, extra = '') =>
    `<button type="button" class="account-menu-item${extra}" role="menuitem" ${attributes}>` +
    `<span class="account-menu-plus">${icon}</span>${label}</button>`;
  return '<div class="account-menu glass" role="menu">' + choices +
    (choices ? '<div class="account-menu-line"></div>' : '') +
    item('data-add-account', PLUS_ICON, 'Add account') +
    item('data-page="player"', PROFILE_ICON, 'Profile') +
    (isAdmin ? item('data-page="admin"', GEAR, 'Admin') : '') +
    item('data-sign-out', SIGN_OUT_ICON, 'Sign out', ' danger') + '</div>';
}

// The sizes the page sets once it is drawn: the leaderboard names and the lines under the heroes each at
// one size small enough to fit their columns; a long name smaller until it fits.
export function fitPlayerPage(root: ParentNode = document): void {
  const textWidth = (one: Element) => { const range = document.createRange(); range.selectNodeContents(one); return range.getBoundingClientRect().width; };
  for (const name of Array.from(root.querySelectorAll<HTMLElement>('.pp .who .name'))) {
    name.style.fontSize = '';
    let size = parseFloat(getComputedStyle(name).fontSize);
    while (name.scrollWidth > name.clientWidth + 0.5 && size > 9) { size -= 0.25; name.style.fontSize = size + 'px'; }
  }
  const shrinkTogether = (items: HTMLElement[], room: number, smallest: number) => {
    if (items.length === 0) return;
    for (const one of items) one.style.fontSize = '';
    let size = parseFloat(getComputedStyle(items[0]).fontSize);
    while (Math.max(...items.map(textWidth)) > room && size > smallest) { size -= 0.25; for (const one of items) one.style.fontSize = size + 'px'; }
  };
  const caps = Array.from(root.querySelectorAll<HTMLElement>('.pp .grid .board .cap'));
  if (caps.length) shrinkTogether(caps, (caps[0].parentElement as HTMLElement).getBoundingClientRect().width - 4, 9);
  const heroLines = Array.from(root.querySelectorAll<HTMLElement>('.pp .arena .detail'));
  if (heroLines.length) shrinkTogether(heroLines, (heroLines[0].parentElement as HTMLElement).getBoundingClientRect().width, 8);
}
