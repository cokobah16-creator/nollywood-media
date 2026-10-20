// The fix board as the Abuja hub would open it (one pick, where:'h13'), then the trial's own
// pre-trial board: it should offer only what is left of the two fixes before Monday.
const sc = require('../scen13.js');
const C14 = require('./court14.js');

async function drain(T, ms) {
  const t0 = Date.now();
  while (Date.now() - t0 < (ms || 60000)) {
    const s = await T.ev(() => {
      const on = id => { const e = document.getElementById(id); return !!(e && e.classList.contains('show')); };
      if (on('screen-courtfix')) return 'fix';
      if (!on('screen-dialogue')) return 'idle';
      skipTypewriter();
      if (document.querySelector('#dlg-choices .dialogue-choice')) return 'choice';
      advanceDialogue(); return 'line';
    });
    if (s === 'fix' || s === 'idle' || s === 'choice') return s;
    await T.wait(60);
  }
  return 'timeout';
}

module.exports = async function (T) {
  await sc.s2start(T, 'm14', C14.RUNS.strong.prep);
  await T.until(() => !document.querySelector('#title-card.show') && ENGINE.movementEnabled, 30000);
  await T.wait(800);
  // the hub's board
  await T.ev(() => { window.__hubClosed = false; V13.court.openFixes(1, () => { window.__hubClosed = true; }, { where:'h13', kicker:'BEFORE THE TRIAL', note:'Hauwa has a day. One of these, properly.' }); });
  await T.wait(700); await T.shot('hub_board');
  T.log('hub board', await T.ev(() => (document.querySelector('#screen-courtfix .cf-left') || {}).textContent));
  await T.ev(() => document.querySelector('#screen-courtfix .cf-go[data-f="cert_pos"]').click());
  T.log('after fix lines', await drain(T, 60000));
  await T.until(() => window.__hubClosed === true, 20000);
  T.log('hub fixes', await T.ev(() => JSON.stringify({ fixes:V13.s2().fixes, where:V13.s2().fixWhere, overlay:isOverlayOpen(), move:ENGINE.movementEnabled })));
  // the conference, up to its board
  await sc.use(T, 'Barrister Danladi');
  for (let k = 0; k < 40; k++) {
    const s = await drain(T, 60000);
    if (s === 'fix') break;
    if (s === 'choice') await T.ev(() => { const b = document.querySelector('#dlg-choices .dialogue-choice'); b.click(); if (b.dataset.armed) b.click(); });
    await T.wait(200);
  }
  await T.wait(600); await T.shot('conf_board');
  T.log('conference board', await T.ev(() => JSON.stringify({ left:(document.querySelector('#screen-courtfix .cf-left') || {}).textContent,
    note:(document.querySelector('#screen-courtfix .cf-lead') || {}).textContent, done:[...document.querySelectorAll('#screen-courtfix .cf-done')].length,
    go:[...document.querySelectorAll('#screen-courtfix .cf-go')].map(b => b.dataset.f) })));
  await T.ev(() => document.querySelector('#screen-courtfix .cf-go').click());
  const s = await drain(T, 60000);
  T.log('after conference pick', s, await T.ev(() => JSON.stringify({ fixes:V13.s2().fixes, where:V13.s2().fixWhere, board:!!document.querySelector('#screen-courtfix.show') })));
  // a replay of the case keeps the hub's fix and drops the trial's own
  await T.ev(() => V13.court.resetFixes());
  T.log('after reset', await T.ev(() => JSON.stringify({ fixes:V13.s2().fixes, where:V13.s2().fixWhere })));
  // the escort's phone without the tracker log: the tracker certificate is on offer but protects nothing
  await T.ev(() => { S.game.evidence = S.game.evidence.filter(e => e.id !== 'barge_track'); V13.court.openFixes(2, () => {}, { where:'h13', kicker:'BEFORE THE TRIAL' }); });
  await T.wait(700); await T.shot('hub_board_phone_only');
  T.log('tracker card', await T.ev(() => { const b = document.querySelector('#screen-courtfix .cf-go[data-f="cert_tracker"]'); const c = b && b.closest('.cf-card'); return c ? ((c.querySelector('.cf-prot') || {}).textContent || '(no PROTECTS line: Senior Agent)') : 'none'; }));
  await T.ev(() => document.querySelector('#screen-courtfix .cf-close').click());
};
