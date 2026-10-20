// core: saves and Continue across Season 1 → Season 2 (RT02, RT03/D8), from the reviewers' rt_saves and d_reload.
const L = require('./core_lib.js'), sc = L.sc;
const S1END = "S = defaultState(); S.game.completedMissions = ['m0','m1','m2','m3','m3n','m4','m5','m6','m7','t7','m8']; S.game.currentMission = 'm8';" +
  "S.game.moralChoices = { market_runner:'caught', choice:'flip', arrest:'professional', checkpoint:'flip_driver', asaba:'rescue', tower:'hold', finale:'contested' };" +
  "S.game.flags = { finale:'contested' }; S.game.mem = { hubs:{ h2:1, h4:1, h5:1, h6:1, h7:1 } };";
async function reload(T) {
  await T.page.reload({ waitUntil: 'load', timeout: 180000 }); await T.wait(4000);
  await T.ev(() => { if (typeof ART !== 'undefined' && !ART.ready) ART.failed = true; });
}
async function cont(T) {
  await T.ev(() => { showOverlay('screen-title'); document.getElementById('btn-continue').click(); });
  await T.wait(900);
  for (let k = 0; k < 3; k++) { const b = await T.ev(() => { const r = document.getElementById('btn-recap-go'); if (r && r.offsetParent) { r.click(); return true; } return false; }); if (!b) break; await T.wait(1500); }
  await T.wait(1800);
  return T.ev(() => ({ ov: [...document.querySelectorAll('.overlay.show')].map(o => o.id).join(','), cur: S.game.currentMission,
    toast: (() => { const t = document.getElementById('toast'); return t && t.classList.contains('show') ? t.textContent.replace(/\s+/g, ' ').trim().slice(0, 80) : null; })(),
    card: !!document.querySelector('#title-card.show') }));
}
const cards = T => T.ev(() => { renderMissionSelect(); return [...document.querySelectorAll('#mission-grid .mission-card')].filter(c => /^m(9|1[0-5]|13b)$/.test(c.dataset.mid)).map(c => c.dataset.mid + ':' + (c.querySelector('.stamp') || {}).textContent).join(' | '); });
module.exports = async function (T) {
  const C = L.checks(T);
  // ---------- 1. quit on the M8 aftermath (finale contested, the trial not sat) ----------
  await T.ev(code => { (new Function(code))(); I().court = null; saveGame(true); }, S1END);
  await reload(T);
  await T.ev(() => { loadGame(); });
  const c1 = await cards(T);
  const n1 = await T.ev(() => nextPlayableMission());
  T.log('m8-aftermath cards', c1, 'next', n1);
  C.check('RT02 an M8-aftermath save: the Season 2 cards read FINISH SEASON 1', /m9:FINISH SEASON 1/.test(c1) && !/PLAYABLE/.test(c1) && n1 === null, c1 + ' next=' + n1);
  await T.ev(() => { document.getElementById('btn-missions-back') && document.getElementById('btn-missions-back').click(); });
  let r = await cont(T);
  T.log('m8-aftermath Continue', JSON.stringify(r));
  C.check('RT02 an M8-aftermath save: Continue opens the trial (after the mission select too)', /screen-court/.test(r.ov) && r.cur === 'm8', r);
  // ---------- 2. Case 09 done, the Benin office left: a reload, then Continue ----------
  await T.ev(prep => { (new Function(prep))(); S.game.completedMissions.push('m9'); V13.s2().hubs = { h9: Date.now() }; S.game.currentMission = 'h9'; showOverlay(null); saveGame(true); }, L.S1FRESH);
  await reload(T);
  r = await cont(T);
  T.log('after h9, Continue #1', JSON.stringify(r));
  C.check('RT03 a reload after h9: Continue #1 goes to Case 10, no CAMPAIGN UP TO DATE', r.cur === 'm10' && !/UP TO DATE/.test(r.toast || '') && !/screen-missions/.test(r.ov), r);
  // ---------- 3. Case 09 done, the office not yet: Continue opens the office first ----------
  await T.ev(prep => { (new Function(prep))(); S.game.completedMissions.push('m9'); V13.s2().hubs = {}; S.game.currentMission = 'm9'; showOverlay(null); saveGame(true); }, L.S1FRESH);
  await reload(T);
  r = await cont(T);
  await T.until(() => S.game.currentMission === 'h9', 15000);
  r.cur2 = await T.ev(() => S.game.currentMission);
  T.log('m9 done, office owed, Continue', JSON.stringify(r));
  C.check('RT03 an owed office still opens first (hubBefore)', r.cur2 === 'h9' && !/UP TO DATE/.test(r.toast || ''), r);
  // ---------- 4. an old finished-Season-1 save (no Season 2 state at all) ----------
  await T.ev(code => { (new Function(code))(); S.game.seasonOneComplete = true; I().court = { w:{}, proven:['c1', 'c2'], admitted:[], struck:[], cred:60, finale:'contested' }; I().reviewShown = true; showOverlay(null); saveGame(true); }, S1END);
  await reload(T);
  r = await cont(T);
  T.log('finished Season 1, Continue #1', JSON.stringify(r));
  C.check('RT03 an old finished-Season-1 save: Continue #1 goes to Case 09', r.cur === 'm9' && !/UP TO DATE/.test(r.toast || ''), r);
  const c4 = await cards(T);
  C.check('RT02 a finished Season 1: Case 09 is playable, the rest locked', /m9:PLAYABLE/.test(c4) && /m10:LOCKED/.test(c4), c4);
  // the mission select's subtitle (index.html's "Vertical slice…" line) is true with Season 2 present
  const desc = await T.ev(() => (document.querySelector('#screen-missions .desc') || {}).textContent || '');
  C.check('RT12 the mission select subtitle', !/Vertical slice/.test(desc) && /Season 2, Operation Upstream/.test(desc), desc);
  C.done();
};
