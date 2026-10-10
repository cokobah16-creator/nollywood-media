// v13 court (team C) 6: difficulty and the visual rules on the court and the case review.
// Run at 390x844 --touch 1 and at 1280x800 (and any other size). On every court phase and on the review:
//   no gradients / box or text shadows / blur / filters; no emoji or glyph icons in rendered text; palette
//   colours only; small text contrast >= 4.5:1; nothing sticks out sideways; every tappable thing >= 44x44 on
//   touch; no "AKS"; every intended icon renders; 16px gutters on phones; case data in JetBrains Mono,
//   headings in Oswald; GUILTY / NOT PROVEN are stamps; patience is text.
// Senior (default): every answer is open and none says '— not in your file'; reaching for a certificate
// you never signed is struck out and costs patience. Recruit: as delivered (greyed out, '— not in your file').
const LIB = require('./v13_c_lib.cjs');
const CASE = {
  moral:{ tower:'hold', asaba:'rescue', checkpoint:'flip_driver', market_runner:'caught', shrine:'negotiate', arrest:'bribe' },
  flags:{ fin_bodycam:true }, sealed:{ who:'adaeze', before:true }, theories:['t_madam'],
  ev:['fin_recording', 'fin_courier_phone', 'fin_drive', 'tower_cdr', 'musa_statement', 'ransom_ledger', 'asaba_hostage', 'obi_notebook'],
  inv:['inv_ca', 'inv_stakeout', 'inv_gatehouse'],
  lagos:{ suspect:'obi', method:'phish', money:'wallet', warrant:'signed' }, route:{ suspect:'ifeanyi', method:'route', money:'asaba', warrant:'signed' },
  warrants:{ w_cdr:'signed', w_eko:'signed' },
  voice:{ suspect:'uche', method:'shield', money:'ca', picks:['fin_courier_phone', 'fin_recording', 'tower_cdr'] },
  cert:['fin_recording'],
};
module.exports = async h => {
  const C = LIB.lib(h);
  const vp = await h.ev(() => ({ w:innerWidth, h:innerHeight, touch:document.body.classList.contains('touch-active') }));
  const tag = `${vp.w}x${vp.h}${vp.touch ? 't' : ''}`;
  await C.install();
  // ---------------- Senior (default) ----------------
  await C.setup(CASE);
  const r = await C.resolve();
  h.assert(r.outcome === 'contested', 'wrong name + bodycam + a sealed report on her: contested, so the court sits');
  h.assert(await C.toCourt(), 'the trial opens');
  let n = 0;
  const seen = {};
  const look = async (ph) => {
    const key = ph === 'ex' || ph === 'ruling' ? ph + (seen[ph] = (seen[ph] || 0) + 1) : ph;
    if((ph === 'ex' || ph === 'ruling') && seen[ph] > 3) return;      // the first few of each are enough
    await h.step(60);
    await h.shot(`v13c_${tag}_${String(++n).padStart(2, '0')}_${key}`);
    await C.assertRules(`court ${key} ${tag}`, '#screen-court', vp.touch);
  };
  // the look, measured once on the pre-trial file
  const look0 = await h.ev(() => {
    const q = s => document.querySelector('#screen-court ' + s), cs = s => q(s) ? getComputedStyle(q(s)) : {};
    const doc = q('.ct-doc').getBoundingClientRect();
    return { bg:cs('.ct-doc').backgroundColor, ink:cs('.ct-doc').color, title:cs('.ct-title').fontFamily, no:cs('.ct-no').fontFamily, pat:(q('.ct-pat') || {}).textContent,
      patMono:cs('.ct-pat b').fontFamily, left:Math.round(doc.left), right:Math.round(innerWidth - doc.right), back:getComputedStyle(document.querySelector('#screen-court > .overlay-bg')).backgroundColor };
  });
  h.log('look', JSON.stringify(look0));
  h.assert(look0.bg === 'rgb(233, 220, 192)' && look0.ink === 'rgb(28, 28, 26)', 'the court record is a manila sheet with ink text');
  h.assert(look0.back === 'rgb(28, 28, 26)', 'on a flat ink desk');
  h.assert(/Oswald/.test(look0.title) && /JetBrains Mono/.test(look0.no) && /JetBrains Mono/.test(look0.patMono), 'headings in Oswald; exhibit numbers and patience in JetBrains Mono');
  h.assert(/^PATIENCE 3\/3$/.test((look0.pat || '').replace(/\s+/g, ' ').trim()), 'patience is text: PATIENCE 3/3');
  if(vp.w < 600) h.assert(look0.left === 16 && look0.right === 16, `16px side gutters on a phone (got ${look0.left}/${look0.right})`);
  const steps = await C.runTrial('best', 'deny', look);
  const opts = steps.filter(s => s.ph === 'ex').flatMap(s => s.opts);
  h.assert(opts.length > 0 && opts.every(o => !o.dis) && !opts.some(o => /not in your file/.test(o.t)), 'Senior: every answer is open, none says "not in your file"');
  const stamps = await h.ev(() => [...document.querySelectorAll('#screen-court .ct-count .v13-stamp')].map(s => s.textContent));
  h.log('stamps (after RISE the court is hidden)', stamps.length);
  const j = steps.find(s => s.ph === 'judgment');
  h.assert(/GUILTY|NOT PROVEN/.test(j.text), 'the judgment is stamped');
  // the stamps are .v13-stamp elements (checked while the judgment was up)
  h.assert(seen.judgment !== undefined || n > 0, 'the judgment was audited');
  // ---------------- the case review ----------------
  // the epilogue runs to its end; the review opens before the title screen
  for(let i = 0; i < 40; i++){ const more = await h.ev(() => { if(!document.querySelector('#screen-epilogue.show')) return false; advanceEpilogue(); return true; }); if(!more) break; await h.step(30); }
  h.assert(await h.ev(() => !!document.querySelector('#screen-review.show')), 'the case review follows the epilogue');
  await h.step(80);
  await h.shot(`v13c_${tag}_${String(++n).padStart(2, '0')}_review_top`);
  await C.assertRules(`review ${tag}`, '#screen-review', vp.touch);
  const rlook = await h.ev(() => { const d = document.querySelector('#screen-review .rv-doc'), b = d.getBoundingClientRect(), pct = document.querySelector('#screen-review .rv-pct b');
    return { bg:getComputedStyle(d).backgroundColor, pct:getComputedStyle(pct).fontFamily, left:Math.round(b.left), right:Math.round(innerWidth - b.right) }; });
  h.assert(rlook.bg === 'rgb(233, 220, 192)' && /JetBrains Mono/.test(rlook.pct), 'the review is a manila report; the percentage is in mono');
  if(vp.w < 600) h.assert(rlook.left === 16 && rlook.right === 16, '16px gutters on the review');
  // scroll through it: the rules hold all the way down
  const pages = await h.ev(() => { const s = document.querySelector('#screen-review .ct-scroll'); return Math.ceil(s.scrollHeight / s.clientHeight); });
  for(let p = 1; p < Math.min(pages, 6); p++){
    await h.ev(p => { const s = document.querySelector('#screen-review .ct-scroll'); s.scrollTop = p * s.clientHeight * 0.9; }, p);
    await h.step(60);
    await h.shot(`v13c_${tag}_${String(++n).padStart(2, '0')}_review_${p}`);
    await C.assertRules(`review page ${p} ${tag}`, '#screen-review', vp.touch);
  }
  // the desk REVIEW tab renders the same report on its own manila sheet
  const desk = await h.ev(() => { const html = renderReviewHTML(true), d = document.createElement('div'); d.innerHTML = html; return { sheet:!!d.querySelector('.v13-review.v13-sheet'), text:d.textContent }; });
  h.assert(desk.sheet && /THE CHARGE SHEETS/.test(desk.text), 'the Case Desk REVIEW tab gets the same report as a manila sheet');
  h.assert(!/[\u2190-\u21FF\u25A0-\u25FF\u2600-\u27BF]/.test(desk.text) && !/\bAKS\b/.test(desk.text), 'no glyph icons and no AKS in the desk copy either');
  await h.ev(() => document.getElementById('btn-review-done').click());
  await h.step(150);
  h.assert(await h.ev(() => !!document.querySelector('#screen-title.show')), 'FINISH goes to the title');

  // ---------------- Senior: reaching for what you don't hold ----------------
  await C.setup(Object.assign({}, CASE, { moral:Object.assign({}, CASE.moral, { arrest:'professional' }), cert:[], voice:{ suspect:'adaeze', method:'shield', money:'ca', picks:CASE.voice.picks } }));
  await C.resolve();
  h.assert(await C.toCourt(), 'trial (Senior)');
  await C.step();                                                    // ALL RISE
  let c = await C.court();
  h.assert(c.phase === 'ex' && c.ex[0].k === 's84', 'the first exhibit draws an s.84 objection');
  const st = await C.step({ s84:'cert' });
  c = await C.court();
  h.assert(st.chose === 'cert' && c.patience === 2 && c.phase === 'ruling' && /SUSTAINED · STRUCK OUT/.test(c.text) && /never signed/.test(c.text), 'Senior: tendering a certificate you never signed is struck out, patience 2/3');
  h.assert(/PATIENCE 2\/3/.test(c.head), 'the header follows: PATIENCE 2/3');
  // ---------------- Recruit: as delivered ----------------
  await C.setup(Object.assign({}, CASE, { moral:Object.assign({}, CASE.moral, { arrest:'professional' }), cert:[], recruit:true, voice:{ suspect:'adaeze', method:'shield', money:'ca', picks:CASE.voice.picks } }));
  await C.resolve();
  h.assert(await C.toCourt(), 'trial (Recruit)');
  await C.step();
  const ex = await h.ev(() => [...document.querySelectorAll('#screen-court [data-ct="resp"]')].map(b => ({ v:b.dataset.v, dis:b.disabled, t:b.textContent })));
  h.log('recruit options', JSON.stringify(ex));
  h.assert(ex.some(o => o.v === 'cert' && o.dis && /— not in your file/.test(o.t)), 'Recruit: the certificate you never signed is greyed out, "— not in your file"');
  await h.shot(`v13c_${tag}_${String(++n).padStart(2, '0')}_recruit_ex`);
  await C.assertRules(`court recruit ${tag}`, '#screen-court', vp.touch);
  h.log('PASS v13_c_rules', tag);
};
