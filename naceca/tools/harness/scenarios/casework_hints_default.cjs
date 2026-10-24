// Casework · "Hints when stuck" follows the casework a NEW investigation starts with (owner decision, 24 Oct):
// a Senior Agent start sets SETTINGS.hints 'off', a Recruit start 'on' — at the new-investigation sheet's BEGIN and at the
// playtest kit's START AT M2 only. A save loaded with 'on' stays 'on' (an existing save keeps whatever the device has); the
// Casework row in Settings and a mission-select replay leave it alone; the sheet and the Settings row say so; the 60 s toast
// still follows the setting; the new_game event carries hints next to the casework.
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
  h.assert(h.errors.length === 0, 'no page errors');
  h.log('PASS casework_hints_default', tag);
};
