// BOARD · the M2 van gate: three inked links or three strikes; no free pass after many tries.
//   node tools/harness/run.cjs tools/harness/scenarios/board_van.cjs --html /tmp/naceca-board/naceca.html
const READY = S => {
  S.game.evidence = [{ id:'co_madam', name:'phone' }, { id:'phishing_template', name:'template' }, { id:'kc_sims', name:'sims' }];
  S.game.flags.kc_statement = true;
};
module.exports = async h => {
  const board = () => h.ev(() => {
    S.game._marketScanned = true; S.game.moralChoices.market_runner = 'caught';
    const van = ENGINE.interactables.find(i => /^Board NACECA van/.test(i.label || ''));
    van.onInteract();
    return { toast:document.getElementById('toast').textContent, cur:S.game.currentMission, done:S.game.completedMissions.includes('m2') };
  });

  // nothing on the table, and a pile of free tries: still blocked
  await h.start('m2', { completed:['m0', 'm1'], state:READY });
  await h.ev(() => { const o = V12.ops(); o.tries = 40; });
  const b0 = await board();
  h.assert(/THE TABLE FIRST/.test(b0.toast) && b0.cur === 'm2' && !b0.done, 'no ink, many tries: the van waits');

  // two inks and two strikes: still blocked
  await h.ev(() => {
    V12.pencil('s_kc', 'l_market'); V12.pencil('s_obi', 'l_lekki'); V12.pencil('s_obi', 'l_market'); V12.pencil('s_kc', 'l_lekki');
    V12.fileLinks(); V12.closeOps();
  });
  const b1 = await board();
  h.assert(await h.ev(() => V12.ops().inked.length === 2 && V12.caseStrikes('lagos') === 2), 'set-up: 2 inked, 2 strikes');
  h.assert(/THE TABLE FIRST/.test(b1.toast) && !b1.done, '2 inked + 2 strikes: the van waits');

  // a third link that holds: go
  await h.ev(() => { V12.pencil('e_kcsims', 's_mama'); V12.fileLinks(); V12.closeOps(); });
  const b2 = await board();
  h.assert(b2.done, 'three inked links: the van leaves for Lekki');
  h.assert(await h.ev(() => V12.objDone('o4_table') || S.game.completedMissions.includes('m2')), 'the table objective was met');

  // three strikes: fail forward, at a cost
  await h.start('m2', { completed:['m0', 'm1'], state:READY });
  const i0 = await h.ev(() => S.player.reputation.integrity);
  await h.ev(() => {
    V12.pencil('s_obi', 'l_market'); V12.pencil('s_kc', 'l_lekki'); V12.pencil('s_mama', 'l_mushin');
    V12.fileLinks(); V12.closeOps();
  });
  const b3 = await board();
  h.assert(await h.ev(() => V12.caseStrikes('lagos') === 3 && V12.ops().inked.length === 0), 'set-up: 3 strikes, no ink');
  h.assert(b3.done, 'three strikes: the van leaves anyway');
  const i1 = await h.ev(() => S.player.reputation.integrity);
  h.assert(i0 - i1 === 6, 'the strikes cost Integrity −6');
  h.assert(await h.ev(() => V12.warrantFor('lagos').refused), 'and the Lagos warrant goes in refused');
  h.assert(h.errors.length === 0, 'no page errors');
};
