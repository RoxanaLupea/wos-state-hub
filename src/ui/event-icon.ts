// An event's picture, in the two shapes the app uses it: bare on a calendar bar, and
// inside a badge in the panels and lists. Both come from here so an event looks the
// same everywhere it appears.
import { eventTypeById, eventTypeColor, partOfByEventTypeId } from '../data/catalog.ts';
import { escapeForPage } from './escape.ts';
import { ICON_PATHS } from './icon-paths.ts';

// The folder the pictures live in. It is a setting rather than a fixed address, so
// the folder can be moved without changing the code.
let imageBase = '';

export function setImageBase(url: string): void {
  imageBase = url;
}

export type BadgeSize = 'large' | 'small' | 'list' | '';

// Which file holds an event's picture. Most events have none written down and are
// named after themselves. A part with no picture of its own borrows its event's.
export function eventImageFile(eventTypeId: string): string {
  const eventType = eventTypeById(eventTypeId);
  if (eventType?.imageFile) return eventType.imageFile;
  const partOf = partOfByEventTypeId.get(eventTypeId);
  if (partOf) return eventTypeById(partOf)?.imageFile ?? partOf;
  return eventTypeId;
}

// A name with a folder in front of it is counted from the repository's root, so an
// event can borrow a picture from outside the events folder.
export function imageUrl(fileName: string): string {
  if (!imageBase || !fileName) return '';
  if (fileName.includes('/')) {
    const root = imageBase.replace(/events\/?$/, '');
    return root + (root.endsWith('/') ? '' : '/') +
      fileName.split('/').map(encodeURIComponent).join('/') + '.png';
  }
  return imageBase + encodeURIComponent(fileName) + '.png';
}

// The drawn shape an event falls back on, in whatever colour it is given.
export function drawnIcon(iconName: string | undefined): string {
  return '<svg class="event-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
    ' stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    (ICON_PATHS[iconName ?? ''] ?? ICON_PATHS.star) + '</svg>';
}

// Every event asks for its picture. One whose file is not in the folder falls back to
// its drawn shape, which is how an event looks until someone adds its picture.
export function eventIcon(eventTypeId: string): string {
  const eventType = eventTypeById(eventTypeId);
  const url = imageUrl(eventImageFile(eventTypeId));
  if (!url) return drawnIcon(eventType?.icon);
  return `<img class="event-icon" src="${escapeForPage(url)}" alt=""` +
    ` data-fallback-icon="${escapeForPage(eventType?.icon ?? 'star')}">`;
}

// The icon in a fixed square, tinted with the event's colour so a drawn shape takes it.
export function eventBadge(eventTypeId: string, size: BadgeSize = ''): string {
  return `<span class="event-badge${size ? ' ' + size : ''}" ` +
    `style="color:${escapeForPage(eventTypeColor(eventTypeId))}">${eventIcon(eventTypeId)}</span>`;
}

// A picture that does not load is replaced by the event's drawn shape. Listened for
// once on the whole page, because pictures finish loading long after the page is
// drawn, and image errors do not bubble.
export function installIconFallback(): void {
  document.addEventListener('error', event => {
    const image = event.target as HTMLElement | null;
    if (!(image instanceof HTMLImageElement) || !image.classList.contains('event-icon')) return;
    const holder = document.createElement('span');
    holder.innerHTML = drawnIcon(image.dataset.fallbackIcon);
    const drawn = holder.firstElementChild;
    if (drawn) image.replaceWith(drawn);
  }, true);
}
