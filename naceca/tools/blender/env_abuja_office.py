"""NACECA S2 · the Director-General's suite, 9th floor, NACECA HQ, Abuja (key 'abuja_office', late morning).

North = -z = the floor-to-ceiling glass over the Central Business District (towers, green hills, Aso Rock to the
north-east); south = +z = the 9th-floor corridor. Reception (z 1.8..9.8, x -7..6.5): the PA's desk, visitor sofas
(east wall), the records room (x 6.75..9.8) through the side door at (6.5, 6). The DG's office (z -12..1.45) through
the double door at (0, 1.6): the desk at (0, -8) facing south, the two flags, credenza + photo wall + safe (east),
bookshelves (west), the sofa set round the coffee table at (-5, -4), a meeting table, the glass wall.

    cd /tmp && python3 ROOT/blender/env_abuja_office.py ROOT/art13/work [samples]

Dynamic nodes: Glows (warm lamps, downlights, panels), GlowsCool (records tubes, LEDs, exit sign), Screens
(unlit textured TV + monitors), Glass (the curtain wall + door lites), Pano (the city view), DoorL / DoorR (the DG's
double-door leaves; hinges at x -0.9 / +0.9, z 1.6; they open into the DG's office: DoorL rot.y +PI/2, DoorR -PI/2).
"""
import sys, os, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from envkit import Kit, G, lin
import kit2

OUT = sys.argv[1]
SAMPLES = int(sys.argv[2]) if len(sys.argv) > 2 else 80
K = Kit('abuja_office', OUT); kit2.use(K, 6260)
from kit2 import *
import bpy, bmesh
from mathutils import Vector
PI = math.pi
RG = random.Random(6261)
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

def sign(x, y, z, w, h, rot, cell, mat='ab_signs', W=1024, H=1024, kind='static'):
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

H = 3.4                      # ceiling
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
for n, b in [('ab_carpet', '#3a4258'), ('ab_rug', '#7a4a36'), ('ab_panel', '#6e4228'), ('ab_recep', '#d6cab0'), ('ab_signs', '#9a948a'),
             ('ab_files', '#8a7c64'), ('ab_flags', '#5a7a6a'), ('floor_marble', '#d6d0c4'), ('ceiling_tile', '#e6e6e2'), ('wood_dark', '#4a2a18'),
             ('wood_trim', '#5a3420'), ('leather', '#5a2c1a'), ('books', '#4a3a32'), ('vinyl_floor', '#a8a090'), ('wall_paint', '#e6e2d6'),
             ('crest', '#2a3450'), ('blinds', '#c8c8c4'), ('brass', '#b08a40'), ('concrete', '#a8a49c')]:
    K.mat(n, base=b)
K.mat('glass', base='#8fa8c8'); K.mat('ab_screen', base='#101418'); K.mat('ab_pano', base='#000000')

# ================================================================== light for the bake: north daylight + warm interior
K.world('#dfe8f5', 0.85)
for (x, w) in [(-6.5, 6.4), (0.0, 6.4), (6.5, 6.4)]:                     # the bright north sky through the glass (portal-like)
    K.area((x, 1.75, -11.7), (w, 3.0), '#e6eefc', 300, (0, -0.12, 1))

# ================================================================== FLOORS
LMW[0] = 1.0
RUG = (-7.6, -2.4, -6.2, -1.8)
floor((-9.8, 9.8, -12.0, 1.45), 'ab_carpet', 0.5, holes=[RUG])
LMW[0] = 1.3
flatq(*RUG, 0.0, 'ab_rug')
LMW[0] = 1.0
RUGS = [(4.1, 6.4, 2.35, 4.85), (4.1, 6.4, 7.2, 9.7)]
floor((-7.0, 6.5, 1.8, 9.8), 'floor_marble', 1 / 2.4, holes=RUGS)
for rg_ in RUGS: flatq(*rg_, 0.0, 'ab_rug')
cube(-0.9, 0.9, -0.01, 0.0, 1.45, 1.8, 'floor_marble', uv=1 / 2.4, faces='Y')                 # thresholds
cube(6.5, 6.75, -0.01, 0.0, 5.5, 6.5, 'floor_marble', uv=1 / 2.4, faces='Y')
floor((6.75, 9.8, 1.8, 9.8), 'vinyl_floor', 0.5)

# ================================================================== WALLS
PAN = ('ab_panel', 1 / H); REC = ('ab_recep', 1 / H); PNT = ('wall_paint', 0.5)
LMW[0] = 0.9
wall('z', -10.1, -9.8, -12.0, 1.8, hi=PAN)                                                     # DG west
wall('z', 9.8, 10.1, -12.0, 1.45, lo=PAN)                                                      # DG east
wall('z', 9.8, 10.1, 1.45, 10.1, lo=PNT)                                                       # records east
DGD = (-0.9, 0.9, 0.0, 2.7)
wall('x', 1.45, 1.8, -9.8, 9.8, [DGD], lo=PAN, hi=None)                                         # partition: DG side
wall('x', 1.45, 1.8, -7.0, 6.5, [DGD], hi=REC, block=False, collide=False)                      #   reception side
wall('x', 1.45, 1.8, 6.75, 9.8, [], hi=PNT, block=False, collide=False)                         #   records side
wall('z', -7.25, -7.0, 1.8, 9.8, hi=REC)                                                        # reception west
RD = (5.5, 6.5, 0.0, 2.2)
wall('z', 6.5, 6.75, 1.8, 9.8, [RD], lo=REC, hi=PNT)                                            # records partition, door at z 6
wall('x', 9.8, 10.1, -7.0, 6.5, lo=REC)                                                         # south (corridor) wall
wall('x', 9.8, 10.1, 6.75, 9.8, lo=PNT)
LMW[0] = 1.0
# door casings
architrave('x', 1.45, -0.9, 0.9, 2.7, w=0.12, t=-0.03); architrave('x', 1.8, -0.9, 0.9, 2.7, w=0.12, t=0.03)
architrave('z', 6.5, 5.5, 6.5, 2.2, t=-0.025); architrave('z', 6.75, 5.5, 6.5, 2.2, t=0.025)

# ================================================================== THE GLASS WALL (z -12), mullions, blinds, outside ledge + slab
LMW[0] = 0.9
NB = 12; BW_ = 19.6 / NB
Bm = Batch()
for k in range(NB + 1):
    x = -9.8 + k * BW_
    Bm.box(x - 0.045, x + 0.045, 0.0, H, -12.08, -11.9, '#3a3632', 'xXzZ')
Bm.box(-9.8, 9.8, 0.0, 0.09, -12.08, -11.88, '#2e2a26', 'YZ')                                  # base kerb
Bm.box(-9.8, 9.8, H - 0.12, H, -12.08, -11.9, '#3a3632', 'Zy')                                  # head
Bm.emit()
bake_invisible(cube(-9.8, 9.8, 0.09, H - 0.12, -12.0, -11.99, 'glass', faces='Z', kind='Glass', uv=None))
K.blocker(0.0, H / 2, -12.0, 19.6, H, 0.2); K.obstacle(0.0, -11.95, 19.6, 0.3)
# pelmet box over the glass + roller blinds half down on some bays
bx(-9.8, 9.8, 3.05, H, -11.88, -11.55, '#ece8e0', faces='Zy')
# outside: the slab edge under the glass, the overhang above, the facade below (they frame the view)
LMW[0] = 0.25
cube(-11.0, 11.0, -0.4, 0.0, -12.9, -12.08, 'concrete', uv=1.0, faces='Yz')
cube(-11.0, 11.0, H, H + 0.4, -12.9, -12.08, 'concrete', uv=1.0, faces='yz')
LMW[0] = 1.0

# ================================================================== CEILINGS
LMW[0] = 0.5
BK = 3.05                                                                                       # DG office: perimeter bulkhead + a raised field
cube(-8.9, 8.9, H - 0.01, H, -11.55, 0.55, 'plain', '#f4f1ea', faces='y')
for (x0, x1, z0, z1) in [(-9.8, -8.9, -11.55, 1.45), (8.9, 9.8, -11.55, 1.45), (-8.9, 8.9, 0.55, 1.45)]:
    cube(x0, x1, BK - 0.01, BK, z0, z1, 'plain', '#f0ede6', faces='y')
