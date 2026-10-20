// Case 15 scene exploration: bones, vehicle types, dynamic nodes, and fixed camera views of the night jetty
const { s2start } = require('../scen13.js');
module.exports = async function (T) {
  const ok = await s2start(T, 'm15');
  T.log('started', ok);
  T.log(await T.ev(() => {
    const ch = V13.person(V13.look('senator'), { x: 4.6, z: -24.8, rot: Math.PI }, { solid: false });
    const bones = []; ch.traverse(o => { if (o.isBone) bones.push(o.name); });
    return JSON.stringify({
      D: Object.keys(V13.rt.dr && V13.rt.dr.D || {}).filter(k => !/^(Object|Mesh|Scene|Node|Env)/.test(k)).slice(0, 80),
      veh: Object.keys(VEH.types), clips: Object.keys(PEOPLE.clips), bones,
      its: ENGINE.interactables.length, P: ENGINE.player.position.toArray(), lights: Object.keys(V13.rt.dr.D).filter(k => /^L_/.test(k)),
    });
  }));
  const views = [
    ['estab', [2, 5, -44], [6, 0.5, -26]],
    ['estab2', [-6, 3.5, -38], [6, 1, -27]],
    ['road', [4.5, 2.2, 32.5], [-0.5, 1.4, 26]],
    ['gate_tf', [0.5, 1.9, 26.5], [0, 1.4, 20]],
    ['gate_in', [0, 5, 14], [0, 1, 26]],
    ['apron', [-2, 6, -12], [6, 0, -26]],
    ['apron_low', [-8, 1.8, -17], [6, 0.8, -25]],
    ['landing', [-10, 3, -18], [-14, 0, -24]],
    ['gangway', [4, 2.2, -21], [7, 0.5, -27]],
    ['deck', [8, 2.4, -26.2], [13, 0.8, -29]],
    ['door', [10.4, 1.8, -27.6], [13.5, 1.0, -28.6]],
    ['senator', [6.5, 1.7, -22.6], [4.6, 1.4, -24.8]],
    ['over', [0, 70, 0], [0, 0, -1]],
  ];
  for (const [n, p, l] of views) {
    await T.ev(([p, l]) => { TPCAM.override = { pos: new THREE.Vector3(...p), look: new THREE.Vector3(...l) }; TPCAM.cur = null; }, [p, l]);
    await T.wait(900);
    await T.shot('look_' + n);
  }
  await T.ev(() => { V13.world.open('cashdoor', 1); const l = V13.rt.dr.D.L_cash; if (l) l.intensity = 2.0; TPCAM.override = { pos: new THREE.Vector3(10.6, 1.7, -27.9), look: new THREE.Vector3(14.2, 0.9, -28.7) }; TPCAM.cur = null; });
  await T.wait(1800);
  await T.shot('look_door_open');
};
