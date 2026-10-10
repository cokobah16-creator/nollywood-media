/* =========================================================================
   NACECA · v13 briefing — the weekly briefing with Commander Adaeze
   Before each operation from Case 04 on, she puts three leads on the desk;
   the unit can work two. Her advice is sometimes honest and sometimes the
   exact lead that points at her. Dropped leads develop without you.
   Also here: gatekeeper calls, the surveillance van, the Apex undercover.
   ========================================================================= */

const BRF = { mid:null, sel:[], phase:'plan', queue:[], out:[], then:null, dec:{} };

function briefingKeyBefore(id){
  const k = Object.keys(BRIEFINGS).find(x => BRIEFINGS[x].before === id);
  if(!k || I().briefed[k] || !(S.game.completedMissions||[]).includes(k)) return null;
  return k;
}
function maybeBriefingBefore(id, then){ const k = briefingKeyBefore(id); if(!k){ then(); return; } openBriefing(k, then); }
function maybeBriefing(mid, then){
  const b = BRIEFINGS[mid];
  if(!b || I().briefed[mid] || !(S.game.completedMissions||[]).includes(mid)){ then(); return; }
  openBriefing(mid, then);
}
function ensureBriefingScreen(){
  if(document.getElementById('screen-briefing')) return;
  const ov = document.createElement('div'); ov.className = 'overlay'; ov.id = 'screen-briefing';
  ov.innerHTML = `<div class="overlay-bg"></div><div class="settings-frame brf-frame"><div class="settings-body" id="brf-body"></div></div>`;
  document.getElementById('game-root').appendChild(ov);
  ov.addEventListener('click', e=>{ const el = e.target.closest('[data-b]'); if(el) briefingAct(el.dataset.b, el.dataset); });
}
function openBriefing(mid, then){
  ensureBriefingScreen();
  const d = I();
  Object.assign(BRF, { mid, sel:[], phase:'plan', queue:[], out:[], then, dec:{}, final:false, warrantDone:false });
  if(d.money.open && !d.briefedReq) d.briefedReq = {};
  if(d.money.open && !(d.briefedReq||{})[mid]){ d.money.req += MONEY_PER_WEEK; d.briefedReq[mid] = true; }
  if(typeof musicForScene === 'function') musicForScene('investigation');
  showHUD(false); ENGINE.movementEnabled = false;
  showOverlay('screen-briefing');
  renderBriefing();
}
function leadBlocked(l){
  if(l.heatMax && heatNow() >= l.heatMax) return l.heatBlocked;
  if(l.needsAny && !l.needsAny.some(x=>intelHas(x))) return l.blocked || 'Not available';
  if(l.needsMission && !S.game.completedMissions.includes(l.needsMission)) return 'Not available';
  return null;
}
function maxLeads(){ return BRF.dec.order === 'quiet' ? 1 : 2; }

