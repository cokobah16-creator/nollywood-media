// tac_m2_confront · the scan and the confront router (DESIGN §5.3, M-M2, M-M9, M-M10; market.md §1.5-1.6, §5.1):
// (a) cold grab, (b) seen = today's opening, (c) soft, (d) scan seen → HE SAW YOU and the bolt, (e) range bolt, (f) fumble and
// the forensic bypass, (g) TALK during the cold grab or Uche's takedown beat starts nothing; the pre-scan grid picks the phone;
// the same side spot is seen in the look-up and not in the phone phase.
const M = require('./tac_m2_lib.cjs');
const T = M.T;

// a market where Tunde has pointed KC out (met unseen, on the stall side), then 2 s away from him
const prep = async (h, seed) => {
  await M.boot(h, { seed:seed || 21 });
  await M.tunde(h, { at:[-8, -2], choice:0 });
  await h.ev(() => { const P = ENGINE.player.position; P.x = -12; P.z = -12; TAC.player._reset(); __wf.run(2); });
};
const chaseCfg = h => h.ev(() => { const c = CHASE.active; return c ? { burst:c.burst, head:+(+c.headStart).toFixed(2), speed:c.speed, stagger:+(+ENGINE._stagger).toFixed(2), row:c.tac && c.tac.row } : null; });
const toastNow = h => h.ev(() => { const t = document.getElementById('toast'); return t ? { big:(t.querySelector('.big') || {}).textContent, small:(t.querySelector('.small') || {}).textContent, show:t.classList.contains('show') } : null; });

