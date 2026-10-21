"""NACECA S2 · Sapele waterside night market (key 'sapele').

A laterite market street runs north from the main road (z 18..24) to a
wooden jetty on the Ethiope River (z -18..-24). Stalls, POS kiosks, Mama
Karo's herb stall, a buka, a charging stand, two-storey shop houses with
balconies; bulbs and lanterns make warm pools, the moon gives a cool fill.

    cd /tmp && python3 ROOT/blender/env_sapele.py ROOT/art13/work [samples]

Uses envkit for geometry, bake and export; the lightmap UVs are laid out
here (see lightmap_uvs) because the stock smart-project + pack shrinks a
prop-dense scene to dots: small props get one compact island each and
every island gets a minimum size.
"""
import sys, os, math, random, json, time, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from envkit import Kit, G, lin
import bpy, bmesh
from mathutils import Vector

OUT = sys.argv[1]
SAMPLES = int(sys.argv[2]) if len(sys.argv) > 2 else 112
K = Kit('sapele', OUT)
R = random.Random(4211)
PI = math.pi

# ================================================================== helpers (shared by the S2 env scripts)
LMW = [1.0]                                       # lightmap density weight for objects created from now on
_kit_finish = K._finish
def _finish_w(*a, **kw):
    ob = _kit_finish(*a, **kw); ob['lmw'] = LMW[0]; return ob
K._finish = _finish_w
def poly(verts, faces, mat='plain', color=None, uv=None, kind='static', name=None, lm=None, closed=False):
    bm = bmesh.new()
    vs = [bm.verts.new(G(*v)) for v in verts]
    for f in faces: bm.faces.new([vs[i] for i in f])
    if closed: bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ob = K._finish(bm, mat, color, uv, (0, 0, 0), 0.0, kind, name)
    if lm: ob['lm'] = lm
    return ob

_DIRS = {'x': Vector((-1, 0, 0)), 'X': Vector((1, 0, 0)), 'y': Vector((0, 0, -1)), 'Y': Vector((0, 0, 1)), 'z': Vector((0, 1, 0)), 'Z': Vector((0, -1, 0))}
def cube(x0, x1, y0, y1, z0, z1, mat='plain', color=None, uv=1.0, faces='xXYzZ', kind='static', collide=False, block=False, name=None, flip=False, lm=None):
    """axis-aligned box from corners; faces: x/X = -x/+x, y/Y = bottom/top, z/Z = north(-z)/south(+z)"""
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    w, h, d = x1 - x0, y1 - y0, z1 - z0
    bmesh.ops.scale(bm, vec=Vector((w, d, h)), verts=bm.verts)
    bmesh.ops.translate(bm, vec=G((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), verts=bm.verts)
    keep = [_DIRS[c] for c in faces]
    kill = [f for f in bm.faces if not any(f.normal.dot(k) > 0.9 for k in keep)]
    if kill: bmesh.ops.delete(bm, geom=kill, context='FACES')
    if flip:
        for f in bm.faces: f.normal_flip()
    if collide or block: K._collide(((x0 + x1) / 2, y0, (z0 + z1) / 2), (w, h, d), 0.0, collide, block)
    ob = K._finish(bm, mat, color, uv if mat not in ('plain', 'glow') else None, (0, 0, 0), 0.0, kind, name)
    if lm: ob['lm'] = lm
    return ob

def beam(p0, p1, t, mat='plain', color=None, t2=None, sides=4, kind='static', uv=None, roll=0.0):
    """a prism between two game-space points (wires, poles, legs, roots, fronds)"""
    a, b = G(*p0), G(*p1); d = b - a
    if d.length < 1e-5: return None
    d.normalize()
    up = Vector((0, 0, 1)) if abs(d.z) < 0.95 else Vector((1, 0, 0))
    u = d.cross(up).normalized(); v = d.cross(u).normalized()
    t2 = t if t2 is None else t2
    bm = bmesh.new(); ra, rb = [], []
    for i in range(sides):
        ang = roll + 2 * PI * i / sides + PI / sides
        off = u * math.cos(ang) + v * math.sin(ang)
        ra.append(bm.verts.new(a + off * t / 2)); rb.append(bm.verts.new(b + off * t2 / 2))
    for i in range(sides):
        j = (i + 1) % sides
        bm.faces.new((ra[i], ra[j], rb[j], rb[i]))
    bm.normal_update()
    c = (a + b) / 2
    for f in bm.faces:
        if f.normal.dot(f.calc_center_median() - c) < 0: f.normal_flip()
    ob = K._finish(bm, mat, color, uv, (0, 0, 0), 0.0, kind, None)
    if kind == 'static':
        ob['lm'] = 'beam'; ob['lm_a'] = tuple(a); ob['lm_d'] = tuple(d); ob['lm_w'] = tuple(u)
    return ob

def sheet(c00, c10, c11, c01, mat='plain', color=None, uv=1.0, nu=1, nv=1, sag=0.0, off=0.02, up=True, both=True, kind='static', backcolor=None, lm=None):
    """a bilinear (optionally sagging) sheet between four corners, two-sided (tarps, awnings, cloth, fronds)."""
    def P(s, t):
        p = [(1 - s) * (1 - t) * c00[i] + s * (1 - t) * c10[i] + s * t * c11[i] + (1 - s) * t * c01[i] for i in range(3)]
        if sag: p[1] -= sag * 4 * s * (1 - s) * (0.6 + 0.4 * 4 * t * (1 - t))
        return p
    def build_(offset, flip, col):
        bm = bmesh.new(); grid = []
        for j in range(nv + 1):
            row = []
            for i in range(nu + 1):
                p = P(i / nu, j / nv); row.append(bm.verts.new(G(p[0], p[1] + offset, p[2])))
            grid.append(row)
        for j in range(nv):
            for i in range(nu):
                bm.faces.new((grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]))
        bm.normal_update()
        want = 1 if up else -1
        for f in bm.faces:
            if (f.normal.z * want < 0) != flip: f.normal_flip()
        ob = K._finish(bm, mat, col, uv if mat not in ('plain', 'glow') else None, (0, 0, 0), 0.0, kind, None)
        if lm: ob['lm'] = lm
        return ob
    a = build_(0.0, False, color)
    if both: build_(-off if up else off, True, backcolor or color)
    return a

def quadv(x, y, z, w, h, rot, mat='plain', color=None, uvrect=(0, 0, 1, 1), kind='static', lm=None):
    ob = K.quad((x, y, z), w, h, mat, rot=rot, kind=kind, color=color, uvrect=uvrect)
    if lm: ob['lm'] = lm
    return ob

def atlas(px0, py0, px1, py1, W=1024, H=1024):
    return (px0 / W, 1 - py1 / H, px1 / W, 1 - py0 / H)

_BAKEM = {}
def _bake_glow(ob, color, emit=4.0):
    if color not in _BAKEM:
        em = bpy.data.materials.new('glow_bake_' + color); em.use_nodes = True
        b = em.node_tree.nodes.get('Principled BSDF')
        b.inputs['Base Color'].default_value = (*lin(color), 1)
        b.inputs['Emission Color'].default_value = (*lin(color), 1); b.inputs['Emission Strength'].default_value = emit
        _BAKEM[color] = em.name
    ob['_bake_mat'] = _BAKEM[color]
    ob.visible_shadow = False
    return ob

def gbulb(x, y, z, r, color, watts=0, light=None, kind='Glows', radius=0.06):
    """an octahedral glowing bulb centred at (x, y, z) + an optional bake light"""
    ob = poly([(x + r, y, z), (x - r, y, z), (x, y + r, z), (x, y - r, z), (x, y, z + r), (x, y, z - r)],
              [(0, 2, 4), (4, 2, 1), (1, 2, 5), (5, 2, 0), (4, 3, 0), (1, 3, 4), (5, 3, 1), (0, 3, 5)], 'glow', color, kind=kind, closed=True)
    _bake_glow(ob, color)
    if watts: K.point((x, y, z), light or color, watts, radius)
    return ob

def gbox(pos, size, color, kind='Glows', rot=0.0):
    ob = K.box(pos, size, 'glow', color=color, kind=kind, bottom=True, rot=rot)
    return _bake_glow(ob, color)

def gquad(x, y, z, w, h, rot, color, kind='Glows'):
    ob = K.quad((x, y, z), w, h, 'glow', rot=rot, kind=kind, color=color)
    return _bake_glow(ob, color)

def shade(hexc, k):
    h = hexc.lstrip('#'); r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    f = lambda v: max(0, min(255, int(v * k)))
    return '#%02x%02x%02x' % (f(r), f(g), f(b))

def jitter(hexc, amt=0.12):
    return shade(hexc, 1 + (R.random() - 0.5) * 2 * amt)

def bake_invisible(ob):
    """dynamic decals / panoramas must not shadow or light the bake"""
    ob.visible_shadow = False; ob.visible_diffuse = False; ob.visible_glossy = False; ob.visible_transmission = False
    return ob

def flip_normals(ob):
    bm = bmesh.new(); bm.from_mesh(ob.data)
    for f in bm.faces: f.normal_flip()
    bm.to_mesh(ob.data); bm.free()

def lightmap_uvs(env, lm, margin, small=0.5, min_m=0.22, boost=1.35):
    """Lightmap UVs for the joined Env. Objects flagged lm='top' (or smaller than `small`) and thin beams were
    given compact per-object coordinates in metres before the join; everything else is smart-projected. Every
    island is grown to at least min_m (so it owns real texels), then all islands are packed with exact pixel margins."""
    from bpy_extras import bmesh_utils
    me = env.data
    me.uv_layers.active = me.uv_layers['Lightmap']
    bpy.ops.object.select_all(action='DESELECT'); env.select_set(True); bpy.context.view_layer.objects.active = env
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_mode(type='FACE')
    bm = bmesh.from_edit_mesh(me)
    lay = bm.faces.layers.int.get('lmc')
    for f in bm.faces: f.select_set(f[lay] == 0)
    bm.select_flush_mode(); bmesh.update_edit_mesh(me)
    bpy.ops.uv.smart_project(angle_limit=math.radians(55), island_margin=0.0, area_weight=0.0, correct_aspect=True, scale_to_bounds=False)
    bm = bmesh.from_edit_mesh(me)
    lay = bm.faces.layers.int.get('lmc'); uvl = bm.loops.layers.uv['Lightmap']
    def uv_area(f):
        uvs = [l[uvl].uv for l in f.loops]; a = 0.0
        for i in range(len(uvs)):
            x1, y1 = uvs[i]; x2, y2 = uvs[(i + 1) % len(uvs)]; a += x1 * y2 - x2 * y1
        return abs(a) / 2
    A3 = sum(f.calc_area() for f in bm.faces if f[lay] == 0)
    AU = sum(uv_area(f) for f in bm.faces if f[lay] == 0)
    k = math.sqrt(AU / max(A3, 1e-9))
    for f in bm.faces:
        if f[lay] == 1:
            for l in f.loops: l[uvl].uv = l[uvl].uv * (k * boost)
    islands = bmesh_utils.bmesh_linked_uv_islands(bm, uvl)
    wl = bm.faces.layers.float.get('lmw')
    if wl is not None:                       # density weights: scale each island about its centre
        for isl in islands:
            w = isl[0][wl]
            if abs(w - 1.0) < 1e-3: continue
            us = [l[uvl].uv.x for f in isl for l in f.loops]; vs = [l[uvl].uv.y for f in isl for l in f.loops]
            cu, cv = (min(us) + max(us)) / 2, (min(vs) + max(vs)) / 2
            for f in isl:
                for l in f.loops:
                    uv = l[uvl].uv; l[uvl].uv = (cu + (uv.x - cu) * w, cv + (uv.y - cv) * w)
    mn = min_m * k; grown = 0
    for isl in islands:
        us = [l[uvl].uv.x for f in isl for l in f.loops]; vs = [l[uvl].uv.y for f in isl for l in f.loops]
        u0, u1, v0, v1 = min(us), max(us), min(vs), max(vs)
        su = min(400.0, mn / max(u1 - u0, 1e-7)) if (u1 - u0) < mn else 1.0
        sv = min(400.0, mn / max(v1 - v0, 1e-7)) if (v1 - v0) < mn else 1.0
        if su != 1.0 or sv != 1.0:
            grown += 1; cu, cv = (u0 + u1) / 2, (v0 + v1) / 2
            for f in isl:
                for l in f.loops:
                    uv = l[uvl].uv; l[uvl].uv = (cu + (uv.x - cu) * su, cv + (uv.y - cv) * sv)
    for f in bm.faces: f.select_set(True)
    bmesh.update_edit_mesh(me)
    bpy.context.scene.tool_settings.use_uv_select_sync = True     # UV selection follows the (all-selected) mesh
    bpy.ops.uv.pack_islands(rotate=True, margin=margin / lm, margin_method='FRACTION', shape_method='CONCAVE')
    bm = bmesh.from_edit_mesh(me); uvl = bm.loops.layers.uv['Lightmap']
    fill = sum(uv_area(f) for f in bm.faces)
    bpy.ops.object.mode_set(mode='OBJECT')
    me.uv_layers.active = me.uv_layers['UVMap']
    print(f'[lmuv] islands {len(islands)} (grown {grown}), uv fill {fill:.2f}, ~{math.sqrt(fill * lm * lm / max(A3, 1)):.1f} px/m on auto faces')

