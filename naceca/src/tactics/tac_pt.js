/* =========================================================================
   NACECA · src/tactics/tac_pt.js — the playtest kit's logger layer (Team D)
   Loads right after the kernel and the analyser, before every other tactics
   file. It edits no existing file: everything here is a wrap of a public
   function or property (DESIGN-tactics.md §2.4 T-B1, §4, §7.D).

   - an OUTER V12.log wrapper (V12.log is looked up at call time, so every
     later emitter goes through it): d.p (the player label), d.ps (play
     seconds since this player's NEW PLAYER), per-type ceilings with a
     pt_dropped tally, coalescing (d.rep), a size guard (trunc:true) and the
     payload enrichments of §4 (session, obj_done, stuck, chase_end,
     interact_result, survey, away, blocked);
   - NEW PLAYER (two taps) with a 4-character device id, a two-tap CLEAR,
     a .txt share export with a .json fallback, per-player export;
   - the Player and Summary rows in Settings › PLAYTEST (only with a label
     or ?pt=1);
   - seen_read (D's own measurement of the frozen alarm line on screen),
     ov_dwell (time on investigation screens), orient (touch rotation).
   Players see nothing new during play.
   ========================================================================= */
(function(){
'use strict';
const V12 = window.V12;
if(!V12 || typeof V12.log !== 'function' || !V12._ptState || V12.ptKit) return;
const PT = V12._ptState;                     // v12_pt's public state (play ms, totals, the interaction in flight)
const LOG_KEY = 'naceca_pt_v1', PLAYER_KEY = 'naceca_pt_player';

/* ---------- small helpers ---------- */
const r1 = n => Math.round(n * 10) / 10;
const clip = (s, n) => { s = String(s == null ? '' : s).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
const touch = () => !!(document.body && document.body.classList.contains('touch-active'));
const orient = () => (window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
const ptParam = () => { try{ return new URLSearchParams(location.search).get('pt') === '1'; }catch(e){ return false; } };
const mission = () => { try{ return (typeof S !== 'undefined' && S.game) ? S.game.currentMission || null : null; }catch(e){ return null; } };
const objs = () => { try{ return (typeof S !== 'undefined' && S.game && S.game.objectives) || []; }catch(e){ return []; } };
const curObj = () => { const o = objs().find(x => !x.done); return o ? o.id : null; };
const objText = id => { const o = objs().find(x => x.id === id); return o ? clip(o.text, 48) : null; };
const ppos = () => { try{ const p = typeof ENGINE !== 'undefined' && ENGINE.player && ENGINE.player.position; return p ? { x:+p.x || 0, z:+p.z || 0 } : null; }catch(e){ return null; } };
const wayLabel = () => { try{ const t = window.WAY && WAY.resolve && WAY.resolve(); return t && t.label ? clip(t.label, 48) : null; }catch(e){ return null; } };
const chasing = () => { try{ return !!((typeof CHASE !== 'undefined' && CHASE.active) || (window.TAC && TAC.state && TAC.state.pursuit)); }catch(e){ return false; } };
const shownIds = () => [...document.querySelectorAll('.overlay.show')].map(e => e.id).filter(Boolean);
const settingsNow = () => { try{ return { marker:SETTINGS.marker, hints:SETTINGS.hints, difficulty:SETTINGS.difficulty, timed:SETTINGS.timed,
  casework:(typeof gameDifficulty === 'function' ? gameDifficulty() : null), crouch:SETTINGS.crouch || null }; }catch(e){ return null; } };

let RD = null, eyeObs = null, eyeEl = null, frameOff = null;   // the seen_read in progress (below)

/* ---------- the player and the device id (naceca_pt_player: {label, at, dev, ps}; survives reloads and CLEAR) ----------
   ps is "play seconds since this player's NEW PLAYER", also across reloads: PT.play restarts with every page load
   (v12_pt.js), so the player's seconds so far are stored with the label (on the 20 s tick, on hidden and on pagehide)
   and this page's play time counts on from them. */
const P = { label:null, at:null, dev:null, base:0 };   // base: the PT.play value at which this player's ps was 0
try{ const j = JSON.parse(localStorage.getItem(PLAYER_KEY) || 'null'); if(j && typeof j === 'object'){ P.label = j.label || null; P.at = j.at || null; P.dev = j.dev || null;
  if(P.label && typeof j.ps === 'number' && isFinite(j.ps) && j.ps > 0) P.base = (+PT.play || 0) - j.ps * 1000; } }catch(e){}
const savePlayer = () => { try{ localStorage.setItem(PLAYER_KEY, JSON.stringify({ label:P.label, at:P.at, dev:P.dev, ps:P.label ? ps() : 0 })); }catch(e){} };
const DEV_CH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function devId(){
  if(P.dev && /^[A-Z0-9]{4}$/.test(P.dev)) return P.dev;
  let s = ''; for(let i = 0; i < 4; i++) s += DEV_CH[Math.floor(Math.random() * DEV_CH.length)];
  P.dev = s; savePlayer(); return s;
}
const ps = () => Math.max(0, Math.round(((+PT.play || 0) - P.base) / 1000));
const nextLabel = l => 'P' + ((+(String(l || 'P0').replace(/\D/g, '')) || 0) + 1);

/* ---------- the outer V12.log wrapper ---------- */
const CEIL = { interact_miss:300, blocked:200, js_error:30, seen:80, seen_read:60, evaded:60, radio:150, orient:30, interact_result:800 };
const CEIL_OTHER = 600;
const exempt = t => t === 'survey' || t === 'session' || t === 'enc' || /^pt_/.test(t) || /^mission_/.test(t) || /_summary$/.test(t);
const COALESCE = {
  interact_miss:{ key:d => d.near + '|' + d.why, ms:1500 },
  blocked:{ key:d => d.big + '|' + d.small, ms:5000 },
  js_error:{ key:d => d.msg + '|' + d.line, ms:5000 },
};
const MAX = { survey:4000, pt_player:4000 }, MAX_CHARS = 1500;
const inner = V12.log;                       // v12_pt's wrapper (adds dev) over the private store
const stored = {}, dropped = {}; let droppedSig = '{}';
let pending = null;                          // one coalescing slot: {type, key, d, rep, t0, timer}
let blockedN = 0;                            // blocked events seen (BACK TO THE TABLE must not double-log)
const seenBy = {};                           // objective id → {alarm, notice} while it was current

const sizeOf = (type, d) => JSON.stringify({ t:1e12, sid:'xxxxxxxxxxxx', type, m:mission(), d:Object.assign({ dev:'touch' }, d) }).length;
function guard(type, d){
  const max = MAX[type] || MAX_CHARS;
  if(sizeOf(type, d) <= max) return d;
  const keep = type === 'survey' ? ['satisfying', 'unfair'] : [];
  const cut = (v, s, a, depth) => {
    if(typeof v === 'string') return v.length > s ? v.slice(0, s) : v;
    if(Array.isArray(v)){ const o = v.slice(0, a).map(x => cut(x, s, a, depth + 1)); if(v.length > a) o.push('+' + (v.length - a)); return o; }
    if(v && typeof v === 'object'){ if(depth > 5) return null; const o = {}; for(const k of Object.keys(v)) o[k] = cut(v[k], s, a, depth + 1); return o; }
    return v;
  };
  const pass = (s, a) => { const o = {}; for(const k of Object.keys(d)) o[k] = keep.includes(k) ? d[k] : cut(d[k], s, a, 0); o.trunc = true; return o; };
  let o = pass(200, 24);
  if(sizeOf(type, o) > max) o = pass(60, 8);
  if(sizeOf(type, o) > max) o = pass(40, 4);
  // still over: blank the largest fields one by one (the key stays, its value becomes null, its name goes in cut)
  // until it fits, so a summary keeps every other value
  if(sizeOf(type, o) > max){
    const gone = [];
    for(let i = 0; i < 40 && sizeOf(type, o) > max; i++){
      let big = null, bs = 8;
      for(const k of Object.keys(o)){ if(k === 'trunc' || k === 'cut' || keep.includes(k) || o[k] == null) continue; const n = JSON.stringify(o[k]).length; if(n > bs){ bs = n; big = k; } }
      if(!big) break;
      o[big] = null; gone.push(big); o.cut = gone.slice(0, 12);
    }
  }
  if(sizeOf(type, o) > max){ o = { trunc:true, keys:Object.keys(d).slice(0, 24) }; for(const k of ['p', 'ps', 'rep', 'who', 'enc', 'level', 'cause', 'obj']) if(d[k] != null && typeof d[k] !== 'object') o[k] = clip(d[k], 60); }
  return o;
}
function emit(type, d){
  const cap = exempt(type) ? Infinity : (CEIL[type] || CEIL_OTHER);
  if((stored[type] || 0) >= cap){ dropped[type] = (dropped[type] || 0) + (d.rep || 1); return false; }
  stored[type] = (stored[type] || 0) + 1;
  try{ inner.call(V12, type, guard(type, d)); }catch(e){}
  return true;
}
function flushPending(){
  const p = pending; if(!p) return;
  pending = null; clearTimeout(p.timer);
  if(p.rep > 1) p.d.rep = p.rep;
  emit(p.type, p.d);
}
function logDropped(){
  const sig = JSON.stringify(dropped);
  if(sig === '{}' || sig === droppedSig) return;
  droppedSig = sig;
  V12.log('pt_dropped', { byType:JSON.parse(sig) });
}

// interact_result: a press that starts a chase is progress, not a refusal (DESIGN §4). Only a chase that started
// INSIDE the press (startChase during tryInteract, with no chase running before it) counts; only 'refused' is
// rewritten (noop stays noop); and v12_pt's refusal totals, already counted, are taken back.
let chaseStarts = 0, chaseStamp = null;
const presses = [];
function reclass(d){
  const i = presses.findIndex(p => p.label === d.label); if(i < 0) return;
  const p = presses.splice(i, 1)[0];
  if(!p.idle || !p.started) return;
  if(d.outcome === 'refused'){
    d.outcome = 'progress'; d.chase = true;
    try{ const t = PT.totals; if(t && t.refusals > 0) t.refusals--; if(PT.o && PT.o.refusals > 0) PT.o.refusals--; }catch(e){}
  } else if(d.outcome === 'progress' || d.outcome === 'opened') d.chase = true;
}
function enrich(type, d){
  switch(type){
    case 'session':
      d.ptv = 2; d.player = P.label || null; d.orient = orient(); d.slice = V12.PT_SLICE_END || null; d.tz = new Date().getTimezoneOffset();
      break;
    case 'obj_done': {
      const c = seenBy[d.id] || {}; delete seenBy[d.id];
      d.txt = objText(d.id); d.seen = c.alarm || 0; d.notices = c.notice || 0;
      break;
    }
    case 'stuck': {
      const p = ppos();
      d.txt = objText(d.obj); d.want = wayLabel(); d.px = p ? r1(p.x) : null; d.pz = p ? r1(p.z) : null;
      break;
    }
    case 'chase_end': {
      const s = chaseStamp;
      d.how = s ? s.how : (d.how == null ? null : d.how); d.by = s ? s.by : (d.by == null ? null : d.by);
      break;
    }
    case 'interact_result': reclass(d); break;
    case 'survey': if(d.secsPlayed != null) d.secsPlayed = ps(); break;
    case 'seen': {
      const id = d.obj || curObj(); if(!id) break;
      const c = seenBy[id] || (seenBy[id] = { alarm:0, notice:0 });
      if(d.level === 'alarm') c.alarm++; else if(d.level === 'notice') c.notice++;
      break;
    }
  }
}
const wrapped = function(type, data){
  let handled = false;
  try{
    type = String(type);
    const d = Object.assign({}, data || {});
    if(type === 'away' && chasing()) return;      // a runner pulling away is not the player walking off
    if(type === 'blocked') blockedN++;
    enrich(type, d);
    if(P.label) d.p = P.label;
    d.ps = ps();
    handled = true;                                // from here the event is ours to store (no second copy on an error)
    const co = COALESCE[type];
    if(co){
      const key = co.key(d), now = Date.now();
      if(pending && pending.type === type && pending.key === key && now - pending.t0 <= co.ms){ pending.rep++; return; }
      flushPending();
      pending = { type, key, d, rep:1, t0:now, timer:setTimeout(flushPending, co.ms + 20) };
      return;
    }
    flushPending();
    if(type === 'quit'){ endRead('quit'); logDropped(); if(P.label) savePlayer(); }
    if(type === 'seen' && d.level === 'alarm' && RD) endRead('replaced');   // a new alarm line replaces the one being read
    const ok = emit(type, d);
    if(ok && type === 'seen' && d.level === 'alarm') startRead(d);
  }catch(e){ if(!handled){ try{ return inner.apply(V12, arguments); }catch(_){} } }
};
wrapped._tacPt = true;
V12.log = wrapped;

// v12_pt's ptSummary reads the store: anything still in the coalescing slot goes in first
const sum0 = V12.ptSummary;
if(typeof sum0 === 'function') V12.ptSummary = function(){ flushPending(); return sum0.apply(this, arguments); };
const allEvents = () => {
  flushPending();
  if(typeof V12.ptEvents === 'function'){ try{ return V12.ptEvents() || []; }catch(e){} }
  try{ if(typeof sum0 === 'function') sum0(); }catch(e){}   // flushes v12_pt's private buffer into the key
  try{ return JSON.parse(localStorage.getItem(LOG_KEY) || '[]') || []; }catch(e){ return []; }
};
setInterval(() => { logDropped(); if(P.label) savePlayer(); }, 20000);
// on hidden: settle the slot, the read and the tally BEFORE v12_pt's own listener writes (window capture runs first)
window.addEventListener('visibilitychange', () => { try{ if(document.visibilityState !== 'hidden') return; flushPending(); endRead('quit'); logDropped(); if(P.label) savePlayer(); }catch(e){} }, true);
window.addEventListener('pagehide', () => { try{ if(P.label) savePlayer(); }catch(e){} });

/* ---------- chase_end how/by: an onCaught/onEscaped wrapper outside v12_pt's (DESIGN §3.5) ---------- */
V12.wrap('startChase', orig => function(){
  const c = orig.apply(this, arguments);
  try{
    if(c){
      chaseStarts++;
      const stamp = fn => function(){
        const prev = chaseStamp; chaseStamp = { how:c.how || null, by:c.by || null };
        try{ return typeof fn === 'function' ? fn.apply(this, arguments) : undefined; } finally { chaseStamp = prev; }
      };
      c.onCaught = stamp(c.onCaught); c.onEscaped = stamp(c.onEscaped);
    }
  }catch(e){}
  return c;
});
/* ---------- interact_result reclass: was a chase already running before the press? ---------- */
V12.wrap('tryInteract', orig => function(){
  let rec = null;
  try{
    const it = typeof nearestInteractable === 'function' ? nearestInteractable() : null;
    if(it){
      rec = { label:String(it.label || '').slice(0, 60), idle:!(typeof CHASE !== 'undefined' && CHASE.active), n0:chaseStarts, started:false };
      presses.push(rec);
      while(presses.length > 8) presses.shift();
    }
  }catch(e){}
  try{ return orig.apply(this, arguments); }
  finally{ if(rec) rec.started = chaseStarts > rec.n0; }   // the chase began during this press, not later
});
/* ---------- toasts: BACK TO THE TABLE is a refusal; the alarm line read in a toast ---------- */
V12.wrap('toast', orig => function(big, small){
  const n0 = blockedN, inside = !!PT.inInteract;
  const r = orig.apply(this, arguments);
  try{
    const b = String(big == null ? '' : big), sm = String(small == null ? '' : small).replace(/<[^>]+>/g, '');
    if(!inside && /^\s*BACK TO THE TABLE\s*$/i.test(b) && blockedN === n0) V12.log('blocked', { big:b.slice(0, 40), small:sm.slice(0, 80), obj:curObj() });
    readToast(sm);
  }catch(e){}
  return r;
});

/* ---------- ov_dwell: time on an investigation screen, logged when it closes ---------- */
const OV_SKIP = /^screen-(title|missions|controls|pause|settings|records|recap|newgame|pt-survey|pt-report|dialogue|aftermath|epilogue|car|news)$/;
const OV = new Map();                        // id → {t0, h0, obj}: when it was first seen open, the hidden ms then, the objective then
// time with the page hidden (the phone locked, another tab) is not time on a screen
let hidMs = 0, hidAt = null;
const hiddenNow = () => hidMs + (hidAt == null ? 0 : performance.now() - hidAt);
document.addEventListener('visibilitychange', () => { try{
  if(document.visibilityState === 'hidden'){ if(hidAt == null) hidAt = performance.now(); }
  else if(hidAt != null){ hidMs += performance.now() - hidAt; hidAt = null; }
}catch(e){} }, true);
function syncOverlays(){
  const now = performance.now(), shown = new Set(shownIds());
  for(const [id, o] of [...OV]){
    if(shown.has(id)) continue;
    OV.delete(id);
    if(RD) RD.ov0.delete(id);
    if(!OV_SKIP.test(id)) V12.log('ov_dwell', { id, secs:r1(Math.max(0, now - o.t0 - (hiddenNow() - o.h0)) / 1000), obj:o.obj });
  }
  for(const id of shown){
    if(OV.has(id)) continue;
    OV.set(id, { t0:now, h0:hiddenNow(), obj:curObj() });
    if(RD && !RD.ov0.has(id)) endRead('overlay');
  }
}
V12.wrap('showOverlay', orig => function(){ const r = orig.apply(this, arguments); try{ syncOverlays(); }catch(e){} return r; });

/* ---------- seen_read: how long the frozen alarm line was on screen (DESIGN §3.6, T-M6) ----------
   Starts when a seen {level:'alarm'} passes through the wrapper. Counts play-time ms while the line is
   visible under the eye (#eye-ind.show with .eye-why == why) or in the toast (toast(…, why) still up).
   Ends on: replaced, hidden, an overlay opening, a scene change, quit, or 8 s (timeout). */
const toastSmall = () => { const t = document.getElementById('toast'); const s = t && t.querySelector('.small'); return s ? s.textContent.trim() : null; };
const toastUp = () => { const t = document.getElementById('toast'); return !!(t && t.classList.contains('show')); };
const eyeLine = () => { const el = document.getElementById('eye-ind'); if(!el || !el.classList.contains('show')) return null; const w = el.querySelector('.eye-why'); return w ? w.textContent.trim() : ''; };
function watchEye(){
  const el = document.getElementById('eye-ind');
  if(!el || el === eyeEl || typeof MutationObserver !== 'function') return;
  if(eyeObs) eyeObs.disconnect();
  eyeEl = el;
  eyeObs = new MutationObserver(() => { try{ check(); }catch(e){} });
  eyeObs.observe(el, { attributes:true, attributeFilter:['class'], childList:true, subtree:true, characterData:true });
}
function startRead(d){
  if(RD) endRead('replaced');
  const why = String(d.why || '').replace(/<[^>]+>/g, '').trim();
  RD = { who:d.who || null, enc:d.enc || null, why, words:why ? why.split(/\s+/).length : 0, ms:0, age:0, t0:Date.now(),
    vis:false, everEye:false, everToast:false, toastOn:false, toastReplaced:false, ov0:new Set(shownIds()) };
  if(why && toastUp() && toastSmall() === why) RD.toastOn = true;   // raised just before the seen event
  watchEye();
  check();
}
function check(){
  const r = RD; if(!r) return;
  if(shownIds().some(id => !r.ov0.has(id))) return endRead('overlay');
  if(!r.why) return;
  const line = eyeLine(), eye = line === r.why, tst = r.toastOn && toastUp() && toastSmall() === r.why;
  if(eye) r.everEye = true;
  if(tst) r.everToast = true;
  const vis = eye || tst;
  if(r.vis && !vis) return endRead((line && line !== r.why) || r.toastReplaced ? 'replaced' : 'hidden');
  r.vis = vis;
}
function readToast(sm){
  const r = RD; if(!r) return;
  if(sm.trim() === r.why && r.why){ r.toastOn = true; r.toastReplaced = false; }
  else if(r.toastOn){ r.toastOn = false; r.toastReplaced = true; }
  check();
}
function endRead(end){
  const r = RD; if(!r) return;
  RD = null;
  // DESIGN §4: via is 'eye'|'toast'|'both'. A line that never reached the screen (no eye line, no toast: the kernel's
  // fallback eye, or a second alarm in the same tick) has no read to report, so nothing is logged and the analyser
  // stamps NO READ DATA for that alarm.
  if(!r.everEye && !r.everToast) return;
  const via = r.everEye && r.everToast ? 'both' : r.everEye ? 'eye' : 'toast';
  V12.log('seen_read', { who:r.who, enc:r.enc, ms:Math.round(r.ms), via, words:r.words, end });
}
function onFrame(dt){
  const r = RD; if(!r) return;
  if(!eyeEl || !eyeEl.isConnected) watchEye();
  check(); if(RD !== r) return;
  if(r.vis) r.ms += (+dt || 0) * 1000;
  r.age += +dt || 0;
  if(r.age >= 8) endRead('timeout');
}
// subscriptions are registered at scene build (kernel rule); a scene change ends a read
if(window.TAC && typeof TAC.onScene === 'function'){
  TAC.onScene(() => {
    try{ endRead('scene'); }catch(e){}
    if(frameOff){ try{ frameOff(); }catch(e){} frameOff = null; }
    if(typeof TAC.onFrame === 'function') frameOff = TAC.onFrame(onFrame, { order:50 });
  }, { order:50 });
}
setInterval(() => {
  try{ syncOverlays(); }catch(e){}
  try{ if(RD && Date.now() - RD.t0 > 20000) endRead('timeout'); }catch(e){}   // the world stopped (no frames): don't hold it forever
}, 1000);

/* ---------- orient: the phone rotated (touch only, 1.5 s debounce) ---------- */
let lastO = orient(), rzT = null;
window.addEventListener('resize', () => {
  clearTimeout(rzT);
  rzT = setTimeout(() => { try{
    const o = orient(); if(o === lastO) return;
    lastO = o;
    if(touch()) V12.log('orient', { o, w:window.innerWidth, h:window.innerHeight });
  }catch(e){} }, 1500);
});

/* ---------- NEW PLAYER, CLEAR, export ---------- */
function newPlayer(label){
  flushPending();
  label = String(label || nextLabel(P.label)).slice(0, 12);
  const prev = P.label, ps0 = Math.round((+PT.play || 0) / 1000);
  devId();
  P.label = label; P.at = Date.now(); P.base = +PT.play || 0; savePlayer();
  try{ const t = PT.totals; if(t){ t.misses = 0; t.refusals = 0; t.hints = 0; } }catch(e){}
  for(const k of Object.keys(seenBy)) delete seenBy[k];
  V12.log('pt_player', { label, dev:P.dev, prev:prev || null, ps0, w:window.innerWidth, h:window.innerHeight, touch:touch(), orient:orient(), settings:settingsNow() });
  return label;
}
function clearLog(){
  if(pending){ clearTimeout(pending.timer); pending = null; }
  RD = null;
  if(typeof V12.ptClearAll === 'function'){ try{ V12.ptClearAll(); }catch(e){} }
  else{
    try{ if(typeof sum0 === 'function') sum0(); }catch(e){}   // empties v12_pt's private buffer into the key first
    try{ localStorage.removeItem(LOG_KEY); }catch(e){}
  }
  for(const o of [stored, dropped]) for(const k of Object.keys(o)) delete o[k];
  droppedSig = '{}';
}
const pad = n => String(n).padStart(2, '0');
const stampOf = t => `${t.getFullYear()}${pad(t.getMonth() + 1)}${pad(t.getDate())}-${pad(t.getHours())}${pad(t.getMinutes())}`;
// ISO 8601 in the device's own time, with its offset (the CLI reads the device's zone from it)
const isoLocal = t => { const o = -t.getTimezoneOffset(), a = Math.abs(o);
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}T${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}${o >= 0 ? '+' : '-'}${pad(Math.floor(a / 60))}:${pad(a % 60)}`; };
// opts.player: export only that player's events (the player-scoped sheet). The File is built synchronously,
// with no await before navigator.share (iOS keeps the tap's user activation).
V12.ptExport = function(opts){
  opts = opts || {};
  const label = opts.player || null;
  const all = allEvents();
  const events = label ? all.filter(e => e && ((e.d && e.d.p) === label || e.p === label)) : all;
  const dev = devId();
  const json = JSON.stringify({ game:'naceca', ptv:2, build:V12.version || null, src:(window.NACECA_BUILD || {}).src || null,
    player:label, dev, exported:isoLocal(new Date()), events });
  const base = `naceca-playtest-${dev}-${String(label || 'ALL').replace(/[^A-Za-z0-9]/g, '') || 'ALL'}-${stampOf(new Date())}`;
  const note = (via, file) => { try{ V12.log('pt_export', { via, events:events.length, chars:json.length, file }); }catch(e){} };
  const save = () => {
    const name = base + '.json';
    let p; try{ p = typeof V12.saveFile === 'function' ? V12.saveFile(name, json) : 'failed'; }catch(e){ p = 'failed'; }
    return Promise.resolve(p).then(r => {
      const via = r === 'saved' ? 'claude' : (r || 'failed');
      note(via, name);
      if(via === 'failed' && typeof toast === 'function') toast('EXPORT FAILED', "Try again from the game's own page", 2200);
      return via;
    }, () => { note('failed', name); return 'failed'; });
  };
  if(touch() && navigator.share && navigator.canShare && typeof File === 'function'){
    let file = null, ok = false;
    try{ file = new File([json], base + '.txt', { type:'text/plain' }); ok = !!navigator.canShare({ files:[file] }); }catch(e){ ok = false; }
    if(ok){
      let p;
      try{ p = navigator.share({ files:[file], title:'NACECA playtest log' }); }catch(e){ return save(); }
      return Promise.resolve(p).then(() => { note('share', file.name); return 'share'; },
        err => { if(err && err.name === 'AbortError'){ note('declined', file.name); return 'declined'; } return save(); });
    }
  }
  return save();
};

/* ---------- Settings › PLAYTEST: the Player and Summary rows; CLEAR takes two taps ---------- */
function arm(btn, armed, idle){
  btn.dataset.armed = '1'; btn.textContent = armed; btn.classList.add('pt-armed');
  clearTimeout(btn._ptT);
  btn._ptT = setTimeout(() => { if(btn.isConnected){ btn.dataset.armed = ''; btn.textContent = idle; btn.classList.remove('pt-armed'); } }, 4000);
}
const esc = s => (typeof V12.esc === 'function' ? V12.esc(s) : String(s == null ? '' : s));
// where Settings was opened from: renderSettings runs inside openSettings BEFORE it records _settingsReturn
// (settings.js:213-216), so while Settings isn't up yet the screen showing now is where it returns to
function settingsFrom(){
  const sh = shownIds();
  if(sh.includes('screen-settings')){ try{ return typeof _settingsReturn !== 'undefined' ? _settingsReturn : null; }catch(e){ return null; } }
  return sh[0] || null;
}
function playerRows(body){
  const clear = body.querySelector('#pt-clear');
  if(clear){
    clear.onclick = () => {
      if(clear.dataset.armed !== '1'){ arm(clear, 'TAP AGAIN · CLEAR', 'CLEAR'); return; }
      clearLog();
      if(typeof renderSettings === 'function') renderSettings();
    };
  }
  if(!(P.label || ptParam())) return;
  const grp = [...body.querySelectorAll('.set-group')].find(g => g.textContent.trim() === 'PLAYTEST');
  if(!grp) return;
  let note = 'No player yet. Start one before you hand the device over.';
  if(P.label){
    const n = allEvents().filter(e => e && e.d && e.d.p === P.label).length;
    const at = P.at ? new Date(P.at) : null;
    note = `${esc(devId())}·${esc(P.label)} · ${n} event${n === 1 ? '' : 's'}${at ? ' since ' + pad(at.getHours()) + ':' + pad(at.getMinutes()) : ''}. Start a new player before you hand the device over.`;
  }
  const next = nextLabel(P.label);
  // the facilitator's short start replaces the game in progress: only on the facilitator's page (?pt=1), and only from the
  // title screen, never from the pause menu during play
  const m2ok = ptParam() && settingsFrom() === 'screen-title';
  const prow = V12.el('div', 'set-row pt-row', `<div class="set-label">Player<div class="set-note">${note}</div></div>
    <div class="set-ctl"><div class="seg"><button type="button" id="pt-new">NEW PLAYER</button>${m2ok ? '<button type="button" id="pt-m2">START AT M2</button>' : ''}</div></div>`);
  const srow = V12.el('div', 'set-row pt-row', `<div class="set-label">Summary<div class="set-note">Where they got lost, what failed, why they were seen, how they approached it.</div></div>
    <div class="set-ctl"><div class="seg"><button type="button" id="pt-view">VIEW</button></div></div>`);
  prow.dataset.key = 'pt_player'; srow.dataset.key = 'pt_summary';
  grp.after(prow); prow.after(srow);
  const nb = prow.querySelector('#pt-new');
  nb.onclick = () => {
    if(nb.dataset.armed !== '1'){ arm(nb, 'TAP AGAIN · START ' + next, 'NEW PLAYER'); return; }
    newPlayer(next);
    if(typeof renderSettings === 'function') renderSettings();
  };
  const m2 = prow.querySelector('#pt-m2');
  if(m2) m2.onclick = () => {
    if(m2.dataset.armed !== '1'){ arm(m2, 'TAP AGAIN · START AT M2', 'START AT M2'); return; }
    startAtM2();
  };
  srow.querySelector('#pt-view').onclick = () => { if(typeof V12.ptReportOpen === 'function') V12.ptReportOpen('player'); };
}
// the facilitator's short-session start (DESIGN §10): a fresh Senior Agent investigation with M0 and M1 done, at the
// market's start screen — the state the harness's h.start('m2', {completed:['m0','m1']}) uses, plus the one piece of
// evidence the cold open always leaves (co_madam, from prologueEnd, v12_core.js:319), so the M2 operations table has the
// same cards as after a full start. No M0/M1 XP or capabilities (the protocol says so). Like NEW INVESTIGATION, it
// replaces the game in progress and sets "Hints when stuck" for the casework (off: beta/casework.js, CW.hintsForNewGame);
// it is offered only on the title screen of a ?pt=1 page.
function startAtM2(){
  try{
    if(typeof v13NavReset === 'function') v13NavReset();
    S = defaultState(); S.game.difficulty = 'senior'; S.game.completedMissions = ['m0', 'm1'];
    if(Array.isArray(S.game.evidence) && !S.game.evidence.some(e => e && e.id === 'co_madam'))
      S.game.evidence.push({ id:'co_madam', name:"Courier's Dropped Phone — 'Tell Madam it's clean'", t:Date.now() });
    if(typeof syncDifficultyClass === 'function') syncDifficultyClass();
    const hints = (window.CW && typeof CW.hintsForNewGame === 'function') ? CW.hintsForNewGame('senior') : null;
    V12.log('new_game', hints ? { d:'senior', hints } : { d:'senior' });
    if(typeof showOverlay === 'function') showOverlay(null);
    if(typeof showHUD === 'function') showHUD(false);
    loadMission('m2');
  }catch(e){ console.warn('[pt] start at M2', e); }
}
V12.wrap('renderSettings', orig => function(){
  const r = orig.apply(this, arguments);
  try{ const body = document.getElementById('settings-body'); if(body) playerRows(body); }catch(e){ console.warn('[pt] settings rows', e); }
  return r;
});

/* ---------- the kit's own API (the sheet in tac_pt_report.js, the pt_* scenarios) ---------- */
V12.ptKit = {
  label:() => P.label,
  device:() => devId(),
  ps,
  events:allEvents,
  player:newPlayer,
  clear:clearLog,
  flush:() => { flushPending(); logDropped(); try{ if(typeof sum0 === 'function') sum0(); }catch(e){} },
  rowsShown:() => !!(P.label || ptParam()),
  reading:() => RD ? { who:RD.who, why:RD.why, ms:Math.round(RD.ms), vis:RD.vis } : null,
  CEIL, COALESCE:Object.keys(COALESCE), MAX_CHARS,
};
})();
