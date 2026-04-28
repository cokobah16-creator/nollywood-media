/* =========================================================================
   NACECA · systems/evidence_board.js
   Auto-extracted from game.js by split_modules.py
   Edit the modules; run build.py to rebuild naceca.html.
   ========================================================================= */
/* ===================== 21. CASE FILE ===================== */
function openCaseFile(){
  // Default to evidence board (the signature investigation system)
  openEvidenceBoard();
}

/* ----- Evidence Board: drag-link investigation system ----- */
// EB_CARDS imported from config/evidence_board.js
// each LINK has a "from" card id and a "to" card id; either order is valid
// EB_VALID_LINKS imported from config/evidence_board.js
let EB_STATE = { selected:null, links:[] }; // links: [{a,b,correct}]

function openEvidenceBoard(){
  // swap to investigation music while board is open
  if(typeof musicForScene === 'function') musicForScene('investigation');
  const cork = $('#eb-cork');
  cork.innerHTML = '';
  $('#eb-strings').innerHTML = '';
  EB_STATE.selected = null;
  // restore links from state
  if(!S.game._ebLinks) S.game._ebLinks = [];
  EB_STATE.links = S.game._ebLinks.slice();

  // render cards
  EB_CARDS.forEach(c=>{
    const locked = c.requires && !S.game.completedMissions.includes(c.requires) && !isMissionInProgressOrLater(c.requires);
    const el = document.createElement('div');
    el.className = `eb-card ${c.type} ${locked?'locked':''}`;
    el.style.left = c.x + '%';
    el.style.top  = c.y + '%';
    el.dataset.cid = c.id;
    el.innerHTML = `<div class="pin"></div><div class="tag">${c.tag}</div><div class="name">${c.name}</div><div class="meta">${c.meta}</div>`;
    el.addEventListener('click', ()=>{
      if(locked){ toast('LOCKED','Progress further to unlock this lead'); sfxFail(); return; }
      ebSelectCard(c.id);
    });
    cork.appendChild(el);
  });
  redrawEBLinks();
  updateEBStats();
  showOverlay('screen-evidence');
  // hint message
  const lc = EB_STATE.links.length;
  if(lc===0){
    setEBInstruction(`Click two cards to draw a connection between them. Correct links raise <b>INTEL</b>. Wrong links waste time.`);
  } else {
    setEBInstruction(`<b>${lc}</b> connections made · keep linking suspects to evidence and locations.`);
  }
}
function isMissionInProgressOrLater(id){
  // unlocks evidence as soon as you've started the mission
  return S.game.currentMission===id || S.game.completedMissions.includes(id);
}
function setEBInstruction(html){ $('#eb-instructions').innerHTML = html; }

