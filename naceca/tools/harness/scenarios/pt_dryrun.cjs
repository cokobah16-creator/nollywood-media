// pt_dryrun: the facilitator's taps from docs/PLAYTEST-PROTOCOL.md on the REAL UI, before a session, at a desktop size
// and at a phone size. Every button the protocol names is pressed here, in the protocol's order, on a page opened with
// ?pt=1. The slice between the taps is scripted (the harness has no three.js); the second player's slice is skipped.
//
//   once per device   the first load timed to the title; SETTINGS › scroll to the bottom › PLAYTEST (the last group).
//   P1, M2 start      CLEAR (its arm times out after 4 s; then two taps) › NEW PLAYER ×2 (the row read as the facilitator
//                     reads it) › START AT M2 ×2 › the market's start screen › START MISSION. The slice: Tunde, the phone,
//                     KC caught by the game's own chase, the van before the table (THE TABLE FIRST and the three "n of 3"
//                     lines), ~90 s at the table on its own clock (the stuck help), three links filed on the real chips,
//                     the van, the Lagos office, the mansion to its aftermath, the two questions typed into the game's own
//                     sheet. CONTINUE › NIGHT SHIFT › the office at night › the menu through the control this layout has
//                     (phone: the round pause button top right; desktop: the MENU pill) › SETTINGS (NEW PLAYER there, no
//                     START AT M2) › Summary › VIEW (the player, WHOLE DEVICE and back) › SEND LOG (phone: the share sheet
//                     as .txt; blocked › .json; dismissed › nothing. desktop: .json) › BACK › EXPORT (phone: the share
//                     sheet; desktop: .json) › tools/pt_report.cjs --md on the folder (one player) › BACK › QUIT TO MENU
//                     (no confirmation) › the title › SETTINGS (START AT M2 is back, the player kept).
//   P2, M2 start      CLEAR ×2 (the player kept, 0 events) › NEW PLAYER ×2 (START P2) › START AT M2 ×2 (the device's save
//                     goes with it) › START MISSION › the menu during play (desktop: Esc) › SETTINGS (no START AT M2) › BACK ›
//                     RESUME. The
//                     freeze: a reload with ?pt=1 › CONTINUE greyed (nothing saved yet), the label and the minutes kept ›
//                     START AT M2 ×2 again under the same player › START MISSION. The save moved on to the mansion by the
//                     driver (the slice was played for P1); SKIP on the game's sheet › CONTINUE › the office at night › the
//                     menu › SETTINGS › Two questions › ANSWER (typed for the player, before SEND LOG) › SAVE ANSWERS back
//                     to Settings with the row redrawn › Summary › VIEW (P2, the typed answers) › SEND LOG › BACK › EXPORT ›
//                     the CLI again (two players, ACROSS 2 PLAYERS, each player's answers under their own name) › BACK ›
//                     QUIT TO MENU.
//   P3, full start    CLEAR ×2 › NEW PLAYER ×2 › BACK › NEW INVESTIGATION (the saved-investigation warning on a used device)
//                     › SENIOR AGENT (already selected) › BEGIN › the cold open. A reload in the cold open: CONTINUE is
//                     offered but it is the previous player's save (the protocol: NEW INVESTIGATION again).
//
//   node tools/harness/run.cjs tools/harness/scenarios/pt_dryrun.cjs --html <build>/naceca.html --w 1280 --h 800
//   node tools/harness/run.cjs tools/harness/scenarios/pt_dryrun.cjs --html <build>/naceca.html --w 390 --h 844 --touch 1
// PT_DRYRUN_OUT=<folder> keeps the session folder (the exports and report.md); otherwise a temp folder is removed.
// Harness concessions (the page has no three.js): the legacy scene builders (ART.failed, as h.start), the frozen clock and
// the 60 Hz stepper after START MISSION (as T.start), the phone's document solved by the driver, the mansion's four
// encounters logged by the driver (P.driveM3) and its extraction through the mission's own completion (as pt_slice_m3),
// P2's save moved on to the mansion by the driver. Those are the ONLY stand-ins: the run asserts the list (STAND_INS) and
// that KC was resolved by the game's own chase; the summaries (m2_summary at the van, m3_summary at the raid's end) are the
// real emitters'. Every string and every tap is the game's own. Nothing in the game is changed.
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const P = require('./pt_lib.cjs');
const T = P.T, WF = T.lib;
const BLIB = require('./v13_b_lib.cjs');

const A1 = 'Filing the links one at a time instead of guessing';
const A2 = 'The van would not let me leave until the table was done';
const B1 = 'Going in quiet through the gate';          // P2's answers, said aloud and typed by the facilitator
const B2 = 'The van refusing me twice';
const HEADS = ['WHERE DID THEY GET LOST?', 'WHICH INTERACTIONS FAILED?', 'DID THEY UNDERSTAND WHY THEY WERE SEEN?', 'DID THEY USE MORE THAN ONE APPROACH?'];
const HELP0 = 'Link two cards that are connected in the crime, not just known to each other. 0 of 3 inked.';
const VAN = ['0 of 3 links inked. Open the CASE FILE, pencil three pairs and FILE them.',
  '1 of 3 links inked. Pencil two more pairs and FILE them.',
  '2 of 3 links inked. Pencil one more pair and FILE it.'];
const SAVE_ALERT = 'You have a saved investigation. It stays on this device until the new one saves for the first time, after the briefing.';
// the documented concessions, and nothing else (a stand-in that appears here means a real emitter logged nothing)
const STAND_INS = ['document solved', 'enc m3_entry', 'enc m3_obi', 'enc m3_laptop', 'enc m3_child'];

module.exports = async h => {
  const keep = !!process.env.PT_DRYRUN_OUT;
  const out = keep ? path.resolve(process.env.PT_DRYRUN_OUT) : fs.mkdtempSync(path.join(os.tmpdir(), 'pt_dryrun_'));
  fs.mkdirSync(out, { recursive:true });
  try { await dryrun(h, out); }
  finally { if (!keep) fs.rmSync(out, { recursive:true, force:true }); }
  h.assert(h.errors.length === 0, 'no page errors');
};

