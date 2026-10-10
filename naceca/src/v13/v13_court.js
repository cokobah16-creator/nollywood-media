/* =========================================================================
   NACECA · v13 court — FRN v. Cdr. Adaeze & 2 Ors, Federal High Court, Benin
   After a proven or contested finale, the case goes to trial. Not a
   courtroom simulator: one exhibit at a time, the defence objects, you
   answer. How you handled the evidence decides what survives. Then: the
   post-credits case review ("Evidence discovered: 78%").
   Integration (design §3, A2, A5, A6, A8, A11):
   - the trial carries the beta's finale charge sheet, V12.accused('voice'):
     a wrong name is a public arrest the defence opens with; the picks filed
     against the wrong person start at half weight; METHOD and MONEY move the
     counts; a proven, all-right sheet always convicts on the main count.
   - warrant objections come from V12.warrantState (signed: none · exigent:
     'warrantless', answered under ss.14–15 · w_cdr 'none': no court order ·
     'pending': none); beta-contested exhibits get an honest objection.
   - Senior Agent (default): every answer is open; reaching for something you
     don't hold costs patience. Recruit: as delivered ('not in your file').
   - the review reads filed records only (charge sheets, warrants, branches).
   - Esc never drops the trial (v13Modal); a replayed M8 gets a fresh trial.
   Everything here is scoped to #screen-court / #screen-review / .v13-review.
   ========================================================================= */

ACHIEVEMENTS.push(
  { id:'one_office',   name:'One Office',          desc:'Find the entities sharing one desk in Wuse II.' },
  { id:'four_billion', name:'Follow the Money',    desc:'Trace the whole ₦5bn network from a ₦150,000 alert.' },
  { id:'cover_held',   name:'Obinna Anyanwu',      desc:'Walk out of Apex with your cover intact.' },
  { id:'clean_chain',  name:'Clean Chain',         desc:'Every exhibit you tendered was admitted.' },
);

/* ---------------- small helpers (own names: the v13 files share one global scope) ---------------- */
const ctEsc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const ctIco = n => (typeof icon === 'function' ? icon(n) : '');
const ctRecruit = () => typeof isRecruit === 'function' && isRecruit();
const ctV12 = () => window.V12 || {};
const ctAcc = c => { const V = ctV12(); try{ return typeof V.accused === 'function' ? V.accused(c) : ((S.game.accusations || {})[c] || null); }catch(e){ return null; } };
const ctCase = c => (window.CW && CW.CASES && CW.CASES[c]) || null;
// the beta's option names, as words (its Lagos money line is written with arrow glyphs)
const ctOptName = (c, k, id) => { let n = id || '—'; try{ if(window.CW && typeof CW.optName === 'function') n = CW.optName(c, k, id); }catch(e){} return String(n).replace(/\s*[\u2190-\u21FF]\s*/g, ' to '); };
const ctVal = (v, ...a) => typeof v === 'function' ? v(...a) : v;
const ctItems = () => (typeof INTEL_ITEMS !== 'undefined' ? INTEL_ITEMS : {});
const ctHas = id => { try{ return typeof intelHas === 'function' ? intelHas(id) : (S.game.evidence || []).some(e => e.id === id); }catch(e){ return false; } };
const ctTobiAlive = () => { const a = (S.game.moralChoices || {}).asaba; return a === 'rescue' || (a === 'chase' && !S.game._asabaHostageLost); };

/* the warrant record the court and the review read (design §1/A5; V12.warrantState when the model has it) */
const CT_WARRANT_LABEL = { w_lekki:'Search warrant — Lekki, Old GRA', w_asaba:'Search warrant — Asaba riverside',
  w_cdr:'Production order — Ugbowo cell records', w_eko:'Search & arrest warrant — Ekosodin' };
function ctWarrant(id){
  const V = ctV12();
  if(typeof V.warrantState === 'function'){ try{ const w = V.warrantState(id); if(w && w.status) return w; }catch(e){ console.warn('[v13] warrantState', e); } }
  const c = { w_lekki:'lagos', w_asaba:'route' }[id];
  if(c){ const r = ctAcc(c); return { id, case:c, status: !r ? 'none' : (r.warrant === 'signed' || r.warrant === 'exigent') ? r.warrant : 'pending' }; }
  const r = ((typeof I === 'function' ? I().warrants : null) || {})[id];
  const st = !r || !r.status ? 'pending' : r.status === 'granted' ? 'signed' : (['signed', 'exigent', 'none'].includes(r.status) ? r.status : 'pending');
  return { id, status:st, route:r && r.route };
}
/* which raid an exhibit came out of, for the warrant objection */
function ctRaidOf(id){
  const meta = ctItems()[id] || {};
  if(meta.inv) return null;
  return ({ m3:'w_lekki', m6:'w_asaba', m8:'w_eko' })[meta.m] || (meta.m === 'm5' ? 'shrine' : null);
}

/* what a defence lawyer would say about an exhibit.
   With the warrant reader in the model (V12.warrantState), intelItemFlaws already follows §A6.
   Without it (an older model), its own warrant flaws predate the board: rebuild them from the filed records. */
function courtFlaws(id){
  let fl = [];
  try{ fl = (typeof intelItemFlaws === 'function' ? intelItemFlaws(id) : []) || []; }catch(e){ fl = []; }
  if(typeof ctV12().warrantState === 'function') return fl.slice();
  const meta = ctItems()[id] || {};
  fl = fl.filter(f => f.k !== 'noorder' && !(f.k === 'warrantless' && meta.m !== 'm5'));
  const raid = ctRaidOf(id);
  if(raid && raid !== 'shrine' && ctWarrant(raid).status === 'exigent'){
    fl.push({ k:'warrantless', w:20, txt:'Taken under exigent circumstances, without a warrant' });
    const c = raid === 'w_lekki' ? 'lagos' : raid === 'w_asaba' ? 'route' : null, C = c && ctCase(c), rec = c && ctAcc(c);
    if(C && (C.exigentEv || []).includes(id)){
      const ok = (rec && rec.ok) || {};
      const keep = ((C.methodEv || []).includes(id) && ok.method === false) || ((C.moneyEv || []).includes(id) && ok.money === false);
      if(!keep) fl = fl.filter(f => f.k !== 'contested');      // no double penalty for the exigent entry
    }
  }
  if(['tower_cdr', 'tower_fix', 'inv_engineer'].includes(id) && ctWarrant('w_cdr').status === 'none')
    fl.push({ k:'noorder', w:20, txt:'Pulled from the cabinet without a production order' });
  return fl;
}
/* why a beta-contested exhibit is contested — so the defence says the true reason */
function ctContestReason(id){
  for(const c of ['lagos', 'route']){
    const C = ctCase(c), rec = ctAcc(c), ok = (rec && rec.ok) || {};
    if(!C || !rec) continue;
    if((C.moneyEv || []).includes(id) && ok.money === false) return 'money';
    if((C.methodEv || []).includes(id) && ok.method === false) return 'method';
    if((C.exigentEv || []).includes(id) && rec.warrant === 'exigent') return 'exigent';
  }
  return 'field';
}