function renderBriefing(){
  const b = BRIEFINGS[BRF.mid], d = I(), body = document.getElementById('brf-body'); if(!body) return;
  const ad = (typeof PORTRAIT_ART!=='undefined' && PORTRAIT_ART.adaeze_neutral) || '';
  if(BRF.phase === 'result'){ body.innerHTML = renderBriefingResults(); return; }
  if(BRF.phase === 'warrant'){ body.innerHTML = renderBriefingWarrant(); return; }
  let h = `<div class="brf-week">${b.title}</div><div class="brf-head">THE WEEKLY BRIEFING</div><div class="brf-unit">CYBER & FINANCIAL CRIMES UNIT · LAGOS · CDR. ADAEZE, IN COMMAND SINCE MARCH 2019</div>
    <div class="brf-ad">${ad?`<img src="${ad}" alt="">`:''}<div><div class="brf-who">COMMANDER ADAEZE</div><div class="brf-say">"${esc(b.intro)}"</div></div></div>`;
  const prevWeek = d.dropLog.filter(x=>x.week === b.week - 1);
  if(prevWeek.length) h += `<div class="set-group">WHILE YOU WERE BUSY</div>` + prevWeek.map(x=>`<div class="brf-drop">• ${esc(x.text)}</div>`).join('');

  const needs = [];
  if(b.custody && intelHas(b.custody.item)){
    needs.push('custody');
    h += `<div class="brf-block"><div class="set-group">A REQUEST</div><div class="brf-say">"${esc(b.custody.ask)}"</div>
      <div class="seg">${[['gave','Hand it to her'],['kept','"Ma, procedure says it stays booked in."']].map(([k,l])=>`<button class="${BRF.dec.custody===k?'on':''}" data-b="dec" data-k="custody" data-v="${k}">${l}</button>`).join('')}</div></div>`;
  }
  if(b.order){
    needs.push('order');
    h += `<div class="brf-block"><div class="set-group">AN INSTRUCTION</div><div class="brf-say">"${esc(b.order.text)}"</div>
      <div class="seg col">${[['comply','Comply'],['quiet','Look into him quietly — uses one of your two leads'],['confront','Ask her about it, to her face'],['leak','Pass it to a crime reporter']].map(([k,l])=>`<button class="${BRF.dec.order===k?'on':''}" data-b="dec" data-k="order" data-v="${k}">${l}</button>`).join('')}</div></div>`;
  }
  if(b.press){
    needs.push('press');
    h += `<div class="brf-block"><div class="set-group">${RADIO_STATION} · 07:00</div><div class="brf-radio">"Witnesses say NACECA officers beat traders during the Asaba warehouse raid. The agency has not responded."</div>
      <div class="brf-say">"Zonal is on my phone already. What do you want to do about it?"</div>
      <div class="seg col">${[['bodycam','Release the body-cam footage'],['quiet','Say nothing. Let it pass.'],['trace','Find out who planted the story']].map(([k,l])=>`<button class="${BRF.dec.press===k?'on':''}" data-b="dec" data-k="press" data-v="${k}">${l}</button>`).join('')}</div></div>`;
  }
  const mx = maxLeads();
  const avail = b.leads.filter(l=>!leadBlocked(l));
  const want = Math.min(mx, avail.length);
  BRF.sel = BRF.sel.filter(id=>avail.some(l=>l.id===id)).slice(0, mx);
  h += `<div class="set-group">LEADS · CHOOSE ${want} · ${BRF.sel.length}/${want} SELECTED</div>`;
  h += b.leads.map(l=>{
    const bl = leadBlocked(l), on = BRF.sel.includes(l.id);
    return `<button class="lead ${on?'on':''} ${bl?'locked':''}" data-b="lead" data-id="${l.id}" ${bl?'disabled':''}>
      <div class="dk-name">${on?'☑':'☐'} ${esc(l.name)}</div><div class="dk-meta">${esc(bl || l.desc)}</div></button>`;
  }).join('');
  h += `<div class="brf-advice"><b>COMMANDER ADAEZE:</b> "${esc(b.advice.text)}"</div>`;
  const cert = Object.values(d.items).filter(it=>INTEL_ITEMS[it.id] && INTEL_ITEMS[it.id].e && !it.cert && certWindowOpen(it.id));
  if(cert.length) h += `<div class="set-group">DIGITAL FORENSICS</div><div class="set-note">${cert.length} item${cert.length>1?'s':''} need an s.84 certificate before the next operation, or they won't survive a courtroom.</div>` +
    cert.map(it=>`<div class="brf-cert"><span>${esc(intelLabel(it.id))}</span><button class="mini-btn" data-b="cert" data-id="${it.id}">SIGN · ${certSlotsLeft(it.m)} LEFT</button></div>`).join('');
  if(d.money.open) h += `<div class="set-note" style="margin-top:8px">NFIU: ${d.money.req} financial-intelligence request${d.money.req===1?'':'s'} available this week.</div>`;
  const ready = needs.every(k=>BRF.dec[k]) && BRF.sel.length === want;
  h += `<div class="brf-foot"><button class="btn ghost" data-b="desk">CASE DESK</button><button class="btn primary" data-b="commit" ${ready?'':'disabled'}>${ready?'COMMIT THE WEEK ▶':'DECIDE FIRST'}</button></div>`;
  body.innerHTML = h;
}

function briefingAct(a, ds){
  const b = BRIEFINGS[BRF.mid];
  if(a === 'dec'){ BRF.dec[ds.k] = ds.v; if(ds.k === 'order' && ds.v === 'quiet') BRF.sel = BRF.sel.slice(0,1); (typeof sfxClick==='function' && sfxClick()); renderBriefing(); return; }
  if(a === 'lead'){
    const i = BRF.sel.indexOf(ds.id);
    if(i >= 0) BRF.sel.splice(i, 1);
    else { if(BRF.sel.length >= maxLeads()) BRF.sel.shift(); BRF.sel.push(ds.id); }
    (typeof sfxClick==='function' && sfxClick()); renderBriefing(); return;
  }
  if(a === 'cert'){ certify(ds.id); renderBriefing(); return; }
  if(a === 'desk'){ openDesk(); return; }
  if(a === 'commit'){ commitBriefing(); return; }
  if(a === 'next'){ runNextLead(); return; }
  if(a === 'warrant'){ const wid = BRIEFINGS[BRF.mid].warrant; if(ds.route === 'none') I().warrants[wid] = { status:'skipped' }; else applyWarrant(wid, ds.route); BRF.phase = 'result'; BRF.out.push(warrantResultLine(wid)); BRF.warrantDone = true; renderBriefing(); return; }
  if(a === 'done'){ finishBriefing(); return; }
}

