// The game runs on UTC. A player can read the calendar either on the game's clock or
// on their own, and that one choice moves every time, every bar and every day border
// on the page. Everything that turns a moment into something on screen goes through
// here.
import { MINUTES_PER_DAY } from './days.ts';

export type TimeMode = 'game' | 'local';

let timeMode: TimeMode = 'game';

export function setTimeMode(mode: TimeMode): void {
  timeMode = mode;
}

export function currentTimeMode(): TimeMode {
  return timeMode;
}

export function showsLocalTime(): boolean {
  return timeMode === 'local';
}

// How far the shown clock is from the game's clock at a moment. Worked out at that
// moment rather than once, because summer time moves it during the year.
export function shiftAt(minute: number): number {
  return showsLocalTime() ? -new Date(minute * 60000).getTimezoneOffset() : 0;
}

export function shownMinute(minute: number): number {
  return minute + shiftAt(minute);
}

export function shownDayOf(minute: number): number {
  return Math.floor(shownMinute(minute) / MINUTES_PER_DAY);
}

// The moments a shown day starts and ends. On the player's own clock in UTC+2 a day
// runs from 22:00 the day before to 22:00 in game time.
export function windowOfShownDay(day: number): { start: number; end: number } {
  const start = day * MINUTES_PER_DAY;
  const end = (day + 1) * MINUTES_PER_DAY;
  return { start: start - shiftAt(start), end: end - shiftAt(end) };
}

export function nowMinute(): number {
  return Math.floor(Date.now() / 60000);
}

// "UTC+2", or "UTC" where the player's clock is the game's.
export function localOffsetLabel(): string {
  const offsetMinutes = -new Date().getTimezoneOffset();
  if (offsetMinutes === 0) return 'UTC';
  const hours = Math.floor(Math.abs(offsetMinutes) / 60);
  const minutes = Math.abs(offsetMinutes) % 60;
  return 'UTC' + (offsetMinutes > 0 ? '+' : '−') + hours +
    (minutes ? ':' + String(minutes).padStart(2, '0') : '');
}

// "Game time (UTC)" or "Your time (UTC+2)": which clock the times on screen use.
export function timeModeText(): string {
  return showsLocalTime() ? 'Your time (' + localOffsetLabel() + ')' : 'Game time (UTC)';
}

// A moment as hours and minutes on the game's clock, whatever the page is set to
// show. The clock in the navigation bar always reads game time, because it is there
// to answer "what time is it in the game", not to follow one page's setting.
export function gameClockText(minute: number): string {
  const inDay = ((minute % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return String(Math.floor(inDay / 60)).padStart(2, '0') + ':' +
    String(inDay % 60).padStart(2, '0');
}

// A moment as hours and minutes on the shown clock.
export function clockText(minute: number): string {
  const shown = shownMinute(minute);
  const inDay = ((shown % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return String(Math.floor(inDay / 60)).padStart(2, '0') + ':' +
    String(inDay % 60).padStart(2, '0');
}
