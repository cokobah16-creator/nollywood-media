// Case 13½ — run 1: truth → witness (tea: treat).  run 2: truth → photo (tea: greet).  run 3: lie → stealth photo through the glass (tea: ask).
const { s2start, use, talk, solve } = require('../scen13.js');
const path = require('path');
/* the machine is shared and frames are slow: run small, go full size for the screenshots */
const FULL = T => T.mode === 'phone' ? { width: 844, height: 390 } : { width: 1280, height: 720 };
const SMALL = T => T.mode === 'phone' ? { width: 844, height: 390 } : { width: 640, height: 360 };
async function shot(T, name) {
  try {
    if (T.mode !== 'phone') { await T.page.setViewportSize(FULL(T)); await T.wait(2600); }
    await T.page.screenshot({ path: path.join((process.env.SHOTS || path.join(__dirname, '..', 'shots')), `probe_c13b_${T.mode}_${name}.png`), timeout: 150000 }); console.log('  shot', name);
  } catch (e) { console.log('  shot FAILED', name, String(e.message).slice(0, 80)); }
  if (T.mode !== 'phone') await T.page.setViewportSize(SMALL(T));
}
/* the machine is shared: low graphics keep the frames coming (no post-processing, no shadow maps) */
const lowGfx = T => T.ev(() => { if (typeof applyGraphics === 'function') applyGraphics('low'); });
const fps = T => T.ev(() => new Promise(res => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else res(n / 2); }; requestAnimationFrame(f); }));
async function hurry(T) { await T.ev(() => { for (const m of (V13.rt.movers || [])) { const e = m.pts[m.pts.length - 1]; m.ch.position.x = e.x; m.ch.position.z = e.z; m.i = m.pts.length - 1; } }); }
const st = T => T.ev(() => ({
  mc: JSON.stringify(Object.fromEntries(Object.entries(S.game.moralChoices || {}).filter(([k]) => /^s2_/.test(k)))),
  opEv: (S.game._opEv || []).map(id => id + ':' + (S.game.evQ || {})[id]).join(' '),
  objs: (S.game.objectives || []).map(o => (o.done ? '✓' : '·') + o.id).join(' '),
  gate: V13.rt.gate ? JSON.stringify({ baked: V13.rt.gate.baked, open: +(V13.rt.gate.open || 0).toFixed(2), world: !!V13.rt.gate.world }) : null,
  gateSrc: JSON.stringify(V13.src('GATE')), phone: Object.keys(V12.mem().phone || {}).join(','),
}));
const dlgOpen = () => document.getElementById('screen-dialogue').classList.contains('show');

/* the SUV, the driver, the photograph (aimCam: point the camera at him), then the end */
async function theCar(T, tag, aimCam, slow) {
  await use(T, 'Sit with Baba Shayi');
  await T.until(() => !document.querySelector('#title-card.show') && V13.rt.suv, 30000);
  await T.until(() => V13.rt.suv.position.z < 9.5, 120000);       // the gate is sliding open
  await shot(T, tag + '_suv_arrive');
  if (slow) await hurry(T);
  await T.until(dlgOpen, 120000);                                  // m13b_suv
  await T.wait(1200); await shot(T, tag + '_suv_stop');
  await talk(T);
  await T.wait(800); await shot(T, tag + '_driver');
  if (aimCam) {
    await T.until(() => V13.rt.shot && V13.rt.ereba, 20000);
    if (slow) await hurry(T);                                         // round the back of the Prado to the street-side door
    await T.until(() => (V13.rt.movers || []).every(m => m.ch !== V13.rt.ereba), 60000);
    await T.ev(() => { const P = ENGINE.player.position, E = V13.rt.ereba.position; ENGINE.cameraYaw = Math.atan2(E.x - P.x, E.z - P.z); ENGINE.playerPitch = 0.12; ENGINE._lastCamDrag = performance.now(); });
    await T.wait(1200); await shot(T, tag + '_viewfinder');
    T.log('aim', JSON.stringify(await T.ev(() => {
      const v = document.querySelector('#c13b-vf em'), E = V13.rt.ereba, cam = ENGINE.camera, f = n => +n.toFixed(2);
      const ndc = h => { const p = new THREE.Vector3(E.position.x, h, E.position.z).project(cam); return [f(p.x), f(p.y)]; };
      return { vf: v && v.textContent, vfTop: document.getElementById('c13b-vf').style.top, at: [f(E.position.x), f(E.position.z)], vis: E.visible, inScene: !!E.parent, head: ndc(1.7), feet: ndc(0.05),
        cam: [f(cam.position.x), f(cam.position.y), f(cam.position.z)], suv: V13.rt.suv && [f(V13.rt.suv.position.x), f(V13.rt.suv.position.z), f(V13.rt.suv.rotation.y)] };
    })));
  }
  await T.until(() => !V13.rt.shot, 200000);
  T.log('after the driver', JSON.stringify(await st(T)));
  if (slow) { await T.wait(1500); await hurry(T); await T.wait(1500); await hurry(T); }
  await T.until(dlgOpen, 120000);                                  // m13b_end
  await T.wait(1500); await shot(T, tag + '_saloon');
  await talk(T);
  T.log('aftermath?', await T.until(() => document.getElementById('screen-aftermath').classList.contains('show'), 30000));
  await T.wait(800); await shot(T, tag + '_aftermath');
  T.log('end', tag, JSON.stringify(await st(T)));
}

