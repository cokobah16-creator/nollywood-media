/* =========================================================================
   NACECA · systems/pressure.js
   The pieces that turn "walk up, press E" into moments with stakes:
     · HUD meters  — countdowns and gaps the player can see draining
     · obstacles   — axis-aligned blockers the player has to go around
     · foot chase  — a runner on a path; catch him, or lose him
     · crowd bumps — sprint into a bystander and they go down (trust cost)
   All timers pause while any screen (dialogue, puzzle, pause) is open.
   ========================================================================= */

/* ---------- HUD meters ---------- */
function _meterHost(){
  let host = document.getElementById('hud-meters');
  if(!host){
    host = document.createElement('div'); host.id = 'hud-meters';
    (document.getElementById('hud') || document.body).appendChild(host);
  }
  return host;
}
function showMeter(id, label, frac, tone='danger', valueText=''){
  const host = _meterHost();
  let el = document.getElementById('meter-'+id);
  if(!el){
    el = document.createElement('div'); el.className = 'pmeter'; el.id = 'meter-'+id;
    el.innerHTML = `<div class="pm-top"><span class="pm-label"></span><span class="pm-val"></span></div><div class="pm-bar"><div class="pm-fill"></div></div>`;
    host.appendChild(el);
  }
  el.dataset.tone = tone;
  el.querySelector('.pm-label').textContent = label;
  el.querySelector('.pm-val').textContent = valueText;
  el.querySelector('.pm-fill').style.width = (Math.max(0, Math.min(1, frac))*100).toFixed(1)+'%';
  el.classList.toggle('urgent', tone==='danger' && frac > 0.75);
}
function hideMeter(id){ const el = document.getElementById('meter-'+id); if(el) el.remove(); }
function clearMeters(){ const h = document.getElementById('hud-meters'); if(h) h.innerHTML = ''; }

/* ---------- obstacles ---------- */
function addObstacle(cx, cz, w, d){
  if(!ENGINE.obstacles) ENGINE.obstacles = [];
  ENGINE.obstacles.push({minX:cx-w/2, maxX:cx+w/2, minZ:cz-d/2, maxZ:cz+d/2});
}
function blockedAt(x, z, r=0.3){
  const obs = ENGINE.obstacles; if(!obs || !obs.length) return false;
  const low = !!ENGINE.keys['KeyC'];
  for(const o of obs){ if(o.crouchOnly && low) continue; if(x > o.minX-r && x < o.maxX+r && z > o.minZ-r && z < o.maxZ+r) return true; }
  return false;
}

/* ---------- foot chase ----------
   cfg: { runner, path:[[x,z],...], speed, catchDist, headStart, crowd:[mesh], label,
          lanes:{nodes:[[x,z],...], edges:[[i,j],...]}, endPause, endLine, burst:[seconds, ×speed],
          onCaught(), onEscaped() }
   Catch chases (catchDist > 0): a harder difficulty never makes the runner
   faster than authored; at the end of his path he stalls for endPause seconds,
   then keeps running through the lanes graph, away from the player. He only
   gets away after CHASE.escapeT seconds spent more than CHASE.range metres
   off (that clock drains at 2× while back in range).
   Scripted chases (catchDist <= 0, the cold open) still end at the path's end. */
