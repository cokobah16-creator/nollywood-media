// tac_m3_flight: Obi runs for the kitchen door and can be stopped (DESIGN §1, §2.3 C-M2/C-M8, §5.4; mansion.md §1.4).
// Knock and stand still: out the back by about 6 s, the perimeter brings him round 6 s later to (0.9, 9.6); NOT force
// (forceUsed unchanged, "By the book" still possible), two arrest choices, the perimeter headline, grade −5. A sprint
// intercept; a touch-jog intercept with a 1.5 s reaction; the loud stun grab (no run); beating the thumb (no wipe,
// 7 files, the informant deal without Crisis Negotiator); cornered by Kelechi (hands up) vs a posted Uche (tackle,
// force 0) vs a following Uche (cornered); the field skill open while he runs (he keeps running inside it,
// duringMinigame); timers off: no run.
// Owner: Team C.
const L = require('./tac_m3_lib.cjs');

const obiEnc = async h => (await L.ev(h, 'enc')).filter(e => e[1].enc === 'm3_obi').map(e => e[1]);

module.exports = async h => {
  try {
    // ---------- 1 · knock, stand still: out the back, the perimeter, no force ----------
    await L.v8(h);
    const b = await L.breach(h, { entry:'knock' });
    const f0 = b.after.force;
    const out = await h.ev(() => { const R = TAC.m3.run(), poi = R.pois.obi; let tOut = null, tPer = null, poiRun = null, poiOut = null;
      __m3.run(16, () => { if (poiRun == null && R.obi.state === 'running' && R.t > 4) poiRun = [poi.x, poi.z, R.M.obi.position.x, R.M.obi.position.z];
        if (tOut == null && R.obi.state === 'out_back'){ tOut = R.t; } if (tOut != null && poiOut == null && R.t > tOut + 1) poiOut = [poi.x, poi.z];
        if (tPer == null && R.obi.state === 'perimeter'){ tPer = R.t; return true; } });
      __m3.run(0.05);
      const o = R.M.obi; return { tOut, tPer, pos:[o.position.x, o.position.z], vis:o.visible !== false, force:S.game.forceUsed, outcome:R.obi.outcome, by:R.obi.by, pursuit:TAC.state.pursuit,
        poiRun, poiOut, poiEnd:[poi.x, poi.z], inPois:MINIMAP.pois.includes(poi) }; });
    h.log('knock idle', JSON.stringify(out));
    h.assert(out.tOut != null && Math.abs(out.tOut - 5.98) <= 0.3, 'knock idle: out the kitchen door by about 6 s: ' + out.tOut);
    h.assert(out.tPer != null && Math.abs(out.tPer - out.tOut - 6) <= 0.15, 'the perimeter 6 s later: ' + (out.tPer - out.tOut));
    h.assert(out.vis && out.pos[0] === 0.9 && out.pos[1] === 9.6 && out.outcome === 'perimeter' && out.by === 'perimeter' && out.pursuit === null, 'Obi kneels on the drive at (0.9, 9.6), outcome perimeter');
    h.assert(out.force === f0, 'the perimeter is NOT force: forceUsed unchanged (' + f0 + ' → ' + out.force + ')');
    h.assert(out.inPois && out.poiRun && Math.abs(out.poiRun[0] - out.poiRun[2]) < 0.2 && Math.abs(out.poiRun[1] - out.poiRun[3]) < 0.2 && out.poiOut[0] > 1000 && out.poiEnd[0] === 0.9 && out.poiEnd[1] === 9.6,
      "the minimap's Obi blip follows him, hides while he is out the back, and sits on the drive after: " + JSON.stringify({ run:out.poiRun, out:out.poiOut, end:out.poiEnd }));
    const radio = (await L.ev(h, 'radio')).map(e => e[1].key + ':' + e[1].outcome);
    h.log('radio', JSON.stringify(radio));
    let enc = await obiEnc(h);
    h.assert(enc.length === 1 && enc[0].outcome === 'perimeter' && enc[0].by === 'perimeter' && enc[0].alertedBy === 'knock' && enc[0].runSecs > 3 && enc[0].ranM > 10, 'enc m3_obi{perimeter}: ' + JSON.stringify(enc));
    await h.ev(() => { ENGINE.player.position.x = 0.9; ENGINE.player.position.z = 8.0; });
    let a = await L.arrest(h, 0);
    h.log('perimeter arrest', JSON.stringify(a));
    h.assert(a.c.length === 2 && /^Read him his rights/.test(a.c[0]) && /^Down on the ground/.test(a.c[1]) && a.arrest === 'professional', 'two arrest choices after the perimeter');
    const g = await h.ev(() => {
      const R = TAC.m3.run(), op = { arrests:1, civ:0, force:0, intel:0, ev:1, xp:0 };
      const head = generateHeadline().head;
      const g1 = computeGrade(op); R.obi.outcome = 'intercepted'; const g0 = computeGrade(op); R.obi.outcome = 'perimeter';
      __m3.run(0.3);
      return { head, g1:g1.pts, g0:g0.pts, book:(S.game._sq && S.game._sq.st) ? S.game._sq.st.m3_book || null : null, force:S.game.forceUsed };
    });
    h.log('perimeter after', JSON.stringify(g));
    h.assert(g.head === 'Lekki Chief Bolts Out the Back, Held in His Own Yard', 'the perimeter headline: ' + g.head);
    h.assert(g.g1 === g.g0 - 5, 'grade −5 for the perimeter: ' + g.g1 + ' vs ' + g.g0);
    h.assert(g.book === 'done' && g.force === f0, '"By the book" holds (no force on the record): ' + g.book);
    await L.restore(h);

    // ---------- 2 · knock, sprint for the corridor mouth after 0.6 s: intercepted in the house ----------
    await L.v8(h);
    await L.breach(h, { entry:'knock' });
    const s = await h.ev(() => { __m3.run(0.6); const R = TAC.m3.run();
      const w = __m3.walk([[0.35,5.0],[0.4,2.6],[0.75,-2.9],[0.45,-4.0]], 5.2, { sprint:true, hold:true, max:8, stop:() => !!R.obi.outcome });
      return { outcome:R.obi.outcome, by:R.obi.by, t:R.t, obi:[R.M.obi.position.x, R.M.obi.position.z], at:w.at, force:S.game.forceUsed, label:(ENGINE.interactables.find(i => i.mesh === R.M.obi) || {}).label }; });
    h.log('sprint intercept', JSON.stringify(s));
    h.assert(s.outcome === 'intercepted' && s.by === 'kelechi' && s.obi[1] > -4.7, 'sprint: intercepted before the corridor (z > −4.7): ' + JSON.stringify(s));
    h.assert(s.label === 'Move on suspect', 'the label is back to "Move on suspect" once stopped');
    a = await L.arrest(h, 0);
    h.log('intercept arrest', JSON.stringify(a));
    h.assert(a.c.length === 3 && !a.c.some(c => /informant/i.test(c)) && a.arrest === 'professional', "an intercept keeps today's capability rule (no informant deal without Crisis Negotiator): " + JSON.stringify(a.c));
    h.assert((await h.ev(() => S.game.forceUsed)) === s.force, 'no force for an intercept');
    await L.restore(h);

    // ---------- 3 · a touch jog after a 1.5 s reaction still makes it ----------
    await L.v8(h);
    await L.breach(h, { entry:'knock' });
    const j = await h.ev(() => { __m3.run(1.5); const R = TAC.m3.run();
      const w = __m3.walk([[0.35,5.0],[0.4,2.6],[0.75,-2.9]], 3.0, { hold:true, max:8, stop:() => !!R.obi.outcome });
      return { outcome:R.obi.outcome, t:R.t, obi:[+R.M.obi.position.x.toFixed(2), +R.M.obi.position.z.toFixed(2)], at:w.at }; });
    h.log('touch jog, 1.5 s reaction', JSON.stringify(j));
    h.assert(j.outcome === 'intercepted', 'a touch jog (3.0 m/s) with a 1.5 s reaction intercepts him: ' + JSON.stringify(j));
    await L.restore(h);

    // ---------- 4 · loud: the stun grab (no run) ----------
    await L.v8(h);
    await L.breach(h, { entry:'loud' });
    const l = await h.ev(() => { const R = TAC.m3.run();
      __m3.walk([[0.35,4.6],[0.5,2.6],[2.3,0.4]], 5.2, { sprint:true, max:3 });
      const it = ENGINE.interactables.find(i => i.label === 'Move on suspect'), d = Math.hypot(ENGINE.player.position.x - 4.12, ENGINE.player.position.z + 1);
      const near = nearestInteractable();
      it.onInteract(it);
      return { t:R.t, d:+d.toFixed(2), near:near && near.label, outcome:R.obi.outcome, state:R.obi.state, wipe:R.wipe.mode, total:S.game._wipeTotal }; });
    h.log('loud grab', JSON.stringify(l));
    h.assert(l.t < 2.5 && l.d < 2.7 && l.near === 'Move on suspect', 'loud: in arrest range inside the 2.5 s stun, and ACTION picks Obi over the laptop (priority 3)');
    h.assert(l.outcome === 'stun_grab' && l.state === 'handsup' && l.wipe === 'armed' && l.total === 40, 'the stun grab: hands up, no run, the loud wipe still armed: ' + JSON.stringify(l));
    await L.finishDialogue(h);
    const l2 = await h.ev(() => { __m3.run(3); const R = TAC.m3.run(); return { state:R.obi.state, ran:R.obi.ranM }; });
    h.assert(l2.ran === 0 && l2.state !== 'running', 'no run after a stun grab');
    await L.restore(h);

    // ---------- 5 · quiet: beat the thumb (no wipe, all 7 files, the deal without Crisis Negotiator) ----------
    await L.v8(h);
    await L.breach(h, { entry:'quiet' });
    const bt = await h.ev(() => { const R = TAC.m3.run();
      __m3.walk([[0.4,4.9],[0.5,2.6],[1.6,1.4],[2.3,0.4]], 1.55, { stop:() => R.obi.state === 'reaching' });
      const a0 = R.obi.alarmAt;
      __m3.walk([[2.3,0.4]], 5.2, { sprint:true, stop:() => Math.hypot(ENGINE.player.position.x - 4.12, ENGINE.player.position.z + 1) < 2.6 });
      const dt = R.t - a0, near = nearestInteractable();
      const it = ENGINE.interactables.find(i => i.label === 'Move on suspect'); it.onInteract(it);
      return { dt, near:near && near.label, outcome:R.obi.outcome, wipe:R.wipe.mode, total:S.game._wipeTotal, why:R.w.state.whyPast }; });
    h.log('beat the thumb', JSON.stringify(bt));
    h.assert(bt.dt < 0.5 && bt.near === 'Move on suspect' && bt.outcome === 'beat_thumb' && bt.wipe === 'never' && bt.total === 0, 'grabbed inside the 0.5 s reach: beat_thumb, the wipe never starts');
    await L.finishDialogue(h);
    const bc = await h.ev(() => [...document.querySelectorAll('#dlg-choices button')].map(b => b.textContent.replace(/^\d\./, '').trim()));
    h.log('beat-the-thumb choices', JSON.stringify(bc));
    h.assert(bc.length === 4 && bc.some(c => /^Offer informant deal/.test(c)), 'four arrest choices: the informant deal without Crisis Negotiator after beating the thumb');
    await L.choose(h, 0); await L.finishDialogue(h);
    const lap = await L.laptop(h);
    h.log('the laptop', JSON.stringify(lap));
    h.assert(!lap.mg && lap.files === 7 && lap.pct === 0 && lap.ev, 'beat the thumb: the laptop is seized with all 7 files, no field skill');
    await L.restore(h);

    // ---------- 6 · cornered by Kelechi: hands up, no run ----------
    await L.v8(h);
    await L.breach(h, { entry:'knock' });
    const ck = await h.ev(() => { const R = TAC.m3.run(); __m3.run(1.5); ENGINE.player.position.x = 0; ENGINE.player.position.z = -6.0; __m3.run(1.5);
      return { outcome:R.obi.outcome, by:R.obi.by, state:R.obi.state, ran:R.obi.ranM, toast:(window.__toasts || []).map(t => t[0]).filter(t => /CORNERED/.test(t)) }; });
    h.log('cornered by Kelechi', JSON.stringify(ck));
    h.assert(ck.outcome === 'cornered' && ck.by === 'kelechi' && ck.state === 'handsup' && ck.ran === 0 && ck.toast.length === 1, 'Kelechi in the corridor: cornered, hands up, no run');
    await L.restore(h);

    // ---------- 7 · a posted Uche (Squad Trust) tackles him in front of you, force 0 ----------
    await L.v8(h, { state:L.state('squad') });
    const bp = await L.breach(h, { entry:'knock', uche:'rear' });
    h.assert(bp.st.uche === 'post', 'Squad Trust: Uche posted inside the kitchen door');
    const tk = await h.ev(() => { const R = TAC.m3.run(); __m3.run(8, () => !!R.obi.outcome);
      return { outcome:R.obi.outcome, by:R.obi.by, state:R.obi.state, pos:[+R.M.obi.position.x.toFixed(2), +R.M.obi.position.z.toFixed(2)], force:S.game.forceUsed, job:R.uche.job }; });
    h.log('posted Uche', JSON.stringify(tk));
    h.assert(tk.outcome === 'tackled' && tk.by === 'uche' && tk.state === 'down' && tk.pos[1] > -8.1 && tk.force === bp.after.force && tk.job === 'tackle', 'a posted Uche tackles him at the kitchen door, force 0');
    const ad = (await L.ev(h, 'ally_done')).map(e => e[1]);
    h.assert(ad.some(d => d.task === 'tackle' && d.outcome === 'done' && d.who === 'uche'), 'ally_done{tackle}');
    await L.restore(h);

    // ---------- 8 · a following Uche in the corridor mouth, in Obi's sight: cornered ----------
    await L.v8(h);
    await L.breach(h, { entry:'knock' });
    const cu = await h.ev(() => { const R = TAC.m3.run(); __m3.run(2.42);
      const u = R.M.uche.position; u.x = 0.3; u.z = -4.3; R.uche.path = []; R.uche.mode = 'follow';
      const seen = TAC.sight.los(4.12, -1, 1.6, 0.3, -4.3, 1.45).clear;
      __m3.run(0.15);
      return { seen, mode:R.uche.mode, outcome:R.obi.outcome, by:R.obi.by, state:R.obi.state, ran:R.obi.ranM, t:R.t }; });
    h.log('following Uche', JSON.stringify(cu));
    h.assert(cu.seen && cu.outcome === 'cornered' && cu.by === 'uche' && cu.state === 'handsup' && cu.ran === 0, 'a following Uche in the corridor mouth that Obi can see: cornered');
    await L.restore(h);

    // ---------- 9 · the field skill open while he runs: he keeps running inside it ----------
    await L.v8(h);
    await L.breach(h, { entry:'knock' });
    await h.ev(() => { const R = TAC.m3.run(); __m3.run(2.7, () => R.obi.state === 'running' && R.t > 2.6); });
    const mg0 = await h.ev(() => { const R = TAC.m3.run(); const it = ENGINE.interactables.find(i => i.label === 'Inspect laptop');
      ENGINE.player.position.x = 2.38; ENGINE.player.position.z = -1.02; it.onInteract(it);
      return { open:!!(MINI.active), sub:(MINI.active && MINI.active.cfg.sub) || '', ran:R.obi.ranM, state:R.obi.state }; });
    h.log('field skill', JSON.stringify(mg0));
    h.assert(mg0.open && /He's still running while you work\./.test(mg0.sub), 'KILL THE WIPE opens while he runs, and says so');
    await h.ev(() => { if (MINI.active && MINI.active.phase === 'intro') miniStart(MINI.active); });
    await h.step(1500);
    const mg1 = await h.ev(() => { const R = TAC.m3.run(); return { ran:R.obi.ranM, state:R.obi.state, wt:S.game._wipeT, t:R.t }; });
    h.log('inside the field skill', JSON.stringify(mg1));
    h.assert(mg1.ran > mg0.ran + 1, 'he advanced inside the field skill (' + mg0.ran + ' → ' + mg1.ran + ')');
    // keep it open until the perimeter has him (out the back, then 6 s): the perimeter timer runs inside it too
    for (let i = 0; i < 30; i++) { const st = await h.ev(() => TAC.m3.obi().state); if (st === 'perimeter') break; await h.step(500); }
    enc = await obiEnc(h);
    h.log('enc during the field skill', JSON.stringify(enc));
    h.assert(enc.length === 1 && enc[0].outcome === 'perimeter' && enc[0].duringMinigame === true, 'the perimeter came during the field skill: duringMinigame true');
    await h.ev(() => { if (MINI.active) miniSuccess(MINI.active, { stars:3 }); });
    await h.step(500);
    for (let i = 0; i < 6; i++) { const sh = await L.shown(h); if (!sh.includes('screen-minigame')) break; await h.ev(() => { const b = document.querySelector('#mg-actions button'); if (b) b.click(); else showOverlay(null); }); await h.step(250); }
    const after = await h.ev(() => ({ files:(S.game.flags.m3_files || []).length, ev:!!S.game._evLaptop, pct:S.game.flags.m3_wipe_pct }));
    h.log('halted after the field skill', JSON.stringify(after));
    h.assert(after.ev && after.files >= 1 && after.files <= 7, 'the laptop halted through the field skill, files recorded');
    await L.restore(h);

    // ---------- 10 · timers off: he doesn't run, he puts his hands up ----------
    await L.v8(h);
    await h.ev(() => { window.__timed0 = SETTINGS.timed; SETTINGS.timed = 'off'; });
    await L.breach(h, { entry:'knock' });
    const off = await h.ev(() => { const R = TAC.m3.run(); __m3.run(4); return { outcome:R.obi.outcome, state:R.obi.state, ran:R.obi.ranM, states:R.obi.states.map(s => s[0]) }; });
    await h.ev(() => { SETTINGS.timed = window.__timed0; });
    h.log('timers off', JSON.stringify(off));
    h.assert(off.state === 'handsup' && off.ran === 0 && !off.states.includes('running'), 'timers off: no run, hands up');
    h.assert(!h.errors.length, 'no page errors: ' + h.errors.join(' | '));
  } finally { await L.restore(h); }
};
