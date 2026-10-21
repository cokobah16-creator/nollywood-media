// screens team: a copy of the rules review's paper-identity audit (kit probes/rlib.js), so our checks run the same computed-style rules
const path = require('path'), fs = require('fs');
const OUT = process.env.SHOTS || path.join(__dirname, '..', 'shots');
const REC = path.join(OUT, 'audit.jsonl');

async function shot(T, name) {
  try {
    await T.page.screenshot({ path: path.join(OUT, `${T.mode}_${name}.png`), timeout: 150000 });
    console.log('  shot', name);
  } catch (e) { console.log('  shot FAILED', name, String(e.message).slice(0, 100)); }
}

// runs in the page
function auditInPage(arg) {
  const { sel, name } = arg;
  const PAL = { manila:[233,220,192], ink:[28,28,26], green:[11,110,79], red:[179,38,30], grey:[107,107,99], 'manila-2':[168,159,138],
    'manila-3':[140,132,115], 'paper-2':[220,205,171], 'ink-2':[38,38,35], 'ink-3':[52,52,47], 'ink-soft':[79,76,68], black:[0,0,0] };
  const near = (a, b) => Math.abs(a[0] - b[0]) <= 3 && Math.abs(a[1] - b[1]) <= 3 && Math.abs(a[2] - b[2]) <= 3;
  const parse = c => { const m = String(c).match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { rgb:p.slice(0, 3), a:p.length > 3 ? p[3] : 1 }; };
  const offPal = c => { const p = parse(c); if (!p || p.a === 0) return null; return Object.values(PAL).some(v => near(v, p.rgb)) ? null : c; };
  const roots = [...document.querySelectorAll(sel)].filter(r => { const s = getComputedStyle(r); return s.display !== 'none' && s.visibility !== 'hidden'; });
  const touch = document.body.classList.contains('touch-active');
  const vw = innerWidth, vh = innerHeight;
  const out = { name, sel, roots:roots.length, vw, vh, touch, gradients:[], shadows:[], blur:[], radius:[], colours:{}, fonts:{}, small:[], offscreen:[], glyphs:[], keyhints:[], anim:[], docOverflowX: document.documentElement.scrollWidth > vw + 1 };
  const label = el => (el.id ? '#' + el.id : el.tagName.toLowerCase()) + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : '');
  const seen = new Set();
  const push = (arr, v, max = 40) => { const k = JSON.stringify(v); if (seen.has(arr.length + '|' + k)) return; if (arr.length < max && !arr.some(x => JSON.stringify(x) === k)) arr.push(v); };
  for (const r of roots) {
    const all = [r, ...r.querySelectorAll('*')];
    for (const el of all) {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;
      const L = label(el);
      if (/gradient/.test(cs.backgroundImage)) push(out.gradients, [L, cs.backgroundImage.slice(0, 90)]);
      if (cs.boxShadow !== 'none') push(out.shadows, [L, 'box', cs.boxShadow.slice(0, 70)]);
      if (cs.textShadow !== 'none') push(out.shadows, [L, 'text', cs.textShadow.slice(0, 70)]);
      if (/blur/.test(cs.filter) || /blur/.test(cs.backdropFilter || cs.webkitBackdropFilter || '')) push(out.blur, [L, cs.filter, cs.backdropFilter]);
      const rad = Math.max(...[cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomLeftRadius, cs.borderBottomRightRadius].map(v => parseFloat(v) || 0));
      if (rad > 4 && rad < 999) push(out.radius, [L, rad]);
      if (cs.animationName && cs.animationName !== 'none') push(out.anim, [L, cs.animationName]);
      const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
      for (const [k, v] of [['color', hasText ? cs.color : null], ['bg', cs.backgroundColor], ['border', parseFloat(cs.borderTopWidth) ? cs.borderTopColor : null], ['borderL', parseFloat(cs.borderLeftWidth) > 1 ? cs.borderLeftColor : null]]) {
        if (!v) continue; const o = offPal(v); if (o) { const key = k + ' ' + o; out.colours[key] = out.colours[key] || []; if (out.colours[key].length < 3) out.colours[key].push(L); }
      }
      if (hasText) { const f = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim(); if (!/^(Oswald|Inter|JetBrains Mono|Arial Narrow)$/i.test(f)) { out.fonts[f] = out.fonts[f] || []; if (out.fonts[f].length < 3) out.fonts[f].push(L); } }
      const clickable = el.matches('button,a[href],input,select,textarea,[role=button],.btn,.acc-card,.acc-item,.dialogue-choice,.v12-opt,.v12-line.live,.ph-row,.cb-exh,.m12s-strip,.mission-card') || (el.onclick != null);
      if (clickable && !el.disabled) {
        if (touch && (rect.height < 43.5 || rect.width < 43.5)) push(out.small, [L, Math.round(rect.width) + 'x' + Math.round(rect.height), (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30)], 60);
        // off-screen: outside the viewport and not inside a scrolling box that contains it
        let p = el.parentElement, scroller = false;
        while (p && p !== document.body) { const s = getComputedStyle(p); if (/(auto|scroll)/.test(s.overflowX + s.overflowY) && (p.scrollWidth > p.clientWidth + 1 || p.scrollHeight > p.clientHeight + 1)) { scroller = true; break; } p = p.parentElement; }
        if (!scroller && (rect.right > vw + 1 || rect.left < -1 || rect.bottom > vh + 1 || rect.top < -1)) push(out.offscreen, [L, [rect.left, rect.top, rect.right, rect.bottom].map(Math.round).join(','), (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30)]);
      }
      if (hasText) {
        const t = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
        if (/[✕✓✗✔✘★☆⚠●◆▶◀►◄✉☎✈⌛⏱]|\p{Extended_Pictographic}/u.test(t) || /^\?$/.test(t)) push(out.glyphs, [L, t.slice(0, 40)]);
        if (touch && /\b(press|hold|click)\b\s+[A-Z0-9]\b|\[(E|C|J|TAB|ESC|SPACE)\]|\bE to\b|\bkey\b/i.test(t)) push(out.keyhints, [L, t.slice(0, 80)]);
      }
    }
  }
  return out;
}

async function audit(T, name, sel) {
  const r = await T.ev(auditInPage, { sel, name });
  r.mode = T.mode;
  fs.appendFileSync(REC, JSON.stringify(r) + '\n');
  const n = k => Array.isArray(r[k]) ? r[k].length : Object.keys(r[k]).length;
  console.log(`  audit ${name} [${sel}] roots=${r.roots} grad=${n('gradients')} shadow=${n('shadows')} blur=${n('blur')} radius=${n('radius')} colours=${n('colours')} fonts=${Object.keys(r.fonts).join('|')} small=${n('small')} off=${n('offscreen')} glyphs=${JSON.stringify(r.glyphs).slice(0, 160)} keyhints=${n('keyhints')} overflowX=${r.docOverflowX}`);
  return r;
}
async function look(T, name, sel) { await shot(T, name); return audit(T, name, sel); }
const text = (T, sel) => T.ev(s => [...document.querySelectorAll(s)].map(e => e.innerText).join('\n---\n'), sel);
module.exports = { shot, audit, look, text };
