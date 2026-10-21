"""NACECA S2 · Court 5, Federal High Court, Abuja (key 'court', daytime).

North = -z: the raised bench (platform x -4.6..4.6, z -12..-7.4, 0.9 m) with the judge's chair, the coat of arms and
the flag; the registrar's desk below it; the witness box on the west, the dock on the east; the bar (prosecution west,
defence east) with a lectern between; a rail at z 1.2, then the public gallery (benches either side of the aisle) and
the double door at the south. High windows on the east and west walls; fluorescent panels; three ceiling fans.

    cd /tmp && python3 ROOT/blender/env_court.py ROOT/art13/work [samples]

Dynamic nodes: Glows (warm), GlowsCool (fluorescent panels, AC LEDs), Windows (daylight panes, ct_window),
Fan1..Fan3 (blades; spin each about anchors fan1..fan3), Glass is not used.
Helpers are copied from env_abuja_office.py (walls with openings, Batch, flatq, architrave).
"""
import sys, os, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from envkit import Kit, G, lin
import kit2

OUT = sys.argv[1]
SAMPLES = int(sys.argv[2]) if len(sys.argv) > 2 else 80
K = Kit('court', OUT); kit2.use(K, 5260)
from kit2 import *
import bpy, bmesh
from mathutils import Vector
PI = math.pi
RG = random.Random(5261)
_fin0 = K._finish
TOPM = [False]
def _finish_clean(*a, **kw):
    ob = _fin0(*a, **kw); me = ob.data
    while len(me.uv_layers) > 1: me.uv_layers.remove(me.uv_layers[-1])   # quads carry an empty 2nd UV layer
    if TOPM[0] and ob.get('lm') is None: ob['lm'] = 'top'
    if ob in K.static and sum(p.area * max(0.0, p.normal.z) for p in me.polygons) < 1e-4:
        ob['lm'] = 'auto'        # nothing faces up (a wall sign / quad): a top-down island would be a zero-area line
    return ob
K._finish = _finish_clean

class TOP:
    def __enter__(self): self.p = TOPM[0]; TOPM[0] = True
    def __exit__(self, *a): TOPM[0] = self.p

class Batch:
    """many small vertex-coloured parts merged into one static object (one lightmap island in 'top' mode)"""
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
            cc = lin(col); vals += [cc[0], cc[1], cc[2], 1.0] * p.loop_total
        ca.data.foreach_set('color', vals)
        bm = bmesh.new(); bm.from_mesh(ob.data)
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
        bm.to_mesh(ob.data); bm.free()
        self.v, self.f, self.c = [], [], []
        return ob

def T_(x, z, rot):
    c, s = math.cos(rot), math.sin(rot)
    return lambda lx, ly, lz: (x + lx * c + lz * s, ly, z - lx * s + lz * c)

def bx(x0, x1, y0, y1, z0, z1, color, faces='xXYzZ', **kw):
    return cube(x0, x1, y0, y1, z0, z1, 'plain', color, faces=faces, **kw)

def wood(x0, x1, y0, y1, z0, z1, faces='xXYzZ', mat='wood_dark', uv=1.0, **kw):
    return cube(x0, x1, y0, y1, z0, z1, mat, faces=faces, uv=uv, **kw)

def sign(x, y, z, w, h, rot, cell, mat='ct_signs', W=1024, H=1024, kind='static'):
    return quadv(x, y, z, w, h, rot, mat, uvrect=atlas(*cell, W=W, H=H), kind=kind)

def flatq(x0, x1, z0, z1, y, mat, uvrect=(0, 0, 1, 1), kind='static', color=None):
    """a horizontal quad facing up; the texture's bottom edge lies along the south (+z) side"""
    bm = bmesh.new(); uvl = bm.loops.layers.uv.new('UVMap')
    vs = [bm.verts.new(G(x0, y, z1)), bm.verts.new(G(x1, y, z1)), bm.verts.new(G(x1, y, z0)), bm.verts.new(G(x0, y, z0))]
    f = bm.faces.new(vs); u0, v0, u1, v1 = uvrect
    for l, uv in zip(f.loops, [(u0, v0), (u1, v0), (u1, v1), (u0, v1)]): l[uvl].uv = uv
    return K._finish(bm, mat, color, None, (0, 0, 0), 0.0, kind, None)

