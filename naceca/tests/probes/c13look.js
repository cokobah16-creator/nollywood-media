// exploratory: the ninth floor and Maitama with people at their anchors, from candidate camera positions
module.exports = async function (T) {
  const stage = async (key) => T.ev(async (key) => {
    if (typeof startArtLoad === 'function') startArtLoad();
    await ART.promise;
    await V13.packs.need('env_' + key); await ENVART.load(key);
    showOverlay(null); showHUD(false);
    V13.rt = { tick: [] };
    V13.scene(key, { start: 'start' });
    V13.portraits();
    ENGINE.movementEnabled = true;
    return true;
  }, key);
  await stage('abuja_office');
  await T.ev(() => {
    const A = n => V13.at('abuja_office', n);
    const W = window.__W = {};
    const kc = A('kuti_chair'); W.kuti = V13.person('kuti', { x: kc.x, z: kc.z, rot: kc.rot }, { clip: 'sit', solid: false });
    const dg = A('dg'); W.dg = V13.person('dg', { x: dg.x, z: dg.z, rot: dg.rot }, { clip: 'sit', solid: false });
    const rs = V13.list('abuja_office', 'reception_seats');
    ENGINE.player.position.set(rs[1][0], 0, rs[1][1]); ENGINE.player.rotation.y = rs[1][2]; V13.play(ENGINE.player, 'sit');
    const f = A('dg_chair_front'); W.kel2 = V13.person({}, { x: f.x, z: f.z, rot: f.rot }, { kind: 'kelechi', clip: 'sit', solid: false });
    V13.world.open('doors', 1);
    ENGINE.movementEnabled = false;
  });
  await T.wait(800);
  await T.ev(() => { for (let i = 0; i < 60; i++) V13.world.update(0.05); });
  const shots = [
    ['rec_wide', [1.5, 2.4, 9.6], [-3, 0.9, 4.5]],
    ['rec_sofa', [4.4, 1.5, 3.0], [5.85, 0.9, 3.6]],
    ['rec_desk', [-3.0, 1.9, 6.6], [-3.0, 0.8, 4.6]],
    ['rec_records', [3.5, 1.7, 6.2], [7.5, 1.2, 6.4]],
    ['dg_over', [0.55, 1.55, -4.9], [0, 1.15, -9.1]],
    ['dg_react', [0.4, 1.35, -7.0], [0, 1.25, -9.1]],
    ['dg_wide', [4.5, 2.6, -2.5], [-1, 0.8, -8.5]],
    ['door_in', [0, 1.7, 6.0], [0, 1.2, -6]],
    ['safe', [6.2, 1.6, -4.0], [9.2, 0.6, -6.0]],
    ['console', [0, 1.6, -9.6], [0, 0.7, -11.27]],
  ];
  for (const [name, pos, look] of shots) {
    await T.ev(([p, l]) => { TPCAM.override = { pos: new THREE.Vector3(...p), look: new THREE.Vector3(...l) }; TPCAM.cur = null; ENGINE.movementEnabled = true; }, [pos, look]);
    await T.wait(700);
    await T.shot('office_' + name);
  }
  await stage('maitama');
  await T.ev(() => {
    const A = n => V13.at('maitama', n);
    const W = window.__W = {};
    const s = A('shayi'); W.shayi = V13.person('shayi', { x: s.x, z: s.z, rot: s.rot }, { clip: 'idle', solid: false });
    W.gm = V13.list('maitama', 'gatemen').map((g, i) => V13.person('gateman', { x: g[0], z: g[1], rot: g[2] }, { clip: 'sit', solid: false }));
    const gh = A('gatehouse'); W.bitrus = V13.person('bitrus', { x: gh.x, z: gh.z, rot: gh.rot }, { clip: 'idle', solid: false });
    const c = A('gatehouse_c'); W.gc = V13.person('gateman', { x: c.x, z: c.z, rot: c.rot }, { clip: 'idle', solid: false });
    const st = A('suv_stop');
    if (VEH.ready) { const v = VEH.spawn('suv', { color: '#1e2125', lights: 'on', glow: true }); v.position.set(st.x, 0, st.z); v.rotation.y = st.rot; ENGINE.scene.add(v); W.suv = v; }
    ENGINE.movementEnabled = false;
  });
  const ms = [
    ['street', [3, 2.0, 24], [-2, 1.0, 4]],
    ['kiosk', [3.2, 1.7, 5.5], [5.6, 0.9, 3.8]],
    ['gatehouse', [-3.6, 1.7, -3.0], [-6.6, 1.1, -3.2]],
    ['book', [-5.7, 1.6, -3.2], [-6.6, 0.95, -3.2]],
    ['gate', [0.5, 2.0, 6.5], [-7, 1.4, 1.0]],
    ['suv', [1.5, 1.6, -3.5], [-2.5, 1.0, 2.0]],
    ['gate_c', [3.0, 1.8, -9.0], [6.4, 1.2, -9.5]],
  ];
  for (const [name, pos, look] of ms) {
    await T.ev(([p, l]) => { TPCAM.override = { pos: new THREE.Vector3(...p), look: new THREE.Vector3(...l) }; TPCAM.cur = null; ENGINE.movementEnabled = true; }, [pos, look]);
    await T.wait(700);
    await T.shot('maitama_' + name);
  }
};
