import numpy as np, cv2, json
from scipy.optimize import minimize
from fit_outline import fillet, fill, NW, NH, CX
face = np.load('game_face.npy').astype(np.uint8)
outer = np.load('game_mask.npy').astype(np.uint8)
hole = ((outer == 1) & (face == 0)).astype(np.float32)
hole[148:] = 0                               # the badge is below; the window is above it
# the window: the largest connected region of the hole
n, lab = cv2.connectedComponents((hole > 0).astype(np.uint8))
sizes = [(lab == i).sum() for i in range(1, n)]
win = (lab == 1 + int(np.argmax(sizes))).astype(np.float32)
win = cv2.morphologyEx(win, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))   # heads and white details inside
def poly(p):
    top, hw, uy, ly, bot, rt, ru, rl, rb = p
    pts = [(CX, top), (CX + hw, uy), (CX + hw, ly), (CX, bot), (CX - hw, ly), (CX - hw, uy)]
    return fillet(pts, [rt, ru, rl, rb, rl, ru])
def render(p, s=3):
    m = fill(poly(p), s).astype(np.float32) / 255
    m = cv2.resize(m, (NW, NH), interpolation=cv2.INTER_AREA); m[148:] = 0
    return m
def loss(p): return np.abs(render(p) - win)[:146].sum()
p0 = np.array([15.0, 72.0, 46.0, 140.0, 172.0, 8, 12, 12, 8])
r = minimize(loss, p0, method='Powell', options={'maxiter': 6000, 'xtol': 0.02})
print(loss(p0), loss(r.x))
names = ['top', 'half_w', 'upper_y', 'lower_y', 'bottom', 'r_top', 'r_upper', 'r_lower', 'r_bottom']
fitted = dict(zip(names, [round(float(v), 2) for v in r.x])); print(fitted)
json.dump(fitted, open('fit_inner.json', 'w'))
big = cv2.resize(np.dstack([win * 70] * 3).astype(np.uint8), (NW * 4, NH * 4), interpolation=cv2.INTER_NEAREST)
for mask, col in ((win, (0, 255, 0)), ((render(r.x, 6) > 0.5).astype(np.float32), (255, 60, 60))):
    m = cv2.resize(mask, (NW * 4, NH * 4), interpolation=cv2.INTER_LINEAR) > 0.5
    cnts, _ = cv2.findContours(m.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    cv2.drawContours(big, cnts, -1, col, 1)
cv2.imwrite('fit_inner.png', big[:, :, ::-1])
