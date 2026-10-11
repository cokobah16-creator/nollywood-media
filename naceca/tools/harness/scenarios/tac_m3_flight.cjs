// tac_m3_flight: Obi runs for the kitchen door and can be stopped (DESIGN §1, §2.3 C-M2/C-M8, §5.4; mansion.md §1.4).
// Knock and stand still: out the back by about 6 s, the perimeter brings him round 6 s later to (0.9, 9.6); NOT force
// (forceUsed unchanged, "By the book" still possible), two arrest choices, the perimeter headline, grade −5. A sprint
// intercept; a touch-jog intercept with a 1.5 s reaction; the loud stun grab (no run); beating the thumb (no wipe,
// 7 files, the informant deal without Crisis Negotiator); cornered by Kelechi (hands up) vs a posted Uche (tackle,
// force 0) vs a following Uche (cornered); the field skill open while he runs (he keeps running inside it,
// duringMinigame); timers off: no run (logged with by:null, timers:'off'). Once stopped, his box is back where he stands
// (gone again at the arrest). The radio in real time (game time stepped with wall time): the knock line keeps its key,
// never comes back after "He's running", the out line then the perimeter line 6 s later; after COVER HIM the run line
// stops at once and "NACECA! On your knees!" shows within the radio's own preemption bound.
// Owner: Team C.
const L = require('./tac_m3_lib.cjs');

