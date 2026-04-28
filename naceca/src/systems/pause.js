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
    S = defaultState();
    showHUD(false);
    loadMission('m1');
  });
  $('#btn-continue').addEventListener('click', ()=>{
    if(loadGame()){
      const last = S.game.currentMission || 'm1';
      // resume at the last loaded mission, or default
      if(['m1','m2','m3'].includes(last)) loadMission(last);
      else loadMission('m1');
    } else { toast('NO SAVE FOUND','Start a new investigation'); }
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
    if(loadGame()){
      const last = S.game.currentMission || 'm1';
      if(['m1','m2','m3'].includes(last)) loadMission(last);
      toast('LOADED','progress restored');
    } else toast('NO SAVE');
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
    showOverlay('screen-title');
  });
  $('#btn-aftermath-continue').addEventListener('click', ()=>{
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

