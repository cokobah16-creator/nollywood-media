// v13 A · old saves and replays (design A1, A9): the first I() on a state with no S.game.intel.items
// backfills legacy exhibit records (certified, only the beta's own flaws), marks briefings already behind
// the player 'missed', sets started{} and the legacy warrants; it runs once, survives save/load, and a new
// game is never migrated. Also: v12.2 evidence ids have metadata (efe_statement through V12.logEvidence,
// musa_record, tail_plate), KC's SIM source follows how it was obtained, Night Shift / car exhibits are
// booked in at the next start.
const A_LIB = require('./v13_a_lib.cjs');
const UP_TO_M7 = ['m0', 'm1', 'm2', 'm3', 'm3n', 'm4', 'm5', 'm6', 'm7', 't7'];
const OLD_EV = ['phishing_template', 'kc_sims', 'laptop', 'cash', 'safe_drives', 'obi_notebook', 'osas_voicemail', 'co_madam', 'broken_seal', 'ransom_ledger',
  'musa_statement', 'musa_record', 'shrine_pots', 'shrine_cache', 'e_shrine_ledger', 'asaba_sims', 'asaba_runner', 'tower_fibre', 'tower_cdr', 'tower_fix', 'efe_statement', 'tail_plate', 'co_plate'];
module.exports = async h => {
  const A = A_LIB.lib(h);

  // ---- a friends'-beta save at h4: m0–m4 done, no S.game.intel at all ----
  await h.start('m5', { completed:['m0', 'm1', 'm2', 'm3', 'm3n', 'm4'], briefings:true, wait:3600, state:new Function('S', `
    delete S.game.intel;
    S.game.evidence = ${JSON.stringify(['phishing_template', 'kc_sims', 'laptop', 'cash', 'osas_voicemail', 'ransom_ledger', 'musa_statement', 'co_plate'])}.map(id => ({ id, name:id === 'kc_sims' ? "KC's Statement — His SIM Batch" : id }));
    S.game.accusations = { lagos:{ suspect:'obi', method:'phish', money:'wallet', ok:{ suspect:true, method:true, money:true }, warrant:'exigent', settled:'m3' } };
    S.game.evQ = { laptop:'weak', cash:'weak', safe_drives:'weak' };
    S.game.moralChoices = { checkpoint:'flip_driver' };
  `) });
  const a = await h.ev(() => {
    const d = S.game.intel, it = d.items;
    return { cur:S.game.currentMission, briefed:Object.assign({}, d.briefed), started:Object.keys(d.started).sort(), ids:Object.keys(it).sort(),
      legacy:Object.values(it).every(x => x.legacy === true && x.cert === true), custody:it.laptop && it.laptop.custody.map(c => c.t),
      laptop:intelItemFlaws('laptop').map(f => f.k), cash:intelItemFlaws('cash').map(f => f.k), template:intelItemFlaws('phishing_template').map(f => f.k),
      musa:intelItemFlaws('musa_statement').map(f => f.k), win:certWindowOpen('phishing_template'), kcSrc:INTEL_ITEMS.kc_sims.src, kcKind:INTEL_ITEMS.kc_sims.kind,
      w:['w_cdr', 'w_eko'].map(id => V12.warrantState(id).status) };
  });
  h.log('h4 save', JSON.stringify(a));
  h.assert(a.cur === 'h4', 'the save resumes at the Benin field office');
  h.assert(a.briefed.m3 === 'missed' && a.briefed.m4 === 'missed' && !a.briefed.m5 && !a.briefed.m6, 'briefings behind the player are missed, later ones open');
  h.assert(['m0', 'm1', 'm2', 'm3', 'm3n', 'm4'].every(m => a.started.includes(m)), 'started{} comes from completedMissions');
  h.assert(a.ids.join() === ['cash', 'kc_sims', 'laptop', 'musa_statement', 'osas_voicemail', 'phishing_template', 'ransom_ledger'].join(), 'one record per known exhibit (co_plate has no exhibit model): ' + a.ids.join());
  h.assert(a.legacy && a.custody[0] === 'Certified before the Case Desk existed', 'legacy records: certified before the Case Desk existed');
  h.assert(a.laptop.join() === 'warrantless' && a.cash.join() === 'warrantless', 'legacy Lekki exhibits keep the beta\'s exigent flaw, nothing else');
  h.assert(a.template.length === 0 && a.musa.length === 0, 'legacy items carry no s84, inducement, custody or noorder');
  h.assert(/statement/i.test(a.kcSrc) && a.kcKind === 'TESTIMONY', 'KC\'s SIM batch from his statement says so');
  h.assert(a.w.join() === 'pending,pending', 'before m7 the later orders are still to come');
  // the migration runs once; new items after it are ordinary records
  const b = await h.ev(() => {
    const n0 = Object.keys(S.game.intel.items).length, c0 = S.game.intel.items.laptop.custody.length;
    collectEvidence({ id:'broken_seal', name:'Mismatched Container Seal', xp:0 });
    I(); I();
    const it = S.game.intel.items.broken_seal;
    return { n:Object.keys(S.game.intel.items).length - n0, legacy:!!it.legacy, cert:it.cert, custody:it.custody.map(c => c.t), c1:S.game.intel.items.laptop.custody.length - c0 };
  });
  h.assert(b.n === 1 && !b.legacy && b.cert === false && b.custody[0] === 'Logged by Agt. Kelechi' && b.c1 === 0, 'after the migration a new exhibit is an ordinary record; nothing is migrated twice');
  // save → load keeps the records and does not migrate again
  const c = await h.ev(() => {
    S.game.intel.briefed.m5 = 'committed'; S.game.intel.items.laptop.custody.push({ t:'probe' });
    saveGame(true); S = defaultState(); loadGame();
    const d = S.game.intel;
    return { briefed:d.briefed.m5, probe:d.items.laptop.custody.filter(x => x.t === 'probe').length, legacy:!!d.items.laptop.legacy, seal:!!d.items.broken_seal && !d.items.broken_seal.legacy };
  });
  h.assert(c.briefed === 'committed' && c.probe === 1 && c.legacy && c.seal, 'save/load keeps the intel record as it was');

  // ---- an empty {} is a new record a scenario asked for (design A0): nothing is migrated or missed ----
  // (checked in place: loading m5 here would hand over to team B's briefing code)
  const fr = await h.ev(() => {
    const keep = S.game; S.game = JSON.parse(JSON.stringify(keep));
    S.game.completedMissions = ['m0', 'm1', 'm2', 'm3', 'm3n', 'm4']; S.game.evidence = [{ id:'laptop', name:'Encrypted Laptop' }]; S.game.intel = {};
    const d = I(), out = { briefed:Object.keys(d.briefed).length, items:Object.keys(d.items).length };
    S.game.intel = undefined; const m = I(); out.missingBriefed = m.briefed.m4; out.missingLegacy = !!(m.items.laptop && m.items.laptop.legacy);
    S.game = keep; return out;
  });
  h.assert(fr.briefed === 0 && fr.items === 0, 'S.game.intel = {} starts fresh: no missed briefings, no legacy records');
  h.assert(fr.missingBriefed === 'missed' && fr.missingLegacy, 'no S.game.intel at all: the old-save migration runs');

  // ---- an old save past M7 reaches the trial: no s84 or noorder objection on any pre-v13 exhibit ----
  await h.start('m8', { completed:UP_TO_M7, briefings:true, wait:2500, state:new Function('S', `
    delete S.game.intel;
    S.game.evidence = ${JSON.stringify(OLD_EV.concat(['fin_drive']))}.map(id => ({ id, name:id }));
    S.game.moralChoices = { tower:'hold', asaba:'rescue', checkpoint:'flip_driver' };
  `) });
  const t = await h.ev(() => {
    const d = S.game.intel, drive = d.items.fin_drive, pre = Object.keys(d.items).filter(id => d.items[id].legacy);
    const flaws = pre.map(id => [id, intelItemFlaws(id).map(f => f.k)]);
    const ex = typeof courtExhibits === 'function' ? courtExhibits().filter(x => pre.includes(x.id)).map(x => [x.id, x.k]) : null;
    return { briefed:Object.assign({}, d.briefed), w:['w_cdr', 'w_eko'].map(id => { const s = V12.warrantState(id); return s.status + '/' + s.route; }), flaws, ex, n:pre.length,
      efe:!!d.items.efe_statement, tail:!!d.items.tail_plate, rec:!!d.items.musa_record,
      drive:drive && { legacy:!!drive.legacy, cert:drive.cert, flaws:intelItemFlaws('fin_drive').map(f => f.k), win:certWindowOpen('fin_drive') } };
  });
  h.log('m8 save', JSON.stringify(t).slice(0, 1500));
  h.assert(['m3', 'm4', 'm5', 'm6', 'm7'].every(k => t.briefed[k] === 'missed'), 'every briefing behind an M8 save is missed');
  h.assert(t.w.join() === 'signed/legacy,signed/legacy', 'past t7: the Ugbowo order and the Ekosodin warrant are signed (legacy)');
  h.assert(t.n === 22, 'every pre-v13 exhibit from a finished operation is a legacy record (' + t.n + ')');
  h.assert(t.drive && !t.drive.legacy && t.drive.cert === false && t.drive.flaws.join() === 's84' && t.drive.win, 'an exhibit from the operation in progress (m8) gets an ordinary record, still certifiable');
  h.assert(t.efe && t.tail && t.rec, 'v12.2 evidence (Efe, the jeep plate, Musa\'s wired statement) has exhibit records');
  h.assert(t.flaws.every(([, k]) => !k.includes('s84') && !k.includes('noorder') && !k.includes('custody')), 'no s84 / noorder / custody flaw on any pre-v13 exhibit');
  h.assert(t.ex && t.ex.length >= 3 && t.ex.every(([, k]) => k !== 's84' && k !== 'noorder' && k !== 'custody'), 'the trial raises no s84 or noorder objection on them: ' + JSON.stringify(t.ex));

  // ---- a new game is never migrated ----
  await h.ev(() => { showOverlay(null); startNewInvestigation('senior'); });
  await h.step(1500);
  const n = await h.ev(() => {
    const d = S.game.intel;
    collectEvidence({ id:'co_madam', name:"Courier's Dropped Phone", xp:0 });
    return { has:!!d, items:d && typeof d.items, briefed:d && Object.keys(d.briefed).length, legacy:!!(d.items.co_madam && d.items.co_madam.legacy), cert:d.items.co_madam && d.items.co_madam.cert,
      w:['w_cdr', 'w_eko'].map(id => V12.warrantState(id).status).join() };
  });
  h.assert(n.has && n.items === 'object' && n.briefed === 0 && !n.legacy && n.cert === false && n.w === 'pending,pending', 'a new game gets an empty record at m0, nothing missed or legacy');

  // ---- evidence outside collectEvidence, booking-in after Night Shift and the car, KC's SIM source ----
  await h.start('m2', { completed:['m0', 'm1'] });
  const e = await h.ev(() => {
    V12.logEvidence({ id:'efe_statement', name:"Efe's Statement — Students Paid to Move \"Payroll\" Money", xp:0 });
    collectEvidence({ id:'kc_sims', name:"KC's SIM Batch — Sleeves Behind the Stalls", xp:0 });
    collectEvidence({ id:'osas_voicemail', name:'Voicemail', xp:0 });
    collectEvidence({ id:'tail_plate', name:'Plate BEN 417 KJ', xp:0 });
    const d = I();
    const booked = id => d.items[id].custody.some(c => /exhibit room/.test(c.t));
    const before = [booked('osas_voicemail'), booked('tail_plate')];
    S.game.completedMissions.push('m2', 'm3', 'm3n', 'm4', 'm5', 'm6', 'm7', 't7');
    intelOnMissionStart('m8');
    return { efe:!!d.items.efe_statement && !d.items.efe_statement.legacy, efeM:d.items.efe_statement && d.items.efe_statement.m, before, after:[booked('osas_voicemail'), booked('tail_plate')],
      kcSrc:INTEL_ITEMS.kc_sims.src, kcKind:INTEL_ITEMS.kc_sims.kind, tailE:INTEL_ITEMS.tail_plate.e, srcs:Object.values(INTEL_ITEMS).map(m => m.src) };
  });
  h.log('misc', JSON.stringify(Object.assign({}, e, { srcs:e.srcs.length })));
  h.assert(e.efe && e.efeM === 'm7', 'Efe\'s statement (V12.logEvidence) gets a record');
  h.assert(e.before.join() === 'false,false' && e.after.join() === 'true,true', 'Night Shift and car exhibits are booked into the exhibit room at the next start');
  h.assert(/sleeves/i.test(e.kcSrc) && e.kcKind === 'PHYSICAL', 'KC\'s SIM batch from the sleeve sweep says so');
  h.assert(e.tailE === true, 'the jeep plate photo is electronic (s.84)');
  await A.textRules(e.srcs, 'exhibit sources');
  h.assert(h.errors.length === 0, 'no page errors');
};
