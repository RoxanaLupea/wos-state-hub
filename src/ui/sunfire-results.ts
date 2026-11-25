// Sunfire Castle's result (accepted 25 Nov), drawn with the SvS results' elements: the
// game's Occupation Ranking and the president. Every alliance in it is ours, so each keeps
// its own colours (as on the Fortress page) instead of SvS's blue for us and red for them.
// It is entered from the game's screenshots; admins edit it in place.
import { escapeForPage } from './escape.ts';
import { imageUrl } from './event-icon.ts';
import { bannerStyle } from './fortress.ts';
import { allianceByTag } from '../data/alliances.ts';
import { PLUS, field, historyLink, holdTime, type SvsHold } from './svs-results.ts';

export interface SunfireRun {
  // The Occupation Ranking, longest hold first.
  holds: SvsHold[];
  president: { tag: string; name: string } | null;
}

export const SUNFIRE_EDIT_FORM_ID = 'sunfire-result-form';

// An alliance's colours by its tag; an alliance that is not ours is drawn as theirs (red).
function colourOf(tag: string): { style: string; side: string } {
  const alliance = allianceByTag(tag);
  return alliance ? { style: bannerStyle(alliance), side: 'own' } : { style: '', side: 'theirs' };
}

function title(): string {
  return '<h3 class="panel-title part-title">Occupation Ranking<b></b></h3>';
}

export function sunfireResult(run: SunfireRun): string {
  const longest = Math.max(1, ...run.holds.map(hold => hold.seconds));
  const rows = run.holds.map((hold, index) => {
    const colour = colourOf(hold.tag);
    return `<div class="svs-hold ${colour.side}${index === 0 ? ' first' : ''}" style="${colour.style}">` +
      `<span class="svs-rank">${index + 1}</span>` +
      `<span class="fort-spot-tag svs-pill ${colour.side}">${escapeForPage(hold.tag)}</span>` +
      `<span class="svs-track"><i style="--share:${((100 * hold.seconds) / longest).toFixed(1)}"></i></span>` +
      `<time>${holdTime(hold.seconds)}</time></div>`;
  }).join('');
  const ranking = rows ? `<section class="svs-part sunfire">${title()}<div class="svs-holds">${rows}</div></section>` : '';
  return '<div class="svs-result">' + ranking + presidentPart(run, false) + historyLink('sunfire-history') + '</div>';
}

// Sunfire Castle always gives a numbered President, in their alliance's colour.
function presidentPart(run: SunfireRun, editing: boolean): string {
  if (!run.president && !editing) return '';
  const colour = run.president ? colourOf(run.president.tag) : { style: '', side: 'own' };
  const name = run.president ? `[${run.president.tag}]${run.president.name}` : '';
  return `<section class="svs-part sunfire"><div class="svs-president" style="${colour.style}">` +
    `<img src="${imageUrl('president')}" alt="President">` +
    (editing
      ? field('president', name, ' placeholder="[Tag]name" aria-label="President"')
      : `<span class="${colour.side}">${escapeForPage(name)}</span>`) +
    '</div></section>';
}

function holdRow(place: number, hold: SvsHold | null, longest = 1): string {
  const colour = hold ? colourOf(hold.tag) : { style: '', side: 'blank' };
  return `<div class="svs-hold ${colour.side}${place === 1 ? ' first' : ''}" style="${colour.style}" data-row>` +
    `<span class="svs-rank" data-row-number>${place}</span>` +
    field('hold_tag', hold?.tag ?? '', ' maxlength="4" aria-label="Alliance tag"', 'svs-field svs-pill-field') +
    `<span class="svs-track"><i style="--share:${hold ? ((100 * hold.seconds) / longest).toFixed(1) : 0}"></i></span>` +
    field('hold_time', hold ? holdTime(hold.seconds) : '', ' placeholder="00:00:00" inputmode="numeric" aria-label="Time held"', 'svs-field svs-time-field') +
  '</div>';
}

// Editing in place: the same layout, each value in a small box in its own space. The
// ranking starts with one row and a + button; it is sorted when saved.
export function sunfireResultEditor(run: SunfireRun, formKey: string): string {
  const longest = Math.max(1, ...run.holds.map(hold => hold.seconds));
  const rows = run.holds.length ? run.holds.map((hold, index) => holdRow(index + 1, hold, longest)).join('') : holdRow(1, null);
  return `<form class="svs-result editing" id="${SUNFIRE_EDIT_FORM_ID}" data-form="result" data-key="${escapeForPage(formKey)}">` +
    `<section class="svs-part sunfire">${title()}<div class="svs-holds">${rows}` +
      `<template data-row-template>${holdRow(0, null)}</template>` +
      `<div class="svs-plus-row"><button type="button" class="svs-plus" data-add-row aria-label="Add an alliance">${PLUS}</button></div>` +
    '</div></section>' + presidentPart(run, true) +
    '<p class="form-message" data-form-message></p></form>';
}
