// screens team: Case 15's Monday, the season's epilogue, the desk shortcuts in Season 2, the awards. Desktop.
//   R02  the awards' descriptions say nothing about Season 1's answer
//   R03  in Season 2 the "J · CASE DESK" pill is gone (TAB · CASE FILE does the job) and the pause button reads
//        CASE FILE; in Season 1 both are back (J itself is routed by the guards team: SKIP until it lands)
//   SC1  pause menu → CASE FILE → BACK or Esc lands on the pause menu again, RESUME brings the HUD back (SKIP while the
//        pause button still opens Season 1's desk, before the guards' routing)
//   R14  the water clock runs at the game's timer rate (0: timed sequences off, it never runs out)
//   D9   Monday reaches the accusation without MONDAY_FALLBACK: with no art (the stub) at once, and after a hung
//        decode within the 12 s timeout
//   D17  a quit in the middle of the epilogue: Continue starts it again, and the end unlocks "Season Two"
const { L, sc, checks, OFFICE, shown, overlays, c15 } = require('./screens_lib.js');
module.exports = async function (T) {
  const C = checks(T);
  // ---------------- R02 ----------------
  const ach = await T.ev(() => ['before_he_said_it', 'ninth_floor', 'season_two'].map(id => (ACHIEVEMENTS.find(a => a.id === id) || {}).desc || '(missing)'));
  C.ok('R02-awards', ach[0] === 'Seal the right name before anyone says it out loud.' && ach[1] === 'Close Operation Upstream with the proof beyond doubt.' && !/Adaeze|Senator/.test(ach.join(' ')), JSON.stringify(ach));

  // ---------------- R03: the office (Season 2), then a Season 1 case ----------------
  T.log('h13', await sc.s2start(T, 'h13', OFFICE));
  await T.until(() => !document.querySelector('#title-card.show'), 20000); await T.wait(1000);
  const ui = () => T.ev(() => { const p = document.getElementById('btn-pause-desk'), d = document.getElementById('btn-desk');
    return { body:document.body.classList.contains('s2-casefile'), pill:d ? getComputedStyle(d).display : 'missing', pause:p ? p.textContent.trim() : 'missing', icon:!!(p && p.querySelector('svg')), cm:S.game.currentMission }; });
  const s2ui = await ui();
  C.ok('R03-season2', s2ui.body && s2ui.pill === 'none' && s2ui.pause === 'CASE FILE' && s2ui.icon, JSON.stringify(s2ui));
  await T.page.keyboard.press('j'); await T.wait(900);
  const j = await overlays(T);
  if (/screen-s2case/.test(j)) C.ok('R03-J-opens-casefile', true, j); else if (/screen-desk/.test(j)) C.skip('R03-J-opens-casefile', 'needs guards (v13_desk.js J → window.openDesk): J opened ' + j); else C.ok('R03-J-opens-casefile', false, j);
  await T.ev(() => { showOverlay(null); try { if (typeof closeDesk === 'function') closeDesk(); } catch (e) {} ENGINE.movementEnabled = true; showHUD(true); });
  // SC1: pause menu → CASE FILE → BACK (and Esc) goes back to the pause menu, and its RESUME brings the HUD back (on touch
  // the INTERACT, CASE FILE, sprint and pause buttons all live in #hud). Opened from the field, BACK puts the HUD back.
  const pst = () => T.ev(() => { const h = document.getElementById('hud');
    return { ov:[...document.querySelectorAll('.overlay.show')].map(o => o.id).join(','), hud:h ? getComputedStyle(h).display : 'missing', mv:ENGINE.movementEnabled }; });
  await T.ev(() => togglePause()); await T.wait(400);
  await T.ev(() => document.getElementById('btn-pause-desk').click()); await T.wait(800);
  const p1 = await overlays(T);
  if (/screen-desk/.test(p1)) {
    for (const id of ['R03-S2-pause-casefile-back', 'R03-S2-pause-casefile-esc', 'R03-S2-pause-resume-hud']) C.skip(id, 'needs guards (v13_desk.js pause CASE DESK → window.openDesk): the button opened ' + p1);
  } else {
    C.ok('R03-S2-pause-opens-casefile', /screen-s2case/.test(p1), p1);
    await T.ev(() => { const b = document.querySelector('#screen-s2case.show .s2c-done'); if (b) b.click(); }); await T.wait(1200);
    const back = await pst();
    C.ok('R03-S2-pause-casefile-back', back.ov === 'screen-pause', JSON.stringify(back));
    await T.ev(() => { if (!document.querySelector('#screen-pause.show')) togglePause(); document.getElementById('btn-pause-desk').click(); }); await T.wait(800);
    const open2 = await overlays(T);
    await T.page.keyboard.press('Escape'); await T.wait(1000);
    const esc = await pst();
    C.ok('R03-S2-pause-casefile-esc', /screen-s2case/.test(open2) && esc.ov === 'screen-pause', JSON.stringify({ open2, esc }));
    await T.ev(() => { const b = document.querySelector('#screen-pause.show #btn-resume'); if (b) b.click(); }); await T.wait(800);
    const res = await pst();
    C.ok('R03-S2-pause-resume-hud', res.ov === '' && res.hud !== 'none', JSON.stringify(res));
  }
  await T.ev(() => { showOverlay(null); try { if (typeof closeDesk === 'function') closeDesk(); } catch (e) {} ENGINE.movementEnabled = true; showHUD(true); });
  await T.ev(() => V13.openCaseFileS2()); await T.wait(500);
  await T.ev(() => { const b = document.querySelector('#screen-s2case.show .s2c-done'); if (b) b.click(); }); await T.wait(800);
  const field = await pst();
  C.ok('R03-S2-field-casefile-back', field.ov === '' && field.hud !== 'none', JSON.stringify(field));
  await T.ev(() => { showOverlay(null); loadMission('m1'); });
  await T.wait(1500); await T.ev(() => { if (document.querySelector('#screen-controls.show')) beginMission('m1'); });
  await T.until(() => S.game.currentMission === 'm1' && ENGINE.movementEnabled, 60000); await T.wait(1500);
  await T.ev(() => { if (typeof togglePause === 'function') { togglePause(); togglePause(); } });   // the label is set as the pause menu opens
  const s1ui = await ui();
  C.ok('R03-season1', !s1ui.body && s1ui.pill !== 'none' && s1ui.pill !== 'missing' && s1ui.pause === 'CASE DESK' && s1ui.icon, JSON.stringify(s1ui));
  await T.ev(() => { showOverlay(null); });

  // ---------------- R14: the water clock (by water, after the landing) ----------------
  T.log('m15 water', await sc.s2start(T, 'm15', L.STRONG));
  await L.waitDialogue(T, 30000); await sc.talk(T); await L.waitFree(T);
  await sc.use(T, 'Tell Uche'); await sc.talk(T, ['The water']); await sc.waitCards(T);
  await L.waitDialogue(T, 30000); await sc.talk(T); await L.waitFree(T);
  const clock = await T.ev(() => new Promise(res => {
    const t0 = V13.rt.tfT || 0, orig = window.timerRate;
    window.timerRate = () => 0;
    setTimeout(() => { const off = V13.rt.tfT; window.timerRate = () => 1;
      setTimeout(() => { const on = V13.rt.tfT; window.timerRate = orig; res({ t0, off, on }); }, 2000); }, 2000);
  }));
  C.ok('R14-water-clock', Math.abs(clock.off - clock.t0) < 0.05 && clock.on - clock.off > 1, JSON.stringify(clock));

  // ---------------- D9: Monday, with no art and with a hung decode ----------------
  T.log('m15', await c15(T, "S.game.moralChoices.s2_end = 'truth'; S.game.moralChoices.s2_raid_entry = 'gate';"));
  await T.ev(() => { V13.ev('barge_cash', 'Cash on the barge', 'good', 90); V13.ev('senator_words', 'The Senator on the jetty', 'good', 90); });
  // a device whose art loaded but whose ninth-floor decode never settles (ART.failed is put back once monday() has read it)
  const hung = await T.ev(() => { window.__t0 = Date.now(); const a = ART.failed; ART.failed = false; window.__envLoad = ENVART.load;
    ENVART.load = k => k === 'abuja_office' ? new Promise(() => {}) : window.__envLoad(k); V13._c15.monday(); setTimeout(() => { ART.failed = a; }, 1500); return true; });
  const hungOk = await T.until(() => document.getElementById('screen-dialogue').classList.contains('show'), 30000);
  const hungT = await T.ev(() => ({ s:Math.round((Date.now() - window.__t0) / 100) / 10, noOffice:!!V13.rt.noOffice, key:DLG.scriptKey }));
  C.ok('D9-hung-decode', hung && hungOk && hungT.noOffice && hungT.s >= 11 && hungT.s < 25, JSON.stringify(hungT));
  await T.ev(() => { ENVART.load = window.__envLoad; ART.failed = true; DLG.onComplete = null; endDialogue(); V13.rt.noOffice = false; });
  await T.wait(800);
  await T.ev(() => { window.__t0 = Date.now(); V13._c15.monday(); });
  const fbOk = await T.until(() => document.getElementById('screen-dialogue').classList.contains('show'), 30000);
  const fbT = await T.ev(() => ({ s:Math.round((Date.now() - window.__t0) / 100) / 10, noOffice:!!V13.rt.noOffice }));
  await sc.talk(T);
  const acc = await T.until(() => document.getElementById('screen-accuse15') && document.getElementById('screen-accuse15').classList.contains('show'), 30000);
  C.ok('D9-no-art', fbOk && fbT.noOffice && fbT.s < 10 && acc, JSON.stringify(fbT) + ' accusation=' + acc);

  // ---------------- through the reveal and the case card to the epilogue ----------------
  await L.accuse(T, 'dg', ['dg_recording', 'visitor_book', 'transfer_docket']);
  for (let k = 0; k < 8; k++) { await L.waitDialogue(T, 20000); await sc.talk(T); if (await shown(T, 'screen-case15')) break; await T.wait(800); }
  await T.until(() => document.getElementById('screen-case15') && document.getElementById('screen-case15').classList.contains('show'), 30000);
  await T.ev(() => document.getElementById('c15-done').click());
  await T.until(() => document.getElementById('screen-aftermath').classList.contains('show'), 30000); await T.wait(1200);
  await T.ev(() => document.getElementById('btn-aftermath-continue').click());
  await T.until(() => document.getElementById('screen-epilogue') && document.getElementById('screen-epilogue').classList.contains('show'), 30000);
  await T.wait(1500); await T.ev(() => { document.getElementById('screen-epilogue').click(); }); await T.wait(900); await T.ev(() => { document.getElementById('screen-epilogue').click(); }); await T.wait(900);
  const mid = await T.ev(() => ({ i:EPI.i, n:EPI.slides.length, pending:V13.s2().epiPending, saved:((JSON.parse(localStorage.getItem(SAVE_KEY) || '{}').game || {}).s2 || {}).epiPending, s2Epi:!!V13._s2Epi }));
  C.ok('D17-pending-saved', mid.pending === 1 && mid.saved === 1 && mid.i >= 1, JSON.stringify(mid));

  // ---------------- D17: the tab closes mid-epilogue; Continue ----------------
  await T.page.reload({ waitUntil:'load', timeout:180000 }); await T.wait(5000);
  await T.ev(() => { try { if (typeof ART !== 'undefined' && !ART.ready) ART.failed = true; } catch (e) {} });
  const before = await T.ev(() => ({ title:document.getElementById('screen-title').classList.contains('show'), ach:!!(JSON.parse(localStorage.getItem(ACH_KEY) || '{}') || {}).season_two }));
  await T.ev(() => { if (loadGame()) { if (typeof syncDifficultyClass === 'function') syncDifficultyClass(); resumeCampaign(); } });
  await T.wait(1500);
  const back = await T.ev(() => ({ epi:document.getElementById('screen-epilogue') && document.getElementById('screen-epilogue').classList.contains('show'), i:typeof EPI !== 'undefined' ? EPI.i : null, s2Epi:!!V13._s2Epi, missions:document.getElementById('screen-missions').classList.contains('show') }));
  C.ok('D17-continue-resumes', before.title && back.epi && back.s2Epi && back.i === 0 && !back.missions, JSON.stringify({ before, back }));
  const seen = await L.epilogue(T, []);
  T.log('epilogue', seen.join(' · '));
  await T.wait(1500);
  const end = await T.ev(() => ({ title:document.getElementById('screen-title').classList.contains('show'), ach:!!(JSON.parse(localStorage.getItem(ACH_KEY) || '{}') || {}).season_two,
    pending:V13.s2().epiPending, saved:((JSON.parse(localStorage.getItem(SAVE_KEY) || '{}').game || {}).s2 || {}).epiPending, s2done:!!S.game.seasonTwoComplete }));
  C.ok('D17-season-two-unlocked', end.title && end.ach && end.pending == null && end.saved == null && end.s2done && seen.some(s => /^stinger/.test(s)), JSON.stringify(end));
  C.done();
};
