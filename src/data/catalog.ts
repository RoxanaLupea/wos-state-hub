// The catalog is everything the game publishes and we never change: the list of
// events, their colours, and the words for them. It lives in files rather than the
// database because it only changes when the game does.
import eventTypeRows from '../../data/catalog/event-types.json';
import englishText from '../../data/text/en.json';

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
}

const eventTypes = eventTypeRows as EventType[];
const text = englishText as Record<string, string>;

const eventTypesById = new Map<string, EventType>(
  eventTypes.map(eventType => [eventType.id, eventType])
);

export function eventTypeById(id: string): EventType | undefined {
  return eventTypesById.get(id);
}

// Falls back to the id so a missing translation shows up as an obvious oddity on the
// page rather than an empty space.
export function eventTypeName(id: string): string {
  return text['eventType.' + id + '.name'] ?? id;
}

export function eventTypeShortName(id: string): string {
  return text['eventType.' + id + '.shortName'] ?? eventTypeName(id);
}

export function eventTypeColor(id: string): string {
  return eventTypesById.get(id)?.color ?? 'var(--accent)';
}

// Some events run more than once per alliance, for example two bear traps or two
// foundry legions. This is what each one is called: "Trap", "Legion", "Session".
export function eventGroupName(id: string): string | null {
  return text['eventType.' + id + '.groupName'] ?? null;
}
