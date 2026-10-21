// tac_m3_uche: Sgt. Uche on the ground (DESIGN §1, §2.3 C-M6/C-M7/C-M10/C-M11, §5.4; mansion.md §1.5, §3.6).
// He follows 1.6-3.5 m behind on the waypoint graph and is never within 0.25 m of a collider; nearestInteractable()
// never answers with him after the breach (his "Plan the raid" is consumed); COVER HIM is not offered at t = 0 from
// the doorway but is once Obi runs (and a wipe already armed stays armed); TAKE HER OUT walks the child out (+1 rescued,
// child_gentle when nobody had spoken to her) and is refused with why 'unaware' on a quiet entry; the posted tackle
// costs no force; the Squad Trust payoff is paid only when Uche was posted at the back when Obi was stopped, and a
// second Extract press inside its 1.5 s delay does not complete the operation twice. A refused job is not advertised
// (no UCHE button or chip while he is unaware on a quiet entry; Q still answers why). An escort Kelechi overtakes
// (he takes her hand first) ends with ally_done{escort, cancelled}.
// Owner: Team C.
const L = require('./tac_m3_lib.cjs');

module.exports = async h => {
  try {
    // ---------- follow: 1.6-3.5 m, clear of every collider, never the ACTION target ----------
    await L.v8(h);
    await h.ev(() => { window.__timed0 = SETTINGS.timed; SETTINGS.timed = 'off'; });     // Obi gives up at the desk: a calm house to walk
    await L.breach(h, { entry:'knock' });
    const f = await h.ev(() => {
      const R = TAC.m3.run(), u = R.M.uche.position, P = ENGINE.player.position;
      let minD = 99, maxD = 0, blocked = 0, nearU = 0, n = 0, t = 0;
      const route = [[0.35,5.0],[0.4,2.6],[2.2,2.4],[2.3,0.9],[1.0,-1.0],[0.75,-2.9],[0.3,-4.2],[0,-6.5]];
      const w = __m3.walk(route, 1.55, { max:30, stop:() => {
        t += 1 / 60;
        if (blockedAt(u.x, u.z, 0.25)) blocked++;
        const it = nearestInteractable(); if (it && it.mesh === R.M.uche) nearU++;
        if (t > 2.5){ const d = Math.hypot(u.x - P.x, u.z - P.z); minD = Math.min(minD, d); maxD = Math.max(maxD, d); n++; }
        return false; } });
      __m3.run(2.0, () => { if (blockedAt(u.x, u.z, 0.25)) blocked++; });
      const dEnd = Math.hypot(u.x - P.x, u.z - P.z);
      return { reached:w.reached, at:w.at, minD:+minD.toFixed(2), maxD:+maxD.toFixed(2), dEnd:+dEnd.toFixed(2), blocked, nearU, n, mode:R.uche.mode, u:[+u.x.toFixed(2), +u.z.toFixed(2)],
        consumed:(ENGINE.interactables.find(i => /^Plan the raid/.test(i.label)) || {}).consumed === true };
    });
    await h.ev(() => { SETTINGS.timed = window.__timed0; });
    h.log('follow', JSON.stringify(f));
    h.assert(f.reached && f.mode === 'follow', 'Kelechi walked the house with Uche following');
    h.assert(f.minD >= 1.6 && f.maxD <= 3.5 && f.dEnd >= 1.6 && f.dEnd <= 2.6, 'he keeps 1.6-3.5 m behind (and settles at 1.8-2.5 m): ' + JSON.stringify(f));
    h.assert(f.blocked === 0, 'never within 0.25 m of a collider (blockedAt): ' + f.blocked + ' frames');
    h.assert(f.consumed && f.nearU === 0, 'nearestInteractable() is never Uche after the breach');
    // a crouched player: he sneaks
    const sn = await h.ev(() => { const R = TAC.m3.run(); __m3.walk([[0,-6.5],[0.3,-4.2],[0.75,-2.9]], 1.25, { crouch:true, keep:true }); const sp = R.uche.speed; ENGINE.keys.KeyC = false; return { sp, clip:R.uche.clip }; });
    h.assert(sn.sp === 1.25, 'he sneaks (1.25 m/s) when you crouch near him: ' + JSON.stringify(sn));
    await L.restore(h);

    // ---------- COVER: not at t = 0 from the doorway; offered once he runs; the armed wipe stays armed ----------
    await L.v8(h);
    await L.breach(h, { entry:'knock' });
    const c0 = await h.ev(() => { __m3.run(0.1); return { offer:TAC.m3.offer(), d:Math.hypot(TAC.m3.run().M.uche.position.x - 4.12, TAC.m3.run().M.uche.position.z + 1) }; });
    h.log('t = 0.1', JSON.stringify(c0));
    h.assert(!c0.offer || c0.offer.order !== 'cover', 'COVER is not offered at t = 0 from the doorway (he is ' + c0.d.toFixed(1) + ' m away)');
    const c1 = await h.ev(() => { const R = TAC.m3.run(); __m3.run(3, () => R.obi.state === 'running' && R.t >= 2.6); return { t:R.t, obi:R.obi.state, offer:TAC.m3.offer(), wipe:R.wipe.mode }; });
    h.log('running', JSON.stringify(c1));
    h.assert(c1.obi === 'running' && c1.offer && c1.offer.order === 'cover' && c1.offer.ok, 'COVER HIM is offered once Obi runs');
    const cv = await h.ev(() => { const ok = TAC.m3.order('cover', 'button'); const R = TAC.m3.run(); __m3.run(2); return { ok, obi:R.obi.state, outcome:R.obi.outcome, by:R.obi.by, wipe:R.wipe.mode, total:S.game._wipeTotal, job:R.uche.job, offer:TAC.m3.offer() }; });
    h.log('covered', JSON.stringify(cv));
    h.assert(cv.ok && cv.outcome === 'covered' && cv.by === 'uche' && cv.obi === 'handsup' && cv.wipe === 'armed' && cv.total === 55, 'covered: hands up, the wipe already armed stays armed');
    h.assert(cv.job === 'cover' && cv.offer && cv.offer.busy, 'Uche stays on him (the button reads COVERING)');
    let ord = (await L.ev(h, 'order')).map(e => e[1]);
    h.assert(ord.length === 1 && ord[0].order === 'cover' && ord[0].ok === true && ord[0].src === 'button' && ord[0].who === 'uche' && ord[0].def === false && ord[0].obi === 'running', 'order{cover, ok, src:button}');
    const busy = await h.ev(() => TAC.m3.order('cover', 'key'));
    ord = (await L.ev(h, 'order')).map(e => e[1]);
    h.assert(!busy && ord[1] && ord[1].ok === false && ord[1].why === 'busy' && ord[1].src === 'key', 'a second order while he covers: refused, why busy');
    await h.ev(() => { ENGINE.player.position.x = TAC.m3.run().M.obi.position.x + 1; ENGINE.player.position.z = TAC.m3.run().M.obi.position.z; });
    await L.arrest(h, 0);
    await h.ev(() => __m3.run(0.3));
    const ad = (await L.ev(h, 'ally_done')).map(e => e[1]);
    h.assert(ad.some(d => d.task === 'cover_held' && d.outcome === 'done'), 'ally_done{cover_held} once the arrest is made: ' + JSON.stringify(ad));
    await L.restore(h);

    // ---------- TAKE HER OUT (civilians known from Street Sources; nobody has spoken to her) ----------
    await L.v8(h, { state:L.state('tip') });
    await L.breach(h, { entry:'knock' });
    const tk = await h.ev(() => { __m3.run(0.1); const o = TAC.m3.offer(); const civ0 = S.game.civiliansRescued; const ok = TAC.m3.order('take_child', 'button');
      const R = TAC.m3.run(); let tOut = null; __m3.run(25, () => { if (R.child.state === 'out' && tOut == null){ tOut = R.t; } return tOut != null && !R.uche.job; });
      return { o, ok, out:R.child.state, by:R.child.by, tOut, civ:S.game.civiliansRescued - civ0, gentle:!!S.game.flags.child_gentle, o5:(S.game.objectives.find(x => x.id === 'o5_civ') || {}).done,
        childZ:+R.M.child.position.z.toFixed(2), job:R.uche.job, mode:R.uche.mode, by2:S.game.flags.child_by || null }; });
    h.log('take her out', JSON.stringify(tk));
    h.assert(tk.o && tk.o.order === 'take_child' && tk.o.ok && tk.ok, 'TAKE HER OUT is offered (civilians known, Obi not running) and taken');
    h.assert(tk.out === 'out' && tk.by === 'uche' && tk.civ === 1 && tk.o5 === true && tk.childZ > 4.6, 'Uche walks her out: o5 done, +1 rescued, she is past the porch');
    h.assert(tk.gentle === true && tk.by2 === null, 'nobody had spoken to her: child_gentle (no child_by)');
    const ad2 = (await L.ev(h, 'ally_done')).map(e => e[1]);
    h.assert(ad2.some(d => d.task === 'escort' && d.outcome === 'done'), 'ally_done{escort}');
    await L.restore(h);

    // ---------- refused while he is unaware, on a quiet entry ----------
    await L.v8(h, { state:L.state('tip') });
    await L.breach(h, { entry:'quiet' });
    const rq = await h.ev(() => { __m3.run(0.2); const o = TAC.m3.offer(); const ok = TAC.m3.order('take_child', 'button'); return { o, ok, child:TAC.m3.child().state, obi:TAC.m3.obi().state }; });
    ord = (await L.ev(h, 'order')).map(e => e[1]);
    h.log('quiet, unaware', JSON.stringify(rq), JSON.stringify(ord));
    h.assert(rq.o && rq.o.order === 'take_child' && rq.o.ok === false && rq.o.why === 'unaware' && !rq.ok && rq.child === 'in', 'TAKE HER OUT shown but refused while he is unaware');
    h.assert(ord.length === 1 && ord[0].ok === false && ord[0].why === 'unaware' && ord[0].order === 'take_child', 'order{take_child, ok:false, why:unaware}');
    const ui = await h.ev(() => { __m3.run(0.2); const w = document.getElementById('ctx-uche-wrap'), c = document.getElementById('tac-uche');
      return { wrap:!!(w && w.classList.contains('show')), chip:!!(c && c.classList.contains('show')), on:document.body.classList.contains('tac-uche-on'), offer:TAC.m3.offer() }; });
    h.log('refused job on screen', JSON.stringify(ui));
    h.assert(ui.offer && ui.offer.ok === false && !ui.wrap && !ui.chip && !ui.on, 'a refused job is not advertised: no UCHE button and no Q · UCHE chip while he is unaware (Q still answers why)');
    await L.restore(h);

    // ---------- the Squad Trust payoff: posted at the back when Obi was stopped (a tackle, force 0) ----------
    await L.v8(h, { state:L.state('squad') });
    const bp = await L.breach(h, { entry:'knock', uche:'rear' });
    const pt = await h.ev(() => { const R = TAC.m3.run(); __m3.run(8, () => !!R.obi.outcome); return { outcome:R.obi.outcome, posted:R.uche.postedAtStop, force:S.game.forceUsed }; });
    h.assert(pt.outcome === 'tackled' && pt.posted && pt.force === bp.after.force, 'posted at the back when he was stopped (tackled, force 0)');
    await h.ev(() => { const o = TAC.m3.run().M.obi.position; ENGINE.player.position.x = o.x; ENGINE.player.position.z = o.z + 1.2; });
    await L.arrest(h, 0);
    await L.childTalk(h, 0);
    await h.ev(() => __m3.run(10, () => TAC.m3.child().state === 'out'));
    const p0 = await h.ev(() => ({ arrests:S.game.arrests, intel:S.game.intelScore }));
    const ex = await L.extract(h, 2200, { again:400 });   // a second press inside the payoff's 1.5 s delay
    const p1 = await h.ev(() => ({ arrests:S.game.arrests, intel:S.game.intelScore }));
    h.log('payoff', JSON.stringify(ex), JSON.stringify(p0), JSON.stringify(p1));
    h.assert(ex.done && ex.toasts.some(t => t[0] === 'UCHE AT THE BACK'), 'the Squad Trust payoff is paid (posted at the stop)');
    h.assert(p1.arrests - p0.arrests === 1 && p1.intel - p0.intel >= 6, '+1 arrest and +6 intel');
    h.assert(ex.cm === 1 && ex.am === 1, 'Extract pressed twice inside the 1.5 s delay: the operation completes once (completeMission ' + ex.cm + ', showAftermath ' + ex.am + ')');
    await L.restore(h);
    // ... and not when Uche had left his post for the child before Obi was stopped
    await L.v8(h, { state:L.state('squad', 'tip') });
    await L.breach(h, { entry:'knock', uche:'rear' });
    const np = await h.ev(() => { __m3.run(0.1); const ok = TAC.m3.order('take_child', 'button'); const R = TAC.m3.run(); __m3.run(14, () => !!R.obi.outcome && R.child.state === 'out');
      return { ok, outcome:R.obi.outcome, posted:R.uche.postedAtStop, child:R.child.state }; });
    h.log('no payoff', JSON.stringify(np));
    h.assert(np.ok && np.posted === false && np.outcome && np.child === 'out', 'Uche left his post for the child before Obi was stopped');
    await h.ev(() => { const o = TAC.m3.run().M.obi; ENGINE.player.position.x = o.position.x; ENGINE.player.position.z = o.position.z + 1.2; });
    await L.arrest(h, 0);
    const ex2 = await L.extract(h, 2200);
    h.log('no payoff extract', JSON.stringify(ex2));
    h.assert(ex2.done && !ex2.toasts.some(t => /UCHE AT THE BACK/.test(t[0])), 'no Squad Trust payoff when he was not posted at the stop');
    await L.restore(h);

    // ---------- TAKE HER OUT overtaken: Kelechi takes her hand before Uche gets to her ----------
    await L.v8(h, { state:L.state('tip') });
    await L.breach(h, { entry:'loud' });
    await h.ev(() => { __m3.walk([[0.35,4.6],[0.5,2.6],[2.3,0.4]], 5.2, { sprint:true, max:3 }); });
    const ga = await L.arrest(h, 0);
    const to = await h.ev(() => { const ok = TAC.m3.order('take_child', 'button'); return { ok, job:TAC.m3.uche().job }; });
    await L.childTalk(h, 0);
    const oc = await h.ev(() => { const R = TAC.m3.run(); __m3.run(0.3); const job = R.uche.job; __m3.run(12, () => R.child.state === 'out');
      return { job, child:R.child.state, by:R.child.by, choice:R.child.choice, ujob:R.uche.job }; });
    const esc = (await L.ev(h, 'ally_done')).map(e => e[1]).filter(d => d.task === 'escort');
    h.log('escort overtaken', JSON.stringify(ga.arrest), JSON.stringify(to), JSON.stringify(oc), JSON.stringify(esc));
    h.assert(to.ok && to.job === 'take_child', 'TAKE HER OUT ordered after the arrest');
    h.assert(oc.job === null && oc.choice === 'gentle' && oc.child === 'out' && oc.by === 'kelechi', 'Kelechi took her hand first: Uche drops the job, she walks out with Kelechi: ' + JSON.stringify(oc));
    h.assert(esc.length === 1 && esc[0].outcome === 'cancelled' && esc[0].who === 'uche' && typeof esc[0].secs === 'number', 'ally_done{who:uche, task:escort, outcome:cancelled}: ' + JSON.stringify(esc));
    h.assert(!h.errors.length, 'no page errors: ' + h.errors.join(' | '));
  } finally { await L.restore(h); }
};
