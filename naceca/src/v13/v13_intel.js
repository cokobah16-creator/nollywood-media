/* =========================================================================
   NACECA · v13 intel — the investigation layer's model
   One record per exhibit: source, confidence tier, how it was obtained, a
   custody trail, s.84 status and who knows about it. Warrants, integrity,
   the trial and the case review all read from this one structure.
   Sits on v12: inked theories on the operations table count as warrant
   grounds, v12's evidence quality ('weak') counts against integrity, and
   radio bulletins play through v12's radio strip. State: S.game.intel.
   ========================================================================= */

const MISSION_ORDER = ['m0','m1','m2','m3','m3n','m4','m5','m6','m7','m8'];
const BRIEF_BEFORE = ['m4','m5','m6','m7','m8'];      // a weekly briefing comes before each of these
const midx = id => MISSION_ORDER.indexOf(id);

function I(){
  if(!S.game.intel || typeof S.game.intel !== 'object') S.game.intel = {};
  const d = S.game.intel;
  const def = { items:{}, flagged:{}, money:{ open:false, req:0, unlocked:{}, traced:{} }, reg:{ found:{}, ctc:{} },
    st:{}, warrants:{}, leads:{}, briefed:{}, dropLog:[], flags:{}, known:{}, alert:0, opLog:{}, certUsed:{},
    started:{}, so:null, uc:null, radio:{}, court:null };
  for(const k in def) if(d[k] === undefined) d[k] = def[k];
  return d;
}
function lastDone(){ const done = (S.game.completedMissions||[]).filter(x=>midx(x)>=0).map(midx); return done.length ? MISSION_ORDER[Math.max(...done)] : 'm1'; }

/* ---------- labels ---------- */
const INTEL_NAMES = {
  phishing_template:'Phishing template', laptop:'Encrypted laptop', cash:'₦12.4M cash bundles', safe_drives:'Encrypted hard drives',
  broken_seal:'Mismatched container seal', ransom_ledger:'Ransom route ledger', concealed_arms:'Concealed arms', musa_statement:"Musa's statement",
  shrine_pots:'SIMs in libation pots', shrine_cache:'Jerry-cans of ransom cash', e_shrine_ledger:'Forest route ledger',
  asaba_sims:'24 pre-activated SIMs', asaba_runner:'Ifeanyi, in custody', asaba_hostage:'Tobi Onuoha, recovered',
  tower_fibre:'Severed fibre backhaul', tower_cdr:'Ugbowo call records', tower_fix:'Handset fix — Ekosodin',
  fin_drive:"Osas's flash drive", fin_courier_phone:"Courier's phone", fin_recording:'Recorded ransom call', bodycam_eko:'Body-cam — Akintola Close',
  co_madam:'"Tell Madam it\'s clean" phone', kc_sims:"KC's SIM batch", obi_notebook:"Obi's notebook — initials and amounts", osas_voicemail:"Osas's voicemail",
  lead_gatehouse:'Gatehouse log (lead)', lead_caretaker:"Caretaker's account (lead)", lead_pattern:'Ekosodin call pattern (lead)', lead_tip:"Tunde's tip (lead)",
  zuma_cluster:'Six entities, one office', so_plate:'Plate logged at Zuma Court', so_poolcar:'Photo: envelope into the agency car', so_courier:'Photo: courier with cash bags',
  n_charity:'Money trail: Ugbowo Relief Foundation', n_ca:'Money trail: C.A. Consulting', reg_ca:'CAC record: C.A. Consulting',
  'theory:t_money':'Inked theory — the ransom money runs through Obi', 'theory:t_sims':"Inked theory — KC's SIMs reach the mansion",
  'theory:t_route':'Inked theory — one route: Bypass → Shrine → Asaba', 'theory:t_voice':'Inked theory — Madam is the Voice',
};
Object.assign(INTEL_NAMES, INV_NAMES);
function clueById(id){ for(const p of PHONES) for(const c of p.items) if(c.id === id) return Object.assign({ phone:p.name }, c); return null; }
function intelLabel(id){
  if(INTEL_NAMES[id]) return INTEL_NAMES[id];
  const c = clueById(id); if(c) return `${c.phone} — ${c.sec.toLowerCase()} (${c.from})`;
  if(MONEY_NODES[id]) return 'Money trail: ' + MONEY_NODES[id].name;
  if(id && id.startsWith('reg_') && REGISTRY[id.slice(4)]) return 'CAC record: ' + REGISTRY[id.slice(4)].name;
  const ev = (S.game.evidence||[]).find(e=>e.id===id); if(ev) return ev.name;
  return id;
}

