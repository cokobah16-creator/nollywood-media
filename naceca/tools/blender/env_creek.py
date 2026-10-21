"""NACECA S2 · illegal kpo-fire refining camp deep in the Ethiope creeks, 01:20 (key 'creek').

A raised mud island (x -10..12, z -8..10) in black water, ringed by mangroves -- dead and oil-black
near the camp, alive further out. Three drum stills on fire pits, a crude pit, drum stacks, a tarp
shelter with the waybills, a generator with one bulb; the barge TEKENA 2 at a plank jetty, a
speedboat by the escort's landing stage; the player arrives at a boat landing (-14, 14) and a chase
boardwalk runs north then east through the mangroves. Cool moonlight; the camp is lit by its fires.

    cd /tmp && python3 ROOT/blender/env_creek.py ROOT/art13/work [samples]

Dynamic nodes: Water (y -0.3, animate), Fire (flames + embers of the three stills), Crude (pit and
cooling-pit surfaces), Glows / GlowsCool (lamps), Pano. Smoke is the game's (anchors smoke1..3).
Uses envkit for geometry, bake and export; lightmap UVs are laid out here (see lightmap_uvs).
"""
import sys, os, math, random, json, time, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from envkit import Kit, G, lin
import bpy, bmesh
from mathutils import Vector

OUT = sys.argv[1]
SAMPLES = int(sys.argv[2]) if len(sys.argv) > 2 else 96
K = Kit('creek', OUT)
R = random.Random(5311)
PI = math.pi

# ================================================================== helpers (shared by the S2 env scripts)
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
    cols = ['#e8e8e0', '#d8e0e8', '#e0d0b0', '#c84a3a', '#3a6ab8', '#2a2a2a', '#d0b060']
    for i in range(count):
        x, z = rr.uniform(x0, x1), rr.uniform(z0, z1)
        s = 0.05 + rr.random() * 0.1; a = rr.random() * PI
        c, sn = math.cos(a) * s, math.sin(a) * s
        poly([(x - c, y, z - sn), (x + sn, y, z - c), (x + c, y, z + sn), (x - sn, y, z + c)], [(0, 3, 2, 1)], 'plain', rr.choice(cols), lm='top')

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


# ================================================================== materials (bounce albedo for the bake)
for n, b in [('cr_wall', '#0b120d'), ('cr_mud', '#5e5246'), ('cr_rust', '#5a3a2a'), ('cr_signs', '#4a3a30'), ('cr_water', '#07090a'), ('cr_crude', '#050505'), ('cr_pano', '#05070c')]:
    K.mat(n, base=b)

def bank_y(x, z): return 0.0      # (palm/tree helpers) the island top is at y 0

WATER_Y = -0.3
DECK_Y = 0.03                     # boardwalk / jetty deck tops (just above the island mud)

# ================================================================== lights: moon + sky (the fires are below)
K.world('#0e1830', 1.7)
K.sun((-0.24, -0.64, 0.73), '#9fb4e8', 0.95, angle=0.04)          # moon from the north-north-east

# ================================================================== the island
OUTLINE = [(-10.4, -6.8), (-9.8, -8.0), (-7.5, -8.4), (-4.5, -8.1), (-1.0, -8.6), (1.0, -8.2), (3.0, -8.2), (5.0, -8.5), (7.5, -8.1),
           (9.8, -8.5), (11.8, -7.6), (12.5, -6.0), (12.3, -3.0), (12.1, -0.6), (12.5, 2.0), (12.1, 4.6), (12.4, 7.0), (11.7, 9.6),
           (9.0, 10.3), (5.5, 9.9), (2.0, 10.4), (-1.5, 10.0), (-4.5, 10.4), (-7.2, 10.0), (-8.8, 9.0), (-8.7, 7.6), (-9.0, 6.6),
           (-10.3, 5.9), (-10.4, 4.6), (-10.6, 2.0), (-10.3, -1.5), (-10.8, -4.2)]