/* ---------------- the defence's objections ---------------- */
const COURT = { ex:[], i:0, patience:3, phase:'pre', then:null, half:false, admitted:[], struck:[], cred:{}, creds:[], ci:0, n:1, note:null, patienceNoted:false };
const COURT_PATIENCE = 3;
const COURT_OBJ = {
  tainted:{ say:'Recovered by an officer who took money in that very house, My Lord. Nothing that came out of Lekki can be trusted.',
    opts:[['independent','Argue it would have been found in the search anyway'],['withdraw','Withdraw the exhibit']] },
  s84:{ say:'My Lord, this is computer-generated evidence and there is no certificate under section 84 of the Evidence Act 2011, as amended. Kubor v. Dickson is clear. It is inadmissible.',
    opts:[['cert','Tender the s.84 certificate'],['oral','Call the forensic examiner to explain it'],['withdraw','Withdraw the exhibit']] },
  custody:{ say:'This exhibit left the exhibit room for three days and came back with a page missing. The chain of custody is broken.',
    opts:[['register','Tender the exhibit register as it stands'],['keeper','Call the exhibit keeper — ask who signed it out'],['withdraw','Withdraw the exhibit']] },
  noorder:{ say:'This data was taken without a court order, My Lord. The officer went to the cabinet without one. The prosecution should not profit from its own illegality.',
    opts:[['s14',"Argue sections 14 and 15 — a student's life was at risk"],['deny','Insist no order was needed'],['withdraw','Withdraw the exhibit']] },
  warrantless:{ say:'Seized in a search without a warrant, My Lord. The officer wrote "exigent circumstances" on his own file. The prosecution should not profit from its own illegality.',
    opts:[['s14','Argue sections 14 and 15 — exigent circumstances'],['deny','Insist no warrant was needed'],['withdraw','Withdraw the exhibit']] },
  inducement:{ say:'This witness was promised leniency. His word was for sale, and he sold it to the prosecution.',
    opts:[['corroborate','Point to what corroborates him'],['trust','Ask the court to believe him'],['withdraw','Withdraw the witness']] },
  accomplice:{ say:"Mr. Onuoha kept the syndicate's books, My Lord. He is an accomplice. His evidence needs corroboration.",
    opts:[['corroborate','Point to the money trail that corroborates him'],['trust','Ask the court to believe a victim'],['withdraw','Withdraw the witness']] },
  hearsay:{ say:'A logbook written by a gateman who is not before this court. That is hearsay.',
    opts:[['witness','Call the estate manager who kept it'],['tender','Tender the logbook on its own'],['withdraw','Withdraw it']] },
  photocopy:{ say:'These are printouts. A photocopy of a public record is not the record.',
    opts:[['ctc','Tender certified true copies from the CAC'],['portal','Explain they were printed from the CAC portal'],['withdraw','Withdraw them']] },
  ident:{ say:'Photographs from a van across the street at dusk, a blur in a back seat. The prosecution cannot say whose car that is.',
    opts:[['plate','Tender the plate log against the motor-pool register'],['look','Ask the court to look closer'],['withdraw','Withdraw them']] },
  deception:{ say:'An officer lied his way into a law office under a false name. This was obtained by deception.',
    opts:[['s14','Argue sections 14 and 15 — improperly obtained is not inadmissible'],['deny','Deny the officer was undercover'],['withdraw','Withdraw it']] },
  contested:{ say:"The prosecution's own officer botched this check in the field. It is contested, My Lord, and it should carry no weight.",
    opts:[['explain','Call the officer to explain exactly what went wrong'],['withdraw','Withdraw it']] },
  none:{ say:'No objection, My Lord — though the defence will address its weight.', opts:[['tender','Tender it']] },
};
/* the objection as it is actually put, for this exhibit */
function courtObjection(x){
  const base = COURT_OBJ[x.k] || COURT_OBJ.none;
  let say = base.say, opts = base.opts.slice();
  if(x.k === 'warrantless'){
    const why = { w_lekki:'a child in the house and the drives being wiped', w_asaba:'a hostage in a burning warehouse', w_eko:'a student held inside that house' }[x.raid];
    if(x.raid === 'shrine'){
      say = 'Taken from a shrine entered by force, with no warrant, My Lord. The prosecution should not profit from its own illegality.';
      opts = [['s14','Argue sections 14 and 15 — what it proves outweighs how it was found'], base.opts[1], base.opts[2]];
    } else if(why) opts = [['s14', `Argue sections 14 and 15 — exigent circumstances: ${why}`], base.opts[1], base.opts[2]];
  }
  if(x.k === 'contested'){
    if(x.why === 'money'){ say = 'Your own charge sheet put this money somewhere else, My Lord. The prosecution filed one story and now tenders another.'; opts = [['explain','Concede the charge sheet was wrong — tender it for what it is'], base.opts[1]]; }
    else if(x.why === 'method'){ say = 'Your own charge sheet described a different scheme, My Lord. This exhibit was filed against it.'; opts = [['explain','Concede the charge sheet was wrong — tender it for what it is'], base.opts[1]]; }
    else if(x.why === 'exigent') say = 'Seized in a raid the officer entered without a warrant. It is contested, My Lord, and it should carry little weight.';
  }
  if(x.k === 'accomplice' && x.namedOnSheet) say = "Mr. Onuoha kept the syndicate's books, My Lord — the prosecution's own charge sheet named him the route's principal. He is an accomplice. His evidence needs corroboration.";
  if(x.k === 'inducement' && x.namedOnSheet) say = 'This witness was promised leniency — and the prosecution\'s own charge sheet named him the route\'s principal. His word was for sale, and he sold it to the prosecution.';
  return { say, opts };
}
const COURT_WEAK = { tainted:'Recovered where the officer took a bribe', contested:'Contested in the field', custody:'Chain of custody broken', noorder:'No production order',
  warrantless:'No warrant: taken under exigent circumstances', inducement:'Witness promised leniency', accomplice:'Witness kept the books — an accomplice',
  hearsay:'The gateman is not a witness', photocopy:'Printouts, not certified copies', ident:'Dusk photos from a van — identification', deception:'Obtained undercover' };
function courtWeak(x){
  if(x.k === 'contested') return { money:'Contested: your charge sheet put the money elsewhere', method:'Contested: your charge sheet named a different scheme', exigent:'Contested: seized without a warrant' }[x.why] || COURT_WEAK.contested;
  if(x.k === 'warrantless' && x.raid === 'shrine') return 'No warrant: the shrine was entered by force';
  return COURT_WEAK[x.k] || null;
}

function itemObjection(id, dflt){
  const order = ['tainted','s84','custody','contested','noorder','warrantless','inducement'];
  const fl = courtFlaws(id).sort((a,b)=>order.indexOf(a.k)-order.indexOf(b.k));
  return fl.length ? fl[0].k : (dflt || 'none');
}
/* the statement each witness exhibit is weighed against (A8) */
const CT_WITNESS_ST = { musa_statement:'st_musa', tobi:'st_tobi' };
function ctVerdictScore(stId, c){
  if(typeof intelVerdictScore === 'function'){ try{ return intelVerdictScore(stId, c.id); }catch(e){ return null; } }
  const r = (((typeof I === 'function' ? I().st : null) || {})[stId] || {})[c.id];
  if(r == null) return null;
  const v = typeof r === 'object' ? r.verdict : r;
  if(!v) return null;
  return typeof stExpected === 'function' ? v === stExpected(c) : null;
}
function ctWitnessLied(stId){
  const st = (typeof STATEMENTS !== 'undefined' ? STATEMENTS : []).find(s => s.id === stId);
  return !!(st && st.claims.some(c => ctVerdictScore(stId, c) === false));
}

