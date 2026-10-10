/* =========================================================================
   NACECA · v13 intel — the investigation layer's model
   One record per exhibit: source, confidence tier, how it was obtained, a
   custody trail, s.84 status and who knows about it. The trial, the case
   review and the Case Desk read from this one structure. State: S.game.intel.
   Sits on v12 and the friends beta (docs/SYNC-2026-10-08-beta.md):
   - the board is the magistrate. Lekki and Asaba are the beta's charge-sheet
     warrants (V12.accused(case).warrant); the Ugbowo production order and the
     Ekosodin warrant are filed once at the h6 / h7 briefing through
     V12.fileV13Warrant, on the board's own reading (V12.warrantFor).
     V12.warrantState(id) is the one reader.
   - Senior Agent (default) gets no right/wrong feedback, relevance toasts or
     answer-shaped intel; Recruit keeps the drop's feedback.
   - v13 overlays get one Esc/pause rule and one operations-table return
     stack (v13Modal, v13OpenOps); togglePause is wrapped here, once.
   ========================================================================= */

// operations in story order; t7 (the car) sits between m7 and m8. Hubs are not operations.
const MISSION_ORDER = ['m0','m1','m2','m3','m3n','m4','m5','m6','m7','t7','m8'];
const BRIEF_BEFORE = ['m4','m5','m6','m7','m8'];      // an s.84 window closes when the next of these starts
const RADIO_OPS = ['m2','m3','m4','m5','m6','m7','m8'];   // bulletins: field operations only (never hubs, Night Shift or the car)
const HUB_AFTER_OP = { h2:'m2', h4:'m4', h5:'m5', h6:'m6', h7:'m7' };   // fallback when V12.HUBS is missing
const midx = id => MISSION_ORDER.indexOf(id);

/* ---------- difficulty and gates ---------- */
function intelSenior(){ return !(typeof isRecruit === 'function' && isRecruit()); }
// the MONEY trail opens once the Lagos charge sheet is filed (or Lekki is behind you), so it can't hand over the Lagos money line
function intelMoneyOpen(){
  const a = (window.V12 && typeof V12.accused === 'function') ? V12.accused('lagos') : null;
  return !!a || (S.game.completedMissions || []).includes('m3');
}

function I(){
  const missing = !S.game.intel || typeof S.game.intel !== 'object';
  if(missing) S.game.intel = {};
  const d = S.game.intel;
  // no S.game.intel, or one without exhibit records: a save from before the Case Desk (or a harness start).
  // An empty {} is a new record somebody asked for on purpose (design A0), never a save: nothing to migrate.
  const legacy = missing || ((!d.items || typeof d.items !== 'object') && Object.keys(d).length > 0);
  const def = { items:{}, flagged:{}, money:{ open:false, req:0, unlocked:{}, traced:{} }, reg:{ found:{}, ctc:{} },
    st:{}, stv:{}, warrants:{}, leads:{}, briefed:{}, dropLog:[], flags:{}, known:{}, alert:0, opLog:{}, certUsed:{},
    started:{}, so:null, uc:null, radio:{}, court:null };
  for(const k in def) if(d[k] === undefined) d[k] = def[k];
  if(legacy) intelMigrate(d);
  return d;
}
/* old saves (the friends' beta): runs once, the first time I() sees a state without S.game.intel.items */
function intelMigrate(d){
  const done = S.game.completedMissions || [];
  // briefings whose operation is already behind the player are missed (no drop log, no effects)
  const keys = (typeof BRIEFINGS !== 'undefined' && BRIEFINGS) ? Object.keys(BRIEFINGS) : [];
  keys.forEach(k => { if(done.includes(k) && !d.briefed[k]) d.briefed[k] = 'missed'; });
  done.forEach(m => { d.started[m] = true; });
  // exhibits logged before the Case Desk existed: certified, with only the beta's own flaws.
  // (An exhibit from an operation still in progress gets an ordinary record: the desk is open now.)
  (S.game.evidence || []).forEach(ev => {
    if(!ev || !INTEL_ITEMS[ev.id] || d.items[ev.id]) return;
    const n = Object.keys(d.items).length + 1, meta = INTEL_ITEMS[ev.id];
    if(!meta.inv && !done.includes(meta.m)){ intelOnEvidence(ev); return; }
    d.items[ev.id] = { id:ev.id, m:meta.m, cert:true, legacy:true, custody:[
      { t:'Certified before the Case Desk existed' },
      { t:`Sealed and tagged — exhibit NAC/EX/0034/${String(n).padStart(2,'0')}` } ] };
  });
  // the later orders: a save already past them went in on a signed paper
  if(done.includes('m7') && !d.warrants.w_cdr) d.warrants.w_cdr = { status:'signed', route:'legacy', at:null };
  if((done.includes('t7') || done.includes('m8')) && !d.warrants.w_eko) d.warrants.w_eko = { status:'signed', route:'legacy', at:null };
}
function lastDone(){ const done = (S.game.completedMissions||[]).filter(x=>midx(x)>=0).map(midx); return done.length ? MISSION_ORDER[Math.max(...done)] : 'm1'; }
/* the operation the player is in: a hub counts as the operation it follows, the car as m7 */
function opNow(raw){
  raw = raw || S.game.currentMission || 'm1';
  if(raw === 't7') return 'm7';
  const H = window.V12 && V12.HUBS;
  if(H && H[raw] && H[raw].after) return H[raw].after;
  if(HUB_AFTER_OP[raw]) return HUB_AFTER_OP[raw];
  return midx(raw) >= 0 ? raw : lastDone();
}

