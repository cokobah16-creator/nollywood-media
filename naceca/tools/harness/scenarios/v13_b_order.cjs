// v13 · B · the order of things between operations (design §2, A1, A0).
// Every hub h4–h7: Uche and the phone → (h5: charge sheet + warrant) → the Commander's lines →
// the v13 briefing inside the same call → endHub → the next case's title card → the mission.
// The same order whether the hub is reached from the aftermath's CONTINUE, from Continue or from
// the mission select. Night Shift → Week-1 briefing → the BENIN BYPASS card → M4.
const LIB = require('./v13_b_lib.cjs');
const BASE = ['m0', 'm1', 'm2', 'h2', 'm3', 'm3n'];
module.exports = async h => {
  const B = LIB.lib(h);
  const idx = (tr, re) => tr.findIndex(x => re.test(x));
  const after = (tr, re) => { const i = idx(tr, re); return i < 0 ? [] : tr.slice(i); };

  // ---------- h4: briefing inside the video call, before the OZALLA card ----------
  const hubState = S => {
    S.game.mem = { hubs:{ h2:1 }, street:{}, phone:{}, reply:{}, seen:{} };
    S.game.intel = { items:{}, briefed:{ m3:true } };
    S.game.evidence = [{ id:'ransom_ledger', name:'Ransom route ledger' }];
    S.game.accusations = { lagos:{ suspect:'obi', method:'alerts', money:'wallet', ok:{ suspect:true, method:true, money:true }, warrant:'signed', settled:'m3' } };
  };
  const runH4 = async (label) => {
    await B.callCommander();
    let st = await B.brf();
    h.assert(st.shown && st.k === 'm4' && st.phase === 'plan', label + ': the h4 briefing opens when the Commander\'s lines end (' + JSON.stringify(st) + ')');
    h.assert(await B.badge(), label + ': the video-call badge stays on through the briefing');
    h.assert(await h.ev(() => !V12.mem().hubs.h4 && !document.querySelector('#title-card.show')), label + ': the office is still open, no title card yet');
    await B.plan(['musa', 'cac'], { custody:'gave' });
    await B.runToEnd();
    await B.click('#screen-briefing [data-b="done"]');
    await h.step(3400);
    st = await B.brf();
    h.assert(st.briefed.m4 === true && !st.rec, label + ': briefed and the record cleared');
    h.assert(await h.ev(() => !!V12.mem().hubs.h4 && S.game.currentMission === 'm5' && !!document.querySelector('#screen-controls.show')), label + ': endHub → OZALLA card → the M5 controls');
    h.assert(!(await B.badge()), label + ': the badge goes off when the call ends');
    return B.trail();
  };

  // path 1: Continue / mission select style (loadMission('m5') is redirected to the hub)
  await B.trace();
  await B.toHub('m5', BASE.concat(['m4']), hubState);
  h.assert(await h.ev(() => S.game.currentMission === 'h4'), 'loadMission(m5) goes to the h4 office first');
  const t1 = after(await runH4('h.start'), /^begin:h4$/);
  h.log('h4 trail', t1.join(' > '));
  const iCmd = idx(t1, /^dlg:hub_cmd_run$/), iBrf = idx(t1, /^ov:screen-briefing$/), iCard = idx(t1, /^card:OZALLA FOREST$/), iLoad = idx(t1, /^load:m5$/);
  h.assert(idx(t1, /^dlg:hub_uche_run$/) < iCmd && idx(t1, /^ov:screen-phone$/) < iCmd, 'Uche and the phone come before the Commander');
  h.assert(iCmd < iBrf && iBrf < iCard && iCard < iLoad, 'Commander lines → briefing → title card → mission');
  h.assert(!t1.some(x => /^card:BENIN BYPASS/.test(x)), 'no Week-1 card at a hub');

  // path 2: the aftermath's CONTINUE (loadMission('h4') directly)
  await h.step(400);
  await h.start('m4', { completed:BASE, briefings:true, state:hubState, wait:1200 });
  await h.ev(() => { if(typeof SIDE !== 'undefined') SIDE.mid = null; if(!S.game.completedMissions.includes('m4')) S.game.completedMissions.push('m4'); S.game.currentMission = 'm4'; showOverlay(null); showAftermath(); });
  await h.step(500);
  await B.trace();
  await h.ev(() => document.getElementById('btn-aftermath-continue').click());
  await h.step(3600);
  h.assert(await h.ev(() => S.game.currentMission === 'h4'), 'aftermath CONTINUE goes to the h4 office');
  const t2 = await runH4('aftermath');

  // path 3: Continue from the title (resumeCampaign → loadMission('m5'))
  await h.step(400);
  await h.start('m4', { completed:BASE, briefings:true, state:hubState, wait:1200 });
  await h.ev(() => { if(!S.game.completedMissions.includes('m4')) S.game.completedMissions.push('m4'); saveGame(true); showOverlay('screen-title'); });
  await B.trace();
  await B.continueGame();
  h.assert(await h.ev(() => S.game.currentMission === 'h4'), 'Continue goes to the h4 office');
  const t3 = await runH4('continue');

  // path 4: the mission select's M5 card
  await h.step(400);
  await h.start('m4', { completed:BASE, briefings:true, state:hubState, wait:1200 });
  await h.ev(() => { if(!S.game.completedMissions.includes('m4')) S.game.completedMissions.push('m4'); showOverlay(null); renderMissionSelect(); showOverlay('screen-missions'); });
  await B.trace();
  await h.ev(() => document.querySelector('#mission-grid .mission-card[data-mid="m5"]').click());
  await h.step(3600);
  h.assert(await h.ev(() => S.game.currentMission === 'h4'), 'the mission select goes to the h4 office');
  const t4 = await runH4('mission select');
  const norm = t => after(t, /^begin:h4$/).join(' > ');
  h.log('same order?', [t1, t2, t3, t4].map(norm));
  h.assert(norm(t1) && norm(t1) === norm(t2) && norm(t1) === norm(t3) && norm(t1) === norm(t4), 'identical order on all four entry paths');

  // ---------- h5: the charge sheet and warrant come first, then the Commander, then the briefing ----------
  await h.step(400);
  await B.toHub('m6', BASE.concat(['m4', 'h4', 'm5']), S => {
    S.game.mem = { hubs:{ h2:1, h4:1 }, street:{}, phone:{}, reply:{}, seen:{} };
    S.game.intel = { items:{}, briefed:{ m3:true, m4:true } };
    S.game.accusations = { lagos:{ suspect:'obi', method:'alerts', money:'wallet', ok:{ suspect:true, method:true, money:true }, warrant:'signed', settled:'m3' } };
  });
  h.assert(await h.ev(() => S.game.currentMission === 'h5'), 'h5 office before Asaba');
  await B.warrant({ strength:70, signed:true, refused:false, strikes:0, need:'' });
  await B.trace();
  await B.hubPrep(); await B.commander(); await B.dialogues();
  h.assert(await B.shown('screen-charge') && !(await B.shown('screen-briefing')), 'h5: the route charge sheet comes before the briefing');
  await B.fileSheet({ suspect:'ifeanyi', method:'route', money:'asaba' });
  await B.dialogues();
  let st = await B.brf();
  h.assert(st.shown && st.k === 'm5', 'h5: briefing after the sheet, the warrant and the Commander\'s lines');
  h.assert(/Abuja/.test(await B.text('#screen-briefing .brf-say')), 'h5: Abuja does the Abuja work');
  await B.plan(['tunde'], { order:'quiet' });
  await B.runToEnd();
  await B.click('#screen-briefing [data-b="done"]');
  await h.step(3400);
  const t5 = await B.trail();
  h.log('h5 trail', t5.join(' > '));
  const j = re => idx(t5, re);
  h.assert(j(/^dlg:cw_gate_intro$/) < j(/^ov:screen-charge$/) && j(/^ov:screen-charge$/) < j(/^dlg:hub_cmd_run$/) && j(/^dlg:hub_cmd_run$/) < j(/^ov:screen-briefing$/)
    && j(/^ov:screen-briefing$/) < j(/^card:ASABA$/) && j(/^card:ASABA$/) < j(/^load:m6$/), 'h5: sheet → warrant → Commander → briefing → ASABA card → M6');
  h.assert(await h.ev(() => S.game.accusations.route.warrant === 'signed' && S.game.intel.briefed.m5 === true), 'h5: the route warrant is the beta\'s, the briefing done');

  // ---------- h6: briefing with the production order, then UGBOWO ----------
  await h.step(400);
  await B.toHub('m7', BASE.concat(['m4', 'h4', 'm5', 'h5', 'm6']), S => {
    S.game.mem = { hubs:{ h2:1, h4:1, h5:1 }, street:{}, phone:{}, reply:{}, seen:{} };
    S.game.intel = { items:{}, briefed:{ m3:true, m4:true, m5:true } };
    S.game.evidence = [{ id:'asaba_sims', name:'SIMs' }, { id:'asaba_hostage', name:'Tobi' }];
    S.game.moralChoices.asaba = 'rescue';
  });
  h.assert(await h.ev(() => S.game.currentMission === 'h6'), 'h6 office before Ugbowo');
  await B.warrant({ strength:70, signed:true, refused:false, strikes:0, need:'' });
  await B.trace();
  await B.callCommander();
  st = await B.brf();
  h.assert(st.shown && st.k === 'm6', 'h6: the briefing opens in the call');
  h.assert(/radio tonight/.test(await B.text('#screen-briefing .brf-say')), 'h6: "have you heard the radio tonight?"');
  await B.plan(['burner', 'tobi'], { press:'quiet' });
  await B.runToEnd();
  await B.click('#screen-briefing [data-b="done"]');
  await h.step(3400);
  const t6 = await B.trail();
  h.assert(idx(t6, /^ov:screen-briefing$/) < idx(t6, /^card:UGBOWO$/) && idx(t6, /^card:UGBOWO$/) < idx(t6, /^load:m7$/), 'h6: briefing → UGBOWO card → M7');

  // ---------- h7: the briefing comes before the car tail (t7) ----------
  await h.step(400);
  await B.toHub('t7', BASE.concat(['m4', 'h4', 'm5', 'h5', 'm6', 'h6', 'm7']), S => {
    S.game.mem = { hubs:{ h2:1, h4:1, h5:1, h6:1 }, street:{}, phone:{}, reply:{}, seen:{} };
    S.game.intel = { items:{}, briefed:{ m3:true, m4:true, m5:true, m6:true }, warrants:{ w_cdr:{ status:'signed' } } };
    S.game.evidence = [{ id:'tower_fix', name:'Handset fix' }];
  });
  h.assert(await h.ev(() => S.game.currentMission === 'h7'), 'h7 office before the car');
  await B.warrant({ strength:70, signed:true, refused:false, strikes:0, need:'' });
  await B.trace();
  await h.ev(() => { window.__stopT7 = true; });
  await B.callCommander();
  st = await B.brf();
  h.assert(st.shown && st.k === 'm7', 'h7: the briefing opens in the call, before the tail');
  const say7 = await B.text('#screen-briefing .brf-say');
  h.assert(/You have the area/.test(say7) && !/Tonight we choose how we go in\.$/.test(say7), 'h7: the intro follows "you know where he is"');
  await B.plan(['tip', 'pattern']);
  await B.runToEnd();
  await B.click('#screen-briefing [data-b="done"]');
  await h.step(3400);
  const t7 = await B.trail();
  h.log('h7 trail', t7.join(' > '));
  h.assert(idx(t7, /^ov:screen-briefing$/) < idx(t7, /^card:UGBOWO JUNCTION$/) && idx(t7, /^card:UGBOWO JUNCTION$/) < idx(t7, /^load:t7$/), 'h7: briefing → UGBOWO JUNCTION card → the car');
  h.assert(await h.ev(() => window.__t7 === true && S.game.intel.briefed.m7 === true), 'h7: the car starts after the briefing');
  await h.ev(() => { window.__stopT7 = false; });

  // ---------- Night Shift → Week-1 briefing → the BENIN BYPASS card → M4 ----------
  await h.step(300);
  await h.start('m3n', { completed:['m0', 'm1', 'm2', 'h2', 'm3'], briefings:true, wait:3600, state:S => {
    S.game.mem = { hubs:{ h2:1 }, street:{}, phone:{}, reply:{}, seen:{} };
    S.game.intel = { items:{}, briefed:{} };
    S.game.evidence = [{ id:'laptop', name:'Encrypted laptop' }];
    S.game.accusations = { lagos:{ suspect:'obi', method:'alerts', money:'wallet', ok:{ suspect:true, method:true, money:true }, warrant:'signed', settled:'m3' } };
  } });
  h.assert(await h.ev(() => S.game.currentMission === 'm3n'), 'Night Shift is running');
  await B.trace();
  await h.ev(() => { ['n1_uche', 'n2_desk', 'n3_table'].forEach(id => completeObjective(id)); ENGINE.interactables.find(i => /^Go home/.test(i.label || '')).onInteract(); });
  await h.step(300);
  st = await B.brf();
  h.assert(st.shown && st.k === 'm3' && !(await h.ev(() => !!document.querySelector('#title-card.show'))), 'Go home → the Week-1 briefing, before the BENIN BYPASS card');
  h.assert(!(await B.badge()), 'Week 1 is in person, not a video call');
  h.assert(/NACECA HQ · LAGOS/.test(await B.text('#brf-bar')) && /BRIEFING · AFTER LEKKI/.test(await B.text('#brf-bar')), 'Week 1 header, no WEEK number');
  await B.plan(['drives', 'pos']);
  await B.runToEnd({ gk:{ gk_pos:'custom' } });
  await B.click('#screen-briefing [data-b="done"]');
  await h.step(300);
  h.assert(await h.ev(() => !!document.querySelector('#title-card.show') && /BENIN BYPASS/.test(document.getElementById('title-card').textContent)), 'then the BENIN BYPASS card');
  await h.step(3300);
  const tw = await B.trail();
  h.log('week-1 trail', tw.join(' > '));
  // the trace sits outside v13's titleCard wrap: it sees the card asked for, held for the briefing, then M4
  h.assert(idx(tw, /^card:BENIN BYPASS$/) < idx(tw, /^ov:screen-briefing$/) && idx(tw, /^ov:screen-briefing$/) < idx(tw, /^load:m4$/), 'card held → briefing → (card shown, above) → loadMission(m4)');
  h.assert(await h.ev(() => S.game.currentMission === 'm4' && !!document.querySelector('#screen-controls.show') && S.game.intel.briefed.m3 === true && !S.game.intel.brfOpen), 'M4 controls; Week 1 done');

  // ---------- h.start-style direct starts are never intercepted ----------
  await h.step(300);
  await h.start('m4', { completed:['m0', 'm1', 'm2', 'h2', 'm3', 'm3n'], briefings:true, state:S => { S.game.intel = { items:{}, briefed:{} }; } });
  h.assert(await h.ev(() => S.game.currentMission === 'm4' && !document.querySelector('#screen-briefing.show')), 'h.start(m4) with Week 1 unbriefed starts M4 (no interception)');
  await h.start('m6', { completed:BASE.concat(['m4', 'h4', 'm5']), briefings:true, state:S => { S.game.mem = { hubs:{ h2:1, h4:1, h5:1 }, street:{}, phone:{}, reply:{}, seen:{} }; S.game.intel = { items:{}, briefed:{} }; } });
  h.assert(await h.ev(() => S.game.currentMission === 'm6' && !document.querySelector('#screen-briefing.show')), 'h.start(m6) with the hub done starts M6 (no interception)');
  h.log('PASS v13_b_order');
};
