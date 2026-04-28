/* =========================================================================
   NACECA · systems/mission_select.js
   Auto-extracted from game.js by split_modules.py
   Edit the modules; run build.py to rebuild naceca.html.
   ========================================================================= */
/* ===================== 19. MISSION SELECT ===================== */
function renderMissionSelect(){
  const grid = $('#mission-grid');
  grid.innerHTML = MISSIONS.map(m=>{
    const completed = S.game.completedMissions.includes(m.id);
    const locked = !m.playable && !completed;
    let stamp = 'PLAYABLE';
    if(completed) stamp = 'COMPLETED';
    else if(locked) stamp = 'SCAFFOLDED';
    return `<button class="mission-card ${completed?'completed':''} ${locked?'locked':''}" data-mid="${m.id}" ${locked?'disabled':''}>
      <div class="num">CASE ${m.num}</div>
      <div class="name">${m.name}</div>
      <div class="region">${m.region}</div>
      <div class="summary">${m.summary}</div>
      <div class="stamp">${stamp}</div>
    </button>`;
  }).join('');
  $$('#mission-grid .mission-card').forEach(c=>{
    c.addEventListener('click', ()=>{
      if(c.classList.contains('locked')) return;
      const id = c.dataset.mid;
      // reset per-mission flags but keep player progression
      S.game._hqBriefed = (id!=='m1') ? S.game._hqBriefed : false;
      if(id==='m1'){ S.game._hqBriefed=false; }
      if(id==='m2'){ S.game._marketTunde=false; S.game._marketScanned=false; S.game.moralChoices.market_runner=false; }
      if(id==='m3'){
        S.game._mansionPreBriefed=false; S.game._evLaptop=false; S.game._evCash=false; S.game._evSafe=false; S.game._civChild=false;
        S.game.moralChoices.arrest = null;
      }
      if(id==='m4'){
        S.game._cpBriefed=false; S.game._cpDriverInterviewed=false; S.game._cpManifestDone=false; S.game._cpCompartmentOpen=false;
        S.game.moralChoices.checkpoint = null;
      }
      if(id==='m5'){
        S.game._shrineUcheBriefed=false;
        S.game._shrinePotsSearched=false;
        S.game._shrineCacheSearched=false;
        S.game._shrineComplete=false;
      }
      if(id==='m6'){
        S.game._asabaBriefed=false; S.game._asabaTriggered=false;
        S.game._asabaChoice=null; S.game._asabaResolved=false;
        S.game._asabaSmokeTimer=0; S.game._asabaHostageLost=false;
        S.game._asabaSIMs=false;
        if(S.game.moralChoices) S.game.moralChoices.asaba = null;
      }
      loadMission(id);
    });
  });
}