def build(lm=1024, samples=64, margin=3, percentile=99.6, small=0.5, min_m=0.22, boost=1.35, denoise=0.22):
    """envkit's Kit.build with the lightmap UV step above (bake, normalisation, export and meta are the kit's)."""
    t0 = time.time()
    for o in K.static:
        me = o.data
        lay = me.uv_layers.new(name='Lightmap')
        flag = me.attributes.new('lmc', 'INT', 'FACE')
        me.attributes.new('lmw', 'FLOAT', 'FACE').data.foreach_set('value', [float(o.get('lmw', 1.0))] * len(me.polygons))
        mode = o.get('lm')
        if mode is None and max(o.dimensions) < small: mode = 'top'
        if not mode or mode == 'auto': continue
        flag.data.foreach_set('value', [1] * len(me.polygons))
        V_ = me.vertices; L_ = me.loops
        if mode == 'beam':
            # unroll the prism: u along the axis, v around it (each side its own strip, no overlaps)
            a, d, w = Vector(o['lm_a']), Vector(o['lm_d']), Vector(o['lm_w']); w2 = d.cross(w)
            for p in me.polygons:
                angs = []
                for li in p.loop_indices:
                    q = V_[L_[li].vertex_index].co - a
                    angs.append(math.atan2(q.dot(w2), q.dot(w)) % (2 * PI))
                if max(angs) - min(angs) > PI: angs = [x + 2 * PI if x < PI else x for x in angs]
                for li, ang in zip(p.loop_indices, angs):
                    q = V_[L_[li].vertex_index].co - a
                    rad = (q - d * q.dot(d)).length
                    lay.data[li].uv = (q.dot(d), ang * max(rad, 0.004))
        else:
            # top-down footprint; faces looking down collapse onto the footprint centre (they never own texels)
            xs_ = [v.co.x for v in V_]; ys_ = [v.co.y for v in V_]
            cx, cy = (min(xs_) + max(xs_)) / 2, (min(ys_) + max(ys_)) / 2
            for p in me.polygons:
                down = p.normal.z < -0.2
                for li in p.loop_indices:
                    co = V_[L_[li].vertex_index].co
                    lay.data[li].uv = (cx, cy) if down else (co.x, co.y)
    env = K._join(K.static, 'Env')
    dyn_objs = [K._join(objs, name) for name, objs in K.dyn.items()]
    lightmap_uvs(env, lm, margin, small, min_m, boost)
    me = env.data
    img = bpy.data.images.new('LM', lm, lm, alpha=False, float_buffer=True)
    for o in dyn_objs + K.bakeonly:
        if o.get('_bake_mat'): o.data.materials[0] = bpy.data.materials[o['_bake_mat']]
    for slot in env.material_slots:
        nt = slot.material.node_tree
        n = nt.nodes.new('ShaderNodeTexImage'); n.image = img; n.select = True; nt.nodes.active = n
    sc = bpy.context.scene
    sc.cycles.samples = samples
    sc.cycles.sample_clamp_indirect = 2.0; sc.cycles.diffuse_bounces = 3; sc.cycles.max_bounces = 4
    sc.render.bake.use_pass_direct = True; sc.render.bake.use_pass_indirect = True; sc.render.bake.use_pass_color = False
    sc.render.bake.margin = margin
    bpy.ops.object.select_all(action='DESELECT'); env.select_set(True); bpy.context.view_layer.objects.active = env
    tb = time.time()
    bpy.ops.object.bake(type='DIFFUSE', pass_filter={'DIRECT', 'INDIRECT'}, margin=margin, use_clear=True, uv_layer='Lightmap', target='IMAGE_TEXTURES')
    print(f'[bake] {time.time() - tb:.0f}s')
    import numpy as np
    px = np.array(img.pixels[:], dtype=np.float32).reshape(lm, lm, 4)[::-1, :, :3]
    if denoise:
        L = np.log(px.max(axis=2) + 1e-4); acc = np.zeros_like(px); wsum = np.zeros(L.shape, np.float32)
        for dy in range(-2, 3):
            for dx in range(-2, 3):
                Ls = np.roll(np.roll(L, dy, 0), dx, 1); Ps = np.roll(np.roll(px, dy, 0), dx, 1)
                w = np.exp(-(dx * dx + dy * dy) / 4.5) * np.exp(-((Ls - L) / denoise) ** 2)
                acc += Ps * w[..., None]; wsum += w
        px = acc / wsum[..., None]
    lumi = px.max(axis=2); nz = lumi[lumi > 1e-5]
    mx = float(np.percentile(nz, percentile)) if nz.size else 1.0
    v = np.clip(px / mx, 0, 1)
    srgb = np.where(v <= 0.0031308, v * 12.92, 1.055 * np.power(v, 1 / 2.4) - 0.055)
    from PIL import Image
    im = Image.fromarray((srgb * 255 + 0.5).astype(np.uint8), 'RGB')
    lm_name = K.key + '_lm'
    im.save(os.path.join(K.out, lm_name + '.png'))
    im.save(os.path.join(K.out, lm_name + '.webp'), 'WEBP', quality=82, method=6)
    for o in dyn_objs + K.bakeonly:
        if o.get('_bake_mat'): o.data.materials[0] = K.mats['glow']
    for o in K.bakeonly: bpy.data.objects.remove(o)
    bpy.ops.object.select_all(action='DESELECT')
    for o in [env] + dyn_objs: o.select_set(True)
    raw = os.path.join(K.out, K.key + '_raw.glb')
    bpy.ops.export_scene.gltf(filepath=raw, export_format='GLB', use_selection=True, export_texcoords=True, export_normals=False,
                              export_vertex_color='ACTIVE', export_all_vertex_colors=False, export_materials='EXPORT',
                              export_yup=True, export_apply=False, export_extras=False, export_tangents=False)
    K._strip_attrs(raw)
    out = os.path.join(K.out, K.key + '.glb')
    r = subprocess.run(['gltfpack', '-i', raw, '-o', out, '-cc', '-kn', '-km', '-kv', '-vtf'], capture_output=True, text=True)
    if r.returncode: raise SystemExit('gltfpack failed: ' + r.stderr)
    meta = dict(K.meta); meta['max'] = round(mx, 4)
    json.dump(meta, open(os.path.join(K.out, K.key + '.json'), 'w'), separators=(',', ':'))
    tris = sum(len(p.vertices) - 2 for p in me.polygons)
    print(f'[envkit] {K.key}: {tris} tris, lm {lm} max {mx:.3f}, glb {os.path.getsize(out)/1024:.0f} KB, '
          f'lm {os.path.getsize(os.path.join(K.out, lm_name + ".webp"))/1024:.0f} KB, {time.time()-t0:.0f}s')

# ================================================================== materials (bounce albedo for the bake)
for n, b in [('sp_puddle', '#141c26'), ('sp_mud', '#4c3d2f'), ('sp_asphalt', '#3d3c3b'), ('sp_signs', '#806040'), ('sp_river', '#0b151b'), ('sp_bottles', '#4a3018'),
             ('sp_phones', '#c0b8a8'), ('sp_pano_river', '#0a0e18'), ('sp_pano_town', '#0a0e18')]:
    K.mat(n, base=b)

# ================================================================== prop library
def chair(x, z, rot, color='#d8d4cc'):
    """mono-block plastic chair; rot = the way the sitter faces"""
    c, s = math.cos(rot), math.sin(rot)
    def T(dx, dz): return (x + dx * c + dz * s, z - dx * s + dz * c)
    for (dx, dz) in [(-0.19, 0.17), (0.19, 0.17), (-0.19, -0.19), (0.19, -0.19)]:
        bx, bz = T(dx * 1.12, dz * 1.12); tx, tz = T(dx, dz)
        beam((bx, 0, bz), (tx, 0.42, tz), 0.045, 'plain', color, sides=3)
    K.box((x, 0.40, z), (0.44, 0.04, 0.42), 'plain', color, rot=rot)
    bx, bz = T(0, -0.21)
    K.box((bx, 0.42, bz), (0.44, 0.42, 0.04), 'plain', shade(color, 0.95), rot=rot)

def ptable(x, z, rot=0.0, color='#dcd8d0', w=0.8, d=0.8, h=0.72):
    K.box((x, h - 0.04, z), (w, 0.04, d), 'plain', color, rot=rot, collide=True)
    c, s = math.cos(rot), math.sin(rot)
    for dx, dz in [(-1, -1), (1, -1), (1, 1), (-1, 1)]:
        lx, lz = dx * (w / 2 - 0.06), dz * (d / 2 - 0.06)
        px, pz = x + lx * c + lz * s, z - lx * s + lz * c
        beam((px, 0, pz), (px, h - 0.04, pz), 0.045, 'plain', shade(color, 0.9), sides=3)

def stool(x, z, color='#6a4a2c', h=0.42):
    K.box((x, h - 0.04, z), (0.34, 0.04, 0.34), 'plain', color)
    for dx, dz in [(-0.13, -0.13), (0.13, -0.13), (0.13, 0.13), (-0.13, 0.13)]:
        beam((x + dx, 0, z + dz), (x + dx, h - 0.04, z + dz), 0.04, 'plain', shade(color, 0.85), sides=3)

def crate(x, y, z, rot=0.0, color='#c03a2a', w=0.44, h=0.3, d=0.32):
    K.box((x, y, z), (w, h, d), 'plain', color, rot=rot)

def sack(x, z, rot=0.0, color='#c8b48a', h=0.62, r=0.22):
    K.cyl((x, 0, z), r, h, 'plain', color, seg=6, r2=r * 0.7, rot=rot)

def heap(x, y, z, r, h, color, seg=5):
    K.cyl((x, y, z), r, h, 'plain', color, seg=seg, r2=r * 0.15)

def bottle(x, y, z, h=0.24, r=0.035, color='#7a4a10'):
    K.cyl((x, y, z), r, h, 'plain', color, seg=5, r2=r * 0.45)

def jerrycan(x, z, rot=0.0, color='#e0c020', y=0.0, s=1.0):
    K.box((x, y, z), (0.32 * s, 0.4 * s, 0.17 * s), 'plain', color, rot=rot)
    c, sn = math.cos(rot), math.sin(rot)
    K.box((x - 0.06 * c * s, y + 0.4 * s, z + 0.06 * sn * s), (0.14 * s, 0.05 * s, 0.05 * s), 'plain', shade(color, 0.85), rot=rot)

def drum(x, z, color='#2a4a8a', y=0.0, h=0.88, r=0.29):
    K.cyl((x, y, z), r, h, 'plain', color, seg=9)

def generator(x, z, rot=0.0, color='#c8a020', s=1.0):
    K.box((x, 0, z), (0.62 * s, 0.08 * s, 0.46 * s), 'plain', '#2a2a2a', rot=rot)
    K.box((x, 0.08 * s, z), (0.5 * s, 0.34 * s, 0.38 * s), 'plain', '#3a3a3c', rot=rot)
    K.box((x, 0.42 * s, z), (0.56 * s, 0.14 * s, 0.4 * s), 'plain', color, rot=rot)
    c, sn = math.cos(rot), math.sin(rot)
    K.cyl((x + 0.22 * s * c, 0.16 * s, z - 0.22 * s * sn), 0.06 * s, 0.24 * s, 'plain', '#5a5048', seg=5)

def lantern(x, y, z, watts=26, color='#ffcf80', hang=None):
    """hurricane lantern: base, glowing glass, cap (+ a hanging cord)"""
    K.cyl((x, y, z), 0.075, 0.06, 'plain', '#7a2a1a', seg=6)
    gbox((x, y + 0.06, z), (0.1, 0.15, 0.1), color)
    K.cyl((x, y + 0.21, z), 0.06, 0.05, 'plain', '#5a1e14', seg=6, r2=0.02)
    if watts: K.point((x, y + 0.13, z), '#ffc070', watts, 0.12)
    if hang: beam((x, y + 0.26, z), (x, hang, z), 0.012, 'plain', '#1a1a1a', sides=3)

def bulb(x, y, z, watts=30, color='#ffd9a0', light='#ffc982', r=0.045, cord=None, kind='Glows'):
    if cord is not None: beam((x, y + r, z), (x, cord, z), 0.012, 'plain', '#141414', sides=3)
    gbulb(x, y, z, r, color, watts=watts, light=light, kind=kind)

def tube(x, y, z, length=1.2, axis='z', watts=40, color='#e8f4ff', light='#dcecff', kind='GlowsCool'):
    sz = (0.05, 0.05, length) if axis == 'z' else (length, 0.05, 0.05)
    fz = (0.09, 0.04, length + 0.06) if axis == 'z' else (length + 0.06, 0.04, 0.09)
    K.box((x, y + 0.05, z), fz, 'plain', '#d8d8d0')
    gbox((x, y, z), sz, color, kind=kind)
    if watts: K.point((x, y - 0.12, z), light, watts, 0.25)

def catenary(p0, p1, sag, n=8):
    return [(p0[0] + (p1[0] - p0[0]) * i / n, p0[1] + (p1[1] - p0[1]) * i / n - sag * 4 * (i / n) * (1 - i / n), p0[2] + (p1[2] - p0[2]) * i / n) for i in range(n + 1)]

