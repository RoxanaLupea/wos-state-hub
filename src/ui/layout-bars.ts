// Putting the bars where their times say, once the browser knows how wide a day is.
//
// The markup places a bar in whole day columns. These three passes then measure the
// real columns and move everything to the minute: a bar starting at 10:00 begins
// where 10:00 falls inside its day, a name that does not fit becomes the short name,
// and each row of bars is made as tall as its tallest bar.

import { MINUTES_PER_DAY } from '../calendar/days.ts';
import { shownMinute } from '../calendar/time-mode.ts';

// Room under a bar for the lines of the parts running alongside it.
const BAR_TRAIL_SPACE = 7;

export function layoutBars(panel: HTMLElement): void {
  panel.querySelectorAll<HTMLElement>('.week-row').forEach(row => {
    const barsGrid = row.querySelector<HTMLElement>('.bars');
    const dayBoxes = row.querySelectorAll<HTMLElement>('.day-box');
    if (!barsGrid || dayBoxes.length !== 7) return;

    const gridLeft = barsGrid.getBoundingClientRect().left;
    const columns = Array.from(dayBoxes, box => {
      const rect = box.getBoundingClientRect();
      return { left: rect.left - gridLeft, right: rect.right - gridLeft };
    });
    const weekStart = Number(barsGrid.getAttribute('data-week-start'));

    const xOfMinute = (minute: number) => {
      const shown = shownMinute(minute);
      const column = Math.min(6, Math.max(0, Math.floor(shown / MINUTES_PER_DAY) - weekStart));
      const fraction = Math.min(1, Math.max(0,
        (shown - (weekStart + column) * MINUTES_PER_DAY) / MINUTES_PER_DAY));
      return columns[column].left + fraction * (columns[column].right - columns[column].left);
    };

    barsGrid.querySelectorAll<HTMLElement>('.bar').forEach(bar => {
      const first = columns[Number(bar.getAttribute('data-first-column'))];
      const last = columns[Number(bar.getAttribute('data-last-column'))];
      const leftFraction = Number(bar.getAttribute('data-left-fraction'));
      const rightFraction = Number(bar.getAttribute('data-right-fraction'));
      // A pixel of space where a bar starts or ends inside a day, so bars that follow
      // each other do not touch.
      const left = first.left + leftFraction * (first.right - first.left) + (leftFraction > 0 ? 1 : 0);
      const right = Math.max(left + 2,
        last.left + rightFraction * (last.right - last.left) - (rightFraction < 1 ? 1 : 0));
      bar.style.marginLeft = (left - first.left) + 'px';
      bar.style.marginRight = (last.right - right) + 'px';
      const width = right - left;

      // A bar narrower than its own logo is tiny. A one-line bar then shows only its
      // logo at full size, centred on its time (see calendar.css). A two-line bar's logo
      // shrinks to fit inside it.
      const logo = bar.querySelector<HTMLElement>('.bar-head .event-icon, .bar-side-icon .event-icon');
      bar.classList.remove('tiny');
      if (logo) {
        logo.style.width = '';
        logo.style.height = '';
        logo.style.removeProperty('--logo-size');
        const logoSize = logo.getBoundingClientRect().width;
        if (width < logoSize + 6) {
          bar.classList.add('tiny');
          if (bar.classList.contains('phase-lines')) {
            const size = Math.max(6, Math.floor(width - 4));
            logo.style.width = size + 'px';
            logo.style.height = size + 'px';
            logo.style.setProperty('--logo-size', size + 'px');
          }
        }
      }

      const inBar = (x: number) => Math.min(right, Math.max(left, x));
      // With the big logo beside both lines, line two starts after the logo.
      const afterLogo = bar.classList.contains('day-lines') &&
        !bar.classList.contains('too-narrow') && !bar.classList.contains('tiny')
        ? left + parseFloat(window.getComputedStyle(bar).paddingLeft) - 4
        : left;

      bar.querySelectorAll<HTMLElement>('.bar-segment, .bar-inside, .bar-light, .bar-stripe, .bar-part, .bar-window')
        .forEach(element => {
          const isLineTwo = element.classList.contains('bar-segment') ||
            element.classList.contains('bar-inside') || element.classList.contains('bar-part');
          const to = inBar(xOfMinute(Number(element.getAttribute('data-end-minute'))));
          const from = Math.min(to, Math.max(
            inBar(xOfMinute(Number(element.getAttribute('data-start-minute')))),
            isLineTwo ? afterLogo : left));
          // A part's tap area stops short of its white lines, so the lines can still
          // be pointed at.
          const inset = element.classList.contains('bar-inside')
            ? Math.min(3, Math.max(0, (to - from - 8) / 2)) : 0;
          element.style.left = (from - left + inset) + 'px';
          element.style.width = Math.max(0, to - from - 2 * inset) + 'px';
          if (element.classList.contains('bar-light')) {
            const corner = window.getComputedStyle(bar).borderTopLeftRadius;
            const leftCorner = from <= left + 0.5 ? corner : '0';
            const rightCorner = to >= right - 0.5 ? corner : '0';
            element.style.borderRadius = `${leftCorner} ${rightCorner} ${rightCorner} ${leftCorner}`;
          }
        });

      placeFirstPart(bar);

      // A part's logo on line two fits between the two lines.
      bar.querySelectorAll<HTMLElement>('.bar-inside .event-icon').forEach(icon => {
        const holder = icon.parentElement as HTMLElement;
        const size = Math.max(6, Math.min(holder.clientHeight, parseFloat(holder.style.width) - 2));
        icon.style.width = size + 'px';
        icon.style.height = size + 'px';
        icon.style.setProperty('--logo-size', size + 'px');
      });

      // The white lines: only the ones that fall inside the bar.
      bar.querySelectorAll<HTMLElement>('.bar-mark').forEach(mark => {
        const x = xOfMinute(Number(mark.getAttribute('data-minute')));
        mark.style.display = x > left + 1 && x < right - 1 ? '' : 'none';
        mark.style.left = (x - left) + 'px';
      });

      // The logo of a part running alongside sits just before the line where it ends.
      bar.querySelectorAll<HTMLElement>('.bar-stripe-end').forEach(endIcon => {
        const endX = endIcon.getAttribute('data-at-bar-end')
          ? right : xOfMinute(Number(endIcon.getAttribute('data-end-minute')));
        const isInside = endX > left && endX <= right + 1;
        endIcon.style.display = isInside ? '' : 'none';
        endIcon.style.left = Math.max(2, endX - left - endIcon.offsetWidth - 4) + 'px';
      });
    });
  });
}

