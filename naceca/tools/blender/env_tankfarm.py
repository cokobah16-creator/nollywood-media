"""NACECA S2 · Riverstone tank farm on the Port Harcourt waterfront (keys 'tankfarm' dusk 17:40, 'tankfarm_n' night 23:30).

A walled petroleum depot on the Bonny River (north = -z = the river, south = +z = the gate road).
South: the gate road, the sliding steel gate (0, 24), the gatehouse and boom. West: the two-storey admin block
(enterable ground floor: reception + the manager's office), the QC lab shed, the drum store; north-west on the
waterfront the boat drivers' union shed with passenger boats below the quay. Middle: the truck loading gantry with
two tankers. East: four white storage tanks T1-T4 in two concrete bunds, the pump manifold between them, pipe racks
to the gantry and to the jetty. North: the concrete jetty (finger pier + berth strip) with the loading arm and the
rusty barge TEKENA 2 moored along x. Beyond the west wall a stilt settlement on the creek; a gas flare far away NNE.

    cd /tmp && python3 ROOT/blender/env_tankfarm.py ROOT/art13/work [samples] [night]

'night' changes only lights and glows (+ the night panorama/water materials, + raid anchors) and writes 'tankfarm_n'.
Dynamic nodes: Glows, GlowsCool, GlowsRed (lamps, windows, screens, LEDs), Water, Pano, Flare, Razor (alpha-tested
razor wire), Glass, Gate (sliding leaf), Boom (barrier arm), CashDoor (barge deckhouse door).
"""
import sys, os, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from envkit import Kit, G, lin
import kit2

OUT = sys.argv[1]
SAMPLES = int(sys.argv[2]) if len(sys.argv) > 2 else 80
NIGHT = len(sys.argv) > 3 and sys.argv[3].lower().startswith('n')
KEY = 'tankfarm_n' if NIGHT else 'tankfarm'
K = Kit(KEY, OUT); kit2.use(K, 5150)
from kit2 import *
kit2.bank_y = lambda x, z: 0.0
_fin0 = K._finish
TOPM = [False]
def _finish_clean(*a, **kw):
    ob = _fin0(*a, **kw); me = ob.data
    while len(me.uv_layers) > 1: me.uv_layers.remove(me.uv_layers[-1])   # quads carry an empty 2nd layer (exports as a junk TEXCOORD_2)
    if TOPM[0] and ob.get('lm') is None: ob['lm'] = 'top'
    if ob in K.static and sum(p.area * max(0.0, p.normal.z) for p in me.polygons) < 1e-4:
        ob['lm'] = 'auto'        # nothing faces up (a small wall sign / quad): a top-down island would be a zero-area line (baked black)
    return ob
K._finish = _finish_clean
import bpy, bmesh
from mathutils import Vector

class TOP:
    """objects created inside `with TOP():` get one compact top-down lightmap island each (small props)"""
    def __enter__(self): self.p = TOPM[0]; TOPM[0] = True
    def __exit__(self, *a): TOPM[0] = self.p

class Batch:
    """many small parts merged into one static object (one lightmap island in 'top' mode), per-face vertex colours"""
    def __init__(self, lm='top'): self.v, self.f, self.c, self.lm = [], [], [], lm
    def face(self, pts, col):
        i = len(self.v); self.v += list(pts); self.f.append(tuple(range(i, i + len(pts)))); self.c.append(col)
    def box(self, x0, x1, y0, y1, z0, z1, col, faces='xXYzZ', T=None):
        P = (lambda x, y, z: T(x, y, z)) if T else (lambda x, y, z: (x, y, z))
        F = {'Y': [(x0, y1, z0), (x0, y1, z1), (x1, y1, z1), (x1, y1, z0)], 'y': [(x0, y0, z0), (x1, y0, z0), (x1, y0, z1), (x0, y0, z1)],
             'X': [(x1, y0, z0), (x1, y1, z0), (x1, y1, z1), (x1, y0, z1)], 'x': [(x0, y0, z1), (x0, y1, z1), (x0, y1, z0), (x0, y0, z0)],
             'Z': [(x1, y0, z1), (x1, y1, z1), (x0, y1, z1), (x0, y0, z1)], 'z': [(x0, y0, z0), (x0, y1, z0), (x1, y1, z0), (x1, y0, z0)]}
        for k in faces: self.face([P(*p) for p in F[k]], col)
    def cbox(self, cx, y0, cz, w, h, d, col, rot=0.0, faces='xXYzZ'):
        """a box centred on (cx, cz), bottom y0, rotated about y"""
        c, s = math.cos(rot), math.sin(rot)
        T = lambda lx, ly, lz: (cx + lx * c + lz * s, ly, cz - lx * s + lz * c)
        self.box(-w / 2, w / 2, y0, y0 + h, -d / 2, d / 2, col, faces, T)
    def prism(self, cx, y0, cz, r, h, col, n=6, r2=None, top=True, a0=0.0):
        r2 = r if r2 is None else r2
        ring = [(math.cos(a0 + 2 * PI * i / n), math.sin(a0 + 2 * PI * i / n)) for i in range(n)]
        for i in range(n):
            (c0, s0), (c1, s1) = ring[i], ring[(i + 1) % n]
            self.face([(cx + c0 * r, y0, cz + s0 * r), (cx + c0 * r2, y0 + h, cz + s0 * r2), (cx + c1 * r2, y0 + h, cz + s1 * r2), (cx + c1 * r, y0, cz + s1 * r)], col)
        if top: self.face([(cx + c * r2, y0 + h, cz + s * r2) for (c, s) in reversed(ring)], col)
    def tube(self, p0, p1, r, col, n=8, caps=True, r1=None):
        a, b = Vector(p0), Vector(p1); d = (b - a).normalized(); r1 = r if r1 is None else r1
        up = Vector((0, 1, 0)) if abs(d.y) < 0.95 else Vector((1, 0, 0))
        u = d.cross(up).normalized(); v = d.cross(u).normalized()
        dirs = [u * math.cos(2 * PI * i / n) + v * math.sin(2 * PI * i / n) for i in range(n)]
        ra = [a + q * r for q in dirs]; rb = [b + q * r1 for q in dirs]
        for i in range(n):
            j = (i + 1) % n
            self.face([tuple(ra[i]), tuple(ra[j]), tuple(rb[j]), tuple(rb[i])], col)
        if caps:
            self.face([tuple(p) for p in reversed(ra)], col); self.face([tuple(p) for p in rb], col)
    def emit(self):
        if not self.f: return None
        ob = poly(self.v, self.f, 'plain', '#ffffff', lm=self.lm)
        ca = ob.data.color_attributes['Col']; vals = []
        for p, col in zip(ob.data.polygons, self.c):
            cc = lin(col)
            vals += [cc[0], cc[1], cc[2], 1.0] * p.loop_total
        ca.data.foreach_set('color', vals)
        bm = bmesh.new(); bm.from_mesh(ob.data)                     # weld coincident corners so each part is one UV island
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
        bm.to_mesh(ob.data); bm.free()
        self.v, self.f, self.c = [], [], []
        return ob

RG = random.Random(5151)          # geometry randomness: identical for dusk and night (never drawn inside light-only code)
PI = math.pi

# which light groups are on
DUSK_ON = {'gatehouse', 'office', 'gantry', 'lab', 'street', 'screens', 'kiosk'}
NIGHT_ON = DUSK_ON | {'floods', 'barge', 'union', 'office_up', 'jettyhut', 'settle', 'aviation'}
def on(g): return g in (NIGHT_ON if NIGHT else DUSK_ON)

def bchair(B, x, z, rot, col):
    """mono-block plastic chair into a Batch; rot = the way the sitter faces"""
    c, s = math.cos(rot), math.sin(rot)
    T = lambda lx, ly, lz: (x + lx * c + lz * s, ly, z - lx * s + lz * c)
    B.box(-0.22, 0.22, 0.40, 0.44, -0.21, 0.21, col, 'xXYyzZ', T)
    B.box(-0.22, 0.22, 0.44, 0.86, -0.24, -0.2, shade(col, 0.95), 'xXYzZ', T)
    for (dx, dz) in [(-0.19, 0.17), (0.19, 0.17), (-0.19, -0.19), (0.19, -0.19)]:
        B.box(dx - 0.022, dx + 0.022, 0.0, 0.40, dz - 0.022, dz + 0.022, shade(col, 0.9), 'xXzZ', T)

def btable(B, x, z, rot, col, w=0.8, d=0.8, h=0.72, collide=True):
    c, s = math.cos(rot), math.sin(rot)
    T = lambda lx, ly, lz: (x + lx * c + lz * s, ly, z - lx * s + lz * c)
    B.box(-w / 2, w / 2, h - 0.04, h, -d / 2, d / 2, col, 'xXYyzZ', T)
    for (sx, sz) in [(-1, -1), (1, -1), (1, 1), (-1, 1)]:
        lx, lz = sx * (w / 2 - 0.06), sz * (d / 2 - 0.06)
        B.box(lx - 0.025, lx + 0.025, 0.0, h - 0.04, lz - 0.025, lz + 0.025, shade(col, 0.9), 'xXzZ', T)
    if collide: K._collide((x, 0, z), (w, 1, d), rot, True, False)

def chair(x, z, rot, color='#d8d4cc'):
    B = Batch(); bchair(B, x, z, rot, color); B.emit()

def ptable(x, z, rot=0.0, color='#dcd8d0', w=0.8, d=0.8, h=0.72):
    B = Batch(); btable(B, x, z, rot, color, w, d, h); B.emit()

def stool(x, z, color='#6a4a2c', h=0.42):
    B = Batch(); B.box(x - 0.17, x + 0.17, h - 0.04, h, z - 0.17, z + 0.17, color, 'xXYyzZ')
    for dx, dz in [(-0.13, -0.13), (0.13, -0.13), (0.13, 0.13), (-0.13, 0.13)]: B.box(x + dx - 0.02, x + dx + 0.02, 0, h - 0.04, z + dz - 0.02, z + dz + 0.02, shade(color, 0.85), 'xXzZ')
    B.emit()

def umbrella(x, z, r=1.2, h=2.3, c1='#c82a2a', c2='#f0e8d8', y0=0.0):
    B = Batch(); n = 8; top = (x, y0 + h + 0.25, z)
    B.tube((x, y0, z), (x, y0 + h + 0.2, z), 0.02, '#d8d8d8', n=3, caps=False)
    rim = [(x + math.cos(2 * PI * i / n) * r, y0 + h - 0.12, z + math.sin(2 * PI * i / n) * r) for i in range(n)]
    for i in range(n):
        j = (i + 1) % n; col = c1 if i % 2 == 0 else c2
        B.face([top, rim[j], rim[i]], col); B.face([(top[0], top[1] - 0.02, top[2]), (rim[i][0], rim[i][1] - 0.02, rim[i][2]), (rim[j][0], rim[j][1] - 0.02, rim[j][2])], shade(col, 0.85))
    B.emit()
    K._collide((x, 0, z), (0.12, 2, 0.12), 0, True, False)

def palm(x, z, h=8.0, lean=(0.6, 0.2), fronds=9, seed=1, y0=0.0, green='#2a4a24'):
    """coconut palm in one batch: tapering trunk, crown, drooping fronds (two-sided)"""
    rr = random.Random(seed); B = Batch(); segs = 5
    pts = [(x + lean[0] * (i / segs) ** 2, y0 + h * i / segs, z + lean[1] * (i / segs) ** 2) for i in range(segs + 1)]
    for i in range(segs):
        B.tube(pts[i], pts[i + 1], 0.17 - 0.06 * i / segs, '#5a4a38', n=5, caps=False, r1=0.17 - 0.06 * (i + 1) / segs)
    top = pts[-1]
    B.prism(top[0], top[1] - 0.45, top[2], 0.28, 0.5, '#3a3020', n=6)
    for k in range(fronds):
        a = 2 * PI * k / fronds + rr.random() * 0.3
        L = 2.6 + rr.random() * 0.9; droop = 0.5 + rr.random() * 0.9
        ca, sa = math.cos(a), math.sin(a); px, pz = -sa * 0.5, ca * 0.5
        p1 = (top[0] + ca * L * 0.5, top[1] + 0.4 - droop * 0.2, top[2] + sa * L * 0.5)
        p2 = (top[0] + ca * L, top[1] - droop, top[2] + sa * L)
        col = jitter(green, 0.15)
        for (q0, q1, w0, w1) in [(top, p1, 0.1, 1.0), (p1, p2, 1.0, 0.12)]:
            quad = [(q0[0] - px * w0, q0[1], q0[2] - pz * w0), (q0[0] + px * w0, q0[1], q0[2] + pz * w0), (q1[0] + px * w1, q1[1] - 0.05, q1[2] + pz * w1), (q1[0] - px * w1, q1[1] - 0.05, q1[2] - pz * w1)]
            B.face(quad, col); B.face(list(reversed(quad)), shade(col, 0.8))
    B.emit()
    K._collide((x, 0, z), (0.4, 2, 0.4), 0, True, False)

WIRES = Batch()
def wire(p0, p1, sag=0.3, n=6, t=0.014, color='#101010'):
    pts = catenary(p0, p1, sag, n)
    for a, b in zip(pts, pts[1:]): WIRES.tube(a, b, t / 2, color, n=3, caps=False)
    return pts

# ================================================================== materials (bounce albedo for the bake)
for n, b in [('tf_yard', '#8c8882'), ('tf_ground', '#6e6254'), ('tf_wall', '#cfc6b2'), ('tf_tank', '#d6d6d0'), ('tf_roof', '#c4c2bc'),
             ('tf_rust', '#6a3c26'), ('tf_deck', '#4a3428'), ('tf_signs', '#a09a90'), ('tf_boards', '#b0a890'), ('tf_tiles', '#c8c0b0'),
             ('tf_mud', '#463a2e'), ('tf_grating', '#4a4a48'), ('tf_hazard', '#b89420'), ('tf_office', '#e2ded2'), ('tf_office_in', '#e6e0d0'),
             ('tf_lab', '#e6e6de'), ('tf_quay', '#8e8c86'), ('tf_gatehse', '#d8dcd4'), ('tf_shack', '#6a5440'), ('tf_road', '#3e3d3b'),
             ('tf_bund', '#7a766e'), ('tf_firetank', '#a83428'), ('tf_cabinet', '#7a7e84'), ('tf_nbtank', '#a8b0a4')]:
    K.mat(n, base=b)
for n, b in [('tf_gatepaint', '#33443a'), ('tf_gatedark', '#1e2420'), ('tf_boomred', '#c0261c'), ('tf_boomwhite', '#e8e6e0'), ('tf_doorrust', '#6a3a26')]:
    K.mat(n, base=b, tex=False)              # flat-coloured dynamic parts (colour travels in the GLB material)
K.mat('glass', base='#7f97bd'); K.mat('tf_razor', base='#808080'); K.mat('tf_flame', base='#ff8a30'); K.mat('tf_bars', base='#303030')

# ================================================================== small helpers
def bx(x0, x1, y0, y1, z0, z1, color, faces='xXYzZ', **kw):
    return cube(x0, x1, y0, y1, z0, z1, 'plain', color, faces=faces, **kw)

def pipe(p0, p1, d, color='#9a9c9a', sides=6):
    return beam(p0, p1, d, 'plain', color, sides=sides)

def path_pipe(pts, d, color='#9a9c9a', sides=6):
    """a pipe run as one batch (one lightmap island): straight tubes + a block at every bend"""
    B = Batch()
    for a, b in zip(pts, pts[1:]): B.tube(a, b, d / 2, color, n=sides, caps=False)
    for p in pts[1:-1]: B.box(p[0] - d * 0.58, p[0] + d * 0.58, p[1] - d * 0.58, p[1] + d * 0.58, p[2] - d * 0.58, p[2] + d * 0.58, shade(color, 0.92))
    B.emit()

def valve(x, y, z, d=0.3, axis='x', color='#3a5a9a', wheel='#c02a20', up=0.45):
    """a gate valve on a horizontal pipe: body, bonnet and a handwheel on top (one batch)"""
    B = Batch(); h = d * 0.65
    if axis == 'x': B.tube((x - h, y, z), (x + h, y, z), d * 0.75, '#4a4c4e', n=8)
    else: B.tube((x, y, z - h), (x, y, z + h), d * 0.75, '#4a4c4e', n=8)
    B.box(x - d * 0.45, x + d * 0.45, y, y + d * 0.5 + up * 0.5, z - d * 0.45, z + d * 0.45, color, 'xXYzZ')
    B.prism(x, y + d * 0.5 + up * 0.5, z, 0.025, up * 0.5 + d * 0.1, '#6a6c6e', n=4, top=False)
    B.prism(x, y + up + d * 0.4, z, d * 0.7, 0.05, wheel, n=10)
    B.emit()

def T_(x, z, rot):
    c, s = math.cos(rot), math.sin(rot)
    return lambda lx, ly, lz: (x + lx * c + lz * s, ly, z - lx * s + lz * c)

def lampbox(pos, size, color, lit, kind='Glows', off='#9a9890', rot=0.0):
    if lit: return gbox(pos, size, color, kind=kind, rot=rot)
    return K.box(pos, size, 'plain', off, rot=rot)

def lampquad(x, y, z, w, h, rot, color, lit, kind='Glows', off='#22262a'):
    if lit: return gquad(x, y, z, w, h, rot, color, kind=kind)
    return quadv(x, y, z, w, h, rot, 'plain', off)

def sign(x, y, z, w, h, rot, cell, back=None, mat='tf_signs', W=1024, H=1024):
    """a board: the atlas cell on the front (facing rot) and, if back is given, a plain back"""
    quadv(x, y, z, w, h, rot, mat, uvrect=atlas(*cell, W=W, H=H))
    if back:
        c, s = math.sin(rot), math.cos(rot)
        quadv(x - c * 0.012, y, z - s * 0.012, w, h, rot + PI, 'plain', back)

def board(x, y, z, w, h, rot, cell, back=None):
    sign(x, y, z, w, h, rot, cell, back, mat='tf_boards', W=1024, H=512)

def subtract(rect, holes):
    """axis-aligned rect (x0,x1,z0,z1) minus holes -> list of rects (grid split, rows merged)"""
    x0, x1, z0, z1 = rect
    xs = sorted({x0, x1} | {v for h in holes for v in (h[0], h[1]) if x0 < v < x1})
    zs = sorted({z0, z1} | {v for h in holes for v in (h[2], h[3]) if z0 < v < z1})
    out = []
    for j in range(len(zs) - 1):
        row = []
        for i in range(len(xs) - 1):
            cx, cz = (xs[i] + xs[i + 1]) / 2, (zs[j] + zs[j + 1]) / 2
            if any(h[0] <= cx <= h[1] and h[2] <= cz <= h[3] for h in holes): continue
            if row and abs(row[-1][1] - xs[i]) < 1e-6: row[-1][1] = xs[i + 1]
            else: row.append([xs[i], xs[i + 1], zs[j], zs[j + 1]])
        out += row
    return out

def ground(rect, mat, y=0.0, uv=0.25, holes=()):
    for (a, b, c, d) in subtract(rect, list(holes)):
        cube(a, b, y - 0.01, y, c, d, mat, uv=uv, faces='Y')

def circle_obstacle(cx, cz, r):
    for (dz0, dz1, hw) in [(-0.4, 0.4, 1.0), (0.4, 0.8, 0.917), (-0.8, -0.4, 0.917), (0.8, 1.0, 0.6), (-1.0, -0.8, 0.6)]:
        K.obstacle(round(cx, 3), round(cz + (dz0 + dz1) / 2 * r, 3), round(2 * hw * r, 3), round((dz1 - dz0) * r, 3))

def rail_run(pts, h=1.05, post_every=1.6, color='#c8a828', mid=True, t=0.045):
    """a handrail along a polyline at height h above each point (posts + top rail + mid rail)"""
    for a, b in zip(pts, pts[1:]):
        beam((a[0], a[1] + h, a[2]), (b[0], b[1] + h, b[2]), t, 'plain', color, sides=3)
        if mid: beam((a[0], a[1] + h * 0.5, a[2]), (b[0], b[1] + h * 0.5, b[2]), t * 0.8, 'plain', color, sides=3)
        L = math.dist((a[0], a[2]), (b[0], b[2])); n = max(1, int(L / post_every))
        for k in range(n):
            f = k / n; p = [a[i] + (b[i] - a[i]) * f for i in range(3)]
            beam((p[0], p[1], p[2]), (p[0], p[1] + h, p[2]), t, 'plain', color, sides=3)
    p = pts[-1]; beam((p[0], p[1], p[2]), (p[0], p[1] + h, p[2]), t, 'plain', color, sides=3)

def brail(B, pts, h=1.05, post_every=1.6, color='#c8a828', mid=True, r=0.022):
    """rail_run into a Batch (one island)"""
    for a, b in zip(pts, pts[1:]):
        B.tube((a[0], a[1] + h, a[2]), (b[0], b[1] + h, b[2]), r, color, n=3, caps=False)
        if mid: B.tube((a[0], a[1] + h * 0.5, a[2]), (b[0], b[1] + h * 0.5, b[2]), r * 0.8, color, n=3, caps=False)
        L = math.dist((a[0], a[2]), (b[0], b[2])); n = max(1, int(L / post_every))
        for k in range(n):
            f = k / n; p = [a[i] + (b[i] - a[i]) * f for i in range(3)]
            B.tube((p[0], p[1], p[2]), (p[0], p[1] + h, p[2]), r, color, n=3, caps=False)
    p = pts[-1]; B.tube((p[0], p[1], p[2]), (p[0], p[1] + h, p[2]), r, color, n=3, caps=False)

def fire_ext(x, z, y=0.0, big=False):
    B = Batch()
    if big:
        B.prism(x, y + 0.12, z, 0.2, 0.85, '#c0201a', n=8)
        for dz in (-0.2, 0.2): B.tube((x - 0.21, y + 0.15, z + dz), (x - 0.15, y + 0.15, z + dz), 0.15, '#1a1a1a', n=8)
        B.tube((x + 0.15, y + 0.6, z), (x + 0.5, y + 1.0, z), 0.02, '#2a2a2a', n=3, caps=False)
        K._collide((x, 0, z), (0.5, 1, 0.5), 0, True, False)
    else:
        B.prism(x, y, z, 0.09, 0.5, '#c0201a', n=7); B.box(x - 0.03, x + 0.03, y + 0.5, y + 0.58, z - 0.05, z + 0.05, '#1a1a1a')
    B.emit()

