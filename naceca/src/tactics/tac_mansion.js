/* =========================================================================
   NACECA · src/tactics/tac_mansion.js — the Lekki raid gets a real house (M3, plan items 11-17)
   Owner: Team C. DESIGN-tactics.md §2.3, §3, §4, §5.4; docs/tactics/mansion.md and its critique.

   Both houses (the art-pass one players get, and the legacy one the art-failed fallback builds):
   · the child stays inside after "stay put" ('Walk her out'); "Secure the child" completes only when she
     is out; one rescue each; S.game.moralChoices.rescued is reset per op;
   · the extraction needs the arrest AND the child outside, and pays the plan honestly (no knowledge-only
     rescue); PLAN FIRST before the briefing; the plan text and the spoken briefing tell the truth;
   · the laptop files (shred thresholds, the custody line, the Week-1 drives lead, the aftermath row).
   The art-pass house only (ENGINE._mansion):
   · the entry decides the start (spawns, the title card, the deferred wipe, the loud stun, the power cut);
   · Obi is a TAC.sight watcher on quiet entries; once alarmed he runs for the kitchen door and can be
     intercepted, cornered, covered or tackled, or the perimeter brings him round (never force);
   · Uche follows, covers, takes the child out, or holds the kitchen door (side gate, Squad Trust);
   · the tracker, the minimap blips, the UCHE button (touch) and the Q · UCHE chip (desktop).
   Everything is a V12.wrap, a property wrap, a MutationObserver or a getter: no existing file is edited.
   Exposed for tests as TAC.m3 { cfg, run(), obi(), uche(), order(id, src), offer(), child(), … }.
   ========================================================================= */
