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
  const ref0 = await h.ev(() => { const p = ENGINE.player.position; p.x = 8; p.z = 6.3; ENGINE.movementEnabled = true; showOverlay(null);
    const r = { totals:V12._ptState.totals.refusals, o:V12._ptState.o ? V12._ptState.o.id : null }; tryInteract(); return r; });
  await h.step(500);
  h.assert(await h.ev(() => !!CHASE.active), 'the confront started the chase');
  const ref1 = await h.ev(() => V12._ptState.totals.refusals);
  const inChase = await walkAway('in a chase');
  // the confront that started it is progress with chase:true, not a refusal
  ev = await P.all(h);
  const conf = P.of(ev, 'interact_result').filter(e => e.d.label === 'Confront teen suspect').pop();
  h.log('confront', JSON.stringify(conf && conf.d).slice(0, 240));
  h.assert(conf && conf.d.outcome === 'progress' && conf.d.chase === true, 'a confront that starts a chase logs interact_result progress with chase:true');
  // D-4: v12_pt counted it as a refusal before the rewrite; the totals take it back
  h.assert(ref1 === ref0.totals, `the refusal totals don't count the confront (${ref0.totals} before, ${ref1} after)`);
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
  ev = await P.all(h);
  const runner = P.of(ev, 'obj_done').filter(e => e.d.id === 'o3_runner').pop();
  h.log('obj_done o3_runner', JSON.stringify(runner && runner.d), 'PT.o at the confront', ref0.o);
  if(ref0.o === 'o3_runner') h.assert(runner && runner.d.refusals === 0, 'obj_done o3_runner.refusals does not count the confront (' + (runner && runner.d.refusals) + ')');
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

  // D-4: only a chase that starts INSIDE the press is the press's doing, and only 'refused' is rewritten
  await h.step(1500);   // the market_runner dialogue's delayed evidence (v12_core.js:340) lands before these presses
  {
    const far = () => h.ev(() => { const r = { position:{ x:60, y:0, z:60 }, rotation:{ y:0 }, userData:{} }; startChase({ runner:r, path:[[60, 60], [70, 60]], label:'PT FAR' }); });
    const pressOn = (label, fn) => h.ev(([label, fn]) => {
      showOverlay(null); ENGINE.movementEnabled = true;
      const p = ENGINE.player.position, act = new Function(fn);
      ENGINE.interactables.push({ mesh:{ position:{ x:p.x, y:0, z:p.z } }, label, range:3, priority:99, onInteract:act });
      tryInteract();
    }, [label, fn]);
    const result = async (label, t0) => P.of(await P.all(h), 'interact_result', t0).filter(e => e.d.label === label).pop();
    const tidy = label => h.ev(label => { if(CHASE.active) stopChase(); ENGINE.interactables = ENGINE.interactables.filter(i => i.label !== label); }, label);
    // (a) a locked door, refused with a toast; an unrelated chase starts 100 ms later, far away
    t0 = await P.mark(h);
    const tot0 = await h.ev(() => V12._ptState.totals.refusals);
    await pressOn('PT locked door', "toast('LOCKED', 'The door is locked', 600);");
    await h.step(100); await far(); await h.step(600);
    const lk = await result('PT locked door', t0);
    h.log('locked door', JSON.stringify(lk && lk.d).slice(0, 200));
    h.assert(lk && lk.d.outcome === 'refused' && !lk.d.chase && (await h.ev(() => V12._ptState.totals.refusals)) === tot0 + 1, 'a refused press stays refused when an unrelated chase starts after it');
    await tidy('PT locked door');
    // (b) a press that starts a chase with nothing else to show (no toast, no progress): noop stays noop
    t0 = await P.mark(h);
    const sig0 = await h.ev(() => progressSig());
    await pressOn('PT silent runner', "const r = { position:{ x:60, y:0, z:60 }, rotation:{ y:0 }, userData:{} }; startChase({ runner:r, path:[[60, 60], [70, 60]], label:'PT SILENT' });");
    await h.step(600);
    const nz = await result('PT silent runner', t0), still = sig0 === await h.ev(() => progressSig());
    h.log('silent runner', JSON.stringify(nz && nz.d).slice(0, 200), 'progress signature unchanged:', still);
    h.assert(still && nz && nz.d.outcome === 'noop', 'noop is never rewritten (' + (nz && nz.d.outcome) + ', signature unchanged ' + still + ')');
    await tidy('PT silent runner');
    // (c) a refused-looking press (a toast) that starts its own chase: progress with chase:true, and not counted as a refusal
    t0 = await P.mark(h);
    const tot1 = await h.ev(() => V12._ptState.totals.refusals);
    await pressOn('PT bolting runner', "toast('HE IS RUNNING', 'pt', 600); const r = { position:{ x:60, y:0, z:60 }, rotation:{ y:0 }, userData:{} }; startChase({ runner:r, path:[[60, 60], [70, 60]], label:'PT BOLT' });");
    await h.step(600);
    const bo = await result('PT bolting runner', t0);
    h.assert(bo && bo.d.outcome === 'progress' && bo.d.chase === true && (await h.ev(() => V12._ptState.totals.refusals)) === tot1, 'a press that starts its own chase is progress, and the totals agree');
    await tidy('PT bolting runner');
  }

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

  // ov_dwell when the operations table closes. D-9: time with the page hidden doesn't count, and obj is the objective
  // current when the screen OPENED (it moves on while the table is open here)
  t0 = await P.mark(h);
  const obj0 = await h.ev(() => {
    if(!S.game.objectives.some(o => !o.done)) S.game.objectives.push({ id:'pt_obj_a', text:'PT A', done:false }, { id:'pt_obj_b', text:'PT B', done:false });
    showOverlay(null); V12.openOps(); return S.game.objectives.find(o => !o.done).id;
  });
  await h.step(700);
  const vis = st => h.ev(st => { if(st === 'hidden') Object.defineProperty(document, 'visibilityState', { configurable:true, get:() => 'hidden' }); else delete document.visibilityState; document.dispatchEvent(new Event('visibilitychange')); }, st);
  await vis('hidden'); await h.step(1500); await vis('visible');
  await h.ev(id => { const o = S.game.objectives.find(x => x.id === id); o.done = true; window.__ptObj = o; }, obj0);
  await h.step(600);
  await h.ev(() => { if(typeof V12.closeOps === 'function') V12.closeOps(); else showOverlay(null); });
  await h.step(200);
  await h.ev(() => { if(window.__ptObj){ window.__ptObj.done = false; window.__ptObj = null; } S.game.objectives = S.game.objectives.filter(o => !/^pt_obj_/.test(o.id)); });
  ev = await P.all(h);
  const ow = P.of(ev, 'ov_dwell', t0).filter(e => e.d.id === 'screen-ops');
  h.log('ov_dwell', JSON.stringify(ow.map(e => e.d)), 'opened on', obj0);
  h.assert(ow.length === 1 && ow[0].d.secs >= 1.1 && ow[0].d.secs <= 2.0, 'ov_dwell {id:screen-ops, secs} counts the 1.3 s on screen, not the 1.5 s hidden (' + (ow[0] && ow[0].d.secs) + ')');
  h.assert(ow[0].d.obj === obj0, 'ov_dwell.obj is the objective when the table opened (' + ow[0].d.obj + ', opened on ' + obj0 + ')');
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
  // D-1 on the page: two different events logged in one turn (the same millisecond) both reach the sheet's analysis
  const same = await h.ev(() => {
    V12.enc('m3_laptop', { outcome:'abandoned', pct:0, files:0, ledger:false, total:7, firstAt:null, armedAt:null, mg:null });
    V12.enc('m3_child', { choice:null, by:null, calm:false, outAt:null, gentle:false });
    const K = V12.ptKit, R = V12.ptReport, raw = K.events().filter(e => e.type === 'enc' && /^m3_(laptop|child)$/.test(e.d.enc));
    const kept = R.dedupe(R.normalize(K.events(), null, K.device())).filter(e => e.type === 'enc' && /^m3_(laptop|child)$/.test(e.d.enc));
    return { raw:raw.map(e => e.t), kept:kept.length };
  });
  h.log('same turn', JSON.stringify(same));
  h.assert(same.raw.length === 2 && same.kept === 2, 'two encounters logged in one turn both survive the dedupe (' + JSON.stringify(same) + ')');
  h.assert(h.errors.length === 0, 'no page errors');
};