def wire(p0, p1, sag=0.3, n=6, t=0.014, color='#101010'):
    pts = catenary(p0, p1, sag, n)
    for a, b in zip(pts, pts[1:]): beam(a, b, t, 'plain', color, sides=3)
    return pts

def bulb_string(p0, p1, sag, count, watts=24, color='#ffd9a0', light='#ffc480'):
    wire(p0, p1, sag, n=count + 1)
    for p in catenary(p0, p1, sag, count + 1)[1:-1]:
        bulb(p[0], p[1] - 0.14, p[2], watts=watts, color=color, light=light, r=0.045, cord=p[1])

def umbrella(x, z, r=1.2, h=2.3, c1='#c82a2a', c2='#f0e8d8', y0=0.0):
    top = (x, y0 + h + 0.25, z)
    beam((x, y0, z), (x, y0 + h + 0.2, z), 0.04, 'plain', '#d8d8d8', sides=3)
    n = 8; verts = [top]; under = [(x, y0 + h + 0.23, z)]
    for i in range(n):
        a = 2 * PI * i / n
        verts.append((x + math.cos(a) * r, y0 + h - 0.12, z + math.sin(a) * r))
        under.append((x + math.cos(a) * r, y0 + h - 0.14, z + math.sin(a) * r))
    for i in range(n):
        j = (i + 1) % n; col = c1 if i % 2 == 0 else c2
        poly([verts[0], verts[1 + j], verts[1 + i]], [(0, 1, 2)], 'plain', col, lm='top')
        poly([under[0], under[1 + i], under[1 + j]], [(0, 1, 2)], 'plain', shade(col, 0.85), lm='top')
    K._collide((x, 0, z), (0.12, 2, 0.12), 0, True, False)

def palm(x, z, h=8.0, lean=(0.6, 0.2), fronds=10, seed=1, y0=None, green='#2a4a24'):
    rr = random.Random(seed)
    if y0 is None: y0 = min(0.0, bank_y(x, z)) - 0.05
    segs = 5; pts = [(x + lean[0] * (i / segs) ** 2, y0 + h * i / segs, z + lean[1] * (i / segs) ** 2) for i in range(segs + 1)]
    for i in range(segs):
        beam(pts[i], pts[i + 1], 0.34 - 0.12 * i / segs, 'bark', None, t2=0.34 - 0.12 * (i + 1) / segs, sides=5, uv=1.0)
    top = pts[-1]
    K.sphere((top[0], top[1] - 0.15, top[2]), 0.3, 'plain', '#3a3020', seg=5)
    for k in range(fronds):
        a = 2 * PI * k / fronds + rr.random() * 0.3
        L = 2.6 + rr.random() * 0.9; droop = 0.5 + rr.random() * 0.9
        ca, sa = math.cos(a), math.sin(a)
        p0 = top
        p1 = (top[0] + ca * L * 0.5, top[1] + 0.45 - droop * 0.2, top[2] + sa * L * 0.5)
        p2 = (top[0] + ca * L, top[1] - droop, top[2] + sa * L)
        px, pz = -sa * 0.55, ca * 0.55
        col = jitter(green, 0.15)
        for (q0, q1, w0, w1) in [(p0, p1, 0.12, 1.0), (p1, p2, 1.0, 0.15)]:
            sheet((q0[0] - px * w0, q0[1], q0[2] - pz * w0), (q0[0] + px * w0, q0[1], q0[2] + pz * w0),
                  (q1[0] + px * w1, q1[1] - 0.05, q1[2] + pz * w1), (q1[0] - px * w1, q1[1] - 0.05, q1[2] - pz * w1), 'plain', col, off=0.02, lm='top')
    for k in range(3):
        a = rr.random() * 2 * PI
        beam((top[0], top[1] - 0.2, top[2]), (top[0] + math.cos(a) * 0.6, top[1] - 1.8, top[2] + math.sin(a) * 0.6), 0.16, 'plain', '#5a4a2a', t2=0.05, sides=3)
    K._collide((x, 0, z), (0.4, 2, 0.4), 0, True, False)

def tree(x, z, h=6.5, r=3.0, seed=2, color='#23361f', blobs=8):
    rr = random.Random(seed)
    y0 = min(0.0, bank_y(x, z)) - 0.05
    beam((x, y0, z), (x + 0.2, h * 0.55, z - 0.1), 0.5, 'bark', None, t2=0.32, sides=5, uv=1.0)
    for k in range(3):
        a = rr.random() * 2 * PI
        beam((x + 0.2, h * 0.5, z - 0.1), (x + math.cos(a) * r * 0.6, h * (0.7 + rr.random() * 0.15), z + math.sin(a) * r * 0.6), 0.2, 'bark', None, t2=0.08, sides=4, uv=1.0)
    for k in range(blobs):
        a = rr.random() * 2 * PI; d = rr.random() * r * 0.7
        rad = r * (0.38 + rr.random() * 0.25)
        ob = K.sphere((x + math.cos(a) * d, h * (0.72 + rr.random() * 0.22), z + math.sin(a) * d), rad, 'plain', jitter(color, 0.15), seg=6, sy=0.62)
        ob['lm'] = 'top'
    K._collide((x, 0, z), (0.6, 2, 0.6), 0, True, False)

def epole(x, z, h=8.5, arm=1.2, rot=0.0):
    beam((x, 0, z), (x, h, z), 0.24, 'plain', '#3a2c20', t2=0.18, sides=5)
    c, s = math.cos(rot), math.sin(rot)
    K.box((x, h - 0.5, z), (arm * 2, 0.1, 0.1), 'plain', '#3a2c20', rot=rot)
    K._collide((x, 0, z), (0.3, 2, 0.3), 0, True, False)
    return [(x + d * c, h - 0.35, z - d * s) for d in (-arm * 0.85, -arm * 0.3, arm * 0.3, arm * 0.85)]

def puddle(x, z, rx, rz, rot=0.0, y=0.008, n=9, seed=0):
    """a wet patch: unlit dark water with sky sheen and glints (dynamic node 'Puddles', alpha-blended)"""
    c, sn = math.cos(rot), math.sin(rot)
    pts = [(x + dx * c + dz * sn, y, z - dx * sn + dz * c) for (dx, dz) in [(-rx, -rz), (rx, -rz), (rx, rz), (-rx, rz)]]
    ob = bake_invisible(poly(pts, [(0, 3, 2, 1)], 'sp_puddle', kind='Puddles'))
    uvs = ob.data.uv_layers['UVMap'].data
    q = (seed % 4) * 0.25
    for li, (u, v) in zip(range(4), [(q, 0), (q, 1), (q + 0.25, 1), (q + 0.25, 0)]): uvs[li].uv = (u, v)
    return ob

def litter(x0, x1, z0, z1, count, seed=0, y=0.008):
    rr = random.Random(seed)
    cols = ['#e8e8e0', '#d8e0e8', '#e0d0b0', '#c84a3a', '#3a6ab8', '#2a2a2a', '#d0b060']
    for i in range(count):
        x, z = rr.uniform(x0, x1), rr.uniform(z0, z1)
        s = 0.05 + rr.random() * 0.1; a = rr.random() * PI
        c, sn = math.cos(a) * s, math.sin(a) * s
        poly([(x - c, y, z - sn), (x + sn, y, z - c), (x + c, y, z + sn), (x - sn, y, z + c)], [(0, 3, 2, 1)], 'plain', rr.choice(cols), lm='top')

# ================================================================== lights: moon + sky
K.world('#1a2a50', 1.25)
K.sun((-0.30, -0.62, 0.72), '#a4b8ea', 0.55, angle=0.035)       # moon from the north-north-east, over the river

# ================================================================== GROUND
def bank_y(x, z):
    """riverbank height: flat to z -16.3, down to -0.30 at z -17.5, then under the water; causeway |x|<3.6 stays at 0"""
    if abs(x) < 3.6 and z > -18.0: return 0.0
    if z >= -16.3: return 0.0
    if z >= -17.5: return -0.30 * (-16.3 - z) / 1.2
    return -0.30 - 0.3 * (-17.5 - z)

K.plane((0, 0, 1.7), 20.0, 32.6, 'laterite', uv=1 / 3)           # market street x -10..10, z -14.6..18
for s in (-1, 1):
    cube(min(s * 8.8, s * 10.0), max(s * 8.8, s * 10.0), 0, 0.02, -15.0, 17.0, 'concrete', uv=0.5, faces='Y')   # walkway slab under balconies
    K.plane((s * 5.6, 0.004, 1.0), 3.6, 31.0, 'path_dirt', uv=1 / 3)                                          # trampled earth under the stalls
K.plane((0, 0, 21.0), 64.0, 6.0, 'sp_asphalt', uv=1 / 4)           # main road (x -32..32)
LMW[0] = 0.25
for s_ in (-1, 1):
    K.plane((s_ * 46.0, 0, 21.0), 28.0, 6.0, 'sp_asphalt', uv=1 / 4); K.plane((s_ * 46.0, 0, 24.9), 28.0, 1.8, 'laterite', uv=1 / 3); K.plane((s_ * 46.0, 0, 15.0), 28.0, 6.0, 'laterite', uv=1 / 3)
LMW[0] = 1.0
K.plane((0, 0, 24.9), 64.0, 1.8, 'laterite', uv=1 / 3)
for s in (-1, 1):
    xa, xb = (3.6, 32.0) if s > 0 else (-32.0, -3.6)
    cube(xa, xb, 0, 0.16, 17.82, 18.0, 'kerb', uv=1.0, faces='YZ')
    cube(xa, xb, -0.35, 0.0, 17.2, 17.82, 'drain', uv=1.0, faces='Y')
    cube(xa, xb, -0.35, 0.0, 17.15, 17.2, 'kerb', uv=1.0, faces='Z')
    cube(14.0 if s > 0 else -32.0, 32.0 if s > 0 else -14.0, 0, 0.002, 12.0, 17.15, 'laterite', uv=1 / 3, faces='Y')
cube(-3.6, 3.6, -0.02, 0.02, 17.15, 18.0, 'concrete', uv=0.5, faces='Y')     # culvert slab where the street meets the road
for i in range(-10, 11):
    cube(i * 3.0 - 0.9, i * 3.0 + 0.9, 0.0, 0.006, 20.95, 21.07, 'plain', '#b8ae8a', faces='Y', lm='top')
cube(-32, 32, 0.0, 0.005, 18.35, 18.45, 'plain', '#9a9480', faces='Y')
cube(-32, 32, 0.0, 0.005, 23.6, 23.7, 'plain', '#9a9480', faces='Y')

# riverbank: sloping mud strips either side of the causeway (down to just below the waterline)
xs = [-32, -20, -14, -10, -7, -5, -3.6, 3.6, 5, 7, 10, 14, 20, 32]
zs = [-14.6, -15.5, -16.3, -16.9, -17.5, -18.4]
for i in range(len(xs) - 1):
    xa, xb = xs[i], xs[i + 1]
    if xa >= -3.6 and xb <= 3.6: continue
    verts, faces = [], []
    for z in zs:
        for x in (xa, xb):
            n = 0.03 * math.sin(x * 1.7 + z * 2.3) if z < -16.4 else 0
            verts.append((x, bank_y(x, z) + n, z))
    for j in range(len(zs) - 1):
        a = j * 2; faces.append((a, a + 1, a + 3, a + 2))
    poly(verts, faces, 'sp_mud', uv=1 / 3)
K.plane((0, 0, -16.3), 7.2, 3.4, 'laterite', uv=1 / 3)            # causeway top (x -3.6..3.6, z -18..-14.6)
for s in (-1, 1):   # sandbag + timber edging on the causeway sides
    for k in range(6):
        z = -14.95 - k * 0.55
        yb = bank_y(s * 3.9, z)
        K.box((s * 3.72, yb - 0.05, z), (0.3, -yb + 0.12, 0.5), 'burlap', rot=R.uniform(-0.1, 0.1), uv=1.0)
    beam((s * 3.52, 0.03, -14.6), (s * 3.52, 0.03, -18.0), 0.1, 'plain', '#3a2a1c', sides=4)
cube(-3.6, 3.6, -0.9, 0.0, -18.05, -17.95, 'planks', uv=1.0, faces='z')
for (px, pz, rx, rz, a) in [(-1.2, 15.0, 1.1, 0.6, 0.2), (1.8, 11.2, 0.7, 0.45, 0.6), (-0.6, 6.4, 1.4, 0.7, -0.3), (2.2, 2.0, 0.6, 0.4, 0.1),
                            (-2.0, -2.6, 0.9, 0.5, 0.5), (0.8, -7.0, 1.6, 0.8, 0.0), (-1.4, -11.6, 0.8, 0.5, 0.9), (1.0, -14.2, 1.2, 0.6, 0.3),
                            (-8.0, 20.0, 1.0, 0.5, 0.0), (6.0, 22.8, 1.4, 0.4, 0.1), (0.5, 19.2, 0.8, 0.35, 0.0)]:
    puddle(px, pz, rx, rz, a, seed=int(px * 10 + pz * 7))
litter(-3.2, 3.2, -15, 17.5, 40, seed=11)
for s in (-1, 1): litter(3.4 if s > 0 else -8.6, 8.6 if s > 0 else -3.4, -15, 17, 30, seed=12 + s)

# ================================================================== SHOP HOUSES (camera blockers)
def shop_sign_uv(i):
    X, Y = (i % 2) * 512, 512 + (i >> 1) * 64
    return atlas(X, Y, X + 512, Y + 64)

