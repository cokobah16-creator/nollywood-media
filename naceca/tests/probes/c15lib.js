// Case 15 test helpers: preps for the season so far, and dialogue stepping with screenshots
const sc = require('../scen13.js');
const path = require('path');
/* a screenshot that waits out a slow software-rendered frame */
async function shot(T, name) {
  const scen = (process.argv[2] || 'probe').replace(/[:\/]/g, '_');
  await T.page.screenshot({ path:path.join((process.env.SHOTS || path.join(__dirname, '..', 'shots')), `${scen}_${T.mode}_${name}.png`), timeout:120000 });
  console.log('  shot', name);
}

const NAMES = {
  drive_image:'Forensic image of exhibit 14', upstream_ledger:'The UPSTREAM ledger', evidence_register:'Evidence register — exhibit 14',
  pos_t4_log:'Terminal T4 transaction log', bvn_link:'Four accounts, one BVN', cash_bundles:'₦9.6m in POS bundles', lucky_statement:'Lucky Edafe\'s statement',
  fuel_samples:'Camp fuel samples', waybill_book:'Forged Riverstone waybills', felix_phone:'The escort\'s phone', barge_track:'TEKENA 2 tracker log',
  loading_log:'The real loading log', tank3_sample:'Tank 3 diesel sample', cac_record:'CAC record — Riverstone Marine', bank_trail:'Riverstone → Maitama Haven transfers',
  gate_register:'Gate register — tankers out', transfer_docket:'Exhibit 14 transfer docket', dg_recording:'Recording — the ninth floor',
  visitor_book:'The Maitama visitor book', visitor_book_photo:'Photos of the visitor book', ereba_photo:'Godwin Ereba at the gate',
};
const ALL = Object.keys(NAMES).concat(['barge_cash', 'senator_words']);
const prepOf = (flags, ev, q, trial, extra) => 'S.game.evidence = (S.game.evidence||[]).filter(e => !(' + JSON.stringify(ALL) + ').includes(e.id)); S.game.evQ = S.game.evQ || {};' +
  ev.map(id => `S.game.evidence.push({id:'${id}', name:${JSON.stringify(NAMES[id])}}); S.game.evQ['${id}'] = ${JSON.stringify((q || {})[id] || 'good')};`).join('') +
  'Object.assign(S.game.moralChoices, ' + JSON.stringify(flags) + '); V13.s2().trial = ' + JSON.stringify(trial || {}) + '; delete V13.s2().seal15; delete V13.s2().acc15;' + (extra || '');

const STRONG = prepOf({ arrest:'professional', s2_custody:'signed', s2_method:'image', s2_abuja_call:'truth', s2_original:'kept', s2_karo:'trust', s2_ejiro:'source',
  s2_jetty:'lucky', s2_statement:'proper', s2_timi:'source', s2_samples:'sealed', s2_felix:'cooperating', s2_camp:'felix_only', s2_barge:'tagged',
  s2_warrant:'waited', s2_search:'amina', s2_inventory:'signed', s2_sotonye:'witness', s2_ibinabo:'source', s2_wire:true, s2_ninth:'refuse', s2_bitrus:'witness' },
  ['drive_image', 'upstream_ledger', 'evidence_register', 'pos_t4_log', 'bvn_link', 'cash_bundles', 'lucky_statement', 'fuel_samples', 'waybill_book', 'felix_phone',
   'barge_track', 'loading_log', 'tank3_sample', 'cac_record', 'bank_trail', 'gate_register', 'transfer_docket', 'dg_recording', 'visitor_book', 'ereba_photo'],
  null, { d1:'guilty', d2:'plea', d3:'plea' },
  "V13.recruit('TIDE', 60); V13.recruit('HERBS', 60); V13.recruit('GATE', 70); V13.s2().karo_source = 1;");

const WEAK = prepOf({ arrest:'bribe', s2_custody:'unsigned', s2_method:'photo', s2_abuja_call:'lie', s2_original:'handed', s2_karo:'cold', s2_ejiro:'left',
  s2_jetty:'lucky', s2_statement:'car', s2_timi:'cold', s2_samples:'grabbed', s2_felix:'threatened', s2_camp:'navy', s2_barge:'tagged',
  s2_warrant:'went_in', s2_search:'self', s2_inventory:'skipped', s2_sotonye:'arrested', s2_ibinabo:'cold', s2_wire:false, s2_ninth:'bury', s2_bitrus:'photo' },
  ['drive_image', 'upstream_ledger', 'pos_t4_log', 'bvn_link', 'cash_bundles', 'lucky_statement', 'fuel_samples', 'waybill_book', 'barge_track', 'loading_log',
   'tank3_sample', 'cac_record', 'bank_trail', 'transfer_docket', 'visitor_book_photo'],
  { drive_image:'weak', upstream_ledger:'contested', visitor_book_photo:'weak', transfer_docket:'contested' }, { d1:'notguilty', d2:'guilty', d3:'notguilty' },
  "V13.recruit('NETS', 40);");

