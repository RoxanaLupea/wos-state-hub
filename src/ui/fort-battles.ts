// The Fortress Battles event's battles, as the old app showed them: the forts of the
// player's alliance with their battle times, and the other forts folded under them.
import { allianceById, allianceTag } from '../data/alliances.ts';
import { fortFullName } from '../calendar/fort-season.ts';
import { clockText, shownDayOf } from '../calendar/time-mode.ts';
import { MINUTES_PER_DAY } from '../calendar/days.ts';
import { shortDayText } from './day-names.ts';
import { escapeForPage } from './escape.ts';
import { bannerStyle } from './fortress.ts';
import type { FortBattle } from '../calendar/fort-battles.ts';

export interface FortBattlesOptions {
  battleDay: number;
  phase: number;
  battles: FortBattle[];
  myAllianceIds: string[];
  // A pencil on each fort for those who may set its holder and time, and its form.
  pencilFor: (battle: FortBattle) => string;
  formFor: (battle: FortBattle) => string;
}

// One fort: when its battle starts, when its rewards run out (24 hours later), and who
// holds it.
function battleRow(battle: FortBattle, options: FortBattlesOptions): string {
  let timeText = 'Time not set';
  let rewardText = '';
  if (battle.minute !== null) {
    timeText = shortDayText(shownDayOf(battle.minute)) + ' · ' + clockText(battle.minute);
    const rewardsEnd = battle.minute + MINUTES_PER_DAY;
    rewardText = 'Rewards until ' + shortDayText(shownDayOf(rewardsEnd)) + ' ' + clockText(rewardsEnd);
  }
  const alliance = battle.allianceId ? allianceById(battle.allianceId) : undefined;
  return '<div class="fort-battle-row">' +
    `<span class="fort-battle-name">${escapeForPage(fortFullName(battle.fort))}</span>` +
    `<span class="fort-battle-text"><span>${escapeForPage(timeText)}</span>` +
    (rewardText ? `<span class="event-note">${escapeForPage(rewardText)}</span>` : '') + '</span>' +
    (alliance ? `<span class="fort-battle-holder" style="${bannerStyle(alliance)}">` +
      `<span>${escapeForPage(allianceTag(alliance.id))}</span></span>` : '') +
    options.pencilFor(battle) + '</div>' + options.formFor(battle);
}

export function fortBattlesSection(options: FortBattlesOptions): string {
  const title = `<h3>${escapeForPage(shortDayText(options.battleDay))} battles · phase ${options.phase}</h3>`;
  const row = (battle: FortBattle) => battleRow(battle, options);
  if (!options.battles.some(battle => battle.minute !== null)) {
    // With no time set yet, those who may set them get every fort to set.
    const canSet = options.battles.some(battle => options.pencilFor(battle));
    return `<section class="fort-battles">${title}<p class="event-info-line">Battle times not set yet.</p>` +
      (canSet ? `<details class="points-list"${options.battles.some(battle => options.formFor(battle)) ? ' open' : ''}>` +
        `<summary>Set the forts</summary>${options.battles.map(row).join('')}</details>` : '') +
      '</section>';
  }
  const ours = options.battles.filter(battle => battle.allianceId && options.myAllianceIds.includes(battle.allianceId));
  const others = options.battles.filter(battle => !ours.includes(battle));
  const noneText = options.myAllianceIds.length
    ? "None of your alliance's forts this phase." : 'Pick your alliance to see its forts here.';
  return `<section class="fort-battles">${title}` +
    (ours.length ? ours.map(row).join('') : `<p class="event-info-line">${escapeForPage(noneText)}</p>`) +
    (others.length
      ? `<details class="points-list"${others.some(battle => options.formFor(battle)) ? ' open' : ''}>` +
        `<summary>Other forts</summary>${others.map(row).join('')}</details>`
      : '') +
    '</section>';
}
