// The alliances' own times under an event's row (Foundry's and Canyon's Battle): one feature for
// every event with set times, drawn once here (Roxanne, 28 Nov: "it's one feature for all of them").
// Mockup: tools/render/mockups/foundry-battle-legions.py.
//
// Every member sees the times they follow: their own alliance's, unless they took one out, and any
// other alliance's they added. "Follow another legion" lists every alliance's times in time order with
// an eye after each name; Done closes it. R4s and admins get Edit after the row's name: a saved time
// keeps its name and only its time changes, a bin after the name asks in the site's pop-up, "Add
// legion" adds a row where the alliance and the legion are picked apart, then Cancel and Save.

import { escapeForPage } from './escape.ts';

export interface AllianceTimeEntry {
  scheduleId: string;
  allianceId: string;
  tag: string;
  group: number;
  // "14:00", in the time the page shows.
  timeText: string;
  // The saved time in UTC, "14:00", what the edit box starts with.
  timeUtc: string;
  isOurs: boolean;
  isShown: boolean;
}

export interface AllianceTimesDraft {
  times: Map<string, string>;
  removed: Set<string>;
  // New times being added, until Save.
  adding: { allianceId: string; group: number; time: string }[];
  asking: string | null;
}

export interface AllianceTimesRowsOptions {
  groupWord: string;
  groupCount: number;
  // Every alliance's times on this row's day, in time order.
  entries: AllianceTimeEntry[];
  mode: 'view' | 'choose' | 'edit';
  mayEdit: boolean;
  // The alliances this person may add or change times for (an R4's own alliance and academies;
  // every alliance for admins), in their order.
  editableAlliances: { id: string; tag: string }[];
  draft: AllianceTimesDraft;
}

const EYE = 'M2.5 12s3.4-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.4 6.5-9.5 6.5S2.5 12 2.5 12zM12 9.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6z';
const EYE_OFF = EYE + 'M4 4l16 16';
const CROSS = 'M6 6l12 12M18 6L6 18';
const BIN = 'M4 7h16M9.5 7V4.5h5V7M6.5 7l1 12.5h9l1-12.5M10.2 11v5M13.8 11v5';
const TICK = 'M4.5 12.5l5 5L19.5 6.5';

