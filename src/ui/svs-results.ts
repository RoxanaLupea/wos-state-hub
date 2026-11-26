// One SvS's result, drawn like the game's own screens: the two states with the castle
// on the side where the battle was fought, the Preparation points day by day, the
// Battle's Occupation Ranking, and the State of Power result with its president.
// Our side is always blue and theirs always red, whichever alliance it was.
// A part that is not recorded is simply not shown.
import './svs-results.css';
import { escapeForPage } from './escape.ts';
import { imageUrl } from './event-icon.ts';
import { allianceByTag } from '../data/alliances.ts';
import { pageButton } from './edit-forms.ts';
import { playerSearchField } from './player-search.ts';

export type Outcome = 'win' | 'loss' | 'draw' | '';
export type Side = 'ours' | 'theirs';

export interface SvsHold {
  side: Side;
  // The alliance's tag, as the game shows it.
  tag: string;
  seconds: number;
}

export interface SvsRun {
  opponentState: number | null;
  result: Outcome;
  preparation: Outcome;
  battle: Outcome;
  // Each state's total, then its points for each of the 5 preparation days.
  points: { ours: number; theirs: number; days: [number, number][] } | null;
  // The Occupation Ranking, longest hold first.
  holds: SvsHold[];
  president: President | null;
}

// A president as recorded: the alliance's tag and the name, and the in-game ID and picture
// once picked from the players found.
export interface President { tag: string; name: string; id?: string; avatar?: string }

// The president is found like the transfer manager: by name among the state's players, or
// by in-game ID in the game (Roxanne, 26 Nov). It is kept as the game writes it ([DVL]name),
// with its ID and picture, which set the transfer manager.
export function presidentSearch(president: President | null): string {
  return playerSearchField({
    key: 'president', label: 'President', placeholder: 'Name or ID', fieldClass: 'svs-field', gameWriting: true,
    shown: president ? { id: president.id ?? '', name: president.name, avatar: president.avatar ?? null, alliance: president.tag || null } : null,
    formNames: { text: 'president', id: 'detail_president_id', avatar: 'detail_president_avatar' }
  });
}

// Which part of the SvS the panel is open on. Preparation and Battle show only their
// own part; the rest of the SvS shows all of it.
export type SvsPart = 'whole' | 'preparation' | 'battle';

export interface SvsResultOptions {
  run: SvsRun;
  part: SvsPart;
  ourState: number;
  // The game's name for a preparation day ("City Construction").
  dayNameOf: (dayNumber: number) => string;
}

// The way from one SvS, or one Sunfire Castle, to all of them on the State page.
export function historyLink(historyId = 'svs-history'): string {
  const words = historyId === 'sunfire-history' ? 'Sunfire Records' : 'SvS Records';
  return pageButton(words, `data-page="state" data-scroll-to="${historyId}"`);
}

export function svsResult(options: SvsResultOptions): string {
  const { run, part } = options;
  const parts = [statesHead(options)];
  if (part !== 'battle') parts.push(preparationPart(options));
  if (part !== 'preparation') parts.push(battlePart(run));
  if (part === 'whole') parts.push(stateOfPowerPart(run));
  return '<div class="svs-result">' + parts.join('') + historyLink() + '</div>';
}

// Preparation's totals in full, as the game writes them: 11,028,870,560.
export function fullPoints(value: number): string {
  return value.toLocaleString('en-US');
}

// Points as the game's big numbers read at a glance: 11.03B, 645.9M.
export function shortPoints(value: number): string {
  if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B';
  if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M';
  return value.toLocaleString('en-US');
}

function outcomeWord(outcome: Outcome): string {
  return outcome === 'win' ? 'Win' : outcome === 'loss' ? 'Loss' : outcome === 'draw' ? 'Draw' : '';
}

function partTitle(name: string, outcome: Outcome): string {
  return `<h3 class="panel-title part-title">${escapeForPage(name)}<b>${outcomeWord(outcome)}</b></h3>`;
}

// The battle is fought in the state that lost Preparation.
function battleFoughtIn(run: SvsRun): Side | '' {
  if (run.preparation === 'win') return 'theirs';
  if (run.preparation === 'loss') return 'ours';
  return '';
}

