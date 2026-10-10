/* =========================================================================
   NACECA · v13 briefing — Commander Adaeze's briefing between operations
   She puts three leads on the table; the unit can work two. Her advice is
   sometimes honest and sometimes the exact lead that points at her.
   Dropped leads develop without you.
   Where it runs (docs/DESIGN v13 §2, A1):
   - Week 1 (key m3): after Night Shift's "Go home", before the
     'BENIN BYPASS · TWO DAYS LATER' card (titleCard wrap, v13_boot.js).
   - Keys m4–m7: inside the hub's Commander video call (h4–h7), through the
     generic hook V12.hubCallAfter(h, done) — after Uche, the phone, the
     charge sheet and the Commander's lines, before the office closes.
   A briefing is transactional (A4): COMMIT writes I().brf, applies the
   decisions once and saves; every lead saves its outcome; a reload resumes.
   Also here: gatekeeper calls, the Abuja van, the officer on a wire, the
   court orders decided at h6/h7 (w_cdr, w_eko — the board is the judge).
   ========================================================================= */
(function(){
'use strict';
const V12 = window.V12 = window.V12 || {};
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const ico = (n, c) => (typeof icon === 'function' ? icon(n, c) : '');
const recruit = () => { try{ return typeof isRecruit === 'function' && !!isRecruit(); }catch(e){ return false; } };
const save = () => { try{ if(typeof saveGame === 'function') saveGame(true); }catch(e){} };
const log = (t, d) => { try{ if(typeof V12.log === 'function') V12.log(t, d); }catch(e){} };
const sfx = n => { try{ if(typeof window[n] === 'function') window[n](); }catch(e){} };
const safe = (f, label) => { try{ return f(); }catch(e){ console.warn('[v13] ' + label, e); } };
const done = id => (S.game.completedMissions || []).includes(id);
const shownId = id => { const el = document.getElementById(id); return !!(el && el.classList.contains('show')); };
const AGENCY = 'NATIONAL ANTI-CORRUPTION &amp; ECONOMIC CRIMES AGENCY';

const HUB_KEY = { h4:'m4', h5:'m5', h6:'m6', h7:'m7' };
const WCASE = { w_cdr:'route', w_eko:'voice' };
const TUNDE_HELD = "Tunde stopped taking your calls after your charge sheet put him in a cell.";

/* runtime state of the briefing on screen (never saved: I().brf is the record) */
const BRF = { k:null, phase:'plan', sel:[], dec:{}, then:null, video:false, armed:null, wArm:null };
window.BRF = BRF;

/* ---------------- Esc / pause and the operations table (A2) ----------------
   v13Modal / v13ModalEnd and v13OpenOps are the model's (v13_intel.js). Only when they are
   missing (this layer built on its own) does this file install the same behaviour, so the
   briefing never soft-locks; with the model present nothing here wraps togglePause. */
if(typeof window.v13Modal !== 'function'){
  const ST = [];
  window.v13Modal = (id, o) => { const i = ST.findIndex(x => x.id === id); if(i >= 0) ST.splice(i, 1); ST.push(Object.assign({ id }, o || {})); };
  window.v13ModalEnd = id => { const i = ST.findIndex(x => x.id === id); if(i >= 0) ST.splice(i, 1); };
  window.v13Modal._b = true;
  if(typeof V12.wrap === 'function') V12.wrap('togglePause', orig => function(){
    try{
      for(let i = ST.length - 1; i >= 0; i--){
        if(shownId(ST[i].id)){ if(typeof ST[i].onEsc === 'function') ST[i].onEsc(); return; }
      }
      if(shownId('screen-pause') && ST.length){
        const top = ST[ST.length - 1]; showOverlay(null);
        if(typeof top.resume === 'function') top.resume();
        return;
      }
    }catch(e){ console.warn('[v13] pause', e); }
    return orig.apply(this, arguments);
  });
}
if(typeof window.v13OpenOps !== 'function'){
  const OST = [];
  window.v13OpenOps = (group, back) => {
    OST.push(back);
    V12._onOpsClose = () => { safe(()=>window.v13ModalEnd('screen-ops'), 'ops'); const b = OST.pop(); if(typeof b === 'function') b(); };
    V12.openOps(group);
    safe(()=>window.v13Modal('screen-ops', { onEsc:()=>V12.closeOps(), resume:()=>V12.openOps(group) }), 'ops');
  };
  window.v13OpenOps._b = true;
}
const REG = new Set();
function modalOn(id, resume){
  if(REG.has(id) || typeof window.v13Modal !== 'function') return;
  REG.add(id); safe(()=>window.v13Modal(id, { onEsc:null, resume }), 'modal');
}
function modalOff(id){
  if(!REG.has(id)) return;
  REG.delete(id); safe(()=>{ if(typeof window.v13ModalEnd === 'function') window.v13ModalEnd(id); }, 'modal');
}
/* the Benin briefings are the Commander's video call: the badge is on while the briefing
   itself is on screen, off during the van, the wire, a gatekeeper call or the table */
function callBadge(on){ if(BRF.video && typeof V12.videoCall === 'function') safe(()=>V12.videoCall(!!on), 'call'); }

/* ---------------- when a briefing is owed ---------------- */
// owed: its operation is done and it was never finished (a committed one resumes)
function briefingPending(k){
  if(!BRIEFINGS[k] || !done(k)) return false;
  const v = I().briefed[k];
  return !v || v === 'committed';
}
// Week 1 only: a briefing that was open (or committed) when the player quit
function briefingResumable(k){
  if(!briefingPending(k)) return false;
  const d = I();
  return !!((d.brf && d.brf.k === k) || d.brfOpen === k);
}
window.briefingPending = briefingPending;
window.briefingResumable = briefingResumable;

/* the hub's Commander call: v12_hub.js calls this after 'hub_cmd_run' (A0). done() exactly once. */
V12.hubCallAfter = function(h, cont){
  let called = false;
  const once = ()=>{ if(called) return; called = true; try{ if(typeof cont === 'function') cont(); }catch(e){ console.warn('[v13] hub continue', e); } };
  const k = HUB_KEY[h];
  let owe = false;
  try{ owe = !!(k && BRIEFINGS[k]) && (()=>{ const v = I().briefed[k]; return !v || v === 'committed'; })(); }catch(e){ owe = false; }
  if(!owe){ once(); return; }
  try{ openBriefing(k, once, { video:true, hub:h }); }
  catch(e){ console.warn('[v13] hub briefing', e); once(); }
};

/* ---------------- the overlay ---------------- */
function ensureBriefingScreen(){
  if(document.getElementById('screen-briefing')) return;
  const ov = document.createElement('div'); ov.className = 'overlay'; ov.id = 'screen-briefing';
  ov.innerHTML = `<div class="overlay-bg"></div>
    <div class="brf-frame" role="dialog" aria-modal="true" aria-labelledby="brf-title">
      <div class="brf-bar" id="brf-bar"></div>
      <div class="brf-scroll" id="brf-body"></div>
      <div class="brf-foot" id="brf-foot"></div>
    </div>`;
  (document.getElementById('game-root') || document.body).appendChild(ov);
  ov.addEventListener('click', e => { const el = e.target.closest('[data-b]'); if(el && !el.disabled) briefingAct(el.dataset.b, el.dataset); });
}
function showBriefing(){
  ensureBriefingScreen();
  if(typeof showHUD === 'function') showHUD(false);
  ENGINE.movementEnabled = false;
  showOverlay('screen-briefing');
  callBadge(true);
  modalOn('screen-briefing', showBriefing);
  renderBriefing();
  const sc = document.getElementById('brf-body'); if(sc && BRF._top){ sc.scrollTop = 0; BRF._top = false; }
}

/* a briefing left committed by an older flow is closed before another one opens */
function closeStale(k){
  const d = I(), r = d.brf;
  if(!r || r.k === k || !BRIEFINGS[r.k]) return;
  dropUnworked(r.k);
  d.briefed[r.k] = true; delete d.brf;
}

function openBriefing(k, then, opts){
  const b = BRIEFINGS[k];
  if(!b){ if(typeof then === 'function') then(); return; }
  ensureBriefingScreen();
  const d = I();
  closeStale(k);
  Object.assign(BRF, { k, phase:'plan', sel:[], dec:{}, then:typeof then === 'function' ? then : null, video:!!(opts && opts.video), armed:null, wArm:null, _top:true });
  // more NFIU requests with each briefing, once
  // (decided once, at the first opening: a reload never tops them up again)
  d.briefedReq = d.briefedReq || {};
  if(!d.briefedReq[k]){ d.briefedReq[k] = true; if(d.money && d.money.open) d.money.req += (typeof MONEY_PER_WEEK === 'number' ? MONEY_PER_WEEK : 2); }
  // the model's own work at a briefing (e.g. money nodes from flags since the last one), once
  if(typeof window.intelOnBriefingOpen === 'function'){ d.brfHook = d.brfHook || {}; if(!d.brfHook[k]){ d.brfHook[k] = true; safe(()=>window.intelOnBriefingOpen(k), 'brief hook'); } }
  if(k === 'm3' && d.brfOpen !== 'm3'){ d.brfOpen = 'm3'; save(); }       // Week 1 survives a quit
  if(typeof musicForScene === 'function') safe(()=>musicForScene('investigation'), 'music');
  const r = d.brf && d.brf.k === k ? d.brf : null;
  if(!r && d.briefed[k] === 'committed'){ finishBriefing(); return; }      // committed, nothing to resume
  BRF.phase = r ? 'out' : 'plan';
  showBriefing();
  log('briefing_open', { k, resume:!!r });
}
window.openBriefing = openBriefing;

/* ---------------- leads ---------------- */
function accused(c){ try{ return typeof V12.accused === 'function' ? V12.accused(c) : null; }catch(e){ return null; } }
const tundeHeld = () => { const r = accused('lagos'); return !!(r && r.suspect === 'tunde'); };
const posHeld = () => { const r = accused('lagos'); return !!(r && r.settled && r.suspect === 'pos'); };
const tobiAlive = () => (typeof intelTobiAlive === 'function' ? !!intelTobiAlive()
  : (()=>{ const a = (S.game.moralChoices || {}).asaba; return a === 'rescue' || (a === 'chase' && !S.game._asabaHostageLost); })());
function leadBlocked(l){
  if(l.tunde && tundeHeld()) return TUNDE_HELD;
  if(l.heatMax && heatNow() >= l.heatMax) return l.heatBlocked;
  if(l.tailBlocked && (S.game.moralChoices || {}).checkpoint === 'tail_driver') return l.tailBlocked;
  if(l.tobiAlive && !tobiAlive()) return l.blocked || 'Not available';
  if(l.needsAny && !l.needsAny.some(x => intelHas(x))) return l.blocked || 'Not available';
  if(l.needsMission && !done(l.needsMission)) return 'Not available';
  return null;
}
function maxLeads(dec){ return (dec || BRF.dec).order === 'quiet' ? 1 : 2; }
function wanted(){
  const b = BRIEFINGS[BRF.k];
  const avail = b.leads.filter(l => !leadBlocked(l));
  return { avail, want:Math.min(maxLeads(), avail.length) };
}
function needs(){
  const b = BRIEFINGS[BRF.k], n = [];
  if(b.custody && intelHas(b.custody.item)) n.push('custody');
  if(b.order) n.push('order');
  if(b.press) n.push('press');
  return n;
}
function ready(){ const { want } = wanted(); return needs().every(k => BRF.dec[k]) && BRF.sel.length === want; }
function queue(r){ const b = BRIEFINGS[r.k]; return b.leads.filter(l => r.sel.includes(l.id)); }
function nextLead(r){ return queue(r).find(l => !r.ran.includes(l.id)) || null; }
function more(){
  const r = I().brf; if(!r) return false;
  const b = BRIEFINGS[r.k];
  return !!nextLead(r) || !!(b.warrant && !r.warrantDone);
}

/* ---------------- rendering ---------------- */
function adPortrait(){ return (typeof PORTRAIT_ART !== 'undefined' && PORTRAIT_ART.adaeze_neutral) || ''; }
function barHTML(b){
  const where = BRF.video
    ? `<span class="brf-live">${ico('dot', 'fill')}<span>VIDEO CALL · LAGOS HQ</span></span>`
    : `<span class="brf-live">${ico('pin')}<span>NACECA HQ · LAGOS${b.sub ? ' · ' + esc(b.sub) : ''}</span></span>`;
  return `${where}<span class="brf-kick v13-mono">${esc(b.title)}</span>`;
}
function optHTML(key, val, label, sub){
  const on = BRF.dec[key] === val;
  return `<button class="brf-opt${on ? ' on' : ''}" data-b="dec" data-k="${key}" data-v="${val}" aria-pressed="${on}"><span class="brf-box">${ico('check')}</span><span class="brf-ot"><b>${esc(label)}</b>${sub ? `<span>${esc(sub)}</span>` : ''}</span></button>`;
}
function renderPlan(){
  const b = BRIEFINGS[BRF.k], d = I(), ad = adPortrait();
  let h = `<div class="brf-h" id="brf-title">THE BRIEFING</div>
    <div class="brf-unit">CYBER &amp; FINANCIAL CRIMES UNIT · LAGOS</div>
    <div class="brf-ad">${ad ? `<img src="${ad}" alt="">` : `<span class="brf-noimg">${ico('people')}</span>`}<div><div class="brf-who">COMMANDER ADAEZE${BRF.video ? ' · VIDEO CALL' : ''}</div><p class="brf-say">"${esc(b.intro)}"</p></div></div>`;
  const prev = (d.dropLog || []).filter(x => x.week === b.week - 1);
  if(prev.length) h += `<section class="v13-sheet brf-note"><div class="v13-sheet-h">WHILE YOU WERE BUSY</div><ul class="brf-drops">${prev.map(x => `<li>${esc(x.text)}</li>`).join('')}</ul></section>`;
  const n = needs();
  if(n.includes('custody')){
    h += `<section class="v13-sheet brf-dec"><div class="v13-sheet-h">A REQUEST</div><p class="brf-q">"${esc(b.custody.ask)}"</p>
      <div class="brf-opts">${optHTML('custody', 'gave', 'Send it to her office by courier')}${optHTML('custody', 'kept', '"Ma, procedure says it stays booked in."')}</div></section>`;
  }
  if(n.includes('order')){
    h += `<section class="v13-sheet brf-dec"><div class="v13-sheet-h">AN INSTRUCTION</div><p class="brf-q">"${esc(b.order.text)}"</p>
      <div class="brf-opts">${optHTML('order', 'comply', 'Comply')}${optHTML('order', 'quiet', 'Look into him quietly', 'Uses one of your two leads')}${optHTML('order', 'confront', 'Ask her about it, on the call')}${optHTML('order', 'leak', 'Pass it to a crime reporter')}</div></section>`;
  }
  if(n.includes('press')){
    const st = typeof RADIO_STATION === 'string' ? RADIO_STATION : 'RADIO';
    h += `<section class="v13-sheet brf-dec"><div class="v13-sheet-h">${esc(st)} · 22:00</div>
      <p class="brf-radio v13-mono">"Witnesses say NACECA officers beat traders during the Asaba warehouse raid. The agency has not responded."</p>
      <p class="brf-q">"Zonal is on my phone already. What do you want to do about it?"</p>
      <div class="brf-opts">${optHTML('press', 'bodycam', 'Release the body-cam footage')}${optHTML('press', 'quiet', 'Say nothing. Let it pass.')}${optHTML('press', 'trace', 'Find out who planted the story')}</div></section>`;
  }
  const { want } = wanted(), mx = maxLeads();
  BRF.sel = BRF.sel.filter(id => b.leads.some(l => l.id === id && !leadBlocked(l))).slice(0, mx);
  h += `<div class="brf-sec">LEADS · CHOOSE ${want} · <span class="v13-mono">${BRF.sel.length}/${want}</span> SELECTED</div>`;
  h += b.leads.map(l => {
    const bl = leadBlocked(l), on = !bl && BRF.sel.includes(l.id);
    return `<button class="v13-sheet brf-lead${on ? ' on' : ''}${bl ? ' locked' : ''}" data-b="lead" data-id="${l.id}" aria-pressed="${on}"${bl ? ' disabled' : ''}>
      <span class="brf-box">${ico(bl ? 'lock' : 'check')}</span><span class="brf-ot"><b>${esc(l.name)}</b><span>${esc(bl || l.desc)}</span></span></button>`;
  }).join('');
  // her advice never sends you to a lead you can't work (Tunde won't talk to you)
  const tipLead = b.leads.find(l => l.tip), advice = (b.advice.alt && tipLead && leadBlocked(tipLead)) ? b.advice.alt : b.advice.text;
  h += `<div class="brf-advice"><span class="brf-who">COMMANDER ADAEZE</span><p>"${esc(advice)}"</p></div>`;
  h += certHTML();
  if(d.money && d.money.open) h += `<p class="brf-small">NFIU: <span class="v13-mono">${d.money.req}</span> financial-intelligence request${d.money.req === 1 ? '' : 's'} available.</p>`;
  return h;
}
function certHTML(){
  if(typeof certWindowOpen !== 'function' || typeof INTEL_ITEMS === 'undefined') return '';
  const d = I();
  const cert = Object.values(d.items || {}).filter(it => INTEL_ITEMS[it.id] && INTEL_ITEMS[it.id].e && !it.cert && safe(()=>certWindowOpen(it.id), 'cert'));
  if(!cert.length) return '';
  const n = cert.length;
  return `<div class="brf-sec">DIGITAL FORENSICS</div><p class="brf-small">${n} item${n > 1 ? 's need' : ' needs'} an s.84 certificate before the next operation, or ${n > 1 ? 'they' : 'it'} won't survive a courtroom.</p>` +
    cert.map(it => `<div class="brf-cert"><span>${esc(intelLabel(it.id))}</span><button class="v13-btn" data-b="cert" data-id="${it.id}">SIGN · <span class="v13-mono">${certSlotsLeft(it.m)}</span> LEFT</button></div>`).join('');
}
function renderOut(){
  const r = I().brf || { out:[] };
  let h = `<div class="brf-h" id="brf-title">WHAT CAME BACK</div>`;
  h += `<section class="v13-sheet brf-note">${r.out.length ? r.out.map(o => `<div class="brf-r">${o.h ? `<div class="brf-r-h">${esc(o.h)}</div>` : ''}<p>${esc(o.t)}</p></div>`).join('')
    : '<p class="brf-r-empty">The plan stands. Nothing has come back yet.</p>'}</section>`;
  h += certHTML();
  return h;
}
function renderBriefing(){
  const body = document.getElementById('brf-body'), bar = document.getElementById('brf-bar'), foot = document.getElementById('brf-foot');
  if(!body || !BRF.k || !BRIEFINGS[BRF.k]) return;
  const b = BRIEFINGS[BRF.k];
  if(bar) bar.innerHTML = barHTML(b);
  const desk = typeof openDesk === 'function' ? `<button class="v13-btn" data-b="desk">${ico('folder')}<span>CASE DESK</span></button>` : '';
  if(BRF.phase === 'plan'){
    body.innerHTML = renderPlan();
    const ok = ready(), armed = BRF.armed === 'commit';
    foot.innerHTML = `${desk}<button class="v13-btn primary${armed ? ' armed' : ''}" data-b="commit"${ok ? '' : ' disabled'}>${!ok ? 'DECIDE FIRST' : armed ? 'TAP AGAIN TO COMMIT' : `COMMIT${ico('next')}`}</button>`;
    return;
  }
  if(BRF.phase === 'warrant'){
    body.innerHTML = renderWarrant();
    foot.innerHTML = desk;
    return;
  }
  body.innerHTML = renderOut();
  foot.innerHTML = more()
    ? `<button class="v13-btn primary" data-b="next">NEXT${ico('next')}</button>`
    : `${desk}<button class="v13-btn primary" data-b="done">TO THE OPERATION${ico('next')}</button>`;
}
window.renderBriefing = renderBriefing;

/* ---------------- actions ---------------- */
function briefingAct(a, ds){
  if(!BRF.k) return;
  if(a === 'desk'){ if(typeof openDesk === 'function') openDesk(); return; }
  if(a === 'cert'){ if(typeof certify === 'function') certify(ds.id); save(); renderBriefing(); return; }
  if(BRF.phase === 'plan'){
    if(a === 'dec'){ BRF.dec[ds.k] = ds.v; BRF.armed = null; if(ds.k === 'order' && ds.v === 'quiet') BRF.sel = BRF.sel.slice(0, 1); sfx('sfxClick'); renderBriefing(); return; }
    if(a === 'lead'){
      const i = BRF.sel.indexOf(ds.id); BRF.armed = null;
      if(i >= 0) BRF.sel.splice(i, 1);
      else { if(BRF.sel.length >= maxLeads()) BRF.sel.shift(); BRF.sel.push(ds.id); }
      sfx('sfxClick'); renderBriefing(); return;
    }
    if(a === 'commit'){
      if(!ready()) return;
      if(BRF.armed !== 'commit'){ BRF.armed = 'commit'; sfx('sfxClick'); renderBriefing(); return; }
      commitBriefing(); return;
    }
    return;
  }
  if(BRF.phase === 'warrant'){ warrantAct(a, ds); return; }
  if(BRF.phase === 'out'){
    if(a === 'next'){ continueBriefing(); return; }
    if(a === 'done'){ if(!more()) finishBriefing(); return; }
  }
}

/* COMMIT: the record, the decisions (once), a save. A committed plan is never re-planned. */
function commitBriefing(){
  const d = I(), k = BRF.k;
  if(d.brf && d.brf.k === k) return;
  const r = d.brf = { k, sel:BRF.sel.slice(), dec:Object.assign({}, BRF.dec), ran:[], out:[], warrantDone:false };
  d.briefed[k] = 'committed';
  applyDecisions(r);
  save();
  log('briefing_commit', { k, week:BRIEFINGS[k].week, leads:r.sel, dec:r.dec });
  sfx('sfxComplete');
  continueBriefing();
}
/* the next thing the plan owes: a lead, then the court order, then the results */
function continueBriefing(){
  const d = I(), r = d.brf;
  if(!r || r.k !== BRF.k){ BRF.phase = 'out'; showBriefing(); return; }
  const l = nextLead(r);
  if(l){ runLead(l); return; }
  const b = BRIEFINGS[r.k];
  if(b.warrant && !r.warrantDone){
    if(wState(b.warrant).status !== 'pending'){ r.warrantDone = true; r.out.push(warrantResultLine(b.warrant)); save(); }
    else { BRF.phase = 'warrant'; BRF.wArm = null; BRF._top = true; showBriefing(); return; }
  }
  BRF.phase = 'out'; BRF._top = true; showBriefing();
}
function runLead(l){
  BRF.phase = 'lead';
  const back = txt => leadDone(l, txt);
  if(l.call){ runGatekeeper(l, back); return; }
  if(l.game === 'stakeout'){ openStakeout(l, back); return; }
  if(l.game === 'undercover'){ openUndercover(l, back); return; }
  if(l.tip){ back(runTip(l)); return; }
  back(applyLead(l));
}
function leadDone(l, txt){
  const d = I(), r = d.brf;
  if(r && !r.ran.includes(l.id)){
    r.out.push({ h:l.name.toUpperCase(), t:txt || '' });
    r.ran.push(l.id);
  }
  d.leads[l.id] = 'done';
  save();
  BRF.phase = 'out'; BRF._top = true;
  showBriefing();
}

/* --- decisions taken before the leads run (applied once, at COMMIT) --- */
function applyDecisions(r){
  const b = BRIEFINGS[r.k], d = I(), dec = r.dec, out = r.out;
  if(dec.custody && b.custody){
    d.custodyAsk = dec.custody;
    const it = (d.items || {})[b.custody.item];
    if(dec.custody === 'gave'){
      applyEffect({ agencyFavour:+3 }); knowAdd('ledger', 'Cdr. Adaeze');
      if(it && it.custody) it.custody.push({ t:'Sent to the Office of the Commander, Lagos' });
      out.push({ h:'THE LEDGER', t:'"Thank you, Kelechi. It\'s safer here." The ledger goes to Lagos by courier.' });
    } else {
      applyEffect({ agencyFavour:-2, integrity:+2 });
      if(it && it.custody) it.custody.push({ t:"Commander's request to sign out — declined, booked and sealed" });
      out.push({ h:'THE LEDGER', t:'"Of course," she says. "Procedure." She doesn\'t ask again.' });
    }
  }
  if(dec.order){
    d.order = dec.order;
    if(dec.order === 'comply'){ applyEffect({ agencyFavour:+4 }); out.push({ h:'THE ENGINEER', t:'You leave him alone. She notices, and thanks you for it.' }); }
    if(dec.order === 'quiet'){ knowAdd('engineer', 'You'); intelSet('engineer_log'); applyEffect({ intel:+8 }); addInvEvidence('inv_engineer');
      out.push({ h:'THE ENGINEER', t:'Off the books, you pull his line. Last month it called one number 41 times, always after midnight — the same number KC has saved as "C.". Nobody else knows you looked.' }); }
    // asking her gives you her answer and nothing else: the Engineer's calls are found only by pulling his line ('quiet')
    if(dec.order === 'confront'){ applyEffect({ agencyFavour:-3 }); d.alert = (d.alert || 0) + 1; knowAdd('engineer_asked', 'Cdr. Adaeze');
      out.push({ h:'THE ENGINEER', t:'"He is how we found Lekki. You will have to trust me on this one, Kelechi."' }); }
    if(dec.order === 'leak'){ applyEffect({ publicTrust:+3, agencyFavour:-6 }); d.alert = (d.alert || 0) + 1; knowAdd('engineer', 'The press'); intelSet('engineer_fled');
      out.push({ h:'THE ENGINEER', t:'The story runs that evening: "NACECA informant linked to kidnap ring." By morning the Engineer has vanished, and the Commander has stopped saying good morning.' }); }
  }
  if(dec.press){
    const o = (d.opLog || {}).m6 || {}, clean = !(o.force > 0) && !(o.bumps > 0);
    d.press = dec.press; d.pressClean = clean;
    if(dec.press === 'bodycam'){
      if(clean){ applyEffect({ publicTrust:+8, agencyFavour:-3 }); out.push({ h:'THE FOOTAGE', t:'The body-cam shows a clean breach and nobody touched. The story dies by morning. Zonal is annoyed you didn\'t ask first — and now everyone has seen exactly how your unit moves.' }); }
      else { applyEffect({ publicTrust:-4, integrity:+3 }); out.push({ h:'THE FOOTAGE', t:'The footage shows a trader going down as you sprint past. It isn\'t a beating, but it isn\'t nothing. You released it anyway.' }); }
    }
    if(dec.press === 'quiet'){ applyEffect({ publicTrust:-5 }); out.push({ h:'THE STORY', t:'You say nothing. The story runs all the next day and becomes something people "know".' }); }
    if(dec.press === 'trace'){ applyEffect({ publicTrust:-2, intel:+6 }); regFind(['silverline']);
      out.push({ h:'THE STORY', t:'The "witnesses" all trace back to one PR firm: Silverline Media Ltd, registered at Suite 4B, Zuma Court, Wuse II' + (intelHas('zuma_cluster') ? ' — the same office again.' : '.') }); }
  }
}

function applyLead(l, partial){
  const d = I();
  d.leads[l.id] = 'done';
  if(l.money) moneyUnlock(l.money);
  if(l.reg) regFind(l.reg);
  if(l.flag && !partial) intelSet(l.flag);
  if(l.flag === 'lead_gatehouse' && !partial){ knowAdd('poolcar', 'You'); addInvEvidence('inv_gatehouse'); }
  if(l.intel) applyEffect({ intel: partial ? Math.round(l.intel / 2) : l.intel });
  return l.res;
}
function runTip(l){
  const d = I(); d.leads[l.id] = 'done';
  const st = typeof intelStyle === 'function' ? (safe(()=>intelStyle(), 'style') || {}) : {};
  if(st.key === 'inf'){ intelSet('tip_false');
    return `"${TIP_FALSE}" You send two officers to Uselu before the tail. The bungalow is empty and the paint is fresh. The neighbours were told to expect "officers". Somebody wanted you there.`; }
  intelSet('lead_tip'); applyEffect({ intel:+6 });
  return `"${TIP_TRUE}"` + (intelHas('tower_fix') ? ' It matches the tower fix.' : '');
}

// a lead that could not be worked (Tobi dead, Tunde not talking, nothing to decrypt…) leaves no "while you were
// busy" line: its dropped text would contradict the reason it was blocked
function dropUnworked(k){
  const b = BRIEFINGS[k], d = I();
  b.leads.forEach(l => { if(!d.leads[l.id]){ const bl = leadBlocked(l); d.leads[l.id] = 'dropped'; if(l.dropped && !bl) d.dropLog.push({ week:b.week, lead:l.id, text:l.dropped, buried:b.advice.drop === l.id && b.advice.buries }); } });
}
function finishBriefing(){
  const k = BRF.k; if(!k) return;
  const d = I(), r = d.brf;
  dropUnworked(k);
  d.briefed[k] = true;
  delete d.brf;
  if(d.brfOpen === k) delete d.brfOpen;
  save();
  log('briefing', { week:BRIEFINGS[k].week, k, leads:r ? r.sel : [], dec:r ? r.dec : {} });
  ['screen-so', 'screen-uc', 'screen-dialogue', 'screen-briefing'].forEach(modalOff);
  showOverlay(null);
  const then = BRF.then;
  Object.assign(BRF, { k:null, then:null, phase:'plan', sel:[], dec:{}, armed:null, wArm:null });
  if(then) then();
}
window.finishBriefing = finishBriefing;

/* ---------------- the court orders: w_cdr at h6, w_eko at h7 (A5) ----------------
   The board is the magistrate: V12.warrantFor(case).signed at decision time. The only
   writer is V12.fileV13Warrant (the model's); this file falls back to I().warrants when it
   is missing. One write per order, after the player's last choice. */
function wState(id){
  try{ if(typeof V12.warrantState === 'function'){ const s = V12.warrantState(id); if(s && s.status) return s; } }catch(e){}
  const r = (I().warrants || {})[id];
  const status = r && ['signed', 'none', 'exigent'].includes(r.status) ? r.status : 'pending';
  return { id, status, route:r && r.route };
}
function boardFor(c){
  let w = null;
  try{ if(typeof CW !== 'undefined' && CW && typeof CW.warrant === 'function') w = CW.warrant(c); }catch(e){ w = null; }
  if(!w){ try{ if(typeof V12.warrantFor === 'function') w = V12.warrantFor(c); }catch(e){ w = null; } }
  w = w || { strength:0, signed:false, refused:false, strikes:0, need:'' };
  const signed = !!w.signed;
  return { strength:Math.max(0, Math.min(100, Math.round(+w.strength || 0))), signed, refused:!signed && !!w.refused, strikes:w.strikes | 0,
    need:String(w.need || (w.refused ? 'Find new evidence' : 'Needs stronger evidence')).replace(/[.\s]+$/, '') };
}
const W_TITLE = { w_cdr:'PRODUCTION ORDER · UGBOWO CELL RECORDS', w_eko:'SEARCH & ARREST WARRANT · EKOSODIN' };
const W_META = { w_cdr:'FEDERAL HIGH COURT, BENIN · FILE NACECA-2026/0034 · THE ROUTE', w_eko:'MAGISTRATE, BENIN · FILE NACECA-2026/0034 · THE VOICE' };
function renderWarrant(){
  const b = BRIEFINGS[BRF.k], id = b.warrant, c = WCASE[id], w = boardFor(c), eko = id === 'w_eko';
  const stamp = w.signed ? '<span class="v13-stamp good">SIGNED</span>' : `<span class="v13-stamp">${w.refused ? 'REFUSED' : 'NOT SIGNED'}</span>`;
  let h = `<div class="brf-h" id="brf-title">${eko ? 'THE WARRANT' : 'THE PRODUCTION ORDER'}</div>
    <p class="brf-say">"${eko ? 'Whatever you carry through that door tonight, a judge will read later.' : 'The Federal High Court reads your route case, not my word.'}"</p>
    <section class="v13-sheet brf-w" data-w="${id}">
      <header class="brf-w-head"><div class="brf-w-agency">${AGENCY}</div><h3 class="brf-w-title">${esc(W_TITLE[id])}</h3><div class="brf-w-meta v13-mono">${esc(W_META[id])}</div></header>
      <div class="brf-w-stamp">${stamp}</div>
      <dl class="brf-facts">
        <div><dt>STATUS</dt><dd class="v13-mono">${w.signed ? 'SIGNED' : w.refused ? 'REFUSED' : 'NOT SIGNED'}</dd></div>
        <div><dt>CASE STRENGTH</dt><dd class="v13-mono">${w.strength} / 100</dd></div>
        <div><dt>WRONG LINKS FILED</dt><dd class="v13-mono">${w.strikes} / 3</dd></div>
        <div><dt>THE ${eko ? 'MAGISTRATE' : 'JUDGE'}</dt><dd class="v13-mono">${esc(w.signed ? 'Ready to sign' : w.need)}.</dd></div>
      </dl>`;
  if(w.signed && !eko){
    h += `<p class="brf-w-lead">Signed on the route case from your operations table. Ugbowo's cell records can come off that cabinet lawfully.</p>
      <div class="brf-acts"><button class="v13-btn primary" data-b="w-sign">${ico('stamp')}<span>TAKE THE ORDER</span></button></div>`;
  } else if(w.signed){
    const opt = (v, label, sub) => { const arm = BRF.wArm === 'route:' + v;
      return `<button class="brf-opt${arm ? ' on armed' : ''}" data-b="w-route" data-v="${v}" aria-pressed="${arm}"><span class="brf-box">${ico('check')}</span><span class="brf-ot"><b>${esc(label)}</b><span>${esc(sub)}</span>${arm ? '<em class="brf-arm">TAP AGAIN TO SEND IT THIS WAY</em>' : ''}</span></button>`; };
    h += `<p class="brf-w-lead">Signed on the voice case from your operations table. Choose who carries it to the magistrate tonight.</p>
      <div class="brf-opts">${opt('commander', "Through Lagos HQ — the Commander's office", 'The usual route.')}${opt('zonal', 'Straight to Benin Zonal Command', 'Agency Standing −6. Zonal will not like you going round your own Commander.')}</div>`;
  } else {
    const armed = BRF.wArm === 'none';
    h += `<p class="brf-w-lead">${w.refused ? 'Refused until you bring something new: a new card on the table, or a new link that holds.' : `The ${eko ? 'magistrate' : 'judge'} won't sign on what's on your table yet.`}</p>
      <p class="v13-warn brf-w-cost">${eko ? 'Go without it, and you go in on exigency: lawful with a student held inside, but the defence will test it in court.' : 'Go without it, and the tower data goes to court with a flaw: pulled without a court order.'}</p>
      <div class="brf-acts"><button class="v13-btn" data-b="w-ops">${ico('back')}<span>BACK TO THE OPERATIONS TABLE</span></button>
      <button class="v13-btn danger${armed ? ' armed' : ''}" data-b="w-none">${armed ? (eko ? 'TAP AGAIN — NO WARRANT' : 'TAP AGAIN — NO ORDER') : (eko ? 'GO WITHOUT A WARRANT' : 'GO WITHOUT THE ORDER')}</button></div>`;
  }
  h += `</section>`;
  return h;
}
function warrantAct(a, ds){
  const b = BRIEFINGS[BRF.k], id = b.warrant; if(!id) return;
  const r = I().brf; if(!r || r.warrantDone) return;
  const w = boardFor(WCASE[id]);
  if(a === 'w-ops'){
    BRF.wArm = null; callBadge(false);
    const back = ()=>{ if(!BRF.k) return; BRF.phase = 'warrant'; BRF.wArm = null; if(typeof musicForScene === 'function') safe(()=>musicForScene('investigation'), 'music'); showBriefing(); };
    if(typeof window.v13OpenOps === 'function') window.v13OpenOps(WCASE[id], back);
    else if(typeof V12.openOps === 'function'){ V12._onOpsClose = back; V12.openOps(WCASE[id]); }
    return;
  }
  if(a === 'w-sign' && w.signed && id === 'w_cdr'){ decideWarrant(id, { status:'signed' }); return; }
  if(a === 'w-route' && w.signed && id === 'w_eko'){
    const v = ds.v === 'zonal' ? 'zonal' : 'commander';
    if(BRF.wArm !== 'route:' + v){ BRF.wArm = 'route:' + v; sfx('sfxClick'); renderBriefing(); return; }
    decideWarrant(id, { status:'signed', route:v }); return;
  }
  if(a === 'w-none' && !w.signed){
    if(BRF.wArm !== 'none'){ BRF.wArm = 'none'; sfx('sfxClick'); renderBriefing(); return; }
    decideWarrant(id, { status:id === 'w_eko' ? 'exigent' : 'none' }); return;
  }
}
function decideWarrant(id, rec){
  const d = I(), r = d.brf, rep = S.player.reputation;
  if(wState(id).status === 'pending'){
    const a0 = d.alert || 0, f0 = rep.agencyFavour;
    if(typeof V12.fileV13Warrant === 'function') safe(()=>V12.fileV13Warrant(id, rec), 'file warrant');
    else {
      d.warrants = d.warrants || {};
      d.warrants[id] = Object.assign({ status:rec.status }, rec.route ? { route:rec.route } : {}, { at:S.game.currentMission || null, t:Date.now() });
      log('v13_warrant', { id, status:rec.status, route:rec.route || null });
    }
    // the routing's cost, exactly once (whether or not the writer applied it)
    if(rec.route === 'commander'){ if((d.alert || 0) === a0) d.alert = a0 + 1; knowAdd('eko_house', 'Cdr. Adaeze'); }
    if(rec.route === 'zonal'){ if(rep.agencyFavour === f0) applyEffect({ agencyFavour:-6 }); knowAdd('eko_house', 'Zonal Command'); }
  }
  if(r && !r.warrantDone){ r.warrantDone = true; r.out.push(warrantResultLine(id)); }
  save();
  sfx('sfxComplete');
  BRF.wArm = null;
  continueBriefing();
}
function warrantResultLine(id){
  const s = wState(id), eko = id === 'w_eko';
  const h = eko ? 'THE WARRANT' : 'THE PRODUCTION ORDER';
  if(s.status === 'signed') return { h, t: !eko ? 'Signed. Whatever comes off that cabinet, you can put in front of a judge.'
    : s.route === 'zonal' ? "Signed by Zonal's duty magistrate at 19:10. Benin Zonal is not pleased you went round your own Commander." : 'Signed. It went through the Commander\'s office, the usual way.' };
  if(s.status === 'exigent') return { h, t:"No warrant. If it comes to it, you'll tell the judge a student's life was at stake." };
  if(s.status === 'none') return { h, t:'No order. If you pull data at that mast, the defence will ask on whose authority.' };
  return { h, t:'Never put to a magistrate.' };
}

/* ---------------- gatekeeper calls ---------------- */
const GK_FLAG = { gk_pos:'gk_pos', gk_foundation:'gk_found', gk_caretaker:'gk_care' };
// the scripts as the player sees them: Senior shows no choice tags; reputation stays out of the dialogue
function installGatekeepers(){
  const sen = !recruit();
  for(const k in GATEKEEPER_DIALOGUE){
    DIALOGUE[k] = GATEKEEPER_DIALOGUE[k].map(line => {
      const L = Object.assign({}, line);
      if(line.choices) L.choices = line.choices.map(c => { const C = Object.assign({}, c); delete C.rep; if(sen) delete C.tag; return C; });
      return L;
    });
  }
}
function gkRep(key, v){
  const fk = GK_FLAG[key];
  for(const line of GATEKEEPER_DIALOGUE[key] || []) for(const c of line.choices || []) if(c.effect && c.effect.flag && c.effect.flag[fk] === v) return c.rep || null;
  return null;
}
function runGatekeeper(l, back){
  const key = l.call, fk = GK_FLAG[key], fl = S.game.flags = S.game.flags || {};
  delete fl[fk];
  installGatekeepers();
  callBadge(false);
  modalOn('screen-dialogue', ()=>showOverlay('screen-dialogue'));
  startDialogue(key, ()=>{
    const v = fl[fk] || 'polite';
    const follow = key === 'gk_pos' && posHeld() ? 'gk_pos_badge' : fk + '_' + v;
    const fin = ()=>{ modalOff('screen-dialogue'); back(gkOutcome(key, v, l)); };
    if(DIALOGUE[follow]) startDialogue(follow, fin); else fin();
  });
}
function gkOutcome(key, v, l){
  const d = I();
  const rep = gkRep(key, v); if(rep) applyEffect(rep);
  d.gk = d.gk || {}; d.gk[key] = v;
  if(key === 'gk_pos'){
    if(posHeld()){ d.leads[l.id] = 'done'; moneyUnlock(['n_odogwu']); regFind(['odogwu']); applyEffect({ intel:+4 });
      return 'The attendant won\'t talk. An agent from this cluster spent a night in a NACECA cell on your charge sheet. You get the name on the stand — Odogwu Ventures — and nothing else.'; }
    if(v === 'badge'){ d.leads[l.id] = 'done'; moneyUnlock(['n_odogwu']); regFind(['odogwu']); applyEffect({ intel:+4 }); return 'Odogwu Ventures is the hub. The attendant saw the badge and went quiet — nothing about who collects the cash.'; }
    return applyLead(l);
  }
  if(key === 'gk_foundation'){
    if(v === 'respect') return applyLead(l);
    if(v === 'badge'){ d.leads[l.id] = 'done'; regFind(['urf', 'apex']); applyEffect({ intel:+4 }); return 'The secretary refers you to the Foundation\'s lawyers: Apex Corporate Services. That\'s all you get.'; }
    d.leads[l.id] = 'done'; regFind(['urf']); applyEffect({ intel:+6 });
    return 'The secretary offers you an account number and says the signatory is "away" — comes once a month. You have the Foundation\'s registration, not its people.';
  }
  if(key === 'gk_caretaker'){
    if(v === 'threat'){ d.leads[l.id] = 'done'; d.alert = (d.alert || 0) + 1;
      return 'The caretaker hangs up. Within the hour, a generator somewhere off the fence road goes quiet for the first time in weeks.'; }
    const t = applyLead(l); if(v === 'listen') intelSet('caretaker_unaware');
    // the back way is the caretaker's tip (the finale credits whoever told you first)
    const fl = S.game.flags = S.game.flags || {}; if(!fl.backgate_src) fl.backgate_src = 'caretaker';
    return t;
  }
  return applyLead(l);
}
/* every gatekeeper speaks as a flat palette silhouette, never the Commander's portrait (A11) */
function gkPortrait(speaker){
  const wrap = document.getElementById('dialogue-portrait'); if(!wrap) return;
  wrap.innerHTML = `<div class="portrait-frame v13-gk"><svg viewBox="0 0 100 100" aria-hidden="true">
    <rect width="100" height="100" style="fill:var(--manila-3,#8C8473)"/>
    <path d="M14 100 Q16 70 50 66 Q84 70 86 100Z" style="fill:var(--ink-2,#262623)"/>
    <ellipse cx="50" cy="44" rx="16" ry="19" style="fill:var(--ink-2,#262623)"/>
    <rect x="44" y="58" width="12" height="10" style="fill:var(--ink-2,#262623)"/>
    </svg></div>`;
}
if(typeof V12.wrap === 'function') V12.wrap('drawPortrait', orig => function(kind, speaker){
  try{
    const key = (typeof DLG !== 'undefined' && DLG && DLG.scriptKey) || '';
    if(/^gk_/.test(key) && GATEKEEPER_DIALOGUE[key] && !/^AGENT KELECHI/i.test(String(speaker || ''))){ gkPortrait(speaker); return; }
  }catch(e){}
  return orig.apply(this, arguments);
});

/* ---------------- the Abuja van: a live feed from Zuma Court (A10, A11) ----------------
   State persists in I().so after every action, so a reload resumes at the same beat. */
const SIL = {
  pair:'<svg viewBox="0 0 80 60"><circle cx="24" cy="13" r="7"/><path d="M12 60 Q12 25 24 23 Q36 25 36 60Z"/><circle cx="56" cy="13" r="7"/><path d="M44 60 Q44 25 56 23 Q68 25 68 60Z"/></svg>',
  smoke:'<svg viewBox="0 0 80 60"><circle cx="28" cy="15" r="7"/><path d="M16 60 Q16 27 28 25 Q40 27 40 60Z"/><rect x="44" y="40" width="28" height="6"/><path class="ln" d="M50 34 Q46 26 52 20 Q58 14 54 6M62 34 Q58 26 64 20"/></svg>',
  bags:'<svg viewBox="0 0 70 60"><circle cx="30" cy="12" r="7"/><path d="M24 4 L36 4 L37 8 L23 8Z"/><path d="M18 60 Q18 24 30 22 Q42 24 42 60Z"/><rect x="4" y="38" width="14" height="16" rx="1"/><rect x="46" y="38" width="14" height="16" rx="1"/></svg>',
  walker:'<svg viewBox="0 0 40 60"><circle cx="20" cy="11" r="7"/><path d="M10 44 Q10 22 20 20 Q30 22 30 44Z"/><path d="M12 44 L8 60 L14 60 L18 46Z M28 44 L32 60 L26 60 L22 46Z"/></svg>',
  car:'<svg viewBox="0 0 120 52"><path d="M6 38 L14 24 Q18 17 30 16 L76 16 Q88 16 97 25 L112 30 Q116 32 116 38 L116 44 L6 44Z"/><circle class="wh" cx="32" cy="44" r="7"/><circle class="wh" cx="92" cy="44" r="7"/></svg>',
};
const SO_EVENTS = [
  { t:'14:10', sil:'pair',   txt:'The day guard hands over to the afternoon shift. The two guards share a cigarette by the gate.', acts:['photo'] },
  { t:'14:40', sil:'smoke',  txt:'A suya seller sets up by the gate. Smoke drifts across the lens.', acts:['photo'] },
  { t:'15:20', sil:'bags',   txt:'A man in a cap carries two Ghana-must-go bags into Zuma Court. He knows the guard by name.', acts:['photo'], rel:'so_courier' },
  { t:'17:30', sil:'walker', txt:'A young woman locks the Apex glass door and waves at the guard on her way out.', acts:['photo'] },
  { t:'17:55', sil:'car',    txt:'A black Lexus, Lagos plates. A man in agbada uses the ATM next door and drives off.', acts:['photo', 'plate'], plate:'LAG 771 XC' },
  { t:'18:15', sil:'car',    txt:'A grey Toyota Corolla stops at the gate. Government plates. Nobody gets out. The man in the cap comes back out and passes an envelope through the rear window.', acts:['photo', 'plate'], plate:'LND 590 XA', rel:'so_poolcar', relPlate:'so_plate' },
  { t:'18:24', sil:'car',    txt:'The Corolla pulls away toward the Airport Road.', acts:['follow'] },
  { t:'18:40', sil:null,     txt:'Nothing. The street is empty. The suya seller packs up.', acts:['wait', 'back'], empty:true },
];
const SO_LABEL = { photo:['photo', 'PHOTOGRAPH'], plate:['notebook', 'LOG THE PLATE'], follow:['route', 'TELL THEM TO FOLLOW IT'], wait:['clock', 'WAIT ANOTHER HOUR'], back:['eye', 'SEND ONE OF THEM ROUND THE BACK'] };
const SO = { done:null };
function ensureSO(){
  if(document.getElementById('screen-so')) return;
  const ov = document.createElement('div'); ov.className = 'overlay'; ov.id = 'screen-so';
  ov.innerHTML = `<div class="overlay-bg"></div><div class="so-frame" role="dialog" aria-modal="true" aria-labelledby="so-title">
    <div class="so-title" id="so-title">THE ABUJA VAN · LIVE FEED</div>
    <div class="so-top"><span class="so-rec">${ico('dot', 'fill')}<span>REC</span></span><span class="so-where">ZUMA COURT · WUSE II</span><span class="v13-mono" id="so-clock">14:10</span><span class="v13-mono" id="so-frames"></span></div>
    <div class="so-view"><div class="so-bld"><div class="so-sign">ZUMA COURT</div>${'<i></i>'.repeat(12)}</div><div class="so-gate">${'<i></i>'.repeat(6)}</div><div class="so-lamp"></div><div class="so-subj" id="so-subj"></div><div class="so-vf"><i></i><i></i><i></i><i></i></div></div>
    <p class="so-txt" id="so-txt"></p><div class="so-acts" id="so-acts"></div>
    <section class="v13-sheet so-log"><div class="v13-sheet-h">FEED LOG</div><div id="so-log"></div></section></div>`;
  (document.getElementById('game-root') || document.body).appendChild(ov);
  ov.addEventListener('click', e => { const b = e.target.closest('[data-so]'); if(b && !b.disabled) soAct(b.dataset.so); });
}
function soState(){ return I().so; }
function openStakeout(l, cb){
  ensureSO();
  const d = I();
  if(d.so && d.so.lead === l.id && d.so.done){ cb(d.so.txt || ''); return; }
  if(!d.so || d.so.lead !== l.id) d.so = { lead:l.id, i:0, frames:4, log:[], used:{}, end:null, done:false };
  save();
  SO.done = cb;
  showSO();
}
function showSO(){
  ensureSO();
  showOverlay('screen-so'); callBadge(false);
  modalOn('screen-so', showSO);
  renderSO(true);
}
function soLogLine(x){
  const IC = { photo:'photo', plate:'notebook', match:'flag' }[x.k] || 'dot';
  const txt = x.k === 'photo' ? `${x.t} — photographed` : x.k === 'plate' ? `${x.t} — plate ${x.plate}` : x.k === 'match' ? 'MATCH: the Lekki gatehouse car' : (x.text || '');
  return `<div class="so-ll">${ico(IC)}<span class="v13-mono">${esc(txt)}</span></div>`;
}
function renderSO(fresh){
  const s = soState(); if(!s) return;
  const e = SO_EVENTS[s.i];
  document.getElementById('so-frames').textContent = `FRAMES ${s.frames}`;
  document.getElementById('so-log').innerHTML = s.log.length ? s.log.map(soLogLine).join('') : '<div class="so-ll so-none">Nothing logged yet.</div>';
  const subj = document.getElementById('so-subj');
  if(s.end || !e){
    document.getElementById('so-clock').textContent = 'FEED ENDS';
    subj.innerHTML = '';
    document.getElementById('so-txt').textContent = s.end || 'The light goes. The team calls it.';
    document.getElementById('so-acts').innerHTML = `<button class="v13-btn primary" data-so="finish">END THE FEED${ico('next')}</button>`;
    return;
  }
  document.getElementById('so-clock').textContent = e.t;
  if(fresh !== false){ subj.innerHTML = e.sil ? SIL[e.sil] : ''; subj.classList.remove('in'); void subj.offsetWidth; subj.classList.add('in'); }
  document.getElementById('so-txt').textContent = e.txt;
  document.getElementById('so-acts').innerHTML = e.acts.map(a => {
    const used = !!s.used[s.i + a], off = used || (a === 'photo' && s.frames <= 0);
    return `<button class="v13-btn${used ? ' used' : ''}" data-so="${a}"${off ? ' disabled' : ''}>${ico(SO_LABEL[a][0])}<span>${SO_LABEL[a][1]}</span></button>`;
  }).join('') + (e.empty ? '' : `<button class="v13-btn" data-so="next"><span>TIME PASSES</span>${ico('next')}</button>`);
}
function soAct(a){
  const s = soState(); if(!s || s.done) return;
  const e = SO_EVENTS[s.i];
  if(a === 'finish'){ finishSO(); return; }
  if(!e || s.end) return;
  if(a === 'next'){ s.i++; save(); renderSO(); return; }
  if(!e.acts.includes(a) || s.used[s.i + a]) return;
  if(a === 'photo' && s.frames <= 0) return;
  s.used[s.i + a] = true;
  if(a === 'photo'){ s.frames--; s.log.push({ k:'photo', t:e.t }); if(e.rel) intelSet(e.rel); sfx('sfxBlip'); }
  if(a === 'plate'){
    s.log.push({ k:'plate', t:e.t, plate:e.plate });
    if(e.relPlate){
      intelSet(e.relPlate);
      if(intelHas('lead_gatehouse')){
        // the match exists either way (the finale and court can use it); only Recruit is told
        intelSet('so_plate_match'); knowAdd('poolcar', 'You');
        if(recruit() && !s.matchTold){ s.matchTold = true; applyEffect({ intel:+10 }); if(typeof toast === 'function') toast('PLATE MATCH', 'LND 590 XA — the same car as the Lekki gatehouse log', 3200); s.log.push({ k:'match' }); }
      }
    }
  }
  if(a === 'follow'){ intelSet('so_followed'); s.end = 'The team stays three cars back to the Airport Road. At the Lugbe checkpoint the officers lift the barrier for the Corolla without a word — then stop the van. By the time they are waved through, it is gone.'; }
  if(a === 'wait'){ s.end = 'They wait another hour. Nothing happens. Sometimes nothing happens.'; }
  if(a === 'back'){ intelSet('so_back'); s.end = 'One of them walks round the back. Behind Zuma Court: a motorbike with a toolbox strapped on, engine still warm. Someone came in the back way. The camera was on the wrong door.'; }
  save();
  renderSO(false);
}
function finishSO(){
  const s = soState(); if(!s) return;
  if(!s.done){
    const got = ['so_courier', 'so_poolcar', 'so_plate', 'so_plate_match', 'so_back', 'so_followed'].filter(intelHas);
    const parts = [];
    if(intelHas('so_courier')) parts.push('a courier carrying cash bags into Zuma Court');
    if(intelHas('so_poolcar')) parts.push('an envelope passed into a government car');
    if(intelHas('so_plate')) parts.push('its plate, LND 590 XA' + (recruit() && intelHas('so_plate_match') ? ' — the car from the Lekki gatehouse log' : ''));
    if(intelHas('so_back')) parts.push('a back entrance nobody mentioned');
    s.got = got; s.done = true;
    s.txt = parts.length ? 'From the feed you logged ' + parts.join(', ') + '.' : 'A long afternoon on a grainy feed, and nothing you can use. That happens too.';
    if(intelHas('so_poolcar')) addInvEvidence('inv_stakeout');
    save();
  }
  modalOff('screen-so');
  const cb = SO.done; SO.done = null;
  if(cb) cb(s.txt);
}
window.openStakeout = openStakeout;

/* ---------------- Apex: an Abuja officer on a wire, you feed every answer ----------------
   Same in both difficulties (A8): the meter, the pause and the one-shot cover card are
   consequences, not hints. State persists in I().uc after every answer. */
const UC_STEPS = [
  { who:'RECEPTIONIST', q:'Good afternoon. Your name, sir?', opts:[['Obinna Anyanwu.', 0], ['Kelechi— sorry. Obinna. Obinna Okafor.', 35], ['Why do you need my name?', 15]] },
  { who:'RECEPTIONIST', q:'And who referred you to us?', opts:[['Alhaji Danjuma, at Bluewater.', 0], ['A friend at NACECA.', 75], ['I found you online.', 20]] },
  { probe:true, txt:'She turns to photocopy his ID. The visitor book lies open on the desk.', act:'Tell him to read the visitor book', sus:15, got:'uc_book', res:'Two lines repeat every month: "C.A. — 1st, 10:00" and "Bluewater — Kunle".' },
  { who:'BARR. TAMUNO BRIGGS', q:'So. What will this company do?', opts:[['Generator parts. I import through Onitsha.', 0], ['Logistics. Haulage.', 20], ['Consulting, mostly.', 25]] },
  { who:'BARR. TAMUNO BRIGGS', q:'Ten days is fast. What were you told it costs?', opts:[['₦450,000. Ten days.', 0], ['Whatever it costs.', 15], ['₦200,000.', 10]] },
  { probe:true, txt:'Briggs mentions they can provide "a director, if you\'d rather not be on paper".', act:'Have him ask if it works like it does for C.A. Consulting', sus:30, got:'uc_nominee', res:'He smiles. "Bimpe handles our nominees. Our C.A. client has never once set foot in this office. That is the service."' },
  { who:'BARR. TAMUNO BRIGGS', q:'Leave a number. We will call you when the name is reserved.', opts:[['Give the cover SIM.', 0], ['Give your own number.', 50], ["Say you'll call back.", 10]] },
  { probe:true, txt:'On the way out he passes the out-tray. A stack of invoices, the top one face up.', act:'Tell him to pocket the top invoice', sus:25, got:'uc_invoice', res:'Invoice from C.A. Consulting Services Ltd to the Ugbowo Relief Foundation. "Retainer, monthly." ₦10M.' },
];
const UC = { done:null };
function ensureUC(){
  if(document.getElementById('screen-uc')) return;
  const ov = document.createElement('div'); ov.className = 'overlay'; ov.id = 'screen-uc';
  ov.innerHTML = `<div class="overlay-bg"></div><div class="uc-frame" role="dialog" aria-modal="true" aria-labelledby="uc-title">
    <div class="uc-title" id="uc-title">APEX · AN OFFICER ON A WIRE</div>
    <div class="uc-top"><span>SUSPICION</span><div class="v13-meter uc-meter"><i id="uc-fill"></i></div><b class="v13-mono" id="uc-val">0</b></div>
    <div id="uc-body"></div></div>`;
  (document.getElementById('game-root') || document.body).appendChild(ov);
  ov.addEventListener('click', e => { const b = e.target.closest('[data-uc]'); if(b && !b.disabled) ucAct(b.dataset.uc, b.dataset); });
}
function ucState(){ return I().uc; }
function openUndercover(l, cb){
  ensureUC();
  const d = I();
  if(d.uc && d.uc.lead === l.id && d.uc.done){ cb(d.uc.txt || ''); return; }
  if(!d.uc || d.uc.lead !== l.id){
    d.uc = { lead:l.id, i:-1, sus:heatNow() >= 60 ? 15 : 0, got:[], log:[], blown:false, done:false };
    if(d.uc.sus) d.uc.log.push({ t:'NACECA has been on the news all day. The receptionist looks twice.' });
  }
  knowAdd('cover', 'You');
  save();
  UC.done = cb;
  showUC();
}
function showUC(){
  ensureUC();
  showOverlay('screen-uc'); callBadge(false);
  modalOn('screen-uc', showUC);
  renderUC();
}
function ucLogHTML(s){ return s.log.map(x => `<div class="uc-log${x.got ? ' got' : ''}">${x.got ? ico('check') : ''}<span>${esc(x.t)}</span></div>`).join(''); }
function renderUC(){
  const s = ucState(), body = document.getElementById('uc-body'); if(!s || !body) return;
  const fill = document.getElementById('uc-fill'), sus = Math.min(100, s.sus);
  fill.style.width = sus + '%';
  fill.className = sus >= 70 ? 'hi' : sus >= 40 ? 'mid' : '';
  document.getElementById('uc-val').textContent = String(sus);
  if(s.i < 0){
    body.innerHTML = `<section class="v13-sheet uc-cover"><div class="v13-sheet-h">THE COVER</div>
      <dl><div><dt>NAME</dt><dd>Obinna Anyanwu</dd></div><div><dt>BUSINESS</dt><dd>Generator-parts importer, Onitsha</dd></div>
      <div><dt>WANTS</dt><dd>A company registered in ten days</dd></div><div><dt>REFERRED BY</dt><dd>Alhaji Danjuma at Bluewater</dd></div>
      <div><dt>BUDGET</dt><dd class="v13-mono">₦450,000</dd></div><div><dt>PHONE</dt><dd>The cover SIM. Never his own.</dd></div></dl></section>
      <p class="uc-note">Learn it. Once he is through that door, neither of you can look at this card again. Every answer he gives is the one you feed him.</p>
      <div class="uc-acts"><button class="v13-btn primary" data-uc="go">KNOCK ON SUITE 4B${ico('next')}</button></div>`;
    return;
  }
  const st = UC_STEPS[s.i], logH = ucLogHTML(s);
  if(s.blown || !st){
    ucFinalize();
    body.innerHTML = logH + `<section class="v13-sheet uc-res"><div class="v13-sheet-h">WHAT HE WALKED OUT WITH</div><p>${esc(s.txt)}</p></section>
      <div class="uc-acts"><button class="v13-btn primary" data-uc="end">LEAVE ZUMA COURT${ico('next')}</button></div>`;
    return;
  }
  if(st.probe){
    body.innerHTML = logH + `<p class="uc-txt">${esc(st.txt)}</p><div class="uc-opts"><button class="uc-opt" data-uc="probe">${esc(st.act)}</button><button class="uc-opt" data-uc="skip">Leave it. Stay in character.</button></div>`;
    return;
  }
  body.innerHTML = logH + `<div class="uc-who">${esc(st.who)}</div><p class="uc-q">"${esc(st.q)}"</p>
    <div class="uc-opts">${st.opts.map((o, k) => `<button class="uc-opt" data-uc="ans" data-k="${k}">${esc(o[0])}</button>`).join('')}</div>`;
}
function ucAct(a, ds){
  const s = ucState(); if(!s) return;
  if(a === 'end'){ if(!s.done) ucFinalize(); modalOff('screen-uc'); const cb = UC.done; UC.done = null; if(cb) cb(s.txt); return; }
  if(s.done) return;
  if(a === 'go'){ if(s.i < 0){ s.i = 0; save(); renderUC(); } return; }
  const st = UC_STEPS[s.i]; if(!st || s.blown) return;
  if(a === 'ans' && !st.probe){ const o = st.opts[+ds.k]; if(!o) return; s.sus += o[1]; s.log.push({ t:`${st.who}: "${st.q}" — You: "${o[0]}"${o[1] >= 30 ? ' (a pause. Too long.)' : ''}` }); if(o[1]) sfx('sfxFail'); }
  else if(a === 'probe' && st.probe){ s.sus += st.sus; s.got.push(st.got); s.log.push({ t:st.res, got:true }); sfx('sfxBlip'); }
  else if(a === 'skip' && st.probe){ s.log.push({ t:'You let it go.' }); }
  else return;
  if(s.sus >= 100){ s.blown = true; s.log.push({ t:'Briggs closes the folder. "I think we\'re finished, Mr. — whatever your name is."' }); }
  s.i++;
  save();
  renderUC();
}
/* the outcome, applied once */
function ucFinalize(){
  const s = ucState(), d = I(); if(!s || s.done) return;
  s.done = true;
  if(s.blown){
    d.alert = (d.alert || 0) + 1; knowAdd('cover', 'Apex Corporate Services'); intelSet('apex_blown');
    s.txt = 'The cover is blown. They are polite, too polite. By morning Suite 4B has new locks and a "To Let" sign — and somebody has made a phone call about you.' + (s.got.length ? ` You still walked out with ${s.got.length} thing${s.got.length > 1 ? 's' : ''} you can use.` : '');
  } else {
    if(s.got.includes('uc_invoice')){ applyEffect({ intel:+12 }); addInvEvidence('inv_invoice'); }
    if(s.got.includes('uc_book')) applyEffect({ intel:+6 });
    if(s.got.includes('uc_nominee')) applyEffect({ intel:+6 });
    if(typeof unlock === 'function' && s.sus < 40) safe(()=>unlock('cover_held'), 'ach');
    s.txt = s.got.length ? `Your cover held. You walked out with: ${s.got.map(g => ({ uc_book:'the visitor book pattern', uc_nominee:"Briggs's admission about C.A.'s nominee", uc_invoice:'a C.A. Consulting invoice to the Foundation' }[g])).join('; ')}.` : 'Your cover held, and you took nothing. Clean — and empty.';
  }
  save();
}
window.openUndercover = openUndercover;

})();
