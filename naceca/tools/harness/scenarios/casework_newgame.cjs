// Casework 1: the new-game sheet sets S.game.difficulty and the body class; old saves load as Senior.
//   node tools/harness/run.cjs tools/harness/scenarios/casework_newgame.cjs --html <build> [--w 390 --h 844 --touch 1] [--shots dir]
module.exports = async h => {
  const tag = await h.ev(() => innerWidth < 600 ? 'phone' : 'desk');
  // a save already on the device → the sheet warns about it
  await h.ev(() => { const s = defaultState(); s.game.completedMissions = ['m0', 'm1']; localStorage.setItem(SAVE_KEY, JSON.stringify(s)); showOverlay('screen-title'); });
  await h.step(200);
  await h.ev(() => document.getElementById('btn-newgame').click());
  await h.step(300);
  const sheet = await h.ev(() => {
    const ov = document.querySelector('#screen-newgame.show');
    if(!ov) return null;
    const btn = v => ov.querySelector(`.cw-mode[data-v="${v}"]`);
    const sizes = [...ov.querySelectorAll('button')].map(b => { const r = b.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; });
    return { senior:btn('senior').getAttribute('aria-pressed'), recruit:btn('recruit').getAttribute('aria-pressed'),
      text:ov.textContent, alert:!!ov.querySelector('.cw-alert'), sizes, emoji:/[☀-➿\u{1F300}-\u{1FAFF}]/u.test(ov.textContent) };
  });
  h.assert(sheet, 'NEW INVESTIGATION opens the new-game sheet');
  h.assert(sheet.senior === 'true' && sheet.recruit === 'false', 'Senior Agent is preselected');
  h.assert(/RECRUIT/.test(sheet.text) && /SENIOR AGENT/.test(sheet.text) && /hints on/i.test(sheet.text) && /No deduction hints/.test(sheet.text), 'both modes with one-line explanations');
  h.assert(sheet.alert && /saved investigation/.test(sheet.text), 'a note when a save exists');
  h.assert(/NATIONAL ANTI-CORRUPTION & ECONOMIC CRIMES AGENCY/.test(sheet.text), 'full agency name on the sheet');
  h.assert(!sheet.emoji, 'no emoji glyphs on the sheet');
  h.assert(sheet.sizes.every(([w, hh]) => w >= 44 && hh >= 44), 'every button is at least 44×44: ' + JSON.stringify(sheet.sizes));
  await h.shot('casework_newgame_' + tag);

  // pick RECRUIT and begin
  await h.ev(() => document.querySelector('#screen-newgame .cw-mode[data-v="recruit"]').click());
  await h.step(80);
  await h.ev(() => document.querySelector('#screen-newgame [data-act="go"]').click());
  await h.step(900);
  let st = await h.ev(() => ({ d:S.game.difficulty, rec:isRecruit(), g:gameDifficulty(), cls:[...document.body.classList].filter(c => /^cw-/.test(c)), m:S.game.currentMission, acc:JSON.stringify(S.game.accusations) }));
  h.log('recruit start', st);
  h.assert(st.d === 'recruit' && st.rec === true && st.g === 'recruit', 'Recruit sets S.game.difficulty');
  h.assert(st.cls.includes('cw-recruit') && !st.cls.includes('cw-senior'), 'body has cw-recruit');
  h.assert(st.m === 'm0', 'the cold open starts as before');
  h.assert(st.acc === '{}', 'a new game starts with no accusations');

  // again, keeping the default
  await h.ev(() => { showHUD(false); ENGINE.movementEnabled = false; showOverlay('screen-title'); document.getElementById('btn-newgame').click(); });
  await h.step(200);
  await h.ev(() => document.querySelector('#screen-newgame [data-act="go"]').click());
  await h.step(900);
  st = await h.ev(() => ({ d:S.game.difficulty, cls:[...document.body.classList].filter(c => /^cw-/.test(c)) }));
  h.assert(st.d === 'senior' && st.cls.includes('cw-senior') && !st.cls.includes('cw-recruit'), 'default BEGIN is Senior Agent, body cw-senior');

  // BACK returns to the title without starting anything
  await h.ev(() => { showOverlay('screen-title'); document.getElementById('btn-newgame').click(); });
  await h.step(150);
  await h.ev(() => document.querySelector('#screen-newgame [data-act="back"]').click());
  await h.step(150);
  h.assert(await h.ev(() => !!document.querySelector('#screen-title.show')), 'BACK returns to the title');

  // an old save (no difficulty, no accusations) loads as Senior
  st = await h.ev(() => {
    const s = defaultState(); delete s.game.difficulty; delete s.game.accusations; s.game.completedMissions = ['m0', 'm1', 'm2'];
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
    S.game.difficulty = 'recruit'; syncDifficultyClass();
    loadGame();
    return { d:S.game.difficulty, acc:typeof S.game.accusations, cls:document.body.classList.contains('cw-senior') };
  });
  h.assert(st.d === 'senior' && st.acc === 'object' && st.cls, 'an old save loads as Senior Agent with an accusations object');

  // CONTINUE keeps a Recruit save's mode and class
  st = await h.ev(() => {
    const s = defaultState(); s.game.difficulty = 'recruit'; s.game.completedMissions = ['m0', 'm1'];
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
    S = defaultState(); syncDifficultyClass();
    showOverlay('screen-title'); document.getElementById('btn-continue').disabled = false; document.getElementById('btn-continue').click();
    return { d:S.game.difficulty, cls:document.body.classList.contains('cw-recruit') };
  });
  h.assert(st.d === 'recruit' && st.cls, 'CONTINUE restores Recruit and the body class');
  h.log('PASS casework_newgame', tag);
};
