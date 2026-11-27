// The frame every page sits in: the state name, the big sections, the game clock and
// sign in, plus the toolbar above the calendar.
import './shell.css';
import { currentTimeMode, gameClockText, nowMinute } from '../calendar/time-mode.ts';
import { playerPictureMarkup } from './broken-picture.ts';
import { escapeForPage } from './escape.ts';
import { logoSvg } from './logo.ts';
import { eventIcon, imageUrl } from './event-icon.ts';
import { eventTypeName } from '../data/catalog.ts';

export interface SubPage { id: string; label: string; }
export interface Page {
  id: string;
  label: string;
  // Set when the whole section is about one event, so the section can carry that
  // event's logo and name.
  eventTypeId?: string;
  // The pages inside this section, shown in the row under the top bar.
  pages: SubPage[];
}

// The big sections, in the order they sit in the top bar. The event section is named
// after whatever is running, so its label is filled in when the page is drawn.
export const PAGES: Page[] = [
  { id: 'calendar', label: 'Calendar', pages: [] },
  {
    id: 'fortress', label: 'Fortress', eventTypeId: 'fortress-battles', pages: [
      { id: 'phase', label: 'Phase' },
      { id: 'season', label: 'Season' },
      { id: 'rewards', label: 'Rewards' }
    ]
  },
  {
    id: 'transfers', label: 'Transfers', eventTypeId: 'transfer', pages: [
      { id: 'timeline', label: 'Timeline' },
      { id: 'invites', label: 'Invites' },
      { id: 'records', label: 'Records' }
    ]
  },
  {
    id: 'event', label: 'Event', pages: [
      { id: 'availability', label: 'Availability' },
      { id: 'roster', label: 'Roster' },
      { id: 'plan', label: 'Plan' },
      { id: 'battle-map', label: 'Battle map' }
    ]
  },
  { id: 'state', label: 'State', pages: [] },
  {
    id: 'alliance', label: 'My alliance', pages: [
      { id: 'times', label: 'Times' },
      { id: 'members', label: 'Members' },
      { id: 'academies', label: 'Academies' },
      { id: 'results', label: 'Results' },
      { id: 'opponents', label: 'Opponents' }
    ]
  },
  {
    id: 'map', label: 'Map', pages: [
      { id: 'territory', label: 'Territory' },
      { id: 'facilities', label: 'Facilities' }
    ]
  }
];

// Behind the gear, for admins only.
export const ADMIN_PAGE: Page = {
  id: 'admin', label: 'Admin', pages: [
    { id: 'settings', label: 'Settings' },
    { id: 'roles', label: 'Roles' },
    { id: 'requests', label: 'Alliance requests' }
  ]
};

export function pageById(id: string): Page | undefined {
  return id === ADMIN_PAGE.id ? ADMIN_PAGE : PAGES.find(page => page.id === id);
}

// The gear: the cue for the admin pages, in the menu under an admin's name.
export const GEAR = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
  ' stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06' +
  'a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33' +
  'l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09' +
  'A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6' +
  'a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06' +
  'a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09' +
  'a1.65 1.65 0 0 0-1.51 1z"/></svg>';

export interface TopBarOptions {
  stateNumber: string;
  openPage: string;
  // The name of the event running now, used for the event section.
  eventLabel: string;
  // The player's in-game name once they have signed in (the name of the game account
  // they are on), and the menu their name opens.
  playerName: string | null;
  // The picture of the game account they are on, from the game; null before the game has one.
  playerPicture?: string | null;
  accountMenu: string | null;
  // A red dot on the name: something in the menu waits for this person.
  menuDot?: boolean;
  // The event the event section is about, so the open section can show its logo and name.
  eventTypeId: string | null;
}

// The Calendar's own logo; the other sections borrow their event's.
const CALENDAR_LOGO_FILE = 'calendar';

