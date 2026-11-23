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
import { loadGenerationsOfState, loadTransferDates, loadTransferGroups } from './data/transfer-groups.ts';
import { setGenerationSteps } from './data/heroes.ts';
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
  phaseNote, pointSourcesForDay, showsTimesInLine, sortOrderOf, stepLabel, stepNote
} from './data/catalog.ts';
import {
  minutesFromTime, startOfMonth, startOfWeek, textFromDay, todayNumber, yearAndMonthOf, dayFromText, MINUTES_PER_DAY
} from './calendar/days.ts';
import { buildOccurrences, groupChanges, type ExpandOptions, type Occurrence, type Schedule } from './calendar/occurrences.ts';
import { buildBarsForRange, type Bar } from './calendar/bars.ts';
import { daySegments } from './calendar/day-segments.ts';
import { contentsOfDay, timelineOrder, windowOfDay, type Moment } from './calendar/day-timeline.ts';
import { fortBattleIsShown, fortBattlesOnDay, fortPhaseOfDay } from './calendar/fort-battles.ts';
import { fortBattlesSection } from './ui/fort-battles.ts';
import { showdownScoreSection } from './ui/showdown-score.ts';
import { fortFullName } from './calendar/fort-season.ts';
import { buildEventTree, familyOccurrences } from './calendar/event-tree.ts';
import { currentTimeMode, gameClockText, nowMinute, setTimeMode, type TimeMode } from './calendar/time-mode.ts';
import { readPreferences, writePreferences } from './data/preferences.ts';
import {
  addAltAccount, isAdmin, isOwner, leadsAlliance, managesBattles, managesState, removeAltAccount, saveAccount, signInWith, signOut,
  signedInPerson, type SignedInPerson, type SignInProvider
} from './data/auth.ts';
import {
  cleanTime, saveAllianceTime, saveDateChange, saveFortAssignment, saveScheduleRepeat
} from './data/editing.ts';
import { allianceTimeForm, dateChangeForm, fortForm, pencilButton, scheduleForm } from './ui/edit-forms.ts';
import { deleteRow, loadRows, saveRow, type Row } from './data/records.ts';
import {
  ALLIANCE_RESULT_EVENTS, allianceResultsPage, championshipStars, opponentNotesPage, resultsTab, showdownScoreOf,
  svsHistorySection
} from './ui/results.ts';
import { personalEntryForm, personalEntryOf } from './ui/personal-entry.ts';
import {
  academiesPage, availabilityPage, facilitiesPage, membersPage, planPage, requestsPage, rolesPage,
  playerTroopsSection, rosterPage, settingsPage, territoryPage, transferWorkSections, troopScore, type WorkContext
} from './ui/working-pages.ts';
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
import { eventPanel, groupPanel, type RewardViewState, setOpenPointRows } from './ui/event-panel.ts';
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
  predictionScope: 'all',
  // What is typed in the state box, kept as written.
  // True to show each group as one row rather than its subgroups.
  predictionMergesGroups: false,
  // The run whose own page is open.
  openEventKey: null as string | null,
  // The tab last opened (Timeline is the first). An event without that tab opens on
  // its first one.
  openInfoTab: '',
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
  // The rows of the open event whose points are open.
  openPointRows: new Set<string>(),
  // The form a pencil opened: "schedule|<id>", "alliance|<id>", "date|<id>|<date>" or
  // "fort|<season>|<phase>|<fort>". Null when none is open.
  editing: null as string | null,
  rewardView: {
    openList: new Map<string, string>(),
    openBand: new Map<string, string>(),
    ownBand: new Map<string, string>()
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
// Who is signed in on this browser, or null for a guest.
let person: SignedInPerson | null = null;

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
      phaseNameForDay, dayNameOf, myAllianceIds, timesInLine: showsTimesInLine,
      allianceTagsOf: one => one.allianceIds.length
        ? ' · ' + one.allianceIds.filter(id => myAllianceIds.includes(id)).map(allianceTag).join(', ')
        : '',
      lengthOf: one => one.endMinute - one.startMinute
    });

  contents.moments = timelineOrder(contents.moments.concat(fortMomentsOfDay(day, myAllianceIds), pickedTimesOfDay(day)));

  return dayPanel(day, contents, {
    needsAlliancePick: view.shownCategories.has('alliance') && !myAllianceIds.length,
    allianceChoices: alliancesStillHere(alliances)
      .slice().sort((left, right) => left.sortOrder - right.sortOrder)
      .map(one => ({ id: one.id, tag: one.tag }))
  });
}

// The fortress battles on a day, as rows of its timeline: "Fortress No. 3 battle · TOP".
// Each opens the Fortress Battles event it belongs to.
function fortMomentsOfDay(day: number, myAllianceIds: string[]): Moment[] {
  const window = windowOfDay(day);
  const count = { firstBattleDay: firstFortBattleDay, firstSeason: FIRST_FORT_SEASON };
  const fortRuns = runsBetween(day - 8, day + 8).filter(one => one.eventTypeId === 'fortress-battles');
  const moments: Moment[] = [];
  // With "Mine" a shown day can reach into the game days either side of it.
  for (let gameDay = day - 1; gameDay <= day + 1; gameDay++) {
    for (const battle of fortBattlesOnDay(gameDay, count, fortAssignments)) {
      if (battle.minute === null || battle.minute < window.start || battle.minute >= window.end) continue;
      if (!fortBattleIsShown(battle, view.shownCategories, myAllianceIds)) continue;
      const run = fortRuns.find(one => one.startMinute <= battle.minute! && one.endMinute > battle.minute!);
      const holder = battle.allianceId ? ' · ' + allianceTag(battle.allianceId) : '';
      moments.push({
        minute: battle.minute, eventTypeId: 'fortress-battles', occurrenceKey: run?.key ?? '',
        title: fortFullName(battle.fort) + ' battle' + holder,
        isEnd: false, isReset: false, priority: 0
      });
    }
  }
  return moments;
}

// The times the player picked for their personal events (Frostfire's slot), as
// moments in the day's timeline.
function pickedTimesOfDay(day: number): Moment[] {
  if (!person) return [];
  const entries = rowsOf('personal_entries');
  if (!entries) return [];
  const window = windowOfDay(day);
  const moments: Moment[] = [];
  for (const run of runsBetween(day - 1, day + 1)) {
    if (categoryOf(run.eventTypeId) !== 'personal' || !view.shownCategories.has('personal')) continue;
    const entry = personalEntryOf(entries, run);
    if (!entry?.my_time) continue;
    for (let runDay = run.startDay; runDay <= run.endDay; runDay++) {
      const minute = runDay * MINUTES_PER_DAY + minutesFromTime(String(entry.my_time).slice(0, 5));
      if (minute < window.start || minute >= window.end || minute < run.startMinute || minute >= run.endMinute) continue;
      moments.push({
        minute, eventTypeId: run.eventTypeId, occurrenceKey: run.key,
        title: eventTypeName(run.eventTypeId) + ' · your slot', isEnd: false, isReset: false, priority: 0
      });
    }
  }
  return moments;
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
    followedScheduleIds: view.followedScheduleIds,
    pencilFor: one => mayChangeAllianceTime(one)
      ? pencilButton('alliance|' + one.scheduleId, 'Change this time') : '',
    formFor: one => allianceTimeFormFor(one)
  });
}

