// pt_slice_m2 (Team D): the REAL market events (Team B's tac_market.js, Team A's sight) against the event contract,
// DESIGN-tactics.md §4: required fields present and enum values valid, nothing per tick, every event ≤ 1500 chars,
// m2_summary once per run, and seen.why equal to the eye's .eye-why text at that tick.
// Two scripted runs on the dressed market: a sneak from behind KC (the cold grab when B is in the build) and a walk-up
// from the front (seen, then the tackle).
//   node tools/harness/run.cjs tools/harness/scenarios/pt_slice_m2.cjs --html <build>/naceca.html --w 1280 --h 800
// Until Team B has merged it runs the same drive and checks the contract on whatever this build logs (D's own events),
// and logs SKIP (needs B) for the market asserts; until Team A has merged, SKIP (needs A) for the eye.
const P = require('./pt_lib.cjs');
const T = P.T;
module.exports = async h => {
  const runs = [];
  for (const style of ['sneak', 'front']) {
    await T.deviceMarket(h, { seed:style === 'sneak' ? 41 : 42 });
    const hasB = await P.hasB(h), full = await h.ev(() => !!(TAC.sight && TAC.sight.full));
    await h.ev(() => { localStorage.removeItem('naceca_pt_v1'); V12.ptKit.clear(); V12.ptKit.player('S1'); });
    await T.capture(h);
    await P.eyeProbe(h);
    const t0 = await P.mark(h);
    // Tunde (quiet when sneaking)
    await h.ev(() => { const p = ENGINE.player.position; p.x = -6; p.z = -0.4; tryInteract(); });
    await h.step(300);
    for (let i = 0; i < 6; i++) { const r = await T.finishDialogue(h); if (r === 'choice') { await T.choose(h, style === 'sneak' ? 0 : 1); continue; } break; }
    await h.ev(() => { showOverlay(null); ENGINE.movementEnabled = true; });
    // 30 s near KC: crouched round the back of the stalls (sneak), or standing on the open road (front)
    const n0 = (await T.events(h)).length, w0 = await h.ev(() => __wf.t);
    if (style === 'sneak') await T.walk(h, [[-2, 9], [6, 12], [11.4, 11.4], [12.6, 7.4], [12.4, 5.2], [10.2, 4.6]], { speed:1.25, crouch:true, maxT:30, keep:true });
    else await T.walk(h, [[0, 6], [2.5, 4.5], [3.2, 4.2], [3.2, 4.0]], { speed:1.4, maxT:30 });
    await h.ev(w0 => { __wf.run(Math.max(0, 30 - (__wf.t - w0))); ENGINE.keys.KeyC = false; }, w0);
    const perTick = (await T.events(h)).length - n0;
    // the phone: the unlock, then the document (solved by the driver), then the confront
    await h.ev(style => { const p = ENGINE.player.position; if (style === 'sneak') { p.x = 7.3; p.z = 5.6; } else { p.x = 6.4; p.z = 4.2; } tryInteract(); }, style);
    await h.step(900);
    await h.ev(() => { if (typeof MINI !== 'undefined' && MINI.active) miniClose({ ok:true, won:true }); });
    await h.step(900);
    await h.ev(() => { showOverlay(null); ENGINE.movementEnabled = true; if (!S.game._marketScanned) { S.game._marketScanned = true; completeObjective('o2_scan'); } });
    await h.step(1200);
    await h.ev(style => { showOverlay(null); ENGINE.movementEnabled = true; const p = ENGINE.player.position; if (style === 'sneak') { p.x = 9.6; p.z = 4.4; } else { p.x = 6.0; p.z = 5.4; } tryInteract(); }, style);
    await h.step(600);
    if (await h.ev(() => !!CHASE.active)) await T.pursue(h, { strategy:'follow', maxT:40, v:5.0 });
    await h.step(500);
    for (let i = 0; i < 6; i++) { const r = await T.finishDialogue(h); if (r === 'choice') { await T.choose(h, 0); continue; } break; }
    // the van
    await h.ev(() => { showOverlay(null); ENGINE.movementEnabled = true; if (S.game.currentMission === 'm2') completeMission('m2', { silent:true }); });
    await h.step(400);
    const evs = (await P.all(h)).filter(e => e.t >= t0 && e.type !== 'pt_player');
    const eye = await P.eyeRecords(h);
    runs.push({ style, hasB, full, evs, eye, perTick });
    h.log(style, `B:${hasB} A:${full} events:${evs.length} tactics:${evs.filter(e => P.TACTICS.test(e.type)).map(e => e.type === 'enc' ? e.d.enc : e.type).join(',')} in 30 s near KC:${perTick}`);
  }
  for (const r of runs) {
    P.sliceAsserts(h, r.evs, { name:'M2 ' + r.style, once:r.hasB ? ['m2_summary'] : [] });
    h.assert(r.perTick <= 40, `M2 ${r.style}: nothing per tick (${r.perTick} V12.log calls in 30 s near KC, ≤ 40)`);
    if (!r.hasB) { h.log(`SKIP (needs B): M2 ${r.style}: enc m2_tunde / m2_kc and m2_summary come from tac_market.js, which is not in this build`); continue; }
    h.assert(r.evs.some(e => e.type === 'enc' && e.d.enc === 'm2_tunde') && r.evs.some(e => e.type === 'enc' && e.d.enc === 'm2_kc'), `M2 ${r.style}: enc m2_tunde and m2_kc`);
    const alarms = r.evs.filter(e => e.type === 'seen' && e.d.level === 'alarm');
    const reads = r.evs.filter(e => e.type === 'seen_read');
    h.assert(reads.length >= alarms.length - 1, `M2 ${r.style}: a seen_read for each alarm (${reads.length} for ${alarms.length})`);
    if (!r.full) { h.log(`SKIP (needs A): M2 ${r.style}: seen.why against the eye's line (TAC.sight.full is false)`); continue; }
    const mine = r.eye.filter(x => x.top === x.who && x.shown);
    const off = mine.filter(x => x.at !== x.why);
    off.slice(0, 5).forEach(x => h.log('  why/eye: ' + JSON.stringify(x)));
    h.assert(mine.length > 0 || !r.evs.some(e => e.type === 'seen'), `M2 ${r.style}: the eye showed the watcher that logged seen`);
    h.assert(off.length === 0, `M2 ${r.style}: seen.why equals the eye's .eye-why at that tick`);
  }
  if (runs.every(r => r.hasB)) {
    const fam = (r) => { const box = {}; require('vm').runInNewContext(require('fs').readFileSync(require('path').join(P.ROOT, 'src', 'tactics', 'tac_pt_report.js'), 'utf8'), box); return box.PT_REPORT.analyze(r.evs).approaches; };
    h.log('families: sneak ' + fam(runs[0]).verdict + ' · front ' + fam(runs[1]).verdict);
  }
  h.assert(h.errors.length === 0, 'no page errors');
};
