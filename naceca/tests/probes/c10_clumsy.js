// Case 10, test 2 — the clumsy runs: the cold opener, get made, the chase.
//   run A: he gets away (s2_jetty follow), the BVN document answered wrong, Ejiro arrested afterwards
//   run B: caught after the chase (s2_jetty lucky, cash contested), threat statement, Ejiro sent home
const L = require('./c10_lib.js'), sc = L.sc;
async function toCashout(T, karoPicks) {
  await L.talkWhen(T);                                   // the intro
  await L.fast(T);
  await sc.use(T, 'Greet Mama Karo'); await sc.talk(T, karoPicks);
  T.log('  after karo', await L.flags(T), await L.st(T));
  await sc.use(T, 'blue kiosk'); await sc.talk(T);
  await L.until(T, "V13.c10().phase === 'cashout'", 240000, 'at T4');
}
async function getMade(T) {
  // walk right up to him and stare
  const r = await L.watch(T, -2.4, -1.2, 60000, "V13.c10().phase === 'made'");
  T.log('  stare →', r, await L.st(T));
  await L.shot(T, 'made');
  await L.talkWhen(T);                                   // m10_made
}
module.exports = async function (T) {
  // ---------- A: made, and he gets away ----------
  await L.start(T, 'A');
  await toCashout(T, ['NACECA', 'without you']);
  await getMade(T);
  await T.wait(1500); await L.shot(T, 'chase');
  await L.until(T, "V13.c10().phase === 'follow'", 120000, 'escaped');
  await L.talkWhen(T);                                   // m10_follow
  await L.docWhen(T, 'm10_who', true, 60000);            // answered wrong: contested
  await T.wait(1000); await sc.talk(T);
  T.log('  after doc', await L.flags(T));
  await L.until(T, "ENGINE.interactables.some(i => i.label === 'Talk to Ejiro')", 60000, 'late ejiro');
  await sc.use(T, 'Talk to Ejiro'); await sc.talk(T, ['under arrest']);
  await L.talkWhen(T, [], 60000);                        // m10_end
  await L.aftermath(T, 'A made/escaped');
  // ---------- B: made, and caught ----------
  await L.start(T, 'B'); T.log('  flags at start', await L.flags(T));
  await toCashout(T, ['bitter leaf', 'NACECA, ma']);
  await getMade(T);
  // run him down: real time (so the catch registers between frames), staying on his shoulder until the chase ends
  await T.ev(() => { V13.c10speed = 1; });
  for (let k = 0; k < 120; k++) {
    const st = await T.ev(() => { const c = V13.rt.chase; if (!c) return 'over'; const r = c.runner.position; const p = ENGINE.player.position; p.x = r.x - 0.5; p.z = r.z + 0.5; return 'on'; });
    if (st === 'over') break; await T.wait(200);
  }
  T.log('  chase over', await L.st(T));
  await L.talkWhen(T);                                   // m10_caught, then m10_arrest straight after
  await T.wait(1200); await L.shot(T, 'caught');
  await L.fast(T);
  await L.docWhen(T, 'm10_who', false, 60000);
  await T.wait(1000);
  await L.talkWhen(T, ['show him']);                     // the statement: threat
  await L.until(T, "ENGINE.interactables.some(i => i.label === 'Talk to Ejiro')", 60000, 'late ejiro');
  await sc.use(T, 'Talk to Ejiro'); await sc.talk(T, ['Close early']);
  await L.talkWhen(T, [], 60000);                        // m10_end
  await L.aftermath(T, 'B made/caught');
};
