/* =========================================================================
   NACECA · systems/dialogue_system.js
   Auto-extracted from game.js by split_modules.py
   Edit the modules; run build.py to rebuild naceca.html.
   ========================================================================= */
/* ===================== 14. DIALOGUE SYSTEM ===================== */
let DLG = { script:null, idx:0, onComplete:null };

function startDialogue(scriptKey, onComplete){
  DLG.script = DIALOGUE[scriptKey];
  DLG.idx = 0;
  DLG.onComplete = onComplete;
  DLG.scriptKey = scriptKey;
  cinematic(true);
  showOverlay('screen-dialogue');
  renderDialogueLine();
}

function renderDialogueLine(){
  if(!DLG.script || DLG.idx >= DLG.script.length){ endDialogue(); return; }
  const line = DLG.script[DLG.idx];
  $('#dlg-speaker').textContent = line.speaker || '';
  $('#dlg-text').textContent = '';
  $('#dlg-choices').innerHTML = '';
  $('#dlg-continue').classList.add('hide');
  drawPortrait(line.portrait);

  // typewriter with audio blip every ~3 chars
  let i=0; const text = line.text || '';
  clearInterval(DLG._tw);
  DLG._tw = setInterval(()=>{
    i++;
    $('#dlg-text').textContent = text.slice(0,i);
    if(i % 3 === 0 && text[i-1] && /\w/.test(text[i-1])) sfxBlip();
    if(i>=text.length){
      clearInterval(DLG._tw);
      if(line.choices && line.choices.length){
        renderChoices(line.choices);
      } else {
        $('#dlg-continue').classList.remove('hide');
      }
    }
  }, 18);
}

function renderChoices(choices){
  const wrap = $('#dlg-choices');
  wrap.innerHTML = '';
  choices.forEach((c,i)=>{
    // skip choices requiring locked skill
    if(c.requires && !S.player.skills.includes(c.requires)) return;
    const btn = document.createElement('button');
    btn.className = 'dialogue-choice';
    btn.innerHTML = `<span class="marker">${i+1}.</span><span>${c.text}</span>${c.tag?`<span class="tag ${c.tag}">${c.tag.toUpperCase()}</span>`:''}`;
    btn.addEventListener('click', ()=>{
      sfxClick();
      applyEffect(c.effect, c.flag);
      if(c.next){
        DLG.script = DIALOGUE[c.next];
        DLG.idx = 0;
        renderDialogueLine();
      } else {
        DLG.idx++;
        if(DLG.idx >= DLG.script.length) endDialogue();
        else renderDialogueLine();
      }
    });
    wrap.appendChild(btn);
  });
}

function advanceDialogue(){
  DLG.idx++;
  if(DLG.idx >= DLG.script.length) endDialogue();
  else renderDialogueLine();
}

function endDialogue(){
  cinematic(false);
  showOverlay(null);
  // post-dialogue hooks
  if(DLG.scriptKey==='hq_intro' || DLG.scriptKey==='hq_lawful' || DLG.scriptKey==='hq_harsh' || DLG.scriptKey==='hq_savvy'){
    S.game._hqBriefed = true;
    completeObjective('o1_brief');
    showPrompt('<span class="opt"><span class="key">E</span> Deploy to Ikeja Market</span>');
  }
  if(DLG.scriptKey==='market_intro'){
    S.game._marketTunde = true;
    completeObjective('o1_tunde');
  }
  if(DLG.scriptKey==='mansion_pre_breach'){
    S.game._mansionPreBriefed = true;
    completeObjective('o1_brief_squad');
  }
  if(DLG.scriptKey==='checkpoint_intro'){
    S.game._cpBriefed = true;
    completeObjective('o1_brief_aks');
  }
  if(DLG.scriptKey==='shrine_uche'){
    completeObjective('o1_brief_uche');
  }
  if(DLG.scriptKey==='shrine_intro' || DLG.scriptKey==='shrine_negotiate' || DLG.scriptKey==='shrine_force' || DLG.scriptKey==='shrine_leave'){
    completeObjective('o2_custodian');
    completeObjective('o3_decide');
    // reveal cache if access granted (negotiate or force)
    const acc = S.game.flags && S.game.flags.shrine_access;
    if((acc==='granted_negotiate' || acc==='granted_force') && ENGINE._shrineCache){
      ENGINE._shrineCache.visible = true;
      // add the now-accessible evidence markers
      addEvidenceMarker(new THREE.Vector3(0, 1.0, -6.8), 'EVIDENCE', 'POTS', 'ev_shrine_pots');
      ENGINE.evidenceMarkers.find(m=>m.id==='ev_shrine_pots').let_collected = function(){ this.collected=true; };
      addEvidenceMarker(new THREE.Vector3(0, 1.6, -8.3), 'EVIDENCE', 'CACHE', 'ev_shrine_cache');
      ENGINE.evidenceMarkers.find(m=>m.id==='ev_shrine_cache').let_collected = function(){ this.collected=true; };
      toast('ACCESS GRANTED', 'Search the libation pots and the cache behind the shrine', 2400);
    } else if(acc==='left'){
      // walked away — auto-complete to aftermath
      setTimeout(()=>{
        if(!S.game.completedMissions.includes('m5')){ S.game.completedMissions.push('m5'); }
        sfxComplete();
        stopAmbient();
        toast('MISSION ENDED','Pulled back. Magistrate order required to return.', 2800);
        showAftermath();
      }, 1400);
    }
  }
  if(DLG.scriptKey==='shrine_complete_negotiate' || DLG.scriptKey==='shrine_complete_force'){
    completeObjective('o4_evidence');
    if(!S.game.completedMissions.includes('m5')){
      S.game.completedMissions.push('m5');
    }
    awardXP(280);
    sfxComplete();
    stopAmbient();
    showAftermath();
  }
  if(DLG.scriptKey==='asaba_resolve_chase' || DLG.scriptKey==='asaba_resolve_chase_lost' || DLG.scriptKey==='asaba_resolve_rescue'){
    if(!S.game.completedMissions.includes('m6')){
      S.game.completedMissions.push('m6');
    }
    awardXP(300);
    sfxComplete();
    stopAmbient();
    showAftermath();
  }
  if(DLG.onComplete) DLG.onComplete();
}