def subtract(rect, holes):
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

def floor(rect, mat, uv, holes=(), y=0.0):
    for (a, b, c, d) in subtract(rect, list(holes)): cube(a, b, y - 0.01, y, c, d, mat, uv=uv, faces='Y')

H = 4.6                      # ceiling
def wall(axis, f0, f1, a0, a1, openings=(), lo=None, hi=None, y0=0.0, y1=H, block=True, collide=True, reveal='wood_trim'):
    """a wall slab f0..f1 thick, running a0..a1 (axis 'x': along x at z f0..f1; 'z': along z at x f0..f1).
    lo / hi: (material, uv) of the face looking to -axis / +axis (None = not built). openings [(b0, b1, oy0, oy1)];
    an opening that starts at the floor is a door: no blocker or obstacle across it."""
    cuts = sorted(openings); segs, cur = [], a0
    for (b0, b1, oy0, oy1) in cuts:
        if b0 > cur: segs.append((cur, b0, y0, y1))
        if oy0 > y0: segs.append((b0, b1, y0, oy0))
        if oy1 < y1: segs.append((b0, b1, oy1, y1))
        cur = b1
    if cur < a1: segs.append((cur, a1, y0, y1))
    for (s0, s1, sy0, sy1) in segs:
        for (fc, spec) in ((('z' if axis == 'x' else 'x'), lo), (('Z' if axis == 'x' else 'X'), hi)):
            if not spec: continue
            m, uv = spec
            if axis == 'x': cube(s0, s1, sy0, sy1, f0, f1, m, uv=uv, faces=fc)
            else: cube(f0, f1, sy0, sy1, s0, s1, m, uv=uv, faces=fc)
    for (b0, b1, oy0, oy1) in cuts:          # reveals
        if axis == 'x':
            cube(b0 - 0.001, b0, oy0, oy1, f0, f1, reveal, uv=1.0, faces='X'); cube(b1, b1 + 0.001, oy0, oy1, f0, f1, reveal, uv=1.0, faces='x')
            if oy0 > y0: cube(b0, b1, oy0 - 0.001, oy0, f0, f1, reveal, uv=1.0, faces='Y')
            cube(b0, b1, oy1, oy1 + 0.001, f0, f1, reveal, uv=1.0, faces='y')
        else:
            cube(f0, f1, oy0, oy1, b0 - 0.001, b0, reveal, uv=1.0, faces='Z'); cube(f0, f1, oy0, oy1, b1, b1 + 0.001, reveal, uv=1.0, faces='z')
            if oy0 > y0: cube(f0, f1, oy0 - 0.001, oy0, b0, b1, reveal, uv=1.0, faces='Y')
            cube(f0, f1, oy1, oy1 + 0.001, b0, b1, reveal, uv=1.0, faces='y')
    runs, cur = [], a0
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

def architrave(axis, face, b0, b1, top, w=0.09, t=0.025, mat='wood_trim'):
    """a door casing on a wall face: axis 'x' = wall along x with the face plane at z=face (t>0 toward +z, t<0 toward -z)"""
    a, b = (face, face + t) if t > 0 else (face + t, face)
    if axis == 'x':
        for (x0, x1) in [(b0 - w, b0), (b1, b1 + w)]: cube(x0, x1, 0.0, top + w, a, b, mat, uv=1.0, faces='xXYzZ')
        cube(b0, b1, top, top + w, a, b, mat, uv=1.0, faces='YzZy')
    else:
        for (z0, z1) in [(b0 - w, b0), (b1, b1 + w)]: cube(a, b, 0.0, top + w, z0, z1, mat, uv=1.0, faces='xXYzZ')
        cube(a, b, top, top + w, b0, b1, mat, uv=1.0, faces='YxXy')


# ================================================================== materials (bounce albedo for the bake)
for n, b in [('ct_carpet', '#2c4a34'), ('ct_floor', '#c9c2b4'), ('ab_panel', '#6e4228'), ('wall_paint', '#e8e2d2'), ('ceiling_tile', '#e6e6e2'),
             ('wood_dark', '#4a2a18'), ('wood_trim', '#5a3420'), ('bench_wood', '#8a5c38'), ('leather', '#5a1c18'), ('ct_signs', '#5a4a3a'),
             ('brass', '#b08a40'), ('concrete', '#a8a49c')]:
    K.mat(n, base=b)
