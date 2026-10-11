// tac_sight: the shared sight-and-noise module (DESIGN §3.2, §4, §5.1; foundations §5.2 cases a–l).
// T.deviceMarket with test watchers (eye 1.5, R 12/6) and T.deviceMansion with Obi's.
// Owner: Team A.
const T = require('./tactics_lib.cjs');

// in-page helpers: a test watcher mesh, a 10 Hz recorder, and an arc walk at radius r around (cx, cz)
const HELP = `
window.__mk = (x, z, yaw) => ({ position:{ x, y:0, z }, rotation:{ y:yaw }, visible:true, userData:{} });
window.__arc = (cx, cz, r, yaw, a0, a1, step) => { const out = []; for (let a = a0; a1 > a0 ? a <= a1 + 1e-9 : a >= a1 - 1e-9; a += step) {
  const t = yaw + a * Math.PI / 180; out.push([+(cx + r * Math.sin(t)).toFixed(3), +(cz + r * Math.cos(t)).toFixed(3)]); } return out; };
window.__hold = (secs, fn) => __wf.run(secs, fn);
// walk the player along pts at v m/s, a full step every frame (no frame lost at a waypoint); onFrame() → true stops
window.__walkPath = (pts, v, onFrame, maxT) => { const P = ENGINE.player.position; let i = 0;
  return __wf.run(maxT || 30, () => {
    if (onFrame && onFrame(i) === true) return true;
    if (i >= pts.length) return true;
    let rem = v / 60;
    while (rem > 1e-9 && i < pts.length) { const dx = pts[i][0] - P.x, dz = pts[i][1] - P.z, d = Math.hypot(dx, dz);
      if (d < 1e-6) { i++; continue; } const st = Math.min(d, rem); P.x += dx / d * st; P.z += dz / d * st; rem -= st; if (st >= d - 1e-9) i++; }
  }); };
// stop the stepper right after a 10 Hz tick, so two runs start in the same phase
window.__align = () => { let t = false; const off = TAC.onTick(() => { t = true; }, { order:99 }); __wf.run(0.3, () => t ? true : undefined); off(); };
`;
const watchKC = `window.__w = TAC.sight.watch({ id:'test', enc:'test', mesh:__mk(8, 4, -Math.PI / 2), eyeH:1.5, range:{ lit:12, dark:6 }, surface:'on the street', logExtra:() => ({ phase:'t' }) });`;

