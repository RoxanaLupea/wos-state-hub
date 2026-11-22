// The play windows of an event played at set times each day (Wild Brawl): a thin line
// for the day with each window marked on it, and the window itself ("02–04") under its
// mark. Colour goes only where it means something: the windows are in the event's light
// colour, every window already over is dimmed, and on today the open window, or else
// the next one, stands out with its label in white.
import { logoColors } from '../data/catalog.ts';
import { nowMinute, windowText } from '../calendar/time-mode.ts';
import { escapeForPage } from './escape.ts';

export function playLineMarkup(
  eventTypeId: string,
  windows: { start: number; end: number }[],
  dayWindow: { start: number; end: number }
): string {
  if (!windows.length) return '';
  const { light } = logoColors(eventTypeId);
  const dayLength = dayWindow.end - dayWindow.start;
  const at = (minute: number) => Math.min(100, Math.max(0, (minute - dayWindow.start) / dayLength * 100));
  const now = nowMinute();
  const isToday = now >= dayWindow.start && now < dayWindow.end;
  // The window that matters now: the one open, or else the next one today.
  const current = isToday
    ? windows.find(one => one.start <= now && now < one.end) ?? windows.find(one => one.start > now)
    : undefined;
  const marks = windows.map(one => {
    const state = one === current ? ' now' : one.end <= now ? ' past' : '';
    return `<span class="play-mark${state}" style="left:${at(one.start).toFixed(2)}%;width:${(at(one.end) - at(one.start)).toFixed(2)}%">` +
      `<span class="play-mark-time">${escapeForPage(windowText(one.start, one.end))}</span></span>`;
  }).join('');
  return `<span class="play-line" style="--play-light:${light}">${marks}</span>`;
}
