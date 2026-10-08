// Chase · the runner only gets away after 20 s more than 14 m off (the clock drains at 2× back in
// range, and shows in the chase meter); at the end of his path he stalls, then keeps running through
// the lanes while you're on him — no escape at the path's end. The escape keeps the original outcome
// (KC hidden, LOST HIM, the escaped dialogue). Deterministic 60 Hz stepping.
const lib = require('./wayfind_lib.cjs');

module.exports = async h => {
  // ---- 20 s out of range → escape ----
  await lib.start(h, 'm2', { completed: ['m0', 'm1'] });
  await lib.frozenClock(h);
  await lib.stepper(h);
  await lib.marketChase(h);
  let s = await h.ev(() => {
    const far = () => { ENGINE.player.position.x = -20; ENGINE.player.position.z = 20; };
    __wf.run(10, far);
    const c = CHASE.active, m10 = { label: document.querySelector('#meter-chase .pm-label').textContent, val: document.querySelector('#meter-chase .pm-val').textContent, oor: c.oorT };
    __wf.run(9.9, far);
    const a = !!CHASE.active, oor = CHASE.active && CHASE.active.oorT;
    const val = document.querySelector('#meter-chase .pm-val').textContent;
    __wf.run(0.3, far);
    return { m10, still: a, oor, val, after: !!CHASE.active, kc: ENGINE._marketKC.visible, dlg: !!document.querySelector('#screen-dialogue.show') };
  });
  h.log('out of range:', JSON.stringify(s));
  h.assert(/LOSING HIM/.test(s.m10.label) && /· 10 s$/.test(s.m10.val), 'meter shows the countdown: ' + JSON.stringify(s.m10));
  h.assert(s.still && s.oor > 19.8 && /· 1 s$/.test(s.val), 'not gone yet at 19.9 s out of range');
  h.assert(!s.after && s.kc === false && s.dlg, 'escaped at 20 s: KC gone, the escaped scene plays');
  await h.shot('wayfind_escape');

  // ---- the clock drains at 2× back in range ----
  await lib.start(h, 'm2', { completed: ['m0', 'm1'] });
  await lib.frozenClock(h);
  await lib.stepper(h);
  await lib.marketChase(h);
  s = await h.ev(() => {
    __wf.run(10, () => { ENGINE.player.position.x = -20; ENGINE.player.position.z = 20; });
    const o1 = CHASE.active.oorT;
    __wf.run(3, () => { const r = CHASE.active.runner.position; ENGINE.player.position.x = r.x; ENGINE.player.position.z = r.z + 6; });
    return { o1, o2: CHASE.active.oorT };
  });
  h.assert(Math.abs(s.o1 - 10) < 0.05 && Math.abs(s.o2 - 4) < 0.1, 'out-of-range clock: 10 s, then −6 s for 3 s in range ' + JSON.stringify(s));

  // ---- in range at the end of the path: he stalls, then runs on through the lanes ----
  await lib.start(h, 'm2', { completed: ['m0', 'm1'] });
  await lib.frozenClock(h);
  await lib.stepper(h);
  await lib.marketChase(h);
  s = await h.ev(() => {
    const c = CHASE.active, keep = () => { const r = c.runner.position; ENGINE.player.position.x = r.x; ENGINE.player.position.z = r.z + 6; };
    let endAt = null, endPos = null, pauseMove = 0, toast = '';
    __wf.run(40, (i, t) => {
      keep();
      if (c.ended && endAt === null) { endAt = t; endPos = { x: c.runner.position.x, z: c.runner.position.z }; toast = document.getElementById('toast') ? document.getElementById('toast').textContent : ''; }
      if (endAt !== null && t - endAt < 1.1) pauseMove = Math.max(pauseMove, Math.hypot(c.runner.position.x - endPos.x, c.runner.position.z - endPos.z));
      if (!CHASE.active) return true;
    });
    return { active: CHASE.active === c, endAt, endPos, pauseMove, nodes: c.path.length, oor: c.oorT, vis: c.runner.visible !== false, toast,
             pos: { x: c.runner.position.x, z: c.runner.position.z }, lanes: c.gNode };
  });
  h.log('path end:', JSON.stringify(s));
  h.assert(s.endAt !== null && Math.abs(s.endPos.x - 12.6) < 0.01 && Math.abs(s.endPos.z + 20.5) < 0.01, 'he reached the old escape point');
  h.assert(s.pauseMove < 1e-6, 'he stalls at the blocked exit (no movement for 1.1 s)');
  h.assert(s.active && s.vis && s.oor === 0, 'no escape at the end of the path while in range (still running after 40 s)');
  h.assert(s.nodes > 12 && s.lanes !== null, 'he keeps running through the lanes (' + s.nodes + ' path nodes)');
  h.assert(s.pos.x > 7.59 && s.pos.x < 12.61 && s.pos.z > -20.51 && s.pos.z < 17.51, 'still in the east stall lanes: ' + JSON.stringify(s.pos));
  h.assert(/DOUBLING BACK/.test(s.toast), 'the dead end is called out: ' + s.toast);
  h.assert(!h.errors.length, 'no page errors');
};
