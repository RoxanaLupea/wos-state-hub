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
  sortOrder?: number;
  // A second colour the bar fades from, when the game gives the event one.
  timelineColor?: string;
  // The stretches a part is open, counted from the first day of its own event.
  openWindows?: { fromDay: number; fromTime: string; toDay: number; toTime: string }[];
  // How an opening is marked on the bar: by its label, or only where it ends.
  windowMark?: string;
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

// Some events run more than once per alliance: two bear traps, two foundry legions.
// This is what one of them is called — "Trap", "Legion", "Session".
export function eventGroupName(id: string): string | null {
  return text['eventType.' + id + '.groupName'] ?? null;
}

export function phaseName(phaseId: string): string {
  return text['eventPhase.' + phaseId + '.name'] ?? '';
}

export function eventTypeColor(id: string): string {
  return eventTypesById.get(id)?.color ?? '#7E8AA8';
}

// A bar fades from the event's colour to its second one, left to right. Events with
// only one colour fade from it to itself, which reads as flat.
export function eventTypeColorEnd(id: string): string {
  const eventType = eventTypesById.get(id);
  return eventType?.colorEnd ?? eventType?.color ?? '#7E8AA8';
}

export function isDetailsOnly(id: string): boolean {
  return eventTypesById.get(id)?.detailsOnly === 'yes';
}

// Which bigger event each one is a part of, so a part follows its parent's moves.
export const partOfByEventTypeId = new Map<string, string | null>(
  eventTypes.map(eventType => [eventType.id, eventType.partOf ?? null])
);

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

export function pointSourceTask(id: string): string {
  return text['pointSource.' + id + '.task'] ?? '';
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

export function eventNotes(id: string): string {
  return text['eventType.' + id + '.notes'] ?? '';
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

export function pointsNote(id: string): string {
  return text['eventType.' + id + '.pointsNote'] ?? '';
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
  sortOrder: Number(row.sortOrder ?? 0)
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

export function itemName(itemId: string): string {
  return text['item.' + itemId + '.name'] ?? itemId;
}

// A short word printed across the top of a reward tile, such as a hero generation.
export function itemLabel(itemId: string): string {
  return text['item.' + itemId + '.label'] ?? '';
}

const itemsById = new Map((itemRows as { id: string; imageFile?: string; kind?: string }[])
  .map(item => [item.id, item]));

export function itemImageFile(itemId: string): string {
  return itemsById.get(itemId)?.imageFile ?? '';
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

export function fortRewardOf(fort: string, phase: number): FortReward | undefined {
  return fortRewards.find(row => row.fort === fort && row.phase === phase);
}
