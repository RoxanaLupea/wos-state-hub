import './ui/tokens.css';
import './ui/layout.css';
import { allianceById, allianceFamilyOf, allianceTag, alliancesStillHere, loadAlliances, rememberAlliances, type Alliance } from './data/alliances.ts';
import {
  loadFortAssignments, loadRallyLeads, loadBuffAllocations,
  type FortAssignment, type RallyLead, type BuffAllocation
} from './data/forts.ts';
import { escapeForPage } from './ui/escape.ts';
import { battleDayOf, phaseOf, seasonNumberOf, seasonStartFor, FORT_PHASES } from './calendar/fort-season.ts';
import { fortressBoard, seasonTable, seasonTotals, type InPlaceEditing } from './ui/fortress.ts';
import { loadGenerationsOfState, loadTransferDates, loadTransferGroups } from './data/transfer-groups.ts';
import { setFortRewardsGeneration, setGenerationSteps } from './data/heroes.ts';
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
  categoryOf, dayNameOf, eventStepsByEventType, eventTypeById, eventTypeName, eventTypeShortName, eventTypeStageName, wholeEventTypeOf,
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
import { preferencesFrom, readPreferences, savePreferencesWithLogin, writePreferences, type Preferences } from './data/preferences.ts';
import {
  isAdmin, isOwner, leadsAlliance, managesBattles, managesState, signInWith, signOut,
  signedInPerson, type SignedInPerson, type SignInProvider
} from './data/auth.ts';
import {
  cleanTime, saveAllianceTime, saveDateChange, saveFortAssignment, saveScheduleRepeat
} from './data/editing.ts';
import { PENCIL_ICON, allianceTimeForm, dateChangeForm, editButton, fortForm, pencilButton, scheduleForm } from './ui/edit-forms.ts';
import { deleteRow, loadRows, saveRow, type Row } from './data/records.ts';
import { saveGameAccount, setGameAccountKinds } from './data/player-profile.ts';
import {
  accountColour, accountMenu, accountQuestion, filterFoundryPower, fitPlayerPage, foundryText, filterId, gameReadOf, idProblem, rosterEntriesOf, stateBoardsOf, TROOP_KINDS, withRoster,
  type AllianceMove, type BarAccount, type BoardEntry, type GameRead, type LookUpState, type RosterEntry, type SkillLevels, type TroopKind
} from './ui/player-profile.ts';
import { askGameRefresh, lookUpGameAccount, readGamePlayers, readGameRosters, readPlayerAlliances, readStateRanks, readSkillLevels, setSkillLevel, settleAllianceMove } from './data/game-data.ts';
import {
  ALLIANCE_RESULT_EVENTS, allianceResultsPage, championshipStars, opponentNotesPage, resultsTab, resultsTabActions, showdownScoreOf,
  svsHistorySection, sunfireHistorySection
} from './ui/results.ts';
import { SVS_EDIT_FORM_ID, preparationOutcome, typeHoldTime, updateSvsEditor } from './ui/svs-results.ts';
import { personalEntryForm, personalEntryOf } from './ui/personal-entry.ts';
import {
  academiesPage, availabilityPage, facilitiesPage, membersPage, planPage, requestsPage, rolesPage,
  rosterPage, settingsPage, territoryPage, transferWorkSections, type WorkContext
} from './ui/working-pages.ts';
import { yearRunSteps, yearViewRuns, type YearRun } from './calendar/year-runs.ts';
import { evenColour } from './ui/even-colour.ts';
import { PAGES, calendarToolbar, pageById, sectionNav, topBar, type CalendarView } from './ui/shell.ts';
import { pagePlan } from './ui/page-plan.ts';
import { playerPage } from './ui/player-page.ts';
import type { AddOptions, ProfileOptions } from './ui/player-profile.ts';
import { CATEGORY_ORDER, DEFAULT_CATEGORIES, filtersSheet } from './ui/category-chips.ts';
import { monthGridRange, monthTitle, monthView } from './ui/month-view.ts';
import { weekTitle, weekView } from './ui/week-view.ts';
import { yearView } from './ui/year-view.ts';
import { yearOverview } from './ui/year-overview.ts';
import { dayPanel } from './ui/day-panel.ts';
import { eventPanel, groupPanel, type RewardViewState, setOpenPointRows } from './ui/event-panel.ts';
import { partOpenings } from './ui/bar.ts';
import { fitNextTiles, nextUpTiles } from './ui/next-up.ts';
import { watchForNewVersion } from './ui/new-version.ts';
import { problemPanel } from './ui/problem-panel.ts';
import { installIconFallback } from './ui/event-icon.ts';
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
  // Whether "Show on the calendar" is open.
  filtersOpen: false,
  pickedYearRun: null as string | null,
  // The first of the transfer dates on screen, and what is filtered out.
  predictionFirstDate: '',
  // Which battles' transfers are listed. At least one of the two stays on. The
  // Timeline opens on SvS only, All and Groups (Roxanne, 24 Nov).
  predictionShowsSvs: true,
  predictionShowsSunfire: false,
  // 'all' or 'mine': the whole list, or our own group.
  predictionScope: 'all',
  // What is typed in the state box, kept as written.
  // True to show each group as one row rather than its subgroups.
  predictionMergesGroups: true,
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
  // The battle day of the fortress phase on the board, when stepped away from the one
  // being played. Null shows the phase being played.
  fortressBattleDay: null as number | null,
  // State managers planning the forts in place: whether the pencil is on, which of the
  // two ways is drawn, the choice picked in the palette, and the card whose choices are
  // open.
  fortressEditing: false,
  fortressPickStyle: 'paint' as 'paint' | 'chips',
  fortressBrush: '',
  fortressOpenPlace: '',
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
// Why the last fort choice could not be saved, shown under the board until the next one.
let fortSaveProblem = '';
let rallyLeads: RallyLead[] = [];
let buffAllocations: BuffAllocation[] = [];
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
// Which parts of the player's page are open for editing ('troops' for the skill levels,
// 'listed' for an account being added). They stay open while the page is redrawn after
// a pick.
const playerEditing = new Set<string>();
// The account's columns changed on the player's page but not saved yet.
const playerDraft: Row = {};
// The game account open on the player's page: its id, 'new' for an alt being added, or
// null for the main.
let openGameAccount: number | 'new' | null = null;
// A farm opened from the photo bar (shown on its own, read only), or 'new' while an
// account is being added from the menu, and that account's details not saved yet.
let openListed: number | 'new' | null = null;
const listedDraft: Row = {};
// What each account is while "Edit accounts" is open, by the account's id ("kind:12").
const kindsDraft: Row = {};
// An event's answer waiting for "Save for which accounts?" (only with alts).
let pendingAccountSave: { formName: string; key: string; values: FormData } | null = null;
// Whether the Labyrinth's six areas are open under the leaderboards.
let labyrinthOpen = false;
// The state's top-100 boards, by in-game ID, read once with the accounts' game data.
let stateBoards = new Map<string, Record<string, BoardEntry>>();
// What the game says about the person's accounts, by in-game id, and the skill levels of
// their Exalted troops; read once the accounts are known, and again after a refresh.
const gameReads = new Map<string, GameRead>();
// The alliances' rosters by in-game ID, read with the players' own data.
let rosterEntries = new Map<string, RosterEntry>();
let rostersRead = false;
const skillLevels = new Map<string, Row>();
// Each account's alliance as the site keeps it, by in-game ID (it follows a move only
// after 24 hours there, or once the move is confirmed).
const playerAlliances = new Map<string, Row>();
let gameReadFor = '';
// While an account is being added: what its typed id turned out to be in the game.
let lookUp: LookUpState = { kind: 'none' };
// The alliance of the account the player is on becomes "my alliance" once the game
// accounts are read after signing in.
let activeAllianceApplied = false;
// What the player was doing when asked to save before leaving: run once they answer.
let pendingLeave: { parts: string[]; then: () => void } | null = null;

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
  const nextUp = `<div class="next-up">${nextUpTiles(runsBetween(today - 14, today + 60))}</div>`;
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

// One edit button in an event's head, for anyone who may change something about it. It
// opens every form they may use: this date (admins), the event's dates and repeat
// (the owner), or their alliance's own time (its R4 or R5).
function headPencilsOf(occurrence: Occurrence): string {
  if (eventTypeById(occurrence.eventTypeId)?.datesLocked) return '';
  const ownTime = occurrence.allianceIds.length > 0;
  const mayEdit = isAdmin(person) || (ownTime && mayChangeAllianceTime(occurrence));
  return mayEdit ? editButton('head|' + occurrence.key) : '';
}

// The forms the head's edit button opened, for this event.
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
    partOfByEventTypeId, nameOf: eventTypeName, stageNameOf: eventTypeStageName, shortNameOf: eventTypeShortName,
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

  // Any part of State of Power (its stages and Castle Battle) opens the whole event,
  // whichever part was tapped.
  const wholeEventTypeId = wholeEventTypeOf(occurrence.eventTypeId);
  const wholeMembers = wholeEventTypeId ? familyOccurrences(occurrence, nearby, partOfByEventTypeId) : [];
  const wholeEvent = wholeMembers.length ? {
    eventTypeId: wholeEventTypeId,
    startMinute: Math.min(...wholeMembers.map(member => member.startMinute)),
    endMinute: Math.max(...wholeMembers.map(member => member.endMinute))
  } : undefined;

  view.rewardView.ownBand = ownRewardBands();
  const resultsOptions = {
    context: workContext(), eventTypeId: occurrence.eventTypeId, runDate: resultRunDate(occurrence, nearby),
    stateNumber: Number(STATE_NUMBER), isSwitchedOff: resultsSwitchedOff
  };
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
    resultsHtml: resultsTab(resultsOptions),
    tabActions: { results: resultsTabActions(resultsOptions) },
    wholeEvent,
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
          battle.allianceId, held?.battleTimeUtc ?? null, held?.creditedTo ?? '');
      }
    });
  }
  return '';
}

// The battle day of the fortress phase being played: the first that has not passed.
function playedFortBattleDay(): number {
  const today = todayNumber();
  const seasonStart = seasonStartFor(today, firstFortBattleDay);
  const phase = Math.min(FORT_PHASES, Math.max(1, phaseOf(today + 6, seasonStart)));
  return battleDayOf(seasonStart, phase);
}

// The season and phase of a battle day.
function fortPlaceOf(battleDay: number): { seasonStart: number; season: number; phase: number } {
  const seasonStart = seasonStartFor(battleDay, firstFortBattleDay);
  return {
    seasonStart,
    season: seasonNumberOf(seasonStart, firstFortBattleDay, FIRST_FORT_SEASON),
    phase: phaseOf(battleDay, seasonStart)
  };
}

// The fortress board for the phase on screen: the one moved to (by swiping, the arrow
// keys or a phase in the Season table), else the one being played. Without the
// season's first battle day there is nothing to count from.
function fortressBoardMarkup(): string {
  if (Number.isNaN(firstFortBattleDay)) return '';
  const battleDay = view.fortressBattleDay ?? playedFortBattleDay();
  const place = fortPlaceOf(battleDay);
  return fortressBoard({
    season: place.season, phase: place.phase, battleDay,
    assignments: fortAssignments.filter(one => one.season === place.season && one.phase === place.phase),
    previousAssignments: place.phase > 1
      ? fortAssignments.filter(one => one.season === place.season && one.phase === place.phase - 1)
      : []
  });
}

function fortProblemLine(): string {
  return fortSaveProblem ? `<p class="form-message">${escapeForPage(fortSaveProblem)}</p>` : '';
}

// State managers and admins plan the forts: the pencil switches picking in place on.
function fortressPencil(): string {
  return managesState(person)
    ? `<button type="button" class="pencil-button${view.fortressEditing ? ' on' : ''}" data-fortress-edit` +
      ` aria-label="Plan the forts" title="Plan the forts">${PENCIL_ICON}</button>`
    : '';
}

