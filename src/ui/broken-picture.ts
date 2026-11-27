// A player's picture that fails to load shows the game's logo under a dark veil with the
// torn-picture sign, so it is clear the picture did not load (Roxanne, 27 Nov). A player
// with no picture yet keeps the first letter of their name (pictureOf).
import { escapeForPage } from './escape.ts';

const LOGO = (import.meta.env?.BASE_URL ?? './') + 'images/wos-logo.webp';
const TORN_PICTURE = '<svg viewBox="0 0 24 24" class="pic-torn" fill="none" stroke="currentColor" stroke-width="1.7"' +
  ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M3 5a2 2 0 0 1 2-2h9l-2 5 3 3-2 4 2 6H5a2 2 0 0 1-2-2z"/>' +
  '<path d="M17 3h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-1l-2-6 2-4-3-3 1.5-3"/>' +
  '<circle cx="8" cy="8" r="1.5"/><path d="M3 16l4-4 3 3"/></svg>';

// Pictures that already failed, so the next drawing shows the logo straight away.
const failedPictures = new Set<string>();

export function brokenPicture(): string {
  return `<span class="pic-broken" title="The picture did not load"><img src="${LOGO}" alt="">` +
    `<span class="pic-veil">${TORN_PICTURE}</span></span>`;
}

// A player's picture from the game, or the logo when that picture failed before.
export function playerPictureMarkup(address: string): string {
  if (failedPictures.has(address)) return brokenPicture();
  return `<img src="${escapeForPage(address)}" alt="" data-player-picture>`;
}

// Once, when the site starts: a player's picture that fails is swapped for the logo.
export function watchBrokenPictures(): void {
  document.addEventListener('error', event => {
    const picture = event.target;
    if (!(picture instanceof HTMLImageElement) || !picture.hasAttribute('data-player-picture')) return;
    failedPictures.add(picture.getAttribute('src') ?? '');
    const holder = document.createElement('template');
    holder.innerHTML = brokenPicture();
    picture.replaceWith(holder.content);
  }, true);
}
