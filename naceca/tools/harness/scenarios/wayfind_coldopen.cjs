// Chase · the cold open's chase you can't win is unchanged (speed × difficulty rate as before, no
// out-of-range clock, no last-seen, ends at the end of its path) but gets the route line and the
// red blip. Plus the catch-chase tuning: hard can't speed KC up, story still slows him, and the
// v12 Pursuit Lines slowdown is modest. Deterministic 60 Hz stepping.
const lib = require('./wayfind_lib.cjs');

module.exports = async h => {
  await lib.start(h, 'm0', { completed: [] });
  await lib.frozenClock(h);
  await lib.stepper(h);
  let s = await h.ev(() => {
    ['co_cross', 'co_follow', 'co_gate'].forEach(completeObjective);
    CO.phase = 5; CO.revealed = true; CO.climbed = true; CO.courier.position.x = 31.8; CO.courier.position.z = -38.8;
    ENGINE.player.position.x = 28.0; ENGINE.player.position.z = -33.0;
    coBeginChase();
    const c = CHASE.active;
    return { catchDist: c.catchDist, speed: c.speed, rate: chaseRate(), line: !!CHASEFX.line, ch: WAY.chase(), lab: WAY.resolve().label };
  });
  h.log('cold open chase:', JSON.stringify(s));
  h.assert(s.catchDist === -1 && Math.abs(s.speed - 6.1 * s.rate) < 1e-9, 'scripted chase speed unchanged (6.1 × difficulty rate)');
  h.assert(s.line && s.ch && s.ch.mode === 'live' && s.ch.catch === false, 'route line and live blip for the scripted chase');
  h.assert(s.lab === "Don't lose him", 'guidance reads the objective, not "Catch …": ' + s.lab);
  s = await h.ev(() => {
    WAY._forceLos = false;
    const far = () => { ENGINE.player.position.x = 0; ENGINE.player.position.z = 0; };
    let maxOor = 0, countdown = false, lastseen = false, t = 0;
    const n = __wf.run(8, (i, tt) => {
      far(); if (!CHASE.active) return true;
      t = tt; maxOor = Math.max(maxOor, CHASE.active.oorT || 0);
      const mv = document.querySelector('#meter-chase .pm-val'); if (mv && / s$/.test(mv.textContent)) countdown = true;
      if (WAY.chase().mode !== 'live') lastseen = true;
    });
    WAY._forceLos = null;
    return { endedAt: n / 60, maxOor, countdown, lastseen, active: !!CHASE.active, line: CHASEFX.line, vis: CO.courier.visible };
  });
  h.log('ran:', JSON.stringify(s));
  h.assert(s.maxOor === 0 && !s.countdown, 'no out-of-range clock on the scripted chase');
  h.assert(!s.lastseen, 'no last-seen switch on the scripted chase');
  h.assert(!s.active && s.endedAt > 5.5 && s.endedAt < 6.6 && s.vis === false, 'it still ends at the end of its path (~6 s): ' + s.endedAt);
  h.assert(s.line === null, 'route line removed when it ends');

  // ---- catch-chase tuning ----
  const kc = async (diff, skills) => {
    await lib.start(h, 'm2', { completed: ['m0', 'm1'] });
    await lib.frozenClock(h);
    return h.ev(([diff, skills]) => {
      SETTINGS.difficulty = diff; (skills || []).forEach(k => S.player.skills.push(k));
      S.game._marketTunde = true; S.game._marketScanned = true;
      ENGINE.player.position.x = 5.8; ENGINE.player.position.z = 4.6;
      ENGINE.interactables.find(i => i.label === 'Confront teen suspect').onInteract();
      const c = CHASE.active, out = { speed: c.speed, catchDist: c.catchDist, stagger: ENGINE._stagger };
      stopChase(); SETTINGS.difficulty = 'standard';
      return out;
    }, [diff, skills]);
  };
  s = await kc('standard');
  h.assert(Math.abs(s.speed - 4.3) < 1e-9 && s.catchDist === 1.9 && Math.abs(s.stagger - 0.5) < 1e-9, 'KC: 4.3 m/s, catch at 1.9 m, 0.5 s stagger ' + JSON.stringify(s));
  s = await kc('hard');
  h.assert(Math.abs(s.speed - 4.3) < 1e-9, 'hard does not speed KC up (rate capped at 1.0): ' + s.speed);
  s = await kc('story');
  h.assert(Math.abs(s.speed - 4.3 * 0.9) < 1e-9, 'story still slows him: ' + s.speed);
  s = await kc('standard', ['pursuit']);
  h.assert(Math.abs(s.speed - 4.3 * 0.95) < 1e-9, 'Pursuit Lines: a modest ×0.95 (was ×0.88): ' + s.speed);
  h.assert(!h.errors.length, 'no page errors');
};
