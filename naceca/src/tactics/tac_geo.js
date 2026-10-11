/* =========================================================================
   NACECA · src/tactics/tac_geo.js — what the colliders look like to an eye
   Owner: Team A (foundations). DESIGN-tactics.md §3.3, §2.1 F-M7; foundations.md §3.2.

   Every ENGINE.obstacles entry gets o.vis = { kind, h, y0, name, box } where
     kind  'tall' | 'low'   an occluder (tall when its top is ≥ 1.7 m)
           'ghost'          collision only; `box` (if any) is what the eye sees instead
           'skip'           too thin or see-through (posts, plants, okadas)
           'person'         a bystander's own box (crowd cover uses the people, not the box)
     h     the top of the box above the floor (m); y0 its bottom; box [minX, maxX, minZ, maxZ]
   Classification is lazy (it reruns when the obstacle list, its length or the scene's table
   changes) and never touches collision: blockedAt() does not read `vis`.
   Order: an explicit vis → the scene table (centre and size within 0.03 m) → the dressed market's
   legacy-stall rule → the camera-blocker rule (≥ 80 % of the footprint inside one) → person
   (an NPC at the centre) → skip (larger side < 0.45 m) → unknown (a low 1.0 m box, counted).

   TAC.sight.los(ax,az,ah, bx,bz,bh) is the 2.5-D slab test over the vision boxes.
   ========================================================================= */
