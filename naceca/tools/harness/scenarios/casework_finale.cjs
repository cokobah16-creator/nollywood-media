// Casework 8: the finale accusation now has METHOD and MONEY TRAIL steps, persists across M8 replays,
// and naming the wrong person costs (public arrest line, Public Trust −10, Integrity −5, epilogue).
// The reveal still happens (canon).
const LIB = require('./casework_lib.cjs');
module.exports = async h => {
  const L = LIB.lib(h);
  const tag = await h.ev(() => innerWidth < 600 ? 'phone' : 'desk');
  await h.start('m8', { completed:['m0', 'm1', 'm2', 'm3', 'm3n', 'm4', 'm5', 'm6', 'm7', 't7'], state:S => {
    S.game.moralChoices = { tower:'hold', asaba:'rescue' };
    S.game.evidence = [{ id:'tower_cdr', name:'Call Records — Ugbowo Cell' }, { id:'tower_fix', name:'Cabinet Fix' }, { id:'fin_drive', name:"Osas's Flash Drive" }, { id:'co_madam', name:"Courier's Dropped Phone" }];
  } });
  const rep0 = await L.rep();
  await h.ev(() => { S.game._finArrived = false; delete S.game._acc; finaleArrival(); });
  await h.step(300);
  h.assert(await L.shown('screen-accuse'), 'the accusation sheet opens before the Voice arrives');
  const sh = await h.ev(() => {
    const ov = document.getElementById('screen-accuse');
    return { secs:[...ov.querySelectorAll('.cw-sec')].map(s => s.dataset.sec), cards:ov.querySelectorAll('.cw-card').length, text:ov.textContent,
      sizes:[...ov.querySelectorAll('button')].map(b => { const r = b.getBoundingClientRect(); return Math.min(r.width, r.height); }) };
  });
  h.log('finale sheet', sh.secs, sh.cards);
  h.assert(JSON.stringify(sh.secs) === '["who","method","money","ev"]', 'WHO, METHOD, MONEY TRAIL, then three pieces of evidence');
  h.assert(sh.cards === 6, 'the six candidates');
  h.assert(!/\bher\b|\bshe\b/i.test(sh.text.replace(/Herself/, '')), 'no option line genders the Voice before the reveal');
  h.assert(Math.min(...sh.sizes) >= 44, 'every button is at least 44px');
  await L.pick('screen-accuse', 'who', 'chidi');
  await L.pick('screen-accuse', 'method', 'ransom');
  await L.pick('screen-accuse', 'money', 'ca');
  for(const id of ['tower_cdr', 'fin_drive', 'co_madam']) await L.pick('screen-accuse', 'ev', id);
  await h.shot('casework_finale_' + tag);
  await L.fileTwice('screen-accuse');
  const after = await h.ev(() => ({ rec:S.game.accusations.voice, acc:S.game._acc, rep:Object.assign({}, S.player.reputation), key:DLG.scriptKey }));
  h.log('voice record', after.rec);
  h.assert(after.rec && after.rec.suspect === 'chidi' && after.rec.method === 'ransom' && after.rec.money === 'ca' && after.rec.picks.length === 3, 'the record holds who, method, money and the picks');
  h.assert(!after.rec.ok.suspect && !after.rec.ok.method && after.rec.ok.money, 'ok flags per part');
  h.assert(after.rep.publicTrust - rep0.publicTrust === -10 && after.rep.integrity - rep0.integrity === -5, 'wrong name: Public Trust −10, Integrity −5 exactly');
  h.assert(after.key === 'fin_reveal_run', 'the reveal happens regardless (canon)');
  // the reveal → the resolution line
  await L.finishDialogue(150);
  await h.step(200);
  const res = await h.ev(() => ({ key:DLG.scriptKey, line:(DIALOGUE.fin_end_unproven_run || DIALOGUE.fin_end_contested_run || DIALOGUE.fin_end_proven_run || [])[0], outcome:S.game.moralChoices.finale }));
  h.log('resolution', res.key, res.outcome);
  h.assert(/On your word, Insp\. Chidi was arrested/.test(res.line.text), 'the named person is publicly arrested');
  h.assert(/FAILS: Motive/.test(res.line.text) && /SET ASIDE: Money trail/.test(res.line.text) && !/HOLDS: Money/.test(res.line.text), 'a right money trail argued against the wrong person is set aside, not upheld');
  h.assert(/Your accusation named Insp\. Chidi/.test(res.line.text), 'the line says who was accused');
  h.assert(!/[✓✗]/.test(res.line.text), 'right/wrong in words, not glyphs');
  await L.finishDialogue(150);
  await h.step(300);
  const af = await h.ev(() => ({ head:S.game.headlines[S.game.headlines.length - 1], review:(document.querySelector('#aftermath-grid .cw-review') || {}).textContent || '',
    epi:(epilogueSlides().find(s => s.name === 'INSP. CHIDI') || {}).text }));
  h.log('finale headline', af.head.head);
  h.assert(/Insp\. Chidi Was Arrested in Error/.test(af.head.head), 'the finale headline carries the wrong arrest');
  h.assert(/FAILS/.test(af.review) && /SET ASIDE/.test(af.review) && !/HOLDS/.test(af.review), 'the aftermath reviews the finale sheet (nothing upheld against the wrong person)');
  h.assert(/no longer returns NACECA's calls/.test(af.epi || ''), 'an epilogue line for Insp. Chidi');

  // ---- replay M8: the accusation stands, no second sheet, no second cost ----
  const rep1 = await L.rep();
  await h.ev(() => { showOverlay(null); renderMissionSelect(); document.querySelector('#mission-grid .mission-card[data-mid="m8"]').click(); });
  await h.step(700);
  await h.ev(() => { if(document.querySelector('#screen-controls.show')) beginMission('m8'); });
  await h.step(1500);
  let st = await h.ev(() => ({ m:S.game.currentMission, rec:S.game.accusations.voice }));
  h.assert(st.m === 'm8' && st.rec && st.rec.suspect === 'chidi' && st.rec.method === 'ransom' && st.rec.picks.length === 3, 'the M8 replay (finResetFlags ran) keeps the filed accusation');
  await h.ev(() => { S.game._finArrived = false; finaleArrival(); });
  await h.step(300);
  st = await h.ev(() => ({ sheet:!!document.querySelector('#screen-accuse.show'), key:DLG.scriptKey, toast:document.getElementById('toast').textContent, rep:Object.assign({}, S.player.reputation), acc:S.game._acc }));
  h.assert(!st.sheet && st.key === 'fin_reveal_run' && /ACCUSATION STANDS/.test(st.toast), 'the replay goes straight to the reveal: "your accusation stands"');
  h.assert(st.acc && st.acc.who === 'chidi' && st.acc.picks.length === 3, 'the reveal reads the filed accusation');
  h.assert(st.rep.publicTrust === rep1.publicTrust && st.rep.integrity === rep1.integrity, 'no second cost on a replay');

  // ---- all right: the strongest case ----
  await L.finishDialogue(150);
  const best = await h.ev(() => {
    S.game.accusations.voice = null; delete S.game._acc;
    const r = CW.file('voice', { suspect:'adaeze', method:'shield', money:'ca' }, { picks:['tower_cdr', 'fin_drive', 'tower_fix'] });
    S.game._acc = { who:'adaeze', picks:r.picks.slice() };
    return r.ok;
  });
  h.assert(best.suspect && best.method && best.money, 'the canonical answer: Adaeze, shielding the ring, the C.A. payroll');
  h.log('PASS casework_finale', tag);
};
