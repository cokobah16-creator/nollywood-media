// v13 fix (court) R10: a tab closed on the M8 aftermath or during the trial (a phone discarding it) loses nothing.
// - mid-trial: reload, CONTINUE → the trial at the same step (same exhibit, patience, rulings): no fresh trial to
//   re-answer; then RISE → the epilogue (seasonOneComplete) → the case review; the run record is cleared
// - at the aftermath (before CONTINUE): CONTINUE → the trial, from the pre-trial file
// - at the judgment, before RISE: CONTINUE → the judgment again → RISE → the epilogue
// - the pause menu's LOAD over the trial: the same step
// - an unproven finale closed at the aftermath: CONTINUE → the epilogue (no trial)
// - a closed season: CONTINUE → the case files, "CAMPAIGN UP TO DATE", as before
const LIB = require('./v13_c_lib.cjs');
const CASE = {
  moral:{ tower:'hold', asaba:'rescue', checkpoint:'flip_driver', market_runner:'caught', arrest:'professional' },
  flags:{ fin_bodycam:true }, sealed:{ who:'adaeze', before:true },
  ev:['fin_recording', 'fin_courier_phone', 'fin_drive', 'tower_cdr', 'musa_statement', 'ransom_ledger', 'asaba_hostage'],
  lagos:{ suspect:'obi', method:'phish', money:'wallet', warrant:'signed' }, route:{ suspect:'ifeanyi', method:'route', money:'asaba', warrant:'signed' },
  warrants:{ w_cdr:'signed', w_eko:'signed' }, cert:'all',
  voice:{ suspect:'adaeze', method:'shield', money:'ca', picks:['fin_courier_phone', 'fin_recording', 'tower_cdr'] },
};
module.exports = async h => {
  const C = LIB.lib(h);
  const disk = () => h.ev(() => { const g = (JSON.parse(localStorage.getItem(SAVE_KEY) || '{}').game) || {}; const i = g.intel || {};
    return { m8:(g.completedMissions || []).includes('m8'), finale:(g.moralChoices || {}).finale || null, season:!!g.seasonOneComplete, run:i.courtRun || null, court:i.court || null }; });
  const scr = () => h.ev(() => ({ ov:[...document.querySelectorAll('.overlay.show')].map(o => o.id), toast:(document.getElementById('toast') || {}).textContent || '',
    phase:COURT.phase, i:COURT.i, x:(COURT.ex[COURT.i] || {}).id || null, patience:COURT.patience, admitted:COURT.admitted.map(x => x.id), struck:COURT.struck.map(x => x.id),
    then:typeof COURT.then === 'function', season:!!S.game.seasonOneComplete, court:I().court, run:!!I().courtRun }));
  // the tab is closed (or the phone discards it); the player comes back and presses CONTINUE
  const reloadContinue = async () => {
    await h.page.reload({ waitUntil:'load', timeout:90000 });
    await h.step(1500);
    await h.ev(() => { ART.failed = true; ART.promise = null; });
    await h.ev(() => document.getElementById('btn-continue').click()); await h.step(400);
    await h.ev(() => { const b = document.getElementById('btn-recap-go'); if(b && document.querySelector('#screen-recap.show')) b.click(); });
    await h.step(800);
    return scr();
  };
  const toPhase = async (want, policy) => { for(let n = 0; n < 80; n++){ const s = await scr(); if(s.phase === want && s.ov.includes('screen-court')) return s; await C.step(policy || 'best', 'admit'); } return null; };
  const epilogueToReview = async () => {
    for(let n = 0; n < 40; n++){
      const s = await scr();
      if(s.ov.includes('screen-review')) return true;
      if(!s.ov.includes('screen-epilogue')) return false;
      await h.ev(() => advanceEpilogue()); await h.step(30);
    }
    return false;
  };

  // ---- 1. mid-trial (nothing certified: the first exhibit draws an s.84 objection) ----
  await C.setup(Object.assign({}, CASE, { cert:[] }));
  let r = await C.resolve();
  h.assert(r.outcome === 'proven' && r.aftermath, 'proven, the aftermath is up');
  let dk = await disk();
  h.assert(dk.m8 && dk.finale === 'proven' && !dk.season, 'on disk: M8 done, finale proven, the season not closed yet');
  h.assert(await C.toCourt(), 'CONTINUE opens the trial');
  await C.step();                                                       // ALL RISE
  let s = await scr();
  h.assert(s.phase === 'ex' && s.i === 0, 'the first exhibit is up');
  const first = s.x;
  h.assert((await h.ev(() => COURT.ex[0].k)) === 's84', 'the first exhibit draws an s.84 objection');
  await C.step({ s84:'oral' });                                         // a poor answer the player would like back (patience −1, struck out)
  await C.step();                                                       // the ruling → the next exhibit
  const before = await scr();
  h.assert(before.phase === 'ex' && before.i === 1 && before.struck.includes(first) && before.patience === 2, 'the first exhibit is struck out at a patience cost; the second is up');
  const firstOut = true;
  const dkMid = await disk();
  h.log('mid-trial', JSON.stringify({ phase:before.phase, i:before.i, p:before.patience, struck:before.struck }));
  s = await reloadContinue();
  h.log('after reload + CONTINUE', JSON.stringify({ ov:s.ov, toast:s.toast, phase:s.phase, i:s.i, p:s.patience, struck:s.struck, season:s.season }));
  h.assert(s.ov.includes('screen-court'), 'CONTINUE goes back to the trial (not the case files)');
  h.assert(dkMid.run && dkMid.run.phase === 'ex' && dkMid.run.i === 1 && !dkMid.season, 'every step was on disk (the run record), the season still open');
  h.assert(!/CAMPAIGN UP TO DATE/.test(s.toast) || !s.ov.includes('screen-missions'), 'not "CAMPAIGN UP TO DATE"');
  h.assert(s.phase === 'ex' && s.i === 1 && s.x === before.x && s.patience === before.patience, 'the same exhibit, the same patience');
  h.assert(JSON.stringify(s.struck) === JSON.stringify(before.struck) && JSON.stringify(s.admitted) === JSON.stringify(before.admitted), 'the rulings already given stand (no fresh trial)');
  h.assert(s.then, 'the epilogue is still pending');
  // ---- the pause menu's LOAD over the trial: the same step again ----
  await h.ev(() => { showOverlay('screen-pause'); document.getElementById('btn-load').click(); });
  await h.step(500);
  s = await scr();
  h.assert(s.ov.includes('screen-court') && !s.ov.includes('screen-pause') && s.phase === 'ex' && s.i === 1, 'LOAD from the pause menu: back to the same step of the trial');
  // ---- finish: the epilogue closes the season, then the review ----
  await C.runTrial('best');
  s = await scr();
  h.assert(s.ov.includes('screen-epilogue') && s.season, 'RISE → the epilogue; the season is closed');
  h.assert(s.court && s.court.finale === 'proven' && (firstOut ? s.court.struck : s.court.admitted).includes(first), 'the verdict is filed, with the ruling given before the tab closed');
  dk = await disk();
  h.assert(!s.run && !dk.run && dk.season && dk.court, 'the run record is cleared; the save has the season and the verdict');
  h.assert(await epilogueToReview(), 'the last slide → the case review');
  await h.ev(() => document.getElementById('btn-review-done').click()); await h.step(200);
  h.assert((await scr()).ov.includes('screen-title'), 'FINISH → the title');

  // ---- 5. a closed season: CONTINUE → the case files, as before ----
  s = await reloadContinue();
  h.assert(s.ov.includes('screen-missions') && !s.ov.includes('screen-court') && /CAMPAIGN UP TO DATE/.test(s.toast), 'a closed season: the case files, "CAMPAIGN UP TO DATE"');

  // ---- 2. closed at the aftermath, before CONTINUE ----
  await C.setup(CASE);
  r = await C.resolve();
  h.assert(r.outcome === 'proven', 'proven (2)');
  s = await reloadContinue();
  h.log('aftermath reload', JSON.stringify({ ov:s.ov, phase:s.phase, i:s.i }));
  h.assert(s.ov.includes('screen-court') && s.phase === 'pre' && s.then, 'closed at the aftermath: CONTINUE opens the trial at the pre-trial file');

  // ---- 3. closed at the judgment, before RISE ----
  const j = await toPhase('judgment');
  h.assert(j, 'the judgment');
  dk = await disk();
  h.assert(dk.run && dk.run.phase === 'judgment' && !dk.season, 'on disk: the trial is still sitting at the judgment');
  s = await reloadContinue();
  h.assert(s.ov.includes('screen-court') && s.phase === 'judgment', 'CONTINUE: the judgment again');
  h.assert(JSON.stringify(s.admitted) === JSON.stringify(j.admitted), 'the same judgment');
  await C.step();                                                       // RISE
  s = await scr();
  h.assert(s.ov.includes('screen-epilogue') && s.season && !s.run && s.court && s.court.finale === 'proven', 'RISE → the epilogue, the season closed');
  const adaeze = await h.ev(() => (EPI.slides.find(x => x.name === 'COMMANDER ADAEZE') || {}).text || '');
  h.assert(/^Convicted|^Discharged/.test(adaeze), 'the epilogue carries the verdict: ' + adaeze);

  // ---- 4. an unproven finale, closed at the aftermath ----
  await C.setup(Object.assign({}, CASE, { flags:{}, sealed:null, voice:{ suspect:'uche', method:'ransom', money:'pos', picks:[] } }));
  await h.ev(() => { delete S.game.sealed; });
  r = await C.resolve();
  h.assert(r.outcome === 'unproven', 'unproven: ' + r.outcome);
  s = await reloadContinue();
  h.assert(s.ov.includes('screen-epilogue') && !s.ov.includes('screen-court') && s.season, 'unproven: CONTINUE → the epilogue (no trial); the season closes');
  h.assert(!h.errors.length, 'no page errors: ' + h.errors.join(' | '));
  h.log('PASS v13_fix_court_reload');
};
