// An event's own page: what opens when a bar is tapped.
//
// The head says what it is and when. Under it the whole run is drawn as one timeline,
// and beside that an info view with the notes, the rules, the points and the rewards.
// The button in the head swaps between the two.

import './event-panel.css';
import {
  allianceRequirement, eventNotes, eventOtherName, eventTypeById, eventTypeColor, eventTypeColorEnd, eventTypeName, hasLogoColors, logoColors,
  eventTypeLabel, itemImageFile, itemLabel, itemName, phaseName, playerRequirement,
  pointSourceDayName, pointSourceTask, pointSourcesForDay, pointSourcesInList, pointsNote,
  pointsTitle, rewardsOf, type PointSource, type RewardRow
, listTitle, seasonOf, buildingsOf, buildingName, buildingDescription, buildingBonusName, membersRewardsTitle
} from '../data/catalog.ts';
import { clockText, nowMinute, shownDayOf } from '../calendar/time-mode.ts';
import { spanText } from '../calendar/spans.ts';
import { shortDayText } from './day-names.ts';
import { escapeForPage } from './escape.ts';
import { rewardAmount } from './reward-amount.ts';
import { eventBadge, eventIcon, imageUrl } from './event-icon.ts';
import { MINUTES_PER_DAY } from '../calendar/days.ts';
import { barFadeColors } from './bar.ts';
import {
  EXPERT_CHEST_HOSTS, NUMBERED_REWARD_LISTS, rewardBandName, rewardListName,
  rewardListsOf, rewardSectionName, rewardSideName
} from './reward-names.ts';
import { colorWithAlpha, hexToHsl, hslToHex, mixColors, darkerFirst } from './colors.ts';
import { tintedPanelStyle } from './next-up.ts';
import { PIN_ICON } from './edit-forms.ts';
import type { EventTree } from '../calendar/event-tree.ts';
import type { Occurrence } from '../calendar/occurrences.ts';

const BACK_ARROW = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
  ' stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M15 18l-6-6 6-6"/></svg>';

// The way out of an event's page. On a phone, Back closes the panel (a computer has no
// Back: the panel is always there). When the event was opened from a day's timeline, a
// quiet link goes back to that day, on both.
export function backLinks(backToDay: number | null): string {
  const close = `<button type="button" class="day-back" data-close-day>${BACK_ARROW}Back</button>`;
  const toDay = backToDay === null ? '' :
    `<button type="button" class="back-to-day" data-back-to-day>${BACK_ARROW}` +
    `${escapeForPage(shortDayText(backToDay))}</button>`;
  return `<div class="panel-backs">${close}${toDay}</div>`;
}

// A colour taken from somewhere along a bar's fade, used to paint the timeline so it
// matches the bar the player tapped.
function fadeColorAt(eventTypeId: string, position: number): string {
  const at = Math.min(1, Math.max(0, position));
  // An event with its logo's colours runs from dark to light down the timeline, the
  // same way as its bar runs left to right.
  if (hasLogoColors(eventTypeId)) {
    const [darker, lighter] = darkerFirst(logoColors(eventTypeId).light, logoColors(eventTypeId).dark);
    return mixColors(darker, lighter, at);
  }
  const fade = barFadeColors(eventTypeId);
  const from = at <= 0.4 ? fade.dark : fade.middle;
  const to = at <= 0.4 ? fade.middle : fade.light;
  const share = at <= 0.4 ? at / 0.4 : (at - 0.4) / 0.6;
  return mixColors(from, to, share);
}

// A timeline's line in tones as soft as State of Power's (owner, 25 Nov: the line was
// "too intense, follow the svs example"): never more saturated than those, never darker
// or brighter.
function softLineColor(hex: string): string {
  const { hue, saturation, lightness } = hexToHsl(hex);
  return hslToHex(hue, Math.min(saturation, 0.55), Math.min(0.7, Math.max(0.58, lightness)));
}

function fadePiece(eventTypeId: string, from: number, to: number): string {
  return `linear-gradient(${fadeColorAt(eventTypeId, from)},${fadeColorAt(eventTypeId, to)})`;
}

// A note written as "Title: body", or as several lines, each of which may be labelled.
function noteRow(written: string, imageFile: string): string {
  const titled = written.match(/^([^:\n]{1,40}):\s*([\s\S]*)$/);
  const title = titled ? titled[1] : '';
  const body = titled ? titled[2] : written;
  const lines = body.split('\n').filter(line => line.trim());

  const bodyHtml = lines.map(line => {
    const labelled = lines.length > 1 && line.match(/^(Disabled|Enabled):\s*(.*)$/);
    if (labelled) {
      return `<span class="note-line note-${labelled[1].toLowerCase()}">` +
        `<b>${escapeForPage(labelled[1])}</b><span>${escapeForPage(labelled[2])}</span></span>`;
    }
    const requirement = lines.length > 1 && line.match(/^(Alliance|Player):\s*(.*)$/);
    if (requirement) {
      return `<span class="note-line"><b>${escapeForPage(requirement[1])}:</b> ` +
        `${escapeForPage(requirement[2])}</span>`;
    }
    return `<span class="note-line">${escapeForPage(line)}</span>`;
  }).join('');

  const url = imageFile ? imageUrl(imageFile.replace(/\.png$/, '')) : '';
  const picture = url
    ? `<img class="note-picture" src="${escapeForPage(url)}" alt="" loading="lazy">` : '';

  if (!title) {
    return `<p class="points-note${picture ? ' with-picture' : ''}">${picture}${bodyHtml}</p>`;
  }
  // A row with a picture always keeps its title on its own line, like the others beside it.
  const isShort = !picture && lines.length <= 1 && body.length <= 40;
  return `<p class="points-note${isShort ? '' : ' titled'}${picture ? ' with-picture' : ''}">` +
    `${picture}<b class="note-title">${escapeForPage(title)}${isShort ? ':' : ''}</b>` +
    `${isShort ? ' ' : ''}${bodyHtml}</p>`;
}

function pointRows(eventTypeId: string, sources: PointSource[]): string {
  return (pointsNote(eventTypeId, heroDay)
    ? `<p class="points-note">${escapeForPage(pointsNote(eventTypeId, heroDay))}</p>` : '') +
    sources.map(source => {
      const task = pointSourceTask(source.id, heroDay);
      if (!source.points) return noteRow(task, source.imageFile);
      return `<div class="points-row"><span>${escapeForPage(task)}</span>` +
        `<span class="points-value">${escapeForPage(source.points)}</span></div>`;
    }).join('');
}

function pointsList(eventTypeId: string, sources: PointSource[], isOpen: boolean): string {
  if (!sources.length && !pointsNote(eventTypeId, heroDay)) return '';
  const scoringRows = sources.filter(source => source.points).length;
  const title = pointsTitle(eventTypeId) || ('Points' + (scoringRows ? ` (${scoringRows})` : ''));
  return `<details class="points-list"${isOpen ? ' open' : ''}>` +
    `<summary>${escapeForPage(title)}</summary>${pointRows(eventTypeId, sources)}</details>`;
}

// A fold of plain notes from one named list.
function notesFold(eventTypeId: string, list: string, title: string, hidesTitle = false): string {
  // A rewards note written for one list or band shows with that list, under its
  // buttons, as in the game; only the notes for all the rewards stay on top.
  const notes = pointSourcesInList(eventTypeId, list)
    .filter(source => list !== 'rewards' || !pointSourceDayName(source.id));
  if (!notes.length) return '';
  // A tab that already names the list draws its fold without the title (Fishing).
  return `<details class="points-list${hidesTitle ? ' no-title' : ''}" open><summary>${escapeForPage(title)}</summary>` +
    notes.map(source => noteRow(pointSourceTask(source.id, heroDay), source.imageFile)).join('') +
    '</details>';
}

const TILE_COLORS = ['grey', 'green', 'blue', 'purple', 'orange'];

// Items the game shows without a picture of their own, drawn here instead.
const DRAWN_ITEM_PICTURES: Record<string, string> = {
  'mystery-pack': '<svg class="drawn-picture" viewBox="0 0 64 64" aria-hidden="true">' +
    '<defs><linearGradient id="questionGold" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#FFE45C"/><stop offset="1" stop-color="#F2A92A"/></linearGradient></defs>' +
    '<text x="33.5" y="57" text-anchor="middle" font-family="Arial Black, Arial, sans-serif"' +
    ' font-weight="900" font-size="60" fill="#3A2200" opacity="0.55">?</text>' +
    '<text x="32" y="55" text-anchor="middle" font-family="Arial Black, Arial, sans-serif"' +
    ' font-weight="900" font-size="60" fill="url(#questionGold)" stroke="#7A460E"' +
    ' stroke-width="4" paint-order="stroke">?</text></svg>'
};

