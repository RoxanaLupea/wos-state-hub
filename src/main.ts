import './ui/tokens.css';
import './ui/layout.css';
import { allianceById, allianceFamilyOf, allianceTag, alliancesStillHere, loadAlliances, rememberAlliances, type Alliance } from './data/alliances.ts';
import {
  loadFortAssignments, loadRallyLeads, loadBuffAllocations,
  type FortAssignment, type RallyLead, type BuffAllocation
} from './data/forts.ts';
import { fortressPlanning } from './ui/fortress-planning.ts';
import { phaseOf, seasonNumberOf, seasonStartFor, FORT_PHASES } from './calendar/fort-season.ts';
import { fortressBoard, seasonTotals } from './ui/fortress.ts';
import { loadTransferDates, loadTransferGroups } from './data/transfer-groups.ts';
import {
  loadTransferWindows, loadCandidatesOf,
  type TransferWindow, type TransferCandidate
} from './data/transfers.ts';
import { nextTransferPage, pastTransfersPage } from './ui/transfers.ts';
import { layoutPredictions } from './ui/layout-predictions.ts';
import {
  bigGroupsOf, followsOf, groupOfState,
  type TransferFollows, type TransferGroup
} from './data/transfer-rules.ts';
import {
  predictionsPage, predictionsControls, type PredictionsOptions
} from './ui/predictions.ts';
import { allianceTimesPage, statePage } from './ui/state-page.ts';
import { loadDateChanges, loadSchedules, loadSettings } from './data/schedules.ts';
import {
  categoryOf, dayNameOf, eventStepsByEventType, eventTypeById, eventTypeName, eventTypeShortName,
  isDetailsOnly, partOfByEventTypeId, phaseName, phaseNameForDay, phaseShortName, phasesByEventType,
  pointSourcesForDay, sortOrderOf, stepLabel
} from './data/catalog.ts';
import {
  minutesFromTime, startOfMonth, startOfWeek, textFromDay, todayNumber, yearAndMonthOf, dayFromText, MINUTES_PER_DAY
} from './calendar/days.ts';
import { buildOccurrences, groupChanges, type ExpandOptions, type Occurrence, type Schedule } from './calendar/occurrences.ts';
import { buildBarsForRange, type Bar } from './calendar/bars.ts';
import { daySegments } from './calendar/day-segments.ts';
import { contentsOfDay } from './calendar/day-timeline.ts';
import { buildEventTree, familyOccurrences } from './calendar/event-tree.ts';
import { gameClockText, nowMinute, setTimeMode, type TimeMode } from './calendar/time-mode.ts';
import { yearRunSteps, yearViewRuns, type YearRun } from './calendar/year-runs.ts';
import { PAGES, calendarToolbar, pageById, sectionNav, topBar, type CalendarView } from './ui/shell.ts';
import { pagePlan } from './ui/page-plan.ts';
import { playerPage } from './ui/player-page.ts';
import { CATEGORY_ORDER, DEFAULT_CATEGORIES, categoryChips, filterListEvents } from './ui/category-chips.ts';
import { monthGridRange, monthTitle, monthView } from './ui/month-view.ts';
import { weekTitle, weekView } from './ui/week-view.ts';
import { yearView } from './ui/year-view.ts';
import { yearOverview } from './ui/year-overview.ts';
import { dayPanel } from './ui/day-panel.ts';
import { eventPanel, groupPanel, type RewardViewState } from './ui/event-panel.ts';
import { partOpenings } from './ui/bar.ts';
import { nextUpTiles } from './ui/next-up.ts';
import { problemPanel } from './ui/problem-panel.ts';
import { installIconFallback, setImageBase } from './ui/event-icon.ts';
import { fitBarLabels, layoutBars, sizeLanes } from './ui/layout-bars.ts';

const STATE_NUMBER = '1458';
// The season the first written-down battle day belongs to, so later seasons can be
// counted forward from it.
const FIRST_FORT_SEASON = 16;

