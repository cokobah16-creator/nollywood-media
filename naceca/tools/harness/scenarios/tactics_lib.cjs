// Shared fixtures for every tac_* / pt_slice_* scenario (run on its own it is a no-op that passes).
// Owner: Team A. Committed in the shared base with src/tactics/tac_api.js; other teams use it, never edit it
// (add helpers in your own tac_m2_lib.cjs / tac_m3_lib.cjs / pt_lib.cjs).
//
//   T.start(h, id, {seed, completed, state, briefings})  seeded, frozen-clock mission start: Math.random is seeded
//                                         and the clock frozen INSIDE the same evaluate that calls loadMission
//   T.seedNow(h, s)                       reseed inside the page (call it in the same h.ev that runs the thing you measure,
//                                         or use window.__tacSeed(s) from inside your own h.ev)
//   T.deviceMarket(h, o)                  M2 with the dressed market's colliders, bounds and ENGINE._dress (what players get)
//   T.deviceMansion(h, o) / T.restoreArt(h)  M3 on the art-pass builder (39 colliders); restoreArt is MANDATORY afterwards
//   T.installLanes(h)                     the frozen lane graph and KC path (no-op once tac_lanes.js has installed them)
//   T.capture(h) / T.events(h, type?)     every V12.log call from now on, as [type, data]
//   T.walk(h, pts, {speed, crouch, sprint}) scripted walk along a polyline with the 60 Hz stepper (ticks TAC)
//   T.pursue(h, o)                        the chase pursuer from the scout's matrix (follow / intercept / stand)
//   T.finishDialogue(h) / T.choose(h, i)  click through the paper dialogue
const lib = require('./wayfind_lib.cjs');
const T = async h => { h.log('tactics_lib: helper module'); };
T.lib = lib;

const SEED_SRC = `window.__tacSeed = function(s){ let a = s >>> 0; Math.random = function(){ a |= 0; a = a + 0x6D2B79F5 | 0;
  let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };`;

T.start = async (h, id, o = {}) => {
  await lib.boot(h);
  const seed = o.seed == null ? null : (o.seed >>> 0);
  const user = o.state ? `(${o.state.toString()})(S);` : '';
  // runs inside h.start's evaluate, right before loadMission
  const src = `${SEED_SRC}
    ${seed == null ? '' : `window.__tacSeed(${seed});`}
    ENGINE.clock = { getDelta(){ return 0; } };
    if (typeof V12 !== 'undefined' && V12.mem) { const m = V12.mem(); m.hubs = m.hubs || {}; ['h1','h2','h3','h4','h5','h6','h7'].forEach(k => { m.hubs[k] = true; }); }
    ${user}`;
  await h.start(id, Object.assign({}, o, { completed:o.completed || defaultCompleted(id), state:new Function('S', src) }));
  await lib.frozenClock(h);
  await lib.stepper(h);
};
const defaultCompleted = id => ({ m2:['m0', 'm1'], m3:['m0', 'm1', 'm2'] })[id] || [];
T.seedNow = (h, s) => h.ev(s => { if (window.__tacSeed) window.__tacSeed(s); }, s);

T.installLanes = h => h.ev(() => (window.TAC && TAC.lanes && TAC.lanes.install) ? (TAC.lanes.install() || TAC.lanes.installed) : false);

// the dressed market: replays dressScene's collision exactly (art_pass_v8.js:1134, 1141-1142, 1145)
T.deviceMarket = async (h, o = {}) => {
  await T.start(h, 'm2', o);
  const r = await h.ev(() => {
    const meta = ART_INLINE.env_market_meta, n0 = ENGINE.obstacles.length;
    for (const ob of meta.obstacles) addObstacle(ob[0], ob[1], ob[2], ob[3]);
    const b = meta.anchors.bounds; ENGINE.bounds = { minX:b.minX, maxX:b.maxX, minZ:b.minZ, maxZ:b.maxZ };
    ENGINE._dress = { key:'market', meta, D:{}, t:0 };
    return { legacy:n0, total:ENGINE.obstacles.length, blockers:(meta.blockers || []).length };
  });
  if (o.lanes !== false) await T.installLanes(h);
  h.assert(r.total === 61 && r.blockers === 27, `deviceMarket: expected 61 obstacles / 27 blockers, got ${r.total} / ${r.blockers}`);
  return r;
};

