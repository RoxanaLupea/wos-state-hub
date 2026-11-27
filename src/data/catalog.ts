// The catalog is everything the game publishes and we never change: the list of
// events, their colours and phases, and the words for them. It lives in files rather
// than the database because it only changes when the game does.
import eventTypeRows from '../../data/catalog/event-types.json' with { type: 'json' };
import eventPhaseRows from '../../data/catalog/event-phases.json' with { type: 'json' };
import eventStepRows from '../../data/catalog/event-steps.json' with { type: 'json' };
import pointSourceRows from '../../data/catalog/point-sources.json' with { type: 'json' };
import rewardRows from '../../data/catalog/rewards.json' with { type: 'json' };
import itemRows from '../../data/catalog/items.json' with { type: 'json' };
import fortRewardRows from '../../data/catalog/fort-rewards.json' with { type: 'json' };
import englishText from '../../data/text/en.json' with { type: 'json' };
import type { EventPhase } from '../calendar/bars.ts';
import type { EventStep } from '../calendar/day-timeline.ts';
import { todayNumber } from '../calendar/days.ts';
import { fillGeneration, fillHeroNames, heroShardsOnDay } from './heroes.ts';

export interface EventType {
  id: string;
  category: string;
  color?: string;
  colorEnd?: string;
  icon?: string;
  imageFile?: string;
  partOf?: string;
  groupCount?: string;
  detailsOnly?: string;
  // 'yes' when the event's times of each day are shown as one line of times
  // (Wild Brawl: the four times a day it can be played), not as separate moments.
  timesInLine?: string;
  sortOrder?: number;
  // A second colour the bar fades from, when the game gives the event one.
  timelineColor?: string;
  // The event's own colours, taken from the background of its logo: a light tone, then
  // a darker one. Where an event has them, its bar, its lines and its text use them.
  logoColors?: [string, string];
  // The stretches a part is open, counted from the first day of its own event.
  openWindows?: { fromDay: number; fromTime: string; toDay: number; toTime: string }[];
  // How an opening is marked on the bar: by its label, or only where it ends.
  windowMark?: string;
  // The game sets this event's dates and times, and nobody changes them on the site (no
  // date, repeat or alliance-time pencil): State of Power and Sunfire Castle (25 Nov).
  datesLocked?: boolean;
  // How many days before its end the event stops being played, though its tabs stay open
  // in the game (Fishing's last day, Roxanne 27 Nov). The bar draws a line ending with a
  // fish over the days it can be played.
  fishingEndsDaysEarly?: number;
  // An event that changes season each run, once a month (Fishing): the seasons in their
  // order and one run whose season is known. Fishing's order is from Century Games' help
  // centre; Summer for 24 Nov 2026 is from Roxanne's screenshot (27 Nov).
  seasonOrder?: string[];
  seasonKnown?: { firstDate: string; season: string };
  // A part's colour on its whole event's timeline, held through its rows and blended
  // into the next part's (State of Power: our blue, their red, then Field Triage's green).
  lineColor?: string;
  // The times a player can pick from ("02:00,05:00,..."), such as Frostfire's slots.
  slotTimes?: string;
}

interface PhaseRow {
  id: string;
  eventTypeId: string;
  fromDay: number;
  toDay: number;
  startTimeUtc?: string;
  endTimeUtc?: string;
  hideBar?: string;
  sortOrder: number;
}

const eventTypes = eventTypeRows as EventType[];
const text = englishText as Record<string, string>;

const eventTypesById = new Map(eventTypes.map(eventType => [eventType.id, eventType]));

export function eventTypeById(id: string): EventType | undefined {
  return eventTypesById.get(id);
}

// Falls back to the id, so a missing word shows up as an obvious oddity on the page
// rather than an empty space.
export function eventTypeName(id: string): string {
  return text['eventType.' + id + '.name'] ?? id;
}

export function eventTypeShortName(id: string): string {
  return text['eventType.' + id + '.shortName'] ?? eventTypeName(id);
}

// A stage's name, for the stages of an event (State of Power: Matchmaking, Preparation,
// Battle, Field Triage). Empty for an event that is not a stage.
export function eventTypeStageName(id: string): string {
  return text['eventType.' + id + '.stageName'] ?? '';
}

