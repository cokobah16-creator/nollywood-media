/* =========================================================================
   NACECA · v12 boot wiring — runs before the game's window-load handler
   ========================================================================= */
(function(){
'use strict';
const V12 = window.V12;

/* after Lekki, the night shift comes before the mission select */
const cont = document.getElementById('btn-aftermath-continue');
if(cont) cont.addEventListener('click', e => {
  if(S.game.currentMission === 'm3' && !S.game.completedMissions.includes('m3n')){
    e.stopImmediatePropagation();
    showOverlay(null); showHUD(false);
    loadMission('m3n');
  }
});

/* title screen: the daily round, and a build tag */
V12.wrap('bindExtraMenus', orig => function(){
  const r = orig.apply(this, arguments);
  const host = document.querySelector('#screen-title .title-actions');
  if(host && !document.getElementById('btn-title-daily')){
    const b = V12.el('button', 'btn v12-daily-btn', 'SCAM OR LEGIT? <small>DAILY</small>'); b.id = 'btn-title-daily';
    b.addEventListener('click', ()=>V12.openDaily(false));
    host.insertBefore(b, document.getElementById('btn-mission-select'));
  }
  const t = document.getElementById('screen-title');
  if(t && !document.getElementById('v12-build')){ const tag = V12.el('div', 'v12-build', 'BUILD v12.2 · PHASE 2'); tag.id = 'v12-build'; t.appendChild(tag); }
  return r;
});

/* M1: the case file objective now opens the operations table — say so */
DIALOGUE.hq_phone.push({ speaker:'NACECA SYSTEM', text:'Your Case File opens the operations table: everything you find lands there, and you link it yourself.' });

window.addEventListener('error', e => { try{ V12.log('js_error', { msg:String(e.message).slice(0, 200), src:String(e.filename || '').slice(-40), line:e.lineno }); }catch(_){} });
})();
