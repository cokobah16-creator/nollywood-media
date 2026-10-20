// Case 12: the warrant branch up to the shredded page only (the gate shot and the strip game), for a quick look on a phone
const { s2start, talk } = require('../scen13.js');
const L = require('./c12lib.js');
const mkShot = require('./c12util.js');
module.exports = async function (T) {
  const shot = mkShot(T, 'c12strips');
  await s2start(T, 'm12', "S.game.moralChoices.asaba='rescue';");
  await L.say(T, 'm12_hauwa', ['Get the warrant']);
  await L.card(T); await L.say(T, 'm12_warrant_back');
  await L.useAt(T, 'Show the warrant', -0.8, 24.5); await L.waitDlg(T, 'm12_gate_warrant'); await T.wait(1200); await shot('gate_guard'); await talk(T);
  await L.use(T, 'Check the shredder'); await L.say(T, 'm12_shred');
  await L.strips(T, shot, T.mode === 'phone');
  T.log('page', await T.ev(() => V13.rt.page));
};
