// shared helpers for the Case 11 probes (software GL is slow: wait on the game's state, not the clock)
const sc = require('../scen13.js');
const L = module.exports = {};
L.sc = sc;
/* start m11 straight away (no office first); waits for Pa Timi's conversation */
L.start = async function (T, prep) {
  await T.ev(([prep]) => {
    (new Function(prep))();
    V13.s2().hubs = Object.assign(V13.s2().hubs || {}, { skip: 1 });
    V13._skipHubs = true;
    showOverlay(null); loadMission('m11'); beginMission('m11');
  }, [sc.S1DONE + (prep || '')]);
  const ok = await T.until(() => S.game.currentMission === 'm11' && document.getElementById('screen-dialogue').classList.contains('show'), 120000);
  await T.wait(500);
  return ok;
};
L.waitDlg = (T, ms) => T.until(() => document.getElementById('screen-dialogue').classList.contains('show'), ms || 60000);
L.waitFree = (T, ms) => T.until(() => !isOverlayOpen() && !document.querySelector('#title-card.show') && ENGINE.movementEnabled && !ENGINE.seq, ms || 90000);
L.flags = T => T.ev(() => JSON.stringify(Object.fromEntries(Object.entries(S.game.moralChoices || {}).filter(([k]) => /^s2_(timi|samples|felix|camp|barge)$/.test(k)))));
L.ev = T => T.ev(() => ['fuel_samples', 'waybill_book', 'felix_phone', 'barge_track'].map(id => id + ':' + (V13.hasEv(id) ? V13.evQ(id) : '—')).join(' '));
L.phase = T => T.ev(() => V13.rt && V13.rt.phase);
L.ints = T => T.ev(() => ENGINE.interactables.map(i => i.label).join(' | '));
L.eyes = T => T.ev(() => V13.rt.eyes ? +V13.rt.eyes.v.toFixed(2) : null);
/* frames per second, measured over ~3 s of wall time */
L.fps = T => T.ev(() => new Promise(res => { let n = 0; const t0 = performance.now(); (function f(){ n++; if (performance.now() - t0 < 3000) requestAnimationFrame(f); else res(+(n / ((performance.now() - t0) / 1000)).toFixed(1)); })(); }));
/* a screenshot that never aborts the run (a slow software-GL frame can time out) */
L.shot = async (T, name) => {
  for (let i = 0; i < 2; i++) { try { await T.shot(name); return; } catch (e) { await T.wait(1500); } }
  T.log('  (shot failed: ' + name + ')');
};
/* the open document, once it is the one we want */
L.solve = async function (T, key, wrong) {
  const ok = await T.until(key => { const ov = document.getElementById('screen-puzzle'); const h = ov && ov.querySelector('.head h2'); return ov && ov.classList.contains('show') && h && PUZZLES[key] && h.textContent === PUZZLES[key].title && document.querySelector('.v12-opt'); }, 60000, key);
  if (!ok) { T.log('   (document ' + key + ' never opened)'); return false; }
  await T.wait(300);
  await sc.solve(T, key, wrong);
  return true;
};
/* use an interactable once the game is free (teleport beside it, as scen13's use() does) */
L.use = async function (T, re) {
  await L.waitFree(T);
  return sc.use(T, re);
};
/* timi: 0 = source, 1 = cold. route: 'solve' | 'fail' | 'skip' (skip = the flags already name Ekre) */
L.toCamp = async function (T, timi, route) {
  await sc.talk(T, [timi]);
  T.log('  timi →', await L.flags(T));
  if (route !== 'skip') {
    if (route === 'fail') { await L.solve(T, 'm11_route', true); await T.wait(300); await L.solve(T, 'm11_route', true); }
    else await L.solve(T, 'm11_route');
  }
  await L.waitDlg(T, 120000);
  await T.wait(400);
  T.log('  arrive; late =', await T.ev(() => V13.rt.late), 'phase', await L.phase(T));
};
/* stand at a spot facing a point (a teleport, for tests) */
L.put = (T, x, z, fx, fz) => T.ev(([x, z, fx, fz]) => { const P = ENGINE.player; P.position.set(x, 0, z); if (fx != null) { P.rotation.y = Math.atan2(fx - x, fz - z); ENGINE.playerYaw = ENGINE.cameraYaw = P.rotation.y; } }, [x, z, fx, fz]);

/* logic runs: a small, low-graphics window so software GL keeps up (game time is clamped per frame) */
L.fast = async function (T, w, h) {
  await T.page.setViewportSize({ width: w || 640, height: h || 360 });
  await T.ev(() => { if (typeof applyGraphics === 'function') applyGraphics('low'); });
  await T.wait(300);
};

/* wait for the case to reach a phase, and for the screen to be free */
L.waitPhase = async (T, ph, ms) => { await T.until(ph => V13.rt && V13.rt.phase === ph, ms || 300000, ph); return L.waitFree(T, ms || 300000); };

/* A player who reacts `react` seconds (game time) after the chase starts and sprints the obvious way round
   the pit and up the boardwalk after the escort. Armed before the chase begins (so the probe's own round
   trips don't count as reaction time); botResult waits for the end: 'caught' | 'lost', the closest gap. */
L.armBot = async function (T, react) {
  await T.ev((react) => {
    const way = [[-5.0, 5.1], [-4.75, 3.6], [-4.4, 2.0], [0.4, -1.7], [2.0, -7.4], [2.0, -17.6], [15.0, -18.0]];
    const P = ENGINE.player.position;
    const B = window.__bot = { t: 0, k: 0, min: 99, done: false, started: false };
    (function f() {
      const c = V13.rt.chase;
      if (!B.started) {
        if (c) {
          B.started = true; B.from = [+P.x.toFixed(1), +P.z.toFixed(1)]; B.top = +c.speed.toFixed(2); let best = 1e9;
          for (let i = 0; i < 5; i++) { const d = Math.hypot(way[i][0] - P.x, way[i][1] - P.z); if (d < best) { best = d; B.k = i; } }
        }
        requestAnimationFrame(f); return;
      }
      if (!c) { ENGINE.keys.KeyW = false; ENGINE.keys.ShiftLeft = false; B.done = true; return; }
      const dt = Math.min(0.1, ENGINE._dt || 0.016); B.t += dt;
      const r = c.runner.position, gap = Math.hypot(r.x - P.x, r.z - P.z); B.min = Math.min(B.min, gap);
      if (B.t >= react) {
        let tx, tz;
        if (gap < 5 || B.k >= way.length) { tx = r.x; tz = r.z; }
        else { const w = way[B.k]; tx = w[0]; tz = w[1]; if (Math.hypot(tx - P.x, tz - P.z) < 0.7) B.k++; }
        ENGINE.cameraYaw = Math.atan2(tx - P.x, tz - P.z); ENGINE._lastCamDrag = performance.now();
        ENGINE.keys.KeyW = true; ENGINE.keys.ShiftLeft = true; ENGINE.keys.KeyC = false;
      }
      requestAnimationFrame(f);
    })();
  }, react == null ? 0.7 : react);
};
L.botResult = async function (T) {
  await T.until(() => window.__bot && window.__bot.done, 600000);
  return T.ev(() => ({ result: V13.rt.caught ? 'caught' : 'lost', minGap: +window.__bot.min.toFixed(2), t: +window.__bot.t.toFixed(1), from: window.__bot.from, top: window.__bot.top }));
};
