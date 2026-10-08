/* =========================================================================
   NACECA · v12 core — "deeper before bigger"
   Shared helpers, story-continuity fixes, the three visible reputations
   (Public Trust · Agency Standing · Underworld Heat, with Integrity hidden),
   capabilities that change play, and the first-minute fixes.
   Every override wraps the original function, so the engine layer is untouched.
   ========================================================================= */
(function(){
'use strict';
const V12 = window.V12 = window.V12 || {};
V12.version = 'v12.2';

/* ---------- helpers ---------- */
V12.el = (tag, cls, html)=>{ const e = document.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; };
V12.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
V12.has = id => !!(S && S.player && Array.isArray(S.player.skills) && S.player.skills.includes(id));
V12.rep = () => S.player.reputation;
V12.heat = () => { const r = S.player.reputation; if(r.underworldHeat == null) r.underworldHeat = 20; return r.underworldHeat; };
V12.hasEv = id => !!(S.game && Array.isArray(S.game.evidence) && S.game.evidence.some(e => e.id === id));
V12.evQ = id => (S.game.evQ && S.game.evQ[id]) || 'good';
V12.started = m => S.game.currentMission === m || (S.game.completedMissions || []).includes(m);
V12.log = V12.log || function(type, data){ (V12._q = V12._q || []).push([type, data || {}, Date.now()]); };
V12.wrap = (name, make)=>{
  const orig = window[name];
  if(typeof orig !== 'function'){ console.warn('[v12] cannot wrap', name); return false; }
  const f = make(orig); f._v12orig = orig; window[name] = f; return true;
};
V12.objAdd = (id, text)=>{
  const objs = S.game.objectives || (S.game.objectives = []);
  if(objs.some(o => o.id === id)) return;
  objs.push({ id, text, done:false });
  if(typeof renderObjectives === 'function') renderObjectives();
};
V12.objDone = id => (S.game.objectives || []).some(o => o.id === id && o.done);
V12.say = (speaker, text, ms)=>{ if(typeof radioLine === 'function') radioLine(speaker, text, ms); };
V12.text = (from, text, ms)=>{ if(typeof radioLine === 'function') radioLine('TEXT · ' + from, text, ms || Math.max(3200, text.length * 55)); };

/* ---------- story continuity (cold open, HQ, the reveal callbacks) ---------- */
const m0 = MISSIONS.find(m => m.id === 'm0');
if(m0){ m0.summary = 'The night before. A man in a blue shirt, a brown folder, a van in the rain.'; m0.region = 'LAGOS · MUSHIN, 23:10'; }
if(!MISSIONS.some(m => m.id === 'm3n')){
  const i = MISSIONS.findIndex(m => m.id === 'm3');
  MISSIONS.splice(i + 1, 0, { id:'m3n', num:'03½', name:'Night Shift', region:'LAGOS · NACECA HQ, 23:40',
    summary:'After Lekki. Half the office is dark, Uche is eating at his desk, and the Commander is on the phone to Abuja.', playable:true, interlude:true });
}
const DL = DIALOGUE;
// "I don't need cowboys. I need control." — everyone hears it on day one, because the reveal quotes it
DL.hq_harsh[0].text = "Careful. I don't need cowboys, Kelechi. I need control. Don't make me regret signing your posting.";
DL.hq_lawful.push({ speaker:'COMMANDER ADAEZE', text:"One more thing. I don't need cowboys. I need control." });
DL.hq_savvy.push({ speaker:'COMMANDER ADAEZE', mood:'evasive', text:"And Kelechi — I don't need cowboys. I need control." });
// the Voice has a phrase. Sharp players will hear it twice before the reveal.
DL.tower_mother[0].text = "Officer. Officer, please. They call me from seven. They let him say 'Mummy', then the voice says, 'Mama Osas, nobody needs to be a hero.' Then they take the phone. Three days now.";
DL.fin_call[1].text = "Mama Osas. Have you found the money — or have you found the police? Nobody needs to be a hero.";
DL.fin_reveal[0].text = "Put the drive on the ground, Kelechi. Gently. Nobody needs to be a hero tonight.";
// Musa names who gives the Engineer his orders
DL.checkpoint_musa_flip[1].text = "Dem call am 'Engineer'. Him dey wait for the filling station before Ugbowo junction. And na woman dey give am order — dem dey call her 'Madam'. I fit show you the place. Abeg, tell them say I talk.";
DL.checkpoint_musa_flip[1].textEn = "They call him 'Engineer'. He waits at the filling station before Ugbowo junction. And a woman gives him his orders — they call her 'Madam'. I can show you the place. Please, tell them I talked.";
// the courier drops his phone in the rain — the 'Tell Madam it's clean' card now has a source
for(const k of ['co_plate_partial','co_plate_none','co_plate_driver']){
  if(DL[k] && !DL[k]._v12){ DL[k]._v12 = true; DL[k].push({ speaker:'NACECA SYSTEM', text:"Where the okada stood: a cracked phone in a puddle. One unsent message — 'Tell Madam it's clean.'" }); }
}
// achievements for the new systems
const ACH_NEW = [
  { id:'first_ink',    name:'Click',           desc:'File a link on the operations table that holds.' },
  { id:'did_the_work', name:'Did the Work',    desc:'Go into Lekki knowing the suspect count, the laptop and the side gate.' },
  { id:'night_shift',  name:'Night Shift',     desc:'Find Madam on the operations table.' },
  { id:'you_knew',     name:'You Knew',        desc:'Seal the right name before Osas says a word.' },
  { id:'scam_spotter', name:'Scam Spotter',    desc:'Score 7 out of 7 in Scam or Legit.' },
];
for(const a of ACH_NEW) if(!ACHIEVEMENTS.some(x => x.id === a.id)) ACHIEVEMENTS.push(a);
const inc = ACHIEVEMENTS.find(a => a.id === 'incorruptible'); if(inc) inc.desc = 'Keep your hands clean long enough for people to notice.';

/* ---------- three visible reputations + hidden integrity ---------- */
V12.REP = [
  { key:'publicTrust',    label:'PUBLIC TRUST',    color:'#4aa3e8', note:'How the street sees you' },
  { key:'agencyFavour',   label:'AGENCY STANDING', color:'#b07be8', note:'How NACECA sees you' },
  { key:'underworldHeat', label:'UNDERWORLD HEAT', color:'#e8774a', note:'How the cartel sees you — high heat scares informants off' },
];
V12.repBars = (r0)=>{
  const r = S.player.reputation; V12.heat();
  return V12.REP.map(d => {
    const v = Math.round(r[d.key] || 0), dv = r0 ? v - Math.round(r0[d.key] == null ? (d.key === 'underworldHeat' ? 20 : 50) : r0[d.key]) : 0;
    const dtxt = r0 && dv ? `<em class="${(d.key === 'underworldHeat' ? dv < 0 : dv > 0) ? 'up' : 'down'}">${dv > 0 ? '+' : ''}${dv}</em>` : '';
    return `<div class="v12-rep" title="${d.note}"><span class="l">${d.label}</span><div class="b"><i style="width:${v}%;background:${d.color}"></i></div><span class="v">${v}${dtxt}</span></div>`;
  }).join('');
};
V12.addHeat = n => { const r = S.player.reputation; r.underworldHeat = clamp(V12.heat() + n, 0, 100); };
V12.wrap('applyEffect', orig => function(eff, flagPayload){
  if(eff && eff.heat) V12.addHeat(eff.heat);
  if(eff && eff.force) V12.addHeat(5 * eff.force);
  if(flagPayload && flagPayload.force) V12.addHeat(5 * flagPayload.force);
  return orig.apply(this, arguments);
});
V12.wrap('loadGame', orig => function(){
  const ok = orig.apply(this, arguments);
  if(ok){
    V12.heat();
    if(!S.game.ops) S.game.ops = null;            // rebuilt lazily by the operations table
    else if(typeof V12.ops === 'function') try{ V12.ops(); }catch(e){ console.warn('[v12] ops migrate', e); }   // older saves gain strikes, locks and cases; inks stay
    // capabilities replaced the old skill tree: refund anything that no longer exists
    if(!S.player._capV12){
      const old = ['breach','squad','scanner','master_t','calm','persuade','master_n','eye','data','crypto','master_f'];
      const had = S.player.skills.filter(id => old.includes(id));
      if(had.length){ S.player.skillPoints += had.length; S.player.skills = S.player.skills.filter(id => !old.includes(id)); setTimeout(()=>toast('UPGRADES REFUNDED', `${had.length} point${had.length>1?'s':''} back — every capability now changes how you play`, 3200), 600); }
      S.player._capV12 = true;
    }
  }
  return ok;
});
// heat moves with what you did on the operation (arrests and force raise it, quiet work cools it)
V12.wrap('showAftermath', orig => function(){
  const o = S.game._opStart || {};
  const arrests = (S.game.arrests || 0) - (o.arrests || 0), force = (S.game.forceUsed || 0) - (o.force || 0);
  if(!S.game._heatDone || S.game._heatDone !== S.game.currentMission + ':' + (o.xp || 0)){
    S.game._heatDone = S.game.currentMission + ':' + (o.xp || 0);
    let dh = 5 * arrests + 3 * force;
    if(!arrests && !force) dh -= 3;
    if(S.game.currentMission === 'm3' && S.game.moralChoices.arrest === 'bribe') dh -= 12;
    V12.addHeat(dh);
  }
  const r = orig.apply(this, arguments);
  try{
    const blocks = [...document.querySelectorAll('#aftermath-grid .aftermath-block')];
    const rb = blocks.find(b => (b.querySelector('h3') || {}).textContent === 'REPUTATION');
    if(rb){
      const xpRows = [...rb.querySelectorAll('.stat-row')].filter(x => /XP|Level/.test(x.textContent)).map(x => x.outerHTML).join('');
      rb.innerHTML = `<h3>REPUTATION</h3>${V12.repBars(o.rep)}<div class="v12-rep-sep"></div>${xpRows}`;
    }
    V12.log('mission_end', { m:S.game.currentMission, grade:(S.game.grades || {})[S.game.currentMission], arrests, force });
  }catch(e){ console.warn('[v12] aftermath', e); }
  return r;
});
V12.wrap('showRecap', orig => function(then){
  const r = orig.apply(this, arguments);
  const el = document.querySelector('#screen-recap .recap-rep');
  if(el){ const p = S.player.reputation; el.innerHTML = `Public Trust <b>${p.publicTrust}</b> · Agency Standing <b>${p.agencyFavour}</b> · Underworld Heat <b>${V12.heat()}</b> · Level <b>${S.player.level}</b>`; }
  return r;
});

/* ---------- capabilities: every upgrade is a new ability ---------- */
const CAPS = {
  fieldcraft: [
    { id:'longlens', name:'Long Lens',      desc:'Read plates and faces from 36 m instead of 24. Your SCAN reaches half again as far.', where:'Cold open plate · every forensic sweep' },
    { id:'greyman',  name:'Grey Man',       desc:'When you tail someone, their suspicion builds a third slower.', where:'The courier · the finale tail', requires:'longlens' },
    { id:'pursuit',  name:'Pursuit Lines',  desc:'Uche cuts corners in foot chases. Runners lose ground.', where:'KC in Ikeja · Ifeanyi in Asaba', requires:'greyman' },
  ],
  interrogation: [
    { id:'readroom', name:'Read the Room',  desc:'In documents and statements, the lines worth a second look get underlined.', where:'Every document check' },
    { id:'pressure', name:'Pressure Point', desc:'Your first miss on each document doesn\'t weaken the evidence.', where:'Every document check', requires:'readroom' },
    { id:'crisis',   name:'Crisis Negotiator', desc:'Talk down armed or panicking suspects. Unlocks extra options.', where:'Chief Obi\'s arrest · Musa at the checkpoint', requires:'pressure' },
  ],
  network: [
    { id:'sources',  name:'Street Sources', desc:'A contact texts you one fact at the start of each operation — unless your Underworld Heat scares them off.', where:'Every operation' },
    { id:'money',    name:'Follow the Money', desc:'Your first wrong money link on each case is forgiven: struck off, but no strike and no Integrity cost.', where:'The operations table', requires:'sources' },
    { id:'squad',    name:'Squad Trust',    desc:'Post Uche at the rear exit when you plan a raid. He holds the tower perimeter 15 s longer.', where:'Lekki raid plan · Ugbowo tower', requires:'money' },
  ],
};
for(const k of Object.keys(SKILLS)) delete SKILLS[k];
Object.assign(SKILLS, CAPS);
V12.CAP_BRANCHES = [
  { key:'fieldcraft',    label:'FIELDCRAFT',    tag:'SURVEILLANCE · TAILS · PURSUIT' },
  { key:'interrogation', label:'INTERROGATION', tag:'DOCUMENTS · STATEMENTS · TALK-DOWNS' },
  { key:'network',       label:'NETWORK',       tag:'INFORMANTS · MONEY · SQUAD' },
];
window.openSkillTree = function(){
  $('#skill-points-num').textContent = S.player.skillPoints;
  const cols = $('#skill-cols');
  cols.innerHTML = V12.CAP_BRANCHES.map(b => `
    <div class="skill-col v12-${b.key}">
      <h3>${b.label}</h3><div class="branch-tag">${b.tag}</div>
      ${SKILLS[b.key].map(s => {
        const unlocked = S.player.skills.includes(s.id), locked = s.requires && !S.player.skills.includes(s.requires) && !unlocked;
        return `<div class="skill-node ${unlocked ? 'unlocked' : ''} ${locked ? 'locked' : ''}" data-sid="${s.id}">
          <div class="name">${s.name}${unlocked ? `<span class="check">${typeof icon === 'function' ? icon('check') : ''}</span>` : ''}</div>
          <div class="desc">${s.desc}</div><div class="v12-where">${s.where}</div></div>`;
      }).join('')}
    </div>`).join('');
  $$('#skill-cols .skill-node').forEach(n => n.addEventListener('click', ()=>{
    const id = n.dataset.sid;
    if(n.classList.contains('unlocked')) return;
    if(n.classList.contains('locked')){ toast('LOCKED', 'Unlock the one above it first'); return; }
    if(S.player.skillPoints <= 0){ toast('NO POINTS', 'Level up on operations to earn one'); return; }
    S.player.skillPoints -= 1; S.player.skills.push(id);
    const s = Object.values(SKILLS).flat().find(x => x.id === id);
    toast('CAPABILITY UNLOCKED', (s ? s.name : id).toUpperCase(), 2200);
    V12.log('capability', { id });
    window.openSkillTree();
  }));
  showOverlay('screen-skills');
};
const skHead = document.querySelector('#screen-skills h2'); if(skHead) skHead.textContent = 'CAPABILITIES';

/* Long Lens — the cold-open plate, and every forensic sweep */
V12.wrap('coPlateQuestion', orig => function(){
  if(V12.has('longlens') && typeof CO !== 'undefined' && CO.plateDist < 36) CO.plateDist = Math.min(CO.plateDist, 23.5);
  return orig.apply(this, arguments);
});
window.sideScan = function(){
  if(!SIDE.traces.length || !ENGINE.player || S.game.currentMission !== SIDE.mid) return;
  const p = ENGINE.player.position;
  let R = ({ story:9, standard:7, hard:5.5 })[(typeof SETTINGS !== 'undefined' && SETTINGS.difficulty) || 'standard'] || 7;
  if(V12.has('longlens')) R *= 1.5;
  let n = 0, near = null, nd = 1e9;
  for(const tr of SIDE.traces){
    if(tr.found || tr.revealed) continue;
    const d = Math.hypot(tr.t.pos[0] - p.x, tr.t.pos[1] - p.z);
    if(d <= R){ sideReveal(tr); n++; } else if(d < nd){ nd = d; near = tr; }
  }
  if(n) setTimeout(()=>toast('TRACE DETECTED', n > 1 ? `${n} traces close by — walk over and log them` : 'Walk over and log it', 1900), 350);
  else if(near) sidePing(near, nd);
  else if(SIDE.traces.some(t => !t.found)) sidePing(null, 0);
};
/* Grey Man + Underworld Heat — how fast a tail notices you */
V12.tailMul = ()=>{ let k = V12.has('greyman') ? 0.65 : 1; const h = V12.heat(); if(h > 50) k *= 1 + (h - 50) / 100; return k; };
window.updateTail = function(dt){
  const c = TAIL.active; if(!c || !ENGINE.player) return;
  if(isOverlayOpen()) return;
  const r = c.target, u = r.userData, p = ENGINE.player.position;
  c.t += dt;
  const looking = c.lookT > 0;
  if(looking){ c.lookT -= dt; }
  else if(c.t >= c.nextLook){ c.lookT = c.lookFor; c.nextLook = c.t + c.lookEvery + Math.random()*2; }
  let fwdYaw = r.rotation.y;
  if(!looking){
    let step = c.speed * dt;
    while(step > 0 && c.seg < c.path.length-1){
      const b = c.path[c.seg+1];
      const dx = b[0]-r.position.x, dz = b[1]-r.position.z, d = Math.hypot(dx, dz);
      if(d <= step){ r.position.x = b[0]; r.position.z = b[1]; step -= d; c.seg++; }
      else { r.position.x += dx/d*step; r.position.z += dz/d*step; r.rotation.y = Math.atan2(dx, dz); step = 0; }
    }
    u.walkPhase = (u.walkPhase||0) + dt*6;
    const sw = Math.sin(u.walkPhase)*0.35;
    if(u.armL) u.armL.rotation.x = sw; if(u.legL) u.legL.rotation.x = -sw*0.8; if(u.legR) u.legR.rotation.x = sw*0.8;
    fwdYaw = r.rotation.y;
  } else {
    r.rotation.y = fwdYaw;
    if(u.neck) u.neck.rotation.y = Math.PI*0.9;
  }
  if(!looking && u.neck) u.neck.rotation.y *= 0.8;
  const dx = p.x - r.position.x, dz = p.z - r.position.z, dist = Math.hypot(dx, dz);
  const crouch = ENGINE.keys['KeyC'];
  let gain = 0;
  if(dist < c.near) gain += 38;
  if(looking && dist < 10){
    const toP = Math.atan2(dx, dz);
    let d = toP - (fwdYaw + Math.PI); while(d > Math.PI) d -= Math.PI*2; while(d < -Math.PI) d += Math.PI*2;
    if(Math.abs(d) < 0.95) gain += (crouch ? 22 : 55) * (1 - dist/12);
  }
  const rate = (typeof chaseRate==='function' ? chaseRate() : 1) * V12.tailMul();
  if(gain > 0) c.susp = Math.min(100, c.susp + gain * dt * rate);
  else c.susp = Math.max(0, c.susp - 7*dt);
  c.lostT = dist > c.far ? c.lostT + dt : 0;
  showMeter('tail', c.label + (looking ? ' — LOOKING BACK' : ' — SUSPICION'), c.susp/100, c.susp > 55 || looking ? 'danger' : 'info', dist.toFixed(0) + ' m');
  if(c.susp >= 100){ const cb = c.onSpotted; stopTail(); toast('SPOTTED', 'She saw you. She\'s running for the gate.', 2200); sfxFail(); if(typeof haptic==='function') haptic(120); V12.log('tail_spotted', {}); if(cb) cb(); return; }
  if(c.lostT > 4){ const cb = c.onLost || c.onSpotted; stopTail(); toast('LOST HER', 'She turned a corner and she\'s gone.', 2200); sfxFail(); if(cb) cb(); return; }
  if(c.seg >= c.path.length-1){ const cb = c.onArrive; stopTail(); if(cb) cb(); }
};
V12.wrap('updatePrologue', orig => function(dt){
  const before = (typeof CO !== 'undefined' && CO.courier) ? CO.susp : null;
  const r = orig.apply(this, arguments);
  if(before != null && CO.susp > before){ const k = V12.tailMul(); if(k !== 1) CO.susp = Math.min(100, before + (CO.susp - before) * k); }
  return r;
});
/* Pursuit Lines + predictive intel — chases you can win by preparation */
V12.wrap('startChase', orig => function(cfg){
  const c = orig.apply(this, arguments);
  if(c && c.catchDist > 0){
    if(V12.has('pursuit')){ c.speed *= 0.88; setTimeout(()=>V12.say('SGT. UCHE', "I'm cutting through the back — push him towards me!"), 900); }
    if(V12.intelTier && V12.intelTier() >= 3) c.speed *= 0.93;
    V12.log('chase', { label:c.label });
  }
  return c;
});
/* Squad Trust — Uche holds the tower perimeter longer */
V12.wrap('towerPowerOn', orig => function(){
  const r = orig.apply(this, arguments);
  if(V12.has('squad')){ S.game._towerWindow = (S.game._towerWindow || 75) + 15; setTimeout(()=>V12.say('SGT. UCHE', "I've got the fence. Take the extra time on that cabinet."), 2200); }
  return r;
});

/* Street Sources — one fact per operation, unless the heat on your name scares them off */
const TIPS = {
  m2: { from:'TUNDE',  text:'Oga, the boy keeps his SIM batch in his bag. And he dumped the sleeves behind the stalls.', act:()=>V12.revealTraces() },
  m3: { from:'SOURCE', text:"Obi's house tonight: three men inside, a child upstairs earlier, staff in the kitchen.", act:()=>{ S.game._tipM3 = true; } },
  m4: { from:'SOURCE', text:'The welder who built that lorry\'s compartment works out of Sapele. Look at the chassis rail.', act:()=>V12.revealTraces() },
  m5: { from:'SOURCE', text:'The jerry-cans came in on a heavy truck at night. Tyre tracks off the path, boot prints by the back wall.', act:()=>V12.revealTraces() },
  m6: { from:'SOURCE', text:'Tobi is in the side office by the east wall. They doused it already.', act:()=>{ S.game._tipM6 = true; } },
  m7: { from:'SOURCE', text:'Men on the east fence are waiting for your floodlights. Be quick on that cabinet.', act:()=>{ S.game._tipM7 = true; } },
  m8: { from:'SOURCE', text:'The generator man on Akintola leaves the back chain off at nine to run the diesel.', act:()=>{ S.game._tipM8 = true; } },
};
V12.revealTraces = ()=>{ try{ (SIDE.traces || []).forEach(tr => { if(!tr.found) sideReveal(tr); }); }catch(e){} };
V12.sourcesTip = (id)=>{
  if(!V12.has('sources') || !TIPS[id] || S.game.currentMission !== id) return;
  if(V12.heat() >= 70){ V12.text('SOURCE', 'Nobody is answering. Your sources have gone quiet — too much heat on your name.'); V12.log('tip_blocked', { m:id }); return; }
  const t = TIPS[id]; V12.text(t.from, t.text); try{ t.act(); }catch(e){} V12.log('tip', { m:id });
};
V12.wrap('musaGaveTip', orig => function(){ return orig.apply(this, arguments) || !!S.game._tipM8; });
// M6: a known side office buys Tobi time; M7: a warned team gains on the trace window
V12.wrap('updateAsabaTrigger', orig => function(dt){
  const before = S.game._asabaTriggered;
  const r = orig.apply(this, arguments);
  if(!before && S.game._asabaTriggered){
    let bonus = 0;
    if(S.game._tipM6) bonus += 8;
    if(S.game.ops && S.game.ops.theories && S.game.ops.theories.t_route) bonus += 8;
    if(bonus){ S.game._asabaSmokeTimer = (S.game._asabaSmokeTimer || 0) - bonus; setTimeout(()=>V12.say('SGT. UCHE', 'Side office, east wall — we know where he is. Go!'), 600); }
  }
  return r;
});
V12.wrap('towerPowerOn', orig => function(){
  const r = orig.apply(this, arguments);
  if(S.game._tipM7) S.game._towerWindow = (S.game._towerWindow || 75) + 10;
  return r;
});

/* ---------- evidence that now has a source in the world ---------- */
V12.wrap('prologueEnd', orig => function(){
  try{ if(!V12.hasEv('co_madam')) collectEvidence({ id:'co_madam', name:"Courier's Dropped Phone — 'Tell Madam it's clean'", xp:50 }); }catch(e){}
  return orig.apply(this, arguments);
});
V12.wrap('collectEvidence', orig => function(ev){
  const r = orig.apply(this, arguments);
  try{
    if(ev && ev.id === 'cash' && !V12.hasEv('obi_notebook')) setTimeout(()=>window.collectEvidence({ id:'obi_notebook', name:"Obi's Notebook — Initials and Amounts", xp:40 }), 1900);
    V12.log('evidence', { id: ev && ev.id });
    if(typeof V12.opsRefresh === 'function') V12.opsRefresh();      // new evidence can open a lead or lift a refused warrant
  }catch(e){}
  return r;
});
V12.wrap('endDialogue', orig => function(){
  const key = DLG.scriptKey;
  const r = orig.apply(this, arguments);
  try{
    // KC's SIM batch is a lead you earn: his statement after a fair arrest, or the sleeve sweep
    if(key === 'market_runner'){
      const ch = (S.game.moralChoices || {}).choice;
      if(ch === 'detain' || ch === 'flip'){
        S.game.flags = S.game.flags || {}; S.game.flags.kc_statement = true;
        if(!V12.hasEv('kc_sims')) setTimeout(()=>collectEvidence({ id:'kc_sims', name:"KC's Statement — His SIM Batch, 50 SIMs, One Registrant", xp:50 }), 900);
        else if(typeof V12.opsRefresh === 'function') V12.opsRefresh();
      }
    }
    if(key === 'checkpoint_resolve' && S.game.moralChoices.checkpoint === 'flip_driver' && !V12.hasEv('musa_record'))
      setTimeout(()=>collectEvidence({ id:'musa_record', name:"Musa's Wired Statement — 'Madam' Gives the Engineer His Orders", xp:80 }), 700);
  }catch(e){ console.warn('[v12] endDialogue', e); }
  return r;
});
V12.wrap('sideComplete', orig => function(qid){
  const r = orig.apply(this, arguments);
  if(qid === 'm2_sims'){ S.game.flags = S.game.flags || {}; S.game.flags.kc_sweep = true; }
  if(qid === 'm4_weld'){ S.game.flags = S.game.flags || {}; S.game.flags.weld_receipt = true; }
  if(qid === 'm2_sims' && !V12.hasEv('kc_sims')) setTimeout(()=>collectEvidence({ id:'kc_sims', name:"KC's SIM Batch — Sleeves Behind the Stalls", xp:50 }), 1400);
  if((qid === 'm2_sims' || qid === 'm4_weld') && typeof V12.opsRefresh === 'function') V12.opsRefresh();
  return r;
});
// the welder's receipt from the m4 sweep is a lead on the operations table
V12.wrap('sideCollect', orig => function(tr){
  const r = orig.apply(this, arguments);
  try{
    if(tr && tr.t && tr.t.id === 'm4b'){ S.game.flags = S.game.flags || {}; S.game.flags.weld_receipt = true; if(typeof V12.opsRefresh === 'function') V12.opsRefresh(); }
  }catch(e){}
  return r;
});

/* ---------- mission start: objectives, evidence counts, the cold-open camera ---------- */
V12.wrap('beginMissionCore', orig => function(id){
  const r = orig.apply(this, arguments);
  try{
    if(id === 'm2'){ setEvidenceMax(2); V12.objAdd('o4_table', 'Ink three links on the operations table'); }
    if(id === 'm3') setEvidenceMax(4);
  }catch(e){ console.warn('[v12] begin', e); }
  return r;
});
V12.wrap('beginMission', orig => function(id){
  const before = S.game._opStart;
  const r = orig.apply(this, arguments);
  // beginMission defers itself while art loads; act only once the operation has really started
  if(S.game._opStart !== before && S.game.currentMission === id && ENGINE.player){
    if(id === 'm0'){ ENGINE.playerPitch = 0.12; resetCameraFollow(); }
    setTimeout(()=>V12.sourcesTip(id), 2600);
    V12.log('mission_start', { m:id });
  }
  return r;
});
// M2: the van waits until the table has three links that hold, or three strikes (fail forward, at a cost)
V12.wrap('buildSceneMarket', orig => function(){
  const r = orig.apply(this, arguments);
  const van = ENGINE.interactables.find(i => /^Board NACECA van/.test(i.label || ''));
  if(van && !van._v12){
    van._v12 = true; const go = van.onInteract;
    van.onInteract = function(){
      const ops = typeof V12.ops === 'function' ? V12.ops() : (S.game.ops || {});
      const inked = (ops.inked || []).length;
      const strikes = typeof V12.caseStrikes === 'function' ? V12.caseStrikes('lagos') : 0;
      if(S.game._marketScanned && S.game.moralChoices.market_runner && inked < 3 && strikes < 3){
        toast('THE TABLE FIRST', 'File three links that hold on the operations table before Lekki — open the CASE FILE', 2600);
        if(typeof showHint === 'function') showHint('table_m2', 'Open the <b>CASE FILE</b> (TAB), pencil what you found, then <b>FILE</b> the links you are sure of', 'Tap <b>CASE FILE</b>, pencil what you found, then <b>FILE</b> the links you are sure of');
        return;
      }
      if(S.game._marketScanned && S.game.moralChoices.market_runner && inked < 3 && strikes >= 3)
        V12.say('SGT. UCHE', "The magistrate won't look at that table again today, sir. We go to Lekki without it.");
      return go.apply(this, arguments);
    };
  }
  return r;
});

/* ---------- camera: canopies fade when they block the view of Kelechi ---------- */
const _occ = { ray:null, from:null, to:null };
V12.occluders = ()=>{
  const list = [];
  const a = window._v12Awning; if(a && a.parent && ENGINE.scene && a.parent === ENGINE.scene) list.push(a);
  if(ENGINE._v12Occ) for(const m of ENGINE._v12Occ) if(m.parent) list.push(m);
  return list;
};
V12.wrap('updateCamera', orig => function(){
  const r = orig.apply(this, arguments);
  try{
    const list = V12.occluders(); if(!list.length || !ENGINE.player || !ENGINE.camera) return r;
    if(!_occ.ray){ _occ.ray = new THREE.Raycaster(); _occ.to = new THREE.Vector3(); _occ.dir = new THREE.Vector3(); }
    const cam = ENGINE.camera.position, p = ENGINE.player.position;
    _occ.to.set(p.x, p.y + 1.4, p.z);
    _occ.dir.copy(_occ.to).sub(cam); const L = _occ.dir.length(); _occ.dir.normalize();
    _occ.ray.set(cam, _occ.dir); _occ.ray.far = L;
    const hits = new Set(_occ.ray.intersectObjects(list, false).map(h => h.object));
    for(const m of list){
      if(!m.userData._v12mat){ m.material = m.material.clone(); m.userData._v12mat = true; }
      const want = hits.has(m) ? 0.18 : 1, mat = m.material;
      const cur = mat.opacity == null ? 1 : mat.opacity;
      const next = cur + (want - cur) * 0.25;
      mat.transparent = next < 0.99; mat.opacity = next; mat.depthWrite = next > 0.9;
      m.children.forEach(ch => { if(ch.userData && ch.userData._outline !== undefined || ch.material === OUTLINE_MAT) ch.visible = next > 0.9; });
    }
  }catch(e){}
  return r;
});

/* ---------- choice labels hidden by default; voice slider; playtest tools ---------- */
SETTINGS_DEFAULT.tags = 'off';
SETTINGS_DEFAULT.voice = 90;
for(const k of ['tags','voice']) if(SETTINGS[k] === undefined) SETTINGS[k] = SETTINGS_DEFAULT[k];
if(!SETTINGS_UI.some(r => r.key === 'voice')){
  const i = SETTINGS_UI.findIndex(r => r.key === 'ambient');
  SETTINGS_UI.splice(i + 1, 0, { key:'voice', label:'Voices', type:'range' });
}
if(!SETTINGS_UI.some(r => r.key === 'tags')){
  const i = SETTINGS_UI.findIndex(r => r.key === 'lang');
  SETTINGS_UI.splice(i + 1, 0, { key:'tags', label:'Choice tone labels', opts:[['off','Hidden'],['on','Shown']],
    note:'Hidden by default: you learn what a choice meant from what happens next.' });
}
{ const d = SETTINGS_UI.find(r => r.key === 'difficulty'); if(d) d.note = 'Story slows timers and suspects, and gives documents an extra miss.'; }
V12.wrap('applySettings', orig => function(){
  const r = orig.apply(this, arguments);
  if(document.body) document.body.classList.toggle('v12-tags', SETTINGS.tags === 'on');
  return r;
});

/* ---------- intel tiers that do something ---------- */
V12.INTEL_TIERS = [
  { at:50,  name:'ON FILE',    text:'Zonal reads your reports first. A warrant is still won on the operations table.' },
  { at:120, name:'PATTERNS',   text:'Forensic traces near you light up on their own — no scan needed.' },
  { at:200, name:'PREDICTIVE', text:'You know their routes: runners in chases are slower.' },
];
V12.intelTier = ()=>{ const v = S.game.intelScore || 0; let t = 0; V12.INTEL_TIERS.forEach((x, i) => { if(v >= x.at) t = i + 1; }); return t; };
V12.wrap('sideTick', orig => function(dt){
  const r = orig.apply(this, arguments);
  try{
    if(V12.intelTier() >= 2 && ENGINE.player && SIDE.traces && SIDE.traces.length){
      const p = ENGINE.player.position;
      for(const tr of SIDE.traces){ if(!tr.found && !tr.revealed && Math.hypot(tr.t.pos[0] - p.x, tr.t.pos[1] - p.z) < 6.5){ sideReveal(tr); toast('PATTERN', 'You know what to look for — a trace close by', 1600); } }
    }
  }catch(e){}
  return r;
});

})();

/* ---------- saving a file for the player ----------
   Inside the claude.ai viewer a page may not download on its own: it asks the
   viewer through the `downloads` capability, who confirms. Hosted anywhere else
   (GitHub Pages, itch.io, a file on disk) a plain download link does the job. */
(function(){
  const V12 = window.V12;
  let dl = null, dlP = null;
  try{ if(window.claude && typeof window.claude.use === 'function') dlP = window.claude.use('downloads').then(d => (dl = d), () => null); }catch(e){}
  V12.saveFile = async function(filename, data){
    const ns = dl || (dlP ? await dlP : null);
    if(ns){
      try{ await ns.save({ filename, data }); return 'saved'; }
      catch(e){ const c = e && e.code; if(c === 'declined' || c === 'rate_limited') return 'declined'; if(c === 'too_large' || c === 'rejected_extension' || c === 'bad_request'){ console.warn('[v12] save', c); return 'failed'; } }
    }
    try{
      const blob = data instanceof Blob ? data : new Blob([data]);
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename;
      document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 2000);
      return 'link';
    }catch(e){ return 'failed'; }
  };
})();
