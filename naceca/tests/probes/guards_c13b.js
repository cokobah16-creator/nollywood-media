// Team guards: Case 13½ regression checks (ported from the defects review's d_c13b). Without the vehicle library
// (VEHMODE=none, the default: what ART.failed gives; VEHMODE=fake forces a fake one), the witness branch and then a
// replay on the cold branch (BRANCH=witness or BRANCH=cold runs only that one):
//   D5   the Prado (a stand-in box when there is no vehicle library) comes; ereba_photo is collected
//   D18  cold branch, sitting down before his round: Uche says "The book stays behind his glass tonight."
//   D11  the replay starts clean (s2_bitrus in both stores, the case's exhibits, evQ, the documents' attempts)
//   R11  Senior: Uche's intro has no "Be a customer. Go and drink tea."; no "go and sit with Baba Shayi" after the book
//   R14  the photo window runs at the Action-pace rate (Relaxed 0.75)
//   R08  viewfinder brackets manila (green when on), caption in the mono face; the flash at .35 at most, 0 on reduce-motion
const { s2start, use, talk, solve } = require('../scen13.js');
const G = require('./guards_lib.js');
const st = T => T.ev(() => JSON.stringify({ objs: (S.game.objectives || []).map(o => (o.done ? '+' : '.') + o.id).join(' '), ev: (S.game._opEv || []).map(id => id + ':' + (S.game.evQ || {})[id]).join(' '),
  mc: Object.fromEntries(Object.entries(S.game.moralChoices || {}).filter(([k]) => /^s2_(bitrus|ninth)/.test(k))), veh: typeof VEH !== 'undefined' && !!VEH.ready, suv: !!V13.rt.suv, standIn: !!(V13.rt.suv && V13.rt.suv.userData && V13.rt.suv.userData.standIn), mv: ENGINE.movementEnabled }));
