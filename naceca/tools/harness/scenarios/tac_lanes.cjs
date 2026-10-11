// tac_lanes: KC's lanes and path clear every dressed-market collider, and the change leaves the chase as easy as
// today: a PAIRED gate (DESIGN §2.1 F-M8) — the same seed and start, the old graph and path against the new.
// Gate: median catch time new ≤ old + 0.5 s, mean bumps new ≤ old + 0.2, and KC never inside an obstacle on the new.
// Most of that matrix is caught before the paths differ, so two deep subsets that reach the moved lanes (the south
// leg, the dead end and back; the north nodes) are gated on their own, on paired differences.
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

  // ---- one pair: the same seed, start and pursuer on today's graph and path, then on the frozen ones ----
  // o.north: KC's authored path is cut at (12.6, 7.4), so his lane flight starts at the north end of the stalls
  // (the only way to reach the moved north nodes: on the full path he is caught in the south end first)
  const SPOTS = { s1:[7.6, -18.6], s2:[12.6, -18.6], dead:[12.6, -20.5], n1:[11.43, 11.4], n2:[11.43, 17.5] };
  const runPair = async (seed, from, react, o = {}) => {
    const pair = {};
    for (const v of ['old', 'new']) {
      await T.deviceMarket(h, { seed, wait:250, lanes:false });
      const r = await h.ev(({ v, from, seed, north, SPOTS }) => {
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
        const path = c.path.slice(0, 10).map(q => q.slice());
        if (north) c.path = [[8, 4], [8, 7.4], [12.6, 7.4]];
        let inside = 0; const hit = {}, seq = [];
        const off = TAC.onFrame(() => { if (CHASE.active !== c) return; const R = c.runner.position;
          if ((ENGINE.obstacles || []).some(o => R.x > o.minX && R.x < o.maxX && R.z > o.minZ && R.z < o.maxZ)) inside++;
          for (const k of Object.keys(SPOTS)) if (Math.hypot(R.x - SPOTS[k][0], R.z - SPOTS[k][1]) < 0.5) { hit[k] = true; if (seq[seq.length - 1] !== k) seq.push(k); }
          // the lane nodes he passes after the path ran out (doubling back = any node after the dead end)
          if (c.ended) MARKET_LANES.nodes.forEach((n, i) => { if (Math.hypot(R.x - n[0], R.z - n[1]) < 0.5 && seq[seq.length - 1] !== 'n' + i) seq.push('n' + i); });
        });
        window.__lanesRun = { off, get inside(){ return inside; }, hit, seq, path };
        return { ok:true };
      }, { v, from, seed, north:!!o.north, SPOTS });
      if (r.err) throw new Error(r.err);
      const p = await T.pursue(h, { strategy:'follow', delay:react, v:o.v || 4.42, maxT:MAXT, seed:seed * 1000 + 29 });
      const ex = await h.ev(() => { const L = window.__lanesRun; L.off(); const d = L.seq.indexOf('dead');
        const deadNode = 'n' + MARKET_LANES.nodes.findIndex(n => Math.abs(n[0] - 12.6) < 0.01 && Math.abs(n[1] + 20.5) < 0.01);
        return { inside:L.inside, p7:L.path[7], hit:L.hit, back:d >= 0 && L.seq.slice(d + 1).some(k => /^n\d/.test(k) && k !== deadNode) }; });
      pair[v] = { t:p.caught ? p.t : MAXT, caught:p.caught, escaped:p.escaped, bumps:p.bumps, inside:ex.inside, p7:ex.p7, hit:ex.hit, back:ex.back };
    }
    return pair;
  };
  const dsum = rs => { const d = rs.map(r => +(r.new.t - r.old.t).toFixed(2));
    return { n:rs.length, dMed:+median(d).toFixed(2), dMean:+mean(d).toFixed(2), faster:d.filter(x => x < -0.05).length, slower:d.filter(x => x > 0.05).length, worst:+Math.max(...d).toFixed(2),
      dBumps:+mean(rs.map(r => r.new.bumps - r.old.bumps)).toFixed(2), caughtOld:rs.filter(r => r.old.caught).length, caughtNew:rs.filter(r => r.new.caught).length,
      insideOld:rs.reduce((a, r) => a + r.old.inside, 0), insideNew:rs.reduce((a, r) => a + r.new.inside, 0) }; };
  const table = (title, rows) => {
    h.log(title);
    h.log('seed start  react   v  |  old t   bumps in |  new t   bumps in |  Δt');
    for (const r of rows) h.log(`${String(r.seed).padStart(4)} ${r.start.padEnd(6)} ${String(r.react).padStart(4)}s ${String(r.v).padStart(4)} | ${r.old.t.toFixed(2).padStart(6)} ${String(r.old.bumps).padStart(4)} ${String(r.old.inside).padStart(3)} | ${r.new.t.toFixed(2).padStart(6)} ${String(r.new.bumps).padStart(4)} ${String(r.new.inside).padStart(3)} | ${(r.new.t - r.old.t >= 0 ? '+' : '') + (r.new.t - r.old.t).toFixed(2)}`);
  };

  // ---- the paired matrix ----
  const rows = [];
  for (const seed of SEEDS) for (const [sname, from] of STARTS) for (const react of REACT) {
    const pair = await runPair(seed, from, react);
    rows.push({ seed, start:sname, react, v:4.42, old:pair.old, new:pair.new });
  }
  // the old run really used the old path and the new run the new one
  h.assert(rows.every(r => r.old.p7[0] === 12.6 && r.old.p7[1] === -12.5 && r.new.p7[0] === 7.6 && r.new.p7[1] === -18.6), 'each pair ran today\'s path against the frozen one');
  table('the matrix: 4.42 m/s pursuer, reaction 0 and 4 s', rows);
  // medians of whole cells are bimodal (a quick catch or a long chase), so each cell also reports the PAIRED difference
  const cells = [['all', rows]].concat(REACT.map(x => ['react ' + x + ' s', rows.filter(r => r.react === x)]), STARTS.map(s => ['start ' + s[0], rows.filter(r => r.start === s[0])]));
  const summ = {};
  for (const [name, rs] of cells) {
    const s = { n:rs.length, medOld:+median(rs.map(r => r.old.t)).toFixed(2), medNew:+median(rs.map(r => r.new.t)).toFixed(2),
      bumpsOld:+mean(rs.map(r => r.old.bumps)).toFixed(2), bumpsNew:+mean(rs.map(r => r.new.bumps)).toFixed(2),
      caughtOld:rs.filter(r => r.old.caught).length, caughtNew:rs.filter(r => r.new.caught).length, insideOld:rs.reduce((a, r) => a + r.old.inside, 0), insideNew:rs.reduce((a, r) => a + r.new.inside, 0),
      paired:dsum(rs) };
    summ[name] = s;
    h.log(name.padEnd(14), JSON.stringify(s));
  }
  const all = summ.all;
  const reached = rows.filter(r => r.new.hit.s1 || r.new.hit.s2).length;
  h.log('the matrix: new runs that reach the changed south leg', reached, 'of', rows.length, '(most are caught before z −12.5, where the paths first differ)');
  h.assert(all.insideNew === 0, 'KC is never inside an obstacle on the new lanes (old: ' + all.insideOld + ' frames)');
  h.assert(all.medNew <= all.medOld + 0.5, `median catch time new ${all.medNew} s ≤ old ${all.medOld} s + 0.5`);
  h.assert(all.bumpsNew <= all.bumpsOld + 0.2, `mean bumps new ${all.bumpsNew} ≤ old ${all.bumpsOld} + 0.2`);
  h.assert(all.caughtNew >= all.caughtOld, `no fewer catches on the new lanes (${all.caughtNew} vs ${all.caughtOld} of ${all.n})`);
  h.assert(all.paired.dMed <= 0.5, `the paired difference: median Δt ${all.paired.dMed} s ≤ +0.5`);

  // ---- the deep subsets: chases that reach the lanes the change moved, gated on their own ----
  // south: a late start (7 s) or a touch jog (3.0 m/s) carries KC down the new south leg to the dead end and back
  const deepS = [];
  for (const seed of SEEDS) for (const [sname, from] of STARTS.filter(s => s[0] === 'front' || s[0] === 'south')) for (const [react, v] of [[7, 4.42], [4, 3.0]]) {
    const pair = await runPair(seed, from, react, { v });
    deepS.push({ seed, start:sname, react, v, old:pair.old, new:pair.new });
  }
  table('deep, south: reaction 7 s at 4.42 m/s, or 4 s at a 3.0 m/s touch jog', deepS);
  const ds = dsum(deepS), covS = { leg:deepS.filter(r => r.new.hit.s1 && r.new.hit.s2).length, dead:deepS.filter(r => r.new.hit.dead).length, back:deepS.filter(r => r.new.back).length };
  h.log('deep south  ', JSON.stringify(ds), 'coverage', JSON.stringify(covS));
  h.assert(covS.leg >= 0.9 * deepS.length && covS.dead >= 0.9 * deepS.length, `deep south: the new runs reach the moved south leg and the dead end (${covS.leg} and ${covS.dead} of ${deepS.length})`);
  h.assert(covS.back >= 0.25 * deepS.length, `deep south: some double back out of the dead end (${covS.back} of ${deepS.length})`);
  h.assert(ds.insideNew === 0 && ds.caughtNew >= ds.caughtOld && ds.dMed <= 0.5 && ds.dBumps <= 0.2,
    `deep south, paired: KC never inside an obstacle, no fewer catches (${ds.caughtNew} vs ${ds.caughtOld}), median Δt ${ds.dMed} s ≤ +0.5, mean Δbumps ${ds.dBumps} ≤ +0.2`);
  // north: his lane flight starting at the north end of the stalls goes through the moved north nodes
  const deepN = [];
  for (const seed of SEEDS) for (const [sname, from] of STARTS.filter(s => s[0] === 'road' || s[0] === 'south')) {
    const pair = await runPair(seed, from, 2, { north:true });
    deepN.push({ seed, start:sname, react:2, v:4.42, old:pair.old, new:pair.new });
  }
  table('deep, north: the path cut at (12.6, 7.4), reaction 2 s at 4.42 m/s', deepN);
  const dn = dsum(deepN), covN = { n1:deepN.filter(r => r.new.hit.n1).length, n2:deepN.filter(r => r.new.hit.n2).length };
  h.log('deep north  ', JSON.stringify(dn), 'coverage', JSON.stringify(covN));
  h.assert(covN.n1 === deepN.length && covN.n2 === deepN.length, `deep north: every new run passes the moved nodes (11.43, 11.4) and (11.43, 17.5) (${covN.n1}, ${covN.n2} of ${deepN.length})`);
  h.assert(dn.insideNew === 0 && dn.caughtNew >= dn.caughtOld && dn.dMed <= 0.5 && dn.dBumps <= 0.2,
    `deep north, paired: KC never inside an obstacle (old ${dn.insideOld} frames), no fewer catches (${dn.caughtNew} vs ${dn.caughtOld}), median Δt ${dn.dMed} s ≤ +0.5, mean Δbumps ${dn.dBumps} ≤ +0.2`);
  // leave the page as players get it
  await h.ev(() => { TAC.lanes.installed = false; TAC.lanes.install(); });
  h.assert(!h.errors.length, 'no page errors');
};
