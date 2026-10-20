/* =========================================================================
   NACECA · v14 merge — "The Case File" and Season 2 in one game
   The Case File (srccf/: the Case Desk, the weekly briefings with Adaeze,
   her trial in Benin, the case review) was built in a parallel session on
   v12, before Phase 2 and Season 2. This file is where the two meet:
   - its radio bulletins are Season 1's, so they play on Season 1 cases only;
   - in Season 2 the evidence button and J open the case file, because the
     Case Desk holds Season 1's investigation;
   - Adaeze's trial at the end of Season 1 decides how Season 2 remembers
     her (convicted on some counts, or discharged on a no-case submission).
   ========================================================================= */
(function(){
'use strict';
const V13 = window.V13; if(!V13) return;
const S1_CASES = ['m0', 'm1', 'm2', 'm3', 'm3n', 'm4', 'm5', 'm6', 'm7', 'm8'];

/* ---------- radio bulletins: Season 1 cases only (not the offices, the car or Season 2) ---------- */
if(typeof window.radioPlay === 'function') V13.wrap('radioPlay', orig => function(mid){ if(!S1_CASES.includes(mid)) return; return orig.apply(this, arguments); });

/* ---------- Season 2: the evidence button and J open the case file ---------- */
const inS2 = ()=>{ const m = S.game && S.game.currentMission; return !!m && (V13.isS2(m) || !!(V13.HUBS && V13.HUBS[m])); };
/* (the Case Desk redirect for Season 2 is at the end of this file, with the Season 2 case file) */

/* ---------- Adaeze's trial (The Case File) → Season 2's memory of her ---------- */
const court = ()=>{ try{ return typeof I === 'function' ? (I() || {}).court : null; }catch(e){ return null; } };
/* once, the first time Season 2 loads: a trial that convicted her on any count reads as 'proven';
   a discharge on a no-case submission reads as 'unproven', with the words changed to say so.
   Season 2 keeps its own reading in S.game.s2.s1fate (read through V13.s1fate()); Season 1's verdict
   (moralChoices.finale, flags.finale) is never rewritten, so its epilogue and court still tell it right (CN13). */
V13.adaptS1Fate = function(){
  const s = V13.s2();
  // a save from the kit's first build rewrote Season 1's verdict: put it back, and keep Season 2's reading
  if(s.fateDone && !s.s1fate && s.s1finale != null){
    const m = V13.mc(); m.finale = s.s1finale; if(S.game.flags) S.game.flags.finale = s.s1finale;
    s.s1fate = (s.adaezeCounts || 0) >= 1 ? 'proven' : 'unproven';
  }
  if(s.fateDone) return; s.fateDone = 1;
  const c = court(); if(!c || !Array.isArray(c.proven)) return;
  const m = V13.mc(), n = c.proven.length;
  s.s1finale = m.finale || null; s.adaezeCounts = n;
  s.s1fate = n >= 1 ? 'proven' : 'unproven';
  if(n === 0) s.adaezeDischarged = 1;
  fateText();
};
const NUM = ['no', 'one', 'two', 'three', 'four'];
function fateText(){
  const s = (S.game && S.game.s2) || {};
  const setLine = (key, starts, text)=>{ const L = DIALOGUE[key]; if(!L) return; const l = L.find(x => (x.text || '').startsWith(starts) || x._v14 === starts); if(l){ l.text = text; l._v14 = starts; } };
  const n = s.adaezeCounts;
  if(n >= 1 && n <= 3){
    setLine('m13_dg_adaeze_proven', 'Four counts', `Convicted on ${NUM[n]} count${n > 1 ? 's' : ''} of four${n > 1 ? ', her appeal pending' : ''} — and not one word from her about anyone else. Loyalty is rare, Kelechi. I notice it. I reward it — even late.`);
  }
  if(s.adaezeDischarged){
    setLine('m9_osagie_unproven', 'Six weeks. Adaeze sits', 'Six weeks. Adaeze walked out of court on a no-case submission and went home to Ikoyi. Dismissed from service — and that, they tell me, is the end of it.');
    setLine('m9_osagie_unproven', 'And at six this evening', "And at six this evening Abuja asks for the one exhibit that might have made it stick: 'Exhibit 14 to the 06:00 flight.' Signed for the Director-General — by his PA, a Mr. Kuti.");
    setLine('m13_dg_adaeze_unproven', 'Relieved of command', 'Discharged on a no-case submission, and dismissed the same week. The court found nothing it could hold. I chair the committee that reviews her pension.');
    const X = (V13.COURT_DATA && V13.COURT_DATA.cross || []).find(a => a.id === 'adaeze_unproven');
    if(X && !X._v14){
      X._v14 = 1;
      const q = X.q && X.q[0]; if(q) q.text = 'Agent, you accused your own commander. A court discharged her on a no-case submission. The prosecution could not make out a case.';
      const a = (X.answers || [])[0]; if(a) a.text = "The court discharged her. I still believe what I saw. This case doesn't depend on her.";
    }
  }
}
/* the Season 2 epilogue and the Case 09 headline, when she was discharged */
if(typeof V13.epilogueS2 === 'function'){
  const epi = V13.epilogueS2;
  V13.epilogueS2 = function(){
    const out = epi.apply(this, arguments);
    try{ const s = (S.game && S.game.s2) || {}; if(s.adaezeDischarged) for(const e of out || []) if(e.name === 'COMMANDER ADAEZE' && /^Still uncharged/.test(e.text || '')) e.text = 'Discharged at trial, dismissed from service. She has never said who she answered to. Nobody has made her.'; }catch(e){}
    return out;
  };
}
if(V13.AFTER && V13.AFTER.m9 && typeof V13.AFTER.m9.headline === 'function'){
  const h = V13.AFTER.m9.headline;
  V13.AFTER.m9.headline = function(st){
    const r = h.apply(this, arguments);
    try{ const s = (S.game && S.game.s2) || {}; if(s.adaezeDischarged && r && /inquiry stalls/.test(r.head || '')) return { pub:r.pub, head:'Ekosodin evidence moved to Abuja weeks after Adaeze discharge', ded:'The commander walked free on a no-case submission. The drive recovered with the freed UNIBEN student left Benin on the first flight.' }; }catch(e){}
    return r;
  };
}
/* every time a Season 2 case or office loads: the fate is decided once; the words are re-applied after a reload */
V13.wrap('loadMission', orig => function(id){
  if(V13.isS2(id) || (V13.HUBS && V13.HUBS[id])){ try{ V13.adaptS1Fate(); fateText(); }catch(e){ console.warn('[v14] fate', e); } }
  return orig.apply(this, arguments);
});

/* ---------- the end of Season 1: the trial, the epilogue, the case review, then Season 2 ---------- */
V13.reviewThenS2 = function(go){
  let shown = false;
  try{ if(typeof openReview === 'function' && typeof I === 'function' && !I().reviewShown){ I().reviewShown = true; shown = true; openReview(()=>{ showOverlay(null); go(); }); } }catch(e){ console.warn('[v14] review', e); shown = false; }
  if(!shown) go();
};
})();

