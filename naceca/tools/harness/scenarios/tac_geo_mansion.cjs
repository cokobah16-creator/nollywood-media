// tac_geo_mansion: the art-pass house's 39 colliders match the height table; the legacy (art-failed) house has no
// vision data, so watchers freeze there and one geo_drift{reason:'legacy'} is logged (DESIGN §2.1 F-M7).
// Owner: Team A.
const T = require('./tactics_lib.cjs');
module.exports = async h => {
  await T.deviceMansion(h, { seed:3 });
  await T.capture(h);
  const r = await h.ev(() => {
    const c = TAC.geo.classify(), O = ENGINE.obstacles;
    const pick = (cx, cz) => { const o = O.find(o => Math.abs((o.minX + o.maxX) / 2 - cx) < 0.03 && Math.abs((o.minZ + o.maxZ) / 2 - cz) < 0.03); return o ? o.vis : null; };
    const walls = [[-5.12, -0.25], [5.12, -0.25], [-2.97, -4.62], [2.97, -4.62], [-3.1, 4.12], [3.1, 4.12]].map(p => pick(p[0], p[1]));
    const L = (ax, az, ah, bx, bz, bh) => TAC.sight.los(ax, az, ah, bx, bz, bh);
    return { c, walls:walls.map(v => v && [v.kind, v.h]), sofa:pick(-3.92, -0.4), arm:pick(-1.05, -2.35), cash:pick(-2.35, -0.4), obi:pick(4.12, -1.0),
      tableHits:O.filter(o => o.vis && o.vis.src === 'table').length,
      door:L(4.12, -1, 1.6, 0, 3.6, 1.45),
      wall:L(4.12, -1, 1.6, 0, 6.0, 1.45),            // the porch, through the front wall
      armchairCrouch:L(4.12, -1, 1.6, -1.85, -2.45, 0.8), armchairStand:L(4.12, -1, 1.6, -1.85, -2.45, 1.45),
      ready:TAC.geo.ready(), full:TAC.geo.full };
  });
  h.log('mansion', JSON.stringify(r.c));
  h.log('walls', JSON.stringify(r.walls), 'sofa', r.sofa.h, 'armchair', r.arm.h, 'cash', r.cash.h, 'obi', r.obi.kind);
  h.log('los door', JSON.stringify(r.door), 'porch', JSON.stringify(r.wall), 'armchair crouched', JSON.stringify(r.armchairCrouch), 'standing', JSON.stringify(r.armchairStand));
  h.assert(r.full === true && r.ready === true, 'TAC.geo.full; the art-pass house is ready()');
  h.assert(r.c.table === 'mansion' && r.tableHits === 39 && r.c.matched === 39 && r.c.unknown === 0, '39/39 matched by the mansion table');
  h.assert(r.walls.every(w => w && w[0] === 'tall' && w[1] === 3.3), 'walls are tall (3.3 m)');
  h.assert(r.sofa.kind === 'low' && r.sofa.h === 0.93 && r.arm.kind === 'low' && r.arm.h === 0.96 && r.cash.kind === 'low' && r.cash.h === 0.57, 'sofa 0.93, armchair 0.96, cash table 0.57');
  h.assert(r.obi.kind === 'person', "Obi's box is person");
  h.assert(r.door.clear, 'Obi (4.12, −1, eye 1.6) sees the door (0, 3.6, 1.45): the eye inside his own box is skipped');
  h.assert(!r.wall.clear && r.wall.by === 'tall', 'the front wall hides the porch');
  h.assert(!r.armchairCrouch.clear && r.armchairCrouch.by === 'low' && r.armchairCrouch.name === 'the armchair' && r.armchairStand.clear, 'crouched west of the armchair is hidden; standing there is not');
  await h.ev(() => __wf.run(0.5));
  let ev = await T.events(h, 'geo_drift');
  h.assert(ev.length === 0, 'no geo_drift in the art-pass house: ' + JSON.stringify(ev));
  // TAC.geo.add: a collider with its vision tag (what C uses for anything new it places)
  const add = await h.ev(() => {
    const before = TAC.sight.los(4.12, -1, 1.6, -3.74, 2.31, 0.8);
    const ob = TAC.geo.add(-3, 2, 1.0, 0.4, { h:1.0, name:'the crate' });
    const c = TAC.geo.classify(), after = TAC.sight.los(4.12, -1, 1.6, -3.74, 2.31, 0.8);
    const tall = TAC.geo.add(3, 2, 0.4, 0.4, { h:2.2, name:'the screen' });
    return { vis:ob && ob.vis, blocked:blockedAt(-3, 2), c:{ matched:c.matched, total:c.total, unknown:c.unknown }, before, after, tall:tall.vis.kind };
  });
  h.log('geo.add', JSON.stringify(add));
  h.assert(add.vis && add.vis.kind === 'low' && add.vis.h === 1.0 && add.vis.y0 === 0 && add.vis.name === 'the crate' && add.blocked, 'TAC.geo.add: an obstacle (collision) with an explicit vision tag');
  h.assert(add.c.matched === 40 && add.c.total === 40 && add.c.unknown === 0, 'an added box counts as matched, never unknown');
  h.assert(add.before.clear && !add.after.clear && add.after.by === 'low' && add.after.name === 'the crate' && add.tall === 'tall', 'the eye sees it at once (h ≥ 1.7 is tall)');

  // the legacy house (the art failed): no vision data → ready() false, watchers freeze, one geo_drift{legacy}
  await T.restoreArt(h);
  await T.start(h, 'm3', { seed:3 });
  await T.capture(h);
  const l = await h.ev(() => {
    const P = ENGINE.player.position, obi = { position:{ x:P.x, y:0, z:P.z - 5 }, rotation:{ y:0 }, visible:true };
    obi.rotation.y = 0;   // facing +z: straight at the player
    const w = TAC.sight.watch({ id:'test', enc:'test', mesh:obi, eyeH:1.6, range:{ lit:9, dark:4.5 } });
    __wf.run(4);
    const out = { ready:TAC.geo.ready(), v8:!!ENGINE._mansion, susp:w.state.susp, active:w.state.active, eye:!!document.querySelector('#eye-ind.show'), top:TAC.sight.top() };
    w.unwatch();
    return out;
  });
  ev = await T.events(h, 'geo_drift');
  h.log('legacy house', JSON.stringify(l), 'geo_drift', JSON.stringify(ev));
  h.assert(l.v8 === false && l.ready === false, 'the legacy house is not ready()');
  h.assert(ev.length === 1 && ev[0][1].reason === 'legacy' && ev[0][1].scene === 'm3', 'one geo_drift{reason:"legacy"} for the build');
  h.assert(l.susp === 0 && l.active === false && !l.eye && l.top === null, 'a watcher registered there gains nothing and shows no eye');
  await h.ev(() => __wf.run(2));
  ev = await T.events(h, 'geo_drift');
  h.assert(ev.length === 1, 'still one geo_drift after more ticks');
  h.assert(!h.errors.length, 'no page errors');
};
