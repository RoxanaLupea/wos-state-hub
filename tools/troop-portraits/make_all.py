# Every troop portrait with the crisp frame, from the camp screenshots at their own size.
import sys, json
ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
import numpy as np
from PIL import Image, ImageFilter
sys.path.insert(0, __import__('os').path.dirname(__file__))
from draw_portrait import portrait, NW, NH
REPO = '/home/claude/wos-state-hub/public/images/troops/'
UP = '/mnt/user-data/uploads/'
shots = {
  'infantry': [(UP + '12acd162-image.png', [1, 2, 3, 4, 5], 62), (UP + '59ac660a-image.png', [6, 7, 8, 9, 10], 73)],
  'lancer':   [(UP + 'd8b464d7-image.png', [1, 2, 3, 4, 5], 62), (UP + '5eefb772-image.png', [6, 7, 8, 9, 10], 89)],
  'marksmen': [(UP + '1922162b-image.png', [1, 2, 3, 4, 5], 62), (UP + 'b37ddc0b-image.png', [6, 7, 8, 9, 10], 80)],
}
# Find each portrait by its frame, against the infantry T1 frame (all frames are the same).
ref = np.asarray(Image.open(UP + '12acd162-image.png').convert('RGB').crop((61, 1366, 61 + NW, 1366 + NH))).astype(float)
lum = ref.mean(axis=2); ring = (lum > 205) & ((ref.max(axis=2) - ref.min(axis=2)) < 45)
for kind, parts in shots.items():
    for path, tiers, x0 in parts:
        shot = Image.open(path).convert('RGB'); arr = np.asarray(shot).astype(float)
        for i, tier in enumerate(tiers):
            best = None
            for x in range(x0 + 199 * i - 6, x0 + 199 * i + 6):
                for y in range(1360, 1373):
                    c = arr[y:y + NH, x:x + NW]
                    if c.shape[:2] != (NH, NW): continue
                    d = ((c - ref) ** 2)[ring].mean()
                    if best is None or d < best[0]: best = (d, x, y)
            native = shot.crop((best[1], best[2], best[1] + NW, best[2] + NH)); native.save(f'/tmp/troop-native/{kind}-t{tier}.png')
            p = portrait(native, ROMAN[tier])
            p.save(REPO + f'{kind}-t{tier}.png')
            print(kind, tier, best)
# Helios and Exalted: the screenshots stop at T10, so only the first 120 x 147 pictures
# exist (kept in sources/, as they were before any of this work); their art is scaled up.
# Never read them from public/images: that is this script's own output, and reading it
# back sharpened the art again on every run.
SOURCES = __import__('os').path.join(__import__('os').path.dirname(__file__), 'sources') + '/'
for kind in shots:
    for t in ('helios', 'exalted'):
        old = Image.open(SOURCES + f'{kind}-{t}.png').convert('RGBA')
        flat = Image.new('RGBA', old.size, (200, 205, 230, 255)); flat.alpha_composite(old)
        portrait(flat.convert('RGB').resize((NW, NH), Image.LANCZOS), 'XI' if t == 'helios' else 'XII').save(REPO + f'{kind}-{t}.png')
