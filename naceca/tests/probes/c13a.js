// Case 13 — run 1: wire on, HERBS registered, docket read safely, refuse.  run 2: no wire, caught at Kuti's desk, accept.
const { s2start, use, talk, solve, waitCards, state } = require('../scen13.js');
const path = require('path');
/* screenshots with a long timeout (the machine is shared): never abort the run over one */
/* the machine is shared and frames are slow: run small, go full size for the screenshots */
const FULL = T => T.mode === 'phone' ? { width: 844, height: 390 } : { width: 1280, height: 720 };
const SMALL = T => T.mode === 'phone' ? { width: 844, height: 390 } : { width: 640, height: 360 };
async function shot(T, name) {
  try {
    if (T.mode !== 'phone') { await T.page.setViewportSize(FULL(T)); await T.wait(2600); }
    await T.page.screenshot({ path: path.join((process.env.SHOTS || path.join(__dirname, '..', 'shots')), `probe_c13a_${T.mode}_${name}.png`), timeout: 150000 }); console.log('  shot', name);
  } catch (e) { console.log('  shot FAILED', name, String(e.message).slice(0, 80)); }
  if (T.mode !== 'phone') await T.page.setViewportSize(SMALL(T));
}

const st13 = T => T.ev(() => ({
  mc: JSON.stringify(Object.fromEntries(Object.entries(S.game.moralChoices || {}).filter(([k]) => /^s2_/.test(k)))),
  opEv: (S.game._opEv || []).map(id => id + ':' + (S.game.evQ || {})[id]).join(' '),
  rep: JSON.stringify(S.player.reputation),
  herbs: JSON.stringify(V13.src('HERBS')), leak: V13.s2().registerLeak,
  objs: (S.game.objectives || []).map(o => (o.done ? '✓' : '·') + o.id).join(' '),
  trace: S.game._finTrace,
}));
/* click through dialogue; picks in order; onLine(text) may return a promise (screenshots) */
async function steps(T, picks, onLine) {
  picks = (picks || []).slice();
  for (let k = 0; k < 140; k++) {
    const s = await T.ev(() => {
      const ov = document.getElementById('screen-dialogue'); if (!ov.classList.contains('show')) return { closed: true };
      skipTypewriter(); const ch = [...document.querySelectorAll('#dlg-choices .dialogue-choice')];
      return { sp: document.getElementById('dlg-speaker').textContent, tx: document.getElementById('dlg-text').textContent, ch: ch.map(c => c.textContent.slice(0, 70)),
        meter: (document.querySelector('#meter-trace .pm-label') || {}).textContent || null, val: (document.querySelector('#meter-trace .pm-val') || {}).textContent || null };
    });
    if (s.closed) return true;
    if (onLine) await onLine(s);
    if (s.ch.length) {
      const c = picks.length ? picks.shift() : 0;
      T.log('   choose', c, 'from', s.ch.join(' || ').slice(0, 260), '| meter', s.meter, s.val);
      await T.ev(c => { const ch = [...document.querySelectorAll('#dlg-choices .dialogue-choice')]; let b = typeof c === 'number' ? ch[c] : ch.find(x => new RegExp(c, 'i').test(x.textContent)); if (!b) b = ch[0]; b.click(); if (b.dataset.armed) b.click(); }, c);
    } else await T.ev(() => advanceDialogue());
    await T.wait(220);
  }
  return false;
}

