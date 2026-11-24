// An event's picture, in the two shapes the app uses it: bare on a calendar bar, and
// inside a badge in the panels and lists. Both come from here so an event looks the
// same everywhere it appears.
import { eventTypeById, eventTypeColor, itemImageFile, partOfByEventTypeId } from '../data/catalog.ts';
import { escapeForPage } from './escape.ts';
import { ICON_PATHS } from './icon-paths.ts';

// The pictures come from the site itself: the build makes a small WebP of every PNG in
// public/images (tools/images/make-webp.py), at no more than twice the size it is shown
// at, so pages load fast. The PNGs in the repo stay the source.
// (import.meta.env exists only in the built site, not when the tests run the code.)
const imageBase = (import.meta.env?.BASE_URL ?? './') + 'images/events/';

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
  if (!fileName) return '';
  const name = fileName.replace(/\.png$/, '');
  if (name.includes('/')) {
    const root = imageBase.replace(/events\/?$/, '');
    return root + name.split('/').map(encodeURIComponent).join('/') + '.webp';
  }
  return imageBase + encodeURIComponent(name) + '.webp';
}

// The picture of a reward item, from the file the catalog names for it. Hero shards
// live with the heroes and some items share a picture, so the item's id alone is not
// the file's name.
export function itemImageUrl(itemId: string): string {
  const file = itemImageFile(itemId);
  return file ? imageUrl(file.replace(/\.png$/, '')) : '';
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