module.exports = async h => {
  // ---- the pre-scan grid: every out-of-cone cell within 2.0 m of the phone picks the phone ----
  await prep(h, 21);
  const grid = await h.ev(() => {
    const P = ENGINE.player.position, ph = ENGINE.interactables.find(i => i.label === 'Scan suspect phone').mesh.position;
    let n = 0; const bad = [];
    for (let x = 5.25; x <= 9.75; x += 0.25) for (let z = 1.75; z <= 6.25; z += 0.25) {
      const d = Math.hypot(x - ph.x, z - ph.z); if (d >= 2.0) continue;
      if (blockedAt(x, z)) continue;
      const dx = x - 8, dz = z - 4, dk = Math.hypot(dx, dz); if (dk < 1e-3) continue;
      if (Math.acos(Math.max(-1, Math.min(1, -dx / dk))) * 180 / Math.PI <= 50) continue;    // inside his 100° cone
      P.x = x; P.z = z; n++;
      const it = nearestInteractable(); if (!it || it.label !== 'Scan suspect phone') bad.push([x, z, it && it.label]);
    }
    return { n, bad:bad.slice(0, 6), nbad:bad.length };
  });
  h.log('grid', JSON.stringify(grid));
  h.assert(grid.n > 20 && grid.nbad === 0, 'before the scan, every out-of-cone cell within 2.0 m of the phone picks the phone (' + grid.n + ' cells)');

  // ---- (a) cold: sneak round the south and up beside him, lift the phone head-down, step 1.2 s, take him ----
  await T.capture(h);
  const walk1 = await T.walk(h, [[2, -6]], { speed:1.25, crouch:true });
  const walk2 = await T.walk(h, [[7.4, -2.6], [7.5, 2.1]], { speed:1.25, crouch:true });
  const st0 = await M.state(h);
  h.log('(a) walked', JSON.stringify({ walk1, walk2, st0 }));
  h.assert(walk2.reached && st0.level === 'calm' && st0.susp < 5, '(a) the south approach, crouched, stays out of his cone: ' + st0.susp);
  const sc = await M.scan(h, { at:[7.5, 2.1], phase:'phone' });
  h.log('(a) scan', JSON.stringify(sc));
  h.assert(sc.label === 'Scan suspect phone' && sc.mini && sc.after.scanned && !sc.after.pending, '(a) the phone, from beside him, through the field skill and the document');
  await h.ev(() => { for (const k of Object.keys(_ach)) delete _ach[k]; try { localStorage.removeItem(ACH_KEY); } catch (e) {} });
  const a = await h.ev(() => {
    __wf.run(1.2);
    const st = TAC.m2.kc().state, trust0 = S.player.reputation.publicTrust, it = nearestInteractable();
    const lbl = it && it.label; tryInteract();
    const K = ENGINE._marketKC.userData;
    return { lbl, susp:st.susp, level:st.level, chase:!!CHASE.active, dlg:!!document.querySelector('#screen-dialogue.show') && DLG.scriptKey, how:S.game.flags.m2_how,
      dTrust:S.player.reputation.publicTrust - trust0, arms:[K.armL.rotation.x, K.armR.rotation.x], stagger:ENGINE._stagger, ach:{ faster:!!_ach.faster, not_one:!!_ach.not_one }, bumps:S.game._opBumps || 0,
      toast:(document.querySelector('#toast .big') || {}).textContent, small:(document.querySelector('#toast .small') || {}).textContent };
  });
  h.log('(a) cold', JSON.stringify(a));
  h.assert(a.lbl === 'Confront teen suspect' && !a.chase && a.dlg === 'market_runner' && a.how === 'cold', '(a) CAUGHT COLD: no chase, market_runner at once, m2_how cold');
  h.assert(a.dTrust === 2 && a.arms[0] <= -1.6 && a.arms[1] <= -1.6, '(a) +2 Public Trust, hands up');
  h.assert(a.stagger === 0, '(a) _stagger is 0 after a cold grab');
  h.assert(a.toast === 'CAUGHT COLD' && a.small === 'He never saw you coming. Quiet arrest · +2 Public Trust', '(a) the CAUGHT COLD toast');
  h.assert(a.bumps === 0 && a.ach.faster && a.ach.not_one, '(a) a cold grab with nobody knocked over unlocks what a tackle does: faster and not_one (B-MAJ-2) ' + JSON.stringify(a.ach));
  await h.step(500);
  let ev = await T.events(h);
  const encA = ev.filter(e => e[0] === 'enc' && e[1].enc === 'm2_kc');
  h.log('(a) events', JSON.stringify(ev.map(e => e[0]).filter(t => !/^(radio|evidence|doc_|mg|obj_done|interact|xp)/.test(t))));
  h.assert(!ev.some(e => e[0] === 'chase' || e[0] === 'chase_end'), '(a) no chase and no chase_end logged');
  h.assert(encA.length === 1 && encA[0][1].approach === 'cold' && encA[0][1].how === 'cold' && encA[0][1].outcome === 'caught' && encA[0][1].intent === 'stealth', '(a) enc m2_kc approach cold ' + JSON.stringify(encA[0] && encA[0][1]));
  // ---- (g) TALK on KC during the cold grab's dialogue starts nothing ----
  const g1 = await h.ev(() => { const it = ENGINE.interactables.find(i => i.label === 'Confront teen suspect'); it.onInteract(it); return { chase:!!CHASE.active, key:DLG.scriptKey, spent:TAC.interact.isSpent(it) }; });
  h.assert(!g1.chase && g1.key === 'market_runner' && g1.spent, '(g) TALK during the cold grab\'s dialogue starts nothing (and the label is spent)');

  // ---- (b) seen: no watch history (today's harness confront) → today's opening, word for word ----
  await M.boot(h, { seed:21 });
  await T.lib.marketChase(h);
  const b = await chaseCfg(h);
  h.log('(b) no history', JSON.stringify(b));
  h.assert(b && b.burst[0] === 1.2 && b.burst[1] === 1.5 && b.head === 0.4 && b.stagger === 0.5 && Math.abs(b.speed - 4.3) < 1e-9 && b.row === 'legacy', '(b) no watch history: stagger 0.5, burst [1.2, 1.5], head start 0.4, 4.3 m/s');
  // seen, with history: at the counter front, in his look
  await prep(h, 22);
  await M.scan(h, { at:[9.2, 3.6], phase:'phone' });
  const b2 = await h.ev(() => {
    TAC.m2.setPhase('lookup', 30);
    const P = ENGINE.player.position; P.x = 5.8; P.z = 4.6; TAC.player._reset();
    __wf.run(4, () => { if (TAC.m2.kc().state.level !== 'calm') return true; });
    const st = TAC.m2.kc().state, lvl = st.level;
    tryInteract();
    const c = CHASE.active;
    return { lvl, seen:st.seen, row:c && c.tac.row, burst:c && c.burst, head:c && c.headStart, stagger:ENGINE._stagger, small:(document.querySelector('#toast .small') || {}).textContent };
  });
  h.log('(b) seen', JSON.stringify(b2));
  h.assert(b2.row === 'seen' && b2.burst && b2.burst[0] === 1.2 && b2.head === 0.4 && b2.stagger === 0.5 && /shoves a tray/.test(b2.small), '(b) seen at arm\'s length: today\'s opening and toast');

  // ---- (c) soft: from behind, after he half-noticed (reset 40) ----
  await prep(h, 23);
  await M.scan(h, { at:[9.2, 3.6], phase:'phone' });
  await T.capture(h);
  const c = await h.ev(() => {
    __wf.run(0.5);
    TAC.m2.kc().reset(40);
    const it = nearestInteractable(); tryInteract();
    const ch = CHASE.active;
    return { lbl:it && it.label, row:ch && ch.tac.row, stagger:ENGINE._stagger, burst:ch && ch.burst, small:(document.querySelector('#toast .small') || {}).textContent, big:(document.querySelector('#toast .big') || {}).textContent };
  });
  await h.step(450);
  ev = await T.events(h, 'interact_result');
  const ir = ev.find(e => e[1].label === 'Confront teen suspect');
  h.log('(c) soft', JSON.stringify(c), JSON.stringify(ir && ir[1].toast));
  h.assert(c.row === 'soft' && c.stagger === 0 && c.big === "HE'S RUNNING" && c.small === "He'd clocked you — no time to grab a tray.", '(c) soft: no tray shove (_stagger 0), the toast says why and nothing else (B-MIN-10): ' + c.small);
  h.assert(ir && /no time to grab a tray/.test(ir[1].toast.small), '(c) interact_result.toast.small is the rewritten one');

  // ---- (d) scan seen: lifting his phone at the counter front → HE SAW YOU, then the bolt 0.8 s later, today's opening ----
  await prep(h, 24);
  await T.capture(h);
  const d0 = await M.scan(h, { at:[5.6, 4.0], phase:'phone' });
  const dT = await toastNow(h);
  const d = await h.ev(() => {
    const out = {}; let t = 0;
    __wf.run(0.75); out.at075 = !!CHASE.active;
    __wf.run(0.1); out.at085 = !!CHASE.active;
    const c = CHASE.active; out.cfg = c && { burst:c.burst, row:c.tac.row, speed:c.speed }; out.stagger = ENGINE._stagger;
    __wf.run(0.15);
    return out;
  });
  const d10 = await toastNow(h);
  ev = await T.events(h, 'seen');
  h.log('(d) scan seen', JSON.stringify({ d0:d0.after, dT, d, d10, seen:ev.map(e => [e[1].level, e[1].cause, e[1].why]) }));
  h.assert(dT.big === 'HE SAW YOU' && dT.small === "He saw you lift his phone. He's running.", '(d) the document closes: HE SAW YOU · He saw you lift his phone');
  h.assert(!d.at075 && d.at085 && d.cfg.row === 'scan' && d.cfg.burst && d.cfg.burst[0] === 1.2 && d.stagger > 0.35, '(d) 0.8 s of play later he bolts with today\'s opening');
  h.assert(d10.big === 'HE SAW YOU' && /He saw you lift his phone\. He shoves a tray and runs\./.test(d10.small), '(d) the toast at +1.0 s still names the phone');
  h.assert(ev.some(e => e[1].cause === 'scan' && e[1].level === 'alarm' && e[1].why === "He saw you lift his phone. He's running."), '(d) seen{cause:"scan"} with the frozen line the toast prints');

  // ---- the same side spot: seen in the look-up, not in the phone phase ----
  await prep(h, 25);
  await M.scan(h, { at:[7.5, 2.1], phase:'lookup' });
  const side1 = await h.ev(() => ({ bolt:!!TAC.m2.run().bolt, seenScan:TAC.m2.run().scanSeen, toast:(document.querySelector('#toast .big') || {}).textContent }));
  await prep(h, 25);
  await M.scan(h, { at:[7.5, 2.1], phase:'phone' });
  const side2 = await h.ev(() => ({ bolt:!!TAC.m2.run().bolt, seenScan:TAC.m2.run().scanSeen, susp:TAC.m2.kc().state.susp }));
  h.log('side spot', JSON.stringify({ side1, side2 }));
  h.assert(side1.seenScan && side1.bolt && side1.toast === 'HE SAW YOU', 'the side spot in the look-up: HE SAW YOU');
  h.assert(!side2.seenScan && !side2.bolt && side2.susp < 5, 'the same spot in the phone phase: nothing');

  // ---- (e) the range bolt: an unseen scan, then he makes you from 3.5 m in his look-up ----
  await prep(h, 26);
  await M.scan(h, { at:[9.2, 3.6], phase:'phone' });
  await T.capture(h);
  const e = await h.ev(() => {
    TAC.m2.setPhase('lookup', 30);
    const P = ENGINE.player.position; P.x = 4.5; P.z = 4.0; TAC.player._reset();
    let cfg = null;
    __wf.run(8, () => { const c = CHASE.active; if (c){ cfg = { burst:c.burst, head:c.headStart, stagger:ENGINE._stagger, row:c.tac.row, small:(document.querySelector('#toast .small') || {}).textContent }; return true; } });
    return cfg;
  });
  h.log('(e) range bolt', JSON.stringify(e));
  h.assert(e && e.row === 'bolt' && e.burst == null && e.head === 0 && e.stagger === 0 && e.small === 'He made you from his counter.', '(e) the range bolt: no dash, no head start, no shove; the toast says why and nothing else (B-MIN-10)');
  const encE = (await h.ev(() => { stopChase(); return true; }), null);

  // ---- (f) a fumble in his view: susp ≥ 60, no chase, the phone still there; the forensic bypass is noise ----
  await prep(h, 27);
  await T.capture(h);
  const f0 = await M.scan(h, { at:[5.6, 4.0], phase:'lookup', mg:'back' });
  const f = await h.ev(() => { __wf.run(1.5); const st = TAC.m2.kc().state; return { susp:st.susp, chase:!!CHASE.active, scanned:!!S.game._marketScanned }; });
  ev = await T.events(h, 'seen');
  const again = await h.ev(() => { const P = ENGINE.player.position; P.x = 7.5; P.z = 2.1; const it = nearestInteractable(); return it && it.label; });
  h.log('(f) fumble', JSON.stringify({ f0:f0.after, f, again, seen:ev.map(x => [x[1].level, x[1].cause]) }));
  h.assert(f.susp >= 60 && !f.chase && !f.scanned && ev.some(x => x[1].cause === 'fumble'), '(f) an abandoned scan in his view: susp ≥ 60, seen{fumble}, no chase');
  h.assert(again === 'Scan suspect phone', '(f) the phone is still scannable');
  await prep(h, 28);
  await T.capture(h);
  const fb = await M.scan(h, { at:[9.2, 3.6], phase:'phone', mg:'force' });
  const fb2 = await h.ev(() => { const P = ENGINE.player.position; P.x = 20; P.z = 16; TAC.player._reset(); const s0 = TAC.m2.kc().state.susp; __wf.run(3); return { s0, chase:!!CHASE.active, scanned:!!S.game._marketScanned }; });
  ev = await T.events(h, 'seen');
  h.log('(f) bypass', JSON.stringify({ fb:fb.after, fb2, seen:ev.map(x => [x[1].level, x[1].cause, x[1].why]) }));
  h.assert(fb2.scanned && fb2.s0 >= 59 && !fb2.chase && ev.some(x => x[1].cause === 'noise' && /forcing his phone/.test(x[1].why)), '(f) the forensic bypass: a noise event (≥ 60, "He heard you forcing his phone"), no bolt');

  // ---- (g) TALK on KC during Uche's takedown beat starts nothing ----
  await M.boot(h, { seed:29 });
  const g2 = await h.ev(() => {
    S.game._marketTunde = true; S.game._marketScanned = true;
    TAC.m2._place('back');
    const it = ENGINE.interactables.find(i => i.label === 'Confront teen suspect');
    const P = ENGINE.player.position; P.x = 5.8; P.z = 4.6; it.onInteract(it);
    __wf.run(20, () => { if (!CHASE.active) return true; });
    const during = { toast:(document.querySelector('#toast .big') || {}).textContent, resolving:TAC.m2.run().resolving, beat:!!TPCAM.override, move:ENGINE.movementEnabled };
    it.onInteract(it);
    return Object.assign(during, { chase:!!CHASE.active, dlg:!!document.querySelector('#screen-dialogue.show') });
  });
  await h.step(1600);
  const g3 = await h.ev(() => ({ how:S.game.flags.m2_how, dlg:!!document.querySelector('#screen-dialogue.show') && DLG.scriptKey, chase:!!CHASE.active, move:ENGINE.movementEnabled }));
  h.log('(g) beat', JSON.stringify({ g2, g3 }));
  h.assert(g2.toast === 'UCHE HAS HIM' && g2.resolving && g2.beat && !g2.move && !g2.chase && !g2.dlg, '(g) TALK during Uche\'s takedown beat starts nothing');
  h.assert(g3.dlg === 'market_runner' && !g3.chase && g3.move && g3.how === 'uche', '(g) the caught scene opens after the beat');
  h.assert(!h.errors.length, 'no page errors: ' + h.errors.join(' | '));
};
