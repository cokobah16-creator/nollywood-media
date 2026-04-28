/* =========================================================================
   NACECA · systems/util.js
   Auto-extracted from game.js by split_modules.py
   Edit the modules; run build.py to rebuild naceca.html.
   ========================================================================= */
/* ===================== 7. UTIL ===================== */
const $  = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const clamp = (v,lo,hi)=>Math.max(lo,Math.min(hi,v));

function toast(big, small, ms=2200){
  const t = $('#toast');
  t.innerHTML = `<span class="big">${big}</span>${small?`<span class="small">${small}</span>`:''}`;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>t.classList.remove('show'), ms);
}

function showXP(n){
  const el = $('#xp-toast');
  el.textContent = `+${n} XP`;
  el.classList.add('show');
  clearTimeout(showXP._t);
  showXP._t = setTimeout(()=>el.classList.remove('show'), 1600);
}

function showOverlay(id){
  $$('.overlay').forEach(o=>o.classList.remove('show'));
  if(id) $('#'+id).classList.add('show');
}

function applyEffect(eff, flagPayload){
  if(!eff) return;
  const r = S.player.reputation;
  if(eff.integrity)    r.integrity    = clamp(r.integrity    + eff.integrity, 0, 100);
  if(eff.publicTrust)  r.publicTrust  = clamp(r.publicTrust  + eff.publicTrust, 0, 100);
  if(eff.agencyFavour) r.agencyFavour = clamp(r.agencyFavour + eff.agencyFavour, 0, 100);
  if(eff.intel)        S.game.intelScore += eff.intel;
  if(eff.force)        S.game.forceUsed += eff.force;
  if(flagPayload){
    if(flagPayload.force)    S.game.forceUsed += flagPayload.force;
    if(flagPayload.rescued)  S.game.civiliansRescued += flagPayload.rescued;
    Object.assign(S.game.moralChoices, flagPayload);
  }
  refreshHUD();
}

function refreshHUD(){
  $('#rep-integrity').style.width = S.player.reputation.integrity+'%';
  $('#rep-trust').style.width     = S.player.reputation.publicTrust+'%';
  $('#rep-favour').style.width    = S.player.reputation.agencyFavour+'%';
  $('#hud-region').firstChild.textContent = (S.game.currentRegion||'').toUpperCase();
  $('#hud-subregion').textContent = (S.game.currentSubregion||'').toUpperCase();
  $('#ev-cur').textContent = S.game.evidence.length;
  // alert level
  const lv = S.game.alertLevel;
  const alertEl = $('#hud-alert');
  if(lv>0){
    alertEl.style.display='flex';
    $('#hud-alert-lvl').textContent = ['LOW','MEDIUM','HIGH','CRITICAL'][lv]||'HIGH';
  } else { alertEl.style.display='none'; }
}

function setObjectives(list){
  S.game.objectives = list.map(o=>({...o}));
  renderObjectives();
}
function completeObjective(id){
  const o = S.game.objectives.find(x=>x.id===id);
  if(o && !o.done){ o.done=true; renderObjectives(); }
}
function renderObjectives(){
  $('#hud-mission-objs').innerHTML = S.game.objectives.map(o=>
    `<div class="obj ${o.done?'done':''}">${o.text}</div>`).join('');
}
function setMissionTitle(t){ $('#hud-mission-title').textContent = t.toUpperCase(); }

function showHUD(b){ $('#hud').style.display = b?'block':'none'; }

function setEvidenceMax(n){ $('#ev-max').textContent = n; }

function showPrompt(html){
  const p = $('#hud-prompt');
  if(!html){ p.classList.remove('show'); return; }
  p.innerHTML = html;
  p.classList.add('show');
}

function cinematic(on){
  $('#cine-top').classList.toggle('show', !!on);
  $('#cine-bot').classList.toggle('show', !!on);
}

