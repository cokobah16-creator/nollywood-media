/* =========================================================================
   NACECA · systems/guidance.js
   Guidance: a marker over the next thing to do, an edge-of-screen compass
   when it's off-screen, and a hint after 60 s without progress.
   Feel: camera shake, characters turning to face you, a tackle when you
   catch a runner, an evidence flash, and fades between missions.

   "Next thing to do" = the first interactable (in scene order, which follows
   each mission's flow) the player hasn't successfully used yet. An
   interaction counts as used when it changed something: an objective,
   evidence, a story flag, or it opened a conversation or puzzle.
   ========================================================================= */

const GUIDE = { lastProgress: 0, lastSig: '', hintCooldown: 0, el: null, arrow: null };
const TERMINAL_RE = /Extract|Deploy|Board NACECA/;

function progressSig(){
  return JSON.stringify([
    (S.game.objectives||[]).map(o=>o.done?1:0),
    (S.game._opEv||[]).length,
    S.game.flags, S.game.moralChoices,
  ]);
}

/* ---------- interaction hook (called by tryInteract) ---------- */
function onBeforeInteract(it){
  faceEachOther(it);
  const before = progressSig();
  setTimeout(()=>{
    const opened = ['screen-dialogue','screen-puzzle'].some(id=>{ const e=document.getElementById(id); return e && e.classList.contains('show'); });
    if(opened || progressSig() !== before){ it._used = true; GUIDE.lastProgress = performance.now(); }
  }, 260);
}

function guideTarget(){
  if(CHASE && CHASE.active) return { mesh: CHASE.active.runner, label: CHASE.active.label };
  if(typeof TAIL!=='undefined' && TAIL.active) return { mesh: TAIL.active.target, label: 'Follow the ' + TAIL.active.label.toLowerCase() };
  const its = ENGINE.interactables || [];
  const live = it => it.mesh && it.mesh.position && (it.mesh.visible !== false);
  const next = its.find(it => !it._used && live(it) && !TERMINAL_RE.test(it.label));
  if(next) return next;
  return its.find(it => live(it) && TERMINAL_RE.test(it.label)) || null;
}

function ensureGuideEls(){
  if(GUIDE.el) return;
  const host = document.getElementById('hud') || document.body;
  GUIDE.el = document.createElement('div'); GUIDE.el.id = 'guide-marker';
  GUIDE.el.innerHTML = '<div class="gm-chev">▼</div><div class="gm-dist"></div>';
  GUIDE.arrow = document.createElement('div'); GUIDE.arrow.id = 'guide-arrow'; GUIDE.arrow.textContent = '➤';
  host.appendChild(GUIDE.el); host.appendChild(GUIDE.arrow);
}

const _gv = { v:null };
function updateGuidance(dt){
  ensureGuideEls();
  const show = SETTINGS.marker === 'on' && ENGINE.movementEnabled && !isOverlayOpen() && ENGINE.player && ENGINE.camera;
  const t = show ? guideTarget() : null;
  if(!t){ GUIDE.el.style.display = 'none'; GUIDE.arrow.style.display = 'none'; }
  else {
    if(!_gv.v) _gv.v = new THREE.Vector3();
    const m = t.mesh, h = (m.userData && m.userData._skinned) ? 2.25 : (m.userData && m.userData._rig) ? 2.25 * (m.scale ? m.scale.y : 1) : (t.labelY !== undefined ? t.labelY + 0.55 : 1.6);
    _gv.v.set(m.position.x, (m.position.y||0) + h, m.position.z);
    const dist = Math.hypot(m.position.x - ENGINE.player.position.x, m.position.z - ENGINE.player.position.z);
    _gv.v.project(ENGINE.camera);
    const W = window.innerWidth, H = window.innerHeight;
    const behind = _gv.v.z > 1;
    let x = (_gv.v.x*0.5+0.5)*W, y = (-_gv.v.y*0.5+0.5)*H;
    const onScreen = !behind && x > 40 && x < W-40 && y > 70 && y < H-70;
    if(onScreen){
      GUIDE.arrow.style.display = 'none';
      GUIDE.el.style.display = dist < 2.2 ? 'none' : 'block';
      GUIDE.el.style.transform = `translate(${x}px, ${y}px) translate(-50%,-100%)`;
      GUIDE.el.querySelector('.gm-dist').textContent = dist.toFixed(0) + ' m';
    } else {
      GUIDE.el.style.display = 'none';
      if(behind){ x = W - x; y = H - y; }
      const cx = W/2, cy = H/2, dx = x - cx, dy = y - cy;
      const ang = Math.atan2(dy, dx);
      const r = Math.min(W, H) * 0.42;
      GUIDE.arrow.style.display = 'block';
      GUIDE.arrow.style.transform = `translate(${cx + Math.cos(ang)*r}px, ${cy + Math.sin(ang)*r}px) translate(-50%,-50%) rotate(${ang}rad)`;
    }
  }
  // hints after 60 s with no progress (only while actually playing)
  const sig = progressSig();
  if(sig !== GUIDE.lastSig){ GUIDE.lastSig = sig; GUIDE.lastProgress = performance.now(); }
  if(SETTINGS.hints === 'on' && ENGINE.movementEnabled && !isOverlayOpen()){
    if(!GUIDE.lastProgress) GUIDE.lastProgress = performance.now();
    if(performance.now() - GUIDE.lastProgress > 60000){
      GUIDE.lastProgress = performance.now();
      const tt = guideTarget();
      if(tt) toast('HINT', `Try this next: ${tt.label}.${SETTINGS.marker==='on'?' Follow the gold marker.':''}`, 3200);
    }
  } else if(isOverlayOpen()) GUIDE.lastProgress = performance.now();
}
function resetGuidance(){ GUIDE.lastProgress = performance.now(); GUIDE.lastSig = ''; }