/* --- decisions taken before the leads run --- */
function applyDecisions(){
  const b = BRIEFINGS[BRF.mid], d = I(), dec = BRF.dec;
  if(dec.custody){
    d.custodyAsk = dec.custody;
    const it = d.items[b.custody.item];
    if(dec.custody === 'gave'){ applyEffect({ agencyFavour:+3 }); knowAdd('ledger','Cdr. Adaeze');
      if(it) it.custody.push({ t:"Signed out: Office of the Commander" }, { t:'Returned after three days — page 14 missing' });
      BRF.out.push({ h:'THE LEDGER', t:'She thanks you, and means it. Three days later it comes back to the exhibit room. Page 14 — the Ekosodin pickups — is gone. The register shows who signed it out.' }); }
    else { applyEffect({ agencyFavour:-2, integrity:+2 });
      if(it) it.custody.push({ t:"Commander's request to sign out — declined, booked and sealed" });
      BRF.out.push({ h:'THE LEDGER', t:'"Of course," she says. "Procedure." She doesn\'t ask again.' }); }
  }
  if(dec.order){
    d.order = dec.order;
    if(dec.order === 'comply'){ applyEffect({ agencyFavour:+4 }); BRF.out.push({ h:'THE ENGINEER', t:'You leave him alone. She notices, and thanks you for it.' }); }
    if(dec.order === 'quiet'){ knowAdd('engineer','You'); intelSet('engineer_log'); applyEffect({ intel:+8 }); addInvEvidence('inv_engineer');
      BRF.out.push({ h:'THE ENGINEER', t:"Off the books, you pull his line. Last month it called a number saved nowhere — the same number KC knows as CONTROL — 41 times, always after midnight. Nobody else knows you looked." }); }
    if(dec.order === 'confront'){ applyEffect({ agencyFavour:-3 }); d.alert += 1; knowAdd('engineer','Cdr. Adaeze');
      BRF.out.push({ h:'THE ENGINEER', t:'"He is how we found Lekki. You will have to trust me on this one, Kelechi." She holds your eye. Some of it is true.' }); }
    if(dec.order === 'leak'){ applyEffect({ publicTrust:+3, agencyFavour:-6 }); d.alert += 1; knowAdd('engineer','The press'); intelSet('engineer_fled');
      BRF.out.push({ h:'THE ENGINEER', t:'The story runs on Thursday: "NACECA informant linked to kidnap ring." By Friday the Engineer has vanished, and the commander has stopped saying good morning.' }); }
  }
  if(dec.press){
    const o = d.opLog.m6 || {}, clean = !(o.force > 0) && !(o.bumps > 0);
    d.press = dec.press; d.pressClean = clean;
    if(dec.press === 'bodycam'){
      if(clean){ applyEffect({ publicTrust:+8, agencyFavour:-3 }); BRF.out.push({ h:'THE FOOTAGE', t:'The body-cam shows a clean breach and nobody touched. The story dies by lunchtime. Zonal is annoyed you didn\'t ask first — and now everyone has seen exactly how your unit moves.' }); }
      else { applyEffect({ publicTrust:-4, integrity:+3 }); BRF.out.push({ h:'THE FOOTAGE', t:'The footage shows a trader going down as you sprint past. It isn\'t a beating, but it isn\'t nothing. You released it anyway.' }); }
    }
    if(dec.press === 'quiet'){ applyEffect({ publicTrust:-5 }); BRF.out.push({ h:'THE STORY', t:'You say nothing. The story runs for three days and becomes something people "know".' }); }
    if(dec.press === 'trace'){ applyEffect({ publicTrust:-2, intel:+6 }); regFind(['silverline']);
      BRF.out.push({ h:'THE STORY', t:'The "witnesses" all trace back to one PR firm: Silverline Media Ltd, registered at Suite 4B, Zuma Court, Wuse II' + (intelHas('zuma_cluster') ? ' — the same office again.' : '.') }); }
  }
}

