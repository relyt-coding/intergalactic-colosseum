import numpy as np, json, potrace
from scipy import ndimage
from PIL import Image
from matplotlib.path import Path as MPath
exec(open('masks.py').read().split('for f in')[0])

def dp(pts, eps):
    pts = np.asarray(pts)
    if len(pts) < 3: return pts
    a, b = pts[0], pts[-1]; d = b - a; L = np.hypot(*d)
    r = pts - a
    dist = np.abs(d[0]*r[:,1] - d[1]*r[:,0]) / L if L > 1e-9 else np.hypot(r[:,0], r[:,1])
    i = int(np.argmax(dist))
    if dist[i] > eps: return np.vstack([dp(pts[:i+1], eps)[:-1], dp(pts[i:], eps)])
    return np.array([a, b])

def bez(p0, c1, c2, p3, n=8):
    t = np.linspace(0, 1, n)[1:, None]
    return (1-t)**3*p0 + 3*(1-t)**2*t*c1 + 3*(1-t)*t**2*c2 + t**3*p3

def trace(mask, scale=0.5, eps=0.6):
    im = Image.fromarray(mask.astype(np.uint8)*255).resize((int(mask.shape[1]*scale), int(mask.shape[0]*scale)), Image.LANCZOS)
    m = np.asarray(im) > 127
    path = potrace.Bitmap(~m).trace(turdsize=8, alphamax=1.0, opticurve=True, opttolerance=0.2)
    polys = []
    P = lambda q: np.array([q.x, q.y], dtype=float) if hasattr(q, 'x') else np.array(q, dtype=float)
    for c in path:
        pts = [P(c.start_point)]
        cur = P(c.start_point)
        for s in c.segments:
            if s.is_corner:
                pts += [P(s.c), P(s.end_point)]
            else:
                pts += list(bez(cur, P(s.c1), P(s.c2), P(s.end_point)))
            cur = P(s.end_point)
        p = dp(np.array(pts, dtype=float), eps)
        if len(p) >= 3: polys.append(p / scale)
    # nesting
    areas = [abs(0.5*np.sum(p[:-1,0]*p[1:,1]-p[1:,0]*p[:-1,1])) for p in polys]
    mp = [MPath(p) for p in polys]
    parents = []
    for i, p in enumerate(polys):
        cont = [j for j in range(len(polys)) if j != i and areas[j] > areas[i] and mp[j].contains_point(p[0])]
        parents.append(cont)
    shapes = {}
    for i in range(len(polys)):
        if len(parents[i]) % 2 == 0: shapes[i] = {'outer': polys[i], 'holes': []}
    for i in range(len(polys)):
        if len(parents[i]) % 2 == 1:
            par = min(parents[i], key=lambda j: areas[j])
            if par in shapes: shapes[par]['holes'].append(polys[i])
    return list(shapes.values())

def pack(shapes, cx, cy, s):
    f = lambda p: [[round((x-cx)*s, 4), round(-(y-cy)*s, 4)] for x, y in p]
    return [{'o': f(sh['outer']), 'h': [f(h) for h in sh['holes']]} for sh in shapes]

out = {}
def add(name, mask, sil=False, ref=None):
    ys, xs = np.where(mask)
    cx, cy = (xs.min()+xs.max())/2, (ys.min()+ys.max())/2
    w, h = xs.max()-xs.min(), ys.max()-ys.min()
    s = 1.0 / max(w, h)
    sh = trace(mask)
    d = {'w': round(w*s, 4), 'h': round(h*s, 4), 'shapes': pack(sh, cx, cy, s)}
    if sil == 'hull':  # filled backing from the convex hull of the lowest shape (the Maximus shield)
        from scipy.spatial import ConvexHull
        low = max(sh, key=lambda q: q['outer'][:,1].max())
        hp = low['outer'][ConvexHull(low['outer']).vertices]
        d['sil'] = pack([{'outer': hp, 'holes': []}], cx, cy, s)
    elif sil:  # silhouette: outer contour of the largest shape, no holes
        big = max(sh, key=lambda q: len(q['outer']))
        d['sil'] = pack([{'outer': big['outer'], 'holes': []}], cx, cy, s)
    out[name] = d
    print(name, len(sh), 'shapes', sum(len(q['outer'])+sum(len(hh) for hh in q['holes']) for q in sh), 'pts')

icon = ink('logos/max_icon.png')
lab, n = ndimage.label(icon)
add('scales', (lab == 2) | (lab == 3))
add('maxIcon', icon, sil='hull')
add('vs', ink('logos/vs.png'), sil=True)
full = ink('logos/max_full.png'); full[:930] = False
add('wordmark', full)
# keep relative scale info for composing scales + vs: store scales bbox in icon px
ys, xs = np.where((lab == 2) | (lab == 3)); print('scales bbox', xs.min(), xs.max(), ys.min(), ys.max())
json.dump(out, open('logos.json', 'w'), separators=(',', ':'))
import os; print(os.path.getsize('logos.json'))
