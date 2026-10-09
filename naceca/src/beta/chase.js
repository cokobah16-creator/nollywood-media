/* =========================================================================
   NACECA · beta/chase.js — friends-beta pass (see docs/SYNC-2026-10-08-beta.md)
   "I lost him and couldn't see where he went." For foot chases (CHASE.active):
     · a glowing route line on the ground from Kelechi to the suspect, along
       the runner's own path (the only street data there is), direct where the
       way is clear
     · line of sight, ~10 Hz: out of sight for 3 s → "last seen": line, minimap
       blip, guide arrow and GAP meter use the last-seen point, which a bystander
       updates every 4 s (ping); live again the moment he's back in sight
     · tuning: catch chases cap the difficulty rate at 1.0 and keep the v12
       Pursuit Lines / intel slowdowns modest (the base speeds are lower now)
     · M6 "No hesitation": closing on Ifeanyi counts as committing
   The cold-open chase you can't win (catchDist −1) gets the line and the blip
   only. Stealth tails (TAIL, the cold-open courier, the car) get none of this.
   WAY.chase() → { mode:'live'|'lastseen', pos:{x,z}, catch, ping, label } | null
   ========================================================================= */
(function(){
'use strict';
const WAY = window.WAY = window.WAY || {};
const wrap = (name, make)=>{
  if(typeof V12 !== 'undefined' && V12.wrap) return V12.wrap(name, make);
  const orig = window[name]; if(typeof orig !== 'function') return false;
  const f = make(orig); f._v12orig = orig; window[name] = f; return true;
};
const hyp = Math.hypot;
const FX = window.CHASEFX = { line:null, stats:{ built:0, disposed:0, rebuilds:0 }, LOS_HZ:10, ROUTE_HZ:10, SIGHT:30, GRACE:3, REFRESH:4, MAXP:64 };

/* ---------- WAY.chase(): where the guidance should point during a chase ---------- */
WAY.chase = function(){
  const c = typeof CHASE !== 'undefined' && CHASE.active;
  if(!c || !c.runner || !c.runner.position) return null;
  const f = c.fx || {};
  const ls = f.mode === 'lastseen' && f.ls;
  return { mode: ls ? 'lastseen' : 'live', pos: ls ? f.ls : c.runner.position, catch: c.catchDist > 0, ping: f.ping || 0, label: c.label };
};

/* ---------- obstacles: 2D segment vs the axis-aligned blockers ---------- */
function segHitsBox(ax, az, bx, bz, o, pad){
  const minX = o.minX - pad, maxX = o.maxX + pad, minZ = o.minZ - pad, maxZ = o.maxZ + pad;
  let t0 = 0, t1 = 1; const dx = bx - ax, dz = bz - az;
  const clip = (p, q)=>{ if(Math.abs(p) < 1e-9) return q >= 0; const r = q / p; if(p < 0){ if(r > t1) return false; if(r > t0) t0 = r; } else { if(r < t0) return false; if(r < t1) t1 = r; } return true; };
  return clip(-dx, ax - minX) && clip(dx, maxX - ax) && clip(-dz, az - minZ) && clip(dz, maxZ - az) && t0 <= t1;
}
function segBlocked(ax, az, bx, bz, pad){
  for(const o of (ENGINE.obstacles || [])){ if(o.crouchOnly) continue; if(segHitsBox(ax, az, bx, bz, o, pad)) return true; }
  return false;
}
WAY.segBlocked = segBlocked;

/* ---------- line of sight ---------- */
const _los = { ray:null, o:null, d:null };
function sightSolids(){
  if(typeof TPCAM !== 'undefined' && TPCAM.solids && TPCAM.solidsScene === ENGINE.scene) return TPCAM.solids;
  if(typeof _camRay !== 'undefined' && _camRay.scene === ENGINE.scene && _camRay.solids) return _camRay.solids;
  return null;
}
function losTest(P, R){
  const d = hyp(R.x - P.x, R.z - P.z);
  if(d > FX.SIGHT) return false;
  if(segBlocked(P.x, P.z, R.x, R.z, 0)) return false;
  const solids = sightSolids();
  if(solids && solids.length && d > 0.5){
    if(!_los.ray){ _los.ray = new THREE.Raycaster(); _los.o = new THREE.Vector3(); _los.d = new THREE.Vector3(); }
    _los.o.set(P.x, 1.5, P.z); _los.d.set(R.x - P.x, -0.2, R.z - P.z); _los.d.normalize();
    _los.ray.set(_los.o, _los.d); _los.ray.far = d;
    const hits = _los.ray.intersectObjects(solids, false);
    if(Array.isArray(hits) && hits.length && hits[0].distance < d - 0.4) return false;
  }
  return true;
}
WAY.losTest = losTest;

/* ---------- route: Kelechi → (the runner's path) → suspect / last-seen point ---------- */
// cheapest of: straight there, or straight onto the path at some segment and along it.
// Jumps through blockers cost extra, so the line goes round the stalls instead of through them.
function routePoints(c, P, T, tSeg){
  const path = c.path, out = [{ x:P.x, z:P.z }];
  const s = Math.max(0, Math.min(tSeg, path.length - 2));
  const from = Math.max(0, s - 40);
  const pen = (ax, az, bx, bz)=> segBlocked(ax, az, bx, bz, 0.3) ? 1000 : 0;
  let best = { cost: hyp(T.x - P.x, T.z - P.z) + pen(P.x, P.z, T.x, T.z), j:-1, q:null };
  // remaining length from path node k (k ≤ s) to T along the path
  let rem = hyp(T.x - path[s][0], T.z - path[s][1]);
  for(let j = s; j >= from; j--){
    if(j < s) rem += hyp(path[j+1][0] - path[j][0], path[j+1][1] - path[j][1]);   // rem = from node j
    const a = path[j], b = (j === s) ? [T.x, T.z] : path[j+1];
    const vx = b[0] - a[0], vz = b[1] - a[1], L2 = vx*vx + vz*vz;
    let t = L2 > 1e-9 ? ((P.x - a[0])*vx + (P.z - a[1])*vz) / L2 : 0; t = Math.max(0, Math.min(1, t));
    const qx = a[0] + vx*t, qz = a[1] + vz*t;
    const remQ = rem - Math.sqrt(L2) * t;                      // from q, along the rest of segment j, then on
    const cost = hyp(qx - P.x, qz - P.z) + remQ + pen(P.x, P.z, qx, qz);
    if(cost < best.cost - 1e-6){ best = { cost, j, q:{ x:qx, z:qz } }; }
  }
  if(best.j >= 0){
    const add = (x, z)=>{ const l = out[out.length - 1]; if(hyp(x - l.x, z - l.z) > 0.25 && out.length < FX.MAXP - 1) out.push({ x, z }); };
    add(best.q.x, best.q.z);
    for(let k = best.j + 1; k <= s; k++) add(path[k][0], path[k][1]);
  }
  out.push({ x:T.x, z:T.z });
  return out;
}
WAY.routePoints = routePoints;

/* ---------- the ribbon (a flat strip: THREE.Line widths are ignored in WebGL) ---------- */
function makeRibbon(width, color, opacity, order, y){
  const N = FX.MAXP;
  const pos = new Float32Array(N * 2 * 3), idx = new Uint16Array((N - 1) * 6);
  for(let i = 0; i < N - 1; i++){ const a = i*2; idx[i*6] = a; idx[i*6+1] = a+1; idx[i*6+2] = a+2; idx[i*6+3] = a+1; idx[i*6+4] = a+3; idx[i*6+5] = a+2; }
  const g = new THREE.BufferGeometry();
  const attr = new THREE.BufferAttribute(pos, 3);
  if(attr.setUsage && THREE.DynamicDrawUsage) attr.setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('position', attr); g.setIndex(new THREE.BufferAttribute(idx, 1)); g.setDrawRange(0, 0);
  const mat = new THREE.MeshBasicMaterial({ color, transparent:true, opacity, depthWrite:false, fog:false, side:THREE.DoubleSide, toneMapped:false });
  const mesh = new THREE.Mesh(g, mat);
  mesh.frustumCulled = false; mesh.renderOrder = order; mesh.userData._routeLine = true;   // transparent, so camera collision already ignores it (don't tag _smoke: updateAtmosphere would billboard and sway it)
  ENGINE.scene.add(mesh);
  return { mesh, g, attr, pos, mat, width, y };
}
function buildLine(){
  disposeLine();
  if(!ENGINE.scene || typeof THREE === 'undefined') return;
  FX.line = { scene:ENGINE.scene, halo:makeRibbon(1.0, 0xB3261E, 0.3, 960, 0.035), core:makeRibbon(0.3, 0xF0503F, 0.95, 961, 0.045), n:0, pts:[] };
  FX.stats.built++;
}
function disposeLine(){
  const L = FX.line; if(!L) return;
  for(const r of [L.halo, L.core]){
    try{ if(r.mesh.parent) r.mesh.parent.remove(r.mesh); else if(L.scene && L.scene.remove) L.scene.remove(r.mesh); }catch(e){}
    try{ r.g.dispose(); r.mat.dispose(); }catch(e){}
  }
  FX.line = null; FX.stats.disposed++;
}
FX.dispose = disposeLine;
function writeRibbon(r, pts){
  const n = Math.min(pts.length, FX.MAXP), a = r.pos, hw = r.width / 2;
  for(let i = 0; i < n; i++){
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[Math.min(n - 1, i + 1)];
    let tx = p1.x - p0.x, tz = p1.z - p0.z; const L = hyp(tx, tz) || 1; tx /= L; tz /= L;
    const nx = -tz * hw, nz = tx * hw, o = i * 6;
    a[o] = pts[i].x + nx; a[o+1] = r.y; a[o+2] = pts[i].z + nz;
    a[o+3] = pts[i].x - nx; a[o+4] = r.y; a[o+5] = pts[i].z - nz;
  }
  r.attr.needsUpdate = true;
  r.g.setDrawRange(0, Math.max(0, n - 1) * 6);
}
function rebuildLine(c){
  const L = FX.line; if(!L || L.scene !== ENGINE.scene || !ENGINE.player) return;
  const f = c.fx, ls = f.mode === 'lastseen' && f.ls;
  const T = ls ? f.ls : c.runner.position, tSeg = ls ? f.lsSeg : c.seg;
  const pts = routePoints(c, ENGINE.player.position, T, tSeg);
  writeRibbon(L.halo, pts); writeRibbon(L.core, pts);
  L.pts = pts; L.n = pts.length; L.mode = f.mode; FX.stats.rebuilds++;
}

/* ---------- lifecycle ---------- */
wrap('startChase', orig => function(cfg){
  const c = orig.apply(this, arguments);
  if(!c) return c;
  if(c.catchDist > 0){
    // the base speeds are lower now (a joystick sprint has to close on him): difficulty never speeds him up,
    // and Pursuit Lines / tier-3 intel shave a little off instead of 12 % and 7 %
    const base = (cfg && cfg.speed) || c.baseSpeed || c.speed;
    let k = Math.min(1, typeof chaseRate === 'function' ? chaseRate() : 1);
    if(typeof V12 !== 'undefined'){
      if(V12.has && V12.has('pursuit')) k *= 0.95;
      if(V12.intelTier && V12.intelTier() >= 3) k *= 0.97;
    }
    c.speed = base * k;
  }
  c.fx = { losT:0, routeT:0, noLos:0, los:true, mode:'live', ls:null, lsSeg:0, lsT:0, ping:0 };
  c.track = null;
  WAY._chaseScene = ENGINE.scene;      // the minimap drops the suspect's spawn dot from here on
  try{ buildLine(); rebuildLine(c); }catch(e){ console.warn('[chase] route line', e); }
  return c;
});
wrap('stopChase', orig => function(){
  try{ disposeLine(); }catch(e){}
  return orig.apply(this, arguments);
});
wrap('newScene', orig => function(){
  try{ disposeLine(); }catch(e){}
  return orig.apply(this, arguments);
});
wrap('updateChase', orig => function(dt){
  const r = orig.apply(this, arguments);
  const c = CHASE.active;
  if(c && c.fx && ENGINE.player && dt > 0){ try{ fxTick(c, dt); }catch(e){ console.warn('[chase] fx', e); } }
  return r;
});
function setLastSeen(c){
  const f = c.fx, p = c.runner.position;
  f.ls = { x:p.x, z:p.z }; f.lsSeg = c.seg; f.ping++;
  f.routeT = 0;
}
function fxTick(c, dt){
  const f = c.fx, R = c.runner.position, P = ENGINE.player.position;
  if(c.catchDist > 0){
    f.losT -= dt;
    if(f.losT <= 1e-6){ f.losT = Math.max(0, f.losT + 1 / FX.LOS_HZ); f.los = (WAY._forceLos === true || WAY._forceLos === false) ? WAY._forceLos : losTest(P, R); }
    if(f.los){ f.noLos = 0; if(f.mode !== 'live'){ f.mode = 'live'; f.ls = null; f.routeT = 0; } }
    else {
      f.noLos += dt;
      if(f.mode === 'live'){ if(f.noLos > FX.GRACE){ f.mode = 'lastseen'; f.lsT = 0; setLastSeen(c); } }
      else { f.lsT += dt; if(f.lsT >= FX.REFRESH){ f.lsT -= FX.REFRESH; setLastSeen(c); } }
    }
    // M6 "No hesitation": closing on Ifeanyi within 12 s of the breach is a commitment, however long the chase runs
    if(typeof SIDE !== 'undefined' && SIDE.mid === 'm6' && c.runner === ENGINE._asabaRunner && SIDE.t0 != null && SIDE.commitT == null && hyp(R.x - P.x, R.z - P.z) <= 6){
      SIDE.committed = true; SIDE.commitT = SIDE.clock;
    }
  }
  c.track = f.mode === 'lastseen' ? f.ls : null;
  f.routeT -= dt;
  if(f.routeT <= 1e-6){ f.routeT = Math.max(0, f.routeT + 1 / FX.ROUTE_HZ); rebuildLine(c); }
}

})();
