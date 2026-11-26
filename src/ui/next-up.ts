// The two tiles above the day's details: what the state has on now (State of Power,
// while it runs) or next, and what comes after it. Only state and alliance events
// count, because those are the ones everyone has to be somewhere for.
import './next-up.css';
import { clockText, nowMinute, shownDayOf } from '../calendar/time-mode.ts';
import { categoryOf, eventTypeColor, eventTypeColorEnd, eventTypeName, eventTypeShortName, eventTypeStageName, eventTypeTag, partOfByEventTypeId, phaseName, phasesByEventType, sortOrderOf, wholeEventTypeOf } from '../data/catalog.ts';
import { familyOccurrences } from '../calendar/event-tree.ts';
import { colorWithAlpha } from './colors.ts';
import { shortDayText } from './day-names.ts';
import { escapeForPage } from './escape.ts';
import { eventBadge } from './event-icon.ts';
import type { Occurrence } from '../calendar/occurrences.ts';

// A panel tinted with an event's own colours, as its bar runs (owner, 25 Nov: every
// panel uses them): the first lit from the top left, the second, where the event has
// one, rising from the bottom right.
export function tintedPanelStyle(color: string, colorEnd = color): string {
  const end = colorEnd.toLowerCase() === color.toLowerCase() ? ''
    : `linear-gradient(315deg,${colorWithAlpha(colorEnd, 0.3)},${colorWithAlpha(colorEnd, 0)} 60%),`;
  return `background:${end}linear-gradient(135deg,${colorWithAlpha(color, 0.36)},${colorWithAlpha(color, 0.04)} 65%),var(--glass);` +
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
    // Every tile names its phase (Roxanne, 26 Nov: "We either put the face or we don't"): a
    // whole event its stage, any other event the phase it opens with. On a phone only the
    // stage shows, as approved there (next-up.css).
    const firstPhase = tile.stageId ? undefined
      : (phasesByEventType.get(tile.eventTypeId) ?? []).slice().sort((left, right) => left.fromDay - right.fromDay)[0];
    const stage = tile.stageId ? eventTypeStageName(tile.stageId) : '';
    const phase = stage || (firstPhase ? phaseName(firstPhase.id) : '');
    const color = eventTypeColor(tile.eventTypeId);
    const startText = clockText(tile.startMinute);
    // Coming: when it starts. Running: when its stage ends.
    const endText = clockText(tile.endMinute);
    const when = tile.isNow
      ? 'Until ' + shortDayText(shownDayOf(tile.endMinute - (endText === '00:00' ? 1 : 0))) +
        (endText === '00:00' ? '' : ' · ' + endText)
      : shortDayText(shownDayOf(tile.startMinute)) + (startText === '00:00' ? '' : ' · ' + startText);
    return `<div class="next-tile glass" style="${tintedPanelStyle(color, eventTypeColorEnd(tile.eventTypeId))}">` +
      `<div class="next-tile-head">${eventBadge(tile.eventTypeId)}` +
      `<div class="next-tile-names"><span class="next-tile-label">${label}</span>` +
      (tile.stageId
        ? `<span class="next-tile-title fitted" data-short-name="${escapeForPage(eventTypeShortName(tile.eventTypeId))}">` +
          `<span class="next-tile-name">${escapeForPage(eventTypeName(tile.eventTypeId))}</span>` +
          (tag ? ` <span class="next-tile-tag">${escapeForPage(tag)}</span>` : '') + '</span>'
        : `<span class="next-tile-title fitted-wide" data-short-name="${escapeForPage(eventTypeShortName(tile.eventTypeId))}">` +
          `<span class="next-tile-name">${escapeForPage(eventTypeName(tile.eventTypeId))}</span></span>`) +
      (phase ? `<span class="next-tile-stage${stage ? '' : ' computer-only'}">${escapeForPage(phase)}</span>` : '') + '</div></div>' +
      `<span class="event-note">${escapeForPage(when)}</span></div>`;
  }).join('');
}

// As on the calendar's bars: the full name and its short form only where they fit on
// one line; then the name alone; then only the short name ("SvS").
export function fitNextTiles(root: ParentNode): void {
  const titles = Array.from(root.querySelectorAll<HTMLElement>('.next-tile-title.fitted, .next-tile-title.fitted-wide'));
  for (const title of titles) {
    const name = title.querySelector<HTMLElement>('.next-tile-name');
    // A tile without a stage is fitted on a computer only; a phone wraps its name, as approved.
    if (title.classList.contains('fitted-wide') && window.innerWidth < 1000) {
      if (name?.dataset.fullName) name.textContent = name.dataset.fullName;
      continue;
    }
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
