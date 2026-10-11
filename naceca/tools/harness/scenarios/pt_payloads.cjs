// pt_payloads (Team D): the enrichments of existing events (DESIGN-tactics.md §4) made by the tactics layer's outer
// V12.log wrapper and its wraps: session, obj_done, stuck, away (muted in chases), chase_end how/by, the confront that
// starts a chase, BACK TO THE TABLE as blocked, ov_dwell, orient.
//   node tools/harness/run.cjs tools/harness/scenarios/pt_payloads.cjs --html <build>/naceca.html --w 390 --h 844 --touch 1
const P = require('./pt_lib.cjs');
const T = P.T;
module.exports = async h => {
  await T.start(h, 'm2', { seed:5 });
  const touch = await h.ev(() => document.body.classList.contains('touch-active'));
  await h.ev(() => V12.ptKit.player('P1'));
  let ev = await P.all(h);

  // session: ptv 2, player, orient, slice, tz (the page-load session)
  const ss = P.of(ev, 'session')[0];
  h.log('session', JSON.stringify(ss && ss.d).slice(0, 300));
  h.assert(ss && ss.d.ptv === 2 && 'player' in ss.d && /^(portrait|landscape)$/.test(ss.d.orient) && ss.d.slice === 'm3' && typeof ss.d.tz === 'number', 'session carries ptv 2, player, orient, slice, tz');
  h.assert(ss.d.orient === (await h.ev(() => innerWidth > innerHeight ? 'landscape' : 'portrait')), 'session.orient matches the screen');

  // obj_done: txt, and the alarms / notices counted while the objective was current (real seen events from a watcher)
  let t0 = await P.mark(h);
  await h.ev(() => {
    const w = TAC.sight.watch({ id:'kc', enc:'m2_kc', mesh:ENGINE._marketKC, eyeH:1.5 });
    w.reset(40, { cause:'sight', why:'He can see you crossing the open road' });
    w.reset(100, { cause:'sight', why:'He saw you crossing the open road, standing' });
    w.reset(0); w.unwatch();
    completeObjective((S.game.objectives.find(o => !o.done) || {}).id);
  });
  ev = await P.all(h);
  const od = P.of(ev, 'obj_done', t0)[0];
  h.log('obj_done', JSON.stringify(od && od.d));
  h.assert(od && od.d.id === 'o1_tunde' && od.d.txt === 'Speak with informant Tunde' && od.d.seen === 1 && od.d.notices === 1, 'obj_done has txt (≤ 48), seen and notices');
  h.assert(od.d.p === 'P1' && typeof od.d.ps === 'number', 'and the player and play seconds');

  // stuck: txt, want (the tracker label), px, pz
  t0 = await P.mark(h);
  await h.ev(() => { showOverlay(null); ENGINE.movementEnabled = true; const p = ENGINE.player.position; p.x = 2.5; p.z = -1.5; const S0 = V12._ptState; S0.lastProg = S0.play - 120000; S0.stuckAt = 0; S0.sig = progressSig(); });
  await h.step(2600);
  ev = await P.all(h);
  const st = P.of(ev, 'stuck', t0)[0];
  h.log('stuck', JSON.stringify(st && st.d));
  const want = await h.ev(() => { const r = WAY.resolve(); return r && r.label; });
  h.assert(st && st.d.txt === 'Scan suspect phone' && st.d.want === want && st.d.px === 2.5 && st.d.pz === -1.5, 'stuck has txt, want, px, pz');

  // away is muted while KC outruns a slow pursuer, and while a scripted pursuit runs; logged otherwise
  const walkAway = async (label) => {
    const a0 = await P.mark(h);
    for(let i = 0; i < 5; i++){
      await h.ev(() => {
        const p = ENGINE.player.position, t = WAY.resolve(); if(!t || !t.pos) return;
        const dx = p.x - t.pos.x, dz = p.z - t.pos.z, d = Math.hypot(dx, dz) || 1;
        p.x += dx / d * 4; p.z += dz / d * 4;
        V12._ptState.play += 6000;
      });
      await h.step(1050);
    }
    const n = P.of(await P.all(h), 'away', a0).length;
    h.log(label, 'away events', n);
    return n;
  };
  await h.ev(() => { S.game._marketTunde = true; S.game._marketScanned = true; completeObjective('o2_scan'); V12._ptState.awayAt = -1e9; });
  // the check is live: walking off the target logs away outside a chase
  await h.ev(() => { const p = ENGINE.player.position; p.x = 6; p.z = 8; showOverlay(null); ENGINE.movementEnabled = true; });
  const free = await walkAway('free');
  // a scripted pursuit (TAC.state.pursuit, e.g. Obi's flight): muted
  await h.ev(() => { const p = ENGINE.player.position; p.x = 6; p.z = 8; TAC.state.pursuit = 'm3_flight'; V12._ptState.awayAt = -1e9; });
  const inPursuit = await walkAway('in a scripted pursuit');
  await h.ev(() => { TAC.state.pursuit = null; V12._ptState.awayAt = -1e9; });
  // a chase: KC bolts and the player falls behind (the frozen clock: KC stays, the player walks off the gap)
  await h.ev(() => { const p = ENGINE.player.position; p.x = 8; p.z = 6.3; ENGINE.movementEnabled = true; showOverlay(null); tryInteract(); });
  await h.step(500);
  h.assert(await h.ev(() => !!CHASE.active), 'the confront started the chase');
  const inChase = await walkAway('in a chase');
  // the confront that started it is progress with chase:true, not a refusal
  ev = await P.all(h);
  const conf = P.of(ev, 'interact_result').filter(e => e.d.label === 'Confront teen suspect').pop();
  h.log('confront', JSON.stringify(conf && conf.d).slice(0, 240));
  h.assert(conf && conf.d.outcome === 'progress' && conf.d.chase === true, 'a confront that starts a chase logs interact_result progress with chase:true');
  // chase_end on today's path (the base tackle): how and by are null
  t0 = await P.mark(h);
  await h.ev(() => { const r = CHASE.active.runner.position, p = ENGINE.player.position; p.x = r.x + 0.5; p.z = r.z; CHASE.active.headStart = 0; __wf.run(0.2); });
  await h.step(300);
  ev = await P.all(h);
  let ce = P.of(ev, 'chase_end', t0)[0];
  h.log('chase_end today', JSON.stringify(ce && ce.d));
  h.assert(ce && ce.d.outcome === 'caught' && ce.d.how === null && ce.d.by === null, 'chase_end how/by are null on today\'s path');
  await T.finishDialogue(h); await T.choose(h, 0); await T.finishDialogue(h);
  await h.ev(() => { showOverlay(null); ENGINE.movementEnabled = true; });
  h.assert(inChase === 0 && inPursuit === 0, 'no away while KC outruns the pursuer, nor while TAC.state.pursuit is set');
  h.assert(free >= 1, 'the same walk logs away outside a chase (the check is live) ' + free);

  // chase_end how/by when a team sets c.how / c.by before onCaught (DESIGN §3.5)
  t0 = await P.mark(h);
  await h.ev(() => {
    const r = { position:{ x:60, y:0, z:60 }, rotation:{ y:0 }, userData:{} };
    const c = startChase({ runner:r, path:[[60, 60], [70, 60]], label:'TEST' });
    c.how = 'cutoff'; c.by = 'player'; stopChase(); c.onCaught(c);
    const c2 = startChase({ runner:r, path:[[60, 60], [70, 60]], label:'TEST2' });
    c2.how = 'uche'; c2.by = 'uche'; stopChase(); c2.onCaught(c2);
  });
  ev = await P.all(h);
  ce = P.of(ev, 'chase_end', t0);
  h.log('chase_end set', JSON.stringify(ce.map(e => e.d)));
  h.assert(ce.length === 2 && ce[0].d.how === 'cutoff' && ce[0].d.by === 'player' && ce[1].d.how === 'uche' && ce[1].d.by === 'uche', 'chase_end carries c.how / c.by when they are set before onCaught');

  // BACK TO THE TABLE (casework.js:437) is a refusal outside an interaction; v12_pt's own catches are not doubled
  t0 = await P.mark(h);
  await h.ev(() => { showOverlay(null); toast('BACK TO THE TABLE', 'Work the table, then see Uche again.', 600); toast('NOT YET', 'Uche and your phone first.', 600); });
  await h.step(200);
  ev = await P.all(h);
  const bl = P.of(ev, 'blocked', t0);
  h.log('blocked', JSON.stringify(bl.map(e => [e.d.big, e.d.small, e.d.rep])));
  h.assert(bl.filter(e => e.d.big === 'BACK TO THE TABLE').length === 1 && bl.filter(e => e.d.big === 'NOT YET').length === 1, 'BACK TO THE TABLE is logged as blocked, once; NOT YET once');
  // inside an interaction it is the interaction's toast, not a blocked event
  t0 = await P.mark(h);
  await h.ev(() => { const p = ENGINE.player.position; ENGINE.interactables.push({ mesh:{ position:{ x:p.x, y:0, z:p.z } }, label:'PT table', range:3, priority:99, onInteract:() => toast('BACK TO THE TABLE', 'test', 500) }); tryInteract(); });
  await h.step(600);
  ev = await P.all(h);
  h.assert(P.of(ev, 'blocked', t0).length === 0 && P.of(ev, 'interact_result', t0).some(e => e.d.label === 'PT table' && e.d.outcome === 'refused'), 'inside an interaction it is the press\'s refusal');
  await h.ev(() => { ENGINE.interactables = ENGINE.interactables.filter(i => i.label !== 'PT table'); });

  // ov_dwell when the operations table closes
  t0 = await P.mark(h);
  await h.ev(() => { showOverlay(null); V12.openOps(); });
  await h.step(1300);
  await h.ev(() => { if(typeof V12.closeOps === 'function') V12.closeOps(); else showOverlay(null); });
  await h.step(200);
  ev = await P.all(h);
  const ow = P.of(ev, 'ov_dwell', t0).filter(e => e.d.id === 'screen-ops');
  h.log('ov_dwell', JSON.stringify(ow.map(e => e.d)));
  h.assert(ow.length === 1 && ow[0].d.secs >= 1.1 && ow[0].d.secs <= 3 && 'obj' in ow[0].d, 'ov_dwell {id:screen-ops, secs, obj} when the table closes');
  h.assert(P.of(ev, 'ov_dwell', t0).every(e => e.d.id !== 'screen-pause' && e.d.id !== 'screen-settings'), 'menus are not dwell');

  // orient: touch only, after a 1.5 s debounce
  if(touch){
    t0 = await P.mark(h);
    await h.ev(() => { showOverlay(null); ENGINE.movementEnabled = true; });
    await h.page.setViewportSize({ width:844, height:390 });
    await h.step(900);
    ev = await P.all(h);
    h.assert(P.of(ev, 'orient', t0).length === 0, 'no orient before the 1.5 s debounce');
    await h.step(1000);
    ev = await P.all(h);
    const or = P.of(ev, 'orient', t0);
    h.log('orient', JSON.stringify(or.map(e => e.d)));
    h.assert(or.length === 1 && or[0].d.o === 'landscape' && or[0].d.w === 844 && or[0].d.h === 390, 'one orient {o:landscape, w:844, h:390} after 390x844 → 844x390');
    await h.page.setViewportSize({ width:390, height:844 });
    await h.step(1800);
  } else h.log('orient: SKIP (touch only; run with --touch 1)');
  h.assert(h.errors.length === 0, 'no page errors');
};
