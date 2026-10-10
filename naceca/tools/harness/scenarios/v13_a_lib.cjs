// Shared helpers for team A's v13 scenarios (model & warrants). Running this file on its own is a no-op.
//   const A = require('./v13_a_lib.cjs').lib(h);
// A.audit(sel)  — visual rules inside the visible elements matching sel: no gradient / box or text shadow /
//                 blur / filter, no emoji or unicode-glyph icons, palette colours only, tappables >= 44x44 on
//                 touch, no horizontal overflow, small text contrast >= 4.5:1, no "AKS".
// A.textRules(strings) — the same text rules (glyphs, AKS) for strings the model hands to other screens.
const GLYPH_SRC = String.raw`[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{25A0}-\u{25FF}\u{2190}-\u{2191}\u{2193}-\u{21FF}\u{2300}-\u{23FF}]`;
const PAGE = String.raw`
window.__A = (function(){
  const GLYPH = new RegExp(${JSON.stringify(GLYPH_SRC)}, 'u');
  const vis = el => {
    if(!el.isConnected) return false;
    const cs = getComputedStyle(el);
    if(cs.display === 'none' || cs.visibility === 'hidden') return false;
    const r = el.getBoundingClientRect();
    if(r.width < 1 || r.height < 1) return false;
    for(let p = el; p && p !== document.documentElement; p = p.parentElement){ const c = getComputedStyle(p); if(c.display === 'none' || +c.opacity === 0) return false; }
    return r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth;
  };
  const desc = el => { const c = (el.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean).slice(0, 2).join('.');
    const t = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 28); return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (c ? '.' + c : '') + (t ? ' "' + t + '"' : ''); };
  const rgb = s => { const m = /rgba?\(([^)]+)\)/.exec(s || ''); if(!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r:p[0], g:p[1], b:p[2], a:p.length > 3 ? p[3] : 1 }; };
  const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const PAL = ['--manila','--ink','--green','--red','--grey','--manila-2','--manila-3','--paper-2','--ink-2','--ink-3','--ink-soft','--rule-ink','--rule-paper']
    .map(k => getComputedStyle(document.documentElement).getPropertyValue(k).trim()).map(v => {
      if(/^#/.test(v)){ const n = parseInt(v.slice(1), 16); return { r:n >> 16 & 255, g:n >> 8 & 255, b:n & 255 }; }
      return rgb(v); }).filter(Boolean);
  PAL.push({ r:255, g:255, b:255 }, { r:0, g:0, b:0 }, { r:20, g:20, b:18 });   // icon masks, the canvas, the shared .overlay-bg backdrop (styles.css)
  const inPal = c => !c || c.a === 0 || PAL.some(p => Math.abs(p.r - c.r) <= 2 && Math.abs(p.g - c.g) <= 2 && Math.abs(p.b - c.b) <= 2);
  // the colour actually behind an element: first opaque background up the tree
  const bgOf = el => { for(let p = el; p; p = p.parentElement){ const c = rgb(getComputedStyle(p).backgroundColor); if(c && c.a > 0.5) return c; } return { r:28, g:28, b:26 }; };
  const blurOf = s => { if(!s || s === 'none') return 0; let m = 0;
    for(const p of s.split(/,(?![^(]*\))/)){ const n = p.replace(/rgba?\([^)]*\)/g, '').trim().split(/\s+/).filter(t => /^-?[\d.]+px$/.test(t)).map(parseFloat); if(n.length >= 3) m = Math.max(m, n[2]); }
    return m; };
  const TAP = 'button, a[href], input, select, textarea, [role=button], .seg button, .ops-chip, .dialogue-choice, .ops-b, .cw-btn';
  function audit(sel, touch){
    const out = { effects:[], glyphs:[], colours:[], targets:[], contrast:[], aks:[], overflow:false, n:0 };
    const roots = [...document.querySelectorAll(sel)].filter(vis);
    for(const root of roots){
      for(const el of [root, ...root.querySelectorAll('*')]){
        if(el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue;
        if(!vis(el)) continue;
        out.n++;
        for(const ps of [null, '::before', '::after']){
          const cs = getComputedStyle(el, ps);
          if(ps && (cs.content === 'none' || cs.content === 'normal')) continue;
          const e = [];
          if(/gradient/.test(cs.backgroundImage)) e.push('gradient');
          if((cs.backdropFilter && cs.backdropFilter !== 'none')) e.push('backdrop-filter');
          if(blurOf(cs.boxShadow) > 0) e.push('box-shadow');
          if(cs.textShadow && cs.textShadow !== 'none') e.push('text-shadow');
          if(cs.filter && cs.filter !== 'none') e.push('filter ' + cs.filter);
          if(e.length) out.effects.push(desc(el) + (ps || '') + ' → ' + e.join(', '));
          if(!ps){
            for(const k of ['color', 'backgroundColor', 'borderTopColor']){
              const c = rgb(cs[k]);
              if(k === 'borderTopColor' && (cs.borderTopStyle === 'none' || parseFloat(cs.borderTopWidth) === 0)) continue;
              if(c && !inPal(c)) out.colours.push(desc(el) + ' ' + k + ' ' + cs[k]);
            }
          }
        }
        // own text nodes only
        const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.nodeValue).join('');
        if(own.trim()){
          const g = own.match(GLYPH); if(g) out.glyphs.push(desc(el) + ' has ' + JSON.stringify(g[0]));
          if(/\bAKS\b/.test(own)) out.aks.push(desc(el));
          const cs = getComputedStyle(el), px = parseFloat(cs.fontSize);
          if(px < 18.5){ const fg = rgb(cs.color), bg = bgOf(el); if(fg && fg.a > 0.5){ const r = ratio(fg, bg); if(r < 4.5) out.contrast.push(desc(el) + ' ' + r.toFixed(2) + ':1'); } }
        }
      }
      if(touch) for(const el of root.querySelectorAll(TAP)){ if(!vis(el)) continue; const r = el.getBoundingClientRect(); if(r.width < 43.5 || r.height < 43.5) out.targets.push(desc(el) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height)); }
    }
    out.overflow = document.documentElement.scrollWidth > innerWidth + 1 || document.body.scrollWidth > innerWidth + 1;
    out.roots = roots.length;
    return out;
  }
  function textRules(list){ const bad = []; for(const t of list){ if(typeof t !== 'string') { bad.push('not a string: ' + JSON.stringify(t)); continue; } const g = t.match(GLYPH); if(g) bad.push(JSON.stringify(g[0]) + ' in "' + t.slice(0, 60) + '"'); if(/\bAKS\b/.test(t)) bad.push('AKS in "' + t.slice(0, 60) + '"'); } return bad; }
  return { audit, textRules, vis, desc };
})();`;