module.exports = async h => {
  await T.deviceMarket(h, { seed:12 });
  await h.ev(src => { eval(src); }, HELP);
  await T.capture(h);
  const full = await h.ev(() => ({ s:TAC.sight.full, g:TAC.geo.full, r:TAC.radio.full, K:TAC.sight.K.fov, real:!!TAC.sight._real }));
  h.assert(full.s && full.g && full.r && full.real && full.K === 100, 'TAC.sight.full, TAC.geo.full and TAC.radio.full are true; K is the kernel\'s');

  // (a) walking upright at 6 m in his cone: notice ≤ 1.3 s, alarm ≤ 3.6 s, seen{sight, clear, standing}
  const a = await h.ev(src => {
    eval(src);
    const P = ENGINE.player.position;
    const pts = __arc(8, 4, 6, -Math.PI / 2, -85, 60, 3);            // starts outside the cone so the walk is up to speed
    P.x = pts[0][0]; P.z = pts[0][1];
    let entry = null, notice = null, alarm = null;
    const off = TAC.onTick(() => { const s = __w.state; if (entry == null && s.parts.sight > 0) entry = __wf.t;
      if (notice == null && s.level !== 'calm') notice = __wf.t; if (alarm == null && s.level === 'alarm') alarm = __wf.t; }, { order:20 });
    __walkPath(pts, 1.55, () => alarm != null, 12);
    off();
    const st = __w.state;
    return { entry, notice:notice - entry, alarm:alarm - entry, why:st.why, whyPast:st.whyPast, level:st.level, glance:st.glance };
  }, watchKC);
  h.log('(a)', JSON.stringify(a));
  h.assert(a.notice <= 1.3 + 1e-6, '(a) notice ≤ 1.3 s after he first sees you (grace: 0.5 s at half rate): ' + a.notice.toFixed(2));
  h.assert(a.alarm <= 3.6 + 1e-6, '(a) alarm ≤ 3.6 s: ' + a.alarm.toFixed(2));
  h.assert(/^He saw you walking 6 m away, standing$/.test(a.whyPast), '(a) the alarm freezes a past-tense line: ' + a.whyPast);
  let ev = await T.events(h, 'seen');
  const sa = ev.map(e => e[1]).filter(e => e.who === 'test');
  h.log('(a) seen', JSON.stringify(sa.map(e => [e.level, e.cause, e.los, e.crouch, e.gait, e.why, e.phase])));
  h.assert(sa.some(e => e.level === 'notice' && e.cause === 'sight' && e.los === 'clear' && e.crouch === false && /standing/.test(e.why) && e.phase === 't'),
    '(a) seen{cause:"sight", los:"clear", crouch:false, why:/standing/} with logExtra merged');
  h.assert(sa.some(e => e.level === 'alarm' && e.why === a.whyPast), '(a) the alarm seen carries the frozen line');
  const fields = ['who', 'enc', 'level', 'cause', 'dist', 'ang', 'los', 'cover', 'crouch', 'gait', 'lit', 'crowd', 'inCone', 'parts', 'peak', 'ms', 'why', 'place', 'px', 'pz', 'obj'];
  h.assert(fields.every(f => f in sa[0]), '(a) seen has every §4 field: ' + fields.filter(f => !(f in sa[0])).join(','));

  // (b) crouched at a counter's z end: los 'low' and 0 gain; standing there gains (a watcher down the lane at (10, −2) facing +z)
  const b = await h.ev(() => {
    __w.unwatch();
    window.__w2 = TAC.sight.watch({ id:'lane', enc:'test', mesh:__mk(10, -2, 0), eyeH:1.5, range:{ lit:12, dark:6 } });
    const spot = [10, 6.2];
    return { free:!blockedAt(spot[0], spot[1]), crouch:TAC.sight.probe('lane', spot[0], spot[1], { crouch:true, gait:'still' }), stand:TAC.sight.probe('lane', spot[0], spot[1], { gait:'still' }),
      crouchMove:TAC.sight.probe('lane', spot[0], spot[1], { crouch:true, gait:'sneak' }) };
  });
  h.log('(b)', JSON.stringify({ free:b.free, crouch:[b.crouch.los, b.crouch.cover, b.crouch.gain], stand:[b.stand.los, b.stand.cover, +b.stand.gain.toFixed(1)] }));
  h.assert(b.free, '(b) the spot at the counter\'s z end is walkable (!blockedAt)');
  h.assert(b.crouch.los === 'low' && b.crouch.gain === 0 && b.crouchMove.gain === 0, '(b) crouched there: los "low", 0 gain (still or creeping)');
  h.assert(b.stand.los === 'clear' && b.stand.gain > 0 && b.stand.cover === 'the stall', '(b) standing there: seen, "standing behind the stall"');

  // (c) crowd: a standing trader on the line within 1.7 m hides you; off the line, or within 3 m of him, doesn't; sprinting there gains
  const c = await h.ev(() => {
    const traders = ENGINE._marketCrowd.slice(0, 6);
    const t0 = traders[0];                                             // the trader at (7.2, −1.5)
    const mk = (id, x, z, yaw) => TAC.sight.watch({ id, enc:'test', mesh:__mk(x, z, yaw), eyeH:1.5, range:{ lit:12, dark:6 }, crowd:() => traders });
    mk('crowdA', 7.2, -8, 0); mk('crowdB', 7.2, -3.6, 0);
    const p = (id, x, z, o) => { const s = TAC.sight.probe(id, x, z, o); return { crowd:s.crowd, sight:+s.parts.sight.toFixed(2), los:s.los, d:s.dist }; };
    return { trader:[t0.position.x, t0.position.z],
      onLine:p('crowdA', 7.2, 0, { gait:'walk' }), offLine:p('crowdA', 8.6, -1.5, { gait:'walk' }), near:p('crowdB', 7.2, -1.0, { gait:'walk' }),
      sprint:p('crowdA', 7.2, 0, { gait:'sprint' }), free:[!blockedAt(7.2, 0), !blockedAt(8.6, -1.5), !blockedAt(7.2, -1.0)] };
  });
  h.log('(c)', JSON.stringify(c));
  h.assert(c.trader[0] === 7.2 && c.trader[1] === -1.5 && c.free.every(Boolean), '(c) the trader at (7.2, −1.5), spots walkable');
  h.assert(c.onLine.crowd && c.onLine.sight === 0, '(c) within 1.7 m of a standing trader on the line: no sight gain');
  h.assert(!c.offLine.crowd && c.offLine.sight > 0, '(c) a trader beside you but off the line doesn\'t hide you');
  h.assert(!c.near.crowd && c.near.sight > 0, '(c) within 3 m of the watcher the crowd doesn\'t hide you');
  h.assert(!c.sprint.crowd && c.sprint.sight > 0, '(c) sprinting there gains');

  // (d) sprinting 6 m behind: cause noise; sneaking there: 0 (real ticks, the measured gait)
  await T.capture(h);
  const d = await h.ev(src => {
    TAC.sight.watchers().forEach(w => w.unwatch()); eval(src);
    const P = ENGINE.player.position, run = (speed, crouch, settle) => {
      P.x = 14; P.z = 1.5; ENGINE.keys.KeyC = !!crouch; __wf.run(0.5); __w.reset(0);   // placed, then settled: the speed meter reads still
      let peak = 0, cause = null, maxNoise = 0;
      const off = TAC.onTick(() => { const s = __w.state; peak = Math.max(peak, s.susp); if (s.parts.noise > maxNoise) { maxNoise = s.parts.noise; cause = s.cause; } }, { order:20 });
      __wf.run(1.4, () => { P.z += speed / 60; }); off();
      const r = { peak:+peak.toFixed(2), cause, why:__w.state.why, gait:__w.state.gait, inCone:__w.state.inCone, noise:+maxNoise.toFixed(1) };
      // then stand still and silent: once nothing has gained for a second the line says why it drains
      if (settle) { __wf.run(settle); const d = document.querySelector('#eye-ind .eye-why'); r.after = { why:__w.state.why, dom:d ? d.textContent : null, susp:+__w.state.susp.toFixed(1), cause:__w.state.cause }; }
      ENGINE.keys.KeyC = false; return r;
    };
    return { sprint:run(5.2, false, 1.4), sneak:run(1.25, true), walk:run(1.55, false) };
  }, watchKC);
  h.log('(d)', JSON.stringify(d));
  h.assert(d.sprint.cause === 'noise' && d.sprint.peak > 0 && !d.sprint.inCone && d.sprint.gait === 'sprint', '(d) sprinting 6 m behind him: cause noise');
  h.assert(/^He can hear you sprinting behind him on the street$/.test(d.sprint.why), '(d) the why-line: ' + d.sprint.why);
  h.assert(d.sneak.peak === 0 && d.walk.peak === 0, '(d) sneaking (or walking) 6 m behind him: 0');
  h.assert(d.sprint.after.cause === null && d.sprint.after.susp > 0.5 && !/can (see|hear)/.test(d.sprint.after.why) && d.sprint.after.why === 'He lost track of you — you went quiet' && d.sprint.after.dom === d.sprint.after.why,
    '(d) standing still and silent after the sprint, the eye stops saying he can hear you: ' + JSON.stringify(d.sprint.after));
  h.assert(d.sneak.why === '' && d.walk.why === '', '(d) a watcher reset to 0 that gains nothing has no line left over from the sprint');

  // (e) dark: no gain at 8 m in his cone; lit there gains
  const e = await h.ev(() => { TAC.sight.lights({ ambient:'dark' }); const dark = TAC.sight.probe('test', 0, 4, { gait:'walk' });
    TAC.sight.lights({ ambient:'lit' }); const lit = TAC.sight.probe('test', 0, 4, { gait:'walk' });
    TAC.sight.lights({ ambient:'dark', lamps:[[0, 4, 2]] }); const lamp = TAC.sight.probe('test', 0, 4, { gait:'walk' }); TAC.sight.lights({});
    return { dark:[dark.gain, dark.inRange, dark.lit], lit:+lit.gain.toFixed(2), lamp:+lamp.gain.toFixed(2) }; });
  h.log('(e)', JSON.stringify(e));
  h.assert(e.dark[0] === 0 && e.dark[1] === false && e.dark[2] === 'dark' && e.lit > 0 && e.lamp > 0, '(e) dark: no gain at 8 m (range 6); lit, or under a lamp, gains');

  // (f) an overlay open 5 s leaves susp unchanged
  const f = await h.ev(() => { const P = ENGINE.player.position; P.x = 2; P.z = 4; __w.reset(50); __wf.run(0.2);
    const s0 = __w.state.susp; showOverlay('screen-pause'); __wf.run(5); const s1 = __w.state.susp; showOverlay(null); __wf.run(0.1);
    return { s0:+s0.toFixed(3), s1:+s1.toFixed(3), after:+__w.state.susp.toFixed(3) }; });
  h.log('(f)', JSON.stringify(f));
  h.assert(f.s0 === f.s1 && f.after > f.s1, '(f) an overlay open 5 s leaves suspicion unchanged (it moves again after)');

  // (g) notice, then crouching behind cover, drains to 0 with evaded{how:'cover'}
  await T.capture(h);
  const g = await h.ev(() => {
    TAC.sight.watchers().forEach(w => w.unwatch());
    const w = TAC.sight.watch({ id:'lane', enc:'test', mesh:__mk(10, -2, 0), eyeH:1.5, range:{ lit:12, dark:6 }, logExtra:() => ({ phase:'g' }) });
    const P = ENGINE.player.position; P.x = 10; P.z = 6.2;
    __wf.run(6, () => w.state.level === 'notice');
    const atNotice = w.state.susp, whyNotice = w.state.why;
    ENGINE.keys.KeyC = true;
    // the line under the eye on every tick of the drain: [s since the crouch, state.why, the DOM text, susp, cause]
    const t0 = __wf.t, lines = [];
    const off = TAC.onTick(() => { const d = document.querySelector('#eye-ind .eye-why'), on = document.getElementById('eye-ind').classList.contains('show');
      lines.push([+(__wf.t - t0).toFixed(2), w.state.why, on && d ? d.textContent : null, +w.state.susp.toFixed(1), w.state.cause]); }, { order:20 });
    __wf.run(10, () => w.state.susp === 0);
    off();
    ENGINE.keys.KeyC = false;
    return { atNotice:+atNotice.toFixed(1), whyNotice, end:w.state.susp, level:w.state.level, why:w.state.why, peak:w.state.peak, lines };
  });
  h.log('(g) drain lines', JSON.stringify(g.lines.filter((x, i) => i % 5 === 0 || i === g.lines.length - 1)));
  const late = g.lines.filter(x => x[0] >= 1.05 && x[3] > 0.5);
  h.assert(/^He can see you .*standing behind the stall$/.test(g.whyNotice), '(g) at the notice he can see you standing behind the stall: ' + g.whyNotice);
  h.assert(late.length > 20 && late.every(x => x[4] === null && !/can (see|hear)/.test(x[1]) && x[2] === x[1]),
    '(g) a second after the crouch, and for the rest of the drain, the eye no longer says he can see you: ' + JSON.stringify(late.filter(x => /can (see|hear)/.test(x[1]) || x[2] !== x[1]).slice(0, 3)));
  h.assert(late.every(x => x[1] === 'He lost sight of you — crouched behind the stall'), '(g) it says why it drains: "He lost sight of you — crouched behind the stall"');
  h.assert(g.lines.filter(x => x[0] < 0.95).every(x => /^He can see you/.test(x[1])), '(g) for the first second the line still names the last cause (foundations §3.7: the last 1 s)');
  ev = (await T.events(h)).map(x => x[1] && Object.assign({ type:x[0] }, x[1])).filter(x => x.type === 'evaded' || x.type === 'seen');
  h.log('(g)', JSON.stringify(g), JSON.stringify(ev.map(x => [x.type, x.level || x.how, x.crouchPct, x.mix, x.phase])));
  const evd = ev.filter(x => x.type === 'evaded');
  h.assert(g.atNotice >= 35 && g.end === 0 && g.level === 'calm' && g.why === '', '(g) noticed, then crouched behind the counter, he loses you (0), and the line is cleared');
  h.assert(evd.length === 1 && evd[0].how === 'cover' && evd[0].crouchPct === 100 && evd[0].phase === 'g' && typeof evd[0].secs === 'number' && evd[0].mix && evd[0].mix.cover === 1,
    '(g) one evaded{how:"cover", crouchPct:100, mix} with logExtra');

  // (h) the rate: story ×0.6, Grey Man ×0.65, hard = standard
  const hr = await h.ev(() => {
    const at = () => TAC.sight.probe('lane', 10, 3, { gait:'walk' }).parts.sight;
    const d0 = SETTINGS.difficulty, sk = S.player.skills.slice();
    SETTINGS.difficulty = 'standard'; const std = at();
    SETTINGS.difficulty = 'story'; const story = at();
    SETTINGS.difficulty = 'hard'; const hard = at();
    SETTINGS.difficulty = 'standard'; S.player.skills.push('greyman'); const gm = at(); const rate = TAC.sight.rate();
    S.player.skills = sk; SETTINGS.difficulty = d0;
    return { story:+(story / std).toFixed(3), hard:+(hard / std).toFixed(3), gm:+(gm / std).toFixed(3), rate };
  });
  h.log('(h)', JSON.stringify(hr));
  h.assert(hr.story === 0.6 && hr.hard === 1 && hr.gm === 0.65 && hr.rate === 0.65, '(h) story ×0.6, Grey Man ×0.65, hard = standard');

  // (i) per-metre parity: the same 8 m path at 1.55 and 3.0 m/s ends within 10 %; desktop and touch give the same
  const par = await h.ev(src => {
    TAC.sight.watchers().forEach(w => w.unwatch());
    window.__w = TAC.sight.watch({ id:'par', enc:'test', mesh:__mk(8, 4, -Math.PI / 2), eyeH:1.5, range:{ lit:12, dark:6 }, attention:() => 0.35 });
    const P = ENGINE.player.position;
    const lead = __arc(8, 4, 10, -Math.PI / 2, -80, -55, 1), path = __arc(8, 4, 10, -Math.PI / 2, -45, 1, 1);   // 8.0 m inside the cone
    let len = 0; for (let k = 1; k < path.length; k++) len += Math.hypot(path[k][0] - path[k - 1][0], path[k][1] - path[k - 1][1]);
    const walk = v => {
      P.x = lead[0][0]; P.z = lead[0][1]; __wf.run(3); __w.reset(0); __align();   // placed out of his cone, unseen 3 s (fresh grace), same tick phase
      let susp0 = null;
      __walkPath(lead.concat(path), v, i => { if (susp0 == null && i >= lead.length) susp0 = __w.state.susp; });
      return { s0:susp0, s:+__w.state.susp.toFixed(2) };
    };
    const slow = walk(1.55), fast = walk(3.0);
    const touch = document.body.classList.contains('touch-active');
    document.body.classList.toggle('touch-active', !touch); const other = walk(1.55); document.body.classList.toggle('touch-active', touch);
    return { len:+len.toFixed(2), slow, fast, other };
  });
  h.log('(i)', JSON.stringify(par));
  h.assert(Math.abs(par.len - 8) < 0.15 && par.slow.s0 === 0 && par.fast.s0 === 0, '(i) an 8 m path, entered unseen');
  h.assert(par.slow.s > 10 && Math.abs(par.fast.s - par.slow.s) / par.slow.s <= 0.10, `(i) the same suspicion per metre: ${par.slow.s} at 1.55 m/s vs ${par.fast.s} at 3.0 m/s`);
  h.assert(par.other.s === par.slow.s, '(i) desktop and touch give the same gain');

  // (j) reset(v, {cause}) emits exactly one seen; an alarm unlatches after alarmHold (6 s) unseen
  await T.capture(h);
  const j = await h.ev(() => {
    const w = __w, P = ENGINE.player.position; P.x = 30; P.z = 30; w.reset(0); __wf.run(0.2);
    w.reset(45, { cause:'scan' });
    const n1 = w.state.level;
    w.reset(100, { cause:'fumble', why:'He saw you fumble his phone' });
    const n2 = { level:w.state.level, whyPast:w.state.whyPast };
    __wf.run(5.8); const latched = { level:w.state.level, susp:w.state.susp };
    __wf.run(0.5); const unlatched = { level:w.state.level, susp:+w.state.susp.toFixed(2) };
    __wf.run(3); const decaying = +w.state.susp.toFixed(2);
    __wf.run(14, () => w.state.susp === 0);
    const calm = w.state.level;
    w.reset(40, { cause:'tunde', quiet:true }); const q = w.state.level; __wf.run(12);
    return { n1, n2, latched, unlatched, decaying, calm, q, end:+w.state.susp.toFixed(2) };
  });
  ev = (await T.events(h)).filter(x => x[0] === 'seen' || x[0] === 'evaded').map(x => [x[0], x[1].level || x[1].how, x[1].cause, x[1].why]);
  h.log('(j)', JSON.stringify(j), JSON.stringify(ev));
  h.assert(j.n1 === 'notice' && ev.filter(x => x[2] === 'scan').length === 1, '(j) reset(45, {cause:"scan"}) emits exactly one seen');
  h.assert(j.n2.level === 'alarm' && j.n2.whyPast === 'He saw you fumble his phone' && ev.filter(x => x[2] === 'fumble' && x[1] === 'alarm').length === 1, '(j) reset(100, {cause, why}): one alarm seen with the frozen line');
  h.assert(j.latched.level === 'alarm' && j.latched.susp === 100 && j.unlatched.level === 'notice' && j.unlatched.susp <= 99 && j.decaying < j.unlatched.susp, '(j) alarmHold: latched for 6 s unseen, then 99 and decaying');
  h.assert(j.calm === 'calm' && j.q === 'notice' && ev.filter(x => x[2] === 'tunde').length === 1 && j.end === 0 && !ev.some(x => x[0] === 'evaded'), '(j) a quiet reset from calm logs its one seen, and its episode never logs an evaded');
  h.assert(ev.filter(x => x[2] === 'scan')[0][3] === null, '(j) a reset with a cause but no why, while he can\'t see you, logs no stale line');

  // (j2) an owner raises the alarm without a line: whyPast is the past tense of what he perceives now, or empty —
  // never the present-tense line (the alarm toast prints whyPast verbatim, DESIGN §3.6)
  await T.capture(h);
  const j2 = await h.ev(() => {
    const w = TAC.sight.watch({ id:'scanA', enc:'test', mesh:__mk(8, 4, -Math.PI / 2), eyeH:1.5, range:{ lit:12, dark:6 } });
    const P = ENGINE.player.position; P.x = 2.5; P.z = 4; __wf.run(0.5); w.reset(0);
    __wf.run(6, () => w.state.level === 'notice');
    const before = w.state.why;
    w.reset(100, { cause:'scan' });
    const hot = { level:w.state.level, why:w.state.why, whyPast:w.state.whyPast };
    const cold = TAC.sight.watch({ id:'scanB', enc:'test', mesh:__mk(30, 30, 0), eyeH:1.6 });
    cold.reset(100, { cause:'scan' });
    const r = { before, hot, cold:{ level:cold.state.level, whyPast:cold.state.whyPast } };
    w.unwatch(); cold.unwatch(); return r;
  });
  const sj2 = (await T.events(h, 'seen')).map(e => e[1]).filter(e => /^scan[AB]$/.test(e.who) && e.level === 'alarm').map(e => [e.who, e.cause, e.why]);
  h.log('(j2)', JSON.stringify(j2), JSON.stringify(sj2));
  h.assert(j2.before === 'He can see you 6 m away, standing' && j2.hot.level === 'alarm' && j2.hot.whyPast === 'He saw you 6 m away, standing',
    '(j2) reset(100, {cause}) without why while he sees you: whyPast is the past tense ("He saw you …"): ' + j2.hot.whyPast);
  h.assert(j2.cold.level === 'alarm' && j2.cold.whyPast === '', '(j2) a watcher that never perceived you: whyPast stays empty');
  h.assert(sj2.length === 2 && sj2[0][2] === j2.hot.whyPast && sj2[1][2] === null, '(j2) the alarm seen carries whyPast (or null): ' + JSON.stringify(sj2));

  // (l) cost: 20k sight tests on the dressed market
  const cost = await h.ev(() => { let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647; const t0 = performance.now(); let n = 0;
    for (let i = 0; i < 20000; i++) { if (TAC.sight.los(-12 + r() * 24, -20 + r() * 40, 1.5, -12 + r() * 24, -20 + r() * 40, r() < 0.5 ? 0.8 : 1.45).clear) n++; }
    const ms = performance.now() - t0; const t1 = performance.now(); for (let i = 0; i < 20000; i++) TAC.sight.probe('par', -12 + r() * 24, -20 + r() * 40, { gait:'walk' }); return { ms:+ms.toFixed(1), clear:n, probeMs:+(performance.now() - t1).toFixed(1) }; });
  h.log('(l) market: 20k sight tests', cost.ms, 'ms (', cost.clear, 'clear ); 20k probes', cost.probeMs, 'ms');
  h.assert(cost.ms < 500, '(l) 20k sight tests in < 500 ms');

  // (k) the mansion: Obi sees the door and the child; the east flank is out of his cone; crouched west of the armchair is hidden
  await T.deviceMansion(h, { seed:3 });
  await h.ev(src => { eval(src); }, HELP);
  const k = await h.ev(() => {
    const obi = ENGINE._mansion.obi;
    TAC.sight.watch({ id:'obi', enc:'m3_obi', mesh:obi, eyeH:1.6, range:{ lit:9, dark:4.5 }, facing:() => -Math.PI / 2, surface:'on the tiles' });
    const p = (x, z, o) => { const s = TAC.sight.probe('obi', x, z, o || { gait:'walk' }); return { seen:s.seen, los:s.los, inCone:s.inCone, ang:s.angle, cover:s.cover, gain:+s.gain.toFixed(1) }; };
    const child = ENGINE._mansion.child.position;
    const t0 = performance.now(); let n = 0; let s = 3; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 20000; i++) if (TAC.sight.los(-5 + r() * 10, -8.5 + r() * 14, 1.6, -5 + r() * 10, -8.5 + r() * 14, 1.45).clear) n++;
    const ms = performance.now() - t0;
    return { door:p(0, 3.6), child:p(child.x + 0.5, child.z + 0.4), flank:p(3.9, 1.5), arm:p(-1.85, -2.45, { gait:'still', crouch:true }), armStand:p(-1.85, -2.45, { gait:'still' }), ms:+ms.toFixed(1),
      ready:TAC.geo.ready(), free:[!blockedAt(-1.85, -2.45), !blockedAt(3.9, 1.5)] };
  });
  await T.restoreArt(h);
  h.log('(k)', JSON.stringify(k));
  h.assert(k.ready && k.door.seen && k.door.inCone && k.door.los === 'clear', '(k) Obi sees the door');
  h.assert(k.child.seen, '(k) Obi sees the child\'s corner of the room');
  h.assert(!k.flank.inCone && !k.flank.seen && k.free[1], '(k) the east flank (3.9, 1.5) is out of his cone');
  h.assert(k.arm.los === 'low' && k.arm.cover === 'the armchair' && !k.arm.seen && k.armStand.seen && k.free[0], '(k) crouched west of the armchair (−1.85, −2.45) is hidden; standing there is not');
  h.log('(l) mansion: 20k sight tests', k.ms, 'ms');
  h.assert(k.ms < 500, '(l) 20k mansion sight tests in < 500 ms');
  h.assert(!h.errors.length, 'no page errors');
};
