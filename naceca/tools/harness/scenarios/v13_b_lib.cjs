// Shared helpers for team B's v13 scenarios (briefings & sequencing). Running this file on its own
// is a no-op scenario.   const B = require('./v13_b_lib.cjs').lib(h);
//
// A note on state hooks: h.start(..., { briefings:true }) leaves S.game.intel alone, so every hook
// here creates S.game.intel WITH an `items` object — otherwise the model's old-save migration
// (design A1) would mark finished briefings 'missed'.
const fs = require('fs'), path = require('path');
const CW_LIB = require('./casework_lib.cjs');

// ---- page-side audit helpers (installed with B.audit()) ----
const PAGE = String.raw`
window.__B = (function(){
  const vis = el => {
    if(!el || !el.isConnected) return false;
    const cs = getComputedStyle(el);
    if(cs.display === 'none' || cs.visibility === 'hidden') return false;
    const r = el.getBoundingClientRect();
    if(r.width < 1 || r.height < 1) return false;
    for(let p = el; p && p !== document.documentElement; p = p.parentElement){ const c = getComputedStyle(p); if(c.display === 'none' || +c.opacity === 0) return false; }
    return r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth;
  };
  const desc = el => {
    const c = (el.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean).slice(0, 3).join('.');
    const t = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 30);
    return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (c ? '.' + c : '') + (t ? ' "' + t + '"' : '');
  };
  const blurOf = s => { if(!s || s === 'none') return 0; let m = 0; for(const p of s.split(/,(?![^(]*\))/)){ const n = p.replace(/rgba?\([^)]*\)/g, '').trim().split(/\s+/).filter(t => /^-?[\d.]+px$/.test(t)).map(parseFloat); if(n.length >= 3) m = Math.max(m, n[2]); } return m; };
  function effects(el, ps){
    const cs = getComputedStyle(el, ps), out = [];
    if(ps && (cs.content === 'none' || cs.content === 'normal')) return out;
    if(/gradient/.test(cs.backgroundImage)) out.push('gradient');
    if((cs.backdropFilter && cs.backdropFilter !== 'none') || (cs.webkitBackdropFilter && cs.webkitBackdropFilter !== 'none')) out.push('backdrop-filter');
    if(cs.boxShadow && cs.boxShadow !== 'none') out.push('box-shadow ' + cs.boxShadow);
    if(cs.textShadow && cs.textShadow !== 'none') out.push('text-shadow');
    if(cs.filter && cs.filter !== 'none') out.push('filter ' + cs.filter);
    return out;
  }
  // palette (styles.css :root), with any alpha
  const PAL = ['233,220,192','28,28,26','11,110,79','179,38,30','107,107,99','168,159,138','140,132,115','220,205,171','38,38,35','52,52,47','79,76,68'];
  const rgb = s => { const m = String(s).match(/rgba?\(([^)]+)\)/); if(!m) return null; const p = m[1].split(',').map(x => parseFloat(x)); return { r:p[0], g:p[1], b:p[2], a:p.length > 3 ? p[3] : 1 }; };
  const palOk = s => { if(!s || s === 'transparent' || s === 'currentcolor') return true; const c = rgb(s); if(!c) return true; if(c.a === 0) return true; return PAL.includes([c.r, c.g, c.b].join(',')); };
  const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const blend = (fg, bg) => ({ r:fg.r * fg.a + bg.r * (1 - fg.a), g:fg.g * fg.a + bg.g * (1 - fg.a), b:fg.b * fg.a + bg.b * (1 - fg.a), a:1 });
  function bgOf(el){
    const stack = [];
    for(let p = el; p; p = p.parentElement){ const c = rgb(getComputedStyle(p).backgroundColor); if(c && c.a > 0){ stack.push(c); if(c.a >= 1) break; } }
    let b = { r:20, g:20, b:18, a:1 };
    for(let i = stack.length - 1; i >= 0; i--) b = blend(stack[i], b);
    return b;
  }
  const GLYPH = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{25A0}-\u{25FF}\u{2190}-\u{21FF}\u{2300}-\u{23FF}\u{2700}-\u{27BF}]/u;
  const TAP = 'button, a[href], input, select, textarea, [role=button], .dialogue-choice';
  function check(sel, opt){
    opt = opt || {};
    const roots = [...document.querySelectorAll(sel)].filter(vis);
    const out = { roots:roots.length, effects:[], palette:[], glyphs:[], targets:[], contrast:[], overflow:[], aks:[], text:'' };
    for(const root of roots){
      out.text += ' ' + root.textContent;
      if(/\bAKS\b/.test(root.textContent)) out.aks.push(desc(root));
      if(root.scrollWidth > root.clientWidth + 1) out.overflow.push(desc(root) + ' ' + root.scrollWidth + '>' + root.clientWidth);
      for(const el of [root, ...root.querySelectorAll('*')]){
        if(el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue;
        if(!vis(el)) continue;
        for(const ps of [null, '::before', '::after']){ const e = effects(el, ps); if(e.length) out.effects.push(desc(el) + (ps || '') + ' → ' + e.join(', ')); }
        const cs = getComputedStyle(el);
        for(const k of ['color', 'backgroundColor', 'borderTopColor', 'borderBottomColor', 'borderLeftColor', 'borderRightColor', 'textDecorationColor', 'outlineColor']){
          if(k.startsWith('border') && parseFloat(cs[k.replace('Color', 'Width')]) === 0) continue;
          if(k === 'outlineColor' && cs.outlineStyle === 'none') continue;
          if(k === 'textDecorationColor' && !/underline|line-through/.test(cs.textDecorationLine)) continue;
          if(!palOk(cs[k])) out.palette.push(desc(el) + ' ' + k + ' ' + cs[k]);
        }
        if(el.matches(TAP)){
          const r = el.getBoundingClientRect();
          if(opt.touch && (r.width < 43.5 || r.height < 43.5)) out.targets.push(desc(el) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
        }
        // text: glyphs and contrast on the element's own text nodes
        const own = [...el.childNodes].filter(n => n.nodeType === 3 && n.nodeValue.trim()).map(n => n.nodeValue).join(' ');
        // nothing pokes out of the viewport sideways (clipped or not)
        { const r = el.getBoundingClientRect(); if(r.right > innerWidth + 1 || r.left < -1) out.overflow.push(desc(el) + ' spans ' + Math.round(r.left) + '..' + Math.round(r.right)); }
        if(own){
          if(/\bAKS\b/.test(own)) out.aks.push(desc(el));
          const m = own.match(GLYPH); if(m) out.glyphs.push(desc(el) + ' has ' + JSON.stringify(m[0]));
          const disabled = !!el.closest('button:disabled, [aria-disabled=true]');
          const fs = parseFloat(cs.fontSize), bold = +cs.fontWeight >= 700;
          const large = fs >= 24 || (bold && fs >= 18.66);
          if(!disabled){
            const fg = rgb(cs.color), bg = bgOf(el);
            if(fg){ const f = blend(fg, bg); const L1 = lum(f), L2 = lum(bg); const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
              if(ratio < (large ? 3 : 4.5)) out.contrast.push(desc(el) + ' ' + ratio.toFixed(2) + ':1 (' + fs + 'px)'); }
          }
        }
      }
    }
    if(document.documentElement.scrollWidth > innerWidth + 1) out.overflow.push('page ' + document.documentElement.scrollWidth + '>' + innerWidth);
    return out;
  }
  return { check, vis, desc };
})();`;

