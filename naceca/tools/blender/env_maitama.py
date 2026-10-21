"""NACECA S2 · a quiet, wealthy avenue in Maitama, Abuja, 22:15 (key 'maitama').

An asphalt avenue along z (x -4..4) with painted kerbs, covered drains and paved sidewalks (to |x| 7),
neem and palm trees, tall sodium street lights. High compound walls with heavy steel gates and
electric fencing on both sides: west A (z 10..24), west B (z -6..8) -- the empty mansion, gate at
(-7, 1), a gatehouse with a lit window and the visitor book -- and east C (z -20..-6) with its own
gatehouse. A mai-shayi (tea seller) under a neem on the east sidewalk at (6, 4). Pale mansions with
dark windows rise behind the walls; Abuja at night and Aso Rock to the east on the panorama.

    cd /tmp && python3 ROOT/blender/env_maitama.py ROOT/art13/work [samples]

Dynamic nodes: Glows / GlowsCool (lamps, windows, the stove ring), Pano. Vehicles are anchors.
Uses envkit for geometry, bake and export; lightmap UVs are laid out here (see lightmap_uvs).
"""
import sys, os, math, random, json, time, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from envkit import Kit, G, lin
import bpy, bmesh
from mathutils import Vector

OUT = sys.argv[1]
SAMPLES = int(sys.argv[2]) if len(sys.argv) > 2 else 128
K = Kit('maitama', OUT)
R = random.Random(6421)
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
    cols = ['#5a6a2a', '#7a7a34', '#8a6a2a', '#4a5a24', '#6a5a2a', '#9a8a4a', '#e8e8e0']
    for i in range(count):
        x, z = rr.uniform(x0, x1), rr.uniform(z0, z1)
        s = 0.05 + rr.random() * 0.1; a = rr.random() * PI
        c, sn = math.cos(a) * s, math.sin(a) * s
        poly([(x - c, y, z - sn), (x + sn, y, z - c), (x + c, y, z + sn), (x - sn, y, z + c)], [(0, 3, 2, 1)], 'plain', rr.choice(cols), lm='top')


# ================================================================== materials (bounce albedo for the bake)
for n, b in [('mt_asphalt', '#38393b'), ('mt_paving', '#7a645a'), ('mt_wall', '#d8cdb6'), ('mt_wall_b', '#cfccc4'), ('mt_wall_c', '#d8c8a8'),
             ('mt_mansion', '#e6e0d2'), ('mt_gate', '#202226'), ('mt_kerb', '#808080'), ('mt_roof', '#3a2a28'), ('mt_signs', '#808080'), ('mt_pano', '#080a12')]:
    K.mat(n, base=b)

def bank_y(x, z): return 0.0      # (palm/tree helpers) flat ground

# ================================================================== lights: city sky + a faint moon (the street is lit by sodium lamps)
K.world('#161e34', 1.3)
K.sun((0.35, -0.55, 0.76), '#a8b8e0', 0.3, angle=0.04)            # low moon from the north-north-west

# ================================================================== the avenue: asphalt, markings, kerbs, covered drains, paved sidewalks
K.plane((0, 0, 0), 8.0, 68.0, 'mt_asphalt', uv=1 / 4)              # x -4..4, z -34..34
for k in range(-11, 11):                                            # dashed centre line
    z = k * 6.0 + 1.5
    cube(-0.06, 0.06, 0.0, 0.006, z - 1.5, z + 1.5, 'plain', '#d8d4c4', faces='Y', lm='top')
for s in (-1, 1):
    x0 = s * 3.72
    cube(min(x0, x0 + s * 0.12), max(x0, x0 + s * 0.12), 0.0, 0.006, -34, 34, 'plain', '#cfcabb', faces='Y')     # edge line
    xa, xb = sorted((s * 3.95, s * 4.15))
    cube(xa, xb, 0.0, 0.13, -34, 34, 'kerb', uv=1.0, faces='Y')                                                  # kerb top
    cube(xa, xb, 0.0, 0.13, -34, 34, 'mt_kerb', uv=0.5, faces='X' if s < 0 else 'x')                             # painted black/white face
    xa, xb = sorted((s * 4.15, s * 4.6))
    cube(xa, xb, 0.0, 0.02, -34, 34, 'concrete', uv=0.5, faces='Y')                                              # drain cover slabs
    for k in range(-34, 34):
        z = k + 0.5
        cube(xa + 0.06, xb - 0.06, 0.02, 0.024, z - 0.03, z + 0.03, 'plain', '#141412', faces='Y', lm='top')     # slab joints / slots
    xa, xb = sorted((s * 4.6, s * 7.0))
    LMW[0] = 1.25
    cube(xa, xb, 0.0, 0.02, -34, 34, 'mt_paving', uv=0.5, faces='Y')                                             # interlocking pavers
    LMW[0] = 1.0
