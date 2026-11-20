// The player's own page: the in-game data events and rosters read from them.
//
// Until signing in exists, the one thing here that works is picking which alliance is
// yours. Everything in the app that depends on that — the alliance bars, the times in
// the day panel, the alliance pages — comes alive once it is set.
import './pages.css';
import { escapeForPage } from './escape.ts';
import type { Alliance } from '../data/alliances.ts';

export interface PlayerPageOptions {
  alliances: Alliance[];
  myAllianceId: string | null;
}

export function playerPage(options: PlayerPageOptions): string {
  const mains = options.alliances
    .filter(alliance => !alliance.mainAllianceId)
    .sort((left, right) => left.sortOrder - right.sortOrder);

  const choices = mains.map(main => {
    const academies = options.alliances
      .filter(alliance => alliance.mainAllianceId === main.id)
      .sort((left, right) => left.sortOrder - right.sortOrder);
    return [main, ...academies];
  }).flat();

  const buttons = choices.map(alliance =>
    `<button type="button" class="chip" aria-pressed="${alliance.id === options.myAllianceId}"` +
    ` data-my-alliance="${escapeForPage(alliance.id)}">` +
    `${escapeForPage(alliance.tag)}</button>`).join('');

  return '<section class="admin-section glass"><h2>Player</h2>' +
    '<p class="admin-help">Signing in is not built yet, so nothing here is saved. ' +
    'Picking your alliance does work, and the rest of the app follows it.</p>' +
    '<div class="alliance-block"><span class="alliance-name">My alliance</span>' +
    `<div class="chips">${buttons || '<span class="admin-item-meta">No alliances yet.</span>'}</div>` +
    (options.myAllianceId
      ? ''
      : '<span class="admin-item-meta">With none picked, no alliance times show anywhere.</span>') +
    '</div></section>' +
    '<section class="admin-section glass"><h2>Still to build</h2>' +
    '<ul class="plan-list">' +
    '<li>Your in-game name and id, and your farms and alts</li>' +
    '<li>Your player power and your foundry power, with a prompt when they go stale</li>' +
    '<li>Your troop tiers and skill levels</li>' +
    '<li>Which slots you actually play: bear 1 or 2, which legion, another alliance\'s time</li>' +
    '</ul></section>';
}
