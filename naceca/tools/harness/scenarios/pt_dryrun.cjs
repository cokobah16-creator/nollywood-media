// pt_dryrun: the facilitator's taps from docs/PLAYTEST-PROTOCOL.md on the REAL UI, before a session.
// On a page opened with ?pt=1: the title screen › SETTINGS › PLAYTEST › NEW PLAYER (two taps; the device id and label
// are read off the row, as the facilitator reads them) › START AT M2 (two taps) › the market's start screen, then one
// scripted M2-start slice: Tunde, the phone, KC, the van before the table (its refusal), ~90 s at the table with no new
// ink (the table's own clock, as board_m2_help: the stuck help), three links filed on the real chips, the van, the Lagos
// office, the mansion to its aftermath, the two questions typed into the game's own sheet, then the way to Settings ›
// PLAYTEST the aftermath leaves (CONTINUE …), Summary › VIEW, EXPORT (desktop: V12.saveFile; phone: the share sheet,
// plus SEND LOG from the sheet), the files written to a session folder, and tools/pt_report.cjs run on that folder with
// --md: one player keyed dev·label, the four answers, the operations-table row (van refused ×1, stuck at the table ×1),
// both answers verbatim, report.md written. The Summary sheet in the game must show the same player and the same row.
//   node tools/harness/run.cjs tools/harness/scenarios/pt_dryrun.cjs --html <build>/naceca.html --w 1280 --h 800
//   node tools/harness/run.cjs tools/harness/scenarios/pt_dryrun.cjs --html <build>/naceca.html --w 390 --h 844 --touch 1
// PT_DRYRUN_OUT=<folder> keeps the session folder (the exports and report.md); otherwise a temp folder is removed.
// Harness concessions (the page has no three.js): the legacy scene builders (ART.failed, as h.start), the frozen clock and
// the 60 Hz stepper after START MISSION (as T.start), the phone's document solved by the driver, the mansion's extraction
// through the mission's own completion (as pt_slice_m3). Nothing in the game is changed.
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const P = require('./pt_lib.cjs');
const T = P.T, WF = T.lib;
const BLIB = require('./v13_b_lib.cjs');

