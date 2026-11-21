// An event's own page: what opens when a bar is tapped.
//
// The head says what it is and when. Under it the whole run is drawn as one timeline,
// and beside that an info view with the notes, the rules, the points and the rewards.
// The button in the head swaps between the two.

import './event-panel.css';
import {
  allianceRequirement, eventNotes, eventOtherName, eventTypeColor, eventTypeName, logoColors,
  eventTypeLabel, itemImageFile, itemLabel, itemName, phaseName, playerRequirement,
  pointSourceDayName, pointSourceTask, pointSourcesForDay, pointSourcesInList, pointsNote,
  pointsTitle, rewardsOf, type PointSource, type RewardRow
} from '../data/catalog.ts';
import { clockText, shownDayOf } from '../calendar/time-mode.ts';
import { spanText } from '../calendar/spans.ts';
import { shortDayText } from './day-names.ts';
import { escapeForPage } from './escape.ts';
import { eventBadge, eventIcon, imageUrl } from './event-icon.ts';
import { barFadeColors } from './bar.ts';
import {
  EXPERT_CHEST_HOSTS, NUMBERED_REWARD_LISTS, rewardBandName, rewardListName,
  rewardListsOf, rewardSectionName
} from './reward-names.ts';
import { colorWithAlpha, hexToRgb, mixColors } from './colors.ts';
import { tintedPanelStyle } from './next-up.ts';
import type { EventTree } from '../calendar/event-tree.ts';
import type { Occurrence } from '../calendar/occurrences.ts';

const BACK_ARROW = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
  ' stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M15 18l-6-6 6-6"/></svg>';

export function backLink(): string {
  return `<button type="button" class="back-link" data-back-to-day>${BACK_ARROW}Back</button>`;
}

// A colour taken from somewhere along a bar's fade, used to paint the timeline so it
// matches the bar the player tapped.
function fadeColorAt(eventTypeId: string, position: number): string {
  const fade = barFadeColors(eventTypeId);
  const at = Math.min(1, Math.max(0, position));
  const from = at <= 0.4 ? fade.dark : fade.middle;
  const to = at <= 0.4 ? fade.middle : fade.light;
  const share = at <= 0.4 ? at / 0.4 : (at - 0.4) / 0.6;
  const start = hexToRgb(from), end = hexToRgb(to);
  const mix = (one: number, other: number) => Math.round(one + (other - one) * share);
  return `rgb(${mix(start.red, end.red)},${mix(start.green, end.green)},${mix(start.blue, end.blue)})`;
}

function fadePiece(eventTypeId: string, from: number, to: number): string {
  return `linear-gradient(${fadeColorAt(eventTypeId, from)},${fadeColorAt(eventTypeId, to)})`;
}

// A note written as "Title: body", or as several lines, each of which may be labelled.
function noteRow(written: string, imageFile: string): string {
  const titled = written.match(/^([^:\n]{1,40}):\s*([\s\S]*)$/);
  const title = titled ? titled[1] : '';
  const body = titled ? titled[2] : written;
  const lines = body.split('\n').filter(line => line.trim());

  const bodyHtml = lines.map(line => {
    const labelled = lines.length > 1 && line.match(/^(Disabled|Enabled):\s*(.*)$/);
    if (labelled) {
      return `<span class="note-line note-${labelled[1].toLowerCase()}">` +
        `<b>${escapeForPage(labelled[1])}</b><span>${escapeForPage(labelled[2])}</span></span>`;
    }
    const requirement = lines.length > 1 && line.match(/^(Alliance|Player):\s*(.*)$/);
    if (requirement) {
      return `<span class="note-line"><b>${escapeForPage(requirement[1])}:</b> ` +
        `${escapeForPage(requirement[2])}</span>`;
    }
    return `<span class="note-line">${escapeForPage(line)}</span>`;
  }).join('');

  const url = imageFile ? imageUrl(imageFile.replace(/\.png$/, '')) : '';
  const picture = url
    ? `<img class="note-picture" src="${escapeForPage(url)}" alt="" loading="lazy">` : '';

  if (!title) {
    return `<p class="points-note${picture ? ' with-picture' : ''}">${picture}${bodyHtml}</p>`;
  }
  const isShort = lines.length <= 1 && body.length <= 40;
  return `<p class="points-note${isShort ? '' : ' titled'}${picture ? ' with-picture' : ''}">` +
    `${picture}<b class="note-title">${escapeForPage(title)}${isShort ? ':' : ''}</b>` +
    `${isShort ? ' ' : ''}${bodyHtml}</p>`;
}

