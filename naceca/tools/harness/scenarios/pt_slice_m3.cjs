// pt_slice_m3 (Team D): the REAL mansion events (Team C's tac_mansion.js, Team A's sight) against the event contract,
// DESIGN-tactics.md §4: enc m3_entry / m3_obi / m3_laptop / m3_child, order, ally_done and m3_summary have their required
// fields and valid enums; nothing per tick; every event ≤ 1500 chars; m3_summary once; a seen_read follows each alarm;
// no seen with cause knock or loud (those are enc m3_obi.alertedBy); seen.why equals the eye's line at that tick.
// The art-pass mansion through T.deviceMansion (T.restoreArt afterwards).
//   node tools/harness/run.cjs tools/harness/scenarios/pt_slice_m3.cjs --html <build>/naceca.html --w 1280 --h 800
// Until Team C has merged it runs the drive and checks whatever this build logs, and logs SKIP (needs C) for the mansion
// asserts; until Team A has merged, SKIP (needs A) for the eye.
// A run with any SKIP ends with an INCOMPLETE line: it has not checked the contract on the real emitters. The
// integrator runs it with PT_SLICE_STRICT=1 once A and C are in, which turns INCOMPLETE into a failure.
const P = require('./pt_lib.cjs');
const T = P.T;
module.exports = async h => {
  let out;
  try {
    const L = require('./tac_m3_lib.cjs');
    await L.v8(h, { seed:51 });
    const hasC = await P.hasC(h), full = await h.ev(() => !!(TAC.sight && TAC.sight.full));
    await h.ev(() => { localStorage.removeItem('naceca_pt_v1'); V12.ptKit.clear(); V12.ptKit.player('S3'); });
    await T.capture(h);
    await P.eyeProbe(h);
    const t0 = await P.mark(h);
    // the raid plan, the way a player gets there (the Lagos sheet filed, PLAN THE RAID): a quiet front entry, Uche with you
    const hasPlan = await h.ev(() => ENGINE.interactables.some(i => /^Plan the raid/.test(i.label || '')));
    if (hasC && hasPlan) await L.breach(h, { entry:'quiet', power:'leave', uche:'with' });
    else h.log('no PLAN THE RAID in this build: the drive starts on site without the plan');
    await h.ev(() => { showOverlay(null); ENGINE.movementEnabled = true; });
    // 30 s on site: walk up the living room towards Obi's desk (alarms him if he can see it), interacting on the way
    const n0 = (await T.events(h)).length, w0 = await h.ev(() => __wf.t);
    await T.walk(h, [[0.4, 3.0], [1.6, 1.0], [3.0, -0.4], [3.6, -0.9]], { speed:1.55, maxT:20 });
    await h.ev(w0 => { __wf.run(Math.max(0, 30 - (__wf.t - w0))); }, w0);
    const perTick = (await T.events(h)).length - n0;
    for (let i = 0; i < 4; i++) {
      await h.ev(() => { showOverlay(null); ENGINE.movementEnabled = true; tryInteract(); });
      await h.step(500);
      for (let j = 0; j < 8; j++) { const r = await T.finishDialogue(h); if (r === 'choice') { await T.choose(h, 0); continue; } break; }
      await h.ev(() => { if (typeof MINI !== 'undefined' && MINI.active) miniClose({ ok:true, won:true }); });
    }
    // extraction: the mission's own completion (the aftermath)
    await h.ev(() => { showOverlay(null); if (S.game.currentMission === 'm3' && !(S.game.completedMissions || []).includes('m3')) completeMission('m3'); });
    await h.step(800);
    await h.ev(() => { const s = document.getElementById('pt-skip'); if (s && document.querySelector('#screen-pt-survey.show')) s.click(); });
    const evs = (await P.all(h)).filter(e => e.t >= t0 && e.type !== 'pt_player');
    out = { hasC, full, evs, eye:await P.eyeRecords(h), perTick };
    h.log(`C:${hasC} A:${full} events:${evs.length} tactics:${evs.filter(e => P.TACTICS.test(e.type)).map(e => e.type === 'enc' ? e.d.enc : e.type).join(',')} in 30 s on site:${perTick}`);
  } finally { await T.restoreArt(h); }

  const r = out, missing = new Set();
  const tac = P.sliceAsserts(h, r.evs, { name:'M3', once:r.hasC ? ['m3_summary', 'm3_entry'] : [] });
  h.log(`M3: the contract was checked on ${r.evs.length} events, ${tac.length} of them tactics events`);
  h.assert(r.perTick <= 40, `M3: nothing per tick (${r.perTick} V12.log calls in 30 s, ≤ 40)`);
  h.assert(!r.evs.some(e => e.type === 'seen' && /^(knock|loud)$/.test(e.d.cause)), 'M3: no seen with cause knock or loud');
  // every alarm whose line reached the screen gets its read (per watcher); a line that never showed has none (§4's via is
  // eye|toast|both), so no watcher has more reads than alarms
  const alarms = r.evs.filter(e => e.type === 'seen' && e.d.level === 'alarm'), reads = r.evs.filter(e => e.type === 'seen_read');
  const byWho = {}; alarms.forEach(a => { (byWho[a.d.who] = byWho[a.d.who] || { alarms:0, reads:0, shown:0 }).alarms++; }); reads.forEach(x => { (byWho[x.d.who] = byWho[x.d.who] || { alarms:0, reads:0, shown:0 }).reads++; });
  if (r.full) r.eye.filter(x => x.level === 'alarm' && x.shown && x.at === x.why && byWho[x.who]).forEach(x => byWho[x.who].shown++);
  h.assert(Object.values(byWho).every(n => n.reads <= n.alarms && n.reads >= n.shown), 'M3: a seen_read for each alarm whose line was on screen ' + JSON.stringify(byWho));
  if (!r.hasC) { missing.add('C'); h.log('SKIP (needs C): M3: enc m3_* and m3_summary come from tac_mansion.js, which is not in this build'); }
  else {
    h.assert(r.evs.some(e => e.type === 'enc' && e.d.enc === 'm3_entry'), 'M3: enc m3_entry');
    const box = {}; require('vm').runInNewContext(require('fs').readFileSync(require('path').join(P.ROOT, 'src', 'tactics', 'tac_pt_report.js'), 'utf8'), box);
    h.log('families: ' + box.PT_REPORT.analyze(r.evs).approaches.verdict);
  }
  if (!r.full) { missing.add('A'); h.log('SKIP (needs A): M3: seen.why against the eye\'s line (TAC.sight.full is false)'); }
  else {
    const mine = r.eye.filter(x => x.top === x.who && x.shown), off = mine.filter(x => x.at !== x.why);
    off.slice(0, 5).forEach(x => h.log('  why/eye: ' + JSON.stringify(x)));
    h.assert(off.length === 0, 'M3: seen.why equals the eye\'s .eye-why at that tick');
  }
  // D-10: a run that SKIPped is not a pass of the contract (PT_SLICE_STRICT=1 fails it, for the integrator after A and C merge)
  if (missing.size) {
    const m = [...missing].sort().join(' and ');
    h.log(`INCOMPLETE (needs ${m}): only this build's own events were checked against DESIGN §4; the mansion emitters were not exercised`);
    h.assert(!process.env.PT_SLICE_STRICT, `PT_SLICE_STRICT: pt_slice_m3 ran without ${m}`);
  }
  h.assert(h.errors.length === 0, 'no page errors');
};
