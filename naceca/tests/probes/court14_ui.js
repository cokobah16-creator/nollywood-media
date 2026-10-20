// Case 14 panels at a glance, without playing the trial: choices, the court bar, a stamp, a count card,
// the exhibit list, the fix board and the judgment card — at the harness size, then in narrow portrait.
const sc = require('../scen13.js');
const C14 = require('./court14.js');

async function toChoices(T) {
  for (let k = 0; k < 20; k++) {
    const n = await T.ev(() => { if (!skipTypewriter() && !document.querySelector('#dlg-choices .dialogue-choice') && !document.getElementById('dlg-continue').classList.contains('hide')) advanceDialogue(); return document.querySelectorAll('#dlg-choices .dialogue-choice').length; });
    if (n) return n; await T.wait(250);
  }
  return 0;
}
async function states(T, tag) {
  // a decision on screen (the exam's 'watch' question), with the bar and the meter
  await T.ev(() => {
    const K = V13.court, S = K.reset(); K.active = true; document.body.classList.add('v13-court');
    Object.assign(S, { day:1, cred:57 });
    ['drive_image', 'upstream_ledger', 'pos_t4_log', 'cash_bundles'].forEach((id, i) => { S.admitted.push(id); S.exhibits[id] = 'P' + (i + 1); S.weight[id] = i === 1 ? 'reduced' : 'full'; });
    S.nextP = 5; S.mfi.bvn_link = { label:'MFI-1', fix:'bank_cert' }; S.mfiOrder.push('bvn_link'); S.rejected.push('lucky_statement'); S.withdrawn.push('lucky_statement');
    K.bar(true); K.label('DAY 1 · EXAMINATION-IN-CHIEF', 'PW1 · 5/10'); K.credMeter(true);
    const q = V13.COURT_DATA.day1.exam.find(x => x.id === 'watch');
    const ask = q.ask.map(l => K.line(l));
    K.decide(ask.slice(0, -1), ask[ask.length - 1], q.answers.map(a => ({ text:a.text, lines:[K.line({ who:'KELECHI', text:a.text })], meta:{ kind:a.kind } })), { type:'exam', id:'watch' });
  });
  await T.wait(600); await toChoices(T); await T.wait(900);
  await T.shot(tag + '_choices');
  // an objection with four options, and the stamp
  await T.ev(() => { const b = document.querySelector('#dlg-choices .dialogue-choice'); b.click(); });
  await T.wait(300); await T.ev(() => { while (document.getElementById('screen-dialogue').classList.contains('show')) advanceDialogue(); });
  await T.ev(() => {
    const K = V13.court, X = V13.COURT_DATA.exhibits.drive_image, o = X.objections[0];
    const san = o.san.map(l => K.line(l)); san[0]._stamp = 'OBJECTION'; san[0]._stampKind = 'obj';
    const opts = o.responses.map(r => ({ text:r.text, lines:r.reply.map(l => K.line(l)) })).concat([{ text:'Danladi: "We apply to stand it down until our search for the original is on record."', lines:[] }]);
    K.decide(san.slice(0, -1), san[san.length - 1], opts, { type:'objection', id:'drive_image' });
  });
  await toChoices(T); await T.wait(500);
  await T.shot(tag + '_objection');
  await T.ev(() => { const b = document.querySelector('#dlg-choices .dialogue-choice'); b.click(); });
  await T.wait(300); await T.ev(() => { while (document.getElementById('screen-dialogue').classList.contains('show')) advanceDialogue(); });
  // the count, held up during the arraignment
  await T.ev(() => { const K = V13.court; K.label('DAY 1 · ARRAIGNMENT'); K.credMeter(false);
    K.play([K.line({ who:'NACECA SYSTEM', text:'The registrar reads count one in full: money laundering, section 18 of the Money Laundering (Prevention and Prohibition) Act, 2022.' }, { _doc:{ k:'FHC/ABJ/CR/214/2026', t:'COUNT ONE', body:V13.COURT_DATA.charge.count1 } })]); });
  await T.wait(900); await T.ev(() => skipTypewriter()); await T.wait(400);
  await T.shot(tag + '_count');
  await T.ev(() => { while (document.getElementById('screen-dialogue').classList.contains('show')) advanceDialogue(); });
  // the exhibit list
  await T.ev(() => V13.court.openExhibits()); await T.wait(600); await T.shot(tag + '_exhibits');
  await T.ev(() => document.querySelector('#court-exh .ce-x').click()); await T.wait(300);
  // the fix board
  await T.ev(() => { V13.court.bar(false); V13.court.openFixes(2, () => {}, { kicker:'BEFORE MONDAY', note:'Danladi has time to chase two of these before Monday. Whatever isn\'t ready, we fight for on the day.' }); });
  await T.wait(700); await T.shot(tag + '_fixboard');
  await T.ev(() => document.querySelector('#screen-courtfix .cf-close').click()); await T.wait(300);
  // the judgment card
  await T.ev(() => {
    const K = V13.court, S = K.state;
    S.finalEls = { e1a:true, e1b:true, e1c:false, e2a:true, e2b:true, e3a:true, e3b:true, e3c:true }; S.nocase = { d1:'overruled', d2:'overruled', d3:'upheld' };
    S.nocaseEls = { e3a:true, e3b:false, e3c:false }; S.plea.d2 = true;
    V13.s2().trial = { d1:'notguilty', d2:'plea', d3:'notguilty' };
    K.verdictCard();
  });
  await T.wait(700); await T.shot(tag + '_verdict');
  await T.ev(() => document.querySelector('#screen-courtverdict .cv-go').click());
  await T.ev(() => V13.court.end());
}

module.exports = async function (T) {
  const ok = await sc.s2start(T, 'm14', C14.RUNS.strong.prep);
  T.log('m14 started', ok);
  await T.until(() => !document.querySelector('#title-card.show') && ENGINE.movementEnabled, 30000);
  await T.wait(800); await T.shot('walkup');
  await sc.use(T, 'Barrister Danladi');                      // into the conference, then pause it
  await T.wait(1500);
  await T.ev(() => { DLG.onComplete = null; endDialogue(); });
  await states(T, T.mode === 'phone' ? 'land' : 'desk');
  if (T.mode === 'phone') {
    await T.page.setViewportSize({ width:390, height:844 }); await T.wait(1500);
    await states(T, 'port');
  }
};