function pointRows(eventTypeId: string, sources: PointSource[]): string {
  return (pointsNote(eventTypeId)
    ? `<p class="points-note">${escapeForPage(pointsNote(eventTypeId))}</p>` : '') +
    sources.map(source => {
      const task = pointSourceTask(source.id);
      if (!source.points) return noteRow(task, source.imageFile);
      return `<div class="points-row"><span>${escapeForPage(task)}</span>` +
        `<span class="points-value">${escapeForPage(source.points)}</span></div>`;
    }).join('');
}

function pointsList(eventTypeId: string, sources: PointSource[], isOpen: boolean): string {
  if (!sources.length && !pointsNote(eventTypeId)) return '';
  const scoringRows = sources.filter(source => source.points).length;
  const title = pointsTitle(eventTypeId) || ('Points' + (scoringRows ? ` (${scoringRows})` : ''));
  return `<details class="points-list"${isOpen ? ' open' : ''}>` +
    `<summary>${escapeForPage(title)}</summary>${pointRows(eventTypeId, sources)}</details>`;
}

// A fold of plain notes from one named list.
function notesFold(eventTypeId: string, list: string, title: string): string {
  const notes = pointSourcesInList(eventTypeId, list);
  if (!notes.length) return '';
  return `<details class="points-list" open><summary>${escapeForPage(title)}</summary>` +
    notes.map(source => noteRow(pointSourceTask(source.id), source.imageFile)).join('') +
    '</details>';
}

const TILE_COLORS = ['grey', 'green', 'blue', 'purple', 'orange'];

// Items the game shows without a picture of their own, drawn here instead.
const DRAWN_ITEM_PICTURES: Record<string, string> = {
  'mystery-pack': '<svg class="drawn-picture" viewBox="0 0 64 64" aria-hidden="true">' +
    '<defs><linearGradient id="questionGold" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#FFE45C"/><stop offset="1" stop-color="#F2A92A"/></linearGradient></defs>' +
    '<text x="33.5" y="57" text-anchor="middle" font-family="Arial Black, Arial, sans-serif"' +
    ' font-weight="900" font-size="60" fill="#3A2200" opacity="0.55">?</text>' +
    '<text x="32" y="55" text-anchor="middle" font-family="Arial Black, Arial, sans-serif"' +
    ' font-weight="900" font-size="60" fill="url(#questionGold)" stroke="#7A460E"' +
    ' stroke-width="4" paint-order="stroke">?</text></svg>'
};

