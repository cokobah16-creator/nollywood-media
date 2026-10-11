// Shared fixtures for Team C's tac_m3_* scenarios (run on its own it is a no-op that passes).
// Owner: Team C. Builds on Team A's tactics_lib (T.deviceMansion / T.restoreArt — restoreArt is MANDATORY after
// every deviceMansion, because h.start doesn't reset ART.ready). Ported from the design work's m3lib.cjs and
// run3_proto.cjs (breach, laptop).
//
//   L.v8(h, {state, seed, sims})      the art-pass house (39 colliders), the M3 stepper, V12.log capture, toast capture
//   L.breach(h, plan, {card})         autofile the Lagos sheet, Uche → the plan, pick plan {entry, power, uche}, GO,
//                                     the spoken briefing, then (unless card:false) wait for the title card to close
//   __m3.run(secs, fn)                in the page: the game loop's playing branch at 60 Hz (NPC updates, updatePressure
//                                     → TAC ticks/frames, sideTick, the scene update) + updateMansionWipe
//   __m3.walk(pts, v, {crouch, stop, max, hold})   walk Kelechi along pts at v m/s (collisions), stepping the world
//   L.laptop(h, {seq})                press Inspect laptop at the staged spot; a field skill is won; seq:true checks the
//                                     staged reach (ENGINE.seq) on a rig marked skinned, then fires its hit
//   L.arrest(h, i)                    press Move on suspect (from where Kelechi stands) → the choice texts, choose i
//   L.childTalk(h, i), L.walkOut(h), L.extract(h, wait, {again}), L.snap(h), L.toasts(h), L.ev(h, type)
//   L.realtime(h, secs, every, {stop})  game time stepped WITH wall time (__m3.run(every), then h.step(every)), so the
//                                     radio queue's real timers advance as on a device; returns every sample
//                                     {t, obi, strip (the radio strip's text, null when hidden), now (performance.now)}
const T = require('./tactics_lib.cjs');
const L = async h => { h.log('tac_m3_lib: helper module'); };
L.T = T;

const STEPPER = () => {
  window.__m3 = {
    dt: 1 / 60, t: 0,
    step(dt) {
      const play = ENGINE.movementEnabled && !isOverlayOpen();
      if (play) {
        for (const n of ENGINE.npcs.slice()) if (n && n.update) n.update(dt);
        updatePressure(dt);
        if (typeof sideTick === 'function') sideTick(dt);
        if (ENGINE.sceneUpdate) ENGINE.sceneUpdate(dt);
      }
      if (typeof updateMansionWipe === 'function') updateMansionWipe(dt);
      this.t += dt;
    },
    run(secs, fn) {
      const n = Math.round(secs / this.dt); let i = 0;
      for (; i < n; i++) { if (fn && fn(i * this.dt) === true) break; this.step(this.dt); }
      return +(i * this.dt).toFixed(3);
    },
    // Kelechi along pts at v m/s, one full step per frame, blocked by colliders like the player is
    walk(pts, v, o) {
      o = o || {}; const P = ENGINE.player.position; let k = 0;
      ENGINE.keys.KeyC = !!o.crouch; ENGINE.keys.ShiftLeft = !!o.sprint;
      const t = this.run(o.max || 30, () => {
        if (o.stop && o.stop()) return true;
        if (k >= pts.length) return o.hold ? false : true;
        let rem = v * this.dt;
        while (rem > 1e-9 && k < pts.length) {
          const [x, z] = pts[k], dx = x - P.x, dz = z - P.z, d = Math.hypot(dx, dz);
          if (d < 1e-4) { k++; continue; }
          const s = Math.min(d, rem), nx = P.x + dx / d * s, nz = P.z + dz / d * s;
          if (!blockedAt(nx, P.z)) P.x = nx; if (!blockedAt(P.x, nz)) P.z = nz;
          ENGINE.player.rotation.y = Math.atan2(dx, dz);
          rem -= s; if (s >= d - 1e-9) k++; else break;
        }
      });
      if (!o.keep) { ENGINE.keys.KeyC = false; ENGINE.keys.ShiftLeft = false; }
      return { t, at:[+P.x.toFixed(2), +P.z.toFixed(2)], reached:k >= pts.length };
    },
  };
  window.__toasts = window.__toasts || [];
  if (!window.toast.__m3) { const o = window.toast; const f = function (a, b) { window.__toasts.push([String(a || ''), String(b || '')]); return o.apply(this, arguments); }; f.__m3 = true; window.toast = f; }
};

