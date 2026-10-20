// Case 12, the shortcut run: went in without a warrant, searched her himself, pressured her,
// skipped the inventory, leaned on Ibinabo. Also lets the owner's clock run out (the Prado).
const { s2start, talk, state } = require('../scen13.js');
const L = require('./c12lib.js');
const mkShot = require('./c12util.js');
module.exports = async function (T) {
  const shot = mkShot(T, 'c12short');
  const ok = await s2start(T, 'm12', "S.game.moralChoices.asaba='dead';");
  T.log('started', ok);
  await L.say(T, 'm12_hauwa', ['go in now']);
  T.log('flags', await L.flags(T));
  await L.useAt(T, 'Order the gate open', -0.8, 24.5); await L.say(T, 'm12_gate_nowarrant');
  await L.free(T); await T.until(() => V13.rt.owner, 60000); await T.wait(1500);
  T.log('clock', await T.ev(() => JSON.stringify(V13.rt.owner && { t: +V13.rt.owner.t.toFixed(1), max: V13.rt.owner.max, meter: !!document.getElementById('meter-m12owner') })), await L.labels(T));
  await shot('owner_clock');
  await L.use(T, 'Search Sotonye'); await L.waitDlg(T, 'm12_search_noamina'); await T.wait(1000); await shot('search_noamina'); await talk(T, ['do it myself']);
  T.log('search', await L.flags(T));
  await L.use(T, 'Ask Sotonye'); await L.say(T, 'm12_sotonye', ['children']);
  // let the owner's clock run out while the USB is still in the car
  await T.ev(() => { const c = V13.rt.owner; if (c) c.t = c.max - 0.5; });
  await T.until(() => V13.rt.owner && V13.rt.owner.done, 60000); await T.wait(6000); await shot('prado');
  T.log('after clock', await T.ev(() => JSON.stringify({ done: V13.rt.owner && V13.rt.owner.done, heat: S.player.reputation.underworldHeat, meter: !!document.getElementById('meter-m12owner') })));
  await L.use(T, 'glovebox'); await L.doc(T, 'm12_log');
  await L.use(T, 'Seize the files'); await L.say(T, 'm12_inventory', ['No time']);
  T.log('inventory', await L.flags(T), await L.evq(T));
  await L.threads(T, null, 'Talk, or I start');
  T.log('END', await L.flags(T), '|', await L.evq(T));
  T.log('state', JSON.stringify(await state(T)), 'sources', await T.ev(() => JSON.stringify(V13.srcList())));
};
