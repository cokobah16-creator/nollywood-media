// Case 15: the aftermath's "next" panel text for the finale, and the S1 epilogue hook still in place (no scene loaded)
module.exports = async function (T) {
  await T.wait(1500);
  T.log('next', await T.ev(() => { const cur = S.game.currentMission; S.game.currentMission = 'm15'; const t = nextMissionPreview(); S.game.currentMission = cur; return t.replace(/\s+/g, ' ').slice(0, 300); }));
  T.log('m14 next', await T.ev(() => { const cur = S.game.currentMission; S.game.currentMission = 'm14'; const t = nextMissionPreview(); S.game.currentMission = cur; return t.replace(/\s+/g, ' ').slice(0, 200); }));
  T.log('hooks', await T.ev(() => JSON.stringify({ epi:typeof V13.startEpilogueS2, s2Epi:!!V13._s2Epi, advWrapped:!!advanceEpilogue._v12orig, achievements:['before_he_said_it', 'ninth_floor', 'season_two'].map(id => ACHIEVEMENTS.some(a => a.id === id)) })));
};
