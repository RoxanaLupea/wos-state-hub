# Fit the portrait's outline (face, side, badge) to the game's, every vertex, corner radius
# and the side's depth, by matching the area pixel for pixel.
import numpy as np, cv2, json
from scipy.optimize import minimize
NW, NH, SS = 168, 206, 6
CX = 85.5
game = np.load('game_mask.npy').astype(np.float32)

def fillet(points, radii, steps=24):
    pts = np.array(points, float); n = len(pts); out = []
    for i in range(n):
        p0, p1, p2 = pts[i - 1], pts[i], pts[(i + 1) % n]
        r = radii[i]
        a = p0 - p1; b = p2 - p1
        la, lb = np.linalg.norm(a), np.linalg.norm(b); a /= la; b /= lb
        ang = np.arccos(np.clip(a @ b, -1, 1))
        if r <= 0 or ang < 1e-3:
            out.append(p1); continue
        d = min(r / np.tan(ang / 2), la * 0.49, lb * 0.49)
        r = d * np.tan(ang / 2)
        t1, t2 = p1 + a * d, p1 + b * d
        bis = a + b; bis /= np.linalg.norm(bis)
        c = p1 + bis * (r / np.sin(ang / 2))
        s1, s2 = np.arctan2(*(t1 - c)[::-1]), np.arctan2(*(t2 - c)[::-1])
        ds = (s2 - s1 + np.pi) % (2 * np.pi) - np.pi
        for k in range(steps + 1):
            s = s1 + ds * k / steps
            out.append(c + r * np.array([np.cos(s), np.sin(s)]))
    return np.array(out)

def fill(poly, scale):
    m = np.zeros((NH * scale, NW * scale), np.uint8)
    cv2.fillPoly(m, [np.round(poly * scale).astype(np.int32)], 255, lineType=cv2.LINE_AA)
    return m

def face_poly(p):
    top, hw, uy, ly, bot, rt, ru, rl, rb = p[:9]
    pts = [(CX, top), (CX + hw, uy), (CX + hw, ly), (CX, bot), (CX - hw, ly), (CX - hw, uy)]
    return fillet(pts, [rt, ru, rl, rb, rl, ru])

def badge_poly(p):
    btop, bhw, by1, by2, bbot, br = p[10:16]
    pts = [(CX, btop), (CX + bhw, by1), (CX + bhw, by2), (CX, bbot), (CX - bhw, by2), (CX - bhw, by1)]
    return fillet(pts, [br] * 6)

def render(p, scale=SS):
    depth = p[9]
    face = fill(face_poly(p), scale)
    shifted = fill(face_poly(p) + np.array([0, depth]), scale)
    badge = fill(badge_poly(p), scale)
    m = np.maximum(np.maximum(face, shifted), badge).astype(np.float32) / 255
    return cv2.resize(m, (NW, NH), interpolation=cv2.INTER_AREA)

def loss(p):
    return np.abs(render(p, 3) - game).sum()

if __name__ == "__main__":
    p0 = np.array([5.0, 81.5, 40.8, 152.5, 188.5, 11, 11, 11, 11, 7.5,
                   147.5, 29.5, 172.0, 185.0, 207.5, 6.5])
    best = minimize(loss, p0, method='Powell', options={'maxiter': 6000, 'xtol': 0.02, 'ftol': 0.01})
    p = best.x
    print('loss before', loss(p0), 'after', loss(p))
    names = ['top', 'half_w', 'upper_y', 'lower_y', 'bottom', 'r_top', 'r_upper', 'r_lower', 'r_bottom', 'depth',
             'badge_top', 'badge_hw', 'badge_y1', 'badge_y2', 'badge_bottom', 'badge_r']
    fitted = dict(zip(names, [round(float(v), 2) for v in p]))
    print(fitted)
    json.dump(fitted, open('fit.json', 'w'))
    # Overlay: game outline in green, fitted outline in red, at 4x.
    over = np.dstack([game * 60] * 3).astype(np.uint8)
    big = cv2.resize(over, (NW * 4, NH * 4), interpolation=cv2.INTER_NEAREST)
    for mask, col in ((game, (0, 255, 0)), ((render(p) > 0.5).astype(np.float32), (255, 60, 60))):
        m = cv2.resize(mask, (NW * 4, NH * 4), interpolation=cv2.INTER_LINEAR) > 0.5
        cnts, _ = cv2.findContours(m.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        cv2.drawContours(big, cnts, -1, col, 1)
    cv2.imwrite('fit.png', big[:, :, ::-1])
