// tac_api: the TAC kernel's frozen API (DESIGN-tactics.md §3) works on the stub and keeps working on the real modules.
// Owner: Team A. Base-commit scenario; every team runs it before merging.
const T = require('./tactics_lib.cjs');
module.exports = async h => {
  // ---- market: lanes, the KC path, ticks, a watcher, probe, spent rule, hints ----
  await T.deviceMarket(h, { seed:7 });
  const a = await h.ev(() => {
    const out = { v:TAC.v, nodes:MARKET_LANES.nodes.length, edges:MARKET_LANES.edges.length };
    let n = 0; const off = TAC.onTick(() => { n++; });
    let f = 0; const off2 = TAC.onFrame(() => { f++; });
    __wf.run(1.0); off(); off2(); out.ticks = n; out.frames = f;
    return out;
  });
  h.log('kernel', JSON.stringify(a));
  h.assert(a.v === 1, 'TAC.v is 1');
  h.assert(a.nodes === 18 && a.edges === 23, 'lanes installed: 18 nodes, 23 edges');
  h.assert(a.ticks === 10, 'onTick runs at 10 Hz (got ' + a.ticks + ')');
  h.assert(a.frames === 60, 'onFrame runs every frame (got ' + a.frames + ')');

  await T.capture(h);
  const b = await h.ev(() => {
    const kc = ENGINE._marketKC, P = ENGINE.player.position;
    const w = TAC.sight.watch({ id:'kc', enc:'m2_kc', mesh:kc, eyeH:1.5, range:{ lit:12, dark:6 }, hearing:0.6, surface:'on the street', logExtra:() => ({ phase:'test' }) });
    const pr = { stand:TAC.sight.probe('kc', 2, 4, { gait:'walk' }), crouch:TAC.sight.probe('kc', 2, 4, { gait:'sneak', crouch:true }),
      behind:TAC.sight.probe('kc', 12, 4, { gait:'walk' }), jog:TAC.sight.probe('kc', 2, 4, { gait:'jog' }) };
    P.x = 2; P.z = 4; __wf.run(0.5);
    const t0 = __wf.t; let notice = null, alarm = null;
    __wf.run(8, () => { if (notice == null && w.state.level !== 'calm') notice = __wf.t - t0; if (w.state.level === 'alarm') { alarm = __wf.t - t0; return true; } });
    const st = Object.assign({}, w.state);
    w.reset(0); P.x = 30; P.z = 30; __wf.run(0.5);
    w.reset(45, { cause:'tunde', why:'He saw you talking to Tunde in the road', quiet:true });
    const afterReset = { level:w.state.level, why:w.state.why };
    w.unwatch();
    return { pr:{ stand:+pr.stand.gain.toFixed(1), crouch:+pr.crouch.gain.toFixed(1), behind:+pr.behind.gain.toFixed(1), jog:+pr.jog.gain.toFixed(1) },
      notice, alarm, level:st.level, why:st.why, afterReset, eye:!!document.querySelector('#eye-ind.show') };
  });
  h.log('watcher', JSON.stringify(b));
  h.assert(b.pr.stand > 0 && b.pr.crouch > 0 && b.pr.crouch < b.pr.stand / 2, 'probe: crouched gains under half of standing');
  h.assert(b.pr.behind === 0, 'probe: no sight gain behind him');
  h.assert(Math.abs(b.pr.jog / b.pr.stand - 3.0 / 1.55) < 0.05, 'probe: jog gains in proportion to speed (same per metre as a walk)');
  h.assert(b.notice != null && b.notice < 1.5 && b.alarm != null && b.alarm < 4.0, 'standing 6 m in his cone: notice < 1.5 s, alarm < 4 s');
  h.assert(b.level === 'alarm' && /saw you/.test(b.why), 'alarm freezes a past-tense why-line');
  h.assert(b.afterReset.level === 'notice' && /Tunde/.test(b.afterReset.why), 'reset(v, {cause, why}) sets the level and the line');
  const ev = await T.events(h);
  const seen = ev.filter(e => e[0] === 'seen');
  h.log('seen events', JSON.stringify(seen.map(e => [e[1].level, e[1].cause, e[1].who])));
  h.assert(seen.some(e => e[1].level === 'notice' && e[1].cause === 'sight') && seen.some(e => e[1].level === 'alarm'), 'seen logged at notice and alarm');
  h.assert(seen.some(e => e[1].cause === 'tunde'), 'reset with a cause logs one seen');
  h.assert(seen.every(e => e[1].phase === 'test'), 'logExtra is merged into seen');
  const ui = await h.ev(() => ({ row:TAC.ui.chipRow().id, full:[TAC.sight.full, TAC.geo.full, TAC.radio.full] }));
  h.assert(ui.row === 'tac-chips', 'TAC.ui.chipRow() gives #tac-chips');
  h.log('full flags (false on the kernel alone)', JSON.stringify(ui.full));

  // spent rule: the scanned phone steps aside for KC
  const c = await h.ev(() => {
    S.game._marketTunde = true; S.game._marketScanned = true;
    const P = ENGINE.player.position; P.x = 6.3; P.z = 4.2;
    const before = (nearestInteractable() || {}).label;
    TAC.interact.spent('Scan suspect phone', () => !!S.game._marketScanned);
    const after = (nearestInteractable() || {}).label;
    P.x = 7.0; P.z = 2.9; const alone = (nearestInteractable() || {}).label;   // only the phone in reach? (still answers when alone)
    TAC.interact.spent('Scan suspect phone', null);
    return { before, after, alone };
  });
  h.log('spent', JSON.stringify(c));
  h.assert(c.after === 'Confront teen suspect', 'a spent target steps aside');

  // hints: Senior gets none
  const d = await h.ev(() => { const senior = TAC.hint('test_a', 'x'); S.game.difficulty = 'recruit'; const rec = TAC.hint('test_b', 'y'); S.game.difficulty = 'senior'; return { senior, rec }; });
  h.assert(d.senior === false && d.rec === true, 'TAC.hint is Recruit-only');

  // the KC path swap reaches every inner startChase wrap
  const e = await h.ev(() => { S.game._marketScanned = true; S.game.moralChoices.market_runner = null;
    const it = ENGINE.interactables.find(i => i.label === 'Confront teen suspect'); ENGINE.player.position.x = 5.8; ENGINE.player.position.z = 4.6; it.onInteract();
    const c = CHASE.active; const r = { len:c && c.path.length, p7:c && c.path[7] }; stopChase(); return r; });
  h.log('kc path', JSON.stringify(e));
  h.assert(e.len >= 10 && e.p7[0] === 7.6 && e.p7[1] === -18.6, 'KC runs the frozen path');

  // ---- fixtures: walk, dialogue ----
  await T.deviceMarket(h, { seed:11 });
  const wk = await T.walk(h, [[0, 9.4], [2, 6], [2, 2]], { speed:1.55 });
  h.log('walk', JSON.stringify(wk));
  h.assert(wk.reached && Math.abs(wk.at[0] - 2) < 0.06 && Math.abs(wk.at[1] - 2) < 0.06, 'T.walk reaches its last point');
  await h.ev(() => { ENGINE.player.position.x = -5; ENGINE.player.position.z = -2; startDialogue('market_intro'); });
  const d1 = await T.finishDialogue(h);
  h.assert(d1 === 'choice', 'T.finishDialogue stops at the choice');
  await T.choose(h, 0);
  const d2 = await T.finishDialogue(h);
  const tunde = await h.ev(() => !!S.game._marketTunde);
  h.log('dialogue', JSON.stringify({ d1, d2, tunde }));
  h.assert(d2 === false && tunde, 'T.choose + T.finishDialogue close market_intro (o1_tunde done)');

  // ---- mansion: geo.ready() on the art-pass house, not on the legacy one ----
  await T.deviceMansion(h, { seed:3 });
  const m = await h.ev(() => ({ ready:TAC.geo.ready(), obi:!!(ENGINE._mansion && ENGINE._mansion.D) }));
  await T.restoreArt(h);
  await T.start(h, 'm3', { seed:3 });
  const l = await h.ev(() => ({ ready:TAC.geo.ready(), v8:!!ENGINE._mansion }));
  h.log('mansion', JSON.stringify({ m, l }));
  h.assert(m.ready === true && l.ready === false && l.v8 === false, 'watchers freeze in the legacy (art-failed) house');
};
