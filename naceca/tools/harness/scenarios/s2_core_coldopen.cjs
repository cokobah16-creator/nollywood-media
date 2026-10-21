// Season 2 fix pass (core, RT05/D6): Season 1's cold-open plate question behaves the same with and without the
// Season 2 layer: no answer sets a flag, gives evidence or XP (Season 2's flag-only rule is scoped to Season 2).
// Run it on both pages: --html <build>/naceca.html and --html <build_s1>/naceca.html.
module.exports = async h => {
  const s2 = await h.ev(() => !!(window.V13 && V13.CASES && V13.CASES.m9));
  h.log('season 2 on the page:', s2);
  for (const pick of ['Partial', 'No\\.', 'driver']) {
    await h.start('m0', { completed: [] });
    const r = await h.ev(async pick => {
      CO.plateDist = 10; const xp0 = S.player.xp, ev0 = S.game.evidence.map(e => e.id);
      const pe = window.prologueEnd; window.prologueEnd = function () {};          // stay in the cold open
      coPlateQuestion();
      const wait = ms => new Promise(r => setTimeout(r, ms));
      for (let k = 0; k < 40; k++) {
        const ov = document.getElementById('screen-dialogue'); if (!ov.classList.contains('show')) break;
        if (typeof skipTypewriter === 'function') skipTypewriter();
        const ch = [...document.querySelectorAll('#dlg-choices .dialogue-choice')];
        if (ch.length) { const b = ch.find(x => new RegExp(pick).test(x.textContent)) || ch[0]; b.click(); if (b.dataset.armed) b.click(); }
        else advanceDialogue();
        await wait(120);
      }
      await wait(300);
      window.prologueEnd = pe;
      return { flagsCo: S.game.flags.co_plate || null, mcCo: (S.game.moralChoices || {}).co_plate || null,
        newEv: S.game.evidence.map(e => e.id).filter(id => !ev0.includes(id)), xp: S.player.xp - xp0 };
    }, pick);
    h.log('answer', pick, JSON.stringify(r));
    h.assert(r.flagsCo === null && r.mcCo === null, `plate answer "${pick}" set a flag: ${JSON.stringify(r)}`);
    h.assert(r.newEv.length === 0 && r.xp === 0, `plate answer "${pick}" gave evidence or XP: ${JSON.stringify(r)}`);
  }
  // in Season 2 the flag-only rule still holds (s2_core.js applyEffect): a flag-only effect sets its flag there
  if (s2) {
    const r = await h.ev(() => {
      S.game.currentMission = 'm9'; S.game.flags = S.game.flags || {};
      applyEffect(undefined, { s2_core_probe: 'x' }); const inS2 = (S.game.moralChoices || {}).s2_core_probe || S.game.flags.s2_core_probe || null;
      S.game.currentMission = 'm1'; applyEffect(undefined, { s2_core_probe2: 'y' }); const inS1 = (S.game.moralChoices || {}).s2_core_probe2 || S.game.flags.s2_core_probe2 || null;
      return { inS2, inS1 };
    });
    h.log('flag-only applyEffect', JSON.stringify(r));
    h.assert(r.inS2 === 'x' && r.inS1 === null, 'flag-only applyEffect scope: ' + JSON.stringify(r));
  }
  h.log('cold open plate: no flag, no evidence, no XP on this page');
};