K.mat('ct_window', base='#e8f0f8')

# ================================================================== light for the bake: daylight through high windows + fluorescent panels
K.world('#e2e8f0', 0.55)
WIN_Z = (-8.6, -3.4, 1.8, 7.0)                     # window centres on the east and west walls
WIN_Y = (2.35, 3.95)
for z in WIN_Z:
    for (x, d) in [(-10.2, (1, -0.35, 0)), (10.2, (-1, -0.35, 0))]:
        K.area((x, 3.2, z), (1.7, 1.7), '#eaf2ff', 260, d)

# ================================================================== FLOORS
LMW[0] = 1.0
floor((-9.0, 9.0, -12.0, 1.2), 'ct_carpet', 0.5)
floor((-9.0, 9.0, 1.2, 12.0), 'ct_floor', 1 / 2.2, holes=[(-0.9, 0.9, 1.2, 12.0)])
LMW[0] = 1.2
flatq(-0.9, 0.9, 1.2, 12.0, 0.0, 'ct_carpet')                                                   # aisle runner
LMW[0] = 1.0

# ================================================================== WALLS (panelled to 1.3 m, painted above; full panelling behind the bench)
PAN = ('ab_panel', 1 / 1.3); PNT = ('wall_paint', 0.5)
WINS = [(z - 0.85, z + 0.85, WIN_Y[0], WIN_Y[1]) for z in WIN_Z]
LMW[0] = 0.85
wall('z', -9.3, -9.0, -12.0, 12.0, [], y0=0.0, y1=1.3, hi=PAN)                                # west
wall('z', -9.3, -9.0, -12.0, 12.0, WINS, y0=1.3, y1=H, hi=PNT, block=False, collide=False)
wall('z', 9.0, 9.3, -12.0, 12.0, [], y0=0.0, y1=1.3, lo=PAN)                                   # east
wall('z', 9.0, 9.3, -12.0, 12.0, WINS, y0=1.3, y1=H, lo=PNT, block=False, collide=False)
wall('x', -12.3, -12.0, -9.0, 9.0, [], y0=0.0, y1=3.2, hi=PAN)                                 # north: panelled high behind the bench
wall('x', -12.3, -12.0, -9.0, 9.0, [], y0=3.2, y1=H, hi=PNT, block=False, collide=False)
DOOR = (-1.0, 1.0, 0.0, 2.55)
wall('x', 12.0, 12.3, -9.0, 9.0, [DOOR], y0=0.0, y1=1.3, lo=PAN)                               # south, with the double door
wall('x', 12.0, 12.3, -9.0, 9.0, [(-1.0, 1.0, 1.3, 2.55)], y0=1.3, y1=H, lo=PNT, block=False, collide=False)
architrave('x', 12.0, -1.0, 1.0, 2.55, w=0.12, t=-0.03)
LMW[0] = 1.0
# dado rail + skirting
Bt = Batch()
for (x0, x1, z0, z1) in [(-9.0, -8.97, -12.0, 12.0), (8.97, 9.0, -12.0, 12.0)]:
    Bt.box(x0 - 0.0, x1 + 0.0, 1.28, 1.36, z0, z1, '#3a2010', 'xXY')
Bt.box(-9.0, -1.0, 1.28, 1.36, 11.97, 12.0, '#3a2010', 'zY'); Bt.box(1.0, 9.0, 1.28, 1.36, 11.97, 12.0, '#3a2010', 'zY')
Bt.emit()
# window reveals + sills (deep, painted), the panes (daylight) and burglar-proof bars are on the pane texture
for z in WIN_Z:
    for (xw, face, sgn) in [(-9.0, 'X', 1), (9.0, 'x', -1)]:
        cube(min(xw, xw + sgn * 0.12), max(xw, xw + sgn * 0.12), WIN_Y[0] - 0.05, WIN_Y[0], z - 0.85, z + 0.85, 'plain', '#ece6d8', faces='Y')
        q = quadv(xw - sgn * 0.28, WIN_Y[0], z, 1.7, WIN_Y[1] - WIN_Y[0], (PI / 2 if sgn > 0 else -PI / 2), 'ct_window', kind='Windows')
        bake_invisible(q)

