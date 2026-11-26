// Finding a player by name among the state's players the site knows, with the in-game ID
// as the backup, looked up in the game (Roxanne, 26 Nov). One element for every place that
// picks a player: the transfer manager on the Invites card and the president in the SvS
// results. Typing shows the players found in a list under the box; picking one puts the
// name in the box and its picture beside it. The list is drawn into the page directly, so
// typing never redraws the page.
import './player-search.css';
import { escapeForPage } from './escape.ts';
import { pictureOf } from './player-profile.ts';

export interface FoundPlayer { id: string; name: string; avatar: string | null; alliance: string | null }

export interface PlayerSources {
  // The state's players (its alliances' rosters); null while they are being read.
  statePlayers(): FoundPlayer[] | null;
  lookUp(id: string): Promise<FoundPlayer | null>;
  // An alliance tag as the site draws it.
  tagPill(tag: string): string;
}

interface SearchState {
  // What is in the box.
  typed: string;
  // The player picked; null once something was typed and nothing picked yet.
  chosen: FoundPlayer | null;
  // The players last listed, so a tap finds the one picked.
  listed: FoundPlayer[];
  listMarkup: string;
  lookUpId: string;
  timer: number;
  // The player the box showed when typing started; another one shown (a save, another
  // event opened) starts the box afresh.
  origin: string;
}

const searches = new Map<string, SearchState>();

export interface SearchFieldOptions {
  key: string;
  // The player shown before anything is typed.
  shown: FoundPlayer | null;
  placeholder: string;
  label: string;
  // Hidden form fields filled on picking: the name as the game writes it ("[DVL]name"),
  // the in-game ID and the picture.
  formNames?: { text: string; id: string; avatar: string };
  className?: string;
  // The box's own look where the page has one (the SvS results' small fields).
  fieldClass?: string;
  // The picture in the box, where the name is shown with it.
  picture?: boolean;
  // The name in the box as the game writes it, with its alliance: "[DVL]name".
  gameWriting?: boolean;
}

function asGameWrites(player: FoundPlayer): string {
  return player.alliance ? `[${player.alliance}]${player.name}` : player.name;
}

export function playerSearchField(options: SearchFieldOptions): string {
  const origin = options.shown?.id || options.shown?.name || '';
  if (searches.get(options.key)?.origin !== undefined && searches.get(options.key)?.origin !== origin) forgetPlayerSearch(options.key);
  const search = searches.get(options.key);
  const player = search ? search.chosen : options.shown;
  const nameOf = (one: FoundPlayer) => options.gameWriting ? asGameWrites(one) : one.name;
  const typed = search ? search.typed : options.shown ? nameOf(options.shown) : '';
  const names = options.formNames;
  const hidden = names
    ? `<input type="hidden" name="${names.text}" data-player-search-text value="${escapeForPage(player ? asGameWrites(player) : search ? typed : '')}">` +
      `<input type="hidden" name="${names.id}" data-player-search-id value="${escapeForPage(player?.id ?? '')}">` +
      `<input type="hidden" name="${names.avatar}" data-player-search-avatar value="${escapeForPage(player?.avatar ?? '')}">`
    : '';
  const list = search && !search.chosen && search.listMarkup ? search.listMarkup : '';
  return `<span class="player-search${options.className ? ' ' + options.className : ''}${options.picture ? ' with-picture' : ''}"` +
    ` data-player-search="${escapeForPage(options.key)}" data-origin="${escapeForPage(origin)}"${options.gameWriting ? ' data-game-writing' : ''}>` +
    (options.picture ? `<span class="ps-pic">${player ? pictureOf(player.avatar, player.name) : ''}</span>` : '') +
    `<input class="${options.fieldClass ?? 'info-field'} ps-field" data-player-search-input autocomplete="off" spellcheck="false" placeholder="${escapeForPage(options.placeholder)}"` +
    ` aria-label="${escapeForPage(options.label)}" value="${escapeForPage(typed)}">` + hidden +
    `<span class="ps-list" role="listbox"${list ? '' : ' hidden'}>${list}</span></span>`;
}

// What was picked: undefined when the box was not touched, null when something was typed
// and no player picked (or the box was emptied), otherwise the player.
export function playerSearchChoice(key: string): FoundPlayer | null | undefined {
  const search = searches.get(key);
  return search ? search.chosen : undefined;
}

export function playerSearchTyped(key: string): string | undefined {
  return searches.get(key)?.typed;
}

export function forgetPlayerSearch(key: string): void {
  const search = searches.get(key);
  if (search) window.clearTimeout(search.timer);
  searches.delete(key);
}

function optionMarkup(player: FoundPlayer, sources: PlayerSources): string {
  return `<button type="button" class="ps-option" data-player-pick="${escapeForPage(player.id)}">` +
    `<span class="ps-who"><span class="ps-pic">${pictureOf(player.avatar, player.name)}</span><span class="ps-name">${escapeForPage(player.name)}</span></span>` +
    `${player.alliance ? sources.tagPill(player.alliance) : ''}</button>`;
}

