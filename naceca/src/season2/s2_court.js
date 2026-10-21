/* =========================================================================
   NACECA · v13 court — the engine for Case 14, FRN v. Edafe & 2 Ors
   Reads V13.COURT_DATA (s2/COURT.md) and the player's Season 2 history and
   runs the trial: the pre-trial conference and its plea bargains, the fix
   board, three sitting days (arraignment, PW1 in chief with exhibits and
   objections, cross-examination, re-examination, the other witnesses, a
   trial-within-trial, the no-case submission, the defence) and a judgment
   reasoned element by element. Every line goes through the game's own
   dialogue system; the 3D staging (v13_case14.js) hangs off two hooks.
   Output: V13.s2().trial = { d1, d2, d3, cred, admitted, weight, rejected,
   witnesses, exhibits } and V13.s2().fixes[fixId] = true.
   ========================================================================= */
(function(){
'use strict';
const V13 = window.V13, MC = V13.mc;
const K = V13.court = V13.court || {};
const D = ()=>V13.COURT_DATA || {};
const esc = s => V13.esc(s);
const ico = n => (typeof icon === 'function' ? icon(n) : '');
const rec = ()=>typeof isRecruit === 'function' && isRecruit();
const modal = (id, o)=>{ if(typeof v13Modal === 'function') try{ v13Modal(id, o); }catch(e){} };
const modalEnd = id => { if(typeof v13ModalEnd === 'function') try{ v13ModalEnd(id); }catch(e){} };
/* a run of the trial (K.run) has a number; leaving the trial (K.abort) moves it on, and anything the old run
   was waiting for (a line, a choice, a title card, a camera cue) then stops that run where it stands (D4) */
const ABORTED = { aborted:true };
K._run = K._run || 0;
const live = (p, r)=>{ const q = p.then(v => { if(K._run !== r) throw ABORTED; return v; }); q.catch(()=>{}); return q; };   // (an unawaited cue is never an unhandled rejection)
const rethrow = e => { if(e === ABORTED) throw e; };
const LIE = 10;                         // what a lie costs when the document comes out
const CRED0 = 60;                       // PW1 walks in with the benefit of the doubt

/* ---------- the faces in Court 5 ---------- */
V13.CAST.abara = { name:'N. ABARA (MRS.)', f:1, skin:'#5a3524', top:'#151515', hair:'#141110', bands:1 };
V13.CAST.usher = { name:'COURT USHER', skin:'#4a2b1c', top:'#26324a', hair:'#0c0a09' };
(function speakers(){
  if(typeof SPEAKER_ART === 'undefined') return;
  const has = k => SPEAKER_ART.some(([x]) => x === k);
  if(!has('LEGAL AID COUNSEL')){ const i = SPEAKER_ART.findIndex(([x]) => x === 'LEGAL AID'); SPEAKER_ART.splice(i < 0 ? 0 : i, 0, ['LEGAL AID COUNSEL', 'abara']); }
  if(!has('COURT USHER')) SPEAKER_ART.unshift(['COURT USHER', 'usher']);
  if(!has('OLANIRAN')) SPEAKER_ART.unshift(['OLANIRAN', 'san']);          // (CN15) the SAN's renamed speaker keeps his face
})();
const SPK = {
  'REGISTRAR':{ speaker:'REGISTRAR' }, 'JUDGE':{ speaker:'HON. JUSTICE BAKARE' }, 'DANLADI':{ speaker:'BARRISTER DANLADI' },
  'SAN':{ speaker:'OLANIRAN-COLE, SAN' }, 'LEGAL AID':{ speaker:'LEGAL AID COUNSEL' }, 'KELECHI':{ speaker:'AGENT KELECHI', portrait:'kelechi' },
  'LUCKY':{ speaker:'LUCKY EDAFE' }, 'FELIX':{ speaker:'FELIX UGBEKILE' }, 'SOTONYE':{ speaker:'SOTONYE JUMBO' }, 'EJIRO':{ speaker:'EJIRO' },
  'TOBI':{ speaker:'TOBI' }, 'IGBINOSA':{ speaker:'MR. IGBINOSA' }, 'IKPE':{ speaker:'SGT. IKPE' }, 'USHER':{ speaker:'COURT USHER' },
  'NACECA SYSTEM':{ speaker:'NACECA SYSTEM' }, 'UCHE':{ speaker:'SGT. UCHE', portrait:'sergeant' },
};

/* ---------- conditions (COURT.md vocabulary → the player's history) ---------- */
const S2SRC = ['HERBS', 'TILL', 'NETS', 'TIDE', 'GATE'];
/* (CN13) how Season 2 reads Adaeze's fate: V13.s1fate() (s2_core), else the same rule inline; never a rewritten Season 1 field */
const s1fate = m => { try{ return V13.s1fate ? V13.s1fate() : ((V13.s2().s1fate) || (m || MC()).finale || 'unproven'); }catch(e){ return (m || MC()).finale || 'unproven'; } };
const srcs = ()=>(V13.srcList ? V13.srcList() : []).filter(c => S2SRC.includes(c)).map(c => V13.src(c)).filter(Boolean);
const COND = {
  always:()=>true,
  bribe:m => m.arrest === 'bribe',
  custody_unsigned:m => m.s2_custody === 'unsigned',
  method_direct:m => m.s2_method === 'direct', method_photo:m => m.s2_method === 'photo',
  original_handed:m => m.s2_original === 'handed', original_kept:m => m.s2_original === 'kept',
  statement_car:m => m.s2_statement === 'car', statement_threat:m => m.s2_statement === 'threat', statement_proper:m => m.s2_statement === 'proper',
  samples_grabbed:m => m.s2_samples === 'grabbed',
  no_warrant:m => m.s2_warrant === 'went_in',
  searched_woman_self:m => m.s2_search === 'self',
  inventory_skipped:m => m.s2_inventory === 'skipped',
  sotonye_pressured:m => m.s2_sotonye === 'pressured',
  felix_threatened:m => m.s2_felix === 'threatened',
  ejiro_source:m => m.s2_ejiro === 'source',
  source_unregistered:()=>srcs().some(x => !x.reg),
  sources_registered:()=>srcs().some(x => x.reg),
  ninth_bury:m => m.s2_ninth === 'bury', ninth_refuse:m => m.s2_ninth === 'refuse',
  adaeze_proven:m => s1fate(m) === 'proven', adaeze_contested:m => s1fate(m) === 'contested', adaeze_unproven:m => s1fate(m) === 'unproven',
  camp_navy:m => m.s2_camp === 'navy', camp_mass:m => m.s2_camp === 'mass',
  lucky_followed:m => m.s2_jetty === 'follow',
};
const warned = {};
K.cond = function(name){
  const f = COND[name];
  if(!f){ if(!warned[name]){ warned[name] = 1; console.warn('[court] unknown condition', name); } return false; }
  try{ return !!f(MC()); }catch(e){ return false; }
};
/* `when` is the vocabulary joined with && / || (and !, parentheses): a tiny parser, never eval */
K.when = function(expr){
  if(expr == null || expr === '') return false;
  const t = String(expr).match(/&&|\|\||!|\(|\)|[A-Za-z_][A-Za-z0-9_]*/g) || [];
  let i = 0;
  const atom = ()=>{ const x = t[i++]; if(x === '('){ const v = or(); if(t[i] === ')') i++; return v; } return x == null ? false : K.cond(x); };
  const not = ()=>{ if(t[i] === '!'){ i++; return !not(); } return atom(); };
  const and = ()=>{ let v = not(); while(t[i] === '&&'){ i++; const r = not(); v = v && r; } return v; };
  const or = ()=>{ let v = and(); while(t[i] === '||'){ i++; const r = and(); v = v || r; } return v; };
  try{ return !!or(); }catch(e){ return false; }
};

/* ---------- names ---------- */
const SHORT = {
  drive_image:'Copy of exhibit 14 (the Benin drive)', upstream_ledger:'The UPSTREAM ledger (printout)', evidence_register:'Benin exhibit register',
  pos_t4_log:'Terminal T4 transaction log', bvn_link:'Four accounts, one BVN', cash_bundles:'₦9.6m in POS bundles', lucky_statement:'Lucky Edafe\'s statement',
  fuel_samples:'Camp fuel samples', waybill_book:'Riverstone waybill book', felix_phone:'The escort\'s phone', barge_track:'TEKENA 2 tracker log',
  loading_log:'The true loading log (USB)', tank3_sample:'Tank 3 diesel sample', gate_register:'Tank farm gate register', cac_record:'CAC record, Riverstone Marine',
  bank_trail:'Riverstone\'s bank statements',
};
const ORDER = ['drive_image', 'evidence_register', 'upstream_ledger', 'pos_t4_log', 'bvn_link', 'cash_bundles', 'lucky_statement', 'fuel_samples', 'waybill_book',
  'felix_phone', 'barge_track', 'loading_log', 'tank3_sample', 'gate_register', 'cac_record', 'bank_trail'];
K.evName = id => { const e = (S.game.evidence || []).find(x => x && x.id === id); return (e && e.name) || SHORT[id] || id; };
K.SHORT = SHORT;

/* ---------- the fixes (between hearings) ---------- */
const FIXES = ['cert_pos', 'bank_cert', 'ctc_cac', 'search_record', 'cert_tracker'];
const PROTECTS = { cert_pos:['pos_t4_log'], bank_cert:['bvn_link', 'bank_trail'], ctc_cac:['cac_record'], search_record:['drive_image', 'upstream_ledger'], cert_tracker:['barge_track'] };
const WHY = {
  cert_pos:'The T4 log is a printout from the provider\'s computer system. Without a section 84 certificate from someone responsible for that system, the court will reject it.',
  bank_cert:'Bank statements and BVN records are banker\'s books. The bank\'s own officer must prove them and check our copies against the books, or the court will not receive them.',
  ctc_cac:'Company records at the CAC are public documents. Only a certified true copy from the Commission is admissible. A printout from the portal is not.',
  search_record:'The original drive went to headquarters and cannot be found. The court will accept a copy only if we prove we searched properly for the original.',
  cert_tracker:'The tracker log is computer output. It needs a section 84 certificate from the analyst responsible for the tracking system.',
};
const NOFIX = { cert_pos:'no T4 log to certify', bank_cert:'no bank records', ctc_cac:'no CAC record', search_record:'the original drive never left Benin', cert_tracker:'no tracker log' };
/* standing a document down while its foundation is fetched (Day 1 only) */
const STANDDOWN = {
  cert_pos:['the certificate is filed', 'The provider\'s certificate is not yet to hand.'],
  bank_cert:['the bank has certified it', 'The bank\'s officer has not yet certified the records.'],
  ctc_cac:['we have the certified true copy', 'The Commission has not yet issued the certified true copy.'],
  search_record:['our search for the original is on record', 'Our record of the search for the original is not yet complete.'],
  cert_tracker:['the certificate is signed', 'The certificate for the tracker log is not yet signed.'],
};
const fixDone = id => !!(V13.s2().fixes || {})[id];
/* (CN06) Tobi is an accountant in canon, not a forensic examiner: whatever happened at Asaba, PW2 and every
   section 84 certificate are Mr. Igbinosa's (the fix "who", the fix lines and the witness list all read this) */
const tobiAlive = ()=>false;
K.fixAvailable = function(id){
  if(id === 'cert_pos') return V13.hasEv('pos_t4_log');
  if(id === 'bank_cert') return V13.hasEv('bank_trail') || V13.hasEv('bvn_link');
  if(id === 'ctc_cac') return V13.hasEv('cac_record');
  if(id === 'search_record') return MC().s2_original === 'handed';
  if(id === 'cert_tracker') return V13.hasEv('barge_track');            // (D13) the escort's phone needs no certificate: its foundation is oral
  return false;
};
K.fixDone = fixDone;
function markFix(id, where){
  const s2 = V13.s2(); s2.fixes = s2.fixes || {}; s2.fixes[id] = true;
  s2.fixWhere = s2.fixWhere || {}; s2.fixWhere[id] = where || S.game.currentMission || '';
}
/* a replay of the trial redoes the fixes made inside it; the ones made in the hub before it stay */
K.resetFixes = function(){
  const s2 = V13.s2(), W = s2.fixWhere || {};
  for(const id of Object.keys(W)) if(W[id] === 'm14'){ delete W[id]; if(s2.fixes) delete s2.fixes[id]; }
};

/* ---------- state ---------- */
K.reset = function(){
  K.state = {
    cred:CRED0, admitted:[], weight:{}, rejected:[], withdrawn:[], exhibits:{}, mfi:{}, mfiOrder:[],
    twt:null, twtObj:null, plea:{ d2:false, d3:false }, witnesses:['kelechi'], facts:{}, exam:{}, cross:{}, crossCred:{},
    lies:0, truths:0, rx:null, suggest:null, nocase:{}, onTrial:{ d1:true, d2:true, d3:true }, verdict:{}, elements:{},
    nextP:1, nextM:1, day:0, label:'', luckyTestified:false,
  };
  return K.state;
};
const st = ()=>K.state || K.reset();
const clampC = v => Math.max(0, Math.min(100, v));
const exhLabel = n => 'Exhibit P' + n;

/* ---------- lines ---------- */
K.line = function(l, extra){
  const s = SPK[l.who] || { speaker:String(l.who || '') };
  const o = { speaker:s.speaker, text:l.text || '', _court:true, _who:l.who };
  if(s.portrait) o.portrait = s.portrait;
  if(l.textEn) o.textEn = l.textEn;
  return extra ? Object.assign(o, extra) : o;
};
const mk = (who, text, extra)=>K.line({ who, text }, extra);
const LS = (arr, extra)=>(arr || []).filter(Boolean).map(l => K.line(l, extra));
/* fill {EXH}/{MFI}; the first filled line carries the stamp */
function fill(lines, map, stamp){
  let first = null;
  const out = lines.map(l => {
    const has = /\{(EXH|MFI)\}/.test(l.text + (l.textEn || ''));
    if(!has) return l;
    const o = Object.assign({}, l);
    for(const k in map){ o.text = o.text.split('{' + k + '}').join(map[k]); if(o.textEn) o.textEn = o.textEn.split('{' + k + '}').join(map[k]); }
    if(!first) first = o;
    return o;
  });
  if(stamp){ const tgt = first || out.find(l => l._who === 'JUDGE') || out[0]; if(tgt){ tgt._stamp = stamp[0]; tgt._stampKind = stamp[1]; } }
  return out;
}
const lastJudge = lines => { for(let i = lines.length - 1; i >= 0; i--) if(lines[i]._who === 'JUDGE') return lines[i]; return lines[lines.length - 1]; };
const stampOn = (line, text, kind)=>{ if(line){ line._stamp = text; line._stampKind = kind || 'info'; } return line; };

/* ---------- running lines through the game's dialogue ---------- */
let SEQ = 0;
const keyOf = ()=>'m14c_' + (++SEQ);
K.play = function(lines, cb){
  lines = (lines || []).filter(Boolean);
  if(!lines.length){ if(cb) setTimeout(cb, 0); return; }
  const k = keyOf();
  V13.run(k, lines, ()=>{ delete DIALOGUE[k]; if(cb) cb(); });
};
const say = lines => { const r = K._run; return live(new Promise(res => K.play(lines, res)), r); };
/* a decision: lead lines, then the prompt line carrying the choices; each choice continues into its own lines */
K.decide = function(lead, prompt, options, opt){
  opt = opt || {};
  const r = K._run;
  return live(new Promise(res => {
    const base = keyOf();
    const keys = options.map((o, i)=>{ const k = base + '_' + i; const arr = (o.lines || []).filter(Boolean).slice(); arr._pick = i; DIALOGUE[k] = arr; return k; });
    const choices = options.map((o, i)=>{ const c = { text:esc(o.text), next:keys[i] }; if(opt.confirm) c.flag = {}; return c; });
    const pl = Object.assign({}, prompt, { choices });
    K.pending = { type:opt.type || 'choice', id:opt.id || null, options:options.map(o => Object.assign({ text:o.text }, o.meta || {})) };
    K._picked = null;
    K.play((lead || []).concat([pl]), ()=>{
      const i = K._picked == null ? 0 : K._picked;
      K.pending = null; keys.forEach(k => delete DIALOGUE[k]);
      res(i);
    });
  }), r);
};
/* a fixed shuffle per decision, so the right answer is never always first */
function shuffle(arr, seed){
  let h = 2166136261; for(const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const rnd = ()=>{ h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
  for(let i = arr.length - 1; i > 0; i--){ const j = Math.floor(rnd() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return arr;
}

/* the hooks: every court line tells the stage who speaks; the pick of a choice is read off its branch */
V13.wrap('renderDialogueLine', orig => function(){
  try{
    if(K.active && typeof DLG !== 'undefined' && DLG.script){
      if(DLG.script._pick != null) K._picked = DLG.script._pick;
      const line = DLG.script[DLG.idx];
      if(line && line._court) K._onLine(line);
    }
  }catch(e){ console.warn('[court] line', e); }
  return orig.apply(this, arguments);
});
V13.wrap('renderChoices', orig => function(){
  const r = orig.apply(this, arguments);
  try{ if(K.active && K.pending && K.stage && K.stage.onChoices) K.stage.onChoices(K.pending); }catch(e){}
  return r;
});
const AUTO_OBJ = /^(Objection|Hearsay)\b/;
const AUTO_RULE = /(^|[.!?] )(Sustained|Overruled)\b/;
K._onLine = function(line){
  if(line._do){ try{ line._do(line); }catch(e){ console.warn('[court] cue', e); } }
  let stamp = line._stamp, kind = line._stampKind;
  if(!stamp && (line._who === 'SAN' || line._who === 'LEGAL AID' || line._who === 'DANLADI') && AUTO_OBJ.test(line.text)){ stamp = 'OBJECTION'; kind = 'obj'; }
  if(!stamp && line._who === 'JUDGE'){ const m = AUTO_RULE.exec(line.text); if(m){ stamp = m[2].toUpperCase(); kind = 'info'; } }
  if(stamp) K.stamp(stamp, kind);
  if(line._credShow != null) K.showCred(line._credShow, line._credDelta);
  K.docCard(line._doc || null);
  if(K.stage && K.stage.onLine){ try{ K.stage.onLine(line); }catch(e){ console.warn('[court] stage', e); } }
};
const cue = (name, arg)=>{
  const r = K._run;
  if(!K.stage || !K.stage.cue) return live(Promise.resolve(), r);
  try{ return live(Promise.resolve(K.stage.cue(name, arg)).catch(e => { console.warn('[court] cue', name, e); }), r); }catch(e){ console.warn('[court] cue', name, e); return live(Promise.resolve(), r); }
};

/* ---------- credibility ---------- */
function credAdd(n){ const S = st(); S.cred = clampC(S.cred + (n || 0)); return S.cred; }
const credTone = v => v >= 60 ? 'good' : v >= 40 ? 'info' : 'danger';
K.showCred = function(v, delta){
  v = clampC(v);
  if(typeof showMeter === 'function') showMeter('court_cred', 'PW1 CREDIBILITY', v / 100, credTone(v), String(Math.round(v)));
  const m = document.querySelector('#court-bar .cb-cred'); if(!m) return;
  m.dataset.tone = credTone(v);
  m.querySelector('.pm-val').textContent = Math.round(v);
  m.querySelector('.pm-fill').style.width = v + '%';
  if(delta){
    const d = m.querySelector('.cb-delta'); d.textContent = (delta > 0 ? '+' : '−') + Math.abs(Math.round(delta));
    d.className = 'cb-delta ' + (delta > 0 ? 'up' : 'down'); void d.offsetWidth; d.classList.add('show');
    clearTimeout(d._t); d._t = setTimeout(()=>d.classList.remove('show'), 1700);
  }
};
K.credMeter = function(on){
  const bar = ensureBar(); bar.classList.toggle('with-cred', !!on);
  if(on) K.showCred(st().cred); else if(typeof hideMeter === 'function') hideMeter('court_cred');
};

/* ---------- the court bar: stage, PW1 credibility, the exhibit list ---------- */
function ensureBar(){
  let b = document.getElementById('court-bar');
  if(!b){
    b = V13.el('div', '', `<div class="cb-stage"><span class="cb-k"></span><span class="cb-n"></span></div>
      <div class="cb-cred pmeter" data-tone="good"><div class="pm-top"><span class="pm-label">PW1 CREDIBILITY</span><span class="pm-val">60</span></div><div class="pm-bar"><div class="pm-fill" style="width:60%"></div></div><i class="cb-delta"></i></div>
      <button class="cb-exh" type="button" aria-label="Exhibit list">EXHIBITS <b>0</b></button>`);
    b.id = 'court-bar';
    document.getElementById('game-root').appendChild(b);
    b.querySelector('.cb-exh').addEventListener('click', e => { e.stopPropagation(); K.openExhibits(); });
  }
  return b;
}
K.label = function(text, sub){
  const S = st(); S.label = text;
  const b = ensureBar(); b.querySelector('.cb-k').textContent = text || ''; b.querySelector('.cb-n').textContent = sub || '';
};
K.bar = function(on){ const b = ensureBar(); b.classList.toggle('show', !!on); refreshExhCount(); };
function refreshExhCount(){ const b = document.getElementById('court-bar'); if(b) b.querySelector('.cb-exh b').textContent = st().admitted.length; }

/* stamps: OBJECTION, ADMITTED · EXHIBIT P4, REJECTED, MARKED FOR IDENTIFICATION … */
K.stamp = function(text, kind){
  let el = document.getElementById('court-stamp');
  if(!el){ el = V13.el('div', '', ''); el.id = 'court-stamp'; document.getElementById('game-root').appendChild(el); }
  el.className = ''; el.textContent = text; void el.offsetWidth; el.className = 'show ' + (kind || 'info');
  clearTimeout(K._stampT); K._stampT = setTimeout(()=>el.classList.remove('show'), 1700);
  if(kind === 'ok' || kind === 'bad') thump(kind === 'ok' ? 1 : 0.7);
};
/* the exhibit officer's stamp coming down on paper */
function thump(k){
  try{
    if(typeof AUDIO === 'undefined' || !AUDIO.enabled) return; if(typeof ensureAudio === 'function') ensureAudio();
    const ctx = AUDIO.ctx, t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(150 * k, t); o.frequency.exponentialRampToValueAtTime(52, t + 0.12);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.5, t + 0.006); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    o.connect(g); g.connect(AUDIO.sfxGain); o.start(t); o.stop(t + 0.22);
  }catch(e){}
}
/* a document held up while a line is read (the counts at arraignment) */
K.docCard = function(doc){
  let el = document.getElementById('court-doc');
  if(!doc){ if(el) el.classList.remove('show'); return; }
  if(!el){ el = V13.el('div', '', ''); el.id = 'court-doc'; document.getElementById('game-root').appendChild(el); }
  el.innerHTML = `<div class="cd-k">${esc(doc.k || '')}</div><div class="cd-t">${esc(doc.t || '')}</div><p>${esc(doc.body || '')}</p>`;
  el.classList.add('show');
};

/* ---------- the exhibit list (opens over anything, closes back to it) ---------- */
K.openExhibits = function(){
  const S = st();
  let el = document.getElementById('court-exh');
  if(!el){ el = V13.el('div', '', ''); el.id = 'court-exh'; document.getElementById('game-root').appendChild(el); }
  const M = D().meta || {};
  const rows = [];
  const CHIP = { full:'v13-tier t-confirmed', reduced:'v13-tier t-probable', mfi:'v13-tier t-allegation', rej:'v13-stamp', todo:'' };
  const add = (id, cls, chip, sub)=>rows.push(`<li class="ce-row v13-sheet ${cls}"><span class="ce-chip ${CHIP[cls] || ''}">${esc(chip)}</span><span class="ce-n">${esc(K.evName(id))}</span>${sub ? `<span class="ce-s">${esc(sub)}</span>` : ''}</li>`);
  S.admitted.slice().sort((a, b)=>parseInt(S.exhibits[a].slice(1)) - parseInt(S.exhibits[b].slice(1)))
    .forEach(id => add(id, S.weight[id] === 'reduced' ? 'reduced' : 'full', S.exhibits[id], S.weight[id] === 'reduced' ? 'admitted · reduced weight' : 'admitted · full weight'));
  S.mfiOrder.forEach(id => { if(S.mfi[id] && !S.admitted.includes(id) && !S.rejected.includes(id)) add(id, 'mfi', S.mfi[id].label, id === 'lucky_statement' ? 'awaiting the trial-within-trial' : 'marked for identification · not yet evidence'); });
  S.rejected.forEach(id => add(id, 'rej', S.withdrawn.includes(id) ? 'WITHDRAWN' : 'REJECTED', S.withdrawn.includes(id) ? 'not before the court' : 'tendered and rejected'));
  if(S.day <= 1) ORDER.forEach(id => { if(V13.hasEv(id) && D().exhibits && D().exhibits[id] && !S.admitted.includes(id) && !S.rejected.includes(id) && !S.mfi[id]) add(id, 'todo', '—', 'to be tendered'); });
  el.innerHTML = `<div class="ce-bg"></div><div class="ce-frame" role="dialog" aria-label="Exhibits">
    <div class="ce-head"><div><div class="ce-k">${esc(M.number || 'FHC/ABJ/CR/214/2026')}</div><div class="ce-t">EXHIBITS</div></div><button class="ph-x ce-x" type="button" aria-label="Close">${ico('close') || 'CLOSE'}</button></div>
    <ul class="ce-list">${rows.join('') || '<li class="ce-none">Nothing tendered yet.</li>'}</ul>
    <p class="ce-foot">Only what is admitted is evidence. Reduced weight: the court admits it but will rely on it less.</p></div>`;
  const close = ()=>{ el.classList.remove('show'); K._panel = null; };
  el.querySelector('.ce-x').onclick = e => { e.stopPropagation(); close(); };
  el.querySelector('.ce-bg').onclick = e => { e.stopPropagation(); close(); };
  el.classList.add('show'); K._panel = close;
};
/* while one of our panels is open, Space/Enter don't advance the dialogue underneath; Escape closes it */
window.addEventListener('keydown', e => {
  if(!K._panel) return;
  if(e.code === 'Escape' || e.code === 'Space' || e.code === 'Enter' || e.code === 'NumpadEnter'){
    e.stopPropagation(); e.preventDefault(); if(e.code === 'Escape') K._panel();
  }
}, true);

/* ---------- the fix board ---------- */
/* V13.court.openFixes(maxPicks, onClose[, { where, kicker, note }]) — also for the Abuja hub before the trial */
K.openFixes = function(maxPicks, onClose, opt){
  opt = opt || {};
  let left = maxPicks == null ? 2 : maxPicks;
  const where = opt.where || S.game.currentMission || '';
  const inCourt = where === 'm14' || !!K.active;
  const avail = ()=>FIXES.filter(id => K.fixAvailable(id) && !fixDone(id));
  let ov = document.getElementById('screen-courtfix');
  if(!ov){ ov = V13.el('div', 'overlay', ''); ov.id = 'screen-courtfix'; document.getElementById('game-root').appendChild(ov); }
  let closed = false;
  const close = ()=>{ if(closed) return; closed = true; modalEnd('screen-courtfix'); showOverlay(null); K._fixOpen = false; if(typeof onClose === 'function') onClose(); };
  if(!avail().length || left <= 0){ if(typeof onClose === 'function') setTimeout(onClose, 0); return; }
  const whoName = F => {
    const w = (F.who === 'TOBI' && !tobiAlive()) ? (F.who_alt || 'IGBINOSA') : F.who;
    return { DANLADI:'Danladi', KELECHI:'You', TOBI:'Tobi', IGBINOSA:'Igbinosa' }[w] || w;
  };
  // Esc: in the office the board is a desk you can walk away from (its own button); in court it is a decision
  const show = ()=>{ showOverlay('screen-courtfix'); K._fixOpen = true; modal('screen-courtfix', { onEsc:inCourt ? null : close }); };
  const draw = ()=>{
    const FX = D().fixes || {}, R = rec();
    const cards = FIXES.filter(id => K.fixAvailable(id) && FX[id]).map(id => {
      const F = FX[id], done = fixDone(id);
      // (R10) which exhibits a fix saves is the deduction: Recruit is told, Senior reads the law (WHY) and decides
      const prot = (PROTECTS[id] || []).filter(e => V13.hasEv(e)).map(K.evName);
      const protHTML = R ? `<p class="cf-prot"><span>PROTECTS</span>${prot.length ? prot.map(esc).join(' · ') : '<em>nothing you will tender</em>'}</p>` : '';
      return `<article class="cf-card v13-sheet ${done ? 'done' : ''}">
        <header><b class="cf-t">${esc(F.title)}</b><i class="cf-who v13-tier t-probable">${esc(whoName(F))}</i></header>
        <p class="cf-why">${esc(WHY[id])}</p>
        <div class="cf-act">${protHTML}
          ${done ? `<span class="cf-done v13-mark-ok">${ico('check')}DONE</span>` : `<button class="btn ghost cf-go" type="button" data-f="${id}" ${left <= 0 ? 'disabled' : ''}>DO THIS</button>`}</div></article>`;
    }).join('');
    const none = R ? FIXES.filter(id => !K.fixAvailable(id)).map(id => `${(FX[id] || {}).title || id} (${NOFIX[id]})`) : [];
    ov.innerHTML = `<div class="overlay-bg"></div><div class="cf-frame" role="dialog" aria-label="Make it admissible">
      <div class="cf-head"><div><div class="plan-k">${esc(opt.kicker || 'BEFORE THE TRIAL')}</div><div class="plan-t">MAKE IT ADMISSIBLE</div></div>
        <div class="cf-left">TIME FOR <b>${left}</b> MORE</div></div>
      <p class="cf-lead">${esc(opt.note || 'Each of these takes a day you don\'t have. Choose what the case can\'t do without.')}</p>
      <div class="cf-grid">${cards}</div>
      ${none.length ? `<p class="cf-none">Nothing to do for: ${esc(none.join(' · '))}</p>` : ''}
      <div class="cf-foot"><button class="btn primary cf-close" type="button">${left > 0 ? 'THAT WILL HAVE TO DO' : 'CONTINUE'}</button></div></div>`;
    ov.querySelector('.cf-close').onclick = close;
    ov.querySelectorAll('.cf-go').forEach(b => b.onclick = ()=>{ if(left > 0) pick(b.dataset.f); });
  };
  const pick = id => {
    const F = (D().fixes || {})[id]; if(!F) return;
    left--; modalEnd('screen-courtfix'); showOverlay(null);
    const lines = LS(!tobiAlive() && F.lines_igbinosa ? F.lines_igbinosa : F.lines);
    if(lines[0]) stampOn(lines[0], F.title.toUpperCase(), 'info');
    const go = ()=>K.play(lines, ()=>{
      markFix(id, where);
      if(typeof sfxComplete === 'function') sfxComplete();
      cue('interlude', null).catch(()=>{});
      if(left > 0 && avail().length){ draw(); show(); } else close();
    });
    cue('interlude', { label:F.title }).then(go, ()=>{});
  };
  draw(); show();
};
const fixBoard = (n, opt)=>{ const r = K._run; return live(new Promise(res => K.openFixes(n, res, opt)), r); };

/* ---------- exhibits: admit, reject, mark for identification ---------- */
function weighed(id, w){
  const q = V13.evQ(id);
  return (w === 'reduced' || q === 'weak' || q === 'contested') ? 'reduced' : 'full';
}
function admit(id, w){
  const S = st(); if(S.admitted.includes(id)) return;
  S.admitted.push(id); S.weight[id] = weighed(id, w || 'full'); S.exhibits[id] = 'P' + S.nextP; S.nextP++;
  delete S.mfi[id]; refreshExhCount();
}
function reject(id, withdrawn){
  const S = st(); if(S.rejected.includes(id) || S.admitted.includes(id)) return;
  S.rejected.push(id); if(withdrawn) S.withdrawn.push(id); delete S.mfi[id];
}
function mfi(id, info){
  const S = st(); const label = 'MFI-' + S.nextM; S.nextM++;
  S.mfi[id] = Object.assign({ label }, info || {}); S.mfiOrder.push(id); return label;
}
const nextP = ()=>exhLabel(st().nextP);
const nextMFI = ()=>'MFI-' + st().nextM;

/* tender one exhibit through the witness in the box */
async function tender(id){
  const S = st(), X = (D().exhibits || {})[id];
  if(!X || !V13.hasEv(id)) return;                                  // never collected: Danladi moves on
  if(S.admitted.includes(id) || S.rejected.includes(id) || S.mfi[id]) return;
  const apply = LS(X.apply);
  const obj = (X.objections || []).find(o => K.when(o.when));
  if(!obj){
    const lab = nextP();
    await say(apply.concat(fill(LS(X.clean), { EXH:lab }, ['ADMITTED · ' + lab.toUpperCase(), 'ok'])));
    admit(id, 'full'); return;
  }
  const san = LS(obj.san); stampOn(san[0], 'OBJECTION', 'obj');
  const opts = (obj.responses || []).map((r, i)=>respond(id, X, obj, r, i));
  // Day 1: a document whose foundation is still being fetched can be stood down and tendered later
  const fixable = (obj.responses || []).find(r => r.ok && r.needs && !fixDone(r.needs) && K.fixAvailable(r.needs) && STANDDOWN[r.needs]);
  if(fixable && S.day === 1 && id !== 'lucky_statement'){
    const lab = nextMFI(), SD = STANDDOWN[fixable.needs];
    const lines = [mk('DANLADI', 'My Lord, in view of the objection, the prosecution applies to stand this document down. ' + SD[1] + ' It will be tendered when it is ready.'),
                   stampOn(mk('JUDGE', 'Very well. It is marked for identification only, ' + lab + '. Until it is admitted, it is not evidence before me.'), 'MARKED FOR IDENTIFICATION · ' + lab, 'info')];
    opts.push({ text:'Danladi: "We apply to stand it down until ' + SD[0] + '."', lines, meta:{ ok:'standdown', needs:fixable.needs },
      after:()=>mfi(id, { obj, resp:fixable, fix:fixable.needs }) });
  }
  shuffle(opts, 'obj:' + id + ':' + obj.when);
  const i = await K.decide(apply.concat(san.slice(0, -1)), san[san.length - 1], opts, { type:'objection', id });
  const o = opts[i];
  if(o.meta && o.meta.cred) credAdd(o.meta.cred);
  if(o.after) o.after();
}
/* one response to an objection, and where it leads */
function respond(id, X, obj, r, i){
  const S = st();
  const reply = LS(r.reply);
  const meta = { ok:!!r.ok, needs:r.needs || null, cred:r.cred || 0, idx:i };
  const credLine = l => { if(r.cred && l){ l._credShow = clampC(S.cred + r.cred); l._credDelta = r.cred; } };
  credLine(reply[0]);
  // Lucky's statement: the objection orders a trial-within-trial, or the prosecution lets the statement go
  if(id === 'lucky_statement'){
    const kind = K.cond('statement_threat') ? 'threat' : K.cond('statement_car') ? 'car' : 'proper';
    const withdraw = /withdraw|instead/i.test(r.text);
    if(withdraw) return { text:r.text, lines:reply.concat([stampOn(mk('NACECA SYSTEM', 'The statement is withdrawn. It will not be evidence in this trial.'), 'WITHDRAWN', 'bad')]), meta, after:()=>reject(id, true) };
    const tail = reply.some(l => /identification/i.test(l.text)) ? [] : [mk('JUDGE', 'It is marked for identification only. Its admissibility will be tried within the trial.')];
    const lines = reply.concat(tail);
    stampOn(lines.find(l => /identification/i.test(l.text)) || lines[lines.length - 1], 'TRIAL-WITHIN-TRIAL ORDERED', 'info');
    return { text:r.text, lines, meta, after:()=>{ mfi(id, { obj, resp:r, twt:kind }); S.twt = kind; S.twtObj = obj; } };
  }
  if(r.ok && (!r.needs || fixDone(r.needs))){
    const lab = nextP();
    return { text:r.text, lines:reply.concat(fill(LS(obj.admitted), { EXH:lab }, ['ADMITTED · ' + lab.toUpperCase(), 'ok'])), meta, after:()=>admit(id, obj.weight) };
  }
  const miss = (r.ok && r.needs) ? LS(((D().fixes || {})[r.needs] || {}).missing) : [];
  const rej = LS(obj.rejected); stampOn(lastJudge(rej), 'REJECTED', 'bad');
  const withdrawn = rej.some(l => /withdraw/i.test(l.text));
  if(withdrawn) stampOn(lastJudge(rej), 'WITHDRAWN', 'bad');
  return { text:r.text, lines:reply.concat(miss, rej), meta, after:()=>reject(id, withdrawn) };
}

/* ---------- DAY 1 ---------- */
const FACT = { watch:'watched', creek:'camp', tankfarm:'tankfarm', terminal:'terminal', ledger:'ledger', arrest:'arrest' };
async function examQuestion(q, n, N){
  const S = st();
  K.label('DAY 1 · EXAMINATION-IN-CHIEF', 'PW1 · ' + n + '/' + N);
  const ask = LS(q.ask);
  const opts = (q.answers || []).map(a => {
    const k = mk('KELECHI', a.text, { _credShow:clampC(S.cred + (a.cred || 0)), _credDelta:a.cred || 0 });
    return { text:a.text, lines:[k].concat(LS(a.reply)), meta:{ kind:a.kind, cred:a.cred || 0 } };
  });
  shuffle(opts, 'exam:' + q.id);
  const i = await K.decide(ask.slice(0, -1), ask[ask.length - 1], opts, { type:'exam', id:q.id });
  const a = opts[i].meta;
  credAdd(a.cred); S.exam[q.id] = a.kind;
  if(FACT[q.id] && (a.kind === 'good' || (q.id === 'watch' && a.kind === 'overclaim'))) S.facts[FACT[q.id]] = true;
  for(const id of [q.tender].concat(q.also || []).filter(Boolean)) await tender(id);
}
function arraignment(){
  const A = (D().day1 || {}).arraign || {}, S = st(), CH = D().charge || {};
  const out = [];
  const readCount = (lines, n, body, d)=>{
    const L = LS(lines);
    L.forEach(l => { if(l._who === 'NACECA SYSTEM' && /reads count/i.test(l.text) && !/amended/i.test(l.text)) l._doc = { k:(D().meta || {}).number || '', t:'COUNT ' + n, body }; });
    if(L[0]) L[0]._do = ()=>cue('dock', { d, stand:true });
    return L;
  };
  out.push(...readCount(A.d1, 'ONE', CH.count1, 1));
  const d2 = readCount(S.plea.d2 ? A.d2_plea : A.d2_notguilty, 'TWO', CH.count2, 2);
  const d3 = readCount(S.plea.d3 ? A.d3_plea : A.d3_notguilty, 'THREE', CH.count3, 3);
  const mark = (L, plea)=>{ const j = L.slice().reverse().find(l => l._who === 'JUDGE' && (plea ? /convicted on (his|her) plea/i.test(l.text) : /pleads not guilty/i.test(l.text)));
    if(j) stampOn(j, plea ? 'CONVICTED ON PLEA' : 'PLEA: NOT GUILTY', plea ? 'ok' : 'info'); };
  mark(out, false); mark(d2, S.plea.d2); mark(d3, S.plea.d3);
  return out.concat(d2, d3);
}
/* the room rises for the judge and sits when the registrar calls the case */
function callCues(lines, judgeOnRise){
  let risen = false, sat = false;
  lines.forEach(l => {
    if(l._who === 'USHER' && /rise/i.test(l.text)){ risen = true; l._do = ()=>{ cue('allrise'); if(judgeOnRise) cue('judge_in'); }; }
    else if(l._who === 'NACECA SYSTEM' && /takes the bench/i.test(l.text)) l._do = ()=>cue('judge_in');
    else if(risen && !sat && (l._who === 'REGISTRAR' || l._who === 'JUDGE')){ sat = true; l._do = ()=>cue('sitdown'); }
  });
  return lines;
}
const adjournCues = lines => { lines.forEach(l => { if(l._who === 'USHER' && /court/i.test(l.text)) l._do = ()=>cue('rise_out'); }); return lines; };

async function day1(){
  const S = st(), X = D().day1 || {};
  S.day = 1;
  await card(['COURT 5', 'DAY 1 · MONDAY 11 JANUARY · 09:00'], ()=>cue('day', 1));
  K.bar(true); K.label('DAY 1 · CALL AND APPEARANCES');
  await say(callCues(LS(X.call), false));
  K.label('DAY 1 · ARRAIGNMENT');
  await say(arraignment());
  await cue('dock', { d:0, stand:false });
  K.label('DAY 1 · THE CASE FOR THE PROSECUTION');
  const open = LS(X.open);
  let k = open.findIndex(l => /first witness/i.test(l.text)); if(k < 0) k = Math.max(0, open.findIndex(l => l._who === 'REGISTRAR') - 1);
  await say(open.slice(0, k + 1));
  await cue('pw1_in');
  K.credMeter(true);
  const oath = open.slice(k + 1); if(oath[0]) stampOn(oath[0], 'PW1 · SWORN', 'info');
  await say(oath);
  const Q = X.exam || [];
  for(let i = 0; i < Q.length; i++){ try{ await examQuestion(Q[i], i + 1, Q.length); }catch(e){ rethrow(e); console.warn('[court] exam', Q[i] && Q[i].id, e); } }
  K.label('DAY 1 · ADJOURNMENT');
  const adj = adjournCues(LS(X.adjourn));
  const corridor = adj.findIndex(l => l._who === 'NACECA SYSTEM' && /corridor/i.test(l.text));
  if(corridor > 0) adj[corridor]._do = ()=>{ K.credMeter(false); K.bar(false); cue('corridor'); };   // the court has risen
  await say(adj);
  K.credMeter(false);
  V13.done('o14_day1');
}

/* ---------- between the days ---------- */
async function interlude(lines, kicker, board){
  const L = LS(lines);
  const first = L[0] && L[0]._who === 'NACECA SYSTEM' ? L[0].text.split('. ')[0] : '';
  K.bar(false);
  await cue('interlude', { label:first || kicker });
  await say(L);
  if(board) await fixBoard(2, board);
  await cue('interlude', null);
}

/* ---------- DAY 2 ---------- */
async function retender(){
  const S = st();
  const ids = S.mfiOrder.filter(id => S.mfi[id] && !S.mfi[id].twt && !S.admitted.includes(id) && !S.rejected.includes(id));
  let first = true;
  for(const id of ids){
    const m = S.mfi[id];
    if(fixDone(m.fix)){
      const lab = nextP(), name = (D().exhibits[id] || {}).name || K.evName(id);
      const lead = first ? [mk('DANLADI', 'My Lord, with your Lordship\'s leave, before my learned friend begins: ' + m.label + ', ' + name + '. Its foundation is now ready, and the prosecution applies to tender it.'),
                            mk('JUDGE', 'Leave is granted. Go on, Counsel.')]
                         : [mk('DANLADI', 'And ' + m.label + ', my Lord: ' + name + '. The prosecution applies to tender it.')];
      first = false;
      const lines = lead.concat(LS(m.resp.reply), fill(LS(m.obj.admitted), { EXH:lab }, ['ADMITTED · ' + lab.toUpperCase(), 'ok']));
      K.label('DAY 2 · DOCUMENTS MARKED FOR IDENTIFICATION');
      await say(lines); admit(id, m.obj.weight);
    } else {
      await say([mk('DANLADI', 'My Lord, the prosecution is not in a position to tender ' + m.label + '.'),
                 stampOn(mk('JUDGE', 'Then it remains marked for identification only. It is not evidence before me.'), 'NOT IN EVIDENCE · ' + m.label, 'bad')]);
      reject(id);
    }
  }
}
async function crossExamination(){
  const S = st();
  const attacks = (D().cross || []).filter(a => K.when(a.when)).slice(0, 6);
  S.attacks = attacks.map(a => a.id);
  for(let n = 0; n < attacks.length; n++){
    const a = attacks[n];
    K.label('DAY 2 · CROSS-EXAMINATION OF PW1', (n + 1) + '/' + attacks.length);
    const q = LS(a.q); if(n === 0) stampOn(q[0], 'CROSS-EXAMINATION', 'info');
    const opts = (a.answers || []).map(ans => {
      const c1 = clampC(S.cred + (ans.cred || 0));
      const lines = [mk('KELECHI', ans.text, { _credShow:c1, _credDelta:ans.cred || 0 })].concat(LS(ans.reply));
      if(ans.kind === 'lie' && ans.exposed && ans.exposed.length){
        const ex = LS(ans.exposed); stampOn(ex[0], 'CONTRADICTED', 'bad'); ex[0]._credShow = clampC(c1 - LIE); ex[0]._credDelta = -LIE;
        lines.push(...ex);
      }
      return { text:ans.text, lines, meta:{ kind:ans.kind, cred:ans.cred || 0 } };
    });
    shuffle(opts, 'cross:' + a.id);
    let i = 0;
    try{ i = await K.decide(q.slice(0, -1), q[q.length - 1], opts, { type:'cross', id:a.id, confirm:true }); }catch(e){ rethrow(e); console.warn('[court] cross', e); }
    const m = opts[i].meta;
    let d = m.cred;
    if(m.kind === 'lie' && a.answers.find(x => x.kind === 'lie' && x.exposed)){ d -= LIE; S.lies++; if(typeof applyEffect === 'function') applyEffect({ integrity:-3 }); }
    if(m.kind === 'truth'){ S.truths++; if(S.truths <= 4 && typeof applyEffect === 'function') applyEffect({ integrity:+1 }); }
    credAdd(d); S.cross[a.id] = m.kind; S.crossCred[a.id] = d;
  }
}
async function reExamination(){
  const S = st(), fired = S.attacks || [];
  K.label('DAY 2 · RE-EXAMINATION');
  const ok = rx => rx.fixes.some(f => fired.includes(f)) && rx.fixes.every(f => S.cross[f] !== 'lie') && (rx.id !== 'rx_bribe' || S.cross.bribe === 'truth');
  const R = (D().reexam || []).filter(ok);
  if(!R.length){ await say([mk('DANLADI', 'No re-examination, my Lord.')]); return; }
  const opts = R.map(rx => {
    const lost = rx.fixes.filter(f => fired.includes(f)).reduce((s, f)=>s + Math.max(0, -(S.crossCred[f] || 0)), 0);
    const gain = (rx.cred || 0) + Math.min(3, Math.round(lost / 2));
    const ans = LS(rx.answer); if(ans[0]){ ans[0]._credShow = clampC(S.cred + gain); ans[0]._credDelta = gain; }
    return { text:(rx.ask && rx.ask[0] && rx.ask[0].text) || rx.id, lines:LS(rx.ask).concat(ans), meta:{ id:rx.id, gain } };
  });
  const prompt = mk('NACECA SYSTEM', 'Re-examination. Danladi may only repair what the cross-examination opened, and she has time for one question. She looks at you.');
  const i = await K.decide([mk('DANLADI', 'Briefly in re-examination, my Lord.')], prompt, opts, { type:'reexam' });
  S.rx = opts[i].meta.id; credAdd(opts[i].meta.gain);
}
function witnessList(){
  const S = st(), W = D().witnesses || {}, L = [];
  const suf = MC().s2_method === 'direct' ? '_direct' : MC().s2_method === 'photo' ? '_photo' : '';
  const an = tobiAlive() ? 'tobi' : 'igbinosa';
  L.push({ key:W['pw_' + an + suf] ? 'pw_' + an + suf : 'pw_' + an, id:an, who:an === 'tobi' ? 'TOBI' : 'IGBINOSA', from:'door' });
  L.push({ key:K.cond('custody_unsigned') && W.pw_ikpe_gap ? 'pw_ikpe_gap' : 'pw_ikpe', id:'ikpe', who:'IKPE', from:'door' });
  if(K.cond('ejiro_source')) L.push({ key:'pw_ejiro', id:'ejiro', who:'EJIRO', from:'door' });
  if(S.plea.d3) L.push({ key:K.cond('sotonye_pressured') && W.pw_sotonye_pressured ? 'pw_sotonye_pressured' : 'pw_sotonye', id:'sotonye', who:'SOTONYE', from:'dock' });
  if(S.plea.d2) L.push({ key:'pw_felix', id:'felix', who:'FELIX', from:'dock' });
  return L.filter(w => W[w.key]);
}
async function otherWitnesses(){
  const S = st(), W = D().witnesses || {};
  let n = 2;
  for(const w of witnessList()){
    K.label('DAY 2 · THE CASE FOR THE PROSECUTION', 'PW' + n);
    const lines = LS(W[w.key]);
    if(lines[0] && lines[0]._who === 'NACECA SYSTEM'){ lines[0].text = lines[0].text.replace(/^PW\d+/, 'PW' + n); stampOn(lines[0], 'PW' + n + ' · SWORN', 'info'); }
    await say([mk('DANLADI', 'My Lord, the prosecution calls PW' + n + '.')]);
    await cue('witness_in', w);
    await say(lines);
    if(!S.witnesses.includes(w.id)) S.witnesses.push(w.id);
    S.pwNum = S.pwNum || {}; S.pwNum[w.id] = n;
    await cue('witness_out', w);
    n++;
  }
}
async function trialWithinTrial(){
  const S = st(), kind = S.twt; if(!kind) return;
  const T = (D().twt || {})[kind]; if(!T){ reject('lucky_statement'); return; }
  K.label('DAY 2 · TRIAL-WITHIN-TRIAL', 'THE FIRST DEFENDANT\'S STATEMENT');
  await cue('twt_in', kind);
  let lines = LS(T); stampOn(lines[0], 'TRIAL-WITHIN-TRIAL', 'info');
  if(kind === 'proper') lines = fill(lines, { EXH:nextP() }, ['ADMITTED · ' + nextP().toUpperCase(), 'ok']);
  else { const r = lines.slice().reverse().find(l => l._who === 'JUDGE' && /excluded|rejected/i.test(l.text)); stampOn(r || lastJudge(lines), 'EXCLUDED', 'bad'); }
  if(kind === 'threat'){
    lines.forEach(l => {
      if(l._who === 'DANLADI' && /Uche/i.test(l.text)) l._do = ()=>cue('uche_in');
      if(l._who === 'NACECA SYSTEM' && /On his way out/i.test(l.text)) l._do = ()=>cue('uche_out');
    });
    const j = lines.find(l => l._who === 'JUDGE' && /Ruling/i.test(l.text)); if(j){ j._credShow = clampC(S.cred - 4); j._credDelta = -4; }
  }
  if(kind === 'car') K.credMeter(true);
  await say(lines);
  if(kind === 'proper'){ admit('lucky_statement', (S.twtObj && S.twtObj.weight) || 'full'); credAdd(1); }
  else { reject('lucky_statement'); credAdd(kind === 'threat' ? -4 : -1); }
  K.credMeter(false);
  await cue('twt_out', kind);
}

/* ---------- the evidence, element by element ---------- */
function ev(){
  const S = st();
  const w = id => S.admitted.includes(id) ? (S.weight[id] === 'reduced' ? 0.5 : 1) : 0;
  const wit = x => S.witnesses.includes(x);
  return { S, w, wit, adm:id => S.admitted.includes(id) };
}
/* stage 'nocase': is there ANY evidence on the element (credibility is not weighed);
   stage 'final': is it proved beyond reasonable doubt */
K.elements = function(stage){
  const { S, w, wit } = ev(), fin = stage === 'final';
  const pw = f => S.facts[f] && (!fin || S.cred >= 40) ? 1 : 0;
  const corr = (base, ids)=>base && ids.some(id => w(id) > 0);
  const ejiro = wit('ejiro') ? (corr(true, ['pos_t4_log', 'bvn_link']) ? 1 : 0.5) : 0;
  const felix = wit('felix') ? ((w('fuel_samples') + w('waybill_book') + w('barge_track') + pw('camp')) > 0 ? 2 : 1) : 0;
  const soto = wit('sotonye') ? ((w('loading_log') + w('tank3_sample') + w('barge_track')) > 0 ? 1 : 0.5) : 0;
  const lucky = fin && S.luckyTestified ? 1 : 0;
  const e1a = pw('watched') + w('pos_t4_log') + w('bvn_link') + w('lucky_statement') + ejiro + 0.5 * w('cash_bundles') + lucky;
  const L = 2 * w('upstream_ledger') + felix + (w('barge_track') > 0 && w('pos_t4_log') > 0 ? 1 : 0) + (S.rx === 'rx_followed' && pw('watched') ? 1 : 0);
  const U = w('fuel_samples') + w('tank3_sample') + w('loading_log') + 0.5 * w('waybill_book') + soto + (wit('felix') ? 1 : 0) + pw('camp');
  const Kn = 2 * w('bvn_link') + pw('watched') + w('pos_t4_log') + ejiro + (S.suggest === true ? 2 : 0);
  const e2a = 1.5 * pw('camp') + w('fuel_samples') + w('waybill_book') + w('felix_phone') + 0.5 * w('barge_track');
  const e3a = 1.5 * w('loading_log') + w('tank3_sample') + w('gate_register') + 0.5 * w('barge_track') + pw('tankfarm');
  const tie = (w('barge_track') > 0 || pw('camp') || wit('felix')) ? 1 : 0.5;
  const e3b = w('tank3_sample') + w('loading_log') * tie + 0.5 * w('waybill_book') + (wit('felix') ? 1 : 0);
  const ll = w('loading_log'), inf = w('tank3_sample') + w('gate_register') + w('waybill_book');
  if(!fin) return {
    e1a:e1a > 0, e1b:L > 0, e1c:Kn > 0,
    e2a:e2a > 0, e2b:e2a > 0,
    e3a:e3a > 0, e3b:e3b > 0, e3c:(ll + w('tank3_sample') + w('waybill_book')) > 0,
  };
  return {
    e1a:e1a >= 1, e1b:(L >= 2 && U >= 1) || (L >= 1 && U >= 3), e1c:Kn >= 3,
    e2a:e2a >= 2, e2b:e2a >= 2,
    e3a:e3a >= 2, e3b:e3a >= 2 && e3b >= 1,
    e3c:ll >= 1 || (ll > 0 && inf >= 1) || (ll === 0 && w('tank3_sample') > 0 && (w('gate_register') + w('waybill_book')) > 0),
  };
};
/* the judge's reasoning functions see PW1 as believed only where he actually gave that evidence */
function evFor(el){
  const S = st();
  const need = { e1a:'watched', e1c:'watched', e2a:'camp', e3a:'tankfarm' }[el];
  const cred = need && !S.facts[need] ? Math.min(S.cred, 39) : S.cred;
  return { admitted:S.admitted.slice(), weight:Object.assign({}, S.weight), witnesses:S.witnesses.slice(), cred };
}
const ELS = { d1:['e1a', 'e1b', 'e1c'], d2:['e2a', 'e2b'], d3:['e3a', 'e3b', 'e3c'] };
/* the judgment's text numbers the witnesses as if all of them were called (PW2 the analyst … PW6 Felix);
   say the numbers they actually had */
const CANON_PW = { 2:['tobi', 'igbinosa'], 3:['ikpe'], 4:['ejiro'], 5:['sotonye'], 6:['felix'] };
function renum(text){
  const N = st().pwNum || {};
  return String(text || '').replace(/\bPW([2-6])\b/g, (m, k)=>{ const id = CANON_PW[k].find(x => N[x]); return id ? 'PW' + N[id] : m; });
}
K.renum = renum;
K.witnessList = ()=>witnessList();               // (probes) who the prosecution calls after PW1
const renumLines = L => L.map(l => { if(l && /\bPW[2-6]\b/.test(l.text + (l.textEn || ''))){ l.text = renum(l.text); if(l.textEn) l.textEn = renum(l.textEn); } return l; });

async function noCase(){
  const S = st(), N = D().nocase || {};
  K.label('DAY 2 · NO-CASE SUBMISSION', 'ACJA ss.302–303');
  const E = K.elements('nocase'); S.nocaseEls = E;
  const lines = LS(N.submit);
  const s0 = lines.find(l => l._who === 'SAN'); stampOn(s0, 'NO-CASE SUBMISSION', 'obj');
  const rule = (d, up, ov)=>{
    const upheld = !ELS[d].every(e => E[e]);
    S.nocase[d] = upheld ? 'upheld' : 'overruled';
    const L = LS(upheld ? up : ov);
    stampOn(lastJudge(L), upheld ? 'DISCHARGED · COUNT ' + { d1:'ONE', d2:'TWO', d3:'THREE' }[d] : 'CASE TO ANSWER · ' + { d1:'1ST', d2:'2ND', d3:'3RD' }[d] + ' DEFENDANT', upheld ? 'bad' : 'info');
    return L;
  };
  lines.push(...rule('d1', N.d1_upheld, N.d1_overruled));
  if(!S.plea.d2) lines.push(...rule('d2', N.d2_upheld, N.d2_overruled));
  if(!S.plea.d3) lines.push(...rule('d3', N.d3_upheld, N.d3_overruled));
  await say(lines);
  for(const d of ['d1', 'd2', 'd3']) if(S.nocase[d] === 'upheld'){ S.onTrial[d] = false; S.verdict[d] = 'notguilty'; }
}
async function day2(){
  const S = st(), X = D().day2 || {};
  S.day = 2;
  await card(['COURT 5', 'DAY 2 · MONDAY NEXT · 09:05'], ()=>cue('day', 2));
  K.bar(true); K.label('DAY 2 · CONTINUATION OF TRIAL'); K.credMeter(true);
  await say(callCues(LS(X.call), true));
  try{ await retender(); }catch(e){ rethrow(e); console.warn('[court] retender', e); }
  try{ await crossExamination(); }catch(e){ rethrow(e); console.warn('[court] cross', e); }
  try{ await reExamination(); }catch(e){ rethrow(e); console.warn('[court] reexam', e); }
  await say([stampOn(mk('JUDGE', 'The witness is discharged. Thank you, Agent.'), 'PW1 · DISCHARGED', 'info')]);
  K.credMeter(false);
  await cue('pw1_out');
  V13.done('o14_cross');
  try{ await otherWitnesses(); }catch(e){ rethrow(e); console.warn('[court] witnesses', e); }
  try{ await trialWithinTrial(); }catch(e){ rethrow(e); console.warn('[court] twt', e); }
  // anything still marked for identification never became evidence
  S.mfiOrder.forEach(id => { if(S.mfi[id] && !S.admitted.includes(id)) reject(id); });
  try{ await noCase(); }catch(e){ rethrow(e); console.warn('[court] nocase', e); }
  const anyone = S.onTrial.d1 || (!S.plea.d2 && S.onTrial.d2) || (!S.plea.d3 && S.onTrial.d3);
  const adj = anyone ? LS(X.adjourn)
    : (S.plea.d2 || S.plea.d3) ? [mk('JUDGE', 'The convicts will be sentenced at the conclusion of the matter. This matter is adjourned for sentence.'), mk('USHER', 'Court!')]
    : [mk('USHER', 'Court!')];
  await say(adjournCues(adj));
  V13.done('o14_day2');
}

/* ---------- DAY 3: the defence ---------- */
const onTrial = d => { const S = st(); return S.onTrial[d] && !(d !== 'd1' && S.plea[d]); };
async function day3(){
  const S = st(), X = D().day3 || {}, F = D().defence || {};
  S.day = 3;
  await card(['COURT 5', 'DAY 3 · THURSDAY · 09:00'], ()=>cue('day', 3));
  K.bar(true); K.label('DAY 3 · THE DEFENCE');
  const call = callCues(LS(X.call), true);
  if(onTrial('d1')){
    await say(call);
    await cue('defence_in');
    K.label('DAY 3 · THE DEFENCE', 'DW1 · LUCKY EDAFE');
    const L = LS(F.lucky); stampOn(L[0], 'DW1 · SWORN', 'info');
    S.luckyTestified = true;
    const sug = F.suggest || [];
    if(sug.length && L.length > 1){
      const opts = sug.map(s => ({ text:s.text, lines:LS(s.lines), meta:{ good:!!s.good } }));
      shuffle(opts, 'suggest');
      const i = await K.decide(L.slice(0, -1), L[L.length - 1], opts, { type:'note', confirm:true });
      S.suggest = !!opts[i].meta.good;
    } else await say(L);
    await say([mk('SAN', 'My Lord, that is the case for the first defendant.')]);
    await cue('defence_out');
  } else await say(call.filter(l => l._who !== 'SAN'));
  const rest = ['d2', 'd3'].filter(onTrial);
  if(rest.length === 2) await say([mk('LEGAL AID', 'My Lord, the second and third defendants will not give evidence. They rest their case on that of the prosecution.')]);
  else if(rest[0] === 'd2') await say([mk('LEGAL AID', 'My Lord, the second defendant will not give evidence. He rests his case on that of the prosecution.')]);
  else if(rest[0] === 'd3') await say([mk('LEGAL AID', 'My Lord, the third defendant will not give evidence. She rests her case on that of the prosecution.')]);
  K.label('DAY 3 · FINAL ADDRESSES');
  const A = LS(F.addresses);
  await say(onTrial('d1') ? A.concat(adjournCues(LS(X.adjourn).filter(l => l._who === 'USHER'))) : [A[0], A[A.length - 1], mk('USHER', 'Court!')].filter(Boolean));
  V13.done('o14_day3');
}

/* ---------- JUDGMENT ---------- */
const COUNT = { d1:'ONE', d2:'TWO', d3:'THREE' };
async function judgment(){
  const S = st(), J = D().judgment || {};
  const trial = ['d1', 'd2', 'd3'].filter(onTrial);
  const E = K.elements('final'); S.finalEls = E;
  if(!trial.length && !S.plea.d2 && !S.plea.d3){
    // everyone was discharged on the no-case submission: the case ends in the corridor on Day 2
    writeOutput(); K.bar(false); await cue('close'); await say(LS(J.close)); return;
  }
  S.day = 4;
  await card(['COURT 5', trial.length ? 'THREE WEEKS LATER · JUDGMENT' : 'THREE WEEKS LATER · SENTENCE'], ()=>cue('day', 4));
  K.bar(true); K.label(trial.length ? 'JUDGMENT' : 'SENTENCE');
  if(trial.length){
    const open = callCues(LS(J.open), true);
    await say(open);
    for(const d of trial){
      K.label('JUDGMENT', 'COUNT ' + COUNT[d]);
      const lines = [];
      for(const e of ELS[d]){
        const f = (J.element || {})[e + (E[e] ? '_yes' : '_no')];
        let text = ''; try{ text = typeof f === 'function' ? f(evFor(e)) : String(f || ''); }catch(err){ console.warn('[court] element', e, err); }
        if(text) lines.push(mk('JUDGE', renum(text), { _el:e }));
        S.elements[e] = !!E[e];
      }
      const guilty = ELS[d].every(e => E[e]);
      S.verdict[d] = guilty ? 'guilty' : 'notguilty';
      const v = renumLines(LS(((guilty ? J.guilty : J.notguilty) || {})[d]));
      stampOn(v.find(l => l._who === 'JUDGE') || v[0], guilty ? 'GUILTY · COUNT ' + COUNT[d] : 'NOT GUILTY · COUNT ' + COUNT[d], guilty ? 'ok' : 'bad');
      if(v[0]) v[0]._do = ()=>cue('verdict', { d, guilty });
      await say(lines.concat(v));
    }
  }
  // allocutus and sentence, for every convict
  for(const d of ['d1', 'd2', 'd3']){
    const plea = d !== 'd1' && S.plea[d];
    if(!plea && S.verdict[d] !== 'guilty') continue;
    K.label('SENTENCE', 'COUNT ' + COUNT[d]);
    const lead = d === 'd1' ? [] : [mk('JUDGE', (d === 'd2' ? 'The second defendant' : 'The third defendant') + (plea ? ' stands convicted on ' + (d === 'd2' ? 'his' : 'her') + ' own plea.' : ' stands convicted on count ' + COUNT[d].toLowerCase() + '.') + ' Allocutus, Mrs. Abara?')];
    const sent = renumLines(LS((J.sentence || {})[plea ? d + '_plea' : d]));
    stampOn(sent.find(l => /sentenced/i.test(l.text)) || sent[0], 'SENTENCED', 'info');
    await say(lead.concat(LS((J.allocutus || {})[d]), sent));
  }
  ['d2', 'd3'].forEach(d => { if(S.plea[d]) S.verdict[d] = 'plea'; });
  writeOutput();
  K.bar(false);                                    // the corridor afterwards is not a sitting
  await cue('close');
  await say(LS(J.close));
}
const SENT = { d1:'Seven years', d2:'Seven years', d2_plea:'Three years, as agreed', d3:'Five years', d3_plea:'Two years, as agreed' };
function writeOutput(){
  const S = st(), s2 = V13.s2();
  const v = d => S.verdict[d] || (d !== 'd1' && S.plea[d] ? 'plea' : 'notguilty');
  s2.trial = {
    d1:v('d1'), d2:v('d2'), d3:v('d3'),
    cred:Math.round(S.cred), admitted:S.admitted.slice(), weight:Object.assign({}, S.weight), rejected:S.rejected.slice(),
    witnesses:S.witnesses.slice(), exhibits:Object.assign({}, S.exhibits),
    // extra detail for whoever wants it later
    elements:Object.assign({}, S.elements), nocase:Object.assign({}, S.nocase), lies:S.lies, suggest:S.suggest, twt:S.twt || null,
  };
  const r = s2.trial;
  if(typeof applyEffect === 'function') applyEffect(r.d1 === 'guilty' ? { publicTrust:+3, agencyFavour:+2 } : { publicTrust:-2 });
  if(typeof saveGame === 'function'){ try{ saveGame(true); }catch(e){} }
}

/* ---------- the judgment card ---------- */
function verdictCard(){
  return new Promise(res => {
    const S = st(), M = D().meta || {}, tr = V13.s2().trial || {};
    let ov = document.getElementById('screen-courtverdict');
    if(!ov){ ov = V13.el('div', 'overlay', ''); ov.id = 'screen-courtverdict'; document.getElementById('game-root').appendChild(ov); }
    const EL = { e1a:'Dealt with the funds', e1b:'Proceeds of unlawful activity', e1c:'Knew, or ought to have known', e2a:'Dealt in the product', e2b:'Without lawful authority',
                 e3a:'Received, stored and sold', e3b:'Without lawful authority', e3c:'Knew its origin' };
    const CT = { d1:['COUNT 1', 'LUCKY EDAFE', 'Money laundering · MLPPA 2022, s.18(2)(b)'], d2:['COUNT 2', 'FELIX UGBEKILE', 'Dealing in petroleum products without lawful authority · Misc. Offences Act, s.1(17)(a)'],
                 d3:['COUNT 3', 'SOTONYE JUMBO', 'Receiving and storing petroleum products without lawful authority · Misc. Offences Act, s.1(17)(a)'] };
    const mark = (yes, text)=>`<li class="${yes ? 'y' : 'n'}" aria-label="${esc(text)}: ${yes ? 'proved' : 'not proved'}"><span class="${yes ? 'v13-mark-ok' : 'v13-mark-bad'}">${ico(yes ? 'check' : 'cross')}</span>${esc(text)}<em>${yes ? 'PROVED' : 'NOT PROVED'}</em></li>`;
    const row = d => {
      const res = tr[d], plea = res === 'plea', E = S.finalEls || {};
      let outcome, cls, stamp;
      if(plea){ outcome = 'PLEADED GUILTY · ' + SENT[d + '_plea'].toUpperCase(); cls = 'plea'; stamp = 'good'; }
      else if(S.nocase[d] === 'upheld'){ outcome = 'NOT GUILTY · DISCHARGED ON A NO-CASE SUBMISSION'; cls = 'ng'; stamp = ''; }
      else if(res === 'guilty'){ outcome = 'GUILTY · ' + SENT[d].toUpperCase(); cls = 'g'; stamp = 'good'; }
      else { outcome = 'NOT GUILTY · DISCHARGED AND ACQUITTED'; cls = 'ng'; stamp = ''; }
      const els = (!plea && S.nocase[d] !== 'upheld') ? `<ul class="cv-els">${ELS[d].map(e => mark(!!E[e], EL[e])).join('')}</ul>`
        : (S.nocase[d] === 'upheld' ? `<ul class="cv-els">${ELS[d].map(e => mark(!!(S.nocaseEls || {})[e], EL[e])).join('')}</ul>` : '');
      return `<article class="cv-count v13-sheet ${cls}"><header><span class="cv-k">${CT[d][0]}</span><b>${CT[d][1]}</b></header><p class="cv-off">${esc(CT[d][2])}</p>${els}<div class="cv-out"><span class="v13-stamp ${stamp}">${esc(outcome)}</span></div></article>`;
    };
    const full = S.admitted.filter(id => S.weight[id] !== 'reduced').length, red = S.admitted.length - full;
    ov.innerHTML = `<div class="overlay-bg"></div><div class="cv-frame" role="dialog" aria-label="Judgment">
      <div class="cv-head"><div class="plan-k">${esc(M.number || '')} · ${esc(M.court || '')}</div><div class="plan-t">FRN v. EDAFE &amp; 2 ORS · JUDGMENT</div></div>
      <div class="cv-grid">${['d1', 'd2', 'd3'].map(row).join('')}</div>
      <div class="cv-stats"><span>EXHIBITS ADMITTED <b>${S.admitted.length}</b> <em>${full} full · ${red} reduced</em></span><span>REJECTED <b>${S.rejected.length}</b></span>
        <span>PW1 CREDIBILITY <b>${Math.round(S.cred)}</b></span><span>WITNESSES <b>${S.witnesses.length}</b></span></div>
      <div class="cv-foot"><button class="btn primary cv-go" type="button">LEAVE COURT 5</button></div></div>`;
    let left = false;
    const go = ()=>{ if(left) return; left = true; modalEnd('screen-courtverdict'); showOverlay(null); res(); };
    ov.querySelector('.cv-go').onclick = go;
    showOverlay('screen-courtverdict');
    // Esc does what LEAVE COURT 5 does
    modal('screen-courtverdict', { onEsc:go });
  });
}

K.verdictCard = verdictCard;

/* ---------- title cards ---------- */
function card(lines, during){
  const r = K._run;
  return live(new Promise(res => {
    K.bar(false); K.docCard(null);
    titleCard(lines, K.fast ? 700 : 2600, ()=>res());
    if(during) setTimeout(()=>{ if(K._run !== r) return; try{ during(); }catch(e){ console.warn('[court] card', e); } }, K.fast ? 150 : 650);
  }), r);
}

/* ---------- the conference ---------- */
async function plea(d, P){
  const S = st();
  const ask = LS(P.ask), yes = LS(P.yes), no = LS(P.no);
  if(!ask.length || !yes.length || !no.length) return;
  const i = await K.decide(ask.slice(0, -1), ask[ask.length - 1],
    [{ text:P.yes[0].text, lines:yes, meta:{ plea:true } }, { text:P.no[0].text, lines:no, meta:{ plea:false } }], { type:'plea', id:d, confirm:true });
  S.plea[d] = i === 0;
}
async function conference(){
  const S = st(), C = D().conference || {};
  K.bar(true); K.label('PRE-TRIAL CONFERENCE', 'ACJA s.270(5)');
  const offerD3 = ['witness', 'pressured'].includes(MC().s2_sotonye), offerD2 = MC().s2_felix === 'cooperating';
  let open = (C.open || []).slice();
  // the writer set this at NACECA Legal; Danladi has borrowed the empty courtroom instead
  if(open[0] && open[0].who === 'NACECA SYSTEM') open[0] = { who:'NACECA SYSTEM', text:'FEDERAL HIGH COURT · COURT 5 · FRIDAY 8 JANUARY, 18:40. The court has risen for the weekend. Danladi has borrowed the empty room for an hour, and there are case files on every chair.' };
  if(!offerD3 && !offerD2) open = open.filter(l => !/270\(5\)|consulting/i.test(l.text));
  await say(LS(open));
  if(offerD3 && C.sotonye) await plea('d3', C.sotonye);
  if(offerD2 && C.felix) await plea('d2', C.felix);
  await say(LS(C.close));
  K.bar(false);
  // two fixes before Monday in all: whatever was already chased from the Abuja desk counts against them
  const s2 = V13.s2(), FW = s2.fixWhere || {};
  const before = Object.keys(s2.fixes || {}).filter(id => s2.fixes[id] && FW[id] !== 'm14').length;
  const n = Math.max(0, 2 - before);
  await fixBoard(n, { where:'m14', kicker:'BEFORE MONDAY', note:n === 2 ? 'Danladi has time to chase two of these before Monday. Whatever isn\'t ready, we fight for on the day.'
    : 'One is already in hand. Danladi has time to chase one more before Monday. Whatever isn\'t ready, we fight for on the day.' });
  await cue('interlude', null);
  V13.done('o14_conf');
}

/* ---------- the whole trial ---------- */
K.run = async function(stage){
  const r = ++K._run;
  K.stage = stage || null; K.active = true; K.reset();
  document.body.classList.add('v13-court');
  const step = async (name, fn)=>{ if(K._run !== r) return; try{ await fn(); }catch(e){ if(e === ABORTED) return; console.error('[court] ' + name, e); } };
  await step('conference', conference);
  await step('day1', day1);
  await step('after day 1', ()=>interlude((D().hub || {}).after_day1, 'ABUJA', { where:'m14', kicker:'BEFORE THE NEXT SITTING', note:'Two more before Monday. Anything marked for identification can still be tendered once its foundation is ready.' }));
  await step('day2', day2);
  const S = st();
  const defence = onTrial('d1') || onTrial('d2') || onTrial('d3');
  if(defence){
    await step('after day 2', ()=>interlude((D().hub || {}).after_day2, 'ABUJA', null));
    await step('day3', day3);
  }
  await step('judgment', judgment);
  if(K._run !== r) return null;                    // left mid-trial (K.abort): nothing is written, nothing finishes
  if(!V13.s2().trial || !V13.s2().trial.d1) writeOutput();
  await step('card', verdictCard);
  if(K._run !== r) return null;
  K.end();
  return V13.s2().trial;
};
K.end = function(){
  K.active = false; K.pending = null;
  document.body.classList.remove('v13-court');
  K.bar(false); K.docCard(null); K.credMeter(false);
  if(typeof hideMeter === 'function') hideMeter('court_cred');
  const ex = document.getElementById('court-exh'); if(ex) ex.classList.remove('show'); K._panel = null;
  if(K.stage && K.stage.cue) try{ K.stage.cue('end'); }catch(e){}
  K.stage = null;
};
/* (D4) leaving the trial part-way (quit to the title, load, erase, another case): the court goes with it —
   the bar, body.v13-court, the choice hook, the camera — and the old run stops where it stands.
   K.onAbort is the staging's own end (s2_case14.js). */
K.abort = function(){
  if(!K.active) return false;
  K._run++;
  try{ K.end(); }catch(e){ console.warn('[court] abort', e); }
  try{ if(typeof K.onAbort === 'function') K.onAbort(); }catch(e){ console.warn('[court] abort', e); }
  for(const id of ['screen-courtfix', 'screen-courtverdict']){ modalEnd(id); const o = document.getElementById(id); if(o) o.classList.remove('show'); }
  const sp = document.getElementById('court-stamp'); if(sp) sp.className = '';
  clearTimeout(K._stampT); K._fixOpen = false; K._picked = null;
  return true;
};
// a new case (or the same one again) starts clean; so does the title screen
V13.wrap('loadMission', orig => function(){ try{ if(K.active) K.abort(); }catch(e){ console.warn('[court] abort', e); } return orig.apply(this, arguments); });
document.addEventListener('click', e => { try{ if(K.active && e.target && e.target.closest && e.target.closest('#btn-quit, #btn-load, #btn-erase')) K.abort(); }catch(err){} }, true);
})();
