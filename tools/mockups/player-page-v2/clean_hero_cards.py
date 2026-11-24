# Clean each hero card cut from the Heroes screen: take off the level, the stars, the S
# mark and the red dot by filling only their own pixels from the art around them, and keep
# the whole card art. The card's edge against the dark panel is trimmed and its corners
# rounded.
import cv2, glob, sys
import numpy as np
from PIL import Image, ImageDraw
H = 408
PANEL = np.array([31, 68, 121])
S_CARDS = {f'a{r}{c}' for r in range(4) for c in range(4)} | {'b00', 'b01', 'b02', 'b03', 'b10', 'b11', 'b12', 'b13',
           'b20', 'b21', 'b22', 'b23', 'b31', 'b32'}

def star_template(path='card-a12.png'):
    # The five star slots, taken from a card with five full stars: the blue petals and
    # their dark outline. Every card has its stars in the same place.
    f = np.asarray(Image.open(path).convert('RGB')).astype(int)
    r, g, b = f[..., 0], f[..., 1], f[..., 2]
    lum = f.mean(axis=2)
    star = ((b > r + 15) | (lum < 115))
    star[:340] = False; star[402:] = False; star[:, :8] = False; star[:, 224:] = False
    star = cv2.morphologyEx(star.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    return cv2.dilate(star, np.ones((5, 5), np.uint8))
STARS = star_template()

def clean(path):
    key = path.split('-')[1][:3]
    img = np.asarray(Image.open(path).convert('RGB')).copy()
    f = img.astype(int)
    W = f.shape[1]
    r, g, b = f[..., 0], f[..., 1], f[..., 2]
    lum = f.mean(axis=2)
    panel = np.abs(f - PANEL).sum(axis=2) < 40
    mask = np.zeros(f.shape[:2], np.uint8)
    # The level: its white or yellow letters and their dark outline.
    fill = ((r > 215) & (g > 215) & (b > 200)) | ((r > 215) & (g > 190) & (b < 170) & (g > 0.85 * r))
    fill[:300] = False; fill[352:] = False; fill[:, :14] = False; fill[:, 180:] = False
    near = cv2.dilate(fill.astype(np.uint8), np.ones((9, 9), np.uint8)).astype(bool)
    text = fill | (near & (lum < 120))
    text = cv2.morphologyEx(text.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    mask |= cv2.dilate(text, np.ones((5, 5), np.uint8))
    # The stars.
    stars = STARS[:, :W] if STARS.shape[1] >= W else np.pad(STARS, ((0, 0), (0, W - STARS.shape[1])))
    # Around each slot, also this card's own petals and outline: blue, dark, or the brown of
    # an empty star (darker and redder than the card around it).
    slot = cv2.dilate(stars, np.ones((9, 9), np.uint8)).astype(bool)
    own = slot & ((b > r + 10) | (lum < 135) | ((r < 185) & (r - b > 40)))
    own[398:] = False; stars = stars.copy(); stars[398:] = 0
    mask |= cv2.dilate(stars | own.astype(np.uint8), np.ones((5, 5), np.uint8))
    # The red dot: first give the corner the card's colour where the panel shows, so the
    # fill does not pull the panel's blue into the card.
    corner = np.zeros_like(panel); corner[:32, W - 36:] = True
    img[panel & corner] = img[24, W - 40]
    red = (r > 170) & (g < 120) & (b < 120) & corner
    mask |= cv2.dilate(red.astype(np.uint8), np.ones((7, 7), np.uint8))
    # The S mark: its yellow letter, white number and the dark outline and plate around
    # them, without the art under the corner (greys, and colours far from the mark's).
    if True:
        # The S mark (a yellow S, a number on a small dark plate) sits on the card's plain
        # background in the top right. Inside its rectangle, every pixel that is not art is
        # given the background colour of its row, taken from the plain background beside it.
        y0, y1, x0, x1 = 0, 64, W - 112, W
        box = img[y0:y1, x0:x1].astype(float)
        br, bg_, bb = box[..., 0], box[..., 1], box[..., 2]
        blum = box.mean(axis=2)
        hsv = cv2.cvtColor(np.clip(box, 0, 255).astype(np.uint8), cv2.COLOR_RGB2HSV).astype(float)
        hue, sat = hsv[..., 0] * 2, hsv[..., 1] / 255
        rect = np.zeros(box.shape[:2], bool); rect[8:55, 112 - 80:112 - 2] = True
        yellow = (br > 190) & (bg_ > 150) & (bb < 125) & (bg_ / np.maximum(br, 1) > 0.78)
        plate = cv2.dilate((blum < 110).astype(np.uint8), np.ones((7, 7), np.uint8)).astype(bool)
        white = (br > 200) & (bg_ > 200) & (bb > 180) & plate
        core = (yellow | white) & rect
        near = cv2.dilate(core.astype(np.uint8), np.ones((9, 9), np.uint8)).astype(bool)
        # The card's own background hue (orange, purple or blue), from its top band.
        # (the most common hue among the bright, coloured pixels of the card's top part)
        top_part = cv2.cvtColor(np.clip(img[0:90], 0, 255).astype(np.uint8), cv2.COLOR_RGB2HSV).astype(float)
        coloured = (top_part[..., 1] > 70) & (top_part[..., 2] > 140)
        counts = np.bincount((top_part[..., 0][coloured]).astype(int), minlength=180)
        card_hue = float(np.argmax(np.convolve(counts, np.ones(5), mode='same'))) * 2
        dh = np.abs(((hue - card_hue) + 180) % 360 - 180)
        orange = (dh < 14) & (sat > 0.25) & (blum > 110)
        art = ~orange & ~near
        # Small specks inside the rectangle that touch no edge are the mark's own edges, not art.
        count, labels, stats, _ = cv2.connectedComponentsWithStats((art & rect).astype(np.uint8), 8)
        for c in range(1, count):
            x, y, w, h, area = stats[c]
            ry, rx = np.nonzero(rect); top_, bot_, left_, right_ = ry.min(), ry.max(), rx.min(), rx.max()
            touches = y <= top_ or y + h - 1 >= bot_ or x <= left_ or x + w - 1 >= right_
            if area < 80 and not touches:
                art[labels == c] = False
        mark = rect & ~art
        if key not in S_CARDS:
            mark[:] = False
        # The red dot in the corner and the card's light edge around it.
        dot = np.zeros(box.shape[:2], bool); dot[:26, -30:] = True
        dot &= ~((box.mean(axis=2) < 120) & (box[..., 2] > box[..., 0]))   # not the dark panel
        mark |= dot
        # Each row's background: the plain orange pixels of that row outside the mark.
        plain = orange & ~cv2.dilate(mark.astype(np.uint8), np.ones((13, 13), np.uint8)).astype(bool)
        # The background is a smooth gradient: fit it from the plain pixels, away from the art
        # (whose shadow darkens the orange next to it) and away from the mark.
        away = ~cv2.dilate((art).astype(np.uint8), np.ones((9, 9), np.uint8)).astype(bool)
        corner_dot = np.zeros(box.shape[:2], bool); corner_dot[:32, -36:] = True
        use = plain & away & ~corner_dot
        ys, xs = np.nonzero(use)
        yy, xx = np.mgrid[0:box.shape[0], 0:box.shape[1]]
        def basis(y, x):
            y = y / box.shape[0]; x = x / box.shape[1]
            return np.stack([np.ones_like(x), x, y, y * y], axis=-1)
        A = basis(ys, xs)
        fit = np.stack([np.linalg.lstsq(A, box[ys, xs, ch], rcond=None)[0] for ch in range(3)], axis=-1)
        surface = basis(yy, xx) @ fit
        # Never outside the colours the plain background actually has.
        low = np.percentile(box[ys, xs], 2, axis=0); high = np.percentile(box[ys, xs], 98, axis=0)
        surface = np.clip(surface, low, high)
        soft = cv2.GaussianBlur(mark.astype(np.float32), (0, 0), 1.2)[..., None]
        soft = np.clip(soft * 1.8, 0, 1)
        img[y0:y1, x0:x1] = np.clip(box * (1 - soft) + surface * soft, 0, 255).astype(np.uint8)
    # Any of the S mark's yellow left at its edges, touching the art: filled from around it.
    if key in S_CARDS:
        ff = img.astype(int); y0, x0 = 0, W - 112
        left = np.zeros(mask.shape, bool)
        sub = ff[4:60, W - 92:W - 2]
        left[4:60, W - 92:W - 2] = (sub[..., 0] > 200) & (sub[..., 1] > 160) & (sub[..., 2] < 150) & (sub[..., 1] > 0.8 * sub[..., 0])
        mask |= cv2.dilate(left.astype(np.uint8), np.ones((5, 5), np.uint8))
    img = cv2.inpaint(img, mask * 255, 7, cv2.INPAINT_TELEA)
    soft = cv2.GaussianBlur(mask.astype(np.float32), (0, 0), 3)[..., None]
    soft = np.clip(soft * 1.5, 0, 1)
    blurred = cv2.GaussianBlur(img, (0, 0), 2.5).astype(np.float32)
    img = (img.astype(np.float32) * (1 - soft) + blurred * soft).astype(np.uint8)
    # The level and the stars sat where the art fades into the card's colour: smooth that
    # band so no outline of them is left, easing in from above the level.
    # First give the panel's blue in the card's corners the card's colour, so the blur does
    # not pull it in.
    pf = img.astype(int)
    blue = (np.abs(pf - PANEL).sum(axis=2) < 60)
    corners = np.zeros(blue.shape, bool); corners[:30, :30] = corners[:30, -30:] = corners[-30:, :30] = corners[-30:, -30:] = True
    corners[:, :4] = corners[:, -4:] = True
    img = cv2.inpaint(img, cv2.dilate((blue & corners).astype(np.uint8), np.ones((3, 3), np.uint8)) * 255, 5, cv2.INPAINT_TELEA)
    # The card's rim (a darker line along its edges) would darken the blur: blur a copy
    # where the rim is replaced by the colour just inside it.
    inner = img.copy()
    inner[392:] = inner[391]
    inner[:, :7] = inner[:, 7:8]; inner[:, -7:] = inner[:, -8:-7]
    smooth = cv2.GaussianBlur(inner, (0, 0), 7).astype(np.float32)
    weight = np.zeros((H, 1, 1), np.float32)
    for y in range(H):
        t = np.clip((y - 296) / 30.0, 0, 1)
        weight[y] = t * t * (3 - 2 * t)
    img = (img.astype(np.float32) * (1 - weight) + smooth * weight).astype(np.uint8)
    # Trim to the card's own edges and round the corners.
    mid = panel[100:300].mean(axis=0) > 0.5
    cols = np.where(~mid)[0]
    left, right = cols[0], cols[-1] + 1
    card = Image.fromarray(img[:, left:right]).resize((232, H), Image.LANCZOS).convert('RGBA')
    m = Image.new('L', (232 * 4, H * 4), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, 232 * 4 - 1, H * 4 - 1), 18 * 4, fill=255)
    card.putalpha(m.resize((232, H), Image.LANCZOS))
    return card

if __name__ == '__main__':
    for p in sorted(glob.glob('card-*.png')):
        clean(p).save('clean-' + p[5:])