/* ---------- feel: characters face each other while talking ---------- */
function faceEachOtherLegacy(it){
  const m = it && it.mesh; if(!m || !ENGINE.player) return;
  if(!(m.userData && m.userData._rig) || m.userData._down) return;
  if(CHASE && CHASE.active && CHASE.active.runner === m) return;
  m.userData._faceT = 1.4;
  const p = ENGINE.player.position;
  ENGINE.player.rotation.y = Math.atan2(m.position.x - p.x, m.position.z - p.z);
  ENGINE.playerYaw = ENGINE.player.rotation.y;
}
function updateFacing(dt){
  const list = (ENGINE.npcs||[]).map(n => (n && n.isObject3D) ? n : (n && n.mesh)).filter(Boolean);
  for(const m of list){
    const u = m.userData; if(!u || !(u._faceT > 0) || !ENGINE.player) continue;
    if(isOverlayOpen()) u._faceT = 0.6; else u._faceT -= dt;
    const p = ENGINE.player.position;
    const want = Math.atan2(p.x - m.position.x, p.z - m.position.z);
    let d = want - m.rotation.y; while(d > Math.PI) d -= Math.PI*2; while(d < -Math.PI) d += Math.PI*2;
    m.rotation.y += d * Math.min(1, dt*8);
  }
}

/* ---------- feel: camera shake ---------- */
function shakeCamera(amount){ if(SETTINGS.reduceMotion === 'on') return; ENGINE._shake = Math.max(ENGINE._shake||0, amount); }
function applyShake(){
  const s = ENGINE._shake || 0; if(s < 0.002 || !ENGINE.camera) return;
  ENGINE.camera.position.x += (Math.random()-0.5)*s;
  ENGINE.camera.position.y += (Math.random()-0.5)*s;
  ENGINE.camera.position.z += (Math.random()-0.5)*s;
  ENGINE._shake = s * 0.88;
}

/* ---------- feel: tackle on catch ---------- */
function tackle(runner){
  if(!ENGINE.player || !runner) return;
  const p = ENGINE.player.position, r = runner.position;
  const dx = r.x - p.x, dz = r.z - p.z, d = Math.hypot(dx, dz) || 1;
  p.x += dx/d * Math.min(0.7, d*0.6); p.z += dz/d * Math.min(0.7, d*0.6);
  ENGINE.player.rotation.y = Math.atan2(dx, dz);
  if(typeof knockDown === 'function') knockDown(runner);
  shakeCamera(0.35);
  haptic([40, 30, 80]);
}

/* ---------- feel: evidence flash ---------- */
function evidenceFlash(){
  haptic(25);
  const c = document.getElementById('ev-cur');
  if(c){ c.classList.remove('ev-pop'); void c.offsetWidth; c.classList.add('ev-pop'); }
  if(SETTINGS.reduceMotion === 'on') return;
  let f = document.getElementById('fx-flash');
  if(!f){ f = document.createElement('div'); f.id = 'fx-flash'; document.getElementById('game-root').appendChild(f); }
  f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
}

/* ---------- feel: fade between missions ---------- */
function fadeIn(){
  let f = document.getElementById('fx-fade');
  if(!f){ f = document.createElement('div'); f.id = 'fx-fade'; document.getElementById('game-root').appendChild(f); }
  f.classList.remove('out'); f.classList.add('black'); void f.offsetWidth;
  requestAnimationFrame(()=>{ f.classList.remove('black'); f.classList.add('out'); });
}

function updateGuideAndFeel(dt){ updateFacing(dt); updateGuidance(dt); }
