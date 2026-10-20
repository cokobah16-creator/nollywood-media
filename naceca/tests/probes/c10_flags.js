// Case 10: the choices that carry a flag but no effect store their flag (the m10-scoped applyEffect fix)
const L = require('./c10_lib.js'), sc = L.sc;
module.exports = async function (T) {
  await L.start(T, 'flags');
  await L.talkWhen(T);
  await sc.use(T, 'Greet Mama Karo'); await sc.talk(T, ['bitter leaf', 'Keep the change']);
  T.log('karo (expect neutral):', await T.ev(() => V13.mc().s2_karo + ' / flags ' + (S.game.flags || {}).s2_karo));
  // the written jetty and Ejiro choices, said directly (no case callbacks), so only the engine can set the flags
  await T.ev(() => { delete V13.mc().s2_jetty; V13.say('m10_jetty'); });
  await sc.talk(T, ['Take Lucky']);
  T.log('jetty (expect lucky):', await T.ev(() => V13.mc().s2_jetty));
  await T.ev(() => { delete V13.mc().s2_ejiro; V13.say('m10_ejiro'); });
  await sc.talk(T, ['Close early']);
  T.log('ejiro (expect left):', await T.ev(() => V13.mc().s2_ejiro));
  // outside m10 the wrap stands aside (other cases keep the engine's behaviour)
  T.log('outside m10 (expect undefined):', await T.ev(() => { const cm = S.game.currentMission; S.game.currentMission = 'm9'; delete V13.mc().zz_probe; applyEffect(undefined, { zz_probe:1 }); S.game.currentMission = cm; const v = V13.mc().zz_probe; delete V13.mc().zz_probe; return String(v); }));
};