# ================================================================== CEILING: tiles, fluorescent panels, fans
LMW[0] = 0.45
cube(-9.0, 9.0, H - 0.01, H, -12.0, 12.0, 'ceiling_tile', uv=1 / 1.2, faces='y')
LMW[0] = 1.0
PANELS = [(x, z) for x in (-5.4, 0.0, 5.4) for z in (-9.6, -4.6, 0.4, 5.4, 10.2)]
for (x, z) in PANELS:
    bx(x - 0.66, x + 0.66, H - 0.03, H - 0.01, z - 0.34, z + 0.34, '#d8dad6', faces='y')
    gbox((x, H - 0.045, z), (1.2, 0.015, 0.56), '#eef4ff', kind='GlowsCool')
    K.area((x, H - 0.09, z), (1.2, 0.56), '#eef4ff', 95, (0, -1, 0))
FANS = [(-4.2, -2.6), (4.2, -2.6), (0.0, 6.0)]
for i, (x, z) in enumerate(FANS):
    bx(x - 0.03, x + 0.03, H - 0.6, H, z - 0.03, z + 0.03, '#1e1e1e', faces='xXzZ')          # downrod (static)
    nm = 'Fan%d' % (i + 1)
    K.cyl((x, H - 0.72, z), 0.16, 0.14, 'plain', color='#2a2a2a', seg=12, kind=nm)          # motor
    for k in range(3):
        a = k * 2 * PI / 3
        c, s = math.cos(a), math.sin(a)
        K.box((x + c * 0.62, H - 0.66, z - s * 0.62), (1.0, 0.012, 0.14), 'plain', color='#5a3a24', rot=a, kind=nm, bottom=True)
    K.anchor('fan%d' % (i + 1), (x, H - 0.66, z))
# split AC units, high on the side walls
for (x, z, rot) in [(-8.86, -6.0, PI / 2), (-8.86, 4.5, PI / 2), (8.86, -6.0, -PI / 2), (8.86, 4.5, -PI / 2)]:
    K.box((x, 3.95, z), (0.95, 0.3, 0.22), 'plain', color='#eceeed', rot=rot)
    gbox((x + (0.115 if x < 0 else -0.115), 4.02, z + 0.3), (0.012, 0.012, 0.012), '#58ff8a', kind='GlowsCool')
LMW[0] = 1.0

# ================================================================== THE BENCH (platform, desk, the judge's chair, the arms, the flag)
LMW[0] = 1.25
cube(-4.6, 4.6, 0.0, 0.9, -12.0, -7.4, 'ct_carpet', uv=0.5, faces='Y')
wood(-4.6, 4.6, 0.0, 0.9, -7.42, -7.4, faces='Z', mat='wood_dark')                              # platform front
wood(-4.62, -4.6, 0.0, 0.9, -12.0, -7.4, faces='x'); wood(4.6, 4.62, 0.0, 0.9, -12.0, -7.4, faces='X')
K.obstacle(0.0, -9.7, 9.2, 4.6); K.blocker(0.0, 0.45, -9.7, 9.2, 0.9, 4.6)
for (sx, d) in [(-1, -1), (1, 1)]:                                                              # steps at both ends
    for k in range(3):
        x0 = sx * 4.62 if sx > 0 else -4.62 - 0.3 * (k + 1)
        x1 = x0 + 0.3 * (k + 1) if sx > 0 else -4.62
        wood(min(x0, x1), max(x0, x1), 0.0, 0.3 * (3 - k), -8.6, -7.6, mat='wood_trim')
# the bench desk (judge's), its fluted front over the platform edge
wood(-3.7, 3.7, 0.9, 1.72, -8.05, -7.45, faces='xXYZ', mat='wood_dark')
wood(-3.75, 3.75, 1.72, 1.77, -8.12, -7.4, mat='wood_dark')
Bf = Batch()
for k in range(25):
    x = -3.6 + k * 0.3
    Bf.box(x - 0.04, x + 0.04, 0.12, 1.66, -7.44, -7.38, '#3a2010', 'XZx')
