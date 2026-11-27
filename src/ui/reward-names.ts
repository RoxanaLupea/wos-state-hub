// The game's own words for the reward lists and the groups inside them. Kept here so
// the page never shows a list's internal name.

// The order the tabs appear in, and what each list is called.
export const REWARD_TABS: [string, string][] = [
  ['daily', 'Daily'],
  ['star', 'Star'],
  ['glory', "Champion's Glory"],
  ['ranking', 'Ranking'],
  ['combatant', 'Combatant'],
  ['tier', 'Tier'],
  ['conquest', 'Stronghold Conquest'],
  ['merchant', 'Winter Merchant'],
  ['targets', 'Target Points'],
  ['medals', 'Medal of Honor'],
  ['group', 'Tier Rewards'],
  ['ko', 'KO Rewards'],
  ['shop', 'Shop'],
  ['rates', 'Reward Rates'],
  ['chests', 'Daily Chests'],
  ['expert', 'Expert'],
  ['horns', 'Victory Points'],
  ['missions', 'Missions']
];

// Events whose tabs the game names differently. Every list an event has must be named
// here, or its own tabs are used.
export const EVENT_REWARD_TABS: Record<string, [string, string][]> = {
  'alliance-championship': [['group', 'Tier Rewards'], ['ko', 'KO Rewards']],
  fishing: [['club', 'Ice Fishing Club'], ['ranking', 'Ranking Rewards']],
  koi: [['targets', 'Target Points'], ['medals', 'Medal of Honor'], ['ranking', 'Ranking']],
  'crazy-joe': [['targets', 'Defense Point'], ['ranking', 'Ranking']],
  frostfire: [['targets', 'Gathering Rewards'], ['ranking', 'Ranking Rewards']],
  dreamscape: [['targets', 'Chapter Rewards']],
  'defeat-beasts': [['targets', 'Target Points'], ['ranking', 'Honor Ranking']],
  'lucky-wheel': [['rates', 'Reward Rates'], ['targets', 'Progress Chests']]
};

const GLORY_SECTIONS: Record<string, string> = {
  champion: 'Champion Alliance Glory',
  top4: 'Top 4 Alliance Glory'
};

const COMBATANT_SECTIONS: Record<string, string> = {
  win: "Winning legion's members",
  lose: "Losing legion's members",
  'personal-win': "Winning legion's combatants, by Personal Arsenal Points",
  'personal-lose': "Losing legion's combatants, by Personal Arsenal Points"
};

const DAILY_SECTIONS: Record<string, string> = {
  win: 'Winning alliance of the day',
  lose: 'Losing or drawing alliance of the day'
};

const TIER_SECTIONS: Record<string, string> = {
  streak: 'Win Streak', win: 'Victory', lose: 'Loss'
};

const SECTIONS: Record<string, string> = {
  win: 'Winning alliance', lose: 'Losing or drawing alliance', streak: 'Win Streak',
  prestige: 'Prestige'
};

// Lists whose rows are a ladder of numbers and so are shown smallest first.
export const NUMBERED_REWARD_LISTS = ['targets', 'medals'];

// The expert who gives the extra chests of an event.
export const EXPERT_CHEST_HOSTS: Record<string, { name: string; imageFile: string }> = {
  showdown: { name: 'Baldur', imageFile: 'experts/baldur' }
};

export function rewardListName(eventTypeId: string, list: string): string {
  const own = EVENT_REWARD_TABS[eventTypeId]?.find(tab => tab[0] === list);
  if (own) return own[1];
  return REWARD_TABS.find(tab => tab[0] === list)?.[1] ?? list;
}

// The tabs of one event, in the game's order, leaving out the lists it has none of.
export function rewardListsOf(eventTypeId: string, listsPresent: string[]): string[] {
  const order = EVENT_REWARD_TABS[eventTypeId] ?? REWARD_TABS;
  const ordered = order.map(tab => tab[0]).filter(list => listsPresent.includes(list));
  // A list the order does not mention still shows, at the end.
  return ordered.concat(listsPresent.filter(list => !ordered.includes(list)));
}

export function rewardSectionName(list: string, section: string): string {
  if (!section) return '';
  if (list === 'glory') return GLORY_SECTIONS[section] ?? section;
  if (list === 'combatant') return COMBATANT_SECTIONS[section] ?? section;
  if (list === 'daily') return DAILY_SECTIONS[section] ?? section;
  if (list === 'tier') return TIER_SECTIONS[section] ?? section;
  return SECTIONS[section] ?? section;
}

// A band written the way the game writes it: a star range reads "1–2 ★".
export function rewardBandName(band: string): string {
  return /^\d/.test(band) ? band.replace('-', '–') + ' ★' : band;
}
