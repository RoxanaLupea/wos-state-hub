// Planning a fortress phase: which buff forts the state holds, how many of each buff
// are set aside for rally leads, and which lead collects them.
import './fortress.css';
import './pages.css';
import { fortFullName } from '../calendar/fort-season.ts';
import { fortRewardOf, isBuffItem, itemName, itemLabel } from '../data/catalog.ts';
import { imageUrl } from './event-icon.ts';
import { allianceTag } from '../data/alliances.ts';
import { escapeForPage } from './escape.ts';
import type { BuffAllocation, FortAssignment, RallyLead } from '../data/forts.ts';

export interface PlanningOptions {
  seasonNumber: number;
  phase: number;
  assignments: FortAssignment[];
  leads: RallyLead[];
  allocations: BuffAllocation[];
  // How many of each buff a lead of that tier collects.
  buffsPerCastleLead: number;
  buffsPerTurretLead: number;
}

const TILE_COLORS = ['grey', 'green', 'blue', 'purple', 'orange'];

function rewardTile(fort: string, phase: number): string {
  const reward = fortRewardOf(fort, phase);
  if (!reward) return '';
  const tile = TILE_COLORS.includes(reward.tile) ? reward.tile : 'none';
  const label = itemLabel(reward.itemId);
  return `<span class="reward-tile tile-${tile}" title="${escapeForPage(itemName(reward.itemId))}">` +
    `<img src="${escapeForPage(imageUrl('items/' + reward.itemId))}" alt="" loading="lazy">` +
    (label ? `<span class="tile-top">${escapeForPage(label)}</span>` : '') +
    `<span class="tile-qty">${escapeForPage(reward.quantity.toLocaleString('en-US'))}</span></span>`;
}

function buffsOf(lead: RallyLead, options: PlanningOptions): number {
  return lead.tier === 'castle' ? options.buffsPerCastleLead : options.buffsPerTurretLead;
}

export function fortressPlanning(options: PlanningOptions): string {
  // Only a fort whose reward is a buff can hold anything back for other alliances.
  const buffForts = options.assignments
    .filter(one => one.phase === options.phase)
    .filter(one => {
      const reward = fortRewardOf(one.fort, options.phase);
      return reward ? isBuffItem(reward.itemId) : false;
    })
    .sort((left, right) => left.fort.localeCompare(right.fort, 'en', { numeric: true }));

  const leadById = new Map(options.leads.map(lead => [lead.id, lead]));
  // Only what is set aside on this phase's buff forts counts towards a lead's share.
  const fortIds = new Set(buffForts.map(one => one.id));
  const thisPhase = options.allocations.filter(one => fortIds.has(one.fortAssignmentId));

  const fortCards = buffForts.map(assignment => {
    const given = thisPhase.filter(one => one.fortAssignmentId === assignment.id);
    const taken = given.reduce((total, one) => total + one.quantity, 0);

    const chips = given.map(one => {
      const lead = leadById.get(one.rallyLeadId);
      return '<span class="lead-chip">' +
        `<b>${escapeForPage(lead ? lead.inGameName : '')}</b>` +
        `<i>${one.quantity}</i></span>`;
    }).join('');

    return '<article class="plan-fort">' +
      '<div class="plan-fort-head">' +
      `<strong>${escapeForPage(fortFullName(assignment.fort))}</strong>` +
      `<span class="plan-fort-holder">${escapeForPage(allianceTag(assignment.allianceId))}</span>` +
      '</div>' +
      `<div class="plan-fort-reward">${rewardTile(assignment.fort, options.phase)}</div>` +
      '<div class="plan-fort-share">' +
      `<span class="share-count"><b>${taken}</b> / ${assignment.reservedForLeads}</span>` +
      `<span class="share-bar">${Array.from(
        { length: Math.max(assignment.reservedForLeads, taken) },
        (_unused, index) => `<i class="${index < taken ? 'spent' : ''}"></i>`).join('')}</span>` +
      '</div>' +
      (chips ? `<div class="plan-fort-leads">${chips}</div>` : '') +
      '</article>';
  }).join('');

  const leadRows = options.leads.map(lead => {
    const held = thisPhase
      .filter(one => one.rallyLeadId === lead.id)
      .reduce((total, one) => total + one.quantity, 0);
    const wanted = buffsOf(lead, options) * buffForts.length;
    return '<div class="lead-row">' +
      `<span class="lead-name">${escapeForPage(lead.inGameName)}` +
      `<small>${escapeForPage(allianceTag(lead.allianceId))}</small></span>` +
      `<span class="lead-tier">${lead.tier === 'castle' ? 'Castle' : 'Turret'}</span>` +
      `<span class="lead-count${held === wanted ? '' : ' off'}"><b>${held}</b> / ${wanted}</span>` +
      '</div>';
  }).join('');

  return '<div class="plan-page">' +
    '<section class="plan-forts glass">' +
    `<h2>Phase ${options.phase}</h2>` +
    (fortCards ? `<div class="plan-fort-grid">${fortCards}</div>`
      : '<p class="admin-help">No buff fort is assigned for this phase.</p>') +
    '</section>' +
    '<section class="plan-leads glass">' +
    '<h2>Rally leads</h2>' +
    (leadRows ? `<div class="lead-list">${leadRows}</div>`
      : '<p class="admin-help">No rally leads yet.</p>') +
    '</section></div>';
}
