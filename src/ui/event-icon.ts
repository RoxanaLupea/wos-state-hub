// An event's picture, in the two shapes the app uses it: bare on a calendar bar, and
// inside a badge in the panels and lists. Both come from here so an event looks the
// same everywhere it appears.
import { eventTypeById, eventTypeColor } from '../data/catalog.ts';
import { escapeForPage } from './escape.ts';
import { ICON_PATHS } from './icon-paths.ts';

const IMAGE_BASE = 'https://raw.githubusercontent.com/RoxanaLupea/form_assets/main/events/';

export type BadgeSize = 'large' | 'small' | 'list' | '';

// A picture file can name a folder in front of it, when an event borrows another
// picture ("items/match-stake" for Match Prediction).
function imageUrl(imageFile: string): string {
  return IMAGE_BASE + imageFile.split('/').map(encodeURIComponent).join('/') + '.png';
}

// The drawn shape an event falls back on, in whatever colour it is given.
export function drawnIcon(iconName: string | undefined): string {
  return '<svg class="event-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
    ' stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    (ICON_PATHS[iconName ?? ''] ?? ICON_PATHS.star) + '</svg>';
}

// An event with a picture in the repo uses it, and falls back to its drawn shape if
// the file is missing.
export function eventIcon(eventTypeId: string): string {
  const eventType = eventTypeById(eventTypeId);
  if (!eventType?.imageFile) return drawnIcon(eventType?.icon);
  return `<img class="event-icon" src="${escapeForPage(imageUrl(eventType.imageFile))}" alt=""` +
    ` data-fallback-icon="${escapeForPage(eventType.icon ?? 'star')}">`;
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

// The icon in a fixed square, tinted with the event's colour so a drawn shape takes it.
export function eventBadge(eventTypeId: string, size: BadgeSize = ''): string {
  return `<span class="event-badge${size ? ' ' + size : ''}" ` +
    `style="color:${escapeForPage(eventTypeColor(eventTypeId))}">${eventIcon(eventTypeId)}</span>`;
}
