/* =========================================================================
   NACECA · systems/state.js
   Auto-extracted from game.js by split_modules.py
   Edit the modules; run build.py to rebuild naceca.html.
   ========================================================================= */
/* ===================== 1. STATE ===================== */
const SAVE_KEY = 'naceca_save_v1';

const defaultState = () => ({
  player: {
    name: "Agent Kelechi",
    xp: 0, level: 1,
    skillPoints: 0,
    skills: [], // ids of unlocked skills
    reputation: { integrity: 50, publicTrust: 50, agencyFavour: 50 },
  },
  game: {
    scene: 'title',
    currentRegion: 'Lagos',
    currentSubregion: 'NACECA HQ',
    currentMission: null,
    intelScore: 0,
    evidence: [],          // collected evidence objects
    objectives: [],        // {id, text, done}
    arrests: 0,
    civiliansRescued: 0,
    forceUsed: 0,
    alertLevel: 0,         // 0..3
    completedMissions: [],
    unlockedRegions: ['Lagos'],
    moralChoices: {},
    headlines: [],
  }
});

let S = defaultState();