/* frames per second right now (the machine is shared; slow frames mean slow game time) */
/* the machine is shared: low graphics keep the frames coming (no post-processing, no shadow maps) */
const lowGfx = T => T.ev(() => { if (typeof applyGraphics === 'function') applyGraphics('low'); });
const fps = T => T.ev(() => new Promise(res => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else res(n / 2); }; requestAnimationFrame(f); }));
/* jump every walking person to the last leg of their walk (only when frames are slow) */
async function hurry(T, slow) { if (!slow) return; await T.ev(() => { for (const m of (V13.rt.movers || [])) { const e = m.pts[m.pts.length - 1]; m.ch.position.x = e.x; m.ch.position.z = e.z; m.i = m.pts.length - 1; } }); }
/* the phone run: wire on, caught with the docket still open (half-read), two spooks early (the floor clamp), accept */
async function phoneRun(T) {
  const prep = "S.game.moralChoices.s2_wire = true; S.game.moralChoices.s2_original = 'handed';";
  T.log('phone run started', await s2start(T, 'm13', prep));
  await lowGfx(T);
  const slow = (await fps(T)) < 12;
  await T.until(() => !V13.rt.intro && ENGINE.movementEnabled, 20000);
  await T.wait(800); await shot(T, 'm13_reception');
  await use(T, 'Report to Mr. Kuti'); await T.wait(800); await shot(T, 'm13_kuti_talk'); await talk(T, [2]);
  await use(T, 'Sit on the sofa');
  await T.until(() => V13.rt.kutiAt === 'toRecords', 150000); await T.wait(1500); await hurry(T, slow);
  T.log('window?', await T.until(() => !!V13.rt.win, 150000));
  await T.wait(1200); await shot(T, 'm13_window');
  await use(T, 'Read the docket');
  T.log('doc open?', await T.until(() => document.querySelector('#screen-puzzle.show .v12-opt'), 150000));
  await T.wait(800); await shot(T, 'm13_docket');
  // keep reading until he walks in
  if (slow) await T.ev(() => { if (V13.rt.win) V13.rt.win.t = Math.min(V13.rt.win.t, 6.5); });
  await T.until(() => !V13.rt.win, 200000); await T.wait(800); await hurry(T, slow);
  await T.until(() => document.getElementById('screen-dialogue').classList.contains('show'), 150000);
  T.log('caught?', await T.ev(() => !!V13.rt.caught), JSON.stringify(await st13(T)));
  await T.wait(1000); await shot(T, 'm13_caught');
  await talk(T);
  await T.until(() => ENGINE.interactables.some(i => /Take the seat/.test(i.label)), 60000);
  await use(T, 'Take the seat');
  await T.until(() => document.getElementById('screen-dialogue').classList.contains('show'), 90000);
  let n = 0;
  await steps(T, [2, 2, 0, 0, 0, 'I accept'], async s => {
    if (s.meter && /DIRECTOR/.test(s.sp) && n++ === 6) { await T.wait(800); await shot(T, 'm13_meeting_rec'); }
  });
  T.log('after meeting', JSON.stringify(await st13(T)));
  await T.until(() => ENGINE.interactables.some(i => /letter/.test(i.label)), 60000);
  await use(T, 'Collect your letter');
  await T.until(() => document.getElementById('screen-dialogue').classList.contains('show'), 150000);
  await talk(T);
  await T.until(() => ENGINE.interactables.some(i => /lift/.test(i.label)), 60000);
  await use(T, 'Take the lift down');
  await T.until(() => document.getElementById('screen-dialogue').classList.contains('show'), 60000);
  await T.wait(1200); await shot(T, 'm13_carpark');
  await talk(T);
  T.log('aftermath?', await T.until(() => document.getElementById('screen-aftermath').classList.contains('show'), 30000));
  await T.wait(800); await shot(T, 'm13_aftermath');
  T.log('end phone run', JSON.stringify(await st13(T)));
}