cube(-8.9, -8.88, BK, H, -11.55, 0.55, 'plain', '#ece9e2', faces='X'); cube(8.88, 8.9, BK, H, -11.55, 0.55, 'plain', '#ece9e2', faces='x')
cube(-8.9, 8.9, BK, H, 0.53, 0.55, 'plain', '#ece9e2', faces='z')
cube(-7.0, 6.5, H - 0.01, H, 1.8, 9.8, 'ceiling_tile', uv=1 / 1.2, faces='y')                    # reception
cube(6.75, 9.8, H - 0.01, H, 1.8, 9.8, 'ceiling_tile', uv=1 / 1.2, faces='y')                   # records
cube(-0.9, 0.9, 2.7, 2.701, 1.45, 1.8, 'wood_trim', uv=1.0, faces='y')
LMW[0] = 1.0

# cove: a warm LED line on the bulkhead's inner lip lights the raised field
for (pos, size) in [((0.0, BK + 0.05, 0.3), (16.0, 0.3)), ((-8.6, BK + 0.05, -5.5), (0.3, 11.6)), ((8.6, BK + 0.05, -5.5), (0.3, 11.6))]:
    K.area(pos, size, '#ffcf98', 140, (0, 1, 0))
# recessed downlights: in the bulkhead (wall washers) and over the furniture groups
DL = [(-9.35, z) for z in (-10.6, -8.2, -5.8, -3.4, -1.0)] + [(9.35, z) for z in (-10.6, -8.2, -5.8, -3.4, -1.0)] + [(x, 1.0) for x in (-7.6, -5.2, -2.6, 2.6, 5.2, 7.6)]
for (x, z) in DL:
    bx(x - 0.09, x + 0.09, BK - 0.012, BK - 0.011, z - 0.09, z + 0.09, '#d8d4cc', faces='y')
    gbox((x, BK - 0.016, z), (0.11, 0.004, 0.11), '#fff2dc')
    K.point((x, BK - 0.08, z), '#ffd9a8', 26, 0.05)
for (x, z) in [(0.0, -7.6), (-1.6, -9.0), (1.6, -9.0), (-5.0, -4.0), (5.2, -1.6), (0.0, -3.0)]:
    bx(x - 0.1, x + 0.1, H - 0.012, H - 0.011, z - 0.1, z + 0.1, '#d8d4cc', faces='y')
    gbox((x, H - 0.016, z), (0.12, 0.004, 0.12), '#fff2dc')
    K.point((x, H - 0.1, z), '#ffd9a8', 34, 0.05)
# reception: recessed panels (warm white); records: two tubes
for (x, z) in [(-4.4, 3.9), (-4.4, 7.6), (0.0, 3.9), (0.0, 7.6), (3.9, 3.9), (3.9, 7.6)]:
    bx(x - 0.33, x + 0.33, H - 0.03, H - 0.005, z - 0.33, z + 0.33, '#e4e4e0', faces='y')
    gbox((x, H - 0.045, z), (0.58, 0.015, 0.58), '#fff3e2')
    K.area((x, H - 0.08, z), (0.58, 0.58), '#ffefdc', 75, (0, -1, 0))
for z in (3.9, 7.7):
    tube(8.3, H - 0.1, z, length=1.2, axis='z', watts=70, color='#eef6ff', light='#e6f0ff')
# wall washers along the reception walls (direct light on the paint keeps the bake clean)
for (x, z) in [(-6.55, 3.2), (-6.55, 5.4), (-6.55, 8.2), (-4.2, 9.35), (4.0, 9.35), (-4.2, 2.25), (3.2, 2.25), (6.05, 6.0)]:
    bx(x - 0.08, x + 0.08, H - 0.012, H - 0.011, z - 0.08, z + 0.08, '#d8d4cc', faces='y')
    gbox((x, H - 0.016, z), (0.1, 0.004, 0.1), '#fff2dc')
    K.point((x, H - 0.1, z), '#ffdcb0', 20, 0.05)
# bounce fill: the light the carpet and floors throw back up (lights the ceilings directly instead of through noisy bounces)
K.area((0.0, 2.35, -5.3), (19.4, 13.2), '#f2e6d6', 280, (0, 1, 0))
K.area((-0.25, 2.35, 5.8), (13.3, 7.8), '#f4ead8', 100, (0, 1, 0))
K.area((8.27, 2.35, 5.8), (2.9, 7.6), '#eef0f2', 26, (0, 1, 0))

# ================================================================== RECEPTION (z 1.8..9.8)
LMW[0] = 1.3
# the PA's desk (x -4..-2, z 4.4..5.4, top 0.79) + return on the west side; the PA sits north of it facing the door
wood(-4.02, -1.98, 0.75, 0.79, 4.38, 5.42)
wood(-4.0, -3.55, 0.0, 0.75, 4.42, 5.38, faces='xXzZ'); wood(-2.45, -2.0, 0.0, 0.75, 4.42, 5.38, faces='xXzZ')
wood(-3.55, -2.45, 0.12, 0.75, 5.33, 5.38, faces='zZ')                                                         # modesty panel
for (xa, xb) in [(-4.0, -3.55), (-2.45, -2.0)]:
    for k in range(3): bx(xa + 0.05, xb - 0.05, 0.12 + k * 0.2, 0.3 + k * 0.2, 4.415, 4.42, '#3a2014', faces='z')
    for k in range(3): K.box(((xa + xb) / 2, 0.24 + k * 0.2, 4.405), (0.12, 0.015, 0.015), 'brass', uv=1.0)
wood(-4.62, -4.02, 0.71, 0.74, 3.2, 4.42); wood(-4.6, -4.06, 0.0, 0.71, 3.22, 3.3, faces='xXzZ'); wood(-4.6, -4.06, 0.0, 0.71, 4.3, 4.4, faces='xXzZ')
K.obstacle(-3.0, 4.9, 2.1, 1.1); K.obstacle(-4.32, 3.8, 0.65, 1.25)
# on the desk: monitor (faces the PA), keyboard, the docket (anchor kuti_desk), intercom, tidy in-tray, phone, pens
K.box((-3.55, 0.79, 5.05), (0.2, 0.015, 0.15), 'plain', '#1a1a1c'); beam((-3.55, 0.8, 5.07), (-3.55, 1.0, 5.07), 0.035, 'plain', '#1a1a1c', sides=4)
K.box((-3.55, 0.92, 5.05), (0.58, 0.36, 0.035), 'plain', '#141416')
bake_invisible(K.quad((-3.55, 0.945, 5.031), 0.54, 0.31, 'ab_screen', rot=PI, kind='Screens', uvrect=atlas(512, 0, 768, 144, W=1024, H=512)))
K.box((-3.5, 0.79, 4.7), (0.44, 0.02, 0.15), 'plain', '#2a2a2c'); K.box((-3.12, 0.79, 4.72), (0.06, 0.02, 0.1), 'plain', '#2a2a2c')
K.box((-3.0, 0.79, 4.6), (0.33, 0.022, 0.25), 'plain', '#c8a868')                                  # the docket (buff folder)
flatq(-3.15, -2.85, 4.49, 4.71, 0.82, 'ab_signs', uvrect=atlas(0, 640, 128, 736))
K.box((-2.45, 0.79, 4.62), (0.2, 0.06, 0.15), 'plain', '#2a2a2c')
gbox((-2.38, 0.85, 4.66), (0.02, 0.006, 0.02), '#40ff70', kind='GlowsCool')
for k in range(2):                                                                                            # in-tray, two tiers
    K.box((-2.35, 0.79 + k * 0.1, 5.05), (0.36, 0.015, 0.28), 'plain', '#2a2a2c')
    K.box((-2.35, 0.805 + k * 0.1, 5.05), (0.3, 0.012 + 0.012 * (1 - k), 0.22), 'plain', '#efebe2')