let iconCount = 0;
function lineIcon(path: string, width = 2.4): string {
  const id = 'times-icon-' + (iconCount++);
  return `<svg class="line-icon" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" style="stop-color: var(--word-tint)"/><stop offset="1" style="stop-color: var(--text)"/></linearGradient></defs>` +
    `<path d="${path}" fill="none" stroke="url(#${id})" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

// The clock with a plus: adding a time (Roxanne, 28 Nov: "Put the time thing").
const CLOCK_ADD = '<svg class="edit-icon" viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="times-add-colour" x1="0" y1="0" x2="1" y2="1">' +
  '<stop offset="0" style="stop-color: var(--event-color)"/><stop offset="1" style="stop-color: var(--text)"/></linearGradient></defs>' +
  '<g fill="none" stroke="url(#times-add-colour)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="14" cy="14" r="9.5"/>' +
  '<path d="M14 8.5V14l3.5 2.5"/></g><circle cx="24.5" cy="23.5" r="6" fill="var(--event-color)"/>' +
  '<path d="M24.5 20.5v6M21.5 23.5h6" stroke="#0B1222" stroke-width="2" stroke-linecap="round"/></svg>';

// Every alliance's times it may still add: each alliance has as many as the event allows
// (2 legions, 2 Bear traps; 1 for the Mercenaries), less those set.
export function freeSlots(options: AllianceTimesRowsOptions): { allianceId: string; group: number }[] {
  const taken = new Set(options.entries.filter(entry => !options.draft.removed.has(entry.scheduleId))
    .map(entry => entry.allianceId + '|' + entry.group)
    .concat(options.draft.adding.map(one => one.allianceId + '|' + one.group)));
  const free: { allianceId: string; group: number }[] = [];
  for (const alliance of options.editableAlliances) {
    for (let group = 1; group <= options.groupCount; group++) {
      if (!taken.has(alliance.id + '|' + group)) free.push({ allianceId: alliance.id, group });
    }
  }
  return free;
}

function nameOf(entry: { tag: string; group: number }, groupWord: string, faint = false): string {
  return `<span class="times-name${faint ? ' faint' : ''}"><b>${escapeForPage(entry.tag)}</b> · ${escapeForPage(groupWord)} ${entry.group}</span>`;
}

// The Edit button that goes after the row's name, for those who may edit (not while editing).
export function allianceTimesHead(options: AllianceTimesRowsOptions, editIcon: string): string {
  if (!options.mayEdit || options.mode === 'edit') return '';
  return `<button type="button" class="edit-button times-edit" data-times="edit">${editIcon}<span><span class="words">Edit</span></span></button>`;
}

// Whether there is anything to draw under the row.
export function hasAllianceTimesRows(options: AllianceTimesRowsOptions): boolean {
  return options.entries.length > 0 || options.mode === 'edit';
}

// The rows under the event's row. line and dot are the timeline's own colours at that row.
export function allianceTimesRows(options: AllianceTimesRowsOptions, line: string, dot: string): string {
  const lineStyle = `--line-above:${line};--line-below:${line}`;
  const solid = `background:${dot}`;
  const hollow = `background:transparent;box-shadow:inset 0 0 0 1.5px ${dot}`;
  const row = (when: string, dotStyle: string | null, inner: string) =>
    `<div class="tree-row nested times-row"><span class="tree-when">${when}</span>` +
    `<span class="tree-line" style="${lineStyle}">${dotStyle === null ? '' : `<span class="tree-step-dot" style="${dotStyle}"></span>`}</span>` +
    `<span class="tree-label">${inner}</span><span></span></div>`;
  const word = (cls: string, tint: string, path: string, words: string, data: string, disabled = false) =>
    `<button type="button" class="quiet-word ${cls}" style="--word-tint: ${tint}" data-times="${data}"${disabled ? ' disabled' : ''}>` +
    `${lineIcon(path)}<span class="words">${escapeForPage(words)}</span></button>`;
  const { draft, groupWord } = options;

  if (options.mode === 'edit') {
    const editable = new Set(options.editableAlliances.map(one => one.id));
    let html = '';
    for (const entry of options.entries) {
      if (!editable.has(entry.allianceId) || draft.removed.has(entry.scheduleId)) continue;
      const time = draft.times.get(entry.scheduleId) ?? entry.timeUtc;
      const bin = `<button type="button" class="quiet-word remove times-remove" style="--word-tint: var(--notice-red)"` +
        ` data-times="remove|${escapeForPage(entry.scheduleId)}" aria-label="Remove ${escapeForPage(entry.tag)} · ${escapeForPage(groupWord)} ${entry.group}">` +
        `${lineIcon(BIN)}</button>`;
      html += row(`<input class="svs-field times-box" inputmode="numeric" maxlength="5" placeholder="--:--" value="${escapeForPage(time)}"` +
        ` data-times-box="${escapeForPage(entry.scheduleId)}" aria-label="${escapeForPage(entry.tag)} · ${escapeForPage(groupWord)} ${entry.group}, time in UTC">`,
        solid, `<span class="times-line">${nameOf(entry, groupWord)}${bin}</span>`);
    }
    draft.adding.forEach((adding, index) => {
      // Only what can be saved (Roxanne, 28 Nov: "let's not offer options we cannot save"): an
      // alliance with all its times set is not offered, and of the picked one only its free times.
      // This row's own pick counts as free for it.
      const others = { ...options, draft: { ...draft, adding: draft.adding.filter((_, at) => at !== index) } };
      const free = freeSlots(others);
      const freeAlliances = options.editableAlliances.filter(one => free.some(slot => slot.allianceId === one.id));
      const groups: [string, string][] = free.filter(slot => slot.allianceId === adding.allianceId)
        .map(slot => [String(slot.group), `${groupWord} ${slot.group}`]);
      const picks = (choices: [string, string][], chosen: string, data: string) =>
        `<span class="pick-words">${choices.map(([value, text]) =>
          `<button type="button" class="pick-word${value === chosen ? ' on' : ''}" data-times="${data}|${index}|${escapeForPage(value)}">${escapeForPage(text)}</button>`).join('')}</span>`;
      html += row(`<input class="svs-field times-box" inputmode="numeric" maxlength="5" placeholder="--:--" value="${escapeForPage(adding.time)}"` +
        ` data-times-box="new|${index}" aria-label="New time in UTC">`, hollow,
        `<span class="times-picks">${picks(freeAlliances.map(one => [one.id, one.tag]), adding.allianceId, 'pick-alliance')}` +
        `${options.groupCount > 1 ? picks(groups, String(adding.group), 'pick-group') : ''}</span>`);
    });
    // Add only while some alliance this person may edit still has a free time.
    if (freeSlots(options).length) {
      html += row('', null, `<button type="button" class="edit-button times-add" data-times="add" style="--edit-colour: var(--event-color)">${CLOCK_ADD}` +
        `<span><span class="words">Add ${escapeForPage(groupWord.toLowerCase())}</span></span></button>`);
    }
    const changed = draft.times.size > 0 || draft.removed.size > 0 || draft.adding.length > 0;
    html += row('', null, `<span class="times-actions">${word('cancel', 'var(--notice-red)', CROSS, 'Cancel', 'cancel')}` +
      `${word('confirm', 'var(--save-green)', TICK, 'Save', 'save', !changed)}</span>`);
    return html;
  }

  const eye = (entry: AllianceTimeEntry) =>
    `<button type="button" class="times-eye${entry.isShown ? ' on' : ''}" data-times="eye|${escapeForPage(entry.scheduleId)}"` +
    ` aria-label="${entry.isShown ? 'Take out of my timeline' : 'Add to my timeline'}" aria-pressed="${entry.isShown}">` +
    `${lineIcon(entry.isShown ? EYE : EYE_OFF, 2)}</button>`;

  if (options.mode === 'choose') {
    let html = '';
    for (const entry of options.entries) {
      html += row(`<span>${escapeForPage(entry.timeText)}</span>`, entry.isShown ? solid : hollow,
        `<span class="times-line">${nameOf(entry, groupWord, !entry.isShown)}${eye(entry)}</span>`);
    }
    return html + row('', null, word('times-done', 'var(--save-green)', TICK, 'Done', 'done'));
  }

  let html = '';
  for (const entry of options.entries.filter(one => one.isShown)) {
    html += row(`<span>${escapeForPage(entry.timeText)}</span>`, solid, nameOf(entry, groupWord));
  }
  if (options.entries.length) {
    html += row('', null, `<button type="button" class="quiet-word times-follow" data-times="choose">` +
      `${lineIcon(EYE, 2)}<span class="words">Follow another ${escapeForPage(groupWord.toLowerCase())}</span></button>`);
  }
  return html;
}

// Removing asks first, in the site's pop-up (Roxanne, 28 Nov: "I need the pop-up that confirms the
// deletion. That's how we did it everywhere").
export function allianceTimesAsk(options: AllianceTimesRowsOptions): string {
  const asking = options.entries.find(entry => entry.scheduleId === options.draft.asking);
  if (!asking) return '';
  return '<div class="leave-prompt" data-times="ask-cancel"><div class="leave-prompt-box glass" role="dialog" aria-modal="true">' +
    `<p class="leave-prompt-text">Are you sure you want to remove <span class="times-nowrap">${escapeForPage(asking.tag)} · ` +
    `${escapeForPage(options.groupWord)} ${asking.group}</span>?</p>` +
    '<div class="leave-prompt-actions"><button type="button" class="ghost-button" data-times="ask-cancel">Cancel</button>' +
    `<button type="button" class="danger-button" data-times="ask-remove|${escapeForPage(asking.scheduleId)}">Remove</button></div></div></div>`;
}