/* ---------- labels ---------- */
const INTEL_NAMES = {
  phishing_template:'Phishing template', laptop:'Encrypted laptop', cash:'₦12.4M cash bundles', safe_drives:'Encrypted hard drives',
  broken_seal:'Mismatched container seal', ransom_ledger:'Ransom route ledger', concealed_arms:'Concealed arms', musa_statement:"Musa's statement",
  musa_record:"Musa's wired statement", efe_statement:"Efe's statement", tail_plate:'Plate BEN 417 KJ — the black jeep',
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
    const invM = MISSION_ORDER.slice(midx(lastDone()) + 1).find(x => x !== 't7') || 'm8';
    d.items[ev.id] = { id:ev.id, m:meta.inv ? invM : meta.m, cert:false, custody:[
      { t: meta.inv ? 'Logged at HQ by Agt. Kelechi' : 'Logged by Agt. Kelechi', at: meta.inv ? '' : region },
      { t:`Sealed and tagged — exhibit NAC/EX/0034/${String(n).padStart(2,'0')}` } ] };
    if(midx(meta.m) >= 3 && !meta.inv) d.items[ev.id].custody.push({ t:'Witnessed: Sgt. Uche' });
  }
}
/* findings from the desk and the briefings become exhibits you can put to her */
function addInvEvidence(id, quiet){
  if(!INTEL_ITEMS[id] || intelHas(id)) return false;
  const ev = { id, name:INV_NAMES[id] || id, xp:0 };
  S.game.evidence = S.game.evidence || []; S.game.evidence.push(ev);
  intelOnEvidence(ev);
  if(!quiet) toast('ADDED TO THE CASE', ev.name, 2200);
  return true;
}
function addPseudoItem(id, m, kind, src){
  const d = I();
  if(!INTEL_ITEMS[id]) INTEL_ITEMS[id] = { m, kind, tier:'confirmed', e:true, src };
  if(!d.items[id]) d.items[id] = { id, m, cert:false, custody:[{ t:"Recorded on Agt. Kelechi's body-camera" }, { t:'Uploaded to the evidence server, hash logged' }] };
}
/* exhibits from an operation with no aftermath screen (Night Shift, the car) are booked in at the next start */
function bookIn(mid){
  const d = I(), done = S.game.completedMissions || [];
  Object.values(d.items).forEach(it=>{
    if(it.legacy || !Array.isArray(it.custody)) return;
    if((mid ? it.m === mid : done.includes(it.m)) && !it.custody.some(c=>/exhibit room/.test(c.t))) it.custody.push({ t:'Booked into the HQ exhibit room' });
  });
}
/* the ledger sent to her office comes back short a page — and the file says so only after the reveal */
function ledgerCustody(){
  const d = I(), it = d.items.ransom_ledger, mc = S.game.moralChoices || {};
  if(!it || it.legacy || d.custodyAsk !== 'gave' || !mc.finale) return false;
  if(!it.custody.some(c => /page 14 missing/i.test(c.t))) it.custody.push({ t:'Returned — page 14 missing' });
  return true;
}