// Matchmaking, as the other parts: its title, then the two states, ours on the left and
// theirs on the right, with the castle logo on the inside of the state where the battle
// was fought.
function statesHead(options: SvsResultOptions): string {
  const { run } = options;
  if (!run.opponentState) return '';
  const castle = `<img class="svs-castle" src="${imageUrl('castle-battle')}" alt="">`;
  const foughtIn = battleFoughtIn(run);
  return '<section class="svs-part matchmaking">' + partTitle('Matchmaking', '') + '<div class="svs-states">' +
    `<span class="svs-state ours">#${options.ourState}${foughtIn === 'ours' ? castle : ''}</span>` +
    '<span class="svs-vs">VS</span>' +
    `<span class="svs-state theirs">${foughtIn === 'theirs' ? castle : ''}#${run.opponentState}</span>` +
    '</div></section>';
}

// One bar shared by the two sides, split by their shares, with a light line where they meet.
function splitBar(ours: number, theirs: number, isTotal: boolean): string {
  const share = ours + theirs > 0 ? (100 * ours) / (ours + theirs) : 50;
  return `<div class="svs-split${isTotal ? ' total' : ''}" style="--share:${share.toFixed(1)}"></div>`;
}

function preparationPart(options: SvsResultOptions): string {
  const { run } = options;
  if (!run.preparation && !run.points) return '';
  let body = '';
  if (run.points) {
    const { ours, theirs, days } = run.points;
    body += '<div class="svs-totals">' +
      `<strong>${fullPoints(ours)}</strong><strong>${fullPoints(theirs)}</strong></div>` +
      splitBar(ours, theirs, true);
    // The side that led the day is written in white.
    body += '<div class="svs-days">' + days.map(([ourDay, theirDay], index) =>
      '<div class="svs-day"><div class="svs-day-values">' +
        `<span class="${ourDay >= theirDay ? 'led' : ''}">${shortPoints(ourDay)}</span>` +
        `<span class="svs-day-name">${escapeForPage(options.dayNameOf(index + 1))}</span>` +
        `<span class="${theirDay > ourDay ? 'led' : ''}">${shortPoints(theirDay)}</span>` +
      '</div>' + splitBar(ourDay, theirDay, false) + '</div>').join('') + '</div>';
  }
  return '<section class="svs-part preparation">' + partTitle('Preparation', run.preparation) + body + '</section>';
}

export function holdTime(seconds: number): string {
  const two = (value: number) => String(value).padStart(2, '0');
  return `${two(Math.floor(seconds / 3600))}:${two(Math.floor((seconds % 3600) / 60))}:${two(seconds % 60)}`;
}

// The game's Occupation Ranking: who held the castle and for how long.
function battlePart(run: SvsRun): string {
  if (!run.battle && !run.holds.length) return '';
  const longest = Math.max(1, ...run.holds.map(hold => hold.seconds));
  const rows = run.holds.map((hold, index) =>
    `<div class="svs-hold ${hold.side}${index === 0 ? ' first' : ''}">` +
      `<span class="svs-rank">${index + 1}</span>` +
      `<span class="fort-spot-tag svs-pill ${hold.side}">${escapeForPage(hold.tag)}</span>` +
      `<span class="svs-track"><i style="--share:${((100 * hold.seconds) / longest).toFixed(1)}"></i></span>` +
      `<time>${holdTime(hold.seconds)}</time>` +
    '</div>').join('');
  return '<section class="svs-part battle">' + partTitle('Battle', run.battle) +
    (rows ? `<div class="svs-holds">${rows}</div>` : '') + '</section>';
}

// The president is always known from our castle records: when we win both parts ours
// becomes Supreme President; when they win both, their invader does; otherwise we keep
// our own President.
function stateOfPowerPart(run: SvsRun): string {
  if (!run.result && !run.president) return '';
  let president = '';
  if (run.president) {
    const isSupreme = !!run.preparation && run.preparation === run.battle;
    const side: Side = run.preparation === 'loss' && run.battle === 'loss' ? 'theirs' : 'ours';
    const title = isSupreme ? 'Supreme President' : 'President';
    president = '<div class="svs-president">' +
      `<img src="${imageUrl(isSupreme ? 'supreme-president' : 'president')}" alt="${title}" title="${title}">` +
      `<span class="${side}">[${escapeForPage(run.president.tag)}]${escapeForPage(run.president.name)}</span></div>`;
  }
  return '<section class="svs-part state-of-power">' + partTitle('State of Power', run.result) + president + '</section>';
}

