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
V12.version = 'v13';

/* ---------- every logged exhibit gets a record ---------- */
W('collectEvidence', orig => function(ev){ const r = orig.apply(this, arguments); safe(()=>intelOnEvidence(ev), 'evidence'); return r; });

/* ---------- operations start and end ---------- */
W('beginMission', orig => function(id){
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
  if((o === 'proven' || o === 'contested') && !I().court && typeof openCourt === 'function'){ openCourt(()=>orig.apply(self, args)); return; }
  return orig.apply(this, arguments);
});
W('epilogueSlides', orig => function(){
  const slides = orig.apply(this, arguments);
  safe(()=>{
    const t = courtEpilogueText(); if(!t) return;
    const sl = slides.find(x => x.name === 'COMMANDER ADAEZE');
    if(sl){ sl.text = t; sl.art = I().court.proven.length >= 2 ? 'adaeze_afraid' : 'adaeze_evasive'; }
  }, 'epilogue');
  return slides;
});
W('advanceEpilogue', orig => function(){
  const r = orig.apply(this, arguments);
  safe(()=>{
    if(EPI.i >= EPI.slides.length && !I().reviewShown){
      I().reviewShown = true;
      openReview(()=>{ showOverlay('screen-title'); if(typeof musicForScene === 'function') musicForScene('title'); });
    }
  }, 'review');
  return r;
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
// the caretaker's tip opens the back gate, as Musa's does
W('musaGaveTip', orig => function(){ return orig.apply(this, arguments) || !!safe(()=>intelHas('lead_caretaker'), 'tip'); });
// a refused application leaks
W('startMansionWipe', orig => function(){
  const r = orig.apply(this, arguments);
  if(S.game.flags && S.game.flags.obi_tipped){
    S.game._wipeTotal = Math.max(25, (S.game._wipeTotal || 55) - 15);
    setTimeout(()=>toast('HE WAS READY', `A court clerk talked. Obi had his finger on the button — about ${S.game._wipeTotal} seconds.`, 2800), 2900);
  }
  return r;
});
W('towerPowerOn', orig => function(){
  const r = orig.apply(this, arguments);
  if(S.game.flags && S.game.flags.cdr_tipped){
    S.game._towerWindow = Math.max(40, (S.game._towerWindow || 75) - 15);
    V12.say('SGT. UCHE', "They've been rotating handsets since your application leaked. Less time on that cabinet, sir.", 3800);
  }
  return r;
});

/* ---------- warrants are applied for, not awarded ---------- */
V12.warrant = () => !!safe(()=>warrantGranted('w_lekki'), 'warrant');
if(V12.INTEL_TIERS && V12.INTEL_TIERS[0]) Object.assign(V12.INTEL_TIERS[0], { name:'MAGISTRATE', text:'Magistrates take your applications seriously: +2 on every warrant basis.' });
{ const tm = (V12.OPS_THEORIES || []).find(t => t.id === 't_money'); if(tm) tm.effect = 'Strong grounds for the Lekki warrant: an inked theory counts double in your application.'; }

/* ---------- the investigation's findings count in the accusation ---------- */
{ const strong = V12.strongAgainstAdaeze;
  if(typeof strong === 'function') V12.strongAgainstAdaeze = function(){ const out = strong.apply(this, arguments) || {}; safe(()=>Object.assign(out, intelStrongExtras()), 'strong'); return out; }; }

/* ---------- the raid plan: apply for the Lekki warrant from the gate ---------- */
{ const plan = V12.planM3;
  if(typeof plan === 'function') V12.planM3 = function(onGo){
    DESK.planGo = onGo;
    const r = plan.apply(this, arguments);
    safe(planWarrantButton, 'plan');
    return r;
  }; }
function planWarrantButton(){
  const ov = document.getElementById('screen-plan'); if(!ov) return;
  const add = ()=>{
    const w = WARRANTS.find(x => x.id === 'w_lekki');
    if(!w || warrantGranted('w_lekki') || !warrantOpen(w) || ov.querySelector('#plan-warrant')) return;
    const host = ov.querySelector('.plan-pred'); if(!host) return;
    const b = document.createElement('button'); b.id = 'plan-warrant'; b.className = 'mini-btn';
    b.textContent = `APPLY FOR THE WARRANT · BASIS ${warrantScore(w)}/${w.need} ▸`;
    b.addEventListener('click', e => { e.stopPropagation(); openDesk('warrants'); });
    host.appendChild(b);
  };
  add();
  if(!ov._v13obs){ ov._v13obs = new MutationObserver(add); ov._v13obs.observe(ov, { childList:true }); }
}

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
