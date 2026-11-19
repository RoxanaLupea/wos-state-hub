// The year: twelve small months. Each week is a row of dates, with a line under it
// for every one of the four events running that week.
import './year-view.css';
import { startOfMonth, daysInMonth, startOfWeek, textFromDay, todayNumber, weekdayOf, yearAndMonthOf }
  from '../calendar/days.ts';
import { YEAR_VIEW_EVENTS, type YearRun } from '../calendar/year-runs.ts';
import { MONTH_NAMES, WEEKDAY_SHORT, longDayText, shortDayText } from './day-names.ts';
import { escapeForPage } from './escape.ts';
import { eventIcon } from './event-icon.ts';

export function yearView(year: number, runs: YearRun[], pickedRun: string | null): string {
  const today = todayNumber();
  let months = '';

  for (let month = 0; month < 12; month++) {
    const firstOfMonth = startOfMonth(year, month);
    const lastOfMonth = firstOfMonth + daysInMonth(year, month) - 1;
    months += `<div class="mini-month">` +
      `<button type="button" class="mini-month-title" data-open-month="${textFromDay(firstOfMonth)}">` +
      `${MONTH_NAMES[month]}</button>` +
      '<div class="grid7 mini-weekdays">' +
      WEEKDAY_SHORT.map(name => `<span class="mini-weekday">${name.charAt(0)}</span>`).join('') +
      '</div>';

    for (let monday = startOfWeek(firstOfMonth); monday <= lastOfMonth; monday += 7) {
      let dates = '';
      for (let day = monday; day < monday + 7; day++) {
        if (day < firstOfMonth || day > lastOfMonth) {
          dates += '<span></span>';
          continue;
        }
        const classes = ['mini-day'];
        if (weekdayOf(day) > 4) classes.push('weekend');
        if (day === today) classes.push('today');
        dates += `<button type="button" class="${classes.join(' ')}" data-day="${textFromDay(day)}"` +
          ` aria-label="${escapeForPage(longDayText(day))}">${yearAndMonthOf(day).dayOfMonth}</button>`;
      }

      const weekStart = Math.max(monday, firstOfMonth);
      const weekEnd = Math.min(monday + 6, lastOfMonth);
      let lanes = '';
      for (const entry of YEAR_VIEW_EVENTS) {
        const pieces = runs.filter(run =>
          run.entry === entry && run.endDay >= weekStart && run.startDay <= weekEnd);
        if (!pieces.length) continue;
        lanes += '<div class="year-lane">' + pieces.map(run => {
          const from = Math.max(run.startDay, weekStart);
          const to = Math.min(run.endDay, weekEnd);
          const pieceDays = to - from + 1;
          const runDays = run.endDay - run.startDay + 1;
          // The logo sits left of the line where the run starts, and again where it
          // first shows in a month it ran into.
          const showsLogo = from === run.startDay || from === firstOfMonth;
          const name = entry.name + '|' + run.startDay;
          // The colours run along the whole event; this piece shows its own stretch.
          const fill = `<span class="year-line-fill" style="left:${(-(from - run.startDay) * 100 / pieceDays)}%;` +
            `width:${runDays * 100 / pieceDays}%;background:linear-gradient(90deg,${entry.colors})"></span>`;
          const classes = ['year-line'];
          if (from === run.startDay) classes.push('starts');
          if (to === run.endDay) classes.push('ends');
          if (showsLogo) classes.push('with-logo');
          if (pickedRun === name) classes.push('picked');
          const title = entry.name + ' · ' + shortDayText(run.startDay) +
            (run.endDay > run.startDay ? ' – ' + shortDayText(run.endDay) : '');
          return `<button type="button" class="${classes.join(' ')}" data-year-run="${escapeForPage(name)}"` +
            ` style="left:calc(${from - monday} * 100% / 7);width:calc(${pieceDays} * 100% / 7)"` +
            ` title="${escapeForPage(title)}">` +
            (showsLogo ? `<span class="year-line-logo">${eventIcon(entry.logoEventId)}</span>` : '') +
            `<span class="year-line-track">${fill}</span></button>`;
        }).join('') + '</div>';
      }
      months += `<div class="mini-week"><div class="grid7">${dates}</div>${lanes}</div>`;
    }
    months += '</div>';
  }

  const legend = YEAR_VIEW_EVENTS.map(entry =>
    '<span class="year-legend-item">' +
    `<span class="year-line-logo">${eventIcon(entry.logoEventId)}</span>` +
    `<span class="year-legend-line" style="background:linear-gradient(90deg,${entry.colors})"></span>` +
    `${escapeForPage(entry.name)}</span>`).join('');

  return `<div class="year-grid">${months}</div><div class="year-legend">${legend}</div>`;
}