// ---------------------------------------------------------------------------
// Editing in place: the same layout, with every value in a light glass box. Admins get
// here from the edit button on the tabs' line; Save goes back to the results.
// ---------------------------------------------------------------------------

export const SVS_EDIT_FORM_ID = 'svs-result-form';

export interface SvsEditOptions {
  run: SvsRun;
  ourState: number;
  dayNameOf: (dayNumber: number) => string;
  // The form's key: "svs|<date>||<result id>".
  formKey: string;
  // Kept as it is: which of our alliances held the castle, from the old records.
  castleAllianceId: string;
}

export const PLUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ' +
  'stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';

export function field(name: string, value: string, extra = '', className = 'svs-field'): string {
  return `<input class="${className}" name="${name}" value="${escapeForPage(value)}" autocomplete="off"${extra}>`;
}

function numberField(name: string, value: number | null | undefined): string {
  return field(name, value === null || value === undefined || !Number.isFinite(value) ? '' : String(value),
    ' inputmode="numeric"');
}

// Points are typed in and read in full while editing (2483456789), so nothing is
// confused; the results show them short (2.48B).
function pointsField(name: string, value: number | null | undefined): string {
  const known = value !== null && value !== undefined && Number.isFinite(value);
  return field(name, known ? String(value) : '', ' inputmode="numeric" data-points');
}

// Where the part's numbers are in, its WIN or LOSS follows from them instead.
function outcomeChoice(name: string, outcome: Outcome): string {
  return '<span class="svs-choices">' + (['win', 'loss'] as const).map(choice =>
    `<label><input type="radio" name="${name}" value="${choice}"${outcome === choice ? ' checked' : ''}>` +
    `<span>${outcomeWord(choice)}</span></label>`).join('') + '</span>' +
    `<b class="svs-computed">${outcomeWord(outcome)}</b>`;
}

function holdRow(place: number, hold: SvsHold | null, longest = 1): string {
  return `<div class="svs-hold ${hold?.side ?? 'blank'}${place === 1 ? ' first' : ''}" data-row>` +
    `<span class="svs-rank" data-row-number>${place}</span>` +
    field('hold_tag', hold?.tag ?? '', ' maxlength="4" aria-label="Alliance tag"', 'svs-field svs-pill-field') +
    `<span class="svs-track"><i style="--share:${hold ? ((100 * hold.seconds) / longest).toFixed(1) : 0}"></i></span>` +
    field('hold_time', hold ? holdTime(hold.seconds) : '', ' placeholder="00:00:00" inputmode="numeric" aria-label="Time held"', 'svs-field svs-time-field') +
  '</div>';
}

