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
  for(const o of obs){ if(x > o.minX-r && x < o.maxX+r && z > o.minZ-r && z < o.maxZ+r) return true; }
  return false;
}

/* ---------- foot chase ----------
   cfg: { runner, path:[[x,z],...], speed, catchDist, headStart, crowd:[mesh], label,
          onCaught(), onEscaped() } */
const CHASE = { active:null };
function startChase(cfg){
  const c = Object.assign({ speed:4.8, catchDist:1.45, headStart:0, crowd:[], label:'SUSPECT' }, cfg);
  c.seg = 0; c.t = 0; c.stumble = 0; c.headStart = c.headStart || 0;
  c.speed *= (typeof chaseRate==='function' ? chaseRate() : 1);
  c.total = 0;
  for(let i=1;i<c.path.length;i++) c.total += Math.hypot(c.path[i][0]-c.path[i-1][0], c.path[i][1]-c.path[i-1][1]);
  c.done = 0;
  CHASE.active = c;
  ENGINE.speedMul = 1;
  sfxAlert();
  return c;
}
function stopChase(){ CHASE.active = null; hideMeter('chase'); ENGINE.speedMul = 1; }
function updateChase(dt){
  // player stagger (shoved, or ran into someone)
  if(ENGINE._stagger > 0){ ENGINE._stagger -= dt; ENGINE.speedMul = ENGINE._stagger > 0 ? 0.35 : 1; }
  const c = CHASE.active; if(!c || !ENGINE.player) return;
  if(isOverlayOpen()) return;
  const r = c.runner, u = r.userData;
  if(c.headStart > 0){ c.headStart -= dt; }
  // move the runner along the path
  let step = (c.stumble > 0 ? c.speed*0.35 : c.speed) * dt;
  if(c.stumble > 0) c.stumble -= dt;
  while(step > 0 && c.seg < c.path.length-1){
    const a = c.path[c.seg], b = c.path[c.seg+1];
    const dx = b[0]-r.position.x, dz = b[1]-r.position.z, d = Math.hypot(dx, dz);
    if(d <= step){ r.position.x = b[0]; r.position.z = b[1]; step -= d; c.done += d; c.seg++; }
    else { r.position.x += dx/d*step; r.position.z += dz/d*step; c.done += step; r.rotation.y = Math.atan2(dx, dz); step = 0; }
  }
  u.walkPhase = (u.walkPhase||0) + dt*15;
  const sw = Math.sin(u.walkPhase)*0.75;
  u.armL.rotation.x = sw; u.armR.rotation.x = -sw; u.legL.rotation.x = -sw*0.9; u.legR.rotation.x = sw*0.9;
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
  showMeter('chase', c.label + ' — GAP', Math.min(1, gap/14), gap < 4 ? 'good' : 'danger', gap.toFixed(1)+' m');
  if(gap < c.catchDist && c.headStart <= 0){
    const cb = c.onCaught; stopChase(); if(typeof tackle==='function') tackle(r); toast('GOT HIM','Hands where I can see them!', 1600); sfxComplete();
    if(typeof unlock==='function' && r===ENGINE._marketKC){ unlock('faster'); if(!c.bumps) unlock('not_one'); }
    if(cb) cb(c); return;
  }
  if(c.seg >= c.path.length-1){
    const cb = c.onEscaped; stopChase(); r.visible = false; toast('LOST HIM', c.label + ' is gone.', 2200); sfxFail(); if(typeof haptic==='function') haptic(120); if(cb) cb(c);
  }
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