for (x, z) in [(0.0, -18.0), (0.0, 14.0)]:                                                                       # manhole covers
    K.cyl((x + 1.6, 0.0, z), 0.32, 0.008, 'plain', '#26282a', seg=10)
for k in range(-6, 7):                                                                                           # road studs
    for s in (-1, 1): K.box((s * 3.6, 0.0, k * 6.0 + 4.5), (0.1, 0.02, 0.1), 'plain', '#e8e4d0')

# ================================================================== compound walls, pillars, gates, electric fence
LMW[0] = 1.7
def fence_wires(x, z0, z1, top):
    for k in range(4):
        beam((x, top + 0.18 + k * 0.14, z0), (x, top + 0.18 + k * 0.14, z1), 0.012, 'plain', '#6a6a66', sides=3)
    n = int((z1 - z0) / 2.5)
    for k in range(n + 1):
        z = z0 + k * (z1 - z0) / max(1, n)
        beam((x, top, z), (x - 0.0, top + 0.68, z), 0.035, 'plain', '#2a2a2a', sides=3)

def wall(s, z0, z1, mat, h=3.0, pillars=4.0, fence=True):
    """compound wall: street face at x = s*7.0, 0.25 thick, plinth, coping, pillars, electric fence"""
    xf, xb = s * 7.0, s * 7.25
    xa, xz = min(xf, xb), max(xf, xb)
    face = 'X' if s < 0 else 'x'
    cube(xa, xz, 0, h, z0, z1, mat, uv=0.5, faces=face + 'zZ', collide=True, block=True)
    cube(min(xf, xf - s * 0.04), max(xf, xf - s * 0.04), 0, 0.5, z0, z1, 'plain', '#6e6658', faces=face + 'Y')   # plinth band
    cube(min(xf - s * 0.08, xb + s * 0.05), max(xf - s * 0.08, xb + s * 0.05), h, h + 0.1, z0, z1, 'concrete', uv=1.0, faces=face + 'YyzZ')
    n = max(1, int(round((z1 - z0) / pillars)))
    for k in range(n + 1):
        z = z0 + k * (z1 - z0) / n
        za, zb = max(z0, z - 0.22), min(z1, z + 0.22)
        cube(min(xf - s * 0.1, xb), max(xf - s * 0.1, xb), 0, h + 0.25, za, zb, mat, uv=0.5, faces=face + 'zZ')
        cube(min(xf - s * 0.16, xb + s * 0.06), max(xf - s * 0.16, xb + s * 0.06), h + 0.25, h + 0.36, za - 0.06, zb + 0.06, 'concrete', uv=1.0, faces=face + 'YyzZ')
    if fence: fence_wires(s * 7.12, z0, z1, h + 0.1)

def gate(s, zc, width=4.2, mat='mt_wall', h=3.0, lamps=(True, True), plate=None, ped=None):
    """a heavy double steel gate recessed between deep pillars; globe lamps on the pillar caps"""
    xf = s * 7.0
    z0, z1 = zc - width / 2, zc + width / 2
    xg = s * 7.4                                                             # leaves set back 0.4 m
    for (za, zb) in ((z0 - 0.55, z0), (z1, z1 + 0.55)):
        cube(min(xf - s * 0.12, s * 7.7), max(xf - s * 0.12, s * 7.7), 0, h + 0.4, za, zb, mat, uv=0.5, faces=('X' if s < 0 else 'x') + 'zZ', collide=True, block=True)
        cube(min(xf - s * 0.2, s * 7.8), max(xf - s * 0.2, s * 7.8), h + 0.4, h + 0.55, za - 0.08, zb + 0.08, 'concrete', uv=1.0, faces='xXYyzZ')
    for k, (za, zb) in enumerate(((z0 - 0.55, z0), (z1, z1 + 0.55))):
        lx, lz = s * 7.33, (za + zb) / 2
        K.cyl((lx, h + 0.55, lz), 0.07, 0.12, 'plain', '#2a2a2a', seg=6)
        if lamps[k]:
            ob = K.sphere((lx, h + 0.82, lz), 0.16, 'glow', '#fff0d2', seg=8, kind='Glows'); _bake_glow(ob, '#fff0d2')
            K.point((lx - s * 0.1, h + 0.82, lz), '#ffe4bc', 38, 0.16)
        else:
            K.sphere((lx, h + 0.82, lz), 0.15, 'plain', '#8a8a86', seg=6)
    rot = PI / 2 if s < 0 else -PI / 2
    for k in range(2):                                                        # two leaves
        lz0 = z0 + k * width / 2; lz1 = lz0 + width / 2
        cube(min(xg, xg + s * 0.08), max(xg, xg + s * 0.08), 0.05, h - 0.1, lz0 + 0.02, lz1 - 0.02, 'plain', '#141518', faces='xXYzZ')
        quadv(xg - s * 0.005, 0.05, (lz0 + lz1) / 2, width / 2 - 0.04, h - 0.15, rot, 'mt_gate')
    cube(min(xf, xg), max(xf, xg), 0.0, 0.03, z0, z1, 'concrete', uv=0.5, faces='Y')            # apron
    K.obstacle(s * 7.45, zc, 0.3, width)
    K.blocker(s * 7.45, h / 2, zc, 0.2, h, width)
    if plate is not None:
        quadv(xf - s * 0.13, 1.9, z1 + 0.275, 0.4, 0.2, rot, 'mt_signs', uvrect=atlas(plate * 256, 128, plate * 256 + 256, 256, H=512))

