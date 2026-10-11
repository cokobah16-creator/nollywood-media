// tac_m2_tunde · the Tunde meeting (DESIGN M-M7, M-M8; market.md §1.1-1.2): one sight model (TAC.sight.probe, range 15),
// the road and stall sides of the ring, the bark only when KC could see you, the inserted line (an observation, never an
// instruction), wariness with no spurious evaded, the HE SAW YOU toast, the quiet route tip and its back-gate ring, the loud
// glance, the 1.5 s arrival text, and reputation effects exactly as today.
const M = require('./tac_m2_lib.cjs');
const T = M.T;

const REC = () => {
  window.__rec = { radio:[], toast:[] };
  if (!TAC.radio.say.__rec){ const o = TAC.radio.say; TAC.radio.say = function(sp, tx, op){ __rec.radio.push([sp, tx, op && op.key]); return o.apply(this, arguments); }; TAC.radio.say.__rec = true; }
  if (!window.toast.__rec){ const o = window.toast; window.toast = function(b, s){ __rec.toast.push([b, s]); return o.apply(this, arguments); }; window.toast.__rec = true; }
  if (!window.radioLine.__rec){ const o = window.radioLine; window.radioLine = function(sp, tx){ __rec.radio.push([sp, tx, null]); return o.apply(this, arguments); }; window.radioLine.__rec = true; }
};
const IMPERATIVE = /\b(make you|don't|do not|stand out|go round|move to|come at|get out|stay back|stay out)\b/i;

module.exports = async h => {
  const meet = async (at, choice) => {
    await M.boot(h, { seed:9 });
    await h.ev(`(${REC.toString()})()`);
    await T.capture(h);
    const pre = await h.ev(at => {
      const P = ENGINE.player.position; P.x = at[0]; P.z = at[1]; TAC.player._reset();
      const pr = TAC.sight.probe('kc', at[0], at[1], { gait:'still', range:15 });
      // Tunde's own body on the line from KC's eye
      const K = ENGINE._marketKC.position, Tn = ENGINE.interactables.find(i => i.label === 'Speak with Informant Tunde').mesh.position;
      const dx = at[0] - K.x, dz = at[1] - K.z, L2 = dx * dx + dz * dz, t = ((Tn.x - K.x) * dx + (Tn.z - K.z) * dz) / L2;
      const body = t > 0 && t < 1 && Math.abs((Tn.x - K.x) * dz - (Tn.z - K.z) * dx) / Math.sqrt(L2) < 0.3;
      return { seen:pr.seen && !body, probe:pr.seen, body, dist:pr.dist, ang:pr.angle, rep:Object.assign({}, S.player.reputation) };
    }, at);
    await h.ev(() => startDialogue('market_intro'));
    const d = await M.dlg(h);
    const r = await T.finishDialogue(h);
    if (r === 'choice') { await T.choose(h, choice); }
    const after = await M.dlg(h);
    await T.finishDialogue(h);
    const st = await M.state(h);
    const out = await h.ev(() => ({ flags:JSON.parse(JSON.stringify(S.game.flags)), tunde:!!S.game._marketTunde, o1:(S.game.objectives.find(o => o.id === 'o1_tunde') || {}).done,
      rep:Object.assign({}, S.player.reputation), gatePoi:MINIMAP.pois.some(p => p.color === '#6b6b63'), toasts:__rec.toast.slice(), radio:__rec.radio.slice(),
      tu:(({ mesh, ...x }) => x)(TAC.m2.run().tunde) }));
    const ev = await T.events(h);
    return { pre, d, after, st, out, ev };
  };
  const rep = (a, b) => ({ integrity:b.integrity - a.integrity, publicTrust:b.publicTrust - a.publicTrust, agencyFavour:b.agencyFavour - a.agencyFavour });
  const CANON0 = /that one in the orange shirt/, CANON1 = /He doesn't know I clocked him/;

  // ---- the road side: E (−4, −2) and N (−6, 0); the stall side: W (−8, −2) and S (−6, −4) ----
  const ring = { E:[-4, -2], N:[-6, 0], W:[-8, -2], S:[-6, -4] };
  const res = {};
  for (const [k, at] of Object.entries(ring)) {
    const r = res[k] = await meet(at, k === 'E' ? 1 : 0);
    const lines = r.d.lines.map(l => l[1]);
    h.log(k, JSON.stringify({ at, pre:r.pre, side:r.out.tu.side, seen:r.out.tu.seen, lines:lines.length, st:r.st, met:r.out.flags.m2_met }));
    h.assert(r.out.tu.tested, k + ': within 3.0 m of Tunde the meeting is tested');
    h.assert(r.out.tu.seen === r.pre.seen, k + ': one model: the meeting verdict equals probe(…, {range:15}).seen and Tunde\'s body');
    h.assert(lines.length === 3 && CANON0.test(lines[0]) && CANON1.test(lines[2]), k + ': canon line 1, the inserted line, canon line 2');
    if (r.pre.seen) {
      h.assert(/^He dey look this way, oga! E don see us\./.test(lines[1]) && /^He's looking this way, sir! He's seen us\./.test(r.d.lines[1][2]), k + ': the "he\'s seen us" observation');
      h.assert(r.out.tu.wary && r.st.wary, k + ': seen at the meeting: KC is wary for the rest of the run');
      h.assert(r.st.susp >= 39 && r.st.level === 'notice', k + ': reset to 40 (notice) at the end: ' + r.st.susp);
      h.assert(r.out.toasts.some(t => t[0] === 'HE SAW YOU' && t[1] === "He saw you talking to Tunde in the road. He'll be watching."), k + ': the HE SAW YOU toast');
      const seen = r.ev.filter(e => e[0] === 'seen' && e[1].cause === 'tunde');
      h.assert(seen.length === 1 && /He saw you talking to Tunde in the road/.test(seen[0][1].why), k + ': one seen{cause:"tunde"}');
    } else {
      h.assert(/^That boy dey watch the road\./.test(lines[1]) && /never looks behind his stand/.test(r.d.lines[1][2]), k + ': the habit fact');
      h.assert(!r.out.tu.wary && !r.st.wary && r.st.susp <= (k === 'E' ? 20 : 0), k + ': unseen: not wary');
      h.assert(r.out.flags.m2_met && r.out.flags.m2_met.habit === true, k + ': m2_met.habit');
    }
    h.assert(!IMPERATIVE.test(lines[1]) && !IMPERATIVE.test(r.d.lines[1][2] || ''), k + ': the inserted line is an observation, not an instruction');
    h.assert(r.out.tunde && r.out.o1 === true, k + ': _marketTunde set and o1_tunde done, as today');
    const enc = r.ev.filter(e => e[0] === 'enc' && e[1].enc === 'm2_tunde');
    h.assert(enc.length === 1, k + ': one enc m2_tunde');
    const E = enc[0][1];
    h.assert(['road', 'stall', 'far'].includes(E.side) && typeof E.seen === 'boolean' && typeof E.dist === 'number' && typeof E.ang === 'number' && typeof E.bark === 'boolean'
      && ['quiet', 'loud', null].includes(E.choice) && typeof E.tip === 'boolean' && typeof E.habit === 'boolean' && typeof E.wary === 'boolean', k + ': enc m2_tunde fields typed ' + JSON.stringify(E));
  }
  h.assert(res.E.out.tu.side === 'road' && res.N.out.tu.side === 'road' && res.W.out.tu.side === 'stall' && res.S.out.tu.side === 'stall', 'E and N are the road side, W and S the stall side');
  h.assert(res.E.pre.seen && !res.W.pre.seen && !res.S.pre.seen, 'KC can see the road side (E) and not the stall side (W, S)');
  h.assert(res.E.out.flags.m2_met.seen === true && res.W.out.flags.m2_met.seen === false, 'm2_met.seen written once at the end');
  // no spurious evaded after the meeting's reset: run the drain out
  const drain = await (async () => { await M.boot(h, { seed:9 }); await T.capture(h); await M.tunde(h, { at:[-4, -2], choice:0 });
    await h.ev(() => { const P = ENGINE.player.position; P.x = -20; P.z = -20; TAC.player._reset(); __wf.run(12); });
    return { st:await M.state(h), ev:(await T.events(h)).filter(e => e[0] === 'evaded') }; })();
  h.log('drain', JSON.stringify(drain.st), drain.ev.length);
  h.assert(drain.st.susp === 0 && drain.st.wary && drain.ev.length === 0, 'the meeting reset drains with no evaded; KC stays wary');

  // ---- the choices: the quiet line, the route and the back-gate ring; the loud line and the glance; reputation as today ----
  const q = res.W, l = res.E;
  h.assert(q.after && /lane behind im stall, cut through the second gap, then make for the back gate\. Okada dey park for front of am\./.test(q.after.lines[0][1])
    && /There's an okada parked across it\./.test(q.after.lines[0][2]), 'quiet: the route tip (the okada, not a chain)');
  h.assert(q.out.flags.m2_tunde === 'quiet' && q.out.gatePoi && q.out.flags.m2_met.tip === true, 'quiet: m2_tunde quiet, the back gate ringed (#6b6b63)');
  h.assert(l.after && /you wan make dem kill me/.test(l.after.lines[0][1]) && l.out.flags.m2_tunde === 'loud' && !l.out.gatePoi, 'loud: the loud line, no route, no ring');
  h.assert(l.st.susp >= 20, 'loud: KC looks up (susp ≥ 20): ' + l.st.susp);
  const rq = rep(q.pre.rep, q.out.rep), rl = rep(l.pre.rep, l.out.rep);
  h.log('reputation', JSON.stringify({ rq, rl }));
  h.assert(rq.integrity === 4 && rq.publicTrust === 3 && rq.agencyFavour === 0, 'quiet: integrity +4, trust +3 (today)');
  h.assert(rl.integrity === -2 && rl.publicTrust === -4 && rl.agencyFavour === 2, 'loud: agency +2, trust −4, integrity −2 (today)');

  // ---- opened from the spawn: no meeting, the canon two lines ----
  await M.boot(h, { seed:9 });
  await T.capture(h);
  await h.ev(() => startDialogue('market_intro'));
  const far = await M.dlg(h);
  await T.finishDialogue(h); await T.choose(h, 0); await T.finishDialogue(h);
  const farEnc = (await T.events(h, 'enc')).find(e => e[1].enc === 'm2_tunde');
  h.log('far', JSON.stringify(far.lines.map(x => x[1].slice(0, 30))), JSON.stringify(farEnc && farEnc[1]));
  h.assert(far.lines.length === 2 && CANON0.test(far.lines[0][1]) && CANON1.test(far.lines[1][1]), 'from the spawn (9.65 m off Tunde): no meeting test, the canon two lines');
  h.assert(farEnc && farEnc[1].side === 'far' && farEnc[1].seen === false && farEnc[1].habit === false, 'from the spawn: side far');

  // ---- the bark: once, on first coming within 4 m on the exposed side, only when KC could see you ----
  await M.boot(h, { seed:9 });
  await h.ev(`(${REC.toString()})()`);
  const bark = await h.ev(() => {
    const P = ENGINE.player.position, walk = (x0, z0, x1, z1) => { P.x = x0; P.z = z0; TAC.player._reset(); const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 1.55 * 60);
      let k = 0; __wf.run(n / 60 + 0.5, () => { if (k < n){ k++; P.x = x0 + (x1 - x0) * k / n; P.z = z0 + (z1 - z0) * k / n; } }); };
    walk(-6, -9, -6, -4.6);       // the stall side from the south (KC can't see it)
    const stall = __rec.radio.filter(r => r[2] === 'tunde_bark').length;
    walk(1, -2, -3.2, -2);        // the road side from the east
    const road = __rec.radio.filter(r => r[2] === 'tunde_bark');
    walk(3, -2, -3.2, -2);        // out and back in: once per run
    return { stall, road:road.length, again:__rec.radio.filter(r => r[2] === 'tunde_bark').length, text:road[0] && road[0][1], speaker:road[0] && road[0][0] };
  });
  h.log('bark', JSON.stringify(bark));
  h.assert(bark.stall === 0, 'no bark on the stall side');
  h.assert(bark.road === 1 && bark.again === 1 && bark.speaker === 'TUNDE' && bark.text === 'Oga, the boy fit see you for road.', 'the bark once on the road side, as a present-state report');
  const tu = await M.tunde(h, { at:[-4.2, -2], choice:0 });
  const benc = await h.ev(() => TAC.m2.run().tunde.bark);
  h.assert(benc === true, 'enc m2_tunde.bark records it');

  // ---- the 1.5 s arrival text, for everyone; it states no rule ----
  await M.boot(h, { seed:9 });
  await h.ev(`(${REC.toString()})()`);
  const tx = await h.ev(() => { __wf.run(1.4); const a = __rec.radio.length; __wf.run(0.2); return { before:a, lines:__rec.radio.slice() }; });
  h.log('arrival', JSON.stringify(tx));
  h.assert(tx.before === 0 && tx.lines.some(r => r[0] === 'TEXT · TUNDE' && r[1] === "I'm at my spot across the road from him."), 'TEXT · TUNDE: I\'m at my spot across the road from him. (at 1.5 s)');
  // the same text on Recruit; it is a fact, not a hint
  h.assert(!IMPERATIVE.test("I'm at my spot across the road from him."), 'the arrival text states no rule');
  h.assert(!h.errors.length, 'no page errors: ' + h.errors.join(' | '));
};
