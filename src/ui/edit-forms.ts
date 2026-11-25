// The forms that open in place when a pencil is tapped: an event's dates and repeat,
// one date's change, an alliance's own time, and a fort's holder and battle time. Each
// is filled with what is there now; Save writes it, Cancel closes it.
import './forms.css';
import { escapeForPage } from './escape.ts';
import type { Schedule, DateChange } from '../calendar/occurrences.ts';
import type { Alliance } from '../data/alliances.ts';
import { formField, formHead } from './data-table.ts';

export const PENCIL_ICON = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
  ' stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';

// The edit icon (owner's example, 24 Nov): a rounded square open at the top right with a
// pencil across it, in one stroke that runs from a colour into white.
export const EDIT_ICON = '<svg class="edit-icon" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="edit-icon-colour" x1="0" y1="0" x2="1" y2="1">' +
  '<stop offset="0" style="stop-color: var(--edit-colour)"/><stop offset="1" style="stop-color: var(--text)"/></linearGradient></defs>' +
  '<g fill="none" stroke="url(#edit-icon-colour)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
  '<path d="M11 3.5H7A3.5 3.5 0 0 0 3.5 7v10A3.5 3.5 0 0 0 7 20.5h10a3.5 3.5 0 0 0 3.5-3.5v-4.5"/>' +
  '<path d="M17.6 3.2a2.3 2.3 0 0 1 3.2 3.2L12 15.2l-4.2 1 1-4.2z"/></g></svg>';

// The pin in front of the row an event is at (owner, 25 Nov): drawn like the edit icon,
// one stroke from the event's colour into white. Its tip stands on the text's baseline.
export const PIN_ICON = '<svg class="pin-icon" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="pin-icon-colour" x1="0" y1="0" x2="1" y2="1">' +
  '<stop offset="0" style="stop-color: var(--event-color)"/><stop offset="1" style="stop-color: var(--text)"/></linearGradient></defs>' +
  '<g fill="none" stroke="url(#pin-icon-colour)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
  '<path d="M12 21.6c-.6-.5-7-6.3-7-11.6a7 7 0 0 1 14 0c0 5.3-6.4 11.1-7 11.6z"/><circle cx="12" cy="10" r="2.8"/></g></svg>';

// The edit button, as on the profile's "Update skill level": the edit icon, then the word.
// It swaps what everyone sees to editing in place; Cancel and Save take its place there.
export function editButton(edit: string, words = 'Edit'): string {
  return `<button type="button" class="edit-button" data-edit="${escapeForPage(edit)}">${EDIT_ICON}` +
    `<span><span class="words">${escapeForPage(words)}</span></span></button>`;
}

// A pencil that opens the form named by `edit`.
export function pencilButton(edit: string, label: string): string {
  return `<button type="button" class="pencil-button" data-edit="${escapeForPage(edit)}"` +
    ` aria-label="${escapeForPage(label)}" title="${escapeForPage(label)}">${PENCIL_ICON}</button>`;
}

function field(label: string, name: string, value: string, extra = ''): string {
  return `<label class="work-field"><span class="work-field-name">${escapeForPage(label)}</span>` +
    `<input class="text-input" name="${name}" value="${escapeForPage(value)}"${extra}></label>`;
}

function formEnd(): string {
  return '<p class="form-message" data-form-message></p></form>';
}