function commitBriefing(){
  applyDecisions();
  const b = BRIEFINGS[BRF.mid];
  BRF.queue = b.leads.filter(l=>BRF.sel.includes(l.id));
  BRF.phase = 'result';
  runNextLead();
}
function runNextLead(){
  const l = BRF.queue.shift();
  if(!l){
    const b = BRIEFINGS[BRF.mid];
    if(b.warrant && !BRF.warrantDone && !warrantGranted(b.warrant)){ BRF.phase = 'warrant'; showOverlay('screen-briefing'); renderBriefing(); return; }
    BRF.phase = 'result'; BRF.final = true; showOverlay('screen-briefing'); renderBriefing(); return;
  }
  const back = (h, t)=>{ BRF.out.push({ h:l.name.toUpperCase(), t }); BRF.phase = 'result'; showOverlay('screen-briefing'); renderBriefing(); };
  if(l.call){ runGatekeeper(l, back); return; }
  if(l.game === 'stakeout'){ openStakeout(txt=>{ I().leads[l.id] = 'done'; back(null, txt); }); return; }
  if(l.game === 'undercover'){ openUndercover(txt=>{ I().leads[l.id] = 'done'; back(null, txt); }); return; }
  if(l.tip){ back(null, runTip(l)); return; }
  back(null, applyLead(l));
}
function applyLead(l, partial){
  const d = I();
  d.leads[l.id] = 'done';
  if(l.money) moneyUnlock(l.money);
  if(l.reg) regFind(l.reg);
  if(l.flag && !partial) intelSet(l.flag);
  if(l.flag === 'lead_gatehouse' && !partial){ knowAdd('poolcar','You'); addInvEvidence('inv_gatehouse'); }
  if(l.intel) applyEffect({ intel: partial ? Math.round(l.intel/2) : l.intel });
  return l.res;
}
function runTip(l){
  const d = I(); d.leads[l.id] = 'done';
  if(intelStyle().key === 'inf'){ intelSet('tip_false');
    return `"${TIP_FALSE}" You spend half a day in Uselu. The bungalow is empty and the paint is fresh. The neighbours were told to expect "officers". Somebody wanted you here.`; }
  intelSet('lead_tip'); applyEffect({ intel:+6 });
  return `"${TIP_TRUE}" It matches the tower fix.`;
}
function renderBriefingResults(){
  let h = `<div class="brf-week">${BRIEFINGS[BRF.mid].title}</div><div class="brf-head">THIS WEEK</div>`;
  h += BRF.out.map(o=>`<div class="brf-res"><div class="set-group">${esc(o.h||'')}</div><div>${esc(o.t)}</div></div>`).join('');
  const more = BRF.queue.length > 0 || !BRF.final;
  h += `<div class="brf-foot">${more?`<button class="btn primary" data-b="next">NEXT ▶</button>`:`<button class="btn ghost" data-b="desk">CASE DESK</button><button class="btn primary" data-b="done">TO THE CASE FILES ▶</button>`}</div>`;
  return h;
}
function renderBriefingWarrant(){
  const w = WARRANTS.find(x=>x.id===BRIEFINGS[BRF.mid].warrant), sc = warrantScore(w);
  const opts = w.routed
    ? `<button data-b="warrant" data-route="commander">Through the Commander's office — standard procedure</button>
       <button data-b="warrant" data-route="zonal">Straight to Zonal Command — she won't see it (−6 Agency Standing)</button>
       <button data-b="warrant" data-route="none">No warrant. Go in on exigency — a hostage is inside.</button>`
    : `<button data-b="warrant" data-route="standard">Apply now</button>
       <button data-b="warrant" data-route="none">Not yet — if it comes to it, go in without one</button>`;
  return `<div class="brf-week">${BRIEFINGS[BRF.mid].title}</div><div class="brf-head">THE WARRANT</div>
    <div class="dk-item"><div class="dk-name">${esc(w.name)}</div><div class="dk-meta">${esc(w.court)}</div>
    <div class="dk-integ"><span>BASIS</span><div class="rb"><i style="width:${Math.min(100,sc/w.need*100)}%;background:${sc>=w.need?'#5dd07a':'#d8a64a'}"></i></div><b>${sc}/${w.need}</b></div>
    ${basisList(w)}</div>
    <div class="brf-say">"${w.routed ? "Give it to me and I'll have a magistrate sign it tonight." : "If you think you have enough, file it. If you don't, the clerk will tell the whole of Benin."}"</div>
    <div class="seg col">${opts}</div>`;
}
function warrantResultLine(wid){
  const w = I().warrants[wid] || {}, W = WARRANTS.find(x=>x.id===wid) || {};
  const h = wid === 'w_eko' ? 'THE WARRANT' : 'THE PRODUCTION ORDER';
  if(w.status === 'skipped') return { h, t: wid === 'w_eko' ? "No application. If it comes to it, you'll tell the judge a student's life was at stake. You'll be right." : 'No application. If you pull data at that mast, the defence will ask on whose authority.' };
  if(w.status === 'granted') return { h, t: wid !== 'w_eko' ? 'Signed. Whatever comes off that cabinet, you can put in front of a judge.' : w.route === 'commander' ? 'Signed within the hour. She brought it to you herself, and asked which gate you planned to use.' : "Zonal's magistrate signs it at 22:40. Nobody at Lagos HQ knows it exists." };
  return { h, t:'Refused. Not enough to go on yet. ' + (W.leak || '') + (w.route === 'commander' ? ' And now the application sits on her desk.' : '') };
}
function finishBriefing(){
  const b = BRIEFINGS[BRF.mid], d = I();
  b.leads.forEach(l=>{ if(d.leads[l.id] !== 'done' && !d.leads[l.id]){ d.leads[l.id] = 'dropped'; if(l.dropped) d.dropLog.push({ week:b.week, lead:l.id, text:l.dropped, buried: b.advice.drop === l.id && b.advice.buries }); } });
  d.briefed[BRF.mid] = true;
  saveGame(true);
  if(window.V12 && V12.log) V12.log('briefing', { week:b.week, leads:BRF.sel, dec:BRF.dec });
  showOverlay(null);
  const then = BRF.then; BRF.then = null;
  if(then) then();
}

