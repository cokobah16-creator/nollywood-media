"""NACECA env kit — builds a light-baked environment the way the v9 scenes ship.

Each env script describes a scene in game coordinates (y up, metres) and calls
Kit.build(). The kit joins every static piece into one mesh ("Env"), gives it a
lightmap UV, bakes lighting only (direct + indirect, no albedo) with Cycles,
exports a GLB with TEXCOORD_0 (texture), TEXCOORD_1 (lightmap) and COLOR_0
(albedo for the 'plain' material), compresses it with gltfpack, and writes the
meta (obstacles, camera blockers, anchors) the game's dressScene() reads.

Dynamic pieces (glows, panoramas, doors, water) are exported as separate named
nodes without a lightmap, exactly like the Season 1 scenes.
"""
import bpy, bmesh, math, json, os, sys, random, struct, subprocess
import numpy as np
from mathutils import Vector, Matrix

def _s2l(c): return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
def hexrgb(h):
    h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
def lin(h):
    r, g, b = hexrgb(h); return (_s2l(r), _s2l(g), _s2l(b))
def G(x, y, z):
    """game (x, y up, z) -> Blender (x, -z, y)"""
    return Vector((x, -z, y))

# albedo guesses for textured materials (only used for light bounce while baking)
ALBEDO = {
    'laterite': '#a3633f', 'asphalt': '#3c3c3e', 'kerb': '#9d9b96', 'concrete': '#9d9b96', 'drain': '#2a2622',
    'planks': '#8a6a4a', 'truck_planks': '#c09a6a', 'tarp_red': '#c04a3a', 'tarp_blue': '#3a6ab8', 'tarp_yellow': '#e0b04a',
    'tarp_green': '#4aa05a', 'tarp_purple': '#9050b0', 'tarp_orange': '#d8824a', 'fabric_print': '#b06a3a', 'mat_weave': '#b89a6a',
    'corrugated': '#9a9a96', 'corrugated_rust': '#8a5a3a', 'roof_sheet': '#a4a49e', 'roof_red': '#9a4632', 'roof_blue': '#46669a', 'roof_grey': '#8a8a86',
    'block_wall': '#a8a49a', 'block_paint': '#c4c8bc', 'facade_a': '#d9c09a', 'facade_b': '#c99a7a', 'facade_c': '#b9c6b0',
    'facade_d': '#e6d6b6', 'facade_e': '#aab6c6', 'shutter': '#7a7e84', 'forest_floor': '#4a4030', 'mudwall': '#8a5a3a', 'bark': '#4a3a2a',
    'gravel': '#8a8478', 'wh_floor': '#8e8c86', 'floor_marble': '#d8d2c6', 'marble_dark': '#3a3836', 'wall_plaster': '#e2dccf',
    'wood_dark': '#4a2e1c', 'wood_trim': '#6a4a30', 'carpet': '#3a4458', 'wall_paint': '#c4c7cb', 'ceiling_tile': '#dcdcd6',
    'wall_panel': '#22304e', 'lectern_wood': '#4a2e1c', 'bench_wood': '#8a5c38', 'wood_slat': '#8a5c38', 'paving': '#a09a90',
    'burlap': '#a08a60', 'canvas_olive': '#6a7a44', 'container': '#c0503a', 'signs': '#808080', 'leather': '#3a2a20',
}

