// Team guards: Case 12 regression checks (ported from the defects review's d_c12double). Run desktop, and again
// with DOUBLETAP=1 (every Season 2 interactable pressed twice):
//   D1   the glovebox pressed twice inside its delay: m12_log opens once, no stale "Read the USB stick",
//        one Seize spot, gate_register logged once, o12_seize once, the case clock moves once (5 + 35 min)
//   R14  the owner's clock runs at the Action-pace rate (Relaxed 0.75, timed sequences off 0), ownerAdd too
//   R11  Senior: no "Tank 3 next / the boat drivers' shed" nudge after the office; the guard line without "Papers first"
//   CN09 the glovebox is the Kia's      CN05 a chase-alive Tobi (hostage not lost) makes the CAC call
//   CN03 the shredded gate page and its note are dated 26 NOV - 04 DEC / "NOV / DEC" / "27 November"
const { s2start, talk, state } = require('../scen13.js');
const L = require('./c12lib.js'), G = require('./guards_lib.js');
module.exports = async function (T) {
  const C = G.checks(T);
  await G.instrument(T);
  const ok = await s2start(T, 'm12', "S.game.moralChoices.asaba='chase'; S.game._asabaHostageLost=false; S.game.difficulty='senior';");
  T.log('started', ok, 'DOUBLETAP', !!process.env.DOUBLETAP);
  await G.gameClock(T);
  await L.say(T, 'm12_hauwa', ['go in now']);
  await L.useAt(T, 'Order the gate open', -0.8, 24.5); await L.say(T, 'm12_gate_nowarrant');
  await L.free(T); await T.wait(1500);
  await T.until(() => V13.rt.owner, 30000);

  // ---- R14: the owner's clock at the Action-pace rate ----
  const rateRun = async (diff, timed, ms) => {
    await T.ev(([d, t]) => { SETTINGS.difficulty = d; SETTINGS.timed = t; }, [diff, timed]);
    const a = await T.ev(() => ({ o: V13.rt.owner.t, g: window.__gdt }));
    await T.wait(ms);
    const b = await T.ev(() => ({ o: V13.rt.owner.t, g: window.__gdt }));
    return { dOwner: b.o - a.o, dGame: b.g - a.g };
  };
  let r = await rateRun('story', 'normal', 4000);
  C.ok('R14-owner-relaxed', r.dGame > 0.5 && Math.abs(r.dOwner / r.dGame - 0.75) < 0.03, `owner +${r.dOwner.toFixed(2)} s over ${r.dGame.toFixed(2)} s of game time (want x0.75)`);
  r = await rateRun('standard', 'off', 3000);
  C.ok('R14-owner-off', r.dGame > 0.5 && Math.abs(r.dOwner) < 1e-6, `timed sequences off: owner +${r.dOwner.toFixed(3)} s over ${r.dGame.toFixed(2)} s`);
  await T.ev(() => { SETTINGS.difficulty = 'standard'; SETTINGS.timed = 'normal'; });
  const phone = await G.said(T, '^RADIO SGT. UCHE: The guard is on his phone');
  C.ok('R11-guard-line', phone.length >= 1 && phone.every(s => !/Papers first/.test(s)), JSON.stringify(phone));

  await L.use(T, 'Search Sotonye'); await L.waitDlg(T, 'm12_search_noamina'); await talk(T, ['do it myself']);
  await L.use(T, 'Ask Sotonye'); await L.say(T, 'm12_sotonye', ['witness']);
  await L.free(T); await T.wait(800);
  const before = await G.labels(T);
  T.log('before glovebox', before);
  C.ok('CN09-label', /Open the Kia's glovebox/.test(before) && !/Corolla/.test(before), before);

  // ---- D1: two presses inside the 0.9 s ----
  const min0 = await T.ev(() => V13.rt.min);
  T.log('press 1', await G.press(T, 'glovebox'));
  await T.wait(350);
  T.log('press 2', await G.press(T, 'glovebox|USB'));
  await T.until(() => document.querySelector('#screen-puzzle.show .v12-opt'), 60000);
  await T.wait(1600);
  T.log('press 3 (document open)', await G.press(T, 'USB'));
  await L.doc(T, 'm12_log');
  await T.wait(2500);
  const after = await G.labels(T);
  T.log('after solving', after, await L.evq(T));
  C.ok('D1-doc-once', await G.count(T, 'docs', 'm12_log') === 1, 'm12_log opened ' + await G.count(T, 'docs', 'm12_log') + 'x');
  C.ok('D1-no-stale-usb', !/Read the USB stick/.test(after), after);
  const seizeN = await T.ev(() => ENGINE.interactables.filter(i => /Seize the files/.test(i.label)).length);
  C.ok('D1-one-seize', seizeN === 1, seizeN + ' Seize spot(s)');

  // ---- the seizure (Relaxed: ownerAdd(45) at 0.75) ----
  await T.ev(() => { SETTINGS.difficulty = 'story'; });
  const o0 = await T.ev(() => V13.rt.owner.t);
  await L.use(T, 'Seize the files'); await L.say(T, 'm12_inventory', ['Write it up']); await T.wait(1500);
  const o1 = await T.ev(() => V13.rt.owner.t);
  await T.ev(() => { SETTINGS.difficulty = 'standard'; });
  C.ok('R14-owner-add', Math.abs((o1 - o0) - 45 * 0.75) < 1.2, `signing the inventory on Relaxed adds ${(o1 - o0).toFixed(2)} s to the owner's clock (want 33.75)`);
  // a stale second spot, if any, is used too
  for (let k = 0; k < 2; k++) {
    if (!(await T.ev(() => ENGINE.interactables.some(i => /Seize the files|Read the USB/.test(i.label))))) break;
    await L.use(T, 'Seize the files|Read the USB'); await T.wait(1200); await talk(T, ['Write it up']); await T.wait(1200);
  }
  const min1 = await T.ev(() => V13.rt.min);
  C.ok('D1-gate-register-once', await G.count(T, 'ev', 'gate_register') === 1, 'gate_register collected ' + await G.count(T, 'ev', 'gate_register') + 'x');
  C.ok('D1-seize-once', await G.count(T, 'obj', 'o12_seize') === 1 && await G.count(T, 'dlg', 'm12_inventory') === 1, 'o12_seize ' + await G.count(T, 'obj', 'o12_seize') + 'x, m12_inventory ' + await G.count(T, 'dlg', 'm12_inventory') + 'x');
  const sub = await T.ev(() => S.game.currentSubregion);
  C.ok('D1-clock', min1 - min0 === 40 && sub.endsWith(String(Math.floor((17 * 60 + 40 + min1) / 60)).padStart(2, '0') + ':' + String((17 * 60 + 40 + min1) % 60).padStart(2, '0')), `clock +${min1 - min0} min across the USB and the signed inventory (want 40) · ${sub}`);

  // ---- R11: no nudge on Senior after the office ----
  await T.wait(9000);
  const nudge = await G.said(T, "Tank 3 next|boat drivers' shed|Tank 3 now");
  C.ok('R11-no-nudge', nudge.length === 0, nudge.length ? JSON.stringify(nudge) : 'Senior: no next-step line after the seizure');

  // ---- the threads, the CAC call (CN05), the end ----
  await L.threads(T, null, 'levies stop');
  const tobi = await G.count(T, 'dlg', 'm12_tobi_cac'), igb = await G.count(T, 'dlg', 'm12_igbinosa_cac');
  C.ok('CN05-tobi-call', tobi === 1 && igb === 0, `chase, hostage not lost: m12_tobi_cac ${tobi}x, m12_igbinosa_cac ${igb}x`);
  T.log('END', await L.flags(T), '|', await L.evq(T));
  T.log('state', JSON.stringify(await state(T)));

  // ---- CN03: the painted gate page and its note ----
  const painted = await T.ev(() => {
    const out = [], f = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (t) { out.push(String(t)); return f.apply(this, arguments); };
    try {
      showOverlay(null); S.game.currentMission = 'm12';
      miniPlay({ id: 'guards_strips', type: 'm12_strips', kicker: 'CASE 12', title: 'STRIPS', noStrikes: true, xp: 0, sub: '', startLabel: 'GO', winText: 'OK', backNote: '', winNote: '', params: { n: 7 } }, () => {});
    } catch (e) { out.push('ERR ' + e); }
    CanvasRenderingContext2D.prototype.fillText = f;
    return out;
  });
  const dates = painted.filter(t => /\b(SEP|OCT|NOV|DEC)\b/.test(t));
  C.ok('CN03-page', dates.includes('27 NOV') && dates.includes('04 DEC') && dates.includes('26 NOV') && dates.includes('28 NOV') && painted.some(t => /NOV \/ DEC/.test(t)) && !painted.some(t => /\b(SEP|OCT)\b/.test(t)), JSON.stringify([...new Set(dates)]));
  const src = await T.ev(() => [...document.scripts].map(s => s.textContent).join('\n'));
  C.ok('CN03-note', /five tankers out of Tank 3 on 27 November/.test(src) && !/five tankers out of Tank 3 on 25 September/.test(src), 'the shredder note reads 27 November');
  C.done();
};
