// tac_m3_child: the child is a real rescue (DESIGN §2.3 C-M5/C-M6; mansion.md §1.6, §1.8). "Stay put" leaves her inside:
// o5 open, her label 'Walk her out', the tracker on the laptop (o4) and then on her (o5), the extraction refused with
// the exact text, +1 rescued exactly once when she is out. The gentle choice: +1 once, none extra at extraction even
// with the civilians known (the v12_plan.js:192 regression). Uche after "stay put": child_by 'uche' and no child_gentle.
// A replay resets moralChoices.rescued (a stale 1 no longer walks her out after "stay put").
// Owner: Team C.
const L = require('./tac_m3_lib.cjs');

const grab = async h => {
  // loud: grab him in the stun, then the arrest (Read him his rights)
  await h.ev(() => { __m3.walk([[0.35,4.6],[0.5,2.6],[2.3,0.4]], 5.2, { sprint:true, max:3 }); });
  return L.arrest(h, 0);
};
const state = h => h.ev(() => {
  const R = TAC.m3.run(), o5 = S.game.objectives.find(o => o.id === 'o5_civ'), it = ENGINE.interactables.find(i => i.mesh === R.M.child);
  return { child:R.child.state, choice:R.child.choice, o5:!!(o5 && o5.done), civChild:!!S.game._civChild, label:it && it.label, cur:(WAY.current().obj || {}).id,
    civ:S.game.civiliansRescued, gentle:!!S.game.flags.child_gentle, mcGentle:!!S.game.moralChoices.child_gentle, by:S.game.flags.child_by || null };
});

