// A player wherever the site names one: their picture from the game and their in-game name
// (Roxanne, 27 Nov: "every spot where a user is shown to be that user, not just text").
import { escapeForPage } from './escape.ts';
import { pictureOf } from './player-profile.ts';
import './person-chip.css';

export interface PersonShown {
  name: string;
  avatar: string | null;
}

export function personChip(person: PersonShown): string {
  const name = person.name || 'A member';
  return `<span class="person-chip"><i>${pictureOf(person.avatar, name)}</i><span>${escapeForPage(name)}</span></span>`;
}
