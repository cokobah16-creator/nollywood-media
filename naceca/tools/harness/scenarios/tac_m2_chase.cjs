// tac_m2_chase · the chase in M2 (DESIGN §3.5, §5.3, M-M4; market.md §1.7): CUT HIM OFF (the rule, its reward, its guards:
// the opening, fleeing, a counter in between), Uche at the corner (veer) and at the gate (the hidden catch and the 1.4 s beat),
// the van callouts (lane and direction, the gate only with the route, at most 4), Pursuit Lines (Uche runs; the 900 ms line
// is true for the post), Uche en route when the chase starts, the lane bump copy, and M6's Ifeanyi untouched.
const M = require('./tac_m2_lib.cjs');
const T = M.T;

// confront from the counter with today's opening (no watch history), Uche placed or posted first
const start = async (h, o = {}) => {
  await M.boot(h, { seed:o.seed || 41 });
  await T.capture(h);
  return h.ev(o => {
    S.game._marketTunde = true; S.game._marketScanned = true;
    if (o.tip) S.game.flags.m2_tunde = 'quiet';
    if (o.pursuit) S.player.skills.push('pursuit');
    if (o.place) TAC.m2._place(o.place);
    if (o.post) TAC.m2.post(o.post, { quiet:true });
    if (o.enroute){ const P = ENGINE.player.position; P.x = -20; P.z = -20; TAC.player._reset(); __wf.run(o.enroute); }
    const P = ENGINE.player.position; P.x = o.at ? o.at[0] : 5.8; P.z = o.at ? o.at[1] : 4.6; TAC.player._reset();
    const it = ENGINE.interactables.find(i => i.label === 'Confront teen suspect'); it.onInteract(it);
    const c = CHASE.active; window.__c = c;
    return { row:c && c.tac.row, how:c && c.how, by:c && c.by, speed:c && c.speed };
  }, o);
};

