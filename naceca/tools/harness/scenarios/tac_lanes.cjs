// tac_lanes: KC's lanes and path clear every dressed-market collider, and the change leaves the chase as easy as
// today: a PAIRED gate (DESIGN §2.1 F-M8) — the same seed and start, the old graph and path against the new.
// Gate: median catch time new ≤ old + 0.5 s, mean bumps new ≤ old + 0.2, and KC never inside an obstacle on the new.
// Owner: Team A. The lanes don't merge unless this passes.
const T = require('./tactics_lib.cjs');
const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const STARTS = [['front', [5.8, 4.6]], ['road', [6.2, 2.6]], ['south', [8.0, 1.6]], ['behind', [9.0, 3.2]]];
const REACT = [0, 4];
const MAXT = 60;
const median = a => { const s = a.slice().sort((x, y) => x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
const mean = a => a.reduce((x, y) => x + y, 0) / (a.length || 1);

module.exports = async h => {
  // ---- the static check on the dressed market ----
  await T.deviceMarket(h, { seed:1 });
  const ck = await h.ev(() => {
    const n = TAC.lanes.check(MARKET_LANES, TAC.lanes.KC_PATH), o = TAC.lanes.check(TAC.lanes._old, TAC.lanes._oldPath);
    return { n, o, installed:TAC.lanes.installed, nodes:MARKET_LANES.nodes.length, edges:MARKET_LANES.edges.length };
  });
  const n = ck.n;
  h.log('new:', JSON.stringify({ crossing:n.crossing.length, tight:n.tight, nodesInside:n.nodesInside, legsCrossing:n.legsCrossing.length, legsTight:n.legsTight, nodesInBox:n.nodesInBox, connected:n.connected, minClear:n.minClear, deadClear:n.deadClear, pathLen:n.pathLen }));
  h.log('old:', JSON.stringify({ crossing:ck.o.crossing.length + '/' + ck.o.edges, nodesInside:ck.o.nodesInside.length, legsCrossing:ck.o.legsCrossing.length, pathLen:ck.o.pathLen }));
  h.assert(ck.installed && ck.nodes === 18 && ck.edges === 23, 'tac_lanes installed the frozen graph at load (18 nodes, 23 edges)');
  h.assert(n.crossing.length === 0 && n.legsCrossing.length === 0, '0 lane edges and 0 path legs cross a collider');
  h.assert(n.nodesInside.length === 0, '0 nodes inside a collider');
  h.assert(n.tight.length === 0 && n.legsTight.length === 0 && n.minClear >= 0.35 && (n.deadClear == null || n.deadClear >= 0.15), 'clearance ≥ 0.35 m (the dead end ≥ 0.15 m)');
  h.assert(n.connected, 'the graph is connected');
  h.assert(n.nodesInBox, 'every node inside x 7.6–12.6, z −20.5–17.5');
  const P = await h.ev(() => TAC.lanes.KC_PATH);
  h.assert(Math.abs(n.pathLen - 45.9) <= 0.1 && P[P.length - 1][0] === 12.6 && P[P.length - 1][1] === -20.5, 'the path is 45.9 ± 0.1 m and ends at (12.6, −20.5)');
  h.assert(ck.o.crossing.length > 0, 'the check sees the old crossings (sanity: ' + ck.o.crossing.length + ')');

  // ---- the paired matrix ----
  const rows = [];
  for (const seed of SEEDS) for (const [sname, from] of STARTS) for (const react of REACT) {
    const pair = {};
    for (const v of ['old', 'new']) {
      await T.deviceMarket(h, { seed, wait:250, lanes:false });
      const r = await h.ev(({ v, from, seed, react, maxT }) => {
        // the layout under test: today's graph and path, or the frozen new ones
        const L = TAC.lanes;
        L.installed = false;
        if (v === 'old') { MARKET_LANES.nodes.splice(0, MARKET_LANES.nodes.length, ...L._old.nodes.map(p => p.slice())); MARKET_LANES.edges.splice(0, MARKET_LANES.edges.length, ...L._old.edges.map(p => p.slice())); }
        else L.install();
        window.__tacSeed(seed * 1000 + 17);      // the same random stream for both layouts from the bolt on
        S.game._marketTunde = true; S.game._marketScanned = true;
        completeObjective('o1_tunde'); completeObjective('o2_scan');
        const P = ENGINE.player.position; P.x = from[0]; P.z = from[1];
        const it = ENGINE.interactables.find(i => i.label === 'Confront teen suspect'); it.onInteract();
        const c = CHASE.active; if (!c) return { err:'no chase' };
        let inside = 0;
        const off = TAC.onFrame(() => { const R = c.runner.position; if (CHASE.active === c && (ENGINE.obstacles || []).some(o => R.x > o.minX && R.x < o.maxX && R.z > o.minZ && R.z < o.maxZ)) inside++; });
        window.__lanesRun = { off, get inside(){ return inside; }, path:c.path.slice(0, 10).map(q => q.slice()) };
        return { ok:true };
      }, { v, from, seed, react, maxT:MAXT });
      if (r.err) throw new Error(r.err);
      const p = await T.pursue(h, { strategy:'follow', delay:react, maxT:MAXT, seed:seed * 1000 + 29 });
      const ex = await h.ev(() => { const L = window.__lanesRun; L.off(); return { inside:L.inside, p7:L.path[7] }; });
      pair[v] = { t:p.caught ? p.t : MAXT, caught:p.caught, bumps:p.bumps, inside:ex.inside, p7:ex.p7 };
    }
    rows.push({ seed, start:sname, react, old:pair.old, new:pair.new });
  }
  // the old run really used the old path and the new run the new one
  h.assert(rows.every(r => r.old.p7[0] === 12.6 && r.old.p7[1] === -12.5 && r.new.p7[0] === 7.6 && r.new.p7[1] === -18.6), 'each pair ran today\'s path against the frozen one');
  // the table
  h.log('seed start  react |  old t   bumps in |  new t   bumps in');
  for (const r of rows) h.log(`${String(r.seed).padStart(4)} ${r.start.padEnd(6)} ${String(r.react).padStart(4)}s | ${r.old.t.toFixed(2).padStart(6)} ${String(r.old.bumps).padStart(4)} ${String(r.old.inside).padStart(3)} | ${r.new.t.toFixed(2).padStart(6)} ${String(r.new.bumps).padStart(4)} ${String(r.new.inside).padStart(3)}`);
  const cells = [['all', rows]].concat(REACT.map(x => ['react ' + x + ' s', rows.filter(r => r.react === x)]), STARTS.map(s => ['start ' + s[0], rows.filter(r => r.start === s[0])]));
  const summ = {};
  for (const [name, rs] of cells) {
    const s = { n:rs.length, medOld:+median(rs.map(r => r.old.t)).toFixed(2), medNew:+median(rs.map(r => r.new.t)).toFixed(2),
      bumpsOld:+mean(rs.map(r => r.old.bumps)).toFixed(2), bumpsNew:+mean(rs.map(r => r.new.bumps)).toFixed(2),
      caughtOld:rs.filter(r => r.old.caught).length, caughtNew:rs.filter(r => r.new.caught).length, insideOld:rs.reduce((a, r) => a + r.old.inside, 0), insideNew:rs.reduce((a, r) => a + r.new.inside, 0) };
    summ[name] = s;
    h.log(name.padEnd(14), JSON.stringify(s));
  }
  const all = summ.all;
  h.assert(all.insideNew === 0, 'KC is never inside an obstacle on the new lanes (old: ' + all.insideOld + ' frames)');
  h.assert(all.medNew <= all.medOld + 0.5, `median catch time new ${all.medNew} s ≤ old ${all.medOld} s + 0.5`);
  h.assert(all.bumpsNew <= all.bumpsOld + 0.2, `mean bumps new ${all.bumpsNew} ≤ old ${all.bumpsOld} + 0.2`);
  h.assert(all.caughtNew >= all.caughtOld, `no fewer catches on the new lanes (${all.caughtNew} vs ${all.caughtOld} of ${all.n})`);
  // leave the page as players get it
  await h.ev(() => { TAC.lanes.installed = false; TAC.lanes.install(); });
  h.assert(!h.errors.length, 'no page errors');
};
