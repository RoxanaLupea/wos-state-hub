# Troop portraits with a crisp frame. The hexagon, its frame and the tier badge are drawn
# as exact geometry (measured from the camp screenshots: straight edges, rounded corners),
# at 4 times the output size and scaled down. Only the art inside the frame and the
# numeral inside the badge come from the screenshot.
import cv2
import numpy as np
from PIL import Image
NW, NH = 168, 206                 # the portrait in the screenshot's own pixels
OUT = 2                           # output scale: 336 x 412
SS = 4                            # drawing scale over the output
K = OUT * SS
CX = 85.5
HEX = [(CX, 5.0), (167.0, 40.8), (167.0, 152.5), (CX, 188.5), (4.0, 152.5), (4.0, 40.8)]
# The badge, measured from the game: a diamond with short vertical sides (a tall-pointed
# hexagon), 59 wide, from y 149 to 207, its sides vertical from y 172 to 185.
BADGE_HW = 29.5
BADGE = [(CX, 147.5), (CX + BADGE_HW, 172.0), (CX + BADGE_HW, 185.0), (CX, 207.5), (CX - BADGE_HW, 185.0), (CX - BADGE_HW, 172.0)]
BADGE_CY = 178.5
BADGE_R = 26.0                    # for fitting the numeral: the half-height to the slate's top and bottom
BADGE_RIM = 3.6
FRAME_W = 10.0                    # frame width in screenshot pixels
FRAME_TOP, FRAME_BOTTOM = (243, 246, 251), (220, 229, 243)   # the frame's light lavender, top to bottom
BADGE_EDGE = (228, 234, 247)
BADGE_FILL = (112, 126, 157)
NUMERAL, NUMERAL_EDGE = (250, 250, 250), (52, 60, 82)
NUMERAL_FONT = '/usr/share/fonts/truetype/google-fonts/ofl/roboto/Roboto[wdth,wght].ttf'
NUMERAL_H = 24.0                  # cap height in screenshot pixels, the same on every badge

def numeral_layers(text):
    """The numeral at one height on every badge; a wide one (VIII) is narrowed so the whole
    numeral, outline included, stays inside the badge's slate fill."""
    from PIL import ImageDraw, ImageFont
    size = int(NUMERAL_H * K / 0.711)          # Roboto's cap height is 0.711 em
    font = ImageFont.truetype(NUMERAL_FONT, size)
    font.set_variation_by_axes([660, 80])     # weight 660, width 80 (condensed)
    edge = int(1.0 * K)
    half_h = NUMERAL_H / 2 + 1.0
    # The slate's half-width at the numeral's top and bottom edges (the badge narrows above
    # y 172 and below 185 by 29.5 for every 23), less a margin.
    reach = max(0.0, (BADGE_CY - half_h) - 172.0) and 0.0
    above = max(0.0, 172.0 - (BADGE_CY - half_h)); below = max(0.0, (BADGE_CY + half_h) - 185.0)
    max_half_w = BADGE_HW - BADGE_RIM - 1.6 - max(above, below) * 29.5 / 23.0
    layers = []
    for stroke_w in (edge, 0):
        img = Image.new('L', (size * 4, size * 2), 0)
        d = ImageDraw.Draw(img)
        d.text((size * 2, size), text, font=font, fill=255, anchor='mm', stroke_width=stroke_w, stroke_fill=255)
        layers.append(img)
    box = layers[0].getbbox()
    w = (box[2] - box[0]) / K
    squeeze = min(1.0, (2 * max_half_w) / w)
    out = []
    for img in layers:
        img = img.crop(box)
        nw = max(1, int(round(img.size[0] * squeeze)))
        img = img.resize((nw, img.size[1]), Image.LANCZOS)
        canvas = Image.new('L', (NW * K, NH * K), 0)
        canvas.paste(img, (int(round(CX * K - nw / 2)), int(round(BADGE_CY * K - img.size[1] / 2))))
        out.append(cv2.resize(np.asarray(canvas).astype(np.float32) / 255, (NW * OUT, NH * OUT), interpolation=cv2.INTER_AREA))
    return out

def disk(r):
    r = max(1, int(round(r)))
    return cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))

def shape(points, round_r, shrink=0.0):
    """A filled polygon at drawing scale, shrunk by `shrink` and with its corners rounded."""
    m = np.zeros((NH * K, NW * K), np.uint8)
    cv2.fillPoly(m, [np.round(np.array(points) * K).astype(np.int32)], 255)
    if shrink:
        m = cv2.erode(m, disk(shrink * K))
    r = round_r * K
    m = cv2.dilate(cv2.erode(m, disk(r)), disk(r))
    return m