def bollard(x, z, y=0.0):
    B = Batch(); B.prism(x, y, z, 0.2, 0.42, '#2a2a2c', n=8, r2=0.16, top=False); B.prism(x, y + 0.42, z, 0.26, 0.07, '#2a2a2c', n=8); B.emit()
    K._collide((x, 0, z), (0.45, 1, 0.45), 0, True, False)

def tyre(x, y, z, rot=0.0, r=0.38):
    c, s = math.sin(rot), math.cos(rot)
    B = Batch(); B.tube((x - c * 0.12, y, z - s * 0.12), (x + c * 0.12, y, z + s * 0.12), r, '#141414', n=8); B.emit()

def hydrant(x, z):
    B = Batch(); B.prism(x, 0, z, 0.11, 0.75, '#c8241c', n=8, top=False); B.prism(x, 0.75, z, 0.12, 0.12, '#c8241c', n=8, r2=0.06)
    B.tube((x - 0.18, 0.5, z), (x + 0.18, 0.5, z), 0.05, '#c8241c', n=6); B.emit()
    K._collide((x, 0, z), (0.3, 1, 0.3), 0, True, False)

def face_up(ob):
    bm = bmesh.new(); bm.from_mesh(ob.data)
    for f in bm.faces:
        if f.normal.z < 0: f.normal_flip()
    bm.to_mesh(ob.data); bm.free()
    return ob

def owall(axis, f0, f1, a0, a1, openings, y0=0.0, y1=3.2, mat='tf_office', mat_in=None, out=None, block=True, collide=False):
    """a wall slab between f0..f1 (across), running a0..a1, with rectangular openings [(b0, b1, oy0, oy1)].
    axis 'x' = wall along x (constant z), 'z' = wall along z. `out` = the outside face letter (z/Z/x/X); that face gets
    `mat`, the other gets `mat_in`. Openings starting at y0 are doors (camera may pass); windows still block."""
    cuts = sorted(openings)
    segs, cur = [], a0
    for (b0, b1, oy0, oy1) in cuts:
        if b0 > cur: segs.append((cur, b0, y0, y1))
        if oy0 > y0: segs.append((b0, b1, y0, oy0))
        if oy1 < y1: segs.append((b0, b1, oy1, y1))
        cur = b1
    if cur < a1: segs.append((cur, a1, y0, y1))
    faces = ('zZ' if axis == 'x' else 'xX')
    for (s0, s1, sy0, sy1) in segs:
        for fc in faces:
            m = mat if (out is None or fc == out or mat_in is None) else mat_in
            if axis == 'x': cube(s0, s1, sy0, sy1, f0, f1, m, uv=0.5, faces=fc)
            else: cube(f0, f1, sy0, sy1, s0, s1, m, uv=0.5, faces=fc)
    for (b0, b1, oy0, oy1) in cuts:          # reveals
        if axis == 'x':
            cube(b0 - 0.001, b0, oy0, oy1, f0, f1, 'plain', '#cfc8b8', faces='X'); cube(b1, b1 + 0.001, oy0, oy1, f0, f1, 'plain', '#cfc8b8', faces='x')
            if oy0 > y0: cube(b0, b1, oy0 - 0.001, oy0, f0, f1, 'plain', '#d8d0c0', faces='Y')
            cube(b0, b1, oy1, oy1 + 0.001, f0, f1, 'plain', '#cfc8b8', faces='y')
        else:
            cube(f0, f1, oy0, oy1, b0 - 0.001, b0, 'plain', '#cfc8b8', faces='Z'); cube(f0, f1, oy0, oy1, b1, b1 + 0.001, 'plain', '#cfc8b8', faces='z')
            if oy0 > y0: cube(f0, f1, oy0 - 0.001, oy0, b0, b1, 'plain', '#d8d0c0', faces='Y')
            cube(f0, f1, oy1, oy1 + 0.001, b0, b1, 'plain', '#cfc8b8', faces='y')
    runs, cur = [], a0             # blockers / obstacles: solid stretches between door openings
    for (b0, b1, oy0, oy1) in cuts:
        if oy0 <= y0 + 1e-6:
            if b0 > cur: runs.append((cur, b0))
            cur = b1
    if cur < a1: runs.append((cur, a1))
    for (r0, r1) in runs:
        if axis == 'x':
            if block: K.blocker(round((r0 + r1) / 2, 3), (y0 + y1) / 2, round((f0 + f1) / 2, 3), round(r1 - r0, 3), y1 - y0, round(f1 - f0, 3))
            if collide: K.obstacle(round((r0 + r1) / 2, 3), round((f0 + f1) / 2, 3), round(r1 - r0, 3), round(f1 - f0 + 0.1, 3))
        else:
            if block: K.blocker(round((f0 + f1) / 2, 3), (y0 + y1) / 2, round((r0 + r1) / 2, 3), round(f1 - f0, 3), y1 - y0, round(r1 - r0, 3))
            if collide: K.obstacle(round((f0 + f1) / 2, 3), round((r0 + r1) / 2, 3), round(f1 - f0 + 0.1, 3), round(r1 - r0, 3))

def bars(x, y, z, w, h, rot):
    """burglar-proof bars: one alpha-tested quad (dynamic 'Bars', two-sided in game), 13 cm spacing"""
    bake_invisible(K.quad((x, y, z), w, h, 'tf_bars', rot=rot, kind='Bars', uvrect=(0, 0, round(w / 0.13), 1)))

def gwindow(axis, fixed, b0, b1, y0, y1, out_sign, with_bars=True):
    """frame + glass (dynamic 'Glass') in a wall opening; burglar bars outside"""
    t = 0.05; B = Batch()
    if axis == 'z':
        for (za, zb) in [(b0, b0 + t), (b1 - t, b1)]: B.box(fixed - 0.06, fixed + 0.06, y0, y1, za, zb, '#d8d4cc', 'xXzZ')
        for (ya, yb) in [(y0, y0 + t), (y1 - t, y1), ((y0 + y1) / 2 - 0.02, (y0 + y1) / 2 + 0.02)]: B.box(fixed - 0.06, fixed + 0.06, ya, yb, b0, b1, '#d8d4cc', 'xXYy')
        B.emit()
        bake_invisible(cube(fixed - 0.004, fixed + 0.004, y0, y1, b0, b1, 'glass', faces='X', kind='Glass', uv=None))
        if with_bars: bars(fixed + out_sign * 0.16, y0, (b0 + b1) / 2, b1 - b0, y1 - y0, PI / 2 if out_sign > 0 else -PI / 2)
    else:
        for (xa, xb) in [(b0, b0 + t), (b1 - t, b1)]: B.box(xa, xb, y0, y1, fixed - 0.06, fixed + 0.06, '#d8d4cc', 'xXzZ')
        for (ya, yb) in [(y0, y0 + t), (y1 - t, y1), ((y0 + y1) / 2 - 0.02, (y0 + y1) / 2 + 0.02)]: B.box(b0, b1, ya, yb, fixed - 0.06, fixed + 0.06, '#d8d4cc', 'zZYy')
        B.emit()
        bake_invisible(cube(b0, b1, y0, y1, fixed - 0.004, fixed + 0.004, 'glass', faces='Z', kind='Glass', uv=None))
        if with_bars: bars((b0 + b1) / 2, y0, fixed + out_sign * 0.16, b1 - b0, y1 - y0, 0.0 if out_sign > 0 else PI)

# ================================================================== lights
if NIGHT:
    K.world('#0d1426', 0.9)
    K.sun((0.45, -0.62, 0.62), '#9fb0dc', 0.22, angle=0.05)        # a little moonlight from the north-west
else:
    K.world('#7d8cb0', 0.82)                                        # cool dusk sky fill
    K.sun((0.92, -0.26, 0.30), '#ffaa62', 5.0, angle=0.03)          # low warm sun from the west-north-west

# ================================================================== GROUND
BUND_N = (0.8, 27.2, -14.6, -0.2)          # T3/T4
BUND_S = (0.8, 27.2, 3.2, 17.4)            # T1/T2
OFFICE = (-20.0, -12.0, 4.0, 12.0)
LAB = (-18.2, -13.8, -8.2, -3.8)
UNION = (-27.8, -10.0, -24.0, -15.0)
GHOUSE = (-5.6, -2.6, 21.75, 23.65)
LMW[0] = 0.55
ground((-27.8, 27.8, -24.0, 23.9), 'tf_yard', holes=[BUND_N, BUND_S, OFFICE, LAB, UNION, GHOUSE])
LMW[0] = 0.5
ground(UNION, 'tf_ground', uv=1 / 3)
LMW[0] = 0.32
for (a, b, c, d) in (BUND_N, BUND_S):
    cube(a, b, -0.01, 0.0, c, d, 'tf_bund', uv=1 / 3, faces='Y')
LMW[0] = 1.0
# paint on the yard: kerb lines of the gate road, dashed centre line, the stop line at the boom
for (x0, x1, z0, z1) in [(-3.4, -3.25, 2.0, 21.6), (3.25, 3.4, 4.0, 23.6)]:
    cube(x0, x1, 0.0, 0.004, z0, z1, 'plain', '#d8c050', faces='Y')
for k in range(8):
    z = 19.6 - k * 2.4
    cube(-0.06, 0.06, 0.0, 0.004, z - 0.7, z + 0.7, 'plain', '#d8d4c8', faces='Y', lm='top')
cube(-2.0, 3.2, 0.0, 0.004, 22.15, 22.35, 'plain', '#d8d4c8', faces='Y')

# ---------------------------------------------------------------- outside: verge, gate apron, road, the far side
LMW[0] = 0.5
ground((-30.0, 30.0, 24.15, 26.0), 'tf_ground', uv=1 / 3, holes=[(-5.0, 5.0, 24.15, 26.0)])
cube(-5.0, 5.0, -0.01, 0.0, 24.15, 25.95, 'tf_yard', uv=0.25, faces='Y')
LMW[0] = 0.45
cube(-30.0, 30.0, -0.01, 0.0, 26.45, 32.4, 'tf_road', uv=0.25, faces='Y')
LMW[0] = 0.12
for (xa, xb) in [(-90.0, -30.0), (30.0, 90.0)]:
    cube(xa, xb, -0.01, 0.0, 26.45, 32.4, 'tf_road', uv=0.25, faces='Y')
    cube(xa, xb, -0.01, 0.0, 24.15, 26.0, 'tf_ground', uv=1 / 3, faces='Y')
cube(-90.0, 90.0, -0.01, 0.0, 32.4, 60.0, 'tf_ground', uv=1 / 3, faces='Y')
LMW[0] = 0.5
B = Batch()
for k in range(-12, 13):
    x = k * 3.0
    B.box(x - 0.9, x + 0.9, 0.0, 0.004, 29.33, 29.47, '#c8c0a0', 'Y')
B.emit()
# open drain between the verge and the road (slab over it at the gate)
for (xa, xb) in [(-30.0, -5.0), (5.0, 30.0)]:
    cube(xa, xb, -0.52, -0.5, 26.0, 26.45, 'drain', uv=1.0, faces='Y')
    cube(xa, xb, -0.5, 0.05, 25.9, 26.0, 'kerb', uv=1.0, faces='YZ')
    cube(xa, xb, -0.5, 0.05, 26.45, 26.55, 'kerb', uv=1.0, faces='Yz')
    K.obstacle((xa + xb) / 2, 26.22, xb - xa, 0.6)
cube(-5.0, 5.0, -0.06, 0.03, 25.9, 26.55, 'concrete', uv=0.5, faces='YxX')
LMW[0] = 1.0

# ---------------------------------------------------------------- the waterfront edge: quay wall, mud bank to the west
LMW[0] = 0.4
for (xa, xb) in [(-27.8, -14.8), (-13.2, -9.5), (18.0, 27.8)]:
    cube(xa, xb, -1.4, 0.0, -24.25, -24.0, 'tf_quay', uv=0.5, faces='zY')
    cube(xa, xb, 0.0, 0.1, -24.2, -24.02, 'tf_hazard', uv=1.0, faces='zY')
LMW[0] = 0.3
xs_ = [-28.05, -29.5, -31.0, -33.0, -35.0]
ys_ = [0.0, -0.05, -0.35, -0.75, -1.2]
for zz0, zz1 in [(-24.0, -6.0), (-6.0, 12.0), (12.0, 26.0)]:
    vs, fs = [], []
    for x, y in zip(xs_, ys_): vs += [(x, y, zz0), (x, y, zz1)]
    for i in range(len(xs_) - 1): fs.append((2 * i, 2 * i + 2, 2 * i + 3, 2 * i + 1))
    face_up(poly(vs, fs, 'tf_mud', uv=1 / 3))
cube(-35.0, -28.05, -0.01, 0.0, 24.15, 26.0, 'tf_mud', uv=1 / 3, faces='Y')
LMW[0] = 0.1
cube(28.05, 90.0, -0.01, 0.0, -24.0, 24.15, 'tf_yard', uv=0.25, faces='Y')            # the neighbour depot's yard
cube(28.05, 90.0, -1.4, 0.0, -24.25, -24.0, 'tf_quay', uv=0.5, faces='zY')
LMW[0] = 1.0

# ================================================================== PERIMETER WALL + GATE
LMW[0] = 0.75
WALL_H = 2.8
def wall_x(z0, z1, x_in, x_out, pillars=4.8):
    """a wall running along z (west/east); x_in = yard face; pillars on the yard side"""
    xa, xb = min(x_in, x_out), max(x_in, x_out)
    cube(xa, xb, 0, WALL_H, z0, z1, 'tf_wall', uv=1 / 3, faces='X' if x_in > x_out else 'x', collide=True, block=True)
    w0 = LMW[0]; LMW[0] = 0.2
    cube(xa, xb, 0, WALL_H, z0, z1, 'tf_wall', uv=1 / 3, faces='x' if x_in > x_out else 'X')
    LMW[0] = w0
    cube(xa - 0.06, xb + 0.06, WALL_H, WALL_H + 0.1, z0, z1, 'concrete', uv=1.0, faces='xXY')
    n = max(1, int(round((z1 - z0) / pillars)))
    s = 1 if x_in > x_out else -1
    for k in range(1, n):
        z = z0 + k * (z1 - z0) / n
        pa, pb = sorted((x_in, x_in + s * 0.12))
        cube(pa, pb, 0, WALL_H + 0.2, z - 0.2, z + 0.2, 'tf_wall', uv=1 / 3, faces=('X' if s > 0 else 'x') + 'zZY')
def wall_z(x0, x1, za, zb, pillars=3.0):
    """the south wall: pillars on both faces (the outside is seen from the gate road)"""
    cube(x0, x1, 0, WALL_H, za, zb, 'tf_wall', uv=1 / 3, faces='zZ', collide=True, block=True)
    cube(x0, x1, WALL_H, WALL_H + 0.1, za - 0.06, zb + 0.06, 'concrete', uv=1.0, faces='zZY')
    n = max(1, int(round((x1 - x0) / pillars)))
    for k in range(1, n):
        x = x0 + k * (x1 - x0) / n
        cube(x - 0.2, x + 0.2, 0, WALL_H + 0.2, za - 0.1, zb + 0.1, 'tf_wall', uv=1 / 3, faces='xXzZY')
wall_z(-28.05, -4.3, 23.9, 24.15)
wall_z(4.3, 28.05, 23.9, 24.15)
LMW[0] = 0.55
wall_x(-24.0, 23.9, -27.8, -28.05)
wall_x(-24.0, 23.9, 27.8, 28.05)
LMW[0] = 1.0
for s in (-1, 1):                                    # gate pillars with globe lamps
    xa, xb = sorted((s * 3.6, s * 4.3))
    cube(xa, xb, 0, 3.4, 23.75, 24.4, 'tf_wall', uv=1 / 3, faces='xXzZ', collide=True, block=True)
    cube(xa - 0.06, xb + 0.06, 3.4, 3.55, 23.69, 24.46, 'concrete', uv=1.0, faces='xXzZY')
    K.cyl((s * 3.95, 3.55, 24.07), 0.06, 0.15, 'plain', '#2a2a2a', seg=6)
    if on('street'):
        ob = K.sphere((s * 3.95, 3.86, 24.07), 0.17, 'glow', '#fff0d2', seg=8, kind='Glows'); kit2._bake_glow(ob, '#fff0d2')
        K.point((s * 3.95, 3.86, 24.6), '#ffe0b0', 30 if not NIGHT else 45, 0.15)
    else:
        K.sphere((s * 3.95, 3.86, 24.07), 0.17, 'plain', '#d8d4cc', seg=8)
B = Batch()                                                                                         # RIVERSTONE company sign on two posts (verge)
for x in (6.9, 12.1): B.box(x - 0.06, x + 0.06, 0.0, 2.3, 24.84, 24.96, '#2a3a5a', 'xXYzZ')
B.box(6.45, 12.55, 1.36, 2.24, 24.78, 24.84, '#2a3a5a', 'xXYzZ')
B.emit()
quadv(9.5, 1.4, 24.965, 6.0, 0.8, 0.0, 'tf_signs', uvrect=atlas(0, 0, 1024, 128))
for x in (6.9, 12.1): K._collide((x, 0, 24.9), (0.2, 1, 0.2), 0, True, False)
sign(-5.6, 1.25, 24.165, 1.5, 0.75, 0.0, (0, 384, 256, 512))                                      # visitors report to security
sign(-8.7, 1.45, 24.165, 0.5, 0.5, 0.0, (0, 256, 128, 384))                                       # no smoking
sign(-9.4, 1.45, 24.165, 0.5, 0.5, 0.0, (768, 256, 896, 384))                                     # speed 10
sign(5.3, 1.35, 24.165, 0.5, 0.5, 0.0, (640, 256, 768, 384))                                      # flammable
sign(11.8, 1.35, 24.165, 0.5, 0.5, 0.0, (128, 256, 256, 384))                                     # no naked flame
# the sliding gate leaf (dynamic 'Gate': slides +x by 7.4 m to open), its track and guide posts
GZ = 23.55
cube(-3.6, 11.6, 0.0, 0.03, GZ - 0.06, GZ + 0.06, 'plain', '#3a3a38', faces='Y')
for x in (11.45, 11.95):
    bx(x - 0.06, x + 0.06, 0, 2.7, GZ - 0.25, GZ - 0.15, '#2e3a32'); bx(x - 0.06, x + 0.06, 0, 2.7, GZ + 0.15, GZ + 0.25, '#2e3a32')
def gate_leaf(x0, x1, kind='Gate'):
    for (ya, yb) in [(0.12, 0.26), (2.4, 2.52), (1.25, 1.33)]:
        cube(x0, x1, ya, yb, GZ - 0.05, GZ + 0.05, 'tf_gatepaint', kind=kind, uv=None)
    for x in (x0, x1): cube(x - 0.06, x + 0.06, 0.05, 2.6, GZ - 0.06, GZ + 0.06, 'tf_gatepaint', kind=kind, uv=None)
    cube(x0 + 0.06, x1 - 0.06, 0.26, 1.25, GZ - 0.015, GZ + 0.015, 'tf_gatedark', kind=kind, faces='zZ', uv=None)
    n = int((x1 - x0) / 0.14)
    for k in range(1, n):
        x = x0 + k * (x1 - x0) / n
        cube(x - 0.018, x + 0.018, 1.33, 2.4, GZ - 0.018, GZ + 0.018, 'tf_gatepaint', kind=kind, faces='xXzZ', uv=None)
        if k % 2 == 0: cube(x - 0.03, x + 0.03, 2.52, 2.72, GZ - 0.012, GZ + 0.012, 'tf_gatepaint', kind=kind, faces='xXzZ', uv=None)
    for cx in (x0 + 0.5, x1 - 0.5):
        K.cyl((cx, 0.07, GZ), 0.07, 0.08, 'tf_gatedark', seg=8, axis='z', kind=kind, uv=None)
gate_leaf(-3.6, 3.8)
K.box((0.1, 0.05, GZ), (7.4, 2.6, 0.1), 'plain', '#202020', kind='bake')
K.obstacle(0.1, GZ, 7.4, 0.3)
# razor wire on the walls (alpha-tested coil texture, dynamic 'Razor')
def razor(p0, p1, r=0.26, y=WALL_H + 0.45):
    a, b = Vector((p0[0], p0[1])), Vector((p1[0], p1[1]))
    L = (b - a).length; d = (b - a).normalized(); n6 = 6
    verts, faces = [], []
    for i in range(2):
        cx, cz = (a + d * L * i)
        for k in range(n6 + 1):
            ang = 2 * PI * k / n6
            verts.append((cx - d.y * math.cos(ang) * r, y + math.sin(ang) * r, cz + d.x * math.cos(ang) * r))
    for k in range(n6): faces.append((k, k + 1, n6 + 2 + k, n6 + 1 + k))
    ob = poly(verts, faces, 'tf_razor', kind='Razor')
    uvs = ob.data.uv_layers['UVMap'].data
    for f in ob.data.polygons:
        for l in f.loop_indices:
            i, k = divmod(ob.data.loops[l].vertex_index, n6 + 1)
            uvs[l].uv = (i * L / 0.75, k / n6)
    bake_invisible(ob)
    m = int(L / 3.0)
    for j in range(m + 1):
        cx, cz = a + d * (L * j / max(1, m))
        beam((cx, WALL_H + 0.1, cz), (cx - d.y * 0.25, WALL_H + 0.75, cz + d.x * 0.25), 0.04, 'tf_gatedark', sides=3, kind='RazorPosts')
        beam((cx, WALL_H + 0.1, cz), (cx + d.y * 0.25, WALL_H + 0.75, cz - d.x * 0.25), 0.04, 'tf_gatedark', sides=3, kind='RazorPosts')
razor((-27.9, 24.02), (-4.4, 24.02)); razor((4.4, 24.02), (27.9, 24.02))
razor((-27.92, 23.8), (-27.92, -23.9)); razor((27.92, 23.8), (27.92, -23.9))