# west compounds: G (z 24..40), A (10..24, gate z 17), [pillar gap], B (-6..8, the target, gate z 1), D (-40..-6)
wall(-1, 24.0, 34.0, 'mt_wall_c')
wall(-1, 19.65, 24.0, 'mt_wall'); gate(-1, 17.0, plate=0); wall(-1, 10.0, 14.35, 'mt_wall')
wall(-1, 8.0, 10.0, 'mt_wall_b', pillars=2.0)
wall(-1, 3.65, 8.0, 'mt_wall_b'); gate(-1, 1.0, mat='mt_wall_b', lamps=(False, True), plate=1)
wall(-1, -6.0, -4.6, 'mt_wall_b', pillars=1.4)
wall(-1, -34.0, -6.0, 'mt_wall_c')
# east compounds: H (-40..-20), C (-20..-6, gate z -13 + gatehouse), E (-6..12, gate z 9), F (12..40, gate z 21)
wall(1, -34.0, -20.0, 'mt_wall_b')
wall(1, -20.0, -15.65, 'mt_wall'); gate(1, -13.0, plate=2); wall(1, -7.8, -6.0, 'mt_wall', pillars=1.8)
wall(1, -6.0, 6.35, 'mt_wall_c'); gate(1, 9.0, mat='mt_wall_c', plate=3); wall(1, 11.65, 12.0, 'mt_wall_c', pillars=0.35)
wall(1, 12.0, 18.35, 'mt_wall_b'); gate(1, 21.0, mat='mt_wall_b', lamps=(True, False)); wall(1, 23.65, 34.0, 'mt_wall_b')

def gatehouse(s, z0, z1, xw, win_z, sign=True):
    """a gatehouse straddling the wall line, its street wall at x = xw with a lit window (counter inside at sill height)"""
    xb = s * 9.6
    xa, xz = min(xw, xb), max(xw, xb)
    face = 'X' if s < 0 else 'x'
    H = 2.75
    # street wall with a window opening (0.9 wide, 0.95..1.85 high) around win_z
    wz0, wz1 = win_z - 0.45, win_z + 0.45
    for (za, zb) in ((z0, wz0), (wz1, z1)): cube(min(xw, xw - s * 0.02), max(xw, xw - s * 0.02), 0, H, za, zb, 'mt_wall_b', uv=0.5, faces=face + 'zZ')
    cube(min(xw, xw - s * 0.02), max(xw, xw - s * 0.02), 0, 0.95, wz0, wz1, 'mt_wall_b', uv=0.5, faces=face)
    cube(min(xw, xw - s * 0.02), max(xw, xw - s * 0.02), 1.85, H, wz0, wz1, 'mt_wall_b', uv=0.5, faces=face)
    cube(xa, xz, 0, H, z0, z0 + 0.15, 'mt_wall_b', uv=0.5, faces='zZ'); cube(xa, xz, 0, H, z1 - 0.15, z1, 'mt_wall_b', uv=0.5, faces='zZ')
    cube(xa - 0.12, xz + 0.12, H, H + 0.15, z0 - 0.12, z1 + 0.12, 'concrete', uv=1.0, faces='xXYyzZ')
    K._collide(((xa + xz) / 2, 0, (z0 + z1) / 2), (xz - xa, 1, z1 - z0), 0, True, True)
    # the lit interior behind the window: walls facing in, a counter with the visitor book, a fluorescent tube
    cube(min(xw, xw - s * -2.6), max(xw, xw - s * -2.6), 0, H - 0.05, z0 + 0.15, z1 - 0.15, 'wall_plaster', uv=1.0, faces=('x' if s < 0 else 'X') + 'zZ', flip=True)
    cube(min(xw, xw - s * -2.6), max(xw, xw - s * -2.6), H - 0.07, H - 0.05, z0 + 0.15, z1 - 0.15, 'plain', '#e0dcd0', faces='y')
    tx0, tx1 = sorted((xw - s * -0.06, xw - s * -0.62))
    cube(tx0, tx1, 0.9, 0.95, wz0 - 0.1, wz1 + 0.1, 'planks', uv=1.0, faces='xXYzZ')          # counter at sill height
    for zz in (wz0 - 0.05, wz1 + 0.05): beam(((tx0 + tx1) / 2, 0, zz), ((tx0 + tx1) / 2, 0.9, zz), 0.05, 'plain', '#3a2a1c', sides=3)
    bx = xw - s * -0.3
    K.box((bx, 0.95, win_z), (0.32, 0.025, 0.42), 'plain', '#2a3a6a')                          # the visitor book (open, pages up)
    ob = poly([(bx - 0.15, 0.977, win_z - 0.2), (bx + 0.15, 0.977, win_z - 0.2), (bx + 0.15, 0.977, win_z + 0.2), (bx - 0.15, 0.977, win_z + 0.2)], [(0, 3, 2, 1)], 'mt_signs', uv=None)
    uvs = ob.data.uv_layers['UVMap'].data
    for li, (u, v) in enumerate([(0.5, 0.25), (1.0, 0.25), (1.0, 0.5), (0.5, 0.5)]): uvs[li].uv = (u, v)
    K.box((bx + s * 0.05, 0.95, win_z + 0.3), (0.05, 0.12, 0.05), 'plain', '#1a1a1a')           # a pen holder
    tube(xw - s * -1.2, H - 0.12, (z0 + z1) / 2, length=1.2, axis='z', watts=70, color='#f0f6ff', light='#eef3ff')
    chair(xw - s * -1.1, win_z + 0.1, PI / 2 if s < 0 else -PI / 2, '#3a6ab8')
    if sign:
        quadv(xw - s * 0.035, 2.02, win_z, 1.4, 0.35, PI / 2 if s < 0 else -PI / 2, 'mt_signs', uvrect=atlas(512, 0, 1024, 128, H=512))
        gquad(xw - s * 0.03, 0.96, win_z, 0.9, 0.89, PI / 2 if s < 0 else -PI / 2, '#3a3c40') if False else None

