// The forms that open in place when a pencil is tapped: an event's dates and repeat,
// one date's change, an alliance's own time, and a fort's holder and battle time. Each
// is filled with what is there now; Save writes it, Cancel closes it.
import './forms.css';
import { escapeForPage } from './escape.ts';
import type { Schedule, DateChange } from '../calendar/occurrences.ts';
import type { Alliance } from '../data/alliances.ts';

const PENCIL_ICON = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
  ' stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';

// A pencil that opens the form named by `edit`.
export function pencilButton(edit: string, label: string): string {
  return `<button type="button" class="pencil-button" data-edit="${escapeForPage(edit)}"` +
    ` aria-label="${escapeForPage(label)}" title="${escapeForPage(label)}">${PENCIL_ICON}</button>`;
}

function field(label: string, name: string, value: string, extra = ''): string {
  return `<label class="form-field"><span>${escapeForPage(label)}</span>` +
    `<input class="text-input" name="${name}" value="${escapeForPage(value)}"${extra}></label>`;
}

function formEnd(): string {
  return '<p class="form-message" data-form-message></p>' +
    '<div class="form-actions"><button type="button" class="ghost-button small-button" data-cancel-edit>Cancel</button>' +
    '<button type="submit" class="primary-button small-button">Save</button></div></form>';
}

// The owner's form for an event's dates: its first date, how often it repeats, how
// long it lasts and its times. Moving the first date moves every date after it.
export function scheduleForm(schedule: Schedule): string {
  return `<form class="edit-form" data-form="edit-schedule" data-key="${escapeForPage(schedule.id)}">` +
    '<h3>Every date of this event</h3>' +
    '<div class="form-row">' +
    field('First date', 'firstDate', schedule.firstDate, ' type="date" required') +
    field('Repeats every (days)', 'repeatEveryDays', schedule.repeatEveryDays ? String(schedule.repeatEveryDays) : '', ' inputmode="numeric"') +
    '</div><div class="form-row">' +
    field('Length (days)', 'lengthDays', schedule.lengthDays ? String(schedule.lengthDays) : '', ' inputmode="numeric"') +
    field('Starts at (UTC)', 'startTimeUtc', schedule.startTimeUtc ?? '', ' placeholder="00:00"') +
    '</div><div class="form-row">' +
    field('Ends at (UTC)', 'endTimeUtc', schedule.endTimeUtc ?? '', ' placeholder="none"') +
    '<span></span></div>' +
    `<label class="check-option"><input type="checkbox" name="datesAreEstimated"${schedule.datesAreEstimated ? ' checked' : ''}>` +
    ' The dates are an estimate until confirmed</label>' +
    formEnd();
}

// An alliance's own time for an event where the alliance picks it (Bear, Crazy Joe,
// Foundry, Canyon, Mercenary bosses).
export function allianceTimeForm(schedule: Schedule, title: string): string {
  return `<form class="edit-form" data-form="edit-alliance-time" data-key="${escapeForPage(schedule.id)}">` +
    `<h3>${escapeForPage(title)}</h3><div class="form-row">` +
    field('Starts at (UTC)', 'startTimeUtc', schedule.startTimeUtc ?? '', ' placeholder="00:00" required') +
    field('Ends at (UTC)', 'endTimeUtc', schedule.endTimeUtc ?? '', ' placeholder="none"') +
    '</div>' + formEnd();
}

// One date of an event that differs from the pattern: moved, other times, confirmed,
// or a note for that date.
export function dateChangeForm(
  scheduleId: string, originalDate: string, change: DateChange | undefined, isEstimated: boolean
): string {
  return `<form class="edit-form" data-form="edit-date" data-key="${escapeForPage(scheduleId + '|' + originalDate)}">` +
    '<h3>This date only</h3>' +
    '<div class="form-row">' +
    field('Moved to', 'movedToDate', change?.movedToDate ?? '', ' type="date"') +
    field('Starts at (UTC)', 'startTimeUtc', change?.startTimeUtc ?? '', ' placeholder="as usual"') +
    '</div><div class="form-row">' +
    field('Ends at (UTC)', 'endTimeUtc', change?.endTimeUtc ?? '', ' placeholder="as usual"') +
    '<span></span></div>' +
    (isEstimated
      ? `<label class="check-option"><input type="checkbox" name="isConfirmed"${change?.confirmedDate ? ' checked' : ''}>` +
        ' This date is confirmed in game</label>'
      : '') +
    '<label class="form-field"><span>Note for this date</span>' +
    `<textarea class="text-input" name="note">${escapeForPage(change?.note ?? '')}</textarea></label>` +
    formEnd();
}

// Who holds a fort in a phase, and when its battle starts on the battle day.
export function fortForm(
  key: string, title: string, alliances: Alliance[], allianceId: string, battleTime: string | null
): string {
  const options = alliances
    .slice().sort((left, right) => left.sortOrder - right.sortOrder)
    .map(one => `<option value="${escapeForPage(one.id)}"${one.id === allianceId ? ' selected' : ''}>` +
      `${escapeForPage(one.tag)}</option>`).join('');
  return `<form class="edit-form" data-form="edit-fort" data-key="${escapeForPage(key)}">` +
    `<h3>${escapeForPage(title)}</h3><div class="form-row">` +
    `<label class="form-field"><span>Held by</span><select class="text-input" name="allianceId" required>` +
    `<option value="">Pick an alliance</option>${options}</select></label>` +
    field('Battle at (UTC)', 'battleTime', battleTime ?? '', ' placeholder="not set"') +
    '</div>' + formEnd();
}
