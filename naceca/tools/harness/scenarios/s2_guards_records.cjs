// Season 2 guards (team guards, RT14): Season 1's records keep Season 1's data. Run it on the Season 2 page
// (and on the Season 1-only page, where it checks only the Season 1 half):
//   node tools/harness/run.cjs tools/harness/scenarios/s2_guards_records.cjs --html <build>/naceca.html --w 1280 --h 800
// After a Season 2 case has started and ended with exhibits logged, a Season 1 replay's operations table
// NOTES list no Season 2 exhibit, and the v13 record (I().started, opLog) has no Season 2 id.
// V13.S2_EV is exported by s2_merge.js (screens team): polyfilled here with the same list when it is missing.
const S1 = ['m0', 'm1', 'm2', 'm3', 'm3n', 'm4', 'm5', 'm6', 'm7', 't7', 'm8'];
const S2_EV = ['drive_image', 'upstream_ledger', 'evidence_register', 'pos_t4_log', 'bvn_link', 'cash_bundles', 'lucky_statement', 'fuel_samples',
  'waybill_book', 'felix_phone', 'barge_track', 'loading_log', 'tank3_sample', 'cac_record', 'bank_trail', 'gate_register', 'transfer_docket',
  'dg_recording', 'visitor_book', 'visitor_book_photo', 'ereba_photo', 'barge_cash', 'senator_words'];
module.exports = async h => {
  const s2page = await h.ev(() => !!(window.V13 && V13.isS2));
  h.log('page:', s2page ? 'Season 2' : 'Season 1 only');
  const notes = () => h.ev(() => {
    V12.openOps();
    const b = document.getElementById('ops-notes'); if(b && !b.classList.contains('on')) b.click();
    const t = [...document.querySelectorAll('#screen-ops .ops-notes .case-row .nm')].map(e => e.textContent);
    const c = document.getElementById('ops-close'); if(c) c.click(); else showOverlay(null);
    return t;
  });
  if(!s2page){
    // Season 1 only: the notes still list Season 1 exhibits (the guard has nothing to skip)
    await h.start('m2', { completed:['m0', 'm1'] });
    await h.ev(() => { collectEvidence({ id:'bank_record', name:'Bank record — test', xp:1 }); });
    const t = await notes();
    h.log('S1 page notes:', JSON.stringify(t.filter(x => /^EVIDENCE/.test(x))));
    h.assert(t.some(x => /Bank record — test/.test(x)), 'Season 1 exhibits are listed on the Season 1 page');
    h.assert(await h.ev(() => !!I().started.m2), 'I().started has m2');
    return;
  }
  const poly = await h.ev(list => { if(Array.isArray(V13.S2_EV)) return false; V13.S2_EV = list.slice(); return true; }, S2_EV);
  h.log('V13.S2_EV', poly ? 'polyfilled (screens team exports it in s2_merge.js)' : 'exported by the layer');

  // ---- a Season 2 case: begins (Case 12), logs exhibits, ends ----
  await h.ev(S1 => {
    ART.failed = true; ART.promise = null;
    S = defaultState(); S.game.completedMissions = S1.slice(); S.game.seasonOneComplete = true;
    S.game.intel = { briefed:{ m3:1, m4:1, m5:1, m6:1, m7:1 } };
    V13._skipHubs = true;
    showOverlay(null); loadMission('m12');
    setTimeout(() => { if(document.querySelector('#screen-controls.show')) beginMission('m12'); }, 700);
  }, S1);
  for(let k = 0; k < 40; k++){ await h.step(400); if(await h.ev(() => S.game.currentMission === 'm12' && !!S.game._opStart && !!ENGINE.player)) break; }
  h.assert(await h.ev(() => S.game.currentMission === 'm12'), 'Case 12 began');
  await h.ev(() => {
    V13.ev('loading_log', 'The real loading log', 'good', 1);
    V13.ev('tank3_sample', 'Tank 3 diesel sample', 'contested', 1);
    collectEvidence({ id:'drive_image', name:'Forensic image of exhibit 14', xp:1 });
  });
  await h.ev(() => { try{ V13.finish('m12'); }catch(e){ console.warn('[guards] finish', e); } });
  await h.step(1500);
  const rec = await h.ev(() => ({ started:Object.keys(I().started || {}), opLog:Object.keys(I().opLog || {}), m8Replay:I().m8Replay, ev:(S.game.evidence || []).map(e => e.id) }));
  h.log('after Case 12:', JSON.stringify(rec));
  h.assert(rec.ev.includes('loading_log') && rec.ev.includes('drive_image'), 'Season 2 exhibits are held');
  const s2ids = id => /^(m9|m1[0-5]|m13b|h9|h1[0-4])$/.test(id);
  h.assert(!rec.started.some(s2ids), 'I().started holds no Season 2 id: ' + rec.started.join(','));
  h.assert(!rec.opLog.some(s2ids), 'opLog holds no Season 2 id: ' + rec.opLog.join(','));

  // ---- a Season 1 replay (Case 02) on the same save ----
  await h.ev(() => {
    showOverlay(null);
    S.game.moralChoices = S.game.moralChoices || {}; S.game.moralChoices.market_runner = false;
    loadMission('m2');
    setTimeout(() => { if(document.querySelector('#screen-controls.show')) beginMission('m2'); }, 700);
  });
  for(let k = 0; k < 40; k++){ await h.step(400); if(await h.ev(() => S.game.currentMission === 'm2' && !!ENGINE.player && !document.querySelector('#screen-controls.show'))) break; }
  h.assert(await h.ev(() => S.game.currentMission === 'm2'), 'the Season 1 replay began');
  await h.ev(() => { showOverlay(null); collectEvidence({ id:'bank_record', name:'Bank record — test', xp:1 }); });
  const t = await notes();
  const evRows = t.filter(x => /^EVIDENCE/.test(x));
  h.log('S1 replay notes:', JSON.stringify(evRows));
  const names = await h.ev(list => (S.game.evidence || []).filter(e => list.includes(e.id)).map(e => e.name), await h.ev(() => V13.S2_EV));
  h.assert(names.length >= 3, 'the save still holds the Season 2 exhibits: ' + names.join(' · '));
  h.assert(!evRows.some(r => names.some(n => r.includes(n))), 'the Season 1 NOTES list no Season 2 exhibit');
  h.assert(evRows.some(r => /Bank record — test/.test(r)), 'the Season 1 NOTES still list Season 1 exhibits');
  const rec2 = await h.ev(() => Object.keys(I().started || {}));
  h.log('I().started after the replay:', rec2.join(','));
  h.assert(rec2.includes('m2') && !rec2.some(s2ids), 'I().started has m2 and no Season 2 id');
};