// The first part on line one starts after the event's name, not at its own time,
// so the name is never written over.
function placeFirstPart(bar: HTMLElement): void {
  const first = bar.querySelector<HTMLElement>('.bar-part.first-part');
  const label = bar.querySelector<HTMLElement>('.bar-head .bar-label');
  if (!first || !label) return;
  if (first.dataset.baseLeft === undefined || first.dataset.laidOut !== first.style.left) {
    first.dataset.baseLeft = String(parseFloat(first.style.left) || 0);
    first.dataset.baseWidth = String(parseFloat(first.style.width) || 0);
  }
  const baseLeft = Number(first.dataset.baseLeft);
  const baseRight = baseLeft + Number(first.dataset.baseWidth);
  const nameRight = nameEnd(bar, label) - bar.getBoundingClientRect().left + 6;
  const left = Math.min(baseRight, Math.max(baseLeft, nameRight));
  first.style.left = left + 'px';
  first.style.width = (baseRight - left) + 'px';
  first.dataset.laidOut = first.style.left;
}

// Names that do not fit:
//   a bar's name becomes the event's short name, then is cut with an ellipsis, and
//     where not even four letters fit the bar shows only its logo;
//   a short part on line two shows its logo instead of its name;
//   a white line or a logo never sits on top of a name.
// Where a text's capitals sit inside its bar: from the top of a capital letter down to
// the line the letters stand on. A capital is 0.71 of the text size in Roboto.
const CAPITAL_HEIGHT_RATIO = 0.71;

