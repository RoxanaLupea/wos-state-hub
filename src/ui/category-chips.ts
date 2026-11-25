// The calendar's filters: "Show on the calendar". Each category has a switch, and under
// it its events, each tapped on or off. On a phone it is a sheet from the bottom of the
// screen; on a computer a panel under the Filters button. It uses the page's two colours:
// the first for the category names, the switches and Done, the second for its text.
import './category-chips.css';
import { eventTypeName, sortedEventTypes } from '../data/catalog.ts';
import { escapeForPage } from './escape.ts';
import { eventIcon } from './event-icon.ts';

export interface Category { id: string; label: string; }

export const CATEGORIES: Category[] = [
  { id: 'state', label: 'State' },
  { id: 'alliance', label: 'Alliance' },
  { id: 'personal', label: 'Personal' },
  { id: 'deals', label: 'Deals' },
  // Holiday festivals, the anniversary and the like (owner, 25 Nov).
  { id: 'special', label: 'Special events' },
  // What is bought in the game's Top-up Center, kept apart from Deals, which are tied to
  // missions (owner, 25 Nov).
  { id: 'packs', label: 'Packs' }
];

export const CATEGORY_ORDER = CATEGORIES.map(category => category.id);
export const DEFAULT_CATEGORIES = ['state'];

// Which events a category's list offers. Parts are left out, because a part is
// ticked with the event it belongs to. An event that some alliance has its own time
// for is offered under Alliance as well, whatever its own category says.
export function filterListEvents(category: string, eventTypeIdsWithAllianceTimes: Set<string>): string[] {
  return sortedEventTypes()
    .filter(eventType => !eventType.partOf &&
      (eventType.category === category ||
        (category === 'alliance' && eventTypeIdsWithAllianceTimes.has(eventType.id))))
    .map(eventType => eventType.id)
    .sort((left, right) => eventTypeName(left).localeCompare(eventTypeName(right)));
}

export interface FilterOptions {
  shownCategories: Set<string>;
  hiddenEvents: Set<string>;
  eventTypeIdsWithAllianceTimes: Set<string>;
}

export function filtersSheet(options: FilterOptions): string {
  const categories = CATEGORIES.map(category => {
    const events = filterListEvents(category.id, options.eventTypeIdsWithAllianceTimes);
    if (events.length === 0) return '';
    const isOn = options.shownCategories.has(category.id);
    const shownCount = events.filter(id => !options.hiddenEvents.has(category.id + '|' + id)).length;
    const eventButtons = events.map(id => {
      const key = category.id + '|' + id;
      const isShown = !options.hiddenEvents.has(key);
      return `<button type="button" class="filter-event${isShown ? '' : ' off'}" data-filter-event="${escapeForPage(key)}"` +
        ` aria-pressed="${isShown}">${eventIcon(id)}<span>${escapeForPage(eventTypeName(id))}</span></button>`;
    }).join('');
    return `<section class="filter-category${isOn ? '' : ' off'}">` +
      `<div class="filter-category-head"><span class="filter-category-name">${escapeForPage(category.label)}` +
      `<small>${shownCount} of ${events.length}</small></span>` +
      `<button type="button" class="filter-switch${isOn ? ' on' : ''}" data-category="${category.id}" role="switch"` +
      ` aria-checked="${isOn}" aria-label="Show ${escapeForPage(category.label)} events"></button></div>` +
      `<div class="filter-events">${eventButtons}</div></section>`;
  }).join('');

  return '<div class="filters-shade" data-filters-close></div>' +
    '<div class="filters-sheet" role="dialog" aria-label="Show on the calendar">' +
    '<div class="filters-grab" aria-hidden="true"></div>' +
    '<div class="filters-head"><h2>Show on the calendar</h2>' +
    '<button type="button" class="filters-done" data-filters-close>Done</button></div>' +
    categories + '</div>';
}
