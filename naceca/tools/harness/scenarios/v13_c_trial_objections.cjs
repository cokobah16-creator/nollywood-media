// v13 court (team C) 4: the defence says the true reason.
// - bribe-tainted Lekki exhibit (F040): a 'tainted' objection with its own answers (argue it would have been
//   found anyway at a patience cost, or withdraw) — never 'No objection' followed by a silent withdrawal
// - beta-contested exhibits get an honest objection: a wrong Lagos MONEY line contests Obi's notebook
//   ("your own charge sheet put this money somewhere else"); a field check gone wrong keeps the field text
// - statements (A8): if any of a witness's claims scores false on your file, the defence first says
//   "Your own officer's file says this witness lied to you" and patience drops by 1 (Musa; Tobi);
//   a witness whose claims you weighed correctly draws no such line
const LIB = require('./v13_c_lib.cjs');
const BASE = {
  moral:{ tower:'cut', asaba:'rescue', checkpoint:'flip_driver', market_runner:'caught', arrest:'professional' },
  flags:{ fin_bodycam:true }, sealed:{ who:'adaeze', before:true }, theories:['t_madam'],
  ev:['fin_recording', 'fin_courier_phone', 'fin_drive', 'obi_notebook', 'musa_statement', 'asaba_hostage'],
  lagos:{ suspect:'obi', method:'phish', money:'wallet', warrant:'signed' }, route:{ suspect:'ifeanyi', method:'route', money:'asaba', warrant:'signed' },
  warrants:{ w_cdr:'signed', w_eko:'signed' }, cert:'all', leads:{ musa:'done', tobi:'done' },
  voice:{ suspect:'adaeze', method:'shield', money:'ca', picks:['fin_courier_phone', 'fin_recording', 'fin_drive'] },
};
const until = async (C, h, id) => {                              // answer 'best' until the exhibit `id` is up
  let prev = null;                                               // the patience just before the exhibit came up
  for(let n = 0; n < 60; n++){
    const st = await h.ev(() => document.querySelector('#screen-court.show') ? { ph:COURT.phase, x:(COURT.ex[COURT.i] || {}).id, p:COURT.patience } : null);
    if(!st || (st.ph === 'ex' && st.x === id)) return Object.assign(st || {}, { prev });
    prev = st.p;
    await C.step('best', 'admit');
  }
  return null;
};
module.exports = async h => {
  const C = LIB.lib(h);
  // ---- 1. the bribe: Obi's notebook is tainted ----
  await C.setup(Object.assign({}, BASE, { moral:Object.assign({}, BASE.moral, { arrest:'bribe' }) }));
  await C.resolve(); await C.certify(['bodycam_eko']);
  h.assert(await C.toCourt(), 'trial (bribe)');
  let c = await C.court();
  h.assert(c.ex.find(x => x.id === 'obi_notebook').k === 'tainted', 'the bribe taints the Lekki notebook');
  h.assert(/Weak point: Recovered where the officer took a bribe/.test(c.text), 'pre-trial: the weak point is named');
  await until(C, h, 'obi_notebook');
  c = await C.court();
  h.assert(/took money in that very house/.test(c.text) && !/No objection/.test(c.text), 'the defence objects to the tainted exhibit (no "No objection")');
  h.assert(/Argue it would have been found in the search anyway/.test(c.text) && /Withdraw the exhibit/.test(c.text), 'two honest answers: independent discovery, or withdraw');
  const p0 = c.patience;
  await C.step({ tainted:'independent' });
  c = await C.court();
  h.assert(c.patience === Math.max(0, p0 - 1) && /ADMITTED · REDUCED WEIGHT/.test(c.text) && /would have been found in the search anyway/.test(c.text), 'independent discovery: admitted at reduced weight, at a patience cost');
  h.assert(!/Withdrawn\. The prosecution moves on/.test(c.text), 'not silently withdrawn');

  // ---- 2. a wrong Lagos MONEY line contests the notebook: the defence says so ----
  await C.setup(Object.assign({}, BASE, { lagos:{ suspect:'obi', method:'phish', money:'transfer', warrant:'signed' } }));
  const evq = await h.ev(() => V12.evQ('obi_notebook'));
  h.assert(evq === 'weak', 'the beta contested the notebook at settlement');
  await C.resolve(); await C.certify(['bodycam_eko']);
  h.assert(await C.toCourt(), 'trial (wrong money line)');
  c = await C.court();
  const nb = c.ex.find(x => x.id === 'obi_notebook');
  h.assert(nb.k === 'contested' && nb.why === 'money', 'contested because of the charge sheet\'s money line');
  h.assert(/Contested: your charge sheet put the money elsewhere/.test(c.text), 'pre-trial says why it is contested');
  await until(C, h, 'obi_notebook');
  c = await C.court();
  h.assert(/Your own charge sheet put this money somewhere else/.test(c.text) && !/botched this check in the field/.test(c.text), 'the honest objection, not "botched in the field"');
  await C.step({ contested:'explain' });
  c = await C.court();
  h.assert(/concedes its charge sheet was wrong/.test(c.text), 'the honest answer concedes the sheet');

  // ---- 3. a field check gone wrong keeps the field text ----
  await C.setup(Object.assign({}, BASE, { moral:Object.assign({}, BASE.moral, { checkpoint:'arrest_driver' }), ev:BASE.ev.filter(id => id !== 'musa_statement') }));
  await h.ev(() => { S.game.evQ = S.game.evQ || {}; S.game.evQ.fin_drive = 'weak'; });
  await C.resolve(); await C.certify(['bodycam_eko']);
  h.assert(await C.toCourt(), 'trial (field-contested drive)');
  c = await C.court();
  const dr = c.ex.find(x => x.id === 'fin_drive');
  h.assert(dr.k === 'contested' && dr.why === 'field', 'contested in the field');
  await until(C, h, 'fin_drive');
  c = await C.court();
  h.assert(/botched this check in the field/.test(c.text), 'the field objection');

  // ---- 4. statements on file: Musa's claim weighed wrong, Tobi's weighed right ----
  await C.setup(Object.assign({}, BASE, { verdicts:{ st_musa:{ u2:'contradicted' }, st_tobi:{ b3:'unverified' } } }));
  const sc = await h.ev(() => typeof intelVerdictScore === 'function' ? [intelVerdictScore('st_musa', 'u2'), intelVerdictScore('st_tobi', 'b3')] : null);
  h.log('intelVerdictScore', JSON.stringify(sc));
  await C.resolve(); await C.certify(['bodycam_eko']);
  h.assert(await C.toCourt(), 'trial (statements)');
  c = await C.court();
  h.assert(c.ex.find(x => x.id === 'musa_statement').lied === true, 'Musa: a claim on your file scores false');
  h.assert(c.ex.find(x => x.id === 'tobi').lied === false, 'Tobi: nothing on your file scores false (an unverified claim you could not settle)');
  await until(C, h, 'tobi');
  c = await C.court();
  h.assert(!/says this witness lied to you/.test(c.text), 'no "lied" line for Tobi');
  const at = await until(C, h, 'musa_statement');
  c = await C.court();
  h.log('patience before / at Musa', at.prev, c.patience);
  h.assert(/"Your own officer's file says this witness lied to you\."/.test(c.text), 'the defence starts with your own file');
  h.assert(at.prev > 0 && c.patience === at.prev - 1, 'and the judge\'s patience drops by 1');
  h.assert(/promised leniency/.test(c.text), 'then the usual objection (inducement)');
  // re-rendering the same exhibit does not charge again
  const again = await h.ev(() => { const p = COURT.patience; renderCourt(); return COURT.patience === p; });
  h.assert(again, 'the drop happens once');

  // ---- 5. Tobi's own claim weighed wrong ----
  await C.setup(Object.assign({}, BASE, { verdicts:{ st_tobi:{ b1:'contradicted' } } }));
  await C.resolve(); await C.certify(['bodycam_eko']);
  h.assert(await C.toCourt(), 'trial (Tobi)');
  await until(C, h, 'tobi');
  c = await C.court();
  h.assert(/says this witness lied to you/.test(c.text) && /He is an accomplice/.test(c.text), 'Tobi: your file first, then the accomplice objection');
  h.log('PASS v13_c_trial_objections');
};