const obiEnc = async h => (await L.ev(h, 'enc')).filter(e => e[1].enc === 'm3_obi').map(e => e[1]);
const KNOCK = /^NACECA! (Search warrant: open the door|Open up)!$/, RUN = "He's running: the back corridor!",
  OUT = "He's out the kitchen door. Perimeter, he's yours!", PERIM = "Perimeter has him, in the yard. They're bringing him round the front.", COVER = 'NACECA! On your knees!';

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
        poiRun, poiOut, poiEnd:[poi.x, poi.z], inPois:MINIMAP.pois.includes(poi), box:blockedAt(0.9, 9.6, 0) }; });
    h.log('knock idle', JSON.stringify(out));
    h.assert(out.tOut != null && Math.abs(out.tOut - 5.98) <= 0.3, 'knock idle: out the kitchen door by about 6 s: ' + out.tOut);
    h.assert(out.tPer != null && Math.abs(out.tPer - out.tOut - 6) <= 0.15, 'the perimeter 6 s later: ' + (out.tPer - out.tOut));
    h.assert(out.vis && out.pos[0] === 0.9 && out.pos[1] === 9.6 && out.outcome === 'perimeter' && out.by === 'perimeter' && out.pursuit === null, 'Obi kneels on the drive at (0.9, 9.6), outcome perimeter');
    h.assert(out.force === f0, 'the perimeter is NOT force: forceUsed unchanged (' + f0 + ' → ' + out.force + ')');
    h.assert(out.box === true, 'kneeling on the drive, he has his collision box again (nobody walks through him)');
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
    const bx1 = await h.ev(() => { __m3.run(0.2); return { box:blockedAt(0.9, 9.6, 0), has:!!TAC.m3.obi().box }; });
    h.assert(!bx1.box && !bx1.has, 'the box goes again at the arrest: ' + JSON.stringify(bx1));
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
    const bx = await h.ev(() => { const R = TAC.m3.run(); __m3.run(0.3); const m = R.M.obi.position;
      return { box:blockedAt(m.x, m.z, 0), has:!!R.obi.box, d:+Math.hypot(ENGINE.player.position.x - m.x, ENGINE.player.position.z - m.z).toFixed(2), at:[+m.x.toFixed(2), +m.z.toFixed(2)] }; });
    h.log('box after the intercept', JSON.stringify(bx));
    h.assert(bx.box && bx.has, 'stopped in the house, his box is back where he stands (Kelechi no longer walks through him): ' + JSON.stringify(bx));
    a = await L.arrest(h, 0);
    h.log('intercept arrest', JSON.stringify(a));
    h.assert(a.c.length === 3 && !a.c.some(c => /informant/i.test(c)) && a.arrest === 'professional', "an intercept keeps today's capability rule (no informant deal without Crisis Negotiator): " + JSON.stringify(a.c));
    h.assert((await h.ev(() => S.game.forceUsed)) === s.force, 'no force for an intercept');
    const bx2 = await h.ev(() => { const R = TAC.m3.run(); __m3.run(0.2); const m = R.M.obi.position; return { box:blockedAt(m.x, m.z, 0), has:!!R.obi.box }; });
    h.assert(!bx2.box && !bx2.has, 'and it goes again at the arrest: ' + JSON.stringify(bx2));
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
    enc = await obiEnc(h);
    h.log('timers off enc', JSON.stringify(enc));
    h.assert(enc.length === 1 && enc[0].by === null && enc[0].timers === 'off', "timers off: nobody cornered him, so enc m3_obi has by:null and timers:'off' (not by:'kelechi'): " + JSON.stringify(enc));
    await L.restore(h);

    // ---------- 11 · the radio in real time: knock, stand still ----------
    // the station's bulletins (v13_intel.js:561, 9 s after the start) are muted here and the strip cleared under the
    // card, so the knock line is said on an IDLE radio every run (the case that lost its key, REVIEW C-1); case 12
    // keeps the bulletins
    await L.v8(h);
    await h.ev(() => { if (!window.radioLine.__m3mute) { const o = window.radioLine; const f = function (sp) { if (window.__muteNews && sp === RADIO_STATION) return; return o.apply(this, arguments); };
      f.__m3mute = true; window.radioLine = f; } window.__muteNews = true; });
    await L.breach(h, { entry:'knock' }, { card:false });
    await h.ev(() => clearRadio());
    await h.step(2200);
    const tl = await L.realtime(h, 16, 0.25, { stop:'TAC.m3.obi().state === "perimeter" && TAC.m3.run().t > TAC.m3.obi().stopAt + 1' });
    const rev = (await L.ev(h, 'radio')).map(e => e[1]);
    let last = ''; for (const x of tl) { const k = x.obi + '|' + x.strip; if (k !== last) { h.log('  radio', x.t, x.obi, JSON.stringify(x.strip)); last = k; } }
    h.log('radio events', JSON.stringify(rev));
    const iRun = tl.findIndex(x => x.strip === RUN);
    const knockAfter = iRun >= 0 ? tl.slice(iRun).filter(x => KNOCK.test(x.strip || '')).map(x => x.t) : ['no run line'];
    h.assert(rev.some(e => e.key === 'm3_knock' && e.pri === 1 && e.outcome === 'shown'), 'the knock line keeps its key and priority on an idle radio: radio{m3_knock, pri 1, shown}');
    h.assert(iRun >= 0 && rev.some(e => e.key === 'm3_run' && e.outcome === 'shown'), '"He\'s running" is shown when he runs');
    h.assert(!knockAfter.length, 'the knock line never comes back after the run line (it was at ' + JSON.stringify(knockAfter) + ')');
    const tOutSt = (tl.find(x => x.obi === 'out_back') || {}).t, oS = tl.find(x => x.strip === OUT), pS = tl.find(x => x.strip === PERIM);
    h.log('out state', tOutSt, 'out line', oS && oS.t, 'perimeter line', pS && pS.t);
    h.assert(oS && tOutSt != null && oS.t - tOutSt <= 0.3 + 1e-9, 'the out line shows as he goes out the kitchen door (' + (oS && oS.t) + ' vs ' + tOutSt + ')');
    h.assert(oS && pS && Math.abs(pS.t - oS.t - 6) <= 0.5, 'then the perimeter line about 6 s later (' + (pS && oS ? (pS.t - oS.t).toFixed(2) : null) + ' s)');
    h.assert(!tl.slice(iRun + 1).some(x => x.strip === RUN && x.obi !== 'running'), 'the run line is gone once he is out');
    await h.ev(() => { window.__muteNews = false; });
    await L.restore(h);

    // ---------- 12 · COVER HIM in real time: the run line stops, the cover shout comes at once ----------
    // seeds 7 and 11 as they come; then a bulletin put on the strip just before he runs, so the run line is still
    // waiting behind it at the tap (the case A's 1.2 s rule bounds)
    const NEWS = 'Fuel queues are back on Ikorodu Road this morning. Marketers blame the depot price.';
    for (const { seed, news } of [{ seed:7 }, { seed:11 }, { seed:7, news:true }]) {
      await L.v8(h, { seed });
      await L.breach(h, { entry:'knock' });
      if (news) {
        await L.realtime(h, 3, 0.15, { stop:'TAC.m3.run().t >= 2.2' });
        await h.ev(n => { clearRadio(); radioLine(RADIO_STATION, n, 4400); }, NEWS);
      }
      await L.realtime(h, 4, 0.15, { stop:'TAC.m3.obi().state === "running"' });
      await L.realtime(h, 0.3, 0.15);
      const tap = await h.ev(() => { const s0 = document.querySelector('#radio-sub.show'), strip = s0 ? (s0.querySelector('.rs-text') || {}).textContent : null;
        const ok = TAC.m3.order('cover', 'button'), s1 = document.querySelector('#radio-sub.show');
        return { ok, strip, after:s1 ? (s1.querySelector('.rs-text') || {}).textContent : null, obi:TAC.m3.obi().state, now:performance.now() }; });
      const tl2 = await L.realtime(h, 6, 0.1);
      const ord = (await L.ev(h, 'radio')).map(e => e[1]).filter(e => e.key === 'm3_order' && e.outcome === 'shown');
      const runAfter = tl2.filter(x => x.strip === RUN).map(x => x.t), knock2 = tl2.filter(x => KNOCK.test(x.strip || '')).map(x => x.t);
      const iC = tl2.findIndex(x => x.strip === COVER), seenMs = tap.after === COVER ? 0 : iC >= 0 ? Math.round(tl2[iC].now - tap.now) : null;
      h.log('cover seed ' + seed + (news ? ' + bulletin' : ''), JSON.stringify(tap), 'shown after', seenMs, 'ms', JSON.stringify(ord));
      h.assert(tap.ok && tap.obi === 'handsup', 'seed ' + seed + ': COVER HIM taken, hands up');
      if (news) h.assert(tap.strip === NEWS, 'the bulletin is on the strip at the tap, the run line waiting behind it: ' + JSON.stringify(tap.strip));
      h.assert(!runAfter.length && !knock2.length, 'seed ' + seed + ': once he is covered the strip never says "He\'s running" or the knock line again: ' + JSON.stringify({ runAfter, knock2 }));
      // the run line on the strip at the tap: the shout replaces it at once; a news or story line up instead: A's rule
      // (a pri-3 line cuts an unkeyed one once it has been up 1.2 s, DESIGN §5.6) bounds the wait
      const bound = tap.strip === RUN || tap.strip == null ? 500 : 1300;
      h.assert(ord.length === 1 && ord[0].waitMs <= bound && seenMs != null && seenMs <= bound + 200, 'seed ' + seed + ': "NACECA! On your knees!" shows within ' + bound + ' ms of the tap (radio waitMs ' + (ord[0] && ord[0].waitMs) + ', on the strip after ' + seenMs + ' ms; strip at the tap: ' + JSON.stringify(tap.strip) + ')');
      await L.restore(h);
    }
    h.assert(!h.errors.length, 'no page errors: ' + h.errors.join(' | '));
  } finally { await L.restore(h); }
};