/* =========================================================================
   The Season 2 case file. The Case File key (TAB), the HUD's CASE FILE and
   EVIDENCE buttons and J open Season 1's operations table and Case Desk;
   in Season 2 they open this instead: every exhibit so far, case by case,
   with how it will stand up in court, and what Court 5 made of it.
   ========================================================================= */
(function(){
'use strict';
const V13 = window.V13; if(!V13) return;
const GROUPS = [
  ['m9', ['drive_image', 'upstream_ledger', 'evidence_register']],
  ['m10', ['pos_t4_log', 'bvn_link', 'cash_bundles', 'lucky_statement']],
  ['m11', ['fuel_samples', 'waybill_book', 'felix_phone', 'barge_track']],
  ['m12', ['loading_log', 'tank3_sample', 'cac_record', 'bank_trail', 'gate_register']],
  ['m13', ['transfer_docket', 'dg_recording']],
  ['m13b', ['visitor_book', 'visitor_book_photo', 'ereba_photo']],
  ['m15', ['barge_cash', 'senator_words']],
];
const Q = { good:['SOUND', 'Collected properly. It should stand up.', 't-confirmed'], contested:['CONTESTED', 'The defence will attack how this was obtained.', 't-probable'], weak:['WEAK', 'It may not get in at all.', 't-allegation'] };
/* every Season 2 exhibit id (the ops table's notes leave these out of Season 1's records) */
V13.S2_EV = GROUPS.flatMap(g => g[1]);
const inS2 = ()=>{ const m = S.game && S.game.currentMission; return !!m && (V13.isS2(m) || !!(V13.HUBS && V13.HUBS[m])); };
const ico = n => (typeof icon === 'function' ? icon(n) : '');
const rec = ()=>typeof isRecruit === 'function' && isRecruit();
const hudOn = ()=>{ const h = document.getElementById('hud'); return !!h && h.style.display !== 'none'; };
const CF = { open:false, hud:false, pause:false, prev:null };
document.addEventListener('v13:navreset', ()=>{ CF.open = false; CF.pause = false; CF.prev = null; });
const closeCF = ()=>{
  if(typeof v13ModalEnd === 'function') try{ v13ModalEnd('screen-s2case'); }catch(e){}
  const wasHud = CF.hud, fromPause = CF.pause, prev = CF.prev; CF.open = false; CF.pause = false; CF.prev = null;
  // (SC1) opened from the pause menu (CASE FILE): BACK and Esc go back to the pause menu, as Season 1's Case Desk
  // does, and its RESUME puts the HUD back. (The HUD was already hidden under the pause menu, so wasHud is false.)
  const pa = document.getElementById('screen-pause');
  if(fromPause && pa){
    const ov = document.getElementById('screen-s2case'); if(ov) ov.classList.remove('show');
    showOverlay('screen-pause');
    return;
  }
  // opened over a screen (the title, the case files, the operations table): BACK returns to it, as the Case Desk does
  if(prev && document.getElementById(prev)){ showOverlay(prev); return; }
  showOverlay(null);
  if(wasHud && S.game && S.game.currentMission && typeof showHUD === 'function') showHUD(true);
};
V13.openCaseFileS2 = function(){
  let ov = document.getElementById('screen-s2case');
  if(!ov){ ov = V13.el('div', 'overlay', ''); ov.id = 'screen-s2case'; document.getElementById('game-root').appendChild(ov); }
  // what BACK returns to is read as the case file comes on screen: a re-render while it is shown (the pause menu's
  // RESUME, TAB again) keeps it; one that something else closed (a scripted beat, showOverlay) is opened afresh
  if(!CF.open || !ov.classList.contains('show')){
    CF.hud = hudOn(); CF.pause = !!document.querySelector('#screen-pause.show'); CF.open = true;
    CF.prev = CF.pause ? null : ([...document.querySelectorAll('.overlay.show')].map(o => o.id).find(id => id && id !== 'screen-s2case') || null);
  }
  const ev = S.game.evidence || [], q = S.game.evQ || {}, tr = V13.s2().trial || {}, ex = tr.exhibits || {};
  const cur = S.game.currentMission, card = V13.CARD(cur) || {}, hub = V13.HUBS && V13.HUBS[cur];
  const name = id => { const e = ev.find(x => x.id === id); return e ? e.name : id; };
  const R = rec();
  const sections = GROUPS.map(([m, ids]) => {
    const have = ids.filter(id => ev.some(e => e.id === id)); if(!have.length) return '';
    const c = V13.CARD(m) || { num:'', name:m };
    const rows = have.map(id => {
      const k = Q[q[id] || 'good'] || Q.good, p = ex[id], rej = (tr.rejected || []).includes(id);
      const court = p ? `<i class="s2c-p v13-tier t-confirmed">${V13.esc(p)}</i>` : rej ? '<i class="s2c-p v13-stamp">REJECTED</i>' : '';
      // (R15) the "why" behind a tier is Recruit's; Senior keeps the word
      return `<li class="s2c-row"><b>${V13.esc(name(id).replace(/ \((contested|weak)\)$/, ''))}</b><span class="s2c-q v13-tier ${k[2]} ${q[id] || 'good'}"${R ? ` title="${V13.esc(k[1])}"` : ''}>${k[0]}</span>${court}</li>`;
    }).join('');
    return `<section class="s2c-sec v13-sheet"><h3><span>CASE ${V13.esc(c.num)}</span>${V13.esc(c.name)}</h3><ul>${rows}</ul></section>`;
  }).join('');
  const verdict = tr.d1 ? `<p class="s2c-trial">COURT 5 · Lucky Edafe: <b>${tr.d1 === 'guilty' ? 'GUILTY' : 'NOT GUILTY'}</b> · Felix Ugbekile: <b>${({ plea:'PLEADED GUILTY', guilty:'GUILTY', notguilty:'NOT GUILTY' })[tr.d2] || '—'}</b> · Sotonye Jumbo: <b>${({ plea:'PLEADED GUILTY', guilty:'GUILTY', notguilty:'NOT GUILTY' })[tr.d3] || '—'}</b></p>` : '';
  const srcN = V13.srcList ? V13.srcList().length : 0;
  ov.innerHTML = `<div class="overlay-bg"></div><div class="src-frame s2c-frame" role="dialog" aria-label="Case file">
    <div class="src-head"><div><div class="plan-k">OPERATION UPSTREAM · CASE FILE</div><div class="plan-t">${V13.esc(hub ? hub.sub : ((card.num ? 'CASE ' + card.num + ' · ' : '') + (card.name || '')))}</div></div>
      <div class="src-fund">EXHIBITS <b>${GROUPS.reduce((n, [, ids]) => n + ids.filter(id => ev.some(e => e.id === id)).length, 0)}</b></div><button class="ph-x s2c-x" type="button" aria-label="Close">${ico('close') || 'CLOSE'}</button></div>
    <p class="src-lead">Every exhibit you hold, and how a defence lawyer will see it. ${srcN ? `${srcN} source${srcN > 1 ? 's' : ''} on the board — what they tell you is never evidence on its own.` : ''}</p>
    ${verdict}
    <div class="s2c-grid">${sections || '<p class="src-none">Nothing logged yet. Evidence you collect lands here, with how it will stand up in court.</p>'}</div>
    <div class="src-foot"><button class="btn primary s2c-done" type="button">BACK</button></div></div>`;
  ov.querySelector('.s2c-x').onclick = closeCF; ov.querySelector('.s2c-done').onclick = closeCF;
  showOverlay('screen-s2case');
  // Esc closes it (BACK); if the pause menu opens over it, RESUME brings it back
  if(typeof v13Modal === 'function') try{ v13Modal('screen-s2case', { onEsc:closeCF, resume:()=>V13.openCaseFileS2() }); }catch(e){}
};
for(const fn of ['openCaseFile', 'openEvidenceBoard']) if(typeof window[fn] === 'function') V13.wrap(fn, orig => function(){ if(inS2()) return V13.openCaseFileS2(); return orig.apply(this, arguments); });
if(typeof window.openDesk === 'function') V13.wrap('openDesk', orig => function(){ if(inS2()) return V13.openCaseFileS2(); return orig.apply(this, arguments); });

/* (R03) In Season 2, J, the pause menu and TAB all open this case file: the HUD's "J · CASE DESK" pill would be
   a second TAB · CASE FILE, so it goes, and the pause button says what it opens. Outside Season 2, both are back. */
const deskUi = ()=>{
  const on = inS2();
  if(document.body) document.body.classList.toggle('s2-casefile', on);
  const b = document.getElementById('btn-pause-desk'), want = on ? 'CASE FILE' : 'CASE DESK';
  if(b && b.dataset.s2label !== want){ b.innerHTML = ico('folder') + want; b.dataset.s2label = want; }
};
const after = name => { if(typeof window[name] === 'function') V13.wrap(name, orig => function(){ const r = orig.apply(this, arguments); try{ deskUi(); }catch(e){} return r; }); };
after('loadMission'); after('refreshHUD');
if(typeof window.togglePause === 'function') V13.wrap('togglePause', orig => function(){ try{ deskUi(); }catch(e){} return orig.apply(this, arguments); });
V13.deskUi = deskUi;
})();

