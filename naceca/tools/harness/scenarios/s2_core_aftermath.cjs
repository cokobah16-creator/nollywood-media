// Season 2 fix pass (core, RT12/R21/D12 and RT09): the base aftermath's "Season 2 (missions 9–12)…" sub-line is the
// Season 1 build's (its four teaser cards). With the Season 2 layer it is gone from every aftermath, Season 1's and
// Season 2's; without it, it stays. The M8 aftermath keeps The Case File's "to the trial, then the epilogue" on both
// pages, and with Season 2 its badge reads "Season 2 next". Run it on both pages.
module.exports = async h => {
  const s2 = await h.ev(() => !!(window.V13 && V13.CASES && V13.CASES.m9));
  h.log('season 2 on the page:', s2);
  const subOf = () => h.ev(() => [...document.querySelectorAll('#aftermath-grid .cw-next-sub')].map(e => e.textContent.trim()).join(' | '));
  // a Season 1 case's aftermath (Case 01)
  await h.start('m1', { completed: ['m0'] });
  await h.ev(() => { if (!S.game.completedMissions.includes('m1')) S.game.completedMissions.push('m1'); S.game._opXP = 0; showAftermath(); });
  await h.step(600);
  let sub = await subOf();
  h.log('m1 aftermath sub-line:', sub || '(none)');
  if (s2) h.assert(!/missions 9/.test(sub), 'the Season 2 page still shows the teaser line under a Season 1 aftermath: ' + sub);
  else h.assert(/Season 2 \(missions 9–12\)/.test(sub), 'the Season 1 page lost its teaser line: ' + sub);
  // a Season 2 case's aftermath (Case 09)
  if (s2) {
    await h.ev(() => {
      S = defaultState(); S.game.completedMissions = ['m0', 'm1', 'm2', 'm3', 'm3n', 'm4', 'm5', 'm6', 'm7', 't7', 'm8']; S.game.seasonOneComplete = true;
      Object.assign(S.game.moralChoices, { market_runner: 'caught', choice: 'flip', arrest: 'professional', checkpoint: 'flip_driver', asaba: 'rescue', tower: 'hold', finale: 'contested' });
      V13._skipHubs = true; showOverlay(null); loadMission('m9');
    });
    await h.step(800);
    await h.ev(() => { if (document.querySelector('#screen-controls.show')) beginMission('m9'); });
    await h.step(2500);
    await h.ev(() => { try { endDialogue(); } catch (e) {} Object.assign(V13.mc(), { s2_custody: 'signed', s2_method: 'image', s2_abuja_call: 'truth', s2_original: 'kept' }); V13.finish('m9'); });
    await h.step(1200);
    sub = await subOf();
    const next = await h.ev(() => (document.querySelector('#aftermath-grid .cw-next') || {}).textContent || '');
    h.log('m9 aftermath sub-line:', sub || '(none)', '· next:', next.replace(/\s+/g, ' ').trim().slice(0, 120));
    h.assert(!/missions 9/.test(sub), 'the Case 09 aftermath shows the teaser line: ' + sub);
    h.assert(/Next/.test(next), 'the Case 09 aftermath lost its next line: ' + next);
    { const d = await h.ev(() => { renderMissionSelect(); return (document.querySelector('#screen-missions .desc') || {}).textContent || ''; });
      h.log('mission select subtitle:', d); h.assert(!/Vertical slice/.test(d), 'the mission select subtitle is the Season 1 build\'s: ' + d); }
  } else {
    const d = await h.ev(() => { renderMissionSelect(); return (document.querySelector('#screen-missions .desc') || {}).textContent || ''; });
    h.log('mission select subtitle (Season 1 page):', d);
    h.assert(/Vertical slice/.test(d), 'the Season 1 page\'s subtitle changed: ' + d);
  }
  // the M8 aftermath's next line, the trial not yet sat
  const m8 = await h.ev(() => {
    S = defaultState(); S.game.completedMissions = ['m0', 'm1', 'm2', 'm3', 'm3n', 'm4', 'm5', 'm6', 'm7', 't7', 'm8']; S.game.currentMission = 'm8';
    S.game.moralChoices = { asaba: 'rescue', finale: 'contested' }; S.game.flags = { finale: 'contested' }; if (typeof I === 'function') I().court = null;
    return String(nextMissionPreview());
  });
  h.log('m8 next:', m8.replace(/<[^>]+>/g, ''));
  h.assert(/Continue to the trial, then the epilogue/.test(m8), 'the M8 preview lost "to the trial, then the epilogue": ' + m8);
  if (s2) h.assert(/<b>Season 2<\/b> next\./.test(m8) && !/SEASON 2 — COMING/.test(m8), 'the M8 preview\'s Season 2 badge: ' + m8);
  else h.assert(/SEASON 2 — COMING/.test(m8), 'the Season 1 page\'s M8 badge changed: ' + m8);
};