for (dx, dz) in [(-0.17, -0.13), (0.17, -0.13), (-0.17, 0.13), (0.17, 0.13)]: beam((-2.35 + dx, 0.79, 5.05 + dz), (-2.35 + dx, 0.9, 5.05 + dz), 0.012, 'plain', '#2a2a2c', sides=3)
K.cyl((-2.75, 0.79, 5.2), 0.04, 0.11, 'plain', '#2a2a2c', seg=8)
K.box((-4.3, 0.74, 4.1), (0.22, 0.07, 0.2), 'plain', '#1e1e20')                                              # phone + printer on the return
K.box((-4.32, 0.74, 3.55), (0.46, 0.26, 0.42), 'plain', '#d8d8d4'); K.box((-4.32, 1.0, 3.55), (0.36, 0.015, 0.3), 'plain', '#efebe2')
def exec_chair(x, z, rot, col='#1e1e20', back=0.75, seat=0.46):
    T = T_(x, z, rot)
    K.box(T(0, seat - 0.04, 0), (0.54, 0.1, 0.52), 'plain', col, rot=rot)
    K.box(T(0, seat + 0.04, -0.24), (0.52, back, 0.09), 'plain', col, rot=rot)
    K.box(T(0, seat + back - 0.02, -0.25), (0.48, 0.08, 0.1), 'plain', shade(col, 1.15), rot=rot)
    for sd in (-1, 1): K.box(T(sd * 0.29, seat + 0.08, 0.02), (0.05, 0.18, 0.38), 'plain', '#2a2a2a', rot=rot)
    beam(T(0, 0.08, 0), T(0, seat - 0.04, 0), 0.06, 'plain', '#2a2a2a', sides=4)
    for k in range(5):
        a = 2 * PI * k / 5
        beam(T(0, 0.08, 0), T(math.cos(a) * 0.32, 0.03, math.sin(a) * 0.32), 0.045, 'plain', '#2a2a2a', sides=3)
    K._collide((x, 0, z), (0.6, 1, 0.6), 0, True, False)
exec_chair(-3.0, 3.75, 0.0, col='#2a2a2e', back=0.62)
# Kuti's nameplate (faces the visitors) and a small vase
K.box((-2.75, 0.79, 5.3), (0.3, 0.07, 0.04), 'plain', '#2a2a2a', rot=0.0); sign(-2.75, 0.8, 5.332, 0.28, 0.055, 0.0, (256, 640, 512, 688))
K.cyl((-3.85, 0.79, 5.25), 0.045, 0.16, 'plain', '#e8e4dc', seg=8); K.sphere((-3.85, 1.0, 5.25), 0.07, 'plain', '#c8304a', seg=6, sy=0.8)

def sofa(x, z, rot, L=2.1, D=0.88, col='#2c2826', n=3, seat=0.42, back=0.88, arm=0.62, legs='#1a1a1a', collide=True):
    """an upholstered sofa; rot = the way the sitters face"""
    T = T_(x, z, rot); cush = shade(col, 1.08)
    K.box(T(0, 0.06, 0), (L, 0.24, D), 'plain', shade(col, 0.85), rot=rot)
    for k in range(n):
        cw = (L - 0.36) / n; lx = -L / 2 + 0.18 + cw * (k + 0.5)
        K.box(T(lx, 0.3, 0.03), (cw - 0.02, seat - 0.3, D - 0.24), 'plain', cush, rot=rot)
        K.box(T(lx, seat, -D / 2 + 0.2), (cw - 0.04, back - seat - 0.04, 0.2), 'plain', cush, rot=rot)
    K.box(T(0, 0.3, -D / 2 + 0.08), (L, back - 0.3, 0.16), 'plain', col, rot=rot)
    for sd in (-1, 1): K.box(T(sd * (L / 2 - 0.09), 0.3, 0.0), (0.18, arm - 0.3, D), 'plain', col, rot=rot)
    for sx in (-1, 1):
        for sz in (-1, 1): K.box(T(sx * (L / 2 - 0.08), 0.0, sz * (D / 2 - 0.08)), (0.05, 0.06, 0.05), 'plain', legs, rot=rot)
    if collide: K._collide((x, 0, z), (L, 1, D), rot, True, False)

sofa(5.95, 3.6, -PI / 2, L=2.2, col='#2a2624'); sofa(5.95, 8.45, -PI / 2, L=2.2, col='#2a2624')
for zc in (3.6, 8.45):                                                                                          # low tables + magazines
    wood(4.6, 5.2, 0.38, 0.42, zc - 0.55, zc + 0.55); bx(4.66, 5.14, 0.0, 0.38, zc - 0.48, zc + 0.48, '#2a1a10', faces='xXzZ')
    K._collide((4.9, 0, zc), (0.65, 1, 1.15), 0, True, False)
    for k in range(3): K.box((4.85 + RG.uniform(-0.06, 0.06), 0.42 + k * 0.008, zc - 0.2 + k * 0.17), (0.24, 0.007, 0.3), 'plain', RG.choice(['#c83a2a', '#2a5aa8', '#e8e4d8', '#1f8a3e']), rot=RG.uniform(-0.3, 0.3))
# west wall: TV (news), two paintings, the PROTOCOL door (closed); water dispenser; plants; coat stand
K.box((-6.96, 1.25, 4.1), (0.06, 0.72, 1.24), 'plain', '#141416')
bake_invisible(K.quad((-6.925, 1.28, 4.1), 1.18, 0.66, 'ab_screen', rot=PI / 2, kind='Screens', uvrect=atlas(0, 0, 512, 288, W=1024, H=512)))
K.point((-6.6, 1.6, 4.1), '#a8c4ff', 6, 0.3)
def frame(x, y, z, w, h, rot, cell, fcol='#3a2414', depth=0.03, mat='ab_signs', W=1024, H=1024, border=0.05):
    """a picture in a moulded frame: (x, z) is the point on the wall face, rot the facing. Four bars + the picture recessed
    between them (nothing coplanar behind the picture, so it never z-fights at range)"""
    T = T_(x, z, rot); b = border
    for (lx, ly, bw, bh) in [(0.0, y + h, w + 2 * b, b), (0.0, y - b, w + 2 * b, b), (-(w + b) / 2, y, b, h), ((w + b) / 2, y, b, h)]:
        K.box(T(lx, ly, depth / 2), (bw, bh, depth), 'plain', fcol, rot=rot)
    p = T(0.0, y, depth * 0.6); sign(p[0], y, p[2], w, h, rot, cell, mat=mat, W=W, H=H)
frame(-7.0, 1.35, 8.55, 1.1, 0.75, PI / 2, (0, 768, 256, 940))
frame(-7.0, 1.45, 2.65, 0.62, 0.8, PI / 2, (256, 768, 400, 960))
wood(-7.0, -6.95, 0.0, 2.15, 6.25, 7.25, faces='X')                                                             # PROTOCOL door
architrave('z', -7.0, 6.25, 7.25, 2.15, t=0.025)
K.box((-6.93, 1.0, 7.1), (0.04, 0.03, 0.14), 'brass', uv=1.0)
sign(-6.94, 1.55, 6.75, 0.36, 0.1, PI / 2, (512, 640, 768, 704))
K.box((-6.65, 0.0, 2.25), (0.34, 1.0, 0.34), 'plain', '#ecece8'); K.cyl((-6.65, 1.0, 2.25), 0.14, 0.38, 'plain', '#8ab8e0', seg=10)   # water dispenser
K.box((-6.48, 0.72, 2.25), (0.02, 0.06, 0.12), 'plain', '#2a6ac8'); K.obstacle(-6.65, 2.25, 0.45, 0.45)
def plant(x, z, s=1.0, pot='#d8d0c4'):
    """a potted ficus: tapered pot, a forked trunk, a crown of leafy blobs"""
    B = Batch(); B.prism(x, 0.0, z, 0.19 * s, 0.44 * s, pot, n=10, r2=0.24 * s); B.prism(x, 0.42 * s, z, 0.22 * s, 0.02, '#3a2a1c', n=10)
    B.tube((x, 0.4 * s, z), (x + 0.05 * s, 1.0 * s, z - 0.03 * s), 0.025 * s, '#6a5238', n=4, caps=False)
    B.tube((x + 0.03 * s, 0.8 * s, z), (x - 0.12 * s, 1.25 * s, z + 0.06 * s), 0.018 * s, '#6a5238', n=4, caps=False)
    B.emit()
    for k in range(7):
        a = k * 2.4 + RG.random(); rr_ = (0.08 + 0.12 * RG.random()) * s
        ob = K.sphere((x + math.cos(a) * rr_, (1.05 + 0.32 * RG.random()) * s, z + math.sin(a) * rr_), (0.17 + 0.07 * RG.random()) * s, 'plain', RG.choice(['#2c5a28', '#346a2e', '#3c7434', '#2a5226']), seg=6, sy=0.8)
        ob['lm'] = 'auto'
    K._collide((x, 0, z), (0.55 * s, 1, 0.55 * s), 0, True, False)
