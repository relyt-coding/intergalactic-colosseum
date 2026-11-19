import numpy as np
from PIL import Image
def ink(path):
    im = np.asarray(Image.open(path).convert('RGBA')).astype(int)
    a = im[...,3]; mn = im[...,:3].min(-1)
    return (a > 128) & (mn < 150)
for f in ['max_icon','max_full','vs']:
    m = ink(f'logos/{f}.png')
    ys, xs = np.where(m); print(f, m.shape, 'bbox x', xs.min(), xs.max(), 'y', ys.min(), ys.max())
    Image.fromarray((~m*255).astype(np.uint8)).save(f'logos/{f}_mask.png')