/* Portrait — uses inline rendered images from ASSETS.portraits with SVG fallback.
   The map below pairs every dialogue 'kind' with a real character portrait. */
const PORTRAIT_MAP = {
  // game key  →  asset key in ASSETS.portraits
  kelechi:   'officer_female_vest',     // young female officer with vest (the player)
  commander: 'commander_female',         // imposing female officer (Cdr Adaeze)
  sergeant:  'officer_tactical_helmet',  // helmeted operator (Sgt. Uche)
  informant: 'fixer_orange',             // orange-shirt fixer (Tunde)
  teen:      'civilian_teen',            // the teen (KC the runner)
  child:     'child_boy',                // the rescued child
  suspect:   'suspect_orange_shirt',     // orange-shirt suspect (Chief Obi / Ifeanyi)
  driver:    'officer_alt_male',         // a working-man portrait (Musa)
  merchant:  'elder_white_robe',         // white-robe + cap (Pa Eze the custodian)
};

function drawPortrait(kind){
  const wrap = $('#dialogue-portrait');
  // Try to use the rendered character image
  const assetKey = PORTRAIT_MAP[kind];
  if(typeof ASSETS !== 'undefined' && ASSETS.portraits && assetKey && ASSETS.portraits[assetKey]){
    wrap.innerHTML = `<div class="portrait-frame">
      <img src="${ASSETS.portraits[assetKey]}" alt="${kind}" />
      <div class="portrait-vignette"></div>
    </div>`;
    return;
  }
  // Fallback — procedural SVG silhouette (same as before)
  const PORTRAITS = {
    commander: {skin:'#5a3826', outfit:'#1a3050', accent:'#d8a64a', hair:'#0a0a14'},
    informant: {skin:'#5a3826', outfit:'#5db86a', accent:'#3a8a5a', hair:'#0a0a14'},
    teen:      {skin:'#7a4a30', outfit:'#e07d4a', accent:'#a04020', hair:'#0a0a14'},
    sergeant:  {skin:'#5a3826', outfit:'#0b1a3a', accent:'#d8a64a', hair:'#0a0a14'},
    suspect:   {skin:'#7a4a30', outfit:'#e07d4a', accent:'#c8b890', hair:'#0a0a14'},
    child:     {skin:'#7a5238', outfit:'#f3ead2', accent:'#5db86a', hair:'#0a0a14'},
    kelechi:   {skin:'#5a3826', outfit:'#0b1a3a', accent:'#d8a64a', hair:'#0a0a14'},
    driver:    {skin:'#6a4528', outfit:'#a08a6a', accent:'#3a2a18', hair:'#1a0a04'},
    merchant:  {skin:'#6a4528', outfit:'#f3ead2', accent:'#c84a3a', hair:'#1a0a04'},
  };
  const P = PORTRAITS[kind] || PORTRAITS.commander;
  wrap.innerHTML = `<svg viewBox="0 0 100 100">
    <rect width="100" height="100" fill="#0b1426"/>
    <circle cx="50" cy="100" r="55" fill="${P.outfit}"/>
    <circle cx="50" cy="42" r="22" fill="${P.skin}"/>
    <path d="M28 38 Q50 18 72 38 L72 30 Q50 14 28 30 Z" fill="${P.hair}"/>
    <rect x="35" y="78" width="30" height="22" fill="${P.outfit}"/>
    <rect x="44" y="78" width="12" height="6" fill="${P.accent}"/>
    <circle cx="42" cy="44" r="1.6" fill="#0a0a14"/>
    <circle cx="58" cy="44" r="1.6" fill="#0a0a14"/>
    <path d="M42 54 Q50 58 58 54" stroke="#0a0a14" stroke-width="1.4" fill="none"/>
  </svg>`;
}

