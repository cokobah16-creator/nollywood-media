// tac_m3_entry: the entry decides the start (DESIGN §5.4; mansion.md §1.2, §3.1, §3.8). Every entry (knock, loud,
// quiet front, the side gate) × power (left on, cut) × Uche (with you, Squad Trust rear): the spawn, where Uche stands,
// the wipe deferred (_wipeTotal 0 while pending), knock armed at 1.0 ± 0.05 s and running at 2.5 s, loud armed at 0
// and stunned 2.5 s, no false LAPTOP WIPE RUNNING toast, the title card holding the clock and movement, the laptop
// screen locked while pending, the power cut's dimming (restored at the next scene) and half sight. The tracker stays on
// Obi (o6) while he is free on every entry, so a knock or a loud entry no longer flicks child → wipe → Obi in 2.5 s.
// Owner: Team C.
const L = require('./tac_m3_lib.cjs');

module.exports = async h => {
  const fails = [];
  const check = (c, m) => { if (!c) fails.push(m); h.assert(c, m); };
  try {
    // ---------- the card: it holds the clock and movement, teleports and resets the camera when it shows ----------
    await L.v8(h);
    await h.ev(() => { MANSION.mats.__tac = { lightMapIntensity:MANSION.lmMax }; window.__cam = 0; const o = window.resetCameraFollow; window.resetCameraFollow = function(){ window.__cam++; return o.apply(this, arguments); }; });
    const c = await L.breach(h, { entry:'knock' }, { card:false });
    const under = await h.ev(() => { const R = TAC.m3.run(); const t0 = R.t; __m3.run(1.2);
      return { moving:ENGINE.movementEnabled, live:R.live, t0, t:R.t, obi:R.obi.state, total:S.game._wipeTotal, card:document.querySelector('#title-card').textContent,
        p:[ENGINE.player.position.x, ENGINE.player.position.z], cam:window.__cam, frozen:TAC.frozen() }; });
    h.log('under the card', JSON.stringify(under));
    check(!under.moving && !under.live && under.frozen, 'the card: movement is off and the house clock has not started');
    check(under.t === 0 && under.obi === 'startled' && under.total === 0, 'the card blocks the clock: Obi still startled, no wipe after 1.2 s under it');
    check(/KNOCK AND ANNOUNCE/.test(under.card) && /21:32/.test(under.card), 'the card reads KNOCK AND ANNOUNCE · 21:32: ' + under.card);
    check(Math.abs(under.p[0] - 0.35) < 1e-6 && Math.abs(under.p[1] - 5.0) < 1e-6 && under.cam >= 1, 'teleported to the doorway and the camera reset when the card showed');
    await h.step(2200);
    const after = await h.ev(() => ({ moving:ENGINE.movementEnabled, live:TAC.m3.run().live }));
    check(after.moving && after.live, 'the card closed: movement back, the clock runs');
    await L.restore(h);

    // ---------- every entry × power × Uche ----------
    const ENTRIES = [['knock', null], ['loud', null], ['quiet', null], ['gate', 'kcFair']];
    for (const [key, fix] of ENTRIES) for (const power of ['leave', 'cut']) for (const uche of ['with', 'rear']) {
      const name = `${key}/${power}/${uche}`;
      const st = [fix, uche === 'rear' ? 'squad' : null].filter(Boolean);
      await L.v8(h, { state:st.length ? L.state(...st) : null });
      await h.ev(() => { MANSION.mats.__tac = { lightMapIntensity:MANSION.lmMax }; });
      const entry = key === 'gate' ? 'quiet' : key;
      const b = await L.breach(h, { entry, power, uche });
      const r = await h.ev(() => {
        const R = TAC.m3.run(), M = R.M;
        return { door:R.door, entry:R.entry, p:[ENGINE.player.position.x, ENGINE.player.position.z], yaw:ENGINE.player.rotation.y, u:[M.uche.position.x, M.uche.position.z], mode:R.uche.mode,
          pending:R.wipe.pending, mode0:R.wipe.mode, total:S.game._wipeTotal, screen:M.screenState, mat:MANSION.mats.__tac.lightMapIntensity, lm:MANSION.lmMax,
          ucheIt:(ENGINE.interactables.find(i => /^Plan the raid/.test(i.label)) || {}).consumed === true, obj:(S.game.objectives.find(o => o.id === 'o4_wipe') || {}).text,
          obi:R.obi.state, toasts:(window.__toasts || []).map(t => t[0]).join('|') };
      });
      // the house runs a little: knock arms at 1.0, runs at 2.5; loud is armed at 0, stunned 2.5 s; quiet stays pending
      const run = await h.ev(() => {
        const R = TAC.m3.run(); let armedAt = R.wipe.mode === 'armed' ? R.t : null, runAt = null, k = 0; const screens = new Set(), trk = new Set();
        const cur = () => { const c = WAY.current(); return (c && c.obj && c.obj.id) || null; };
        trk.add(cur());
        __m3.run(3.2, () => { if (armedAt == null && R.wipe.mode === 'armed') armedAt = R.t; if (runAt == null && R.obi.state === 'running') runAt = R.t; screens.add(R.M.screenState);
          if (k++ % 6 === 0 && !R.obi.outcome) trk.add(cur()); });
        return { armedAt, runAt, total:S.game._wipeTotal, mode:R.wipe.mode, screens:[...screens], obi:R.obi.state, toasts:(window.__toasts || []).map(t => t[0]).join('|'),
          obj:(S.game.objectives.find(o => o.id === 'o4_wipe') || {}).text, trk:[...trk] };
      });
      const exp = { knock:55, loud:40, quiet:65, gate:80 + 15 }[key] + (power === 'cut' ? 12 : 0);   // KC also places the laptop (+15)
      const sp = { knock:[0.35, 5.0], loud:[0.35, 4.6], quiet:[0.4, 4.9], gate:[0, -7.6] }[key];
      const um = (uche === 'rear' || key === 'gate') ? 'post' : key === 'quiet' ? 'hold' : 'follow';
      const up = { post:[-0.35, -8.1], hold:[0.9, 5.5], follow:[-0.35, 4.7] }[um];
      h.log(name, JSON.stringify(r), JSON.stringify(run));
      check(Math.hypot(r.p[0] - sp[0], r.p[1] - sp[1]) < 1e-6, `${name}: spawn ${sp} (got ${r.p})`);
      check(Math.abs(r.yaw - (key === 'gate' ? 0 : Math.PI)) < 1e-6, `${name}: facing into the house`);
      check(r.mode === um && Math.hypot(r.u[0] - up[0], r.u[1] - up[1]) < 1e-6, `${name}: Uche ${um} at ${up} (got ${r.mode} ${r.u})`);
      check(r.door === (key === 'gate' ? 'gate' : 'front'), `${name}: door ${r.door}`);
      check(r.pending === exp, `${name}: the pending total is v12's wipeFor (${exp}), got ${r.pending}`);
      check(r.ucheIt, `${name}: Uche's "Plan the raid" interactable is consumed at the breach`);
      check(!/LAPTOP WIPE RUNNING/.test(r.toasts + '|' + run.toasts), `${name}: no LAPTOP WIPE RUNNING toast (${run.toasts})`);
      if (key === 'knock') {
        check(r.total === 0 && r.mode0 === 'pending', `${name}: pending at t = 0`);
        check(r.obj === 'Seize the laptop' && run.obj === 'Stop laptop wipe', `${name}: "Seize the laptop" until the wipe exists, then "Stop laptop wipe" (${r.obj} → ${run.obj})`);
        check(run.armedAt != null && Math.abs(run.armedAt - 1.0) <= 0.05 && run.total === exp, `${name}: armed at 1.0 ± 0.05 s with ${exp} (got ${run.armedAt}, ${run.total})`);
        if (um === 'post') check(run.runAt != null && Math.abs(run.runAt - 2.5) <= 0.05, `${name}: running at 2.5 s (got ${run.runAt})`);
        else check(run.runAt != null && Math.abs(run.runAt - 2.5) <= 0.05, `${name}: running at 2.5 s (got ${run.runAt})`);
      } else if (key === 'loud') {
        check(r.mode0 === 'armed' && r.total === exp && r.obi === 'stunned', `${name}: armed at 0 with ${exp}, Obi stunned (got ${r.mode0} ${r.total} ${r.obi})`);
        check(run.runAt != null && Math.abs(run.runAt - 2.5) <= 0.05, `${name}: stunned 2.5 s, then runs (got ${run.runAt})`);
      } else {
        check(r.total === 0 && run.total === 0 && run.mode === 'pending' && run.armedAt == null && run.runAt == null, `${name}: nothing starts without an alarm (_wipeTotal ${run.total}, ${run.mode})`);
        check(r.obi === 'unaware' && run.obi === 'unaware', `${name}: Obi on his call`);
        check(run.screens.length === 1 && run.screens[0] === 'locked', `${name}: the laptop screen stays locked while pending (${run.screens})`);
        check(r.obj === 'Seize the laptop', `${name}: the objective reads "Seize the laptop" until a wipe exists (${r.obj})`);
      }
      check(power === 'cut' ? Math.abs(r.mat - 0.35 * r.lm) < 1e-9 : r.mat === r.lm, `${name}: light maps ${power === 'cut' ? 'at 35%' : 'untouched'} (${r.mat})`);
      check(run.trk.length === 1 && run.trk[0] === 'o6_arrest', `${name}: the tracker stays on Obi (o6) from the first frame while he is free (got ${run.trk})`);
      const ev = (await L.ev(h, 'enc')).filter(e => e[1].enc === 'm3_entry');
      check(ev.length === 1, `${name}: one enc m3_entry`);
      const e = ev[0] && ev[0][1];
      if (e) check(e.entry === entry && e.door === (key === 'gate' ? 'gate' : 'front') && e.power === (power === 'cut' ? 'cut' : 'on') && e.uche === uche && e.leak === false
        && e.variant === 'v8' && e.wipeTotal === exp && Array.isArray(e.spawn) && e.spawn[0] === sp[0] && e.spawn[1] === sp[1] && e.armed === (key === 'loud')
        && e.prep && typeof e.prep.kcFair === 'boolean' && e.def && e.def.power === (power !== 'cut'), `${name}: m3_entry fields ${JSON.stringify(e)}`);
      // the power cut: he sees half as far (9 → 4.5 m): a spot 6 m in front of him
      if (key === 'quiet') {
        const pr = await h.ev(() => TAC.sight.probe('obi', 4.12 - 6, -1, { gait:'still' }));
        check(power === 'cut' ? pr.inRange === false && pr.lit === 'dark' : pr.inRange === true && pr.lit === 'lit', `${name}: range ${power === 'cut' ? '4.5 (dark)' : '9 (lit)'}: ${JSON.stringify({ inRange:pr.inRange, lit:pr.lit })}`);
      }
      await L.restore(h);
    }
    // the shared baked materials come back at the next scene (art_pass_v8.js:192-197)
    await L.v8(h);
    const mat = await h.ev(() => ({ v:MANSION.mats.__tac && MANSION.mats.__tac.lightMapIntensity, lm:MANSION.lmMax }));
    check(mat.v === mat.lm, 'a power cut does not leak into the next build: ' + JSON.stringify(mat));
    await h.ev(() => { delete MANSION.mats.__tac; });
    h.assert(!h.errors.length, 'no page errors: ' + h.errors.join(' | '));
  } finally { await L.restore(h); }
  h.log(fails.length ? 'FAILS ' + fails.join(' ; ') : 'all entry asserts held');
};