plant(-6.55, 9.3, 1.1); plant(6.05, 2.25, 0.8); plant(6.05, 9.55 - 0.05, 0.75); plant(-1.5, 2.25, 0.95); plant(1.5, 2.25, 0.95)
frame(3.8, 1.3, 1.8, 1.5, 1.0, 0.0, (768, 180, 1024, 360), fcol='#b8902a', border=0.05)                                    # a landscape over a console
wood(3.0, 4.6, 0.8, 0.84, 1.82, 2.22); bx(3.05, 4.55, 0.0, 0.8, 1.84, 2.2, '#2a160c', faces='xXzZ'); K.obstacle(3.8, 2.02, 1.65, 0.45)
K.cyl((3.45, 0.84, 2.02), 0.08, 0.3, 'plain', '#e8e2d6', seg=8, r2=0.06)
B = Batch()
for k in range(7):
    a = k * 0.9; B.prism(3.45 + math.cos(a) * 0.07, 1.13 + (k % 3) * 0.04, 2.02 + math.sin(a) * 0.07, 0.06, 0.07, ['#f0e8e0', '#d84a6a', '#f0c040'][k % 3], n=5, r2=0.02)
B.emit()
K.box((4.2, 0.84, 2.02), (0.36, 0.04, 0.26), 'plain', '#b8902a')
# south wall: a trophy cabinet; west wall: an upholstered bench
wood(2.5, 4.6, 0.0, 0.85, 9.38, 9.8); wood(2.5, 4.6, 1.95, 2.0, 9.38, 9.8, faces='xXYzZy')
for xx in (2.5, 4.55): wood(xx, xx + 0.05, 0.85, 1.95, 9.38, 9.8, faces='xXz')
bx(2.55, 4.55, 0.85, 1.95, 9.77, 9.8, '#3a2214', faces='z')
for k in range(2): wood(2.55, 4.55, 1.2 + k * 0.38, 1.22 + k * 0.38, 9.4, 9.78, faces='Yyz')
for k in range(4): bx(2.6 + k * 0.5, 3.0 + k * 0.5, 0.08, 0.78, 9.375, 9.38, '#2e180c', faces='z')
for (tx, ty, kind) in [(2.85, 0.85, 'cup'), (3.4, 0.85, 'plaque'), (4.1, 0.85, 'cup'), (3.0, 1.22, 'plaque'), (3.7, 1.22, 'cup'), (4.25, 1.22, 'plaque'), (3.2, 1.6, 'cup'), (3.95, 1.6, 'cup')]:
    if kind == 'cup':
        B = Batch(); B.prism(tx, ty, 9.58, 0.06, 0.04, '#2a1a10', n=8); B.prism(tx, ty + 0.04, 9.58, 0.018, 0.12, '#c8a040', n=6); B.prism(tx, ty + 0.16, 9.58, 0.04, 0.12, '#d8b450', n=8, r2=0.07); B.emit()
    else:
        K.box((tx, ty, 9.62), (0.24, 0.3, 0.025), 'plain', '#3a2214', rot=0.0); K.box((tx, ty + 0.05, 9.605), (0.18, 0.2, 0.005), 'plain', '#c8a040')
K.obstacle(3.55, 9.6, 2.15, 0.5)
B = Batch(); B.box(-6.98, -6.48, 0.12, 0.46, 7.55, 8.95, '#5a2218', 'xXYzZ'); B.box(-6.98, -6.78, 0.46, 0.9, 7.55, 8.95, '#4e1e16', 'xXYzZ')
for (lx, lz) in [(-6.55, 7.6), (-6.55, 8.9), (-6.9, 7.6), (-6.9, 8.9)]: B.box(lx - 0.025, lx + 0.025, 0.0, 0.12, lz - 0.025, lz + 0.025, '#1a1a1a', 'xXzZ')
B.emit(); K.obstacle(-6.73, 8.25, 0.55, 1.45)
B = Batch(); B.prism(-1.7, 0.0, 9.45, 0.2, 0.03, '#2a2a2a', n=8); B.tube((-1.7, 0.0, 9.45), (-1.7, 1.75, 9.45), 0.02, '#2a2a2a', n=5, caps=False)
for k in range(4):
    a = k * PI / 2; B.tube((-1.7, 1.6, 9.45), (-1.7 + math.cos(a) * 0.18, 1.72, 9.45 + math.sin(a) * 0.18), 0.012, '#2a2a2a', n=3, caps=False)
B.emit(); K._collide((-1.7, 0, 9.45), (0.3, 1, 0.3), 0, True, False)
# north (partition) face: the agency crest plaque, the clock; the DG's brass door plaque over the double door
K.box((-3.0, 1.55, 1.83), (1.3, 0.8, 0.04), 'plain', '#2a1a10')
quadv(-3.0, 1.6, 1.866, 1.2, 0.7, 0.0, 'crest')
sign(-5.6, 2.45, 1.815, 0.36, 0.36, 0.0, (768, 896, 896, 1024))
K.box((0.0, 2.88, 1.83), (1.3, 0.24, 0.03), 'brass', uv=1.0); sign(0.0, 2.9, 1.862, 1.24, 0.2, 0.0, (0, 576, 512, 640))
# east wall (records partition): the RECORDS plaque by the door, a framed photo, fire extinguisher, light switch plates
sign(6.48, 1.55, 4.95, 0.42, 0.12, -PI / 2, (512, 704, 768, 768))
frame(6.5, 1.45, 3.6, 0.9, 0.6, -PI / 2, (400, 768, 600, 900))
frame(6.5, 1.45, 8.45, 0.9, 0.6, -PI / 2, (600, 768, 800, 900))
B = Batch(); B.prism(6.35, 0.15, 7.15, 0.09, 0.5, '#c0201a', n=7); B.box(6.32, 6.38, 0.65, 0.72, 7.1, 7.2, '#1a1a1a'); B.box(6.48, 6.5, 0.1, 0.62, 7.05, 7.25, '#c0201a', 'x'); B.emit()
# south wall: the corridor double door (closed), EXIT sign, switch plates
for (x0, x1) in [(-0.85, -0.01), (0.01, 0.85)]: wood(x0, x1, 0.0, 2.3, 9.76, 9.8, faces='z')
architrave('x', 9.8, -0.85, 0.85, 2.3, w=0.1, t=-0.025)
for x in (-0.12, 0.12): K.box((x, 1.0, 9.74), (0.035, 0.03, 0.03), 'brass', uv=1.0); beam((x, 0.85, 9.73), (x, 1.15, 9.73), 0.025, 'brass', sides=4)
K.box((0.0, 2.55, 9.76), (0.42, 0.16, 0.04), 'plain', '#e8e8e4'); gquad(0.0, 2.565, 9.735, 0.36, 0.12, PI, '#30d070', kind='GlowsCool')
for (x, z, rot) in [(-1.2, 9.79, PI), (1.2, 9.79, PI)]: K.box((x, 1.2, z), (0.08, 0.12, 0.012), 'plain', '#ece8e0')
LMW[0] = 1.0

