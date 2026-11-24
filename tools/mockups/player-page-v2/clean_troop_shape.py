# One clean shape for every troop portrait: the hexagon (the convex hull of its light
# frame) and the tier badge under it (a diamond), without the camp background that the
# old shape let through below the hexagon's lower edges.
import cv2, sys
import numpy as np
from PIL import Image
def clean_shape(im):
    f = np.asarray(im.convert('RGBA')).astype(int)
    a = f[..., 3] > 128
    lum = f[..., :3].mean(axis=2); spread = f[..., :3].max(axis=2) - f[..., :3].min(axis=2)
    frame = a & (lum > 190) & (spread < 60)
    yy, xx = np.mgrid[0:a.shape[0], 0:a.shape[1]]
    frame &= ~((yy > 100) & (np.abs(xx - 60) < 30))   # not the badge's own white edge
    ys, xs = np.nonzero(frame)
    hull = cv2.convexHull(np.stack([xs, ys], axis=1).astype(np.int32))
    mask = np.zeros(a.shape, np.uint8)
    cv2.fillConvexPoly(mask, hull, 255)
    # The badge: a diamond centred under the hexagon.
    cx = 60
    badge = np.array([[cx, 104], [cx + 24, 127], [cx, 147], [cx - 24, 127]], np.int32)
    cv2.fillConvexPoly(mask, badge, 255)
    mask = cv2.GaussianBlur(mask, (3, 3), 0.7)
    return Image.fromarray(np.minimum(mask, (a * 255).astype(np.uint8)))
if __name__ == '__main__':
    for p in sys.argv[1:]:
        im = Image.open(p).convert('RGBA'); im.putalpha(clean_shape(im)); im.save(p)
