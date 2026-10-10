// Team C (court & case review) helpers for the v13_c_* scenarios. Running this file on its own is a no-op.
//   const C = require('./v13_c_lib.cjs').lib(h);
// The setup works with and without the other v13 teams' code: it files warrants and statement verdicts
// through the contract (V12.fileV13Warrant / intelVerdict) when present, and writes the records directly
// otherwise; S.game.intel always starts with an `items` object, so no old-save migration runs.
const PRE_M8 = ['m0', 'm1', 'm2', 'm3', 'm3n', 'm4', 'm5', 'm6', 'm7', 't7'];
const NAMES = {
  fin_recording:'Recorded Ransom Call — Full Trace', fin_courier_phone:"Courier's Phone", fin_drive:"Osas's Flash Drive",
  tower_cdr:'Call Records — Ugbowo Cell', tower_fix:'Cabinet Fix', musa_statement:"Musa's Statement", ransom_ledger:'Ransom Ledger',
  obi_notebook:"Obi's Notebook", co_madam:"Courier's Dropped Phone", laptop:'Encrypted Laptop', cash:'Cash Bundles', safe_drives:'Safe Drives',
  asaba_hostage:'Tobi Onuoha, recovered', asaba_sims:'Pre-activated SIMs',
};
// the best answer to each objection, and a careless one
const BEST = { tainted:'independent', s84:'cert', custody:'keeper', noorder:'s14', warrantless:'s14', inducement:'corroborate', accomplice:'corroborate',
  hearsay:'witness', photocopy:'ctc', ident:'plate', deception:'s14', contested:'explain', none:'tender' };