const A1 = 'Filing the links one at a time instead of guessing';
const A2 = 'The van would not let me leave until the table was done';
const HEADS = ['WHERE DID THEY GET LOST?', 'WHICH INTERACTIONS FAILED?', 'DID THEY UNDERSTAND WHY THEY WERE SEEN?', 'DID THEY USE MORE THAN ONE APPROACH?'];
const HELP0 = 'Link two cards that are connected in the crime, not just known to each other. 0 of 3 inked.';
const VAN0 = '0 of 3 links inked. Open the CASE FILE, pencil three pairs and FILE them.';

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
  const until = async (fn, arg, timeout = 8000, every = 100) => {
    const t0 = Date.now();
    for (;;) { let r = null; try { r = await h.ev(fn, arg); } catch (e) {} if (r) return r; if (Date.now() - t0 > timeout) return null; await h.step(every); }
  };
  const toastNow = () => h.ev(() => { const t = document.getElementById('toast'); return { big:((t.querySelector('.big') || {}).textContent || '').trim(), small:((t.querySelector('.small') || {}).textContent || '').trim(), show:t.classList.contains('show') }; });
  const playerRow = () => h.ev(() => { const b = document.getElementById('pt-new'); return b ? b.closest('.set-row').querySelector('.set-note').textContent.replace(/\s+/g, ' ').trim() : null; });
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
  const touch = await h.ev(() => document.body.classList.contains('touch-active'));
  const size = await h.ev(() => innerWidth + 'x' + innerHeight);
  h.log(`dry run on ${size}${touch ? ' touch' : ''} · session folder ${out}`);

  /* ---------- once per device: open the game with ?pt=1; the first-load time is what the facilitator writes down ---------- */
  const u = new URL(h.page.url()); u.search = '?pt=1';
  const tLoad = Date.now();
  await h.page.goto(u.toString(), { waitUntil:'load', timeout:90000 });
  await h.page.waitForSelector('#screen-title.show', { timeout:90000 });
  h.log(`first load, open to title (harness, no three.js): ${((Date.now() - tLoad) / 1000).toFixed(1)} s`);
  await h.step(1200);

  /* ---------- before each player: title › SETTINGS › PLAYTEST ---------- */
  await tap('#btn-title-settings', 250);
  let sh = await shown();
  h.assert(sh.includes('screen-settings') && !sh.includes('screen-title'), 'the title\'s SETTINGS opens Settings ' + JSON.stringify(sh));
  const labels = await P.rowLabels(h);
  h.assert(['Player', 'Summary', 'Playtest log', 'Two questions'].every(l => labels.includes(l)), 'PLAYTEST shows Player, Summary, Playtest log and Two questions on a ?pt=1 page ' + JSON.stringify(labels));
  h.assert(/^No player yet/.test(await playerRow() || ''), 'a fresh device: "No player yet"');
  const def = await h.ev(() => ({ pace:SETTINGS.difficulty, hints:SETTINGS.hints, marker:SETTINGS.marker }));
  h.log('settings at the hand-over: ' + JSON.stringify(def));
  h.assert(def.pace === 'standard' && def.marker === 'on' && /^(on|off)$/.test(def.hints), 'the defaults the protocol names (Hints when stuck is recorded, either way)');
  // the protocol's step 1: a device that names a player is exported first; a fresh one ("No player yet") holds only the
  // page's own events (session, quit), which the report would print as a "no player label" block, so CLEAR, twice
  const logRow = () => h.ev(() => document.getElementById('pt-export').closest('.set-row').querySelector('.set-note').textContent.replace(/\s+/g, ' ').trim());
  h.log('log row before CLEAR: ' + await logRow());
  const armedC = await h.ev(() => { const b = document.getElementById('pt-clear'); b.click(); return b.textContent; });
  h.assert(armedC === 'TAP AGAIN · CLEAR', 'the first CLEAR tap only arms: ' + armedC);
  await h.step(120);
  await tap('#pt-clear', 250);
  h.assert(/^0 events/.test(await logRow()), 'two CLEAR taps: the log row reads 0 events: ' + await logRow());
  h.assert(/^No player yet/.test(await playerRow() || ''), 'CLEAR keeps the Player row');

  // NEW PLAYER, two taps; the row then prints the device id and the label together
  const armed = await h.ev(() => { const b = document.getElementById('pt-new'); b.click(); return b.textContent; });
  h.assert(armed === 'TAP AGAIN · START P1', 'the first NEW PLAYER tap reads TAP AGAIN · START P1: ' + armed);
  await h.step(120);
  await tap('#pt-new', 250);
  const row = await playerRow();
  const m = (row || '').match(/^([A-Z0-9]{4})·(P\d+) · (\d+) events? since (\d\d:\d\d)\./);
  h.assert(m, 'the Player row prints dev·label · n events since HH:MM: ' + row);
  const dev = m[1], label = m[2], name = dev + '·' + label;
  h.assert(label === 'P1' && +m[3] >= 1, 'the first player on the device is P1');
  h.assert(await h.ev(() => V12.ptKit.device()) === dev && await h.ev(() => V12.ptKit.label()) === label, 'the row prints the kit\'s own device id and label');
  h.log(`player ${name} · started ${m[4]}`);
  const t0 = await P.mark(h);

  // START AT M2, two taps: only on this page (?pt=1) and only from the title's Settings
  h.assert(await h.ev(() => !!document.getElementById('pt-m2')), 'START AT M2 is offered next to NEW PLAYER');
  const armed2 = await h.ev(() => { const b = document.getElementById('pt-m2'); b.click(); return b.textContent; });
  h.assert(armed2 === 'TAP AGAIN · START AT M2', 'the first START AT M2 tap reads TAP AGAIN · START AT M2: ' + armed2);
  await h.step(120);
  // harness: real coordinates and the legacy scene builders, as every scenario's h.start sets them (no three.js here)
  await WF.boot(h);
  await h.ev(() => { ART.failed = true; ART.ready = false; ART.promise = null; });
  await tap('#pt-m2', 700);
  const st = await h.ev(() => ({ m:S.game.currentMission, done:S.game.completedMissions.slice(), d:S.game.difficulty, ov:[...document.querySelectorAll('.overlay.show')].map(o => o.id),
    card:[document.getElementById('controls-mnum'), document.getElementById('controls-mname')].map(e => e.textContent.trim()).join(' · '), btn:document.getElementById('btn-start-mission').textContent.replace(/\s+/g, ' ').trim() }));
  h.log('start screen: ' + st.card + ' · button: ' + st.btn);
  h.assert(st.m === 'm2' && st.done.join() === 'm0,m1' && st.d === 'senior' && st.ov.includes('screen-controls') && !st.ov.includes('screen-settings'),
    'the second tap: the market\'s start screen on a fresh Senior Agent save with M0 and M1 done ' + JSON.stringify(st));
  h.assert(/LAGOS MARKET PATROL/.test(st.card), 'the start screen names the market: ' + st.card);
  h.assert(st.btn === 'START MISSION', 'the start screen\'s button reads START MISSION (the protocol names it so): ' + st.btn);
  const ng = await evs('new_game', t0);
  h.assert(ng.length === 1 && ng[0].d === 'senior' && ng[0].p === label, 'new_game {d:senior} is logged for the player');

  /* ---------- hand over: START MISSION (the player's first tap) ---------- */
  await tap('#btn-start-mission', 900);
  h.assert(await h.ev(() => S.game.currentMission === 'm2' && ENGINE.movementEnabled && !document.querySelector('.overlay.show')), 'START MISSION: the market is live');
  await WF.frozenClock(h); await WF.stepper(h);   // the scripted slice steps the world itself (as T.start sets up)
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
  if (!(await h.ev(() => !!CHASE.active))) { await at(6.0, 5.4); await press(500); }
  if (await h.ev(() => !!CHASE.active)) { await T.pursue(h, { strategy:'follow', maxT:40, v:5.0 }); await h.step(300); await dlg(0); }
  await h.step(300);
  await P.play(h, 40);
  await P.standIn(h, t0, 'enc', { enc:'m2_kc', approach:'seen', intent:'direct', susp:100, level:'alarm', exposed:true, gap:2.0, scanSeen:false, side:'front', outcome:'caught', how:'tackle', secs:9.8,
    bumps:2, bumpsLane:1, trust:1, cutReached:false, ribbon:'off', prep:{ tip:true, habit:true, post:'van', posted:false, pursuit:false, tier:1, greyman:false, sources:false }, uche:{ post:'van', arrived:false, role:null } }, standIns);
  await P.standIn(h, t0, 'm2_summary', { kc:'caught', how:'tackle', approach:'seen', scanSeen:false, alarms:1, notices:1, suspPeak:100, eyeSecs:3.1, crouchNearSecs:0, watchSecs:44,
    tunde:{ side:'stall', seen:false, choice:'quiet', tip:true, habit:true }, post:'van', posted:false, ucheArrived:false, ucheRole:null,
    chase:{ secs:9.8, bumps:2, bumpsLane:1, trust:1, cutsShown:0, cutReached:false, cutoff:false, ribbon:'off' }, trust:1, secs:268, caps:{ pursuit:false, greyman:false, sources:false, tier:1 },
    diff:{ casework:'senior', pace:'standard' }, hints:[], build:'stand-in', intent:'direct', wary:false, ribbon:'off' }, standIns);
  const kc = await h.ev(() => { const g = S.game; const by = g.moralChoices.market_runner ? 'game' : 'driver'; if (!g.moralChoices.market_runner) g.moralChoices.market_runner = 'caught';
    const o3 = g.objectives.find(x => x.id === 'o3_runner' && !x.done); if (o3) completeObjective('o3_runner'); return { by, runner:g.moralChoices.market_runner }; });
  h.log('KC: ' + JSON.stringify(kc) + ' · seen events so far: ' + (await evs('seen', t0)).length);

  /* ---------- the van before the table: THE TABLE FIRST ---------- */
  await h.ev(() => { showOverlay(null); ENGINE.movementEnabled = true; });
  await at(0, 12.5);
  const van0 = await h.ev(() => { tryInteract(); const t = document.getElementById('toast'); return { big:((t.querySelector('.big') || {}).textContent || '').trim(), small:((t.querySelector('.small') || {}).textContent || '').trim(), m:S.game.currentMission }; });
  await h.step(900);
  const vr = await evs('van_refused', t0);
  h.log('the van before the table: ' + JSON.stringify(van0) + ' ' + JSON.stringify(vr));
  h.assert(van0.m === 'm2' && van0.big === 'THE TABLE FIRST' && van0.small === VAN0, 'the van refuses with the "n of 3 links inked" line');
  h.assert(vr.length === 1 && vr[0].inked === 0 && vr[0].strikes === 0, 'van_refused {inked:0, strikes:0} once');
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
  h.log(`91 s at the table (hints ${def.hints}): help ${JSON.stringify(hp)} toast ${JSON.stringify(ht)} table_stuck ${JSON.stringify(ts)} stuck@table ${stk.length}`);
  h.assert(s91.atTable && s91.idle >= 91000, 'the table clock ran 91 s on the open table objective');
  h.assert(ts.length === 1 && ts[0].secs >= 90 && ts[0].secs <= 100 && ts[0].inked === 0 && ts[0].pencils === 0, 'table_stuck {secs, inked:0, pencils:0} once');
  h.assert(stk.length >= 1 && stk[0].obj === 'o4_table', 'the stuck log counts the table time (at:table)');
  if (def.hints === 'on') h.assert(hp === HELP0 && ht.big === 'HINT' && ht.small === HELP0, 'Senior Agent, Hints when stuck on: the 90 s help is the process line, as a HINT and at the top of the side panel');
  else h.assert(hp === null && ht.big !== 'HINT', 'Hints when stuck off: no help at the table (table_stuck is still logged)');
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
  const reached = await office(h, B, until, shown);
  h.log('to the mansion: ' + JSON.stringify(reached));
  h.assert(reached.m === 'm3' && reached.ov.includes('screen-controls'), 'the mansion\'s start screen, after the office');
  h.assert(await text('#btn-start-mission') === 'START MISSION', 'the mansion\'s start screen button reads START MISSION');
  await tap('#btn-start-mission', 900);
  h.assert(await h.ev(() => S.game.currentMission === 'm3' && ENGINE.movementEnabled), 'the mansion is live');

  /* ---------- the mansion to its aftermath, the two questions over it ---------- */
  await P.driveM3(h, { standIns });
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
  h.log('stand-ins this run: ' + JSON.stringify(standIns));

  /* ---------- collect the log: CONTINUE, then to Settings › PLAYTEST the way the screen that follows allows ---------- */
  await tap('#btn-aftermath-continue', 300);
  // after Lekki, CONTINUE plays a title card into the next scene (the night shift at HQ): a menu opened during the card
  // is closed when the scene begins, so the facilitator waits for the card to pass
  const card = await until(() => { const c = document.querySelector('#title-card.show'); return c ? c.textContent.replace(/\s+/g, ' ').trim() : null; }, null, 2500);
  h.log('after CONTINUE: ' + (card ? 'title card "' + card + '"' : 'no title card') + ' · ' + JSON.stringify(await shown()));
  if (card) h.assert(await until(() => !document.querySelector('#title-card.show') && ENGINE.movementEnabled && !document.querySelector('.overlay.show'), null, 8000), 'the next scene begins after the card');
  const next = await h.ev(() => ({ m:S.game.currentMission, obj:((S.game.objectives || []).find(o => !o.done) || {}).text || null, pill:!!document.getElementById('btn-pause') }));
  h.log('the scene after the aftermath: ' + JSON.stringify(next));
  h.assert(next.m === 'm3n' && next.pill, 'the night shift at HQ follows the aftermath, with the MENU pill on screen');
  await h.step(400);
  const route = await toSettings(h, tap, until, shown);
  h.log('from there to Settings: ' + route.join(' › '));
  h.assert(route.length <= 2, 'Settings is reached in at most two taps from the scene after the aftermath: ' + route.join(' › '));
  h.assert((await shown()).includes('screen-settings') && !!(await h.ev(() => document.getElementById('pt-view'))), 'Settings › PLAYTEST is reachable after the aftermath');
  const rowAfter = await playerRow();
  h.assert((rowAfter || '').startsWith(name + ' · '), 'the Player row still names ' + name + ': ' + rowAfter);
  // Summary › VIEW: the sheet names the same player and shows the same rows the report prints
  await tap('#pt-view', 400);
  h.assert((await shown()).includes('screen-pt-report'), 'Summary › VIEW opens the sheet');
  const sheet = await h.ev(() => { const ov = document.getElementById('screen-pt-report'); const rows = [...ov.querySelectorAll('.pt-sec li')].map(l => l.textContent.trim());
    return { title:ov.querySelector('.cw-title').textContent.trim(), lead:ov.querySelector('.pt-lead').textContent.trim(), heads:[...ov.querySelectorAll('.pt-sec h3')].map(x => x.textContent.trim()), rows,
      quotes:[...ov.querySelectorAll('.pt-quote')].map(x => x.textContent.trim()), scope:[...ov.querySelectorAll('.pt-scope button')].map(b => b.textContent.trim() + (b.classList.contains('on') ? '*' : '')) }; });
  h.log('the sheet: ' + sheet.title + ' · ' + sheet.lead);
  h.assert(sheet.title === name, 'the Summary sheet is for ' + name + ': ' + sheet.title);
  h.assert(sheet.scope.join() === label + '*,WHOLE DEVICE', 'the sheet opens on the player, with WHOLE DEVICE beside it ' + JSON.stringify(sheet.scope));
  h.assert(/Senior Agent/.test(sheet.lead) && new RegExp(touch ? '^Phone' : '^Desktop').test(sheet.lead), 'the lead line: device and casework ' + sheet.lead);
  const opsSheet = sheet.rows.find(r => /operations table:/.test(r));
  h.assert(opsSheet && /van refused ×1/.test(opsSheet) && /stuck at the table ×1/.test(opsSheet), 'the sheet\'s operations table row: ' + opsSheet);
  h.assert(sheet.quotes.some(x => x.includes(A1)) && sheet.quotes.some(x => x.includes(A2)), 'the sheet shows both answers');
  await h.shot('dryrun-summary');
  // the phone: SEND LOG from the sheet (this player's log, shared as .txt)
  const files = [];
  if (touch) {
    await P.stubSave(h); await P.stubShare(h, 'ok');
    await tap('#pt-r-send', 500);
    const shared = await h.ev(() => window.__shared), body = (await P.sharedText(h))[0][0];
    h.assert(shared.length === 1 && shared[0][0].type === 'text/plain' && new RegExp(`^naceca-playtest-${dev}-${label}-\\d{8}-\\d{4}\\.txt$`).test(shared[0][0].name), 'SEND LOG shares this player\'s log as .txt ' + JSON.stringify(shared));
    fs.writeFileSync(path.join(out, shared[0][0].name), body); files.push(shared[0][0].name);
  }
  await tap('#pt-r-back', 300);
  h.assert((await shown()).includes('screen-settings'), 'BACK returns to Settings');
  // Settings › PLAYTEST › EXPORT: the whole device (desktop: a .json download; phone: the share sheet, .txt)
  await P.stubSave(h); if (touch) await P.stubShare(h, 'ok');
  await tap('#pt-export', 500);
  let exp;
  if (touch) { const s = await h.ev(() => window.__shared), t = await P.sharedText(h); exp = { name:s[s.length - 1][0].name, body:t[t.length - 1][0], saved:(await h.ev(() => window.__saved)).length }; }
  else { const s = await h.ev(() => window.__saved); exp = { name:s[s.length - 1].name, body:s[s.length - 1].data, saved:s.length }; }
  h.log('EXPORT: ' + exp.name + ' (' + exp.body.length + ' chars)');
  h.assert(new RegExp(`^naceca-playtest-${dev}-ALL-\\d{8}-\\d{4}\\.${touch ? 'txt' : 'json'}$`).test(exp.name), 'EXPORT names the file naceca-playtest-<dev>-ALL-<stamp>.' + (touch ? 'txt (the share sheet)' : 'json'));
  const px = (await evs('pt_export', t0)).pop();
  h.assert(px && px.via === (touch ? 'share' : 'link') && px.file === exp.name, 'pt_export ' + JSON.stringify(px));
  const j = JSON.parse(exp.body);
  h.assert(j.game === 'naceca' && j.ptv === 2 && j.dev === dev && j.player === null && j.events.some(e => e.type === 'survey') && j.events.some(e => e.type === 'van_refused') && j.events.some(e => e.type === 'table_stuck'), 'the export carries the player\'s events');
  fs.writeFileSync(path.join(out, exp.name), exp.body); files.push(exp.name);
  await tap('#btn-settings-close', 200);
  h.log('files in the session folder: ' + files.join(', '));

  /* ---------- after the session: node tools/pt_report.cjs <folder> --md report.md ---------- */
  const CLI = path.join(P.ROOT, 'tools', 'pt_report.cjs'), md = path.join(out, 'report.md');
  const r = cp.spawnSync(process.execPath, [CLI, out, '--md', md], { encoding:'utf8', cwd:P.ROOT, timeout:60000 });
  const txt = (r.stdout || '') + (r.stderr || '');
  h.log(txt.split('\n').filter(l => l.trim()).slice(0, 40).join('\n'));
  h.assert(r.status === 0, 'pt_report.cjs exits 0: ' + r.status);
  const blocks = txt.split('='.repeat(78)).slice(1).filter(b => b.trim());
  h.assert(blocks.length === 1 && blocks[0].trim().startsWith(name + ' · ') && !/ACROSS/.test(txt), 'one player, keyed ' + name + (touch ? ' (SEND LOG and EXPORT of the same device count once)' : ''));
  h.assert(HEADS.every(q => txt.includes(q)), 'the four answers are printed');
  const opsRow = txt.split('\n').find(l => /operations table:/.test(l));
  h.assert(opsRow && /van refused ×1/.test(opsRow) && /stuck at the table ×1/.test(opsRow), 'the operations table row: ' + opsRow);
  h.assert(opsRow.trim() === '- ' + opsSheet, 'the report prints the row the sheet showed');
  h.assert(txt.includes('What was your most satisfying decision? ' + A1) && txt.includes('What happened that felt unfair? ' + A2), 'both answers, verbatim');
  h.assert(/hints when stuck (on|off)/.test(blocks[0].split('\n').find(l => l.trim())), 'the lead line records Hints when stuck');
  h.assert(fs.existsSync(md), '--md wrote ' + md);
  const mdTxt = fs.readFileSync(md, 'utf8');
  h.assert(/^# NACECA playtest report/.test(mdTxt) && mdTxt.includes('## ' + name) && mdTxt.includes(A1) && mdTxt.includes(A2) && /operations table:.*van refused ×1.*stuck at the table ×1/.test(mdTxt), 'report.md holds the player, the row and the answers');
  h.assert(!/\bAKS\b/.test(txt + mdTxt), 'no AKS in the report');
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

/* after CONTINUE on the aftermath: the screen that follows decides the taps to Settings; returns the path taken */
async function toSettings(h, tap, until, shown) {
  const path = [];
  for (let g = 0; g < 8; g++) {
    if (await h.ev(() => !!document.querySelector('#title-card.show'))) { await until(() => !document.querySelector('#title-card.show'), null, 6000); continue; }
    const sh = await shown();
    if (sh.includes('screen-settings')) return path;
    if (sh.includes('screen-title')) { path.push('title › SETTINGS'); await tap('#btn-title-settings', 250); continue; }
    if (sh.includes('screen-missions')) { path.push('CASE FILES › BACK'); await tap('#btn-missions-back', 250); continue; }
    if (sh.includes('screen-pause')) { path.push('MENU › SETTINGS'); await tap('#btn-pause-settings', 250); continue; }
    if (sh.includes('screen-controls')) { path.push('start screen › START MISSION'); await tap('#btn-start-mission', 900); continue; }
    if (!sh.length && await h.ev(() => !!S.game.currentMission)) { path.push('the MENU pill'); await tap('#btn-pause', 250); continue; }
    await h.step(300);
  }
  return path;
}
