// Baseline for merge_repo: the same Season 1 steps on a page WITHOUT Season 2, so the two runs can be compared line by line
async function interact(T, re) {
  return T.ev(src => { const r = new RegExp(src, 'i'); const it = ENGINE.interactables.find(i => r.test(i.label || '')); if (!it) return 'none: ' + ENGINE.interactables.map(i => i.label).join(' | ');
    const p = new THREE.Vector3(); it.mesh.getWorldPosition(p); const P = ENGINE.player.position; P.x = p.x + 1; P.z = p.z + 1; if (typeof onBeforeInteract === 'function') onBeforeInteract(it); it.onInteract(it); return 'ok ' + it.label; }, re);
}
async function drain(T) { for (let k = 0; k < 60; k++) { const open = await T.ev(() => { const o = document.getElementById('screen-dialogue'); if (!o.classList.contains('show')) return false; skipTypewriter(); const ch = document.querySelector('#dlg-choices .dialogue-choice'); if (ch) { ch.click(); if (ch.dataset.armed) ch.click(); } else advanceDialogue(); return true; }); if (!open) return; await T.wait(150); } }
module.exports = async function (T) {
  T.log('A', await T.ev(() => JSON.stringify({ tag: (document.getElementById('v12-build') || {}).textContent, desk: typeof openDesk, court: typeof openCourt, review: typeof openReview, v13: !!window.V13, ver: V12.version })));
  await T.ev(() => { S.game.completedMissions = ['m0', 'm1', 'm2', 'm3', 'm3n', 'm4']; S.game.moralChoices = { market_runner: 'caught', choice: 'flip', arrest: 'professional', checkpoint: 'flip_driver' }; S.game.mem = { hubs: { h2: 1 } }; showOverlay(null); loadMission('m5'); });
  let ok = await T.until(() => S.game.currentMission === 'h4' && ENGINE.movementEnabled && ENGINE.interactables.length > 2, 60000);
  await T.wait(2000);
  T.log('B hub first', ok, await T.ev(() => S.game.currentMission));
  T.log(await interact(T, '^Talk to Uche')); await T.wait(500); await drain(T);
  T.log(await interact(T, '^Talk to Inspector Chidi')); await T.wait(500); await drain(T);
  T.log(await interact(T, '^Check your phone')); await T.wait(900);
  for (let k = 0; k < 12; k++) {
    const left = await T.ev(() => { const row = [...document.querySelectorAll('#screen-phone .ph-row')].find(r => r.querySelector('.ph-dot')); if (row) row.click(); const o = document.querySelector('#screen-phone .ph-opt'); if (o) o.click(); return !!row || !!o; });
    if (!left) break; await T.wait(2600);
  }
  await T.ev(() => { const x = document.querySelector('#screen-phone .ph-x'); if (x) x.click(); }); await T.wait(400);
  T.log(await interact(T, '^Read the news board')); await T.wait(700); await T.ev(() => { const b = document.getElementById('nb-done'); if (b) b.click(); }); await T.wait(400);
  T.log('   hub objs', await T.ev(() => S.game.objectives.map(o => o.id + ':' + !!o.done).join(' ')));
  T.log(await interact(T, '^Call Commander')); await T.wait(700); await drain(T);
  for (let k = 0; k < 2; k++) { T.log('   after call', await T.ev(() => JSON.stringify({ m: S.game.currentMission, ov: [...document.querySelectorAll('.overlay.show')].map(o => o.id), card: !!document.querySelector('#title-card.show'), dlg: document.getElementById('screen-dialogue').classList.contains('show'), objs: S.game.objectives.map(o => o.id + ':' + !!o.done).join(' ') }))); await T.wait(1500); }
  ok = await T.until(() => document.getElementById('screen-briefing') && document.getElementById('screen-briefing').classList.contains('show'), 20000);
  T.log('B briefing after the office', ok);
  ok = await T.until(() => S.game.currentMission === 'm5' && document.getElementById('screen-controls').classList.contains('show'), 20000);
  T.log('B -> m5 start card', ok, await T.ev(() => JSON.stringify({ briefed: I().briefed })));
  await T.ev(() => { document.getElementById('btn-start-mission').click(); });
  await T.until(() => S.game.currentMission === 'm5' && ENGINE.movementEnabled && ENGINE.player, 60000); await T.wait(2500);
  await T.ev(() => { showOverlay(null); openDesk('locker'); }); await T.wait(800);
  T.log('B desk in S1', await T.ev(() => [...document.querySelectorAll('.overlay.show')].map(o => o.id).join(',')));
  await T.ev(() => { if (typeof closeDesk === 'function') closeDesk(); showOverlay(null); });
  await T.ev(() => { S.game.completedMissions = ['m0', 'm1', 'm2', 'm3', 'm3n', 'm4', 'm5', 'm6', 'm7', 't7', 'm8']; S.game.seasonOneComplete = true;
    Object.assign(S.game.moralChoices, { finale: 'contested', asaba: 'rescue' }); I().court = null; I().reviewShown = false; S.game.mem.hubs = { h2: 1, h4: 1, h5: 1, h6: 1, h7: 1 }; showOverlay(null); startEpilogue(); });
  ok = await T.until(() => document.getElementById('screen-court') && document.getElementById('screen-court').classList.contains('show'), 15000);
  T.log('C trial opens before the epilogue', ok);
  await T.ev(() => { I().court = { w: {}, proven: ['c1', 'c2'], admitted: [], struck: [], cred: 60, finale: 'contested' }; const then = COURT.then; showOverlay(null); then(); });
  ok = await T.until(() => typeof EPI !== 'undefined' && EPI.slides && EPI.slides.length > 0 && [...document.querySelectorAll('.overlay.show')].length, 15000);
  T.log('C epilogue', ok, await T.ev(() => (EPI.slides.find(s => s.name === 'COMMANDER ADAEZE') || {}).text));
  for (let k = 0; k < 30; k++) {
    const st = await T.ev(() => document.getElementById('screen-review') && document.getElementById('screen-review').classList.contains('show') ? 'review' : document.querySelector('#title-card.show') ? 'card' : (advanceEpilogue(), 'adv ' + EPI.i));
    if (st === 'review' || st === 'card') { T.log('C reached', st); break; }
    await T.wait(250);
  }
  await T.ev(() => { const b = document.getElementById('btn-review-done'); if (b) b.click(); });
  await T.wait(4000);
  T.log('C after review', await T.ev(() => JSON.stringify({ m: S.game.currentMission, ov: [...document.querySelectorAll('.overlay.show')].map(o => o.id), card: !!document.querySelector('#title-card.show') })));
};
