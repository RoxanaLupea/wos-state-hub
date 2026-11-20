import './day-panel.css';
import { eventTypeColor, eventTypeName } from '../data/catalog.ts';
import { longDayText } from './day-names.ts';
import { clockText, timeModeText } from '../calendar/time-mode.ts';
import { escapeForPage } from './escape.ts';
import { eventBadge } from './event-icon.ts';
import type { AllDayItem, DayContents, Moment } from '../calendar/day-timeline.ts';

// A dot sits in a soft ring of its own colour. The colour comes from the catalog as
// six hex digits, so the ring is the same colour with an opacity added.
function colorWithOpacity(color: string, opacity: number): string {
  const digits = color.replace('#', '');
  if (digits.length !== 6) return color;
  const red = parseInt(digits.slice(0, 2), 16);
  const green = parseInt(digits.slice(2, 4), 16);
  const blue = parseInt(digits.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

function allDayItemMarkup(item: AllDayItem): string {
  const mark = item.occurrence.wasCancelled
    ? '<span class="cancelled-mark" aria-label="Cancelled">&times;</span> ' : '';
  return `<div class="all-day-item">
    ${eventBadge(item.occurrence.eventTypeId)}
    <span class="all-day-text">
      <span class="event-title">${mark}${escapeForPage(item.name)}</span>
      ${item.shortLine ? `<span class="event-note">${escapeForPage(item.shortLine)}</span>` : ''}
    </span>
  </div>`;
}

function momentMarkup(moment: Moment): string {
  const color = eventTypeColor(moment.eventTypeId);
  return `<li class="moment"><div class="moment-row">
    <span class="moment-time"><span class="time-main">${clockText(moment.minute)}</span></span>
    <span class="moment-rail"><span class="moment-dot"
      style="background:${color};box-shadow:0 0 0 3px ${colorWithOpacity(color, 0.25)}"></span></span>
    <span class="moment-body"><span class="moment-title">
      ${eventBadge(moment.eventTypeId, 'small')}
      <span class="moment-title-text">${escapeForPage(moment.title)}</span>
    </span></span>
  </div></li>`;
}

export interface DayPanelOptions {
  isOpen: boolean;
  // True when the Alliance filter is ticked but the player has not said which
  // alliance is theirs, so no alliance time can be shown.
  needsAlliancePick: boolean;
}

export function dayPanel(day: number, contents: DayContents, options: DayPanelOptions): string {
  const heading = `<button type="button" class="day-back" data-close-day>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M15 18l-6-6 6-6"/></svg>Back</button>
    <div class="day-heading"><div class="day-heading-text">
      <h2>${escapeForPage(longDayText(day))}</h2>
      <span>${escapeForPage(timeModeText())}</span>
    </div></div>`;

  const alliancePrompt = options.needsAlliancePick
    ? '<div class="day-empty glass">Pick your alliance to see its times.</div>' : '';

  const nothingToShow = !contents.allDayItems.length && !contents.moments.length;
  const body = nothingToShow
    ? '<div class="day-empty glass">Nothing in the ticked filters on this day.</div>'
    : `<section class="day-section glass"><h3>Timeline</h3>
        ${contents.allDayItems.length ? `<div class="all-day-list">
          <span class="all-day-label">All day</span>
          ${contents.allDayItems.map(allDayItemMarkup).join('')}
        </div>` : ''}
        ${contents.moments.length
          ? `<ol class="moment-list">${contents.moments.map(momentMarkup).join('')}</ol>` : ''}
      </section>`;

  return `<aside class="day-panel${options.isOpen ? ' open' : ''}">` +
    `${heading}${alliancePrompt}${body}</aside>`;
}

// The name of an event as the panel says it. Kept here so the panel and the month
// grid never drift apart on what an event is called.
export function panelEventName(eventTypeId: string): string {
  return eventTypeName(eventTypeId);
}