const lib = h => {
  const L = CW_LIB.lib(h);
  const B = Object.assign({}, L);

  B.audit = async () => { if(!(await h.ev(() => !!window.__B))) await h.page.addScriptTag({ content: PAGE }); };
  // run the visual rules on the given overlay selector; returns the report and asserts
  B.visual = async (name, sel, o = {}) => {
    await B.audit();
    await h.step(o.wait == null ? 250 : o.wait);
    await h.shot(name);
    const touch = await h.ev(() => document.body.classList.contains('touch-active'));
    const r = await h.ev(([sel, touch]) => __B.check(sel, { touch }), [sel, touch]);
    const bad = ['effects', 'palette', 'glyphs', 'targets', 'contrast', 'overflow', 'aks'].filter(k => r[k].length);
    h.log(`[${name}] roots:${r.roots} ` + ['effects', 'palette', 'glyphs', 'targets', 'contrast', 'overflow', 'aks'].map(k => k + ':' + r[k].length).join(' '));
    for(const k of bad) [...new Set(r[k])].slice(0, 12).forEach(x => h.log('   ' + k + ': ' + x));
    h.assert(r.roots > 0, name + ': ' + sel + ' is on screen');
    if(!o.soft){ for(const k of bad) h.assert(false, `${name}: visual rule "${k}" broken (${r[k].length})`); }
    return r;
  };
  // every icon name this file asks for exists in icons.js
  B.iconNames = () => {
    const src = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'src', 'v13', 'v13_briefing.js'), 'utf8');
    const names = new Set();
    for(const m of src.matchAll(/ico\('([a-z_]+)'/g)) names.add(m[1]);
    for(const m of src.matchAll(/\[\s*'([a-z_]+)'\s*,\s*'[A-Z ]+'\s*\]/g)) names.add(m[1]);      // SO_LABEL
    for(const m of src.matchAll(/\{\s*photo:'([a-z_]+)', plate:'([a-z_]+)', match:'([a-z_]+)'/g)) [1, 2, 3].forEach(i => names.add(m[i]));
    names.add('lock'); names.add('dot');
    return [...names];
  };

  // ---- reading the game ----
  B.shown = id => h.ev(id => !!document.querySelector('#' + id + '.show'), id);
  B.overlays = () => h.ev(() => [...document.querySelectorAll('.overlay.show')].map(o => o.id));
  B.badge = () => h.ev(() => !!document.querySelector('#v12-call.show'));
  B.brf = () => h.ev(() => ({ k:BRF.k, phase:BRF.phase, rec:S.game.intel && S.game.intel.brf ? JSON.parse(JSON.stringify(S.game.intel.brf)) : null,
    briefed:Object.assign({}, (S.game.intel || {}).briefed), shown:!!document.querySelector('#screen-briefing.show') }));
  B.text = sel => h.ev(sel => { const e = document.querySelector(sel); return e ? e.textContent.replace(/\s+/g, ' ').trim() : ''; }, sel);
  B.snap = () => h.ev(() => ({ intel:S.game.intelScore || 0, rep:Object.assign({}, S.player.reputation), alert:(S.game.intel || {}).alert || 0,
    drop:((S.game.intel || {}).dropLog || []).length, ev:(S.game.evidence || []).length, req:((S.game.intel || {}).money || {}).req || 0 }));

  // ---- the event trail: dialogues, title cards, overlays, mission loads ----
  B.trace = () => h.ev(() => {
    window.__tr = [];
    const push = x => { window.__tr.push(x); };
    if(!window.__trWrapped){
      window.__trWrapped = true;
      const sd = window.startDialogue; window.startDialogue = function(k){ push('dlg:' + k); return sd.apply(this, arguments); };
      const tc = window.titleCard; window.titleCard = function(lines){ push('card:' + (lines && lines[0])); return tc.apply(this, arguments); };
      const so = window.showOverlay; window.showOverlay = function(id){ if(id && window.__tr[window.__tr.length - 1] !== 'ov:' + id) push('ov:' + id); return so.apply(this, arguments); };
      const lm = window.loadMission; window.loadMission = function(id){ push('load:' + id); if(id === 't7' && window.__stopT7){ window.__t7 = true; return; } return lm.apply(this, arguments); };
      const bm = window.beginMission; window.beginMission = function(id){ push('begin:' + id); return bm.apply(this, arguments); };
      const fw = window.V12 && V12.fileV13Warrant; if(typeof fw === 'function'){ V12.fileV13Warrant = function(){ push('file:' + arguments[0]); return fw.apply(this, arguments); }; }
    }
  });
  B.trail = () => h.ev(() => (window.__tr || []).slice());

  // ---- driving the hub ----
  // a fresh state at the hub before `mission` (the hub redirect does the rest)
  B.toHub = async (mission, completed, state, o = {}) => {
    if(await h.ev(() => !!document.querySelector('#title-card.show'))) await h.step(3200);
    await h.start(mission, { completed, state, briefings:true, wait:o.wait || 3600 });
    await h.ev(() => { if(typeof SIDE !== 'undefined') SIDE.mid = null; });
  };
  // Uche, the phone, then the Commander's call through to the briefing
  B.callCommander = async () => { await L.hubPrep(); await L.commander(); await B.dialogues(); };
  // run plain dialogues (no choices) to the end
  B.dialogues = async (max = 80) => {
    for(let i = 0; i < max; i++){
      const st = await h.ev(() => {
        const d = document.querySelector('#screen-dialogue.show'); if(!d || !DLG.script) return 'none';
        const line = DLG.script[DLG.idx];
        if(line && line.choices && line.choices.length) return 'choice';
        advanceDialogue(); return 'adv';
      });
      if(st !== 'adv') return st;
      await h.step(30);
    }
    return 'max';
  };
  // in a dialogue with choices, pick the one whose effect.flag value is v (or index)
  B.choose = async (pick) => {
    await h.ev(() => { if(typeof skipTypewriter === 'function') skipTypewriter(); });
    await h.step(40);
    const ok = await h.ev(pick => {
      const line = DLG.script[DLG.idx]; if(!line || !line.choices) return false;
      let i = typeof pick === 'number' ? pick : line.choices.findIndex(c => c.effect && c.effect.flag && Object.values(c.effect.flag).includes(pick));
      const btns = [...document.querySelectorAll('#dlg-choices .dialogue-choice')];
      if(i < 0 || !btns[i]) return false;
      btns[i].click(); return true;
    }, pick);
    h.assert(ok, 'dialogue choice ' + pick);
    await h.step(60);
  };
  B.click = async (sel, n = 1) => { for(let i = 0; i < n; i++){ const ok = await h.ev(sel => { const b = document.querySelector(sel); if(!b || b.disabled) return false; b.click(); return true; }, sel); h.assert(ok, 'click ' + sel); await h.step(80); } };
  B.has = sel => h.ev(sel => { const b = document.querySelector(sel); return !!b && !b.disabled; }, sel);
  // the plan: decisions {k:v}, leads [ids], then COMMIT (two taps)
  B.plan = async (leads, dec = {}) => {
    for(const k of Object.keys(dec)) await B.click(`#screen-briefing [data-b="dec"][data-k="${k}"][data-v="${dec[k]}"]`);
    for(const id of leads) await B.click(`#screen-briefing [data-b="lead"][data-id="${id}"]`);
    const first = await B.text('#screen-briefing [data-b="commit"]');
    await B.click('#screen-briefing [data-b="commit"]');
    const armed = await B.text('#screen-briefing [data-b="commit"]');
    await B.click('#screen-briefing [data-b="commit"]');
    await h.step(150);
    return { first, armed };
  };
  // drive whatever the briefing shows until it reaches the final page (or `until` says stop)
  // o.gk: {gk_pos:'custom', ...}; o.so: list of van actions; o.uc: list of [kind, k] or 'blow'; o.warrant: fn
  B.runToEnd = async (o = {}) => {
    for(let i = 0; i < 400; i++){
      const st = await h.ev(() => ({ ov:[...document.querySelectorAll('.overlay.show')].map(x => x.id), phase:window.BRF && BRF.phase, k:window.BRF && BRF.k,
        dlg:!!document.querySelector('#screen-dialogue.show'), key:typeof DLG !== 'undefined' ? DLG.scriptKey : null,
        next:!!document.querySelector('#screen-briefing.show [data-b="next"]'), fin:!!document.querySelector('#screen-briefing.show [data-b="done"]') }));
      if(o.until && await o.until(st)) return st;
      if(st.dlg){
        const r = await B.dialogues();
        if(r === 'choice'){ const want = (o.gk || {})[st.key]; await B.choose(want == null ? 0 : want); }
        continue;
      }
      if(st.ov.includes('screen-so')){ await B.vanDrive(o.so); continue; }
      if(st.ov.includes('screen-uc')){ await B.ucDrive(o.uc); continue; }
      if(st.ov.includes('screen-briefing')){
        if(st.phase === 'warrant'){ if(o.warrant) await o.warrant(); else await B.click('#screen-briefing [data-b="w-sign"], #screen-briefing [data-b="w-route"][data-v="commander"], #screen-briefing [data-b="w-none"]'); continue; }
        if(st.next){ await B.click('#screen-briefing [data-b="next"]'); continue; }
        if(st.fin) return st;
      }
      await h.step(120);
    }
    throw new Error('runToEnd: no progress');
  };
  B.vanDrive = async (acts) => {
    const list = acts || ['photo', 'next', 'next', 'photo', 'next', 'next', 'plate', 'next', 'photo', 'plate', 'next', 'follow', 'finish'];
    for(const a of list){
      if(!(await B.shown('screen-so'))) return;
      const ok = await B.has(`#screen-so [data-so="${a}"]`);
      if(ok) await B.click(`#screen-so [data-so="${a}"]`);
      else if(await B.has('#screen-so [data-so="finish"]')) await B.click('#screen-so [data-so="finish"]');
      else if(await B.has('#screen-so [data-so="next"]')) await B.click('#screen-so [data-so="next"]');
    }
    for(let i = 0; i < 20 && await B.shown('screen-so'); i++){
      if(await B.has('#screen-so [data-so="finish"]')) await B.click('#screen-so [data-so="finish"]');
      else if(await B.has('#screen-so [data-so="next"]')) await B.click('#screen-so [data-so="next"]');
      else if(await B.has('#screen-so [data-so="wait"]')) await B.click('#screen-so [data-so="wait"]');
    }
  };
  // o.stay: leave the wire on its last screen (no automatic LEAVE)
  B.ucDrive = async (plan, o = {}) => {
    const list = plan || ['go', ['ans', 0], ['ans', 0], 'probe', ['ans', 0], ['ans', 0], 'skip', ['ans', 0], 'probe', 'end'];
    for(const p of list){
      if(!(await B.shown('screen-uc'))) return;
      const [a, k] = Array.isArray(p) ? p : [p];
      const sel = k == null ? `#screen-uc [data-uc="${a}"]` : `#screen-uc [data-uc="${a}"][data-k="${k}"]`;
      if(await B.has(sel)) await B.click(sel);
      else if(await B.has('#screen-uc [data-uc="end"]')) await B.click('#screen-uc [data-uc="end"]');
    }
    if(o.stay) return;
    for(let i = 0; i < 20 && await B.shown('screen-uc'); i++){
      if(await B.has('#screen-uc [data-uc="end"]')) await B.click('#screen-uc [data-uc="end"]');
      else if(await B.has('#screen-uc [data-uc="go"]')) await B.click('#screen-uc [data-uc="go"]');
      else if(await B.has('#screen-uc [data-uc="ans"]')) await B.click('#screen-uc [data-uc="ans"]');
      else if(await B.has('#screen-uc [data-uc="skip"]')) await B.click('#screen-uc [data-uc="skip"]');
    }
  };
  // quit and reload the page from the save, then Continue (resumeCampaign)
  B.reload = async () => {
    await h.ev(() => { if(typeof saveGame === 'function') saveGame(true); });
    await h.page.reload({ waitUntil:'load', timeout:90000 });
    await h.step(1500);
    await h.ev(() => { ART.failed = true; ART.promise = null; window.__trWrapped = false; });
  };
  B.continueGame = async (wait = 3600) => {
    await h.ev(() => { loadGame(); if(typeof syncDifficultyClass === 'function') syncDifficultyClass(); showOverlay(null); resumeCampaign(); });
    await h.step(wait);
  };
  return B;
};
module.exports = async () => {};
module.exports.lib = lib;