// What the page is looking at. Changing these and calling draw() is the whole of it.
const view = {
  openPage: 'calendar',
  // The page inside the open section. Empty means the section's first one.
  openSubPage: '',
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
  pickedYearRun: null as string | null,
  // The first of the transfer dates on screen, and what is filtered out.
  predictionFirstDate: '',
  // Which battles' transfers are listed. At least one of the two stays on.
  predictionShowsSvs: true,
  predictionShowsSunfire: true,
  // 'all' or 'mine': the whole list, or our own group.
  predictionScope: 'mine',
  // What is typed in the state box, kept as written.
  // True to show each group as one row rather than its subgroups.
  predictionMergesGroups: false,
  // The run whose own page is open, and which half of it is shown.
  openEventKey: null as string | null,
  openEventView: 'timeline',
  // The day the open event was tapped on, used to find it among the runs nearby.
  openEventDay: todayNumber(),
  // The day it was opened from, when it was opened from a day's timeline.
  openedFromDay: null as number | null,
  // What was tapped to open it and the minute that starts, which picks the row to mark
  // when the event is not running.
  tappedKey: null as string | null,
  tappedMinute: NaN,
  // Set when an event has just been opened, so the panel scrolls to its marked row.
  scrollsToMarkedRow: false,
  pickedRowKey: null as string | null,
  // Which alliance times the player follows, by schedule.
  followedScheduleIds: new Set<string>(),
  rewardView: {
    openList: new Map<string, string>(),
    openBand: new Map<string, string>()
  } as RewardViewState
};

let expandOptions: ExpandOptions | null = null;
let transferFollows: 'svs' | 'sunfire' = 'svs';
let schedules: Schedule[] = [];
// The first fortress battle day ever written down, which every season is counted from.
let firstFortBattleDay = NaN;
let fortAssignments: FortAssignment[] = [];
let rallyLeads: RallyLead[] = [];
let buffAllocations: BuffAllocation[] = [];
// How many of each buff a lead of that tier collects, from the settings.
let buffsPerCastleLead = 2;
let buffsPerTurretLead = 1;
// Every date the predictions hold, and the groups of the one on screen.
let transferDates: string[] = [];
let transferWindows: TransferWindow[] = [];
let transferCandidates: TransferCandidate[] = [];
// The published ranges on the next window's date, for the group this state is in.
let nextWindowGroups: TransferGroup[] = [];
let transferGroups: TransferGroup[] = [];
// The days the SvS battle and Sunfire Castle fall on, so each transfer can say which
// of them it follows.
let svsBattleDays = new Set<number>();
let sunfireDays = new Set<number>();
let alliances: Alliance[] = [];

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
      phaseNameOf: phaseName, phaseShortNameOf: phaseShortName
    },
    barOptions: { partOfByEventTypeId, lit: null, litKeys: litEventKeys() },
    // While an event is open, it is lit and no day is picked.
    chosenDay: view.openEventKey ? NaN : view.chosenDay
  };
}