# west B: the gatehouse at (-7.4, -3.2) with its window and visitor book facing the sidewalk (anchors gatehouse / visitor_book)
gatehouse(-1, -4.6, -1.65, -6.45, -3.2)
# east C: its own gatehouse north of gate C
gatehouse(1, -10.35, -7.8, 6.45, -9.1, sign=False)
quadv(-6.99, 1.2, 6.6, 0.8, 0.4, PI / 2, 'mt_signs', uvrect=atlas(0, 256, 256, 384, H=512))     # NO PARKING on B's wall
quadv(6.99, 1.3, -18.0, 0.8, 0.4, -PI / 2, 'mt_signs', uvrect=atlas(256, 256, 512, 384, H=512))  # BEWARE OF DOGS on C's wall

# ================================================================== mansions behind the walls (big, pale, dark windows)
LMW[0] = 0.32
def hip_roof(x0, x1, z0, z1, y, rise, mat='mt_roof', over=0.5):
    x0 -= over; x1 += over; z0 -= over; z1 += over
    if (x1 - x0) >= (z1 - z0):
        r0, r1 = (x0 + (z1 - z0) / 2, (z0 + z1) / 2), (x1 - (z1 - z0) / 2, (z0 + z1) / 2)
    else:
        r0, r1 = ((x0 + x1) / 2, z0 + (x1 - x0) / 2), ((x0 + x1) / 2, z1 - (x1 - x0) / 2)
    A, B, C, D = (x0, y, z0), (x1, y, z0), (x1, y, z1), (x0, y, z1)
    P, Q = (r0[0], y + rise, r0[1]), (r1[0], y + rise, r1[1])
    ob = poly([A, B, C, D, P, Q], [(0, 1, 5, 4), (1, 2, 5), (2, 3, 4, 5), (3, 0, 4)] if (x1 - x0) >= (z1 - z0) else [(0, 1, 4), (1, 2, 5, 4), (2, 3, 5), (3, 0, 4, 5)], mat, uv=0.5)
    bm = bmesh.new(); bm.from_mesh(ob.data)
    for f in bm.faces:
        if f.normal.z < 0: f.normal_flip()
    bm.to_mesh(ob.data); bm.free()
    cube(x0, x1, y - 0.25, y, z0, z1, 'plain', '#e8e2d6', faces='xXzZy')                     # fascia