# ================================================================== GATEHOUSE (x -5.6..-2.6, z 21.75..23.65), boom barrier
LMW[0] = 1.4
GX0, GX1, GZ0, GZ1, GH = -5.6, -2.6, 21.75, 23.65, 2.75
owall('x', GZ0, GZ0 + 0.15, GX0, GX1, [(-4.25, -3.45, 0.0, 2.1)], y1=GH, mat='tf_gatehse', block=False)    # north face, door
owall('z', GX1 - 0.15, GX1, GZ0 + 0.15, GZ1, [(22.2, 23.2, 1.0, 2.0)], y1=GH, mat='tf_gatehse', block=False)  # east face, window
cube(GX0, GX0 + 0.15, 0, GH, GZ0 + 0.15, GZ1, 'tf_gatehse', uv=0.5, faces='xX')
cube(GX0 + 0.15, GX1 - 0.15, 0, GH, GZ1 - 0.15, GZ1, 'tf_gatehse', uv=0.5, faces='zZ')
cube(GX0 - 0.25, GX1 + 0.3, GH, GH + 0.14, GZ0 - 0.3, GZ1 + 0.05, 'concrete', uv=1.0, faces='xXzZYy')
cube(GX0 - 0.25, GX1 + 0.3, 0.0, 0.04, GZ0 - 0.3, GZ0, 'concrete', uv=1.0, faces='YzxX')
K._collide(((GX0 + GX1) / 2, 0, (GZ0 + GZ1) / 2), (GX1 - GX0, 1, GZ1 - GZ0), 0, True, True)
LMW[0] = 1.8
cube(GX0 + 0.15, GX1 - 0.15, 0.0, 0.02, GZ0 + 0.15, GZ1 - 0.15, 'tf_tiles', uv=1.0, faces='Y')
cube(GX0 + 0.15, GX1 - 0.15, GH - 0.06, GH - 0.05, GZ0 + 0.15, GZ1 - 0.15, 'plain', '#e4e0d4', faces='y')
bx(GX1 - 0.75, GX1 - 0.15, 0.85, 0.9, 22.05, 23.35, '#6a4a30')
for zz in (22.1, 23.3): bx(GX1 - 0.7, GX1 - 0.65, 0.0, 0.85, zz - 0.03, zz + 0.03, '#3a2a1c')
K.box((GX1 - 0.45, 0.9, 22.75), (0.34, 0.04, 0.46), 'plain', '#2a3a6a')                                   # the gate register
poly([(GX1 - 0.6, 0.945, 22.55), (GX1 - 0.3, 0.945, 22.55), (GX1 - 0.3, 0.945, 22.95), (GX1 - 0.6, 0.945, 22.95)], [(0, 3, 2, 1)], 'plain', '#ece6d6')
chair(GX1 - 1.05, 22.7, PI / 2, '#3a6ab8')
K.box((GX0 + 0.35, 0.0, 23.2), (0.4, 0.45, 0.35), 'plain', '#2a2a2a')                                    # small fridge + TV
K.box((GX0 + 0.35, 0.45, 23.2), (0.3, 0.22, 0.22), 'plain', '#1a1a1a')
lampquad(GX0 + 0.35, 0.49, 23.085, 0.24, 0.16, PI, '#7aa0d0', on('screens'), kind='GlowsCool')
quadv(GX0 + 0.155, 1.35, 22.45, 0.32, 0.45, PI / 2, 'tf_signs', uvrect=atlas(512, 896, 640, 1024))       # calendar
if on('gatehouse'): tube(-4.1, GH - 0.12, 22.7, length=1.0, axis='x', watts=60, color='#eef4ff', light='#e8f0ff', kind='GlowsCool')
else: bx(-4.6, -3.6, GH - 0.1, GH - 0.06, 22.66, 22.74, '#d8d8d0')
LMW[0] = 1.4
sign(-3.85, 2.2, GZ0 - 0.008, 1.0, 0.5, PI, (0, 512, 256, 640))                                         # SECURITY over the door
sign(GX1 + 0.008, 2.12, 22.7, 0.9, 0.45, PI / 2, (0, 384, 256, 512))                                    # visitors report here
cube(-5.5, -4.5, 0.42, 0.46, 21.15, 21.45, 'planks', uv=1.0, faces='xXYzZ')
for x in (-5.4, -4.6): bx(x - 0.04, x + 0.04, 0, 0.42, 21.2, 21.4, '#3a2a1c')
chair(-6.3, 22.0, PI / 2 + 0.4, '#d8d4cc')
umbrella(-6.7, 20.9, r=1.1, h=2.15, c1='#2a5aa8', c2='#e8e0d0')
# boom barrier: housing static; arm + counterweight dynamic 'Boom' pivoting about z at (-2.25, 1.0, 22.7)
K.box((-2.25, 0.0, 22.7), (0.32, 0.95, 0.32), 'plain', '#d8b020')
K.box((-2.25, 0.95, 22.7), (0.24, 0.1, 0.24), 'plain', '#2a2a2a')
K._collide((-2.25, 0, 22.7), (0.4, 1, 0.4), 0, True, False)
for k in range(9):
    xa = -2.05 + k * 0.6
    cube(xa, xa + 0.6, 0.94, 1.06, 22.64, 22.76, 'tf_boomred' if k % 2 == 0 else 'tf_boomwhite', kind='Boom', uv=None)
cube(-2.75, -2.4, 0.86, 1.14, 22.6, 22.8, 'tf_gatedark', kind='Boom', uv=None)
K.box((0.45, 0.9, 22.7), (5.4, 0.2, 0.15), 'plain', '#202020', kind='bake')
bx(3.3, 3.42, 0.0, 0.92, 22.64, 22.76, '#d8b020')
K._collide((3.36, 0, 22.7), (0.2, 1, 0.2), 0, True, False)
LMW[0] = 1.0

# ================================================================== ADMIN BLOCK (x -20..-12, z 4..12), enterable ground floor
# (z 4 = its north face, z 12 = its south face; the main door is in the east face at z 8)
LMW[0] = 0.9
OX0, OX1, OZ0, OZ1 = -20.0, -12.0, 4.0, 12.0
WT = 0.25; H1, SL, H2 = 3.2, 3.5, 6.7
DOOR = (7.4, 8.6, 0.0, 2.35)
W_E1, W_E2 = (4.9, 6.5, 1.0, 2.2), (9.4, 11.0, 1.0, 2.2)
W_W = (6.6, 8.6, 1.0, 2.3)                         # the manager's west window (the low sun comes in here)
W_S = (-18.1, -16.7, 1.1, 2.2)                     # south wall, behind the manager's desk
W_N1, W_N2 = (-18.8, -17.2, 1.0, 2.2), (-14.4, -13.1, 1.0, 2.2)
owall('z', OX1 - WT, OX1, OZ0, OZ1, [DOOR, W_E1, W_E2], y1=H1, mat='tf_office', mat_in='tf_office_in', out='X', collide=True)
owall('z', OX0, OX0 + WT, OZ0, OZ1, [W_W], y1=H1, mat='tf_office', mat_in='tf_office_in', out='x', collide=True)
owall('x', OZ1 - WT, OZ1, OX0 + WT, OX1 - WT, [W_S], y1=H1, mat='tf_office', mat_in='tf_office_in', out='Z', collide=True)
owall('x', OZ0, OZ0 + WT, OX0 + WT, OX1 - WT, [W_N1, W_N2], y1=H1, mat='tf_office', mat_in='tf_office_in', out='z', collide=True)
LMW[0] = 1.4
IX0, IX1, IZ0, IZ1 = OX0 + WT, OX1 - WT, OZ0 + WT, OZ1 - WT
PX0, PX1 = -15.1, -14.95                            # partition: reception | manager, doorway z 7.4..8.6
owall('z', PX0, PX1, IZ0, IZ1, [(7.4, 8.6, 0.0, 2.3)], y1=H1, mat='tf_office_in', collide=True)
for (z0, z1, f) in [(7.36, 7.4, 'z'), (8.6, 8.64, 'Z')]: cube(PX0 - 0.02, PX1 + 0.02, 0.0, 2.3, z0, z1, 'plain', '#5a3a24', faces='xX' + f)
cube(PX0 - 0.02, PX1 + 0.02, 2.3, 2.36, 7.36, 8.64, 'plain', '#5a3a24', faces='xXy')
K.box((-15.55, 0.01, 8.66), (0.9, 2.26, 0.045), 'plain', '#6a4428')                                   # the office door, open against the partition
K.box((-15.25, 1.0, 8.7), (0.1, 0.04, 0.05), 'plain', '#c8c0a8')
RUG = (-18.9, -15.9, 8.2, 11.3)                    # the manager's rug replaces the tiles under it (no stacked layers: they z-fight at range)
for (x0, x1, z0, z1) in subtract((IX0, PX0, IZ0, IZ1), [RUG]) + [(PX1, IX1, IZ0, IZ1)]: cube(x0, x1, 0.0, 0.02, z0, z1, 'tf_tiles', uv=1.0, faces='Y')
cube(PX0, PX1, 0.0, 0.02, 7.4, 8.6, 'tf_tiles', uv=1.0, faces='Y'); cube(OX1 - WT, OX1, 0.0, 0.02, 7.4, 8.6, 'tf_tiles', uv=1.0, faces='Y')
LMW[0] = 1.2
cube(IX0, IX1, H1 - 0.01, H1, IZ0, IZ1, 'ceiling_tile', uv=1 / 1.2, faces='y')
LMW[0] = 1.4
for (x0, x1, z0, z1, f) in [(IX0, PX0, IZ0, IZ0 + 0.02, 'Z'), (IX0, PX0, IZ1 - 0.02, IZ1, 'z'), (IX0, IX0 + 0.02, IZ0, IZ1, 'X'), (PX0 - 0.02, PX0, IZ0, IZ1, 'x'),
                            (PX1, IX1, IZ0, IZ0 + 0.02, 'Z'), (PX1, IX1, IZ1 - 0.02, IZ1, 'z'), (PX1, PX1 + 0.02, IZ0, IZ1, 'X'), (IX1 - 0.02, IX1, IZ0, IZ1, 'x')]:
    cube(x0, x1, 0.0, 0.1, z0, z1, 'plain', '#4a3a2c', faces=f)
# ---- first floor (exterior only), slab edge, blue band, parapet, roof
LMW[0] = 0.6
cube(OX0 - 0.1, OX1 + 0.1, H1, SL, OZ0 - 0.1, OZ1 + 0.1, 'concrete', uv=1.0, faces='xXzZy')
cube(OX0, OX1, SL, H2, OZ0, OZ1, 'tf_office', uv=0.5, faces='xXzZ', block=True)
cube(OX0 - 0.03, OX1 + 0.03, SL, SL + 0.45, OZ0 - 0.03, OZ1 + 0.03, 'plain', '#2a4a8a', faces='xXzZ')
cube(OX0 - 0.15, OX1 + 0.15, H2, H2 + 0.7, OZ0 - 0.15, OZ1 + 0.15, 'tf_office', uv=0.5, faces='xXzZ')
cube(OX0 - 0.2, OX1 + 0.2, H2 + 0.7, H2 + 0.8, OZ0 - 0.2, OZ1 + 0.2, 'concrete', uv=1.0, faces='xXzZY')
cube(OX0 + 0.1, OX1 - 0.1, H2 + 0.15, H2 + 0.16, OZ0 + 0.1, OZ1 - 0.1, 'plain', '#5a5a58', faces='Y')
UPW = []
for x in (-18.4, -16.0, -13.6): UPW += [(x, OZ0 - 0.01, PI), (x, OZ1 + 0.01, 0.0)]
for z in (5.6, 8.0, 10.4): UPW += [(OX1 + 0.01, z, PI / 2), (OX0 - 0.01, z, -PI / 2)]
lit_up = {1, 6, 10, 11} if not NIGHT else {1, 3, 6, 10, 11, 4}
UPC = [RG.choice(['#ffd9a0', '#ffe2b4', '#ffcf8c']) for _ in UPW]
for i, (x, z, rot) in enumerate(UPW):
    if i == 8: continue                                                     # east face middle: the big name board goes there
    lit_ = (i in lit_up) and (on('office') or on('office_up'))
    c, s = math.sin(rot), math.cos(rot)
    lampquad(x, SL + 0.95, z, 1.5, 1.45, rot, UPC[i], lit_)
    bars(x + c * 0.05, SL + 0.95, z + s * 0.05, 1.5, 1.45, rot)
    with TOP(): K.box((x + c * 0.08, SL + 0.88, z + s * 0.08), (1.7 if abs(s) > 0.5 else 0.16, 0.07, 0.16 if abs(s) > 0.5 else 1.7), 'plain', '#d8d4c8')
    if lit_: K.point((x - c * 0.8, SL + 2.0, z - s * 0.8), '#ffcf90', 30, 0.3)
LMW[0] = 1.0
for w in (W_E1, W_E2): gwindow('z', OX1 - WT / 2, w[0], w[1], w[2], w[3], 1)
gwindow('z', OX0 + WT / 2, W_W[0], W_W[1], W_W[2], W_W[3], -1)
gwindow('x', OZ1 - WT / 2, W_S[0], W_S[1], W_S[2], W_S[3], 1)
for w in (W_N1, W_N2): gwindow('x', OZ0 + WT / 2, w[0], w[1], w[2], w[3], -1)
for zh in (7.42, 8.58):                                                     # aluminium-glass door leaves, open inward
    bx(-12.85, -12.25, 0.01, 2.33, zh - 0.025, zh + 0.025, '#8a9094')
    bake_invisible(cube(-12.8, -12.3, 0.1, 2.25, zh - 0.03, zh + 0.03, 'glass', faces='zZ', kind='Glass', uv=None))
cube(-12.0, -10.7, 2.8, 3.05, 6.5, 9.5, 'concrete', uv=1.0, faces='xXzZYy')                              # door canopy
sign(-10.695, 2.8, 8.0, 2.0, 0.25, PI / 2, (512, 384, 1024, 448))                                         # ADMINISTRATION
lampbox((-11.15, 2.76, 8.0), (0.3, 0.04, 0.3), '#fff0d8', on('office'))
if on('office'): K.point((-11.15, 2.6, 8.0), '#ffe2b8', 30, 0.15)
cube(-12.0, -11.0, 0.0, 0.03, 6.9, 9.1, 'concrete', uv=1.0, faces='YxXzZ')
quadv(-11.985, 4.35, 8.0, 5.2, 0.65, PI / 2, 'tf_signs', uvrect=atlas(0, 0, 1024, 128))
for (x, z, y, rot) in [(-11.84, 5.6, 1.9, PI / 2), (-11.84, 10.4, 1.9, PI / 2), (-20.16, 9.8, 4.6, -PI / 2), (-14.0, 12.16, 1.9, 0.0)]:
    c, s = math.sin(rot), math.cos(rot)
    K.box((x + c * 0.16, y, z + s * 0.16), (0.8, 0.55, 0.32), 'plain', '#d8d8d2', rot=rot)                 # AC condensers
    quadv(x + c * 0.325, y + 0.08, z + s * 0.325, 0.4, 0.4, rot, 'plain', '#3a3c3e')
for dx, dz in [(-0.5, -0.5), (0.5, -0.5), (0.5, 0.5), (-0.5, 0.5)]: beam((-17.5 + dx, H2 + 0.16, 6.5 + dz), (-17.5 + dx, H2 + 1.4, 6.5 + dz), 0.08, 'plain', '#3a3a3a', sides=4)
K.box((-17.5, H2 + 1.4, 6.5), (1.3, 0.08, 1.3), 'plain', '#3a3a3a')
K.cyl((-17.5, H2 + 1.48, 6.5), 0.62, 1.3, 'plain', '#1a1c1e', seg=10, r2=0.55)                              # roof water tank
beam((-13.0, H2 + 0.8, 11.0), (-13.0, H2 + 4.0, 11.0), 0.06, 'plain', '#6a6a6a', sides=4)
K.cyl((-14.5, H2 + 0.8, 10.6), 0.45, 0.06, 'plain', '#d8d8d8', seg=10)
# the external stair on the north face up to a first-floor door (x -18.5..-13, z 2.85..3.95)
LMW[0] = 0.8
SZ0, SZ1 = 2.85, 3.95
nst = 20
Bs = Batch()
for k in range(nst):
    xa = -13.0 - k * 0.275; y0_, y = k * (SL / nst), (k + 1) * (SL / nst)
    Bs.face([(xa, y0_, SZ0), (xa, y, SZ0), (xa, y, SZ1), (xa, y0_, SZ1)], '#8a8680')                   # riser, faces +x
    Bs.face([(xa, y, SZ0), (xa - 0.275, y, SZ0), (xa - 0.275, y, SZ1), (xa, y, SZ1)], '#a8a49c')       # tread
Bs.emit()
cube(-19.9, -18.5, SL - 0.15, SL, SZ0, SZ1, 'concrete', uv=1.0, faces='xXYzZy')
beam((-13.0, 0.0, SZ0 + 0.06), (-18.5, SL, SZ0 + 0.06), 0.12, 'plain', '#6a6660', sides=4)
beam((-13.0, 0.0, SZ1 - 0.06), (-18.5, SL, SZ1 - 0.06), 0.1, 'plain', '#6a6660', sides=4)
rail_run([(-13.0, 0.0, SZ0 + 0.02), (-18.5, SL, SZ0 + 0.02), (-19.9, SL, SZ0 + 0.02)], h=1.0, post_every=1.4, color='#2a2a2a')
for x in (-18.6, -19.8): beam((x, 0, 3.0), (x, SL - 0.15, 3.0), 0.16, 'plain', '#8a8680', sides=4)
K.obstacle(-16.45, 3.4, 6.9, 1.2)
quadv(-19.2, SL, OZ0 - 0.012, 0.9, 2.1, PI, 'plain', '#5a3a24')
LMW[0] = 1.0

# ---------------------------------------------------------------- reception (x -14.95..-12.25)
LMW[0] = 1.6
bx(-14.9, -13.0, 0.0, 1.0, 9.62, 9.95, '#7a5a3c'); bx(-14.95, -12.95, 1.0, 1.06, 9.55, 10.0, '#3a2a20')      # L counter
bx(-13.3, -13.0, 0.0, 1.0, 9.95, IZ1, '#7a5a3c'); bx(-13.35, -12.95, 1.0, 1.06, 9.95, IZ1, '#3a2a20')
bx(-14.9, -13.3, 0.72, 0.76, 9.95, 10.6, '#c8b898')
K.obstacle(-13.95, 9.8, 2.0, 0.45); K.obstacle(-13.15, 10.9, 0.45, 1.8)
sign(-13.95, 0.35, 9.545, 1.0, 0.5, PI, (512, 768, 768, 896))                                              # RECEPTION
K.box((-14.3, 0.76, 10.42), (0.45, 0.3, 0.05), 'plain', '#1a1a1a')                                          # monitor, faces the receptionist (south)
lampquad(-14.3, 0.79, 10.447, 0.41, 0.24, 0.0, '#a8c8ff', on('screens'), kind='GlowsCool')
K.box((-13.75, 0.76, 10.3), (0.2, 0.06, 0.15), 'plain', '#2a2a2a')
chair(-14.0, 11.05, PI, '#3a3a3a')
for k in range(3): chair(-14.45 + k * 0.62, 4.62, 0.0, '#3a6ab8')                                         # waiting chairs (north wall)
K.box((-12.55, 0.0, 4.6), (0.32, 1.0, 0.32), 'plain', '#e8e8e4'); K.cyl((-12.55, 1.0, 4.6), 0.14, 0.42, 'plain', '#6aa8d8', seg=8)
K.obstacle(-12.55, 4.6, 0.4, 0.4)
fire_ext(-12.45, 7.1)
board(-14.935, 1.2, 5.8, 1.0, 1.0, PI / 2, (768, 0, 1024, 256))                                           # HSE poster
quadv(-12.265, 1.3, 6.95, 0.5, 0.5, -PI / 2, 'tf_signs', uvrect=atlas(640, 896, 768, 1024))                 # licence certificate
quadv(-13.95, 2.4, IZ1 - 0.01, 0.34, 0.34, PI, 'tf_signs', uvrect=atlas(768, 896, 896, 1024))              # clock
def plant(x, z, pot='#8a5a3a', h=0.32, n=4):
    B = Batch(); B.prism(x, 0.0, z, 0.18, h, pot, n=8, r2=0.2)
    for k in range(n):
        px, pz = x + RG.uniform(-0.12, 0.12), z + RG.uniform(-0.12, 0.12)
        B.prism(px, h + 0.05 + k * 0.13, pz, 0.2, 0.18, RG.choice(['#2a5a2a', '#346a30', '#3a7a34']), n=6, r2=0.08)
        B.prism(px, h + k * 0.13 - 0.05, pz, 0.08, 0.12, '#2a4a24', n=6, r2=0.2, top=False)
    B.emit()
plant(-12.6, 11.4)
def ceiling_panel(x, z, lit, w=0.6, d=1.2, watts=70):
    bx(x - w / 2 - 0.03, x + w / 2 + 0.03, H1 - 0.03, H1 - 0.005, z - d / 2 - 0.03, z + d / 2 + 0.03, '#e0e0dc', faces='y')
    if lit:
        gbox((x, H1 - 0.045, z), (w, 0.02, d), '#fff4e2')
        K.area((x, H1 - 0.1, z), (w, d), '#ffefd8', watts, (0, -1, 0))
    else:
        bx(x - w / 2, x + w / 2, H1 - 0.045, H1 - 0.03, z - d / 2, z + d / 2, '#d8dad8', faces='y')
ceiling_panel(-13.6, 6.0, on('office')); ceiling_panel(-13.6, 9.6, on('office'))

