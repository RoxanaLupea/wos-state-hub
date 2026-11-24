// The state at a glance: its alliances with their academies, and the event times each
// one runs. A presentation page rather than a working one.
import './pages.css';
import './data-table.css';
import { eventTypeName, eventGroupName } from '../data/catalog.ts';
import { clockText } from '../calendar/time-mode.ts';
import { minutesFromTime } from '../calendar/days.ts';
import { escapeForPage } from './escape.ts';
import { eventIcon } from './event-icon.ts';
import type { Alliance } from '../data/alliances.ts';
import type { Schedule } from '../calendar/occurrences.ts';

// One alliance's own event times: which event, which of its slots, and at what hour.
interface AllianceTime {
  eventTypeId: string;
  groupNumber: number | null;
  startTimeUtc: string;
}

// A schedule keeps its alliances as one written list, the way the database holds it.
function allianceIdsOf(schedule: Schedule): string[] {
  return (schedule.allianceIds ?? '').split(',').map(id => id.trim()).filter(Boolean);
}

function timesOf(allianceId: string, schedules: Schedule[]): AllianceTime[] {
  return schedules
    .filter(schedule => allianceIdsOf(schedule).includes(allianceId))
    .map(schedule => ({
      eventTypeId: schedule.eventTypeId,
      groupNumber: schedule.groupNumber,
      startTimeUtc: schedule.startTimeUtc ?? ''
    }))
    .sort((left, right) =>
      left.eventTypeId.localeCompare(right.eventTypeId) ||
      (left.groupNumber ?? 0) - (right.groupNumber ?? 0));
}

// "Trap 1", "Legion 2" — what the game calls one of an event's repeated slots.
function slotName(time: AllianceTime): string {
  if (!time.groupNumber) return '';
  const group = eventGroupName(time.eventTypeId);
  return group ? ' ' + group + ' ' + time.groupNumber : ' ' + time.groupNumber;
}

export interface StatePageOptions {
  stateNumber: string;
  alliances: Alliance[];
  schedules: Schedule[];
}

// One alliance's times as lines: the event's logo, its name and slot, and the hour.
function timeLines(times: AllianceTime[]): string {
  return '<div class="time-lines">' + times.map(time => {
    const minute = minutesFromTime(time.startTimeUtc);
    return '<div class="time-line">' +
      `<span class="time-line-icon">${eventIcon(time.eventTypeId)}</span>` +
      `<span class="time-line-name">${escapeForPage(eventTypeName(time.eventTypeId) + slotName(time))}</span>` +
      `<span class="time-line-hour">${escapeForPage(time.startTimeUtc ? clockText(minute) : '—')}</span></div>`;
  }).join('') + '</div>';
}

function part(title: string, body: string): string {
  return `<section class="work-section"><div class="work-head"><h2>${escapeForPage(title)}</h2></div>${body}</section>`;
}

// The state's parts, for the State page; the page puts the SvS history after them.
export function statePage(options: StatePageOptions): string {
  const mains = options.alliances
    .filter(alliance => !alliance.mainAllianceId)
    .sort((left, right) => left.sortOrder - right.sortOrder);

  if (!mains.length) {
    return part('State ' + options.stateNumber, '<p class="work-empty">No alliances yet.</p>');
  }

  const blocks = mains.map(main => {
    const academies = options.alliances
      .filter(alliance => alliance.mainAllianceId === main.id)
      .sort((left, right) => left.sortOrder - right.sortOrder);
    // The main alliance's name is already the part's title, so only an academy names
    // itself again.
    const ownTimes = timesOf(main.id, options.schedules);
    const academyTimes = academies.map(academy => {
      const times = timesOf(academy.id, options.schedules);
      return times.length
        ? `<h3 class="time-lines-name">${escapeForPage(academy.tag + ' · ' + academy.name)}</h3>${timeLines(times)}` : '';
    }).join('');
    return part(main.tag + ' · ' + main.name,
      (ownTimes.length ? timeLines(ownTimes) : '') + academyTimes ||
        '<p class="work-empty">This alliance has no times of its own yet.</p>');
  }).join('');

  return part('State ' + options.stateNumber,
    `<p class="work-line">${mains.length} alliance${mains.length === 1 ? '' : 's'}, ` +
    `${options.alliances.length - mains.length} academ${options.alliances.length - mains.length === 1 ? 'y' : 'ies'}. ` +
    'Times are the ones each alliance runs its own events at.</p>') +
    `<div class="alliance-parts">${blocks}</div>`;
}

// One alliance's times on their own, for the My alliance page.
export function allianceTimesPage(alliance: Alliance | undefined, schedules: Schedule[]): string {
  if (!alliance) {
    return '<div class="work-page">' + part('My alliance', '<p class="work-empty">Pick your alliance to see its times.</p>') + '</div>';
  }
  const times = timesOf(alliance.id, schedules);
  return '<div class="work-page">' + part(alliance.tag + ' · ' + alliance.name,
    times.length ? timeLines(times) : '<p class="work-empty">This alliance has no times of its own yet.</p>') + '</div>';
}