/* ---------- possession: the one question every system asks ---------- */
function intelHas(id){
  if(!id) return false;
  const d = I();
  if(/^m\dn?$/.test(id)) return (S.game.completedMissions||[]).includes(id);
  if(id.startsWith('theory:')) return !!(window.V12 && V12.theory && V12.theory(id.slice(7)));
  if(id.startsWith('lead:')) return d.leads[id.slice(5)] === 'done';
  if(id.startsWith('reg_')) return !!d.reg.found[id.slice(4)];
  if(MONEY_NODES[id]) return !!d.money.traced[id];
  if(d.flags[id]) return true;
  if(clueById(id)) return d.flagged[id] === true;
  if(id === 'bodycam_eko') return !!(S.game.flags && S.game.flags.fin_bodycam);
  return (S.game.evidence || []).some(e => e.id === id);
}
function intelSet(flag, v=true){ I().flags[flag] = v; }
function heatNow(){ return (window.V12 && V12.heat) ? V12.heat() : 0; }

/* ---------- who knows what ---------- */
const FACTS = {
  eko_house:'The house in Ekosodin', engineer:"The Engineer's calls to CONTROL", zuma:'Suite 4B, Zuma Court',
  ledger:'The ransom ledger', poolcar:'The pool car at Lekki', cover:'Your Apex cover name',
};
function knowAdd(fact, who){ const k = I().known; k[fact] = k[fact] || ['You']; if(!k[fact].includes(who)) k[fact].push(who); }

/* ---------- evidence records ---------- */
function intelOnEvidence(ev){
  const meta = ev && INTEL_ITEMS[ev.id]; if(!meta) return;
  const d = I();
  if(!d.items[ev.id]){
    const n = Object.keys(d.items).length + 1;
    const region = (MISSIONS.find(m=>m.id===meta.m)||{}).region || '';
    // a finding logged between operations belongs to the next one, so the next briefing can still certify it
    const invM = MISSION_ORDER[midx(lastDone()) + 1] || 'm8';
    d.items[ev.id] = { id:ev.id, m:meta.inv ? invM : meta.m, cert:false, custody:[
      { t: meta.inv ? 'Logged at HQ by Agt. Kelechi' : 'Logged by Agt. Kelechi', at: meta.inv ? '' : region },
      { t:`Sealed and tagged — exhibit NAC/EX/0034/${String(n).padStart(2,'0')}` } ] };
    if(midx(meta.m) >= 3 && !meta.inv) d.items[ev.id].custody.push({ t:'Witnessed: Sgt. Uche' });
  }
}
/* findings from the desk and the weekly briefings become exhibits you can put to her */
function addInvEvidence(id){
  if(!INTEL_ITEMS[id] || intelHas(id)) return false;
  const ev = { id, name:INV_NAMES[id] || id, xp:0 };
  S.game.evidence = S.game.evidence || []; S.game.evidence.push(ev);
  intelOnEvidence(ev);
  toast('ADDED TO THE CASE', ev.name, 2200);
  return true;
}
function addPseudoItem(id, m, kind, src){
  const d = I();
  if(!INTEL_ITEMS[id]) INTEL_ITEMS[id] = { m, kind, tier:'confirmed', e:true, src };
  if(!d.items[id]) d.items[id] = { id, m, cert:false, custody:[{ t:"Recorded on Agt. Kelechi's body-camera" }, { t:'Uploaded to the evidence server, hash logged' }] };
}

