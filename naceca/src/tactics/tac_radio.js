/* =========================================================================
   NACECA · src/tactics/tac_radio.js — radio priority, expiry and preemption, built only from wraps
   Owner: Team A (foundations). DESIGN-tactics.md §5.6, §2.1 F-B1/F-M2; foundations.md §1e.

   Nothing is replaced (F-B1): radioLine, _radioNext and clearRadio are wrapped outermost and every
   line still renders through the original _radioNext chain, so v12_night's OVERHEARD relabel
   (v12_night.js:240) and v12_vo's radio voice-over (v12_vo.js:90) keep running.

   · Ordering. Callers without opts are classed only for order: RADIO_STATION 0, "SGT. UCHE…" 2,
     everything else 1; FIFO within a class; they never expire and are never dropped.
   · Keyed lines (opts.key): a queued line with the same key is replaced; only lines with opts.ttl
     expire (dropped at dequeue); at most 4 keyed lines wait (the oldest of the lowest priority goes).
   · Preemption: a pri-3 line cuts a lower showing line — at once if that line is keyed, otherwise once
     it has been up 1.2 s. The base timer can't be cancelled, so the cut swaps #radio-sub for a fresh
     element (the stale timer's remove('show') hits the detached one), records a stale token at the cut
     line's predicted end, and swallows the one timer call that token predicts. V12.stopVO() on a cut.
     A cut text or story line is re-queued at the head of its class; cut news is dropped; a cut keyed
     line is dropped and logged 'preempted'.
   · Telemetry: radio{key, pri, speaker, outcome:'shown'|'dropped'|'replaced'|'cancelled'|'preempted', waitMs}
     for keyed lines only.
   ========================================================================= */
