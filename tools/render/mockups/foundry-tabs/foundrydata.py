# Foundry's rules, requirements and rewards, put into a throwaway copy of the repo for the mockup only.
import json, os
os.chdir('/tmp/frepo')
J=lambda f: json.load(open(f)); W=lambda f,d: json.dump(d, open(f,'w'), indent=2, ensure_ascii=False)
items=J('data/catalog/items.json'); rewards=J('data/catalog/rewards.json'); ps=J('data/catalog/point-sources.json'); t=J('data/text/en.json')
for i in ['foundry-statue','foundry-puzzle-piece','foundry-chest','foundry-ticket']: items.append({'id': i, 'imageFile': f'items/{i}.png'})
t.pop('eventType.foundry.notes', None)   # no rule line on Foundry (decided 28 Nov)
t['eventType.foundry.allianceRequirement'] = 'Top 20 alliances on the Alliance Power Leaderboard before the event starts. Legion 2 unlocks at Alliance Lv. 6 with 40 members logging in this week. A legion needs at least 15 combatants and substitutes for matchmaking.'
t['eventType.foundry.playerRequirement'] = 'Furnace 16, in the alliance before registration ends, not offline for 5 days or more.'
rules = [
 "Registration:\nThe leader and R4s of alliances in the top 20 sign up, and each alliance can register two legions. Members R4 and below request a legion and can switch until registration ends, when the lists lock. Members who join after that cannot take part or earn the alliance rewards.",
 "Combatants:\nThe leader and R4s choose up to 30 combatants and 10 substitutes for each legion. A member can be picked for one legion only.",
 "Matchmaking:\nLegions are matched on the Troop Power of their top 20 registered chiefs, first with legions registered for the same time. The match time is picked at random from either side's chosen times or the midpoint between them.",
 "Victory:\nTaking control of a building for the first time and keeping control of it earn Alliance and Personal Arsenal Points. When the countdown ends, the alliance with the most Alliance Arsenal Points wins, and on a tie the alliance that defeated more enemy troops.",
 "Phases:\nPrototype Sites, Repair Facilities, Boiler Rooms and Transit Stations can be taken first, then the Imperial Foundry, the Munitions Warehouse and the Mercenary Camp. Weapon Workshops appear at random across the field in two waves, and soldiers sent to loot them earn Arsenal Points.",
 "Arsenal Points:\nBuildings produce Arsenal Points until they reach capacity. Of the points over capacity, half go to the occupier and half are held above the building; an attacker who takes it scatters them as Arsenal Supplies that either side can loot. Defeating troops earns only Personal Arsenal Points, 40 for each 10,000 Troop Power while defending and 80 while attacking.",
 "On the field:\nTroops cannot die, go to a free Infirmary and heal when they leave the field. Each combatant has 1 free Advanced Teleporter that comes back after its cooldown. A city whose defenders are beaten and whose fire is not put out is moved to a safe zone, and its chief can rejoin after 12 minutes. Tech, VIP, Chief Gear and Skin bonuses stay active.",
 "Entering:\nOnce the battle begins, with no troops scouting or marching outside the city, no injured troops in the Infirmary, no burning city and no reinforcements in the Embassy.",
 "Rewards:\nAlliance tiers and rewards come from the Legion 1 battle. An alliance that does not register for 3 seasons in a row is left off the Win Ratio Ranking.",
]
for n, text in enumerate(rules, 1):
  ps.append({'id': f'pfb{n}', 'eventTypeId': 'foundry', 'list': 'rules', 'sortOrder': 1600 + n}); t[f'pointSource.pfb{n}.task'] = text
ps.append({'id': 'pfbw1', 'eventTypeId': 'foundry', 'list': 'rewards', 'imageFile': 'items/arsenal-token.png', 'sortOrder': 1651})
t['pointSource.pfbw1.task'] = 'Expert Bonus: Arsenal Tokens from the event +100%.'
order = [0]
def add(section, band_label, rows):
  for item, tile, q in rows:
    order[0] += 1
    rid = f'rw-foundry-combatant-{section}-{order[0]}-{item}'
    rewards.append({'id': rid, 'eventTypeId': 'foundry', 'list': 'combatant', 'band': '', 'section': section, 'itemId': item, 'tile': tile, 'quantity': q, 'sortOrder': 1700 + order[0]})
    if band_label: t[f'reward.{rid}.rowLabel'] = band_label
add('win', '', [('arsenal-token','orange',4000),('gems-100','purple',6),('foundry-statue','purple',2),('gold-key','purple',4),('meat-10k-unsecured','blue',80),('wood-10k-unsecured','blue',80),('coal-10k-unsecured','blue',16)])
add('lose', '', [('arsenal-token','orange',3000),('gems-100','purple',3),('foundry-statue','purple',1),('gold-key','purple',2),('meat-10k-unsecured','blue',40),('wood-10k-unsecured','blue',40),('coal-10k-unsecured','blue',8)])
bands = ['2,000–19,999','20,000–41,999','42,000–89,999','90,000–179,999','180,000+']
# token, puzzle, chest, ticket, crystals, 1h speedup, 5K EXP
win = [(4800,2,8,1,4,4,40),(9600,4,10,1,8,8,45),(14400,6,12,2,12,12,50),(19200,8,14,2,16,16,55),(24000,10,16,3,20,20,60)]
lose = [(2400,1,6,0,2,2,15),(4800,2,8,0,4,4,20),(7200,3,10,1,6,6,25),(9600,4,12,1,8,8,30),(12000,5,14,2,10,10,35)]
names = [('arsenal-token','orange'),('foundry-puzzle-piece','orange'),('foundry-chest','orange'),('foundry-ticket','orange'),('gems-100','purple'),('speedup-training-1h','blue'),('hero-xp-5k','blue')]
for section, table in (('personal-win', win), ('personal-lose', lose)):
  for band, qs in zip(bands, table):
    add(section, band, [(n, tile, q) for (n, tile), q in zip(names, qs) if q])
W('data/catalog/items.json', items); W('data/catalog/rewards.json', rewards); W('data/catalog/point-sources.json', ps); W('data/text/en.json', t)
print('ok', len(rewards))
