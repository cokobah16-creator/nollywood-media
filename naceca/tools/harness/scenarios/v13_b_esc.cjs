// v13 · B · Esc and pause never soft-lock a briefing (design §2, A2).
// Esc is ignored on the briefing, the van, the wire and a gatekeeper call run from the briefing;
// if the pause menu is opened over them anyway, Resume brings the same screen back; Esc twice
// never drops the pending continuation; briefing → operations table → Esc/close → the same step;
// briefing → Case Desk → back → the briefing. Once the briefing is over, Esc works as before.
const LIB = require('./v13_b_lib.cjs');
const BASE = ['m0', 'm1', 'm2', 'h2', 'm3', 'm3n', 'm4', 'h4', 'm5'];
module.exports = async h => {
  const B = LIB.lib(h);
  const esc = async (n = 1) => { for(let i = 0; i < n; i++){ await h.page.keyboard.press('Escape'); await h.step(150); } };
  const pauseOver = async () => { await h.ev(() => { showOverlay('screen-pause'); }); await h.step(100); h.assert(await B.shown('screen-pause'), 'pause forced open'); await h.ev(() => document.getElementById('btn-resume').click()); await h.step(200); };
  const pending = () => h.ev(() => window.__escDone === 0 && !!BRF.k);

  await B.toHub('m6', BASE, S => {
    S.game.mem = { hubs:{ h2:1, h4:1 }, street:{}, phone:{}, reply:{}, seen:{} };
    S.game.intel = { items:{}, briefed:{ m3:true, m4:true }, reg:{ found:{ bluewater:true, apex:true }, ctc:{} } };
    S.game.accusations = { lagos:{ suspect:'obi', method:'alerts', money:'wallet', ok:{ suspect:true, method:true, money:true }, warrant:'signed', settled:'m3' },
      route:{ suspect:'ifeanyi', method:'route', money:'asaba', ok:{ suspect:true, method:true, money:true }, warrant:'signed' } };
  });
  h.assert(await h.ev(() => S.game.currentMission === 'h5'), 'h5 office');
  await B.callCommander();
  // the hub's own continuation is wrapped so the test can count it
  await h.ev(() => { window.__escDone = 0; const t = BRF.then; BRF.then = () => { window.__escDone++; if(t) t(); }; });

  // ---------- the plan ----------
  h.assert(await B.shown('screen-briefing'), 'briefing up');
  await esc(1);
  h.assert(await B.shown('screen-briefing') && !(await B.shown('screen-pause')), 'Esc on the briefing: ignored (no pause over it)');
  await esc(2);
  h.assert(await B.shown('screen-briefing') && await pending(), 'Esc twice: still the briefing, the continuation still pending');
  await pauseOver();
  h.assert(await B.shown('screen-briefing') && await pending(), 'pause opened over the briefing → Resume brings it back');
  h.assert(await h.ev(() => document.querySelectorAll('#screen-briefing [data-b="lead"]').length === 3), 'and it is rendered');
  // the Case Desk and back
  if(await h.ev(() => typeof openDesk === 'function')){
    await B.click('#screen-briefing [data-b="desk"]');
    h.assert(await B.shown('screen-desk'), 'CASE DESK opens');
    await h.ev(() => (document.getElementById('btn-desk-close') || document.querySelector('#screen-desk [data-act="close"]')).click());
    await h.step(200);
    h.assert(await B.shown('screen-briefing') && await h.ev(() => document.querySelectorAll('#screen-briefing [data-b="lead"]').length === 3), 'Case Desk BACK returns to the briefing, rendered');
  }

  // ---------- the van ----------
  await B.plan(['stakeout', 'undercover'], { order:'comply' });
  h.assert(await B.shown('screen-so'), 'the van');
  await esc(2);
  h.assert(await B.shown('screen-so') && !(await B.shown('screen-pause')) && await pending(), 'Esc in the van: ignored');
  await B.click('#screen-so [data-so="photo"]');
  await pauseOver();
  h.assert(await B.shown('screen-so') && /FRAMES 3/.test(await B.text('#so-frames')), 'pause over the van → Resume: the same van, same beat');
  h.assert(!(await B.badge()), 'call badge off in the van');
  await B.vanDrive(['next', 'next', 'next', 'next', 'next', 'next', 'follow', 'finish']);
  h.assert(await B.shown('screen-briefing') && await B.badge(), 'back on the call');

  // ---------- the wire ----------
  await B.click('#screen-briefing [data-b="next"]');
  h.assert(await B.shown('screen-uc'), 'the wire');
  await esc(2);
  h.assert(await B.shown('screen-uc') && await pending(), 'Esc on the wire (cover card): ignored');
  await B.click('#screen-uc [data-uc="go"]');
  await esc(1);
  await pauseOver();
  h.assert(await B.shown('screen-uc') && /RECEPTIONIST/.test(await B.text('#uc-body')), 'pause over the wire → Resume: the same question');
  await B.ucDrive([['ans', 0], ['ans', 0], 'skip', ['ans', 0], ['ans', 0], 'skip', ['ans', 0], 'skip', 'end']);
  h.assert(await B.shown('screen-briefing') && await pending(), 'back to the briefing');

  // ---------- finish: the continuation runs once, then Esc behaves as before ----------
  await B.click('#screen-briefing [data-b="done"]');
  await h.step(200);
  h.assert(await h.ev(() => window.__escDone === 1 && !BRF.k), 'the continuation ran once');
  await h.step(3300);
  h.assert(await h.ev(() => S.game.currentMission === 'm6' && !!document.querySelector('#screen-controls.show')), 'on to M6');
  await esc(1);
  h.assert(await B.shown('screen-pause'), 'after the briefing Esc opens the pause menu again (nothing left registered)');
  await esc(1);
  h.assert(!(await B.shown('screen-pause')), 'and closes it');

  // ---------- a gatekeeper call, and the operations table from the warrant step (h6) ----------
  await h.step(300);
  await B.toHub('m7', BASE.concat(['h5', 'm6']), S => {
    S.game.mem = { hubs:{ h2:1, h4:1, h5:1 }, street:{}, phone:{}, reply:{}, seen:{} };
    S.game.intel = { items:{}, briefed:{ m3:true, m4:true, m5:true } };
    S.game.evidence = [{ id:'asaba_sims', name:'SIMs' }];
  });
  await B.warrant({ strength:30, signed:false, refused:false, strikes:1, need:'Needs stronger evidence' });
  await B.callCommander();
  await h.ev(() => { window.__escDone = 0; const t = BRF.then; BRF.then = () => { window.__escDone++; if(t) t(); }; });
  await B.plan(['burner', 'trustees'], { press:'quiet' });
  await B.click('#screen-briefing [data-b="next"]');
  h.assert(await B.shown('screen-dialogue') && await h.ev(() => DLG.scriptKey === 'gk_foundation'), 'the trustees call');
  await esc(2);
  h.assert(await B.shown('screen-dialogue') && !(await B.shown('screen-pause')) && await h.ev(() => DLG.scriptKey === 'gk_foundation'), 'Esc during a briefing call: ignored');
  await pauseOver();
  h.assert(await B.shown('screen-dialogue'), 'pause over the call → Resume: the call');
  await B.dialogues(); await B.choose('donor'); await B.dialogues();
  await h.step(200);
  h.assert(await B.shown('screen-briefing'), 'call over → the briefing');
  await B.runToEnd({ until: s => s.phase === 'warrant' });
  await B.click('#screen-briefing [data-b="w-ops"]');
  h.assert(await B.shown('screen-ops'), 'the operations table');
  await esc(1);
  h.assert(await B.shown('screen-briefing') && await h.ev(() => BRF.phase === 'warrant'), 'Esc on the table closes it → the same warrant step');
  await B.click('#screen-briefing [data-b="w-ops"]');
  await h.ev(() => document.getElementById('ops-close').click());
  await h.step(200);
  h.assert(await B.shown('screen-briefing') && await h.ev(() => BRF.phase === 'warrant') && await B.badge(), 'close on the table → the same step, back on the call');
  await B.click('#screen-briefing [data-b="w-none"]', 2);
  await B.runToEnd();
  await B.click('#screen-briefing [data-b="done"]');
  await h.step(200);
  h.assert(await h.ev(() => window.__escDone === 1), 'h6 continuation once');
  await h.step(3300);
  h.log('PASS v13_b_esc');
};
