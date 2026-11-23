// Planning a fortress phase: which buff forts the state holds, how many of each buff
// are kept for the state's rally leads, and which lead collects them. A castle lead
// collects 2 of every buff fort's buff and a turret lead 1 (both in the settings).
// Strongholds never give a buff, and the game grants an alliance its own forts' buffs,
// so only the buffs of a fort another alliance holds are planned here.
import './fortress.css';
import './pages.css';
import { fortFullName, FORT_NAMES, isStronghold } from '../calendar/fort-season.ts';
import { fortRewardOf, isBuffItem } from '../data/catalog.ts';
import { allianceTag } from '../data/alliances.ts';
import type { Alliance } from '../data/alliances.ts';
import { escapeForPage } from './escape.ts';
import { drawnReward, phaseHead } from './fortress.ts';
import { rowButton, rowForm } from './data-table.ts';
import type { BuffAllocation, FortAssignment, RallyLead } from '../data/forts.ts';

export interface PlanningOptions {
  seasonNumber: number;
  phase: number;
  battleDay: number;
  isPlayedPhase: boolean;
  // This phase's holders only.
  assignments: FortAssignment[];
  leads: RallyLead[];
  allocations: BuffAllocation[];
  // How many of each buff a lead of that tier collects.
  buffsPerCastleLead: number;
  buffsPerTurretLead: number;
  // State managers change the plan: the forms below show for them.
  mayEdit: boolean;
  alliances: Alliance[];
  // The open pencil, as "plan-fort|<assignment id>" or "remove|rally_leads|<id>".
  editing: string | null;
}

function buffsOf(lead: RallyLead, options: PlanningOptions): number {
  return lead.tier === 'castle' ? options.buffsPerCastleLead : options.buffsPerTurretLead;
}