def mansion(x0, x1, z0, z1, floors=2, lit=(), roof='hip', seed=0, s=-1, portico=False):
    rr = random.Random(seed)
    H = 3.4 * floors
    face = 'X' if s < 0 else 'x'                                       # the facade facing the avenue
    xf = x1 if s < 0 else x0
    cube(x0, x1, 0, H, z0, z1, 'mt_mansion', uv=0.5, faces=face + 'zZ')
    for f in range(floors):
        cube(min(xf, xf - s * 0.15), max(xf, xf - s * 0.15), 3.4 * (f + 1) - 0.15, 3.4 * (f + 1), z0, z1, 'concrete', uv=1.0, faces=face + 'Yy')
    nw = int((z1 - z0) / 2.6)
    k_lit = 0
    for f in range(floors):
        for w in range(nw):
            zc = z0 + (w + 0.5) * (z1 - z0) / nw; y0 = 3.4 * f + 1.0
            rot = PI / 2 if s < 0 else -PI / 2
            if (f, w) in lit:
                gquad(xf - s * 0.02, y0, zc, 1.1, 1.6, rot, '#f2c890')
                K.point((xf + s * 0.6, y0 + 1.0, zc), '#ffcf90', 30, 0.3)
            else:
                quadv(xf - s * 0.02, y0, zc, 1.1, 1.6, rot, 'mt_signs', uvrect=atlas(512 + (w % 3) * 60, 384, 512 + (w % 3) * 60 + 300, 512, H=512))
            cube(min(xf, xf - s * 0.1), max(xf, xf - s * 0.1), y0 - 0.1, y0, zc - 0.65, zc + 0.65, 'concrete', uv=1.0, faces=face + 'Y')
    if roof == 'hip':
        hip_roof(x0, x1, z0, z1, H, 2.4)
    else:
        cube(x0 - 0.2, x1 + 0.2, H, H + 0.8, z0 - 0.2, z1 + 0.2, 'mt_mansion', uv=0.5, faces='xXzZ')
        cube(x0, x1, H + 0.2, H + 0.22, z0, z1, 'plain', '#6a6a66', faces='Y')
    if portico:
        zc = (z0 + z1) / 2
        for dz in (-2.2, -0.8, 0.8, 2.2):
            K.cyl((xf - s * 1.6, 0, zc + dz), 0.28, H - 0.1, 'mt_mansion', seg=10, uv=0.5)
        cube(min(xf, xf - s * 2.1), max(xf, xf - s * 2.1), H - 0.4, H + 0.1, zc - 2.9, zc + 2.9, 'mt_mansion', uv=0.5, faces='xXYzZ')
        poly([(xf - s * 2.1, H + 0.1, zc - 2.9), (xf - s * 2.1, H + 0.1, zc + 2.9), (xf - s * 0.0, H + 1.6, zc)], [(0, 1, 2)], 'mt_mansion', uv=0.5)
    # a dish on the roof, a couple of royal palms and some shrubs in the compound
    if rr.random() < 0.7:
        dx = x0 + (x1 - x0) * 0.3; dz = z0 + (z1 - z0) * 0.7
        K.cyl((dx, H + (2.0 if roof == 'hip' else 0.3), dz), 0.04, 0.6, 'plain', '#4a4a4a', seg=4)

mansion(-26.0, -13.0, 12.0, 22.0, lit=((1, 1), (0, 3)), seed=1, s=-1)
mansion(-26.0, -12.5, -3.6, 6.4, lit=(), seed=2, s=-1, portico=True)           # the empty mansion behind gate B
mansion(-24.0, -13.5, -24.0, -10.0, lit=((1, 2),), seed=3, s=-1, roof='flat')
mansion(-22.0, -12.0, 27.0, 36.0, lit=(), seed=4, s=-1)
mansion(16.0, 26.0, -18.5, -8.5, lit=((0, 1),), seed=5, s=1, roof='flat')
mansion(15.0, 25.0, -3.0, 10.0, floors=1, lit=((0, 0), (0, 3)), seed=6, s=1)
mansion(16.0, 25.0, 15.0, 26.0, lit=((0, 2),), seed=7, s=1)
mansion(13.0, 22.0, -34.0, -24.0, lit=(), seed=8, s=1, roof='flat')

# ================================================================== trees: neems on the sidewalks, palms, compound greenery
LMW[0] = 0.7
def neem(x, z, h=7.0, r=3.2, seed=0):
    rr = random.Random(seed)
    beam((x, 0, z), (x + 0.15, h * 0.42, z - 0.1), 0.38, 'bark', None, t2=0.26, sides=5, uv=1.0)
    for k in range(3):
        a = rr.random() * 2 * PI
        beam((x + 0.15, h * 0.4, z - 0.1), (x + math.cos(a) * r * 0.5, h * 0.62, z + math.sin(a) * r * 0.5), 0.18, 'bark', None, t2=0.07, sides=4, uv=1.0)
    for k in range(8):
        a = rr.random() * 2 * PI; d = rr.random() * r * 0.6
        ob = K.sphere((x + math.cos(a) * d, h * (0.66 + rr.random() * 0.2), z + math.sin(a) * d), r * (0.42 + rr.random() * 0.2), 'plain',
                      rr.choice(['#24381e', '#2a4022', '#203420', '#2e4626']), seg=6, sy=0.7)
        ob['lm'] = 'top'
    cube(x - 0.55, x + 0.55, 0.0, 0.025, z - 0.55, z + 0.55, 'plain', '#3a3024', faces='Y', lm='top')                  # tree pit
    K._collide((x, 0, z), (0.5, 1, 0.5), 0, True, False)

