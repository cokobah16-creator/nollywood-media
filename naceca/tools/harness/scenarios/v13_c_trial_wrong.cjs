// v13 court (team C) 2: the WRONG name on the finale charge sheet (design §3).
// A wrong name can still reach the court as 'contested' (the body-cam plus a sealed report on her). Then:
// - the defence opens with the public arrest of the wrong person (credibility phase like the bribe):
//   admit = patience -1; deny = patience -2 and everything at half weight
// - the picks the finale marked FAILS ("built against the wrong person") start at half weight
// - METHOD / MONEY argued against the wrong person are SET ASIDE: no floor
// - both credibility phases when there was a bribe too (the arrest first)
// - Recruit gets the same phase (a consequence, not a hint)
// - the epilogue keeps the beta's line for the wrongly named person and the v13 verdict for Adaeze
const LIB = require('./v13_c_lib.cjs');
const CASE = {
  moral:{ tower:'hold', asaba:'rescue', checkpoint:'flip_driver', market_runner:'caught', arrest:'professional' },
  flags:{ fin_bodycam:true }, sealed:{ who:'adaeze', before:true },
  ev:['fin_recording', 'fin_courier_phone', 'fin_drive', 'tower_cdr', 'musa_statement', 'ransom_ledger', 'asaba_hostage'],
  lagos:{ suspect:'obi', method:'phish', money:'wallet', warrant:'signed' }, route:{ suspect:'ifeanyi', method:'route', money:'asaba', warrant:'signed' },
  warrants:{ w_cdr:'signed', w_eko:'signed' }, cert:'all',
  voice:{ suspect:'uche', method:'shield', money:'ca', picks:['fin_recording', 'fin_courier_phone', 'tower_cdr'] },
};
const PICKS = CASE.voice.picks;
module.exports = async h => {
  const C = LIB.lib(h);
  // ---- 1. admit the wrongful arrest ----
  await C.setup(CASE);
  const res = await C.resolve();
  h.assert(res.outcome === 'contested', 'wrong name + body-cam + sealed report on her = contested (beta finale)');
  await C.certify(['bodycam_eko']);
  h.assert(await C.toCourt(), 'a contested finale still goes to trial');
  let c = await C.court();
  h.assert(/Sgt\. Uche/.test(c.text) && /FAILS/.test(c.text) && (c.text.match(/SET ASIDE/g) || []).length === 2 && !/HOLDS/.test(c.text), 'pre-trial: the name FAILS; motive and money are SET ASIDE');
  const picked = c.ex.filter(x => PICKS.includes(x.id)), others = c.ex.filter(x => !PICKS.includes(x.id));
  h.assert(picked.length === 3 && picked.every(x => x.cap === 0.5), 'the three picks filed against the wrong person start at half weight');
  h.assert(others.length && others.every(x => x.cap === 1), 'everything else starts at full weight');
  h.assert((c.text.match(/Filed against the wrong person on your charge sheet/g) || []).length === 3, 'the pre-trial file says which exhibits were filed against the wrong person');
  let s = await C.step();                                            // ALL RISE
  c = await C.court();
  h.assert(c.phase === 'cred', 'the defence opens with a credibility phase');
  h.log('defence:', c.text.split('\n').find(l => /Before the prosecution/.test(l)));
  h.assert(/on this officer's word, Sgt\. Uche was arrested at HQ the next morning, in front of his own squad, as the Voice\./.test(c.text), 'the defence opens with the public arrest of Sgt. Uche (the beta\'s own line)');
  h.assert(/Which night was he right\?/.test(c.text), '…and asks which night the officer was right');
  s = await C.step('best', 'admit');
  c = await C.court();
  h.assert(c.patience === 2 && c.phase === 'ex' && /PATIENCE 2\/3/.test(c.head), 'admit: patience -1, then the exhibits');
  h.assert(/The judge writes something down/.test(c.text), 'the consequence is written on the record, not in a toast');
  const steps = await C.runTrial('best');
  const court = await h.ev(() => I().court);
  const q = await h.ev(() => Object.fromEntries(COURT.ex.map(x => [x.id, x.q])));
  h.log('q', JSON.stringify(q), 'court', JSON.stringify(court));
  h.assert(PICKS.every(id => q[id] === 0.5), 'the wrong-person picks are admitted at half weight at best');
  h.assert(q.fin_drive === 1 && q.bodycam_eko === 1, 'other exhibits keep their full weight (admit kept the case whole)');
  h.assert(steps.some(st => st.ph === 'ruling' && /Filed against the wrong person on your charge sheet: it carries half the weight/.test(st.text)), 'the ruling says why it carries half the weight');
  h.assert(court.wrong === true && court.cred.wrong === 'admit' && court.finale === 'contested', 'the record keeps the wrong name and the admission');
  h.assert(!court.adj.some(t => /holds/.test(t)), 'no right-line floor against the wrong person (set aside)');
  const epi = await h.ev(() => ({ uche:(EPI.slides.find(x => x.name === 'SGT. UCHE') || {}).text, adaeze:(EPI.slides.find(x => x.name === 'COMMANDER ADAEZE') || {}).text }));
  h.assert(/Held two days on your accusation/.test(epi.uche || ''), 'the epilogue keeps the beta line for Sgt. Uche');
  h.assert(/^(Convicted|Discharged)/.test(epi.adaeze || ''), 'and the court\'s verdict for Adaeze');

  // ---- 2. deny it: -2 and everything at half weight ----
  await C.setup(CASE);
  await C.resolve(); await C.certify(['bodycam_eko']);
  h.assert(await C.toCourt(), 'trial (deny)');
  await C.step(); await C.step('best', 'deny');
  c = await C.court();
  h.assert(c.patience === 1 && /reads out the arrest report/.test(c.text), 'deny: patience -2, and the defence reads out the arrest report');
  await C.runTrial('best');
  const q2 = await h.ev(() => COURT.ex.map(x => x.q));
  h.assert(q2.every(v => v <= 0.5), 'deny: everything now carries half weight at most');

  // ---- 3. a bribe as well: two credibility phases, the arrest first ----
  await C.setup(Object.assign({}, CASE, { moral:Object.assign({}, CASE.moral, { arrest:'bribe' }) }));
  await C.resolve(); await C.certify(['bodycam_eko']);
  h.assert(await C.toCourt(), 'trial (bribe + wrong name)');
  await C.step();
  c = await C.court(); h.assert(c.phase === 'cred' && /Sgt\. Uche/.test(c.text), 'first: the wrongful arrest');
  await C.step('best', 'admit');
  c = await C.court(); h.assert(c.phase === 'cred' && /took money from Chief Obi/.test(c.text), 'then: the Lekki money');
  await C.step('best', 'admit');
  c = await C.court(); h.assert(c.phase === 'ex' && c.patience === 1, 'two admissions: patience 1/3');

  // ---- 4. Recruit: the same consequence ----
  await C.setup(Object.assign({}, CASE, { recruit:true }));
  await C.resolve(); await C.certify(['bodycam_eko']);
  h.assert(await C.toCourt(), 'trial (Recruit)');
  await C.step();
  c = await C.court();
  h.assert(c.phase === 'cred' && /Sgt\. Uche was arrested/.test(c.text), 'Recruit faces the same credibility phase');
  h.log('PASS v13_c_trial_wrong');
};
