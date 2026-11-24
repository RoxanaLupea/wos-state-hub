// The page behind "Sign in". Signed out, it is the sign-in page: a fixed title,
// signing in with Discord (first, because every alliance already uses it) or Google,
// and "Continue as a guest". Signed in, it is the player's own page: the account they
// are on (or the farm they opened from the photo bar), as the game shows it; before
// their first account, and from "Add account" in the menu, the way to add one.
import './pages.css';
import './forms.css';
import { escapeForPage } from './escape.ts';
import { addAccountPage, playerProfile, type AddOptions, type ProfileOptions } from './player-profile.ts';

export interface PlayerPageOptions {
  signedIn: boolean;
  stateNumber: string;
  // The account shown, or, while an account is being added, the form for it.
  profile: ProfileOptions | null;
  adding: AddOptions | null;
  // Set while the player is leaving with changes not saved.
  leavePrompt: boolean;
}

function signInPage(stateNumber: string): string {
  return `<section class="sign-in glass"><h2>${escapeForPage(stateNumber)} State Hub</h2>` +
    '<button type="button" class="primary-button sign-in-button" data-sign-in="discord">Sign in with Discord</button>' +
    '<button type="button" class="sign-in-button" data-sign-in="google">Sign in with Google</button>' +
    '<button type="button" class="guest-link" data-page="calendar">Continue as a guest</button>' +
    '<p class="form-message" data-sign-in-message></p></section>';
}

export function playerPage(options: PlayerPageOptions): string {
  if (!options.signedIn) return signInPage(options.stateNumber);
  const body = options.adding ? addAccountPage(options.adding) : options.profile ? playerProfile(options.profile) : '';
  return `<div class="player-page admin-page">${body}</div>` + (options.leavePrompt ? leavePromptHtml() : '');
}

// Asked when the player leaves the skill levels with changes not saved: Save keeps them,
// Cancel drops them. Tapping beside the question closes it and stays.
function leavePromptHtml(): string {
  return '<div class="leave-prompt" data-leave-answer="stay"><div class="leave-prompt-box glass" role="dialog" aria-modal="true">' +
    '<p class="leave-prompt-text">Save your changes before you leave?</p>' +
    '<div class="leave-prompt-actions">' +
    '<button type="button" class="ghost-button" data-leave-answer="cancel">Cancel</button>' +
    '<button type="button" class="primary-button" data-leave-answer="save">Save</button></div></div></div>';
}