// A name of two or three letters for a bar too narrow even for the short name
// (Field Triage's last day: "FT", Brothers in Arms after "BIA / KE": "BIA"). Most events
// have none, and then show only their logo.
export function eventTypeInitials(id: string): string {
  return text['eventType.' + id + '.initials'] ?? '';
}

// A second name written quietly after the full one on a bar. An event can have its own
// (State of Power: SvS, Brothers in Arms: KE). Otherwise, for now, an event whose name
// has two words or more uses its initials: King of Icefield KOI, Crazy Joe CJ.
export function eventTypeTag(id: string): string {
  // Deals, special events and packs have no second name.
  if (['deals', 'special', 'packs'].includes(categoryOf(id))) return '';
  // A stored tag wins, and a stored empty tag means the event has no second name.
  const own = text['eventType.' + id + '.tag'];
  if (own !== undefined) return own;
  const words = eventTypeName(id).split(/\s+/).filter(word => /^[A-Za-z]/.test(word));
  if (words.length < 2) return '';
  return words.map(word => word[0].toUpperCase()).join('');
}

// Some events run more than once per alliance: two bear traps, two foundry legions.
// This is what one of them is called — "Trap", "Legion", "Session".
export function eventGroupName(id: string): string | null {
  return text['eventType.' + id + '.groupName'] ?? null;
}

export function phaseName(phaseId: string): string {
  return text['eventPhase.' + phaseId + '.name'] ?? '';
}

// A shorter name for a phase, for a bar where the full one does not fit
// (Invitation Transfer: "Invite"). Most phases have none.
export function phaseShortName(phaseId: string): string {
  return text['eventPhase.' + phaseId + '.shortName'] ?? '';
}

export function eventTypeColor(id: string): string {
  return eventTypesById.get(id)?.color ?? '#7E8AA8';
}

// The SvS and its parts: our state against another, drawn in our blue and their red.
export const SVS_FAMILY = ['svs', 'svs-matchmaking', 'svs-prep', 'svs-battle', 'castle-battle', 'svs-triage'];

// The light and the dark colour of an event's logo. Without its own pair, both are the
// event's single colour.
export function logoColors(id: string): { light: string; dark: string } {
  const pair = eventTypesById.get(id)?.logoColors;
  const color = eventTypeColor(id);
  return { light: pair?.[0] ?? color, dark: pair?.[1] ?? color };
}

export function hasLogoColors(id: string): boolean {
  return Boolean(eventTypesById.get(id)?.logoColors);
}

// A bar fades from the event's colour to its second one, left to right. Events with
// only one colour fade from it to itself, which reads as flat.
export function eventTypeColorEnd(id: string): string {
  const eventType = eventTypesById.get(id);
  return eventType?.colorEnd ?? eventType?.color ?? '#7E8AA8';
}

// The season of an event's run starting on this day, counted a season a month from the
// run whose season is known. '' for an event without seasons.
export function seasonOf(id: string, startDay: number): string {
  const eventType = eventTypesById.get(id);
  const order = eventType?.seasonOrder;
  const known = eventType?.seasonKnown;
  if (!order?.length || !known) return '';
  const knownDate = new Date(known.firstDate + 'T00:00:00Z');
  const runDate = new Date(startDay * 24 * 60 * 60 * 1000);
  const months = (runDate.getUTCFullYear() - knownDate.getUTCFullYear()) * 12 +
    runDate.getUTCMonth() - knownDate.getUTCMonth();
  const knownIndex = order.indexOf(known.season);
  if (knownIndex < 0) return '';
  return order[(((knownIndex + months) % order.length) + order.length) % order.length];
}

export function showsTimesInLine(id: string): boolean {
  return eventTypesById.get(id)?.timesInLine === 'yes';
}

export function isDetailsOnly(id: string): boolean {
  return eventTypesById.get(id)?.detailsOnly === 'yes';
}

// Which bigger event each one is a part of, so a part follows its parent's moves.
export const partOfByEventTypeId = new Map<string, string | null>(
  eventTypes.map(eventType => [eventType.id, eventType.partOf ?? null])
);

// The event a part belongs to when that event is shown whole: State of Power, whose
// parts include stages (Matchmaking, Preparation, Battle, Field Triage). Any of its
// parts, Castle Battle too, stands for the whole event. Empty for everything else.
export function wholeEventTypeOf(id: string): string {
  const parentId = partOfByEventTypeId.get(id);
  if (!parentId) return '';
  const hasStages = eventTypes.some(eventType => eventType.partOf === parentId && eventTypeStageName(eventType.id));
  return hasStages ? parentId : '';
}