function fortressInPlace(season: number): InPlaceEditing | null {
  return managesState(person) && view.fortressEditing
    ? { season, alliances: alliancesStillHere(alliances), style: view.fortressPickStyle,
        brush: view.fortressBrush, openPlace: view.fortressOpenPlace }
    : null;
}

// The season of the phase on screen, every phase at once. State managers plan it here.
function fortressSeasonMarkup(): string {
  if (Number.isNaN(firstFortBattleDay)) return '';
  const playedDay = playedFortBattleDay();
  const place = fortPlaceOf(view.fortressBattleDay ?? playedDay);
  const played = fortPlaceOf(playedDay);
  return seasonTable({
    seasonNumber: place.season,
    seasonStart: place.seasonStart,
    assignments: fortAssignments.filter(one => one.season === place.season),
    playedPhase: played.season === place.season ? played.phase : null,
    pencil: fortressPencil(),
    editing: fortressInPlace(place.season)
  }) + fortProblemLine();
}

function fortressRewardsMarkup(): string {
  if (Number.isNaN(firstFortBattleDay)) return '';
  const place = fortPlaceOf(view.fortressBattleDay ?? playedFortBattleDay());
  return '<div class="work-page">' + seasonTotals({
    seasonNumber: place.season,
    seasonStart: place.seasonStart,
    assignments: fortAssignments.filter(one => one.season === place.season)
  }) + '</div>';
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
  const work = person ? transferWorkSections(workContext(), date) : '';
  return '<div class="work-page">' + nextTransferPage({
    date,
    window,
    candidates: window ? candidatesOf(window.id) : [],
    alliances,
    ourGroup: groupOfState(bigGroupsOf(nextWindowGroups), Number(STATE_NUMBER)) ?? null,
    follows: FOLLOWS_TEXT[followsOfDate(date)] ?? ''
  }) + work + '</div>';
}

function pastTransfersMarkup(): string {
  const todayText = textFromDay(todayNumber());
  const past = transferWindows.filter(one => one.transferDate < todayText);
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
  // The fortress pages keep their own copies of the forts, the leads and the plan.
  if (tables.includes('fort_assignments')) fortAssignments = await loadFortAssignments().catch(() => fortAssignments);
  if (tables.includes('rally_leads')) rallyLeads = await loadRallyLeads().catch(() => rallyLeads);
  if (tables.some(table => ['rally_leads', 'buff_allocations', 'fort_assignments'].includes(table))) {
    buffAllocations = await loadBuffAllocations(fortAssignments.map(one => one.id)).catch(() => buffAllocations);
  }
}

function workContext(): WorkContext {
  const run = currentEventRun();
  return {
    rowsOf, alliances: alliancesStillHere(alliances), myAllianceId: view.myAllianceId,
    userId: person?.userId ?? null,
    activeAccount: person ? myAccountRow() : null,
    run: run ? { eventTypeId: run.eventTypeId, date: textFromDay(run.startDay) } : null,
    editing: view.editing,
    choiceOf: name => workChoices.get(name) ?? '',
    isAdmin: isAdmin(person), isOwner: isOwner(person), managesState: managesState(person), managesBattles: managesBattles(person),
    leads: allianceId => leadsAlliance(person, allianceId),
    mayReadBlacklist: isAdmin(person) || Boolean(person?.roles.some(one => one.role === 'alliance_manager')),
    troopsOf: troopsOfAccount,
    gameOf: gameOfAccount,
    membersOf: rosterMembersOf
  };
}

// What the game says of any account, for the working pages: name, picture, power,
// alliance and troops. An ID not read yet is read once, together with the others asked
// for at the same time, and the page is drawn again when they arrive.
const gameAskedFor = new Set<string>();
let gameToRead: string[] = [];
function gameOfAccount(inGameId: string): GameRead | null {
  if (!inGameId) return null;
  const game = gameReads.get(inGameId);
  if (game) return game;
  if (!gameAskedFor.has(inGameId)) {
    gameAskedFor.add(inGameId);
    gameToRead.push(inGameId);
    if (gameToRead.length === 1) {
      window.setTimeout(() => {
        const ids = gameToRead;
        gameToRead = [];
        void rereadGameData(ids);
      }, 0);
    }
  }
  return null;
}

// The members of one of our alliances, from its roster as the game last showed it. A
// player who moved shows only on the newer roster. Null until the rosters are read.
function rosterMembersOf(allianceId: string): RosterEntry[] | null {
  if (!rostersRead) return null;
  const tag = alliances.find(one => one.id === allianceId)?.tag;
  if (!tag) return [];
  return Array.from(rosterEntries.values()).filter(one => one.tag === tag && one.state === Number(STATE_NUMBER));
}

// A game account's troops for the working pages: the tier from the game ("FC10 Exalted")
// and the skill level kept per in-game ID; null while the game is being read.
function troopsOfAccount(inGameId: string): Record<string, { tier: string; skill: number }> | null {
  const game = gameOfAccount(inGameId);
  if (!game) return null;
  const levels = skillsOf(inGameId);
  const troops: Record<string, { tier: string; skill: number }> = {};
  for (const [kind] of TROOP_KINDS) {
    const one = game.troops[kind];
    if (!one) continue;
    const word = one.tier >= 12 ? ' Exalted' : one.tier === 11 ? ' Helios' : '';
    troops[kind] = { tier: `FC${one.fc}${word}`, skill: Number(levels[kind] ?? 0) };
  }
  return troops;
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
  weeks: number;
}

function scrollPlaces(app: HTMLElement): ScrollPlaces {
  return {
    window: window.scrollY,
    calendar: app.querySelector<HTMLElement>('.calendar-panel')?.scrollTop ?? 0,
    weeks: app.querySelector<HTMLElement>('.calendar-panel .weeks')?.scrollTop ?? 0,
    panel: app.querySelector<HTMLElement>('.day-panel')?.scrollTop ?? 0,
    eventBody: app.querySelector<HTMLElement>('.event-page-body')?.scrollTop ?? 0
  };
}

// Whether the calendar has been drawn yet in this visit: its first drawing shows today.
let calendarShownBefore = false;

// Today's week in sight when the calendar opens (24 Nov): on a computer the weeks' box
// scrolls so today's week is the first one, or as far as it goes near the month's end; on
// a phone, where the window scrolls, the window moves down only if today's week is below
// the screen. A month without today starts at its top.
function showToday(calendar: HTMLElement, weeks: HTMLElement | null): void {
  const todayRow = calendar.querySelector<HTMLElement>('.day-box.today')?.closest<HTMLElement>('.week-row');
  if (weeks && weeks.scrollHeight > weeks.clientHeight + 1) {
    weeks.scrollTop = todayRow ? weeks.scrollTop + todayRow.getBoundingClientRect().top - weeks.getBoundingClientRect().top : 0;
    return;
  }
  if (!todayRow) return;
  const bottom = todayRow.getBoundingClientRect().bottom;
  if (bottom > window.innerHeight) window.scrollBy(0, bottom - window.innerHeight + 16);
}

function putBackScrollPlaces(app: HTMLElement, places: ScrollPlaces): void {
  const calendar = app.querySelector<HTMLElement>('.calendar-panel');
  const panel = app.querySelector<HTMLElement>('.day-panel');
  const eventBody = app.querySelector<HTMLElement>('.event-page-body');
  const weeks = calendar?.querySelector<HTMLElement>('.weeks') ?? null;
  // The calendar opening (the site, the section, Today, another month or view) shows today.
  const showsToday = startAtTop.wholePage || startAtTop.calendar || !calendarShownBefore;
  if (startAtTop.wholePage) {
    window.scrollTo(0, 0);
    if (calendar) calendar.scrollTop = 0;
    if (panel) panel.scrollTop = 0;
    if (eventBody) eventBody.scrollTop = 0;
  } else {
    window.scrollTo(0, places.window);
    if (calendar) calendar.scrollTop = startAtTop.calendar ? 0 : places.calendar;
    if (weeks) weeks.scrollTop = places.weeks;
    if (panel) panel.scrollTop = startAtTop.panel ? 0 : places.panel;
    if (eventBody) eventBody.scrollTop = startAtTop.panel ? 0 : places.eventBody;
  }
  if (calendar) {
    if (showsToday) showToday(calendar, weeks);
    calendarShownBefore = true;
  }
  startAtTop.calendar = false;
  startAtTop.panel = false;
  startAtTop.wholePage = false;
}

// The event a form was opened on. Moving to another event, page or day closes it.
let editingPlace = '';

// What has to follow each drawing of the page (the day names held on a phone).
const afterEachDraw: (() => void)[] = [];

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
  // A field being typed in keeps its place when the page is redrawn around it (an id
  // being looked up redraws what is under it).
  const typing = document.activeElement instanceof HTMLInputElement && document.activeElement.id ? document.activeElement : null;
  const typingPlace = typing ? { id: typing.id, at: typing.selectionStart } : null;
  drawPage(app);
  putBackScrollPlaces(app, places);
  const again = typingPlace ? document.getElementById(typingPlace.id) : null;
  if (again instanceof HTMLInputElement && typingPlace) {
    again.focus();
    if (typingPlace.at !== null) again.setSelectionRange(typingPlace.at, typingPlace.at);
  }
  if (view.scrollsToMarkedRow) {
    view.scrollsToMarkedRow = false;
    scrollToMarkedRow(app);
  }
  // On a phone the day's panel is a sheet over the page. While it is up, the page under
  // it is hidden, so the sheet can fade at its edges into the same background.
  app.classList.toggle('sheet-open', view.isPanelOpen && view.openPage === 'calendar');
  watchScrollEdges(app);
  showOpenTab(app);
  const svsEditor = document.getElementById(SVS_EDIT_FORM_ID);
  if (svsEditor instanceof HTMLFormElement) updateSvsEditor(svsEditor);
  for (const step of afterEachDraw) step();
  watchTableEdges(app);
  syncHistory();
  rememberChoices();
}

// The player's choices are kept between visits, as the old app kept them.
// Kept on this device at every draw, and with the login a second after the last change
// (only when something changed), so a signed-in player finds them on any device.
let choicesSavedWithLogin = '';
let choicesSaveTimer = 0;
function rememberChoices(): void {
  const choices: Preferences = {
    categories: Array.from(view.shownCategories),
    hiddenEvents: Array.from(view.hiddenEvents),
    followedScheduleIds: Array.from(view.followedScheduleIds),
    calendarView: view.calendarView,
    timeMode: currentTimeMode(),
    myAllianceId: view.myAllianceId,
    openInfoTab: view.openInfoTab,
    opponentNotes: { others: workChoices.get('opponents-others') ?? '', all: workChoices.get('opponents-all') ?? '' },
    activeGameAccountId: typeof openGameAccount === 'number' ? openGameAccount : null,
    transfers: {
      svs: view.predictionShowsSvs, sunfire: view.predictionShowsSunfire,
      scope: view.predictionScope === 'mine' ? 'mine' : 'all', groups: view.predictionMergesGroups
    }
  };
  writePreferences(choices);
  const text = JSON.stringify(choices);
  if (!person || text === choicesSavedWithLogin) return;
  const userId = person.userId;
  window.clearTimeout(choicesSaveTimer);
  choicesSaveTimer = window.setTimeout(() => {
    void savePreferencesWithLogin(userId, choices).then(() => { choicesSavedWithLogin = text; }).catch(() => undefined);
  }, 1000);
}