# The outline, fitted to the game's (ten portraits, pixel for pixel, tools: fit.py):
# every vertex and each corner's own radius.
FACE = dict(top=5.06, hw=82.46, uy=41.65, ly=153.34, bot=190.63,
            r=(12.58, 20.0, 18.38, 13.91))
WINDOW = dict(top=16.41, hw=70.34, uy=49.08, ly=142.61, bot=172.93,
              r=(10.68, 16.44, 11.41, 8.0))
SIDE_DEPTH = 7.57
BADGE_GEOM = dict(top=147.5, hw=29.56, y1=172.0, y2=184.92, bot=207.7, r=6.5)

def fillet(points, radii, steps=32):
    pts = np.array(points, float); n = len(pts); out = []
    for i in range(n):
        p0, p1, p2 = pts[i - 1], pts[i], pts[(i + 1) % n]
        r = radii[i]
        a = p0 - p1; b = p2 - p1
        la, lb = np.linalg.norm(a), np.linalg.norm(b); a /= la; b /= lb
        ang = np.arccos(np.clip(a @ b, -1, 1))
        if r <= 0 or ang < 1e-3:
            out.append(p1); continue
        d = min(r / np.tan(ang / 2), la * 0.49, lb * 0.49); r = d * np.tan(ang / 2)
        t1, t2 = p1 + a * d, p1 + b * d
        bis = a + b; bis /= np.linalg.norm(bis)
        c = p1 + bis * (r / np.sin(ang / 2))
        s1, s2 = np.arctan2(*(t1 - c)[::-1]), np.arctan2(*(t2 - c)[::-1])
        ds = (s2 - s1 + np.pi) % (2 * np.pi) - np.pi
        for k in range(steps + 1):
            out.append(c + r * np.array([np.cos(s1 + ds * k / steps), np.sin(s1 + ds * k / steps)]))
    return np.array(out)

def hexagon(g, dy=0.0):
    pts = [(CX, g['top']), (CX + g['hw'], g['uy']), (CX + g['hw'], g['ly']), (CX, g['bot']), (CX - g['hw'], g['ly']), (CX - g['hw'], g['uy'])]
    rt, ru, rl, rb = g['r']
    return fillet(pts, [rt, ru, rl, rb, rl, ru]) + np.array([0, dy])

def badge_outline():
    g = BADGE_GEOM
    pts = [(CX, g['top']), (CX + g['hw'], g['y1']), (CX + g['hw'], g['y2']), (CX, g['bot']), (CX - g['hw'], g['y2']), (CX - g['hw'], g['y1'])]
    return fillet(pts, [g['r']] * 6)

def filled(poly):
    m = np.zeros((NH * K, NW * K), np.uint8)
    cv2.fillPoly(m, [np.round(poly * K).astype(np.int32)], 255, lineType=cv2.LINE_AA)
    return m

OUTER_HEX = filled(hexagon(FACE))
INNER_HEX = filled(hexagon(WINDOW))
BADGE_OUT = filled(badge_outline())
BADGE_IN = cv2.erode(BADGE_OUT, disk(BADGE_RIM * K))
BADGE_HW = BADGE_GEOM['hw']
def down(m):
    """Drawing scale to output scale, as soft coverage (0..1): crisp, anti-aliased edges."""
    return cv2.resize(m.astype(np.float32) / 255, (NW * OUT, NH * OUT), interpolation=cv2.INTER_AREA)

A_HEX, A_IN, A_BOUT, A_BIN = down(OUTER_HEX), down(INNER_HEX), down(BADGE_OUT), down(BADGE_IN)
# The frame is a slab, as in the game: the light top face (OUTER_HEX), and under its lower
# edges a darker side 7.5 px deep (measured: the face ends at y 154 at x 10 and the side at
# 163; at x 50, 173 and 181).
_down = np.zeros_like(OUTER_HEX); _d = int(round(SIDE_DEPTH * K)); _down[_d:] = OUTER_HEX[:-_d]
SLAB = cv2.max(OUTER_HEX, _down)
A_BEVEL = down(cv2.subtract(SLAB, OUTER_HEX))
A_HEX = down(SLAB)
A_HEX_NATIVE = cv2.resize(SLAB, (NW, NH), interpolation=cv2.INTER_AREA) / 255.0
BEVEL = (155, 172, 206)

RING_NATIVE = cv2.resize(cv2.subtract(OUTER_HEX, INNER_HEX), (NW, NH), interpolation=cv2.INTER_AREA) > 128
OUTSIDE_NATIVE = cv2.resize(OUTER_HEX, (NW, NH), interpolation=cv2.INTER_AREA) < 40
INSIDE_NATIVE = cv2.resize(INNER_HEX, (NW, NH), interpolation=cv2.INTER_AREA) > 128