def shophouse(s, z0, z1, fac, sign, opens=(), lit=(), roof='flat', tank=True, seed=0, balcony=True, endS=False, endN=False, cornerSouth=None):
    """s = -1 west / +1 east; facade on x = s*10 facing the street, body to x = s*14.
    Side walls are full only at open ends (endS/endN); elsewhere the alley walls hide them."""
    rr = random.Random(seed)
    xf, xb = s * 10.0, s * 14.0
    xa, xz = min(xf, xb), max(xf, xb)
    H1, H2 = 3.3, 6.5
    face_dir = 'X' if s < 0 else 'x'
    cube(xa, xz, 0, H2 + 0.6, z0, z1, fac, uv=1.0, faces=face_dir + 'Y' + ('Z' if endS else '') + ('z' if endN else ''), block=True, collide=True)
    LMW[0] = 0.3
    cube(min(xb, xb + s * 0.01), max(xb, xb + s * 0.01), 0, H2 + 0.6, z0, z1, fac, uv=1.0, faces=('x' if s < 0 else 'X'))   # back wall
    LMW[0] = 1.0
    xi = xf + s * 1.3   # the first 1.3 m of each side wall shows in the alley
    if not endS: cube(min(xf, xi), max(xf, xi), 0, H2 + 0.6, z1 - 0.01, z1, fac, uv=1.0, faces='Z')
    if not endN: cube(min(xf, xi), max(xf, xi), 0, H2 + 0.6, z0, z0 + 0.01, fac, uv=1.0, faces='z')
    cube(min(xf, xf - s * 0.15), max(xf, xf - s * 0.15), H2 + 0.5, H2 + 0.62, z0 - 0.05, z1 + 0.05, 'concrete', uv=1.0, faces=face_dir + 'YyzZ')   # coping
    cube(min(xf, xf - s * 0.12), max(xf, xf - s * 0.12), H1 - 0.1, H1, z0, z1, 'concrete', uv=1.0, faces=face_dir + 'yY')                     # string course
    if roof != 'flat':
        zc = (z0 + z1) / 2
        poly([(xa + 0.3, H2 + 0.6, z0 + 0.2), (xz - 0.3, H2 + 0.6, z0 + 0.2), (xz - 0.3, H2 + 1.4, zc), (xa + 0.3, H2 + 1.4, zc)], [(0, 3, 2, 1)], roof, uv=1.0)
        poly([(xa + 0.3, H2 + 1.4, zc), (xz - 0.3, H2 + 1.4, zc), (xz - 0.3, H2 + 0.6, z1 - 0.2), (xa + 0.3, H2 + 0.6, z1 - 0.2)], [(0, 3, 2, 1)], roof, uv=1.0)
    if tank:
        tx, tz = s * (12.6 + rr.random() * 0.6), z0 + 1.2 + rr.random() * (z1 - z0 - 2.4)
        for dx, dz in [(-0.45, -0.45), (0.45, 0.45)]:
            K.box((tx + dx, H2 + 0.6, tz + dz), (0.08, 1.0, 0.08), 'plain', '#3a3a3a')
        K.box((tx, H2 + 1.6, tz), (1.1, 0.08, 1.1), 'plain', '#3a3a3a')
        K.cyl((tx, H2 + 1.68, tz), 0.55, 1.2, 'plain', '#1c1c1e', seg=9)
    rot = PI / 2 if s < 0 else -PI / 2
    nb = max(1, int(round((z1 - z0) / 3.2))); bw = (z1 - z0) / nb
    for b in range(nb):
        za, zb = z0 + b * bw, z0 + (b + 1) * bw; zc = (za + zb) / 2
        if b in opens:
            xi2 = xf + s * 1.6
            ia, iz = min(xf, xi2), max(xf, xi2)
            cube(ia, iz, 0, 2.7, za + 0.25, zb - 0.25, 'wall_plaster', uv=1.0, faces=('x' if s < 0 else 'X') + 'zZ', flip=True)
            cube(ia, iz, 2.68, 2.7, za + 0.25, zb - 0.25, 'plain', '#d8d0c0', faces='y')
            cube(ia, iz, 0, 0.01, za + 0.25, zb - 0.25, 'concrete', uv=0.5, faces='Y')
            for k in range(3):   # shelves of goods: a painted bottle/packet row on each
                sy = 0.55 + k * 0.62
                cube(min(xi2, xi2 - s * 0.4), max(xi2, xi2 - s * 0.4), sy, sy + 0.04, za + 0.35, zb - 0.35, 'plain', '#6a4a30', faces='Y' + face_dir)
                quadv(xi2 - s * 0.03, sy + 0.04, zc, zb - za - 0.8, 0.4, rot, 'sp_bottles', uvrect=(0, 0, (zb - za - 0.8) / 1.2, 1))
            cube(min(xf, xf + s * 0.9), max(xf, xf + s * 0.9), 0, 0.95, zc - 0.9, zc + 0.9, 'plain', '#5a3a24', faces=face_dir + 'YzZ', collide=True)   # counter
            tube(xf + s * 0.8, 2.6, zc, length=1.2, axis='z', watts=110, color='#f4f8ff', light='#fff0d8')
            quadv(xf - s * 0.02, 2.2, zc, zb - za - 0.5, 0.5, rot, 'shutter')
        else:
            quadv(xf - s * 0.02, 0.0, zc, zb - za - 0.5, 2.7, rot, 'shutter')
        quadv(xf - s * 0.04, 2.72, zc, zb - za - 0.3, (zb - za - 0.3) / 8, rot, 'sp_signs', uvrect=shop_sign_uv(sign[b % len(sign)]))
    if balcony:
        xp = s * 8.8
        cube(min(xp, xf), max(xp, xf), H1 - 0.15, H1, z0, z1, 'concrete', uv=1.0, faces='xXYyzZ')
        for k in range(nb + 1):
            pz = min(z1 - 0.15, max(z0 + 0.15, z0 + k * bw))
            cube(xp - 0.13, xp + 0.13, 0, H1 - 0.15, pz - 0.13, pz + 0.13, fac, uv=1.0, faces='xXzZ', collide=True)
        cube(min(xp, xp + s * 0.1), max(xp, xp + s * 0.1), H1, H1 + 1.0, z0, z1, fac, uv=1.0, faces='xXYzZ')
        cube(min(xp, xp - s * 0.04), max(xp, xp - s * 0.04), H1 + 0.92, H1 + 1.04, z0, z1, 'concrete', uv=1.0, faces=('x' if s > 0 else 'X') + 'YzZ')
        for k in range(int((z1 - z0) / 0.5)):     # breeze-block openings
            zz = z0 + 0.3 + k * 0.5
            if zz > z1 - 0.3: break
            quadv(xp - s * 0.005, H1 + 0.45, zz, 0.26, 0.26, rot, 'plain', '#141210')
        cube(min(xp, xf), max(xp, xf), H1, H1 + 1.0, z0, z0 + 0.1, fac, uv=1.0, faces='zZY')
        cube(min(xp, xf), max(xp, xf), H1, H1 + 1.0, z1 - 0.1, z1, fac, uv=1.0, faces='zZY')
        if rr.random() < 0.6:   # washing on a line across the balcony
            zl0, zl1 = z0 + 0.6, min(z1 - 0.6, z0 + 3.6)
            beam((s * 9.3, H1 + 1.85, zl0), (s * 9.3, H1 + 1.85, zl1), 0.012, 'plain', '#2a2a2a', sides=3)
            for k in range(int((zl1 - zl0) / 0.45)):
                zz = zl0 + 0.2 + k * 0.45
                quadv(s * 9.3, H1 + 1.15 + rr.random() * 0.2, zz, 0.36, 0.65, rot, 'plain', rr.choice(['#d84a3a', '#3a6ab8', '#e8e0d0', '#2a8a4a', '#e8c040', '#8a4ab0']))
                quadv(s * 9.3, H1 + 1.15, zz, 0.36, 0.65, rot + PI, 'plain', '#4a4a50')
    for b in range(nb):   # first floor windows
        za, zb = z0 + b * bw, z0 + (b + 1) * bw; zc = (za + zb) / 2
        fx0, fx1 = min(xf, xf - s * 0.07), max(xf, xf - s * 0.07)
        fface = face_dir + 'zZYy'
        cube(fx0, fx1, H1 + 0.6, H1 + 0.7, zc - 0.75, zc + 0.75, 'plain', '#3a3430', faces=fface)
        cube(fx0, fx1, H1 + 2.2, H1 + 2.32, zc - 0.78, zc + 0.78, 'plain', '#3a3430', faces=fface)
        cube(fx0, fx1, H1 + 0.7, H1 + 2.2, zc - 0.75, zc - 0.65, 'plain', '#3a3430', faces=fface)
        cube(fx0, fx1, H1 + 0.7, H1 + 2.2, zc + 0.65, zc + 0.75, 'plain', '#3a3430', faces=fface)
        if b in lit:
            gquad(xf - s * 0.015, H1 + 0.7, zc, 1.3, 1.5, rot, rr.choice(['#ffd79a', '#ffcf8a', '#ffe2b0']))
            K.point((xf - s * 0.45, H1 + 1.7, zc), '#ffc888', 45, 0.4)
        else:
            quadv(xf - s * 0.012, H1 + 0.7, zc, 1.3, 1.5, rot, 'plain', '#0c0e12')
        for k in range(3):
            zz = zc - 0.33 + k * 0.33
            beam((xf - s * 0.05, H1 + 0.7, zz), (xf - s * 0.05, H1 + 2.2, zz), 0.03, 'plain', '#1a1a1a', sides=3)
    if cornerSouth is not None:
        quadv((xf + xb) / 2, 2.6, z1 + 0.03, 3.6, 0.45, 0.0, 'sp_signs', uvrect=shop_sign_uv(cornerSouth))
        quadv((xf + xb) / 2, 0.0, z1 + 0.02, 2.6, 2.4, 0.0, 'shutter')
        gquad((xf + xb) / 2 + s * -1.6, 3.9, z1 + 0.015, 0.9, 1.1, 0.0, '#ffd79a')

shophouse(-1, 12.0, 17.0, 'facade_d', [0], lit=(0,), seed=1, cornerSouth=2, roof='corrugated_rust', endS=True)
shophouse(-1, 4.6, 11.0, 'facade_b', [4, 8], opens=(1,), lit=(1,), seed=2)
shophouse(-1, -2.4, 3.8, 'facade_e', [3, 9], lit=(0,), seed=3, roof='roof_red')
shophouse(-1, -9.0, -3.2, 'facade_a', [12, 14], opens=(0,), seed=4)
shophouse(-1, -15.4, -11.4, 'facade_c', [6], lit=(0,), seed=5, balcony=False, roof='corrugated_rust', tank=False, endN=True)
shophouse(1, 12.0, 17.0, 'facade_c', [1], opens=(0,), seed=6, cornerSouth=0, endS=True)
shophouse(1, 4.8, 11.2, 'facade_e', [7, 10], lit=(0, 1), seed=7, roof='roof_blue')
shophouse(1, -1.6, 4.2, 'facade_a', [5, 11], opens=(1,), lit=(0,), seed=8)
shophouse(1, -8.0, -2.2, 'facade_d', [13, 15], lit=(1,), seed=9, roof='corrugated_rust')
shophouse(1, -15.4, -9.6, 'facade_b', [11], lit=(0,), seed=10, balcony=False, tank=False, endN=True)
for (s, za, zb) in [(-1, 11.0, 12.0), (-1, 3.8, 4.6), (-1, -3.2, -2.4), (1, 11.2, 12.0), (1, 4.2, 4.8), (1, -2.2, -1.6), (1, -9.6, -8.0)]:
    cube(min(s * 11.2, s * 11.32), max(s * 11.2, s * 11.32), 0, 2.4, za, zb, 'block_wall', uv=1.0, faces=('X' if s < 0 else 'x') + 'Y', collide=True, block=True)
    cube(min(s * 10.0, s * 11.2), max(s * 10.0, s * 11.2), 0, 0.003, za, zb, 'path_dirt', uv=1 / 3, faces='Y')

# behind the shop houses: yards and the low town that the main road runs past (low lightmap density)
LMW[0] = 0.25
for s_ in (-1, 1):
    xa, xb = sorted((s_ * 14.0, s_ * 34.0))
    cube(xa, xb, 0, 0.002, -14.6, 12.0, 'laterite', uv=1 / 3, faces='Y')
    for i, (x0, x1, z0, z1, h, roof) in enumerate([(15.5, 21.0, 4.0, 10.5, 3.2, 'roof_red'), (22.5, 30.0, 3.0, 10.5, 3.6, 'corrugated_rust'), (15.5, 20.5, -6.0, 2.0, 5.8, 'roof_grey'),
                                                   (22.0, 31.0, -7.5, 1.0, 3.2, 'corrugated_rust'), (16.0, 24.0, -14.0, -8.5, 3.0, 'roof_blue'), (26.0, 33.0, -14.0, -9.5, 3.4, 'roof_sheet')]):
        xa_, xb_ = sorted((s_ * x0, s_ * x1))
        cube(xa_, xb_, 0, h, z0, z1, R.choice(['facade_a', 'facade_b', 'facade_c', 'facade_d', 'facade_e']), uv=1.0, faces='xXzZ', block=True)
        cube(xa_ - 0.3, xb_ + 0.3, h, h + 0.12, z0 - 0.3, z1 + 0.3, roof, uv=1.0, faces='Yy')
        if i % 2 == 0:
            gquad((xa_ + xb_) / 2, 1.0, z1 + 0.02, 1.0, 1.1, 0.0, R.choice(['#ffd79a', '#ffcf8a']))
    palm(s_ * 19.0, 11.5, h=8.5, lean=(0.4 * s_, 0.3), seed=900 + (s_ > 0))
    tree(s_ * 28.0, -2.0, h=7.0, r=3.2, seed=910 + (s_ > 0))