# ================================================================== RECORDS ROOM (x 6.75..9.8, z 1.8..9.8)
LMW[0] = 1.1
def shelves(x0, x1, z0, z1, h=2.2, rows=5, faces=('x',), seed=0):
    """grey steel shelving; `faces` = the open side(s) ('x' / 'X'); box files (ab_files) on every shelf"""
    r = random.Random(seed); B = Batch()
    for (xa, xb) in [(x0, x0 + 0.03), (x1 - 0.03, x1)]:
        for (za, zb) in [(z0, z0 + 0.03), (z1 - 0.03, z1)]: B.box(xa, xb, 0.0, h, za, zb, '#6e7278', 'xXzZ')
    for k in range(rows + 1):
        y = 0.08 + k * (h - 0.12) / rows
        B.box(x0, x1, y, y + 0.025, z0, z1, '#8a8e94', 'Yy' + ''.join(faces))
    B.emit()
    for k in range(rows):
        y = 0.105 + k * (h - 0.12) / rows; hh = (h - 0.12) / rows - 0.06
        for f in faces:
            xf = x0 + 0.015 if f == 'x' else x1 - 0.015
            u0 = r.random() * 0.5
            quadv(xf, y, (z0 + z1) / 2, z1 - z0 - 0.08, hh, -PI / 2 if f == 'x' else PI / 2, 'ab_files', uvrect=(u0, 0, u0 + (z1 - z0) / 3.0, 1))
    K.obstacle((x0 + x1) / 2, (z0 + z1) / 2, x1 - x0 + 0.05, z1 - z0 + 0.05)
shelves(9.35, 9.8, 2.0, 9.6, faces=('x',), seed=1)
shelves(7.95, 8.55, 2.0, 4.8, faces=('x', 'X'), seed=2)
shelves(7.95, 8.55, 7.2, 9.6, faces=('x', 'X'), seed=3)
wood(6.8, 7.6, 0.72, 0.75, 2.0, 2.9, mat='wood_trim'); bx(6.82, 7.58, 0.0, 0.72, 2.02, 2.06, '#3a2a1c', faces='Z')
K.obstacle(7.2, 2.45, 0.85, 0.95)
chair(7.2, 3.3, PI, '#3a3a3e')
for k in range(4): K.box((7.15 + RG.uniform(-0.05, 0.05), 0.75 + k * 0.03, 2.45), (0.34, 0.03, 0.26), 'plain', RG.choice(['#c8a868', '#d8c890', '#2a5aa8']), rot=RG.uniform(-0.2, 0.2))
K.box((7.45, 0.0, 9.3), (0.5, 0.36, 0.4), 'plain', '#b89870', rot=0.2); K.box((7.4, 0.36, 9.3), (0.46, 0.3, 0.38), 'plain', '#a88860', rot=-0.1)   # cartons
K._collide((7.45, 0, 9.3), (0.6, 1, 0.55), 0, True, False)
for k in range(5): K.box((8.95 + RG.uniform(-0.05, 0.05), k * 0.08, 6.0 + RG.uniform(-0.05, 0.05)), (0.3, 0.08, 0.38), 'plain', RG.choice(['#c8a868', '#d8c890', '#7a5a3a']), rot=RG.uniform(-0.3, 0.3))
# the records door leaf (open into the room, hinged at the north jamb)
wood(6.77, 7.68, 0.0, 2.18, 5.42, 5.47, mat='wood_trim')
K.box((7.55, 1.0, 5.5), (0.12, 0.03, 0.04), 'brass', uv=1.0)
K._collide((7.22, 0, 5.45), (0.95, 1, 0.12), 0, True, False)
LMW[0] = 1.0

# ================================================================== THE DG'S OFFICE (z -12..1.45)
LMW[0] = 1.3
# the desk: x -1.3..1.3, z -8.55..-7.45, top 0.80; pedestals; front modesty panel with a raised frame
wood(-1.32, 1.32, 0.75, 0.8, -8.58, -7.42)
for (xa, xb) in [(-1.27, -0.78), (0.78, 1.27)]:
    wood(xa, xb, 0.0, 0.75, -8.52, -7.5, faces='xXzZ')
    for k in range(3): bx(xa + 0.04, xb - 0.04, 0.1 + k * 0.21, 0.28 + k * 0.21, -8.525, -8.52, '#2a160c', faces='z')
    for k in range(3): K.box(((xa + xb) / 2, 0.2 + k * 0.21, -8.535), (0.14, 0.015, 0.015), 'brass', uv=1.0)
wood(-0.78, 0.78, 0.1, 0.75, -7.52, -7.46, faces='zZ')
bx(-0.7, 0.7, 0.18, 0.68, -7.455, -7.45, '#3a1e10', faces='Z')
cube(-0.45, 0.45, 0.8, 0.81, -8.35, -7.75, 'plain', '#2a1a12', faces='xXYzZ')                                 # leather blotter
K.obstacle(0.0, -8.0, 2.7, 1.2)
# on the desk
K.box((0.78, 0.8, -8.25), (0.22, 0.015, 0.16), 'plain', '#1a1a1c'); beam((0.78, 0.81, -8.27), (0.78, 1.02, -8.27), 0.035, 'plain', '#1a1a1c', sides=4)
K.box((0.78, 0.94, -8.25), (0.62, 0.38, 0.035), 'plain', '#141416', rot=0.25)
bake_invisible(K.quad((0.78 - 0.005, 0.965, -8.27), 0.58, 0.33, 'ab_screen', rot=PI + 0.25, kind='Screens', uvrect=atlas(768, 0, 1024, 144, W=1024, H=512)))
K.box((0.0, 0.803, -8.15), (0.42, 0.015, 0.14), 'plain', '#2a2a2c')
K.box((-0.55, 0.8, -8.05), (0.34, 0.02, 0.24), 'plain', '#2a2a30', rot=-0.15)                              # closed laptop
for k in range(4): K.box((-0.95 + RG.uniform(-0.02, 0.02), 0.8 + k * 0.025, -7.85), (0.33, 0.025, 0.25), 'plain', ['#c8a868', '#d8c890', '#a8282a', '#c8a868'][k], rot=RG.uniform(-0.1, 0.1))   # dockets
K.box((-0.95, 0.9, -7.85), (0.31, 0.003, 0.23), 'plain', '#efe8d6')
K.box((-1.05, 0.8, -8.3), (0.2, 0.07, 0.2), 'plain', '#1e1e20'); K.box((1.12, 0.8, -8.32), (0.2, 0.07, 0.2), 'plain', '#7a1a1a')  # two phones
K.box((0.0, 0.8, -7.56), (0.42, 0.09, 0.05), 'plain', '#2a1a10'); sign(0.0, 0.808, -7.524, 0.4, 0.075, 0.0, (512, 576, 1024, 640))  # nameplate
K.box((0.45, 0.8, -7.62), (0.22, 0.02, 0.08), 'plain', '#2a1a10'); K.cyl((0.4, 0.82, -7.62), 0.012, 0.13, 'plain', '#c8a040', seg=5)   # pen set
K.cyl((-1.05, 0.8, -7.65), 0.05, 0.015, 'plain', '#c8a040', seg=8); beam((-1.05, 0.81, -7.65), (-1.05, 1.12, -7.65), 0.008, 'plain', '#c8a040', sides=3)   # desk flags
for (dx, cell) in [(-0.07, (0, 0, 512, 341)), (0.07, (512, 0, 1024, 341))]:
    beam((-1.05 + dx * 0.3, 1.12, -7.65), (-1.05 + dx * 1.6, 0.98, -7.65), 0.006, 'plain', '#c8a040', sides=3)
    sign(-1.05 + dx * 1.7 + (0.08 if dx > 0 else -0.08), 0.95, -7.649, 0.16, 0.11, 0.0, cell, mat='ab_flags', W=1024, H=512)
