// v13 · B · briefings are transactional (design A4): quit at each phase, reload the page, Continue.
// No re-plan once committed, no effect counted twice, the van and the wire resume where they were,
// a pending court order is asked again, and an uncommitted plan simply starts over.
const LIB = require('./v13_b_lib.cjs');
const BASE = ['m0', 'm1', 'm2', 'h2', 'm3', 'm3n'];
const LAGOS = { suspect:'obi', method:'alerts', money:'wallet', ok:{ suspect:true, method:true, money:true }, warrant:'signed', settled:'m3' };
module.exports = async h => {
  const B = LIB.lib(h);
  const toBriefing = async () => { await B.callCommander(); const st = await B.brf(); h.assert(st.shown, 'the briefing is on screen (' + JSON.stringify(st) + ')'); return st; };
  const resumeHub = async () => {
    await B.reload(); await B.continueGame();
    await h.ev(() => { if(typeof SIDE !== 'undefined') SIDE.mid = null; });
    return toBriefing();
  };
  const finishAll = async (o) => { await B.runToEnd(o); await B.click('#screen-briefing [data-b="done"]'); await h.step(3400); };
  const d = (a, b) => ({ intel:b.intel - a.intel, pt:b.rep.publicTrust - a.rep.publicTrust, af:b.rep.agencyFavour - a.rep.agencyFavour, in:b.rep.integrity - a.rep.integrity, alert:b.alert - a.alert, ev:b.ev - a.ev, drop:b.drop - a.drop, req:b.req - a.req });

  // ---------- 1. h4, quit during the plan: nothing committed, the plan starts over ----------
  await B.toHub('m5', BASE.concat(['m4']), S => {
    S.game.mem = { hubs:{ h2:1 }, street:{}, phone:{}, reply:{}, seen:{} };
    S.game.intel = { items:{ ransom_ledger:{ id:'ransom_ledger', m:'m4', cert:false, custody:[{ t:'Logged by Agt. Kelechi' }] } }, briefed:{ m3:true } };
    S.game.evidence = [{ id:'ransom_ledger', name:'Ransom route ledger' }];
    S.game.accusations = { lagos:{ suspect:'obi', method:'alerts', money:'wallet', ok:{ suspect:true, method:true, money:true }, warrant:'signed', settled:'m3' } };
  });
  await toBriefing();
  const s0 = await B.snap();
  await B.click('#screen-briefing [data-b="lead"][data-id="musa"]');
  let st = await resumeHub();
  h.assert(st.k === 'm4' && st.phase === 'plan' && !st.rec && !st.briefed.m4, 'plan quit: the plan opens fresh');
  h.assert(await h.ev(() => !document.querySelector('#screen-briefing [data-b="lead"][aria-pressed="true"]')), 'plan quit: nothing pre-selected');

  // ---------- 2. h4, quit on the final page: committed results come back, effects once ----------
  await B.plan(['musa', 'cac'], { custody:'gave' });
  await B.runToEnd();
  const s1 = await B.snap();
  h.log('h4 commit deltas', d(s0, s1));
  st = await resumeHub();
  h.assert(st.k === 'm4' && st.phase === 'out' && st.rec && st.rec.ran.length === 2 && st.briefed.m4 === 'committed', 'final-page quit: resumes on the results, no re-plan');
  h.assert(await B.has('#screen-briefing [data-b="done"]') && !(await B.has('#screen-briefing [data-b="next"]')), 'nothing left to run');
  h.assert(/Sent to her office|Lagos by courier/.test(await B.text('#screen-briefing .brf-note')), 'the results are rebuilt from the record');
  await B.click('#screen-briefing [data-b="done"]'); await h.step(3400);
  const s2 = await B.snap();
  const dd = d(s0, s2);
  h.log('h4 total deltas', dd);
  h.assert(dd.af === 3 && dd.intel === 14 && dd.drop === 1, 'custody +3 Agency once, Musa 6 + CAC 8 intel once, one dropped lead');
  h.assert(await h.ev(() => S.game.intel.items.ransom_ledger.custody.filter(c => /Office of the Commander/.test(c.t)).length === 1), 'one custody line');
  h.assert(await h.ev(() => S.game.intel.briefed.m4 === true && !S.game.intel.brf && !!V12.mem().hubs.h4 && S.game.currentMission === 'm5'), 'finished once; on to M5');

  // ---------- 3. h5, quit inside the Abuja van: it resumes at the same beat ----------
  await h.step(300);
  await B.toHub('m6', BASE.concat(['m4', 'h4', 'm5']), S => {
    S.game.mem = { hubs:{ h2:1, h4:1 }, street:{}, phone:{}, reply:{}, seen:{} };
    S.game.intel = { items:{}, briefed:{ m3:true, m4:true }, reg:{ found:{ bluewater:true, apex:true }, ctc:{} } };
    S.game.accusations = { lagos:{ suspect:'obi', method:'alerts', money:'wallet', ok:{ suspect:true, method:true, money:true }, warrant:'signed', settled:'m3' },
      route:{ suspect:'ifeanyi', method:'route', money:'asaba', ok:{ suspect:true, method:true, money:true }, warrant:'signed' } };
  });
  await toBriefing();
  const v0 = await B.snap();
  await B.plan(['stakeout', 'tunde'], { order:'comply' });
  h.assert(await B.shown('screen-so'), 'the van opens after COMMIT');
  for(const a of ['photo', 'next', 'next', 'photo']) await B.click(`#screen-so [data-so="${a}"]`);
  const van = await h.ev(() => JSON.parse(JSON.stringify(S.game.intel.so)));
  h.assert(van.i === 2 && van.frames === 2 && van.log.length === 2, 'van state saved after every action');
  st = await resumeHub();
  h.assert(st.phase === 'out' && st.rec && st.rec.ran.length === 0 && /THE ENGINEER/.test(await B.text('#screen-briefing .brf-note')), 'van quit: results so far, decisions not re-asked');
  await B.click('#screen-briefing [data-b="next"]');
  h.assert(await B.shown('screen-so'), 'NEXT reopens the van');
  const vr = await h.ev(() => ({ clock:document.getElementById('so-clock').textContent, frames:document.getElementById('so-frames').textContent, log:document.querySelectorAll('#so-log .so-ll').length }));
  h.log('van after reload', vr);
  h.assert(vr.clock === '15:20' && vr.frames === 'FRAMES 2' && vr.log === 2, 'same beat, same frames, same log');
  h.assert(await h.ev(() => !!document.querySelector('#screen-so [data-so="photo"][disabled]')), 'the photo already taken at this beat stays taken');
  await finishAll();
  const v1 = await B.snap();
  h.log('h5 van deltas', d(v0, v1));
  h.assert(d(v0, v1).af === 4 && d(v0, v1).intel === 4, 'comply +4 Agency once, Tunde +4 intel once (the van gives no intel in Senior)');

  // ---------- 4. h5, quit on the wire: the suspicion and the log are kept ----------
  await h.step(300);
  await B.toHub('m6', BASE.concat(['m4', 'h4', 'm5']), S => {
    S.game.mem = { hubs:{ h2:1, h4:1 }, street:{}, phone:{}, reply:{}, seen:{} };
    S.game.intel = { items:{}, briefed:{ m3:true, m4:true }, reg:{ found:{ bluewater:true, apex:true }, ctc:{} } };
    S.game.accusations = { lagos:{ suspect:'obi', method:'alerts', money:'wallet', ok:{ suspect:true, method:true, money:true }, warrant:'signed', settled:'m3' },
      route:{ suspect:'ifeanyi', method:'route', money:'asaba', ok:{ suspect:true, method:true, money:true }, warrant:'signed' } };
  });
  await toBriefing();
  const u0 = await B.snap();
  await B.plan(['undercover'], { order:'quiet' });
  h.assert(await B.shown('screen-uc'), 'the wire opens');
  await B.click('#screen-uc [data-uc="go"]');
  await B.click('#screen-uc [data-uc="ans"][data-k="1"]');                  // "Kelechi— sorry": +35
  await B.click('#screen-uc [data-uc="ans"][data-k="0"]');
  await B.click('#screen-uc [data-uc="probe"]');                            // +15, the book
  const uc = await h.ev(() => JSON.parse(JSON.stringify(S.game.intel.uc)));
  h.assert(uc.i === 3 && uc.sus === 50 && uc.got.join() === 'uc_book', 'wire state saved');
  st = await resumeHub();
  await B.click('#screen-briefing [data-b="next"]');
  h.assert(await B.shown('screen-uc'), 'NEXT reopens the wire');
  const ur = await h.ev(() => ({ val:document.getElementById('uc-val').textContent, who:(document.querySelector('#screen-uc .uc-who') || {}).textContent, log:document.querySelectorAll('#screen-uc .uc-log').length }));
  h.log('wire after reload', ur);
  h.assert(ur.val === '50' && /BRIGGS/.test(ur.who) && ur.log === 3, 'same question, same suspicion, same log');
  await finishAll({ uc:[['ans', 0], ['ans', 0], 'skip', ['ans', 0], 'skip', 'end'] });
  const u1 = await B.snap();
  h.log('h5 wire deltas', d(u0, u1));
  h.assert(d(u0, u1).intel === 8 + 6 && d(u0, u1).ev === 1 && d(u0, u1).alert === 0, 'quiet +8 intel and one exhibit, the book +6, once each');

  // ---------- 5. h6, quit at the court-order step: asked again, decided once ----------
  await h.step(300);
  await B.toHub('m7', BASE.concat(['m4', 'h4', 'm5', 'h5', 'm6']), S => {
    S.game.mem = { hubs:{ h2:1, h4:1, h5:1 }, street:{}, phone:{}, reply:{}, seen:{} };
    S.game.intel = { items:{}, briefed:{ m3:true, m4:true, m5:true } };
    S.game.evidence = [{ id:'asaba_sims', name:'SIMs' }, { id:'asaba_hostage', name:'Tobi' }];
    S.game.moralChoices.asaba = 'rescue';
  });
  await toBriefing();
  const w0 = await B.snap();
  await B.plan(['burner', 'tobi'], { press:'trace' });
  await B.runToEnd({ until: s => s.phase === 'warrant' });
  st = await B.brf();
  h.assert(st.phase === 'warrant' && st.rec.ran.length === 2, 'at the order step');
  st = await resumeHub();
  h.assert(st.phase === 'out' && st.rec.ran.length === 2 && !st.rec.warrantDone, 'warrant quit: leads not re-run');
  await B.click('#screen-briefing [data-b="next"]');
  st = await B.brf();
  h.assert(st.phase === 'warrant', 'NEXT asks for the order again');
  await B.click('#screen-briefing [data-b="w-none"]', 2);
  await finishAll();
  const w1 = await B.snap();
  h.log('h6 deltas', d(w0, w1));
  h.assert(d(w0, w1).pt === -2 && d(w0, w1).intel === 6 + 6 + 8, 'trace −2 Trust once; trace 6 + burner 6 + Tobi 8 intel once');
  h.assert(await h.ev(() => ((typeof V12.warrantState === 'function' ? V12.warrantState('w_cdr') : null) || S.game.intel.warrants.w_cdr).status === 'none'), 'w_cdr: went without');

  // ---------- 6. Week 1: quit mid-call (committed), then quit in a fresh plan ----------
  await h.step(300);
  await h.start('m3n', { completed:['m0', 'm1', 'm2', 'h2', 'm3'], briefings:true, wait:3600, state:S => {
    S.game.mem = { hubs:{ h2:1 }, street:{}, phone:{}, reply:{}, seen:{} };
    S.game.intel = { items:{}, briefed:{} };
    S.game.accusations = { lagos:{ suspect:'obi', method:'alerts', money:'wallet', ok:{ suspect:true, method:true, money:true }, warrant:'signed', settled:'m3' } };
  } });
  await h.ev(() => { ['n1_uche', 'n2_desk', 'n3_table'].forEach(id => completeObjective(id)); ENGINE.interactables.find(i => /^Go home/.test(i.label || '')).onInteract(); });
  await h.step(300);
  st = await B.brf();
  h.assert(st.shown && st.k === 'm3' && st.phase === 'plan', 'Week 1 plan');
  // a quit before COMMIT: Continue (loadMission m4) reopens the Week-1 plan, nothing applied
  await B.reload(); await B.continueGame(800);
  st = await B.brf();
  h.assert(st.shown && st.k === 'm3' && st.phase === 'plan' && !st.rec, 'Week-1 plan quit: Continue reopens the plan before the Bypass');
  const k0 = await B.snap();
  await B.plan(['pos', 'gatehouse']);
  h.assert(await B.shown('screen-dialogue') && await h.ev(() => DLG.scriptKey === 'gk_pos'), 'the POS call is running');
  await B.dialogues();
  await B.choose('custom');                                    // its +2 Trust waits for the call's outcome
  await B.reload(); await B.continueGame(800);
  st = await B.brf();
  h.assert(st.shown && st.k === 'm3' && st.phase === 'out' && st.rec && st.rec.ran.length === 0, 'Week-1 call quit: Continue resumes the committed briefing');
  h.assert(await h.ev(() => !document.querySelector('#title-card.show') && !document.querySelector('#screen-controls.show')), 'still before the Bypass');
  await B.click('#screen-briefing [data-b="next"]');
  await B.runToEnd({ gk:{ gk_pos:'custom' } });
  await B.click('#screen-briefing [data-b="done"]');
  await h.step(300);
  h.assert(await h.ev(() => /BENIN BYPASS/.test((document.querySelector('#title-card.show') || {}).textContent || '')), 'then the BENIN BYPASS card');
  await h.step(3300);
  const k1 = await B.snap();
  h.log('week-1 deltas', d(k0, k1));
  h.assert(d(k0, k1).pt === 2 && d(k0, k1).intel === 8 + 12, 'POS custom +2 Trust once; POS 8 + gatehouse 12 intel once');
  h.assert(await h.ev(() => S.game.currentMission === 'm4' && !!document.querySelector('#screen-controls.show') && S.game.intel.briefed.m3 === true && !S.game.intel.brf && !S.game.intel.brfOpen), 'M4 next; Week 1 closed');
  h.assert(await h.ev(() => S.game.intel.dropLog.filter(x => x.lead === 'drives').length === 1), 'one dropped lead');
  h.log('PASS v13_b_resume');
};
