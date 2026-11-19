import './upcoming.css';
import { eventGroupName, eventTypeColor, eventTypeName } from '../data/catalog.ts';
import type { Occurrence } from '../calendar/schedule-dates.ts';
import type { Alliance } from '../data/alliances.ts';

const WEEKDAY_AND_DAY = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC'
});

// Anything written into the page as text goes through this first, so a name from the
// database can never be read as markup.
function escapeForPage(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function describeDay(date: string): string {
  return WEEKDAY_AND_DAY.format(new Date(date + 'T00:00:00Z'));
}

// Events already under way show how long is left rather than a start date that has
// been and gone.
function describeWhen(occurrence: Occurrence, today: string): string {
  if (occurrence.startDate <= today) {
    const daysLeft = daysBetween(today, occurrence.endDate);
    const label = daysLeft <= 0 ? 'Ends today' : 'Ends ' + describeDay(occurrence.endDate);
    return `<span class="event-day">${escapeForPage(label)}</span>`;
  }
  const time = occurrence.startTimeUtc ? ' ' + occurrence.startTimeUtc : '';
  return `<span class="event-day">${escapeForPage(describeDay(occurrence.startDate))}</span>`
    + escapeForPage(time);
}

function daysBetween(from: string, to: string): number {
  const day = 24 * 60 * 60 * 1000;
  return Math.round((Date.parse(to + 'T00:00:00Z') - Date.parse(from + 'T00:00:00Z')) / day);
}

function describeWho(occurrence: Occurrence, alliancesById: Map<string, Alliance>): string {
  const tags = occurrence.allianceIds
    .map(id => alliancesById.get(id)?.tag ?? id)
    .map(tag => `<span class="event-tag">${escapeForPage(tag)}</span>`);
  if (occurrence.wasMoved) tags.push('<span class="event-tag moved">moved</span>');
  return tags.join('');
}

// "Bear Hunt" on its own cannot tell trap 1 from trap 2, so the group name is added
// when the event has one.
function describeName(occurrence: Occurrence): string {
  const name = eventTypeName(occurrence.eventTypeId);
  const groupName = eventGroupName(occurrence.eventTypeId);
  if (!groupName || occurrence.groupNumber === null) return escapeForPage(name);
  return escapeForPage(name)
    + `<span class="event-part">${escapeForPage(groupName + ' ' + occurrence.groupNumber)}</span>`;
}

function eventRow(
  occurrence: Occurrence,
  today: string,
  alliancesById: Map<string, Alliance>
): string {
  const color = eventTypeColor(occurrence.eventTypeId);
  return `
    <div class="event-row" style="--event-color: ${escapeForPage(color)}">
      <span class="event-stripe"></span>
      <span class="event-when">${describeWhen(occurrence, today)}</span>
      <span class="event-name">${describeName(occurrence)}</span>
      <span class="event-tags">${describeWho(occurrence, alliancesById)}</span>
    </div>`;
}

function eventGroup(
  heading: string,
  occurrences: Occurrence[],
  today: string,
  alliancesById: Map<string, Alliance>
): string {
  if (occurrences.length === 0) return '';
  const rows = occurrences.map(one => eventRow(one, today, alliancesById)).join('');
  return `
    <h3 class="group-heading">${escapeForPage(heading)}</h3>
    <div class="event-list">${rows}</div>`;
}

export interface LoadedCounts {
  schedules: number;
  alliances: number;
}

export function upcomingPanel(
  occurrences: Occurrence[],
  today: string,
  alliances: Alliance[],
  counts: LoadedCounts,
  howManyRunning = 6,
  howManyComing = 8
): string {
  const alliancesById = new Map(alliances.map(alliance => [alliance.id, alliance]));
  const running = occurrences.filter(one => one.startDate <= today).slice(0, howManyRunning);
  const coming = occurrences.filter(one => one.startDate > today).slice(0, howManyComing);

  return `
    <section class="panel glass">
      <h2 class="panel-title">State 1458</h2>
      <p class="panel-note">Worked out from the schedules in the database.</p>
      ${eventGroup('Happening now', running, today, alliancesById)}
      ${eventGroup('Coming up', coming, today, alliancesById)}
      <p class="panel-counts">
        ${counts.schedules} schedules and ${counts.alliances} alliances loaded.
      </p>
    </section>`;
}

export function problemPanel(message: string): string {
  return `
    <section class="panel glass">
      <h2 class="panel-title">Could not load</h2>
      <p class="panel-problem">${escapeForPage(message)}</p>
    </section>`;
}