// The open section is marked by its logo and its full name in its own colour, with the
// line under it on the band's edge. A section with no logo of its own shows its name only.
function openTab(page: Page, options: TopBarOptions): string {
  const eventTypeId = page.id === 'event' ? options.eventTypeId : page.eventTypeId ?? null;
  const logo = page.id === 'calendar' ? `<img class="event-icon" src="${escapeForPage(imageUrl(CALENDAR_LOGO_FILE))}" alt="">`
    : eventTypeId ? eventIcon(eventTypeId) : '';
  const name = eventTypeId ? eventTypeName(eventTypeId) : page.label;
  // Some sections write their name in two parts (Roxanne, 24 Nov): one word in capitals
  // in the first colour, the other as it is in the second colour. "State TRANSFER",
  // "FORTRESS Battles" and "Frostdragon TYRANT".
  const firstSpace = name.indexOf(' ');
  const capitalsLast = page.id === 'transfers' || eventTypeId === 'tyrant';
  if (firstSpace > 0 && (capitalsLast || page.id === 'fortress')) {
    const first = name.slice(0, firstSpace);
    const rest = name.slice(firstSpace + 1);
    const second = (words: string) => `<span class="nav-second-word">${escapeForPage(words)}</span>`;
    return `${logo}<span>` + (capitalsLast
      ? `${second(first)} ${escapeForPage(rest.toUpperCase())}`
      : `${escapeForPage(first.toUpperCase())} ${second(rest)}`) + '</span>';
  }
  return `${logo}<span>${escapeForPage(name)}</span>`;
}

export function topBar(options: TopBarOptions): string {
  const tabs = PAGES.map(page => {
    const isOpen = page.id === options.openPage;
    const label = page.id === 'event' ? options.eventLabel : page.label;
    return `<button type="button" class="nav-tab" data-page="${page.id}"` +
      `${isOpen ? ' aria-current="page"' : ''}>${isOpen ? openTab(page, options) : escapeForPage(label)}</button>`;
  }).join('');

  return `<header class="top-bar">
    <div class="brand">${logoSvg(options.stateNumber, 34)}</div>
    <nav class="main-nav" aria-label="Main">${tabs}</nav>
    <div class="clock" title="Game time">
      <span class="clock-zone">UTC</span>
      <span class="clock-time" id="clockTime" aria-live="off">${gameClockText(nowMinute())}</span>
    </div>
    <span class="top-divider" aria-hidden="true"></span>
    ${options.playerName
      ? `<div class="account-menu-wrap"><button type="button" class="ghost-button me-button" data-account-menu` +
        ` aria-haspopup="menu" aria-expanded="false" aria-label="${escapeForPage(options.playerName)}">` +
        `<span class="me-pic" aria-hidden="true">${options.playerPicture ? playerPictureMarkup(options.playerPicture)
          : escapeForPage((Array.from(options.playerName).find(letter => /[\p{L}\p{N}]/u.test(letter)) ?? '').toUpperCase())}</span>` +
        `<span class="me-name">${escapeForPage(options.playerName)}</span>` +
        // The arrow to the menu, drawn as the site's icons are (computer only).
        '<svg class="me-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"' +
        ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>' +
        (options.menuDot ? '<i class="menu-dot" aria-hidden="true"></i>' : '') +
        `</button>${options.accountMenu ?? ''}</div>`
      : '<button type="button" class="ghost-button" data-page="player">Sign in</button>'}
  </header>`;
}

// The row under the top bar: the pages inside the open section, and the page's own
// controls. A section with only one page has no row. The section's name and logo are in
// the band above, so the row does not repeat them.
export function sectionNav(pageId: string, openSubPage: string, controls = ''): string {
  const page = pageById(pageId);
  if (!page || page.pages.length === 0) return '';
  // With no page named, the first one is the open one.
  const openId = openSubPage || page.pages[0].id;
  const tabs = page.pages.map(sub =>
    `<button type="button" class="section-tab" data-sub-page="${sub.id}"` +
    `${sub.id === openId ? ' aria-current="page"' : ''}>${escapeForPage(sub.label)}</button>`).join('');

  return `<nav class="section-nav" aria-label="${escapeForPage(page.label)}">` +
    `<div class="section-side"><div class="section-tabs">${tabs}</div>${controls}</div></nav>`;
}

export type CalendarView = 'week' | 'month' | 'year';

