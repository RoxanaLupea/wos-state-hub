// Drawing one bar on the calendar.
//
// A bar can carry a lot: the event's name and logo, the parts that follow each other
// inside it, the named days of the event, a short part drawn on top of it, the phases
// it is divided into, and lines under it for the parts that run alongside. Which of
// those appear decides whether the bar has one line or two, and where its logo sits.
// Nothing here measures anything; the exact places are set afterwards, in
// layout-bars.ts, once the browser knows how wide a day column is.

import {
  eventBarSubtitle, eventTypeById, eventTypeColor, eventTypeInitials, eventTypeName, eventTypeShortName, eventTypeTag,
  SVS_FAMILY, eventStepsByEventType, hasLogoColors, logoColors, phaseName, showsTimesInLine, windowLabel
} from '../data/catalog.ts';
import { MINUTES_PER_DAY, minutesFromTime, textFromDay } from '../calendar/days.ts';
import { clockText, windowText } from '../calendar/time-mode.ts';
import { spanText } from '../calendar/spans.ts';
import { colorWithAlpha, hexToHsl, hslToHex, mixColors, darkerFirst } from './colors.ts';
import { escapeForPage } from './escape.ts';
import { eventIcon } from './event-icon.ts';
import type { Bar } from '../calendar/bars.ts';
import type { WeekPiece } from '../calendar/week-bars.ts';
import type { Occurrence } from '../calendar/occurrences.ts';

// How much of the bar the first colour keeps before the fade starts.
const HINT_SHARE = 22;

// The shades one bar is painted in, worked out from the event's own colour so the
// whole calendar stays in one family of colours.
export function barFadeColors(eventTypeId: string): {
  hint: string; dark: string; middle: string; light: string;
} {
  const eventType = eventTypeById(eventTypeId);
  // An event with its logo's colours uses them as they are.
  if (hasLogoColors(eventTypeId)) {
    const { light, dark } = logoColors(eventTypeId);
    return { hint: '', dark, middle: mixColors(dark, light, 0.4), light };
  }
  const first = hexToHsl(eventType?.color ?? '#AFC8F5');
  const second = hexToHsl(eventType?.colorEnd ?? eventType?.color ?? '#AFC8F5');
  const top = Math.max(first.lightness, second.lightness);
  const fadeParts = String(eventType?.timelineColor ?? '').split('>')
    .map(part => part.trim()).filter(Boolean);
  return {
    hint: fadeParts.length > 1 ? fadeParts[0] : '',
    dark: hslToHex(first.hue, first.saturation, top - 0.20),
    middle: hslToHex(first.hue, first.saturation, top - 0.06),
    light: hslToHex(second.hue, second.saturation, top + 0.10)
  };
}

// A white line across a bar where something starts or ends.
export function barMark(minute: number, kind: string, what: string): string {
  const time = clockText(minute);
  return `<span class="bar-mark ${kind}" data-minute="${minute}" data-time="${escapeForPage(time)}"` +
    ` role="button" tabindex="0" aria-label="${escapeForPage(what + ' ' + time)}"></span>`;
}

// The openings of a part that is only open at certain times, such as the predictions
// of Tundra Arms League. Each one is counted from the first day of the part's own
// event, so they move with it.
export function partOpenings(part: Bar | Occurrence): { start: number; end: number; label: string }[] | null {
  const windows = eventTypeById(part.eventTypeId)?.openWindows;
  if (!windows || !windows.length) return null;
  const firstDayStart = part.startDay * MINUTES_PER_DAY;
  const at = (day: number, time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return firstDayStart + (day - 1) * MINUTES_PER_DAY + hours * 60 + minutes;
  };
  const openings = windows.map((window, index) => ({
    start: at(window.fromDay, window.fromTime),
    end: at(window.toDay, window.toTime),
    label: windowLabel(part.eventTypeId, index + 1)
  })).filter(opening => opening.end > opening.start);
  return openings.length ? openings : null;
}

// The windows of an event open at set times each day, as minutes, from its steps.
function dailyWindows(bar: Bar): { start: number; end: number; dayNumber: number }[] {
  if (!showsTimesInLine(bar.eventTypeId)) return [];
  const windows: { start: number; end: number; dayNumber: number }[] = [];
  for (const step of eventStepsByEventType.get(bar.eventTypeId) ?? []) {
    if (!step.startTimeUtc || !step.endTimeUtc) continue;
    const dayStart = (bar.startDay + step.dayNumber - 1) * MINUTES_PER_DAY;
    windows.push({
      start: dayStart + minutesFromTime(step.startTimeUtc),
      end: dayStart + minutesFromTime(step.endTimeUtc),
      dayNumber: step.dayNumber
    });
  }
  return windows.sort((left, right) => left.start - right.start);
}

