/* =========================================================================
   NACECA · systems/pause.js
   Auto-extracted from game.js by split_modules.py
   Edit the modules; run build.py to rebuild naceca.html.
   ========================================================================= */
/* ===================== 22. PAUSE / FLOW ===================== */
function togglePause(){
  if($('#screen-pause').classList.contains('show')){
    showOverlay(null);
    if(S.game.currentMission) showHUD(true);
  } else if(S.game.currentMission){
    showOverlay('screen-pause');
    showHUD(false);
  }
}

/* NEW INVESTIGATION: fresh state with the chosen casework difficulty, then the cold open.
   The title button opens the new-game sheet first (beta/casework.js) when it exists. */
function startNewInvestigation(diff){
  S = defaultState();
  S.game.difficulty = diff === 'recruit' ? 'recruit' : 'senior';
  if(typeof syncDifficultyClass === 'function') syncDifficultyClass();
  showHUD(false);
  loadMission('m0');
}

function bindMenuButtons(){
  // first interaction unlocks audio context (autoplay policy)
  document.addEventListener('pointerdown', ()=>{ initAudio(); }, {once:true});
  document.addEventListener('keydown', ()=>{ initAudio(); }, {once:true});
  // global click sound on .btn buttons
  document.addEventListener('click', e=>{
    if(e.target.closest('.btn, .mission-card:not(.locked), .action-btn, .pill, .dialogue-choice, .puzzle-option')){
      // dialogue choices and puzzle options play their own sounds; skip those here
      if(e.target.closest('.dialogue-choice, .puzzle-option')) return;
      sfxClick();
    }
  });

  $('#btn-newgame').addEventListener('click', ()=>{
    if(typeof openNewGameSheet === 'function') openNewGameSheet();
    else startNewInvestigation('senior');
  });
  $('#btn-continue').addEventListener('click', ()=>{
    if(loadGame()){ if(typeof syncDifficultyClass === 'function') syncDifficultyClass(); showRecap(resumeCampaign); }
    else { toast('NO SAVE FOUND','Start a new investigation'); }
  });
  $('#btn-mission-select').addEventListener('click', ()=>{
    // mission select is open from title; load fresh save view
    loadGame();
    renderMissionSelect();
    showOverlay('screen-missions');
  });
  $('#btn-missions-back').addEventListener('click', ()=> showOverlay('screen-title'));

  $('#btn-resume').addEventListener('click', togglePause);
  $('#btn-save').addEventListener('click', saveGame);
  $('#btn-load').addEventListener('click', ()=>{
    if(loadGame()){ if(typeof syncDifficultyClass === 'function') syncDifficultyClass(); togglePause(); resumeCampaign(); toast('LOADED','progress restored'); }
    else toast('NO SAVE');
  });
  $('#btn-quit').addEventListener('click', ()=>{
    showHUD(false);
    showOverlay('screen-title');
    ENGINE.movementEnabled = false;
    stopAmbient(); startAmbient('title');
    musicForScene('title');
  });
  $('#btn-erase').addEventListener('click', ()=>{
    eraseSave();
    S = defaultState();
    if(typeof syncDifficultyClass === 'function') syncDifficultyClass();
    showOverlay('screen-title');
  });
  $('#btn-aftermath-continue').addEventListener('click', ()=>{
    if(S.game.currentMission==='m8' && S.game.completedMissions.includes('m8') && typeof startEpilogue==='function'){ startEpilogue(); return; }
    showOverlay(null);
    showHUD(false);
    renderMissionSelect();
    showOverlay('screen-missions');
  });
  $('#btn-aftermath-skills').addEventListener('click', openSkillTree);
  $('#btn-skills-back').addEventListener('click', ()=>{
    showOverlay(null);
    if(S.game.currentMission) showHUD(true);
  });
  $('#btn-casefile-back').addEventListener('click', ()=>{
    showOverlay(null);
    if(S.game.currentMission) showHUD(true);
  });
  $('#btn-eb-back').addEventListener('click', ()=>{
    showOverlay(null);
    if(S.game.currentMission){
      showHUD(true);
      // restore the music for the current mission
      musicForScene(S.game.currentMission);
    } else {
      musicForScene('title');
    }
  });
  $('#btn-eb-reset').addEventListener('click', ebReset);
  $('#btn-start-mission').addEventListener('click', ()=>{
    if(S.game.currentMission) beginMission(S.game.currentMission);
  });
}

