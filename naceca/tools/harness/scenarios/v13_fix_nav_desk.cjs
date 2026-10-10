// v13 fix · navigation (R01): the Case Desk's OPS TABLE chain never ends in a frozen field.
//   node tools/harness/run.cjs tools/harness/scenarios/v13_fix_nav_desk.cjs --html <build>/naceca.html [--w 1280 --h 800]
// R01 — the desk's OPS TABLE → CAPABILITIES → Esc (pause) → Esc/RESUME goes back to CAPABILITIES, and the
//       chain unwinds through the table and the desk to the field (from the field and from the pause menu);
//       the pause menu's CASE DESK opened down that chain is a second desk that hands back to the first; a
//       quit from there ends the waiting desk.
module.exports = async h => {
  const D = require('./v13_d_lib.cjs').lib(h);
  await D.inject();
  await h.start('m2', { completed:['m0', 'm1'] });
  await D.seed({});
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const st = () => h.ev(() => Object.assign(__VD.state(), { modals:V13NAV.modals.map(m => m.id), stack:V13NAV.stack.length, frames:(DESK.frames || []).length }));
  const key = async k => { await h.page.keyboard.press(k); await h.step(150); };
  const click = async (sel, ms = 150) => { await h.ev(sel => { const e = document.querySelector(sel); if(!e) throw new Error('no ' + sel); e.click(); }, sel); await h.step(ms); };
  const game = () => h.ev(() => { showOverlay(null); showHUD(true); ENGINE.movementEnabled = true; });
  const want = async (label, shown, extra) => {
    const s = await st();
    h.assert(eq(s.shown, shown) && (!extra || extra(s)), label + ' → ' + JSON.stringify(shown) + ' ' + JSON.stringify(s));
    return s;
  };
  const inGame = label => want(label + ': in the field with HUD and movement', [], s => s.hud && s.move === true && !s.desk && !s.susp && s.frames === 0);
  // the chain the desk leaves when its table goes to CAPABILITIES
  const toCaps = async () => {
    await click('#desk-tabs [data-tab="board"]');
    await want('desk OPS TABLE → the table, the desk waiting', ['screen-ops'], s => s.susp);
    await click('#ops-caps');
    await want('… CAPABILITIES', ['screen-skills'], s => s.susp && s.move === false);
  };
  // CAPABILITIES BACK → table → close → the desk it came from (same desk, not suspended)
  const unwind = async label => {
    await click('#btn-skills-back', 250);
    await want(label + ': CAPABILITIES BACK → the table', ['screen-ops'], s => s.susp);
    await click('#ops-close');
    await want(label + ': close → the desk', ['screen-desk'], s => !s.susp && s.move === false && !s.hud);
  };
  await game();

  // ---- R01 · 1. field: J → OPS TABLE → CAPABILITIES → Esc → Esc ----
  await key('KeyJ');
  await want('J opens the desk', ['screen-desk']);
  await toCaps();
  await key('Escape');
  await want('Esc on CAPABILITIES opens the pause menu', ['screen-pause']);
  await key('Escape');
  await want('Esc on that pause menu goes back to CAPABILITIES, not a frozen field', ['screen-skills'], s => s.desk && s.susp);
  h.assert((await st()).modals.includes('screen-desk'), 'the waiting desk stays registered with the model (so the pause menu knows it covers a v13 flow)');
  await unwind('field');
  await click('#btn-desk-close');
  await inGame('field chain, BACK');
  // the same with RESUME
  await key('KeyJ'); await toCaps();
  await key('Escape');
  await click('#btn-resume');
  await want('RESUME also goes back to CAPABILITIES', ['screen-skills']);
  await unwind('resume');
  await key('KeyJ');
  await inGame('field chain, J closes the desk');

  // ---- R01 · 2. pause → CASE DESK → OPS TABLE → CAPABILITIES → Esc → Esc (p9b) ----
  await key('Escape');
  await want('pause', ['screen-pause']);
  await click('#btn-pause-desk');
  await toCaps();
  await key('Escape'); await want('Esc on CAPABILITIES', ['screen-pause']);
  await key('Escape'); await want('Esc again: CAPABILITIES', ['screen-skills']);
  await unwind('pause chain');
  await click('#btn-desk-close');
  await want('… BACK → the pause menu it was opened from', ['screen-pause'], s => !s.hud && !s.desk);
  await click('#btn-resume');
  await inGame('pause chain, RESUME');

  // ---- R01 · 3. a second desk down the chain: CAPABILITIES → Esc → pause → CASE DESK ----
  await key('KeyJ'); await toCaps();
  await key('Escape');
  await click('#btn-pause-desk');
  await want('the pause menu\'s CASE DESK opens a second desk', ['screen-desk'], s => s.desk && !s.susp && s.frames === 1);
  // the second desk's own table unwinds to the second desk first
  await click('#desk-tabs [data-tab="board"]');
  await want('the second desk\'s OPS TABLE', ['screen-ops'], s => s.susp && s.frames === 1 && s.stack === 2);
  await click('#ops-close');
  await want('… close → the second desk', ['screen-desk'], s => !s.susp && s.frames === 1 && s.stack === 1);
  await click('#btn-desk-close');
  await want('its BACK → the pause menu, the first desk waiting again', ['screen-pause'], s => s.desk && s.susp && s.frames === 0 && s.modals.includes('screen-desk'));
  await click('#btn-resume');
  await want('RESUME → CAPABILITIES', ['screen-skills']);
  await unwind('nested');
  await click('#btn-desk-close');
  await inGame('nested, the first desk BACK');
  // Esc closes the second desk the same way
  await key('KeyJ'); await toCaps();
  await key('Escape');
  await click('#btn-pause-desk');
  await key('Escape');
  await want('Esc on the second desk → the pause menu', ['screen-pause'], s => s.desk && s.susp);
  await key('Escape');
  await want('Esc → CAPABILITIES', ['screen-skills']);
  await unwind('nested Esc');
  await key('Escape');
  await inGame('nested, Esc on the first desk');

  // ---- R01 · 4. QUIT from that pause menu ends the waiting desk ----
  await key('KeyJ'); await toCaps();
  await key('Escape');
  await click('#btn-quit', 300);
  let s = await want('QUIT → title', ['screen-title']);
  h.assert(!s.desk && !s.susp && s.frames === 0 && !s.modals.length && s.stack === 0, 'the waiting desk is over after QUIT ' + JSON.stringify(s));
  h.assert(await h.ev(() => !V13NAV.dormant.some(m => m.id === 'screen-desk')), 'and its registration is not kept dormant');
  await h.start('m2', { completed:['m0', 'm1'] });
  await game();
  await key('KeyJ'); await want('a new operation: J opens the desk', ['screen-desk'], s => s.frames === 0);
  await key('KeyJ'); await inGame('… and J closes it');

  // ---- R01 · 5. from a briefing: the first desk returns to the briefing, still paused, its continuation pending ----
  if(await h.ev(() => typeof openBriefing === 'function' && typeof BRIEFINGS !== 'undefined' && !!BRIEFINGS.m3)){
    await h.ev(() => { showOverlay(null); window.__brfDone = 0; I().briefed = {}; openBriefing('m3', () => { window.__brfDone++; }); });
    await h.step(200);
    await want('briefing open', ['screen-briefing']);
    await click('#screen-briefing [data-b="desk"]');
    await want('briefing → CASE DESK', ['screen-desk']);
    await toCaps();
    await key('Escape');
    await want('Esc on CAPABILITIES: the pause menu', ['screen-pause']);
    await click('#btn-pause-desk');
    await want('pause → a second desk', ['screen-desk'], s => s.frames === 1);
    await click('#btn-desk-close');
    await want('… BACK → pause', ['screen-pause'], s => s.susp);
    await click('#btn-resume');
    await want('RESUME → CAPABILITIES', ['screen-skills']);
    await unwind('briefing');
    await click('#btn-desk-close');
    await want('the first desk BACK → the briefing, still paused', ['screen-briefing'], s => s.move === false && !s.hud && !s.desk && s.frames === 0 && s.modals.includes('screen-briefing') && !s.modals.includes('screen-desk'));
    h.assert(await h.ev(() => window.__brfDone) === 0 && await h.ev(() => (document.getElementById('brf-body') || {}).textContent.trim().length > 40), 'the briefing is drawn and its continuation still pending');
    await key('Escape');
    await want('Esc on the briefing does nothing', ['screen-briefing']);
    await h.ev(() => showOverlay(null));
  } else h.log('briefing steps skipped: no openBriefing in this build');

  h.assert(h.errors.length === 0, 'no page errors: ' + h.errors.join(' | '));
};