Bf.emit()
sign(0.0, 1.32, -7.37, 2.6, 0.33, 0.0, (512, 160, 1024, 224))                                 # HON. JUSTICE T. O. BAKARE
# on the desk: the record book, files, a gavel block, a microphone, a water glass
LMW[0] = 1.4
bx(-0.6, 0.3, 1.77, 1.82, -7.95, -7.55, '#2a3a5a'); bx(-0.55, 0.25, 1.82, 1.825, -7.92, -7.58, '#f2eee2', faces='Y')
flatq(0.6, 1.4, -7.98, -7.55, 1.775, 'ct_signs', uvrect=atlas(8, 520, 126, 636))
flatq(1.5, 2.3, -7.98, -7.55, 1.775, 'ct_signs', uvrect=atlas(134, 520, 252, 636))
beam((-1.4, 1.77, -7.9), (-1.4, 2.12, -7.7), 0.012, color='#151515'); bx(-1.48, -1.32, 1.77, 1.79, -7.98, -7.84, '#1a1a1a')
K.cyl((-2.4, 1.77, -7.7), 0.04, 0.12, 'plain', color='#cfe0e8', seg=10)
LMW[0] = 1.25
# the judge's high-backed chair
bx(-0.36, 0.36, 0.9, 1.38, -9.85, -9.35, '#5a1c18', faces='xXYzZ', collide=False)
bx(-0.4, 0.4, 1.38, 2.85, -10.05, -9.85, '#5a1c18', faces='xXYzZ')
bx(-0.44, 0.44, 2.85, 2.95, -10.08, -9.82, '#3a2010')
for sx in (-1, 1): bx(sx * 0.36 - 0.05, sx * 0.36 + 0.05, 1.38, 1.62, -9.85, -9.4, '#3a1210')
# panelled canopy behind the bench + the coat of arms + the flag
wood(-2.3, 2.3, 0.9, 4.25, -11.98, -11.9, faces='Z', mat='wood_dark')
wood(-2.45, 2.45, 4.25, 4.4, -12.0, -11.82, mat='wood_trim')
for sx in (-1, 1): wood(sx * 2.3 - 0.12, sx * 2.3 + 0.12, 0.9, 4.25, -12.0, -11.84, mat='wood_trim')
sign(0.0, 2.7, -11.89, 1.55, 1.55, 0.0, (0, 0, 512, 512))                                       # the coat of arms
K.cyl((3.1, 0.9, -11.2), 0.035, 2.75, 'plain', color='#c9a24a', seg=8)
K.sphere((3.1, 3.7, -11.2), 0.06, 'plain', color='#d8b04a', seg=8)
for k, col in enumerate(['#1f7a3a', '#f2f2ee', '#1f7a3a']):                                    # green-white-green, hanging in folds
    x0 = 3.14 + k * 0.33
    sheet((x0, 3.62, -11.2), (x0 + 0.33, 3.62, -11.2), (x0 + 0.33, 2.55, -11.15 + 0.05 * (k % 2)), (x0, 2.55, -11.2), color=col, uv=None, nu=1, nv=3, up=True)
for sx in (-1, 1):                                                                              # brass sconces either side of the canopy
    bx(sx * 2.9 - 0.06, sx * 2.9 + 0.06, 3.2, 3.38, -11.98, -11.9, '#b08a40')
    gbulb(sx * 2.9, 3.48, -11.86, 0.07, '#ffe0b0', watts=30, light='#ffd9a0')

# ================================================================== THE REGISTRAR
LMW[0] = 1.3
wood(-1.45, 1.45, 0.0, 0.78, -6.85, -6.1, faces='xXYZ', mat='wood_trim')
wood(-1.5, 1.5, 0.78, 0.82, -6.9, -6.05, mat='wood_dark')
sign(0.0, 0.42, -6.04, 0.9, 0.22, 0.0, (512, 224, 768, 288))                                    # REGISTRAR
K.obstacle(0.0, -6.47, 3.0, 0.85)
bx(-0.25, 0.25, 0.0, 0.46, -7.25, -6.95, '#1e1e20'); bx(-0.25, 0.25, 0.46, 1.05, -7.32, -7.25, '#1e1e20')
flatq(-1.2, -0.4, -6.75, -6.2, 0.825, 'ct_signs', uvrect=atlas(260, 520, 378, 636))
bx(0.3, 0.9, 0.82, 0.86, -6.7, -6.3, '#2a2a2e'); bx(0.32, 0.88, 0.86, 1.18, -6.72, -6.68, '#1a1a1c')          # laptop
gquad(0.6, 0.88, -6.675, 0.5, 0.28, 0.0, '#a8c8ff', kind='GlowsCool')
bx(-0.2, 0.15, 0.82, 0.95, -6.8, -6.55, '#3a3a3e')                                             # the recording machine

