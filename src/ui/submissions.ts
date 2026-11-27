// Results a member submits for an R4 of their alliance to approve (Roxanne, 27 Nov): kept
// as tickets. An R4 sees a red dot on their menu while any ticket is open; the menu's
// Submissions page lists them all, open and resolved, and each opens the event's Results
// with what was submitted, to fix, approve or reject. The member who submitted sees there
// how each one was resolved. A first version: "I don't really care how it looks. I need it
// to work."
import { escapeForPage } from './escape.ts';
import type { Row } from '../data/records.ts';
import { eventTypeName } from '../data/catalog.ts';
import { allianceTag } from '../data/alliances.ts';
import { longDayText } from './day-names.ts';
import { dayFromText } from '../calendar/days.ts';
import './submissions.css';

// The events whose results members can submit.
export const SUBMITTED_EVENTS = ['alliance-championship'];

// What was typed in a result's form, kept as its fields: each name with all its values.
export type SubmittedFields = Record<string, string[]>;

export function fieldsOfForm(values: FormData): SubmittedFields {
  const fields: SubmittedFields = {};
  values.forEach((value, name) => {
    if (typeof value !== 'string') return;
    (fields[name] ??= []).push(value);
  });
  return fields;
}

// The form's values again, for an R4 approving them.
export function formOfFields(fields: SubmittedFields): FormData {
  const values = new FormData();
  for (const [name, list] of Object.entries(fields)) for (const value of list) values.append(name, value);
  return values;
}

export function isOpen(row: Row): boolean {
  return row.status === 'open';
}

export interface SubmissionsPageOptions {
  rows: Row[] | null;
  userId: string;
  playerNameOf: (userId: string) => string;
  leads: (allianceId: string) => boolean;
}

function statusText(row: Row, nameOf: (userId: string) => string): string {
  if (row.status === 'open') return '<span class="sub-status open">Waiting for an R4</span>';
  const by = row.resolved_by ? nameOf(String(row.resolved_by)) : '';
  const word = row.status === 'approved' ? 'Approved' : 'Rejected';
  return `<span class="sub-status ${escapeForPage(String(row.status))}">${word}${by ? ' by ' + escapeForPage(by) : ''}</span>`;
}

// The Submissions page: every ticket this person may see, open ones first, newest first.
export function submissionsPage(options: SubmissionsPageOptions): string {
  if (!options.rows) return '<div class="work-page submissions"><p class="work-empty">Loading…</p></div>';
  const rows = options.rows.slice().sort((left, right) =>
    Number(isOpen(right)) - Number(isOpen(left)) || String(right.submitted_at).localeCompare(String(left.submitted_at)));
  const items = rows.map(row => {
    const reviews = isOpen(row) && options.leads(String(row.alliance_id));
    const event = `${eventTypeName(String(row.event_type_id))} of ${longDayText(dayFromText(String(row.event_date)))}`;
    return `<button type="button" class="sub-item${isOpen(row) ? ' open' : ''}" data-open-submission="${escapeForPage(String(row.id))}">` +
      `<span class="sub-event">${reviews ? '<i class="sub-dot" aria-label="To review"></i>' : ''}${escapeForPage(event)}</span>` +
      `<span class="sub-who">${escapeForPage(allianceTag(String(row.alliance_id)))} · Submitted by ` +
      `${escapeForPage(options.playerNameOf(String(row.submitted_by)) || 'a member')}</span>` +
      statusText(row, options.playerNameOf) + '</button>';
  }).join('');
  return '<div class="work-page submissions"><section class="work-section"><div class="work-head"><h2>Submissions</h2></div>' +
    (items ? `<div class="sub-list">${items}</div>` : '<p class="work-empty">Nothing has been submitted yet.</p>') +
    '</section></div>';
}

// Whether the menu shows a red dot: for an R4, a ticket of their alliance still open; for
// the one who submitted, a ticket of theirs resolved since they last looked.
export function hasSubmissionsDot(rows: Row[] | null, userId: string, leads: (allianceId: string) => boolean, seenUntil: string): boolean {
  if (!rows) return false;
  return rows.some(row => (isOpen(row) && leads(String(row.alliance_id))) ||
    (!isOpen(row) && row.submitted_by === userId && String(row.resolved_at ?? '') > seenUntil));
}
