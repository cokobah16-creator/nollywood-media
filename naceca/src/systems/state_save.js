/* =========================================================================
   NACECA · systems/state_save.js
   Auto-extracted from game.js by split_modules.py
   Edit the modules; run build.py to rebuild naceca.html.
   ========================================================================= */
/* ===================== 8. SAVE / LOAD ===================== */
function saveGame(quiet){
  try{
    localStorage.setItem(SAVE_KEY, JSON.stringify(S));
    if(!quiet) toast('SAVED', 'progress committed to local storage');
  }catch(e){ toast('SAVE FAILED', e.message); }
}
function loadGame(){
  try{
    const raw = localStorage.getItem(SAVE_KEY);
    if(!raw) return false;
    const data = JSON.parse(raw);
    const d = defaultState();
    // merge section by section so saves from older builds pick up new fields
    S = {
      player: Object.assign(d.player, data.player || {}, {
        reputation: Object.assign(d.player.reputation, (data.player||{}).reputation || {}),
      }),
      game: Object.assign(d.game, data.game || {}),
    };
    if(!S.game.flags || typeof S.game.flags!=='object') S.game.flags = {};
    if(!S.game.moralChoices || typeof S.game.moralChoices!=='object') S.game.moralChoices = {};
    if(!Array.isArray(S.game.evidence)) S.game.evidence = [];
    if(!Array.isArray(S.game.completedMissions)) S.game.completedMissions = [];
    if(!Array.isArray(S.player.skills)) S.player.skills = [];
    refreshHUD();
    return true;
  }catch(e){ return false; }
}
/* Where Continue should take the player: the first playable mission not yet
   completed, else the mission select (campaign finished so far). */
function nextPlayableMission(){
  const m = MISSIONS.find(x => x.playable && !S.game.completedMissions.includes(x.id));
  return m ? m.id : null;
}
function resumeCampaign(){
  const next = nextPlayableMission();
  if(next){ loadMission(next); }
  else { renderMissionSelect(); showOverlay('screen-missions'); toast('CAMPAIGN UP TO DATE','Replay any case from the files'); }
}
function eraseSave(){ localStorage.removeItem(SAVE_KEY); toast('SAVE ERASED'); }
function hasSave(){ return !!localStorage.getItem(SAVE_KEY); }

