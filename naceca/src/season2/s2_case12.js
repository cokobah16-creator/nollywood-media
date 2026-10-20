/* =========================================================================
   NACECA · v13 Case 12 — Paper Oil (Riverstone tank farm, Port Harcourt, 17:40)
   Barrister Danladi meets Kelechi and Uche outside Riverstone Marine's gate:
   a magistrate's warrant (fifty minutes on Aba Road) or straight in. Inside:
   a warm shredder if they waited, a manager who writes everything down, a
   USB stick in a glovebox, Tank 3's diesel on a lab bench, and a union
   chairman by the jetty who has watched the night barges for years. Then:
   who really owns Riverstone, where its money goes, and a call from Abuja.
   ========================================================================= */
(function(){
'use strict';
const V13 = window.V13, MC = V13.mc;
const K = 'tankfarm';
const RT = ()=>V13.rt;
const A = (n, d)=>V13.at(K, n, d);
const FLAGS = ['s2_warrant', 's2_search', 's2_inventory', 's2_sotonye', 's2_ibinabo'];
const EVIDS = ['loading_log', 'tank3_sample', 'gate_register', 'cac_record', 'bank_trail'];
const DOCKEYS = ['m12_log', 'm12_sample', 'm12_cac'];
const EVNAME = {
  loading_log:'The real loading log', tank3_sample:'Tank 3 diesel sample', gate_register:'Gate register — tankers out',
  cac_record:'CAC record — Riverstone Marine', bank_trail:'Riverstone → Maitama Haven transfers',
};

/* ---------- evidence quality: one rule per exhibit (Case 14 and the finale read these) ----------
   went in without a warrant  → the log, the sample and the gate register are contested
   inventory skipped          → the gate register and the log are contested
   a document failed twice    → that exhibit is weak (the document system sets it)
   otherwise                  → good                                                          */
const wentIn = ()=>MC().s2_warrant === 'went_in';
const skipped = ()=>MC().s2_inventory === 'skipped';
const QUAL = {
  loading_log:()=>(wentIn() || skipped()) ? 'contested' : 'good',
  tank3_sample:()=>wentIn() ? 'contested' : 'good',
  gate_register:()=>(wentIn() || skipped()) ? 'contested' : 'good',
  cac_record:()=>'good',
  bank_trail:()=>'good',
};
/* A choice that carries a flag but no effect never reaches moralChoices (applyEffect returns
   early when there is no effect). Most of this case's decisions are like that, so while the
   case runs the flag is applied. (Case 11 carries the same fix for itself; it belongs in core.) */
V13.wrap('applyEffect', orig => function(eff, flag){
  if(!eff && flag && typeof flag === 'object' && S.game && S.game.currentMission === 'm12') return orig.call(this, {}, flag);
  return orig.apply(this, arguments);
});
/* the waterfront's sound: the river bed (water at the jetty, a generator, a boat going by) */
(function(){
  const SND = window.V12 && window.V12.SND; if(!SND || typeof SND.scene !== 'function' || SND._c12) return;
  const orig = SND.scene; SND._c12 = true;
  SND.scene = function(mid){ return orig.call(this, mid === 'm12' ? 'm6' : mid); };
})();
const setQ = (id, q)=>{ S.game.evQ = S.game.evQ || {}; S.game.evQ[id] = q; };
/* casework mode and the countdown rate (V13.rec / V13.timeRate from s2_core.js when present, else the same rule):
   Recruit gets the next-step lines; every countdown advances by dt * the Action-pace rate (0 = timed sequences off) */
const rec = ()=>typeof V13.rec === 'function' ? !!V13.rec() : (typeof isRecruit === 'function' && isRecruit());
const rate = ()=>{ const r = typeof V13.timeRate === 'function' ? V13.timeRate() : (typeof timerRate === 'function' ? timerRate() : 1); return (typeof r === 'number' && isFinite(r) && r >= 0) ? r : 1; };
/* Tobi is alive iff he was rescued, or chased and the hostage was not lost (STORY-CANON; V13.tobiAlive from s2_core.js) */
const tobiAlive = ()=>typeof V13.tobiAlive === 'function' ? !!V13.tobiAlive() : (m => m.asaba === 'rescue' || (m.asaba === 'chase' && !S.game._asabaHostageLost))(S.game.moralChoices || {});
const grade = id => { if(!V13.hasEv(id)) return; setQ(id, (RT().failed || {})[id] ? 'weak' : QUAL[id]()); };

/* ---------- the few lines this file adds (radio and toasts, in the writers' voice) ---------- */
const X = {
  m12_x_cold:"Shredder's cold, sir. Nobody had time.",
  m12_x_phone:"The guard is on his phone, sir. Whoever he's calling is coming. Papers first.",
  m12_x_phone_sr:"The guard is on his phone, sir. Whoever he's calling is coming.",                  // Senior: no order of work
  m12_x_prado:"Black Prado at the gate, sir. Nobody got out. One phone call, and it's gone.",
  m12_x_beat:"Papers are in our car, sir. Let whoever he called come now.",
  // Recruit only (the next step): m12_x_both, m12_x_union, m12_x_tank
  m12_x_both:"Tank 3 next, sir. And the boat drivers' shed by the jetty. Boat people see every barge that ties up.",
  m12_x_union:"The boat drivers' shed by the jetty, sir. Boat people see every barge that ties up.",
  m12_x_tank:"Tank 3 now, sir. A bottle from that valve, then the lab bench.",
  m12_x_bin:'"That bin first, Agent. Whatever went into it, I want back."',
  m12_x_binlater:'"The bin stays bagged. I still want that page."',
  m12_x_lab:'"A bottle proves nothing until somebody tests it in front of a witness."',
};

/* ---------- small helpers ---------- */
const PI = Math.PI;
const faceTo = (ch, x, z)=>{ if(ch) ch.rotation.y = Math.atan2(x - ch.position.x, z - ch.position.z); };
function meet(npc){
  const P = ENGINE.player; if(!P || !npc) return;
  faceTo(npc, P.position.x, P.position.z); faceTo(P, npc.position.x, npc.position.z); ENGINE.playerYaw = P.rotation.y;
}
function addIt(it, rank){
  it._m12rank = rank;
  ENGINE.interactables.sort((a, b)=>(a._m12rank || 0) - (b._m12rank || 0));   // the guide marker follows the case's order
  return it;
}
const objText = (id, t)=>{ if(typeof setObjectiveText === 'function') setObjectiveText(id, t); };
/* a person walks a path; a newer walk on the same person cancels the older one */
function walkTo(ch, path, opt){
  opt = opt || {};
  const tok = ch.userData._m12w = (ch.userData._m12w || 0) + 1;
  const speed = opt.speed || 1.6; let seg = 0;
  return new Promise(res => V13.every(dt => {
    if(!ch.parent || ch.userData._m12w !== tok){ res(false); return false; }
    V13.play(ch, opt.clip || 'walk');
    let step = speed * dt;
    while(step > 0 && seg < path.length){
      const b = path[seg], dx = b[0] - ch.position.x, dz = b[1] - ch.position.z, d = Math.hypot(dx, dz);
      if(d <= step){ ch.position.x = b[0]; ch.position.z = b[1]; step -= d; seg++; }
      else { ch.position.x += dx / d * step; ch.position.z += dz / d * step; ch.rotation.y = Math.atan2(dx, dz); step = 0; }
    }
    if(seg >= path.length){ V13.play(ch, opt.end || 'idle'); if(opt.face != null) ch.rotation.y = opt.face; res(true); return false; }
  }));
}
const stopWalk = ch => { if(ch) ch.userData._m12w = (ch.userData._m12w || 0) + 1; };
/* Barrister Danladi walks with you: behind and to your left, so she and Uche don't stack up */
function tail(ch, side, back){
  const h = { on:true, held:false, hold(v){ this.held = !!v; } };
  let mode = null, stuck = 0;
  V13.every(dt => {
    if(!h.on || !ch.parent) return false;
    if(h.held){ if(mode){ mode = null; V13.play(ch, 'idle', { fade:0.25 }); } return; }
    const P = ENGINE.player; if(!P) return;
    const fx = Math.sin(P.rotation.y), fz = Math.cos(P.rotation.y);
    const tx = P.position.x - fx * back - fz * side, tz = P.position.z - fz * back + fx * side;
    const dP = Math.hypot(P.position.x - ch.position.x, P.position.z - ch.position.z);
    if(dP > 16){ ch.position.x = tx; ch.position.z = tz; return; }
    const dx = tx - ch.position.x, dz = tz - ch.position.z, d = Math.hypot(dx, dz);
    if(d > 0.55){
      const run = d > 5, step = Math.min(d, (run ? 3.6 : 1.7) * dt);
      let nx = ch.position.x + dx / d * step, nz = ch.position.z + dz / d * step;
      if(typeof blockedAt === 'function' && blockedAt(nx, nz, 0.22)){
        if(!blockedAt(nx, ch.position.z, 0.22)) nz = ch.position.z; else if(!blockedAt(ch.position.x, nz, 0.22)) nx = ch.position.x; else { stuck += dt; if(stuck < 1.2) return; nx = ch.position.x + dx / d * step; nz = ch.position.z + dz / d * step; }
      }
      stuck = 0; ch.position.x = nx; ch.position.z = nz; ch.rotation.y = Math.atan2(dx, dz);
      mode = run ? 'jog' : 'walk'; V13.play(ch, mode, { fade:0.2 });           // (re-asserted: a finished one-shot may have put her back to idle)
    } else {
      if(mode){ mode = null; V13.play(ch, 'idle', { fade:0.25 }); }
      const want = Math.atan2(P.position.x - ch.position.x, P.position.z - ch.position.z);
      let dr = want - ch.rotation.y; while(dr > PI) dr -= 2 * PI; while(dr < -PI) dr += 2 * PI;
      ch.rotation.y += dr * Math.min(1, dt * 3);
    }
  });
  return h;
}
/* fixed shots for the conversations that matter */
const SHOT = {
  street:{ pos:[1.2, 1.72, 25.3], look:[-0.7, 1.42, 28.8] },
  shred:{ pos:[-16.1, 1.95, 8.8], look:[-17.5, 0.9, 5.6] },
  end:{ pos:[-4.9, 2.1, -19.4], look:[0.9, 0.9, -33],
    // a landscape phone keeps only the top half above the dialogue box: pull back and look down, the three of them whole on the quay
    phone:{ pos:[-4.2, 2.4, -15.0], look:[0.5, -3.6, -33] } },
};
/* the camera only follows while the game is playing, so a shot is a cut: the camera goes there now */
const shotAt = s => {
  if(typeof TPCAM === 'undefined') return;
  const ph = window.innerHeight < 560, v = ph && s.phone ? s.phone : s;
  const p = new THREE.Vector3(...v.pos), l = new THREE.Vector3(...v.look);
  if(ph && !s.phone) l.y -= p.distanceTo(l) * 0.12;   // a landscape phone shows the scene above the dialogue box: tilt ~7° down so faces sit higher
  TPCAM.override = { pos:p, look:l };
  const c = ENGINE.camera; if(c){ c.position.copy(p); c.lookAt(l); }
  if(TPCAM.pos && TPCAM.look){ TPCAM.pos.copy(p); TPCAM.look.copy(l); TPCAM.cur = true; } else TPCAM.cur = null;
  fill(p);
};
const unshot = ()=>{ if(typeof TPCAM !== 'undefined') TPCAM.override = null; fill(null); };
/* can the camera at a see a face at b? (the baked scene: walls, the open door leaf, cabinets) */
const RAY = new THREE.Raycaster();
const head = (p, y)=>new THREE.Vector3(p.x, y, p.z);
function clearView(a, b){
  const dr = RT().dr, root = dr && dr.inst && dr.inst.root; if(!root) return true;
  const d = new THREE.Vector3().subVectors(b, a), L = d.length(); if(L < 0.6) return true;
  RAY.set(a, d.normalize()); RAY.near = 0.05; RAY.far = L - 0.35;
  return !RAY.intersectObject(root, true).some(h => h.object && h.object.isMesh && h.object.visible && !(h.object.material && h.object.material.visible === false));
}
/* seen from c, does A stand in front of B? */
function inLine(c, A, B){
  const ax = B.x - c.x, az = B.z - c.z, L2 = ax * ax + az * az || 1;
  const t = ((A.x - c.x) * ax + (A.z - c.z) * az) / L2;
  return t > 0.05 && t < 0.97 && Math.hypot(c.x + ax * t - A.x, c.z + az * t - A.z) < 0.6;
}
/* On a landscape phone the speaker's portrait sits top centre and the dialogue box covers the lower half, so a
   conversation is shot closer and square from the side: the two of them stand either side of the portrait.
   Returns false (and the wider shot is used) when there's no clear place for the camera. */
function phoneTwo(o, ok, inside){
  if(window.innerHeight >= 560 || !ENGINE.player) return false;
  const R = RT(), P = ENGINE.player.position, Q = o.position;
  const dx = Q.x - P.x, dz = Q.z - P.z, L = Math.hypot(dx, dz) || 1, mx = (P.x + Q.x) / 2, mz = (P.z + Q.z) / 2;
  const obs = (ENGINE.obstacles || []).filter(b => !b.crouchOnly);
  const people = [R.uche, R.hauwa, R.amina].filter(ch => ch && ch !== o && ch.parent).map(ch => ch.position);
  if(R.inO) for(const k of ['uche', 'hauwa', 'amina']) if(k !== 'amina' || R.amina) people.push({ x:OFFICE[k].p[0], z:OFFICE[k].p[1] });
  const hit = (x, z, r)=>obs.some(b => x > b.minX - r && x < b.maxX + r && z > b.minZ - r && z < b.maxZ + r);
  const sight = (x, z, t)=>{
    const lx = t.x - x, lz = t.z - z, n = Math.ceil(Math.hypot(lx, lz) / 0.2);
    for(let i = 1; i < n; i++){
      const px = x + lx * i / n, pz = z + lz * i / n;
      if(Math.hypot(t.x - px, t.z - pz) < 0.55) break;
      if(hit(px, pz, 0.02) || people.some(q => Math.hypot(q.x - px, q.z - pz) < 0.32)) return false;
    }
    return true;
  };
  for(const f of [1, 0.85, 1.2]){
    const D = Math.min(3.2, Math.max(1.5, L * 1.37 * f));      // ~20° either side of centre
    const c = [1, -1].map(side => ({ x:mx - dz / L * side * D, z:mz + dx / L * side * D }))
      .filter(c => !hit(c.x, c.z, 0.3) && (!inside || inside(c)) && !people.some(q => Math.hypot(q.x - c.x, q.z - c.z) < 0.5) && sight(c.x, c.z, P) && sight(c.x, c.z, Q)
        && clearView(head(c, 1.62), head(P, 1.5)) && clearView(head(c, 1.62), head(Q, 1.45)))
      .sort((a, b)=>ok ? ok(b) - ok(a) : 0)[0];
    if(c){ shotAt({ pos:[c.x, 1.62, c.z], look:[mx, 1.38, mz] }); return true; }
  }
  return false;
}
/* a two-shot of the player and someone, from the side of the line between them that ok(x, z) prefers */
function twoShot(o, ok){
  if(phoneTwo(o, ok)) return;
  const P = ENGINE.player.position, Q = o.position;
  const mx = (P.x + Q.x) / 2, mz = (P.z + Q.z) / 2, dx = Q.x - P.x, dz = Q.z - P.z, L = Math.hypot(dx, dz) || 1;
  const cand = [1, -1].map(side => ({ x:mx - dz / L * side * 2.7 - dx / L * 0.7, z:mz + dx / L * side * 2.7 - dz / L * 0.7 }));
  const c = cand.sort((a, b)=>ok(b) - ok(a))[0];
  shotAt({ pos:[c.x, 1.72, c.z], look:[mx + dx / L * 0.35, 1.32, mz + dz / L * 0.35] });
}
/* the manager's room: a corner with a clear line to the person you're talking to, looking between the two of you.
   If no corner sees both faces (the open door leaf, or one of them in front of the other), a place square to the two. */
const ROOM = [[-15.45, 6.05], [-19.2, 5.5], [-15.55, 11.25], [-19.4, 8.05]];
function roomShot(npc){
  if(phoneTwo(npc, null, inManager)) return;
  const P = ENGINE.player.position, Q = npc.position;
  const dx = Q.x - P.x, dz = Q.z - P.z, L = Math.hypot(dx, dz) || 1, mx = (P.x + Q.x) / 2, mz = (P.z + Q.z) / 2;
  const cands = ROOM.map(c => ({ x:c[0], z:c[1], pen:0 }));
  for(const D of [2.4, 1.9]) for(const s of [1, -1]){
    const x = mx - dz / L * s * D, z = mz + dx / L * s * D;
    if(inManager({ x, z }) && !(typeof blockedAt === 'function' && blockedAt(x, z, 0.3))) cands.push({ x, z, pen:2 });
  }
  let best = cands[0], bs = -1e9;
  for(const c of cands){
    const ax = Q.x - c.x, az = Q.z - c.z, L2 = ax * ax + az * az || 1, dist = Math.sqrt(L2);
    const t = ((P.x - c.x) * ax + (P.z - c.z) * az) / L2;
    const off = Math.hypot(c.x + ax * t - P.x, c.z + az * t - P.z);
    const blocked = t > 0.05 && t < 1.05 && off < 0.65;
    const eye = head(c, 1.75);
    const score = (blocked ? -100 : 0) + (inLine(c, Q, P) ? -60 : 0) + (clearView(eye, head(Q, 1.45)) ? 0 : -60) + (clearView(eye, head(P, 1.5)) ? 0 : -40)
      - c.pen - Math.abs(dist - 3.4) + Math.min(off, 2) * 0.5;
    if(score > bs){ bs = score; best = c; }
  }
  shotAt({ pos:[best.x, 1.75, best.z], look:[mx, 1.35, mz] });
}
/* the gate: from the street, on the far side of the guard from where Kelechi stands */
function gateShot(guard){
  const P = ENGINE.player.position, Q = guard.position, s = P.x <= Q.x + 0.3 ? 1 : -1;
  shotAt({ pos:[Q.x + 2.6 * s, 1.85, Q.z + 3.3], look:[Q.x + 1.4 * s, 1.35, Q.z] });
}
/* a soft light from the camera's side for the faces in a shot (the people are lit live; the scene is baked) */
function fill(p){
  const R = RT(); if(!ENGINE.scene) return;
  if(!R.fillL){ R.fillL = new THREE.PointLight('#ffe8cf', 0, 12, 2); R.fillL.userData._m12own = true; ENGINE.scene.add(R.fillL); }
  if(!p){ R.fillL.intensity = 0; return; }
  R.fillL.position.set(p.x, p.y + 0.5, p.z); R.fillL.intensity = 2.2 + 1.4 * ((R.dusk && R.dusk.t) || 0);
}
function ring(who, then){
  if(typeof sfxAlert === 'function') sfxAlert();
  if(typeof haptic === 'function') haptic([60, 40, 60]);
  V13.toast('PHONE', who + ' is calling.', 1700);
  setTimeout(then, 1500);
}
/* the office and the lab: roofs low enough that the camera has to stay under them */
const inOffice = p => p.x < -12.2 && p.x > -19.9 && p.z > 4.15 && p.z < 11.85;
const inManager = p => inOffice(p) && p.x < -15.1;
const inLab = p => p.x < -13.95 && p.x > -18.05 && p.z < -3.95 && p.z > -8.05;

/* ---------- dusk to night: the light follows the clock ---------- */
const NIGHT = { bg:new THREE.Color('#090b16'), fog:new THREE.Color('#171a28'), sky:new THREE.Color('#33446a'), key:new THREE.Color('#9db0d8'), pano:new THREE.Color('#1d1f36') };
function duskInit(){
  const R = RT(), sc = ENGINE.scene, L = [];
  sc.traverse(o => { if(o.isLight && !o.userData._m12own) L.push({ o, i:o.intensity, c:o.color ? o.color.clone() : null }); });
  const pano = [];
  const P = R.dr && R.dr.D && R.dr.D.Pano;
  if(P) P.traverse(m => { if(m.isMesh && m.material && m.material.color){ m.material = m.material.clone(); pano.push({ m:m.material, c:m.material.color.clone() }); } });
  R.dusk = { t:0, want:0, L, pano, exp:ENGINE.renderer ? ENGINE.renderer.toneMappingExposure : 1.12,
    bg:(sc.background && sc.background.isColor) ? sc.background.clone() : null, fog:sc.fog ? { c:sc.fog.color.clone(), n:sc.fog.near, f:sc.fog.far } : null };
  V13.every(dt => {
    const D = R.dusk; if(!D) return false;
    const d = D.want - D.t; if(Math.abs(d) < 0.0005) return;
    D.t += Math.sign(d) * Math.min(Math.abs(d), dt * 0.035); duskApply(D.t);
  });
}
function duskApply(t){
  const R = RT(), D = R.dusk; if(!D) return;
  const sc = ENGINE.scene;
  for(const e of D.L){
    const o = e.o;
    if(o.isHemisphereLight){ o.intensity = e.i * (1 - 0.5 * t); if(e.c) o.color.copy(e.c).lerp(NIGHT.sky, t); }
    else if(o.isDirectionalLight){ o.intensity = e.i * (1 - 0.68 * t); if(e.c) o.color.copy(e.c).lerp(NIGHT.key, t); }
    else if(o.isPointLight){ o.intensity = e.i * (1 + 1.1 * t); }
  }
  if(ENGINE.renderer) ENGINE.renderer.toneMappingExposure = D.exp * (1 - 0.36 * t);
  if(D.bg && sc.background && sc.background.isColor) sc.background.copy(D.bg).lerp(NIGHT.bg, t);
  if(D.fog && sc.fog){ sc.fog.color.copy(D.fog.c).lerp(NIGHT.fog, t); sc.fog.near = D.fog.n - 14 * t; sc.fog.far = D.fog.f - 30 * t; }
  for(const p of D.pano) p.m.color.copy(p.c).lerp(NIGHT.pano, t);
  for(const l of R.lamps || []) l.o.intensity = l.base + l.night * t;
}
const dusk = (t, now)=>{ const D = RT().dusk; if(!D) return; D.want = Math.max(D.want, Math.min(1, t)); if(now){ D.t = D.want; duskApply(D.t); } };
/* the clock in the HUD: minutes after 17:40 */
function clock(add, now){
  const R = RT(); R.min = (R.min || 0) + (add || 0);
  const m = 17 * 60 + 40 + R.min, hh = Math.floor(m / 60) % 24, mm = m % 60;
  R.time = String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
  S.game.currentSubregion = 'Riverstone Tank Farm · ' + R.time;
  if(typeof refreshHUD === 'function') refreshHUD();
  dusk(R.min / 120, now);
  return R.time;
}
function lamp(x, y, z, col, base, night, dist){
  const l = new THREE.PointLight(col, base, dist || 7, 2); l.position.set(x, y, z); l.userData._m12own = true; ENGINE.scene.add(l);
  (RT().lamps = RT().lamps || []).push({ o:l, base, night }); return l;
}

/* ---------- bole smoke from the stall across the road ---------- */
function smoke(x, y, z){
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const rg = g.createRadialGradient(32, 32, 2, 32, 32, 31); rg.addColorStop(0, 'rgba(255,255,255,.85)'); rg.addColorStop(0.5, 'rgba(255,255,255,.3)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = rg; g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c), parts = [];
  for(let i = 0; i < 7; i++){
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map:tex, color:new THREE.Color('#9a9288'), transparent:true, depthWrite:false, opacity:0 }));
    s.renderOrder = 3; ENGINE.scene.add(s); parts.push({ s, t:i / 7 * 4.2, ox:(Math.random() - 0.5) * 0.2 });
  }
  V13.every(dt => { for(const p of parts){ p.t = (p.t + dt) % 4.2; const k = p.t / 4.2; p.s.position.set(x + p.ox + k * 0.5, y + k * 2.2, z - k * 0.3); const sz = 0.5 + k * 1.3; p.s.scale.set(sz, sz, 1); p.s.material.opacity = 0.3 * Math.sin(PI * Math.min(1, k * 1.15)); } });
}