// The event's name without anything in brackets after it, which is how a bar and a
// panel heading say it.
function plainName(eventTypeId: string): string {
  return eventTypeName(eventTypeId).replace(/\s*\([^)]*\)\s*$/, '');
}

// A part's own name, with its event's name taken off the front: "SvS Battle" under
// State of Power reads as "Battle".
function ownPartName(partEventTypeId: string, mainEventTypeId: string): string {
  const mainShort = eventTypeShortName(mainEventTypeId);
  const name = eventTypeShortName(partEventTypeId);
  const own = name.indexOf(mainShort + ' ') === 0 ? name.slice(mainShort.length + 1) : name;
  return own.charAt(0).toUpperCase() + own.slice(1);
}

export interface BarRenderOptions {
  partOfByEventTypeId: Map<string, string | null>;
  // The stretch the player has tapped, lit on the bar it belongs to.
  lit?: { key: string; start: number; end: number } | null;
  // The runs of the event that is open in the panel. Every bar of them is lit, in every
  // week it crosses.
  litKeys?: Set<string>;
  weekStart: number;
}

// Whether a bar belongs to the open event: its own run, or a phase of it (whose key is
// the run's key with the phase added).
function isLitBar(barKey: string, litKeys: Set<string> | undefined): boolean {
  if (!litKeys || !litKeys.size) return false;
  if (litKeys.has(barKey)) return true;
  for (const key of litKeys) if (barKey.startsWith(key + '|')) return true;
  return false;
}