// An alliance's R4 or R5, or an admin, may change that alliance's own time.
function mayChangeAllianceTime(occurrence: Occurrence): boolean {
  return occurrence.allianceIds.some(id => leadsAlliance(person, id));
}

function allianceTimeFormFor(occurrence: Occurrence): string {
  if (view.editing !== 'alliance|' + occurrence.scheduleId) return '';
  const schedule = schedules.find(one => one.id === occurrence.scheduleId);
  return schedule ? allianceTimeForm(schedule, nameOfAllianceTime(occurrence)) : '';
}

// One pencil in an event's head, for anyone who may change something about it. It
// opens every form they may use: this date (admins), the event's dates and repeat
// (the owner), or their alliance's own time (its R4 or R5).
function headPencilsOf(occurrence: Occurrence): string {
  const ownTime = occurrence.allianceIds.length > 0;
  const mayEdit = isAdmin(person) || (ownTime && mayChangeAllianceTime(occurrence));
  return mayEdit ? pencilButton('head|' + occurrence.key, 'Change this event') : '';
}

// The forms the head pencil opened, for this event.
function headFormOf(occurrence: Occurrence): string {
  if (view.editing !== 'head|' + occurrence.key) return '';
  const schedule = schedules.find(one => one.id === occurrence.scheduleId);
  if (!schedule) return '';
  let html = '';
  if (isAdmin(person)) {
    const originalDate = textFromDay(occurrence.originalDay);
    const change = expandOptions?.changesBySchedule.get(schedule.id)?.get(originalDate);
    html += dateChangeForm(schedule.id, originalDate, change, schedule.datesAreEstimated);
  }
  if (occurrence.allianceIds.length > 0) {
    if (mayChangeAllianceTime(occurrence)) html += allianceTimeForm(schedule, nameOfAllianceTime(occurrence));
  } else if (isOwner(person)) {
    html += scheduleForm(schedule);
  }
  return html;
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
    phaseNoteOf: phaseNote, stepNoteOf: stepNote, timesInLine: showsTimesInLine,
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

  view.rewardView.ownBand = ownRewardBands();
  return eventPanel(occurrence, {
    tree, day, dayOfEvent: dayInEvent,
    allianceTags: occurrence.allianceIds.length
      ? ' · ' + occurrence.allianceIds.filter(id => myAllianceIds.includes(id)).map(allianceTag).join(', ')
      : '',
    allianceTimes,
    allianceTagsOf: other => other.allianceIds.filter(id => myAllianceIds.includes(id))
      .map(allianceTag).join(', '),
    rewardView: view.rewardView,
    changeNote: occurrence.note,
    backToDay: view.openedFromDay,
    openTab: view.openInfoTab,
    headPencils: headPencilsOf(occurrence),
    editFormHtml: headFormOf(occurrence),
    fortBattlesHtml: occurrence.eventTypeId === 'fortress-battles'
      ? fortBattlesHtmlOf(occurrence.startDay, occurrence.endDay, myAllianceIds) : '',
    resultsHtml: resultsTab({
      context: workContext(), eventTypeId: occurrence.eventTypeId, runDate: resultRunDate(occurrence, nearby),
      isSwitchedOff: resultsSwitchedOff
    }),
    personalHtml: personalEntryForm({
      occurrence, category: categoryOf(occurrence.eventTypeId), userId: person?.userId ?? null,
      entries: person ? rowsOf('personal_entries') : []
    }),
    // A day without a recorded winner shows a dash.
    scoreHtml: showdownScoreSection({
      eventTypeId: occurrence.eventTypeId, stateNumber: STATE_NUMBER,
      allianceId: view.myAllianceId,
      score: occurrence.eventTypeId === 'showdown' ? showdownScoreOf(workContext(), textFromDay(occurrence.startDay)) : null,
      todayInRun: todayNumber() >= occurrence.startDay && todayNumber() <= occurrence.endDay
        ? todayNumber() - occurrence.startDay + 1 : 0
    })
  });
}

