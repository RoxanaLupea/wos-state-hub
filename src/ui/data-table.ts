// The working pages' parts, drawn as notes/page-style.md says: a part with its title in
// small spaced capitals and its actions on the same line, a table of rows, and a form
// that opens in place. They carry the information until each page is designed.
import './data-table.css';
import { escapeForPage } from './escape.ts';
import type { Row } from '../data/records.ts';

export interface Column<T = Row> {
  label: string;
  // The cell's contents, already safe to put on the page.
  cell: (row: T) => string;
  isNumber?: boolean;
  // Written text (a note, a reason) that wraps, where every other cell stays on one line.
  isLong?: boolean;
}

// A part of a working page: its title, anything after the title on the same line, and
// its body. No box: parts are kept apart by space.
export function workSection(title: string, body: string, beside = ''): string {
  return '<section class="work-section">' +
    `<div class="work-head"><h2>${escapeForPage(title)}</h2>${beside}</div>${body}</section>`;
}

// A row being changed gets its form on a line of its own under it, across the whole
// width, rather than squeezed into a cell.
export function dataTable<T = Row>(columns: Column<T>[], rows: T[], emptyText: string,
  editRow?: (row: T) => string): string {
  if (!rows.length) return `<p class="work-empty">${escapeForPage(emptyText)}</p>`;
  return '<div class="table-scroll"><table class="data-table"><thead><tr>' +
    columns.map(column => `<th${column.isNumber ? ' class="number"' : ''}>${escapeForPage(column.label)}</th>`).join('') +
    '</tr></thead><tbody>' +
    rows.map(row => {
      const form = editRow ? editRow(row) : '';
      return `<tr${form ? ' class="editing"' : ''}>` + columns.map(column =>
        `<td${column.isNumber ? ' class="number"' : column.isLong ? ' class="long"' : ''}>${column.cell(row)}</td>`).join('') + '</tr>' +
        (form ? `<tr class="edit-row"><td colspan="${columns.length}"><div class="edit-row-form">${form}</div></td></tr>` : '');
    }).join('') +
    '</tbody></table></div>';
}

// A cell's plain text, or a dash when there is nothing.
export function text(value: unknown): string {
  return value === null || value === undefined || value === '' ? '—' : escapeForPage(String(value));
}

// ---------------------------------------------------------------------------
// Icons. A line icon runs from its tint into white, as on the player page; a small
// icon on a row's action is drawn in the page's colour with a soft glow.
// ---------------------------------------------------------------------------

