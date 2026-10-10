// v13 port · tools/v13_test.py's 19 checks, with the INTEGRATED semantics (v13 on the friends beta).
// The drop's test pushed state forward by hand and called v13 internals; this port walks the real path
// of one save, Lekki to the case review, moving between steps the way the game does (the aftermath's
// CONTINUE, the offices, the title cards; never a fixed sleep): links inked on the operations table sign the
// Lekki warrant, the h2 Commander files the charge sheet (V12.raidGate) before the plan, Night Shift hands
// over to the Week-1 briefing, every later briefing runs inside its office's Commander call
// (V12.hubCallAfter), the route case goes in on exigency at h5 (never worked on the table), the Ugbowo
// order and the Ekosodin warrant are decided at h6/h7 on the board's own reading, the accusation is the
// beta's charge sheet (CW.file) resolved by finaleResolve, then the trial, the epilogue and the review.
// Every warrant here comes from the real board (no V12.warrantFor stub).
// What changed from the drop's rule, per check:
//   1  V12.warrant() is the beta's (warrantFor('lagos').signed); tier 0 stays 'ON FILE'
//   2  Senior: flagging a phone clue never opens the money trail on the spot (it joins at the next
//      briefing); Recruit keeps the drop's instant unlock; MONEY waits for the Lagos charge sheet
//   3  the Lekki warrant comes from the board through the h2 charge sheet; the plan has no APPLY button
//   4  committing the plan writes no v13 Lekki window and charges nothing on a signed warrant
//   7/8 the h4/h5 briefings open inside the office's Commander call; loadMission is never intercepted;
//      at h5 the route sheet meets the beta's warrant panel (not signed → exigent) before the briefing
//   9  the plate match, ONE OFFICE and the C.A. exhibit are silent in Senior
//   10/11 the Ugbowo order: not signed → back to the operations table → the player inks the route
//      links → signed → TAKE THE ORDER
//   12 the Ekosodin warrant via Zonal: Agency −6, nobody at HQ hears of the house
//   13/15 the accusation is filed on the paper sheet and resolved by finaleResolve (no S.game._acc)
//   17 the review opens before the title screen, not over it
//   19 radio bulletins are for field operations only
// Run at 390x844 --touch 1 and at 1280x800. Screens: --shots <dir>.
const LIB = require('./v13_port_lib.cjs');

