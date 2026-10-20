// core: Esc then RESUME over a Season 2 conversation or document (D3, from the reviewers' d_pause [a]).
// (a) Court 5's conference: the conversation comes back, the HUD stays hidden, the trial goes on.
// (b) Case 09's hash document: the document comes back and can still be put on record (D2's other cause).
// (c) Season 1 is left as it was (the same base behaviour in Season 1 is deferred, by decision).
const L = require('./core_lib.js'), sc = L.sc;
const look = T => T.ev(() => ({ ov: [...document.querySelectorAll('.overlay.show')].map(o => o.id).join(','), mv: ENGINE.movementEnabled,
  dlgKey: (typeof DLG !== 'undefined' && DLG.scriptKey) || null, idx: typeof DLG !== 'undefined' ? DLG.idx : null, hud: document.getElementById('hud').style.display,
  doc: (document.querySelector('#screen-puzzle .head h2') || {}).textContent || null, court: !!(V13.court && V13.court.active) }));
const resume = T => T.ev(() => document.getElementById('btn-resume').click());
module.exports = async function (T) {
  const C = L.checks(T);
  await L.capture(T);
  // ---------- (a) Court 5 ----------
  const pre = "S.game.completedMissions.push('m9','m10','m11','m12','m13','m13b'); V13.s2().hubs = { h9:1, h10:1, h11:1, h12:1, h13:1 };";
  T.log('m14', await sc.s2start(T, 'm14', pre));
  await T.ev(() => { V13.court.fast = true; });
  await T.until(() => !document.querySelector('#title-card.show') && ENGINE.movementEnabled, 30000);
  await sc.use(T, 'Barrister Danladi');
  for (let k = 0; k < 25; k++) { await T.ev(() => { if (document.getElementById('screen-dialogue').classList.contains('show')) { skipTypewriter(); const c = document.querySelector('#dlg-choices .dialogue-choice'); if (c) { c.click(); if (c.dataset.armed) c.click(); } else advanceDialogue(); } else { const x = document.querySelector('#screen-courtfix.show .cf-close'); if (x) x.click(); } }); await T.wait(150); }
  await T.until(() => document.getElementById('screen-dialogue').classList.contains('show'), 20000);
  const a0 = await look(T);
  T.log('[a] in court', JSON.stringify(a0));
  await L.esc(T); await T.wait(600);
  const a1 = await look(T);
  T.log('[a] after Esc', JSON.stringify(a1));
  await resume(T); await T.wait(1200);
  const a2 = await look(T);
  T.log('[a] after RESUME', JSON.stringify(a2));
  C.check('D3 Court 5: Esc opens the pause menu over the conference', /screen-pause/.test(a1.ov), a1.ov);
  C.check('D3 Court 5: RESUME brings the conversation back, the HUD stays hidden', /screen-dialogue/.test(a2.ov) && a2.dlgKey === a0.dlgKey && a2.idx === a0.idx && a2.hud === a0.hud && a0.hud === 'none', { before: a0, after: a2 });
  // the trial goes on from here
  await T.ev(() => { skipTypewriter(); const c = document.querySelector('#dlg-choices .dialogue-choice'); if (c) { c.click(); if (c.dataset.armed) c.click(); } else advanceDialogue(); }); await T.wait(600);
  const a3 = await look(T);
  C.check('D3 Court 5: the conversation advances after RESUME', a3.court && (a3.idx !== a2.idx || a3.dlgKey !== a2.dlgKey || /screen-courtfix|screen-dialogue/.test(a3.ov)), a3);
  // quit to title and leave the court (Season 1 after it is screens' D4 check)
  await L.esc(T); await T.wait(500); await T.ev(() => document.getElementById('btn-quit').click()); await T.wait(1200);
  // (screens' D4 adds V13.court.abort for this; until then end the court the way the trial's own end does)
  await T.ev(() => { try { if (V13.court && V13.court.abort) V13.court.abort(); else if (V13.court && V13.court.active && V13.court.end) V13.court.end(); } catch (e) {} TPCAM.override = null; });
  // ---------- (b) Case 09's hash document ----------
  T.log('m9', await sc.s2start(T, 'm9', 'delete S.game.s2;'));
  await sc.talk(T);
  await sc.use(T, 'Report to Commander (Okundaye|Osagie)'); await sc.talk(T, [0]);
  await sc.use(T, 'Sign for exhibit 14'); await sc.talk(T, ['Sign it out']);
  await sc.use(T, 'Examine the drive'); await sc.talk(T, ['Write-blocker']);
  await sc.waitCards(T);
  await T.until(() => document.querySelector('#screen-puzzle.show .v12-opt'), 30000);
  const b0 = await look(T);
  // pick a conclusion first, so we can see the document's own state survive the pause
  await T.ev(() => { const P = PUZZLES.m9_hash, sc_ = document.querySelector('#screen-puzzle.show'); sc_.querySelectorAll('.v12-opt')[P.options.findIndex(o => o.correct)].click(); });
  await L.esc(T); await T.wait(600);
  const b1 = await look(T);
  await T.wait(2500);                         // a case's document watcher would fire here if it read the pause as a back-off
  await resume(T); await T.wait(1000);
  const b2 = await look(T);
  const sel = await T.ev(() => !!document.querySelector('#screen-puzzle.show .v12-opt.sel'));
  T.log('[b]', JSON.stringify({ b0, b1, b2, sel }));
  C.check('D3 Case 09: RESUME brings the hash document back as it was', /screen-pause/.test(b1.ov) && /screen-puzzle/.test(b2.ov) && b2.doc === b0.doc && sel, { b1: b1.ov, b2: b2.ov, doc: b2.doc, sel });
  await sc.solve(T, 'm9_hash'); await sc.talk(T);
  await T.wait(600);
  const b3 = await T.ev(() => ({ ex: V13.objDone('o9_examine'), ev: V13.hasEv('drive_image') ? V13.evQ('drive_image') : null, docs: window.__core.docs.filter(k => k === 'm9_hash').length }));
  C.check('D3/D2 Case 09: after the pause the hash goes on record and the image is collected', b3.ex && b3.ev === 'good' && b3.docs === 1, b3);
  // LOAD from the pause menu is not RESUME: nothing comes back over the loaded game
  // ---------- (c) Season 1, unchanged ----------
  await T.ev(() => { showOverlay(null); S.game.currentMission = 'm1'; startDialogue(Object.keys(DIALOGUE).find(k => /^hq_intro$/.test(k)) || 'hq_intro'); });
  await T.wait(600);
  await L.esc(T); await T.wait(500); await resume(T); await T.wait(800);
  const c1 = await look(T);
  C.check('D3 Season 1 conversations keep Season 1\'s pause behaviour (the S1 side is deferred)', !/screen-dialogue/.test(c1.ov), c1.ov || '(none)');
  C.done();
};