# ================================================================== THE WITNESS BOX (west)
LMW[0] = 1.3
WX0, WX1, WZ0, WZ1 = -6.35, -4.85, -5.35, -3.85
wood(WX0, WX1, 0.0, 0.4, WZ0, WZ1, faces='xXYzZ', mat='wood_trim')
for (x0, x1, z0, z1) in [(WX1 - 0.06, WX1, WZ0, WZ1), (WX0, WX1, WZ1 - 0.06, WZ1), (WX0, WX0 + 0.06, WZ0, WZ1)]:
    wood(x0, x1, 0.4, 1.42, z0, z1, mat='wood_dark')
wood(WX1 - 0.18, WX1 + 0.04, 1.42, 1.47, WZ0, WZ1, mat='wood_trim')                            # the shelf on the front rail
wood(WX0 + 0.5, WX1, 0.4, 1.42, WZ0, WZ0 + 0.06, mat='wood_dark')                              # back rail, gap for the steps
for k in range(2): wood(WX0, WX0 + 0.5, 0.0, 0.13 + k * 0.13, WZ0 - 0.32 + k * 0.16, WZ0, mat='wood_trim')
bx(WX1 - 0.12, WX1 - 0.02, 1.47, 1.52, -4.8, -4.5, '#1a1a1a'); bx(WX1 - 0.12, WX1 - 0.02, 1.47, 1.5, -4.4, -4.15, '#3a1a10')   # Bible, Qur'an
sign(WX1 + 0.005, 0.6, -4.6, 0.7, 0.18, PI / 2, (768, 224, 1024, 288))                          # WITNESS
beam((WX1 - 0.1, 1.47, -5.1), (WX1 - 0.3, 1.8, -5.0), 0.012, color='#151515')
K.obstacle((WX0 + WX1) / 2, (WZ0 + WZ1) / 2 - 0.15, WX1 - WX0, WZ1 - WZ0 + 0.3)

# ================================================================== THE DOCK (east)
DX0, DX1, DZ0, DZ1 = 4.6, 7.4, -2.15, -0.4
for (x0, x1, z0, z1) in [(DX0, DX0 + 0.07, DZ0, DZ1), (DX0, DX1, DZ1 - 0.07, DZ1), (DX0, DX1, DZ0, DZ0 + 0.07), (DX1 - 0.07, DX1, DZ0, DZ1 - 1.0)]:
    wood(x0, x1, 0.0, 1.12, z0, z1, mat='wood_dark')
Bd = Batch()
for k in range(14):                                                                            # turned spindles on the rails
    z = DZ0 + 0.12 + k * 0.12
    if z > DZ1 - 0.1: break
    Bd.box(DX0 - 0.03, DX0 + 0.1, 1.12, 1.16, z - 0.02, z + 0.02, '#3a2010', 'Y')
Bd.emit()
wood(DX0 + 0.25, DX1 - 0.25, 0.42, 0.47, -1.35, -0.95, mat='bench_wood')
bx(DX0 + 0.3, DX0 + 0.38, 0.0, 0.42, -1.3, -1.0, '#2a1a10'); bx(DX1 - 0.38, DX1 - 0.3, 0.0, 0.42, -1.3, -1.0, '#2a1a10')
K.obstacle((DX0 + DX1) / 2, DZ0 + 0.035, DX1 - DX0, 0.2); K.obstacle(DX0 + 0.035, (DZ0 + DZ1) / 2, 0.2, DZ1 - DZ0); K.obstacle((DX0 + DX1) / 2, DZ1 - 0.035, DX1 - DX0, 0.2)

# ================================================================== THE BAR: counsel tables, chairs, the lectern
LMW[0] = 1.3
def counsel_table(x0, x1):
    wood(x0, x1, 0.72, 0.77, -3.1, -2.3, mat='wood_dark')
    for xx in (x0 + 0.06, x1 - 0.12):
        for zz in (-3.04, -2.42): bx(xx, xx + 0.06, 0.0, 0.72, zz, zz + 0.06, '#2a1a10')
    wood(x0 + 0.05, x1 - 0.05, 0.25, 0.72, -3.06, -3.02, faces='zZ', mat='wood_trim')           # modesty panel
    K.obstacle((x0 + x1) / 2, -2.7, x1 - x0, 0.8)
