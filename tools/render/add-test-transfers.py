# Adds made-up transfers to tools/render/data/main.json, so the Invites and Records pages can
# be rendered: the players of the accepted mockup (tools/mockups/invites/invites_status.py)
# on the 6 Dec 2026 transfer, two on 3 Jan 2027, and three past transfers for Records. The
# statuses, groups and contacts are the mockup's samples. None of it is in the database.
# Run after add-test-player.py (the transfer manager is the test player's main).
import json, pathlib
here = pathlib.Path(__file__).parent
data_file = here / 'data' / 'main.json'
data = json.loads(data_file.read_text())

# name, id, state, power, kills, labyrinth, migrant, furnace, troops (tier/fc), contact
PLAYERS = {
  'tif':     ('Lȏ̈яᴅ DαԀԀყ Tıғ', 135786444, 1252, 2853577537, 457835910, 2264, 7860255, 80, '12/10 12/10 12/10', ('DVL', '')),
  'lordy':   ('Lordy', 171969415, 1252, 1409250644, 362035310, 2090, 5606105, 80, '12/10 12/10 12/10', ('DVL', '')),
  'baby':    ('вαву тιғ', 203436673, 1252, 1454489398, 136847538, 2079, 5673535, 80, '12/10 12/10 12/10', ('DVL', '')),
  'roxanne': ('Roxanne', 151288720, 1252, 1108698817, 372062108, 1986, 4476438, 80, '12/10 12/10 12/10', ('DVL', '')),
  'boom':    ('Mr Boombastic', 152637698, 1252, 1010847465, 268807363, 1956, 4389144, 80, '12/10 12/10 12/10', ('DVL', '')),
  'hsu':     ('HSU', 144327574, 1252, 1114894248, 126905469, 1956, 4249320, 80, '12/10 12/10 12/10', ('DVL', '')),
  'evelyn':  ('Evelyn', 185811207, 1427, 806355375, 16350651, 1531, 1986460, 80, '10/10 10/9 11/10', ('DVL', '')),
  'brender': ('Brender', 186958172, 1427, 818187249, 7984813, 1601, 2096291, 80, '11/10 10/10 11/10', ('DVL', '')),
  'spickle': ('Spickle', 186204736, 1427, 439018862, 4531386, 1275, 1303688, 76, '10/9 10/8 11/9', ('DVL', '')),
  'acy':     ('Acy', 187711805, 1427, 615550814, 5049888, 1467, 1637078, 78, '11/9 10/9 11/9', ('TOP', '')),
  'elnorr':  ('El Norr', 185532586, 1427, 1000996211, 140834907, 1873, 3937835, 80, '12/10 12/10 12/10', ('TOP', '')),
  'ling':    ('冷泠丶', 177941370, 1302, 687331139, 2773364, 1445, 1537817, 79, '10/9 10/9 11/9', ('RUU', '利姆魯')),
  'westeros':('westeros', 197643235, 1427, 705190934, 6695267, 1311, 1488458, 80, '11/10 10/10 11/10', ('DVL', 'Kat')),
}
SKILLS = {135786444: (3, 3, 3), 151288720: (3, 3, 3), 171969415: (2, 1, 0)}

windows = [
  {'id': 901, 'transfer_date': '2026-09-13', 'state_type': 'ordinary', 'power_cap': None, 'manager_id': 135786444,
   'manager_name': 'Lȏ̈яᴅ DαԀԀყ Tıғ', 'manager_avatar': None, 'manager_alliance': 'DVL'},
  {'id': 902, 'transfer_date': '2026-10-11', 'state_type': 'ordinary', 'power_cap': None, 'manager_id': 151288720,
   'manager_name': 'Roxanne', 'manager_avatar': None, 'manager_alliance': 'DVL'},
  {'id': 903, 'transfer_date': '2026-11-08', 'state_type': 'ordinary', 'power_cap': None, 'manager_id': 151288720,
   'manager_name': 'Roxanne', 'manager_avatar': None, 'manager_alliance': 'DVL'},
  {'id': 904, 'transfer_date': '2026-12-06', 'state_type': 'ordinary', 'power_cap': None, 'manager_id': 135786444,
   'manager_name': 'Lȏ̈яᴅ DαԀԀყ Tıғ', 'manager_avatar': None, 'manager_alliance': 'DVL'},
  {'id': 905, 'transfer_date': '2027-01-03', 'state_type': 'ordinary', 'power_cap': None, 'manager_id': None,
   'manager_name': None, 'manager_avatar': None, 'manager_alliance': None},
]