/* what a defence lawyer would say about it */
function intelItemFlaws(id){
  const meta = INTEL_ITEMS[id] || {}, d = I(), it = d.items[id] || {};
  const mc = S.game.moralChoices || {}, fl = S.game.flags || {};
  const out = [];
  if(meta.m === 'm3' && !meta.inv && mc.arrest === 'bribe') out.push({ k:'tainted', w:60, txt:'Recovered in an operation where the officer accepted a bribe' });
  if(meta.m === 'm3' && !meta.inv && !warrantGranted('w_lekki')) out.push({ k:'warrantless', w:20, txt:'Taken without a search warrant' });
  if(meta.m === 'm5' && !meta.inv && fl.shrine_access === 'granted_force') out.push({ k:'warrantless', w:20, txt:'Entry forced on sacred ground, no warrant' });
  if((id === 'tower_cdr' || id === 'tower_fix') && !warrantGranted('w_cdr')) out.push({ k:'noorder', w:20, txt:'Pulled from the cabinet without a production order' });
  if(id === 'inv_engineer' && !warrantGranted('w_cdr')) out.push({ k:'noorder', w:20, txt:'Call records pulled off the books, no production order' });
  if(id === 'musa_statement' && mc.checkpoint === 'flip_driver') out.push({ k:'inducement', w:10, txt:'Given in exchange for leniency' });
  if(id === 'ransom_ledger' && d.custodyAsk === 'gave') out.push({ k:'custody', w:20, txt:'Signed out of the exhibit room for three days. Page 14 is missing' });
  if(window.V12 && V12.evQ && /weak|contested/.test(V12.evQ(id))) out.push({ k:'contested', w:25, txt:'Contested — the field check went wrong' });
  if(meta.e && !it.cert) out.push({ k:'s84', w:30, txt:'No certificate under s.84, Evidence Act 2011' });
  return out;
}
function intelIntegrity(id){ return Math.max(0, 100 - intelItemFlaws(id).reduce((a,f)=>a+f.w, 0)); }

/* s.84 certificates: signed while the extraction is fresh — until the operation after the next weekly briefing — two per operation */
const CERT_SLOTS = 2;
function certWindowOpen(id){
  const it = I().items[id]; if(!it) return false;
  const closeAt = BRIEF_BEFORE.find(b => midx(b) > midx(it.m));
  if(!closeAt) return true;                                           // the finale's exhibits: until the trial
  const cur = S.game.currentMission || 'm1';
  return midx(cur) < midx(closeAt) || (cur === closeAt && !I().started[closeAt]);
}
function certSlotsLeft(m){ return CERT_SLOTS - (I().certUsed[m] || 0); }
function certify(id){
  const d = I(), it = d.items[id], meta = INTEL_ITEMS[id];
  if(!it || !meta || !meta.e || it.cert) return false;
  if(!certWindowOpen(id)){ toast('TOO LATE','The extraction was never hashed. No examiner will sign it now.'); return false; }
  if(certSlotsLeft(it.m) <= 0){ toast('NO FORENSIC SLOTS','Digital Forensics can certify two items per operation.'); return false; }
  it.cert = true; d.certUsed[it.m] = (d.certUsed[it.m]||0) + 1;
  it.custody.push({ t:'s.84 certificate signed — NACECA Digital Forensics' });
  if(typeof sfxComplete === 'function') sfxComplete();
  return true;
}

/* ---------- playstyle: the Voice studies you ---------- */
function intelStyle(){
  const d = I(), mc = S.game.moralChoices || {}, fl = S.game.flags || {}, plan = S.game._plan || {};
  const heat = heatNow();
  const sc = {
    aggr: (S.game.forceUsed||0)*2 + (mc.entry==='loud'?2:0) + (mc.shrine==='force'?2:0) + (mc.choice==='force'?2:0) + Math.max(0, Math.round((heat-40)/15)) + Object.values(d.opLog).reduce((a,o)=>a+(o.bumps||0),0),
    inf:  (mc.choice==='flip'?2:0) + (mc.checkpoint==='flip_driver'?2:0) + (mc.arrest==='informant'?3:0) + (d.leads.tunde==='done'?1:0) + (d.leads.pos==='done'?1:0) + (S.game._tipM3?1:0) + (S.game._tipM7?1:0),
    proc: Object.values(d.warrants).filter(w=>w.status==='granted').length*2 + Object.values(d.items).filter(i=>i.cert).length + (mc.entry==='knock'?1:0) + (d.custodyAsk==='kept'?2:0) + (plan.known && plan.known.warrant ? 1 : 0),
    media:(d.press==='bodycam'?3:0) + (d.order==='leak'?3:0) + (d.press==='trace'?1:0),
  };
  let best = 'proc', v = -1;
  for(const k of ['aggr','inf','media','proc']) if(sc[k] > v){ v = sc[k]; best = k; }
  return { key:best, scores:sc };
}
const STYLE_NAME = { aggr:'The Front Door', inf:'The Handler', proc:'The Paper Trail', media:'The Camera' };

