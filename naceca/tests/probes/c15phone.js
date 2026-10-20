// Case 15 on a phone: strong history, but the gate (boats declined), the truth — and a wrong name on Monday (Osagie).
const L = require('./c15lib.js'), sc = L.sc;
module.exports = async function (T) {
  const ok = await sc.s2start(T, 'm15', L.STRONG);
  T.log('started', ok, JSON.stringify(await L.st(T)));
  await L.waitDialogue(T, 30000); await T.wait(2400); await L.shot(T, '01_brief_estab');
  await L.until(T, 'BARRISTER DANLADI'); await L.shot(T, '02_brief');
  await sc.talk(T);
  await L.waitFree(T); await T.wait(1500); await L.shot(T, '03_road');
  await sc.use(T, 'Tell Uche');
  await sc.talk(T, ['The gate']);
  await L.waitFree(T);
  await T.ev(() => { const P = ENGINE.player; P.position.set(0.6, 0, 27.0); });
  await L.waitDialogue(T, 15000); await T.wait(1500);
  await L.until(T, 'ACP Lawal, special task force'); await L.shot(T, '04_standoff');
  await sc.talk(T, ['Stand aside']);
  await L.waitFree(T, 20000);
  await T.ev(() => { const P = ENGINE.player; P.position.set(-2.0, 0, -12.0); ENGINE.cameraYaw = ENGINE.playerYaw = P.rotation.y = Math.PI; });
  await T.wait(1200);
  await T.ev(() => { const P = ENGINE.player; P.position.set(-6.4, 0, -16.6); P.rotation.y = 2.3; ENGINE.playerYaw = ENGINE.cameraYaw = 2.3; ENGINE.playerPitch = 0.2; });
  await T.wait(2200); await L.shot(T, '05_jetty');
  // get seen: in front of the gangway guard, and the meter pushed over (frames are too slow here to wait it out)
  await T.until(() => !!V13.rt.stealth, 60000);
  await T.ev(() => { const P = ENGINE.player; P.position.set(8.3, 0, -21.6); P.rotation.y = ENGINE.playerYaw = ENGINE.cameraYaw = Math.PI; V13.rt.guards[0].ch.rotation.y = 0; V13.eyesBump(1); });
  await T.until(() => !!V13.rt.made, 90000);
  T.log('made', await T.ev(() => String(V13.rt.made)));
  await T.until(() => (V13.rt.lost || 0) >= 3, 240000);
  await T.wait(1500); await L.shot(T, '05b_bags');
  T.log('lost', await T.ev(() => V13.rt.lost));
  await T.ev(() => { const P = ENGINE.player; P.position.set(6.95, 0, -25.6); });
  await T.until(() => !!V13.rt.boarded, 60000);
  T.log('boarded', await T.ev(() => JSON.stringify({ b:V13.rt.boarded, lost:V13.rt.lost })));
  await T.wait(2400);
  await sc.use(T, 'fuel tank');
  await L.waitDialogue(T); await T.wait(2200); await L.shot(T, '06_cashroom');
  await sc.talk(T); await sc.waitCards(T); await T.wait(1000);
  T.log('counted', JSON.stringify(await L.st(T)));
  await sc.use(T, 'Talk to the Senator');
  await L.waitDialogue(T); await T.wait(1600);
  await L.until(T, 'Do you know how many classrooms'); await L.shot(T, '07_senator');
  await L.until(T, 'DIRECTOR-GENERAL', ['Section 308']); await T.wait(500); await L.shot(T, '08_call');
  await L.until(T, 'Hands in front', ['arresting']);
  await sc.talk(T);
  T.log('friday over', JSON.stringify(await L.st(T)));
  // Monday: watch the hand-over (title card, black, loading, the office, the lead)
  const mon = () => T.ev(() => JSON.stringify({ dlg:document.getElementById('screen-dialogue').classList.contains('show') ? (document.getElementById('dlg-speaker').textContent + ': ' + document.getElementById('dlg-text').textContent.slice(0, 40)) : false,
    card:!!document.querySelector('#title-card.show'), black:(document.getElementById('c15-black') || { style:{} }).style.opacity || null, loading:!!document.querySelector('#v13-loading.show'),
    ov:typeof isOverlayOpen === 'function' && isOverlayOpen(), noOffice:!!V13.rt.noOffice, ready:ENVART.ready('abuja_office'), mv:ENGINE.movementEnabled, its:ENGINE.interactables.map(i => i.label).join('|') }));
  for (let k = 0; k < 40; k++) { const s = await mon(); T.log('   monday', k, s); if (/"dlg":"/.test(s)) break; await T.wait(3000); }
  await L.shot(T, '08b_monday');
  await L.waitDialogue(T, 240000); await sc.talk(T);
  for (let k = 0; k < 12; k++) { const s = await mon(); T.log('   lead done', k, s); if (/Director-General's door/.test(s)) break; await T.wait(2500); }
  await L.waitFree(T); await T.wait(600); await L.shot(T, '08c_lobby');
  await sc.use(T, 'Director-General');
  await L.accuse(T, 'osagie', ['dg_recording', 'visitor_book', 'senator_words'], '09_accuse');
  await L.waitDialogue(T, 20000); await T.wait(1500); await L.shot(T, '10_reveal');
  await L.until(T, 'Grace Osagie kept your drive'); await L.shot(T, '11_wrong');
  await sc.talk(T);
  await T.until(() => document.getElementById('screen-case15') && document.getElementById('screen-case15').classList.contains('show'), 15000);
  await T.wait(600); await L.shot(T, '12_case_card');
  await T.ev(() => document.getElementById('c15-done').click());
  await T.until(() => document.getElementById('screen-aftermath').classList.contains('show'), 15000);
  await T.wait(1200); await L.shot(T, '13_aftermath');
  T.log('aftermath', JSON.stringify(await L.st(T)), await T.ev(() => (document.querySelector('#aftermath-grid .head') && document.querySelector('#aftermath-grid .head').textContent) + ' · grade ' + ((document.querySelector('#aftermath-grid .grade-letter') || {}).textContent || '?')));
  await T.ev(() => document.getElementById('btn-aftermath-continue').click());
  const seen = await L.epilogue(T, [[0, '14_epi_lucky'], ['stinger', '15_stinger'], ['last', '16_season3']]);
  T.log('epilogue', seen.join(' · '));
  await T.wait(1200); await L.shot(T, '17_after');
  T.log('end', await T.ev(() => JSON.stringify({ title:document.getElementById('screen-title').classList.contains('show'), s2done:!!S.game.seasonTwoComplete, epi:V13._s2Epi, finale:V13.s2().finale })));
};