// The number a row is sorted by in a ladder list, taken from the first number in its
// item's name ("300,000 points" sorts before "1,000,000 points").
function firstNumberIn(written: string): number {
  const match = String(written ?? '').replace(/,/g, '').match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function rewardTile(row: RewardRow): string {
  const file = itemImageFile(row.itemId);
  const url = file ? imageUrl(file.replace(/\.png$/, '')) : '';
  const drawn = !url ? DRAWN_ITEM_PICTURES[row.itemId] ?? '' : '';
  const tile = TILE_COLORS.includes(row.tile) ? row.tile : 'none';
  const label = itemLabel(row.itemId);
  const name = itemName(row.itemId);
  const title = name + (row.quantity ? ' ×' + row.quantity : '');
  return `<span class="reward-tile tile-${tile}${url || drawn ? '' : ' no-picture'}"` +
    ` title="${escapeForPage(title)}">` +
    (url ? `<img src="${escapeForPage(url)}" alt="" loading="lazy">` : drawn) +
    (label ? `<span class="tile-top">${escapeForPage(label)}</span>` : '') +
    // Secured items carry the shield in the corner, as they do in the game.
    (/Secured/.test(name)
      ? `<img class="tile-secured" src="${escapeForPage(imageUrl('items/secured'))}" alt="">` : '') +
    (row.quantity ? `<span class="tile-qty">${escapeForPage(String(row.quantity))}</span>` : '') +
    '</span>';
}

// The chests a day of an event unlocks, opened from that day's row in the timeline.
export function dayChests(eventTypeId: string, dayNumber: number): string {
  const chests = rewardsOf(eventTypeId, 'chests', String(dayNumber));
  if (!chests.length) return '';

  let html = '<div class="reward-sub">Daily Chests</div>' +
    `<div class="reward-flat">${chests.map(rewardTile).join('')}</div>`;

  const extra = rewardsOf(eventTypeId, 'expert');
  const host = EXPERT_CHEST_HOSTS[eventTypeId];
  if (extra.length) {
    const url = host ? imageUrl(host.imageFile) : '';
    html += '<div class="reward-sub with-picture">' +
      (url ? `<img src="${escapeForPage(url)}" alt="">` : '') +
      `${escapeForPage(host ? host.name : 'Expert')}</div>` +
      `<div class="reward-flat">${extra.map(rewardTile).join('')}</div>`;
  }
  if (chests.some(row => row.source === 'guides')) {
    html += '<p class="reward-source">From guides, not checked in game yet.</p>';
  }
  return `<div class="day-chests">${html}</div>`;
}

// The missions of an event and what each pays, with a tab per kind when it has more
// than one.
function missionsFold(eventTypeId: string, state: RewardViewState): string {
  const notes = pointSourcesInList(eventTypeId, 'missions');
  const rows = rewardsOf(eventTypeId, 'missions');
  if (!notes.length && !rows.length) return '';

  const bands: string[] = [];
  for (const row of rows) if (!bands.includes(row.band)) bands.push(row.band);
  const chosen = state.openBand.get(eventTypeId + '|missions');
  const band = chosen && bands.includes(chosen) ? chosen : bands[0] ?? '';

  let html = '<details class="points-list rewards-fold" open><summary>Missions</summary>' +
    notes.map(source => noteRow(pointSourceTask(source.id), source.imageFile)).join('');

  if (bands.length > 1) {
    html += `<div class="reward-tabs" style="grid-template-columns:repeat(${bands.length},1fr)">` +
      bands.map(one =>
        `<button type="button" class="reward-tab${one === band ? ' on' : ''}"` +
        ` data-reward-band="${escapeForPage(eventTypeId + '|missions|' + one)}">` +
        `${escapeForPage(one)}</button>`).join('') + '</div>';
  }

  const shown = band ? rows.filter(row => row.band === band) : rows;
  html += `<div class="reward-flat">${shown.map(rewardTile).join('')}</div>`;
  if (shown.some(row => row.source === 'guides')) {
    html += '<p class="reward-source">From guides, not checked in game yet.</p>';
  }
  return html + '</details>';
}

// Rewards, grouped the way the catalog holds them: one tab per list, one band of a
// list at a time, and inside that a row of tiles per section.
export interface RewardViewState {
  // Which list is open, by event type.
  openList: Map<string, string>;
  // Which band is open, by event type and list.
  openBand: Map<string, string>;
}

function rewardsFold(eventTypeId: string, state: RewardViewState): string {
  const all = rewardsOf(eventTypeId);
  if (!all.length) return '';

  const present: string[] = [];
  for (const row of all) if (!present.includes(row.list)) present.push(row.list);
  // Missions and the daily chests have folds of their own.
  const lists = rewardListsOf(eventTypeId, present.filter(one => one !== 'missions' && one !== 'chests' && one !== 'expert'));
  if (!lists.length) return '';
  const chosenList = state.openList.get(eventTypeId);
  const list = chosenList && lists.includes(chosenList) ? chosenList : lists[0];

  const rows = rewardsOf(eventTypeId, list);
  const bands: string[] = [];
  for (const row of rows) if (row.band && !bands.includes(row.band)) bands.push(row.band);
  const chosenBand = state.openBand.get(eventTypeId + '|' + list);
  const band = chosenBand && bands.includes(chosenBand) ? chosenBand : bands[0] ?? '';
  let shown = band ? rows.filter(row => row.band === band) : rows;
  if (NUMBERED_REWARD_LISTS.includes(list)) {
    shown = shown.slice().sort((left, right) =>
      firstNumberIn(itemName(left.itemId)) - firstNumberIn(itemName(right.itemId)));
  }

  let html = '<details class="points-list rewards-fold" open><summary>Rewards</summary>';
  if (lists.length > 1) {
    html += `<div class="reward-tabs" style="grid-template-columns:repeat(${lists.length},1fr)">` +
      lists.map(one =>
        `<button type="button" class="reward-tab${one === list ? ' on' : ''}"` +
        ` data-reward-list="${escapeForPage(eventTypeId + '|' + one)}">` +
        `${escapeForPage(rewardListName(eventTypeId, one))}</button>`).join('') +
      '</div>';
  }
  if (bands.length > 1) {
    const hasLongNames = bands.some(one => one.length > 8);
    html += `<div class="reward-bands${hasLongNames ? ' long-names' : ''}">` +
      bands.map(one =>
        `<button type="button" class="reward-band${one === band ? ' on' : ''}"` +
        ` data-reward-band="${escapeForPage(eventTypeId + '|' + list + '|' + one)}">` +
        `${escapeForPage(rewardBandName(one))}</button>`).join('') + '</div>';
  }

  // The note written for this list, and band, of this event's rewards.
  const listNote = pointSourcesInList(eventTypeId, 'rewards').find(source => {
    const where = pointSourceDayName(source.id);
    return where === list + '|' + band || (!band && where === list);
  });
  if (listNote) {
    html += `<p class="points-note reward-note">${escapeForPage(pointSourceTask(listNote.id))}</p>`;
  }

  const sections: string[] = [];
  for (const row of shown) if (!sections.includes(row.section)) sections.push(row.section);

  html += sections.map(section => {
    const inSection = shown.filter(row => row.section === section);
    const heading = rewardSectionName(list, section);
    const headingHtml = heading ? `<div class="reward-sub">${escapeForPage(heading)}</div>` : '';
    // Champion's Glory is alliance decoration: each piece is shown with its name,
    // because there is no quantity to tell them apart.
    if (list === 'glory') {
      return headingHtml + '<div class="merchant-grid glory-grid">' +
        inSection.map(row =>
          `<div class="merchant-offer">${rewardTile(row)}` +
          `<span class="merchant-limit">${escapeForPage(itemName(row.itemId))}</span></div>`).join('') +
        '</div>';
    }
    return headingHtml + `<div class="reward-flat">${inSection.map(rewardTile).join('')}</div>`;
  }).join('');

  if (shown.some(row => row.source === 'guides')) {
    html += '<p class="reward-source">From guides, not checked in game yet.</p>';
  }
  return html + '</details>';
}

// The whole run as one timeline.
export function renderEventTree(tree: EventTree): string {
  const rows = tree.rows;
  const side = tree.side;

  // Each part that opens and closes gets a narrow column of its own, always two wide
  // so the rows line up whether there is one part or two.
  const openingColumns = tree.openingSides.map(part => {
    const spans = (part.openings ?? []).map(opening => {
      const from = rows.findIndex(row =>
        row.openingPartKey === part.occurrence.key && row.openingStart === opening.start);
      let to = rows.findIndex(row =>
        row.openingPartKey === part.occurrence.key && row.openingEnd === opening.end);
      if (to === -1) to = rows.findIndex((row, index) => index > from && row.minute >= opening.end);
      if (to === -1) to = rows.length - 1;
      return { from, to };
    }).filter(span => span.from !== -1);
    return { part, spans };
  });

  const openingCells = (index: number) => [0, 1].map(column => {
    const column0 = openingColumns[column];
    if (!column0) return '<span class="tree-side"></span>';
    const span = column0.spans.find(one => index >= one.from && index <= one.to);
    const state = !span ? '' : index === span.from ? 'start' : index === span.to ? 'end' : 'middle';
    if (!span) return '<span class="tree-side"></span>';
    // The line fades from the ticket's light colour where it opens, marked by a small
    // circle, to its dark colour where it closes.
    const partTypeId = column0.part.occurrence.eventTypeId;
    const { light, dark } = logoColors(partTypeId);
    const length = Math.max(1, span.to - span.from);
    const colorAt = (rowPlace: number) =>
      mixColors(light, dark, Math.min(1, Math.max(0, (rowPlace - span.from) / length)));
    const topHalf = `linear-gradient(${colorAt(index - 0.5)},${colorAt(index)})`;
    const bottomHalf = `linear-gradient(${colorAt(index)},${colorAt(index + 0.5)})`;
    return `<span class="tree-side ${state}" style="--side-top:${topHalf};--side-bottom:${bottomHalf}">` +
      (state === 'start'
        ? `<span class="tree-side-logo" title="${escapeForPage(eventTypeName(partTypeId))}">` +
          `${eventIcon(partTypeId)}</span>` +
          `<span class="tree-side-start" style="background:${light}"></span>` : '') +
      (state === 'end' ? `<span class="tree-cap" style="background:${dark}"></span>` : '') +
      '</span>';
  }).join('');

  const lastIndex = Math.max(1, rows.length - 1);
  // The line starts a little past the deepest shade, so the first dot still shows.
  const lineAt = (index: number) => 0.2 + 0.8 * Math.min(1, Math.max(0, index / lastIndex));

  const sideStartIndex = side ? rows.findIndex(row => row.minute >= side.occurrence.startMinute) : -1;
  const sideEndIndex = side ? rows.findIndex(row => row.isSideEnd) : -1;
  const sideSpan = Math.max(1, sideEndIndex - sideStartIndex);
  const sideAt = (index: number) => (index - sideStartIndex) / sideSpan;
  const sideStepIndex = side ? rows.findIndex(row => row.isSideStep) : -1;
  const isDashedBelow = (index: number) => sideStepIndex !== -1 && index >= sideStepIndex;
  const sideStateAt = (index: number) => {
    if (!side || index < sideStartIndex || index > sideEndIndex) return '';
    return index === sideStartIndex ? 'start' : index === sideEndIndex ? 'end' : 'middle';
  };

  const mainEventTypeId = rows.length ? rows[0].eventTypeId : '';

  const body = rows.map((row, index) => {
    const lineAbove = fadePiece(mainEventTypeId, lineAt(index - 0.5), lineAt(index));
    const lineBelow = fadePiece(mainEventTypeId, lineAt(index), lineAt(index + 0.5));
    const dotColor = fadeColorAt(row.isSideRow ? row.eventTypeId : mainEventTypeId, lineAt(index));
    const lineClass = index === 0 ? ' first' : index === rows.length - 1 ? ' last' : '';

    const mainLine = `<span class="tree-line${lineClass}"` +
      ` style="--line-above:${lineAbove};--line-below:${lineBelow}">` +
      (row.isEndRow ? `<span class="tree-cap" style="background:${dotColor}"></span>`
        : row.level === 0 ? `<span class="tree-dot" style="background:${dotColor}"></span>`
        : row.isSideRow ? ''
        : `<span class="tree-step-dot" style="background:${dotColor}"></span>`) + '</span>';

    let sideCell = '';
    if (side) {
      const state = sideStateAt(index);
      const partTypeId = side.occurrence.eventTypeId;
      sideCell = `<span class="tree-side ${state}` +
        `${isDashedBelow(index - 1) ? ' dash-top' : ''}${isDashedBelow(index) ? ' dash-bottom' : ''}"` +
        ` style="--side-top:${fadePiece(partTypeId, sideAt(index - 0.5), sideAt(index))};` +
        `--side-bottom:${fadePiece(partTypeId, sideAt(index), sideAt(index + 0.5))}">` +
        (state === 'start'
          ? `<span class="tree-side-logo" title="${escapeForPage(eventTypeName(partTypeId))}">` +
            `${eventIcon(partTypeId)}</span>` : '') +
        (row.isSideStep
          ? `<span class="tree-side-dot" style="background:${fadeColorAt(partTypeId, sideAt(index))}"></span>` : '') +
        (state === 'end'
          ? `<span class="tree-cap" style="background:${fadeColorAt(partTypeId, 1)}"></span>` : '') +
        '</span>';
    }

    const sideGoesOn = sideStateAt(index) === 'start' || sideStateAt(index) === 'middle';
    const chestsHtml = row.dayNumber ? dayChests(row.eventTypeId, row.dayNumber) : '';
    const hasPoints = row.pointSourceIds.length > 0 || Boolean(chestsHtml);
    const noteHtml = row.note ? `<p class="tree-instructions">${escapeForPage(row.note)}</p>` : '';

    // The date only where the day changes; the time on every row.
    const rowDay = shownDayOf(row.minute);
    const isNewDay = index === 0 || shownDayOf(rows[index - 1].minute) !== rowDay;

    const inside = `<span class="tree-when">` +
      (isNewDay ? `<b>${escapeForPage(shortDayText(rowDay))}</b>` : '') +
      `<span>${escapeForPage(clockText(row.minute))}</span></span>` +
      sideCell + (openingColumns.length ? openingCells(index) : '') + mainLine +
      `<span class="tree-label${row.level === 0 && !row.isEndRow ? ' main' : ''}` +
      `${row.isSideRow || row.isEndRow ? ' side-row' : ''}"` +
      // A ticket's rows are written in the ticket's own colour, like its line; other
      // rows beside the event use the light end of their bar.
      (row.openingPartKey ? ` style="color:${logoColors(row.eventTypeId).light}"`
        : row.isSideRow ? ` style="color:${barFadeColors(row.eventTypeId).light}"` : '') + '>' +
      (row.isCancelled ? '<span class="cancelled-mark" aria-label="Cancelled">&times;</span> ' : '') +
      escapeForPage(row.label) +
      (row.subLabel ? `<span class="tree-sub">${escapeForPage(row.subLabel)}</span>` : '') +
      '</span>' +
      (hasPoints || row.note
        ? `<span class="tree-arrow" style="--arrow-color:${dotColor}"></span>` : '<span></span>');

    const rowClass = 'tree-row' +
      (row.level === 0 ? ' main' : row.isSideRow ? ' side' : ' nested') +
      (row.isCurrent ? ' current' : '');
    const currentStyle = row.isCurrent ? ` style="--current-color:${dotColor}"` : '';
    const rowKey = ` data-row-key="${escapeForPage(row.key ?? '')}"`;

    if (!hasPoints && !noteHtml) {
      return `<div class="${rowClass}"${currentStyle}${rowKey}>${inside}</div>`;
    }
    const sources = pointSourcesForDay(row.eventTypeId, row.dayNumber ?? 1)
      .filter(source => row.pointSourceIds.includes(source.id));
    return `<details class="tree-item"><summary class="${rowClass}"${currentStyle}${rowKey}>` +
      `${inside}</summary>` +
      `<div class="tree-points${sideGoesOn ? ' with-side' : ''}` +
      `${sideGoesOn && isDashedBelow(index) ? ' dash-side' : ''}"` +
      ` style="--line-below:${lineBelow}` +
      (sideGoesOn && side
        ? `;--side-color:${fadeColorAt(side.occurrence.eventTypeId, sideAt(index + 0.5))}` : '') +
      `">${noteHtml}${pointRows(row.eventTypeId, sources)}${chestsHtml}</div></details>`;
  }).join('');

  return `<div class="event-tree${side ? ' has-side' : ''}` +
    `${openingColumns.length ? ' has-two-sides' : ''}">${body}</div>`;
}

export interface EventPanelOptions {
  tree: EventTree;
  // The day the player was looking at when they opened it.
  day: number;
  dayOfEvent: number;
  allianceTags: string;
  // Other alliances' own times for this event in these days.
  allianceTimes: Occurrence[];
  allianceTagsOf: (occurrence: Occurrence) => string;
  // 'timeline' or 'info'.
  shownView: string;
  rewardView: RewardViewState;
  changeNote: string;
}

const INFO_ICON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
  ' stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/>' +
  '<path d="M12 11v6"/><circle cx="12" cy="7.5" r="0.8" fill="currentColor"/></svg>';
const TIMELINE_ICON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
  ' stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 3v18"/>' +
  '<circle cx="6" cy="6" r="2.2" fill="currentColor"/><circle cx="6" cy="18" r="2.2" fill="currentColor"/>' +
  '<path d="M6 12h5"/><circle cx="13" cy="12" r="1.8" fill="currentColor"/>' +
  '<path d="M11 6h9M11 18h9M16 12h4"/></svg>';

export function eventPanel(occurrence: Occurrence, options: EventPanelOptions): string {
  const eventTypeId = occurrence.eventTypeId;
  const color = eventTypeColor(eventTypeId);

  // What players need to know about this particular run.
  const facts: string[] = [];
  const typeLabel = eventTypeLabel(eventTypeId);
  if (typeLabel) facts.push(typeLabel);
  if (occurrence.wasCancelled) facts.push('Cancelled');
  if (occurrence.wasChanged) facts.push('Date or time changed');

  const notes: string[] = [];
  const otherName = eventOtherName(eventTypeId);
  if (otherName) notes.push(`<p class="event-other-name">${escapeForPage(otherName)}</p>`);
  const written = eventNotes(eventTypeId);
  if (written) notes.push(`<p class="event-info-line">${escapeForPage(written)}</p>`);
  if (options.changeNote) {
    notes.push(`<p class="event-info-line">${escapeForPage(options.changeNote)}</p>`);
  }

  const requirements = allianceRequirement(eventTypeId) || playerRequirement(eventTypeId)
    ? '<details class="points-list event-requirements" open><summary>Requirements</summary>' +
      (allianceRequirement(eventTypeId)
        ? `<p><b>Alliance:</b> ${escapeForPage(allianceRequirement(eventTypeId))}</p>` : '') +
      (playerRequirement(eventTypeId)
        ? `<p><b>Player:</b> ${escapeForPage(playerRequirement(eventTypeId))}</p>` : '') +
      '</details>'
    : '';

  const timelineHtml = options.tree.rows.length ? renderEventTree(options.tree) : '';
  // The event's own scoring list, unless the timeline already shows points per day.
  const ownPoints = options.tree.hasPoints
    ? '' : pointsList(eventTypeId, pointSourcesForDay(eventTypeId, options.dayOfEvent), true);

  const foldsHtml = requirements + ownPoints +
    notesFold(eventTypeId, 'rules', 'Rules') +
    notesFold(eventTypeId, 'predictions', 'Predictions') +
    notesFold(eventTypeId, 'rewards', 'Rewards') +
    missionsFold(eventTypeId, options.rewardView) +
    rewardsFold(eventTypeId, options.rewardView);

  const infoHtml = (notes.length ? `<div class="event-notes">${notes.join('')}</div>` : '') +
    (foldsHtml ? `<div class="event-folds" style="--fold-color:${escapeForPage(color)}">${foldsHtml}</div>` : '');

  const hasBothViews = Boolean(timelineHtml) && Boolean(infoHtml);
  const view = hasBothViews ? options.shownView : timelineHtml ? 'timeline' : 'info';

  const viewButton = !hasBothViews ? '' :
    `<button type="button" class="view-button" data-toggle-view` +
    ` aria-label="${view === 'timeline' ? 'Show info' : 'Show timeline'}"` +
    ` title="${view === 'timeline' ? 'Info' : 'Timeline'}">` +
    (view === 'timeline' ? INFO_ICON : TIMELINE_ICON) + '</button>';

  let html = backLink() +
    `<section class="day-section glass event-page" style="${tintedPanelStyle(color)}">` +
    `<div class="event-page-head">${eventBadge(eventTypeId, 'large')}` +
    '<div class="event-page-title"><h2>' +
    (occurrence.wasCancelled ? '<span class="cancelled-mark" aria-label="Cancelled">&times;</span> ' : '') +
    escapeForPage(eventTypeName(eventTypeId) + options.allianceTags) + '</h2>' +
    `<span class="event-note">${escapeForPage(spanText(occurrence.startMinute, occurrence.endMinute))}</span>` +
    `</div><div class="row-buttons">${viewButton}</div></div>`;

  if (facts.length) {
    html += '<div class="event-facts">' +
      facts.map(fact => `<span class="event-fact">${escapeForPage(fact)}</span>`).join('') +
      '</div>';
  }

  html += view === 'timeline' ? timelineHtml : infoHtml;
  html += '</section>';

  if (options.allianceTimes.length) {
    html += '<section class="day-section glass"><h3>Alliance times</h3>' +
      options.allianceTimes.map(other =>
        `<button type="button" class="schedule-row" data-open-event="${escapeForPage(other.key)}">` +
        `<span>${escapeForPage(options.allianceTagsOf(other))}</span>` +
        `<span class="schedule-when">${escapeForPage(shortDayText(shownDayOf(other.startMinute)) +
          (other.startTimeUtc ? ' · ' + clockText(other.startMinute) : ''))}</span></button>`).join('') +
      '</section>';
  }

  return html;
}

// The panel behind a gathered bar ("Bear Hunt x16"): every alliance's time of that
// event on that day. Ticking a time follows it, and then only the followed ones show
// in the calendar, as the logo at their time.
export interface GroupPanelOptions {
  eventTypeId: string;
  day: number;
  times: Occurrence[];
  nameOfTime: (occurrence: Occurrence) => string;
  followedScheduleIds: Set<string>;
}

export function groupPanel(options: GroupPanelOptions): string {
  const color = eventTypeColor(options.eventTypeId);
  return backLink() +
    `<section class="day-section glass event-page" style="${tintedPanelStyle(color)}">` +
    `<div class="event-page-head">${eventBadge(options.eventTypeId, 'large')}` +
    `<div class="event-page-title"><h2>${escapeForPage(eventTypeName(options.eventTypeId))}</h2>` +
    `<span class="event-note">${escapeForPage(shortDayText(options.day))}</span></div></div>` +
    '<p class="event-info-line">Tick the times you follow. Only those show in your calendar, at their time.</p>' +
    '<div class="time-list">' + options.times.map(one => {
      const isFollowed = options.followedScheduleIds.has(one.scheduleId);
      return `<div class="time-row${isFollowed ? ' followed' : ''}">` +
        `<button type="button" class="time-follow" data-follow-time="${escapeForPage(one.scheduleId)}"` +
        ` aria-pressed="${isFollowed}">` +
        `<span class="filter-box${isFollowed ? ' on' : ''}" aria-hidden="true">${isFollowed ? '&#10003;' : ''}</span>` +
        `<span class="time-name">${escapeForPage(options.nameOfTime(one))}</span></button>` +
        `<span class="time-value">${escapeForPage(clockText(one.startMinute))}</span></div>`;
    }).join('') + '</div></section>';
}

// Kept so the colour helpers have one home, used by the panel and by anything that
// paints something to match a bar.
export { fadeColorAt, colorWithAlpha, phaseName };
