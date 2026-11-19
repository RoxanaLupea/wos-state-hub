import './ui/tokens.css';
import './ui/layout.css';
import { isDatabaseConfigured } from './data/database.ts';
import { allianceFamilyOf, allianceTag, loadAlliances, rememberAlliances } from './data/alliances.ts';
import { loadDateChanges, loadSchedules, loadSettings } from './data/schedules.ts';
import {
  categoryOf, dayNameOf, eventStepsByEventType, eventTypeName, isDetailsOnly,
  partOfByEventTypeId, phaseName, phaseNameForDay, phasesByEventType, sortOrderOf, stepLabel
} from './data/catalog.ts';
import {
  minutesFromTime, startOfMonth, startOfWeek, todayNumber, yearAndMonthOf, dayFromText
} from './calendar/days.ts';
import { buildOccurrences, groupChanges, type ExpandOptions, type Schedule } from './calendar/occurrences.ts';
import { buildBarsForRange, type Bar } from './calendar/bars.ts';
import { daySegments } from './calendar/day-segments.ts';
import { contentsOfDay } from './calendar/day-timeline.ts';
import { clockText, nowMinute, setTimeMode, type TimeMode } from './calendar/time-mode.ts';
import { yearRunSteps, yearViewRuns, type YearRun } from './calendar/year-runs.ts';
import { calendarToolbar, topBar, type CalendarView } from './ui/shell.ts';
import { CATEGORY_ORDER, DEFAULT_CATEGORIES, categoryChips } from './ui/category-chips.ts';
import { monthGridRange, monthTitle, monthView } from './ui/month-view.ts';
import { weekTitle, weekView } from './ui/week-view.ts';
import { yearView } from './ui/year-view.ts';
import { yearOverview } from './ui/year-overview.ts';
import { dayPanel } from './ui/day-panel.ts';
import { nextUpTiles } from './ui/next-up.ts';
import { problemPanel } from './ui/problem-panel.ts';
import { installIconFallback } from './ui/event-icon.ts';
import { fitBarLabels, layoutBars, sizeLanes } from './ui/layout-bars.ts';

const STATE_NUMBER = '1458';

// What the page is looking at. Changing these and calling draw() is the whole of it.
const view = {
  openPage: 'calendar',
  calendarView: 'month' as CalendarView,
  // The day the calendar is built around: the month or week it falls in.
  focusDay: todayNumber(),
  chosenDay: todayNumber(),
  // On a phone the day's details slide up over the calendar.
  isPanelOpen: false,
  shownCategories: new Set<string>(DEFAULT_CATEGORIES),
  // Which alliance the player is in. Nothing is picked until they sign in, and until
  // then no alliance times show, the same as in the old app.
  myAllianceId: null as string | null,
  hiddenEvents: new Set<string>(),
  openFilterList: null as string | null,
  pickedYearRun: null as string | null
};

let expandOptions: ExpandOptions | null = null;
let transferFollows: 'svs' | 'sunfire' = 'svs';
let schedules: Schedule[] = [];

function runsBetween(fromDay: number, toDay: number) {
  if (!expandOptions) return [];
  return buildOccurrences(fromDay, toDay, transferFollows, expandOptions);
}

function barOptions() {
  return {
    phasesByEventType, minutesFromTime, isDetailsOnly, categoryOf, partOfByEventTypeId,
    shownCategories: view.shownCategories, hiddenEvents: view.hiddenEvents,
    myAllianceIds: allianceFamilyOf(view.myAllianceId)
  };
}

function weekRowOptions() {
  return {
    pieceOptions: {
      daySegmentsOf: (bar: Bar) => daySegments(bar, dayNameOf),
      partOfByEventTypeId, categoryOf, categoryOrder: CATEGORY_ORDER, sortOrderOf,
      phaseNameOf: phaseName
    },
    barOptions: { partOfByEventTypeId, lit: null },
    chosenDay: view.chosenDay
  };
}

// The stretch of days the view on screen needs, and the title above it.
function viewRange(): { from: number; to: number; title: string } {
  const { year, month } = yearAndMonthOf(view.focusDay);
  if (view.calendarView === 'month') {
    const range = monthGridRange(year, month);
    return { ...range, title: monthTitle(year, month) };
  }
  if (view.calendarView === 'week') {
    const weekStart = startOfWeek(view.focusDay);
    return { from: weekStart, to: weekStart + 6, title: weekTitle(weekStart) };
  }
  const yearStart = startOfMonth(year, 0);
  const yearEnd = startOfMonth(year + 1, 0) - 1;
  return { from: yearStart, to: yearEnd, title: String(year) };
}