/* ---------------- gatekeeper calls ---------------- */
function runGatekeeper(l, back){
  const key = l.call, fl = S.game.flags;
  const fk = { gk_pos:'gk_pos', gk_foundation:'gk_found', gk_caretaker:'gk_care' }[key];
  delete fl[fk];
  Object.assign(DIALOGUE, GATEKEEPER_DIALOGUE);
  startDialogue(key, ()=>{
    const v = fl[fk] || 'polite';
    const follow = fk + '_' + v;
    const fin = ()=>{
      let txt;
      if(key === 'gk_pos'){
        if(v === 'badge'){ I().leads[l.id]='done'; moneyUnlock(['n_odogwu']); regFind(['odogwu']); applyEffect({ intel:+4 }); txt = 'Odogwu Ventures is the hub. The attendant saw the badge and went quiet — nothing about who collects the cash.'; }
        else txt = applyLead(l);
      }
      if(key === 'gk_foundation'){
        if(v === 'respect') txt = applyLead(l);
        else if(v === 'badge'){ I().leads[l.id]='done'; regFind(['urf','apex']); applyEffect({ intel:+4 }); txt = 'The secretary refers you to the Foundation\'s lawyers: Apex Corporate Services. That\'s all you get.'; }
        else { I().leads[l.id]='done'; regFind(['urf']); applyEffect({ intel:+6 }); txt = 'The secretary offers you an account number and says the signatory is "away" — comes once a month. You have the Foundation\'s registration, not its people.'; }
      }
      if(key === 'gk_caretaker'){
        if(v === 'threat'){ I().leads[l.id]='done'; I().alert += 1; txt = 'The caretaker hangs up. An hour later the blue-gate house switches its generator off for the first time in weeks.'; }
        else { txt = applyLead(l); if(v === 'listen') intelSet('caretaker_unaware'); }
      }
      back(null, txt);
    };
    if(DIALOGUE[follow]) startDialogue(follow, fin); else fin();
  });
}

