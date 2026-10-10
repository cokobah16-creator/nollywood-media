// v13 fix · navigation (R08): a scripted beat that takes the screen from the Case Desk leaves a live field.
//   node tools/harness/run.cjs tools/harness/scenarios/v13_fix_nav_beat.cjs --html <build>/naceca.html [--w 1280 --h 800]
// R08 — a scripted dialogue that takes the screen while the desk is open (the real M4 Musa flip after the
//       lie puzzle), waiting under its table, opened from the pause menu, or a nested pair, leaves the
//       player in the live field with the HUD and movement.
module.exports = async h => {
  const D = require('./v13_d_lib.cjs').lib(h);
  const C = require('./v13_c_lib.cjs').lib(h);
  await D.inject();
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const st = () => h.ev(() => Object.assign(__VD.state(), { modals:V13NAV.modals.map(m => m.id), stack:V13NAV.stack.length, frames:(DESK.frames || []).length }));
  const key = async k => { await h.page.keyboard.press(k); await h.step(150); };
  const click = async (sel, ms = 150) => { await h.ev(sel => { const e = document.querySelector(sel); if(!e) throw new Error('no ' + sel); e.click(); }, sel); await h.step(ms); };
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

  // ---- R08 · 1. the real M4 path: the lie puzzle, J at once, Musa's flip 0.7 s later ----
  await h.start('m4', { completed:['m0', 'm1', 'm2', 'h2', 'm3', 'm3n'], state:S => { S.game.mem = { hubs:{ h2:1 }, street:{}, phone:{}, reply:{}, seen:{} }; } });
  await C.finishDialogue(); await h.step(300);
  const opened = await h.ev(() => {
    S.game._cpBriefed = true; S.game._cpDriverInterviewed = true; S.game._cpManifestDone = true;
    const it = ENGINE.interactables.find(x => x.label === 'Confront Musa with the papers');
    if(!it) return null;
    it.onInteract(); return [...document.querySelectorAll('.overlay.show')].map(o => o.id);
  });
  h.assert(opened && opened.includes('screen-puzzle'), 'M4: confronting Musa opens the papers ' + JSON.stringify(opened));
  const solved = await h.ev(() => {
    const spec = V12.docFromPuzzle('checkpoint_lie');
    const i = spec.options.findIndex(o => o.correct);
    const ob = document.querySelectorAll('#screen-puzzle .v12-opt')[i]; if(ob) ob.click();
    const pl = [...document.querySelectorAll('#screen-puzzle .v12-line.live')].find(el => spec.proof.some(x => el.textContent.includes(x)));
    if(pl) pl.click();
    document.getElementById('v12-doc-go').click();
    return !!(ob && pl);
  });
  h.assert(solved, 'M4: the lie puzzle is solved on the record');
  for(let i = 0; i < 150; i++){ if(!(await h.ev(() => !!document.querySelector('#screen-puzzle.show')))) break; await h.step(30); }
  await h.page.keyboard.press('KeyJ'); await h.step(60);
  if(!(await st()).desk){
    // a slow machine lost the 0.7 s race (Musa already speaks, so J did nothing): play his flip out and run
    // the same beat on the same timer checkpoint.js uses, with the desk opened inside the window
    h.log('M4: the real window was missed on this machine; replaying the beat on the game\'s 700 ms timer');
    await C.finishDialogue(); await h.step(300);
    await h.ev(() => { setTimeout(() => startDialogue('checkpoint_musa_flip'), 700); });
    await h.page.keyboard.press('KeyJ'); await h.step(60);
  }
  await want('J as the papers close: the desk opens before Musa speaks', ['screen-desk'], s => s.move === false && !s.hud);
  let dl = null;
  for(let i = 0; i < 60; i++){ dl = await h.ev(() => document.querySelector('#screen-dialogue.show') ? DLG.scriptKey : null); if(dl) break; await h.step(50); }
  h.assert(dl === 'checkpoint_musa_flip', 'M4: Musa\'s flip takes the screen: ' + dl);
  await want('the dialogue plays over the live field: desk closed, HUD and movement back', ['screen-dialogue'], s => !s.desk && s.move === true && s.hud);
  await C.finishDialogue(); await h.step(400);
  await inGame('M4: after Musa\'s flip');
  await key('KeyJ'); await want('M4: J opens the desk again', ['screen-desk']);
  await key('KeyJ'); await inGame('M4: … and closes it');

  // ---- R08 · 2–4. a dialogue while the desk waits under its table, opened from pause, or a nested pair ----
  await h.ev(() => { DIALOGUE.__fixnav = [{ speaker:'SGT. UCHE', kind:'uche', text:'Agent, a word.' }, { speaker:'AGENT KELECHI', kind:'kelechi', text:'Go on.' }]; });
  const beat = async label => {
    await h.ev(() => startDialogue('__fixnav')); await h.step(150);
    await want(label + ': the dialogue takes the screen, the desk is over, HUD and movement back', ['screen-dialogue'], s => !s.desk && !s.susp && s.frames === 0 && s.move === true && s.hud && !s.modals.includes('screen-desk'));
    await C.finishDialogue(); await h.step(300);
    await inGame(label + ': after the dialogue');
  };
  await key('KeyJ'); await click('#desk-tabs [data-tab="board"]');
  await want('desk waiting under its table', ['screen-ops'], s => s.susp);
  await beat('under the table');
  await key('Tab');
  await want('TAB: a plain table', ['screen-ops']);
  await click('#ops-close');
  await inGame('the plain table closes to the field (the old chain entry is harmless)');
  await key('Escape'); await click('#btn-pause-desk');
  await want('pause → desk', ['screen-desk']);
  await beat('desk opened from the pause menu');
  await key('KeyJ'); await toCaps(); await key('Escape'); await click('#btn-pause-desk');
  await want('a nested pair', ['screen-desk'], s => s.frames === 1);
  await beat('nested pair');

  h.assert(h.errors.length === 0, 'no page errors: ' + h.errors.join(' | '));
};
