// v13 court (team C) 3: warrant objections come from V12.warrantState (design §1/§3, A5, A6).
// - w_eko 'exigent' (went in without the Ekosodin warrant): every m8 exhibit draws 'warrantless'; the
//   exigency answer (ss.14–15, "a student held inside that house") admits it in full — lawful, but tested
// - w_lekki 'exigent': Obi's notebook draws 'warrantless'; the exigency answer admits it at reduced weight
// - w_cdr 'none' (went to the cabinet without the production order): the tower data and the Engineer's log
//   draw 'no court order'; ss.14–15 admits at reduced weight; insisting no order was needed is struck out
// - signed warrants, and 'pending' ones (never put to a magistrate), raise no warrant objection at all
const LIB = require('./v13_c_lib.cjs');
const BASE = {
  moral:{ tower:'hold', asaba:'rescue', checkpoint:'flip_driver', market_runner:'caught', arrest:'professional' },
  flags:{ fin_bodycam:true }, sealed:{ who:'adaeze', before:true }, theories:['t_madam'],
  ev:['fin_recording', 'fin_courier_phone', 'fin_drive', 'tower_cdr', 'obi_notebook', 'ransom_ledger'],
  inv:['inv_engineer'],
  route:{ suspect:'ifeanyi', method:'route', money:'asaba', warrant:'signed' },
  voice:{ suspect:'adaeze', method:'shield', money:'ca', picks:['fin_courier_phone', 'fin_recording', 'tower_cdr'] }, cert:'all',
};
const M8 = ['fin_recording', 'fin_courier_phone', 'fin_drive', 'bodycam_eko'];
module.exports = async h => {
  const C = LIB.lib(h);
  // ---- 1. Ekosodin on exigency, Lekki on exigency, no production order ----
  await C.setup(Object.assign({}, BASE, { lagos:{ suspect:'obi', method:'phish', money:'wallet', warrant:'exigent' }, warrants:{ w_cdr:'none', w_eko:'exigent' } }));
  const ws = await h.ev(() => typeof V12.warrantState === 'function' ? ['w_lekki', 'w_cdr', 'w_eko'].map(id => V12.warrantState(id).status) : null);
  h.log('warrantState', JSON.stringify(ws));
  if(ws) h.assert(JSON.stringify(ws) === '["exigent","none","exigent"]', 'the model reads the same records');
  await C.resolve();
  await C.certify(['bodycam_eko']);
  h.assert(await C.toCourt(), 'trial');
  let c = await C.court();
  const k = Object.fromEntries(c.ex.map(x => [x.id, x.k]));
  h.log('objections', JSON.stringify(k));
  h.assert(M8.every(id => k[id] === 'warrantless'), 'w_eko exigent: every m8 exhibit draws "warrantless"');
  h.assert(k.obi_notebook === 'warrantless', 'w_lekki exigent: Obi\'s notebook draws "warrantless"');
  h.assert(k.tower_cdr === 'noorder' && k.inv_engineer === 'noorder', 'w_cdr none: the tower data and the Engineer\'s log draw "no court order"');
  h.assert(k.ransom_ledger === 'none', 'the m4 ledger was never a warrant question');
  h.assert(/No warrant: taken under exigent circumstances/.test(c.text) && /No production order/.test(c.text), 'the pre-trial file names the weak points');
  await C.step();                                                    // ALL RISE
  const seen = {};
  for(let n = 0; n < 80; n++){
    const st = await h.ev(() => document.querySelector('#screen-court.show') ? { ph:COURT.phase, x:COURT.ex[COURT.i] && COURT.ex[COURT.i].id, text:document.getElementById('court-body').innerText, opts:[...document.querySelectorAll('#screen-court [data-ct="resp"]')].map(b => b.textContent) } : null);
    if(!st) break;
    if(st.ph === 'ex') seen[st.x] = { say:st.text, opts:st.opts };
    // deny once (the Engineer's log), the exigency answer everywhere else
    const r = await C.step(st.ph === 'ex' && st.x === 'inv_engineer' ? { noorder:'deny' } : 'best');
    if(st.ph === 'ex') seen[st.x].ruling = r.ruling;
    if(st.ph === 'judgment') break;
  }
  const q = await h.ev(() => Object.fromEntries(COURT.ex.map(x => [x.id, x.q])));
  h.log('q', JSON.stringify(q));
  h.assert(/wrote "exigent circumstances" on his own file/.test(seen.fin_drive.say), 'the defence: seized without a warrant, exigent on his own file');
  h.assert(seen.fin_drive.opts.some(o => /sections 14 and 15 — exigent circumstances: a student held inside that house/.test(o)), 'Ekosodin: the exigency answer, under ss.14–15');
  h.assert(M8.every(id => q[id] === 1) && /The entry was lawful/.test(seen.fin_drive.ruling), 'a student was inside: lawful, admitted in full');
  h.assert(seen.obi_notebook.opts.some(o => /a child in the house and the drives being wiped/.test(o)) && q.obi_notebook === 0.5, 'Lekki: the exigency answer admits at reduced weight');
  h.assert(seen.tower_cdr.opts.some(o => /sections 14 and 15/.test(o)) && q.tower_cdr === 0.5 && /without a court order/.test(seen.tower_cdr.say), 'no court order: ss.14–15 admits the tower data at reduced weight');
  h.assert(q.inv_engineer === 0 && /An order was plainly required/.test(seen.inv_engineer.ruling), 'insisting no order was needed is struck out');

  // ---- 2. every warrant signed ----
  await C.setup(Object.assign({}, BASE, { lagos:{ suspect:'obi', method:'phish', money:'wallet', warrant:'signed' }, warrants:{ w_cdr:'signed', w_eko:'signed' } }));
  await C.resolve(); await C.certify(['bodycam_eko']);
  h.assert(await C.toCourt(), 'trial (signed)');
  c = await C.court();
  h.assert(!c.ex.some(x => x.k === 'warrantless' || x.k === 'noorder'), 'signed: no warrant objection anywhere');

  // ---- 3. never put to a magistrate ('pending'): no objection either ----
  await C.setup(Object.assign({}, BASE, { lagos:{ suspect:'obi', method:'phish', money:'wallet', warrant:'pending' }, warrants:{} }));
  const ws3 = await h.ev(() => typeof V12.warrantState === 'function' ? ['w_lekki', 'w_cdr', 'w_eko'].map(id => V12.warrantState(id).status) : null);
  if(ws3) h.assert(ws3.every(s => s === 'pending'), 'pending everywhere');
  await C.resolve(); await C.certify(['bodycam_eko']);
  h.assert(await C.toCourt(), 'trial (pending)');
  c = await C.court();
  h.log('pending objections', JSON.stringify(c.ex.map(x => x.id + ':' + x.k)));
  h.assert(!c.ex.some(x => x.k === 'warrantless' || x.k === 'noorder'), 'pending: no warrant objection');
  h.log('PASS v13_c_trial_exigent');
};