for i, (x, z) in enumerate([(-5.7, 22.6), (-5.7, 8.9), (-5.7, -9.0), (-5.7, -21.5), (6.7, 5.9), (5.8, 13.0), (5.8, -2.0), (5.8, -18.4), (5.8, 27.0), (-5.7, 33.0), (5.8, -30.0)]):
    neem(x, z, h=6.5 + R.random() * 1.5, r=2.8 + R.random() * 0.8, seed=500 + i)
for i, (x, z) in enumerate([(-5.9, 13.0), (5.9, 1.2), (-5.9, -15.6), (5.9, -27.0)]):
    palm(x, z, h=7.5 + R.random() * 1.5, lean=(R.uniform(-0.3, 0.3), R.uniform(-0.3, 0.3)), seed=600 + i, y0=0.0, green='#2a4224')
for i, (x, z) in enumerate([(-9.5, 20.5), (-10.5, 13.2), (-9.0, 5.5), (-9.6, -4.8), (-9.0, -12.0), (9.2, -16.5), (9.8, 2.5), (9.5, 14.0), (9.0, 24.5), (-9.2, 30.0)]):
    palm(x, z, h=9.0 + R.random() * 3.0, lean=(R.uniform(-0.4, 0.4), R.uniform(-0.4, 0.4)), seed=700 + i, y0=0.0, green='#263c20')
for i, (x, z) in enumerate([(-8.4, 17.0 - 3.5), (-8.2, 23.0), (8.3, -6.8), (8.2, 7.2), (8.4, 13.0), (-8.3, -8.0), (-8.0, 7.2)]):     # shrubs and bougainvillea over the walls
    for k in range(3):
        ob = K.sphere((x + R.uniform(-0.6, 0.6), 2.6 + R.random() * 0.8, z + R.uniform(-1.2, 1.2)), 0.7 + R.random() * 0.4, 'plain',
                      R.choice(['#28401f', '#2e4824', '#9a2a5a', '#b03a6a']) if k == 0 else R.choice(['#28401f', '#2e4824']), seg=6, sy=0.75)
        ob['lm'] = 'top'

# ================================================================== street lights (tall, sodium)
LMW[0] = 1.0
def street_light(s, z, watts=640):
    x = s * 4.85
    beam((x, 0, z), (x, 9.2, z), 0.2, 'plain', '#5a5c5e', t2=0.12, sides=6)
    beam((x, 9.0, z), (x - s * 2.1, 9.35, z), 0.09, 'plain', '#5a5c5e', sides=4)
    K.box((x - s * 2.35, 9.2, z), (0.75, 0.16, 0.34), 'plain', '#3a3c3e')
    gbox((x - s * 2.35, 9.14, z), (0.6, 0.06, 0.26), '#ffa850')
    K.area((x - s * 2.35, 9.0, z), (0.6, 0.3), '#ffa448', 420, (0, -1, 0))
    K.point((x - s * 2.35, 8.85, z), '#ff9a40', 90, 0.3)
    cube(x - 0.25, x + 0.25, 0, 0.35, z - 0.25, z + 0.25, 'concrete', uv=1.0, faces='xXYzZ')
    K._collide((x, 0, z), (0.5, 1, 0.5), 0, True, False)
for (s, z) in [(-1, 26.0), (-1, 5.6), (-1, -13.0), (1, 15.8), (1, -5.0), (1, -24.0), (-1, -33.5), (1, 35.0)]:
    street_light(s, z)
beam((-6.6, 0, -26.0), (-6.6, 2.6, -26.0), 0.07, 'plain', '#3a3a3a', sides=4)                                  # street name sign
quadv(-6.6, 2.3, -25.97, 1.2, 0.3, 0.0, 'mt_signs', uvrect=atlas(0, 0, 512, 128, H=512)); quadv(-6.6, 2.3, -26.03, 1.2, 0.3, PI, 'mt_signs', uvrect=atlas(0, 0, 512, 128, H=512))
K._collide((-6.6, 0, -26.0), (0.15, 1, 0.15), 0, True, False)
# a cool-white security flood on compound E's wall, lighting the sidewalk by the kiosk
K.box((7.05, 3.2, -1.5), (0.18, 0.2, 0.32), 'plain', '#2a2a2a')
gbox((6.94, 3.12, -1.5), (0.04, 0.16, 0.26), '#e6f0ff', kind='GlowsCool')
K.area((6.7, 3.1, -1.5), (0.3, 0.3), '#dfe8ff', 160, (-0.7, -1, 0))

