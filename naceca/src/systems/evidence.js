/* =========================================================================
   NACECA · systems/evidence.js
   Auto-extracted from game.js by split_modules.py
   Edit the modules; run build.py to rebuild naceca.html.
   ========================================================================= */
/* ===================== 16. EVIDENCE / XP ===================== */
function collectEvidence(ev){
  S.game.evidence.push({id:ev.id, name:ev.name, t:Date.now()});
  awardXP(ev.xp || 50);
  toast('EVIDENCE LOGGED', ev.name.toUpperCase(), 1700);
  sfxEvidence();
}

function checkShrineComplete(){
  // when both pots and cache searched, trigger the closing dialogue
  if(S.game.currentMission!=='m5') return;
  if(S.game._shrinePotsSearched && S.game._shrineCacheSearched && !S.game._shrineComplete){
    S.game._shrineComplete = true;
    setTimeout(()=>{
      const acc = S.game.flags && S.game.flags.shrine_access;
      const key = acc==='granted_force' ? 'shrine_complete_force' : 'shrine_complete_negotiate';
      startDialogue(key);
    }, 1100);
  }
}
function awardXP(n){
  S.player.xp += n;
  showXP(n);
  // level up at 250 / 600 / 1000
  const thresholds = [0,250,600,1000,1500,2200];
  let lvl = 1;
  for(let i=0;i<thresholds.length;i++){ if(S.player.xp>=thresholds[i]) lvl = i+1; }
  if(lvl > S.player.level){
    const gained = lvl - S.player.level;
    S.player.level = lvl;
    S.player.skillPoints += gained;
    toast('LEVEL UP', `LVL ${lvl} · +${gained} SKILL POINT${gained>1?'S':''}`, 2400);
  }
}

