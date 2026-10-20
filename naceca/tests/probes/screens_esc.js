// screens team (R04): Esc on every Season 2 overlay does what that screen's own close or back button does, or
// nothing on a decision screen; the pause menu never opens over one; and if the pause menu opens over one
// anyway (the HUD's pause button), RESUME brings the screen back. Desktop (the real Escape key).
const { L, sc, checks, OFFICE, shown, overlays, courtState, c15, clearC15 } = require('./screens_lib.js');
module.exports = async function (T) {
  const C = checks(T);
  const esc = async () => { await T.page.keyboard.press('Escape'); await T.wait(600); };
  const pauseUp = () => shown(T, 'screen-pause');

  T.log('h13', await sc.s2start(T, 'h13', OFFICE));
  await T.until(() => !document.querySelector('#title-card.show'), 20000); await T.wait(1200);

  // the case file: Esc closes it; the pause button over it, then RESUME, brings it back
  await T.ev(() => V13.openCaseFileS2()); await T.wait(400);
  await esc();
  C.ok('R04-s2case-esc', !(await shown(T, 's2case')) && !(await shown(T, 'screen-s2case')) && !(await pauseUp()), 'after Esc: ' + await overlays(T));
  await T.ev(() => V13.openCaseFileS2()); await T.wait(400);
  await T.ev(() => togglePause()); await T.wait(500);
  const under = await overlays(T);
  await T.ev(() => document.getElementById('btn-resume').click()); await T.wait(700);
  C.ok('R04-s2case-resume', /screen-pause/.test(under) && await shown(T, 'screen-s2case') && !(await pauseUp()), 'pause: ' + under + ' · after RESUME: ' + await overlays(T));
  await esc();
  const hud = await T.ev(() => getComputedStyle(document.getElementById('hud')).display);
  C.ok('R04-s2case-hud', !(await shown(T, 'screen-s2case')) && hud !== 'none', 'closed after RESUME, HUD ' + hud);

  // the sources board: Esc is BACK (its onClose runs)
  await T.ev(() => { window.__srcClosed = 0; V13.openSources(() => { window.__srcClosed++; }); }); await T.wait(400);
  await esc();
  C.ok('R04-sources-esc', !(await shown(T, 'screen-sources')) && !(await pauseUp()) && await T.ev(() => window.__srcClosed === 1), 'after Esc: ' + await overlays(T) + ' closed=' + await T.ev(() => window.__srcClosed));

  // the fix board in the office: Esc walks away from the desk (its own button)
  await T.ev(() => { window.__fixClosed = 0; S.game.moralChoices.s2_original = 'handed'; V13.s2().fixes = {}; V13.court.openFixes(1, () => { window.__fixClosed++; }, { where:'h13' }); }); await T.wait(400);
  await esc();
  C.ok('R04-fixboard-office-esc', !(await shown(T, 'screen-courtfix')) && !(await pauseUp()) && await T.ev(() => window.__fixClosed === 1), 'after Esc: ' + await overlays(T));

  // in court the fix board is a decision: Esc does nothing, and no pause menu
  await T.ev(() => { window.__fixClosed = 0; V13.court.openFixes(2, () => { window.__fixClosed++; }, { where:'m14', kicker:'BEFORE MONDAY' }); }); await T.wait(400);
  await esc();
  C.ok('R04-fixboard-court-esc', await shown(T, 'screen-courtfix') && !(await pauseUp()) && await T.ev(() => window.__fixClosed === 0), 'after Esc: ' + await overlays(T));
  await T.ev(() => document.querySelector('#screen-courtfix .cf-close').click()); await T.wait(300);

  // the exhibit list (its own Esc) and the judgment card (Esc = LEAVE COURT 5)
  await courtState(T);
  await T.ev(() => V13.court.openExhibits()); await T.wait(300);
  await esc();
  C.ok('R04-exhibits-esc', !(await T.ev(() => document.getElementById('court-exh').classList.contains('show'))) && !(await pauseUp()), 'after Esc: ' + await overlays(T));
  await T.ev(() => { window.__left = 0; V13.s2().trial = { d1:'guilty', d2:'plea', d3:'notguilty' }; V13.court.verdictCard().then(() => { window.__left++; }); }); await T.wait(400);
  await esc();
  C.ok('R04-verdict-esc', !(await shown(T, 'screen-courtverdict')) && !(await pauseUp()) && await T.ev(() => window.__left === 1), 'after Esc: ' + await overlays(T) + ' left=' + await T.ev(() => window.__left));
  await T.ev(() => V13.court.end());

  // Case 15: the envelope, the accusation and the case card are decisions: Esc does nothing
  T.log('m15', await c15(T));
  await T.ev(() => { window.__sealed = null; V13._c15.sealScreen(ok => { window.__sealed = ok; }); }); await T.wait(500);
  await esc();
  C.ok('R04-seal15-esc', await shown(T, 'screen-seal15') && !(await pauseUp()) && await T.ev(() => window.__sealed === null), 'after Esc: ' + await overlays(T));
  await T.ev(() => togglePause()); await T.wait(500);
  const u2 = await overlays(T);
  await T.ev(() => document.getElementById('btn-resume').click()); await T.wait(700);
  C.ok('R04-seal15-resume', /screen-pause/.test(u2) && await shown(T, 'screen-seal15'), 'pause: ' + u2 + ' · after RESUME: ' + await overlays(T));
  await T.ev(() => { const n = document.getElementById('s15-no'); if (n) n.click(); }); await T.wait(400);
  C.ok('R04-seal15-cancel', !(await shown(T, 'screen-seal15')) && await T.ev(() => window.__sealed === false), 'NOT TONIGHT: ' + await overlays(T));
  await T.ev(() => V13._c15.accuseScreen()); await T.wait(500);
  await esc();
  C.ok('R04-accuse15-esc', await shown(T, 'screen-accuse15') && !(await pauseUp()), 'after Esc: ' + await overlays(T));
  await clearC15(T);
  await T.ev(() => V13._c15.caseCard(V13._c15.judge('kuti', ['dg_recording']))); await T.wait(500);
  await esc();
  C.ok('R04-case15-esc', await shown(T, 'screen-case15') && !(await pauseUp()), 'after Esc: ' + await overlays(T));
  await clearC15(T);
  C.done();
};