/* ---------- warrants: the board is the magistrate ---------- */
const V13_WARRANT_CASE = { w_lekki:'lagos', w_asaba:'route', w_cdr:'route', w_eko:'voice' };
const RAID_WARRANT = { m3:'w_lekki', m6:'w_asaba', m8:'w_eko' };      // whose search an operation's exhibits came out of
const NOORDER_ITEMS = ['tower_cdr', 'tower_fix', 'inv_engineer'];
const W_OK = { w_cdr:['pending','signed','none'], w_eko:['pending','signed','exigent'] };
// the staged vendor drop wrote granted/refused/missed/skipped; read those as the nearest decision
const W_OLD = { w_cdr:{ granted:'signed', missed:'none', skipped:'none', refused:'pending' }, w_eko:{ granted:'signed', missed:'exigent', skipped:'exigent', refused:'pending' } };
function wStatus(id){
  if(id === 'w_lekki' || id === 'w_asaba'){
    const r = (window.V12 && typeof V12.accused === 'function') ? V12.accused(V13_WARRANT_CASE[id]) : null;
    if(!r) return 'none';
    return (r.warrant === 'signed' || r.warrant === 'exigent') ? r.warrant : 'pending';
  }
  if(id === 'w_cdr' || id === 'w_eko'){
    const w = I().warrants[id], s = w && w.status;
    if(!s) return 'pending';
    if(W_OK[id].includes(s)) return s;
    return W_OLD[id][s] || 'pending';
  }
  return 'none';
}
function boardFor(c){
  try{ if(window.V12 && typeof V12.warrantFor === 'function'){ const w = V12.warrantFor(c); if(w && typeof w === 'object') return w; } }catch(e){}
  return null;
}
if(window.V12){
  /* V12.warrantState(id) → { id, case, label, short, court, status, route, at, legacy, strength, strikes, need, refused }
     status — w_lekki / w_asaba: 'none' (no sheet) | 'pending' (sheet filed, no decision) | 'signed' | 'exigent'
              w_cdr: 'pending' | 'signed' | 'none' (went without);  w_eko: 'pending' | 'signed' | 'exigent'
     strength / strikes / need / refused always come live from the board (V12.warrantFor(case)). */
  V12.warrantState = function(id){
    const c = V13_WARRANT_CASE[id] || null, W = (typeof WARRANTS !== 'undefined' ? WARRANTS : []).find(x => x.id === id) || {};
    const out = { id, case:c, label:W.name || id, short:W.short || '', court:W.court || '', status:wStatus(id), route:null, at:null, legacy:false,
      strength:0, strikes:0, need:'', refused:false };
    if(id === 'w_lekki' || id === 'w_asaba'){
      const r = typeof V12.accused === 'function' ? V12.accused(c) : null;
      if(r) out.at = r.warrant === 'exigent' ? (r.exigentAt || null) : (r.warrantAt || null);
    } else if(id === 'w_cdr' || id === 'w_eko'){
      const w = I().warrants[id];
      if(w){ out.route = w.route || null; out.at = w.at || null; out.legacy = w.route === 'legacy'; }
    }
    const b = c ? boardFor(c) : null;
    if(b){ out.strength = Math.max(0, Math.min(100, Math.round(+b.strength || 0))); out.strikes = b.strikes | 0; out.need = String(b.need || ''); out.refused = !!b.refused && !b.signed; }
    return out;
  };
  /* V12.fileV13Warrant(id, {status, route}) — the only writer for w_cdr / w_eko. A decision is permanent:
     it writes only over 'pending' and returns the (unchanged) state afterwards. 'signed' only when the
     board signs now (the magistrate rule). A signed w_eko needs route 'commander' | 'zonal'; the route's
     consequence is applied here, once: the Commander's office → I().alert + 1; Zonal → Agency Standing −6.
     Returns V12.warrantState(id), or null when the filing is not allowed. */
  V12.fileV13Warrant = function(id, o){
    o = o || {};
    if(id !== 'w_cdr' && id !== 'w_eko') return null;
    const d = I(), cur = wStatus(id);
    if(cur !== 'pending') return V12.warrantState(id);
    const st = o.status;
    if(!W_OK[id].includes(st) || st === 'pending') return null;
    let route = null;
    if(st === 'signed'){
      const b = boardFor(V13_WARRANT_CASE[id]);
      if(b && !b.signed) return null;
      if(id === 'w_eko'){ if(o.route !== 'commander' && o.route !== 'zonal') return null; route = o.route; }
      else route = o.route || 'standard';
    }
    d.warrants[id] = { status:st, route, at:S.game.currentMission || null, t:Date.now() };
    if(id === 'w_eko' && route === 'commander') d.alert += 1;
    if(id === 'w_eko' && route === 'zonal' && typeof applyEffect === 'function') applyEffect({ agencyFavour:-6 });
    try{ if(typeof V12.log === 'function') V12.log('v13_warrant', { id, status:st, route }); }catch(e){}
    try{ if(typeof saveGame === 'function') saveGame(true); }catch(e){}
    return V12.warrantState(id);
  };
}
// shim (wave 1): the drop's question, answered by the board
function warrantGranted(id){ return !!(window.V12 && V12.warrantState && V12.warrantState(id).status === 'signed'); }

