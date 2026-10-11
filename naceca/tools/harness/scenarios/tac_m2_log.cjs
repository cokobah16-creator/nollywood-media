// tac_m2_log · M2's telemetry (DESIGN §4; market.md §4): a full M2 played through the scripted helpers — Tunde quiet and
// unseen, Uche posted at the corner, an unseen scan, a cold grab, the table inked, the van — logs exactly one enc m2_tunde,
// one enc m2_kc and one m2_summary with every field present and typed; order and ally_done are there; this layer's toasts
// raise no `blocked`; at most 30 new events, and nothing per tick.
const M = require('./tac_m2_lib.cjs');
const T = M.T;
const READY = S => {
  S.game.evidence = [{ id:'co_madam', name:'phone' }, { id:'phishing_template', name:'template' }, { id:'kc_sims', name:'sims' }];
  S.game.flags.kc_statement = true;
};
const NEW = ['enc', 'order', 'ally_done', 'm2_summary', 'seen', 'evaded', 'radio'];
const typeOf = v => v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v;

module.exports = async h => {
  await M.boot(h, { seed:51, state:READY });
  await T.capture(h);
  // Tunde, on the stall side: unseen, the quiet choice (the route tip)
  await M.tunde(h, { at:[-8, -2], choice:0 });
  // Uche: the back-lane corner
  await h.ev(() => { const P = ENGINE.player.position; P.x = -3.6; P.z = 11.6; TAC.player._reset(); tryInteract(); });
  await T.finishDialogue(h); await T.choose(h, 0); await T.finishDialogue(h);
  // nothing happens for 16 s (Uche jogs to the corner): nothing per tick
  const quiet = await h.ev(() => { const n0 = __tacEv.length; __wf.run(16); return { n:__tacEv.length - n0, types:__tacEv.slice(n0).map(e => e[0]), arrived:TAC.m2.uche().arrived }; });
  h.log('16 s at the van', JSON.stringify(quiet));
  h.assert(quiet.arrived && quiet.n <= 3, 'nothing per tick: 16 s of play log only Uche\'s arrival (' + quiet.n + ' events: ' + quiet.types.join(',') + ')');
  // round the south end, crouched, up beside him; lift the phone head-down; take him cold
  const w = await T.walk(h, [[-4.5, 9], [-4.5, -6], [2, -6], [7.4, -2.6], [7.5, 2.1]], { speed:1.25, crouch:true });
  h.assert(w.reached, 'the walk round the south end reaches his side: ' + JSON.stringify(w));
  await M.scan(h, { at:[7.5, 2.1], phase:'phone' });
  await h.ev(() => { __wf.run(1.2); tryInteract(); });
  const cold = await h.ev(() => ({ how:S.game.flags.m2_how, key:DLG.scriptKey }));
  h.assert(cold.how === 'cold' && cold.key === 'market_runner', 'the cold grab: ' + JSON.stringify(cold));
  await T.finishDialogue(h); await T.choose(h, 0); await T.finishDialogue(h);
  // the table, then the van
  const van = await h.ev(async () => {
    // one link at a time, as board_van files them, until three hold
    for (const [a, b] of [['s_kc', 'l_market'], ['s_obi', 'l_market'], ['e_kcsims', 's_mama'], ['e_kcsims', 's_kc'], ['s_mama', 'l_market'], ['e_template', 's_kc']]) {
      if (V12.ops().inked.length >= 3) break;
      V12.pencil(a, b); V12.fileLinks();
    }
    V12.closeOps();
    showOverlay(null); ENGINE.movementEnabled = true;
    const v = ENGINE.interactables.find(i => /^Board NACECA van/.test(i.label || ''));
    v.onInteract(v);
    await new Promise(r => setTimeout(r, 400));
    return { done:S.game.completedMissions.includes('m2'), cur:S.game.currentMission, mr:S.game.moralChoices.market_runner, inked:V12.ops().inked.length, strikes:V12.caseStrikes('lagos'), toast:document.getElementById('toast').textContent, ev:S.game.evidence.map(e => e.id) };
  });
  h.log('van', JSON.stringify(van));
  h.assert(van.done, 'M2 completes through the van');
  const ev = await T.events(h);
  const of = t => ev.filter(e => e[0] === t), enc = k => ev.filter(e => e[0] === 'enc' && e[1].enc === k);
  h.log('types', JSON.stringify(ev.reduce((m, e) => (m[e[0]] = (m[e[0]] || 0) + 1, m), {})));
  // ---- exactly one of each, every field typed ----
  h.assert(enc('m2_tunde').length === 1 && enc('m2_kc').length === 1 && of('m2_summary').length === 1, 'one enc m2_tunde, one enc m2_kc, one m2_summary');
  const tu = enc('m2_tunde')[0][1], kc = enc('m2_kc')[0][1], sm = of('m2_summary')[0][1];
  h.log('m2_tunde', JSON.stringify(tu)); h.log('m2_kc', JSON.stringify(kc)); h.log('m2_summary', JSON.stringify(sm));
  const want = (obj, spec, where) => { for (const [k, t] of Object.entries(spec)) { const ty = typeOf(obj[k]); h.assert(t.split('|').includes(ty), `${where}.${k} is ${t} (got ${ty}: ${JSON.stringify(obj[k])})`); } };
  want(tu, { side:'string', seen:'boolean', dist:'number', ang:'number', bark:'boolean', choice:'string|null', tip:'boolean', habit:'boolean', wary:'boolean' }, 'enc m2_tunde');
  h.assert(tu.side === 'stall' && tu.seen === false && tu.choice === 'quiet' && tu.tip && tu.habit && !tu.wary, 'enc m2_tunde values');
  want(kc, { approach:'string', intent:'string', wary:'boolean', susp:'number', level:'string', exposed:'boolean', gap:'number', scanSeen:'boolean', side:'string', outcome:'string', how:'string',
    secs:'number', bumps:'number', bumpsLane:'number', trust:'number', cutReached:'boolean', ribbon:'string', prep:'object', uche:'object' }, 'enc m2_kc');
  want(kc.prep, { tip:'boolean', habit:'boolean', post:'string', posted:'boolean', pursuit:'boolean', tier:'number', greyman:'boolean', sources:'boolean' }, 'enc m2_kc.prep');
  want(kc.uche, { post:'string', arrived:'boolean', role:'string|null' }, 'enc m2_kc.uche');
  h.assert(kc.approach === 'cold' && kc.intent === 'stealth' && kc.how === 'cold' && kc.outcome === 'caught' && kc.side === 'side' && kc.ribbon === 'off' && kc.trust === 2, 'enc m2_kc values');
  h.assert(kc.prep.tip && kc.prep.post === 'corner' && kc.prep.posted && kc.uche.arrived, 'enc m2_kc.prep / uche');
  want(sm, { kc:'string', how:'string', approach:'string', scanSeen:'boolean', alarms:'number', notices:'number', suspPeak:'number', eyeSecs:'number', crouchNearSecs:'number', watchSecs:'number',
    tunde:'object', post:'string', posted:'boolean', ucheArrived:'boolean', ucheRole:'string|null', chase:'object', trust:'number', secs:'number', caps:'object', diff:'object', hints:'array',
    build:'string|null', intent:'string', wary:'boolean', ribbon:'string' }, 'm2_summary');
  want(sm.tunde, { side:'string', seen:'boolean', choice:'string|null', tip:'boolean', habit:'boolean' }, 'm2_summary.tunde');
  want(sm.chase, { secs:'number', bumps:'number', bumpsLane:'number', trust:'number', cutsShown:'number', cutReached:'boolean', cutoff:'boolean', ribbon:'string' }, 'm2_summary.chase');
  want(sm.caps, { pursuit:'boolean', greyman:'boolean', sources:'boolean', tier:'number' }, 'm2_summary.caps');
  want(sm.diff, { casework:'string', pace:'string' }, 'm2_summary.diff');
  h.assert(sm.kc === 'caught' && sm.how === 'cold' && sm.approach === 'cold' && sm.post === 'corner' && sm.crouchNearSecs >= 2 && sm.watchSecs > 10 && sm.trust >= 2, 'm2_summary values');
  // ---- order and ally_done ----
  const ord = of('order'), al = of('ally_done');
  h.assert(ord.length === 1 && ord[0][1].who === 'uche' && ord[0][1].order === 'post' && ord[0][1].post === 'corner' && ord[0][1].src === 'talk' && ord[0][1].ok === true && ord[0][1].def === false
    && typeof ord[0][1].t === 'number' && 'obj' in ord[0][1], 'order{who, order:post, post, prev, withTip, src, ok, def:false, obj, t}');
  h.assert(al.length >= 1 && al[0][1].task === 'arrive' && al[0][1].outcome === 'done' && typeof al[0][1].secs === 'number', 'ally_done{arrive}');
  // ---- no blocked from this layer; the volume ----
  const mine = /^(SGT\. UCHE|HE SAW YOU|CAUGHT COLD|CUT HIM OFF|BOXED IN|UCHE HAS HIM|HE'S RUNNING|BYSTANDER DOWN)$/;
  h.assert(!of('blocked').some(e => mine.test(e[1].big)), 'no blocked raised by this layer\'s toasts');
  const fresh = ev.filter(e => NEW.includes(e[0]));
  h.log('new events', fresh.length, JSON.stringify(fresh.map(e => e[0] + (e[1].enc ? ':' + e[1].enc : e[1].task ? ':' + e[1].task : ''))));
  h.assert(fresh.length <= 30, 'at most 30 new events in a full M2: ' + fresh.length);
  h.assert(!ev.some(e => e[0] === 'chase' || e[0] === 'chase_end'), 'a cold grab logs no chase');

  // ---- a chase run: c.how / c.by are set before onCaught, and enc m2_kc carries them ----
  await M.boot(h, { seed:52 });
  await T.capture(h);
  const ch = await h.ev(() => { S.game._marketTunde = true; S.game._marketScanned = true; const P = ENGINE.player.position; P.x = 5.8; P.z = 4.6;
    const it = ENGINE.interactables.find(i => i.label === 'Confront teen suspect'); it.onInteract(it);
    const c = CHASE.active; window.__stamp = null; const oc = c.onCaught; c.onCaught = function(){ window.__stamp = { how:c.how, by:c.by }; return oc.apply(this, arguments); };
    return true;
  });
  const r2 = await h.ev(() => Object.assign(__m2.pursue({ strategy:'follow', delay:1.3 }), { stamp:window.__stamp }));
  const ev2 = await T.events(h);
  const kc2 = ev2.filter(e => e[0] === 'enc' && e[1].enc === 'm2_kc');
  h.log('chase run', JSON.stringify(r2), JSON.stringify(kc2.map(e => [e[1].how, e[1].approach, e[1].secs, e[1].bumps])));
  h.assert(r2.caught && kc2.length === 1 && kc2[0][1].how === r2.how && typeof kc2[0][1].secs === 'number' && kc2[0][1].secs > 1, 'a chase: one enc m2_kc with how ' + r2.how);
  h.assert(ev2.filter(e => e[0] === 'chase_end').length === 1, 'and one chase_end');
  h.assert(r2.stamp && ['tackle', 'cutoff'].includes(r2.stamp.how) && r2.stamp.by === 'player', 'c.how and c.by are set before c.onCaught: ' + JSON.stringify(r2.stamp));
  // ---- an escape: c.how 'escaped' before onEscaped; enc m2_kc outcome escaped; m2_how escaped ----
  await M.boot(h, { seed:53 });
  await T.capture(h);
  const esc = await h.ev(() => { S.game._marketTunde = true; S.game._marketScanned = true; const P = ENGINE.player.position; P.x = 5.8; P.z = 4.6;
    const it = ENGINE.interactables.find(i => i.label === 'Confront teen suspect'); it.onInteract(it);
    const c = CHASE.active; window.__stamp = null; const oe = c.onEscaped; c.onEscaped = function(){ window.__stamp = { how:c.how, by:c.by }; return oe.apply(this, arguments); };
    __wf.run(25, () => { P.x = -20; P.z = 20; if (!CHASE.active) return true; });
    return { stamp:window.__stamp, how:S.game.flags.m2_how, vis:ENGINE._marketKC.visible };
  });
  const ev3 = (await T.events(h)).filter(e => e[0] === 'enc' && e[1].enc === 'm2_kc');
  h.log('escape', JSON.stringify(esc), JSON.stringify(ev3.map(e => [e[1].outcome, e[1].how])));
  h.assert(esc.stamp && esc.stamp.how === 'escaped' && esc.how === 'escaped' && !esc.vis && ev3.length === 1 && ev3[0][1].outcome === 'escaped' && ev3[0][1].how === 'escaped', 'an escape: how escaped, one enc m2_kc');
  h.assert(!h.errors.length, 'no page errors: ' + h.errors.join(' | '));
};
