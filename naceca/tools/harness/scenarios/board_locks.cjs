// BOARD · key leads behind fieldwork: two per case, one behind a scan and one behind a witness.
// Locked cards are not shown; the slip says "N leads need fieldwork" (Recruit also says which kind).
// Contested evidence never opens a lock.
//   node tools/harness/run.cjs tools/harness/scenarios/board_locks.cjs --html /tmp/naceca-board/naceca.html
const HUBS = S => { S.game.mem = { hubs:{ h2:1, h4:1, h5:1, h6:1, h7:1 } }; };
module.exports = async h => {
  const vis = id => h.ev(i => V12.opsVisible(i), id);
  const slip = c => h.ev(c => { V12.openOps(c); const s = document.querySelector('.bd-case .bd-locked'); const t = s ? s.textContent : ''; V12.closeOps(); return t; }, c);
  // play a document check: pick option i and the line containing `line`; twice wrong = contested
  const doc = async (key, opt, line) => {
    await h.ev(k => openPuzzle(k, ()=>{}), key);
    await h.step(250);
    await h.ev(([opt, line]) => {
      document.querySelector(`.v12-opt[data-i="${opt}"]`).click();
      const L = [...document.querySelectorAll('.v12-line.live')].find(el => el.textContent.includes(line)); L.click();
      document.getElementById('v12-doc-go').click();
    }, [opt, line]);
    await h.step(1700);
  };
  const docFail = async (key, opt, line) => {
    await h.ev(k => openPuzzle(k, ()=>{}), key);
    await h.step(250);
    for(let i = 0; i < 2; i++){
      await h.ev(([opt, line]) => {
        document.querySelector(`.v12-opt[data-i="${opt}"]`).click();
        const L = [...document.querySelectorAll('.v12-line.live')].find(el => el.textContent.includes(line)); L.click();
        document.getElementById('v12-doc-go').click();
      }, [opt, line]);
      await h.step(200);
    }
    await h.ev(() => document.getElementById('v12-doc-go').click());     // CONTINUE
    await h.step(400);
  };

  // ---- LAGOS: e_phish behind a clean phone scan
  await h.start('m2', { completed:['m0', 'm1'] });
  h.assert(!(await vis('e_phish')) && !(await vis('e_kcsims')), 'both Lagos key leads start locked');
  const s0 = await slip('lagos');
  h.assert(/2 leads need fieldwork\.$/.test(s0.trim()), 'Senior: just the count — ' + s0);
  await h.ev(() => { S.game.difficulty = 'recruit'; });
  const s0r = await slip('lagos');
  h.assert(/2 leads need fieldwork:/.test(s0r) && /scan/.test(s0r) && /statement/.test(s0r), 'Recruit: says which fieldwork — ' + s0r);
  await h.ev(() => { S.game.difficulty = 'senior'; });
  const chips = await h.ev(() => { V12.openOps('lagos'); const ids = [...document.querySelectorAll('.ops-chip')].map(b => b.dataset.id); V12.closeOps(); return ids; });
  h.assert(!chips.includes('e_phish') && !chips.includes('e_kcsims'), 'locked cards are not drawn');

  await docFail('market_phone_scan', 0, 'IMG_003');
  const weak = await h.ev(() => ({ held:V12.hasEv('phishing_template'), q:V12.evQ('phishing_template') }));
  h.assert(weak.held && weak.q === 'weak', 'a failed scan logs the template as contested');
  h.assert(!(await vis('e_phish')), 'contested evidence does not open the scan lock');

  await h.start('m2', { completed:['m0', 'm1'] });
  await doc('market_phone_scan', 2, 'IMG_001');
  h.assert(await h.ev(() => V12.evQ('phishing_template') === 'good' && !!(S.game.docClean || {}).market_phone_scan), 'a clean scan is recorded');
  h.assert(await vis('e_phish'), 'a clean scan opens e_phish');
  // and the lead stays even if the evidence is contested later
  await h.ev(() => { S.game.evQ = { phishing_template:'weak' }; });
  h.assert(await vis('e_phish'), 'an opened lead stays on the table');

  // ---- LAGOS: e_kcsims behind KC's statement after a fair arrest — not after force
  await h.start('m2', { completed:['m0', 'm1'] });
  await h.ev(() => { S.game.moralChoices.choice = 'force'; S.game.moralChoices.market_runner = 'caught'; DLG.scriptKey = 'market_runner'; DLG.onComplete = null; endDialogue(); });
  await h.step(1300);
  h.assert(await h.ev(() => !V12.hasEv('kc_sims') && !S.game.flags.kc_statement), 'force: KC says nothing usable, no SIM batch');
  h.assert(!(await vis('e_kcsims')), 'e_kcsims stays locked after force');
  // ...the SIM-sleeve sweep still finds it
  await h.ev(() => sideComplete('m2_sims'));
  await h.step(1700);
  h.assert(await h.ev(() => !!S.game.flags.kc_sweep && V12.hasEv('kc_sims')), 'the sleeve sweep logs the batch');
  h.assert(await vis('e_kcsims'), 'the SCAN sweep opens e_kcsims');

  await h.start('m2', { completed:['m0', 'm1'] });
  await h.ev(() => { S.game.moralChoices.choice = 'detain'; S.game.moralChoices.market_runner = 'caught'; DLG.scriptKey = 'market_runner'; DLG.onComplete = null; endDialogue(); });
  await h.step(1300);
  h.assert(await h.ev(() => !!S.game.flags.kc_statement && V12.hasEv('kc_sims')), 'detain: KC gives a statement and the batch is logged');
  h.assert(await vis('e_kcsims'), 'a fair arrest opens e_kcsims');
  const kcDossier = await h.ev(() => { V12.openOps('lagos'); document.querySelector('.ops-chip[data-id="e_kcsims"]').click(); const t = document.getElementById('ops-side').textContent; V12.closeOps(); return t; });
  h.assert(/KC, in his statement/.test(kcDossier), 'the dossier says where the lead came from');
  h.assert(/1 lead needs fieldwork/.test(await slip('lagos')), 'the slip counts down to one lead');

  // ---- THE ROUTE: s_engineer behind Musa (witness), e_weld behind the lorry sweep (scan)
  await h.start('m4', { completed:['m0', 'm1', 'm2', 'm3', 'm3n'] });
  h.assert(!(await vis('s_engineer')) && !(await vis('e_weld')), 'route key leads start locked');
  h.assert(/2 leads need fieldwork/.test(await slip('route')), 'route slip: 2 leads');
  await h.ev(() => { S.game.flags.musa_tip = true; S.game.evQ = { musa_statement:'weak' }; });
  h.assert(!(await vis('s_engineer')), 'a contested statement does not open the Engineer');
  await h.ev(() => { S.game.evQ = {}; });
  h.assert(await vis('s_engineer'), "Musa's clean statement opens the Engineer");
  const tr = await h.ev(() => { const t = SIDE.traces.find(x => x.t.id === 'm4b'); if(!t) return false; sideCollect(t); return true; });
  h.assert(tr, 'the welder\'s receipt trace exists in m4');
  await h.step(200);
  h.assert(await h.ev(() => !!S.game.flags.weld_receipt), 'logging the receipt sets the flag');
  h.assert(await vis('e_weld'), "the welder's receipt card opens");
  const weldLinks = await h.ev(() => V12.OPS_LINKS.filter(l => l.a === 'e_weld' || l.b === 'e_weld').map(l => l.a + '-' + l.b));
  h.assert(weldLinks.includes('e_weld-s_musa'), 'the receipt has a true link into the route');

  // ---- THE VOICE: e_cdr behind a clean trace, Efe's statement behind the witness
  await h.start('m7', { completed:['m0', 'm1', 'm2', 'm3', 'm3n', 'm4', 'm5', 'm6'], state:HUBS });
  h.assert(!(await vis('e_cdr')) && !(await vis('e_efe')), 'voice key leads start locked');
  await docFail('tower_call_trace', 0, 'WEAK');
  h.assert(await h.ev(() => V12.hasEv('tower_cdr') && V12.evQ('tower_cdr') === 'weak'), 'failed trace: call records contested');
  h.assert(!(await vis('e_cdr')), 'contested call records do not open the lead');
  await h.start('m7', { completed:['m0', 'm1', 'm2', 'm3', 'm3n', 'm4', 'm5', 'm6'], state:HUBS });
  await doc('tower_call_trace', 2, 'EKO-0122');
  h.assert(await vis('e_cdr'), 'a clean trace opens the call records');
  await h.ev(() => V12.logEvidence({ id:'efe_statement', name:'Efe\'s Statement', xp:10 }));
  await h.step(200);
  h.assert(await vis('e_efe'), "Efe's statement opens once he talks");
  const efeLinks = await h.ev(() => V12.OPS_LINKS.filter(l => l.a === 'e_efe' || l.b === 'e_efe').map(l => l.a + '-' + l.b));
  h.assert(efeLinks.includes('e_efe-e_drive'), "Efe's statement links into the payroll");
  h.assert(h.errors.length === 0, 'no page errors');
};
