// tac_m2_uche · Sgt. Uche on the ground in M2 (DESIGN M-M3, M-M4, §5.3; market.md §1.3): out of reach at the spawn, never a
// tracker target, gated on Tunde, the market_uche choices (≥ 44 px, inside the screen; run at 844×390 --touch 1 too),
// "Tunde says" only with the route, the two routes (no collider, ≥ 0.8 m from standing traders, never in KC's cone and range),
// arrival times, re-posting (an order only on a change), spent once KC is decided, and a replay resets m2_post.
const M = require('./tac_m2_lib.cjs');
const T = M.T;

module.exports = async h => {
  const vp = await h.ev(() => ({ w:innerWidth, h:innerHeight, touch:document.body.classList.contains('touch-active') }));
  h.log('viewport', JSON.stringify(vp));
  await M.boot(h, { seed:31 });
  await T.capture(h);
  // ---- at the spawn: not in reach; never the tracker's target ----
  const s0 = await h.ev(() => {
    const U = TAC.m2.uche(), P = ENGINE.player.position, it = nearestInteractable();
    const res = [];
    for (const id of ['o1_tunde', 'o2_scan', 'o3_runner']) { const r = WAY.resolve(); res.push(r && r.label); WAY.invalidate(); completeObjective(id); }
    return { near:it && it.label, d:+Math.hypot(U.mesh.position.x - P.x, U.mesh.position.z - P.z).toFixed(2), res, inNpcs:ENGINE.npcs.some(n => n === U.mesh || (n && n.mesh === U.mesh)),
      obstacle:ENGINE.obstacles.some(o => U.mesh.position.x > o.minX && U.mesh.position.x < o.maxX && U.mesh.position.z > o.minZ && U.mesh.position.z < o.maxZ),
      crowd:(ENGINE._marketCrowd || []).includes(U.mesh), optional:U.it.optional, range:U.it.range, verb:U.it.verb, poi:MINIMAP.pois.some(p => p === U.poi && p.color === '#5dd07a') };
  });
  h.log('spawn', JSON.stringify(s0));
  h.assert(s0.near !== 'Post Sgt. Uche' && s0.d > 2.4, 'Uche is out of reach at the spawn (' + s0.d + ' m)');
  h.assert(s0.res.every(l => l !== 'Post Sgt. Uche'), 'never a WAY.resolve target: ' + s0.res.join(' / '));
  h.assert(!s0.inNpcs && !s0.obstacle && !s0.crowd && s0.optional && s0.range === 2.4 && s0.verb === 'talk', 'not in ENGINE.npcs, not an obstacle, not crowd; talk, range 2.4, optional');
  h.assert(s0.poi, 'his minimap dot (#5dd07a)');

  // ---- gated on Tunde ----
  await M.boot(h, { seed:31 });
  const g = await h.ev(() => {
    const U = TAC.m2.uche(), P = ENGINE.player.position; P.x = U.mesh.position.x - 1.2; P.z = U.mesh.position.z;
    const it = nearestInteractable(); tryInteract();
    return { lbl:it && it.label, dlg:!!document.querySelector('#screen-dialogue.show'), big:(document.querySelector('#toast .big') || {}).textContent, small:(document.querySelector('#toast .small') || {}).textContent,
      spent:TAC.interact.isSpent(U.it) };
  });
  h.log('before Tunde', JSON.stringify(g));
  h.assert(g.lbl === 'Post Sgt. Uche' && !g.dlg && g.big === 'SGT. UCHE' && g.small === "I'll hold the van, sir." && g.spent, 'before Tunde: "I\'ll hold the van, sir." and no dialogue');

  // ---- after Tunde (no route): his radio prompt, the dialogue, the three choices ----
  await T.capture(h);
  await h.ev(() => { window.__rl = []; const o = window.radioLine; if (!o.__m2u){ window.radioLine = function(sp, tx){ __rl.push([sp, tx]); return o.apply(this, arguments); }; window.radioLine.__m2u = true; } });
  await M.tunde(h, { at:[-8, -2], choice:1 });
  await h.step(1700);
  const talk = await h.ev(() => {
    const U = TAC.m2.uche(), P = ENGINE.player.position; P.x = U.mesh.position.x - 1.2; P.z = U.mesh.position.z;
    const it = nearestInteractable(); tryInteract();
    return { lbl:it && it.label, key:DLG.scriptKey, yaw:U.mesh.rotation.y, want:Math.atan2(P.x - U.mesh.position.x, P.z - U.mesh.position.z), prompt:__rl.find(r => /Tell me where you want me/.test(r[1])) };
  });
  h.log('talk', JSON.stringify(talk));
  h.assert(talk.prompt && talk.prompt[0] === 'SGT. UCHE', 'after Tunde, unposted: "I\'m with the van, sir. Tell me where you want me…"');
  h.assert(talk.key === 'market_uche' && Math.abs(talk.yaw - talk.want) < 1e-6, 'TALK opens market_uche, and he turns to Kelechi');
  const r1 = await T.finishDialogue(h);
  const ch = await h.ev(() => [...document.querySelectorAll('#dlg-choices button')].map(b => { const r = b.getBoundingClientRect(); return { t:b.textContent, top:r.top, bottom:r.bottom, h:r.height, w:r.width }; }));
  const box = await h.ev(() => { const r = document.querySelector('.dialogue-box') ? document.querySelector('.dialogue-box').getBoundingClientRect() : null; return r && { top:r.top, bottom:r.bottom }; });
  h.log('choices', JSON.stringify(ch), JSON.stringify(box));
  h.assert(r1 === 'choice' && ch.length === 3, 'three choices');
  h.assert(/back-lane corner/.test(ch[0].t) && /back gate\. Stay out of sight\.$/.test(ch[1].t) && !/Tunde says/.test(ch[1].t) && /Stay with the van/.test(ch[2].t), 'without the route the gate choice does not name Tunde');
  h.assert(ch.every(c => c.top >= 0 && c.bottom <= vp.h), 'every choice is inside the screen (' + vp.w + '×' + vp.h + ')');
  if (vp.touch) h.assert(ch.every(c => c.h >= 44 - 0.5), 'every choice is ≥ 44 px on touch');
  await T.choose(h, 0);
  await T.finishDialogue(h);
  let ev = await T.events(h, 'order');
  h.log('order', JSON.stringify(ev.map(e => e[1])));
  h.assert(ev.length === 1 && ev[0][1].post === 'corner' && ev[0][1].src === 'talk' && ev[0][1].ok === true && ev[0][1].def === false && ev[0][1].withTip === false && ev[0][1].prev === null, 'order{post:corner, src:talk, ok, def:false}');
  const ans = await h.ev(() => __rl.filter(r => /Back-lane corner/.test(r[1])).length);
  h.assert(ans === 1, 'he answers on the radio');

  // ---- the routes: walked frame by frame against the colliders, the standing traders and KC's cone ----
  // he was posted to the corner in the dialogue and has not moved yet (frozen clock): walk him now
  const walk = (post, maxT) => h.ev(([post, maxT]) => {
    const U = TAC.m2.uche(), m = U.mesh, K = ENGINE._marketKC.position;
    const traders = ENGINE._marketCrowd.filter(t => !t.userData.target);
    if (post) TAC.m2.post(post, { quiet:true });
    let hits = 0, minTr = 99, cone = 0, arrived = null, maxSusp = 0;
    __wf.run(maxT, (i) => {
      const x = m.position.x, z = m.position.z;
      if (blockedAt(x, z, 0.25)) hits++;
      minTr = Math.min(minTr, ...traders.map(t => Math.hypot(t.position.x - x, t.position.z - z)));
      const dx = x - K.x, dz = z - K.z, d = Math.hypot(dx, dz), ang = Math.acos(Math.max(-1, Math.min(1, -dx / Math.max(d, 1e-6)))) * 180 / Math.PI;
      const pr = TAC.sight.probe('kc', x, z, { gait:'jog' });
      if ((d <= 12 && ang <= 50 + 8.6) || (pr.inCone && pr.inRange)) cone++;
      maxSusp = Math.max(maxSusp, TAC.m2.kc().state.susp);
      if (U.arrived && arrived == null){ arrived = +(i / 60).toFixed(2); return true; }
    });
    return { hits, minTr:+minTr.toFixed(2), cone, arrived, at:[+m.position.x.toFixed(2), +m.position.z.toFixed(2)], crouch:+m.scale.y.toFixed(2), maxSusp };
  }, [post, maxT]);
  await T.capture(h);
  await h.ev(() => { window.__rl = []; const P = ENGINE.player.position; P.x = -20; P.z = -20; TAC.player._reset(); });
  const wc = await walk(null, 20);
  const radC = await h.ev(() => __rl.slice());
  ev = await T.events(h, 'ally_done');
  h.log('corner route', JSON.stringify(wc), JSON.stringify(radC), JSON.stringify(ev.map(e => e[1])));
  h.assert(wc.hits === 0 && wc.minTr >= 0.8 && wc.cone === 0, 'corner route: 0 collider hits, ≥ 0.8 m from every standing trader, never in KC\'s cone and range ' + JSON.stringify(wc));
  h.assert(wc.arrived != null && wc.arrived <= 15.5 && Math.hypot(wc.at[0] - 12.6, wc.at[1] + 7.5) < 0.01, 'he reaches the corner (12.6, −7.5) within 15.5 s: ' + wc.arrived);
  h.assert(radC.some(r => r[0] === 'SGT. UCHE' && r[1] === 'In position.') && ev.length === 1 && ev[0][1].task === 'arrive' && ev[0][1].post === 'corner', '"In position." and ally_done{arrive}');
  // re-post the same: nothing logged; then the gate, from the van (a fresh walk of the whole route)
  await T.capture(h);
  await h.ev(() => { TAC.m2.post('corner'); TAC.m2._place('van'); TAC.m2.run().uche.post = 'van'; });
  const wg = await walk('back', 25);
  ev = await T.events(h, 'order');
  h.log('gate route', JSON.stringify(wg), JSON.stringify(ev.map(e => e[1])));
  h.assert(wg.hits === 0 && wg.minTr >= 0.8 && wg.cone === 0, 'gate route: 0 collider hits, ≥ 0.8 m from traders, never in KC\'s cone and range ' + JSON.stringify(wg));
  h.assert(wg.arrived != null && wg.arrived <= 20 && Math.hypot(wg.at[0] - 12.1, wg.at[1] + 19.9) < 0.01 && wg.crouch === 0.8, 'he reaches the gate (12.1, −19.9) within 20 s and crouches (scale.y 0.8): ' + wg.arrived);
  h.assert(ev.length === 1 && ev[0][1].post === 'back', 'only changes are logged: one order (the gate), none for the same post again');
  // re-posting mid-walk turns him round on the chain
  const rp = await h.ev(() => { const U = TAC.m2.uche(); TAC.m2.post('corner', { quiet:true }); __wf.run(2); const a = U.s; TAC.m2.post('van', { quiet:true }); __wf.run(1); return { s1:a, s2:U.s, moving:U.moving, crouch:U.mesh.scale.y }; });
  h.log('re-post', JSON.stringify(rp));
  h.assert(rp.s2 < rp.s1 && rp.moving && rp.crouch === 1, 're-posting works: he walks the chain back and stands up');

  // ---- with Tunde's route: the gate choice names Tunde; withTip in the order ----
  await M.boot(h, { seed:32 });
  await T.capture(h);
  await M.tunde(h, { at:[-8, -2], choice:0 });
  const ct = await h.ev(() => { const U = TAC.m2.uche(), P = ENGINE.player.position; P.x = U.mesh.position.x - 1.2; P.z = U.mesh.position.z; tryInteract(); return DLG.scriptKey; });
  await T.finishDialogue(h);
  const ch2 = await h.ev(() => [...document.querySelectorAll('#dlg-choices button')].map(b => b.textContent));
  await T.choose(h, 1); await T.finishDialogue(h);
  ev = await T.events(h, 'order');
  h.log('with the route', JSON.stringify(ch2), JSON.stringify(ev.map(e => e[1])));
  h.assert(ct === 'market_uche' && /back gate\. Stay out of sight\. Tunde says that's where he runs\./.test(ch2[1]), 'with m2_tunde quiet: "… Tunde says that\'s where he runs."');
  h.assert(ev.length === 1 && ev[0][1].post === 'back' && ev[0][1].withTip === true, 'order{post:back, withTip:true}');
  const flagPost = await h.ev(() => S.game.flags.m2_post);
  h.assert(flagPost === 'back', 'm2_post written');

  // ---- spent once KC is decided; a press says the van is ready ----
  const sp = await h.ev(() => {
    const U = TAC.m2.uche(); S.game.moralChoices.market_runner = 'caught';
    const spent = TAC.interact.isSpent(U.it);
    const P = ENGINE.player.position; P.x = U.mesh.position.x - 1.0; P.z = U.mesh.position.z;
    U.it.onInteract(U.it);
    return { spent, small:(document.querySelector('#toast .small') || {}).textContent, dlg:!!document.querySelector('#screen-dialogue.show') };
  });
  h.log('spent', JSON.stringify(sp));
  h.assert(sp.spent && sp.small === "Van's ready when you are, sir." && !sp.dlg, 'spent after market_runner; a press: "Van\'s ready when you are, sir."');

  // ---- a replay from mission select resets m2_post (and m2_tunde, m2_met, m2_how); Uche is back at the van ----
  const rpl = await h.ev(async () => {
    S.game.flags.m2_how = 'tackle';
    S.game._marketTunde = false; S.game._marketScanned = false; S.game.moralChoices.market_runner = false;   // mission_select.js:31
    showOverlay(null); loadMission('m2');
    await new Promise(r => setTimeout(r, 600));
    if (document.querySelector('#screen-controls.show')) beginMission('m2');
    await new Promise(r => setTimeout(r, 900));
    const U = TAC.m2.uche();
    return { flags:Object.keys(S.game.flags).filter(k => /^m2_/.test(k)), post:U.post, posted:U.posted, at:[U.mesh.position.x, U.mesh.position.z] };
  });
  h.log('replay', JSON.stringify(rpl));
  h.assert(rpl.flags.length === 0 && rpl.post === 'van' && !rpl.posted && rpl.at[0] === -2.4 && rpl.at[1] === 11.6, 'a replay resets the m2_* flags; Uche is back at the van');
  h.assert(!h.errors.length, 'no page errors: ' + h.errors.join(' | '));
};
