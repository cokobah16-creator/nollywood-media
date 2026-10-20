// v14 merge checks: The Case File + Phase 2 + Season 2 in one build
const sc = require('../scen13.js');
async function interact(T, re) {
  return T.ev(src => { const r = new RegExp(src, 'i'); const it = ENGINE.interactables.find(i => r.test(i.label || '')); if (!it) return 'none: ' + ENGINE.interactables.map(i => i.label).join(' | ');
    const p = new THREE.Vector3(); it.mesh.getWorldPosition(p); const P = ENGINE.player.position; P.x = p.x + 1; P.z = p.z + 1; if (typeof onBeforeInteract === 'function') onBeforeInteract(it); it.onInteract(it); return 'ok ' + it.label; }, re);
}
async function drain(T) { for (let k = 0; k < 60; k++) { const open = await T.ev(() => { const o = document.getElementById('screen-dialogue'); if (!o.classList.contains('show')) return false; skipTypewriter(); const ch = document.querySelector('#dlg-choices .dialogue-choice'); if (ch) { ch.click(); if (ch.dataset.armed) ch.click(); } else advanceDialogue(); return true; }); if (!open) return; await T.wait(150); } }
/* play a weekly briefing through its own buttons: pick leads, answer decisions, commit, run, done */
async function brief(T) {
  for (let k = 0; k < 60; k++) {
    const st = await T.ev(() => {
      const ov = document.getElementById('screen-briefing'); if (!ov || !ov.classList.contains('show')) return 'closed';
      const q = s => [...ov.querySelectorAll(s)].filter(b => !b.disabled);
      const done = q('[data-b="done"]')[0]; if (done) { done.click(); return 'done'; }
      const next = q('[data-b="next"]')[0]; if (next) { next.click(); return 'next'; }
      const w = q('[data-b="warrant"]')[0]; if (w) { w.click(); return 'warrant'; }
      const decKs = [...new Set(q('[data-b="dec"]').map(b => b.dataset.k))].filter(k => !(BRF.dec || {})[k]);
      if (decKs.length) { q(`[data-b="dec"][data-k="${decKs[0]}"]`)[0].click(); return 'dec ' + decKs[0]; }
      if ((BRF.sel || []).length < 2) { const l = q('[data-b="lead"]').find(b => !(BRF.sel || []).includes(b.dataset.id)); if (l) { l.click(); return 'lead ' + l.dataset.id; } }
      const c = q('[data-b="commit"]')[0]; if (c) { c.click(); return 'commit'; }
      return 'stuck ' + BRF.phase + ' ' + q('[data-b]').map(b => b.dataset.b).join(',');
    });
    if (st === 'closed') return true;
    if (/^stuck/.test(st)) { T.log('   briefing', st); return false; }
    await T.wait(250); await drain(T);
  }
  return false;
}
module.exports = async function (T) {
  // A. the page: tag, both layers present
  T.log('A', await T.ev(() => JSON.stringify({ tag: (document.getElementById('v12-build') || {}).textContent, desk: typeof openDesk, court: typeof openCourt, review: typeof openReview, v13: !!window.V13, ver: V12.version + '/' + V13.version })));
  await T.shot('title');
  // B. Season 1: the office (h4) first, then the weekly briefing, then Case 05
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
  for (let k = 0; k < 2; k++) { T.log('   after call', await T.ev(() => JSON.stringify({ m: S.game.currentMission, ov: [...document.querySelectorAll('.overlay.show')].map(o => o.id), card: !!document.querySelector('#title-card.show'), dlg: document.getElementById('screen-dialogue').classList.contains('show'), hubs: V12.mem().hubs, objs: S.game.objectives.map(o => o.id + ':' + !!o.done).join(' ') }))); await T.wait(1500); }
  ok = await T.until(() => document.getElementById('screen-briefing') && document.getElementById('screen-briefing').classList.contains('show'), 20000);
  T.log('B briefing after the office', ok); await T.shot('briefing');
  T.log('B briefing played', await brief(T));
  ok = await T.until(() => S.game.currentMission === 'm5' && document.getElementById('screen-controls').classList.contains('show'), 20000);
  T.log('B -> m5 start card', ok, await T.ev(() => JSON.stringify({ briefed: I().briefed, hub: V12.mem().hubs })));
  // the Case Desk in Season 1 (J)
  await T.ev(() => { document.getElementById('btn-start-mission').click(); });
  await T.until(() => S.game.currentMission === 'm5' && ENGINE.movementEnabled && ENGINE.player, 60000); await T.wait(2500);
  await T.ev(() => { showOverlay(null); openDesk('locker'); }); await T.wait(800); await T.shot('desk_s1');
  T.log('B desk in S1', await T.ev(() => [...document.querySelectorAll('.overlay.show')].map(o => o.id).join(',')));
  await T.ev(() => { if (typeof closeDesk === 'function') closeDesk(); showOverlay(null); });
  // C. the end of Season 1: the trial, the epilogue, the case review, then Season 2
  await T.ev(() => { S.game.completedMissions = ['m0', 'm1', 'm2', 'm3', 'm3n', 'm4', 'm5', 'm6', 'm7', 't7', 'm8']; S.game.seasonOneComplete = true;
    Object.assign(S.game.moralChoices, { finale: 'contested', asaba: 'rescue' }); I().court = null; I().reviewShown = false; S.game.mem.hubs = { h2: 1, h4: 1, h5: 1, h6: 1, h7: 1 }; showOverlay(null); startEpilogue(); });
  ok = await T.until(() => document.getElementById('screen-court') && document.getElementById('screen-court').classList.contains('show'), 15000);
  T.log('C trial opens before the epilogue', ok); await T.shot('s1_trial');
  // finish the trial as if two counts were proven
  await T.ev(() => { I().court = { w: {}, proven: ['c1', 'c2'], admitted: [], struck: [], cred: 60, finale: 'contested' }; const then = COURT.then; showOverlay(null); then(); });
  ok = await T.until(() => typeof EPI !== 'undefined' && EPI.slides && EPI.slides.length > 0 && [...document.querySelectorAll('.overlay.show')].length, 15000);
  T.log('C epilogue', ok, await T.ev(() => (EPI.slides.find(s => s.name === 'COMMANDER ADAEZE') || {}).text));
  for (let k = 0; k < 30; k++) {
    const st = await T.ev(() => document.getElementById('screen-review') && document.getElementById('screen-review').classList.contains('show') ? 'review' : document.querySelector('#title-card.show') ? 'card' : (advanceEpilogue(), 'adv ' + EPI.i));
    if (st === 'review' || st === 'card') { T.log('C reached', st); break; }
    await T.wait(250);
  }
  await T.shot('review');
  await T.ev(() => { const b = document.getElementById('btn-review-done'); if (b) b.click(); });
  ok = await T.until(() => S.game.currentMission === 'm9', 30000);
  T.log('C -> Season 2', ok, await T.ev(() => JSON.stringify({ fin: S.game.moralChoices.finale, s2: { s1finale: V13.s2().s1finale, counts: V13.s2().adaezeCounts }, dg: DIALOGUE.m13_dg_adaeze_proven[0].text.slice(0, 60) })));
  // D. Season 2: J opens the case file, not the Season 1 desk
  await T.until(() => { const b = document.getElementById('btn-start-mission'); if (b && b.offsetParent) b.click(); return S.game.currentMission === 'm9' && ENGINE.movementEnabled && V13.rt && V13.rt.id === 'm9'; }, 90000);
  await T.wait(3000);
  await T.ev(() => { showOverlay(null); try { endDialogue(); } catch (e) {} });
  await T.wait(500);
  await T.ev(() => openDesk()); await T.wait(700);
  T.log('D J in S2 opens', await T.ev(() => [...document.querySelectorAll('.overlay.show')].map(o => o.id).join(',')));
  await T.ev(() => { showOverlay(null); S.game.evidence.push({ id:'drive_image', name:'Forensic image of exhibit 14' }, { id:'upstream_ledger', name:'The UPSTREAM ledger' }, { id:'pos_t4_log', name:'Terminal T4 transaction log' }); S.game.evQ = S.game.evQ || {}; Object.assign(S.game.evQ, { drive_image:'good', upstream_ledger:'contested', pos_t4_log:'weak' }); openCaseFile(); });
  await T.wait(600); await T.shot('s2_casefile_full');
  await T.shot('s2_casefile');
  // E. a discharged Adaeze reads as discharged in Season 2
  await T.ev(() => { V13.s2().fateDone = 0; S.game.moralChoices.finale = 'contested'; I().court = { w: {}, proven: [], admitted: [], struck: [], cred: 20 }; V13.adaptS1Fate(); });
  T.log('E discharged', await T.ev(() => JSON.stringify({ fin: S.game.moralChoices.finale, dis: V13.s2().adaezeDischarged, osagie: (DIALOGUE.m9_osagie_unproven.find(l => /no-case/.test(l.text)) || {}).text, dg: DIALOGUE.m13_dg_adaeze_unproven[0].text.slice(0, 50), san: V13.COURT_DATA.cross.find(a => a.id === 'adaeze_unproven').q[0].text.slice(0, 70) })));
};