LMW[0] = 1.0

# buildings across the main road (south side, beyond the bounds): single storey shops
for i, (x0, x1, fac) in enumerate([(-30, -21, 'facade_b'), (-20.5, -13, 'facade_d'), (-12.5, -4.0, 'facade_a'), (-3.5, 4.5, 'facade_e'), (5.0, 13.0, 'facade_c'), (13.5, 22, 'facade_b'), (22.5, 31, 'facade_d')]):
    cube(x0, x1, 0, 4.0, 26.0, 30.0, fac, uv=1.0, faces='zY', block=True)
    cube(x0 - 0.2, x1 + 0.2, 3.0, 3.12, 24.9, 26.0, 'roof_sheet', uv=1.0, faces='Yy')
    for k in range(int((x1 - x0) / 3.0)):
        quadv(x0 + 1.5 + k * 3.0, 0, 25.97, 2.5, 2.6, PI, 'shutter')
    if i in (1, 4):
        gquad((x0 + x1) / 2, 0.9, 25.96, 1.6, 1.1, PI, '#ffdca8')
        bulb((x0 + x1) / 2 + 1.6, 2.6, 25.5, watts=50, cord=3.0)
    for xp in (x0 + 0.3, x1 - 0.3):
        beam((xp, 0, 25.0), (xp, 3.0, 25.0), 0.1, 'plain', '#5a5048', sides=4)

# ================================================================== STREET FURNITURE & LIGHTS
for x in (-9.0, 9.0, -26.0, 26.0):   # sodium street lights on the main road
    beam((x, 0, 17.5), (x, 6.4, 17.5), 0.14, 'plain', '#4a4a48', t2=0.1, sides=5)
    beam((x, 6.4, 17.5), (x, 6.6, 19.0), 0.08, 'plain', '#4a4a48', sides=4)
    K.box((x, 6.45, 19.2), (0.3, 0.12, 0.6), 'plain', '#3a3a3a')
    gbox((x, 6.38, 19.2), (0.22, 0.06, 0.45), '#ffb565')
    K.point((x, 6.15, 19.2), '#ffa04a', 320, 0.3)
    K._collide((x, 0, 17.5), (0.3, 2, 0.3), 0, True, False)
for s in (-1, 1):   # market banner over the entrance
    beam((s * 3.35, 0, 16.6), (s * 3.35, 5.0, 16.6), 0.12, 'plain', '#5a4a3a', sides=5)
    K._collide((s * 3.35, 0, 16.6), (0.2, 2, 0.2), 0, True, False)
quadv(0, 4.1, 16.62, 6.0, 0.9, 0.0, 'sp_signs', uvrect=atlas(512, 384, 1024, 512))
quadv(0, 4.1, 16.58, 6.0, 0.9, PI, 'plain', '#1d3a6a')
pole_tops = [epole(8.3, z, h=8.6, arm=1.0, rot=PI / 2) for z in (15.5, 2.2, -9.9)]
for a, b in zip(pole_tops, pole_tops[1:]):
    for k in (0, 1, 3): wire(a[k], b[k], sag=0.5, n=6, t=0.012)
for k in (0, 3): wire(pole_tops[0][k], (8.3 - 0.85 + k * 0.57, 8.0, 30.0), sag=0.6, n=6, t=0.012)
for top in pole_tops:
    wire(top[0], (10.0, 5.6, top[0][2] + 1.5), sag=0.4, n=4, t=0.01)
    wire(top[1], (-10.0, 5.8, top[1][2] - 1.0), sag=0.9, n=7, t=0.01)
K.cyl((8.3, 6.6, 2.2), 0.3, 0.9, 'plain', '#5a6064', seg=8)
for z, sag, cnt in [(13.6, 0.9, 6), (7.6, 1.1, 6), (1.6, 0.9, 6), (-4.4, 1.0, 6), (-10.4, 0.9, 6)]:
    bulb_string((-8.8, 4.25, z), (8.8, 4.25, z + 0.6), sag, cnt, watts=14)

# ================================================================== STALLS
def canopy(s, z0, z1, tarp, xf=3.55, xb=7.0, hf=2.3, hb=2.75, string=True):
    """sloping tarp on four poles; s = -1 west, +1 east (front at |x| = xf)"""
    x_front, x_back = s * xf, s * xb
    for z in (z0 + 0.08, z1 - 0.08):
        beam((x_front, 0, z), (x_front, hf + 0.05, z), 0.06, 'plain', '#6a5038', sides=3)
        beam((x_back, 0, z), (x_back, hb + 0.05, z), 0.06, 'plain', '#6a5038', sides=3)
        K._collide((x_front, 0, z), (0.12, 2, 0.12), 0, True, False)
    beam((x_front, hf, z0), (x_front, hf, z1), 0.06, 'plain', '#6a5038', sides=3)
    ov = s * 0.25
    sheet((x_front - ov, hf - 0.08, z0 - 0.1), (x_back, hb, z0 - 0.1), (x_back, hb, z1 + 0.1), (x_front - ov, hf - 0.08, z1 + 0.1), tarp, uv=1.0, nu=2, nv=2, sag=0.06)
    if string:   # one bare bulb under the front of each stall: a pool on the table and the ground in front
        bz = (z0 + z1) / 2 + R.uniform(-0.3, 0.3)
        bulb(x_front + s * 0.2, hf - 0.28, bz, watts=10, cord=hf - 0.02)
        K.area((x_front + s * 0.45, hf - 0.36, bz), (0.7, 0.7), '#ffc47e', 21, (0, -1, 0))

def table(s, z0, z1, xf=3.9, depth=0.9, h=0.85, mat='planks', skirt=None):
    x_front, x_back = s * xf, s * (xf + depth)
    cube(min(x_front, x_back), max(x_front, x_back), h - 0.05, h, z0, z1, mat, uv=1.0, faces='xXYzZ', collide=True)
    if skirt:
        quadv(x_front - s * 0.01, 0.1, (z0 + z1) / 2, z1 - z0 - 0.04, h - 0.16, (-PI / 2 if s > 0 else PI / 2), skirt)
    else:
        for x in (x_front - s * 0.06, x_back + s * 0.06):
            for z in (z0 + 0.06, z1 - 0.06): beam((x, 0, z), (x, h - 0.05, z), 0.05, 'plain', '#4a3424', sides=3)
    return h

def goods_tomato(s, z0, z1, y, xf=3.9):
    for k in range(int((z1 - z0) / 0.42)):
        z = z0 + 0.25 + k * 0.42
        for row in range(2):
            col = R.choice(['#b8241a', '#c8301e', '#a82018']) if (k + row) % 3 else R.choice(['#d84a14', '#2a7a2a', '#e8b020'])
            heap(s * (xf + 0.22 + row * 0.42), y, z, 0.14, 0.14, col)

def goods_pepper(s, z0, z1, y, xf=3.9):
    for k in range(int((z1 - z0) / 0.5)):
        z = z0 + 0.28 + k * 0.5
        K.cyl((s * (xf + 0.3), y, z), 0.16, 0.12, 'plain', R.choice(['#d8d0bc', '#c83a2a', '#3a6ab8']), seg=7, r2=0.22)
        heap(s * (xf + 0.3), y + 0.1, z, 0.19, 0.1, R.choice(['#c81e14', '#e04a10', '#2a8a2a', '#e8a018']), seg=6)
        if k % 2 == 0: heap(s * (xf + 0.68), y, z, 0.15, 0.16, '#9a1a10')

def goods_fabric(s, z0, z1, y, xf=3.9):
    for k in range(int((z1 - z0) / 0.36)):
        z = z0 + 0.2 + k * 0.36
        for row in range(2):
            K.box((s * (xf + 0.25 + row * 0.38), y, z), (0.34, 0.06 + R.random() * 0.2, 0.3), 'fabric_print' if R.random() < 0.5 else 'plain',
                  R.choice(['#1a3a8a', '#b02020', '#e0a020', '#1a6a3a', '#8a2a8a', '#d86a2a']), uv=1.0)
    for k in range(int((z1 - z0) / 0.55)):
        z = z0 + 0.3 + k * 0.55
        mat = R.choice(['fabric_print', 'tarp_purple', 'tarp_orange', 'tarp_blue'])
        rot = PI / 2 if s < 0 else -PI / 2
        quadv(s * 6.8, 1.2, z, 0.48, 1.25, rot, mat); quadv(s * 6.8, 1.2, z, 0.48, 1.25, rot + PI, mat)
    beam((s * 6.8, 2.47, z0), (s * 6.8, 2.47, z1), 0.03, 'plain', '#3a3a3a', sides=3)

def goods_plastic(s, z0, z1, y, xf=3.9):
    for k in range(int((z1 - z0) / 0.4)):
        z = z0 + 0.22 + k * 0.4
        col = R.choice(['#e83a3a', '#3a8ae8', '#38c070', '#f0c830', '#e8e8e8', '#e070c0'])
        K.cyl((s * (xf + 0.22), y, z), 0.15, 0.16, 'plain', col, seg=7, r2=0.18)
        K.box((s * (xf + 0.62), y, z), (0.24, 0.26, 0.3), 'plain', R.choice(['#e8e8e8', '#3a8ae8', '#e83a3a']))
    for k in range(int((z1 - z0) / 0.8)):
        K.cyl((s * (xf - 0.15), 0, z0 + 0.4 + k * 0.8), 0.24, 0.22, 'plain', R.choice(['#3a8ae8', '#e83a3a', '#38c070']), seg=8, r2=0.3)

def goods_phones(s, z0, z1, y, xf=3.9):
    zc = (z0 + z1) / 2
    K.box((s * (xf + 0.45), y, zc), (0.8, 0.04, z1 - z0 - 0.3), 'sp_phones', uv=1.5)
    K.box((s * (xf + 0.45), y + 0.04, z1 - 0.5), (0.7, 0.32, 0.6), 'plain', '#2a3a4a')          # display case
    gbox((s * (xf + 0.45), y + 0.36, z1 - 0.5), (0.6, 0.02, 0.5), '#bfe0ff', kind='GlowsCool')
    K.point((s * (xf + 0.45), y + 0.85, z1 - 0.5), '#cfe6ff', 18, 0.2)
    quadv(s * 6.9, 1.0, zc, z1 - z0 - 0.4, 1.3, (PI / 2 if s < 0 else -PI / 2), 'sp_phones')

def goods_fish(s, z0, z1, y, xf=3.9):
    for k in range(int((z1 - z0) / 0.55)):
        z = z0 + 0.3 + k * 0.55
        K.cyl((s * (xf + 0.3), y, z), 0.24, 0.04, 'mat_weave', None, seg=7)
        for j in range(3):
            a = R.random() * PI
            K.box((s * (xf + 0.3) + math.cos(a) * 0.07, y + 0.04 + j * 0.012, z + math.sin(a) * 0.07), (0.07, 0.035, 0.26), 'plain', R.choice(['#6a4a2a', '#5a3a1c', '#7a5a34']), rot=a)
    K.box((s * (xf + 0.7), y, (z0 + z1) / 2), (0.22, 0.04, z1 - z0 - 0.5), 'plain', '#3a2a1a')
    K.box((s * 5.4, 0, z1 - 0.6), (0.6, 0.45, 0.4), 'plain', '#2a6ab8')
    K.box((s * 5.4, 0.45, z1 - 0.6), (0.62, 0.06, 0.42), 'plain', '#e8e8e8')
    lantern(s * (xf + 0.75), y, z0 + 0.35, watts=22)

def goods_onion(s, z0, z1, y, xf=3.9):
    for k in range(int((z1 - z0) / 0.45)):
        z = z0 + 0.25 + k * 0.45
        heap(s * (xf + 0.25), y, z, 0.17, 0.15, R.choice(['#a0522d', '#c08a5a', '#b06a3a']))
        heap(s * (xf + 0.62), y, z, 0.15, 0.13, R.choice(['#d8c070', '#8a6a3a', '#e0d8c0']))
    for k in range(2): sack(s * (xf - 0.35), z0 + 0.4 + k * 0.7, color=R.choice(['#d8c8a0', '#c8b48a']), h=0.55, r=0.2)

GOODS = {'tomato': goods_tomato, 'pepper': goods_pepper, 'fabric': goods_fabric, 'plastic': goods_plastic, 'phones': goods_phones, 'fish': goods_fish, 'onion': goods_onion}