L.v8 = async (h, o = {}) => {
  const r = await T.deviceMansion(h, { seed:o.seed == null ? 7 : o.seed, state:o.state || null });
  await h.ev(STEPPER);
  await T.capture(h);
  await h.ev(sims => { if (sims) { V12.ops().theories = V12.ops().theories || {}; V12.ops().theories.t_sims = true; } window.__toasts = []; }, !!o.sims);
  return r;
};
L.stepper = h => h.ev(STEPPER);
L.restore = h => T.restoreArt(h);

const shown = h => h.ev(() => [...document.querySelectorAll('.overlay.show')].map(e => e.id));
L.shown = shown;
L.finishDialogue = h => T.finishDialogue(h);
L.choose = (h, i) => T.choose(h, i);

// plan: { entry:'knock'|'quiet'|'loud', power:'leave'|'cut', uche:'with'|'rear' }
L.breach = async (h, plan = {}, o = {}) => {
  await h.ev(() => { if (!V12.accused('lagos')) CW.autofile('lagos'); });
  await h.ev(() => {
    const it = ENGINE.interactables.find(i => /^Plan the raid/.test(i.label || ''));
    ENGINE.player.position.x = 1.0; ENGINE.player.position.z = 7.6; it.onInteract(it);
  });
  await h.step(250);
  const ov = await shown(h);
  if (!ov.includes('screen-plan')) throw new Error('the plan did not open: ' + ov.join(','));
  const before = await h.ev(() => ({ r:Object.assign({}, S.player.reputation), force:S.game.forceUsed }));
  await h.ev(p => { for (const [k, v] of Object.entries(p)) { const b = document.querySelector(`#screen-plan [data-k="${k}"][data-v="${v}"]`); if (b && !b.disabled) b.click(); } }, plan);
  await h.ev(() => document.getElementById('plan-go').click());
  await h.step(150);
  const after = await h.ev(() => ({ r:Object.assign({}, S.player.reputation), force:S.game.forceUsed, plan:S.game._plan }));
  await T.finishDialogue(h);
  const atEnd = await h.ev(() => ({ moving:ENGINE.movementEnabled, card:!!document.querySelector('#title-card.show'), total:S.game._wipeTotal,
    p:[+ENGINE.player.position.x.toFixed(2), +ENGINE.player.position.z.toFixed(2)], run:!!(TAC.m3.run() && TAC.m3.run().live) }));
  if (o.card !== false) await h.step(2200);
  const st = await h.ev(() => { const R = TAC.m3.run(); return R && { entry:R.entry, door:R.door, power:R.power, live:R.live, obi:R.obi.state, wipe:R.wipe.mode, pending:R.wipe.pending,
    uche:R.uche.mode, u:[+R.M.uche.position.x.toFixed(2), +R.M.uche.position.z.toFixed(2)], p:[+ENGINE.player.position.x.toFixed(2), +ENGINE.player.position.z.toFixed(2)],
    total:S.game._wipeTotal, moving:ENGINE.movementEnabled }; });
  return { before, after, atEnd, st, dAgency:after.r.agencyFavour - before.r.agencyFavour, dInteg:after.r.integrity - before.r.integrity,
    dTrust:after.r.publicTrust - before.r.publicTrust, dForce:after.force - before.force };
};

L.snap = h => h.ev(() => { const R = TAC.m3.run(); if (!R) return null; const M = R.M;
  return { t:+R.t.toFixed(2), obi:R.obi.state, outcome:R.obi.outcome, by:R.obi.by, wipe:R.wipe.mode, total:S.game._wipeTotal, wt:+(+S.game._wipeT || 0).toFixed(2),
    obiPos:M ? [+M.obi.position.x.toFixed(2), +M.obi.position.z.toFixed(2)] : null, obiVis:M ? M.obi.visible !== false : null,
    uchePos:M ? [+M.uche.position.x.toFixed(2), +M.uche.position.z.toFixed(2)] : null, uche:R.uche.mode, job:R.uche.job,
    susp:R.w ? +R.w.state.susp.toFixed(1) : null, level:R.w ? R.w.state.level : null, force:S.game.forceUsed, child:R.child.state,
    p:[+ENGINE.player.position.x.toFixed(2), +ENGINE.player.position.z.toFixed(2)], pursuit:TAC.state.pursuit }; });

