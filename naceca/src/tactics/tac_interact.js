/* =========================================================================
   NACECA · src/tactics/tac_interact.js — spent targets step aside; a press on nothing says why
   Owner: Team A (foundations). DESIGN-tactics.md §3.4, §5.5, §2.1 F-M4/F-M6; foundations.md §1a.

   · the default spent table, registered by label through TAC.interact.spent() (the kernel's
     nearestInteractable wrap re-runs the selection with the effective priority; nothing is mutated).
     B and C re-register the labels they own, with their own conditions, at their scene build.
   · the miss line: E / ACTION with nothing in reach shows, for 1.8 s,
       "Nothing in reach — <the tracker's text> is N m away"   (or without the distance when the tracker has none)
       "Move closer — <label>"   when a live, unspent target is within its range + 1.5 m
         (Senior Agent: only when that target IS the tracker's target, so nothing hidden is ever named)
     at most one per 4 s, an 8 ms tick on touch; never in a chase or tail, a staged action, an overlay,
     the car, the cold open, over a teaching hint, or during a scripted pursuit.
   ========================================================================= */
(function(){
'use strict';
const TAC = window.TAC;
if(!TAC || !TAC.v || TAC._interactA) return;
TAC._interactA = true;
const V = () => window.V12 || null;
const wrap = (name, make) => (V() && V12.wrap) ? V12.wrap(name, make) : false;
const eng = () => (typeof ENGINE !== 'undefined') ? ENGINE : null;
const G = () => (typeof S !== 'undefined' && S && S.game) ? S.game : {};
const mc = () => G().moralChoices || {};
const esc = s => (V() && V12.esc) ? V12.esc(s) : String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

/* ---------- the default spent table (DESIGN §3.4; the owning team re-registers its own labels) ----------
   Each default is scoped to the mission it was written for: the flags it reads outlive that mission in the save
   (_mansionPreBriefed stays true after M3, and "Brief with Sgt. Uche" is also the first objective of M5-M8). */
const inM = (m, fn) => it => TAC.mission() === m && fn(it);
const SPENT = {
  'Scan suspect phone':            inM('m2', () => !!G()._marketScanned),
  'Confront teen suspect':         inM('m2', () => !G()._marketScanned || !!mc().market_runner),      // B adds TAC.m2.run().resolving
  'Speak with Informant Tunde':    inM('m2', () => !!G()._marketTunde),
  'Plan the raid with Sgt. Uche':  inM('m3', () => !!G()._mansionPreBriefed),
  'Brief with Sgt. Uche':          inM('m3', () => !!G()._mansionPreBriefed),
  'Move on suspect':               inM('m3', () => !!mc().arrest),
  'Calm and escort the child':     inM('m3', () => !!G()._civChild),
  'Inspect laptop':                inM('m3', () => !!(G()._evLaptop || G()._wipeLost)),
  'Stop laptop wipe':              inM('m3', () => !!(G()._evLaptop || G()._wipeLost)),
  'Bag cash evidence':             inM('m3', () => !!G()._evCash),
  'Crack the safe':                inM('m3', () => !!G()._evSafe),
  'Search the open drawer':        inM('m3', () => !!G()._drawerSearched),
};
TAC._spentA = SPENT;
const register = () => { for(const k of Object.keys(SPENT)) TAC.interact.spent(k, SPENT[k]); };
// at every scene build (before the builder runs, so an owning team's later registration wins)
TAC.onScene(register, { order:-5 });
register();

/* ---------- the miss line ---------- */
const MISS = { at:-1e9, line:null, n:0 };
TAC._miss = MISS;
const isTouch = () => !!(document.body && document.body.classList.contains('touch-active'));
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
function suppressed(){
  const e = eng();
  if(!e || !e.player) return 'world';
  if(typeof CHASE !== 'undefined' && CHASE.active) return 'chase';
  if(typeof TAIL !== 'undefined' && TAIL.active) return 'tail';
  if(TAC.state && TAC.state.pursuit) return 'pursuit';
  if(e.seq) return 'seq';
  if(typeof isOverlayOpen === 'function' && isOverlayOpen()) return 'overlay';
  if(e.movementEnabled === false) return 'frozen';
  if(document.body && document.body.classList.contains('v12-car')) return 'car';
  if(TAC.mission() === 'm0') return 'm0';
  const chip = document.getElementById('hint-chip');
  if(chip && chip.classList.contains('show') && chip.dataset.tac !== 'miss') return 'hint';
  return null;
}
const cleanLabel = l => String(l || '').replace(/\s*\(.*?\)\s*/g, ' ').trim();
function tracker(){
  const W = window.WAY; if(!W) return { text:null, dist:null, r:null };
  let r = null; try{ r = W.resolve ? W.resolve() : null; }catch(e){ r = null; }
  let text = null;
  try{ text = W.trackerText ? W.trackerText() : null; }catch(e){}
  if(!text){ try{ const c = W.current ? W.current() : null; text = c && c.obj ? c.obj.text : null; }catch(e){} }
  let dist = null;
  try{
    const P = ENGINE.player.position;
    if(r && !r.uiOnly && r.pos && (!W.playerOk || W.playerOk())) dist = Math.round(Math.hypot(r.pos.x - P.x, r.pos.z - P.z));
  }catch(e){}
  return { text, dist, r };
}
function missLine(){
  const why = suppressed();
  const ms = TAC._ms;
  if(why){ if(ms) ms.missSuppressed++; return null; }
  const t = now();
  if(t - MISS.at < 4000){ if(ms) ms.missSuppressed++; return null; }
  const P = ENGINE.player.position, tr = tracker();
  // the nearest live target just out of reach (the same filter nearestInteractable uses: nothing consumed or hidden)
  let close = null, cd = Infinity;
  for(const it of (ENGINE.interactables || [])){
    if(!TAC.interact.live(it) || TAC.interact.isSpent(it)) continue;     // (a spent target would only answer with a refusal)
    const d = Math.hypot(it.mesh.position.x - P.x, it.mesh.position.z - P.z);
    if(d < (it.range || 2.5) + 1.5 && d < cd){ close = it; cd = d; }
  }
  const recruit = typeof isRecruit === 'function' && isRecruit();
  if(close && !recruit){
    const tm = tr.r && tr.r.mesh;
    if(!(tm && tm === close.mesh)) close = null;      // Senior Agent: never name what the tracker doesn't
  }
  let line;
  if(close) line = 'Move closer — ' + cleanLabel(close.label);
  else if(tr.text) line = 'Nothing in reach — ' + tr.text + (tr.dist != null ? ' is ' + tr.dist + ' m away' : '');
  else line = 'Nothing in reach';
  MISS.at = t; MISS.line = line; MISS.n++;
  if(ms) ms.missShown++;
  if(typeof showHint === 'function'){
    const html = esc(line);
    showHint(null, html, html, 1800);      // feedback on every difficulty (it only repeats the HUD), so not TAC.hint
    const chip = document.getElementById('hint-chip');
    if(chip){ chip.dataset.tac = 'miss'; clearTimeout(chip._tacMiss); chip._tacMiss = setTimeout(() => { if(chip.dataset.tac === 'miss') delete chip.dataset.tac; }, 1900); }
  }
  if(isTouch() && typeof haptic === 'function') haptic(8);
  return line;
}
// outermost tryInteract wrap (inside it: D's chase-start reclass, v12_pt's interact_miss / interact_result)
wrap('tryInteract', orig => function(){
  let it = null;
  try{ it = typeof nearestInteractable === 'function' ? nearestInteractable() : null; }catch(e){ TAC._err(e); }
  const r = orig.apply(this, arguments);
  if(!it){ try{ missLine(); }catch(e){ TAC._err(e); } }
  return r;
});
// a teaching hint that arrives while the miss line shows takes the chip: drop our mark
wrap('showHint', orig => function(id){
  const chip = document.getElementById('hint-chip');
  if(chip && chip.dataset.tac === 'miss' && id && !(G()._hints && G()._hints[id])) delete chip.dataset.tac;
  return orig.apply(this, arguments);
});
})();
