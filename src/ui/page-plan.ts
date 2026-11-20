// A page that is not built yet. It says what will live there, so the whole site can
// be walked through before any of it is finished.
import './page-plan.css';
import { pageById, type SubPage } from './shell.ts';
import { escapeForPage } from './escape.ts';

// What each page will hold. Written from what we settled on, so the plan can be read
// back and argued with rather than remembered.
const PLANS: Record<string, string[]> = {
  'fortress|planning': [
    'The draft for the next phase: which alliance registers for which fort',
    'A warning when an alliance takes a second new fort in one phase',
    'Nothing saves until the division is right'
  ],
  'transfers|next': [
    'The window being planned: 35 by invitation, 20 in the open phase, and specials',
    'The power cap, and who is above it',
    'Candidates with their in-game id, power, FC level and current state',
    'Invite status and outcome, who rejected and who replaced them',
    'Flags raised by members, and the blacklist'
  ],
  'transfers|past': [
    'Closed windows, read only',
    'Not filled in retroactively from the site'
  ],
  'event|availability': [
    'When you can play, in whole hours',
    'Your troop tiers and skill levels, and whether you play for your own alliance or the state alliance',
    'The list sorted by troop score, by when someone answered, or by how long they can stay'
  ],
  'event|roster': [
    'Who goes in: joiners, fillers and substitutes',
    'Marked in progress until an admin declares it final',
    'A second state alliance or legion when we register more than one'
  ],
  'event|plan': [
    'The battle plan and schedule for this run',
    'A draft only planners see, published when it is ready'
  ],
  'event|battle-map': [
    'The arena for this event: the castle, the foundry map or the canyon map',
    'Positions and rallies marked on it'
  ],
  'alliance|members': [
    'Members with their in-game name and id, and their farms and alts',
    'Player power and foundry power, with a prompt when a figure goes stale',
    'Who is R4, battle planner or alliance manager'
  ],
  'alliance|academies': [
    'The academies linked to your alliance',
    'R4s link their own, admins link any'
  ],
  'map|territory': [
    'The state, 1200 by 1200 tiles',
    'Territory spreading from HQs through banners, 7 by 7 around each',
    'Cities, 2 by 2, which may sit outside territory'
  ],
  'map|facilities': [
    'Every facility on the map and the buff it gives',
    'A complete set is twelve, and two of the same type and level do not stack'
  ],
  'admin|settings': [
    'Whether transfers follow the SvS battle or Sunfire',
    'The fortress season start and the fort rewards generation',
    'Roster sizes, the Tyrant qualification bar, how old a power figure may get',
    'The image folder'
  ],
  'admin|roles': ['Who is R4, battle planner or admin'],
  'admin|requests': ['Alliances asking to join the site, waiting for approval']
};

export function pagePlan(pageId: string, subPageId: string): string {
  const page = pageById(pageId);
  // With no page named, the section opens on its first one.
  const sub: SubPage | undefined =
    page?.pages.find(one => one.id === subPageId) ?? page?.pages[0];
  const key = sub ? `${pageId}|${sub.id}` : pageId;
  const points = PLANS[key] ?? [];
  const heading = sub ? `${page?.label} · ${sub.label}` : page?.label ?? pageId;

  return `<section class="page-plan glass">
    <h2>${escapeForPage(heading)}</h2>
    <p class="page-plan-note">Not built yet. This is what it will hold.</p>
    <ul>${points.map(point => `<li>${escapeForPage(point)}</li>`).join('')}</ul>
  </section>`;
}
