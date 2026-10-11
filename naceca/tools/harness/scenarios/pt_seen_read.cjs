// pt_seen_read (Team D): D's own measurement of how long the frozen alarm line was on screen (DESIGN-tactics.md §3.6,
// §2.4 T-M6): play-time ms while #eye-ind.show carries .eye-why == the alarm's why, or while the toast shows it.
// With Team A's eye in the build (TAC.sight.full) the line is A's; without it the scenario scripts #eye-ind the way the
// DOM contract says.
//   node tools/harness/run.cjs tools/harness/scenarios/pt_seen_read.cjs --html <build>/naceca.html
const P = require('./pt_lib.cjs');
const T = P.T;
module.exports = async h => {
  await T.start(h, 'm2', { seed:9 });
  const full = await h.ev(() => !!(TAC.sight && TAC.sight.full));
  h.log('Team A eye in the build:', full);
  // a watcher on KC (the kernel's fallback model, or A's module through the same API); the player well away from him
  const W1 = 'He saw you crossing the open road, standing', W2 = 'He heard you walking on the street', W3 = 'He saw you 6 m away, standing';
  const alarm = (why, cause) => h.ev(([why, cause]) => {
    let w = window.__ptW;
    if(!w) w = window.__ptW = TAC.sight.watch({ id:'kc', enc:'m2_kc', mesh:ENGINE._marketKC, eyeH:1.5, active:() => true });
    const p = ENGINE.player.position; p.x = -15; p.z = 15;
    w.reset(0); w.reset(100, { cause:cause || 'sight', why });
  }, [why, cause || null]);
  const calm = () => h.ev(() => { if(window.__ptW){ window.__ptW.reset(0); } });
  const run = s => h.ev(s => __wf.run(s), s);
  const reads = async t0 => P.of(await P.all(h), 'seen_read', t0);
  const near = (a, b, tol) => Math.abs(a - b) <= tol;

  // 1. the line under the eye for 2 s, then an overlay opens → via eye, ms ≈ 2000, end overlay
  let t0 = await P.mark(h);
  await alarm(W1);
  if(!full) await P.eye(h, W1);
  await run(2.0);
  h.assert(await h.ev(() => !!V12.ptKit.reading() && V12.ptKit.reading().vis), 'the read is running while the line shows');
  await h.ev(() => showOverlay('screen-pause'));
  await h.step(100);
  let r = await reads(t0);
  h.log('1', JSON.stringify(r.map(e => e.d)));
  h.assert(r.length === 1 && r[0].d.via === 'eye' && near(r[0].d.ms, 2000, 120) && r[0].d.end === 'overlay' && r[0].d.who === 'kc' && r[0].d.enc === 'm2_kc' && r[0].d.words === 8,
    'seen_read {who, enc, via:eye, ms≈2000, words:8, end:overlay}');
  await h.ev(() => showOverlay(null)); await calm(); if(!full) await P.eye(h, null);
  await run(0.5);

  // 2. the frozen line in a toast (toast(BIG, whyPast)) from a watcher the eye doesn't show (hud:false) → via toast;
  //    replaced by the next toast
  t0 = await P.mark(h);
  await h.ev(why => { const w = TAC.sight.watch({ id:'kc2', enc:'m2_kc', mesh:ENGINE._marketKC, eyeH:1.5, hud:false, active:() => true }); w.reset(100, { cause:'noise', why }); window.__ptW2 = w; }, W2);
  if(!full) await P.eye(h, 'He can hear you walking on the street');
  await h.ev(why => toast('HE HEARD YOU', why, 4000), W2);
  await run(1.2);
  await h.ev(() => toast('LINK INKED', '+8 INTEL', 1000));
  await h.step(100);
  r = await reads(t0);
  h.log('2', JSON.stringify(r.map(e => e.d)));
  h.assert(r.length === 1 && r[0].d.via === 'toast' && r[0].d.who === 'kc2' && near(r[0].d.ms, 1200, 120) && r[0].d.end === 'replaced', 'a toast with small === whyPast → via toast, ended when another toast replaced it');
  await h.ev(() => { window.__ptW2.reset(0); window.__ptW2.unwatch(); window.__ptW2 = null; });
  await calm(); if(!full) await P.eye(h, null);
  await run(0.5);

  // 3. eye and toast together → both; the toast goes, the eye stays, then the eye hides → hidden
  t0 = await P.mark(h);
  await alarm(W3);
  if(!full) await P.eye(h, W3);
  await h.ev(why => toast('HE SAW YOU', why, 600), W3);
  await run(1.0);
  await h.step(800);     // the toast times out (wall clock); the eye still shows the line
  await run(0.5);
  if(!full) await P.eye(h, null); else await calm();
  await run(0.2);
  r = await reads(t0);
  h.log('3', JSON.stringify(r.map(e => e.d)));
  h.assert(r.length === 1 && r[0].d.via === 'both' && near(r[0].d.ms, 1500, 150) && r[0].d.end === 'hidden', 'eye and toast → via both; ends hidden when the line leaves the screen');
  await calm();

  // 4. a line left up → 8 s of play time, timeout
  t0 = await P.mark(h);
  await alarm(W1);
  if(!full) await P.eye(h, W1);
  await run(8.5);
  r = await reads(t0);
  h.log('4', JSON.stringify(r.map(e => e.d)));
  h.assert(r.length === 1 && r[0].d.end === 'timeout' && near(r[0].d.ms, 8000, 150), 'a line left up ends at 8 s (timeout)');
  await calm(); if(!full) await P.eye(h, null);
  await run(0.5);

  // 5. a new alarm replaces the line being read; a scene change ends it
  t0 = await P.mark(h);
  await alarm(W1); if(!full) await P.eye(h, W1); await run(0.6);
  await alarm(W3); if(!full) await P.eye(h, W3); await run(0.4);
  await h.ev(() => { window.__ptW = null; newScene(); });
  await h.step(100);
  r = await reads(t0);
  h.log('5', JSON.stringify(r.map(e => e.d)));
  h.assert(r.length === 2 && r[0].d.end === 'replaced' && near(r[0].d.ms, 600, 100) && r[1].d.end === 'scene', 'a new alarm replaces the line; a scene change ends it');
  if(!full) await P.eye(h, null);

  // 6. none without an alarm: a notice, a toast with any text, the eye on
  await T.start(h, 'm2', { seed:9 });
  t0 = await P.mark(h);
  await h.ev(() => { const w = TAC.sight.watch({ id:'kc', enc:'m2_kc', mesh:ENGINE._marketKC }); w.reset(40, { cause:'sight', why:'He can see you' }); toast('HE SAW YOU', 'He can see you', 800); w.unwatch(); });
  if(!full) await P.eye(h, 'He can see you');
  await run(2.0);
  if(!full) await P.eye(h, null);
  await run(9);
  r = await reads(t0);
  h.assert(r.length === 0, 'no seen_read without an alarm');
  h.assert(h.errors.length === 0, 'no page errors');
};