def chair(x, z, rot, col='#1e1e20'):
    c, s = math.cos(rot), math.sin(rot)
    bx(x - 0.24, x + 0.24, 0.0, 0.46, z - 0.24, z + 0.24, col, faces='xXYzZ')
    T = T_(x, z, rot); B = Batch(); B.box(-0.24, 0.24, 0.46, 1.0, -0.26, -0.2, col, T=T); B.emit()
counsel_table(-4.6, -1.5); counsel_table(1.5, 4.6)
for (x, z) in [(-3.0, -1.75), (-4.2, -1.75), (-2.0, -1.75), (3.0, -1.75), (4.2, -1.75), (2.0, -1.75)]:
    chair(x, z, 0.0)
LMW[0] = 1.45
for (x0, ci) in [(-4.3, 0), (-3.4, 1), (2.2, 2), (3.2, 3)]:                                  # files, laptops, bottles
    flatq(x0, x0 + 0.62, -3.0, -2.45, 0.775, 'ct_signs', uvrect=atlas(8 + ci * 126, 644, 126 + ci * 126, 760))
for (x, col) in [(-2.2, '#2a2a2e'), (3.9, '#c0c0c4')]:
    bx(x, x + 0.34, 0.77, 0.79, -2.95, -2.7, col); bx(x, x + 0.34, 0.79, 1.02, -2.97, -2.94, '#151517')
for x in (-1.9, -4.4, 1.9, 4.4):
    K.cyl((x, 0.77, -2.55), 0.035, 0.22, 'plain', color='#cfe6f0', seg=8)
    K.cyl((x, 0.99, -2.55), 0.018, 0.03, 'plain', color='#2a6ab0', seg=8)
for x in (-3.0, 3.0):
    beam((x, 0.77, -2.95), (x - 0.1, 1.1, -2.75), 0.012, color='#151515'); bx(x - 0.08, x + 0.08, 0.77, 0.79, -3.02, -2.88, '#1a1a1a')
LMW[0] = 1.3
wood(-0.3, 0.3, 0.0, 1.05, -3.65, -3.15, faces='xXzZ', mat='wood_dark')                       # the lectern
wood(-0.36, 0.36, 1.05, 1.13, -3.7, -3.1, mat='wood_trim')
K.obstacle(0.0, -3.4, 0.7, 0.6)

# ================================================================== THE RAIL between the well and the gallery (z 1.2), open at the aisle
for (x0, x1) in [(-9.0, -0.9), (0.9, 9.0)]:
    wood(x0, x1, 0.92, 0.98, 1.15, 1.27, mat='wood_trim')
    wood(x0, x1, 0.0, 0.18, 1.17, 1.25, mat='wood_dark')
    Bs = Batch()
    n = int((x1 - x0) / 0.16)
    for k in range(n):
        x = x0 + 0.08 + k * 0.16
        Bs.box(x - 0.025, x + 0.025, 0.18, 0.92, 1.185, 1.235, '#3a2010', 'xXzZ')
    Bs.emit()
    K.obstacle((x0 + x1) / 2, 1.21, x1 - x0, 0.2)

# ================================================================== THE PUBLIC GALLERY
LMW[0] = 0.9
ROWS = [2.5, 3.8, 5.1, 6.4, 7.7, 9.0, 10.3]
for z in ROWS:
    for (x0, x1) in [(-8.5, -1.3), (1.3, 8.5)]:
        wood(x0, x1, 0.42, 0.47, z - 0.21, z + 0.21, mat='bench_wood')
        wood(x0, x1, 0.52, 0.94, z + 0.2, z + 0.25, faces='xXYzZ', mat='bench_wood')
        Bl = Batch()
        for xx in (x0 + 0.1, (x0 + x1) / 2, x1 - 0.16):
            Bl.box(xx, xx + 0.06, 0.0, 0.42, z - 0.18, z - 0.12, '#2a1a10'); Bl.box(xx, xx + 0.06, 0.0, 0.94, z + 0.16, z + 0.22, '#2a1a10')
        Bl.emit()
        K.obstacle((x0 + x1) / 2, z + 0.02, x1 - x0, 0.5)
