# Clean each card: take off the S mark and the red dot, replace the level and stars at the
# bottom with the card's own colour (the art fading into it), and round the corners.
import cv2, glob
import numpy as np
from PIL import Image, ImageDraw
W, H = 232, 408
S_CARDS = {f'a{r}{c}' for r in range(4) for c in range(4)} | {'b00', 'b01', 'b02', 'b03', 'b10', 'b11', 'b12', 'b13',
           'b20', 'b21', 'b22', 'b23', 'b31', 'b32'}
FADE_FROM, FADE_TO = 246, 312   # the art fades out above the level line (which starts at 310)

def rounded_mask(radius=13, scale=4):
    m = Image.new('L', (W * scale, H * scale), 0)
    ImageDraw.Draw(m).rounded_rectangle((scale, 0, W * scale - scale - 1, H * scale - 1), radius * scale, fill=255)
    return m.resize((W, H), Image.LANCZOS)
ROUND = rounded_mask()

def clean(path):
    key = path[5:8]
    img = np.asarray(Image.open(path).convert('RGB')).copy()
    f = img.astype(int)
    mask = np.zeros((H, W), np.uint8)
    # The red dot in the top right corner.
    red = (f[..., 0] > 170) & (f[..., 1] < 120) & (f[..., 2] < 120)
    red[30:, :] = False; red[:, :195] = False
    mask |= red.astype(np.uint8)
    # The S mark: its gold letter and number box with their dark outline.
    if key in S_CARDS:
        # Only the mark's own colours: its yellow letter, the white number, and the dark
        # outline and plate around them. Art under the corner (a hat, an ear) is kept.
        y0, y1, x0, x1 = 6, 58, 148, 231
        box = f[y0:y1, x0:x1].astype(float)
        r, g, b = box[..., 0], box[..., 1], box[..., 2]
        lum = box.mean(axis=2)
        yellow = (r > 190) & (g > 150) & (b < 125) & (g / np.maximum(r, 1) > 0.78)
        white = (r > 205) & (g > 205) & (b > 190)
        core = (yellow | white).astype(np.uint8)
        # The whole mark around its letter and number, but not pixels that are clearly art:
        # greys, and colours far from the mark's yellows and browns (purple, green, blue).
        area = cv2.dilate(core, np.ones((15, 15), np.uint8)).astype(bool)
        hsv = cv2.cvtColor(np.clip(box, 0, 255).astype(np.uint8)[None].reshape(box.shape).astype(np.uint8), cv2.COLOR_RGB2HSV).astype(float)
        hue, sat = hsv[..., 0] * 2, hsv[..., 1] / 255
        grey = (sat < 0.22) & (lum > 70) & (lum < 215) & ~white
        far = ((hue < 8) | (hue > 75)) & (sat > 0.2) & (lum > 60)
        mark = area & ~grey & ~far
        mark = cv2.morphologyEx(mark.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
        mask[y0:y1, x0:x1] |= mark
    mask = cv2.dilate(mask, np.ones((5, 5), np.uint8))
    img = cv2.inpaint(img, mask * 255, 6, cv2.INPAINT_TELEA)
    f = img.astype(float)
    # The card's own colour for the bottom, row by row: what the card shows at its left and
    # right edges (the art rarely reaches them), smoothed, so the card keeps its gradient.
    edges = np.concatenate([f[:, 3:9], f[:, W - 9:W - 3]], axis=1)
    per_row = np.median(edges, axis=1)
    k = 31
    padded = np.pad(per_row, ((k, k), (0, 0)), mode='edge')
    smooth = np.stack([np.convolve(padded[:, ch], np.ones(k) / k, mode='same')[k:-k] for ch in range(3)], axis=1)
    out = f.copy()
    for y in range(FADE_FROM, H):
        t = min(1.0, (y - FADE_FROM) / (FADE_TO - FADE_FROM))
        a = t * t * (3 - 2 * t)
        # Below 370 the edges reach the rounded corners and the game's own dark bottom: hold the colour.
        out[y] = out[y] * (1 - a) + smooth[min(y, 370)] * a
    rgba = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).convert('RGBA')
    rgba.putalpha(ROUND)
    return rgba

for p in sorted(glob.glob('card-*.png')):
    clean(p).save('clean-' + p[5:])
