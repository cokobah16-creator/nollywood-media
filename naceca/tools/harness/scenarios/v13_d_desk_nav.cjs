// v13 · CASE DESK navigation (team D): every way in, and every way back out, never a blank screen.
//   node tools/harness/run.cjs tools/harness/scenarios/v13_d_desk_nav.cjs --html <build>/naceca.html --w 1280 --h 800
// Covers: HUD EVIDENCE → Locker; J opens and closes (desktop); Esc closes to where you came from (and
// passes through the CAC search box); the desk's OPS TABLE tab and the table's CASE DESK button
// (desk → table → close → desk; table → desk → back → table; ping-pong never stacks); pause → desk;
// case files → desk (button only when there is an investigation); briefing → desk → table → desk →
// briefing; the A2 chain briefing → table → desk → table → close → desk → close → table → close →
// briefing; HUD, movement and music put back on close.
module.exports = async h => {
  const D = require('./v13_d_lib.cjs').lib(h);
  await D.inject();
  await h.start('m2', { completed:['m0', 'm1'] });
  await D.seed({});
  const game = () => h.ev(() => { showOverlay(null); showHUD(true); ENGINE.movementEnabled = true; });
  await game();
  await h.ev(() => {
    window.__mus = [];
    const o = window.musicForScene;
    window.musicForScene = function(k){ window.__mus.push(k); return o.apply(this, arguments); };
    musicForScene('m2');
  });
  const st = () => D.state();
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const click = sel => h.ev(sel => { const e = document.querySelector(sel); if(!e) throw new Error('no ' + sel); e.click(); }, sel);
  const tab = id => click(`#desk-tabs [data-tab="${id}"]`);
  const lastMusic = () => h.ev(() => window.__mus[window.__mus.length - 1]);
  const inGame = async label => {
    const s = await st();
    h.assert(s.shown.length === 0 && s.hud && s.move === true && !s.desk, label + ': back in the game with HUD and movement ' + JSON.stringify(s));
  };
  let s;

  // ---- 1. HUD EVIDENCE → Locker → BACK ----
  await click('#cb-ev');
  s = await st();
  h.log('evidence →', JSON.stringify(s));
  h.assert(eq(s.shown, ['screen-desk']) && s.tab === 'locker' && !s.hud && s.move === false, 'HUD EVIDENCE opens the Locker, HUD hidden, movement off');
  await click('#btn-desk-close');
  await inGame('EVIDENCE → BACK');

  // ---- 2. J toggles; Esc closes without the pause menu; typing in the CAC box is not a shortcut ----
  await h.page.keyboard.press('KeyJ'); await h.step(80);
  s = await st(); h.assert(eq(s.shown, ['screen-desk']), 'J opens the desk');
  h.assert(await h.ev(() => { const k = document.querySelector('#btn-desk-close .k'); return !!k && k.textContent.trim() === 'J' && getComputedStyle(k).display !== 'none'; }), 'the desk shows its J key hint on desktop');
  await h.page.keyboard.press('KeyJ'); await h.step(80);
  await inGame('J again');
  await h.page.keyboard.press('KeyJ'); await h.step(80);
  await h.page.keyboard.press('Escape'); await h.step(80);
  s = await st(); h.assert(!s.shown.includes('screen-pause'), 'Esc on the desk does not open the pause menu');
  await inGame('Esc');
  await h.page.keyboard.press('KeyJ'); await h.step(80);
  await tab('registry'); await h.step(60);
  await h.ev(() => document.getElementById('reg-q').focus());
  await h.page.keyboard.type('jjj'); await h.step(60);
  s = await st();
  h.assert(eq(s.shown, ['screen-desk']) && await h.ev(() => document.getElementById('reg-q').value) === 'jjj', 'typing J in the search box types, it does not close the desk');
  await h.page.keyboard.press('Escape'); await h.step(80);
  await inGame('Esc from the search box');
  h.assert(await h.ev(() => !!document.getElementById('btn-desk') && /CASE DESK/.test(document.getElementById('btn-desk').textContent)), 'desktop HUD carries a J · CASE DESK pill');
  await click('#btn-desk'); s = await st(); h.assert(eq(s.shown, ['screen-desk']), 'the HUD pill opens the desk');
  await click('#btn-desk-close'); await inGame('pill → BACK');

  // ---- 3. desk OPS TABLE tab → table → close → desk (same tab) → BACK; music put back ----
  await h.ev(() => openDesk('money'));
  await tab('board'); await h.step(120);
  s = await st();
  h.assert(eq(s.shown, ['screen-ops']) && s.desk && s.susp, 'OPS TABLE opens the table with the desk waiting under it ' + JSON.stringify(s));
  await click('#ops-close'); await h.step(120);
  s = await st();
  h.assert(eq(s.shown, ['screen-desk']) && s.tab === 'money' && !s.susp && !s.hud && s.move === false, 'closing the table returns to the desk, same tab ' + JSON.stringify(s));
  h.assert(await lastMusic() === 'm2', 'the desk puts the mission music back after the table: ' + await lastMusic());
  await click('#btn-desk-close');
  await inGame('table → desk → BACK');
  h.assert(await lastMusic() === 'm2', 'mission music after the desk closes');

  // ---- 4. table → CASE DESK → BACK → table → close → game ----
  await h.ev(() => V12.openOps('lagos')); await h.step(120);
  await click('#ops-desk'); await h.step(80);
  s = await st(); h.assert(eq(s.shown, ['screen-desk']), 'the table\'s CASE DESK button opens the desk');
  await click('#btn-desk-close'); await h.step(80);
  s = await st(); h.assert(eq(s.shown, ['screen-ops']), 'BACK from a desk opened at the table returns to the table ' + JSON.stringify(s));
  await click('#ops-close'); await h.step(80);
  await inGame('table → desk → table → close');

  // ---- 5. ping-pong between the desk and the table never stacks ----
  await h.ev(() => openDesk('phones'));
  for(let i = 0; i < 3; i++){
    await tab('board'); await h.step(80);
    s = await st(); h.assert(eq(s.shown, ['screen-ops']), 'ping ' + i);
    await click('#ops-desk'); await h.step(80);
    s = await st(); h.assert(eq(s.shown, ['screen-desk']) && !s.susp, 'pong ' + i + ' ' + JSON.stringify(s));
  }
  await click('#btn-desk-close'); await h.step(80);
  await inGame('after ping-pong one BACK is enough');

  // ---- 6. table → desk → OPS TABLE → close → desk → BACK → table → close → game (unwinds in order) ----
  await h.ev(() => V12.openOps()); await h.step(80);
  await click('#ops-desk'); await h.step(60);
  await tab('board'); await h.step(80);
  s = await st(); h.assert(eq(s.shown, ['screen-ops']) && s.susp, 'table → desk → table');
  await click('#ops-close'); await h.step(80);
  s = await st(); h.assert(eq(s.shown, ['screen-desk']), '… close → desk');
  await click('#btn-desk-close'); await h.step(80);
  s = await st(); h.assert(eq(s.shown, ['screen-ops']), '… BACK → the first table ' + JSON.stringify(s));
  await click('#ops-close'); await h.step(80);
  await inGame('… close → game');

  // ---- 7. pause → desk → BACK / Esc / table → pause ----
  await h.ev(() => togglePause()); await h.step(60);
  h.assert(eq((await st()).shown, ['screen-pause']), 'pause menu up');
  h.assert(await h.ev(() => /CASE DESK/.test(document.getElementById('btn-pause-desk').textContent) && !!document.querySelector('#btn-pause-desk svg.ico')), 'pause has a CASE DESK button with a line icon');
  await click('#btn-pause-desk'); await h.step(60);
  s = await st(); h.assert(eq(s.shown, ['screen-desk']), 'pause → desk');
  await click('#btn-desk-close'); await h.step(60);
  s = await st(); h.assert(eq(s.shown, ['screen-pause']) && !s.hud, 'desk BACK returns to the pause menu ' + JSON.stringify(s));
  await click('#btn-pause-desk'); await h.step(60);
  await h.page.keyboard.press('Escape'); await h.step(80);
  s = await st(); h.assert(eq(s.shown, ['screen-pause']), 'Esc on a desk opened from pause returns to pause ' + JSON.stringify(s));
  await click('#btn-pause-desk'); await h.step(60);
  await tab('board'); await h.step(80);
  await click('#ops-close'); await h.step(80);
  s = await st(); h.assert(eq(s.shown, ['screen-desk']), 'pause → desk → table → close → desk (F005: no silent unpause) ' + JSON.stringify(s));
  await click('#btn-desk-close'); await h.step(60);
  s = await st(); h.assert(eq(s.shown, ['screen-pause']) && !s.hud, '… BACK → pause ' + JSON.stringify(s));
  await click('#btn-resume'); await h.step(60);
  await inGame('resume');

  // ---- 8. case files (title) → desk → table → close → desk → BACK → case files ----
  await h.ev(() => { S.game.currentMission = null; showHUD(false); renderMissionSelect(); showOverlay('screen-missions'); });
  h.assert(await h.ev(() => getComputedStyle(document.getElementById('btn-missions-desk')).display !== 'none'), 'case files offers the desk when there is an investigation');
  await click('#btn-missions-desk'); await h.step(60);
  s = await st(); h.assert(eq(s.shown, ['screen-desk']), 'case files → desk');
  await tab('board'); await h.step(80);
  s = await st(); h.assert(eq(s.shown, ['screen-ops']), '… → table');
  await click('#ops-close'); await h.step(80);
  s = await st(); h.assert(eq(s.shown, ['screen-desk']), '… close → desk, not a blank screen (F005) ' + JSON.stringify(s));
  await click('#btn-desk-close'); await h.step(60);
  s = await st(); h.assert(eq(s.shown, ['screen-missions']) && !s.hud, '… BACK → case files ' + JSON.stringify(s));
  await h.ev(() => { const keep = S; S = defaultState(); renderMissionSelect(); window.__keepS = keep; });
  h.assert(await h.ev(() => getComputedStyle(document.getElementById('btn-missions-desk')).display === 'none'), 'no CASE DESK on case files without an investigation (F102)');
  await h.ev(() => { S = window.__keepS; S.game.currentMission = 'm2'; renderMissionSelect(); });

  // ---- 9. briefing → desk → table → close → desk → BACK → briefing; Esc → briefing ----
  if(await h.ev(() => typeof openBriefing === 'function' && typeof BRIEFINGS !== 'undefined' && !!BRIEFINGS.m3)){
    await h.ev(() => { showOverlay(null); window.__brfDone = 0; I().briefed = {}; openBriefing('m3', () => { window.__brfDone++; }); });
    await h.step(150);
    h.assert(eq((await st()).shown, ['screen-briefing']), 'briefing open');
    const viaButton = await h.ev(() => { const b = [...document.querySelectorAll('#screen-briefing button')].find(x => /CASE DESK/.test(x.textContent)); if(b){ b.click(); return true; } openDesk(); return false; });
    await h.step(80);
    s = await st(); h.assert(eq(s.shown, ['screen-desk']), 'briefing → desk (' + (viaButton ? 'its CASE DESK button' : 'openDesk') + ')');
    await tab('board'); await h.step(80);
    s = await st(); h.assert(eq(s.shown, ['screen-ops']), '… → table');
    await click('#ops-close'); await h.step(80);
    s = await st(); h.assert(eq(s.shown, ['screen-desk']) && s.move === false, '… close → desk (F051/F067/F093) ' + JSON.stringify(s));
    await click('#btn-desk-close'); await h.step(80);
    s = await st();
    h.assert(eq(s.shown, ['screen-briefing']) && s.move === false && !s.hud, '… BACK → the briefing, still paused ' + JSON.stringify(s));
    h.assert(await h.ev(() => (document.querySelector('#screen-briefing .settings-body, #screen-briefing') || {}).textContent.trim().length > 40), 'the briefing is drawn, not blank');
    await h.ev(() => openDesk()); await h.step(60);
    await h.page.keyboard.press('Escape'); await h.step(80);
    s = await st(); h.assert(eq(s.shown, ['screen-briefing']), 'Esc on a desk opened from the briefing returns to the briefing ' + JSON.stringify(s));

    // ---- 10. the A2 chain, with the briefing's "back to the operations table" ----
    const back = await h.ev(() => {
      const back = () => { showOverlay('screen-briefing'); if(typeof renderBriefing === 'function') renderBriefing(); };
      if(typeof v13OpenOps === 'function'){ v13OpenOps('route', back); return 'v13OpenOps'; }
      V12._onOpsClose = back; V12.openOps('route'); return 'emulated';
    });
    await h.step(100);
    const chain = [];
    const step = async (label, f, want) => { await f(); await h.step(100); const x = await st(); chain.push(label + ':' + x.shown.join(',')); h.assert(eq(x.shown, [want]), 'A2 chain (' + back + ') ' + label + ' → ' + want + ' ' + JSON.stringify(x)); };
    h.assert(eq((await st()).shown, ['screen-ops']), 'briefing → table');
    await step('CASE DESK', () => click('#ops-desk'), 'screen-desk');
    await step('OPS TABLE', () => tab('board'), 'screen-ops');
    await step('close', () => click('#ops-close'), 'screen-desk');
    await step('BACK', () => click('#btn-desk-close'), 'screen-ops');
    await step('close', () => click('#ops-close'), 'screen-briefing');
    h.log('A2 chain:', chain.join(' | '));
    h.assert(await h.ev(() => window.__brfDone) === 0, 'the briefing\'s continuation is still pending (not dropped)');
    await h.ev(() => showOverlay(null));
  } else h.log('briefing steps skipped: no openBriefing in this build');

  h.assert(h.errors.length === 0, 'no page errors: ' + h.errors.join(' | '));
};