/* ---------- warrants ---------- */
function warrantGranted(id){ const w = I().warrants[id]; return !!(w && w.status === 'granted'); }
function basisWeight(id){
  if(!intelHas(id)) return 0;
  if(id.startsWith('theory:')) return 4;                       // an inked chain took three right links
  const meta = INTEL_ITEMS[id];
  if(meta){ if(intelItemFlaws(id).some(f=>f.k==='tainted')) return 0; return TIER_WEIGHT[meta.tier] || 0; }
  return 2;                                                     // phone clues and leads count as probable
}
function warrantScore(w){
  const tier = (window.V12 && V12.intelTier) ? V12.intelTier() : 0;
  return w.basis.reduce((a,b)=>a + basisWeight(b), 0) + (w.id==='w_eko' && intelHas('lead_tip') ? 2 : 0) + (tier >= 1 ? 2 : 0);
}
function warrantClosed(w){
  if(w.closeOnPlan) return (S.game.completedMissions||[]).includes(w.before) || (S.game.currentMission === w.before && !!S.game._plan);
  return !!I().started[w.before];
}
function warrantOpen(w){ return !warrantClosed(w) && !warrantGranted(w.id); }
function applyWarrant(id, route){
  const w = WARRANTS.find(x=>x.id===id); if(!w) return null;
  const d = I(), prev = d.warrants[id];
  if(warrantGranted(id) || warrantClosed(w)) return null;
  const score = warrantScore(w), ok = score >= w.need;
  const rec = { status: ok ? 'granted' : 'refused', route: route || 'standard', score, at: S.game.currentMission || 'm1', tries: (prev && prev.tries || 0) + 1 };
  d.warrants[id] = rec;
  if(route === 'commander'){ knowAdd('eko_house', 'Cdr. Adaeze'); d.alert += 2; }
  if(route === 'zonal'){ knowAdd('eko_house', 'Zonal Command'); applyEffect({ agencyFavour:-6 }); }
  if(ok){ applyEffect({ integrity:+2 }); toast('WARRANT GRANTED', w.court + ' signed it', 2400); }
  else {
    if(id === 'w_lekki') S.game.flags.obi_tipped = true;
    if(id === 'w_cdr')   S.game.flags.cdr_tipped = true;
    if(id === 'w_eko')   d.alert += 1;
    toast('WARRANT REFUSED', 'Not enough to go on. ' + w.leak, 3200);
  }
  if(window.V12 && V12.log) V12.log('warrant', { id, ok, route, score });
  return rec;
}

/* ---------- phones ---------- */
function phoneUnlocked(p){
  if(!intelHas(p.needs)) return false;
  if(p.id === 'musa') return I().leads.musa === 'done';
  if(p.id === 'burner') return I().leads.burner === 'done';
  return true;
}
function flagClue(cid, on){
  const d = I(), c = clueById(cid); if(!c) return;
  d.flagged[cid] = !!on;
  if(on && c.rel && c.money) moneyUnlock([c.money], true);
}

/* ---------- money ---------- */
function moneyUnlock(ids, announce){
  const m = I().money;
  ids.forEach(id=>{
    if(!MONEY_NODES[id] || m.unlocked[id]) return;
    m.unlocked[id] = true;
    if(!m.open){ m.open = true; m.req += MONEY_START_REQUESTS; }
    if(announce) toast('MONEY TRAIL', MONEY_NODES[id].name + ' — follow it in the Case Desk', 2200);
  });
}
function moneyTrace(id){
  const m = I().money, n = MONEY_NODES[id];
  if(!n || !m.unlocked[id] || m.traced[id]) return false;
  if(m.req <= 0){ toast('NO NFIU REQUESTS LEFT', "More come with next week's briefing"); if(typeof sfxFail==='function') sfxFail(); return false; }
  m.req--; m.traced[id] = true;
  n.next.forEach(x=>{ m.unlocked[x] = true; });
  if(n.reg) regFind([n.reg]);
  if(n.key){ applyEffect({ intel:+12 }); toast('C.A. CONSULTING', 'A retainer on the first of every month — since March 2019', 2800); }
  checkInvEvidence();
  return true;
}
function moneyTotal(){ const m = I().money; return Object.keys(m.traced).reduce((a,k)=>a + (MONEY_NODES[k].amt||0), 0); }
function moneyGrand(){ return Object.values(MONEY_NODES).reduce((a,n)=>a+(n.amt||0), 0); }
function naira(v){
  if(v >= 1e9) return '₦' + (v/1e9).toFixed(2).replace(/\.?0+$/,'') + 'bn';
  if(v >= 1e6) return '₦' + Math.round(v/1e6) + 'M';
  return '₦' + v.toLocaleString('en-NG');
}

