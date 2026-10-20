// Case 12, the no-warrant "leave her bag" branch (no search flag), then the lawful choices after it.
// Then a replay (reset must clear the case's flags and exhibits) taking "wait for Corporal Amina".
const { s2start, talk, state } = require('../scen13.js');
const L = require('./c12lib.js');
const mkShot = require('./c12util.js');
async function upToSearch(T, pick) {
  await L.say(T, 'm12_hauwa', ['go in now']);
  await L.useAt(T, 'Order the gate open', -0.8, 24.5); await L.say(T, 'm12_gate_nowarrant');
  await L.use(T, 'Search Sotonye'); await L.say(T, 'm12_search_noamina', [pick]);
  T.log('search(' + pick + ')', await L.flags(T), 'amina here:', await T.ev(() => !!V13.rt.amina), 'time', await T.ev(() => S.game.currentSubregion), 'clock', await T.ev(() => V13.rt.owner && Math.round(V13.rt.owner.t)));
}
module.exports = async function (T) {
  const shot = mkShot(T, 'c12skip');
  await s2start(T, 'm12', "S.game.moralChoices.asaba='rescue';");
  await upToSearch(T, 'Leave her bag');
  await L.use(T, 'Ask Sotonye'); await L.say(T, 'm12_sotonye', ['witness']);
  await L.use(T, 'glovebox'); await T.until(() => ENGINE.seq, 20000); await T.wait(1800); await shot('car_open');
  await L.doc(T, 'm12_log');
  await L.use(T, 'Seize the files'); await L.say(T, 'm12_inventory', ['Write it up']);
  T.log('inventory', await L.flags(T), await L.evq(T));
  await L.threads(T, null, 'levies stop', true);          // and fail the CAC document twice: cac_record should be weak
  T.log('END skip', await L.flags(T), '|', await L.evq(T), '| cac name:', await T.ev(() => (S.game.evidence.find(e => e.id === 'cac_record') || {}).name));
  // replay: reset() clears this case's flags and exhibits; this time wait for Corporal Amina
  await s2start(T, 'm12', "S.game.moralChoices.asaba='rescue';");
  T.log('replay start', await L.flags(T), await L.evq(T));
  await upToSearch(T, 'We wait');
  await L.free(T); await T.wait(1500); await shot('amina_arrived');
};
