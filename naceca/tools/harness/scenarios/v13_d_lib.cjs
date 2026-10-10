// Team D (Case Desk) helpers for the v13_d_* scenarios. Running this file on its own is a no-op scenario.
//   const D = require('./v13_d_lib.cjs').lib(h);
//   await D.inject();            // page-side audit helpers (window.__VD)
//   await D.seed({...});         // a worked investigation in S.game (after h.start)
//   const r = await D.audit('#screen-desk', { touch:true, narrow:true });   // visual rules, see below
//   D.rules(r, 'locker')         // assert them
// Visual rules (design §0, A11): no gradient / backdrop-filter / blurred box-shadow / text-shadow / blur or
// drop-shadow filter; no emoji or unicode-glyph icons in text; only palette colours; every visible tappable
// thing >= 44x44 on touch; no horizontal overflow; small text contrast >= 4.5:1 and no red/green text on
// ink; no "AKS"; no line icon that rendered empty.
const fs = require('fs'), path = require('path');

const PAGE = String.raw`
window.__VD = (function(){
  const PAL = [[233,220,192],[28,28,26],[11,110,79],[179,38,30],[107,107,99],[168,159,138],[140,132,115],[220,205,171],[38,38,35],[52,52,47],[79,76,68]];
  const parse = c => { const m = String(c || '').match(/rgba?\(([^)]+)\)/); if(!m) return null; const p = m[1].split(/[\s,\/]+/).filter(Boolean).map(Number); return { r:p[0], g:p[1], b:p[2], a:p.length > 3 ? p[3] : 1 }; };
  const inPal = c => { const p = parse(c); if(!p || p.a === 0) return true; return PAL.some(q => Math.abs(q[0]-p.r) <= 1 && Math.abs(q[1]-p.g) <= 1 && Math.abs(q[2]-p.b) <= 1); };
  const rendered = el => {
    if(!el.isConnected) return false;
    const cs = getComputedStyle(el);
    if(cs.display === 'none' || cs.visibility === 'hidden') return false;
    const r = el.getBoundingClientRect(); if(r.width < 1 || r.height < 1) return false;
    for(let p = el; p && p !== document.documentElement; p = p.parentElement){ const c = getComputedStyle(p); if(c.display === 'none' || +c.opacity === 0) return false; }
    return true;
  };
  const desc = el => {
    const c = (el.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean).slice(0, 3).join('.');
    const t = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 28);
    return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (c ? '.' + c : '') + (t ? ' "' + t + '"' : '');
  };
  const blurOf = s => { if(!s || s === 'none') return 0; let m = 0; for(const p of s.split(/,(?![^(]*\))/)){ const n = p.replace(/rgba?\([^)]*\)/g, '').trim().split(/\s+/).filter(t => /^-?[\d.]+px$/.test(t)).map(parseFloat); if(n.length >= 3) m = Math.max(m, n[2]); } return m; };
  const lum = ({ r, g, b }) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const mix = (f, b, a) => ({ r:f.r * a + b.r * (1 - a), g:f.g * a + b.g * (1 - a), b:f.b * a + b.b * (1 - a) });
  // the colour behind an element: first ancestor with a mostly opaque background (the desk sits on ink)
  const bgOf = el => { for(let p = el; p && p !== document.documentElement; p = p.parentElement){ const c = parse(getComputedStyle(p).backgroundColor); if(c && c.a >= 0.5) return c; } return { r:28, g:28, b:26, a:1 }; };
  const opacityOf = el => { let o = 1; for(let p = el; p && p !== document.documentElement; p = p.parentElement) o *= +getComputedStyle(p).opacity; return o; };
  const GLYPH = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{25A0}-\u{25FF}\u{2190}-\u{21FF}\u{2300}-\u{23FF}]/u;
  const TAP = 'button, a[href], input, select, textarea, summary, [role=button], [role=tab], .seg button, .v13-chip, .chip';
  function audit(sel, o){
    o = o || {};
    const root = document.querySelector(sel); if(!root) return { missing:true };
    const out = { effects:[], glyphs:[], palette:[], targets:[], overflow:[], contrast:[], redgreen:[], aks:[], emptyIcons:[], counts:{} };
    const els = [root, ...root.querySelectorAll('*')].filter(el => !(el.closest('svg') && el.tagName.toLowerCase() !== 'svg') && rendered(el));
    out.counts.elements = els.length;
    for(const el of els){
      for(const ps of [null, '::before', '::after']){
        const cs = getComputedStyle(el, ps);
        if(ps && (cs.content === 'none' || cs.content === 'normal')) continue;
        const e = [];
        if(/gradient/.test(cs.backgroundImage)) e.push('gradient');
        if((cs.backdropFilter && cs.backdropFilter !== 'none') || (cs.webkitBackdropFilter && cs.webkitBackdropFilter !== 'none')) e.push('backdrop-filter');
        if(blurOf(cs.boxShadow) > 0) e.push('box-shadow');
        if(cs.textShadow && cs.textShadow !== 'none') e.push('text-shadow');
        if(/drop-shadow|blur\(/.test(cs.filter)) e.push('filter');
        if(e.length) out.effects.push(desc(el) + (ps || '') + ' -> ' + e.join(','));
        // palette: text, fill, borders that are drawn, outlines, decorations
        const cols = [['color', cs.color], ['background', cs.backgroundColor]];
        for(const s of ['Top', 'Right', 'Bottom', 'Left']) if(parseFloat(cs['border' + s + 'Width']) > 0 && cs['border' + s + 'Style'] !== 'none') cols.push(['border' + s, cs['border' + s + 'Color']]);
        if(cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) cols.push(['outline', cs.outlineColor]);
        if(cs.textDecorationLine && cs.textDecorationLine !== 'none') cols.push(['decoration', cs.textDecorationColor]);
        if(el.tagName.toLowerCase() === 'svg'){ cols.push(['stroke', cs.stroke]); if(cs.fill && cs.fill !== 'none') cols.push(['fill', cs.fill]); }
        for(const [k, c] of cols) if(!inPal(c)) out.palette.push(desc(el) + (ps || '') + ' ' + k + ' ' + c);
      }
      if(el.tagName.toLowerCase() === 'svg' && el.classList.contains('ico') && !el.querySelector('path, circle, rect, ellipse, line, polyline, polygon')) out.emptyIcons.push(desc(el.parentElement || el));
    }
    // text: glyph icons, AKS, contrast, red/green on ink
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const seen = new Set();
    for(let n; (n = w.nextNode());){
      const txt = n.nodeValue; if(!txt || !txt.trim()) continue;
      const el = n.parentElement; if(!el || !rendered(el) || el.closest('svg')) continue;
      const m = txt.match(GLYPH); if(m) out.glyphs.push(desc(el) + ' has ' + JSON.stringify(m[0]));
      if(/\bAKS\b/.test(txt)) out.aks.push(desc(el));
      if(seen.has(el)) continue; seen.add(el);
      if(el.closest('button:disabled')) continue;
      const cs = getComputedStyle(el), px = parseFloat(cs.fontSize), bold = (+cs.fontWeight || 400) >= 700;
      const large = px >= 24 || (bold && px >= 18.66);
      const fg0 = parse(cs.color), bg = bgOf(el); if(!fg0) continue;
      const fg = mix(fg0, bg, (fg0.a == null ? 1 : fg0.a) * opacityOf(el));
      const r = ratio(fg, bg);
      if(!large && r < 4.5) out.contrast.push(desc(el) + ' ' + px + 'px ' + r.toFixed(2) + ':1');
      const dark = lum(bg) < 0.2, green = Math.abs(fg0.r - 11) <= 2 && Math.abs(fg0.g - 110) <= 2, red = Math.abs(fg0.r - 179) <= 2 && Math.abs(fg0.g - 38) <= 2;
      if(dark && (green || red)) out.redgreen.push(desc(el));
    }
    // touch targets
    if(o.touch) for(const el of root.querySelectorAll(TAP)){
      if(!rendered(el)) continue;
      const r = el.getBoundingClientRect();
      if(r.width < 43.5 || r.height < 43.5) out.targets.push(desc(el) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
    }
    // horizontal overflow: the page never scrolls sideways; nothing sticks out of the desk frame or the
    // screen's 16px gutters (strips that scroll sideways on purpose are measured as a whole)
    const vw = document.documentElement.clientWidth;
    if(document.documentElement.scrollWidth > vw + 1) out.overflow.push('page scrollWidth ' + document.documentElement.scrollWidth + ' > ' + vw);
    const frame = root.querySelector('.desk-frame') || root;
    const fr = frame.getBoundingClientRect();
    if(o.narrow && (fr.left < 15.5 || fr.right > vw - 15.5)) out.overflow.push('frame ' + Math.round(fr.left) + '..' + Math.round(fr.right) + ' outside 16px gutters of ' + vw);
    const scrollers = [...root.querySelectorAll('.desk-tabs, .dk-secs')];
    for(const el of els){
      if(el === frame || !frame.contains(el)) continue;
      if(scrollers.some(s => s !== el && s.contains(el))) continue;
      const r = el.getBoundingClientRect();
      if(r.left < fr.left - 0.5 || r.right > fr.right + 0.5) out.overflow.push(desc(el) + ' ' + Math.round(r.left) + '..' + Math.round(r.right) + ' vs frame ' + Math.round(fr.left) + '..' + Math.round(fr.right));
    }
    const body = root.querySelector('.desk-body');
    if(body && body.scrollWidth > body.clientWidth + 1) out.overflow.push('desk body scrolls sideways ' + body.scrollWidth + '>' + body.clientWidth);
    return out;
  }
  const shown = () => [...document.querySelectorAll('.overlay.show')].map(o => o.id);
  const hud = () => { const e = document.getElementById('hud'); return !!e && e.style.display !== 'none'; };
  const state = () => ({ shown:shown(), hud:hud(), move:ENGINE.movementEnabled, desk:!!(window.DESK && DESK.open), susp:!!(window.DESK && DESK.susp), tab:window.DESK && DESK.tab });
  return { audit, shown, hud, state, parse, ratio };
})();`;