# ---------------------------------------------------------------- the manager's office (x -19.75..-15.1)
LMW[0] = 1.6
ceiling_panel(-17.4, 6.6, on('office')); ceiling_panel(-17.4, 9.8, on('office'))
B = Batch()                                                                                                  # rug: border + field, one flat layer
for (a, b, c, d, col) in [(-18.9, -15.9, 8.2, 8.35, '#6a2a2a'), (-18.9, -15.9, 11.15, 11.3, '#6a2a2a'), (-18.9, -18.75, 8.35, 11.15, '#6a2a2a'),
                          (-16.05, -15.9, 8.35, 11.15, '#6a2a2a'), (-18.75, -16.05, 8.35, 11.15, '#8a4a3a')]:
    B.box(a, b, 0.0, 0.022, c, d, col, 'Y')
B.emit()
DX0, DX1, DZ0, DZ1 = -18.3, -16.5, 10.0, 10.8                                                                # desk, top 0.75
bx(DX0, DX1, 0.71, 0.75, DZ0, DZ1, '#4a2e1c')
bx(DX0 + 0.03, DX0 + 0.5, 0.0, 0.71, DZ0 + 0.05, DZ1 - 0.05, '#5a3a24')
bx(DX1 - 0.5, DX1 - 0.03, 0.0, 0.71, DZ0 + 0.05, DZ1 - 0.05, '#5a3a24')
bx(DX0 + 0.5, DX1 - 0.5, 0.25, 0.71, DZ0 + 0.04, DZ0 + 0.07, '#5a3a24')
for k in range(3):
    for xx in (DX0 + 0.265, DX1 - 0.265): K.box((xx, 0.12 + k * 0.2, DZ1 - 0.035), (0.08, 0.02, 0.02), 'plain', '#c8b890')
K.obstacle((DX0 + DX1) / 2, (DZ0 + DZ1) / 2, DX1 - DX0 + 0.05, DZ1 - DZ0 + 0.05)
K.box((-17.45, 0.75, 10.16), (0.22, 0.02, 0.16), 'plain', '#1a1a1a'); beam((-17.45, 0.76, 10.14), (-17.45, 0.95, 10.14), 0.04, 'plain', '#1a1a1a', sides=4)
K.box((-17.45, 0.92, 10.17), (0.56, 0.34, 0.04), 'plain', '#141414')                                       # monitor faces the manager (south)
lampquad(-17.45, 0.95, 10.193, 0.52, 0.29, 0.0, '#9ec0f0', on('screens'), kind='GlowsCool')
K.box((-17.45, 0.75, 10.5), (0.44, 0.02, 0.14), 'plain', '#2a2a2a')
K.box((-16.85, 0.75, 10.55), (0.18, 0.06, 0.2), 'plain', '#2a2a2a')
for k in range(4): K.box((-18.0 + RG.uniform(-0.03, 0.03), 0.75 + k * 0.035, 10.3), (0.32, 0.03, 0.24), 'plain', RG.choice(['#d8c890', '#e8e4d8', '#c8a868', '#2a5aa8']), rot=RG.uniform(-0.15, 0.15))
K.box((-16.75, 0.75, 10.2), (0.34, 0.08, 0.26), 'plain', '#3a3a3a'); K.box((-16.75, 0.78, 10.2), (0.3, 0.05, 0.22), 'plain', '#ece8dc')   # in-tray
K.cyl((-17.95, 0.75, 10.65), 0.04, 0.12, 'plain', '#2a2a2a', seg=6); K.cyl((-16.62, 0.75, 10.65), 0.045, 0.1, 'plain', '#e8e8e0', seg=6)
K.cyl((-18.15, 0.75, 10.15), 0.08, 0.02, 'plain', '#2a2a2a', seg=8); beam((-18.15, 0.77, 10.15), (-18.05, 1.15, 10.25), 0.02, 'plain', '#2a2a2a', sides=3)
lampbox((-18.0, 1.08, 10.32), (0.16, 0.08, 0.12), '#fff0d0', on('office'), off='#2a2a2a')
if on('office'): K.point((-18.0, 1.0, 10.36), '#ffdcae', 8, 0.05)
def exec_chair(x, z, rot, col='#1e1e20', high=True):
    T = T_(x, z, rot)
    K.box(T(0, 0.42, 0), (0.52, 0.1, 0.5), 'plain', col, rot=rot)
    K.box(T(0, 0.5, -0.22), (0.5, 0.75 if high else 0.45, 0.08), 'plain', col, rot=rot)
    for sd in (-1, 1): K.box(T(sd * 0.27, 0.52, 0.02), (0.05, 0.2, 0.36), 'plain', '#2a2a2a', rot=rot)
    beam(T(0, 0.08, 0), T(0, 0.42, 0), 0.06, 'plain', '#2a2a2a', sides=4)
    for k in range(5):
        a = 2 * PI * k / 5
        beam(T(0, 0.08, 0), T(math.cos(a) * 0.3, 0.04, math.sin(a) * 0.3), 0.04, 'plain', '#2a2a2a', sides=3)
exec_chair(-17.4, 11.25, PI)                                                                                  # behind the desk, facing north
chair(-18.45, 9.25, 0.0, '#5a3a2a')                                                                          # visitor chair, facing the desk
for k in range(3):                                                                                           # filing cabinets (front x -19.17)
    z = 10.31 + k * 0.47
    cube(-19.75, -19.17, 0.0, 1.32, z, z + 0.45, 'tf_cabinet', uv=1.0, faces='XYzZ')
    for j in range(4):
        y = 0.08 + j * 0.31
        bx(-19.17, -19.16, y, y + 0.28, z + 0.02, z + 0.43, '#8a8e94', faces='X')
        K.box((-19.14, y + 0.22, z + 0.225), (0.03, 0.025, 0.12), 'plain', '#c8c8c8')
        K.box((-19.155, y + 0.12, z + 0.225), (0.01, 0.04, 0.07), 'plain', '#e8e4d8')
K.box((-19.4, 1.32, 10.6), (0.3, 0.28, 0.25), 'plain', '#c8a060'); K.box((-19.45, 1.32, 11.3), (0.32, 0.22, 0.3), 'plain', '#2a5aa8')
K.obstacle(-19.45, 11.0, 0.62, 1.45)
cube(-19.75, -19.2, 0.0, 0.62, 9.3, 9.85, 'plain', '#2e3034', faces='XYzZ')                                   # small safe
bx(-19.2, -19.19, 0.05, 0.57, 9.35, 9.8, '#3a3c40', faces='X')
K.cyl((-19.17, 0.36, 9.58), 0.07, 0.04, 'plain', '#b8b8b0', seg=10, axis='x'); K.box((-19.175, 0.2, 9.42), (0.02, 0.1, 0.03), 'plain', '#b8b8b0')
K.obstacle(-19.47, 9.57, 0.6, 0.6)
SX, SZ_ = -18.6, 6.4                                                                                          # the shredder, front facing east
cube(SX - 0.16, SX + 0.16, 0.0, 0.5, SZ_ - 0.22, SZ_ + 0.22, 'plain', '#232325', faces='xXYzZ')
cube(SX + 0.16, SX + 0.161, 0.08, 0.42, SZ_ - 0.2, SZ_ + 0.2, 'plain', '#4a4c50', faces='X')
cube(SX - 0.17, SX + 0.17, 0.5, 0.68, SZ_ - 0.23, SZ_ + 0.23, 'plain', '#1a1a1c', faces='xXYzZ')
cube(SX - 0.015, SX + 0.015, 0.68, 0.682, SZ_ - 0.15, SZ_ + 0.15, 'plain', '#050505', faces='Y')
lampbox((SX + 0.1, 0.682, SZ_ + 0.15), (0.025, 0.006, 0.025), '#40ff70', on('screens'), kind='GlowsCool', off='#1a3a1a')
for k in range(9): beam((SX + 0.163, 0.12, SZ_ - 0.17 + k * 0.04), (SX + 0.163, 0.4, SZ_ - 0.17 + k * 0.04 + 0.01), 0.012, 'plain', '#e8e6de', sides=3)
K.cyl((SX + 0.05, 0.0, SZ_ + 0.5), 0.17, 0.4, 'plain', '#3a3a3c', seg=8, r2=0.19)                         # bin full of strips
for k in range(10):
    a = RG.random() * 2 * PI; rr_ = RG.random() * 0.12
    beam((SX + 0.05 + math.cos(a) * rr_, 0.36, SZ_ + 0.5 + math.sin(a) * rr_), (SX + 0.05 + math.cos(a + 1) * rr_ * 1.2, 0.45 + RG.random() * 0.08, SZ_ + 0.5 + math.sin(a + 1) * rr_), 0.012, 'plain', '#ece8e0', sides=3)
K.obstacle(SX, SZ_ + 0.15, 0.45, 0.95)
bx(-19.75, -19.15, 0.7, 0.74, 4.3, 5.4, '#6a4a30'); bx(-19.72, -19.68, 0.0, 0.7, 4.32, 5.38, '#4a3220'); bx(-19.22, -19.18, 0.0, 0.7, 4.32, 5.38, '#4a3220')
K.box((-19.45, 0.74, 4.85), (0.42, 0.24, 0.48), 'plain', '#d8d8d4'); K.box((-19.45, 0.98, 4.85), (0.3, 0.02, 0.3), 'plain', '#ece8dc')   # printer
K.obstacle(-19.45, 4.85, 0.65, 1.15)
bx(-19.75, -19.45, 1.55, 1.58, 4.35, 5.9, '#6a4a30')
for k in range(7): K.box((-19.6, 1.58, 4.45 + k * 0.2), (0.24, 0.32, 0.08), 'plain', RG.choice(['#2a5aa8', '#a82a2a', '#2a8a4a', '#d8b030', '#3a3a3a']))
board(-15.115, 1.05, 10.2, 1.5, 1.05, -PI / 2, (512, 0, 768, 256))                                         # whiteboard: tank stock
bx(-15.12, -15.1, 1.0, 1.05, 9.45, 10.95, '#b8b8b8', faces='x'); bx(-15.12, -15.1, 2.1, 2.14, 9.45, 10.95, '#b8b8b8', faces='x')
quadv(-15.6, 1.35, IZ1 - 0.01, 0.4, 0.5, PI, 'tf_signs', uvrect=atlas(512, 896, 640, 1024))                 # calendar
quadv(-19.1, 1.6, IZ1 - 0.01, 0.55, 0.42, PI, 'tf_signs', uvrect=atlas(640, 896, 768, 1024))                # certificate
board(-16.1, 1.2, IZ0 + 0.01, 1.2, 0.85, 0.0, (256, 256, 512, 512))                                         # waterways map
quadv(-15.6, 2.45, IZ0 + 0.01, 0.34, 0.34, 0.0, 'tf_signs', uvrect=atlas(768, 896, 896, 1024))              # clock
K.box((-19.62, 2.45, 7.6), (0.22, 0.32, 0.9), 'plain', '#ececea')                                            # split AC over the window
cube(-15.75, -15.15, 0.0, 0.82, 4.35, 5.0, 'plain', '#5a3a24', faces='xXYzZ')                                 # side cabinet + kettle
K.cyl((-15.5, 0.82, 4.6), 0.08, 0.2, 'plain', '#c8c8c8', seg=8); K.box((-15.32, 0.82, 4.75), (0.16, 0.1, 0.12), 'plain', '#e8e8e4')
K.obstacle(-15.45, 4.67, 0.65, 0.7)
plant(-15.45, 11.4, pot='#d8d0c0', h=0.34, n=5)
K.obstacle(-15.45, 11.4, 0.5, 0.5)
bx(-19.7, -19.66, 1.75, 2.32, 6.6, 8.6, '#d8d4c4', faces='X')                                                # blind, half drawn
LMW[0] = 1.0

# ================================================================== QC LAB SHED (x -18.2..-13.8, z -8.2..-3.8), door in its south face
LMW[0] = 1.1
LX0, LX1, LZ0, LZ1, LH = -18.2, -13.8, -8.2, -3.8, 2.85
owall('x', LZ1 - 0.2, LZ1, LX0, LX1, [(-15.75, -14.65, 0.0, 2.2)], y1=LH, mat='tf_lab', collide=True)
owall('z', LX1 - 0.2, LX1, LZ0, LZ1 - 0.2, [(-6.8, -5.6, 1.0, 2.0)], y1=LH, mat='tf_lab', collide=True)
owall('z', LX0, LX0 + 0.2, LZ0, LZ1 - 0.2, [], y1=LH, mat='tf_lab', collide=True)
owall('x', LZ0, LZ0 + 0.2, LX0 + 0.2, LX1 - 0.2, [], y1=LH, mat='tf_lab', collide=True)
RH0, RH1 = LH + 0.45, LH - 0.05                                              # roof: high at the south, low at the north
sheet((LX0 - 0.35, RH0, LZ1 + 0.5), (LX1 + 0.35, RH0, LZ1 + 0.5), (LX1 + 0.35, RH1, LZ0 - 0.4), (LX0 - 0.35, RH1, LZ0 - 0.4), 'roof_sheet', uv=1.0)
def roof_y(z): return RH1 + (RH0 - RH1) * (z - (LZ0 - 0.4)) / (LZ1 + 0.5 - (LZ0 - 0.4))
for (xf, f) in [(LX0, 'x'), (LX1, 'X')]:
    poly([(xf, LH, LZ0), (xf, LH, LZ1), (xf, roof_y(LZ1) - 0.02, LZ1), (xf, roof_y(LZ0) - 0.02, LZ0)], [(0, 3, 2, 1) if f == 'X' else (0, 1, 2, 3)], 'tf_lab', uv=0.5)
cube(LX0, LX1, LH, roof_y(LZ1) - 0.02, LZ1 - 0.2, LZ1, 'tf_lab', uv=0.5, faces='zZ')
LMW[0] = 1.5
cube(LX0 + 0.2, LX1 - 0.2, 0.0, 0.02, LZ0 + 0.2, LZ1 - 0.2, 'tf_tiles', uv=1.0, faces='Y')
cube(-15.75, -14.65, 0.0, 0.02, LZ1 - 0.2, LZ1, 'tf_tiles', uv=1.0, faces='Y')
cube(LX0 + 0.2, LX1 - 0.2, LH - 0.06, LH - 0.05, LZ0 + 0.2, LZ1 - 0.2, 'plain', '#e8e6e0', faces='y')
bx(-16.9, -14.4, 0.86, 0.9, -6.75, -6.05, '#e8e8e2'); bx(-16.85, -14.45, 0.0, 0.86, -6.7, -6.1, '#7a7e84')    # island bench
for k in range(4): K.box((-16.55 + k * 0.6, 0.6, -6.09), (0.18, 0.025, 0.02), 'plain', '#c8c8c8')
K.obstacle(-15.65, -6.4, 2.55, 0.75)
K.cyl((-15.2, 0.9, -6.35), 0.055, 0.42, 'plain', '#3a2a14', seg=10)                                        # hydrometer jar (dark sample)
K.cyl((-15.2, 0.9, -6.35), 0.075, 0.015, 'plain', '#d8d8d0', seg=10)
beam((-15.2, 1.18, -6.35), (-15.2, 1.48, -6.35), 0.012, 'plain', '#e8e8e0', sides=3); K.sphere((-15.2, 1.12, -6.35), 0.025, 'plain', '#c8c8c0', seg=6)
Bb = Batch()
for k, col in enumerate(['#d8b850', '#c8a040', '#1a120a', '#e0d090', '#1e140c']):
    Bb.prism(-15.75 + k * 0.11, 0.9, -6.25, 0.04, 0.18, col, n=5); Bb.prism(-15.75 + k * 0.11, 1.08, -6.25, 0.04, 0.06, shade(col, 0.8), n=5, r2=0.016)
Bb.emit()
K.box((-14.75, 0.9, -6.4), (0.3, 0.22, 0.26), 'plain', '#c8c4b8'); K.cyl((-14.75, 1.12, -6.45), 0.06, 0.06, 'plain', '#9a9a98', seg=8)   # flash-point tester
K.box((-16.4, 0.9, -6.45), (0.3, 0.02, 0.22), 'plain', '#2a4a8a')
poly([(-16.53, 0.925, -6.54), (-16.27, 0.925, -6.54), (-16.27, 0.925, -6.36), (-16.53, 0.925, -6.36)], [(0, 3, 2, 1)], 'plain', '#ece8dc')
K.box((-16.0, 0.9, -6.2), (0.16, 0.02, 0.1), 'plain', '#3a6ab8')
for k in range(3):                                                                                           # sample shelves on the north wall
    y = 1.0 + k * 0.42
    Bb = Batch()
    Bb.box(-17.9, -14.2, y, y + 0.03, -8.0, -7.72, '#8a8e94', 'YyZ')
    for j in range(16):
        col = RG.choice(['#d8b850', '#c89a40', '#e0d090', '#d0c8b0', '#1a120a']) if j % 5 else '#1a120a'
        Bb.prism(-17.75 + j * 0.225, y + 0.03, -7.86, 0.045, 0.22, col, n=4, r2=0.03, a0=PI / 4)
    Bb.emit()
bx(-18.0, -17.4, 0.0, 0.9, -7.6, -4.6, '#7a7e84'); bx(-18.02, -17.38, 0.9, 0.94, -7.62, -4.58, '#e8e8e2')
K.obstacle(-17.7, -6.1, 0.65, 3.05)
K.box((-17.7, 0.94, -7.1), (0.42, 0.3, 0.4), 'plain', '#d8d8d4'); K.box((-17.7, 0.94, -5.6), (0.4, 0.38, 0.45), 'plain', '#c8c8c4')
lampbox((-17.49, 1.2, -5.6), (0.02, 0.04, 0.1), '#ff5a3a', on('lab'), kind='GlowsRed', off='#5a2a20')
board(-14.01, 1.3, -7.55, 0.8, 0.8, -PI / 2, (0, 256, 256, 512))                                          # QC chart
fire_ext(-14.25, -4.3)
stool(-14.6, -5.0, '#3a3a3a', h=0.62)
for (tz, tw) in [(-6.6, 130), (-4.9, 110)]:
    if on('lab'): tube(-15.9, LH - 0.17, tz, length=1.2, axis='x', watts=tw, color='#eef6ff', light='#e8f2ff')
    else: bx(-16.5, -15.3, LH - 0.15, LH - 0.1, tz - 0.05, tz + 0.05, '#d8d8d0')
K.box((-14.17, 0.01, -3.55), (0.95, 2.15, 0.05), 'plain', '#5a6a7a', rot=-0.25)                            # door leaf, open
sign(-15.2, 2.45, LZ1 + 0.008, 1.6, 0.2, 0.0, (512, 448, 1024, 512))
sign(-16.8, 1.5, LZ1 + 0.008, 0.45, 0.45, 0.0, (384, 256, 512, 384))
gwindow('z', LX1 - 0.1, -6.8, -5.6, 1.0, 2.0, 1)
LMW[0] = 1.0

# ================================================================== TANKS T1..T4 in their bunds
LMW[0] = 0.42
def spiral_span(r, h, rise=0.225, tread=0.27):
    return int((h - 0.3) / rise) * tread / (r + 0.48)

def spiral_stair(cx, cz, r, h, a0, rise=0.225, tread=0.27, width=0.8):
    ri, ro = r + 0.08, r + 0.08 + width
    rc = (ri + ro) / 2
    n = int((h - 0.3) / rise)
    dth = tread / rc
    P = lambda rad, ang, y: (cx + math.cos(ang) * rad, y, cz + math.sin(ang) * rad)
    Bt = Batch()
    for k in range(n):                                   # connected profile: tread (horizontal) + riser (vertical), one island
        a, a1 = a0 + k * dth, a0 + (k + 1) * dth; y0_, y = 0.3 + k * rise, 0.3 + (k + 1) * rise
        Bt.face([P(ri, a, y0_), P(ri, a, y), P(ro, a, y), P(ro, a, y0_)], '#3a3c3a')        # riser (faces back down the stair)
        Bt.face([P(ri, a, y), P(ri, a1, y), P(ro, a1, y), P(ro, a, y)], '#6a6c6a')           # tread
    at = a0 + n * dth
    Bt.face([P(ri, at, h), P(ri, at + 0.16, h), P(ro, at + 0.16, h), P(ro, at, h)], '#6a6c6a')
    ks = list(range(0, n + 1, 6)) + ([n] if n % 6 else [])
    pts_o = [P(ro + 0.03, a0 + k * dth, 0.3 + k * rise) for k in ks]
    for a_, b_ in zip(pts_o, pts_o[1:]): Bt.tube(a_, b_, 0.05, '#5a5c5a', n=3, caps=False)
    brail(Bt, [(p[0], p[1] + 0.05, p[2]) for p in pts_o], h=1.0, post_every=99, color='#c8a828', mid=False)
    ob = Bt.emit()
    if NIGHT: ob.visible_shadow = False      # the floods would print a stair-stepped (aliased) stair shadow across the shell
    K._collide(P(rc, a0 + 0.12, 0), (0.9, 1, 0.9), 0, True, False)

def caged_ladder(cx, cz, r, h, a):
    ox, oz = math.cos(a), math.sin(a)
    tx, tz = -oz, ox
    base = lambda d, t, y: (cx + ox * (r + d) + tx * t, y, cz + oz * (r + d) + tz * t)
    for t in (-0.22, 0.22): beam(base(0.22, t, 0.3), base(0.22, t, h + 1.1), 0.05, 'plain', '#6a6c6a', sides=3)
    Bt = Batch()
    for k in range(int((h + 0.5) / 0.45)):
        y = 0.6 + k * 0.45
        Bt.tube(base(0.22, -0.22, y), base(0.22, 0.22, y), 0.016, '#6a6c6a', n=3, caps=False)
    for k in range(int((h - 2.4) / 1.6) + 1):
        y = 2.4 + k * 1.6
        pts = [base(0.22, -0.36, y), base(0.58, -0.36, y), base(0.76, 0.0, y), base(0.58, 0.36, y), base(0.22, 0.36, y)]
        for a_, b_ in zip(pts, pts[1:]): Bt.tube(a_, b_, 0.018, '#6a6c6a', n=3, caps=False)
    Bt.emit()
    for t, d in [(-0.36, 0.58), (0.36, 0.58), (0.0, 0.76)]:
        beam(base(d, t, 2.4), base(d, t, h + 1.0), 0.03, 'plain', '#6a6c6a', sides=3)

