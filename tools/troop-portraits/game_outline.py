# The game's whole portrait outline (frame face, its side and the badge), from all ten
# Infantry and Lancer portraits: a pixel is in when it is in for most of them.
import cv2, numpy as np
from PIL import Image
UP = '/mnt/user-data/uploads/'
NW, NH = 168, 206
crops = []
for path, xs in [(UP + '12acd162-image.png', [61, 260, 459, 658, 858]), (UP + 'd8b464d7-image.png', [61, 260, 459, 658, 858])]:
    shot = np.asarray(Image.open(path).convert('RGB')).astype(int)
    for x in xs:
        crops.append(shot[1366:1366 + NH, x:x + NW])
masks = []
for c in crops:
    lum = c.mean(axis=2); spread = c.max(axis=2) - c.min(axis=2)
    face = (lum > 196) & (spread < 50)
    side = np.abs(c - np.array([155, 172, 206])).sum(axis=2) < 34
    rim = face | side
    rim = cv2.morphologyEx(rim.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    cnts, _ = cv2.findContours(rim, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    m = np.zeros_like(rim); cv2.drawContours(m, [max(cnts, key=cv2.contourArea)], -1, 1, -1)
    masks.append(m)
game = (np.mean(masks, axis=0) >= 0.5).astype(np.uint8)
np.save('game_mask.npy', game)
faces = []
for c in crops:
    lum = c.mean(axis=2); spread = c.max(axis=2) - c.min(axis=2)
    faces.append((lum > 196) & (spread < 50))
np.save('game_face.npy', (np.mean(faces, axis=0) >= 0.5).astype(np.uint8))
Image.fromarray(game * 255).resize((NW * 4, NH * 4), Image.NEAREST).save('game_mask.png')