const CHASE = { active:null, range:14, escapeT:20 };
function startChase(cfg){
  const c = Object.assign({ speed:4.8, catchDist:1.45, headStart:0, crowd:[], label:'SUSPECT' }, cfg);
  c.path = (c.path || []).map(q => [q[0], q[1]]);          // ours to extend
  c.seg = 0; c.t = 0; c.stumble = 0; c.headStart = c.headStart || 0;
  c.baseSpeed = c.speed;
  const rate = (typeof chaseRate==='function' ? chaseRate() : 1);
  c.speed *= c.catchDist > 0 ? Math.min(1, rate) : rate;
  c.total = 0;
  for(let i=1;i<c.path.length;i++) c.total += Math.hypot(c.path[i][0]-c.path[i-1][0], c.path[i][1]-c.path[i-1][1]);
  c.done = 0; c.oorT = 0; c.pause = 0; c.ended = false; c.gNode = null; c.gPrev = null;
  CHASE.active = c;
  ENGINE.speedMul = 1;
  sfxAlert();
  return c;
}
function stopChase(){ CHASE.active = null; hideMeter('chase'); ENGINE.speedMul = 1; }
/* the runner reached the end of c.path: append where he runs next (false = nowhere, he stops) */
function chaseExtend(c){
  const r = c.runner.position;
  if(!c.ended){
    c.ended = true;
    if(c.endPause > 0){ c.pause = c.endPause; if(c.endLine) toast('DOUBLING BACK', c.endLine, 2000); }
  }
  const L = c.lanes;
  if(L && L.nodes && L.nodes.length){
    const N = L.nodes;
    if(c.gNode == null){
      let bi = 0, bd = Infinity;
      N.forEach((n, i)=>{ const d = Math.hypot(n[0]-r.x, n[1]-r.z); if(d < bd){ bd = d; bi = i; } });
      c.gNode = bi;
      if(bd > 0.05){ c.path.push([N[bi][0], N[bi][1]]); return true; }
    }
    // next lane node: keep the biggest lead on the player; don't turn straight back unless cornered
    const p = ENGINE.player ? ENGINE.player.position : r;
    const nb = [];
    for(const e of (L.edges || [])){ if(e[0] === c.gNode) nb.push(e[1]); else if(e[1] === c.gNode) nb.push(e[0]); }
    if(!nb.length) return false;
    let best = nb[0], bs = -Infinity;
    for(const j of nb){
      const n = N[j];
      let sc = Math.hypot(n[0]-p.x, n[1]-p.z) - Math.hypot(n[0]-r.x, n[1]-r.z);
      if(j === c.gPrev) sc -= 4;
      sc += Math.random() * 0.6;
      if(sc > bs){ bs = sc; best = j; }
    }
    c.gPrev = c.gNode; c.gNode = best;
    c.path.push([N[best][0], N[best][1]]);
    return true;
  }
  // no lanes: run the authored path back the other way
  const back = c.path.slice(Math.max(0, c.path.length - 12), -1).reverse();
  if(!back.length) return false;
  for(const q of back) c.path.push([q[0], q[1]]);
  return true;
}
function chaseEscape(c){
  const r = c.runner, cb = c.onEscaped;
  stopChase(); r.visible = false; toast('LOST HIM', c.label + ' is gone.', 2200); sfxFail(); if(typeof haptic==='function') haptic(120); if(cb) cb(c);
}
function updateChase(dt){
  // player stagger (shoved, or ran into someone)
  if(ENGINE._stagger > 0){ ENGINE._stagger -= dt; ENGINE.speedMul = ENGINE._stagger > 0 ? 0.35 : 1; }
  const c = CHASE.active; if(!c || !ENGINE.player) return;
  if(isOverlayOpen()) return;
  const r = c.runner, u = r.userData;
  if(u && (u._caught || u._arrested)){ stopChase(); return; }     // taken in another way (M6: the action button)
  const catchChase = c.catchDist > 0;
  if(c.headStart > 0){ c.headStart -= dt; }
  // move the runner along the path (catch chases: then on through the lanes)
  if(c.pause > 0){ c.pause -= dt; }
  else {
    // cfg.burst [seconds, ×speed]: the first dash when he bolts from arm's length
    let k = 1;
    if(c.burst && (c.burstT = (c.burstT == null ? c.burst[0] : c.burstT)) > 0){ k = c.burst[1]; c.burstT -= dt; }
    let step = (c.stumble > 0 ? c.speed*0.35 : c.speed*k) * dt;
    if(c.stumble > 0) c.stumble -= dt;
    for(let guard = 0; step > 0 && guard < 32; guard++){
      if(c.seg >= c.path.length-1){
        if(!catchChase || !chaseExtend(c) || c.pause > 0 || c.seg >= c.path.length-1) break;
      }
      const b = c.path[c.seg+1];
      const dx = b[0]-r.position.x, dz = b[1]-r.position.z, d = Math.hypot(dx, dz);
      if(d <= step){ r.position.x = b[0]; r.position.z = b[1]; step -= d; c.done += d; c.seg++; }
      else { r.position.x += dx/d*step; r.position.z += dz/d*step; c.done += step; r.rotation.y = Math.atan2(dx, dz); step = 0; }
    }
  }
  if(u){
    u.walkPhase = (u.walkPhase||0) + dt*(c.pause > 0 ? 4 : 15);
    const sw = Math.sin(u.walkPhase)*(c.pause > 0 ? 0.2 : 0.75);
    if(u.armL) u.armL.rotation.x = sw; if(u.armR) u.armR.rotation.x = -sw; if(u.legL) u.legL.rotation.x = -sw*0.9; if(u.legR) u.legR.rotation.x = sw*0.9;
  }
  // the runner barges through bystanders too — it slows him
  for(const m of c.crowd){
    if(!m.visible || m.userData._down) continue;
    if(Math.hypot(m.position.x-r.position.x, m.position.z-r.position.z) < 0.7){ knockDown(m); c.stumble = 0.6; }
  }
  // player bumps
  const p = ENGINE.player.position;
  const sprinting = ENGINE.keys['ShiftLeft'] || ENGINE.keys['ShiftRight'];
  for(const m of c.crowd){
    if(!m.visible || m.userData._down) continue;
    if(Math.hypot(m.position.x-p.x, m.position.z-p.z) < 0.65){
      knockDown(m);
      ENGINE._stagger = 0.7;
      applyEffect({publicTrust: sprinting ? -3 : -1});
      c.bumps = (c.bumps||0) + 1; S.game._opBumps = (S.game._opBumps||0) + 1;
      if(typeof shakeCamera==='function') shakeCamera(0.15); if(typeof haptic==='function') haptic(50);
      toast('BYSTANDER DOWN', sprinting ? 'You flattened a trader at full sprint. −3 Public Trust' : 'You clipped a trader. −1 Public Trust', 1500);
      sfxFail();
    }
  }
  const gap = Math.hypot(r.position.x-p.x, r.position.z-p.z);
  if(catchChase){ if(gap > CHASE.range) c.oorT += dt; else c.oorT = Math.max(0, c.oorT - 2*dt); }
  // out of sight, the meter reads the last-seen point (c.track, kept by beta/chase.js)
  const tp = c.track || r.position, shown = Math.hypot(tp.x-p.x, tp.z-p.z);
  const losing = catchChase && c.oorT > 0.05;
  showMeter('chase', c.label + (losing ? ' — LOSING HIM' : c.track ? ' — LAST SEEN' : ' — GAP'),
    losing ? c.oorT/CHASE.escapeT : Math.min(1, shown/CHASE.range), (shown < 4 && !losing) ? 'good' : 'danger',
    shown.toFixed(1)+' m' + (losing ? ' · ' + Math.ceil(Math.max(0, CHASE.escapeT - c.oorT)) + ' s' : ''));
  if(gap < c.catchDist && c.headStart <= 0){
    const cb = c.onCaught; stopChase(); if(typeof tackle==='function') tackle(r); toast('GOT HIM','Hands where I can see them!', 1600); sfxComplete();
    if(typeof unlock==='function' && r===ENGINE._marketKC){ unlock('faster'); if(!c.bumps) unlock('not_one'); }
    if(cb) cb(c); return;
  }
  if(catchChase ? c.oorT >= CHASE.escapeT : c.seg >= c.path.length-1) chaseEscape(c);
}
function knockDown(m){
  m.userData._down = true;
  m.userData._downT = 0;
  if(m.userData._wander) m.userData._wander = false;
}
function updateKnockdowns(dt){
  for(const n of ENGINE.npcs){
    const m = (n && n.isObject3D) ? n : (n && n.mesh);
    if(!m || !m.userData || !m.userData._down) continue;
    const u = m.userData; u._downT += dt;
    if(u._downT < 0.35) m.rotation.x = -1.45 * (u._downT/0.35);           // falls
    else if(u._stayDown){ m.rotation.x = -1.45; }
    else if(u._downT > 3.0 && u._downT < 3.6) m.rotation.x = -1.45 * (1-(u._downT-3.0)/0.6);   // gets up
    else if(u._downT >= 3.6){ m.rotation.x = 0; u._down = false; }
  }
}
function updatePressure(dt){ updateChase(dt); updateKnockdowns(dt); if(typeof updateTail==='function') updateTail(dt); }