GALLERY = []
for i, z in enumerate(ROWS):
    for x in ([-7.2, -4.4, -2.2] if i % 2 == 0 else [-6.0, -3.2]) + ([2.4, 5.0, 7.4] if i % 2 else [3.2, 6.2]):
        GALLERY.append([round(x + RG.uniform(-0.25, 0.25), 2), round(z, 2), PI])
K.anchor('gallery', (0, 0, 0), list=GALLERY)

# ================================================================== THE SOUTH WALL: door leaves (open inward a little), name boards, the clock, notices
LMW[0] = 1.1
for (hx, a) in [(-1.0, -0.35), (1.0, 0.35)]:
    T = T_(hx, 12.0, a); B = Batch()
    w = 1.0 if hx < 0 else -1.0
    B.box(0 if w > 0 else -1.0, 1.0 if w > 0 else 0.0, 0.0, 2.5, -0.06, 0.0, '#4a2a16', T=T); B.emit()
sign(0.0, 3.05, 11.97, 4.2, 0.79, PI, (512, 0, 1024, 96))                                       # FEDERAL HIGH COURT OF NIGERIA
sign(0.0, 2.55, 11.97, 3.4, 0.42, PI, (512, 96, 1024, 160))                                     # COURT 5 · ABUJA JUDICIAL DIVISION
sign(-4.5, 2.6, 11.97, 0.7, 0.7, PI, (512, 288, 768, 544))                                      # the clock
sign(4.6, 1.5, 11.97, 0.8, 0.8, PI, (768, 288, 1024, 544))                                      # SILENCE · NO PHONES
sign(-6.8, 1.45, 11.97, 1.6, 0.7, PI, (512, 544, 1024, 768))                                    # cause list
for sx in (-1, 1):
    gbulb(sx * 2.0, 3.6, 11.86, 0.07, '#ffe0b0', watts=26, light='#ffd9a0')

# a little life: a wall-mounted fire extinguisher, a dustbin, a coat stand by the bar
bx(8.88, 8.98, 0.8, 1.35, 10.5, 10.7, '#c0281e'); bx(8.86, 8.99, 1.35, 1.42, 10.55, 10.65, '#1a1a1a')
K.cyl((-8.3, 0.0, 11.3), 0.18, 0.5, 'plain', color='#3a3a3a', seg=10, collide=True)
beam((-8.4, 0.0, 0.2), (-8.4, 1.8, 0.2), 0.05, color='#2a1a10')
for k in range(4):
    a = k * PI / 2
    beam((-8.4, 1.7, 0.2), (-8.4 + math.cos(a) * 0.22, 1.85, 0.2 + math.sin(a) * 0.22), 0.025, color='#2a1a10')
sheet((-8.55, 1.8, 0.12), (-8.25, 1.8, 0.12), (-8.22, 1.0, 0.14), (-8.58, 1.0, 0.14), color='#151515', uv=None)   # a black gown on the stand

# a bounce fill so the ceiling and the upper walls are not black (the carpet and benches throw light back up)
K.area((0.0, 2.6, -2.0), (17.4, 22.0), '#efe6da', 260, (0, 1, 0))

# ================================================================== ANCHORS
K.anchor('judge', (0, 0.9, -9.2), rot=0.0)
K.anchor('registrar', (0, 0, -6.95), rot=0.0)
K.anchor('witness', (-5.6, 0.4, -4.6), rot=PI / 2)
K.anchor('dock1', (5.4, 0, -1.15), rot=-PI / 2); K.anchor('dock2', (6.2, 0, -1.15), rot=-PI / 2); K.anchor('dock3', (7.0, 0, -1.15), rot=-PI / 2)
K.anchor('danladi', (-3.0, 0, -1.75), rot=PI); K.anchor('pros2', (-4.2, 0, -1.75), rot=PI)
K.anchor('san', (3.0, 0, -1.75), rot=PI); K.anchor('def2', (4.2, 0, -1.75), rot=PI)
K.anchor('lectern', (0, 0, -2.85), rot=PI)
K.anchor('start', (0, 0, 10.8), rot=PI); K.anchor('uche_start', (1.2, 0, 10.6), rot=PI)
K.anchor('usher', (-1.6, 0, 1.6), rot=PI)
K.bounds(-8.8, 8.8, -11.8, 11.8)

build(lm=1024, samples=SAMPLES, margin=2, min_m=0.12, percentile=99.3, denoise=0.4)