export const phasesByEventType = (() => {
  const rows = eventPhaseRows as PhaseRow[];
  const byEventType = new Map<string, EventPhase[]>();
  for (const row of rows) {
    const phase: EventPhase = {
      id: row.id,
      eventTypeId: row.eventTypeId,
      fromDay: Number(row.fromDay),
      toDay: Number(row.toDay),
      startTimeUtc: row.startTimeUtc ?? null,
      endTimeUtc: row.endTimeUtc ?? null,
      hideBar: row.hideBar === 'yes',
      sortOrder: Number(row.sortOrder)
    };
    const forType = byEventType.get(phase.eventTypeId) ?? [];
    forType.push(phase);
    byEventType.set(phase.eventTypeId, forType);
  }
  for (const phases of byEventType.values()) {
    phases.sort((left, right) => left.sortOrder - right.sortOrder);
  }
  return byEventType;
})();

// Which filter an event belongs to: state, alliance, personal or deals.
export function categoryOf(eventTypeId: string): string {
  return eventTypesById.get(eventTypeId)?.category ?? 'state';
}

// The words for one step of an event: "Voting", "Match 1", "Rewards sent".
export function stepLabel(stepId: string): string {
  return text['eventStep.' + stepId + '.label'] ?? stepId;
}

// A phase's or a step's instructions, shown under it, smaller, as in the old app.
export function phaseNote(phaseId: string): string {
  return text['eventPhase.' + phaseId + '.note'] ?? '';
}

export function stepNote(stepId: string): string {
  return text['eventStep.' + stepId + '.note'] ?? '';
}

// A line always shown under a step's name ("Adjust lanes" under "Round 1").
export function stepDetail(stepId: string): string {
  return text['eventStep.' + stepId + '.detail'] ?? '';
}

// The steps of each event, in the order the game runs them.
export const eventStepsByEventType = (() => {
  const rows = eventStepRows as {
    id: string; eventTypeId: string; dayNumber: number;
    startTimeUtc?: string; endTimeUtc?: string; sortOrder: number;
  }[];
  const byEventType = new Map<string, EventStep[]>();
  for (const row of rows) {
    const step: EventStep = {
      id: row.id,
      eventTypeId: row.eventTypeId,
      dayNumber: Number(row.dayNumber),
      startTimeUtc: row.startTimeUtc ?? null,
      endTimeUtc: row.endTimeUtc ?? null,
      sortOrder: Number(row.sortOrder)
    };
    const forType = byEventType.get(step.eventTypeId) ?? [];
    forType.push(step);
    byEventType.set(step.eventTypeId, forType);
  }
  for (const steps of byEventType.values()) {
    steps.sort((left, right) => left.sortOrder - right.sortOrder);
  }
  return byEventType;
})();

// What to say under an event's name on a given day of it: the phase it is in, then
// any step of that day that has no time of its own.
export function phaseNameForDay(eventTypeId: string, dayOfEvent: number): string {
  const parts: string[] = [];
  const phase = (phasesByEventType.get(eventTypeId) ?? [])
    .find(one => dayOfEvent >= one.fromDay && dayOfEvent <= one.toDay);
  if (phase) parts.push(phaseName(phase.id));
  for (const step of eventStepsByEventType.get(eventTypeId) ?? []) {
    if (step.startTimeUtc || step.dayNumber !== dayOfEvent) continue;
    const label = stepLabel(step.id);
    if (!parts.includes(label)) parts.push(label);
  }
  return parts.filter(Boolean).join(' · ');
}

// The smaller second line on a bar, where the event has one ("Troop Revival").
export function eventBarSubtitle(id: string): string {
  return text['eventType.' + id + '.barSubtitle'] ?? '';
}

// What kind of event it is, shown under its name in the panels.
export function eventTypeLabel(id: string): string {
  return text['eventType.' + id + '.typeLabel'] ?? '';
}

// Where an event sits in the catalog's own order, used to keep the same week looking
// the same every time it is drawn.
export function sortOrderOf(id: string): number {
  return Number(eventTypesById.get(id)?.sortOrder) || 99;
}

