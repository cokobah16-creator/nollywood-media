// tac_m2_matrix · THE BALANCE GATE (DESIGN M-M5, §7.B; market.md §5.1): every chase cell of the market layer against TODAY
// on the same seeds. TODAY = TAC.m2.cfg.off (the router and every chase hook pass straight through: today's opening, no
// CUT HIM OFF, no Uche); the lanes and KC's path are Team A's in both (installed by T.deviceMarket).
// Seeds: M2_SEEDS (default 20); each seed builds its own market (its crowd), and every run reseeds Math.random inside the
// evaluate that confronts and chases (__tacSeed), so a cell and its TODAY share the same random stream.
// Pursuer: the scout's (T.pursue) at 4.42 m/s (wayfind_catch's pessimistic touch sprint), steering by the route line.
// Gate, for every cell: catch rate ≥ today; median time ≤ today + 0.5 s; mean bumps ≤ today + 0.2.
// Plus: the gate post with a player who never chases → caught by Uche on every seed.
// En route (DESIGN M-M4, the moving-Uche rule): Uche posted to the corner or the gate, the chase starting 3, 6, 8, 9, 10, 12
// or 15 s into his jog (the scan pauses the world and the walk from the van to KC is 5-10 s of play, so +6 to +12 s is the
// common case). At +8 to +10 s his jog crosses KC's route: the rule must show (a grab, or a veer from a moving Uche).
// The range-bolt cells (B-MIN-1): in today's game KC never bolts on his own, and the confront only works within 2.5 m, so
// today's real sequence from the bolt spot is "walk in to arm's length, then today's opening". Their TODAY is today's opening
// from FRONT (today:open-seen) plus the walk-in at the pursuer's 4.42 m/s; today's opening triggered at the bolt spot (a
// sequence today's game can't produce) is printed beside it for reference.
const M = require('./tac_m2_lib.cjs');

const FRONT = [5.8, 4.6];
const STRAT = {
  f13:{ strategy:'follow', delay:1.3, at:FRONT },
  f25:{ strategy:'follow', delay:2.5, at:FRONT },
  f40:{ strategy:'follow', delay:4.0, at:FRONT },
  cut:{ strategy:'intercept', delay:2.5, at:FRONT, pt:[12.6, -2.4], pastSeg:3 },
};
// the openings, each with a 1.0 s reaction from where that opening happens
const OPEN = {
  seen:{ row:'seen', strategy:'follow', delay:1.0, at:FRONT },
  soft:{ row:'soft', strategy:'follow', delay:1.0, at:[9.2, 3.6] },
  bolt:{ row:'bolt', strategy:'follow', delay:1.0, at:[4.5, 4.0] },
  bolt6:{ row:'bolt', strategy:'follow', delay:1.0, at:[2.2, 4.0] },      // the far edge of the 6 m bolt radius
  scan:{ row:'scan', strategy:'follow', delay:1.0, at:[5.6, 4.0] },
};
const ER = [3, 6, 8, 9, 10, 12, 15];
// today's walk-in from a bolt spot to FRONT (arm's length) at the pursuer's 4.42 m/s, on the open road
const WALK = at => Math.hypot(at[0] - FRONT[0], at[1] - FRONT[1]) / 4.42;
const cells = () => {
  const base = [], cell = [];
  for (const [k, s] of Object.entries(STRAT)) base.push(Object.assign({ id:'today:' + k }, s));
  for (const [k, s] of Object.entries(OPEN)) base.push(Object.assign({ id:'today:open-' + k }, s));
  base.push(Object.assign({ id:'today:f25+pursuit', pursuit:true }, STRAT.f25));
  for (const post of ['none', 'corner', 'back', 'van']) for (const [k, s] of Object.entries(STRAT))
    cell.push(Object.assign({ id:post + ':' + k, vs:'today:' + k, post, row:'seen' }, s));
  for (const [k, s] of Object.entries(OPEN)) cell.push(Object.assign({ id:'none:open-' + k, vs:s.row === 'bolt' ? 'today:open-seen' : 'today:open-' + k, walk:s.row === 'bolt' ? WALK(s.at) : 0,
    ref:s.row === 'bolt' ? 'today:open-' + k : null, post:'none' }, s));
  for (const post of ['corner', 'back']) for (const er of ER) for (const k of ['f13', 'f25'])
    cell.push(Object.assign({ id:post + ':' + k + '+enroute' + er, vs:'today:' + k, post, enroute:er, row:'seen' }, STRAT[k]));
  for (const post of ['none', 'corner', 'back', 'van']) cell.push(Object.assign({ id:post + ':f25+pursuit', vs:'today:f25+pursuit', post, pursuit:true, row:'seen' }, STRAT.f25));
  return { base, cell, never:{ id:'back:never', post:'back', row:'seen', strategy:'stand', delay:0, at:FRONT, maxT:30 } };
};

