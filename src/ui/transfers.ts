// The state's own transfer window: who is being invited, how many places are left,
// and how past windows went.
import './transfers.css';
import './pages.css';
import { placesOf, type TransferCandidate, type TransferWindow } from '../data/transfers.ts';
import { furnaceCapText, generationText, type BigGroup } from '../data/transfer-rules.ts';
import { dayFromText } from '../calendar/days.ts';
import { longDayText } from './day-names.ts';
import { escapeForPage } from './escape.ts';
import type { Alliance } from '../data/alliances.ts';

const STAGE_NAMES: Record<string, string> = {
  invitation: 'Invite', open: 'Open', special: 'Special'
};
const INVITE_NAMES: Record<string, string> = {
  not_sent: 'Not sent', sent: 'Sent', pending: 'Waiting', declined: 'Declined'
};
const OUTCOME_NAMES: Record<string, string> = {
  transferred: 'Here', rejected: 'Turned down', no_answer: 'No answer'
};

export interface TransferPageOptions {
  // The date of the next transfer, known from the published groups even when no
  // window has been set up for it yet.
  date: string;
  window: TransferWindow | null;
  candidates: TransferCandidate[];
  alliances: Alliance[];
  // The group this state transfers inside on that date, when it is known.
  ourGroup: BigGroup | null;
  follows: string;
}

export interface PastTransfersOptions {
  windows: { window: TransferWindow; candidates: TransferCandidate[] }[];
  alliances: Alliance[];
}

