// Case 10: a close look at the clips the staging uses (carry / interact / handsup / kneel / sit / pickup)
const sc = require('../scen13.js');
module.exports = async function (T) {
  await sc.s2start(T, 'm10');
  const shot = async n => { for (let i = 0; i < 4; i++) { try { await T.shot(n); return; } catch (e) { T.log('shot retry', n); await T.wait(4000); } } };
  const cam = async (name, pos, look, ms) => {
    await T.ev(([p, l]) => { TPCAM.override = { pos: new THREE.Vector3(...p), look: new THREE.Vector3(...l) }; if (TPCAM.pos) { TPCAM.pos.set(...p); TPCAM.look.set(...l); } }, [pos, look]);
    await T.wait(ms || 900); await shot(name);
  };
  await T.ev(() => {
    const clips = ['carry', 'interact', 'handsup', 'kneel', 'pickup', 'down'];
    clips.forEach((c, i) => {
      const ch = V13.person(V13.crowdLook(i + 4), { x: -2.5 + i * 1.0, z: 12.0, rot: 0.5 }, { clip: c, solid: false });
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshBasicMaterial({ color: '#ff0000' }));
      box.position.set(0, 1.0, 0.4); ch.add(box);     // a marker in front at 1.0 m
    });
    // somebody sitting on the charging-stand chair (-6.5, 9.6, facing +x)
    V13.person(V13.crowdLook(2), { x: -6.5, z: 9.6, rot: Math.PI / 2 }, { clip: 'sit', solid: false });
    // and on a buka chair
    V13.person(V13.crowdLook(3), { x: 4.4, z: -11.6, rot: 0 }, { clip: 'sit_talk', solid: false });
  });
  await T.wait(1500);
  await cam('clips_front', [0.0, 1.5, 15.5], [0.0, 1.0, 12.0], 1500);
  await cam('clips_side', [4.0, 1.5, 12.2], [0.0, 1.0, 12.0], 1200);
  await cam('sit_charging', [-3.5, 1.6, 9.6], [-6.5, 0.8, 9.6], 1200);
  await cam('sit_buka', [2.0, 1.6, -9.0], [4.4, 0.7, -11.6], 1200);
};
