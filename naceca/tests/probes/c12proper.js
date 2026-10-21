// Case 12, the proper run: waited for the warrant, the shredded page, Amina searches, Sotonye as witness,
// inventory signed, all documents, Ibinabo as a source. Run it desktop and phone.
const { s2start, talk, state } = require('../scen13.js');
const L = require('./c12lib.js');
const mkShot = require('./c12util.js');
module.exports = async function (T) {
  const shot = mkShot(T, 'c12proper');
  const phone = T.mode === 'phone';
  const ok = await s2start(T, 'm12', "S.game.moralChoices.asaba='rescue';");
  T.log('started', ok, JSON.stringify(await state(T)));
  await L.waitDlg(T, 'm12_hauwa'); await T.wait(1500); await shot('gate_hauwa');
  await talk(T, ['Get the warrant']);
  T.log('decided', await L.flags(T));
  await L.card(T); await L.waitDlg(T, 'm12_warrant_back'); await T.wait(1500); await shot('warrant_back');
  await talk(T);
  T.log('after warrant', await L.flags(T), await T.ev(() => S.game.currentSubregion), await T.ev(() => JSON.stringify({ exp: +ENGINE.renderer.toneMappingExposure.toFixed(3), dusk: V13.rt.dusk && +V13.rt.dusk.t.toFixed(2) })));
  await L.useAt(T, 'Show the warrant', -0.8, 24.5); await L.waitDlg(T, 'm12_gate_warrant'); await T.wait(1200); await shot('gate_guard'); await talk(T);
  await L.free(T); await T.wait(5000); await shot('gate_open');
  T.log('gate', await T.ev(() => { const G = ENGINE._dress.D.Gate; return JSON.stringify({ type: G.type, mau: G.matrixAutoUpdate, x: +G.position.x.toFixed(2), wx: +new THREE.Vector3().setFromMatrixPosition(G.matrixWorld).x.toFixed(2) }); }), await L.labels(T));
  await L.use(T, 'Check the shredder'); await L.waitDlg(T, 'm12_shred'); await T.wait(1200); await shot('office_shred'); await talk(T);
  await L.strips(T, shot, phone);
  T.log('page', await T.ev(() => V13.rt.page), await L.labels(T));
  await L.use(T, 'Search Sotonye'); await L.waitDlg(T, 'm12_search'); await T.wait(1200); await shot('office_search'); await talk(T, ['Corporal Amina']);
  await L.use(T, 'Ask Sotonye'); await L.say(T, 'm12_sotonye', ['witness']);
  T.log('sotonye', await L.flags(T));
  await L.use(T, 'glovebox'); await T.until(() => ENGINE.seq, 20000); await T.wait(1800); await shot('car');
  await L.doc(T, 'm12_log');
  T.log('log', await L.evq(T));
  await L.use(T, 'Seize the files'); await L.say(T, 'm12_inventory', ['Write it up']);
  T.log('inventory', await L.flags(T), await L.evq(T));
  await L.free(T); await T.wait(1500); await shot('office_free');
  await L.threads(T, shot, 'levies stop');
  T.log('END', await L.flags(T), '|', await L.evq(T));
  T.log('state', JSON.stringify(await state(T)));
  T.log('sources', await T.ev(() => JSON.stringify(V13.srcList ? V13.srcList() : [])), 'xp', await T.ev(() => S.player.xp), 'time', await T.ev(() => S.game.currentSubregion), 'rep', await T.ev(() => JSON.stringify(S.player.reputation)));
};
