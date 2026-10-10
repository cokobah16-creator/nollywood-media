/* =========================================================================
   NACECA · v13 court — FRN v. Cdr. Adaeze & 2 Ors, Federal High Court, Benin
   After a proven or contested finale (v12's accusation), the case goes to trial.
   Not a courtroom simulator: one exhibit at a time, the defence objects, you
   answer. How you handled the evidence decides what survives. Then: the
   post-credits case review ("Evidence discovered: 78%").
   ========================================================================= */

ACHIEVEMENTS.push(
  { id:'one_office',   name:'One Office',          desc:'Find six companies sharing one desk in Wuse II.' },
  { id:'four_billion', name:'Follow the Money',    desc:'Trace the whole ₦4bn network from a ₦150,000 alert.' },
  { id:'cover_held',   name:'Chidi Anyanwu',       desc:'Walk out of Apex with your cover intact.' },
  { id:'clean_chain',  name:'Clean Chain',         desc:'Every exhibit you tendered was admitted.' },
);

const COURT = { ex:[], i:0, patience:3, phase:'pre', then:null, half:false, admitted:[], struck:[], cred:null, n:1 };
const COURT_OBJ = {
  s84:{ say:"My Lord, this is computer-generated evidence and there is no certificate under section 84 of the Evidence Act. Kubor v. Dickson is clear. It is inadmissible.",
    opts:[['cert','Tender the s.84 certificate'],['oral','Call the forensic examiner to explain it'],['withdraw','Withdraw the exhibit']] },
  custody:{ say:'This exhibit left the exhibit room for three days and came back with a page missing. The chain of custody is broken.',
    opts:[['register','Tender the exhibit register as it stands'],['keeper','Call the exhibit keeper — ask who signed it out'],['withdraw','Withdraw the exhibit']] },
  noorder:{ say:'This data was taken without a court order. The prosecution should not profit from its own illegality.',
    opts:[['s14','Argue section 14 — a life was at risk; admit it'],['deny','Insist no order was needed'],['withdraw','Withdraw the exhibit']] },
  warrantless:{ say:'Taken in a search without a warrant. The prosecution should not profit from its own illegality.',
    opts:[['s14','Argue section 14 — a life was at risk; admit it'],['deny','Insist no warrant was needed'],['withdraw','Withdraw the exhibit']] },
  inducement:{ say:'This witness was promised leniency. His word was for sale, and he sold it to the prosecution.',
    opts:[['corroborate','Point to what corroborates him'],['trust','Ask the court to believe him'],['withdraw','Withdraw the witness']] },
  accomplice:{ say:"Mr. Onuoha kept the syndicate's books, My Lord. He is an accomplice. His evidence needs corroboration.",
    opts:[['corroborate','Point to the money trail that corroborates him'],['trust','Ask the court to believe a victim'],['withdraw','Withdraw the witness']] },
  hearsay:{ say:'A logbook written by a gateman who is not before this court. That is hearsay.',
    opts:[['witness','Call the estate manager who kept it'],['tender','Tender the logbook on its own'],['withdraw','Withdraw it']] },
  photocopy:{ say:'These are printouts. A photocopy of a public record is not the record.',
    opts:[['ctc','Tender certified true copies from the CAC'],['portal','Explain they were printed from the CAC portal'],['withdraw','Withdraw them']] },
  ident:{ say:'Night photographs, a blur in a back seat. The prosecution cannot say whose car that is.',
    opts:[['plate','Tender the plate log against the motor-pool register'],['look','Ask the court to look closer'],['withdraw','Withdraw them']] },
  deception:{ say:'An officer lied his way into a law office under a false name. This was obtained by deception.',
    opts:[['s14','Argue section 14 — improperly obtained is not inadmissible'],['deny','Deny the officer was undercover'],['withdraw','Withdraw it']] },
  contested:{ say:"The prosecution's own officer botched this check in the field. It is contested, My Lord, and it should carry no weight.",
    opts:[['explain','Call the officer to explain exactly what went wrong'],['withdraw','Withdraw it']] },
  none:{ say:'No objection, My Lord — though the defence will address its weight.', opts:[['tender','Tender it']] },
};