/* ---------------- the surveillance van ---------------- */
const SO_EVENTS = [
  { t:'20:10', ico:'🧍', txt:'The night guard takes over. The two guards share a cigarette by the gate.', acts:['photo'] },
  { t:'20:35', ico:'🔥', txt:'A suya seller sets up by the gate. Smoke drifts across your lens.', acts:['photo'] },
  { t:'21:05', ico:'🧍', txt:'A man in a cap carries two Ghana-must-go bags into Zuma Court. He knows the guard by name.', acts:['photo'], rel:'so_courier' },
  { t:'21:30', ico:'🚶', txt:'A young woman locks the Apex glass door and waves at the guard on her way out.', acts:['photo'] },
  { t:'21:50', ico:'🚙', txt:'A black Lexus, Lagos plates. A man in agbada uses the ATM next door and drives off.', acts:['photo','plate'], plate:'LAG 771 XC' },
  { t:'22:15', ico:'🚗', txt:'A Toyota Corolla stops at the gate. Government plates. Nobody gets out. The man in the cap comes back out and passes an envelope through the rear window.', acts:['photo','plate'], plate:'LND-412-KJ', rel:'so_poolcar', relPlate:'so_plate' },
  { t:'22:24', ico:'🚗', txt:'The Corolla pulls away toward the Airport Road.', acts:['follow'] },
  { t:'23:10', ico:'·', txt:'', acts:['wait','back'], empty:true },
];
const SO = { i:0, frames:4, log:[], done:null, used:{} };
function ensureSO(){
  if(document.getElementById('screen-so')) return;
  const ov = document.createElement('div'); ov.className = 'overlay'; ov.id = 'screen-so';
  ov.innerHTML = `<div class="overlay-bg"></div><div class="settings-frame so-frame">
    <div class="so-top"><span class="so-rec">● REC</span><span id="so-clock">20:00</span><span id="so-frames"></span></div>
    <div class="so-scene"><div class="so-sky"></div><div class="so-bld"><div class="so-sign">ZUMA COURT</div>${'<i></i>'.repeat(12)}</div><div class="so-gate"></div><div class="so-lamp"></div><div class="so-subj" id="so-subj"></div><div class="so-vf"></div></div>
    <div class="so-txt" id="so-txt"></div><div class="so-acts" id="so-acts"></div><div class="so-log" id="so-log"></div></div>`;
  document.getElementById('game-root').appendChild(ov);
  ov.addEventListener('click', e=>{ const b = e.target.closest('[data-so]'); if(b) soAct(b.dataset.so); });
}
function openStakeout(done){
  ensureSO(); Object.assign(SO, { i:0, frames:4, log:[], done, used:{}, end:null });
  showOverlay('screen-so'); renderSO();
}
function soEvent(){ const e = SO_EVENTS[SO.i]; if(e && e.empty) e.txt = intelHas('lead_e') ? 'The ledger says the Engineer reaches a pickup by 23:00. Nothing. The street is empty.' : 'Nothing. The street is empty. The suya seller packs up.'; return e; }
function renderSO(){
  const e = soEvent();
  document.getElementById('so-frames').textContent = `FRAMES ${SO.frames}`;
  document.getElementById('so-log').innerHTML = SO.log.map(x=>`<div>${esc(x)}</div>`).join('');
  if(SO.end || !e){
    document.getElementById('so-clock').textContent = '23:30';
    document.getElementById('so-subj').textContent = '';
    document.getElementById('so-txt').textContent = SO.end || 'The night is over.';
    document.getElementById('so-acts').innerHTML = `<button class="mini-btn" data-so="finish">PACK UP THE VAN ▶</button>`;
    return;
  }
  document.getElementById('so-clock').textContent = e.t;
  const subj = document.getElementById('so-subj'); subj.textContent = e.ico; subj.classList.remove('in'); void subj.offsetWidth; subj.classList.add('in');
  document.getElementById('so-txt').textContent = e.txt;
  const L = { photo:'📷 PHOTOGRAPH', plate:'✎ LOG THE PLATE', follow:'⟶ FOLLOW IT', wait:'⏳ WAIT ANOTHER HOUR', back:'🔦 CHECK THE BACK LANE' };
  document.getElementById('so-acts').innerHTML = e.acts.map(a=>`<button class="mini-btn ${SO.used[SO.i+a]?'on':''}" data-so="${a}" ${SO.used[SO.i+a] || (a==='photo' && SO.frames<=0) ? 'disabled' : ''}>${L[a]}</button>`).join('') + (e.empty ? '' : `<button class="mini-btn" data-so="next">TIME PASSES ▶</button>`);
}
function soAct(a){
  const e = soEvent(), d = I();
  if(a === 'finish'){ finishSO(); return; }
  if(a === 'next'){ SO.i++; renderSO(); return; }
  SO.used[SO.i + a] = true;
  if(a === 'photo'){ SO.frames--; SO.log.push(`📷 ${e.t} — photographed`); if(e.rel) intelSet(e.rel); (typeof sfxBlip==='function' && sfxBlip()); }
  if(a === 'plate'){ SO.log.push(`✎ ${e.t} — plate ${e.plate}`);
    if(e.relPlate){ intelSet(e.relPlate);
      if(intelHas('lead_gatehouse')){ intelSet('so_plate_match'); knowAdd('poolcar','You'); applyEffect({ intel:+10 }); toast('PLATE MATCH', 'LND-412-KJ — the same car as the Lekki gatehouse log', 3200); SO.log.push('⚑ MATCH: the Lekki gatehouse car'); }
    } }
  if(a === 'follow'){ intelSet('so_followed'); SO.end = 'You stay three cars back to the Airport Road. At the Lugbe checkpoint the officers lift the barrier for the Corolla without a word — then stop you. By the time you are waved through, it is gone.'; }
  if(a === 'wait'){ SO.end = 'You wait another hour. Nothing happens. Sometimes nothing happens.'; }
  if(a === 'back'){ intelSet('so_back'); SO.end = 'Behind Zuma Court: a motorbike with a toolbox strapped on, engine still warm. Someone came in the back way. You were watching the wrong door.'; }
  renderSO();
}
function finishSO(){
  const got = ['so_courier','so_poolcar','so_plate','so_plate_match','so_back','so_followed'].filter(intelHas);
  const parts = [];
  if(intelHas('so_courier')) parts.push('a courier carrying cash bags into Zuma Court');
  if(intelHas('so_poolcar')) parts.push('an envelope passed into a government car');
  if(intelHas('so_plate')) parts.push('its plate, LND-412-KJ' + (intelHas('so_plate_match') ? ' — the car from the Lekki gatehouse log' : ''));
  if(intelHas('so_back')) parts.push('a back entrance nobody mentioned');
  const txt = parts.length ? 'From the van you logged ' + parts.join(', ') + '.' : 'A long night, a cold van, and nothing you can use. That happens too.';
  I().so = { got };
  if(intelHas('so_poolcar')) addInvEvidence('inv_stakeout');
  const cb = SO.done; SO.done = null; if(cb) cb(txt);
}

