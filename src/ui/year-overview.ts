// The year view's side panel: the four events now or next, and the steps of whichever
// one is picked.
import { clockText, nowMinute } from '../calendar/time-mode.ts';
import { shownDayOf } from '../calendar/time-mode.ts';
import { YEAR_VIEW_EVENTS, runEndMinute, runName, runStartMinute, type RunStep, type YearRun }
  from '../calendar/year-runs.ts';
import { eventTypeName } from '../data/catalog.ts';
import { shortDayText } from './day-names.ts';
import { escapeForPage } from './escape.ts';
import { eventBadge } from './event-icon.ts';

// The event's name without anything in brackets after it.
function plainName(eventTypeId: string): string {
  return eventTypeName(eventTypeId).replace(/\s*\([^)]*\)\s*$/, '');
}

export interface YearOverviewOptions {
  stepsOf: (run: YearRun) => RunStep[];
  pickedRun: string | null;
}

export function yearOverview(runs: YearRun[], options: YearOverviewOptions): string {
  const now = nowMinute();

  // Each event's run now, or its next one.
  const shownRuns = YEAR_VIEW_EVENTS.map(entry => {
    const mine = runs.filter(run => run.entry === entry);
    return mine.find(run => runStartMinute(run) <= now && runEndMinute(run) > now) ??
      mine.find(run => runStartMinute(run) > now) ?? null;
  });

  let picked = options.pickedRun
    ? runs.find(run => runName(run) === options.pickedRun) ?? null : null;
  if (!picked) {
    picked = shownRuns.find(run => run !== null && runStartMinute(run) <= now) ??
      shownRuns.filter((run): run is YearRun => run !== null)
        .sort((left, right) => runStartMinute(left) - runStartMinute(right))[0] ?? null;
  }

  const rows = shownRuns.map((run, index) => {
    if (!run) return '';
    const entry = YEAR_VIEW_EVENTS[index];
    const isRunning = runStartMinute(run) <= now;
    const steps = options.stepsOf(run);
    const currentStep = steps.filter(step => step.minute <= now).pop();
    const status = isRunning
      ? 'Now' + (currentStep ? ': ' + currentStep.name : '') +
        ' · until ' + shortDayText(shownDayOf(runEndMinute(run) - 1))
      : 'Next: ' + shortDayText(shownDayOf(runStartMinute(run))) +
        ' – ' + shortDayText(shownDayOf(runEndMinute(run) - 1));
    const name = entry.eventTypeIds[0] ? plainName(entry.eventTypeIds[0]) : entry.name;
    return `<button type="button" class="year-overview-row${picked === run ? ' picked' : ''}"` +
      ` data-year-run="${escapeForPage(runName(run))}">` +
      `${eventBadge(entry.logoEventId, 'list')}` +
      `<span class="year-overview-text"><b>${escapeForPage(name)}</b>` +
      `<span>${escapeForPage(status)}</span></span></button>`;
  }).join('');

  let html = `<section class="day-section glass year-overview"><h3>Now and next</h3>${rows}</section>`;

  if (picked) {
    const steps = options.stepsOf(picked);
    const isRunning = runStartMinute(picked) <= now && runEndMinute(picked) > now;
    const currentStep = isRunning ? steps.filter(step => step.minute <= now).pop() : null;
    const name = picked.entry.eventTypeIds[0]
      ? plainName(picked.entry.eventTypeIds[0]) : picked.entry.name;
    const stepRows = steps.map(step => {
      const time = clockText(step.minute);
      const when = shortDayText(shownDayOf(step.minute)) + (time === '00:00' ? '' : ' · ' + time);
      return `<li class="${step === currentStep ? 'now' : ''}">` +
        `<span class="year-step-when">${escapeForPage(when)}</span>` +
        `<span class="year-step-name">${escapeForPage(step.name)}` +
        `${step === currentStep ? ' <em>now</em>' : ''}</span></li>`;
    }).join('');
    html += `<section class="day-section glass year-steps"><h3>${escapeForPage(name)}</h3>` +
      `<span class="event-note">${escapeForPage(shortDayText(picked.startDay) + ' – ' + shortDayText(picked.endDay))}</span>` +
      `<ol class="year-step-list">${stepRows}</ol></section>`;
  }
  return html;
}