function courtExhibits(){
  const m = S.game.moralChoices || {}, X = [], th = id => !!(window.V12 && V12.theory && V12.theory(id));
  const rec = ctAcc('voice'), wrong = !!(rec && rec.ok && rec.ok.suspect === false), picks = (rec && rec.picks) || [];
  const route = ctAcc('route'), routeWrong = route && route.ok && route.ok.suspect === false ? route.suspect : null;
  const add = (id, name, sup, k) => {
    const x = { id, name, sup:Object.assign({}, sup), k, cap:1, raid:ctRaidOf(id) };
    if(k === 'contested') x.why = ctContestReason(id);
    if(wrong && picks.includes(id)){ x.cap = 0.5; x.wrongPick = true; }       // "FAILS: built against the wrong person"
    if(CT_WITNESS_ST[id] && ctWitnessLied(CT_WITNESS_ST[id])) x.lied = true;
    if((id === 'tobi' && routeWrong === 'tobi') || (id === 'musa_statement' && routeWrong === 'musa')) x.namedOnSheet = true;
    X.push(x);
  };
  if(m.tower === 'hold' && ctHas('tower_cdr')) add('tower_cdr', 'Ugbowo cabinet timing data', { c1:1, c2:1 }, itemObjection('tower_cdr'));
  if(ctHas('fin_recording'))     add('fin_recording', 'Recording of the evening ransom call', { c1:2 }, itemObjection('fin_recording'));
  if(ctHas('fin_courier_phone')) add('fin_courier_phone', 'The courier\'s phone — one saved number, "C"', { c1:1, c2:1 }, itemObjection('fin_courier_phone'));
  if(ctHas('bodycam_eko'))       add('bodycam_eko', 'Body-cam — her own words in the yard', { c1:1, c2:1, c4:1 }, itemObjection('bodycam_eko'));
  if(ctHas('fin_drive'))         add('fin_drive', "Osas's flash drive — payroll copies", { c3:1, c4:1 }, itemObjection('fin_drive'));
  if(ctHas('co_madam') && th('t_voice')) add('co_madam', '"Tell Madam it\'s clean" — the phone from Mushin', { c2:1 }, itemObjection('co_madam'));
  if(ctHas('obi_notebook') && th('t_madam')) add('obi_notebook', 'Obi\'s notebook — Friday payments to "C.A."', { c3:1 }, itemObjection('obi_notebook'));
  if(m.asaba === 'rescue')       add('tobi', 'Tobi Onuoha — testimony', { c2:1, c3:1 }, 'accomplice');
  if(ctHas('musa_statement'))    add('musa_statement', 'Musa — testimony about "Madam" and the Engineer', { c2:1 }, itemObjection('musa_statement'));
  if(ctHas('ransom_ledger'))     add('ransom_ledger', 'The ransom route ledger', { c2:1, c3:1 }, itemObjection('ransom_ledger'));
  if(ctHas('inv_gatehouse'))     add('inv_gatehouse', 'Lekki estate gatehouse log', { c4:1 }, itemObjection('inv_gatehouse', 'hearsay'));
  if(ctHas('inv_ca'))            add('inv_ca', 'C.A. Consulting — CAC record and money trail', { c3:2, c4:1 }, itemObjection('inv_ca', 'photocopy'));
  if(ctHas('inv_engineer'))      add('inv_engineer', "The Engineer's call log", { c2:1, c4:1 }, itemObjection('inv_engineer'));
  if(ctHas('inv_stakeout'))      add('inv_stakeout', 'Zuma Court stakeout photographs', { c2:1, c4:1 }, itemObjection('inv_stakeout', 'ident'));
  if(ctHas('inv_invoice'))       add('inv_invoice', 'Apex invoice — C.A. Consulting to the Foundation', { c3:1 }, itemObjection('inv_invoice', 'deception'));
  return X;
}
/* what's actually in the prosecution's file — Recruit greys out what you don't hold (Senior: every answer is open) */
function courtCanUse(ex, choice){
  const d = I(), it = (d.items || {})[ex.id] || {};
  if(choice === 'cert') return !!it.cert;
  if(choice === 'ctc') return !!(d.reg && d.reg.ctc && d.reg.ctc.ca);
  if(choice === 'plate') return ctHas('so_plate');
  if(choice === 'corroborate') return ex.k === 'inducement' ? (ctHas('musa_bank_bw') || ctHas('musa_call_engineer') || ctHas('ransom_ledger')) : (ctHas('n_charity') || ctHas('n_ca') || ctHas('reg_ca') || ctHas('fin_drive'));
  return true;
}
function courtRule(ex, choice){
  const d = I(), it = (d.items || {})[ex.id] || {};
  const lose = (n, t) => { COURT.patience = Math.max(0, COURT.patience - n); return { q:0, t, out:'struck' }; };
  const ok = (q, t) => ({ q, t, out:'admitted' });
  switch(ex.k){
    case 'tainted':
      if(choice === 'independent'){ COURT.patience = Math.max(0, COURT.patience - 1); return ok(0.5, 'The judge lets it in, barely: it would have been found in the search anyway. It will carry little weight.'); }
      break;
    case 's84':
      if(choice === 'cert') return it.cert ? ok(1, 'Overruled. The certificate is on file.') : lose(1, 'You reach for a certificate that was never signed. Sustained.');
      if(choice === 'oral') return lose(1, 'Sustained. Oral evidence cannot cure a missing certificate.');
      break;
    case 'custody':
      if(choice === 'keeper'){ ex.sup = Object.assign({}, ex.sup, { c4:(ex.sup.c4||0)+1 }); return ok(1, 'The keeper reads the entry aloud: signed out by the Office of the Commander. The defendant created the gap she now complains of. Overruled — and noted.'); }
      if(choice === 'register') return lose(1, 'The register shows a three-day gap. Sustained.');
      break;
    case 'noorder':
      if(choice === 's14') return ok(0.5, 'Admitted under sections 14 and 15, given the risk to life. The court will decide what weight it carries.');
      if(choice === 'deny') return lose(1, 'Sustained. An order was plainly required.');
      break;
    case 'warrantless':
      if(choice === 's14'){
        if(ex.raid === 'w_eko') return ok(1, 'A student was being held inside that house. The entry was lawful. Overruled.');
        if(ex.raid === 'shrine') return ok(0.5, 'Admitted under sections 14 and 15, with reduced weight. The court notes how the shrine was entered.');
        return ok(0.5, 'Admitted under sections 14 and 15. The court accepts the urgency, and will decide what weight it carries.');
      }
      if(choice === 'deny') return lose(1, 'Sustained. A warrant was plainly required.');
      break;
    case 'inducement':
      if(choice === 'corroborate') return (ctHas('musa_bank_bw') || ctHas('musa_call_engineer') || ctHas('ransom_ledger')) ? ok(1, 'His phone and the ledger say what he says. Admitted.') : lose(1, 'There is nothing before the court that corroborates him.');
      if(choice === 'trust') return ok(0.5, 'The court will hear him — and treat what he says with caution.');
      break;
    case 'accomplice':
      if(choice === 'corroborate') return (ctHas('n_charity') || ctHas('n_ca') || ctHas('reg_ca') || ctHas('fin_drive')) ? ok(1, 'The money runs exactly where he says it ran. Admitted.') : lose(1, 'You have nothing to put next to him.');
      if(choice === 'trust') return ok(0.5, 'The court will hear him, with caution.');
      break;
    case 'hearsay':
      if(choice === 'witness') return ok(1, 'The estate manager identifies the book, the entry and the car. Admitted.');
      if(choice === 'tender') return lose(1, 'Sustained. Nobody here can speak to it.');
      break;
    case 'photocopy':
      if(choice === 'ctc') return (d.reg && d.reg.ctc && d.reg.ctc.ca) ? ok(1, 'Certified true copies, stamped by the Commission. Admitted.') : lose(1, 'You never requested certified copies. Sustained.');
      if(choice === 'portal') return lose(1, 'Sustained. Bring the certified record.');
      break;
    case 'ident':
      if(choice === 'plate') return ctHas('so_plate') ? ok(1, 'LND 590 XA. The motor-pool register shows who had that car that night. Admitted.') : lose(1, 'You never logged the plate. Sustained.');
      if(choice === 'look') return lose(1, 'The court looks. It sees a car.');
      break;
    case 'deception':
      if(choice === 's14') return ok(1, 'Sections 14 and 15. A false name is not a crime that taints a document. Admitted.');
      if(choice === 'deny') return lose(2, "Your own operational report says otherwise. The judge's face closes.");
      break;
    case 'contested':
      if(choice === 'explain') return ok(0.5, (ex.why === 'money' || ex.why === 'method') ? 'The prosecution concedes its charge sheet was wrong. Admitted — for what it is worth.' : 'The officer is honest about what went wrong. Admitted — for what it is worth.');
      break;
    case 'none':
      return ok(1, 'No objection taken.');
  }
  return { q:0, t:'Withdrawn. The prosecution moves on.', out:'withdrawn' };
}