(function(){
'use strict';
const TAC = window.TAC;
if(!TAC || !TAC.v || TAC.m3) return;
const V12 = window.V12;
if(!V12 || typeof V12.wrap !== 'function') return;
const W = V12.wrap;
// REVIEW C-9: only the frozen §3 API is load-bearing; the kernel's internals are used when present, never required
const err = e => { try{ if(typeof TAC._err === 'function') TAC._err(e); else if(typeof console !== 'undefined') console.error('[tac_mansion]', e); }catch(_){ /* never throw from the error path */ } };
const DT = 0.1;                                       // TAC.onTick's fixed step (DESIGN §3.1: dt = 0.1)
const safe = (f, d) => { try{ return f(); }catch(e){ err(e); return d; } };
const r1 = x => Math.round((+x || 0) * 10) / 10;
const hyp = Math.hypot;
const log = (t, d) => { try{ if(V12.log) V12.log(t, d); }catch(e){ err(e); } };
const ico = n => typeof icon === 'function' ? icon(n) : '';
// REVIEW C-1: Team A's _radioNext wrap (tac_radio.js:154-155) gives the head line default metadata in its expiry loop
// before it attaches the pending opts, so a keyed line said on an IDLE radio loses its key, priority and ttl (it can then
// be neither cancelled nor dropped, and a pri-3 line re-queues it). The root cause is routed to Team A. Until it is
// fixed, the _radioNext wrap below attaches the pending opts first, for THIS file's own lines only (OWN holds the text
// being said); once A attaches them itself the head line already has its metadata and the wrap does nothing.
let OWN = null;
const say = (text, key, pri, ttl) => safe(() => { OWN = text; try{ TAC.radio.say('SGT. UCHE', text, { key, pri, ttl }); } finally { OWN = null; } });
if(typeof _radioNext === 'function') W('_radioNext', orig => function(){
  try{
    const RR = TAC._radio, q = (typeof RADIO !== 'undefined' && RADIO && RADIO.queue) || null, h0 = q && q[0];
    if(OWN != null && RR && RR.pend && RR.pend.key != null && h0 && !h0._tac && h0.text === OWN) h0._tac = RR.pend;
  }catch(e){ err(e); }
  return orig.apply(this, arguments);
});
const G = () => (typeof S !== 'undefined' && S && S.game) ? S.game : null;
const mc = () => (G() && G().moralChoices) || {};
const flags = () => { const g = G(); if(!g.flags) g.flags = {}; return g.flags; };
const isTouch = () => !!(document.body && document.body.classList.contains('touch-active'));
const overlay = () => typeof isOverlayOpen === 'function' && isOverlayOpen();
const curObj = () => { const o = ((G() && G().objectives) || []).find(x => !x.done); return o ? o.id : null; };

/* ---------- the numbers (DESIGN §5.4; mansion.md §3) ---------- */
const cfg = {
  leak:false,                                  // the leak ships off (DESIGN §11.5): Obi faces the door, alarm at 60
  // gain tuned against A's real line of sight (tac_m3_sight): 2.0 is the smallest that alarms a frontal walk AND a
  // desktop jog before 2.7 m (arrest range) while the east flank (walk 31.8), the side gate along the back wall (30)
  // and the dark frontal walk to arrest range (31) stay under notice; rush is not needed (DESIGN §2.3 C-B1)
  gain:2.0, rush:null, eyeH:1.6, range:{ lit:9, dark:4.5 }, att:{ call:0.6, up:1 },
  knockThumb:1.0, knockRun:2.5, loudStun:2.5, thumb:0.5, quietRun:1.5,
  obiV:3.0, catchR:1.4, stopR:2.2, arrestR:2.7, perimSecs:6, coverR:4, coverSee:9, tackleR:1.2,
  cornerX:1.0, cornerZ:-4.0,
  childV:1.05, childOutZ:4.6, ucheJog:3.0, ucheSneak:1.25, ucheRun:4.2, follow:[1.8, 2.5], pad:0.25,
  card:1400, dark:0.35, gradePerimeter:-5,
  flee:[[4.12,-1.0],[4.12,-2.9],[3.95,-3.55],[1.5,-3.65],[0.35,-3.95],[0,-4.7],[0,-8.1]],
  spawn:{ knock:[0.35,5.0,Math.PI], loud:[0.35,4.6,Math.PI], quiet:[0.4,4.9,Math.PI], gate:[0,-7.6,0] },
  ucheAt:{ follow:[-0.35,4.7], hold:[0.9,5.5], post:[-0.35,-8.1] },
  perimeter:[0.9,9.6],
  childPath:[[-0.6,2.6],[0,3.6],[0,4.7],[-0.9,6.3],[-1.4,6.9]],
  shred:[['burner_logs.zip',10],['obi_contacts.vcf',20],['ledger_q3.xlsx',40],['transfers_lekki.pdf',55],
         ['sim_batch_07.db',70],['pos_agents.csv',85],['wallet_seed.txt',100]],
  // Uche's waypoint graph (mansion.md §3.6): every node and edge clear of the colliders at 0.25 m
  nodes:{ porch:[1.0,6.55], doorOut:[0.35,5.0], doorIn:[0.35,2.6], hallE:[2.2,2.6], flank:[3.6,2.4], living:[-0.6,2.4],
          livingW:[-2.8,2.0], childSide:[-0.9,1.9], midS:[0.6,-0.6], study:[2.3,0.6], midS2:[0.75,-2.9], mouth:[0.3,-4.0],
          backW:[-0.9,-3.6], corrMid:[0,-6.0], back:[-0.35,-8.0] },
  edges:[['porch','doorOut'],['doorOut','doorIn'],['doorIn','hallE'],['hallE','flank'],['doorIn','living'],['living','livingW'],
         ['living','childSide'],['doorIn','midS'],['midS','study'],['hallE','study'],['living','midS'],['midS','midS2'],
         ['midS2','mouth'],['mouth','backW'],['mouth','corrMid'],['corrMid','back']],
  // the why-line's places (mansion.md §3.2), worded to follow "He can see you walking …"; first match wins
  zones:[ { name:'in the doorway', rect:[-0.95, 0.95, 2.8, 4.3] }, { name:'at the corridor mouth', rect:[-1, 1, -4.8, -3.6] },
          { name:'at his desk', rect:[2, 4.5, -2.5, 0.5] }, { name:'along the east wall', rect:[3.4, 4.6, 0.5, 3.5] },
          { name:'in the living room', rect:[-5, 0.5, -4.5, 4] } ],
};
const FREE = new Set(['unaware', 'noticed', 'startled', 'stunned', 'reaching', 'running']);
const CLIP = { unaware:'talk', noticed:'idle', startled:'idle', stunned:'crouch', reaching:'interact', running:'jog', handsup:'handsup',
  down:'kneel', out_back:'jog', perimeter:'kneel', arrested:'kneel' };
const TXT = {
  planFirst:['PLAN FIRST', 'Plan the raid with Sgt. Uche'],
  needArrest:['OPERATION OPEN', 'Arrest the principal first'],
  needChild:['OPERATION OPEN', 'The girl is still inside. Walk her out first'],
  gotHim:['GOT HIM', 'Hands where I can see them.'],
  seized:['LAPTOP SEIZED', 'The wipe never started. All 7 files intact.'],
  walk:'Come. Hold my hand. We go outside now.',
  run:"He's running: the back corridor!", out:"He's out the kitchen door. Perimeter, he's yours!",
  perim:"Perimeter has him, in the yard. They're bringing him round the front.",
  cover:'NACECA! On your knees!', take:"I've got her.",
  refuse:{ busy:"I'm on it already, sir.", no_sight:"I can't see him from here, sir.", running:"Not while he's running, sir.",
           unaware:"Not while he's watching the room, sir." },
  headline:{ pub:'THE LAGOS LEDGER', head:'Lekki Chief Bolts Out the Back, Held in His Own Yard',
             ded:'A NACECA raid ends with the suspect in custody after a dash through the kitchen.' },
};
// Kelechi's one line when he walks her out himself (no choices)
try{ if(typeof DIALOGUE !== 'undefined' && !DIALOGUE.tac_m3_walk) DIALOGUE.tac_m3_walk = [{ speaker:'AGENT KELECHI', portrait:'kelechi', text:TXT.walk }]; }catch(e){ err(e); }

/* ---------- per-operation state (never saved; dropped at every scene) ---------- */
let R = null;
function fresh(variant, M){
  return { variant, M, live:false, card:false, t:0, mgAcc:0,
    entry:null, door:'front', power:'on', uchePlan:'with', quiet:false, leak:false, plan:null, known:{}, spawn:null,
    obi:{ state:'idle', t0:0, alarmAt:null, alertedBy:null, outcome:null, by:null, runAt:null, runSecs:null, ranM:0, seg:0,
          stopAt:null, outAt:null, dist:null, states:[], first:null, arrested:false, boxOut:false, box:null },
    wipe:{ mode:'off', pending:0, armedAt:null },
    uche:{ mode:'idle', job:null, lastJob:null, path:[], speed:cfg.ucheJog, onArrive:null, postedAtStop:false, orders:[], acts:[],
           jobAt:null, clip:null, decideT:0 },
    child:{ state:'in', choice:null, by:null, spoken:false, counted:false, gentle:false, outAt:null },
    lap:{ firstAt:null, outcome:null, press:null, files:null, pct:null, mg:false },
    extract:{ refusals:0, missing:[], pending:false }, causes:{ sight:0, noise:0, close:0 }, notices:0, alarms:0,
    its:{}, pois:{}, w:null, summary:false };
}
const inM3 = () => !!(R && G() && G().currentMission === 'm3');
const v8 = () => !!(inM3() && R.variant === 'v8' && typeof ENGINE !== 'undefined' && ENGINE._mansion && ENGINE._mansion === R.M);
const playing = () => v8() && R.live;
const P = () => ENGINE.player.position;
const dist = (a, b) => hyp((+a.x || 0) - (+b.x || 0), (+a.z || 0) - (+b.z || 0));
const segClear = (ax, az, bx, bz) => {
  const f = typeof segBlocked === 'function' ? segBlocked : (window.WAY && WAY.segBlocked);
  return f ? !f(ax, az, bx, bz, cfg.pad) : true;
};
const losTo = (a, ah, b, bh) => safe(() => TAC.sight.los(+a.x, +a.z, ah, +b.x, +b.z, bh), { clear:true });

/* ---------- the plan (v12_plan.js:57-62, unchanged) ---------- */
function wipeFor(){
  const g = G(), Pl = g._plan || {}, K = Pl.known || {};
  const entry = (g.flags && g.flags.entry) || mc().entry || 'knock';
  let t = { quiet:K.gate ? 80 : 65, knock:55, loud:40 }[entry] || 55;
  if(K.laptop) t += 15;
  if(Pl.power === 'cut') t += 12;
  return t;
}
const leakNow = () => !!(cfg.leak && safe(() => { const rec = V12.accused && V12.accused('lagos'), ops = V12.ops && V12.ops().cases.lagos;
  return rec && rec.warrant === 'exigent' && ops && ops.refused; }, false));
function prep(){
  const K = (R && R.known) || ((G()._plan || {}).known) || {};
  return { sims:!!safe(() => V12.theory('t_sims'), false), kcFair:!!(typeof kcIsFair === 'function' && safe(kcIsFair, false)),
    tip:!!G()._tipM3, civ:!!K.civ, warrant:!!K.warrant };
}

/* =================================================================================================
   1 · The plan tells the truth (V12.planM3 property wrap + a MutationObserver on #screen-plan; go untouched)
   ================================================================================================= */
function planTruth(ov){
  if(!ov || ov._tacBusy || !G() || G().currentMission !== 'm3') return;
  ov._tacBusy = true;
  try{
    const I = V12.m3Intel(), art = !!(typeof ENGINE !== 'undefined' && ENGINE._mansion);
    const on = k => { const b = ov.querySelector(`.plan-seg [data-k="${k}"].on`); return b ? b.dataset.v : null; };
    const entry = on('entry') || 'knock';
    const q = ov.querySelector('.plan-seg [data-k="entry"][data-v="quiet"]');
    const ql = I.gate.known ? 'Side gate, quiet' : 'Quiet, front door';
    if(q && q.textContent !== ql) q.textContent = ql;
    const pred = ov.querySelector('.plan-pred');
    if(pred && !pred.querySelector('.tac-pred')){
      const first = pred.firstElementChild, m = first && /about\s+(\d+)\s*s/.exec(first.textContent || '');
      if(first && m){
        const tail = art ? ({ knock:' from the knock', loud:' from the bang', quiet:' once he knows you are inside. None if you reach him first' })[entry] || '' : '';
        first.innerHTML = `<b>Wipe clock</b> about <b>${m[1]} s</b>${tail}${I.laptop.known ? ' · you go straight to the study' : ''}`;
      }
      for(const d of [...pred.children]){
        const t = d.textContent || '';
        if(/^Dark house/.test(t)) d.textContent = art ? 'Dark house: he sees half as far, and with the Wi-Fi down his wipe runs about 12 s longer.'
          : 'Dark house: with the Wi-Fi down his wipe runs about 12 s longer.';
        if(art && /back wall runs into Uche/.test(t)) d.textContent = 'Uche waits inside the kitchen door. If Obi runs for it, he runs into Uche.';
      }
      const mark = document.createElement('span'); mark.className = 'tac-pred'; mark.hidden = true; pred.appendChild(mark);
    }
    // the SIM theory: a facing tick on the study dot (a fact, every difficulty); the words only for a Recruit
    const svg = ov.querySelector('.plan-svg');
    if(svg && !svg.querySelector('.tac-face') && safe(() => V12.theory('t_sims'), false)){
      const NS = 'http://www.w3.org/2000/svg';
      const ln = document.createElementNS(NS, 'path'); ln.setAttribute('class', 'tac-face'); ln.setAttribute('d', 'M197 125 H184 M188 121 L184 125 L188 129');
      svg.appendChild(ln);
      if(typeof isRecruit === 'function' && isRecruit()){
        const tx = document.createElementNS(NS, 'text'); tx.setAttribute('class', 'room sm tac-blind'); tx.setAttribute('x', '224'); tx.setAttribute('y', '86');
        tx.textContent = 'BLIND SIDE'; svg.appendChild(tx);
      }
    }
    if(leakNow() && !ov.querySelector('.plan-row.tac-leak')){
      const b = ov.querySelector('.plan-b');
      if(b) b.insertAdjacentHTML('beforeend', '<div class="plan-row u tac-leak"><span class="pl">WORD IS OUT</span><span class="pv">The magistrate refused your warrant, and court clerks talk. Expect him awake.</span></div>');
    }
  }catch(e){ err(e); }
  finally{ ov._tacBusy = false; }
}
function hookPlan(){
  const ov = document.getElementById('screen-plan'); if(!ov) return;
  if(!ov._tacObs && typeof MutationObserver === 'function'){ ov._tacObs = new MutationObserver(() => planTruth(ov)); ov._tacObs.observe(ov, { childList:true }); }
  planTruth(ov);
}
// the spoken briefing: go (v12_plan.js:121-151) has built DIALOGUE.mansion_pre_breach; fix it before it plays
function rewriteBriefing(){
  const L = typeof DIALOGUE !== 'undefined' && DIALOGUE.mansion_pre_breach;
  if(!Array.isArray(L) || !G() || G().currentMission !== 'm3') return;
  const Pl = G()._plan || {}, K = Pl.known || {}, art = !!(typeof ENGINE !== 'undefined' && ENGINE._mansion);
  for(const l of L){
    if(!l) continue;
    if(/KELECHI/.test(l.speaker || '') && Pl.entry === 'quiet') l.text = K.gate ? 'Quiet. Side gate, then the kitchen door.' : 'Quiet. Front door, and nobody runs.';
    if(art && /^I'll take the back wall/.test(l.text || '')) l.text = "I'll be inside the kitchen door. Anyone who runs, runs into me.";
  }
}
{
  const pm = V12.planM3;
  if(typeof pm === 'function' && !pm._tac){
    const f = function(onGo){
      const go = typeof onGo === 'function' ? function(){ safe(rewriteBriefing); return onGo.apply(this, arguments); } : onGo;
      const r = pm.call(this, go);
      safe(hookPlan);
      return r;
    };
    f._tac = true; f._orig = pm;
    V12.planM3 = f;
  }
}

/* =================================================================================================
   2 · Building the house (both builders go through buildSceneMansion; v12's wrap is inside this one)
   ================================================================================================= */
const findIt = re => (ENGINE.interactables || []).find(i => re.test(i.label || ''));
function build(){
  const g = G(); if(!g) return;
  if(g.moralChoices) g.moralChoices.rescued = 0;                     // per op: a replay must not read last run's rescue
  const f = flags(); for(const k of ['m3_files', 'm3_wipe_pct', 'child_by']) delete f[k];
  const M = ENGINE._mansion || null;
  R = fresh(M ? 'v8' : 'legacy', M);
  R.its = { lap:findIt(/^(Inspect laptop|Stop laptop wipe)/), obi:findIt(/^Move on suspect/), child:findIt(/^Calm and escort the child/),
    ex:findIt(/^Extract/), uche:findIt(/^(Plan the raid with Sgt\. Uche|Brief with Sgt\. Uche)/) };
  patchLaptop(); patchObi(); patchChild(); patchExtract();
  TAC.interact.priority('Move on suspect', () => (playing() && FREE.has(R.obi.state)) ? 3 : null);
  TAC.interact.priority('Stop him', () => (playing() && R.obi.state === 'running') ? 3 : null);
  TAC.interact.spent('Walk her out', () => inM3() && R.child.state === 'out');
  TAC.interact.priority('Walk her out', () => inM3() ? 1 : null);
  if(!M) return;
  // Obi: the _obiPanic hands-up rule (art_pass_v8.js:1696-1699) goes; this layer drives him
  const n = (ENGINE.npcs || []).find(x => x && x.mesh === M.obi); if(n) n.update = function(){};
  R.its.obi && (R.its.obi._tacRange = R.its.obi.range);
  safe(() => TAC.sight.zones(cfg.zones));
  R.w = TAC.sight.watch({ id:'obi', enc:'m3_obi', mesh:M.obi, he:'He', eyeH:cfg.eyeH, fov:100, range:{ lit:cfg.range.lit, dark:cfg.range.dark },
    hearing:1, surface:'on the tiles', crowd:() => [], facing:obiYaw, gain:cfg.gain, rush:cfg.rush || null,
    levels:leakNow() ? { alarm:60 } : undefined,
    attention:() => (R && (R.leak || R.obi.state === 'noticed')) ? cfg.att.up : cfg.att.call,
    active:() => !!(R && R.live && R.quiet && (R.obi.state === 'unaware' || R.obi.state === 'noticed')),
    onLevel:onObiLevel,
    logExtra:() => R ? { obi:R.obi.state, entry:R.entry, power:R.power } : {} });
  const pois = (typeof MINIMAP !== 'undefined' && MINIMAP.pois) || [];
  const at = (x, z) => pois.find(p => p && Math.abs(p.x - x) < 0.01 && Math.abs(p.z - z) < 0.01) || null;
  R.pois = { obi:at(4.12, -1.0), child:at(-1.35, 1.45), uche:at(1.0, 6.55) };
}
W('buildSceneMansion', orig => function(){
  R = null;
  const r = orig.apply(this, arguments);
  try{ build(); }catch(e){ err(e); }
  return r;
});
W('ensureHudV8', orig => function(){
  const r = orig.apply(this, arguments);
  try{ uiEnsure(); }catch(e){ err(e); }
  return r;
});
try{ const t = window.WAY && WAY.OBJ_TARGETS && WAY.OBJ_TARGETS.m3;
  if(t){ const v = t.o5_civ, list = Array.isArray(v) ? v.slice() : [v]; if(!list.includes('Walk her out')) list.push('Walk her out'); t.o5_civ = list; } }catch(e){ err(e); }

/* ---------- the laptop ---------- */
function survivors(pct){ return cfg.shred.filter(([, at]) => pct < at).map(f => f[0]); }
function patchLaptop(){
  const it = R.its.lap; if(!it || it._tacLap) return;
  it._tacLap = true;
  const orig = it.onInteract;
  it.onInteract = function(){
    const g = G();
    if(!g._evLaptop && !g._wipeLost && !g._mansionPreBriefed){ toast(TXT.planFirst[0], TXT.planFirst[1]); return; }
    if(!inM3() || g._evLaptop || g._wipeLost) return orig.apply(this, arguments);
    if(R.variant === 'v8' && v8() && !R.live) return;                  // under the title card: the house has not started
    if(R.lap.firstAt == null && R.live) R.lap.firstAt = r1(R.t);
    if(R.variant === 'v8' && v8() && R.live){
      const wm = R.wipe.mode, o = R.obi;
      if(wm === 'pending' || wm === 'never'){
        if(FREE.has(o.state)){
          // the reach is staged in front of his desk: in his view, he sees it at once
          if((o.state === 'unaware' || o.state === 'noticed') && R.w){
            const pr = safe(() => TAC.sight.probe('obi', 2.38, -1.02, { gait:'walk' }), null);
            if(!pr || pr.seen){ R._cause = 'sight'; R.w.reset(100, { cause:'sight', why:'He saw you reach for his laptop' }); R._cause = null; }
          }
          return;
        }
        return seize(it);
      }
    }
    // a wipe is running (or the legacy house): today's halt; the files are read in the collectEvidence wrap
    if(g._wipeTotal > 0 && !g._wipeDone) R.lap.press = 'halt';
    return orig.apply(this, arguments);
  };
}
function seize(it){
  const run = R;
  const hit = () => {
    if(R !== run || !v8() || G()._evLaptop) return;
    const g = G();
    R.wipe.mode = 'seized';
    g._wipeTotal = R.wipe.pending || g._wipeTotal || 1; g._wipeT = 0; g._wipeDone = true;   // "Pull the plug early" resolves (0 %)
    if(typeof hideMeter === 'function') hideMeter('wipe');
    drawLaptopScreen('seized', 0);
    toast(TXT.seized[0], TXT.seized[1], 2400);
    applyEffect({ intel:+12 });
    if(typeof unlock === 'function') unlock('pulled_plug');
    R.lap.press = 'seize';
    collectEvidence({ id:'laptop', name:'Encrypted Laptop', xp:80 });
    g._evLaptop = true;
    const mk = (ENGINE.evidenceMarkers || []).find(m => m.id === 'ev_laptop'); if(mk && mk.let_collected) mk.let_collected();
    completeObjective('o4_wipe');
    if(typeof refreshEvidenceCount === 'function') refreshEvidenceCount();
    if(typeof shakeCamera === 'function') shakeCamera(0.05);
    it.consumed = true;
  };
  playInteraction({ spot:[2.38,-1.02], face:Math.PI/2, clip:'interact', hitAt:0.95, dur:1.9, target:[3.05,0.86,-1.05], camBack:1.35, camSide:0.7, camUp:1.68,
    onHit:() => safe(hit) });
}
function recordLaptop(outcome, pct, files){
  if(R.lap.outcome) return;
  R.lap.outcome = outcome; R.lap.pct = pct; R.lap.files = files.length;
  const f = flags(); f.m3_files = files.slice(); f.m3_wipe_pct = pct;
  log('enc', { enc:'m3_laptop', outcome, pct, files:files.length, ledger:files.includes('ledger_q3.xlsx'), total:R.wipe.pending || G()._wipeTotal || null,
    firstAt:R.lap.firstAt, armedAt:R.wipe.armedAt != null ? r1(R.wipe.armedAt) : null, mg:!!R.lap.mg });
}
W('collectEvidence', orig => function(ev){
  const r = orig.apply(this, arguments);
  try{
    if(ev && ev.id === 'laptop' && inM3() && R.lap.press && !R.lap.outcome){
      const g = G(), press = R.lap.press; R.lap.press = null;
      // only a real halt (the wipe was running and the press stopped it) or a seizure
      if(press === 'seize' || (press === 'halt' && g._wipeDone && g._wipeTotal > 0 && !g._wipeLost)){
        const pct = press === 'seize' ? 0 : Math.round(100 * Math.min(1, (g._wipeT || 0) / g._wipeTotal));
        const files = press === 'seize' ? cfg.shred.map(f => f[0]) : survivors(pct);
        recordLaptop(press === 'seize' ? 'never_started' : 'halted', pct, files);
        if(typeof I === 'function'){
          const it = I().items && I().items.laptop;
          if(it && Array.isArray(it.custody) && !it.custody.some(c => /files recovered/.test(c.t || ''))) it.custody.push({ t:`Imaged by forensics: ${files.length} of 7 files recovered` });
        }
      }
    }
  }catch(e){ err(e); }
  return r;
});
// the halted and seized screens: two columns (the 512 × 336 canvas has no room for 7 more lines below today's layout)
function drawFiles(state, pct){
  const M = ENGINE._mansion; if(!M || !M.screen) return;
  M.screenState = state;
  const { x, c, tex } = M.screen, Wd = c.width, H = c.height;
  const files = state === 'seized' ? cfg.shred.map(f => f[0]) : survivors(pct);
  x.save(); x.translate(Wd, 0); x.scale(-1, 1);
  x.fillStyle = '#0a1020'; x.fillRect(0, 0, Wd, H);
  x.textBaseline = 'top'; x.textAlign = 'left';
  x.fillStyle = '#21c063'; x.fillRect(0, 0, Wd, 52);
  x.fillStyle = '#04140a'; x.font = '700 26px Oswald, Arial Narrow, sans-serif';
  x.fillText(state === 'seized' ? 'SEIZED · ALL FILES' : 'WIPE HALTED · POWER CUT', 20, 12);
  x.fillStyle = '#e8f6ee'; x.font = '700 56px Oswald, Arial Narrow, sans-serif'; x.fillText(pct + '%', 20, 66);
  x.font = '500 16px Inter, Arial, sans-serif';
  x.fillText('Drive imaged by', 20, 144); x.fillText('NACECA forensics', 20, 165);
  x.fillText(files.length + ' of 7 files', 20, 198);
  const sum = state === 'seized' ? ['Nothing was shredded.'] : pct < 40 ? ['Most of the ledger', 'survived.'] : pct < 75 ? ['Partial recovery', 'possible.'] : ['Barely anything', 'left.'];
  sum.forEach((s, i) => x.fillText(s, 20, 230 + i * 21));
  x.fillStyle = 'rgba(232,246,238,.25)'; x.fillRect(222, 66, 2, 250);
  x.font = '500 17px JetBrains Mono, monospace';
  cfg.shred.forEach(([n], i) => {
    const y = 68 + i * 36, ok = files.includes(n);
    x.fillStyle = ok ? '#e8f6ee' : '#5f6b7a'; x.fillText(n, 240, y);
    if(!ok){ const w = x.measureText ? (x.measureText(n).width || 200) : 200; x.fillRect(238, y + 9, w + 4, 2); }
  });
  x.restore();
  tex.needsUpdate = true;
}
W('drawLaptopScreen', orig => function(state, pct){
  try{
    if(v8() && R.M.screen){
      if(state === 'wiping' && R.wipe.mode !== 'armed') return;           // no SECURE ERASE before a wipe exists
      if(state === 'halted' || state === 'seized'){ drawFiles(state, +pct || 0); return; }
    }
  }catch(e){ err(e); }
  return orig.apply(this, arguments);
});

/* ---------- Obi's interactable: PLAN FIRST, the grab, the arrest that fits how he was stopped ---------- */
function patchObi(){
  const it = R.its.obi; if(!it || it._tacObi) return;
  it._tacObi = true;
  const orig = it.onInteract;
  it.onInteract = function(){
    const g = G();
    if(!g._mansionPreBriefed){ toast(TXT.planFirst[0], TXT.planFirst[1]); return; }
    if(!v8() || mc().arrest) return orig.apply(this, arguments);
    const o = R.obi;
    if(o.state === 'out_back') return;
    if(R.live && FREE.has(o.state)){
      if(o.state === 'running'){ if(dist(P(), R.M.obi.position) > cfg.stopR + 0.05) return; stop('intercepted', 'kelechi'); }
      else if(o.state === 'unaware' || o.state === 'noticed') stop('cold', 'kelechi');
      else if(o.state === 'reaching') stop(R.t - o.alarmAt < cfg.thumb - 1e-6 ? 'beat_thumb' : 'intercepted', 'kelechi');
      else stop('stun_grab', 'kelechi');
    }
    const self = this, args = arguments;
    return arrestVariant(() => orig.apply(self, args));
  };
}
// four choices in the house (the informant deal without Crisis Negotiator only for a cold catch or beat-the-thumb);
// two after the perimeter. A per-press clone; the original is back as soon as the dialogue has its script.
function arrestVariant(fn){
  const base = typeof DIALOGUE !== 'undefined' && DIALOGUE.mansion_arrest, oc = R && R.obi.outcome;
  if(!Array.isArray(base) || !oc || !(oc === 'perimeter' || oc === 'cold' || oc === 'beat_thumb')) return fn();
  const v = JSON.parse(JSON.stringify(base)), last = v[v.length - 1];
  if(!last || !Array.isArray(last.choices)) return fn();
  if(oc === 'perimeter') last.choices = last.choices.filter(c => c && c.flag && (c.flag.arrest === 'professional' || c.flag.arrest === 'forceful'));
  else last.choices.forEach(c => { if(c && c.requires === 'crisis') delete c.requires; });
  DIALOGUE.mansion_arrest = v;
  try{ return fn(); } finally { DIALOGUE.mansion_arrest = base; }
}

/* ---------- the child: replaced (the base callback always completes o5, art_pass_v8.js:1742; scenes/mansion.js:206) ---------- */
function patchChild(){
  const it = R.its.child; if(!it || it._tacChild) return;
  it._tacChild = true;
  it.onInteract = function(){
    if(!inM3()) return;
    const C = R.child, run = R;
    if(C.state === 'out'){ toast('SAFE', 'Child handed off to family liaison'); return; }
    if(C.state === 'walking' || C.state === 'escort') return;
    if(C.state === 'stay'){
      startDialogue('tac_m3_walk', () => { if(R !== run || !inM3() || C.state !== 'stay') return; C.state = 'walking'; childWalk('kelechi'); });
      return;
    }
    startDialogue('mansion_civilian', () => {
      if(R !== run || !inM3()) return;
      C.spoken = true;
      if(mc().rescued){                                   // "Take her hand gently": counted at the choice (util.js:46)
        C.choice = 'gentle'; C.counted = true; C.gentle = true; C.state = 'walking';
        if(R.variant === 'v8'){ safe(() => R.M.child.userData.anim.play('idle', { fade:0.3 })); setTimeout(() => { if(R === run && inM3() && C.state === 'walking') childWalk('kelechi'); }, 500); }
        else childWalk('kelechi');
      } else {
        C.choice = 'stay'; C.state = 'stay'; it.label = 'Walk her out';
        if(typeof WAY !== 'undefined' && WAY.invalidate) WAY.invalidate();
      }
    });
  };
}
function childWalk(by){
  const C = R.child; C.by = by;
  if(R.variant !== 'v8'){                                 // the legacy house moves her outside at once, as it always did
    const m = R.its.child && R.its.child.mesh; if(m && m.position){ m.position.x = 0.5; m.position.z = 8.5; }
    childOut(by);
    return;
  }
  const ch = R.M.child, run = R;
  if(typeof startWalker === 'function') startWalker(ch, cfg.childPath.map(p => p.slice()), cfg.childV, () => { if(R === run && ch) ch.rotation.y = 0.2; });
}
function childOut(by){
  const C = R.child; if(C.state === 'out') return;
  C.state = 'out'; C.by = by; C.outAt = r1(R.t);
  const g = G(); g._civChild = true; completeObjective('o5_civ');
  if(!C.counted){ g.civiliansRescued = (g.civiliansRescued || 0) + 1; C.counted = true; }
  if(by === 'uche'){
    if(C.choice === 'stay') flags().child_by = 'uche';                      // her kindness was not Kelechi's: no child_gentle
    else if(!C.spoken){ flags().child_gentle = true; mc().child_gentle = true; C.gentle = true; }
  }
  log('enc', { enc:'m3_child', choice:C.choice, by, calm:!!R.known.civ, outAt:C.outAt, gentle:!!C.gentle });
  if(typeof WAY !== 'undefined' && WAY.invalidate) WAY.invalidate();
}

/* ---------- the extraction: the arrest AND the child outside; the plan paid honestly ---------- */
function patchExtract(){
  const it = R.its.ex; if(!it || it._tacEx) return;
  it._tacEx = true;
  const prev = it.onInteract;                              // v12's wrap (the payoff, now skipped) around the base
  it.onInteract = function(){
    if(!inM3()) return prev.apply(this, arguments);
    if(R.extract.pending) return;                          // REVIEW C-3: the payoff's 1.5 s delay is running; one completion
    const g = G(), missing = [];
    if(!mc().arrest) missing.push('arrest');
    if(R.child.state !== 'out') missing.push('child');
    if(missing.length){
      R.extract.refusals++; R.extract.missing = missing;
      const t = missing[0] === 'arrest' ? TXT.needArrest : TXT.needChild; toast(t[0], t[1]);
      return;
    }
    let delay = 0;
    if(g._plan && !g._planPaid){
      g._planPaid = true;                                  // v12's knowledge-only +1 (v12_plan.js:192) never pays
      if(g._plan.uche === 'rear' && (R.variant !== 'v8' || R.uche.postedAtStop)){
        g.arrests = (g.arrests || 0) + 1; applyEffect({ intel:+6 }); delay = 1500;
        if(R.variant === 'v8') toast('UCHE AT THE BACK', 'One of the upstairs men tried the kitchen door, straight into Uche.', 2600);
        else toast('UCHE AT THE BACK WALL', 'One of the upstairs men went over the wall — straight into Uche.', 2600);
      }
    }
    if(!R.lap.outcome){
      R.lap.outcome = 'abandoned';
      log('enc', { enc:'m3_laptop', outcome:'abandoned', pct:g._wipeTotal ? Math.round(100 * Math.min(1, (g._wipeT || 0) / g._wipeTotal)) : 0, files:0, ledger:false,
        total:R.wipe.pending || g._wipeTotal || null, firstAt:R.lap.firstAt, armedAt:R.wipe.armedAt != null ? r1(R.wipe.armedAt) : null, mg:!!R.lap.mg });
    }
    const self = this, args = arguments, run = R;
    if(delay){
      R.extract.pending = true;
      // the latch stays set once the operation has completed (R is dropped at the next scene); only a throw re-opens it
      setTimeout(() => { if(R !== run || !inM3()) return; let ok = false; try{ prev.apply(self, args); ok = true; } finally { if(!ok && R === run) R.extract.pending = false; } }, delay);
      return;
    }
    return prev.apply(this, arguments);
  };
}

/* =================================================================================================
   3 · The breach: startMansionWipe (v12_plan.js:157) is wrapped and never called in the art-pass house
   (it toasts LAPTOP WIPE RUNNING). The wipe stays pending (_wipeTotal 0) until the entry rule arms it.
   ================================================================================================= */
W('startMansionWipe', orig => function(){
  if(!inM3()) return orig.apply(this, arguments);
  if(!v8()){                                             // the legacy house: the wipe starts at the briefing, as today
    const r = orig.apply(this, arguments);
    safe(legacyEntry);
    return r;
  }
  safe(breach);
});
function legacyEntry(){
  const g = G(), Pl = g._plan || {}, K = Pl.known || {};
  R.plan = Pl; R.known = K; R.live = true;
  R.entry = (g.flags && g.flags.entry) || mc().entry || 'knock';
  R.quiet = R.entry === 'quiet'; R.door = 'front'; R.power = Pl.power === 'cut' ? 'cut' : 'on'; R.uchePlan = Pl.uche === 'rear' ? 'rear' : 'with';
  R.wipe.pending = g._wipeTotal || 0; R.wipe.mode = g._wipeTotal ? 'armed' : 'off'; R.wipe.armedAt = 0;
  const p = ENGINE.player && ENGINE.player.position;
  log('enc', { enc:'m3_entry', entry:R.entry, door:'front', power:R.power, uche:R.uchePlan, leak:false, armed:!!g._wipeTotal,
    spawn:p ? [r1(p.x), r1(p.z)] : null, wipeTotal:g._wipeTotal || null, variant:'legacy', prep:prep(),
    def:{ entry:R.entry === (K.gate ? 'quiet' : 'knock'), power:Pl.power !== 'cut' } });
}
const DIM = { on:false };
function dim(on){
  if(typeof MANSION === 'undefined' || !MANSION.mats) return;
  for(const k of Object.keys(MANSION.mats)){ const m = MANSION.mats[k]; if(m && typeof m === 'object' && 'lightMapIntensity' in m) m.lightMapIntensity = on ? cfg.dark * MANSION.lmMax : MANSION.lmMax; }
  DIM.on = !!on;
}
const LAMPS = [[-4.15,1.3],[3.28,-0.4],[-2.35,-0.4],[0,2.8],[0,6.0],[4.7,2.4]];
function lampsOff(){
  const kids = ENGINE.scene && ENGINE.scene.children;
  if(!Array.isArray(kids)) return;
  for(const l of kids){
    if(!l || l.isPointLight !== true || typeof l.intensity !== 'number' || !l.position) continue;
    if(LAMPS.some(([x, z]) => Math.abs(l.position.x - x) < 0.01 && Math.abs(l.position.z - z) < 0.01)) l.intensity = 0;
  }
}
function placeUche(at, yaw){ const u = R.M.uche; u.position.x = at[0]; u.position.z = at[1]; if(yaw != null) u.rotation.y = yaw; ucheClip('idle'); }
function breach(){
  const g = G(), Pl = g._plan || {}, K = Pl.known || {};
  R.plan = Pl; R.known = K;
  R.entry = (g.flags && g.flags.entry) || mc().entry || 'knock';
  R.quiet = R.entry === 'quiet'; R.door = R.quiet && K.gate ? 'gate' : 'front';
  R.power = Pl.power === 'cut' ? 'cut' : 'on'; R.uchePlan = Pl.uche === 'rear' ? 'rear' : 'with';
  R.leak = leakNow() && R.quiet;
  R.wipe.pending = wipeFor(); R.wipe.mode = 'pending';
  g._wipeTotal = 0; g._wipeT = 0; g._wipeDone = false; g._wipeLost = false;
  if(typeof hideMeter === 'function') hideMeter('wipe');
  const key = R.door === 'gate' ? 'gate' : R.entry, sp = cfg.spawn[key] || cfg.spawn.knock;
  R.spawn = sp;
  // the card shows: nothing moves under it, and the camera starts behind you at the entry (no swoop)
  ENGINE.movementEnabled = false;
  const p = ENGINE.player; p.position.x = sp[0]; p.position.z = sp[1]; p.rotation.y = sp[2];
  ENGINE.playerYaw = sp[2]; ENGINE.cameraYaw = sp[2];
  if(typeof resetCameraFollow === 'function') resetCameraFollow();
  if(TAC.player && TAC.player._reset) TAC.player._reset();
  const U = R.uche;
  U.mode = (R.uchePlan === 'rear' || key === 'gate') ? 'post' : key === 'quiet' ? 'hold' : 'follow';
  placeUche(cfg.ucheAt[U.mode], U.mode === 'post' ? 0 : Math.PI);
  if(R.its.uche) R.its.uche.consumed = true;            // "Plan the raid" stops taking ACTION once he follows (C-M10)
  if(R.power === 'cut'){ dim(true); safe(lampsOff); }
  safe(() => TAC.sight.lights({ ambient:R.power === 'cut' ? 'dark' : 'lit', lamps:[] }));
  safe(() => TAC.sight.zones(cfg.zones));
  setObi(R.entry === 'knock' ? 'startled' : R.entry === 'loud' ? 'stunned' : 'unaware');
  const lines = ({ knock:['KNOCK AND ANNOUNCE', '21:32'], loud:['LOUD BREACH', '21:32'], quiet:['THE FRONT DOOR', '21:31'], gate:['THE SIDE GATE', '21:34'] })[key].slice();
  if(R.power === 'cut') lines.push('THE GENERATOR GOES QUIET');
  R.card = true;
  const run = R;
  if(typeof titleCard === 'function') titleCard(lines, cfg.card, () => { if(R === run && v8()) safe(start); });
  else start();
}
function start(){
  const K = R.known;
  R.card = false; R.live = true; R.t = 0; R.obi.t0 = 0;
  if(R.entry === 'knock' || R.entry === 'loud') R.obi.alertedBy = R.entry;   // what woke him (never a `seen` cause)
  ENGINE.movementEnabled = true;
  if(R.entry === 'loud'){ arm(); if(typeof shakeCamera === 'function') shakeCamera(0.12); }
  if(R.entry === 'knock') say(K.warrant ? 'NACECA! Search warrant: open the door!' : 'NACECA! Open up!', 'm3_knock', 1, 4000);
  if(R.wipe.mode === 'pending') o4Text('Seize the laptop');           // until a wipe exists (arm() puts "Stop laptop wipe" back)
  log('enc', { enc:'m3_entry', entry:R.entry, door:R.door, power:R.power, uche:R.uchePlan, leak:!!R.leak, armed:R.wipe.mode === 'armed',
    spawn:[R.spawn[0], R.spawn[1]], wipeTotal:R.wipe.pending, variant:'v8', prep:prep(),
    def:{ entry:R.entry === (K.gate ? 'quiet' : 'knock'), power:(R.plan || {}).power !== 'cut' } });
  if(typeof WAY !== 'undefined' && WAY.invalidate) WAY.invalidate();
}
function o4Text(t){
  const o = ((G() && G().objectives) || []).find(x => x.id === 'o4_wipe');
  if(o && !o.done && o.text !== t){ o.text = t; if(typeof renderObjectives === 'function') renderObjectives(); }
}
function arm(){
  if(R.wipe.mode !== 'pending') return;
  const g = G();
  R.wipe.mode = 'armed'; R.wipe.armedAt = R.t;
  g._wipeTotal = R.wipe.pending; g._wipeT = 0; g._wipeDone = false; g._wipeLost = false;
  o4Text('Stop laptop wipe');
}

/* =================================================================================================
   4 · Obi: the watcher (quiet entries), the reach, the run, the stop
   ================================================================================================= */
function obiYaw(){
  const M = R && R.M; if(!M) return -Math.PI / 2;
  return R.leak ? Math.atan2(0 - M.obi.position.x, 4.0 - M.obi.position.z) : -Math.PI / 2;
}
function setObi(st){
  const o = R.obi; if(o.state === st) return;
  o.state = st; o.t0 = R.t;
  if(!o.first && st !== 'idle') o.first = st;
  if(o.states.length < 8) o.states.push([st, r1(R.t)]);
  const a = R.M && R.M.obi && R.M.obi.userData && R.M.obi.userData.anim;
  if(a && CLIP[st]) safe(() => a.play(CLIP[st], { fade:0.25 }));
}
function onObiLevel(lv, st){
  if(!v8() || !R.live) return;
  if(lv === 'notice'){ R.notices++; if(R.obi.state === 'unaware') setObi('noticed'); }
  else if(lv === 'calm'){ if(R.obi.state === 'noticed') setObi('unaware'); }
  else if(lv === 'alarm') alarm(R._cause || st.cause || 'sight', st.whyPast || '');
}
function alarm(cause, why){
  const o = R.obi; if(o.state !== 'unaware' && o.state !== 'noticed') return;
  o.alarmAt = R.t; o.alertedBy = cause; R.alarms++;
  if(R.causes[cause] != null) R.causes[cause]++;
  toast(cause === 'noise' ? 'HE HEARD YOU' : cause === 'close' ? 'TOO CLOSE' : 'HE SAW YOU', why, 2600);   // the frozen line verbatim (DESIGN §3.6)
  setObi('reaching');
}
const obiSpeed = () => cfg.obiV * Math.min(1, typeof chaseRate === 'function' ? chaseRate() : 1) * ((typeof SETTINGS !== 'undefined' && SETTINGS.timed === 'extended') ? 0.8 : 1);
const inCorr = p => Math.abs(+p.x) < cfg.cornerX && +p.z < cfg.cornerZ;
function corneredBy(){
  if(inCorr(P())) return 'kelechi';
  const u = R.M.uche.position, o = R.M.obi.position;
  if(R.uche.mode === 'follow' && !R.uche.job && inCorr(u) && losTo(o, cfg.eyeH, u, 1.45).clear) return 'uche';
  return null;
}
function obiBox(){
  const o = R.M.obi.position;
  return (ENGINE.obstacles || []).findIndex(b => b && Math.abs((b.minX + b.maxX) / 2 - o.x) < 0.02 && Math.abs((b.minZ + b.maxZ) / 2 - o.z) < 0.02 && Math.abs(b.maxX - b.minX - 0.5) < 0.02);
}
// REVIEW C-6: his 0.5 m box is lifted while he runs; once he is stopped (in the house, or kneeling on the drive) it comes
// back where he stands (TAC.geo.add, DESIGN §3.3: a 'person' box, so it never hides anyone), as soon as Kelechi is
// clear of it (never shut him inside a collider). It goes again at the arrest.
const BOX = 0.5, BOXCLEAR = 0.25 + 0.35;
function obiBoxBack(){
  const o = R.obi;
  if(!o.boxOut || o.box || o.arrested || !o.outcome || mc().arrest || R.M.obi.visible === false) return;
  const m = R.M.obi.position, p = P();
  if(Math.abs(p.x - m.x) < BOXCLEAR && Math.abs(p.z - m.z) < BOXCLEAR) return;
  o.box = safe(() => TAC.geo.add(m.x, m.z, BOX, BOX, { kind:'person', h:0, name:'Obi' }), null) || null;
}
function obiBoxDrop(){
  const o = R.obi, b = o.box; if(!b) return;
  o.box = null;
  const i = (ENGINE.obstacles || []).indexOf(b); if(i >= 0) ENGINE.obstacles.splice(i, 1);
}
function startRun(){
  const o = R.obi; if(!FREE.has(o.state) || o.state === 'running') return;
  if(R.wipe.mode === 'pending') arm();
  // timers off (REVIEW C-4): he gives up where he stands. Nobody cornered him, so `by` is null and the payload says why;
  // a distinct outcome value (e.g. 'gave_up') needs a DESIGN §4 row from the lead first
  if(typeof SETTINGS !== 'undefined' && SETTINGS.timed === 'off'){ toast('HANDS UP', 'He gives up where he stands.', 2200); stop('cornered', null, null, { timers:'off' }); return; }
  const by = corneredBy();
  if(by){ toast('CORNERED', by === 'kelechi' ? 'You were in the corridor. He put his hands up.' : 'Uche was in the corridor. He put his hands up.', 2200); stop('cornered', by); return; }
  const i = obiBox(); if(i >= 0){ ENGINE.obstacles.splice(i, 1); o.boxOut = true; }
  o.runAt = R.t; o.seg = 0; o.ranM = 0;
  setObi('running');
  TAC.state.pursuit = 'm3_flight';
  const it = R.its.obi; if(it){ it.label = 'Stop him'; it.range = cfg.stopR; }
  say(TXT.run, 'm3_run', 3, 4000);                       // said first: it cuts a showing knock line at once (a keyed pri 1)
  safe(() => TAC.radio.cancel('m3_knock'));                // and a knock line still waiting never plays
  if(R.uche.mode === 'hold') R.uche.mode = 'follow';
  if(typeof WAY !== 'undefined' && WAY.invalidate) WAY.invalidate();
}
function restoreObiIt(){
  const it = R.its.obi; if(!it) return;
  it.label = 'Move on suspect'; it.range = it._tacRange || cfg.arrestR;
}
const mgOpen = () => !!(typeof MINI !== 'undefined' && MINI.active && MINI.active.cfg && MINI.active.cfg.id === 'm3_wipe');
function stop(outcome, by, st, extra){
  const o = R.obi; if(o.outcome) return false;
  if(o.state === 'running' && o.runAt != null) o.runSecs = R.t - o.runAt;
  else if(o.outAt != null && o.runAt != null) o.runSecs = o.outAt - o.runAt;
  o.outcome = outcome; o.by = by; o.stopAt = R.t;
  o.dist = dist(P(), R.M.obi.position);
  R.uche.postedAtStop = R.uche.mode === 'post';
  if(R.wipe.mode === 'pending') R.wipe.mode = 'never';
  setObi(st || 'handsup');
  if(TAC.state.pursuit === 'm3_flight') TAC.state.pursuit = null;
  restoreObiIt();
  if(R.uche.mode === 'hold') R.uche.mode = 'follow';
  // REVIEW C-2: he is stopped, so "He's running" (and a knock line still waiting) must not play on; a line said just
  // before this call (the cover shout) is queued first and shows the moment the run line goes
  safe(() => { TAC.radio.cancel('m3_run'); TAC.radio.cancel('m3_knock'); });
  if(by === 'kelechi' && outcome !== 'cornered') toast(TXT.gotHim[0], TXT.gotHim[1], 2200);
  log('enc', Object.assign({ enc:'m3_obi', outcome, by, alertedBy:o.alertedBy, secs:r1(R.t), runSecs:o.runSecs != null ? r1(o.runSecs) : null, ranM:r1(o.ranM),
    dist:r1(o.dist), duringMinigame:mgOpen(), states:o.states.slice(0, 8), ucheJob:R.uche.job || R.uche.lastJob || null, prep:prep() }, extra || {}));
  if(typeof WAY !== 'undefined' && WAY.invalidate) WAY.invalidate();
  return true;
}
function outBack(){
  const o = R.obi;
  R.M.obi.visible = false; o.outAt = R.t;
  setObi('out_back');
  if(TAC.state.pursuit === 'm3_flight') TAC.state.pursuit = null;
  restoreObiIt();
  say(TXT.out, 'm3_out', 3, 5000);                       // queued ahead of the cancel, so it shows the moment the run line goes
  safe(() => TAC.radio.cancel('m3_run'));                  // (REVIEW C-2: equal priorities never preempt each other)
  if(typeof WAY !== 'undefined' && WAY.invalidate) WAY.invalidate();
}
function perimeterDrop(){
  const m = R.M.obi;
  m.position.x = cfg.perimeter[0]; m.position.z = cfg.perimeter[1]; m.rotation.y = Math.PI; m.visible = true;
  stop('perimeter', 'perimeter', 'perimeter');
  say(TXT.perim, 'm3_perim', 3, 10000);                  // the chase's outcome: never left waiting behind a news bulletin
}
// decisions, 10 Hz
function obiDecide(){
  const o = R.obi, el = R.t - o.t0;
  if(o.state === 'startled'){
    if(R.t >= cfg.knockThumb - 1e-6) arm();
    if(R.t >= cfg.knockRun - 1e-6) startRun();
  } else if(o.state === 'stunned'){
    if(el >= cfg.loudStun - 1e-6) startRun();
  } else if(o.state === 'reaching'){
    const a = R.t - o.alarmAt;
    if(a >= cfg.thumb - 1e-6) arm();
    if(a >= cfg.quietRun - 1e-6) startRun();
  } else if(o.state === 'out_back'){
    if(R.t - o.outAt >= cfg.perimSecs - 1e-6) perimeterDrop();
  }
  if(!o.arrested && !mc().arrest) obiBoxBack();
  if(!o.arrested && mc().arrest){
    o.arrested = true;
    obiBoxDrop();
    if(o.states.length < 8) o.states.push(['arrested', r1(R.t)]);
    const U = R.uche;
    if(U.job === 'cover'){ R.uche.acts.push('cover_held'); log('ally_done', { who:'uche', task:'cover_held', outcome:'done', secs:r1(R.t - U.jobAt) }); U.lastJob = U.job; U.job = null; U.mode = 'follow'; }
    if(U.job === 'tackle'){ U.lastJob = U.job; U.job = null; U.mode = 'follow'; }
  }
}
// positions, every frame (and the catches, so a 10 Hz step can't carry him past you)
function obiFrame(dt){
  const o = R.obi, M = R.M;
  if(o.state === 'unaware' || o.state === 'noticed'){ M.obi.rotation.y = obiYaw() + ((R.w && R.w.state.glance) || 0); return; }
  if(o.state === 'reaching' && dist(P(), M.obi.position) < cfg.catchR){ stop(R.t - o.alarmAt < cfg.thumb - 1e-6 ? 'beat_thumb' : 'intercepted', 'kelechi'); return; }
  if(o.state !== 'running') return;
  const F = cfg.flee, m = M.obi.position;
  let step = obiSpeed() * dt;
  while(step > 1e-9 && o.seg < F.length - 1){
    const tg = F[o.seg + 1], dx = tg[0] - m.x, dz = tg[1] - m.z, L = hyp(dx, dz);
    if(L > 1e-9) M.obi.rotation.y = Math.atan2(dx, dz);
    if(L <= step){ m.x = tg[0]; m.z = tg[1]; o.seg++; step -= L; o.ranM += L; }
    else { m.x += dx / L * step; m.z += dz / L * step; o.ranM += step; step = 0; }
  }
  if(dist(P(), m) < cfg.catchR){ stop('intercepted', 'kelechi'); return; }
  const U = R.uche, u = M.uche.position;
  if(U.mode === 'post' && !U.job && dist(u, m) < cfg.tackleR){
    stop('tackled', 'uche', 'down');
    U.job = 'tackle'; U.jobAt = R.t; ucheClip('kneel');
    R.uche.acts.push('tackle');
    log('ally_done', { who:'uche', task:'tackle', outcome:'done', secs:r1(R.t), d:r1(dist(P(), m)) });
    toast('UCHE HAS HIM', 'He ran straight into Uche at the kitchen door.', 2200);
    return;
  }
  if(o.seg >= F.length - 1) outBack();
}

/* =================================================================================================
   5 · Uche: follow on the waypoint graph, hold the porch, hold the kitchen door, one job at a time
   ================================================================================================= */
const NODE = cfg.nodes, NAMES = Object.keys(NODE);
const ADJ = (() => { const a = {}; for(const n of NAMES) a[n] = []; for(const [x, y] of cfg.edges){ a[x].push(y); a[y].push(x); } return a; })();
const ndist = (a, b) => hyp(NODE[a][0] - NODE[b][0], NODE[a][1] - NODE[b][1]);
function graphPath(s, g){
  const D = {}, prev = {}, todo = new Set(NAMES);
  for(const n of NAMES) D[n] = Infinity; D[s] = 0;
  while(todo.size){
    let u = null; for(const n of todo) if(u === null || D[n] < D[u]) u = n;
    if(D[u] === Infinity) break;
    todo.delete(u); if(u === g) break;
    for(const v of ADJ[u]){ const d = D[u] + ndist(u, v); if(d < D[v]){ D[v] = d; prev[v] = u; } }
  }
  if(D[g] === Infinity) return null;
  const out = []; for(let n = g; n; n = prev[n]) out.unshift(n);
  return out;
}
function nearestNode(p, needClear){
  let best = null, bd = Infinity;
  for(const n of NAMES){
    const d = hyp(NODE[n][0] - p.x, NODE[n][1] - p.z);
    if(d >= bd) continue;
    if(needClear && !segClear(p.x, p.z, NODE[n][0], NODE[n][1])) continue;
    best = n; bd = d;
  }
  return best;
}
// a route on the graph from where Uche stands to `to` (each leg clear at 0.25 m)
function routeTo(to){
  const u = R.M.uche.position;
  if(segClear(u.x, u.z, to[0], to[1])) return [to.slice()];
  const s = nearestNode(u, true) || nearestNode(u, false), gN = nearestNode({ x:to[0], z:to[1] }, true) || nearestNode({ x:to[0], z:to[1] }, false);
  const path = (s && gN) ? graphPath(s, gN) : null;
  if(!path) return [to.slice()];
  const pts = path.map(n => NODE[n].slice());
  // skip the first nodes he can already cut past
  while(pts.length > 1 && segClear(u.x, u.z, pts[1][0], pts[1][1])) pts.shift();
  pts.push(to.slice());
  return pts;
}
function ucheClip(c){
  const U = R.uche; if(U.clip === c) return; U.clip = c;
  const a = R.M.uche.userData && R.M.uche.userData.anim; if(a) safe(() => a.play(c, { fade:0.22 }));
}
function followDecide(){
  const U = R.uche, u = R.M.uche.position, p = P(), d = dist(u, p);
  const crouch = TAC.player.crouch();
  U.speed = (crouch && d < 4) ? cfg.ucheSneak : d > 3.2 ? cfg.ucheRun : cfg.ucheJog;
  const clear = segClear(u.x, u.z, p.x, p.z);
  if(clear){
    if(d <= cfg.follow[1]){ U.path = []; return; }                     // in the band, or closer: he stands (no collision with you)
    const k = (d - 2.15) / d; U.path = [[u.x + (p.x - u.x) * k, u.z + (p.z - u.z) * k]]; return;
  }
  // round a corner: along the graph to the node nearest you that has a clear line to you
  let best = null, bd = Infinity;
  for(const n of NAMES){ const q = NODE[n], dd = hyp(q[0] - p.x, q[1] - p.z); if(dd < bd && segClear(q[0], q[1], p.x, p.z)){ best = n; bd = dd; } }
  if(!best){ U.path = []; return; }
  const pts = routeTo(NODE[best]);
  U.path = pts;
}
// REVIEW C-10: Kelechi took her out himself while Uche was on his way: the job ends, and the log says so (DESIGN §4)
function escortCancelled(){
  const U = R.uche; if(U.job !== 'take_child') return;
  log('ally_done', { who:'uche', task:'escort', outcome:'cancelled', secs:r1(R.t - (U.jobAt || 0)) });
  U.job = null; U.mode = 'follow'; U.path = []; U.onArrive = null;
}
function ucheDecide(){
  const U = R.uche, o = R.obi, C = R.child;
  if(U.job === 'take_child' && (C.state === 'walking' || (C.state === 'out' && C.by !== 'uche'))) escortCancelled();
  if(U.mode === 'hold' && !(o.state === 'unaware' || o.state === 'noticed')) U.mode = 'follow';
  if(U.job === 'cover'){ U.path = []; const om = R.M.obi.position, u = R.M.uche.position; R.M.uche.rotation.y = Math.atan2(om.x - u.x, om.z - u.z); return; }
  if(U.job) return;
  if(U.mode === 'follow') followDecide();
}
function ucheFrame(dt){
  const U = R.uche, u = R.M.uche.position;
  if(U.path && U.path.length){
    let step = U.speed * dt;
    while(step > 1e-9 && U.path.length){
      const tg = U.path[0], dx = tg[0] - u.x, dz = tg[1] - u.z, L = hyp(dx, dz);
      if(L > 1e-6) R.M.uche.rotation.y = Math.atan2(dx, dz);
      if(L <= step){ u.x = tg[0]; u.z = tg[1]; U.path.shift(); step -= L; }
      else { u.x += dx / L * step; u.z += dz / L * step; step = 0; }
    }
    ucheClip(U.job === 'take_child' && R.child.state === 'escort' ? 'walk' : U.speed <= cfg.ucheSneak + 1e-6 ? 'sneak' : 'jog');
    if(!U.path.length && U.onArrive){ const f = U.onArrive; U.onArrive = null; safe(f); }
  } else if(U.job === 'cover') ucheClip('aim');
  else if(U.job === 'tackle') ucheClip('kneel');
  else {
    ucheClip(U.mode === 'post' ? 'idle' : 'idle');
    if(U.mode === 'follow'){ const p = P(); if(dist(u, p) > 0.3) R.M.uche.rotation.y = Math.atan2(p.x - u.x, p.z - u.z); }
  }
  // the child walks hand in hand, half a step behind him
  if(U.job === 'take_child' && R.child.state === 'escort'){
    const c = R.M.child.position, yaw = R.M.uche.rotation.y, tx = u.x - Math.sin(yaw) * 0.55, tz = u.z - Math.cos(yaw) * 0.55;
    const dx = tx - c.x, dz = tz - c.z, L = hyp(dx, dz), st = 1.6 * dt;
    if(L > 1e-6){ const k = Math.min(1, st / L); c.x += dx * k; c.z += dz * k; R.M.child.rotation.y = Math.atan2(dx, dz); }
  }
}

/* ---------- jobs: COVER HIM, TAKE HER OUT (one at a time; no cards in Build 1) ---------- */
function ucheSeesObi(){
  const u = R.M.uche.position, o = R.M.obi.position;
  return R.M.obi.visible !== false && dist(u, o) <= cfg.coverSee && losTo(u, 1.6, o, 1.45).clear;
}
function offer(){
  if(!playing()) return null;
  const U = R.uche, o = R.obi, C = R.child;
  if(U.job === 'cover' || U.job === 'take_child') return { order:U.job, busy:true };
  if(U.job) return null;
  const d = dist(R.M.uche.position, R.M.obi.position);
  const coverCand = o.state === 'running' || ((o.state === 'startled' || o.state === 'stunned') && d <= cfg.coverR);
  if(coverCand && ucheSeesObi()) return { order:'cover', ok:true };
  if((C.state === 'in' || C.state === 'stay') && (R.known.civ || C.spoken) && o.state !== 'running'){
    if(R.quiet && (o.state === 'unaware' || o.state === 'noticed')) return { order:'take_child', ok:false, why:'unaware' };
    return { order:'take_child', ok:true };
  }
  return null;
}
function whyNot(id){
  const o = R.obi, C = R.child;
  if(R.uche.job) return 'busy';
  if(id === 'take_child'){
    if(o.state === 'running') return 'running';
    if(R.quiet && (o.state === 'unaware' || o.state === 'noticed') && (C.state === 'in' || C.state === 'stay')) return 'unaware';
    return 'no_sight';
  }
  return 'no_sight';
}
function order(id, src){
  if(!playing() || (id !== 'cover' && id !== 'take_child')) return false;
  src = src === 'key' ? 'key' : 'button';
  const o = offer();
  const base = { who:'uche', order:id, src, def:false, obi:R.obi.state, obj:curObj(), t:r1(R.t) };
  let why = null;
  if(R.uche.job) why = 'busy';
  else if(!o || o.order !== id) why = whyNot(id);
  else if(!o.ok) why = o.why || whyNot(id);
  if(why){
    log('order', Object.assign(base, { ok:false, why }));
    say(TXT.refuse[why] || TXT.refuse.no_sight, 'm3_order', 3, 4000);
    return false;
  }
  log('order', Object.assign(base, { ok:true }));
  R.uche.orders.push(id);
  const U = R.uche; U.job = id; U.jobAt = R.t; U.lastJob = id; U.path = []; U.onArrive = null;
  if(id === 'cover'){
    if(U.mode === 'hold') U.mode = 'follow';
    say(TXT.cover, 'm3_order', 3, 4000);                   // REVIEW C-2: queued first, so stop()'s cancel of the run line shows it
    stop('covered', 'uche');
    ucheClip('aim');
  } else {
    say(TXT.take, 'm3_order', 3, 4000);
    U.mode = 'follow';                                     // he leaves the porch or the kitchen door for her
    U.speed = cfg.ucheJog;
    U.path = routeTo(cfg.childPath[0]);
    const run = R;
    U.onArrive = () => {
      if(R !== run) return;
      const C = R.child; if(C.state === 'out' || C.state === 'walking'){ escortCancelled(); return; }
      C.state = 'escort'; C.by = 'uche';
      safe(() => R.M.child.userData.anim.play('walk', { fade:0.25, speed:cfg.childV / 1.35 }));
      U.speed = cfg.childV; U.path = cfg.childPath.slice(1).map(p => p.slice());
      U.onArrive = () => {
        if(R !== run) return;
        if(R.child.state !== 'out') childOut('uche');
        safe(() => R.M.child.userData.anim.play('idle', { fade:0.3 }));
        R.uche.acts.push('escort');
        log('ally_done', { who:'uche', task:'escort', outcome:'done', secs:r1(R.t - U.jobAt) });
        U.job = null; U.mode = 'follow';
      };
    };
  }
  uiUpdate(true);
  return true;
}
function press(src){
  const o = offer(); if(!o) return false;
  return order(o.order, src);
}

/* ---------- the UCHE button (touch, stacked above SCAN) and the Q · UCHE chip (desktop) ---------- */
const UI = { key:null };
function uiEnsure(){
  const ctx = document.getElementById('hud-ctx');
  if(!ctx || document.getElementById('ctx-uche-wrap')) return;
  const w = document.createElement('div'); w.id = 'ctx-uche-wrap'; w.className = 'tac-uche-wrap';
  w.innerHTML = '<span id="ctx-uche-tag" class="tac-uche-tag"></span><button class="ctx-small tac-uche-btn" id="ctx-uche" type="button" aria-label="Give Sgt. Uche an order"><span class="tac-uche-ico"></span><span class="tac-uche-l">UCHE</span></button>';
  ctx.insertBefore(w, ctx.firstChild);
  const b = w.querySelector('#ctx-uche');
  b.addEventListener('click', e => { e.stopPropagation(); safe(() => { if(ENGINE.movementEnabled && !overlay()) press('button'); }); });
  b.addEventListener('touchstart', e => { e.stopPropagation(); }, { passive:true });
  UI.key = null;
}
const JOB = { cover:['COVER HIM', 'COVERING', 'shield'], take_child:['TAKE HER OUT', 'ESCORTING', 'people'] };
function uiUpdate(force){
  // only an offered job (or COVERING / ESCORTING while busy) shows; a refused one (TAKE HER OUT while he is unaware on
  // a quiet entry) is hidden, and Q still answers with the reason on the radio (REVIEW C-5)
  const o0 = playing() ? offer() : null, o = (o0 && (o0.busy || o0.ok)) ? o0 : null;
  const key = o ? (o.busy ? 'b:' : o.ok ? 'o:' : 'r:') + o.order : '';
  const w = document.getElementById('ctx-uche-wrap');
  let chip = document.getElementById('tac-uche');
  if(!force && key === UI.key && (!o || (w && chip))) return;
  UI.key = key;
  const j = o ? JOB[o.order] : null, label = j ? (o.busy ? j[1] : j[0]) : '';
  if(document.body) document.body.classList.toggle('tac-uche-on', !!(o && w));
  if(w){
    w.classList.toggle('show', !!o);
    w.dataset.order = o ? o.order : '';
    const tag = w.querySelector('#ctx-uche-tag'), b = w.querySelector('#ctx-uche');
    if(tag) tag.textContent = label;
    if(b){ b.disabled = !!(o && o.busy); b.classList.toggle('busy', !!(o && o.busy)); const ic = b.querySelector('.tac-uche-ico'); if(ic) ic.innerHTML = ico(j ? j[2] : 'people'); }
  }
  if(o && !chip && document.getElementById('hud')){
    chip = document.createElement('div'); chip.id = 'tac-uche'; chip.className = 'tac-chip tac-uche-chip';
    TAC.ui.chipRow().appendChild(chip);
  }
  if(chip){
    chip.classList.toggle('show', !!o);
    if(o) chip.innerHTML = `${ico(j[2])} <span class="kbd tac-uche-key">Q</span> <span class="tac-chip-t">· UCHE</span> <span class="tac-chip-k">${label}</span>`;
  }
}
const isText = el => !!el && (el.tagName === 'TEXTAREA' || el.isContentEditable ||
  (el.tagName === 'INPUT' && !/^(button|checkbox|radio|range|submit|reset|color|file|image)$/i.test(el.type || '')));
window.addEventListener('keydown', ev => {
  try{
    if(ev.code !== 'KeyQ' || ev.repeat || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    if(isText(ev.target) || isText(document.activeElement)) return;
    if(!playing() || overlay() || mgOpen() || (typeof MINI !== 'undefined' && MINI.active)) return;
    if(document.body.classList.contains('v12-car') || !ENGINE.movementEnabled) return;
    if(press('key')) ev.preventDefault();
  }catch(e){ err(e); }
}, true);

/* =================================================================================================
   6 · The tracker, the minimap, the field skill, the headline, the grade, the files after the op
   ================================================================================================= */
if(window.WAY && typeof WAY.current === 'function' && !WAY.current._tac){
  const cur0 = WAY.current;
  const f = function(){
    const r = cur0.apply(this, arguments);
    try{
      if(r && v8() && R.live){
        const objs = G().objectives || [], g = G();
        const pick = id => { const o = objs.find(x => x.id === id && !x.done); return o || null; };
        const lapLive = !g._evLaptop && !g._wipeLost;
        let o = null;
        // on Obi while he is free, on every entry (REVIEW C-7: knock and loud no longer flick child → wipe → Obi in 2.5 s)
        if(FREE.has(R.obi.state)) o = pick('o6_arrest');
        if(!o && R.wipe.mode === 'armed' && lapLive) o = pick('o4_wipe');
        if(!o && R.child.choice === 'stay' && R.child.state !== 'out') o = lapLive ? pick('o4_wipe') : pick('o5_civ');
        if(o) r.obj = o;
      }
    }catch(e){ err(e); }
    return r;
  };
  f._tac = true; WAY.current = f;
}
if(window.WAY && typeof WAY.resolve === 'function' && !WAY.resolve._tac){
  const res0 = WAY.resolve;
  const f = function(){
    try{
      if(v8() && R.live && R.obi.state === 'running' && R.M.obi.visible !== false)
        return { pos:R.M.obi.position, mesh:R.M.obi, label:'Stop Obi', kind:'chase', mode:'live', catch:true };
    }catch(e){ err(e); }
    return res0.apply(this, arguments);
  };
  f._tac = true; WAY.resolve = f;
}
function pois(){
  const M = R.M, Q = R.pois;
  if(Q.obi){ if(M.obi.visible === false){ Q.obi.x = 1e6; Q.obi.z = 1e6; } else { Q.obi.x = M.obi.position.x; Q.obi.z = M.obi.position.z; } }
  if(Q.uche){ Q.uche.x = M.uche.position.x; Q.uche.z = M.uche.position.z; }
  if(Q.child){ Q.child.x = M.child.position.x; Q.child.z = M.child.position.z; }
}
// KILL THE WIPE is an overlay: its per-tick hook carries the whole mover (Obi, the perimeter timer, Uche, the child)
try{
  if(typeof MG_CFG !== 'undefined' && typeof MG_CFG.m3_wipe === 'function' && !MG_CFG.m3_wipe._tac){
    const mk = MG_CFG.m3_wipe;
    const f = function(){
      const c = mk.apply(this, arguments);
      try{
        if(v8() && R.live){
          R.lap.mg = true;
          if(R.obi.state === 'running') c.sub = (c.sub || '') + " He's still running while you work.";
          const ot = c.onTick, run = R;
          c.onTick = function(dt){
            const r = ot ? ot.apply(this, arguments) : undefined;
            try{ if(R === run && v8() && R.live) advance(+dt || 0); }catch(e){ err(e); }
            return r;
          };
        }
      }catch(e){ err(e); }
      return c;
    };
    f._tac = true; MG_CFG.m3_wipe = f;
  }
}catch(e){ err(e); }
// no "KILL THE WIPE" before a wipe exists (mqAttach reads ready() at press time, art_pass_v8.js:4050)
try{
  const hk = typeof MQ_HOOKS !== 'undefined' && MQ_HOOKS.m3 && MQ_HOOKS.m3.find(x => x && x.id === 'm3_wipe');
  if(hk && !hk._tac){ const r0 = hk.ready; hk.ready = () => !!(r0() && G()._wipeTotal); hk._tac = true; }
}catch(e){ err(e); }
W('generateHeadline', orig => function(){
  const h = orig.apply(this, arguments);
  try{
    if(inM3() && R.obi.outcome === 'perimeter' && h && !h.cw){
      const g = G(), r = S.player.reputation, force = (g.forceUsed || 0) - ((g._opStart && g._opStart.force) || 0);
      if(mc().arrest !== 'bribe' && force < 2 && r.integrity >= 35) return Object.assign({}, TXT.headline);
    }
  }catch(e){ err(e); }
  return h;
});
W('computeGrade', orig => function(){
  const r = orig.apply(this, arguments);
  try{
    if(r && inM3() && R.obi.outcome === 'perimeter'){
      const pts = r.pts + cfg.gradePerimeter;
      r.pts = Math.round(pts); r.g = pts >= 85 ? 'S' : pts >= 70 ? 'A' : pts >= 55 ? 'B' : pts >= 40 ? 'C' : 'D';
    }
  }catch(e){ err(e); }
  return r;
});
W('showAftermath', orig => function(){
  const r = orig.apply(this, arguments);
  try{
    const f = G() && G().flags;
    if(G() && G().currentMission === 'm3' && f && Array.isArray(f.m3_files)){
      const blk = [...document.querySelectorAll('#aftermath-grid .aftermath-block')].find(b => /OPERATIONAL STATS/.test((b.querySelector('h3') || {}).textContent || ''));
      if(blk && !blk.querySelector('.tac-files')){
        const row = document.createElement('div'); row.className = 'stat-row tac-files';
        row.innerHTML = `<span class="lbl">Laptop files recovered</span><span class="val">${f.m3_files.length} / 7</span>`;
        blk.appendChild(row);
      }
    }
  }catch(e){ err(e); }
  return r;
});
// the Week-1 drives lead (v13_data.js:209/214): getters; today's text unless the ledger was shredded and nothing backs it up
try{
  const lead = typeof BRIEFINGS !== 'undefined' && BRIEFINGS.m3 && (BRIEFINGS.m3.leads || []).find(l => l && l.id === 'drives');
  if(lead && !lead._tac){
    const RES = lead.res, INTEL = lead.intel;
    const full = () => { const g = G(), files = g && g.flags && g.flags.m3_files;
      return !Array.isArray(files) || files.includes('ledger_q3.xlsx') || !!(typeof intelHas === 'function' && safe(() => intelHas('safe_drives'), false)); };
    Object.defineProperty(lead, 'res', { configurable:true, enumerable:true, get(){ if(full()) return RES;
      const n = G().flags.m3_files.length; return `The ledger was shredded. Forensics rebuilt ${n} of Obi's files, but nothing left in them ties a payment to a name.`; } });
    Object.defineProperty(lead, 'intel', { configurable:true, enumerable:true, get(){ return full() ? INTEL : 4; } });
    Object.defineProperty(lead, '_tac', { value:true });
  }
}catch(e){ err(e); }

/* ---------- m3_summary: once, from the completeMission('m3') wrap ---------- */
function summary(){
  const g = G(), o = R.obi, ms = TAC._ms || { seen:{ notice:R.notices, alarm:R.alarms } };     // C-9: own counts without A's stats
  const arc = (g.archive || []).filter(a => a && a.mid === 'm3').slice(-1)[0];
  return { entry:R.entry, door:R.door, power:R.power, spawn:R.door === 'gate' ? 'corridor' : 'front', variant:R.variant,
    obi:{ first:o.first, alertedBy:o.alertedBy || (R.entry === 'knock' || R.entry === 'loud' ? R.entry : null), alertedAt:o.alarmAt != null ? r1(o.alarmAt) : null,
          outcome:o.outcome, by:o.by, arrest:mc().arrest || null },
    seen:{ notices:(ms.seen && ms.seen.notice) || 0, alarms:(ms.seen && ms.seen.alarm) || 0, evaded:ms.evaded || 0, causes:Object.assign({}, R.causes) },
    crouchSecs:r1(ms.crouchSecs || 0),
    wipe:{ armed:R.wipe.armedAt != null, outcome:R.lap.outcome, pct:R.lap.pct, files:R.lap.files, total:R.wipe.pending || g._wipeTotal || null },
    child:{ choice:R.child.choice, out:R.child.state === 'out', by:R.child.by },
    uche:{ post:R.uchePlan, orders:R.uche.orders.slice(0, 8), acts:R.uche.acts.slice(0, 8) },
    extract:{ refusals:R.extract.refusals, missing:R.extract.missing.slice() },
    prep:Object.assign(prep(), { tipped:!!R.leak }), secs:r1(R.t),
    force:(g.forceUsed || 0) - ((g._opStart && g._opStart.force) || 0), trust:S.player.reputation.publicTrust, grade:arc ? arc.grade : null,
    diff:{ casework:typeof gameDifficulty === 'function' ? gameDifficulty() : null, pace:typeof SETTINGS !== 'undefined' ? SETTINGS.difficulty : null },
    hints:(TAC.hintsShown || []).slice(), build:(window.NACECA_BUILD && NACECA_BUILD.src) || null };
}
W('completeMission', orig => function(id){
  const run = R;
  const r = orig.apply(this, arguments);
  try{ if(id === 'm3' && run && run === R && !R.summary){ R.summary = true; log('m3_summary', summary()); } }catch(e){ err(e); }
  return r;
});

/* =================================================================================================
   7 · The clock: decisions on TAC.onTick (10 Hz), positions on TAC.onFrame; frozen under overlays
   ================================================================================================= */
function lossCheck(){
  const g = G();
  if(g._wipeLost && !R.lap.outcome) recordLaptop('lost', 100, []);
}
function decide(){
  obiDecide();
  ucheDecide();
  const C = R.child, cz = R.M.child.position.z;
  if((C.state === 'walking' || C.state === 'escort') && cz > cfg.childOutZ) childOut(C.state === 'escort' ? 'uche' : (C.by || 'kelechi'));
}
function frame(dt){
  obiFrame(dt);
  ucheFrame(dt);
  pois();
}
function advance(dt){                                     // the field skill's hook: the whole mover, frames and ticks
  dt = Math.max(0, Math.min(0.1, dt));
  frame(dt);
  const ch = R.M.child; if(ch && ch.userData && ch.userData._walk && typeof updateWalker === 'function') updateWalker(ch, dt);
  R.mgAcc += dt;
  while(R.mgAcc >= DT - 1e-9){ R.mgAcc -= DT; R.t += DT; decide(); }
  lossCheck();
}
TAC.onTick(dt => {
  if(!inM3()) return;
  try{
    lossCheck();
    if(!v8()) return;
    uiUpdate();
    if(!R.live || TAC.frozen()) return;
    R.t += dt;
    decide();
  }catch(e){ err(e); }
}, { order:20 });
TAC.onFrame(dt => {
  if(!playing() || TAC.frozen()) return;
  try{ frame(dt); }catch(e){ err(e); }
}, { order:20 });
TAC.onScene(() => {
  try{
    if(DIM.on) dim(false);
    if(R && TAC.state.pursuit === 'm3_flight') TAC.state.pursuit = null;
    R = null;
    UI.key = null;
    const w = document.getElementById('ctx-uche-wrap'); if(w) w.classList.remove('show');
    if(document.body) document.body.classList.remove('tac-uche-on');
    const c = document.getElementById('tac-uche'); if(c) c.classList.remove('show');
  }catch(e){ err(e); }
}, { order:5 });

/* ---------- the test surface ---------- */
TAC.m3 = {
  cfg,
  run:() => R,
  obi:() => R ? R.obi : null,
  uche:() => R ? R.uche : null,
  child:() => R ? R.child : null,
  wipe:() => R ? R.wipe : null,
  order:(id, src) => safe(() => order(id, src), false),
  offer:() => safe(offer, null),
  survivors,
  wipeFor,
  _advance:dt => { if(playing()) advance(dt); },
};
})();