# the banker's lamp (green shade)
K.box((1.1, 0.8, -7.85), (0.16, 0.02, 0.1), 'plain', '#b8902a'); beam((1.1, 0.82, -7.85), (1.1, 1.08, -7.85), 0.018, 'plain', '#b8902a', sides=4)
K.cyl((1.1, 1.1, -7.85), 0.08, 0.32, 'plain', '#1f5a34', seg=8, axis='x', r2=0.05)
gbox((1.1, 1.065, -7.85), (0.24, 0.02, 0.08), '#ffe2a8')
K.point((1.1, 1.0, -7.85), '#ffd29a', 14, 0.04)
# the DG's chair (high back, leather), two visitor chairs (anchor dg_chair_front)
def exec_hi(x, z, rot):
    T = T_(x, z, rot)
    K.box(T(0, 0.4, 0), (0.62, 0.14, 0.6), 'plain', '#3a1c14', rot=rot)
    K.box(T(0, 0.48, -0.27), (0.6, 0.86, 0.12), 'plain', '#341a12', rot=rot)
    K.box(T(0, 1.3, -0.28), (0.54, 0.18, 0.13), 'plain', '#3e2016', rot=rot)
    for sd in (-1, 1): K.box(T(sd * 0.33, 0.5, 0.02), (0.08, 0.2, 0.46), 'plain', '#2e160e', rot=rot)
    beam(T(0, 0.08, 0), T(0, 0.4, 0), 0.07, 'plain', '#2a2a2a', sides=4)
    for k in range(5):
        a = 2 * PI * k / 5; beam(T(0, 0.08, 0), T(math.cos(a) * 0.34, 0.03, math.sin(a) * 0.34), 0.05, 'plain', '#b8902a', sides=3)
    K._collide((x, 0, z), (0.65, 1, 0.65), 0, True, False)
exec_hi(0.0, -9.1, 0.0)
def club_chair(x, z, rot, col='#5a2218', seat=0.44, collide=True):
    T = T_(x, z, rot)
    K.box(T(0, 0.08, 0), (0.62, seat - 0.08, 0.6), 'plain', col, rot=rot)
    K.box(T(0, seat - 0.02, -0.24), (0.62, 0.5, 0.12), 'plain', shade(col, 0.92), rot=rot)
    for sd in (-1, 1): K.box(T(sd * 0.28, seat - 0.02, 0.0), (0.06, 0.2, 0.6), 'wood_dark', rot=rot, uv=1.0)
    for sx in (-1, 1):
        for sz in (-1, 1): K.box(T(sx * 0.26, 0.0, sz * 0.25), (0.05, 0.08, 0.05), 'wood_dark', rot=rot, uv=1.0)
    if collide: K._collide((x, 0, z), (0.62, 1, 0.62), rot, True, False)
club_chair(0.0, -6.4, PI, collide=False); club_chair(1.25, -6.55, PI - 0.18)
# the two flags behind the desk: Nigeria (west) and NACECA (east), weighted brass stands
def flag(px, pz, cell, fly):
    """a parade flag on a pole; the cloth hangs from the pole in folds toward the fly direction (unit (dx, dz))"""
    B = Batch(); B.prism(px, 0.0, pz, 0.2, 0.05, '#b8902a', n=10, r2=0.17); B.prism(px, 0.05, pz, 0.06, 0.12, '#b8902a', n=8, r2=0.03)
    B.prism(px, 0.0, pz, 0.018, 2.72, '#c8a040', n=6, top=False); B.prism(px, 2.72, pz, 0.035, 0.05, '#c8a040', n=8)
    B.prism(px, 2.77, pz, 0.045, 0.16, '#d8b050', n=6, r2=0.0)
    B.emit()
    dx, dz = fly; nx, nz = -dz, dx; nu, nv = 6, 2
    u0, v0, u1, v1 = atlas(*cell, W=1024, H=512)
    verts, faces, uvs = [], [], []
    for i in range(nu + 1):
        t = i / nu; out = 0.05 + t * 0.95
        ytop, ybot = 2.62 - 0.85 * t ** 1.6, 1.42 - 0.3 * t
        fold = 0.07 * math.sin(t * PI * 3.0) * min(1.0, t * 4)
        for j in range(nv + 1):
            s = j / nv; y = ytop + (ybot - ytop) * s
            verts.append((px + dx * out + nx * fold, y, pz + dz * out + nz * fold)); uvs.append((u0 + (u1 - u0) * t, v1 + (v0 - v1) * s))
    for i in range(nu):
        for j in range(nv):
            a, b, c_, d = i * (nv + 1) + j, (i + 1) * (nv + 1) + j, (i + 1) * (nv + 1) + j + 1, i * (nv + 1) + j + 1
            faces.append((a, b, c_, d))
    for side in (0, 1):
        bm = bmesh.new(); uvl = bm.loops.layers.uv.new('UVMap')
        vs = [bm.verts.new(G(*p)) for p in verts]
        for f in faces:
            ff = bm.faces.new([vs[k] for k in (f if side == 0 else tuple(reversed(f)))])
            for l in ff.loops: l[uvl].uv = uvs[vs.index(l.vert)]
        bm.normal_update()
        ob = K._finish(bm, 'ab_flags', None, None, (0, 0, 0), 0.0, 'static', None)
        ob['lm'] = 'auto'
    # gold fringe along the bottom edge
    Bf = Batch()
    for i in range(nu):
        a_, b_ = verts[i * (nv + 1) + nv], verts[(i + 1) * (nv + 1) + nv]
        Bf.tube((a_[0], a_[1] - 0.015, a_[2]), (b_[0], b_[1] - 0.015, b_[2]), 0.018, '#c8a040', n=3, caps=False)
    Bf.emit()
    K._collide((px, 0, pz), (0.45, 1, 0.45), 0, True, False)
c30, s30 = math.cos(math.radians(32)), math.sin(math.radians(32))
flag(-1.75, -10.6, (0, 0, 512, 341), (-c30, s30))
flag(1.75, -10.6, (512, 0, 1024, 341), (c30, s30))
# behind the DG: a low console with the agency crest above it (on the bulkhead the glass meets)
wood(-1.2, 1.2, 0.0, 0.62, -11.5, -11.05); K.obstacle(0.0, -11.27, 2.5, 0.5)
for x in (-0.8, 0.8): K.cyl((x, 0.62, -11.27), 0.07, 0.3, 'plain', '#d8d0c0', seg=8, r2=0.05)
K.box((0.0, 0.62, -11.27), (0.36, 0.25, 0.04), 'plain', '#b8902a'); sign(0.0, 0.645, -11.238, 0.3, 0.19, 0.0, (800, 768, 1024, 892))

# ---- east: credenza + the photo wall + the safe
wood(9.22, 9.8, 0.0, 0.76, -10.6, -7.0, faces='xYzZ')
for k in range(4):
    z0 = -10.6 + k * 0.9
    bx(9.215, 9.22, 0.08, 0.7, z0 + 0.03, z0 + 0.87, '#2e180c', faces='x')
    K.box((9.2, 0.62, z0 + 0.45), (0.02, 0.02, 0.16), 'brass', uv=1.0)
K.obstacle(9.5, -8.8, 0.65, 3.65)
for (z, w, h, cell) in [(-10.1, 0.36, 0.28, (400, 900, 528, 1000)), (-9.3, 0.3, 0.38, (528, 900, 624, 1024)), (-7.6, 0.4, 0.3, (624, 900, 768, 1010))]:   # standing photo frames
    K.box((9.55, 0.76, z), (0.05, h + 0.04, w + 0.04), 'plain', '#b8902a'); sign(9.513, 0.78, z, w, h, -PI / 2, cell)
