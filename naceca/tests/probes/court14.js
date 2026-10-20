// Case 14 — the trial, played through the real UI. COURT_RUN = strong | weak | plea (default strong).
// COURT_FAST=0 plays walks and cards at full length.
const sc = require('../scen13.js');

const NAMES = {
  drive_image:'Forensic image of exhibit 14', upstream_ledger:'The UPSTREAM ledger', evidence_register:'Evidence register — exhibit 14',
  pos_t4_log:'Terminal T4 transaction log', bvn_link:'Four accounts, one BVN', cash_bundles:'₦9.6m in POS bundles', lucky_statement:'Lucky Edafe\'s statement',
  fuel_samples:'Camp fuel samples', waybill_book:'Forged Riverstone waybills', felix_phone:'The escort\'s phone', barge_track:'TEKENA 2 tracker log',
  loading_log:'The real loading log', tank3_sample:'Tank 3 diesel sample', cac_record:'CAC record — Riverstone Marine', bank_trail:'Riverstone → Maitama Haven transfers',
  gate_register:'Gate register — tankers out',
};
const ALL = Object.keys(NAMES);
const prepOf = (flags, ev, q, extra) => 'S.game.evidence = (S.game.evidence||[]).filter(e => !(' + JSON.stringify(ALL) + ').includes(e.id)); S.game.evQ = S.game.evQ || {};' +
  ev.map(id => `S.game.evidence.push({id:'${id}', name:${JSON.stringify(NAMES[id])}}); S.game.evQ['${id}'] = ${JSON.stringify((q || {})[id] || 'good')};`).join('') +
  'Object.assign(S.game.moralChoices, ' + JSON.stringify(flags) + '); V13.s2().fixes = {}; V13.s2().fixWhere = {}; V13.s2().trial = {};' + (extra || '');

const RUNS = {
  strong:{
    prep:prepOf({ arrest:'professional', s2_custody:'signed', s2_method:'image', s2_abuja_call:'truth', s2_original:'kept', s2_karo:'trust', s2_ejiro:'source',
      s2_jetty:'lucky', s2_statement:'proper', s2_timi:'source', s2_samples:'sealed', s2_felix:'arrested', s2_camp:'felix_only', s2_barge:'tagged',
      s2_warrant:'waited', s2_search:'amina', s2_inventory:'signed', s2_sotonye:'arrested', s2_ibinabo:'source', s2_ninth:'refuse', s2_bitrus:'witness' }, ALL, null,
      "V13.recruit('TILL', 60); V13.src('TILL').reg = true; V13.recruit('HERBS', 60); V13.src('HERBS').reg = true;"),
    pol:{ exam:'good', obj:'best', cross:'truth', note:true, plea:true, fixes:[['cert_pos', 'bank_cert'], ['ctc_cac', 'cert_tracker']] },
  },
  weak:{
    prep:prepOf({ arrest:'bribe', s2_custody:'unsigned', s2_method:'photo', s2_abuja_call:'lie', s2_original:'handed', s2_karo:'cold', s2_ejiro:'left',
      s2_jetty:'lucky', s2_statement:'car', s2_timi:'cold', s2_samples:'grabbed', s2_felix:'threatened', s2_camp:'navy', s2_barge:'tagged',
      s2_warrant:'went_in', s2_search:'self', s2_inventory:'skipped', s2_sotonye:'arrested', s2_ibinabo:'cold', s2_ninth:'bury', s2_bitrus:'cold' },
      ALL.filter(id => id !== 'evidence_register'), { drive_image:'weak', upstream_ledger:'contested' }, "V13.recruit('NETS', 40);"),
    pol:{ exam:'good', obj:'best', cross:'lie', note:false, plea:false, fixes:[[], []] },
  },
  disaster:{
    prep:null,   // the weak history, played as badly as possible
    pol:{ exam:'bad', obj:'worst', cross:'lie', note:false, plea:false, fixes:[[], []] },
  },
  plea:{
    prep:prepOf({ arrest:'professional', s2_custody:'signed', s2_method:'direct', s2_abuja_call:'deflect', s2_original:'handed', s2_karo:'neutral', s2_ejiro:'arrested',
      s2_jetty:'follow', s2_statement:'threat', s2_timi:'source', s2_samples:'sealed', s2_felix:'cooperating', s2_camp:'felix_only', s2_barge:'tagged',
      s2_warrant:'waited', s2_search:'amina', s2_inventory:'signed', s2_sotonye:'pressured', s2_ibinabo:'source', s2_ninth:'refuse', s2_bitrus:'photo' }, ALL, null,
      "V13.recruit('TIDE', 50);"),
    pol:{ exam:'good', obj:'best', cross:'truth', note:true, plea:true, fixes:[['search_record', 'cert_pos'], ['bank_cert', 'ctc_cac']] },
  },
};
RUNS.disaster.prep = RUNS.weak.prep;