/* the line on screen: { open, speaker, text, choices } */
async function line(T) {
  return T.ev(() => {
    const ov = document.getElementById('screen-dialogue');
    if (!ov || !ov.classList.contains('show')) return { open:false };
    skipTypewriter();
    const ch = [...document.querySelectorAll('#dlg-choices .dialogue-choice')].map(c => c.textContent.slice(0, 70));
    return { open:true, speaker:document.getElementById('dlg-speaker').textContent, text:document.getElementById('dlg-text').textContent, choices:ch };
  });
}
/* click through until a line matching `re` is showing (returns true), or the conversation closes (false) */
async function until(T, re, picks, quiet) {
  picks = picks || [];
  const r = new RegExp(re, 'i');
  for (let k = 0; k < 90; k++) {
    const L = await line(T);
    if (!L.open) return false;
    if (r.test(L.speaker + ' ' + L.text)) { await T.wait(700); return true; }
    if (L.choices.length) {
      const c = picks.length ? picks.shift() : 0;
      if (!quiet) T.log('   choose', c, 'from', L.choices.join(' || '));
      await T.ev(c => { const ch = [...document.querySelectorAll('#dlg-choices .dialogue-choice')]; let b = typeof c === 'number' ? ch[c] : ch.find(x => new RegExp(c, 'i').test(x.textContent)); if (!b) b = ch[0]; b.click(); if (b.dataset.armed) b.click(); }, c);
    } else await T.ev(() => advanceDialogue());
    await T.wait(220);
  }
  return false;
}
async function waitDialogue(T, ms) { return T.until(() => document.getElementById('screen-dialogue').classList.contains('show'), ms || 30000); }
async function waitFree(T, ms) { return T.until(() => ENGINE.movementEnabled && !isOverlayOpen() && !document.querySelector('#title-card.show'), ms || 30000); }
const st = T => T.ev(() => ({ m:S.game.currentMission, obj:(S.game.objectives || []).map(o => (o.done ? '✓' : '·') + o.id).join(' '),
  mc:JSON.stringify(Object.fromEntries(Object.entries(S.game.moralChoices || {}).filter(([k]) => /^s2_(raid|end|ninth|wire|ibinabo)/.test(k)))),
  ev15:['barge_cash', 'senator_words'].map(id => id + ':' + ((S.game.evidence || []).some(e => e.id === id) ? (S.game.evQ || {})[id] : '-')).join(' '),
  finale:V13.s2().finale, seal:JSON.stringify(V13.s2().seal15 || null), acc:JSON.stringify(V13.s2().acc15 || null), P:ENGINE.player && ENGINE.player.position.toArray().map(v => +v.toFixed(2)) }));

/* the accusation screen: pick a name and evidence ids, file it */
async function accuse(T, who, picks, shotName) {
  await T.until(() => document.getElementById('screen-accuse15') && document.getElementById('screen-accuse15').classList.contains('show'), 30000);
  await T.wait(600);
  const r = await T.ev(([who, picks]) => {
    const ov = document.getElementById('screen-accuse15');
    ov.querySelector(`.acc-card[data-id="${who}"]`).click();
    const out = [];
    for (const id of picks) { const b = document.getElementById('screen-accuse15').querySelector(`.acc-item[data-id="${id}"]`); if (b) { b.click(); out.push(id); } }
    return { picked:out, items:[...document.querySelectorAll('#screen-accuse15 .acc-item')].map(b => b.dataset.id) };
  }, [who, picks]);
  T.log('   accuse', who, JSON.stringify(r));
  if (shotName) await shot(T, shotName);
  await T.ev(() => { const b = document.getElementById('a15-go'); b.click(); b.click(); });
  await T.wait(800);
}
/* the epilogue: step through, shooting a few slides; returns what was shown */
async function epilogue(T, shots) {
  await T.until(() => document.getElementById('screen-epilogue') && document.getElementById('screen-epilogue').classList.contains('show'), 30000);
  const seen = [];
  for (let k = 0; k < 40; k++) {
    await T.wait(900);
    const s = await T.ev(() => { const show = document.getElementById('screen-epilogue').classList.contains('show'); return show ? { i:EPI.i, n:EPI.slides.length, kind:EPI.slides[EPI.i].kind, name:EPI.slides[EPI.i].name || EPI.slides[EPI.i].title || EPI.slides[EPI.i].place, img:!!document.querySelector('#epi img') } : null; });
    if (!s) break;
    seen.push(s.kind + ':' + s.name + (s.kind === 'person' ? (s.img ? '' : ' (NO IMG)') : ''));
    const want = shots && shots.find(x => x[0] === s.i || (x[0] === 'stinger' && s.kind === 'stinger') || (x[0] === 'last' && s.i === s.n - 1));
    // the slide fades in over 0.7 s, the stinger's lines one by one; a busy software renderer needs longer,
    // and a portrait has to finish decoding before the frame with the slide is produced
    if (want) {
      await T.until(() => { const e = document.getElementById('epi'), img = e && e.querySelector('img'); return !!e && getComputedStyle(e).opacity === '1' && (!img || (img.complete && img.naturalWidth > 0)); }, 90000);
      await T.wait(s.kind === 'stinger' ? 6000 : 1500); await shot(T, want[1]);
    }
    await T.ev(() => document.getElementById('screen-epilogue').click());
  }
  return seen;
}
module.exports = { sc, shot, NAMES, prepOf, STRONG, WEAK, line, until, waitDialogue, waitFree, st, accuse, epilogue };