export function renderBar(piece: WeekPiece, options: BarRenderOptions): string {
  const bar = piece.bar;
  if (bar.markers) return renderMarkerBar(piece, options);

  const fade = barFadeColors(bar.eventTypeId);
  // Every bar fades from its dark tone on the left to its light one on the right (owner,
  // 25 Nov: "dark to light left to right for all of them"), its tickets' lines too.
  // An event with its logo's colours takes them in that order too, whichever is darker.
  const [firstColor, lastColor] = hasLogoColors(bar.eventTypeId) ? darkerFirst(fade.light, fade.dark) : [fade.dark, fade.light];
  const middleColor = hasLogoColors(bar.eventTypeId) ? mixColors(firstColor, lastColor, 0.4) : fade.middle;
  // An SvS bar is our blue against their red, split on a slant in the middle like the
  // game's SvS screens, each side darkest at its own end (owner, 25 Nov).
  const background = SVS_FAMILY.includes(bar.eventTypeId)
    ? 'linear-gradient(110deg,color-mix(in srgb,var(--ours-edge) 90%,transparent) 0%,' +
      'color-mix(in srgb,var(--ours) 80%,transparent) 50%,color-mix(in srgb,var(--theirs) 80%,transparent) 50%,' +
      'color-mix(in srgb,var(--theirs-edge) 90%,transparent) 100%)'
    : 'linear-gradient(90deg,' +
      (fade.hint
        ? `${colorWithAlpha(fade.hint, 0.8)} 0%,${colorWithAlpha(firstColor, 0.8)} ${HINT_SHARE}%,`
        : `${colorWithAlpha(firstColor, 0.8)} 0%,`) +
      `${colorWithAlpha(middleColor, 0.68)} 40%,${colorWithAlpha(lastColor, 0.58)} 100%)`;
  const style =
    `grid-column:${piece.firstColumn + 1} / ${piece.lastColumn + 2};grid-row:${piece.lane + 1};` +
    `background:${background};` +
    `box-shadow:inset 0 0 0 1px ${colorWithAlpha(fade.middle, 0.55)};` +
    `--logo-shade:${fade.dark};--bar-glow:${fade.light};`;

  const partOf = options.partOfByEventTypeId.get(bar.eventTypeId) ?? null;
  const mainOfParts = partOf && !bar.count ? partOf : null;
  const partsMode = Boolean(mainOfParts) && piece.chainParts.length > 0;
  const phaseText = bar.phaseId ? phaseName(bar.phaseId) : '';

  // A one-day bar shows the time it starts, but only on the piece where it does start:
  // a piece carrying on from the week before (Field Triage's Monday) has no start time.
  const timeText = piece.firstColumn === piece.lastColumn && bar.startTimeUtc &&
    bar.startMinute >= piece.start
    ? `<span class="bar-time">${clockText(bar.startMinute)}</span>` : '';
  const fullName = eventTypeName(bar.eventTypeId) + (phaseText ? ' · ' + phaseText : '');

  // The smaller second line: the phase, the part's own name, or the event's own
  // second line. A bar already carrying named days, parts or phases gets none.
  const hasOtherLineTwo = piece.segments.length > 0 || piece.insideParts.length > 0 ||
    Boolean(bar.count) || piece.phaseParts.length > 0 || partsMode;
  const subtitle = hasOtherLineTwo ? ''
    : mainOfParts ? ownPartName(bar.eventTypeId, mainOfParts)
    : phaseText || eventBarSubtitle(bar.eventTypeId);

  let lineOne = '';
  let lineTwo = '';

  // The lit stretch: the part of this bar the player tapped.
  let light = '';
  if (options.lit && options.lit.key) {
    let span: { start: number; end: number } | null = null;
    if (options.lit.key === bar.key) {
      span = { start: Math.max(options.lit.start, piece.start), end: Math.min(options.lit.end, piece.end) };
    }
    for (const part of piece.insideParts) {
      if (options.lit.key === part.key) span = { start: part.startMinute, end: part.endMinute };
    }
    if (span && span.end > span.start) {
      light = `<span class="bar-light" data-start-minute="${span.start}" data-end-minute="${span.end}"></span>`;
    }
  }

  // The named days of the event, each between white lines.
  for (const segment of piece.segments) {
    const isLit = Boolean(options.lit && options.lit.key === bar.key &&
      options.lit.start <= segment.start && options.lit.end >= segment.end);
    if (!segment.isFirst && segment.start > piece.start) {
      lineTwo += barMark(segment.start, 'divider', segment.name + ' starts');
    }
    lineTwo += `<span class="bar-segment${isLit ? ' lit' : ''}" data-start-minute="${segment.start}" data-end-minute="${segment.end}">` +
      `<span class="bar-segment-name" data-short="${escapeForPage(segment.shortName ?? '')}">${escapeForPage(segment.name)}</span></span>`;
  }

  // A short part drawn on top of this bar, as its logo between the two lines.
  if (!partsMode) {
    for (const part of piece.insideParts) {
      const partName = eventTypeName(part.eventTypeId);
      if (part.startMinute > piece.start) lineTwo += barMark(part.startMinute, 'divider', partName + ' starts');
      if (part.endMinute < piece.end) lineTwo += barMark(part.endMinute, 'divider', partName + ' ends');
      lineTwo += `<span class="bar-inside" role="button" tabindex="0" data-open-event="${escapeForPage(part.key)}"` +
        ` data-start-minute="${part.startMinute}" data-end-minute="${part.endMinute}"` +
        ` title="${escapeForPage(partName + ' · ' + spanText(part.startMinute, part.endMinute))}">` +
        `${eventIcon(part.eventTypeId)}</span>`;
    }
  }

  // A bar carrying an event's parts (SvS): the event's name on line one, then each
  // part in turn between white lines, with what is inside each part below it.
  if (partsMode && mainOfParts) {
    const parts = [{
      bar, start: piece.start,
      end: piece.chainParts.length ? piece.chainParts[0].start : piece.end,
      insideParts: piece.insideParts
    }].concat(piece.chainParts);

    parts.forEach((part, index) => {
      const what = eventTypeName(part.bar.eventTypeId);
      if (index > 0) {
        lineOne += barMark(part.start, 'part-line', what + ' starts') +
          barMark(part.start, 'divider', what + ' starts');
      }
      lineOne += `<span class="bar-part${index === 0 ? ' first-part' : ''}" data-event-type="${escapeForPage(part.bar.eventTypeId)}" role="button" tabindex="0"` +
        ` data-open-event="${escapeForPage(part.bar.key)}"` +
        ` data-start-minute="${part.start}" data-end-minute="${part.end}"` +
        ` title="${escapeForPage(what + ' · ' + spanText(part.bar.startMinute, part.bar.endMinute))}">` +
        `<span class="bar-part-text">${escapeForPage(ownPartName(part.bar.eventTypeId, mainOfParts))}</span></span>`;
      // The first part's second line is its named days, handled above.
      if (index === 0) return;
      const inside = part.insideParts ?? [];
      // A part inside a part (Castle Battle in SvS's Battle) is its logo, at its own time,
      // between its own white lines (Roxanne, 26 Nov: "just put the icon of the castle and
      // the lines where they need to be").
      // On a phone there is no room for its own lines: the logo, bigger, sits in the middle
      // of the part, level with the words on line 2 (Roxanne, 26 Nov: "make the Sunfire
      // Castle logo bigger, center it in the battle space, and align it with the text").
      if (inside.length) {
        for (const one of inside) {
          const oneName = eventTypeName(one.eventTypeId);
          const title = ` title="${escapeForPage(oneName + ' · ' + spanText(one.startMinute, one.endMinute))}"`;
          if (one.startMinute > part.start) lineTwo += barMark(one.startMinute, 'divider own-time', oneName + ' starts');
          if (one.endMinute < part.end) lineTwo += barMark(one.endMinute, 'divider own-time', oneName + ' ends');
          lineTwo += `<span class="bar-inside own-time" role="button" tabindex="0" data-open-event="${escapeForPage(one.key)}"` +
            ` data-start-minute="${one.startMinute}" data-end-minute="${one.endMinute}"${title}>${eventIcon(one.eventTypeId)}</span>` +
            `<span class="bar-inside in-part-middle" role="button" tabindex="0" data-open-event="${escapeForPage(one.key)}"` +
            ` data-start-minute="${part.start}" data-end-minute="${part.end}"${title}>${eventIcon(one.eventTypeId)}</span>`;
        }
        return;
      }
      const below = inside.length
        ? inside.map(one => eventTypeName(one.eventTypeId)).join(' · ')
        : eventBarSubtitle(part.bar.eventTypeId);
      if (!below) return;
      const first = inside[0];
      lineTwo += `<span class="bar-segment${first ? ' bar-chain' : ''}"` +
        (first ? ` role="button" tabindex="0" data-open-event="${escapeForPage(first.key)}"` : '') +
        ` data-start-minute="${part.start}" data-end-minute="${part.end}"` +
        (first ? ` title="${escapeForPage(below + ' · ' + spanText(first.startMinute, first.endMinute))}"` : '') +
        `><span class="bar-segment-name">${escapeForPage(below)}</span>` +
        (first ? `<span class="bar-chain-logo">${eventIcon(first.eventTypeId)}</span>` : '') + '</span>';
    });
  }

  // Parts open only at certain times. In a week showing a single phase, the phase
  // moves to line one and the openings are marked on line two.
  const openingMarks: { part: Occurrence; opening: { start: number; end: number; label: string }; labelled: boolean }[] = [];
  for (const part of bar.stripes) {
    const marksByLabel = eventTypeById(part.eventTypeId)?.windowMark === 'label';
    for (const opening of partOpenings(part) ?? []) {
      if (marksByLabel) {
        if (opening.end > piece.start && opening.start < piece.end) {
          openingMarks.push({ part, opening, labelled: true });
        }
      } else if (opening.end > piece.start && opening.end <= piece.end) {
        openingMarks.push({ part, opening, labelled: false });
      }
    }
  }

  const phaseOnLineOne = piece.phaseParts.length === 1 && openingMarks.length > 0;
  if (phaseOnLineOne) {
    lineOne += `<span class="bar-part first-part phase-line-one" data-start-minute="${piece.start}" data-end-minute="${piece.end}">` +
      `<span class="bar-part-text">${escapeForPage(piece.phaseParts[0].name)}</span></span>`;
    for (const mark of openingMarks) {
      const opening = mark.opening;
      const what = eventTypeName(mark.part.eventTypeId) + (opening.label ? ' ' + opening.label : '');
      // A logo marking where an opening ends sits in the seven hours before it.
      const start = mark.labelled ? Math.max(opening.start, piece.start)
        : Math.max(piece.start, opening.end - 7 * 60);
      const end = mark.labelled ? Math.min(opening.end, piece.end) : opening.end;
      lineTwo += `<span class="bar-segment opening-mark${mark.labelled ? '' : ' at-end'}"` +
        ` data-start-minute="${start}" data-end-minute="${end}"` +
        ` title="${escapeForPage(what + ' · ' + spanText(opening.start, opening.end))}">` +
        `<span class="bar-segment-name opening-mark-inside">${eventIcon(mark.part.eventTypeId)}` +
        `${mark.labelled ? escapeForPage(opening.label) : ''}</span></span>`;
    }
  } else {
    piece.phaseParts.forEach((part, index) => {
      if (index > 0) lineTwo += barMark(part.start, 'divider', part.name + ' starts');
      lineTwo += `<span class="bar-segment" data-start-minute="${part.start}" data-end-minute="${part.end}">` +
        `<span class="bar-segment-name" data-phase-short="${escapeForPage(part.shortName ?? '')}">` +
        `${escapeForPage(part.name)}</span></span>`;
    });
  }

  // An event open at set times each day (Wild Brawl): each window is a short white line
  // inside the bar along its bottom edge, like the white lines between days. Pointing
  // at one, or tapping it, shows its times.
  const windowLines = dailyWindows(bar)
    .filter(one => one.end > piece.start && one.start < piece.end)
    .map(one => {
      const times = windowText(one.start, one.end);
      return `<span class="bar-window" data-start-minute="${one.start}" data-end-minute="${one.end}"` +
        ` data-time="${escapeForPage(times)}" role="button" tabindex="0"` +
        ` aria-label="${escapeForPage(eventTypeName(bar.eventTypeId) + ' ' + times)}"></span>`;
    }).join('');

  if (subtitle) lineTwo += `<span class="bar-sub">${escapeForPage(subtitle)}</span>`;

  // The parts running alongside this event: a line under the bar in the part's own
  // colour, and its logo where it ends.
  const stripes = bar.stripes.map((part, index) => {
    const partName = eventTypeName(part.eventTypeId);
    const openings = partOpenings(part);
    const color = escapeForPage(eventTypeColor(part.eventTypeId));
    const bottom = -6 - 5 * index;
    if (openings) {
      // While a part is open its line fades from its dark colour to its light one, the
      // same as in the event's timeline. A line split over two weeks fades fully in each
      // week, so a short piece at the start of a week is never only the light end.
      const [darker, lighter] = darkerFirst(logoColors(part.eventTypeId).light, logoColors(part.eventTypeId).dark);
      const fade = `linear-gradient(to right,${darker},${lighter})`;
      return openings.map(opening =>
        `<span class="bar-stripe" style="background:${fade};bottom:${bottom}px"` +
        ` data-start-minute="${opening.start}" data-end-minute="${opening.end}"></span>`).join('');
    }
    return `<span class="bar-stripe" style="background:${color};bottom:${bottom}px"` +
      ` data-start-minute="${part.startMinute}" data-end-minute="${part.endMinute}"></span>` +
      (part.endMinute <= piece.end
        ? `<span class="bar-stripe-end" data-end-minute="${part.endMinute}"` +
          (part.endMinute === piece.end ? ' data-at-bar-end="yes"' : '') +
          ` title="${escapeForPage(partName + ' · ' + spanText(part.startMinute, part.endMinute))}">` +
          `${eventIcon(part.eventTypeId)}</span>`
        : '') +
      (part.endMinute < piece.end ? barMark(part.endMinute, 'end-mark', partName + ' ends') : '');
  }).join('');

  const hasTwoLines = piece.segments.length > 0 || piece.insideParts.length > 0 ||
    partsMode || piece.phaseParts.length > 0;
  const sideLogo = Boolean(subtitle) || hasTwoLines;
  // On a computer a bar whose second line only names its phases or days, or says its
  // second name, is one line: the phases are written after the name, in their own
  // stretches (Roxanne, 26 Nov: "we have to write it in another way that lets us use one
  // single row"). SvS keeps its two lines, and so does a week with tickets on line 2.
  const oneLineOnComputer = sideLogo && !partsMode && !phaseOnLineOne && piece.insideParts.length === 0;

  const classes = ['bar', 'clickable'];
  if (oneLineOnComputer) classes.push('one-line-wide');
  if (sideLogo) classes.push('phase-lines');
  if (hasTwoLines) classes.push('two-lines', 'day-lines');
  if (partsMode) classes.push('parts-bar');
  // One named stretch on line 2 (TAL's Preview) is written under the name, like a
  // second line of text, not centred in the bar.
  const lineTwoNames = (lineTwo.match(/class="bar-segment-name/g) ?? []).length;
  if (lineTwoNames === 1) classes.push('one-segment');
  const trailCount = bar.stripes.length;
  if (trailCount) classes.push('has-trail');
  if (bar.wasCancelled) classes.push('cancelled');
  if (bar.isProvisional) classes.push('provisional');
  if (isLitBar(bar.key, options.litKeys)) classes.push('lit-event');

  const logo = eventIcon(mainOfParts ?? bar.eventTypeId);
  const headName = mainOfParts ? plainName(mainOfParts) : plainName(bar.eventTypeId);
  const shortName = eventTypeShortName(mainOfParts ?? bar.eventTypeId);
  // A second name players use (SvS, KE) follows the full name, written more quietly.
  const tagText = eventTypeTag(mainOfParts ?? bar.eventTypeId);
  const tag = tagText ? `<span class="bar-tag">${escapeForPage(tagText)}</span>` : '';

  return `<div class="${classes.join(' ')}" style="${style}"` +
    ` title="${escapeForPage(fullName + (bar.wasCancelled ? ' (cancelled)' : '') +
      (bar.isProvisional ? ' (date not confirmed)' : ''))}"` +
    ` data-trail-count="${trailCount}" data-lane="${piece.lane}"` +
    ` data-first-column="${piece.firstColumn}" data-last-column="${piece.lastColumn}"` +
    ` data-left-fraction="${piece.leftFraction.toFixed(5)}" data-right-fraction="${piece.rightFraction.toFixed(5)}"` +
    ` data-event-type="${escapeForPage(bar.eventTypeId)}" data-short-name="${escapeForPage(shortName)}"` +
    (eventTypeInitials(bar.eventTypeId)
      ? ` data-initials="${escapeForPage(eventTypeInitials(bar.eventTypeId))}"` : '') +
    ` data-open-event="${escapeForPage(bar.key)}" data-day="${textFromDay(options.weekStart + piece.firstColumn)}"` +
    ` data-tap-minute="${Math.max(bar.startMinute, piece.start)}"` +
    ' role="button" tabindex="0">' +
    light +
    (sideLogo ? `<span class="bar-side-icon">${logo}</span>` : '') +
    lineOne +
    `<span class="bar-head">${sideLogo ? (oneLineOnComputer ? `<span class="head-logo">${logo}</span>` : '') : logo}` +
    (bar.wasCancelled ? '<span class="cancelled-mark" aria-label="Cancelled">&times;</span>' : '') +
    `<span class="bar-label">${escapeForPage(headName)}</span>${tag}` +
    `${timeText}</span>` +
    // On a computer the second name is written on the one line too, centred in the room
    // after the name like every phase (Roxanne, 26 Nov: "center it").
    (oneLineOnComputer && subtitle
      ? `<span class="bar-segment wide-only" data-start-minute="${piece.start}" data-end-minute="${piece.end}">` +
        `<span class="bar-segment-name">${escapeForPage(subtitle)}</span></span>`
      : '') +
    lineTwo + stripes + windowLines + '</div>';
}

// A bar that shows only its marked times, as logos, instead of a block across the
// day: the player's own slot, or the alliance times they follow.
export function renderMarkerBar(piece: WeekPiece, options: BarRenderOptions): string {
  const bar = piece.bar;
  const span = Math.max(1, bar.endMinute - bar.startMinute);
  const marks = (bar.markers ?? []).slice()
    .sort((left, right) => left.minute - right.minute)
    .map(marker => {
      const left = Math.min(100, Math.max(0, (marker.minute - bar.startMinute) / span * 100));
      // The logo stays inside its day: at midnight its left edge sits on the time,
      // at the next midnight its right edge does.
      return `<span class="bar-marker" style="left:${left.toFixed(2)}%;transform:translateX(-${left.toFixed(2)}%)"` +
        ` title="${escapeForPage(marker.title)}" data-time="${escapeForPage(clockText(marker.minute))}">` +
        `${eventIcon(bar.eventTypeId)}</span>`;
    }).join('');

  return `<div class="bar clickable marker-bar${isLitBar(bar.key, options.litKeys) ? ' lit-event' : ''}"` +
    ` style="grid-column:${piece.firstColumn + 1} / ${piece.lastColumn + 2};grid-row:${piece.lane + 1}"` +
    ` data-trail-count="0" data-lane="${piece.lane}"` +
    ` data-first-column="${piece.firstColumn}" data-last-column="${piece.lastColumn}"` +
    ` data-left-fraction="${piece.leftFraction.toFixed(5)}" data-right-fraction="${piece.rightFraction.toFixed(5)}"` +
    ` data-open-event="${escapeForPage(bar.key)}" data-day="${textFromDay(options.weekStart + piece.firstColumn)}"` +
    ` data-tap-minute="${Math.max(bar.startMinute, piece.start)}"` +
    ` role="button" tabindex="0" aria-label="${escapeForPage(eventTypeName(bar.eventTypeId))}">` +
    `${marks}</div>`;
}