function itemObjection(id, dflt){
  const order = ['tainted','s84','custody','contested','noorder','warrantless','inducement'];
  const fl = intelItemFlaws(id).sort((a,b)=>order.indexOf(a.k)-order.indexOf(b.k));
  return fl.length ? fl[0].k : (dflt || 'none');
}
function courtExhibits(){
  const m = S.game.moralChoices || {}, X = [], th = id => !!(window.V12 && V12.theory && V12.theory(id));
  const add = (id, name, sup, k) => X.push({ id, name, sup, k });
  if(m.tower === 'hold' && intelHas('tower_cdr')) add('tower_cdr', 'Ugbowo cabinet timing data', { c1:1, c2:1 }, itemObjection('tower_cdr'));
  if(intelHas('fin_recording'))     add('fin_recording', 'Recording of the evening ransom call', { c1:2 }, itemObjection('fin_recording'));
  if(intelHas('fin_courier_phone')) add('fin_courier_phone', 'The courier\'s phone — one saved number, "C"', { c1:1, c2:1 }, itemObjection('fin_courier_phone'));
  if(intelHas('bodycam_eko'))       add('bodycam_eko', 'Body-cam — her own words in the yard', { c1:1, c2:1, c4:1 }, itemObjection('bodycam_eko'));
  if(intelHas('fin_drive'))         add('fin_drive', "Osas's flash drive — payroll copies", { c3:1, c4:1 }, itemObjection('fin_drive'));
  if(intelHas('co_madam') && th('t_voice')) add('co_madam', '"Tell Madam it\'s clean" — the phone from Mushin', { c2:1 }, itemObjection('co_madam'));
  if(intelHas('obi_notebook') && th('t_madam')) add('obi_notebook', 'Obi\'s notebook — Friday payments to "C.A."', { c3:1 }, itemObjection('obi_notebook'));
  if(m.asaba === 'rescue')          add('tobi', 'Tobi Onuoha — testimony', { c2:1, c3:1 }, 'accomplice');
  if(intelHas('musa_statement'))    add('musa_statement', 'Musa — testimony about "Madam" and the Engineer', { c2:1 }, itemObjection('musa_statement'));
  if(intelHas('ransom_ledger'))     add('ransom_ledger', 'The ransom route ledger', { c2:1, c3:1 }, itemObjection('ransom_ledger'));
  if(intelHas('inv_gatehouse'))     add('inv_gatehouse', 'Lekki estate gatehouse log', { c4:1 }, itemObjection('inv_gatehouse', 'hearsay'));
  if(intelHas('inv_ca'))            add('inv_ca', 'C.A. Consulting — CAC record and money trail', { c3:2, c4:1 }, itemObjection('inv_ca', 'photocopy'));
  if(intelHas('inv_engineer'))      add('inv_engineer', "The Engineer's call log", { c2:1, c4:1 }, itemObjection('inv_engineer'));
  if(intelHas('inv_stakeout'))      add('inv_stakeout', 'Zuma Court stakeout photographs', { c2:1, c4:1 }, itemObjection('inv_stakeout', 'ident'));
  if(intelHas('inv_invoice'))       add('inv_invoice', 'Apex invoice — C.A. Consulting to the Foundation', { c3:1 }, itemObjection('inv_invoice', 'deception'));
  return X;
}
/* what's actually in the prosecution's file — a prosecutor knows before standing up */
function courtCanUse(ex, choice){
  const d = I(), it = d.items[ex.id] || {};
  if(choice === 'cert') return !!it.cert;
  if(choice === 'ctc') return !!d.reg.ctc.ca;
  if(choice === 'plate') return intelHas('so_plate');
  if(choice === 'corroborate') return ex.k === 'inducement' ? (intelHas('musa_bank_bw') || intelHas('musa_call_engineer') || intelHas('ransom_ledger')) : (intelHas('n_charity') || intelHas('n_ca') || intelHas('reg_ca') || intelHas('fin_drive'));
  return true;
}
function courtRule(ex, choice){
  const d = I(), it = d.items[ex.id] || {};
  const lose = (n, t) => { COURT.patience -= n; return { q:0, t }; };
  switch(ex.k){
    case 's84':
      if(choice === 'cert') return it.cert ? { q:1, t:'Overruled. The certificate is on file.' } : lose(1, 'You reach for a certificate that was never signed. Sustained.');
      if(choice === 'oral') return lose(1, 'Sustained. Oral evidence cannot cure a missing certificate.');
      break;
    case 'custody':
      if(choice === 'keeper'){ ex.sup = Object.assign({}, ex.sup, { c4:(ex.sup.c4||0)+1 }); return { q:1, t:'The keeper reads the entry aloud: signed out by the Office of the Commander. The defendant created the gap she now complains of. Overruled — and noted.' }; }
      if(choice === 'register') return lose(1, 'The register shows a three-day gap. Sustained.');
      break;
    case 'noorder': case 'warrantless':
      if(choice === 's14') return { q:0.5, t:'Admitted under section 14, given the risk to life. The court will decide what weight it carries.' };
      if(choice === 'deny') return lose(1, 'Sustained. An order was plainly required.');
      break;
    case 'inducement':
      if(choice === 'corroborate') return (intelHas('musa_bank_bw') || intelHas('musa_call_engineer') || intelHas('ransom_ledger')) ? { q:1, t:'His phone and the ledger say what he says. Admitted.' } : lose(1, 'There is nothing before the court that corroborates him.');
      if(choice === 'trust') return { q:0.5, t:'The court will hear him — and treat what he says with caution.' };
      break;
    case 'accomplice':
      if(choice === 'corroborate') return (intelHas('n_charity') || intelHas('n_ca') || intelHas('reg_ca') || intelHas('fin_drive')) ? { q:1, t:'The money runs exactly where he says it ran. Admitted.' } : lose(1, 'You have nothing to put next to him.');
      if(choice === 'trust') return { q:0.5, t:'The court will hear him, with caution.' };
      break;
    case 'hearsay':
      if(choice === 'witness') return { q:1, t:'The estate manager identifies the book, the entry and the car. Admitted.' };
      if(choice === 'tender') return lose(1, 'Sustained. Nobody here can speak to it.');
      break;
    case 'photocopy':
      if(choice === 'ctc') return d.reg.ctc.ca ? { q:1, t:'Certified true copies, stamped by the Commission. Admitted.' } : lose(1, 'You never requested certified copies.');
      if(choice === 'portal') return lose(1, 'Sustained. Bring the certified record.');
      break;
    case 'ident':
      if(choice === 'plate') return intelHas('so_plate') ? { q:1, t:'LND-412-KJ. The motor-pool register shows who had that car that night. Admitted.' } : lose(1, 'You never logged the plate.');
      if(choice === 'look') return lose(1, 'The court looks. It sees a car.');
      break;
    case 'deception':
      if(choice === 's14') return { q:1, t:'Section 14. A false name is not a crime that taints a document. Admitted.' };
      if(choice === 'deny') return lose(2, "Your own operational report says otherwise. The judge's face closes.");
      break;
    case 'contested':
      if(choice === 'explain') return { q:0.5, t:'The officer is honest about what went wrong. Admitted — for what it is worth.' };
      break;
    case 'none':
      return { q:1, t:'Admitted.' };
  }
  return { q:0, t:'Withdrawn. The prosecution moves on.' };
}

