// The state at a glance: its alliances with their academies, and the event times each
// one runs. A presentation page rather than a working one.
import './pages.css';
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

export function statePage(options: StatePageOptions): string {
  const mains = options.alliances
    .filter(alliance => !alliance.mainAllianceId)
    .sort((left, right) => left.sortOrder - right.sortOrder);

  if (!mains.length) {
    return '<section class="admin-section glass"><h2>State ' + escapeForPage(options.stateNumber) +
      '</h2><p class="admin-help">No alliances yet.</p></section>';
  }

  const blocks = mains.map(main => {
    const academies = options.alliances
      .filter(alliance => alliance.mainAllianceId === main.id)
      .sort((left, right) => left.sortOrder - right.sortOrder);

    const timesOfOne = (alliance: Alliance, isAcademy: boolean) => {
      const times = timesOf(alliance.id, options.schedules);
      if (!times.length) return '';
      const rows = times.map(time => {
        const minute = minutesFromTime(time.startTimeUtc);
        return '<span class="small-row">' +
          `<span class="small-row-dot" style="background:${escapeForPage(alliance.baseColor ?? '#6F9BE6')}"></span>` +
          `<span class="small-row-text">${escapeForPage(eventTypeName(time.eventTypeId) + slotName(time))}</span>` +
          `<span>${escapeForPage(time.startTimeUtc ? clockText(minute) : '—')}</span></span>`;
      }).join('');
      // The main alliance's name is already the section's heading, so only an
      // academy names itself again.
      return `<div class="alliance-block${isAcademy ? ' academy' : ''}">` +
        (isAcademy
          ? `<span class="alliance-name">${escapeForPage(alliance.tag + ' · ' + alliance.name)}</span>` : '') +
        `${rows}</div>`;
    };

    return '<section class="admin-section glass">' +
      `<h2>${escapeForPage(main.tag + ' · ' + main.name)}</h2>` +
      timesOfOne(main, false) +
      academies.map(academy => timesOfOne(academy, true)).join('') +
      '</section>';
  }).join('');

  return `<section class="admin-section glass"><h2>State ${escapeForPage(options.stateNumber)}</h2>` +
    `<p class="admin-help">${mains.length} alliance${mains.length === 1 ? '' : 's'}, ` +
    `${options.alliances.length - mains.length} academ${options.alliances.length - mains.length === 1 ? 'y' : 'ies'}. ` +
    'Times are the ones each alliance runs its own events at.</p></section>' + blocks;
}

// One alliance's times on their own, for the My alliance page.
export function allianceTimesPage(alliance: Alliance | undefined, schedules: Schedule[]): string {
  if (!alliance) {
    return '<section class="admin-section glass"><h2>My alliance</h2>' +
      '<p class="admin-help">Pick your alliance to see its times.</p></section>';
  }
  const times = timesOf(alliance.id, schedules);
  const rows = times.map(time => {
    const minute = minutesFromTime(time.startTimeUtc);
    return '<div class="event-row"><span class="event-row-left">' +
      `<span class="event-badge list">${eventIcon(time.eventTypeId)}</span>` +
      `<span class="event-title">${escapeForPage(eventTypeName(time.eventTypeId) + slotName(time))}</span>` +
      '</span>' +
      `<span class="time-value">${escapeForPage(time.startTimeUtc ? clockText(minute) : '—')}</span></div>`;
  }).join('');

  return '<section class="admin-section glass">' +
    `<h2>${escapeForPage(alliance.tag + ' · ' + alliance.name)}</h2>` +
    (rows || '<p class="admin-help">This alliance has no times of its own yet.</p>') +
    '</section>';
}