/* ---------------- the charge sheet in court (A8 / §3) ---------------- */
/* how the finale charge sheet moves the counts: wrong lines lower them, right ones are a small floor */
function courtSheetEffects(){
  const rec = ctAcc('voice'), out = [];
  if(!rec || !rec.ok) return out;
  const right = !!rec.ok.suspect, fin = (S.game.moralChoices || {}).finale;
  if(rec.method){
    if(rec.ok.method === false) out.push({ counts:['c2','c4'], d:-1, ok:false, t:'Motive on your charge sheet fails: the defence takes it apart.' });
    else if(right) out.push({ counts:['c2','c4'], d:+0.5, ok:true, t:'Motive on your charge sheet holds: she shielded the ring from inside.' });
  }
  if(rec.money){
    if(rec.ok.money === false) out.push({ counts:['c3'], d:-1, ok:false, t:'Money trail on your charge sheet fails: the payroll goes unexplained.' });
    else if(right) out.push({ counts:['c3'], d:+0.5, ok:true, t:'Money trail on your charge sheet holds: "C.A." was paid every Friday.' });
  }
  if(fin === 'proven' && right && rec.ok.method !== false && rec.ok.money !== false && rec.method && rec.money)
    out.push({ counts:['c1'], floor:2, ok:true, t:'Every line of your charge sheet held, and the case was proven on the night: the main count stands.' });
  return out;
}

/* ---------------- flow ---------------- */
function ensureCourt(){
  let ov = document.getElementById('screen-court');
  if(ov) return ov;
  ov = document.createElement('div'); ov.className = 'overlay'; ov.id = 'screen-court';
  ov.innerHTML = `<div class="overlay-bg"></div>
    <div class="v13-sheet ct-doc" role="dialog" aria-modal="true" aria-labelledby="court-title">
      <header class="ct-head" id="court-head"></header>
      <div class="ct-scroll" id="court-body"></div>
      <footer class="ct-foot" id="court-foot"></footer>
    </div>`;
  document.getElementById('game-root').appendChild(ov);
  ov.addEventListener('click', e=>{ const b = e.target.closest('[data-ct]'); if(b && !b.disabled) courtAct(b.dataset.ct, b.dataset); });
  return ov;
}
/* Esc never drops the trial: the shared modal stack (v13_intel, A2) ignores it on these screens */
function ctModal(id, resume){ if(typeof v13Modal === 'function'){ try{ v13Modal(id, { onEsc:null, resume }); }catch(e){ console.warn('[v13] modal', e); } } }
function ctModalEnd(id){ if(typeof v13ModalEnd === 'function'){ try{ v13ModalEnd(id); }catch(e){ console.warn('[v13] modal end', e); } } }
// fallback for a build without the modal stack: swallow Esc while the trial or the review is up
window.addEventListener('keydown', e=>{
  if(e.key !== 'Escape' && e.code !== 'Escape') return;
  if(typeof v13Modal === 'function') return;
  if(document.querySelector('#screen-court.show, #screen-review.show')){ e.preventDefault(); e.stopImmediatePropagation(); }
}, true);