// the arrest dialogue: the choice texts on offer, then choice i (null: leave it open)
L.arrestChoices = async h => {
  const r = await h.ev(() => { const it = ENGINE.interactables.find(i => i.label === 'Move on suspect' || i.label === 'Stop him'); if (!it) return 'no interactable'; it.onInteract(it); return 'ok'; });
  await h.step(100);
  await T.finishDialogue(h);
  return h.ev(r => { const c = [...document.querySelectorAll('#dlg-choices button')].map(b => b.textContent.replace(/^\d\./, '').trim());
    return c.length ? c : ['NONE ' + r + ' ov=' + [...document.querySelectorAll('.overlay.show')].map(e => e.id).join(',')]; }, r);
};
L.arrest = async (h, i = 0) => {
  const c = await L.arrestChoices(h);
  if (/^NONE/.test(c[0])) return { c, arrest:null };
  await T.choose(h, i);
  await T.finishDialogue(h);
  await h.step(100);
  return { c, arrest:await h.ev(() => S.game.moralChoices.arrest) };
};
L.childTalk = async (h, i) => {
  await h.ev(() => { const it = ENGINE.interactables.find(x => x.label === 'Calm and escort the child'); ENGINE.player.position.x = -0.7; ENGINE.player.position.z = 2.2; it.onInteract(it); });
  await h.step(120);
  await T.finishDialogue(h);
  const n = await h.ev(() => document.querySelectorAll('#dlg-choices button').length);
  if (!n) return 'no choices';
  await T.choose(h, Math.min(i, n - 1));
  await T.finishDialogue(h);
  await h.step(700);
  return 'ok';
};
L.walkOut = async h => {
  const r = await h.ev(() => { const it = ENGINE.interactables.find(i => i.label === 'Walk her out'); if (!it) return 'none';
    const m = it.mesh.position; ENGINE.player.position.x = m.x + 0.8; ENGINE.player.position.z = m.z + 0.8; it.onInteract(it); return 'ok'; });
  await h.step(120);
  await T.finishDialogue(h);
  await h.step(100);
  return r;
};
// o.again: press Extract a second time after that many ms (unless the aftermath is already up); cm / am count the
// completeMission and showAftermath calls this extraction made
L.extract = async (h, wait = 1800, o = {}) => {
  await h.ev(() => {
    window.__toasts = []; window.__cm = 0; window.__am = 0;
    for (const [n, k] of [['completeMission', '__cm'], ['showAftermath', '__am']]) {
      const f0 = window[n]; if (typeof f0 === 'function' && !f0.__m3c) { const f = function () { window[k]++; return f0.apply(this, arguments); }; f.__m3c = true; window[n] = f; }
    }
    const it = ENGINE.interactables.find(i => /^Extract/.test(i.label)); ENGINE.player.position.x = 0; ENGINE.player.position.z = 12.6; it.onInteract(it); });
  if (o.again) {
    await h.step(o.again);
    await h.ev(() => { if (document.querySelector('#screen-aftermath.show')) return; const it = ENGINE.interactables.find(i => /^Extract/.test(i.label)); if (it) it.onInteract(it); });
    await h.step(Math.max(0, wait - o.again));
  } else await h.step(wait);
  return h.ev(() => ({ toasts:window.__toasts.filter(t => /OPERATION|UCHE/.test(t[0])), done:S.game.completedMissions.includes('m3'),
    aftermath:!!document.querySelector('#screen-aftermath.show'), head:(S.game.headlines.slice(-1)[0] || {}).head || null,
    civ:S.game.civiliansRescued, force:S.game.forceUsed, gentle:!!S.game.flags.child_gentle, cm:window.__cm, am:window.__am }));
};
L.realtime = async (h, secs, every = 0.25, o = {}) => {
  const out = [];
  for (let s = 0; s < secs - 1e-9; s += every) {
    out.push(await h.ev(every => { __m3.run(every); const R = TAC.m3.run(), el = document.querySelector('#radio-sub.show');
      return { t:R ? +R.t.toFixed(2) : null, obi:R ? R.obi.state : null, strip:el ? ((el.querySelector('.rs-text') || {}).textContent || '') : null, now:performance.now() }; }, every));
    await h.step(Math.round(every * 1000));
    if (o.stop && await h.ev(expr => !!(new Function('return (' + expr + ')'))(), o.stop)) break;
  }
  return out;
};
// the laptop: staged at (2.38, −1.02); a field skill is won on the spot; seq:true asserts the staged reach first
L.laptop = async (h, o = {}) => {
  const pre = await h.ev(seq => {
    window.__toasts = [];
    const it = ENGINE.interactables.find(i => i.label === 'Inspect laptop' || i.label === 'Stop laptop wipe');
    if (!it) return { none:true };
    ENGINE.player.position.x = ENGINE._mansion ? 2.38 : it.mesh.position.x + 0.6; ENGINE.player.position.z = ENGINE._mansion ? -1.02 : it.mesh.position.z;
    const u = ENGINE.player.userData;
    if (seq) { u._skinned = true; u.anim = u.anim || { play(){}, oneShot(){}, update(){} }; }
    it.onInteract(it);
    const s = ENGINE.seq;
    const out = { seq:s ? { spot:s.o.spot, face:s.o.face, clip:s.o.clip } : null };
    if (seq) u._skinned = false;
    return out;
  }, !!o.seq);
  if (pre.none) return { none:true };
  await h.step(150);
  const mg = (await shown(h)).includes('screen-minigame');
  if (mg) {
    if (o.mgHold) await h.step(o.mgHold);
    await h.ev(() => { const run = MINI.active; if (run && run.phase !== 'play') { run.phase = 'play'; } if (MINI.active) miniSuccess(MINI.active, { stars:3 }); });
    await h.step(400);
    for (let i = 0; i < 6; i++) { const sh = await shown(h); if (!sh.includes('screen-minigame')) break; await h.ev(() => { const b = document.querySelector('#mg-actions button'); if (b) b.click(); else showOverlay(null); }); await h.step(250); }
  }
  await h.ev(() => { const q = ENGINE.seq; if (q) { if (q.o.onHit && !q.hit) { q.hit = true; q.o.onHit(); } if (q.o.done) q.o.done(); ENGINE.seq = null; if (typeof TPCAM !== 'undefined') TPCAM.override = null; } });
  await h.step(100);
  return h.ev(({ mg, pre }) => ({ mg, seq:pre.seq, files:(S.game.flags.m3_files || null) && S.game.flags.m3_files.length, list:S.game.flags.m3_files || null,
    ledger:(S.game.flags.m3_files || []).includes('ledger_q3.xlsx'), pct:S.game.flags.m3_wipe_pct, ev:!!S.game._evLaptop,
    custody:((typeof I === 'function' && I().items.laptop) || { custody:[] }).custody.map(c => c.t), plug:(S.game._sq && S.game._sq.st && S.game._sq.st.m3_plug) || null,
    toasts:window.__toasts.slice(), screen:ENGINE._mansion ? ENGINE._mansion.screenState : null }), { mg, pre });
};
L.toasts = h => h.ev(() => (window.__toasts || []).slice());
L.ev = (h, type) => T.events(h, type);
// in-page: run until a predicate (a string expression) holds, or max seconds; returns the seconds run
L.until = (h, expr, max = 10) => h.ev(({ expr, max }) => __m3.run(max, () => (new Function('return (' + expr + ')'))()), { expr, max });
// save fixtures, composed into one self-contained state function (it is stringified into the page):
//   kcFair (the side gate, KC's civilians), squad (Squad Trust: the rear post), tip (Street Sources), recruit
const SNIP = { kcFair:"S.game.moralChoices.market_runner = 'caught'; S.game.moralChoices.choice = 'detain';",
  squad:"S.player.skills = (S.player.skills || []).concat(['squad']);", tip:'S.game._tipM3 = true;',
  recruit:"S.game.difficulty = 'recruit';", crisis:"S.player.skills = (S.player.skills || []).concat(['crisis']);" };
L.state = (...keys) => new Function('S', keys.map(k => SNIP[k] || k).join('\n'));
module.exports = L;
