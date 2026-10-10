/* =========================================================================
   NACECA · src/tactics/tac_api.js — the TAC kernel: frozen API v1 + fallbacks
   Owner: Team A (foundations). Committed in the shared base before the teams fork.

   Everything another team may call is defined here, with a working fallback,
   so tac_market.js / tac_mansion.js / tac_pt.js can be written and tested
   before Team A's real modules land. Team A's later files REPLACE the
   fallbacks (TAC.sight.*, TAC.geo.*, TAC.radio.*, TAC.lanes.check) but never
   change a signature. The kernel parts (lifecycle driver, player meter,
   interaction selection, TAC.hint) are permanent and live only here.

   Contract: DESIGN-tactics.md §3 (API) and §4 (events). Do not add or rename
   anything here without the lead's sign-off; add new things in your own file.
   ========================================================================= */
(function(){
'use strict';
if(window.TAC && window.TAC.v) return;
const TAC = window.TAC = { v:1 };
const V = () => window.V12 || null;
const wrap = (name, make) => (V() && V12.wrap) ? V12.wrap(name, make) : false;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const mission = () => (typeof S !== 'undefined' && S && S.game) ? S.game.currentMission : null;
const eng = () => (typeof ENGINE !== 'undefined') ? ENGINE : null;
let errs = 0;
TAC._err = e => { if(errs++ < 5) console.error('[tac]', e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e); };
TAC.mission = mission;
TAC.frozen = () => (typeof isOverlayOpen === 'function' && isOverlayOpen()) || !!(eng() && ENGINE.movementEnabled === false);
TAC.state = { pursuit:null };   // a tactics file sets e.g. 'm3_flight' during a scripted pursuit (the logger mutes `away`)

/* ---------- lifecycle: 10 Hz decisions, per-frame movement, scene reset ----------
   updatePressure runs only while the world is live (engine.js:418-423 → :654), and the
   harness stepper (__wf.run) calls it too, so everything here is deterministic in tests. */
const ticks = [], frames = [], scenes = [];
const sub = (arr, fn, o) => {
  const e = { fn, order:(o && o.order) || 0 };
  arr.push(e); arr.sort((a, b) => a.order - b.order);
  return () => { const i = arr.indexOf(e); if(i >= 0) arr.splice(i, 1); };
};
const run = (arr, a) => { for(const e of arr.slice()){ try{ e.fn(a); }catch(err){ TAC._err(err); } } };
TAC.DT = 0.1;
TAC.onTick = (fn, o) => sub(ticks, fn, o);     // fn(0.1): fixed step, at most 3 per frame
TAC.onFrame = (fn, o) => sub(frames, fn, o);   // fn(dt): every live frame, after updatePressure
TAC.onScene = (fn, o) => sub(scenes, fn, o);   // fn(): at newScene, before the next scene builds
let acc = 0;
wrap('updatePressure', orig => function(dt){
  const r = orig.apply(this, arguments);
  const d = clamp(+dt || 0, 0, 0.25);
  try{ TAC.player._sample(d); }catch(e){ TAC._err(e); }
  run(frames, d);
  acc += d; let n = 0;
  while(acc >= TAC.DT - 1e-9 && n < 3){ acc -= TAC.DT; n++; run(ticks, TAC.DT); }
  if(n === 3) acc = 0;
  return r;
});
wrap('newScene', orig => function(){
  acc = 0; TAC.player._reset(); TAC.state.pursuit = null; TAC.hintsShown.length = 0;
  run(scenes, null);
  return orig.apply(this, arguments);
});

/* ---------- the player meter: gait is measured, not read from a rig ---------- */
TAC.player = {
  _h:[], _t:0,
  _sample(dt){
    const e = eng(), P = e && e.player && e.player.position; if(!P) return;
    this._t += dt; const h = this._h, last = h[h.length - 1];
    if(last && Math.hypot(P.x - last[1], P.z - last[2]) > 3) h.length = 0;   // a teleport, not a step
    h.push([this._t, +P.x || 0, +P.z || 0]);
    while(h.length > 2 && this._t - h[1][0] >= 0.3) h.shift();
  },
  _reset(){ this._h.length = 0; },
  pos(){ const e = eng(), P = e && e.player && e.player.position; return P ? { x:+P.x || 0, z:+P.z || 0 } : null; },
  crouch(){ const e = eng(); return !!(e && e.keys && e.keys.KeyC); },
  vel(){ const h = this._h; if(h.length < 2) return { x:0, z:0 }; const a = h[0], b = h[h.length - 1], dt = b[0] - a[0];
    return dt > 1e-3 ? { x:(b[1] - a[1]) / dt, z:(b[2] - a[2]) / dt } : { x:0, z:0 }; },
  speed(){ const v = this.vel(); return Math.hypot(v.x, v.z); },
  gait(){ const v = this.speed(); if(v < 0.3) return 'still'; if(this.crouch()) return 'sneak'; return v < 2.2 ? 'walk' : v < 4.2 ? 'jog' : 'sprint'; },
};

/* ---------- Recruit-only "what to do next" chips (the Senior Agent rule, enforced in one place) ---------- */
TAC.hintsShown = [];
TAC.hint = (id, desktop, touch, ms) => {
  try{
    if(!(typeof isRecruit === 'function' && isRecruit())) return false;
    if(typeof SETTINGS !== 'undefined' && SETTINGS.hints === 'off') return false;
    if(typeof showHint !== 'function') return false;
    const k = 'tac_' + id; if(S.game._hints && S.game._hints[k]) return false;
    showHint(k, desktop, touch, ms); TAC.hintsShown.push(k); return true;
  }catch(e){ TAC._err(e); return false; }
};

/* ---------- shared HUD slots (styled by tactics.css) ---------- */
TAC.ui = {
  // desktop chip row, bottom left (crouch chip, Uche chip); hidden on touch by tactics.css
  chipRow(){
    let el = document.getElementById('tac-chips');
    if(!el){ el = document.createElement('div'); el.id = 'tac-chips'; el.className = 'tac-chips'; (document.getElementById('hud') || document.body).appendChild(el); }
    return el;
  },
};

/* ---------- crouch mode (Team A's tac_core.js adds the setting row; until then: auto) ---------- */
TAC.crouch = { mode(){
  const m = (typeof SETTINGS !== 'undefined' && SETTINGS.crouch) || 'auto';
  if(m !== 'auto') return m;
  return (document.body && document.body.classList.contains('touch-active')) ? 'toggle' : 'hold';
} };

/* ---------- interaction selection: spent targets step aside, priorities by label ----------
   Never mutate it.priority on someone else's interactable: register here instead. */
const spentT = new Map(), prioT = new Map();
TAC.interact = {
  spent(label, fn){ if(fn) spentT.set(label, fn); else spentT.delete(label); },
  priority(label, fn){ if(fn) prioT.set(label, fn); else prioT.delete(label); },
  isSpent(it){ const f = it && spentT.get(it.label); try{ return !!(f && f(it)); }catch(e){ TAC._err(e); return false; } },
  eff(it){
    if(TAC.interact.isSpent(it)) return -1;
    const f = prioT.get(it.label);
    if(f){ try{ const v = f(it); if(v != null) return v; }catch(e){ TAC._err(e); } }
    return typeof it.priority === 'function' ? it.priority() : (it.priority || 0);
  },
  // the candidate filter nearestInteractable uses (people_art_pass.js:557-569); the miss line uses it too
  live(it){ return !!(it && !it.consumed && it.mesh && it.mesh.position && (it.mesh.visible !== false || it.allowHidden)); },
};
wrap('nearestInteractable', orig => function(){
  if(!spentT.size && !prioT.size) return orig.apply(this, arguments);
  const e = eng(); if(!e || !e.player) return null;
  const P = e.player.position; let best = null, bp = -1e9, bd = Infinity;
  for(const it of (e.interactables || [])){
    if(!TAC.interact.live(it)) continue;
    const d = Math.hypot(it.mesh.position.x - P.x, it.mesh.position.z - P.z);
    if(d >= (it.range || 2.5)) continue;
    const pr = TAC.interact.eff(it);
    if(pr > bp || (pr === bp && d < bd)){ best = it; bp = pr; bd = d; }
  }
  return best;
});

/* ---------- radio: fallback = today's radioLine (Team A's tac_radio.js adds priority/expiry/preemption) ---------- */
TAC.radio = {
  full:false,   // true once tac_radio.js has loaded
  say(speaker, text, o){ o = Object.assign({ pri:3, ttl:6000 }, o || {}); if(typeof radioLine === 'function') radioLine(speaker, text, o.ms, o); },
  cancel(key){},
};

/* ---------- lanes: frozen data (installed by Team A's tac_lanes.js; tests may call install()) ---------- */
TAC.lanes = {
  DATA:{
    nodes:[[7.6,17.5],[11.43,17.5],[7.6,11.4],[11.43,11.4],[7.6,7.4],[12.6,7.4],[7.6,0],[12.6,0],
           [7.6,-7.5],[12.6,-7.5],[7.6,-12.5],[12.6,-12.5],[7.6,-18.6],[12.6,-18.6],[7.6,-20.5],[12.6,-20.5],
           [8.46,5.0],[8.46,3.0]],
    edges:[[0,1],[2,3],[0,2],[1,3],[4,5],[2,4],[3,5],[6,7],[4,16],[16,17],[17,6],[5,7],[8,9],[6,8],[7,9],
           [10,11],[8,10],[9,11],[12,13],[10,12],[14,15],[12,14],[13,15]],
    KC_PATH:[[8,4],[8,7.4],[12.6,7.4],[12.6,-2.4],[12.6,-7.5],[7.6,-7.5],[7.6,-12.5],[7.6,-18.6],[12.6,-18.6],[12.6,-20.5]],
  },
  installed:false,
  get KC_PATH(){ return TAC.lanes.DATA.KC_PATH.map(p => p.slice()); },
  install(){
    if(TAC.lanes.installed || typeof MARKET_LANES === 'undefined') return false;
    const D = TAC.lanes.DATA;
    MARKET_LANES.nodes.splice(0, MARKET_LANES.nodes.length, ...D.nodes.map(p => p.slice()));
    MARKET_LANES.edges.splice(0, MARKET_LANES.edges.length, ...D.edges.map(p => p.slice()));
    TAC.lanes.installed = true;
    return true;
  },
  check(){ return null; },   // Team A: {crossing, tight, nodesInside, legsCrossing, nodesInBox, pathLen}
};
wrap('startChase', orig => function(cfg){
  try{ if(TAC.lanes.installed && cfg && eng() && cfg.runner && cfg.runner === ENGINE._marketKC) cfg.path = TAC.lanes.KC_PATH; }catch(e){ TAC._err(e); }
  return orig.apply(this, arguments);
});

/* ---------- geometry: fallback = every line clear (Team A's tac_geo.js classifies the colliders) ---------- */
TAC.geo = {
  full:false,   // true once tac_geo.js has loaded (real heights and line-of-sight)
  // false where the scene has no vision data: watchers freeze (no eye, no gain), today's behaviour
  ready(){ return !(mission() === 'm3' && !(eng() && ENGINE._mansion)); },
  classify(){ return { boxes:0, ghost:0, skip:0, person:0, unknown:0 }; },
  add(cx, cz, w, d, o){
    if(typeof addObstacle !== 'function') return null;
    addObstacle(cx, cz, w, d); const ob = ENGINE.obstacles[ENGINE.obstacles.length - 1];
    if(ob && o) ob.vis = { kind:o.kind || ((o.h || 1) >= 1.7 ? 'tall' : 'low'), h:o.h || 1, y0:o.y0 || 0, name:o.name || null, box:null };
    return ob;
  },
};

/* ---------- sight and noise: fallback watcher model (Team A's tac_sight.js replaces TAC.sight) ----------
   Same formula as the frozen constants below; no line-of-sight test (always clear), plain eye, plain why-line. */
const K = {
  fov:100, range:{ lit:12, dark:6 }, base:{ stand:55, crouch:22 }, falloff:0.75,
  still:0.7, walkRef:1.55, moveMin:1.0, moveMax:3.4, stillV:0.3, sprintV:4.2,
  noise:{ gain:45, sneak:1.0, normal:2.5, sprint:9.0, tallMul:0.5 },
  crowd:{ near:1.7, seg:1.2, minWatcher:3, maxV:3.2 },
  close:{ dist:1.2, gain:40 },
  grace:{ after:2, secs:0.5, mul:0.5 },
  decay:8, levels:{ notice:35, exit:15, alarm:100 }, alarmHold:6, evadeBelow:5,
  glance:{ max:35 * Math.PI / 180, speed:2, hold:2 },
  pace:{ story:0.6, standard:1, hard:1 }, greyman:0.65,
  target:{ stand:1.45, crouch:0.80 }, seenEvery:10,
};
const segDist = (px, pz, ax, az, bx, bz) => {
  const vx = bx - ax, vz = bz - az, L2 = vx * vx + vz * vz || 1e-9;
  const t = clamp(((px - ax) * vx + (pz - az) * vz) / L2, 0, 1);
  return Math.hypot(px - (ax + t * vx), pz - (az + t * vz));
};
const W = [];
let zones = [], lights = { ambient:'lit', lamps:[] };
const lightAt = (x, z) => {
  for(const l of (lights.lamps || [])) if(Math.hypot(x - l[0], z - l[1]) <= l[2]) return 'lit';
  return lights.ambient || 'lit';
};
const placeAt = (x, z) => { for(const zn of zones){ const r = zn.rect; if(x >= r[0] && x <= r[1] && z >= r[2] && z <= r[3]) return zn; } return null; };
const rate = () => {
  const pace = (typeof SETTINGS !== 'undefined' && K.pace[SETTINGS.difficulty]) || 1;
  const gm = (V() && V12.has && V12.has('greyman')) ? K.greyman : 1;
  return pace * gm;
};
const posture = (crouch, gait) => crouch ? (gait === 'still' ? 'crouched' : 'creeping') : gait === 'sprint' ? 'running' : gait === 'still' ? 'standing' : 'walking';
// pure: the state a position would produce (no side effects)
function compute(w, P, crouch, v, vel, extra){
  const c = w.cfg, st = w.state, m = c.mesh, ex = +m.position.x || 0, ez = +m.position.z || 0;
  const dx = P.x - ex, dz = P.z - ez, d = Math.hypot(dx, dz);
  const yaw = (c.facing ? c.facing() : w.baseYaw) + (c.glance ? st.glance : 0);
  const fx = Math.sin(yaw), fz = Math.cos(yaw);
  const ang = d > 1e-3 ? Math.acos(clamp((dx * fx + dz * fz) / d, -1, 1)) * 180 / Math.PI : 0;
  const lit = c.light ? c.light(P.x, P.z) : lightAt(P.x, P.z);
  const R = (extra && extra.range) || (lit === 'dark' ? c.range.dark : c.range.lit);
  const inRange = d <= R, inCone = ang <= c.fov / 2;
  const still = v < K.stillV, gait = still ? 'still' : crouch ? 'sneak' : v < 2.2 ? 'walk' : v < 4.2 ? 'jog' : 'sprint';
  let los = 'none', cover = null;
  if(inRange && inCone){
    const L = TAC.sight.los(ex, ez, c.eyeH, P.x, P.z, crouch ? K.target.crouch : K.target.stand);
    los = L.clear ? 'clear' : (L.by || 'tall'); cover = L.name || null;
  }
  let crowd = false;
  if(c.crowd && d >= K.crowd.minWatcher && v <= K.crowd.maxV){
    for(const g of (c.crowd() || [])){
      const q = g && (g.position || (g.mesh && g.mesh.position)); if(!q || g.visible === false) continue;
      if(Math.hypot(q.x - P.x, q.z - P.z) > K.crowd.near) continue;
      if(segDist(q.x, q.z, ex, ez, P.x, P.z) > K.crowd.seg) continue;
      crowd = true; break;
    }
  }
  const att = c.attention ? clamp(+c.attention() || 0, 0, 1) : 1;
  const rk = rate() * (c.gain || 1);
  const parts = { sight:0, noise:0, close:0, rush:0 };
  const seen = inRange && inCone && los === 'clear' && !crowd;
  if(seen){
    const gm = still ? K.still : clamp(v / K.walkRef, K.moveMin, K.moveMax);
    parts.sight = (crouch ? K.base.crouch : K.base.stand) * (1 - K.falloff * d / R) * gm * att * rk;
    if(extra && extra.grace) parts.sight *= K.grace.mul;
  }
  if(c.rush && inRange && inCone && los !== 'tall' && d < c.rush.dist){
    const closing = -(vel.x * dx + vel.z * dz) / Math.max(d, 1e-3);
    if(closing > c.rush.speed) parts.rush = c.rush.gain * att * rk;
  }
  const r = still ? 0 : crouch ? K.noise.sneak : v > K.sprintV ? K.noise.sprint : K.noise.normal;
  if(r > 0 && d < r) parts.noise = K.noise.gain * (1 - d / r) * (c.hearing == null ? 1 : c.hearing) * rk;
  if(d < K.close.dist && !(crouch && still)) parts.close = K.close.gain * rk;
  let cause = null, top = 0;
  for(const k of ['sight', 'rush', 'noise', 'close']) if(parts[k] > top){ top = parts[k]; cause = k === 'rush' ? 'sight' : k; }
  const zn = placeAt(P.x, P.z);
  return { dist:+d.toFixed(2), angle:Math.round(ang), inCone, inRange, los, cover, crouch, gait, speed:+v.toFixed(2), lit, crowd,
           seen, heard:parts.noise > 0, parts, gain:parts.sight + parts.noise + parts.close + parts.rush, cause, place:zn ? zn.name : null };
}
const why = (w, s, past) => {
  const He = w.cfg.he || 'He', he = He.toLowerCase();
  if(s.cause === 'close') return "You were within arm's reach";
  if(s.cause === 'noise') return `${He} ${past ? 'heard' : 'can hear'} you ${posture(s.crouch, s.gait)}${w.cfg.surface ? ' ' + w.cfg.surface : ''}`;
  if(s.cause === 'sight') return `${He} ${past ? 'saw' : 'can see'} you ${s.place ? s.place + ', ' : Math.round(s.dist) + ' m away, '}${s.crouch ? 'crouched' : 'standing'}`;
  return s.why || '';
};
const extra = w => { try{ return w.cfg.logExtra ? (w.cfg.logExtra() || {}) : {}; }catch(e){ TAC._err(e); return {}; } };
const logSeen = (w, level, s, causeOverride, whyText) => {
  const now = Date.now(), k = level;
  if(w._lastSeen[k] && now - w._lastSeen[k] < K.seenEvery * 1000 && !causeOverride) return;
  w._lastSeen[k] = now;
  const P = TAC.player.pos() || { x:0, z:0 };
  try{ V() && V12.log && V12.log('seen', { who:w.cfg.id, enc:w.cfg.enc || null, level, cause:causeOverride || s.cause, dist:s.dist, ang:s.angle, los:s.los,
    cover:s.cover, crouch:s.crouch, gait:s.gait, lit:s.lit, crowd:s.crowd, inCone:s.inCone,
    parts:{ sight:Math.round(w._acc.sight), noise:Math.round(w._acc.noise), close:Math.round(w._acc.close) },
    peak:Math.round(w.state.peak), ms:w._firstGain ? now - w._firstGain : 0, why:whyText || w.state.why, place:s.place,
    px:+P.x.toFixed(1), pz:+P.z.toFixed(1), obj:(S.game.objectives || []).find(o => !o.done) ? (S.game.objectives || []).find(o => !o.done).id : null,
    ...extra(w) }); }catch(e){ TAC._err(e); }
};
function levelFrom(w, v, prev){
  const L = w.levels;
  if(v >= L.alarm) return 'alarm';
  if(prev === 'alarm') return v >= L.exit ? 'notice' : 'calm';
  if(prev === 'notice') return v < L.exit ? 'calm' : 'notice';
  return v >= L.notice ? 'notice' : 'calm';
}
function step(w, dt){
  const c = w.cfg, st = w.state;
  const ok = (!c.active || c.active()) && TAC.geo.ready() && c.mesh && c.mesh.position && c.mesh.visible !== false;
  st.active = !!ok; if(!ok) return;
  const P = TAC.player.pos(); if(!P) return;
  const v = TAC.player.speed(), vel = TAC.player.vel(), crouch = TAC.player.crouch();
  const grace = w._unseenT >= K.grace.after && w._graceT < K.grace.secs;
  const s = compute(w, P, crouch, v, vel, { grace });
  Object.assign(st, s);
  if(s.seen){ w._graceT += dt; w._unseenT = 0; } else { w._unseenT += dt; if(w._unseenT >= K.grace.after) w._graceT = 0; }
  const prev = st.level;
  if(s.gain > 0){
    if(!w._firstGain) w._firstGain = Date.now();
    st.susp = Math.min(100, st.susp + s.gain * dt);
    for(const k of ['sight', 'noise', 'close']) w._acc[k] += (s.parts[k] + (k === 'sight' ? s.parts.rush : 0)) * dt;
  } else if(prev !== 'alarm'){
    st.susp = Math.max(0, st.susp - K.decay * dt);
  }
  if(prev === 'alarm'){ w._alarmT += dt; if(!s.seen && w._alarmT >= (c.alarmHold || K.alarmHold)){ st.susp = Math.min(st.susp, w.levels.alarm - 1); } }
  st.peak = Math.max(st.peak, st.susp);
  if(!w._frozenWhy || Date.now() > w._frozenWhy) st.why = s.cause ? why(w, s, false) : st.why;
  const lv = levelFrom(w, st.susp, prev);
  if(lv !== prev){
    st.level = lv;
    if(lv === 'notice' && prev === 'calm'){ w._noticeAt = Date.now(); w._crouchT = 0; w._drainT = 0; logSeen(w, 'notice', s); }
    if(lv === 'alarm'){ w._alarmT = 0; st.why = st.whyPast = why(w, s, true); w._frozenWhy = Date.now() + 8000; logSeen(w, 'alarm', s); }
    if(lv === 'calm' && prev === 'notice'){
      if(!w._quiet && !w._hadAlarm) try{ V() && V12.log && V12.log('evaded', { who:c.id, enc:c.enc || null, peak:Math.round(st.peak),
        secs:+(((Date.now() - (w._noticeAt || Date.now())) / 1000)).toFixed(1), how:w._how || 'distance', crouchPct:w._drainT ? Math.round(w._crouchT / w._drainT * 100) : 0, ...extra(w) }); }catch(e){ TAC._err(e); }
      w._quiet = false; w._hadAlarm = false; st.peak = st.susp; w._acc = { sight:0, noise:0, close:0 }; w._firstGain = 0;
    }
    if(lv === 'alarm') w._hadAlarm = true;
    if(c.onLevel) try{ c.onLevel(lv, st); }catch(e){ TAC._err(e); }
  }
  if(st.level === 'notice' && s.gain === 0){
    w._drainT += dt; if(crouch) w._crouchT += dt;
    w._how = s.crowd ? 'crowd' : (s.inRange && s.inCone && s.los !== 'clear') ? 'cover' : !s.inRange ? (s.lit === 'dark' ? 'dark' : 'distance') : 'cone';
  }
  // glance: the module only computes it; the owner turns the rig (rotation = facing() + state.glance)
  if(c.glance){
    if(lv === 'notice' && prev === 'calm'){
      const base = c.facing ? c.facing() : w.baseYaw, want = Math.atan2(P.x - c.mesh.position.x, P.z - c.mesh.position.z);
      let dd = want - base; while(dd > Math.PI) dd -= 2 * Math.PI; while(dd < -Math.PI) dd += 2 * Math.PI;
      w._glanceTo = clamp(dd, -K.glance.max, K.glance.max); w._glanceHold = K.glance.hold;
    }
    if(w._glanceHold > 0) w._glanceHold -= dt; else w._glanceTo = 0;
    const dg = w._glanceTo - st.glance; st.glance += clamp(dg, -K.glance.speed * dt, K.glance.speed * dt);
  }
}
function hud(){
  if(typeof setEye !== 'function') return;
  const busy = (typeof TAIL !== 'undefined' && TAIL.active) || mission() === 'm0' || (document.body && document.body.classList.contains('v12-car'));
  if(busy) return;
  // the kernel's own watchers only: once tac_sight.js replaces TAC.sight, this list stays empty and A's HUD owns the eye
  let t = null; for(const w of W){ if(!w.state.active || w.cfg.hud === false) continue; if(!t || w.state.susp > t.susp) t = w.state; }
  if(t && t.susp > 0.5){ setEye(t.susp / 100, t.seen ? 'look' : null); TAC._eyeOn = true; }
  else if(TAC._eyeOn){ setEye(null); TAC._eyeOn = false; }
}
TAC.sight = {
  full:false,   // true once tac_sight.js has loaded (line of sight, grace, places, why grammar, HUD, marker)
  K,
  rate,
  watch(cfg){
    const c = Object.assign({ he:'He', eyeH:1.6, fov:K.fov, range:{ lit:K.range.lit, dark:K.range.dark }, hearing:1, gain:1,
      glance:true, marker:true, hud:true, rush:null, alarmHold:K.alarmHold }, cfg || {});
    const w = { cfg:c, baseYaw:c.mesh && c.mesh.rotation ? +c.mesh.rotation.y || 0 : 0,
      levels:Object.assign({}, K.levels, c.levels || {}), _lastSeen:{}, _acc:{ sight:0, noise:0, close:0 }, _unseenT:99, _graceT:0,
      _alarmT:0, _glanceTo:0, _glanceHold:0, _quiet:false, _hadAlarm:false, _drainT:0, _crouchT:0, _firstGain:0,
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
        if(o.why){ st.why = o.why; if(st.susp >= w.levels.alarm) st.whyPast = o.why; w._frozenWhy = Date.now() + 3000; }
        if(o.quiet) w._quiet = true;
        const lv = st.susp >= w.levels.alarm ? 'alarm' : st.susp >= w.levels.notice ? 'notice' : (prev === 'calm' ? 'calm' : (st.susp >= w.levels.exit ? 'notice' : 'calm'));
        if(lv !== prev){
          st.level = lv;
          if(lv === 'alarm') w._hadAlarm = true;
          if(lv === 'calm'){ w._quiet = false; w._hadAlarm = false; st.peak = st.susp; }
          if(o.cause && (lv === 'notice' || lv === 'alarm')){ if(lv === 'notice') w._noticeAt = Date.now(); logSeen(w, lv, st, o.cause, o.why || st.why); }
          if(c.onLevel) try{ c.onLevel(lv, st); }catch(e){ TAC._err(e); }
        }
      },
      unwatch(){ const i = W.indexOf(w); if(i >= 0) W.splice(i, 1); },
    };
    w.handle = h;
    return h;
  },
  los(ax, az, ah, bx, bz, bh){ return { clear:true, by:null, name:null }; },
  probe(id, x, z, o){
    o = o || {}; const w = W.find(q => q.cfg.id === id); if(!w) return null;
    const v = o.speed != null ? o.speed : ({ still:0, sneak:1.25, walk:1.55, jog:3.0, sprint:5.2 })[o.gait || 'still'];
    return compute(w, { x, z }, !!o.crouch, v, o.vel || { x:0, z:0 }, { range:o.range });
  },
  zones(list){ zones = (list || []).slice(); },
  lights(o){ lights = Object.assign({ ambient:'lit', lamps:[] }, o || {}); },
  top(){ let best = null; for(const w of W){ if(!w.state.active || w.cfg.hud === false) continue; if(!best || w.state.susp > best.susp) best = w.state; } return best; },
  watchers(){ return W.map(w => w.handle); },
};
TAC.onTick(dt => { for(const w of W.slice()){ try{ step(w, dt); }catch(e){ TAC._err(e); } } hud(); }, { order:0 });
TAC.onScene(() => { W.length = 0; zones = []; lights = { ambient:'lit', lamps:[] }; if(TAC._eyeOn && typeof setEye === 'function'){ setEye(null); TAC._eyeOn = false; } }, { order:-10 });
})();
