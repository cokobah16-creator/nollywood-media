// Season 2 fix pass (core, RT10/D7, CORE-02): the last Season 1 epilogue slide unlocks 'season_one' with and without
// the Season 2 layer. With it, the next card reads OPERATION UPSTREAM (Season 1's own last slide is its SEASON 2 card)
// and Case 09 loads. Two passes: the case review already shown, and the case review still to come (The Case File:
// it opens after the last slide, and the Season One award waits until it closes). Run it on both pages.
module.exports = async h => {
  const reset = reviewShown => h.ev(rs => {
    ART.failed = true; S = defaultState();
    S.game.completedMissions = ['m0', 'm1', 'm2', 'm3', 'm3n', 'm4', 'm5', 'm6', 'm7', 't7', 'm8'];
    S.game.moralChoices.finale = 'unproven'; S.game.seasonOneComplete = true;
    try { localStorage.removeItem(ACH_KEY); } catch (e) {} for (const k in _ach) delete _ach[k];
    if (typeof I === 'function') I().reviewShown = rs;
    showOverlay(null); startEpilogue();
  }, reviewShown);
  const ovs = () => h.ev(() => [...document.querySelectorAll('.overlay.show')].map(o => o.id).join(','));
  // to the end of the epilogue; stop at the case review if it opens
  const toEnd = () => h.ev(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const lastSlide = (EPI.slides[EPI.slides.length - 1] || {}).title || null;
    for (let k = 0; k < 40 && document.getElementById('screen-epilogue').classList.contains('show'); k++) { advanceEpilogue(); await wait(150); }
    await wait(600);
    const card = (document.querySelector('#title-card.show') || {}).textContent || '';
    return { s2: !!(window.V13 && V13.CASES && V13.CASES.m9), unlocked: Object.keys(_ach), lastSlide, card: card.replace(/\s+/g, ' ').trim(),
      review: !!document.querySelector('#screen-review.show'), hasReview: typeof openReview === 'function',
      ov: [...document.querySelectorAll('.overlay.show')].map(o => o.id).join(',') };
  });
  const after = async (r, label) => {
    if (r.s2) {
      h.assert(/OPERATION UPSTREAM/.test(r.card) && !/SEASON 2/.test(r.card), label + ': the Season 2 title card: ' + r.card);
      h.assert(r.lastSlide === 'SEASON 2', label + ': Season 1\'s last slide: ' + r.lastSlide);
      await h.step(4500);
      const cm = await h.ev(() => S.game.currentMission);
      h.log(label, 'then', cm);
      h.assert(cm === 'm9', label + ': Case 09 did not load after the card: ' + cm);
    } else {
      h.assert(/screen-title/.test(r.ov), label + ': the Season 1 page ends on the title: ' + r.ov);
    }
  };

  // ---- 1. the case review was already shown ----
  await reset(true);
  await h.step(800);
  let r = await toEnd();
  h.log('end of Season 1 (review shown):', JSON.stringify(r));
  h.assert(!r.review, 'no case review when it was already shown');
  h.assert(r.unlocked.includes('season_one'), 'season_one was not unlocked: ' + JSON.stringify(r.unlocked));
  await after(r, 'review shown');

  // ---- 2. the case review still to come: the award waits for it (a fresh page: pass 1 left Case 09 running) ----
  await h.page.reload({ waitUntil: 'load', timeout: 90000 }); await h.step(1500);
  await reset(false);
  await h.step(800);
  r = await toEnd();
  h.log('end of Season 1 (review to come):', JSON.stringify(r));
  if (!r.hasReview) { h.log('no case review in this build (The Case File removed): pass 2 is pass 1'); h.assert(r.unlocked.includes('season_one'), 'season_one: ' + JSON.stringify(r.unlocked)); return; }
  h.assert(r.review, 'the case review opens after the last slide: ' + r.ov);
  h.assert(!r.unlocked.includes('season_one'), 'the Season One award waits while the case review is open: ' + JSON.stringify(r.unlocked));
  h.assert(!/OPERATION UPSTREAM/.test(r.card), 'no Season 2 card under the case review: ' + r.card);
  await h.ev(() => document.getElementById('btn-review-done').click());
  await h.step(700);
  const r2 = await h.ev(() => ({ s2: !!(window.V13 && V13.CASES && V13.CASES.m9), unlocked: Object.keys(_ach), lastSlide: (EPI.slides[EPI.slides.length - 1] || {}).title || null,
    card: ((document.querySelector('#title-card.show') || {}).textContent || '').replace(/\s+/g, ' ').trim(), review: !!document.querySelector('#screen-review.show'),
    ov: [...document.querySelectorAll('.overlay.show')].map(o => o.id).join(',') }));
  h.log('after FINISH:', JSON.stringify(r2), await ovs());
  h.assert(!r2.review, 'FINISH closes the case review');
  h.assert(r2.unlocked.includes('season_one'), 'season_one comes once the case review closes: ' + JSON.stringify(r2.unlocked));
  await after(r2, 'review to come');
};