const lib = h => {
  const D = {};
  D.inject = () => h.page.addScriptTag({ content:PAGE });
  D.state = () => h.ev(() => __VD.state());
  // a worked investigation: Lagos filed and signed, the route filed (exigent), Ugbowo order 'none',
  // phones, money, registry and statements all in play
  D.seed = (o = {}) => h.ev(o => {
    const ids = o.evidence || ['phishing_template', 'kc_sims', 'laptop', 'cash', 'safe_drives', 'obi_notebook', 'osas_voicemail', 'ransom_ledger', 'musa_statement', 'broken_seal', 'asaba_sims', 'asaba_hostage'];
    S.game.evidence = ids.map(id => ({ id, name:(typeof INTEL_NAMES !== 'undefined' && INTEL_NAMES[id]) || id }));
    S.game.intel = S.game.intel || {};
    const d = I();
    d.items = {};
    S.game.evidence.forEach(ev => intelOnEvidence(ev));
    if(d.items.laptop) d.items.laptop.cert = true;
    d.leads = Object.assign(d.leads || {}, { musa:'done', tunde:'done', burner:'done', tobi:'done' });
    d.known = { zuma:['You'], ledger:['You'] };
    d.flagged = Object.assign({}, o.flagged || {});
    d.money = Object.assign({ open:true, req:3, unlocked:{ n_kc:true, n_odogwu:true, n_sister:true, n_bluewater:true }, traced:{ n_kc:true, n_odogwu:true, n_sister:true } }, o.money || {});
    d.reg = { found:{ odogwu:true, bluewater:true, apex:true }, ctc:{} };
    d.st = o.st || {};
    S.game.accusations = Object.assign({
      lagos:{ suspect:'obi', method:'m', money:'x', warrant:'signed', warrantAt:'h2', settled:true, ok:{ suspect:true, method:true, money:true } },
      route:{ suspect:'engineer', method:'m', money:'x', warrant:'exigent', exigentAt:'h5', settled:true, ok:{ suspect:true, method:true, money:true } },
    }, o.accusations || {});
    if(o.warrants) Object.assign(d.warrants, o.warrants);
    if(o.difficulty) S.game.difficulty = o.difficulty;
    if(typeof syncDifficultyClass === 'function') syncDifficultyClass();
  }, o);
  D.recruit = on => h.ev(on => { S.game.difficulty = on ? 'recruit' : 'senior'; if(typeof syncDifficultyClass === 'function') syncDifficultyClass(); if(window.DESK && DESK.open) renderDesk(); }, on);
  D.audit = (sel, o) => h.ev(([sel, o]) => __VD.audit(sel, o), [sel, o || {}]);
  D.rules = (r, name, o = {}) => {
    const show = (k, list) => { if(list && list.length){ h.log(`  ${name} ${k} (${list.length}):`); [...new Set(list)].slice(0, 12).forEach(x => h.log('     ' + x)); } };
    ['effects', 'glyphs', 'palette', 'targets', 'overflow', 'contrast', 'redgreen', 'aks', 'emptyIcons'].forEach(k => show(k, r[k]));
    h.assert(!r.missing, name + ': screen exists');
    h.assert(r.effects.length === 0, name + ': no gradients / shadows / blur / filters');
    h.assert(r.glyphs.length === 0, name + ': no emoji or unicode-glyph icons in text');
    h.assert(r.palette.length === 0, name + ': palette colours only');
    h.assert(r.aks.length === 0, name + ': no "AKS"');
    h.assert(r.emptyIcons.length === 0, name + ': no icon rendered empty');
    h.assert(r.contrast.length === 0, name + ': small text contrast >= 4.5:1');
    h.assert(r.redgreen.length === 0, name + ': no red/green text on ink');
    if(o.touch) h.assert(r.targets.length === 0, name + ': every tappable thing >= 44x44 on touch');
    h.assert(r.overflow.length === 0, name + ': no horizontal overflow');
  };
  // the icon names the desk asks for all exist in beta/icons.js
  D.iconNames = () => {
    const src = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'src', 'v13', 'v13_desk.js'), 'utf8');
    return [...new Set([...src.matchAll(/\bico\('([a-z]+)'/g)].map(m => m[1]).concat([...src.matchAll(/ico\(c\.rel \? '([a-z]+)' : '([a-z]+)'\)/g)].flatMap(m => [m[1], m[2]])))];
  };
  D.calm = async () => { for(let i = 0; i < 30; i++){ if(!(await h.ev(() => document.getElementById('toast').classList.contains('show')))) return; await h.step(200); } };
  return D;
};
module.exports = async () => {};
module.exports.lib = lib;
