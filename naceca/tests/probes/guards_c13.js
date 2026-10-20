// Team guards: Case 13 regression checks (ported from the rules review's r_c13). Run it in portrait (390x844 touch),
// and on phone / desktop for the layout lines:
//   R07  the docket chip is its own row under the document header; #v12-doc-x stays inside the viewport; ink on
//        manila with a 1 px ink border; hot = 2 px red border, a clock icon, no animation
//   R14  the call window: 28 s (+8 on touch, nothing extra on Relaxed); it stands still while the docket is open
//   R13  Senior on Relaxed, 2 misses -> transfer_docket weak; Recruit on Standard, right on the third try -> good
//   R11  Senior toasts carry no "be on the sofa before he is" / "Back to the sofa"; Recruit keeps them
//   RT04 Senior: the docket objective points at nothing during the call; Recruit keeps the pointer
//   D11  a replay starts clean (flags in both stores, exhibits, evQ, _docMiss/_docFree/_docLocked)
const { s2start, use, talk } = require('../scen13.js');
const G = require('./guards_lib.js');
const toWindow = async T => {
  await T.until(() => !V13.rt.intro && ENGINE.movementEnabled, 30000);
  await T.wait(800);
  await use(T, 'Report to Mr. Kuti'); await talk(T, [2]);
  await use(T, 'Sit on the sofa');
  await T.until(() => V13.rt.kutiAt === 'toRecords', 150000);
  await T.ev(() => { for (const m of (V13.rt.movers || [])) { const e = m.pts[m.pts.length - 1]; m.ch.position.x = e.x; m.ch.position.z = e.z; m.i = m.pts.length - 1; } });
  return T.until(() => !!V13.rt.win, 150000);
};
// the wayfinding target of the current objective, with the player stood up from the sofa (seated, the sofa is hidden
// and the beta's last resort finds nothing either way); spec = what this case registered for o13_docket
const way = T => T.ev(() => {
  if (!window.WAY || !WAY.resolve) return null;
  if (V13.rt.seat && V13.rt.seat.release) V13.rt.seat.release();
  WAY.invalidate(); const r = WAY.resolve(), c = WAY.current();
  const t = (WAY.OBJ_TARGETS.m13 || {}).o13_docket, spec = typeof t === 'function' ? t() : t;
  return { obj: c.obj && c.obj.id, kind: r && r.kind, ui: !!(r && r.uiOnly), label: r && r.label, spec: spec === null ? 'null' : JSON.stringify(spec) };
});
module.exports = async function (T) {
  const C = G.checks(T);
  /* ================= run 1: Senior ================= */
  await G.instrument(T);
  T.log('run 1 (Senior)', await s2start(T, 'm13', "S.game.moralChoices.s2_wire = true; S.game.moralChoices.s2_original = 'handed'; S.game.difficulty = 'senior';"));
  await T.ev(() => { SETTINGS.difficulty = 'standard'; SETTINGS.timed = 'normal'; });
  T.log('window?', await toWindow(T));
  await T.wait(1200);
  const w = await T.ev(() => ({ total: V13.rt.win.total, touch: document.body.classList.contains('touch-active') }));
  C.ok('R14-length', w.total === 28 + (w.touch ? 8 : 0), `window ${w.total} s (touch ${w.touch})`);
  const desk = await G.said(T, "^TOAST KUTI'S DESK");
  C.ok('R11-desk-toast-senior', desk.length === 1 && !/sofa before he is/.test(desk[0]) && /records room/.test(desk[0]), JSON.stringify(desk));
  const wy = await way(T);
  C.ok('RT04-senior', wy && wy.obj === 'o13_docket' && wy.ui && /ui/.test(wy.spec), JSON.stringify(wy));
  await use(T, 'Read the docket');
  T.log('doc open?', await T.until(() => document.querySelector('#screen-puzzle.show .v12-opt'), 150000));
  await T.wait(900);
  const key = await T.ev(() => V13.C && V13.C.docket ? V13.C.docket() : 'm13_docket');
  const lay = await T.ev(() => {
    const row = document.querySelector('#screen-puzzle .c13-row'), c = row && row.querySelector('.c13-chip'), x = document.getElementById('v12-doc-x');
    const r = e => e ? e.getBoundingClientRect() : null, cs = c ? getComputedStyle(c) : null, xr = r(x);
    return { row: !!row, prevHead: !!(row && row.previousElementSibling && row.previousElementSibling.classList.contains('head')),
      nextBody: !!(row && row.nextElementSibling && row.nextElementSibling.classList.contains('v12-doc-body')),
      inHead: !!document.querySelector('#screen-puzzle .v12-doc-head-r .c13-chip'),
      x: xr && [Math.round(xr.left), Math.round(xr.right)], vw: innerWidth,
      chip: cs && { color: cs.color, bg: cs.backgroundColor, bw: cs.borderTopWidth, bc: cs.borderTopColor, anim: cs.animationName, text: c.textContent },
      chipBox: c && [Math.round(r(c).left), Math.round(r(c).right)] };
  });
  T.log('layout', JSON.stringify(lay));
  C.ok('R07-row', lay.row && lay.prevHead && lay.nextBody && !lay.inHead, 'the chip is a row between the header and the body');
  C.ok('R07-close-on-screen', lay.x && lay.x[0] >= 0 && lay.x[1] <= lay.vw, `#v12-doc-x at ${lay.x} in 0..${lay.vw}`);
  C.ok('R07-paper', lay.chip && lay.chip.color === 'rgb(28, 28, 26)' && lay.chip.bg === 'rgb(233, 220, 192)' && lay.chip.bw === '1px' && lay.chip.bc === 'rgb(28, 28, 26)', JSON.stringify(lay.chip));
  const t0 = await T.ev(() => V13.rt.win.t); await T.wait(3000); const t1 = await T.ev(() => V13.rt.win.t);
  C.ok('R14-frozen', t0 === t1, `window ${t0.toFixed(2)} → ${t1.toFixed(2)} s over 3 s with the docket open`);
  await T.ev(() => { V13.rt.win.t = 5; }); await T.wait(900);
  const hot = await T.ev(() => { const c = document.querySelector('#screen-puzzle .c13-chip'), cs = c && getComputedStyle(c); return c && { cls: c.className, bw: cs.borderTopWidth, bc: cs.borderTopColor, anim: cs.animationName, svg: !!c.querySelector('svg'), text: c.textContent }; });
  C.ok('R07-hot', hot && /hot/.test(hot.cls) && hot.bw === '2px' && hot.bc === 'rgb(179, 38, 30)' && hot.anim === 'none' && hot.svg && /^FOOTSTEPS/.test(hot.text), JSON.stringify(hot));
  const t2 = await T.ev(() => V13.rt.win.t);
  C.ok('R14-frozen-hot', t2 === 5, `footsteps phase, docket open: window stays at ${t2} s`);
  await T.ev(() => { V13.rt.win.t = 20; }); await T.wait(600);
  // R13: Senior on Relaxed, two misses
  await T.ev(() => { SETTINGS.difficulty = 'story'; });
  T.log('miss 1', await G.wrongOnce(T, key)); await T.wait(1200);
  T.log('miss 2', await G.wrongOnce(T, key)); await T.wait(1200);
  const msg = await T.ev(() => (document.getElementById('v12-doc-msg') || {}).textContent || '');
  T.log('doc says', msg.slice(0, 80));
  await G.docContinue(T);
  await T.until(() => !document.querySelector('#screen-puzzle.show'), 15000); await T.wait(600);
  const q1 = await T.ev(() => ({ q: (S.game.evQ || {}).transfer_docket, held: V13.hasEv('transfer_docket'), row: !!document.querySelector('#screen-puzzle .c13-row') }));
  C.ok('R13-senior-relaxed', q1.held && q1.q === 'weak', `Senior, Relaxed, 2 misses: transfer_docket ${q1.q}`);
  C.ok('R07-chip-gone', !q1.row, 'the chip row goes with the document');
  await T.ev(() => { SETTINGS.difficulty = 'standard'; });
  const now1 = await G.said(T, '^TOAST NOW');
  C.ok('R11-now-senior', now1.length === 0, now1.length ? JSON.stringify(now1) : 'no "Back to the sofa" toast on Senior');
  // Kuti comes back (caught at the desk, or back on the sofa: under the stub the lean over the desk doesn't move
  // the player, so either may happen); see run 1 through to the double doors before the replay
  await T.ev(() => { if (V13.rt.win) V13.rt.win.t = Math.min(V13.rt.win.t, 1); });
  await T.until(() => !V13.rt.win, 60000);
  await T.ev(() => { for (const m of (V13.rt.movers || [])) { const e = m.pts[m.pts.length - 1]; m.ch.position.x = e.x; m.ch.position.z = e.z; m.i = m.pts.length - 1; } });
  await T.until(() => document.getElementById('screen-dialogue').classList.contains('show'), 60000);
  T.log('Kuti back:', await T.ev(() => DLG.scriptKey), 'caught', await T.ev(() => !!V13.rt.caught));
  for (let k = 0; k < 60; k++) {
    const s = await T.ev(() => ({ dlg: document.getElementById('screen-dialogue').classList.contains('show'), seat: ENGINE.interactables.some(i => /Take the seat/.test(i.label || '')) }));
    if (s.dlg) { await talk(T); continue; }
    if (s.seat) break;
    await T.wait(1000);
  }
  await T.wait(1500);
  T.log('run 1 at the doors', await T.ev(() => ENGINE.interactables.map(i => i.label).join(' | ')));
  const desk0 = (await G.said(T, "^TOAST KUTI'S DESK")).length;

  /* ================= run 2: the replay, on Recruit ================= */
  const dirt = "S.game.completedMissions.push('m13'); S.game.difficulty = 'recruit';" +
    "S.game.evidence = (S.game.evidence || []).concat([{ id:'dg_recording', name:'Recording — the ninth floor' }]);" +
    "S.game.evQ = Object.assign(S.game.evQ || {}, { dg_recording:'good' });" +
    "S.game._docMiss = Object.assign(S.game._docMiss || {}, { m13_docket:1, m13_docket_kept:2 }); S.game._docFree = Object.assign(S.game._docFree || {}, { m13_docket:true }); S.game._docLocked = Object.assign(S.game._docLocked || {}, { m13_docket_kept:true });" +
    "S.game.moralChoices.s2_ninth = 'refuse'; S.game.flags = Object.assign(S.game.flags || {}, { s2_ninth:'refuse' });" +
    "S.game.moralChoices.s2_wire = true; S.game.moralChoices.s2_original = 'handed';";
  T.log('dirty before the replay', await T.ev(() => JSON.stringify({ ev: (S.game.evidence || []).filter(e => /^(transfer_docket|dg_recording)$/.test(e.id)).map(e => e.id) })));
  T.log('run 2 (replay, Recruit)', await s2start(T, 'm13', dirt));
  const clean = await T.ev(() => ({ ev: (S.game.evidence || []).filter(e => e && /^(transfer_docket|dg_recording)$/.test(e.id)).map(e => e.id),
    q: ['transfer_docket', 'dg_recording'].filter(id => (S.game.evQ || {})[id] !== undefined),
    docs: ['_docMiss', '_docFree', '_docLocked'].flatMap(s => ['m13_docket', 'm13_docket_kept'].filter(k => (S.game[s] || {})[k] !== undefined).map(k => s + '.' + k)),
    flag: [(S.game.moralChoices || {}).s2_ninth, (S.game.flags || {}).s2_ninth].filter(v => v !== undefined) }));
  C.ok('D11-replay-clean', !clean.ev.length && !clean.q.length && !clean.docs.length && !clean.flag.length, JSON.stringify(clean));
  await T.ev(() => { SETTINGS.difficulty = 'standard'; });
  T.log('window?', await toWindow(T));
  await T.wait(1200);
  const wy2 = await way(T);
  C.ok('RT04-recruit', wy2 && wy2.obj === 'o13_docket' && wy2.spec === 'null' && !wy2.ui && wy2.kind === 'fallback', JSON.stringify(wy2));
  const desk2 = (await G.said(T, "^TOAST KUTI'S DESK")).slice(desk0);
  C.ok('R11-desk-toast-recruit', desk2.length === 1 && /sofa before he is/.test(desk2[0]), JSON.stringify(desk2));
  await use(T, 'Read the docket');
  T.log('doc open?', await T.until(() => document.querySelector('#screen-puzzle.show .v12-opt'), 150000));
  await T.wait(900);
  const pips = await T.ev(() => document.querySelectorAll('#v12-misses i').length);
  T.log('miss 1', await G.wrongOnce(T, key)); await T.wait(1200);
  T.log('miss 2', await G.wrongOnce(T, key)); await T.wait(1200);
  T.log('third try', await G.rightOnce(T, key));
  await T.until(() => !document.querySelector('#screen-puzzle.show'), 15000); await T.wait(800);
  const q2 = await T.ev(() => ({ q: (S.game.evQ || {}).transfer_docket, held: V13.hasEv('transfer_docket') }));
  C.ok('R13-recruit-standard', pips === 3 && q2.held && q2.q === 'good', `Recruit (${pips} misses allowed), Standard, right on the third try: transfer_docket ${q2.q}`);
  await T.wait(800);
  const now2 = await G.said(T, '^TOAST NOW');
  C.ok('R11-now-recruit', now2.length >= 1, JSON.stringify(now2));
  C.done();
};
