// The frame every page sits in: the state name, the pages, the clock with its UTC /
// Mine switch, and the toolbar above the calendar.
import './shell.css';
import { clockText, currentTimeMode, nowMinute } from '../calendar/time-mode.ts';
import { escapeForPage } from './escape.ts';

export interface Page { id: string; label: string; }

export const PAGES: Page[] = [
  { id: 'calendar', label: 'Calendar' },
  { id: 'fortress', label: 'Fortress' },
  { id: 'alliances', label: 'State & alliances' }
];

export function topBar(stateNumber: string, openPage: string): string {
  const mode = currentTimeMode();
  const tabs = PAGES.map(page =>
    `<button type="button" class="nav-tab" data-page="${page.id}"` +
    `${page.id === openPage ? ' aria-current="page"' : ''}>${escapeForPage(page.label)}</button>`).join('');

  return `<header class="top-bar">
    <div class="brand">
      <span class="brand-eyebrow">State ${escapeForPage(stateNumber)}</span>
      <span class="brand-title">Events</span>
    </div>
    <nav class="desktop-nav" aria-label="Main">${tabs}</nav>
    <div class="clock">
      <span class="clock-time" id="clockTime" aria-live="off">${clockText(nowMinute())}</span>
      <div class="segmented time-switch" role="group" aria-label="Times shown in">
        <button type="button" data-time-mode="game" aria-pressed="${mode === 'game'}" title="Game time (UTC)">UTC</button>
        <button type="button" data-time-mode="local" aria-pressed="${mode === 'local'}">Mine</button>
      </div>
    </div>
    <button type="button" class="ghost-button" data-sign-in>Sign in</button>
  </header>`;
}

const ARROW_LEFT = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
  ' stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>';
const ARROW_RIGHT = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
  ' stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>';

export type CalendarView = 'year' | 'month' | 'week';

export function calendarToolbar(title: string, view: CalendarView): string {
  const viewButton = (id: CalendarView, label: string) =>
    `<button type="button" data-view="${id}" aria-pressed="${view === id}">${label}</button>`;

  return `<div class="toolbar">
    <h1 class="period-title">${escapeForPage(title)}</h1>
    <div class="step-nav" role="group" aria-label="Move through the calendar">
      <button type="button" data-step="-1" aria-label="Previous">${ARROW_LEFT}</button>
      <button type="button" data-step="0">Today</button>
      <button type="button" data-step="1" aria-label="Next">${ARROW_RIGHT}</button>
    </div>
    <div class="segmented view-switch" role="group" aria-label="Calendar view">
      ${viewButton('year', 'Year')}${viewButton('month', 'Month')}${viewButton('week', 'Week')}
    </div>
  </div>`;
}
