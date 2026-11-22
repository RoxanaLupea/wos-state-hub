// Heroes that change with the state's hero generation, as the old app had them.
// Some rewards name a hero that changes when the state moves to the next generation:
// Fortress rewards and Hero's Mission give the heroes of 2 generations back. In point
// rows and notes, {eventsHero} and {luckyWheelHero} are replaced by that hero (from WOS
// Wiki, each hero's "Sources"), and {generation} in item names by the generation.
import { dayFromText } from '../calendar/days.ts';

const HEROES_BY_GENERATION: Record<number, { luckyWheel: string; events: string }> = {
  9: { luckyWheel: 'Fred', events: 'Xura' },
  10: { luckyWheel: 'Blanchette', events: 'Gregory' },
  11: { luckyWheel: 'Eleonora', events: 'Lloyd' },
  12: { luckyWheel: 'Karol', events: 'Ligeia' },
  13: { luckyWheel: 'Vulcanus', events: 'Gisela' },
  14: { luckyWheel: 'Elif', events: 'Dominic' },
  15: { luckyWheel: 'Estrella', events: 'Viveca' },
  16: { luckyWheel: 'Aisling', events: 'Seigel' },
  17: { luckyWheel: 'Aiden', events: 'Bertha' }
};
const REWARD_GENERATIONS_BACK = 2;

// The state's generation from each transfer date on, oldest first.
let generationSteps: { day: number; generation: number }[] = [];

export function setGenerationSteps(steps: { date: string; generation: number }[]): void {
  generationSteps = steps
    .map(step => ({ day: dayFromText(step.date), generation: step.generation }))
    .filter(step => !Number.isNaN(step.day) && Number.isFinite(step.generation))
    .sort((left, right) => left.day - right.day);
}

// The state's generation on a day: that of the last transfer date on or before the day
// (before the first date, the first one). Unknown when there are no dates.
export function generationOnDay(day: number): number | null {
  if (!generationSteps.length || Number.isNaN(day)) return null;
  let current = generationSteps[0];
  for (const step of generationSteps) {
    if (step.day <= day) current = step;
  }
  return current.generation;
}

// Puts the right hero names into a text. Without a known hero the words stay general.
export function fillHeroNames(text: string, day: number): string {
  if (!text || !text.includes('{')) return text;
  const generation = generationOnDay(day);
  const heroes = generation === null ? undefined : HEROES_BY_GENERATION[generation - REWARD_GENERATIONS_BACK];
  return text
    .replace(/\{eventsHero\}/g, heroes ? heroes.events : 'Events hero')
    .replace(/\{luckyWheelHero\}/g, heroes ? heroes.luckyWheel : 'Lucky Wheel hero');
}

// Puts the generation into an item's name ("Gen {generation} Custom Hero Widget
// Chest"). Without a known generation, the generation is left out of the name.
export function fillGeneration(text: string, day: number): string {
  if (!text || !text.includes('{generation}')) return text;
  const generation = generationOnDay(day);
  return generation === null
    ? text.replace(/Gen \{generation\} /g, '').replace(/\{generation\}/g, '')
    : text.replace(/\{generation\}/g, String(generation));
}