module.exports = async h => {
  const P = LIB.lib(h), B = P.B, C = P.C;
  const vp = await h.ev(() => innerWidth + 'x' + innerHeight + (document.body.classList.contains('touch-active') ? '_touch' : ''));
  const shot = n => h.shot('port_flow_' + n + '_' + vp);
  const results = [];
  const short = v => { try{ return (typeof v === 'string' ? v : JSON.stringify(v)).slice(0, 400); }catch(e){ return String(v); } };
  const check = (n, name, cond, info) => { results.push({ n, name, ok:!!cond }); h.log((cond ? 'PASS ' : 'FAIL ') + String(n).padStart(2) + '  ' + name + (cond ? '' : '\n         ' + short(info))); return !!cond; };
  // a step that throws is a failed check, and the walk goes on
  const step = async (n, name, fn) => { try{ return await fn(); }catch(e){ check(n, name, false, 'THREW: ' + String(e.message || e).split('\n')[0]); return null; } };
  const briefingText = () => h.ev(() => (document.querySelector('#screen-briefing') || {}).textContent || '');
  const akintola = [];                                        // any h7 briefing DOM that names the close or the gate
  const complete = (mid, extra) => h.ev(([mid, extra]) => {
    if(typeof SIDE !== 'undefined') SIDE.mid = null;
    if(extra) (new Function(extra))();
    S.game.currentMission = mid;
    if(!S.game.completedMissions.includes(mid)) S.game.completedMissions.push(mid);
    showOverlay(null); showAftermath();
  }, [mid, extra || null]);
  const toNextFromAftermath = async () => { await P.waitShown('screen-aftermath'); await h.ev(() => document.getElementById('btn-aftermath-continue').click()); };

  // =============== 1 · boot ===============
  await step(1, 'boot', async () => {
    const r = await h.ev(() => {
      const keep = V12.warrantFor, fresh = V12.warrant();
      V12.warrantFor = () => ({ strength:80, signed:true, refused:false, strikes:0, need:'Ready to sign' }); const follows = V12.warrant();
      V12.warrantFor = keep;
      return { v:V12.version, tag:(document.getElementById('v12-build') || {}).textContent, desk:!!document.getElementById('btn-missions-desk') && !!document.getElementById('btn-pause-desk'),
        fresh, follows, tier0:(V12.INTEL_TIERS && V12.INTEL_TIERS[0] || {}).name, api:['warrantState', 'fileV13Warrant', 'hubCallAfter', 'raidGate'].every(k => typeof V12[k] === 'function') };
    });
    check(1, 'v13 boots on the beta (version, build tag, desk buttons); V12.warrant() is the board\'s; tier 0 stays ON FILE',
      /v13/.test(r.v) && /v13/i.test(r.tag || '') && r.desk && r.fresh === false && r.follows === true && r.tier0 === 'ON FILE' && r.api, r);
  });

  // =============== 2 · KC's phone, the money trail (Recruit first, on its own save) ===============
  const KC_REL = ['kc_msg_engineer', 'kc_msg_control', 'kc_call_control', 'kc_ph_gate', 'kc_ph_van', 'kc_bank_150k', 'kc_del_control'];
  const flagInDesk = ids => h.ev(ids => {
    DESK.phone = null; DESK.sec = null;                                         // the desk remembers the last handset
    openDesk('phones');
    const body = document.getElementById('desk-body');
    body.querySelector('[data-act="phone"][data-id="kc"]').click();
    for(const id of ids){
      const c = PHONES.find(p => p.id === 'kc').items.find(x => x.id === id);
      const sec = body.querySelector(`[data-act="sec"][data-sec="${c.sec}"]`); if(sec) sec.click();
      const b = body.querySelector(`[data-act="flag"][data-id="${id}"]`); if(!b) throw new Error('no flag button for ' + id); if(!I().flagged[id]) b.click();
    }
    return { coach:body.querySelectorAll('.dk-coach').length, flagged:Object.keys(I().flagged).filter(k => I().flagged[k]), money:JSON.parse(JSON.stringify(I().money)) };
  }, ids);
  const KC_STATE = S => { S.game.intel = {}; S.game.flags.kc_statement = true; S.game._marketTunde = true; };
  const KC_EV = () => h.ev(() => {
    collectEvidence({ id:'co_madam', name:'"Tell Madam it\'s clean" phone', xp:0 });
    collectEvidence({ id:'phishing_template', name:'Phishing Template', xp:50 });
    collectEvidence({ id:'kc_sims', name:"KC's SIM Batch (statement)", xp:0 });
  });
  let r2r = null;
  await step(2, 'recruit phone', async () => {
    await P.start('m2', { completed:['m0', 'm1'], briefings:true, state:KC_STATE });
    await KC_EV(); await P.recruit(true);
    r2r = await flagInDesk(['kc_bank_150k']);
    r2r.toast = await h.ev(() => document.getElementById('toast').textContent);
    await h.ev(() => closeDesk());
  });
  await step(2, 'senior phone', async () => {
    await P.start('m2', { completed:['m0', 'm1'], briefings:true, state:KC_STATE });
    await KC_EV();
    const phones = await h.ev(() => PHONES.filter(phoneUnlocked).map(p => p.id));
    const r = await flagInDesk(KC_REL);
    const gate = await h.ev(() => { DESK.tab = 'money'; renderDesk(); const body = document.getElementById('desk-body'); return { open:intelMoneyOpen(), nodes:body.querySelectorAll('.dk-mn, [data-act="trace"]').length }; });
    await shot('00_kc_phone');
    await h.ev(() => closeDesk());
    check(2, "KC's phone unlocks; Senior: flags go on the file, the money trail waits for the next briefing (Recruit: at once); MONEY waits for the Lagos sheet",
      JSON.stringify(phones) === '["kc"]' && r.flagged.length === KC_REL.length && !r.money.open && !r.money.unlocked.n_kc && r.coach === 0
      && !gate.open && gate.nodes === 0
      && r2r && r2r.money.open && r2r.money.unlocked.n_kc && r2r.coach > 0, { phones, senior:r, gate:gate.open, recruit:r2r });
  });

  // =============== 3 · the Lekki warrant: the board signs, the h2 Commander files the charge sheet ===============
  await step(3, 'lekki warrant', async () => {
    const ink = await P.inkLagos();
    await complete('m2', `S.game.moralChoices.market_runner = 'caught'; S.game.moralChoices.choice = 'detain';`);
    await toNextFromAftermath();
    const atH2 = await P.toMission('h2');
    await B.trace();
    const ov = await P.office();
    const sheetFirst = ov.includes('screen-charge');
    await P.fileSheet({ suspect:'obi', method:'phish', money:'wallet' });
    const cmd = await h.ev(() => (DIALOGUE.hub_cmd_run || []).map(l => l.text).join(' | '));
    await B.dialogues();
    const atM3 = await P.toMission('m3');
    const rec = await h.ev(() => Object.assign({}, S.game.accusations.lagos));
    const ws = await P.warrant('w_lekki');
    const legacy = await h.ev(() => ({ w:V12.warrant(), money:intelMoneyOpen() }));
    await P.use('Plan the raid with Sgt. Uche');
    const plan = await P.waitShown('screen-plan', { timeout:3000 }) && await h.ev(() => ({ row:V12.m3Intel().warrant, apply:!!document.getElementById('plan-warrant'),
      text:document.getElementById('screen-plan').textContent, warrantRow:[...document.querySelectorAll('#screen-plan .plan-row')].map(r => r.textContent).find(t => /^WARRANT/.test(t)) || '' }));
    await shot('01_plan_warrant');
    check(3, 'The board signs the Lekki warrant; the h2 Commander takes the charge sheet first (raidGate); the plan reads "Signed", no v13 APPLY',
      ink.w.signed && ink.legacy && atH2 && sheetFirst && atM3 && rec.warrant === 'signed' && rec.ok.suspect && ws.status === 'signed'
      && legacy.w === true && legacy.money === true && plan && plan.row.known && /Signed/.test(plan.warrantRow) && !plan.apply,
      { ink, atH2, ov, cmd:cmd.slice(0, 120), atM3, rec, ws:ws.status, legacy, plan:plan && { row:plan.row, apply:plan.apply, w:plan.warrantRow } });
  });

  // =============== 4 · GO: the plan commits; no v13 window, no exigent charge, no warrantless flaw ===============
  await step(4, 'plan go', async () => {
    const before = await h.ev(() => S.player.reputation.agencyFavour);
    await h.ev(() => { const b = document.querySelector('#screen-plan [data-k="entry"][data-v="knock"]'); if(b) b.click(); });
    await h.ev(() => document.getElementById('plan-go').click());
    await P.talk(0);
    const r = await h.ev(b0 => {
      collectEvidence({ id:'laptop', name:'Encrypted Laptop', xp:80 }); collectEvidence({ id:'safe_drives', name:'Encrypted Hard Drives', xp:80 });
      return { plan:S.game._plan, af:S.player.reputation.agencyFavour - b0, rec:S.game.accusations.lagos.warrant, v13:(I().warrants || {}).w_lekki || null,
        ws:V12.warrantState('w_lekki').status, flaws:intelItemFlaws('laptop').map(f => f.k) };
    }, before);
    // knock (Agency −2) + the signed-warrant plan credit (+2): no exigent −5
    check(4, 'Committing the plan: the signed warrant stands, no v13 Lekki record, no exigent cost, no warrantless flaw on the laptop',
      r.plan && r.plan.known.warrant && r.af === 0 && r.rec === 'signed' && r.v13 === null && r.ws === 'signed' && !r.flaws.includes('warrantless') && !r.flaws.includes('contested'), r);
  });

  // =============== 5 · Lekki → Night Shift → the Week-1 briefing before BENIN BYPASS ===============
  await step(5, 'week 1 opens', async () => {
    await complete('m3', `S.game.moralChoices.arrest = 'arrest'; S.game._civChild = true;`);
    await toNextFromAftermath();
    const atNight = await P.toMission('m3n');
    await h.ev(() => { ['n1_uche', 'n2_desk', 'n3_table'].forEach(id => completeObjective(id)); });
    await P.use('Go home');
    const open = await P.waitShown('screen-briefing', { timeout:3000 });
    const r = await h.ev(() => ({ k:BRF.k, card:!!document.querySelector('#title-card.show'), cert:certWindowOpen('laptop'), pending:briefingPending('m3'),
      money:JSON.parse(JSON.stringify(I().money)), certBtn:!!document.querySelector('#screen-briefing [data-b="cert"][data-id="laptop"]') }));
    await shot('02_brief_w1');
    check(5, 'Night Shift → the Week-1 briefing opens before the BENIN BYPASS card; the laptop can still be certified; Senior flags join the money trail now',
      atNight && open && r.k === 'm3' && !r.card && r.cert && r.certBtn && r.pending && r.money.open && r.money.unlocked.n_kc, Object.assign({ atNight, open }, r));
  });

  // =============== 6 · Week 1: certify, two leads, commit; the gatehouse log becomes an exhibit ===============
  await step(6, 'week 1 runs', async () => {
    await B.click('#screen-briefing [data-b="cert"][data-id="laptop"]');
    await B.plan(['pos', 'gatehouse']);
    await B.runToEnd({ gk:{ gk_pos:'custom' } });
    await B.click('#screen-briefing [data-b="done"]');
    const card = await P.until(() => !!document.querySelector('#title-card.show') && /BENIN BYPASS/.test(document.getElementById('title-card').textContent), null, { timeout:2000 });
    const atM4 = await P.toMission('m4');
    const r = await h.ev(() => ({ gate:intelHas('inv_gatehouse'), ev:S.game.evidence.some(e => e.id === 'inv_gatehouse'), cert:I().items.laptop.cert, briefed:I().briefed.m3, brf:!!I().brf,
      odogwu:!!I().reg.found.odogwu }));
    check(6, 'Week 1 → the BENIN BYPASS card → M4; the gatehouse log became an exhibit; the laptop is certified',
      !!card && atM4 && r.gate && r.ev && r.cert && r.briefed === true && !r.brf && r.odogwu, Object.assign({ card:!!card, atM4 }, r));
  });

  // =============== 7 · M4 → the h4 office → Week 2 inside the Commander's call ===============
  await step(7, 'week 2', async () => {
    await h.ev(() => { collectEvidence({ id:'ransom_ledger', name:'Ransom Route Ledger', xp:140 }); collectEvidence({ id:'musa_statement', name:"Musa's Statement", xp:60 }); });
    await complete('m4', `S.game.moralChoices.checkpoint = 'arrest_driver';`);
    await toNextFromAftermath();
    const atH4 = await P.toMission('h4');
    await P.office();
    const st = await P.brf();
    const inCall = st.shown && st.k === 'm4' && await B.badge() && await h.ev(() => !V12.mem().hubs.h4);
    await B.plan(['musa', 'cac'], { custody:'kept' });
    await B.runToEnd();
    await B.click('#screen-briefing [data-b="done"]');
    const atM5 = await P.toMission('m5');
    const r = await h.ev(() => ({ kept:I().custodyAsk, reg:Object.keys(I().reg.found), briefed:I().briefed.m4, hub:!!V12.mem().hubs.h4, musaPhone:phoneUnlocked(PHONES.find(p => p.id === 'musa')) }));
    check(7, 'Week 2 runs in the h4 Commander call, then Case 05; the ledger kept; Bluewater on the register',
      atH4 && inCall && atM5 && r.kept === 'kept' && r.reg.includes('bluewater') && r.reg.includes('apex') && r.briefed === true && r.hub && r.musaPhone, Object.assign({ atH4, inCall, atM5 }, r));
  });

  // =============== 8 · loadMission('m6') → the h5 office (not the mission); route sheet → warrant panel → Week 3 ===============
  await step(8, 'week 3 holds', async () => {
    await complete('m5', `S.game.moralChoices.shrine = 'negotiate';`);
    await P.waitShown('screen-aftermath');
    await h.ev(() => { showOverlay(null); loadMission('m6'); });                    // the mission select's way in
    const noIntercept = await h.ev(() => !document.querySelector('#screen-briefing.show') && S.game.currentMission === 'h5');
    const atH5 = await P.toMission('h5');
    // the route case was never worked on the table: the magistrate won't sign, and the player goes in on exigency
    const board = await h.ev(() => V12.warrantFor('route'));
    const ov = await P.office();
    const sheetFirst = ov.includes('screen-charge') && !ov.includes('screen-briefing');
    await P.fileSheet({ suspect:'ifeanyi', method:'route', money:'asaba' });
    await B.dialogues();
    const panel = await P.waitShown('screen-warrant', { timeout:2000 });
    await B.click('#screen-warrant [data-act="exigent"]', 2);
    await B.dialogues();
    const st = await P.brf();
    const r = await h.ev(() => ({ cur:S.game.currentMission, m6:!!(I().started || {}).m6, w:S.game.accusations.route && S.game.accusations.route.warrant }));
    check(8, 'loadMission("m6") goes to the h5 office; the route sheet, the warrant panel (not signed → exigent); Week 3 opens after, inside the call, and holds the mission',
      noIntercept && atH5 && !board.signed && sheetFirst && panel && st.shown && st.k === 'm5' && st.phase === 'plan' && r.cur === 'h5' && !r.m6 && r.w === 'exigent'
      && await h.ev(() => V12.warrantState('w_asaba').status === 'exigent'), Object.assign({ noIntercept, atH5, board:board.strength, ov, panel, st:{ k:st.k, phase:st.phase } }, r));
  });

  // =============== 9 · registry from the briefing's desk; the quiet order; the van matches the plate ===============
  await step(9, 'week 3 van', async () => {
    const snap0 = await P.snap();
    // CASE DESK from the briefing → REGISTRY → back to the briefing
    await B.click('#screen-briefing [data-b="desk"]');
    const reg = await h.ev(() => {
      DESK.tab = 'registry'; renderDesk();
      const body = document.getElementById('desk-body'), search = q => { const i = document.getElementById('reg-q'); if(i){ i.value = q; DESK.regQ = q; } deskDo('reg-search'); return (DESK.regHits || []).slice(); };
      const a = search('C.A. Consulting'), b = search('Serpentine'), c = search('Ugbowo');
      deskDo('reg-addr', { addr:ZUMA });
      return { a, b, c, zuma:(DESK.regAddrHits || []).length, cluster:intelHas('zuma_cluster'), due:!!I().flags.one_office_due, toast:document.getElementById('toast').textContent, intel:S.game.intelScore || 0 };
    });
    await h.ev(() => document.getElementById('btn-desk-close').click());
    const back = await P.shown('screen-briefing');
    // the quiet order takes one of the two leads
    await B.click('#screen-briefing [data-b="dec"][data-k="order"][data-v="quiet"]');
    await B.click('#screen-briefing [data-b="lead"][data-id="stakeout"]');
    // one lead and the plan is complete: COMMIT is open (two leads would be the normal plan)
    const sel = await h.ev(() => ({ n:BRF.sel.length, want:!document.querySelector('#screen-briefing [data-b="commit"]').disabled }));
    await B.click('#screen-briefing [data-b="commit"]', 2);
    await P.waitShown('screen-so', { timeout:3000 });
    const van = await h.ev(async () => {
      const sleep = ms => new Promise(r => setTimeout(r, ms)), out = [];
      const click = a => { const b = document.querySelector(`#screen-so [data-so="${a}"]:not([disabled])`); if(b){ b.click(); out.push(a); return true; } return false; };
      for(let i = 0; i < 12; i++){
        const txt = document.getElementById('so-txt').textContent, t = document.getElementById('so-clock').textContent;
        if(t === '15:20' || /Ghana-must-go/.test(txt)) click('photo');                    // the courier with the bags
        if(t === '18:15' || /Corolla stops/.test(txt)){ click('photo'); click('plate'); }   // the envelope into the government car
        if(t === '18:24' || /pulls away/.test(txt)){ click('follow'); break; }
        if(!click('next')) break;
        await sleep(30);
      }
      const so = I().so, matchLine = so.log.some(x => x.k === 'match'), told = !!so.matchTold, toast = document.getElementById('toast').textContent;
      click('finish');
      return { out, matchLine, told, toast };
    });
    await B.runToEnd();
    await B.click('#screen-briefing [data-b="done"]');
    const atM6 = await P.toMission('m6');
    const r = await h.ev(() => ({ match:intelHas('so_plate_match'), plate:intelHas('so_plate'), inv:['inv_engineer', 'inv_stakeout'].map(id => intelHas(id) && S.game.evidence.some(e => e.id === id)), order:I().order }));
    check(9, 'Registry from the briefing desk (ONE OFFICE silent in Senior); the quiet order takes a lead slot; the van matches the plate silently; both become exhibits',
      reg.zuma >= 4 && reg.cluster && reg.due && reg.intel === snap0.intel && back && sel.n === 1 && sel.want
      && van.out.includes('plate') && !van.matchLine && !van.told && r.match && r.plate && r.inv.every(Boolean) && r.order === 'quiet' && atM6,
      { reg, back, sel, van, r, atM6 });
  });

  // =============== 10 · M6 → the h6 office → Week 4 reaches the production order ===============
  await step(10, 'week 4 order step', async () => {
    await h.ev(() => { collectEvidence({ id:'asaba_sims', name:'SIMs', xp:60 }); collectEvidence({ id:'asaba_hostage', name:'Tobi Onuoha', xp:160 }); });
    await complete('m6', `S.game.moralChoices.asaba = 'rescue';`);
    await toNextFromAftermath();
    const atH6 = await P.toMission('h6');
    await P.office();
    const st0 = await P.brf();
    // the h6 briefing can still certify what came in between (the van photos, the Engineer's log)
    for(const id of ['inv_engineer', 'inv_stakeout']) if(await B.has(`#screen-briefing [data-b="cert"][data-id="${id}"]`)) await B.click(`#screen-briefing [data-b="cert"][data-id="${id}"]`);
    await B.plan(['burner', 'tobi'], { press:'trace' });
    const st = await B.runToEnd({ until:async s => s.phase === 'warrant' });
    const r = await h.ev(() => ({ phase:BRF.phase, title:(document.querySelector('#screen-briefing .brf-w-title') || {}).textContent || '', facts:(document.querySelector('#screen-briefing .brf-facts') || {}).textContent || '',
      board:V12.warrantFor('route'), ws:V12.warrantState('w_cdr').status, ops:!!document.querySelector('#screen-briefing [data-b="w-ops"]'), certs:['inv_engineer', 'inv_stakeout'].map(id => I().items[id] && I().items[id].cert) }));
    await shot('03_brief_w4_order');
    check(10, 'Week 4 (in the h6 call) reaches the production-order step; it shows the board\'s case strength and wrong links; not signed yet',
      atH6 && st0.k === 'm6' && r.phase === 'warrant' && /PRODUCTION ORDER/.test(r.title) && /CASE STRENGTH/.test(r.facts) && new RegExp(r.board.strength + ' / 100').test(r.facts) && /WRONG LINKS FILED/.test(r.facts)
      && !r.board.signed && r.ws === 'pending' && r.ops && r.certs.every(Boolean), Object.assign({ atH6 }, r));
  });

  // =============== 11 · back to the table, the board signs, TAKE THE ORDER; the C.A. trail ===============
  await step(11, 'order and money', async () => {
    await B.click('#screen-briefing [data-b="w-ops"]');
    const ops = await P.waitShown('screen-ops', { timeout:2000 });
    const inked = await P.inkLinks('route', P.ROUTE_LINKS);                       // the player inks what was missing
    h.log(`      h6 table: route strength ${inked.strength}, ${inked.signed ? 'signed' : 'not signed'}`);
    await h.ev(() => V12.closeOps());
    const backTo = await P.waitShown('screen-briefing', { timeout:2000 });
    const signedNow = await h.ev(() => !!document.querySelector('#screen-briefing [data-b="w-sign"]'));
    await B.click('#screen-briefing [data-b="w-sign"]');
    const w = await P.warrant('w_cdr');
    await B.runToEnd();
    await B.click('#screen-briefing [data-b="done"]');
    const atM7 = await P.toMission('m7');
    // HUD EVIDENCE → the Locker → MONEY: follow the alert to C.A. Consulting
    const money = await h.ev(async () => {
      const sleep = ms => new Promise(r => setTimeout(r, ms));
      const ev = document.getElementById('cb-ev'); if(ev) ev.click(); else openDesk('locker');
      await sleep(60);
      const locker = DESK.open && DESK.tab === 'locker';
      DESK.tab = 'money'; renderDesk();
      const out = [];
      for(const id of ['n_kc', 'n_odogwu', 'n_bluewater', 'n_charity', 'n_ca']){
        const b = document.querySelector(`#desk-body [data-act="trace"][data-id="${id}"]`); if(b && !b.disabled){ b.click(); out.push(id); await sleep(20); }
      }
      return { locker, out, ca:intelHas('inv_ca'), reg:!!I().reg.found.ca, silver:!!I().reg.found.silverline, toast:document.getElementById('toast').textContent, key:!!document.querySelector('#desk-body .dk-keytag') };
    });
    await shot('09_money');
    await h.ev(() => closeDesk());
    check(11, 'Not signed → back to the operations table → the board signs → TAKE THE ORDER (w_cdr signed); the C.A. trail becomes an exhibit, silently',
      ops && inked.signed && backTo && signedNow && w.status === 'signed' && w.route === 'standard' && atM7 && money.locker && money.ca && money.reg && money.silver && !/C\.A\. CONSULTING/.test(money.toast) && !money.key,
      { ops, inked, backTo, signedNow, w:{ status:w.status, route:w.route }, atM7, money });
  });

  // =============== 12 · M7 → the h7 office → Week 5: the caretaker in Igbo; the Ekosodin warrant via Zonal ===============
  await step(12, 'week 5', async () => {
    await h.ev(() => { collectEvidence({ id:'tower_cdr', name:'Call Records — Ugbowo Cell', xp:90 }); collectEvidence({ id:'tower_fix', name:'Handset Fix — Ekosodin', xp:140 }); });
    await complete('m7', `S.game.moralChoices.tower = 'hold';`);
    await toNextFromAftermath();
    const atH7 = await P.toMission('h7');
    await h.ev(() => { window.__stopT7 = true; });                                 // the car is t7's own scenario (three.js stub: wayfind/v12_car)
    await P.use('Work the operations table');
    const voice = await P.inkLinks('voice', P.VOICE_LINKS);
    await h.ev(() => { if(document.querySelector('#screen-ops.show')) V12.closeOps(); });
    const af0 = await h.ev(() => S.player.reputation.agencyFavour);
    await P.office();
    akintola.push(await briefingText());
    for(const id of ['tower_cdr', 'tower_fix']) if(await B.has(`#screen-briefing [data-b="cert"][data-id="${id}"]`)) await B.click(`#screen-briefing [data-b="cert"][data-id="${id}"]`);
    await B.plan(['caretaker', 'pattern']);
    await B.runToEnd({ gk:{ gk_caretaker:'igbo' }, until:async s => { akintola.push(await briefingText()); return s.phase === 'warrant'; } });
    akintola.push(await briefingText());
    await B.click('#screen-briefing [data-b="w-route"][data-v="zonal"]');
    const armed = await h.ev(() => document.querySelector('#screen-briefing [data-b="w-route"][data-v="zonal"]').classList.contains('armed') && I().warrants.w_eko === undefined);
    await B.click('#screen-briefing [data-b="w-route"][data-v="zonal"]');
    akintola.push(await briefingText());
    await B.runToEnd();
    akintola.push(await briefingText());
    await B.click('#screen-briefing [data-b="done"]');
    const toT7 = await P.until(() => window.__t7 === true, null, { timeout:5000 });
    const r = await h.ev(af0 => ({ back:musaGaveTip(), src:S.game.flags.backgate_src, eko:V12.warrantState('w_eko'), known:(I().known.eko_house || []).slice(), af:S.player.reputation.agencyFavour - af0,
      alert:I().alert, cert:[I().items.tower_cdr.cert, I().items.tower_fix.cert], briefed:I().briefed.m7 }), af0);
    const named = akintola.filter(t => /Akintola|blue gate/i.test(t)).length;
    check(12, 'Week 5 (in the h7 call, before the car): the caretaker in Igbo opens the back gate; the Ekosodin warrant via Zonal (Agency −6) never reaches HQ; no close or gate named',
      atH7 && voice.signed && armed && r.back && r.src === 'caretaker' && r.eko.status === 'signed' && r.eko.route === 'zonal' && !r.known.includes('Cdr. Adaeze') && r.known.includes('Zonal Command')
      && r.af === -6 && r.alert === 0 && r.cert.every(Boolean) && r.briefed === true && !!toT7 && named === 0, Object.assign({ atH7, voice:voice.strength, armed, toT7:!!toT7, named }, r));
  });

  // =============== 13–15 · M8 (route A, the back gate), the accusation on the paper sheet, finaleResolve ===============
  let accused = null;
  await step(13, 'finale', async () => {
    await h.ev(() => { window.__stopT7 = false; S.game.completedMissions.push('t7'); S.game.currentMission = 't7'; showOverlay(null); loadMission('m8'); });
    const atM8 = await P.toMission('m8');
    const warned = await h.ev(() => !!S.game._finWarned);
    await P.use('Brief with Sgt. Uche'); await P.talk(0);
    await P.use('Try the back gate'); await P.talk(0);
    const inside = await h.ev(() => S.game._finInside);
    await P.use('Free Osas'); await P.talk(0);
    const sheet = await P.waitShown('screen-accuse', { timeout:4000 });
    const strong = await h.ev(() => Object.keys(V12.strongAgainstAdaeze()));
    await B.pick('screen-accuse', 'who', 'adaeze');
    await B.pick('screen-accuse', 'method', 'shield');
    await B.pick('screen-accuse', 'money', 'ca');
    for(const id of ['inv_ca', 'inv_gatehouse', 'inv_stakeout']) await B.pick('screen-accuse', 'ev', id);
    await B.fileTwice('screen-accuse');
    accused = await h.ev(() => { const x = intelRevealExtras(); return { rec:S.game.accusations.voice, key:DLG.scriptKey, lines:(DIALOGUE[DLG.scriptKey] || []).map(l => l.text || ''), style:I().styleAtFinale,
      extras:{ before:x.before.map(l => l.text), after:x.after.map(l => l.text) } }; });
    check(13, 'M8 (back gate, the caretaker\'s tip): the beta charge sheet names her; the C.A. record, the gatehouse log and the stakeout count as strong',
      atM8 && !warned && inside === 'back' && sheet && ['inv_ca', 'inv_gatehouse', 'inv_stakeout'].every(x => strong.includes(x)) && accused.rec && accused.rec.suspect === 'adaeze'
      && accused.rec.ok.suspect && accused.rec.ok.method && accused.rec.ok.money && JSON.stringify(accused.rec.picks) === '["inv_ca","inv_gatehouse","inv_stakeout"]',
      { atM8, warned, inside, sheet, strong, rec:accused.rec });
  });
  await step(14, 'reveal', async () => {
    const L = (accused && accused.lines) || [];
    const x = accused && accused.extras;
    check(14, 'Her funding argument and her read of you are in the reveal',
      accused && accused.key === 'fin_reveal_run' && !!accused.style && x && x.before.length && x.after.length && x.before.concat(x.after).every(t => L.includes(t)),
      { key:accused && accused.key, style:accused && accused.style, extras:x });
  });
  await step(15, 'trial', async () => {
    await P.talk(0);
    const af = await P.waitShown('screen-aftermath', { timeout:5000 });
    const out = await h.ev(() => ({ outcome:S.game.moralChoices.finale, next:(document.querySelector('#aftermath-grid .cw-next') || document.getElementById('aftermath-grid') || {}).textContent || '', acc:!!S.game._acc }));
    await h.ev(() => document.getElementById('btn-aftermath-continue').click());
    const court = await P.waitShown('screen-court', { timeout:3000 });
    const ex = await h.ev(() => COURT.ex.map(x => [x.id, x.k]));
    await shot('04_court_pretrial');
    check(15, 'finaleResolve reads the filed sheet: proven; CONTINUE goes to the trial before the epilogue',
      af && out.outcome === 'proven' && /trial/i.test(out.next) && court && ex.length >= 8 && !ex.some(([id, k]) => k === 'warrantless' || k === 'noorder'), { af, out, court, ex });
  });

  // =============== 16–18 · the trial, the epilogue, the review, the title ===============
  await step(16, 'judgment', async () => {
    const prep = await P.courtPrep();
    const steps = await C.runTrial('best', 'admit', async ph => { if(ph === 'judgment') await shot('05_court_judgment'); });
    const r = await h.ev(() => ({ court:I().court, epi:courtEpilogueText(), shown:[...document.querySelectorAll('.overlay.show')].map(o => o.id) }));
    h.log('      court', JSON.stringify({ prep, proven:r.court && r.court.proven, w:r.court && r.court.w, struck:r.court && r.court.struck }));
    check(16, 'Trial judgment computed (at least two counts proven)', r.court && r.court.proven.length >= 2 && r.court.finale === 'proven' && !r.court.wrong, { court:r.court, steps:steps.length });
  });
  await step(17, 'epilogue → review', async () => {
    const epi = await P.waitShown('screen-epilogue', { timeout:3000 });
    const ad = await h.ev(() => (EPI.slides.find(x => x.name === 'COMMANDER ADAEZE') || {}).text || '');
    let underTitle = false;
    for(let i = 0; i < 40 && await P.shown('screen-epilogue'); i++){ await h.ev(() => document.getElementById('screen-epilogue').click()); await h.step(40); }
    const rv = await P.waitShown('screen-review', { timeout:3000 });
    underTitle = await P.shown('screen-title');
    const pct = await h.ev(() => reviewData().pct);
    const rtext = await h.ev(() => document.getElementById('screen-review').textContent);
    const want = await h.ev(() => ({ verdict:courtEpilogueText(), lines:['w_lekki', 'w_asaba', 'w_cdr', 'w_eko'].map(id => rvWarrantLine(id)), eko:V12.warrantState('w_eko'), cdr:V12.warrantState('w_cdr').status }));
    await shot('06_review');
    check(17, 'The epilogue carries the verdict; the case review opens after the last slide, before the title screen',
      epi && !!want.verdict && ad === want.verdict && rv && !underTitle && pct > 0 && want.lines.every(([t]) => rtext.includes(t)) && JSON.stringify(want.lines.map(([, ok]) => ok)) === '[true,false,true,true]'
      && want.eko.status === 'signed' && want.eko.route === 'zonal' && want.cdr === 'signed',
      { epi, ad:ad.slice(0, 80), rv, underTitle, pct });
  });
  await step(18, 'review → title', async () => {
    await h.ev(() => document.getElementById('btn-review-done').click());
    const title = await P.waitShown('screen-title', { timeout:2000 });
    const r = await h.ev(() => ({ s1:!!S.game.seasonOneComplete, review:!!document.querySelector('#screen-review.show') }));
    check(18, 'Review → title screen; the season is closed', title && r.s1 && !r.review, Object.assign({ title }, r));
  });

  // =============== 19 · the desk, the ops table's CASE DESK button, the radio (field operations only) ===============
  await step(19, 'desk, ops, radio', async () => {
    const r = await h.ev(async () => {
      const sleep = ms => new Promise(r => setTimeout(r, ms)), shown = id => !!document.querySelector('#' + id + '.show');
      openDesk('locker'); await sleep(60); const d = shown('screen-desk');
      closeDesk(); await sleep(40); const title = shown('screen-title');
      V12.openOps(); await sleep(120); const ob = document.getElementById('ops-desk');
      if(ob) ob.click(); await sleep(80); const fromOps = shown('screen-desk');
      closeDesk(); await sleep(80); const backOps = shown('screen-ops');
      V12.closeOps(); await sleep(60);
      return { d, title, ob:!!ob, fromOps, backOps };
    });
    await P.carry();
    await P.start('m7', { completed:['m0', 'm1', 'm2', 'm3', 'm3n', 'm4', 'm5', 'm6'], state:S => { const c = JSON.parse(window.__portCarry); S.game.intel = c.game.intel; S.game.headlines = c.game.headlines; S.game.mem = c.game.mem; } });
    const radio = await h.ev(async () => {
      const sleep = ms => new Promise(r => setTimeout(r, ms));
      // record what goes to v12's radio strip (the strip may still be showing another line first)
      const calls = [], keep = window.radioLine;
      window.radioLine = function(who, text){ calls.push([who, text]); return keep.apply(this, arguments); };
      try{
        radioPlay('h6'); const hub = (I().radio || {}).h6, nHub = calls.length;
        ENGINE.movementEnabled = true; radioPlay('m7'); await sleep(300);
        const rs = document.getElementById('radio-sub');
        return { hub:hub || null, nHub, on:!!rs && rs.classList.contains('show'), lines:I().radio.m7, calls:calls.filter(c => c[0] === RADIO_STATION).map(c => c[1]) };
      } finally { window.radioLine = keep; }
    });
    await shot('07_radio');
    await h.ev(() => { ENGINE.movementEnabled = false; openDesk('locker'); });
    await h.step(120);
    await shot('08_locker');
    await h.ev(() => closeDesk());
    check(19, 'The desk opens and returns to the title; the ops table\'s CASE DESK button opens it and returns to the table; the radio plays in a field operation, never in an office',
      r.d && r.title && r.ob && r.fromOps && r.backOps && radio.hub === null && radio.nHub === 0 && radio.on && Array.isArray(radio.lines) && radio.lines.length >= 1 && radio.lines.every(t => typeof t === 'string' && t.length)
      && JSON.stringify(radio.calls) === JSON.stringify(radio.lines),
      { r, radio });
  });

  const fails = results.filter(x => !x.ok);
  const nums = [...new Set(results.map(x => x.n))];
  h.log(`\n${nums.length - new Set(fails.map(f => f.n)).size}/${nums.length} checks passed` + (fails.length ? '  · failed: ' + [...new Set(fails.map(f => f.n))].join(', ') : ''));
  h.assert(!fails.length, 'v13 port (flow): ' + fails.length + ' check(s) failed: ' + [...new Set(fails.map(f => f.n))].join(', '));
  h.log('PASS v13_port_flow');
};
