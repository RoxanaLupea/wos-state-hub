# Adds a made-up signed-in player to tools/render/data/main.json, so the profile can be
# rendered: a main (Roxa, DVL), an alt (Roxa2, TOP), two farms and the owner role, all
# for the stand-in user that shoot-player.py signs in as. None of it is in the database.
import json, pathlib
here = pathlib.Path(__file__).parent
data_file = here / 'data' / 'main.json'
data = json.loads(data_file.read_text())
data.update(json.loads((here / 'test-player.json').read_text()))
data_file.write_text(json.dumps(data, ensure_ascii=False))
print('test player added to', data_file)