def stall(s, z0, z1, goods, tarp, seller_chair=True):
    canopy(s, z0, z1, tarp)
    h = table(s, z0 + 0.12, z1 - 0.12, skirt=R.choice([None, None, 'tarp_blue', 'tarp_green', 'burlap']))
    GOODS[goods](s, z0 + 0.12, z1 - 0.12, h)
    if seller_chair: chair(s * 5.6, (z0 + z1) / 2 + R.uniform(-0.4, 0.4), (-PI / 2 if s > 0 else PI / 2) + R.uniform(-0.3, 0.3), R.choice(['#d8d4cc', '#c83a2a', '#3a6ab8', '#e8e8e0']))
    for k in range(int((z1 - z0) / 1.0)):
        z = z0 + 0.5 + k * 1.0; r = R.random()
        if r < 0.4: crate(s * 6.4, 0, z, R.uniform(-0.3, 0.3), R.choice(['#c03a2a', '#e8c020', '#2a6ab8', '#2a8a4a']))
        elif r < 0.7: sack(s * 6.5, z, color=R.choice(['#d8c8a0', '#c8b48a', '#e8e0d0']))
        else: K.box((s * 6.4, 0, z), (0.5, 0.42, 0.42), 'crate_box', uv=1.0, rot=R.uniform(-0.3, 0.3))

# ---------------------------------------------------------------- west side (s = -1)
stall(-1, 13.0, 15.8, 'tomato', 'tarp_red')
# phone charging stand + generator (attendant at anchor 'charging' (-6.5, 0, 10))
canopy(-1, 8.6, 11.8, 'tarp_blue', xf=3.55, xb=7.6, string=False)
cube(-5.95, -4.75, 0.82, 0.86, 8.8, 11.6, 'plain', '#3a2a1c', faces='xXYzZ', collide=True)
quadv(-4.74, 0.12, 10.2, 2.7, 0.66, PI / 2, 'tarp_yellow')
for z in (8.85, 11.55): beam((-5.9, 0, z), (-5.9, 0.82, z), 0.05, 'plain', '#3a2a1c', sides=3)
K.box((-5.35, 0.86, 10.2), (1.1, 0.012, 2.6), 'sp_phones', uv=2.0)       # phones lying on the board, charging
for k in range(7):
    gbox((-5.6 + (k % 2) * 0.45, 0.875, 9.1 + k * 0.33), (0.06, 0.004, 0.11), '#7ab8ff', kind='GlowsCool')
for k in range(3): K.box((-5.05, 0.86, 9.3 + k * 0.9), (0.08, 0.04, 0.4), 'plain', '#e8e8e0')
quadv(-3.52, 2.32, 10.2, 2.4, 0.6, PI / 2, 'sp_signs', uvrect=atlas(512, 256, 1024, 384))
quadv(-3.56, 2.32, 10.2, 2.4, 0.6, -PI / 2, 'plain', '#2a2a2a')
tube(-4.9, 2.1, 10.2, length=1.2, axis='z', watts=60)
generator(-7.6, 11.1, rot=0.3, color='#c8a020', s=1.4)
K._collide((-7.6, 0, 11.1), (1.0, 1, 0.8), 0, True, False)
chair(-6.5, 9.6, PI / 2, '#3a6ab8')
beam((-7.3, 0.4, 11.0), (-5.6, 0.86, 10.4), 0.03, 'plain', '#141414', sides=3)

stall(-1, 5.0, 8.2, 'fabric', 'tarp_purple')

# Mama Karo's herb stall (she stands at (-6.6, 0, 1.0) facing +x; stall front around (-6.5, 0, 1.2))
MZ0, MZ1 = -0.4, 2.9
for z in (MZ0 + 0.08, MZ1 - 0.08):
    beam((-5.0, 0, z), (-5.0, 2.45, z), 0.08, 'plain', '#5a3a22', sides=4)
    beam((-8.0, 0, z), (-8.0, 2.85, z), 0.08, 'plain', '#5a3a22', sides=4)
    K._collide((-5.0, 0, z), (0.12, 2, 0.12), 0, True, False)
beam((-5.0, 2.4, MZ0), (-5.0, 2.4, MZ1), 0.07, 'plain', '#5a3a22', sides=4)
beam((-8.0, 2.8, MZ0), (-8.0, 2.8, MZ1), 0.07, 'plain', '#5a3a22', sides=4)
for z in (MZ0 + 0.9, MZ0 + 1.7, MZ0 + 2.5): beam((-5.0, 2.4, z), (-8.0, 2.8, z), 0.05, 'plain', '#5a3a22', sides=3)
sheet((-4.75, 2.38, MZ0 - 0.15), (-8.1, 2.95, MZ0 - 0.15), (-8.1, 2.95, MZ1 + 0.15), (-4.75, 2.38, MZ1 + 0.15), 'tarp_green', uv=1.0, nu=2, nv=2, sag=0.08)
K.plane((-4.55, 0.01, 1.25), 1.1, 2.6, 'mat_weave', uv=1.2)         # woven mat in front
for (cx, cz, r) in [(-4.3, 0.3, 0.17), (-4.75, 0.75, 0.15), (-4.35, 1.25, 0.19), (-4.8, 1.75, 0.14), (-4.35, 2.2, 0.16)]:
    K.sphere((cx, 0.06, cz), r, 'plain', R.choice(['#b08a4a', '#9a7038', '#c09a58']), seg=6, sy=0.55)          # calabashes
    K.cyl((cx, 0.06 + r * 0.3, cz), r * 0.75, 0.02, 'plain', '#3a2414', seg=6)
for k in range(6):   # bundles of roots and bark
    z = 0.1 + k * 0.42; x = -4.55 + (k % 2) * 0.35
    for j in range(3): beam((x, 0.04, z - 0.15 + j * 0.04), (x + 0.12, 0.05, z + 0.17 + j * 0.03), 0.045, 'plain', R.choice(['#6a4a2a', '#8a5a30', '#5a3a1c']), sides=3)
cube(-6.05, -5.25, 0.68, 0.72, -0.1, 2.6, 'planks', uv=1.0, faces='xXYzZ', collide=True)     # low counter
quadv(-5.24, 0.06, 1.25, 2.65, 0.6, PI / 2, 'mat_weave')
for k in range(12):
    bottle(-5.45 - (k % 3) * 0.17, 0.72, 0.05 + k * 0.2, h=0.2 + R.random() * 0.12, r=0.03 + R.random() * 0.012,
           color=R.choice(['#8a4a0e', '#a0580e', '#6a3a0a', '#2a5a2a', '#1e4a24', '#3a6a2a']))
for z in (0.4, 1.5, 2.3): K.sphere((-5.9, 0.78, z), 0.11, 'plain', '#a07a40', seg=6, sy=0.6)
cube(-8.05, -7.95, 0, 2.2, MZ0 + 0.1, MZ1 - 0.1, 'planks', uv=1.0, faces='X')                 # shelves of bottles behind her
for k in range(4):
    sy = 0.45 + k * 0.45
    cube(-7.95, -7.6, sy, sy + 0.03, MZ0 + 0.15, MZ1 - 0.15, 'plain', '#5a3a22', faces='XYzZ')
    quadv(-7.9, sy + 0.03, 1.25, MZ1 - MZ0 - 0.3, 0.36, PI / 2, 'sp_bottles', uvrect=(k * 0.37, 0, k * 0.37 + 2.4, 1))
for k in range(12):  # dried herbs and roots hanging from the rafters
    z = MZ0 + 0.3 + k * 0.25; x = -5.4 - (k % 4) * 0.6
    yb = 2.42 + (x + 5.0) * -0.13
    beam((x, yb, z), (x, yb - 0.2, z), 0.01, 'plain', '#2a2a1a', sides=3)
    ob = K.cyl((x, yb - 0.6, z), 0.08, 0.4, 'plain', R.choice(['#7a8a3a', '#8a7a3a', '#6a7a34', '#9a8a4a', '#5a6a2a']), seg=5, r2=0.025); ob['lm'] = 'auto'
lantern(-5.35, 1.86, 1.2, watts=34, hang=2.4)
quadv(-4.98, 2.46, 1.25, 2.4, 0.6, PI / 2, 'sp_signs', uvrect=atlas(0, 0, 512, 128))
quadv(-5.02, 2.46, 1.25, 2.4, 0.6, -PI / 2, 'plain', '#2a3a2a')
stool(-7.2, 2.2, '#5a3a22')
K.sphere((-7.3, 0.2, -0.0), 0.2, 'plain', '#8a6a3a', seg=6, sy=0.8)

def pos_kiosk(ox, oz, s, label_i, umb=('#1a4aa0', '#f0c020')):
    """POS kiosk; the operator stands at (ox, oz); s = +1 when the street is on the +x side"""
    tx = ox + s * 0.75
    ptable(tx, oz, 0.0, '#e8e4dc', w=0.6, d=1.0, h=0.76)
    K.box((tx, 0.76, oz - 0.15), (0.12, 0.04, 0.2), 'plain', '#1a1a1c')
    gbox((tx + s * 0.02, 0.8, oz - 0.17), (0.07, 0.004, 0.07), '#9fd0ff', kind='GlowsCool')
    K.box((tx, 0.76, oz + 0.2), (0.2, 0.02, 0.28), 'plain', '#e8e0c8')
    K.box((tx + s * 0.1, 0.76, oz + 0.38), (0.08, 0.1, 0.08), 'plain', '#2a2a2a')
    chair(ox - s * 0.6, oz + 0.15, PI / 2 if s > 0 else -PI / 2, '#e8e8e0')
    umbrella(ox - s * 0.15, oz - 0.25, r=1.15, h=2.25, c1=umb[0], c2=umb[1])
    bx, bz = tx + s * 0.2, oz + 0.85
    rot = (PI / 2 - 0.6) if s > 0 else (-PI / 2 + 0.6)
    quadv(bx, 0.55, bz, 0.9, 0.45, rot, 'sp_signs', uvrect=atlas(label_i * 256, 128, label_i * 256 + 256, 256))
    quadv(bx, 0.55, bz, 0.9, 0.45, rot + PI, 'plain', '#3a3a3a')
    c, sn = math.cos(rot), math.sin(rot)
    for dx in (-0.4, 0.4): beam((bx + dx * c, 0, bz - dx * sn), (bx + dx * c, 1.02, bz - dx * sn), 0.03, 'plain', '#3a3a3a', sides=3)
    bulb(ox + s * 0.1, 2.05, oz - 0.25, watts=40, cord=2.3)

pos_kiosk(-5.4, -1.8, 1, 3, ('#1a4aa0', '#f0c020'))     # T4, Ejiro's, next to Mama Karo
stall(-1, -6.6, -3.4, 'plastic', 'tarp_orange')
stall(-1, -9.6, -7.0, 'phones', 'tarp_blue')
stall(-1, -13.4, -10.0, 'fish', 'tarp_yellow')
# generator shed around (-9, 0, -10)
GX0, GX1, GZ0, GZ1 = -10.4, -7.9, -11.3, -9.2
cube(GX0, GX1, 0, 2.3, GZ0, GZ0 + 0.06, 'corrugated_rust', uv=1.0, faces='Z', collide=True)
cube(GX0, GX0 + 0.06, 0, 2.3, GZ0, GZ1, 'corrugated_rust', uv=1.0, faces='X', collide=True)
cube(GX0, GX1, 0, 2.3, GZ1 - 0.06, GZ1, 'corrugated_rust', uv=1.0, faces='zZ', collide=True)
sheet((GX0 - 0.2, 2.35, GZ0 - 0.2), (GX1 + 0.3, 2.2, GZ0 - 0.2), (GX1 + 0.3, 2.2, GZ1 + 0.2), (GX0 - 0.2, 2.35, GZ1 + 0.2), 'corrugated_rust', uv=1.0)
cube(GX0 + 0.3, GX0 + 1.9, 0, 0.12, GZ0 + 0.4, GZ1 - 0.4, 'concrete', uv=1.0, faces='XYzZ')
cube(GX0 + 0.4, GX0 + 1.8, 0.12, 1.1, GZ0 + 0.55, GZ1 - 0.55, 'plain', '#2a5a3a', faces='XYzZ', collide=True)
cube(GX0 + 0.4, GX0 + 0.9, 1.1, 1.3, GZ0 + 0.7, GZ1 - 0.7, 'plain', '#1a1a1a', faces='XYzZ')
beam((GX0 + 0.6, 1.3, GZ0 + 1.0), (GX0 + 0.6, 2.9, GZ0 + 1.0), 0.1, 'plain', '#3a3430', sides=4)
bulb(GX1 - 0.4, 1.95, (GZ0 + GZ1) / 2, watts=30, cord=2.22)
for k in range(4):
    wire((GX1, 2.1, GZ0 + 0.4 + k * 0.4), (-5.2 + k * 0.6, 2.65 - k * 0.1, -6.0 + k * 3.0), sag=0.4, n=5, t=0.012)