// in-page audit for the visual rules (design §0 and A11), scoped to one overlay
const PAGE_LIB = String.raw`
window.__C = (function(){
  const PAL = [[233,220,192],[28,28,26],[11,110,79],[179,38,30],[107,107,99],[168,159,138],[140,132,115],[220,205,171],[38,38,35],[52,52,47],[79,76,68]];
  const rgba = s => { const m = String(s).match(/rgba?\(([^)]+)\)/); if(!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(parseFloat); return { r:p[0], g:p[1], b:p[2], a:p.length > 3 ? p[3] : 1 }; };
  const inPal = c => !c || c.a === 0 || PAL.some(p => Math.abs(p[0]-c.r) < 1.5 && Math.abs(p[1]-c.g) < 1.5 && Math.abs(p[2]-c.b) < 1.5);
  const vis = el => {
    if(!el.isConnected) return false;
    const cs = getComputedStyle(el);
    if(cs.display === 'none' || cs.visibility === 'hidden') return false;
    const r = el.getBoundingClientRect(); if(r.width < 1 || r.height < 1) return false;
    for(let p = el; p && p !== document.documentElement; p = p.parentElement){ const c = getComputedStyle(p); if(c.display === 'none' || +c.opacity === 0) return false; }
    return true;
  };
  const desc = el => { const c = (el.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean).slice(0, 2).join('.'); const t = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 30);
    return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (c ? '.' + c : '') + (t ? ' "' + t + '"' : ''); };
  const blurOf = s => { if(!s || s === 'none') return 0; let m = 0; for(const p of s.split(/,(?![^(]*\))/)){ const n = p.replace(/rgba?\([^)]*\)/g, '').trim().split(/\s+/).filter(t => /^-?[\d.]+px$/.test(t)).map(parseFloat); if(n.length >= 3) m = Math.max(m, n[2]); } return m; };
  const els = sel => [...document.querySelectorAll(sel)].flatMap(r => [r, ...r.querySelectorAll('*')]).filter(el => !(el.closest('svg') && el.tagName.toLowerCase() !== 'svg'));
  function effects(sel){
    const bad = [];
    for(const el of els(sel)){ if(!vis(el)) continue;
      for(const ps of [null, '::before', '::after']){
        const cs = getComputedStyle(el, ps); if(ps && (cs.content === 'none' || cs.content === 'normal')) continue;
        const e = [];
        if(/gradient/.test(cs.backgroundImage)) e.push('gradient');
        if((cs.backdropFilter && cs.backdropFilter !== 'none') || (cs.webkitBackdropFilter && cs.webkitBackdropFilter !== 'none')) e.push('backdrop-filter');
        if(cs.boxShadow && cs.boxShadow !== 'none') e.push('box-shadow ' + cs.boxShadow);
        if(cs.textShadow && cs.textShadow !== 'none') e.push('text-shadow');
        if(cs.filter && cs.filter !== 'none') e.push('filter ' + cs.filter);
        if(e.length) bad.push(desc(el) + (ps || '') + ' -> ' + e.join(', '));
      } }
    return bad;
  }
  const GLYPH = /[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2300}-\u{23FF}\u{25A0}-\u{25FF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2700}-\u{27BF}\u{FE0F}]/u;
  function glyphs(sel){
    const out = [];
    for(const root of document.querySelectorAll(sel)){
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for(let n; (n = w.nextNode());){ const m = n.nodeValue.match(GLYPH); if(m && n.parentElement && vis(n.parentElement)) out.push(desc(n.parentElement) + ' has ' + JSON.stringify(m[0])); }
    }
    return out;
  }
  function targets(sel, min){
    return els(sel).filter(el => el.matches('button, a[href], [role=button], [data-ct], input, select') && vis(el))
      .map(el => [el, el.getBoundingClientRect()]).filter(([el, r]) => r.width < min - 0.5 || r.height < min - 0.5)
      .map(([el, r]) => desc(el) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
  }
  function palette(sel){
    const bad = [];
    for(const el of els(sel)){ if(!vis(el)) continue;
      const cs = getComputedStyle(el), chk = (k, v) => { const c = rgba(v); if(c && !inPal(c)) bad.push(desc(el) + ' ' + k + ' ' + v); };
      chk('color', cs.color); chk('background', cs.backgroundColor);
      if(parseFloat(cs.borderTopWidth) > 0) chk('border', cs.borderTopColor);
      if(parseFloat(cs.borderLeftWidth) > 0) chk('border-left', cs.borderLeftColor);
      if(cs.textDecorationLine && cs.textDecorationLine !== 'none') chk('underline', cs.textDecorationColor);
    }
    return bad;
  }
  const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const over = (top, under) => ({ r:top.r * top.a + under.r * (1 - top.a), g:top.g * top.a + under.g * (1 - top.a), b:top.b * top.a + under.b * (1 - top.a), a:1 });
  function bgOf(el){
    const stack = [];
    for(let p = el; p; p = p.parentElement){ const c = rgba(getComputedStyle(p).backgroundColor); if(c && c.a > 0){ stack.push(c); if(c.a >= 1) break; } }
    let base = { r:0, g:0, b:0, a:1 };
    for(let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base);
    return base;
  }
  function contrast(sel){
    const bad = [], seen = new Set();
    for(const root of document.querySelectorAll(sel)){
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for(let n; (n = w.nextNode());){
        const el = n.parentElement; if(!el || !n.nodeValue.trim() || seen.has(el) || !vis(el)) continue; seen.add(el);
        if(el.closest('button:disabled')) continue;                        // disabled controls are exempt (WCAG 1.4.3)
        const cs = getComputedStyle(el); let fg = rgba(cs.color); const bg = bgOf(el);
        let op = 1; for(let p = el; p; p = p.parentElement) op *= +getComputedStyle(p).opacity;
        fg = over({ ...fg, a:(fg.a == null ? 1 : fg.a) * op }, bg);
        const L1 = lum(fg), L2 = lum(bg), ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
        const px = parseFloat(cs.fontSize), bold = +cs.fontWeight >= 700, large = px >= 24 || (bold && px >= 18.66);
        if(ratio < (large ? 3 : 4.5) - 0.01) bad.push(desc(el) + ' ' + ratio.toFixed(2) + ':1 at ' + px + 'px');
      }
    }
    return bad;
  }
  function overflow(sel){
    const out = [];
    if(document.documentElement.scrollWidth > innerWidth + 1) out.push('page scrollWidth ' + document.documentElement.scrollWidth);
    for(const el of els(sel)){ if(!vis(el)) continue; const r = el.getBoundingClientRect();
      if(r.right > innerWidth + 0.5 || r.left < -0.5) out.push(desc(el) + ' x ' + Math.round(r.left) + '..' + Math.round(r.right));
      const cs = getComputedStyle(el); if(/auto|scroll/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 1) out.push(desc(el) + ' scrolls sideways ' + el.scrollWidth + '>' + el.clientWidth); }
    return out;
  }
  function gutters(sel){
    const doc = document.querySelector(sel); if(!doc) return null; const r = doc.getBoundingClientRect();
    return { left:Math.round(r.left), right:Math.round(innerWidth - r.right) };
  }
  const fonts = (sel) => { const el = document.querySelector(sel); return el ? getComputedStyle(el).fontFamily : null; };
  return { effects, glyphs, targets, palette, contrast, overflow, gutters, fonts, vis, desc };
})();`;

