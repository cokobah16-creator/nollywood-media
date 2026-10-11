// tac_m3_sight: Obi as a TAC.sight watcher on quiet entries (DESIGN §2.3 C-B1, §5.4; mansion.md §1.3, §3.2-3.3).
// The four-gait asserts with A's real line of sight (TAC.sight.full / TAC.geo.full): a frontal walk, jog and sprint
// alarm before he is within 2.7 m (arrest range); crouched frontal reaches notice, never alarm; the east flank at sneak,
// walk and jog stays under notice (35); the side gate along the back wall, crouched, stays under 35; in the dark (power
// cut) a frontal walk is still under 35 when it reaches arrest range. The alarm toast carries whyPast verbatim. Notice,
// then back out of his view → evaded (no seen{calm}). An overlay open 5 s freezes him. The tracker sends a quiet entry
// to Obi (o6), not across his cone to the child.
// Owner: Team C.
const L = require('./tac_m3_lib.cjs');

const FRONT = [[0.4,4.9],[0.5,2.6],[1.6,1.4],[2.3,0.4]];                    // through the living room, straight at the desk
const FLANK = [[0.4,4.9],[0.5,2.6],[3.6,2.7],[3.9,1.5]];                    // doorway (east side) → front wall → east wall
const GATE = [[0,-7.6],[0,-6.3],[0.6,-6.0],[0.6,-4.6],[0.6,-4.19],[1.5,-4.19],[1.5,-3.72],[3.2,-3.4]];   // the corridor's right wall, then the back wall

// walk a route; record the peak, the notice/alarm distances, the state when first within arrest range
const walkRoute = (h, pts, v, crouch, standCrouched) => h.ev(({ pts, v, crouch, standCrouched }) => {
  const R = TAC.m3.run(), O = R.M.obi.position, P = ENGINE.player.position;
  let peak = 0, alarmD = null, noticeD = null, at27 = null;
  const w = __m3.walk(pts, v, { crouch, keep:true, max:25, stop:() => {
    const s = R.w.state, d = Math.hypot(P.x - O.x, P.z - O.z);
    peak = Math.max(peak, s.susp);
    if (d < 2.7 && at27 == null) at27 = { susp:+s.susp.toFixed(1), obi:R.obi.state, level:s.level };
    if (s.level !== 'calm' && noticeD == null) noticeD = +d.toFixed(2);
    if (R.obi.state === 'reaching'){ alarmD = +d.toFixed(2); return true; }
    return false; } });
  if (alarmD == null && standCrouched) __m3.run(0.4, () => { peak = Math.max(peak, R.w.state.susp); if (R.obi.state === 'reaching'){ alarmD = 'standing'; return true; } });
  ENGINE.keys.KeyC = false;
  return { peak:+peak.toFixed(1), noticeD, alarmD, at27, end:w.at, obi:R.obi.state, why:R.w.state.whyPast, cause:R.obi.alertedBy };
}, { pts, v, crouch, standCrouched:!!standCrouched });