function noteMarkup(text: string): string {
  return `<p class="ps-note">${escapeForPage(text)}</p>`;
}

// Names that start with what was typed first, then names that hold it; six at most.
function matchesOf(typed: string, people: FoundPlayer[]): FoundPlayer[] {
  const wanted = typed.trim().toLowerCase();
  const starts = people.filter(one => one.name.toLowerCase().startsWith(wanted));
  const holds = people.filter(one => !one.name.toLowerCase().startsWith(wanted) && one.name.toLowerCase().includes(wanted));
  return [...starts, ...holds].slice(0, 6);
}

function showList(box: HTMLElement, search: SearchState): void {
  const list = box.querySelector<HTMLElement>('.ps-list');
  if (!list) return;
  list.innerHTML = search.listMarkup;
  list.hidden = !search.listMarkup || !!search.chosen;
  // Near the bottom of the screen the list opens upwards, so none of it is cut.
  const room = window.innerHeight - box.getBoundingClientRect().bottom;
  list.classList.toggle('up', !list.hidden && room < list.offsetHeight + 16);
}

function fillHidden(box: HTMLElement, search: SearchState): void {
  const set = (selector: string, value: string) => {
    const field = box.querySelector<HTMLInputElement>(selector);
    if (field) field.value = value;
  };
  set('[data-player-search-text]', search.chosen ? asGameWrites(search.chosen) : search.typed);
  set('[data-player-search-id]', search.chosen?.id ?? '');
  set('[data-player-search-avatar]', search.chosen?.avatar ?? '');
}

// Typing in a search box: the list under it follows what is typed.
export function handlePlayerSearchInput(target: HTMLElement, sources: PlayerSources): boolean {
  if (!(target instanceof HTMLInputElement) || !target.matches('[data-player-search-input]')) return false;
  const box = target.closest<HTMLElement>('[data-player-search]');
  if (!box) return false;
  const key = box.dataset.playerSearch as string;
  const search: SearchState = searches.get(key) ??
    { typed: '', chosen: null, listed: [], listMarkup: '', lookUpId: '', timer: 0, origin: box.dataset.origin ?? '' };
  searches.set(key, search);
  search.typed = target.value;
  search.chosen = null;
  window.clearTimeout(search.timer);
  const picture = box.querySelector<HTMLElement>(':scope > .ps-pic');
  if (picture) picture.innerHTML = '';
  const typed = target.value.trim();
  search.listed = [];
  if (!typed) search.listMarkup = '';
  else if (/^\d+$/.test(typed)) {
    // An in-game ID: looked up in the game once it is whole.
    search.listMarkup = /^\d{8,10}$/.test(typed) ? noteMarkup('Looking for this ID in the game.') : '';
    if (/^\d{8,10}$/.test(typed)) {
      search.lookUpId = typed;
      search.timer = window.setTimeout(() => {
        void sources.lookUp(typed).catch(() => null).then(found => {
          if (search.lookUpId !== typed || search.typed.trim() !== typed) return;
          search.listed = found ? [found] : [];
          search.listMarkup = found ? optionMarkup(found, sources) : noteMarkup('The game has no player with this ID.');
          const shownBox = document.querySelector<HTMLElement>(`[data-player-search="${CSS.escape(key)}"]`);
          if (shownBox) showList(shownBox, search);
        });
      }, 350);
    }
  } else {
    const people = sources.statePlayers();
    if (!people) search.listMarkup = noteMarkup('Reading the state\'s players.');
    else {
      search.listed = matchesOf(typed, people);
      search.listMarkup = search.listed.length ? search.listed.map(one => optionMarkup(one, sources)).join('')
        : noteMarkup('No player of the state has this name. Type the in-game ID instead.');
    }
  }
  showList(box, search);
  fillHidden(box, search);
  return true;
}

// A player picked from the list. Returns the search's key, or null when the tap was not
// on a player in a list.
export function handlePlayerSearchClick(target: HTMLElement): string | null {
  const option = target.closest<HTMLElement>('[data-player-pick]');
  const box = option?.closest<HTMLElement>('[data-player-search]');
  if (!option || !box) {
    // A tap anywhere else closes an open list.
    for (const list of Array.from(document.querySelectorAll<HTMLElement>('.player-search .ps-list:not([hidden])'))) {
      if (!list.parentElement?.contains(target)) list.hidden = true;
    }
    return null;
  }
  const key = box.dataset.playerSearch as string;
  const search = searches.get(key);
  const player = search?.listed.find(one => one.id === option.dataset.playerPick);
  if (!search || !player) return null;
  search.chosen = player;
  search.typed = box.hasAttribute('data-game-writing') ? asGameWrites(player) : player.name;
  const field = box.querySelector<HTMLInputElement>('[data-player-search-input]');
  if (field) field.value = search.typed;
  const picture = box.querySelector<HTMLElement>(':scope > .ps-pic');
  if (picture) picture.innerHTML = pictureOf(player.avatar, player.name);
  showList(box, search);
  fillHidden(box, search);
  return key;
}
