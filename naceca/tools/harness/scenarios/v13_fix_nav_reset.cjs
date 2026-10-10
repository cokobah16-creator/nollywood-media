// v13 fix · navigation (R09): a quit, a load or a new operation resets the model's Esc registry without
// stranding an owner that still counts its overlay as registered.
//   node tools/harness/run.cjs tools/harness/scenarios/v13_fix_nav_reset.cjs --html <build>/naceca.html [--w 1280 --h 800]
// 1. The registry: a reset puts each registration to sleep; while asleep it changes nothing (Esc and RESUME
//    behave as the beta); when its owner shows the overlay again it is live again; v13ModalEnd ends it; the
//    base dialogue box a gatekeeper call borrows is never brought back.
// 2. The real path (the finding's p6): h6 briefing → warrant step → BACK TO THE OPERATIONS TABLE →
//    CAPABILITIES → Esc → QUIT → CONTINUE (no reload) → the Commander → the same briefing: Esc does nothing,
//    the HUD pause menu's RESUME brings it back; then LOAD from a pause over it, the same again; finishing the
//    briefing ends the registration for good.
const LIB = require('./v13_b_lib.cjs');
const BASE = ['m0', 'm1', 'm2', 'h2', 'm3', 'm3n', 'm4', 'h4', 'm5', 'h5', 'm6'];
module.exports = async h => {
  const B = LIB.lib(h);
  const st = () => h.ev(() => ({ cur:S.game.currentMission, move:ENGINE.movementEnabled, hud:document.getElementById('hud').style.display !== 'none',
    ov:[...document.querySelectorAll('.overlay.show')].map(o => o.id), brf:window.BRF && BRF.k, phase:window.BRF && BRF.phase,
    modals:V13NAV.modals.map(m => m.id), dormant:(V13NAV.dormant || []).map(m => m.id), stack:V13NAV.stack.length }));
  const esc = async () => { await h.page.keyboard.press('Escape'); await h.step(200); };
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  // ---------- 1. the registry ----------
  await h.start('m2', { completed:['m0', 'm1'] });
  await h.ev(() => {
    const ov = document.createElement('div'); ov.className = 'overlay'; ov.id = 'screen-v13x';
    ov.innerHTML = '<div class="overlay-bg"></div><div class="settings-frame"><div class="settings-body"><h2>A V13 FLOW</h2></div></div>';
    document.getElementById('game-root').appendChild(ov);
    window.__rs = 0;
    showHUD(false); ENGINE.movementEnabled = false;
    v13Modal('screen-v13x', { onEsc:null, resume:() => { window.__rs++; } });
    showOverlay('screen-v13x');
  });
  await esc(); await esc();
  h.assert(eq((await st()).ov, ['screen-v13x']), 'registered: Esc twice does nothing');
  await h.ev(() => { showOverlay(null); showHUD(true); ENGINE.movementEnabled = true; v13NavReset(); });
  let s = await st();
  h.assert(!s.modals.includes('screen-v13x') && s.dormant.includes('screen-v13x'), 'a reset puts the registration to sleep ' + JSON.stringify(s));
  // asleep it changes nothing: Esc pauses and resumes as the beta does, and the capability screen resumes to the field
  await esc(); s = await st();
  h.assert(eq(s.ov, ['screen-pause']) && await h.ev(() => V13NAV.under === null), 'asleep: Esc in the field opens the pause menu, covering nothing');
  await esc(); s = await st();
  h.assert(s.ov.length === 0 && s.hud && s.move === true, 'asleep: Esc again resumes play ' + JSON.stringify(s));
  await h.page.keyboard.press('KeyK'); await h.step(200);
  h.assert(eq((await st()).ov, ['screen-skills']), 'K opens the capability screen');
  await esc(); await esc(); s = await st();
  h.assert(s.ov.length === 0 && s.hud, 'asleep: K → Esc → Esc resumes to the field as before ' + JSON.stringify(s));
  // its owner shows it again: live again
  await h.ev(() => { showHUD(false); ENGINE.movementEnabled = false; showOverlay('screen-v13x'); });
  s = await st();
  h.assert(s.modals.includes('screen-v13x') && !s.dormant.includes('screen-v13x'), 'shown again by its owner: registered again ' + JSON.stringify(s));
  await esc(); await esc();
  h.assert(eq((await st()).ov, ['screen-v13x']), 'shown again: Esc twice does nothing');
  await h.ev(() => togglePause()); await h.step(100);
  await h.ev(() => document.getElementById('btn-resume').click()); await h.step(150);
  h.assert(eq((await st()).ov, ['screen-v13x']) && await h.ev(() => window.__rs) === 1, 'shown again: a pause over it resumes into it, with its resume()');
  // asleep, then ended by its owner: gone for good
  await h.ev(() => { showOverlay(null); v13NavReset(); v13ModalEnd('screen-v13x'); showOverlay('screen-v13x'); });
  s = await st();
  h.assert(!s.modals.includes('screen-v13x') && !s.dormant.includes('screen-v13x'), 'v13ModalEnd ends a sleeping registration ' + JSON.stringify(s));
  await h.ev(() => { showOverlay(null); showHUD(true); ENGINE.movementEnabled = true; });
  // the borrowed dialogue box: a base dialogue after a reset pauses as before
  await h.ev(() => { v13Modal('screen-dialogue', { onEsc:null }); v13NavReset(); DIALOGUE.__fixreset = [{ speaker:'SGT. UCHE', kind:'uche', text:'One more thing.' }]; startDialogue('__fixreset'); });
  await h.step(150);
  s = await st();
  h.assert(!s.dormant.includes('screen-dialogue') && !s.modals.includes('screen-dialogue'), 'the borrowed dialogue box is not kept ' + JSON.stringify(s));
  await esc();
  h.assert(eq((await st()).ov, ['screen-pause']), 'a base dialogue after a reset: Esc opens the pause menu as before');
  await esc();
  await h.ev(() => { if(DLG.script){ DLG.idx = 99; renderDialogueLine(); } showOverlay(null); showHUD(true); ENGINE.movementEnabled = true; });
  await h.step(400);

  // ---------- 2. the real path ----------
  await B.toHub('m7', BASE, S => {
    S.game.mem = { hubs:{ h2:1, h4:1, h5:1 }, street:{}, phone:{}, reply:{}, seen:{} };
    S.game.intel = { items:{}, briefed:{ m3:true, m4:true, m5:true } };
    S.game.evidence = [{ id:'asaba_sims', name:'SIMs' }];
    S.game.moralChoices.asaba = 'rescue';
  });
  await B.warrant({ strength:30, signed:false, refused:false, strikes:1, need:'Needs stronger evidence' });
  await B.callCommander();
  await B.plan(['burner', 'trustees'], { press:'quiet' });
  await B.runToEnd({ until: s => s.phase === 'warrant' || s.fin, gk:{ gk_foundation:'respect' } });
  s = await st();
  h.assert(eq(s.ov, ['screen-briefing']) && s.phase === 'warrant' && s.modals.includes('screen-briefing'), 'h6: the briefing at the warrant step, registered ' + JSON.stringify(s));
  await B.click('#screen-briefing [data-b="w-ops"]');
  await B.click('#ops-caps'); await h.step(200);
  h.assert(eq((await st()).ov, ['screen-skills']), 'BACK TO THE OPERATIONS TABLE → CAPABILITIES');
  await esc();
  h.assert(eq((await st()).ov, ['screen-pause']), 'Esc there opens the pause menu');
  await B.click('#btn-quit'); await h.step(300);
  s = await st();
  h.assert(eq(s.ov, ['screen-title']) && s.modals.length === 0 && s.stack === 0 && s.dormant.includes('screen-briefing'), 'QUIT: the flow is reset, the briefing\'s registration asleep ' + JSON.stringify(s));
  const reopen = async label => {
    await h.ev(() => { const b = document.getElementById('btn-recap-go'); if(b && document.querySelector('#screen-recap.show')) b.click(); });
    await h.step(3600);
    await h.ev(() => { if(typeof SIDE !== 'undefined') SIDE.mid = null; });
    await B.callCommander();
    let x = await st();
    h.assert(eq(x.ov, ['screen-briefing']) && x.brf === 'm6' && x.modals.includes('screen-briefing'), label + ': the Commander reopens the same briefing, registered ' + JSON.stringify(x));
    await esc();
    x = await st();
    h.assert(eq(x.ov, ['screen-briefing']), label + ': Esc on the briefing does nothing (no pause menu over it) ' + JSON.stringify(x));
    await esc();
    x = await st();
    h.assert(eq(x.ov, ['screen-briefing']) && x.brf === 'm6' && x.move === false, label + ': Esc again: still the briefing, still pending, not a frozen hub ' + JSON.stringify(x));
    await h.ev(() => togglePause()); await h.step(150);
    h.assert(eq((await st()).ov, ['screen-pause']), label + ': a HUD pause opens over it');
  };
  await h.ev(() => document.getElementById('btn-continue').click()); await h.step(400);
  await reopen('QUIT → CONTINUE');
  await B.click('#btn-resume'); await h.step(200);
  s = await st();
  h.assert(eq(s.ov, ['screen-briefing']) && s.brf === 'm6', 'QUIT → CONTINUE: RESUME brings the briefing back ' + JSON.stringify(s));
  // LOAD from a pause over it: the same
  await h.ev(() => { if(typeof saveGame === 'function') saveGame(true); togglePause(); }); await h.step(150);
  await B.click('#btn-load'); await h.step(300);
  s = await st();
  h.assert(!s.ov.includes('screen-briefing') && s.modals.length === 0, 'LOAD resets the flow ' + JSON.stringify(s));
  await reopen('LOAD');
  await B.click('#btn-resume'); await h.step(200);
  h.assert(eq((await st()).ov, ['screen-briefing']), 'LOAD: RESUME brings the briefing back');
  // finishing the briefing ends the registration for good
  await B.runToEnd({ gk:{ gk_foundation:'respect' } });
  await B.click('#screen-briefing [data-b="done"]'); await h.step(600);
  s = await st();
  h.assert(!s.modals.includes('screen-briefing') && !s.dormant.includes('screen-briefing'), 'the finished briefing is neither registered nor asleep ' + JSON.stringify(s));

  h.assert(h.errors.length === 0, 'no page errors: ' + h.errors.join(' | '));
};
