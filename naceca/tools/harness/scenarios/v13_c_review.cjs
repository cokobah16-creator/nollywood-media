// v13 case review (team C) 5: the post-credits review reads FILED records only (design §3).
// - the three charge sheets as filed (HOLDS / FAILS / SET ASIDE), wrongful holds included; never S.game._acc
// - people: a wrongly held KC / Tobi / Uche is not "protected"; Tobi's branch is alive on 'rescue' and on
//   'chase' unless the hostage was lost
// - warrants and orders from V12.warrantState: signed (and the w_eko routing), exigent, 'none' for w_cdr,
//   pending = "never put to a magistrate"
// - the trial line: a discharge is worded as a discharge
// - locked in the Case Desk until the season is closed; no glyph icons; no AKS
const LIB = require('./v13_c_lib.cjs');
const review = h => h.ev(() => { S.game.seasonOneComplete = true; const d = document.createElement('div'); d.innerHTML = renderReviewHTML(false); return d.innerText || d.textContent; });
module.exports = async h => {
  const C = LIB.lib(h);
  // ---- 1. everything wrong that can be ----
  await C.setup({
    moral:{ tower:'hold', asaba:'chase', market_runner:'caught', checkpoint:'arrest_driver', shrine:'force' }, hostageLost:false,
    lagos:{ suspect:'kc', method:'phish', money:'transfer', warrant:'signed' },
    route:{ suspect:'tobi', method:'route', money:'asaba', warrant:'exigent' },
    warrants:{ w_cdr:'none', w_eko:'signed', w_eko_route:'commander' },
    voice:{ suspect:'uche', method:'shield', money:'pos', picks:[] },
  });
  await h.ev(() => { S.game._acc = { who:'adaeze', picks:[] }; I().court = { w:{}, proven:[], admitted:[], struck:['fin_drive'], cred:{ wrong:'deny' }, finale:'contested', wrong:true, adj:[] }; });
  const s = await review(h);
  const has = (re, msg) => h.assert(re.test(s), msg + '  [' + re + ']');
  const hasnt = (re, msg) => h.assert(!re.test(s), msg + '  [' + re + ']');
  has(/THE CHARGE SHEETS/, 'a charge-sheet section');
  has(/LAGOS[\s\S]*SUSPECT\s*KC\s*FAILS/, 'Lagos: KC, FAILS');
  has(/MONEY TRAIL\s*Direct transfers to Chief Obi\s*FAILS/, 'Lagos: the wrong money line FAILS');
  has(/KC was held as "the ringleader" on your charge sheet and released without charge\./, 'the beta\'s own wrongful-hold line for KC');
  has(/THE ROUTE[\s\S]*SUSPECT\s*Tobi Onuoha\s*FAILS/, 'Route: Tobi, FAILS');
  has(/THE VOICE[\s\S]*SUSPECT\s*Sgt\. Uche\s*FAILS[\s\S]*Shielded the ring, silenced a witness\s*SET ASIDE[\s\S]*Ransom through Ikeja POS agents\s*FAILS/, 'Voice: the name FAILS, a right motive is SET ASIDE, a wrong money line FAILS');
  has(/On your word, Sgt\. Uche was arrested at HQ/, 'the public arrest is on the record');
  hasnt(/named her/, 'the per-run copy (S.game._acc = adaeze) is ignored');
  hasnt(/KC was treated fairly/, 'a wrongly charged KC was not treated fairly');
  has(/KC was named "the ringleader" on your Lagos charge sheet/, 'PEOPLE: KC is listed as wrongly named');
  has(/Sgt\. Uche carried Tobi out of the smoke while you went after the fixer/, 'chase branch, hostage not lost: Tobi is alive');
  hasnt(/Tobi did not make it out of Asaba/, 'and not dead');
  has(/Then your route charge sheet named Tobi the principal\. He was held until noon\./, 'and wrongly held on the route sheet');
  has(/Sgt\. Uche was arrested in public as the Voice, on your word\./, 'Uche is not protected');
  has(/Search warrant — Lekki, Old GRA: signed\./, 'Lekki: signed (from the beta record)');
  has(/Search warrant — Asaba riverside: none — you went in on exigency\./, 'Asaba: exigent');
  has(/Production order — Ugbowo cell records: none — you went to the cabinet without one\./, 'w_cdr: none');
  has(/Search & arrest warrant — Ekosodin: signed — carried through the Commander's office\./, 'w_eko: signed, through her office');
  has(/The court discharged her on a no-case submission\./, 'a discharge is worded as a discharge');
  hasnt(/guilty on 0 of four/i, 'never "guilty on 0 of four counts"');
  has(/insisted the wrongful arrest was justified/, 'what you said about the arrest in court');
  hasnt(/never applied|missed/, 'no stale v13 warrant words');
  hasnt(/\bAKS\b/, 'no AKS');
  h.assert(!/[\u2190-\u21FF\u2300-\u23FF\u25A0-\u25FF\u2600-\u27BF\u{1F000}-\u{1FAFF}]/u.test(s), 'no glyph icons or emoji in the review text');
  // the epilogue agrees with the review: on the chase branch Tobi came out alive (and was held on the sheet)
  const tobi1 = await h.ev(() => (epilogueSlides().find(x => x.name === 'TOBI ONUOHA') || {}).text);
  h.assert(/^Sgt\. Uche carried Tobi out of the Asaba smoke, and your charge sheet held him until noon/.test(tobi1 || ''), 'epilogue (chase, alive, wrongly named): ' + tobi1);

  // ---- 2. everything right ----
  await C.setup({
    moral:{ tower:'hold', asaba:'rescue', market_runner:'caught', checkpoint:'flip_driver', shrine:'negotiate' },
    lagos:{ suspect:'obi', method:'phish', money:'wallet', warrant:'signed' },
    route:{ suspect:'ifeanyi', method:'route', money:'asaba', warrant:'signed' },
    warrants:{ w_cdr:'signed', w_eko:'signed', w_eko_route:'zonal' },
    voice:{ suspect:'adaeze', method:'shield', money:'ca', picks:[] },
  });
  await h.ev(() => { I().court = { w:{}, proven:['c1', 'c2', 'c3', 'c4'], admitted:[], struck:[], cred:{}, finale:'proven', wrong:false, adj:[] }; });
  const s2 = await review(h);
  h.assert(!/FAILS|SET ASIDE/.test(s2) && (s2.match(/HOLDS/g) || []).length === 9, 'all nine lines hold');
  h.assert(/KC was treated fairly\./.test(s2) && /You carried Tobi out of the smoke\./.test(s2), 'KC treated fairly; you carried Tobi out');
  h.assert(!/arrested in public|wrongly|on your charge sheet/.test(s2), 'no wrongful-hold lines');
  h.assert(/Ekosodin: signed — taken straight to Benin Zonal Command\./.test(s2), 'w_eko through Zonal');
  h.assert(/The court found her guilty on all four counts\./.test(s2), 'the trial line');

  // ---- 3. Tobi lost in the chase; warrants never put to a magistrate; no finale sheet ----
  await C.setup({ moral:{ asaba:'chase', market_runner:'escaped' }, hostageLost:true, lagos:{ suspect:'obi', method:'phish', money:'wallet', warrant:'pending' }, warrants:{} });
  const s3 = await review(h);
  h.assert(/Tobi did not make it out of Asaba\./.test(s3), 'chase with the hostage lost: Tobi died');
  const tobi3 = await h.ev(() => (epilogueSlides().find(x => x.name === 'TOBI ONUOHA') || {}).text);
  h.assert(/^Tobi did not live to read the drive/.test(tobi3 || ''), 'and the epilogue keeps the base line for a lost hostage');
  h.assert(/KC got away/.test(s3), 'KC escaped');
  h.assert(/Search warrant — Lekki, Old GRA: never put to a magistrate\./.test(s3), 'a filed sheet with no decision: never put to a magistrate');
  h.assert(/Search warrant — Asaba riverside: never put to a magistrate — no charge sheet was filed\./.test(s3), 'no route sheet at all');
  h.assert(/Production order — Ugbowo cell records: never put to a magistrate\./.test(s3) && /Ekosodin: never put to a magistrate\./.test(s3), 'pending v13 orders');
  h.assert(/THE VOICE\s*No charge sheet was filed\./.test(s3), 'no finale sheet');

  // ---- 4. the Case Desk tab: locked until the season closes, then the same report ----
  const desk = await h.ev(() => { S.game.seasonOneComplete = false; const a = renderReviewHTML(true); S.game.seasonOneComplete = true; const b = renderReviewHTML(true); return { a, b }; });
  h.assert(/opens when the season is closed/.test(desk.a) && !/CHARGE SHEETS/.test(desk.a), 'the desk review is locked mid-season (no answers shown before the end)');
  h.assert(/class="v13-review v13-sheet"/.test(desk.b) && /THE CHARGE SHEETS/.test(desk.b), 'post-season the desk gets the report on a manila sheet');
  h.log('PASS v13_c_review');
};