// the art-pass mansion through the real buildSceneMansion, with the rigs and the baked room stubbed
T.deviceMansion = async (h, o = {}) => {
  await lib.boot(h);
  const r = await h.ev(o => {
    eval(o.seedSrc);
    S = defaultState(); S.game.completedMissions = ['m0', 'm1', 'm2'];
    S.game.intel = { briefed:{ m3:1, m4:1, m5:1, m6:1, m7:1 } };
    if (V12.mem) { const m = V12.mem(); m.hubs = m.hubs || {}; ['h1','h2','h3','h4','h5','h6','h7'].forEach(k => { m.hubs[k] = true; }); }
    if (o.seed != null) window.__tacSeed(o.seed);
    if (o.state) (new Function('S', o.state))(S);
    window.__tacArt = window.__tacArt || { make:PEOPLE.make, updateAll:PEOPLE.updateAll, syncLook:PEOPLE.syncLook, inst:MANSION.instantiate, vf:(typeof VEH !== 'undefined') ? VEH.failed : undefined };
    ART.ready = true; ART.failed = false; ART.promise = null;
    if (typeof VEH !== 'undefined') VEH.failed = true;
    const anim = () => ({ cur:null, play(n){ this.cur = n; }, oneShot(n, then){ this.cur = then || n; }, update(){} });
    PEOPLE.make = function(kind){ const g = kind === 'kelechi' ? buildPlayerMeshLegacy() : buildNPCMesh('#5a3826', '#0b1a3a', '#0a1020', '#0a0a14', {}); g.userData.anim = anim(); g.userData._shim = kind; return g; };
    PEOPLE.updateAll = function(){}; PEOPLE.syncLook = function(){};
    MANSION.instantiate = () => ({ root:new THREE.Group(), dyn:{} });
    ENGINE.clock = { getDelta(){ return 0; } };
    window.__shimErr = null;
    try { showOverlay(null); loadMission('m3'); } catch (e) { window.__shimErr = String(e && e.stack || e).slice(0, 300); }
  }, { seedSrc:SEED_SRC, seed:o.seed == null ? null : o.seed >>> 0, state:o.state ? `(${o.state.toString()})(S)` : null });
  await h.step(600);
  await h.ev(() => { try { if (document.querySelector('#screen-controls.show')) beginMission('m3'); } catch (e) { window.__shimErr = String(e && e.stack || e).slice(0, 300); } });
  await h.step(o.wait || 1200);
  await lib.frozenClock(h);
  await lib.stepper(h);
  const out = await h.ev(() => ({ err:window.__shimErr, v8:!!ENGINE._mansion, obstacles:(ENGINE.obstacles || []).length }));
  h.assert(!out.err, 'deviceMansion: ' + out.err);
  h.assert(out.v8 && out.obstacles === 39, `deviceMansion: expected the art-pass house with 39 obstacles, got v8=${out.v8} n=${out.obstacles}`);
  return out;
};
T.restoreArt = h => h.ev(() => {
  ART.ready = false; ART.failed = true;
  const a = window.__tacArt; if (!a) return;
  PEOPLE.make = a.make; PEOPLE.updateAll = a.updateAll; PEOPLE.syncLook = a.syncLook; MANSION.instantiate = a.inst;
  if (typeof VEH !== 'undefined' && a.vf !== undefined) VEH.failed = a.vf;
});

T.capture = h => h.ev(() => {
  window.__tacEv = [];
  if (!V12.log.__tacCap) { const o = V12.log; const f = function(t, d){ window.__tacEv.push([t, JSON.parse(JSON.stringify(d || {}))]); return o.apply(this, arguments); }; f.__tacCap = true; V12.log = f; }
});
T.events = (h, type) => h.ev(type => (window.__tacEv || []).filter(e => !type || e[0] === type), type || null);