# ================================================================== the mai-shayi (tea seller) under the neem at (6, 0, 4)
LMW[0] = 1.6
TX0, TX1, TZ0, TZ1 = 5.55, 6.05, 3.85, 5.15
cube(TX0, TX1, 0.78, 0.82, TZ0, TZ1, 'planks', uv=1.0, faces='xXYzZ', collide=True)
for (x, z) in [(TX0 + 0.04, TZ0 + 0.04), (TX1 - 0.04, TZ0 + 0.04), (TX0 + 0.04, TZ1 - 0.04), (TX1 - 0.04, TZ1 - 0.04)]: beam((x, 0, z), (x, 0.78, z), 0.05, 'plain', '#3a2a1c', sides=3)
quadv(TX0 - 0.005, 0.1, (TZ0 + TZ1) / 2, TZ1 - TZ0, 0.66, -PI / 2, 'tarp_blue')
K.cyl((5.8, 0.82, 4.75), 0.13, 0.1, 'plain', '#2a2a2a', seg=8)                       # kerosene stove
gbox((5.8, 0.9, 4.75), (0.16, 0.02, 0.16), '#6aa0ff', kind='GlowsCool')               # its blue ring
K.cyl((5.8, 0.94, 4.75), 0.14, 0.2, 'plain', '#b8bcc0', seg=8, r2=0.1)                # the big kettle
beam((5.8 - 0.1, 1.06, 4.75), (5.8 - 0.24, 1.12, 4.75), 0.03, 'plain', '#b8bcc0', sides=3)
for (z, col) in [(4.1, '#c83a2a'), (4.3, '#2a6ab8'), (4.48, '#e8c020')]: K.cyl((5.72, 0.82, z), 0.06, 0.3, 'plain', col, seg=6)   # flasks
for k in range(3): K.box((5.95, 0.82 + k * 0.08, 4.25), (0.18, 0.08, 0.34), 'plain', '#e0b878')     # agege loaves in wrappers
for k in range(4): K.cyl((5.62 + (k % 2) * 0.1, 0.82, 4.95 + (k // 2) * 0.1), 0.035, 0.1, 'plain', R.choice(['#e8e8e0', '#2a4a8a', '#c83a2a']), seg=5)   # tins and cups
K.box((5.95, 0.82, 4.98), (0.14, 0.09, 0.07), 'plain', '#1a1a1a')                     # the small radio
lantern(5.66, 0.82, 4.62, watts=34)
bulb(5.75, 2.35, 4.6, watts=16, cord=3.6)                                             # a bulb tied to the neem, off a car battery
K.box((6.55, 0, 5.4), (0.42, 0.24, 0.18), 'plain', '#1a1a1a')                         # the battery
stool(6.45, 4.45, '#6a4a2c', h=0.45)
cube(4.7, 5.75, 0.42, 0.47, 3.05, 3.38, 'planks', uv=1.0, faces='xXYzZ')              # customers' bench (anchor 'bench')
for x in (4.8, 5.65): cube(x - 0.04, x + 0.04, 0, 0.42, 3.1, 3.33, 'plain', '#3a2a1c', faces='xXzZ')
chair(4.75, 4.85, PI / 2 + 0.3, '#d8d4cc'); chair(6.1, 2.9, -0.6, '#3a6ab8')
for k in range(5): K.box((5.0 + R.random() * 1.6, 0.02, 2.6 + R.random() * 3.0), (0.06, 0.01, 0.09), 'plain', '#d8d0b8', rot=R.random() * 3)     # bread wrappers, cups
K.cyl((4.95, 0, 5.25), 0.2, 0.42, 'plain', '#2a6ab8', seg=8, r2=0.23)                # water bucket

# ================================================================== DYNAMIC: panorama
o = K.strip((0, 0), 85, 44, -PI, PI, 'mt_pano', seg=48, y0=-2.0, kind='Pano')
flip_normals(o); bake_invisible(o)

# ================================================================== vehicles (anchors) + bake-only contact shadows
K.anchor('Sedan', (3.0, 0, -7.0), veh='sedan', rot=0.0, color='#c9ccc7')
K.anchor('Suv', (-3.0, 0, 21.6), veh='suv', rot=PI, color='#e8e8e4')
K.box((3.0, 0.25, -7.0), (1.6, 0.9, 4.4), 'plain', '#202020', kind='bake')
K.box((-3.0, 0.3, 21.6), (1.7, 1.1, 4.5), 'plain', '#202020', kind='bake')

# ================================================================== ANCHORS
K.anchor('start', (3, 0, 22), rot=PI)
K.anchor('uche_start', (4.2, 0, 22.5), rot=PI)
K.anchor('gate_b', (-7.0, 0, 1.0), rot=-PI / 2)
K.anchor('gatehouse', (-6.2, 0, -3.2), rot=-PI / 2)
K.anchor('visitor_book', (-6.6, 1.0, -3.2))
K.anchor('gate_c', (7.0, 0, -13.0), rot=PI / 2)
K.anchor('gatehouse_c', (6.2, 0, -9.1), rot=PI / 2)
K.anchor('shayi', (6.4, 0, 4.4), rot=-PI / 2)
K.anchor('bench', (5.2, 0, 3.2), rot=0.0)
K.anchor('gatemen', (0, 0, 0), list=[[4.95, 3.22, 0.0], [5.5, 3.22, 0.0], [4.85, 4.9, PI / 2 + 0.3], [6.2, 2.85, -0.6]])
K.anchor('suv_arrive', (2, 0, 26), rot=PI)
K.anchor('suv_stop', (-2.5, 0, 2), rot=PI)
K.bounds(-14, 14, -28, 28)

# ================================================================== the avenue continues beyond the play area (low lightmap density)
LMW[0] = 0.22
for (za, zb) in [(34.0, 62.0), (-62.0, -34.0)]:
    K.plane((0, 0, (za + zb) / 2), 8.0, zb - za, 'mt_asphalt', uv=1 / 4)
    for s_ in (-1, 1):
        xa, xb = sorted((s_ * 3.95, s_ * 4.15)); cube(xa, xb, 0.0, 0.13, za, zb, 'mt_kerb', uv=0.5, faces=('X' if s_ < 0 else 'x') + 'Y')
        xa, xb = sorted((s_ * 4.15, s_ * 7.0)); cube(xa, xb, 0.0, 0.02, za, zb, 'mt_paving', uv=0.5, faces='Y')
        xa, xb = sorted((s_ * 7.0, s_ * 7.25)); cube(xa, xb, 0, 3.0, za, zb, R.choice(['mt_wall', 'mt_wall_b', 'mt_wall_c']), uv=0.5, faces=('X' if s_ < 0 else 'x'))
        cube(xa, xb, 3.0, 3.1, za, zb, 'concrete', uv=1.0, faces=('X' if s_ < 0 else 'x') + 'Y')
    for k in range(int((zb - za) / 6)):
        cube(-0.06, 0.06, 0.0, 0.006, za + 1.5 + k * 6, za + 4.5 + k * 6, 'plain', '#d8d4c4', faces='Y', lm='top')
for (s_, z) in [(1, 46.0), (-1, -46.0)]:
    x = s_ * 4.85
    beam((x, 0, z), (x, 9.2, z), 0.2, 'plain', '#5a5c5e', t2=0.12, sides=5); beam((x, 9.0, z), (x - s_ * 2.1, 9.35, z), 0.09, 'plain', '#5a5c5e', sides=3)
    gbox((x - s_ * 2.35, 9.14, z), (0.6, 0.06, 0.26), '#ffa850'); K.area((x - s_ * 2.35, 9.0, z), (0.6, 0.3), '#ffa448', 420, (0, -1, 0))
for i, (x, z) in enumerate([(-5.7, 40.0), (5.8, 52.0), (-5.7, -40.0), (5.8, -50.0)]):
    neem(x, z, h=7.0, r=3.0, seed=800 + i)

# ================================================================== a little life: gatemen's chairs, hedge planters, leaf litter
LMW[0] = 1.2
chair(-6.2, 20.2, PI / 2 + 0.4, '#d8d4cc'); K.box((-6.4, 0, 20.9), (0.3, 0.32, 0.3), 'plain', '#2a6ab8')          # by gate A, a chair and a cooler
chair(6.25, -16.1, -PI / 2 - 0.3, '#3a6ab8'); chair(6.1, -16.9, -PI / 2 + 0.2, '#d8d4cc')                         # by gate C
for (s, z0, z1) in [(-1, 10.6, 13.9), (1, 24.2, 30.0), (1, 12.4, 17.8)]:                                            # ixora hedge planters
    xa, xb = sorted((s * 6.45, s * 6.98))
    cube(xa, xb, 0, 0.32, z0, z1, 'concrete', uv=1.0, faces='xXYzZ', collide=True)
    for k in range(int((z1 - z0) / 0.7)):
        ob = K.sphere(((xa + xb) / 2, 0.42, z0 + 0.35 + k * 0.7), 0.36, 'plain', R.choice(['#2a4422', '#30502a', '#26401e']), seg=6, sy=0.8); ob['lm'] = 'top'
        if R.random() < 0.5: K.sphere(((xa + xb) / 2 + R.uniform(-0.1, 0.1), 0.68, z0 + 0.35 + k * 0.7), 0.1, 'plain', '#c8302a', seg=5)
for (x, z) in [(-5.7, 22.6), (-5.7, 8.9), (-5.7, -9.0), (-5.7, -21.5), (6.7, 5.9), (5.8, 13.0), (5.8, -2.0), (5.8, -18.4)]:   # fallen neem leaves
    litter(x - 1.6, x + 1.6, z - 1.8, z + 1.8, 14, seed=int(abs(x * 7 + z * 13)), y=0.025)

build(lm=1024, samples=SAMPLES, margin=3, percentile=99.3, denoise=0.32)