/* ---------- what a defence lawyer would say about it ---------- */
function contestCause(id){
  const CASES = window.CW && CW.CASES; if(!CASES || !window.V12 || typeof V12.accused !== 'function') return 'field';
  for(const c of ['lagos', 'route']){
    const C = CASES[c], r = V12.accused(c); if(!C || !r || !r.settled) continue;
    const ok = r.ok || {};
    if((C.methodEv || []).includes(id) && ok.method === false) return 'method';
    if((C.moneyEv || []).includes(id) && ok.money === false) return 'money';
  }
  for(const c of ['lagos', 'route']){
    const C = CASES[c], r = V12.accused(c);
    if(C && r && r.warrant === 'exigent' && (C.exigentEv || []).includes(id)) return 'exigent';
  }
  return 'field';
}
function intelItemFlaws(id){
  const meta = INTEL_ITEMS[id] || {}, d = I(), it = d.items[id] || {};
  const mc = S.game.moralChoices || {}, fl = S.game.flags || {};
  const m = meta.m || (id === 'bodycam_eko' ? 'm8' : null), legacy = !!it.legacy, out = [];
  const raid = !meta.inv && RAID_WARRANT[m];
  if(m === 'm3' && !meta.inv && mc.arrest === 'bribe') out.push({ k:'tainted', w:60, txt:'Recovered in an operation where the officer accepted a bribe' });
  if(raid && meta.kind !== 'WITNESS' && wStatus(raid) === 'exigent')
    out.push({ k:'warrantless', w:20, txt: raid === 'w_eko' ? 'Seized on exigency — no warrant was signed for the house' : 'Taken in a search without a warrant — exigent entry' });
  if(!legacy && m === 'm5' && !meta.inv && fl.shrine_access === 'granted_force') out.push({ k:'warrantless', w:20, txt:'Entry forced on sacred ground, no warrant' });
  if(!legacy && NOORDER_ITEMS.includes(id) && wStatus('w_cdr') === 'none')
    out.push({ k:'noorder', w:20, txt: id === 'inv_engineer' ? 'Call records pulled off the books, no production order' : 'Pulled from the cabinet without a production order' });
  if(!legacy && (id === 'musa_statement' || id === 'musa_record') && mc.checkpoint === 'flip_driver') out.push({ k:'inducement', w:10, txt:'Given in exchange for leniency' });
  if(!legacy && id === 'ransom_ledger' && ledgerCustody()) out.push({ k:'custody', w:20, txt:'Sent to the Office of the Commander. It came back with page 14 missing' });
  if(window.V12 && V12.evQ && /weak|contested/.test(V12.evQ(id))){
    const why = contestCause(id);
    // an exigent raid already carries 'warrantless': the beta's contest of the same exhibits is not counted twice
    if(why === 'method') out.push({ k:'contested', w:25, txt:'Contested — your own charge sheet put the method elsewhere' });
    else if(why === 'money') out.push({ k:'contested', w:25, txt:'Contested — your own charge sheet put the money elsewhere' });
    else if(why !== 'exigent' || !out.some(f => f.k === 'warrantless')) out.push({ k:'contested', w:25, txt:'Contested — the defence will attack how it was obtained' });
  }
  if(!legacy && meta.e && !it.cert) out.push({ k:'s84', w:30, txt:'No certificate under s.84, Evidence Act 2011' });
  return out;
}
/* ADMISSIBILITY: what survives a courtroom (not the officer's Integrity) */
function intelAdmissibility(id){
  const f = intelItemFlaws(id);
  return { score: Math.max(0, 100 - f.reduce((a, x) => a + x.w, 0)), flaws: f.map(x => ({ k:x.k, label:x.txt, pts:x.w })) };
}
function intelIntegrity(id){ return intelAdmissibility(id).score; }

/* s.84 certificates: signed while the extraction is fresh — until the next briefed operation starts — two per operation */
const CERT_SLOTS = 2;
function certWindowOpen(id){
  const d = I(), it = d.items[id]; if(!it) return false;
  if(d.court || S.game.seasonOneComplete) return false;                 // the trial has been and gone
  const closeAt = BRIEF_BEFORE.find(b => midx(b) > midx(it.m));
  if(!closeAt) return true;                                           // the finale's exhibits: until the trial
  const raw = S.game.currentMission || 'm1', cur = opNow(raw), between = raw !== cur;   // a hub or the car
  return midx(cur) < midx(closeAt) || (cur === closeAt && !between && !d.started[closeAt]);
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

/* ---------- playstyle: the Voice studies you (dialogue only — it never changes the finale) ---------- */
function intelStyle(){
  const d = I(), mc = S.game.moralChoices || {};
  const heat = heatNow();
  // each signed paper once (a legacy save's assumed orders are not the player's filing)
  const signed = ['w_lekki','w_asaba','w_cdr','w_eko'].filter(id => wStatus(id) === 'signed' && !((d.warrants[id] || {}).route === 'legacy')).length;
  const sc = {
    aggr: (S.game.forceUsed||0)*2 + (mc.entry==='loud'?2:0) + (mc.shrine==='force'?2:0) + (mc.choice==='force'?2:0) + Math.max(0, Math.round((heat-40)/15)) + Object.values(d.opLog).reduce((a,o)=>a+(o.bumps||0),0),
    inf:  (mc.choice==='flip'?2:0) + (mc.checkpoint==='flip_driver'?2:0) + (mc.arrest==='informant'?3:0) + (d.leads.tunde==='done'?1:0) + (d.leads.pos==='done'?1:0) + (S.game._tipM3?1:0) + (S.game._tipM7?1:0),
    proc: signed*2 + Object.values(d.items).filter(i=>i.cert && !i.legacy).length + (mc.entry==='knock'?1:0) + (d.custodyAsk==='kept'?2:0),
    media:(d.press==='bodycam'?3:0) + (d.order==='leak'?3:0) + (d.press==='trace'?1:0),
  };
  const keys = ['aggr','inf','media','proc'], max = Math.max(...keys.map(k => sc[k]));
  const lead = keys.filter(k => sc[k] === max);
  return { key: (max <= 0 || lead.length !== 1) ? 'proc' : lead[0], scores:sc };
}
const STYLE_NAME = { aggr:'The Front Door', inf:'The Handler', proc:'The Paper Trail', media:'The Camera' };

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
  // Senior: a flag never opens the money trail on the spot (that would mark the clue as relevant);
  // the next briefing adds whatever the flags lead to, all together (intelBriefingOpened)
  if(on && c.rel && c.money && !intelSenior()) moneyUnlock([c.money], true);
}
/* a briefing opens: Senior's flagged money clues join the trail now, without saying which flag did it */
function intelBriefingOpened(){
  if(!intelSenior()) return [];
  const d = I(), m = d.money, ids = [];
  PHONES.forEach(p => p.items.forEach(c => { if(c.rel && c.money && d.flagged[c.id] === true && !m.unlocked[c.money]) ids.push(c.money); }));
  if(ids.length) moneyUnlock(ids, false);
  return ids;
}