function yearRunsForView(): YearRun[] {
  const today = todayNumber();
  return yearViewRuns(runsBetween(today - 400, today + 400), { partOfByEventTypeId, sortOrderOf });
}

function calendarBody(range: { from: number; to: number }): string {
  if (view.calendarView === 'year') {
    return yearView(yearAndMonthOf(view.focusDay).year, yearRunsForView(), view.pickedYearRun);
  }
  // A week either side, so a bar reaching into the view is whole.
  const runs = runsBetween(range.from - 8, range.to + 8);
  const bars = buildBarsForRange(runs, range.from, range.to, barOptions());
  if (view.calendarView === 'week') {
    return weekView(startOfWeek(view.focusDay), bars, weekRowOptions());
  }
  const { year, month } = yearAndMonthOf(view.focusDay);
  return monthView(year, month, bars, weekRowOptions());
}

function sideColumn(): string {
  if (view.calendarView === 'year') {
    const runs = yearRunsForView();
    return '<div class="day-panel">' + yearOverview(runs, {
      pickedRun: view.pickedYearRun,
      stepsOf: run => yearRunSteps(run, phasesByEventType, minutesFromTime, phaseName, eventTypeName)
    }) + '</div>';
  }

  const day = view.chosenDay;
  const myAllianceIds = allianceFamilyOf(view.myAllianceId);
  const contents = contentsOfDay(
    runsBetween(day - 8, day + 8).filter(one => {
      const category = one.allianceIds.length ? 'alliance' : categoryOf(one.eventTypeId);
      return view.shownCategories.has(category) &&
        !view.hiddenEvents.has(category + '|' + (partOfByEventTypeId.get(one.eventTypeId) ?? one.eventTypeId));
    }),
    day,
    {
      stepsByEventType: eventStepsByEventType, nameOf: eventTypeName, stepLabel,
      phaseNameForDay, myAllianceIds,
      allianceTagsOf: one => one.allianceIds.length
        ? ' · ' + one.allianceIds.filter(id => myAllianceIds.includes(id)).map(allianceTag).join(', ')
        : '',
      lengthOf: one => one.endMinute - one.startMinute
    });

  const today = todayNumber();
  const next = runsBetween(today, today + 60);
  return `<div class="next-up">${nextUpTiles(next)}</div>` +
    dayPanel(day, contents, view.isPanelOpen);
}

function draw(): void {
  const app = document.getElementById('app');
  if (!app) return;
  const range = viewRange();

  app.innerHTML = topBar(STATE_NUMBER, view.openPage) +
    `<main class="page">` +
      calendarToolbar(range.title, view.calendarView) +
      // The year view has its own four events, so the filters do not apply to it.
      (view.calendarView === 'year' ? '' :
        `<div class="chips">${categoryChips({
          shownCategories: view.shownCategories,
          hiddenEvents: view.hiddenEvents,
          openList: view.openFilterList,
          eventTypeIdsWithAllianceTimes: eventTypeIdsWithAllianceTimes()
        })}</div>`) +
      '<div class="calendar-layout">' +
        `<section class="calendar-panel glass ${view.calendarView}-mode">${calendarBody(range)}</section>` +
        `<div class="side-column">${sideColumn()}</div>` +
      '</div>' +
    '</main>';

  const panel = app.querySelector<HTMLElement>('.calendar-panel');
  if (panel && view.calendarView !== 'year') {
    layoutBars(panel);
    fitBarLabels(panel);
    sizeLanes(panel);
  }
}

function eventTypeIdsWithAllianceTimes(): Set<string> {
  const ids = new Set<string>();
  for (const schedule of schedules) {
    if (schedule.allianceIds) ids.add(schedule.eventTypeId);
  }
  return ids;
}

// Moving a month, a week or a year at a time, depending on the view.
function step(direction: number): void {
  if (direction === 0) {
    view.focusDay = todayNumber();
    view.chosenDay = todayNumber();
    return;
  }
  if (view.calendarView === 'week') {
    view.focusDay = startOfWeek(view.focusDay) + direction * 7;
    return;
  }
  const { year, month } = yearAndMonthOf(view.focusDay);
  if (view.calendarView === 'year') {
    view.focusDay = startOfMonth(year + direction, month);
    return;
  }
  const moved = new Date(Date.UTC(year, month + direction, 1));
  view.focusDay = startOfMonth(moved.getUTCFullYear(), moved.getUTCMonth());
}

