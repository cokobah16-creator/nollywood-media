// core: the playtest log (RT07/RT08/D10). V12.log is counted from before each start: mission_start and mission_end
// once per case, mission_start (and the office's own mission_end) once per office, evidence once per exhibit.
const L = require('./core_lib.js'), sc = L.sc;
module.exports = async function (T) {
  const C = L.checks(T);
  await L.capture(T);
  // ---------- Case 09, finished at once; the office after it, the real way ----------
  const ok = await sc.s2start(T, 'm9', 'delete S.game.s2;');
  T.log('m9', ok);
  // a document collects an exhibit, then the case calls V13.ev for the same one (Case 13's pattern)
  await T.ev(() => { collectEvidence({ id:'core_dup', name:'Core probe exhibit', xp:10 }); V13.ev('core_dup', 'Core probe exhibit', 'good', 40); V13.ev('core_dup', 'Core probe exhibit', 'weak', 40); });
  let n = await L.count(T, '^evidence:core_dup$');
  const q = await T.ev(() => S.game.evQ.core_dup);
  C.check('RT08 an exhibit collected by a document and then by V13.ev is logged once; its quality still set', n['evidence:core_dup'] === 1 && q === 'weak', JSON.stringify(n) + ' q=' + q);
  await T.ev(() => { try { endDialogue(); } catch (e) {} Object.assign(V13.mc(), { s2_custody:'signed', s2_method:'image', s2_abuja_call:'truth', s2_original:'kept' }); V13.recruitFromFlags(); V13.finish('m9'); });
  await T.until(() => document.getElementById('screen-aftermath').classList.contains('show'), 20000); await T.wait(1200);
  n = await L.count(T, '^mission_(start|end):m9$');
  C.check('RT07 Case 09: mission_start ×1 and mission_end ×1', n['mission_start:m9'] === 1 && n['mission_end:m9'] === 1, n);
  const sub = await T.ev(() => [...document.querySelectorAll('#aftermath-grid .cw-next-sub')].map(e => e.textContent).join(' | '));
  C.check('RT12 the Case 09 aftermath has no "missions 9–12" line', !/missions 9/.test(sub), sub || '(none)');
  await T.ev(() => { V13._skipHubs = false; delete V13.s2().hubs.skip; document.getElementById('btn-aftermath-continue').click(); });
  const okh = await T.until(() => S.game.currentMission === 'h9' && ENGINE.movementEnabled && !document.querySelector('#title-card.show'), 60000);
  await T.wait(1500);
  n = await L.count(T, '^mission_(start|end):h9$');
  C.check('RT07 the Benin office: mission_start ×1', okh && n['mission_start:h9'] === 1 && !n['mission_end:h9'], n);
  // leave the office: its own mission_end, then Case 10's start card
  await T.ev(() => { V13.done('hb_uche'); showOverlay(null); const it = ENGINE.interactables.find(i => i.label === V13.HUBS.h9.go); const P = ENGINE.player; const p = new THREE.Vector3(); it.mesh.getWorldPosition(p); P.position.set(p.x, 0, p.z - 1); it.onInteract(); });
  await T.until(() => S.game.currentMission === 'm10' && document.getElementById('screen-controls').classList.contains('show'), 30000);
  await T.ev(() => { const b = document.getElementById('btn-start-mission'); if (b && b.offsetParent) b.click(); });
  await T.until(() => S.game.currentMission === 'm10' && V13.rt && V13.rt.id === 'm10' && ENGINE.movementEnabled, 90000);
  await T.wait(1500);
  n = await L.count(T, '^mission_(start|end):(h9|m10)$');
  C.check('RT07 the office logs its own end once; Case 10 starts once', n['mission_end:h9'] === 1 && n['mission_start:m10'] === 1, n);
  const pt = await T.ev(() => { try { const s = V12.ptSummary(); return { started: s.started, ended: s.ended }; } catch (e) { return 'err ' + e; } });
  C.check('RT07 ptSummary counts each start once', pt && pt.started && pt.started.m9 === 1 && pt.started.h9 === 1 && pt.started.m10 === 1 && pt.ended && pt.ended.m9 === 1, pt);
  // the build tag and the playtest build agree (RT13)
  const tag = await T.ev(() => ({ tag: (document.getElementById('v12-build') || {}).textContent, v12: V12.version, v13: V13.version }));
  C.check('RT13 the build tag and versions', tag.tag === 'BUILD v13 · THE CASE FILE + SEASON 2' && tag.v13 === 'v13' && /^v13\+beta\+s2$/.test(tag.v12), tag);
  C.done();
};