function capitalsOf(text: HTMLElement, bar: HTMLElement): { top: number; height: number } {
  const marker = document.createElement('span');
  marker.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
  text.appendChild(marker);
  const baseline = marker.getBoundingClientRect().top - bar.getBoundingClientRect().top;
  marker.remove();
  const height = parseFloat(window.getComputedStyle(text).fontSize) * CAPITAL_HEIGHT_RATIO;
  return { top: baseline - height, height };
}

// Where a bar's name ends on screen: after its short form when that is shown.
function nameEnd(bar: HTMLElement, label: HTMLElement): number {
  const tag = bar.querySelector<HTMLElement>('.bar-head .bar-tag');
  const shown = tag && tag.style.display !== 'none' ? tag : label;
  return shown.getBoundingClientRect().right;
}

// Where a piece of text's first letter is drawn on screen.
function drawnLeft(element: HTMLElement): number {
  const range = document.createRange();
  range.selectNodeContents(element);
  return range.getBoundingClientRect().left;
}

// How wide a piece of text is as drawn on screen, capitals and spacing included.
function drawnWidth(element: HTMLElement): number {
  const range = document.createRange();
  range.selectNodeContents(element);
  return range.getBoundingClientRect().width;
}

export function fitBarLabels(panel: HTMLElement): void {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return;

  // Measured to a fraction of a pixel, because scrollWidth rounds and a name half a
  // pixel too long would still be cut.
  const fits = (element: HTMLElement) => {
    const style = window.getComputedStyle(element);
    const room = element.getBoundingClientRect().width -
      parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    // A part's words sit in their own smaller text inside it, in capitals, so they are
    // measured as drawn rather than from the letters as written.
    const partText = element.querySelector<HTMLElement>('.bar-part-text');
    if (partText) return drawnWidth(partText) <= room + 0.25;
    context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    return element.scrollWidth <= element.clientWidth &&
      context.measureText(element.textContent ?? '').width <= room + 0.25;
  };

  panel.querySelectorAll<HTMLElement>('.bars').forEach(barsGrid => {
    const bars = Array.from(barsGrid.querySelectorAll<HTMLElement>('.bar'));

    // Each pass starts again from the full name and its quiet second name, so a pass
    // after a resize never keeps a short form from the pass before.
    for (const bar of bars) {
      const label = bar.querySelector<HTMLElement>('.bar-head .bar-label');
      if (label) {
        label.dataset.fullName ??= label.textContent ?? '';
        label.textContent = label.dataset.fullName;
      }
      const tag = bar.querySelector<HTMLElement>('.bar-head .bar-tag');
      if (tag) tag.style.display = '';
      bar.classList.remove('too-narrow', 'shows-initials');
    }

    barsGrid.querySelectorAll<HTMLElement>('.bar-chain').forEach(part => {
      const name = part.querySelector<HTMLElement>('.bar-segment-name');
      part.classList.toggle('logo-only',
        Boolean(part.querySelector('.bar-chain-logo')) && Boolean(name) && !fits(name as HTMLElement));
    });

    for (const bar of bars) {
      const label = bar.querySelector<HTMLElement>('.bar-head .bar-label');
      if (!label || bar.classList.contains('too-narrow') || bar.classList.contains('tiny')) continue;
      const nameRight = nameEnd(bar, label) + 3;
      bar.querySelectorAll<HTMLElement>('.bar-mark.end-mark, .bar-stripe-end').forEach(onLineOne => {
        if (onLineOne.style.display === 'none') return;
        if (onLineOne.getBoundingClientRect().left < nameRight) onLineOne.style.display = 'none';
      });
    }

    for (const bar of bars) {
      // Every ticket shows, even at the start of a week where the bar's logo takes the
      // room. A labelled ticket ("×4") on a stretch too short for it grows to the right
      // to fit, and a ticket that would sit under the bar's logo moves to just after it.
      bar.querySelectorAll<HTMLElement>('.opening-mark:not(.at-end) .opening-mark-inside')
        .forEach(inside => {
          const mark = inside.parentElement as HTMLElement;
          if (inside.scrollWidth > inside.clientWidth + 0.5) {
            mark.style.width = (inside.scrollWidth + 2) + 'px';
          }
        });
      const sideIcon = bar.querySelector<HTMLElement>('.bar-side-icon');
      if (sideIcon) {
        const sideRight = sideIcon.getBoundingClientRect().right + 2;
        bar.querySelectorAll<HTMLElement>('.opening-mark').forEach(mark => {
          const icon = mark.querySelector<HTMLElement>('.event-icon, svg');
          if (!icon) return;
          const overlap = sideRight - icon.getBoundingClientRect().left;
          if (overlap > 0) mark.style.left = (parseFloat(mark.style.left) + overlap) + 'px';
        });
      }
      const phase = bar.querySelector<HTMLElement>('.phase-line-one');
      if (!phase) continue;
      const range = document.createRange();
      range.selectNodeContents(phase);
      const text = range.getBoundingClientRect();
      bar.querySelectorAll<HTMLElement>('.bar-mark.end-mark, .bar-stripe-end').forEach(onLineOne => {
        const box = onLineOne.getBoundingClientRect();
        if (box.right > text.left - 3 && box.left < text.right + 3) onLineOne.style.display = 'none';
      });
    }

    // A part's name a little too long for its stretch (BATTLE, in the twelve hours it
    // lasts): its white lines move out, up to 2px on each side, so the name shows whole
    // at its usual size. A name that needs more room than that is cut with "…".
    for (const part of Array.from(barsGrid.querySelectorAll<HTMLElement>('.bar-part'))) {
      const partText = part.querySelector<HTMLElement>('.bar-part-text');
      const bar = part.closest<HTMLElement>('.bar');
      if (!partText || !bar || fits(part)) continue;
      const style = window.getComputedStyle(part);
      const room = part.getBoundingClientRect().width -
        parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const missing = drawnWidth(partText) - room;
      // One pixel of space between the name and each line.
      const extra = Math.ceil(missing + 3) / 2;
      if (extra > 2) continue;
      part.style.left = (parseFloat(part.style.left) - extra) + 'px';
      part.style.width = (parseFloat(part.style.width) + 2 * extra) + 'px';
      const startMinute = part.getAttribute('data-start-minute');
      const endMinute = part.getAttribute('data-end-minute');
      bar.querySelectorAll<HTMLElement>('.bar-mark').forEach(mark => {
        const minute = mark.getAttribute('data-minute');
        if (minute === startMinute) mark.style.left = (parseFloat(mark.style.left) - extra) + 'px';
        if (minute === endMinute) mark.style.left = (parseFloat(mark.style.left) + extra) + 'px';
      });
    }

    // The white lines between parts are only as tall as the parts' capitals, with a
    // pixel above and below, so they frame the words instead of standing over them.
    for (const bar of Array.from(barsGrid.querySelectorAll<HTMLElement>('.bar'))) {
      const partText = bar.querySelector<HTMLElement>('.bar-part-text');
      if (!partText) continue;
      const capitals = capitalsOf(partText, bar);
      bar.querySelectorAll<HTMLElement>('.bar-mark.part-line').forEach(mark => {
        mark.style.top = (capitals.top - 1) + 'px';
        mark.style.height = (capitals.height + 2) + 'px';
      });
    }

    // A name on line 2 that does not fit its stretch takes its shorter name, where it
    // has one (Invitation Transfer becomes "Invite").
    // Only phases: a day's name is never swapped for "Day N".
    barsGrid.querySelectorAll<HTMLElement>('.bar-segment-name[data-phase-short]').forEach(name => {
      const shorter = name.getAttribute('data-phase-short');
      if (shorter && !fits(name)) name.textContent = shorter;
    });

    // Where line 2 starts right under the name (Preview under TAL, a first phase whose
    // name fills its stretch), its first letter lines up exactly with the name's.
    for (const bar of bars) {
      const label = bar.querySelector<HTMLElement>('.bar-head .bar-label');
      if (!label || window.getComputedStyle(label).display === 'none') continue;
      const lineTwo = Array.from(bar.querySelectorAll<HTMLElement>('.bar-sub, .bar-segment-name'))
        .filter(element => window.getComputedStyle(element).display !== 'none' &&
          (element.textContent ?? '').trim() !== '')
        .sort((one, other) => drawnLeft(one) - drawnLeft(other))[0];
      if (!lineTwo) continue;
      const gap = drawnLeft(label) - drawnLeft(lineTwo);
      if (gap === 0 || Math.abs(gap) > 3) continue;
      // A centred name that nearly fills its stretch is written from the left instead,
      // so moving its start moves it by the whole gap, not half of it.
      lineTwo.style.textAlign = 'left';
      const afterAlign = drawnLeft(label) - drawnLeft(lineTwo);
      const padding = parseFloat(window.getComputedStyle(lineTwo).paddingLeft) || 0;
      lineTwo.style.paddingLeft = Math.max(0, padding + afterAlign) + 'px';
    }

    // When the first part does not fit after the full name, the name becomes short.
    for (const bar of bars) {
      const first = bar.querySelector<HTMLElement>('.bar-part.first-part');
      const label = bar.querySelector<HTMLElement>('.bar-head .bar-label');
      if (!first || !label || fits(first)) continue;
      const tag = bar.querySelector<HTMLElement>('.bar-head .bar-tag');
      if (tag && tag.style.display !== 'none') {
        tag.style.display = 'none';
        placeFirstPart(bar);
        if (fits(first)) continue;
      }
      label.textContent = bar.getAttribute('data-short-name');
      placeFirstPart(bar);
    }

    for (const bar of bars) {
      const label = bar.querySelector<HTMLElement>('.bar-head .bar-label');
      if (!label || bar.classList.contains('tiny')) continue;
      const tag = bar.querySelector<HTMLElement>('.bar-head .bar-tag');
      if (fits(label) && (!tag || fits(tag))) continue;
      // Without room for both, the quiet short form goes first; if the name still does
      // not fit, the name itself becomes the short form.
      if (tag) tag.style.display = 'none';
      if (fits(label)) continue;
      label.textContent = bar.getAttribute('data-short-name');
      if (fits(label)) continue;
      // Then the initials, where the event has them ("BIA" after "BIA / KE").
      const initials = bar.getAttribute('data-initials');
      if (initials) {
        label.textContent = initials;
        if (fits(label)) continue;
      }
      const style = window.getComputedStyle(label);
      context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const fourLetters = context.measureText((label.textContent ?? '').slice(0, 4) + '…').width;
      if (label.clientWidth >= fourLetters) continue;
      // An event with initials ("FT") writes them beside its logo rather than show the
      // logo alone with empty space after it. Initials are two or three letters, kept
      // short enough for a one-day bar, so they are always written.
      if (initials) bar.classList.add('shows-initials');
      bar.classList.add('too-narrow');
    }
  });
}

