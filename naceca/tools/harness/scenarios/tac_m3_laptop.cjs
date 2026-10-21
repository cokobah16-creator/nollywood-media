// tac_m3_laptop: the laptop files (DESIGN §5.4; mansion.md §1.7, §3.9). The wipe shreds burner_logs 10%, obi_contacts
// 20%, ledger_q3 40%, transfers_lekki 55%, sim_batch_07 70%, pos_agents 85%, wallet_seed 100%: halts at 0, .09, .19,
// .39, .41, .99 keep 7, 7, 6, 5, 4, 1 files; a seizure (the wipe never started) keeps 7; a loss keeps 0. Exactly one
// custody line ("Imaged by forensics: N of 7 files recovered"), only on a real halt or a seizure. The Week-1 drives
// lead branches (the ledger kept / the safe drives / no flags / thin). No field skill while the wipe is pending; "Pull
// the plug early" done on a seizure; the staged reach (ENGINE.seq) goes to (2.38, −1.02). The aftermath row.
// Owner: Team C.
const L = require('./tac_m3_lib.cjs');

const CUSTODY = /^Imaged by forensics: (\d) of 7 files recovered$/;

module.exports = async h => {
  try {
    // ---------- halts by percentage (timers off: the wipe stands still while the field skill is open) ----------
    const cases = [[0, 7], [0.09, 7], [0.19, 6], [0.39, 5], [0.41, 4], [0.99, 1]];
    for (const [f, n] of cases) {
      await L.v8(h);
      await L.breach(h, { entry:'knock' });
      await h.ev(f => { const R = TAC.m3.run(); __m3.run(1.2); window.__timed0 = SETTINGS.timed; SETTINGS.timed = 'off'; S.game._wipeT = f * S.game._wipeTotal; return R.wipe.mode; }, f);
      const r = await L.laptop(h);
      await h.ev(() => { SETTINGS.timed = window.__timed0; });
      const cus = r.custody.filter(t => CUSTODY.test(t));
      h.log('halt at', f, JSON.stringify({ mg:r.mg, files:r.files, pct:r.pct, ledger:r.ledger, cus, screen:r.screen }));
      h.assert(r.mg && r.ev && r.screen === 'halted', `halt at ${f}: through the field skill, the laptop bagged`);
      h.assert(r.files === n && r.pct === Math.round(f * 100), `halt at ${f}: ${n} files (got ${r.files}, ${r.pct}%)`);
      h.assert(r.ledger === (f < 0.4), `halt at ${f}: the ledger ${f < 0.4 ? 'kept' : 'shredded'}`);
      h.assert(cus.length === 1 && +CUSTODY.exec(cus[0])[1] === n, `halt at ${f}: exactly one custody line: ` + JSON.stringify(cus));
      const le = (await L.ev(h, 'enc')).filter(e => e[1].enc === 'm3_laptop').map(e => e[1]);
      h.assert(le.length === 1 && le[0].outcome === 'halted' && le[0].files === n && le[0].pct === Math.round(f * 100) && le[0].mg === true && le[0].total === 55, `enc m3_laptop{halted}: ` + JSON.stringify(le));
      if (f === 0.39) {
        // a second collectEvidence('laptop') adds no second line
        const again = await h.ev(() => { collectEvidence({ id:'laptop', name:'Encrypted Laptop', xp:0 }); return I().items.laptop.custody.filter(c => /files recovered/.test(c.t)).length; });
        h.assert(again === 1, 'no second custody line');
      }
      await L.restore(h);
    }

    // ---------- seized: Obi stopped cold, the wipe never started; the staged reach; Pull the plug early ----------
    await L.v8(h);
    await L.breach(h, { entry:'quiet' });
    const pend = await h.ev(() => { const R = TAC.m3.run();
      __m3.walk([[0.4,4.9],[0.5,2.6],[3.6,2.7],[3.9,1.5]], 1.25, { crouch:true });
      const it = ENGINE.interactables.find(i => i.label === 'Move on suspect'); it.onInteract(it);
      return { outcome:R.obi.outcome, wipe:R.wipe.mode, total:S.game._wipeTotal }; });
    h.assert(pend.outcome === 'cold' && pend.wipe === 'never' && pend.total === 0, 'the flank, then a cold grab: the wipe never starts');
    await L.finishDialogue(h); await L.choose(h, 0); await L.finishDialogue(h);
    // no field skill while pending
    const ready = await h.ev(() => { const hk = MQ_HOOKS.m3.find(x => x.id === 'm3_wipe'); return hk.ready(); });
    h.assert(ready === false, 'KILL THE WIPE is not ready while no wipe exists');
    const sz = await L.laptop(h, { seq:true });
    await h.ev(() => __m3.run(0.3));
    const plug = await h.ev(() => (S.game._sq && S.game._sq.st && S.game._sq.st.m3_plug) || null);
    h.log('seized', JSON.stringify(sz), 'plug', plug);
    h.assert(sz.seq && sz.seq.spot[0] === 2.38 && sz.seq.spot[1] === -1.02 && sz.seq.clip === 'interact', 'the staged reach: ENGINE.seq to (2.38, −1.02), the interact clip');
    h.assert(!sz.mg && sz.ev && sz.files === 7 && sz.pct === 0 && sz.screen === 'seized', 'seized: no field skill, all 7 files, the SEIZED screen');
    h.assert(sz.toasts.some(t => t[0] === 'LAPTOP SEIZED' && t[1] === 'The wipe never started. All 7 files intact.'), 'LAPTOP SEIZED · "The wipe never started. All 7 files intact."');
    h.assert(sz.custody.filter(t => CUSTODY.test(t)).length === 1 && sz.custody.includes('Imaged by forensics: 7 of 7 files recovered'), 'one custody line: 7 of 7');
    h.assert(plug === 'done', '"Pull the plug early" resolves done on a seizure');
    let le = (await L.ev(h, 'enc')).filter(e => e[1].enc === 'm3_laptop').map(e => e[1]);
    h.assert(le.length === 1 && le[0].outcome === 'never_started' && le[0].files === 7 && le[0].mg === false, 'enc m3_laptop{never_started}');
    // the aftermath row (the child walked out first, so the extraction completes)
    await L.childTalk(h, 0);
    await h.ev(() => __m3.run(12, () => TAC.m3.child().state === 'out'));
    const ex = await L.extract(h, 900);
    const row = await h.ev(() => [...document.querySelectorAll('#aftermath-grid .stat-row')].map(r => r.textContent.replace(/\s+/g, ' ').trim()).filter(t => /Laptop files/.test(t)));
    h.log('aftermath', JSON.stringify(ex), JSON.stringify(row));
    h.assert(ex.done && row.length === 1 && /Laptop files recovered\s*7 \/ 7/.test(row[0]), 'the aftermath row: "Laptop files recovered · 7 / 7"');
    await L.restore(h);

    // ---------- the laptop pressed in his view (wipe pending): he sees it, no seizure ----------
    await L.v8(h);
    await L.breach(h, { entry:'quiet' });
    const iv = await h.ev(() => { const R = TAC.m3.run(); const it = ENGINE.interactables.find(i => i.label === 'Inspect laptop');
      ENGINE.player.position.x = 2.6; ENGINE.player.position.z = 0.6; it.onInteract(it);
      return { obi:R.obi.state, alertedBy:R.obi.alertedBy, ev:!!S.game._evLaptop, why:R.w.state.whyPast, mg:!!MINI.active }; });
    const it2 = await L.toasts(h);
    h.log('reach in his view', JSON.stringify(iv), JSON.stringify(it2));
    h.assert(iv.obi === 'reaching' && iv.alertedBy === 'sight' && !iv.ev && !iv.mg, 'pressing Inspect laptop in his view alarms him at once; nothing is seized');
    h.assert(it2.some(t => t[0] === 'HE SAW YOU' && t[1] === 'He saw you reach for his laptop' && t[1] === iv.why), 'HE SAW YOU · "He saw you reach for his laptop" (whyPast verbatim)');
    await L.restore(h);

    // ---------- lost: the wipe ran out ----------
    await L.v8(h);
    await L.breach(h, { entry:'knock' });
    const lost = await h.ev(() => { __m3.run(1.2); S.game._wipeT = S.game._wipeTotal - 0.01; __m3.run(0.5); return { lost:!!S.game._wipeLost, files:S.game.flags.m3_files, pct:S.game.flags.m3_wipe_pct }; });
    h.log('lost', JSON.stringify(lost));
    h.assert(lost.lost && Array.isArray(lost.files) && lost.files.length === 0 && lost.pct === 100, 'lost: 0 files');
    le = (await L.ev(h, 'enc')).filter(e => e[1].enc === 'm3_laptop').map(e => e[1]);
    h.assert(le.length === 1 && le[0].outcome === 'lost' && le[0].files === 0, 'enc m3_laptop{lost}');
    const noCus = await h.ev(() => { const it = I().items.laptop; return it ? it.custody.filter(c => /files recovered/.test(c.t)).length : 0; });
    h.assert(noCus === 0, 'no custody line without a halt or a seizure');

    // ---------- the drives lead: today's text unless the ledger is gone and nothing backs it up ----------
    const dl = await h.ev(() => {
      const lead = BRIEFINGS.m3.leads.find(l => l.id === 'drives'), out = {}, f = S.game.flags;
      f.m3_files = ['burner_logs.zip', 'obi_contacts.vcf', 'ledger_q3.xlsx']; out.ledger = [lead.res, lead.intel];
      f.m3_files = ['transfers_lekki.pdf', 'sim_batch_07.db', 'pos_agents.csv', 'wallet_seed.txt']; out.thin = [lead.res, lead.intel];
      delete f.m3_files; out.none = [lead.res, lead.intel];
      f.m3_files = ['wallet_seed.txt']; collectEvidence({ id:'safe_drives', name:'Encrypted Hard Drives', xp:0 }); out.safe = [lead.res, lead.intel];
      delete f.m3_files;
      return out;
    });
    h.log('drives lead', JSON.stringify(dl));
    const TODAY = "The spreadsheet repeats Obi's notebook";
    h.assert(dl.ledger[0].startsWith(TODAY) && dl.ledger[1] === 10, 'the ledger kept: today\'s text, +10');
    h.assert(dl.none[0].startsWith(TODAY) && dl.none[1] === 10, 'no flags (an old save): today\'s text, +10');
    h.assert(dl.safe[0].startsWith(TODAY) && dl.safe[1] === 10, 'the safe drives exist: today\'s text, +10');
    h.assert(dl.thin[0] === "The ledger was shredded. Forensics rebuilt 4 of Obi's files, but nothing left in them ties a payment to a name." && dl.thin[1] === 4, 'thin: worded from the survivors, +4: ' + dl.thin[0]);
    const A = require('./v13_a_lib.cjs').lib(h);
    await A.textRules([dl.thin[0], 'Imaged by forensics: 7 of 7 files recovered', 'The wipe never started. All 7 files intact.'], 'the files strings');
    h.assert(!h.errors.length, 'no page errors: ' + h.errors.join(' | '));
  } finally { await L.restore(h); }
};
