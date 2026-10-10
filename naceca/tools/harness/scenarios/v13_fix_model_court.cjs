// v13 review fixes (model / data), statements, the s.84 window and the reveal. Each block fails before the fix.
//   node tools/harness/run.cjs tools/harness/scenarios/v13_fix_model_court.cjs --html <build>/naceca.html
// R05  Musa u3 "already there when I bought the truck": the checkpoint papers (main path) prove it CONTRADICTED —
//      no wrong score and no "your own officer's file says this witness lied" at trial
// R16  Musa u1: the ride history to Riverview Suites is proof too; Tunde t2: the Ugbowo call records are proof too
// R11  the s.84 window never reopens on a replay of an earlier operation
// R12  a replayed M8 after the season: its pre-trial file can certify what it says it can
// R17  'confront': the reveal no longer says she changed every phone (her "C." still calls in the M7 tower data)
const CLIB = require('./v13_c_lib.cjs');
module.exports = async h => {
  // V13FIX_SOFT=1 lists every failing check instead of stopping at the first (to show what a build before the fixes gets wrong)
  const soft = process.env.V13FIX_SOFT === '1', fails = [];
  const check = (c, m) => { if(c) return; if(!soft) h.assert(c, m); fails.push(m); h.log('CHECK FAILED: ' + m); };
  const C = CLIB.lib(h);

  // ================= R05 / R16: statements =================
  await h.start('m2', { completed:['m0', 'm1'], briefings:true, state:S => { S.game.intel = { items:{}, briefed:{} }; } });
  const st = await h.ev(() => {
    const out = {};
    const reset = id => { delete I().stv[id]; delete I().st[id]; };
    const diff = v => { S.game.difficulty = v; if(typeof syncDifficultyClass === 'function') syncDifficultyClass(); };
    diff('senior');
    S.game.completedMissions = ['m0', 'm1', 'm2', 'm3', 'm3n', 'm4', 'm5', 'm6', 'm7', 't7', 'm8'];
    S.game.docSeen = { checkpoint_lie:true }; S.game.flags = {};                      // confronted Musa with the papers; no weld scan
    const e = { id:'musa_statement', name:"Musa's Statement" }; S.game.evidence.push(e); intelOnEvidence(e);
    I().leads.musa = 'done';
    out.u3 = intelVerdict('st_musa', 'u3', 'contradicted'); out.u3score = intelVerdictScore('st_musa', 'u3');
    S.game.moralChoices = Object.assign({}, S.game.moralChoices, { finale:'proven' });
    const x = courtExhibits().find(x => x.id === 'musa_statement'); out.u3lied = !!(x && x.lied);
    diff('recruit'); reset('st_musa');
    out.u3rec = intelVerdict('st_musa', 'u3', 'contradicted');
    diff('senior'); reset('st_musa');
    // u1: only the ride history to Riverview Suites flagged
    I().flagged.musa_ride_asaba = true;
    intelVerdict('st_musa', 'u1', 'contradicted'); out.u1score = intelVerdictScore('st_musa', 'u1');
    diff('recruit'); reset('st_musa'); out.u1rec = intelVerdict('st_musa', 'u1', 'contradicted'); diff('senior'); reset('st_musa');
    // t2: UNVERIFIED at h5, then the tower extract (call records, no live fix) and the one replacement
    I().leads.tunde = 'done'; reset('st_tunde');
    out.t2first = intelVerdict('st_tunde', 't2', 'unverified');
    S.game.moralChoices.tower = 'extract';
    const c = { id:'tower_cdr', name:'Call Records — Ugbowo Cell' }; S.game.evidence.push(c); intelOnEvidence(c);
    out.fix = intelHas('tower_fix'); out.cdr = intelHas('tower_cdr');
    out.t2 = intelVerdict('st_tunde', 't2', 'mistaken'); out.t2score = intelVerdictScore('st_tunde', 't2');
    out.t2why = STATEMENTS[0].claims.find(c => c.id === 't2').why;
    return out;
  });
  h.log('R05/R16:', JSON.stringify(st));
  check(st.u3.locked && st.u3score === true, 'R05: u3 CONTRADICTED with the checkpoint papers (no weld scan) scores right');
  check(!st.u3lied, 'R05: no "your own officer\'s file says this witness lied" for a correct u3');
  check(st.u3rec && st.u3rec.ok === true, 'R05: Recruit is told the papers settle it');
  check(st.u1score === true && st.u1rec && st.u1rec.ok === true, 'R16: u1 CONTRADICTED from the ride history alone scores right');
  check(!st.fix && st.cdr && st.t2.locked && st.t2score === true, 'R16: t2 HONEST MISTAKE on the Ugbowo call records (no live fix) scores right');
  check(!/handset fix/.test(st.t2why), 'R16: t2\'s reason names the tower data every route has, not only the live fix');

  // ================= R11: a replay of M3 after M4–M6 =================
  await h.start('m3', { completed:['m0', 'm1', 'm2', 'h2', 'm3', 'm3n', 'm4', 'm5', 'm6'], state:S => {
    S.game.mem = { hubs:{ h2:1, h4:1, h5:1, h6:1 }, street:{}, phone:{}, reply:{}, seen:{} };
    S.game.intel = { briefed:{ m3:true, m4:true, m5:true, m6:true }, items:{}, started:{ m0:true, m1:true, m2:true, m3:true, m3n:true, m4:true, m5:true, m6:true } };
    S.game.evidence = [{ id:'laptop', name:'Encrypted Laptop' }];
  } });
  const rep = await h.ev(() => {
    const d = I();
    if(!d.items.laptop) intelOnEvidence({ id:'laptop' });
    d.items.laptop.cert = false; d.items.laptop.m = 'm3';
    const out = { cur:S.game.currentMission, win:certWindowOpen('laptop'), ok:certify('laptop'), cert:d.items.laptop.cert };
    openDesk('locker'); out.btn = !!document.querySelector('#desk-body [data-act="cert"][data-id="laptop"]'); closeDesk();
    // controls (A7): at Night Shift, before M4 starts, the laptop can still be certified; the tower data at h7 and in the car
    delete d.started.m4; S.game.currentMission = 'm3n'; out.m3n = certWindowOpen('laptop');
    d.started.m4 = true; S.game.currentMission = 'h4'; out.h4 = certWindowOpen('laptop');
    intelOnEvidence({ id:'tower_cdr' }); d.items.tower_cdr.cert = false;
    S.game.currentMission = 'h7'; out.h7 = certWindowOpen('tower_cdr');
    S.game.currentMission = 't7'; out.t7 = certWindowOpen('tower_cdr');
    d.started.m8 = true; S.game.currentMission = 'm8'; out.m8 = certWindowOpen('tower_cdr');
    delete d.started.m8; S.game.currentMission = 'm3'; out.replayTower = certWindowOpen('tower_cdr');
    return out;
  });
  h.log('R11:', JSON.stringify(rep));
  check(rep.cur === 'm3' && !rep.win && !rep.ok && !rep.cert && !rep.btn, 'R11: replaying M3 after M4 started never reopens the laptop\'s s.84 window (no SIGN on the desk)');
  check(rep.m3n && !rep.h4 && rep.h7 && rep.t7 && !rep.m8, 'R11: (A7 unchanged: laptop at Night Shift yes, at h4 no; tower data at h7 and in the car yes, once M8 starts no)');
  check(rep.replayTower, 'R11: (a replay before M8 has started leaves the tower data\'s window as it was)');

  // ================= R12: M8 replayed after the season =================
  await C.setup({ moral:{ asaba:'rescue', tower:'hold' }, ev:['fin_drive', 'fin_recording', 'fin_courier_phone'], voice:{ suspect:'adaeze', picks:['fin_drive', 'fin_recording', 'fin_courier_phone'] } });
  // the first run's trial has sat and the season is closed: nothing can be certified now
  const shut = await h.ev(() => { S.game.seasonOneComplete = true; I().court = { proven:['c1'], finale:'proven', at:Date.now() }; return certWindowOpen('fin_drive'); });
  check(!shut, 'R12: (after the season, before any replay, the window stays shut)');
  // replay M8 the way the case files do: loadMission (finResetFlags clears the old trial), then START MISSION
  await h.ev(() => { showOverlay(null); finResetFlags(); loadMission('m8'); });
  await h.step(600);
  await h.ev(() => { if(document.querySelector('#screen-controls.show')) beginMission('m8'); });
  await h.step(1500);
  const win = await h.ev(() => ({ cur:S.game.currentMission, court:I().court, replay:!!I().m8Replay, drive:certWindowOpen('fin_drive') }));
  const r2 = await C.resolve();
  h.log('R12 outcome', r2.outcome, JSON.stringify(win));
  check(r2.outcome === 'proven' && await C.toCourt(), 'R12: (the replay reaches the trial)');
  const pre = await h.ev(() => ({ lead:(document.querySelector('#screen-court .ct-lead') || {}).innerText || '', btns:document.querySelectorAll('#screen-court [data-ct="cert"]').length }));
  h.log('R12 pre-trial:', JSON.stringify(pre));
  check(win.cur === 'm8' && !win.court, 'R12: (the replay cleared the old trial)');
  check(win.drive, 'R12: during the replayed M8 the Ekosodin exhibits can still be certified');
  check(pre.btns > 0, 'R12: the replay\'s pre-trial file has SIGN buttons');
  check(!/can still certify/.test(pre.lead) || pre.btns > 0, 'R12: the pre-trial file never promises a certificate it can\'t give');
  // sign one through the court's own button, then run the trial: once it has sat, the window is shut
  await h.ev(() => { const b = document.querySelector('#screen-court [data-ct="cert"]'); if(b) b.click(); }); await h.step(120);
  const signed = await h.ev(() => Object.values(I().items).filter(it => it.m === 'm8' && it.cert).length);
  check(signed === 1, 'R12: the SIGN button certifies an exhibit');
  await C.runTrial('best', 'admit');
  const closed = await h.ev(() => ({ court:!!I().court, win:certWindowOpen('fin_recording') }));
  check(closed.court && !closed.win, 'R12: (after the trial the window is shut)');
  // after the season, outside a replayed finale, the Ekosodin exhibits stay shut
  const outside = await h.ev(() => { const c = I().court; I().court = null; S.game.currentMission = 'm3'; const r = certWindowOpen('fin_recording'); I().court = c; S.game.currentMission = 'm8'; return r; });
  check(!outside, 'R12: after the season only a replayed M8 reopens the Ekosodin window');

  // ================= R17: the reveal after 'confront' =================
  const conf = await h.ev(() => { const d = I(), o = d.order; d.order = 'confront'; const t = intelRevealExtras().after.map(l => l.text); d.order = o; return t; });
  h.log('R17:', JSON.stringify(conf));
  check(conf.some(t => /open call/.test(t)) && !conf.some(t => /changed every phone/.test(t)), 'R17: she no longer claims she changed every phone that night');
  check(conf.some(t => /Engineer never called me again/.test(t)), 'R17: she cut the Engineer off, which the M7 tower data does not contradict');
  h.assert(!fails.length, fails.length + ' checks failed: ' + fails.join(' · '));
  h.log('v13_fix_model_court: all checks passed');
};
