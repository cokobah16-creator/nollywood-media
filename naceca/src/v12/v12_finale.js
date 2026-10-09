/* =========================================================================
   NACECA · v12 the accusation — the finale tests your reasoning
   Osas is free and someone is coming for the drive. Before they arrive,
   the player names the Voice and picks three pieces of evidence to put to
   them. Only evidence that ties the Voice to Adaeze counts, and what you
   hold depends on earlier choices (Tobi, the tower, Musa) and on what you
   proved on the table. A sealed accusation made before Osas talks earns
   "You knew". Canon holds: Adaeze is the Voice, revealed only here.
   Beta casework: the accusation is a charge sheet — WHO, METHOD, MONEY TRAIL
   and three pieces of evidence — filed once per save (S.game.accusations.voice)
   and kept across M8 replays. A wrong name gets that person publicly
   arrested (Public Trust −10, Integrity −5); a wrong method or money trail
   costs the case a point each. The reveal is unconditional.
   ========================================================================= */
(function(){
'use strict';
const V12 = window.V12;
const ico = n => typeof icon === 'function' ? icon(n) : '';
const voiceCase = ()=>(window.CW && CW.CASES && CW.CASES.voice) || null;
const accVoice = ()=>(typeof V12.accused === 'function' ? V12.accused('voice') : null);
/* the working copy the reveal reads (rebuilt from the filed record on replays) */
function accFromRecord(r){ return r ? { who:r.suspect, picks:(r.picks || []).slice(), method:r.method, money:r.money } : null; }

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
const WHY_NOT = V12.WHY_NOT = {
  fin_drive:'Encrypted. Without Tobi, nobody can read it tonight.',
  tower_cdr:'Partial data. It puts the handset in Ekosodin, not in her hand.',
  co_madam:'It proves a "Madam" exists. Not who she is.',
  obi_notebook:'It proves Obi paid someone. Not who.',
};

V12.accuse = function(then){
  const sealed = S.game.sealed;
  const items = (S.game.evidence || []).filter(e => !/^co_(vehicle|victim|suspect|plate|driver)$/.test(e.id));
  const VC = voiceCase();
  const file = (picks)=>{
    const rec = (window.CW && CW.file) ? CW.file('voice', { suspect:picks.who, method:picks.method, money:picks.money }, { picks:(picks.ev || []).slice() })
      : (S.game.accusations = S.game.accusations || {}, S.game.accusations.voice = { suspect:picks.who, method:picks.method, money:picks.money, picks:(picks.ev || []).slice(), ok:{ suspect:picks.who === 'adaeze', method:true, money:true }, at:'m8', t:Date.now() });
    S.game._acc = accFromRecord(rec);
    // naming the wrong person is a public arrest: it costs, once, when it's filed
    if(rec && rec.ok && !rec.ok.suspect && !rec.paid){ rec.paid = true; applyEffect((VC && VC.wrongEff) || { publicTrust:-10, integrity:-5 }); }
    V12.log('accuse', { who:picks.who, picks:picks.ev, method:picks.method, money:picks.money });
    if(typeof saveGame === 'function') saveGame(true);
    if(typeof showHUD === 'function') showHUD(true);
    if(typeof then === 'function') then();
  };
  if(window.CW && typeof CW.sheet === 'function' && VC){
    const rec = typeof isRecruit === 'function' && isRecruit();
    CW.sheet({
      id:'screen-accuse', cls:'cw-accuse', title:'BEFORE THEY GET HERE', meta:'CASE 08 · AKINTOLA CLOSE · EKOSODIN',
      lead:'Osas: <i>"Madam is coming for the drive. Herself."</i> A car turns into the close. You have a minute to decide what you\'ll put to whoever comes through that door.'
        + (sealed ? ` Your sealed report named <b>${V12.esc((V12.CANDIDATES.find(c => c.id === sealed.who) || {}).name || '')}</b>.` : ''),
      sections:[
        { key:'who', label:'THE VOICE', q:VC.q.suspect, kind:'cards', preset:sealed ? sealed.who : null, note:rec ? VC.recruit.suspect : null,
          options:V12.CANDIDATES.map(c => ({ id:c.id, name:c.name, line:c.role, img:V12.art(c.art) })) },
        { key:'method', label:'METHOD', q:VC.q.method, kind:'opts', options:VC.method, note:rec ? VC.recruit.method : null },
        { key:'money', label:'MONEY TRAIL', q:VC.q.money, kind:'opts', options:VC.money, note:rec ? VC.recruit.money : null },
        { key:'ev', label:'THREE PIECES OF EVIDENCE', q:'Only evidence that ties the Voice to one person will hold.', kind:'multi', max:3, empty:'You carry nothing to put to them.',
          options:items.map(e => ({ id:e.id, name:e.name, tag:V12.evQ(e.id) === 'weak' ? 'CONTESTED' : '' })) },
      ],
      warn:'One chance tonight. This can\'t be withdrawn.', fileLabel:'LOCK IT IN', armLabel:'TAP AGAIN TO LOCK IT IN', stamp:'FILED',
      onFile:file,
    });
    return;
  }
  // fallback (casework layer missing): who + evidence only
  let ov = document.getElementById('screen-accuse');
  if(!ov){ ov = V12.el('div', 'overlay', ''); ov.id = 'screen-accuse'; document.getElementById('game-root').appendChild(ov); }
  let who = sealed ? sealed.who : null; const picks = [];
  const draw = ()=>{
    ov.innerHTML = `<div class="overlay-bg"></div><div class="acc-frame"><div class="acc-head"><div class="plan-t">BEFORE THEY GET HERE</div></div>
      <div class="acc-body"><div class="acc-grid">${V12.CANDIDATES.map(c => `<button class="acc-card ${who === c.id ? 'sel' : ''}" data-id="${c.id}"><b>${c.name}</b><span>${c.role}</span></button>`).join('')}</div>
      <div class="acc-ev">${items.map(e => `<button class="acc-item ${picks.includes(e.id) ? 'sel' : ''}" data-id="${e.id}">${V12.esc(e.name)}</button>`).join('')}</div></div>
      <div class="acc-foot"><button class="btn primary" id="acc-go" ${who && (picks.length === 3 || (items.length < 3 && picks.length === items.length)) ? '' : 'disabled'}>LOCK IT IN</button></div></div>`;
    ov.querySelectorAll('.acc-card').forEach(b => b.addEventListener('click', ()=>{ who = b.dataset.id; draw(); }));
    ov.querySelectorAll('.acc-item').forEach(b => b.addEventListener('click', ()=>{ const id = b.dataset.id, i = picks.indexOf(id); if(i >= 0) picks.splice(i, 1); else if(picks.length < 3) picks.push(id); draw(); }));
    const go = ov.querySelector('#acc-go');
    go.addEventListener('click', ()=>{ if(!go.dataset.armed){ go.dataset.armed = '1'; go.textContent = 'TAP AGAIN — NO TAKING IT BACK'; return; } showOverlay(null); file({ who, ev:picks, method:null, money:null }); });
  };
  draw(); showHUD(false); showOverlay('screen-accuse');
};

/* the reveal waits for the accusation */
V12.wrap('finaleArrival', orig => function(){
  if(S.game._finArrived || S.game._acc) return orig.apply(this, arguments);
  // a replay of M8: the accusation filed the first time stands
  const rec = accVoice();
  if(rec){
    S.game._acc = accFromRecord(rec);
    if(typeof toast === 'function') toast('YOUR ACCUSATION STANDS', 'Filed the first time you stood in this close', 2200);
    return orig.apply(this, arguments);
  }
  const self = this, args = arguments;
  V12.accuse(()=>orig.apply(self, args));
});
// replays clear the per-run copy only; the filed record (S.game.accusations.voice) is permanent and the arrival restores it
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
  // earlier charge sheets that never reached their aftermath settle now, before the proofs are counted
  if(window.CW && typeof CW.settleAll === 'function') try{ CW.settleAll(); }catch(e){}
  const rec = accVoice();
  const A = S.game._acc || accFromRecord(rec) || { who:null, picks:[] };
  const strong = V12.strongAgainstAdaeze(), right = A.who === 'adaeze';
  const f = S.game.flags || {}, body = !!f.fin_bodycam, sealed = S.game.sealed;
  const ok = (rec && rec.ok) || { method:true, money:true };
  let s = right ? (A.picks || []).filter(id => strong[id]).length : 0;
  if(body) s += 1;
  if(sealed && sealed.before) s += sealed.who === 'adaeze' ? 1 : -1;
  if(rec && rec.method && !ok.method) s -= 1;    // the defence takes the motive apart
  if(rec && rec.money && !ok.money) s -= 1;      // the payroll goes unexplained
  s = Math.max(0, s);
  const outcome = s >= 3 ? 'proven' : s === 2 ? 'contested' : 'unproven';
  S.game.moralChoices.finale = outcome;
  const hurt = (S.game._finRisk || 0) > 0;
  S.game.flags.fin_osas = hurt ? 'hurt' : 'safe';
  const evName = id => ((S.game.evidence || []).find(e => e.id === id) || {}).name || id;
  const rows = (A.picks || []).map(id => (right && strong[id]) ? `HOLDS: ${evName(id)} — ${strong[id]}` : `FAILS: ${evName(id)} — ${right ? (WHY_NOT[id] || 'It doesn\'t tie her to the calls.') : 'It was built against the wrong person.'}`);
  if(body) rows.push('HOLDS: Body-cam — her own words in the yard.');
  if(sealed && sealed.before) rows.push(sealed.who === 'adaeze' ? 'HOLDS: Your sealed report — filed before tonight.' : 'FAILS: Your sealed report named someone else.');
  const nmOf = (k, id)=>(window.CW && CW.optName) ? CW.optName('voice', k, id) : id;
  // a motive or money trail argued against the wrong person never holds, however right the reading was
  if(rec && rec.method) rows.push(!ok.method ? `FAILS: Motive — you argued "${nmOf('method', rec.method)}". The payroll says otherwise.`
    : right ? `HOLDS: Motive — ${nmOf('method', rec.method)}.` : `SET ASIDE: Motive — "${nmOf('method', rec.method)}", argued against the wrong person.`);
  if(rec && rec.money) rows.push(!ok.money ? `FAILS: Money trail — you argued "${nmOf('money', rec.money)}". Nobody can follow it to her.`
    : right ? `HOLDS: Money trail — ${nmOf('money', rec.money)}.` : `SET ASIDE: Money trail — "${nmOf('money', rec.money)}", argued against the wrong person.`);
  const VC = voiceCase();
  const heldLine = (!right && A.who && VC && VC.held && VC.held[A.who]) ? VC.held[A.who] + ' ' : '';
  const nmWho = id => (V12.CANDIDATES.find(c => c.id === id) || {}).name || 'someone else';
  const lead = right ? 'The case you put to her: ' : `Your accusation named ${nmWho(A.who)}. What that leaves against her: `;
  const sysLine = { speaker:'NACECA SYSTEM', text:heldLine + (rows.length ? lead + rows.join(' · ') : lead + 'nothing that will hold up in court.') + (hurt ? ' Osas is hurt in the scramble — a broken wrist, nothing worse.' : ' Osas walks out on his own feet.') };
  const key = 'fin_end_' + outcome;
  DIALOGUE[key + '_run'] = [sysLine].concat(DIALOGUE[key]);
  V12.log('finale', { outcome, s, right, body, method:ok.method, money:ok.money });
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
  if(S.game.currentMission === 'm7' && !S.game.sealed) h += `<div class="cw-callout">${ico('scales')} If you think you know who the Voice is, open the operations table and <b>seal an accusation</b> before Ekosodin.</div>`;
  if(S.game.currentMission === 'm3' && !S.game.completedMissions.includes('m3n')) h = `Next — <b>Night Shift</b> · Lagos HQ, 23:40. Half the office is dark, and the Commander is on the phone to Abuja.`;
  return h;
});

})();