K.cyl((9.5, 0.76, -8.5), 0.09, 0.32, 'plain', '#1e3a5a', seg=10, r2=0.06)
B = Batch()
for k in range(5): B.prism(9.5 + RG.uniform(-0.04, 0.04), 1.05, -8.5 + RG.uniform(-0.04, 0.04), 0.012, 0.25, '#4a6a2a', n=3, r2=0.004)
B.emit()
PH = [(-10.2, 1.95, 0.7, 0.5, (0, 0, 256, 180)), (-9.25, 2.05, 0.9, 0.62, (256, 0, 512, 180)), (-8.2, 1.95, 0.7, 0.5, (512, 0, 768, 180)), (-7.3, 2.0, 0.7, 0.5, (768, 0, 1024, 180)),
      (-9.75, 1.3, 0.62, 0.44, (0, 180, 256, 360)), (-8.7, 1.32, 0.7, 0.48, (256, 180, 512, 360)), (-7.75, 1.3, 0.62, 0.44, (512, 180, 768, 360))]
for (z, y, w, h, cell) in PH:
    frame(9.8, y, z, w, h, -PI / 2, cell, fcol='#b8902a', border=0.035)
frame(9.8, 1.2, -3.2, 1.4, 0.9, -PI / 2, (768, 180, 1024, 360), fcol='#3a2414')                     # a landscape
SFX0, SFX1, SFZ0, SFZ1 = 9.15, 9.75, -6.35, -5.65                                                          # the safe (front faces west)
bx(SFX0, SFX1, 0.0, 0.08, SFZ0, SFZ1, '#1a1a1c', faces='xXzZY')
bx(SFX0, SFX1, 0.08, 1.06, SFZ0, SFZ1, '#2e3034', faces='xYzZ')
bx(SFX0 - 0.012, SFX0, 0.14, 1.0, SFZ0 + 0.05, SFZ1 - 0.05, '#373a3f', faces='xYyzZ')
K.cyl((SFX0 - 0.03, 0.72, -6.0), 0.075, 0.02, 'plain', '#c8c0a0', seg=12, axis='x'); K.cyl((SFX0 - 0.045, 0.72, -6.0), 0.035, 0.02, 'plain', '#2a2a2a', seg=8, axis='x')
B = Batch(); B.tube((SFX0 - 0.02, 0.45, -6.12), (SFX0 - 0.09, 0.45, -6.12), 0.012, '#c8c0a0', n=4)
for k in range(3):
    a = k * 2 * PI / 3; B.tube((SFX0 - 0.09, 0.45, -6.12), (SFX0 - 0.09, 0.45 + math.cos(a) * 0.1, -6.12 + math.sin(a) * 0.1), 0.01, '#c8c0a0', n=3)
B.box(SFX0 - 0.014, SFX0 - 0.012, 0.9, 0.96, -5.82, -5.72, '#c8c0a0', 'x'); B.emit()
K.obstacle(9.45, -6.0, 0.7, 0.8)
# ---- west: bookshelves (five units, x -9.8..-9.4, z -10.9..-1.4)
def bookcase(z0, z1, seed):
    r = random.Random(seed)
    wood(-9.8, -9.38, 0.0, 2.45, z0, z0 + 0.04, faces='XzZ'); wood(-9.8, -9.38, 0.0, 2.45, z1 - 0.04, z1, faces='XzZ')
    wood(-9.82, -9.36, 2.45, 2.55, z0 - 0.02, z1 + 0.02, faces='XYzZy')
    wood(-9.8, -9.4, 0.0, 0.8, z0 + 0.04, z1 - 0.04, faces='XY')
    bx(-9.4, -9.398, 0.08, 0.74, z0 + 0.06, (z0 + z1) / 2 - 0.01, '#2e180c', faces='X'); bx(-9.4, -9.398, 0.08, 0.74, (z0 + z1) / 2 + 0.01, z1 - 0.06, '#2e180c', faces='X')
    for zz in ((z0 + z1) / 2 - 0.06, (z0 + z1) / 2 + 0.06): K.box((-9.385, 0.6, zz), (0.02, 0.1, 0.015), 'brass', uv=1.0)
    for k in range(4):
        y = 0.8 + k * 0.41
        wood(-9.8, -9.4, y + 0.38, y + 0.41, z0 + 0.04, z1 - 0.04, faces='XYy')
        if r.random() < 0.22:                                           # a display cell: a vase or a trophy
            zc = z0 + 0.3 + r.random() * (z1 - z0 - 0.6)
            K.cyl((-9.6, y, zc), 0.07, 0.24, 'plain', r.choice(['#b8902a', '#d8d0c0', '#1e3a5a']), seg=8, r2=0.05)
            u0 = r.random() * 0.5; L = (zc - 0.15) - (z0 + 0.06)
            if L > 0.2: quadv(-9.45, y + 0.005, (z0 + 0.06 + zc - 0.15) / 2, L, 0.33, PI / 2, 'books', uvrect=(u0, 0, u0 + L / 2.2, 1))
        else:
            u0 = r.random() * 0.5
            quadv(-9.45, y + 0.005, (z0 + z1) / 2, z1 - z0 - 0.1, 0.34, PI / 2, 'books', uvrect=(u0, 0, u0 + (z1 - z0) / 2.2, 1))
    K.obstacle(-9.6, (z0 + z1) / 2, 0.5, z1 - z0)
for i in range(5): bookcase(-10.9 + i * 1.9, -10.9 + (i + 1) * 1.9, 70 + i)
plant(-9.25, -11.45, 1.15); plant(9.25, -11.45, 1.15); plant(-9.2, 0.85, 1.0); plant(9.25, 0.85, 0.9)

# ---- the sofa set round the coffee table at (-5, -4)
sofa(-6.75, -4.0, PI / 2, L=2.3, D=0.92, col='#d2c6ae')
club_chair(-3.3, -4.75, -PI / 2, col='#cfc2a8'); club_chair(-3.3, -3.25, -PI / 2, col='#cfc2a8')
sofa(-5.0, -5.75, 0.0, L=1.6, D=0.86, n=2, col='#d2c6ae')
wood(-5.6, -4.4, 0.4, 0.44, -4.65, -3.35); bx(-5.5, -4.5, 0.0, 0.4, -4.55, -3.45, '#2a160c', faces='xXzZ')
bx(-5.48, -4.52, 0.12, 0.14, -4.53, -3.47, '#3a2414', faces='Y')
K._collide((-5.0, 0, -4.0), (1.25, 1, 1.35), 0, True, False)
K.box((-5.1, 0.44, -4.25), (0.4, 0.02, 0.3), 'plain', '#b8902a')                                              # tray, vase, books
K.cyl((-4.85, 0.44, -3.75), 0.07, 0.24, 'plain', '#f0ece4', seg=8, r2=0.05)
B = Batch()
for k in range(6):
    a = k * PI / 3; B.prism(-4.85 + math.cos(a) * 0.05, 0.68, -3.75 + math.sin(a) * 0.05, 0.05, 0.06, ['#e8e0d0', '#d84a5a', '#f0d040'][k % 3], n=5, r2=0.02)
B.emit()
for k in range(2): K.box((-5.25, 0.44 + k * 0.03, -3.6), (0.28, 0.03, 0.22), 'plain', ['#2a3a5a', '#7a2a1a'][k], rot=0.2 * k)
for (x, z) in [(-6.75, -5.45), (-6.75, -2.55)]:                                                               # side tables + lamps
    wood(x - 0.28, x + 0.28, 0.52, 0.56, z - 0.25, z + 0.25); bx(x - 0.24, x + 0.24, 0.0, 0.52, z - 0.21, z + 0.21, '#2a160c', faces='xXzZ')
    K.cyl((x, 0.56, z), 0.09, 0.3, 'plain', '#d8c8a8', seg=8, r2=0.05)
    kit2._bake_glow(K.cyl((x, 0.86, z), 0.17, 0.24, 'glow', '#ffe6c0', seg=10, r2=0.12, kind='Glows'), '#ffe6c0')
    K.point((x, 1.0, z), '#ffd6a0', 18, 0.12)
    K._collide((x, 0, z), (0.56, 1, 0.5), 0, True, False)
