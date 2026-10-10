// v13 fix (court) R02: when a witness's claim scores false on your file (A8), the defence opens with what the file
// actually says — and patience still drops by 1, once.
// - "…says this witness lied to you" only when the officer filed CONTRADICTED on the claim that scores false
// - filed CORROBORATED without the proof (Senior, the default: Tobi believed straight after the rescue) → the
//   officer vouched without the proof, never "lied"; Recruit the same
// - filed HONEST MISTAKE where it is wrong → "got it wrong"; left UNVERIFIED with the proof found later → "never settles"
// - the line follows the claim that scores false, not a right CONTRADICTED filed beside it
const LIB = require('./v13_c_lib.cjs');
const BASE = {
  moral:{ tower:'cut', asaba:'rescue', checkpoint:'flip_driver', market_runner:'caught', arrest:'professional' },
  flags:{ fin_bodycam:true }, sealed:{ who:'adaeze', before:true }, theories:['t_madam'],
  ev:['fin_recording', 'fin_courier_phone', 'fin_drive', 'obi_notebook', 'musa_statement', 'asaba_hostage'],
  lagos:{ suspect:'obi', method:'phish', money:'wallet', warrant:'signed' }, route:{ suspect:'ifeanyi', method:'route', money:'asaba', warrant:'signed' },
  warrants:{ w_cdr:'signed', w_eko:'signed' }, cert:'all', leads:{ musa:'done', tobi:'done' },
  voice:{ suspect:'adaeze', method:'shield', money:'ca', picks:['fin_courier_phone', 'fin_recording', 'fin_drive'] },
};
const LIED = /says this witness lied to you/;
const LINE = {
  corroborated:/"Your own officer vouched for this witness without the proof to back it\."/,
  mistaken:/"Your own officer's file says this witness got it wrong\."/,
  unverified:/"Your own officer's file never settles what this witness told you\."/,
  contradicted:/"Your own officer's file says this witness lied to you\."/,
};
module.exports = async h => {
  const C = LIB.lib(h);
  const until = async id => {                                    // answer 'best' until the exhibit `id` is up
    let prev = null;
    for(let n = 0; n < 60; n++){
      const st = await h.ev(() => document.querySelector('#screen-court.show') ? { ph:COURT.phase, x:(COURT.ex[COURT.i] || {}).id, p:COURT.patience } : null);
      if(!st || (st.ph === 'ex' && st.x === id)) return Object.assign(st || {}, { prev });
      prev = st.p;
      await C.step('best', 'admit');
    }
    return null;
  };
  // file the verdicts (after `before` sets what is in hand), reach the trial, and read the witness's exhibit
  const trial = async (label, o, before, files, witness) => {
    await C.setup(Object.assign({}, BASE, o || {}));
    const sc = await h.ev(([before, files]) => {
      if(before) (new Function(before))();
      for(const st in files) for(const c in files[st]) intelVerdict(st, c, files[st][c]);
      const out = {};
      for(const st in files) for(const c in files[st]) out[st + '.' + c] = [intelVerdictOf(st, c).verdict, intelVerdictOf(st, c).held, intelVerdictScore(st, c)];
      return out;
    }, [before || '', files]);
    h.log(label, 'file:', JSON.stringify(sc));
    const r = await C.resolve(); h.assert(r.outcome === 'proven', label + ': proven');
    await C.certify(['bodycam_eko']);
    h.assert(await C.toCourt(), label + ': the trial opens');
    const at = await until(witness);
    h.assert(at && at.x === witness, label + ': the witness comes up');
    const c = await C.court();
    const say = (c.text.match(/"Your own officer[^"]*"/) || [''])[0];
    h.log(label, '→', say, '· patience', at.prev, '→', c.patience);
    return { c, at, sc, say };
  };

  // ---- 1. Senior: Tobi's three (true) claims filed CORROBORATED straight after the rescue, no proofs in hand ----
  let t = await trial('Tobi corroborated, no proofs', null, '', { st_tobi:{ b1:'corroborated', b2:'corroborated', b3:'corroborated' } }, 'tobi');
  h.assert(Object.values(t.sc).every(([v, held, score]) => v === 'corroborated' && !held && score === false), 'the file says CORROBORATED on all three; each scores false (no proof held)');
  h.assert(t.c.ex.find(x => x.id === 'tobi').lied === true, 'the A8 trigger still fires');
  h.assert(!LIED.test(t.c.text), 'the defence does NOT say the file calls him a liar (it says the opposite)');
  h.assert(LINE.corroborated.test(t.c.text), 'it says what the file shows: vouched for without the proof');
  h.assert(t.at.prev > 0 && t.c.patience === t.at.prev - 1, 'and the judge\'s patience still drops by 1');
  h.assert(/He is an accomplice/.test(t.c.text), 'then the usual accomplice objection');
  const again = await h.ev(() => { const p = COURT.patience; renderCourt(); return COURT.patience === p; });
  h.assert(again, 'the drop happens once');

  // ---- 2. Recruit, same filing: same honest line ----
  t = await trial('Recruit: Tobi corroborated, no proofs', { recruit:true }, '', { st_tobi:{ b1:'corroborated', b2:'corroborated', b3:'corroborated' } }, 'tobi');
  h.assert(!LIED.test(t.c.text) && LINE.corroborated.test(t.c.text), 'Recruit: vouched without the proof, not "lied"');

  // ---- 3. the careful player: b3 filed UNVERIFIED at h6 (no record yet), the C.A. record found later ----
  t = await trial('Tobi b3 unverified, proof found later', null, '', { st_tobi:{ b3:'unverified' } }, 'tobi');
  h.assert(t.c.ex.find(x => x.id === 'tobi').lied === false, 'control: unverified with no proof in hand scores right — no line');
  await C.setup(BASE);
  const late = await h.ev(() => { intelVerdict('st_tobi', 'b3', 'unverified'); I().reg.found.ca = true; return [intelHas('reg_ca'), intelVerdictScore('st_tobi', 'b3')]; });
  h.assert(late[0] === true && late[1] === false, 'the record turns up later; the unverified filing now scores false');
  await C.resolve(); await C.certify(['bodycam_eko']);
  h.assert(await C.toCourt(), 'trial (late proof)');
  let at = await until('tobi'); let c = await C.court();
  h.assert(!LIED.test(c.text) && LINE.unverified.test(c.text), 'unverified on file: "never settles", not "lied"');
  h.assert(at.prev > 0 && c.patience === at.prev - 1, 'patience −1');

  // ---- 4. Musa's true claim (u2) filed HONEST MISTAKE ----
  t = await trial('Musa u2 mistaken', null, '', { st_musa:{ u2:'mistaken' } }, 'musa_statement');
  h.assert(!LIED.test(t.c.text) && LINE.mistaken.test(t.c.text), 'honest mistake on file: "got it wrong", not "lied"');
  h.assert(t.c.patience === t.at.prev - 1, 'patience −1');

  // ---- 5. the line follows the claim that scores false: u1 rightly CONTRADICTED (proof held), u2 vouched without proof ----
  t = await trial('Musa u1 contradicted (held) + u2 corroborated (no proof)', null,
    "I().flagged.musa_ph_hotel = true; if(!intelHas('musa_ph_hotel')) throw new Error('musa_ph_hotel not in hand');",
    { st_musa:{ u1:'contradicted', u2:'corroborated' } }, 'musa_statement');
  h.assert(t.sc['st_musa.u1'][2] === true && t.sc['st_musa.u2'][2] === false, 'u1 scores right, u2 scores false');
  h.assert(!LIED.test(t.c.text) && LINE.corroborated.test(t.c.text), 'the defence speaks to u2 (vouched without proof), not to the right CONTRADICTED');

  // ---- 6. control: a true claim filed CONTRADICTED — the A8 line, word for word ----
  t = await trial('Tobi b1 contradicted', null, '', { st_tobi:{ b1:'contradicted' } }, 'tobi');
  h.assert(LINE.contradicted.test(t.c.text), 'filed CONTRADICTED: "Your own officer\'s file says this witness lied to you."');
  h.assert(t.c.patience === t.at.prev - 1, 'patience −1');
  // ...and a witness weighed right draws nothing
  t = await trial('Musa u1 contradicted (held)', null, "I().flagged.musa_ph_hotel = true;", { st_musa:{ u1:'contradicted' } }, 'musa_statement');
  h.assert(!/"Your own officer/.test(t.c.text) && t.c.ex.find(x => x.id === 'musa_statement').lied === false, 'weighed right: no line');
  h.assert(!h.errors.length, 'no page errors: ' + h.errors.join(' | '));
  h.log('PASS v13_fix_court_witness');
};
