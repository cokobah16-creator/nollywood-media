// v13 · CASE DESK, Senior Agent vs Recruit (team D; design §4, A8).
//   node tools/harness/run.cjs tools/harness/scenarios/v13_d_senior.cjs --html <build>/naceca.html
// Senior (the default): no badge counts, no relevance markers or 'why' lines on phones, no relevance
// toasts, no key-node highlight / completion meter / DEAD END label on the money trail; statements are
// filed with two taps and lock, with no right/wrong shown; UNVERIFIED stays open for one replacement;
// every filing is +2 intel. Recruit: badges, Uche's notes on flagged clues, the meter, the key node,
// toasts (as a status line on the desk), statement feedback with retries. Filed verdicts survive a
// save/load and a mission replay.
module.exports = async h => {
  const D = require('./v13_d_lib.cjs').lib(h);
  await D.inject();
  await h.start('m2', { completed:['m0', 'm1'] });
  await D.seed({ money:{ open:true, req:5, unlocked:{ n_kc:true, n_odogwu:true, n_sister:true, n_bluewater:true, n_ca:true }, traced:{ n_kc:true, n_odogwu:true, n_sister:true } } });
  await h.ev(() => { S.game.completedMissions = ['m0', 'm1', 'm2', 'm3', 'm3n', 'm4', 'm5', 'm6']; showOverlay(null); showHUD(true); ENGINE.movementEnabled = true; });
  await D.calm();
  const model = await h.ev(() => ({ verdict:typeof intelVerdict === 'function', senior:typeof intelSenior === 'function', money:typeof intelMoneyOpen === 'function', ws:typeof V12.warrantState === 'function' }));
  h.log('v13 model contract present:', JSON.stringify(model));
  const body = () => h.ev(() => document.getElementById('desk-body').textContent);
  const whys = await h.ev(() => [].concat(...PHONES.map(p => p.items.filter(c => c.why).map(c => c.why)), ...STATEMENTS.map(s => s.claims.map(c => c.why).filter(Boolean))));
  const noWhy = async label => { const t = await body(); const hit = whys.find(w => t.includes(w)); h.assert(!hit, label + ': no "why" line shown (' + hit + ')'); };
  const note = () => h.ev(() => ({ toast:document.getElementById('toast').classList.contains('show') ? document.getElementById('toast').textContent : '', note:document.getElementById('desk-note').classList.contains('on') ? document.getElementById('desk-note').textContent : '' }));
  const RELEVANCE = /MONEY TRAIL|C\.A\. CONSULTING|ENTITIES|ONE OFFICE|PLATE MATCH/;
  const badges = () => h.ev(() => [...document.querySelectorAll('#desk-tabs .dk-badge')].map(b => b.parentElement.dataset.tab + ':' + b.textContent));

  // ================= SENIOR =================
  h.assert(await h.ev(() => !isRecruit()), 'Senior Agent is the default');
  await h.ev(() => openDesk('locker'));
  h.assert((await badges()).length === 0, 'Senior: no badge counts on any tab (' + (await badges()).join(',') + ')');

  // phones: flag a real lead, a bit of someone's life and the money alert — no marker, no why, no toast
  await h.ev(() => { deskDo('goto', { tab:'phones' }); deskDo('phone', { id:'kc' }); deskDo('flag', { id:'kc_msg_engineer' }); deskDo('flag', { id:'kc_msg_mama' }); });
  h.assert(await h.ev(() => document.querySelectorAll('#desk-body .dk-coach').length) === 0, 'Senior: no relevance marker on flagged clues');
  await noWhy('Senior phones');
  await h.ev(() => { deskDo('sec', { sec:'BANK ALERTS' }); deskDo('flag', { id:'kc_bank_150k' }); });
  await h.step(60);
  let n = await note();
  h.assert(!RELEVANCE.test(n.toast + n.note), 'Senior: flagging the money alert gives no relevance toast: ' + JSON.stringify(n));
  h.assert(await h.ev(() => I().flagged.kc_bank_150k === true && I().flagged.kc_msg_mama === true), 'flags are still recorded (the player\'s judgement)');
  h.assert(await h.ev(() => document.querySelector('#desk-body .dk-flag.on') && document.querySelector('#desk-body .dk-flag.on').getAttribute('aria-pressed') === 'true'), 'a flag shows as FLAGGED (pressed), not by colour alone');

  // money: no completion meter, no key node, no DEAD END
  await h.ev(() => deskDo('goto', { tab:'money' }));
  const mSen = await h.ev(() => ({ meter:!!document.querySelector('#desk-body .dk-money-meter, #desk-body .eb-meter'), key:document.querySelectorAll('#desk-body .dk-mn.key, #desk-body .dk-keytag').length,
    dead:/DEAD END/.test(document.getElementById('desk-body').textContent.replace(/Dead end\./g, '')), rows:document.querySelectorAll('#desk-body .dk-mn').length }));
  h.log('senior money', JSON.stringify(mSen));
  h.assert(mSen.rows >= 4 && !mSen.meter && mSen.key === 0 && !mSen.dead, 'Senior: no completion meter, key-node highlight or DEAD END label');
  await h.ev(() => deskDo('trace', { id:'n_ca' })); await h.step(60);
  n = await note();
  if(model.senior) h.assert(!RELEVANCE.test(n.toast + n.note), 'Senior: tracing C.A. gives no relevance toast (model): ' + JSON.stringify(n));
  else h.log('(trace toast belongs to the v13 model; its Senior rule is checked once intelSenior exists) note:', JSON.stringify(n));
  h.assert(await h.ev(() => !document.querySelector('#desk-body .dk-mn.key')), 'Senior: the traced key node looks like every other row');

  // statements: two taps, locked, nothing right or wrong on screen
  const intel0 = await h.ev(() => S.game.intelScore || 0);
  await h.ev(() => { deskDo('goto', { tab:'statements' }); deskDo('st', { id:'st_musa' }); deskDo('verdict', { st:'st_musa', c:'u1', v:'contradicted' }); });
  let c1 = await h.ev(() => ({ rec:(typeof intelVerdictOf === 'function' ? intelVerdictOf('st_musa', 'u1') : null) || ((I().st.st_musa || {}).u1 || null),
    armed:(document.querySelector('#desk-body .dk-claim[data-c="u1"] button.armed') || {}).textContent || '' }));
  h.assert(!c1.rec && /TAP AGAIN/.test(c1.armed), 'Senior: the first tap only pencils the verdict in ' + JSON.stringify(c1));
  await h.ev(() => deskDo('verdict', { st:'st_musa', c:'u1', v:'contradicted' }));
  c1 = await h.ev(() => {
    const rec = typeof intelVerdictOf === 'function' ? intelVerdictOf('st_musa', 'u1') : I().st.st_musa.u1;
    const el = document.querySelector('#desk-body .dk-claim[data-c="u1"]');
    return { rec, stamp:(el.querySelector('.v13-stamp') || {}).textContent || '', btns:el.querySelectorAll('button').length, marks:document.querySelectorAll('#desk-body .v13-mark-ok, #desk-body .v13-mark-bad, #desk-body .dk-fb').length };
  });
  h.log('senior filed', JSON.stringify(c1));
  h.assert(c1.rec && c1.rec.verdict === 'contradicted' && c1.rec.locked === true, 'Senior: the second tap files and locks it');
  h.assert(/FILED/.test(c1.stamp) && c1.btns === 0 && c1.marks === 0, 'Senior: a filed claim shows a FILED stamp, no buttons and no right/wrong');
  h.assert(await h.ev(() => S.game.intelScore || 0) - intel0 === 2, 'Senior: +2 intel for a filed verdict');
  await noWhy('Senior statements');
  await h.ev(() => { deskDo('verdict', { st:'st_musa', c:'u1', v:'corroborated' }); deskDo('verdict', { st:'st_musa', c:'u1', v:'corroborated' }); });
  h.assert(await h.ev(() => (typeof intelVerdictOf === 'function' ? intelVerdictOf('st_musa', 'u1') : I().st.st_musa.u1).verdict) === 'contradicted', 'Senior: a locked verdict cannot be changed (no retries)');
  // a wrong verdict shows nothing either
  await h.ev(() => { deskDo('verdict', { st:'st_musa', c:'u2', v:'mistaken' }); deskDo('verdict', { st:'st_musa', c:'u2', v:'mistaken' }); });
  h.assert(await h.ev(() => document.querySelectorAll('#desk-body .v13-mark-ok, #desk-body .v13-mark-bad, #desk-body .dk-fb').length) === 0, 'Senior: a wrong verdict gets no feedback');
  // UNVERIFIED stays open for one replacement
  await h.ev(() => { deskDo('verdict', { st:'st_musa', c:'u3', v:'unverified' }); deskDo('verdict', { st:'st_musa', c:'u3', v:'unverified' }); });
  let u3 = await h.ev(() => ({ rec:typeof intelVerdictOf === 'function' ? intelVerdictOf('st_musa', 'u3') : I().st.st_musa.u3, btns:document.querySelectorAll('#desk-body .dk-claim[data-c="u3"] button').length }));
  h.assert(u3.rec && u3.rec.verdict === 'unverified' && !u3.rec.locked && u3.btns === 4, 'Senior: UNVERIFIED is filed but stays open ' + JSON.stringify(u3));
  await h.ev(() => { deskDo('verdict', { st:'st_musa', c:'u3', v:'contradicted' }); deskDo('verdict', { st:'st_musa', c:'u3', v:'contradicted' }); });
  u3 = await h.ev(() => ({ rec:typeof intelVerdictOf === 'function' ? intelVerdictOf('st_musa', 'u3') : I().st.st_musa.u3, btns:document.querySelectorAll('#desk-body .dk-claim[data-c="u3"] button').length }));
  h.assert(u3.rec.verdict === 'contradicted' && u3.rec.locked && u3.btns === 0, 'Senior: … replaced once, then locked ' + JSON.stringify(u3));
  await h.shot('senior_statement');

  // save → load → the desk shows the filed verdicts; a replay keeps them
  await h.ev(() => { closeDesk(); saveGame(true); S = defaultState(); loadGame(); if(typeof syncDifficultyClass === 'function') syncDifficultyClass(); });
  const afterLoad = async label => {
    await h.ev(() => { openDesk('statements'); deskDo('st', { id:'st_musa' }); });
    const r = await h.ev(() => { const el = document.querySelector('#desk-body .dk-claim[data-c="u1"]'); return { stamp:(el && el.querySelector('.v13-stamp') || {}).textContent || '', btns:el ? el.querySelectorAll('button').length : -1 }; });
    h.assert(/FILED/.test(r.stamp) && r.btns === 0, label + ': the filed verdict is still locked ' + JSON.stringify(r));
    await h.ev(() => deskDo('goto', { tab:'warrants' }));
    h.assert(await h.ev(() => document.querySelectorAll('#desk-body .dk-warrant').length) >= 1, label + ': decided warrants are still on file');
    await h.ev(() => closeDesk());
  };
  await afterLoad('after load');
  await h.ev(() => { showOverlay(null); loadMission('m2'); });
  await h.step(900);
  await h.ev(() => { if(document.querySelector('#screen-controls.show')) beginMission('m2'); });
  await h.step(1200);
  await afterLoad('after a replay of Case 02');
  await h.ev(() => { showOverlay(null); showHUD(true); ENGINE.movementEnabled = true; });

  // ================= RECRUIT =================
  await D.recruit(true);
  await h.ev(() => openDesk('locker'));
  const bR = await badges();
  h.log('recruit badges', bR.join(' '));
  h.assert(bR.length > 0, 'Recruit: tabs carry counts of what is still to do');
  await h.ev(() => { deskDo('goto', { tab:'phones' }); deskDo('phone', { id:'kc' }); deskDo('sec', { sec:'MESSAGES' }); });
  const coach = await h.ev(() => ({ rel:document.querySelectorAll('#desk-body .dk-coach.rel').length, norel:document.querySelectorAll('#desk-body .dk-coach.norel').length, t:document.getElementById('desk-body').textContent }));
  h.assert(coach.rel >= 1 && coach.norel >= 1, 'Recruit: Uche marks flagged clues as worth following or not ' + JSON.stringify({ rel:coach.rel, norel:coach.norel }));
  h.assert(coach.t.includes(await h.ev(() => PHONES[0].items.find(c => c.id === 'kc_msg_engineer').why)), 'Recruit: the why line shows on a flagged lead');
  await h.ev(() => { deskDo('phone-back'); deskDo('phone', { id:'burner' }); deskDo('sec', { sec:'DELETED' }); deskDo('flag', { id:'bu_del_foundation' }); });
  await h.step(60);
  n = await note();
  h.log('recruit flag note', JSON.stringify(n));
  h.assert(/MONEY TRAIL/.test(n.note), 'Recruit: the money-trail toast shows, as a status line on the desk (not over the tabs)');
  h.assert(!n.toast, 'no floating toast covers the desk');
  await h.ev(() => deskDo('goto', { tab:'money' }));
  const mRec = await h.ev(() => ({ meter:!!document.querySelector('#desk-body .dk-money-meter'), key:document.querySelectorAll('#desk-body .dk-mn.key').length, dead:/DEAD END/.test(document.getElementById('desk-body').textContent) }));
  h.log('recruit money', JSON.stringify(mRec));
  h.assert(mRec.meter && mRec.key >= 1 && mRec.dead, 'Recruit: completion meter, key node and DEAD END are shown');
  await h.ev(() => { deskDo('goto', { tab:'statements' }); deskDo('st', { id:'st_tunde' }); deskDo('verdict', { st:'st_tunde', c:'t1', v:'corroborated' }); });
  let fb = await h.ev(() => ({ fb:document.querySelectorAll('#desk-body .dk-fb').length, rec:typeof intelVerdictOf === 'function' ? intelVerdictOf('st_tunde', 't1') : (I().st.st_tunde || {}).t1 }));
  h.assert(fb.fb === 1, 'Recruit: one tap gives feedback straight away');
  await h.ev(() => deskDo('verdict', { st:'st_tunde', c:'t1', v:'unverified' }));
  fb = await h.ev(() => ({ fb:document.querySelectorAll('#desk-body .dk-fb').length, btns:document.querySelectorAll('#desk-body .dk-claim[data-c="t1"] button').length,
    rec:typeof intelVerdictOf === 'function' ? intelVerdictOf('st_tunde', 't1') : (I().st.st_tunde || {}).t1 }));
  h.assert(fb.fb === 1 && fb.btns === 4, 'Recruit: retries allowed ' + JSON.stringify(fb));
  await h.shot('recruit_statement');
  await D.recruit(false);
  await h.ev(() => closeDesk());
  h.assert(h.errors.length === 0, 'no page errors: ' + h.errors.join(' | '));
};