// The name the game gives a particular day of an event ("Troop Revival", "Hero
// Recruitment"). It comes from the day's point sources, or from a step of that day
// that has no time of its own.
export function dayNameOf(eventTypeId: string, dayNumber: number): string {
  for (const source of pointSourcesOf(eventTypeId)) {
    if (source.dayNumber !== dayNumber) continue;
    const name = text['pointSource.' + source.id + '.dayName'];
    if (name) return name;
  }
  const step = (eventStepsByEventType.get(eventTypeId) ?? [])
    .find(one => one.dayNumber === dayNumber && !one.startTimeUtc);
  return step ? stepLabel(step.id) : '';
}

// Every event the catalog knows, in its own order.
export function sortedEventTypes(): EventType[] {
  return eventTypes.slice().sort((left, right) => sortOrderOf(left.id) - sortOrderOf(right.id));
}

// What each opening of a part is called ("Round 1", "x16"). The openings are numbered
// from one, in the order the catalog lists them.
export function windowLabel(eventTypeId: string, windowNumber: number): string {
  return text['eventType.' + eventTypeId + '.window.' + windowNumber] ?? '';
}

// ---------------------------------------------------------------------------
// Points, rules, notes and rewards
// ---------------------------------------------------------------------------

export interface PointSource {
  id: string;
  eventTypeId: string;
  dayNumber: number | null;
  // Which list it belongs to. Empty means it is a scoring row of the event itself.
  list: string;
  points: string;
  imageFile: string;
  sortOrder: number;
}

const allPointSources: PointSource[] = (pointSourceRows as Record<string, unknown>[]).map(row => ({
  id: String(row.id),
  eventTypeId: String(row.eventTypeId),
  dayNumber: row.dayNumber ? Number(row.dayNumber) : null,
  list: String(row.list ?? ''),
  points: String(row.points ?? ''),
  imageFile: String(row.imageFile ?? ''),
  sortOrder: Number(row.sortOrder ?? 0)
}));

const pointSourcesByEvent = (() => {
  const byEventType = new Map<string, PointSource[]>();
  for (const source of allPointSources) {
    const forType = byEventType.get(source.eventTypeId) ?? [];
    forType.push(source);
    byEventType.set(source.eventTypeId, forType);
  }
  for (const sources of byEventType.values()) {
    sources.sort((left, right) => left.sortOrder - right.sortOrder);
  }
  return byEventType;
})();

// Texts that can name a hero of the state's generation get it filled in for the day
// they are shown for: the first day of the event, as in the old app.
export function pointSourceTask(id: string, day = todayNumber()): string {
  return fillHeroNames(text['pointSource.' + id + '.task'] ?? '', day);
}

export function pointSourceDayName(id: string): string {
  return text['pointSource.' + id + '.dayName'] ?? '';
}

// The scoring rows of one day of an event. A row with no day number counts on every
// day. Rows that belong to a named list (rules, rewards, missions) are not scoring.
export function pointSourcesOf(eventTypeId: string): PointSource[] {
  return pointSourcesByEvent.get(eventTypeId) ?? [];
}

export function pointSourcesForDay(eventTypeId: string, dayOfEvent: number): PointSource[] {
  return (pointSourcesByEvent.get(eventTypeId) ?? [])
    .filter(source => !source.list && (!source.dayNumber || source.dayNumber === dayOfEvent));
}

export function pointSourcesInList(eventTypeId: string, list: string): PointSource[] {
  return (pointSourcesByEvent.get(eventTypeId) ?? []).filter(source => source.list === list);
}

export function eventNotes(id: string, day = todayNumber()): string {
  return fillHeroNames(text['eventType.' + id + '.notes'] ?? '', day);
}

export function eventOtherName(id: string): string {
  return text['eventType.' + id + '.otherName'] ?? '';
}

export function allianceRequirement(id: string): string {
  return text['eventType.' + id + '.allianceRequirement'] ?? '';
}

export function playerRequirement(id: string): string {
  return text['eventType.' + id + '.playerRequirement'] ?? '';
}

export function pointsTitle(id: string): string {
  return text['eventType.' + id + '.pointsTitle'] ?? '';
}

export function pointsNote(id: string, day = todayNumber()): string {
  return fillHeroNames(text['eventType.' + id + '.pointsNote'] ?? '', day);
}