/* ---------- money ---------- */
function moneyUnlock(ids, announce){
  const m = I().money;
  ids.forEach(id=>{
    if(!MONEY_NODES[id] || m.unlocked[id]) return;
    m.unlocked[id] = true;
    if(!m.open){ m.open = true; m.req += MONEY_START_REQUESTS; }
    if(announce && !intelSenior()) toast('MONEY TRAIL', MONEY_NODES[id].name + ' — follow it in the Case Desk', 2200);
  });
}
function moneyTrace(id){
  const m = I().money, n = MONEY_NODES[id];
  if(!intelMoneyOpen()) return false;
  if(!n || !m.unlocked[id] || m.traced[id]) return false;
  if(m.req <= 0){ toast('NO NFIU REQUESTS LEFT', 'More come with the next briefing'); if(typeof sfxFail==='function') sfxFail(); return false; }
  m.req--; m.traced[id] = true;
  n.next.forEach(x=>{ m.unlocked[x] = true; });
  if(n.reg) regFind([n.reg]);
  // Senior: every trace is worth the same, so neither a toast nor the intel count marks the key node
  if(intelSenior()) applyEffect({ intel:+2 });
  else if(n.key){ applyEffect({ intel:+12 }); toast('C.A. CONSULTING', 'A retainer on the first of every month', 2800); }
  checkInvEvidence();
  return true;
}
function moneyTotal(){ const m = I().money; return Object.keys(m.traced).reduce((a,k)=>a + ((MONEY_NODES[k] || {}).amt||0), 0); }
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
/* the address search always lists what is there; only Recruit is told what it means */
function regAtAddress(addr){
  const d = I(), r = d.reg;
  const hits = Object.keys(REGISTRY).filter(k=>REGISTRY[k].addr === addr && (!REGISTRY[k].hidden || r.found[k]));
  regFind(hits);
  if(addr === ZUMA && hits.length >= 4 && !intelHas('zuma_cluster')){
    intelSet('zuma_cluster'); knowAdd('zuma', 'You');
    if(intelSenior()) d.flags.one_office_due = true;            // the achievement waits until the case is closed
    else {
      applyEffect({ intel:+10 }); if(typeof unlock==='function') unlock('one_office');
      toast(`${hits.length} ENTITIES · ONE OFFICE`, 'Different owners on paper. Same desk in Wuse II.', 3000);
    }
  }
  return hits;
}
/* C.A. becomes an exhibit once you hold both halves: the company and the money */
function checkInvEvidence(){
  // Senior: the exhibit lands in the Locker without a toast (a toast here would mark the trace as the one that mattered)
  if(intelHas('n_ca') && intelHas('reg_ca')) addInvEvidence('inv_ca', intelSenior());
}

/* ---------- statements ---------- */
function stAvailable(st){
  if(st.id === 'st_tunde') return I().leads.tunde === 'done';
  if(st.id === 'st_musa')  return I().leads.musa === 'done';
  if(st.id === 'st_tobi')  return I().leads.tobi === 'done';
  return intelHas(st.needs);
}
function stClaim(stId, cid){ const st = STATEMENTS.find(s=>s.id===stId); return st ? st.claims.find(x=>x.id===cid) || null : null; }
// Recruit's live feedback: the answer for what is in hand right now
function stExpected(c){ if(c.truth === 'unverifiable') return 'unverified'; return intelHas(c.proof) ? c.truth : 'unverified'; }
/* intelVerdict(stId, claimId, verdict) → { locked, ok } | null
   Senior: a verdict is a filing. CORROBORATED / CONTRADICTED / HONEST MISTAKE lock on filing; UNVERIFIED stays
   open and can be replaced once, by any verdict. ok is null (nothing is judged before the Case Review); every
   filing is +2 intel. Recruit: as delivered (ok true/false with a message, retries, +4 on a first correct call).
   Records: S.game.intel.st[stId][claimId] = verdict (the drop's shape), S.game.intel.stv[stId][claimId] =
   { verdict, locked, held, rep } with held = intelHas(claim.proof) at filing. */