// An arrow curling back round to a dot: Today takes you back to now.
// The calendar's line icons drawn as the site's other icons are (the edit icon, the pin):
// one stroke running from the page's colour into white, with a soft glow (owner, 25 Nov).
// Each has its own colour name, since an icon's colour is set by the first of that name.
function lineIcon(id: string, body: string, strokeWidth = 2.2): string {
  return `<svg class="line-icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">` +
    '<stop offset="0" style="stop-color: var(--section)"/><stop offset="1" style="stop-color: var(--text)"/></linearGradient></defs>' +
    `<g fill="none" stroke="url(#${id})" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;
}
// The arrows that step a month or a week, in the same icon style and shape as the
// Invites page's arrows (Roxanne, 26 Nov: "the same format here too").
const ARROW_LEFT = lineIcon('step-left-colour', '<path d="M14.5 6l-6 6 6 6"/>');
const ARROW_RIGHT = lineIcon('step-right-colour', '<path d="M9.5 6l6 6-6 6"/>');
// Today: the pin that marks where we are in an event's timeline.
const TODAY_ICON = lineIcon('today-icon-colour',
  '<path d="M12 21.6c-.6-.5-7-6.3-7-11.6a7 7 0 0 1 14 0c0 5.3-6.4 11.1-7 11.6z"/><circle cx="12" cy="10" r="2.8"/>');
// Two curved arrows going round: UTC swaps to your own time and back.
const SWAP_ICON = lineIcon('swap-icon-colour',
  '<path d="M4 12.5V11a5 5 0 0 1 5-5h10.5"/><path d="M16 2.5L19.5 6 16 9.5"/>' +
  '<path d="M20 11.5V13a5 5 0 0 1-5 5H4.5"/><path d="M8 21.5L4.5 18 8 14.5"/>');
// A funnel with what it sorts falling in.
const FUNNEL_ICON = lineIcon('funnel-icon-colour',
  '<rect x="3.5" y="8" width="17" height="3.2" rx="1.6"/><path d="M5 11.2l5.2 6V22l3.6-2.2v-2.6l5.2-6"/>' +
  '<circle cx="9" cy="4.2" r="1.5" fill="url(#funnel-icon-colour)" stroke="none" opacity=".8"/>' +
  '<circle cx="14.6" cy="3" r="1.9" fill="url(#funnel-icon-colour)" stroke="none" opacity=".8"/>', 2);

// The three views as calendar pages: Week one row of days, Month two, Year a stack of pages.
// Drawn in the site's icon style (owner, 25 Nov), one stroke from the page's colour into
// white, each with its own colour name.
function calendarPage(id: string, body: string): string {
  return `<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">` +
    '<stop offset="0" style="stop-color: var(--section)"/><stop offset="1" style="stop-color: var(--text)"/></linearGradient></defs>' +
    `<g fill="none" stroke="url(#${id})" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">` +
    body.replace(/DOT_FILL/g, `url(#${id})`) + '</g></svg>';
}
const dayDot = (x: number, y: number) => `<circle cx="${x}" cy="${y}" r="1.05" fill="DOT_FILL" stroke="none"/>`;
const PAGE_OUTLINE = '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M8 3v4M16 3v4M3.5 10h17"/>';
const VIEW_ICONS: Record<CalendarView, string> = {
  week: calendarPage('view-week-colour', PAGE_OUTLINE + [7, 10.3, 13.7, 17].map(x => dayDot(x, 15.2)).join('')),
  month: calendarPage('view-month-colour', PAGE_OUTLINE + [13.2, 16.7].map(y => [7, 10.3, 13.7, 17].map(x => dayDot(x, y)).join('')).join('')),
  year: calendarPage('view-year-colour', '<rect x="2.5" y="8" width="13.5" height="13" rx="2.2"/><path d="M6 6.5v3M12.5 6.5v3M2.5 12h13.5"/>' +
    '<path d="M6.5 5.5V5a2 2 0 0 1 2-2H19a2.5 2.5 0 0 1 2.5 2.5V14a2 2 0 0 1-2 2h-.5"/>' + dayDot(6, 16) + dayDot(9.2, 16) + dayDot(12.5, 16))
};
// The year view is set aside for now (owner, 25 Nov: "we can keep only week and month …
// don't delete it yet, just disable it"); its code stays, and this brings it back.
export const YEAR_VIEW_SHOWN = false;
const VIEW_NAMES: Record<CalendarView, string> = { week: 'Week', month: 'Month', year: 'Year' };