def tank(cx, cz, r, h, band, stair, sa0, nozzle, risers):
    seg = 32
    K.cyl((cx, 0.0, cz), r + 0.45, 0.3, 'concrete', seg=24, caps=False, uv=1.0, r2=r + 0.03)   # chamfered ring foundation
    # shell: cylindrical UVs into band `band` of tf_tank (u runs so text reads left-to-right from outside)
    vs, fs = [], []
    for i in range(seg + 1):
        a = 2 * PI * i / seg
        vs += [(cx + math.cos(a) * r, 0.3, cz + math.sin(a) * r), (cx + math.cos(a) * r, h, cz + math.sin(a) * r)]
    for i in range(seg): fs.append((2 * i, 2 * i + 1, 2 * i + 3, 2 * i + 2))
    ob = poly(vs, fs, 'tf_tank')
    uvs = ob.data.uv_layers['UVMap'].data
    vb, vt = 1 - (band + 1) * 0.25 + 2 / 1024, 1 - band * 0.25 - 2 / 1024
    for p in ob.data.polygons:
        for l in p.loop_indices:
            i, top = divmod(ob.data.loops[l].vertex_index, 2)
            uvs[l].uv = (1 - i / seg, vt if top else vb)
    K.cyl((cx, h - 0.14, cz), r + 0.05, 0.14, 'plain', '#9a9a96', seg=24, caps=False)          # curb angle
    K.cyl((cx, h - 1.05, cz), r + 0.3, 0.1, 'plain', '#c8c8c2', seg=24, caps=False)            # wind girder (lip + sloped top)
    K.cyl((cx, h - 0.95, cz), r + 0.3, 0.05, 'plain', '#bcbcb6', seg=24, caps=False, r2=r + 0.01)
    rise = r * math.tan(math.radians(9))
    apex = (cx, h + rise, cz); rim = [(cx + math.cos(2 * PI * i / seg) * (r + 0.08), h, cz + math.sin(2 * PI * i / seg) * (r + 0.08)) for i in range(seg)]
    w0 = LMW[0]; LMW[0] = 0.25
    poly([apex] + rim, [(0, 1 + (i + 1) % seg, 1 + i) for i in range(seg)], 'tf_roof', uv=0.25)
    LMW[0] = w0
    K.cyl((cx, h + rise - 0.05, cz), 0.45, 0.25, 'plain', '#b8b8b2', seg=8)
    K.cyl((cx + r * 0.45, h + rise * 0.55 - 0.05, cz - r * 0.2), 0.3, 0.22, 'plain', '#a8a8a2', seg=8)
    if stair == 'spiral':
        spiral_stair(cx, cz, r, h, sa0); a_top = sa0 + spiral_span(r, h)
    else:
        caged_ladder(cx, cz, r, h, sa0); a_top = sa0
    arc = [(cx + math.cos(a_top + d) * (r - 0.25), h + rise * (0.25 / r), cz + math.sin(a_top + d) * (r - 0.25)) for d in [k * 0.13 for k in range(-4, 9)]]
    Br = Batch(); brail(Br, arc[::2], h=1.05, post_every=2.5, color='#c8a828', mid=False); Br.emit()
    for ra in risers:                                                                         # fire water risers + foam pourers
        x0, z0 = cx + math.cos(ra) * (r + 0.25), cz + math.sin(ra) * (r + 0.25)
        pipe((x0, 0.2, z0), (x0, h + 0.15, z0), 0.14, '#c0261c')
        K.box((x0, h - 0.6, z0), (0.36, 0.5, 0.36), 'plain', '#c0261c', rot=-ra)
        K.box((x0, 0.0, z0), (0.3, 0.6, 0.3), 'plain', '#c0261c', rot=-ra)
    na = nozzle                                                                               # outlet nozzle + valve
    x0, z0 = cx + math.cos(na) * r, cz + math.sin(na) * r
    x1, z1 = cx + math.cos(na) * (r + 0.9), cz + math.sin(na) * (r + 0.9)
    pipe((x0, 0.75, z0), (x1, 0.75, z1), 0.32, '#8a8c8a', sides=8)
    valve(x1, 0.75, z1, d=0.34, axis='x' if abs(math.cos(na)) > 0.7 else 'z')
    ma = na + 0.5                                                                             # manway, gauge pole + board
    mx, mz = cx + math.cos(ma) * (r + 0.05), cz + math.sin(ma) * (r + 0.05)
    beam((mx - math.cos(ma) * 0.05, 1.05, mz - math.sin(ma) * 0.05), (mx + math.cos(ma) * 0.12, 1.05, mz + math.sin(ma) * 0.12), 0.75, 'plain', '#b8b8b2', sides=10)
    ga = na - 0.45
    gx, gz = cx + math.cos(ga) * (r + 0.12), cz + math.sin(ga) * (r + 0.12)
    beam((gx, 0.3, gz), (gx, h + 0.4, gz), 0.06, 'plain', '#4a4a48', sides=4)
    K.box((gx + math.cos(ga) * 0.08, 1.0, gz + math.sin(ga) * 0.08), (0.3, 0.5, 0.3), 'plain', '#e8e4d8', rot=-ga)
    circle_obstacle(cx, cz, r + 0.2)
    return (x1, z1)

T1V = tank(8.0, 10.0, 6.0, 9.0, 0, 'spiral', math.radians(15), math.radians(242.3), [math.radians(60), math.radians(300)])
T2V = tank(21.0, 10.0, 5.5, 9.0, 1, 'ladder', math.radians(330), math.radians(240), [math.radians(110)])
T3X, T3R = 8.6, 5.5                                  # T3 slimmed + nudged east so its west shell (x 3.1) clears the tank3_valve anchor (2.4, -7)
T3V = tank(T3X, -7.0, T3R, 9.0, 2, 'spiral', math.radians(200), math.radians(118.2), [math.radians(30), math.radians(250)])
T4V = tank(21.0, -7.0, 5.5, 9.0, 3, 'ladder', math.radians(30), math.radians(120), [math.radians(200)])
# T3's sample point on its west side (anchor tank3_valve (2.4, 0, -7) faces it): nipple + valve + tray + sample cans + sign
SPX = T3X - T3R                                      # the shell at z -7
pipe((SPX, 0.95, -7.0), (SPX - 0.32, 0.95, -7.0), 0.07, '#8a8c8a')
K.box((SPX - 0.32, 0.9, -7.0), (0.12, 0.1, 0.1), 'plain', '#3a5a9a')
beam((SPX - 0.34, 0.95, -7.0), (SPX - 0.34, 1.15, -7.0), 0.025, 'plain', '#c02a20', sides=3)
K.box((SPX - 0.34, 1.15, -7.0), (0.04, 0.02, 0.16), 'plain', '#c02a20')
K.box((SPX - 0.5, 0.0, -7.0), (0.3, 0.04, 0.3), 'plain', '#2a2a2a')
K.cyl((SPX - 0.6, 0.0, -6.5), 0.12, 0.26, 'plain', '#d8d8d0', seg=8, r2=0.14)
K.cyl((SPX - 0.62, 0.0, -7.48), 0.09, 0.3, 'plain', '#e0d8c0', seg=6, r2=0.06)
sign(SPX + 0.01, 1.45, -6.4, 0.4, 0.4, -PI / 2, (640, 256, 768, 384))
# bund walls (1.1 m) with the access opening on T3's west side; tank number boards
LMW[0] = 0.6
BW, BH = 0.25, 1.1
def bund(x0, x1, z0, z1, gap=None):
    for z in (z0, z1 - BW): cube(x0, x1, 0, BH, z, z + BW, 'concrete', uv=1.0, faces='zZY', collide=True)
    for x in (x0, x1 - BW):
        segs = [(z0 + BW, gap[0]), (gap[1], z1 - BW)] if (gap and x == x0) else [(z0 + BW, z1 - BW)]
        for (s0, s1) in segs: cube(x, x + BW, 0, BH, s0, s1, 'concrete', uv=1.0, faces='xXYzZ', collide=True)
    cube(14.75 - BW / 2, 14.75 + BW / 2, 0, BH * 0.8, z0 + BW, z1 - BW, 'concrete', uv=1.0, faces='xXY', collide=True)
bund(*BUND_N, gap=(-7.6, -6.4))
bund(*BUND_S)
bx(0.85, 1.05, 0.0, BH, -6.4, -6.32, '#4a4c4a'); bx(1.05, 1.1, 0.0, BH - 0.1, -6.32, -5.2, '#5a5c5a')     # the open flood gate
for (x, z, rot, k) in [(T3X, -14.605, PI, 2), (21.0, -14.605, PI, 3), (8.0, 17.405, 0.0, 0), (21.0, 17.405, 0.0, 1), (0.795, 10.0, -PI / 2, 0), (0.795, -11.5, -PI / 2, 2)]:
    quadv(x, 0.3, z, 1.0, 0.5, rot, 'tf_signs', uvrect=atlas(k * 256, 640, k * 256 + 256, 768))
LMW[0] = 1.0

# ================================================================== PUMP MANIFOLD between the bunds (x 1.4..6, z 0.3..2.9), product pipes
cube(1.4, 6.0, 0.0, 0.15, 0.3, 2.9, 'concrete', uv=1.0, faces='xXYzZ')
for z in (0.8, 2.4):
    K.cyl((3.2, 0.47, z), 0.3, 0.75, 'plain', '#2a6a4a', seg=10, axis='x')                    # motor
    K.cyl((3.85, 0.47, z), 0.24, 0.45, 'plain', '#5a5c60', seg=10, axis='x')                  # pump
    K.box((3.35, 0.15, z), (1.6, 0.14, 0.5), 'plain', '#3a3c3e')
    pipe((4.1, 0.47, z), (5.0, 0.47, z), 0.26, '#8a8c8a'); pipe((3.85, 0.7, z), (3.85, 1.1, z), 0.22, '#8a8c8a')
    pipe((1.6, 1.1, z), (5.9, 1.1, z), 0.28, '#8a8c8a')                                        # headers
    valve(2.4, 1.1, z, axis='x'); valve(5.3, 1.1, z, axis='x', color='#c8a020')
    for x in (1.8, 5.6): bx(x - 0.12, x + 0.12, 0.15, 1.0, z - 0.12, z + 0.12, '#7a7672')
K.box((1.75, 0.15, 1.6), (0.5, 1.4, 0.35), 'plain', '#9aa0a8'); K.box((1.98, 1.1, 1.6), (0.04, 0.18, 0.2), 'plain', '#2a2a2a')
lampbox((1.99, 1.25, 1.52), (0.015, 0.04, 0.04), '#40ff70', True, kind='GlowsCool')
for x in (1.45, 5.95):
    for z in (0.4, 2.8): beam((x, 0.15, z), (x, 3.0, z), 0.1, 'plain', '#4a4c4e', sides=4)
sheet((1.25, 3.05, 0.2), (6.15, 3.05, 0.2), (6.15, 2.85, 3.0), (1.25, 2.85, 3.0), 'roof_sheet', uv=1.0)
K.obstacle(3.7, 1.6, 4.7, 2.7)
path_pipe([(T1V[0], 0.75, T1V[1]), (T1V[0], 0.75, 2.7), (T1V[0], 1.1, 2.4)], 0.3)
path_pipe([(T3V[0], 0.75, T3V[1]), (T3V[0], 0.75, 0.5), (T3V[0], 1.1, 0.8)], 0.3)
path_pipe([(T2V[0], 0.75, T2V[1]), (T2V[0], 0.45, 2.2), (6.05, 0.45, 2.2), (6.05, 1.1, 2.4), (5.9, 1.1, 2.4)], 0.3)
path_pipe([(T4V[0], 0.75, T4V[1]), (T4V[0], 0.45, 1.0), (6.05, 0.45, 1.0), (6.05, 1.1, 0.8), (5.9, 1.1, 0.8)], 0.3)
for x in range(8, 18, 3): bx(x - 0.15, x + 0.15, 0.0, 0.28, 0.7, 2.5, '#8a8680')
K.obstacle(12.0, 1.6, 12.2, 2.0)
# pipe bridge to the gantry (y 6.3) and the overhead rack to the jetty (y 4.4 along x 0.25/0.55)
GW = '#9a9c9a'
for (zz, xg) in [(0.8, -4.05), (2.4, -4.35)]:
    path_pipe([(1.6, 1.1, zz), (1.0, 1.1, zz), (1.0, 6.3, zz), (xg, 6.3, zz), (xg, 6.3, -9.5)], 0.22, GW)
for z in (0.35, 2.85): beam((1.0, 0.0, z), (1.0, 6.5, z), 0.18, 'plain', '#4a4c4e', sides=4)
beam((1.0, 6.5, 0.35), (1.0, 6.5, 2.85), 0.16, 'plain', '#4a4c4e', sides=4)
K.obstacle(1.0, 0.35, 0.3, 0.3); K.obstacle(1.0, 2.85, 0.3, 0.3)
for (xx, zz) in [(0.25, 0.8), (0.55, 2.4)]:
    path_pipe([(1.6, 1.1, zz), (xx, 1.1, zz), (xx, 4.4, zz), (xx, 4.4, -22.6), (xx, -0.15, -22.6), (xx, -0.15, -22.95), (2.0, -0.15, -22.95)], 0.24, '#8a8c8a')
K.obstacle(0.4, 1.6, 0.6, 1.9)
for z in (-2.5, -12.0, -17.5, -22.3):
    beam((0.4, 0.0, z), (0.4, 4.2, z), 0.22, 'plain', '#4a4c4e', sides=4)
    beam((-0.05, 4.2, z), (0.85, 4.2, z), 0.16, 'plain', '#4a4c4e', sides=4)
    K.obstacle(0.4, z, 0.35, 0.35)
cube(0.0, 2.3, -0.02, 0.0, -23.2, -22.75, 'tf_grating', uv=2.0, faces='Y')
cube(1.75, 2.3, -0.02, 0.0, -24.0, -23.2, 'tf_grating', uv=2.0, faces='Y')
LMW[0] = 1.0

# ================================================================== TRUCK LOADING GANTRY (island x -5.1..-3.3 centred -4.2, bays x -6.9 / -1.5)
LMW[0] = 0.9
ISX = -4.2
for z in (1.0, -4.8, -10.2):
    bx(ISX - 0.22, ISX + 0.22, 0.0, 7.0, z - 0.22, z + 0.22, '#d8b428')
    bx(ISX - 0.3, ISX + 0.3, 0.0, 0.25, z - 0.3, z + 0.3, '#8a8680')
    K.obstacle(ISX, z, 0.6, 0.6)
    bx(-9.6, 1.2, 6.95, 7.4, z - 0.15, z + 0.15, '#d8b428')
    for sd in (-1, 1): beam((ISX, 5.2, z), (ISX + sd * 3.0, 6.95, z), 0.14, 'plain', '#d8b428', sides=4)
B = Batch()
for x in (-9.4, -7.0, -4.2, -1.4, 1.0): B.box(x - 0.08, x + 0.08, 7.25, 7.4, -10.9, 1.7, '#c8a828', 'xXyzZ')
B.emit()
cube(-9.7, 1.3, 7.4, 7.5, -11.0, 1.8, 'roof_sheet', uv=1.0, faces='Yy')
cube(-9.7, 1.3, 6.9, 7.5, 1.8, 1.85, 'plain', '#e8e6e0', faces='Z'); cube(-9.75, -9.7, 6.9, 7.5, -11.0, 1.85, 'plain', '#e8e6e0', faces='x')
cube(1.3, 1.35, 6.9, 7.5, -11.0, 1.85, 'plain', '#e8e6e0', faces='X'); cube(-9.7, 1.3, 6.9, 7.5, -11.05, -11.0, 'plain', '#e8e6e0', faces='z')
quadv(-4.2, 6.93, 1.856, 5.6, 0.54, 0.0, 'tf_signs', uvrect=atlas(0, 128, 512, 256))
quadv(-9.756, 6.93, -4.6, 5.6, 0.54, -PI / 2, 'tf_signs', uvrect=atlas(0, 128, 512, 256))
PY = 4.0
cube(ISX - 0.9, ISX + 0.9, PY - 0.08, PY, -10.6, 1.2, 'tf_grating', uv=2.0, faces='Yy')
for sd in (-1, 1):
    bx(ISX + sd * 0.9 - 0.03, ISX + sd * 0.9 + 0.03, PY, PY + 0.15, -10.6, 1.2, '#d8b428')
    rail_run([(ISX + sd * 0.88, PY, 1.2), (ISX + sd * 0.88, PY, -4.3)], h=1.05, color='#d8b428')
    rail_run([(ISX + sd * 0.88, PY, -5.2), (ISX + sd * 0.88, PY, -10.6)], h=1.05, color='#d8b428')
rail_run([(ISX - 0.88, PY, 1.18), (ISX + 0.88, PY, 1.18)], h=1.05, color='#d8b428')
nst = 18
Bs = Batch()
for k in range(nst):
    za, zb = -10.6 - k * (3.6 / nst), -10.6 - (k + 1) * (3.6 / nst); y = PY - (k + 1) * (PY / nst); yt = PY - k * (PY / nst)
    Bs.face([(ISX - 0.45, y, za), (ISX - 0.45, yt, za), (ISX + 0.45, yt, za), (ISX + 0.45, y, za)], '#4a4c4a')   # riser, faces -z
    Bs.face([(ISX - 0.45, y, zb), (ISX - 0.45, y, za), (ISX + 0.45, y, za), (ISX + 0.45, y, zb)], '#6a6c6a')     # tread
Bs.emit()
for sd in (-1, 1):
    beam((ISX + sd * 0.47, PY, -10.6), (ISX + sd * 0.47, 0.0, -14.2), 0.14, 'plain', '#d8b428', sides=4)
    beam((ISX + sd * 0.5, PY + 1.0, -10.6), (ISX + sd * 0.5, 1.0, -14.2), 0.05, 'plain', '#d8b428', sides=3)
K.obstacle(ISX, -12.4, 1.1, 3.6)
for (bayx, sd) in [(-6.9, -1), (-1.5, 1)]:                       # loading arms + lowered gangways
    for z in (-2.6, -6.6):
        px = ISX + sd * 0.95
        pipe((ISX + sd * 0.3, 6.3, z), (ISX + sd * 0.3, PY + 0.1, z), 0.16, GW)
        pipe((ISX + sd * 0.3, PY + 0.6, z), (px, PY + 0.6, z), 0.16, GW)
        K.cyl((px, PY + 0.45, z), 0.13, 0.3, 'plain', '#5a5c60', seg=8)
        elbow = (bayx - sd * 0.4, PY + 1.25, z + 0.3)
        pipe((px, PY + 0.6, z), elbow, 0.14, '#b8bcc0'); pipe(elbow, (bayx + sd * 0.1, 3.55, z + 0.5), 0.12, '#b8bcc0')
        pipe((bayx + sd * 0.1, 3.55, z + 0.5), (bayx + sd * 0.1, 3.1, z + 0.5), 0.1, '#2a2a2a')
        K.box((px - sd * 0.25, PY + 0.95, z - 0.3), (0.3, 0.35, 0.3), 'plain', '#2a2a2a')
    gx0 = ISX + sd * 0.9; gx1 = bayx - sd * 0.2
    poly([(gx0, PY, -5.1), (gx1, 3.45, -5.1), (gx1, 3.45, -4.4), (gx0, PY, -4.4)], [(0, 1, 2, 3) if sd < 0 else (0, 3, 2, 1)], 'plain', '#6a6c6a')
    for zz in (-5.1, -4.4): beam((gx0, PY + 1.0, zz), (gx1, 3.45 + 1.0, zz), 0.04, 'plain', '#d8b428', sides=3)
for z in (-1.6, -7.8):                                             # preset/metering cabinets + meter runs
    bx(ISX - 0.3, ISX + 0.3, 0.0, 1.55, z - 0.2, z + 0.2, '#b8bcc4')
    bx(ISX - 0.32, ISX + 0.32, 1.55, 1.6, z - 0.22, z + 0.22, '#8a8e94')
    for sd in (-1, 1): lampquad(ISX + sd * 0.305, 1.15, z, 0.24, 0.16, sd * PI / 2, '#7affa0', on('gantry'), kind='GlowsCool', off='#1a2a20')
    K.obstacle(ISX, z, 0.7, 0.5)
    for sd in (-1, 1):
        path_pipe([(ISX + sd * 0.55, 0.0, z - 0.9), (ISX + sd * 0.55, 0.9, z - 0.9), (ISX + sd * 0.55, 0.9, z - 1.5)], 0.16, GW)
        K.cyl((ISX + sd * 0.55, 0.9, z - 1.2), 0.14, 0.36, 'plain', '#3a5a9a', seg=8, axis='z')
K.box((ISX + 0.25, 1.1, 0.75), (0.3, 0.4, 0.2), 'plain', '#e8c020')
fire_ext(ISX - 0.15, 1.85, big=True); fire_ext(ISX + 0.3, -11.0)
for x in (ISX - 0.7, ISX + 0.7):
    K.cyl((x, 0.0, 2.25), 0.11, 0.95, 'plain', '#e8c020', seg=8); K.cyl((x, 0.95, 2.25), 0.115, 0.02, 'plain', '#1a1a1a', seg=8)
    K._collide((x, 0, 2.25), (0.25, 1, 0.25), 0, True, False)
sign(ISX, 2.3, 1.225, 0.42, 0.42, 0.0, (0, 256, 128, 384))
sign(ISX, 2.3, -4.575, 0.42, 0.42, 0.0, (512, 256, 640, 384))
sign(ISX, 2.3, -10.425, 0.84, 0.42, PI, (256, 384, 512, 512))
for (x, cell) in [(-6.9, (256, 512, 512, 640)), (-1.5, (512, 512, 768, 640))]:
    sign(x, 6.2, 1.6, 1.0, 0.5, 0.0, cell, back='#2a2a2a')
    for dx in (-0.4, 0.4): beam((x + dx, 6.7, 1.6), (x + dx, 6.95, 1.6), 0.02, 'plain', '#2a2a2a', sides=3)
for x in (-6.9, -1.5):
    cube(x - 0.2, x + 0.2, 0.0, 0.006, -10.4, 1.2, 'tf_grating', uv=2.0, faces='Y')
    cube(x - 1.4, x + 1.4, 0.0, 0.005, -10.9, -10.7, 'plain', '#d8d4c8', faces='Y')