function courtResume(){ ensureCourt(); if(typeof showHUD === 'function') showHUD(false); showOverlay('screen-court'); renderCourt(); }
function openCourt(then){
  ensureCourt();
  const rec = ctAcc('voice'), creds = [];
  if(rec && rec.ok && rec.ok.suspect === false) creds.push('wrong');
  if((S.game.moralChoices || {}).arrest === 'bribe') creds.push('bribe');
  Object.assign(COURT, { ex:courtExhibits(), i:0, patience:COURT_PATIENCE, phase:'pre', then, half:false, admitted:[], struck:[], cred:{}, creds, ci:0, n:1, note:null, patienceNoted:false, lastRuling:null });
  if(typeof showHUD === 'function') showHUD(false);
  if(typeof musicForScene === 'function') musicForScene('investigation');
  ctClearToast();
  showOverlay('screen-court');
  ctModal('screen-court', courtResume);
  renderCourt();
}
// a toast left over from the aftermath would sit on the court record (later ones go to the top: v13_court.css)
function ctClearToast(){ const t = document.getElementById('toast'); if(t) t.classList.remove('show'); }
const ctPat = () => Math.max(0, Math.min(COURT_PATIENCE, COURT.patience));
function courtHead(){
  return `<div class="ct-crest">${ctIco('scales')}<span>IN THE FEDERAL HIGH COURT OF NIGERIA · BENIN JUDICIAL DIVISION</span></div>
    <h2 class="ct-title" id="court-title">FRN v. CDR. ADAEZE &amp; 2 ORS</h2>
    <div class="ct-meta"><span class="v13-mono">CHARGE NO. FHC/B/41C/2026</span><span class="ct-pat" aria-label="Judge's patience ${ctPat()} of ${COURT_PATIENCE}">PATIENCE <b class="v13-mono">${ctPat()}/${COURT_PATIENCE}</b></span></div>`;
}
const ctFoot = (act, label) => `<button class="v13-btn primary ct-go" data-ct="${act}">${ctEsc(label)}${ctIco('next')}</button>`;
const CT_DEF = 'CHIEF ABIODUN FADEYI, SAN · FOR THE DEFENCE';
function ctSheetSummary(){
  const rec = ctAcc('voice'); if(!rec) return '';
  const ok = rec.ok || {}, right = !!ok.suspect;
  const word = (k)=>{
    if(k !== 'suspect' && right === false && ok[k]) return '<span class="v13-dim">SET ASIDE</span>';
    return ok[k] ? `<span class="v13-mark-ok">${ctIco('check')}HOLDS</span>` : `<span class="v13-mark-bad">${ctIco('cross')}FAILS</span>`;
  };
  const row = (k, lbl) => rec[k] ? `<div class="ct-cs-row"><span class="ct-cs-k">${lbl}</span><span class="ct-cs-v">${ctEsc(ctOptName('voice', k, rec[k]))}</span><span class="ct-cs-s">${word(k)}</span></div>` : '';
  return `<div class="ct-sec-h">YOUR CHARGE SHEET · THE VOICE</div><div class="ct-cs">${row('suspect', 'THE VOICE')}${row('method', 'METHOD')}${row('money', 'MONEY TRAIL')}</div>`;
}
function renderCourt(){
  const head = document.getElementById('court-head'), body = document.getElementById('court-body'), foot = document.getElementById('court-foot');
  if(!body || !head || !foot) return;
  head.innerHTML = courtHead();
  if(COURT.phase === 'pre'){
    const d = I();
    const slots = typeof certSlotsLeft === 'function' ? certSlotsLeft('m8') : 0;
    body.innerHTML = `<div class="ct-sec-h">PRE-TRIAL · THE PROOF OF EVIDENCE</div>
      <p class="ct-lead">NACECA Legal files tomorrow. <span class="v13-mono">${COURT.ex.length}</span> exhibit${COURT.ex.length===1?'':'s'} to tender.${slots > 0 ? ` Digital Forensics can still certify the Ekosodin material — <span class="v13-mono">${slots}</span> item${slots===1?'':'s'}.` : ''}</p>` +
      ctSheetSummary() +
      `<div class="ct-sec-h">THE EXHIBITS</div>` +
      (COURT.ex.length ? `<ol class="ct-exlist">` + COURT.ex.map((x, i)=>{ const it = (d.items || {})[x.id], meta = ctItems()[x.id];
        let cert = '';
        if(meta && meta.e){
          if(it && it.cert) cert = `<span class="v13-mark-ok">${ctIco('check')}S.84 CERTIFICATE ON FILE</span>`;
          else if(it && typeof certWindowOpen === 'function' && certWindowOpen(x.id) && typeof certSlotsLeft === 'function' && certSlotsLeft(it.m) > 0) cert = `<button class="v13-btn" data-ct="cert" data-id="${ctEsc(x.id)}">${ctIco('stamp')}SIGN s.84 · <span class="v13-mono">${certSlotsLeft(it.m)}</span> LEFT</button>`;
          else cert = `<span class="v13-mark-bad">${ctIco('cross')}NO S.84 CERTIFICATE</span>`;
        }
        const weak = [courtWeak(x), x.wrongPick ? 'Filed against the wrong person on your charge sheet' : null].filter(Boolean);
        return `<li class="ct-exrow"><span class="ct-no v13-mono">${String(i + 1).padStart(2, '0')}</span><div class="ct-exbody"><div class="ct-exname">${ctEsc(x.name)}</div>${weak.map(w => `<div class="ct-weak v13-warn">Weak point: ${ctEsc(w)}</div>`).join('')}${cert ? `<div class="ct-cert">${cert}</div>` : ''}</div></li>`; }).join('') + `</ol>`
        : `<p class="ct-lead">Nothing you hold will go before the court.</p>`) +
      (ctHas('inv_ca') && !(d.reg && d.reg.ctc && d.reg.ctc.ca) ? `<div class="ct-note">The C.A. Consulting record is a printout. <button class="v13-btn" data-ct="ctc">${ctIco('doc')}REQUEST CERTIFIED TRUE COPY</button></div>` : '');
    foot.innerHTML = ctFoot('begin', '"ALL RISE."');
    return;
  }
  if(COURT.phase === 'cred'){
    const kind = COURT.creds[COURT.ci];
    const rec = ctAcc('voice'), C = ctCase('voice');
    const nm = rec ? ctOptName('voice', 'suspect', rec.suspect) : 'someone else';
    const held = rec && C && C.held ? ctVal(C.held[rec.suspect]) : '';
    // the beta's own line for that arrest ("On your word, Sgt. Uche was arrested at HQ…"), in the defence's mouth
    let arrest = held && /^On your word, /.test(held) ? held.split(/(?<!\b(?:Sgt|Engr|Insp|Cdr|Dr|Mr|Mrs|Barr))\.\s+/)[0].replace(/\.?$/, '.').replace(/^On your word, /, "on this officer's word, ") : `on this officer's word, ${nm} was arrested.`;
    if(!/as the Voice/.test(arrest)) arrest = arrest.replace(/\.$/, '') + ', as the Voice.';
    const say = kind === 'wrong'
      ? `Before the prosecution begins, My Lord: ${arrest} Now the same officer says it was the defendant. Which night was he right?`
      : 'Before the prosecution begins, My Lord: the investigating officer took money from Chief Obi in Lekki. The defendant knew. Ask him.';
    const opts = kind === 'wrong'
      ? [['admit', 'Admit it. The first accusation was wrong — the evidence is not.'], ['deny', 'Insist the arrest was justified.']]
      : [['admit', 'Admit it. Let the evidence speak for itself.'], ['deny', 'Deny it.']];
    body.innerHTML = `<div class="ct-sec-h">THE DEFENCE OPENS</div><div class="ct-who">${CT_DEF}</div>
      <blockquote class="ct-say">"${ctEsc(say)}"</blockquote>
      <div class="ct-opts">${opts.map(([v, l], i) => `<button class="ct-opt" data-ct="cred" data-v="${v}"><span class="ct-n v13-mono">${i + 1}</span><span>${ctEsc(l)}</span></button>`).join('')}</div>`;
    foot.innerHTML = '';
    return;
  }
  if(COURT.phase === 'ex'){
    const x = COURT.ex[COURT.i];
    if(!x){ COURT.phase = 'judgment'; renderCourt(); return; }
    // a witness your own file has down as lying: the defence starts there (A8), once
    let first = '';
    if(x.lied){
      if(!x.liedDone){ x.liedDone = true; COURT.patience = Math.max(0, COURT.patience - 1); head.innerHTML = courtHead(); }
      first = `<blockquote class="ct-say">"Your own officer's file says this witness lied to you."</blockquote><p class="ct-aside v13-dim">The judge makes a note.</p>`;
    }
    const o = courtObjection(x), rec = ctRecruit();
    const note = COURT.note ? `<p class="ct-note ${COURT.note.bad ? 'v13-warn' : ''}">${ctEsc(COURT.note.t)}</p>` : '';
    COURT.note = null;
    body.innerHTML = note + `<div class="ct-sec-h">EXHIBIT <span class="v13-mono">${COURT.i+1}</span> OF <span class="v13-mono">${COURT.ex.length}</span></div>
      <div class="ct-exname ct-big">${ctEsc(x.name)}</div>
      <div class="ct-who">${CT_DEF}</div>${first}<blockquote class="ct-say">"${ctEsc(o.say)}"</blockquote>
      <div class="ct-opts">${o.opts.map(([k,l], i)=>{ const okUse = !rec || courtCanUse(x, k);
        return `<button class="ct-opt" data-ct="resp" data-v="${k}" ${okUse?'':'disabled'}><span class="ct-n v13-mono">${i + 1}</span><span>${ctEsc(l)}${okUse?'':' — not in your file'}</span></button>`; }).join('')}</div>`;
    foot.innerHTML = '';
    return;
  }
  if(COURT.phase === 'ruling'){
    const r = COURT.lastRuling;
    const word = r.q >= 1 ? `<span class="v13-mark-ok">${ctIco('check')}ADMITTED</span>`
      : r.q > 0 ? `<span class="v13-mark-ok">${ctIco('check')}ADMITTED · REDUCED WEIGHT</span>`
      : r.out === 'struck' ? `<span class="v13-mark-bad">${ctIco('cross')}SUSTAINED · STRUCK OUT</span>` : `<span class="v13-mark-bad">${ctIco('cross')}WITHDRAWN</span>`;
    body.innerHTML = `<div class="ct-sec-h">THE RULING</div><div class="ct-exname ct-big">${ctEsc(r.name)}</div>
      <div class="ct-ruling"><div class="ct-rword">${word}${r.q > 0 ? ` <span class="ct-pno v13-mono">EXHIBIT P${r.no}</span>` : ''}</div>
      ${r.t ? `<p>${ctEsc(r.t)}</p>` : ''}
      ${r.why ? `<p class="v13-warn">${ctEsc(r.why)}</p>` : ''}</div>`;
    foot.innerHTML = ctFoot('next', COURT.i + 1 >= COURT.ex.length ? 'TO JUDGMENT' : 'NEXT EXHIBIT');
    return;
  }
  if(COURT.phase === 'judgment'){
    const res = courtJudgment();
    body.innerHTML = `<div class="ct-sec-h">JUDGMENT</div>` +
      COURT_COUNTS.map(c=>{ const w = res.w[c.id] || 0, p = res.proven.includes(c.id);
        return `<div class="ct-count"><div class="ct-cname">${ctEsc(c.name)}</div>
          <span class="v13-stamp ${p ? 'good' : ''}">${p ? 'GUILTY' : 'NOT PROVEN'}</span>
          <div class="ct-cbar"><div class="v13-meter" role="presentation"><i style="width:${Math.round(Math.min(1, w / 2) * 100)}%"></i></div><span class="ct-cw v13-mono">${(Math.round(w * 10) / 10).toFixed(1)} / 2.0</span></div></div>`; }).join('') +
      (res.adj.length ? `<div class="ct-sec-h">YOUR CHARGE SHEET, BEFORE THE COURT</div>` + res.adj.map(a => `<p class="ct-adj"><span class="${a.ok ? 'v13-mark-ok' : 'v13-mark-bad'}">${a.ok ? ctIco('check') : ctIco('cross')}${a.ok ? 'HOLDS' : 'FAILS'}</span> ${ctEsc(a.t)} <span class="v13-mono v13-dim">${ctEsc(a.counts.map(id => (COURT_COUNTS.find(c => c.id === id) || {}).short || id).join(', '))}${a.floor ? ' · stands' : ` · ${a.d > 0 ? '+' : '−'}${Math.abs(a.d).toFixed(1)}`}</span></p>`).join('') : '') +
      `<p class="ct-verdict">${ctEsc(courtVerdictText(res.proven.length))}</p>
      <p class="ct-tally v13-mono">ADMITTED ${COURT.admitted.length} · STRUCK OUT OR WITHDRAWN ${COURT.struck.length}</p>`;
    foot.innerHTML = ctFoot('end', 'RISE');
  }
}
function courtAct(a, ds){
  if(a === 'cert'){ if(typeof certify === 'function') certify(ds.id); renderCourt(); return; }
  if(a === 'ctc'){ const d = I(); d.reg = d.reg || { found:{}, ctc:{} }; d.reg.ctc = d.reg.ctc || {}; d.reg.ctc.ca = true; renderCourt(); return; }
  if(a === 'begin'){ COURT.phase = COURT.creds.length ? 'cred' : 'ex'; renderCourt(); return; }
  if(a === 'cred'){
    const kind = COURT.creds[COURT.ci];
    COURT.cred[kind] = ds.v;
    if(ds.v === 'admit'){
      COURT.patience = Math.max(0, COURT.patience - 1);
      if(kind === 'bribe') applyEffect({ integrity:+4 });
      COURT.note = { t: kind === 'bribe' ? 'The courtroom goes quiet. The judge notes it. The case goes on.' : 'The judge writes something down. The case goes on.' };
    } else {
      COURT.patience = Math.max(0, COURT.patience - 2); COURT.half = true;
      COURT.note = { bad:true, t: kind === 'bribe' ? 'The defence produces a bank record. Everything you touched now carries less weight.' : 'The defence reads out the arrest report. Everything you touched now carries less weight.' };
    }
    COURT.ci++;
    COURT.phase = COURT.ci < COURT.creds.length ? 'cred' : 'ex';
    renderCourt(); return;
  }
  if(a === 'resp'){
    const x = COURT.ex[COURT.i]; if(!x) return;
    const r = courtRule(x, ds.v);
    let q = Math.min(r.q, x.cap == null ? 1 : x.cap), why = '';
    if(x.cap < 1 && r.q > x.cap) why = 'Filed against the wrong person on your charge sheet: it carries half the weight.';
    if(COURT.half && q > 0.5) q = 0.5;
    if(COURT.patience <= 0 && q > 0.5){
      q = 0.5; COURT.half = true;
      if(!COURT.patienceNoted){ COURT.patienceNoted = true; why = "The judge's patience is gone: everything from here carries less weight."; }
    }
    x.q = q; x.choice = ds.v;
    if(q > 0){ COURT.admitted.push(x); r.no = COURT.n++; } else COURT.struck.push(x);
    COURT.lastRuling = { name:x.name, t:r.t, q, no:r.no, out:r.out, why };
    COURT.phase = 'ruling';
    if(q > 0){ if(typeof sfxComplete === 'function') sfxComplete(); } else if(typeof sfxFail === 'function') sfxFail();
    renderCourt(); return;
  }
  if(a === 'next'){ COURT.i++; COURT.phase = 'ex'; renderCourt(); return; }
  if(a === 'end'){
    const cb = COURT.then; COURT.then = null;
    if(!I().court) courtJudgment();
    if(COURT.struck.length === 0 && COURT.admitted.length > 0 && typeof unlock === 'function') unlock('clean_chain');
    ctModalEnd('screen-court');
    if(typeof saveGame === 'function') saveGame(true);
    if(cb) cb();
  }
}
function courtJudgment(){
  const w = {};
  COURT.admitted.forEach(x=>{ for(const c in x.sup) w[c] = (w[c]||0) + x.sup[c] * x.q; });
  const adj = courtSheetEffects();
  adj.forEach(a => a.counts.forEach(c => { if(a.floor) w[c] = Math.max(w[c] || 0, a.floor); else w[c] = Math.max(0, (w[c] || 0) + a.d); }));
  const proven = COURT_COUNTS.map(c=>c.id).filter(c=>(w[c]||0) >= 2);
  const rec = ctAcc('voice');
  I().court = { w, proven, admitted:COURT.admitted.map(x=>x.id), struck:COURT.struck.map(x=>x.id), cred:Object.assign({}, COURT.cred),
    finale:(S.game.moralChoices || {}).finale || null, wrong:!!(rec && rec.ok && rec.ok.suspect === false), adj:adj.map(a => a.t), at:Date.now() };
  return { w, proven, adj };
}
function courtVerdictText(n){
  if(n === 4) return 'Guilty on all four counts. The court is satisfied beyond reasonable doubt.';
  if(n >= 2) return `Guilty on ${n} of four counts. On the rest, the prosecution's evidence did not reach the standard.`;
  if(n === 1) return 'Guilty on one count. On three, the court acquits. Her lawyers are already smiling.';
  return 'The defence makes a no-case submission. It succeeds. She is discharged — and dismissed from service the same week.';
}
/* the court has sat for this finale (a replayed M8 clears it, below) */
function courtDoneFor(outcome){ const c = I().court; return !!c && (!c.finale || c.finale === outcome); }
/* the epilogue line for Adaeze, once a court has spoken on THIS finale */
function courtEpilogueText(){
  const c = I().court, fin = (S.game.moralChoices || {}).finale;
  if(!c || (fin !== 'proven' && fin !== 'contested') || (c.finale && c.finale !== fin)) return null;
  const n = c.proven.length, tail = ' She has never said who she answered to.';
  if(n === 4) return 'Convicted on all four counts.' + tail;
  if(n >= 2) return `Convicted on ${n} of four counts. Her appeal is pending.` + tail;
  if(n === 1) return 'Convicted on one count, acquitted on three. Dismissed from service.' + tail;
  return 'Discharged at trial on a no-case submission. Dismissed from service the same week.' + tail;
}
/* a replayed M8 is a new night: the old trial (and its verdict) no longer speaks for it */
function courtResetForReplay(){
  const d = I();
  if(d.court){ d.courtLog = (d.courtLog || []).concat([d.court]).slice(-5); d.court = null; }
  d.reviewShown = false;
  if(COURT.then){ COURT.then = null; ctModalEnd('screen-court'); }
}
if(window.V12 && typeof V12.wrap === 'function'){
  V12.wrap('finResetFlags', orig => function(){ const r = orig.apply(this, arguments); try{ courtResetForReplay(); }catch(e){ console.warn('[v13] court reset', e); } return r; });
  // the m8 aftermath: the trial comes before the epilogue
  V12.wrap('nextMissionPreview', orig => function(){
    let h = orig.apply(this, arguments);
    try{
      const o = (S.game.moralChoices || {}).finale;
      if(S.game.currentMission === 'm8' && (o === 'proven' || o === 'contested') && !courtDoneFor(o)) h = String(h).replace('Continue for the epilogue', 'Continue to the trial, then the epilogue');
    }catch(e){}
    return h;
  });
}