/* ---------- registry ---------- */
function regFind(keys){ const r = I().reg; keys.forEach(k=>{ if(REGISTRY[k]) r.found[k] = true; }); checkInvEvidence(); }
function regSearch(q){
  q = (q||'').trim().toLowerCase(); if(q.length < 3) return [];
  const r = I().reg;
  const hits = Object.keys(REGISTRY).filter(k=>{
    const e = REGISTRY[k]; if(e.hidden && !r.found[k]) return false;
    return (e.name + ' ' + e.no + ' ' + e.people.join(' ')).toLowerCase().includes(q);
  });
  regFind(hits);
  return hits;
}
function regAtAddress(addr){
  const r = I().reg;
  const hits = Object.keys(REGISTRY).filter(k=>REGISTRY[k].addr === addr && (!REGISTRY[k].hidden || r.found[k]));
  regFind(hits);
  if(addr === ZUMA && hits.length >= 4 && !intelHas('zuma_cluster')){
    intelSet('zuma_cluster'); knowAdd('zuma', 'You');
    applyEffect({ intel:+10 }); if(typeof unlock==='function') unlock('one_office');
    toast(`${hits.length} ENTITIES · ONE OFFICE`, 'Different owners on paper. Same desk in Wuse II.', 3000);
  }
  return hits;
}
/* C.A. becomes an exhibit once you hold both halves: the company and the money */
function checkInvEvidence(){
  if(intelHas('n_ca') && intelHas('reg_ca')) addInvEvidence('inv_ca');
}

/* ---------- statements ---------- */
function stAvailable(st){
  if(st.id === 'st_tunde') return I().leads.tunde === 'done';
  if(st.id === 'st_musa')  return I().leads.musa === 'done';
  if(st.id === 'st_tobi')  return I().leads.tobi === 'done';
  return intelHas(st.needs);
}
function stExpected(c){ if(c.truth === 'unverifiable') return 'unverified'; return intelHas(c.proof) ? c.truth : 'unverified'; }
function stJudge(stId, cid, v){
  const d = I(), st = STATEMENTS.find(s=>s.id===stId), c = st && st.claims.find(x=>x.id===cid); if(!c) return null;
  d.st[stId] = d.st[stId] || {};
  const first = !d.st[stId][cid];
  d.st[stId][cid] = v;
  const exp = stExpected(c), ok = v === exp;
  if(ok && first) applyEffect({ intel:+4 });
  let msg;
  if(ok) msg = exp === 'unverified' ? 'Fair. Nothing in hand settles this yet — come back when it does.' : c.why;
  else if(exp === 'unverified') msg = "You can't establish that yet. What exhibit would you put next to it?";
  else if(v === 'contradicted' && exp === 'mistaken') msg = 'The evidence disagrees with him — but would he know that? Look at where he got it.';
  else if(v === 'mistaken' && exp === 'contradicted') msg = 'This is not an honest slip. He was in a position to know.';
  else if(v === 'unverified') msg = 'You already hold something that settles this.';
  else msg = 'Read it against your exhibits again.';
  return { ok, msg };
}

/* ---------- mission hooks ---------- */
function intelOnMissionStart(id){
  const d = I();
  d.started[id] = true;
  WARRANTS.forEach(w=>{ if(!w.closeOnPlan && w.before === id && !warrantGranted(w.id)) d.warrants[w.id] = Object.assign(d.warrants[w.id] || {}, { status:'missed', at:id, refused: !!(d.warrants[w.id] && d.warrants[w.id].status==='refused') }); });
  if(id === 'm8'){
    const st = intelStyle();
    d.styleAtFinale = st.key;
    if(d.alert >= 2 || st.key === 'aggr') S.game._finWarned = true;   // she knew you were coming — or how you'd come
  }
  if(id !== 'm0' && id !== 'm1' && id !== 'm3n') setTimeout(()=>radioPlay(id), 9000);
}
function intelOnMissionEnd(mid){
  const d = I(), o = S.game._opStart || {};
  d.opLog[mid] = { force: Math.max(0, (S.game.forceUsed||0) - (o.force||0)), bumps: S.game._opBumps || 0 };
  Object.values(d.items).forEach(it=>{
    if(it.m === mid && !it.custody.some(c=>/exhibit room/.test(c.t))) it.custody.push({ t:'Booked into the HQ exhibit room' });
  });
  if(mid === 'm3'){ const w = d.warrants.w_lekki; if(!warrantGranted('w_lekki')) d.warrants.w_lekki = Object.assign(w || {}, { status:'missed', at:'m3', refused: !!(w && w.status==='refused') }); }
  if(mid === 'm8' && S.game.flags && S.game.flags.fin_bodycam) addPseudoItem('bodycam_eko', 'm8', 'VIDEO', "Agt. Kelechi's body-camera, the yard on Akintola Close");
}