/* the bench, the Prado, the driver, the end; rate: measure the photo window's rate first (Relaxed) */
async function theCar(T, C, tag, rate) {
  await use(T, 'Sit with Baba Shayi');
  await T.until(() => !document.querySelector('#title-card.show'), 30000);
  let measured = !rate, aimedYet = false, vf = null;
  for (let k = 0; k < 90; k++) {
    const s = await T.ev(() => ({ dlg: document.getElementById('screen-dialogue').classList.contains('show') ? DLG.scriptKey : null, aft: document.getElementById('screen-aftermath').classList.contains('show'), shot: !!V13.rt.shot, ereba: !!V13.rt.ereba }));
    if (s.aft) break;
    if (s.dlg) { T.log('  dialogue', s.dlg); await talk(T); continue; }
    if (s.shot && s.ereba && !measured) {
      measured = true;
      // look away from him, on Relaxed, and watch the window's clock against game time
      await T.ev(() => { SETTINGS.difficulty = 'story'; const P = ENGINE.player.position, E = V13.rt.ereba.position; ENGINE.cameraYaw = Math.atan2(E.x - P.x, E.z - P.z) + Math.PI; ENGINE._lastCamDrag = performance.now(); window.__agdt = 0; ENGINE._gSA = ENGINE.sceneAlways; const sa = ENGINE.sceneAlways; ENGINE.sceneAlways = function (dt) { window.__agdt += dt; return sa.apply(this, arguments); }; });
      const a = await T.ev(() => ({ l: V13.rt.shot && V13.rt.shot.left, g: window.__agdt }));
      await T.wait(2500);
      const b = await T.ev(() => ({ l: V13.rt.shot && V13.rt.shot.left, g: window.__agdt }));
      await T.ev(() => { SETTINGS.difficulty = 'standard'; if (ENGINE._gSA) { ENGINE.sceneAlways = ENGINE._gSA; ENGINE._gSA = null; } });
      const dl = a.l - b.l, dg = b.g - a.g;
      C.ok('R14-photo-relaxed', a.l != null && b.l != null && dg > 0.4 && Math.abs(dl / dg - 0.75) < 0.05, `photo window -${dl.toFixed(2)} s over ${dg.toFixed(2)} s of game time (want x0.75)`);
      vf = await T.ev(() => { const el = document.getElementById('c13b-vf'), i = el && el.querySelector('i'), em = el && el.querySelector('em'); return el && { shown: getComputedStyle(el).display !== 'none', on: el.classList.contains('on'), i: i && getComputedStyle(i).borderTopColor, em: em && getComputedStyle(em).fontFamily, emc: em && getComputedStyle(em).color }; });
    }
    if (s.shot && s.ereba) {
      await T.ev(() => { const P = ENGINE.player.position, E = V13.rt.ereba.position; P.set(E.x + 0.5, 0, E.z + 8); ENGINE.cameraYaw = Math.atan2(E.x - P.x, E.z - P.z); ENGINE.playerYaw = ENGINE.cameraYaw; ENGINE._lastCamDrag = performance.now(); });
      if (!aimedYet) {
        aimedYet = true; await T.wait(400);
        const on = await T.ev(() => { const el = document.getElementById('c13b-vf'), i = el && el.querySelector('i'); return el && { on: el.classList.contains('on'), i: i && getComputedStyle(i).borderTopColor }; });
        if (vf) vf.onState = on;
      }
    }
    await T.wait(1000);
  }
  if (vf) {
    const css = await T.ev(() => (document.getElementById('c13b-css') || {}).textContent || '');
    const flashGo = (css.match(/#c13b-flash\.go\{opacity:([\d.]+)/) || [])[1];
    C.ok('R08-viewfinder', vf.i === 'rgb(233, 220, 192)' && /JetBrains Mono/.test(vf.em) && vf.emc === 'rgb(233, 220, 192)' && (!vf.onState || !vf.onState.on || vf.onState.i === 'rgb(11, 110, 79)'), JSON.stringify(vf));
    C.ok('R19-flash', flashGo != null && +flashGo <= 0.35 && /body\.reduce-motion #c13b-flash\.go\{opacity:0\}/.test(css), `flash opacity ${flashGo}; reduce-motion rule ${/body\.reduce-motion #c13b-flash\.go\{opacity:0\}/.test(css)}`);
  }
  T.log('end', tag, await st(T));
}
module.exports = async function (T) {
  const C = G.checks(T);
  const VM = process.env.VEHMODE || 'none', BR = process.env.BRANCH || 'both';
  const fake = () => VM === 'fake' ? T.ev(() => { VEH.ready = true; VEH.spawn = () => new THREE.Group(); VEH.setDoors = () => {}; }) : null;
  const seniorIntro = async () => {
    const intro = await G.said(T, "^RADIO SGT. UCHE: In Maitama");
    C.ok('R11-intro-senior', intro.length >= 1 && intro.every(s => !/Be a customer|drink tea/.test(s)), JSON.stringify(intro.slice(-1)));
  };
  /* ================= the witness branch ================= */
  if (BR !== 'cold') {
    await G.instrument(T);
    T.log('witness run', VM, await s2start(T, 'm13b', "S.game.completedMissions.push('m13'); S.game.moralChoices.s2_ninth = 'refuse'; S.game.difficulty = 'senior';"));
    await fake();
    await T.ev(() => { SETTINGS.difficulty = 'standard'; SETTINGS.timed = 'normal'; });
    await T.until(() => !V13.rt.intro && ENGINE.movementEnabled, 30000); await T.wait(4500);
    T.log('start', await st(T));
    await seniorIntro();
    await use(T, 'Have tea'); await talk(T, [0]);
    await use(T, 'Talk to the gateman');
    await talk(T, ['NACECA', 'student', 'Keep the book safe']);
    await T.until(() => document.querySelector('#screen-puzzle.show .v12-opt'), 60000);
    await solve(T, 'm13b_book');
    await T.wait(2500);
    const wait = await G.said(T, 'go and sit with Baba Shayi');
    C.ok('R11-wait-senior', wait.length === 0, wait.length ? JSON.stringify(wait) : 'no "go and sit with Baba Shayi" on Senior');
    T.log('before bench', await st(T), await G.labels(T));
    await theCar(T, C, 'witness', true);
    const w = await T.ev(() => ({ held: V13.hasEv('ereba_photo'), q: (S.game.evQ || {}).ereba_photo, obj: ((S.game.objectives || []).find(o => o.id === 'o13b_ereba') || {}).done, book: (S.game.evQ || {}).visitor_book }));
    C.ok('D5-witness', w.held && w.q === 'good' && w.obj, `${VM}: ereba_photo ${w.held ? w.q : 'missing'}, o13b_ereba ${w.obj ? 'done' : 'not done'}; visitor_book ${w.book}`);
  }
  /* ================= the cold branch (a replay after the witness run) ================= */
  if (BR !== 'witness') {
    const dirt = "S.game.completedMissions.push('m13', 'm13b'); S.game.moralChoices.s2_ninth = 'refuse'; S.game.difficulty = 'senior';" +
      "S.game.evidence = (S.game.evidence || []).concat([{ id:'visitor_book_photo', name:'Photos of the visitor book' }, { id:'visitor_book', name:'The Maitama visitor book' }]);" +
      "S.game.evQ = Object.assign(S.game.evQ || {}, { visitor_book_photo:'weak', visitor_book:'good', ereba_photo:'good' });" +
      "S.game._docMiss = Object.assign(S.game._docMiss || {}, { m13b_book:1, m13b_book_photo:2 }); S.game._docFree = Object.assign(S.game._docFree || {}, { m13b_book:true }); S.game._docLocked = Object.assign(S.game._docLocked || {}, { m13b_book_photo:true });" +
      "S.game.moralChoices.s2_bitrus = 'witness'; S.game.flags = Object.assign(S.game.flags || {}, { s2_bitrus:'witness' });";
    await G.instrument(T);
    T.log('cold run (replay)', VM, await s2start(T, 'm13b', dirt));
    await fake();
    const clean = await T.ev(() => ({ ev: (S.game.evidence || []).filter(e => e && /^(visitor_book|visitor_book_photo|ereba_photo)$/.test(e.id)).map(e => e.id),
      q: ['visitor_book', 'visitor_book_photo', 'ereba_photo'].filter(id => (S.game.evQ || {})[id] !== undefined),
      docs: ['_docMiss', '_docFree', '_docLocked'].flatMap(s => ['m13b_book', 'm13b_book_photo'].filter(k => (S.game[s] || {})[k] !== undefined).map(k => s + '.' + k)),
      flag: [(S.game.moralChoices || {}).s2_bitrus, (S.game.flags || {}).s2_bitrus].filter(v => v !== undefined) }));
    C.ok('D11-replay-clean', !clean.ev.length && !clean.q.length && !clean.docs.length && !clean.flag.length, JSON.stringify(clean));
    await T.until(() => !V13.rt.intro && ENGINE.movementEnabled, 30000); await T.wait(4500);
    if (BR === 'cold') await seniorIntro();
    await use(T, 'Have tea'); await talk(T, [2]);
    await use(T, 'Talk to the gateman'); await talk(T, ['Delivery']);
    await T.wait(1500);
    T.log('cold, before the bench', await st(T), await G.labels(T));
    const n0 = (await G.said(T, 'The book stays behind his glass tonight')).length;
    await theCar(T, C, 'cold', false);
    const line = await G.said(T, 'The book stays behind his glass tonight');
    const objs = await T.ev(() => (S.game.objectives || []).map(o => o.id));
    C.ok('D18-line', line.length === n0 + 1 && !objs.includes('o13b_book'), `${JSON.stringify(line.slice(-1))}; o13b_book ${objs.includes('o13b_book') ? 'still listed' : 'dropped'}`);
    const c = await T.ev(() => ({ held: V13.hasEv('ereba_photo'), q: (S.game.evQ || {}).ereba_photo }));
    C.ok('D5-cold', c.held && c.q === 'good', `${VM}: ereba_photo ${c.held ? c.q : 'missing'}`);
  }
  C.done();
};
