// v13 court (team C) 1: the right name on the finale charge sheet goes to trial, and the sheet counts there.
// - the m8 aftermath says the trial comes before the epilogue
// - pre-trial: the finale charge sheet as it stands (THE VOICE / METHOD / MONEY TRAIL, HOLDS), the exhibits,
//   s.84 status; signed warrants raise no warrant objection
// - floor (design §3): a proven finale with all three voice lines right can't end in discharge on s.84 paperwork
//   alone: withdraw every exhibit and Count 1 still stands; the right METHOD / MONEY lines are a small floor
// - a careful prosecutor (certified, best answers) convicts on all four counts; the epilogue line follows
// - wrong METHOD and MONEY lines lower Counts 2/4 and 3 (a contested finale, same exhibits)
const LIB = require('./v13_c_lib.cjs');
const CASE = {
  moral:{ tower:'hold', asaba:'rescue', checkpoint:'flip_driver', market_runner:'caught', shrine:'negotiate' },
  flags:{ fin_bodycam:true }, sealed:{ who:'adaeze', before:true },
  ev:['fin_recording', 'fin_courier_phone', 'fin_drive', 'tower_cdr', 'tower_fix', 'musa_statement', 'ransom_ledger', 'asaba_hostage'],
  lagos:{ suspect:'obi', method:'phish', money:'wallet', warrant:'signed' }, route:{ suspect:'ifeanyi', method:'route', money:'asaba', warrant:'signed' },
  warrants:{ w_cdr:'signed', w_eko:'signed', w_eko_route:'zonal' },
  voice:{ suspect:'adaeze', method:'shield', money:'ca', picks:['fin_courier_phone', 'fin_recording', 'tower_cdr'] },
};
module.exports = async h => {
  const C = LIB.lib(h);
  // ---- 1. proven, all three lines right; the prosecutor withdraws everything ----
  await C.setup(CASE);
  let r = await C.resolve();
  h.log('outcome', r.outcome, '|', r.next);
  h.assert(r.outcome === 'proven' && r.aftermath, 'a proven finale reaches the aftermath');
  h.assert(/Continue to the trial, then the epilogue/.test(r.next) && !/Continue for the epilogue/.test(r.next), 'the m8 aftermath says the trial comes first');
  h.assert(await C.toCourt(), 'CONTINUE opens the trial');
  let c = await C.court();
  h.log('exhibits', JSON.stringify(c.ex.map(x => x.id + ':' + x.k)));
  h.assert(/PATIENCE 3\/3/.test(c.head), 'patience is printed as text: PATIENCE 3/3');
  h.assert(/YOUR CHARGE SHEET · THE VOICE/.test(c.text) && (c.text.match(/HOLDS/g) || []).length === 3 && !/FAILS/.test(c.text), 'the pre-trial file shows the finale charge sheet: three lines that hold');
  h.assert(/Cdr\. Adaeze/.test(c.text) && /Shielded the ring/.test(c.text), 'the sheet names who and how, as filed');
  h.assert(!c.ex.some(x => x.k === 'warrantless' || x.k === 'noorder'), 'signed warrants: no warrant objection on any exhibit');
  h.assert(c.ex.every(x => x.cap === 1), 'right name: no exhibit starts at half weight');
  h.assert(c.ex.some(x => x.id === 'tobi' && x.k === 'accomplice'), 'Tobi (rescued) testifies');
  h.assert(/NO S\.84 CERTIFICATE|SIGN s\.84/.test(c.text), 'certificate status is in the prosecutor\'s file');
  h.assert(!/DPP/.test(c.text) && /NACECA Legal files tomorrow/.test(c.text), 'NACECA prosecutes through its own legal department');
  let steps = await C.runTrial('withdraw');
  const court1 = await h.ev(() => I().court);
  h.log('withdraw-all court', JSON.stringify(court1));
  h.assert(court1 && JSON.stringify(court1.admitted) === '["ransom_ledger"]', 'only the exhibit nobody objected to is admitted');
  h.assert(court1.proven.includes('c1') && court1.proven.length === 1 && court1.w.c1 === 2, 'Count 1 stands on the floor (proven, all three lines right) with no exhibit behind it, nothing else');
  h.assert(court1.finale === 'proven' && court1.wrong === false, 'the verdict records which finale it judged');
  h.assert(court1.w.c4 === 0.5 && court1.w.c2 === 1.5 && court1.w.c3 === 1.5, 'right METHOD / MONEY lines: a small floor (+0.5) on Counts 2, 4 and 3, short of a conviction');
  const judg = steps.find(s => s.ph === 'judgment');
  h.assert(judg && /GUILTY/.test(judg.text) && /NOT PROVEN/.test(judg.text) && /main count stands/.test(judg.text), 'the judgment shows the stamps and why Count 1 stands');
  h.assert(/Guilty on one count/.test(judg.text), 'verdict text for one count');
  let epi = await h.ev(() => ({ shown:!!document.querySelector('#screen-epilogue.show'), adaeze:(EPI.slides.find(s => s.name === 'COMMANDER ADAEZE') || {}).text }));
  h.assert(epi.shown && /^Convicted on one count, acquitted on three/.test(epi.adaeze || ''), 'RISE goes to the epilogue, and her line carries this verdict');

  // ---- 2. a careful prosecutor: every exhibit certified, the best answer each time ----
  await C.setup(Object.assign({}, CASE, { cert:'all', inv:[] }));
  r = await C.resolve();
  await C.certify(['bodycam_eko']);
  h.assert(await C.toCourt(), 'the trial opens again on a fresh run');
  steps = await C.runTrial('best');
  const court2 = await h.ev(() => I().court);
  h.log('best court', JSON.stringify(court2.w), court2.proven);
  h.assert(court2.proven.length === 4 && court2.struck.length === 0, 'certified and answered well: guilty on all four counts, nothing struck');
  const rulings = steps.filter(s => s.ph === 'ruling').map(s => s.text);
  h.assert(rulings.length && rulings.every(t => !/Admitted\.\s*Admitted/.test(t)), 'no duplicated "Admitted. Admitted" ruling text');
  h.assert(rulings.some(t => /EXHIBIT P1/.test(t)), 'admitted exhibits are marked P1, P2…');
  epi = await h.ev(() => (EPI.slides.find(s => s.name === 'COMMANDER ADAEZE') || {}).text);
  h.assert(/^Convicted on all four counts/.test(epi || ''), 'epilogue: convicted on all four counts');
  const ach = await h.ev(() => (S.achievements || S.game.achievements || null));
  h.log('achievements', JSON.stringify(ach));

  // ---- 3. wrong METHOD and MONEY lines (contested finale): the defence takes them apart ----
  await C.setup(Object.assign({}, CASE, { cert:'all', sealed:null, voice:{ suspect:'adaeze', method:'ransom', money:'pos', picks:CASE.voice.picks } }));
  r = await C.resolve();
  h.assert(r.outcome === 'contested', 'two wrong lines (and no sealed report) leave a contested case (beta finale)');
  await C.certify(['bodycam_eko']);
  h.assert(await C.toCourt(), 'a contested finale goes to trial');
  c = await C.court();
  h.assert((c.text.match(/FAILS/g) || []).length === 2 && /HOLDS/.test(c.text), 'pre-trial: two lines fail, the name holds');
  steps = await C.runTrial('best');
  const court3 = await h.ev(() => I().court);
  h.log('wrong-lines court', JSON.stringify(court3.w));
  h.assert(Math.abs(court3.w.c2 - (court2.w.c2 - 0.5 - 1)) < 1e-9 && Math.abs(court3.w.c4 - (court2.w.c4 - 0.5 - 1)) < 1e-9, 'a wrong METHOD line: Counts 2 and 4 lose 1 (and the right-line floor)');
  h.assert(Math.abs(court3.w.c3 - (court2.w.c3 - 0.5 - 1)) < 1e-9, 'a wrong MONEY line: Count 3 loses 1 (and the right-line floor)');
  h.assert(Math.abs(court3.w.c1 - court2.w.c1) < 1e-9, 'Count 1 is not touched by the motive or the money');
  const j3 = steps.find(s => s.ph === 'judgment');
  h.assert(/Motive on your charge sheet fails/.test(j3.text) && /Money trail on your charge sheet fails/.test(j3.text), 'the judgment says why');
  h.log('PASS v13_c_trial_right');
};