function intelVerdict(stId, cid, v){
  const c = stClaim(stId, cid); if(!c || !VERDICTS.some(x => x.id === v)) return null;
  const d = I();
  d.st[stId] = d.st[stId] || {}; d.stv[stId] = d.stv[stId] || {};
  const prev = d.stv[stId][cid];
  if(intelSenior()){
    if(prev && prev.locked) return { locked:true, ok:null };
    const replacing = !!(prev && prev.verdict === 'unverified');
    if(replacing && v === 'unverified') return { locked:false, ok:null };
    const rec = { verdict:v, held:intelHas(c.proof), locked: replacing || v !== 'unverified', rep:replacing, at:S.game.currentMission || null };
    d.stv[stId][cid] = rec; d.st[stId][cid] = v;
    applyEffect({ intel:+2 });
    try{ if(window.V12 && typeof V12.log === 'function') V12.log('v13_verdict', { st:stId, c:cid, v }); }catch(e){}
    return { locked:rec.locked, ok:null };
  }
  const first = !d.st[stId][cid];
  d.st[stId][cid] = v;
  d.stv[stId][cid] = { verdict:v, held:intelHas(c.proof), locked:false, rep:false, at:S.game.currentMission || null };
  const exp = stExpected(c), ok = v === exp;
  if(ok && first) applyEffect({ intel:+4 });
  let msg;
  if(ok) msg = exp === 'unverified' ? 'Fair. Nothing in hand settles this yet — come back when it does.' : c.why;
  else if(exp === 'unverified') msg = "You can't establish that yet. What exhibit would you put next to it?";
  else if(v === 'contradicted' && exp === 'mistaken') msg = 'The evidence disagrees with this witness — but would they know that? Look at where they got it.';
  else if(v === 'mistaken' && exp === 'contradicted') msg = 'This is not an honest slip. This witness was in a position to know.';
  else if(v === 'unverified') msg = 'You already hold something that settles this.';
  else msg = 'Read it against your exhibits again.';
  return { locked:false, ok, msg };
}
/* intelVerdictOf(stId, claimId) → { verdict, locked, held } | null */
function intelVerdictOf(stId, cid){
  const d = I(), r = (d.stv[stId] || {})[cid];
  if(r) return { verdict:r.verdict, locked:!!r.locked, held:!!r.held };
  const v = (d.st[stId] || {})[cid]; if(!v) return null;
  const c = stClaim(stId, cid);
  return { verdict:v, locked:false, held:!!(c && intelHas(c.proof)) };
}
/* intelVerdictScore(stId, claimId) → true | false | null (null = not filed). Read at season end. */
function intelVerdictScore(stId, cid){
  const r = intelVerdictOf(stId, cid), c = stClaim(stId, cid);
  if(!r || !c) return null;
  if(r.verdict === c.truth && r.held) return true;
  if(c.truth === 'unverifiable' && r.verdict === 'unverified') return true;
  if(r.verdict === 'unverified' && !intelHas(c.proof)) return true;
  return false;
}
// the drop's desk call (wave 1 shim): same filing rules, plus a line of text
function stJudge(stId, cid, v){
  const r = intelVerdict(stId, cid, v); if(!r) return null;
  if(r.ok === null) return { ok:null, locked:r.locked, msg: r.locked ? 'Filed. It stays on the record.' : 'Filed as unverified. You can come back to it once.' };
  return r;
}

/* ---------- mission hooks ---------- */
function intelOnMissionStart(id){
  const d = I();
  d.started[id] = true;
  v13NavReset();                                                      // a new operation: no v13 flow resumes into it
  bookIn();
  if(id === 'm8'){
    const st = intelStyle();
    d.styleAtFinale = st.key;
    // she knew you were coming only when somebody told her (deliberate leaks the player chose)
    if(d.alert >= 2){
      const already = !!S.game._finWarned;
      S.game._finWarned = true;
      if(!already) setTimeout(()=>{ if(S.game.currentMission === 'm8' && typeof toast === 'function') toast('THE HOUSE IS AWAKE', 'Somebody told them you were coming.', 3200); }, 2200);
    }
  }
  if(RADIO_OPS.includes(id)) setTimeout(()=>{ try{ radioPlay(id); }catch(e){ console.warn('[v13] radio', e); } }, 9000);
}
function intelOnMissionEnd(mid){
  const d = I(), o = S.game._opStart || {};
  d.opLog[mid] = { force: Math.max(0, (S.game.forceUsed||0) - (o.force||0)), bumps: S.game._opBumps || 0 };
  bookIn(mid);
  if(mid === 'm8'){
    if(S.game.flags && S.game.flags.fin_bodycam) addPseudoItem('bodycam_eko', 'm8', 'VIDEO', "Agt. Kelechi's body-camera, the yard on Akintola Close");
    ledgerCustody();
    if(d.flags.one_office_due){ delete d.flags.one_office_due; if(typeof unlock === 'function') unlock('one_office'); }
  }
}
/* the back gate: the caretaker's tip counts, and Uche credits the caretaker (v12_mem reads backgate_src) */
function intelBackGate(){
  if(!intelHas('lead_caretaker')) return false;
  S.game.flags = S.game.flags || {};
  if(!S.game.flags.backgate_src) S.game.flags.backgate_src = 'caretaker';
  return true;
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
  const after = [{ speaker:'COMMANDER ADAEZE', mood:'evasive', text: STYLE_LINE[st] || STYLE_LINE.proc }];
  if(d.order === 'comply') after.push({ speaker:'COMMANDER ADAEZE', mood:'evasive', text:'You left the Engineer alone when I asked you to. You have no idea how much I wanted you to say no.' });
  if(d.order === 'confront') after.push({ speaker:'COMMANDER ADAEZE', mood:'evasive', text:'You came into my office and asked me to my face. I respected that. Then I changed every phone that night.' });
  return { before, after };
}