/* ---------------- flow ---------------- */
function courtOrEpilogue(){
  const o = S.game.moralChoices.finale;
  if((o === 'proven' || o === 'contested') && !I().court) openCourt(()=>startEpilogue());
  else startEpilogue();
}
function ensureCourt(){
  if(document.getElementById('screen-court')) return;
  const ov = document.createElement('div'); ov.className = 'overlay'; ov.id = 'screen-court';
  ov.innerHTML = `<div class="overlay-bg"></div><div class="settings-frame court-frame"><div class="settings-body" id="court-body"></div></div>`;
  document.getElementById('game-root').appendChild(ov);
  ov.addEventListener('click', e=>{ const b = e.target.closest('[data-ct]'); if(b) courtAct(b.dataset.ct, b.dataset); });
}
function openCourt(then){
  ensureCourt();
  Object.assign(COURT, { ex:courtExhibits(), i:0, patience:3, phase:'pre', then, half:false, admitted:[], struck:[], cred:null, n:1 });
  showHUD(false);
  if(typeof musicForScene === 'function') musicForScene('investigation');
  showOverlay('screen-court'); renderCourt();
}
function courtHead(){
  return `<div class="ct-crest">IN THE FEDERAL HIGH COURT OF NIGERIA · BENIN JUDICIAL DIVISION</div>
    <div class="ct-title">FRN v. CDR. ADAEZE & 2 ORS</div>
    <div class="ct-pat">JUDGE'S PATIENCE ${'◆'.repeat(Math.max(0,COURT.patience))}${'◇'.repeat(Math.max(0,3-COURT.patience))}</div>`;
}
function renderCourt(){
  const body = document.getElementById('court-body'); if(!body) return;
  if(COURT.phase === 'pre'){
    const d = I();
    const elec = COURT.ex.filter(x=>INTEL_ITEMS[x.id] && INTEL_ITEMS[x.id].e);
    body.innerHTML = courtHead() + `<div class="set-group">PRE-TRIAL · THE PROOF OF EVIDENCE</div>
      <div class="dk-intro">The DPP files tomorrow. ${COURT.ex.length} exhibit${COURT.ex.length===1?'':'s'} to tender. Digital Forensics can still certify the Ekosodin material — two items.</div>` +
      COURT.ex.map(x=>{ const it = d.items[x.id], meta = INTEL_ITEMS[x.id];
        const cert = meta && meta.e ? (it && it.cert ? '<span class="ok">✔ s.84 certificate</span>' : (it && certWindowOpen(x.id) && certSlotsLeft(it.m) > 0 ? `<button class="mini-btn" data-ct="cert" data-id="${x.id}">SIGN s.84 · ${certSlotsLeft(it.m)} LEFT</button>` : '<span class="bad">✘ no s.84 certificate</span>')) : '';
        const weak = { contested:'Contested in the field', custody:'Chain of custody broken', noorder:'No production order', warrantless:'No warrant', inducement:'Witness promised leniency', accomplice:'Witness kept the books — an accomplice', hearsay:'The gateman is not a witness', photocopy:'Printouts, not certified copies', ident:'Night photos — identification', deception:'Obtained undercover' }[x.k];
        return `<div class="dk-item"><div class="dk-name">${esc(x.name)}</div>${weak?`<div class="dk-meta warn">Weak point: ${esc(weak)}</div>`:''}${cert?`<div class="dk-cert">${cert}</div>`:''}</div>`; }).join('') +
      (intelHas('inv_ca') && !d.reg.ctc.ca ? `<div class="set-note">The C.A. Consulting record is a printout. <button class="mini-btn" data-ct="ctc">REQUEST CERTIFIED TRUE COPY</button></div>` : '') +
      `<div class="brf-foot"><button class="btn primary" data-ct="begin">"ALL RISE." ▶</button></div>`;
    return;
  }
  if(COURT.phase === 'cred'){
    body.innerHTML = courtHead() + `<div class="ct-def">CHIEF ABIODUN FAGBEMI, SAN — FOR THE DEFENCE</div>
      <div class="ct-say">"Before the prosecution begins, My Lord: the investigating officer took money from Chief Obi in Lekki. The defendant knew. Ask him."</div>
      <div class="seg col"><button data-ct="cred" data-v="admit">Admit it. Let the evidence speak for itself.</button><button data-ct="cred" data-v="deny">Deny it.</button></div>`;
    return;
  }
  if(COURT.phase === 'ex'){
    const x = COURT.ex[COURT.i];
    if(!x){ COURT.phase = 'judgment'; renderCourt(); return; }
    const o = COURT_OBJ[x.k] || COURT_OBJ.none;
    body.innerHTML = courtHead() + `<div class="set-group">EXHIBIT ${COURT.i+1} OF ${COURT.ex.length}</div>
      <div class="ct-ex">${esc(x.name)}</div>
      <div class="ct-def">CHIEF ABIODUN FAGBEMI, SAN — FOR THE DEFENCE</div><div class="ct-say">"${esc(o.say)}"</div>
      <div class="seg col">${o.opts.map(([k,l])=>{ const ok = courtCanUse(x, k); return `<button data-ct="resp" data-v="${k}" ${ok?'':'disabled'}>${esc(l)}${ok?'':' — not in your file'}</button>`; }).join('')}</div>`;
    return;
  }
  if(COURT.phase === 'ruling'){
    const r = COURT.lastRuling;
    body.innerHTML = courtHead() + `<div class="ct-ex">${esc(r.name)}</div><div class="ct-rule ${r.q>0?'ok':'bad'}">${esc(r.t)}${r.q>0?` <b>Admitted and marked Exhibit P${r.no}.</b>`:''}${r.q===0.5?' (reduced weight)':''}</div>
      <div class="brf-foot"><button class="btn primary" data-ct="next">NEXT ▶</button></div>`;
    return;
  }
  if(COURT.phase === 'judgment'){
    const res = courtJudgment();
    body.innerHTML = courtHead() + `<div class="set-group">JUDGMENT</div>` +
      COURT_COUNTS.map(c=>{ const w = res.w[c.id] || 0, p = res.proven.includes(c.id);
        return `<div class="ct-count ${p?'ok':'bad'}"><span>${esc(c.name)}</span><b>${p?'GUILTY':'NOT PROVEN'}</b><div class="rb"><i style="width:${Math.min(100,w/2*100)}%;background:${p?'#5dd07a':'#e84a5c'}"></i></div></div>`; }).join('') +
      `<div class="ct-verdict">${esc(courtVerdictText(res.proven.length))}</div>
      <div class="set-note">${COURT.admitted.length} admitted · ${COURT.struck.length} struck out or withdrawn.</div>
      <div class="brf-foot"><button class="btn primary" data-ct="end">RISE ▶</button></div>`;
  }
}
function courtAct(a, ds){
  if(a === 'cert'){ certify(ds.id); renderCourt(); return; }
  if(a === 'ctc'){ I().reg.ctc.ca = true; renderCourt(); return; }
  if(a === 'begin'){ COURT.phase = (S.game.moralChoices.arrest === 'bribe') ? 'cred' : 'ex'; renderCourt(); return; }
  if(a === 'cred'){
    COURT.cred = ds.v;
    if(ds.v === 'admit'){ COURT.patience -= 1; applyEffect({ integrity:+4 }); toast('THE COURTROOM GOES QUIET', 'The judge notes it. The case goes on.', 2600); }
    else { COURT.patience -= 2; COURT.half = true; toast('THE DEFENCE PRODUCES A BANK RECORD', "Everything you touched now carries less weight.", 3000); }
    COURT.phase = 'ex'; renderCourt(); return;
  }
  if(a === 'resp'){
    const x = COURT.ex[COURT.i], r = courtRule(x, ds.v);
    let q = r.q; if(COURT.half && q > 0.5) q = 0.5;
    if(COURT.patience <= 0 && q > 0.5){ q = 0.5; COURT.half = true; }
    x.q = q;
    if(q > 0){ COURT.admitted.push(x); r.no = COURT.n++; } else COURT.struck.push(x);
    COURT.lastRuling = { name:x.name, t:r.t, q, no:r.no };
    COURT.phase = 'ruling'; q > 0 ? ((typeof sfxComplete==='function'&&sfxComplete())) : ((typeof sfxFail==='function'&&sfxFail()));
    renderCourt(); return;
  }
  if(a === 'next'){ COURT.i++; COURT.phase = 'ex'; renderCourt(); return; }
  if(a === 'end'){
    const cb = COURT.then; COURT.then = null;
    if(COURT.struck.length === 0 && COURT.admitted.length > 0) unlock('clean_chain');
    saveGame(true);
    if(cb) cb();
  }
}
function courtJudgment(){
  const w = {};
  COURT.admitted.forEach(x=>{ for(const c in x.sup) w[c] = (w[c]||0) + x.sup[c] * x.q; });
  const proven = COURT_COUNTS.map(c=>c.id).filter(c=>(w[c]||0) >= 2);
  I().court = { w, proven, admitted:COURT.admitted.map(x=>x.id), struck:COURT.struck.map(x=>x.id), cred:COURT.cred };
  return { w, proven };
}
function courtVerdictText(n){
  if(n === 4) return 'Guilty on all four counts. The court is satisfied beyond reasonable doubt.';
  if(n >= 2) return `Guilty on ${n} of four counts. On the rest, the prosecution's evidence did not reach the standard.`;
  if(n === 1) return 'Guilty on one count. On three, the court acquits. Her lawyers are already smiling.';
  return 'The defence makes a no-case submission. It succeeds. She is discharged — and dismissed from service the same week.';
}
/* the epilogue line for Adaeze, once a court has spoken */
function courtEpilogueText(){
  const c = I().court; if(!c) return null;
  const n = c.proven.length, tail = ' She has never said who she answered to.';
  if(n === 4) return 'Convicted on all four counts.' + tail;
  if(n >= 2) return `Convicted on ${n} of four counts. Her appeal is pending.` + tail;
  if(n === 1) return 'Convicted on one count, acquitted on three. Dismissed from service.' + tail;
  return 'Discharged at trial on a no-case submission. Dismissed from service the same week.' + tail;
}

