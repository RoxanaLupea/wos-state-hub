// The filter chips above the calendar. A chip ticks a whole category on or off, and
// its arrow opens a list where single events can be unticked inside that category.
import './category-chips.css';
import { eventTypeName, sortedEventTypes } from '../data/catalog.ts';
import { escapeForPage } from './escape.ts';
import { eventIcon } from './event-icon.ts';

export interface Category { id: string; label: string; }

export const CATEGORIES: Category[] = [
  { id: 'state', label: 'State' },
  { id: 'alliance', label: 'Alliance' },
  { id: 'personal', label: 'Personal' },
  { id: 'deals', label: 'Deals' }
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

export interface ChipOptions {
  shownCategories: Set<string>;
  hiddenEvents: Set<string>;
  // The category whose list is open, if any.
  openList: string | null;
  eventTypeIdsWithAllianceTimes: Set<string>;
}

export function categoryChips(options: ChipOptions): string {
  return CATEGORIES.map(category => {
    const events = filterListEvents(category.id, options.eventTypeIdsWithAllianceTimes);
    const isOn = options.shownCategories.has(category.id);
    const shownCount = events.filter(id => !options.hiddenEvents.has(category.id + '|' + id)).length;
    const isOpen = options.openList === category.id;

    let html = `<span class="filter-group${isOpen ? ' open' : ''}">` +
      `<span class="chip filter-chip" aria-pressed="${isOn}">` +
      `<button type="button" class="filter-name" data-category="${category.id}">` +
      (isOn ? '<span class="chip-check" aria-hidden="true">&#10003;</span>' : '') +
      `${escapeForPage(category.label)} <span class="filter-count">${shownCount}/${events.length}</span></button>` +
      `<button type="button" class="filter-arrow" data-filter-list="${category.id}"` +
      ` aria-expanded="${isOpen}" aria-label="Choose ${escapeForPage(category.label)} events">&#9662;</button></span>`;

    if (isOpen) {
      const allShown = shownCount === events.length;
      html += `<div class="filter-list" role="group" aria-label="${escapeForPage(category.label)} events">` +
        `<div class="filter-list-head"><span>${escapeForPage(category.label)} events</span>` +
        `<button type="button" class="filter-all" data-filter-all="${category.id}">` +
        `${allShown ? 'Untick all' : 'Tick all'}</button></div>` +
        events.map(id => {
          const key = category.id + '|' + id;
          const isShown = !options.hiddenEvents.has(key);
          return `<button type="button" class="filter-item${isShown ? '' : ' off'}"` +
            ` data-filter-event="${escapeForPage(key)}" aria-pressed="${isShown}">` +
            `<span class="filter-box${isShown ? ' on' : ''}" aria-hidden="true">${isShown ? '&#10003;' : ''}</span>` +
            `${eventIcon(id)}<span>${escapeForPage(eventTypeName(id))}</span></button>`;
        }).join('') + '</div>';
    }
    return html + '</span>';
  }).join('');
}
