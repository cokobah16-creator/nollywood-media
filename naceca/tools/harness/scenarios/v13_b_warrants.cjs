// v13 · B · the court orders decided in the briefing (design §1, A5): w_cdr at h6, w_eko at h7.
// The board is the magistrate (V12.warrantFor at decision time). Signed / not signed; back to the
// operations table and back to the same step (re-reading the board); go without (two taps);
// the w_eko routing (two taps; Commander's office alert +1, Benin Zonal Agency −6); one write per
// order; the video-call badge on during the step, off at the table, on again on return.
const LIB = require('./v13_b_lib.cjs');
const BASE = ['m0', 'm1', 'm2', 'h2', 'm3', 'm3n', 'm4', 'h4', 'm5', 'h5', 'm6'];
module.exports = async h => {
  const B = LIB.lib(h);
  const SIGNED = { strength:70, signed:true, refused:false, strikes:0, need:'Ready to sign' };
  const UNSIGNED = { strength:30, signed:false, refused:false, strikes:1, need:'Needs stronger evidence' };
  const REFUSED = { strength:0, signed:false, refused:true, strikes:3, need:'Find new evidence' };
  const wst = id => h.ev(id => (typeof V12.warrantState === 'function' ? V12.warrantState(id) : null) || (S.game.intel.warrants || {})[id] || { status:'pending' }, id);
  const status = async id => (await wst(id)).status || 'pending';

  // to the h6 / h7 warrant step with the board given
  const toStep = async (hub, board, extra) => {
    await h.step(300);
    await h.ev(() => { window.__stopT7 = false; });
    if(hub === 'h6'){
      await B.toHub('m7', BASE, S => {
        S.game.mem = { hubs:{ h2:1, h4:1, h5:1 }, street:{}, phone:{}, reply:{}, seen:{} };
        S.game.intel = { items:{}, briefed:{ m3:true, m4:true, m5:true } };
        S.game.evidence = [{ id:'asaba_sims', name:'SIMs' }, { id:'asaba_hostage', name:'Tobi' }];
        S.game.moralChoices.asaba = 'rescue';
      });
    } else {
      await B.toHub('t7', BASE.concat(['h6', 'm7']), S => {
        S.game.mem = { hubs:{ h2:1, h4:1, h5:1, h6:1 }, street:{}, phone:{}, reply:{}, seen:{} };
        S.game.intel = { items:{}, briefed:{ m3:true, m4:true, m5:true, m6:true }, warrants:{ w_cdr:{ status:'signed' } } };
        S.game.evidence = [{ id:'tower_fix', name:'Handset fix' }];
      });
    }
    h.assert(await h.ev(hub => S.game.currentMission === hub, hub), hub + ' office');
    await B.warrant(board);
    if(extra) await h.ev(extra);
    await B.trace();
    await h.ev(() => { window.__stopT7 = true; window.__panel = 0; if(window.CW && CW.warrantPanel && !CW.warrantPanel._spy){ const f = CW.warrantPanel; CW.warrantPanel = function(){ window.__panel++; return f.apply(this, arguments); }; CW.warrantPanel._spy = true; } });
    await B.callCommander();
    if(hub === 'h6') await B.plan(['burner', 'tobi'], { press:'quiet' });
    else await B.plan(['tip', 'pattern']);
    await B.runToEnd({ until: st => st.phase === 'warrant' || st.fin });
    const st = await B.brf();
    return st;
  };
  const finish = async () => {
    await B.runToEnd();
    await B.click('#screen-briefing [data-b="done"]');
    await h.step(3400);
    h.assert(await h.ev(() => window.__panel === 0 && !document.querySelector('#screen-warrant.show')), 'the beta warrant panel is never used');
  };
  const sheet = () => B.text('#screen-briefing .brf-w');

  // ---------- A. h6, the route board signed: the order is signed ----------
  let st = await toStep('h6', SIGNED);
  h.assert(st.phase === 'warrant' && st.shown, 'h6: the production-order step comes after the leads');
  let txt = await sheet();
  h.log('h6 signed sheet:', txt);
  h.assert(/PRODUCTION ORDER · UGBOWO CELL RECORDS/.test(txt) && /CASE STRENGTH\s*70 \/ 100/.test(txt) && /WRONG LINKS FILED\s*0 \/ 3/.test(txt) && /SIGNED/.test(txt), 'h6 sheet: title, CASE STRENGTH, WRONG LINKS FILED, SIGNED stamp');
  h.assert(await B.badge(), 'badge on during the step');
  h.assert(await status('w_cdr') === 'pending', 'pending until the player takes it');
  await B.click('#screen-briefing [data-b="w-sign"]');
  h.assert(await status('w_cdr') === 'signed', 'w_cdr signed');
  h.assert(/Signed\. Whatever comes off that cabinet/.test(await B.text('#screen-briefing .brf-note')), 'the result line is on the note');
  let tr = await B.trail();
  h.assert(tr.filter(x => x === 'file:w_cdr').length <= 1, 'one write');
  await finish();
  h.assert(await status('w_cdr') === 'signed' && await h.ev(() => S.game.intel.briefed.m6 === true), 'decision kept after the briefing');

  // ---------- B. h6, not signed: back to the table and back; the board now signs ----------
  st = await toStep('h6', UNSIGNED);
  txt = await sheet();
  h.assert(/NOT SIGNED/.test(txt) && /CASE STRENGTH\s*30 \/ 100/.test(txt) && /WRONG LINKS FILED\s*1 \/ 3/.test(txt), 'h6 unsigned sheet');
  h.assert(/pulled without a court order/.test(txt) && !/Agency|Integrity/.test(txt), 'its only consequence line is the court flaw');
  h.assert(await B.has('#screen-briefing [data-b="w-ops"]') && await B.has('#screen-briefing [data-b="w-none"]'), 'two choices: back to the table, go without');
  await B.click('#screen-briefing [data-b="w-ops"]');
  h.assert(await B.shown('screen-ops') && !(await B.shown('screen-briefing')), 'the operations table opens');
  h.assert(!(await B.badge()), 'badge off at the table');
  await B.warrant(SIGNED);                                 // the player inks what was missing
  await h.ev(() => document.getElementById('ops-close').click());
  await h.step(300);
  st = await B.brf();
  h.assert(st.shown && st.phase === 'warrant', 'closing the table returns to the same briefing step');
  h.assert(await B.badge(), 'badge back on');
  txt = await sheet();
  h.assert(/SIGNED/.test(txt) && !/NOT SIGNED/.test(txt) && /CASE STRENGTH\s*70/.test(txt), 'the step re-reads the board on return');
  await B.click('#screen-briefing [data-b="w-sign"]');
  h.assert(await status('w_cdr') === 'signed', 'signed after the table');
  await finish();

  // ---------- C. h6, refused: go without (two taps) ----------
  st = await toStep('h6', REFUSED);
  h.assert(/REFUSED/.test(await sheet()) && /Refused until you bring something new/.test(await sheet()), 'refused sheet');
  const r0 = await B.snap();
  await B.click('#screen-briefing [data-b="w-none"]');
  h.assert(/TAP AGAIN/.test(await B.text('#screen-briefing [data-b="w-none"]')) && await status('w_cdr') === 'pending', 'first tap arms, nothing filed');
  await B.click('#screen-briefing [data-b="w-none"]');
  h.assert(await status('w_cdr') === 'none', 'went without: w_cdr none');
  const r1 = await B.snap();
  h.assert(r1.rep.integrity === r0.rep.integrity && r1.rep.agencyFavour === r0.rep.agencyFavour, 'no Integrity/Agency cost beyond the court flaw');
  h.assert(/No order/.test(await B.text('#screen-briefing .brf-note')), 'result: no order');
  await finish();

  // ---------- D. h7, signed: routing two-tap — Benin Zonal ----------
  st = await toStep('h7', SIGNED);
  txt = await sheet();
  h.assert(/SEARCH & ARREST WARRANT · EKOSODIN/.test(txt) && /SIGNED/.test(txt), 'h7 sheet');
  h.assert(!/won't see|will not see|Nobody at Lagos HQ|knows it exists|she won|her desk/i.test(txt), 'no label says who will or won\'t see it');
  const z0 = await B.snap();
  await B.click('#screen-briefing [data-b="w-route"][data-v="commander"]');
  h.assert(await status('w_eko') === 'pending' && /TAP AGAIN/.test(await B.text('#screen-briefing [data-b="w-route"][data-v="commander"]')), 'first tap arms the Commander route');
  await B.click('#screen-briefing [data-b="w-route"][data-v="zonal"]');
  h.assert(await status('w_eko') === 'pending' && /TAP AGAIN/.test(await B.text('#screen-briefing [data-b="w-route"][data-v="zonal"]')), 'tapping the other route re-arms it');
  await B.click('#screen-briefing [data-b="w-route"][data-v="zonal"]');
  let w = await wst('w_eko');
  h.assert(w.status === 'signed' && w.route === 'zonal', 'w_eko signed through Benin Zonal');
  const z1 = await B.snap();
  h.log('zonal deltas', { af:z1.rep.agencyFavour - z0.rep.agencyFavour, alert:z1.alert - z0.alert });
  h.assert(z1.rep.agencyFavour - z0.rep.agencyFavour === -6 && z1.alert === z0.alert, 'Zonal: Agency Standing −6 once, no alert');
  const res = await B.text('#screen-briefing .brf-note');
  h.assert(!/won't see|Nobody at Lagos HQ|knows it exists/i.test(res), 'the result does not say who won\'t see it');
  tr = await B.trail();
  h.assert(tr.filter(x => x === 'file:w_eko').length <= 1, 'one write for w_eko');
  await finish();
  h.assert(await h.ev(() => window.__t7 === true), 'then the car');

  // ---------- E. h7, signed: the Commander's office ----------
  st = await toStep('h7', SIGNED);
  const c0 = await B.snap();
  await B.click('#screen-briefing [data-b="w-route"][data-v="commander"]');
  await B.click('#screen-briefing [data-b="w-route"][data-v="commander"]');
  w = await wst('w_eko');
  const c1 = await B.snap();
  h.assert(w.status === 'signed' && w.route === 'commander' && c1.alert - c0.alert === 1 && c1.rep.agencyFavour === c0.rep.agencyFavour, 'Commander route: alert +1 once, no Agency cost');
  await finish();

  // ---------- F. h7, not signed: go without = exigent ----------
  st = await toStep('h7', UNSIGNED);
  txt = await sheet();
  h.assert(/NOT SIGNED/.test(txt) && /exigency/.test(txt) && /test it in court/.test(txt), 'h7 unsigned: the exigency court line');
  const e0 = await B.snap();
  await B.click('#screen-briefing [data-b="w-none"]');
  await B.click('#screen-briefing [data-b="w-none"]');
  w = await wst('w_eko');
  const e1 = await B.snap();
  h.assert(w.status === 'exigent' && e1.rep.integrity === e0.rep.integrity && e1.rep.agencyFavour === e0.rep.agencyFavour && e1.alert === e0.alert, 'w_eko exigent, no other cost');
  await finish();

  // ---------- G. an order already decided (legacy or earlier) skips the step ----------
  st = await toStep('h6', UNSIGNED, () => { S.game.intel.warrants = { w_cdr:{ status:'signed', route:'legacy' } }; });
  h.assert(st.phase !== 'warrant' && /THE PRODUCTION ORDER/.test(await B.text('#screen-briefing .brf-note')), 'a decided order is not asked again; its line is on the note');
  h.assert(await status('w_cdr') === 'signed', 'the decision stands');
  await finish();
  await h.ev(() => { window.__stopT7 = false; });
  h.log('PASS v13_b_warrants');
};
