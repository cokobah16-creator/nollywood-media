/* =========================================================================
   NACECA · src/tactics/tac_sight.js — the shared sight-and-noise module and its HUD
   Owner: Team A (foundations). DESIGN-tactics.md §3.2, §3.6, §4, §5.1; foundations.md §1g, §3.5, §3.7.

   Replaces the kernel's fallback TAC.sight wholesale, with the same signatures and constants
   (TAC.sight.K is the kernel's object). Dormant until an owner registers a watcher at scene build.
   · physics: line of sight through TAC.sight.los (tac_geo), the 100° cone, lit/dark range,
     per-metre gain (gait multiplier max(1, min(3.4, v/1.55)) while moving, 0.7 still), noise bands
     (1.0 crouched, 2.5 upright, 9.0 sprinting; ×0.5 through a tall box), crowd cover (standing
     people from crowd() only, on the line, ≥ 3 m from the watcher, ≤ 3.2 m/s), close (+40/s),
     grace, decay, the alarm latch with alarmHold; 10 Hz on TAC.onTick; frozen under overlays.
   · the module never writes rotation: state.glance is computed, the owner renders facing() + glance.
   · the why-line ("He can see you crossing the open road, standing"), frozen in the past tense at alarm.
   · HUD: the eye (#eye-ind, palette always) with .eye-why, body.tac-eye; the head marker .tac-mark;
     the Recruit-only tac_sight chip through TAC.hint.
   · telemetry (§4): seen (one per watcher per level per 10 s; a reset with a cause always logs) and
     evaded (below 5 after a notice, no alarm, not a quiet episode), both with logExtra().
   ========================================================================= */