for sd in (-1, 1):
    cube(ISX + sd * 0.9 - 0.08, ISX + sd * 0.9 + 0.08, 0.0, 0.006, -10.6, 1.8, 'tf_hazard', uv=2.0, faces='Y')
for x in (-6.9, -1.5):                                             # under-canopy lights (the gantry lights)
    for z in (0.2, -4.6, -9.4):
        B = Batch(); B.box(x - 0.12, x + 0.12, 6.86, 6.95, z - 0.7, z + 0.7, '#d8d8d4', 'xXyzZ'); B.emit()
        lampbox((x, 6.84, z), (0.18, 0.025, 1.3), '#eef6ff', on('gantry'), kind='GlowsCool', off='#c8ccd0')
        if on('gantry'): K.area((x, 6.78, z), (0.25, 1.3), '#e6f0ff', 260 if NIGHT else 200, (0, -1, 0))
LMW[0] = 1.0

# ---------------------------------------------------------------- tanker trucks (static props; cab at local -z)
def tanker(x, z, rot, cab='#e8e6e0', stripe='#c0261c', tank_c='#d8dadc'):
    T = T_(x, z, rot)
    K.box(T(0, 1.05, -3.85), (2.44, 2.3, 2.1), 'plain', cab, rot=rot)                     # cab-over cab
    K.cyl(T(0, 2.25, 1.15), 1.15, 6.6, 'plain', tank_c, seg=14, axis='z', rot=rot)       # tank barrel
    BL, BU = Batch(), Batch()
    for sd in (-1, 1): BL.box(sd * 0.45 - 0.07, sd * 0.45 + 0.07, 0.72, 0.98, -3.6, 4.8, '#1e1e20', 'xXYzZ', T)
    for (lz, dual) in [(-2.75, False), (2.35, True), (3.7, True)]:
        for sd in (-1, 1):
            wx, hw = sd * (1.0 if dual else 1.05), (0.29 if dual else 0.16)
            BL.tube(T(wx - hw, 0.5, lz), T(wx + hw, 0.5, lz), 0.5, '#161616', n=8)
            BL.box(wx + sd * hw - 0.005, wx + sd * hw + 0.005, 0.32, 0.68, lz - 0.18, lz + 0.18, '#8a8a86', 'X' if sd > 0 else 'x', T)
    BU.box(-1.23, 1.23, 0.95, 1.01, 1.9, 4.2, '#1a1a1a', 'xXYzZ', T)                      # rear mudguard deck
    BL.box(-1.25, 1.25, 0.62, 1.0, -5.05, -4.89, '#2a2a2c', 'xXYzZ', T)                    # bumper + lamps
    for sd in (-1, 1): BL.box(sd * 0.95 - 0.15, sd * 0.95 + 0.15, 0.7, 0.84, -5.07, -5.05, '#f0ead0', 'zxX', T)
    BU.box(-1.23, 1.23, 1.25, 1.53, -4.91, -2.79, stripe, 'xXzZ', T)                      # cab stripe
    BU.box(-1.15, 1.15, 3.35, 3.6, -4.85, -3.05, cab, 'xXYzZ', T)                         # roof cap
    BU.box(-1.1, 1.1, 2.05, 3.05, -4.906, -4.905, '#141c24', 'z', T)                       # windscreen
    BU.box(-0.8, 0.8, 1.55, 1.95, -4.906, -4.905, '#2a2c2e', 'z', T)                       # grille
    for sd in (-1, 1):
        f = 'X' if sd > 0 else 'x'
        BU.box(sd * 1.2251 - 0.0005, sd * 1.2251 + 0.0005, 2.15, 3.0, -4.6, -3.3, '#141c24', f, T)   # side window
        BU.box(sd * 1.2252 - 0.0005, sd * 1.2252 + 0.0005, 1.15, 2.95, -3.32, -3.28, '#4a4a48', f, T)  # door line
        BU.tube(T(sd * 1.22, 2.9, -4.75), T(sd * 1.55, 2.6, -4.85), 0.02, '#1a1a1a', n=3, caps=False)
        BU.box(sd * 1.58 - 0.03, sd * 1.58 + 0.03, 2.2, 2.62, -4.96, -4.74, '#1a1a1a', 'xXYzZ', T)   # mirror
        BL.box(sd * 1.0 - 0.17, sd * 1.0 + 0.17, 0.45, 0.57, -3.3, -2.9, '#3a3a3a', 'xXYzZ', T)       # step
        BL.box(sd * 0.9 - 0.2, sd * 0.9 + 0.2, 0.85, 1.35, -2.05, -1.35, '#3a3a3c', 'xXYzZ', T)       # battery / tool box
        BL.tube(T(sd * 1.05, 1.05, -1.4), T(sd * 1.05, 1.05, 2.0), 0.09, '#c8c8c4', n=6)            # hose tube
        BU.box(sd * 1.141 - 0.0005, sd * 1.141 + 0.0005, 2.5, 2.62, -2.05, 4.35, stripe, f, T)         # livery stripe
        for lz in (-1.8, 0.2, 2.2, 4.1): BU.tube(T(sd * 0.5, 3.35, lz), T(sd * 0.5, 3.75, lz), 0.015, '#d8d8d4', n=3, caps=False)
        BU.tube(T(sd * 0.5, 3.75, -1.8), T(sd * 0.5, 3.75, 4.1), 0.015, '#d8d8d4', n=3, caps=False)
        BL.box(sd * 0.9 - 0.15, sd * 0.9 + 0.15, 0.72, 0.84, 4.86, 4.89, '#a01a14', 'Z', T)            # tail lamps
    BL.tube(T(-0.85, 0.95, 1.2), T(-0.85, 0.95, 2.0), 0.24, '#b8b8b4', n=8)                      # fuel tank
    BU.tube(T(0, 2.25, -2.15), T(0, 2.25, -2.39), 1.15, tank_c, n=14, r1=0.85)                  # dished ends
    BU.tube(T(0, 2.25, 4.45), T(0, 2.25, 4.69), 1.15, tank_c, n=14, r1=0.85)
    for lz in (-1.0, 1.15, 3.3):
        BL.box(-0.8, 0.8, 0.95, 1.2, lz - 0.15, lz + 0.15, '#2a2a2c', 'xXYzZ', T)                 # saddles
        p = T(0, 3.33, lz); BU.prism(p[0], 3.33, p[2], 0.27, 0.16, '#b8bcc0', n=6)               # manholes
    for t in (-0.25, 0.25): BU.tube(T(t, 0.9, 4.78), T(t, 3.45, 4.7), 0.02, '#9a9a96', n=3, caps=False)
    for k in range(5): BU.tube(T(-0.25, 1.3 + k * 0.45, 4.76), T(0.25, 1.3 + k * 0.45, 4.76), 0.015, '#9a9a96', n=3, caps=False)
    BL.box(-1.15, 1.15, 0.45, 0.65, 4.74, 4.86, '#2a2a2c', 'xXYzZ', T)                          # rear bumper
    BL.box(-0.45, 0.45, 0.95, 1.3, 3.95, 4.45, '#4a4a4c', 'xXYzZ', T)                           # valve box
    BL.emit(); BU.emit()
    for sd in (-1, 1):
        p = T(sd * 1.166, 0, 1.15); quadv(p[0], 2.05, p[2], 3.2, 0.4, rot + sd * PI / 2, 'tf_signs', uvrect=atlas(0, 896, 512, 960))
    p = T(0.6, 0, 4.905); quadv(p[0], 1.1, p[2], 0.42, 0.42, rot, 'tf_signs', uvrect=atlas(896, 896, 1024, 1024))
    K.box(T(0, 0.02, 0.0), (2.6, 0.9, 9.8), 'plain', '#202020', rot=rot, kind='bake')
    K._collide(T(0, 0, -0.1), (2.55, 1, 10.2), rot, True, False)
tanker(-6.9, -4.6, 0.0, cab='#e8e6e0', stripe='#c0261c', tank_c='#d8dadc')
tanker(-1.5, -4.3, 0.0, cab='#2a5aa8', stripe='#e8c020', tank_c='#c8ccd0')
tanker(-15.0, 29.7, -PI / 2, cab='#d8d4c8', stripe='#2a7a3a', tank_c='#e0e0dc')      # queued on the road outside

# ================================================================== JETTY: finger pier + berth strip, loading arm, bollards
LMW[0] = 0.8
FX0, FX1 = -9.5, -5.5
cube(FX0, FX1, -0.3, 0.0, -30.0, -24.0, 'tf_quay', uv=0.25, faces='YxXz')
cube(FX1, 18.0, -0.3, 0.0, -25.4, -24.0, 'tf_quay', uv=0.25, faces='YzX')
cube(-14.8, -13.2, -0.01, 0.0, -24.0, -23.85, 'tf_quay', uv=0.25, faces='Y')
B = Batch()
for (x0, x1, z0, z1) in [(FX0, FX0 + 0.12, -30.0, -24.0), (FX1 - 0.12, FX1, -30.0, -25.4), (FX0, FX1, -30.0, -29.88), (FX1, 6.3, -25.4, -25.28), (7.7, 18.0, -25.4, -25.28)]:
    B.box(x0, x1, 0.0, 0.08, z0, z1, '#d8b428', 'xXzZY')
B.emit()
for (x, z) in [(FX0 + 0.3, -26.2), (FX0 + 0.3, -29.4), (FX1 - 0.3, -29.4), (-3.0, -25.0), (3.5, -25.0), (10.0, -25.0), (16.5, -25.0)]:
    bollard(x, z)
B = Batch()
for (x, z) in [(FX0, -24.5), (FX0, -27.0), (FX0, -29.7), (FX1, -27.0), (FX1, -29.7)] + [(x, -25.4) for x in (-4.5, 0.0, 4.5, 9.0, 13.5, 17.7)]:
    B.prism(x, -2.4, z, 0.22, 2.1, '#3a3836', n=6, top=False)
for x in (-3.8, -1.0, 2.0, 5.0, 8.4, 11.0, 14.0):
    B.box(x - 0.3, x + 0.3, -0.75, -0.05, -25.55, -25.4, '#141414', 'xXYzZ')
for z in (-26.5, -28.5): B.box(FX1, FX1 + 0.15, -0.75, -0.05, z - 0.3, z + 0.3, '#141414', 'XYzZ')
B.emit()
LAX, LAZ = 2.0, -24.55                                              # marine loading arm
bx(LAX - 0.45, LAX + 0.45, 0.0, 0.35, LAZ - 0.45, LAZ + 0.45, '#8a8680')
pipe((LAX, 0.0, LAZ), (LAX, 4.8, LAZ), 0.36, '#c8a828', sides=8)
K.cyl((LAX, 4.7, LAZ), 0.28, 0.35, 'plain', '#5a5c60', seg=8)
pipe((LAX, 5.0, LAZ), (LAX + 2.6, 6.2, LAZ - 2.2), 0.28, '#c8a828', sides=8)
pipe((LAX, 5.0, LAZ), (LAX - 1.0, 4.6, LAZ + 0.8), 0.2, '#c8a828', sides=6)
K.box((LAX - 1.2, 4.0, LAZ + 0.95), (0.6, 0.9, 0.5), 'plain', '#3a3a3c')
pipe((LAX + 2.6, 6.2, LAZ - 2.2), (LAX + 3.4, 1.0, LAZ - 3.0), 0.24, '#c8a828', sides=8)
K.sphere((LAX + 2.6, 6.2, LAZ - 2.2), 0.22, 'plain', '#5a5c60', seg=6)
pipe((LAX + 3.4, 1.0, LAZ - 3.0), (LAX + 3.4, 0.45, LAZ - 3.0), 0.22, '#2a2a2a')
K.obstacle(LAX, LAZ, 1.0, 1.0)
path_pipe([(LAX - 0.6, 0.25, -23.2), (LAX + 1.5, 0.2, -23.6), (LAX + 3.6, 0.2, -24.9), (LAX + 4.6, 0.35, -26.15)], 0.18, '#151515', sides=5)
def flood_pole(x, z, h=10.0, heads=((0.0, 0.0),), lit=False, kind='GlowsCool', col='#f0f4ff', watts=900, aim=None):
    beam((x, 0.0, z), (x, h, z), 0.24, 'plain', '#8a8c8e', t2=0.14, sides=6)
    B = Batch()
    B.box(x - 0.3, x + 0.3, 0.0, 0.3, z - 0.3, z + 0.3, '#8a8680', 'xXYzZ')
    B.box(x + 0.075, x + 0.325, 1.2, 1.6, z - 0.1, z + 0.1, '#9a9ca0')
    B.box(x - 0.9, x + 0.9, h - 0.1, h, z - 0.06, z + 0.06, '#7a7c7e', 'xXYyzZ')
    for (dx, yaw) in heads: B.cbox(x + dx, h - 0.45, z, 0.55, 0.38, 0.22, '#5a5c5e', rot=yaw)
    B.emit()
    for (dx, yaw) in heads:
        hx = x + dx
        c, s = math.sin(yaw), math.cos(yaw)
        lampbox((hx + c * 0.12, h - 0.42, z + s * 0.12), (0.45, 0.3, 0.02), col, lit, kind=kind, off='#b8bcc0', rot=yaw)
        if lit:
            tx, tz = aim if aim else (x + c * 10, z + s * 10)
            d = Vector((tx - hx, -h, tz - z)).normalized()
            K.area((hx + c * 0.3, h - 0.6, z + s * 0.3), (0.5, 0.35), '#eef2ff', watts, (d.x, d.y, d.z))
    K._collide((x, 0, z), (0.6, 1, 0.6), 0, True, False)
flood_pole(-1.2, -18.5, 11.0, heads=((-0.6, PI), (0.6, PI * 0.75)), lit=on('floods'), aim=(4.0, -27.0))
beam((-1.2, 11.0, -18.5), (-1.2, 12.6, -18.5), 0.05, 'plain', '#7a7c7e', sides=3)
K.cyl((-1.2, 12.3, -18.75), 0.16, 0.9, 'plain', '#e86a1a', seg=6, axis='z', r2=0.08)                  # windsock
B = Batch()
for (x, z) in [(-6.6, -24.3), (14.0, -24.3), (-9.0, -29.6)]:                                          # life buoys
    B.box(x - 0.03, x + 0.03, 0.0, 1.2, z - 0.03, z + 0.03, '#d8d8d4', 'xXzZY')
    B.tube((x, 1.25, z - 0.11), (x, 1.25, z - 0.01), 0.3, '#e8501a', n=10)
    K._collide((x, 0, z), (0.2, 1, 0.2), 0, True, False)
B.emit()
K.cyl((9.0, 0.0, -21.0), 0.12, 1.2, 'plain', '#c0261c', seg=8); pipe((9.0, 1.2, -21.0), (9.6, 1.45, -21.8), 0.12, '#c0261c')   # fire monitor
K._collide((9.0, 0, -21.0), (0.3, 1, 0.3), 0, True, False)
cube(20.0, 23.0, 0.0, 2.6, -21.5, -18.5, 'tf_gatehse', uv=0.5, faces='xXzZ', collide=True, block=True)   # jetty control hut
cube(19.8, 23.2, 2.6, 2.75, -21.7, -18.3, 'concrete', uv=1.0, faces='xXzZYy')
quadv(19.99, 0.0, -20.6, 0.9, 2.0, -PI / 2, 'plain', '#3a4a5a')
lampquad(19.99, 1.1, -19.3, 0.9, 0.8, -PI / 2, '#ffe0a8', on('jettyhut'), off='#20262c')
sign(19.992, 2.15, -20.0, 1.0, 0.5, -PI / 2, (256, 768, 512, 896))
lampbox((19.9, 2.4, -20.6), (0.12, 0.12, 0.2), '#fff0d0', on('jettyhut'))
if on('jettyhut'): K.point((19.5, 2.3, -20.6), '#ffe0b0', 45, 0.15)
K.cyl((25.0, 0.9, -20.5), 0.9, 1.5, 'plain', '#3a3a3c', seg=10, axis='x'); K.cyl((25.0, 0.9, -20.5), 0.95, 1.2, 'plain', '#e8c020', seg=10, axis='x')   # oil boom reel
for dx in (-0.8, 0.8): bx(25.0 + dx - 0.06, 25.0 + dx + 0.06, 0.0, 1.0, -20.9, -20.1, '#5a5c5e')
K.obstacle(25.0, -20.5, 2.0, 2.0)
cube(-8.5, -6.3, 0.0, 1.2, -19.0, -17.6, 'plain', '#2a6a3a', faces='xXYzZ', collide=True)                   # skip
K.box((12.5, 0.0, -18.5), (0.8, 0.9, 0.6), 'plain', '#e8c020'); K._collide((12.5, 0, -18.5), (0.9, 1, 0.7), 0, True, False)   # spill kit
LMW[0] = 1.0

# ================================================================== THE BARGE TEKENA 2 (x -4..16, z -31.4..-25.6), deck at y 0
LMW[0] = 0.8
BX0, BX1, BZ0, BZ1 = -4.0, 16.0, -31.4, -25.6
BDK, BBT = 0.0, -1.6
hull = [(BX0 + 0.8, BDK, BZ0), (BX1, BDK, BZ0), (BX1, BDK, BZ1), (BX0 + 0.8, BDK, BZ1),
        (BX0 + 1.8, BBT, BZ0 + 0.3), (BX1 - 0.3, BBT, BZ0 + 0.3), (BX1 - 0.3, BBT, BZ1 - 0.3), (BX0 + 1.8, BBT, BZ1 - 0.3),
        (BX0, BDK + 0.1, BZ0 + 0.6), (BX0, BDK + 0.1, BZ1 - 0.6)]
poly(hull, [(0, 1, 5, 4), (2, 3, 7, 6), (1, 2, 6, 5), (3, 9, 7), (9, 8, 4, 7), (8, 0, 4)], 'tf_rust', uv=0.5)
poly([hull[0], hull[1], hull[2], hull[3], hull[9], hull[8]], [(0, 5, 4, 3, 2, 1)], 'tf_deck', uv=0.5)
K.blocker((BX0 + BX1) / 2, -0.8, (BZ0 + BZ1) / 2, BX1 - BX0, 1.6, BZ1 - BZ0)
for (x0, x1, z0, z1) in [(BX0 + 0.8, 6.3, BZ1 - 0.1, BZ1), (7.7, BX1, BZ1 - 0.1, BZ1), (BX0 + 0.8, BX1, BZ0, BZ0 + 0.1), (BX1 - 0.1, BX1, BZ0, BZ1)]:
    cube(x0, x1, BDK, BDK + 0.32, z0, z1, 'tf_rust', uv=0.5, faces='xXYzZ')
for (a, b) in [((BX0 + 0.8, BZ0), (BX0, BZ0 + 0.6)), ((BX0, BZ0 + 0.6), (BX0, BZ1 - 0.6)), ((BX0, BZ1 - 0.6), (BX0 + 0.8, BZ1))]:
    beam((a[0], 0.16, a[1]), (b[0], 0.16, b[1]), 0.32, 'plain', '#5a3020', sides=4)
K.obstacle((BX0 + 0.8 + 6.3) / 2, BZ1 - 0.05, 6.3 - BX0 - 0.8, 0.25); K.obstacle((7.7 + BX1) / 2, BZ1 - 0.05, BX1 - 7.7, 0.25)
K.obstacle(BX0 + 0.3, (BZ0 + BZ1) / 2, 0.7, BZ1 - BZ0); K.obstacle(BX1 - 0.05, (BZ0 + BZ1) / 2, 0.25, BZ1 - BZ0)
for x in range(-2, 16, 3): tyre(x + 0.5, -0.4, BZ1 + 0.13)
beam((BX0 + 0.8, -0.12, BZ1 + 0.03), (BX1, -0.12, BZ1 + 0.03), 0.12, 'plain', '#3a2418', sides=4)
K.cyl((0.7, BDK + 1.65, -28.5), 1.3, 7.0, 'tf_rust', seg=14, axis='x', uv=0.5)                 # deck tank on saddles
for x in (-2.8, 4.2): K.cyl((x, BDK + 1.65, -28.5), 1.3, 0.1, 'plain', '#5a3020', seg=14, axis='x')
for x in (-1.8, 0.7, 3.2): bx(x - 0.18, x + 0.18, BDK, BDK + 0.55, -29.6, -27.4, '#3a2418')
for x in (-0.6, 2.4): K.cyl((x, BDK + 2.9, -28.5), 0.32, 0.2, 'plain', '#4a2a1c', seg=8)
for k in range(7): beam((4.25, BDK + 0.25 + k * 0.38, -27.95), (4.25, BDK + 0.25 + k * 0.38, -27.45), 0.035, 'plain', '#6a4a3a', sides=3)
for zz in (-27.95, -27.45): beam((4.25, BDK, zz), (4.3, BDK + 2.9, zz), 0.05, 'plain', '#6a4a3a', sides=3)
K.obstacle(0.7, -28.5, 7.2, 2.7)
for x in (6.6, 7.4):                                                                              # cargo manifold
    path_pipe([(x, BDK + 0.25, -29.6), (x, BDK + 0.25, -26.4), (x, BDK + 0.5, -26.2)], 0.2, '#5a3a28')
    valve(x, BDK + 0.25, -27.0, d=0.24, axis='z', color='#2a2a2a', wheel='#a8281a')
for (x, z) in [(9.0, -28.5), (10.8, -29.9)]: K.cyl((x, BDK, z), 0.38, 0.12, 'plain', '#4a2a1c', seg=10)
for (x, z) in [(-2.6, -26.2), (-2.6, -30.8), (11.5, -26.2), (11.5, -30.8), (15.4, -26.2), (15.4, -30.8)]:
    K.cyl((x - 0.18, BDK, z), 0.11, 0.38, 'plain', '#2a1a14', seg=6); K.cyl((x + 0.18, BDK, z), 0.11, 0.38, 'plain', '#2a1a14', seg=6)
    K._collide((x, 0, z), (0.6, 1, 0.3), 0, True, False)
