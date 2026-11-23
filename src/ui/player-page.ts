// The page behind "Sign in". Signed out, it is the sign-in page: a fixed title,
// signing in with Discord (first, because every alliance already uses it) or Google,
// and "Continue as a guest". Signed in, it is the player's own page: their in-game
// details (name, id, power, alliance and troop tiers, picked in place as on the old
// registration forms) for the game account picked in the menu under their name: their
// main or an alt. Under it, all their accounts, where more are added.
import './pages.css';
import './forms.css';
import { escapeForPage } from './escape.ts';
import type { Alliance } from '../data/alliances.ts';
import type { SignedInPerson } from '../data/auth.ts';
import type { Row } from '../data/records.ts';
import { accountViewToggle, accountsSection, partPencil, playerProfile, profileParts, sectionTitle } from './player-profile.ts';

export interface PlayerPageOptions {
  alliances: Alliance[];
  myAllianceId: string | null;
  person: SignedInPerson | null;
  stateNumber: string;
  // The person's row in accounts as saved, and with the changes not saved yet laid
  // over it; null until it is read.
  savedRow: Row | null;
  draftRow: Row | null;
  // Which parts of the page are open for editing ('info', 'troop-infantry' and so on),
  // and which of those have changes not saved yet.
  editing: ReadonlySet<string>;
  changed: ReadonlySet<string>;
  // Set while the player is leaving with changes not saved: the question to show.
  leavePrompt: boolean;
  // All the person's accounts (main, alts, farms) and the one they are on; the farm (or
  // new account) open under the row, with its changes laid over it.
  accounts: Row[];
  activeId: number | 'new';
  openListed: number | 'new' | null;
  // Whether that account is open for editing (a new one always is) or only shown.
  editingListed: boolean;
  listedDraft: Row;
  listedChanged: boolean;
  // The main and the alts shown one at a time, or side by side; null on a phone, where
  // there is only one at a time and no choice.
  accountView: 'one' | 'both' | null;
  // Set while the player is asked whether to remove an alt or a farm: its name.
  removePrompt: string | null;
}

function signInPage(stateNumber: string): string {
  return `<section class="sign-in glass"><h2>${escapeForPage(stateNumber)} State Hub</h2>` +
    '<button type="button" class="primary-button sign-in-button" data-sign-in="discord">Sign in with Discord</button>' +
    '<button type="button" class="sign-in-button" data-sign-in="google">Sign in with Google</button>' +
    '<button type="button" class="guest-link" data-page="calendar">Continue as a guest</button>' +
    '<p class="form-message" data-sign-in-message></p></section>';
}

export function playerPage(options: PlayerPageOptions): string {
  const person = options.person;
  if (!person) return signInPage(options.stateNumber);

  // The main and the alts: with more than one, a switch on a computer chooses between one
  // at a time (tapping another swaps it in) and all side by side, each with its info and
  // troops. A phone shows one at a time.
  // Side by side, only the account the player is on can have a part open; a pencil in
  // another column puts them on that account first.
  const switchable = options.accounts.filter(one => one.kind !== 'farm');
  const hasAlt = switchable.length > 1;
  const sideBySide = options.accountView === 'both' && hasAlt;
  const kindOf = (row: Row | null) => hasAlt && row ? (row.kind === 'main' ? 'Main' : 'Alt') : '';
  // The One | Both switch sits in the Player info title's left corner.
  const toggle = hasAlt && options.accountView ? accountViewToggle(options.accountView) : '';
  const activeOptions = {
    saved: options.savedRow, draft: options.draftRow, alliances: options.alliances,
    fallbackAllianceId: options.myAllianceId, editing: options.editing, changed: options.changed,
    showTroops: options.savedRow !== null, kindLabel: kindOf(options.savedRow),
    swapTo: sideBySide ? [] : switchable.filter(row => row.id !== options.activeId), viewToggle: toggle
  };
  const otherOptions = (row: Row) => ({
    saved: row, draft: row, alliances: options.alliances, fallbackAllianceId: null,
    editing: options.editing.size > 0 ? new Set(['elsewhere']) : new Set<string>(), changed: new Set<string>(), showTroops: true,
    kindLabel: kindOf(row), swapTo: [], viewToggle: ''
  });
  // Side by side: one Player info title and one Troop tiers title, each section split
  // between the accounts; each half has its own pencils.
  let accounts = '';
  if (!sideBySide) accounts = playerProfile(activeOptions);
  else {
    const halves = switchable.map(row => {
      const isActive = row.id === options.activeId;
      return { row, isActive, parts: profileParts(isActive ? activeOptions : otherOptions(row)) };
    });
    const half = (one: typeof halves[number], body: string) =>
      `<div class="split-half${one.isActive ? ' active' : ''}" data-account-column="${escapeForPage(String(one.row.id))}">${body}</div>`;
    const row = (bodies: string) => `<div class="split-row" style="--account-count: ${halves.length}">${bodies}</div>`;
    accounts = '<section class="player-section">' + sectionTitle('Player info', 'info', false, false, 'h2', toggle) +
      row(halves.map(one => half(one, `<div class="half-corner">${one.parts.corner}</div>` +
        (one.parts.infoPencil ? partPencil('info', 'Player info', one.parts.infoEditing) : '') + one.parts.info)).join('')) +
      '</section><section class="player-section"><h2 class="player-section-title">Troop tiers</h2>' +
      row(halves.map(one => half(one, one.parts.troops ?? '')).join('')) + '</section>';
  }

  return '<div class="player-page admin-page">' + accounts +
    (options.savedRow !== null ? accountsSection({
      accounts: options.accounts, activeId: options.activeId, alliances: options.alliances,
      openListed: options.openListed, editing: options.editingListed, draft: options.listedDraft, changed: options.listedChanged,
      pencil: options.editingListed || options.editing.size === 0
    }) : '') +

    '<section class="player-section"><h2 class="player-section-title">Still to build here</h2><ul class="plan-list">' +
    '<li>Your heroes</li>' +
    '<li>Your own results and statistics</li></ul></section></div>' +
    (options.leavePrompt ? leavePromptHtml() : '') +
    (options.removePrompt ? removePromptHtml(options.removePrompt) : '');
}

// Asked when the player leaves a part (or the page) with changes not saved: Save keeps
// them, Cancel drops them. Tapping beside the question closes it and stays.
// Removing an alt or a farm asks first, in the same box as leaving with changes.
function removePromptHtml(name: string): string {
  return '<div class="leave-prompt" data-remove-answer="cancel"><div class="leave-prompt-box glass" role="dialog" aria-modal="true">' +
    `<p class="leave-prompt-text">Remove ${escapeForPage(name)}?</p>` +
    '<div class="leave-prompt-actions">' +
    '<button type="button" class="ghost-button" data-remove-answer="cancel">Cancel</button>' +
    '<button type="button" class="danger-button" data-remove-answer="remove">Remove</button></div></div></div>';
}

function leavePromptHtml(): string {
  return '<div class="leave-prompt" data-leave-answer="stay"><div class="leave-prompt-box glass" role="dialog" aria-modal="true">' +
    '<p class="leave-prompt-text">Save your changes before you leave?</p>' +
    '<div class="leave-prompt-actions">' +
    '<button type="button" class="ghost-button" data-leave-answer="cancel">Cancel</button>' +
    '<button type="button" class="primary-button" data-leave-answer="save">Save</button></div></div></div>';
}