/* ---------------- undercover at Apex ---------------- */
const UC_STEPS = [
  { who:'RECEPTIONIST', q:'Good morning. Your name, sir?', opts:[['Chidi Anyanwu.',0],['Kelechi— sorry. Chidi. Chidi Okafor.',35],['Why do you need my name?',15]] },
  { who:'RECEPTIONIST', q:'And who referred you to us?', opts:[['Alhaji Sanni, at Bluewater.',0],['A friend at NACECA.',75],['I found you on Google.',20]] },
  { probe:true, txt:'She turns to photocopy your ID. The visitor book lies open on the desk.', act:'Read the visitor book', sus:15, got:'uc_book', res:'Two lines repeat every month: "C.A. — 1st, 10:00" and "Bluewater — Kunle".' },
  { who:'BARR. TAMUNO BRIGGS', q:'So. What will this company do?', opts:[['Generator parts. I import through Onitsha.',0],['Logistics. Haulage.',20],['Consulting, mostly.',25]] },
  { who:'BARR. TAMUNO BRIGGS', q:'Ten days is fast. What were you told it costs?', opts:[['₦450,000. Ten days.',0],['Whatever it costs.',15],['₦200,000.',10]] },
  { probe:true, txt:'Briggs mentions they can provide "a director, if you\'d rather not be on paper".', act:'Ask if it works like it does for C.A. Consulting', sus:30, got:'uc_nominee', res:'He smiles. "Grace handles our nominees. Our C.A. client has never once set foot in this office. That is the service."' },
  { who:'BARR. TAMUNO BRIGGS', q:'Leave a number. We will call you when the name is reserved.', opts:[['Give the cover SIM.',0],['Give your own number.',50],["Say you'll call back.",10]] },
  { probe:true, txt:'On the way out you pass the out-tray. A stack of invoices, the top one face up.', act:'Pocket the top invoice', sus:25, got:'uc_invoice', res:'Invoice: C.A. Consulting Services Ltd → Ugbowo Relief Foundation. "Retainer, monthly." ₦9.2M.' },
];
const UC = { i:-1, sus:0, got:[], log:[], done:null, blown:false };
function ensureUC(){
  if(document.getElementById('screen-uc')) return;
  const ov = document.createElement('div'); ov.className = 'overlay'; ov.id = 'screen-uc';
  ov.innerHTML = `<div class="overlay-bg"></div><div class="settings-frame uc-frame"><div class="uc-meter"><span>SUSPICION</span><div class="rb"><i id="uc-fill"></i></div></div><div id="uc-body"></div></div>`;
  document.getElementById('game-root').appendChild(ov);
  ov.addEventListener('click', e=>{ const b = e.target.closest('[data-uc]'); if(b) ucAct(b.dataset.uc, b.dataset); });
}
function openUndercover(done){
  ensureUC(); Object.assign(UC, { i:-1, sus: heatNow() >= 60 ? 15 : 0, got:[], log:[], done, blown:false });
  if(UC.sus) UC.log.push('Your face has been on the news. The receptionist looks twice.');
  knowAdd('cover','You');
  showOverlay('screen-uc'); renderUC();
}
function renderUC(){
  const body = document.getElementById('uc-body');
  document.getElementById('uc-fill').style.width = Math.min(100, UC.sus) + '%';
  document.getElementById('uc-fill').style.background = UC.sus >= 70 ? '#e84a5c' : UC.sus >= 40 ? '#d8a64a' : '#5dd07a';
  if(UC.i < 0){
    body.innerHTML = `<div class="brf-head">YOUR COVER</div>
      <div class="uc-cover"><div><span>NAME</span>Chidi Anyanwu</div><div><span>BUSINESS</span>Generator-parts importer, Onitsha</div>
      <div><span>WANTS</span>A company registered in ten days</div><div><span>REFERRED BY</span>Alhaji Sanni at Bluewater</div>
      <div><span>BUDGET</span>₦450,000</div><div><span>PHONE</span>The cover SIM. Never your own.</div></div>
      <div class="set-note">Learn it. Once you're through that door, you can't look at this card again.</div>
      <div class="brf-foot"><button class="btn primary" data-uc="go">KNOCK ON SUITE 4B ▶</button></div>`;
    return;
  }
  const st = UC_STEPS[UC.i];
  const log = UC.log.map(x=>`<div class="uc-log">${esc(x)}</div>`).join('');
  if(UC.blown || !st){
    const txt = ucSummary();
    body.innerHTML = log + `<div class="brf-res"><div>${esc(txt)}</div></div><div class="brf-foot"><button class="btn primary" data-uc="end">LEAVE ZUMA COURT ▶</button></div>`;
    return;
  }
  if(st.probe){
    body.innerHTML = log + `<div class="uc-txt">${esc(st.txt)}</div><div class="seg col"><button data-uc="probe">${esc(st.act)}</button><button data-uc="skip">Leave it. Stay in character.</button></div>`;
    return;
  }
  body.innerHTML = log + `<div class="uc-who">${esc(st.who)}</div><div class="uc-q">"${esc(st.q)}"</div>
    <div class="seg col">${st.opts.map((o,k)=>`<button data-uc="ans" data-k="${k}">${esc(o[0])}</button>`).join('')}</div>`;
}
function ucAct(a, ds){
  const st = UC_STEPS[UC.i];
  if(a === 'go'){ UC.i = 0; renderUC(); return; }
  if(a === 'end'){ const cb = UC.done; UC.done = null; if(cb) cb(ucSummary()); return; }
  if(a === 'ans'){ const o = st.opts[+ds.k]; UC.sus += o[1]; UC.log.push(`${st.who}: "${st.q}" — You: "${o[0]}"${o[1]>=30?' (a pause. Too long.)':''}`); if(o[1]) (typeof sfxFail==='function' && sfxFail()); }
  if(a === 'probe'){ UC.sus += st.sus; UC.got.push(st.got); UC.log.push('✔ ' + st.res); (typeof sfxBlip==='function' && sfxBlip()); }
  if(a === 'skip'){ UC.log.push('You let it go.'); }
  if(UC.sus >= 100){ UC.blown = true; UC.log.push('Briggs closes the folder. "I think we\'re finished, Mr. — whatever your name is."'); }
  UC.i++;
  renderUC();
}
function ucSummary(){
  const d = I();
  d.uc = { got:UC.got.slice(), blown:UC.blown, sus:UC.sus };
  if(UC.blown){ d.alert += 1; knowAdd('cover','Apex Corporate Services'); intelSet('apex_blown');
    return 'Your cover is blown. They are polite, too polite. By Monday Suite 4B has new locks and a "To Let" sign — and somebody has made a phone call about you.' + (UC.got.length ? ` You still walked out with ${UC.got.length} thing${UC.got.length>1?'s':''} you can use.` : ''); }
  if(UC.got.includes('uc_invoice')){ applyEffect({ intel:+12 }); addInvEvidence('inv_invoice'); }
  if(UC.got.includes('uc_book')) applyEffect({ intel:+6 });
  if(UC.got.includes('uc_nominee')) applyEffect({ intel:+6 });
  if(typeof unlock==='function' && UC.sus < 40) unlock('cover_held');
  return UC.got.length ? `Your cover held. You walked out with: ${UC.got.map(g=>({ uc_book:'the visitor book pattern', uc_nominee:"Briggs's admission about C.A.'s nominee", uc_invoice:'a C.A. Consulting invoice to the Foundation' }[g])).join('; ')}.` : 'Your cover held, and you took nothing. Clean — and empty.';
}