async function dryrun(h, out) {
  const B = BLIB.lib(h);
  const shown = () => h.ev(() => [...document.querySelectorAll('.overlay.show')].map(o => o.id));
  const text = sel => h.ev(sel => { const e = document.querySelector(sel); return e ? e.textContent.replace(/\s+/g, ' ').trim() : null; }, sel);
  const tap = async (sel, ms = 150) => {
    const ok = await h.ev(sel => { const b = document.querySelector(sel); if (!b || b.disabled) return false; b.click(); return true; }, sel);
    h.assert(ok, 'tap ' + sel);
    await h.step(ms);
  };
  // the protocol's "twice, within a few seconds": the first tap arms (its text says so), the second does it
  const twoTaps = async (sel, armedText, ms = 250, between) => {
    const armed = await h.ev(sel => { const b = document.querySelector(sel); if (!b) return null; b.click(); return b.textContent; }, sel);
    h.assert(armed === armedText, `the first tap on ${sel} reads ${armedText}: ${armed}`);
    await h.step(120);
    if (between) await between();
    await tap(sel, ms);
  };
  const until = async (fn, arg, timeout = 8000, every = 100) => {
    const t0 = Date.now();
    for (;;) { let r = null; try { r = await h.ev(fn, arg); } catch (e) {} if (r) return r; if (Date.now() - t0 > timeout) return null; await h.step(every); }
  };
  const toastNow = () => h.ev(() => { const t = document.getElementById('toast'); return { big:((t.querySelector('.big') || {}).textContent || '').trim(), small:((t.querySelector('.small') || {}).textContent || '').trim(), show:t.classList.contains('show') }; });
  const playerRow = () => h.ev(() => { const b = document.getElementById('pt-new'); return b ? b.closest('.set-row').querySelector('.set-note').textContent.replace(/\s+/g, ' ').trim() : null; });
  const logRow = () => h.ev(() => document.getElementById('pt-export').closest('.set-row').querySelector('.set-note').textContent.replace(/\s+/g, ' ').trim());
  const qRow = () => h.ev(() => document.getElementById('pt-survey').closest('.set-row').querySelector('.set-note').textContent.replace(/\s+/g, ' ').trim());
  const foot = () => h.ev(() => {
    const s = document.getElementById('ops-status'), f = document.getElementById('ops-file'), o = V12.ops();
    return { status:s ? s.textContent.replace(/\s+/g, ' ').trim() : null, file:f ? f.textContent.replace(/\s+/g, ' ').trim() : null, fileOff:f ? f.disabled : null,
      pencils:o.pencils.length, inked:o.inked.length, o4:!!(S.game.objectives.find(x => x.id === 'o4_table') || {}).done };
  });
  const help = () => h.ev(() => { const e = document.querySelector('#ops-side .ops-help, #ops-side .ops-hint'); return e ? e.textContent.replace(/\s+/g, ' ').trim() : null; });
  const chip = id => h.ev(id => { const b = document.querySelector(`.ops-chip[data-id="${id}"]`); if (!b) return false; b.click(); return true; }, id);
  const at = (x, z) => h.ev(([x, z]) => { const p = ENGINE.player.position; p.x = x; p.z = z; }, [x, z]);
  const press = async (ms = 450) => { await h.ev(() => tryInteract()); await h.step(ms); };
  const dlg = async choice => { for (let i = 0; i < 8; i++) { const r = await T.finishDialogue(h); if (r === 'choice') { await T.choose(h, choice); continue; } break; } };
  const evs = (type, t0) => h.ev(([type, t0]) => V12.ptKit.events().filter(e => e.type === type && (t0 == null || e.t >= t0)).map(e => e.d), [type, t0 == null ? null : t0]);
  const kit = () => h.ev(() => ({ dev:V12.ptKit.device(), label:V12.ptKit.label(), ps:V12.ptKit.ps() }));
  const touch = await h.ev(() => document.body.classList.contains('touch-active'));
  const size = await h.ev(() => innerWidth + 'x' + innerHeight);
  // the harness has no three.js: the legacy scene builders, as every scenario's h.start sets them; again after a reload
  const legacy = () => WF.boot(h).then(() => h.ev(() => { ART.failed = true; ART.ready = false; ART.promise = null; }));
  const live = async () => { await WF.frozenClock(h); await WF.stepper(h); };   // the scripted slice steps the world (as T.start)
  h.log(`dry run on ${size}${touch ? ' touch' : ''} · session folder ${out}`);

  // the control that opens the menu during play, as the protocol names it for this layout (M1 of the stranger review):
  // a phone has no MENU pill (styles.css hides .hud-topleft-controls on touch); it has the round pause button top right
  const MENU = touch ? '#hud-pausebtn' : '#btn-pause';
  const menuOpen = async where => {
    const c = await h.ev(([sel, other]) => {
      const vis = e => { if (!e) return false; const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0; };
      const e = document.querySelector(sel), r = e.getBoundingClientRect();
      return { vis:vis(e), top:Math.round(r.top), left:Math.round(r.left), right:Math.round(innerWidth - r.right), w:Math.round(r.width), h:Math.round(r.height),
        text:e.textContent.replace(/\s+/g, ' ').trim(), aria:e.getAttribute('aria-label'), bars:e.querySelectorAll('i').length, otherVis:vis(document.querySelector(other)) };
    }, [MENU, touch ? '#btn-pause' : '#hud-pausebtn']);
    h.log(`the menu control (${where}): ${MENU} ${JSON.stringify(c)}`);
    if (touch) h.assert(c.vis && c.text === '' && c.aria === 'Pause' && c.bars === 2 && c.top < 40 && c.right < 40 && c.w >= 40 && c.h >= 40 && !c.otherVis,
      'phone: the round pause button (two bars, no text) at the top right; no MENU pill on this layout');
    else h.assert(c.vis && /MENU$/.test(c.text) && c.top < 40 && !c.otherVis, 'desktop: the MENU pill (ESC · MENU) at the top of the screen, beside the mission panel; no round pause button on this layout');
    await tap(MENU, 300);
    h.assert((await shown()).includes('screen-pause'), 'it opens the menu ' + JSON.stringify(await shown()));
  };

  /* ---------- once per device: open the game with ?pt=1; the first-load time is what the facilitator writes down ---------- */
  const u = new URL(h.page.url()); u.search = '?pt=1';
  const tLoad = Date.now();
  await h.page.goto(u.toString(), { waitUntil:'load', timeout:90000 });
  await h.page.waitForSelector('#screen-title.show', { timeout:90000 });
  h.log(`first load, open to title (harness, no three.js): ${((Date.now() - tLoad) / 1000).toFixed(1)} s`);
  await h.step(1200);
  h.assert(await text('#btn-newgame') === 'NEW INVESTIGATION', 'the title shows NEW INVESTIGATION');

  /* ---------- before each player: title › SETTINGS › scroll to the bottom › PLAYTEST ---------- */
  await tap('#btn-title-settings', 250);
  let sh = await shown();
  h.assert(sh.includes('screen-settings') && !sh.includes('screen-title'), 'the title\'s SETTINGS opens Settings ' + JSON.stringify(sh));
  const labels = await P.rowLabels(h);
  h.assert(['Player', 'Summary', 'Playtest log', 'Two questions'].every(l => labels.includes(l)), 'PLAYTEST shows Player, Summary, Playtest log and Two questions on a ?pt=1 page ' + JSON.stringify(labels));
  const geo = await h.ev(() => { const gs = [...document.querySelectorAll('#settings-body .set-group')], n = document.getElementById('pt-new');
    return { last:gs.length ? gs[gs.length - 1].textContent.trim() : null, ptTop:n ? Math.round(n.getBoundingClientRect().top) : null, vh:innerHeight }; });
  h.log('PLAYTEST in Settings: ' + JSON.stringify(geo) + (geo.ptTop > geo.vh ? ' (below the fold: the protocol says scroll to the bottom)' : ''));
  h.assert(geo.last === 'PLAYTEST', 'PLAYTEST is the last group in Settings (scroll to the bottom)');
  h.assert(/^No player yet/.test(await playerRow() || ''), 'a fresh device: "No player yet"');
  const def = await h.ev(() => ({ pace:SETTINGS.difficulty, hints:SETTINGS.hints, marker:SETTINGS.marker }));
  h.log('settings at the hand-over: ' + JSON.stringify(def));
  h.assert(def.pace === 'standard' && def.marker === 'on' && /^(on|off)$/.test(def.hints), 'the defaults the protocol names (Hints when stuck is set by the start, below; recorded either way)');
  // the protocol's step 1: a device that names a player is exported first; a fresh one ("No player yet") holds only the
  // page's own events (session, quit), which the report would print as a "no player label" block, so CLEAR, twice.
  // "twice, within a few seconds": the arm times out after 4 s, and a late second tap only arms again
  h.log('log row before CLEAR: ' + await logRow());
  const armedC = await h.ev(() => { const b = document.getElementById('pt-clear'); b.click(); return b.textContent; });
  h.assert(armedC === 'TAP AGAIN · CLEAR', 'the first CLEAR tap only arms: ' + armedC);
  await h.step(4300);
  h.assert(await text('#pt-clear') === 'CLEAR' && !/^0 events/.test(await logRow()), 'after 4 s the arm is gone (the button reads CLEAR again, nothing cleared): the protocol says "within a few seconds"');
  await twoTaps('#pt-clear', 'TAP AGAIN · CLEAR');
  h.assert(/^0 events/.test(await logRow()), 'two CLEAR taps: the log row reads 0 events: ' + await logRow());
  h.assert(/^No player yet/.test(await playerRow() || ''), 'CLEAR keeps the Player row');

  // NEW PLAYER, two taps; the row then prints the device id and the label together
  await twoTaps('#pt-new', 'TAP AGAIN · START P1');
  const row = await playerRow();
  const m = (row || '').match(/^([A-Z0-9]{4})·(P\d+) · (\d+) events? since (\d\d:\d\d)\./);
  h.assert(m, 'the Player row prints dev·label · n events since HH:MM: ' + row);
  const dev = m[1], label = m[2], name = dev + '·' + label;
  h.assert(label === 'P1' && +m[3] >= 1, 'the first player on the device is P1');
  h.assert((await kit()).dev === dev && (await kit()).label === label, 'the row prints the kit\'s own device id and label');
  h.log(`player ${name} · started ${m[4]}`);
  const t0 = await P.mark(h);

  // START AT M2, two taps: only on this page (?pt=1) and only from the title's Settings
  h.assert(await h.ev(() => !!document.getElementById('pt-m2')), 'START AT M2 is offered next to NEW PLAYER');
  await twoTaps('#pt-m2', 'TAP AGAIN · START AT M2', 700, legacy);
  const st = await h.ev(() => ({ m:S.game.currentMission, done:S.game.completedMissions.slice(), d:S.game.difficulty, ov:[...document.querySelectorAll('.overlay.show')].map(o => o.id),
    card:[document.getElementById('controls-mnum'), document.getElementById('controls-mname')].map(e => e.textContent.trim()).join(' · '), btn:document.getElementById('btn-start-mission').textContent.replace(/\s+/g, ' ').trim(),
    ev:(S.game.evidence || []).map(e => e.id), xp:S.player.xp, save:hasSave() }));
  h.log('start screen: ' + st.card + ' · button: ' + st.btn);
  h.assert(st.m === 'm2' && st.done.join() === 'm0,m1' && st.d === 'senior' && st.ov.includes('screen-controls') && !st.ov.includes('screen-settings'),
    'the second tap: the market\'s start screen on a fresh Senior Agent save with M0 and M1 done ' + JSON.stringify(st));
  h.assert(st.ev.includes('co_madam') && !st.xp, 'the cold open\'s phone, no XP');
  h.assert(/LAGOS MARKET PATROL/.test(st.card), 'the start screen names the market: ' + st.card);
  h.assert(st.btn === 'START MISSION', 'the start screen\'s button reads START MISSION (the protocol names it so): ' + st.btn);
  h.assert(!st.save, 'START AT M2 leaves no save file (CONTINUE is greyed until this player saves)');
  const ng = await evs('new_game', t0);
  h.assert(ng.length === 1 && ng[0].d === 'senior' && ng[0].p === label, 'new_game {d:senior} is logged for the player');
  // the start sets "Hints when stuck" for the casework (decided 24 Oct): a Senior Agent start turns it off, and says so
  const hs = await h.ev(() => SETTINGS.hints);
  h.assert(hs === 'off' && ng[0].hints === 'off', 'START AT M2 (Senior Agent) sets Hints when stuck off and new_game carries hints:off ' + JSON.stringify({ hs, ng:ng[0].hints }));

  /* ---------- hand over: START MISSION (the player's first tap) ---------- */
  await tap('#btn-start-mission', 900);
  h.assert(await h.ev(() => S.game.currentMission === 'm2' && ENGINE.movementEnabled && !document.querySelector('.overlay.show')), 'START MISSION: the market is live');
  await live();
  const standIns = [];

  /* ---------- the market: Tunde, the phone, KC ---------- */
  await P.play(h, 25);
  await at(-6, -0.4); await press(300); await dlg(0); await h.step(200);
  await P.standIn(h, t0, 'enc', { enc:'m2_tunde', side:'stall', seen:false, dist:13.1, ang:118, bark:false, choice:'quiet', tip:true, habit:true, wary:false }, standIns);
  await at(6.4, 4.2); await press(300); await h.step(1200);
  await h.ev(() => { if (typeof MINI !== 'undefined' && MINI.active) miniClose({ ok:true, won:true }); });
  await h.step(1000);
  await h.ev(() => { showOverlay(null); ENGINE.movementEnabled = true; if (!S.game._marketScanned) { S.game._marketScanned = true; completeObjective('o2_scan'); } });
  standIns.push('document solved');
  await P.play(h, 30);
  // 20 s standing on the open road near KC: whatever the eye logs is the real thing (nothing forced)
  const w0 = await h.ev(() => __wf.t);
  await T.walk(h, [[0, 6], [2.5, 4.5], [3.2, 4.2], [3.2, 4.0]], { speed:1.4, maxT:20 });
  await h.ev(w0 => { __wf.run(Math.max(0, 20 - (__wf.t - w0))); }, w0);
  await h.ev(() => { showOverlay(null); ENGINE.movementEnabled = true; });
  // the confront is a real press on KC; the chase and its outcome are the game's own (nothing forced)
  if (!(await h.ev(() => !!CHASE.active))) { await at(6.0, 5.4); await press(500); }
  if (await h.ev(() => !!CHASE.active)) { await T.pursue(h, { strategy:'follow', maxT:40, v:5.0 }); await h.step(300); await dlg(0); }
  await h.step(300);
  await P.play(h, 40);
  await P.standIn(h, t0, 'enc', { enc:'m2_kc', approach:'seen', intent:'direct', susp:100, level:'alarm', exposed:true, gap:2.0, scanSeen:false, side:'front', outcome:'caught', how:'tackle', secs:9.8,
    bumps:2, bumpsLane:1, trust:1, cutReached:false, ribbon:'off', prep:{ tip:true, habit:true, post:'van', posted:false, pursuit:false, tier:1, greyman:false, sources:false }, uche:{ post:'van', arrived:false, role:null } }, standIns);
  const kc = await h.ev(() => { const g = S.game; return { runner:g.moralChoices.market_runner || null, o3:!!(g.objectives.find(x => x.id === 'o3_runner') || {}).done }; });
  h.log('KC: ' + JSON.stringify(kc) + ' · seen events so far: ' + (await evs('seen', t0)).length);
  h.assert(/^(caught|escaped)$/.test(kc.runner || '') && kc.o3, 'KC was resolved by the game\'s own chase (no driver fallback): ' + JSON.stringify(kc));

  /* ---------- the van before the table: THE TABLE FIRST, and the three lines the protocol quotes ---------- */
  await h.ev(() => { showOverlay(null); ENGINE.movementEnabled = true; });
  await at(0, 12.5);
  const van0 = await h.ev(() => { tryInteract(); const t = document.getElementById('toast'); return { big:((t.querySelector('.big') || {}).textContent || '').trim(), small:((t.querySelector('.small') || {}).textContent || '').trim(), m:S.game.currentMission }; });
  await h.step(900);
  const vr = await evs('van_refused', t0);
  h.log('the van before the table: ' + JSON.stringify(van0) + ' ' + JSON.stringify(vr));
  h.assert(van0.m === 'm2' && van0.big === 'THE TABLE FIRST' && van0.small === VAN[0], 'the van refuses with the "0 of 3 links inked" line');
  h.assert(vr.length === 1 && vr[0].inked === 0 && vr[0].strikes === 0, 'van_refused {inked:0, strikes:0} once');
  const vanLines = await h.ev(() => [0, 1, 2].map(n => V12.vanTableLine(n)));
  h.assert(JSON.stringify(vanLines) === JSON.stringify(VAN), 'the van\'s three lines read as the protocol quotes them: ' + JSON.stringify(vanLines));
  await h.step(1300);   // the player reads the toast; the logger's 1 s sampler sees the field progress before the table opens

  /* ---------- the table: the goal line, ~90 s with nothing inked (the stuck help), three links filed ---------- */
  await h.ev(() => openCaseFile());   // TAB, or the CASE FILE button
  await h.step(400);
  let f = await foot();
  const tv = await toastNow();
  h.log('the table opens: ' + JSON.stringify(f) + ' toast ' + JSON.stringify(tv));
  h.assert((await shown()).join() === 'screen-ops', 'the CASE FILE opens the operations table');
  h.assert(f.status === 'LEKKI NEEDS 3 INKED · 0 SO FAR' && f.fileOff && f.file === 'Tap two cards to pencil a link', 'the foot: the goal line and the greyed FILE\'s caption');
  h.assert(!(tv.show && tv.big === 'THE TABLE FIRST'), 'the van\'s toast is off the opened table');
  h.assert(await help() === null, 'no help on a fresh table');
  // the stall: the table's own clock, as board_m2_help (not real time)
  const s91 = await h.ev(() => { V12.opsTableTick(91000); return { idle:V12._tableState.idle, atTable:V12.atTable() }; });
  await h.step(200);
  const hp = await help(), ht = await toastNow(), ts = await evs('table_stuck', t0), stk = (await evs('stuck', t0)).filter(d => d.at === 'table');
  const hints = await h.ev(() => SETTINGS.hints);
  h.log(`91 s at the table (hints ${hints}): help ${JSON.stringify(hp)} toast ${JSON.stringify(ht)} table_stuck ${JSON.stringify(ts)} stuck@table ${stk.length}`);
  h.assert(s91.atTable && s91.idle >= 91000, 'the table clock ran 91 s on the open table objective');
  h.assert(ts.length === 1 && ts[0].secs >= 90 && ts[0].secs <= 100 && ts[0].inked === 0 && ts[0].pencils === 0, 'table_stuck {secs, inked:0, pencils:0} once');
  h.assert(stk.length >= 1 && stk[0].obj === 'o4_table', 'the stuck log counts the table time (at:table)');
  // Senior Agent's 90 s process line names no card, so it comes with "Hints when stuck" off too (the Senior default);
  // the setting gates the HINT toast (board_m2_help, DESIGN-tactics.md §11.8)
  if (hints === 'on') h.assert(hp === HELP0 && ht.big === 'HINT' && ht.small === HELP0, 'Senior Agent, Hints when stuck on: the 90 s help is the process line, as a HINT and at the top of the side panel');
  else h.assert(hp === HELP0 && ht.big !== 'HINT', 'Senior Agent, Hints when stuck off (the default): the process line at the top of the side panel, no HINT toast (table_stuck is still logged) ' + JSON.stringify({ hp, ht }));
  await h.shot('dryrun-table-stuck');
  // three true links between cards on the Lagos table now, one filing at a time, on the real chips and FILE
  const links = await h.ev(() => { const g = id => ((V12.OPS_NODES.find(n => n.id === id) || { g:[] }).g || []).includes('lagos');
    return V12.OPS_LINKS.filter(l => g(l.a) && g(l.b) && V12.opsVisible(l.a) && V12.opsVisible(l.b) && document.querySelector(`.ops-chip[data-id="${l.a}"]`) && document.querySelector(`.ops-chip[data-id="${l.b}"]`)).map(l => [l.a, l.b]); });
  h.log('links that hold on the table now: ' + JSON.stringify(links));
  h.assert(links.length >= 3, 'at least three links hold between the cards on the table');
  for (let i = 0; i < 3; i++) {
    const [a, b] = links[i];
    h.assert(await chip(a) && await chip(b), `tap ${a} then ${b}`);
    await h.step(150);
    f = await foot();
    h.assert(f.pencils === 1 && !f.fileOff && f.file === 'FILE 1 LINK', `one pencil, FILE offers it (${a}|${b}) ` + JSON.stringify(f));
    await tap('#ops-file', 350);
    h.assert(await h.ev(() => !!document.querySelector('#ops-modal.show #bd-rul-ok')), 'the magistrate\'s ruling comes up');
    await tap('#bd-rul-ok', 250);
    f = await foot();
    h.assert(f.inked === i + 1 && f.pencils === 0, `${i + 1} inked after filing ${a}|${b} ` + JSON.stringify(f));
    if (i < 2) h.assert(f.status === `LEKKI NEEDS 3 INKED · ${i + 1} SO FAR`, 'the goal line counts the ink: ' + f.status);
    if (i === 0) h.assert(await help() === null, 'a new ink clears the stuck help');
    if (i === 0) h.assert(await h.ev(() => hasSave()), 'the first FILE on the table is this player\'s first save (the protocol\'s recovery line)');
  }
  h.assert(f.o4 && !/LEKKI NEEDS/.test(f.status || ''), 'three inked: the table objective closes and the goal line goes ' + JSON.stringify(f));
  await tap('#ops-close', 300);
  h.assert(!(await shown()).length, 'the table\'s X closes it');

  /* ---------- the van: to Lekki, through the Lagos office ---------- */
  await h.ev(() => { showOverlay(null); ENGINE.movementEnabled = true; });
  await at(0, 12.5); await press(400);
  const boarded = await h.ev(() => ({ done:S.game.completedMissions.includes('m2'), m:S.game.currentMission, card:!!document.querySelector('#title-card.show') }));
  h.log('the van: ' + JSON.stringify(boarded));
  h.assert(boarded.done && boarded.m !== 'm2', 'with three inked the van boards: M2 done');
  h.assert((await evs('van_refused', t0)).length === 1, 'boarding is not a refusal');
  h.assert((await evs('m2_summary', t0)).length === 1, 'm2_summary once, from the real emitter at the van');
  const reached = await office(h, B, until, shown);
  h.log('to the mansion: ' + JSON.stringify(reached));
  h.assert(reached.m === 'm3' && reached.ov.includes('screen-controls'), 'the mansion\'s start screen, after the office');
  h.assert(await text('#btn-start-mission') === 'START MISSION', 'the mansion\'s start screen button reads START MISSION');
  await tap('#btn-start-mission', 900);
  h.assert(await h.ev(() => S.game.currentMission === 'm3' && ENGINE.movementEnabled), 'the mansion is live');

  /* ---------- the mansion to its aftermath, the two questions over it ---------- */
  await P.driveM3(h, { standIns, summary:false });
  await h.ev(() => { showOverlay(null); if (S.game.currentMission === 'm3' && !(S.game.completedMissions || []).includes('m3')) completeMission('m3'); });
  const q = await until(() => document.querySelector('#screen-pt-survey.show') && document.querySelector('#screen-aftermath.show') ? [...document.querySelectorAll('.overlay.show')].map(o => o.id) : null, null, 6000);
  h.assert(q, 'the two questions come up over the aftermath ' + JSON.stringify(await shown()));
  const qs = await h.ev(() => [...document.querySelectorAll('#screen-pt-survey label.pt-q')].map(l => l.textContent.trim()));
  h.assert(qs.join('|') === 'What was your most satisfying decision?|What happened that felt unfair?', 'the two questions, word for word: ' + qs.join(' | '));
  await h.ev(([a1, a2]) => { document.getElementById('pt-a1').value = a1; document.getElementById('pt-a2').value = a2; }, [A1, A2]);
  await tap('#pt-save', 300);
  sh = await shown();
  h.assert(sh.includes('screen-aftermath') && !sh.includes('screen-pt-survey'), 'SAVE ANSWERS returns to the aftermath ' + JSON.stringify(sh));
  const sv = await evs('survey', t0);
  h.assert(sv.length === 1 && sv[0].satisfying === A1 && sv[0].unfair === A2 && sv[0].p === label && sv[0].where === 'slice:m3', 'the answers are in the log, verbatim, for the player');
  h.assert((await evs('m3_summary', t0)).length === 1, 'm3_summary once, from the real emitter at the raid\'s end');
  h.log('stand-ins this run: ' + JSON.stringify(standIns));
  h.assert(JSON.stringify(standIns) === JSON.stringify(STAND_INS), 'the stand-ins are exactly the documented concessions (any other means a real emitter logged nothing): ' + JSON.stringify(standIns));

  /* ---------- collect the log: CONTINUE, the card, the menu through this layout's control, SETTINGS › PLAYTEST ---------- */
  await tap('#btn-aftermath-continue', 300);
  // after Lekki, CONTINUE plays a title card into the next scene (the night shift at HQ): a menu opened during the card
  // is closed when the scene begins, so the facilitator waits for the card to pass
  const card = await until(() => { const c = document.querySelector('#title-card.show'); return c ? c.textContent.replace(/\s+/g, ' ').trim() : null; }, null, 2500);
  h.log('after CONTINUE: ' + (card ? 'title card "' + card + '"' : 'no title card') + ' · ' + JSON.stringify(await shown()));
  h.assert(card && /NIGHT SHIFT/.test(card), 'a NIGHT SHIFT title card plays');
  h.assert(await until(() => !document.querySelector('#title-card.show') && ENGINE.movementEnabled && !document.querySelector('.overlay.show'), null, 8000), 'the next scene begins after the card');
  const next = await h.ev(() => ({ m:S.game.currentMission, obj:((S.game.objectives || []).find(o => !o.done) || {}).text || null }));
  h.log('the scene after the aftermath: ' + JSON.stringify(next));
  h.assert(next.m === 'm3n', 'the night shift at HQ follows the aftermath');
  await h.step(400);
  await menuOpen('the office at night');
  await tap('#btn-pause-settings', 250);
  h.assert((await shown()).includes('screen-settings') && !!(await h.ev(() => document.getElementById('pt-view'))), 'MENU › SETTINGS › PLAYTEST, two taps');
  h.assert(await h.ev(() => !!document.getElementById('pt-new') && !document.getElementById('pt-m2')), 'the menu\'s Settings has NEW PLAYER but no START AT M2 (the next player needs the title)');
  const rowAfter = await playerRow();
  h.assert((rowAfter || '').startsWith(name + ' · '), 'the Player row still names ' + name + ': ' + rowAfter);
  h.assert(await qRow() === '1 answer saved in the log.', 'the Two questions row counts the player\'s typed answers: ' + await qRow());
  // Summary › VIEW: the sheet names the same player and shows the same rows the report prints
  await tap('#pt-view', 400);
  h.assert((await shown()).includes('screen-pt-report'), 'Summary › VIEW opens the sheet');
  const readSheet = () => h.ev(() => { const ov = document.getElementById('screen-pt-report'); const rows = [...ov.querySelectorAll('.pt-sec li')].map(l => l.textContent.trim());
    return { title:ov.querySelector('.cw-title').textContent.trim(), lead:ov.querySelector('.pt-lead').textContent.trim(), heads:[...ov.querySelectorAll('.pt-sec h3')].map(x => x.textContent.trim()), rows,
      quotes:[...ov.querySelectorAll('.pt-quote')].map(x => x.textContent.trim()), scope:[...ov.querySelectorAll('.pt-scope button')].map(b => b.textContent.trim() + (b.classList.contains('on') ? '*' : '')),
      acts:[...ov.querySelectorAll('.pt-acts button')].map(b => b.textContent.trim()) }; });
  const sheet = await readSheet();
  h.log('the sheet: ' + sheet.title + ' · ' + sheet.lead);
  h.assert(sheet.title === name, 'the Summary sheet is for ' + name + ': ' + sheet.title);
  h.assert(sheet.scope.join() === label + '*,WHOLE DEVICE', 'the sheet opens on the player, with WHOLE DEVICE beside it ' + JSON.stringify(sheet.scope));
  h.assert(sheet.acts.includes('BACK') && sheet.acts.includes('SEND LOG'), 'the sheet has BACK and SEND LOG: ' + sheet.acts.join());
  h.assert(/Senior Agent/.test(sheet.lead) && new RegExp(touch ? '^Phone' : '^Desktop').test(sheet.lead), 'the lead line: device and casework ' + sheet.lead);
  const opsSheet = sheet.rows.find(r => /operations table:/.test(r));
  h.assert(opsSheet && /van refused ×1/.test(opsSheet) && /stuck at the table ×1/.test(opsSheet), 'the sheet\'s operations table row: ' + opsSheet);
  h.assert(sheet.quotes.some(x => x.includes(A1)) && sheet.quotes.some(x => x.includes(A2)), 'the sheet shows both answers');
  await h.shot('dryrun-summary');
  // the toggle beside the name: WHOLE DEVICE, and back to the player
  await h.ev(() => document.querySelector('.pt-scope button[data-scope="device"]').click()); await h.step(300);
  const whole = await readSheet();
  h.assert(whole.title === 'Whole device · ' + dev && whole.scope.join() === label + ',WHOLE DEVICE*', 'WHOLE DEVICE: the sheet is headed with the device id: ' + whole.title);
  await h.ev(() => document.querySelector('.pt-scope button[data-scope="player"]').click()); await h.step(300);
  h.assert((await readSheet()).title === name, 'and back to the player');
  // SEND LOG from the sheet: this player's log. A phone shares it as .txt; if the share sheet cannot open the same log
  // downloads as .json; a dismissed share sheet sends nothing (the protocol: tap SEND LOG again). A desktop downloads .json
  const files = [];
  const sendRe = (lbl, ext) => new RegExp(`^naceca-playtest-${dev}-${lbl}-\\d{8}-\\d{4}\\.${ext}$`);
  const sendLog = async lbl => {
    await P.stubSave(h);
    if (touch) {
      await P.stubShare(h, 'ok');
      await tap('#pt-r-send', 500);
      const shared = await h.ev(() => window.__shared), body = (await P.sharedText(h))[0][0];
      h.assert(shared.length === 1 && shared[0][0].type === 'text/plain' && sendRe(lbl, 'txt').test(shared[0][0].name), 'SEND LOG shares this player\'s log as .txt ' + JSON.stringify(shared));
      fs.writeFileSync(path.join(out, shared[0][0].name), body); files.push(shared[0][0].name);
      await P.stubShare(h, 'notallowed');
      await tap('#pt-r-send', 500);
      const sv1 = await h.ev(() => window.__saved);
      h.assert(sv1.length === 1 && sendRe(lbl, 'json').test(sv1[0].name), 'the share sheet cannot open: the same log downloads as .json ' + JSON.stringify(sv1.map(x => x.name)));
      await P.stubShare(h, 'abort');
      await tap('#pt-r-send', 500);
      const sv2 = await h.ev(() => window.__saved), px = (await evs('pt_export', t0)).pop();
      h.assert(sv2.length === 1 && px && px.via === 'declined', 'the share sheet dismissed: nothing is sent or downloaded (pt_export via:declined), so SEND LOG again ' + JSON.stringify(px));
      await P.stubShare(h, 'ok');
    } else {
      await tap('#pt-r-send', 500);
      const sv1 = await h.ev(() => window.__saved);
      h.assert(sv1.length === 1 && sendRe(lbl, 'json').test(sv1[0].name), 'desktop SEND LOG downloads this player\'s log as .json ' + JSON.stringify(sv1.map(x => x.name)));
      fs.writeFileSync(path.join(out, sv1[0].name), sv1[0].data); files.push(sv1[0].name);
    }
  };
  await sendLog(label);
  await tap('#pt-r-back', 300);
  h.assert((await shown()).includes('screen-settings'), 'BACK returns to Settings');
  // Settings › PLAYTEST › EXPORT: the whole device (desktop: a .json download; phone: the share sheet, .txt)
  const exportAll = async () => {
    await P.stubSave(h); if (touch) await P.stubShare(h, 'ok');
    await tap('#pt-export', 500);
    let exp;
    if (touch) { const s = await h.ev(() => window.__shared), t = await P.sharedText(h); exp = { name:s[s.length - 1][0].name, body:t[t.length - 1][0], saved:(await h.ev(() => window.__saved)).length }; }
    else { const s = await h.ev(() => window.__saved); exp = { name:s[s.length - 1].name, body:s[s.length - 1].data, saved:s.length }; }
    h.log('EXPORT: ' + exp.name + ' (' + exp.body.length + ' chars)');
    h.assert(sendRe('ALL', touch ? 'txt' : 'json').test(exp.name), 'EXPORT names the file naceca-playtest-<dev>-ALL-<stamp>.' + (touch ? 'txt (the share sheet: on a phone EXPORT shares too)' : 'json'));
    const px = (await evs('pt_export', t0)).pop();
    h.assert(px && px.via === (touch ? 'share' : 'link') && px.file === exp.name, 'pt_export ' + JSON.stringify(px));
    fs.writeFileSync(path.join(out, exp.name), exp.body); files.push(exp.name);
    return JSON.parse(exp.body);
  };
  const j = await exportAll();
  h.assert(j.game === 'naceca' && j.ptv === 2 && j.dev === dev && j.player === null && j.events.some(e => e.type === 'survey') && j.events.some(e => e.type === 'van_refused') && j.events.some(e => e.type === 'table_stuck'), 'the export carries the player\'s events');
  h.log('files in the session folder: ' + files.join(', '));

  /* ---------- after the session: node tools/pt_report.cjs <folder> --md report.md ---------- */
  const CLI = path.join(P.ROOT, 'tools', 'pt_report.cjs'), md = path.join(out, 'report.md');
  const report = () => {
    const r = cp.spawnSync(process.execPath, [CLI, out, '--md', md], { encoding:'utf8', cwd:P.ROOT, timeout:60000 });
    const txt = (r.stdout || '') + (r.stderr || '');
    const blocks = txt.split('='.repeat(78)).slice(1).filter(b => b.trim());
    return { code:r.status, txt, players:blocks.filter(b => !/^ACROSS/.test(b.trim())), across:blocks.find(b => /^ACROSS/.test(b.trim())) || null, md:fs.existsSync(md) ? fs.readFileSync(md, 'utf8') : '' };
  };
  let r = report();
  h.log(r.txt.split('\n').filter(l => l.trim()).slice(0, 40).join('\n'));
  h.assert(r.code === 0, 'pt_report.cjs exits 0: ' + r.code);
  h.assert(r.players.length === 1 && r.players[0].trim().startsWith(name + ' · ') && !r.across, 'one player, keyed ' + name + (touch ? ' (SEND LOG and EXPORT of the same device count once)' : ''));
  h.assert(HEADS.every(q => r.txt.includes(q)), 'the four answers are printed');
  const opsRow = r.txt.split('\n').find(l => /operations table:/.test(l));
  h.assert(opsRow && /van refused ×1/.test(opsRow) && /stuck at the table ×1/.test(opsRow), 'the operations table row: ' + opsRow);
  h.assert(opsRow.trim() === '- ' + opsSheet, 'the report prints the row the sheet showed');
  h.assert(r.txt.includes('What was your most satisfying decision? ' + A1) && r.txt.includes('What happened that felt unfair? ' + A2), 'both answers, verbatim');
  h.assert(/hints when stuck (on|off)/.test(r.players[0].split('\n').find(l => l.trim())), 'the lead line records Hints when stuck');
  h.assert(/^# NACECA playtest report/.test(r.md) && r.md.includes('## ' + name) && r.md.includes(A1) && r.md.includes(A2) && /operations table:.*van refused ×1.*stuck at the table ×1/.test(r.md), 'report.md holds the player, the row and the answers');
  h.assert(!/\bAKS\b/.test(r.txt + r.md), 'no AKS in the report');

  /* ---------- the loop to the next player: BACK › QUIT TO MENU › the title › SETTINGS ---------- */
  await tap('#btn-settings-close', 300);
  h.assert((await shown()).includes('screen-pause'), 'BACK from Settings returns to the menu');
  await tap('#btn-quit', 700);
  h.assert((await shown()).join() === 'screen-title', 'QUIT TO MENU reaches the title at once, no confirmation: ' + (await shown()).join());
  await tap('#btn-title-settings', 300);
  h.assert(await h.ev(() => !!document.getElementById('pt-m2')), 'from the title\'s Settings START AT M2 is offered again');
  h.assert((await playerRow() || '').startsWith(name + ' · '), 'the log and the player survive QUIT TO MENU: ' + await playerRow());

  /* ================= the next player on the same device: P2, an M2 start, with a freeze in the market ================= */
  // the Player row names P1: the protocol has the facilitator EXPORT (done above), see the file arrive, then CLEAR twice
  await twoTaps('#pt-clear', 'TAP AGAIN · CLEAR');
  h.assert((await playerRow() || '').startsWith(`${name} · 0 events`), 'CLEAR keeps the player and the device id, 0 events: ' + await playerRow());
  await twoTaps('#pt-new', 'TAP AGAIN · START P2');
  const row2 = await playerRow(), m2 = (row2 || '').match(/^([A-Z0-9]{4})·(P\d+) · 1 event since (\d\d:\d\d)\./);
  h.assert(m2 && m2[1] === dev && m2[2] === 'P2', 'the row names the same device and P2: ' + row2);
  const label2 = 'P2', name2 = dev + '·' + label2;
  const t1 = await P.mark(h);
  h.assert(await h.ev(() => hasSave()), 'before START AT M2 the device still holds the previous player\'s save (the van, the raid)');
  await twoTaps('#pt-m2', 'TAP AGAIN · START AT M2', 700, legacy);
  h.assert((await shown()).join() === 'screen-controls' && await h.ev(() => S.game.currentMission === 'm2' && !hasSave()), 'START AT M2 on a used device: the market\'s start screen, the previous save dropped');
  await tap('#btn-start-mission', 900);
  h.assert(await h.ev(() => S.game.currentMission === 'm2' && ENGINE.movementEnabled && !document.querySelector('.overlay.show')), 'START MISSION: the market is live for P2');
  await live();
  // the menu during play: the layout's control (a desktop: Esc, as the protocol's "or Esc") › SETTINGS has NEW PLAYER
  // but no START AT M2 › BACK › RESUME
  if (touch) await menuOpen('the market, during play');
  else { await h.page.keyboard.press('Escape'); await h.step(300); h.assert((await shown()).includes('screen-pause'), 'desktop: Esc opens the menu during play ' + JSON.stringify(await shown())); }
  await tap('#btn-pause-settings', 250);
  h.assert(await h.ev(() => !!document.getElementById('pt-new') && !document.getElementById('pt-m2')), 'during play: NEW PLAYER is there, START AT M2 is not');
  await tap('#btn-settings-close', 250);
  h.assert((await shown()).includes('screen-pause'), 'BACK returns to the menu');
  await tap('#btn-resume', 300);
  h.assert(await h.ev(() => !document.querySelector('.overlay.show') && ENGINE.movementEnabled), 'RESUME: back in the market');
  // the freeze, a minute in: reload with ?pt=1. Nothing is saved yet, so CONTINUE is greyed; the label and the minutes
  // carry on; START AT M2 again under the same player
  await P.play(h, 60);
  const k0 = await kit();
  await P.reload(h, '?pt=1');
  await h.page.waitForSelector('#screen-title.show', { timeout:90000 });
  const cont = await h.ev(() => { const b = document.getElementById('btn-continue'); return { text:b.textContent.trim(), disabled:b.disabled, save:hasSave() }; });
  const k1 = await kit();
  h.log('after the reload: CONTINUE ' + JSON.stringify(cont) + ' · player ' + JSON.stringify(k1) + ' (before: ' + JSON.stringify(k0) + ')');
  h.assert(cont.text === 'CONTINUE' && cont.disabled && !cont.save, 'a freeze before the first FILE or the van: CONTINUE is greyed (nothing saved yet), never the previous player\'s run');
  h.assert(k1.dev === dev && k1.label === label2 && k1.ps >= k0.ps - 2 && k1.ps >= 60, 'the player label, the device id and the play seconds survive the reload');
  await tap('#btn-title-settings', 300);
  h.assert((await playerRow() || '').startsWith(name2 + ' · '), 'the Player row still names ' + name2 + ': ' + await playerRow());
  await twoTaps('#pt-m2', 'TAP AGAIN · START AT M2', 700, legacy);
  h.assert((await shown()).join() === 'screen-controls' && await h.ev(() => S.game.currentMission === 'm2'), 'START AT M2 again: the market\'s start screen');
  const ng2 = await evs('new_game', t1);
  h.assert(ng2.length === 2 && ng2.every(d => d.p === label2), 'both starts are logged under the same player (no NEW PLAYER after a freeze)');
  await tap('#btn-start-mission', 900);
  h.assert(await h.ev(() => S.game.currentMission === 'm2' && ENGINE.movementEnabled), 'START MISSION: the market is live again');
  await live();
  // concession: P2's slice is not played again (P1's was); the driver moves the save on to Lekki and drives the mansion
  await P.play(h, 45);
  await h.ev(() => { showOverlay(null); S.game.intel = Object.assign({}, S.game.intel || {}, { briefed:Object.assign({}, (S.game.intel || {}).briefed || {}, { m3:1 }) });
    try { const mm = V12.mem(); mm.hubs = mm.hubs || {}; mm.hubs.h2 = true; } catch (e) {}
    completeMission('m2', { silent:true }); loadMission('m3'); });
  await h.step(900);
  h.assert(await h.ev(() => S.game.currentMission === 'm3' && !!document.querySelector('#screen-controls.show')), 'the mansion\'s start screen (the driver moved the save on)');
  await tap('#btn-start-mission', 900);
  await P.driveM3(h, { summary:false });
  await h.ev(() => { showOverlay(null); if (S.game.currentMission === 'm3' && !(S.game.completedMissions || []).includes('m3')) completeMission('m3'); });
  h.assert(await until(() => !!(document.querySelector('#screen-pt-survey.show') && document.querySelector('#screen-aftermath.show')), null, 6000), 'the two questions come up over the aftermath for P2');
  // this player says the answers aloud and SKIPs the sheet (the protocol's "if the player skips them")
  await tap('#pt-skip', 300);
  sh = await shown();
  h.assert(sh.includes('screen-aftermath') && !sh.includes('screen-pt-survey'), 'SKIP returns to the aftermath');
  h.assert((await evs('survey', t1)).some(d => d.skipped && d.p === label2), 'a skipped survey is logged for the player');
  /* ---------- collect P2's log: CONTINUE › the card › the menu › SETTINGS › Two questions › ANSWER, then the sheet ---------- */
  await tap('#btn-aftermath-continue', 300);
  h.assert(await until(() => { const c = document.querySelector('#title-card.show'); return c && /NIGHT SHIFT/.test(c.textContent); }, null, 2500), 'the NIGHT SHIFT card plays');
  h.assert(await until(() => !document.querySelector('#title-card.show') && ENGINE.movementEnabled && !document.querySelector('.overlay.show') && S.game.currentMission === 'm3n', null, 8000), 'the office at night');
  await h.step(400);
  await menuOpen('the office at night, P2');
  await tap('#btn-pause-settings', 250);
  h.assert((await shown()).includes('screen-settings'), 'MENU › SETTINGS');
  h.assert(await qRow() === '0 answers saved in the log.', 'the Two questions row before typing: ' + await qRow());
  h.assert(await text('#pt-survey') === 'ANSWER', 'the Two questions row has ANSWER');
  await tap('#pt-survey', 300);
  h.assert((await shown()).includes('screen-pt-survey'), 'ANSWER opens the two questions over Settings ' + JSON.stringify(await shown()));
  await h.ev(([a, b]) => { document.getElementById('pt-a1').value = a; document.getElementById('pt-a2').value = b; }, [B1, B2]);
  await tap('#pt-save', 400);
  sh = await shown();
  h.assert(sh.includes('screen-settings') && !sh.includes('screen-pt-survey'), 'SAVE ANSWERS returns to Settings ' + JSON.stringify(sh));
  const typed = (await evs('survey', t1)).filter(d => !d.skipped).pop();
  h.assert(typed && typed.satisfying === B1 && typed.unfair === B2 && typed.p === label2 && typed.where === 'settings', 'the typed answers are logged for ' + label2 + ' (while the Player row still names them): ' + JSON.stringify(typed));
  h.assert(await qRow() === '1 answer saved in the log.', 'the Two questions row is redrawn on return: ' + await qRow());
  await tap('#pt-view', 400);
  const sheet2 = await readSheet();
  h.assert(sheet2.title === name2 && sheet2.scope.join() === label2 + '*,WHOLE DEVICE', 'the Summary sheet is for ' + name2 + ': ' + sheet2.title);
  h.assert(sheet2.quotes.some(x => x.includes(B1)) && sheet2.quotes.some(x => x.includes(B2)) && !sheet2.quotes.some(x => x.includes(A1)), 'the sheet shows P2\'s typed answers and none of P1\'s');
  await sendLog(label2);
  await tap('#pt-r-back', 300);
  await exportAll();
  h.log('files in the session folder: ' + files.join(', '));
  r = report();
  h.assert(r.code === 0, 'pt_report.cjs exits 0 with two players: ' + r.code);
  h.log(r.players.map(b => b.trim().split('\n')[0]).join('\n') + '\n' + (r.across || '').trim().split('\n').slice(0, 3).join('\n'));
  h.assert(r.players.length === 2 && r.players[0].trim().startsWith(name + ' · ') && r.players[1].trim().startsWith(name2 + ' · '), 'two players, keyed ' + name + ' and ' + name2);
  h.assert(r.across && /^ACROSS 2 PLAYERS/.test(r.across.trim()), 'ACROSS 2 PLAYERS');
  h.assert(r.players[0].includes(A1) && !r.players[0].includes(B1) && r.players[1].includes(B1) && r.players[1].includes(B2) && !r.players[1].includes(A1), 'each player\'s answers under their own name (the typed ones under P2)');
  h.assert(r.md.includes('## ' + name) && r.md.includes('## ' + name2) && r.md.includes(B1), 'report.md holds both players');
  await tap('#btn-settings-close', 300);
  await tap('#btn-quit', 700);
  h.assert((await shown()).join() === 'screen-title', 'QUIT TO MENU reaches the title');

  /* ================= the third player: a full start on a used device ================= */
  await tap('#btn-title-settings', 300);
  await twoTaps('#pt-clear', 'TAP AGAIN · CLEAR');
  await twoTaps('#pt-new', 'TAP AGAIN · START P3');
  h.assert((await playerRow() || '').startsWith(dev + '·P3 · 1 event since'), 'the row names ' + dev + '·P3: ' + await playerRow());
  const t2 = await P.mark(h);
  await tap('#btn-settings-close', 300);
  h.assert((await shown()).join() === 'screen-title', 'BACK from Settings returns to the title');
  await tap('#btn-newgame', 400);
  h.assert((await shown()).includes('screen-newgame'), 'NEW INVESTIGATION opens the new-game sheet');
  const ngs = await h.ev(() => ({ modes:[...document.querySelectorAll('#screen-newgame .cw-mode')].map(b => b.querySelector('b').textContent.trim() + (b.classList.contains('sel') ? '*' : '')),
    acts:[...document.querySelectorAll('#screen-newgame .cw-acts button')].map(b => b.textContent.replace(/\s+/g, ' ').trim()), alert:((document.querySelector('#screen-newgame .cw-alert') || {}).textContent || '').replace(/\s+/g, ' ').trim() }));
  h.log('new-game sheet: ' + JSON.stringify(ngs));
  h.assert(ngs.modes.includes('SENIOR AGENT*') && ngs.acts.includes('BEGIN'), 'SENIOR AGENT is already selected; the button reads BEGIN');
  h.assert(ngs.alert === SAVE_ALERT, 'on a used device the sheet warns about the saved investigation (BEGIN goes through it): ' + ngs.alert);
  await legacy();
  await tap('#screen-newgame [data-act="go"]', 1200);
  const full = await h.ev(() => ({ m:S.game.currentMission, d:S.game.difficulty, ov:[...document.querySelectorAll('.overlay.show')].map(o => o.id) }));
  h.log('after BEGIN: ' + JSON.stringify(full));
  h.assert(full.m === 'm0' && full.d === 'senior', 'BEGIN starts the cold open (M0) on Senior Agent');
  const ng3 = await evs('new_game', t2);
  h.assert(ng3.length === 1 && ng3[0].p === 'P3' && ng3[0].d === 'senior', 'new_game is logged under P3');
  // a freeze in the cold open: the device's last save is the previous player's, and CONTINUE would open it (the
  // protocol: for a full start before HQ is done, NEW INVESTIGATION again under the same player)
  await P.play(h, 30);
  await P.reload(h, '?pt=1');
  await h.page.waitForSelector('#screen-title.show', { timeout:90000 });
  const c3 = await h.ev(() => ({ disabled:document.getElementById('btn-continue').disabled, save:hasSave() }));
  h.assert(!c3.disabled && c3.save && (await kit()).label === 'P3', 'after a reload in the cold open CONTINUE is offered: the save on the device is P2\'s');
  await legacy();
  await tap('#btn-continue', 1200);
  const res = await h.ev(() => ({ m:S.game.currentMission, done:(S.game.completedMissions || []).slice(), ov:[...document.querySelectorAll('.overlay.show')].map(o => o.id) }));
  h.log('CONTINUE in the cold open opens: ' + JSON.stringify(res));
  h.assert(res.m !== 'm0' && res.done.includes('m3'), 'CONTINUE loads the previous player\'s run, not this player\'s cold open (the protocol says NEW INVESTIGATION again)');
}

/* the Lagos office between the van and the mansion: Uche, the phone, the Commander, whatever sheets she asks for,
   the briefing with its first options, then the title card to Lekki and the mansion's start screen */
async function office(h, B, until, shown) {
  const first = async () => {   // a plain player at the charge sheet: the first option of each question, then FILE (two taps)
    await h.ev(() => { const seen = new Set(); for (const b of document.querySelectorAll('#screen-charge [data-k][data-v]')) { if (b.disabled || seen.has(b.dataset.k)) continue; seen.add(b.dataset.k); b.click(); } });
    await h.step(100);
    for (let i = 0; i < 2; i++) { await h.ev(() => { const b = document.querySelector('#screen-charge [data-act="file"]'); if (b && !b.disabled) b.click(); }); await h.step(i ? 1300 : 80); }
  };
  const briefing = async () => {
    await h.ev(() => {
      for (let i = 0; i < 6; i++) { const b = [...document.querySelectorAll('#screen-briefing [data-b="dec"]')].find(x => !BRF.dec[x.dataset.k]); if (!b) break; b.click(); }
      for (let i = 0; i < 6; i++) { const c = document.querySelector('#screen-briefing [data-b="commit"]'); if (c && !c.disabled) break;
        const b = [...document.querySelectorAll('#screen-briefing [data-b="lead"]:not([disabled])')].find(x => !BRF.sel.includes(x.dataset.id)); if (!b) break; b.click(); }
    });
    if (await B.has('#screen-briefing [data-b="commit"]')) await B.click('#screen-briefing [data-b="commit"]', 2);
    await B.runToEnd();
    if (await B.has('#screen-briefing [data-b="done"]')) await B.click('#screen-briefing [data-b="done"]');
    await h.step(200);
  };
  let did = { uche:false, phone:false, cmd:false }, last = '';
  for (let g = 0; g < 80; g++) {
    const st = await h.ev(() => ({ m:S.game.currentMission, ov:[...document.querySelectorAll('.overlay.show')].map(o => o.id), card:!!document.querySelector('#title-card.show'), move:!!ENGINE.movementEnabled,
      hub:!!(V12.HUBS && V12.HUBS[S.game.currentMission]), objs:(S.game.objectives || []).map(o => (o.done ? '+' : '.') + o.id).join(' ') }));
    if (st.m === 'm3' && st.ov.includes('screen-controls')) return st;
    const sig = JSON.stringify(st); if (sig === last) await h.step(200); last = sig;
    if (st.card) { await until(() => !document.querySelector('#title-card.show'), null, 6000); continue; }
    if (st.ov.includes('screen-dialogue')) { const r = await B.dialogues(); if (r === 'choice') await B.choose(0); continue; }
    if (st.ov.includes('screen-charge')) { await first(); continue; }
    if (st.ov.includes('screen-warrant')) { await B.click('#screen-warrant [data-act="exigent"]', 2); await h.step(150); continue; }
    if (st.ov.includes('screen-briefing')) { await briefing(); continue; }
    if (st.ov.includes('screen-phone')) { await h.ev(() => document.querySelector('#screen-phone .ph-x').click()); await h.step(150); continue; }
    if (st.ov.length) { await h.step(250); continue; }
    if (st.hub && st.move) {
      if (!did.uche) { did.uche = true; await h.ev(() => { const it = ENGINE.interactables.find(i => /^Talk to Uche/.test(i.label || '')); if (it) it.onInteract(it); }); await h.step(200); continue; }
      if (!did.phone) { did.phone = true; await h.ev(() => { Object.values(V12.mem().phone || {}).forEach(t => { t.unread = 0; if (t.pending) { V12.reply(t.pending.id, t.pending.opts[0].v); t.pending = null; } });
        const it = ENGINE.interactables.find(i => /^Check your phone/.test(i.label || '')); if (it) it.onInteract(it); }); await h.step(250); continue; }
      if (!did.cmd) { did.cmd = true; await h.ev(() => { const it = ENGINE.interactables.find(i => /Commander Adaeze$/.test(i.label || '')); if (it) it.onInteract(it); }); await h.step(300); continue; }
      await h.step(300); continue;
    }
    await h.step(200);
  }
  throw new Error('office: no way to the mansion ' + last);
}
