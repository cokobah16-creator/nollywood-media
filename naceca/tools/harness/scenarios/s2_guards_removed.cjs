// Season 2 guards (team guards, D15): a save from a Season 2 run, loaded with the Season 2 layer REMOVED.
// Ported from the defects review's removed.cjs. Run it on the Season 1-only page (NACECA_SEASON2=0):
//   node tools/harness/run.cjs tools/harness/scenarios/s2_guards_removed.cjs --html <build_s1>/naceca.html --w 1280 --h 800
// The old teaser cards m9-m12 stay locked and can't be clicked, whatever completedMissions says; Season 1's own
// completed cards still read COMPLETED and open. On the Season 2 page (run it there too) the layer's own rules
// apply instead: a completed Season 2 case is COMPLETED and opens.
module.exports = async h => {
  const s2page = await h.ev(() => !!(window.V13 && V13.isS2));
  h.log('page:', s2page ? 'Season 2' : 'Season 1 only');
  await h.ev(() => {
    ART.failed = true; S = defaultState();
    S.game.completedMissions = ['m0', 'm1', 'm2', 'm3', 'm3n', 'm4', 'm5', 'm6', 'm7', 't7', 'm8', 'm9', 'm10', 'm11'];
    S.game.seasonOneComplete = true; S.game.s2 = { started:1, hubs:{ h9:1, h10:1 } };
    renderMissionSelect(); showOverlay('screen-missions');
  });
  await h.step(500);
  const cards = await h.ev(() => [...document.querySelectorAll('#mission-grid .mission-card')].map(c => ({
    id:c.dataset.mid, stamp:(c.querySelector('.stamp') || {}).textContent, disabled:!!c.disabled, locked:c.classList.contains('locked'), completed:c.classList.contains('completed') })));
  const s2 = cards.filter(c => /^m(9|1[0-2])$/.test(c.id));
  h.log('S2 cards:', s2.map(c => `${c.id}=${c.stamp}${c.disabled ? '(disabled)' : ''}`).join(' '));
  const m8 = cards.find(c => c.id === 'm8');
  h.assert(m8 && m8.completed && !m8.disabled && m8.stamp === 'COMPLETED', 'Season 1\'s M8 still reads COMPLETED and is clickable ' + JSON.stringify(m8));
  if(s2page){
    for(const id of ['m9', 'm10', 'm11']){ const c = s2.find(x => x.id === id); h.assert(c && c.completed && !c.disabled, `Season 2 page: ${id} is a completed, playable Season 2 case ` + JSON.stringify(c)); }
    return;
  }
  h.assert(s2.length >= 3, 'the Season 1 page still has its Season 2 teaser cards');
  for(const c of s2) h.assert(c.locked && c.disabled && !c.completed && c.stamp !== 'COMPLETED', `teaser ${c.id} is locked and not clickable ` + JSON.stringify(c));
  // a click on a locked card does nothing (it is disabled; the handler refuses locked cards too)
  await h.ev(() => { const c = document.querySelector('#mission-grid .mission-card[data-mid="m9"]'); c.disabled = false; c.click(); c.disabled = true; });
  await h.step(1500);
  const after = await h.ev(() => JSON.stringify({ cm:S.game.currentMission, ov:[...document.querySelectorAll('.overlay.show')].map(o => o.id).join(',') }));
  h.log('after clicking m9:', after);
  h.assert(await h.ev(() => S.game.currentMission !== 'm9' && !!document.querySelector('#screen-missions.show')), 'clicking the m9 teaser starts nothing ' + after);
};