const pick = (pol) => {
  const P = V13.court.pending; if (!P) return { i:0, why:'none' };
  const o = P.options, f = fn => o.findIndex(fn);
  let i = -1;
  if (P.type === 'exam') i = pol.exam === 'good' ? f(x => x.kind === 'good') : f(x => x.kind !== 'good');
  else if (P.type === 'cross') i = f(x => x.kind === pol.cross);
  else if (P.type === 'objection') {
    if (pol.obj === 'best') { i = f(x => x.ok === true && (!x.needs || V13.court.fixDone(x.needs))); if (i < 0) i = f(x => x.ok === 'standdown'); if (i < 0) i = f(x => x.ok === true); }
    else i = f(x => x.ok === false);
  }
  else if (P.type === 'plea') i = f(x => x.plea === pol.plea);
  else if (P.type === 'note') i = f(x => x.good === pol.note);
  if (i < 0) i = 0;
  return { i, type:P.type, id:P.id, opt:o[i] };
};

async function drive(T, run) {
  const R = RUNS[run]; if (!R) throw new Error('no run ' + run);
  const fastMode = process.env.COURT_FAST !== '0';
  const t0 = Date.now();
  const ok = await sc.s2start(T, 'm14', R.prep);
  T.log('m14 started', ok, run);
  await T.ev(f => { V13.court.fast = f; }, fastMode);
  await T.until(() => !document.querySelector('#title-card.show') && ENGINE.movementEnabled, 30000);
  await T.shot(run + '_arrive');
  await sc.use(T, 'Barrister Danladi');
  const seen = new Set(), log = [];
  let board = 0, exhOpened = false, lines = 0, decisions = 0;
  const shotOnce = async (name, delay) => { if (seen.has(name)) return; seen.add(name); await T.wait(delay == null ? 650 : delay); await T.shot(run + '_' + name); };
  for (let step = 0; step < 4000; step++) {
    const s = await T.ev(() => {
      const on = id => { const e = document.getElementById(id); return !!(e && e.classList.contains('show')); };
      const dlg = on('screen-dialogue');
      if (dlg) skipTypewriter();
      const ch = [...document.querySelectorAll('#dlg-choices .dialogue-choice')];
      return { after:on('screen-aftermath'), verdict:on('screen-courtverdict'), fix:on('screen-courtfix'), card:!!document.querySelector('#title-card.show'), dlg,
        choices:ch.length, speaker:dlg ? document.getElementById('dlg-speaker').textContent : '', text:dlg ? document.getElementById('dlg-text').textContent : '',
        label:(document.querySelector('#court-bar .cb-k') || {}).textContent || '', pending:V13.court.pending ? V13.court.pending.type : null,
        stamp:(document.querySelector('#court-stamp.show') || {}).textContent || '' };
    });
    if (s.after) { await T.wait(1200); await T.shot(run + '_aftermath'); break; }
    if (s.verdict) { await shotOnce('judgment_card', 400); await T.click('#screen-courtverdict .cv-go'); await T.wait(600); continue; }
    if (s.fix) {
      const kick = await T.ev(() => (document.querySelector('#screen-courtfix .plan-k') || {}).textContent || '');
      board = /NEXT SITTING/.test(kick) ? 1 : 0;
      await shotOnce('fixboard_' + board, 300);
      const want = (R.pol.fixes[board] || []);
      const r = await T.ev(want => { const b = want.map(f => document.querySelector(`#screen-courtfix .cf-go[data-f="${f}"]:not([disabled])`)).find(Boolean);
        if (b) { const f = b.dataset.f; b.click(); return 'fix ' + f; } document.querySelector('#screen-courtfix .cf-close').click(); return 'close'; }, want);
      T.log('   board', board, r);
      await T.wait(400); continue;
    }
    if (s.card || !s.dlg) { await T.wait(350); continue; }
    if (s.choices) {
      // key moments, before choosing
      if (s.pending === 'objection') await shotOnce('objection');
      if (s.pending === 'exam') await shotOnce('exam');
      if (s.pending === 'cross') {
        await shotOnce('cross');
        if (!exhOpened) { exhOpened = true; await T.ev(() => document.querySelector('#court-bar .cb-exh').click()); await shotOnce('exhibits', 500);
          await T.ev(() => document.querySelector('#court-exh .ce-x').click()); await T.wait(250); }
      }
      if (s.pending === 'plea') await shotOnce('plea');
      if (s.pending === 'note') await shotOnce('note');
      if (s.pending === 'reexam') await shotOnce('reexam');
      const p = await T.ev(pick, R.pol);
      decisions++;
      log.push(`${p.type}:${p.id || ''} -> ${p.opt ? (p.opt.kind || p.opt.ok || p.opt.plea || p.opt.good || p.opt.id || '') : ''}`);
      await T.ev(i => { const b = document.querySelectorAll('#dlg-choices .dialogue-choice')[i]; if (b) { b.click(); if (b.dataset.armed) b.click(); } }, p.i);
      await T.wait(120); continue;
    }
    // ordinary line: shots of the moments that matter
    const t = s.text;
    if (/DANLADI/i.test(s.speaker) && /Sit, Agent/.test(t)) await shotOnce('conference');
    if (/ABUJA · A GUEST HOUSE/.test(t) && !seen.has('interlude')) {
      const d = await T.ev(async () => { let n = 0; const t0 = performance.now(); await new Promise(r => { const f = () => { n++; if (performance.now() - t0 < 2500) requestAnimationFrame(f); else r(); }; requestAnimationFrame(f); });
        const el = document.getElementById('court-interlude'), bar = document.getElementById('court-bar');
        return { fps:+(n / 2.5).toFixed(2), inter:el ? el.className + ' op=' + getComputedStyle(el).opacity : 'none', bar:bar ? bar.className + ' op=' + getComputedStyle(bar).opacity : 'none' }; });
      T.log('   interlude check', JSON.stringify(d));
    }
    if (/REGISTRAR/.test(s.speaker) && /How do you plead/.test(t)) await shotOnce('arraign');
    if (/reads count one/.test(t)) await shotOnce('count');
    if (/Admitted and marked Exhibit P\d/.test(t)) await shotOnce('admitted', 500);
    if (/Tendered and rejected/i.test(t)) await shotOnce('rejected', 500);
    if (/marked for identification only, MFI/.test(t)) await shotOnce('mfi', 500);
    if (/^PW2 ·/.test(t)) await shotOnce('pw2', 900);
    if (/TRIAL-WITHIN-TRIAL/.test(t)) await shotOnce('twt', 800);
    if (/no-case submission/.test(t) && /COKER/.test(s.speaker)) await shotOnce('nocase');
    if (/^DW1 ·/.test(t)) await shotOnce('dw1', 900);
    if (/ABUJA · A GUEST HOUSE/.test(t)) await shotOnce('interlude', 700);
    if (/^Judgment\. The prosecution/.test(t)) await shotOnce('judgment_open', 800);
    if (/I find the first defendant|not guilty|guilty as charged/i.test(t) && /JUSTICE/.test(s.speaker)) await shotOnce('verdict', 400);
    if (/Element \(b\)|element \(b\)/.test(t)) await shotOnce('element', 400);
    if (/Court! All rise/.test(t)) await shotOnce('allrise', 900);
    if (/takes the bench/.test(t)) await shotOnce('judge_in', 1200);
    if (/sentenced to/.test(t)) await shotOnce('sentence', 400);
    if (/Walk with me/.test(t)) await shotOnce('close', 700);
    lines++;
    await T.ev(() => advanceDialogue());
    await T.wait(fastMode ? 40 : 900);
  }
  const res = await T.ev(() => ({ trial:V13.s2().trial, fixes:V13.s2().fixes, cm:S.game.currentMission, done:(S.game.completedMissions || []).includes('m14'),
    state:{ cred:V13.court.state.cred, plea:V13.court.state.plea, nocase:V13.court.state.nocase, elements:V13.court.state.elements, lies:V13.court.state.lies, suggest:V13.court.state.suggest, rx:V13.court.state.rx, twt:V13.court.state.twt, facts:V13.court.state.facts } }));
  T.log('decisions', decisions, 'lines', lines, 'seconds', Math.round((Date.now() - t0) / 1000));
  T.log('choices:', log.join(' | '));
  T.log('TRIAL', JSON.stringify(res.trial));
  T.log('STATE', JSON.stringify(res.state), 'fixes', JSON.stringify(res.fixes), 'completed', res.done);
  return res;
}
module.exports = async function (T) { return drive(T, process.env.COURT_RUN || 'strong'); };
module.exports.drive = drive;
module.exports.RUNS = RUNS;
