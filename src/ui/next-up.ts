// The two tiles above the day's details: what the state has on now (State of Power,
// while it runs) or next, and what comes after it. Only state and alliance events
// count, because those are the ones everyone has to be somewhere for.
import './next-up.css';
import { clockText, nowMinute, shownDayOf } from '../calendar/time-mode.ts';
import { categoryOf, eventTypeColor, eventTypeName, eventTypeShortName, eventTypeStageName, eventTypeTag, partOfByEventTypeId, sortOrderOf, wholeEventTypeOf } from '../data/catalog.ts';
import { familyOccurrences } from '../calendar/event-tree.ts';
import { colorWithAlpha } from './colors.ts';
import { shortDayText } from './day-names.ts';
import { escapeForPage } from './escape.ts';
import { eventBadge } from './event-icon.ts';
import type { Occurrence } from '../calendar/occurrences.ts';

// A panel tinted with an event's own colour, lit from the top left.
export function tintedPanelStyle(color: string): string {
  return `background:linear-gradient(135deg,${colorWithAlpha(color, 0.36)},${colorWithAlpha(color, 0.04)} 65%),var(--glass);` +
    'box-shadow:inset 0 1px 0 rgba(255,255,255,0.14),' +
    `inset 0 -3px 0 ${colorWithAlpha(color, 0.7)},0 10px 26px ${colorWithAlpha(color, 0.12)};`;
}

// One tile per event. An event shown whole (State of Power) keeps its one tile from
// "Next up" to its end: "Now" while it runs, with the stage it is in under its name.
type Tile = { eventTypeId: string; stageId: string; startMinute: number; endMinute: number; isNow: boolean };

export function nextUpTiles(occurrences: Occurrence[]): string {
  const now = nowMinute();
  const counted = occurrences.filter(occurrence =>
    occurrence.allianceIds.length === 0 &&
    ['state', 'alliance'].includes(categoryOf(occurrence.eventTypeId)) &&
    !occurrence.wasCancelled);

  const tiles: Tile[] = [];
  const wholeShown = new Set<string>();
  for (const occurrence of counted) {
    const wholeId = wholeEventTypeOf(occurrence.eventTypeId);
    if (!wholeId) {
      if (occurrence.startMinute > now) {
        tiles.push({ eventTypeId: occurrence.eventTypeId, stageId: '', startMinute: occurrence.startMinute,
          endMinute: occurrence.endMinute, isNow: false });
      }
      continue;
    }
    const members = familyOccurrences(occurrence, counted, partOfByEventTypeId);
    if (wholeShown.has(members[0].key)) continue;
    wholeShown.add(members[0].key);
    const stages = members.filter(member => eventTypeStageName(member.eventTypeId));
    const wholeEnd = Math.max(...members.map(member => member.endMinute));
    if (!stages.length || wholeEnd <= now) continue;
    const isNow = stages[0].startMinute <= now;
    const stage = isNow ? stages.filter(one => one.startMinute <= now).pop() ?? stages[0] : stages[0];
    tiles.push({ eventTypeId: wholeId, stageId: stage.eventTypeId, startMinute: stage.startMinute,
      endMinute: stage.endMinute, isNow });
  }

  const shown = tiles
    .sort((left, right) => Number(right.isNow) - Number(left.isNow) ||
      left.startMinute - right.startMinute || sortOrderOf(left.eventTypeId) - sortOrderOf(right.eventTypeId))
    .slice(0, 2);

  let comingCount = 0;
  return shown.map(tile => {
    const label = tile.isNow ? 'Now' : comingCount++ === 0 ? 'Next up' : 'Then';
    const tag = tile.stageId ? eventTypeTag(tile.eventTypeId) : '';
    const stage = tile.stageId ? eventTypeStageName(tile.stageId) : '';
    const color = eventTypeColor(tile.eventTypeId);
    const startText = clockText(tile.startMinute);
    // Coming: when it starts. Running: when its stage ends.
    const endText = clockText(tile.endMinute);
    const when = tile.isNow
      ? 'Until ' + shortDayText(shownDayOf(tile.endMinute - (endText === '00:00' ? 1 : 0))) +
        (endText === '00:00' ? '' : ' · ' + endText)
      : shortDayText(shownDayOf(tile.startMinute)) + (startText === '00:00' ? '' : ' · ' + startText);
    return `<div class="next-tile glass" style="${tintedPanelStyle(color)}">` +
      `<div class="next-tile-head">${eventBadge(tile.eventTypeId)}` +
      `<div class="next-tile-names"><span class="next-tile-label">${label}</span>` +
      (tile.stageId
        ? `<span class="next-tile-title fitted" data-short-name="${escapeForPage(eventTypeShortName(tile.eventTypeId))}">` +
          `<span class="next-tile-name">${escapeForPage(eventTypeName(tile.eventTypeId))}</span>` +
          (tag ? ` <span class="next-tile-tag">${escapeForPage(tag)}</span>` : '') + '</span>'
        : `<span class="next-tile-title">${escapeForPage(eventTypeName(tile.eventTypeId))}</span>`) +
      (stage ? `<span class="next-tile-stage">${escapeForPage(stage)}</span>` : '') + '</div></div>' +
      `<span class="event-note">${escapeForPage(when)}</span></div>`;
  }).join('');
}

// As on the calendar's bars: the full name and its short form only where they fit on
// one line; then the name alone; then only the short name ("SvS").
export function fitNextTiles(root: ParentNode): void {
  const titles = Array.from(root.querySelectorAll<HTMLElement>('.next-tile-title.fitted'));
  for (const title of titles) {
    const name = title.querySelector<HTMLElement>('.next-tile-name');
    const tag = title.querySelector<HTMLElement>('.next-tile-tag');
    if (!name) continue;
    const fullName = name.dataset.fullName ?? name.textContent ?? '';
    name.dataset.fullName = fullName;
    name.textContent = fullName;
    if (tag) tag.style.display = '';
    const fits = () => title.scrollWidth <= title.clientWidth + 0.5;
    if (fits()) continue;
    if (tag) tag.style.display = 'none';
    if (fits()) continue;
    name.textContent = title.dataset.shortName || fullName;
  }
}
