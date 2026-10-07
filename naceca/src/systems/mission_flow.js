/* =========================================================================
   NACECA · systems/mission_flow.js
   Auto-extracted from game.js by split_modules.py
   Edit the modules; run build.py to rebuild naceca.html.
   ========================================================================= */
/* ===================== 17. MISSION FLOW ===================== */
function loadMission(id){
  S.game.currentMission = id;
  // the cold open starts in motion — no controls screen
  if(id==='m0'){ S.game.alertLevel = 0; beginMission('m0'); return; }
  S.game.alertLevel = 0;
  // reset per-mission flags so replay works
  if(id==='m5'){
    delete S.game._shrineUcheBriefed;
    delete S.game._shrinePotsSearched;
    delete S.game._shrineCacheSearched;
    delete S.game._shrineComplete;
    if(S.game.flags){ delete S.game.flags.shrine_access; delete S.game.flags.shrine; }
  }
  if(id==='m7'){ towerResetFlags(); }
  if(id==='m8'){ finResetFlags(); }
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
  if(typeof sideStartCard==='function') sideStartCard(id);
  showOverlay('screen-controls');
}

function beginMissionCore(id){
  // per-operation bookkeeping (HUD counter + aftermath stats are per mission)
  S.game._opEv = [];
  S.game._opStart = { arrests:S.game.arrests||0, civ:S.game.civiliansRescued||0, force:S.game.forceUsed||0, intel:S.game.intelScore||0, xp:S.player.xp||0, rep:Object.assign({}, S.player.reputation) };
  S.game._opBumps = 0;
  if(typeof fadeIn==='function') fadeIn();
  if(typeof resetGuidance==='function') resetGuidance();
  S.game.currentMission = id;
  if(!S.game.flags) S.game.flags = {};
  showOverlay(null);
  showHUD(true);
  ENGINE.movementEnabled = true;

  if(id==='m0'){
    setMissionTitle('Cold Open');
    setObjectives([
      {id:'co_cross',  text:'Cross to his side of the road'},
      {id:'co_follow', text:'Stay on the man in the blue shirt'},
      {id:'co_gate',   text:'Find a way past the gate'},
      {id:'co_reveal', text:'See what\'s in the compound'},
      {id:'co_chase',  text:'Don\'t lose him'},
    ]);
    setEvidenceMax(5);
    buildScenePrologue();
    startAmbient('rain');
    musicForScene('m0');
  }
  if(id==='m1'){
    setMissionTitle('Lagos HQ Briefing');
    setObjectives([
      {id:'o1_brief',    text:'Report to Commander Adaeze'},
      {id:'o_board',     text:'Check the case board'},
      {id:'o_phone',     text:'Read your phone'},
      {id:'o_casefile',  text:'Open your Case File'},
      {id:'o2_exit',     text:'Deploy to Ikeja Market'},
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
    setEvidenceMax(1);
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
    setEvidenceMax(3);
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
    setEvidenceMax(4);
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
      {id:'o4_evidence',   text:'Search the pots, then the cache behind the shrine'},
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
  if(id==='m7'){
    setMissionTitle('No Signal Zone');
    setObjectives([
      {id:'o1_brief',    text:'Brief with Sgt. Uche'},
      {id:'o2_engineer', text:'Find the site engineer'},
      {id:'o3_power',    text:'Restore power to the mast'},
      {id:'o4_trace',    text:'Trace the ransom calls at the BTS cabinet'},
      {id:'o5_decide',   text:'Decide under fire'},
    ]);
    setEvidenceMax(3);
    if(!S.game.unlockedRegions.includes('Edo')) S.game.unlockedRegions.push('Edo');
    towerResetFlags();
    buildSceneTower();
    startAmbient('checkpoint');
    musicForScene('m7');
  }
  if(id==='m8'){
    setMissionTitle('The Voice');
    finResetFlags();
    const R = finaleRoute();
    const objs = [{id:'o1_brief', text:'Brief with Sgt. Uche'}];
    if(R==='A') objs.push({id:'o2_find', text:'The house is known — the blue gate on Akintola Close'});
    if(R==='B') objs.push({id:'o2_find', text:'Find the courier'}, {id:'o2b_tail', text:'Tail her to the house — stay unseen'});
    if(R==='C') objs.push({id:'o2c_call', text:'Keep the Voice talking until the trace locks'}, {id:'o2_find', text:'Find the house'});
    objs.push({id:'o3_entry', text:'Choose your way in'}, {id:'o4_osas', text:'Get Osas out'}, {id:'o5_voice', text:'Face the Voice'});
    setObjectives(objs);
    setEvidenceMax(R==='A' ? 1 : 2);
    buildSceneEkosodin();
    startAmbient('market');
    musicForScene('m8');
  }
  // start every mission with the camera behind Kelechi, looking where he faces
  if(ENGINE.player){ ENGINE.cameraYaw = ENGINE.player.rotation.y; ENGINE.playerYaw = ENGINE.player.rotation.y; }
}

/* M8 per-mission state (_fin*) — cleared on every (re)load. */
function finResetFlags(){
  ['_finBriefed','_finKC','_finTailing','_finHouseKnown','_finCourierPhone','_finCallDone','_finTrace','_finHungUp',
   '_finRecording','_finInside','_finOsas','_finArrived','_finRisk','_finWarned'].forEach(k=>{ delete S.game[k]; });
  if(S.game.flags){ delete S.game.flags.fin_bodycam; delete S.game.flags.fin_osas; }
  if(S.game.moralChoices){ delete S.game.moralChoices.finale; }
}

/* M7 per-mission state lives on S.game as _tower* flags — cleared on every (re)load. */
function towerResetFlags(){
  ['_towerBriefed','_towerMother','_towerEngineer','_towerPower','_towerAmbush','_towerAmbushDelay','_towerWindow',
   '_towerWarn30','_towerWarn10','_towerExpired','_towerTraced','_towerDecided','_towerFibre','_towerCutPending'
  ].forEach(k=>{ delete S.game[k]; });
  if(S.game.moralChoices){ S.game.moralChoices.tower = null; delete S.game.moralChoices.tower_engineer; delete S.game.moralChoices.tower_promise; }
}

function completeMission(id, opts={}){
  if(!S.game.completedMissions.includes(id)){
    S.game.completedMissions.push(id);
  }
  if(opts.silent){ saveGame(); return; }

  // missions that show an aftermath screen
  if(id==='m3' || id==='m4'){
    S.game._opXP = 250; awardXP(250);
    sfxComplete();
    stopAmbient();
    showAftermath();
    return;
  }
}