for (a, b) in [((-2.6, 0.3, -26.2), (-3.0, 0.45, -25.0)), ((15.4, 0.3, -26.2), (16.5, 0.45, -25.0)), ((11.5, 0.3, -26.2), (10.0, 0.45, -25.0))]:
    path_pipe(catenary(a, b, 0.12, 3), 0.035, '#b8a882', sides=3)
cube(6.45, 7.55, 0.0, 0.06, -26.0, -25.25, 'tf_grating', uv=2.0, faces='Yy')                         # gangway
for xg in (6.45, 7.55): rail_run([(xg, 0.06, -25.25), (xg, 0.06, -26.0)], h=1.0, post_every=0.7, color='#c8c8c4')
# the aft deckhouse ("cash room", x 12.4..15.6, z -30.4..-26.6), door in the west face at z -28.5
DHX0, DHX1, DHZ0, DHZ1, DHH = 12.4, 15.6, -30.4, -26.6, 2.3
owall('z', DHX0, DHX0 + 0.1, DHZ0, DHZ1, [(-29.0, -28.0, 0.0, 2.0)], y1=DHH, mat='tf_rust', mat_in='plain', out='x', block=False)
cube(DHX1 - 0.1, DHX1, BDK, DHH, DHZ0, DHZ1, 'tf_rust', uv=0.5, faces='xX')
cube(DHX0 + 0.1, DHX1 - 0.1, BDK, DHH, DHZ1 - 0.1, DHZ1, 'tf_rust', uv=0.5, faces='zZ'); cube(DHX0 + 0.1, DHX1 - 0.1, BDK, DHH, DHZ0, DHZ0 + 0.1, 'tf_rust', uv=0.5, faces='zZ')
cube(DHX0 - 0.1, DHX1 + 0.1, DHH, DHH + 0.1, DHZ0 - 0.1, DHZ1 + 0.1, 'plain', '#3a2418', faces='xXzZYy')
K._collide(((DHX0 + DHX1) / 2, 0, (DHZ0 + DHZ1) / 2), (DHX1 - DHX0, 1, DHZ1 - DHZ0), 0, True, True)
LMW[0] = 1.2
cube(DHX0 + 0.1, DHX1 - 0.1, BDK, BDK + 0.01, DHZ0 + 0.1, DHZ1 - 0.1, 'plain', '#2a1e18', faces='Y')
cube(DHX0 + 0.1, DHX1 - 0.1, DHH - 0.03, DHH - 0.02, DHZ0 + 0.1, DHZ1 - 0.1, 'plain', '#3a2a22', faces='y')
bx(13.6, 15.2, 0.75, 0.8, -29.9, -29.1, '#5a4030'); bx(13.65, 15.15, 0.0, 0.75, -29.85, -29.15, '#4a3428', faces='xXzZ')
for k, col in enumerate(['#2a3a2a', '#3a3a3a', '#5a4a2a', '#2a3a2a']): K.box((14.0 + k * 0.35, 0.8, -29.5), (0.3, 0.18, 0.4), 'plain', col)
for k in range(3): K.cyl((15.1, 0.0, -27.2 - k * 0.5), 0.24, 0.6, 'plain', '#c8b48a', seg=6, r2=0.17)
lampbox((14.0, DHH - 0.1, -28.5), (0.12, 0.06, 0.12), '#ffd9a0', on('barge'))
if on('barge'): K.point((14.0, DHH - 0.3, -28.5), '#ffc888', 30, 0.1)
LMW[0] = 0.8
cube(DHX0 - 0.06, DHX0 - 0.01, 0.02, 1.98, -28.98, -28.02, 'tf_doorrust', kind='CashDoor', uv=None)       # door leaf (dynamic)
cube(DHX0 - 0.1, DHX0 - 0.06, 1.0, 1.06, -28.25, -28.12, 'tf_gatedark', kind='CashDoor', uv=None)
K.box((DHX0 - 0.035, 0.02, -28.5), (0.05, 1.96, 0.96), 'plain', '#202020', kind='bake')
K.obstacle(DHX0 - 0.03, -28.5, 0.1, 1.0)
lampquad(14.6, 1.0, DHZ1 + 0.005, 0.6, 0.5, 0.0, '#ffd9a0', on('barge'), off='#14181c')
WH0, WH1, WZ0, WZ1, WY0, WY1 = 13.0, 15.4, -29.9, -27.1, DHH + 0.1, DHH + 2.0                         # wheelhouse
cube(WH0, WH1, WY0, WY0 + 0.9, WZ0, WZ1, 'tf_rust', uv=0.5, faces='xXzZ')
for (x0, x1, z0, z1) in [(WH0, WH0 + 0.12, WZ0, WZ0 + 0.12), (WH1 - 0.12, WH1, WZ0, WZ0 + 0.12), (WH0, WH0 + 0.12, WZ1 - 0.12, WZ1), (WH1 - 0.12, WH1, WZ1 - 0.12, WZ1)]:
    cube(x0, x1, WY0 + 0.9, WY1, z0, z1, 'plain', '#5a3020', faces='xXzZ')
cube(WH0 - 0.15, WH1 + 0.15, WY1, WY1 + 0.12, WZ0 - 0.15, WZ1 + 0.15, 'plain', '#3a2418', faces='xXzZYy')
for (x, z, rot, w) in [(WH0 - 0.005, (WZ0 + WZ1) / 2, -PI / 2, WZ1 - WZ0 - 0.24), (WH1 + 0.005, (WZ0 + WZ1) / 2, PI / 2, WZ1 - WZ0 - 0.24),
                       ((WH0 + WH1) / 2, WZ1 + 0.005, 0.0, WH1 - WH0 - 0.24), ((WH0 + WH1) / 2, WZ0 - 0.005, PI, WH1 - WH0 - 0.24)]:
    lampquad(x, WY0 + 0.95, z, w, 0.9, rot, '#ffcf8a', on('barge') and rot == 0.0, off='#1a2228')
beam((14.8, WY1 + 0.12, -28.5), (14.8, WY1 + 3.0, -28.5), 0.08, 'plain', '#d8d8d4', sides=4)
lampbox((14.8, WY1 + 2.95, -28.5), (0.14, 0.14, 0.14), '#ffffff', on('barge'), kind='GlowsCool')
K.box((14.6, WY1 + 1.7, -28.5), (0.5, 0.06, 0.06), 'plain', '#d8d8d4')
lampbox((14.35, WY1 + 1.66, -28.5), (0.1, 0.1, 0.1), '#ff3a2a', on('barge'), kind='GlowsRed', off='#5a1a14')
sign(WH0 - 0.008, WY0 + 0.25, (WZ0 + WZ1) / 2, 1.6, 0.4, -PI / 2, (512, 128, 1024, 256))
for (x, z) in [(DHX0 - 0.05, DHZ1 + 0.05), (DHX0 - 0.05, DHZ0 - 0.05)]:                               # deck lights on the deckhouse corners
    K.box((x - 0.12, DHH - 0.25, z), (0.16, 0.14, 0.16), 'plain', '#2a2a2a')
    lampbox((x - 0.2, DHH - 0.3, z), (0.08, 0.1, 0.1), '#ffd9a0', on('barge'), off='#8a8a80')
    if on('barge'): K.point((x - 0.4, DHH - 0.3, z), '#ffc880', 70, 0.1)
K.box((WH0 - 0.1, WY1 - 0.1, -28.5), (0.25, 0.22, 0.3), 'plain', '#2a2a2a')                               # work light aimed at the deck
lampbox((WH0 - 0.235, WY1 - 0.09, -28.5), (0.02, 0.18, 0.24), '#fff2d8', on('barge'), kind='GlowsCool', off='#8a8a80')
if on('barge'): K.area((WH0 - 0.4, WY1 - 0.2, -28.5), (0.3, 0.3), '#fff0d8', 450, (-0.85, -0.5, 0.0))
quadv(-0.5, -0.5, BZ1 + 0.005, 3.2, 0.4, 0.0, 'tf_signs', uvrect=atlas(512, 160, 1024, 224))           # hull name (jetty side)
quadv(BX1 + 0.005, -0.5, -28.5, 3.2, 0.4, PI / 2, 'tf_signs', uvrect=atlas(512, 160, 1024, 224))       # and the stern
LMW[0] = 1.0

# ================================================================== BOAT DRIVERS' UNION SHED (x -23.6..-16.6, z -23.4..-18.4) + landing
LMW[0] = 1.5
UX0, UX1, UZ0, UZ1 = -23.6, -16.6, -23.4, -18.4
def uroof_y(x): return 2.45 + (x - (UX0 - 0.3)) / ((UX1 + 0.4) - (UX0 - 0.3)) * 0.75
cube(UX0, UX1, 0.0, 0.03, UZ0, UZ1, 'concrete', uv=1.0, faces='xXYzZ')
for (x, z) in [(UX0 + 0.1, UZ0 + 0.1), (UX0 + 0.1, UZ1 - 0.1), (UX1 - 0.1, UZ0 + 0.1), (UX1 - 0.1, UZ1 - 0.1), (UX1 - 0.1, -20.9), ((UX0 + UX1) / 2, UZ0 + 0.1), ((UX0 + UX1) / 2, UZ1 - 0.1)]:
    beam((x, 0.03, z), (x, uroof_y(x), z), 0.1, 'plain', '#5a4a3a', sides=4)
    K._collide((x, 0, z), (0.15, 1, 0.15), 0, True, False)