module.exports = async h => {
  try {
    const full = await h.ev(() => ({ sight:TAC.sight.full === true, geo:TAC.geo.full === true }));
    h.log('A merged:', JSON.stringify(full));
    if (!full.sight || !full.geo) { h.log('SKIP (needs A): the cover asserts need TAC.sight.full and TAC.geo.full'); return; }
    const gain = await h.ev(() => TAC.m3.cfg.gain);
    h.log('Obi gain', gain);

    // ---------- frontal: walk, jog, sprint alarm before arrest range ----------
    for (const [gait, v] of [['walk', 1.55], ['jog', 3.0], ['sprint', 5.2]]) {
      await L.v8(h); await L.breach(h, { entry:'quiet' });
      if (gait === 'walk') {
        const tr = await h.ev(() => (WAY.current().obj || {}).id);
        h.assert(tr === 'o6_arrest', 'the tracker on a quiet entry points at Obi (o6), not the child across his cone: ' + tr);
      }
      const r = await walkRoute(h, FRONT, v, false);
      h.log('front', gait, JSON.stringify(r));
      h.assert(typeof r.alarmD === 'number' && r.alarmD >= 2.7, `frontal ${gait}: alarmed before he is within 2.7 m (at ${r.alarmD})`);
      const seen = (await L.ev(h, 'seen')).filter(e => e[1].who === 'obi' && e[1].level === 'alarm');
      h.assert(seen.length === 1 && seen[0][1].crouch === false && ['sight', 'noise'].includes(seen[0][1].cause) && seen[0][1].enc === 'm3_obi'
        && seen[0][1].obi && seen[0][1].entry === 'quiet' && seen[0][1].power === 'on', `frontal ${gait}: one seen{alarm} with logExtra {obi, entry, power}: ` + JSON.stringify(seen.map(e => e[1])));
      const t = (await L.toasts(h)).find(x => /^HE (SAW|HEARD) YOU$|^TOO CLOSE$/.test(x[0]));
      h.assert(t && t[1] === r.why && r.why.length > 0, `frontal ${gait}: the alarm toast's small text is whyPast verbatim: ${JSON.stringify(t)} vs "${r.why}"`);
      if (gait === 'walk') {
        // the thumb lands 0.5 s after the alarm, he runs at +1.5 s
        const tl = await h.ev(() => { const R = TAC.m3.run(), a = R.obi.alarmAt; let armed = null, run = null;
          __m3.run(2.0, () => { if (armed == null && R.wipe.mode === 'armed') armed = R.t - a; if (run == null && R.obi.state === 'running') run = R.t - a; });
          return { armed, run, total:S.game._wipeTotal }; });
        h.log('after the alarm', JSON.stringify(tl));
        h.assert(tl.armed != null && Math.abs(tl.armed - 0.5) <= 0.06 && tl.total === 65, 'quiet: the wipe arms 0.5 s after the alarm (65 s): ' + JSON.stringify(tl));
        h.assert(tl.run != null && Math.abs(tl.run - 1.5) <= 0.06, 'quiet: he runs 1.5 s after the alarm: ' + JSON.stringify(tl));
      }
      await L.restore(h);
    }

    // ---------- crouched frontal: notice, never alarm ----------
    await L.v8(h); await L.breach(h, { entry:'quiet' });
    let r = await walkRoute(h, FRONT, 1.25, true, true);
    h.log('front crouched', JSON.stringify(r));
    h.assert(r.noticeD != null && r.peak >= 35 && r.alarmD == null && r.at27 && r.at27.obi !== 'reaching', 'crouched frontal: notice, but no alarm (in arrest range: ' + JSON.stringify(r.at27) + ')');
    const ns = (await L.ev(h, 'seen')).filter(e => e[1].who === 'obi');
    h.assert(ns.some(e => e[1].level === 'notice' && e[1].crouch === true) && !ns.some(e => e[1].level === 'alarm'), 'crouched frontal: a seen{notice, crouch} and no alarm');
    await L.restore(h);

    // ---------- the east flank: sneak, walk, jog stay under notice ----------
    for (const [gait, v, cr] of [['sneak', 1.25, true], ['walk', 1.55, false], ['jog', 3.0, false]]) {
      await L.v8(h); await L.breach(h, { entry:'quiet' });
      r = await walkRoute(h, FLANK, v, cr);
      h.log('flank', gait, JSON.stringify(r));
      h.assert(r.peak < 35 && r.alarmD == null && r.end[0] === 3.9 && r.end[1] === 1.5, `the east flank at a ${gait}: under 35 (${r.peak}) and in arrest range unseen`);
      await L.restore(h);
    }

    // ---------- the side gate along the back wall, crouched ----------
    await L.v8(h, { state:L.state('kcFair') }); const gb = await L.breach(h, { entry:'quiet' });
    h.assert(gb.st.door === 'gate', 'KC fair: the side gate');
    r = await walkRoute(h, GATE, 1.25, true, true);
    h.log('gate', JSON.stringify(r));
    h.assert(r.peak < 35 && r.alarmD == null, `side gate → back wall, crouched: under 35 (${r.peak})`);
    await L.restore(h);

    // ---------- the power cut: a frontal walk to arrest range stays under 35 ----------
    await L.v8(h); await L.breach(h, { entry:'quiet', power:'cut' });
    r = await walkRoute(h, FRONT, 1.55, false);
    h.log('dark', JSON.stringify(r));
    h.assert(r.at27 && r.at27.susp < 35 && r.at27.obi === 'unaware', 'dark: walking straight in, still under 35 at arrest range: ' + JSON.stringify(r.at27));
    h.assert(r.alarmD == null, 'dark: no alarm on the frontal walk');
    await L.restore(h);

    // ---------- notice, then back out of his view: evaded, never seen{calm} ----------
    await L.v8(h); await L.breach(h, { entry:'quiet' });
    const ev = await h.ev(() => {
      const R = TAC.m3.run(), s = R.w.state;
      __m3.walk([[0.4,4.9],[0.5,2.6],[1.0,1.9]], 1.55, { stop:() => s.level === 'notice' });
      const at = { susp:+s.susp.toFixed(1), level:s.level, obi:R.obi.state };
      __m3.walk([[0.5,2.6],[0.45,4.0],[0.6,4.7]], 1.55, { crouch:true, keep:true });
      let t = 0; __m3.run(12, () => { t += 1 / 60; return s.susp < 1; });
      ENGINE.keys.KeyC = false;
      return { at, after:{ susp:+s.susp.toFixed(1), level:s.level, obi:R.obi.state }, secs:+t.toFixed(1) };
    });
    h.log('notice then out of view', JSON.stringify(ev));
    h.assert(ev.at.level === 'notice' && ev.at.obi === 'noticed', 'noticed (his state follows the watcher)');
    h.assert(ev.after.level === 'calm' && ev.after.obi === 'unaware' && ev.after.susp < 5, 'out of his view he settles back to his call');
    const evd = await L.ev(h, 'evaded'), calm = (await L.ev(h, 'seen')).filter(e => e[1].level === 'calm');
    h.log('evaded', JSON.stringify(evd.map(e => e[1])));
    h.assert(evd.length === 1 && evd[0][1].who === 'obi' && evd[0][1].enc === 'm3_obi' && evd[0][1].entry === 'quiet', 'one evaded{who:obi} with logExtra');
    h.assert(!calm.length, 'no seen{level:calm} (DESIGN §4)');

    // ---------- an overlay open 5 s freezes him ----------
    const fr = await h.ev(() => {
      const R = TAC.m3.run(), s = R.w.state;
      __m3.walk([[0.5,2.6],[1.3,1.6]], 1.55, { stop:() => s.susp > 20 });
      const before = { susp:s.susp, t:R.t, obi:R.obi.state };
      showOverlay('screen-pause');
      __m3.run(5);
      const during = { susp:s.susp, t:R.t, obi:R.obi.state };
      showOverlay(null);
      return { before, during };
    });
    h.log('overlay', JSON.stringify(fr));
    h.assert(fr.during.susp === fr.before.susp && fr.during.t === fr.before.t && fr.during.obi === fr.before.obi, 'an overlay open 5 s: suspicion, the house clock and Obi frozen');
    h.assert(!h.errors.length, 'no page errors: ' + h.errors.join(' | '));
  } finally { await L.restore(h); }
};
