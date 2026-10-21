// Case 10: frame rate in the market (how slow is the test machine right now?)
const L = require('./c10_lib.js'), sc = L.sc;
module.exports = async function (T) {
  await sc.s2start(T, 'm10');
  await L.talkWhen(T);
  const fps = () => T.ev(() => new Promise(res => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 5000) requestAnimationFrame(f); else res((n / 5).toFixed(1)); }; requestAnimationFrame(f); }));
  T.log('fps full', await fps(), 'people', await T.ev(() => ENGINE.extraSkinned.length));
  await T.ev(() => { for (const c of ENGINE.extraSkinned) c.visible = false; });
  T.log('fps no people', await fps());
  await T.ev(() => { for (const c of ENGINE.extraSkinned) c.visible = true; ENGINE._postOff = true; });
  T.log('fps no post', await fps());
  T.log('gfx', await T.ev(() => typeof currentGfx === 'function' ? currentGfx() : '?'), await T.ev(() => ENGINE.renderer.getPixelRatio()));
};