def island(outline):
    n = len(outline)
    area = sum(outline[i][0] * outline[(i + 1) % n][1] - outline[(i + 1) % n][0] * outline[i][1] for i in range(n)) / 2
    sgn = 1 if area > 0 else -1
    normals = []
    for i in range(n):
        p0, p1, p2 = outline[i - 1], outline[i], outline[(i + 1) % n]
        acc = [0.0, 0.0]
        for (a, b) in ((p0, p1), (p1, p2)):
            dx, dz = b[0] - a[0], b[1] - a[1]; L = math.hypot(dx, dz)
            nx, nz = (dz / L, -dx / L) if sgn > 0 else (-dz / L, dx / L)
            acc[0] += nx; acc[1] += nz
        L = math.hypot(*acc); normals.append((acc[0] / L, acc[1] / L))
    rings = []
    for (off, y) in [(0.0, 0.0), (0.7, -0.24), (1.7, -0.75)]:
        rings.append([(p[0] + nm[0] * off * (0.85 + 0.3 * math.sin(i * 1.7)), y + (0.04 * math.sin(i * 2.3) if 0 < off < 1 else 0), p[1] + nm[1] * off * (0.85 + 0.3 * math.sin(i * 1.7)))
                      for i, (p, nm) in enumerate(zip(outline, normals))])
    top = poly(rings[0], [list(range(n))], 'cr_mud', uv=1 / 3)
    me = top.data
    if me.polygons[0].normal.z < 0: flip_normals(top)
    for r0, r1 in ((rings[0], rings[1]), (rings[1], rings[2])):
        verts = r0 + r1; faces = [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
        ob = poly(verts, faces, 'cr_mud', uv=1 / 3)
        bm = bmesh.new(); bm.from_mesh(ob.data)
        for f in bm.faces:
            if f.normal.z < 0: f.normal_flip()
        bm.to_mesh(ob.data); bm.free()
island(OUTLINE)

# soot, oil-soaked patches and trodden paths on the island (baked decals)
def blob(x, z, rx, rz, color, rot=0.0, y=0.006, seed=0, n=9):
    rr = random.Random(seed); pts = []
    for i in range(n):
        a = 2 * PI * i / n; k = 0.65 + rr.random() * 0.5
        dx, dz = math.cos(a) * rx * k, math.sin(a) * rz * k
        pts.append((x + dx * math.cos(rot) + dz * math.sin(rot), y, z - dx * math.sin(rot) + dz * math.cos(rot)))
    return poly([(x, y, z)] + pts, [(0, 1 + (i + 1) % n, 1 + i) for i in range(n)], 'plain', color, lm='top')
for i, (x, z, rx, rz) in enumerate([(2, 2, 2.2, 1.7), (5, 4.5, 2.0, 1.6), (8, 1, 2.2, 1.8), (-2, 4, 2.4, 1.8), (-5, -2, 2.2, 1.8), (9, -4, 2.0, 1.6),
                                    (4.0, -2.5, 1.8, 1.2), (10.5, 2.0, 1.4, 1.6), (-1.0, -4.5, 1.6, 1.0)]):
    blob(x, z, rx, rz, R.choice(['#1c1814', '#211b16', '#191512']), rot=R.random() * 3, seed=40 + i)
for i, (x, z, rx, rz) in enumerate([(-6.5, 2.0, 3.2, 0.7), (-1.0, 0.5, 4.0, 0.8), (6.5, -1.5, 3.5, 0.7), (-3.5, 7.5, 3.0, 0.6), (8.5, 6.5, 2.4, 0.7)]):
    blob(x, z, rx, rz, '#5a4c3e', rot=R.uniform(-0.5, 0.5), y=0.004, seed=60 + i)

# ================================================================== boardwalks, landing, jetties (deck tops at DECK_Y)
def deck(x0, x1, z0, z1, along, posts=(), seed=0, piles=True):
    rr = random.Random(seed)
    cube(x0, x1, DECK_Y - 0.06, DECK_Y, z0, z1, 'planks', uv=1.0, faces='xXYzZ')
    if along == 'z':
        for x in (x0 + 0.14, x1 - 0.14): cube(x - 0.06, x + 0.06, DECK_Y - 0.26, DECK_Y - 0.06, z0, z1, 'plain', '#2e2418', faces='xXzZ')
        n = max(2, int((z1 - z0) / 2.0) + 1); pts = [(x, z0 + 0.12 + k * (z1 - z0 - 0.24) / (n - 1)) for k in range(n) for x in (x0 + 0.1, x1 - 0.1)]
    else:
        for z in (z0 + 0.14, z1 - 0.14): cube(x0, x1, DECK_Y - 0.26, DECK_Y - 0.06, z - 0.06, z + 0.06, 'plain', '#2e2418', faces='zZxX')
        n = max(2, int((x1 - x0) / 2.0) + 1); pts = [(x0 + 0.12 + k * (x1 - x0 - 0.24) / (n - 1), z) for k in range(n) for z in (z0 + 0.1, z1 - 0.1)]
    if piles:
        for (x, z) in pts: K.cyl((x, -1.2, z), 0.075, 1.2 + DECK_Y - 0.04, 'plain', '#2a2016', seg=5)
    for (x, z, hgt) in posts:
        K.cyl((x, -1.2, z), 0.08, 1.2 + DECK_Y + hgt, 'plain', '#2a2016', seg=5)
        K._collide((x, 0, z), (0.18, 1, 0.18), 0, True, False)
    for k in range(rr.randint(1, 3)):     # a loose plank or two lying across
        if along == 'z':
            zz = rr.uniform(z0 + 0.5, z1 - 0.5); K.box(((x0 + x1) / 2 + rr.uniform(-0.2, 0.2), DECK_Y, zz), (1.3, 0.03, 0.2), 'planks', uv=1.0, rot=rr.uniform(-0.25, 0.25))
        else:
            xx = rr.uniform(x0 + 0.5, x1 - 0.5); K.box((xx, DECK_Y, (z0 + z1) / 2 + rr.uniform(-0.2, 0.2)), (0.2, 0.03, 1.3), 'planks', uv=1.0, rot=rr.uniform(-0.25, 0.25))

# boat landing (player arrives here) and the boardwalk to the island edge near (-8, 6)
deck(-15.2, -12.8, 12.8, 15.2, 'z', posts=[(-15.1, 15.1, 0.7), (-12.9, 15.1, 0.7), (-15.1, 12.9, 1.6)], seed=1)
beam((-15.1, 1.55, 12.9), (-14.7, 1.62, 12.9), 0.04, 'plain', '#2a2016', sides=3)
lantern(-14.7, 1.15, 12.9, watts=34, hang=1.6)
deck(-14.4, -12.8, 5.2, 12.8, 'z', seed=2)
deck(-14.4, -8.0, 5.2, 6.8, 'x', seed=3)
cube(-8.6, -7.6, DECK_Y - 0.06, DECK_Y, 5.2, 6.8, 'planks', uv=1.0, faces='xXYzZ')            # last boards resting on the mud
for k in range(3): beam((-15.25, -0.5 + k * 0.32, 13.3), (-15.25, -0.5 + k * 0.32, 13.9), 0.05, 'plain', '#3a2c1e', sides=3)   # ladder rungs
beam((-15.25, -0.7, 13.3), (-15.25, DECK_Y, 13.3), 0.06, 'plain', '#3a2c1e', sides=3); beam((-15.25, -0.7, 13.9), (-15.25, DECK_Y, 13.9), 0.06, 'plain', '#3a2c1e', sides=3)
# barge jetty (x 11..15.6, z 0..4) and the escort's landing stage by the speedboat
deck(11.0, 15.6, 0.0, 4.0, 'x', posts=[(15.5, 0.1, 0.5), (15.5, 3.9, 0.5)], seed=4)
beam((14.9, 0, 3.8), (14.9, 2.6, 3.8), 0.08, 'plain', '#2a2016', sides=4); K._collide((14.9, 0, 3.8), (0.14, 1, 0.14), 0, True, False)
beam((14.9, 2.5, 3.8), (15.3, 2.6, 3.3), 0.05, 'plain', '#2a2016', sides=3)
bulb(15.3, 2.28, 3.3, watts=70, cord=2.58, r=0.05)
deck(11.0, 13.8, -5.6, -3.4, 'x', posts=[(13.7, -5.5, 0.45)], seed=5)
# chase boardwalk: north from the island edge at (2, -8) to (2, -18), then east to (14, -18)
deck(1.2, 2.8, -18.8, -7.0, 'z', posts=[(1.25, -12.0, 0.9), (1.25, -15.5, 0.9)], seed=6)
deck(2.8, 15.2, -18.8, -17.2, 'x', posts=[(6.5, -18.75, 0.9), (10.5, -18.75, 0.9)], seed=7)
wire((1.25, DECK_Y + 0.85, -12.0), (1.25, DECK_Y + 0.85, -15.5), sag=0.15, n=4, t=0.02, color='#8a7a5a')
wire((6.5, DECK_Y + 0.85, -18.75), (10.5, DECK_Y + 0.85, -18.75), sag=0.15, n=4, t=0.02, color='#8a7a5a')
beam((2.7, 0, -17.3), (2.7, 1.9, -17.3), 0.08, 'plain', '#2a2016', sides=4)                  # lantern post at the corner
beam((2.7, 1.85, -17.3), (2.3, 1.95, -17.3), 0.05, 'plain', '#2a2016', sides=3)
lantern(2.3, 1.5, -17.3, watts=22, hang=1.95)
K._collide((2.7, 0, -17.3), (0.15, 1, 0.15), 0, True, False)
for k in range(4): beam((15.25, -0.6 + k * 0.3, -18.4), (15.25, -0.6 + k * 0.3, -17.6), 0.05, 'plain', '#3a2c1e', sides=3)   # ladder at the far end

# ================================================================== the camp
def flame(x, y, z, h, w, rot, col):
    c, s = math.cos(rot), math.sin(rot)
    for (cc, ss) in ((c, s), (-s, c)):
        p = [(x - w / 2 * cc, y, z + w / 2 * ss), (x + w / 2 * cc, y, z - w / 2 * ss), (x + 0.04, y + h, z)]
        ob = poly(p, [(0, 1, 2)], 'glow', col, kind='Fire'); _bake_glow(ob, col)
        ob = poly(p, [(2, 1, 0)], 'glow', col, kind='Fire'); _bake_glow(ob, col)

def oven(ox, oz, cool_dx, cool_dz, seed=0):
    """a kpo-fire still: a horizontal drum on a mud fire pit (open at -x), a pipe to a cooling drum standing in a bunded water pit"""
    rr = random.Random(seed)
    mud, soot = '#5a4232', '#1a1410'
    cube(ox - 0.8, ox + 0.8, 0, 0.55, oz - 0.62, oz - 0.38, 'plain', '#3a2c22', faces='xXYzZ')
    cube(ox - 0.8, ox + 0.8, 0, 0.55, oz + 0.38, oz + 0.62, 'plain', '#3a2c22', faces='xXYzZ')
    cube(ox + 0.6, ox + 0.85, 0, 0.62, oz - 0.62, oz + 0.62, 'plain', '#33261e', faces='xXYzZ')
    cube(ox - 0.78, ox + 0.6, 0.53, 0.56, oz - 0.6, oz - 0.4, 'plain', soot, faces='Y'); cube(ox - 0.78, ox + 0.6, 0.53, 0.56, oz + 0.4, oz + 0.6, 'plain', soot, faces='Y')
    K._collide((ox, 0, oz), (1.9, 1, 1.4), 0, True, False)
    # the still: a big blackened drum lying along x on the walls
    K.cyl((ox, 0.97, oz), 0.42, 1.5, 'plain', '#1e1a18', seg=12, axis='x')
    for dx in (-0.72, 0.72): K.cyl((ox + dx, 0.97, oz), 0.435, 0.05, 'plain', '#2a2420', seg=12, axis='x', caps=False)
    K.cyl((ox - 0.2, 1.36, oz), 0.11, 0.12, 'plain', '#2a2420', seg=6)                  # filler cap
    # fire inside the pit: embers, flames licking the drum, a strong orange bake light
    gbox((ox - 0.1, 0.02, oz), (1.2, 0.08, 0.6), '#c83a0e', kind='Fire')
    for k in range(5):
        fx = ox - 0.55 + k * 0.27 + rr.uniform(-0.05, 0.05)
        flame(fx, 0.06, oz + rr.uniform(-0.12, 0.12), 0.35 + rr.random() * 0.25, 0.22, rr.random() * 3, rr.choice(['#ff7a1e', '#ff9a2a', '#ffb840']))
    flame(ox - 0.82, 0.05, oz, 0.42, 0.3, 0.3, '#ff8a24')
    for k in range(4):     # tongues climbing the drum's flanks, visible over the walls
        fx = ox - 0.5 + k * 0.32; sd = 1 if k % 2 else -1
        flame(fx, 0.3, oz + sd * 0.36, 0.75 + rr.random() * 0.35, 0.18, rr.random() * 3, rr.choice(['#ff7a1e', '#ff9a2a', '#ffb840']))
    K.point((ox - 0.1, 1.6, oz), '#ff7c2a', 290, 0.35)
    K.point((ox - 0.3, 0.3, oz), '#ff7a28', 110, 0.15)
    # firewood and scrap fuel at the open front
    for k in range(4):
        a = rr.uniform(-0.4, 0.4)
        beam((ox - 1.0, 0.06 + k * 0.05, oz - 0.45 + k * 0.28), (ox - 1.9, 0.06 + k * 0.03, oz - 0.6 + k * 0.32 + a), 0.09, 'plain', rr.choice(['#3a2a1c', '#2a2016', '#4a3424']), sides=4)
    # pipe up off the drum and across to the cooling drum in its bunded water pit
    cx, cz = ox + cool_dx, oz + cool_dz
    p0 = (ox + 0.35, 1.38, oz); p1 = (ox + 0.35, 1.75, oz); p2 = (cx, 1.75, cz); p3 = (cx, 1.0, cz)
    for a, b in ((p0, p1), (p1, p2), (p2, p3)): beam(a, b, 0.07, 'plain', '#2a2420', sides=5)
    for (a, b) in [((-0.75, -0.75), (0.75, -0.75)), ((0.75, -0.75), (0.75, 0.75)), ((0.75, 0.75), (-0.75, 0.75)), ((-0.75, 0.75), (-0.75, -0.75))]:
        mx0, mx1 = sorted((cx + a[0], cx + b[0])); mz0, mz1 = sorted((cz + a[1], cz + b[1]))
        cube(mx0 - 0.12, mx1 + 0.12, 0, 0.28, mz0 - 0.12, mz1 + 0.12, 'plain', mud, faces='xXYzZ')
    quadwater = poly([(cx - 0.63, 0.2, cz - 0.63), (cx + 0.63, 0.2, cz - 0.63), (cx + 0.63, 0.2, cz + 0.63), (cx - 0.63, 0.2, cz + 0.63)], [(0, 3, 2, 1)], 'cr_crude', uv=0.6, kind='Crude')
    drum(cx, cz, color='#24303a', y=0.0, h=1.0, r=0.3)
    beam((cx + 0.3, 0.25, cz), (cx + 0.9, 0.18, cz), 0.05, 'plain', '#2a2420', sides=4)      # outlet into a collecting basin
    K.cyl((cx + 1.1, 0, cz), 0.22, 0.16, 'plain', '#6a6a68', seg=7, r2=0.27)
    K._collide((cx, 0, cz), (1.8, 1, 1.8), 0, True, False)
    for k in range(3): jerrycan(cx + 1.0 + (k % 2) * 0.36, cz + 0.45 + k * 0.22, rot=rr.uniform(-0.3, 0.3), color=rr.choice(['#e0c020', '#d8b818', '#1c3a6a']))

oven(2.0, 2.0, 0.0, -2.3, seed=1)
oven(5.0, 4.5, 0.0, 2.3, seed=2)
oven(8.0, 1.0, 2.0, -1.8, seed=3)

# storage pit of black crude at (-2, 0, 4): an earth bund holding the crude (dynamic 'Crude' surface)
PX0, PX1, PZ0, PZ1 = -3.5, -0.5, 2.9, 5.1
for (a0, a1, b0, b1) in [(PX0 - 0.45, PX1 + 0.45, PZ0 - 0.45, PZ0), (PX0 - 0.45, PX1 + 0.45, PZ1, PZ1 + 0.45), (PX0 - 0.45, PX0, PZ0, PZ1), (PX1, PX1 + 0.45, PZ0, PZ1)]:
    cube(a0, a1, 0, 0.32, b0, b1, 'cr_mud', uv=1 / 2, faces='xXYzZ')
cube(PX0 - 0.45, PX1 + 0.45, 0.3, 0.33, PZ0 - 0.45, PZ0 - 0.2, 'plain', '#0e0c0a', faces='Y')
poly([(PX0, 0.22, PZ0), (PX1, 0.22, PZ0), (PX1, 0.22, PZ1), (PX0, 0.22, PZ1)], [(0, 3, 2, 1)], 'cr_crude', uv=0.4, kind='Crude')
K._collide(((PX0 + PX1) / 2, 0, (PZ0 + PZ1) / 2), (PX1 - PX0 + 0.9, 1, PZ1 - PZ0 + 0.9), 0, True, False)
K.box((-2.0, 0.3, 4.0), (3.6, 0.06, 0.28), 'planks', uv=1.0, rot=0.08)                     # plank across the pit
K.cyl((-1.0, 0.36, 4.0), 0.14, 0.24, 'plain', '#3a3a38', seg=7, r2=0.17)                   # bucket on the plank
for k in range(5):                                                                          # hose from the pit to the first still
    beam((-0.6 + k * 0.5, 0.05 + (0.25 if k == 0 else 0), 3.6 - k * 0.32), (-0.1 + k * 0.5, 0.05, 3.28 - k * 0.32), 0.07, 'plain', '#141414', sides=4)
generator(-0.2, 1.4, rot=0.6, color='#9a3a2a', s=1.1)                                      # the pit pump

# drum stacks (blue and black) at (-5, -2) and (9, -4)
def drum_stack(cx, cz, nx, nz, seed, lying=2):
    rr = random.Random(seed)
    for i in range(nx):
        for j in range(nz):
            x, z = cx + (i - (nx - 1) / 2) * 0.62 + rr.uniform(-0.05, 0.05), cz + (j - (nz - 1) / 2) * 0.62 + rr.uniform(-0.05, 0.05)
            col = rr.choice(['#24508a', '#1e4478', '#1a1a1c', '#222224', '#2a5a9a'])
            drum(x, z, col)
            if rr.random() < 0.35: drum(x + rr.uniform(-0.03, 0.03), z, rr.choice(['#24508a', '#1a1a1c']), y=0.88)
    for k in range(lying):
        x = cx + (nx / 2 + 0.6) * 0.62 * (1 if k % 2 == 0 else -1); z = cz + rr.uniform(-0.6, 0.6)
        K.cyl((x, 0.29, z), 0.29, 0.88, 'plain', rr.choice(['#24508a', '#1a1a1c']), seg=9, axis='z', rot=rr.uniform(-0.6, 0.6))
    K._collide((cx, 0, cz), (nx * 0.62 + 0.2, 1, nz * 0.62 + 0.2), 0, True, True)
    K.blocker(cx, 0.6, cz, nx * 0.62, 1.2, nz * 0.62)
drum_stack(-5.0, -2.0, 4, 3, 11)
drum_stack(9.0, -4.0, 3, 3, 12)
quadv(-5.0 - 0.0, 0.3, -2.0 + 0.95 + 0.02, 0.55, 0.28, 0.0, 'cr_signs', uvrect=atlas(512, 256, 1024, 384, H=512))   # stencil on a drum face
# jerrycans: product waiting for the barge, and empties
for k in range(18):
    jerrycan(11.4 + (k % 6) * 0.36, 0.5 + (k // 6) * 0.25, rot=R.uniform(-0.2, 0.2), color=R.choice(['#e0c020', '#e0c020', '#d8b818', '#1c3a6a']), y=DECK_Y)
for k in range(14):
    jerrycan(-0.4 + (k % 7) * 0.36, 7.4 + (k // 7) * 0.26, rot=R.uniform(-0.2, 0.2), color=R.choice(['#e0c020', '#2a2a2a', '#1c3a6a', '#d8b818']))
for k in range(8):
    jerrycan(6.6 + (k % 4) * 0.36, -1.2 + (k // 4) * 0.26, rot=R.uniform(-0.3, 0.3), color=R.choice(['#e0c020', '#2a2a2a']))
K._collide((1.85, 0, 7.55), (2.7, 1, 0.65), 0, True, False)

# tarp shelter with the waybills table at (-6, 0, 6); Felix stands at (-5.2, 0, 6.6)
SX0, SX1, SZ0, SZ1 = -7.7, -4.3, 4.6, 7.6
for (x, z) in [(SX0, SZ0), (SX1, SZ0), (SX0, SZ1), (SX1, SZ1)]:
    beam((x, 0, z), (x, 2.35, z), 0.08, 'plain', '#4a3a28', sides=4)
    K._collide((x, 0, z), (0.14, 1, 0.14), 0, True, False)
for (a, b) in [((SX0, SZ0), (SX1, SZ0)), ((SX0, SZ1), (SX1, SZ1)), ((SX0, SZ0), (SX0, SZ1)), ((SX1, SZ0), (SX1, SZ1))]:
    beam((a[0], 2.3, a[1]), (b[0], 2.3, b[1]), 0.06, 'plain', '#4a3a28', sides=3)
sheet((SX0 - 0.25, 2.36, SZ0 - 0.25), (SX1 + 0.25, 2.36, SZ0 - 0.25), (SX1 + 0.25, 2.36, SZ1 + 0.25), (SX0 - 0.25, 2.36, SZ1 + 0.25), 'tarp_blue', uv=1.0, nu=3, nv=3, sag=0.28)
cube(-6.75, -5.25, 0.76, 0.8, 5.6, 6.4, 'planks', uv=1.0, faces='xXYzZ', collide=True)
for (x, z) in [(-6.65, 5.7), (-5.35, 5.7), (-6.65, 6.3), (-5.35, 6.3)]: beam((x, 0, z), (x, 0.76, z), 0.05, 'plain', '#3a2a1c', sides=3)
for k in range(5):
    K.box((-6.3 + k * 0.17, 0.8, 5.95 + (k % 2) * 0.12), (0.21, 0.004, 0.29), 'plain', R.choice(['#ecebe4', '#e4e0d0', '#f0eee8']), rot=R.uniform(-0.3, 0.3))
K.box((-5.6, 0.8, 6.15), (0.22, 0.03, 0.3), 'plain', '#2a3a6a')                          # ledger
K.box((-5.85, 0.8, 5.8), (0.07, 0.01, 0.14), 'plain', '#141416')                          # phone
lantern(-5.5, 0.8, 5.8, watts=30)
chair(-6.0, 5.1, 0.0, '#3a6ab8'); chair(-7.1, 6.2, PI / 2, '#d8d4cc')
quadv(-7.66, 1.2, 6.1, 1.2, 0.3, PI / 2, 'cr_signs', uvrect=atlas(0, 384, 512, 512, H=512))           # chalked tally board
quadv(-7.7, 1.2, 6.1, 1.2, 0.3, -PI / 2, 'plain', '#2a2a26')
K.box((-4.6, 0, 7.2), (0.6, 0.4, 0.4), 'plain', '#2a6ab8'); K.box((-4.6, 0.4, 7.2), (0.62, 0.05, 0.42), 'plain', '#e8e8e8')   # cooler
# generator with its single bulb near (-7, 0, 8)
generator(-7.2, 8.4, rot=-0.4, color='#c8a020', s=1.3)
K._collide((-7.2, 0, 8.4), (0.9, 1, 0.8), 0, True, False)
beam((-8.0, 0, 7.8), (-8.0, 2.7, 7.8), 0.07, 'plain', '#5a4a30', sides=4)
K._collide((-8.0, 0, 7.8), (0.14, 1, 0.14), 0, True, False)
beam((-8.0, 2.6, 7.8), (-7.5, 2.65, 7.4), 0.04, 'plain', '#5a4a30', sides=3)
bulb(-7.45, 2.25, 7.4, watts=75, cord=2.62, r=0.05)
wire((-7.3, 0.6, 8.3), (-8.0, 2.5, 7.8), sag=0.2, n=3, t=0.012)
wire((-8.0, 2.55, 7.8), (SX0, 2.3, SZ1), sag=0.3, n=4, t=0.012)
# mats, a hammock, a cooking corner, tools
K.plane((0.8, 0.008, 8.6), 1.8, 1.0, 'mat_weave', uv=1.2, rot=0.2)
K.plane((-2.2, 0.008, 8.8), 1.6, 0.9, 'mat_weave', uv=1.2, rot=-0.15)
for (x, z) in [(2.6, 9.2), (6.2, 9.0)]:
    beam((x, 0, z), (x, 1.8, z), 0.1, 'plain', '#3a2c1e', sides=4); K._collide((x, 0, z), (0.16, 1, 0.16), 0, True, False)
sheet((2.7, 1.25, 9.12), (6.1, 1.25, 8.92), (6.1, 1.25, 9.08), (2.7, 1.25, 9.28), 'tarp_green', uv=1.0, nu=4, nv=1, sag=0.45, off=0.01)
K.cyl((-3.0, 0, 8.4), 0.22, 0.3, 'plain', '#2a2a2a', seg=8)                                # cooking pot on stones
for k in range(3): K.sphere((-3.0 + math.cos(k * 2.1) * 0.26, 0.06, 8.4 + math.sin(k * 2.1) * 0.26), 0.08, 'plain', '#4a4642', seg=5)
K.box((-2.2, 0.01, 8.9), (0.3, 0.12, 0.2), 'plain', '#2a2a2a', rot=0.4)                      # radio
for (x, z, a) in [(-3.9, -3.2, 0.3), (3.2, 4.2, -0.4), (10.2, -2.6, 0.9)]:                    # shovels leaning on things
    beam((x, 0.05, z), (x + 0.15 * math.cos(a), 1.2, z + 0.15 * math.sin(a)), 0.035, 'plain', '#6a5038', sides=3)
    K.box((x, 0.0, z), (0.22, 0.28, 0.03), 'plain', '#4a4a48', rot=a)
K.box((-0.6, 0.35, -5.4), (0.6, 0.3, 0.9), 'plain', '#4a5a5a', rot=0.5)                     # wheelbarrow
K.cyl((-0.85, 0.18, -5.85), 0.18, 0.08, 'plain', '#1a1a1a', seg=7, axis='x', rot=0.5)
for k in range(4): K.cyl((3.6 + k * 0.45, 0, -6.2 + (k % 2) * 0.3), 0.14, 0.32, 'plain', R.choice(['#2a5a9a', '#3a3a38', '#c83a2a']), seg=7, r2=0.17)   # buckets

# ================================================================== the barge TEKENA 2 (x 16..22, z -6..9), deck at 0.9
BX0, BX1, BZ0, BZ1, BDK, BBT = 16.0, 22.0, -6.0, 9.0, 0.9, -1.1
hull = [(BX0, BDK, BZ0), (BX1, BDK, BZ0), (BX1, BDK, BZ1), (BX0, BDK, BZ1), (BX0, BBT, BZ0 + 1.3), (BX1, BBT, BZ0 + 1.3), (BX1, BBT, BZ1 - 1.3), (BX0, BBT, BZ1 - 1.3)]
poly(hull, [(4, 7, 3, 0), (2, 6, 5, 1), (1, 5, 4, 0), (7, 6, 2, 3)], 'cr_rust', uv=0.5)
ob = poly(hull[:4], [(0, 3, 2, 1)], 'plain', '#3a2c24')
K.blocker((BX0 + BX1) / 2, (BBT + BDK) / 2, (BZ0 + BZ1) / 2, BX1 - BX0, BDK - BBT, BZ1 - BZ0)
for (a0, a1, b0, b1) in [(BX0, BX0 + 0.08, BZ0, BZ1), (BX1 - 0.08, BX1, BZ0, BZ1), (BX0, BX1, BZ0, BZ0 + 0.08), (BX0, BX1, BZ1 - 0.08, BZ1)]:
    cube(a0, a1, BDK, BDK + 0.38, b0, b1, 'cr_rust', uv=0.5, faces='xXYzZ')
cube(BX0 - 0.04, BX0 + 0.12, BDK + 0.38, BDK + 0.44, BZ0, BZ1, 'plain', '#2a201a', faces='xXYzZ')
# deck tank on saddles, ladder, manhole, valves, a loading hose down to the jetty
K.cyl((19.0, BDK + 1.6, 0.6), 1.3, 9.0, 'cr_rust', seg=12, axis='z', uv=0.5)
for z in (-2.6, 0.6, 3.8): K.box((19.0, BDK, z), (2.2, 0.38, 0.35), 'plain', '#2a2420')
K.cyl((19.0, BDK + 2.86, -1.2), 0.32, 0.22, 'plain', '#3a2e26', seg=8)
K.cyl((19.0, BDK + 2.86, 2.6), 0.32, 0.22, 'plain', '#3a2e26', seg=8)
for k in range(6): beam((17.62, BDK + 0.35 * k + 0.1, -3.6), (17.62, BDK + 0.35 * k + 0.1, -3.1), 0.04, 'plain', '#5a4a3a', sides=3)
beam((17.62, BDK, -3.6), (17.75, BDK + 2.2, -3.6), 0.05, 'plain', '#5a4a3a', sides=3); beam((17.62, BDK, -3.1), (17.75, BDK + 2.2, -3.1), 0.05, 'plain', '#5a4a3a', sides=3)
beam((19.0, BDK + 0.4, 5.1), (19.0, BDK + 0.4, 6.4), 0.12, 'plain', '#2a2420', sides=5)
K.cyl((19.0, BDK + 0.3, 6.2), 0.12, 0.35, 'plain', '#7a2a1a', seg=6)
hose = [(18.2, BDK + 0.5, 1.6), (16.6, BDK + 0.42, 1.8), (16.1, BDK + 0.5, 1.9), (15.6, 0.5, 2.0), (15.2, DECK_Y + 0.05, 2.1), (14.4, DECK_Y + 0.05, 2.5), (13.6, DECK_Y + 0.05, 2.2)]
for a, b in zip(hose, hose[1:]): beam(a, b, 0.09, 'plain', '#141414', sides=4)
K.box((13.4, DECK_Y, 2.2), (0.5, 0.35, 0.4), 'plain', '#3a6a3a', rot=0.2)                   # hand pump
# bollards, fenders, mooring lines
for (x, z) in [(16.5, -5.0), (16.5, 1.0), (16.5, 4.0), (16.5, 8.0), (21.5, -5.0), (21.5, 8.0)]:
    K.cyl((x, BDK, z), 0.12, 0.35, 'plain', '#2a2420', seg=6); K.cyl((x, BDK, z + 0.4), 0.12, 0.35, 'plain', '#2a2420', seg=6)
for z in (0.6, 2.0, 3.4, -2.0, 5.5):
    K.cyl((15.9, 0.15, z), 0.32, 0.22, 'plain', '#141414', seg=8, axis='x')
beam((15.5, 0.55, 0.1), (16.5, BDK + 0.25, 1.0), 0.04, 'plain', '#9a8a6a', sides=3)
beam((15.5, 0.55, 3.9), (16.5, BDK + 0.25, 4.0), 0.04, 'plain', '#9a8a6a', sides=3)
# stern deckhouse with a dim work lamp over its door
cube(17.0, 20.2, BDK, BDK + 2.2, 6.4, 8.6, 'cr_rust', uv=0.5, faces='xXYzZ')
cube(16.9, 20.3, BDK + 2.2, BDK + 2.3, 6.3, 8.7, 'plain', '#2a201a', faces='xXYyzZ')
quadv(16.98, BDK, 7.5, 0.8, 1.8, -PI / 2, 'plain', '#141210')
quadv(16.98, BDK + 1.1, 6.8, 0.5, 0.5, -PI / 2, 'plain', '#0e1012')
K.box((16.9, BDK + 1.95, 7.5), (0.12, 0.08, 0.2), 'plain', '#2a2a2a')
gbox((16.84, BDK + 1.86, 7.5), (0.06, 0.08, 0.14), '#ffd9a0')
K.point((16.6, BDK + 1.8, 7.5), '#ffc888', 45, 0.15)
K.blocker(18.6, BDK + 1.1, 7.5, 3.2, 2.2, 2.2)
# the name: TEKENA 2 on the hull side facing the camp and on the stern
quadv(15.985, -0.05, -0.2, 5.2, 1.3, -PI / 2, 'cr_signs', uvrect=atlas(0, 0, 1024, 256, H=512))

# fibreglass speedboat ('flying boat') moored by the escort's landing, near (14, 0, -7)
speedboat(14.9, -5.6, rot=0.0, y=WATER_Y)
beam((13.7, 0.5, -5.5), (14.3, 0.15, -3.0), 0.03, 'plain', '#9a8a6a', sides=3)
# the fisherman's canoe at the landing (he sits at (-15.6, 0, 15.6)) with a small lamp
canoe(-15.8, 15.2, 5.4, 0.82, 0.0, color='#3e2c1e', y=WATER_Y)
lantern(-15.75, WATER_Y + 0.12, 13.9, watts=30)
K.box((-15.8, WATER_Y + 0.08, 16.6), (0.5, 0.06, 0.5), 'plain', '#4a5a4a')                  # a folded net
beam((-15.1, 0.6, 15.1), (-15.5, 0.1, 15.9), 0.03, 'plain', '#9a8a6a', sides=3)
# an escape canoe tied at the end of the chase boardwalk
canoe(16.1, -18.0, 4.8, 0.78, 0.0, color='#2e2216', y=WATER_Y, seats=2)

# ================================================================== mangroves (dead and black near the camp, alive further out)
def mangrove(x, z, h=7.0, r=2.4, dead=False, seed=0, nroots=13, y0=WATER_Y):
    """red mangrove: a cage of smoothly arching prop roots, a short trunk, a broad rounded canopy (bare and oil-black when dead)"""
    rr = random.Random(seed)
    bark = '#141110' if dead else rr.choice(['#3e3428', '#4a3c2e', '#3a3026'])
    cy = y0 + 1.2 + rr.random() * 0.4
    def arch(p0, p3, lift, t0, t1, segs=4):
        cx_ = (p0[0] * 0.6 + p3[0] * 0.4, max(p0[1], p3[1]) + lift, p0[2] * 0.6 + p3[2] * 0.4)
        pts = [tuple((1 - t) ** 2 * p0[i] + 2 * t * (1 - t) * cx_[i] + t * t * p3[i] for i in range(3)) for t in [k / segs for k in range(segs + 1)]]
        for i, (q0, q1) in enumerate(zip(pts, pts[1:])):
            beam(q0, q1, t0 + (t1 - t0) * i / segs, 'plain', bark, t2=t0 + (t1 - t0) * (i + 1) / segs, sides=3)
    for k in range(nroots):
        a = 2 * PI * k / nroots + rr.random() * 0.45
        rad = r * (0.38 + rr.random() * 0.42); hs = cy + rr.uniform(-0.5, 0.9)
        ca, sa = math.cos(a), math.sin(a)
        arch((x + ca * 0.1, hs, z + sa * 0.1), (x + ca * rad, y0 - 0.3, z + sa * rad), 0.35 + rr.random() * 0.3, 0.085, 0.045)
    lean = (rr.uniform(-0.35, 0.35), rr.uniform(-0.35, 0.35))
    top = (x + lean[0], y0 + h * (0.42 if not dead else 0.6), z + lean[1])
    beam((x, cy - 0.5, z), top, 0.25, 'plain', bark, t2=0.18, sides=5)
    if dead:
        for k in range(6):
            a = rr.random() * 2 * PI; L = 1.0 + rr.random() * 1.6
            e = (top[0] + math.cos(a) * L, top[1] + 0.4 + rr.random() * 1.8, top[2] + math.sin(a) * L)
            beam(top, e, 0.12, 'plain', bark, t2=0.04, sides=3)
            if rr.random() < 0.7:
                beam(e, (e[0] + math.cos(a + 0.9) * 0.6, e[1] + 0.45, e[2] + math.sin(a + 0.9) * 0.6), 0.05, 'plain', bark, t2=0.02, sides=3)
        return
    blobs = [(top[0], top[1] + 1.5, top[2])]
    for k in range(6):
        a = 2 * PI * k / 6 + rr.random() * 0.6; d = r * (0.35 + rr.random() * 0.35)
        blobs.append((top[0] + math.cos(a) * d, top[1] + 0.6 + rr.random() * 0.9, top[2] + math.sin(a) * d))
    for i, bc in enumerate(blobs):
        if i % 2 == 1:
            beam(top, bc, 0.12, 'plain', bark, t2=0.05, sides=3)
            if i < 5: beam((bc[0] * 0.7 + top[0] * 0.3, bc[1] - 0.6, bc[2] * 0.7 + top[2] * 0.3), (bc[0] * 0.8 + top[0] * 0.2, y0 - 0.2, bc[2] * 0.8 + top[2] * 0.2), 0.035, 'plain', bark, sides=3)   # aerial root
        ob = K.sphere(bc, r * (0.62 + rr.random() * 0.22), 'plain', rr.choice(['#24361e', '#2a3e22', '#203220', '#2c4024']), seg=6, sy=0.72)
        ob['lm'] = 'top'
    K._collide((x, 0, z), (0.4, 1, 0.4), 0, True, False)

def nipa(x, z, seed=0, n=11, y0=WATER_Y):
    """a nipa palm clump: long fronds rising straight out of the water and arching over"""
    rr = random.Random(seed)
    for k in range(n):
        a = 2 * PI * k / n + rr.random() * 0.5; ca, sa = math.cos(a), math.sin(a)
        L = 3.2 + rr.random() * 1.6; up = 2.4 + rr.random() * 1.2
        p0 = (x + ca * 0.15, y0, z + sa * 0.15); p1 = (x + ca * L * 0.35, y0 + up, z + sa * L * 0.35); p2 = (x + ca * L, y0 + up * 0.75, z + sa * L)
        px, pz = -sa * 0.24, ca * 0.24; col = rr.choice(['#2a3e22', '#304626', '#24361e'])
        for (q0, q1, w0, w1) in [(p0, p1, 0.1, 0.9), (p1, p2, 0.9, 0.15)]:
            sheet((q0[0] - px * w0, q0[1], q0[2] - pz * w0), (q0[0] + px * w0, q0[1], q0[2] + pz * w0),
                  (q1[0] + px * w1, q1[1], q1[2] + pz * w1), (q1[0] - px * w1, q1[1], q1[2] - pz * w1), 'plain', col, off=0.02, lm='top')

# dead, oil-black mangroves around the camp edge
for i, (x, z) in enumerate([(-11.6, -2.2), (-11.8, 3.2), (-6.0, -9.8), (6.0, -9.6), (13.4, 8.2), (-3.5, 11.4), (6.8, 11.2), (13.3, -1.8), (-11.0, -7.6), (10.2, -9.4)]):
    mangrove(x, z, h=5.2 + R.random() * 1.4, r=1.9, dead=True, seed=100 + i, nroots=8)
# living mangroves further out (the chase boardwalk runs through them)
for i, (x, z, rr_) in enumerate([(-17.5, -11.5, 2.6), (-19.0, -3.0, 2.6), (-18.5, 5.0, 2.6), (-2.8, -11.6, 1.9), (-2.6, -15.4, 1.9), (6.8, -12.2, 1.9), (9.6, -13.4, 1.9),
                            (13.2, -13.4, 2.0), (6.6, -22.8, 2.0), (11.0, -22.6, 2.0), (-3.8, -20.8, 2.2), (19.5, -12.5, 2.6), (20.5, 14.5, 2.6), (-6.0, 17.0, 2.6), (2.0, 15.8, 2.5), (9.5, 15.2, 2.5)]):
    mangrove(x, z, h=6.0 + R.random() * 2.0, r=rr_ + R.random() * 0.4, dead=False, seed=200 + i)
for i, (x, z) in enumerate([(-11.0, 19.5), (-19.5, 19.0), (-14.5, -15.5), (-6.5, -13.5), (15.5, -16.0), (17.0, 13.0), (13.0, 12.5), (-20.5, 0.5), (-2.5, 14.6), (-20.0, -8.0)]):
    nipa(x, z, seed=400 + i)
for i, (x, z) in enumerate([(-20.5, -16.5), (20.5, 20.5), (-16.0, 20.5)]):
    palm(x, z, h=7.0 + i, lean=(R.uniform(-0.6, 0.6), R.uniform(-0.6, 0.6)), seed=300 + i, y0=WATER_Y - 0.1, green='#1e3018')

# ================================================================== DYNAMIC: water, panorama
K.plane((0, WATER_Y, 0), 180.0, 180.0, 'cr_water', uv=1 / 7, kind='Water')
w = K.strip((1, 0), 31, 13, -PI, PI, 'cr_wall', seg=64, y0=-0.9, kind='Wall')      # the near mangrove wall around the creek
flip_normals(w); bake_invisible(w)
for (a0, a1) in [(-PI, -PI / 3), (-PI / 3, PI / 3), (PI / 3, PI)]:                 # its UVs run 0..1 around; repeat the texture 3x
    pass
uvl = w.data.uv_layers['UVMap'].data
for li in range(len(uvl)): uvl[li].uv = (uvl[li].uv[0] * 3.0, uvl[li].uv[1])
o = K.strip((0, 0), 78, 34, -PI, PI, 'cr_pano', seg=48, y0=-3.0, kind='Pano')
flip_normals(o); bake_invisible(o)

# ================================================================== walking: water everywhere except island, boardwalks and jetties
WALK = [(-9.5, 11.2, -7.2, 5.2), (-7.8, 11.2, 5.2, 9.2), (-15.2, -12.8, 12.8, 15.2), (-14.4, -12.8, 5.2, 12.8), (-14.4, -7.6, 5.2, 6.8),
        (11.0, 15.6, 0.0, 4.0), (11.0, 13.8, -5.6, -3.4), (1.2, 2.8, -18.8, -7.0), (1.2, 15.2, -18.8, -17.2)]
def water_obstacles(walk, bx0=-23.0, bx1=23.0, bz0=-23.0, bz1=23.0):
    xs = sorted(set([bx0, bx1] + [w[0] for w in walk] + [w[1] for w in walk]))
    zs = sorted(set([bz0, bz1] + [w[2] for w in walk] + [w[3] for w in walk]))
    def walkable(cx, cz): return any(w[0] <= cx <= w[1] and w[2] <= cz <= w[3] for w in walk)
    cells = [[not walkable((xs[i] + xs[i + 1]) / 2, (zs[j] + zs[j + 1]) / 2) for j in range(len(zs) - 1)] for i in range(len(xs) - 1)]
    used = [[False] * (len(zs) - 1) for _ in range(len(xs) - 1)]
    out = []
    for i in range(len(xs) - 1):
        for j in range(len(zs) - 1):
            if not cells[i][j] or used[i][j]: continue
            j2 = j
            while j2 + 1 < len(zs) - 1 and cells[i][j2 + 1] and not used[i][j2 + 1]: j2 += 1
            i2 = i
            while i2 + 1 < len(xs) - 1 and all(cells[i2 + 1][jj] and not used[i2 + 1][jj] for jj in range(j, j2 + 1)): i2 += 1
            for ii in range(i, i2 + 1):
                for jj in range(j, j2 + 1): used[ii][jj] = True
            x0, x1, z0, z1 = xs[i], xs[i2 + 1], zs[j], zs[j2 + 1]
            out.append(((x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0))
    for (x, z, w, d) in out: K.obstacle(round(x, 3), round(z, 3), round(w, 3), round(d, 3))
    return out
print('[creek] water obstacles', len(water_obstacles(WALK)))

# ================================================================== ANCHORS
K.anchor('start', (-13.6, 0, 13.4), rot=3 * PI / 4)
K.anchor('uche_start', (-14.6, 0, 14.4), rot=3 * PI / 4)
K.anchor('fisherman', (-15.6, 0, 15.6), rot=PI / 2, sit=True, y=WATER_Y + 0.2)
K.anchor('waybills', (-6.0, 0.81, 6.0))
K.anchor('felix', (-5.2, 0, 6.6), rot=-2.2)
K.anchor('barge_tag', (15.2, 0, 1.5), rot=PI / 2)
K.anchor('escort', (13.5, 0, -4.5), rot=-PI / 2)
K.anchor('chase_a', (2, 0, -8)); K.anchor('chase_b', (2, 0, -18)); K.anchor('chase_c', (14, 0, -18))
for i, (x, z) in enumerate([(2, 2), (5, 4.5), (8, 1)]):
    K.anchor('smoke%d' % (i + 1), (x, 2.5, z))
    K.anchor('oven%d' % (i + 1), (x, 0, z))
K.anchor('crude_pit', (-2, 0, 4))
K.anchor('generator', (-7.2, 0, 8.4))
K.anchor('speedboat', (14.9, 0, -5.6), rot=0.0)
K.anchor('workers', (0, 0, 0), list=[[0.7, 2.0, PI / 2], [3.7, 4.6, PI / 2], [6.7, 1.1, PI / 2], [3.1, -0.3, -PI / 2],
                                     [-2.0, 5.75, PI], [-3.2, -1.6, -PI / 2], [9.0, -2.3, PI], [11.6, 2.2, PI / 2]])
K.bounds(-22, 22, -22, 22)

build(lm=1024, samples=SAMPLES, margin=3, percentile=99.2)