function handleClicks(event: MouseEvent): void {
  const target = event.target as HTMLElement | null;
  if (!target) return;

  const stepButton = target.closest<HTMLElement>('[data-step]');
  if (stepButton) { step(Number(stepButton.dataset.step)); draw(); return; }

  const viewButton = target.closest<HTMLElement>('[data-view]');
  if (viewButton) {
    view.calendarView = viewButton.dataset.view as CalendarView;
    draw();
    return;
  }

  const timeButton = target.closest<HTMLElement>('[data-time-mode]');
  if (timeButton) {
    setTimeMode(timeButton.dataset.timeMode as TimeMode);
    draw();
    return;
  }

  const listButton = target.closest<HTMLElement>('[data-filter-list]');
  if (listButton) {
    const category = listButton.dataset.filterList as string;
    view.openFilterList = view.openFilterList === category ? null : category;
    draw();
    return;
  }

  const allButton = target.closest<HTMLElement>('[data-filter-all]');
  if (allButton) {
    const category = allButton.dataset.filterAll as string;
    const events = eventKeysOf(category);
    const allShown = events.every(key => !view.hiddenEvents.has(key));
    for (const key of events) {
      if (allShown) view.hiddenEvents.add(key);
      else view.hiddenEvents.delete(key);
    }
    draw();
    return;
  }

  const eventButton = target.closest<HTMLElement>('[data-filter-event]');
  if (eventButton) {
    const key = eventButton.dataset.filterEvent as string;
    if (view.hiddenEvents.has(key)) view.hiddenEvents.delete(key);
    else view.hiddenEvents.add(key);
    draw();
    return;
  }

  const chipButton = target.closest<HTMLElement>('[data-category]');
  if (chipButton) {
    const category = chipButton.dataset.category as string;
    if (view.shownCategories.has(category)) view.shownCategories.delete(category);
    else view.shownCategories.add(category);
    draw();
    return;
  }

  const monthButton = target.closest<HTMLElement>('[data-open-month]');
  if (monthButton) {
    view.focusDay = dayFromText(monthButton.dataset.openMonth as string);
    view.calendarView = 'month';
    draw();
    return;
  }

  const runButton = target.closest<HTMLElement>('[data-year-run]');
  if (runButton) {
    const name = runButton.dataset.yearRun as string;
    view.pickedYearRun = view.pickedYearRun === name ? null : name;
    draw();
    return;
  }

  if (target.closest('[data-close-day]')) { view.isPanelOpen = false; draw(); return; }

  const dayButton = target.closest<HTMLElement>('[data-day]');
  if (dayButton) {
    view.chosenDay = dayFromText(dayButton.dataset.day as string);
    view.focusDay = view.chosenDay;
    view.isPanelOpen = true;
    if (view.calendarView === 'year') view.calendarView = 'month';
    draw();
  }
}

function eventKeysOf(category: string): string[] {
  const ids = new Set<string>();
  for (const schedule of schedules) {
    if (categoryOf(schedule.eventTypeId) === category || (category === 'alliance' && schedule.allianceIds)) {
      ids.add(partOfByEventTypeId.get(schedule.eventTypeId) ?? schedule.eventTypeId);
    }
  }
  return [...ids].map(id => category + '|' + id);
}

async function start(): Promise<void> {
  const app = document.getElementById('app');
  if (!app) throw new Error('The page is missing its #app element.');
  app.className = 'app';
  installIconFallback();

  if (!isDatabaseConfigured()) {
    app.innerHTML = topBar(STATE_NUMBER, view.openPage) + '<main class="page">' + problemPanel(
      'The database address or key is missing. Copy .env.example to .env, fill in both ' +
      'values from the Supabase project, then restart the dev server.') + '</main>';
    return;
  }

  try {
    const [loadedSchedules, changes, settings] = await Promise.all([
      loadSchedules(), loadDateChanges(), loadSettings()
    ]);
    // Alliance names are wanted on bars and panels, but nothing stops without them.
    rememberAlliances(await loadAlliances().catch(() => []));

    schedules = loadedSchedules;
    transferFollows = settings.get('transferFollows') === 'sunfire' ? 'sunfire' : 'svs';
    expandOptions = {
      allSchedules: loadedSchedules,
      changesBySchedule: groupChanges(changes),
      partOfByEventTypeId
    };

    document.addEventListener('click', handleClicks);
    // The clock in the top bar, and the bars when the window changes width.
    window.setInterval(() => {
      const clock = document.getElementById('clockTime');
      if (clock) clock.textContent = clockText(nowMinute());
    }, 30000);
    window.addEventListener('resize', () => {
      const panel = document.querySelector<HTMLElement>('.calendar-panel');
      if (!panel || view.calendarView === 'year') return;
      layoutBars(panel);
      fitBarLabels(panel);
      sizeLanes(panel);
    });
    draw();
  } catch (problem) {
    const message = problem instanceof Error ? problem.message : String(problem);
    app.innerHTML = topBar(STATE_NUMBER, view.openPage) +
      '<main class="page">' + problemPanel(message) + '</main>';
  }
}

void start();
