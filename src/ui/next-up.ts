// The two tiles above the day's details: what the state has on next, and what comes
// after it. Only state and alliance events count, because those are the ones everyone
// has to be somewhere for.
import './next-up.css';
import { clockText, nowMinute, shownDayOf } from '../calendar/time-mode.ts';
import { categoryOf, eventTypeColor, eventTypeName, sortOrderOf } from '../data/catalog.ts';
import { colorWithAlpha } from './colors.ts';
import { shortDayText } from './day-names.ts';
import { escapeForPage } from './escape.ts';
import { eventBadge } from './event-icon.ts';
import type { Occurrence } from '../calendar/occurrences.ts';

// A panel tinted with an event's own colour, lit from the top left.
export function tintedPanelStyle(color: string): string {
  return `background:linear-gradient(135deg,${colorWithAlpha(color, 0.36)},${colorWithAlpha(color, 0.04)} 65%),var(--glass);` +
    'box-shadow:inset 0 1px 0 rgba(255,255,255,0.14),' +
    `inset 0 -3px 0 ${colorWithAlpha(color, 0.7)},0 10px 26px ${colorWithAlpha(color, 0.12)};`;
}

export function nextUpTiles(occurrences: Occurrence[]): string {
  const now = nowMinute();
  const upcoming = occurrences
    .filter(occurrence =>
      occurrence.allianceIds.length === 0 &&
      ['state', 'alliance'].includes(categoryOf(occurrence.eventTypeId)) &&
      occurrence.startMinute > now && !occurrence.wasCancelled)
    .sort((left, right) => left.startMinute - right.startMinute ||
      sortOrderOf(left.eventTypeId) - sortOrderOf(right.eventTypeId))
    .slice(0, 2);

  return upcoming.map((occurrence, index) => {
    const color = eventTypeColor(occurrence.eventTypeId);
    const startText = clockText(occurrence.startMinute);
    const when = shortDayText(shownDayOf(occurrence.startMinute)) +
      (startText === '00:00' ? '' : ' · ' + startText);
    return `<div class="next-tile glass" style="${tintedPanelStyle(color)}">` +
      `<div class="next-tile-head">${eventBadge(occurrence.eventTypeId)}` +
      `<div class="next-tile-names"><span class="next-tile-label">${index === 0 ? 'Next up' : 'Then'}</span>` +
      `<span class="next-tile-title">${escapeForPage(eventTypeName(occurrence.eventTypeId))}</span></div></div>` +
      `<span class="event-note">${escapeForPage(when)}</span></div>`;
  }).join('');
}
