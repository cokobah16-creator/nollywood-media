// screens team: shared helpers for the screens_* probes (CHECK lines, the Season 2 boards set up with data, Case 15 handles)
const L = require('./c15lib.js'), sc = L.sc, R = require('./screens_rlib.js');

/* CHECK <id> PASS|FAIL|SKIP <detail> ... and CHECKS <pass>/<total> at the end */
function checks(T) {
  const res = [];
  return {
    ok(id, cond, detail) { res.push(!!cond); console.log(`CHECK ${id} ${cond ? 'PASS' : 'FAIL'} ${detail == null ? '' : String(detail).slice(0, 600)}`); return !!cond; },
    skip(id, why) { console.log(`CHECK ${id} SKIP ${why}`); },
    done() { console.log(`CHECKS ${res.filter(Boolean).length}/${res.length}`); },
    get fails() { return res.filter(x => !x).length; },
  };
}

/* the office before the trial (h13) with sources, tips in every state, exhibits with tiers and a Court 5 record */
const OFFICE = L.STRONG + "S.game.completedMissions.push('m9','m10','m11','m12','m13','m13b');" +
  "V13.recruit('TILL', 45); V13.recruit('NETS', 60); V13.src('NETS').burned = true; V13.src('TILL').exp = 75; V13.src('HERBS').reg = true;" +
  "V13.s2().tipLog = [" +
  "{ key:'TIDE:0', code:'TIDE', after:'m12', text:'A barge loads at the Riverstone jetty after the rain, never before.', truth:true, state:'new' }," +
  "{ key:'TILL:0', code:'TILL', after:'m12', text:'The changer moved his cash to a kiosk in Warri.', truth:false, state:'new' }," +
  "{ key:'HERBS:0', code:'HERBS', after:'m10', text:'Mama Karo says the blue kaftan man pays the boys on Thursdays.', truth:true, state:'held' }," +
  "{ key:'NETS:0', code:'NETS', after:'m11', text:'Pa Timi says the camp moved upriver.', truth:false, state:'false' }," +
  "{ key:'GATE:0', code:'GATE', after:'m13b', text:'Bitrus says the Prado comes on Fridays.', truth:true, state:'filed' } ];" +
  "S.game.evQ.drive_image = 'contested'; S.game.evQ.waybill_book = 'weak';" +
  "V13.s2().trial = { d1:'guilty', d2:'plea', d3:'notguilty', exhibits:{ drive_image:'P1', pos_t4_log:'P2' }, rejected:['lucky_statement'] }; S.game.difficulty = 'senior';";

const shown = (T, id) => T.ev(id => { const e = document.getElementById(id); return !!(e && e.classList.contains('show')); }, id);
const overlays = T => T.ev(() => [...document.querySelectorAll('.overlay.show')].map(o => o.id).join(',') || '(none)');
const setMode = (T, mode) => T.ev(m => { S.game.difficulty = m; if (typeof syncDifficultyClass === 'function') syncDifficultyClass(); return document.body.className; }, mode);
const modalEnd = (T, id) => T.ev(id => { try { if (typeof v13ModalEnd === 'function') v13ModalEnd(id); } catch (e) {} }, id);

/* the court screens without walking the trial: a state with exhibits in every condition */
const courtState = T => T.ev(() => {
  const K = V13.court, S = K.reset(); K.active = true; document.body.classList.add('v13-court');
  Object.assign(S, { day:1, cred:57 });
  ['drive_image', 'upstream_ledger', 'pos_t4_log', 'cash_bundles'].forEach((id, i) => { S.admitted.push(id); S.exhibits[id] = 'P' + (i + 1); S.weight[id] = i === 1 ? 'reduced' : 'full'; });
  S.nextP = 5; S.mfi.bvn_link = { label:'MFI-1', fix:'bank_cert' }; S.mfiOrder.push('bvn_link'); S.rejected.push('lucky_statement'); S.withdrawn.push('lucky_statement'); S.rejected.push('waybill_book');
  S.finalEls = { e1a:true, e1b:true, e1c:false, e2a:true, e2b:true, e3a:true, e3b:true, e3c:true }; S.nocase = { d1:'overruled', d2:'overruled', d3:'upheld' };
  S.nocaseEls = { e3a:true, e3b:false, e3c:false }; S.plea.d2 = true;
  return true;
});

/* Case 15 with the brief closed: the debug handles (V13._c15) open its screens directly */
async function c15(T, extra) {
  const ok = await sc.s2start(T, 'm15', L.STRONG + (extra || ''));
  await L.waitDialogue(T, 30000);
  await T.ev(() => { DLG.onComplete = null; if (typeof endDialogue === 'function') endDialogue(); showOverlay(null); });
  await T.wait(600);
  return ok;
}
const clearC15 = T => T.ev(() => { for (const id of ['screen-seal15', 'screen-accuse15', 'screen-case15']) { try { v13ModalEnd(id); } catch (e) {} const o = document.getElementById(id); if (o) o.classList.remove('show'); } showOverlay(null); });

module.exports = { L, sc, R, checks, OFFICE, shown, overlays, setMode, modalEnd, courtState, c15, clearC15 };
