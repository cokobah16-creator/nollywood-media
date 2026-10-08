"""Regenerate the NACECA emblem assets from the brand sheet.

Usage (from naceca/):  python3 tools/make_brand_assets.py
Reads   art/brand/naceca_brand_sheet.png  (the brand sheet; the main shield is top-left)
Writes  art/brand/naceca_shield.png        the shield cut out, transparent, native size
        src/assets/title/naceca_badge.png  title-screen badge (4:5 canvas, matches the 4.4 x 5.5 plane in boot.js)
        art/brand/hud_shield.png           HUD badge (inlined into styles.css as .naceca-shield)
        art/brand/splash_shield.png        loading-splash emblem (inlined into index.html #boot-splash)
        favicon.png                        64 x 64 browser tab icon      } real files, not data URIs: Safari before 26
        apple-touch-icon.png               180 x 180 home-screen icon    } ignores data: icons. vercel.json copies them.
Then run python3 encode_assets.py and python3 build.py. If the HUD or splash image changed,
re-inline it (--print-data-uris prints both).
"""
import base64, io, os, sys
from collections import deque
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SHEET = os.path.join(ROOT, "art/brand/naceca_brand_sheet.png")
SHIELD_BOX = (118, 38, 466, 530)   # main shield on the sheet, with margin
BG_THRESH = 78                     # max channel value still counted as navy background


def cut_out(img, box, thresh=BG_THRESH):
    """Flood-fill the dark navy background inward from the crop edges; the gold rim stops
    the fill, so the emblem's own navy interior is kept. Edges get alpha from brightness."""
    im = img.convert("RGB").crop(box)
    a = np.asarray(im).astype(np.int32)
    h, w, _ = a.shape
    mx = a.max(axis=2)
    bgish = (mx < thresh) & (a[:, :, 2] >= a[:, :, 0])
    bg = np.zeros((h, w), bool)
    q = deque((y, x) for y in range(h) for x in (0, w - 1) if bgish[y, x])
    q.extend((y, x) for x in range(w) for y in (0, h - 1) if bgish[y, x])
    for y, x in q: bg[y, x] = True
    while q:
        y, x = q.popleft()
        for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
            if 0 <= ny < h and 0 <= nx < w and not bg[ny, nx] and bgish[ny, nx]:
                bg[ny, nx] = True; q.append((ny, nx))
    alpha = np.where(bg, 0.0, 1.0)
    near = (np.asarray(Image.fromarray((~bg).astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(5))) > 0) & bg
    alpha[near] = np.clip((mx - 30) / (thresh + 10), 0, 1)[near]
    A = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))
    out = im.convert("RGBA"); out.putalpha(A)
    return out.crop(out.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox())


def fit(shield, height):
    w = round(shield.width * height / shield.height)
    return shield.resize((w, height), Image.LANCZOS)


def on_canvas(shield, size, bg=None, pad=0):
    W, H = size
    s = fit(shield, H - 2 * pad)
    if s.width > W - 2 * pad:
        s = s.resize((W - 2 * pad, round(s.height * (W - 2 * pad) / s.width)), Image.LANCZOS)
    c = Image.new("RGBA", size, (0, 0, 0, 0))
    if bg:
        top, bot = bg
        g = Image.new("RGBA", (1, H))
        for y in range(H):
            t = y / max(1, H - 1)
            g.putpixel((0, y), tuple(round(top[i] + (bot[i] - top[i]) * t) for i in range(3)) + (255,))
        c = g.resize(size)
    c.alpha_composite(s, ((W - s.width) // 2, (H - s.height) // 2))
    return c


def save(img, rel):
    p = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    img.save(p, optimize=True)
    print(f"  {rel:40s} {img.size[0]}x{img.size[1]}  {os.path.getsize(p):,} B")
    return p


def data_uri(path):
    return "data:image/png;base64," + base64.b64encode(open(path, "rb").read()).decode("ascii")


if __name__ == "__main__":
    shield = cut_out(Image.open(SHEET), SHIELD_BOX)
    save(shield, "art/brand/naceca_shield.png")
    H = shield.height + 2
    save(on_canvas(shield, (round(H * 0.8), H)), "src/assets/title/naceca_badge.png")
    hud = save(fit(shield, 144), "art/brand/hud_shield.png")
    splash = save(fit(shield, 300), "art/brand/splash_shield.png")
    save(on_canvas(shield, (64, 64)), "favicon.png")
    save(on_canvas(shield, (180, 180), bg=((24, 40, 74), (8, 16, 34)), pad=16), "apple-touch-icon.png")
    if "--print-data-uris" in sys.argv:
        for name, p in (("hud", hud), ("splash", splash)):
            print(f"{name}={data_uri(p)}")