// The number a row is sorted by in a ladder list, taken from the first number in its
// item's name ("300,000 points" sorts before "1,000,000 points").
function firstNumberIn(written: string): number {
  const match = String(written ?? '').replace(/,/g, '').match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function rewardTile(row: RewardRow): string {
  const file = itemImageFile(row.itemId);
  const url = file ? imageUrl(file.replace(/\.png$/, '')) : '';
  const drawn = !url ? DRAWN_ITEM_PICTURES[row.itemId] ?? '' : '';
  const tile = TILE_COLORS.includes(row.tile) ? row.tile : 'none';
  const label = itemLabel(row.itemId);
  const name = itemName(row.itemId);
  const title = name + (row.quantity ? ' ×' + row.quantity : '');
  return `<span class="reward-tile tile-${tile}${url || drawn ? '' : ' no-picture'}"` +
    ` title="${escapeForPage(title)}">` +
    (url ? `<img src="${escapeForPage(url)}" alt="" loading="lazy">` : drawn) +
    (label ? `<span class="tile-top">${escapeForPage(label)}</span>` : '') +
    // Secured items carry the shield in the corner, as they do in the game.
    (/Secured/.test(name)
      ? `<img class="tile-secured" src="${escapeForPage(imageUrl('items/secured'))}" alt="">` : '') +
    (row.quantity ? `<span class="tile-qty">${escapeForPage(rewardAmount(row.quantity))}</span>` : '') +
    '</span>';
}

// The chests a day of an event unlocks, opened from that day's row in the timeline.
export function dayChests(eventTypeId: string, dayNumber: number): string {
  const chests = rewardsOf(eventTypeId, 'chests', String(dayNumber));
  if (!chests.length) return '';

  let html = '<div class="reward-sub">Daily Chests</div>' +
    `<div class="reward-flat">${chests.map(rewardTile).join('')}</div>`;

  const extra = rewardsOf(eventTypeId, 'expert');
  const host = EXPERT_CHEST_HOSTS[eventTypeId];
  if (extra.length) {
    const url = host ? imageUrl(host.imageFile) : '';
    html += '<div class="reward-sub with-picture">' +
      (url ? `<img src="${escapeForPage(url)}" alt="">` : '') +
      `${escapeForPage(host ? host.name : 'Expert')}</div>` +
      `<div class="reward-flat">${extra.map(rewardTile).join('')}</div>`;
  }
  if (chests.some(row => row.source === 'guides')) {
    html += '<p class="reward-source">From guides, not checked in game yet.</p>';
  }
  return `<div class="day-chests">${html}</div>`;
}

// The missions of an event and what each pays, with a tab per kind when it has more
// than one.
function missionsFold(eventTypeId: string, state: RewardViewState): string {
  const notes = pointSourcesInList(eventTypeId, 'missions');
  const rows = rewardsOf(eventTypeId, 'missions');
  if (!notes.length && !rows.length) return '';

  const bands: string[] = [];
  for (const row of rows) if (!bands.includes(row.band)) bands.push(row.band);
  const chosen = state.openBand.get(eventTypeId + '|missions');
  const band = chosen && bands.includes(chosen) ? chosen : bands[0] ?? '';

  let html = '<details class="points-list rewards-fold" open><summary>Missions</summary>' +
    notes.map(source => noteRow(pointSourceTask(source.id, heroDay), source.imageFile)).join('');

  if (bands.length > 1) {
    html += `<div class="info-tabs rank-tabs" role="tablist" style="--tab-color:${escapeForPage(eventTypeColor(eventTypeId))}">` +
      bands.map(one =>
        `<button type="button" class="info-tab" role="tab" aria-selected="${one === band}"` +
        ` data-reward-band="${escapeForPage(eventTypeId + '|missions|' + one)}">` +
        `${escapeForPage(rewardBandName(one))}</button>`).join('') + '</div>';
  }

  const shown = band ? rows.filter(row => row.band === band) : rows;
  if (shown.every(row => row.rowLabel)) {
    const order: string[] = [];
    const byMission = new Map<string, RewardRow[]>();
    for (const row of shown) {
      if (!byMission.has(row.rowLabel)) { byMission.set(row.rowLabel, []); order.push(row.rowLabel); }
      byMission.get(row.rowLabel)?.push(row);
    }
    html += '<div class="mission-list">' + order.map(name =>
      `<div class="mission-row"><span class="mission-name">${escapeForPage(name)}</span>` +
      `<span class="reward-items">${(byMission.get(name) ?? []).map(rewardTile).join('')}</span></div>`).join('') +
      '</div>';
  } else {
    html += `<div class="reward-flat">${shown.map(rewardTile).join('')}</div>`;
  }
  if (shown.some(row => row.source === 'guides')) {
    html += '<p class="reward-source">From guides, not checked in game yet.</p>';
  }
  return html + '</details>';
}

// Rewards, grouped the way the catalog holds them: one tab per list, one band of a
// list at a time, and inside that a row of tiles per section.
export interface RewardViewState {
  // Which list is open, by event type.
  openList: Map<string, string>;
  // Which band is open, by event type and list.
  openBand: Map<string, string>;
  // The player's own alliance's band, by event type and list (its Showdown Star
  // Rating, its Winter Siege and Championship tiers), shown first.
  ownBand: Map<string, string>;
}

// Rewards that share their left words (a rank, a points target, a stronghold) make one
// row of tiles, with those words on the left and the first reward's note small under
// them, each part of the note on its own line.
const STAR_PICTURE = '<svg class="note-star" viewBox="0 0 24 24" aria-label="star">' +
  '<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/></svg>';

// Tundra Arms League's combatant rewards (Roxanne, 27 Nov: "Legion members / WIN / LOSS", "do the
// win loss thing i said"): the legion's members get one line for a win and one for a loss; the
// combatants' rewards by points ranges sit under Win and Loss tabs.
function combatantRewards(shown: RewardRow[], side: string, sideButtons: string): string {
  const members = shown.filter(row => row.section === 'win' || row.section === 'lose')
    .map(row => ({ ...row, rowLabel: row.section === 'win' ? 'Win' : 'Loss' }));
  const ranges = shown.filter(row => row.section === (side ? 'personal-' + side : 'personal-win'));
  const ownTitle = membersRewardsTitle(shown[0]?.eventTypeId ?? '');
  return (members.length
    ? (ownTitle ? `<div class="reward-sub">${escapeForPage(ownTitle)}</div>` : sectionHeading('combatant', 'win')) +
      withRankBadges(`<div class="range-lines">${rewardLines(members)}</div>`) : '') +
    (ranges.length
      ? sectionHeading('combatant', 'personal-win') + sideButtons +
        withRankBadges(`<div class="range-lines combatant-ranges">${rewardLines(ranges)}</div>`) : '');
}

// Every ranking list (Roxanne, 27 Nov: "see how the rankings are centered in game ... And I like
// the 1, 2, 3 badges"; yes to every event's ranking lists): ranks 1, 2 and 3 drawn as the game's
// badges, every rank centred in its column.
function withRankBadges(body: string, extraClass = '', medals = true): string {
  // A medal never stands alone (Roxanne, 27 Nov: "it doesn't make sense to use it alone if 2-3 are
  // numbers"): when rank 2 has no row of its own, the ranks stay numbers.
  const rankTwoAlone = /<span class="reward-label">2(?=<small|<\/span>)/.test(body);
  const drawn = !medals || !rankTwoAlone ? body : body.replace(/<span class="reward-label">([123])(?=<small|<\/span>)/g, (_whole, rank: string) =>
    `<span class="reward-label"><img class="rank-badge" src="${escapeForPage(imageUrl('ranks/rank-' + rank))}" alt="${rank}">`);
  return `<div class="ranking-badges${extraClass ? ' ' + extraClass : ''}">${drawn}</div>`;
}

// The most rewards a phone fits on one line.
const REWARDS_PER_PHONE_LINE = 6;

function rewardLines(rows: RewardRow[]): string {
  const order: string[] = [];
  const byLabel = new Map<string, RewardRow[]>();
  for (const row of rows) {
    if (!byLabel.has(row.rowLabel)) { byLabel.set(row.rowLabel, []); order.push(row.rowLabel); }
    byLabel.get(row.rowLabel)?.push(row);
  }
  // The rewards every rank gets, so the top ranks' extra rewards can go on a line above them
  // (Roxanne, 27 Nov: "first row the skins and mithril and the rest on the 2nd row, like the
  // rest of the lines").
  // The practice for every list whose rows run over one line (Roxanne, 27 Nov: "keep it as a
  // practice for other rewards that overflow"), when the shared rewards make a line of their own.
  const everyRank = Array.from(new Set(rows.map(row => row.itemId)))
    .filter(itemId => order.every(label => (byLabel.get(label) ?? []).some(row => row.itemId === itemId)));
  const extrasOnOwnLine = order.length > 1 && everyRank.length > 1 &&
    order.some(label => (byLabel.get(label) ?? []).length > REWARDS_PER_PHONE_LINE);
  return order.map(label => {
    const inRow = byLabel.get(label) ?? [];
    const extras = inRow.filter(row => !everyRank.includes(row.itemId));
    const shared = inRow.filter(row => everyRank.includes(row.itemId));
    // A row with no extras of its own that still runs over a line (Fishing's 7, Showdown's daily 8)
    // splits into two even lines, the shorter first, so no line is left with a single reward.
    const half = Math.floor(inRow.length / 2);
    // An event whose rewards split by colour (Foundry): every member's rewards break before the
    // first blue tile, a combatant's before the first tile that is not gold.
    const byTile = eventTypeById(inRow[0]?.eventTypeId ?? '')?.rewardLinesByTile;
    const tileBreak = !byTile ? -1 : inRow.findIndex(row =>
      row.section.startsWith('personal') ? row.tile !== 'orange' : row.tile === 'blue');
    const tiles = tileBreak > 0
      ? inRow.slice(0, tileBreak).map(rewardTile).join('') + '<span class="reward-break"></span>' + inRow.slice(tileBreak).map(rewardTile).join('')
      : extrasOnOwnLine && extras.length && shared.length
      ? extras.map(rewardTile).join('') + '<span class="reward-break"></span>' + shared.map(rewardTile).join('')
      : inRow.length > REWARDS_PER_PHONE_LINE
        ? inRow.slice(0, half).map(rewardTile).join('') + '<span class="reward-break"></span>' + inRow.slice(half).map(rewardTile).join('')
        : inRow.map(rewardTile).join('');
    const note = inRow[0]?.note ?? '';
    // A star in a note ("+2 ★", Alliance Championship's Star Rating) is drawn as the
    // game's star (Roxanne, 27 Nov: "we're gonna put 1 star there and be done with it").
    const noteHtml = note
      ? note.split(' · ').map(part => `<small>${escapeForPage(part).replace(' ★', STAR_PICTURE)}</small>`).join('') : '';
    // Points written short like the amounts (Roxanne, 27 Nov: "numbers can be written smarter",
    // "000 and 999 give us no value", "bigger or equal with 20K, smaller than 42 ... one on one row,
    // the other one on the next"): "20,000–41,999" reads "≥20K" over "<42K", "180,000+" reads
    // "≥180K". Ranks, written without commas, stay as they are.
    const points = (text: string) => {
      const value = Number(text.replace(/,/g, ''));
      return rewardAmount((value + 1) % 1000 === 0 ? value + 1 : value);
    };
    const range = label.match(/^(\d{1,3}(?:,\d{3})+)[–-](\d{1,3}(?:,\d{3})+)$/);
    const from = label.match(/^(\d{1,3}(?:,\d{3})+)\+$/);
    const labelHtml = range ? escapeForPage('≥' + points(range[1])) + '<br>' + escapeForPage('<' + points(range[2]))
      : from ? escapeForPage('≥' + points(from[1]))
      // A rank range stays on one line: no break after its dash ("17–32", not "17–" over "32").
      // A word and its number stay together ("Own 10", "Chapter 10"), like the ranks: a list whose
      // labels then do not fit is written smaller as a whole (fitRewardLabels).
      : escapeForPage(label.replace(/\d{1,3}(?:,\d{3})+/g, points).replace(/–/g, '–\u2060').replace(/ (?=\d)/g, '\u00a0'));
    return `<div class="reward-row"><span class="reward-label">${labelHtml}${noteHtml}</span>` +
      `<span class="reward-items">${tiles}</span></div>`;
  }).join('');
}

// A Prestige reward: a big square in the game's own tile colour with its name under it
// (Roxanne, 27 Nov: "2x2, even if that means they're much bigger"). How long it lasts
// ("(14d)", "(14-Day)") is a label on the reward, not part of its name.
function prestigeReward(row: RewardRow): string {
  const full = itemName(row.itemId);
  const days = full.match(/\s*\((\d+)(?:d|-Day)\)\s*$/i);
  const name = days ? full.slice(0, days.index) : full;
  const tile = rewardTile(row);
  const labelled = days
    ? tile.replace(/<\/span>$/, `<span class="tile-top">${days[1]} days</span></span>`) : tile;
  return `<div class="prestige-reward">${labelled}` +
    `<span class="prestige-name">${escapeForPage(name)}</span></div>`;
}

// A Champion's Glory reward as the game draws it: the picture and its name inside a tall ice
// frame, the champion's frame with a castle top, the top 4's with a rounded one (Roxanne, 27 Nov:
// "They will be the tall ... backgrounds for those rewards, and try to use them as they are in
// game"; the frames are hers, public/images/frames).
const GLORY_FRAMES: Record<string, string> = {
  champion: 'frames/tal-champion-alliance-glory', top4: 'frames/tal-top-4-alliance-glory'
};
function gloryCard(row: RewardRow, section: string): string {
  const file = itemImageFile(row.itemId);
  const picture = file ? imageUrl(file.replace(/\.png$/, '')) : '';
  const frame = imageUrl(GLORY_FRAMES[section] ?? GLORY_FRAMES.top4);
  return `<div class="glory-card ${escapeForPage(section)}" style="background-image:url('${escapeForPage(frame)}')">` +
    (picture ? `<img src="${escapeForPage(picture)}" alt="" loading="lazy">` : '') +
    `<span class="glory-card-name">${escapeForPage(itemName(row.itemId))}</span></div>`;
}

function sectionsOf(rows: RewardRow[]): string[] {
  const sections: string[] = [];
  for (const row of rows) if (!sections.includes(row.section)) sections.push(row.section);
  return sections;
}

function sectionHeading(list: string, section: string): string {
  const heading = rewardSectionName(list, section);
  return heading ? `<div class="reward-sub">${escapeForPage(heading)}</div>` : '';
}

// What an event's shop is paid with.
const SHOP_CURRENCIES: Record<string, string> = {
  'winter-siege': 'winter-badge', 'flame-and-fang': 'crystallite-core',
  'emporium-of-enigma': 'thorn-of-enigma'
};
// Shops of one event paid with different currencies (Tundra Arms League: Match Stakes in the
// Ordinary Shop, Champion Stakes in the Champion Shop).
const SHOP_BAND_CURRENCIES: Record<string, string> = {
  'hellfire|Ordinary Shop': 'match-stake', 'hellfire|Champion Shop': 'champion-stake'
};

// The list itself, laid out the way the game lays out that kind of list, as the old
// app did.
function rewardListHtml(list: string, band: string, bandCount: number, shown: RewardRow[],
    eventTypeId: string, listNoteHtml = '', tierTabsHtml = ''): string {
  if (list === 'glory') {
    // The big rewards under the game's own name for who wins them, centred (Roxanne, 27 Nov: "the
    // 1 and 2-4 are too vague and should stand at the top with the rewards centered", "why are you
    // cutting out the names they have already?").
    return '<div class="glory-ranks">' + sectionsOf(shown).map(section =>
      `<div class="glory-rank"><span class="glory-rank-name">${escapeForPage(rewardSectionName(list, section))}</span>` +
      `<div class="glory-grid">${shown.filter(row => row.section === section).map(row => gloryCard(row, section)).join('')}</div></div>`)
      .join('') + '</div>';
  }
  if (list === 'combatant') {
    return combatantRewards(shown, '', '');
  }
  if (list === 'targets' || list === 'medals' || list === 'ko') {
    // A row per points target, medal count, chapter, level or KO round.
    const hasNotes = shown.some(row => row.note);
    return (list === 'targets' && band && bandCount === 1
      ? `<div class="reward-sub">${escapeForPage(band)}</div>` : '') +
      (list === 'ko'
        // KO1, KO2 and Defeat centred like the ranks above them (Roxanne, 27 Nov: "do the same for KO1").
        ? withRankBadges(`<div class="range-lines${hasNotes ? ' with-notes' : ''} group-ranking">${rewardLines(shown)}</div>`)
        : `<div class="range-lines${hasNotes ? ' with-notes' : ''}">${rewardLines(shown)}</div>`);
  }
  if (list === 'group') {
    // Alliance Championship (Roxanne, 27 Nov): the tiers are tabs, the alliance's own open
    // first; under the open tier its Prestige Rewards when it has them (big squares, a quiet
    // note) and its group ranks, each with the stars it gains or loses and its rewards.
    const prestige = shown.filter(row => row.section === 'prestige');
    return (tierTabsHtml ?? '') +
      (prestige.length
        ? '<div class="reward-sub">Prestige Rewards</div>' +
          (listNoteHtml ? listNoteHtml : '') +
          '<div class="prestige-grid">' + prestige.map(prestigeReward).join('') + '</div>' +
          '<div class="reward-sub">Group Ranking</div>'
        : '') +
      withRankBadges('<div class="range-lines with-notes group-ranking">' +
        rewardLines(shown.filter(row => row.section !== 'prestige')) + '</div>');
  }
  if (list === 'club') {
    // Fishing's Ice Fishing Club (mockup, Roxanne 27 Nov): drawn like the game, three
    // tracks side by side, each in its own band under its medal: free, then silver (one
    // pack), then gold (the second pack, two rewards a level). No lines between levels.
    const medal = (name: string) =>
      `<img src="${escapeForPage(imageUrl('items/fishing-mockup/medal-' + name))}" alt="">`;
    const levels: string[] = [];
    const byLevel = new Map<string, RewardRow[]>();
    for (const row of shown) {
      if (!byLevel.has(row.rowLabel)) { byLevel.set(row.rowLabel, []); levels.push(row.rowLabel); }
      byLevel.get(row.rowLabel)?.push(row);
    }
    return '<div class="club-grid">' +
      '<span class="club-level"></span>' +
      `<span class="club-cell free head">${medal('bronze')}</span>` +
      `<span class="club-cell silver head">${medal('silver')}</span>` +
      `<span class="club-cell gold head">${medal('gold')}</span>` +
      levels.map(level => {
        const tiles = (byLevel.get(level) ?? []).map(rewardTile);
        return `<span class="club-level">${escapeForPage(level)}</span>` +
          `<span class="club-cell free">${tiles[0] ?? ''}</span>` +
          `<span class="club-cell silver">${tiles[1] ?? ''}</span>` +
          `<span class="club-cell gold">${tiles.slice(2).join('')}</span>`;
      }).join('') + '</div>';
  }
  if (list === 'rates') {
    // Lucky Wheel: a row per reward, its chance, then the item with its name.
    return '<div class="rate-lines">' + shown.map(row =>
      `<div class="reward-row"><span class="reward-label">${escapeForPage(row.rowLabel)}</span>` +
      `<span class="reward-items">${rewardTile(row)}<span class="rate-name">` +
      `${escapeForPage(itemName(row.itemId) + (row.quantity ? ' ×' + row.quantity : ''))}</span></span></div>`)
      .join('') + '</div>';
  }
  if (list === 'ranking' || list === 'conquest') {
    // Ranks of three digits ("101–150") get a wider column, so they stay on one line.
    const hasWideLabels = shown.some(row => /\d{3}/.test(row.rowLabel));
    const body = sectionsOf(shown).map(section =>
      sectionHeading(list, section) + rewardLines(shown.filter(row => row.section === section))).join('');
    // Winter Siege's strongholds are numbered, not ranked: no medals there.
    return withRankBadges(body, hasWideLabels ? 'wide-labels' : '', list === 'ranking');
  }
  if (list === 'star' || list === 'daily') {
    // Win and Loss or draw on the left, like a rank (Roxanne, 27 Nov).
    const sided = shown.filter(row => row.section === 'win' || row.section === 'lose')
      .map(row => ({ ...row, rowLabel: rewardSideName(list, row.section) }));
    const others = shown.filter(row => row.section !== 'win' && row.section !== 'lose');
    return (sided.length ? withRankBadges(`<div class="range-lines">${rewardLines(sided)}</div>`, '', false) : '') +
      (others.length ? `<div class="reward-flat">${others.map(rewardTile).join('')}</div>` : '');
  }
  if (list === 'tier') {
    // Win Streak, Victory and Loss, each with how the tier changes.
    return '<div class="tier-rows">' + ['streak', 'win', 'lose'].map(section => {
      const inSection = shown.filter(row => row.section === section);
      if (!inSection.length) return '';
      return `<div class="reward-row"><span class="reward-label">${escapeForPage(rewardSectionName(list, section))}` +
        `<small>Tier ${escapeForPage(inSection[0].rowLabel.replace('-', '−'))}</small></span>` +
        `<span class="reward-items">${inSection.map(rewardTile).join('')}</span></div>`;
    }).join('') + '</div>';
  }
  if (list === 'merchant' || list === 'shop') {
    // Each offer: the item, its price in the shop's currency and how many can be bought.
    const currency = list === 'merchant' ? 'winter-badge'
      : SHOP_BAND_CURRENCIES[eventTypeId + '|' + band] ?? SHOP_CURRENCIES[eventTypeId] ?? '';
    const currencyFile = currency ? itemImageFile(currency) : '';
    const currencyUrl = currencyFile ? imageUrl(currencyFile.replace(/\.png$/, '')) : '';
    // Each offer is a card drawn like the game's shop cards, in the event's colours: the item,
    // its limit, and the price on a light bar at the bottom (Roxanne, 27 Nov: "we'll use these
    // to design the shops to keep the familiarity ... a graphical element that is drawn based
    // on event").
    const shopStyle = `--shop-a:${eventTypeColor(eventTypeId)};--shop-b:${eventTypeColorEnd(eventTypeId)}`;
    return `<div class="shop-grid" style="${escapeForPage(shopStyle)}">` + shown.map(row =>
      '<div class="shop-card">' + SHOP_CAP +
      `<span class="shop-item">${rewardTile(row)}</span>` +
      (row.note ? `<span class="shop-limit">${escapeForPage(row.note.replace(/^Limit\s*/, 'Limit: '))}</span>` : '') +
      '<span class="shop-price">' +
      (currencyUrl ? `<img src="${escapeForPage(currencyUrl)}" alt="${escapeForPage(itemName(currency))}">` : '') +
      `${escapeForPage(row.rowLabel)}</span></div>`).join('') +
      '</div>';
  }
  // Any other list: a row per left words where the rewards have them, else one grid.
  return sectionsOf(shown).map(section => {
    const inSection = shown.filter(row => row.section === section);
    return sectionHeading(list, section) + (inSection.some(row => row.rowLabel)
      ? rewardLines(inSection) : `<div class="reward-flat">${inSection.map(rewardTile).join('')}</div>`);
  }).join('');
}

// The snow on top of a shop card, as the game draws it: thicker at the corners, with a drip
// near each, thin in the middle.
const SHOP_CAP = '<svg class="shop-cap" viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true">' +
  '<path d="M0 0H100V7.5C97.5 7.5 97 11.5 94.5 11.5C92 11.5 92 6.2 88 5.4C72 4 28 4 12 5.4C8 6.2 8 11.5 5.5 11.5C3 11.5 2.5 7.5 0 7.5Z"/></svg>';

// An event's merchant or shop is a tab of its own, apart from its rewards (Roxanne, 27 Nov:
// "merchant has to be separate from rewards because many events have one").
const MERCHANT_LISTS = ['merchant', 'shop'];

function rewardsFold(eventTypeId: string, state: RewardViewState, merchant = false): string {
  const all = rewardsOf(eventTypeId);
  if (!all.length) return '';

  const present: string[] = [];
  for (const row of all) if (!present.includes(row.list)) present.push(row.list);
  // Missions and the daily chests have folds of their own.
  const lists = rewardListsOf(eventTypeId, present.filter(one => one !== 'missions' && one !== 'chests' && one !== 'expert' &&
    MERCHANT_LISTS.includes(one) === merchant));
  if (!lists.length) return '';
  const chosenList = state.openList.get(eventTypeId);
  const list = chosenList && lists.includes(chosenList) ? chosenList : lists[0];

  const rows = rewardsOf(eventTypeId, list);
  const bands: string[] = [];
  for (const row of rows) if (row.band && !bands.includes(row.band)) bands.push(row.band);
  const chosenBand = state.openBand.get(eventTypeId + '|' + list);
  const ownBand = state.ownBand.get(eventTypeId + '|' + list);
  const band = chosenBand && bands.includes(chosenBand) ? chosenBand
    : ownBand && bands.includes(ownBand) ? ownBand : bands[0] ?? '';
  let shown = band ? rows.filter(row => row.band === band) : rows;
  // A ladder (points targets, medal counts) runs from the smallest number in its left
  // words, as in the game.
  if (NUMBERED_REWARD_LISTS.includes(list)) {
    shown = shown.slice().sort((left, right) => firstNumberIn(left.rowLabel) - firstNumberIn(right.rowLabel));
  }

  let html = `<details class="points-list rewards-fold" open><summary>${merchant ? 'Shop' : 'Rewards'}</summary>`;
  // Every list one after another, each under its own heading, its tiers or bands as tabs
  // (Alliance Championship's look, for every event, Roxanne 27 Nov).
  if (lists.length) {
    // Tundra Arms League: each list on a tab of its own (Roxanne, 27 Nov: "championship glory
    // seems like something that could stand on it's own, so maybe more tabs inside rewards").
    const listTabs = Boolean(eventTypeById(eventTypeId)?.rewardListTabs) && lists.length > 1;
    if (listTabs) {
      html += `<div class="info-tabs rank-tabs list-tabs" role="tablist" style="--tab-color:${escapeForPage(eventTypeColor(eventTypeId))}">` +
        lists.map(one =>
          `<button type="button" class="info-tab" role="tab" aria-selected="${one === list}"` +
          ` data-reward-list="${escapeForPage(eventTypeId + '|' + one)}">` +
          `${escapeForPage(rewardListName(eventTypeId, one))}</button>`).join('') + '</div>';
    }
    for (const one of listTabs ? [list] : lists) {
      const oneRows = rewardsOf(eventTypeId, one);
      const oneBands: string[] = [];
      for (const row of oneRows) if (row.band && !oneBands.includes(row.band)) oneBands.push(row.band);
      // The alliance's own tier opens first; the other tiers stay one tap away.
      const chosenOne = state.openBand.get(eventTypeId + '|' + one);
      const ownOne = state.ownBand.get(eventTypeId + '|' + one);
      const oneBand = chosenOne && oneBands.includes(chosenOne) ? chosenOne
        : ownOne && oneBands.includes(ownOne) ? ownOne : oneBands[0] ?? '';
      const oneShown = oneBand ? oneRows.filter(row => row.band === oneBand) : oneRows;
      // The tiers are tabs like the event's own tabs (Roxanne, 27 Nov).
      const bandButtons = oneBands.length > 1
        ? `<div class="info-tabs rank-tabs${listTabs ? ' sub-tabs' : ''}" role="tablist" style="--tab-color:${escapeForPage(eventTypeColor(eventTypeId))}">` +
          oneBands.map(item =>
            `<button type="button" class="info-tab" role="tab" aria-selected="${item === oneBand}"` +
            ` data-reward-band="${escapeForPage(eventTypeId + '|' + one + '|' + item)}">` +
            `${escapeForPage(rewardBandName(item))}</button>`).join('') + '</div>'
        : '';
      // Rewards that depend on winning or losing are tabs, one or the other (Roxanne, 27 Nov:
      // "if we have rewards separated by if, if it's a win or a rank or a tier, we will show
      // them in tabs").
      const sideOf = (row: RewardRow) => row.section.replace(/^personal-/, '');
      // Every list split into winning and losing (Showdown's Daily, Star and Ranking, Tundra Arms
      // League's Combatant); Winter Siege's tiers stay rows, each a result of its own.
      // Lists without ranks (Showdown's Daily and Star) write Win and Loss on the left instead
      // (Roxanne, 27 Nov: "WIN and LOSS can be on the left for those cases").
      const sides = !['tier', 'star', 'daily'].includes(one)
        ? ['win', 'lose'].filter(side => oneShown.some(row => sideOf(row) === side)) : [];
      const chosenSide = state.openBand.get(eventTypeId + '|' + one + '-side');
      const side = sides.length > 1 ? (chosenSide && sides.includes(chosenSide) ? chosenSide : sides[0]) : '';
      const sideButtons = side
        ? `<div class="info-tabs rank-tabs sub-tabs" role="tablist" style="--tab-color:${escapeForPage(eventTypeColor(eventTypeId))}">` +
          sides.map(item =>
            `<button type="button" class="info-tab" role="tab" aria-selected="${item === side}"` +
            ` data-reward-band="${escapeForPage(eventTypeId + '|' + one + '-side|' + item)}">` +
            `${escapeForPage(rewardSideName(one, item))}</button>`).join('') + '</div>'
        : '';
      // Under a side's tab its rows lose their heading: the tab already says it.
      const sideShown = side
        ? oneShown.filter(row => sideOf(row) === side).map(row => ({ ...row, section: '' })) : oneShown;
      const note = pointSourcesInList(eventTypeId, 'rewards').find(source => {
        const where = pointSourceDayName(source.id);
        return where === one + '|' + oneBand || (!oneBand && where === one);
      });
      const noteHtml = note
        ? `<p class="points-note reward-note">${escapeForPage(pointSourceTask(note.id, heroDay))}</p>` : '';
      html += one === 'group'
        ? `<div class="reward-sub">${escapeForPage(rewardListName(eventTypeId, one))}</div>` +
          rewardListHtml(one, oneBand, 1, oneShown, eventTypeId, noteHtml, bandButtons)
        : (lists.length > 1 && !listTabs ? `<div class="reward-sub">${escapeForPage(rewardListName(eventTypeId, one))}</div>` : '') +
          bandButtons + noteHtml + (one === 'combatant'
            ? combatantRewards(oneShown, side, sideButtons)
            : sideButtons + rewardListHtml(one, oneBand, oneBands.length, sideShown, eventTypeId));
    }
    return html + '</details>';
  }
  if (lists.length > 1) {
    html += `<div class="reward-tabs" style="grid-template-columns:repeat(${lists.length},1fr)">` +
      lists.map(one =>
        `<button type="button" class="reward-tab${one === list ? ' on' : ''}"` +
        ` data-reward-list="${escapeForPage(eventTypeId + '|' + one)}">` +
        `${escapeForPage(rewardListName(eventTypeId, one))}</button>`).join('') +
      '</div>';
  }
  if (bands.length > 1) {
    const hasLongNames = bands.some(one => one.length > 8);
    html += `<div class="reward-bands${hasLongNames ? ' long-names' : ''}">` +
      bands.map(one =>
        `<button type="button" class="reward-band${one === band ? ' on' : ''}"` +
        ` data-reward-band="${escapeForPage(eventTypeId + '|' + list + '|' + one)}">` +
        `${escapeForPage(rewardBandName(one))}</button>`).join('') + '</div>';
  }

  // The note written for this list, and band, of this event's rewards.
  const listNote = pointSourcesInList(eventTypeId, 'rewards').find(source => {
    const where = pointSourceDayName(source.id);
    return where === list + '|' + band || (!band && where === list);
  });
  const listNoteHtml = listNote
    ? `<p class="points-note reward-note">${escapeForPage(pointSourceTask(listNote.id, heroDay))}</p>` : '';
  // Alliance Championship's tier list places its note under its Prestige Rewards heading.
  if (list !== 'group') html += listNoteHtml;

  html += rewardListHtml(list, band, bands.length, shown, eventTypeId, list === 'group' ? listNoteHtml : '');

  if (shown.some(row => row.source === 'guides')) {
    html += '<p class="reward-source">From guides, not checked in game yet.</p>';
  }
  return html + '</details>';
}

// A plan's words (Flame and Fangs): as short as the alliance's own message, with the game's
// pictures in place of words and their details on hover (Roxanne, 27 Nov night: "this cannot be
// more wordy than the discord message, we are adding all the icons we need ... use the hover").
// {agnes} is Agnes, {core} a Crystallite Core, **x** a warning.
// The details show in the site's tip (the Invites one): on hover on a computer, on a tap on a phone.
const PLAN_PICTURES: Record<string, { file: string; title: string; tip?: [string, string] }> = {
  agnes: { file: 'experts/agnes', title: 'Agnes',
    tip: ['Efficient Recon', 'Execute All, and 8 extra Intel missions a day. Refreshes at 00:00 UTC.'] },
  core: { file: 'items/crystallite-core', title: 'Crystallite Core' }
};
function planWords(written: string): string {
  const picture = (name: string) => {
    const known = PLAN_PICTURES[name];
    if (!known) return '';
    const image = `<img class="plan-icon" src="${escapeForPage(imageUrl(known.file))}" alt="${escapeForPage(known.title)}">`;
    return known.tip
      ? `<span class="plan-tip" tabindex="0">${image}<span class="tip"><b>${escapeForPage(known.tip[0])}</b>` +
        `${escapeForPage(known.tip[1])}</span></span>`
      : image;
  };
  return escapeForPage(written)
    .replace(/\{(\w+)\}/g, (_all, name: string) => picture(name))
    // The warnings stand out in bold white (Don't claim; Don't use Agnes' skill before 08:00 on
    // Sunday); nothing else is bold (Roxanne, 27 Nov night: "we should add a don't touch agnes maybe
    // before 8utc in bold, then agnes at 8utc stays normal").
    .replace(/\*\*(.+?)\*\*/g, '<b class="plan-warning">$1</b>');
}

// The most a plan's phase brings, right after the phase's name (Roxanne, 27 Nov night: "after the
// preparation or event ... we put the 3 dots increasing in size, and then the core, and then the
// number"; "just 3 discrete dots"): three small growing dots in the event's colours, the game's
// picture, the amount; how it adds up on hover.
function planGainOf(eventTypeId: string, phaseLabel: string): string {
  const gain = phaseLabel ? eventTypeById(eventTypeId)?.planGains?.[phaseLabel] : undefined;
  if (!gain) return '';
  const core = PLAN_PICTURES.core;
  const colors = `--gain-from:${eventTypeColor(eventTypeId)};--gain-to:${eventTypeColorEnd(eventTypeId)}`;
  return `<span class="plan-gain" style="${escapeForPage(colors)}" title="${escapeForPage(gain[1])}">` +
    '<i class="small"></i><i class="bigger"></i><i class="biggest"></i>' +
    `<img class="plan-icon" src="${escapeForPage(imageUrl(core.file))}" alt="${escapeForPage(core.title)}">${gain[0]}</span>`;
}

// The whole run as one timeline.
// The rows whose points the player opened, so they stay open when the page is drawn
// again (a table arriving, a tab, another row picked).
let openPointRows = new Set<string>();
export function setOpenPointRows(rows: Set<string>): void {
  openPointRows = rows;
}

// The alliance's plan on the timeline's first row (Roxanne, 27 Nov): the R4s' button at
// the row's right, and the plan under the row's name as a banner.
export interface FirstRowPlan {
  button: string;
  banner: string;
}

export function renderEventTree(tree: EventTree, firstRow?: FirstRowPlan): string {
  let rows = tree.rows;
  const side = tree.side;
  // A shop that stays open after the event (Flame and Fangs, Roxanne 27 Nov night: "the shop being
  // available for an extra day, we show that with a dotted line"): the event's end is a step with
  // no name, and a dotted line runs on to the shop's close.
  const shopDays = eventTypeById(rows[0]?.eventTypeId ?? '')?.shopDaysAfter ?? 0;
  let dottedFrom = -1;
  const last = rows[rows.length - 1];
  if (shopDays && last?.isEndRow) {
    rows = rows.slice(0, -1).concat(
      { ...last, isEndRow: false, level: 1, label: '' },
      { ...last, minute: last.minute + shopDays * MINUTES_PER_DAY, key: (last.key ?? '') + '|shop' });
    dottedFrom = rows.length - 2;
  }
  // Where a plan's event starts after its preparation (Flame and Fangs); everything else starts with it.
  const planEventStart = rows.length && eventTypeById(rows[0].eventTypeId)?.instructionSteps
    ? rows[0].occurrence.startMinute : -Infinity;

  // Each part that opens and closes gets a narrow column of its own, always two wide
  // so the rows line up whether there is one part or two.
  const openingColumns = tree.openingSides.map(part => {
    const spans = (part.openings ?? []).map(opening => {
      // A ticket opening at the same moment as a row of the event starts on the first row at
      // that moment, where its time is written, so tickets that open together start level
      // (Roxanne, 27 Nov: "the match predictions and champion predictions start at the same
      // time ... only the end is different"; "the 0 is at elimination ... it has to start at
      // elimination").
      let from = rows.findIndex(row => !row.isSideRow && row.minute === opening.start);
      if (from === -1) {
        from = rows.findIndex(row =>
          row.openingPartKey === part.occurrence.key && row.openingStart === opening.start);
      }
      let to = rows.findIndex(row =>
        row.openingPartKey === part.occurrence.key && row.openingEnd === opening.end);
      if (to === -1) to = rows.findIndex((row, index) => index > from && row.minute >= opening.end);
      if (to === -1) to = rows.length - 1;
      return { from, to };
    }).filter(span => span.from !== -1);
    return { part, spans };
  });

  // A step whose row a ticket line starts on writes its line under the name (Match Predictions)
  // with a touch of the ticket's colour, so it reads as that line's (Roxanne, 27 Nov: "make the
  // purple a little more purple so we can tell it's for the purple line").
  const detailColorAt = new Map<number, string>();
  for (const column of openingColumns) {
    // A named ticket (Champion Prediction xN) has its own words; only the other one's are the step's.
    if (eventTypeById(column.part.occurrence.eventTypeId)?.windowMark === 'label') continue;
    for (const span of column.spans) {
      // The step written under a row at the moment the ticket opens (ROUND 1's Match Predictions).
      const minute = rows[span.from]?.minute;
      rows.forEach((row, index) => {
        if (index >= span.from && row.minute === minute && !row.isSideRow && row.detail) {
          const colors = logoColors(column.part.occurrence.eventTypeId);
          detailColorAt.set(index, `color-mix(in srgb, ${colors.light} 50%, ${colors.dark})`);
        }
      });
    }
  }

  // Left to right: Champion Prediction, Match Prediction, then the event's line (Roxanne,
  // 27 Nov: "the order should be championship tickets then elimination then the event line").
  // A single ticket line sits next to the event's line.
  const columnsLeftToRight = openingColumns.length === 1
    ? [undefined, openingColumns[0]] : openingColumns.slice().reverse();
  const openingCells = (index: number) => [0, 1].map(column => {
    const column0 = columnsLeftToRight[column];
    if (!column0) return '<span class="tree-side"></span>';
    const span = column0.spans.find(one => index >= one.from && index <= one.to);
    const state = !span ? '' : index === span.from ? 'start' : index === span.to ? 'end' : 'middle';
    if (!span) return '<span class="tree-side"></span>';
    // The line fades from the ticket's darker colour where it opens, marked by a small
    // circle, to its lighter colour where it closes.
    const partTypeId = column0.part.occurrence.eventTypeId;
    const [darker, lighter] = darkerFirst(logoColors(partTypeId).light, logoColors(partTypeId).dark);
    const length = Math.max(1, span.to - span.from);
    const colorAt = (rowPlace: number) =>
      mixColors(darker, lighter, Math.min(1, Math.max(0, (rowPlace - span.from) / length)));
    const topHalf = `linear-gradient(${colorAt(index - 0.5)},${colorAt(index)})`;
    const bottomHalf = `linear-gradient(${colorAt(index)},${colorAt(index + 0.5)})`;
    return `<span class="tree-side ${state}" style="--side-top:${topHalf};--side-bottom:${bottomHalf}">` +
      (state === 'start'
        ? `<span class="tree-side-logo" title="${escapeForPage(eventTypeName(partTypeId))}">` +
          `${eventIcon(partTypeId)}</span>` +
          `<span class="tree-side-start" style="background:${darker}"></span>` : '') +
      (state === 'end' ? `<span class="tree-cap" style="background:${lighter}"></span>` : '') +
      '</span>';
  }).join('');

  const lastIndex = Math.max(1, rows.length - 1);
  // The line starts a little past the deepest shade, so the first dot still shows.
  const lineAt = (index: number) => 0.2 + 0.8 * Math.min(1, Math.max(0, index / lastIndex));

  const sideStartIndex = side ? rows.findIndex(row => row.minute >= side.occurrence.startMinute) : -1;
  // The side line ends on its own end row, or on the row at the same moment when it has none.
  const sideEndIndex = !side ? -1 : rows.some(row => row.isSideEnd)
    ? rows.findIndex(row => row.isSideEnd)
    : rows.findIndex(row => !row.isSideRow && row.minute >= side.occurrence.endMinute);
  const sideSpan = Math.max(1, sideEndIndex - sideStartIndex);
  const sideAt = (index: number) => (index - sideStartIndex) / sideSpan;
  const sideStepIndex = side ? rows.findIndex(row => row.isSideStep) : -1;
  const isDashedBelow = (index: number) => sideStepIndex !== -1 && index >= sideStepIndex;
  const sideStateAt = (index: number) => {
    if (!side || index < sideStartIndex || index > sideEndIndex) return '';
    return index === sideStartIndex ? 'start' : index === sideEndIndex ? 'end' : 'middle';
  };

  const mainEventTypeId = rows.length ? rows[0].eventTypeId : '';

  // A whole event whose parts have their own line colour (State of Power): each row
  // takes the colour of the part it is in, and the line blends from one part's colour
  // into the next between their rows. The other events fade along their bar's colours.
  const lineColorOf = (index: number): string => {
    for (let place = Math.min(index, rows.length - 1); place >= 0; place--) {
      const color = eventTypeById(rows[place].eventTypeId)?.lineColor;
      if (color) return color;
    }
    return '';
  };
  const hasPartColors = rows.some(row => Boolean(eventTypeById(row.eventTypeId)?.lineColor));
  const partColorAt = (place: number): string => {
    const at = Math.min(rows.length - 1, Math.max(0, place));
    const above = Math.floor(at), below = Math.ceil(at);
    return above === below ? lineColorOf(above) : mixColors(lineColorOf(above), lineColorOf(below), at - above);
  };
  // A plan's event (Flame and Fangs) is drawn in the event's own colours, the same as its calendar
  // (Roxanne, 27 Nov night: "the timeline is not in the event colors").
  const isPlan = Boolean(eventTypeById(mainEventTypeId)?.instructionSteps);
  const planStartIndex = isPlan ? Math.max(0, rows.findIndex(row => row.minute >= planEventStart)) : 0;
  const planColorAt = (place: number): string => mixColors(eventTypeColor(mainEventTypeId), eventTypeColorEnd(mainEventTypeId),
    Math.min(1, Math.max(0, (place - planStartIndex) / Math.max(1, lastIndex - planStartIndex))));
  const lineColorAt = (place: number): string =>
    hasPartColors ? partColorAt(place) : isPlan ? planColorAt(place)
      : softLineColor(fadeColorAt(mainEventTypeId, lineAt(place)));
  const linePiece = (from: number, to: number): string => `linear-gradient(${lineColorAt(from)},${lineColorAt(to)})`;

  // An event played at set times each day (Wild Brawl): the line is quiet, and lit in
  // the event's light colour from where a window opens to where it closes. Nothing here
  // is dimmed (dimming is only for the line in the day's panel); while the event runs,
  // the open window, or else the next one, stands out.
  const isPlayTimeline = rows.some(row => row.playOpensUntil !== undefined);
  const now = nowMinute();
  const playLight = isPlayTimeline ? logoColors(mainEventTypeId).light : '';
  const isRunning = rows.length > 0 && now >= rows[0].minute && now < rows[rows.length - 1].minute;
  const nowWindowStart = isRunning
    ? rows.find(row => row.playOpensUntil !== undefined && row.playOpensUntil > now)?.minute : undefined;
  // The window a row belongs to, by where it opens: its own row, or the row above a close.
  const windowOf = (index: number) => {
    const row = rows[index];
    if (!row) return null;
    if (row.playOpensUntil !== undefined) return { start: row.minute, end: row.playOpensUntil };
    const above = rows[index - 1];
    if (row.isPlayClose && above?.playOpensUntil !== undefined) return { start: above.minute, end: above.playOpensUntil };
    return null;
  };
  const playStateOf = (index: number) => {
    const window = windowOf(index);
    if (!window) return '';
    return window.start === nowWindowStart ? 'now' : 'open';
  };
  const quietLine = 'linear-gradient(rgba(255,255,255,0.14),rgba(255,255,255,0.14))';
  const litLine = () => `linear-gradient(${playLight},${playLight})`;

  const body = rows.map((row, index) => {
    // Lit between a window's opening row and its closing row.
    const isLitBelow = isPlayTimeline && row.playOpensUntil !== undefined;
    const isLitAbove = isPlayTimeline && Boolean(row.isPlayClose);
    const playState = playStateOf(index);
    // The shop's extra day and a plan's preparation have no line: dots run between their points
    // instead, laid out once the page is drawn (layOutTimelineDots). The preparation's grow, small,
    // bigger, then the big dot where something is done (Roxanne, 27 Nov night: "each of the big dots
    // should mark the point where we do something"); the shop's are even.
    const dotted = (_from: number) => 'transparent';
    const faded = () => 'transparent';
    const isPrepAbove = index > 0 && rows[index - 1].minute < planEventStart;
    const isPrepBelow = row.minute < planEventStart;
    const lineAbove = dottedFrom >= 0 && index > dottedFrom ? dotted(index - 0.5)
      : isPrepAbove ? faded()
      : !isPlayTimeline ? linePiece(index - 0.5, index)
      : isLitAbove ? litLine() : quietLine;
    const lineBelow = dottedFrom >= 0 && index >= dottedFrom ? dotted(index)
      : isPrepBelow ? faded()
      : !isPlayTimeline ? linePiece(index, index + 0.5)
      : isLitBelow ? litLine() : quietLine;
    const dotColor = row.minute < planEventStart ? eventTypeColorEnd(row.eventTypeId)
      : isPlayTimeline ? (playState ? playLight : 'rgba(255,255,255,0.35)')
      : row.isSideRow ? fadeColorAt(row.eventTypeId, lineAt(index)) : lineColorAt(index);
    const lineClass = (index === 0 ? ' first' : index === rows.length - 1 ? ' last' : '') +
      (isLitAbove ? ' lit-above' : '') + (isLitBelow ? ' lit-below' : '') +
      (playState === 'now' ? ' play-now' : '');

    // Each moment's time is written once (Roxanne, 27 Nov: "for all events the time showing only
    // once should be the standard practice"): a row at the same moment as the row above it has
    // no time and no dot of its own, and sits close under it.
    const repeatsTime = index > 0 && rows[index - 1].minute === row.minute && !row.isEndRow;
    const isGrowStop = isPlan && !repeatsTime && (row.minute < planEventStart || index === planStartIndex);
    const isEvenStop = dottedFrom >= 0 && index >= dottedFrom;
    const stop = isGrowStop ? ' data-dots="grow"' : isEvenStop ? ' data-dots="even"' : '';
    const mainLine = `<span class="tree-line${lineClass}"` +
      ` style="--line-above:${lineAbove};--line-below:${lineBelow}">` +
      (repeatsTime ? ''
        : row.isEndRow ? `<span class="tree-cap" style="background:${dotColor}"${stop}></span>`
        : row.level === 0 ? `<span class="tree-dot" style="background:${dotColor}"${stop}></span>`
        : row.isSideRow ? ''
        : `<span class="tree-step-dot" style="background:${dotColor}"${stop}></span>`) + '</span>';

    let sideCell = '';
    if (side) {
      const state = sideStateAt(index);
      const partTypeId = side.occurrence.eventTypeId;
      sideCell = `<span class="tree-side ${state}` +
        `${isDashedBelow(index - 1) ? ' dash-top' : ''}${isDashedBelow(index) ? ' dash-bottom' : ''}"` +
        ` style="--side-top:${fadePiece(partTypeId, sideAt(index - 0.5), sideAt(index))};` +
        `--side-bottom:${fadePiece(partTypeId, sideAt(index), sideAt(index + 0.5))}">` +
        (state === 'start'
          ? `<span class="tree-side-logo" title="${escapeForPage(eventTypeName(partTypeId))}">` +
            `${eventIcon(partTypeId)}</span>` : '') +
        (row.isSideStep
          ? `<span class="tree-side-dot" style="background:${fadeColorAt(partTypeId, sideAt(index))}"></span>` : '') +
        (state === 'end'
          ? `<span class="tree-cap" style="background:${fadeColorAt(partTypeId, 1)}"></span>` : '') +
        '</span>';
    }

    const sideGoesOn = sideStateAt(index) === 'start' || sideStateAt(index) === 'middle';
    const chestsHtml = row.dayNumber ? dayChests(row.eventTypeId, row.dayNumber) : '';
    const hasPoints = row.pointSourceIds.length > 0 || Boolean(chestsHtml);
    const noteHtml = row.note ? `<p class="tree-instructions">${escapeForPage(row.note)}</p>` : '';

    // The date only where the day changes; the time on every row.
    const rowDay = shownDayOf(row.minute);
    const isNewDay = index === 0 || shownDayOf(rows[index - 1].minute) !== rowDay;

    const inside = `<span class="tree-when">` +
      (isNewDay && !repeatsTime ? `<b>${escapeForPage(shortDayText(rowDay))}</b>` : '') +
      (repeatsTime ? '' : `<span>${escapeForPage(clockText(row.minute))}</span>`) + '</span>' +
      sideCell + (openingColumns.length ? openingCells(index) : '') + mainLine +
      `<span class="tree-label${row.level === 0 && !row.isEndRow ? ' main' : ''}${row.isStage ? ' stage' : ''}` +
      `${eventTypeById(row.eventTypeId)?.instructionSteps && row.level > 0 ? ' instructions' : row.detail ? ' heading' : ''}` +
      `${row.isSideRow || row.isEndRow ? ' side-row' : ''}"` +
      // A ticket's rows are written in the ticket's own colour, like its line; other
      // rows beside the event use the light end of their bar.
      (row.openingPartKey ? ` style="color:${logoColors(row.eventTypeId).light}"`
        : row.isSideRow ? ` style="color:${barFadeColors(row.eventTypeId).light}"` : '') + '>' +
      (row.isCurrent ? PIN_ICON : '') +
      (row.isCancelled ? '<span class="cancelled-mark" aria-label="Cancelled">&times;</span> ' : '') +
      (eventTypeById(row.eventTypeId)?.instructionSteps ? planWords(row.label) : escapeForPage(row.label)) +
      planGainOf(row.eventTypeId, row.level === 0 ? row.label : '') +
      (row.subLabel ? `<span class="tree-sub">${escapeForPage(row.subLabel)}</span>` : '') +
      (row.detail ? `<span class="tree-detail"${detailColorAt.has(index) ? ` style="color:${detailColorAt.get(index)}"` : ''}>` +
        `${eventTypeById(row.eventTypeId)?.instructionSteps ? planWords(row.detail) : escapeForPage(row.detail)}</span>` : '') +

      '</span>' +
      (hasPoints || row.note
        ? `<span class="tree-arrow" style="--arrow-color:${dotColor}"></span>` : '<span></span>');

    const plan = index === 0 && firstRow && !hasPoints && !noteHtml ? firstRow : null;
    // The plan sits under the row's name, at least as wide as it, and the button where
    // a row's arrow would be.
    const rowInside = plan
      ? inside.replace(/(<span class="tree-label[^"]*"[^>]*>)([\s\S]*?)<\/span><span><\/span>$/, (_whole, open: string, name: string) =>
          `${open}<span class="plan-stack"><span class="plan-name">${name}</span>${plan.banner}</span></span>${plan.button || '<span></span>'}`)
      : inside;
    const rowClass = 'tree-row' +
      (plan?.banner ? ' has-plan' : '') +
      (row.level === 0 ? ' main' : row.isSideRow ? ' side' : ' nested') +
      // A plan's step on more than one line keeps its time and dot level with its first line.
      (eventTypeById(row.eventTypeId)?.instructionSteps && row.level > 0
        ? (row.label.includes('\n') || row.detail ? ' plan-lines' : '')
        : row.detail ? ' has-detail' : '') +
      (repeatsTime ? ' same-time' : '') +
      (row.isCurrent ? ' current' : '') +
      (row.isPicked ? ' picked' : '') +
      (playState === 'now' ? ' play-now' : '');
    // The highlight's halo takes the row's own colour.
    const rowKey = ` data-row-key="${escapeForPage(row.key ?? '')}"` +
      (row.isPicked ? ` style="--current-color:${dotColor}"` : '');

    if (!hasPoints && !noteHtml) {
      return `<div class="${rowClass}"${rowKey}>${rowInside}</div>`;
    }
    const sources = pointSourcesForDay(row.eventTypeId, row.dayNumber ?? 1)
      .filter(source => row.pointSourceIds.includes(source.id));
    const pointsKey = row.key || 'row-' + index;
    return `<details class="tree-item" data-points-key="${escapeForPage(pointsKey)}"` +
      `${openPointRows.has(pointsKey) ? ' open' : ''}><summary class="${rowClass}"${rowKey}>` +
      `${inside}</summary>` +
      `<div class="tree-points${sideGoesOn ? ' with-side' : ''}` +
      `${sideGoesOn && isDashedBelow(index) ? ' dash-side' : ''}"` +
      ` style="--line-below:${lineBelow}` +
      (sideGoesOn && side
        ? `;--side-color:${fadeColorAt(side.occurrence.eventTypeId, sideAt(index + 0.5))}` : '') +
      `">${noteHtml}${pointRows(row.eventTypeId, sources)}${chestsHtml}</div></details>`;
  }).join('');

  const dotColors = isPlan || dottedFrom >= 0
    ? ` style="--dots-from:${eventTypeColor(mainEventTypeId)};--dots-to:${eventTypeColorEnd(mainEventTypeId)}"` : '';
  return `<div class="event-tree${side ? ' has-side' : ''}` +
    `${openingColumns.length ? ' has-two-sides' : ''}${dotColors ? ' has-gap-dots' : ''}"${dotColors}>${body}</div>`;
}

// The dots between a timeline's marked points, placed once the page is drawn, since only then are
// the rows' heights known: between two "grow" points a small and a bigger dot, as on the calendar's
// preparation; between two "even" points (the shop's extra day) dots of one size. The gaps are
// even, from the edge of one point to the edge of the next.
export function layOutTimelineDots(root: ParentNode): void {
  for (const tree of Array.from(root.querySelectorAll<HTMLElement>('.event-tree'))) {
    for (const old of Array.from(tree.querySelectorAll('.tree-gap-dots'))) old.remove();
    if (!tree.offsetHeight) continue;
    const box = tree.getBoundingClientRect();
    for (const kind of ['grow', 'even']) {
      const stops = Array.from(tree.querySelectorAll<HTMLElement>(`[data-dots="${kind}"]`));
      for (let index = 1; index < stops.length; index++) {
        const above = stops[index - 1].getBoundingClientRect();
        const below = stops[index].getBoundingClientRect();
        const gap = document.createElement('span');
        gap.className = 'tree-gap-dots ' + kind;
        gap.style.left = (above.left + above.width / 2 - box.left) + 'px';
        gap.style.top = (above.bottom - box.top) + 'px';
        gap.style.height = Math.max(0, below.top - above.bottom) + 'px';
        // The shop's day is a dashed line touching the circle above and the end below (Roxanne, 27 Nov
        // night: "it's connected to the end, it's connected to the big circle in front of it").
        gap.innerHTML = kind === 'grow' ? '<i class="small"></i><i class="bigger"></i>'
          : '<i></i>'.repeat(Math.max(2, Math.round((below.top - above.bottom + 4) / 9)));
        tree.appendChild(gap);
      }
    }
  }
}

export interface EventPanelOptions {
  // The alliance's tier for this run, with its edit for R4s, under the event's name.
  tierLineHtml?: string;
  tree: EventTree;
  // The day the player was looking at when they opened it.
  day: number;
  dayOfEvent: number;
  allianceTags: string;
  // Other alliances' own times for this event in these days.
  allianceTimes: Occurrence[];
  allianceTagsOf: (occurrence: Occurrence) => string;
  rewardView: RewardViewState;
  changeNote: string;
  // The day the event was opened from, when it was opened from a day's timeline.
  backToDay: number | null;
  // The Fortress Battles event's battles of its phase (empty for every other event).
  fortBattlesHtml: string;
  // Alliance Showdown's total score (empty for every other event).
  scoreHtml: string;
  // How past runs went, and the form that records this one (empty without results).
  resultsHtml: string;
  // The player's own entry for this run: their time, rank and note.
  personalHtml: string;
  // The tab the player last opened (Timeline is the first); the first tab when it is not
  // one of this event's.
  openTab: string;
  // Pencils in the head, for those allowed to edit this event's dates or this date.
  headPencils: string;
  // The form a pencil opened, shown in place at the top of the event's page.
  editFormHtml: string;
  // What sits at the right of the tabs' line while a tab is open, by tab: its edit icon,
  // or Cancel and Save while it is being edited.
  tabActions?: Record<string, string>;
  // The alliance's plan on the timeline's first row, for the events that have one.
  firstRowPlan?: FirstRowPlan;
  // A stage (State of Power's Matchmaking, Preparation, Battle, Field Triage) opens its
  // whole event: the head names the event and spans all of it.
  wholeEvent?: { eventTypeId: string; startMinute: number; endMinute: number };
}


// One tab of an event's info.
interface InfoTab {
  id: string;
  label: string;
  html: string;
}

// A piece written as an open fold ("<details ...><summary>Rules</summary>...</details>")
// becomes a tab: the fold's title names the tab and what is inside is the tab's page.
function tabFromFold(id: string, foldHtml: string): InfoTab {
  const head = /^<details[^>]*><summary>([\s\S]*?)<\/summary>/.exec(foldHtml);
  if (!head || !foldHtml.endsWith('</details>')) return { id, label: '', html: foldHtml };
  // A fold's title could carry a count ("Points (12)"); a tab's name does not.
  const label = head[1].replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/\s*\(\d+\)$/, '');
  return { id, label, html: foldHtml.slice(head[0].length, -'</details>'.length) };
}