const lib = h => {
  const A = {};
  A.inject = async () => { if(!(await h.ev(() => !!window.__A))) await h.page.addScriptTag({ content: PAGE }); };
  A.touch = () => h.ev(() => document.body.classList.contains('touch-active'));
  A.audit = async (sel, label) => {
    await A.inject();
    const touch = await A.touch();
    const r = await h.ev(([sel, touch]) => __A.audit(sel, touch), [sel, touch]);
    h.log(`[audit ${label || sel}] roots:${r.roots} els:${r.n} effects:${r.effects.length} glyphs:${r.glyphs.length} colours:${r.colours.length} contrast:${r.contrast.length} aks:${r.aks.length}` + (touch ? ` small-targets:${r.targets.length}` : '') + ` overflow:${r.overflow}`);
    for(const k of ['effects', 'glyphs', 'colours', 'contrast', 'aks', 'targets']) r[k].slice(0, 8).forEach(x => h.log('   ' + k + ': ' + x));
    h.assert(r.roots > 0, (label || sel) + ': something to audit is on screen');
    h.assert(!r.effects.length, (label || sel) + ': no gradients, shadows, blur or filters');
    h.assert(!r.glyphs.length, (label || sel) + ': no emoji / unicode-glyph icons');
    h.assert(!r.colours.length, (label || sel) + ': palette colours only');
    h.assert(!r.contrast.length, (label || sel) + ': small text contrast >= 4.5:1');
    h.assert(!r.aks.length, (label || sel) + ': no "AKS"');
    h.assert(!r.targets.length, (label || sel) + ': every visible tappable is >= 44x44 on touch');
    h.assert(!r.overflow, (label || sel) + ': no horizontal overflow');
    return r;
  };
  A.textRules = async (list, label) => {
    await A.inject();
    const bad = await h.ev(list => __A.textRules(list), list);
    bad.slice(0, 8).forEach(x => h.log('   text: ' + x));
    h.assert(!bad.length, (label || 'text') + ': no glyph icons or "AKS" in ' + list.length + ' strings');
  };
  A.recruit = on => h.ev(on => { S.game.difficulty = on ? 'recruit' : 'senior'; if(typeof syncDifficultyClass === 'function') syncDifficultyClass(); }, on);
  A.vp = () => h.ev(() => innerWidth + 'x' + innerHeight + (document.body.classList.contains('touch-active') ? '_touch' : ''));
  A.ALL = ['m0', 'm1', 'm2', 'm3', 'm3n', 'm4', 'm5', 'm6', 'm7', 't7'];
  return A;
};
module.exports = async () => {};
module.exports.lib = lib;
