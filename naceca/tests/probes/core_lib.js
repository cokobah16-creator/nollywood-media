// core team (Season 2 fix pass): shared helpers for the tests/probes/core_*.js checks.
// Each probe prints 'CHECK <finding> PASS|FAIL|SKIP <detail>' lines and ends with 'CHECKS <pass>/<total>'.
const sc = require('../scen13.js');
const L = module.exports = { sc };
L.checks = function (T) {
  const C = { pass: 0, total: 0, fails: [] };
  C.check = (id, ok, detail) => {
    if (ok === 'skip') { T.log(`CHECK ${id} SKIP ${detail || ''}`); return; }
    C.total++; if (ok) C.pass++; else C.fails.push(id);
    console.log(`CHECK ${id} ${ok ? 'PASS' : 'FAIL'} ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`.slice(0, 900));
  };
  C.done = () => console.log(`CHECKS ${C.pass}/${C.total}${C.fails.length ? ' · failed: ' + C.fails.join(', ') : ''}`);
  return C;
};
/* page-side capture of what the case shows and logs: toasts, radio lines, hints, documents, dialogue keys, V12.log */
L.capture = T => T.ev(() => {
  if (window.__core) return;
  const Z = window.__core = { toast: [], radio: [], hint: [], docs: [], dlg: [], log: [], ev: [] };
  const w = (name, f) => { const o = window[name]; if (typeof o !== 'function') return; window[name] = function () { try { f.apply(this, arguments); } catch (e) {} return o.apply(this, arguments); }; };
  w('startDialogue', k => Z.dlg.push(k));
  w('collectEvidence', e => Z.ev.push(e && e.id));
  w('showHint', (id, a, b) => Z.hint.push([id, String(a || ''), String(b || '')]));
  const t0 = V13.toast; V13.toast = function (a, b) { Z.toast.push(String(a) + ' — ' + String(b)); return t0.apply(this, arguments); };
  const r0 = V13.radio; V13.radio = function (who, text) { Z.radio.push(String(text)); return r0.apply(this, arguments); };
  const od = V12.openDoc; V12.openDoc = function (spec) { Z.docs.push(spec && spec.key); return od.apply(this, arguments); };
  const ol = V12.log; V12.log = function (t, d) { Z.log.push(t + (d && (d.m || d.id || d.key || d.code) ? ':' + (d.m || d.id || d.key || d.code) : '')); return ol.apply(this, arguments); };
});
L.count = (T, re) => T.ev(src => { const r = new RegExp(src); const c = {}; for (const x of window.__core.log) if (r.test(x)) c[x] = (c[x] || 0) + 1; return c; }, re);
L.got = (T, k) => T.ev(k => window.__core[k].slice(), k);
L.labels = T => T.ev(() => ENGINE.interactables.map(i => i.label + (i._used ? '*' : '')).join(' | '));
L.overlays = T => T.ev(() => [...document.querySelectorAll('.overlay.show')].map(o => o.id).join(','));
L.senior = T => T.ev(() => { S.game.difficulty = 'senior'; if (typeof syncDifficultyClass === 'function') syncDifficultyClass(); return !isRecruit(); });
L.recruit = T => T.ev(() => { S.game.difficulty = 'recruit'; if (typeof syncDifficultyClass === 'function') syncDifficultyClass(); return isRecruit(); });
L.esc = T => T.ev(() => document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape', bubbles: true })));
/* the objective's wayfinding target, as our tracker, arrow and marker read it (beta/wayfind.js) */
L.where = T => T.ev(() => { WAY.invalidate(); const c = WAY.current(), r = WAY.resolve();
  return { obj: c.obj && c.obj.id, kind: r && r.kind, uiOnly: !!(r && r.uiOnly), label: r && r.label }; });
/* the Season 1 save at the end of the season (the kit's S1DONE), without Season 2 state */
L.S1FRESH = sc.S1DONE + 'delete S.game.s2;';
