// tac_m3_plan: the plan and the spoken briefing tell the truth (DESIGN §2.3 C-M3, C-M4, C-M9; mansion.md §1.1).
// The quiet label (front door / KC's side gate), the wipe line per entry ("from the knock", "from the bang",
// "once he knows you are inside. None if you reach him first"; no "you'll have to find the laptop"), the power-cut
// and rear sentences, the SIM theory's facing tick (BLIND SIDE only for a Recruit), no WORD IS OUT row, the
// decoration surviving six redraws, A.audit clean, the rewritten briefing lines, GO's reputation exactly today's
// (knock signed 0; quiet +3 +2; loud +5 +2) and no false LAPTOP WIPE RUNNING toast.
// Owner: Team C.
const L = require('./tac_m3_lib.cjs');
const A = require('./v13_a_lib.cjs');

const openPlan = async h => {
  await h.ev(() => { if (!V12.accused('lagos')) CW.autofile('lagos'); });
  await h.ev(() => { const it = ENGINE.interactables.find(i => /^Plan the raid/.test(i.label || '')); ENGINE.player.position.x = 1.0; ENGINE.player.position.z = 7.6; it.onInteract(it); });
  await h.step(250);
  return (await L.shown(h)).includes('screen-plan');
};
const read = h => h.ev(() => {
  const ov = document.getElementById('screen-plan'), pred = ov.querySelector('.plan-pred');
  return { quiet:(ov.querySelector('[data-k="entry"][data-v="quiet"]') || {}).textContent, lines:[...pred.children].filter(d => d.tagName === 'DIV').map(d => d.textContent),
    text:ov.textContent, face:!!ov.querySelector('.plan-svg .tac-face'), blind:!!ov.querySelector('.plan-svg .tac-blind'), leak:!!ov.querySelector('.tac-leak') };
});
const click = (h, k, v) => h.ev(({ k, v }) => { const b = document.querySelector(`#screen-plan [data-k="${k}"][data-v="${v}"]`); if (b && !b.disabled) b.click(); return !!b; }, { k, v });