/* =========================================================================
   PAGE 114 — the shredded page: tap two strips to swap them
   ========================================================================= */
const PAGE = { W:1000, H:620,
  cols:[96, 208, 304, 444, 506, 654, 918],
  heads:['DATE', 'TIME', 'TRUCK', 'TANK', 'LITRES', 'CONSIGNEE', 'GUARD'],
  rows:[
    ['26 NOV', '21:10', 'RIV-07', 'T1', '33,000', 'ADAUGO F/S, ABA', 'E.B.'],
    ['27 NOV', '05:40', 'RIV-11', 'T3', '33,000', '"various"', 'E.B.'],
    ['27 NOV', '05:55', 'RIV-02', 'T3', '33,000', '"various"', 'E.B.'],
    ['27 NOV', '06:10', 'RIV-14', 'T3', '33,000', '"various"', 'E.B.'],
    ['27 NOV', '06:25', 'RIV-09', 'T3', '33,000', '"various"', 'E.B.'],
    ['27 NOV', '06:40', 'RIV-05', 'T3', '33,000', '"various"', 'E.B.'],
    ['28 NOV', '14:05', 'RIV-07', 'T1', '33,000', 'BRIGHTWAY, ONITSHA', 'E.B.'],
    ['04 DEC', '05:30', 'RIV-11+4', 'T3', '5 × 33,000', '"various"', 'E.B.'],
  ],
  top:156, dy:46, hl:[1, 2, 3, 4, 5, 7] };
