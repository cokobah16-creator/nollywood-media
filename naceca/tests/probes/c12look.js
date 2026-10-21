// Case 12 scene exploration: overview shots of the tank farm from fixed cameras
const { s2start } = require('../scen13.js');
const mkShot = require('./c12util.js');
module.exports = async function (T) {
  const shot = mkShot(T, 'c12look');
  const ok = await s2start(T, 'm12');
  T.log('started', ok);
  T.log(await T.ev(() => JSON.stringify({ D: Object.keys(V13.rt.dr && V13.rt.dr.D || {}).filter(k => !/^(Object|Mesh|Scene|Node)/.test(k)).slice(0, 200), its: ENGINE.interactables.length, P: ENGINE.player.position.toArray() })));
  await shot('look_start');
  const views = [
    ['gate_out', [0, 6, 36], [0, 1, 22]],
    ['gate_in', [0, 5, 14], [0, 1, 26]],
    ['office_out', [-6, 7, 16], [-15, 1, 8]],
    ['office_top', [-16, 14, 8.1], [-16, 0, 8]],
    ['office_in', [-13.0, 2.4, 10.8], [-18.5, 0.8, 6.5]],
    ['car', [-6, 3, 14], [-9.4, 0.5, 10.8]],
    ['tank3', [-2, 4, -4], [2.4, 1, -7]],
    ['gantry', [-10, 5, 6], [-4, 1, -2]],
    ['lab_out', [-10, 5, 0], [-15.2, 1, -5]],
    ['lab_top', [-15.9, 12, -6], [-15.9, 0, -6]],
    ['union', [-12, 4, -14], [-20, 1, -21]],
    ['jetty', [0, 6, -14], [6, 0, -28]],
    ['over', [0, 70, 2], [0, 0, 0]],
    ['over_n', [-8, 40, 18], [-8, 0, 8]],
    ['over_s', [-6, 40, -14], [-6, 0, -18]],
  ];
  for (const [n, p, l] of views) {
    await T.ev(([p, l]) => { TPCAM.override = { pos: new THREE.Vector3(...p), look: new THREE.Vector3(...l) }; TPCAM.cur = null; }, [p, l]);
    await T.wait(700);
    await shot('look_' + n);
  }
};
