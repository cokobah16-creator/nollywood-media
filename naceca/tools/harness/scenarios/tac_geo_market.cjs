// tac_geo_market: the dressed market's 61 colliders all get a vision tag (DESIGN §7.A, foundations §3.2),
// collision is unchanged, and the survey of KC's cone is re-run with the final rules.
// Owner: Team A.
const T = require('./tactics_lib.cjs');
module.exports = async h => {
  // the legacy market (the harness default / art-failed phones) first: its own table, nothing unknown
  await T.start(h, 'm2', { seed:5 });
  const leg = await h.ev(() => { const c = TAC.geo.classify(); return { c, n:ENGINE.obstacles.length, stalls:ENGINE.obstacles.filter(o => o.vis && o.vis.name === 'the stall').map(o => [o.vis.kind, o.vis.h, o.vis.box]) }; });
  h.log('legacy market', JSON.stringify({ c:leg.c, n:leg.n, stall:leg.stalls[0] }));
  h.assert(leg.c.table === 'market_legacy' && leg.c.unknown === 0, 'legacy market: its table, 0 unknown');
  h.assert(leg.stalls.length === 12 && leg.stalls.every(s => s[0] === 'low' && s[1] === 0.9 && Math.abs(s[2][1] - s[2][0] - 2.0) < 1e-6 && Math.abs(s[2][3] - s[2][2] - 0.8) < 1e-6),
    'legacy market: 12 stall counters 2.0 × 0.8 × 0.9');

  // the dressed market (what players with the art get)
  await T.deviceMarket(h, { seed:5 });
  await T.capture(h);
  const grid0 = await h.ev(() => {
    const b = ENGINE.bounds, out = [];
    for (let x = b.minX; x <= b.maxX; x += 0.25) for (let z = b.minZ; z <= b.maxZ; z += 0.25) out.push(blockedAt(x, z) ? 1 : 0);
    return { classified:ENGINE.obstacles.filter(o => o.vis).length, bits:out.join('') };
  });
  const r = await h.ev(() => {
    const t0 = performance.now(); const c = TAC.geo.classify(); const ms = performance.now() - t0;
    const O = ENGINE.obstacles;
    const pick = (cx, cz) => { const o = O.find(o => Math.abs((o.minX + o.maxX) / 2 - cx) < 0.03 && Math.abs((o.minZ + o.maxZ) / 2 - cz) < 0.03); return o ? o.vis : null; };
    const legacy = O.filter(o => o.vis && o.vis.src === 'legacy').map(o => ({ kind:o.vis.kind, w:+(o.vis.box[1] - o.vis.box[0]).toFixed(2), d:+(o.vis.box[3] - o.vis.box[2]).toFixed(2), h:o.vis.h }));
    const veh = { van:pick(0, 14), extraVan:O.filter(o => Math.abs(o.maxX - o.minX - 2.5) < 0.01 && Math.abs((o.minZ + o.maxZ) / 2 - 14) < 0.01).map(o => o.vis)[0],
      danfo:pick(-2.6, -20.5), keke:pick(2.55, -18.2), taxi:pick(-2.55, 20.6), sedan:pick(-2.95, -12.6) };
    const bld = O.filter(o => Math.abs(Math.abs((o.minX + o.maxX) / 2) - 18) < 0.01).map(o => o.vis);
    const person = O.filter(o => o.vis && o.vis.kind === 'person').map(o => [+((o.minX + o.maxX) / 2).toFixed(1), +((o.minZ + o.maxZ) / 2).toFixed(1)]);
    const posts = O.filter(o => Math.abs(o.maxX - o.minX - 0.3) < 0.01).map(o => o.vis.kind);
    const okadas = [pick(-13.4, -8.5), pick(-13.6, 8.2), pick(13.8, -20.8), pick(-5, -24)].map(v => v && v.kind);
    const counter = pick(7.6, 4);
    return { c, ms:+ms.toFixed(2), legacy, veh, bld:{ n:bld.length, ghost:bld.filter(v => v.kind === 'ghost').length, hs:[...new Set(bld.map(v => v.h))] }, person, posts, okadas,
      counter, total:O.length };
  });
  h.log('classify', JSON.stringify(r.c), r.ms + ' ms');
  h.assert(r.total === 61, '61 colliders');
  h.assert(r.c.table === 'market' && r.c.unknown === 0, '0 unknown on the dressed market (got ' + r.c.unknown + ': ' + JSON.stringify(r.c.unknownAt) + ')');
  h.assert(r.legacy.length === 12 && r.legacy.every(s => s.kind === 'ghost' && s.w === 0.9 && s.d === 2.0 && s.h === 1.0), '12 legacy stalls ghost, replaced by 0.9 × 2.0 × 1.0 counters: ' + JSON.stringify(r.legacy[0]));
  const vh = k => r.veh[k] && r.veh[k].kind === 'ghost' ? r.veh[k].h : null;
  h.log('vehicles', JSON.stringify(Object.keys(r.veh).map(k => [k, r.veh[k] && r.veh[k].kind, r.veh[k] && r.veh[k].h, r.veh[k] && r.veh[k].name])));
  h.assert(vh('van') === 1.8 && vh('extraVan') === 1.8 && Math.abs(vh('danfo') - 1.755) < 0.006 && Math.abs(vh('keke') - 1.575) < 0.006 && vh('taxi') === 1.26 && Math.abs(vh('sedan') - 1.32) < 0.006,
    'vehicles ghost through their blockers: 1.8 / 1.755 / 1.575 / 1.26 / 1.32');
  h.assert(r.bld.n === 20 && r.bld.ghost === 20 && r.bld.hs.every(x => x === 7 || x === 10.3), '20 buildings ghost through their blockers (7 / 10.3): ' + JSON.stringify(r.bld));
  h.assert(r.person.length === 2 && r.c.person === 2, '2 person boxes (the street people): ' + JSON.stringify(r.person));
  h.assert(r.posts.length === 8 && r.posts.every(k => k === 'skip') && r.okadas.every(k => k === 'skip'), '8 posts and 4 okadas skip');
  const sign = (r.c.extra || []).find(x => x.name === 'the sign');
  h.assert(sign && sign.kind === 'skip' && sign.y0 === 1.25 && sign.h === 1.95, "KC's sign slab is skip (transparent until the render check)");
  h.assert(r.counter && r.counter.kind === 'low' && r.counter.h === 1.1 && JSON.stringify(r.counter.box) === '[7.15,7.75,3.45,4.55]', "KC's counter: low 1.1, x 7.15–7.75, z 3.45–4.55");

  const grid1 = await h.ev(() => {
    const b = ENGINE.bounds, out = [];
    for (let x = b.minX; x <= b.maxX; x += 0.25) for (let z = b.minZ; z <= b.maxZ; z += 0.25) out.push(blockedAt(x, z) ? 1 : 0);
    return out.join('');
  });
  h.log('blockedAt grid cells', grid1.length, 'blocked', grid1.split('').filter(c => c === '1').length, '(classified before:', grid0.classified, ')');
  h.assert(grid0.classified === 0 && grid0.bits === grid1, 'the blockedAt grid at 0.25 m is identical before and after classification');

  // the survey of KC's cone with the final rules (one set of numbers): eye 1.5, facing −x, 100°, 12 m
  const sv = await h.ev(() => {
    const w = { x:8, z:4, eye:1.5, yaw:-Math.PI / 2, fov:100, range:12 }, out = { cells:0, watched:0, standSeen:0, crouchSeen:0, crouchHides:0, hiders:{} };
    for (let x = w.x - 12; x <= w.x + 12 + 1e-9; x += 0.5) for (let z = w.z - 12; z <= w.z + 12 + 1e-9; z += 0.5) {
      if (blockedAt(x, z, 0.25)) continue;
      const dx = x - w.x, dz = z - w.z, d = Math.hypot(dx, dz); if (d > w.range || d < 0.5) continue;
      if (x < ENGINE.bounds.minX || x > ENGINE.bounds.maxX || z < ENGINE.bounds.minZ || z > ENGINE.bounds.maxZ) continue;
      out.cells++;
      let a = Math.atan2(dx, dz) - w.yaw; while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI;
      if (Math.abs(a) * 180 / Math.PI > w.fov / 2) continue;
      out.watched++;
      const s = TAC.sight.los(w.x, w.z, w.eye, x, z, 1.45), c = TAC.sight.los(w.x, w.z, w.eye, x, z, 0.8);
      if (s.clear) out.standSeen++; if (c.clear) out.crouchSeen++;
      if (s.clear && !c.clear) { out.crouchHides++; out.hiders[c.name] = (out.hiders[c.name] || 0) + 1; }
    }
    return out;
  });
  h.log("KC's cone survey (0.5 m cells, final rules):", JSON.stringify(sv));
  h.assert(sv.watched > 100, 'the survey covers his cone');

  await h.ev(() => __wf.run(0.5));
  const ev = await T.events(h, 'geo_drift');
  h.log('geo_drift events', JSON.stringify(ev));
  h.assert(ev.length === 0, 'no geo_drift on the dressed market');

  // a market the table doesn't cover (one collider nobody classified): one geo_drift{reason:'table'}, and its scene is
  // the mission id, as for the legacy house (not the table's key), so drift groups by mission
  await T.start(h, 'm2', { seed:1 });
  await T.capture(h);
  const dr = await h.ev(() => { addObstacle(0.5, -25.5, 1.2, 1.2); __wf.run(0.5); return { m:TAC.mission(), legacy:!ENGINE._dress, unknown:TAC.geo.classify().unknown }; });
  const ev2 = (await T.events(h, 'geo_drift')).map(e => e[1]);
  h.log('legacy market with a stray collider:', JSON.stringify(dr), 'geo_drift', JSON.stringify(ev2));
  h.assert(dr.unknown === 1 && ev2.length === 1 && ev2[0].reason === 'table' && ev2[0].scene === 'm2' && ev2[0].unknown.length === 1,
    'an unmatched collider logs one geo_drift{reason:"table", scene:"m2"} (the mission id): ' + JSON.stringify(ev2));
  h.assert(!h.errors.length, 'no page errors');
};
