// The alliance's plan for an event, set by its R4s and shown to its members under the
// timeline's first row (Roxanne, 27 Nov: "register to middle lane with this ratio ...
// shown underneath like all the time, not expandable"). It is added once and kept for
// every run of that event after, so the button reads Add note only the first time and
// Edit note from then on. It is a plan to follow, so it is a banner that stands out.
import { escapeForPage } from './escape.ts';
import { cancelWord, saveWord } from './data-table.ts';
import { ADD_ICON } from './invite-row.ts';
import { EDIT_ICON } from './edit-forms.ts';
import type { FirstRowPlan } from './event-panel.ts';
import './plan-note.css';

export const PLAN_NOTE_EVENTS = ['alliance-championship'];
const PLAN_FORM_ID = 'plan-note';


export interface PlanNoteOptions {
  eventTypeId: string;
  allianceId: string | null;
  note: string;
  // The alliance's R4s (and admins) set it.
  mayEdit: boolean;
  isEditing: boolean;
}

export function planNoteEdit(eventTypeId: string): string {
  return 'plan-note|' + eventTypeId;
}

function bannerText(note: string): string {
  return escapeForPage(note).replace(/\n/g, '<br>');
}

// The first row's button and banner, or nothing for an event without a plan, or when
// there is no plan and nobody here may add one.
export function planFirstRow(options: PlanNoteOptions): FirstRowPlan | undefined {
  if (!PLAN_NOTE_EVENTS.includes(options.eventTypeId) || !options.allianceId) return undefined;
  const note = options.note.trim();
  if (options.isEditing && options.mayEdit) {
    const save = saveWord('Save').replace('type="submit"', `type="submit" form="${PLAN_FORM_ID}"`);
    return {
      button: '',
      banner: `<form class="plan-banner editing" id="${PLAN_FORM_ID}" data-form="plan-note"` +
        ` data-key="${escapeForPage(options.eventTypeId + '|' + options.allianceId)}">` +
        `<textarea class="plan-field" name="note" rows="1" aria-label="Plan">${escapeForPage(note)}</textarea>` +
        '<p class="form-message" data-form-message></p></form>' +
        `<span class="plan-actions">${cancelWord()}${save}</span>`
    };
  }
  if (!note && !options.mayEdit) return undefined;
  const button = options.mayEdit
    ? `<button type="button" class="edit-button plan-button" data-edit="${escapeForPage(planNoteEdit(options.eventTypeId))}">` +
      `${note ? EDIT_ICON : ADD_ICON}<span><span class="words">${note ? 'Edit note' : 'Add note'}</span></span></button>`
    : '';
  return { button, banner: note ? `<span class="plan-banner">${bannerText(note)}</span>` : '' };
}