// The runs of the event open in the panel: the run itself, its parts, and the whole it
// is a part of. A gathered bar of alliance times is lit by its own key.
function litEventKeys(): Set<string> {
  const key = view.openEventKey;
  if (!key || view.calendarView === 'year') return new Set();
  if (key.startsWith('group|')) return new Set([key]);
  const nearby = runsBetween(view.openEventDay - 40, view.openEventDay + 40);
  const occurrence = nearby.find(one => one.key === key) ??
    nearby.find(one => key.startsWith(one.key + '|'));
  if (!occurrence) return new Set();
  return new Set(familyOccurrences(occurrence, nearby, partOfByEventTypeId).map(one => one.key));
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

// The column beside the calendar: the next two events, then one panel box. The box
// holds the year's overview, an open event, a gathered bar's times, or the chosen
// day. It is always the same box, so it scrolls on its own on a computer and slides
// up over the calendar on a phone, whatever is in it.
function sideColumn(): string {
  const today = todayNumber();
  const nextUp = `<div class="next-up">${nextUpTiles(runsBetween(today, today + 60))}</div>`;
  const contents = panelContents();
  // An open event keeps its way back and its head in place; only its body scrolls.
  const holdsEvent = contents.includes('class="event-page-body"');
  return nextUp +
    `<aside class="day-panel${view.isPanelOpen ? ' open' : ''}${holdsEvent ? ' holds-event' : ''}"` +
    ` aria-label="Day details">` + contents + '</aside>';
}

const BACK_ARROW_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
  ' stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>';

function panelContents(): string {
  if (view.calendarView === 'year') {
    const runs = yearRunsForView();
    return `<button type="button" class="day-back" data-close-day>${BACK_ARROW_SVG}Back</button>` +
      yearOverview(runs, {
        pickedRun: view.pickedYearRun,
        stepsOf: run => yearRunSteps(run, phasesByEventType, minutesFromTime, phaseName, eventTypeName)
      });
  }

  const day = view.chosenDay;
  const myAllianceIds = allianceFamilyOf(view.myAllianceId);

  if (view.openEventKey) {
    const opened = openEventMarkup(view.openEventKey, view.openEventDay, myAllianceIds);
    if (opened) return opened;
    view.openEventKey = null;
  }
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

  return dayPanel(day, contents, {
    needsAlliancePick: view.shownCategories.has('alliance') && !myAllianceIds.length
  });
}

// What a gathered bar's key looks like: "group|<event type>|<day>".
function groupPanelMarkup(key: string, myAllianceIds: string[]): string | null {
  const parts = key.split('|');
  const eventTypeId = parts[1];
  const day = Number(parts[2]);
  if (!eventTypeById(eventTypeId) || Number.isNaN(day)) return null;

  const window = { start: day * 1440, end: (day + 1) * 1440 };
  const times = runsBetween(day - 1, day + 1)
    .filter(one => one.eventTypeId === eventTypeId && one.allianceIds.length > 0 &&
      one.allianceIds.some(id => myAllianceIds.includes(id)) &&
      one.startMinute < window.end && one.endMinute > window.start)
    .sort((left, right) => nameOfAllianceTime(left).localeCompare(nameOfAllianceTime(right)) ||
      left.startMinute - right.startMinute);

  return groupPanel({
    eventTypeId, day, times, backToDay: view.openedFromDay,
    nameOfTime: nameOfAllianceTime,
    followedScheduleIds: view.followedScheduleIds
  });
}

// "DVL BT1": the alliance tags of a time, and which of the event's slots it is.
function nameOfAllianceTime(occurrence: Occurrence): string {
  const tags = occurrence.allianceIds.map(allianceTag).join(', ');
  const group = occurrence.groupNumber ? ' ' + occurrence.groupNumber : '';
  return tags + group;
}

function openEventMarkup(key: string, day: number, myAllianceIds: string[]): string | null {
  if (key.startsWith('group|')) return groupPanelMarkup(key, myAllianceIds);

  // A run's key is its schedule and its date. A phase bar adds the phase on the end,
  // so the run is the one whose whole key starts the bar's key.
  const nearby = runsBetween(day - 40, day + 40);
  const occurrence = nearby.find(one => one.key === key) ??
    nearby.find(one => key.startsWith(one.key + '|'));
  if (!occurrence) return null;

  const tree = buildEventTree(occurrence, nearby, {
    phasesByEventType, stepsByEventType: eventStepsByEventType, minutesFromTime,
    partOfByEventTypeId, nameOf: eventTypeName, shortNameOf: eventTypeShortName,
    phaseNameOf: phaseName, stepLabel, dayNameOf,
    pointSourceIdsForDay: (eventTypeId, dayNumber) =>
      pointSourcesForDay(eventTypeId, dayNumber).map(source => source.id),
    hasOwnPoints: (eventTypeId, dayNumber) =>
      pointSourcesForDay(eventTypeId, dayNumber).some(source => source.dayNumber === dayNumber),
    openingsOf: partOpenings,
    marksOpeningsByLabel: eventTypeId => eventTypeById(eventTypeId)?.windowMark === 'label',
    pickedRowKey: view.pickedRowKey,
    tappedKey: view.tappedKey,
    tappedMinute: view.tappedMinute
  });

  // Each alliance's own times for this event over these days.
  const allianceTimes = occurrence.allianceIds.length === 0
    ? nearby.filter(other => other.eventTypeId === occurrence.eventTypeId &&
        other.allianceIds.length > 0 &&
        other.allianceIds.some(id => myAllianceIds.includes(id)) &&
        other.startDay >= occurrence.startDay && other.startDay <= occurrence.endDay)
      .sort((left, right) => left.startMinute - right.startMinute)
    : [];

  const dayInEvent = Math.min(Math.max(day - occurrence.startDay + 1, 1), occurrence.lengthDays);

  return eventPanel(occurrence, {
    tree, day, dayOfEvent: dayInEvent,
    allianceTags: occurrence.allianceIds.length
      ? ' · ' + occurrence.allianceIds.filter(id => myAllianceIds.includes(id)).map(allianceTag).join(', ')
      : '',
    allianceTimes,
    allianceTagsOf: other => other.allianceIds.filter(id => myAllianceIds.includes(id))
      .map(allianceTag).join(', '),
    shownView: view.openEventView,
    rewardView: view.rewardView,
    changeNote: occurrence.note,
    backToDay: view.openedFromDay
  });
}

// The fortress board for the phase on screen. Without the season's first battle day
// there is nothing to count from, so the plan for the page shows instead.
function fortressBoardMarkup(): string {
  if (Number.isNaN(firstFortBattleDay)) return '';
  const today = todayNumber();
  const seasonStart = seasonStartFor(today, firstFortBattleDay);
  // The phase being played is the one whose battle day has not passed.
  const playedPhase = Math.min(FORT_PHASES, Math.max(1, phaseOf(today + 6, seasonStart)));

  return fortressBoard({
    seasonNumber: seasonNumberOf(seasonStart, firstFortBattleDay, FIRST_FORT_SEASON),
    seasonStart, assignments: fortAssignments, playedPhase
  });
}

function fortressPlanningMarkup(): string {
  if (Number.isNaN(firstFortBattleDay)) return '';
  const today = todayNumber();
  const seasonStart = seasonStartFor(today, firstFortBattleDay);
  return fortressPlanning({
    seasonNumber: seasonNumberOf(seasonStart, firstFortBattleDay, FIRST_FORT_SEASON),
    // The phase being planned is the one whose battle has not been fought yet.
    phase: Math.min(FORT_PHASES, Math.max(1, phaseOf(today + 6, seasonStart))),
    assignments: fortAssignments,
    leads: rallyLeads,
    allocations: buffAllocations,
    buffsPerCastleLead,
    buffsPerTurretLead
  });
}

function fortressRewardsMarkup(): string {
  if (Number.isNaN(firstFortBattleDay)) return '';
  const seasonStart = seasonStartFor(todayNumber(), firstFortBattleDay);
  return seasonTotals({
    seasonNumber: seasonNumberOf(seasonStart, firstFortBattleDay, FIRST_FORT_SEASON),
    seasonStart, assignments: fortAssignments
  });
}

// How many transfer dates sit side by side at once.
const PREDICTION_DATES_SHOWN = 6;

// Which battle each transfer follows, worked out from the dates of the battles
// themselves rather than from a setting, because the pattern changes: for years
// every transfer came the day after an SvS battle, and they now alternate with
// Sunfire Castle every fortnight.
function followsOfDate(date: string): TransferFollows {
  return followsOf(dayFromText(date), svsBattleDays, sunfireDays);
}

function datesInFilter(): string[] {
  // With both battles on nothing is filtered out, so a transfer that follows
  // neither of them still shows.
  if (view.predictionShowsSvs && view.predictionShowsSunfire) return transferDates;
  return transferDates.filter(date => {
    const follows = followsOfDate(date);
    return follows === 'svs' ? view.predictionShowsSvs
      : follows === 'sunfire' ? view.predictionShowsSunfire : false;
  });
}

// Every date of the chosen kind is drawn. Six fit on the screen and the rest are
// reached by scrolling the strip sideways, so moving through them is one motion
// rather than paging.
function shownPredictionDates(): string[] {
  return datesInFilter();
}

// The transfer that is next: where the strip opens, and where the control in the
// page head brings it back to.
function nextTransferDate(): string {
  const todayText = textFromDay(todayNumber());
  const dates = datesInFilter();
  return dates.find(one => one >= todayText) ?? dates[0] ?? '';
}

// Whose group the columns follow. Always our own state: on the full list it marks
// our group among the rest, and on My group it is the only one shown.
function watchedState(): number {
  return Number(STATE_NUMBER);
}

// Everything both the controls and the page need, worked out once.
function predictionsOptions(): PredictionsOptions | null {
  if (!transferDates.length) return null;
  const inFilter = datesInFilter();
  const shown = shownPredictionDates();
  const first = inFilter.indexOf(shown[0] ?? '');
  return {
    dates: shown.map(date => ({
      date,
      groups: transferGroups.filter(one => one.transferDate === date),
      follows: followsOfDate(date)
    })),
    scope: view.predictionScope,
    watchedState: watchedState(),
    ourState: Number(STATE_NUMBER),
    showsSvs: view.predictionShowsSvs,
    showsSunfire: view.predictionShowsSunfire,
    mergesGroups: view.predictionMergesGroups,
    nextDate: nextTransferDate(),
    hasEarlier: first > 0,
    hasLater: first + PREDICTION_DATES_SHOWN < inFilter.length
  };
}

function predictionsMarkup(): string {
  const options = predictionsOptions();
  return options ? predictionsPage(options) : '';
}

function predictionsControlsMarkup(): string {
  const options = predictionsOptions();
  return options ? predictionsControls(options) : '';
}

// The window being planned is the first one that has not passed, or the last there is.
function nextWindow(): TransferWindow | null {
  const todayText = textFromDay(todayNumber());
  const coming = transferWindows.filter(one => one.transferDate >= todayText);
  if (coming.length) return coming[coming.length - 1];
  return transferWindows[0] ?? null;
}

function candidatesOf(windowId: number): TransferCandidate[] {
  return transferCandidates.filter(one => one.windowId === windowId);
}

const FOLLOWS_TEXT: Record<string, string> = { svs: 'After SvS', sunfire: 'After Sunfire' };

function nextTransferMarkup(): string {
  const window = nextWindow();
  const todayText = textFromDay(todayNumber());
  // The date comes from the published groups, so it is known before anyone sets up
  // a window for it.
  const date = window?.transferDate ??
    transferDates.find(one => one >= todayText) ?? '';
  if (!date) return '';
  return nextTransferPage({
    date,
    window,
    candidates: window ? candidatesOf(window.id) : [],
    alliances,
    ourGroup: groupOfState(bigGroupsOf(nextWindowGroups), Number(STATE_NUMBER)) ?? null,
    follows: FOLLOWS_TEXT[followsOfDate(date)] ?? ''
  });
}

function pastTransfersMarkup(): string {
  const todayText = textFromDay(todayNumber());
  const past = transferWindows.filter(one => one.transferDate < todayText);
  if (!past.length) return '';
  return pastTransfersPage({
    windows: past.map(one => ({ window: one, candidates: candidatesOf(one.id) })),
    alliances
  });
}

// The controls that belong to the open page, shown in the page head.
function pageControls(openPage: string, subPage: string): string {
  if (openPage === 'transfers' && subPage === 'timeline') return predictionsControlsMarkup();
  return '';
}

// Every drawing replaces the whole page, so the scrolled boxes would start again at
// the top after any tap. Where each one was is noted before and put back after, unless
// the tap asked for that box to start at the top, as the old app did when a day, an
// event or another month opened.
const startAtTop = { calendar: false, panel: false, wholePage: false };

interface ScrollPlaces {
  window: number;
  calendar: number;
  panel: number;
  eventBody: number;
}

function scrollPlaces(app: HTMLElement): ScrollPlaces {
  return {
    window: window.scrollY,
    calendar: app.querySelector<HTMLElement>('.calendar-panel')?.scrollTop ?? 0,
    panel: app.querySelector<HTMLElement>('.day-panel')?.scrollTop ?? 0,
    eventBody: app.querySelector<HTMLElement>('.event-page-body')?.scrollTop ?? 0
  };
}

function putBackScrollPlaces(app: HTMLElement, places: ScrollPlaces): void {
  const calendar = app.querySelector<HTMLElement>('.calendar-panel');
  const panel = app.querySelector<HTMLElement>('.day-panel');
  const eventBody = app.querySelector<HTMLElement>('.event-page-body');
  if (startAtTop.wholePage) {
    window.scrollTo(0, 0);
    if (calendar) calendar.scrollTop = 0;
    if (panel) panel.scrollTop = 0;
    if (eventBody) eventBody.scrollTop = 0;
  } else {
    window.scrollTo(0, places.window);
    if (calendar) calendar.scrollTop = startAtTop.calendar ? 0 : places.calendar;
    if (panel) panel.scrollTop = startAtTop.panel ? 0 : places.panel;
    if (eventBody) eventBody.scrollTop = startAtTop.panel ? 0 : places.eventBody;
  }
  startAtTop.calendar = false;
  startAtTop.panel = false;
  startAtTop.wholePage = false;
}

function draw(): void {
  const app = document.getElementById('app');
  if (!app) return;
  const places = scrollPlaces(app);
  drawPage(app);
  putBackScrollPlaces(app, places);
  if (view.scrollsToMarkedRow) {
    view.scrollsToMarkedRow = false;
    scrollToMarkedRow(app);
  }
}

// An event that has just opened shows its marked row: if the row is out of sight, the
// panel scrolls so it sits a third of the way down.
function scrollToMarkedRow(app: HTMLElement): void {
  const panel = app.querySelector<HTMLElement>('.event-page-body') ??
    app.querySelector<HTMLElement>('.day-panel');
  const marked = panel?.querySelector<HTMLElement>('.tree-row.current');
  if (!panel || !marked) return;
  const panelBox = panel.getBoundingClientRect();
  const rowBox = marked.getBoundingClientRect();
  const visibleTop = Math.max(panelBox.top, 0);
  const visibleBottom = Math.min(panelBox.bottom, window.innerHeight);
  if (rowBox.top >= visibleTop && rowBox.bottom <= visibleBottom) return;
  const target = panel.scrollTop + (rowBox.top - panelBox.top) - panel.clientHeight / 3;
  if (panel.scrollHeight > panel.clientHeight) panel.scrollTop = Math.max(0, target);
  else window.scrollBy(0, rowBox.top - window.innerHeight / 3);
}

function drawPage(app: HTMLElement): void {
  const range = viewRange();

  const bar = topBar({
    stateNumber: STATE_NUMBER,
    openPage: view.openPage,
    eventLabel: currentEventLabel(),
    // Nobody is an admin until sign-in exists.
    isAdmin: false,
    playerName: null
  });

  if (view.openPage === 'player') {
    app.innerHTML = bar +
      `<main class="page">${playerPage({ alliances: alliancesStillHere(alliances), myAllianceId: view.myAllianceId })}</main>`;
    return;
  }

  if (view.openPage !== 'calendar') {
    const page = pageById(view.openPage);
    const subPage = view.openSubPage || page?.pages[0]?.id || '';
    const built =
      view.openPage === 'fortress' && subPage === 'board' ? fortressBoardMarkup() :
      view.openPage === 'fortress' && subPage === 'planning' ? fortressPlanningMarkup() :
      view.openPage === 'fortress' && subPage === 'rewards' ? fortressRewardsMarkup() :
      view.openPage === 'state' ? statePage({ stateNumber: STATE_NUMBER, alliances: alliancesStillHere(alliances), schedules }) :
      view.openPage === 'alliance' && subPage === 'times'
        ? allianceTimesPage(view.myAllianceId ? allianceById(view.myAllianceId) : undefined, schedules) :
      view.openPage === 'transfers' && subPage === 'timeline' ? predictionsMarkup() :
      view.openPage === 'transfers' && subPage === 'invites' ? nextTransferMarkup() :
      view.openPage === 'transfers' && subPage === 'records' ? pastTransfersMarkup() : '';
    app.innerHTML = bar +
      `<main class="page" data-section="${view.openPage}">` +
      `${sectionNav(view.openPage, subPage, pageControls(view.openPage, subPage))}` +
      `${built || pagePlan(view.openPage, subPage)}</main>`;
    layoutPredictions(app);
    return;
  }

  app.innerHTML = bar +
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

// The event the Event section is named after: the one running now, or the next one.
// Only the three the state plans around count.
const PLANNED_EVENT_TYPE_IDS = ['svs', 'tyrant', 'hellfire'];

function currentEventLabel(): string {
  const today = todayNumber();
  const runs = runsBetween(today - 30, today + 200)
    .filter(one => PLANNED_EVENT_TYPE_IDS.includes(one.eventTypeId))
    .sort((left, right) => left.startMinute - right.startMinute);
  const now = nowMinute();
  const running = runs.find(one => one.startMinute <= now && one.endMinute > now);
  const next = runs.find(one => one.startMinute > now);
  const chosen = running ?? next;
  return chosen ? eventTypeShortName(chosen.eventTypeId) : PAGES[3].label;
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

  const myAllianceButton = target.closest<HTMLElement>('[data-my-alliance]');
  if (myAllianceButton) {
    const id = myAllianceButton.dataset.myAlliance as string;
    view.myAllianceId = view.myAllianceId === id ? null : id;
    draw();
    return;
  }

  const pageButton = target.closest<HTMLElement>('[data-page]');
  if (pageButton) {
    view.openPage = pageButton.dataset.page as string;
    view.openSubPage = '';
    startAtTop.wholePage = true;
    draw();
    return;
  }

  const predictionStepButton = target.closest<HTMLElement>('[data-prediction-step]');
  if (predictionStepButton) {
    const dates = datesInFilter();
    const step = Number(predictionStepButton.dataset.predictionStep) * PREDICTION_DATES_SHOWN;
    const where = dates.indexOf(view.predictionFirstDate) + step;
    const stop = Math.max(0, dates.length - PREDICTION_DATES_SHOWN);
    view.predictionFirstDate = dates[Math.min(stop, Math.max(0, where))];
    void openPredictionDates();
    return;
  }

  const predictionFilterButton = target.closest<HTMLElement>('[data-prediction-filter]');
  if (predictionFilterButton) {
    const [name, value] = (predictionFilterButton.dataset.predictionFilter as string).split('|');
    if (name === 'follows') {
      // One of the two always stays on: turning the last one off would leave the
      // page with nothing to show.
      if (value === 'svs' && (!view.predictionShowsSvs || view.predictionShowsSunfire)) {
        view.predictionShowsSvs = !view.predictionShowsSvs;
      }
      if (value === 'sunfire' && (!view.predictionShowsSunfire || view.predictionShowsSvs)) {
        view.predictionShowsSunfire = !view.predictionShowsSunfire;
      }
      // The dates on screen change with the filter, so it starts again at the
      // first transfer of that kind from today.
      const todayText = textFromDay(todayNumber());
      const dates = datesInFilter();
      view.predictionFirstDate = dates.find(date => date >= todayText) ?? dates[0] ?? '';
      void openPredictionDates();
      return;
    }
    if (name === 'scope') view.predictionScope = view.predictionScope === 'mine' ? 'all' : 'mine';
    // The switch is named for the subgroups, so on means they are shown.
    if (name === 'rows') view.predictionMergesGroups = !view.predictionMergesGroups;
    draw();
    return;
  }

  const subPageButton = target.closest<HTMLElement>('[data-sub-page]');
  if (subPageButton) {
    view.openSubPage = subPageButton.dataset.subPage as string;
    startAtTop.wholePage = true;
    draw();
    return;
  }

  const stepButton = target.closest<HTMLElement>('[data-step]');
  if (stepButton) {
    step(Number(stepButton.dataset.step));
    startAtTop.calendar = true;
    draw();
    return;
  }

  const viewButton = target.closest<HTMLElement>('[data-view]');
  if (viewButton) {
    view.calendarView = viewButton.dataset.view as CalendarView;
    startAtTop.calendar = true;
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
    startAtTop.panel = true;
    draw();
    return;
  }

  if (target.closest('[data-back-to-day]')) {
    view.openEventKey = null;
    view.pickedRowKey = null;
    view.openedFromDay = null;
    startAtTop.panel = true;
    draw();
    return;
  }

  // A white line on a bar shows its time, as on hover, and opens nothing.
  const lineMark = target.closest<HTMLElement>('.bar-mark');
  if (lineMark) {
    document.querySelectorAll('.bar-mark.show-time').forEach(other => {
      if (other !== lineMark) other.classList.remove('show-time');
    });
    lineMark.classList.toggle('show-time');
    return;
  }

  if (target.closest('[data-toggle-view]')) {
    view.openEventView = view.openEventView === 'timeline' ? 'info' : 'timeline';
    startAtTop.panel = true;
    draw();
    return;
  }

  const rewardListButton = target.closest<HTMLElement>('[data-reward-list]');
  if (rewardListButton) {
    const [eventTypeId, list] = (rewardListButton.dataset.rewardList as string).split('|');
    view.rewardView.openList.set(eventTypeId, list);
    draw();
    return;
  }

  const rewardBandButton = target.closest<HTMLElement>('[data-reward-band]');
  if (rewardBandButton) {
    const [eventTypeId, list, band] = (rewardBandButton.dataset.rewardBand as string).split('|');
    view.rewardView.openBand.set(eventTypeId + '|' + list, band);
    draw();
    return;
  }

  const followButton = target.closest<HTMLElement>('[data-follow-time]');
  if (followButton) {
    const scheduleId = followButton.dataset.followTime as string;
    if (view.followedScheduleIds.has(scheduleId)) view.followedScheduleIds.delete(scheduleId);
    else view.followedScheduleIds.add(scheduleId);
    draw();
    return;
  }

  const rowButton = target.closest<HTMLElement>('[data-row-key]');
  if (rowButton) {
    const key = rowButton.dataset.rowKey as string;
    view.pickedRowKey = view.pickedRowKey === key ? null : key;
    draw();
    return;
  }

  const openEventButton = target.closest<HTMLElement>('[data-open-event]');
  if (openEventButton) {
    openEventFrom(openEventButton, target);
    draw();
    return;
  }

  if (target.closest('[data-close-day]')) { view.isPanelOpen = false; draw(); return; }

  const dayButton = target.closest<HTMLElement>('[data-day]');
  if (dayButton) {
    view.openEventKey = null;
    view.pickedRowKey = null;
    view.openedFromDay = null;
    view.chosenDay = dayFromText(dayButton.dataset.day as string);
    view.focusDay = view.chosenDay;
    view.isPanelOpen = true;
    if (view.calendarView === 'year') view.calendarView = 'month';
    startAtTop.panel = true;
    draw();
  }
}

// Opening an event: from a bar (or anything on it), from the day's timeline, or from
// another event's page. Tapping a bar never picks a day; the whole event is lit
// instead, and its timeline marks the row on now, or the row of what was tapped.
function openEventFrom(button: HTMLElement, target: HTMLElement): void {
  const bar = button.closest<HTMLElement>('.bar');
  const isFromDay = Boolean(button.closest('.day-panel')) && !button.closest('.event-page') &&
    !button.closest('.panel-backs');

  view.openEventKey = button.dataset.openEvent as string;
  view.pickedRowKey = null;
  view.tappedKey = view.openEventKey;
  view.tappedMinute = NaN;

  if (bar) {
    const dayAttribute = bar.dataset.day;
    if (dayAttribute) view.openEventDay = dayFromText(dayAttribute);
    // The day, phase or part under the finger gives the minute; a ticket or a line
    // under the bar counts as the bar itself.
    const inner = target.closest<HTMLElement>('[data-start-minute]');
    const isTicket = Boolean(target.closest('.bar-stripe, .bar-stripe-end, .opening-mark'));
    view.tappedMinute = inner && bar.contains(inner) && !isTicket
      ? Number(inner.dataset.startMinute) : Number(bar.dataset.tapMinute);
    view.openedFromDay = null;
  } else if (isFromDay) {
    view.openEventDay = view.chosenDay;
    view.openedFromDay = view.chosenDay;
    view.tappedMinute = button.dataset.tapMinute
      ? Number(button.dataset.tapMinute) : view.chosenDay * MINUTES_PER_DAY;
  }

  view.isPanelOpen = true;
  startAtTop.panel = true;
  view.scrollsToMarkedRow = true;
}

function eventKeysOf(category: string): string[] {
  return filterListEvents(category, eventTypeIdsWithAllianceTimes())
    .map(id => category + '|' + id);
}

// The top bar as it looks before anything has loaded, used when something goes wrong.
function problemBar(): string {
  return topBar({
    stateNumber: STATE_NUMBER, openPage: view.openPage,
    eventLabel: PAGES[3].label, isAdmin: false, playerName: null
  });
}

// Reading the groups of the dates on screen, then drawing with them.
// The state whose group is followed, typed in rather than picked, because it can be
// any state in the game.
async function openPredictionDates(): Promise<void> {
  transferGroups = await loadTransferGroups(shownPredictionDates()).catch(() => []);
  draw();
}

// The battle days across every transfer date there is, read once.
function rememberBattleDays(): void {
  if (!transferDates.length || !expandOptions) return;
  const first = dayFromText(transferDates[0]) - 40;
  const last = dayFromText(transferDates[transferDates.length - 1]) + 40;
  svsBattleDays = new Set();
  sunfireDays = new Set();
  for (const run of buildOccurrences(first, last, transferFollows, expandOptions)) {
    if (run.eventTypeId === 'svs-battle') svsBattleDays.add(run.startDay);
    if (run.eventTypeId === 'sunfire') sunfireDays.add(run.startDay);
  }
}

async function start(): Promise<void> {
  const app = document.getElementById('app');
  if (!app) throw new Error('The page is missing its #app element.');
  app.className = 'app';
  installIconFallback();

  try {
    const [loadedSchedules, changes, settings] = await Promise.all([
      loadSchedules(), loadDateChanges(), loadSettings()
    ]);
    // Alliance names are wanted on bars and panels, but nothing stops without them.
    alliances = await loadAlliances().catch(() => []);
    rememberAlliances(alliances);

    schedules = loadedSchedules;
    transferFollows = settings.get('transferFollows') === 'sunfire' ? 'sunfire' : 'svs';
    setImageBase(settings.get('imageBaseUrl') ?? '');
    firstFortBattleDay = dayFromText(settings.get('fortressSeasonStart') ?? '');
    // The board is wanted only when that page is opened, but it is small and the
    // page is drawn from one place, so it is read once here.
    fortAssignments = await loadFortAssignments(FIRST_FORT_SEASON).catch(() => []);
    buffsPerCastleLead = Number(settings.get('castleLeadBuffs') ?? '2') || 2;
    buffsPerTurretLead = Number(settings.get('turretLeadBuffs') ?? '1') || 1;
    rallyLeads = await loadRallyLeads().catch(() => []);
    buffAllocations = await loadBuffAllocations(fortAssignments.map(one => one.id)).catch(() => []);
    transferDates = await loadTransferDates().catch(() => []);
    transferWindows = await loadTransferWindows().catch(() => []);
    transferCandidates = await loadCandidatesOf(transferWindows.map(one => one.id)).catch(() => []);
    const comingDate = nextWindow()?.transferDate ??
      transferDates.find(one => one >= textFromDay(todayNumber())) ?? '';
    if (comingDate) {
      nextWindowGroups = await loadTransferGroups([comingDate]).catch(() => []);
    }
    rememberBattleDays();
    // The predictions open on the next transfer, or the last one there is.
    const todayText = textFromDay(todayNumber());
    view.predictionFirstDate = transferDates.find(date => date >= todayText) ??
      transferDates[transferDates.length - 1] ?? '';
    // Typing shows the new state straight away rather than waiting for the field
    // to be left.
    if (view.predictionFirstDate) {
      transferGroups = await loadTransferGroups(shownPredictionDates()).catch(() => []);
    }
    expandOptions = {
      allSchedules: loadedSchedules,
      changesBySchedule: groupChanges(changes),
      partOfByEventTypeId
    };

    document.addEventListener('click', handleClicks);
    // The clock in the top bar, and the bars when the window changes width.
    window.setInterval(() => {
      const clock = document.getElementById('clockTime');
      if (clock) clock.textContent = gameClockText(nowMinute());
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
    app.innerHTML = problemBar() + '<main class="page">' + problemPanel(message) + '</main>';
  }
}

void start();
