// Team B's helpers for the tac_m2_* scenarios (run on its own it is a no-op that passes).
// Built on Team A's tactics_lib.cjs (T), which is never edited here.
//   M.boot(h, {seed, state})      T.deviceMarket (the dressed colliders, lanes installed) + the in-page helpers below
//   M.tunde(h, {at:[x,z], choice}) stand at `at`, open market_intro, click through, pick `choice` (0 quiet, 1 loud)
//   M.dlg(h)                      the dialogue on screen: {key, lines:[speaker,text], choices:[text]} or null
//   in page: __m2.snap() / __m2.reset(o) restore the market in place (crowd, KC, flags, the run) for paired runs;
//            __m2.pursue(o) the scout's pursuer (T.pursue's algorithm, callable inside the same evaluate);
//            __m2.cell(o) one matrix run: reset, seed, skills, Uche's post, the opening, the pursuer → result
const T = require('./tactics_lib.cjs');
const M = async h => { h.log('tac_m2_lib: helper module'); };
M.T = T;
M.lib = T.lib;

const PAGE = () => {
  const hyp = Math.hypot;
  const M = window.__m2 = {};
  M.snap = () => {
    const crowd = (ENGINE._marketCrowd || []).map(m => ({ m, x:m.position.x, z:m.position.z, rx:m.rotation.x, ry:m.rotation.y, vis:m.visible,
      t:m.userData.target ? [m.userData.target.x, m.userData.target.z] : null }));
    const K = ENGINE._marketKC;
    M._snap = { crowd, kc:{ x:K.position.x, z:K.position.z, ry:K.rotation.y }, trust:S.player.reputation.publicTrust };
    return crowd.length;
  };
  M.reset = (o = {}) => {
    if (typeof CHASE !== 'undefined' && CHASE.active) stopChase();
    try { if (typeof MINI !== 'undefined' && MINI.active) miniClose({ ok:false, aborted:true }); } catch (e) {}
    showOverlay(null);
    if (typeof DLG !== 'undefined') { DLG.script = null; DLG.queue = []; clearInterval(DLG._tw); }
    if (typeof cinematic === 'function') cinematic(false);
    const s = M._snap;
    for (const c of s.crowd) {
      const m = c.m; m.position.x = c.x; m.position.z = c.z; m.rotation.x = c.rx; m.rotation.y = c.ry; m.visible = c.vis;
      m.userData._down = false; m.userData._downT = 0; m.userData._stayDown = false;
      if (c.t && m.userData.target) { m.userData.target.x = c.t[0]; m.userData.target.z = c.t[1]; }
    }
    const K = ENGINE._marketKC, u = K.userData;
    K.position.x = s.kc.x; K.position.z = s.kc.z; K.rotation.y = s.kc.ry; K.rotation.x = 0; K.visible = true;
    u._down = false; u._caught = false; u._arrested = false;
    if (u.armL) u.armL.rotation.x = 0; if (u.armR) u.armR.rotation.x = 0;
    const g = S.game;
    g._marketTunde = o.tunde !== false; g._marketScanned = o.scanned !== false;
    g.moralChoices.market_runner = null; g._opBumps = 0;
    if (g.flags) { delete g.flags.m2_how; delete g.flags.m2_post; }
    S.player.reputation.publicTrust = s.trust;
    S.player.skills = (S.player.skills || []).filter(k => k !== 'pursuit');
    if (o.pursuit) S.player.skills.push('pursuit');
    ENGINE._stagger = 0; ENGINE.speedMul = 1; ENGINE.movementEnabled = true;
    ENGINE.keys.ShiftLeft = false; ENGINE.keys.KeyC = false;
    WAY._forceLos = null;
    if (typeof TPCAM !== 'undefined') TPCAM.override = null;
    TAC.m2.cfg.off = !!o.off;
    TAC.m2._reset({ awake:!!o.awake });
    TAC.player._reset();
    return true;
  };
  // the chase pursuer from tactics_lib (T.pursue), as an in-page function
  M.pursue = (o = {}) => {
    const c = CHASE.active, P = ENGINE.player.position, b = ENGINE.bounds; if (!c) return null;
    const v = o.v || 4.42, delay = o.delay || 0;
    let minGap = 1e9, mode = 'chase', reachedPt = null, ptHold = 0;
    const moveTo = (ax, az) => { const dx = ax - P.x, dz = az - P.z, d = hyp(dx, dz); if (d < 0.05) return;
      const s = Math.min(d, v * (ENGINE.speedMul || 1) * __wf.dt), nx = P.x + dx / d * s, nz = P.z + dz / d * s;
      if (!blockedAt(nx, P.z) && nx > b.minX && nx < b.maxX) P.x = nx; if (!blockedAt(P.x, nz) && nz > b.minZ && nz < b.maxZ) P.z = nz; };
    const follow = () => { const R = c.runner.position, ls = c.fx && c.fx.mode === 'lastseen';
      const pts = WAY.routePoints(c, P, ls && c.fx.ls ? c.fx.ls : R, ls ? c.fx.lsSeg : c.seg);
      let aim = pts[1]; if (pts.length > 2 && hyp(aim.x - P.x, aim.z - P.z) < 0.3) aim = pts[2]; moveTo(aim.x, aim.z); };
    const n = __wf.run(o.maxT || 60, (i, t) => {
      if (!CHASE.active) return true;
      const R = c.runner.position;
      if (i * __wf.dt >= delay) {
        if (o.strategy === 'stand') {}
        else if (o.strategy === 'intercept' && mode === 'chase') {
          const d = hyp(o.pt[0] - P.x, o.pt[1] - P.z);
          if (d > 0.3) moveTo(o.pt[0], o.pt[1]); else { if (reachedPt == null) reachedPt = t; ptHold += __wf.dt; }
          const gap = hyp(R.x - P.x, R.z - P.z);
          if ((reachedPt != null && (gap < 4 || c.seg > o.pastSeg)) || ptHold > (o.holdMax || 8)) mode = 'follow';
        } else follow();
      }
      minGap = Math.min(minGap, hyp(R.x - P.x, R.z - P.z));
    });
    return { caught:!CHASE.active && c.runner.visible !== false, escaped:c.runner.visible === false, active:!!CHASE.active,
      t:+(n / 60).toFixed(2), minGap:+minGap.toFixed(2), bumps:c.bumps || 0, how:c.how || null, by:c.by || null,
      kc:[+c.runner.position.x.toFixed(1), +c.runner.position.z.toFixed(1)] };
  };
  // one matrix run: {seed, off, pursuit, post:'none'|'corner'|'back'|'van', enroute:secs, at:[x,z], row, strategy, delay, pt, pastSeg}
  M.cell = (o) => {
    M.reset({ off:o.off, pursuit:o.pursuit });
    window.__tacSeed(o.seed);
    if (!o.off && o.post && o.post !== 'none') {
      if (o.enroute) { TAC.m2.post(o.post, { quiet:true }); const P = ENGINE.player.position; P.x = -20; P.z = -20; __wf.run(o.enroute); }
      else TAC.m2._place(o.post);
    }
    const P = ENGINE.player.position; P.x = o.at[0]; P.z = o.at[1];
    TAC.player._reset();
    TAC.m2._confront(o.off ? null : o.row);
    if (!CHASE.active) return { started:false };
    const r = M.pursue({ strategy:o.strategy, delay:o.delay, pt:o.pt, pastSeg:o.pastSeg, maxT:o.maxT || 60 });
    return Object.assign(r, { started:true });
  };
  return true;
};

