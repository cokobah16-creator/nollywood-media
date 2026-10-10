// v13 court (team C) 7: Esc, the epilogue, the review and M8 replays (design §3, A2, F041, F068, F072).
// - Esc (twice, at any phase) during the trial never opens the pause menu or drops the pending epilogue
// - with the shared modal stack (v13Modal, team A) present: a pause menu opened over the trial resumes it
// - the review opens after the last epilogue slide and BEFORE the title (no title music, no Season One toast
//   under it); Esc there is ignored too; FINISH goes to the title
// - an M8 replay that ends 'unproven' does not keep the old verdict: no trial, the base epilogue line;
//   a replay that ends 'contested' gets a fresh trial; the old verdict is kept only in a log
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
  const esc2 = async () => { await h.page.keyboard.press('Escape'); await h.step(80); await h.page.keyboard.press('Escape'); await h.step(80); };
  const scr = () => h.ev(() => ({ court:!!document.querySelector('#screen-court.show'), pause:!!document.querySelector('#screen-pause.show'), then:typeof COURT.then === 'function',
    review:!!document.querySelector('#screen-review.show'), title:!!document.querySelector('#screen-title.show'), epi:!!document.querySelector('#screen-epilogue.show'), phase:COURT.phase }));
  await C.setup(CASE);
  await h.ev(() => { window.__music = []; const m = window.musicForScene; window.musicForScene = function(k){ window.__music.push(k); return m.apply(this, arguments); }; });
  const r = await C.resolve();
  h.assert(r.outcome === 'proven', 'proven');
  h.assert(await C.toCourt(), 'trial opens');
  // ---- Esc twice, at the pre-trial file, an exhibit and a ruling ----
  for(const want of ['pre', 'ex', 'ruling']){
    while((await scr()).phase !== want) await C.step('best', 'admit');
    await esc2();
    const s = await scr();
    h.assert(s.court && !s.pause && s.then && s.phase === want, `Esc twice at "${want}": still in court, no pause menu, the epilogue still pending`);
  }
  // ---- with the modal stack: a pause menu opened over the trial resumes it ----
  const modal = await h.ev(() => typeof v13Modal === 'function');
  if(modal){
    await h.ev(() => { showOverlay('screen-pause'); document.getElementById('btn-resume').click(); });
    await h.step(120);
    const s = await scr();
    h.assert(s.court && !s.pause && s.then, 'Resume on a pause menu opened over the trial goes back to the trial');
  } else h.log('v13Modal not in this build: the pause-menu resume path is team A\'s (the Esc fallback in v13_court.js held above)');
  // ---- finish the trial; the epilogue; the review before the title ----
  await C.runTrial('best');
  let s = await scr();
  h.assert(s.epi && !s.court, 'RISE goes to the epilogue');
  const verdict1 = await h.ev(() => (EPI.slides.find(x => x.name === 'COMMANDER ADAEZE') || {}).text);
  h.assert(/^Convicted/.test(verdict1), 'the epilogue carries the verdict: ' + verdict1);
  await h.ev(() => { window.__music = []; });
  for(let i = 0; i < 40; i++){
    const last = await h.ev(() => EPI.i + 1 >= EPI.slides.length);
    if(last){
      const before = await h.ev(() => ({ season:typeof _ach !== 'undefined' && !!_ach.season_one }));
      await h.ev(() => advanceEpilogue());
      await h.step(120);
      s = await scr();
      const after = await h.ev(() => ({ season:typeof _ach !== 'undefined' && !!_ach.season_one, music:window.__music.slice() }));
      h.assert(s.review && !s.title && !s.epi, 'after the last slide: the case review, not the title screen');
      h.assert(!after.music.includes('title'), 'no title music under the review');
      h.assert(after.season === before.season, 'the Season One toast waits for the title');
      break;
    }
    await h.ev(() => advanceEpilogue()); await h.step(20);
  }
  await esc2();
  s = await scr();
  h.assert(s.review && !s.pause, 'Esc is ignored on the review');
  await h.ev(() => document.getElementById('btn-review-done').click());
  await h.step(150);
  s = await scr();
  const fin = await h.ev(() => ({ music:window.__music.slice(), season:typeof _ach !== 'undefined' && !!_ach.season_one, shown:I().reviewShown, court:I().court }));
  h.assert(s.title && !s.review, 'FINISH goes to the title');
  h.assert(fin.music.includes('title') && fin.season, 'title music and the Season One unlock come with the title');
  h.assert(fin.shown && fin.court && fin.court.finale === 'proven', 'the review is marked shown; the verdict is kept for this finale');

  // ---- an M8 replay that ends unproven: no trial, no old verdict ----
  await h.ev(() => { loadMission('m8'); });
  await h.step(500);
  await h.ev(() => { if(document.querySelector('#screen-controls.show')) beginMission('m8'); });
  await h.step(1200);
  let st = await h.ev(() => ({ court:I().court, log:(I().courtLog || []).length, shown:I().reviewShown, finale:S.game.moralChoices.finale, rec:S.game.accusations.voice && S.game.accusations.voice.suspect }));
  h.assert(st.court === null && st.log === 1 && st.shown === false && st.finale === undefined, 'the replay clears the old trial (kept in a log) and the review flag');
  h.assert(st.rec === 'adaeze', 'the finale charge sheet stands (beta: permanent)');
  // nothing but a partial case this time: no body-cam, no sealed credit, two weak picks
  await h.ev(() => { S.game.flags.fin_bodycam = false; S.game.sealed = null; S.game.accusations.voice.picks = ['co_madam', 'obi_notebook', 'ransom_ledger']; });
  let res = await C.resolve();
  h.assert(res.outcome === 'unproven', 'this replay ends unproven');
  h.assert(/Continue for the epilogue/.test(res.next), 'no trial is announced');
  await h.ev(() => document.getElementById('btn-aftermath-continue').click());
  await h.step(250);
  s = await scr();
  const verdict2 = await h.ev(() => (EPI.slides.find(x => x.name === 'COMMANDER ADAEZE') || {}).text);
  h.assert(s.epi && !s.court, 'unproven: straight to the epilogue');
  h.assert(/^Relieved of command/.test(verdict2) && !/Convicted/.test(verdict2), 'the old verdict is gone: ' + verdict2);
  // ---- a second replay that ends contested: a fresh trial ----
  await h.ev(() => { showOverlay(null); loadMission('m8'); });
  await h.step(500);
  await h.ev(() => { if(document.querySelector('#screen-controls.show')) beginMission('m8'); });
  await h.step(1200);
  await h.ev(() => { S.game.flags.fin_bodycam = true; S.game.sealed = { who:'adaeze', before:true }; S.game.accusations.voice.picks = ['co_madam', 'obi_notebook', 'ransom_ledger']; });
  res = await C.resolve();
  h.assert(res.outcome === 'contested', 'this replay ends contested');
  h.assert(/Continue to the trial/.test(res.next), 'the trial is announced again');
  h.assert(await C.toCourt(), 'a fresh trial opens');
  st = await h.ev(() => ({ phase:COURT.phase, patience:COURT.patience, court:I().court }));
  h.assert(st.phase === 'pre' && st.patience === 3 && st.court === null, 'fresh: the pre-trial file, full patience, no verdict yet');
  h.log('PASS v13_c_esc_replay');
};