// Each row of bars is as tall as its tallest bar, plus room for the lines under it.
// Every bar in a row takes that height, so a row never mixes heights.
export function sizeLanes(panel: HTMLElement): void {
  panel.querySelectorAll<HTMLElement>('.bars').forEach(barsGrid => {
    const rowHeights: number[] = [];
    const barHeights: number[] = [];
    const allBars = barsGrid.querySelectorAll<HTMLElement>('.bar');

    allBars.forEach(bar => {
      const lane = Number(bar.getAttribute('data-lane'));
      barHeights[lane] = Math.max(barHeights[lane] ?? 0, bar.offsetHeight);
      const trails = Number(bar.getAttribute('data-trail-count')) || 0;
      const needed = bar.offsetHeight + (trails ? BAR_TRAIL_SPACE + 5 * (trails - 1) : 0);
      rowHeights[lane] = Math.max(rowHeights[lane] ?? 0, needed);
    });
    allBars.forEach(bar => {
      const lane = Number(bar.getAttribute('data-lane'));
      if (bar.offsetHeight < barHeights[lane]) bar.style.height = barHeights[lane] + 'px';
    });

    const usual = barsGrid.querySelector<HTMLElement>('.bar:not(.two-lines):not(.phase-lines)');
    const usualHeight = usual ? usual.offsetHeight : 24;
    const rows: string[] = [];
    for (let lane = 0; lane < rowHeights.length; lane++) {
      rows.push((rowHeights[lane] || usualHeight) + 'px');
    }
    barsGrid.style.gridTemplateRows = rows.join(' ');
  });
}