module.exports = async h => {
  const N = +(process.env.M2_SEEDS || 20);
  const C = cells();
  const res = {};
  const t0 = Date.now();
  for (let seed = 1; seed <= N; seed++) {
    await M.boot(h, { seed });
    const out = await h.ev(C => {
      SETTINGS.reduceMotion = 'on';            // Uche's 1.4 s camera beat is real time: skip it in the matrix
      __m2.snap();
      const seed = C.seed, r = {};
      const run = (o, off) => { const x = __m2.cell(Object.assign({}, o, { seed, off })), U = TAC.m2.uche();
        return x.started ? [x.caught ? 1 : 0, x.t, x.bumps, x.how, U && U.tasks.veer ? (U.veerMoving ? 'veer-moving' : 'veer') : ''] : [0, 99, 0, 'nostart', '']; };
      for (const o of C.base) r[o.id] = run(o, true);
      for (const o of C.cell) r[o.id] = run(o, false);
      r[C.never.id] = run(C.never, false);
      __m2.reset({});
      return r;
    }, Object.assign({}, C, { seed }));
    for (const k of Object.keys(out)) (res[k] = res[k] || []).push(out[k]);
    if (seed === 1 || seed % 5 === 0) h.log(`seed ${seed}/${N} done (${Math.round((Date.now() - t0) / 1000)} s)`);
  }
  const med = a => { const s = a.slice().sort((x, y) => x - y), n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : NaN; };
  const stat = (rows, walk = 0) => ({ rate:rows.filter(r => r[0]).length / rows.length, med:med(rows.map(r => r[0] ? r[1] + walk : 99)), bumps:rows.reduce((a, r) => a + r[2], 0) / rows.length,
    how:rows.reduce((m, r) => (m[r[3]] = (m[r[3]] || 0) + 1, m), {}), veers:rows.filter(r => r[4]).length, veersMoving:rows.filter(r => r[4] === 'veer-moving').length });
  const f = x => (Math.round(x * 100) / 100).toFixed(2);
  const lines = [], fails = [];
  lines.push('cell                        | today: caught  median  bumps | new: caught  median  bumps | how (new)');
  const S = {};
  for (const o of C.cell) {
    const a = stat(res[o.vs], o.walk || 0), b = stat(res[o.id]);
    S[o.id] = { a, b };
    const ok = b.rate >= a.rate - 1e-9 && b.med <= a.med + 0.5 + 1e-9 && b.bumps <= a.bumps + 0.2 + 1e-9;
    if (!ok) fails.push(o.id);
    lines.push(`${(o.id + (ok ? '' : ' FAIL')).padEnd(27)} | ${f(a.rate).padStart(13)} ${f(a.med).padStart(7)} ${f(a.bumps).padStart(6)} | ${f(b.rate).padStart(11)} ${f(b.med).padStart(7)} ${f(b.bumps).padStart(6)} | ${JSON.stringify(b.how)}${b.veers ? ' veers ' + b.veers + (b.veersMoving ? ' (' + b.veersMoving + ' moving)' : '') : ''}`);
    if (o.ref) { const r = stat(res[o.ref]); lines.push(`  (ref: today's opening at the bolt spot, ${o.ref}: ${f(r.rate)} ${f(r.med)} s ${f(r.bumps)} bumps; TODAY above = open-seen + ${f(o.walk)} s walk-in)`); }
  }
  const nv = res[C.never.id];
  lines.push(`back:never (Uche only)      | caught by Uche on ${nv.filter(r => r[0] && r[3] === 'uche').length}/${nv.length} seeds; median ${f(med(nv.map(r => r[1])))} s`);
  h.log(`\nTAC_M2_MATRIX · ${N} seeds · ${Math.round((Date.now() - t0) / 1000)} s\n` + lines.join('\n'));
  h.assert(N >= 20 || process.env.M2_SEEDS, 'at least 20 seeds');
  h.assert(!fails.length, 'no cell regresses against today on the same seeds: ' + fails.join(', '));
  h.assert(nv.every(r => r[0] && r[3] === 'uche' && r[1] <= 20), 'the gate post with a never-chasing player: caught by Uche on every seed (by 20 s)');
  // the moving-Uche rule is exercised (B-MAJ-3): where his jog crosses KC's route the cells differ from TODAY, a jogging Uche
  // ahead of KC and going his way grabs him (no veer into the stalls: +9 s was a 1.75 s regression at f13), and a jogging Uche
  // coming towards KC turns him
  const enr = C.cell.filter(o => o.enroute);
  // Uche's effect: against the same strategy with the layer on and no Uche (none:<k>; TODAY's how is always null), the cell's
  // numbers or its endings differ, or he turned KC
  const sig = x => JSON.stringify([f(x.rate), f(x.med), f(x.bumps), Object.keys(x.how).sort().map(k => k + x.how[k])]);
  const changed = enr.filter(o => { const b = S[o.id].b; return b.veers > 0 || sig(b) !== sig(stat(res['none:' + o.vs.split(':')[1]])); });
  h.log('en-route cells where Uche changed the chase (against none:<strategy>): ' + changed.map(o => o.id).join(', '));
  h.assert(['corner', 'back'].every(p => ['f13', 'f25'].every(k => [8, 9].every(er => changed.some(o => o.id === p + ':' + k + '+enroute' + er)))), 'en route at +8 and +9 s (his jog crosses KC\'s route): Uche changes the chase in every cell');
  h.assert(['corner', 'back'].every(p => ['f13', 'f25'].every(k => [8, 9].every(er => (S[p + ':' + k + '+enroute' + er].b.how.uche || 0) >= N / 2))),
    'en route at +8 and +9 s: Uche grabs KC on at least half the seeds in every cell (UCHE HAS HIM)');
  h.assert(enr.some(o => S[o.id].b.veersMoving > 0), 'a veer from a Uche still on his way happens in some en-route cell (he comes towards KC)');
  h.assert(!h.errors.length, 'no page errors: ' + h.errors.join(' | '));
};
