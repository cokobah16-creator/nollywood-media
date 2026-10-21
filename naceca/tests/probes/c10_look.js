// Case 10 exploration: the Sapele scene from a few angles, and the animation clips we plan to use
const sc = require('../scen13.js');
module.exports = async function (T) {
  const ok = await sc.s2start(T, 'm10');
  T.log('started', ok);
  const shot = async n => { for (let i = 0; i < 4; i++) { try { await T.shot(n); return; } catch (e) { T.log('shot retry', n); await T.wait(4000); } } };
  const cam = async (name, pos, look, ms) => {
    await T.ev(([p, l]) => { TPCAM.override = { pos: new THREE.Vector3(...p), look: new THREE.Vector3(...l) }; if (TPCAM.pos) { TPCAM.pos.set(...p); TPCAM.look.set(...l); } }, [pos, look]);
    await T.wait(ms || 900); await shot(name);
  };
  await cam('over_road', [0, 9, 26], [0, 0, 0]);
  await cam('over_jetty', [0, 10, -30], [0, 0, -5]);
  await cam('karo_t4', [-1.0, 2.2, 3.5], [-5.4, 1.0, -0.5]);
  await cam('buka', [0.5, 2.4, -8.0], [6.0, 0.8, -12.5]);
  await cam('jetty', [3.0, 2.4, -15.0], [-0.5, 0.0, -22.5]);
  // a row of people in each clip we plan to use
  const clips = ['carry', 'interact', 'handsup', 'kneel', 'sit', 'sit_talk', 'phone', 'folded', 'talk', 'pickup', 'idle', 'down'];
  const r = await T.ev(clips => {
    const out = [];
    clips.forEach((c, i) => { const ch = V13.person(V13.crowdLook(i), { x: -5 + i * 0.95, z: 12.5, rot: 0 }, { clip: c, solid: false }); out.push(c + ':' + !!(ch.userData.anim.actions[c])); });
    return out.join(' ');
  }, clips);
  T.log('clips', r);
  await cam('clips', [0.2, 1.6, 17.5], [0.2, 0.9, 12.5], 2500);
  T.log('anchors', await T.ev(() => JSON.stringify(Object.keys(V13.A('sapele')))));
  T.log('dyn', await T.ev(() => JSON.stringify(Object.keys((V13.rt.dr && V13.rt.dr.D) || {}))));
  T.log('lights', await T.ev(() => { const L = []; ENGINE.scene.traverse(o => { if (o.isLight) L.push(o.type + '@' + o.position.toArray().map(v => v.toFixed(1)).join(',') + ' i' + o.intensity.toFixed(2)); }); return L.join(' | '); }));
};