// Two folds that share one tab (the rewards notes and the reward tiles): the first
// one's title, both contents.
function joinFolds(first: string, second: string): string {
  if (!first) return second;
  if (!second) return first;
  const inner = tabFromFold('', second).html;
  return first.slice(0, -'</details>'.length) + inner + '</details>';
}

// The Rules tab: the requirements, the rules and the predictions, each under its own
// heading, as one page.
// An event's buildings (Foundry Battle, Roxanne 28 Nov night: "crop each of the buildings and recreate all
// the information they put there in a tab, including with the bonuses and the hover"): one line each, the
// game's picture, name and text, Alliance and Personal Arsenal Points at first control and per minute, and
// its bonuses with the game's tooltip on hover or tap.
function buildingsPage(eventTypeId: string): string {
  const buildings = buildingsOf(eventTypeId);
  if (!buildings.length) return '';
  const alliance = escapeForPage(imageUrl('foundry/points-alliance'));
  const personal = escapeForPage(imageUrl('foundry/points-personal'));
  const first = (picture: string, value: number) =>
    `<span><img src="${picture}" alt="">${escapeForPage(value.toLocaleString('en-US'))}</span>`;
  const perMinute = (picture: string, value: number) =>
    `<span><img src="${picture}" alt="">+${escapeForPage(value.toLocaleString('en-US'))}<small>/m</small></span>`;
  return '<div class="building-list"><div class="building-columns"><span></span><span>First control</span><span>Ongoing</span></div>' +
    buildings.map(building => '<div class="building">' +
      `<span class="building-picture"><img src="${escapeForPage(imageUrl(building.imageFile.replace(/\.png$/, '')))}" alt=""></span><div>` +
      `<div class="building-name">${escapeForPage(buildingName(building.id))}</div>` +
      `<div class="building-text">${escapeForPage(buildingDescription(building.id))}</div>` +
      '<div class="building-points"><em>Alliance</em>' + first(alliance, building.alliancePoints[0]) + perMinute(alliance, building.alliancePoints[1]) +
      '<em>Personal</em>' + first(personal, building.personalPoints[0]) + perMinute(personal, building.personalPoints[1]) + '</div>' +
      (building.bonuses.length ? '<div class="building-bonus"><em>Bonus</em>' + building.bonuses.map(bonus =>
        `<span class="plan-tip" tabindex="0"><img src="${escapeForPage(imageUrl(bonus.imageFile.replace(/\.png$/, '')))}" alt="">` +
        `<b>${escapeForPage(bonus.value)}</b><span class="tip">${escapeForPage(buildingBonusName(bonus.id) + ': ' + bonus.value)}</span></span>`).join('') + '</div>' : '') +
      '</div></div>').join('') + '</div>';
}

