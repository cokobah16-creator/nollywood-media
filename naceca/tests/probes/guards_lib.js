// Team guards: shared helpers for the guards_* kit probes (not a probe on its own).
//   const G = require('./guards_lib.js'); const C = G.checks(T);  C.ok('D1', cond, detail) ... C.done();
// Prints 'CHECK <finding> PASS|FAIL|SKIP <detail>' lines and a closing 'CHECKS <pass>/<total>'.
function checks(T) {
  let pass = 0, total = 0;
  return {
    ok(id, cond, detail) { total++; if (cond) pass++; console.log(`CHECK ${id} ${cond ? 'PASS' : 'FAIL'} ${detail || ''}`); return !!cond; },
    skip(id, why) { console.log(`CHECK ${id} SKIP ${why}`); },
    done() { console.log(`CHECKS ${pass}/${total}`); return pass === total; },
  };
}
// counts of documents, dialogues, objectives, evidence and V12.log calls (the DOUBLETAP=1 hook, when on, is reused)
const instrument = T => T.ev(() => {
  if (!window.__dz) {
    const Z = window.__dz = { docs: [], dlg: [], obj: [], log: [], ev: [], taps: [] };
    const w = (name, f) => { const o = window[name]; window[name] = function () { try { f.apply(this, arguments); } catch (e) {} return o.apply(this, arguments); }; };
    const od = V12.openDoc; V12.openDoc = function (spec) { Z.docs.push(spec && spec.key); return od.apply(this, arguments); };
    w('startDialogue', k => Z.dlg.push(k)); w('completeObjective', id => Z.obj.push(id)); w('collectEvidence', e => Z.ev.push(e && e.id));
    const ol = V12.log; V12.log = function (t, d) { Z.log.push(t + (d && (d.m || d.id || d.key) ? ':' + (d.m || d.id || d.key) : '')); return ol.apply(this, arguments); };
  }
  // what the player is told: radio lines and toasts (V13.radio → V12.say → radioLine; V13.toast → toast)
  if (!window.__said) {
    const said = window.__said = [];
    const r0 = window.radioLine; if (typeof r0 === 'function') window.radioLine = function (sp, text) { said.push('RADIO ' + sp + ': ' + text); return r0.apply(this, arguments); };
    const t0 = window.toast; if (typeof t0 === 'function') window.toast = function (a, b) { said.push('TOAST ' + a + ': ' + (b || '')); return t0.apply(this, arguments); };
  }
});
const count = (T, list, key) => T.ev(([list, key]) => (window.__dz[list] || []).filter(k => k === key).length, [list, key]);
const said = (T, re) => T.ev(src => (window.__said || []).filter(s => new RegExp(src).test(s)), re);
const labels = T => T.ev(() => ENGINE.interactables.map(i => i.label + (i._used ? '*' : '')).join(' | '));
// stand next to an interactable and press E once (the real key path)
const press = (T, re) => T.ev(src => {
  const it = ENGINE.interactables.find(i => new RegExp(src, 'i').test(i.label || ''));
  if (!it) return 'none: ' + ENGINE.interactables.map(i => i.label).join(' | ');
  const p = new THREE.Vector3(); it.mesh.getWorldPosition(p);
  ENGINE.player.position.set(p.x + 0.9, 0, p.z);
  document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', key: 'e', bubbles: true })); document.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyE', key: 'e', bubbles: true }));
  return 'pressed ' + it.label + ' mv=' + ENGINE.movementEnabled;
}, re);
// game time: dt summed by a tick of our own in the case's own loop (it stops under overlays, as the case's timers do)
const gameClock = T => T.ev(() => { window.__gdt = 0; V13.every(dt => { window.__gdt += dt; }); });
const gdt = T => T.ev(() => window.__gdt || 0);
// a wrong answer on the open document (wrong conclusion, a line that proves nothing), then PUT IT ON RECORD
const wrongOnce = (T, key) => T.ev(key => {
  const scope = document.querySelector('#screen-puzzle.show'); if (!scope) return 'no document';
  const P = PUZZLES[key] || { options: [] }, D = V12.DOCS[key] || { proof: [] };
  const oi = P.options.findIndex(o => !o.correct);
  const opts = scope.querySelectorAll('.v12-opt'); if (opts[oi]) opts[oi].click();
  const ln = [...scope.querySelectorAll('.v12-line.live')].find(l => !D.proof.some(p => l.textContent.includes(p)));
  if (ln) ln.click();
  const go = document.getElementById('v12-doc-go'); if (go && !go.disabled) go.click();
  return key + ' misses ' + document.querySelectorAll('#v12-misses i.lost').length;
}, key);
// the right answer and its proof line on the open document
const rightOnce = (T, key) => T.ev(key => {
  const scope = document.querySelector('#screen-puzzle.show'); if (!scope) return 'no document';
  const P = PUZZLES[key], D = V12.DOCS[key];
  const oi = P.options.findIndex(o => o.correct);
  const opts = scope.querySelectorAll('.v12-opt'); if (opts[oi]) opts[oi].click();
  const ln = [...scope.querySelectorAll('.v12-line.live')].find(l => D.proof.some(p => l.textContent.includes(p)));
  if (ln) ln.click();
  const go = document.getElementById('v12-doc-go'); if (go && !go.disabled) go.click();
  return 'right ' + key + (ln ? '' : ' (no proof line found)');
}, key);
// CONTINUE on a failed document (it waits for it)
const docContinue = T => T.ev(() => { const b = document.getElementById('v12-doc-go'); if (b && !b.disabled && /CONTINUE/.test(b.textContent)) { b.click(); return true; } return false; });
module.exports = { checks, instrument, count, said, labels, press, gameClock, gdt, wrongOnce, rightOnce, docContinue };