export function svsResultEditor(options: SvsEditOptions): string {
  const { run } = options;
  const castle = `<img class="svs-castle" src="${imageUrl('castle-battle')}" alt="">`;
  const foughtIn = battleFoughtIn(run);
  const points = run.points;
  const days = [1, 2, 3, 4, 5].map(day => {
    const [ourDay, theirDay] = points?.days[day - 1] ?? [NaN, NaN];
    return '<div class="svs-day"><div class="svs-day-values">' +
      pointsField(`detail_points_ours_${day}`, ourDay) +
      `<span class="svs-day-name">${escapeForPage(options.dayNameOf(day))}</span>` +
      pointsField(`detail_points_theirs_${day}`, theirDay) +
      '</div>' + splitBar(Number.isFinite(ourDay) ? ourDay : 0, Number.isFinite(theirDay) ? theirDay : 0, false) + '</div>';
  }).join('');
  // The Battle starts with one field and a + button.
  const longest = Math.max(1, ...run.holds.map(hold => hold.seconds));
  const holds = run.holds.length ? run.holds.map((hold, index) => holdRow(index + 1, hold, longest)).join('') : holdRow(1, null);
  const isSupreme = !!run.preparation && run.preparation === run.battle;
  return `<form class="svs-result editing" id="${SVS_EDIT_FORM_ID}" data-form="result" data-key="${escapeForPage(options.formKey)}">` +
    `<input type="hidden" name="state_alliance_id" value="${escapeForPage(options.castleAllianceId)}">` +
    '<section class="svs-part matchmaking">' + partTitle('Matchmaking', '') + '<div class="svs-states">' +
      `<span class="svs-state ours">#${options.ourState}${foughtIn === 'ours' ? castle : ''}</span>` +
      '<span class="svs-vs">VS</span>' +
      `<span class="svs-state theirs">${foughtIn === 'theirs' ? castle : ''}#` +
        numberField('opponent_state', run.opponentState) + '</span>' +
    '</div></section>' +
    `<section class="svs-part preparation${points?.days.length ? ' computed' : ''}"><h3 class="panel-title part-title">Preparation` +
      outcomeChoice('detail_preparation', run.preparation) + '</h3>' +
      '<div class="svs-totals">' + pointsField('detail_points_ours', points?.ours) + pointsField('detail_points_theirs', points?.theirs) +
        `<strong data-sum="ours">${points ? fullPoints(points.ours) : ''}</strong>` +
        `<strong data-sum="theirs">${points ? fullPoints(points.theirs) : ''}</strong></div>` +
      splitBar(points?.ours ?? 0, points?.theirs ?? 0, true) +
      `<div class="svs-days">${days}</div></section>` +
    `<section class="svs-part battle${run.holds.length ? ' computed' : ''}"><h3 class="panel-title part-title">Battle` +
      outcomeChoice('detail_castle_battle', run.battle) + '</h3>' +
      `<div class="svs-holds">${holds}` +
      `<template data-row-template>${holdRow(0, null)}</template>` +
      `<div class="svs-plus-row"><button type="button" class="svs-plus" data-add-row aria-label="Add an alliance">${PLUS}</button></div>` +
      '</div></section>' +
    // The State of Power result follows from the two parts when saved.
    '<section class="svs-part state-of-power">' + partTitle('State of Power', run.result) +
      '<div class="svs-president">' +
        `<img src="${imageUrl(isSupreme ? 'supreme-president' : 'president')}" alt="" data-president-icon>` +
        presidentSearch(run.president) +
      '</div></section>' +
    '<p class="form-message" data-form-message></p>' +
  '</form>';
}

// ---------------------------------------------------------------------------
// While editing, what follows from the numbers is worked out as they are typed in:
// Preparation's totals from its days, and its WIN or LOSS once the last day is in;
// the Battle's WIN when the longest hold is one of our alliances, LOSS when it is not;
// the State of Power result from the two. Saving works them out the same way.
// ---------------------------------------------------------------------------

// Points as typed: "2,483,456,789", "2483456789", or the short "2.48B".
export function pointsOf(text: string): number {
  const clean = text.replace(/[\s,]/g, '');
  if (!clean) return NaN;
  const short = /^(\d+(?:\.\d+)?)([BMK])$/i.exec(clean);
  if (short) return Math.round(Number(short[1]) * { B: 1e9, M: 1e6, K: 1e3 }[short[2].toUpperCase() as 'B' | 'M' | 'K']);
  return /^\d+$/.test(clean) ? Number(clean) : NaN;
}