(function(){
'use strict';
const TAC = window.TAC;
if(!TAC || !TAC.v || !TAC.sight || TAC.sight._real) return;
const V = () => window.V12 || null;
const wrap = (name, make) => (V() && V12.wrap) ? V12.wrap(name, make) : false;
const eng = () => (typeof ENGINE !== 'undefined') ? ENGINE : null;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const K = TAC.sight.K;                       // the kernel's frozen constants (§5.1): one set of numbers
const kernelLos = TAC.sight.los;
const los = (ax, az, ah, bx, bz, bh) => (TAC.geo && TAC.geo._los ? TAC.geo._los : kernelLos)(ax, az, ah, bx, bz, bh);
const isTouch = () => !!(document.body && document.body.classList.contains('touch-active'));

/* ---------- scene state ---------- */
const W = [];
let zones = [], lights = { ambient:'lit', lamps:[] };
let clock = 0;                               // play seconds on the 10 Hz tick (deterministic in the harness)
const lightAt = (x, z) => {
  for(const l of (lights.lamps || [])) if(Math.hypot(x - l[0], z - l[1]) <= l[2]) return 'lit';
  return lights.ambient || 'lit';
};
const zoneAt = (x, z) => { for(const zn of zones){ const r = zn && zn.rect; if(r && x >= r[0] && x <= r[1] && z >= r[2] && z <= r[3]) return zn; } return null; };
const rate = () => {
  const pace = (typeof SETTINGS !== 'undefined' && K.pace[SETTINGS.difficulty]) || 1;
  const gm = (V() && V12.has && V12.has('greyman')) ? K.greyman : 1;
  return Math.min(1, pace) * gm;             // pace never exceeds standard ('hard' is 1)
};
const gaitOf = (v, crouch) => v < K.stillV ? 'still' : crouch ? 'sneak' : v < 2.2 ? 'walk' : v < K.sprintV ? 'jog' : 'sprint';

/* ---------- the pure model: what a position would produce (no side effects) ---------- */
function compute(w, P, crouch, v, vel, extra){
  const c = w.cfg, st = w.state, m = c.mesh, ex = +m.position.x || 0, ez = +m.position.z || 0;
  const dx = P.x - ex, dz = P.z - ez, d = Math.hypot(dx, dz);
  const base = c.facing ? +c.facing() || 0 : w.baseYaw;
  const yaw = base + (c.glance ? (st.glance || 0) : 0);
  const fx = Math.sin(yaw), fz = Math.cos(yaw);
  const ang = d > 1e-3 ? Math.acos(clamp((dx * fx + dz * fz) / d, -1, 1)) * 180 / Math.PI : 0;
  // the bearing off his BASE facing, for "behind him / beside him"
  const angBase = d > 1e-3 ? Math.acos(clamp((dx * Math.sin(base) + dz * Math.cos(base)) / d, -1, 1)) * 180 / Math.PI : 0;
  const lit = c.light ? (c.light(P.x, P.z) === 'dark' ? 'dark' : 'lit') : lightAt(P.x, P.z);
  const R = (extra && extra.range) || (lit === 'dark' ? c.range.dark : c.range.lit);
  const inRange = d <= R, inCone = ang <= c.fov / 2;
  const still = v < K.stillV, gait = gaitOf(v, crouch);
  const eye = c.eyeH == null ? 1.6 : +c.eyeH;
  let losS = 'none', cover = null, tallBetween = null;
  if(inRange && inCone){
    const L = los(ex, ez, eye, P.x, P.z, crouch ? K.target.crouch : K.target.stand);
    losS = L.clear ? 'clear' : (L.by || 'tall'); cover = L.name || null;
    if(!L.clear && L.by === 'tall') tallBetween = true;
    // standing in plain view over something low: "standing behind the stall" (it would hide you crouched)
    if(L.clear && !crouch){ const L2 = los(ex, ez, eye, P.x, P.z, K.target.crouch); if(!L2.clear && L2.by === 'low') cover = L2.name || null; }
  }
  // crowd cover: a standing person from crowd() (never a companion), between him and you, close to you
  let crowd = false;
  if(c.crowd && d >= K.crowd.minWatcher && v <= K.crowd.maxV && d > 1e-3){
    let list = []; try{ list = c.crowd() || []; }catch(e){ TAC._err(e); }
    for(const g of list){
      const mm = g && (g.position ? g : g.mesh); const q = mm && mm.position;
      if(!q || mm.visible === false || (mm.userData && mm.userData._down)) continue;
      const qx = +q.x || 0, qz = +q.z || 0;
      if(Math.hypot(qx - P.x, qz - P.z) > K.crowd.near) continue;
      const t = ((qx - ex) * dx + (qz - ez) * dz) / (d * d);
      if(t < 0 || t > 1) continue;                                        // not between him and you
      if(Math.abs((qx - ex) * dz - (qz - ez) * dx) / d > K.crowd.seg) continue;
      crowd = true; break;
    }
  }
  let att = 1; if(c.attention){ try{ att = clamp(+c.attention() || 0, 0, 1); }catch(e){ TAC._err(e); } }
  const rk = rate() * (c.gain == null ? 1 : +c.gain);
  const parts = { sight:0, noise:0, close:0, rush:0 };
  const seen = inRange && inCone && losS === 'clear' && !crowd;
  if(seen){
    const gm = still ? K.still : clamp(v / K.walkRef, K.moveMin, K.moveMax);   // per metre, at any upright pace
    parts.sight = (crouch ? K.base.crouch : K.base.stand) * (1 - K.falloff * d / R) * gm * att * rk;
    if(extra && extra.grace) parts.sight *= K.grace.mul;
  }
  if(c.rush && inRange && inCone && losS !== 'tall' && d < c.rush.dist && vel){
    const closing = -(vel.x * dx + vel.z * dz) / Math.max(d, 1e-3);
    if(closing > c.rush.speed) parts.rush = c.rush.gain * att * rk;
  }
  const r = still ? 0 : crouch ? K.noise.sneak : v > K.sprintV ? K.noise.sprint : K.noise.normal;
  if(r > 0 && d < r){
    let n = K.noise.gain * (1 - d / r) * (c.hearing == null ? 1 : +c.hearing) * rk;
    if(tallBetween == null){ const L = los(ex, ez, eye, P.x, P.z, K.target.stand); tallBetween = !L.clear && L.by === 'tall'; }
    if(tallBetween) n *= K.noise.tallMul;
    parts.noise = n;
  }
  if(d < K.close.dist && !(crouch && still)) parts.close = K.close.gain * rk;
  let cause = null, top = 0;
  for(const k of ['sight', 'rush', 'noise', 'close']) if(parts[k] > top){ top = parts[k]; cause = k === 'rush' ? 'sight' : k; }
  const zn = zoneAt(P.x, P.z);
  return { dist:+d.toFixed(2), angle:Math.round(ang), angBase:Math.round(angBase), inCone, inRange, los:losS, cover, crouch:!!crouch, gait, speed:+v.toFixed(2), lit, crowd,
    seen, heard:parts.noise > 0, parts, gain:parts.sight + parts.noise + parts.close + parts.rush, cause, place:zn ? zn.name : null, open:!!(zn && zn.open) };
}

/* ---------- the why grammar (foundations §3.7) ---------- */
function whyLine(w, s, past){
  const He = w.cfg.he || 'He', him = /^she$/i.test(He) ? 'her' : 'him';
  if(s.cause === 'close') return "You were within arm's reach";
  const moving = s.gait !== 'still';
  if(s.cause === 'noise'){
    const verb = s.gait === 'sprint' ? 'sprinting' : s.gait === 'sneak' ? 'creeping' : 'walking';
    const side = s.angBase >= 135 ? ` behind ${him}` : !s.inCone ? ` beside ${him}` : '';
    return `${He} ${past ? 'heard' : 'can hear'} you ${verb}${side}${w.cfg.surface ? ' ' + w.cfg.surface : ''}`;
  }
  if(s.cause === 'sight'){
    let verb = '';
    if(moving) verb = s.open ? 'crossing' : s.gait === 'sprint' ? 'running' : s.gait === 'sneak' ? 'creeping' : 'walking';   // desktop jog and touch walk read the same
    const place = s.place || (Math.round(s.dist) + ' m away');
    const posture = s.crouch ? 'crouched in the open' : s.cover ? 'standing behind ' + s.cover : 'standing';
    return `${He} ${past ? 'saw' : 'can see'} you ${verb ? verb + ' ' : ''}${place}, ${posture}`;
  }
  return '';
}

/* ---------- telemetry ---------- */
const extraOf = w => { try{ return w.cfg.logExtra ? (w.cfg.logExtra() || {}) : {}; }catch(e){ TAC._err(e); return {}; } };
const curObj = () => { try{ const o = ((S.game && S.game.objectives) || []).find(x => !x.done); return o ? o.id : null; }catch(e){ return null; } };
function logSeen(w, level, s, causeOverride, whyText){
  const k = level;
  if(!causeOverride && w._lastSeen[k] != null && clock - w._lastSeen[k] < K.seenEvery) return;
  w._lastSeen[k] = clock;
  if(TAC._ms) TAC._ms.seen[level] = (TAC._ms.seen[level] || 0) + 1;
  const P = TAC.player.pos() || { x:0, z:0 };
  try{ if(V() && V12.log) V12.log('seen', Object.assign({ who:w.cfg.id, enc:w.cfg.enc || null, level, cause:causeOverride || s.cause,
    dist:s.dist == null ? null : Math.round(s.dist * 10) / 10, ang:s.angle, los:s.los, cover:s.cover, crouch:!!s.crouch, gait:s.gait, lit:s.lit, crowd:!!s.crowd, inCone:!!s.inCone,
    parts:{ sight:Math.round(w._acc.sight), noise:Math.round(w._acc.noise), close:Math.round(w._acc.close) },
    peak:Math.round(w.state.peak), ms:w._firstGain != null ? Math.round((clock - w._firstGain) * 1000) : 0, why:whyText === undefined ? w.state.why : whyText, place:s.place || null,
    px:Math.round(P.x * 10) / 10, pz:Math.round(P.z * 10) / 10, obj:curObj() }, extraOf(w))); }catch(e){ TAC._err(e); }
}
function startEpisode(w, quiet){ w._ep = { t0:clock, quiet:!!quiet, alarm:false, mix:{}, drain:0, crouch:0 }; }
function endEpisode(w){
  const ep = w._ep; w._ep = null;
  if(ep && !ep.quiet && !ep.alarm){
    let how = 'distance', best = -1;
    for(const k of Object.keys(ep.mix)) if(ep.mix[k] > best){ best = ep.mix[k]; how = k; }
    const tot = Object.keys(ep.mix).reduce((a, k) => a + ep.mix[k], 0) || 1;
    const mix = {}; for(const k of Object.keys(ep.mix)) mix[k] = Math.round(ep.mix[k] / tot * 100) / 100;
    if(TAC._ms) TAC._ms.evaded++;
    try{ if(V() && V12.log) V12.log('evaded', Object.assign({ who:w.cfg.id, enc:w.cfg.enc || null, peak:Math.round(w.state.peak), secs:Math.round((clock - ep.t0) * 10) / 10,
      how, crouchPct:ep.drain ? Math.round(ep.crouch / ep.drain * 100) : 0, mix }, extraOf(w))); }catch(e){ TAC._err(e); }
  }
  w.state.peak = w.state.susp; w._acc = { sight:0, noise:0, close:0 }; w._firstGain = null; w._frozenUntil = -1;
}

/* ---------- levels ---------- */
function levelFrom(w, v, prev){
  const L = w.levels;
  if(v >= L.alarm) return 'alarm';
  if(prev === 'alarm') return v >= L.exit ? 'notice' : 'calm';
  if(prev === 'notice') return v < L.exit ? 'calm' : 'notice';
  return v >= L.notice ? 'notice' : 'calm';
}
function changed(w, lv, prev){
  const c = w.cfg;
  if(c.onLevel) try{ c.onLevel(lv, w.state); }catch(e){ TAC._err(e); }
  if(lv === 'notice' && prev === 'calm' && c.hud !== false){
    TAC.hint('sight', 'Crouch behind something lower than you, keep people around you, or come at him from behind.',
      'Tap CROUCH behind something lower than you, keep people around you, or come at him from behind.');
  }
}

/* ---------- one watcher, one 10 Hz step ---------- */
function step(w, dt){
  const c = w.cfg, st = w.state;
  let ok = false;
  try{ ok = (!c.active || !!c.active()) && TAC.geo.ready() && !!(c.mesh && c.mesh.position) && c.mesh.visible !== false; }catch(e){ TAC._err(e); ok = false; }
  st.active = ok; if(!ok) return;
  const P = TAC.player.pos(); if(!P) return;
  const v = TAC.player.speed(), vel = TAC.player.vel(), crouch = TAC.player.crouch();
  const grace = w._unseenT >= K.grace.after && w._graceT < K.grace.secs;
  const s = compute(w, P, crouch, v, vel, { grace });
  const prev = st.level;
  for(const k of ['dist', 'angle', 'inCone', 'inRange', 'los', 'cover', 'crouch', 'gait', 'speed', 'lit', 'crowd', 'seen', 'heard', 'parts', 'cause', 'place']) st[k] = s[k];
  if(s.seen){ w._graceT += dt; w._unseenT = 0; } else { w._unseenT += dt; if(w._unseenT >= K.grace.after) w._graceT = 0; }
  if(s.gain > 0){
    if(w._firstGain == null) w._firstGain = clock;
    st.susp = Math.min(100, st.susp + s.gain * dt);
    w._acc.sight += (s.parts.sight + s.parts.rush) * dt; w._acc.noise += s.parts.noise * dt; w._acc.close += s.parts.close * dt;
  } else if(prev !== 'alarm'){
    st.susp = Math.max(0, st.susp - K.decay * dt);
  }
  // an alarm nobody reset() unlatches after alarmHold seconds unseen: 99, then it decays
  if(prev === 'alarm'){
    if(s.gain > 0) w._alarmT = 0; else w._alarmT += dt;
    if(w._alarmT >= (c.alarmHold == null ? K.alarmHold : c.alarmHold)) st.susp = Math.min(st.susp, w.levels.alarm - 1);
  }
  st.peak = Math.max(st.peak, st.susp);
  if(s.cause && clock >= w._frozenUntil) st.why = whyLine(w, s, false);
  const lv = levelFrom(w, st.susp, prev);
  if(lv !== prev){
    st.level = lv;
    if(lv === 'notice' && prev === 'calm'){
      if(!w._ep) startEpisode(w, false);
      logSeen(w, 'notice', st);
      // the glance: up to 35° toward where he saw you, held 2 s (the owner renders it)
      if(c.glance){
        const base = c.facing ? +c.facing() || 0 : w.baseYaw, want = Math.atan2(P.x - c.mesh.position.x, P.z - c.mesh.position.z);
        let dd = want - base; while(dd > Math.PI) dd -= 2 * Math.PI; while(dd < -Math.PI) dd += 2 * Math.PI;
        w._glanceTo = clamp(dd, -K.glance.max, K.glance.max); w._glanceHold = K.glance.hold;
      }
    }
    if(lv === 'alarm'){
      if(!w._ep) startEpisode(w, false);
      w._ep.alarm = true; w._alarmT = 0;
      st.why = st.whyPast = whyLine(w, s, true) || st.why; w._frozenUntil = clock + 8;
      logSeen(w, 'alarm', st, null, st.whyPast);
    }
    changed(w, lv, prev);
  }
  // the drain: why the suspicion is falling (for evaded.how and mix)
  if(w._ep && s.gain === 0 && st.level !== 'alarm'){
    const why = s.crowd ? 'crowd' : (s.inRange && s.inCone && s.los !== 'clear') ? 'cover' : !s.inRange ? (s.lit === 'dark' ? 'dark' : 'distance') : 'cone';
    w._ep.mix[why] = (w._ep.mix[why] || 0) + dt; w._ep.drain += dt; if(crouch) w._ep.crouch += dt;
  }
  if(w._ep && st.level === 'calm' && st.susp < K.evadeBelow) endEpisode(w);
  // the glance is computed, never written to the rig
  if(c.glance){
    if(w._glanceHold > 0) w._glanceHold -= dt; else w._glanceTo = 0;
    const dg = w._glanceTo - st.glance; st.glance += clamp(dg, -K.glance.speed * dt, K.glance.speed * dt);
  } else st.glance = 0;
}

/* ---------- the eye: #eye-ind (palette always, tactics.css), .eye-why, body.tac-eye ---------- */
const EYE = { on:false, frac:-1, mode:null, why:null, placeT:-1e9 };
const yieldEye = () => (typeof TAIL !== 'undefined' && TAIL.active) || TAC.mission() === 'm0' || !!(document.body && document.body.classList.contains('v12-car'));
function eyeEl(){ return document.getElementById('eye-ind'); }
function whyEl(){
  const el = eyeEl(); if(!el) return null;
  let w = el.querySelector('.eye-why');
  if(!w){ w = document.createElement('div'); w.className = 'eye-why'; el.appendChild(w); }
  return w;
}
function releaseEye(){
  if(!EYE.on) return;
  EYE.on = false; EYE.frac = -1; EYE.mode = null; EYE.why = null;
  try{ if(typeof setEye === 'function') setEye(null); }catch(e){ TAC._err(e); }
  if(document.body) document.body.classList.remove('tac-eye');
  const w = eyeEl() && eyeEl().querySelector('.eye-why'); if(w) w.textContent = '';
  const el = eyeEl(); if(el){ el.style.top = ''; el.style.left = ''; el.style.transform = ''; el.classList.remove('tac-placed'); }
}
function hud(){
  if(typeof setEye !== 'function') return;
  if(yieldEye()){ releaseEye(); return; }
  const t = top();
  if(!(t && t.susp > 0.5)){ releaseEye(); return; }
  const frac = t.susp / 100, mode = t.seen ? 'look' : null;
  if(!EYE.on || Math.abs(frac - EYE.frac) >= 0.005 || mode !== EYE.mode){ setEye(frac, mode); EYE.frac = frac; EYE.mode = mode; }
  if(!EYE.on){ EYE.on = true; if(document.body) document.body.classList.add('tac-eye'); EYE.placeT = -1e9; }
  const w = whyEl();
  if(w && t.why !== EYE.why){ w.textContent = t.why || ''; EYE.why = t.why; EYE.placeT = -1e9; }
  placeEye();
}
// The eye goes where nothing else is: measured each half second against the radio strip, the mission panel,
// the minimap, the hint chip and the thumb controls, inside a 16 px gutter. It stays put while its spot is clear,
// and moves to the clear spot nearest the top centre when something lands on it (on a phone held either way the
// top edge is crowded: the base position overlaps the mission panel in portrait and the radio in landscape).
const AVOID = ['#radio-sub.show', '#hud-mission', '.hud-topright', '.minimap-label', '#hud-pausebtn', '#hint-chip.show', '#joystick', '#hud-sprint',
  '#hud-ctx', '#hud-casebar', '#hud-meters', '.hud-bottomright', '#tac-chips', '.hud-topleft-controls'];
const ov = (a, b) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;
const G = 16;
function avoidRects(){
  const rects = [];
  for(const sel of AVOID) document.querySelectorAll(sel).forEach(n => {
    const r = n.getBoundingClientRect(); if(r.width < 2 || r.height < 2) return;
    // (no opacity test: the radio strip and the hint chip fade in, and are listed only while .show)
    const cs = getComputedStyle(n); if(cs.visibility === 'hidden' || cs.display === 'none') return;
    rects.push({ l:r.left - 4, t:r.top - 4, r:r.right + 4, b:r.bottom + 4 });
  });
  return rects;
}
function placeEye(force){
  const el = eyeEl(); if(!el || !EYE.on) return;
  const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  if(!force && now - EYE.placeT < 500) return;
  EYE.placeT = now;
  const rects = avoidRects(), Wv = innerWidth, Hv = innerHeight;
  if(!el.classList.contains('tac-placed')){ el.classList.add('tac-placed'); el.style.transform = 'none'; }
  const W0 = Math.max(1, el.offsetWidth), H0 = Math.max(1, el.offsetHeight);
  const ok = (x, y) => { if(x < G || y < G || x + W0 > Wv - G || y + H0 > Hv - G) return false; const b = { l:x, t:y, r:x + W0, b:y + H0 }; return !rects.some(q => ov(b, q)); };
  const cx = parseFloat(el.style.left), cy = parseFloat(el.style.top);
  if(isFinite(cx) && isFinite(cy) && ok(cx, cy)) return;              // still clear: stay
  let best = null, bc = Infinity;
  for(let y = G; y + H0 <= Hv * 0.6; y += 6) for(let x = G; x + W0 <= Wv - G; x += 6){
    const cost = Math.abs(x + W0 / 2 - Wv / 2) + 1.5 * (y - G);
    if(cost >= bc || !ok(x, y)) continue;
    bc = cost; best = [x, y];
  }
  if(!best) best = [Math.round(Wv / 2 - W0 / 2), G];
  el.style.left = Math.round(best[0]) + 'px'; el.style.top = Math.round(best[1]) + 'px';
}
addEventListener('resize', () => { try{ EYE.placeT = -1e9; placeEye(true); }catch(e){} });

/* ---------- the head marker: .tac-mark[data-who], a 44×6 bar and icon('eye') / icon('alert') ---------- */
const MK = new Map();
function markEl(w){
  let el = MK.get(w);
  if(!el || !el.isConnected){
    const layer = document.getElementById('markers-layer') || document.getElementById('game-root') || document.body;
    el = document.createElement('div'); el.className = 'tac-mark'; el.dataset.who = String(w.cfg.id || '');
    el.innerHTML = '<span class="tac-mark-ico"></span><span class="tac-mark-bar"><i></i></span>';
    layer.appendChild(el); MK.set(w, el); el._lv = null; el._f = -1;
  }
  return el;
}
const _pv = { v:null };
function project(x, y, z){
  if(window.WAY && WAY.project) return WAY.project(x, y, z);
  const cam = ENGINE.camera; if(!cam) return null;
  if(!_pv.v) _pv.v = new THREE.Vector3();
  _pv.v.set(x, y, z); _pv.v.project(cam);
  return { x:(_pv.v.x * 0.5 + 0.5) * innerWidth, y:(-_pv.v.y * 0.5 + 0.5) * innerHeight, behind:_pv.v.z > 1 };
}
// the marker's level, icon and fill follow the 10 Hz tick; its position follows the camera every frame
function markContent(w, el){
  const st = w.state, lv = st.level;
  if(el._lv !== lv){
    el._lv = lv;
    el.dataset.level = lv;
    el.querySelector('.tac-mark-ico').innerHTML = lv === 'alarm' ? (typeof icon === 'function' ? icon('alert') : '') : lv === 'notice' ? (typeof icon === 'function' ? icon('eye') : '') : '';
  }
  const f = Math.round(clamp(st.susp, 0, 100));
  if(el._f !== f){ el._f = f; el.querySelector('.tac-mark-bar i').style.width = f + '%'; }
}
const markShown = w => w.cfg.marker !== false && w.state.active && w.state.susp > 0;
function markTick(){
  for(const w of W){
    if(!markShown(w)){ const el = MK.get(w); if(el && el.style.display !== 'none') el.style.display = 'none'; continue; }
    markContent(w, markEl(w));
  }
}
function markers(){
  const e = eng(); if(!e || !e.camera) return;
  for(const w of W){
    const c = w.cfg, show = markShown(w);
    const el = (show || MK.has(w)) ? markEl(w) : null; if(!el) continue;
    if(!show){ if(el.style.display !== 'none') el.style.display = 'none'; continue; }
    const m = c.mesh.position, headY = (c.eyeH == null ? 1.6 : +c.eyeH) + 0.62;
    const p = project(+m.x || 0, headY, +m.z || 0);       // one projection per active watcher per frame
    if(!p || p.behind || !isFinite(p.x) || !isFinite(p.y)){ el.style.display = 'none'; continue; }
    // the world label sits on the same mesh: lift the marker clear of it
    const lift = (e._nearIt && e._nearIt.mesh === c.mesh) ? 34 : 0;
    el.style.display = '';
    el.style.transform = 'translate(' + Math.round(p.x) + 'px, ' + Math.round(p.y - lift) + 'px) translate(-50%, -100%)';
    el.classList.toggle('lifted', !!lift);
    markContent(w, el);
  }
}
wrap('updateMarkers', orig => function(){
  const r = orig.apply(this, arguments);
  try{ markers(); }catch(e){ TAC._err(e); }
  return r;
});
function dropMarks(){ for(const el of MK.values()) if(el && el.parentNode) el.parentNode.removeChild(el); MK.clear(); }

/* ---------- the API (§3.2): the kernel's signatures and defaults ---------- */
function top(){ let best = null; for(const w of W){ if(!w.state.active || w.cfg.hud === false) continue; if(!best || w.state.susp > best.susp) best = w.state; } return best; }
function watch(cfg){
  const c = Object.assign({ he:'He', eyeH:1.6, fov:K.fov, range:{ lit:K.range.lit, dark:K.range.dark }, hearing:1, gain:1,
    glance:true, marker:true, hud:true, rush:null, alarmHold:K.alarmHold }, cfg || {});
  if(!c.range || c.range.lit == null) c.range = Object.assign({ lit:K.range.lit, dark:K.range.dark }, c.range || {});
  if(c.range.dark == null) c.range.dark = c.range.lit / 2;
  const w = { cfg:c, baseYaw:c.mesh && c.mesh.rotation ? +c.mesh.rotation.y || 0 : 0,
    levels:Object.assign({}, K.levels, c.levels || {}), _lastSeen:{}, _acc:{ sight:0, noise:0, close:0 }, _unseenT:99, _graceT:0,
    _alarmT:0, _glanceTo:0, _glanceHold:0, _frozenUntil:-1, _firstGain:null, _ep:null,
    state:{ id:c.id, active:false, susp:0, level:'calm', peak:0, seen:false, heard:false, dist:null, angle:null, inCone:false, inRange:false,
      los:'none', cover:null, crouch:false, gait:'still', speed:0, lit:'lit', crowd:false, cause:null, why:'', whyPast:'', place:null,
      parts:{ sight:0, noise:0, close:0, rush:0 }, glance:0 } };
  W.push(w);
  const h = {
    get state(){ return w.state; },
    cfg:c,
    reset(v, o){
      o = o || {}; const st = w.state, prev = st.level;
      st.susp = clamp(+v || 0, 0, 100); st.peak = Math.max(st.peak, st.susp); w._alarmT = 0;
      if(o.why){ st.why = o.why; if(st.susp >= w.levels.alarm) st.whyPast = o.why; w._frozenUntil = clock + 3; } else w._frozenUntil = -1;   // the owner acted: the line follows what happens next
      const lv = st.susp >= w.levels.alarm ? 'alarm' : st.susp >= w.levels.notice ? 'notice' : (prev === 'calm' ? 'calm' : (st.susp >= w.levels.exit ? 'notice' : 'calm'));
      if(lv !== 'calm' && !w._ep) startEpisode(w, !!o.quiet);
      else if(o.quiet && w._ep) w._ep.quiet = true;
      if(lv !== prev){
        st.level = lv;
        if(lv === 'alarm'){ w._ep.alarm = true; if(!o.why) st.whyPast = st.why; }
        if(o.cause && (lv === 'notice' || lv === 'alarm')) logSeen(w, lv, st, o.cause, o.why || (st.cause ? st.why : null));
        changed(w, lv, prev);
      }
      if(lv === 'calm' && w._ep){ w._ep.quiet = true; endEpisode(w); }       // the owner settled it: nobody evaded anything
    },
    unwatch(){ const i = W.indexOf(w); if(i >= 0) W.splice(i, 1); const el = MK.get(w); if(el && el.parentNode) el.parentNode.removeChild(el); MK.delete(w); },
  };
  w.handle = h;
  return h;
}
function probe(id, x, z, o){
  o = o || {}; const w = W.find(q => q.cfg.id === id); if(!w) return null;
  const v = o.speed != null ? +o.speed : ({ still:0, sneak:1.25, walk:1.55, jog:3.0, sprint:5.2 })[o.gait || 'still'];
  return compute(w, { x:+x, z:+z }, !!o.crouch, v, o.vel || { x:0, z:0 }, { range:o.range });
}
TAC.sight = {
  full:true, _real:true,
  K, rate, watch, probe, top,
  los,
  zones(list){ zones = (list || []).slice(); },
  lights(o){ lights = Object.assign({ ambient:'lit', lamps:[] }, o || {}); },
  watchers(){ return W.map(w => w.handle); },
  _why:whyLine,
};

/* ---------- lifecycle: 10 Hz decisions, frozen under overlays, dropped at every scene ---------- */
TAC.onTick(dt => {
  if(!W.length){ if(EYE.on) releaseEye(); return; }
  if(TAC.frozen()) return;                              // an overlay or a cutscene: nothing moves, nothing is gained or lost
  clock += dt;
  for(const w of W.slice()){ try{ step(w, dt); }catch(e){ TAC._err(e); } }
  try{ hud(); }catch(e){ TAC._err(e); }
  try{ markTick(); }catch(e){ TAC._err(e); }
}, { order:0 });
TAC.onScene(() => {
  W.length = 0; zones = []; lights = { ambient:'lit', lamps:[] };
  releaseEye(); dropMarks();
}, { order:-10 });
})();
