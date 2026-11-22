// Alliance Showdown's total score, as the old app drew it: the alliance against its
// opponent, the Victory Points each day is worth, and who won each day. The winners
// come from the alliance's recorded results; until a run is recorded the days show a
// dash where the winner goes.
import { allianceTag } from '../data/alliances.ts';
import { dayNameOf, itemImageFile, rewardsOf } from '../data/catalog.ts';
import { escapeForPage } from './escape.ts';
import { imageUrl } from './event-icon.ts';

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

// One alliance's recorded run: the opponent, and each day's winner and MVP.
export interface ShowdownScore {
  opponentState: string;
  opponentAlliance: string;
  // Per day, in order: 'us', 'them', 'tie' or '' while not recorded.
  winners: string[];
  mvps: string[];
}

export interface ShowdownScoreOptions {
  eventTypeId: string;
  stateNumber: string;
  // The player's alliance. Without one there is no side to show.
  allianceId: string | null;
  score: ShowdownScore | null;
  // The day of the run it is today (1 to 6), or 0 when the run is not on.
  todayInRun: number;
}

function horn(): string {
  const file = itemImageFile('showdown-win-horn');
  const url = file ? imageUrl(file.replace(/\.png$/, '')) : '';
  return url
    ? `<img class="win-horn" src="${escapeForPage(url)}" alt="" aria-hidden="true">`
    : '<span class="horn-fallback">&#9670;</span>';
}

export function showdownScoreSection(options: ShowdownScoreOptions): string {
  // The Victory Points each day is worth, one row per day.
  const days = rewardsOf(options.eventTypeId, 'horns');
  if (!days.length || !options.allianceId) return '';
  const score = options.score ?? { opponentState: '', opponentAlliance: '', winners: [], mvps: [] };

  let ours = 0;
  let theirs = 0;
  for (const day of days) {
    const winner = score.winners[Number(day.band) - 1];
    if (winner === 'us') ours += day.quantity;
    if (winner === 'them') theirs += day.quantity;
  }
  const ourTag = allianceTag(options.allianceId);
  const theirTag = score.opponentAlliance;

  const head = '<div class="score-head">' +
    `<div class="score-side us"><b>${escapeForPage(ourTag)}</b><span>#${escapeForPage(options.stateNumber)}</span></div>` +
    `<div class="score-total">${horn()}<span class="us">${ours}</span><span class="dash">–</span>` +
    `<span class="them">${theirs}</span>${horn()}</div>` +
    `<div class="score-side them"><b>${escapeForPage(theirTag || '—')}</b>` +
    `<span>${escapeForPage(score.opponentState ? '#' + score.opponentState : '')}</span></div></div>`;

  const rows = days.map(day => {
    const dayNumber = Number(day.band);
    const winner = score.winners[dayNumber - 1] ?? '';
    const mvp = score.mvps[dayNumber - 1] ?? '';
    const winnerText = winner === 'us' ? ourTag : winner === 'them' ? theirTag || 'Opponent'
      : winner === 'tie' ? 'Tie' : '—';
    return `<tr${dayNumber === options.todayInRun ? ' class="today"' : ''}>` +
      `<td class="stage">${ROMAN_NUMERALS[dayNumber - 1] ?? dayNumber}</td>` +
      `<td>${escapeForPage(dayNameOf(options.eventTypeId, dayNumber) || 'Day ' + dayNumber)}` +
      (mvp ? `<span class="score-mvp">MVP · ${escapeForPage(mvp)}</span>` : '') + '</td>' +
      `<td class="num">${day.quantity}</td><td class="win-${winner || 'none'}">${escapeForPage(winnerText)}</td></tr>`;
  }).join('');

  return '<section class="showdown-score">' + head +
    `<table class="score-table"><tr><th>Stage</th><th>Matches</th><th class="num">${horn()}</th><th>Alliance</th></tr>` +
    rows + '</table></section>';
}
