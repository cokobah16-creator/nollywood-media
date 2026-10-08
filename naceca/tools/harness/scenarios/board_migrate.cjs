// BOARD · old saves: S.game.ops gains cases/strikes/struck/unlocked defaults; existing inks stay;
// cards that already carry ink stay on the table even if their lead is now behind fieldwork.
//   node tools/harness/run.cjs tools/harness/scenarios/board_migrate.cjs --html /tmp/naceca-board/naceca.html
module.exports = async h => {
  await h.start('m2', { completed:['m0', 'm1'] });
  const r = await h.ev(() => {
    // a v12.2 save: the auto-granted SIM batch (no fair-arrest flag), a contested trace, the old ops shape
    const old = defaultState();
    old.game.currentMission = null;
    old.game.completedMissions = ['m0', 'm1', 'm2', 'm3', 'm3n', 'm4', 'm5', 'm6', 'm7'];
    old.game.evidence = [{ id:'co_madam' }, { id:'kc_sims' }, { id:'tower_cdr' }, { id:'obi_notebook' }];
    old.game.evQ = { tower_cdr:'weak' };
    old.game.moralChoices = { market_runner:'caught', choice:'force' };
    old.game.flags = { v12_madam:true };
    old.game.intelScore = 140;
    old.game.ops = { pencils:['l_market|s_kc', 'e_kcsims|s_kc'], inked:['e_kcsims|s_kc', 'l_lekki|s_obi', 'e_cdr|s_voice', 'e_madam|e_notebook'], theories:{}, tries:14, sinceInk:3, group:null, seen:{ s_obi:true } };
    localStorage.setItem(SAVE_KEY, JSON.stringify(old));
    const ok = loadGame();
    const o = S.game.ops;
    return {
      ok, v:o.v, inked:o.inked.slice(), pencils:o.pencils.slice(), tries:o.tries,
      cases:Object.keys(o.cases || {}), strikes:['lagos', 'route', 'voice'].map(c => V12.caseStrikes(c)),
      struck:Array.isArray(o.struck), unlocked:Object.keys(o.unlocked || {}).sort(),
      kcsims:V12.opsVisible('e_kcsims'), cdr:V12.opsVisible('e_cdr'), phish:V12.opsVisible('e_phish'), madam:V12.opsVisible('s_madam'),
      w:V12.warrantFor('lagos'), legacy:typeof V12.warrant(),
    };
  });
  h.log(JSON.stringify(r));
  h.assert(r.ok && r.v === 2, 'the old save loads and is migrated');
  h.assert(r.inked.length === 4 && r.inked.includes('e_kcsims|s_kc') && r.inked.includes('e_cdr|s_voice'), 'every existing ink is kept');
  h.assert(r.cases.join() === 'lagos,route,voice' && r.strikes.join() === '0,0,0' && r.struck, 'cases start clean: no strikes, no struck lines');
  h.assert(r.tries === 14, 'old counters are kept');
  h.assert(r.pencils.length === 1 && r.pencils[0] === 'l_market|s_kc', 'pencils stay pencils (an inked duplicate is dropped)');
  h.assert(r.kcsims && r.cdr, 'cards that already carry ink stay on the table');
  h.assert(r.unlocked.includes('e_kcsims') && r.unlocked.includes('e_cdr'), 'those leads are recorded as opened');
  h.assert(!r.phish, 'a lead with no ink follows the new rule (no clean scan, no card)');
  h.assert(r.madam, 'Madam (flagged on the old save) stays');
  h.assert(r.legacy === 'boolean', 'V12.warrant() still answers');

  // migration is idempotent and the board renders on the migrated save
  const r2 = await h.ev(() => {
    const before = JSON.stringify(S.game.ops.inked);
    V12.ops(); V12.ops();
    V12.openOps('voice');
    const ok = !!document.querySelector('.bd-case[data-case="voice"]') && !!document.querySelector('.ops-chip[data-id="e_cdr"]');
    V12.closeOps();
    return { same:before === JSON.stringify(S.game.ops.inked), ok };
  });
  h.assert(r2.same && r2.ok, 'migration is idempotent and the migrated board renders');

  // a save with a broken ops object is rebuilt, not crashed on
  const r3 = await h.ev(() => {
    S.game.ops = { pencils:'x', inked:null, theories:7, cases:{ lagos:5 } };
    const o = V12.ops();
    return { p:Array.isArray(o.pencils), i:Array.isArray(o.inked), c:typeof o.cases.lagos === 'object' && o.cases.lagos.strikes === 0 };
  });
  h.assert(r3.p && r3.i && r3.c, 'a malformed ops object is repaired');
  h.assert(h.errors.length === 0, 'no page errors');
};