/* ---------- radio: news bulletins through v12's radio strip (field operations only) ---------- */
function radioLines(mid){
  const d = I(), mc = S.game.moralChoices || {};
  const L = [];
  const last = (S.game.headlines || []).slice(-1)[0];
  if(last && last.head) L.push(`Top story: ${last.head}.`);
  if(mid === 'm7' && d.press === 'bodycam') L.push(d.pressClean ? 'NACECA has released body-camera footage from Asaba. It shows no assault. The station that ran the story has gone quiet.' : 'NACECA released its own Asaba footage. It shows an officer knocking a trader down. The agency says it will "review".');
  if(mid === 'm7' && d.press === 'quiet') L.push('Still no comment from NACECA on the Asaba assault claims. Our callers are not impressed.');
  if(mid === 'm7' && d.press === 'trace') L.push('The Asaba "assault" story has been traced to a PR firm. The firm is not answering calls.');
  if(d.order === 'leak' && midx(mid) >= midx('m6')) L.push('Exclusive: a man registered as a NACECA informant is linked to the Edo kidnap ring. The agency calls the report "reckless".');
  (Array.isArray(RADIO_RUMOURS) ? RADIO_RUMOURS : []).forEach(r=>{
    if(L.length >= 2 || !r || !intelHas(r.needs)) return;
    if(typeof r.when === 'function'){ let ok = false; try{ ok = !!r.when(mc); }catch(e){ ok = false; } if(!ok) return; }
    if(r.needs === 'm2' && intelHas('tower_fix')) return;
    L.push(r.text);
  });
  const n = Array.isArray(RADIO_FILLER) ? RADIO_FILLER.length : 0;
  if(L.length < 2 && n){ const i = Math.max(0, midx(mid)); L.push(RADIO_FILLER[((i * 2) % n + n) % n]); }
  return L.filter(t => typeof t === 'string' && t.length).slice(0, 2);
}
function radioPlay(mid){
  try{
    if(!RADIO_OPS.includes(mid)) return;
    if(!ENGINE.movementEnabled || S.game.currentMission !== mid || typeof radioLine !== 'function') return;
    const lines = radioLines(mid);
    I().radio[mid] = lines;
    lines.forEach(t => radioLine(RADIO_STATION, t, Math.max(4200, t.length * 52)));
  }catch(e){ console.warn('[v13] radio', e); }
}

/* =========================================================================
   Navigation (design A2): one Esc / pause rule for v13 overlays, and one
   return stack for the operations table. Nobody else assigns V12._onOpsClose.
   ========================================================================= */
const V13NAV = { stack:[], modals:[], under:null };
function v13Shown(id){ const el = id && document.getElementById(id); return !!(el && el.classList.contains('show')); }
function v13NavReset(){
  V13NAV.stack.length = 0; V13NAV.modals.length = 0; V13NAV.under = null;
  if(window.V12 && V12._onOpsClose === v13NavPop) V12._onOpsClose = null;
}
/* v13OpenOps(group, back): open the operations table; closing it runs back() (the entry pushed last first) */
function v13OpenOps(group, back){
  if(!window.V12){ if(typeof back === 'function') back(); return; }
  let music = null; try{ music = (typeof AUDIO !== 'undefined' && AUDIO._music && AUDIO._music.currentName) || null; }catch(e){}
  V13NAV.stack.push({ back: typeof back === 'function' ? back : null, music });
  V12._onOpsClose = v13NavPop;
  if(window.V12 && typeof V12.openOps === 'function') V12.openOps(group);
  else { V12._onOpsClose = null; v13NavPop(); }
}
function v13NavPop(){
  const e = V13NAV.stack.pop();
  if(V13NAV.stack.length) V12._onOpsClose = v13NavPop;              // the next close unwinds the next entry
  if(e && e.back){ try{ e.back(); }catch(err){ console.warn('[v13] nav', err); } }
  // closeOps chose mission or title music; with no mission HUD back on screen, put back what played under the table
  try{
    const hud = document.getElementById('hud'), hudOn = !!(hud && hud.style.display !== 'none' && S.game.currentMission && ENGINE.movementEnabled !== false);
    if(e && e.music && !hudOn && typeof playMusic === 'function') playMusic(e.music, { volume:0.55 });
  }catch(err){}
}
/* v13Modal(id, {onEsc, resume}) / v13ModalEnd(id): while the overlay #id is shown, Esc calls onEsc (or does
   nothing when onEsc is null) instead of opening the pause menu. If the pause menu opens over it anyway
   (a HUD button), Resume calls resume() (or re-shows #id). */