function ebSelectCard(id){
  if(EB_STATE.selected === id){
    // deselect
    EB_STATE.selected = null;
    $$('.eb-card').forEach(c=>c.classList.remove('selected'));
    return;
  }
  if(EB_STATE.selected){
    // attempt link
    const a = EB_STATE.selected, b = id;
    // already linked?
    if(EB_STATE.links.some(l=>(l.a===a&&l.b===b)||(l.a===b&&l.b===a))){
      setEBInstruction(`Those cards are already connected.`);
      sfxFail();
      EB_STATE.selected = null;
      $$('.eb-card').forEach(c=>c.classList.remove('selected'));
      return;
    }
    const valid = EB_VALID_LINKS.find(v=>(v.a===a&&v.b===b)||(v.a===b&&v.b===a));
    if(valid){
      EB_STATE.links.push({a, b, correct:true});
      S.game._ebLinks = EB_STATE.links;
      S.game.intelScore += valid.intel;
      sfxComplete();
      setEBInstruction(`✔ <b>+${valid.intel} INTEL</b> · ${valid.hint}`);
      checkWarrantUnlock();
    } else {
      EB_STATE.links.push({a, b, correct:false});
      S.game._ebLinks = EB_STATE.links;
      S.game.intelScore = Math.max(0, S.game.intelScore - 3);
      sfxFail();
      setEBInstruction(`✘ No connection there · −3 INTEL · keep digging.`);
    }
    EB_STATE.selected = null;
    $$('.eb-card').forEach(c=>c.classList.remove('selected'));
    redrawEBLinks();
    updateEBStats();
    refreshHUD();
  } else {
    EB_STATE.selected = id;
    $$('.eb-card').forEach(c=>c.classList.toggle('selected', c.dataset.cid===id));
    sfxBlip();
  }
}
function redrawEBLinks(){
  const svg = $('#eb-strings');
  const cork = $('#eb-cork');
  const rect = cork.getBoundingClientRect();
  svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
  svg.innerHTML = EB_STATE.links.map(l=>{
    const ca = EB_CARDS.find(c=>c.id===l.a);
    const cb = EB_CARDS.find(c=>c.id===l.b);
    if(!ca || !cb) return '';
    const x1 = (ca.x/100)*rect.width + 80;
    const y1 = (ca.y/100)*rect.height + 30;
    const x2 = (cb.x/100)*rect.width + 80;
    const y2 = (cb.y/100)*rect.height + 30;
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${l.correct?'correct':''}" />`;
  }).join('');
}
function updateEBStats(){
  const correctCount = EB_STATE.links.filter(l=>l.correct).length;
  const totalCorrect = EB_VALID_LINKS.length;
  $('#eb-conn').textContent = `${correctCount}/${totalCorrect}`;
  const pct = clamp(S.game.intelScore, 0, 100);
  $('#eb-fill').style.width = pct + '%';
  $('#eb-intel').textContent = S.game.intelScore;
  // warrant tiers
  const intel = S.game.intelScore;
  let label = 'PENDING', cls = '';
  if(intel >= 90){ label = 'BEHAVIOR PREDICT'; cls = 'unlocked'; }
  else if(intel >= 80){ label = 'EVIDENCE LOCATIONS'; cls = 'unlocked'; }
  else if(intel >= 70){ label = 'SUSPECT COUNT'; cls = 'unlocked'; }
  else if(intel >= 50){ label = 'APPROVED'; cls = 'unlocked'; }
  else { label = `NEED ${50-intel} MORE`; cls = ''; }
  $('#eb-warrant-val').textContent = label;
  $('#eb-warrant').className = 'eb-stat warrant ' + cls;
}
function checkWarrantUnlock(){
  const intel = S.game.intelScore;
  if(!S.game._warrantNotified){
    S.game._warrantNotified = {};
  }
  if(intel >= 50 && !S.game._warrantNotified.t1){
    S.game._warrantNotified.t1 = true;
    toast('WARRANT APPROVED','Magistrate signed off — search authority granted', 2400);
  }
  if(intel >= 70 && !S.game._warrantNotified.t2){
    S.game._warrantNotified.t2 = true;
    toast('SUSPECT COUNT REVEALED','Intel ≥ 70 · Tactical advantage', 2400);
  }
  if(intel >= 80 && !S.game._warrantNotified.t3){
    S.game._warrantNotified.t3 = true;
    toast('EVIDENCE LOCATIONS','Intel ≥ 80 · Hidden caches mapped', 2400);
  }
  if(intel >= 90 && !S.game._warrantNotified.t4){
    S.game._warrantNotified.t4 = true;
    toast('BEHAVIOR PREDICTION','Intel ≥ 90 · Suspect movements forecast', 2400);
  }
}
function ebReset(){
  EB_STATE.links = [];
  S.game._ebLinks = [];
  redrawEBLinks();
  updateEBStats();
  setEBInstruction('Board cleared. Start fresh.');
  sfxClick();
}

/* legacy case-file list (still accessible from pause if needed later) */
function openCaseFileLegacy(){
  const list = $('#case-list');
  const entries = [...CASE_ENTRIES_BASE];
  // collected evidence
  S.game.evidence.forEach(e=>{
    entries.push({ico:'🔬', nm:`EVIDENCE — ${e.name}`, ds:'Logged in chain of custody. Tagged for forensic processing at NACECA HQ.'});
  });
  // moral choices summary
  if(Object.keys(S.game.moralChoices).length){
    const mc = S.game.moralChoices;
    const ds = [
      mc.choice==='detain'?'Detained teen suspect.':'',
      mc.choice==='flip'?'Flipped teen suspect to informant.':'',
      mc.choice==='force'?'Used force on teen suspect.':'',
      mc.entry==='knock'?'Knock-and-announce entry.':'',
      mc.entry==='quiet'?'Quiet breach.':'',
      mc.entry==='loud'?'Loud breach.':'',
      mc.arrest==='professional'?'Professional restraint on principal.':'',
      mc.arrest==='forceful'?'Forceful takedown of principal.':'',
      mc.arrest==='informant'?'Principal flipped to informant.':'',
      mc.arrest==='bribe'?'BRIBE accepted — case compromised.':'',
    ].filter(Boolean).join(' ');
    if(ds) entries.push({ico:'⚖', nm:'OPERATIONAL DECISIONS', ds});
  }
  list.innerHTML = entries.map(e=>`
    <div class="case-row">
      <div class="ico">${e.ico}</div>
      <div class="body"><div class="nm">${e.nm}</div><div class="ds">${e.ds}</div></div>
    </div>`).join('');
  showOverlay('screen-casefile');
}

