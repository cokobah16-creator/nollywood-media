// Season 2: a case's opening beat (C.start, 700 ms after beginMissionCore) belongs to the run that started it.
// Codex finding on PR #7 (s2_core.js:608): QUIT or LOAD inside that window used to let the old case's start()
// open its dialogue over the title screen or the loaded game. Now the beat is skipped once the run (V13.rt) or
// the mission has changed; a normal start, and a LOAD that finds no save, still play it once.
//   NACECA_PAGE=<dir> node tests/t_s2.js probe:core_start_guard [desktop|phone]
const L = require('./core_lib.js'), sc = L.sc;
const S1 = sc.S1DONE + 'delete S.game.s2; V13.s2().hubs = Object.assign(V13.s2().hubs || {}, { skip: 1 }); V13._skipHubs = true;';
const look = T => T.ev(() => ({ ov: [...document.querySelectorAll('.overlay.show')].map(o => o.id).join(','), cur: S.game.currentMission,
  dlg: !!document.querySelector('#screen-dialogue.show'), key: (typeof DLG !== 'undefined' && DLG && DLG.scriptKey) || null, rtId: V13.rt && V13.rt.id }));
const begin = T => T.ev(code => { (new Function(code))(); showOverlay(null); loadMission('m9'); beginMission('m9'); }, S1);
const started = T => T.until(() => S.game.currentMission === 'm9' && ENGINE.player && S.game._opStart && !V13._pendingBegin, 90000);
module.exports = async function (T) {
  const C = L.checks(T);
  await L.capture(T);
  const dlgs = async () => (await L.got(T, 'dlg')).filter(k => k === 'm9_intro').length;

  // ---------- 1. QUIT inside the 700 ms window: no m9_intro over the title ----------
  await begin(T); await started(T);
  await T.ev(() => { document.getElementById('btn-quit').click(); });       // the pause menu's QUIT, as a player taps it
  await T.wait(1600);
  const q = await look(T), qn = await dlgs();
  T.log('quit inside the window', JSON.stringify(q), 'm9_intro calls', qn);
  C.check('QUIT within 700 ms of a case start: its opening dialogue never plays over the title', /screen-title/.test(q.ov) && !q.dlg && qn === 0 && !q.rtId, { q, qn });

  // ---------- 2. CONTINUE back in: the beat plays once, as it should ----------
  await T.ev(() => { showOverlay(null); loadMission('m9'); beginMission('m9'); }); await started(T);
  await T.wait(1600);
  const c = await look(T), cn = await dlgs();
  T.log('normal start', JSON.stringify(c), 'm9_intro calls', cn);
  C.check('a normal start plays the opening beat once', c.dlg && c.key === 'm9_intro' && cn === 1 && c.rtId === 'm9', { c, cn });
  await sc.talk(T);

  // ---------- 3. LOAD inside the window, with a save of this same case: the loaded run's beat plays, the old one doesn't ----------
  await T.ev(() => { saveGame(true); document.getElementById('btn-quit').click(); }); await T.wait(300);
  await begin(T); await started(T);
  const n0 = await dlgs();
  await T.ev(() => { showOverlay('screen-pause'); document.getElementById('btn-load').click(); });   // LOAD, as the pause menu does it
  await T.until(() => S.game.currentMission === 'm9' && !V13._pendingBegin && ENGINE.movementEnabled !== undefined, 90000);
  await T.wait(2600);
  const l = await look(T), ln = (await dlgs()) - n0;
  T.log('load inside the window', JSON.stringify(l), 'new m9_intro calls', ln);
  C.check('LOAD within 700 ms of a case start: the opening beat plays once, for the loaded run only', ln === 1 && l.cur === 'm9' && !/screen-title/.test(l.ov), { l, ln });
  await sc.talk(T);

  // ---------- 4. LOAD that finds no save: the case stays and its beat still plays ----------
  await T.ev(() => { document.getElementById('btn-quit').click(); }); await T.wait(300);
  await T.ev(() => { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} });
  await begin(T); await started(T);
  const m0 = await dlgs();
  await T.ev(() => { showOverlay('screen-pause'); document.getElementById('btn-load').click(); });
  await T.wait(1600);
  const n = await look(T), nn = (await dlgs()) - m0;
  T.log('load, no save', JSON.stringify(n), 'new m9_intro calls', nn);
  C.check('LOAD with no save inside the window: the case keeps its run and the beat plays once', nn === 1 && n.cur === 'm9' && n.rtId === 'm9', { n, nn });
  C.done();
};
