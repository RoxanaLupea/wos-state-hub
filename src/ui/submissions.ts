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
import { personChip, type PersonShown } from './person-chip.ts';

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
  // An R4 (or admin) sees the tickets as New; a member sees theirs as Pending.
  isReviewer: boolean;
  // The phone's sections the player closed (open ones are New or Pending at first).
  closedSections: Set<string>;
  userId: string;
  playerOf: (userId: string) => PersonShown;
  leads: (allianceId: string) => boolean;
}

function statusText(row: Row, playerOf: (userId: string) => PersonShown): string {
  if (row.status === 'open') return '<span class="sub-status open">Waiting for an R4</span>';
  const word = row.status === 'approved' ? 'Approved by' : 'Rejected by';
  return `<span class="sub-status ${escapeForPage(String(row.status))}">${word}` +
    (row.resolved_by ? personChip(playerOf(String(row.resolved_by))) : '') + '</span>';
}

// One ticket: the event and its date, the alliance, who submitted it, and how it was
// resolved. Each opens the event's Results on that date.
function ticket(row: Row, options: SubmissionsPageOptions, withStatus: boolean): string {
  const reviews = isOpen(row) && options.leads(String(row.alliance_id));
  const event = `${eventTypeName(String(row.event_type_id))} of ${longDayText(dayFromText(String(row.event_date)))}`;
  return `<button type="button" class="sub-item${isOpen(row) ? ' open' : ''}" data-open-submission="${escapeForPage(String(row.id))}">` +
    `<span class="sub-event">${reviews ? '<i class="sub-dot" aria-label="To review"></i>' : ''}${escapeForPage(event)}</span>` +
    `<span class="sub-who">${escapeForPage(allianceTag(String(row.alliance_id)))} · Submitted by ` +
    `${personChip(options.playerOf(String(row.submitted_by)))}</span>` +
    (withStatus || !isOpen(row) ? statusText(row, options.playerOf) : '') + '</button>';
}

// The Submissions page (Roxanne, 27 Nov): three columns like Jira on a computer, three
// sections that open and close on a phone. New, Approved and Rejected for an R4; Pending,
// Approved and Rejected for a member. Newest first in each.
export function submissionsPage(options: SubmissionsPageOptions): string {
  if (!options.rows) return '<div class="work-page submissions"><p class="work-empty">Loading…</p></div>';
  const newestFirst = (left: Row, right: Row) => String(right.submitted_at).localeCompare(String(left.submitted_at));
  const columns: [string, string][] = [['open', options.isReviewer ? 'New' : 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected']];
  const board = columns.map(([status, title]) => {
    const tickets = options.rows!.filter(row => row.status === status).sort(newestFirst).map(row => ticket(row, options, false)).join('');
    const closed = options.closedSections.has(status);
    return `<section class="sub-column ${status}${closed ? ' closed' : ''}">` +
      `<button type="button" class="sub-column-title" data-sub-section="${status}" aria-expanded="${!closed}">${title}` +
      `<span class="sub-chevron" aria-hidden="true"></span></button>` +
      `<div class="sub-column-list">${tickets || '<p class="sub-empty">None</p>'}</div></section>`;
  }).join('');
  return '<div class="work-page submissions"><section class="work-section"><div class="work-head"><h2>Submissions</h2></div>' +
    `<div class="sub-board">${board}</div></section></div>`;
}

// Whether the menu shows a red dot: for an R4, a ticket of their alliance still open; for
// the one who submitted, a ticket of theirs resolved since they last looked.
export function hasSubmissionsDot(rows: Row[] | null, userId: string, leads: (allianceId: string) => boolean, seenUntil: string): boolean {
  if (!rows) return false;
  return rows.some(row => (isOpen(row) && leads(String(row.alliance_id))) ||
    (!isOpen(row) && row.submitted_by === userId && String(row.resolved_at ?? '') > seenUntil));
}