export interface RewardRow {
  id: string;
  eventTypeId: string;
  list: string;
  band: string;
  section: string;
  itemId: string;
  tile: string;
  quantity: number;
  // Rows taken from guides rather than seen in the game are marked, so the page can
  // say so instead of pretending.
  source: string;
  sortOrder: number;
  // The words on the left of the row the reward sits in: a rank, a points target, a
  // stronghold. Rewards with the same words share a row.
  rowLabel: string;
  // A small line under those words (Crazy Joe: "Personal 3,000 · Alliance 300,000").
  note: string;
}

const allRewards: RewardRow[] = (rewardRows as Record<string, unknown>[]).map(row => ({
  id: String(row.id),
  eventTypeId: String(row.eventTypeId),
  list: String(row.list ?? ''),
  band: String(row.band ?? ''),
  section: String(row.section ?? ''),
  itemId: String(row.itemId ?? ''),
  tile: String(row.tile ?? ''),
  quantity: Number(row.quantity ?? 0),
  source: String(row.source ?? ''),
  sortOrder: Number(row.sortOrder ?? 0),
  rowLabel: text['reward.' + String(row.id) + '.rowLabel'] ?? '',
  note: text['reward.' + String(row.id) + '.note'] ?? ''
}));

const rewardsByEvent = (() => {
  const byEventType = new Map<string, RewardRow[]>();
  for (const row of allRewards) {
    const forType = byEventType.get(row.eventTypeId) ?? [];
    forType.push(row);
    byEventType.set(row.eventTypeId, forType);
  }
  for (const rows of byEventType.values()) {
    rows.sort((left, right) => left.sortOrder - right.sortOrder);
  }
  return byEventType;
})();

export function rewardsOf(eventTypeId: string, list?: string, band?: string): RewardRow[] {
  return (rewardsByEvent.get(eventTypeId) ?? []).filter(row =>
    (list === undefined || row.list === list) && (band === undefined || row.band === band));
}

// An item named after the generation carries today's generation, as in the old app.
export function itemName(itemId: string): string {
  const written = text['item.' + itemId + '.name'];
  if (written === undefined) {
    // A hero's shards without a written name are named after the hero.
    const shards = itemId.match(/^([a-z]+)-shards$/);
    if (shards) return shards[1].charAt(0).toUpperCase() + shards[1].slice(1) + ' Shards';
  }
  return fillGeneration(written ?? itemId, todayNumber());
}

// A short word printed across the top of a reward tile, such as a hero generation.
export function itemLabel(itemId: string): string {
  return fillGeneration(text['item.' + itemId + '.label'] ?? '', todayNumber());
}

const itemsById = new Map((itemRows as { id: string; imageFile?: string; kind?: string }[])
  .map(item => [item.id, item]));

// A hero's shards without an item of their own use the hero's shard picture.
export function itemImageFile(itemId: string): string {
  const file = itemsById.get(itemId)?.imageFile;
  if (file) return file;
  const shards = itemId.match(/^([a-z]+)-shards$/);
  return shards ? `heroes/${shards[1]}-shard.png` : '';
}

// The three fort rewards that are buffs. A buff fort is the only kind whose reward
// can be set aside for rally leads from other alliances.
export function isBuffItem(itemId: string): boolean {
  return itemsById.get(itemId)?.kind === 'buff';
}

// The reward each fortress and stronghold pays in each phase.
export interface FortReward {
  id: string;
  fort: string;
  phase: number;
  itemId: string;
  quantity: number;
  tile: string;
}

const fortRewards: FortReward[] = (fortRewardRows as Record<string, unknown>[]).map(row => ({
  id: String(row.id),
  fort: String(row.fort),
  phase: Number(row.phase),
  itemId: String(row.itemId),
  quantity: Number(row.quantity ?? 0),
  tile: String(row.tile ?? '')
}));

// A fort's reward in a phase. Given the phase's battle day, a hero shard reward is the
// one for the state's generation on that day.
export function fortRewardOf(fort: string, phase: number, battleDay?: number): FortReward | undefined {
  const written = fortRewards.find(row => row.fort === fort && row.phase === phase);
  if (!written || battleDay === undefined) return written;
  return { ...written, itemId: heroShardsOnDay(written.itemId, battleDay) };
}
