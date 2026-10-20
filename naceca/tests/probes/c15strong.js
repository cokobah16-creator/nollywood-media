// Case 15, strong truth run: Ibinabo/Karo/Bitrus sources, D1 guilty, seal the DG, body-cam, by water,
// cash room, the Senator, truth, accuse the DG with three strong pieces → proven. Then the epilogue to the menu.
const L = require('./c15lib.js'), sc = L.sc;
module.exports = async function (T) {
  const ok = await sc.s2start(T, 'm15', L.STRONG);
  T.log('started', ok, JSON.stringify(await L.st(T)));
  // the brief
  await L.waitDialogue(T, 30000); await T.wait(2600);
  await L.shot(T, '01_brief_estab');
  await L.until(T, 'BARRISTER DANLADI'); await L.shot(T, '02_brief_hauwa');
  await L.until(T, 'COMMANDER OSAGIE'); await L.shot(T, '03_brief_osagie');
  await L.until(T, 'BITRUS'); await L.shot(T, '04_brief_phone');
  await L.until(T, 'IBINABO'); await L.shot(T, '05_brief_ibinabo');
  await sc.talk(T);
  await L.waitFree(T);
  T.log('after brief', JSON.stringify(await L.st(T)), await T.ev(() => ENGINE.interactables.map(i => i.label).join(' | ')));
  await L.shot(T, '06_road_free');
  // Osagie's envelope: the DG
  await sc.use(T, 'Seal a name');
  await T.until(() => document.getElementById('screen-seal15') && document.getElementById('screen-seal15').classList.contains('show'), 10000);
  await T.ev(() => document.querySelector('#screen-seal15 .acc-card[data-id="dg"]').click()); await T.wait(300);
  await L.shot(T, '07_seal');
  await T.ev(() => { const b = document.getElementById('s15-go'); b.click(); b.click(); });
  await sc.talk(T);
  await sc.use(T, 'body-camera');
  T.log('sealed', JSON.stringify(await L.st(T)), await T.ev(() => String(V13.rt.recording)));
  // the way in: water
  await sc.use(T, 'Tell Uche');
  await sc.talk(T, ['The water']);
  await sc.waitCards(T);
  await L.waitDialogue(T); await T.wait(1500); await L.shot(T, '08_water_arrive');
  await L.until(T, 'TASK FORCE COMMANDER'); await T.wait(600); await L.shot(T, '09_water_acp');
  await sc.talk(T);
  await L.waitFree(T);
  T.log('landed', JSON.stringify(await L.st(T)));
  const fps = async label => T.log('fps', label, await T.ev(() => new Promise(res => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 5000) requestAnimationFrame(f); else res(Math.round((performance.now() - t0) / n) + ' ms/frame, ' + ENGINE.extraSkinned.filter(c => c.visible).length + ' people drawn'); }; requestAnimationFrame(f); })));
  await T.wait(3000); await fps('landing');
  // the jetty: look along it from cover behind the skip, then walk the last bit onto the gangway
  await T.ev(() => { const P = ENGINE.player; P.position.set(-6.4, 0, -16.4); P.rotation.y = 2.2; ENGINE.playerYaw = ENGINE.cameraYaw = 2.35; ENGINE.playerPitch = 0.18; });
  await T.wait(4000); await fps('jetty view'); await L.shot(T, '10_jetty_stealth');
  await T.ev(() => { const P = ENGINE.player; P.position.set(5.2, 0, -21.8); ENGINE.cameraYaw = ENGINE.playerYaw = P.rotation.y = 2.6; });
  await T.wait(1500); await L.shot(T, '11_jetty_close');
  T.log('eyes', await T.ev(() => JSON.stringify({ v:V13.rt.eyes && +V13.rt.eyes.v.toFixed(2), made:V13.rt.made || null, tf:V13.rt.tfT && +V13.rt.tfT.toFixed(1) })));
  await T.ev(() => { const P = ENGINE.player; P.position.set(6.95, 0, -25.6); P.rotation.y = Math.PI; });
  await T.wait(1800);
  T.log('boarded', await T.ev(() => String(V13.rt.boarded)), await T.ev(() => ENGINE.interactables.map(i => i.label).join(' | ')));
  await T.wait(2600); await L.shot(T, '12_boarded');
  // the cash room
  await sc.use(T, 'door');
  await T.wait(2400); await L.shot(T, '13_door_open');
  await L.waitDialogue(T); await T.wait(2200); await L.shot(T, '14_cashroom');
  await sc.talk(T);
  await sc.waitCards(T); await T.wait(1500);
  T.log('counted', JSON.stringify(await L.st(T)));
  // the Senator
  await sc.use(T, 'Talk to the Senator');
  await L.waitDialogue(T); await T.wait(2000); await L.shot(T, '15_senator');
  await L.until(T, 'Do you know how many classrooms'); await L.shot(T, '16_senator_ots');
  await L.until(T, 'Section 308 of the Constitution', ['Section 308']); await L.shot(T, '17_hauwa');
  await L.until(T, 'phone buzzes'); await T.wait(500); await L.shot(T, '18_buzz');
  await L.until(T, 'DIRECTOR-GENERAL'); await T.wait(500); await L.shot(T, '19_call');
  await L.until(T, 'Uche is watching'); await L.shot(T, '20_call_uche');
  await T.wait(2600); await L.shot(T, '20b_wrists');
  await L.until(T, 'Hands in front', ['arresting']); await T.wait(900); await L.shot(T, '21_cuffs');
  await L.until(T, 'walked off his own jetty'); await T.wait(2500); await L.shot(T, '22_walked_off');
  await sc.talk(T);
  T.log('friday over', JSON.stringify(await L.st(T)));
  // Monday
  await L.waitDialogue(T, 240000); await T.wait(1500); await L.shot(T, '23_monday_lead');
  await sc.talk(T);
  await L.waitFree(T); await T.wait(800);
  await L.shot(T, '24_reception');
  await sc.use(T, 'Director-General');
  await L.accuse(T, 'dg', ['dg_recording', 'visitor_book', 'transfer_docket'], '25_accuse');
  await T.wait(2500); await L.shot(T, '26_walk_in');
  await L.waitDialogue(T, 20000); await T.wait(1200); await L.shot(T, '27_reveal');
  await L.until(T, 'You knew'); await L.shot(T, '28_you_knew');
  await L.until(T, 'I have a warrant for your arrest'); await L.shot(T, '29_osagie_warrant');
  await L.until(T, 'handcuffs'); await T.wait(3200); await L.shot(T, '30_handcuffs');
  await sc.talk(T);
  await T.until(() => document.getElementById('screen-case15') && document.getElementById('screen-case15').classList.contains('show'), 15000);
  await T.wait(600); await L.shot(T, '31_case_card');
  await T.ev(() => document.getElementById('c15-done').click());
  await T.until(() => document.getElementById('screen-aftermath').classList.contains('show'), 15000);
  await T.wait(1200); await L.shot(T, '32_aftermath');
  T.log('aftermath', JSON.stringify(await L.st(T)), await T.ev(() => (document.querySelector('#aftermath-grid .head') && document.querySelector('#aftermath-grid .head').textContent) + ' · grade ' + ((document.querySelector('#aftermath-grid .grade-letter') || {}).textContent || '?')));
  await T.ev(() => document.getElementById('btn-aftermath-continue').click());
  const seen = await L.epilogue(T, [[1, '33_epi_ejiro'], [8, '34_epi_hauwa'], ['stinger', '35_stinger'], ['last', '36_season3']]);
  T.log('epilogue', seen.join(' · '));
  await T.wait(1500); await L.shot(T, '37_after');
  T.log('end', await T.ev(() => JSON.stringify({ title:document.getElementById('screen-title').classList.contains('show'), s2done:!!S.game.seasonTwoComplete, epi:V13._s2Epi, finale:V13.s2().finale, saved:(JSON.parse(localStorage.getItem(SAVE_KEY) || '{}').game || {}).seasonTwoComplete })));
};