module.exports = async h => {
  // ---- (a) CUT HIM OFF at (7.6, −9): he comes round the second-gap corner into you ----
  const s = await start(h);
  h.assert(s.row === 'legacy' && s.how === 'tackle' && s.by === 'player', 'B\'s defaults at startChase: how tackle, by player');
  const a = await h.ev(() => {
    const P = ENGINE.player.position; P.x = 7.6; P.z = -9; ENGINE.player.rotation.y = 0; TAC.player._reset();
    const t0 = S.player.reputation.publicTrust, c = window.__c;
    let end = null;
    __wf.run(30, (i, t) => { if (!CHASE.active){ end = { t:+(c._tacT).toFixed(2), dlg:!!document.querySelector('#screen-dialogue.show') && DLG.scriptKey }; return true; } });
    const K = ENGINE._marketKC;
    return Object.assign(end || {}, { how:c.how, by:c.by, down:!!K.userData._down, arms:[K.userData.armL.rotation.x, K.userData.armR.rotation.x], dTrust:S.player.reputation.publicTrust - t0,
      toast:(document.querySelector('#toast .big') || {}).textContent, small:(document.querySelector('#toast .small') || {}).textContent });
  });
  await h.step(300);
  let ev = await T.events(h);
  const ce = ev.filter(e => e[0] === 'chase_end'), enc = ev.filter(e => e[0] === 'enc' && e[1].enc === 'm2_kc');
  h.log('(a) cut-off', JSON.stringify(a), JSON.stringify(ce.map(e => e[1])), JSON.stringify(enc.map(e => [e[1].how, e[1].approach, e[1].trust])));
  h.assert(a.how === 'cutoff' && a.by === 'player' && !a.down && a.t >= 1.5, '(a) how cutoff, by player, no knockDown on KC, after the opening');
  h.assert(a.dlg === 'market_runner', '(a) the caught scene opens synchronously');
  h.assert(a.dTrust === 2 && a.arms[0] <= -1.6 && a.toast === 'CUT HIM OFF' && a.small === 'You got in front of him. No tackle, nobody hurt · +2 Public Trust', '(a) +2 Public Trust, hands up, the toast');
  h.assert(ce.length === 1 && ce[0][1].outcome === 'caught', '(a) one chase_end, caught');
  h.assert(enc.length === 1 && enc[0][1].how === 'cutoff' && enc[0][1].outcome === 'caught', '(a) enc m2_kc how cutoff');
  const ach = await h.ev(() => typeof _ach !== 'undefined' && !!_ach.faster && !!_ach.not_one);
  h.assert(ach, '(a) the same unlocks as a tackle: faster, and not_one with no bumps');

  // ---- (b) none in the first 1.5 s: standing in his way as he turns the north corner is today's tackle ----
  await start(h);
  const b = await h.ev(() => { const P = ENGINE.player.position; P.x = 12.6; P.z = 5.2; TAC.player._reset(); const c = window.__c;
    __wf.run(10, () => { if (!CHASE.active) return true; }); return { how:c.how, t:+c._tacT.toFixed(2), down:!!ENGINE._marketKC.userData._down }; });
  h.log('(b) inside 1.5 s', JSON.stringify(b));
  h.assert(b.how === 'tackle' && b.t < 1.5 && b.down, '(b) the same kind of spot reached inside the first 1.5 s: no cut-off (today\'s tackle)');

  // ---- (c) none while fleeing ahead of him ----
  await start(h);
  const c = await h.ev(() => {
    const c = window.__c, P = ENGINE.player.position;
    __wf.run(2.4);
    const K = c.runner.position; P.x = K.x; P.z = K.z - 2.8;              // in front of him, running the same way
    let cut = false;
    __wf.run(1.5, () => { P.z -= 4.42 * __wf.dt; if (!CHASE.active){ cut = c.how === 'cutoff'; return true; } });
    return { cut, active:!!CHASE.active, how:c.how, k:[K.x, +K.z.toFixed(1)], p:[P.x, +P.z.toFixed(1)] };
  });
  h.log('(c) fleeing', JSON.stringify(c));
  h.assert(!c.cut && c.how !== 'cutoff', '(c) sprinting away in front of him is no cut-off');
  await h.ev(() => stopChase());

  // ---- (d) none with a counter in between (WAY.segBlocked), then the same distance in the clear cuts him off ----
  await start(h);
  const d = await h.ev(() => {
    const c = window.__c, K = c.runner.position, P = ENGINE.player.position, path = c.path;
    // find a spot on his path with a collider ahead of him, and a free cell behind it inside 3.5 m and ±40°
    let found = null;
    for (let s = 1; s < path.length - 1 && !found; s++) {
      const a = path[s], b = path[s + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), hx = (b[0] - a[0]) / L, hz = (b[1] - a[1]) / L;
      for (let u = 0; u < L && !found; u += 0.25) {
        const kx = a[0] + hx * u, kz = a[1] + hz * u;
        let blk = null, clr = null;
        for (let r = 2.0; r <= 3.4; r += 0.2) for (let deg = -36; deg <= 36; deg += 6) {
          const th = deg * Math.PI / 180, dx = hx * Math.cos(th) - hz * Math.sin(th), dz = hx * Math.sin(th) + hz * Math.cos(th);
          const px = kx + dx * r, pz = kz + dz * r; if (blockedAt(px, pz)) continue;
          if (WAY.segBlocked(px, pz, kx, kz, 0)) { if (!blk) blk = [px, pz]; } else if (!clr && Math.abs(deg) <= 12) clr = [px, pz];
        }
        if (blk && clr) found = { seg:s, k:[kx, kz], blk, clr };
      }
    }
    if (!found) return { found:null };
    K.x = found.k[0]; K.z = found.k[1]; c.seg = found.seg; c.burstT = 0; c.headStart = 0; c.pause = 0; c._tacT = 3; const v0 = c.speed; c.speed = 0;
    P.x = found.blk[0]; P.z = found.blk[1]; TAC.player._reset(); c.tac.hist.length = 0;
    __wf.run(0.6);
    const blocked = { active:!!CHASE.active, how:c.how };
    P.x = found.clr[0]; P.z = found.clr[1]; c.tac.hist.length = 0;
    __wf.run(0.6, () => { if (!CHASE.active) return true; });
    return { found, blocked, clear:{ active:!!CHASE.active, how:c.how } };
  });
  h.log('(d) counter', JSON.stringify(d));
  h.assert(d.found, '(d) a spot with a collider between Kelechi and KC exists on his path');
  h.assert(d.blocked.active, '(d) behind a counter (segBlocked): no cut-off');
  h.assert(!d.clear.active && d.clear.how === 'cutoff', '(d) the same distance in the clear: cut-off');

  // ---- (e) the corner post: KC sees Uche ahead and veers; the chase still ends caught ----
  await start(h, { place:'corner' });
  await T.capture(h);
  const e = await h.ev(() => window.__m2.pursue({ strategy:'follow', delay:2.5, maxT:45 }));
  ev = await T.events(h, 'ally_done');
  h.log('(e) corner', JSON.stringify(e), JSON.stringify(ev.map(x => x[1])));
  h.assert(ev.some(x => x[1].task === 'veer' && x[1].post === 'corner'), '(e) the corner post: ally_done{veer}');
  h.assert(e.caught && ['cutoff', 'boxed', 'uche', 'tackle'].includes(e.how), '(e) and he is caught: ' + e.how);

  // ---- (f) the gate post with a player who never chases: Uche has him by 20 s, with the beat ----
  await start(h, { place:'back' });
  await T.capture(h);
  const f = await h.ev(() => {
    const c = window.__c, U = TAC.m2.uche();
    let t = null; __wf.run(25, (i, tt) => { if (!CHASE.active){ t = +(c._tacT).toFixed(2); return true; } });
    return { t, how:c.how, by:c.by, down:!!ENGINE._marketKC.userData._down, kneel:U.mesh.scale.y, beat:!!TPCAM.override, move:ENGINE.movementEnabled, dlg:!!document.querySelector('#screen-dialogue.show'),
      toast:(document.querySelector('#toast .small') || {}).textContent };
  });
  await h.step(1300);
  const f2 = await h.ev(() => ({ beat:!!TPCAM.override, dlg:!!document.querySelector('#screen-dialogue.show') }));
  await h.step(400);
  const f3 = await h.ev(() => { const P = ENGINE.player.position, K = ENGINE._marketKC.position; return { beat:!!TPCAM.override, move:ENGINE.movementEnabled, dlg:!!document.querySelector('#screen-dialogue.show') && DLG.scriptKey, d:+Math.hypot(P.x - K.x, P.z - K.z).toFixed(2), how:S.game.flags.m2_how }; });
  ev = await T.events(h);
  h.log('(f) gate', JSON.stringify({ f, f2, f3 }), JSON.stringify(ev.filter(x => x[0] === 'ally_done').map(x => x[1])));
  h.assert(f.how === 'uche' && f.by === 'uche' && f.t != null && f.t <= 20 && f.down && f.kneel === 0.9, '(f) how uche by 20 s: KC down, Uche kneeling: ' + f.t);
  h.assert(/Sgt\. Uche took him down at the back gate · \+2 Public Trust/.test(f.toast), '(f) UCHE HAS HIM with the place name');
  h.assert(f.beat && !f.move && !f.dlg && f2.beat && !f2.dlg, '(f) the beat: TPCAM.override, movement frozen, no dialogue for ≥ 1.3 s');
  h.assert(!f3.beat && f3.move && f3.dlg === 'market_runner' && Math.abs(f3.d - 1.6) < 0.05 && f3.how === 'uche', '(f) after the beat: the camera back, Kelechi 1.6 m from KC, the caught scene');
  h.assert(ev.some(x => x[0] === 'ally_done' && x[1].task === 'tackle'), '(f) ally_done{tackle}');
  h.assert(ev.filter(x => x[0] === 'chase_end').length === 1, '(f) one chase_end');
  // reduced motion: no beat, the dialogue at once
  await start(h, { place:'back' });
  const fr = await h.ev(() => { SETTINGS.reduceMotion = 'on'; const c = window.__c; __wf.run(25, () => { if (!CHASE.active) return true; });
    const out = { how:c.how, beat:!!TPCAM.override, dlg:!!document.querySelector('#screen-dialogue.show') }; SETTINGS.reduceMotion = 'off'; return out; });
  h.assert(fr.how === 'uche' && !fr.beat && fr.dlg, '(f) under reduced motion the beat is skipped');

  // ---- (g) the van callouts: on each last-seen refresh, lane and direction, at most 4; the gate only with the route ----
  const calls = async tip => {
    await start(h, { tip });
    await h.ev(() => { window.__calls = []; if (TAC.radio.say.__spy) return; const o = TAC.radio.say; TAC.radio.say = function(sp, tx, op){ if (op && op.key === 'uche_call') __calls.push([sp, tx, op.pri, op.ttl]); return o.apply(this, arguments); }; TAC.radio.say.__spy = true; });
    await T.capture(h);
    return h.ev(() => { WAY._forceLos = false; const P = ENGINE.player.position;
      __wf.run(24, () => { const K = window.__c.runner.position; P.x = K.x - 6; P.z = K.z; if (!CHASE.active) return true; });
      WAY._forceLos = null; return { calls:__calls.slice(), pings:window.__c.fx.ping }; });
  };
  const g = await calls(false);
  ev = await T.events(h, 'ally_done');
  h.log('(g) van, no tip', JSON.stringify(g), ev.length);
  h.assert(g.calls.length >= 1 && g.calls.length <= 4 && g.pings > g.calls.length, '(g) at most 4 callouts, one per last-seen refresh');
  h.assert(g.calls.every(c => c[0] === 'SGT. UCHE' && c[2] === 3 && c[3] === 3000 && /^He's (in|on|at|cut)/.test(c[1]) && !/gate/.test(c[1])), '(g) pri 3, ttl 3 s; lane and direction only without the route');
  h.assert(ev.filter(x => x[1].task === 'callout').length === g.calls.length && ev.every(x => x[1].lane), '(g) ally_done{callout, lane}');
  const g2 = await calls(true);
  h.log('(g) van, tip', JSON.stringify(g2));
  h.assert(g2.calls.length >= 1 && g2.calls.length <= 4, '(g) with the route: still at most 4');

  // ---- (h) Pursuit Lines: Uche runs the lanes; KC 4.3 × 0.95; the 900 ms line is true for the post ----
  for (const post of ['corner', 'van', 'back']) {
    await M.boot(h, { seed:43 });
    await h.ev(() => { window.__rl = []; if (window.radioLine.__spy) return; const o = window.radioLine; window.radioLine = function(sp, tx){ __rl.push([sp, tx]); return o.apply(this, arguments); }; window.radioLine.__spy = true; });
    const p0 = await h.ev(post => {
      S.game._marketTunde = true; S.game._marketScanned = true; S.player.skills.push('pursuit');
      TAC.m2._place(post);
      const U = TAC.m2.uche(), u0 = [U.mesh.position.x, U.mesh.position.z];
      const P = ENGINE.player.position; P.x = 5.8; P.z = 4.6;
      const it = ENGINE.interactables.find(i => i.label === 'Confront teen suspect'); it.onInteract(it);
      return { speed:CHASE.active.speed, u0 };
    }, post);
    await h.step(1100);
    const p1 = await h.ev(() => { const U = TAC.m2.uche(), a = [U.mesh.position.x, U.mesh.position.z]; __wf.run(2); const b = [U.mesh.position.x, U.mesh.position.z];
      return { line:__rl.find(r => r[0] === 'SGT. UCHE' && /push him|drive him/.test(r[1])), moved:+Math.hypot(b[0] - a[0], b[1] - a[1]).toFixed(2), pursue:U.pursue }; });
    h.log('(h) pursuit ' + post, JSON.stringify(p0), JSON.stringify(p1));
    h.assert(Math.abs(p0.speed - 4.3 * 0.95) < 1e-9, '(h) KC speed 4.3 × 0.95, unchanged');
    const want = { corner:'Coming up the back lane — push him towards me!', van:'Cutting across from the van — push him towards me!', back:"I'm holding the back gate — drive him down to me!" }[post];
    h.assert(p1.line && p1.line[1] === want, '(h) the 900 ms line matches the post (' + post + '): ' + (p1.line && p1.line[1]));
    if (post === 'back') h.assert(!p1.pursue && p1.moved < 0.01, '(h) at the gate he holds the gate');
    else h.assert(p1.pursue && p1.moved > 3 && p1.moved <= 7.3, '(h) Uche runs the lanes (≤ 3.6 m/s) for KC (' + post + '): ' + p1.moved + ' m in 2 s');
  }

  // ---- (i) en route: posted, the chase at +3 s; he keeps going at 3.6 m/s, the veer and the grab are live ----
  for (const post of ['corner', 'back']) {
    await start(h, { post, enroute:3 });
    const r = await h.ev(() => { const U = TAC.m2.uche(), s0 = U.s; __wf.run(1); const v = +(U.s - s0).toFixed(2); const res = window.__m2.pursue({ strategy:'follow', delay:2.5, maxT:45 });
      return { v, moving:U.moving, res }; });
    h.log('(i) en route ' + post, JSON.stringify(r));
    h.assert(Math.abs(r.v - 3.6) < 0.05 && r.res.caught, '(i) en route to the ' + post + ': 3.6 m/s in the chase, and he is caught (' + r.res.how + ')');
  }

  // ---- the lane bump: BYSTANDER DOWN says where ----
  await start(h);
  const bump = await h.ev(() => {
    const tr = ENGINE._marketCrowd.find(m => !m.userData.target && m.position.x > 11);   // a trader in the back lane
    const P = ENGINE.player.position; P.x = tr.position.x + 0.3; P.z = tr.position.z; ENGINE.keys.ShiftLeft = true;
    for (let i = 0; i < 3; i++) updatePressure(1 / 60);       // (not __wf.run: the side quest's own toast would replace it in the same frame)
    ENGINE.keys.ShiftLeft = false;
    return { big:(document.querySelector('#toast .big') || {}).textContent, small:(document.querySelector('#toast .small') || {}).textContent, lane:window.__c.tac.lane };
  });
  h.log('bump', JSON.stringify(bump));
  h.assert(bump.big === 'BYSTANDER DOWN' && bump.small === 'You flattened a trader at full sprint in the trader lane. −3 Public Trust' && bump.lane === 1, 'BYSTANDER DOWN in a trader lane says so');
  const bh = await h.ev(() => !!(S.game._hints || {}).tac_m2_bump);
  h.assert(!bh, 'Senior Agent: no tac_m2_bump chip');
  await h.ev(() => stopChase());
  await start(h);
  const bumpR = await h.ev(() => {
    S.game.difficulty = 'recruit';
    const tr = ENGINE._marketCrowd.find(m => !m.userData.target && m.position.x > 11);
    const P = ENGINE.player.position; P.x = tr.position.x + 0.3; P.z = tr.position.z;
    for (let i = 0; i < 3; i++) updatePressure(1 / 60);
    return { hint:!!(S.game._hints || {}).tac_m2_bump, chip:(document.querySelector('#hint-chip .hc-text') || {}).textContent, small:(document.querySelector('#toast .small') || {}).textContent };
  });
  h.log('bump (Recruit)', JSON.stringify(bumpR));
  h.assert(bumpR.hint && /Cut across, not down the lanes/.test(bumpR.chip) && bumpR.small === 'You clipped a trader in the trader lane. −1 Public Trust', 'Recruit: tac_m2_bump on the first bump; a walking clip says −1');
  await h.ev(() => stopChase());

  // ---- M6: Ifeanyi is untouched (4.1 m/s, catch 1.9, no c.tac) ----
  await T.lib.start(h, 'm6', { completed:['m0', 'm1', 'm2', 'm3', 'm4', 'm5'] });
  await T.lib.frozenClock(h);
  await T.lib.stepper(h);
  await T.lib.asabaChase(h);
  const m6 = await h.ev(() => { const c = CHASE.active; return c && { speed:c.speed, cd:c.catchDist, tac:!!c.tac, how:c.how || null, ext:!!TAC.m2.run() }; });
  h.log('M6', JSON.stringify(m6));
  h.assert(m6 && Math.abs(m6.speed - 4.1) < 1e-9 && m6.cd === 1.9 && !m6.tac && m6.how === null, 'M6: Ifeanyi 4.1 m/s, catch at 1.9 m, no market hooks');
  h.assert(!h.errors.length, 'no page errors: ' + h.errors.join(' | '));
};
