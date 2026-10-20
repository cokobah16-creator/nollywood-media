// text team: Season 2 reads Season 1 through the snapshot (V13.s1snap, S.game.s2.s1snap), on the built page.
// The review's TX1-TX4 as CHECK lines:
//   TX1  a Season 1 Musa who talked (flip_driver, or tail_driver + musa_tip) drives the Season 3 stinger's truck and
//        texts after m14, through the snapshot the first Season 2 load takes (V13.s1snapTake) — this checks core's
//        snapshot too: Season 1's rule is V12.who.musaTalked(), not V12.mem() (the plain store);
//   TX3  the stinger, Musa's, KC's and Tunde's texts and the ninth floor's Lekki drawer all follow the snapshot when
//        the live Season 1 values say otherwise (a Season 1 replay during Season 2), both ways round;
//   TX4  the Case 09 bench and Tobi's text say "the inquiry" when Season 1 never charged Adaeze, played through the
//        real renderDialogueLine (core's line fields) on Senior;
//   TX2  what Case 10 radios for Uche's arrival (each line's plain text, s2_case10.js) names no kiosk in any mode.
// Run: run_probe.sh <build> text_snapshot desktop <log>. On a page without core's contract (V13.s1snap,
// V13.s1snapTake, V13.lineFields) the helpers are polyfilled with core's semantics and the checks that need the
// real thing print SKIP. (An ES module: the repo's package.json says "type":"module".)
const probe = async function (T) {
  let pass = 0, total = 0, skip = 0;
  const check = (id, ok, detail) => {
    if (ok === 'SKIP') { skip++; console.log(`CHECK ${id} SKIP ${detail}`); return; }
    total++; if (ok) pass++;
    console.log(`CHECK ${id} ${ok ? 'PASS' : 'FAIL'} ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`.slice(0, 900));
  };
  const env = await T.ev(() => {
    const done = [];
    const MCf = () => (S.game && S.game.moralChoices) || {};
    const live = () => { const g = S.game || {}, m = MCf();
      let w = null; try { w = typeof _cwWrong === 'function' ? _cwWrong('lagos') : null; } catch (e) {}
      let musa = false; try { musa = !!(V12.who && V12.who.musaTalked && V12.who.musaTalked()); } catch (e) {}
      return { tobiAlive: m.asaba === 'rescue' || (m.asaba === 'chase' && !g._asabaHostageLost), tobiTestifies: m.asaba === 'rescue', bribe: m.arrest === 'bribe',
        kcFair: m.market_runner === 'caught' && m.choice !== 'force', kcWrong: w === 'kc', tundeWrong: w === 'tunde', musaTalked: musa }; };
    const native = { s1snap: typeof V13.s1snap === 'function', take: typeof V13.s1snapTake === 'function', lineFields: typeof V13.lineFields === 'function', s1fate: typeof V13.s1fate === 'function' };
    if (!native.s1snap) { V13.s1snap = () => ((S.game.s2 || {}).s1snap) || live(); done.push('s1snap'); }
    if (!native.take) { V13.s1snapTake = () => { const s = S.game.s2 || (S.game.s2 = {}); if (!s.s1snap) s.s1snap = live(); return s.s1snap; }; done.push('s1snapTake'); }
    if (!native.s1fate) { V13.s1fate = () => ((S.game && S.game.s2) || {}).s1fate || MCf().finale || 'unproven'; done.push('s1fate'); }
    if (typeof V13.tobiAlive !== 'function') { V13.tobiAlive = () => !!V13.s1snap().tobiAlive; done.push('tobiAlive'); }
    window.__condOk = c => { try { return !!(new Function('S', 'return (' + c + ')'))(S); } catch (e) { return false; } };
    window.__set = (mc, fl, extra) => {
      const g = S.game; g.moralChoices = Object.assign({}, mc || {}); g.flags = Object.assign({}, fl || {});
      g._asabaHostageLost = false; g.accusations = (extra && extra.acc) || {};
      g.s2 = Object.assign({ trial: {}, sources: {}, hubs: {} }, (extra && extra.s2) || {});
      if (S.player && S.player.reputation) S.player.reputation.underworldHeat = 20;
    };
    // what Season 2 shows for the Season 1 branches, read now
    window.__read = () => {
      const st = V13.STINGER_S2, all = st.lines.join(' ');
      const musa = (V13.PHONE.after_m14 || []).find(m => m.who === 'MUSA') || {}, kc = (V13.PHONE.after_m13b || []).find(m => m.who === 'KC') || {};
      const tunde = (V13.PHONE.after_m10 || []).find(m => m.who === 'TUNDE') || {};
      let drawer = null; try { const k = V13.C.ninth([]); drawer = (DIALOGUE[k] || []).some(l => /Chief Obi's drawer/.test(l.text || '')); } catch (e) { drawer = 'err ' + e; }
      return { stingerMusa: /\bMusa ties down the tarp/.test(all) && /^Musa lifts the corner/.test(st.lines[2]), stingerDriver: /The cooperative's newest driver ties down/.test(all) && !/\bMusa\b/.test(all),
        musa: __condOk(musa.cond || 'true'), kc: __condOk(kc.cond || 'true'), tunde: __condOk(tunde.cond || 'true'), drawer,
        conds: { musa: musa.cond, kc: kc.cond, tunde: tunde.cond } };
    };
    return { native, done };
  });
  T.log('core contract on this page:', JSON.stringify(env.native), '· polyfilled:', env.done.join(', ') || 'none');

  // ---------- TX1: the snapshot the first Season 2 load takes, for a Musa who talked ----------
  for (const [label, mc, fl, talked] of [['flip_driver', { checkpoint: 'flip_driver' }, {}, true], ['tail+tip', { checkpoint: 'tail_driver' }, { musa_tip: true }, true],
                                         ['arrest_driver', { checkpoint: 'arrest_driver' }, {}, false], ['tail-no-tip', { checkpoint: 'tail_driver' }, {}, false]]) {
    const r = await T.ev(([mc, fl]) => {
      __set(mc, fl);
      const who = !!(V12.who && V12.who.musaTalked && V12.who.musaTalked());
      V13.s1snapTake();                                        // what the first Season 2 case or office load does
      const snap = (S.game.s2.s1snap || {}).musaTalked, now = __read();
      // a Season 1 replay afterwards flips the live value: Season 2 keeps what it took
      S.game.moralChoices.checkpoint = who ? 'arrest_driver' : 'flip_driver'; S.game.flags.musa_tip = !who;
      const later = __read();
      return { who, snap, now, later };
    }, [mc, fl]);
    T.log(label, JSON.stringify(r));
    const ok = talked ? (r.now.stingerMusa && r.now.musa) : (r.now.stingerDriver && !r.now.musa);
    check('TX1/' + label, r.who === talked && r.snap === talked && ok && r.later.stingerMusa === r.now.stingerMusa && r.later.musa === r.now.musa,
      `V12.who.musaTalked()=${r.who}; snapshot musaTalked=${r.snap}; stinger names Musa: ${r.now.stingerMusa}; Musa texts: ${r.now.musa}; after a replay: ${r.later.stingerMusa}/${r.later.musa}`
      + (env.native.take ? '' : ' (snapshot polyfilled: core\'s s1snapTake not on this page)'));
  }

  // ---------- TX3: the snapshot wins over the live Season 1 values, both ways round ----------
  const acc = who => ({ lagos: { suspect: who, ok: { suspect: false }, settled: true } });
  const both = await T.ev(([accKc]) => {
    const out = {};
    // snapshot: Musa talked, KC fair and not held, Tunde not held, no bribe. Live: the opposite of every one.
    __set({ checkpoint: 'arrest_driver', market_runner: 'caught', choice: 'force', arrest: 'bribe' }, {}, { acc: accKc,
      s2: { s1snap: { tobiAlive: true, tobiTestifies: true, bribe: false, kcFair: true, kcWrong: false, tundeWrong: false, musaTalked: true } } });
    out.liveWrong = typeof _cwWrong === 'function' ? _cwWrong('lagos') : null;
    out.good = __read();
    // snapshot: Musa jailed, KC and Tunde held, Lekki bribe. Live: every one fine.
    __set({ checkpoint: 'flip_driver', market_runner: 'caught', choice: 'flip', arrest: 'lawful' }, { musa_tip: true }, {
      s2: { s1snap: { tobiAlive: true, tobiTestifies: true, bribe: true, kcFair: true, kcWrong: true, tundeWrong: true, musaTalked: false } } });
    out.bad = __read();
    return out;
  }, [acc('kc')]);
  T.log('snapshot vs live:', JSON.stringify(both));
  check('TX3/musa', both.good.stingerMusa && both.good.musa && both.bad.stingerDriver && !both.bad.musa, `stinger and text agree with the snapshot: ${both.good.stingerMusa}/${both.good.musa} · ${both.bad.stingerDriver}/${!both.bad.musa}`);
  check('TX3/kc', both.good.kc === true && both.bad.kc === false, `live _cwWrong('lagos')=${both.liveWrong}, snapshot kcWrong=false → KC texts: ${both.good.kc}; snapshot kcWrong=true → ${both.bad.kc}`);
  check('TX3/tunde', both.good.tunde === true && both.bad.tunde === false, `snapshot tundeWrong=false → ${both.good.tunde}; true → ${both.bad.tunde}`);
  check('TX3/lekki-drawer', both.good.drawer === false && both.bad.drawer === true, `snapshot bribe=false, live 'bribe' → drawer lines: ${both.good.drawer}; snapshot bribe=true → ${both.bad.drawer}`);
  check('TX3/conds-read-the-snapshot', Object.values(both.good.conds).every(c => /V13\.s1snap\(\)/.test(c || '') && !/_cwWrong|moralChoices|musa_tip/.test(c || '')), JSON.stringify(both.good.conds));

  // ---------- TX4: the Case 09 bench through the real line fields, on Senior ----------
  const play = (key, fin, dis) => T.ev(([key, fin, dis]) => {
    __set({ asaba: 'rescue', finale: fin }, {}, { s2: { s1fate: fin, adaezeDischarged: dis ? 1 : undefined } });
    S.game.difficulty = 'senior';
    try { showOverlay(null); } catch (e) {}
    DLG.queue = [];
    const seen = []; let n = 0;
    startDialogue(key, () => {});
    while (DLG.script && DLG.idx < DLG.script.length && n++ < 60) {
      const l = DLG.script[DLG.idx]; seen.push((l.speaker || '') + ': ' + (l.text || ''));
      if (l.choices && l.choices.length) { seen.push('[choices]'); break; }
      advanceDialogue();
    }
    try { showOverlay(null); } catch (e) {}
    DLG.script = null;
    const t9 = (V13.PHONE.after_m9 || []).filter(m => m.who === 'TOBI' && /^Eleven days/.test(m.text) && __condOk(m.cond)).map(m => m.text);
    return { seen, t9 };
  }, [key, fin, dis]);
  if (!env.native.lineFields) check('TX4/rendered', 'SKIP', 'needs core (V13.lineFields, the renderDialogueLine wrap); text_branches checks the conds');
  else {
    for (const [v, fin, dis] of [['proven', 'proven', 0], ['contested', 'contested', 0], ['discharged', 'unproven', 1], ['never-charged', 'unproven', 0]]) {
      const b = await play('m9_tobi_bench', fin, dis), g = await play('m9_forensic_igbinosa', fin, dis);
      const text = b.seen.concat(g.seen).join(' | ') + ' | ' + b.t9.join(' ');
      const inquiry = v === 'never-charged';
      const ok = b.seen.length === 3 && g.seen.filter(x => /^MR\. IGBINOSA: It took this bench/.test(x)).length === 1 && b.t9.length === 1 && (inquiry
        ? (text.match(/the inquiry/g) || []).length >= 4 && !/\btrial\b|prosecution|case against her/.test(text)
        : /read the payroll for the trial/.test(text) && /for the prosecution, and I never/.test(text) && /for the case against her\. We printed what the prosecution/.test(text) && /payroll for the trial and I never/.test(text) && !/inquiry/.test(text));
      check('TX4/' + v, ok, text.slice(0, 420));
    }
  }

  // ---------- TX2: Uche's arrival as Case 10 radios it (plain text), in every mode ----------
  const radio = await T.ev(() => ['senior', 'recruit'].map(d => { S.game.difficulty = d; return (DIALOGUE.m10_lucky_arrives || []).map(l => l.text); }));
  check('TX2/radio-text', radio.every(L => L.length >= 1 && L.every(t => !/kiosk|T4|blue board/i.test(t))), 'radioed on Senior: ' + radio[0].join(' | '));

  console.log(`CHECKS ${pass}/${total}` + (skip ? ` (${skip} skipped)` : ''));
};
export { probe as 'module.exports' };
