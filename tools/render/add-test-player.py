# Adds a made-up signed-in player to tools/render/data/main.json, so the profile can be
# rendered: a main (TestPlayer, DVL), an alt (TestAlt, TOP), two farms and the owner role, all
# for the stand-in user that shoot-player.py signs in as, with made-up game data for them
# (players, two rosters, the alliances the site keeps). None of it is in the database.
import json, pathlib
here = pathlib.Path(__file__).parent
data_file = here / 'data' / 'main.json'
data = json.loads(data_file.read_text())
data.update(json.loads((here / 'test-player.json').read_text()))
# Real game data for the profile, when it is there: data/test-game.json holds the test
# player's accounts as real 1458 chiefs, their game data and skill levels. It sits in
# data/, which is never committed, because it holds real players' details.
game_file = here / 'data' / 'test-game.json'
if game_file.exists():
    data.update(json.loads(game_file.read_text()))
data_file.write_text(json.dumps(data, ensure_ascii=False))
print('test player added to', data_file)