class Kit:
    def __init__(self, key, out_dir):
        bpy.ops.wm.read_factory_settings(use_empty=True)
        self.key, self.out = key, out_dir
        os.makedirs(out_dir, exist_ok=True)
        self.static, self.bakeonly = [], []
        self.dyn = {}                       # node name -> [objects]
        self.mats = {}
        self.meta = {'obstacles': [], 'blockers': [], 'anchors': {}}
        self.vc_mats, self.tex_mats = set(), set()
        sc = bpy.context.scene
        sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'
        sc.cycles.use_denoising = False
        self.world('#10131c', 0.6)
        random.seed(hash(key) & 0xffff)

    # ---------------- materials ----------------
    def mat(self, name, base=None, emit=None, vc=None, tex=None):
        if name in self.mats: return self.mats[name]
        m = bpy.data.materials.new(name)
        try: m.use_nodes = True
        except Exception: pass
        nt = m.node_tree; b = nt.nodes.get('Principled BSDF')
        if vc is None: vc = name in ('plain', 'glow')
        if tex is None: tex = (not vc) and name not in ('glow',)
        if vc:
            a = nt.nodes.new('ShaderNodeVertexColor'); a.layer_name = 'Col'
            nt.links.new(a.outputs['Color'], b.inputs['Base Color'])
            self.vc_mats.add(name)
        else:
            b.inputs['Base Color'].default_value = (*lin(base or ALBEDO.get(name, '#808080')), 1)
            if tex: self.tex_mats.add(name)
        if emit:
            b.inputs['Emission Color'].default_value = (*lin(emit[0]), 1)
            b.inputs['Emission Strength'].default_value = emit[1]
        b.inputs['Roughness'].default_value = 0.92
        self.mats[name] = m
        return m

    # ---------------- lights ----------------
    def world(self, color, strength):
        w = bpy.data.worlds.get('W') or bpy.data.worlds.new('W'); bpy.context.scene.world = w
        try: w.use_nodes = True
        except Exception: pass
        bg = w.node_tree.nodes.get('Background')
        bg.inputs['Color'].default_value = (*lin(color), 1); bg.inputs['Strength'].default_value = strength
    def sun(self, direction, color='#ffffff', strength=3.0, angle=0.02):
        """direction: game-space vector the light travels along"""
        L = bpy.data.lights.new('sun', 'SUN'); L.energy = strength; L.color = lin(color); L.angle = angle
        o = bpy.data.objects.new('sun', L); bpy.context.collection.objects.link(o)
        d = G(*direction).normalized()
        o.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
        return o
    def point(self, pos, color='#ffd9a0', watts=60, radius=0.08):
        L = bpy.data.lights.new('pt', 'POINT'); L.energy = watts; L.color = lin(color); L.shadow_soft_size = radius
        o = bpy.data.objects.new('pt', L); o.location = G(*pos); bpy.context.collection.objects.link(o); return o
    def area(self, pos, size, color='#ffffff', watts=200, direction=(0, -1, 0)):
        L = bpy.data.lights.new('ar', 'AREA'); L.energy = watts; L.color = lin(color); L.shape = 'RECTANGLE'; L.size, L.size_y = size
        o = bpy.data.objects.new('ar', L); o.location = G(*pos); bpy.context.collection.objects.link(o)
        o.rotation_euler = G(*direction).normalized().to_track_quat('-Z', 'Y').to_euler(); return o

    # ---------------- geometry ----------------
    def _finish(self, bm, mat, color, uv, pos, rot, kind, name):
        M = Matrix.Translation(G(*pos)) @ Matrix.Rotation(rot, 4, 'Z')
        bmesh.ops.transform(bm, matrix=M, verts=bm.verts)
        me = bpy.data.meshes.new(name or mat); bm.to_mesh(me); bm.free()
        ob = bpy.data.objects.new(name or mat, me); bpy.context.collection.objects.link(ob)
        self.mat(mat); ob.data.materials.append(self.mats[mat])
        ca = me.color_attributes.new('Col', 'FLOAT_COLOR', 'CORNER')
        c = lin(color) if color else (1, 1, 1)
        ca.data.foreach_set('color', [v for _ in range(len(ca.data)) for v in (c[0], c[1], c[2], 1.0)])
        uvl = me.uv_layers.new(name='UVMap')
        if uv:
            for poly in me.polygons:
                n = poly.normal; ax = max(range(3), key=lambda i: abs(n[i]))
                for li in poly.loop_indices:
                    p = me.vertices[me.loops[li].vertex_index].co
                    if ax == 2: u, v = p.x, p.y
                    elif ax == 0: u, v = (p.y if n.x > 0 else -p.y), p.z
                    else: u, v = (-p.x if n.y > 0 else p.x), p.z
                    uvl.data[li].uv = (u * uv, v * uv)
        if kind == 'static': self.static.append(ob)
        elif kind == 'bake': self.bakeonly.append(ob)
        else: self.dyn.setdefault(kind, []).append(ob)
        return ob

    def _collide(self, pos, size, rot, collide, block):
        x, y, z = pos; w, h, d = size
        if collide or block:
            c, s = abs(math.cos(rot)), abs(math.sin(rot))
            W, D = w * c + d * s, w * s + d * c
            if collide: self.meta['obstacles'].append([round(x, 3), round(z, 3), round(W, 3), round(D, 3)])
            if block: self.meta['blockers'].append([round(x, 3), round(y + h / 2, 3), round(z, 3), round(W, 3), round(h, 3), round(D, 3)])

    def box(self, pos, size, mat='plain', color=None, rot=0.0, uv=1.0, collide=False, block=False, kind='static', name=None, top=True, bottom=False):
        """pos = (x, y_bottom, z); size = (w, h, d) along x, y, z before rotation about y."""
        bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
        w, h, d = size
        bmesh.ops.scale(bm, vec=Vector((w, d, h)), verts=bm.verts)
        bmesh.ops.translate(bm, vec=Vector((0, 0, h / 2)), verts=bm.verts)
        kill = []
        for f in bm.faces:
            nz = f.normal.z
            if (nz > 0.9 and not top) or (nz < -0.9 and not bottom): kill.append(f)
        if kill: bmesh.ops.delete(bm, geom=kill, context='FACES')
        self._collide(pos, size, rot, collide, block)
        return self._finish(bm, mat, color, uv if mat not in ('plain', 'glow') else None, pos, rot, kind, name)

    def cyl(self, pos, r, h, mat='plain', color=None, seg=12, r2=None, rot=0.0, uv=1.0, collide=False, block=False, kind='static', name=None, caps=True, axis='y'):
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=caps, cap_tris=False, segments=seg, radius1=r, radius2=(r if r2 is None else r2), depth=h)
        if axis == 'y': bmesh.ops.translate(bm, vec=Vector((0, 0, h / 2)), verts=bm.verts)
        elif axis == 'x': bmesh.ops.rotate(bm, cent=Vector(), matrix=Matrix.Rotation(math.pi / 2, 3, 'Y'), verts=bm.verts)
        elif axis == 'z': bmesh.ops.rotate(bm, cent=Vector(), matrix=Matrix.Rotation(math.pi / 2, 3, 'X'), verts=bm.verts)
        if collide or block: self._collide(pos, (2 * r, h, 2 * r) if axis == 'y' else ((h, 2 * r, 2 * r) if axis == 'x' else (2 * r, 2 * r, h)), rot, collide, block)
        return self._finish(bm, mat, color, uv if mat not in ('plain', 'glow') else None, pos, rot, kind, name)

    def sphere(self, pos, r, mat='plain', color=None, seg=8, sy=1.0, kind='static', name=None):
        bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=max(4, seg // 2), radius=r)
        bmesh.ops.scale(bm, vec=Vector((1, 1, sy)), verts=bm.verts)
        return self._finish(bm, mat, color, None, pos, 0.0, kind, name)

    def plane(self, pos, w, d, mat, color=None, uv=1 / 3, rot=0.0, kind='static', name=None, y_up=True):
        bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.5)
        bmesh.ops.scale(bm, vec=Vector((w, d, 1)), verts=bm.verts)
        return self._finish(bm, mat, color, uv if mat not in ('plain', 'glow') else None, pos, rot, kind, name)

    def quad(self, pos, w, h, mat, rot=0.0, kind='static', name=None, color=None, uvrect=(0, 0, 1, 1)):
        """an upright quad facing +z (game) before rotation; UV0 spans uvrect (atlas/pano)."""
        bm = bmesh.new()
        vs = [bm.verts.new(Vector(c)) for c in [(-w / 2, 0, 0), (w / 2, 0, 0), (w / 2, 0, h), (-w / 2, 0, h)]]
        f = bm.faces.new(vs)
        uvl = bm.loops.layers.uv.new('UVMap')
        u0, v0, u1, v1 = uvrect
        for loop, uvv in zip(f.loops, [(u0, v0), (u1, v0), (u1, v1), (u0, v1)]): loop[uvl].uv = uvv
        ob = self._finish(bm, mat, color, None, pos, rot, kind, name)
        return ob

    def strip(self, center, radius, height, a0, a1, mat, seg=24, y0=0.0, kind='Pano', name=None):
        """a cylindrical band (inward-facing) for panoramas; UV0 u runs 0..1 along the arc."""
        bm = bmesh.new(); uvl = bm.loops.layers.uv.new('UVMap')
        cx, cz = center; ring = []
        for i in range(seg + 1):
            a = a0 + (a1 - a0) * i / seg
            x, z = cx + math.cos(a) * radius, cz + math.sin(a) * radius
            ring.append((bm.verts.new(G(x, y0, z)), bm.verts.new(G(x, y0 + height, z)), i / seg))
        for i in range(seg):
            (b0, t0, u0), (b1, t1, u1) = ring[i], ring[i + 1]
            f = bm.faces.new((b1, b0, t0, t1))
            for loop, uvv in zip(f.loops, [(u1, 0), (u0, 0), (u0, 1), (u1, 1)]): loop[uvl].uv = uvv
        me = bpy.data.meshes.new(name or mat); bm.to_mesh(me); bm.free()
        ob = bpy.data.objects.new(name or mat, me); bpy.context.collection.objects.link(ob)
        self.mat(mat, tex=True); ob.data.materials.append(self.mats[mat])
        ca = me.color_attributes.new('Col', 'FLOAT_COLOR', 'CORNER')
        ca.data.foreach_set('color', [1.0] * (4 * len(ca.data)))
        self.dyn.setdefault(kind, []).append(ob)
        return ob

    def glow(self, pos, size, color, watts=0, light_color=None, radius=0.1, shape='box', kind='Glows', bake_emit=4.0):
        """an emissive piece the game draws unlit ('glow' + vertex colour); watts adds a bake light."""
        mname = 'glow'
        self.mat(mname, vc=True)
        if shape == 'box': ob = self.box(pos, size, mname, color=color, kind=kind, bottom=True)
        else: ob = self.sphere((pos[0], pos[1] + size[1] / 2, pos[2]), size[0] / 2, mname, color=color, seg=10, kind=kind)
        # while baking it glows (a per-object emissive copy of the material)
        em = bpy.data.materials.new('glow_bake_' + color); em.use_nodes = True
        b = em.node_tree.nodes.get('Principled BSDF')
        b.inputs['Base Color'].default_value = (*lin(color), 1)
        b.inputs['Emission Color'].default_value = (*lin(color), 1); b.inputs['Emission Strength'].default_value = bake_emit
        ob['_bake_mat'] = em.name
        if watts: self.point((pos[0], pos[1] + size[1] * 0.5, pos[2]), light_color or color, watts, radius)
        return ob

    # ---------------- gameplay meta ----------------
    def obstacle(self, x, z, w, d): self.meta['obstacles'].append([x, z, w, d])
    def blocker(self, x, y, z, w, h, d): self.meta['blockers'].append([x, y, z, w, h, d])
    def anchor(self, name, pos, **kw): a = {'pos': list(pos)}; a.update(kw); self.meta['anchors'][name] = a
    def bounds(self, minX, maxX, minZ, maxZ): self.meta['anchors']['bounds'] = {'pos': [0, 0, 0], 'minX': minX, 'maxX': maxX, 'minZ': minZ, 'maxZ': maxZ}

    # ---------------- build ----------------
    def _join(self, objs, name):
        bpy.ops.object.select_all(action='DESELECT')
        for o in objs: o.select_set(True)
        bpy.context.view_layer.objects.active = objs[0]
        if len(objs) > 1: bpy.ops.object.join()
        ob = bpy.context.view_layer.objects.active; ob.name = name; ob.data.name = name
        return ob

    def build(self, lm=1024, samples=64, margin=6, percentile=99.6, lm_name=None, extra_meta=None, rebake_only=False):
        t0 = __import__('time').time()
        env = self._join(self.static, 'Env')
        dyn_objs = []
        for name, objs in self.dyn.items(): dyn_objs.append(self._join(objs, name))
        # lightmap UVs
        bpy.ops.object.select_all(action='DESELECT'); env.select_set(True); bpy.context.view_layer.objects.active = env
        me = env.data
        lmuv = me.uv_layers.new(name='Lightmap'); me.uv_layers.active = lmuv
        bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.uv.smart_project(angle_limit=math.radians(55), island_margin=0.0, area_weight=0.0, correct_aspect=True, scale_to_bounds=False)
        bpy.ops.uv.pack_islands(rotate=True, margin=margin / lm * 1.6)
        bpy.ops.object.mode_set(mode='OBJECT')
        me.uv_layers.active = me.uv_layers['UVMap']
        # bake: glows emit, the image node is the active target in every Env material
        img = bpy.data.images.new('LM', lm, lm, alpha=False, float_buffer=True)
        for o in dyn_objs + self.bakeonly:
            if o.get('_bake_mat'): o.data.materials[0] = bpy.data.materials[o['_bake_mat']]
        for slot in env.material_slots:
            nt = slot.material.node_tree
            n = nt.nodes.new('ShaderNodeTexImage'); n.image = img; n.select = True; nt.nodes.active = n
        sc = bpy.context.scene
        sc.cycles.samples = samples
        sc.render.bake.use_pass_direct = True; sc.render.bake.use_pass_indirect = True; sc.render.bake.use_pass_color = False
        sc.render.bake.margin = margin
        bpy.ops.object.select_all(action='DESELECT'); env.select_set(True); bpy.context.view_layer.objects.active = env
        bpy.ops.object.bake(type='DIFFUSE', pass_filter={'DIRECT', 'INDIRECT'}, margin=margin, use_clear=True, uv_layer='Lightmap', target='IMAGE_TEXTURES')
        px = np.array(img.pixels[:], dtype=np.float32).reshape(lm, lm, 4)[::-1, :, :3]
        lumi = px.max(axis=2)
        nz = lumi[lumi > 1e-5]
        mx = float(np.percentile(nz, percentile)) if nz.size else 1.0
        v = np.clip(px / mx, 0, 1)
        srgb = np.where(v <= 0.0031308, v * 12.92, 1.055 * np.power(v, 1 / 2.4) - 0.055)
        from PIL import Image, ImageFilter
        im = Image.fromarray((srgb * 255 + 0.5).astype(np.uint8), 'RGB')
        lm_name = lm_name or (self.key + '_lm')
        im.save(os.path.join(self.out, lm_name + '.png'))
        im.save(os.path.join(self.out, lm_name + '.webp'), 'WEBP', quality=82, method=6)
        # restore the game's materials on glows, drop bake nodes, export
        for o in dyn_objs + self.bakeonly:
            if o.get('_bake_mat'): o.data.materials[0] = self.mats['glow']
        for o in self.bakeonly: bpy.data.objects.remove(o)
        bpy.ops.object.select_all(action='DESELECT')
        for o in [env] + dyn_objs: o.select_set(True)
        raw = os.path.join(self.out, self.key + '_raw.glb')
        bpy.ops.export_scene.gltf(filepath=raw, export_format='GLB', use_selection=True, export_texcoords=True, export_normals=False,
                                  export_vertex_color='ACTIVE', export_all_vertex_colors=False, export_materials='EXPORT',
                                  export_yup=True, export_apply=False, export_extras=False, export_tangents=False)
        self._strip_attrs(raw)
        out = os.path.join(self.out, self.key + '.glb')
        r = subprocess.run(['gltfpack', '-i', raw, '-o', out, '-cc', '-kn', '-km', '-kv', '-vtf'], capture_output=True, text=True)
        if r.returncode: raise SystemExit('gltfpack failed: ' + r.stderr)
        meta = dict(self.meta); meta['max'] = round(mx, 4)
        if extra_meta: meta.update(extra_meta)
        json.dump(meta, open(os.path.join(self.out, self.key + '.json'), 'w'), separators=(',', ':'))
        print(f'[envkit] {self.key}: {len(me.polygons)} faces, lm {lm} max {mx:.3f}, glb {os.path.getsize(out)/1024:.0f} KB, '
              f'lm {os.path.getsize(os.path.join(self.out, lm_name + ".webp"))/1024:.0f} KB, {__import__("time").time()-t0:.0f}s')

    def _strip_attrs(self, path):
        """TEXCOORD_0 only where a texture needs it, COLOR_0 only on vertex-coloured materials."""
        b = open(path, 'rb').read()
        jl = struct.unpack('<I', b[12:16])[0]; J = json.loads(b[20:20 + jl]); rest = b[20 + jl:]
        names = [m.get('name', '') for m in J.get('materials', [])]
        for me in J['meshes']:
            for p in me['primitives']:
                mn = names[p['material']] if 'material' in p else ''
                at = p['attributes']
                if mn in self.vc_mats: at.pop('TEXCOORD_0', None)
                else: at.pop('COLOR_0', None)
                if 'TEXCOORD_1' in at and me.get('name') != 'Env': at.pop('TEXCOORD_1', None)
        js = json.dumps(J, separators=(',', ':')).encode()
        js += b' ' * ((4 - len(js) % 4) % 4)
        total = 12 + 8 + len(js) + len(rest)
        open(path, 'wb').write(struct.pack('<III', 0x46546C67, 2, total) + struct.pack('<II', len(js), 0x4E4F534A) + js + rest)