# floor lamp by the window corner of the set
B = Batch(); B.prism(-8.3, 0.0, -6.9, 0.18, 0.03, '#b8902a', n=8); B.tube((-8.3, 0.03, -6.9), (-8.3, 1.45, -6.9), 0.015, '#b8902a', n=4, caps=False); B.emit()
kit2._bake_glow(K.cyl((-8.3, 1.42, -6.9), 0.21, 0.3, 'glow', '#ffe6c0', seg=10, r2=0.15, kind='Glows'), '#ffe6c0'); K.point((-8.3, 1.6, -6.9), '#ffd6a0', 22, 0.15)
K._collide((-8.3, 0, -6.9), (0.4, 1, 0.4), 0, True, False)

# ---- meeting table (east half): x 4.0..6.4, z -2.2..-1.0, six chairs
wood(3.95, 6.45, 0.72, 0.76, -2.25, -0.95)
for x in (4.45, 5.95): bx(x - 0.06, x + 0.06, 0.0, 0.72, -1.95, -1.25, '#2a160c', faces='xXzZ')
bx(4.45, 5.95, 0.05, 0.1, -1.63, -1.57, '#2a160c', faces='Yzy')
K.obstacle(5.2, -1.6, 2.6, 1.4)
for x in (4.4, 5.2, 6.0):
    club_chair(x, -2.75, 0.0, col='#5e3a24', seat=0.46); club_chair(x, -0.45, PI, col='#5e3a24', seat=0.46)
for x in (4.4, 5.2, 6.0):
    for (z, s) in [(-2.05, 1), (-1.15, -1)]:
        K.box((x, 0.76, z), (0.21, 0.01, 0.29), 'plain', '#efebe2'); K.cyl((x + 0.2, 0.76, z), 0.03, 0.2, 'plain', '#cfe0ec', seg=6)
# the TV on the partition (faces the room) + media cabinet; framed certificates west of the door
K.box((4.6, 1.25, 1.42), (1.66, 0.96, 0.06), 'plain', '#141416')
bake_invisible(K.quad((4.6, 1.28, 1.365), 1.6, 0.9, 'ab_screen', rot=PI, kind='Screens', uvrect=atlas(0, 288, 400, 512, W=1024, H=512)))
K.point((4.6, 1.7, 0.9), '#a8c4ff', 6, 0.3)
wood(3.7, 5.5, 0.0, 0.55, 1.0, 1.45, faces='xXYz'); K.obstacle(4.6, 1.22, 1.85, 0.5)
for (x, cell) in [(-4.4, (0, 360, 200, 512)), (-3.2, (200, 360, 400, 512)), (-6.8, (400, 360, 600, 512))]:
    frame(x, 1.45, 1.45, 0.62, 0.46, PI, cell, fcol='#b8902a', border=0.035)
frame(-2.0, 1.25, 1.45, 0.62, 0.8, PI, (600, 360, 744, 560), fcol='#3a2414')
sign(-8.0, 2.45, 1.435, 0.36, 0.36, PI, (768, 896, 896, 1024))                                               # clock
# AC grilles, smoke detectors
for (x, z) in [(-3.0, -10.0), (3.0, -10.0), (-3.0, -3.5), (3.0, -3.5)]:
    bx(x - 0.3, x + 0.3, H - 0.015, H - 0.005, z - 0.3, z + 0.3, '#e0dcd4', faces='y')
LMW[0] = 1.0

# ================================================================== the DG's double door (dynamic leaves, closed), hinges at x -0.9 / +0.9
K.mat('ab_doorwood', base='#5a3018', tex=False)
for (x0, x1, kind, hx) in [(-0.9, -0.005, 'DoorL', -0.9), (0.005, 0.9, 'DoorR', 0.9)]:
    cube(x0, x1, 0.0, 2.69, 1.575, 1.625, 'wood_dark', kind=kind, uv=1.0)
    for zf in (1.57, 1.63):
        for (ya, yb) in [(0.25, 1.15), (1.35, 2.45)]:
            cube(x0 + 0.1, x1 - 0.1, ya, yb, zf - 0.004, zf + 0.004, 'ab_doorwood', kind=kind, uv=None, faces='zZ')
    hxp = x1 - 0.08 if hx < 0 else x0 + 0.08
    for zf in (1.545, 1.655):
        cube(hxp - 0.015, hxp + 0.015, 0.85, 1.25, zf - 0.012, zf + 0.012, 'brass', kind=kind, uv=1.0)
K.box((0.0, 0.0, 1.6), (1.8, 2.69, 0.05), 'plain', '#202020', kind='bake')
K.obstacle(0.0, 1.6, 1.8, 0.35)

# ================================================================== PANORAMA (the CBD, the hills, Aso Rock)
def pano_band(center, radius, a0, a1, rows, mat, seg=40, kind='Pano'):
    """a cylindrical panorama band like K.strip, but with several (y, v) rows so the texture can spend most of its
    texels near the horizon (ab_pano: y 42..14 -> v 1..0.805, 14..-8 -> 0.805..0.316, -8..-38 -> 0.316..0)"""
    bm = bmesh.new(); uvl = bm.loops.layers.uv.new('UVMap'); cx, cz = center; cols = []
    for i in range(seg + 1):
        a = a0 + (a1 - a0) * i / seg
        px, pz = cx + math.cos(a) * radius, cz + math.sin(a) * radius
        cols.append([bm.verts.new(G(px, y, pz)) for (y, v) in rows])
    for i in range(seg):
        for j in range(len(rows) - 1):
            f = bm.faces.new((cols[i + 1][j], cols[i][j], cols[i][j + 1], cols[i + 1][j + 1]))
            for l, uv in zip(f.loops, [((i + 1) / seg, rows[j][1]), (i / seg, rows[j][1]), (i / seg, rows[j + 1][1]), ((i + 1) / seg, rows[j + 1][1])]): l[uvl].uv = uv
    ob = K._finish(bm, mat, None, None, (0, 0, 0), 0.0, kind, None)
    return ob
o = pano_band((0.0, -6.0), 36.0, -PI - 0.35, 0.35, [(-38.0, 0.0), (-8.0, 1 - 700 / 1024), (14.0, 1 - 200 / 1024), (42.0, 1.0)], 'ab_pano', seg=40)
flip_normals(o); bake_invisible(o)

# ================================================================== ANCHORS
K.anchor('start', (0, 0, 9), rot=PI)
K.anchor('uche_start', (1.2, 0, 9.1), rot=PI)
K.anchor('kuti', (-3, 0, 6.2), rot=0.0)
K.anchor('kuti_desk', (-3, 0.79, 4.6))
K.anchor('kuti_chair', (-3, 0, 3.75), rot=0.0)
K.anchor('dg_door', (0, 0, 1.6), rot=PI, obstacle=[0.0, 1.6, 1.8, 0.35], hinges=[[-0.9, 1.6], [0.9, 1.6]])
K.anchor('records_door', (6.5, 0, 6), rot=PI / 2)
K.anchor('records', (7.5, 0, 6.5), rot=PI / 2)
K.anchor('dg', (0, 0, -9.1), rot=0.0)
K.anchor('dg_chair_front', (0, 0, -6.4), rot=PI)
K.anchor('safe', (8.6, 0, -6), rot=PI / 2)
K.anchor('coffee_table', (-5, 0.44, -4))
K.anchor('sofa_seats', (0, 0, 0), list=[[-6.6, -4.65, PI / 2], [-6.6, -3.35, PI / 2], [-3.3, -4.75, -PI / 2], [-3.3, -3.25, -PI / 2], [-5.35, -5.6, 0.0], [-4.65, -5.6, 0.0]])
K.anchor('meeting_seats', (0, 0, 0), list=[[x, -2.75, 0.0] for x in (4.4, 5.2, 6.0)] + [[x, -0.45, PI] for x in (4.4, 5.2, 6.0)])
K.anchor('reception_seats', (0, 0, 0), list=[[5.85, z, -PI / 2] for z in (2.95, 3.6, 4.25, 7.8, 8.45, 9.1)])
K.anchor('window', (3.2, 0, -11.2), rot=PI)
K.bounds(-10, 10, -12, 10)

build(lm=1024, samples=SAMPLES, margin=2, min_m=0.12, percentile=99.3, denoise=0.45)
