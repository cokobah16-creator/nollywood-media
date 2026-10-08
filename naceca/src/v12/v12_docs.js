/* =========================================================================
   NACECA · v12 documents — tap the line that proves it
   Every forensic check is now two decisions: your conclusion, and the line
   in the document that proves it. Nothing resets on a wrong answer: the
   first miss costs reputation, the second makes the evidence contested and
   the case moves on without it (fail forward). Read the Room underlines
   lines worth a second look; Pressure Point forgives the first miss.
   Casework difficulty (beta): Recruit keeps the deduction hints — an extra
   miss, the late underline, red/green colouring and the arrows in the
   forensic screens, and the "Right idea" partial feedback. Senior Agent
   strips them at render time. Read the Room is a capability the player
   bought, so its underline works in both modes.
   ========================================================================= */
(function(){
'use strict';
const V12 = window.V12;

/* per-document rules: what proves it, what's worth a look, what happens if you fail */
const DOCS = {
  market_phone_scan: {
    ask:'Which message is being staged <b>from</b> this device, not just sent to it? Pick it, then tap what on the phone proves it.',
    proof:['IMG_001', 'IMG_002'], look:['IMG_001', 'IMG_002', '+1-415', 'UNKNOWN-BANK'],
    fail:{ mode:'continue', note:'The phone locks mid-extraction. You log what you saw — the defence will call it partial.' },
  },
  checkpoint_manifest: {
    ask:'Pick the <b>strongest single anomaly</b> that gives you legal grounds to open the back. Then tap the line that proves it.',
    proof:['SEAL #'], look:['SEAL #', 'WEIGHT', 'INSURANCE'],
    fail:{ mode:'continue', note:'Inspector Chidi signs for the search himself. It will hold — just. Agency Standing −3.', effect:{ agencyFavour:-3 } },
  },
  checkpoint_lie: {
    ask:'One of his statements is <b>contradicted by the papers</b>, not just unproven. Pick it, then tap the line that breaks it.',
    proof:['first issued', '3 entries'], look:['first issued', '3 entries', 'registered to', 'Five years', 'five years'],
    fail:{ mode:'stop', note:'Musa folds his arms. "I want lawyer." He won\'t say more today — but the ledger might still turn him.' },
  },
  tower_call_trace: {
    ask:'Pick the <b>only location consistent with every reading</b>. Then tap the reading that settles it.',
    proof:['EKO-0122', 'STRONG'], look:['EKO-0122', 'STRONG', 'WEAK', 'NONE'],
    fail:{ mode:'continue', note:'You call it for Ekosodin on instinct. The trace is logged, but it won\'t stand alone in court.' },
  },
  mansion_safe: {
    ask:'Work out the <b>six digits</b> he set. Then tap the line that tells you which date, or which order.',
    proof:['14 July 1986', 'BIG number first', 'big number first', 'the day they gave me my name'], look:['14 July 1986', 'BIG number', 'big number', '22·03·86', '22 March'],
    fail:{ mode:'continue', note:'The dial locks out. Uche pries the hinge with a crowbar. The drives come out, but the chain of custody takes a dent.', effect:{ integrity:-1 } },
  },
};
V12.DOCS = DOCS;

const strip = h => h.replace(/<[^>]+>/g, '').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
const recruit = ()=>typeof isRecruit === 'function' && isRecruit();
const ico = (n, c)=>typeof icon === 'function' ? icon(n, c) : '';
/* Senior Agent: the screen reads like raw extraction — no answer colouring,
   no "← discrepancy" arrows, no "(FAKE)" style annotations. */
V12.seniorScreen = html => String(html || '')
  .replace(/<span class="cw-hint">[\s\S]*?<\/span>/g, '')
  .replace(/<span class="(?:green|red)">([\s\S]*?)<\/span>/g, '$1')
  .replace(/[ \t]*←[^\n<]*/g, '');

/* build a spec from the old puzzle data */
V12.docFromPuzzle = key => {
  const P = PUZZLES[key], X = DOCS[key] || {};
  if(!P) return null;
  return {
    key, title:P.title, screen:P.screen, ask:X.ask || P.prompt,
    options:(P.options || []).map(o => ({ text:o.text, correct:!!o.correct })),
    proof:X.proof || [], look:X.look || X.proof || [], fail:X.fail || { mode:'continue', note:'' },
    onCorrect:P.onCorrect || {}, onWrong:P.onWrong || {},
  };
};

window.openPuzzle = function(key, onResolve){
  const d = document.getElementById('screen-dialogue'); if(d && d.classList.contains('show')) return;
  S.game._docLocked = S.game._docLocked || {};
  if(S.game._docLocked[key]){ toast('NOT TODAY', key === 'checkpoint_lie' ? 'Musa won\'t say more without a lawyer.' : 'That check is closed.', 2200); return; }
  const spec = V12.docFromPuzzle(key); if(!spec) return;
  V12.openDoc(spec, onResolve);
};

/* the document screen */
V12.openDoc = function(spec, done){
  const ov = document.getElementById('screen-puzzle'); if(!ov) return;
  const frame = ov.querySelector('.puzzle-frame');
  S.game._docMiss = S.game._docMiss || {};
  const rec = recruit();
  const allowed = rec ? 3 : 2;
  const st = { opt:null, line:null, misses:S.game._docMiss[spec.key] || 0, free:V12.has('pressure') && !(S.game._docFree || {})[spec.key], over:false };
  const raw = (rec ? spec.screen : V12.seniorScreen(spec.screen)).split('\n');
  const isRule = t => /^[\s─━═\-=]+$/.test(t) && /[─━═\-=]/.test(t);
  const lines = raw.map((html, i) => {
    const plain = strip(html);
    const header = raw[i + 1] != null && isRule(strip(raw[i + 1]));
    const live = !!plain.trim() && !isRule(plain) && !/^\s*\[.*\]\s*$/.test(plain) && !header;
    return { i, html, plain, live, proof:live && spec.proof.some(s => plain.includes(s)), look:live && spec.look.some(s => plain.includes(s)) };
  });
  const needOpt = spec.options.length > 0;
  frame.classList.add('v12-doc');
  frame.classList.toggle('cw-plain', !rec);
  frame.innerHTML = `
    <div class="head"><h2>${spec.title}</h2><div class="v12-doc-head-r"><span class="v12-misses" id="v12-misses"></span><button class="v12-x" id="v12-doc-x" aria-label="Back off">${ico('close')}</button></div></div>
    <div class="v12-doc-body">
      <div class="phone-screen v12-lines" id="v12-lines">${lines.map(l => `<div class="v12-line ${l.live ? 'live' : ''}" data-i="${l.i}">${l.html || '&nbsp;'}</div>`).join('')}</div>
      <div class="v12-doc-side">
        <div class="puzzle-prompt">${spec.ask}</div>
        ${needOpt ? `<div class="v12-step"><div class="v12-step-h"><b>1</b> YOUR CONCLUSION</div><div class="v12-opts" id="v12-opts">${spec.options.map((o, i) => `<button class="v12-opt" data-i="${i}">${o.text}</button>`).join('')}</div></div>` : ''}
        <div class="v12-step"><div class="v12-step-h"><b>${needOpt ? 2 : 1}</b> THE PROOF</div><div class="v12-proof" id="v12-proof">Tap the line in the document that proves it.</div></div>
        <div class="v12-doc-msg" id="v12-doc-msg"></div>
        <div class="v12-doc-actions"><button class="btn primary" id="v12-doc-go" disabled>PUT IT ON RECORD</button></div>
      </div>
    </div>`;
  const $q = s => frame.querySelector(s);
  const pips = ()=>{ $q('#v12-misses').innerHTML = `<span class="lbl">MISSES</span>` + Array.from({ length:allowed }, (_, i) => `<i class="${i < st.misses ? 'lost' : ''}"></i>`).join('') + (st.free ? '<span class="v12-free" title="Pressure Point">+1</span>' : ''); };
  pips();
  const ready = ()=>{ $q('#v12-doc-go').disabled = st.over || st.line == null || (needOpt && st.opt == null); };
  // on short screens the side column scrolls: bring the next step into view
  const reveal = sel => { const el = $q(sel), side = frame.querySelector('.v12-doc-side'); if(el && side && side.scrollHeight > side.clientHeight + 4){ try{ el.scrollIntoView({ block:'nearest', behavior:'smooth' }); }catch(e){} } };
  frame.querySelectorAll('.v12-line.live').forEach(el => el.addEventListener('click', ()=>{
    if(st.over) return;
    frame.querySelectorAll('.v12-line').forEach(x => x.classList.toggle('sel', x === el));
    st.line = +el.dataset.i;
    $q('#v12-proof').innerHTML = `<span class="q">“${V12.esc(lines[st.line].plain.trim().replace(/\s{2,}/g, ' ').slice(0, 90))}”</span>`;
    if(typeof sfxBlip === 'function') sfxBlip();
    ready(); reveal(needOpt && st.opt == null ? '#v12-opts' : '#v12-doc-go');
  }));
  frame.querySelectorAll('.v12-opt').forEach(b => b.addEventListener('click', ()=>{
    if(st.over) return;
    frame.querySelectorAll('.v12-opt').forEach(x => x.classList.toggle('sel', x === b));
    st.opt = +b.dataset.i; if(typeof sfxClick === 'function') sfxClick(); ready(); reveal(st.line == null ? '#v12-proof' : '#v12-doc-go');
  }));
  const msg = (t, cls)=>{ const m = $q('#v12-doc-msg'); m.className = 'v12-doc-msg ' + (cls || ''); m.innerHTML = t; };
  // Read the Room (a bought capability, both modes) or Recruit casework: underline lines worth a second look
  const lookAfter = V12.has('readroom') ? 4500 : rec ? 9000 : 0;
  let lookT = null;
  if(lookAfter) lookT = setTimeout(()=>{ frame.querySelectorAll('.v12-line').forEach(el => { if(lines[+el.dataset.i].look) el.classList.add('v12-look'); }); if(V12.has('readroom')) msg('<span class="v12-cap">READ THE ROOM</span> A few lines deserve a second look.', 'info'); }, lookAfter);
  const close = (result)=>{
    clearTimeout(lookT);
    frame.classList.remove('v12-doc');
    showOverlay(null);
    if(result !== undefined && typeof done === 'function'){ try{ done(result); }catch(e){ console.error(e); } }
    if(DLG.queue && DLG.queue.length){ const [k2, cb2] = DLG.queue.shift(); setTimeout(()=>startDialogue(k2, cb2), 350); }
  };
  $q('#v12-doc-x').addEventListener('click', ()=>{ if(st.over) return; V12.log('doc_backoff', { key:spec.key }); close(undefined); });
  $q('#v12-doc-go').addEventListener('click', ()=>{
    if(st.over) return;
    const optOk = !needOpt || (spec.options[st.opt] && spec.options[st.opt].correct);
    const lineOk = st.line != null && lines[st.line].proof;
    V12.log('doc_submit', { key:spec.key, optOk, lineOk, miss:st.misses });
    if(optOk && lineOk){
      st.over = true; ready();
      const C = spec.onCorrect || {};
      if(typeof sfxComplete === 'function') sfxComplete();
      frame.querySelectorAll('.v12-line').forEach(el => { if(+el.dataset.i === st.line) el.classList.add('ok'); });
      applyEffect({ integrity:C.integrity, agencyFavour:C.agencyFavour, intel:C.intel });
      msg(`${ico('check')} <b>ON THE RECORD.</b> ${C.intel ? `+${C.intel} INTEL` : ''}${C.evidenceId ? ' · EVIDENCE LOGGED' : ''}`, 'good');
      if(C.evidenceId) collectEvidence({ id:C.evidenceId, name:C.evidenceName || 'Evidence', xp:C.xp || 50 });
      if(spec.onSolved) try{ spec.onSolved(); }catch(e){}
      setTimeout(()=>close(true), 1400);
      return;
    }
    if(typeof sfxFail === 'function') sfxFail();
    const st0 = $q('#v12-lines'); st0.classList.remove('mg-shake'); void st0.offsetWidth; st0.classList.add('mg-shake');
    if(st.free){
      st.free = false; S.game._docFree = S.game._docFree || {}; S.game._docFree[spec.key] = true; pips();
      msg('<span class="v12-cap">PRESSURE POINT</span> That one doesn\'t stick. Look again.', 'info');
      return;
    }
    st.misses++; S.game._docMiss[spec.key] = st.misses; pips();
    if(spec.onWrong) applyEffect(spec.onWrong);
    if(st.misses < allowed){
      const left = allowed - st.misses, more = left === 1 ? 'One more miss' : `${left} more misses`;
      // Recruit hears whether the conclusion was right; Senior gets one neutral line
      if(rec) msg(optOk ? `${ico('warning')} <b>Right idea</b> — but that line won't convince a magistrate.` : `${ico('cross')} <b>That conclusion doesn't hold.</b> ${more} and the defence gets this one.`, 'bad');
      else msg(`${ico('cross')} <b>Not on the record.</b> ${more} and the defence gets this one.`, 'bad');
      return;
    }
    // fail forward: the case moves on without clean evidence
    st.over = true; ready();
    const C = spec.onCorrect || {}, F = spec.fail || {};
    if(F.effect) applyEffect(F.effect);
    if(F.mode === 'stop'){ S.game._docLocked = S.game._docLocked || {}; S.game._docLocked[spec.key] = true; }
    if(F.mode === 'continue' && C.evidenceId){
      S.game.evQ = S.game.evQ || {}; S.game.evQ[C.evidenceId] = 'weak';
      collectEvidence({ id:C.evidenceId, name:(C.evidenceName || 'Evidence') + ' (contested)', xp:Math.round((C.xp || 50) / 3) });
    }
    if(spec.onFailed) try{ spec.onFailed(); }catch(e){}
    msg(`${ico('cross')} <b>THE DEFENCE GETS THIS ONE.</b> ${F.note || ''}`, 'bad');
    const go = $q('#v12-doc-go'); go.disabled = false; go.innerHTML = `CONTINUE ${ico('next')}`;
    go.onclick = (e)=>{ e.stopImmediatePropagation(); close(F.mode === 'continue'); };
    V12.log('doc_failed', { key:spec.key });
  });
  const nMiss = allowed === 3 ? 'Three' : 'Two';
  if(typeof showHint === 'function') showHint('doc_v12', `Pick your conclusion, then tap the line in the document that proves it. ${nMiss} misses and the evidence is contested.`, `Pick your conclusion, then tap the line that proves it. ${nMiss} misses and the evidence is contested.`, 6400);
  showOverlay('screen-puzzle');
  const sc = frame.querySelector('#v12-lines'); if(sc) sc.scrollTop = 0;
};

})();