(function(){
'use strict';
const TAC = window.TAC;
if(!TAC || !TAC.v || !TAC.radio || TAC.radio._real) return;
if(typeof RADIO === 'undefined' || typeof radioLine !== 'function' || typeof _radioNext !== 'function') return;
const V = () => window.V12 || null;
const wrap = (name, make) => (V() && V12.wrap) ? V12.wrap(name, make) : false;
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
const STATION = () => (typeof RADIO_STATION === 'string' ? RADIO_STATION : 'WAVE24 RADIO 101.9 FM');
const CUT_AFTER = 1200, GAP = 260, CAP = 4;

const classify = speaker => {
  const s = String(speaker || '');
  if(s === STATION()) return 0;
  if(/^SGT\. UCHE/.test(s)) return 2;
  return 1;
};
const meta = it => it && (it._tac || (it._tac = { pri:classify(it.speaker), key:null, ttl:null, t0:now(), exp:null }));
const ms = () => TAC._ms || null;
const log = (it, outcome) => {
  const m = meta(it); if(!m || m.key == null) return;
  try{ if(V() && V12.log) V12.log('radio', { key:m.key, pri:m.pri, speaker:String(it.speaker || '').slice(0, 40), outcome, waitMs:Math.round(now() - m.t0) }); }catch(e){ TAC._err(e); }
};

// what is on screen now, the timer calls we must swallow, and whether a call is ours (direct) or a timer's
const R = { cur:null, stale:[], direct:0, pend:null, cutT:null };
TAC._radio = R;

/* ---------- queue helpers ---------- */
const Q = () => RADIO.queue;
function insertByPri(it){
  const q = Q(), p = meta(it).pri;
  let i = q.indexOf(it); if(i >= 0) q.splice(i, 1);
  i = q.findIndex(x => meta(x).pri < p);
  if(i < 0) q.push(it); else q.splice(i, 0, it);
}
function insertHeadOfClass(it){
  const q = Q(), p = meta(it).pri;
  const i = q.findIndex(x => meta(x).pri <= p);
  if(i < 0) q.push(it); else q.splice(i, 0, it);
}
function capKeyed(){
  const q = Q();
  let keyed = q.filter(x => meta(x).key != null);
  while(keyed.length > CAP){
    const lo = Math.min(...keyed.map(x => meta(x).pri));
    const victim = keyed.find(x => meta(x).pri === lo);      // the oldest of the lowest priority
    q.splice(q.indexOf(victim), 1); log(victim, 'dropped'); if(ms()) ms().radio.dropped++;
    keyed = q.filter(x => meta(x).key != null);
  }
}
function swapStrip(){
  const old = document.getElementById('radio-sub');
  if(!old || !old.parentNode) return;
  const fresh = document.createElement('div');
  fresh.id = 'radio-sub';
  const cls = String(old.className || '').split(/\s+/).filter(c => c && c !== 'show');
  if(cls.length) fresh.className = cls.join(' ');
  old.classList.remove('show');
  old.parentNode.replaceChild(fresh, old);
}
const callNext = () => { R.direct++; try{ _radioNext(); } finally { R.direct--; } };

/* ---------- the cut ---------- */
function cut(outcome){
  const c = R.cur; if(!c) return false;
  clearTimeout(R.cutT); R.cutT = null;
  swapStrip();
  R.stale.push({ at:c.end });
  try{ if(V() && V12.stopVO) V12.stopVO(); }catch(e){ TAC._err(e); }
  const it = c.item, m = meta(it);
  R.cur = null;
  if(outcome === 'cancelled'){ log(it, 'cancelled'); }
  else {
    if(ms()) ms().radio.preempted++;
    if(m.key != null) log(it, 'preempted');             // a keyed line is dropped
    else if(m.pri === 0){ if(ms()) ms().radio.dropped++; }   // news is dropped
    else insertHeadOfClass(it);                           // a text or story line comes back first in its class
  }
  callNext();
  return true;
}
const urgentWaiting = () => { const h = Q()[0], m = h && meta(h); return !!(m && m.pri >= 3 && !(m.exp && now() > m.exp)); };
function considerCut(){
  const c = R.cur; if(!c || !RADIO.busy || !urgentWaiting()) return;
  const m = meta(c.item); if(m.pri >= 3) return;
  const up = now() - c.shownAt;
  if(m.key != null || up >= CUT_AFTER){ cut('preempted'); return; }
  clearTimeout(R.cutT);
  const item = c.item;
  R.cutT = setTimeout(() => { R.cutT = null; try{ if(R.cur && R.cur.item === item) considerCut(); }catch(e){ TAC._err(e); } }, CUT_AFTER - up + 5);
}

/* ---------- radioLine(speaker, text, ms, opts) ---------- */
wrap('radioLine', orig => function(speaker, text, msArg, opts){
  const o = (opts && typeof opts === 'object') ? opts : null, t = now();
  const m = { pri:(o && o.pri != null) ? Math.max(0, Math.min(3, Math.round(+o.pri) || 0)) : classify(speaker),
    key:(o && o.key != null) ? String(o.key) : null, ttl:(o && +o.ttl > 0) ? +o.ttl : null, t0:t, exp:null };
  if(m.ttl) m.exp = t + m.ttl;
  try{
    if(m.key != null){
      const q = Q();
      for(let i = q.length - 1; i >= 0; i--) if(meta(q[i]).key === m.key){ const old = q.splice(i, 1)[0]; log(old, 'replaced'); }
    }
  }catch(e){ TAC._err(e); }
  const q = Q(), n0 = q.length;
  R.pend = m; R.direct++;
  let r;
  try{ r = orig.apply(this, arguments); } finally { R.direct--; R.pend = null; }
  try{
    if(q.length > n0){ const it = q[q.length - 1]; if(!it._tac) it._tac = m; insertByPri(it); }
    capKeyed();
    if(m.pri >= 3) considerCut();
  }catch(e){ TAC._err(e); }
  return r;
});

/* ---------- _radioNext: swallow a stale timer call, drop expired keyed lines, then the original chain ---------- */
wrap('_radioNext', orig => function(){
  const t = now();
  try{
    if(!R.direct && R.stale.length){
      const i = R.stale.findIndex(s => t >= s.at - 25);
      if(i >= 0){
        R.stale.splice(i, 1);
        if(RADIO.busy && R.cur){
          if(R.cur.end - t > 100) return;                           // the cut line's timer: the line on screen keeps its time
          R.stale.push({ at:R.cur.end });                           // the two timers met: advance now, and swallow the line's own call instead
        }
      }
    }
    const q = Q();
    while(q.length){ const m = meta(q[0]); if(m.exp && t > m.exp){ const it = q.shift(); log(it, 'dropped'); if(ms()) ms().radio.dropped++; } else break; }
    if(q[0] && !q[0]._tac && R.pend) q[0]._tac = R.pend;
  }catch(e){ TAC._err(e); }
  const head = Q()[0];
  const r = orig.apply(this, arguments);
  try{
    if(RADIO.busy && head && Q()[0] !== head){
      R.cur = { item:head, shownAt:t, end:t + (+head.ms || 0) + GAP };
      if(ms()) ms().radio.shown++;
      log(head, 'shown');
      if(urgentWaiting()) considerCut();
    } else if(!RADIO.busy){ R.cur = null; }
  }catch(e){ TAC._err(e); }
  return r;
});

/* ---------- clearRadio: also tokens the pending timer, so it can't cut the next line short ---------- */
wrap('clearRadio', orig => function(){
  const c = R.cur, busy = RADIO.busy;
  try{ for(const it of Q()) if(meta(it).key != null) log(it, 'cancelled'); }catch(e){ TAC._err(e); }
  const r = orig.apply(this, arguments);
  try{
    clearTimeout(R.cutT); R.cutT = null;
    if(busy && c){ R.stale.push({ at:c.end }); swapStrip(); }
    R.cur = null;
  }catch(e){ TAC._err(e); }
  return r;
});

/* ---------- the API (DESIGN §3.3) ---------- */
TAC.radio.say = (speaker, text, o) => {
  o = Object.assign({ pri:3, ttl:6000 }, o || {});
  if(typeof radioLine === 'function') radioLine(speaker, text, o.ms, o);
};
TAC.radio.cancel = key => {
  if(key == null) return;
  key = String(key);
  try{
    const q = Q();
    for(let i = q.length - 1; i >= 0; i--) if(meta(q[i]).key === key){ const it = q.splice(i, 1)[0]; log(it, 'cancelled'); }
    if(R.cur && meta(R.cur.item).key === key) cut('cancelled');
  }catch(e){ TAC._err(e); }
};
TAC.radio._classify = classify;
TAC.radio._real = true;
TAC.radio.full = true;
})();
