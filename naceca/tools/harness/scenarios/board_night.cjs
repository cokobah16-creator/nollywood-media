// BOARD · Night Shift: success inks only the proven notebook–message link; failure doesn't unlock Madam;
// the table never opens with a card pre-selected.
//   node tools/harness/run.cjs tools/harness/scenarios/board_night.cjs --html /tmp/naceca-board/naceca.html
const DONE = ['m0', 'm1', 'm2', 'm3'];
const HUB = S => { S.game.mem = { hubs:{ h2:1 } }; };
module.exports = async h => {
  // the title card and the backfill of the notebook and the phone take a few seconds
  const settle = async () => { for(let i = 0; i < 40; i++){ if(await h.ev(() => V12.hasEv('obi_notebook') && V12.hasEv('co_madam') && S.game.currentMission === 'm3n')) return true; await h.step(200); } return false; };
  const answer = (opt, line) => h.ev(([opt, line]) => {
    document.querySelector(`.v12-opt[data-i="${opt}"]`).click();
    const L = [...document.querySelectorAll('.v12-line.live')].find(el => el.textContent.includes(line)); L.click();
    document.getElementById('v12-doc-go').click();
  }, [opt, line]);
  const after = () => h.ev(() => ({
    inked:V12.ops().inked.slice(), madamFlag:!!S.game.flags.v12_madam, madamVis:V12.opsVisible('s_madam'),
    open:document.getElementById('screen-ops').classList.contains('show'), sel:document.querySelectorAll('.ops-chip.sel').length,
    tab:(document.querySelector('.ops-tab.on') || {}).textContent, obj:V12.objDone('n3_table'),
  }));

  // ---- success
  await h.start('m3n', { completed:DONE, state:HUB });
  h.assert(await settle(), 'both halves of the click are on file');
  h.assert(await h.ev(() => !V12.opsVisible('s_madam')), 'Madam is not on the table before the click');
  await h.ev(() => V12.nightClick());
  await h.step(250);
  await answer(0, 'MON 05 OCT');
  await h.step(2600);
  const ok = await after();
  h.log('success', JSON.stringify(ok));
  h.assert(ok.inked.length === 1 && ok.inked[0] === 'e_madam|e_notebook', 'success inks only the notebook–message link');
  h.assert(ok.madamFlag && ok.madamVis, 'success puts Madam on the table');
  h.assert(ok.open && ok.sel === 0 && ok.tab === 'LAGOS', 'the table opens on LAGOS with nothing pre-selected');
  h.assert(ok.obj, 'the table objective is done');
  h.assert(await h.ev(() => !V12.theory('t_madam')), 'the Madam theory still has to be proven at the table');

  // ---- failure
  await h.start('m3n', { completed:DONE, state:HUB });
  await settle();
  await h.ev(() => V12.nightClick());
  await h.step(250);
  await answer(1, 'SAT 03 OCT'); await h.step(200);
  await answer(1, 'SAT 03 OCT'); await h.step(200);
  const note = await h.ev(() => document.getElementById('v12-doc-msg').textContent);
  h.assert(!/goes up on the table anyway/.test(note), 'the failure note no longer promises Madam');
  await h.ev(() => document.getElementById('v12-doc-go').click());           // CONTINUE
  await h.step(1400);
  const bad = await after();
  h.log('failure', JSON.stringify(bad));
  h.assert(!bad.madamFlag && !bad.madamVis, 'failure does not unlock Madam');
  h.assert(bad.inked.length === 0, 'failure inks nothing');
  h.assert(bad.open && bad.sel === 0, 'the table opens with nothing pre-selected');
  h.assert(bad.obj, 'the night still moves on (objective done)');
  // Madam can be re-earned at the table
  await h.ev(() => { V12.pencil('e_notebook', 'e_madam'); V12.fileLinks(); });
  h.assert(await h.ev(() => V12.opsVisible('s_madam')), 'filing the notebook–message link puts Madam on the table');
  h.assert(h.errors.length === 0, 'no page errors');
};