const lib = h => {
  const C = {};
  C.PRE_M8 = PRE_M8; C.BEST = BEST;
  C.finishDialogue = async (max = 150) => {
    for(let i = 0; i < max; i++){
      const open = await h.ev(() => {
        const d = document.querySelector('#screen-dialogue.show');
        if(!d || !DLG.script) return false;
        const line = DLG.script[DLG.idx];
        if(line && line.choices && line.choices.length){ let b = document.querySelector('#dlg-choices button'); if(!b && typeof skipTypewriter === 'function'){ skipTypewriter(); b = document.querySelector('#dlg-choices button'); } if(b) b.click(); return true; }
        advanceDialogue(); return true;
      });
      if(!open) return;
      await h.step(25);
    }
  };
  /* a save that has reached M8, with the case set up as o says:
     o = { moral, flags, sealed, ev:[ids], inv:[ids], cert:[ids]|'all', theories:[ids], recruit,
           lagos:{suspect,method,money,warrant:'signed'|'exigent'|'pending'}, route:{…}, voice:{suspect,method,money,picks},
           warrants:{ w_cdr:'signed'|'none'|'pending', w_eko:'signed'|'exigent'|'pending', w_eko_route }, verdicts:{ st_musa:{ u2:'contradicted' } }, leads:{} } */
  C.setup = async (o = {}) => {
    await h.start('m8', { completed:PRE_M8, state:S => { S.game.intel = { briefed:{ m3:1, m4:1, m5:1, m6:1, m7:1 }, items:{} }; } });
    return h.ev(([o, NAMES]) => {
      S.game.difficulty = o.recruit ? 'recruit' : 'senior';
      if(typeof syncDifficultyClass === 'function') syncDifficultyClass();
      S.game.moralChoices = Object.assign(S.game.moralChoices || {}, o.moral || {});
      S.game.flags = Object.assign(S.game.flags || {}, o.flags || {});
      if(o.hostageLost != null) S.game._asabaHostageLost = !!o.hostageLost;
      if(o.sealed) S.game.sealed = o.sealed;
      (o.theories || []).forEach(t => { V12.ops().theories[t] = true; });
      (o.ev || []).forEach(id => { if(!V12.hasEv(id)) collectEvidence({ id, name:NAMES[id] || id, xp:0 }); });
      (o.inv || []).forEach(id => { if(typeof addInvEvidence === 'function') addInvEvidence(id); });
      const d = I();
      Object.assign(d.leads, o.leads || {});
      // filed charge sheets (lagos / route settle as their aftermaths would)
      for(const c of ['lagos', 'route']){
        const p = o[c]; if(!p) continue;
        const ex = p.warrant === 'exigent';
        CW.file(c, { suspect:p.suspect, method:p.method, money:p.money }, { warrant:ex ? 'pending' : (p.warrant || 'signed') });
        if(ex) CW.goExigent(c);
        CW.settle(c);
      }
      // the v13 orders (w_cdr at h6, w_eko at h7)
      const W = o.warrants || {};
      for(const id of ['w_cdr', 'w_eko']){
        if(!W[id] || W[id] === 'pending'){ delete d.warrants[id]; continue; }
        const rec = { status:W[id], route:id === 'w_eko' && W[id] === 'signed' ? (W.w_eko_route || 'zonal') : undefined, at:id === 'w_cdr' ? 'h6' : 'h7' };
        d.warrants[id] = rec;           // the record V12.warrantState reads (A5); written directly so it lands whatever the old-save rules say
      }
      // statement verdicts on file
      for(const st in (o.verdicts || {})) for(const cid in o.verdicts[st]){
        if(typeof intelVerdict === 'function') intelVerdict(st, cid, o.verdicts[st][cid]);
        else { d.st[st] = d.st[st] || {}; d.st[st][cid] = o.verdicts[st][cid]; }
      }
      // the finale charge sheet
      if(o.voice){
        S.game.accusations.voice = null; delete S.game._acc;
        const r = CW.file('voice', { suspect:o.voice.suspect, method:o.voice.method, money:o.voice.money }, { picks:(o.voice.picks || []).slice() });
        if(r && r.ok && !r.ok.suspect && !r.paid){ r.paid = true; applyEffect(CW.CASES.voice.wrongEff); }
      }
      const certs = o.cert === 'all' ? Object.keys(d.items) : (o.cert || []);
      certs.forEach(id => { const it = d.items[id]; if(it && INTEL_ITEMS[id] && INTEL_ITEMS[id].e && !it.cert){ it.cert = true; d.certUsed[it.m] = (d.certUsed[it.m] || 0) + 1; } });
      return { items:Object.keys(d.items), acc:S.game.accusations };
    }, [o, NAMES]);
  };
  // the finale resolves on the filed sheet (the reveal itself is covered by casework_finale), then the aftermath
  C.resolve = async () => {
    await h.ev(() => { showOverlay(null); finaleResolve(); });
    await h.step(150);
    await C.finishDialogue();
    await h.step(250);
    return h.ev(() => ({ outcome:S.game.moralChoices.finale, aftermath:!!document.querySelector('#screen-aftermath.show'), next:(document.querySelector('#aftermath-grid .cw-next') || {}).textContent || '' }));
  };
  // certify the m8 bodycam once the aftermath has created its record
  C.certify = ids => h.ev(ids => { const d = I(); ids.forEach(id => { const it = d.items[id]; if(it && !it.cert){ it.cert = true; d.certUsed[it.m] = (d.certUsed[it.m] || 0) + 1; } }); }, ids);
  C.toCourt = async () => { await h.ev(() => document.getElementById('btn-aftermath-continue').click()); await h.step(250); return h.ev(() => !!document.querySelector('#screen-court.show')); };
  C.court = () => h.ev(() => ({ shown:!!document.querySelector('#screen-court.show'), phase:COURT.phase, i:COURT.i, patience:COURT.patience,
    ex:COURT.ex.map(x => ({ id:x.id, k:x.k, cap:x.cap, why:x.why || null, raid:x.raid || null, lied:!!x.lied, q:x.q })),
    text:(document.querySelector('#screen-court .ct-doc') || {}).innerText || '', head:(document.getElementById('court-head') || {}).innerText || '' }));
  // one step: answer with the policy ('best' | 'withdraw' | 'first' | {k:choice}) and return what was on screen
  C.step = async (policy = 'best', cred = 'admit') => {
    const st = await h.ev(([policy, BEST, cred]) => {
      if(!document.querySelector('#screen-court.show')) return null;
      const ph = COURT.phase, body = document.getElementById('court-body'), out = { ph, i:COURT.i, text:body.innerText, opts:[...body.querySelectorAll('[data-ct="resp"]')].map(b => ({ v:b.dataset.v, dis:b.disabled, t:b.textContent })) };
      const click = sel => { const b = document.querySelector('#screen-court ' + sel); if(!b) throw new Error('no ' + sel + ' in phase ' + ph); b.click(); };
      if(ph === 'pre') click('[data-ct="begin"]');
      else if(ph === 'cred') click(`[data-ct="cred"][data-v="${cred}"]`);
      else if(ph === 'ex'){
        const x = COURT.ex[COURT.i];
        let v = typeof policy === 'object' ? (policy[x.id] || policy[x.k] || BEST[x.k]) : policy === 'withdraw' ? (x.k === 'none' ? 'tender' : 'withdraw') : policy === 'first' ? null : BEST[x.k];
        let b = v ? document.querySelector(`#screen-court [data-ct="resp"][data-v="${v}"]:not([disabled])`) : document.querySelector('#screen-court [data-ct="resp"]:not([disabled])');
        if(!b) b = document.querySelector('#screen-court [data-ct="resp"][data-v="withdraw"]') || document.querySelector('#screen-court [data-ct="resp"]:not([disabled])');
        out.chose = b.dataset.v; b.click();
        out.ruling = (document.querySelector('#screen-court .ct-ruling') || {}).innerText || '';
      }
      else if(ph === 'ruling') click('[data-ct="next"]');
      else if(ph === 'judgment') click('[data-ct="end"]');
      return out;
    }, [policy, BEST, cred]);
    await h.step(40);
    return st;
  };
  C.runTrial = async (policy = 'best', cred = 'admit', onPhase) => {
    const steps = [];
    for(let n = 0; n < 120; n++){
      if(onPhase){ const ph = await h.ev(() => document.querySelector('#screen-court.show') ? COURT.phase : null); if(ph) await onPhase(ph, n); }
      const s = await C.step(policy, cred); if(!s) break; steps.push(s);
    }
    return steps;
  };
  C.install = () => h.page.addScriptTag({ content:PAGE_LIB });
  // the visual rules on one overlay; returns the problems found (asserts are left to the scenario)
  C.rules = async (sel, touch) => {
    await h.ev(() => { if(!window.__C) throw new Error('call C.install() first'); });
    return h.ev(([sel, touch]) => ({
      effects:__C.effects(sel), glyphs:__C.glyphs(sel), palette:__C.palette(sel), contrast:__C.contrast(sel), overflow:__C.overflow(sel),
      targets:touch ? __C.targets(sel, 44) : [], aks:/\bAKS\b/.test((document.querySelector(sel) || {}).innerText || ''),
      emptyIcons:[...document.querySelectorAll(sel + ' .rv-m.v13-mark-ok, ' + sel + ' .v13-mark-ok, ' + sel + ' .v13-mark-bad, ' + sel + ' .ct-crest, ' + sel + ' .ct-go')].filter(e => __C.vis(e) && !e.querySelector('svg')).map(__C.desc),
    }), [sel, touch]);
  };
  C.assertRules = async (name, sel, touch) => {
    const r = await C.rules(sel, touch);
    const bad = Object.entries(r).filter(([k, v]) => Array.isArray(v) ? v.length : v);
    if(bad.length) h.log('RULES ' + name, JSON.stringify(r, null, 1));
    h.assert(!r.effects.length, `${name}: no gradients, shadows, blur or filters`);
    h.assert(!r.glyphs.length, `${name}: no emoji or glyph icons in rendered text`);
    h.assert(!r.palette.length, `${name}: palette colours only`);
    h.assert(!r.contrast.length, `${name}: text contrast at least 4.5:1`);
    h.assert(!r.overflow.length, `${name}: nothing sticks out sideways`);
    h.assert(!r.targets.length, `${name}: every tappable thing is at least 44x44 on touch`);
    h.assert(!r.aks, `${name}: "Anti-Kidnapping Squad", never AKS`);
    h.assert(!r.emptyIcons.length, `${name}: every intended icon rendered`);
    return r;
  };
  return C;
};
module.exports = async () => {};
module.exports.lib = lib;