invites = []
def add(window, key, lst, pos, status=None, group=None, at=None):
    name, pid, state, power, kills, lab, mig, furnace, troops, contact = PLAYERS[key]
    kinds = ['infantry', 'lancer', 'marksman']
    skills = SKILLS.get(pid)
    invites.append({
      'id': 9000 + len(invites), 'window_id': window, 'player_id': pid, 'list': lst, 'position': pos,
      'status': status, 'transferred_at': at, 'group_number': group,
      'contact_tag': contact[0], 'contact_name': contact[1] or None, 'contact_player_id': None,
      'name': name, 'avatar': None, 'power': power, 'state_number': state, 'furnace': furnace,
      'kills': kills, 'labyrinth': lab, 'migrant_score': mig,
      'troops': [{'type': kinds[i], 'tier': int(t.split('/')[0]), 'fc': int(t.split('/')[1])} for i, t in enumerate(troops.split())],
      'skills': {'infantry': skills[0], 'lancer': skills[1], 'marksmen': skills[2]} if skills else None,
    })

# The current transfer, as the mockup's "small" groups and statuses.
add(904, 'tif', 'special', 1, 'transferred', 5, '2026-12-09T00:14:00Z')
add(904, 'lordy', 'special', 2, 'sent', 5)
add(904, 'baby', 'special', 3)
add(904, 'roxanne', 'ordinary', 1, None, 1)
add(904, 'boom', 'ordinary', 2, None, 1)
add(904, 'hsu', 'ordinary', 3, None, 2)
add(904, 'evelyn', 'ordinary', 4, 'sent', 2)
add(904, 'brender', 'ordinary', 5, 'sent', 2)
add(904, 'spickle', 'ordinary', 6, None, 3)
add(904, 'acy', 'ordinary', 7, None, 3)
add(904, 'elnorr', 'ordinary', 8, None, 4)
add(904, 'ling', 'ordinary', 9, 'rejected', 4)
add(904, 'westeros', 'ordinary', 10)
# The next one.
add(905, 'evelyn', 'ordinary', 1)
add(905, 'brender', 'ordinary', 2)
# Past transfers, for Records.
for key, lst, pos, st, grp in [('baby', 'special', 1, 'transferred', None), ('hsu', 'ordinary', 1, 'transferred', 1),
    ('spickle', 'ordinary', 2, 'transferred', 1), ('acy', 'ordinary', 3, 'transferred', 2), ('boom', 'ordinary', 4, 'expired', None),
    ('westeros', 'open', 1, 'transferred', None), ('elnorr', 'ordinary', 5, 'expired', None), ('roxanne', 'ordinary', 6, 'sent', None)]:
  add(903, key, lst, pos, st, grp, '2026-11-11T00:20:00Z' if st == 'transferred' else None)
for key, lst, pos, st, grp in [('lordy', 'special', 1, 'transferred', None), ('baby', 'special', 2, 'transferred', None),
    ('acy', 'ordinary', 1, 'transferred', 1), ('elnorr', 'ordinary', 2, 'transferred', 1), ('hsu', 'ordinary', 3, 'transferred', None),
    ('spickle', 'ordinary', 4, 'transferred', None), ('ling', 'ordinary', 5, 'rejected', None), ('boom', 'ordinary', 6, 'expired', None)]:
  add(902, key, lst, pos, st, grp, '2026-10-14T00:20:00Z' if st == 'transferred' else None)
for key, lst, pos, st, grp in [('tif', 'special', 1, 'transferred', None), ('evelyn', 'ordinary', 1, 'transferred', 1),
    ('brender', 'ordinary', 2, 'transferred', 1), ('ling', 'open', 1, 'transferred', None), ('westeros', 'ordinary', 3, 'expired', None)]:
  add(901, key, lst, pos, st, grp, '2026-09-16T00:20:00Z' if st == 'transferred' else None)

# A player the game knows who is on no list yet, for Add.
data.setdefault('game_players', []).append({'player_id': 199900011, 'state_number': 1427, 'alliance_tag': 'KBN', 'read_at': '2026-11-26T10:00:00Z',
  'game_read_at': '2026-11-26T10:00:00Z', 'data': {'player': {'nick_name': 'Dvorak', 'kid': 1427, 'power': 912400000, 'furnace_level': 80,
  'avatar_url': None, 'alliance': {'abbr': 'KBN'}}}})
data['transfer_windows'] = windows
data['transfer_invites'] = invites
# The test player manages the current transfer: their main is Tif's ID here.
data_file.write_text(json.dumps(data, ensure_ascii=False))
print('test transfers added to', data_file, len(invites), 'players')
