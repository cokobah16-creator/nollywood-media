"""NACECA env kit, part 2 — the Season 2 helpers (from env_sapele.py, by the Sapele/creek/Maitama pass).

Use:
    import kit2
    from envkit import Kit
    K = Kit('<key>', OUT); kit2.use(K, seed=1234)
    from kit2 import *          # poly, cube, beam, sheet, quadv, gbulb, gbox, gquad, bake_invisible, flip_normals,
                                # build (custom lightmap UVs + denoise), and the prop library (chair, ptable, crate, drum,
                                # jerrycan, generator, lantern, bulb, tube, wire, bulb_string, umbrella, palm, tree, ...)
    ...describe the scene...
    build(lm=1024, samples=96)

Notes from the first pass:
- build() lays out lightmap UVs itself (the stock smart-project + pack collapses prop-dense scenes):
  small props (< 0.5 m) and thin beams get compact per-object coordinates, every island gets a minimum size.
- set an object's lightmap density with LMW[0] = w before creating it (e.g. 0.5 for far walls, 1.5 for the hero floor).
- glow pieces: gbulb/gbox/gquad (warm and cool glows should use different kinds, e.g. 'Glows' and 'GlowsCool',
  because a joined node keeps one bake colour).
- dynamic decals/panoramas must call bake_invisible(ob) so they neither shadow nor light the bake;
  K.strip() bands face outward: flip_normals(ob) them.
"""
import sys, os, math, random, json, time, subprocess
from envkit import Kit, G, lin
import bpy, bmesh
from mathutils import Vector

K = None
R = random.Random(1)
PI = math.pi

def use(kit, seed=1):
    """bind the helpers to a Kit"""
    global K, R
    K = kit; R.seed(seed)
    _kit_finish = K._finish
    def _finish_w(*a, **kw):
        ob = _kit_finish(*a, **kw); ob['lmw'] = LMW[0]; return ob
    K._finish = _finish_w
# ================================================================== helpers (shared by the S2 env scripts)
LMW = [1.0]                                       # lightmap density weight for objects created from now on
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


# ================================================================== prop library
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

