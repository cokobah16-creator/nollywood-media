/* =========================================================================
   NACECA · v13 boot — wires the investigation layer in, the v12 way:
   every change wraps an existing function. Nothing in the engine or in
   v12 is edited, so v13 can be removed by deleting src/v13/.
   ========================================================================= */
(function(){
'use strict';
const V12 = window.V12;
if(!V12 || typeof V12.wrap !== 'function'){ console.warn('[v13] needs the v12 layer'); return; }
const W = V12.wrap;
const safe = (f, label) => { try{ return f(); }catch(e){ console.warn('[v13] ' + label, e); } };
V12.version = 'v13+beta';                     // playtest events carry the build: v12.2, the friends beta and v13

/* ---------- every logged exhibit gets a record ---------- */
// I() runs first, so a new item is never mistaken for one logged before the Case Desk existed
W('collectEvidence', orig => function(ev){ safe(()=>I(), 'intel'); const r = orig.apply(this, arguments); safe(()=>intelOnEvidence(ev), 'evidence'); return r; });

/* ---------- operations start and end ---------- */
W('beginMission', orig => function(id){
  safe(()=>I(), 'intel');                       // a new game gets its record at m0; an old save is migrated once (design A1/A9)
  const before = S.game._opStart;
  const r = orig.apply(this, arguments);
  if(S.game._opStart !== before && S.game.currentMission === id && ENGINE.player) safe(()=>intelOnMissionStart(id), 'start');
  return r;
});
W('showAftermath', orig => function(){ safe(()=>intelOnMissionEnd(S.game.currentMission), 'end'); return orig.apply(this, arguments); });

/* ---------- the weekly briefing comes before the operation it prepares ---------- */
// From Case 04 on, the briefing runs inside the hub's Commander call (V12.hubCallAfter in
// v13_briefing.js), so loadMission is never intercepted for it: h.start, Continue, the mission
// select and the aftermath all give the same order. The one exception is Week 1 below.
// Night Shift walks straight into the Bypass: brief before "TWO DAYS LATER", not after it
W('titleCard', orig => function(lines){
  const self = this, args = arguments;
  if(Array.isArray(lines) && lines[0] === 'BENIN BYPASS' && typeof openBriefing === 'function' && safe(()=>briefingPending('m3'), 'brief?')){ openBriefing('m3', ()=>orig.apply(self, args)); return; }
  return orig.apply(this, arguments);
});
// ...and a Week-1 briefing interrupted by a quit (open or committed) reopens before the Bypass
W('loadMission', orig => function(id){
  const self = this, args = arguments;
  if(id === 'm4' && typeof openBriefing === 'function' && safe(()=>briefingResumable('m3'), 'brief?')){
    openBriefing('m3', ()=>titleCard(['BENIN BYPASS', 'TWO DAYS LATER'], 2600, ()=>orig.apply(self, args)));
    return;
  }
  return orig.apply(this, arguments);
});

/* ---------- the trial before the epilogue, the review after it ---------- */
W('startEpilogue', orig => function(){
  const self = this, args = arguments, o = (S.game.moralChoices || {}).finale;
  // the court sits once per finale run (a replayed M8 clears it: v13_court courtResetForReplay)
  const done = typeof courtDoneFor === 'function' ? !!safe(()=>courtDoneFor(o), 'court?') : !!I().court;
  if((o === 'proven' || o === 'contested') && !done && typeof openCourt === 'function'){ openCourt(()=>orig.apply(self, args)); return; }
  return orig.apply(this, arguments);
});
W('epilogueSlides', orig => function(){
  const slides = orig.apply(this, arguments);
  safe(()=>{
    const t = courtEpilogueText(); if(!t) return;                       // null unless a court sat on THIS finale
    const sl = slides.find(x => x.name === 'COMMANDER ADAEZE');
    if(sl){ sl.text = t; sl.art = I().court.proven.length >= 2 ? 'adaeze_afraid' : 'adaeze_evasive'; }
  }, 'epilogue');
  // the chase branch: Uche carried Tobi out alive (casework, v12.2 h6), so his slide can't say he died
  safe(()=>{
    const m = S.game.moralChoices || {};
    if(m.asaba !== 'chase' || S.game._asabaHostageLost) return;
    const sl = slides.find(x => x.name === 'TOBI ONUOHA'); if(!sl || !/^Tobi did not live/.test(sl.text || '')) return;
    const r = (S.game.accusations || {}).route, named = !!(r && r.ok && r.ok.suspect === false && r.suspect === 'tobi');
    sl.art = 'tobi_neutral';
    sl.text = named ? 'Sgt. Uche carried Tobi out of the Asaba smoke, and your charge sheet held him until noon. He went home to his sister. He does not take NACECA\'s calls.'
      : 'Sgt. Uche carried Tobi out of the Asaba smoke. He went home to his sister, and he does not talk about the warehouse.';
  }, 'tobi');
  return slides;
});
W('advanceEpilogue', orig => function(){
  const self = this, args = arguments;
  // the case review comes after the last slide and BEFORE the title screen (its music, its toast), not over it
  if(EPI.i + 1 >= EPI.slides.length && !I().reviewShown && typeof openReview === 'function'){
    I().reviewShown = true;
    if(safe(()=>{ openReview(()=>orig.apply(self, args)); return true; }, 'review')) return;
  }
  return orig.apply(this, arguments);
});

/* ---------- her case, and how she read you, in the reveal ---------- */
W('finaleRevealScript', orig => function(){
  const k = orig.apply(this, arguments);
  safe(()=>{
    const lines = DIALOGUE[k]; if(!lines || lines._v13) return;
    const x = intelRevealExtras();
    const iSrc = lines.findIndex(l => (l.text || '').startsWith('Obi. The Engineer.'));
    if(iSrc >= 0) lines.splice(iSrc, 0, ...x.before);
    const iAng = lines.findIndex(l => (l.text || '').startsWith('That boy opened files'));
    if(iAng >= 0) lines.splice(iAng + 1, 0, ...x.after);
    lines._v13 = true;
  }, 'reveal');
  return k;
});

/* ---------- consequences elsewhere in the game ---------- */
// the caretaker's tip opens the back gate, as Musa's does — and the caretaker gets the credit (backgate_src)
W('musaGaveTip', orig => function(){ return orig.apply(this, arguments) || !!safe(()=>intelBackGate(), 'tip'); });
// (no leak timers: an investigative choice never shortens the Lekki wipe or the Ugbowo cabinet window)

/* ---------- warrants are applied for, not awarded ---------- */
// The board is the magistrate: V12.warrant(), intel tier 0 ('ON FILE') and the t_money text stay the beta's.
// v13 reads every warrant through V12.warrantState (v13_intel.js); w_cdr / w_eko are filed with V12.fileV13Warrant.

/* ---------- the investigation's findings count in the accusation ---------- */
{ const strong = V12.strongAgainstAdaeze;
  if(typeof strong === 'function') V12.strongAgainstAdaeze = function(){ const out = strong.apply(this, arguments) || {}; safe(()=>Object.assign(out, intelStrongExtras()), 'strong'); return out; }; }

/* ---------- the raid plan: apply for the Lekki warrant from the gate ---------- */
// (nothing here any more: the beta's raid gate files the Lekki warrant before the plan opens, and the plan reads it)

/* ---------- entry points: HUD EVIDENCE → Case Desk; a DESK button on the operations table ---------- */
W('ensureHudV8', orig => function(){
  const r = orig.apply(this, arguments);
  safe(()=>{
    const b = document.getElementById('cb-ev'); if(!b || b._v13) return;
    const c = b.cloneNode(true); c._v13 = true; b.replaceWith(c);           // drops the old listener, keeps the counter
    c.addEventListener('click', e => { e.stopPropagation(); if(ENGINE.movementEnabled) openDesk('locker'); });
    c.addEventListener('touchstart', e => e.stopPropagation(), { passive:true });
  }, 'hud');
  return r;
});
{ const openOps = V12.openOps;
  if(typeof openOps === 'function') V12.openOps = function(){
    const r = openOps.apply(this, arguments);
    safe(()=>{
      const host = document.querySelector('#screen-ops .ops-btns'); if(!host || document.getElementById('ops-desk')) return;
      const b = document.createElement('button'); b.className = 'ops-b'; b.id = 'ops-desk'; b.textContent = 'CASE DESK';
      b.addEventListener('click', e => { e.stopPropagation(); openDesk(); });
      host.insertBefore(b, host.firstChild);
    }, 'ops');
    return r;
  }; }
window.addEventListener('load', ()=>{
  safe(deskInit, 'desk');
  safe(()=>{ const t = document.getElementById('v12-build'); if(t) t.textContent = 'BUILD v13 · THE CASE FILE'; }, 'tag');
});
})();
