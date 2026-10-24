// Casework · "Hints when stuck" follows the casework a NEW investigation starts with (owner decision, 24 Oct):
// a Senior Agent start sets SETTINGS.hints 'off', a Recruit start 'on' — at the new-investigation sheet's BEGIN and at the
// playtest kit's START AT M2 only. A save loaded with 'on' stays 'on' (an existing save keeps whatever the device has); the
// Casework row in Settings and a mission-select replay leave it alone; the sheet and the Settings row say so; the 60 s toast
// still follows the setting; the new_game event carries hints next to the casework. Review fixes: the report reads the
// start's value (R1); the row, RESET TO DEFAULTS and the restore log settings {k:'hints', v, src} (R5); RESET during an
// investigation sets the casework's default (R3); a start abandoned before its first save gives the old save its setting
// back (R4).
//   node tools/harness/run.cjs tools/harness/scenarios/casework_hints_default.cjs --html <build> [--w 390 --h 844 --touch 1 | --w 1280 --h 800]
const P = require('./pt_lib.cjs');
const W = require('./wayfind_lib.cjs');
const SENIOR_LINE = 'Hints when stuck: off. Change it in Settings.';
const RECRUIT_LINE = 'Hints when stuck: on.';
const ROW_NOTE = 'A new investigation sets it: off for Senior Agent, on for Recruit.';
module.exports = async h => {
  const tag = await h.ev(() => innerWidth < 600 ? 'phone' : 'desk');
  const stored = () => h.ev(() => { try{ return (JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')).hints; }catch(e){ return 'unreadable'; } });
  const newGames = async t0 => P.of(await P.all(h), 'new_game', t0).map(e => e.d);
  const toTitle = () => h.ev(() => { showHUD(false); ENGINE.movementEnabled = false; showOverlay('screen-title'); });
  const sheetOpen = async () => { await h.ev(() => document.getElementById('btn-newgame').click()); await h.step(250); };
  const begin = async pick => {
    if(pick) await h.ev(v => document.querySelector(`#screen-newgame .cw-mode[data-v="${v}"]`).click(), pick);
    await h.step(60);
    await h.ev(() => document.querySelector('#screen-newgame [data-act="go"]').click());
    await h.step(900);
  };
  // the device as the protocol leaves it: hints on and stored, a save on it
  await h.ev(() => { ART.failed = true; ART.promise = null; try{ localStorage.removeItem('naceca_pt_v1'); }catch(e){}
    SETTINGS.hints = 'on'; saveSettings();
    const s = defaultState(); s.game.completedMissions = ['m0', 'm1']; localStorage.setItem(SAVE_KEY, JSON.stringify(s)); showOverlay('screen-title'); });
  h.assert(await stored() === 'on', 'the device starts with Hints when stuck on');

  // ---- 1. the sheet says it, in both modes, in the option's own style ----
  await sheetOpen();
  const sheet = await h.ev(() => {
    const ov = document.querySelector('#screen-newgame.show'); if(!ov) return null;
    const mode = v => ov.querySelector(`.cw-mode[data-v="${v}"]`);
    const line = v => { const el = mode(v).querySelector('.cw-hints'), sib = mode(v).querySelector('.cw-ol'); if(!el) return null;
      const cs = getComputedStyle(el), ss = getComputedStyle(sib);
      return { txt:el.textContent, cls:el.className, inOt:!!el.closest('.cw-ot'), color:cs.color, font:cs.fontFamily, sibColor:ss.color, sibFont:ss.fontFamily, bg:cs.backgroundImage }; };
    const r = ov.querySelector('.cw-sheet').getBoundingClientRect();
    return { recruit:line('recruit'), senior:line('senior'), text:ov.textContent, pressed:mode('senior').getAttribute('aria-pressed'),
      sizes:[...ov.querySelectorAll('button')].map(b => { const q = b.getBoundingClientRect(); return [Math.round(q.width), Math.round(q.height)]; }),
      fits:document.documentElement.scrollWidth <= innerWidth && r.left >= 0 && r.right <= innerWidth + 0.5,
      glyph:/[☀-➿\u{1F300}-\u{1FAFF}]/u.test(ov.textContent), icons:ov.querySelectorAll('.cw-hints svg, .cw-hints img, .cw-hints .ico').length };
  });
  h.assert(sheet, 'NEW INVESTIGATION opens the sheet');
  h.assert(sheet.senior && sheet.senior.txt === SENIOR_LINE && sheet.senior.inOt, 'under SENIOR AGENT: ' + JSON.stringify(sheet.senior));
  h.assert(sheet.recruit && sheet.recruit.txt === RECRUIT_LINE && sheet.recruit.inOt, 'under RECRUIT: ' + JSON.stringify(sheet.recruit));
  h.assert(/\bcw-ol\b/.test(sheet.senior.cls) && sheet.senior.color === sheet.senior.sibColor && sheet.senior.font === sheet.senior.sibFont
    && sheet.recruit.color === sheet.recruit.sibColor && sheet.senior.bg === 'none', 'the line is the option\'s own mono line: no new colour, no gradient');
  h.assert(!sheet.glyph && sheet.icons === 0, 'no glyphs or icons on the new lines');
  h.assert(sheet.pressed === 'true', 'Senior Agent is still preselected');
  h.assert(sheet.fits && sheet.sizes.every(([w, hh]) => w >= 44 && hh >= 44), 'the sheet still fits and every button is ≥ 44×44 ' + JSON.stringify(sheet.sizes));
  await h.shot('casework_hints_default_' + tag);

  // ---- 2. BEGIN as Senior Agent: off, saved, logged ----
  let t0 = await P.mark(h);
  await begin(null);
  let st = await h.ev(() => ({ d:S.game.difficulty, m:S.game.currentMission, hints:SETTINGS.hints, trail:(CW.trail.filter(t => t[0] === 'hints_default').pop() || [])[1] || null }));
  h.assert(st.d === 'senior' && st.m === 'm0', 'a Senior investigation starts at the cold open as before');
  h.assert(st.hints === 'off' && await stored() === 'off', 'BEGIN as Senior Agent sets Hints when stuck off and saves the settings');
  h.assert(st.trail && st.trail.d === 'senior' && st.trail.hints === 'off', 'the casework trail records it ' + JSON.stringify(st.trail));
  let ng = await newGames(t0);
  h.assert(ng.length === 1 && ng[0].d === 'senior' && ng[0].hints === 'off', 'new_game {d:senior, hints:off} ' + JSON.stringify(ng));

  // ---- 3. BEGIN as Recruit: on ----
  await toTitle(); await sheetOpen();
  t0 = await P.mark(h);
  await begin('recruit');
  st = await h.ev(() => ({ d:S.game.difficulty, hints:SETTINGS.hints, cls:document.body.classList.contains('cw-recruit') }));
  h.assert(st.d === 'recruit' && st.cls && st.hints === 'on' && await stored() === 'on', 'BEGIN as Recruit sets Hints when stuck on');
  ng = await newGames(t0);
  h.assert(ng.length === 1 && ng[0].d === 'recruit' && ng[0].hints === 'on', 'new_game {d:recruit, hints:on} ' + JSON.stringify(ng));

  // ---- 4. a loaded save keeps the device's value, either way ----
  st = await h.ev(() => {
    SETTINGS.hints = 'on'; saveSettings();
    const s = defaultState(); s.game.difficulty = 'senior'; s.game.completedMissions = ['m0', 'm1']; localStorage.setItem(SAVE_KEY, JSON.stringify(s));
    S = defaultState(); S.game.difficulty = 'recruit'; syncDifficultyClass();
    showHUD(false); ENGINE.movementEnabled = false; showOverlay('screen-title');
    document.getElementById('btn-continue').disabled = false; document.getElementById('btn-continue').click();
    return { d:S.game.difficulty, hints:SETTINGS.hints, cls:document.body.classList.contains('cw-senior') };
  });
  h.assert(st.d === 'senior' && st.cls && st.hints === 'on' && await stored() === 'on', 'CONTINUE on a Senior save with hints on: it stays on');
  st = await h.ev(() => { SETTINGS.hints = 'off'; saveSettings();
    const s = defaultState(); s.game.difficulty = 'recruit'; s.game.completedMissions = ['m0', 'm1']; localStorage.setItem(SAVE_KEY, JSON.stringify(s));
    loadGame(); return { d:S.game.difficulty, hints:SETTINGS.hints }; });
  h.assert(st.d === 'recruit' && st.hints === 'off' && await stored() === 'off', 'loading a Recruit save with hints off: it stays off');
  st = await h.ev(() => { const s = defaultState(); delete s.game.difficulty; s.game.completedMissions = ['m0', 'm1', 'm2']; localStorage.setItem(SAVE_KEY, JSON.stringify(s));
    loadGame(); return { d:S.game.difficulty, hints:SETTINGS.hints }; });
  h.assert(st.d === 'senior' && st.hints === 'off', 'an old save (no casework) loads as Senior and leaves the device\'s hints alone');

  // ---- 5. Settings: the row's note; a Casework change there leaves hints alone ----
  await h.start('m1', { completed:['m0'] });
  st = await h.ev(() => {
    SETTINGS.hints = 'off'; saveSettings(); openSettings();
    const row = document.querySelector('#settings-body .set-row[data-key="hints"]');
    const out = { note:row ? (row.querySelector('.set-note') || {}).textContent || null : null, on:row ? (row.querySelector('button.on') || {}).dataset.v : null };
    document.querySelector('#settings-body .set-row[data-key="casework"] button[data-v="recruit"]').click(); out.afterRecruit = SETTINGS.hints; out.dRecruit = S.game.difficulty;
    document.querySelector('#settings-body .set-row[data-key="casework"] button[data-v="senior"]').click(); out.afterSenior = SETTINGS.hints; out.dSenior = S.game.difficulty;
    out.stored = (JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')).hints;
    closeSettings(); return out;
  });
  h.assert(st.note === ROW_NOTE, 'the Settings row says the default per casework: ' + st.note);
  h.assert(st.on === 'off' && st.afterRecruit === 'off' && st.afterSenior === 'off' && st.stored === 'off' && st.dRecruit === 'recruit' && st.dSenior === 'senior',
    'changing Casework in Settings changes the casework and not Hints when stuck ' + JSON.stringify(st));

  // ---- 6. a mission-select replay leaves it alone ----
  await h.ev(() => { S.game.completedMissions = ['m0', 'm1']; saveGame(true); SETTINGS.hints = 'on'; saveSettings(); showOverlay(null); document.getElementById('btn-mission-select').click(); });
  await h.step(300);
  await h.ev(() => document.querySelector('#mission-grid .mission-card[data-mid="m2"]').click());
  await h.step(700);
  await h.ev(() => { if(document.querySelector('#screen-controls.show')) beginMission('m2'); });
  await h.step(1200);
  st = await h.ev(() => ({ m:S.game.currentMission, d:S.game.difficulty, hints:SETTINGS.hints }));
  h.assert(st.m === 'm2' && st.d === 'senior' && st.hints === 'on' && await stored() === 'on', 'a mission-select replay leaves Hints when stuck as it was ' + JSON.stringify(st));

  // ---- 7. the 60 s toast is unchanged: nothing with hints off, the next step with hints on ----
  await W.start(h, 'm2', { completed:['m0', 'm1'] });
  await W.realClock(h);
  await h.step(300);
  const toastWith = v => h.ev(v => { SETTINGS.hints = v; const t = document.getElementById('toast'); t.classList.remove('show'); t.innerHTML = '';
    GUIDE.lastSig = progressSig(); GUIDE.lastProgress = performance.now() - 61000; GUIDE._lastRun = performance.now(); updateGuidance(0.016); return t.textContent; }, v);
  const off = await toastWith('off'), on = await toastWith('on');
  h.assert(!/Try this next/.test(off) && /Try this next: Speak with informant Tunde/.test(on), 'the 60 s toast follows the setting as before ' + JSON.stringify({ off, on }));

  // ---- 8. START AT M2 (the facilitator's short start on a ?pt=1 page): a fresh Senior save → off ----
  await h.ev(() => { SETTINGS.hints = 'on'; saveSettings(); });
  await P.reload(h, '?pt=1');
  await h.ev(() => { ART.failed = true; ART.promise = null; });
  const ss = P.of(await P.all(h), 'session').pop();
  h.assert(ss && ss.d.settings && ss.d.settings.hints === 'on' && 'casework' in ss.d.settings, 'the session event carries the device\'s hints at load, next to the casework ' + JSON.stringify(ss && ss.d.settings));
  await P.openSettings(h, 'screen-title');
  h.assert(await h.ev(() => !!document.getElementById('pt-m2')), 'START AT M2 is offered on the title screen of a ?pt=1 page');
  t0 = await P.mark(h);
  await h.ev(() => document.getElementById('pt-m2').click());
  await h.step(100);
  await h.ev(() => document.getElementById('pt-m2').click());
  await h.step(1200);
  st = await h.ev(() => ({ m:S.game.currentMission, d:S.game.difficulty, hints:SETTINGS.hints, done:S.game.completedMissions.slice() }));
  h.assert(st.m === 'm2' && st.d === 'senior' && JSON.stringify(st.done) === '["m0","m1"]', 'START AT M2: a fresh Senior save at the market ' + JSON.stringify(st));
  h.assert(st.hints === 'off' && await stored() === 'off', 'START AT M2 sets Hints when stuck off and saves it');
  ng = await newGames(t0);
  h.assert(ng.length === 1 && ng[0].d === 'senior' && ng[0].hints === 'off', 'START AT M2 logs new_game {d:senior, hints:off} ' + JSON.stringify(ng));
  // and the Settings row now reads Off
  await h.ev(() => { showHUD(false); ENGINE.movementEnabled = false; togglePause(); });
  await h.step(150);
  st = await h.ev(() => { openSettings(); const r = document.querySelector('#settings-body .set-row[data-key="hints"]'); const o = { on:(r.querySelector('button.on') || {}).dataset.v, note:(r.querySelector('.set-note') || {}).textContent }; closeSettings(); return o; });
  h.assert(st.on === 'off' && st.note === ROW_NOTE, 'after START AT M2 the row reads Off, with its note ' + JSON.stringify(st));

  // ---- 9. the report reads the start's value, not the device's value at load: "hints when stuck off" (R1) ----
  const leadFor = t0 => h.ev(t0 => {
    const R = V12.ptReport, all = R.dedupe(R.normalize({ ok:true, events:V12.ptKit.events() }, 'now.json'));
    const p = R.players(all).find(p => p.events.some(e => e.type === 'new_game' && e.t >= t0));
    return p ? R.leadLine(R.meta(p.events)) : null;
  }, t0);
  let lead = await leadFor(t0);
  h.assert(lead && /Senior Agent · hints when stuck off ·/.test(lead), 'after the Senior start (session logged with hints on) the report\'s lead line reads hints when stuck off: ' + lead);

  // ---- 10. the row logs its change; RESET TO DEFAULTS during an investigation sets the casework's default (R3, R5) ----
  const tReset = await P.mark(h);
  st = await h.ev(() => {
    const out = {}, q = v => document.querySelector(`#settings-body .set-row[data-key="hints"] button[data-v="${v}"]`);
    openSettings(); q('on').click(); out.rowOn = SETTINGS.hints;
    document.getElementById('btn-settings-reset').click();
    out.afterReset = SETTINGS.hints; out.row = (document.querySelector('#settings-body .set-row[data-key="hints"] button.on') || {}).dataset.v;
    out.d = S.game.difficulty; out.m = S.game.currentMission; out.pace = SETTINGS.difficulty; out.prev = SETTINGS.hintsPrev;
    out.stored = (JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')).hints;
    closeSettings(); return out;
  });
  h.assert(st.rowOn === 'on' && st.d === 'senior' && st.m === 'm2' && st.afterReset === 'off' && st.row === 'off' && st.stored === 'off' && st.pace === 'standard' && st.prev === undefined,
    'RESET TO DEFAULTS during a Senior investigation puts Hints when stuck back Off (the other rows reset) ' + JSON.stringify(st));
  let sets = P.of(await P.all(h), 'settings', tReset).map(e => e.d);
  h.assert(sets.length === 2 && sets[0].k === 'hints' && sets[0].v === 'on' && sets[0].src === 'row' && sets[1].k === 'hints' && sets[1].v === 'off' && sets[1].src === 'reset',
    'the row and the reset each log settings {k:hints, v, src} ' + JSON.stringify(sets));
  lead = await leadFor(t0);
  h.assert(lead && /hints when stuck off \(changed during play\)/.test(lead), 'the report prints the value in force and that it changed: ' + lead);
  st = await h.ev(() => { setGameDifficulty('recruit'); openSettings(); document.getElementById('btn-settings-reset').click(); const o = { hints:SETTINGS.hints, d:S.game.difficulty }; closeSettings(); return o; });
  h.assert(st.d === 'recruit' && st.hints === 'on', 'RESET during a Recruit investigation: On ' + JSON.stringify(st));
  await h.ev(() => { if(document.querySelector('#screen-pause.show')) togglePause(); showOverlay(null); });

  // ---- 11. a start abandoned before its first save: the old save stays on the device, and so does its setting (R4) ----
  // a Recruit save on the device, hints on → NEW INVESTIGATION → BEGIN (Senior) → quit to the title before any save → CONTINUE
  await h.ev(() => { SETTINGS.hints = 'on'; delete SETTINGS.hintsPrev; saveSettings();
    const s = defaultState(); s.game.difficulty = 'recruit'; s.game.completedMissions = ['m0', 'm1']; s.game.currentMission = 'm2'; localStorage.setItem(SAVE_KEY, JSON.stringify(s));
    showHUD(false); ENGINE.movementEnabled = false; showOverlay('screen-title'); });
  await sheetOpen();
  const tAb = await P.mark(h);
  await begin(null);
  st = await h.ev(() => ({ d:S.game.difficulty, m:S.game.currentMission, hints:SETTINGS.hints, prev:SETTINGS.hintsPrev, saveIs:JSON.parse(localStorage.getItem(SAVE_KEY)).game.difficulty,
    storedPrev:(JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')).hintsPrev }));
  h.assert(st.d === 'senior' && st.m === 'm0' && st.hints === 'off' && st.prev === 'on' && st.storedPrev === 'on' && st.saveIs === 'recruit',
    'BEGIN Senior over a Recruit save: off now, the value from before kept with the settings, the old save still on the device ' + JSON.stringify(st));
  st = await h.ev(() => { showHUD(false); ENGINE.movementEnabled = false; showOverlay('screen-title'); document.getElementById('btn-continue').disabled = false; document.getElementById('btn-continue').click();
    return { d:S.game.difficulty, hints:SETTINGS.hints, prev:SETTINGS.hintsPrev, trail:(CW.trail.filter(t => t[0] === 'hints_restore').pop() || [])[1] || null }; });
  h.assert(st.d === 'recruit' && st.hints === 'on' && await stored() === 'on' && st.prev === undefined && st.trail && st.trail.hints === 'on', 'CONTINUE on the old Recruit save: Hints when stuck comes back on ' + JSON.stringify(st));
  sets = P.of(await P.all(h), 'settings', tAb).map(e => e.d);
  h.assert(sets.length === 1 && sets[0].k === 'hints' && sets[0].v === 'on' && sets[0].src === 'restore', 'and the log says so: settings {k:hints, v:on, src:restore} ' + JSON.stringify(sets));
  // the normal path: the new investigation's first save makes it the one on the device; nothing comes back after it
  await toTitle(); await sheetOpen();
  await begin(null);
  st = await h.ev(() => { const a = { hints:SETTINGS.hints, prev:SETTINGS.hintsPrev }; saveGame(true);
    const b = { prev:SETTINGS.hintsPrev, storedPrev:(JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')).hintsPrev, saveIs:JSON.parse(localStorage.getItem(SAVE_KEY)).game.difficulty };
    showHUD(false); ENGINE.movementEnabled = false; showOverlay('screen-title'); document.getElementById('btn-continue').disabled = false; document.getElementById('btn-continue').click();
    return { a, b, after:{ d:S.game.difficulty, hints:SETTINGS.hints } }; });
  h.assert(st.a.hints === 'off' && st.a.prev === 'on' && st.b.prev === undefined && st.b.storedPrev === undefined && st.b.saveIs === 'senior' && st.after.d === 'senior' && st.after.hints === 'off' && await stored() === 'off',
    'once the new investigation has saved, the value from before is dropped and CONTINUE keeps off ' + JSON.stringify(st));
  // two starts abandoned in a row keep the first "before"; a start that lands on it drops it
  st = await h.ev(() => { SETTINGS.hints = 'on'; delete SETTINGS.hintsPrev; saveSettings(); const r = {}; CW.hintsForNewGame('senior'); r.one = [SETTINGS.hints, SETTINGS.hintsPrev]; CW.hintsForNewGame('senior'); r.two = [SETTINGS.hints, SETTINGS.hintsPrev]; CW.hintsForNewGame('recruit'); r.three = [SETTINGS.hints, SETTINGS.hintsPrev]; return r; });
  h.assert(st.one.join() === 'off,on' && st.two.join() === 'off,on' && st.three[0] === 'on' && st.three[1] == null, 'abandoned starts keep the first "before"; a Recruit start on a device that was on has nothing to give back ' + JSON.stringify(st));

  // ---- 12. RESET with no investigation running: the table's default On ----
  st = await h.ev(() => { S = defaultState(); SETTINGS.hints = 'off'; saveSettings(); openSettings(); document.getElementById('btn-settings-reset').click(); const o = { hints:SETTINGS.hints, m:S.game.currentMission }; closeSettings(); return o; });
  h.assert(st.m === null && st.hints === 'on', 'RESET with no investigation running: the table\'s default On ' + JSON.stringify(st));
  h.assert(h.errors.length === 0, 'no page errors');
  h.log('PASS casework_hints_default', tag);
};