function rulesPage(eventTypeId: string, requirements: string): string {
  const parts = [
    requirements,
    notesFold(eventTypeId, 'rules', listTitle(eventTypeId, 'rules', 'Rules')),
    notesFold(eventTypeId, 'predictions', 'Predictions')
  ].filter(Boolean);
  return parts.join('');
}

// The first day of the event being drawn. Hero names in its texts are those of the
// state's generation on that day, as in the old app.
let heroDay = NaN;

export function eventPanel(occurrence: Occurrence, options: EventPanelOptions): string {
  const eventTypeId = occurrence.eventTypeId;
  heroDay = occurrence.startDay;
  // A part shown as its whole event wears the whole event's colour.
  const color = eventTypeColor(options.wholeEvent?.eventTypeId ?? eventTypeId);
  const colorEnd = eventTypeColorEnd(options.wholeEvent?.eventTypeId ?? eventTypeId);

  // What players need to know about this particular run.
  const facts: string[] = [];
  const typeLabel = eventTypeLabel(eventTypeId);
  if (typeLabel) facts.push(typeLabel);
  // The run's season, beside its kind (Fishing's Summer, Roxanne 27 Nov).
  const season = seasonOf(eventTypeId, occurrence.startDay);
  if (season) facts.push(season);
  if (occurrence.wasCancelled) facts.push('Cancelled');
  if (occurrence.wasChanged) facts.push('Date or time changed');

  const notes: string[] = [];
  const otherName = eventOtherName(eventTypeId);
  if (otherName) notes.push(`<p class="event-other-name">${escapeForPage(otherName)}</p>`);
  const written = eventNotes(eventTypeId, heroDay);
  if (written) notes.push(`<p class="event-info-line">${escapeForPage(written)}</p>`);
  if (options.changeNote) {
    notes.push(`<p class="event-info-line">${escapeForPage(options.changeNote)}</p>`);
  }

  const requirements = allianceRequirement(eventTypeId) || playerRequirement(eventTypeId)
    ? '<details class="points-list event-requirements" open><summary>Requirements</summary>' +
      (allianceRequirement(eventTypeId)
        ? `<p><b>Alliance:</b> ${escapeForPage(allianceRequirement(eventTypeId))}</p>` : '') +
      (playerRequirement(eventTypeId)
        ? `<p><b>Player:</b> ${escapeForPage(playerRequirement(eventTypeId))}</p>` : '') +
      '</details>'
    : '';

  const timelineHtml = options.tree.rows.length ? renderEventTree(options.tree, options.firstRowPlan) : '';
  // The event's own scoring list, unless the timeline already shows points per day.
  const ownPoints = options.tree.hasPoints
    ? '' : pointsList(eventTypeId, pointSourcesForDay(eventTypeId, options.dayOfEvent), true);

  const allianceTimesHtml = options.allianceTimes.length
    ? '<div class="event-alliance-times">' +
      options.allianceTimes.map(other =>
        `<button type="button" class="schedule-row" data-open-event="${escapeForPage(other.key)}">` +
        `<span>${escapeForPage(options.allianceTagsOf(other))}</span>` +
        `<span class="schedule-when">${escapeForPage(shortDayText(shownDayOf(other.startMinute)) +
          (other.startTimeUtc ? ' · ' + clockText(other.startMinute) : ''))}</span></button>`).join('') +
      '</div>'
    : '';

  // The same tabs, in the same order, on every event; an event shows only the ones it
  // has. Timeline first; Rules holds the requirements, the rules and the predictions;
  // the tabs only one kind of event needs come after Rewards.
  const splitRules = pointSourcesInList(eventTypeId, 'how-to').length > 0 && !requirements;
  const tabs: InfoTab[] = [
    { id: 'timeline', label: 'Timeline', html: timelineHtml },
    // An event whose rules are split into tabs (Fishing: Guide and Rewards,
    // Roxanne 27 Nov) writes no heading inside them: the tab already names its page.
    { id: 'rules', label: 'Rules', html: rulesPage(eventTypeId, requirements) },
    { id: 'buildings', label: 'Buildings', html: buildingsPage(eventTypeId) },
    { id: 'how-to', label: listTitle(eventTypeId, 'how-to', 'How to play'),
      html: notesFold(eventTypeId, 'how-to', listTitle(eventTypeId, 'how-to', 'How to play'), true) },
    // Fishing's chances are saved (list 'chances') but not shown for now (Roxanne, 27 Nov:
    // "save them but don't display them for now").
    tabFromFold('points', ownPoints),
    splitRules
      ? { id: 'rewards', label: 'Rewards', html: joinFolds(
        notesFold(eventTypeId, 'rewards', 'Rewards', true), rewardsFold(eventTypeId, options.rewardView)) }
      : tabFromFold('rewards', joinFolds(
        notesFold(eventTypeId, 'rewards', 'Rewards'), rewardsFold(eventTypeId, options.rewardView))),
    { id: 'battles', label: 'Battles', html: options.fortBattlesHtml },
    { id: 'score', label: 'Total score', html: options.scoreHtml },
    { id: 'alliance-times', label: 'Alliance times', html: eventTypeById(eventTypeId)?.noAllianceTimesTab ? '' : allianceTimesHtml },
    tabFromFold('missions', missionsFold(eventTypeId, options.rewardView)),
    // The shop always comes after Missions (Roxanne, 27 Nov night: "shop is always after missions").
    tabFromFold('merchant', rewardsFold(eventTypeId, options.rewardView, true)),
    { id: 'results', label: 'Results', html: options.resultsHtml },
    { id: 'mine', label: 'Mine', html: options.personalHtml }
  ].filter(tab => tab.html);
  // A timeline that says no more than the head (the event's own start and end, nothing
  // inside) is left out when the event has other tabs: the date and time are at the top.
  const saysMoreThanHead = options.tree.rows.filter(row => !row.isEndRow).length > 1 ||
    options.tree.rows.some(row => row.pointSourceIds.length > 0) || Boolean(options.tree.side) ||
    options.tree.openingSides.length > 0;
  if (!saysMoreThanHead && tabs.length > 1 && tabs[0].id === 'timeline') tabs.shift();

  const openTab = tabs.find(tab => tab.id === options.openTab) ?? tabs[0];
  const tabActions = openTab ? options.tabActions?.[openTab.id] ?? '' : '';
  // A timeline alone draws no tab line; any other tab names itself on the tab line, as
  // it does beside other tabs (and its edit button sits there).
  const showsTabLine = tabs.length > 1 || Boolean(tabActions) || (tabs.length === 1 && tabs[0].id !== 'timeline');
  const tabRow = showsTabLine
    ? `<div class="info-tabs" role="tablist" style="--tab-color:${escapeForPage(color)}">` + tabs.map(tab =>
        `<button type="button" class="info-tab" role="tab" data-info-tab="${tab.id}"` +
        ` aria-selected="${tab === openTab}">${escapeForPage(tab.label)}</button>`).join('') + '</div>'
    : '';
  const tabsHtml = tabActions
    ? `<div class="info-tab-line">${tabRow}<span class="tab-actions">${tabActions}</span></div>`
    : tabRow;
  const openHtml = !openTab ? ''
    : openTab.id === 'timeline' ? timelineHtml
      : `<div class="event-folds" style="--fold-color:${escapeForPage(color)}">` +
        `<div class="points-list tab-page ${openTab.id}-tab">` +
        (showsTabLine ? '' : `<h3 class="tab-page-title">${escapeForPage(openTab.label)}</h3>`) +
        `${openTab.html}</div></div>`;

  const factsHtml = facts.length
    ? '<div class="event-facts">' +
      facts.map(fact => `<span class="event-fact">${escapeForPage(fact)}</span>`).join('') + '</div>'
    : '';
  // An event can show its facts (Mini-game, Summer) in its head, with its name, rather
  // than in a tab (Fishing, Roxanne 27 Nov: "add it to the tournament, not to the rules").
  const factsInHead = Boolean(eventTypeById(eventTypeId)?.factsInHead);
  const headEventTypeId = options.wholeEvent?.eventTypeId ?? eventTypeId;
  const plainPanel = Boolean(eventTypeById(headEventTypeId)?.plainPanel);
  const headStart = options.wholeEvent?.startMinute ?? occurrence.startMinute;
  const headEnd = options.wholeEvent?.endMinute ?? occurrence.endMinute;
  let html = backLinks(options.backToDay) +
    `<section class="day-section glass event-page${plainPanel ? ' plain-panel' : ''}" data-event-type="${escapeForPage(headEventTypeId)}" style="${plainPanel ? '' : tintedPanelStyle(color, colorEnd)}--event-color:${escapeForPage(color)};">` +
    `<div class="event-page-head">${eventBadge(headEventTypeId, 'large')}` +
    '<div class="event-page-title"><h2>' +
    (occurrence.wasCancelled ? '<span class="cancelled-mark" aria-label="Cancelled">&times;</span> ' : '') +
    escapeForPage(eventTypeName(headEventTypeId) + options.allianceTags) + '</h2>' +
    `<span class="event-note">${escapeForPage(spanText(headStart, headEnd))}</span>` +
    // The alliance's tier under the name, in capitals, with a tiny edit for R4s (Roxanne,
    // 27 Nov: "we are not gonna write tier").
    (options.tierLineHtml ?? '') +
    (factsInHead ? factsHtml : '') +
    `</div><div class="row-buttons">${options.headPencils}</div></div>` +
    // The other name, the event's note and this date's note go with the name, not in a tab.
    (notes.length ? `<div class="event-notes">${notes.join('')}</div>` : '') +
    // The tabs stay at the top with the head; only what is under them scrolls.
    tabsHtml +
    '<div class="event-page-body">';

  if (!factsInHead) html += factsHtml;

  html += options.editFormHtml;
  html += openHtml;
  return html + '</div></section>';
}

