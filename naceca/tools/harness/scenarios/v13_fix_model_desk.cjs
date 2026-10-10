// v13 review fixes (model / data), the Case Desk surfaces. Each block fails on the build before the fix.
//   node tools/harness/run.cjs tools/harness/scenarios/v13_fix_model_desk.cjs --html <build>/naceca.html
// R13  Recruit at h2 (Lagos sheet filed, Lekki not raided): Obi's account — which quotes his notebook and names the
//      Foundation — is not on the trail until Lekki is behind you or the notebook is in hand
// R14  Case 02: no name search finds the Zuma Court companies, so nothing builds the cluster on day one
// R20  Musa's phone: no "until you sit down with him" card once the sit-down can't happen (tail, dropped, missed)
// R21  exhibit sources agree with the base game (Osas's shoe; the cash and the notebook on the living-room table)
// R31  Senior: the dead-end money line's name doesn't say "school fees" before the request is spent
module.exports = async h => {
  // V13FIX_SOFT=1 lists every failing check instead of stopping at the first (to show what a build before the fixes gets wrong)
  const soft = process.env.V13FIX_SOFT === '1', fails = [];
  const check = (c, m) => { if(c) return; if(!soft) h.assert(c, m); fails.push(m); h.log('CHECK FAILED: ' + m); };
  const LAGOS = { suspect:'obi', method:'alerts', money:'wallet', ok:{ suspect:true, method:true, money:true }, warrant:'signed', settled:'m3' };
  const desk = (tab, fn) => h.ev(([tab, fn]) => { openDesk(tab); if(fn) (new Function(fn))(); renderDesk(); const t = document.getElementById('desk-body').innerText; closeDesk(); return t; }, [tab, fn || null]);

  // ================= R13: Recruit, the h2 office =================
  await h.start('m3', { completed:['m0', 'm1', 'm2'], wait:3600, state:S => { S.game.difficulty = 'recruit'; S.game.evidence = [{ id:'phishing_template', name:'Phishing Template' }]; } });
  const r13 = await h.ev(() => {
    if(typeof syncDifficultyClass === 'function') syncDifficultyClass();
    const out = { cur:S.game.currentMission };
    CW.file('lagos', { suspect:'obi', method:'alerts', money:'wallet' }, { warrant:'signed' });
    collectEvidence({ id:'phishing_template', name:'Phishing Template', xp:0 });
    flagClue('kc_bank_150k', true);
    out.traced = ['n_kc', 'n_odogwu', 'n_obi'].map(id => [id, moneyTrace(id)]);
    out.listed = !!I().money.unlocked.n_obi;
    out.gate = intelMoneyGate('n_obi');
    openDesk('money'); renderDesk(); out.text = document.getElementById('desk-body').innerText; closeDesk();
    out.notebook = intelHas('obi_notebook');
    return out;
  });
  h.log('R13 h2:', JSON.stringify(Object.assign({}, r13, { text:r13.text.replace(/\s+/g, ' ').slice(0, 300) })));
  check(/^h2$|^m3$/.test(r13.cur) && !r13.notebook, 'R13: (Lekki not raided, no notebook)');
  check(r13.traced[0][1] && r13.traced[1][1], 'R13: (KC and Odogwu Ventures trace)');
  check(!r13.traced[2][1] && !r13.listed && !r13.gate, 'R13: Obi\'s account can\'t be listed or traced before Lekki');
  check(!/notebook|Ugbowo Relief Foundation|"C\.A\."/.test(r13.text) && !/Chief Obi — Lekki account/.test(r13.text), 'R13: the MONEY tab neither quotes the notebook nor names the Foundation before Lekki');
  check(/Owner's sister/.test(r13.text) && /Three OTC desks/.test(r13.text), 'R13: (the other lines from Odogwu Ventures are listed)');
  // a save from before the fix that already listed the account goes back to waiting
  const old = await h.ev(() => { const m = I().money; m.unlocked.n_obi = true; delete (m.waiting || {}).n_obi; if(typeof moneySync === "function") moneySync(); return { listed:!!m.unlocked.n_obi, waiting:!!(m.waiting || {}).n_obi }; });
  check(!old.listed && old.waiting, 'R13: an early-listed account from an older save waits for Lekki too');
  // the notebook comes off the coffee table: the account joins the trail at once
  const nb = await h.ev(() => {
    collectEvidence({ id:'obi_notebook', name:"Obi's Notebook", xp:0 });
    const listed = !!I().money.unlocked.n_obi, ok = moneyTrace('n_obi');
    openDesk('money'); renderDesk(); const text = document.getElementById('desk-body').innerText; closeDesk();
    return { listed, ok, charity:!!I().money.unlocked.n_charity, text };
  });
  check(nb.listed && nb.ok && nb.charity && /the "C\.A\." line in his notebook/.test(nb.text), 'R13: with the notebook in hand, Obi\'s account is listed, traced and leads on to the Foundation');
  // the same trail with Lekki behind you and no notebook (a branch that never bagged it)
  await h.start('m3', { completed:['m0', 'm1', 'm2'], wait:3600, state:S => { S.game.difficulty = 'recruit'; S.game.evidence = [{ id:'phishing_template', name:'Phishing Template' }]; } });
  const after = await h.ev(() => {
    CW.file('lagos', { suspect:'obi', method:'alerts', money:'wallet' }, { warrant:'signed' });
    collectEvidence({ id:'phishing_template', name:'Phishing Template', xp:0 });
    flagClue('kc_bank_150k', true); moneyTrace('n_kc'); moneyTrace('n_odogwu');
    const before = !!I().money.unlocked.n_obi;
    S.game.completedMissions.push('h2', 'm3'); intelOnMissionEnd('m3');
    return { before, listed:!!I().money.unlocked.n_obi, ok:moneyTrace('n_obi') };
  });
  check(!after.before && after.listed && after.ok, 'R13: once Lekki is done, the waiting account is listed and traceable');

  // ================= R14: Case 02, the register =================
  await h.start('m2', { completed:['m0', 'm1'] });
  const reg = await h.ev(() => {
    const out = {};
    for(const q of ['Bluewater', 'apex', 'serpentine', 'ugbowo', 'zuma', 'ltd', 'foundation', 'odogwu']) out[q] = regSearch(q);
    out.cluster = intelHas('zuma_cluster'); out.found = Object.keys(I().reg.found);
    // the model's address search on its own (no card to start it from in Case 02) still never lists C.A.
    out.addrNoCa = !regAtAddress(ZUMA).includes('ca');
    delete I().flags.zuma_cluster; delete I().flags.one_office_due; I().reg.found = {};
    return out;
  });
  h.log('R14 Case 02:', JSON.stringify(reg));
  check(['Bluewater', 'apex', 'serpentine', 'ugbowo', 'zuma', 'ltd', 'foundation'].every(q => !reg[q].some(k => ['bluewater', 'apex', 'serpentine', 'urf', 'ca', 'silverline'].includes(k))), 'R14: no name search in Case 02 finds a Zuma Court company');
  check(reg.odogwu.includes('odogwu'), 'R14: (the Lagos case\'s own company is on the register)');
  check(reg.addrNoCa, 'R14: (the address search never lists C.A. Consulting in Case 02)');
  // through the desk, the way the finding played it: the example search finds nothing and builds nothing
  const ui = await h.ev(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    showOverlay(null); showHUD(true); ENGINE.movementEnabled = true;
    document.getElementById('cb-ev').click(); await sleep(100);
    deskDo('goto', { tab:'registry' }); await sleep(50);
    document.getElementById('reg-q').value = 'Bluewater'; DESK.regQ = 'Bluewater'; deskDo('reg-search'); await sleep(50);
    const r = { hits:(DESK.regHits || []).slice(), cluster:intelHas('zuma_cluster'), slips:document.querySelectorAll('#desk-body .dk-slip').length };
    closeDesk();
    return r;
  });
  check(!ui.hits.length && !ui.slips && !ui.cluster, 'R14: Case 02, "Bluewater" in the REGISTRY tab finds nothing and sets no cluster');
  // after Lekki the Foundation (named in Obi's account) can be found; Bluewater, Apex and Serpentine from Case 04
  const later = await h.ev(() => {
    S.game.completedMissions.push('h2', 'm3', 'm3n');
    const w1 = { urf:regSearch('ugbowo'), bw:regSearch('bluewater') };
    S.game.completedMissions.push('m4');
    const h4 = { bw:regSearch('bluewater'), apex:regSearch('apex'), serp:regSearch('serpentine') };
    const addr = regAtAddress(ZUMA);
    return { w1, h4, addr, cluster:intelHas('zuma_cluster') };
  });
  h.log('R14 later:', JSON.stringify(later));
  check(later.w1.urf.includes('urf') && !later.w1.bw.length, 'R14: after Lekki the Foundation is on the register, Bluewater not yet');
  check(later.h4.bw.includes('bluewater') && later.h4.apex.includes('apex') && later.h4.serp.includes('serpentine'), 'R14: from Case 04 the Zuma Court companies can be found by name');
  check(later.addr.includes('ca') && later.cluster, 'R14: (from Case 04 the address search lists C.A. and finds one office)');

  // ================= R20: Musa's phone =================
  const phones = state => h.ev(state => {
    S.game.completedMissions = ['m0', 'm1', 'm2', 'h2', 'm3', 'm3n', 'm4', 'h4', 'm5', 'h5', 'm6'];
    S.game.moralChoices = Object.assign({}, S.game.moralChoices, { checkpoint:state.checkpoint });
    const d = I(); d.leads = {}; if(state.lead) d.leads.musa = state.lead;
    if(state.briefed !== undefined) d.briefed.m4 = state.briefed;
    if(!(S.game.evidence || []).some(e => e.id === 'ransom_ledger')){ const e = { id:'ransom_ledger', name:'Ransom Route Ledger' }; S.game.evidence.push(e); intelOnEvidence(e); }
    openDesk('phones'); deskDo('phone-back'); const t = document.getElementById('desk-body').innerText;
    const card = !![...document.querySelectorAll('#desk-body .dk-phone-card')].find(b => b.dataset.id === 'musa');
    closeDesk();
    return { t, card };
  }, state);
  const tail = await phones({ checkpoint:'tail_driver', lead:'dropped', briefed:true });
  const tailOpen = await phones({ checkpoint:'tail_driver', briefed:1 });
  const dropped = await phones({ checkpoint:'arrest_driver', lead:'dropped', briefed:true });
  const missed = await phones({ checkpoint:'arrest_driver', briefed:'missed' });
  const owed = await phones({ checkpoint:'arrest_driver', briefed:null });
  const read = await phones({ checkpoint:'flip_driver', lead:'done', briefed:true });
  const SIT = /until you sit down with him/;
  h.log('R20 tail:', tail.t.replace(/\s+/g, ' ').slice(0, 200));
  check(!SIT.test(tail.t) && !SIT.test(tailOpen.t), 'R20: on the tail path no card promises a sit-down (the h4 lead is blocked)');
  check(!SIT.test(dropped.t), 'R20: a dropped sit-down sent the phone back to his family: no card promising one');
  check(!SIT.test(missed.t), 'R20: a save that missed the h4 briefing gets no card promising a sit-down');
  check(SIT.test(owed.t), 'R20: (before the h4 briefing the sit-down is still to come: the card says so)');
  check(read.card && !SIT.test(read.t), 'R20: (after the sit-down the phone is readable)');

  // ================= R21: exhibit sources =================
  await h.start('m8', { completed:['m0', 'm1', 'm2', 'm3', 'm3n', 'm4', 'm5', 'm6', 'm7', 't7'], state:S => { S.game.intel = { briefed:{ m3:1, m4:1, m5:1, m6:1, m7:1 }, items:{} }; } });
  const src = await h.ev(() => {
    ['cash', 'obi_notebook', 'laptop', 'fin_drive'].forEach(id => { if(!V12.hasEv(id)) collectEvidence({ id, name:id, xp:0 }); });
    openDesk('locker');
    const out = {}; document.querySelectorAll('#desk-body .dk-ex').forEach(a => { out[a.dataset.id] = (a.querySelector('.dk-src') || {}).textContent; });
    closeDesk();
    out.osas = (DIALOGUE.fin_osas || []).map(l => l.text).find(t => /shoe/.test(t)) || '';
    return out;
  });
  h.log('R21 sources:', JSON.stringify(src));
  check(/shoe/.test(src.osas) && /shoe/.test(src.fin_drive) && !/pocket/.test(src.fin_drive), 'R21: Osas\'s drive came out of his shoe, as he says in M8');
  check(/living room/.test(src.cash) && /living room/.test(src.obi_notebook) && /beside the cash/.test(src.obi_notebook) && !/study/.test(src.obi_notebook), 'R21: the notebook lay beside the cash, on the living-room coffee table');
  check(/study/.test(src.laptop), 'R21: (the laptop was in the study)');

  // ================= R31: Senior, the money tab before a request is spent =================
  await h.start('m4', { completed:['m0', 'm1', 'm2', 'h2', 'm3', 'm3n'], state:S => { S.game.difficulty = 'senior'; } });
  const money = await h.ev(lagos => {
    S.game.accusations = { lagos };
    const m = I().money; m.open = true; m.req = 4; m.unlocked.n_kc = true;
    moneyTrace('n_kc'); moneyTrace('n_odogwu');
    openDesk('money'); renderDesk();
    const row = id => ((document.querySelector(`#desk-body .dk-mn[data-id="${id}"]`) || {}).innerText || '').replace(/\s+/g, ' ');
    const before = row('n_sister'), trace = !!document.querySelector('#desk-body [data-act="trace"][data-id="n_sister"]');
    moneyTrace('n_sister'); renderDesk();
    const afterT = row('n_sister'); closeDesk();
    return { senior:intelSenior(), before, trace, after:afterT };
  }, LAGOS);
  h.log('R31:', JSON.stringify(money));
  check(money.senior && money.trace, 'R31: (Senior, the line is untraced with its TRACE button)');
  check(!/school fees|dead end/i.test(money.before), 'R31: the untraced line\'s name gives no verdict ("school fees")');
  check(/Nnewi/.test(money.after) && !/DEAD END|Dead end/.test(money.after), 'R31: the trace shows what was found, with no DEAD END verdict in Senior');
  h.assert(!fails.length, fails.length + ' checks failed: ' + fails.join(' · '));
  h.log('v13_fix_model_desk: all checks passed');
};