/* ---------- tail (follow unseen) ----------
   cfg: { target, path:[[x,z],...], speed, near, far, lookEvery, lookFor, label,
          onArrive(), onSpotted(), onLost() }
   She walks the path and periodically stops to look back. Being too close,
   or in front of her while she's looking, raises suspicion (crouching halves
   it). Stay too far for too long and she's lost. */
const TAIL = { active:null };
function startTail(cfg){
  const c = Object.assign({ speed:1.4, near:3.2, far:15, lookEvery:6.5, lookFor:1.8, label:'TARGET' }, cfg);
  c.seg = 0; c.t = 0; c.susp = 0; c.lostT = 0; c.lookT = 0; c.nextLook = c.lookEvery;
  TAIL.active = c;
  return c;
}
function stopTail(){ TAIL.active = null; hideMeter('tail'); }
function updateTail(dt){
  const c = TAIL.active; if(!c || !ENGINE.player) return;
  if(isOverlayOpen()) return;
  const r = c.target, u = r.userData, p = ENGINE.player.position;
  c.t += dt;
  const looking = c.lookT > 0;
  if(looking){ c.lookT -= dt; }
  else if(c.t >= c.nextLook){ c.lookT = c.lookFor; c.nextLook = c.t + c.lookEvery + Math.random()*2; }
  let fwdYaw = r.rotation.y;
  if(!looking){
    let step = c.speed * dt;
    while(step > 0 && c.seg < c.path.length-1){
      const b = c.path[c.seg+1];
      const dx = b[0]-r.position.x, dz = b[1]-r.position.z, d = Math.hypot(dx, dz);
      if(d <= step){ r.position.x = b[0]; r.position.z = b[1]; step -= d; c.seg++; }
      else { r.position.x += dx/d*step; r.position.z += dz/d*step; r.rotation.y = Math.atan2(dx, dz); step = 0; }
    }
    u.walkPhase = (u.walkPhase||0) + dt*6;
    const sw = Math.sin(u.walkPhase)*0.35;
    u.armL.rotation.x = sw; u.legL.rotation.x = -sw*0.8; u.legR.rotation.x = sw*0.8;
    fwdYaw = r.rotation.y;
  } else {
    // turn to glance back down the street
    const back = (c.path[Math.max(0,c.seg)]) ; void back;
    r.rotation.y = fwdYaw;   // body keeps its heading; the look is the head + suspicion check
    u.neck && (u.neck.rotation.y = Math.PI*0.9);
  }
  if(!looking && u.neck) u.neck.rotation.y *= 0.8;
  const dx = p.x - r.position.x, dz = p.z - r.position.z, dist = Math.hypot(dx, dz);
  const crouch = ENGINE.keys['KeyC'];
  let gain = 0;
  if(dist < c.near) gain += 38;
  if(looking && dist < 10){
    // she is looking back along the way she came: the player is "seen" if behind her within a cone
    const toP = Math.atan2(dx, dz);
    let d = toP - (fwdYaw + Math.PI); while(d > Math.PI) d -= Math.PI*2; while(d < -Math.PI) d += Math.PI*2;
    if(Math.abs(d) < 0.95) gain += (crouch ? 22 : 55) * (1 - dist/12);
  }
  const rate = (typeof chaseRate==='function' ? chaseRate() : 1);
  if(gain > 0) c.susp = Math.min(100, c.susp + gain * dt * rate);
  else c.susp = Math.max(0, c.susp - 7*dt);
  c.lostT = dist > c.far ? c.lostT + dt : 0;
  showMeter('tail', c.label + (looking ? ' — LOOKING BACK' : ' — SUSPICION'), c.susp/100, c.susp > 55 || looking ? 'danger' : 'info', dist.toFixed(0) + ' m');
  if(c.susp >= 100){ const cb = c.onSpotted; stopTail(); toast('SPOTTED', 'She saw you. She\'s running for the gate.', 2200); sfxFail(); if(typeof haptic==='function') haptic(120); if(cb) cb(); return; }
  if(c.lostT > 4){ const cb = c.onLost || c.onSpotted; stopTail(); toast('LOST HER', 'She turned a corner and she\'s gone.', 2200); sfxFail(); if(cb) cb(); return; }
  if(c.seg >= c.path.length-1){ const cb = c.onArrive; stopTail(); if(cb) cb(); }
}
