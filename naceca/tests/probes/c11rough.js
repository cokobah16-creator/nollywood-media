// c11rough: Timi cold, a wrong route (late), made at the drum, chase lost, samples grabbed, waybills, Felix threatened, navy, seized
const L = require('./c11lib.js');
const sc = L.sc;
module.exports = async function (T) {
  if (!process.env.C11_FULL) await L.fast(T);
  T.log('started', await L.start(T, "S.game.moralChoices.s2_statement='proper'; S.game.moralChoices.s2_jetty='lucky';"));
  await L.toCamp(T, 1, 'fail');
  T.log('rep after the wrong fork', await T.ev(() => JSON.stringify(S.player.reputation)));
  await L.shot(T, '01_arrive_late');
  await sc.talk(T);
  await L.waitFree(T);
  T.log('eyes cfg', await T.ev(() => { const e = V13.rt.eyes; return e ? JSON.stringify({ r: e.radius, fov: e.fov, rate: e.rate }) : null; }));
  // walk up to the drum standing tall, while Tari faces it: the camp makes us
  await T.until(() => !V13.rt.tari.away, 120000);
  await L.put(T, 0.75, -0.3, 2, -0.3);
  await T.until(() => V13.rt.made, 400000);
  T.log('made:', await T.ev(() => V13.rt.made), 'phase', await L.phase(T));
  await L.waitDlg(T, 120000);
  await T.wait(300);
  await L.shot(T, '02_bolt_made');
  await sc.talk(T);
  await T.until(() => V13.rt.chase, 120000);
  await T.until(() => V13.rt.chase && V13.rt.chase.seg >= 3, 300000);
  await L.shot(T, '03_chase_scatter');
  // stand still: he gets away
  await T.until(() => !V13.rt.chase, 400000);
  await L.waitDlg(T, 120000);
  await T.wait(400);
  await L.shot(T, '04_lost');
  await sc.talk(T);
  T.log('lost:', await L.ev(T), 'phase', await L.phase(T));
  await L.waitPhase(T, 'secured');
  await T.wait(600);
  await L.shot(T, '05_secured');
  T.log('ints', await L.ints(T));
  // too early for the boys: Uche says so
  await L.use(T, 'Talk to Uche');
  await T.wait(800);
  T.log('uche too early → phase', await L.phase(T));
  // samples now: the late variant
  await L.use(T, 'Take samples');
  await L.waitDlg(T);
  await T.wait(300);
  await L.shot(T, '06_samples_late');
  await sc.talk(T, ['Grab a bottle']);
  await T.until(() => V13.hasEv('fuel_samples'), 90000);
  T.log('grabbed:', await L.flags(T), await L.ev(T));
  // the book, then Felix (he is sitting now)
  await L.use(T, 'Read the waybill book');
  await L.solve(T, 'm11_waybills');
  await L.waitDlg(T);
  await T.wait(400);
  await L.shot(T, '07_felix_sitting');
  await sc.talk(T, ['Talk now']);
  T.log('felix:', await L.flags(T), await L.ev(T), 'phase', await L.phase(T));
  await L.use(T, 'Talk to Uche');
  await L.waitDlg(T);
  await T.wait(400);
  await sc.talk(T, ['Call the Navy']);
  T.log('camp:', await L.flags(T));
  await L.use(T, 'Look over TEKENA 2');
  await L.waitDlg(T);
  await sc.talk(T, ['Seize her']);
  await T.until(() => V13.rt.deck && V13.rt.deck.length, 60000);
  await T.wait(600);
  await L.shot(T, '08_seized');
  await L.waitDlg(T, 120000);
  await T.wait(1500);
  await L.shot(T, '09_end_navy');
  await sc.talk(T);
  await T.until(() => document.getElementById('screen-aftermath').classList.contains('show'), 60000);
  await T.wait(800);
  await L.shot(T, '10_aftermath');
  T.log('END', await L.flags(T), await L.ev(T));
  T.log('sources', await T.ev(() => JSON.stringify(V13.srcList())), 'completed', await T.ev(() => S.game.completedMissions.includes('m11')));
  T.log('rep', await T.ev(() => JSON.stringify(S.player.reputation)));
};
