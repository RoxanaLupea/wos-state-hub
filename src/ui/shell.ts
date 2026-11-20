// The frame every page sits in: the state name, the big sections, the game clock and
// sign in, plus the toolbar above the calendar.
import './shell.css';
import { currentTimeMode, gameClockText, nowMinute } from '../calendar/time-mode.ts';
import { escapeForPage } from './escape.ts';
import { logoSvg } from './logo.ts';
import { eventIcon } from './event-icon.ts';
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
      { id: 'board', label: 'Board' },
      { id: 'planning', label: 'Planning' },
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
      { id: 'academies', label: 'Academies' }
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

const GEAR = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
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
  isAdmin: boolean;
  // The player's in-game name once they have signed in.
  playerName: string | null;
}

export function topBar(options: TopBarOptions): string {
  const tabs = PAGES.map(page => {
    const label = page.id === 'event' ? options.eventLabel : page.label;
    return `<button type="button" class="nav-tab" data-page="${page.id}"` +
      `${page.id === options.openPage ? ' aria-current="page"' : ''}>${escapeForPage(label)}</button>`;
  }).join('');

  const adminButton = options.isAdmin
    ? `<button type="button" class="icon-button" data-page="admin" aria-label="Admin"` +
      `${options.openPage === 'admin' ? ' aria-current="page"' : ''}>${GEAR}</button>`
    : '';

  return `<header class="top-bar">
    <div class="brand">${logoSvg(options.stateNumber, 34)}</div>
    <nav class="desktop-nav" aria-label="Main">${tabs}</nav>
    <div class="clock" title="Game time">
      <span class="clock-time" id="clockTime" aria-live="off">${gameClockText(nowMinute())}</span>
      <span class="clock-zone">UTC</span>
    </div>
    ${adminButton}
    <button type="button" class="ghost-button" data-page="player">
      ${options.playerName ? escapeForPage(options.playerName) : 'Sign in'}</button>
  </header>`;
}

// The row under the top bar: the pages inside the open section. A section with only
// one page has no row.
// The event's name as the page's title: the first word as it is written, the rest
// in capitals, the way the app's own logo sets STATE 1458 against EVENTS.
function eventTitle(eventTypeId: string): string {
  const name = eventTypeName(eventTypeId);
  const firstSpace = name.indexOf(' ');
  if (firstSpace < 0) return `<b>${escapeForPage(name.toUpperCase())}</b>`;
  return escapeForPage(name.slice(0, firstSpace)) + ' ' +
    `<b>${escapeForPage(name.slice(firstSpace + 1).toUpperCase())}</b>`;
}

export function sectionNav(pageId: string, openSubPage: string, controls = ''): string {
  const page = pageById(pageId);
  if (!page || page.pages.length === 0) return '';
  // With no page named, the first one is the open one.
  const openId = openSubPage || page.pages[0].id;
  const tabs = page.pages.map(sub =>
    `<button type="button" class="section-tab" data-sub-page="${sub.id}"` +
    `${sub.id === openId ? ' aria-current="page"' : ''}>${escapeForPage(sub.label)}</button>`).join('');

  // A section built around one event says so: the event's own logo and name, the
  // same pair the calendar puts on its bars.
  const eventTypeId = page.eventTypeId;
  const identity = eventTypeId
    ? `<span class="section-id">${eventIcon(eventTypeId)}` +
      `<strong>${eventTitle(eventTypeId)}</strong></span>`
    : '';

  return `<nav class="section-nav" aria-label="${escapeForPage(page.label)}">` +
    `${identity}<div class="section-side">` +
    `<div class="section-tabs">${tabs}</div>${controls}</div></nav>`;
}

const ARROW_LEFT = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
  ' stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>';
const ARROW_RIGHT = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
  ' stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>';

export type CalendarView = 'week' | 'month' | 'year';

// Today and the two arrows come first and never change width, so the title can grow
// and shrink with the view without moving anything the hand is aiming at.
export function calendarToolbar(title: string, view: CalendarView): string {
  const mode = currentTimeMode();
  const viewButton = (id: CalendarView, label: string) =>
    `<button type="button" data-view="${id}" aria-pressed="${view === id}">${label}</button>`;

  return `<div class="toolbar">
    <div class="step-nav" role="group" aria-label="Move through the calendar">
      <button type="button" data-step="0">Today</button>
      <button type="button" data-step="-1" aria-label="Previous">${ARROW_LEFT}</button>
      <button type="button" data-step="1" aria-label="Next">${ARROW_RIGHT}</button>
    </div>
    <h1 class="period-title">${escapeForPage(title)}</h1>
    <div class="toolbar-switches">
      <div class="segmented time-switch" role="group" aria-label="Times shown in">
        <button type="button" data-time-mode="game" aria-pressed="${mode === 'game'}" title="Game time (UTC)">UTC</button>
        <button type="button" data-time-mode="local" aria-pressed="${mode === 'local'}">Mine</button>
      </div>
      <div class="segmented view-switch" role="group" aria-label="Calendar view">
        ${viewButton('week', 'Week')}${viewButton('month', 'Month')}${viewButton('year', 'Year')}
      </div>
    </div>
  </div>`;
}