// "02:14:01", "2:14:01" or "53:39" as seconds.
export function secondsOf(text: string): number {
  const parts = text.trim().split(':').map(Number);
  if (!text.trim() || parts.length > 3 || parts.some(part => !Number.isInteger(part) || part < 0)) return NaN;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

// A time held is typed as digits only, on a phone's number pad: the colons are always
// there, and each digit comes in from the right, as on a timer (2, 1, 4, 0, 1 reads
// 00:21:40, then 02:14:01). Deleting a digit takes it back out.
export function typeHoldTime(input: HTMLInputElement): void {
  const digits = input.value.replace(/\D/g, '');
  if (!digits) { input.value = ''; return; }
  const six = digits.slice(-6).padStart(6, '0');
  input.value = `${six.slice(0, 2)}:${six.slice(2, 4)}:${six.slice(4)}`;
  input.setSelectionRange(input.value.length, input.value.length);
}

// Preparation is won on the totals, once all five days are in.
export function preparationOutcome(days: [number, number][]): Outcome {
  if (days.length < 5 || days.some(([ours, theirs]) => !Number.isFinite(ours) || !Number.isFinite(theirs))) return '';
  const ours = days.reduce((sum, [day]) => sum + day, 0);
  const theirs = days.reduce((sum, [, day]) => sum + day, 0);
  return ours > theirs ? 'win' : ours < theirs ? 'loss' : '';
}

function typedPoints(form: HTMLFormElement, name: string): number {
  return pointsOf(form.querySelector<HTMLInputElement>(`input[name="${name}"]`)?.value ?? '');
}

function setShare(bar: Element | null | undefined, ours: number, theirs: number): void {
  if (bar instanceof HTMLElement) bar.style.setProperty('--share', (ours + theirs > 0 ? (100 * ours) / (ours + theirs) : 50).toFixed(1));
}

export function updateSvsEditor(form: HTMLFormElement): void {
  const preparation = form.querySelector('.svs-part.preparation');
  const battle = form.querySelector('.svs-part.battle');
  const chosen = (name: string) => (form.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`)?.value ?? '') as Outcome;

  // Preparation.
  const days = [1, 2, 3, 4, 5].map(day =>
    [typedPoints(form, `detail_points_ours_${day}`), typedPoints(form, `detail_points_theirs_${day}`)] as [number, number]);
  const anyDay = days.some(([ours, theirs]) => Number.isFinite(ours) || Number.isFinite(theirs));
  let preparationResult = chosen('detail_preparation');
  if (preparation) {
    preparation.classList.toggle('computed', anyDay);
    const dayRows = Array.from(preparation.querySelectorAll('.svs-day'));
    days.forEach(([ours, theirs], index) =>
      setShare(dayRows[index]?.querySelector('.svs-split'), Number.isFinite(ours) ? ours : 0, Number.isFinite(theirs) ? theirs : 0));
    if (anyDay) {
      const ours = days.reduce((sum, [day]) => sum + (Number.isFinite(day) ? day : 0), 0);
      const theirs = days.reduce((sum, [, day]) => sum + (Number.isFinite(day) ? day : 0), 0);
      const sums = preparation.querySelectorAll<HTMLElement>('[data-sum]');
      if (sums[0]) sums[0].textContent = fullPoints(ours);
      if (sums[1]) sums[1].textContent = fullPoints(theirs);
      setShare(preparation.querySelector('.svs-split.total'), ours, theirs);
      preparationResult = preparationOutcome(days);
      const word = preparation.querySelector('.svs-computed');
      if (word) word.textContent = outcomeWord(preparationResult);
    }
  }

  // Battle: each pill takes its state's colour, and the longest hold decides.
  let battleResult = chosen('detail_castle_battle');
  if (battle) {
    const rows = Array.from(battle.querySelectorAll<HTMLElement>('.svs-holds [data-row]'));
    const holds = rows.map(row => {
      const tag = row.querySelector<HTMLInputElement>('input[name="hold_tag"]')?.value.trim() ?? '';
      const seconds = secondsOf(row.querySelector<HTMLInputElement>('input[name="hold_time"]')?.value ?? '');
      const side: Side | 'blank' = !tag ? 'blank' : allianceByTag(tag) ? 'ours' : 'theirs';
      row.classList.remove('ours', 'theirs', 'blank');
      row.classList.add(side);
      return { row, tag, seconds: Number.isFinite(seconds) ? seconds : 0, side };
    }).filter(hold => hold.tag);
    const longest = Math.max(1, ...holds.map(hold => hold.seconds));
    for (const hold of holds) {
      const track = hold.row.querySelector<HTMLElement>('.svs-track i');
      if (track) track.style.setProperty('--share', ((100 * hold.seconds) / longest).toFixed(1));
    }
    battle.classList.toggle('computed', holds.length > 0);
    if (holds.length) {
      const first = holds.reduce((best, hold) => hold.seconds > best.seconds ? hold : best);
      battleResult = first.side === 'ours' ? 'win' : 'loss';
      const word = battle.querySelector('.svs-computed');
      if (word) word.textContent = outcomeWord(battleResult);
    }
  }

  // State of Power, and the president's icon with it.
  const stateOfPower = form.querySelector('.svs-part.state-of-power');
  const result: Outcome = preparationResult && battleResult
    ? (preparationResult === battleResult ? preparationResult : 'draw') : '';
  const resultWord = stateOfPower?.querySelector('.part-title b');
  if (resultWord) resultWord.textContent = outcomeWord(result);
  const icon = stateOfPower?.querySelector<HTMLImageElement>('[data-president-icon]');
  if (icon) icon.src = imageUrl(preparationResult && preparationResult === battleResult ? 'supreme-president' : 'president');
}