/* =========================================================================
   Builds whose v12 hub module doesn't export its phone book (V12.PHONEBOOK)
   or know the Season 2 offices: the phone still names Season 2's contacts
   and shows the office's place and time in its header. And a Season 2
   document failed twice is weak evidence, so its name says (weak).
   ========================================================================= */
(function(){
'use strict';
const V12 = window.V12, V13 = window.V13; if(!V12 || !V13) return;
if(!V12.PHONEBOOK){
  const fix = ov => {
    const PB = V13._pb, cur = S.game && S.game.currentMission, hub = V13.HUBS && V13.HUBS[cur];
    const top = ov.querySelector('.ph-top span'); if(top && hub && top.textContent !== hub.sub.toUpperCase() && top.textContent !== hub.sub) top.textContent = hub.sub;
    ov.querySelectorAll('.ph-row[data-id]').forEach(row => {
      const p = PB[row.dataset.id]; if(!p || row._s2) return; row._s2 = 1;
      const av = row.querySelector('.ph-av'); if(av){ av.textContent = p.ini; av.style.background = p.col; }
      const b = row.querySelector('.ph-meta b'); if(b) b.textContent = p.name;
    });
    const ch = ov.querySelector('.ph-ch'); if(ch){ const b = ch.querySelector('b'), id = b && b.textContent, p = id && PB[id];
      if(p){ b.textContent = p.name; const av = ch.querySelector('.ph-av'); if(av){ av.textContent = p.ini; av.style.background = p.col; } } }
  };
  let mo = null;
  const watch = ()=>{ const ov = document.getElementById('screen-phone'); if(!ov || mo) return; mo = new MutationObserver(()=>fix(ov)); mo.observe(ov, { childList:true, subtree:true }); fix(ov); };
  if(typeof V12.openPhone === 'function'){ const op = V12.openPhone; V12.openPhone = function(){ const r = op.apply(this, arguments); try{ watch(); const ov = document.getElementById('screen-phone'); if(ov) fix(ov); }catch(e){} return r; }; }
}
V13.wrap('collectEvidence', orig => function(ev){
  try{ if(ev && typeof ev.name === 'string' && / \(contested\)$/.test(ev.name) && V13.isS2(S.game.currentMission) && (S.game.evQ || {})[ev.id] === 'weak') ev = Object.assign({}, ev, { name:ev.name.replace(/ \(contested\)$/, ' (weak)') }); }catch(e){}
  return orig.call(this, ev, ...[].slice.call(arguments, 1));
});
})();
