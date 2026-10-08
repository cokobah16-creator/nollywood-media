// Chase · route line bookkeeping (built at chase start, rebuilt ~10 Hz into one pre-sized geometry,
// disposed on stop and on scene switch), routing round the stalls, and line of sight:
// out of sight > 3 s → "last seen" for line / blip / guide / GAP meter, refreshed every 4 s, live
// again as soon as he's back in sight. Deterministic: the systems are stepped at 60 Hz by hand.
const lib = require('./wayfind_lib.cjs');

module.exports = async h => {
  await lib.start(h, 'm2', { completed: ['m0', 'm1'] });
  await lib.frozenClock(h);
  await lib.stepper(h);
  await lib.marketChase(h);
  let s = await h.ev(() => ({ line: !!CHASEFX.line, same: CHASEFX.line && CHASEFX.line.scene === ENGINE.scene, stats: Object.assign({}, CHASEFX.stats),
                              n: CHASEFX.line && CHASEFX.line.n, cap: CHASEFX.line && CHASEFX.line.core.pos.length, halo: CHASEFX.line && CHASEFX.line.halo.width, core: CHASEFX.line && CHASEFX.line.core.width }));
  h.log('start:', JSON.stringify(s));
  h.assert(s.line && s.same && s.stats.built === 1, 'route line built at chase start, in this scene');
  h.assert(s.cap === 64 * 2 * 3 && s.core === 0.3 && s.halo > s.core, 'one pre-sized ribbon (0.3 m core, wider halo)');

  // ~10 Hz rebuilds, reusing the same arrays
  const r = await h.ev(() => {
    const p0 = CHASEFX.line.core.pos, b0 = CHASEFX.stats.rebuilds;
    __wf.run(2.0);
    const L = CHASEFX.line, c = CHASEFX.line && CHASE.active;
    return { reb: CHASEFX.stats.rebuilds - b0, same: L && L.core.pos === p0, first: L && L.pts[0], last: L && L.pts[L.pts.length - 1],
             p: [ENGINE.player.position.x, ENGINE.player.position.z], k: CHASE.active && [CHASE.active.runner.position.x, CHASE.active.runner.position.z],
             y: L && [L.core.pos[1], L.halo.pos[1]], mode: L && L.mode };
  });
  h.log('2 s:', JSON.stringify(r));
  h.assert(r.reb >= 18 && r.reb <= 22, 'rebuilt ~10 Hz (' + r.reb + ' in 2 s)');
  h.assert(r.same, 'rebuilds reuse the same buffer');
  h.assert(Math.abs(r.first.x - r.p[0]) < 1e-6 && Math.abs(r.first.z - r.p[1]) < 1e-6, 'line starts at Kelechi');
  h.assert(Math.hypot(r.last.x - r.k[0], r.last.z - r.k[1]) < 0.6, 'line ends at KC (live)');
  h.assert(Math.abs(r.y[0] - 0.045) < 1e-6 && Math.abs(r.y[1] - 0.035) < 1e-6, 'flat on the ground (y ≈ 0.04)');

  // routing: KC on the far side of a stall → the line follows his lane path round it, never through a stall
  const route = await h.ev(() => {
    const c = { path: [[8, 4], [8, 7.4], [12.6, 7.4], [12.6, -2.4], [12.6, -7.5], [7.6, -7.5], [7.6, -12.5], [12.6, -12.5], [12.6, -20.5]] };
    const pts = WAY.routePoints(c, { x: 12.6, z: -7.0 }, { x: 9.2, z: -12.5 }, 6);
    const blocked = [];
    for (let i = 1; i < pts.length; i++) if (WAY.segBlocked(pts[i - 1].x, pts[i - 1].z, pts[i].x, pts[i].z, 0)) blocked.push(i);
    const direct = WAY.routePoints(c, { x: 7.6, z: -9 }, { x: 9.2, z: -12.5 }, 6);
    return { pts, blocked, direct };
  });
  h.log('route round the stall:', JSON.stringify(route.pts));
  h.assert(route.pts.length >= 4 && !route.blocked.length, 'route goes round the stall along the lanes');
  h.assert(route.direct.length === 2, 'clear way → direct segment: ' + JSON.stringify(route.direct));

  // real line-of-sight test: stalls block it, 30 m caps it
  const los = await h.ev(() => [WAY.losTest({ x: 12.6, z: -10 }, { x: 7.6, z: -10 }), WAY.losTest({ x: 12.6, z: -7.5 }, { x: 7.6, z: -7.5 }), WAY.losTest({ x: 0, z: 0 }, { x: 0, z: 31 })]);
  h.assert(los[0] === false && los[1] === true && los[2] === false, 'LOS: stall blocks, clear lane sees, > 30 m is out of sight ' + JSON.stringify(los));

  // out of sight: live for 3 s, then last seen
  await h.ev(() => { WAY._forceLos = true; __wf.run(0.15); WAY._forceLos = false; });   // start from "in sight"
  s = await h.ev(() => { __wf.run(2.85); return WAY.chase().mode; });
  h.assert(s === 'live', 'still live at 2.9 s out of sight');
  s = await h.ev(() => {
    __wf.run(0.25);
    const c = CHASE.active, ch = WAY.chase(), res = WAY.resolve(), L = CHASEFX.line, last = L.pts[L.pts.length - 1];
    return { mode: ch.mode, ls: c.fx.ls, pos: { x: ch.pos.x, z: ch.pos.z }, track: c.track, ping: ch.ping, res: { x: res.pos.x, z: res.pos.z }, last, lmode: L.mode,
             meter: document.querySelector('#meter-chase .pm-label').textContent, gpos: guideTarget().mesh.position, runner: { x: c.runner.position.x, z: c.runner.position.z } };
  });
  h.log('last seen:', JSON.stringify(s));
  h.assert(s.mode === 'lastseen' && s.ping === 1, 'last-seen mode after 3 s');
  const same = (a, b) => a && b && Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.z - b.z) < 1e-6;
  h.assert(same(s.pos, s.ls) && same(s.track, s.ls) && same(s.res, s.ls) && same(s.gpos, s.ls), 'WAY.chase, GAP meter (c.track), resolver and guide target all use the last-seen point');
  h.assert(same(s.last, s.ls) && s.lmode === 'lastseen', 'route line ends at the last-seen point');
  h.assert(/LAST SEEN/.test(s.meter), 'GAP meter says LAST SEEN: ' + s.meter);
  // the point holds for 4 s while he keeps running, then refreshes to where he is now (ping)
  const hold = await h.ev(() => { __wf.run(3.7); const c = CHASE.active; return { ls: c.fx.ls, runner: { x: c.runner.position.x, z: c.runner.position.z }, ping: c.fx.ping }; });
  h.assert(same(hold.ls, s.ls) && Math.hypot(hold.runner.x - s.ls.x, hold.runner.z - s.ls.z) > 3 && hold.ping === 1, 'last-seen point holds while he runs on');
  const ref = await h.ev(() => { __wf.run(0.4); const c = CHASE.active; return { ls: c.fx.ls, runner: { x: c.runner.position.x, z: c.runner.position.z }, ping: c.fx.ping }; });
  h.log('refresh:', JSON.stringify(ref));
  h.assert(ref.ping === 2 && !same(ref.ls, s.ls) && Math.hypot(ref.runner.x - ref.ls.x, ref.runner.z - ref.ls.z) < 1.9, 'refreshed to his current position after 4 s, with a ping');
  // back in sight → live at once
  s = await h.ev(() => { WAY._forceLos = true; __wf.run(0.12); const c = CHASE.active; return { mode: WAY.chase().mode, track: c.track, meter: document.querySelector('#meter-chase .pm-label').textContent }; });
  h.assert(s.mode === 'live' && s.track === null && /GAP|LOSING/.test(s.meter), 'live again as soon as he is seen ' + JSON.stringify(s));
  await h.ev(() => { WAY._forceLos = null; });

  // stop → removed and disposed
  s = await h.ev(() => { const d0 = CHASEFX.stats.disposed; stopChase(); return { line: CHASEFX.line, d: CHASEFX.stats.disposed - d0, ch: WAY.chase() }; });
  h.assert(s.line === null && s.d === 1 && s.ch === null, 'stopChase removes and disposes the line');

  // scene switch mid-chase → gone with the scene
  await lib.start(h, 'm2', { completed: ['m0', 'm1'] });
  await lib.frozenClock(h);
  await lib.marketChase(h);
  s = await h.ev(() => { const had = !!CHASEFX.line; newScene({}); return { had, line: CHASEFX.line, active: !!CHASE.active }; });
  h.assert(s.had && s.line === null && !s.active, 'scene switch disposes the line');
  h.assert(!h.errors.length, 'no page errors');
};