module.exports = async h => {
  try {
    // ---------- no KC, no Squad Trust, Senior: the front-door labels and lines ----------
    await L.v8(h, { sims:true });
    h.assert(await openPlan(h), 'the plan opens from Uche');
    let p = await read(h);
    h.log('default plan', JSON.stringify(p.lines), p.quiet);
    h.assert(p.quiet === 'Quiet, front door', 'the quiet button reads "Quiet, front door" without KC: ' + p.quiet);
    const ST = ' · you go straight to the study';     // the SIM theory places the laptop (+15 s)
    h.assert(p.lines[0] === 'Wipe clock about 70 s from the knock' + ST, 'knock: "Wipe clock about N s from the knock": ' + p.lines[0]);
    h.assert(!/find the laptop/i.test(p.text), 'the "find the laptop" phrase is gone');
    h.assert(p.face && !p.blind, 'SIM theory, Senior: the facing tick on the study dot, no BLIND SIDE words');
    h.assert(!p.leak && !/WORD IS OUT/.test(p.text), 'no WORD IS OUT row (the leak is off)');
    // six redraws: the decoration comes back after every draw()
    const Q = ' once he knows you are inside. None if you reach him first';
    const seq = [['entry', 'loud', 'Wipe clock about 55 s from the bang' + ST, false], ['power', 'cut', 'Wipe clock about 67 s from the bang' + ST, true],
      ['entry', 'quiet', 'Wipe clock about 92 s' + Q + ST, true], ['power', 'leave', 'Wipe clock about 80 s' + Q + ST, false],
      ['entry', 'knock', 'Wipe clock about 70 s from the knock' + ST, false], ['power', 'cut', 'Wipe clock about 82 s from the knock' + ST, true]];
    for (const [k, v, want, cut] of seq) {
      await click(h, k, v); await h.step(30);
      p = await read(h);
      h.log('after', k, v, JSON.stringify(p.lines));
      h.assert(p.lines[0] === want, `redraw ${k}=${v}: the wipe line "${p.lines[0]}" (want "${want}")`);
      h.assert(p.quiet === 'Quiet, front door' && p.face && !/find the laptop/i.test(p.text), `redraw ${k}=${v}: the label and the tick survive`);
      const dark = p.lines.find(l => /^Dark house/.test(l));
      if (cut) h.assert(dark === 'Dark house: he sees half as far, and with the Wi-Fi down his wipe runs about 12 s longer.', 'the power-cut sentence: ' + dark);
      else h.assert(!dark, 'no power-cut sentence with the power left on');
      h.assert(!p.text.includes('The child wakes frightened'), 'the promise that the child wakes frightened is gone');
    }
    // the paper rules on the plan sheet (v13_a_lib)
    const au = await A.lib(h).audit('#screen-plan');
    h.log('audit', JSON.stringify(au));
    h.assert(au.roots >= 1 && !au.effects.length && !au.glyphs.length && !au.colours.length && !au.aks.length && !au.overflow, 'A.audit clean on #screen-plan: ' + JSON.stringify(au));
    if (au.targets.length || au.contrast.length) h.log('(audit notes)', JSON.stringify({ targets:au.targets, contrast:au.contrast }));
    // GO with knock + cut (Agency: knock −2, the signed plan credit +2 = 0); the briefing has no quiet line to rewrite
    await click(h, 'entry', 'knock');
    const before = await h.ev(() => Object.assign({}, S.player.reputation));
    await h.ev(() => document.getElementById('plan-go').click()); await h.step(150);
    const go = await h.ev(() => ({ r:Object.assign({}, S.player.reputation), lines:DIALOGUE.mansion_pre_breach.map(l => l.text) }));
    h.log('knock GO', JSON.stringify(go));
    h.assert(go.r.agencyFavour - before.agencyFavour === 0 && go.r.integrity - before.integrity === 6 && go.r.publicTrust - before.publicTrust === 5 - 2,
      'knock (signed, cut): Agency 0, Integrity +6, Public Trust +5 −2 — exactly today\'s: ' + JSON.stringify({ a:go.r.agencyFavour - before.agencyFavour, i:go.r.integrity - before.integrity, t:go.r.publicTrust - before.publicTrust }));
    await L.finishDialogue(h); await h.step(2300);
    const t1 = await L.toasts(h);
    h.assert(!t1.some(t => /LAPTOP WIPE RUNNING/.test(t[0])), 'no LAPTOP WIPE RUNNING toast at the breach: ' + JSON.stringify(t1));
    await L.restore(h);

    // ---------- quiet front: the spoken briefing; Agency +3 +2 ----------
    await L.v8(h, { state:L.state('squad', 'recruit'), sims:true });
    h.assert(await openPlan(h), 'the plan opens (Squad Trust, Recruit)');
    await click(h, 'entry', 'quiet'); await click(h, 'uche', 'rear'); await h.step(30);
    p = await read(h);
    h.log('quiet + rear', JSON.stringify(p.lines));
    h.assert(p.lines.includes('Uche waits inside the kitchen door. If Obi runs for it, he runs into Uche.'), 'the rear sentence (Squad Trust)');
    h.assert(p.face && p.blind, 'SIM theory, Recruit: the tick and the BLIND SIDE words');
    const b2 = await h.ev(() => Object.assign({}, S.player.reputation));
    await h.ev(() => document.getElementById('plan-go').click()); await h.step(150);
    const q = await h.ev(() => ({ r:Object.assign({}, S.player.reputation), lines:DIALOGUE.mansion_pre_breach.map(l => [l.speaker, l.text]) }));
    h.log('quiet GO', JSON.stringify(q));
    h.assert(q.r.agencyFavour - b2.agencyFavour === 5 && q.r.integrity - b2.integrity === 2 && q.r.publicTrust - b2.publicTrust === 2, 'quiet: Agency +3 +2, Integrity +2, Trust +2');
    h.assert(q.lines.some(([s, t]) => /KELECHI/.test(s) && t === 'Quiet. Front door, and nobody runs.'), "Kelechi's quiet line: 'Quiet. Front door, and nobody runs.'");
    h.assert(q.lines.some(([s, t]) => t === "I'll be inside the kitchen door. Anyone who runs, runs into me."), "Uche's rear line: inside the kitchen door");
    h.assert(!q.lines.some(([, t]) => /side door|back wall/.test(t)), 'no "side door" and no "back wall" left in the briefing');
    // the briefing on screen is the rewritten one
    await h.step(100);
    let seen = [];
    for (let i = 0; i < 12; i++) {
      const s = await h.ev(() => { if (!document.querySelector('#screen-dialogue.show')) return null; if (typeof skipTypewriter === 'function') skipTypewriter(); const t = document.getElementById('dlg-text').textContent; advanceDialogue(); return t; });
      if (s == null) break; seen.push(s); await h.step(40);
    }
    h.assert(seen.includes('Quiet. Front door, and nobody runs.'), 'the briefing that plays says "Quiet. Front door, and nobody runs.": ' + JSON.stringify(seen));
    await h.step(2300);
    const t2 = await L.toasts(h);
    h.assert(!t2.some(t => /LAPTOP WIPE RUNNING/.test(t[0])), 'quiet: no false LAPTOP WIPE RUNNING toast: ' + JSON.stringify(t2));
    await L.restore(h);

    // ---------- KC fair: "Side gate, quiet"; the gate line; loud: Agency +5 +2 ----------
    await L.v8(h, { state:L.state('kcFair') });
    h.assert(await openPlan(h), 'the plan opens (KC fair)');
    p = await read(h);
    h.assert(p.quiet === 'Side gate, quiet', 'with KC\'s gate the quiet button reads "Side gate, quiet": ' + p.quiet);
    h.assert(/^Wipe clock about 95 s once he knows you are inside\. None if you reach him first · you go straight to the study$/.test(p.lines[0]), 'the gate wipe line (80 + 15, the laptop known from KC): ' + p.lines[0]);
    await click(h, 'entry', 'loud'); await h.step(30);
    p = await read(h);
    h.assert(/^Wipe clock about 55 s from the bang · you go straight to the study$/.test(p.lines[0]), 'loud with the laptop known: ' + p.lines[0]);
    const b3 = await h.ev(() => Object.assign({}, S.player.reputation));
    await h.ev(() => document.getElementById('plan-go').click()); await h.step(150);
    const l3 = await h.ev(() => Object.assign({}, S.player.reputation));
    h.assert(l3.agencyFavour - b3.agencyFavour === 7 && l3.integrity - b3.integrity === -4 && l3.publicTrust - b3.publicTrust === -4, 'loud: Agency +5 +2, Integrity −4, Trust −4');
    await L.finishDialogue(h); await h.step(150);
    await L.restore(h);
    // ---------- nothing known: the laptop's room unknown, and still no "find the laptop" ----------
    await L.v8(h);
    h.assert(await openPlan(h), 'the plan opens (nothing known)');
    p = await read(h);
    h.log('nothing known', JSON.stringify(p.lines));
    h.assert(p.lines[0] === 'Wipe clock about 55 s from the knock', 'knock, laptop unknown: "Wipe clock about 55 s from the knock": ' + p.lines[0]);
    h.assert(!/find the laptop/i.test(p.text) && !p.face, 'no "find the laptop"; no SIM theory, no facing tick');
    await h.ev(() => showOverlay(null));
    await L.restore(h);
    await L.v8(h, { state:L.state('kcFair') });
    h.assert(await openPlan(h), 'the plan opens again (KC fair)');
    await h.ev(() => document.getElementById('plan-go').click()); await h.step(150);
    const g = await h.ev(() => DIALOGUE.mansion_pre_breach.map(l => l.text));
    h.assert(g.includes('Quiet. Side gate, then the kitchen door.'), "the gate line: 'Quiet. Side gate, then the kitchen door.' " + JSON.stringify(g));
    await L.finishDialogue(h); await h.step(150);
    h.assert(!h.errors.length, 'no page errors: ' + h.errors.join(' | '));
  } finally { await L.restore(h); }
};