module.exports = async h => {
  try {
    // ---------- stay put → Walk her out ----------
    await L.v8(h);
    await L.breach(h, { entry:'loud' });
    let a = await grab(h);
    h.assert(a.arrest === 'professional', 'Obi arrested in the stun');
    const civ0 = await h.ev(() => S.game.civiliansRescued);
    await L.childTalk(h, 1);
    let s = await state(h);
    h.log('stay put', JSON.stringify(s));
    h.assert(s.child === 'stay' && s.choice === 'stay' && !s.o5 && !s.civChild, '"Tell her to stay put": she stays inside, "Secure the child" stays open');
    h.assert(s.label === 'Walk her out' && s.civ === civ0, "her label becomes 'Walk her out', and nothing is rescued yet");
    h.assert(s.cur === 'o4_wipe', 'the tracker follows the choice: the laptop first (o4): ' + s.cur);
    const pri = await h.ev(() => { const it = ENGINE.interactables.find(i => i.label === 'Walk her out'); ENGINE.player.position.x = it.mesh.position.x + 0.6; ENGINE.player.position.z = it.mesh.position.z;
      return { eff:TAC.interact.eff(it), spent:TAC.interact.isSpent(it), near:(nearestInteractable() || {}).label }; });
    h.assert(pri.eff === 1 && !pri.spent && pri.near === 'Walk her out', "'Walk her out' has priority 1: " + JSON.stringify(pri));
    let ex = await L.extract(h, 300);
    h.log('extract with her inside', JSON.stringify(ex));
    h.assert(!ex.done && ex.toasts.length === 1 && ex.toasts[0][0] === 'OPERATION OPEN' && ex.toasts[0][1] === 'The girl is still inside. Walk her out first', 'the extraction refuses with the exact text');
    // the laptop: the tracker moves on to her once it is done
    await h.ev(() => { S.game._wipeT = 0.3 * S.game._wipeTotal; });
    const lap = await L.laptop(h);
    h.assert(lap.ev && lap.files === 5, 'the laptop halted (30%: 5 files)');
    s = await state(h);
    h.assert(s.cur === 'o5_civ', 'then the tracker is on her (o5): ' + s.cur);
    h.assert((await L.walkOut(h)) === 'ok', "pressed 'Walk her out'");
    const lines = await h.ev(() => (DIALOGUE.tac_m3_walk || []).map(l => [l.speaker, l.text, !!l.choices]));
    h.assert(lines.length === 1 && lines[0][0] === 'AGENT KELECHI' && lines[0][1] === 'Come. Hold my hand. We go outside now.' && !lines[0][2], "one line from Kelechi, no choices");
    const walk = await h.ev(() => { const R = TAC.m3.run(); const t = __m3.run(12, () => R.child.state === 'out'); return { t, z:R.M.child.position.z }; });
    s = await state(h);
    h.log('walked out', JSON.stringify(walk), JSON.stringify(s));
    h.assert(s.child === 'out' && s.o5 && s.civChild && s.civ === civ0 + 1 && !s.gentle && s.by === null, 'out past the porch: o5 done, +1 rescued, not gentle');
    const pri2 = await h.ev(() => { const it = ENGINE.interactables.find(i => i.label === 'Walk her out'); return it ? TAC.interact.isSpent(it) : 'gone'; });
    h.assert(pri2 === true || pri2 === 'gone', "'Walk her out' is spent once she is out");
    ex = await L.extract(h, 600);
    h.log('extract', JSON.stringify(ex));
    h.assert(ex.done && ex.civ === civ0 + 1, 'the extraction completes; +1 exactly once (' + ex.civ + ')');
    const ce = (await L.ev(h, 'enc')).filter(e => e[1].enc === 'm3_child').map(e => e[1]);
    h.assert(ce.length === 1 && ce[0].choice === 'stay' && ce[0].by === 'kelechi' && ce[0].gentle === false && typeof ce[0].outAt === 'number', 'enc m3_child{choice:stay, by:kelechi}: ' + JSON.stringify(ce));
    await L.restore(h);

    // ---------- gentle: +1 once, none at extraction, even with the civilians known ----------
    await L.v8(h, { state:L.state('tip') });
    await L.breach(h, { entry:'loud' });
    await grab(h);
    const g0 = await h.ev(() => S.game.civiliansRescued);
    await L.childTalk(h, 0);
    s = await state(h);
    h.assert(s.choice === 'gentle' && s.civ === g0 + 1 && s.gentle && !s.o5, 'gentle: +1 at the choice (util.js:46), o5 still open until she is out');
    await h.ev(() => { const R = TAC.m3.run(); __m3.run(12, () => R.child.state === 'out'); });
    s = await state(h);
    h.assert(s.child === 'out' && s.o5 && s.civ === g0 + 1, 'she walks out: o5 done, no second rescue');
    ex = await L.extract(h, 600);
    h.log('gentle extract', JSON.stringify(ex));
    h.assert(ex.done && ex.civ === g0 + 1, 'no knowledge-only +1 at extraction (known.civ): ' + ex.civ);
    await L.restore(h);

    // ---------- Uche after "stay put": child_by 'uche', no child_gentle ----------
    await L.v8(h);
    await L.breach(h, { entry:'loud' });
    await grab(h);
    await L.childTalk(h, 1);
    const u = await h.ev(() => { const ok = TAC.m3.order('take_child', 'button'); const R = TAC.m3.run(); __m3.run(25, () => R.child.state === 'out' && !R.uche.job); return { ok, by:R.child.by }; });
    s = await state(h);
    h.log('Uche after stay put', JSON.stringify(u), JSON.stringify(s));
    h.assert(u.ok && s.child === 'out' && u.by === 'uche', 'after "stay put" (she was spoken to) Uche can take her out');
    h.assert(s.by === 'uche' && !s.gentle && !s.mcGentle, "child_by 'uche' and NO child_gentle");
    await L.restore(h);

    // ---------- a replay: a stale moralChoices.rescued no longer walks her out after "stay put" ----------
    await L.v8(h, { state:L.state('S.game.moralChoices.rescued = 1;') });
    const r0 = await h.ev(() => S.game.moralChoices.rescued);
    h.assert(r0 === 0, 'moralChoices.rescued is reset at the build: ' + r0);
    await L.breach(h, { entry:'loud' });
    await grab(h);
    await L.childTalk(h, 1);
    await h.ev(() => __m3.run(3));
    s = await state(h);
    h.assert(s.child === 'stay' && !s.o5, 'after "stay put" she stays, even on a replay');
    h.assert(!h.errors.length, 'no page errors: ' + h.errors.join(' | '));
  } finally { await L.restore(h); }
};