function v13Modal(id, o){
  if(!id) return;
  o = o || {};
  v13ModalEnd(id);
  V13NAV.modals.push({ id, onEsc: typeof o.onEsc === 'function' ? o.onEsc : null, resume: typeof o.resume === 'function' ? o.resume : null });
}
function v13ModalEnd(id){
  const i = V13NAV.modals.findIndex(m => m.id === id);
  if(i >= 0) V13NAV.modals.splice(i, 1);
}
function v13TopShownModal(){ for(let i = V13NAV.modals.length - 1; i >= 0; i--) if(v13Shown(V13NAV.modals[i].id)) return V13NAV.modals[i]; return null; }
if(window.V12 && typeof V12.wrap === 'function'){
  V12.wrap('togglePause', orig => function(){
    try{
      const ev = window.event, esc = !!(ev && ev.type === 'keydown' && (ev.code === 'Escape' || ev.key === 'Escape'));
      if(!v13Shown('screen-pause')){
        if(esc && v13Shown('screen-ops') && V13NAV.stack.length && typeof V12.closeOps === 'function'){ V12.closeOps(); return; }
        const top = v13TopShownModal();
        if(esc && top){ if(top.onEsc) top.onEsc(); return; }
        // the pause menu is opening: while a v13 flow is open, remember what it covers
        const cover = V13NAV.modals.length ? [...document.querySelectorAll('.overlay.show')].map(o => o.id).find(x => x && x !== 'screen-pause') : null;
        V13NAV.under = cover || null;
        return orig.apply(this, arguments);
      }
      const under = V13NAV.under; V13NAV.under = null;
      const viaLoad = !!(ev && ev.type === 'click' && ev.target && ev.target.closest && ev.target.closest('#btn-load'));
      if(under && !viaLoad){
        // Resume goes back to the v13 flow the pause menu covered, never to an empty screen
        const m = V13NAV.modals.find(x => x.id === under);
        showOverlay(under);
        if(m && m.resume) m.resume();
        return;
      }
    }catch(e){ console.warn('[v13] pause', e); }
    return orig.apply(this, arguments);
  });
  // pause.js binds #btn-resume to the ORIGINAL togglePause at start-up, so this wrap never sees a Resume click:
  // catch it first, and go back to the v13 flow the pause menu covered
  document.addEventListener('click', e => { try{
    if(!(e.target && e.target.closest && e.target.closest('#btn-resume')) || !V13NAV.under || !v13Shown('screen-pause')) return;
    const under = V13NAV.under; V13NAV.under = null;
    e.stopImmediatePropagation(); e.preventDefault();
    const m = V13NAV.modals.find(x => x.id === under);
    showOverlay(under);
    if(m && m.resume) m.resume();
  }catch(err){ console.warn('[v13] resume', err); } }, true);
  // a quit, a load or an erase ends any v13 flow that was open
  document.addEventListener('click', e => { try{ if(e.target && e.target.closest && e.target.closest('#btn-quit, #btn-load, #btn-erase')) v13NavReset(); }catch(err){} }, true);
  // evidence logged outside collectEvidence (v12.2 street talk) gets a record too
  if(typeof V12.logEvidence === 'function'){
    const logEv = V12.logEvidence;
    V12.logEvidence = function(ev){
      try{ I(); }catch(e){}                                            // records exist before the item lands (no false legacy backfill)
      const had = !!(ev && typeof V12.hasEv === 'function' && V12.hasEv(ev.id));
      const r = logEv.apply(this, arguments);
      if(ev && !had) try{ intelOnEvidence(ev); }catch(e){ console.warn('[v13] logEvidence', e); }
      return r;
    };
  }
}
// the briefing (v13_briefing.js) calls this once per briefing as it opens, on every path (Night Shift and the
// hub calls): Senior's flagged money clues join the trail then. (Its own calls to openBriefing are internal
// to its module, so wrapping window.openBriefing would miss the hub briefings.)
window.intelOnBriefingOpen = function(){ try{ return intelBriefingOpened(); }catch(e){ console.warn('[v13] briefing money', e); return []; } };