// The battles of the fortress phase whose battle day falls in these days.
function fortBattlesHtmlOf(firstDay: number, lastDay: number, myAllianceIds: string[]): string {
  const count = { firstBattleDay: firstFortBattleDay, firstSeason: FIRST_FORT_SEASON };
  for (let day = firstDay; day <= lastDay; day++) {
    const fortDay = fortPhaseOfDay(day, count);
    if (!fortDay) continue;
    const fortKey = (battle: { phase: number; fort: string }) =>
      'fort|' + fortDay.season + '|' + battle.phase + '|' + battle.fort;
    return fortBattlesSection({
      battleDay: day, phase: fortDay.phase, myAllianceIds,
      battles: fortBattlesOnDay(day, count, fortAssignments),
      // State managers and admins set who holds each fort and when its battle starts.
      pencilFor: battle => managesState(person) ? pencilButton(fortKey(battle), 'Change this fort') : '',
      formFor: battle => {
        if (view.editing !== fortKey(battle)) return '';
        const held = fortAssignments.find(one =>
          one.season === fortDay.season && one.phase === battle.phase && one.fort === battle.fort);
        return fortForm(fortKey(battle), fortFullName(battle.fort), alliancesStillHere(alliances),
          battle.allianceId, held?.battleTimeUtc ?? null);
      }
    });
  }
  return '';
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
  const work = person ? `<div class="work-page">${transferWorkSections(workContext(), date)}</div>` : '';
  return nextTransferPage({
    date,
    window,
    candidates: window ? candidatesOf(window.id) : [],
    alliances,
    ourGroup: groupOfState(bigGroupsOf(nextWindowGroups), Number(STATE_NUMBER)) ?? null,
    follows: FOLLOWS_TEXT[followsOfDate(date)] ?? ''
  }) + work;
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

// The working pages: what is not designed yet, shown as tables of what we have.
const tableRows = new Map<string, Row[]>();
const tablesBeingRead = new Set<string>();
// The choices made above the working pages' tables, such as how a list is sorted.
const workChoices = new Map<string, string>();

// A table's rows, read the first time a page asks; null until they arrive.
function rowsOf(table: string): Row[] | null {
  const rows = tableRows.get(table);
  if (rows) return rows;
  if (!tablesBeingRead.has(table)) {
    tablesBeingRead.add(table);
    loadRows(table)
      .then(loaded => tableRows.set(table, loaded))
      .catch(() => tableRows.set(table, []))
      .finally(() => { tablesBeingRead.delete(table); draw(); });
  }
  return null;
}

async function rereadTables(...tables: string[]): Promise<void> {
  await Promise.all(tables.map(async table => {
    tableRows.set(table, await loadRows(table).catch(() => tableRows.get(table) ?? []));
  }));
}

function workContext(): WorkContext {
  const run = currentEventRun();
  return {
    rowsOf, alliances: alliancesStillHere(alliances), myAllianceId: view.myAllianceId,
    userId: person?.userId ?? null,
    run: run ? { eventTypeId: run.eventTypeId, date: textFromDay(run.startDay) } : null,
    editing: view.editing,
    choiceOf: name => workChoices.get(name) ?? '',
    isAdmin: isAdmin(person), managesState: managesState(person), managesBattles: managesBattles(person),
    leads: allianceId => leadsAlliance(person, allianceId),
    mayReadBlacklist: isAdmin(person) || Boolean(person?.roles.some(one => one.role === 'alliance_manager'))
  };
}

// The date a result is recorded under: the run's first day; for SvS, the day of its
// battle, as the SvS history has always been kept; for a part of a bigger event, the
// first day of the whole event.
function resultRunDate(occurrence: Occurrence, nearby: Occurrence[]): string {
  if (partOfByEventTypeId.get(occurrence.eventTypeId) === 'svs') {
    const battle = nearby.filter(one => one.eventTypeId === 'svs-battle' && one.startDay >= occurrence.startDay - 1)
      .sort((left, right) => left.startDay - right.startDay)[0];
    if (battle) return textFromDay(battle.startDay);
  }
  const parentId = partOfByEventTypeId.get(occurrence.eventTypeId);
  const parent = parentId ? nearby.find(one => one.eventTypeId === parentId &&
    one.startDay <= occurrence.startDay && one.endDay >= occurrence.startDay) : undefined;
  return textFromDay((parent ?? occurrence).startDay);
}

// The reward bands of the player's alliance: its Showdown Star Rating's band and its
// Winter Siege and Championship tiers, so its members see their own rewards first.
function ownRewardBands(): Map<string, string> {
  const bands = new Map<string, string>();
  const record = view.myAllianceId
    ? (rowsOf('alliance_records') ?? []).find(one => one.alliance_id === view.myAllianceId) : undefined;
  if (!record) return bands;
  const rating = Number(record.showdown_star_rating);
  if (record.showdown_star_rating !== null && record.showdown_star_rating !== undefined && !Number.isNaN(rating)) {
    bands.set('showdown|star', rating >= 10 ? '10+' : rating >= 6 ? '6-9' : rating >= 3 ? '3-5' : '1-2');
  }
  if (record.winter_siege_tier) bands.set('winter-siege|tier', String(record.winter_siege_tier));
  if (record.championship_tier) bands.set('alliance-championship|group', String(record.championship_tier));
  return bands;
}

// Whether an alliance switched off an event in its results section.
function resultsSwitchedOff(allianceId: string, eventTypeId: string): boolean {
  const record = (rowsOf('alliance_records') ?? []).find(one => one.alliance_id === allianceId);
  return Array.isArray(record?.results_off) && (record.results_off as string[]).includes(eventTypeId);
}

function workingPageMarkup(openPage: string, subPage: string): string {
  const key = openPage + '|' + subPage;
  if (key === 'event|availability') return availabilityPage(workContext());
  if (key === 'event|roster') return rosterPage(workContext());
  if (key === 'event|plan') return planPage(workContext());
  if (key === 'alliance|members') return membersPage(workContext(), allianceFamilyOf(view.myAllianceId));
  if (key === 'alliance|academies') return academiesPage(workContext());
  if (key === 'alliance|results') return allianceResultsPage(workContext());
  if (key === 'alliance|opponents') {
    return opponentNotesPage(workContext(), workChoices.get('opponents-others') === 'on', workChoices.get('opponents-all') === 'on');
  }
  if (key === 'map|territory') return territoryPage(workContext());
  if (key === 'map|facilities') return facilitiesPage(workContext());
  if (openPage === 'admin' && isAdmin(person)) {
    if (subPage === 'settings') return settingsPage(workContext());
    if (subPage === 'roles') return rolesPage(workContext());
    if (subPage === 'requests') return requestsPage(workContext());
  }
  return '';
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

// The event a form was opened on. Moving to another event, page or day closes it.
let editingPlace = '';

function draw(): void {
  const app = document.getElementById('app');
  if (!app) return;
  const place = view.openPage + '|' + (view.openEventKey ?? '') + '|' + view.chosenDay;
  if (place !== editingPlace) {
    if (editingPlace) view.editing = null;
    // Another event's rows start closed.
    if (editingPlace.split('|')[1] !== (view.openEventKey ?? '')) view.openPointRows.clear();
    editingPlace = place;
  }
  const places = scrollPlaces(app);
  drawPage(app);
  putBackScrollPlaces(app, places);
  if (view.scrollsToMarkedRow) {
    view.scrollsToMarkedRow = false;
    scrollToMarkedRow(app);
  }
  // On a phone the day's panel is a sheet over the page. While it is up, the page under
  // it is hidden, so the sheet can fade at its edges into the same background.
  app.classList.toggle('sheet-open', view.isPanelOpen && view.openPage === 'calendar');
  watchScrollEdges(app);
  showOpenTab(app);
  syncHistory();
  rememberChoices();
}

// The player's choices are kept between visits, as the old app kept them.
function rememberChoices(): void {
  writePreferences({
    categories: Array.from(view.shownCategories),
    hiddenEvents: Array.from(view.hiddenEvents),
    followedScheduleIds: Array.from(view.followedScheduleIds),
    calendarView: view.calendarView,
    timeMode: currentTimeMode(),
    myAllianceId: view.myAllianceId,
    openInfoTab: view.openInfoTab,
    opponentNotes: { others: workChoices.get('opponents-others') ?? '', all: workChoices.get('opponents-all') ?? '' }
  });
}

// The choices kept from the last visit. An alliance that has left the state since, or
// a category the site no longer has, is dropped.
function applyKeptChoices(): void {
  const kept = readPreferences();
  if (kept.openInfoTab) view.openInfoTab = kept.openInfoTab;
  if (kept.opponentNotes) {
    workChoices.set('opponents-others', kept.opponentNotes.others);
    workChoices.set('opponents-all', kept.opponentNotes.all);
  }
  if (kept.categories) {
    view.shownCategories = new Set(kept.categories.filter(id => CATEGORY_ORDER.includes(id)));
  }
  if (kept.hiddenEvents) view.hiddenEvents = new Set(kept.hiddenEvents);
  if (kept.followedScheduleIds) view.followedScheduleIds = new Set(kept.followedScheduleIds);
  if (kept.calendarView) view.calendarView = kept.calendarView;
  if (kept.timeMode) setTimeMode(kept.timeMode);
  if (kept.myAllianceId !== undefined) {
    const isStillHere = kept.myAllianceId === null ||
      alliancesStillHere(alliances).some(one => one.id === kept.myAllianceId);
    view.myAllianceId = isStillHere ? kept.myAllianceId : null;
  }
}

// Rows that scroll sideways when their names do not fit: the sections in the top band
// on a phone, and an event's tabs. The open one is always brought into view, and the
// row fades at an edge while there are more names past it.
const SIDEWAYS_ROWS: [string, string][] = [
  ['.main-nav', '.nav-tab[aria-current="page"]'],
  ['.info-tabs', '.info-tab[aria-selected="true"]']
];

function showOpenTab(app: HTMLElement): void {
  for (const [rowSelector, openSelector] of SIDEWAYS_ROWS) {
    const row = app.querySelector<HTMLElement>(rowSelector);
    if (!row) continue;
    const open = row.querySelector<HTMLElement>(openSelector);
    if (open) {
      const left = open.offsetLeft - row.offsetLeft;
      if (left < row.scrollLeft) row.scrollLeft = left;
      else if (left + open.offsetWidth > row.scrollLeft + row.clientWidth) {
        row.scrollLeft = left + open.offsetWidth - row.clientWidth;
      }
    }
    const update = () => {
      row.classList.toggle('more-left', row.scrollLeft > 1);
      row.classList.toggle('more-right', row.scrollLeft + row.clientWidth < row.scrollWidth - 1);
    };
    update();
    row.addEventListener('scroll', update, { passive: true });
  }
}

// The boxes that scroll on their own. Each fades at an edge while there is more to
// scroll past it, instead of cutting the rows off.
const FADING_BOXES = '.event-page-body, .day-panel, .calendar-panel, .admin-page';

function watchScrollEdges(app: HTMLElement): void {
  for (const box of Array.from(app.querySelectorAll<HTMLElement>(FADING_BOXES))) {
    const update = () => {
      // A box that does not scroll (it shows everything, or the window scrolls it)
      // never fades.
      const overflow = getComputedStyle(box).overflowY;
      const scrolls = (overflow === 'auto' || overflow === 'scroll') &&
        box.scrollHeight > box.clientHeight + 1;
      box.classList.toggle('more-above', scrolls && box.scrollTop > 1);
      box.classList.toggle('more-below', scrolls &&
        box.scrollTop + box.clientHeight < box.scrollHeight - 1);
    };
    update();
    box.addEventListener('scroll', update, { passive: true });
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
    isAdmin: isAdmin(person),
    // Signed in: the in-game name once it is set, otherwise "Me".
    playerName: person ? person.account?.inGameName || 'Me' : null
  });

  if (view.openPage === 'player') {
    app.innerHTML = bar +
      `<main class="page">${playerPage({
        alliances: alliancesStillHere(alliances), myAllianceId: view.myAllianceId, person, stateNumber: STATE_NUMBER,
        troopsHtml: playerTroopsSection(workContext())
      })}</main>`;
    return;
  }

  if (view.openPage !== 'calendar') {
    const page = pageById(view.openPage);
    const subPage = view.openSubPage || page?.pages[0]?.id || '';
    const built =
      view.openPage === 'fortress' && subPage === 'board' ? fortressBoardMarkup() :
      view.openPage === 'fortress' && subPage === 'planning' ? fortressPlanningMarkup() :
      view.openPage === 'fortress' && subPage === 'rewards' ? fortressRewardsMarkup() :
      view.openPage === 'state'
        ? statePage({ stateNumber: STATE_NUMBER, alliances: alliancesStillHere(alliances), schedules }) +
          svsHistorySection(workContext()) :
      view.openPage === 'alliance' && subPage === 'times'
        ? allianceTimesPage(view.myAllianceId ? allianceById(view.myAllianceId) : undefined, schedules) :
      view.openPage === 'transfers' && subPage === 'timeline' ? predictionsMarkup() :
      view.openPage === 'transfers' && subPage === 'invites' ? nextTransferMarkup() :
      view.openPage === 'transfers' && subPage === 'records' ? pastTransfersMarkup() :
      workingPageMarkup(view.openPage, subPage);
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
  const eventTypeId = currentEventTypeId();
  return eventTypeId ? eventTypeShortName(eventTypeId) : PAGES[3].label;
}

function currentEventTypeId(): string | null {
  return currentEventRun()?.eventTypeId ?? null;
}

// The run the event section is about: the planned event running now, or the next one.
function currentEventRun(): Occurrence | null {
  const today = todayNumber();
  const runs = runsBetween(today - 30, today + 200)
    .filter(one => PLANNED_EVENT_TYPE_IDS.includes(one.eventTypeId))
    .sort((left, right) => left.startMinute - right.startMinute);
  const now = nowMinute();
  const running = runs.find(one => one.startMinute <= now && one.endMinute > now);
  const next = runs.find(one => one.startMinute > now);
  return running ?? next ?? null;
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
  // Today goes back to today and picks it, closing any open event, as the old app did.
  // On a phone it does not slide the day's panel up; the calendar stays in view.
  if (direction === 0) {
    view.focusDay = todayNumber();
    view.chosenDay = todayNumber();
    view.openEventKey = null;
    view.pickedRowKey = null;
    view.openedFromDay = null;
    view.pickedYearRun = null;
    startAtTop.panel = true;
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

  // Signing in sends the browser to Discord or Google, which bring it back here.
  const signInButton = target.closest<HTMLElement>('[data-sign-in]');
  if (signInButton) {
    signInWith(signInButton.dataset.signIn as SignInProvider).catch(problem => {
      const message = document.querySelector('[data-sign-in-message]');
      if (message) message.textContent = problem instanceof Error ? problem.message : String(problem);
    });
    return;
  }
  if (target.closest('[data-sign-out]')) {
    void signOut().then(() => { person = null; view.openPage = 'calendar'; draw(); });
    return;
  }
  const removeAltButton = target.closest<HTMLElement>('[data-remove-alt]');
  if (removeAltButton) {
    void removeAltAccount(Number(removeAltButton.dataset.removeAlt)).then(refreshPerson);
    return;
  }

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
    // "Check history" goes to its part of the page.
    const part = pageButton.dataset.scrollTo ? document.getElementById(pageButton.dataset.scrollTo) : null;
    part?.scrollIntoView({ block: 'start' });
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
    // On a phone the overview is in the panel that slides up, so a tap opens it.
    view.isPanelOpen = true;
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

  // A white line on a bar shows its time, as on hover, and opens nothing. So does a
  // play window's line (Wild Brawl).
  const lineMark = target.closest<HTMLElement>('.bar-mark, .bar-window');
  if (lineMark) {
    document.querySelectorAll('.bar-mark.show-time, .bar-window.show-time').forEach(other => {
      if (other !== lineMark) other.classList.remove('show-time');
    });
    lineMark.classList.toggle('show-time');
    return;
  }

  // A pencil opens its form in place; Cancel closes it.
  const editButton = target.closest<HTMLElement>('[data-edit]');
  // A remove or unlink asks first; the second tap does it.
  if (editButton && view.editing === editButton.dataset.edit &&
      /^(remove|unlink)\|/.test(editButton.dataset.edit ?? '')) {
    void removeFromWorkingPage(editButton.dataset.edit as string);
    return;
  }
  if (editButton) {
    view.editing = view.editing === editButton.dataset.edit ? null : editButton.dataset.edit as string;
    // The head's forms open at the top of the event's page.
    if (view.editing?.startsWith('head|')) startAtTop.panel = true;
    draw();
    return;
  }
  if (target.closest('[data-cancel-edit]')) {
    view.editing = null;
    draw();
    return;
  }

  const workChoice = target.closest<HTMLElement>('[data-work-choice]');
  if (workChoice) {
    const [name, value] = (workChoice.dataset.workChoice as string).split('|');
    workChoices.set(name, value);
    draw();
    return;
  }
  const opponentToggle = target.closest<HTMLElement>('[data-opponent-toggle]');
  if (opponentToggle) {
    const name = 'opponents-' + opponentToggle.dataset.opponentToggle;
    workChoices.set(name, workChoices.get(name) === 'on' ? '' : 'on');
    rememberChoices();
    draw();
    return;
  }
  const rosterStatus = target.closest<HTMLElement>('[data-roster-status]');
  if (rosterStatus && person) {
    const roster = (tableRows.get('rosters') ?? []).find(one => String(one.id) === rosterStatus.dataset.rosterStatus);
    if (roster) {
      void saveRow('rosters', { id: roster.id, status: roster.status === 'final' ? 'in_progress' : 'final',
        updated_by: person.userId, updated_at: new Date().toISOString() })
        .then(() => rereadTables('rosters')).then(draw);
    }
    return;
  }
  const approveButton = target.closest<HTMLElement>('[data-approve-alliance]');
  if (approveButton && person) {
    void saveRow('alliances', { id: approveButton.dataset.approveAlliance, status: 'approved',
      approved_by: person.userId, approved_at: new Date().toISOString() })
      .then(() => rereadTables('alliances')).then(draw);
    return;
  }

  const infoTabButton = target.closest<HTMLElement>('[data-info-tab]');
  if (infoTabButton) {
    view.openInfoTab = infoTabButton.dataset.infoTab as string;
    rememberChoices();
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

  // A row's arrow opens or closes its points, any number of them at once. Only that
  // fold changes: nothing is redrawn, so the panel does not move. What is open is
  // kept, so a later redraw leaves it open.
  const pointsArrow = target.closest('.tree-arrow');
  if (pointsArrow) {
    event.preventDefault();
    const fold = pointsArrow.closest<HTMLDetailsElement>('details[data-points-key]');
    if (fold) {
      const key = fold.dataset.pointsKey as string;
      fold.open = !fold.open;
      if (fold.open) view.openPointRows.add(key);
      else view.openPointRows.delete(key);
    }
    return;
  }

  // Any other tap on a row marks the row. The fold under it must not open or close.
  const rowButton = target.closest<HTMLElement>('[data-row-key]');
  if (rowButton) {
    event.preventDefault();
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

const WORKING_FORMS = ['availability', 'roster', 'roster-member', 'plan', 'academy', 'facility', 'setting', 'role',
  'result', 'personal', 'alliance-records', 'opponent-note', 'transfer-window', 'candidate', 'candidate-status',
  'candidate-flag', 'blacklist', 'player-troops'];

// The transfer pages read their own copy of the windows and candidates.
async function reloadTransfers(): Promise<void> {
  transferWindows = await loadTransferWindows().catch(() => transferWindows);
  transferCandidates = await loadCandidatesOf(transferWindows.map(one => one.id)).catch(() => transferCandidates);
}

// Forms: the player's account, a farm or alt to add, and the forms the pencils open.
function handleSubmits(event: SubmitEvent): void {
  const form = (event.target as HTMLElement | null)?.closest<HTMLFormElement>('form[data-form]');
  if (!form || !person) return;
  event.preventDefault();
  const values = new FormData(form);
  const text = (name: string) => String(values.get(name) ?? '').trim();
  const message = form.querySelector<HTMLElement>('[data-form-message]');
  const signedIn = person;
  if (WORKING_FORMS.includes(form.dataset.form ?? '')) {
    const formName = form.dataset.form as string;
    for (const button of Array.from(form.querySelectorAll('button'))) button.disabled = true;
    saveWorkingForm(formName, form.dataset.key ?? '', text, values, signedIn.userId)
      .then(async tables => { view.editing = null; await rereadTables(...tables); draw(); })
      .catch(problem => {
        for (const button of Array.from(form.querySelectorAll('button'))) button.disabled = false;
        if (message) message.textContent = problem instanceof Error ? problem.message : String(problem);
      });
    return;
  }
  if (form.dataset.form?.startsWith('edit-')) {
    let save: Promise<void>;
    try {
      save = saveEdit(form.dataset.form, form.dataset.key ?? '', text, values, signedIn.userId);
    } catch (problem) {
      save = Promise.reject(problem);
    }
    for (const button of Array.from(form.querySelectorAll('button'))) button.disabled = true;
    save.then(async () => { view.editing = null; await reloadAfterEdit(form.dataset.form as string); })
      .catch(problem => {
        for (const button of Array.from(form.querySelectorAll('button'))) button.disabled = false;
        if (message) message.textContent = problem instanceof Error ? problem.message : String(problem);
      });
    return;
  }
  const save = form.dataset.form === 'account'
    ? saveAccount(signedIn.userId, {
        inGameName: text('inGameName'), inGameId: text('inGameId'), allianceId: text('allianceId') || null
      })
    : form.dataset.form === 'alt'
      ? addAltAccount(signedIn.userId, {
          inGameName: text('inGameName'), inGameId: text('inGameId'), kind: text('kind') === 'alt' ? 'alt' : 'farm'
        })
      : Promise.resolve();
  for (const button of Array.from(form.querySelectorAll('button'))) button.disabled = true;
  save.then(refreshPerson).catch(problem => {
    for (const button of Array.from(form.querySelectorAll('button'))) button.disabled = false;
    if (message) message.textContent = problem instanceof Error ? problem.message : String(problem);
  });
}

// The second tap on Remove or Unlink on a working page.
async function removeFromWorkingPage(edit: string): Promise<void> {
  const parts = edit.split('|');
  view.editing = null;
  if (parts[0] === 'remove') {
    await deleteRow(parts[1], 'id', Number(parts[2])).catch(() => undefined);
    await rereadTables(parts[1]);
  } else if (parts[0] === 'unlink') {
    await saveRow('alliances', { id: parts[1], main_alliance_id: null }).catch(() => undefined);
    alliances = await loadAlliances().catch(() => alliances);
    rememberAlliances(alliances);
  }
  draw();
}

// What a working page's form saves, and the tables to read again after it.
async function saveWorkingForm(
  formName: string, key: string, text: (name: string) => string, values: FormData, userId: string
): Promise<string[]> {
  const now = new Date().toISOString();
  const orNull = (name: string) => text(name) || null;
  const hour = (name: string) => {
    if (!text(name)) return null;
    const number = Number(text(name));
    if (!Number.isInteger(number) || number < 0 || number > 23) throw new Error(`"${text(name)}" is not an hour from 0 to 23.`);
    return number;
  };
  const decimal = (name: string) => {
    if (!text(name)) return null;
    const number = Number(text(name).replace(/[, ]/g, ''));
    if (Number.isNaN(number)) throw new Error(`"${text(name)}" is not a number.`);
    return number;
  };
  const run = currentEventRun();
  const runColumns = run ? { event_type_id: run.eventTypeId, event_date: textFromDay(run.startDay) } : null;

  if (formName === 'availability') {
    if (!runColumns) throw new Error('No event is coming up.');
    const scores = ['infantry', 'lancer', 'marksmen'].map(kind =>
      troopScore(text(kind + '_tier'), text(kind + '_skill_level')));
    const from = hour('from_hour_utc');
    const to = hour('to_hour_utc');
    const isUnavailable = values.get('is_unavailable') === 'on';
    if (!isUnavailable && (from === null || to === null)) throw new Error('Fill in the hours you can play, or tick that you cannot play.');
    const saved = await saveRow('availability', {
      id: key || undefined, ...runColumns, account_id: userId,
      alliance_id: view.myAllianceId, playing_for_alliance_id: orNull('playing_for_alliance_id'),
      is_unavailable: isUnavailable,
      infantry_tier: orNull('infantry_tier'), infantry_skill_level: Number(text('infantry_skill_level')) || 0,
      lancer_tier: orNull('lancer_tier'), lancer_skill_level: Number(text('lancer_skill_level')) || 0,
      marksmen_tier: orNull('marksmen_tier'), marksmen_skill_level: Number(text('marksmen_skill_level')) || 0,
      infantry_score: scores[0], lancer_score: scores[1], marksmen_score: scores[2],
      total_troop_score: scores.some(score => score !== null) ? scores.reduce<number>((total, score) => total + (score ?? 0), 0) : null,
      has_monthly_card: values.get('has_monthly_card') === 'on',
      updated_at: now
    }, key ? '' : 'event_type_id,event_date,account_id');
    await deleteRow('availability_times', 'availability_id', saved.id);
    if (!isUnavailable && from !== null && to !== null) {
      await saveRow('availability_times', { availability_id: saved.id, from_hour_utc: from, to_hour_utc: to });
    }
    return ['availability', 'availability_times'];
  }
  if (formName === 'roster') {
    if (!runColumns) throw new Error('No event is coming up.');
    await saveRow('rosters', { ...runColumns, alliance_id: text('allianceId') || text('alliance_id'), status: 'in_progress', updated_by: userId, updated_at: now });
    return ['rosters'];
  }
  if (formName === 'roster-member') {
    await saveRow('roster_members', {
      roster_id: Number(key), in_game_name: text('in_game_name'), in_game_id: text('in_game_id'),
      member_role: text('member_role') || 'joiner', note: orNull('note')
    });
    return ['roster_members'];
  }
  if (formName === 'plan') {
    if (!runColumns && !key) throw new Error('No event is coming up.');
    await saveRow('plans', {
      id: key || undefined, ...(key ? {} : runColumns), title: text('title'), status: text('status') || 'draft',
      content: text('content'), updated_by: userId, updated_at: now
    });
    return ['plans'];
  }
  if (formName === 'result') {
    const [eventTypeId, date, keyAllianceId, existingId] = key.split('|');
    const allianceId = keyAllianceId || orNull('alliance_id');
    const whole = (name: string) => {
      if (!text(name)) return null;
      const number = Number(text(name));
      if (!Number.isInteger(number)) throw new Error(`"${text(name)}" is not a whole number.`);
      return number;
    };
    // Winter Siege's "no opponent" is kept with the result's details; a win or loss is
    // its outcome too.
    const outcome = orNull('outcome') ?? (['win', 'loss'].includes(text('detail_outcome')) ? text('detail_outcome') : null);
    const before = (tableRows.get('results') ?? []).find(one => String(one.id) === existingId);
    const rank = whole('rank');
    const saved = await saveRow('results', {
      id: existingId ? Number(existingId) : undefined, event_type_id: eventTypeId, event_date: date,
      alliance_id: allianceId, state_alliance_id: orNull('state_alliance_id'),
      outcome, rank, note: orNull('note'),
      updated_by: userId, updated_at: now
    });
    // A Championship group rank adds the alliance's Stars for its tier; changing a rank
    // already recorded takes back what the old rank gave.
    if (eventTypeId === 'alliance-championship' && allianceId && rank !== (before?.rank ?? null)) {
      await rereadTables('alliance_records');
      const record = (tableRows.get('alliance_records') ?? []).find(one => one.alliance_id === allianceId);
      const tier = String(record?.championship_tier ?? 'Iron');
      const change = championshipStars(tier, rank) - championshipStars(tier, (before?.rank as number | null) ?? null);
      if (change) {
        await saveRow('alliance_records', {
          alliance_id: allianceId, championship_tier: tier,
          championship_stars: (Number(record?.championship_stars) || 0) + change, updated_by: userId, updated_at: now
        }, 'alliance_id');
      }
    }
    await deleteRow('result_details', 'result_id', saved.id);
    // The site's build knows FormData's forEach, not its entries.
    const details: [string, string][] = [];
    values.forEach((value, name) => {
      if (name.startsWith('detail_') && String(value).trim()) details.push([name.slice(7), String(value).trim()]);
    });
    for (const [detailKey, detailValue] of details) {
      await saveRow('result_details', { result_id: saved.id, detail_key: detailKey, detail_value: detailValue });
    }
    await deleteRow('result_opponents', 'result_id', saved.id);
    for (const [slot, suffix] of [[1, ''], [2, '_2'], [3, '_3'], [4, '_4'], [5, '_5']] as [number, string][]) {
      if (text('opponent_state' + suffix) || text('opponent_alliance' + suffix)) {
        await saveRow('result_opponents', { result_id: saved.id, slot,
          opponent_state: whole('opponent_state' + suffix), opponent_alliance: orNull('opponent_alliance' + suffix) }, 'result_id,slot');
      }
    }
    return ['results', 'result_details', 'result_opponents', 'alliance_records'];
  }
  if (formName === 'personal') {
    const [scheduleId, originalDate, existingId] = key.split('|');
    const rank = text('rank') ? Number(text('rank')) : null;
    if (rank !== null && !Number.isInteger(rank)) throw new Error(`"${text('rank')}" is not a rank.`);
    await saveRow('personal_entries', {
      id: existingId ? Number(existingId) : undefined, account_id: userId, schedule_id: scheduleId, original_date: originalDate,
      my_time: cleanTime(text('my_time')), rank, note: orNull('note'), updated_at: now
    });
    return ['personal_entries'];
  }
  if (formName === 'alliance-records') {
    const stars = text('championship_stars') ? Number(text('championship_stars')) : null;
    if (stars !== null && !Number.isInteger(stars)) throw new Error(`"${text('championship_stars')}" is not a number of stars.`);
    await saveRow('alliance_records', {
      alliance_id: key,
      results_off: ALLIANCE_RESULT_EVENTS.filter(eventTypeId => values.get('keep_' + eventTypeId) !== 'on'),
      showdown_star_rating: decimal('showdown_star_rating'),
      winter_siege_tier: orNull('winter_siege_tier'), championship_tier: orNull('championship_tier'),
      championship_stars: stars, updated_by: userId, updated_at: now
    }, 'alliance_id');
    return ['alliance_records'];
  }
  if (formName === 'opponent-note') {
    const state = Number(text('opponent_state'));
    if (!Number.isInteger(state)) throw new Error(`"${text('opponent_state')}" is not a state number.`);
    await saveRow('opponent_notes', {
      opponent_state: state, opponent_tag: text('opponent_tag'), alliance_id: key, note: text('note'), written_by: userId
    });
    return ['opponent_notes'];
  }
  if (formName === 'transfer-window') {
    const isNew = !/^\d+$/.test(key);
    await saveRow('transfer_windows', {
      id: isNew ? undefined : Number(key), ...(isNew ? { transfer_date: key } : {}),
      state_type: text('state_type') || 'ordinary', power_cap: decimal('power_cap'),
      special_invites_available: decimal('special_invites_available') ?? 0, status: text('status') || 'planning',
      note: orNull('note'), updated_by: userId, updated_at: now
    });
    await reloadTransfers();
    return ['transfer_windows'];
  }
  if (formName === 'player-troops') {
    const skill = (name: string) => Number(text(name)) || 0;
    const before = (tableRows.get('accounts') ?? []).find(one => one.id === userId);
    const power = decimal('player_power');
    const foundry = decimal('foundry_power');
    await saveRow('accounts', {
      id: userId, player_power: power, foundry_power: foundry,
      // A figure's date moves only when the figure changes, so a stale one shows as stale.
      ...(power !== Number(before?.player_power ?? NaN) ? { player_power_updated_at: now } : {}),
      ...(foundry !== Number(before?.foundry_power ?? NaN) ? { foundry_power_updated_at: now } : {}),
      infantry_tier: orNull('infantry_tier'), infantry_skill_level: skill('infantry_skill_level'),
      lancer_tier: orNull('lancer_tier'), lancer_skill_level: skill('lancer_skill_level'),
      marksmen_tier: orNull('marksmen_tier'), marksmen_skill_level: skill('marksmen_skill_level'),
      updated_at: now
    });
    return ['accounts'];
  }
  if (formName === 'candidate') {
    await saveRow('transfer_candidates', {
      window_id: Number(key), in_game_name: text('in_game_name'), in_game_id: text('in_game_id'),
      player_power: decimal('player_power'), fc_level: orNull('fc_level'), current_state: decimal('current_state'),
      destination_alliance_id: orNull('destination_alliance_id'), stage: orNull('stage'),
      priority: decimal('priority') ?? 0, note: orNull('note'), added_by: userId, added_at: now, updated_at: now
    });
    await reloadTransfers();
    return ['transfer_candidates'];
  }
  if (formName === 'candidate-status') {
    await saveRow('transfer_candidates', {
      id: Number(key), stage: orNull('stage'), invite_status: orNull('invite_status'), outcome: orNull('outcome'),
      note: orNull('note'), updated_at: now
    });
    await reloadTransfers();
    return ['transfer_candidates'];
  }
  if (formName === 'candidate-flag') {
    await saveRow('candidate_flags', { candidate_id: Number(key), flagged_by: userId, reason: text('reason'), created_at: now });
    return ['candidate_flags'];
  }
  if (formName === 'blacklist') {
    await saveRow('blacklist', { in_game_id: text('in_game_id'), in_game_name: orNull('in_game_name'),
      reason: text('reason'), added_by: userId, added_at: now }, 'in_game_id');
    return ['blacklist'];
  }
  if (formName === 'academy') {
    await saveRow('alliances', { id: text('alliance_id'), main_alliance_id: key, updated_by: userId, updated_at: now });
    alliances = await loadAlliances().catch(() => alliances);
    rememberAlliances(alliances);
    return ['alliances'];
  }
  if (formName === 'facility') {
    await saveRow('facilities', { id: Number(key), alliance_id: orNull('alliance_id'), updated_by: userId, updated_at: now });
    return ['facilities'];
  }
  if (formName === 'setting') {
    await saveRow('settings', { id: Number(key), setting_value: text('setting_value'), updated_by: userId, updated_at: now });
    return ['settings'];
  }
  if (formName === 'role') {
    const role = text('role');
    if (role === 'alliance_manager' && !text('alliance_id')) throw new Error('Pick the alliance this person manages.');
    await saveRow('account_roles', {
      account_id: text('account_id'), role, alliance_id: role === 'alliance_manager' ? text('alliance_id') : null,
      granted_by: userId, granted_at: now
    });
    return ['account_roles'];
  }
  return [];
}

// What a pencil's form saves. A typed time that is not a time of day stops it here.
function saveEdit(
  formName: string, key: string, text: (name: string) => string, values: FormData, userId: string
): Promise<void> {
  const wholeNumber = (name: string) => {
    if (!text(name)) return null;
    const number = Number(text(name));
    if (!Number.isInteger(number) || number < 1) throw new Error(`"${text(name)}" is not a number of days.`);
    return number;
  };
  if (formName === 'edit-schedule') {
    return saveScheduleRepeat(key, {
      firstDate: text('firstDate'),
      repeatEveryDays: wholeNumber('repeatEveryDays'),
      lengthDays: wholeNumber('lengthDays'),
      startTimeUtc: cleanTime(text('startTimeUtc')),
      endTimeUtc: cleanTime(text('endTimeUtc')),
      datesAreEstimated: values.get('datesAreEstimated') === 'on'
    }, userId);
  }
  if (formName === 'edit-alliance-time') {
    return saveAllianceTime(key, {
      startTimeUtc: cleanTime(text('startTimeUtc')), endTimeUtc: cleanTime(text('endTimeUtc'))
    }, userId);
  }
  if (formName === 'edit-date') {
    const [scheduleId, originalDate] = key.split('|');
    return saveDateChange(scheduleId, originalDate, {
      movedToDate: text('movedToDate') || null,
      startTimeUtc: cleanTime(text('startTimeUtc')),
      endTimeUtc: cleanTime(text('endTimeUtc')),
      isConfirmed: values.get('isConfirmed') === 'on',
      note: text('note') || null
    }, userId);
  }
  if (formName === 'edit-fort') {
    const [, season, phase, fort] = key.split('|');
    const battleTime = cleanTime(text('battleTime'));
    const battleDay = fortBattleDayOf(Number(season), Number(phase));
    return saveFortAssignment({ season: Number(season), phase: Number(phase), fort }, {
      allianceId: text('allianceId'),
      // The database keeps the battle's full date and time in UTC.
      battleAt: battleTime && battleDay !== null ? textFromDay(battleDay) + 'T' + battleTime + ':00Z' : null
    }, userId);
  }
  return Promise.resolve();
}

// The battle day of a season's phase, counted from the first battle day written down.
function fortBattleDayOf(season: number, phase: number): number | null {
  if (Number.isNaN(firstFortBattleDay)) return null;
  const count = { firstBattleDay: firstFortBattleDay, firstSeason: FIRST_FORT_SEASON };
  // Seasons run back to back; search the days around the first battle day for this one.
  for (let day = firstFortBattleDay - 400; day <= firstFortBattleDay + 4000; day++) {
    const fortDay = fortPhaseOfDay(day, count);
    if (fortDay && fortDay.season === season && fortDay.phase === phase) return day;
  }
  return null;
}

// After a save: read again what it changed, then redraw.
async function reloadAfterEdit(formName: string): Promise<void> {
  if (formName === 'edit-fort') {
    fortAssignments = await loadFortAssignments(FIRST_FORT_SEASON).catch(() => fortAssignments);
  } else {
    const [loadedSchedules, changes] = await Promise.all([loadSchedules(), loadDateChanges()]);
    schedules = loadedSchedules;
    expandOptions = { allSchedules: loadedSchedules, changesBySchedule: groupChanges(changes), partOfByEventTypeId };
    // A moved SvS or Sunfire changes which battle a transfer follows.
    rememberBattleDays();
  }
  draw();
}

// After a change to the account: read it again, follow its alliance, and redraw.
async function refreshPerson(): Promise<void> {
  person = await signedInPerson().catch(() => person);
  // The working pages read accounts and alts again with the change in them.
  tableRows.delete('accounts');
  tableRows.delete('account_alt_accounts');
  if (person?.account?.allianceId) view.myAllianceId = person.account.allianceId;
  draw();
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

// ---------- Swiping the calendar on a phone ----------
// A phone has no arrows: a sideways swipe over the calendar moves a month, a week or a
// year, the same as the arrows on a computer. A swipe that is mostly up or down is
// scrolling and is left alone.
const PHONE_WIDTH = 1000;
const SWIPE_DISTANCE = 60;
let swipeStart: { x: number; y: number } | null = null;

function startSwipe(event: TouchEvent): void {
  const target = event.target as HTMLElement | null;
  swipeStart = null;
  if (window.innerWidth >= PHONE_WIDTH || view.openPage !== 'calendar' || view.isPanelOpen) return;
  if (!target?.closest('.calendar-panel') || event.touches.length !== 1) return;
  swipeStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
}

function endSwipe(event: TouchEvent): void {
  if (!swipeStart) return;
  const across = event.changedTouches[0].clientX - swipeStart.x;
  const down = event.changedTouches[0].clientY - swipeStart.y;
  swipeStart = null;
  if (Math.abs(across) < SWIPE_DISTANCE || Math.abs(across) < Math.abs(down) * 1.5) return;
  // Swiping to the left brings in what comes next, as turning a page does.
  step(across < 0 ? 1 : -1);
  startAtTop.calendar = true;
  draw();
}

// ---------- The phone's own back ----------
// Every place the site's own Back would take you from is written into the browser's
// history, so the phone's back (or the browser's) does what the site's Back does
// instead of leaving the site. Moving between sections is not written in: the phone's
// back never goes from one section to another; sections are opened by tapping them.
//
// How deep you are: on a phone the day's panel over the calendar is one step; an event
// opened from a day's timeline is one more, on a computer as well, because it has its
// own way back to the day there too.
function backLevel(): number {
  if (view.openPage !== 'calendar') return 0;
  const isPhone = window.innerWidth < PHONE_WIDTH;
  // On a phone a closed panel is the calendar itself, whatever was open in it.
  if (isPhone && !view.isPanelOpen) return 0;
  let level = isPhone ? 1 : 0;
  if (view.openEventKey && view.openedFromDay !== null) level += 1;
  return level;
}

function placeKey(): string {
  return String(backLevel());
}

// What is put back when the phone's back lands on a place.
function placeSnapshot() {
  return {
    openPage: view.openPage, openSubPage: view.openSubPage, isPanelOpen: view.isPanelOpen,
    chosenDay: view.chosenDay, openEventKey: view.openEventKey, openEventDay: view.openEventDay,
    openedFromDay: view.openedFromDay, tappedKey: view.tappedKey,
    // A minute that is not a number cannot be written into the history, so it is kept
    // as null and read back as not a number.
    tappedMinute: Number.isNaN(view.tappedMinute) ? null : view.tappedMinute,
    pickedRowKey: view.pickedRowKey, pickedYearRun: view.pickedYearRun
  };
}
type PlaceSnapshot = ReturnType<typeof placeSnapshot>;

// The places in the history, in order, and where we are in them.
const placeKeys: string[] = [];
let placeIndex = 0;
// Set when the site's own Back stepped the history back itself, so arriving there
// changes nothing on screen.
let isSteppingBackOurselves = false;

// The address of what is on screen, so it can be shared: the section, the picked day
// and the open event. "?event=...&day=2026-11-27" opens that event from that day.
function placeAddress(): string {
  const parts = new URLSearchParams();
  if (view.openPage !== 'calendar') parts.set('page', view.openPage);
  if (view.openSubPage) parts.set('sub', view.openSubPage);
  if (view.openPage === 'calendar') {
    if (view.openEventKey) {
      parts.set('event', view.openEventKey);
      parts.set('day', textFromDay(view.openEventDay));
    } else if (view.chosenDay !== todayNumber()) {
      parts.set('day', textFromDay(view.chosenDay));
    }
  }
  const query = parts.toString();
  return window.location.pathname + (query ? '?' + query : '');
}

// Opening the site from a shared address: its section, its day and its event.
function openSharedAddress(): void {
  const parts = new URLSearchParams(window.location.search);
  const page = parts.get('page');
  if (page && pageById(page)) view.openPage = page;
  const sub = parts.get('sub');
  if (sub) view.openSubPage = sub;
  const day = dayFromText(parts.get('day') ?? '');
  if (!Number.isNaN(day)) {
    view.chosenDay = day;
    view.focusDay = day;
    view.isPanelOpen = true;
  }
  const eventKey = parts.get('event');
  if (eventKey) {
    view.openEventKey = eventKey;
    view.openEventDay = Number.isNaN(day) ? todayNumber() : day;
    view.isPanelOpen = true;
    view.scrollsToMarkedRow = true;
  }
}

function syncHistory(): void {
  const key = placeKey();
  if (!placeKeys.length) {
    placeKeys.push(key);
    history.replaceState({ placeIndex: 0, place: placeSnapshot() }, '', placeAddress());
    return;
  }
  if (key === placeKeys[placeIndex]) {
    // Same place, something else in it (another day, another event): kept up to date
    // so the phone's back returns to it as it was.
    history.replaceState({ placeIndex, place: placeSnapshot() }, '', placeAddress());
    return;
  }
  // The site's own Back took us to a place we came through (one step back, or more:
  // on a phone Back closes the whole panel), so the history steps back to it too.
  // Otherwise the phone's back would reopen what was just closed.
  const earlier = placeKeys.lastIndexOf(key, placeIndex - 1);
  if (placeIndex > 0 && earlier >= 0) {
    isSteppingBackOurselves = true;
    history.go(earlier - placeIndex);
    return;
  }
  placeIndex += 1;
  placeKeys.length = placeIndex;
  placeKeys.push(key);
  history.pushState({ placeIndex, place: placeSnapshot() }, '', placeAddress());
}

function returnToPlace(event: PopStateEvent): void {
  const state = event.state as { placeIndex: number; place: PlaceSnapshot } | null;
  if (!state) return;
  const isGoingBack = state.placeIndex < placeIndex;
  placeIndex = state.placeIndex;
  if (isSteppingBackOurselves) {
    isSteppingBackOurselves = false;
    history.replaceState({ placeIndex, place: placeSnapshot() }, '', placeAddress());
    return;
  }
  const place = state.place;
  if (isGoingBack) {
    // Going back does exactly what the site's own Back does, and nothing more: an
    // event opened from a day goes back to that day, and otherwise the panel closes
    // and the calendar shows. The picked day and the open section stay as they are.
    const targetLevel = Number(placeKeys[placeIndex] ?? 0);
    while (backLevel() > targetLevel) {
      if (view.openEventKey && view.openedFromDay !== null) {
        view.openEventKey = null;
        view.pickedRowKey = null;
        view.openedFromDay = null;
      } else {
        view.isPanelOpen = false;
        break;
      }
    }
  } else if (place.openPage === view.openPage) {
    // The browser's forward, inside the same section: that place as it was.
    Object.assign(view, place, {
      tappedMinute: place.tappedMinute === null ? NaN : place.tappedMinute
    });
  }
  // After a reload the list starts again, while the browser still holds the places
  // from before it, so the place we land on is written into the list here.
  placeKeys[placeIndex] = placeKey();
  startAtTop.panel = true;
  draw();
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
    // The state's hero generation on each transfer date, for the heroes named in texts.
    setGenerationSteps(await loadGenerationsOfState(Number(STATE_NUMBER)).catch(() => []));
    transferWindows = await loadTransferWindows().catch(() => []);
    transferCandidates = await loadCandidatesOf(transferWindows.map(one => one.id)).catch(() => []);
    const comingDate = nextWindow()?.transferDate ??
      transferDates.find(one => one >= textFromDay(todayNumber())) ?? '';
    if (comingDate) {
      nextWindowGroups = await loadTransferGroups([comingDate]).catch(() => []);
    }
    // The runs are worked out from these, so they are set before the battle days are
    // read; without them every transfer followed neither battle and the SvS and
    // Sunfire filters emptied the page.
    expandOptions = {
      allSchedules: loadedSchedules,
      changesBySchedule: groupChanges(changes),
      partOfByEventTypeId
    };
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

    applyKeptChoices();
    openSharedAddress();
    setOpenPointRows(view.openPointRows);
    // Who is signed in. A signed-in player's alliance is the one on their account.
    person = await signedInPerson().catch(() => null);
    if (person?.account?.allianceId) view.myAllianceId = person.account.allianceId;
    document.addEventListener('click', handleClicks);
    document.addEventListener('submit', handleSubmits);
    document.addEventListener('touchstart', startSwipe, { passive: true });
    document.addEventListener('touchend', endSwipe, { passive: true });
    window.addEventListener('popstate', returnToPlace);
    // The site puts every scroll back itself; the browser's own would jump to the top
    // whenever the history steps back.
    history.scrollRestoration = 'manual';
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