FRAME_REF = np.load(__import__('pathlib').Path(__file__).with_name('frame_ref.npy'))
# (FRAME_REF: the frame as it looks with no head over it, median of 30)

def head_mask(native):
    """Where the head or helmet crosses the frame, as a smooth shape at the output size."""
    f = np.asarray(native.convert('RGB')).astype(np.float32)
    # In and around the frame: how far each pixel is from the bare frame there.
    diff = np.abs(f - FRAME_REF).sum(axis=2)
    # The camp's background behind this portrait, as a smooth gradient fitted to the pixels
    # outside the frame that are far from anything drawn (its top corners and outer sides).
    face = cv2.resize(OUTER_HEX, (NW, NH), interpolation=cv2.INTER_AREA) / 255.0
    slab = A_HEX_NATIVE
    window = cv2.resize(INNER_HEX, (NW, NH), interpolation=cv2.INTER_AREA) / 255.0
    yy, xx = np.mgrid[0:NH, 0:NW]
    far = (cv2.dilate((slab > 0.02).astype(np.uint8), np.ones((5, 5), np.uint8)) == 0) & (yy < 80)
    far &= (np.abs(xx - CX) > 40)                 # the sides, away from where heads rise
    A = np.stack([np.ones(far.sum()), yy[far] / NH, xx[far] / NW], axis=1)
    coef = np.linalg.lstsq(A, f[far], rcond=None)[0]
    bg = np.stack([np.ones_like(yy, float), yy / NH, xx / NW], axis=-1) @ coef
    bgd = np.abs(f - bg).sum(axis=2)
    in_band = np.clip(slab - window, 0, 1)
    outside = 1 - slab
    prob = np.clip((diff - 18) / 22, 0, 1) * np.clip(in_band + outside * np.clip((bgd - 22) / 22, 0, 1), 0, 1)
    prob[85:] = 0
    # A head crosses the frame: it must cover the frame's band from the window outwards.
    # Things behind the portrait (the big troop model, a gun) only touch the frame's outer
    # edge, so they are kept out: what is outside the frame counts only where it joins a
    # part of the head that already crosses the band.
    cand = (prob > 0.5).astype(np.uint8)
    deep_band = (in_band > 0.85) & (window < 0.05)
    win = (window > 0.5) & (yy < 85)
    n, lab = cv2.connectedComponents((cand & (deep_band | win)).astype(np.uint8) | win.astype(np.uint8), connectivity=8)
    ok = np.unique(lab[win]); band_head = np.isin(lab, ok[ok > 0]) & deep_band & cand.astype(bool)
    # The part outside: joined to the band's head pixels at the frame's outer edge.
    reach = cv2.dilate(band_head.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
    n2, lab2 = cv2.connectedComponents((cand.astype(bool) & ~win & ~deep_band).astype(np.uint8), connectivity=8)
    ok2 = np.unique(lab2[reach & (lab2 > 0)])
    out_head = np.isin(lab2, ok2[ok2 > 0])
    # Above the frame, the scene behind the portrait is kept out by its colour: the big troop
    # model behind the Marksman portraits is red, no helmet or hair rising above is.
    hsv = cv2.cvtColor(np.clip(f, 0, 255).astype(np.uint8), cv2.COLOR_RGB2HSV).astype(float)
    hue, sat = hsv[..., 0] * 2, hsv[..., 1] / 255
    red = ((hue < 18) | (hue > 330)) & (sat > 0.2)
    red = cv2.dilate(red.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
    out_head &= ~red
    slab_top = np.argmax(slab > 0.5, axis=0)
    out_head &= yy >= (slab_top[None, :] - 22)
    # What is left outside must still join the head, and not be a small speck.
    n3, lab3, st3, _ = cv2.connectedComponentsWithStats(out_head.astype(np.uint8), connectivity=8)
    for c in range(1, n3):
        part = lab3 == c
        if st3[c, cv2.CC_STAT_AREA] < 14 or not (cv2.dilate(part.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool) & band_head).any():
            out_head[part] = False
    prob = prob * (band_head | out_head | win)
    # Up to the output size, then a smooth cut: blur and threshold, so the edge follows the
    # helmet's curves without the screenshot's pixel steps.
    big = cv2.resize(prob, (NW * OUT, NH * OUT), interpolation=cv2.INTER_CUBIC)
    big = cv2.GaussianBlur(big, (0, 0), 1.2)
    shape = (big > 0.45).astype(np.uint8)
    shape = cv2.morphologyEx(shape, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))
    shape = cv2.morphologyEx(shape, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    # Keep only what joins the art inside the frame.
    seed = ((A_IN > 0.5) & (np.arange(NH * OUT)[:, None] < 150)).astype(np.uint8)
    n, labels = cv2.connectedComponents(np.maximum(shape, seed), connectivity=8)
    joined = np.unique(labels[seed.astype(bool)])
    shape = (np.isin(labels, joined[joined > 0]) & shape.astype(bool)).astype(np.uint8)
    shape = np.maximum(shape, (A_IN > 0.5).astype(np.uint8) * (np.arange(NH * OUT)[:, None] < 150))   # one shape with the window, no seam
    if (shape * (A_IN < 0.5)).sum() < 40:
        return None
    # A clean anti-aliased edge: the shape drawn at 4x, smoothed, and scaled down.
    up = cv2.resize(shape * 255, (NW * OUT * 4, NH * OUT * 4), interpolation=cv2.INTER_LINEAR)
    up = (cv2.GaussianBlur(up, (0, 0), 3) > 127).astype(np.float32)
    return cv2.resize(up, (NW * OUT, NH * OUT), interpolation=cv2.INTER_AREA)

def portrait(native, numeral=None):
    """native: the portrait cut from the screenshot, NW x NH, RGB."""
    # The game's own badge is under ours: fill it (and its glow) from the art around it, so
    # nothing of it shows past the edge of the one drawn here.
    src = np.asarray(native.convert('RGB')).copy()
    old_badge = cv2.dilate((cv2.resize(BADGE_OUT, (NW, NH), interpolation=cv2.INTER_AREA) > 60).astype(np.uint8), np.ones((7, 7), np.uint8))
    src = cv2.inpaint(src, old_badge * 255, 4, cv2.INPAINT_TELEA)
    art = np.asarray(Image.fromarray(src).resize((NW * OUT, NH * OUT), Image.LANCZOS)).astype(np.float32)
    # Clearer: a light unsharp mask, so the upscale does not look soft.
    blur = cv2.GaussianBlur(art, (0, 0), 1.6)
    art = np.clip(art + (art - blur) * 0.7, 0, 255)
    h, w = A_HEX.shape
    t = np.linspace(0, 1, h)[:, None, None]
    frame_col = np.array(FRAME_TOP, np.float32) * (1 - t) + np.array(FRAME_BOTTOM, np.float32) * t
    rgb = frame_col * np.ones((h, w, 3), np.float32)
    # The frame's underside: a darker band along its lower outer edges, as in the game.
    rgb = rgb * (1 - A_BEVEL[..., None]) + np.array(BEVEL, np.float32) * A_BEVEL[..., None]
    # The art inside the frame (a hair larger than the inner edge, so no seam shows).
    a_art = np.clip(A_IN * 1.0, 0, 1)[..., None]
    rgb = rgb * (1 - a_art) + art * a_art
    # The badge: its light edge, then the screenshot's badge inside it.
    a_be = A_BOUT[..., None]
    rgb = rgb * (1 - a_be) + np.array(BADGE_EDGE, np.float32) * a_be
    a_bi = A_BIN[..., None]
    rgb = rgb * (1 - a_bi) + np.array(BADGE_FILL, np.float32) * a_bi
    # The tier's numeral, drawn: white with a thin dark outline, centred on the badge.
    if numeral:
        stroke, fill = numeral_layers(numeral)
        rgb = rgb * (1 - stroke[..., None]) + np.array(NUMERAL_EDGE, np.float32) * stroke[..., None]
        rgb = rgb * (1 - fill[..., None]) + np.array(NUMERAL, np.float32) * fill[..., None]
    # The head over the frame, as in the game: where the screenshot shows something other
    # than the frame inside the frame's band, or above the frame joined to it, it is the
    # troop's head or helmet, and it is drawn on top.
    head = head_mask(native)
    if head is not None:
        a_h = head[..., None]
        rgb = rgb * (1 - a_h) + art * a_h
    alpha = np.maximum(np.maximum(A_HEX, A_BOUT), head if head is not None else 0)
    out = np.dstack([np.clip(rgb, 0, 255), alpha * 255]).astype(np.uint8)
    return Image.fromarray(out, 'RGBA')

if __name__ == '__main__':
    shot = Image.open('/mnt/user-data/uploads/12acd162-image.png').convert('RGB')
    p = portrait(shot.crop((61, 1366, 61 + NW, 1366 + NH)))
    p.save('test-infantry-t1.png')
    bg = Image.new('RGBA', p.size, (22, 32, 58, 255)); bg.alpha_composite(p)
    src = shot.crop((61, 1366, 61 + NW, 1366 + NH)).resize(p.size, Image.LANCZOS)
    s = Image.new('RGB', (p.size[0] * 2, p.size[1])); s.paste(src, (0, 0)); s.paste(bg.convert('RGB'), (p.size[0], 0))
    s.resize((s.size[0] * 2, s.size[1] * 2), Image.NEAREST).save('test.png')