sheet((UX0 - 0.3, uroof_y(UX0 - 0.3), UZ1 + 0.3), (UX1 + 0.4, uroof_y(UX1 + 0.4), UZ1 + 0.3), (UX1 + 0.4, uroof_y(UX1 + 0.4), UZ0 - 0.3), (UX0 - 0.3, uroof_y(UX0 - 0.3), UZ0 - 0.3), 'corrugated_rust', uv=1.0, nu=2, nv=2, sag=0.04)
cube(UX0, UX0 + 0.04, 0.03, 2.47, UZ0, UZ1, 'corrugated_rust', uv=1.0, faces='xX')                          # back wall (west)
cube(UX0 + 0.04, -20.0, 0.03, 1.2, UZ1 - 0.04, UZ1, 'corrugated_rust', uv=1.0, faces='zZY')                   # half wall (south)
K.obstacle(UX0 + 0.02, (UZ0 + UZ1) / 2, 0.2, UZ1 - UZ0); K.obstacle((UX0 - 20.0) / 2, UZ1 - 0.02, -20.0 - UX0, 0.2)
ptable(-21.3, -21.0, 0.0, '#e8e6e0', w=1.2, d=0.8, h=0.74)                                                    # the chairman's table
K.box((-21.5, 0.74, -21.05), (0.36, 0.03, 0.26), 'plain', '#2a4a8a'); K.box((-21.0, 0.74, -21.2), (0.26, 0.12, 0.18), 'plain', '#5a5c60')
K.box((-21.0, 0.74, -20.75), (0.24, 0.14, 0.08), 'plain', '#1a1a1a'); K.cyl((-21.7, 0.74, -20.8), 0.05, 0.22, 'plain', '#c82a2a', seg=6)
for k in range(3): K.cyl((-21.85 + k * 0.1, 0.74, -21.25), 0.035, 0.08, 'plain', '#e8e8e0', seg=6)
chair(-22.1, -21.0, PI / 2, '#3a6ab8'); chair(-21.3, -21.75, 0.0, '#c8302a'); chair(-21.3, -20.2, PI, '#d8d4cc')
for k, col in enumerate(['#d8d4cc', '#3a6ab8', '#c8302a']): chair(-19.2 + k * 0.7, -18.95, PI, col)
cube(UX0 + 0.05, UX0 + 0.45, 0.42, 0.47, UZ0 + 0.4, UZ1 - 0.4, 'planks', uv=1.0, faces='xXYzZ')
for z in (UZ0 + 0.6, (UZ0 + UZ1) / 2, UZ1 - 0.6): bx(UX0 + 0.2, UX0 + 0.3, 0.03, 0.42, z - 0.05, z + 0.05, '#3a2a1c')
board(UX0 + 0.06, 1.15, -20.9, 1.6, 1.15, PI / 2, (0, 0, 256, 256))                                          # union notice board
bx(UX0 + 0.04, UX0 + 0.08, 1.1, 2.35, -21.75, -20.05, '#5a3a24', faces='X')
LJ = [(-22.6 + (k % 3) * 0.42, 0.03 + (k // 3) * 0.16, -19.0 + RG.uniform(-0.1, 0.1), RG.choice(['#e8601a', '#f07020', '#d85010']), RG.uniform(-0.3, 0.3)) for k in range(9)]
B = Batch()
for (x, y, z, col, r_) in LJ: B.cbox(x, y, z, 0.4, 0.16, 0.5, col, rot=r_)                                     # life jackets
B.tube((UX0 + 0.3, 2.2, UZ1 - 0.15), (-17.2, 2.6, UZ1 - 0.15), 0.02, '#3a3a3a', n=3, caps=False)
for k in range(6):
    x = -22.8 + k * 0.85; y = 2.2 + (x - UX0 - 0.3) / (-17.2 - UX0 - 0.3) * 0.4
    B.cbox(x, y - 0.62, UZ1 - 0.15, 0.42, 0.6, 0.1, ['#e8601a', '#f07020'][k % 2])
B.emit()
K.obstacle(-22.2, -19.1, 1.6, 0.8)
for (x, z, col) in [(-23.1, -22.9, '#e0c020'), (-22.75, -22.95, '#2a8a3a'), (-23.1, -22.55, '#e0c020'), (-22.4, -22.9, '#c83a2a')]:
    jerrycan(x, z, 0.2, col, y=0.03)
bx(-20.2, -19.4, 0.03, 0.62, -23.15, -22.75, '#4a3a2a')                                                       # outboard on its stand
K.box((-19.8, 0.62, -22.95), (0.45, 0.6, 0.38), 'plain', '#1a1a1c'); K.box((-19.8, 0.25, -22.6), (0.14, 0.75, 0.16), 'plain', '#2a2a2a')
K.obstacle(-19.8, -22.95, 0.9, 0.5)
for z in (-22.6, -21.4): beam((-16.2, 0.0, z), (-16.2, 2.3, z), 0.08, 'plain', '#4a3a2a', sides=4)
board(-16.16, 1.15, -22.0, 1.3, 1.1, PI / 2, (256, 0, 512, 256), back='#4a3a2a')                              # fares board
K._collide((-16.2, 0, -22.0), (0.2, 1, 1.4), 0, True, False)
lampbox((-20.0, 2.55, -21.0), (0.09, 0.12, 0.09), '#ffd9a0', on('union'), off='#d8d4c8')
beam((-20.0, 2.67, -21.0), (-20.0, uroof_y(-20.0), -21.0), 0.02, 'plain', '#1a1a1a', sides=3)
if on('union'): K.point((-20.0, 2.4, -21.0), '#ffc888', 60, 0.08)
for k in range(5):                                                                                            # landing steps
    y = -0.15 - k * 0.15; z = -24.0 - k * 0.3
    cube(-14.8, -13.2, y - 0.15, y, z - 0.3, z, 'tf_quay', uv=0.5, faces='YzxX')
cube(-14.8, -13.2, -1.6, -0.75, -25.8, -25.5, 'tf_quay', uv=0.5, faces='zxX')
for x in range(-27, -15, 2): tyre(x + 0.5, -0.45, -24.38)
LMW[0] = 1.0

def pboat(cx, cz, L=8.0, B=1.9, rot=0.0, y=-0.6, canopy='#2a5aa8', hull='#e8e8e2', stripe='#1a4aa0', jackets=2, can=True):
    """fibreglass passenger boat; bow at local +z, transom + outboard at local -z"""
    c, s = math.cos(rot), math.sin(rot)
    def P(lx, ly, lz): return (cx + lx * c + lz * s, y + ly, cz - lx * s + lz * c)
    st = [(1.0, 0.0, 0.62), (0.75, 0.55, 0.56), (0.35, 0.92, 0.52), (-0.1, 1.0, 0.5), (-0.6, 0.98, 0.5), (-1.0, 0.92, 0.52)]
    sec = [[(-B / 2 * wf, top, t * L / 2), (-B / 2 * wf * 0.9, 0.05, t * L / 2), (0, -0.3, t * L / 2), (B / 2 * wf * 0.9, 0.05, t * L / 2), (B / 2 * wf, top, t * L / 2)] for (t, wf, top) in st]
    n = len(sec)
    poly([P(*p) for sc_ in sec for p in sc_], [(i * 5 + k, i * 5 + k + 5, i * 5 + k + 6, i * 5 + k + 1) for i in range(n - 1) for k in range(4)], 'plain', hull)
    poly([P(px * 0.9, py * 0.88 + 0.08, pz * 0.97) for sc_ in sec for (px, py, pz) in sc_], [(i * 5 + k, i * 5 + k + 1, i * 5 + k + 6, i * 5 + k + 5) for i in range(n - 1) for k in range(4)], 'plain', '#cfd2d2')
    poly([P(-B / 2 * 0.92, 0.52, -L / 2), P(B / 2 * 0.92, 0.52, -L / 2), P(B / 2 * 0.83, 0.05, -L / 2), P(0, -0.3, -L / 2), P(-B / 2 * 0.83, 0.05, -L / 2)], [(0, 1, 2, 3, 4)], 'plain', '#d8d8d2')
    for sd in (-1, 1):
        a = [P(sd * B / 2 * wf * 1.01, top - 0.16, t * L / 2) for (t, wf, top) in st]
        for p0, p1 in zip(a, a[1:]): beam(p0, p1, 0.08, 'plain', stripe, sides=3)
    for k in range(4):
        lz = 0.28 * L - k * 0.2 * L
        beam(P(-B / 2 * 0.85, 0.36, lz), P(B / 2 * 0.85, 0.36, lz), 0.18, 'plain', '#2a4a8a', sides=4)
    if canopy:
        for (lx, lz) in [(-B / 2 * 0.8, 0.32 * L), (B / 2 * 0.8, 0.32 * L), (-B / 2 * 0.8, -0.25 * L), (B / 2 * 0.8, -0.25 * L)]:
            beam(P(lx, 0.4, lz), P(lx, 1.55, lz), 0.04, 'plain', '#c8c8c8', sides=3)
        sheet(P(-B / 2 * 0.85, 1.55, -0.27 * L), P(B / 2 * 0.85, 1.55, -0.27 * L), P(B / 2 * 0.85, 1.55, 0.34 * L), P(-B / 2 * 0.85, 1.55, 0.34 * L), 'plain', canopy, nu=1, nv=2, sag=-0.06)
    for k in range(jackets):
        K.box(P(-0.3 + k * 0.5, 0.42, 0.1 * L - k * 0.15 * L), (0.38, 0.12, 0.45), 'plain', '#e8601a', rot=rot + 0.3 * (k - 0.5))
    ex = P(0, 0.3, -L / 2 - 0.2)
    K.box(ex, (0.42, 0.6, 0.48), 'plain', '#1a1a1c', rot=rot); K.box((ex[0], ex[1] - 0.7, ex[2]), (0.14, 0.7, 0.16), 'plain', '#2a2a2a', rot=rot)
    if can: K.box(P(0.35, 0.3, -0.38 * L), (0.32, 0.38, 0.18), 'plain', '#e0c020', rot=rot)
pboat(-22.0, -25.25, rot=PI / 2 + 0.02, jackets=3)
pboat(-14.6, -26.35, L=7.4, rot=PI / 2 - 0.05, canopy='#c8302a', stripe='#c8302a', jackets=1, can=False)
pboat(-21.5, -27.6, L=7.0, rot=PI / 2 + 0.06, canopy=None, stripe='#2a8a3a', jackets=2)
for (a, b) in [((-25.5, 0.1, -24.05), (-25.9, -0.15, -25.2)), ((-18.4, 0.1, -24.05), (-18.0, -0.15, -25.2)), ((-13.0, 0.1, -24.1), (-11.3, -0.15, -26.2)), ((-15.2, 0.0, -25.5), (-17.4, -0.15, -26.4))]:
    path_pipe(catenary(a, b, 0.15, 3), 0.03, '#c8b88a', sides=3)

# ================================================================== STILT SETTLEMENT beyond the west wall
LMW[0] = 0.32
def shack(x0, x1, z0, z1, fy=1.0, h=2.4, wash=False, tank_=False, lit=False, washc=()):
    B = Batch()
    for (x, z) in [(x0, z0), (x1, z0), (x0, z1), (x1, z1)]:
        B.prism(x, -1.6, z, 0.08, fy + 1.5, '#3a2e22', n=4, top=False)
    B.box(x0 - 0.2, x1 + 0.2, fy - 0.1, fy, z0 - 0.2, z1 + 0.2, '#6a5038', 'xXYzZy')
    ridge = fy + h + 0.7; zm = (z0 + z1) / 2
    sheet((x0 - 0.35, fy + h, z0 - 0.3), (x1 + 0.35, fy + h, z0 - 0.3), (x1 + 0.35, ridge, zm), (x0 - 0.35, ridge, zm), 'corrugated_rust', uv=1.0, both=False)
    sheet((x0 - 0.35, ridge, zm), (x1 + 0.35, ridge, zm), (x1 + 0.35, fy + h, z1 + 0.3), (x0 - 0.35, fy + h, z1 + 0.3), 'corrugated_rust', uv=1.0, both=False)
    B.box(x1, x1 + 0.01, fy, fy + 1.9, zm - 0.9, zm - 0.1, '#2a2018', 'X')
    if not lit: B.box(x1, x1 + 0.01, fy + 1.0, fy + 1.55, zm + 0.4, zm + 1.0, '#14100c', 'X')
    if wash:
        B.tube((x1 + 0.3, fy + 1.9, z0), (x1 + 0.3, fy + 1.9, z1), 0.006, '#2a2a2a', n=3, caps=False)
        for k, col in enumerate(washc): B.box(x1 + 0.29, x1 + 0.31, fy + 1.2, fy + 1.85, z0 + 0.12 + k * 0.5, z0 + 0.48 + k * 0.5, col, 'xX')
    if tank_: B.prism(x0 + 0.6, fy + h + 0.75, z0 + 0.6, 0.4, 0.7, '#1a1c1e', n=8)
    B.emit()
    cube(x0, x1, fy, fy + h, z0, z1, 'tf_shack', uv=1.0, faces='xXzZ')
    for (zz, f) in [(z0, -1), (z1, 1)]:
        poly([(x0, fy + h, zz), (x1, fy + h, zz), ((x0 + x1) / 2, ridge, zz)], [(0, 1, 2) if f > 0 else (0, 2, 1)], 'tf_shack', uv=1.0)
    if lit: gquad(x1 + 0.012, fy + 1.0, zm + 0.7, 0.6, 0.55, PI / 2, '#ffcf80')
SH = [(-33.5, -30.0, -14.0, -10.5, 1.1), (-38.5, -34.5, -20.5, -16.5, 1.0), (-36.0, -32.0, -4.5, -0.5, 1.2), (-42.5, -38.5, -9.0, -5.0, 1.0),
      (-34.0, -30.5, 5.5, 9.0, 1.3), (-40.0, -36.5, 12.0, 15.5, 1.1), (-44.0, -40.0, -22.5, -18.5, 0.9), (-31.8, -29.0, 16.0, 19.0, 1.3)]
for i, (a, b, c, d, fy) in enumerate(SH):
    washc = [RG.choice(['#d84a3a', '#3a6ab8', '#e8e0d0', '#2a8a4a', '#e8c040']) for _ in range(int((d - c) / 0.5))]
    shack(a, b, c, d, fy=fy, wash=(i % 3 != 1), tank_=(i % 2 == 0), lit=on('settle') and i in (0, 2, 4, 6), washc=washc)
for (p0, p1) in [((-30.0, 1.15, -12.0), (-32.0, 1.15, -2.5)), ((-34.5, 1.05, -18.0), (-33.0, 1.1, -14.0)), ((-32.0, 1.2, -1.0), (-31.5, 1.3, 5.5)), ((-38.5, 1.0, -7.0), (-36.0, 1.15, -2.5))]:
    d = Vector((p1[0] - p0[0], p1[2] - p0[2])); L = d.length; d.normalize(); nn = Vector((-d.y, d.x)) * 0.35
    poly([(p0[0] - nn.x, p0[1], p0[2] - nn.y), (p0[0] + nn.x, p0[1], p0[2] + nn.y), (p1[0] + nn.x, p1[1], p1[2] + nn.y), (p1[0] - nn.x, p1[1], p1[2] - nn.y)], [(0, 1, 2, 3)], 'planks', uv=1.0)
    m = max(1, int(L / 2)); B = Batch()
    for k in range(m + 1):
        q = (p0[0] + (p1[0] - p0[0]) * k / m, p0[2] + (p1[2] - p0[2]) * k / m)
        B.prism(q[0], -1.5, q[1], 0.05, p0[1] + 1.5, '#3a2e22', n=4, top=False)
    B.emit()
B = Batch()
for (x, z, r_) in [(-33.0, -23.0, 0.3), (-37.0, -11.0, 1.4), (-31.0, 2.0, 0.1)]:
    c, s = math.sin(r_), math.cos(r_)
    B.tube((x - c * 1.8, -0.62, z - s * 1.8), (x + c * 1.8, -0.62, z + s * 1.8), 0.42, '#3a2c1e', n=6)        # canoes
B.emit()
palm(-30.5, 0.5, h=9.0, lean=(-0.6, 0.3), seed=71, y0=-0.4)
palm(-36.0, 10.5, h=10.5, lean=(0.4, -0.5), seed=72, y0=-0.8)
palm(-41.0, -14.0, h=8.5, lean=(-0.3, 0.6), seed=73, y0=-0.8)
tree(-31.0, 22.0, h=7.0, r=3.2, seed=74, color='#2a3e20', blobs=6)
for k in range(9):                                                                                           # mangrove scrub
    x = -46.0 - RG.random() * 8; z = -24.0 + RG.random() * 50
    ob = K.sphere((x, 0.3, z), 1.8 + RG.random() * 1.6, 'plain', RG.choice(['#26381e', '#2e4224', '#223420']), seg=5, sy=0.55); ob['lm'] = 'top'
LMW[0] = 1.0

# ================================================================== OTHER YARD STRUCTURES
LMW[0] = 0.6
K.cyl((22.0, 0.0, 20.6), 2.6, 5.5, 'tf_firetank', seg=20, caps=False, uv=0.5)                                 # fire water tank
poly([(22.0, 6.0, 20.6)] + [(22.0 + math.cos(2 * PI * i / 20) * 2.65, 5.5, 20.6 + math.sin(2 * PI * i / 20) * 2.65) for i in range(20)], [(0, 1 + (i + 1) % 20, 1 + i) for i in range(20)], 'plain', '#c8c4bc')
for k in range(12): beam((24.65, 0.3 + k * 0.45, 20.4), (24.65, 0.3 + k * 0.45, 20.8), 0.03, 'plain', '#5a5c5a', sides=3)
circle_obstacle(22.0, 20.6, 2.7)
cube(13.5, 17.5, 0.0, 2.9, 19.5, 22.6, 'tf_gatehse', uv=0.5, faces='xXzZ', collide=True, block=True)          # fire pump house
cube(13.3, 17.7, 2.9, 3.05, 19.3, 22.8, 'concrete', uv=1.0, faces='xXzZYy')
quadv(15.5, 0.0, 19.49, 2.2, 2.4, PI, 'shutter')
sign(15.5, 2.5, 19.492, 1.0, 0.5, PI, (0, 768, 256, 896))
path_pipe([(17.5, 0.6, 21.0), (19.4, 0.6, 21.0)], 0.25, '#c0261c')
K.cyl((9.0, 1.0, 21.0), 1.0, 3.5, 'plain', '#d8d4c8', seg=12, axis='x')                                        # foam concentrate tank
for x in (7.6, 10.4): bx(x - 0.15, x + 0.15, 0.0, 0.6, 20.3, 21.7, '#8a8680')
K.obstacle(9.0, 21.0, 3.6, 2.1)
for (x, z) in [(-1.6, 18.0), (-10.6, -1.2), (-6.2, -15.6), (12.0, -17.0), (-0.3, 4.6)]:
    hydrant(x, z)
for (x, z, rot) in [(-12.4, 13.2, 0.0), (0.3, -13.0, -PI / 2)]:
    K.box((x, 0.6, z), (0.6, 0.8, 0.25), 'plain', '#c0261c', rot=rot)
K.box((-24.2, 0.0, 19.0), (1.3, 1.8, 3.6), 'plain', '#d8c430'); K.box((-24.2, 1.8, 19.0), (1.35, 0.08, 3.65), 'plain', '#8a8a86')   # generator set
for k in range(5): quadv(-24.86, 0.5 + k * 0.22, 18.4, 1.2, 0.08, -PI / 2, 'plain', '#3a3a30')
pipe((-24.2, 1.88, 20.3), (-24.2, 3.2, 20.3), 0.14, '#3a3a3a')
K.cyl((-24.2, 0.0, 22.2), 0.6, 1.2, 'plain', '#6a6a66', seg=10)
K._collide((-24.2, 0, 19.0), (1.4, 1, 3.7), 0, True, False); K._collide((-24.2, 0, 22.2), (1.3, 1, 1.3), 0, True, False)
cube(-10.9, -9.1, 0.0, 0.3, 12.6, 13.4, 'concrete', uv=1.0, faces='xXYzZ', collide=True)                       # flagpoles
for (x, cols) in [(-10.5, ['#1f8a3e', '#f0f0ea', '#1f8a3e']), (-9.5, ['#2a4a8a', '#2a4a8a', '#e8c020'])]:
    beam((x, 0.3, 13.0), (x, 7.5, 13.0), 0.07, 'plain', '#d8d8d4', sides=5)
    K.sphere((x, 7.55, 13.0), 0.07, 'plain', '#c8a040', seg=5)
    fl = lambda t, yy, x=x: (x + 1.6 * t, yy - 0.12 * t, 13.0 + 0.16 * math.sin(t * 5.0))
    for k in range(3):
        sheet(fl(k / 3, 7.4), fl((k + 1) / 3, 7.4), fl((k + 1) / 3, 6.5), fl(k / 3, 6.5), 'plain', cols[k], nu=2, nv=1)
Bd = Batch()
for (x, z) in [(x, z) for x in (-22.6, -21.95, -21.3, -20.65) for z in (-5.2, -5.85, -6.5)]:                    # drum store
    col = RG.choice(['#2a4a8a', '#1a1a1c', '#a82a20', '#2a4a8a'])
    Bd.prism(x, 0.12, z, 0.29, 0.88, col, n=8)
Bd.emit()
cube(-23.0, -20.3, 0.0, 0.12, -6.9, -4.8, 'planks', uv=1.0, faces='xXYzZ')
for (x, z) in [(-23.2, -7.2), (-20.1, -7.2), (-23.2, -4.5), (-20.1, -4.5)]: beam((x, 0, z), (x, 2.6, z), 0.08, 'plain', '#5a5c5e', sides=4)
sheet((-23.5, 2.7, -4.3), (-19.8, 2.7, -4.3), (-19.8, 2.4, -7.5), (-23.5, 2.4, -7.5), 'roof_sheet', uv=1.0)
K.obstacle(-21.65, -5.85, 3.3, 3.0)
K.cyl((-19.6, 0.0, -9.5), 0.29, 0.88, 'plain', '#1a1a1c', seg=9); K.cyl((-19.0, 0.29, -9.9), 0.29, 0.88, 'plain', '#a82a20', seg=9, axis='x', rot=0.6)
K.cyl((-24.5, 0.0, -11.5), 1.3, 2.2, 'plain', '#5a5c5a', seg=12); circle_obstacle(-24.5, -11.5, 1.35)            # slop tank
K.box((-7.2, 0.0, 19.5), (1.2, 0.12, 1.0), 'planks', uv=1.0); K.box((-7.2, 0.12, 19.5), (1.2, 0.12, 1.0), 'planks', uv=1.0, rot=0.1)   # pallets
for (x, z, rot, cell) in [(-8.5, 20.5, 0.6, (896, 256, 1024, 384)), (5.5, 15.0, 0.0, (768, 256, 896, 384))]:
    beam((x, 0.0, z), (x, 2.0, z), 0.06, 'plain', '#d8d8d4', sides=4)
    sign(x + math.sin(rot) * 0.04, 1.45, z + math.cos(rot) * 0.04, 0.6, 0.6, rot, cell, back='#9a9a96')
    K._collide((x, 0, z), (0.15, 1, 0.15), 0, True, False)
LMW[0] = 1.0

# ================================================================== FLOODLIGHT POLES, AVIATION LIGHTS, STREET LIGHTS
LMW[0] = 0.8
flood_pole(-8.5, 16.0, 10.0, heads=((-0.6, PI * 0.9), (0.6, PI * 1.15)), lit=on('floods'), aim=(-4.0, 6.0))
flood_pole(12.5, 18.4, 10.0, heads=((-0.6, PI * 0.85), (0.6, PI * 1.1)), lit=on('floods'), aim=(2.0, 19.0))
flood_pole(-25.0, 2.0, 10.0, heads=((-0.6, PI / 2), (0.6, PI / 2 + 0.4)), lit=on('floods'), aim=(-14.0, 0.0))
flood_pole(14.6, -17.2, 11.0, heads=((-0.6, PI), (0.6, PI * 1.2)), lit=on('floods'), aim=(10.0, -26.0))
flood_pole(-12.5, -13.0, 10.0, heads=((-0.6, PI * 0.7), (0.6, PI * 1.3)), lit=on('floods'), aim=(-14.0, -21.0))
flood_pole(27.0, 1.6, 12.0, heads=((-0.6, -PI / 2 - 0.3), (0.0, -PI / 2), (0.6, -PI / 2 + 0.3)), lit=on('floods'), aim=(16.0, 1.6))
for (x, z, r) in [(8.0, 10.0, 6.0), (T3X, -7.0, T3R)]:
    AV = 9.0 + r * math.tan(math.radians(9))
    lampbox((x, AV + 0.2, z), (0.12, 0.12, 0.12), '#ff3a2a', on('aviation'), kind='GlowsRed', off='#6a2a20')
for x in (-22.0, -8.0, 8.0, 22.0):
    beam((x, 0.0, 26.6), (x, 7.5, 26.6), 0.16, 'plain', '#5a5c5e', t2=0.1, sides=5)
    beam((x, 7.4, 26.6), (x, 7.7, 28.0), 0.08, 'plain', '#5a5c5e', sides=4)
    K.box((x, 7.55, 28.2), (0.3, 0.14, 0.6), 'plain', '#3a3a3a')
    lampbox((x, 7.48, 28.2), (0.22, 0.06, 0.45), '#ffb060', on('street'), off='#8a8070')
    if on('street'): K.point((x, 7.2, 28.2), '#ffa04a', 260 if NIGHT else 120, 0.3)
    K._collide((x, 0, 26.6), (0.3, 1, 0.3), 0, True, False)
for x in (-60.0, -40.0, 40.0, 60.0):
    beam((x, 0.0, 26.6), (x, 7.5, 26.6), 0.16, 'plain', '#5a5c5e', sides=4)
    lampbox((x, 7.48, 28.0), (0.22, 0.06, 0.45), '#ffb060', on('street'), off='#8a8070')
LMW[0] = 1.0

# ================================================================== ACROSS THE ROAD (south) and the neighbour depot (east)
LMW[0] = 0.2
for i, (x0, x1, h, fac, roof) in enumerate([(-40, -31, 3.4, 'facade_b', 'roof_red'), (-30, -23, 3.0, 'facade_d', 'corrugated_rust'), (-21.5, -14, 3.6, 'facade_a', 'roof_sheet'),
                                             (-12, -5.5, 3.2, 'facade_e', 'roof_blue'), (6.0, 13.0, 3.4, 'facade_c', 'corrugated_rust'), (14.5, 22.5, 4.2, 'facade_b', 'roof_red'),
                                             (24.0, 33.0, 3.2, 'facade_d', 'roof_sheet'), (35.0, 44.0, 3.6, 'facade_a', 'corrugated_rust')]):
    cube(x0, x1, 0.0, h, 35.5, 41.0, fac, uv=1.0, faces='zxX', block=True)
    cube(x0 - 0.3, x1 + 0.3, h, h + 0.12, 34.0, 41.4, roof, uv=1.0, faces='Yy')
    for k in range(int((x1 - x0) / 3.0)): quadv(x0 + 1.5 + k * 3.0, 0.0, 35.49, 2.4, 2.5, PI, 'shutter')
    if i in (1, 3, 5): lampquad((x0 + x1) / 2, 0.9, 35.48, 1.4, 1.0, PI, '#ffd8a0', on('settle') or i == 3)
    for xp in (x0 + 0.3, x1 - 0.3): beam((xp, 0.0, 34.2), (xp, h, 34.2), 0.1, 'plain', '#5a5048', sides=4)
cube(-3.5, 2.5, 0.0, 2.6, 34.5, 37.0, 'container', uv=1.0, faces='xXzZY', block=True)                          # container kiosk opposite the gate
lampquad(-0.5, 0.9, 34.49, 2.0, 1.1, PI, '#ffe0b0', on('kiosk'))
K.point((-0.5, 1.6, 33.6), '#ffd8a0', 40 if not NIGHT else 60, 0.2)
umbrella(4.2, 33.6, r=1.3, h=2.2, c1='#e8c020', c2='#2a8a3a')
ptable(4.2, 33.6, 0.0, '#d8d4cc', w=0.9, d=0.7)
for k, col in enumerate(['#d8d4cc', '#3a6ab8', '#c8302a']): chair(3.4 + k * 0.8, 34.4, PI, col)
pole_tops = [epole(x, 32.9, h=8.5, arm=1.1) for x in (-26.0, -9.0, 9.0, 26.0)]
for a, b in zip(pole_tops, pole_tops[1:]):
    for k in (0, 1, 3): wire(a[k], b[k], sag=0.45, n=6, t=0.012)
for x, h in [(-18.0, 7.0), (19.0, 8.0)]: tree(x, 38.0, h=h, r=3.2, seed=int(x + 100), color='#2a3e20', blobs=6)
palm(-34.0, 33.5, h=9.0, lean=(0.3, -0.4), seed=81, y0=0.0); palm(36.0, 33.0, h=10.0, lean=(-0.4, -0.2), seed=82, y0=0.0)
LMW[0] = 0.1
for (x, z, r, h) in [(52.0, -14.0, 8.0, 9.0), (56.0, 8.0, 7.0, 8.0), (76.0, -4.0, 9.0, 10.0)]:                # neighbour depot tanks (grey-green)
    K.cyl((x, 0.0, z), r, h, 'tf_nbtank', seg=24, caps=False, uv=0.25)
    poly([(x, h + r * 0.15, z)] + [(x + math.cos(2 * PI * i / 24) * (r + 0.1), h, z + math.sin(2 * PI * i / 24) * (r + 0.1)) for i in range(24)], [(0, 1 + (i + 1) % 24, 1 + i) for i in range(24)], 'tf_nbtank', uv=0.25)
cube(30.0, 32.0, 0.0, 6.0, -23.0, -15.0, 'tf_gatehse', uv=0.5, faces='xXzZY')
LMW[0] = 1.0

# ================================================================== DYNAMIC: water, panorama, flare
wm = 'tf_water_n' if NIGHT else 'tf_water'
K.mat(wm, base='#20262a')
bake_invisible(K.plane((0, -0.6, -87.0), 300.0, 126.0, wm, uv=1 / 6, kind='Water'))
bake_invisible(K.plane((-90.0, -0.6, 18.0), 120.0, 84.0, wm, uv=1 / 6, kind='Water'))
pm = 'tf_pano_n' if NIGHT else 'tf_pano'
K.mat(pm, base='#000000')
o = K.strip((0, -2), 96, 100, -PI, PI, pm, seg=64, y0=-6.0, kind='Pano')
flip_normals(o); bake_invisible(o)
FA = math.radians(-62.0)                                   # the flare far away NNE (azimuth a = atan2(z, x)); pano u = 0.328
fx, fz = math.cos(FA) * 93.5, -2 + math.sin(FA) * 93.5
bake_invisible(K.quad((fx, 3.6, fz), 4.2, 8.0, 'tf_flame', rot=math.atan2(-math.cos(FA), -math.sin(FA)), kind='Flare', uvrect=(0, 0, 1, 1)))

# ================================================================== vehicles (anchors) + bake-only contact shadows
K.anchor('SotonyeCar', (-9.4, 0, 10.8), veh='sedan', rot=PI / 2, color='#6e1c20')
K.box((-9.4, 0.25, 10.8), (4.4, 0.9, 1.7), 'plain', '#202020', kind='bake')
K.anchor('Keke', (11.5, 0, 30.6), veh='keke', rot=-PI / 2 + 0.05)
K.box((11.5, 0.2, 30.6), (2.5, 0.8, 1.2), 'plain', '#202020', kind='bake')
if NIGHT:
    K.anchor('TfPickup', (-1.7, 0, 19.4), veh='pickupN', rot=0.35, lights='on', beacons=True, glow=True, keep=True)
    K.anchor('TfVan', (2.3, 0, 18.2), veh='vanN', rot=-0.4, lights='on', beacons=True, glow=True, keep=True)

# ================================================================== ANCHORS
K.anchor('start', (0, 0, 28.5), rot=PI)
K.anchor('uche_start', (1.3, 0, 28.8), rot=PI)
K.anchor('hauwa', (-1.4, 0, 28.6), rot=PI / 2)
K.anchor('gate', (0, 0, 24), rot=PI, slide_x=7.4, obstacle=[0.1, GZ, 7.4, 0.3])
K.anchor('security', (-3.6, 0, 21.2), rot=PI / 2)
K.anchor('office_door', (-12, 0, 8), rot=-PI / 2)
K.anchor('sotonye', (-17, 0, 9.5), rot=2.2)
K.anchor('shredder', (-18.6, 0, 6.4))
K.anchor('desk', (-17.4, 0.75, 10.4))
K.anchor('cabinets', (-19.2, 0, 11))
K.anchor('office_safe', (-19.2, 0, 9.57))
K.anchor('tank3_valve', (2.4, 0, -7), rot=PI / 2)
K.anchor('gantry', (-4, 0, 0), rot=PI)
K.anchor('lab', (-15.2, 0, -5.4), rot=PI)
K.anchor('barge', (6, 0, -28.5))
K.anchor('cashroom', (12, 0, -28.5), rot=PI / 2)
K.anchor('ibinabo', (-20, 0, -21), rot=PI / 2)
K.anchor('boom_pivot', (-2.25, 1.0, 22.7))
K.anchor('cashdoor_hinge', (12.37, 0, -29.0))
K.anchor('senator', (4.6, 0, -24.8), rot=PI)
K.anchor('guards', (0, 0, 0), list=[[-6.2, 22.4, 0.6], [2.2, 21.4, -0.3]])
K.anchor('loaders', (0, 0, 0), list=[[-5.2, -10.3, 0.0], [-2.9, 1.0, PI], [-8.7, -6.0, PI / 2]])
K.anchor('boatmen', (0, 0, 0), list=[[-18.9, -19.4, PI + 0.3], [-17.4, -22.8, -PI / 2], [-13.4, -23.0, PI], [-22.4, -22.1, PI / 2 + 0.4]])
if NIGHT:
    K.anchor('river_landing', (-14, 0, -23.5), rot=0.0)
    K.anchor('taskforce', (0, 0, 21), rot=0.0)
    K.anchor('taskforce_men', (0, 0, 0), list=[[-0.3, 21.4, 0.0], [0.9, 21.2, 0.0], [3.7, 20.4, -0.3], [-3.1, 20.0, 0.4]])
# keep walkers out of the water: north of the quay only the finger pier, the berth strip and the barge deck are land
K.obstacle(-18.75, -27.0, 18.5, 6.0)
K.obstacle(-4.75, -27.7, 1.5, 4.6)
K.obstacle(22.0, -27.0, 12.0, 6.0)
K.bounds(-28, 28, -30, 29.5)

WIRES.emit()
build(lm=1024, samples=SAMPLES, margin=2, min_m=0.12, percentile=99.4, denoise=0.36)