/* ---------------- post-credits case review ---------------- */
function ctStatementScore(s, c){
  if(typeof intelVerdictScore === 'function'){ try{ return intelVerdictScore(s.id, c.id) === true; }catch(e){ return false; } }
  return ctVerdictScore(s.id, c) === true;
}
function reviewData(){
  const d = I(), mc = S.game.moralChoices || {}, fl = S.game.flags || {};
  const phones = typeof PHONES !== 'undefined' ? PHONES : [];
  const relClues = phones.flatMap(p=>(p.items || []).filter(c=>c.rel));
  const claims = (typeof STATEMENTS !== 'undefined' ? STATEMENTS : []).flatMap(s=>s.claims.map(c=>({ s, c })));
  const okClaims = claims.filter(({s,c})=>ctStatementScore(s, c));
  const allLeads = Object.values(typeof BRIEFINGS !== 'undefined' ? BRIEFINGS : {}).flatMap(b=>b.leads || []);
  const TH = (window.V12 && V12.OPS_THEORIES) || [];
  const ev = Object.keys(ctItems()).filter(k=>k !== 'bodycam_eko');
  const money = d.money || { traced:{} }, reg = d.reg || { found:{} };
  const parts = [
    { lbl:'Evidence logged', n: ev.filter(k=>ctHas(k)).length, of: ev.length },
    { lbl:'Phone clues flagged', n: relClues.filter(c=>(d.flagged || {})[c.id]).length, of: relClues.length },
    { lbl:'Money traced', n: Object.keys(money.traced || {}).length, of: Object.keys(typeof MONEY_NODES !== 'undefined' ? MONEY_NODES : {}).length },
    { lbl:'Registry records', n: Object.keys(reg.found || {}).length, of: Object.keys(typeof REGISTRY !== 'undefined' ? REGISTRY : {}).length },
    { lbl:'Statements weighed correctly', n: okClaims.length, of: claims.length },
    { lbl:'Theories inked', n: TH.filter(t=>V12.theory(t.id)).length, of: TH.length },
    { lbl:'Leads worked', n: allLeads.filter(l=>(d.leads || {})[l.id]==='done').length, of: allLeads.length },
  ].filter(p => p.of > 0);
  const n = parts.reduce((a,p)=>a+Math.min(p.n, p.of), 0), of = parts.reduce((a,p)=>a+p.of, 0);
  return { d, mc, fl, parts, pct: of ? Math.round(n / of * 100) : 0, relClues };
}
function rvWord(state){
  if(state === 'aside') return '<span class="rv-w v13-dim">SET ASIDE</span>';
  return state ? `<span class="rv-w v13-mark-ok">${ctIco('check')}HOLDS</span>` : `<span class="rv-w v13-mark-bad">${ctIco('cross')}FAILS</span>`;
}
const rvLine = (t, ok) => `<p class="rv-line">${ok === true ? `<span class="rv-m v13-mark-ok">${ctIco('check')}</span>` : ok === false ? `<span class="rv-m v13-mark-bad">${ctIco('cross')}</span>` : '<span class="rv-m"></span>'}<span>${ctEsc(t)}</span></p>`;
/* one filed charge sheet, as the prosecutor reviewed it */
function rvSheet(c){
  const rec = ctAcc(c), label = { lagos:'LAGOS', route:'THE ROUTE', voice:'THE VOICE' }[c];
  if(!rec) return `<div class="rv-cs"><div class="rv-cs-h">${label}</div><p class="rv-line"><span class="rv-m"></span><span>No charge sheet was filed.</span></p></div>`;
  const ok = rec.ok || {};
  const st = k => (c === 'voice' && k !== 'suspect' && ok[k] && !ok.suspect) ? 'aside' : !!ok[k];
  const row = (k, lbl) => `<div class="rv-row"><span class="rv-k">${lbl}</span><span class="rv-v">${ctEsc(ctOptName(c, k, rec[k]))}</span>${rvWord(st(k))}</div>`;
  let notes = '';
  if(ok.suspect === false){
    const C = ctCase(c), held = c === 'voice' ? (C && C.held ? ctVal(C.held[rec.suspect]) : '') : (window.CW && typeof CW.held === 'function' ? CW.held(c, rec) : '');
    if(held) notes += rvLine(held, false);
  }
  return `<div class="rv-cs"><div class="rv-cs-h">${label}</div>${row('suspect', 'SUSPECT')}${rec.method ? row('method', 'METHOD') : ''}${rec.money ? row('money', 'MONEY TRAIL') : ''}${notes}</div>`;
}
function rvWarrantLine(id){
  const w = ctWarrant(id), lbl = CT_WARRANT_LABEL[id] || w.label || id, s = w.status;     // the review's own wording for each order
  if(s === 'signed') return [`${lbl}: signed${w.route === 'commander' ? " — carried through the Commander's office" : w.route === 'zonal' ? ' — taken straight to Benin Zonal Command' : ''}.`, true];
  if(s === 'exigent') return [`${lbl}: none — you went in on exigency.`, false];
  if(s === 'none' && id === 'w_cdr') return [`${lbl}: none — you went to the cabinet without one.`, false];
  if(s === 'none') return [`${lbl}: never put to a magistrate — no charge sheet was filed.`, null];
  return [`${lbl}: never put to a magistrate.`, null];
}
function renderReviewHTML(inDesk){
  if(!S.game.seasonOneComplete && inDesk) return '<div class="v13-review v13-sheet"><p class="rv-line"><span class="rv-m"></span><span>The case review opens when the season is closed.</span></p></div>';
  const { d, mc, fl, parts, pct, relClues } = reviewData();
  const flagged = d.flagged || {};
  const noise = (typeof PHONES !== 'undefined' ? PHONES : []).flatMap(p=>(p.items || []).filter(c=>!c.rel && flagged[c.id])).length;
  let st = d.styleAtFinale; if(!st && typeof intelStyle === 'function'){ try{ st = intelStyle().key; }catch(e){} }
  const styleName = (typeof STYLE_NAME !== 'undefined' && STYLE_NAME[st]) || null;
  const sealed = S.game.sealed;
  const cands = (window.V12 && V12.CANDIDATES) || [];
  const nm = id => (cands.find(c => c.id === id) || {}).name || id || 'nobody';
  let h = `<div class="rv-pct"><span class="rv-pct-l">EVIDENCE DISCOVERED</span><b class="v13-mono">${pct}%</b></div>
    <div class="rv-parts">${parts.map(p=>`<div><span>${ctEsc(p.lbl)}</span><b class="v13-mono">${p.n}/${p.of}</b></div>`).join('')}</div>`;
  // the charge sheets, as filed (wrongful holds included)
  h += `<div class="v13-sheet-h">THE CHARGE SHEETS</div>` + rvSheet('lagos') + rvSheet('route') + rvSheet('voice');
  if(sealed) h += rvLine(sealed.who === 'adaeze' ? `Your sealed report named her${sealed.before ? ' before Ekosodin — before Osas said a word' : ''}.` : `Your sealed report named ${nm(sealed.who)}, who was not the Voice.`, sealed.who === 'adaeze');
  // people
  h += `<div class="v13-sheet-h">PEOPLE YOU PROTECTED</div>`;
  const prot = [];
  const lagos = ctAcc('lagos'), route = ctAcc('route'), voice = ctAcc('voice');
  const wrongOn = (rec, who) => !!(rec && rec.ok && rec.ok.suspect === false && rec.suspect === who);
  if(wrongOn(lagos, 'kc')) prot.push(['KC was named "the ringleader" on your Lagos charge sheet. ' + (mc.market_runner === 'escaped' ? 'He was never found.' : mc.choice === 'force' ? 'He was hit in custody, too. He remembers.' : 'He was released without charge.'), false]);
  else prot.push(mc.market_runner === 'escaped' ? ['KC got away. Nobody protected him — including from the network.', false] : mc.choice === 'force' ? ['KC was hit in custody. He remembers.', false] : ['KC was treated fairly.', true]);
  if(wrongOn(lagos, 'tunde')) prot.push(['Tunde, your own informant, spent a night in a NACECA cell on your charge sheet.', false]);
  if(wrongOn(lagos, 'pos')) prot.push(['An Ikeja POS agent spent the night in a cell as "the ringleader" on your charge sheet.', false]);
  const alive = ctTobiAlive();
  // one rule with the h6 lead and the epilogue (alive: rescue, or the chase with the hostage not lost); only the
  // deliberate rescue gives evidence at the trial (STORY-CANON "Tobi (if rescued in M6)")
  prot.push(!alive ? ['Tobi did not make it out of Asaba.', false] : mc.asaba === 'rescue' ? ['You carried Tobi out of the smoke.', true]
    : ['Sgt. Uche carried Tobi out of the smoke while you went after the fixer. He read the payroll for the prosecution; his doctors kept him out of the witness box.', true]);
  if(wrongOn(route, 'tobi')) prot.push([alive ? 'Then your route charge sheet named Tobi the principal. He was held until noon.' : 'Your route charge sheet named Tobi the principal. His family read it in the papers.', false]);
  if(wrongOn(route, 'musa')) prot.push(['Musa was charged as "the route\'s principal" on your charge sheet.', false]);
  if(wrongOn(route, 'agent')) prot.push(['A SIM agent was taken from a stall at Asaba Main Market on your charge sheet.', false]);
  if(voice && voice.ok && voice.ok.suspect === false) prot.push([`${nm(voice.suspect)} was arrested in public as the Voice, on your word.`, false]);
  prot.push(mc.shrine === 'negotiate' ? ["Pa Eze's shrine was entered with his blessing.", true] : mc.shrine === 'force' ? ['The shrine was entered by force.', false] : ['You left the shrine alone.', true]);
  prot.push(fl.child_gentle ? ['The girl from Lekki was carried out gently.', true] : ['The girl from Lekki was frightened by the raid.', false]);
  prot.push(fl.fin_osas === 'hurt' ? ['Osas came home with a broken wrist.', false] : ['Osas walked out on his own feet.', true]);
  h += prot.map(([t,ok])=>rvLine(t, ok)).join('');
  // leads
  h += `<div class="v13-sheet-h">LEADS YOU NEVER WORKED</div>`;
  const dropped = d.dropLog || [];
  h += dropped.length ? dropped.map(x=>`<p class="rv-line"><span class="rv-m${x.buried ? ' v13-mark-bad' : ''}">${x.buried ? ctIco('cross') : ''}</span><span>${ctEsc(x.text)}${x.buried?' <b>She steered you away from this one.</b>':''}</span></p>`).join('') : rvLine('No lead was left unworked at the briefings.', null);
  const unflag = relClues.filter(c=>!flagged[c.id]);
  if(unflag.length) h += rvLine(`${unflag.length} phone clue${unflag.length>1?'s':''} you never flagged — including: "${unflag[0].text}"`, null);
  if(noise) h += rvLine(`${noise} flag${noise>1?'s':''} on someone's ordinary life.`, null);
  if(typeof moneyGrand === 'function' && typeof moneyTotal === 'function' && typeof naira === 'function'){
    try{ const untraced = moneyGrand() - moneyTotal(); if(untraced > 0) h += rvLine(`${naira(untraced)} of the network's money was never traced.`, null); }catch(e){}
  }
  if((d.flags || {}).tip_false) h += rvLine('The Uselu tip came from the Voice, through Tunde.', false);
  // connections
  h += `<div class="v13-sheet-h">CONNECTIONS HIDING IN PLAIN SIGHT</div>`;
  const nZ = (typeof REGISTRY !== 'undefined' && typeof ZUMA !== 'undefined') ? Object.values(REGISTRY).filter(e => e.addr === ZUMA && !e.person).length : 6;
  const NUM = ['No','One','Two','Three','Four','Five','Six','Seven','Eight','Nine'];
  const hidden = [
    [ctHas('zuma_cluster'), `${NUM[nZ] || nZ} entities with different owners shared one office: Suite 4B, Zuma Court.`],
    [ctHas('so_plate_match'), 'The car at the Zuma Court handover was the same pool car that visited Lekki before the raid.'],
    [ctHas('reg_ca'), 'C.A. Consulting was incorporated on 14 March 2019. "C.A." was the Commander.'],
    [!!flagged.kc_call_control, '"C." always called at seven. So did the Voice.'],
    [!!flagged.musa_ph_hotel, "Musa's own camera put him in Asaba."],
    [!!flagged.bu_ph_gate, 'The burner held a photo of the gate on Akintola Close, its number painted over, two nights before the tower trace.'],
    [ctHas('reg_silverline'), 'The fake Asaba assault story came out of the same office.'],
  ];
  h += hidden.map(([got,t])=>`<p class="rv-line"><span class="rv-m${got ? ' v13-mark-ok' : ''}">${got ? ctIco('check') : ''}</span><span>${ctEsc(t)}${got ? '<span class="rv-tag">FOUND</span>' : '<span class="rv-tag v13-dim">YOU NEVER FOUND THIS</span>'}</span></p>`).join('');
  // warrants
  h += `<div class="v13-sheet-h">WARRANTS AND ORDERS</div>` + ['w_lekki', 'w_asaba', 'w_cdr', 'w_eko'].map(id => { const [t, ok] = rvWarrantLine(id); return rvLine(t, ok); }).join('');
  // decisions
  h += `<div class="v13-sheet-h">DECISIONS THAT CHANGED THE STORY</div>`;
  const dec = [];
  if(d.custodyAsk) dec.push(d.custodyAsk === 'gave' ? 'You sent her the ledger. Page 14 never came back.' : 'You kept the ledger in the exhibit room.');
  if(d.order) dec.push({ comply:'You left the Engineer alone when she asked.', quiet:'You investigated her source behind her back.', confront:'You asked her about the Engineer on an open call. She changed every phone that night.', leak:'You leaked the Engineer to the press. He vanished.' }[d.order]);
  if(d.press) dec.push({ bodycam:'You released the Asaba body-cam.', quiet:'You stayed silent about the Asaba story.', trace:'You traced the Asaba story to its source.' }[d.press]);
  if(d.court){
    const n = (d.court.proven || []).length;
    dec.push(n === 0 ? 'The court discharged her on a no-case submission.' : n === 4 ? 'The court found her guilty on all four counts.' : `The court found her guilty on ${n} of four counts.`);
    const cr = d.court.cred || {};
    if(cr.wrong) dec.push(cr.wrong === 'admit' ? 'In court, you admitted the wrongful arrest.' : 'In court, you insisted the wrongful arrest was justified.');
    if(cr.bribe) dec.push(cr.bribe === 'admit' ? 'In court, you admitted the Lekki money.' : 'In court, you denied the Lekki money. The bank record said otherwise.');
  }
  if(styleName) dec.push(`She read you as: ${styleName}.`);
  h += dec.filter(Boolean).map(t=>rvLine(t, null)).join('');
  return `<div class="v13-review${inDesk ? ' v13-sheet' : ''}">${h}</div>`;
}
function openReview(then){
  let ov = document.getElementById('screen-review');
  if(!ov){ ov = document.createElement('div'); ov.className = 'overlay'; ov.id = 'screen-review'; document.getElementById('game-root').appendChild(ov); }
  ov.innerHTML = `<div class="overlay-bg"></div><div class="v13-sheet rv-doc" role="dialog" aria-modal="true" aria-labelledby="review-title">
    <header class="ct-head"><div class="ct-crest">${ctIco('folder')}<span>NATIONAL ANTI-CORRUPTION &amp; ECONOMIC CRIMES AGENCY</span></div>
      <h2 class="ct-title" id="review-title">CASE REVIEW</h2><div class="ct-meta"><span class="v13-mono">FILE NACECA-2026/0034 · SEASON 1</span></div></header>
    <div class="ct-scroll">${renderReviewHTML(false)}</div>
    <footer class="ct-foot"><button class="v13-btn primary ct-go" id="btn-review-done">FINISH${ctIco('next')}</button></footer></div>`;
  if(typeof showHUD === 'function') showHUD(false);
  ctClearToast();
  showOverlay('screen-review');
  const sc = ov.querySelector('.ct-scroll'); if(sc) sc.scrollTop = 0;
  ctModal('screen-review', ()=>showOverlay('screen-review'));
  let done = false;
  ov.querySelector('#btn-review-done').addEventListener('click', ()=>{ if(done) return; done = true; ctModalEnd('screen-review'); if(then) then(); else showOverlay('screen-title'); });
}
