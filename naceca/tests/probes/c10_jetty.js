// Case 10, test 3 — the jetty branches, and the chase caught:
//   run A: 'both' — Karo as a customer (neutral), a decoy, Ejiro arrested, watch the boat, take them both, the car statement
//   run B: 'follow' — Karo trusted but no source, Ejiro sent home, the boat not watched, let them go
//   run C: made at the kiosk, run down in the chase — s2_jetty lucky, cash contested, BVN after, threat statement, Ejiro sent home
const L = require('./c10_lib.js'), sc = L.sc;
async function observeBoth(T) {
  let r = await L.watch(T, 3.0, -1.0, 60000);
  T.log('  watch 1 →', r, await L.st(T)); if (r === 'dialogue') await sc.talk(T);
  r = await L.watch(T, -1.4, -8.0, 60000);
  T.log('  watch 2 →', r, await L.st(T)); if (r === 'dialogue') await sc.talk(T);
  await T.ev(() => ENGINE.player.position.set(2.8, 0, -6.5));
}
async function opening(T, label, karo) {
  await L.start(T, label);
  await L.talkWhen(T);
  await L.fast(T);
  await sc.use(T, 'Greet Mama Karo'); await sc.talk(T, karo);
  await sc.use(T, 'blue kiosk'); await sc.talk(T);
  await T.ev(() => ENGINE.player.position.set(2.6, 0, 4.0));     // out of the kiosk's way before he comes
}
module.exports = async function (T) {
  // ---------- A: both ----------
  await opening(T, 'A', ['bitter leaf', 'Keep the change']);
  await sc.use(T, 'fuel seller'); await sc.talk(T);
  await T.ev(() => ENGINE.player.position.set(2.6, 0, 4.0));
  await L.until(T, "V13.c10().phase === 'cashout'", 240000, 'at T4');
  await observeBoth(T);
  await L.docWhen(T, 'm10_who', false, 240000); await T.wait(1000); await sc.talk(T);
  await L.until(T, "V13.c10().ejiro", 240000, 'ejiro open');
  await sc.use(T, 'Talk to Ejiro'); await sc.talk(T, ['under arrest']);
  T.log('  after ejiro', await L.flags(T), await L.st(T));
  await L.until(T, "V13.c10().phase === 'jetty'", 240000, 'jetty');
  await L.aim(T, 0.2, -16.0);
  let r = await L.watch(T, 0.2, -16.0, 240000);
  T.log('  watch boat →', r, await L.st(T));
  await sc.talk(T);                                      // m10_obs_boat
  await L.talkWhen(T, ['both'], 120000);                 // m10_jetty
  await T.wait(2500); await L.shot(T, 'both');
  await L.talkWhen(T, [], 120000);                       // m10_arrest, then m10_boatman straight after
  await L.talkWhen(T, ['in the car'], 120000);           // the statement: car
  await L.talkWhen(T, [], 120000);                       // m10_end
  await L.aftermath(T, 'A both');
  // ---------- B: follow ----------
  await opening(T, 'B', ['Migwo', 'help him sleep', 'No, Mama']);
  T.log('  after karo', await L.flags(T));
  await L.until(T, "V13.c10().phase === 'cashout'", 240000, 'at T4');
  await observeBoth(T);
  await L.docWhen(T, 'm10_who', false, 240000); await T.wait(1000); await sc.talk(T);
  await L.until(T, "V13.c10().ejiro", 240000, 'ejiro open');
  await sc.use(T, 'Talk to Ejiro'); await sc.talk(T, ['Close early']);
  // stay at the buka, looking at the market, and don't watch the boat
  await T.ev(() => { const p = ENGINE.player; p.position.set(3.4, 0, -9.5); p.rotation.y = 0; ENGINE.cameraYaw = ENGINE.playerYaw = 0; });
  await L.until(T, "V13.c10().phase === 'jetty'", 240000, 'jetty');
  await L.talkWhen(T, ['follow the money'], 240000);     // m10_jetty, no boat caption
  await T.wait(3000); await L.shot(T, 'follow');
  await L.talkWhen(T, [], 120000);                       // m10_follow
  await L.talkWhen(T, [], 120000);                       // m10_end
  await L.aftermath(T, 'B follow');
  // ---------- C: made, and caught ----------
  await opening(T, 'C', ['bitter leaf', 'NACECA, ma']);
  await L.until(T, "V13.c10().phase === 'cashout'", 240000, 'at T4');
  const st = await L.watch(T, -2.4, -1.2, 120000, "V13.c10().phase === 'made'");
  T.log('  stare →', st, await L.st(T));
  await L.talkWhen(T);                                   // m10_made
  await T.ev(() => { V13.c10speed = 1; });               // real time, so the catch registers between frames
  for (let k = 0; k < 120; k++) {
    const s = await T.ev(() => { const c = V13.rt.chase; if (!c) return 'over'; const r = c.runner.position; const p = ENGINE.player.position; p.x = r.x - 0.5; p.z = r.z + 0.5; return 'on'; });
    if (s === 'over') break; await T.wait(200);
  }
  T.log('  chase over', await L.st(T));
  await L.talkWhen(T, [], 60000);                        // m10_caught
  await L.talkWhen(T, [], 60000);                        // m10_arrest
  await T.wait(1000); await L.shot(T, 'caught');
  await L.fast(T);
  await L.docWhen(T, 'm10_who', false, 120000);
  await T.wait(1000);
  await L.talkWhen(T, ['show him'], 120000);             // the statement: threat
  await L.until(T, "ENGINE.interactables.some(i => i.label === 'Talk to Ejiro')", 120000, 'late ejiro');
  await sc.use(T, 'Talk to Ejiro'); await sc.talk(T, ['Close early']);
  await L.talkWhen(T, [], 120000);                       // m10_end
  await L.aftermath(T, 'C made/caught');
};