(function(){
'use strict';
const TAC = window.TAC;
if(!TAC || !TAC.v || TAC.geo._real) return;
const V = () => window.V12 || null;
const eng = () => (typeof ENGINE !== 'undefined') ? ENGINE : null;
const mission = () => TAC.mission();
const near = (a, b, e) => Math.abs(a - b) <= (e == null ? 0.03 : e);
const r2 = x => Math.round(x * 100) / 100, r3 = x => Math.round(x * 1000) / 1000;

/* ---------- the scene tables (heights measured from the baked GLBs, foundations.md §3.2) ---------- */
const T = (cx, cz, w, d, v) => ({ cx, cz, w, d, v });
const low = (h, name, box) => ({ kind:h >= 1.7 ? 'tall' : 'low', h, y0:0, name, box:box || null });
const SKIP = { kind:'skip', h:0, y0:0, name:null, box:null };
const DRESSED_MARKET = [
  T(7.6, 4, 0.75, 1.2, low(1.1, 'his counter', [7.15, 7.75, 3.45, 4.55])),
  // the EXTRA_OBSTACLES van (art_pass_v8.js:2667) is wider than the baked van: it sees as the van's blocker
  T(0, 14, 2.5, 4.6, { kind:'ghost', h:1.8, y0:0, name:'the van', box:[-0.765, 0.765, 11.885, 16.115] }),
  T(-11.7, -12.6, 1.4, 0.9, low(1.2, 'the crates')), T(12.5, 12.4, 1.4, 0.9, low(0.6, 'the crates')),
  T(-11.5, 7.4, 1.4, 0.9, low(0.6, 'the crates')), T(12.2, -17.4, 1.4, 0.9, low(1.2, 'the crates')),
  T(-11.9, 17.5, 1.4, 0.9, low(0.6, 'the crates')), T(-12.2, -3.2, 1.0, 0.7, low(0.7, 'the crates')),
  T(-12.4, 1.4, 1.8, 1.6, low(1.2, 'the stall')), T(-10.45, 1.4, 1.6, 2.4, low(0.85, 'the stall')),
  // the okadas are see-through frames (not in the Env mesh)
  T(-13.4, -8.5, 1.242, 2.084, SKIP), T(-13.6, 8.2, 1.068, 2.066, SKIP), T(13.8, -20.8, 2.057, 1.016, SKIP), T(-5.0, -24, 0.884, 2.027, SKIP),
];
// KC's 8 cm sign slab on his stand: transparent until the real-render check (DESIGN §9, §11.11)
const DRESSED_EXTRA = [{ kind:'skip', h:1.95, y0:1.25, name:'the sign', box:[6.96, 7.04, 2.8, 3.7] }];
const LEGACY_MARKET = (() => {
  const t = [];
  for(const s of [-1, 1]) for(const z of [-15, -10, -5, 5, 10, 15]){ const x = s * 10; t.push(T(x, z, 2.1, 1.7, low(0.9, 'the stall', [x - 1.0, x + 1.0, z - 0.4, z + 0.4]))); }   // addBox(2.0, 0.9, 0.8), market.js:41
  t.push(T(0, 14, 2.5, 4.6, low(1.85, 'the van')));
  return t;
})();
const MANSION = [
  T(-5.12, -0.25, 0.25, 8.6, low(3.3, 'the wall')), T(5.12, -0.25, 0.25, 8.6, low(3.3, 'the wall')),
  T(-2.97, -4.62, 4.05, 0.25, low(3.3, 'the wall')), T(2.97, -4.62, 4.05, 0.25, low(3.3, 'the wall')),
  T(-3.1, 4.12, 4.3, 0.25, low(3.3, 'the wall')), T(3.1, 4.12, 4.3, 0.25, low(3.3, 'the wall')),
  T(-0.97, 3.55, 0.08, 0.9, low(2.1, 'the door')), T(0.97, 3.55, 0.08, 0.9, low(2.1, 'the door')),
  T(-1.1, -6.7, 0.2, 4.0, low(2.9, 'the corridor wall')), T(1.1, -6.7, 0.2, 4.0, low(2.9, 'the corridor wall')),
  T(0, -8.68, 2.4, 0.2, low(2.9, 'the wall')), T(0.62, -7.2, 0.38, 1.0, low(1.16, 'the cabinet')),
  T(-3.92, -0.4, 0.95, 2.6, low(0.93, 'the sofa')), T(-2.35, -0.4, 0.8, 1.4, low(0.57, 'the cash table')),
  T(-1.72, 0.32, 0.45, 0.66, SKIP), T(-1.05, -2.35, 0.95, 0.95, low(0.96, 'the armchair')),
  T(-4.15, 1.3, 0.56, 0.56, low(1.1, 'the lamp table')), T(-4.4, -2.55, 0.5, 0.5, SKIP), T(-1.65, -4.15, 0.55, 0.55, SKIP),
  T(4.45, 3.45, 0.45, 0.45, SKIP), T(0, -3.3, 0.32, 0.32, SKIP),
  T(2.75, -4.27, 1.8, 0.44, low(0.88, 'the sideboard')), T(4.82, -1.0, 0.4, 3.5, low(2.5, 'the bookshelf')),
  T(3.2, -1.0, 0.86, 1.8, low(0.78, 'the desk')), T(2.2, -1.82, 0.62, 0.62, low(0.6, 'the chair')),
  T(4.75, 2.55, 0.46, 1.22, low(1.3, 'the cabinet')),
  T(4.12, -1.0, 0.5, 0.5, { kind:'person', h:0, y0:0, name:'Obi', box:null }),
  T(-2.3, 7.1, 0.42, 0.42, SKIP), T(2.3, 7.1, 0.42, 0.42, SKIP),
  T(-3.1, 5.0, 0.66, 0.66, low(0.64, 'the planter')), T(3.1, 5.0, 0.66, 0.66, low(0.64, 'the planter')),
  T(-2.7, 11.2, 2.3, 4.7, low(1.41, 'the car')), T(2.9, 11.9, 2.3, 4.7, low(1.56, 'the car')),
  T(-7.6, 11.8, 0.9, 8.7, low(1.2, 'the hedge')), T(7.6, 11.8, 0.9, 8.7, low(1.2, 'the hedge')),
  T(0, 16.2, 16, 0.35, low(1.93, 'the front wall')),
  T(-6.4, 9.0, 0.4, 0.4, SKIP), T(6.5, 13.5, 0.4, 0.4, SKIP), T(-6.6, 14.2, 0.4, 0.4, SKIP),
];
const VEH_NAME = { vanN:'the van', van:'the van', danfo:'the danfo', keke:'the keke', taxi:'the taxi', sedan:'the car', okada:'the okada' };

// which table this scene uses (null = none: everything goes through the rules)
function tableKey(){
  const e = eng(); if(!e) return null;
  if(e._mansion) return 'mansion';
  if(mission() === 'm3') return 'mansion_legacy';
  if(e._dress && e._dress.key === 'market') return 'market';
  if(mission() === 'm2' && !e._dress) return 'market_legacy';
  return null;
}
const TABLES = { market:DRESSED_MARKET, market_legacy:LEGACY_MARKET, mansion:MANSION, mansion_legacy:[] };

/* ---------- classification ---------- */
const fp = o => ({ cx:(o.minX + o.maxX) / 2, cz:(o.minZ + o.maxZ) / 2, w:o.maxX - o.minX, d:o.maxZ - o.minZ });
const findT = (o, tab) => { const f = fp(o); return tab.find(t => near(t.cx, f.cx) && near(t.cz, f.cz) && near(t.w, f.w) && near(t.d, f.d)) || null; };
const isLegacyStall = o => { const f = fp(o); return near(f.w, 2.1) && near(f.d, 1.7) && near(Math.abs(f.cx), 10) && [5, 10, 15].some(z => near(Math.abs(f.cz), z)); };
const npcAt = (x, z) => {
  const e = eng();
  for(const n of ((e && e.npcs) || [])){
    const m = n && (n.isObject3D || (n.position && !n.mesh) ? n : n.mesh);
    const p = m && m.position; if(!p) continue;
    if(Math.hypot((+p.x || 0) - x, (+p.z || 0) - z) < 0.05) return true;
  }
  return false;
};
function blockerFor(o, key){
  const e = eng(), meta = e && e._dress && e._dress.meta; if(!meta || !meta.blockers) return null;
  const f = fp(o), area = Math.max(1e-9, f.w * f.d);
  let best = null, bk = 0;
  for(const b of meta.blockers){
    const minX = b[0] - b[3] / 2, maxX = b[0] + b[3] / 2, minZ = b[2] - b[5] / 2, maxZ = b[2] + b[5] / 2;
    const ix = Math.max(0, Math.min(o.maxX, maxX) - Math.max(o.minX, minX)), iz = Math.max(0, Math.min(o.maxZ, maxZ) - Math.max(o.minZ, minZ));
    const k = ix * iz / area;
    if(k > bk){ bk = k; best = { b, box:[minX, maxX, minZ, maxZ] }; }
  }
  if(!best || bk < 0.8 - 1e-9) return null;
  const b = best.b, y0 = r3(b[1] - b[4] / 2), h = r3(b[1] + b[4] / 2);
  let name = b[4] > 3 ? 'the building' : 'the vehicle';
  if(b[4] <= 3 && meta.anchors){
    let bd = 1.0;
    for(const k of Object.keys(meta.anchors)){ const a = meta.anchors[k]; if(!a || !a.pos || !a.veh) continue; const d = Math.hypot(a.pos[0] - b[0], a.pos[2] - b[2]); if(d < bd){ bd = d; name = VEH_NAME[a.veh] || name; } }
  }
  return { kind:'ghost', h, y0:Math.max(0, y0), name, box:best.box.map(r3), src:'blocker' };
}
function classifyOne(o, key){
  const tab = key ? TABLES[key] : null;
  if(tab){ const t = findT(o, tab); if(t) return Object.assign({}, t.v, { box:t.v.box ? t.v.box.slice() : null, src:'table' }); }
  if(key === 'market' && isLegacyStall(o)){
    const f = fp(o);   // the visible counter is rotated 90° against its 2.1 × 1.7 collider: 0.9 × 2.0, top ≈ 1.0 m
    return { kind:'ghost', h:1.0, y0:0, name:'the stall', box:[r2(f.cx - 0.45), r2(f.cx + 0.45), r2(f.cz - 1.0), r2(f.cz + 1.0)], src:'legacy' };
  }
  const bl = blockerFor(o, key); if(bl) return bl;
  const f = fp(o);
  if(npcAt(f.cx, f.cz)) return { kind:'person', h:0, y0:0, name:null, box:null, src:'person' };
  if(Math.max(f.w, f.d) < 0.45) return { kind:'skip', h:0, y0:0, name:null, box:null, src:'size' };
  return { kind:'low', h:1.0, y0:0, name:'something', box:null, src:'unknown' };
}

const C = { obs:null, n:-1, key:undefined, scene:null, boxes:[], stats:null, grid:null };
function build(){
  const e = eng(), obs = (e && e.obstacles) || [], key = tableKey();
  const stats = { boxes:0, ghost:0, skip:0, person:0, unknown:0, matched:0, total:obs.length, table:key, unknownAt:[], extra:[] };
  const B = [], seen = new Set();
  const addBox = (box, y0, y1, name, src) => {
    const k = box.map(v => v.toFixed(3)).join(',') + '|' + y0.toFixed(2) + '|' + y1.toFixed(2);
    if(seen.has(k)) return; seen.add(k);
    B.push({ minX:box[0], maxX:box[1], minZ:box[2], maxZ:box[3], y0, y1, name, tall:y1 >= 1.7 && y0 <= 0.8, src });
  };
  for(const o of obs){
    if(!o) continue;
    if(!o.vis || o.vis._auto){ const v = classifyOne(o, key); v._auto = true; o.vis = v; }
    const v = o.vis, src = v.src || (v._auto ? 'auto' : 'explicit');
    const fpBox = [o.minX, o.maxX, o.minZ, o.maxZ];
    const y0 = +v.y0 || 0; let y1 = +v.h || 0; if(y1 <= y0) y1 = y0 + Math.max(0, y1);   // h given as a height above y0
    if(src === 'unknown'){ stats.unknown++; stats.unknownAt.push([r2((o.minX + o.maxX) / 2), r2((o.minZ + o.maxZ) / 2)]); }
    else stats.matched++;
    if(v.kind === 'ghost'){ stats.ghost++; if(v.box) addBox(v.box, y0, y1, v.name || 'something', src); continue; }
    if(v.kind === 'skip'){ stats.skip++; continue; }
    if(v.kind === 'person'){ stats.person++; continue; }
    if(y1 > y0) addBox(v.box || fpBox, y0, y1, v.name || 'something', src);
  }
  if(key === 'market') for(const x of DRESSED_EXTRA){ stats.extra.push(Object.assign({}, x, { box:x.box.slice() })); if(x.kind === 'skip') stats.skip++; else addBox(x.box, x.y0, x.h, x.name, 'extra'); }
  stats.boxes = B.length;
  C.boxes = B; C.stats = stats; C.obs = e ? e.obstacles : null; C.n = obs.length; C.key = key; C.scene = e ? e.scene : null;
  C.grid = grid(B);
  return stats;
}
function fresh(){
  const e = eng(); if(!e) return C;
  const obs = e.obstacles || null;
  if(C.obs !== obs || C.n !== (obs ? obs.length : 0) || C.key !== tableKey() || C.scene !== e.scene) build();
  return C;
}
// a coarse 2 m grid over the boxes: the broadphase for the segment test
function grid(B){
  if(!B.length) return null;
  const S = 2;
  let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
  for(const b of B){ x0 = Math.min(x0, b.minX); z0 = Math.min(z0, b.minZ); x1 = Math.max(x1, b.maxX); z1 = Math.max(z1, b.maxZ); }
  const nx = Math.max(1, Math.ceil((x1 - x0) / S)), nz = Math.max(1, Math.ceil((z1 - z0) / S));
  if(nx * nz > 40000) return null;
  const cells = new Array(nx * nz);
  B.forEach((b, i) => {
    const ia = Math.max(0, Math.floor((b.minX - x0) / S)), ib = Math.min(nx - 1, Math.floor((b.maxX - x0) / S));
    const ja = Math.max(0, Math.floor((b.minZ - z0) / S)), jb = Math.min(nz - 1, Math.floor((b.maxZ - z0) / S));
    for(let ii = ia; ii <= ib; ii++) for(let jj = ja; jj <= jb; jj++){ const c = jj * nx + ii; (cells[c] || (cells[c] = [])).push(i); }
  });
  return { S, x0, z0, nx, nz, cells, mark:new Uint32Array(B.length), stamp:0 };
}

/* ---------- 2.5-D line of sight: eye (ax, az, ah) → target (bx, bz, bh) ---------- */
const PAD = 0.05;
function hit(b, ax, az, ah, bx, bz, bh){
  // a watcher stands inside his own box (Obi, art_pass_v8.js:1842), the player may stand in a ghost's: skip those
  if(ax > b.minX - PAD && ax < b.maxX + PAD && az > b.minZ - PAD && az < b.maxZ + PAD) return false;
  if(bx > b.minX - PAD && bx < b.maxX + PAD && bz > b.minZ - PAD && bz < b.maxZ + PAD) return false;
  const dx = bx - ax, dz = bz - az;
  let t0 = 0, t1 = 1;
  const clip = (p, q) => { if(Math.abs(p) < 1e-12) return q >= 0; const r = q / p; if(p < 0){ if(r > t1) return false; if(r > t0) t0 = r; } else { if(r < t0) return false; if(r < t1) t1 = r; } return true; };
  if(!(clip(-dx, ax - b.minX) && clip(dx, b.maxX - ax) && clip(-dz, az - b.minZ) && clip(dz, b.maxZ - az) && t0 <= t1)) return false;
  const y0 = ah + (bh - ah) * t0, y1 = ah + (bh - ah) * t1;
  return Math.min(y0, y1) <= b.y1 && Math.max(y0, y1) >= b.y0;
}
function los(ax, az, ah, bx, bz, bh){
  const c = fresh(), B = c.boxes, G = c.grid;
  ax = +ax || 0; az = +az || 0; bx = +bx || 0; bz = +bz || 0; ah = +ah || 0; bh = +bh || 0;
  const lo = Math.min(ax, bx), hi = Math.max(ax, bx), lz = Math.min(az, bz), hz = Math.max(az, bz);
  let best = null;
  const test = i => {
    const b = B[i];
    if(b.maxX < lo || b.minX > hi || b.maxZ < lz || b.minZ > hz) return;
    if(!hit(b, ax, az, ah, bx, bz, bh)) return;
    if(!best || (b.tall && !best.tall)) best = b;
  };
  if(G){
    G.stamp = (G.stamp + 1) >>> 0; if(!G.stamp){ G.mark.fill(0); G.stamp = 1; }
    const ia = Math.max(0, Math.floor((lo - G.x0) / G.S)), ib = Math.min(G.nx - 1, Math.floor((hi - G.x0) / G.S));
    const ja = Math.max(0, Math.floor((lz - G.z0) / G.S)), jb = Math.min(G.nz - 1, Math.floor((hz - G.z0) / G.S));
    for(let ii = ia; ii <= ib && !(best && best.tall); ii++) for(let jj = ja; jj <= jb; jj++){
      const cell = G.cells[jj * G.nx + ii]; if(!cell) continue;
      for(const i of cell){ if(G.mark[i] === G.stamp) continue; G.mark[i] = G.stamp; test(i); if(best && best.tall) break; }
    }
  } else for(let i = 0; i < B.length; i++){ test(i); if(best && best.tall) break; }
  return best ? { clear:false, by:best.tall ? 'tall' : 'low', name:best.name } : { clear:true, by:null, name:null };
}

/* ---------- geo_drift: once per scene build, where a table should have matched ---------- */
let drift = { pending:false, logged:false };
TAC.onScene(() => { drift = { pending:true, logged:false }; C.obs = null; }, { order:-15 });
function checkDrift(){
  if(!drift.pending || drift.logged) return;
  drift.pending = false;
  const key = tableKey(); if(!key) return;
  const e = eng();
  const log = d => { drift.logged = true; try{ if(V() && V12.log) V12.log('geo_drift', d); }catch(err){ TAC._err(err); } };
  if(key === 'mansion_legacy'){ log({ scene:'m3', reason:'legacy', unknown:[], matched:0, total:((e && e.obstacles) || []).length }); return; }
  const s = fresh().stats;
  const tableN = key === 'mansion' ? MANSION.length : 0;
  if(s.unknown > 0 || (key === 'mansion' && s.matched < tableN)) log({ scene:key, reason:'table', unknown:s.unknownAt.slice(0, 20), matched:s.matched, total:s.total });
}
TAC.onTick(() => { try{ checkDrift(); }catch(e){ TAC._err(e); } }, { order:-50 });

/* ---------- the API (DESIGN §3.3): same signatures as the kernel's fallback ---------- */
const geo = TAC.geo;
geo.ready = () => !(mission() === 'm3' && !(eng() && ENGINE._mansion));
geo.classify = () => {
  const s = fresh().stats || build();
  return { boxes:s.boxes, ghost:s.ghost, skip:s.skip, person:s.person, unknown:s.unknown,
    matched:s.matched, total:s.total, table:s.table, unknownAt:s.unknownAt.slice(), extra:s.extra.map(x => Object.assign({}, x)) };
};
geo.add = (cx, cz, w, d, o) => {
  if(typeof addObstacle !== 'function') return null;
  addObstacle(cx, cz, w, d);
  const e = eng(), ob = e.obstacles[e.obstacles.length - 1];
  if(ob){
    o = o || {};
    const h = o.h == null ? 1 : +o.h, y0 = +o.y0 || 0;
    ob.vis = { kind:o.kind || ((h >= 1.7) ? 'tall' : 'low'), h, y0, name:o.name || null, box:null, src:'explicit' };
  }
  C.obs = null;
  return ob;
};
geo._boxes = () => fresh().boxes.slice();      // tests and tuning grids
geo._los = los;
geo._real = true;
geo.full = true;
TAC.sight.los = los;          // the kernel's fallback model reads it at call time; tac_sight.js keeps it
})();
