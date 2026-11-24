// The working pages' parts: a glass section with a title, a table of rows, and a form
// that writes one row. They carry the information until each page is designed.
import './data-table.css';
import { escapeForPage } from './escape.ts';
import type { Row } from '../data/records.ts';

export interface Column<T = Row> {
  label: string;
  // The cell's contents, already safe to put on the page.
  cell: (row: T) => string;
  isNumber?: boolean;
}

// A section of a working page: its title, anything beside the title, and its body.
export function workSection(title: string, body: string, beside = ''): string {
  return '<section class="work-section glass">' +
    `<div class="work-head"><h2>${escapeForPage(title)}</h2>${beside}</div>${body}</section>`;
}

export function dataTable<T = Row>(columns: Column<T>[], rows: T[], emptyText: string): string {
  if (!rows.length) return `<p class="work-empty">${escapeForPage(emptyText)}</p>`;
  return '<div class="table-scroll"><table class="data-table"><thead><tr>' +
    columns.map(column => `<th${column.isNumber ? ' class="number"' : ''}>${escapeForPage(column.label)}</th>`).join('') +
    '</tr></thead><tbody>' +
    rows.map(row => '<tr>' + columns.map(column =>
      `<td${column.isNumber ? ' class="number"' : ''}>${column.cell(row)}</td>`).join('') + '</tr>').join('') +
    '</tbody></table></div>';
}

// A cell's plain text, or a dash when there is nothing.
export function text(value: unknown): string {
  return value === null || value === undefined || value === '' ? '—' : escapeForPage(String(value));
}

export interface Field {
  name: string;
  label: string;
  kind: 'text' | 'number' | 'date' | 'time' | 'select' | 'textarea' | 'checkbox' | 'hidden';
  value?: unknown;
  // For a select: [value, label] pairs.
  choices?: [string, string][];
  isRequired?: boolean;
  placeholder?: string;
}

function fieldHtml(field: Field): string {
  const value = field.value === null || field.value === undefined ? '' : String(field.value);
  const required = field.isRequired ? ' required' : '';
  const placeholder = field.placeholder ? ` placeholder="${escapeForPage(field.placeholder)}"` : '';
  if (field.kind === 'hidden') {
    return `<input type="hidden" name="${field.name}" value="${escapeForPage(value)}">`;
  }
  if (field.kind === 'checkbox') {
    return `<label class="check-option"><input type="checkbox" name="${field.name}"${field.value ? ' checked' : ''}>` +
      ` ${escapeForPage(field.label)}</label>`;
  }
  const input = field.kind === 'select'
    ? `<select class="text-input" name="${field.name}"${required}>` +
      (field.choices ?? []).map(([choice, label]) =>
        `<option value="${escapeForPage(choice)}"${choice === value ? ' selected' : ''}>${escapeForPage(label)}</option>`).join('') +
      '</select>'
    : field.kind === 'textarea'
      ? `<textarea class="text-input" name="${field.name}"${required}${placeholder}>${escapeForPage(value)}</textarea>`
      : `<input class="text-input" name="${field.name}" value="${escapeForPage(value)}"` +
        `${field.kind === 'number' ? ' inputmode="decimal"' : field.kind === 'date' ? ' type="date"' : ''}${required}${placeholder}>`;
  return `<label class="form-field${field.kind === 'textarea' ? ' wide' : ''}"><span>${escapeForPage(field.label)}</span>${input}</label>`;
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
  return `<form class="edit-form work-form" data-form="${escapeForPage(options.form)}" data-key="${escapeForPage(options.key ?? '')}">` +
    `<h3>${escapeForPage(options.title)}</h3><div class="work-fields">` +
    options.fields.map(fieldHtml).join('') + '</div>' +
    '<p class="form-message" data-form-message></p><div class="form-actions">' +
    (options.canCancel ? '<button type="button" class="ghost-button small-button" data-cancel-edit>Cancel</button>' : '') +
    `<button type="submit" class="primary-button small-button">${escapeForPage(options.submitLabel ?? 'Save')}</button></div></form>`;
}

// A small button in a row: change it, or remove it (the first tap asks, the second removes).
export function rowButton(edit: string, label: string, isAsking = false): string {
  return `<button type="button" class="row-action${isAsking ? ' asking' : ''}" data-edit="${escapeForPage(edit)}">` +
    `${escapeForPage(isAsking ? 'Tap again to remove' : label)}</button>`;
}

// Choices above a table, such as how it is sorted.
export function choiceRow(name: string, choices: [string, string][], chosen: string): string {
  return '<div class="work-choices">' + choices.map(([value, label]) =>
    `<button type="button" class="work-choice${value === chosen ? ' on' : ''}" data-work-choice="${escapeForPage(name + '|' + value)}">` +
    `${escapeForPage(label)}</button>`).join('') + '</div>';
}
