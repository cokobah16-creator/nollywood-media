// text team: Season 2's branch text against Season 1 canon, on the built page (a port of the reviewers'
// canon_text probe, with CHECK lines). Run: run_probe.sh <build> text_branches desktop <log>
// The helpers of the core contract (V13.tobiAlive, V13.tobiTestifies, V13.s1fate) are polyfilled with their
// exact semantics when the page doesn't have them yet; cond strings are evaluated the way the hub does
// (new Function('S', ...) in try/catch: an error is false). Checks that need another team print SKIP.
// (an ES module: this repo's package.json says "type":"module"; the kit's harness loads it with require(esm))
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
// the DIALOGUE keys the text team's files define (the old-name check is about those; other keys are reported)
const MY_KEYS = (() => { const out = new Set(); for (const f of ['s2_dlg_a.js', 's2_dlg_b.js', 's2_dlg_c.js']) {
  let src = ''; try { src = fs.readFileSync(path.resolve(HERE, '..', '..', 'src', 'season2', f), 'utf8'); } catch (e) {}
  let m; const re = /^\s*(m1?\d+b?_[a-z0-9_]+)\s*:\s*\[/gm; while ((m = re.exec(src))) out.add(m[1]); } return [...out]; })();
const probe = async function (T) {
  let pass = 0, total = 0, skip = 0;
  const check = (id, ok, detail) => {
    if (ok === 'SKIP') { skip++; console.log(`CHECK ${id} SKIP ${detail}`); return; }
    total++; if (ok) pass++;
    console.log(`CHECK ${id} ${ok ? 'PASS' : 'FAIL'} ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`.slice(0, 900));
  };
  const out = (k, v) => console.log('CHK ' + k + ' ' + JSON.stringify(v));

  const poly = await T.ev(() => {
    const done = [];
    const MCf = () => (S.game && S.game.moralChoices) || {};
    if (typeof V13.tobiAlive !== 'function') { V13.tobiAlive = () => { const m = MCf(); return m.asaba === 'rescue' || (m.asaba === 'chase' && !S.game._asabaHostageLost); }; done.push('tobiAlive'); }
    if (typeof V13.tobiTestifies !== 'function') { V13.tobiTestifies = () => MCf().asaba === 'rescue'; done.push('tobiTestifies'); }
    if (typeof V13.s1fate !== 'function') { V13.s1fate = () => ((S.game && S.game.s2) || {}).s1fate || MCf().finale || 'unproven'; done.push('s1fate'); }
    window.__condOk = c => { try { return !!(new Function('S', 'return (' + c + ')'))(S); } catch (e) { return false; } };
    window.__fresh = (mc, fl, extra) => {
      const g = S.game; g.moralChoices = Object.assign({}, mc || {}); g.flags = Object.assign({}, fl || {});
      g._asabaHostageLost = !!(extra && extra.lost); g.accusations = (extra && extra.acc) || {};
      g.s2 = Object.assign({ trial: {}, sources: {}, hubs: {} }, (extra && extra.s2) || {});
      if (S.player && S.player.reputation) S.player.reputation.underworldHeat = (extra && extra.heat != null) ? extra.heat : 20;
    };
    return done;
  });
  T.log('polyfilled (core contract missing on this page):', poly.join(', ') || 'none');

  // ---------- CN05 + CN06: Tobi's epilogue slide by Season 1 branch ----------
  const epi = st => T.ev(st => {
    __fresh(st.mc, st.fl, { lost: st.lost, s2: { finale: st.s2fin || 'proven' } });
    const sl = V13.epilogueS2();
    const f = n => (sl.find(s => s.name === n) || {}).text || null;
    return { tobi: f('TOBI ONUOHA'), adaeze: f('COMMANDER ADAEZE'), okundaye: f('COMMANDER ITOHAN OKUNDAYE'), danladi: f('BARRISTER ZAINAB DANLADI'),
      names: sl.map(s => s.name), stinger: V13.STINGER_S2.lines[0].slice(0, 100) };
  }, st);
  const rescue = await epi({ mc: { asaba: 'rescue', finale: 'proven', checkpoint: 'flip_driver' } });
  out('epi_rescue', rescue);
  check('CN05/rescue', /^Tobi decoded every line of UPSTREAM for the prosecution, from SPL-WSM-T4 to D\.G\.O\./.test(rescue.tobi || ''), rescue.tobi);
  const chase = await epi({ mc: { asaba: 'chase', finale: 'proven', checkpoint: 'arrest_driver' }, lost: false });
  out('epi_chase_alive', chase);
  check('CN05/chase-alive', /^Sgt\. Uche carried Tobi out of Asaba, and this season he read UPSTREAM line by line for Barrister Danladi/.test(chase.tobi || ''), chase.tobi);
  const lost = await epi({ mc: { asaba: 'chase', finale: 'proven' }, lost: true });
  out('epi_chase_lost', lost);
  check('CN05/chase-lost', lost.tobi === null, 'no slide: ' + lost.tobi);
  const failed = await epi({ mc: { asaba: 'failed', finale: 'proven' } });
  check('CN05/failed', failed.tobi === null, 'no slide: ' + failed.tobi);
  check('CN06/no-certifying-Tobi', ![rescue.tobi, chase.tobi].some(t => /section 84|certificate|hash/i.test(t || '')), 'Tobi reads, Igbinosa certifies');
  check('CN10/epilogue-names', !!rescue.okundaye && !!rescue.danladi && !rescue.names.some(n => /OSAGIE|HAUWA|TAMUNO/.test(n)), rescue.names.join(' | '));

  // ---------- CN11: the stinger and Musa's phone follow Season 1's Musa ----------
  const musa = await T.ev(() => {
    const r = {};
    const phone = (V13.PHONE.after_m14 || []).find(m => m.who === 'MUSA') || {};
    for (const [k, mc, fl] of [['jailed', { checkpoint: 'arrest_driver' }, {}], ['tailed', { checkpoint: 'tail_driver' }, {}],
                               ['tip', { checkpoint: 'tail_driver' }, { musa_tip: true }], ['flipped', { checkpoint: 'flip_driver' }, {}]]) {
      __fresh(mc, fl);
      const st = V13.STINGER_S2;
      r[k] = { l0: st.lines[0], l2: st.lines[2], all: st.lines.join(' '), place: st.place, card: st.card && st.card.title, phone: __condOk(phone.cond || 'true'),
        s1: (typeof epilogueSlides === 'function' ? (epilogueSlides().find(s => s.name === 'MUSA') || {}).text : null) };
    }
    r.cond = phone.cond;
    return r;
  });
  out('stinger_musa', { jailed: musa.jailed.all.slice(0, 200), flipped: musa.flipped.l0.slice(0, 90), cond: musa.cond });
  check('CN11/jailed-stinger', /The cooperative's newest driver ties down the tarp/.test(musa.jailed.l0) && /^The driver lifts the corner/.test(musa.jailed.l2) && !/\bMusa\b/.test(musa.jailed.all), musa.jailed.all.slice(0, 160));
  check('CN11/tailed-no-tip', !/\bMusa\b/.test(musa.tailed.all) && !musa.tailed.phone, 'tail_driver without the tip: no Musa, no text');
  check('CN11/jailed-phone', musa.jailed.phone === false, 'Musa phone cond false when jailed: ' + musa.cond);
  check('CN11/talked', /^Dawn at the cooperative yard on the Zaria road\. Musa ties down the tarp/.test(musa.flipped.l0) && musa.flipped.phone && musa.tip.phone && /Musa/.test(musa.tip.l0), 'flip_driver / musa_tip: Musa drives and texts');
  check('CN11/stinger-shape', musa.jailed.place === 'KANO · 05:40' && musa.jailed.card === 'SEASON 3', 'place and card kept');
  check('CN11/s1-agrees', /served eight months/.test(musa.jailed.s1 || '') && /cattle cooperative/.test(musa.flipped.s1 || ''), 'Season 1 epilogue: ' + (musa.jailed.s1 || '').slice(0, 50));

  // ---------- CN12: Tunde and KC after Season 1's charge sheet ----------
  const src = await T.ev(() => {
    const tunde = (V13.PHONE.after_m10 || []).find(m => m.who === 'TUNDE') || {};
    const kc = (V13.PHONE.after_m13b || []).find(m => m.who === 'KC') || {};
    const accT = { lagos: { suspect: 'tunde', ok: { suspect: false }, settled: true } };
    const accK = { lagos: { suspect: 'kc', ok: { suspect: false }, settled: true } };
    const r = {};
    __fresh({ market_runner: 'caught', choice: 'flip' }); r.tundeFine = __condOk(tunde.cond || 'true'); r.kcFine = __condOk(kc.cond || 'true');
    __fresh({ market_runner: 'caught', choice: 'flip' }, {}, { acc: accT }); r.wl = typeof _cwWrong === 'function' ? _cwWrong('lagos') : null; r.tundeHeld = __condOk(tunde.cond || 'true');
    __fresh({ market_runner: 'caught', choice: 'flip' }, {}, { heat: 75 }); r.tundeHeat = __condOk(tunde.cond || 'true');
    __fresh({ market_runner: 'caught', choice: 'flip' }, {}, { acc: accK }); r.kcHeld = __condOk(kc.cond || 'true');
    r.kcText = kc.text; r.kcTips = (V13.TIPS.KC || []).filter(t => t.true).map(t => t.text);
    r.tundeCond = tunde.cond || '(none)';
    return r;
  });
  out('tunde_kc', src);
  check('CN12/tunde-held', src.wl === 'tunde' && src.tundeHeld === false && src.tundeFine === true, `wrongly held: ${src.tundeHeld}; fine: ${src.tundeFine}`);
  check('CN12/tunde-heat70', src.tundeHeat === false, 'Heat 75: ' + src.tundeHeat);
  check('CN12/kc-held', src.kcHeld === false && src.kcFine === true, `KC wrongly held: ${src.kcHeld}; fair: ${src.kcFine}`);
  check('CN12/kc-in-ikeja', /My guy for Benin phone market/i.test(src.kcText || '') && src.kcTips.filter(t => /Benin/.test(t)).every(t => /my guy for Benin phone market/i.test(t)), (src.kcText || '').slice(0, 80));

  // ---------- CN14: a seized barge is explained in the Case 15 brief ----------
  const brief = await T.ev(() => {
    const r = {};
    for (const b of ['seized', 'tagged']) {
      __fresh({ s2_barge: b });
      const key = V13.C.brief15(); const L = DIALOGUE[key] || [];
      const i = L.findIndex(l => /TEKENA 2 — the barge we seized in the creek/.test(l.text || '')), e = L.findIndex(l => l.mark === 'end');
      r[b] = { i, e, speaker: i >= 0 ? L[i].speaker : null };
    }
    return r;
  });
  check('CN14/seized', brief.seized.i >= 0 && brief.seized.i < brief.seized.e && brief.seized.speaker === 'BARRISTER DANLADI', JSON.stringify(brief.seized));
  check('CN14/tagged', brief.tagged.i < 0, 'no bond line when tagged');

  // ---------- CN06: the pen, the tracker, the audio, the bench ----------
  const pen = await T.ev(() => {
    const r = {};
    for (const a of ['rescue', 'chase', 'failed']) { __fresh({ asaba: a }); r[a] = V13.C.wireOffer(); }
    r.line0 = (DIALOGUE.m13_wire_offer || [])[0].text;
    const m11 = V13.PHONE.after_m11 || [], m13 = V13.PHONE.after_m13 || [];
    r.tracker = m11.filter(m => /tracker/i.test(m.text)).map(m => ({ who: m.who, cond: m.cond }));
    r.audioTobi = m13.filter(m => m.who === 'TOBI').length;
    r.audio = (m13.find(m => /Igbinosa has the pen/.test(m.text)) || {}).cond;
    r.bench = (DIALOGUE.m9_tobi_bench || []).map(l => l.speaker + ': ' + l.text);
    r.benchMood = (DIALOGUE.m9_tobi_bench || [])[1] && DIALOGUE.m9_tobi_bench[1].mood;
    r.igb = (DIALOGUE.m9_forensic_igbinosa || []).map(l => l.text);
    return r;
  });
  check('CN06/wireOffer', pen.rescue === 'm13_wire_offer' && pen.chase === 'm13_wire_offer' && pen.failed === 'm13_wire_offer', JSON.stringify([pen.rescue, pen.chase, pen.failed]));
  check('CN20/pen-video-call', /^22:10\. On the video call from Benin, Commander Okundaye nods at the parcel her driver brought you/.test(pen.line0 || ''), pen.line0);
  check('CN06/tracker-single', pen.tracker.length === 1 && pen.tracker[0].cond === "S.game.moralChoices.s2_barge==='tagged'" && pen.tracker[0].who !== 'TOBI', JSON.stringify(pen.tracker));
  check('CN06/audio', pen.audioTobi === 0 && pen.audio === 'S.game.moralChoices.s2_wire === true', 'Tobi texts: ' + pen.audioTobi + '; cond: ' + pen.audio);
  check('CN06/m9_tobi_bench', pen.bench.length === 3 && pen.bench.every(l => /^TOBI: /.test(l)) && pen.benchMood === 'evasive' && /never once opened _old/.test(pen.bench[2] || ''), pen.bench.join(' / ').slice(0, 300));
  check('CN04/igbinosa-bench', pen.igb.some(t => /^It took this bench three weeks to unlock the payroll folder for the case against her\./.test(t)), 'the line plays in the every-save bench key');

  // ---------- CN05: the CAC call's last line; CN04/CN08 Tobi's text after m9 ----------
  const tob = await T.ev(() => {
    const L = DIALOGUE.m12_tobi_cac || [];
    const last2 = L.slice(-2).map(l => ({ cond: l.cond, text: l.text }));
    const t9 = (V13.PHONE.after_m9 || []).find(m => m.who === 'TOBI') || {}, u9 = (V13.PHONE.after_m9 || []).find(m => m.who === 'UCHE' && /Igbinosa/.test(m.text)) || {};
    const t10 = (V13.PHONE.after_m10 || []).find(m => m.who === 'TOBI') || {};
    const r = { last2, t9: t9.text, t9cond: t9.cond, u9cond: u9.cond, t10cond: t10.cond };
    for (const [k, mc, lostF] of [['rescue', { asaba: 'rescue' }, false], ['chase', { asaba: 'chase' }, false], ['lost', { asaba: 'chase' }, true]]) {
      __fresh(mc, {}, { lost: lostF });
      r[k] = { t9: __condOk(t9.cond), u9: __condOk(u9.cond), t10: __condOk(t10.cond), testify: last2.map(l => __condOk(l.cond)) };
    }
    return r;
  });
  check('CN05/cac-last-line', tob.last2[0].cond === 'V13.tobiTestifies()' && /^You came back for me in Asaba/.test(tob.last2[0].text) && tob.last2[1].cond === '!V13.tobiTestifies()' && /^Sergeant Uche carried me out of Asaba because you sent him in/.test(tob.last2[1].text)
    && tob.rescue.testify.join() === 'true,false' && tob.chase.testify.join() === 'false,true', JSON.stringify(tob.chase.testify));
  check('CN05/phone-alive-rule', tob.rescue.t9 && tob.chase.t9 && !tob.lost.t9 && !tob.rescue.u9 && !tob.chase.u9 && tob.lost.u9 && tob.chase.t10 && !tob.lost.t10, JSON.stringify({ rescue: tob.rescue, chase: tob.chase, lost: tob.lost }));
  check('CN04/CN08/tobi-text', /^Eleven days on that payroll for the trial and I never opened _old\./.test(tob.t9 || '') && /cash, not the Foundation's 1st/.test(tob.t9 || ''), (tob.t9 || '').slice(0, 120));

  // ---------- CN13: Season 2 reads Season 1's verdict through V13.s1fate() ----------
  const fate = await T.ev(() => {
    const r = {};
    __fresh({ finale: 'proven' }, {}, { s2: { s1fate: 'unproven', finale: null } });
    r.head = V13.AFTER.m9.headline(S).pub;
    const k = V13.C.ninth([]); r.ninth = (DIALOGUE[k] || []).some(l => /^Relieved of command/.test(l.text || ''));
    __fresh({ finale: 'proven' }, {}, { s2: { s1fate: 'contested', finale: null } });
    r.epi = (V13.epilogueS2().find(s => s.name === 'COMMANDER ADAEZE') || {}).text;
    r.mc = S.game.moralChoices.finale;
    return r;
  });
  check('CN13/readers', fate.head === 'THE DAILY GONG' && fate.ninth && /her trial listed again for May/.test(fate.epi || '') && fate.mc === 'proven', JSON.stringify(fate));

  // ---------- CN03: the calendar words ----------
  const cal = await T.ev(() => {
    const txt = k => (DIALOGUE[k] || []).map(l => l.text).join(' ');
    const ph = (h, who) => ((V13.PHONE[h] || []).filter(m => m.who === who).map(m => m.text)).join(' ');
    __fresh({}, {}, { s2: { finale: null } });
    const dg = (V13.epilogueS2().find(s => s.name === 'DIRECTOR-GENERAL KOLAWOLE FASHINA') || {}).text;
    return { m13b: txt('m13b_end'), hau: ph('after_m13b', 'HAUWA'), call: txt('m15_dg_call'), dg, brief: txt('m15_brief'), book: PUZZLES.m13b_book.screen,
      log: PUZZLES.m12_log.screen, way: PUZZLES.m11_waybills.screen, counts: [V13.COURT_DATA.charge.count1, V13.COURT_DATA.charge.count2, V13.COURT_DATA.charge.count3].join(' ') };
  });
  check('CN03/trial-date', /fixed for Monday the eleventh of January, nine o'clock, Court 5/.test(cal.m13b) && /Trial fixed: Monday 11 January, 9 a\.m\., Federal High Court Abuja, Court 5\./.test(cal.hau), cal.hau.slice(0, 80));
  check('CN03/case15', /before Easter/.test(cal.call) && /before the rains/.test(cal.call) && !/Christmas/.test(cal.call) && /^Still Director-General\. At Easter/.test(cal.dg || ''), 'DG: before Easter / before the rains; hamper at Easter');
  check('CN03/visitor-book', ['11/09', '30/09', '09/10', '13/11', '23/11 MON', '27/11', '04/12', '09/12 WED'].every(s => cal.book.includes(s)) && (cal.book.match(/ABJ-260XR/g) || []).length === 3 && !/ABJ-418KD|10\/07|14\/08|25\/09|02\/10|07\/10/.test(cal.book), 'eleven rows, ABJ-260XR');
  check('CN03/case12-docs', /26 NOV · TANK 3/.test(cal.log) && /03 DEC 03:55/.test(cal.log) && /24 NOV and 01 DEC/.test(cal.log) && /27 NOV · T3 out/.test(cal.log) && /0458 · 24 NOV/.test(cal.way) && !/\b(SEP|OCT)\b/.test(cal.log + cal.way), 'Tank 3 logs and waybills in Nov/Dec');
  check('CN03/counts', (cal.counts.match(/between March and December, 2026/g) || []).length === 3, 'three counts to December');
  check('CN20/forfeiture', /at two on Monday afternoon/.test(cal.brief), 'the forfeiture is heard on Monday');

  // ---------- R11 / R12: Senior variants ----------
  const sen = await T.ev(() => {
    const last = k => { const L = DIALOGUE[k] || []; return L[L.length - 1] || {}; };
    const ints = ['m10_intro', 'm10_intro_tobi', 'm10_intro_igbinosa'].map(k => last(k));
    const la = (DIALOGUE.m10_lucky_arrives || [])[1] || {};
    const cac = [...(DIALOGUE.m12_tobi_cac || []), ...(DIALOGUE.m12_igbinosa_cac || [])];
    const shayi = [...(DIALOGUE.m13b_shayi_treat || []), ...(DIALOGUE.m13b_shayi_greet || [])].filter(l => /greet him well|smell a lie/.test(l.text));
    const who = PUZZLES.m10_who.screen, sw = V12.seniorScreen(who);
    return { ints: ints.map(l => ({ text: l.text, sr: l.sr })), la: { text: la.text, sr: la.sr },
      cacInterp: cac.filter(l => /driver/i.test(l.text) && !l.rec && !(l.sr && !/driver/i.test(l.sr))).map(l => l.text),
      cacRecords: cac.filter(l => l.sr === 'Records sent, Agent. Read them yourself.' || /^Records sent, Agent\. Read them yourself\./.test(l.sr || '')).length,
      choiceRec: cac.concat(shayi).filter(l => l.choices && (l.rec || l.cond)).length,
      shayi: shayi.map(l => ({ sr: l.sr, rec: l.rec })),
      asks: [V12.DOCS.m12_sample.ask, V12.DOCS.m12_cac.ask],
      who: { rec: /<span class="cw-hint"> → EDAFE, LUCKY O\.<\/span>/.test(who), senior: sw.includes('EDAFE'), proofs: ['1,195,000', 'just under'].every(p => sw.includes(p)) } };
  });
  check('R11/m10-texts', sen.ints.every(l => l.sr && !/blue|herb|stall|beside|next to/i.test(l.sr) && /kiosk 4/.test(l.sr) && /blue board/.test(l.text)), JSON.stringify(sen.ints.map(l => l.sr)));
  check('R12/uche-kiosk', !!sen.la.sr && !/kiosk/i.test(sen.la.sr) && /blue kiosk/.test(sen.la.text), sen.la.sr);
  check('R11/cac-call', sen.cacInterp.length === 0 && sen.cacRecords >= 2 && sen.choiceRec === 0, 'interpretation on Senior: ' + JSON.stringify(sen.cacInterp));
  check('R11/doc-asks', /tap the result that settles it\.$/.test(sen.asks[0]) && /tap the line that proves it\.$/.test(sen.asks[1]) && !/no refinery|nominee away/.test(sen.asks.join(' ')), sen.asks.join(' | '));
  check('R11/baba-shayi', sen.shayi.length === 2 && sen.shayi.every(l => l.sr && !/greet|lie|straight/i.test(l.sr) && /book/.test(l.sr)), JSON.stringify(sen.shayi));
  check('R12/m10_who', sen.who.rec && !sen.who.senior && sen.who.proofs, JSON.stringify(sen.who));

  // ---------- CN09 / CN10 / CN21: no old names or cars in Season 2 dialogue ----------
  const names = await T.ev(mine => {
    const all = []; const spk = new Set(), other = [];
    const bad = /Osagie|OSAGIE|Hauwa|Bassey|Danjuma|\bOke\b|Coker|COKER|MAMA EFE|Mama Efe|Tamuno|\bTari\b|\bEbi\b|grey (saloon|Corolla)|Cybercrime/;
    for (const k in DIALOGUE) { if (!/^m1[0-5]|^m9/.test(k) || /_run$/.test(k)) continue;
      if (!mine.includes(k)) { for (const l of DIALOGUE[k] || []) if (bad.test((l.speaker || '') + ' ' + (l.text || ''))) other.push(k + ': ' + (l.speaker || '') + ' / ' + (l.text || '').slice(0, 60)); continue; }
      for (const l of DIALOGUE[k] || []) { all.push(l.text || '', l.textEn || '', l.sr || ''); spk.add(l.speaker || ''); } }
    for (const h in V13.PHONE) for (const m of V13.PHONE[h] || []) all.push(m.text || '', m.textEn || '');
    for (const s in V13.TIPS) for (const t of V13.TIPS[s] || []) all.push(t.text || '', t.textEn || '');
    for (const p of ['m9_hash', 'm9_ledger', 'm10_who', 'm11_route', 'm11_waybills', 'm12_log', 'm12_sample', 'm12_cac', 'm13_docket', 'm13_docket_kept', 'm13b_book'])
      if (PUZZLES[p]) all.push(PUZZLES[p].screen, PUZZLES[p].prompt, ...(PUZZLES[p].options || []).map(o => o.text + ' ' + o.hint));
    all.push(JSON.stringify(V13.COURT_DATA), JSON.stringify(V13.S2_CANDIDATES), JSON.stringify(V13.S2_WRONG));
    const s = all.join('\n'), f = re => (s.match(re) || []).length;
    const grey = []; for (const k in DIALOGUE) { if (!/^m1[0-5]|^m9/.test(k)) continue; for (const l of DIALOGUE[k] || []) if (/grey (saloon|corolla|one|car)/i.test(l.text || '')) grey.push(k); }
    return { grey, other, keys: mine.length, speakers: [...spk].filter(x => /OSAGIE|EFE|COKER/.test(x)),
      n: { bassey: f(/Bassey/g), okon: f(/\bOkon\b/g), danjuma: f(/Danjuma/g), oke: f(/\bOke\b/g), hauwa: f(/Hauwa/g), mamaEfe: f(/Mama Efe/gi), cyber: f(/Lagos Cybercrime/g), osagie: f(/Osagie/g),
        grace: f(/\bGrace\b/g), coker: f(/Coker/gi), tari: f(/\bTari\b/g), ebi: f(/\bEbi\b/g), tamuno: f(/Tamuno/gi), divine: f(/Divine Grace/g), harbour4: f(/\b4B? Harbour/g),
        tide: f(/PORT HARCOURT TIDE/g), akaeze: f(/Akaeze/g), antifraud: f(/anti-fraud/g), ransom: f(/kidnapping for ransom/g), plate: f(/ABJ-418KD/g), jeep: f(/black jeep/g), aks: f(/\bAKS\b/g), arrow: f(/←/g) } };
  }, MY_KEYS);
  out('grey_cars', names.grey); out('names', names.n);
  check('CN09/cars', names.grey.length === 0 && names.n.plate === 0 && names.n.jeep === 0, JSON.stringify(names.grey));
  check('CN10/CN15/CN21/names', names.keys > 150 && Object.values(names.n).every(v => v === 0) && names.speakers.length === 0, names.keys + ' text-team keys; ' + JSON.stringify(names.n) + ' speakers:' + names.speakers.join(','));
  check('CN10/other-teams', names.other.length === 0 ? true : 'SKIP', names.other.length === 0 ? 'no old names in the other teams\' DIALOGUE keys' : 'needs core/screens: ' + names.other.join(' | '));

  // ---------- CN07 / CN17 / CN18 / CN19 / CN20 / CN04 court and dialogue strings ----------
  const ct = await T.ev(() => {
    const C = V13.COURT_DATA, J = JSON.stringify(C);
    const cross = id => C.cross.find(a => a.id === id) || {};
    return { count1: C.charge.count1, j: J, osa: (DIALOGUE.m9_osagie || [])[2].text, rep: (DIALOGUE.m9_osagie || [])[1].text, repU: (DIALOGUE.m9_osagie_unproven || [])[1].text,
      refuse: (DIALOGUE.m13_dg_refuse || []).map(l => l.text).join(' '), dgo: (DIALOGUE.m9_dgo || [])[0].text,
      unq: (cross('adaeze_unproven').q || [])[0], una: ((cross('adaeze_unproven').answers || [])[0] || {}).text,
      dock: PUZZLES.m13_docket.screen, unit: (DIALOGUE.m13_dg || []).map(l => l.text).join(' ') + (DIALOGUE.m13_dg_offer_wire || []).map(l => l.text).join(' '),
      flagTxt: (V13.AFTER.m13.headline({ game: { moralChoices: { s2_ninth: 'bury' } } }) || {}).head };
  });
  check('CN07/count1', /to wit: the theft of crude oil, and thereby committed an offence/.test(ct.count1) && !/ransom/i.test(ct.count1), 'Count One');
  check('CN17', ct.j.includes("posting letter to the Lagos unit, signed by Commander Adaeze") && !ct.j.includes("'C. Adaeze, Commander'"), 'the posting letter');
  check('CN18', /^I've read your report on Ekosodin\. Twice\./.test(ct.rep) && /^I've read your report on Ekosodin/.test(ct.repU) && ct.j.includes("written report to Benin Zonal Command on the night of Ekosodin"), 'no sealed report assumed');
  check('CN19', /a commander relieved of command without this office's authority/.test(ct.refuse), 'relieved, not arrested');
  check('CN04/osagie-line3', /^Adaeze's trial took what it needed from that drive: the payroll folder, on certified printouts\./.test(ct.osa) && ct.j.includes('since it came back from the registry') && !/same ledger/.test(ct.j), ct.osa.slice(0, 80));
  check('CN04/fateText-anchors', /^Agent, you accused your own commander\./.test((ct.unq || {}).text || '') && /^She was never charged\.|^The court discharged her\./.test(ct.una || ''), 'q[0] / answers[0] of adaeze_unproven kept');
  check('CN08/m9_dgo', /^C\.A\. again\. Not the Foundation's retainer on the first/.test(ct.dgo) && /two paymasters/.test(ct.dgo), ct.dgo.slice(0, 80));
  check('CN20/court', ct.j.includes('Twenty-two years. He carries the register') && ct.j.includes('Everyone we found there. Nine.') && ct.j.includes('nine entries, one charge') && ct.j.includes('a mother of two')
    && ct.j.includes('dated the day before that meeting') && ct.j.includes("Before noon I'd been told") && ct.j.includes('I was suspended the morning I refused'), 'Ikpe 22, nine arrests, mother of two, promotion, suspension');
  check('CN20/kuti', ct.dock.includes('Mr. A. Kuti') && ct.dock.includes('signed for the DG: A.K.') && ct.dock.includes('signed: A.K.') && ct.dock.includes('— A.K.'), 'Kuti on the docket');
  check('CN16/unit', /command of Lagos Cyber & Financial Crimes — your old unit/.test(ct.unit) && ct.j.includes('Head of Lagos Cyber and Financial Crimes') && ct.flagTxt === 'Ekosodin Officer Promoted to Head Lagos Cyber & Financial Crimes', ct.flagTxt);
  check('R23/akaeze', !/Akaeze/.test(ct.j) && ct.j.includes('The Supreme Court has held both requirements mandatory') && ct.j.includes('The Supreme Court\'s ruling binds this court'), 'no invented case name');
  const heads = await T.ev(() => [V13.AFTER.m12.headline({ game: { moralChoices: {} } }).pub, V13.AFTER.m15.headline({ game: { moralChoices: { s2_end: 'truth' }, s2: {} } }).pub,
    V13.AFTER.m15.headline({ game: { moralChoices: { s2_end: 'truth' }, s2: { finale: 'proven' } } }).ded]);
  check('R23/CN02/headlines', heads[0] === 'THE WATERFRONT HERALD' && heads[1] === 'THE WATERFRONT HERALD' && /inside the anti-corruption agency/.test(heads[2]), heads.join(' | ').slice(0, 200));

  // ---------- the reviewers' other canon checks (other teams' halves): reported, not owned ----------
  const awards = await T.ev(() => {
    try { if (typeof _ach !== 'undefined') for (const k in _ach) delete _ach[k]; } catch (e) {}
    try { if (typeof openRecords === 'function') openRecords(); renderRecords('awards'); } catch (e) { return { err: String(e) }; }
    const b = document.getElementById('records-body'); const t = b ? b.innerText : '';
    try { showOverlay(null); } catch (e) {}
    return { adaeze: /adaeze/i.test(t) };
  });
  out('fresh_awards', awards);
  check('CN01/awards', awards.adaeze === false ? true : 'SKIP', awards.adaeze === false ? 'no Adaeze on a fresh awards tab' : 'needs screens (s2_case15.js achievements)');
  const merge = await T.ev(() => {
    const g = S.game; g.moralChoices = { finale: 'contested', asaba: 'rescue' }; g.flags = { finale: 'contested' }; g.s2 = null;
    try { I().court = { w: { c1: 2 }, proven: ['c1'], admitted: [], struck: [], cred: {}, finale: 'contested', at: 1 }; } catch (e) {}
    try { V13.s2(); V13.adaptS1Fate(); } catch (e) { return { err: String(e) }; }
    return { fin: g.moralChoices.finale, s1fate: (g.s2 || {}).s1fate || null };
  });
  out('s1_fate_overwrite', merge);
  check('CN13/merge', merge.fin === 'contested' ? true : 'SKIP', merge.fin === 'contested' ? 'moralChoices.finale untouched' : 'needs screens (s2_merge.js adaptS1Fate)');

  console.log(`CHECKS ${pass}/${total}` + (skip ? ` (${skip} skipped)` : ''));
};
export { probe as 'module.exports' };
