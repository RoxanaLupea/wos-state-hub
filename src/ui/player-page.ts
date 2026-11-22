// The page behind "Sign in". Signed out, it is the sign-in page: a fixed title,
// signing in with Discord (first, because every alliance already uses it) or Google,
// and "Continue as a guest". Signed in, it is the player's own page: their in-game
// name and id, their alliance, and their farms and alts.
import './pages.css';
import './forms.css';
import { escapeForPage } from './escape.ts';
import type { Alliance } from '../data/alliances.ts';
import type { SignedInPerson } from '../data/auth.ts';

export interface PlayerPageOptions {
  alliances: Alliance[];
  myAllianceId: string | null;
  person: SignedInPerson | null;
  stateNumber: string;
  // Power and troop tiers, kept on the account.
  troopsHtml: string;
}

function signInPage(stateNumber: string): string {
  return `<section class="sign-in glass"><h2>${escapeForPage(stateNumber)} State Hub</h2>` +
    '<button type="button" class="primary-button sign-in-button" data-sign-in="discord">Sign in with Discord</button>' +
    '<button type="button" class="sign-in-button" data-sign-in="google">Sign in with Google</button>' +
    '<button type="button" class="guest-link" data-page="calendar">Continue as a guest</button>' +
    '<p class="form-message" data-sign-in-message></p></section>';
}

function allianceOptions(alliances: Alliance[], chosen: string | null): string {
  const mains = alliances.filter(one => !one.mainAllianceId).sort((left, right) => left.sortOrder - right.sortOrder);
  const ordered = mains.flatMap(main => [main, ...alliances
    .filter(one => one.mainAllianceId === main.id).sort((left, right) => left.sortOrder - right.sortOrder)]);
  return '<option value="">None</option>' + ordered.map(one =>
    `<option value="${escapeForPage(one.id)}"${one.id === chosen ? ' selected' : ''}>` +
    `${escapeForPage(one.tag + ' · ' + one.name)}</option>`).join('');
}

export function playerPage(options: PlayerPageOptions): string {
  const person = options.person;
  if (!person) return signInPage(options.stateNumber);

  const account = person.account;
  const alts = person.alts.map(alt =>
    '<div class="admin-item"><div class="admin-item-text">' +
    `<span class="admin-item-title">${escapeForPage(alt.inGameName || alt.inGameId)}</span>` +
    `<span class="admin-item-meta">${escapeForPage((alt.kind === 'farm' ? 'Farm' : 'Alt') + (alt.inGameId ? ' · ' + alt.inGameId : ''))}</span>` +
    `</div><button type="button" class="danger-button small-button" data-remove-alt="${alt.id}">Remove</button></div>`).join('');

  return '<section class="admin-section glass"><h2>Your account</h2>' +
    `<p class="admin-help">Signed in as ${escapeForPage(person.loginName || 'you')}. Every list on the site shows your in-game name.</p>` +
    '<form class="edit-form" data-form="account">' +
    '<div class="form-row">' +
    `<label class="form-field"><span>In-game name</span><input class="text-input" name="inGameName" value="${escapeForPage(account?.inGameName ?? '')}"></label>` +
    `<label class="form-field"><span>In-game id</span><input class="text-input" name="inGameId" inputmode="numeric" value="${escapeForPage(account?.inGameId ?? '')}"></label>` +
    '</div>' +
    `<label class="form-field"><span>Alliance</span><select class="text-input" name="allianceId">${allianceOptions(options.alliances, account?.allianceId ?? options.myAllianceId)}</select></label>` +
    '<p class="form-message" data-form-message></p>' +
    '<div class="form-actions"><button type="submit" class="primary-button">Save</button></div></form></section>' +

    '<section class="admin-section glass"><h2>Farms and alts</h2>' +
    `<div class="admin-list">${alts || '<span class="admin-item-meta">None yet.</span>'}</div>` +
    '<form class="edit-form" data-form="alt"><div class="form-row">' +
    '<label class="form-field"><span>In-game name</span><input class="text-input" name="inGameName" required></label>' +
    '<label class="form-field"><span>In-game id</span><input class="text-input" name="inGameId" inputmode="numeric"></label>' +
    '</div><label class="form-field"><span>Kind</span><select class="text-input" name="kind">' +
    '<option value="farm">Farm</option><option value="alt">Alt</option></select></label>' +
    '<p class="form-message" data-form-message></p>' +
    '<div class="form-actions"><button type="submit" class="primary-button">Add</button></div></form></section>' +

    options.troopsHtml +
    '<section class="admin-section glass"><h2>Still to build here</h2><ul class="plan-list">' +
    '<li>Your heroes</li>' +
    '<li>Your own results and statistics</li></ul>' +
    '<div class="form-actions"><button type="button" class="danger-button small-button" data-sign-out>Sign out</button></div></section>';
}
