// Season 2 fix pass (core, RT10/D7): the last Season 1 epilogue slide unlocks 'season_one' with and without the
// Season 2 layer. With it, the next card reads OPERATION UPSTREAM (Season 1's own last slide is its SEASON 2 card)
// and Case 09 loads. Run it on both pages.
module.exports = async h => {
  await h.ev(() => {
    ART.failed = true; S = defaultState();
    S.game.completedMissions = ['m0', 'm1', 'm2', 'm3', 'm3n', 'm4', 'm5', 'm6', 'm7', 't7', 'm8'];
    S.game.moralChoices.finale = 'unproven'; S.game.seasonOneComplete = true;
    try { localStorage.removeItem(ACH_KEY); } catch (e) {} for (const k in _ach) delete _ach[k];
    if (typeof I === 'function') I().reviewShown = true;          // the case review was already shown
    showOverlay(null); startEpilogue();
  });
  await h.step(800);
  const r = await h.ev(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const lastSlide = (EPI.slides[EPI.slides.length - 1] || {}).title || null;
    for (let k = 0; k < 40 && document.getElementById('screen-epilogue').classList.contains('show'); k++) { advanceEpilogue(); await wait(150); }
    await wait(600);
    const card = (document.querySelector('#title-card.show') || {}).textContent || '';
    return { s2: !!(window.V13 && V13.CASES && V13.CASES.m9), unlocked: Object.keys(_ach), lastSlide, card: card.replace(/\s+/g, ' ').trim(),
      ov: [...document.querySelectorAll('.overlay.show')].map(o => o.id).join(',') };
  });
  h.log('end of Season 1:', JSON.stringify(r));
  h.assert(r.unlocked.includes('season_one'), 'season_one was not unlocked: ' + JSON.stringify(r.unlocked));
  if (r.s2) {
    h.assert(/OPERATION UPSTREAM/.test(r.card) && !/SEASON 2/.test(r.card), 'the Season 2 title card: ' + r.card);
    h.assert(r.lastSlide === 'SEASON 2', 'Season 1\'s last slide: ' + r.lastSlide);
    await h.step(4500);
    const cm = await h.ev(() => S.game.currentMission);
    h.log('then', cm);
    h.assert(cm === 'm9', 'Case 09 did not load after the card: ' + cm);
  } else {
    h.assert(/screen-title/.test(r.ov), 'the Season 1 page ends on the title: ' + r.ov);
  }
};