/* ---------- the finale: what the investigation adds to v12's accusation ---------- */
function intelStrongExtras(){
  const out = {};
  if(intelHas('inv_ca') && intelHas('reg_ca')) out.inv_ca = 'C.A. Consulting was incorporated the month she took command, and paid on the first, every month.';
  if(intelHas('inv_gatehouse') && intelHas('so_plate_match')) out.inv_gatehouse = 'Her motor-pool car: at Lekki before the raid, and at the Zuma Court cash handover.';
  if(intelHas('inv_stakeout') && intelHas('so_plate_match')) out.inv_stakeout = 'The envelope went into LND-412-KJ — the car signed out to her office.';
  return out;
}
function intelRevealExtras(){
  const d = I(), st = d.styleAtFinale || intelStyle().key;
  const before = [{ speaker:'COMMANDER ADAEZE', mood:'angry',
    text:"Zonal gives this unit one Hilux and a fuel card that bounces. The syndicates pay their boys every Friday. Sources cost money, Kelechi. I found the money." }];
  const STYLE_LINE = {
    aggr: 'You always come in the front. Loud. So tonight the men were at the front.',
    inf: d.flags.tip_false ? 'Your informants are my informants. Who do you think gave Tunde that bungalow in Uselu?' : 'Every source you flipped, I had flipped first.',
    proc: (d.warrants.w_eko && d.warrants.w_eko.route === 'commander') ? 'Every warrant you filed crossed my desk. You are very easy to read on paper.' : 'You did everything by the book. I wrote half of that book.',
    media: 'You like cameras. So I gave the cameras something to say.',
  };
  const after = [{ speaker:'COMMANDER ADAEZE', mood:'evasive', text: STYLE_LINE[st] }];
  if(d.order === 'comply') after.push({ speaker:'COMMANDER ADAEZE', mood:'evasive', text:'You left the Engineer alone when I asked you to. You have no idea how much I wanted you to say no.' });
  if(d.order === 'confront') after.push({ speaker:'COMMANDER ADAEZE', mood:'evasive', text:'You came into my office and asked me to my face. I respected that. Then I changed every phone that night.' });
  return { before, after };
}

/* ---------- radio: news bulletins through v12's radio strip ---------- */
function radioLines(mid){
  const d = I(), mc = S.game.moralChoices || {}, fl = S.game.flags || {};
  const L = [];
  const last = (S.game.headlines || []).slice(-1)[0];
  if(last && last.head) L.push(`Top story: ${last.head}.`);
  if(mid === 'm7' && d.press === 'bodycam') L.push(d.pressClean ? 'NACECA has released body-camera footage from Asaba. It shows no assault. The station that ran the story has gone quiet.' : 'NACECA released its own Asaba footage. It shows an officer knocking a trader down. The agency says it will "review".');
  if(mid === 'm7' && d.press === 'quiet') L.push('Still no comment from NACECA on the Asaba assault claims. Our callers are not impressed.');
  if(mid === 'm7' && d.press === 'trace') L.push('The Asaba "assault" story has been traced to a PR firm. The firm is not answering calls.');
  if(d.order === 'leak' && midx(mid) >= midx('m6')) L.push('Exclusive: a man registered as a NACECA informant is linked to the Edo kidnap ring. The agency calls the report "reckless".');
  if(fl.obi_tipped && mid === 'm4') L.push('Chief Obi\'s lawyers say he was "informed" of the Lekki investigation days before the raid. A court clerk has been suspended.');
  RADIO_RUMOURS.forEach(r=>{ if(L.length < 2 && intelHas(r.needs) && !(r.needs==='m2' && intelHas('tower_fix'))) L.push(r.text); });
  if(L.length < 2) L.push(RADIO_FILLER[(midx(mid) * 2) % RADIO_FILLER.length]);
  return L.slice(0, 2);
}
function radioPlay(mid){
  if(!ENGINE.movementEnabled || S.game.currentMission !== mid || typeof radioLine !== 'function') return;
  const lines = radioLines(mid);
  I().radio[mid] = lines;
  lines.forEach(t => radioLine(RADIO_STATION, t, Math.max(4200, t.length * 52)));
}