// The owner's form for an event's dates: its first date, how often it repeats, how
// long it lasts and its times. Moving the first date moves every date after it.
export function scheduleForm(schedule: Schedule): string {
  return `<form class="edit-form work-form" data-form="edit-schedule" data-key="${escapeForPage(schedule.id)}">` +
    formHead('Every date of this event') +
    '<div class="form-row">' +
    field('First date', 'firstDate', schedule.firstDate, ' type="date" required') +
    field('Repeats every (days)', 'repeatEveryDays', schedule.repeatEveryDays ? String(schedule.repeatEveryDays) : '', ' inputmode="numeric"') +
    '</div><div class="form-row">' +
    field('Length (days)', 'lengthDays', schedule.lengthDays ? String(schedule.lengthDays) : '', ' inputmode="numeric"') +
    field('Starts at (UTC)', 'startTimeUtc', schedule.startTimeUtc ?? '', ' placeholder="00:00"') +
    '</div><div class="form-row">' +
    field('Ends at (UTC)', 'endTimeUtc', schedule.endTimeUtc ?? '', ' placeholder="none"') +
    '<span></span></div>' +
    formField({ name: 'datesAreEstimated', label: 'The dates are an estimate until confirmed', kind: 'checkbox',
      value: schedule.datesAreEstimated }) +
    formEnd();
}

// An alliance's own time for an event where the alliance picks it (Bear, Crazy Joe,
// Foundry, Canyon, Mercenary bosses).
export function allianceTimeForm(schedule: Schedule, title: string): string {
  return `<form class="edit-form work-form" data-form="edit-alliance-time" data-key="${escapeForPage(schedule.id)}">` +
    formHead(title) + '<div class="form-row">' +
    field('Starts at (UTC)', 'startTimeUtc', schedule.startTimeUtc ?? '', ' placeholder="00:00" required') +
    field('Ends at (UTC)', 'endTimeUtc', schedule.endTimeUtc ?? '', ' placeholder="none"') +
    '</div>' + formEnd();
}

// One date of an event that differs from the pattern: moved, other times, confirmed,
// or a note for that date.
export function dateChangeForm(
  scheduleId: string, originalDate: string, change: DateChange | undefined, isEstimated: boolean
): string {
  return `<form class="edit-form work-form" data-form="edit-date" data-key="${escapeForPage(scheduleId + '|' + originalDate)}">` +
    formHead('This date only') +
    '<div class="form-row">' +
    field('Moved to', 'movedToDate', change?.movedToDate ?? '', ' type="date"') +
    field('Starts at (UTC)', 'startTimeUtc', change?.startTimeUtc ?? '', ' placeholder="as usual"') +
    '</div><div class="form-row">' +
    field('Ends at (UTC)', 'endTimeUtc', change?.endTimeUtc ?? '', ' placeholder="as usual"') +
    '<span></span></div>' +
    (isEstimated
      ? formField({ name: 'isConfirmed', label: 'This date is confirmed in game', kind: 'checkbox', value: Boolean(change?.confirmedDate) })
      : '') +
    formField({ name: 'note', label: 'Note for this date', kind: 'textarea', value: change?.note ?? '' }) +
    formEnd();
}

// Who holds a fort in a phase, and when its battle starts on the battle day.
export function fortForm(
  key: string, title: string, alliances: Alliance[], allianceId: string, battleTime: string | null,
  creditedTo: string
): string {
  const sorted = alliances.slice().sort((left, right) => left.sortOrder - right.sortOrder);
  // A fort can be taken for someone else: its reward then counts for that alliance, or
  // for the whole state. Left as it is, it counts for the holder.
  const creditChoices: [string, string][] = [['', 'The holder'], ['shared', 'The whole state'],
    ...sorted.filter(one => !one.mainAllianceId).map(one => [one.id, one.tag] as [string, string])];
  return `<form class="edit-form work-form" data-form="edit-fort" data-key="${escapeForPage(key)}">` +
    formHead(title) + '<div class="work-fields">' +
    formField({ name: 'allianceId', label: 'Held by', kind: 'select', value: allianceId, isRequired: true,
      choices: [['', 'Pick an alliance'], ...sorted.map(one => [one.id, one.tag] as [string, string])] }) +
    formField({ name: 'creditedTo', label: 'Reward counts for', kind: 'select', value: creditedTo, choices: creditChoices }) +
    field('Battle at (UTC)', 'battleTime', battleTime ?? '', ' placeholder="not set"') +
    '</div>' + formEnd();
}