function lineIcon(id: string, path: string): string {
  return `<svg class="line-icon" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" style="stop-color: var(--word-tint)"/><stop offset="1" style="stop-color: var(--text)"/></linearGradient></defs>` +
    `<path d="${path}" fill="none" stroke="url(#${id})" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
const CROSS = 'M6 6l12 12M18 6L6 18';
const TICK = 'M4.5 12.5l5 5L19.5 6.5';
const CANCEL_ICON = lineIcon('work-cancel-colour', CROSS);
const SAVE_ICON = lineIcon('work-save-colour', TICK);
const REMOVE_ICON = lineIcon('work-remove-colour', CROSS);

function smallIcon(paths: string): string {
  return '<svg class="row-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"' +
    ` stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
}
const ROW_ICONS: Record<string, string> = {
  change: smallIcon('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
  flag: smallIcon('<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>'),
  approve: smallIcon('<path d="M4.5 12.5l5 5L19.5 6.5"/>'),
  status: smallIcon('<path d="M4 12a8 8 0 1 0 2.3-5.7"/><path d="M4 4v4h4"/>')
};

// Cancel and Save, on the title line of what is being edited: a red cross and a green
// tick with their words. Save is the form's submit.
export function cancelWord(): string {
  return `<button type="button" class="quiet-word cancel" data-cancel-edit>${CANCEL_ICON}<span class="words">Cancel</span></button>`;
}
export function saveWord(label = 'Save'): string {
  return `<button type="submit" class="quiet-word confirm">${SAVE_ICON}<span class="words">${escapeForPage(label)}</span></button>`;
}

// A row's action as an icon and a word, no box. "Remove" and "Unlink" ask first: the
// first tap turns the words red, the second does it.
export function rowWord(attributes: string, label: string, icon: keyof typeof ROW_ICONS | 'remove', isAsking = false): string {
  if (icon === 'remove') {
    return `<button type="button" class="quiet-word remove${isAsking ? ' asking' : ''}" ${attributes}>${REMOVE_ICON}` +
      `<span class="words">${escapeForPage(isAsking ? 'Tap again to remove' : label)}</span></button>`;
  }
  return `<button type="button" class="row-word ${icon}" ${attributes} aria-label="${escapeForPage(label)}">` +
    `${ROW_ICONS[icon]}<span>${escapeForPage(label)}</span></button>`;
}

// A small button in a row: change it, or remove it (the first tap asks, the second removes).
export function rowButton(edit: string, label: string, isAsking = false): string {
  const attributes = `data-edit="${escapeForPage(edit)}"`;
  const icon = /^(remove|unlink)\|/.test(edit) ? 'remove' : /^flag\|/.test(edit) ? 'flag' : 'change';
  return rowWord(attributes, label, icon, isAsking);
}

// ---------------------------------------------------------------------------
// Fields
// ---------------------------------------------------------------------------

export interface Field {
  name: string;
  label: string;
  kind: 'text' | 'number' | 'date' | 'time' | 'select' | 'textarea' | 'checkbox' | 'hidden';
  value?: unknown;
  // For a select: [value, label] pairs.
  choices?: [string, string][];
  isRequired?: boolean;
  placeholder?: string;
  // A field that takes the whole line.
  isWide?: boolean;
}

// A pick among this many or fewer is shown as words; a longer list (people) is a glass
// field that opens the list.
const MOST_WORDS = 10;

// A choice with an empty value whose label asks to pick ("Pick an alliance") is a
// placeholder, not a choice, when the choices are shown as words.
function isPlaceholder([value, label]: [string, string]): boolean {
  return value === '' && /^Pick\b/.test(label);
}

export function formField(field: Field): string {
  const value = field.value === null || field.value === undefined ? '' : String(field.value);
  const required = field.isRequired ? ' required' : '';
  const placeholder = field.placeholder ? ` placeholder="${escapeForPage(field.placeholder)}"` : '';
  const name = escapeForPage(field.name);
  if (field.kind === 'hidden') {
    return `<input type="hidden" name="${name}" value="${escapeForPage(value)}">`;
  }
  // On and off: the switch from the calendar's filters, with its words beside it.
  if (field.kind === 'checkbox') {
    const isOn = Boolean(field.value);
    return '<div class="work-field switch-field">' +
      `<input type="hidden" name="${name}" value="${isOn ? 'on' : ''}">` +
      `<button type="button" class="filter-switch${isOn ? ' on' : ''}" data-switch aria-pressed="${isOn}"` +
      ` aria-label="${escapeForPage(field.label)}"></button>` +
      `<span class="switch-words">${escapeForPage(field.label)}</span></div>`;
  }
  const label = `<span class="work-field-name">${escapeForPage(field.label)}</span>`;
  if (field.kind === 'select') {
    const choices = field.choices ?? [];
    const words = choices.filter(one => !isPlaceholder(one));
    if (words.length <= MOST_WORDS) {
      // The picked one bold and lit, the others quiet. The value travels in a hidden
      // field; a required pick left empty is caught before saving.
      const picked = words.some(([choice]) => choice === value) ? value : '';
      return `<div class="work-field">${label}` +
        `<input type="hidden" name="${name}" value="${escapeForPage(picked)}"` +
        `${field.isRequired ? ` data-required="${escapeForPage(field.label)}"` : ''}>` +
        '<div class="pick-words" role="group">' + words.map(([choice, text]) =>
          `<button type="button" class="pick-word${choice === picked ? ' on' : ''}" data-pick="${escapeForPage(choice)}"` +
          ` aria-pressed="${choice === picked}">${escapeForPage(text)}</button>`).join('') + '</div></div>';
    }
    return `<label class="work-field">${label}<select class="text-input" name="${name}"${required}>` +
      choices.map(([choice, text]) =>
        `<option value="${escapeForPage(choice)}"${choice === value ? ' selected' : ''}>${escapeForPage(text)}</option>`).join('') +
      '</select></label>';
  }
  const isWide = field.isWide || field.kind === 'textarea';
  const input = field.kind === 'textarea'
    ? `<textarea class="text-input" name="${name}"${required}${placeholder}>${escapeForPage(value)}</textarea>`
    : `<input class="text-input" name="${name}" value="${escapeForPage(value)}"` +
      `${field.kind === 'number' ? ' inputmode="decimal"' : field.kind === 'date' ? ' type="date"' : ''}${required}${placeholder}>`;
  return `<label class="work-field${isWide ? ' wide' : ''}">${label}${input}</label>`;
}

// The line a form opens with: its title, then Cancel (when it can be closed) and Save.
export function formHead(title: string, submitLabel = 'Save', canCancel = true): string {
  return `<div class="form-head"><h3>${escapeForPage(title)}</h3>` +
    `<span class="form-actions">${canCancel ? cancelWord() : ''}${saveWord(submitLabel)}</span></div>`;
}

export interface RowFormOptions {
  // Which save it is: names the table and how the row is written (see main.ts).
  form: string;
  // The row's id when changing one; empty when adding.
  key?: string;
  title: string;
  fields: Field[];
  submitLabel?: string;
  // Shown as Cancel when the form was opened by a pencil.
  canCancel?: boolean;
}

export function rowForm(options: RowFormOptions): string {
  const switches = options.fields.filter(one => one.kind === 'checkbox');
  const others = options.fields.filter(one => one.kind !== 'checkbox');
  return `<form class="edit-form work-form" data-form="${escapeForPage(options.form)}" data-key="${escapeForPage(options.key ?? '')}">` +
    formHead(options.title, options.submitLabel ?? 'Save', Boolean(options.canCancel)) +
    `<div class="work-fields">${others.map(formField).join('')}</div>` +
    (switches.length ? `<div class="work-switches">${switches.map(formField).join('')}</div>` : '') +
    '<p class="form-message" data-form-message></p></form>';
}

// A row being changed: its form goes on the line under it, across the whole width, with
// no title of its own (the row above names it): Cancel and Save on its first line, as on
// a title line, then the fields. The row's own actions make way while it is open.
export function rowEditForm(options: RowFormOptions): string {
  return `<form class="edit-form work-form" data-form="${escapeForPage(options.form)}" data-key="${escapeForPage(options.key ?? '')}">` +
    `<div class="form-head"><span class="form-actions">${cancelWord()}${saveWord(options.submitLabel ?? 'Save')}</span></div>` +
    `<div class="work-fields">${options.fields.map(formField).join('')}</div>` +
    '<p class="form-message" data-form-message></p></form>';
}

// A part that is only a form: the form is the part, its title is the part's title,
// with Cancel and Save on the same line.
export function formSection(options: RowFormOptions): string {
  const switches = options.fields.filter(one => one.kind === 'checkbox');
  const others = options.fields.filter(one => one.kind !== 'checkbox');
  return `<form class="work-section work-form" data-form="${escapeForPage(options.form)}" data-key="${escapeForPage(options.key ?? '')}">` +
    `<div class="work-head"><h2>${escapeForPage(options.title)}</h2><span class="form-actions">` +
    `${options.canCancel ? cancelWord() : ''}${saveWord(options.submitLabel ?? 'Save')}</span></div>` +
    (others.length ? `<div class="work-fields">${others.map(formField).join('')}</div>` : '') +
    (switches.length ? `<div class="work-switches">${switches.map(formField).join('')}</div>` : '') +
    '<p class="form-message" data-form-message></p></form>';
}

// Choices above a table, such as how it is sorted: words, the picked one bold and lit.
export function choiceRow(name: string, choices: [string, string][], chosen: string): string {
  return '<div class="work-choices">' + choices.map(([value, label]) =>
    `<button type="button" class="work-choice${value === chosen ? ' on' : ''}" data-work-choice="${escapeForPage(name + '|' + value)}"` +
    ` aria-pressed="${value === chosen}">${escapeForPage(label)}</button>`).join('') + '</div>';
}
