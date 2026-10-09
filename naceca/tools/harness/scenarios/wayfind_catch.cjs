// Chase · a joystick player can catch KC and Ifeanyi. The simulated player runs at 0.85 × the
// effective touch sprint (people_art_pass.js: full sprint once the stick is past half-way, so at
// 85 % deflection that is 5.2 m/s → 4.42 m/s here, the pessimistic case), steers by the route line
// (WAY.routePoints) like a player following it would, and is blocked by the stalls (blockedAt).
// The market crowd is removed for the first KC run (no lucky stumbles); a second run keeps it.
// Also checks M6's "No hesitation" side goal survives the longer chase.
const lib = require('./wayfind_lib.cjs');

// in-page: touch sprint factor as people_art_pass.js computes it, and the pursuit loop
const installSim = h => h.ev(() => {
  window.__wfTouchK = (clip, analog) => clip === 'sprint' ? Math.min(1, Math.max(0.55, analog / 0.5)) : Math.max(0.55, analog);
  window.__wfPursue = (v, maxT) => {
    const c = CHASE.active, P = ENGINE.player.position, b = ENGINE.bounds;
    let t = 0, minGap = 1e9;
    const n = __wf.run(maxT, (i, tt) => {
      if (!CHASE.active) return true;
      t = tt;
      const R = c.runner.position, pts = WAY.routePoints(c, P, R, c.seg);
      let aim = pts[1]; if (pts.length > 2 && Math.hypot(aim.x - P.x, aim.z - P.z) < 0.3) aim = pts[2];
      const dx = aim.x - P.x, dz = aim.z - P.z, d = Math.hypot(dx, dz) || 1;
      const step = v * (ENGINE.speedMul || 1) * __wf.dt;
      const nx = P.x + dx / d * step, nz = P.z + dz / d * step;
      if (!blockedAt(nx, P.z) && nx > b.minX && nx < b.maxX) P.x = nx;
      if (!blockedAt(P.x, nz) && nz > b.minZ && nz < b.maxZ) P.z = nz;
      minGap = Math.min(minGap, Math.hypot(R.x - P.x, R.z - P.z));
    });
    return { caught: !CHASE.active && c.runner.visible !== false, active: !!CHASE.active, t: n / 60, minGap, oor: c.oorT, ended: c.ended };
  };
});

module.exports = async h => {
  const sprint = 5.2;
  // ---- KC, no crowd ----
  await lib.start(h, 'm2', { completed: ['m0', 'm1'] });
  await lib.frozenClock(h);
  await lib.stepper(h);
  await installSim(h);
  const k = await h.ev(() => __wfTouchK('sprint', 0.85));
  const v = 0.85 * sprint * k;
  h.log(`touch sprint at 85% deflection: ×${k} → ${(sprint * k).toFixed(2)} m/s; simulated player ${v.toFixed(2)} m/s`);
  h.assert(k === 1, 'full sprint past half deflection');
  await lib.marketChase(h);
  let r = await h.ev(v => { CHASE.active.crowd = []; return Object.assign({ speed: CHASE.active.speed }, __wfPursue(v, 60)); }, v);
  h.log('KC (no crowd):', JSON.stringify(r));
  h.assert(r.caught, 'joystick player catches KC with no help from the crowd');
  h.assert(r.t < 30, 'within 30 s: ' + r.t.toFixed(1) + ' s');
  h.assert(r.t > 1.2, 'still a chase, not a tackle the moment he moves (his opening dash): ' + r.t.toFixed(1) + ' s');
  const dlg = await h.ev(() => !!document.querySelector('#screen-dialogue.show'));
  h.assert(dlg, "the caught scene plays (onCaught)");
  // ---- KC with the market crowd (stumbles and bumps both ways) ----
  await lib.start(h, 'm2', { completed: ['m0', 'm1'] });
  await lib.frozenClock(h);
  await lib.stepper(h);
  await installSim(h);
  await lib.marketChase(h);
  r = await h.ev(v => __wfPursue(v, 60), v);
  h.log('KC (with crowd):', JSON.stringify(r));
  h.assert(r.caught && r.t < 45, 'joystick player catches KC through the crowd');

  // ---- Ifeanyi ----
  await lib.start(h, 'm6', { completed: ['m0', 'm1', 'm2', 'm3', 'm4', 'm5'] });
  await lib.frozenClock(h);
  await lib.stepper(h);
  await installSim(h);
  await lib.asabaChase(h);
  const st = await h.ev(() => ({ act: !!CHASE.active, speed: CHASE.active && CHASE.active.speed, cd: CHASE.active && CHASE.active.catchDist, gap: CHASE.active && Math.hypot(CHASE.active.runner.position.x - ENGINE.player.position.x, CHASE.active.runner.position.z - ENGINE.player.position.z) }));
  h.log('Ifeanyi start:', JSON.stringify(st));
  h.assert(st.act && Math.abs(st.speed - 4.1) < 1e-9 && st.cd === 1.9, 'Ifeanyi: 4.1 m/s, catch at 1.9 m');
  r = await h.ev(v => { ENGINE._asabaRunner.update = () => {}; return __wfPursue(v, 60); }, v);
  const m6 = await h.ev(() => ({ choice: S.game._asabaChoice, side: (S.game._sq && S.game._sq.st) || {}, commit: SIDE.commitT, t0: SIDE.t0 }));
  h.log('Ifeanyi:', JSON.stringify(r), JSON.stringify(m6));
  h.assert(r.caught && m6.choice === 'chase', 'joystick player catches Ifeanyi (choice = chase)');
  h.assert(r.t < 30, 'within 30 s: ' + r.t.toFixed(1) + ' s');
  h.assert(m6.side.m6_decide === 'done', 'M6 "No hesitation" still completes on a longer chase');
  h.assert(!h.errors.length, 'no page errors');
};
