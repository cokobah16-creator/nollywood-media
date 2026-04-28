/* =========================================================================
   NACECA · systems/mission_flow.js
   Auto-extracted from game.js by split_modules.py
   Edit the modules; run build.py to rebuild naceca.html.
   ========================================================================= */
/* ===================== 17. MISSION FLOW ===================== */
function loadMission(id){
  S.game.currentMission = id;
  S.game.alertLevel = 0;
  // reset per-mission flags so replay works
  if(id==='m5'){
    delete S.game._shrineUcheBriefed;
    delete S.game._shrinePotsSearched;
    delete S.game._shrineCacheSearched;
    delete S.game._shrineComplete;
    if(S.game.flags){ delete S.game.flags.shrine_access; delete S.game.flags.shrine; }
  }
  // Show the start-mission/controls overlay first; player clicks START MISSION to actually begin
  showHUD(false);
  ENGINE.movementEnabled = false;
  showStartMission(id);
}

function showStartMission(id){
  const m = MISSIONS.find(x=>x.id===id);
  if(!m){ beginMission(id); return; }
  $('#controls-mnum').textContent = `CASE ${m.num}`;
  $('#controls-mname').textContent = m.name.toUpperCase();
  $('#controls-region').textContent = m.region;
  showOverlay('screen-controls');
}

function beginMission(id){
  showOverlay(null);
  showHUD(true);
  ENGINE.movementEnabled = true;

  if(id==='m1'){
    setMissionTitle('Lagos HQ Briefing');
    setObjectives([
      {id:'o1_brief', text:'Receive briefing from Commander Adaeze'},
      {id:'o2_exit',  text:'Deploy to Ikeja Market'},
    ]);
    setEvidenceMax(0);
    buildSceneHQ();
    startAmbient('hq');
    musicForScene('m1');
  }
  if(id==='m2'){
    setMissionTitle('Lagos Market Patrol');
    setObjectives([
      {id:'o1_tunde', text:'Speak with informant Tunde'},
      {id:'o2_scan',  text:'Scan suspect phone'},
      {id:'o3_runner',text:'Decide on the teen runner'},
    ]);
    setEvidenceMax(2);
    buildSceneMarket();
    startAmbient('market');
    musicForScene('m2');
  }
  if(id==='m3'){
    setMissionTitle('Operation Night Raid');
    setObjectives([
      {id:'o1_brief_squad', text:'Brief with Sgt. Uche'},
      {id:'o5_civ',         text:'Secure the child'},
      {id:'o4_wipe',        text:'Stop laptop wipe'},
      {id:'o6_arrest',      text:'Arrest the principal'},
    ]);
    setEvidenceMax(4);
    buildSceneMansion();
    startAmbient('mansion');
    musicForScene('m3');
    sfxAlert();
  }
  if(id==='m4'){
    setMissionTitle('Checkpoint Shakedown');
    setObjectives([
      {id:'o1_brief_aks', text:'Brief with AKS Inspector Chidi'},
      {id:'o2_driver',    text:'Question the driver'},
      {id:'o3_manifest',  text:'Verify cargo manifest'},
      {id:'o4_search',    text:'Search rear compartment'},
      {id:'o5_decide',    text:"Decide the driver's fate"},
    ]);
    setEvidenceMax(3);
    if(!S.game.unlockedRegions.includes('Edo')) S.game.unlockedRegions.push('Edo');
    buildSceneCheckpoint();
    startAmbient('checkpoint');
    musicForScene('m4');
  }
  if(id==='m5'){
    setMissionTitle('Forest Shrine Compound');
    setObjectives([
      {id:'o1_brief_uche', text:'Brief with Sgt. Uche'},
      {id:'o2_custodian',  text:'Speak with Pa Eze'},
      {id:'o3_decide',     text:'Decide how to enter the compound'},
      {id:'o4_evidence',   text:'Recover the cartel cache (if granted access)'},
    ]);
    setEvidenceMax(3);
    if(!S.game.unlockedRegions.includes('Edo')) S.game.unlockedRegions.push('Edo');
    // reset shrine flag for replay
    if(S.game.flags){ delete S.game.flags.shrine_access; delete S.game.flags.shrine; }
    buildSceneShrine();
    startAmbient('shrine');
    musicForScene('m5');
  }
  if(id==='m6'){
    setMissionTitle('The Disappeared');
    setObjectives([
      {id:'o1_breach',   text:'Brief with Sgt. Uche · breach the warehouse'},
      {id:'o2_runner',   text:'OR — apprehend the fixer (Ifeanyi)'},
      {id:'o3_hostage',  text:'OR — rescue the hostage (Tobi)'},
    ]);
    setEvidenceMax(2);
    if(!S.game.unlockedRegions.includes('Delta')) S.game.unlockedRegions.push('Delta');
    // reset asaba flags for replay
    delete S.game._asabaBriefed; delete S.game._asabaTriggered;
    delete S.game._asabaChoice; delete S.game._asabaResolved;
    delete S.game._asabaSmokeTimer; delete S.game._asabaHostageLost;
    delete S.game._asabaSIMs;
    if(S.game.moralChoices) S.game.moralChoices.asaba = null;
    buildSceneAsaba();
    startAmbient('asaba');
    musicForScene('m6');
  }
}

function completeMission(id, opts={}){
  if(!S.game.completedMissions.includes(id)){
    S.game.completedMissions.push(id);
  }
  if(opts.silent){ saveGame(); return; }

  // missions that show an aftermath screen
  if(id==='m3' || id==='m4'){
    awardXP(250);
    sfxComplete();
    stopAmbient();
    showAftermath();
    return;
  }
}

