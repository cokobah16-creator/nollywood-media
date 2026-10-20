/* =========================================================================
   NACECA · v13 world — the Season 2 scenes come alive
   Lights for each baked scene (the characters and loose props are lit
   live; the scene itself is baked), water that moves, fires that breathe,
   smoke over the creek camp, the courtroom fans, the tank farm's flare,
   gate and boom, and the DG's double doors.
   ========================================================================= */
(function(){
'use strict';
const V13 = window.V13;

/* ---------- lights per scene (dressScene config) ---------- */
Object.assign(V13.LIGHTS, {
  sapele:{ bg:'#060a16', fog:['#0e1626', 22, 90], lights:{ sky:'#3a4a70', ground:'#1a140e', hemi:0.5, key:['#8a9ac8', 0.42, [-6, 10, -12], [0, 0, 0]],
    points:[ { pos:[0, 3.2, 8], c:'#ffc070', i:0.8, d:12 }, { pos:[-5, 2.2, 1], c:'#ffc070', i:0.7, d:7 }, { pos:[5, 2.2, -6], c:'#ffc070', i:0.6, d:8 }, { pos:[0, 3, -21], c:'#ffc070', i:0.6, d:8 } ] } },
  creek:{ bg:'#04060c', fog:['#0a0e16', 16, 75], lights:{ sky:'#2a3a5a', ground:'#1a120a', hemi:0.45, key:['#8a9ac8', 0.35, [8, 12, -10], [0, 0, 0]],
    points:[ { pos:[1.8, 0.7, 2], c:'#ff7a28', i:1.3, d:9, name:'oven1' }, { pos:[4.8, 0.7, 4.5], c:'#ff7a28', i:1.3, d:9, name:'oven2' }, { pos:[7.8, 0.7, 1], c:'#ff7a28', i:1.3, d:9, name:'oven3' }, { pos:[-7.45, 2.2, 7.4], c:'#ffd08a', i:0.6, d:6 } ] } },
  maitama:{ bg:'#05070f', fog:['#141826', 28, 95], lights:{ sky:'#3a4a70', ground:'#2a1c10', hemi:0.45, key:['#8a9ac8', 0.3, [-6, 10, -10], [0, 0, 0]],
    points:[ { pos:[-2.5, 8.9, 5.6], c:'#ff9a40', i:0.9, d:16 }, { pos:[2.5, 8.9, -5], c:'#ff9a40', i:0.9, d:16 }, { pos:[2.5, 8.9, 15.8], c:'#ff9a40', i:0.9, d:16 },
      { pos:[-2.5, 8.9, 26], c:'#ff9a40', i:0.9, d:16 }, { pos:[-2.5, 8.9, -13], c:'#ff9a40', i:0.9, d:16 }, { pos:[5.7, 1.2, 4.6], c:'#ffc070', i:0.6, d:5 } ] } },
  tankfarm:{ bg:'#3a2c38', fog:['#6a5658', 45, 150], lights:{ sky:'#ffc89a', ground:'#3a2a1e', hemi:0.6, key:['#ffb070', 0.95, [-30, 12, 8], [0, 0, 0]],
    shadow:{ r:12, far:60, follow:true, opacity:0.32, catcher:[0, 0, 70, 70] }, points:[ { pos:[-4, 5.5, 0], c:'#fff0d0', i:0.5, d:12 }, { pos:[-15, 2.6, 8], c:'#ffe2b8', i:0.5, d:8 } ] } },
  tankfarm_n:{ bg:'#04060c', fog:['#0c1220', 28, 110], lights:{ sky:'#3a4a70', ground:'#1a140e', hemi:0.42, key:['#a0b0d8', 0.32, [10, 14, -10], [0, 0, 0]],
    points:[ { pos:[-4, 6, 0], c:'#fff0d0', i:0.9, d:16 }, { pos:[6, 4, -26], c:'#ffd9a0', i:0.9, d:14 }, { pos:[0, 6, 20], c:'#e8f0ff', i:0.8, d:16 }, { pos:[-15, 3, 8], c:'#ffe2b8', i:0.5, d:9 },
      { pos:[12, 2.5, -28], c:'#ffd27a', i:0.7, d:6, name:'cash' } ] } },
  abuja_office:{ bg:'#cfdbe8', fog:['#cfdbe8', 40, 140], ceilingY:3.3, lights:{ sky:'#f4f6fa', ground:'#5a4a3a', hemi:0.75, key:['#fff2e0', 0.55, [2, 6, -12], [0, 0, 0]],
    points:[ { pos:[0, 2.6, -8], c:'#ffe6c8', i:0.35, d:8 }, { pos:[-3, 2.6, 5], c:'#ffe6c8', i:0.3, d:7 } ] } },
  court:{ bg:'#c8d4e0', fog:['#c8d4e0', 40, 140], ceilingY:4.45, lights:{ sky:'#eef2f6', ground:'#2a3a2a', hemi:0.72, key:['#fff6ea', 0.45, [-8, 7, 4], [0, 0, 0]],
    points:[ { pos:[0, 3.6, -8], c:'#fff2e0', i:0.35, d:9 }, { pos:[0, 3.6, 0], c:'#f4f8ff', i:0.3, d:10 } ] } },
});

/* ---------- smoke: soft billboards rising and fading ---------- */
let smokeTex = null;
function smokeTexture(){
  if(smokeTex) return smokeTex;
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 2, 32, 32, 31); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.5, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  smokeTex = new THREE.CanvasTexture(c); return smokeTex;
}
function smokeColumn(scene, pos, opt){
  opt = Object.assign({ n:14, color:'#1a1614', rise:1.1, spread:0.5, size:1.6, life:5.5, opacity:0.55 }, opt || {});
  const parts = [];
  for(let i = 0; i < opt.n; i++){
    const m = new THREE.SpriteMaterial({ map:smokeTexture(), color:new THREE.Color(opt.color), transparent:true, depthWrite:false, opacity:0 });
    const s = new THREE.Sprite(m); s.renderOrder = 3; scene.add(s);
    parts.push({ s, t:(i / opt.n) * opt.life, ox:(Math.random() - 0.5) * 0.3, oz:(Math.random() - 0.5) * 0.3, drift:0.3 + Math.random() * 0.4 });
  }
  return { parts, pos, opt, update(dt){
    for(const p of parts){
      p.t += dt; if(p.t > opt.life) p.t -= opt.life;
      const k = p.t / opt.life;
      p.s.position.set(pos[0] + p.ox + k * p.drift * 1.8, pos[1] + k * opt.rise * opt.life, pos[2] + p.oz - k * p.drift);
      const sz = opt.size * (0.5 + k * 1.6); p.s.scale.set(sz, sz, 1);
      p.s.material.opacity = opt.opacity * Math.sin(Math.PI * Math.min(1, k * 1.15));
    }
  } };
}

/* ---------- per-scene animation ---------- */
const W = V13.world = { live:null };
function pivotAt(obj, x, y, z){
  if(!obj || !obj.parent) return null;
  const pv = new THREE.Group(); pv.position.set(x, y, z); obj.parent.add(pv); pv.updateMatrixWorld(true); pv.attach(obj); return pv;
}
function mats(obj){ const L = []; if(obj) obj.traverse(m => { if(m.isMesh && m.material) L.push(m); }); return L; }
W.dress = function(key, dr){
  const L = W.live = { key, t:0, fx:[] };
  if(!dr) return;
  const D = dr.D || {}, sc = ENGINE.scene;
  // water: the texture drifts, the surface breathes
  if(D.Water){
    const ms = mats(D.Water).map(m => { m.material = m.material.clone(); if(m.material.map){ m.material.map = m.material.map.clone(); m.material.map.needsUpdate = true; m.material.map.wrapS = m.material.map.wrapT = THREE.RepeatWrapping; } return m.material; });
    L.fx.push(t => { for(const m of ms){ if(m.map){ m.map.offset.x = (t * 0.006) % 1; m.map.offset.y = Math.sin(t * 0.21) * 0.01; } } });
  }
  if(D.Crude){ const ms = mats(D.Crude).map(m => (m.material = m.material.clone())); L.fx.push(t => { for(const m of ms) if(m.color) m.color.setScalar(0.92 + 0.06 * Math.sin(t * 0.9)); }); }
  // fire: one node for every flame in the scene — breathe its brightness, flicker the bake-free lights
  if(D.Fire){
    const ms = mats(D.Fire).map(m => (m.material = m.material.clone()));
    const base = ms.map(m => m.color ? m.color.clone() : null);
    L.fx.push(t => { const k = 0.82 + 0.18 * Math.abs(Math.sin(t * 9.3) + 0.5 * Math.sin(t * 14.1 + 1.3)); ms.forEach((m, i) => { if(m.color && base[i]) m.color.copy(base[i]).multiplyScalar(k); }); });
  }
  for(const nm of ['L_oven1', 'L_oven2', 'L_oven3']){ const l = D[nm]; if(l){ const b = l.intensity, ph = Math.random() * 7; L.fx.push(t => { l.intensity = b * (0.75 + 0.25 * Math.sin(t * 11.3 + ph) + 0.12 * Math.sin(t * 23.7 + ph)); }); } }
  // the creek camp's smoke, a little from the Sapele grill
  if(key === 'creek'){
    for(const n of ['smoke1', 'smoke2', 'smoke3']){ const a = V13.at(key, n); if(a){ const s = smokeColumn(sc, [a.x, 2.0, a.z], { n:16, color:'#141210', size:2.0, rise:1.3, opacity:0.6 }); L.fx.push((t, dt)=>s.update(dt)); } }
  }
  if(key === 'sapele'){ const a = V13.at(key, 'buka_grill'); if(a){ const s = smokeColumn(sc, [a.x, 1.1, a.z], { n:8, color:'#8a8478', size:0.9, rise:0.7, opacity:0.32, life:4 }); L.fx.push((t, dt)=>s.update(dt)); } }
  // the courtroom fans
  for(let i = 1; i <= 3; i++){
    const f = D['Fan' + i], a = V13.at(key, 'fan' + i); if(!f || !a) continue;
    const pv = pivotAt(f, a.x, a.y, a.z); if(!pv) continue;
    const sp = 3.2 + i * 0.4; L.fx.push((t, dt)=>{ pv.rotation.y += sp * dt; });
  }
  // the tank farm: the flare breathes, the red aviation lights blink
  if(D.Flare){ const ms = mats(D.Flare).map(m => (m.material = m.material.clone())); const base = ms.map(m => m.color ? m.color.clone() : null);
    L.fx.push(t => { const k = 0.8 + 0.25 * Math.abs(Math.sin(t * 5.1) + 0.4 * Math.sin(t * 8.3)); ms.forEach((m, i) => { if(m.color && base[i]) m.color.copy(base[i]).multiplyScalar(k); }); }); }
  if(D.GlowsRed){ const g = D.GlowsRed; L.fx.push(t => { g.visible = (t % 1.6) < 0.8; }); }
  // movable things the cases drive
  if(D.Gate){ L.gate = { obj:D.Gate, open:0, want:0, x0:D.Gate.position.x }; L.fx.push((t, dt)=>{ const G = L.gate; G.open += (G.want - G.open) * Math.min(1, dt * 1.2); G.obj.position.x = G.x0 - G.open * 5.2; }); }
  if(D.Boom){ const a = V13.at(key, 'boom_pivot'); const pv = a ? pivotAt(D.Boom, a.x, a.y, a.z) : null; if(pv){ L.boom = { pv, up:0, want:0 }; L.fx.push((t, dt)=>{ const B = L.boom; B.up += (B.want - B.up) * Math.min(1, dt * 2); pv.rotation.z = B.up * 1.35; }); } }
  if(D.CashDoor){ const a = V13.at(key, 'cashdoor_hinge'); const pv = a ? pivotAt(D.CashDoor, a.x, 0, a.z) : null; if(pv){ L.cash = { pv, open:0, want:0 }; L.fx.push((t, dt)=>{ const C = L.cash; C.open += (C.want - C.open) * Math.min(1, dt * 2.5); pv.rotation.y = -C.open * 1.6; }); } }
  if(D.DoorL && D.DoorR){
    const pl = pivotAt(D.DoorL, -0.9, 0, 1.6), pr = pivotAt(D.DoorR, 0.9, 0, 1.6);
    if(pl && pr){ L.doors = { open:0, want:0 }; L.fx.push((t, dt)=>{ const d = L.doors; d.open += (d.want - d.open) * Math.min(1, dt * 2.2); pl.rotation.y = d.open * Math.PI / 2; pr.rotation.y = -d.open * Math.PI / 2; }); }
  }
};
W.update = function(dt){
  const L = W.live; if(!L) return;
  L.t += dt;
  for(const f of L.fx){ try{ f(L.t, dt); }catch(e){} }
};
W.open = (what, v)=>{ const L = W.live; if(what === 'cashdoor') what = 'cash'; if(L && L[what]) L[what].want = v == null ? 1 : v; };
})();
