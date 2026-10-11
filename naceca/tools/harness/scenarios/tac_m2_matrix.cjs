// tac_m2_matrix · THE BALANCE GATE (DESIGN M-M5, §7.B; market.md §5.1): every chase cell of the market layer against TODAY
// on the same seeds. TODAY = TAC.m2.cfg.off (the router and every chase hook pass straight through: today's opening, no
// CUT HIM OFF, no Uche); the lanes and KC's path are Team A's in both (installed by T.deviceMarket).
// Seeds: M2_SEEDS (default 20); each seed builds its own market (its crowd), and every run reseeds Math.random inside the
// evaluate that confronts and chases (__tacSeed), so a cell and its TODAY share the same random stream.
// Pursuer: the scout's (T.pursue) at 4.42 m/s (wayfind_catch's pessimistic touch sprint), steering by the route line.
// Gate, for every cell: catch rate ≥ today; median time ≤ today + 0.5 s; mean bumps ≤ today + 0.2.
// Plus: the gate post with a player who never chases → caught by Uche on every seed.
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
const cells = () => {
  const base = [], cell = [];
  for (const [k, s] of Object.entries(STRAT)) base.push(Object.assign({ id:'today:' + k }, s));
  for (const [k, s] of Object.entries(OPEN)) base.push(Object.assign({ id:'today:open-' + k }, s));
  base.push(Object.assign({ id:'today:f25+pursuit', pursuit:true }, STRAT.f25));
  for (const post of ['none', 'corner', 'back', 'van']) for (const [k, s] of Object.entries(STRAT))
    cell.push(Object.assign({ id:post + ':' + k, vs:'today:' + k, post, row:'seen' }, s));
  for (const [k, s] of Object.entries(OPEN)) cell.push(Object.assign({ id:'none:open-' + k, vs:'today:open-' + k, post:'none' }, s));
  for (const post of ['corner', 'back']) cell.push(Object.assign({ id:post + ':f25+enroute3', vs:'today:f25', post, enroute:3, row:'seen' }, STRAT.f25));
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
      const run = (o, off) => { const x = __m2.cell(Object.assign({}, o, { seed, off })); return x.started ? [x.caught ? 1 : 0, x.t, x.bumps, x.how] : [0, 99, 0, 'nostart']; };
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
  const stat = rows => ({ rate:rows.filter(r => r[0]).length / rows.length, med:med(rows.map(r => r[0] ? r[1] : 99)), bumps:rows.reduce((a, r) => a + r[2], 0) / rows.length,
    how:rows.reduce((m, r) => (m[r[3]] = (m[r[3]] || 0) + 1, m), {}) });
  const f = x => (Math.round(x * 100) / 100).toFixed(2);
  const lines = [], fails = [];
  lines.push('cell                        | today: caught  median  bumps | new: caught  median  bumps | how (new)');
  for (const o of C.cell) {
    const a = stat(res[o.vs]), b = stat(res[o.id]);
    const ok = b.rate >= a.rate - 1e-9 && b.med <= a.med + 0.5 + 1e-9 && b.bumps <= a.bumps + 0.2 + 1e-9;
    if (!ok) fails.push(o.id);
    lines.push(`${(o.id + (ok ? '' : ' FAIL')).padEnd(27)} | ${f(a.rate).padStart(13)} ${f(a.med).padStart(7)} ${f(a.bumps).padStart(6)} | ${f(b.rate).padStart(11)} ${f(b.med).padStart(7)} ${f(b.bumps).padStart(6)} | ${JSON.stringify(b.how)}`);
  }
  const nv = res[C.never.id];
  lines.push(`back:never (Uche only)      | caught by Uche on ${nv.filter(r => r[0] && r[3] === 'uche').length}/${nv.length} seeds; median ${f(med(nv.map(r => r[1])))} s`);
  h.log(`\nTAC_M2_MATRIX · ${N} seeds · ${Math.round((Date.now() - t0) / 1000)} s\n` + lines.join('\n'));
  h.assert(N >= 20 || process.env.M2_SEEDS, 'at least 20 seeds');
  h.assert(!fails.length, 'no cell regresses against today on the same seeds: ' + fails.join(', '));
  h.assert(nv.every(r => r[0] && r[3] === 'uche' && r[1] <= 20), 'the gate post with a never-chasing player: caught by Uche on every seed (by 20 s)');
  h.assert(!h.errors.length, 'no page errors: ' + h.errors.join(' | '));
};