// Power is held as a plain number and read as millions, the way the game shows it.
function powerText(power: number | null): string {
  if (power === null) return '';
  if (power >= 1000000) return (power / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (power >= 1000) return Math.round(power / 1000) + 'K';
  return String(power);
}

function allianceTag(allianceId: string, alliances: Alliance[]): string {
  const alliance = alliances.find(one => one.id === allianceId);
  return alliance ? alliance.tag : '';
}

function arrivedIn(candidates: TransferCandidate[], stage: string): number {
  return candidates.filter(one =>
    one.outcome === 'transferred' && (stage === '' || one.stage === stage)).length;
}

// One counter: how many of a stage's places are taken, with the bar under it.
function placeMeter(label: string, used: number, total: number): string {
  const share = total ? Math.min(100, Math.round((used / total) * 100)) : 0;
  return '<div class="place-meter">' +
    `<span class="place-meter-label">${escapeForPage(label)}</span>` +
    `<span class="place-meter-count"><strong>${used}</strong> / ${total}</span>` +
    `<span class="place-meter-bar"><i style="width:${share}%"></i></span></div>`;
}

function specialMeter(available: number, used: number): string {
  return '<div class="place-meter">' +
    '<span class="place-meter-label">Specials</span>' +
    `<span class="place-meter-count"><strong>${used}</strong> / ${available}</span>` +
    '<span class="place-meter-bar">' +
    Array.from({ length: Math.max(available, used) }, (_unused, index) =>
      `<b class="${index < used ? 'spent' : ''}"></b>`).join('') +
    '</span></div>';
}

function candidateRow(
  candidate: TransferCandidate, alliances: Alliance[], powerCap: number | null,
  showsStatus: boolean
): string {
  const marks = [
    candidate.isBlacklisted ? '<span class="candidate-mark blocked">Blacklisted</span>' : '',
    // Someone the state has flagged carries a mark rather than a number, with the
    // count read out for anyone using a screen reader.
    candidate.flagCount
      ? `<span class="candidate-flag" role="img" aria-label="${candidate.flagCount} flag` +
        `${candidate.flagCount === 1 ? '' : 's'}"></span>`
      : ''
  ].join('');

  const classes = ['candidate-row'];
  if (showsStatus && candidate.outcome === 'transferred') classes.push('arrived');
  if (candidate.outcome === 'rejected' || candidate.inviteStatus === 'declined') classes.push('gone');
  // Over the state's threshold, so they have to shed power or hold a special.
  const overCap = powerCap !== null && candidate.playerPower !== null &&
    candidate.playerPower > powerCap;

  return `<div class="${classes.join(' ')}">` +
    `<span class="candidate-name">${escapeForPage(candidate.inGameName)}${marks}` +
    `<small>${escapeForPage(candidate.inGameId)}</small></span>` +
    `<span class="candidate-power${overCap ? ' over-cap' : ''}">` +
    `${escapeForPage(powerText(candidate.playerPower))}</span>` +
    `<span class="candidate-fc">${escapeForPage(candidate.fcLevel)}</span>` +
    `<span class="candidate-state">${candidate.currentState ?? ''}</span>` +
    `<span class="candidate-alliance">${escapeForPage(
      allianceTag(candidate.destinationAllianceId, alliances))}</span>` +
    `<span class="candidate-stage">${escapeForPage(STAGE_NAMES[candidate.stage] ?? '')}</span>` +
    (showsStatus
      ? `<span class="candidate-status">${escapeForPage(candidate.outcome
        ? OUTCOME_NAMES[candidate.outcome] ?? ''
        : INVITE_NAMES[candidate.inviteStatus] ?? '')}</span>`
      : '') +
    '</div>';
}

function candidateHead(showsStatus: boolean): string {
  return '<div class="candidate-row candidate-head">' +
    '<span class="candidate-name">Player</span>' +
    '<span class="candidate-power">Power</span>' +
    '<span class="candidate-fc">FC</span>' +
    '<span class="candidate-state">State</span>' +
    '<span class="candidate-alliance">To</span>' +
    '<span class="candidate-stage">Stage</span>' +
    (showsStatus ? '<span class="candidate-status">Status</span>' : '') + '</div>';
}

export function nextTransferPage(options: TransferPageOptions): string {
  if (!options.date) return '';

  const window = options.window;
  const places = window ? placesOf(window.stateType) : null;
  const group = options.ourGroup;

  const head = '<section class="transfer-head glass">' +
    '<div class="transfer-when">' +
    `<strong>${escapeForPage(longDayText(dayFromText(options.date)))}</strong>` +
    (options.follows ? `<small>${escapeForPage(options.follows)}</small>` : '') +
    '</div>' +
    '<div class="transfer-facts">' +
    (group
      ? `<span class="transfer-fact"><b>${group.fromState} – ${group.toState}</b>` +
        `<small>${escapeForPage(furnaceCapText(group.furnaceCapUpgrades))} · ` +
        `${escapeForPage(generationText(group.generation))}</small></span>`
      : '') +
    (window
      ? `<span class="transfer-fact"><b>${window.stateType === 'leading' ? 'Leading' : 'Ordinary'}</b>` +
        '<small>State</small></span>'
      : '') +
    (window && window.powerCap !== null
      ? `<span class="transfer-fact"><b>${escapeForPage(powerText(window.powerCap))}</b>` +
        '<small>Power cap</small></span>'
      : '') +
    '</div>' +
    (window && places
      ? '<div class="transfer-meters">' +
        placeMeter('Invitation', arrivedIn(options.candidates, 'invitation'), places.invitation) +
        placeMeter('Open', arrivedIn(options.candidates, 'open'), places.open) +
        (window.stateType === 'leading' && !window.specialInvitesAvailable ? ''
          : specialMeter(window.specialInvitesAvailable, arrivedIn(options.candidates, 'special'))) +
        '</div>'
      : '') +
    '</section>';

  const list = options.candidates.length
    ? '<section class="candidate-list glass">' + candidateHead(true) +
      options.candidates.map(one =>
        candidateRow(one, options.alliances, window ? window.powerCap : null, true)).join('') +
      '</section>'
    : '';

  return '<div class="transfer-page">' + head + list + '</div>';
}

export function pastTransfersPage(options: PastTransfersOptions): string {
  if (!options.windows.length) {
    return '<section class="admin-section glass"><h2>Past transfers</h2>' +
      '<p class="admin-help">No closed window yet.</p></section>';
  }

  const blocks = options.windows.map(one => {
    const places = placesOf(one.window.stateType);
    const arrived = arrivedIn(one.candidates, '');
    const people = one.candidates.filter(person => person.outcome === 'transferred');

    return '<section class="past-window glass">' +
      '<div class="past-window-head">' +
      `<strong>${escapeForPage(longDayText(dayFromText(one.window.transferDate)))}</strong>` +
      `<span class="past-window-count">${arrived} of ${places.invitation + places.open}</span>` +
      '</div>' +
      (people.length
        ? '<div class="candidate-list flat arrived-list">' + candidateHead(false) +
          people.map(person =>
            candidateRow(person, options.alliances, one.window.powerCap, false)).join('') + '</div>'
        : '<p class="admin-help">Nobody arrived.</p>') +
      '</section>';
  }).join('');

  return '<div class="transfer-page">' + blocks + '</div>';
}