module.exports = async function (T) {
  /* ================= run 1: truth → witness ================= */
  T.log('run1 started', await s2start(T, 'm13b', "S.game.completedMissions.push('m13'); S.game.moralChoices.s2_ninth = 'refuse';"));
  await lowGfx(T); if (T.mode !== 'phone') await T.page.setViewportSize(SMALL(T));
  const F = await fps(T); const slow = F < 12; T.log('fps', F);
  await T.until(() => !V13.rt.intro && ENGINE.movementEnabled, 20000);
  await T.wait(800); await shot(T, 'w_street');
  T.log('start', JSON.stringify(await st(T)));
  await use(T, 'Have tea'); await T.wait(900); await shot(T, 'w_kiosk');
  await talk(T, [0]);
  await use(T, 'Talk to the gateman'); await T.wait(900); await shot(T, 'w_gatehouse');
  await talk(T, ['NACECA', 'student', 'Keep the book safe']);
  await T.until(() => document.querySelector('#screen-puzzle.show .v12-opt'), 150000);
  await T.wait(800); await shot(T, 'w_book');
  await solve(T, 'm13b_book');
  T.log('after book', JSON.stringify(await st(T)));
  await theCar(T, 'w', true, slow);

  if (T.mode === 'phone' || process.env.C13_ONE) return;            // one run on the phone (or when asked)
  /* ================= run 2: truth → photo ================= */
  T.log('run2 started', await s2start(T, 'm13b', "S.game.moralChoices.s2_ninth = 'bury';"));
  await T.until(() => !V13.rt.intro && ENGINE.movementEnabled, 20000);
  await use(T, 'Have tea'); await talk(T, [1]);
  await use(T, 'Talk to the gateman'); await talk(T, ['NACECA', 'law requires', 'creeks', 'photograph the pages']);
  await T.until(() => document.querySelector('#screen-puzzle.show .v12-opt'), 150000);
  await solve(T, 'm13b_book_photo');
  T.log('after photo pages', JSON.stringify(await st(T)));
  await theCar(T, 'p', false, slow);                                // let the driver go: no face

  /* ================= run 3: lie → the book through the glass ================= */
  T.log('run3 started', await s2start(T, 'm13b', ""));
  await T.until(() => !V13.rt.intro && ENGINE.movementEnabled, 20000);
  await use(T, 'Have tea'); await talk(T, [2]);
  await use(T, 'Talk to the gateman'); await talk(T, ['Delivery']);
  await T.wait(1500); await shot(T, 'c_shut');
  T.log('cold', JSON.stringify(await st(T)));
  // wait for his round to take him up the road
  await T.until(() => V13.rt.round, 120000);
  if (slow) await hurry(T);
  await T.until(() => V13.rt.bitrus.visible && V13.rt.bitrus.position.z > 3, 120000);   // out through the wicket, on the road
  if (slow) await hurry(T);                                                              // up to the top of his round
  T.log('bitrus at', await T.ev(() => V13.rt.bitrus.position.z.toFixed(1)), 'neighbour looking', await T.ev(() => V13.rt.nbLook));
  await T.until(() => V13.rt.nbLook === false, 60000);              // the man at No. 21 is on his phone
  await T.ev(() => { ENGINE.keys['KeyC'] = true; });
  await use(T, 'Photograph the book');
  await T.wait(1200); await shot(T, 'c_photo');
  T.log('photo?', await T.until(() => document.querySelector('#screen-puzzle.show .v12-opt'), 150000), JSON.stringify(await T.ev(() => ({ eyes: V13.rt.eyes && V13.rt.eyes.v, caught: V13.rt.caught }))));
  await T.ev(() => { ENGINE.keys['KeyC'] = false; });
  if (await T.ev(() => !!document.querySelector('#screen-puzzle.show .v12-opt'))) { await T.wait(600); await shot(T, 'c_book_photo'); await solve(T, 'm13b_book_photo'); }
  else await talk(T);
  T.log('after stealth', JSON.stringify(await st(T)));
  await theCar(T, 'c', true, slow);
};