function rng(seed){ let s = seed >>> 0; return ()=>{ s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function paintPage(cv){
  const x = cv.getContext('2d'), k = cv.width / PAGE.W, W = PAGE.W, H = PAGE.H;
  x.setTransform(k, 0, 0, k, 0, 0);
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#f2e9d3'); g.addColorStop(1, '#e6d9ba');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  const r = rng(114);
  for(let i = 0; i < 1500; i++){ x.fillStyle = `rgba(110,86,50,${(0.025 + r() * 0.05).toFixed(3)})`; x.fillRect(r() * W, r() * H, 1 + r() * 2.4, 1 + r() * 2.4); }
  // the printed book: letterhead, columns, rules, the red margin, punched holes
  x.fillStyle = '#2a3550'; x.font = '700 34px Oswald, "Arial Narrow", Arial, sans-serif'; x.textBaseline = 'alphabetic'; x.textAlign = 'left';
  x.fillText('RIVERSTONE MARINE SERVICES LTD', 96, 54);
  x.fillStyle = '#4a5878'; x.font = '600 21px Oswald, "Arial Narrow", Arial, sans-serif';
  x.fillText('GATE REGISTER  ·  TANKERS OUT  ·  NOV / DEC', 96, 88);
  x.strokeStyle = '#2a3550'; x.lineWidth = 3; x.beginPath(); x.arc(908, 58, 34, 0, 2 * PI); x.stroke();
  x.fillStyle = '#2a3550'; x.font = '700 26px Oswald, "Arial Narrow", Arial, sans-serif'; x.textAlign = 'center'; x.fillText('114', 908, 68); x.textAlign = 'left';
  x.fillStyle = '#56648a'; x.font = '600 16px Oswald, "Arial Narrow", Arial, sans-serif';
  PAGE.heads.forEach((h, i)=>x.fillText(h, PAGE.cols[i] + 2, 140));
  x.strokeStyle = 'rgba(52,92,160,.55)'; x.lineWidth = 2;
  x.beginPath(); x.moveTo(0, PAGE.top - 4); x.lineTo(W, PAGE.top - 4); x.moveTo(0, PAGE.top); x.lineTo(W, PAGE.top); x.stroke();
  x.strokeStyle = 'rgba(64,104,168,.36)'; x.lineWidth = 1.6;
  for(let i = 1; i <= 9; i++){ const y = PAGE.top + i * PAGE.dy; x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); }
  x.strokeStyle = 'rgba(64,104,168,.24)';
  for(const cx of [198, 296, 436, 498, 646, 908]){ x.beginPath(); x.moveTo(cx, 118); x.lineTo(cx, PAGE.top + 9 * PAGE.dy); x.stroke(); }
  x.strokeStyle = 'rgba(196,52,52,.55)'; x.lineWidth = 2.2; x.beginPath(); x.moveTo(78, 0); x.lineTo(78, H); x.stroke();
  x.fillStyle = '#070b14'; for(const hy of [150, 470]){ x.beginPath(); x.arc(38, hy, 13, 0, 2 * PI); x.fill(); }
  // the gateman's hand, in blue biro
  x.font = '500 23px "JetBrains Mono", "Courier New", monospace';
  PAGE.rows.forEach((row, i)=>{
    const y = PAGE.top + (i + 1) * PAGE.dy - 13 + (r() - 0.5) * 2.4;
    x.save(); x.translate(0, y); x.rotate((r() - 0.5) * 0.008);
    x.fillStyle = i === 0 || i === 6 ? '#22357f' : '#1b2f86';
    row.forEach((t, c)=>x.fillText(t, PAGE.cols[c] + 4 + (r() - 0.5) * 3, 0));
    x.restore();
  });
  x.fillStyle = 'rgba(70,70,70,.7)'; x.font = 'italic 500 19px "JetBrains Mono", "Courier New", monospace';
  x.fillText('checked — E.B. (gate)', 640, PAGE.top + 9 * PAGE.dy + 30);
  // the security stamp, and somebody's tea
  x.save(); x.translate(586, 330); x.rotate(-0.22);
  x.strokeStyle = 'rgba(104,46,150,.55)'; x.fillStyle = 'rgba(104,46,150,.55)'; x.lineWidth = 4;
  x.beginPath(); x.arc(0, 0, 74, 0, 2 * PI); x.stroke(); x.lineWidth = 2; x.beginPath(); x.arc(0, 0, 60, 0, 2 * PI); x.stroke();
  x.textAlign = 'center'; x.font = '700 30px Oswald, "Arial Narrow", Arial, sans-serif'; x.fillText('GATE', 0, -4);
  x.font = '600 17px Oswald, "Arial Narrow", Arial, sans-serif'; x.fillText('SECURITY', 0, 22); x.font = '600 13px Oswald, "Arial Narrow", Arial, sans-serif'; x.fillText('RIVERSTONE', 0, -34);
  x.restore();
  x.strokeStyle = 'rgba(124,74,34,.24)'; x.lineWidth = 9; x.beginPath(); x.arc(842, 468, 48, 0.3, 2 * PI - 0.5); x.stroke();
  x.lineWidth = 4; x.beginPath(); x.arc(846, 472, 41, 2.2, 5.1); x.stroke();
  // shredded paper has torn top and bottom edges
  x.fillStyle = 'rgba(0,0,0,.1)'; x.fillRect(0, 0, W, 3); x.fillRect(0, H - 3, W, 3);
}
const cycles = order => { const seen = new Array(order.length).fill(false); let c = 0; for(let i = 0; i < order.length; i++){ if(seen[i]) continue; c++; for(let j = i; !seen[j]; j = order[j]) seen[j] = true; } return c; };
function stripsGame(api, P){
  const n = P.n || 7, gap = 3;
  const frame = document.getElementById('mg-frame'), sub = document.getElementById('mg-sub');
  if(frame) frame.classList.add('m12s');
  const short = ()=>window.innerHeight < 560;
  const box = mgEl('div', 'm12s-box'); api.stage.appendChild(box);
  const wrap = mgEl('div', 'm12s-wrap'); box.appendChild(wrap);
  const cnt = mgEl('div', 'mg-sort-count m12s-count'); api.stage.appendChild(cnt);
  let order, sel = -1, cur = -1, swaps = 0, running = false, solved = false, dead = false, phase = 'intro';
  do { order = mgShuffle([...Array(n).keys()]); } while(order.filter((p, i)=>p === i).length > 1);
  const best = n - cycles(order);
  const strips = [];
  for(let p = 0; p < n; p++){
    const c = document.createElement('canvas'); c.className = 'm12s-strip'; c.dataset.piece = p;
    c.addEventListener('pointerdown', e => { e.preventDefault(); tap(order.indexOf(p)); });
    wrap.appendChild(c); strips.push(c);
  }
  const bands = PAGE.hl.map(k => { const d = mgEl('div', 'm12s-hl'); wrap.appendChild(d); return { d, k }; });
  let W = 0, H = 0, sw = 0;
  const page = document.createElement('canvas');
  const place = ()=>{
    const g = solved ? 0 : gap;
    wrap.style.width = (W + g * (n - 1)) + 'px';
    order.forEach((p, s)=>{ const c = strips[p]; c.style.left = (s * (sw + g)) + 'px'; c.classList.toggle('sel', s === sel); c.classList.toggle('cur', s === cur && !solved); });
  };
  const layout = ()=>{
    wrap.classList.add('m12s-nt');
    requestAnimationFrame(()=>requestAnimationFrame(()=>wrap.classList.remove('m12s-nt')));
    let h = short() ? window.innerHeight - (phase === 'play' ? 150 : phase === 'result' ? 240 : 226) : (phase === 'result' ? 220 : 252);
    h = Math.max(96, Math.min(300, h));
    const maxW = Math.max(200, Math.min(api.width(), 470)) - gap * (n - 1);
    const w = Math.min(maxW, Math.round(h * PAGE.W / PAGE.H));
    sw = Math.max(14, Math.floor(w / n)); W = sw * n; H = Math.round(W * PAGE.H / PAGE.W);
    const dpr = Math.min(2, window.devicePixelRatio || 1), spx = Math.max(8, Math.round(sw * dpr));
    page.width = spx * n; page.height = Math.round(H * dpr); paintPage(page);
    strips.forEach((c, p)=>{
      c.width = spx; c.height = page.height; c.style.width = sw + 'px'; c.style.height = H + 'px';
      c.getContext('2d').drawImage(page, p * spx, 0, spx, page.height, 0, 0, spx, page.height);
    });
    wrap.style.height = H + 'px';
    bands.forEach(b => { b.d.style.left = '0px'; b.d.style.top = (H * (PAGE.top + PAGE.dy * b.k) / PAGE.H) + 'px'; b.d.style.height = (H * PAGE.dy / PAGE.H) + 'px'; b.d.style.width = W + 'px'; });
    place();
  };
  const counter = ()=>{ cnt.textContent = solved ? 'PAGE 114 · TAPED BACK TOGETHER' : phase === 'intro' ? `${n} STRIPS · ONE PAGE` : `SWAPS ${swaps}`; };
  const win = ()=>{
    solved = true; running = false; wrap.classList.add('solved'); place(); counter();
    api.msg('IT READS.', 'good');
    if(P.onSolved) try{ P.onSolved(); }catch(e){}
    const extra = swaps - best;
    setTimeout(()=>{ if(dead) return; phase = 'result'; if(short()){ cnt.style.display = 'none'; layout(); } api.success({ stars:extra <= 1 ? 3 : extra <= 5 ? 2 : 1 }); }, 1300);
  };
  const tap = s => {
    if(!running || solved || s < 0) return;
    if(sel < 0){ sel = s; mgSfx('tick'); place(); return; }
    if(sel === s){ sel = -1; place(); return; }
    const t = order[sel]; order[sel] = order[s]; order[s] = t; sel = -1; swaps++;
    mgSfx('good'); mgHaptic(15); place(); counter();
    if(order.every((p, i)=>p === i)) win();
  };
  const onResize = ()=>{ if(!dead) layout(); };
  window.addEventListener('resize', onResize);
  layout(); counter();
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(()=>{ if(!dead) layout(); });
  return {
    start(){ running = true; phase = 'play'; if(short() && sub) sub.style.display = 'none'; layout(); counter(); },
    update(){},
    key(k, down){
      if(!down || !running) return;
      if(k === 'left' || k === 'right'){ cur = cur < 0 ? 0 : (cur + (k === 'left' ? n - 1 : 1)) % n; place(); return; }
      if(k === 'act'){ if(cur < 0){ cur = 0; place(); return; } tap(cur); return; }
      const m = /^n(\d)$/.exec(k); if(m){ const i = +m[1] - 1; if(i < n){ cur = i; tap(i); } }
    },
    destroy(){ dead = true; window.removeEventListener('resize', onResize); if(frame) frame.classList.remove('m12s'); if(sub) sub.style.display = ''; },
    // test hook: the order as the player sees it, left to right
    _order:()=>order.slice(),
  };
}
if(typeof MG_TYPES !== 'undefined') MG_TYPES.m12_strips = stripsGame;
(function css(){
  if(document.getElementById('v13-case12-css')) return;
  const st = document.createElement('style'); st.id = 'v13-case12-css';
  st.textContent = `
#mg-frame.m12s .mg-timer{display:none}
#mg-frame.m12s .mg-stage{min-height:0}
.m12s-box{width:100%;display:flex;justify-content:center;padding:8px 0 2px}
.m12s-wrap{position:relative;flex:0 0 auto;transition:width .24s ease}
.m12s-strip{position:absolute;top:0;display:block;cursor:pointer;transition:left .24s ease,transform .16s ease;-webkit-tap-highlight-color:transparent;touch-action:none}
.m12s-strip.cur{outline:2px dashed var(--ink,#1C1C1A);outline-offset:-2px}
.m12s-strip.sel{transform:translateY(-7px);outline:2px solid var(--ink,#1C1C1A);outline-offset:-2px;z-index:3}
.m12s-wrap.solved{outline:2px solid var(--green,#0B6E4F);outline-offset:2px;box-shadow:none}
.m12s-wrap.solved .m12s-strip{cursor:default}
.m12s-hl{position:absolute;background:rgba(11,110,79,.18);border-top:1px solid var(--ink,#1C1C1A);border-bottom:1px solid var(--ink,#1C1C1A);opacity:0;transition:opacity .6s ease .35s;pointer-events:none;z-index:4}
.m12s-wrap.solved .m12s-hl{opacity:1}
.m12s-wrap.m12s-nt,.m12s-wrap.m12s-nt .m12s-strip{transition:none!important}
body.reduce-motion .m12s-wrap,body.reduce-motion .m12s-strip,body.reduce-motion .m12s-hl{transition:none!important}
.m12s-count{text-align:center;margin-top:8px}
@media (max-height:560px){
  #screen-minigame.overlay:has(#mg-frame.m12s){padding:calc(8px + env(safe-area-inset-top,0px)) calc(8px + env(safe-area-inset-right,0px)) calc(8px + env(safe-area-inset-bottom,0px)) calc(8px + env(safe-area-inset-left,0px))}
  #mg-frame.m12s{padding:10px 14px}
  #mg-frame.m12s .mg-kicker{display:none}
  #mg-frame.m12s .mg-title{font-size:15px;margin-top:0}
  #mg-frame.m12s .mg-sub{font-size:11.5px;line-height:1.4;margin-bottom:2px}
  #mg-frame.m12s .mg-msg{margin-top:4px;min-height:18px}
  #mg-frame.m12s .mg-actions{margin-top:6px;flex-wrap:nowrap}
  #mg-frame.m12s .mg-actions .btn{padding:10px 12px;font-size:11px;flex:1 1 0}
  #mg-frame.m12s .mg-actions .btn.big{flex:2 1 0;padding:11px 12px;font-size:13px}
  #mg-frame.m12s .m12s-box{padding-top:4px}
  #mg-frame.m12s .m12s-count{margin-top:4px}
  #mg-frame.m12s .mg-result{gap:2px;padding:0}
  #mg-frame.m12s .mg-stars{font-size:19px}
  #mg-frame.m12s .mg-verdict{font-size:16px}
  #mg-frame.m12s .mg-note{font-size:11.5px;line-height:1.35}
}`;
  document.head.appendChild(st);
})();

/* =========================================================================
   THE CASE
   ========================================================================= */
/* Wayfinding (RT04, Senior Agent): every interactable in this case is required (none is an optional decoy), so the
   beta's last-resort pointer only ever names the next required spot. No WAY.OBJ_TARGETS rows are needed here. */
V13.defCase('m12', {
  title:'Paper Oil', region:'Rivers', sub:'Riverstone Tank Farm · 17:40', evMax:5, xp:380, ambient:'checkpoint',
  objectives:()=>[
    { id:'o12_gate', text:'Get through Riverstone\'s gate' },
    { id:'o12_office', text:'Search the manager\'s office' },
    { id:'o12_log', text:'Find the real loading log' },
    { id:'o12_seize', text:'Seize the papers' },
    { id:'o12_tank', text:'Sample Tank 3 and test it' },
    { id:'o12_union', text:'Talk to the boat drivers\' union by the jetty' },
    { id:'o12_owner', text:'Find out who owns Riverstone' },
  ],
  reset(){
    const m = MC(), f = S.game.flags || {};
    for(const k of FLAGS){ delete m[k]; delete f[k]; }
    // a replay is judged on the replay: this case's exhibits and document attempts start clean
    S.game.evidence = (S.game.evidence || []).filter(e => !e || !EVIDS.includes(e.id));
    if(S.game.evQ) for(const id of EVIDS) delete S.game.evQ[id];
    for(const store of ['_docMiss', '_docFree', '_docLocked']) if(S.game[store]) for(const k of DOCKEYS) delete S.game[store][k];
  },
  build(){
    // Sotonye's car is the red Kia the dialogue names
    const meta = V13.A(K);
    if(meta.SotonyeCar) meta.SotonyeCar.color = '#8a2a22';
    V13.scene(K, { start:'start' });
    const R = RT();
    R.failed = {}; R.docDone = {}; R.min = 0;
    if(typeof addObstacle === 'function') addObstacle(-9.4, 10.8, 4.5, 1.9);               // the Kia
    ENGINE.ceilingY = 3.0; ENGINE.inside = p => inOffice(p) || inLab(p);
    // the gate: security and two guards inside, Barrister Danladi and Uche on the pavement
    R.uche = V13.person({}, A('uche_start'), { kind:'uche', solid:false });
    // Barrister Danladi in her black suit, a navy head-tie like her case-file photo
    R.hauwa = V13.person(V13.look('hauwa', { gear:['Gear_F_Gele'], gele:'#27314e', skirt:'#161616', hips:'#161616', thigh:'#161616' }), A('hauwa'), { id:'hauwa', solid:false });
    R.guard = V13.person('security', A('security'), { id:'security', solid:false });
    const olive = '#33421f';
    R.guards = V13.list(K, 'guards').map((g, i)=>V13.person(V13.look('security', i ? { torso:olive, armA:olive, armB:olive, armC:olive } : {}), { x:g[0], z:g[1], rot:g[2] }, { clip:i ? 'folded' : 'idle' }));
    // loaders at the gantry, boat drivers at the union shed, the chairman at her table, the manager in her office
    const blue = '#2c4f86', navy = '#22406e';
    R.loaders = V13.list(K, 'loaders').map((l, i)=>V13.person(Object.assign(V13.crowdLook(6 + i), { torso:blue, armA:blue, armB:blue, armC:blue, hips:navy, thigh:navy, shin:navy, gear:['Gear_Fila'], cap:'#e2b11c' }),
      { x:l[0], z:l[1], rot:l[2] }, { clip:['fix', 'folded', 'interact'][i % 3] }));
    R.boatmen = V13.list(K, 'boatmen').map((b, i)=>V13.person(V13.crowdLook(4 + i), { x:b[0], z:b[1], rot:b[2] }, { clip:['talk', 'folded', 'idle', 'phone'][i % 4] }));
    const ib = A('ibinabo'), red = '#b8321e';
    R.ibinabo = V13.person(V13.look('ibinabo', { gear:['Gear_F_Gele', 'Gear_F_Wrapper'], gele:'#c83a2a', wrapper:'#a8281c', skirt:red, hips:red, thigh:red }), { x:ib.x, z:ib.z, rot:-PI / 2 }, { id:'ibinabo', clip:'interact' });
    R.sotonye = V13.person(V13.look('sotonye', { skirt:'#2c3140', hips:'#2c3140', thigh:'#2c3140' }), A('sotonye'), { id:'sotonye', clip:'folded' });
    // the bole seller across the road, and her smoke
    R.seller = V13.person(V13.crowdLook(1), { x:4.5, z:34.3, rot:PI }, { clip:'idle', solid:false });
    smoke(3.7, 1.0, 33.9);
    // light that grows as the evening does: the office, the lab, the union shed's bulb
    lamp(-17, 2.7, 8, '#ffe2b8', 0.25, 0.9, 7); lamp(-16, 2.4, -6, '#f4f0ff', 0.2, 0.7, 6); lamp(-20, 2.6, -20.8, '#ffd08a', 0.15, 0.9, 8);
    duskInit(); clock(0, true); fill(null);
    // the guards and the boat drivers keep an eye on strangers
    R.watch = [R.guard, ...R.guards, ...R.boatmen];
    V13.every(dt => {
      const P = ENGINE.player; if(!P) return;
      for(const w of R.watch){
        if(!w || w.userData._m12busy) continue;
        const d = Math.hypot(P.position.x - w.position.x, P.position.z - w.position.z); if(d > 9) continue;
        const want = Math.atan2(P.position.x - w.position.x, P.position.z - w.position.z);
        let dr = want - w.rotation.y; while(dr > PI) dr -= 2 * PI; while(dr < -PI) dr += 2 * PI;
        w.rotation.y += dr * Math.min(1, dt * 1.6);
      }
    });
  },
  start(){
    const R = RT();
    V13.after(0.5, ()=>{
      const P = ENGINE.player.position;
      faceTo(R.hauwa, P.x, P.z); faceTo(R.uche, P.x, P.z);
      shotAt(SHOT.street); V13.play(R.hauwa, 'talk');
      V13.say('m12_hauwa', ()=>{ unshot(); V13.play(R.hauwa, 'idle'); afterHauwa(); });
    });
  },
});

/* ---------- outside the gate ---------- */
const GATE_SPOT = [-0.9, 22.95];
function guardToGate(){
  // he lifts the barrier and comes to the gate to see what NACECA wants
  const R = RT(); R.guard.userData._m12busy = true;
  if(V13.world) V13.world.open('boom', 1);
  walkTo(R.guard, [[-2.0, 21.4], GATE_SPOT], { face:0, speed:1.4 }).then(()=>{ R.guard.userData._m12busy = false; });
}
function afterHauwa(){
  const R = RT();
  guardToGate();
  if(wentIn()){
    objText('o12_gate', 'Have security open the gate');
    R.itGuard = addIt(V13.talk(R.guard, 'Order the gate open', gateTalk, { range:3.4 }), 0);
    return;
  }
  // the warrant: Barrister Danladi goes to the duty magistrate; the evening goes on without them
  objText('o12_gate', 'Wait for the warrant');
  walkTo(R.hauwa, [[3.5, 29.7], [10.5, 30.3]], { speed:1.7 });
  V13.after(1.4, ()=>{
    V13.skip(['18:30', 'FIFTY MINUTES LATER'], warrantBack, 2600);
    setTimeout(()=>{
      // behind the card: the sun has gone, the office lights came on at minute twelve, Barrister Danladi is back with Corporal Amina
      stopWalk(R.hauwa); R.hauwa.position.set(-1.25, 0, 28.15); V13.play(R.hauwa, 'idle');
      R.amina = V13.person('amina', { x:-2.3, z:28.75, rot:PI / 2 }, { id:'amina', solid:false });
      faceTo(R.hauwa, ENGINE.player.position.x, ENGINE.player.position.z);
      clock(50, true);
    }, 450);
  });
}
function warrantBack(){
  const R = RT(), P = ENGINE.player.position;
  faceTo(R.hauwa, P.x, P.z); faceTo(R.amina, P.x, P.z);
  shotAt(SHOT.street); V13.play(R.hauwa, 'talk');
  V13.say('m12_warrant_back', ()=>{
    unshot(); V13.play(R.hauwa, 'idle');
    objText('o12_gate', 'Show the warrant at the gate');
    R.itGuard = addIt(V13.talk(R.guard, 'Show the warrant', gateTalk, { range:3.4 }), 0);
  });
}
function gateTalk(it){
  const R = RT();
  // he's at the gate by now (the talk only reaches him there); make sure of it before the shot
  stopWalk(R.guard); R.guard.position.set(GATE_SPOT[0], 0, GATE_SPOT[1]); R.guard.userData._m12busy = false;
  meet(R.guard); gateShot(R.guard);
  V13.say(wentIn() ? 'm12_gate_nowarrant' : 'm12_gate_warrant', ()=>{ unshot(); V13.drop(it); openGate(); });
}
function openGate(){
  const R = RT();
  // (make sure the gate leaf's transform updates when world.js slides it)
  const D = R.dr && R.dr.D; if(D && D.Gate) D.Gate.traverse(o => { o.matrixAutoUpdate = true; });
  if(V13.world){ V13.world.open('gate', 1); V13.world.open('boom', 1); }
  // the leaf slides west behind the gatehouse
  ENGINE.obstacles = (ENGINE.obstacles || []).filter(o => !(Math.abs((o.minX + o.maxX) / 2 - 0.1) < 0.05 && Math.abs((o.minZ + o.maxZ) / 2 - 23.55) < 0.05));
  if(typeof addObstacle === 'function') addObstacle(-5.1, 23.55, 7.4, 0.3);
  V13.done('o12_gate'); clock(3);
  // security stands aside and makes a call (to the manager, or — without a warrant — to the owner)
  R.guard.userData._m12busy = true;
  walkTo(R.guard, [[-1.6, 22.2], [-2.6, 21.3], [-5.0, 20.4]], { face:0.5, speed:1.3, end:'phone' }).then(()=>{
    R.guard.userData._m12busy = false;
    if(!wentIn()) V13.after(5, ()=>V13.play(R.guard, 'idle'));       // Madam Sotonye has been told; the owner, without a warrant, is still on the line
  });
  if(wentIn()) V13.once(R.hauwa, 'interact');
  // Uche follows; Barrister Danladi walks two steps behind; Corporal Amina goes straight to the manager
  R.follow = { uche:{ ch:R.uche, h:V13.follow(R.uche, { dist:2.0 }) }, hauwa:{ ch:R.hauwa, h:tail(R.hauwa, -1.0, 2.3) } };
  if(R.amina) V13.after(1.6, ()=>walkTo(R.amina, [[0.6, 26.0], [0.6, 21.6], [-6.0, 15.8], [-10.8, 8.0], ...OFFICE.door.slice(1), OFFICE.amina.p], { speed:1.8, face:OFFICE.amina.f, end:'folded' }));
  yard();
  if(wentIn()){ ownerStart(); V13.after(2.0, ()=>V13.radio('SGT. UCHE', rec() ? X.m12_x_phone : X.m12_x_phone_sr, 4200)); }
}

/* ---------- inside the fence: the office, Tank 3, the union shed, all at once ---------- */
const OFFICE = {
  door:[[-11.0, 8.0], [-13.6, 8.0], [-15.6, 8.0]],
  uche:{ p:[-16.2, 5.3], f:-0.3 }, hauwa:{ p:[-15.7, 9.3], f:-1.65 }, amina:{ p:[-18.1, 8.6], f:0.88 },
};
const LAB = { hauwa:{ p:[-14.5, -4.7], f:-2.7 }, uche:{ p:[-14.1, -2.8], f:0.2 } };
const SPOT = {
  shred:{ x:-18.6, y:0.8, z:6.5 }, cabinets:{ x:-18.9, y:1.0, z:10.3 }, car:{ x:-10.2, y:0.9, z:10.1 },
  valve:{ x:2.4, y:0.7, z:-7.0 }, lab:{ x:-15.2, y:1.0, z:-6.2 },
};
function yard(){
  const R = RT();
  R.yard = true; R.step = 'search'; R.inO = false; R.inL = false;
  if(!wentIn()) R.itShred = addIt(V13.spot(SPOT.shred, 'Check the shredder', shred, { verb:'inspect', range:2.0 }), 9);
  R.itSoto = addIt(V13.talk(R.sotonye, 'Search Sotonye\'s handbag', sotonyeTalk, { range:2.4 }), 10);
  R.itValve = addIt(V13.spot(SPOT.valve, 'Draw a sample from Tank 3', valve, { verb:'collect', range:2.3 }), 20);
  R.itIbi = addIt(V13.talk(R.ibinabo, 'Talk to the union chairman', ibinabo, { range:2.6 }), 30);
  // where the people go when you walk into the small rooms
  V13.every(()=>{
    if(R.ending) return false;
    const P = ENGINE.player && ENGINE.player.position; if(!P) return;
    const o = inOffice(P), l = inLab(P);
    if(o !== R.inO){ R.inO = o; o ? parkOffice() : unpark(OFFICE.door.slice().reverse(), inOffice); }
    if(l !== R.inL){ R.inL = l; l ? parkLab() : unpark([[-15.2, -4.4], [-15.2, -2.6]], inLab); }
    if(inManager(P) && !R.enteredMgr){
      R.enteredMgr = true;
      if(wentIn()) V13.radio('SGT. UCHE', X.m12_x_cold, 2800);
      else if(!R.page && !R.shredSeen) V13.after(0.3, ()=>{ if(!R.shredSeen) shred(); });
    }
  });
}
function parkOffice(){
  const R = RT(), F = R.follow; if(!F) return;
  for(const k of ['uche', 'hauwa']){
    const f = F[k], spot = OFFICE[k]; f.h.hold(true);
    const path = inOffice(f.ch.position) ? [OFFICE.door[2], spot.p] : [...OFFICE.door, spot.p];
    walkTo(f.ch, path, { face:spot.f, speed:2.0 });
  }
}
function parkLab(){
  const R = RT(), F = R.follow; if(!F) return;
  F.hauwa.h.hold(true); walkTo(F.hauwa.ch, [[-15.2, -2.7], [-15.2, -4.4], LAB.hauwa.p], { face:LAB.hauwa.f, speed:2.0 });
  F.uche.h.hold(true); walkTo(F.uche.ch, [LAB.uche.p], { face:LAB.uche.f, speed:2.0 });
}
function unpark(exit, inside){
  const R = RT(), F = R.follow; if(!F) return;
  for(const k of ['uche', 'hauwa']){
    const f = F[k];
    if(!inside(f.ch.position)){ stopWalk(f.ch); f.h.hold(false); continue; }
    walkTo(f.ch, exit, { speed:2.2 }).then(ok => { if(ok) f.h.hold(false); });
  }
}

/* the warm shredder (warrant branch) */
function shred(){
  const R = RT(); if(R.page || R.shredBusy || wentIn()) return;
  R.shredBusy = true;
  const go = ()=>{
    const ok = miniPlay({ id:'m12_shred', type:'m12_strips', kicker:'CASE 12 · THE SHREDDER', title:'ONE PAGE, SEVEN STRIPS', noStrikes:true, xp:20,
      sub:'Every strip in the bin came from one page. <b>Tap two strips to swap them.</b> When the lines run straight across, the page reads.',
      startLabel:'TIP OUT THE BIN', winText:'THE PAGE READS', backNote:'The bin stays bagged',
      winNote:'Gate register, page 114: five tankers out of Tank 3 on 27 November, 33,000 litres each. Consignee: "various".',
      params:{ n:7, onSolved:()=>{ RT().page = true; } } }, res => {
      R.shredBusy = false;
      if(R.page || (res && res.ok)){ R.page = true; pageDone(); return; }
      if(R.itShred){ R.itShred.label = 'Piece the shredded page together'; R.itShred._used = false; }
      V13.toast('BARRISTER DANLADI', X.m12_x_binlater, 2400);
    });
    if(!ok) R.shredBusy = false;
  };
  if(!R.shredSeen){
    R.shredSeen = true; shotAt(SHOT.shred);
    V13.say('m12_shred', ()=>{ unshot(); setTimeout(go, 250); });
  } else go();
}
function pageDone(){
  const R = RT();
  if(R.itShred){ V13.drop(R.itShred); R.itShred = null; }
  V13.toast('PAGE 114', 'Taped back together. It goes in the bag with the gate register.', 1900);
  if(R.itSoto) R.itSoto._used = false;
}

/* Sotonye Jumbo: the search, then the conversation */
function sotonyeTalk(it){
  const R = RT();
  if(!wentIn() && !R.page){ V13.toast('BARRISTER DANLADI', X.m12_x_bin, 2400); if(!R.shredBusy && R.shredSeen) shred(); return; }
  if(R.step === 'search'){
    meet(R.sotonye); roomShot(R.sotonye);
    V13.say(R.amina ? 'm12_search' : 'm12_search_noamina', ()=>{ unshot(); afterSearch(it); });
    return;
  }
  if(R.step === 'sotonye'){
    meet(R.sotonye); roomShot(R.sotonye);
    V13.say('m12_sotonye', ()=>{ unshot(); afterSotonye(it); });
  }
}
function afterSearch(it){
  const R = RT(), s = MC().s2_search;
  if(s === 'amina' && !R.amina){
    // forty minutes: Corporal Amina came from the Area Command
    R.amina = V13.person('amina', { x:OFFICE.amina.p[0], z:OFFICE.amina.p[1], rot:OFFICE.amina.f }, { id:'amina', solid:false, clip:'folded' });
    clock(40); ownerAdd(60);
  } else clock(5);
  V13.play(R.sotonye, s === 'self' ? 'folded' : 'idle');
  R.step = 'sotonye'; it.label = 'Ask Sotonye about Tank 3'; it._used = false;
}
function afterSotonye(it){
  const R = RT(), f = MC().s2_sotonye;
  V13.drop(it); R.itSoto = null; R.step = 'car';
  V13.play(R.sotonye, f === 'pressured' ? 'folded' : 'idle');
  V13.done('o12_office'); clock(5);
  objText('o12_log', 'Get the USB from Sotonye\'s car');
  R.itCar = addIt(V13.spot(SPOT.car, 'Open the Kia\'s glovebox', glovebox, { verb:'open', range:2.2 }), 12);
}
function glovebox(it){
  const R = RT();
  if(R.usbBusy) return;                       // the envelope is out, the stick is coming: a second press waits for it
  if(R.usb){ readUsb(it); return; }
  const go = ()=>{
    if(R.usbBusy) return;
    R.usbBusy = true;
    R.usb = true; if(typeof sfxEvidence === 'function') sfxEvidence();
    V13.toast('GLOVEBOX', 'An envelope marked INSURANCE. Inside: one USB stick.', 2400);
    setTimeout(()=>readUsb(it), 900);
  };
  if(typeof playInteraction === 'function'){
    playInteraction({ spot:[-10.15, 9.25], face:0, clip:'interact', dur:1.6, hitAt:0.6, target:[-10.25, 0.85, 10.4], camBack:2.1, camSide:-1.2, camUp:1.8, done:go });
  } else go();
}
function readUsb(it){
  const R = RT();
  R.usbBusy = false;
  it.label = 'Read the USB stick';
  docStep('m12_log', 'loading_log', it, ()=>{
    V13.drop(it); R.itCar = null;
    V13.done('o12_log'); R.step = 'seize'; clock(5);
    R.itSeize = addIt(V13.spot(SPOT.cabinets, 'Seize the files and the gate register', seize, { verb:'collect', range:2.4 }), 13);
  });
}
/* the seizure: an inventory she signs and keeps, or none */
function seize(it){
  const R = RT();
  if(R.seizing || R.officeDone) return;       // one seizure, one inventory
  R.seizing = true;
  meet(R.sotonye); roomShot(R.sotonye);
  V13.say('m12_inventory', ()=>{
    unshot(); V13.drop(it); R.itSeize = null; R.seizing = false;
    const signed = MC().s2_inventory === 'signed';
    clock(signed ? 35 : 5); ownerAdd(signed ? 45 : 0);              // (the owner's clock takes it at the Action-pace rate)
    V13.ev('gate_register', EVNAME.gate_register, QUAL.gate_register(), 50); grade('gate_register');
    grade('loading_log');
    V13.done('o12_seize'); R.officeDone = true; R.step = 'done';
    afterThread('office');
  });
}

/* Tank 3: a bottle from the valve, then the lab bench */
function valve(it){
  const R = RT(), F = R.follow;
  if(F){ F.uche.h.hold(true); F.hauwa.h.hold(true); }             // they wait behind you while you kneel at the valve
  const done = ()=>{
    if(F){ F.uche.h.hold(false); F.hauwa.h.hold(false); }
    R.sample = true; V13.drop(it); R.itValve = null;
    V13.toast('TANK 3', 'Two bottles drawn. Sealed, labelled, signed across the seal.', 2600);
    objText('o12_tank', 'Test the Tank 3 sample at the lab bench'); clock(8);
    R.itLab = addIt(V13.spot(SPOT.lab, 'Test the sample at the lab bench', lab, { verb:'inspect', range:1.9 }), 21);
  };
  if(typeof playInteraction === 'function') playInteraction({ spot:[1.55, -7.0], face:PI / 2, clip:'kneel', dur:2.4, hitAt:1.2, cam:{ pos:[2.6, 1.7, -4.4], look:[1.9, 0.55, -7.0] }, onHit:()=>{ if(typeof sfxScan === 'function') sfxScan(); }, done });
  else done();
}
function lab(it){
  const R = RT();
  if(!R.sample){ V13.toast('BARRISTER DANLADI', X.m12_x_lab, 2400); return; }
  const go = ()=>docStep('m12_sample', 'tank3_sample', it, ()=>{ V13.drop(it); R.itLab = null; V13.done('o12_tank'); clock(15); afterThread('tank'); });
  if(typeof playInteraction === 'function') playInteraction({ spot:[-15.2, -5.3], face:PI, clip:'interact', dur:1.4, hitAt:0.7, target:[-15.4, 0.95, -6.45], camBack:1.3, camSide:0.5, done:go });
  else go();
}

/* Chairman Ibinabo at the union shed */
function ibinabo(it){
  const R = RT();
  meet(R.ibinabo); twoShot(R.ibinabo, c => c.z + (c.x > -23.4 ? 0 : -50));           // from the yard side, never behind the shed wall
  V13.say('m12_ibinabo', ()=>{
    unshot(); V13.drop(it); R.itIbi = null;
    V13.play(R.ibinabo, MC().s2_ibinabo === 'cold' ? 'folded' : 'idle');
    V13.done('o12_union'); clock(10); afterThread('union');
  });
}

/* a document: the evidence takes the case's quality rule, or 'weak' if it was failed twice.
   Backing off leaves the interactable where it was, so the player can come back to it. */
function docStep(key, id, it, then){
  const R = RT();
  if(R.docDone[key]){ if(it) V13.drop(it); return; }                       // already on the record: a stale prompt goes, nothing runs twice
  if(R.docOpen === key) return;                                            // already on screen (a second press inside the delay)
  R.docOpen = key;
  S.game.evQ = S.game.evQ || {}; delete S.game.evQ[id];
  let fired = false;
  V13.doc(key, ok => {
    fired = true; R.docDone[key] = true; if(R.docOpen === key) R.docOpen = null;
    if(S.game.evQ[id] === 'weak') R.failed[id] = true;
    if(!V13.hasEv(id)) V13.ev(id, EVNAME[id], 'weak', 30);
    grade(id);
    if(then) then();
  });
  const t0 = Date.now();
  const iv = setInterval(()=>{
    if(fired){ clearInterval(iv); return; }
    const el = document.getElementById('screen-puzzle');
    // a pause over the document holds it (V13.ovShown): that is not backing off
    if(Date.now() - t0 > 700 && !(V13.ovShown ? V13.ovShown('screen-puzzle') : (el && el.classList.contains('show')))){
      clearInterval(iv);
      if(R.docOpen === key) R.docOpen = null;
      if(R.docDone[key]) return;
      if(it){ it._used = false; if(ENGINE.interactables.indexOf(it) < 0) ENGINE.interactables.push(it); }
      V13.toast('LATER', 'It will keep. Come back to it when you are ready.', 2000);
    }
  }, 300);
}

/* the threads come together: who owns Riverstone, where the money goes, Abuja */
function afterThread(which){
  const R = RT();
  if(which === 'office') ownerStop(true);
  const tank = V13.objDone('o12_tank'), union = V13.objDone('o12_union');
  if(R.officeDone && tank && union){ if(!R.cac){ R.cac = true; V13.after(2.0, cacCall); } return; }
  if(!R.officeDone || R.nudged) return;
  R.nudged = true;
  if(!rec()) return;                                                       // Senior: nobody tells you what is next
  V13.after(wentIn() ? 5.5 : 1.4, ()=>V13.radio('SGT. UCHE', !tank && !union ? X.m12_x_both : !union ? X.m12_x_union : X.m12_x_tank, 4400));
}
function cacCall(){
  const tobi = tobiAlive();
  clock(10);
  ring(tobi ? 'Tobi' : 'Mr. Igbinosa', ()=>V13.call(tobi ? /^TOBI/ : /IGBINOSA/, tobi ? 'm12_tobi_cac' : 'm12_igbinosa_cac', readCac));
}
function readCac(){
  const R = RT();
  if(!R.itCac){ R.itCac = addIt(V13.talk(R.hauwa, 'Read the CAC printout with Barrister Danladi', ()=>readCac(), { range:2.8 }), 40); R.itCac._used = true; }
  docStep('m12_cac', 'cac_record', R.itCac, ()=>{
    V13.drop(R.itCac); R.itCac = null;
    V13.done('o12_owner'); clock(5);
    V13.obj('o12_money', 'Follow the money with Barrister Danladi');
    R.itBank = addIt(V13.talk(R.hauwa, 'Ask Barrister Danladi about the money', bank, { range:2.8 }), 41);
  });
}
function bank(it){
  meet(RT().hauwa);
  V13.say('m12_bank', ()=>{
    V13.drop(it); RT().itBank = null;
    V13.ev('bank_trail', EVNAME.bank_trail, 'good', 60); grade('bank_trail');
    V13.done('o12_money'); clock(10);
    V13.after(1.8, ()=>ring('A number in Abuja', ()=>V13.call(/KUTI/, 'm12_summons', ending)));
  });
}
function ending(){
  const R = RT();
  R.ending = true;
  const t = clock(Math.max(15, 200 - R.min));
  V13.skip([t, 'THE WATERFRONT'], ()=>{
    shotAt(SHOT.end);
    V13.say('m12_end', ()=>{
      unshot();
      V13.recruitFromFlags();
      V13.finish('m12');
    });
  }, 2600);
  setTimeout(()=>{
    // behind the card: the three of them at the quay, looking at the river
    const F = R.follow;
    if(F){ F.uche.h.on = false; F.hauwa.h.on = false; }
    for(const ch of [R.uche, R.hauwa]) stopWalk(ch);
    const P = ENGINE.player;
    P.position.set(-4.9, 0, -24.2); P.rotation.y = PI; ENGINE.playerYaw = ENGINE.cameraYaw = PI;
    R.hauwa.position.set(-5.9, 0, -24.0); R.hauwa.rotation.y = PI - 0.15; V13.play(R.hauwa, 'idle');
    R.uche.position.set(-3.9, 0, -24.1); R.uche.rotation.y = PI + 0.2; V13.play(R.uche, 'folded');
    dusk(1, true);
    if(typeof TPCAM !== 'undefined') TPCAM.cur = null;
  }, 450);
}

/* ---------- no warrant: the guard has called the owner ---------- */
function ownerStart(){
  const R = RT(); if(R.owner || R.officeDone) return;
  R.owner = { t:0, max:150, done:false };
  const show = ()=>{ const c = R.owner, left = Math.max(0, c.max - c.t), m = Math.floor(left / 60), s = Math.floor(left % 60);
    if(typeof showMeter === 'function') showMeter('m12owner', 'THE OWNER IS ON HIS WAY', c.t / c.max, 'danger', m + ':' + String(s).padStart(2, '0')); };
  R.owner.show = show; show();
  V13.every(dt => {
    const c = R.owner; if(!c || c.done) return false;
    c.t += dt * rate(); if(c.t >= c.max){ ownerOut(); return false; }        // Action pace: Relaxed 0.75, Hard 1.2, timed sequences off 0
    show();
  });
}
function ownerAdd(s){ const c = RT().owner; if(!c || c.done) return; c.t += s * rate(); if(c.t >= c.max) ownerOut(); else c.show(); }
function ownerStop(beat){
  const c = RT().owner; if(!c || c.done) return;
  c.done = true; if(typeof hideMeter === 'function') hideMeter('m12owner'); V13.play(RT().guard, 'idle');
  if(beat) V13.after(1.2, ()=>V13.radio('SGT. UCHE', X.m12_x_beat, 3600));
}
function ownerOut(){
  const R = RT(), c = R.owner; if(!c || c.done) return;
  c.done = true; if(typeof hideMeter === 'function') hideMeter('m12owner'); V13.play(R.guard, 'idle');
  applyEffect({ heat:+6, agencyFavour:-2 });
  V13.radio('SGT. UCHE', X.m12_x_prado, 4600);
  V13.toast('WORD IS OUT', 'Riverstone\'s owner knows NACECA came in without a warrant.', 2800);
  // a black Prado pulls up outside the gate, waits, and reverses away
  if(typeof VEH === 'undefined' || !VEH.ready || !VEH.types || !VEH.types.suv) return;
  const car = VEH.spawn('suv', { color:'#121418', lights:'on', glow:true }); if(!car) return;
  car.position.set(30, 0, 31.6); car.rotation.y = PI / 2; ENGINE.scene.add(car);
  let t = 0;
  V13.every(dt => {
    t += dt;
    if(t < 6){ const k = t / 6, e = 1 - (1 - k) * (1 - k); car.position.x = 30 - 27.5 * e; }
    else if(t > 12){ const k = Math.min(1, (t - 12) / 6); car.position.x = 2.5 + 30 * k * k; if(k >= 1){ if(car.parent) car.parent.remove(car); return false; } }
  });
}
})();
