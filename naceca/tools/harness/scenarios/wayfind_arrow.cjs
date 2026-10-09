// Wayfinding · edge-of-screen arrow: always on (whatever SETTINGS.marker says) when the target is
// off screen, SVG pointer + distance, clamped clear of the HUD clusters; hidden on screen, under
// menus/dialogue, across scene switches and in the car. Run at 390×844 --touch 1 and at 1280×800.
// The harness camera can't project, so WAY._testProject stands in for the projection.
const lib = require('./wayfind_lib.cjs');

module.exports = async h => {
  await lib.start(h, 'm2', { completed: ['m0', 'm1'] });
  await lib.realClock(h);
  await h.step(400);
  const vp = await h.ev(() => ({ w: innerWidth, h: innerHeight, touch: document.body.classList.contains('touch-active') }));
  h.log('viewport', JSON.stringify(vp));

  // markup: SVG icons, no text glyphs, no text-shadow glow
  const mk = await h.ev(() => {
    const a = document.getElementById('guide-arrow'), m = document.getElementById('guide-marker');
    return { a: a.innerHTML, m: m.innerHTML, ash: getComputedStyle(a).textShadow, msh: getComputedStyle(m).textShadow, af: getComputedStyle(a.querySelector('.ga-ico')).boxShadow };
  });
  h.assert(/<svg/.test(mk.a) && !/➤/.test(mk.a) && /<svg/.test(mk.m) && !/▼/.test(mk.m), 'arrow and marker are SVG icons, not ▼/➤ glyphs');
  h.assert(mk.ash === 'none' && mk.msh === 'none' && mk.af === 'none', 'no text-shadow / glow on the guide');

  // off screen, in every direction: shown, pointing, with distance, never on a HUD cluster, inside the viewport
  const sweep = await h.ev(() => {
    const out = [], W = innerWidth, H = innerHeight, a = document.getElementById('guide-arrow');
    const rects = WAY.hudRects(true);
    for (let deg = 0; deg < 360; deg += 15) {
      const t = deg * Math.PI / 180;
      WAY._testProject = () => ({ x: W / 2 + Math.cos(t) * 3000, y: H / 2 + Math.sin(t) * 3000, behind: false });
      WAY.guide(0.016);
      const r = a.getBoundingClientRect(), ico = a.querySelector('.ga-ico').getBoundingClientRect();
      const hit = rects.filter(q => r.left < q.r && r.right > q.l && r.top < q.b && r.bottom > q.t).map(q => q.sel);
      out.push({ deg, shown: getComputedStyle(a).display !== 'none', l: r.left, t: r.top, r: r.right, b: r.bottom, hit,
                 dist: a.querySelector('.ga-dist').textContent, rot: a.querySelector('.ga-ico svg').style.transform,
                 inView: r.left >= 0 && r.top >= 0 && r.right <= W && r.bottom <= H, icoW: ico.width });
    }
    return { out, rects: rects.map(q => q.sel) };
  });
  h.log('HUD clusters measured:', sweep.rects.join(', '));
  for (const s of sweep.out) {
    h.assert(s.shown, `arrow shown for a target off screen at ${s.deg}°`);
    h.assert(!s.hit.length, `arrow at ${s.deg}° clear of the HUD (hit ${s.hit.join(',')})`);
    h.assert(s.inView, `arrow at ${s.deg}° inside the viewport`);
    h.assert(/^\d+ m$/.test(s.dist), 'distance under the arrow: ' + s.dist);
    h.assert(/^rotate\(/.test(s.rot), 'pointer rotated toward the target');
  }
  const d = await h.ev(() => { const r = WAY.resolve(), p = ENGINE.player.position; return Math.round(Math.hypot(r.pos.x - p.x, r.pos.z - p.z)); });
  h.assert(sweep.out[0].dist === d + ' m', 'arrow distance = distance to the HUD objective');

  // a screenshot with the arrow parked toward the upper left (behind the mission panel)
  await h.ev(() => { WAY._testProject = () => ({ x: -500, y: -400, behind: false }); });
  await h.step(200);
  await h.shot('wayfind_arrow_' + vp.w);

  // persistent: still shown with the objective marker setting off
  await h.ev(() => { SETTINGS.marker = 'off'; });
  await h.step(200);
  let st = await h.ev(() => ({ a: getComputedStyle(GUIDE.arrow).display, m: getComputedStyle(GUIDE.el).display, s: WAY._guideState }));
  h.assert(st.a !== 'none' && st.s === 'arrow', 'edge arrow ignores SETTINGS.marker ' + JSON.stringify(st));

  // on screen: arrow hidden; the marker follows the setting
  await h.ev(() => { WAY._testProject = () => ({ x: innerWidth / 2, y: innerHeight / 2, behind: false }); });
  await h.step(200);
  st = await h.ev(() => ({ a: getComputedStyle(GUIDE.arrow).display, m: getComputedStyle(GUIDE.el).display }));
  h.assert(st.a === 'none' && st.m === 'none', 'on screen + marker off: nothing ' + JSON.stringify(st));
  await h.ev(() => { SETTINGS.marker = 'on'; });
  await h.step(200);
  st = await h.ev(() => ({ a: getComputedStyle(GUIDE.arrow).display, m: getComputedStyle(GUIDE.el).display, d: GUIDE.el.querySelector('.gm-dist').textContent }));
  h.assert(st.a === 'none' && st.m !== 'none' && /^\d+ m$/.test(st.d), 'on screen + marker on: marker with distance ' + JSON.stringify(st));

  // behind the camera: arrow, not marker
  await h.ev(() => { WAY._testProject = () => ({ x: innerWidth / 2, y: innerHeight / 2 + 10, behind: true }); });
  await h.step(200);
  st = await h.ev(() => ({ a: getComputedStyle(GUIDE.arrow).display, m: getComputedStyle(GUIDE.el).display }));
  h.assert(st.a !== 'none' && st.m === 'none', 'target behind the camera → edge arrow');

  // an overlay (dialogue) hides it — the tick stops running guidance and the CSS backs it up
  await h.ev(() => showOverlay('screen-dialogue'));
  await h.step(200);
  st = await h.ev(() => ({ a: getComputedStyle(GUIDE.arrow).display, inline: GUIDE.arrow.style.display }));
  h.assert(st.a === 'none' && st.inline === 'none', 'hidden while a screen is open ' + JSON.stringify(st));
  await h.ev(() => showOverlay(null));
  await h.step(250);
  st = await h.ev(() => getComputedStyle(GUIDE.arrow).display);
  h.assert(st !== 'none', 'back after the screen closes');

  // the car mission: no arrow (and no target)
  await h.ev(() => document.body.classList.add('v12-car'));
  await h.step(200);
  st = await h.ev(() => ({ a: getComputedStyle(GUIDE.arrow).display, r: WAY.resolve() }));
  h.assert(st.a === 'none' && st.r === null, 'hidden in the car');
  await h.ev(() => document.body.classList.remove('v12-car'));

  // scene switch: hidden at once, and the stale player of a previous scene is ignored
  await h.step(200);
  st = await h.ev(() => { newScene({}); return { a: GUIDE.arrow.style.display, ok: WAY.playerOk() }; });
  h.assert(st.a === 'none', 'hidden on a scene switch');
  await h.ev(() => { WAY._testProject = null; });
  h.assert(!h.errors.length, 'no page errors');
};