/* ---------------- post-credits case review ---------------- */
function reviewData(){
  const d = I(), mc = S.game.moralChoices || {}, fl = S.game.flags || {};
  const relClues = PHONES.flatMap(p=>p.items.filter(c=>c.rel));
  const claims = STATEMENTS.flatMap(s=>s.claims.map(c=>({ s, c })));
  const okClaims = claims.filter(({s,c})=>(d.st[s.id]||{})[c.id] === stExpected(c));
  const allLeads = Object.values(BRIEFINGS).flatMap(b=>b.leads);
  const TH = (window.V12 && V12.OPS_THEORIES) || [];
  const ev = Object.keys(INTEL_ITEMS).filter(k=>k !== 'bodycam_eko');
  const parts = [
    { lbl:'Evidence logged', n: ev.filter(k=>intelHas(k)).length, of: ev.length },
    { lbl:'Phone clues flagged', n: relClues.filter(c=>d.flagged[c.id]).length, of: relClues.length },
    { lbl:'Money traced', n: Object.keys(d.money.traced).length, of: Object.keys(MONEY_NODES).length },
    { lbl:'Registry records', n: Object.keys(d.reg.found).length, of: Object.keys(REGISTRY).length },
    { lbl:'Statements weighed correctly', n: okClaims.length, of: claims.length },
    { lbl:'Theories inked', n: TH.filter(t=>V12.theory(t.id)).length, of: TH.length },
    { lbl:'Leads worked', n: allLeads.filter(l=>d.leads[l.id]==='done').length, of: allLeads.length },
  ];
  const n = parts.reduce((a,p)=>a+p.n, 0), of = parts.reduce((a,p)=>a+p.of, 0);
  return { d, mc, fl, parts, pct: Math.round(n / of * 100), relClues };
}
function renderReviewHTML(inDesk){
  if(!S.game.seasonOneComplete && inDesk) return '<div class="set-note">The case review opens when the season is closed.</div>';
  const { d, mc, fl, parts, pct, relClues } = reviewData();
  const noise = PHONES.flatMap(p=>p.items.filter(c=>!c.rel && d.flagged[c.id])).length;
  const st = d.styleAtFinale || intelStyle().key;
  const cands = (window.V12 && V12.CANDIDATES) || [];
  const nm = id => (cands.find(c => c.id === id) || {}).name || id || 'nobody';
  const sealed = S.game.sealed, acc = S.game._acc;
  let h = `<div class="rv-pct"><span>EVIDENCE DISCOVERED</span><b>${pct}%</b></div>
    <div class="rv-parts">${parts.map(p=>`<div><span>${p.lbl}</span><b>${p.n}/${p.of}</b></div>`).join('')}</div>`;
  h += `<div class="set-group">WHO YOU SAW</div>`;
  if(sealed) h += `<div class="rv-line ${sealed.who==='adaeze'?'ok':'bad'}">${sealed.who==='adaeze' ? `You sealed her name${sealed.before ? ' before Ekosodin — before Osas said a word' : ''}.` : `Your sealed report named ${esc(nm(sealed.who))}, who was not the Voice.`}</div>`;
  else h += `<div class="rv-line">You never sealed an accusation.</div>`;
  if(acc) h += `<div class="rv-line ${acc.who==='adaeze'?'ok':'bad'}">On the night, you named ${esc(nm(acc.who))}${acc.who==='adaeze' ? '' : ' — the wrong door'}.</div>`;
  h += `<div class="set-group">PEOPLE YOU PROTECTED</div>`;
  const prot = [];
  prot.push(mc.market_runner === 'escaped' ? ['KC got away. Nobody protected him — including from the network.', false] : mc.choice === 'force' ? ['KC was hit in custody. He remembers.', false] : ['KC was treated fairly.', true]);
  prot.push(mc.asaba === 'rescue' ? ['Tobi walked out of the smoke.', true] : ['Tobi did not make it out of Asaba.', false]);
  prot.push(mc.shrine === 'negotiate' ? ["Pa Eze's shrine was entered with his blessing.", true] : mc.shrine === 'force' ? ['The shrine was entered by force.', false] : ['You left the shrine alone.', true]);
  prot.push(fl.child_gentle ? ['The girl from Lekki was carried out gently.', true] : ['The girl from Lekki was frightened by the raid.', false]);
  prot.push(fl.fin_osas === 'hurt' ? ['Osas came home with a broken wrist.', false] : ['Osas walked out on his own feet.', true]);
  h += prot.map(([t,ok])=>`<div class="rv-line ${ok?'ok':'bad'}">${esc(t)}</div>`).join('');
  h += `<div class="set-group">LEADS YOU NEVER WORKED</div>`;
  const dropped = d.dropLog;
  h += dropped.length ? dropped.map(x=>`<div class="rv-line ${x.buried?'bad':''}">${esc(x.text)}${x.buried?' <b>She steered you away from this one.</b>':''}</div>`).join('') : '<div class="rv-line">None dropped on the ops table — or you never sat at it.</div>';
  const unflag = relClues.filter(c=>!d.flagged[c.id]);
  if(unflag.length) h += `<div class="rv-line">${unflag.length} phone clue${unflag.length>1?'s':''} you never flagged — including: "${esc(unflag[0].text)}"</div>`;
  if(noise) h += `<div class="rv-line">${noise} flag${noise>1?'s':''} on someone's ordinary life.</div>`;
  const untraced = moneyGrand() - moneyTotal();
  if(untraced > 0) h += `<div class="rv-line">${naira(untraced)} of the network's money was never traced.</div>`;
  if(d.flags.tip_false) h += `<div class="rv-line bad">The Uselu tip came from the Voice, through Tunde.</div>`;
  h += `<div class="set-group">CONNECTIONS HIDING IN PLAIN SIGHT</div>`;
  const hidden = [
    [intelHas('zuma_cluster'), 'Six entities with different owners shared one office: Suite 4B, Zuma Court.'],
    [intelHas('so_plate_match'), 'The car at the Zuma Court handover was the same pool car that visited Lekki before the raid.'],
    [intelHas('reg_ca'), 'C.A. Consulting was incorporated on 14 March 2019 — the month Adaeze took command of the unit.'],
    [!!d.flagged.kc_call_control, 'CONTROL always called at seven. So did the Voice.'],
    [!!d.flagged.musa_ph_hotel, "Musa's own camera put him in Asaba."],
    [!!d.flagged.bu_ph_gate, 'The burner held a photo of the blue gate on Akintola Close, weeks before the tower trace.'],
    [intelHas('reg_silverline'), 'The fake Asaba assault story came out of the same office.'],
  ];
  h += hidden.map(([got,t])=>`<div class="rv-line ${got?'ok':''}">${got?'✔':'·'} ${esc(t)}${got?'':' <span class="dim">You never found this.</span>'}</div>`).join('');
  h += `<div class="set-group">DECISIONS THAT CHANGED THE STORY</div>`;
  const dec = [];
  if(d.custodyAsk) dec.push(d.custodyAsk === 'gave' ? 'You gave her the ledger. Page 14 never came back.' : 'You kept the ledger in the exhibit room.');
  if(d.order) dec.push({ comply:'You left the Engineer alone when she asked.', quiet:'You investigated her source behind her back.', confront:'You asked her about the Engineer to her face. She changed every phone that night.', leak:'You leaked the Engineer to the press. He vanished.' }[d.order]);
  if(d.press) dec.push({ bodycam:'You released the Asaba body-cam.', quiet:'You stayed silent about the Asaba story.', trace:'You traced the Asaba story to its source.' }[d.press]);
  WARRANTS.forEach(w=>{ const r = d.warrants[w.id]; dec.push(`${w.name}: ${!r ? 'never applied' : r.status === 'granted' ? 'granted' + (r.route === 'commander' ? ' — through her office' : r.route === 'zonal' ? ' — through Zonal, behind her back' : '') : r.status === 'skipped' ? 'went in on exigency' : r.refused ? 'refused, then missed' : r.status}.`); });
  if(d.court) dec.push(`The court found her guilty on ${d.court.proven.length} of four counts.`);
  dec.push(`She read you as: ${STYLE_NAME[st]}.`);
  h += dec.map(t=>`<div class="rv-line">${esc(t)}</div>`).join('');
  return h;
}
function openReview(then){
  let ov = document.getElementById('screen-review');
  if(!ov){ ov = document.createElement('div'); ov.className = 'overlay'; ov.id = 'screen-review'; document.getElementById('game-root').appendChild(ov); }
  ov.innerHTML = `<div class="overlay-bg"></div><div class="settings-frame review-frame">
    <div class="settings-head"><h2>CASE REVIEW</h2></div><div class="settings-body">${renderReviewHTML(false)}</div>
    <div class="settings-foot"><button class="btn primary" id="btn-review-done">FINISH ▶</button></div></div>`;
  showOverlay('screen-review');
  ov.querySelector('#btn-review-done').addEventListener('click', ()=>{ if(then) then(); });
}