for k in range(3): drum(-8.3 + k * 0.62, -12.0, color=R.choice(['#2a2a2c', '#3a5a8a']))
# fuel seller near the jetty (anchor 'jerrycans' at (-4.5, 0, -16))
for k in range(9):
    jerrycan(-5.4 + (k % 3) * 0.36, -15.2 - (k // 3) * 0.26, rot=R.uniform(-0.15, 0.15), color=R.choice(['#e0c020', '#e0c020', '#2a8a3a', '#c83a2a']))
for k in range(4): jerrycan(-5.25 + (k % 2) * 0.36, -15.35 - (k // 2) * 0.26, rot=0.1, color='#e0c020', y=0.4)
ptable(-3.85, -16.0, 0.0, '#6a4a2c', w=0.5, d=0.9, h=0.7)
for k in range(8): bottle(-3.95 + (k % 2) * 0.2, 0.7, -16.35 + (k // 2) * 0.2, h=0.26, r=0.04, color=R.choice(['#d8b020', '#c8a018', '#e0c050']))
K.cyl((-3.75, 0.7, -15.7), 0.07, 0.14, 'plain', '#2a6ab8', seg=6, r2=0.02)
FR = 0.4
quadv(-4.5, 0.6, -14.85, 0.8, 0.4, FR, 'sp_signs', uvrect=atlas(0, 384, 256, 512))
quadv(-4.5, 0.6, -14.85, 0.8, 0.4, FR + PI, 'plain', '#3a3a3a')
for dx in (-0.36, 0.36): beam((-4.5 + dx * math.cos(FR), 0, -14.85 - dx * math.sin(FR)), (-4.5 + dx * math.cos(FR), 1.0, -14.85 - dx * math.sin(FR)), 0.03, 'plain', '#3a3a3a', sides=3)
lantern(-3.8, 0.7, -16.3, watts=28)
stool(-5.0, -16.3, '#5a3a22')

# ---------------------------------------------------------------- east side (s = +1)
cube(4.2, 7.0, 0, 2.5, 15.4, 17.0, 'container', uv=1.0, faces='xXYzZ', collide=True)          # provisions kiosk at the corner
cube(4.15, 7.05, 2.5, 2.6, 15.3, 17.1, 'plain', '#3a3a3a', faces='xXYyzZ')
gquad(4.18, 0.9, 16.2, 1.2, 0.9, -PI / 2, '#ffe0b0')
K.point((3.7, 1.5, 16.2), '#ffd8a0', 50, 0.3)
quadv(4.14, 2.0, 16.2, 1.5, 0.4, -PI / 2, 'sp_signs', uvrect=shop_sign_uv(12))
stool(6.5, 14.0, '#6a4a2c', h=0.45)                         # esusu collector's stool (anchor 'esusu')
K.box((5.75, 0, 14.0), (0.5, 0.55, 0.45), 'plain', '#5a3a22', collide=True)
K.box((5.75, 0.55, 14.0), (0.3, 0.03, 0.4), 'plain', '#2a4a8a')
K.box((5.72, 0.58, 13.95), (0.22, 0.01, 0.3), 'plain', '#e8e0c8')
ER = -PI / 2 + 0.5
quadv(5.5, 0.62, 14.75, 0.7, 0.35, ER, 'sp_signs', uvrect=atlas(256, 384, 512, 512))
quadv(5.5, 0.62, 14.75, 0.7, 0.35, ER + PI, 'plain', '#3a3a3a')
for dx in (-0.3, 0.3): beam((5.5 + dx * math.cos(ER), 0, 14.75 - dx * math.sin(ER)), (5.5 + dx * math.cos(ER), 0.97, 14.75 - dx * math.sin(ER)), 0.03, 'plain', '#3a3a3a', sides=3)
umbrella(6.8, 14.4, r=1.1, h=2.2, c1='#2a8a3a', c2='#f0f0e0')
lantern(5.8, 0.58, 14.25, watts=24)
stall(1, 11.3, 13.0, 'onion', 'tarp_green', seller_chair=False)
pos_kiosk(6.2, 10.0, -1, 0, ('#f0c020', '#1a1a1a'))     # T1
stall(1, 6.4, 8.8, 'pepper', 'tarp_red')
pos_kiosk(6.2, 5.0, -1, 1, ('#1a6a3a', '#f0f0e0'))      # T2
stall(1, 0.4, 3.6, 'tomato', 'tarp_yellow')
stall(1, -4.6, -0.2, 'fabric', 'tarp_blue')
pos_kiosk(6.2, -6.0, -1, 2, ('#c8382a', '#f0e8d8'))     # T3
stall(1, -10.0, -7.4, 'fish', 'tarp_orange')

# buka (anchor 'buka' (6.5, 0, -12)): mud shack, counter of pots behind her, a smoky grill in front, plastic tables
BZ0, BZ1 = -14.6, -10.6
cube(7.6, 9.4, 0, 2.6, BZ0, BZ1, 'mudwall', uv=1.0, faces='xzZ', collide=True, block=True)
sheet((5.0, 2.55, BZ0 - 0.3), (9.6, 2.95, BZ0 - 0.3), (9.6, 2.95, BZ1 + 0.3), (5.0, 2.55, BZ1 + 0.3), 'corrugated_rust', uv=1.0, nu=2, nv=1)
for z in (BZ0 - 0.2, BZ1 + 0.2):
    beam((5.1, 0, z), (5.1, 2.55, z), 0.08, 'plain', '#4a3424', sides=4); K._collide((5.1, 0, z), (0.12, 2, 0.12), 0, True, False)
cube(6.9, 7.6, 0, 0.95, BZ0 + 0.3, BZ1 - 0.3, 'planks', uv=1.0, faces='xYzZ', collide=True)
for (pz, col) in [(BZ0 + 0.8, '#3a3a3c'), (BZ0 + 1.6, '#8a8a88'), (BZ0 + 2.4, '#2a2a2a')]:
    K.cyl((7.25, 0.95, pz), 0.24, 0.34, 'plain', col, seg=8)
K.box((7.25, 0.95, BZ1 - 0.8), (0.5, 0.45, 0.6), 'plain', '#9ab0c0')
gbox((7.25, 1.38, BZ1 - 0.8), (0.4, 0.02, 0.5), '#ffe8c0')
quadv(7.58, 1.7, (BZ0 + BZ1) / 2, 3.2, 0.8, -PI / 2, 'sp_signs', uvrect=atlas(0, 256, 512, 384))
bulb(6.4, 2.15, BZ0 + 1.2, watts=55, cord=2.55)
bulb(6.2, 2.15, BZ1 - 0.6, watts=40, cord=2.55)
GXc, GZc = 5.55, -12.6     # the grill: a cut drum on legs with glowing coals, bole and fish on the rack
for dx, dz in [(-0.3, -0.18), (0.3, 0.18), (0.3, -0.18), (-0.3, 0.18)]: beam((GXc + dx, 0, GZc + dz), (GXc + dx, 0.6, GZc + dz), 0.04, 'plain', '#2a2a2a', sides=3)
cube(GXc - 0.4, GXc + 0.4, 0.6, 0.8, GZc - 0.24, GZc + 0.24, 'plain', '#3a2e28', faces='xXzZ')
gbox((GXc, 0.76, GZc), (0.74, 0.03, 0.42), '#ff6a1a', kind='Fire')
K.point((GXc, 1.2, GZc), '#ff7a2a', 130, 0.3)
for k in range(6): K.box((GXc - 0.28 + k * 0.11, 0.82, GZc), (0.05, 0.04, 0.3), 'plain', R.choice(['#c8902a', '#a86a1a', '#6a4a2a']))
K.box((GXc + 0.55, 0, GZc - 0.1), (0.4, 0.38, 0.35), 'plain', '#2a6ab8')
for (tx, tz) in [(4.4, -11.0), (4.4, -13.6)]:
    ptable(tx, tz, 0.1, '#e8e8e0', w=0.75, d=0.75, h=0.72)
    chair(tx, tz - 0.6, 0.0, R.choice(['#d8d4cc', '#c83a2a', '#3a6ab8']))
    chair(tx, tz + 0.6, PI, R.choice(['#d8d4cc', '#c83a2a', '#3a6ab8']))
    K.cyl((tx + 0.1, 0.72, tz), 0.035, 0.24, 'plain', '#2a6a2a', seg=5)
chair(8.3, -14.9, PI, '#3a6ab8')
crate(8.6, 0, -10.2, 0.2, '#2a8a4a'); crate(8.6, 0.3, -10.2, 0.0, '#2a8a4a')

for (x, z, c) in [(3.5, 15.0, '#d8d4cc'), (-3.6, 4.6, '#c83a2a'), (3.6, -0.5, '#3a6ab8'), (-3.55, -9.8, '#d8d4cc')]:
    chair(x + (0.25 if x > 0 else -0.25), z, PI / 2 if x < 0 else -PI / 2, c)
for (x, z) in [(-3.7, 12.6), (3.75, 4.0), (-3.75, -3.2), (3.7, -10.3)]:
    crate(x + (0.1 if x > 0 else -0.1), 0, z, 0.2, R.choice(['#c03a2a', '#e8c020', '#2a6ab8']))
K.box((-8.3, 0.35, 6.2), (0.6, 0.3, 0.9), 'plain', '#5a6a6a', rot=0.3)            # wheelbarrow
K.cyl((-8.2, 0.18, 5.7), 0.18, 0.08, 'plain', '#1a1a1a', seg=8, axis='x', rot=0.3)
K.box((8.2, 0.45, -5.0), (0.9, 0.08, 1.4), 'planks', uv=1.0, rot=-0.2)            # pushcart
for dz in (-0.5, 0.5): K.cyl((8.2, 0.25, -5.0 + dz), 0.25, 0.08, 'plain', '#2a2a2a', seg=8, axis='x', rot=-0.2)

# ================================================================== RIVERBANK & JETTY
cube(-3.0, 3.0, -0.07, 0.0, -24.0, -17.95, 'planks', uv=1.0, faces='YxXz')        # deck, top at y 0
for x in (-2.75, 0.0, 2.75):
    cube(x - 0.08, x + 0.08, -0.3, -0.07, -24.0, -17.95, 'plain', '#3a2c1e', faces='xXz')
for z in (-18.2, -20.1, -22.0, -23.85):
    cube(-3.05, 3.05, -0.3, -0.07, z - 0.08, z + 0.08, 'plain', '#3a2c1e', faces='xXzZ')
    for x in (-2.95, 2.95):
        K.cyl((x, -1.0, z), 0.11, 1.35, 'plain', '#2e2418', seg=6)
        K._collide((x, 0, z), (0.22, 1, 0.22), 0, True, False)
cube(-3.0, -2.8, 0.0, 0.08, -24.0, -17.95, 'plain', '#4a3a28', faces='xXYz')       # edge logs
cube(2.8, 3.0, 0.0, 0.08, -24.0, -17.95, 'plain', '#4a3a28', faces='xXYz')
beam((2.65, 0, -23.7), (2.65, 3.4, -23.7), 0.1, 'plain', '#3a2c1e', sides=4)       # jetty lamp
beam((2.65, 3.3, -23.7), (2.0, 3.45, -23.7), 0.06, 'plain', '#3a2c1e', sides=3)
bulb(2.0, 3.12, -23.7, watts=220, cord=3.45, r=0.06)
K._collide((2.65, 0, -23.7), (0.2, 1, 0.2), 0, True, False)
quadv(4.15, 1.15, -17.0, 1.6, 0.4, 0.0, 'sp_signs', uvrect=atlas(512, 0, 1024, 128))
quadv(4.15, 1.15, -17.02, 1.6, 0.4, PI, 'plain', '#3a3a3a')
for dx in (-0.78, 0.78): beam((4.15 + dx, bank_y(4.15 + dx, -17.0) - 0.1, -17.01), (4.15 + dx, 1.6, -17.01), 0.06, 'plain', '#3a2c1e', sides=4)
K.cyl((2.2, 0, -19.0), 0.25, 0.08, 'plain', '#a08a5a', seg=8, r2=0.2)
jerrycan(2.4, -21.0, 0.3, '#e0c020'); jerrycan(2.05, -21.1, 0.1, '#2a8a3a')
beam((-2.4, 0.03, -22.6), (-0.9, 0.03, -23.3), 0.05, 'plain', '#6a4a2a', sides=3)

def canoe(cx, cz, L, B, rot, color='#3a2a1c', inner='#4a3424', y=-0.35, seats=3):
    """a dugout canoe floating with its waterline at y (hull outside + inside, thwarts)"""
    c, s = math.cos(rot), math.sin(rot)
    def P(lx, ly, lz): return (cx + lx * c + lz * s, y + ly, cz - lx * s + lz * c)
    n = 8; sec = []
    for i in range(n + 1):
        t = -1 + 2 * i / n
        w = B / 2 * max(0.05, 1 - abs(t) ** 2.2); d = 0.3 * max(0.2, 1 - abs(t) ** 3)
        top = 0.28 + 0.12 * abs(t) ** 3
        sec.append([(-w, top, t * L / 2), (-w * 0.8, -d * 0.6, t * L / 2), (0, -d, t * L / 2), (w * 0.8, -d * 0.6, t * L / 2), (w, top, t * L / 2)])
    verts = [P(*p) for sc_ in sec for p in sc_]
    faces = [(i * 5 + k, i * 5 + k + 5, i * 5 + k + 6, i * 5 + k + 1) for i in range(n) for k in range(4)]
    a = poly(verts, faces, 'plain', color)
    vin = [P(px * 0.85, py * 0.8 + 0.06, pz * 0.97) for sc_ in sec for (px, py, pz) in sc_]
    fin = [(i * 5 + k, i * 5 + k + 1, i * 5 + k + 6, i * 5 + k + 5) for i in range(n) for k in range(4)]
    poly(vin, fin, 'plain', inner)
    for k in range(seats):
        t = -0.5 + k * 0.5
        w = B / 2 * max(0.05, 1 - abs(t) ** 2.2) * 0.9
        beam(P(-w, 0.2, t * L / 2), P(w, 0.2, t * L / 2), 0.07, 'plain', '#5a4430', sides=3)
    return a

def speedboat(cx, cz, L=7.2, B=1.9, rot=0.0, y=-0.35):
    """a fibreglass 'flying boat': white hull, blue sheer stripe, benches, windscreen, outboard"""
    c, s = math.cos(rot), math.sin(rot)
    def P(lx, ly, lz): return (cx + lx * c + lz * s, y + ly, cz - lx * s + lz * c)
    st = [(1.0, 1.0, 0.0), (0.6, 1.0, 0.0), (0.0, 0.98, 0.05), (-0.45, 0.82, 0.12), (-0.8, 0.45, 0.25), (-1.0, 0.04, 0.42)]
    sec = [[(-B / 2 * wf, 0.55 + rise, t * L / 2), (-B / 2 * wf * 0.92, 0.05, t * L / 2), (0, -0.25 + rise * 0.6, t * L / 2), (B / 2 * wf * 0.92, 0.05, t * L / 2), (B / 2 * wf, 0.55 + rise, t * L / 2)] for (t, wf, rise) in st]
    n = len(sec)
    verts = [P(*p) for sc_ in sec for p in sc_]
    poly(verts, [(i * 5 + k, i * 5 + k + 1, i * 5 + k + 6, i * 5 + k + 5) for i in range(n - 1) for k in range(4)], 'plain', '#e8e8e2')
    vin = [P(px * 0.9, py * 0.9 + 0.1, pz * 0.98) for sc_ in sec for (px, py, pz) in sc_]
    poly(vin, [(i * 5 + k, i * 5 + k + 5, i * 5 + k + 6, i * 5 + k + 1) for i in range(n - 1) for k in range(4)], 'plain', '#d0d4d4')
    for side in (-1, 1):
        a = [P(side * B / 2 * wf * 1.005, 0.38 + r, t * L / 2) for (t, wf, r) in st]
        for p0, p1 in zip(a, a[1:]): beam(p0, p1, 0.07, 'plain', '#1a4aa0', sides=3)
    poly([P(-B / 2, 0.55, L / 2), P(B / 2, 0.55, L / 2), P(B / 2 * 0.92, 0.05, L / 2), P(0, -0.25, L / 2), P(-B / 2 * 0.92, 0.05, L / 2)], [(0, 1, 2, 3, 4)], 'plain', '#d8d8d2')
    for k in range(3):
        lz = 0.25 * L - k * 0.22 * L
        beam(P(-B / 2 * 0.85, 0.42, lz), P(B / 2 * 0.85, 0.42, lz), 0.16, 'plain', '#2a4a8a', sides=4)
    for k in range(2):
        lz = 0.15 * L - k * 0.22 * L
        K.box(P(-0.4, 0.5, lz), (0.3, 0.14, 0.24), 'plain', '#e8701a', rot=rot); K.box(P(0.3, 0.5, lz + 0.1), (0.3, 0.14, 0.24), 'plain', '#e8701a', rot=rot + 0.3)
    wp = [P(-B / 2 * 0.8, 0.62, -0.18 * L), P(B / 2 * 0.8, 0.62, -0.18 * L), P(B / 2 * 0.7, 0.98, -0.12 * L), P(-B / 2 * 0.7, 0.98, -0.12 * L)]
    poly(wp, [(0, 1, 2, 3)], 'plain', '#4a6a7a'); poly(wp[::-1], [(0, 1, 2, 3)], 'plain', '#3a5a6a')
    ex, ey, ez = P(0, 0.4, L / 2 + 0.2)
    K.box((ex, ey, ez), (0.45, 0.62, 0.5), 'plain', '#1a1a1c', rot=rot)
    K.box((ex, ey - 0.75, ez + 0.05), (0.14, 0.75, 0.18), 'plain', '#2a2a2a', rot=rot)

canoe(-4.1, -20.6, 6.4, 0.86, 0.04)
canoe(-5.3, -22.4, 5.8, 0.8, -0.1, color='#2e2216')
beam((-2.95, 0.3, -18.2), (-3.9, -0.05, -17.6), 0.03, 'plain', '#b09a6a', sides=3)
beam((-2.95, 0.3, -22.0), (-4.7, -0.05, -24.7), 0.03, 'plain', '#b09a6a', sides=3)
beam((-3.5, 0.0, -21.6), (-6.4, 0.25, -20.2), 0.05, 'plain', '#7a5a34', sides=3)
K.box((-4.1, -0.15, -21.6), (0.4, 0.3, 0.3), 'plain', '#c8a020', rot=0.2)
lantern(-4.05, -0.12, -19.6, watts=30)
speedboat(4.35, -21.6, rot=-0.05)
beam((2.95, 0.3, -20.1), (3.7, 0.15, -19.0), 0.03, 'plain', '#b09a6a', sides=3)
beam((2.95, 0.3, -23.85), (3.9, 0.2, -24.6), 0.03, 'plain', '#b09a6a', sides=3)
canoe(-7.6, -15.3, 4.6, 0.8, 1.45, color='#3a2c1e', y=0.22)        # beached on the bank
for (x, z) in [(8.2, -15.0), (10.4, -15.2), (12.6, -15.0)]:
    beam((x, 0, z), (x, 1.9, z), 0.06, 'plain', '#4a3a28', sides=3)
sheet((8.2, 1.85, -15.0), (10.4, 1.85, -15.2), (10.4, 0.6, -15.4), (8.2, 0.5, -15.2), 'plain', '#5a6a5a', nu=2, nv=1, sag=0.15)
sheet((10.4, 1.85, -15.2), (12.6, 1.85, -15.0), (12.6, 0.7, -15.1), (10.4, 0.6, -15.4), 'plain', '#4a5a52', nu=2, nv=1, sag=0.15)
for k in range(24):   # reeds along the waterline
    sd = -1 if k % 2 == 0 else 1
    x = sd * (4.2 + R.random() * 11); z = -16.8 - R.random() * 0.9
    yb = bank_y(x, z); pts = []
    for j in range(5):
        a = R.random() * 2 * PI; hh = 0.4 + R.random() * 0.5
        pts.append(((x + math.cos(a) * 0.05, yb, z + math.sin(a) * 0.05), (x + math.cos(a + 0.4) * 0.05, yb, z + math.sin(a + 0.4) * 0.05), (x + math.cos(a) * 0.2, yb + hh, z + math.sin(a) * 0.2)))
    verts = [p for tri in pts for p in tri]
    faces = [(3 * j, 3 * j + 1, 3 * j + 2) for j in range(5)]
    poly(verts, faces, 'plain', R.choice(['#3a4a24', '#4a5a2a', '#2e3a1e']), lm='top')
    poly(verts, [(f[2], f[1], f[0]) for f in faces], 'plain', R.choice(['#3a4a24', '#4a5a2a', '#2e3a1e']), lm='top')
for (x, z) in [(-8.0, -21.0), (-9.3, -20.4), (7.6, -20.0), (9.6, -22.5), (-12.0, -19.0)]:
    K.cyl((x, -0.8, z), 0.07, 1.4, 'plain', '#2e2418', seg=5)
for (x, z, r) in [(-12.0, -18.6, 1.0), (11.5, -18.8, 1.3), (-7.4, -19.4, 0.6)]:   # water hyacinth near the bank
    for j in range(4):
        a = R.random() * 2 * PI; d = R.random() * r
        ob = K.sphere((x + math.cos(a) * d, -0.33, z + math.sin(a) * d), 0.3 + R.random() * 0.25, 'plain', R.choice(['#2a4a26', '#33572c']), seg=6, sy=0.3)
        ob['lm'] = 'top'

palm(-11.5, -16.2, h=9.0, lean=(-0.8, -0.6), seed=3)
palm(12.8, -16.6, h=10.5, lean=(0.6, -1.0), seed=4)
palm(-14.6, 18.6, h=9.5, lean=(-0.5, 0.4), seed=5)
tree(9.8, -17.4, h=7.5, r=3.4, seed=6)
palm(16.5, 20.0, h=8.5, lean=(0.4, 0.4), seed=7)
tree(-17.5, -12.0, h=8.0, r=3.6, seed=8)

# ================================================================== DYNAMIC: water + panoramas
K.plane((0, -0.35, -48.75), 150.0, 62.5, 'sp_river', uv=1 / 6, kind='Water')     # the river (z < -17.5), the game animates it
for (a0, a1, mat) in [(-PI, 0, 'sp_pano_river'), (0, PI, 'sp_pano_town')]:
    o = K.strip((0, -8), 70, 28, a0, a1, mat, seg=32, y0=-2.0, kind='Pano')
    flip_normals(o)                                  # face the viewer inside the band
    bake_invisible(o)

# vehicles parked on the main road (south lane, facing east) and okadas
K.anchor('Keke', (6.6, 0, 22.4), veh='keke', rot=-PI / 2 + 0.08)
K.anchor('Danfo', (-9.6, 0, 22.3), veh='danfo', rot=-PI / 2 - 0.03)
K.anchor('Ok0', (-5.6, 0, 19.3), veh='okada', rot=0.5, color='#a3141a')
K.anchor('Ok1', (10.4, 0, 19.6), veh='okada', rot=2.6, color='#1a1a1c')
K.anchor('Ok2', (-7.6, 0, 14.6), veh='okada', rot=-0.3, color='#1d3f8a')
for (x, z, L, Wd, rot) in [(6.6, 22.4, 2.6, 1.2, -PI / 2), (-9.6, 22.3, 4.4, 1.7, -PI / 2)]:      # soft contact shadows (bake only)
    K.box((x, 0.25, z), (Wd, 0.9, L), 'plain', '#202020', rot=rot, kind='bake')
for (x, z, rot) in [(-5.6, 19.3, 0.5), (10.4, 19.6, 2.6), (-7.6, 14.6, -0.3)]:
    K.box((x, 0.2, z), (0.3, 0.6, 1.7), 'plain', '#202020', rot=rot, kind='bake')

# ================================================================== ANCHORS
K.anchor('start', (0, 0, 20), rot=PI)
K.anchor('uche_start', (1.3, 0, 19.6), rot=PI)
K.anchor('mama_karo', (-6.6, 0, 1.0), rot=PI / 2)
K.anchor('mama_karo_stall', (-6.5, 0, 1.2))
K.anchor('pos_t4', (-5.4, 0, -1.8), rot=PI / 2, owner='Ejiro')
K.anchor('pos_t1', (6.2, 0, 10.0), rot=-PI / 2)
K.anchor('pos_t2', (6.2, 0, 5.0), rot=-PI / 2)
K.anchor('pos_t3', (6.2, 0, -6.0), rot=-PI / 2)
K.anchor('buka', (6.5, 0, -12.0), rot=-PI / 2)
K.anchor('buka_grill', (5.55, 0.85, -12.6))
K.anchor('charging', (-6.5, 0, 10.0), rot=PI / 2)
K.anchor('esusu', (6.5, 0, 14.0), rot=-PI / 2)
K.anchor('jerrycans', (-4.5, 0, -16.0), rot=PI / 2)
K.anchor('generator_shed', (-9.0, 0, -10.0))
K.anchor('boatman', (-1.0, 0, -21.5), rot=-PI / 2)
K.anchor('jetty_end', (0, 0, -23.5), rot=PI)
K.anchor('crowd', (0, 0, 0), list=[
    [-5.25, 14.4, PI / 2], [-5.25, 6.6, PI / 2], [-5.25, -5.0, PI / 2], [-5.25, -8.3, PI / 2], [-5.25, -11.7, PI / 2],
    [5.25, 12.15, -PI / 2], [5.25, 7.6, -PI / 2], [5.25, 2.0, -PI / 2], [5.25, -2.4, -PI / 2], [5.25, -8.7, -PI / 2],
    [-3.4, 14.0, -PI / 2], [-3.4, 6.0, -PI / 2 + 0.3], [-3.4, -4.4, -PI / 2], [-3.45, -8.0, -PI / 2 - 0.3], [-3.4, 10.6, -PI / 2], [-3.7, -1.5, -PI / 2],
    [3.4, 12.4, PI / 2], [3.4, 2.6, PI / 2 - 0.3], [3.4, -2.0, PI / 2], [3.45, -8.4, PI / 2], [3.7, 10.2, PI / 2], [3.7, -5.8, PI / 2],
    [4.75, -12.9, PI / 2], [2.0, -19.6, PI + 0.4],
])
K.anchor('buka_seats', (0, 0, 0), list=[[4.4, -11.6, 0.0], [4.4, -10.4, PI], [4.4, -14.2, 0.0], [4.4, -13.0, PI]])
# keep walkers off the sloping bank and the river: land ends at z -16.6 (|x| > 3.6), causeway to -18, jetty x -3..3 to -24
K.obstacle(-9.55, -21.55, 11.9, 9.9); K.obstacle(9.55, -21.55, 11.9, 9.9)
K.obstacle(-3.3, -22.25, 0.6, 8.5); K.obstacle(3.3, -22.25, 0.6, 8.5)
K.obstacle(0.0, -25.3, 6.0, 2.5)
K.bounds(-15, 15, -26, 24)

build(lm=1024, samples=SAMPLES, margin=3, percentile=99.3)