// walk Kelechi along pts at `speed` m/s (60 Hz steps; collisions respected); crouch holds KeyC, sprint holds Shift
T.walk = (h, pts, o = {}) => h.ev(({ pts, o }) => {
  const P = ENGINE.player.position, v = o.speed || 1.55;
  ENGINE.keys.KeyC = !!o.crouch; ENGINE.keys.ShiftLeft = !!o.sprint;
  let i = 0, stuck = 0;
  const n = __wf.run(o.maxT || 60, () => {
    if (i >= pts.length) return true;
    const [tx, tz] = pts[i], dx = tx - P.x, dz = tz - P.z, d = Math.hypot(dx, dz);
    if (d < 0.05) { i++; return false; }
    const s = Math.min(d, v * __wf.dt), nx = P.x + dx / d * s, nz = P.z + dz / d * s, x0 = P.x, z0 = P.z;
    if (!blockedAt(nx, P.z)) P.x = nx; if (!blockedAt(P.x, nz)) P.z = nz;
    ENGINE.player.rotation.y = Math.atan2(dx, dz);
    if (Math.hypot(P.x - x0, P.z - z0) < 1e-4) { if (++stuck > 30) return true; } else stuck = 0;
    if (o.until && (new Function('return (' + o.until + ')'))()) return true;
  });
  if (!o.keep) { ENGINE.keys.KeyC = false; ENGINE.keys.ShiftLeft = false; }
  return { frames:n, at:[+P.x.toFixed(2), +P.z.toFixed(2)], reached:i >= pts.length, stuck:stuck > 30 };
}, { pts, o:Object.assign({}, o, { until:o.until ? String(o.until) : null }) });

// the chase pursuer (scout's matrix sim, m2_lib.cjs): strategy 'follow' | 'intercept' {pt, pastSeg} | 'stand'
T.pursue = (h, o = {}) => h.ev(o => {
  const c = CHASE.active, P = ENGINE.player.position, b = ENGINE.bounds; if (!c) return null;
  const v = o.v || 4.42, delay = o.delay || 0;
  let minGap = 1e9, mode = 'chase', reachedPt = null, ptHold = 0;
  const moveTo = (ax, az) => { const dx = ax - P.x, dz = az - P.z, d = Math.hypot(dx, dz); if (d < 0.05) return;
    const s = Math.min(d, v * (ENGINE.speedMul || 1) * __wf.dt), nx = P.x + dx / d * s, nz = P.z + dz / d * s;
    if (!blockedAt(nx, P.z) && nx > b.minX && nx < b.maxX) P.x = nx; if (!blockedAt(P.x, nz) && nz > b.minZ && nz < b.maxZ) P.z = nz; };
  const follow = () => { const R = c.runner.position, ls = c.fx && c.fx.mode === 'lastseen';
    const pts = WAY.routePoints(c, P, ls && c.fx.ls ? c.fx.ls : R, ls ? c.fx.lsSeg : c.seg);
    let aim = pts[1]; if (pts.length > 2 && Math.hypot(aim.x - P.x, aim.z - P.z) < 0.3) aim = pts[2]; moveTo(aim.x, aim.z); };
  const n = __wf.run(o.maxT || 60, (i, t) => {
    if (!CHASE.active) return true;
    const R = c.runner.position;
    if (i * __wf.dt >= delay) {
      if (o.strategy === 'stand') {}
      else if (o.strategy === 'intercept' && mode === 'chase') {
        const d = Math.hypot(o.pt[0] - P.x, o.pt[1] - P.z);
        if (d > 0.3) moveTo(o.pt[0], o.pt[1]); else { if (reachedPt == null) reachedPt = t; ptHold += __wf.dt; }
        const gap = Math.hypot(R.x - P.x, R.z - P.z);
        if ((reachedPt != null && (gap < 4 || c.seg > o.pastSeg)) || ptHold > (o.holdMax || 8)) mode = 'follow';
      } else follow();
    }
    minGap = Math.min(minGap, Math.hypot(R.x - P.x, R.z - P.z));
  });
  return { caught:!CHASE.active && c.runner.visible !== false, escaped:c.runner.visible === false, active:!!CHASE.active,
    t:+(n / 60).toFixed(2), minGap:+minGap.toFixed(2), bumps:c.bumps || 0, how:c.how || null, by:c.by || null,
    kc:[+c.runner.position.x.toFixed(1), +c.runner.position.z.toFixed(1)] };
}, o);

T.finishDialogue = async h => {
  for (let i = 0; i < 60; i++) {
    const open = await h.ev(() => {
      if (!document.querySelector('#screen-dialogue.show')) return false;
      if (typeof skipTypewriter === 'function') skipTypewriter();
      if (document.querySelector('#dlg-choices button')) return 'choice';
      advanceDialogue(); return true;
    });
    if (!open || open === 'choice') return open;
    await h.step(60);
  }
  return 'timeout';
};
T.choose = async (h, i) => {
  await h.ev(i => { const b = [...document.querySelectorAll('#dlg-choices button')][i]; b.click(); if (b.isConnected && b.classList.contains('armed')) b.click(); }, i);
  await h.step(80);
};
T.overlap = lib.overlap;
module.exports = T;
