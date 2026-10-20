// Case 15, Monday only: a contested case (two strong pieces and no envelope) — the DG on the phone at the window,
// then suspended. Friday is skipped: the brief is closed and Monday is called directly (V13._c15.monday).
const L = require('./c15lib.js'), sc = L.sc;
module.exports = async function (T) {
  const ok = await sc.s2start(T, 'm15', L.STRONG + "S.game.moralChoices.s2_end = 'truth'; S.game.moralChoices.s2_raid_entry = 'gate';");
  T.log('started', ok);
  await L.waitDialogue(T, 30000);
  await T.ev(() => { DLG.onComplete = null; if (typeof endDialogue === 'function') endDialogue(); });
  await T.wait(800);
  await T.ev(() => { V13.ev('barge_cash', 'Cash on the barge', 'good', 90); V13.ev('senator_words', 'The Senator on the jetty', 'good', 90); V13._c15.monday(); });
  await L.waitDialogue(T, 120000); await T.wait(1500); await L.shot(T, '01_monday');
  await sc.talk(T);
  await L.waitFree(T, 60000); await T.wait(2000); await L.shot(T, '02_lobby_free');
  T.log('lobby', JSON.stringify(await L.st(T)), await T.ev(() => JSON.stringify({ cam:ENGINE.camera.position.toArray().map(v => +v.toFixed(2)) })));
  await sc.use(T, 'Director-General');
  await L.accuse(T, 'dg', ['dg_recording', 'visitor_book', 'drive_image'], '03_accuse');
  await T.wait(3000); await L.shot(T, '04_walk_in');
  await L.waitDialogue(T, 60000); await T.wait(1500); await L.shot(T, '05_reveal');
  await L.until(T, 'Is this what you brought'); await L.shot(T, '06_dg_phone');
  await L.until(T, 'suspends the Director-General'); await T.wait(2500); await L.shot(T, '07_suspended');
  await sc.talk(T);
  await T.until(() => document.getElementById('screen-case15') && document.getElementById('screen-case15').classList.contains('show'), 30000);
  await T.wait(800); await L.shot(T, '08_case_card');
  await T.ev(() => document.getElementById('c15-done').click());
  await T.until(() => document.getElementById('screen-aftermath').classList.contains('show'), 30000);
  T.log('end', JSON.stringify(await L.st(T)), await T.ev(() => JSON.stringify({ arrests:S.game.arrests, unlocked:(S.game.achievements || S.achievements || []).slice ? (S.game.achievements || []).slice(-3) : null })));
};
