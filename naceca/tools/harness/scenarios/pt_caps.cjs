// pt_caps (Team D): the logger's per-type ceilings, coalescing (d.rep) and size guard, from the tactics layer's outer
// V12.log wrapper (src/tactics/tac_pt.js). DESIGN-tactics.md §2.4, §4.
//   node tools/harness/run.cjs tools/harness/scenarios/pt_caps.cjs --html <build>/naceca.html
const P = require('./pt_lib.cjs');
module.exports = async h => {
  await h.ev(() => { localStorage.removeItem('naceca_pt_v1'); });
  await h.start('m2', { completed:['m0', 'm1'] });
  h.assert(await h.ev(() => !!(V12.ptKit && V12.log._tacPt)), 'the playtest kit wraps V12.log');
  await P.clear(h);

  // (a) a frustrated thumb: 30 presses on nothing within 1 s → at most 2 interact_miss whose rep sum to 30
  let t0 = await P.mark(h);
  await h.ev(() => { const p = ENGINE.player.position; p.x = 40; p.z = 40; for(let i = 0; i < 30; i++) tryInteract(); });
  await h.step(1800);
  let ev = await P.all(h);
  let miss = P.of(ev, 'interact_miss', t0);
  h.log('misses', JSON.stringify(miss.map(e => [e.d.near, e.d.why, e.d.rep])));
  h.assert(miss.length >= 1 && miss.length <= 2 && P.reps(miss) === 30, `30 misses → ≤ 2 events with rep summing to 30 (got ${miss.length}, ${P.reps(miss)})`);
  h.assert(miss.every(e => !('n' in e.d) || e.d.n == null), 'the coalescing count is d.rep, not d.n');

  // (b) a per-frame exception: 200 identical ErrorEvents → js_error reps sum to 200
  t0 = await P.mark(h);
  await h.ev(() => { for(let i = 0; i < 200; i++) window.dispatchEvent(new ErrorEvent('error', { message:'pt_caps boom', filename:'pt_caps.js', lineno:7 })); });
  await h.ev(() => V12.log('pt_caps_mark', {}));     // a different event closes the slot
  ev = await P.all(h);
  const js = P.of(ev, 'js_error', t0).filter(e => e.d.msg === 'pt_caps boom');
  h.log('js_error', JSON.stringify(js.map(e => e.d.rep)));
  h.assert(js.length >= 1 && js.length <= 2 && P.reps(js) === 200, `200 errors → js_error reps sum to 200 (got ${js.length} events, ${P.reps(js)})`);

  // (c) 100 seen → 80 stored; the rest counted, and pt_dropped logged on hidden
  await P.clear(h);
  t0 = await P.mark(h);
  await h.ev(() => { for(let i = 0; i < 100; i++) V12.log('seen', { who:'kc', enc:'m2_kc', level:'notice', cause:'sight', why:'pt caps' }); });
  await h.ev(() => {
    Object.defineProperty(document, 'visibilityState', { configurable:true, get:() => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
    delete document.visibilityState;
  });
  ev = await P.all(h);
  const seen = P.of(ev, 'seen', t0), dr = P.of(ev, 'pt_dropped', t0);
  h.log('seen stored', seen.length, 'dropped', JSON.stringify(dr.map(e => e.d.byType)));
  h.assert(seen.length === 80, '100 seen → 80 stored (got ' + seen.length + ')');
  h.assert(dr.length === 1 && dr[0].d.byType.seen === 20, 'pt_dropped {byType:{seen:20}} after visibilitychange ' + JSON.stringify(dr.map(e => e.d)));
  // only when the counts changed
  await h.ev(() => {
    Object.defineProperty(document, 'visibilityState', { configurable:true, get:() => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
    delete document.visibilityState;
  });
  ev = await P.all(h);
  h.assert(P.of(ev, 'pt_dropped', t0).length === 1, 'no second pt_dropped while the counts are unchanged');

  // (d) the size guard: a 5000-char payload is cut to ≤ 1500 with trunc; 600-char survey answers are kept whole
  await P.clear(h);
  t0 = await P.mark(h);
  const A1 = 'a'.repeat(600), A2 = 'b'.repeat(600);
  await h.ev(([A1, A2]) => {
    V12.log('pt_caps_big', { s:'x'.repeat(5000), arr:Array.from({ length:100 }, (_, i) => i), keep:'short' });
    V12.log('survey', { where:'pt_caps', satisfying:A1, unfair:A2 });
    V12.log('survey', { where:'pt_caps2', satisfying:A1, unfair:A2, extra:'z'.repeat(5000) });
  }, [A1, A2]);
  ev = await P.all(h);
  const big = P.of(ev, 'pt_caps_big', t0)[0];
  h.log('big', P.chars(big), big.d.s.length, big.d.arr.length, big.d.arr[24]);
  h.assert(big && P.chars(big) <= 1500 && big.d.trunc === true, 'a 5000-char event is stored ≤ 1500 chars with trunc:true (' + P.chars(big) + ')');
  h.assert(big.d.s.length <= 200 && big.d.arr.length === 25 && big.d.arr[24] === '+76' && big.d.keep === 'short', 'strings cut to 200, arrays to 24 with a +N marker, short fields kept');
  // D-6: a summary still over the limit after the 200/24 and 60/8 cuts keeps its values: arrays go to 4, then the
  // largest fields are blanked one by one; never only the key names
  const sum = { entry:'loud', door:'front', power:'on', uche:{ orders:[], acts:[] }, spawn:'front',
    obi:{ first:'stunned', alertedBy:'loud', alertedAt:0, outcome:'stun_grab', by:'kelechi', arrest:'professional' },
    seen:{ notices:2, alarms:1, evaded:1, causes:{ sight:1, noise:0, close:0 } }, crouchSecs:12.4, wipe:{ armed:true, outcome:'halted', pct:34, files:5, total:7 },
    child:{ choice:'gentle', out:true, by:'kelechi' }, extract:{ refusals:0, missing:[] }, prep:{ sims:true, kcFair:true, tip:true, tipped:true, warrant:'signed' },
    secs:188, force:0, trust:2, grade:'B', diff:{ casework:'senior', pace:'standard' }, hints:[], build:'pt_caps' };
  for(let i = 0; i < 8; i++){ sum.uche.orders.push({ order:'post', post:i % 2 ? 'back' : 'corner', src:'talk', ok:true, t:12.3 + i, obj:'o6_arrest' });
    sum.uche.acts.push({ task:'cover_held', outcome:'done', secs:3.2, t:44.1 + i, post:'back' }); }
  await h.ev(sum => V12.log('m3_summary', sum), sum);
  ev = await P.all(h);
  const ms = P.of(ev, 'm3_summary', t0)[0];
  h.log('m3_summary', JSON.stringify(sum).length, '→', P.chars(ms), JSON.stringify(ms.d).slice(0, 160));
  h.assert(JSON.stringify(sum).length > 1500 && ms && P.chars(ms) <= 1500 && ms.d.trunc === true, 'an oversized m3_summary is stored ≤ 1500 chars with trunc');
  h.assert(!ms.d.keys && ms.d.entry === 'loud' && ms.d.obi && ms.d.obi.outcome === 'stun_grab' && ms.d.wipe && ms.d.wipe.pct === 34 && ms.d.child && ms.d.child.by === 'kelechi' && ms.d.secs === 188,
    'it keeps its values (entry, obi, wipe, child, secs), not just the key names');
  h.assert(ms.d.uche && ms.d.uche.orders.length <= 5 && ms.d.uche.orders[0].post === 'corner', 'its long arrays are cut to 4 with a +N marker ' + JSON.stringify(ms.d.uche).slice(0, 120));
  const sv = P.of(ev, 'survey', t0);
  h.assert(sv.length === 2 && sv.every(e => e.d.satisfying === A1 && e.d.unfair === A2), '600-char survey answers are kept whole');
  h.assert(!sv[0].d.trunc && sv[1].d.trunc === true && sv[1].d.extra.length <= 200 && P.chars(sv[1]) <= 4000, 'a survey gets 4000 chars; only its other long strings are cut');

  // (e) the same refusal toast 5× → one blocked event with rep 5
  await P.clear(h);
  t0 = await P.mark(h);
  await h.ev(() => { showOverlay(null); for(let i = 0; i < 5; i++) toast('NOT YET', 'pt caps gate', 300); });
  await h.step(5600);
  ev = await P.all(h);
  const bl = P.of(ev, 'blocked', t0).filter(e => e.d.small === 'pt caps gate');
  h.log('blocked', JSON.stringify(bl.map(e => e.d.rep)));
  h.assert(bl.length === 1 && bl[0].d.rep === 5, 'the same blocked toast 5× → one event with rep 5');

  // (f) exempt types are never dropped; every other type has its own ceiling
  for(const [type, n, want] of [['enc', 650, 650], ['pt_caps_x', 650, 650], ['m9_summary', 650, 650], ['mission_x', 650, 650], ['radio', 170, 150], ['capsother', 640, 600]]){
    await P.clear(h);
    t0 = await P.mark(h);
    await h.ev(([type, n]) => { for(let i = 0; i < n; i++) V12.log(type, type === 'enc' ? { enc:'pt_caps', i } : { i }); }, [type, n]);
    ev = await P.all(h);
    const got = P.of(ev, type, t0).length;
    h.assert(got === want, `${type}: ${n} logged → ${want} stored (got ${got})`);
  }
  await P.clear(h);
  h.assert(h.errors.length === 0, 'no page errors');
};