export interface ToolbarOptions {
  title: string;
  view: CalendarView;
  // Today shows only while today is out of sight.
  todayInView: boolean;
  // The year view has its own events, so Filters is not offered there.
  showFilters: boolean;
  filtersOpen: boolean;
}

// The calendar's controls. On a phone, one line (owner, 25 Nov): the date, the three
// views, Filters and UTC, with Today's pin after the date only when today is out of
// sight; Today and Filters are their icons alone, and a week's title has no year. On a
// computer: the month, the pin and the arrows after it on the left, the views, UTC and
// Filters on the right. Nothing is boxed: the open view is bright with a line under it.
export function calendarToolbar(options: ToolbarOptions): string {
  const mode = currentTimeMode();
  const viewButton = (id: CalendarView) =>
    `<button type="button" class="view-icon" data-view="${id}" aria-pressed="${options.view === id}"` +
    ` aria-label="${VIEW_NAMES[id]}" title="${VIEW_NAMES[id]}">${VIEW_ICONS[id]}</button>`;
  // The word says which time is shown; tapping it swaps to the other.
  const timeWord = mode === 'game' ? 'UTC' : 'Mine';
  // The other word sits unseen in the same place, so the button is as wide as the wider
  // of the two and nothing moves when the time is swapped (owner, 25 Nov).
  const otherWord = mode === 'game' ? 'Mine' : 'UTC';
  // The pin back to today, directly after the date and only while today is out of sight,
  // as on the Invites page, on the phone and the computer alike (Roxanne, 26 Nov).
  const today = options.todayInView ? ''
    : `<button type="button" class="quiet-button today-button" data-step="0" aria-label="Today" title="Back to today">${TODAY_ICON}</button>`;
  // A week's year is left out on a phone, so the line fits (owner, 25 Nov); a month keeps it.
  const year = options.view === 'week' ? / \d{4}$/.exec(options.title)?.[0] ?? '' : '';
  const title = year ? `<span class="title-long">${escapeForPage(options.title)}</span>` +
    `<span class="title-short">${escapeForPage(options.title.slice(0, options.title.length - year.length))}</span>` : escapeForPage(options.title);

  return `<div class="toolbar" data-view="${options.view}">
    <div class="toolbar-month">
      <div class="month-steps">
        <h1 class="period-title">${title}</h1>
        <span class="step-controls">${today}<button type="button" class="step-arrow" data-step="-1" aria-label="Previous">${ARROW_LEFT}</button>` +
    `<button type="button" class="step-arrow" data-step="1" aria-label="Next">${ARROW_RIGHT}</button></span>
      </div>
      <button type="button" class="quiet-button time-word" data-time-mode="${mode === 'game' ? 'local' : 'game'}"` +
    ` title="${mode === 'game' ? 'Game time (UTC). Tap for your own time.' : 'Your own time. Tap for game time (UTC).'}">${SWAP_ICON}<span class="time-word-box"><span class="shown">${timeWord}</span><span aria-hidden="true">${otherWord}</span></span></button>
    </div>
    <div class="toolbar-views">
      <div class="view-icons" role="group" aria-label="Calendar view">${viewButton('week')}${viewButton('month')}${YEAR_VIEW_SHOWN ? viewButton('year') : ''}</div>
      <span class="control-divider" aria-hidden="true"></span>
      ${options.showFilters ? `<button type="button" class="quiet-button filters-button${options.filtersOpen ? ' open' : ''}"` +
        ` data-filters-open aria-expanded="${options.filtersOpen}" aria-label="Filters">${FUNNEL_ICON}<span class="phone-hidden">Filters</span></button>` : ''}
    </div>
  </div>`;
}
