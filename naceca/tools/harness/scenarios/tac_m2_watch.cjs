// tac_m2_watch · KC's watcher (DESIGN §5.3; market.md §5.1 (a)-(j)): asleep until Tunde has pointed him out, the phone /
// look-up cycle, what hides you at his counter, the alarm before the scan, pace and Grey Man, Heat and wariness, the
// overlay freeze, and the same suspicion per metre walking or jogging across the road.
const M = require('./tac_m2_lib.cjs');
const T = M.T;

module.exports = async h => {
  // ---- (a) asleep before Tunde: no eye at the spawn for 10 s ----
  await M.boot(h, { seed:5 });
  const a = await h.ev(() => {
    let maxS = 0, act = false, eye = false;
    __wf.run(10, () => { const s = TAC.m2.kc().state; maxS = Math.max(maxS, s.susp); act = act || s.active; eye = eye || document.body.classList.contains('tac-eye') || !!document.querySelector('#eye-ind.show'); });
    return { maxS, act, eye, P:[ENGINE.player.position.x, ENGINE.player.position.z] };
  });
  h.log('(a) before Tunde', JSON.stringify(a));
  h.assert(!a.act && a.maxS === 0 && !a.eye, '(a) the watcher sleeps until Tunde has pointed him out: no eye at the spawn for 10 s');

  // ---- (b) the first look-up 4.6 s after the conversation (met unseen, on the stall side) ----
  await M.tunde(h, { at:[-8, -2], choice:0 });
  const b = await h.ev(() => {
    const P = ENGINE.player.position; P.x = -12; P.z = -12;                // out of his sight and earshot
    let t = null; const R = TAC.m2.run(), t0 = __wf.t;
    __wf.run(8, (i, tt) => { if (t == null && R.phase === 'lookup') t = +(tt - t0).toFixed(2); });
    return { t, awake:R.awake, wary:R.wary, level:TAC.m2.kc().state.level };
  });
  h.log('(b) first look-up', JSON.stringify(b));
  h.assert(b.awake && !b.wary && b.level === 'calm', '(b) awake, calm and not wary after an unseen meeting');
  h.assert(b.t != null && Math.abs(b.t - 4.6) <= 0.15, '(b) the first look-up comes 4.6 s after the conversation: ' + b.t);

  // ---- (c) the counter front: 9-14 /s head down, 30-50 /s looking up; seen{sight} "by his counter" ----
  await T.capture(h);
  const c = await h.ev(() => {
    TAC.m2.setPhase('phone', 30);
    const ph = TAC.sight.probe('kc', 5.6, 4.0, { gait:'still' });
    TAC.m2.setPhase('lookup', 30);
    const lu = TAC.sight.probe('kc', 5.6, 4.0, { gait:'still' });
    const P = ENGINE.player.position; P.x = 5.6; P.z = 4.0; TAC.player._reset();
    let lv = null; __wf.run(6, () => { lv = TAC.m2.kc().state.level; if (lv !== 'calm') return true; });
    return { phone:+ph.parts.sight.toFixed(1), look:+lu.parts.sight.toFixed(1), lv };
  });
  let seen = await T.events(h, 'seen');
  h.log('(c) counter', JSON.stringify(c), JSON.stringify(seen.map(e => [e[1].level, e[1].cause, e[1].why])));
  h.assert(c.phone >= 9 && c.phone <= 14, '(c) head down at the counter front: 9-14 /s, got ' + c.phone);
  h.assert(c.look >= 30 && c.look <= 50, '(c) looking up: 30-50 /s, got ' + c.look);
  h.assert(seen.some(e => e[1].who === 'kc' && e[1].cause === 'sight' && /by his counter/.test(e[1].why || '')), '(c) seen logs cause sight with a why-line "by his counter"');
  h.assert(seen.every(e => e[1].phase && 'scanned' in e[1] && 'post' in e[1]), '(c) seen carries logExtra: phase, scanned, post');

  // ---- (d) beside and behind him: no sight gain in either phase; noise and close ----
  const d = await h.ev(() => {
    const out = {};
    for (const ph of ['phone', 'lookup']) {
      TAC.m2.setPhase(ph, 30);
      for (const [nm, x, z] of [['side', 7.5, 2.1], ['behind', 9.2, 3.6]]) for (const g of ['still', 'sneak']) {
        const p = TAC.sight.probe('kc', x, z, { gait:g, crouch:g === 'sneak' }); out[ph + ':' + nm + ':' + g] = +p.parts.sight.toFixed(2);
      }
    }
    TAC.m2.kc().reset(0); TAC.m2.setPhase('phone', 30);
    const walkSide = TAC.sight.probe('kc', 7.5, 2.1, { gait:'walk' });
    const close = TAC.sight.probe('kc', 8.0, 3.1, { gait:'walk' });
    out.noise = +walkSide.parts.noise.toFixed(2); out.noiseCause = walkSide.cause; out.closeCause = close.cause; out.closeDist = close.dist;
    return out;
  });
  h.log('(d) side/behind', JSON.stringify(d));
  h.assert(Object.keys(d).filter(k => /:(still|sneak)$/.test(k)).every(k => d[k] === 0), '(d) beside or behind him, still or sneaking: no sight gain in either phase');
  h.assert(d.noise > 0 && d.noise < 7 && d.noiseCause === 'noise', '(d) walking beside him at 1.96 m: noise under 7 /s, got ' + d.noise);
  h.assert(d.closeCause === 'close', '(d) 0.9 m from him walking: close');

  // ---- (e) a trader between you and him: no gain (standing traders are his crowd) ----
  const e = await h.ev(() => {
    TAC.m2.setPhase('lookup', 30);
    const tr = ENGINE._marketCrowd.find(m => !m.userData.target);
    const x0 = tr.position.x, z0 = tr.position.z;
    const bare = TAC.sight.probe('kc', 2.0, 4.6, { gait:'still' });
    tr.position.x = 2.9; tr.position.z = 4.4;
    const hid = TAC.sight.probe('kc', 2.0, 4.6, { gait:'still' });
    const wand = ENGINE._marketCrowd.find(m => m.userData.target);
    tr.position.x = x0; tr.position.z = z0;
    const wx = wand.position.x, wz = wand.position.z; wand.position.x = 2.9; wand.position.z = 4.4;
    const byWanderer = TAC.sight.probe('kc', 2.0, 4.6, { gait:'still' });
    wand.position.x = wx; wand.position.z = wz;
    return { bare:+bare.parts.sight.toFixed(1), hid:+hid.parts.sight.toFixed(1), crowd:hid.crowd, dist:hid.dist, wand:+byWanderer.parts.sight.toFixed(1) };
  });
  h.log('(e) crowd', JSON.stringify(e));
  h.assert(e.bare > 0 && e.hid === 0 && e.crowd && Math.abs(e.dist - 6) < 0.3, '(e) within 1.7 m of a standing trader at 6 m in his cone: no gain');
  h.assert(e.wand > 0, '(e) a wandering shopper is not cover (standing traders only)');

  // ---- (f) sprinting 8 m behind: he hears you ----
  const f = await h.ev(() => { const p = TAC.sight.probe('kc', 16, 4, { gait:'sprint' }); return { cause:p.cause, noise:+p.parts.noise.toFixed(2), sight:p.parts.sight }; });
  h.log('(f) sprint behind', JSON.stringify(f));
  h.assert(f.cause === 'noise' && f.noise > 0 && f.sight === 0, '(f) sprinting 8 m behind him: cause noise');

  // ---- (g) an alarm before the scan: no chase; after 4 s unseen he settles at 50 ----
  await T.capture(h);
  const g = await h.ev(() => {
    S.game._marketScanned = false;
    TAC.m2.setPhase('lookup', 30);
    const P = ENGINE.player.position; P.x = 5.6; P.z = 4.0; TAC.player._reset();
    let alarmAt = null;
    __wf.run(8, (i, t) => { if (TAC.m2.kc().state.level === 'alarm'){ alarmAt = t; return true; } });
    P.x = 20; P.z = 16; TAC.player._reset();
    let chase = false;
    __wf.run(3.85, () => { chase = chase || !!CHASE.active; });
    const at385 = TAC.m2.kc().state.susp;
    __wf.run(0.3, () => { chase = chase || !!CHASE.active; });
    return { alarmAt, chase, at385, after:TAC.m2.kc().state.susp, level:TAC.m2.kc().state.level };
  });
  h.log('(g) pre-scan alarm', JSON.stringify(g));
  h.assert(g.alarmAt != null && !g.chase, '(g) an alarm before the scan does not start a chase');
  h.assert(g.at385 === 100 && g.after <= 50 && g.level === 'notice', '(g) after 4.0 s unseen he settles at 50 (and drains from there)');
  const ev = await T.events(h, 'evaded');
  h.assert(!ev.length, '(g) the settle is quiet: no evaded');

  // ---- (h) story ×0.6, Grey Man ×0.65, hard = standard ----
  const hh = await h.ev(() => {
    TAC.m2.kc().reset(0); TAC.m2.setPhase('lookup', 30);
    const gain = () => TAC.sight.probe('kc', 3, 4, { gait:'walk' }).parts.sight;
    const std = gain();
    SETTINGS.difficulty = 'story'; const story = gain();
    SETTINGS.difficulty = 'hard'; const hard = gain();
    SETTINGS.difficulty = 'standard';
    S.player.skills.push('greyman'); const gm = gain(); S.player.skills = S.player.skills.filter(k => k !== 'greyman');
    return { story:+(story / std).toFixed(3), hard:+(hard / std).toFixed(3), gm:+(gm / std).toFixed(3) };
  });
  h.log('(h) rate', JSON.stringify(hh));
  h.assert(hh.story === 0.6 && hh.hard === 1 && hh.gm === 0.65, '(h) story ×0.6, hard = standard, Grey Man ×0.65');

  // ---- (i) Heat 100: phone phases ×0.75 and look-ups of 2.2 s; wary does the same at any Heat; the larger wins ----
  const i = await h.ev(() => {
    const R = TAC.m2.run(), P = ENGINE.player.position; P.x = -12; P.z = -12; TAC.player._reset();
    TAC.m2.kc().reset(0);
    const cycle = () => { R.cyc = 0; TAC.m2.setPhase('phone'); const out = []; let ph = R.phase, t0 = __wf.t;
      __wf.run(30, (k, t) => { if (R.phase !== ph){ out.push([ph, +(t - t0).toFixed(2)]); ph = R.phase; t0 = t; } if (out.length >= 6) return true; }); return out; };
    const base = cycle();
    S.player.reputation.underworldHeat = 100; const hot = cycle();
    S.player.reputation.underworldHeat = 20; R.wary = true; const wary = cycle();
    S.player.reputation.underworldHeat = 75; const both = cycle();
    R.wary = false; S.player.reputation.underworldHeat = 20;
    return { base, hot, wary, both };
  });
  h.log('(i) cycles', JSON.stringify(i));
  const phones = c => c.filter(x => x[0] === 'phone').map(x => x[1]), looks = c => c.filter(x => x[0] === 'lookup').map(x => x[1]);
  const near = (a, b) => Math.abs(a - b) <= 0.11;
  h.assert(near(phones(i.base)[0], 4.6) && near(phones(i.base)[1], 5.4) && near(phones(i.base)[2], 4.2) && looks(i.base).every(x => near(x, 1.8)), '(i) the cycle: phone 4.6 / 5.4 / 4.2 s, look-ups 1.8 s');
  h.assert(phones(i.hot).every((x, k) => x <= [4.6, 5.4, 4.2][k] * 0.75 + 0.11) && looks(i.hot).every(x => near(x, 2.2)), '(i) Heat 100: phone phases ×0.75, look-ups 2.2 s');
  h.assert(phones(i.wary).every((x, k) => near(x, [4.6, 5.4, 4.2][k] * 0.75)) && looks(i.wary).every(x => near(x, 2.2)), '(wary) phone ×0.75, look-up +0.4 s');
  h.assert(phones(i.both).every((x, k) => near(x, [4.6, 5.4, 4.2][k] * 0.75)) && looks(i.both).every(x => near(x, 2.2)), '(wary + Heat 75) the larger of the two');

  // ---- (j) an overlay open for 5 s freezes the phase timer ----
  const j = await h.ev(() => {
    const R = TAC.m2.run(); TAC.m2.setPhase('phone', 4);
    __wf.run(0.5); const t0 = R.phaseT;
    showOverlay('screen-pause'); __wf.run(5); const t1 = R.phaseT; showOverlay(null);
    __wf.run(0.5); const t2 = R.phaseT;
    return { t0, t1, t2 };
  });
  h.log('(j) overlay', JSON.stringify(j));
  h.assert(Math.abs(j.t0 - j.t1) < 1e-9 && j.t2 < j.t1, '(j) an overlay freezes the phase timer');

  // ---- per metre: walking and jogging the road crossing build the same suspicion (±10%) ----
  const pm = await h.ev(() => {
    const R = TAC.m2.run(), w = TAC.m2.kc(), P = ENGINE.player.position;
    const cross = v => {
      w.reset(0); TAC.m2.setPhase('phone', 60);
      P.x = -8; P.z = 8; TAC.player._reset(); __wf.run(2.5);              // out of range, unseen: the grace is spent the same way
      let s0 = null, s1 = null;
      __wf.run(20, () => {
        P.x += v * __wf.dt;
        if (s0 == null && P.x >= -1) s0 = w.state.susp;
        if (s1 == null && P.x >= 3){ s1 = w.state.susp; return true; }
      });
      return +(s1 - s0).toFixed(2);
    };
    const walk = cross(1.55), jog = cross(3.0);
    return { walk, jog, ratio:+(jog / walk).toFixed(3), level:w.state.level };
  });
  h.log('per metre', JSON.stringify(pm));
  h.assert(pm.walk > 2 && Math.abs(pm.ratio - 1) <= 0.1, 'walking and jogging the road crossing give the same suspicion per metre (±10%): ' + pm.ratio);

  // ---- KC is the layer's to turn while watched: base facing + sweep + the module's glance; his idle is 'idle' ----
  const k = await h.ev(() => {
    const R = TAC.m2.run(), K = ENGINE._marketKC; TAC.m2.setPhase('lookup', 1.8); __wf.run(0.45);
    const w = TAC.m2.kc();
    return { ry:K.rotation.y, want:-Math.PI / 2 + 0.15 * Math.sin(2 * Math.PI * (1 - R.phaseT / R.phaseLen)) + w.state.glance, idle:K.userData._idle };
  });
  h.assert(Math.abs(k.ry - k.want) < 0.02 && k.idle === 'idle', 'KC renders facing() + glance while watched, idle "idle": ' + JSON.stringify(k));
  // ---- the Recruit chips (TAC.hint): none on Senior; on Recruit tac_m2_post after 20 s unposted, tac_m2_side within 6 m in his cone ----
  const senior = await h.ev(() => Object.keys(S.game._hints || {}).filter(k => /^tac_m2_/.test(k)));
  h.assert(senior.length === 0, 'Senior Agent: no tac_m2_* chip, though he stood in KC\'s cone within 6 m and never posted Uche: ' + senior.join());
  await M.boot(h, { seed:6, state:S => { S.game.difficulty = 'recruit'; } });
  await M.tunde(h, { at:[-8, -2], choice:0 });
  const rc = await h.ev(() => {
    const P = ENGINE.player.position; P.x = -12; P.z = -12; TAC.player._reset();
    __wf.run(19.5); const early = !!(S.game._hints || {}).tac_m2_post;
    __wf.run(1.0); const post = !!(S.game._hints || {}).tac_m2_post, chip1 = (document.querySelector('#hint-chip .hc-text') || {}).textContent;
    P.x = 4; P.z = 4.5; TAC.player._reset(); __wf.run(0.3);
    return { early, post, chip1, side:!!(S.game._hints || {}).tac_m2_side, chip2:(document.querySelector('#hint-chip .hc-text') || {}).textContent, shown:TAC.hintsShown.slice() };
  });
  h.log('recruit chips', JSON.stringify(rc));
  h.assert(!rc.early && rc.post && /Post Sgt\. Uche before you move/.test(rc.chip1), 'Recruit: tac_m2_post after 20 s unposted');
  h.assert(rc.side && rc.shown.includes('tac_m2_side'), 'Recruit: tac_m2_side the first time within 6 m in his cone');
  h.assert(!h.errors.length, 'no page errors: ' + h.errors.join(' | '));
};
