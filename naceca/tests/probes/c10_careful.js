// Case 10, test 1 — the careful run: trust Karo and take her as a source, find T4, watch Lucky from
// two angles, solve the BVN document, turn Ejiro, take Lucky at the jetty, proper statement.
const L = require('./c10_lib.js'), sc = L.sc;
module.exports = async function (T) {
  await L.start(T, 'careful');
  await T.ev(() => { const c = PEOPLE.clips; const sig = n => { const k = c[n]; if (!k) return n + ':none'; let tot = 0; for (const t of k.tracks) { if (!/thigh|calf|upleg|leg/i.test(t.name) || t.values.length < 8) continue; const v = t.values, w = t.getValueSize(); let mx = 0; for (let i = w; i < v.length; i += w) for (let j = 0; j < w; j++) mx = Math.max(mx, Math.abs(v[i + j] - v[j])); tot = Math.max(tot, mx); } return n + ':' + k.duration.toFixed(2) + 's legs ' + tot.toFixed(2); }; return ['carry', 'walk', 'idle', 'interact', 'pickup', 'handsup', 'kneel'].map(sig).join(' | '); }).then(r => T.log('clips', r));
  await L.talkWhen(T);                                   // the intro
  await L.fast(T);
  await T.wait(1500);
  await L.shot(T, 'market');
  await L.until(T, "V13.c10().uche === 'charging'", 120000, 'uche at the charging stand');
  await L.cam(T, [-1.6, 1.9, 12.6], [-4.6, 1.1, 9.0]); await T.wait(900); await L.shot(T, 'uche'); await L.camOff(T);
  T.log('interactables', await T.ev(() => ENGINE.interactables.map(i => i.label).filter(Boolean).join(' | ')));
  // Mama Karo: the greeting, the trust branch, the offer
  await L.aim(T, -4.35, 1.6, { x:-6.6, z:1.0 }); await L.frames(T, 3);
  await L.useHere(T, 'Greet Mama Karo');
  await T.wait(600); await L.shot(T, 'karo');
  await sc.talk(T, ['Migwo', 'help him sleep', 'Bitter leaf']);
  T.log('after karo', await L.flags(T), await L.st(T));
  // the permit on the blue kiosk
  await sc.use(T, 'blue kiosk'); await sc.talk(T);
  // a decoy and the buka, for cover
  await sc.use(T, 'thrift collector'); await sc.talk(T);
  await sc.use(T, 'Buy food'); await sc.talk(T);
  T.log('explored', await L.st(T));
  await L.crowd(T, false);
  // Lucky comes
  await L.until(T, "V13.c10().phase === 'arrive'", 240000, 'arrival');
  await T.ev(() => { ENGINE.player.position.set(2.6, 0, 4.0); });
  await L.until(T, "V13.rt.lucky && V13.rt.lucky.position.z < 8", 240000, 'lucky in the lane');
  await L.aim(T, 2.6, 4.0); await L.crowd(T, true); await T.wait(1500); await L.shot(T, 'arrival'); await L.crowd(T, false);
  await L.until(T, "V13.c10().phase === 'cashout'", 240000, 'at T4');
  // first look: across the aisle
  await L.crowd(T, true); await L.aim(T, 3.0, -1.0); await T.wait(700); await L.shot(T, 'watching'); await L.crowd(T, false);
  let r = await L.watch(T, 3.0, -1.0, 60000);
  T.log('  watch 1 →', r, await L.st(T));
  await L.crowd(T, true); await T.wait(1200); await L.shot(T, 'observe'); await L.crowd(T, false);
  if (r === 'dialogue') await sc.talk(T);
  // second look: from the south side
  r = await L.watch(T, -1.4, -8.0, 60000);
  T.log('  watch 2 →', r, await L.st(T));
  if (r === 'dialogue') await sc.talk(T);
  await T.ev(() => ENGINE.player.position.set(2.8, 0, -6.5));
  // the analyst's message
  await L.docWhen(T, 'm10_who', false, 240000);
  await T.wait(800); await sc.talk(T);
  T.log('after doc', await L.flags(T), await L.st(T));
  if (await L.until(T, "V13.rt.lucky && Math.hypot(V13.rt.lucky.position.x - 4.85, V13.rt.lucky.position.z + 11.95) < 0.3", 240000, 'lucky at the buka')) {
    await L.crowd(T, true); await L.cam(T, [1.4, 2.0, -9.0], [5.2, 0.9, -12.6]); await T.wait(900); await L.shot(T, 'buka'); await L.camOff(T); await L.crowd(T, false);
  }
  // Ejiro, once Lucky waits on the jetty
  await L.until(T, "V13.c10().ejiro", 240000, 'ejiro open');
  await L.crowd(T, true); await L.cam(T, [1.2, 2.1, -15.2], [-2.2, 0.6, -18.9]); await T.wait(900); await L.shot(T, 'waiting'); await L.camOff(T); await L.crowd(T, false);
  await sc.use(T, 'Talk to Ejiro'); await sc.talk(T, ['Keep your terminal open']);
  T.log('after ejiro', await L.flags(T), await L.st(T));
  // the boat: watch the handover from the jetty head
  await L.until(T, "V13.c10().phase === 'jetty'", 240000, 'jetty');
  await L.aim(T, 0.2, -16.0);
  await L.until(T, "V13.rt.handing", 240000, 'handing over');
  await L.crowd(T, true); await L.aim(T, 0.2, -16.0); await T.wait(800);
  await L.shot(T, 'jetty');
  r = await L.watch(T, 0.2, -16.0, 240000);
  T.log('  watch boat →', r, await L.st(T));
  await sc.talk(T);                                      // m10_obs_boat
  await L.talkWhen(T, ['Take Lucky'], 120000);            // m10_jetty
  await T.wait(1800); await L.shot(T, 'arrest');
  await L.talkWhen(T, [], 120000);                       // m10_arrest
  await L.talkWhen(T, ['Area Command']);                  // the statement
  await T.wait(1000);
  await T.until(() => document.getElementById('screen-dialogue').classList.contains('show'), 120000);
  await T.wait(1500); await L.shot(T, 'midnight');
  await L.talkWhen(T, [], 120000);                        // m10_end
  await L.aftermath(T, 'careful');
  await L.shot(T, 'aftermath');
  T.log('state', JSON.stringify(await sc.state(T)));
};