M.install = h => h.ev(`(${PAGE.toString()})()`);
M.boot = async (h, o = {}) => {
  const r = await T.deviceMarket(h, o);
  await M.install(h);
  return r;
};
// Tunde, through the real dialogue: stand at `at`, open it as his interactable does, click through
M.tunde = async (h, o = {}) => {
  await h.ev(at => { const P = ENGINE.player.position; P.x = at[0]; P.z = at[1]; TAC.player._reset(); startDialogue('market_intro'); }, o.at || [-5.2, -2.4]);
  const first = await M.dlg(h);
  const a = await T.finishDialogue(h);
  if (a === 'choice') { await T.choose(h, o.choice || 0); await T.finishDialogue(h); }
  return first;
};
M.dlg = h => h.ev(() => {
  if (!document.querySelector('#screen-dialogue.show') || !DLG.script) return null;
  return { key:DLG.scriptKey, idx:DLG.idx, lines:DLG.script.map(l => [l.speaker, l.text, l.textEn || null]),
    choices:[...document.querySelectorAll('#dlg-choices button')].map(b => b.textContent) };
});
// lift the phone: stand at `at` (optionally force KC's phase), press ACTION, play the field skill and the document
//   mg: 'ok' | 'back' (back off) | 'fail' (fail, then back off) | 'force' (fail, then FORENSIC BYPASS);  doc: 'ok' | 'back'
M.scan = async (h, o = {}) => {
  const pre = await h.ev(o => {
    const P = ENGINE.player.position; P.x = o.at[0]; P.z = o.at[1]; TAC.player._reset();
    if (o.phase) TAC.m2.setPhase(o.phase, 30);
    __wf.run(0.2);                                   // one tick at the spot
    const it = nearestInteractable();
    tryInteract();
    return { label:it && it.label, mini:!!(typeof MINI !== 'undefined' && MINI.active), doc:!!document.querySelector('#screen-puzzle.show'), scan:!!TAC.m2.run().scan };
  }, o);
  if (pre.mini) {
    for (let i = 0; i < 8; i++) {
      const r = await h.ev(mg => {
        const run = MINI.active; if (!run) return 'closed';
        if (mg === 'back') { miniBackOff(); return 'back'; }
        if (run.phase === 'play') {
          if (mg === 'fail' || mg === 'force') miniFail(run, 'test'); else miniSuccess(run, { stars:3 });
          return 'played';
        }
        const btns = [...document.querySelectorAll('#mg-actions button')];
        const b = run.phase === 'result' && (mg === 'fail' || mg === 'force') ? btns.find(x => mg === 'force' ? /FORENSIC BYPASS/.test(x.textContent) : /BACK OFF/.test(x.textContent)) : btns[0];
        if (b) b.click(); return 'click:' + (b && b.textContent.trim().slice(0, 20));
      }, o.mg || 'ok');
      await h.step(80);
      if (r === 'closed' || r === 'back') break;
    }
  }
  const doc = await h.ev(() => !!document.querySelector('#screen-puzzle.show'));
  if (doc) {
    await h.ev(how => {
      if (how === 'back') { document.getElementById('v12-doc-x').click(); return; }
      const spec = V12.docFromPuzzle('market_phone_scan');
      const oi = spec.options.findIndex(x => x.correct); const ob = document.querySelectorAll('#v12-opts .v12-opt')[oi]; if (ob) ob.click();
      const line = [...document.querySelectorAll('#v12-lines .v12-line.live')].find(l => spec.proof.some(x => l.textContent.includes(x))); if (line) line.click();
      const go = document.getElementById('v12-doc-go'); if (go && !go.disabled) go.click();
    }, o.doc || 'ok');
    if ((o.doc || 'ok') === 'ok') await h.step(1600); else await h.step(100);
  }
  const post = await h.ev(() => ({ scanned:!!S.game._marketScanned, open:[...document.querySelectorAll('.overlay.show')].map(e => e.id), pending:!!TAC.m2.run().scan }));
  return Object.assign({}, pre, { after:post, docShown:doc });
};
// step the world n seconds at 60 Hz (TAC ticks at 10 Hz inside)
M.run = (h, secs) => h.ev(s => __wf.run(s), secs);
M.state = h => h.ev(() => { const w = TAC.m2.kc(), R = TAC.m2.run(); const s = w ? w.state : {};
  return { susp:+(s.susp || 0).toFixed(1), level:s.level, active:s.active, seen:s.seen, cause:s.cause, why:s.why, whyPast:s.whyPast, glance:s.glance,
    phase:R && R.phase, phaseT:R && +R.phaseT.toFixed(2), watch:R && +R.watchSecs.toFixed(1), awake:R && R.awake, wary:R && R.wary }; });
module.exports = M;
