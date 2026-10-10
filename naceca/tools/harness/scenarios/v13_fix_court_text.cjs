// v13 fix (court) R15, R18, R12 (court text):
// - R15: no regex lookbehind anywhere in the page's scripts (Safari < 16.4 rejects one at parse time and the whole
//   v13_court.js would vanish: no trial, no review); the defence's arrest line still cuts the beta's held line after
//   its first sentence, an honorific's dot ("Sgt. Uche") not ending it — the same cut the lookbehind made
// - R18: the review's PEOPLE YOU PROTECTED line for a wrongly named Voice follows the beta's held line: Obi (in
//   custody since Lekki) and Ifeanyi were charged as the Voice, never "arrested in public"; the officers and the
//   engineer were arrested in front of their own people
// - R12 (court text): the pre-trial promise "Digital Forensics can still certify the Ekosodin material — N items"
//   appears only when an exhibit below has a SIGN button, and N never exceeds what can still be signed
const LIB = require('./v13_c_lib.cjs');
const BASE = {
  moral:{ tower:'cut', asaba:'chase', checkpoint:'flip_driver', market_runner:'caught', arrest:'professional' },
  flags:{ fin_bodycam:true }, sealed:{ who:'adaeze', before:true }, hostageLost:false,
  ev:['fin_recording', 'fin_courier_phone', 'fin_drive'],
  lagos:{ suspect:'obi', method:'phish', money:'wallet', warrant:'signed' }, route:{ suspect:'ifeanyi', method:'route', money:'asaba', warrant:'signed' },
  warrants:{ w_cdr:'signed', w_eko:'signed' }, cert:'all',
  voice:{ suspect:'adaeze', method:'shield', money:'ca', picks:['fin_courier_phone', 'fin_recording', 'fin_drive'] },
};
// the cut the shipped lookbehind made, run here in Node (which has lookbehind), to compare against the page's
const OLD_CUT = s => s.split(/(?<!\b(?:Sgt|Engr|Insp|Cdr|Dr|Mr|Mrs|Barr))\.\s+/)[0];
module.exports = async h => {
  const C = LIB.lib(h);

  // ---- R15: no lookbehind in any script the page runs ----
  const lb = await h.ev(() => [...document.scripts].map((s, i) => ({ i, n:(s.textContent.match(/\(\?<[=!]/g) || []).length, at:(s.textContent.match(/.{0,50}\(\?<[=!].{0,30}/) || [''])[0] })).filter(x => x.n));
  h.log('lookbehind in scripts:', JSON.stringify(lb));
  h.assert(!lb.length, 'no regex lookbehind in any page script (Safari < 16.4 cannot parse one)');
  h.assert(await h.ev(() => typeof openCourt === 'function' && typeof openReview === 'function' && typeof courtDoneFor === 'function'), 'the court and the review are loaded');
  // the same first sentence as before, for every beta held line and a few hard cases
  await C.setup(BASE);
  const held = await h.ev(() => Object.values((CW.CASES.voice || {}).held || {}).map(v => typeof v === 'function' ? v() : v).filter(Boolean));
  const hard = ['On your word, Sgt. Uche was arrested. Then Dr. Obi spoke.', 'Mrs. Ehigie met Mr. Okon. Barr. Fadeyi objected. Insp. Chidi left.', 'Cdr. Adaeze. Engr. Osaro.', 'No dot here', 'One. Two.'];
  const cut = await h.ev(xs => xs.map(x => ctFirstSentence(x)), held.concat(hard));
  held.concat(hard).forEach((x, i) => h.assert(cut[i] === OLD_CUT(x), `same cut as the lookbehind: ${JSON.stringify(x)} → ${JSON.stringify(cut[i])}`));
  // ...and in the defence's mouth, for each wrongly named Voice
  const cred = await h.ev(() => {
    const out = {};
    for(const who of ['uche', 'osaro', 'obi', 'ifeanyi', 'chidi']){
      S.game.accusations.voice = { suspect:who, method:'shield', money:'ca', ok:{ suspect:false, method:true, money:true }, picks:[], at:'m8' };
      ensureCourt(); Object.assign(COURT, { phase:'cred', creds:['wrong'], ci:0 }); renderCourt();
      out[who] = (document.querySelector('#court-body .ct-say') || {}).textContent || '';
    }
    COURT.phase = 'pre';
    return out;
  });
  h.log('the defence opens:', JSON.stringify(cred, null, 1));
  h.assert(/My Lord: on this officer's word, Sgt\. Uche was arrested at HQ the next morning, in front of his own squad, as the Voice\. Now/.test(cred.uche), 'Uche: the whole held sentence, "Sgt." not cut');
  h.assert(/on this officer's word, Engr\. Osaro was arrested at the Ugbowo mast, in front of his crew, as the Voice\./.test(cred.osaro), 'Osaro: "Engr." not cut');
  h.assert(/on this officer's word, Insp\. Chidi was arrested at the Bypass checkpoint, in front of his men, as the Voice\./.test(cred.chidi), 'Chidi: "Insp." not cut');
  h.assert(/on this officer's word, Chief Obi was charged again from his cell, as the Voice\. Now/.test(cred.obi) && !/stunt/.test(cred.obi), 'Obi: the first sentence only');
  h.assert(/on this officer's word, Ifeanyi was charged as the Voice\. Now/.test(cred.ifeanyi) && !/papers/.test(cred.ifeanyi), 'Ifeanyi: the first sentence only');

  // ---- R18: the review follows the held line ----
  const rv = await h.ev(() => {
    const out = {};
    for(const who of ['obi', 'ifeanyi', 'uche', 'osaro', 'chidi']) for(const asaba of ['chase', 'rescue']){
      S.game.moralChoices = Object.assign({}, S.game.moralChoices, { asaba, finale:'contested' });
      S.game._asabaHostageLost = false;
      S.game.accusations.voice = { suspect:who, method:'shield', money:'ca', ok:{ suspect:false, method:true, money:true }, picks:[], at:'m8' };
      S.game.seasonOneComplete = true;
      const div = document.createElement('div'); div.innerHTML = renderReviewHTML(false);
      const lines = [...div.querySelectorAll('.rv-line')].map(p => p.textContent.trim());
      out[who + '/' + asaba] = { voice:lines.filter(t => /as the Voice|charged again/.test(t)), dup:lines.filter((t, i) => t && lines.indexOf(t) !== i) };
    }
    return out;
  });
  h.log('review lines:', JSON.stringify(rv, null, 1));
  for(const k in rv){
    const v = rv[k], who = k.split('/')[0];
    h.assert(!v.dup.length, `${k}: no line printed twice`);
    if(who === 'obi' || who === 'ifeanyi'){
      h.assert(!v.voice.some(t => /arrested/.test(t)), `${k}: never "arrested" — the held line says "charged"`);
      h.assert(v.voice.some(t => (who === 'obi' ? /^"Chief" Obi, in custody since Lekki, was charged as the Voice on your word\.$/ : /^Ifeanyi was charged as the Voice on your word\.$/).test(t)), `${k}: PEOPLE YOU PROTECTED — charged as the Voice`);
      h.assert(v.voice.some(t => /^On your word, /.test(t)), `${k}: the charge sheets keep the beta's held line`);
    } else h.assert(v.voice.some(t => /was arrested in public as the Voice, on your word\.$/.test(t)), `${k}: arrested in public, in front of his own people`);
  }

  // ---- R12 (court text): the promise follows the SIGN buttons ----
  const pre = async () => h.ev(() => ({ lead:(document.querySelector('#court-body .ct-lead') || {}).textContent || '', signs:document.querySelectorAll('#court-body [data-ct="cert"]').length,
    slots:certSlotsLeft('m8') }));
  const promise = t => { const m = t.match(/can still certify the Ekosodin material — (\d+) items?\./); return m ? +m[1] : 0; };
  // (a) the one Ekosodin exhibit held is already signed, a slot unused: nothing left to sign → no promise
  await C.setup(Object.assign({}, BASE, { flags:{}, ev:['fin_drive', 'musa_statement'], cert:['fin_drive'], voice:Object.assign({}, BASE.voice, { picks:['musa_statement'] }) }));
  let r = await C.resolve(); h.assert(r.outcome === 'proven' || r.outcome === 'contested', 'a trial: ' + r.outcome);
  h.assert(await C.toCourt(), 'trial (a)');
  let p = await pre();
  h.log('(a)', JSON.stringify(p));
  h.assert(p.slots > 0 && p.signs === 0 && promise(p.lead) === 0, 'a slot left but nothing to sign: no "can still certify" promise');
  // (b) a first trial, nothing signed: the promise and the buttons agree
  await C.setup(Object.assign({}, BASE, { cert:[] }));
  r = await C.resolve(); h.assert(await C.toCourt(), 'trial (b)');
  p = await pre();
  h.log('(b)', JSON.stringify(p));
  h.assert(p.signs >= 2 && promise(p.lead) === Math.min(p.slots, p.signs), 'nothing signed: the promise is the slots left, and there are buttons for it');
  await h.ev(() => document.querySelector('#court-body [data-ct="cert"]').click());
  p = await pre();
  h.assert(promise(p.lead) === 1 && p.slots === 1, 'one signed: "1 item"');
  await h.ev(() => document.querySelector('#court-body [data-ct="cert"]').click());
  p = await pre();
  h.assert(p.signs === 0 && promise(p.lead) === 0, 'both slots used: no buttons, no promise');
  // (c) an M8 replay after a closed season: whatever the window rule, the promise never outruns the buttons
  await C.setup(Object.assign({}, BASE, { cert:[] }));
  await h.ev(() => { S.game.seasonOneComplete = true; });
  r = await C.resolve(); h.assert(await C.toCourt(), 'trial (c)');
  p = await pre();
  h.log('(c)', JSON.stringify(p));
  h.assert((p.signs > 0) === (promise(p.lead) > 0) && promise(p.lead) <= p.signs, 'replay: a promise only with a SIGN button to keep it');
  h.assert(!h.errors.length, 'no page errors: ' + h.errors.join(' | '));
  h.log('PASS v13_fix_court_text');
};
