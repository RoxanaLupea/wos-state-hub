// A newer version of the site gone live (owner, 25 Nov). While the page is in the
// background it reloads itself, so nobody sees it load; while it is on screen, a quiet
// notice at the bottom offers Reload, and it stays until it is tapped. Nothing reloads
// by itself while someone is editing. The address keeps the open page, day and event,
// so a reload lands in the same place.
import { escapeForPage } from './escape.ts';

const RELOAD_ICON = '<svg class="edit-icon" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="reload-icon-colour" x1="0" y1="0" x2="1" y2="1">' +
  '<stop offset="0" style="stop-color: var(--edit-colour)"/><stop offset="1" style="stop-color: var(--text)"/></linearGradient></defs>' +
  '<g fill="none" stroke="url(#reload-icon-colour)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
  '<path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20.5 3.5v5h-5"/></g></svg>';

const CHECK_EVERY_MINUTES = 5;

export function watchForNewVersion(isEditing: () => boolean): void {
  const ownVersion = String(import.meta.env.VITE_SITE_VERSION ?? '');
  // Only a published build has a version file to compare with.
  if (!ownVersion || import.meta.env.DEV) return;
  let isNewerLive = false;

  const showNotice = () => {
    if (document.querySelector('.new-version')) return;
    const notice = document.createElement('div');
    notice.className = 'new-version glass';
    notice.innerHTML = `<span class="new-version-words">${escapeForPage('A new version is ready')}</span>` +
      `<button type="button" class="edit-button" data-reload-site>${RELOAD_ICON}` +
      '<span><span class="words">Reload</span></span></button>';
    notice.querySelector('[data-reload-site]')?.addEventListener('click', () => window.location.reload());
    document.body.appendChild(notice);
  };

  const actOnNewer = () => {
    if (!isNewerLive) return;
    if (document.visibilityState === 'hidden' && !isEditing()) window.location.reload();
    else showNotice();
  };

  const check = async () => {
    if (isNewerLive) return actOnNewer();
    try {
      // The address changes each time, so no cache answers with the old file.
      const answer = await fetch(`${import.meta.env.BASE_URL}version.json?at=${Date.now()}`, { cache: 'no-store' });
      if (!answer.ok) return;
      const { version } = await answer.json() as { version?: string };
      if (version && version !== ownVersion) {
        isNewerLive = true;
        actOnNewer();
      }
    } catch {
      // Offline or the file is missing: the next check tries again.
    }
  };

  document.addEventListener('visibilitychange', () => { void check(); });
  window.setInterval(() => { void check(); }, CHECK_EVERY_MINUTES * 60 * 1000);
  void check();
}