// The panel behind a gathered bar ("Bear Hunt x16"): every alliance's time of that
// event on that day. Ticking a time follows it, and then only the followed ones show
// in the calendar, as the logo at their time.
export interface GroupPanelOptions {
  eventTypeId: string;
  day: number;
  backToDay: number | null;
  times: Occurrence[];
  nameOfTime: (occurrence: Occurrence) => string;
  followedScheduleIds: Set<string>;
  // A pencil beside a time its alliance's leaders may change, and its form when open.
  pencilFor: (occurrence: Occurrence) => string;
  formFor: (occurrence: Occurrence) => string;
}

export function groupPanel(options: GroupPanelOptions): string {
  const color = eventTypeColor(options.eventTypeId);
  return backLinks(options.backToDay) +
    `<section class="day-section glass event-page" style="${tintedPanelStyle(color, eventTypeColorEnd(options.eventTypeId))}--event-color:${escapeForPage(color)};">` +
    `<div class="event-page-head">${eventBadge(options.eventTypeId, 'large')}` +
    `<div class="event-page-title"><h2>${escapeForPage(eventTypeName(options.eventTypeId))}</h2>` +
    `<span class="event-note">${escapeForPage(shortDayText(options.day))}</span></div></div>` +
    '<div class="event-page-body"><p class="event-info-line">Tick the times you follow. Only those show in your calendar, at their time.</p>' +
    '<div class="time-list">' + options.times.map(one => {
      const isFollowed = options.followedScheduleIds.has(one.scheduleId);
      return `<div class="time-row${isFollowed ? ' followed' : ''}">` +
        `<button type="button" class="time-follow" data-follow-time="${escapeForPage(one.scheduleId)}"` +
        ` aria-pressed="${isFollowed}">` +
        `<span class="filter-box${isFollowed ? ' on' : ''}" aria-hidden="true">${isFollowed ? '&#10003;' : ''}</span>` +
        `<span class="time-name">${escapeForPage(options.nameOfTime(one))}</span></button>` +
        `<span class="time-value">${escapeForPage(clockText(one.startMinute))}</span>${options.pencilFor(one)}</div>` +
        options.formFor(one);
    }).join('') + '</div></div></section>';
}

// Kept so the colour helpers have one home, used by the panel and by anything that
// paints something to match a bar.
export { fadeColorAt, colorWithAlpha, phaseName };
