// BOARD · screenshots of the new board pieces: case slip (stamp, strength, strikes, fieldwork note),
// struck lines, FILE, the ruling, a REFUSED warrant, the Recruit analyst's note.
//   node tools/harness/run.cjs tools/harness/scenarios/board_shots.cjs --html /tmp/naceca-board/naceca.html --w 390 --h 844 --touch 1 --shots /tmp/board-shots/phone
//   node tools/harness/run.cjs tools/harness/scenarios/board_shots.cjs --html /tmp/naceca-board/naceca.html --w 1280 --h 800 --shots /tmp/board-shots/desk
const SET = S => {
  S.game.evidence = [{ id:'co_madam', name:'phone' }, { id:'phishing_template', name:'template' }];
  S.game._marketTunde = true;
};
module.exports = async h => {
  // toasts sit above everything: wait for them to clear before a screenshot
  const calm = async () => { await h.step(3700); for(let i = 0; i < 40; i++){ if(!(await h.ev(() => document.getElementById('toast').classList.contains('show')))) return; await h.step(250); } };
  await h.start('m2', { completed:['m0', 'm1'], state:SET });
  const touch = await h.ev(() => document.body.classList.contains('touch-active'));
  h.log('touch-active:', touch);

  // a worked table: three inks, two strikes, two pencils waiting
  await h.ev(() => {
    [['s_kc','l_market'], ['s_obi','l_lekki'], ['s_obi','l_market'], ['s_tunde','s_kc'], ['s_kc','e_phish']].forEach(([a, b]) => V12.pencil(a, b));
    V12.fileLinks();
    document.getElementById('ops-modal').classList.remove('show');
    V12.pencil('s_mama', 'e_phish'); V12.pencil('e_bvn', 's_mama');
    V12.openOps('lagos');
  });
  await calm(); await h.step(300);
  await h.shot('1-board-strikes');
  const sizes = await h.ev(() => {
    const r = el => { const b = el.getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height)]; };
    return { file:r(document.getElementById('ops-file')), strip:r(document.querySelector('.bd-case')), noHScroll:document.documentElement.scrollWidth <= window.innerWidth };
  });
  h.log('sizes', JSON.stringify(sizes));
  if(touch) h.assert(sizes.file[1] >= 44 && sizes.file[0] >= 44, 'FILE is at least 44×44 on touch');
  h.assert(sizes.noHScroll, 'no horizontal page scroll');

  // a card with a struck link
  await h.ev(() => document.querySelector('.ops-chip[data-id="s_obi"]').click());
  await calm(); await h.step(300);
  await h.shot('2-dossier-struck');
  await h.ev(() => document.querySelector('.ops-chip[data-id="s_obi"]').click());

  // FILE: one holds, one is struck → third strike → refused
  await h.ev(() => document.getElementById('ops-file').click());
  await calm(); await h.step(300);
  const rul = await h.ev(() => { const b = document.getElementById('bd-rul-ok').getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height)]; });
  if(touch) h.assert(rul[1] >= 44, 'the ruling button is at least 44px tall on touch');
  await h.shot('3-ruling-refused');
  await h.ev(() => document.getElementById('bd-rul-ok').click());
  await calm(); await h.step(300);
  await h.shot('4-board-refused');
  h.assert(await h.ev(() => /REFUSED/.test(document.querySelector('.bd-case .bd-stamp').textContent)), 'REFUSED stamp on the slip');

  // a signed warrant and the Recruit note
  await h.start('m2', { completed:['m0', 'm1'], state:S => {
    S.game.evidence = [{ id:'co_madam', name:'phone' }, { id:'phishing_template', name:'template' }, { id:'kc_sims', name:'sims' }];
    S.game.flags.kc_statement = true; S.game.difficulty = 'recruit';
  } });
  await h.ev(() => {
    [['s_obi','e_wallet'], ['e_wallet','m_pos'], ['m_pos','l_market'], ['s_kc','l_market'], ['s_obi','l_lekki']].forEach(([a, b]) => V12.pencil(a, b));
    V12.fileLinks();
    document.getElementById('ops-modal').classList.remove('show');
    V12.openOps('lagos');
    document.querySelector('.ops-chip[data-id="s_mama"]').click();
  });
  await calm(); await h.step(300);
  await h.shot('5-signed-recruit-note');
  h.assert(await h.ev(() => /SIGNED/.test(document.querySelector('.bd-case .bd-stamp').textContent)), 'SIGNED stamp on the slip');

  // the NOTES view draws line icons, not emoji
  const notes = await h.ev(() => {
    document.getElementById('ops-notes').click();
    const rows = [...document.querySelectorAll('.ops-notes .case-row')];
    const r = { rows:rows.length, icons:rows.filter(x => x.querySelector('.ico svg')).length, emoji:/[\u{1F300}-\u{1FAFF}\u2696\u2709]/u.test(document.querySelector('.ops-notes').textContent) };
    document.getElementById('ops-notes').click();
    return r;
  });
  h.assert(notes.rows > 0 && notes.icons === notes.rows && !notes.emoji, 'NOTES rows carry line icons, no emoji');
  h.assert(h.errors.length === 0, 'no page errors');
};
