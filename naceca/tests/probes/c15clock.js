// Case 15, by water, too slow: the task force gets round by the road before the count (the clock runs out).
// Checks tfArrives(): the jog onto the jetty, m15_x_tf_jetty, bags into the river, and barge_cash 'contested'.
const L = require('./c15lib.js'), sc = L.sc;
module.exports = async function (T) {
  const ok = await sc.s2start(T, 'm15', L.STRONG);
  T.log('started', ok);
  await L.waitDialogue(T, 30000);
  await sc.talk(T);
  await L.waitFree(T);
  await sc.use(T, 'Tell Uche');
  await sc.talk(T, ['The water']);
  await sc.waitCards(T);
  await L.waitDialogue(T, 30000); await sc.talk(T);
  await L.waitFree(T);
  T.log('landed', JSON.stringify(await L.st(T)));
  // the clock: jump it to the last seconds
  await T.ev(() => { V13.rt.tfT = 163.5; });
  await T.until(() => !!V13.rt.tfFirst, 120000);
  T.log('tf arrives', await T.ev(() => JSON.stringify({ made:V13.rt.made, tfFirst:V13.rt.tfFirst })));
  await L.waitDialogue(T, 60000); await T.wait(2500); await L.shot(T, '01_tf_jog');
  await L.until(T, 'By order of the Director-General, step away'); await T.wait(800); await L.shot(T, '02_tf_acp');
  await L.until(T, 'Read it slowly'); await L.shot(T, '03_tf_osagie');
  await sc.talk(T);
  await L.waitFree(T, 60000);
  await T.until(() => (V13.rt.lost || 0) >= 2, 180000);
  await T.wait(1200); await L.shot(T, '04_bags');
  await T.ev(() => { const P = ENGINE.player; P.position.set(6.95, 0, -25.6); });
  await T.until(() => !!V13.rt.boarded, 60000);
  T.log('boarded', await T.ev(() => JSON.stringify({ b:V13.rt.boarded, lost:V13.rt.lost })));
  await T.wait(1500);
  await sc.use(T, 'fuel tank');
  await L.waitDialogue(T); await sc.talk(T);
  await sc.waitCards(T); await T.wait(2600); await L.shot(T, '05_counted');
  T.log('counted', JSON.stringify(await L.st(T)), await T.ev(() => document.querySelector('#toast, .toast') ? document.querySelector('#toast, .toast').textContent.slice(0, 160) : ''));
};