export function fortressPlanning(options: PlanningOptions): string {
  // Which forts pay a buff this phase, from the catalog, whether or not anyone holds
  // them yet.
  const buffFortNames = FORT_NAMES.filter(fort => {
    if (isStronghold(fort)) return false;
    const reward = fortRewardOf(fort, options.phase);
    return reward ? isBuffItem(reward.itemId) : false;
  });
  const buffForts = options.assignments
    .filter(one => buffFortNames.includes(one.fort))
    .sort((left, right) => left.fort.localeCompare(right.fort, 'en', { numeric: true }));

  const leadById = new Map(options.leads.map(lead => [lead.id, lead]));
  // Only what is set aside on this phase's buff forts counts towards a lead's share.
  const fortIds = new Set(buffForts.map(one => one.id));
  const thisPhase = options.allocations.filter(one => fortIds.has(one.fortAssignmentId));

  const fortCards = buffForts.map(assignment => {
    const given = thisPhase.filter(one => one.fortAssignmentId === assignment.id);
    const taken = given.reduce((total, one) => total + one.quantity, 0);
    const editKey = 'plan-fort|' + assignment.id;
    const isEditing = options.editing === editKey;

    const chips = given.map(one => {
      const lead = leadById.get(one.rallyLeadId);
      return '<span class="lead-chip">' +
        `<b>${escapeForPage(lead ? lead.inGameName : '')}</b>` +
        `<i>${one.quantity}</i></span>`;
    }).join('');

    // The fort's plan: how many of its buffs are kept for leads, and a lead to give
    // some to. Giving a lead 0 takes their share away.
    const forms = isEditing
      ? rowForm({
          form: 'fort-reserve', key: String(assignment.id), title: 'Kept for rally leads', canCancel: true,
          fields: [{ name: 'reserved_for_leads', label: 'How many', kind: 'number', value: assignment.reservedForLeads, isRequired: true }]
        }) +
        (options.leads.length ? rowForm({
          form: 'buff-share', key: String(assignment.id), title: 'Give to a lead',
          fields: [
            { name: 'rally_lead_id', label: 'Lead', kind: 'select', isRequired: true,
              choices: options.leads.map(lead => [String(lead.id), lead.inGameName + ' · ' + allianceTag(lead.allianceId)] as [string, string]) },
            { name: 'quantity', label: 'How many (0 takes them away)', kind: 'number', value: 1, isRequired: true }
          ]
        }) : '')
      : '';

    return `<article class="plan-fort${isEditing ? ' editing' : ''}">` +
      '<div class="plan-fort-head">' +
      `<strong>${escapeForPage(fortFullName(assignment.fort))}</strong>` +
      `<span class="plan-fort-holder">${escapeForPage(allianceTag(assignment.allianceId))}</span>` +
      (options.mayEdit ? rowButton(editKey, isEditing ? 'Close' : 'Plan') : '') +
      '</div>' +
      `<div class="plan-fort-reward">${(() => {
        const reward = fortRewardOf(assignment.fort, options.phase, options.battleDay);
        return reward ? drawnReward(reward) : '';
      })()}</div>` +
      '<div class="plan-fort-share">' +
      `<span class="share-count"><b>${taken}</b> / ${assignment.reservedForLeads}</span>` +
      `<span class="share-bar">${Array.from(
        { length: Math.max(assignment.reservedForLeads, taken) },
        (_unused, index) => `<i class="${index < taken ? 'spent' : ''}"></i>`).join('')}</span>` +
      '</div>' +
      (chips ? `<div class="plan-fort-leads">${chips}</div>` : '') +
      forms + '</article>';
  }).join('');

  const leadRows = options.leads.map(lead => {
    const held = thisPhase
      .filter(one => one.rallyLeadId === lead.id)
      .reduce((total, one) => total + one.quantity, 0);
    const wanted = buffsOf(lead, options) * buffForts.length;
    const removeKey = 'remove|rally_leads|' + lead.id;
    return '<div class="lead-row">' +
      `<span class="lead-name">${escapeForPage(lead.inGameName)}` +
      `<small>${escapeForPage(allianceTag(lead.allianceId))}</small></span>` +
      `<span class="lead-tier">${lead.tier === 'castle' ? 'Castle' : 'Turret'}</span>` +
      `<span class="lead-count${held === wanted ? '' : ' off'}"><b>${held}</b> / ${wanted}</span>` +
      (options.mayEdit ? rowButton(removeKey, 'Remove', options.editing === removeKey) : '') +
      '</div>';
  }).join('');

  const addLead = options.mayEdit ? rowForm({
    form: 'rally-lead', title: 'Add a rally lead', submitLabel: 'Add',
    fields: [
      { name: 'in_game_name', label: 'In-game name', kind: 'text', isRequired: true },
      { name: 'in_game_id', label: 'In-game ID', kind: 'text' },
      { name: 'alliance_id', label: 'Alliance', kind: 'select', isRequired: true,
        choices: options.alliances.filter(one => !one.mainAllianceId).map(one => [one.id, one.tag] as [string, string]) },
      { name: 'tier', label: 'Leads a', kind: 'select', isRequired: true,
        choices: [['castle', 'Castle'], ['turret', 'Turret']] }
    ]
  }) : '';

  // Why a phase has nothing to plan: no fort pays a buff in it, or nobody holds one yet.
  const emptyText = !buffFortNames.length
    ? `No fort gives a buff in phase ${options.phase}, so there is nothing to plan.`
    : 'No alliance is set on this phase\'s buff forts yet. Set them on the Board.';

  return '<div class="plan-page">' +
    '<section class="plan-forts glass">' +
    phaseHead(options.seasonNumber, options.phase, options.battleDay, options.isPlayedPhase, '') +
    (fortCards ? `<div class="plan-fort-grid">${fortCards}</div>`
      : `<p class="admin-help">${escapeForPage(emptyText)}</p>`) +
    '</section>' +
    '<section class="plan-leads glass">' +
    '<h2>Rally leads</h2>' +
    (leadRows ? `<div class="lead-list">${leadRows}</div>`
      : '<p class="admin-help">No rally leads yet.</p>') +
    addLead +
    '</section></div>';
}
