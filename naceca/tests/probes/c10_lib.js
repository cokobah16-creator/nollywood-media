// Case 10 probe helpers (shared by the c10_* probes)
const sc = require('../scen13.js');
const L = {};
L.sc = sc;
L.LITE = process.env.C10_LITE !== '0';
L.SPEED = +(process.env.C10_SPEED || 6);
/* start the case; lite = only the story's people and low graphics (the test machine renders ~0.2 fps otherwise) */
L.start = async (T, label) => {
  const ok = await sc.s2start(T, 'm10', L.LITE ? 'V13.c10lite = true; if (typeof applyGraphics === "function") applyGraphics("low");' : 'V13.c10lite = false;');
  T.log(label || 'start', ok, 'lite', L.LITE, 'speed', L.SPEED, await L.st(T));
  return ok;
};
L.fast = T => T.ev(s => { V13.c10speed = s; }, L.SPEED);
/* in a full-crowd run, hide the ambient crowd while waiting (the machine renders 4x faster) and show it for shots */
L.crowd = (T, on) => L.LITE ? null : T.ev(on => { const R = V13.rt, keep = new Set([R.karo, R.ejiro, R.efe, R.uche, R.boatman]);
  for (const c of (R.market || []).concat(R.walkers || [])) if (!keep.has(c) && !(c.userData && c.userData._gone)) c.visible = on; }, on);
L.shot = async (T, n) => { for (let i = 0; i < 4; i++) { try { await T.shot(n); return; } catch (e) { T.log('shot retry', n); await T.wait(4000); } } };
L.st = T => T.ev(() => JSON.stringify(V13.c10 ? V13.c10() : null));
L.until = async (T, src, ms, label) => {
  const ok = await T.until(new Function('return (' + src + ')'), ms || 60000);
  T.log(ok ? '  ok:' : '  TIMEOUT:', label || src, await L.st(T));
  return ok;
};
/* let the renderer draw n frames (the test machine draws about one a second) */
L.frames = (T, n) => T.ev(n => new Promise(res => { let k = 0; const f = () => { if (++k >= n) res(true); else requestAnimationFrame(f); }; requestAnimationFrame(f); }), n || 2);
/* hold a camera shot for a screenshot (the case's own shots use TPCAM.override too) */
L.cam = (T, pos, look) => T.ev(([p, l]) => { TPCAM.override = { pos: new THREE.Vector3(...p), look: new THREE.Vector3(...l) }; if (TPCAM.pos) { TPCAM.pos.set(...p); TPCAM.look.set(...l); } }, [pos, look]);
L.camOff = T => T.ev(() => { TPCAM.override = null; });
/* use an interactable from where the player stands (no teleport) */
L.useHere = async (T, re) => {
  const r = await T.ev(src => { const re = new RegExp(src, 'i'); const it = ENGINE.interactables.find(i => re.test(i.label || '')); if (!it) return 'none'; it.onInteract(); return 'ok ' + it.label; }, re);
  T.log('use here', re, '→', r); await T.wait(500); return r;
};
/* stand at (x,z) and look at Lucky (or a point) */
L.aim = (T, x, z, at) => T.ev(([x, z, at]) => {
  const p = ENGINE.player; p.position.set(x, 0, z);
  const t = at || V13.rt.lucky.position; const yaw = Math.atan2(t.x - x, t.z - z);
  p.rotation.y = yaw; ENGINE.playerYaw = ENGINE.cameraYaw = yaw; ENGINE.playerPitch = 0.1; TPCAM.cur = null;   // snap the follow camera
}, [x, z, at || null]);
/* keep aiming for ms (Lucky may move) */
L.watch = async (T, x, z, ms, stopSrc) => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (await T.ev(() => document.getElementById('screen-dialogue').classList.contains('show'))) return 'dialogue';
    if (stopSrc && await T.ev(new Function('return (' + stopSrc + ')'))) return 'stop';
    await L.aim(T, x, z); await T.wait(300);
  }
  return 'time';
};
/* wait until a conversation is open, then click through it */
L.talkWhen = async (T, picks, ms) => {
  const ok = await T.until(() => document.getElementById('screen-dialogue').classList.contains('show'), ms || 30000);
  if (!ok) { T.log('  no conversation opened', await L.st(T)); return false; }
  const who = await T.ev(() => (DLG && DLG.scriptKey) || '?');
  T.log('  talk', who);
  return sc.talk(T, picks);
};
L.docWhen = async (T, key, wrong, ms) => {
  // the document screen must be showing (a closed one from an earlier run keeps its buttons in the DOM)
  const ok = await T.until(() => document.getElementById('screen-puzzle').classList.contains('show') && !!document.querySelector('#screen-puzzle .v12-opt'), ms || 30000);
  if (!ok) { T.log('  no document opened', await L.st(T)); return false; }
  await sc.solve(T, key, wrong);
  // a wrong answer ends on CONTINUE once the misses run out
  for (let k = 0; k < 4; k++) {
    const open = await T.ev(() => document.getElementById('screen-puzzle').classList.contains('show'));
    if (!open) break;
    T.log('   doc still open:', await T.ev(() => (document.getElementById('v12-doc-msg') || {}).textContent || ''));
    await T.ev(() => { const b = document.getElementById('v12-doc-go'); if (b) b.click(); }); await T.wait(2500);
  }
  return true;
};
L.flags = T => T.ev(() => JSON.stringify({ mc: Object.fromEntries(Object.entries(S.game.moralChoices).filter(([k]) => /^s2_(karo|ejiro|jetty|statement)/.test(k))),
  ev: (S.game.evidence || []).filter(e => /^(pos_t4_log|bvn_link|cash_bundles|lucky_statement)$/.test(e.id)).map(e => e.id + ':' + (S.game.evQ || {})[e.id]).join(' '),
  karo_source: V13.s2().karo_source || 0, sources: V13.srcList ? V13.srcList().join(',') : '', objs: (S.game.objectives || []).map(o => (o.done ? '✓' : '·') + o.id).join(' ') }));
L.aftermath = async (T, label) => {
  const ok = await T.until(() => document.getElementById('screen-aftermath').classList.contains('show'), 60000);
  T.log(ok ? 'AFTERMATH' : 'NO AFTERMATH', label, await L.flags(T));
  return ok;
};
module.exports = L;
