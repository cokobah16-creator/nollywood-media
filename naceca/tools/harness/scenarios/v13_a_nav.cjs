// v13 A · navigation (design A2): v13Modal / v13ModalEnd and the single togglePause wrap — Esc over a
// registered v13 overlay calls its onEsc (or does nothing), a pause menu opened over one resumes back into
// it; v13OpenOps keeps a return stack so briefing → table → desk → table → close → desk → close → briefing
// unwinds in order, and Esc on a stacked table closes it. Beta behaviour without a v13 flow is unchanged.
const A_LIB = require('./v13_a_lib.cjs');
module.exports = async h => {
  const A = A_LIB.lib(h);
  await h.start('m2', { completed:['m0', 'm1'] });
  const shown = () => h.ev(() => [...document.querySelectorAll('.overlay.show')].map(o => o.id).join(','));
  const esc = async () => { await h.page.keyboard.press('Escape'); await h.step(120); };
  await h.ev(() => {
    for(const id of ['screen-v13a', 'screen-v13b']){
      const ov = document.createElement('div'); ov.className = 'overlay'; ov.id = id;
      ov.innerHTML = `<div class="overlay-bg"></div><div class="settings-frame"><div class="settings-body"><h2>${id === 'screen-v13a' ? 'A BRIEFING' : 'A DESK'}</h2><button class="btn" id="${id}-x">CLOSE</button></div></div>`;
      document.getElementById('game-root').appendChild(ov);
    }
    window.__nav = { esc:0, resume:0 };
  });

  // ---- beta behaviour with no v13 flow: Esc pauses, Esc resumes to the HUD ----
  await esc();
  h.assert(await shown() === 'screen-pause', 'no v13 flow: Esc opens the pause menu');
  await esc();
  h.assert(await shown() === '' && await h.ev(() => document.getElementById('hud').style.display !== 'none'), 'Esc again resumes play, HUD back');

  // ---- a registered overlay with onEsc null: Esc does nothing, twice ----
  await h.ev(() => { showHUD(false); ENGINE.movementEnabled = false; v13Modal('screen-v13a', { onEsc:null, resume:()=>{ window.__nav.resume++; } }); showOverlay('screen-v13a'); });
  await esc(); await esc();
  h.assert(await shown() === 'screen-v13a', 'Esc twice over a registered overlay (onEsc null) does nothing');
  // onEsc given: it runs instead of the pause menu
  await h.ev(() => v13Modal('screen-v13b', { onEsc:()=>{ window.__nav.esc++; showOverlay('screen-v13a'); } }));
  await h.ev(() => showOverlay('screen-v13b'));
  await esc();
  h.assert(await shown() === 'screen-v13a' && await h.ev(() => window.__nav.esc) === 1, 'onEsc runs instead of the pause menu');
  await h.ev(() => v13ModalEnd('screen-v13b'));

  // ---- the pause menu opened over it anyway (the HUD pause button): Resume goes back into the flow ----
  await h.ev(() => togglePause());
  h.assert(await shown() === 'screen-pause', 'a HUD pause opens the pause menu over the briefing');
  await h.shot('v13_a_nav_pause_' + (await A.vp()));
  await h.ev(() => document.getElementById('btn-resume').click());
  await h.step(100);
  const r1 = await h.ev(() => ({ shown:[...document.querySelectorAll('.overlay.show')].map(o => o.id).join(','), res:window.__nav.resume, hud:document.getElementById('hud').style.display }));
  h.assert(r1.shown === 'screen-v13a' && r1.res === 1 && r1.hud === 'none', 'RESUME re-shows the briefing and calls its resume(); the HUD stays hidden');
  // Esc on the pause menu over it does the same
  await h.ev(() => togglePause()); await esc();
  h.assert(await shown() === 'screen-v13a' && await h.ev(() => window.__nav.resume) === 2, 'Esc on that pause menu also resumes into the briefing');
  // a dialogue inside the flow (a gatekeeper call): pause over it comes back to the dialogue
  await h.ev(() => { DIALOGUE.__v13nav = [{ speaker:'CARETAKER', text:'Hello? Who is this?' }, { speaker:'AGENT KELECHI', text:'Good evening, sir.' }]; startDialogue('__v13nav', ()=>{ showOverlay('screen-v13a'); }); });
  await h.step(150);
  await h.ev(() => togglePause()); await h.ev(() => document.getElementById('btn-resume').click()); await h.step(100);
  h.assert(await shown() === 'screen-dialogue', 'pause during a call inside the flow resumes the call, not an empty screen');
  await h.ev(() => { DLG.idx = 99; renderDialogueLine(); }); await h.step(150);
  h.assert(await shown() === 'screen-v13a', 'the call then hands back to the briefing');

  // ---- the operations-table stack: briefing → table → desk → table → close → desk → close → briefing ----
  const st1 = await h.ev(() => { v13OpenOps('lagos', ()=>showOverlay('screen-v13a')); return { s:[...document.querySelectorAll('.overlay.show')].map(o => o.id).join(','), n:V13NAV.stack.length, f:V12._onOpsClose === v13NavPop }; });
  h.assert(st1.s === 'screen-ops' && st1.n === 1 && st1.f, 'briefing → table: one entry on the stack');
  await h.ev(() => showOverlay('screen-v13b'));                       // the table's CASE DESK button opens the desk
  await h.ev(() => v13OpenOps('lagos', ()=>showOverlay('screen-v13b')));    // the desk's OPS TABLE tab
  h.assert(await shown() === 'screen-ops' && await h.ev(() => V13NAV.stack.length) === 2, 'desk → table: two entries');
  await h.ev(() => document.getElementById('ops-close').click()); await h.step(80);
  h.assert(await shown() === 'screen-v13b' && await h.ev(() => V13NAV.stack.length === 1 && V12._onOpsClose === v13NavPop), 'closing the table returns to the desk');
  await h.ev(() => V12.openOps('lagos'));                              // the desk closes back to the table it came from
  await h.shot('v13_a_nav_ops_' + (await A.vp()));
  await esc();
  const st2 = await h.ev(() => ({ s:[...document.querySelectorAll('.overlay.show')].map(o => o.id).join(','), n:V13NAV.stack.length, f:V12._onOpsClose }));
  h.assert(st2.s === 'screen-v13a' && st2.n === 0 && st2.f === null, 'Esc on the stacked table closes it and unwinds to the briefing; the stack is empty');
  // a plain table (not through the stack) behaves as the beta does
  await h.ev(() => { v13ModalEnd('screen-v13a'); showOverlay(null); ENGINE.movementEnabled = true; showHUD(true); V12.openOps('lagos'); });
  await h.ev(() => document.getElementById('ops-close').click()); await h.step(80);
  h.assert(await shown() === '' && await h.ev(() => document.getElementById('hud').style.display) === 'block', 'a plain table closes to the game as before');

  // ---- a new operation clears any flow left open; a load clears it too ----
  await h.ev(() => { v13Modal('screen-v13a', {}); V13NAV.stack.push({ back:null }); V12._onOpsClose = v13NavPop; });
  await h.start('m2', { completed:['m0', 'm1'] });
  h.assert(await h.ev(() => V13NAV.modals.length === 0 && V13NAV.stack.length === 0 && V12._onOpsClose == null), 'beginMission clears a stale v13 flow');
  await h.ev(() => { v13Modal('screen-v13a', {}); togglePause(); });
  h.assert(await h.ev(() => V13NAV.under === null), 'pausing with no registered overlay on screen remembers nothing to restore');

  // ---- Recruit is the same ----
  await A.recruit(true);
  await h.ev(() => { togglePause(); showHUD(false); v13Modal('screen-v13a', { onEsc:null }); showOverlay('screen-v13a'); });
  await esc();
  h.assert(await shown() === 'screen-v13a', 'Recruit: Esc over a registered overlay does nothing too');
  await A.recruit(false);
  await h.ev(() => { v13ModalEnd('screen-v13a'); showOverlay(null); });
  await A.textRules(['CASE DESK', 'OPERATIONS TABLE'], 'nav labels');
  h.assert(h.errors.length === 0, 'no page errors: ' + h.errors.join(' | '));
};