// The choices kept from the last visit: the login's when signed in (the same on every
// device), otherwise this device's. An alliance that has left the state since, or a
// category the site no longer has, is dropped.
function applyKeptChoices(): void {
  const withLogin = person?.preferences ? preferencesFrom(person.preferences) : null;
  const kept = withLogin && Object.keys(withLogin).length > 0 ? withLogin : readPreferences();
  if (withLogin && Object.keys(withLogin).length > 0) choicesSavedWithLogin = JSON.stringify(person?.preferences);
  if (kept.transfers) {
    view.predictionShowsSvs = kept.transfers.svs;
    view.predictionShowsSunfire = kept.transfers.sunfire;
    view.predictionScope = kept.transfers.scope;
    view.predictionMergesGroups = kept.transfers.groups;
  }
  if (kept.openInfoTab) view.openInfoTab = kept.openInfoTab;
  if (typeof kept.activeGameAccountId === 'number') openGameAccount = kept.activeGameAccountId;
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
// on a phone, a section's pages, and an event's tabs. The open one is always brought
// into view, clear of the fade, and the row fades at an edge while there are more names
// past it.
const SIDEWAYS_ROWS: [string, string][] = [
  ['.main-nav', '.nav-tab[aria-current="page"]'],
  ['.section-tabs', '.section-tab[aria-current="page"]'],
  ['.info-tabs', '.info-tab[aria-selected="true"]']
];
// As wide as the fade at a row's edge (shell.css), so the open name is never under it.
const ROW_FADE_WIDTH = 36;

function showOpenTab(app: HTMLElement): void {
  for (const [rowSelector, openSelector] of SIDEWAYS_ROWS) {
    const row = app.querySelector<HTMLElement>(rowSelector);
    if (!row) continue;
    const open = row.querySelector<HTMLElement>(openSelector);
    if (open) {
      const left = open.offsetLeft - row.offsetLeft;
      if (left - ROW_FADE_WIDTH < row.scrollLeft) row.scrollLeft = Math.max(0, left - ROW_FADE_WIDTH);
      else if (left + open.offsetWidth + ROW_FADE_WIDTH > row.scrollLeft + row.clientWidth) {
        row.scrollLeft = left + open.offsetWidth + ROW_FADE_WIDTH - row.clientWidth;
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

// A working page's table that is wider than a phone scrolls sideways; it fades at the
// edge with more past it, so a cut-off column reads as more to see, not as broken.
function watchTableEdges(app: HTMLElement): void {
  for (const box of Array.from(app.querySelectorAll<HTMLElement>('.table-scroll'))) {
    const update = () => {
      box.classList.toggle('more-left', box.scrollLeft > 1);
      box.classList.toggle('more-right', box.scrollLeft + box.clientWidth < box.scrollWidth - 1);
    };
    update();
    box.addEventListener('scroll', update, { passive: true });
  }
}

// The boxes that scroll on their own. Each fades at an edge while there is more to
// scroll past it, instead of cutting the rows off.
const FADING_BOXES = '.event-page-body, .day-panel, .calendar-panel, .calendar-panel .weeks, .admin-page';

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
  if (person) readGameDataOfMyAccounts();
  // The alliance of the account the player is on becomes "my alliance" once the game
  // has been read for it.
  if (person && !activeAllianceApplied && rowsOf('game_accounts')) {
    const active = myAccountRow();
    const allianceId = active ? allianceIdOfAccount(active) : null;
    if (!active || (gameReads.has(String(active.in_game_id ?? '')) && alliances.length > 0)) activeAllianceApplied = true;
    if (allianceId) view.myAllianceId = allianceId;
  }

  const onAccount = person ? myAccountRow() : null;
  const bar = topBar({
    stateNumber: STATE_NUMBER,
    openPage: view.openPage,
    eventLabel: currentEventLabel(),
    // Signed in: the name and picture of the game account they are on, otherwise "Me".
    playerName: person ? (onAccount ? barAccountOf(onAccount).name : '') || 'Me' : null,
    playerPicture: onAccount ? barAccountOf(onAccount).avatar : null,
    accountMenu: person ? accountMenu(isAdmin(person), allMyAccounts().length > 1) : null,
    eventTypeId: currentEventTypeId()
  });
  // The open section's colour goes on the page's root, so the band, the page and any
  // pop-up over it all take it.
  document.documentElement.dataset.section = view.openPage;
  document.documentElement.dataset.event = view.openPage === 'event' ? currentEventTypeId() ?? '' : '';

  setPageColour('');
  if (view.openPage === 'player') {
    app.innerHTML = bar + `<main class="page" data-section="player">${playerPage({
      signedIn: person !== null, stateNumber: STATE_NUMBER, profile: profileOptions(), adding: addOptions(),
      leavePrompt: pendingLeave !== null
    })}</main>`;
    // The player page has the colour of the account's alliance, evened to the sections'
    // lightness and strength: the 1458, the page's accent and its second colour all come
    // from it.
    const profile = app.querySelector<HTMLElement>('.pp');
    const allyColour = profile?.style.getPropertyValue('--ally').trim() ?? '';
    const evened = allyColour ? evenColour(allyColour) : '';
    if (profile && evened) profile.style.setProperty('--ally', evened);
    setPageColour(evened);
    fitPlayerPage();
    return;
  }

  if (view.openPage !== 'calendar') {
    const page = pageById(view.openPage);
    const subPage = view.openSubPage || page?.pages[0]?.id || '';
    const built =
      view.openPage === 'fortress' && subPage === 'phase' ? fortressBoardMarkup() :
      view.openPage === 'fortress' && subPage === 'season' ? fortressSeasonMarkup() :
      view.openPage === 'fortress' && subPage === 'rewards' ? fortressRewardsMarkup() :
      view.openPage === 'state'
        ? '<div class="work-page">' + statePage({ stateNumber: STATE_NUMBER, alliances: alliancesStillHere(alliances), schedules }) +
          svsHistorySection(workContext()) + sunfireHistorySection(workContext()) + '</div>' :
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

  // The year view has its own four events, so the filters do not apply to it.
  const filtersShown = view.calendarView !== 'year';
  if (!filtersShown) view.filtersOpen = false;
  app.innerHTML = bar +
    `<main class="page" data-section="calendar">` +
      calendarToolbar({
        title: range.title, view: view.calendarView, todayInView: todayInView(range),
        showFilters: filtersShown, filtersOpen: view.filtersOpen
      }) +
      (view.filtersOpen ? filtersSheet({
        shownCategories: view.shownCategories,
        hiddenEvents: view.hiddenEvents,
        eventTypeIdsWithAllianceTimes: eventTypeIdsWithAllianceTimes()
      }) : '') +
      '<div class="calendar-layout">' +
        `<section class="calendar-panel glass ${view.calendarView}-mode">${calendarBody(range)}</section>` +
        `<div class="side-column">${sideColumn()}</div>` +
      '</div>' +
    '</main>';

  placeFiltersPanel(app);
  fitNextTiles(app);
  const panel = app.querySelector<HTMLElement>('.calendar-panel');
  if (panel && view.calendarView !== 'year') {
    layoutBars(panel);
    fitBarLabels(panel);
    sizeLanes(panel);
  }
}

// A page whose colour comes from its content rather than its section (the player page,
// from the alliance) sets it on the page's root; an empty colour leaves the section's.
function setPageColour(colour: string): void {
  const root = document.documentElement.style;
  if (!colour) {
    for (const name of ['--section', '--section-ink']) root.removeProperty(name);
    return;
  }
  root.setProperty('--section', colour);
  root.setProperty('--section-ink', '#1C2333');
}

// Today is in sight when the shown month (or week, or year) holds it. Grey days of the
// months either side do not count: Today is offered there, as it is in another month.
function todayInView(range: { from: number; to: number }): boolean {
  const today = todayNumber();
  if (view.calendarView === 'week') return range.from <= today && today <= range.to;
  const shown = yearAndMonthOf(view.focusDay);
  const now = yearAndMonthOf(today);
  return view.calendarView === 'year' ? shown.year === now.year : shown.year === now.year && shown.month === now.month;
}

// On a computer the filters open as a panel just under the Filters button.
function placeFiltersPanel(app: HTMLElement): void {
  const sheet = app.querySelector<HTMLElement>('.filters-sheet');
  const button = app.querySelector<HTMLElement>('.filters-button');
  if (!sheet || !button || !window.matchMedia('(min-width: 1000px)').matches) return;
  sheet.style.top = Math.round(button.getBoundingClientRect().bottom + 10) + 'px';
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
  if (answerWhichAccount(target)) return;

  // A pick shown as words, and a switch, in a form: they set the form's hidden value in
  // place, without drawing the page again (what is typed in the form stays).
  const pickWord = target.closest<HTMLElement>('[data-pick]');
  if (pickWord) {
    const field = pickWord.closest('.work-field');
    const input = field?.querySelector<HTMLInputElement>('input[type="hidden"]');
    if (field && input) {
      input.value = pickWord.dataset.pick ?? '';
      Array.from(field.querySelectorAll<HTMLElement>('[data-pick]')).forEach(one => {
        const isPicked = one === pickWord;
        one.classList.toggle('on', isPicked);
        one.setAttribute('aria-pressed', String(isPicked));
      });
      field.closest('form')?.querySelector<HTMLElement>('[data-form-message]')?.replaceChildren();
    }
    return;
  }
  const switchButton = target.closest<HTMLElement>('[data-switch]');
  if (switchButton) {
    const input = switchButton.closest('.work-field')?.querySelector<HTMLInputElement>('input[type="hidden"]');
    if (input) {
      const isOn = input.value !== 'on';
      input.value = isOn ? 'on' : '';
      switchButton.classList.toggle('on', isOn);
      switchButton.setAttribute('aria-pressed', String(isOn));
    }
    return;
  }

  // The menu under the player's name opens and closes in place; a tap anywhere else
  // while it is open only closes it.
  const menuButton = target.closest<HTMLElement>('[data-account-menu]');
  const openMenu = document.querySelector<HTMLElement>('.account-menu-wrap.open');
  if (menuButton) {
    setAccountMenu(!openMenu);
    return;
  }
  if (openMenu && !target.closest('.account-menu')) {
    setAccountMenu(false);
    return;
  }

  // Signing in sends the browser to Discord or Google, which bring it back here.
  const signInButton = target.closest<HTMLElement>('[data-sign-in]');
  if (signInButton) {
    signInWith(signInButton.dataset.signIn as SignInProvider).catch(problem => {
      const message = document.querySelector('[data-sign-in-message]');
      if (message) message.textContent = problem instanceof Error ? problem.message : String(problem);
    });
    return;
  }
  // Leaving the player's page with changes not saved asks first, then goes on.
  const leavingButton = target.closest<HTMLElement>('[data-page], [data-sign-out]');
  if (leavingButton && view.openPage === 'player' && !leavingButton.closest('.leave-prompt')) {
    const withChanges = PLAYER_PARTS.filter(partHasChanges);
    if (withChanges.length > 0) {
      // The page is redrawn for the question, so where the player was going is kept
      // as data rather than as the button they tapped.
      const page = leavingButton.dataset.page;
      leaveParts(withChanges, () => {
        if (page) {
          view.openPage = page;
          view.openSubPage = '';
          startAtTop.wholePage = true;
          draw();
        } else {
          void signOut().then(signedOut);
        }
      });
      return;
    }
  }
  if (target.closest('[data-sign-out]')) {
    void signOut().then(signedOut);
    return;
  }
  if (handlePlayerPicks(target)) return;

  const myAllianceButton = target.closest<HTMLElement>('[data-my-alliance]');
  if (myAllianceButton) {
    const id = myAllianceButton.dataset.myAlliance as string;
    view.myAllianceId = view.myAllianceId === id ? null : id;
    draw();
    return;
  }

  const pageButton = target.closest<HTMLElement>('[data-page]');
  if (pageButton) {
    // "Profile" shows the account the player is on, whatever was open before.
    if (pageButton.dataset.page === 'player') { openListed = null; lookUp = { kind: 'none' }; dropDraft('listed'); playerEditing.delete('listed'); }
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

  const brushButton = target.closest<HTMLElement>('[data-fort-brush]');
  if (brushButton) {
    view.fortressBrush = view.fortressBrush === brushButton.dataset.fortBrush ? '' : brushButton.dataset.fortBrush as string;
    draw();
    return;
  }
  const chooseButton = target.closest<HTMLElement>('[data-fort-choose]');
  if (chooseButton && view.fortressOpenPlace) {
    const choice = chooseButton.dataset.fortChoose as string;
    const placeText = view.fortressOpenPlace;
    // An alliance picked closes the card; who the reward is for keeps it open.
    if (choice.startsWith('holder|')) view.fortressOpenPlace = '';
    saveFortChoice(placeText, choice);
    return;
  }
  const fortTap = target.closest<HTMLElement>('[data-fort-tap]');
  if (fortTap) {
    const placeText = fortTap.dataset.fortTap as string;
    if (view.fortressPickStyle === 'paint') {
      if (view.fortressBrush) saveFortChoice(placeText, view.fortressBrush);
    } else {
      view.fortressOpenPlace = view.fortressOpenPlace === placeText ? '' : placeText;
      draw();
    }
    return;
  }
  if (target.closest('[data-fortress-edit]')) {
    view.fortressEditing = !view.fortressEditing;
    view.editing = null;
    draw();
    return;
  }
  const fortressStep = target.closest<HTMLElement>('[data-fortress-step]');
  if (fortressStep) {
    stepFortressPhases(Number(fortressStep.dataset.fortressStep));
    view.editing = null;
    draw();
    return;
  }
  // A phase in the Season table opens it on the Phase page.
  const phaseHeading = target.closest<HTMLElement>('[data-fortress-phase-day]');
  if (phaseHeading) {
    const battleDay = Number(phaseHeading.dataset.fortressPhaseDay);
    view.fortressBattleDay = battleDay === playedFortBattleDay() ? null : battleDay;
    view.openSubPage = 'phase';
    startAtTop.wholePage = true;
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

  if (target.closest('[data-filters-open]')) {
    view.filtersOpen = !view.filtersOpen;
    draw();
    return;
  }

  if (target.closest('[data-filters-close]')) {
    view.filtersOpen = false;
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
    startAtTop.calendar = true;
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

  // A + under a list being edited adds one more row, numbered after the last.
  const addRow = target.closest<HTMLElement>('[data-add-row]');
  if (addRow) {
    const list = addRow.parentElement?.parentElement;
    const template = list?.querySelector<HTMLTemplateElement>('template[data-row-template]');
    if (list && template) {
      const count = list.querySelectorAll('[data-row]').length;
      const row = template.content.firstElementChild?.cloneNode(true) as HTMLElement | undefined;
      if (row) {
        const number = row.querySelector('[data-row-number]');
        if (number) number.textContent = String(count + 1);
        template.before(row);
        row.querySelector<HTMLInputElement>('input')?.focus();
      }
    }
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

const WORKING_FORMS = ['rally-lead', 'fort-reserve', 'buff-share', 'availability', 'roster', 'roster-member', 'plan', 'academy', 'facility', 'setting', 'role',
  'result', 'personal', 'alliance-records', 'opponent-note', 'transfer-window', 'candidate', 'candidate-status',
  'candidate-flag', 'blacklist'];

// An SvS's points as whole numbers: "7,480,314,895" and "7480314895" are the same; "11.03B"
// and "645.9M" are read too.
function pointsFromText(value: string): string {
  const clean = value.replace(/[\s,]/g, '');
  if (!clean) return '';
  const short = /^(\d+(?:\.\d+)?)([BMK])$/i.exec(clean);
  if (short) {
    const times = { B: 1e9, M: 1e6, K: 1e3 }[short[2].toUpperCase() as 'B' | 'M' | 'K'];
    return String(Math.round(Number(short[1]) * times));
  }
  if (!/^\d+$/.test(clean)) throw new Error(`"${value}" is not a number of points.`);
  return clean;
}

// "02:14:01" (or "2:14:01", or "53:39") as seconds.
function secondsFromText(value: string): number {
  const parts = value.trim().split(':').map(Number);
  if (!parts.length || parts.some(part => !Number.isInteger(part) || part < 0) || parts.length > 3) {
    throw new Error(`"${value}" is not a time held (02:14:01).`);
  }
  return parts.reduce((total, part) => total * 60 + part, 0);
}

// The SvS editor's fields turned into what an SvS keeps: points as whole numbers, the
// totals and the two parts' results worked out from them where they are in, each
// Occupation Ranking row as detail hold_N ("ours|DVL|7090", ours when the tag is one of
// our alliances), the State of Power result from the two parts, and the president
// ("[DVL]name") as our alliance or, for an outside one, the tag as a detail.
function svsDetailsFromEdit(values: FormData, isSvs: boolean): { allianceId: string | null; name: string | null } {
  const pointFields: string[] = [];
  values.forEach((_value, name) => { if (name.startsWith('detail_points_')) pointFields.push(name); });
  for (const name of pointFields) {
    values.set(name, pointsFromText(String(values.get(name) ?? '').trim()));
  }
  const tags = values.getAll('hold_tag').map(one => String(one).trim());
  const times = values.getAll('hold_time').map(one => String(one).trim());
  // The rows are typed in any order and sorted on saving, longest hold first.
  const holds: { side: string; tag: string; seconds: number }[] = [];
  tags.forEach((tag, index) => {
    if (!tag && !times[index]) return;
    if (!tag) throw new Error('Each row of the ranking needs its alliance tag.');
    holds.push({ side: alliances.some(one => one.tag === tag) ? 'ours' : 'theirs', tag, seconds: secondsFromText(times[index] || '0') });
  });
  holds.sort((left, right) => right.seconds - left.seconds)
    .forEach((hold, index) => values.set('detail_hold_' + (index + 1), `${hold.side}|${hold.tag}|${hold.seconds}`));
  if (isSvs) {
    // Where the days are in, Preparation's totals are their sums, and its result follows
    // from them once all five days are in. Where the ranking is in, the Battle is won
    // when the longest hold is one of our alliances.
    const days = [1, 2, 3, 4, 5].map(day =>
      [Number(values.get('detail_points_ours_' + day) || NaN), Number(values.get('detail_points_theirs_' + day) || NaN)] as [number, number]);
    if (days.some(([ours, theirs]) => Number.isFinite(ours) || Number.isFinite(theirs))) {
      values.set('detail_points_ours', String(days.reduce((sum, [day]) => sum + (Number.isFinite(day) ? day : 0), 0)));
      values.set('detail_points_theirs', String(days.reduce((sum, [, day]) => sum + (Number.isFinite(day) ? day : 0), 0)));
      values.set('detail_preparation', preparationOutcome(days));
    }
    if (holds.length) values.set('detail_castle_battle', holds[0].side === 'ours' ? 'win' : 'loss');
  }
  const preparation = String(values.get('detail_preparation') ?? '');
  const battle = String(values.get('detail_castle_battle') ?? '');
  if (preparation && battle) values.set('detail_result', preparation === battle ? preparation : 'draw');
  const president = String(values.get('president') ?? '').trim();
  const match = /^\[([^\]]+)\]\s*(.+)$/.exec(president);
  if (president && !match) throw new Error('Write the president as in the game: [DVL]name.');
  if (!match) return { allianceId: null, name: null };
  const ours = alliances.find(one => one.tag === match[1]);
  if (!ours) values.set('detail_president_tag', match[1]);
  return { allianceId: ours?.id ?? null, name: match[2].trim() };
}

// The transfer pages read their own copy of the windows and candidates.
async function reloadTransfers(): Promise<void> {
  transferWindows = await loadTransferWindows().catch(() => transferWindows);
  transferCandidates = await loadCandidatesOf(transferWindows.map(one => one.id)).catch(() => transferCandidates);
}

// Forms: the player's account, a farm or alt to add, and the forms the pencils open.
// Saves one of the working pages' forms and reads its tables again. The form is found
// again on the page, since the page may have been drawn again in between.
// With accounts given (an event's answer), it is saved for each of them in turn.
function submitWorkingForm(formName: string, key: string, values: FormData, userId: string, accountIds: string[] = []): void {
  const text = (name: string) => String(values.get(name) ?? '').trim();
  const liveForm = () => document.querySelector<HTMLFormElement>(`form[data-form="${formName}"]`);
  const buttonsOf = (form: HTMLFormElement | null) => Array.from(form?.querySelectorAll('button') ?? []);
  for (const button of buttonsOf(liveForm())) button.disabled = true;
  const saving = accountIds.length === 0 ? saveWorkingForm(formName, key, text, values, userId) : (async () => {
    let tables: string[] = [];
    for (const id of accountIds) {
      values.set('save_for', id);
      tables = await saveWorkingForm(formName, key, text, values, userId);
    }
    return tables;
  })();
  saving
    .then(async tables => { view.editing = null; await rereadTables(...tables); draw(); })
    .catch(problem => {
      const form = liveForm();
      for (const button of buttonsOf(form)) button.disabled = false;
      const message = form?.querySelector<HTMLElement>('[data-form-message]');
      if (message) message.textContent = problem instanceof Error ? problem.message : String(problem);
    });
}

// "Save for which accounts?": put over the page (outside the part that is drawn again, so
// what was typed stays): accounts are ticked, then Save; Cancel or a tap beside it closes it.
function askWhichAccount(waiting: { formName: string; key: string; values: FormData }): void {
  pendingAccountSave = waiting;
  document.querySelector('.account-question')?.remove();
  const holder = document.createElement('div');
  holder.className = 'account-question';
  holder.innerHTML = accountQuestion(myGameAccounts().map(barAccountOf));
  document.body.appendChild(holder);
}

function answerWhichAccount(target: HTMLElement): boolean {
  const choice = target.closest<HTMLElement>('.account-question [data-save-for]');
  if (!choice) return false;
  const answer = choice.dataset.saveFor as string;
  // A tap inside the question but not on a button does nothing.
  if (answer === 'cancel' && target.closest('.leave-prompt-box') && !target.closest('button')) return true;
  const question = document.querySelector('.account-question');
  if (answer !== 'cancel' && answer !== 'save') {
    // An account is ticked or unticked in place; Save lights once one is ticked.
    const picked = !choice.classList.contains('picked');
    choice.classList.toggle('picked', picked);
    choice.setAttribute('aria-pressed', String(picked));
    const save = question?.querySelector<HTMLButtonElement>('[data-save-for="save"]');
    if (save) save.disabled = !question?.querySelector('.picked');
    return true;
  }
  const ids = Array.from(question?.querySelectorAll<HTMLElement>('.picked') ?? []).map(one => one.dataset.saveFor as string);
  const waiting = pendingAccountSave;
  pendingAccountSave = null;
  question?.remove();
  if (!waiting || !person || answer === 'cancel' || ids.length === 0) return true;
  submitWorkingForm(waiting.formName, waiting.key, waiting.values, person.userId, ids);
  return true;
}

function handleSubmits(event: SubmitEvent): void {
  const form = (event.target as HTMLElement | null)?.closest<HTMLFormElement>('form[data-form]');
  if (!form || !person) return;
  event.preventDefault();
  const values = new FormData(form);
  const text = (name: string) => String(values.get(name) ?? '').trim();
  const message = form.querySelector<HTMLElement>('[data-form-message]');
  // A required pick shown as words has no browser check of its own.
  const missingPick = Array.from(form.querySelectorAll<HTMLInputElement>('input[type="hidden"][data-required]'))
    .find(one => !one.value);
  if (missingPick) {
    if (message) message.textContent = `Pick one under ${missingPick.dataset.required}.`;
    return;
  }
  const signedIn = person;
  if (WORKING_FORMS.includes(form.dataset.form ?? '')) {
    const formName = form.dataset.form as string;
    // An event's answer is for one account: with alts the player says which; with only a
    // main (farms do not answer) it is the main's.
    if (formName === 'availability' && myGameAccounts().length > 1) {
      askWhichAccount({ formName, key: form.dataset.key ?? '', values });
      return;
    }
    submitWorkingForm(formName, form.dataset.key ?? '', values, signedIn.userId);
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
}

// ---------------------------------------------------------------------------
// The player's own details: every pick saved at once, every typed value when its
// field is left (or Enter is pressed). The rules are the old registration forms'.
// ---------------------------------------------------------------------------

// The parts of the player's page that are saved with their own Save button: the skill
// levels of the Exalted troops, an account being added, and what each account is.
const PLAYER_PARTS = ['troops', 'listed', 'kinds'];

// What each part of the page changes. Name, power, alliance, troops and heroes come
// from the game; the player sets only the skill levels of Exalted troops, and the ID and
// kind of an account being added.
function partColumns(part: string): string[] {
  if (part === 'listed') return ['kind', 'in_game_id'];
  if (part === 'kinds') return allMyAccounts().map(row => 'kind:' + String(row.id));
  return TROOP_KINDS.map(([kind]) => kind + '_skill_level');
}

// The game's data and the skill levels of the person's accounts: read once their accounts
// are known, and again whenever their IDs change (an account added). The state's boards
// are read with them, the first time.
function readGameDataOfMyAccounts(): void {
  if (!rowsOf('game_accounts')) return;
  const ids = allMyAccounts().map(one => String(one.in_game_id ?? '')).filter(Boolean);
  const key = ids.join(',');
  if (key === gameReadFor) return;
  const first = gameReadFor === '';
  gameReadFor = key;
  void rereadGameData(ids, first);
}

// Reads an account again every minute while its refresh is on its way, 15 times at most
// (the database goes back to asking hourly after 10 minutes). An account shown as
// Updating when the page opens is watched the same way, once per page load.
const refreshWatches = new Map<string, number>();

function watchRefresh(id: string): void {
  if (refreshWatches.has(id)) return;
  refreshWatches.set(id, 15);
  const look = (): void => {
    window.setTimeout(() => {
      void rereadGameData([id], false, false).then(() => {
        const left = (refreshWatches.get(id) ?? 1) - 1;
        if (gameReads.get(id)?.asked && left > 0) { refreshWatches.set(id, left); look(); }
      });
    }, 60000);
  };
  look();
}

// withRosters false skips the rosters (all of them, the largest read), for the minute
// checks while a refresh is on its way, which only wait for the player's own read.
// The rosters come on their own, in the background: the page is drawn as soon as the
// players' own reads are in, and again when the rosters arrive, so nothing waits on them.
async function rereadGameData(ids: string[], withState = false, withRosters = true): Promise<void> {
  if (withRosters || !rostersRead) {
    void readGameRosters().then(rosters => {
      rosterEntries = rosterEntriesOf(rosters);
      rostersRead = true;
      layRostersOver(ids);
      draw();
    }).catch(() => undefined);
  }
  const [players, skills, kept, states] = await Promise.all([
    readGamePlayers(ids).catch(() => [] as Row[]),
    readSkillLevels(ids).catch(() => [] as Row[]),
    readPlayerAlliances(ids).catch(() => [] as Row[]),
    withState ? readStateRanks(ids).catch(() => null) : Promise.resolve(null)
  ]);
  for (const row of players) ownReads.set(String(row.player_id), gameReadOf(row));
  layRostersOver(ids);
  for (const row of skills) skillLevels.set(String(row.player_id), row);
  for (const row of kept) playerAlliances.set(String(row.player_id), row);
  // Each player's boards are replaced as a whole, so a board they dropped off goes.
  if (states) for (const [id, boards] of stateBoardsOf(states)) stateBoards.set(id, boards);
  draw();
  for (const id of ids) if (gameReads.get(id)?.asked) watchRefresh(id);
}

// Each player as shown: their own read, with what the newer roster says laid over it.
const ownReads = new Map<string, GameRead | null>();
function layRostersOver(ids: string[]): void {
  for (const id of ids) {
    const game = withRoster(ownReads.get(id) ?? null, rosterEntries.get(id));
    if (game) gameReads.set(id, game);
  }
}

// An account's skill levels as saved: null for a troop type never set.
function skillsOf(id: string): SkillLevels {
  const row = skillLevels.get(id);
  const levels: SkillLevels = {};
  for (const [kind] of TROOP_KINDS) levels[kind] = row?.[kind] === null || row?.[kind] === undefined ? null : Number(row[kind]);
  return levels;
}

// Whether an account's Exalted troops need a look: their skill levels were never set or
// not changed for over a month, and one of them is under Lvl. 3. Then "Update skill
// level" on their page carries a red dot.
function skillsNeedALook(row: Row): boolean {
  const id = String(row.in_game_id ?? '');
  const game = gameReads.get(id);
  if (!game) return false;
  const levels = skillsOf(id);
  const exalted = TROOP_KINDS.filter(([kind]) => (game.troops[kind]?.tier ?? 0) >= 12);
  if (!exalted.some(([kind]) => Number(levels[kind] ?? 0) < 3)) return false;
  const updated = Date.parse(String(skillLevels.get(id)?.updated_at ?? ''));
  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  return Number.isNaN(updated) || updated < monthAgo.getTime();
}

// The person's game accounts they can be on: the main first, then the alts, each in the
// order they were added (the table is read the first time it is needed). Farms are kept
// in the same table but belong to the main; they are not accounts to switch to.
function myGameAccounts(): Row[] {
  const order = (row: Row) => row.kind === 'main' ? 0 : 1;
  return (rowsOf('game_accounts') ?? []).filter(one => one.owner_id === person?.userId && one.kind !== 'farm')
    .sort((left, right) => order(left) - order(right) ||
      Number(left.sort_order ?? 0) - Number(right.sort_order ?? 0) || Number(left.id) - Number(right.id));
}

function openGameAccountId(): number | 'new' {
  if (openGameAccount === 'new') return 'new';
  const accounts = myGameAccounts();
  const open = accounts.find(one => one.id === openGameAccount) ?? accounts[0];
  return open ? Number(open.id) : 'new';
}

// The saved row of the account the player is on; null before their first account.
function myAccountRow(): Row | null {
  const openId = openGameAccountId();
  return openId === 'new' ? null : myGameAccounts().find(one => Number(one.id) === openId) ?? null;
}

// All the person's accounts: the main, the alts, then the farms, each in the order they
// were added.
function allMyAccounts(): Row[] {
  const farms = (rowsOf('game_accounts') ?? []).filter(one => one.owner_id === person?.userId && one.kind === 'farm')
    .sort((left, right) => Number(left.id) - Number(right.id));
  return myGameAccounts().concat(farms);
}

function openListedRow(): Row | null {
  return typeof openListed === 'number' ? allMyAccounts().find(one => Number(one.id) === openListed) ?? null : null;
}

// An account's picture and name as the game has them, for the photo bar, the top bar and
// the menu under the name.
function barAccountOf(row: Row): BarAccount {
  const game = gameReads.get(String(row.in_game_id ?? ''));
  return {
    row, avatar: game?.avatar ?? null, name: game?.name ?? '',
    colour: accountColour(alliances.find(one => one.id === allianceIdOfAccount(row)), alliancesStillHere(alliances))
  };
}

// The account shown on the player's page: a farm opened from the photo bar, otherwise
// the account the player is on.
function shownAccountRow(): Row | null {
  return openListedRow() ?? myAccountRow();
}

// Whether the troops were open for editing the last time the page was drawn.
let troopsWereOpen = false;

function profileOptions(): ProfileOptions | null {
  const row = person && openListed !== 'new' ? shownAccountRow() : null;
  if (!row) return null;
  const id = String(row.in_game_id ?? '');
  const own = row.kind !== 'farm';
  // The troops shrink once when editing opens and grow back once when it closes; any
  // other drawing keeps them as they are.
  const editingTroops = own && playerEditing.has('troops');
  const troopsMotion = editingTroops === troopsWereOpen ? null : editingTroops ? 'opening' : 'closing';
  troopsWereOpen = editingTroops;
  const skillDraft: SkillLevels = {};
  for (const [kind] of TROOP_KINDS) {
    const value = draftValue(kind + '_skill_level', 'troops');
    skillDraft[kind] = value === null || value === undefined ? null : Number(value);
  }
  return {
    account: row, game: gameReads.get(id) ?? null, countedIn: countedInOf(id), move: moveOf(id), stateBoards: stateBoards.get(id) ?? {},
    alliances: alliancesStillHere(alliances), homeState: Number(STATE_NUMBER), now: Date.now(),
    others: allMyAccounts().filter(one => one.id !== row.id).map(barAccountOf),
    kindsEditing: playerEditing.has('kinds') ? {
      accounts: allMyAccounts().map(barAccountOf),
      kinds: Object.fromEntries(allMyAccounts().map(one => [String(one.id), String(draftValue('kind:' + String(one.id), 'kinds'))])),
      changed: partHasChanges('kinds')
    } : null,
    ownAccount: own, skills: skillsOf(id), skillDraft,
    editingTroops: editingTroops, troopsMotion,
    troopsChanged: partHasChanges('troops') || levelsToConfirm('troops'),
    skillsDue: own && skillsNeedALook(row), labyrinthOpen
  };
}

// The alliance the site counts an account in, as the game writes its tag; null until the
// site has one.
function countedInOf(id: string): AllianceMove['from'] | null {
  const kept = playerAlliances.get(id);
  if (!kept) return null;
  return { tag: kept.alliance_tag ? String(kept.alliance_tag) : null, state: kept.state_number === null || kept.state_number === undefined ? null : Number(kept.state_number) };
}

// A move under way for an account: where the site counts it and where the game shows it
// now, while the 24 hours are counting. It shows only once the account has been in the
// new alliance for 2 hours, so short hops never show, and not while it is dismissed (3
// days). Null otherwise.
const MOVE_SHOWN_AFTER = 2 * 3600000;
function moveOf(id: string): AllianceMove | null {
  const kept = playerAlliances.get(id);
  if (!kept?.moving_since || Date.now() - Date.parse(String(kept.moving_since)) < MOVE_SHOWN_AFTER) return null;
  if (kept.dismissed_until && Date.parse(String(kept.dismissed_until)) > Date.now()) return null;
  const tagOf = (value: unknown) => value ? String(value) : null;
  const stateOf = (value: unknown) => value === null || value === undefined ? null : Number(value);
  return {
    from: { tag: tagOf(kept.alliance_tag), state: stateOf(kept.state_number) },
    to: { tag: tagOf(kept.moving_tag), state: stateOf(kept.moving_state) }
  };
}

// The way to add an account: from "Add account" in the menu, and as the page itself
// before the person's first account.
function addOptions(): AddOptions | null {
  if (!person || !rowsOf('game_accounts')) return null;
  const first = myGameAccounts().length === 0;
  if (openListed !== 'new' && !first) return null;
  return {
    draft: { kind: savedOf('listed', 'kind'), ...listedDraft }, lookUp, alliances: alliancesStillHere(alliances),
    homeState: Number(STATE_NUMBER), first, changed: partHasChanges('listed')
  };
}

function draftFor(part: string): Row {
  return part === 'listed' ? listedDraft : part === 'kinds' ? kindsDraft : playerDraft;
}

// A part's saved value. The very first account is the main; a new one after it starts as
// an alt until the player picks otherwise.
function savedOf(part: string, column: string): unknown {
  if (part === 'listed') return column === 'kind' ? (myGameAccounts().length === 0 ? 'main' : 'alt') : null;
  if (part === 'kinds') return allMyAccounts().find(row => 'kind:' + String(row.id) === column)?.kind ?? null;
  return savedValue(column);
}

// Puts the player on one of their game accounts, here and on every other page: its
// alliance becomes their alliance, and the choice is kept for their next visit.
function setActiveAccount(id: number | 'new' | null): void {
  openGameAccount = id;
  const row = typeof id === 'number' ? myGameAccounts().find(one => Number(one.id) === id) : undefined;
  const allianceId = row ? allianceIdOfAccount(row) : null;
  if (allianceId) view.myAllianceId = allianceId;
  rememberChoices();
}

function setAccountMenu(open: boolean): void {
  const wrap = document.querySelector<HTMLElement>('.account-menu-wrap');
  if (!wrap) return;
  wrap.classList.toggle('open', open);
  wrap.querySelector('[data-account-menu]')?.setAttribute('aria-expanded', String(open));
}

function signedOut(): void {
  person = null;
  openGameAccount = null;
  activeAllianceApplied = false;
  view.openPage = 'calendar';
  rememberChoices();
  draw();
}

// A saved value of the account the player is on: its skill levels are kept per in-game ID.
function savedValue(column: string): unknown {
  const row = myAccountRow();
  if (column.endsWith('_skill_level')) return skillsOf(String(row?.in_game_id ?? ''))[column.replace('_skill_level', '') as TroopKind] ?? null;
  return row?.[column] ?? null;
}

function sameValue(left: unknown, right: unknown): boolean {
  const plain = (value: unknown) => value === null || value === undefined || value === '' ? '' : String(value);
  return plain(left) === plain(right);
}

function partHasChanges(part: string): boolean {
  const draft = draftFor(part);
  return partColumns(part).some(column => column in draft && !sameValue(draft[column], savedOf(part, column)));
}

function draftValue(column: string, part: string): unknown {
  const draft = draftFor(part);
  return column in draft ? draft[column] : savedOf(part, column);
}

function dropDraft(part: string): void {
  const draft = draftFor(part);
  for (const column of partColumns(part)) delete draft[column];
}

function showPlayerNote(field: string, message: string): void {
  const note = document.querySelector<HTMLElement>(`[data-note-for="${field}"]`);
  if (note) { note.textContent = message; note.classList.toggle('problem', Boolean(message)); }
  document.querySelector(`[data-player-field="${field}"]`)?.classList.toggle('has-problem', Boolean(message));
}

// Lights or dims a part's Save button to match whether it has changes, without
// redrawing the page, so typing keeps its place.
function refreshSaveButton(part: string): void {
  const button = document.querySelector<HTMLButtonElement>(`[data-player-save="${part}"]`);
  if (button) button.disabled = !(partHasChanges(part) || levelsToConfirm(part)) || (part === 'listed' && lookUp.kind !== 'found');
}

// Out-of-date skill levels can be saved as they are, to confirm they are still right:
// Save is lit for them without changes (leaving without saving does not ask).
function levelsToConfirm(part: string): boolean {
  const row = myAccountRow();
  return part === 'troops' && row !== null && row.kind !== 'farm' && skillsNeedALook(row);
}

// The site's alliance for what the game says: one of ours only when the chief is in our
// state.
function siteAllianceIdOf(game: GameRead | null): string | null {
  if (!game?.allianceTag || game.state !== Number(STATE_NUMBER)) return null;
  return alliancesStillHere(alliances).find(one => one.tag === game.allianceTag)?.id ?? null;
}

// An account's alliance: the one the site keeps for it (a move counts after 24 hours
// there, or once confirmed), or, before that is known, where the game shows it. Null
// before it is read, or when it is in none of ours.
function allianceIdOfAccount(row: Row): string | null {
  const id = String(row.in_game_id ?? '');
  const kept = playerAlliances.get(id);
  if (kept) {
    if (Number(kept.state_number) !== Number(STATE_NUMBER) || !kept.alliance_tag) return null;
    return alliancesStillHere(alliances).find(one => one.tag === kept.alliance_tag)?.id ?? null;
  }
  return siteAllianceIdOf(gameReads.get(id) ?? null);
}

async function savePlayerPart(part: string): Promise<boolean> {
  if (!person || !(partHasChanges(part) || levelsToConfirm(part))) return true;
  return part === 'troops' ? saveSkillLevels() : part === 'kinds' ? saveAccountKinds() : saveNewAccount();
}

// What each account is, saved together. The account the player is on stays theirs unless
// it became a farm (farms are not accounts to be on): then they are put on their main.
async function saveAccountKinds(): Promise<boolean> {
  const kinds: Record<string, string> = {};
  for (const row of allMyAccounts()) {
    const column = 'kind:' + String(row.id);
    if (column in kindsDraft && !sameValue(kindsDraft[column], row.kind)) kinds[String(row.id)] = String(kindsDraft[column]);
  }
  // "The main" is where the player is when nothing is picked: pinned to the account they
  // are on first, so a new main does not move them.
  const onId = openGameAccountId();
  try {
    await setGameAccountKinds(kinds);
  } catch (problem) {
    showPlayerNote('kinds', problem instanceof Error ? problem.message : String(problem));
    return false;
  }
  if (typeof onId === 'number') openGameAccount = onId;
  for (const row of tableRows.get('game_accounts') ?? []) {
    const kind = kinds[String(row.id)];
    if (kind) row.kind = kind;
  }
  dropDraft('kinds');
  playerEditing.delete('kinds');
  const onRow = typeof openGameAccount === 'number' ? allMyAccounts().find(one => Number(one.id) === openGameAccount) : undefined;
  if (onRow?.kind === 'farm') {
    const main = myGameAccounts().find(one => one.kind === 'main');
    setActiveAccount(main ? Number(main.id) : null);
  }
  return true;
}

// A new account needs an ID the game knows and that is not already one of theirs. What
// the game says comes with it; the database keeps it in step from then on.
async function saveNewAccount(): Promise<boolean> {
  const found = lookUp.kind === 'found' ? lookUp.game : null;
  if (!person || !found) return false;
  const userId = person.userId;
  const kind = String(draftValue('kind', 'listed')) as 'main' | 'alt' | 'farm';
  // Only the link to the game's account is kept; its name, power and alliance stay in
  // the game data.
  const fields: Row = { kind, in_game_id: String(listedDraft.in_game_id) };
  const rows = tableRows.get('game_accounts');
  // There is always one main: making the new account the main makes the old main an alt,
  // first, so the two are never both the main.
  const oldMain = kind === 'main' ? myGameAccounts().find(one => one.kind === 'main') ?? null : null;
  let row: Row;
  try {
    if (oldMain) Object.assign(oldMain, await saveGameAccount(Number(oldMain.id), userId, 'alt', { kind: 'alt' }));
    try {
      row = await saveGameAccount(null, userId, kind, fields);
    } catch (problem) {
      // The old main goes back to being the main if the new one could not be saved.
      if (oldMain) Object.assign(oldMain, await saveGameAccount(Number(oldMain.id), userId, 'main', { kind: 'main' }).catch(() => oldMain));
      throw problem;
    }
  } catch (problem) {
    showPlayerNote('in_game_id', problem instanceof Error ? problem.message : String(problem));
    return false;
  }
  if (rows) rows.push(row);
  gameReads.set(String(row.in_game_id), found);
  dropDraft('listed');
  playerEditing.delete('listed');
  lookUp = { kind: 'none' };
  openListed = null;
  // A new main or alt becomes the account the player is on; a new farm leaves them where
  // they were.
  if (kind !== 'farm') setActiveAccount(Number(row.id));
  return true;
}

// The skill levels of the Exalted troops, kept per in-game ID, saved together.
async function saveSkillLevels(): Promise<boolean> {
  const row = myAccountRow();
  const id = String(row?.in_game_id ?? '');
  const levels = skillsOf(id);
  // Out of date: every Exalted troop's level is saved, changed or not, so the date moves on
  // and the red dot goes.
  const confirm = row ? skillsNeedALook(row) : false;
  const game = gameReads.get(id);
  try {
    for (const [kind] of TROOP_KINDS) {
      const column = kind + '_skill_level';
      const exalted = (game?.troops[kind]?.tier ?? 0) >= 12;
      const changed = column in playerDraft && !sameValue(playerDraft[column], levels[kind]);
      if (!changed && !(confirm && exalted)) continue;
      const value = changed ? playerDraft[column] : levels[kind];
      const level = value === null || value === undefined ? null : Number(value);
      await setSkillLevel(id, kind, level);
      skillLevels.set(id, { ...(skillLevels.get(id) ?? { player_id: id }), [kind]: level, updated_at: new Date().toISOString() });
    }
  } catch (problem) {
    showPlayerNote('troops', problem instanceof Error ? problem.message : String(problem));
    return false;
  }
  dropDraft('troops');
  playerEditing.delete('troops');
  return true;
}

// Leaving parts that have changes asks first: Save stores them, Cancel drops them, and
// either way the player then goes where they were going.
function leaveParts(parts: string[], then: () => void): void {
  const withChanges = parts.filter(partHasChanges);
  if (withChanges.length === 0) { then(); return; }
  pendingLeave = { parts: withChanges, then };
  draw();
}

async function answerLeave(answer: string): Promise<void> {
  const leave = pendingLeave;
  pendingLeave = null;
  if (!leave || answer === 'stay') { draw(); return; }
  if (answer === 'save') {
    for (const part of leave.parts) {
      if (!(await savePlayerPart(part))) { draw(); return; }
    }
  } else {
    for (const part of leave.parts) dropDraft(part);
  }
  leave.then();
}

// Whatever was open on the player's page closes: the skill levels, an account being
// added, the Labyrinth's areas.
function closePlayerParts(): void {
  for (const part of PLAYER_PARTS) dropDraft(part);
  playerEditing.clear();
  lookUp = { kind: 'none' };
  labyrinthOpen = false;
}

function handlePlayerPicks(target: HTMLElement): boolean {
  const leaveAnswer = target.closest<HTMLElement>('[data-leave-answer]');
  if (leaveAnswer) {
    // A tap inside the question but not on a button does nothing.
    if (leaveAnswer.dataset.leaveAnswer === 'stay' && target.closest('.leave-prompt-box')) return true;
    void answerLeave(leaveAnswer.dataset.leaveAnswer as string);
    return true;
  }
  const saveButton = target.closest<HTMLButtonElement>('[data-player-save]');
  if (saveButton) {
    saveButton.disabled = true;
    void savePlayerPart(saveButton.dataset.playerSave as string).then(saved => {
      if (saved) draw(); else refreshSaveButton(saveButton.dataset.playerSave as string);
    });
    return true;
  }
  const accountButton = target.closest<HTMLElement>('[data-game-account]');
  if (accountButton) {
    // Swapping to a main or an alt, from the photo bar or the menu, asks first when there
    // are changes not saved.
    const chosen = Number(accountButton.dataset.gameAccount);
    setAccountMenu(false);
    if (chosen === openGameAccountId() && openListed === null && view.openPage === 'player') return true;
    leaveParts(PLAYER_PARTS, () => {
      closePlayerParts();
      openListed = null;
      setActiveAccount(chosen);
      draw();
    });
    return true;
  }
  const farmButton = target.closest<HTMLElement>('[data-listed-account]');
  if (farmButton) {
    // A farm opens on its own, as the game shows it; the photo bar leads back.
    const chosen = Number(farmButton.dataset.listedAccount);
    leaveParts(PLAYER_PARTS, () => {
      closePlayerParts();
      openListed = chosen;
      draw();
    });
    return true;
  }
  const editAccountsButton = target.closest<HTMLElement>('[data-edit-accounts]');
  if (editAccountsButton) {
    // Opens on the profile, on the account the player is on, with the photo row in place.
    setAccountMenu(false);
    leaveParts(PLAYER_PARTS, () => {
      closePlayerParts();
      openListed = null;
      playerEditing.add('kinds');
      view.openPage = 'player';
      view.openSubPage = '';
      startAtTop.wholePage = true;
      draw();
    });
    return true;
  }
  const accountKindPick = target.closest<HTMLButtonElement>('[data-account-kind]');
  if (accountKindPick && !accountKindPick.disabled) {
    const [id, kind] = (accountKindPick.dataset.accountKind as string).split('|');
    // Always one main: a new main makes the old one an alt.
    if (kind === 'main') {
      for (const row of allMyAccounts()) {
        const column = 'kind:' + String(row.id);
        if (String(row.id) !== id && draftValue(column, 'kinds') === 'main') kindsDraft[column] = 'alt';
      }
    }
    kindsDraft['kind:' + id] = kind;
    draw();
    return true;
  }
  const addButton = target.closest<HTMLElement>('[data-add-account]');
  if (addButton) {
    setAccountMenu(false);
    leaveParts(PLAYER_PARTS, () => {
      closePlayerParts();
      openListed = 'new';
      playerEditing.add('listed');
      view.openPage = 'player';
      view.openSubPage = '';
      startAtTop.wholePage = true;
      draw();
      document.querySelector<HTMLInputElement>('#player-in_game_id')?.focus();
    });
    return true;
  }
  const kindPick = target.closest<HTMLButtonElement>('[data-kind-pick]');
  if (kindPick && !kindPick.disabled) {
    listedDraft.kind = kindPick.dataset.kindPick;
    draw();
    return true;
  }
  const cancelButton = target.closest<HTMLElement>('[data-cancel-part]');
  if (cancelButton) {
    // Cancel drops the part's changes and closes it, without asking: that is what it is for.
    const part = cancelButton.dataset.cancelPart as string;
    dropDraft(part);
    playerEditing.delete(part);
    if (part === 'listed') { openListed = null; lookUp = { kind: 'none' }; }
    draw();
    return true;
  }
  const stagesButton = target.closest<HTMLElement>('[data-labyrinth-stages]');
  if (stagesButton) {
    labyrinthOpen = !labyrinthOpen;
    draw();
    return true;
  }
  const editButton = target.closest<HTMLElement>('[data-player-edit]');
  if (editButton) {
    const part = editButton.dataset.playerEdit as string;
    if (!playerEditing.has(part)) { playerEditing.add(part); draw(); return true; }
    leaveParts([part], () => { playerEditing.delete(part); draw(); });
    return true;
  }
  const troopPick = target.closest<HTMLElement>('[data-troop-pick]');
  if (troopPick) {
    // The skill level of an Exalted troop: None (0) or Lvl. 1 to 3.
    const [kind, , value] = (troopPick.dataset.troopPick as string).split('|');
    playerDraft[kind + '_skill_level'] = Number(value);
    draw();
    return true;
  }
  const settleButton = target.closest<HTMLElement>('[data-settle-move]');
  if (settleButton) {
    // Confirm: the account's alliance becomes the one the game shows now, and so does "my
    // alliance" when it is the account the player is on. Dismiss: it stays for 3 days.
    const [choice, id] = (settleButton.dataset.settleMove as string).split('|') as ['confirm' | 'dismiss', string];
    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-settle-move]'));
    for (const button of buttons) button.disabled = true;
    void settleAllianceMove(id, choice).then(async () => {
      await rereadGameData([id]);
      const active = myAccountRow();
      const allianceId = active && String(active.in_game_id ?? '') === id ? allianceIdOfAccount(active) : null;
      if (allianceId) view.myAllianceId = allianceId;
      draw();
    }).catch(problem => {
      for (const button of buttons) button.disabled = false;
      showPlayerNote('move', problem instanceof Error ? problem.message : String(problem));
    });
    return true;
  }
  const refreshButton = target.closest<HTMLElement>('[data-game-refresh]');
  if (refreshButton) {
    // Asks the database for a fresh read; the job that reads the game runs every minute
    // and asks again while the game is still being read, so the page looks again every
    // minute until the fresh copy is in.
    const id = refreshButton.dataset.gameRefresh as string;
    refreshButton.setAttribute('disabled', '');
    void askGameRefresh(id).then(() => {
      const game = gameReads.get(id);
      if (game) gameReads.set(id, { ...game, asked: true });
      draw();
      refreshWatches.delete(id);
      watchRefresh(id);
    }).catch(() => { refreshButton.removeAttribute('disabled'); });
    return true;
  }
  return false;
}

function playerInput(event: Event): HTMLInputElement | null {
  const input = event.target as HTMLElement | null;
  return input instanceof HTMLInputElement && input.dataset.playerField ? input : null;
}

// While typing, only what the field can hold gets in, and the change is kept until the
// player saves. A whole in-game id is looked up in the game at once.
function filterPlayerTyping(event: Event): void {
  const input = playerInput(event);
  if (!input) return;
  const field = input.dataset.playerField as string;
  const kept = field === 'in_game_id' ? filterId(input.value) : filterFoundryPower(input.value);
  // Foundry power is written with its thousands marked while it is typed, as it is shown.
  const shown = field === 'foundry_power' ? foundryText(kept) : kept;
  if (shown !== input.value) input.value = shown;
  const part = 'listed';
  draftFor(part)[field] = field === 'foundry_power' ? (kept === '' ? null : Number(kept)) : kept;
  showPlayerNote(field, '');
  if (field === 'in_game_id') lookUpTypedId(kept);
  refreshSaveButton(part);
}

// What a typed id is in the game. Looked up once typing pauses with at least 8 digits
// (an 8-digit start can be part of a longer id); an id already among the person's
// accounts is not looked up. The game's answer is the check: no player, no Save.
let lookUpFor = '';
let lookUpTimer = 0;
function lookUpTypedId(id: string): void {
  window.clearTimeout(lookUpTimer);
  if (idProblem(id) !== '') {
    if (lookUp.kind !== 'none') { lookUp = { kind: 'none' }; lookUpFor = ''; draw(); }
    return;
  }
  if (id === lookUpFor) return;
  // The answer shown was for another id: it goes at once, so Save never pairs the new id
  // with the old answer.
  if (lookUp.kind !== 'none') { lookUp = { kind: 'none' }; lookUpFor = ''; draw(); }
  lookUpTimer = window.setTimeout(() => lookUpNow(id), 600);
}

function lookUpNow(id: string): void {
  if (id === lookUpFor) return;
  lookUpFor = id;
  if (allMyAccounts().some(one => String(one.in_game_id) === id)) { lookUp = { kind: 'taken' }; draw(); return; }
  lookUp = { kind: 'looking' };
  draw();
  void lookUpGameAccount(id).then(answer => {
    if (lookUpFor !== id) return;
    lookUp = answer ? {
      kind: 'found', game: {
        name: answer.name, avatar: answer.avatar, power: answer.power ?? null, powerRank: null, state: answer.state,
        allianceTag: answer.alliance, allianceRank: null, troops: {}, heroes: [], boards: {}, readAt: null, shownAt: null, asked: true
      }
    } : { kind: 'missing' };
    draw();
  }).catch(() => { if (lookUpFor === id) { lookUp = { kind: 'missing' }; draw(); } });
}

function leavePlayerFieldOnEnter(event: KeyboardEvent): void {
  if (event.key === 'Enter' && playerInput(event)) (event.target as HTMLInputElement).blur();
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

// A fort's alliance or who its reward counts for, picked in place on the Phase or
// Season tab. Saved at once, keeping whatever else the fort already has (its battle
// time, the buffs kept for leads). Picking no alliance takes the fort off the plan.
// The choice is "holder|<alliance id or empty>" or "credit|<'', 'shared' or an id>".
function saveFortChoice(placeText: string, choice: string): void {
  if (!person) return;
  const [season, phase, fort] = placeText.split('|');
  const [field, value] = choice.split('|');
  const place = { season: Number(season), phase: Number(phase), fort };
  const held = fortAssignments.find(one => one.season === place.season && one.phase === place.phase && one.fort === fort);
  const battleDay = fortBattleDayOf(place.season, place.phase);
  const battleAt = held?.battleTimeUtc && battleDay !== null
    ? textFromDay(battleDay) + 'T' + held.battleTimeUtc + ':00Z' : null;
  const userId = person.userId;
  // Giving a reward to the one it already goes to gives it back to the holder.
  const creditedTo = field === 'credit' && held?.creditedTo === value ? '' : value;
  const save = field === 'credit'
    // Only a held fort has a reward to count for anyone.
    ? (held ? saveFortAssignment(place, { allianceId: held.allianceId, creditedTo, battleAt }, userId) : Promise.resolve())
    : value
      ? saveFortAssignment(place, { allianceId: value, creditedTo: held?.creditedTo ?? '', battleAt }, userId)
      : held ? deleteRow('fort_assignments', 'id', held.id) : Promise.resolve();
  save.then(async () => {
    fortAssignments = await loadFortAssignments().catch(() => fortAssignments);
    fortSaveProblem = '';
    draw();
  }).catch(problem => {
    fortSaveProblem = problem instanceof Error ? problem.message : String(problem);
    draw();
  });
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

  // Answers are kept per game account: each one ticked in "Save for which accounts?", or
  // the main when there are no alts. The answer saved is that account's own, new or not.
  const savedFor = String(values.get('save_for') ?? '');
  const active = person ? (savedFor ? myGameAccounts().find(one => String(one.id) === savedFor)
    : myGameAccounts().find(one => one.kind === 'main')) ?? null : null;
  if (formName === 'availability') {
    if (!runColumns) throw new Error('No event is coming up.');
    if (!active) throw new Error('Fill in your details on your page first.');
    key = String((tableRows.get('availability') ?? []).find(one => one.event_type_id === runColumns.event_type_id &&
      one.event_date === runColumns.event_date && one.game_account_id === active.id)?.id ?? '');
    const from = hour('from_hour_utc');
    const to = hour('to_hour_utc');
    const isUnavailable = values.get('is_unavailable') === 'on';
    if (!isUnavailable && (from === null || to === null)) throw new Error('Fill in the hours you can play, or tick that you cannot play.');
    const saved = await saveRow('availability', {
      id: key || undefined, ...runColumns, account_id: userId, game_account_id: active.id,
      alliance_id: allianceIdOfAccount(active) ?? view.myAllianceId, playing_for_alliance_id: orNull('playing_for_alliance_id'),
      is_unavailable: isUnavailable,
      has_monthly_card: values.get('has_monthly_card') === 'on',
      updated_at: now
    }, key ? '' : 'event_type_id,event_date,game_account_id');
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
    // An SvS or Sunfire Castle edited in place: its points, Occupation Ranking and
    // president are turned into the details and columns it is kept as, and the SvS's State
    // of Power result follows from its two parts.
    const president = eventTypeId === 'svs' || eventTypeId === 'sunfire' ? svsDetailsFromEdit(values, eventTypeId === 'svs') : null;
    const saved = await saveRow('results', {
      id: existingId ? Number(existingId) : undefined, event_type_id: eventTypeId, event_date: date,
      alliance_id: allianceId, state_alliance_id: orNull('state_alliance_id'),
      outcome, rank, note: orNull('note'),
      ...(president ? { president_alliance_id: president.allianceId, president_name: president.name } : {}),
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
  if (formName === 'rally-lead') {
    await saveRow('rally_leads', {
      alliance_id: text('alliance_id'), in_game_name: text('in_game_name'), in_game_id: orNull('in_game_id'),
      tier: text('tier') === 'castle' ? 'castle' : 'turret', sort_order: rallyLeads.length,
      updated_by: userId, updated_at: now
    });
    return ['rally_leads'];
  }
  if (formName === 'fort-reserve') {
    const count = decimal('reserved_for_leads') ?? 0;
    if (!Number.isInteger(count) || count < 0) throw new Error('Write how many as a whole number, 0 or more.');
    await saveRow('fort_assignments', { id: Number(key), reserved_for_leads: count, updated_by: userId, updated_at: now });
    return ['fort_assignments'];
  }
  if (formName === 'buff-share') {
    const count = decimal('quantity') ?? 0;
    if (!Number.isInteger(count) || count < 0) throw new Error('Write how many as a whole number, 0 or more.');
    const leadId = Number(text('rally_lead_id'));
    const existing = buffAllocations.find(one => one.fortAssignmentId === Number(key) && one.rallyLeadId === leadId);
    // Giving a lead 0 takes their share of this fort away.
    if (count === 0) {
      if (existing) await deleteRow('buff_allocations', 'id', existing.id);
    } else {
      await saveRow('buff_allocations', {
        fort_assignment_id: Number(key), rally_lead_id: leadId, quantity: count, updated_by: userId, updated_at: now
      }, 'fort_assignment_id,rally_lead_id');
    }
    return ['buff_allocations'];
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
      creditedTo: text('creditedTo'),
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
    fortAssignments = await loadFortAssignments().catch(() => fortAssignments);
  } else {
    const [loadedSchedules, changes] = await Promise.all([loadSchedules(), loadDateChanges()]);
    schedules = loadedSchedules;
    expandOptions = { allSchedules: loadedSchedules, changesBySchedule: groupChanges(changes), partOfByEventTypeId };
    // A moved SvS or Sunfire changes which battle a transfer follows.
    rememberBattleDays();
  }
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
let swipeStart: { x: number; y: number; onFortressPhase: boolean } | null = null;

// The Phase page of the fortress is open.
function isOnFortressPhase(): boolean {
  return view.openPage === 'fortress' && (view.openSubPage || 'phase') === 'phase';
}

// Moves the fortress pages by a number of phases; back on the phase being played,
// they follow it again as the weeks go by.
function stepFortressPhases(phases: number): void {
  const next = (view.fortressBattleDay ?? playedFortBattleDay()) + 7 * phases;
  view.fortressBattleDay = next === playedFortBattleDay() ? null : next;
}

function startSwipe(event: TouchEvent): void {
  const target = event.target as HTMLElement | null;
  swipeStart = null;
  if (event.touches.length !== 1) return;
  const touch = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  // The fortress phase moves on any screen a finger can swipe.
  if (isOnFortressPhase() && target?.closest('.fort-board')) {
    swipeStart = { ...touch, onFortressPhase: true };
    return;
  }
  if (window.innerWidth >= PHONE_WIDTH || view.openPage !== 'calendar' || view.isPanelOpen) return;
  if (!target?.closest('.calendar-panel')) return;
  swipeStart = { ...touch, onFortressPhase: false };
}

function endSwipe(event: TouchEvent): void {
  if (!swipeStart) return;
  const across = event.changedTouches[0].clientX - swipeStart.x;
  const down = event.changedTouches[0].clientY - swipeStart.y;
  const onFortressPhase = swipeStart.onFortressPhase;
  swipeStart = null;
  if (Math.abs(across) < SWIPE_DISTANCE || Math.abs(across) < Math.abs(down) * 1.5) return;
  // Swiping to the left brings in what comes next, as turning a page does.
  if (onFortressPhase) {
    stepFortressPhases(across < 0 ? 1 : -1);
  } else {
    step(across < 0 ? 1 : -1);
    startAtTop.calendar = true;
  }
  draw();
}

// On a computer the arrow keys move the Phase page, as a swipe does on a phone.
function stepWithKeys(event: KeyboardEvent): void {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  if (!isOnFortressPhase() || event.altKey || event.ctrlKey || event.metaKey) return;
  if ((event.target as HTMLElement | null)?.closest('input, select, textarea')) return;
  stepFortressPhases(event.key === 'ArrowRight' ? 1 : -1);
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
  // Open filters are one step above whatever is under them, so back closes them first.
  const filters = view.filtersOpen ? 1 : 0;
  const isPhone = window.innerWidth < PHONE_WIDTH;
  // On a phone a closed panel is the calendar itself, whatever was open in it.
  if (isPhone && !view.isPanelOpen) return filters;
  let level = isPhone ? 1 : 0;
  if (view.openEventKey && view.openedFromDay !== null) level += 1;
  return level + filters;
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
  // The profile is not one of the sections, but a reload keeps it open too.
  if (page && (pageById(page) || page === 'player')) view.openPage = page;
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
      if (view.filtersOpen) {
        view.filtersOpen = false;
      } else if (view.openEventKey && view.openedFromDay !== null) {
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

// The top bar as it looks before anything has loaded, used when something goes wrong.
function problemBar(): string {
  return topBar({
    stateNumber: STATE_NUMBER, openPage: view.openPage,
    eventLabel: PAGES[3].label, playerName: null, accountMenu: null, eventTypeId: null
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
    // Everything the site needs is read at once rather than one after another: each read
    // is a trip to the database, and in a row they made every reload slow.
    const [loadedSchedules, changes, settings, loadedAlliances, loadedForts, loadedLeads, loadedDates,
      loadedGenerations, loadedWindows, signedIn] = await Promise.all([
      loadSchedules(), loadDateChanges(), loadSettings(),
      // Alliance names are wanted on bars and panels, but nothing stops without them.
      loadAlliances().catch(() => []),
      // The board is wanted only when that page is opened, but it is small and the
      // page is drawn from one place, so it is read once here.
      loadFortAssignments().catch(() => []),
      loadRallyLeads().catch(() => []),
      loadTransferDates().catch(() => []),
      // The state's hero generation on each transfer date, for the heroes named in texts.
      loadGenerationsOfState(Number(STATE_NUMBER)).catch(() => []),
      loadTransferWindows().catch(() => []),
      // Who is signed in, with the choices kept with their login. Their alliance follows
      // the account they are on, once the game has been read for it (drawPage).
      signedInPerson().catch(() => null)
    ]);
    alliances = loadedAlliances;
    rememberAlliances(alliances);
    person = signedIn;

    schedules = loadedSchedules;
    transferFollows = settings.get('transferFollows') === 'sunfire' ? 'sunfire' : 'svs';
    firstFortBattleDay = dayFromText(settings.get('fortressSeasonStart') ?? '');
    fortAssignments = loadedForts;
    setFortRewardsGeneration(Number(settings.get('fortRewardsGeneration') ?? ''));
    rallyLeads = loadedLeads;
    transferDates = loadedDates;
    setGenerationSteps(loadedGenerations);
    transferWindows = loadedWindows;
    // The runs are worked out from these, so they are set before the battle days are
    // read; without them every transfer followed neither battle and the SvS and
    // Sunfire filters emptied the page.
    expandOptions = {
      allSchedules: loadedSchedules,
      changesBySchedule: groupChanges(changes),
      partOfByEventTypeId
    };
    rememberBattleDays();
    // The kept choices come before the transfer dates on screen, which follow the
    // Transfers page's SvS and Sunfire switches.
    applyKeptChoices();
    openSharedAddress();
    setOpenPointRows(view.openPointRows);
    // The predictions open on the next transfer of the kind shown, or the last one there is.
    const todayText = textFromDay(todayNumber());
    const shownDates = datesInFilter();
    view.predictionFirstDate = shownDates.find(date => date >= todayText) ??
      shownDates[shownDates.length - 1] ?? '';
    const comingDate = nextWindow()?.transferDate ??
      transferDates.find(one => one >= todayText) ?? '';
    // What depends on the first reads, again all at once.
    const [loadedBuffs, loadedCandidates, loadedComingGroups, loadedGroups] = await Promise.all([
      loadBuffAllocations(fortAssignments.map(one => one.id)).catch(() => []),
      loadCandidatesOf(transferWindows.map(one => one.id)).catch(() => []),
      comingDate ? loadTransferGroups([comingDate]).catch(() => []) : Promise.resolve(null),
      view.predictionFirstDate ? loadTransferGroups(shownPredictionDates()).catch(() => []) : Promise.resolve(null)
    ]);
    buffAllocations = loadedBuffs;
    transferCandidates = loadedCandidates;
    if (loadedComingGroups) nextWindowGroups = loadedComingGroups;
    if (loadedGroups) transferGroups = loadedGroups;
    document.addEventListener('click', handleClicks);
    document.addEventListener('submit', handleSubmits);
    document.addEventListener('input', filterPlayerTyping);
    // An SvS being edited works out its totals and results as the numbers are typed in.
    const svsEditorOf = (target: EventTarget | null) =>
      target instanceof HTMLElement ? target.closest<HTMLFormElement>('#' + SVS_EDIT_FORM_ID) : null;
    // A time held (SvS Battle, Sunfire Castle) keeps its colons; only digits are typed.
    document.addEventListener('input', event => {
      if (event.target instanceof HTMLInputElement && event.target.classList.contains('svs-time-field')) typeHoldTime(event.target);
    });
    for (const kind of ['input', 'change'] as const) {
      document.addEventListener(kind, event => {
        const form = svsEditorOf(event.target);
        if (form) updateSvsEditor(form);
      });
    }
    // A newer version gone live: reloaded in the background, offered on screen; never
    // reloaded by itself while something is being edited.
    watchForNewVersion(() => view.editing !== null || view.fortressEditing || (view.openPage === 'player' && PLAYER_PARTS.some(partHasChanges)));
    // Closing or reloading the tab with changes not saved: the browser asks in its own words.
    window.addEventListener('beforeunload', event => {
      if (view.openPage === 'player' && PLAYER_PARTS.some(partHasChanges)) event.preventDefault();
    });
    document.addEventListener('keydown', leavePlayerFieldOnEnter);
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      setAccountMenu(false);
    });
    // The profile's names and board names are sized to their columns once drawn, and again
    // when the window changes width or the site's fonts arrive.
    window.addEventListener('resize', () => { if (view.openPage === 'player') fitPlayerPage(); });
    void document.fonts?.ready.then(() => { if (view.openPage === 'player') fitPlayerPage(); });
    document.addEventListener('touchstart', startSwipe, { passive: true });
    document.addEventListener('touchend', endSwipe, { passive: true });
    document.addEventListener('keydown', stepWithKeys);
    window.addEventListener('popstate', returnToPlace);
    // The site puts every scroll back itself; the browser's own would jump to the top
    // whenever the history steps back.
    history.scrollRestoration = 'manual';
    // The clock in the top bar, and the bars when the window changes width.
    window.setInterval(() => {
      const clock = document.getElementById('clockTime');
      if (clock) clock.textContent = gameClockText(nowMinute());
    }, 30000);
    // The bars and the cards are measured on their letters, so they are laid out again
    // when the window changes width and when the site's font has arrived (the page is
    // often drawn before it has, in a stand-in font of another width).
    const layOutCalendarAgain = () => {
      fitNextTiles(document);
      const panel = document.querySelector<HTMLElement>('.calendar-panel');
      if (!panel || view.calendarView === 'year') return;
      layoutBars(panel);
      fitBarLabels(panel);
      sizeLanes(panel);
    };
    window.addEventListener('resize', layOutCalendarAgain);
    // On a phone the day names stay under the top bar while the weeks scroll; they take
    // the bar's tone only once they are held there.
    const holdDayNames = () => {
      const bar = document.querySelector<HTMLElement>('.top-bar');
      const height = bar ? bar.getBoundingClientRect().height : 0;
      document.documentElement.style.setProperty('--top-bar-height', height + 'px');
      const names = document.querySelector<HTMLElement>('.calendar-panel .weekday-names');
      if (names) names.classList.toggle('stuck', window.innerWidth < 1000 && names.getBoundingClientRect().top <= height + 0.5);
    };
    window.addEventListener('scroll', holdDayNames, { passive: true });
    window.addEventListener('resize', holdDayNames);
    afterEachDraw.push(holdDayNames);
    document.fonts?.addEventListener('loadingdone', layOutCalendarAgain);
    void document.fonts?.ready.then(layOutCalendarAgain);
    draw();
  } catch (problem) {
    const message = problem instanceof Error ? problem.message : String(problem);
    app.innerHTML = problemBar() + '<main class="page">' + problemPanel(message) + '</main>';
  }
}

void start();
