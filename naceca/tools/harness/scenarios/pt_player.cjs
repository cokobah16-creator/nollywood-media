// pt_player (Team D): NEW PLAYER (two taps), the device id, play seconds per player, CLEAR (two taps), and the export:
// a .txt File through the share sheet on touch, .json through V12.saveFile on desktop or when sharing is refused.
//   node tools/harness/run.cjs tools/harness/scenarios/pt_player.cjs --html <build>/naceca.html --touch 1
//   node tools/harness/run.cjs tools/harness/scenarios/pt_player.cjs --html <build>/naceca.html --w 1280 --h 800
const P = require('./pt_lib.cjs');
const NAME = /^naceca-playtest-[A-Z0-9]{4}-P1-\d{8}-\d{4}\.txt$/;
module.exports = async h => {
  // the rows need a label or ?pt=1: the facilitator opens the game with ?pt=1 the first time
  await P.reload(h, '?pt=1');
  await h.start('m2', { completed:['m0', 'm1'] });
  const touch = await h.ev(() => document.body.classList.contains('touch-active'));
  h.log('touch', touch);
  // D-3: START AT M2 replaces the game in progress, so it is offered only on the title screen of a ?pt=1 page
  await P.openSettings(h);
  h.assert(await h.ev(() => !!document.getElementById('pt-new') && !document.getElementById('pt-m2')), 'Settings over the world: NEW PLAYER, but no START AT M2');
  await h.ev(() => { showOverlay(null); togglePause(); }); await h.step(150);
  await h.ev(() => document.getElementById('btn-pause-settings').click()); await h.step(200);
  h.assert(await h.ev(() => !!document.getElementById('pt-new') && !document.getElementById('pt-m2')), 'Settings from the pause menu: no START AT M2');
  await h.ev(() => showOverlay(null));
  await P.openSettings(h, 'screen-title');
  h.assert(await h.ev(() => !!document.getElementById('pt-m2')), 'Settings from the title screen of a ?pt=1 page: START AT M2');
  let labels = await P.rowLabels(h);
  h.assert(labels.includes('Player') && labels.includes('Summary'), 'with ?pt=1 the Player and Summary rows show ' + JSON.stringify(labels));
  const order = await h.ev(() => { const b = document.getElementById('settings-body'); const kids = [...b.children]; const g = kids.findIndex(k => k.classList.contains('set-group') && k.textContent.trim() === 'PLAYTEST');
    return kids.slice(g, g + 5).map(k => k.classList.contains('set-group') ? '#' + k.textContent.trim() : k.querySelector('.set-label').childNodes[0].textContent.trim()); });
  h.assert(JSON.stringify(order) === '["#PLAYTEST","Player","Summary","Playtest log","Two questions"]', 'Player and Summary come right after the PLAYTEST group ' + JSON.stringify(order));
  h.assert(/No player yet/.test(await h.ev(() => document.getElementById('pt-new').closest('.set-row').textContent)), 'no player yet');
  if(touch){
    const sz = await h.ev(() => ['#pt-new', '#pt-m2', '#pt-view', '#pt-export', '#pt-clear', '#pt-survey'].map(s => { const r = document.querySelector(s).getBoundingClientRect(); return [s, Math.round(r.width), Math.round(r.height)]; }));
    h.assert(sz.every(([, w, hh]) => w >= 44 && hh >= 44), 'PLAYTEST buttons are 44 px targets on touch ' + JSON.stringify(sz));
  }

  // the armed labels still fit: no sideways scroll
  const fit = await h.ev(() => { ['#pt-new', '#pt-m2', '#pt-clear'].forEach(s => document.querySelector(s).click()); const r = { sw:document.documentElement.scrollWidth, w:innerWidth,
    out:['#pt-new', '#pt-m2', '#pt-clear'].map(s => document.querySelector(s).getBoundingClientRect()).filter(b => b.right > innerWidth - 8).length }; renderSettings(); return r; });
  h.assert(fit.sw <= fit.w && fit.out === 0, 'the armed buttons fit the screen ' + JSON.stringify(fit));
  // (a) the two-tap arm
  const np = await P.newPlayerUI(h);
  h.log('new player', JSON.stringify(np));
  h.assert(np.armed === 'TAP AGAIN · START P1' && np.label0 === null, 'the first tap only arms: ' + np.armed);
  h.assert(np.label === 'P1' && /^[A-Z0-9]{4}$/.test(np.dev), 'the second tap starts P1 on a 4-character device id');
  const note = await h.ev(() => document.getElementById('pt-new').closest('.set-row').querySelector('.set-note').textContent);
  h.assert(note.startsWith(np.dev + '·P1 · ') && /since \d\d:\d\d/.test(note), 'the row prints dev·label: ' + note);
  // the arm expires after 4 s
  await h.ev(() => document.getElementById('pt-new').click());
  await h.step(4300);
  h.assert(await h.ev(() => document.getElementById('pt-new').textContent === 'NEW PLAYER' && V12.ptKit.label() === 'P1'), 'an armed tap goes back to NEW PLAYER after 4 s');

  // (b) later events carry p and a numeric ps; pt_player carries the payload
  let ev = await P.all(h);
  const pp = P.of(ev, 'pt_player').pop();
  h.log('pt_player', JSON.stringify(pp.d));
  h.assert(pp && pp.d.label === 'P1' && pp.d.dev === np.dev && pp.d.prev === null && typeof pp.d.ps0 === 'number' && pp.d.w > 0 && pp.d.h > 0 &&
    typeof pp.d.touch === 'boolean' && /^(portrait|landscape)$/.test(pp.d.orient) && pp.d.settings && pp.d.settings.casework, 'pt_player {label, dev, prev, ps0, w, h, touch, orient, settings}');
  await P.play(h, 50);
  await h.ev(() => V12.log('pt_test_a', {}));
  ev = await P.all(h);
  const a = P.of(ev, 'pt_test_a')[0];
  h.assert(a.d.p === 'P1' && typeof a.d.ps === 'number' && a.d.ps >= 49 && a.d.ps <= 52, 'events carry p and ps (play seconds since NEW PLAYER) ' + JSON.stringify(a.d));
  h.assert(await h.ev(() => V12._ptState.totals.misses === 0 && V12._ptState.totals.refusals === 0), 'the totals were reset at NEW PLAYER');

  // (c) export, player-scoped: the share sheet on touch, a .json download on desktop
  await P.stubSave(h); await P.stubShare(h, 'ok');
  await h.ev(() => V12.ptReportOpen('player'));
  await h.step(200);
  await h.ev(() => document.getElementById('pt-r-send').click());
  await h.step(400);
  let shared = await h.ev(() => window.__shared), saved = await h.ev(() => window.__saved);
  ev = await P.all(h);
  let px = P.of(ev, 'pt_export').pop();
  if(touch){
    h.assert(shared.length === 1 && shared[0].length === 1 && shared[0][0].type === 'text/plain' && NAME.test(shared[0][0].name) && shared[0][0].name.includes('-' + np.dev + '-'),
      'touch: share() gets one text/plain File named naceca-playtest-<dev>-P1-YYYYMMDD-HHMM.txt ' + JSON.stringify(shared));
    h.assert(saved.length === 0 && px.d.via === 'share' && px.d.file === shared[0][0].name, 'pt_export via share ' + JSON.stringify(px.d));
    const txt = (await P.sharedText(h))[0][0], j = JSON.parse(txt);
    h.assert(j.game === 'naceca' && j.ptv === 2 && j.dev === np.dev && j.player === 'P1' && j.src && j.exported && j.events.length > 0 && j.events.every(e => e.d.p === 'P1'),
      'the file is compact JSON {game, ptv:2, build, src, player, dev, exported, events} with only P1\'s events');
    h.assert(!/\n/.test(txt), 'compact JSON');
    // a NotAllowedError (the claude.ai frame) falls back to saveFile(.json); AbortError is the player saying no
    await P.stubShare(h, 'notallowed');
    await h.ev(() => document.getElementById('pt-r-send').click()); await h.step(400);
    saved = await h.ev(() => window.__saved); ev = await P.all(h); px = P.of(ev, 'pt_export').pop();
    h.assert(saved.length === 1 && /^naceca-playtest-[A-Z0-9]{4}-P1-\d{8}-\d{4}\.json$/.test(saved[0].name) && px.d.via === 'link', 'NotAllowedError → V12.saveFile(.json) ' + JSON.stringify([saved.map(s => s.name), px.d]));
    await P.stubShare(h, 'abort');
    await h.ev(() => document.getElementById('pt-r-send').click()); await h.step(400);
    saved = await h.ev(() => window.__saved); ev = await P.all(h); px = P.of(ev, 'pt_export').pop();
    h.assert(saved.length === 1 && px.d.via === 'declined', 'AbortError → declined, no download');
  } else {
    h.assert(shared.length === 0 && saved.length === 1 && /^naceca-playtest-[A-Z0-9]{4}-P1-\d{8}-\d{4}\.json$/.test(saved[0].name) && px.d.via === 'link', 'desktop: V12.saveFile(.json) ' + JSON.stringify([saved.map(s => s.name), px.d]));
    const j = JSON.parse(saved[0].data);
    h.assert(j.ptv === 2 && j.dev === np.dev && j.events.every(e => e.d.p === 'P1'), 'only P1\'s events');
  }
  // the Settings EXPORT button exports the whole device
  await P.stubSave(h); await P.stubShare(h, 'notallowed');
  await P.openSettings(h);
  await h.ev(() => document.getElementById('pt-export').click()); await h.step(400);
  saved = await h.ev(() => window.__saved);
  h.assert(saved.length === 1 && /-ALL-\d{8}-\d{4}\.json$/.test(saved[0].name) && JSON.parse(saved[0].data).player === null, 'EXPORT in Settings: the whole device ' + JSON.stringify(saved.map(s => s.name)));

  // two players without a reload get independent play time
  await P.openSettings(h);
  const np2 = await P.newPlayerUI(h);
  h.assert(np2.armed === 'TAP AGAIN · START P2' && np2.label === 'P2' && np2.dev === np.dev, 'the next player is P2 on the same device');
  await h.ev(() => V12.log('pt_test_b', {}));
  await P.play(h, 20);
  await h.ev(() => V12.log('pt_test_c', {}));
  ev = await P.all(h);
  const b = P.of(ev, 'pt_test_b')[0], c = P.of(ev, 'pt_test_c')[0], pp2 = P.of(ev, 'pt_player').pop();
  h.log('P2', JSON.stringify([b.d, c.d, pp2.d.ps0, pp2.d.prev]));
  h.assert(b.d.p === 'P2' && b.d.ps <= 1 && c.d.ps >= 19 && c.d.ps <= 21, 'P2\'s play seconds start at its NEW PLAYER, not at P1\'s');
  h.assert(pp2.d.prev === 'P1' && pp2.d.ps0 >= 50, 'pt_player carries prev and ps0 (the play seconds at the tap)');
  // the two questions report this player's play time, not the page's
  await h.ev(() => { V12.ptSurvey('settings'); document.getElementById('pt-a1').value = 'a'; document.getElementById('pt-a2').value = 'b'; document.getElementById('pt-save').click(); });
  await h.step(200);
  ev = await P.all(h);
  const sv = P.of(ev, 'survey').pop();
  h.assert(sv && sv.d.p === 'P2' && sv.d.secsPlayed >= 19 && sv.d.secsPlayed <= 21, 'survey.secsPlayed is relative to the player (' + (sv && sv.d.secsPlayed) + ', page total ~70)');
  await h.ev(() => showOverlay(null));

  // CLEAR: the first tap arms; the second empties the log and keeps the player, the save and the settings
  await h.ev(() => { saveGame(true); if(typeof saveSettings === 'function') saveSettings(); });
  await P.openSettings(h);
  const clr = await h.ev(() => { const b = document.getElementById('pt-clear'); b.click(); return { t:b.textContent, n:(JSON.parse(localStorage.getItem('naceca_pt_v1') || '[]') || []).length }; });
  h.assert(clr.t === 'TAP AGAIN · CLEAR' && clr.n > 0, 'one CLEAR tap only arms ' + JSON.stringify(clr));
  await h.ev(() => document.getElementById('pt-clear').click());
  await h.step(200);
  const after = await h.ev(() => ({ log:localStorage.getItem('naceca_pt_v1'), player:JSON.parse(localStorage.getItem('naceca_pt_player') || 'null'), save:!!localStorage.getItem(typeof SAVE_KEY !== 'undefined' ? SAVE_KEY : 'naceca_save_v1'),
    settings:!!localStorage.getItem(typeof SETTINGS_KEY !== 'undefined' ? SETTINGS_KEY : 'naceca_settings_v1'), note:(document.querySelector('#pt-export') || {}).closest ? document.querySelector('#pt-export').closest('.set-row').textContent : '' }));
  h.log('after clear', JSON.stringify(after).slice(0, 300));
  h.assert(!after.log || JSON.parse(after.log).length === 0, 'two CLEAR taps empty the log');
  h.assert(after.player && after.player.label === 'P2' && after.player.dev === np.dev && after.save && after.settings, 'CLEAR keeps naceca_pt_player, the save and the settings');
  h.assert(/^Playtest log0 events/.test(after.note.replace(/\s+/g, '')) || /0 events/.test(after.note), 'the log row reads 0 events after CLEAR: ' + after.note);

  // the facilitator's short-session start: START AT M2 (two taps) → a fresh Senior save with M0 and M1 done, at M2
  await P.openSettings(h, 'screen-title');
  const m2a = await h.ev(() => { const b = document.getElementById('pt-m2'); b.click(); return { t:b.textContent, m:S.game.currentMission }; });
  h.assert(m2a.t === 'TAP AGAIN · START AT M2', 'START AT M2 arms on the first tap');
  {
    const t0 = await P.mark(h);
    await h.ev(() => { S.game.currentMission = 'm1'; S.game.completedMissions = ['m0']; document.getElementById('pt-m2').click(); });
    await h.step(1200);
    const st = await h.ev(() => ({ m:S.game.currentMission, done:S.game.completedMissions.slice(), d:S.game.difficulty, shown:[...document.querySelectorAll('.overlay.show')].map(o => o.id) }));
    ev = await P.all(h);
    const ng = P.of(ev, 'new_game', t0);
    h.log('start at M2', JSON.stringify(st), JSON.stringify(ng.map(e => e.d)));
    h.assert(st.m === 'm2' && JSON.stringify(st.done) === '["m0","m1"]' && st.d === 'senior' && !st.shown.includes('screen-settings'), 'the second tap starts M2 on a fresh Senior save with M0 and M1 done');
    h.assert(await h.ev(() => V12.hasEv('co_madam')), 'and the cold open\'s "Tell Madam it\'s clean" phone, as after a full start');
    h.assert(ng.length === 1 && ng[0].d.d === 'senior' && ng[0].d.p === 'P2', 'it logs new_game {d:senior} for the player');
  }
  // the label and the device id survive a reload; the session event names the player
  const psBefore = await h.ev(() => V12.ptKit.ps());
  await P.reload(h, '');
  const k = await h.ev(() => ({ label:V12.ptKit.label(), dev:V12.ptKit.device(), rows:V12.ptKit.rowsShown() }));
  h.assert(k.label === 'P2' && k.dev === np.dev && k.rows, 'the label and device id survive a reload (and the rows show without ?pt=1) ' + JSON.stringify(k));
  await h.step(500);
  ev = await P.all(h);
  const ss = P.of(ev, 'session').pop();
  h.assert(ss && ss.d.ptv === 2 && ss.d.player === 'P2' && ss.d.p === 'P2' && typeof ss.d.tz === 'number', 'the session after a reload names the player ' + JSON.stringify(ss && ss.d).slice(0, 200));
  await h.ev(() => V12.log('pt_test_d', {}));
  ev = await P.all(h);
  const d = P.of(ev, 'pt_test_d')[0];
  h.assert(d.d.p === 'P2' && typeof d.d.ps === 'number', 'events after the reload still carry P2');
  // D-2: ps counts on from the player's NEW PLAYER across the reload (a facilitator reloads after a freeze)
  h.log('ps before the reload', psBefore, 'after', d.d.ps);
  h.assert(psBefore >= 19 && d.d.ps >= psBefore - 1 && d.d.ps <= psBefore + 4, `ps continues after a reload (${psBefore} before, ${d.d.ps} after)`);
  await P.play(h, 10);
  await h.ev(() => { V12.ptSurvey('settings'); document.getElementById('pt-a1').value = 'a'; document.getElementById('pt-a2').value = 'b'; document.getElementById('pt-save').click(); });
  await h.step(200);
  ev = await P.all(h);
  const sv2 = P.of(ev, 'survey').pop();
  h.assert(sv2 && sv2.d.secsPlayed >= psBefore + 9 && sv2.d.secsPlayed <= psBefore + 14, `survey.secsPlayed counts the play before the reload (${sv2 && sv2.d.secsPlayed}, ${psBefore} + 10 expected)`);
  await h.ev(() => showOverlay(null));
  // without ?pt=1 the rows stay (a label is set), but START AT M2 doesn't, even on the title screen
  await P.openSettings(h, 'screen-title');
  h.assert(await h.ev(() => !!document.getElementById('pt-new') && !document.getElementById('pt-m2')), 'no ?pt=1: NEW PLAYER, but no START AT M2 on the title screen');
  await h.ev(() => showOverlay(null));
  h.assert(h.errors.length === 0, 'no page errors');
};
