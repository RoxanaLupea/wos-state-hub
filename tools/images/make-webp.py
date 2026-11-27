# Makes the pictures the site shows: every PNG under public/images as a WebP at no more
# than twice the largest size it is shown at, so a phone downloads a few KB instead of
# hundreds (DVL's logo was 400 KB for a 48 px badge). The PNGs stay the source: add or
# replace them in public/images as before; the build makes the WebPs (see the workflow).
# A picture is made again only when its PNG changed (a list of the PNGs' fingerprints is
# kept beside the WebPs), so a build with no new pictures takes seconds.
# Usage: python3 tools/images/make-webp.py public/images <folder for the WebPs>
import hashlib
import json
import pathlib
import sys
from concurrent.futures import ProcessPoolExecutor
from PIL import Image

# The longest side, in pixels, per folder: twice the largest size the site shows it at.
LONGEST_SIDE = {
    'alliances': 200,      # the badge on a computer is 85 px tall
    'heroes/cards': 408,   # the Arena team cards, kept as the game's own card
    'heroes': 200,         # portraits and shards
    'troops': 300,         # troop portraits, 148 px tall on a computer
    'items': 160,          # reward tiles
    'events': 160,         # event logos
    'experts': 200,
    'frames': 440,         # reward frames (Champion's Glory), about 150 px wide on a computer
    'ranks': 96,           # the 1, 2, 3 badges in ranking lists, 30 px
}
DEFAULT_SIDE = 256

def longest_side(relative: pathlib.Path) -> int:
    folder = relative.parent.as_posix()
    while folder and folder != '.':
        if folder in LONGEST_SIDE:
            return LONGEST_SIDE[folder]
        folder = str(pathlib.PurePosixPath(folder).parent)
    return DEFAULT_SIDE

def make_one(job):
    png, out, side = job
    picture = Image.open(png)
    has_alpha = picture.mode in ('P', 'LA', 'L', 'RGBA') or 'transparency' in picture.info
    picture = picture.convert('RGBA' if has_alpha else 'RGB')
    if max(picture.size) > side:
        scale = side / max(picture.size)
        picture = picture.resize((max(1, round(picture.width * scale)), max(1, round(picture.height * scale))), Image.LANCZOS)
    out.parent.mkdir(parents=True, exist_ok=True)
    picture.save(out, 'WEBP', quality=82, method=6)

def main(source: pathlib.Path, target: pathlib.Path) -> None:
    manifest_file = target / '.made-from.json'
    made_from = json.loads(manifest_file.read_text()) if manifest_file.exists() else {}
    wanted, jobs = {}, []
    for png in sorted(source.rglob('*.png')):
        relative = png.relative_to(source)
        out = target / relative.with_suffix('.webp')
        fingerprint = hashlib.sha1(png.read_bytes()).hexdigest() + ':' + str(longest_side(relative))
        wanted[relative.as_posix()] = fingerprint
        if made_from.get(relative.as_posix()) != fingerprint or not out.exists():
            jobs.append((png, out, longest_side(relative)))
    with ProcessPoolExecutor() as pool:
        list(pool.map(make_one, jobs))
    # A PNG taken away takes its WebP with it.
    for relative in set(made_from) - set(wanted):
        (target / pathlib.PurePosixPath(relative).with_suffix('.webp')).unlink(missing_ok=True)
    target.mkdir(parents=True, exist_ok=True)
    manifest_file.write_text(json.dumps(wanted, indent=0, sort_keys=True))
    total = sum((target / pathlib.PurePosixPath(r).with_suffix('.webp')).stat().st_size for r in wanted)
    print(f'{len(wanted)} pictures, {len(jobs)} made now, {total // 1024} KB as WebP')

if __name__ == '__main__':
    main(pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2]))
