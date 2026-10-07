/* =========================================================================
   NACECA · v12 the accusation — the finale tests your reasoning
   Osas is free and someone is coming for the drive. Before they arrive,
   the player names the Voice and picks three pieces of evidence to put to
   them. Only evidence that ties the Voice to Adaeze counts, and what you
   hold depends on earlier choices (Tobi, the tower, Musa) and on what you
   proved on the table. A sealed accusation made before Osas talks earns
   "You knew". Canon holds: Adaeze is the Voice, revealed only here.
   ========================================================================= */
(function(){
'use strict';
const V12 = window.V12;

/* what ties the Voice to Adaeze, given what this player actually did */
V12.strongAgainstAdaeze = ()=>{
  const m = S.game.moralChoices || {}, out = {};
  const ok = id => V12.hasEv(id) && V12.evQ(id) !== 'weak';
  if(ok('fin_courier_phone')) out.fin_courier_phone = 'One saved number, "C" — her private line.';
  if(ok('fin_recording')) out.fin_recording = 'The recorded call — her voice, traced.';
  if(ok('fin_drive') && m.asaba === 'rescue') out.fin_drive = 'Tobi can read the payroll: "C.A." is her.';
  if(ok('tower_fix') && m.tower === 'hold') out.tower_fix = 'The handset in that compound, every night.';
  if(ok('tower_cdr') && m.tower === 'hold') out.tower_cdr = 'Full cabinet timing on her handset.';
  if(ok('musa_statement')) out.musa_statement = 'Musa: "Madam" gives the Engineer his orders.';
  if(ok('musa_record')) out.musa_record = 'Musa\'s wired statement names "Madam".';
  if(ok('co_madam') && V12.theory('t_voice')) out.co_madam = '"Tell Madam it\'s clean" — and Madam is the Voice.';
  if(ok('obi_notebook') && V12.theory('t_madam')) out.obi_notebook = 'Obi pays "C.A." every Friday.';
  return out;
};
const WHY_NOT = {
  fin_drive:'Encrypted. Without Tobi, nobody can read it tonight.',
  tower_cdr:'Partial data. It puts the handset in Ekosodin, not in her hand.',
  co_madam:'It proves a "Madam" exists. Not who she is.',
  obi_notebook:'It proves Obi paid someone. Not who.',
};

V12.accuse = function(then){
  let ov = document.getElementById('screen-accuse');
  if(!ov){ ov = V12.el('div', 'overlay', ''); ov.id = 'screen-accuse'; document.getElementById('game-root').appendChild(ov); }
  const sealed = S.game.sealed;
  let who = sealed ? sealed.who : null;
  const picks = [];
  const items = (S.game.evidence || []).filter(e => !/^co_(vehicle|victim|suspect|plate|driver)$/.test(e.id));
  const draw = ()=>{
    ov.innerHTML = `<div class="overlay-bg"></div><div class="acc-frame">
      <div class="acc-head"><div class="plan-k">CASE 08 · AKINTOLA CLOSE</div><div class="plan-t">BEFORE THEY GET HERE</div>
        <p class="acc-lead">Osas: <i>"Madam is coming for the drive. Herself."</i> A car turns into the close. You have a minute to decide what you'll say when the door opens.</p></div>
      <div class="acc-body">
        <div class="acc-step"><div class="v12-step-h"><b>1</b> WHO IS THE VOICE?${sealed ? ` <em>your sealed report named ${(V12.CANDIDATES.find(c => c.id === sealed.who) || {}).name}</em>` : ''}</div>
          <div class="acc-grid">${V12.CANDIDATES.map(c => `<button class="acc-card ${who === c.id ? 'sel' : ''}" data-id="${c.id}"><img src="${V12.art(c.art)}" alt=""><b>${c.name}</b><span>${c.role}</span></button>`).join('')}</div></div>
        <div class="acc-step"><div class="v12-step-h"><b>2</b> THREE PIECES OF EVIDENCE <em>${picks.length}/3</em></div>
          <div class="acc-ev">${items.map(e => `<button class="acc-item ${picks.includes(e.id) ? 'sel' : ''}" data-id="${e.id}">${V12.esc(e.name)}${V12.evQ(e.id) === 'weak' ? ' <i>contested</i>' : ''}</button>`).join('') || '<p class="ops-p">You carry nothing to put to them.</p>'}</div></div>
      </div>
      <div class="acc-foot"><span class="ops-p">Only evidence that ties the Voice to one person will hold. Choose carefully — you get one chance tonight.</span>
        <button class="btn primary" id="acc-go" ${who && (picks.length === 3 || (items.length < 3 && picks.length === items.length)) ? '' : 'disabled'}>LOCK IT IN</button></div>
    </div>`;
    ov.querySelectorAll('.acc-card').forEach(b => b.addEventListener('click', ()=>{ who = b.dataset.id; if(typeof sfxClick === 'function') sfxClick(); draw(); }));
    ov.querySelectorAll('.acc-item').forEach(b => b.addEventListener('click', ()=>{
      const id = b.dataset.id, i = picks.indexOf(id);
      if(i >= 0) picks.splice(i, 1); else if(picks.length < 3) picks.push(id); else { toast('THREE ONLY', 'Put one back first', 1400); return; }
      if(typeof sfxBlip === 'function') sfxBlip(); draw();
    }));
    const go = ov.querySelector('#acc-go');
    go.addEventListener('click', ()=>{
      if(!go.dataset.armed){ go.dataset.armed = '1'; go.textContent = 'TAP AGAIN — NO TAKING IT BACK'; return; }
      S.game._acc = { who, picks:picks.slice() };
      V12.log('accuse', { who, picks });
      showOverlay(null); showHUD(true);
      if(typeof then === 'function') then();
    });
  };
  draw();
  showHUD(false);
  showOverlay('screen-accuse');
};

/* the reveal waits for the accusation */
V12.wrap('finaleArrival', orig => function(){
  if(S.game._finArrived || S.game._acc) return orig.apply(this, arguments);
  const self = this, args = arguments;
  V12.accuse(()=>orig.apply(self, args));
});
V12.wrap('finResetFlags', orig => function(){ const r = orig.apply(this, arguments); delete S.game._acc; return r; });

/* the reveal answers what you did */
V12.wrap('finaleRevealScript', orig => function(){
  const k = orig.apply(this, arguments);
  try{
    const A = S.game._acc || {}, sealed = S.game.sealed, lines = DIALOGUE[k];
    const i = lines.findIndex(l => /^…Commander\?$/.test(l.text || ''));
    const nm = id => (V12.CANDIDATES.find(c => c.id === id) || {}).name || 'someone else';
    if(i >= 0){
      const add = [];
      if(A.who === 'adaeze'){
        lines[i] = { speaker:'AGENT KELECHI', portrait:'kelechi', mood:'angry', text:'Commander. I wondered when you\'d come yourself.' };
        if(sealed && sealed.who === 'adaeze' && sealed.before){
          add.push({ speaker:'AGENT KELECHI', portrait:'kelechi', text:'Benin Zonal has had my sealed report since before tonight. Your name is in it.' });
          add.push({ speaker:'COMMANDER ADAEZE', mood:'afraid', text:'…You knew.' });
          if(typeof unlock === 'function') unlock('you_knew');
        }
      } else {
        add.push({ speaker:'COMMANDER ADAEZE', mood:'evasive', text:`You were looking at ${nm(A.who)}. Everyone always watches the wrong door, Kelechi.` });
      }
      if(sealed && sealed.before && sealed.who !== 'adaeze') add.push({ speaker:'COMMANDER ADAEZE', text:`Zonal forwarded your sealed report to me. You named ${nm(sealed.who)}. I was touched.` });
      lines.splice(i + 1, 0, ...add);
    }
  }catch(e){ console.warn('[v12] reveal', e); }
  return k;
});

DIALOGUE.fin_end_contested[0].text = 'A handful of papers and a frightened boy. My lawyers will be home before you are.';

/* the outcome comes from the case you built */
window.finaleResolve = function(){
  const A = S.game._acc || { who:null, picks:[] };
  const strong = V12.strongAgainstAdaeze(), right = A.who === 'adaeze';
  const f = S.game.flags || {}, body = !!f.fin_bodycam, sealed = S.game.sealed;
  let s = right ? (A.picks || []).filter(id => strong[id]).length : 0;
  if(body) s += 1;
  if(sealed && sealed.before) s += sealed.who === 'adaeze' ? 1 : -1;
  s = Math.max(0, s);
  const outcome = s >= 3 ? 'proven' : s === 2 ? 'contested' : 'unproven';
  S.game.moralChoices.finale = outcome;
  const hurt = (S.game._finRisk || 0) > 0;
  S.game.flags.fin_osas = hurt ? 'hurt' : 'safe';
  const evName = id => ((S.game.evidence || []).find(e => e.id === id) || {}).name || id;
  const rows = (A.picks || []).map(id => (right && strong[id]) ? `✓ ${evName(id)} — ${strong[id]}` : `✗ ${evName(id)} — ${right ? (WHY_NOT[id] || 'It doesn\'t tie her to the calls.') : 'It was built against the wrong person.'}`);
  if(body) rows.push('✓ Body-cam — her own words in the yard.');
  if(sealed && sealed.before) rows.push(sealed.who === 'adaeze' ? '✓ Your sealed report — filed before tonight.' : '✗ Your sealed report named someone else.');
  const sysLine = { speaker:'NACECA SYSTEM', text:(rows.length ? 'The case you put to her: ' + rows.join(' · ') : 'The case you put to her: nothing that will hold up in court.') + (hurt ? ' Osas is hurt in the scramble — a broken wrist, nothing worse.' : ' Osas walks out on his own feet.') };
  const key = 'fin_end_' + outcome;
  DIALOGUE[key + '_run'] = [sysLine].concat(DIALOGUE[key]);
  V12.log('finale', { outcome, s, right, body });
  startDialogue(key + '_run', ()=>{
    completeObjective('o5_voice');
    if(!S.game.completedMissions.includes('m8')) S.game.completedMissions.push('m8');
    if(outcome === 'proven'){ S.game.arrests = (S.game.arrests || 0) + 1; if(typeof unlock === 'function') unlock('airtight'); }
    if(outcome === 'contested') S.game.arrests = (S.game.arrests || 0) + 1;
    S.game.civiliansRescued = (S.game.civiliansRescued || 0) + 1;
    awardXP(outcome === 'proven' ? 500 : outcome === 'contested' ? 400 : 300);
    sfxComplete(); stopAmbient(); showAftermath();
  });
};

/* M7 → M8: tell the player the sealed report exists */
V12.wrap('nextMissionPreview', orig => function(){
  let h = orig.apply(this, arguments);
  if(S.game.currentMission === 'm7' && !S.game.sealed) h += `<div style="margin-top:8px;color:#f0c878">If you think you know who the Voice is, open the operations table and <b>seal an accusation</b> before Ekosodin.</div>`;
  if(S.game.currentMission === 'm3' && !S.game.completedMissions.includes('m3n')) h = `Next — <b>Night Shift</b> · Lagos HQ, 23:40. Half the office is dark, and the Commander is on the phone to Abuja.`;
  return h;
});

})();