module.exports = async function (T) {
  if (T.mode === 'phone') { await phoneRun(T); return; }
  /* ================= run 1 ================= */
  const prep1 = "S.game.moralChoices.s2_wire = true; S.game.moralChoices.s2_original = 'handed'; V13.recruit('HERBS', 60); V13.src('HERBS').reg = true;";
  T.log('run1 started', await s2start(T, 'm13', prep1));
  await lowGfx(T); if (T.mode !== 'phone') await T.page.setViewportSize(SMALL(T));
  const F = await fps(T); const slow = F < 12; T.log('fps', F, 'slow', slow);
  await T.until(() => !V13.rt.intro && ENGINE.movementEnabled, 15000);
  await T.wait(600);
  await shot(T, 'm13_reception');
  T.log('state0', JSON.stringify(await st13(T)));
  await use(T, 'Report to Mr. Kuti');
  await T.wait(700); await shot(T, 'm13_kuti_talk');
  await talk(T, [0]);
  await T.wait(3500);
  await use(T, 'Sit on the sofa');
  await T.wait(1200); await shot(T, 'm13_sofa');
  await T.until(() => V13.rt.kutiAt === 'toRecords', 150000); await T.wait(1500); await hurry(T, slow);
  T.log('window?', await T.until(() => !!V13.rt.win, 120000));
  await T.wait(1500); await shot(T, 'm13_window');
  await use(T, 'Read the docket');
  T.log('doc open?', await T.until(() => document.querySelector('#screen-puzzle.show .v12-opt'), 150000));
  await T.wait(600); await shot(T, 'm13_docket');
  await solve(T, await T.ev(() => V13.C.docket()));
  T.log('after docket', JSON.stringify(await st13(T)), 'win', await T.ev(() => V13.rt.win && V13.rt.win.t.toFixed(1)));
  await use(T, 'Sit on the sofa');
  if (slow) await T.ev(() => { if (V13.rt.win) V13.rt.win.t = Math.min(V13.rt.win.t, 6.5); });
  await T.until(() => !V13.rt.win, 200000); await T.wait(800); await hurry(T, slow);
  await T.until(() => document.getElementById('screen-dialogue').classList.contains('show'), 120000);
  T.log('kuti back; caught?', await T.ev(() => !!V13.rt.caught));
  await shot(T, 'm13_kuti_back');
  await talk(T);
  await waitCards(T);
  await T.until(() => document.getElementById('screen-dialogue').classList.contains('show'), 8000);
  await talk(T);                                                   // the doors
  await T.wait(1600); await shot(T, 'm13_doors');
  await use(T, 'Look at the safe');
  await T.until(() => document.getElementById('screen-dialogue').classList.contains('show'), 120000); await talk(T);
  await use(T, 'Take the seat');
  await T.until(() => document.getElementById('screen-dialogue').classList.contains('show'), 60000);
  let shotN = 0;
  await steps(T, [0, 0, 0, 0, 0, 'stays with Zonal'], async s => {
    if (s.meter && shotN === 0 && /DIRECTOR/.test(s.sp)) { shotN++; await T.wait(900); await shot(T, 'm13_meeting_rec'); }
    if (shotN === 1 && /HERBS/.test(s.tx)) { shotN++; await T.wait(900); await shot(T, 'm13_meeting_register'); }
    if (/moves one piece/.test(s.tx)) { await T.wait(1200); await shot(T, 'm13_meeting_board'); }
    if (/ID card/.test(s.tx)) { await T.wait(600); await shot(T, 'm13_meeting_refuse'); }
  });
  T.log('after meeting', JSON.stringify(await st13(T)));
  await T.wait(1500);
  await use(T, 'Leave your ID card');
  await T.wait(1600); await shot(T, 'm13_card');
  await T.until(() => document.getElementById('screen-dialogue').classList.contains('show'), 150000);
  await talk(T);
  await T.until(() => ENGINE.interactables.some(i => /lift/.test(i.label)), 60000);
  await use(T, 'Take the lift down');
  await T.until(() => document.getElementById('screen-dialogue').classList.contains('show'), 60000);
  await T.wait(1500); await shot(T, 'm13_carpark');
  await talk(T);
  T.log('aftermath?', await T.until(() => document.getElementById('screen-aftermath').classList.contains('show'), 15000));
  await T.wait(800); await shot(T, 'm13_aftermath_refuse');
  T.log('end run1', JSON.stringify(await st13(T)));

  if (process.env.C13_ONE) return;                                  // run 1 only, when asked
  /* ================= run 2 ================= */
  const prep2 = "S.game.moralChoices.s2_wire = false; S.game.moralChoices.s2_original = 'kept';";
  T.log('run2 started', await s2start(T, 'm13', prep2));
  await T.until(() => !V13.rt.intro && ENGINE.movementEnabled, 15000);
  const rep0 = await T.ev(() => S.player.reputation.agencyFavour);
  await use(T, 'Report to Mr. Kuti'); await talk(T, [1]);
  await T.wait(3500);
  await use(T, 'Sit on the sofa');
  await T.until(() => V13.rt.kutiAt === 'toRecords', 150000); await T.wait(1500); await hurry(T, slow);
  T.log('window?', await T.until(() => !!V13.rt.win, 120000));
  await use(T, 'Read the docket');
  T.log('doc open?', await T.until(() => document.querySelector('#screen-puzzle.show .v12-opt'), 150000));
  await T.wait(500); await shot(T, 'm13_docket_kept');
  await solve(T, await T.ev(() => V13.C.docket()));
  // stay at the desk
  if (slow) await T.ev(() => { if (V13.rt.win) V13.rt.win.t = Math.min(V13.rt.win.t, 6.5); });
  await T.until(() => !V13.rt.win, 200000); await T.wait(800); await hurry(T, slow);
  await T.until(() => document.getElementById('screen-dialogue').classList.contains('show'), 120000);
  T.log('caught?', await T.ev(() => !!V13.rt.caught));
  await T.wait(1200); await shot(T, 'm13_caught');
  await talk(T);
  T.log('agencyFavour', rep0, '→', await T.ev(() => S.player.reputation.agencyFavour));
  await T.wait(1500);
  await use(T, 'Take the seat');
  await T.until(() => document.getElementById('screen-dialogue').classList.contains('show'), 60000);
  await steps(T, [1, 1, 'I accept'], async s => {
    if (/comes around the desk/.test(s.tx)) { await T.wait(3200); await shot(T, 'm13_handshake'); }
  });
  T.log('after meeting', JSON.stringify(await st13(T)));
  await T.wait(1200);
  await use(T, 'Collect your letter');
  await T.until(() => document.getElementById('screen-dialogue').classList.contains('show'), 150000);
  await talk(T);
  await T.until(() => ENGINE.interactables.some(i => /lift/.test(i.label)), 60000);
  await use(T, 'Take the lift down');
  await T.until(() => document.getElementById('screen-dialogue').classList.contains('show'), 60000);
  await talk(T);
  T.log('aftermath?', await T.until(() => document.getElementById('screen-aftermath').classList.contains('show'), 15000));
  await T.wait(600); await shot(T, 'm13_aftermath_accept');
  T.log('end run2', JSON.stringify(await st13(T)));
};
