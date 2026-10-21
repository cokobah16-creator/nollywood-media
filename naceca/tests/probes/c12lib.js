// Case 12 probe steps. Under two browsers on two CPUs the game can run at 1-3 fps, and game time
// (dt is clamped) runs slower than the wall clock, so every step waits on game state, not on time.
const { talk, solve } = require('../scen13.js');
const LONG = 150000;
async function waitDlg(T, key) {
  const ok = await T.until(k => { const ov = document.getElementById('screen-dialogue'); return ov.classList.contains('show') && (!k || (DLG.scriptKey || '') === k); }, LONG, key || null);
  if (!ok) T.log('!! no dialogue', key || '');
  return ok;
}
async function say(T, key, picks) { if (await waitDlg(T, key)) { await T.wait(300); await talk(T, picks); } }
async function card(T) {
  const a = await T.until(() => document.querySelector('#title-card.show'), LONG);
  await T.until(() => !document.querySelector('#title-card.show'), LONG);
  if (!a) T.log('!! no card'); await T.wait(500);
}
const free = T => T.until(() => !document.querySelector('#title-card.show') && !isOverlayOpen() && ENGINE.movementEnabled && !ENGINE.seq, LONG);
async function useAt(T, re, x, z) {
  await T.until(src => { const r = new RegExp(src, 'i'); return !document.querySelector('#title-card.show') && !isOverlayOpen() && !ENGINE.seq && ENGINE.interactables.some(i => r.test(i.label || '')); }, LONG, re);
  const r = await T.ev(([src, x, z]) => {
    const it = ENGINE.interactables.find(i => new RegExp(src, 'i').test(i.label || ''));
    if (!it) return 'none: ' + ENGINE.interactables.map(i => i.label).join(' | ');
    const P = ENGINE.player.position;
    if (x == null) { const p = new THREE.Vector3(); it.mesh.getWorldPosition(p); const dx = P.x - p.x, dz = P.z - p.z, d = Math.hypot(dx, dz) || 1; x = p.x + dx / d * 1.2; z = p.z + dz / d * 1.2; }
    P.set(x, 0, z); if (typeof faceEachOther === 'function') try { faceEachOther(it); } catch (e) {}
    it.onInteract(it); TPCAM.cur = null; return 'ok ' + it.label;
  }, [re, x == null ? null : x, z == null ? null : z]);
  T.log('use', re, '→', r); await T.wait(400);
  return r;
}
const use = (T, re) => useAt(T, re);
async function doc(T, key, wrong) {
  const ok = await T.until(() => document.querySelector('#screen-puzzle.show .v12-opt'), LONG);
  if (!ok) { T.log('!! no document', key); return; }
  await solve(T, key, wrong);
  for (let k = 0; k < 4; k++) {          // a failed document waits on CONTINUE
    if (await T.until(() => !document.querySelector('#screen-puzzle.show'), 8000)) break;
    await T.ev(() => { const b = document.getElementById('v12-doc-go'); if (b && !b.disabled) b.click(); });
  }
}
const flags = T => T.ev(() => JSON.stringify(Object.fromEntries(Object.entries(S.game.moralChoices || {}).filter(([k]) => k.startsWith('s2_')))));
const evq = T => T.ev(() => ['loading_log', 'tank3_sample', 'gate_register', 'cac_record', 'bank_trail'].map(id => id + ':' + (V13.hasEv(id) ? V13.evQ(id) : '—')).join(' '));
const labels = T => T.ev(() => ENGINE.interactables.map(i => i.label + (i._used ? '*' : '')).join(' | '));
/* the shredded page: swap strips until it reads (real taps on a phone) */
async function strips(T, shot, real) {
  await T.until(() => document.querySelector('#screen-minigame.show .m12s-strip'), LONG);
  await T.wait(800); if (shot) await shot('strips_intro');
  await T.ev(() => document.querySelector('#mg-actions [data-primary]').click());
  await T.wait(800); if (shot) await shot('strips_play');
  for (let k = 0; k < 20; k++) {
    const pair = await T.ev(() => {
      const els = [...document.querySelectorAll('#screen-minigame .m12s-strip')].sort((a, b) => parseFloat(a.style.left) - parseFloat(b.style.left));
      const order = els.map(e => +e.dataset.piece);
      const i = order.findIndex((p, s) => p !== s); if (i < 0) return null;
      const j = order.indexOf(i);
      const c = e => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
      return { order: order.join(''), a: c(els[i]), b: c(els[j]), i, j };
    });
    if (!pair) break;
    T.log('   strips', pair.order, 'swap', pair.i, pair.j);
    for (const p of [pair.a, pair.b]) { if (real) await T.page.touchscreen.tap(p[0], p[1]); else await T.page.mouse.click(p[0], p[1]); await T.wait(350); }
    if (k === 1 && shot) await shot('strips_mid');
  }
  await T.wait(1000); if (shot) await shot('strips_solved');
  await T.until(() => /CONTINUE/.test((document.querySelector('#mg-actions [data-primary]') || {}).textContent || ''), LONG);
  await T.wait(600); if (shot) await shot('strips_result');
  T.log('   result layout', await T.ev(() => { const f = document.getElementById('mg-frame').getBoundingClientRect();
    const notes = [...document.querySelectorAll('#mg-msg .mg-note')].map(n => { const r = n.getBoundingClientRect(); return n.textContent.slice(0, 16) + '@' + Math.round(r.top) + '-' + Math.round(r.bottom); });
    const b = document.querySelector('#mg-actions .btn').getBoundingClientRect();
    return JSON.stringify({ vh: innerHeight, frame: [Math.round(f.top), Math.round(f.bottom)], notes, btn: [Math.round(b.top), Math.round(b.bottom)] }); }));
  await T.ev(() => document.querySelector('#mg-actions [data-primary]').click());
  await T.until(() => !document.querySelector('#screen-minigame.show'), LONG);
}
/* Tank 3, the union shed, then the calls and the end: the same for every branch */
async function threads(T, shot, ibi, failCac) {
  await use(T, 'Draw a sample'); await T.until(() => ENGINE.seq, 20000); await T.wait(1500); if (shot) await shot('tank3');
  await use(T, 'Test the sample'); await T.until(() => ENGINE.seq, 20000); await T.wait(1000); if (shot) await shot('lab');
  await doc(T, 'm12_sample');
  await use(T, 'union chairman'); await waitDlg(T, 'm12_ibinabo'); await T.wait(1200); if (shot) await shot('union'); await talk(T, [ibi]);
  await T.log('threads', await flags(T), await evq(T));
  await waitDlg(T); await T.wait(1000); if (shot) await shot('cac_call'); await talk(T);
  await doc(T, 'm12_cac', !!failCac);
  await use(T, 'about the money'); await say(T, 'm12_bank');
  await say(T, 'm12_summons');
  await card(T); await waitDlg(T, 'm12_end'); await T.wait(2000); if (shot) await shot('end'); await talk(T);
  await T.until(() => document.getElementById('screen-aftermath').classList.contains('show'), LONG);
  await T.wait(1000); if (shot) await shot('aftermath');
}
module.exports = { waitDlg, say, card, free, useAt, use, doc, flags, evq, labels, strips, threads };
