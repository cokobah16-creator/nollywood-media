/* =========================================================================
   NACECA · v12 operations table — the checkerboard returns as the detective brain
   Suspects, evidence, money and places sit on a black-and-gold grid. The
   player pencils up to six links; links ink only when three pencilled links
   are right (Follow the Money: money links ink in pairs), so guessing does
   not work. Inked chains become theories, and theories change cases: the
   Lekki briefing, the warrant, Tobi's smoke clock, the finale.
   Once the Voice is on the table, a sealed accusation can go to Zonal.
   ========================================================================= */
(function(){
'use strict';
const V12 = window.V12;
const ev = id => () => V12.hasEv(id);
const mis = m => () => V12.started(m);
const any = (...fs) => () => fs.some(f => f());

/* ---------- the nodes ---------- */
const N = [
  // LAGOS
  { id:'s_obi',     kind:'suspect',  g:['lagos','voice'], tag:'PRINCIPAL', name:'"Chief" Obi', meta:'Lekki mansion · ringleader',
    dossier:'Titled Akaeze of Umuoji. Runs the Lagos end of the ring from a mansion in Lekki. The ransom wallet emptied into his cash-out.' },
  { id:'s_kc',      kind:'suspect',  g:['lagos'], tag:'COURIER', name:'KC (teen)', meta:'Ikeja market · data cards', req:mis('m1'),
    dossier:'Sells data cards at the Ikeja market. Tunde says he moves SIMs for a syndicate.' },
  { id:'s_mama',    kind:'suspect',  g:['lagos','route'], tag:'GHOST', name:'"Mama Florence"', meta:'dead pensioner · SIMs in her name',
    dossier:'Florence Adeyemi, a pensioner who died in 2019. Three SIMs are still registered to her. All three pinged towers within 800 m of the Lekki mansion.' },
  { id:'s_madam',   kind:'suspect',  g:['lagos','voice'], tag:'UNKNOWN', name:'"Madam"', meta:'paid every Friday', req:()=>!!(S.game.flags && S.game.flags.v12_madam) || V12.inked('e_notebook','e_madam'),
    dossier:'Nobody has seen her. The courier reports to her. Obi\'s notebook pays "C.A." every Friday, and the night things are "clean", she is the one told.' },
  { id:'e_phish',   kind:'evidence', g:['lagos'], tag:'CYBER', name:'Phishing Template', meta:'bank spoof · fake login page', req:ev('phishing_template'),
    dossier:'Staged from KC\'s phone: the Crestline Bank spoof, a copy of the bank\'s login page, and a list of 200+ numbers to text.' },
  { id:'e_kcsims',  kind:'evidence', g:['lagos'], tag:'SIM BATCH', name:'KC\'s SIM Batch', meta:'50 SIMs · one registrant', req:ev('kc_sims'),
    dossier:'Fifty SIMs from one batch. Every one is registered to the same name: Florence Adeyemi, deceased.' },
  { id:'e_madam',   kind:'evidence', g:['lagos','voice'], tag:'PHONE', name:'"Tell Madam it\'s clean"', meta:'dropped in Mushin', req:ev('co_madam'),
    dossier:'The courier\'s phone, dropped in the rain the night before day one. One unsent message, typed at 23:14: "Tell Madam it\'s clean."' },
  { id:'e_laptop',  kind:'evidence', g:['lagos'], tag:'DEVICE', name:'Obi\'s Laptop', meta:'imaged after the wipe', req:ev('laptop'),
    dossier:'Imaged by NACECA forensics: ledger files, a wallet seed, a SIM batch database.' },
  { id:'e_notebook',kind:'evidence', g:['lagos'], tag:'PAPER', name:'Obi\'s Notebook', meta:'initials and amounts', req:ev('obi_notebook'),
    dossier:'Every Friday the same entry: "C.A. — 2.5M". The last one is dated the night of the Mushin transfer, with one word beside it: "clean".' },
  { id:'e_wallet',  kind:'money',    g:['lagos'], tag:'CRYPTO', name:'Wallet 0xE7…91A', meta:'0.62 BTC out',
    dossier:'Emptied 0.62 BTC into three OTC desks the night before the Ikeja POS cash-outs. Registered to a Lekki address.' },
  { id:'m_pos',     kind:'money',    g:['lagos'], tag:'POS', name:'Ikeja POS Cash-outs', meta:'₦5M+ a day · three agents',
    dossier:'Three POS agents in Ikeja cashed out more than ₦5M a day, in windows that line up with two ransom payouts.' },
  { id:'e_cash',    kind:'money',    g:['lagos'], tag:'CASH', name:'₦12.4M in Bundles', meta:'Obi\'s coffee table', req:ev('cash'),
    dossier:'Bank bands torn off. Bundles of ₦1,000 notes and US dollars, counted on Obi\'s coffee table.' },
  { id:'l_mushin',  kind:'place',    g:['lagos'], tag:'NODE', name:'Mushin Compound', meta:'the white van · the girl', req:mis('m0'),
    dossier:'Where the courier went: a compound with a white minivan, a masked man and a girl of about eight.' },
  { id:'l_market',  kind:'place',    g:['lagos'], tag:'NODE', name:'Ikeja Market', meta:'phishing staging', req:mis('m1'),
    dossier:'Computer Village spills into this market. Data cards, SIM sellers, POS stands.' },
  { id:'l_lekki',   kind:'place',    g:['lagos'], tag:'NODE', name:'Lekki Mansion', meta:'Obi\'s house',
    dossier:'Obi\'s house in Old GRA. Lit up most nights, with a generator house at the side.' },
  // THE ROUTE
  { id:'s_musa',    kind:'suspect',  g:['route'], tag:'TRANSPORTER', name:'Musa', meta:'cattle lorry driver', req:mis('m4'),
    dossier:'Licence first issued in March. Drives the Kano–Sapele route for someone else.' },
  { id:'s_engineer',kind:'suspect',  g:['route','voice'], tag:'PICKUP', name:'"The Engineer"', meta:'loads the lorries',
    req:()=>!!((S.game.flags || {}).musa_tip) || S.game.moralChoices.checkpoint === 'flip_driver' || (S.game.flags || {}).co_heard === 'engineer',
    dossier:'Loads the back of the lorries. Musa says he waits at the filling station before Ugbowo junction. In Mushin, someone said: "Engineer changed it."' },
  { id:'s_ifeanyi', kind:'suspect',  g:['route'], tag:'FIXER', name:'Ifeanyi', meta:'books routes · moves cash', req:mis('m6'),
    dossier:'The cartel\'s fixer. Books the routes, moves the cash, never touches a phone you can trace.' },
  { id:'e_ledger',  kind:'evidence', g:['route'], tag:'PAPER', name:'Ransom Route Ledger', meta:'from the false panel', req:ev('ransom_ledger'),
    dossier:'Names, drop points and dates in a hand-written ledger. The next drop after the Bypass is a forest shrine at Ozalla.' },
  { id:'e_shrine',  kind:'evidence', g:['route'], tag:'PAPER', name:'Forest Route Ledger', meta:'from the shrine cache', req:ev('e_shrine_ledger'),
    dossier:'The next leg after the shrine: a commercial warehouse in Asaba.' },
  { id:'e_asims',   kind:'evidence', g:['route'], tag:'SIM BATCH', name:'24 Pre-activated SIMs', meta:'the Asaba crate', req:ev('asaba_sims'),
    dossier:'Pre-activated, one batch, registered to the same dead pensioner.' },
  { id:'l_bypass',  kind:'place',    g:['route'], tag:'NODE', name:'Benin Bypass', meta:'AKS checkpoint', req:mis('m4'),
    dossier:'Where AKS stopped the cattle lorry.' },
  { id:'l_shrine',  kind:'place',    g:['route'], tag:'NODE', name:'Ozalla Shrine', meta:'forest transfer point', req:mis('m5'),
    dossier:'A shrine used as fear-cover. Jerry-cans of cash behind it.' },
  { id:'l_asaba',   kind:'place',    g:['route'], tag:'NODE', name:'Asaba Warehouse', meta:'the disappeared', req:mis('m6'),
    dossier:'Where they held Tobi Onuoha, the accountant who asked about a transfer.' },
  // THE VOICE
  { id:'s_voice',   kind:'suspect',  g:['voice'], tag:'NEGOTIATOR', name:'"The Voice"', meta:'ransom caller · no name', req:mis('m7'),
    dossier:'Calls Mrs. Ehigie every evening at seven. Every call pinged the Ugbowo cell. Always the same words: "Nobody needs to be a hero."' },
  { id:'e_cdr',     kind:'evidence', g:['voice'], tag:'TELECOM', name:'Ugbowo Call Records', meta:'IMEI 35-***-88', req:ev('tower_cdr'),
    dossier:'Sector timing and handover put the handset north of the campus, in the Ekosodin micro-cell. It dialled one Lekki number twice.' },
  { id:'e_drive',   kind:'evidence', g:['voice'], tag:'DRIVE', name:'Osas\'s Flash Drive', meta:'payroll copies', req:ev('fin_drive'),
    dossier:'Payroll copies Osas hid in his shoe: a fixer, a chief, the Engineer — and the same initials at the top of every page: "C.A."' },
  { id:'e_courier', kind:'evidence', g:['voice'], tag:'PHONE', name:'Courier\'s Phone', meta:'one saved number', req:ev('fin_courier_phone'),
    dossier:'The woman in the burgundy jacket carried one saved number. No name, just a letter: "C".' },
  { id:'l_ugbowo',  kind:'place',    g:['voice'], tag:'NODE', name:'Ugbowo Tower', meta:'sabotaged mast', req:mis('m7'),
    dossier:'The mast behind the UNIBEN gate. Fibre cut with a cutlass.' },
  { id:'l_ekosodin',kind:'place',    g:['voice'], tag:'NODE', name:'Ekosodin', meta:'north of the UNIBEN fence', req:any(ev('tower_cdr'), mis('m8')),
    dossier:'Student lodges, kiosks and compounds behind blue gates.' },
];
const NODE = Object.fromEntries(N.map(n => [n.id, n]));

/* ---------- the true links ---------- */
const L = [
  ['s_kc','l_market',8,'KC works the Ikeja market'],
  ['s_kc','e_phish',12,'KC\'s phone was staging the template'],
  ['s_mama','e_phish',10,'the phishing texts went out on her SIMs'],
  ['e_kcsims','s_kc',10,'the batch was KC\'s'],
  ['e_kcsims','s_mama',12,'every SIM in the batch is in her name'],
  ['s_mama','l_lekki',14,'her SIMs sleep in the Lekki mansion'],
  ['s_obi','l_lekki',8,'Obi\'s house'],
  ['s_obi','e_wallet',14,'the wallet is Obi\'s',1],
  ['e_wallet','m_pos',12,'BTC out the night before the POS cash-outs',1],
  ['m_pos','l_market',10,'the cash-outs ran through Ikeja agents',1],
  ['s_obi','e_laptop',12,'Obi\'s own laptop'],
  ['e_cash','l_lekki',8,'seized at the mansion',1],
  ['e_cash','s_obi',8,'Obi\'s cash',1],
  ['e_madam','l_mushin',6,'dropped in Mushin'],
  ['e_notebook','s_obi',8,'Obi\'s own handwriting'],
  ['e_notebook','e_madam',16,'the Friday entry marked "clean" is the night of "Tell Madam it\'s clean"'],
  ['s_madam','e_notebook',10,'"C.A." is paid every Friday'],
  ['s_madam','e_madam',10,'the message was for her'],
  ['s_musa','l_bypass',8,'stopped on the Bypass'],
  ['s_musa','e_ledger',14,'the ledger rode in his lorry'],
  ['e_ledger','l_bypass',6,'pulled at the checkpoint'],
  ['s_musa','s_engineer',12,'the Engineer loads Musa\'s lorry'],
  ['e_ledger','l_shrine',12,'the ledger\'s next drop is the shrine'],
  ['e_shrine','l_shrine',6,'pulled from the shrine cache'],
  ['e_shrine','l_asaba',12,'the forest ledger points to Asaba'],
  ['s_ifeanyi','l_asaba',10,'Ifeanyi ran the warehouse'],
  ['s_ifeanyi','e_asims',10,'his crate'],
  ['e_asims','s_mama',12,'the same dead pensioner again'],
  ['s_voice','l_ugbowo',10,'every call pinged the Ugbowo cell'],
  ['s_voice','e_cdr',16,'the negotiator\'s handset is in the records'],
  ['e_cdr','l_ugbowo',6,'pulled from the tower cabinet'],
  ['e_cdr','l_ekosodin',12,'the handset hands over to Ekosodin'],
  ['e_cdr','s_obi',12,'the handset dialled Obi\'s number twice'],
  ['s_engineer','l_ugbowo',10,'his pickup is by the Ugbowo junction'],
  ['e_madam','s_voice',14,'the Madam in Mushin is the Voice on the calls'],
  ['s_madam','s_voice',18,'Madam and the Voice are one person'],
  ['e_drive','s_madam',16,'"C.A." at the top of every payroll page'],
  ['e_courier','s_voice',14,'her one saved number: "C"'],
  ['s_voice','l_ekosodin',10,'the Voice calls from Ekosodin'],
].map(([a,b,intel,hint,money]) => ({ a, b, intel, hint, money:!!money }));
const key = (a, b) => a < b ? a + '|' + b : b + '|' + a;
const LINK = Object.fromEntries(L.map(l => [key(l.a, l.b), l]));
V12.OPS_NODES = N; V12.OPS_LINKS = L;

/* ---------- theories: inked chains that change cases ---------- */
const T = [
  { id:'t_sims',  q:'Where do KC\'s SIMs lead?',        name:'KC\'s SIMs reach the mansion', links:[['e_kcsims','s_kc'],['e_kcsims','s_mama'],['s_mama','l_lekki']],
    effect:'Uche will know the suspect count at Lekki, and where the laptop is.' },
  { id:'t_money', q:'Whose money moves through Ikeja?',  name:'The ransom money runs through Obi', links:[['s_obi','e_wallet'],['e_wallet','m_pos'],['m_pos','l_market']],
    effect:'The magistrate signs your warrant on the money trail.', on:()=>{ S.game.intelScore = (S.game.intelScore || 0) + 15; } },
  { id:'t_madam', q:'Who was told it was "clean"?',     name:'Madam is paid out of Obi\'s ring', links:[['e_notebook','e_madam'],['s_madam','e_notebook'],['s_madam','e_madam']],
    effect:'"Madam" is a person, and Obi pays her every Friday.' },
  { id:'t_route', q:'Where does the ledger lead?',      name:'One route: Bypass → Shrine → Asaba', links:[['s_musa','e_ledger'],['e_ledger','l_shrine'],['e_shrine','l_asaba']],
    effect:'At Asaba you\'ll know which office Tobi is in: 8 more seconds on the smoke clock.' },
  { id:'t_voice', q:'Who is Madam to the Voice?',       name:'Madam is the Voice', links:[['e_madam','s_voice'],['s_madam','s_voice'],['s_voice','e_cdr']],
    effect:'The "Tell Madam" phone becomes evidence against the Voice.' },
];
V12.OPS_THEORIES = T;

/* ---------- state ---------- */
V12.ops = ()=>{
  if(!S.game.ops || typeof S.game.ops !== 'object'){
    S.game.ops = { pencils:[], inked:[], theories:{}, tries:0, sinceInk:0, group:null };
    // links confirmed on the old cork board carry over as ink
    for(const l of (S.game._ebLinks || [])){ if(l && l.correct){ const k = key(l.a, l.b); if(LINK[k] && !S.game.ops.inked.includes(k)) S.game.ops.inked.push(k); } }
  }
  const o = S.game.ops; o.pencils = o.pencils || []; o.inked = o.inked || []; o.theories = o.theories || {};
  return o;
};
V12.inked = (a, b) => V12.ops().inked.includes(key(a, b));
V12.theory = id => !!V12.ops().theories[id];
V12.warrant = () => (S.game.intelScore || 0) >= 50 || V12.theory('t_money');
const visible = n => !n.req || !!n.req();

/* ---------- the candidates for the Voice (shared with the finale) ---------- */
V12.CANDIDATES = [
  { id:'adaeze',  name:'Cdr. Adaeze',  role:'NACECA Commander, Lagos',   art:'adaeze_neutral' },
  { id:'uche',    name:'Sgt. Uche',    role:'Your squad lead',           art:'uche_neutral' },
  { id:'osaro',   name:'Engr. Osaro',  role:'Ugbowo site engineer',      art:'osaro_neutral' },
  { id:'obi',     name:'"Chief" Obi',  role:'In custody since Lekki',    art:'obi_neutral' },
  { id:'ifeanyi', name:'Ifeanyi',      role:'The cartel\'s fixer',       art:'ifeanyi_neutral' },
  { id:'chidi',   name:'Insp. Chidi',  role:'AKS liaison, Benin Bypass', art:'chidi_neutral' },
];
V12.art = id => (typeof PORTRAIT_ART !== 'undefined' && PORTRAIT_ART[id]) || '';

/* ---------- UI ---------- */
const GROUPS = [ { id:'lagos', label:'LAGOS' }, { id:'route', label:'THE ROUTE' }, { id:'voice', label:'THE VOICE' }, { id:'all', label:'ALL' } ];
const COLS = [ { kind:'suspect', label:'SUSPECTS' }, { kind:'evidence', label:'EVIDENCE' }, { kind:'money', label:'MONEY' }, { kind:'place', label:'PLACES' } ];
const UI = { sel:null, view:'board', group:null, flash:null };

function ensure(){
  let ov = document.getElementById('screen-ops'); if(ov) return ov;
  ov = V12.el('div', 'overlay', `<div class="overlay-bg"></div>
    <div class="ops-frame" id="ops-frame">
      <div class="ops-head">
        <div class="ops-title"><b>OPERATIONS TABLE</b><span>NACECA-2026/0034 · Serpent's Route</span></div>
        <div class="ops-tabs" id="ops-tabs"></div>
        <div class="ops-btns"><button class="ops-b" id="ops-notes">NOTES</button><button class="ops-b gold" id="ops-seal">SEAL</button><button class="ops-b x" id="ops-close" aria-label="Close">✕</button></div>
      </div>
      <div class="ops-main">
        <div class="ops-board" id="ops-board"><div class="ops-inner" id="ops-inner"></div></div>
        <div class="ops-side" id="ops-side"></div>
      </div>
      <div class="ops-foot" id="ops-foot"></div>
      <div class="ops-modal" id="ops-modal"></div>
    </div>`);
  ov.id = 'screen-ops';
  document.getElementById('game-root').appendChild(ov);
  ov.querySelector('#ops-close').addEventListener('click', V12.closeOps);
  ov.querySelector('#ops-notes').addEventListener('click', ()=>{ UI.view = UI.view === 'notes' ? 'board' : 'notes'; render(); });
  ov.querySelector('#ops-seal').addEventListener('click', ()=>sealModal());
  window.addEventListener('resize', ()=>{ if(ov.classList.contains('show')) drawLinks(); });
  ov.querySelector('#ops-board').addEventListener('scroll', ()=>{}, { passive:true });
  return ov;
}
function defaultGroup(){
  const m = S.game.currentMission || '';
  if(['m7','m8'].includes(m)) return 'voice';
  if(['m4','m5','m6'].includes(m)) return 'route';
  if(V12.started('m7') && !['m0','m1','m2','m3','m3n'].includes(m)) return 'voice';
  return 'lagos';
}
V12.openOps = function(group, sel){
  ensure(); V12.ops();
  UI.group = group || UI.group || defaultGroup(); UI.sel = sel && NODE[sel] ? sel : null; UI.view = 'board';
  if(typeof musicForScene === 'function') musicForScene('investigation');
  showOverlay('screen-ops');
  render();
  requestAnimationFrame(drawLinks);
  V12.log('ops_open', { m:S.game.currentMission });
};
V12.closeOps = function(){
  const m = document.getElementById('ops-modal'); if(m) m.classList.remove('show');
  showOverlay(null);
  if(S.game.currentMission && ENGINE.movementEnabled !== false){ showHUD(true); if(typeof musicForScene === 'function') musicForScene(S.game.currentMission === 'm3n' ? 'investigation' : S.game.currentMission); }
  else if(typeof musicForScene === 'function') musicForScene('title');
  if(V12._onOpsClose){ const f = V12._onOpsClose; V12._onOpsClose = null; try{ f(); }catch(e){} }
};
window.openCaseFile = function(){
  if(S.game.currentMission === 'm1' && typeof completeObjective === 'function'){ completeObjective('o_casefile'); S.game._hqCaseFile = true; }
  V12.openOps();
};
window.openEvidenceBoard = function(){ V12.openOps(); };
// coming back from the capability screen returns to the table
const sb = document.getElementById('btn-skills-back');
if(sb) sb.addEventListener('click', ()=>{ if(V12._returnOps){ V12._returnOps = false; setTimeout(()=>V12.openOps(), 40); } });

function render(){
  const ov = ensure(), o = V12.ops();
  ov.querySelector('#ops-tabs').innerHTML = GROUPS.map(g => `<button class="ops-tab ${UI.group === g.id ? 'on' : ''}" data-g="${g.id}">${g.label}</button>`).join('');
  ov.querySelectorAll('.ops-tab').forEach(b => b.addEventListener('click', ()=>{ UI.group = b.dataset.g; UI.sel = null; UI.view = 'board'; render(); requestAnimationFrame(drawLinks); }));
  const sealB = ov.querySelector('#ops-seal');
  const canSeal = visible(NODE.s_voice) && !S.game._finOsas;
  sealB.style.display = canSeal || S.game.sealed ? '' : 'none';
  sealB.textContent = S.game.sealed ? 'SEALED ✓' : 'SEAL ACCUSATION';
  sealB.classList.toggle('done', !!S.game.sealed);
  ov.querySelector('#ops-notes').classList.toggle('on', UI.view === 'notes');
  const inner = ov.querySelector('#ops-inner');
  if(UI.view === 'notes'){ inner.innerHTML = notesHTML(); inner.classList.add('notes'); }
  else {
    inner.classList.remove('notes');
    const nodes = N.filter(n => visible(n) && (UI.group === 'all' || n.g.includes(UI.group)));
    const hidden = N.filter(n => !visible(n) && (UI.group === 'all' || n.g.includes(UI.group))).length;
    const linksOf = id => o.inked.filter(k => k.split('|').includes(id)).length;
    inner.innerHTML = `<div class="ops-cols">${COLS.map(c => {
      const list = nodes.filter(n => n.kind === c.kind);
      return `<div class="ops-col k-${c.kind}"><div class="ops-colh">${c.label}</div>${list.map(n => `
        <button class="ops-chip k-${n.kind} ${UI.sel === n.id ? 'sel' : ''} ${V12.evQ(evIdOf(n)) === 'weak' ? 'weak' : ''} ${o.seen && !o.seen[n.id] ? 'new' : ''}" data-id="${n.id}">
          <span class="t">${n.tag}</span><span class="n">${n.name}</span><span class="m">${n.meta}</span>${linksOf(n.id) ? `<span class="c">${linksOf(n.id)}</span>` : ''}
        </button>`).join('') || '<div class="ops-empty">—</div>'}</div>`;
    }).join('')}</div><svg class="ops-svg" id="ops-svg"></svg>${hidden ? `<div class="ops-more">${hidden} more lead${hidden>1?'s':''} unlock as the case moves</div>` : ''}`;
    o.seen = o.seen || {}; nodes.forEach(n => { o.seen[n.id] = true; });
    inner.querySelectorAll('.ops-chip').forEach(b => b.addEventListener('click', ()=>tapNode(b.dataset.id)));
  }
  side(); foot();
  requestAnimationFrame(drawLinks);
}
const evIdOf = n => ({ e_phish:'phishing_template', e_kcsims:'kc_sims', e_madam:'co_madam', e_laptop:'laptop', e_notebook:'obi_notebook', e_cash:'cash', e_ledger:'ransom_ledger', e_shrine:'e_shrine_ledger', e_asims:'asaba_sims', e_cdr:'tower_cdr', e_drive:'fin_drive', e_courier:'fin_courier_phone' })[n.id] || '';

function tapNode(id){
  const o = V12.ops();
  if(!UI.sel){ UI.sel = id; if(typeof sfxBlip === 'function') sfxBlip(); render(); return; }
  if(UI.sel === id){ UI.sel = null; render(); return; }
  const k = key(UI.sel, id);
  if(o.inked.includes(k)){ toast('ALREADY INKED', (LINK[k] || {}).hint || '', 1800); UI.sel = id; render(); return; }
  const i = o.pencils.indexOf(k);
  if(i >= 0){ o.pencils.splice(i, 1); toast('ERASED', '', 900); UI.sel = null; render(); return; }
  if(o.pencils.length >= 6){ toast('SIX PENCILS IS THE LIMIT', 'Erase one before you draw another', 2000); if(typeof sfxFail === 'function') sfxFail(); return; }
  o.pencils.push(k); o.tries = (o.tries || 0) + 1; o.sinceInk = (o.sinceInk || 0) + 1;
  if(typeof sfxClick === 'function') sfxClick();
  V12.log('pencil', { k });
  UI.sel = null;
  render();
  setTimeout(evaluate, 260);
}

function evaluate(){
  const o = V12.ops();
  const valid = o.pencils.filter(k => LINK[k]);
  let take = [];
  if(V12.has('money')){
    const m = valid.filter(k => LINK[k].money);
    take = m.slice(0, 2 * Math.floor(m.length / 2));
  }
  const rest = valid.filter(k => !take.includes(k));
  take = take.concat(rest.slice(0, 3 * Math.floor(rest.length / 3)));
  if(!take.length) return;
  inkLinks(take);
}
function inkLinks(keys, quiet){
  const o = V12.ops();
  let intel = 0;
  for(const k of keys){
    const pi = o.pencils.indexOf(k); if(pi >= 0) o.pencils.splice(pi, 1);
    if(!o.inked.includes(k)){ o.inked.push(k); intel += (LINK[k] || {}).intel || 0; }
  }
  o.sinceInk = 0;
  const before = V12.intelTier();
  S.game.intelScore = (S.game.intelScore || 0) + intel;
  if(typeof awardXP === 'function') awardXP(12 * keys.length);
  UI.flash = keys.slice();
  if(!quiet){
    if(typeof sfxComplete === 'function') sfxComplete();
    if(typeof haptic === 'function') haptic([20,40,20]);
    toast(keys.length === 2 ? 'TWO MONEY LINKS INKED' : keys.length + ' LINKS INKED', `+${intel} INTEL · ` + keys.map(k => (LINK[k] || {}).hint).filter(Boolean)[0], 2400);
    stamp();
  }
  if(typeof unlock === 'function') unlock('first_ink');
  V12.log('ink', { keys, intel });
  // theories
  for(const t of T){
    if(o.theories[t.id]) continue;
    if(t.links.every(([a, b]) => o.inked.includes(key(a, b)))){
      o.theories[t.id] = Date.now();
      if(t.on) try{ t.on(); }catch(e){}
      setTimeout(()=>toast('THEORY CONFIRMED', t.name.toUpperCase(), 2800), quiet ? 200 : 2500);
      V12.log('theory', { id:t.id });
    }
  }
  const after = V12.intelTier();
  if(after > before){ const x = V12.INTEL_TIERS[after - 1]; setTimeout(()=>toast(x.name, x.text, 3000), quiet ? 400 : 5200); }
  if(o.inked.length >= 3 && typeof completeObjective === 'function') completeObjective('o4_table');
  if(V12.onInk) try{ V12.onInk(keys); }catch(e){}
  if(document.getElementById('screen-ops') && document.getElementById('screen-ops').classList.contains('show')) render();
}
V12.inkLinks = (pairs, quiet)=>inkLinks(pairs.map(([a, b]) => key(a, b)).filter(k => LINK[k]), quiet);
function stamp(){
  const f = document.getElementById('ops-frame'); if(!f) return;
  const s = V12.el('div', 'ops-stamp', 'INKED'); f.appendChild(s); setTimeout(()=>s.remove(), 1400);
}

function drawLinks(){
  const inner = document.getElementById('ops-inner'), svg = document.getElementById('ops-svg');
  if(!inner || !svg || UI.view !== 'board') return;
  const o = V12.ops(), R = inner.getBoundingClientRect();
  const cols = [...inner.querySelectorAll('.ops-col')];
  // routing needs the four columns side by side; the narrow 2×2 layout falls back to plain curves
  const oneRow = cols.length > 1 && cols.every(c => Math.abs(c.getBoundingClientRect().top - cols[0].getBoundingClientRect().top) < 4);
  const box = id => { const el = inner.querySelector(`.ops-chip[data-id="${id}"]`); if(!el) return null; const r = el.getBoundingClientRect(); return { col: cols.indexOf(el.closest('.ops-col')), l:r.left - R.left, r:r.right - R.left, t:r.top - R.top, b:r.bottom - R.top, cx:(r.left + r.right)/2 - R.left, cy:(r.top + r.bottom)/2 - R.top }; };
  const all = o.inked.map(k => [k, 'ink']).concat(o.pencils.map(k => [k, 'pen']));
  const isFar = (A, B)=> oneRow && Math.abs(A.col - B.col) >= 2;
  // the floor: a channel under every card (and under the "more leads" line) where long links run
  let floor = 0;
  inner.querySelectorAll('.ops-chip,.ops-more').forEach(el => { floor = Math.max(floor, el.getBoundingClientRect().bottom - R.top); });
  const nFar = all.filter(([k]) => { const [a, b] = k.split('|'); const A = box(a), B = box(b); return A && B && isFar(A, B); }).length;
  inner.style.paddingBottom = nFar ? (34 + nFar * 6) + 'px' : '';
  svg.setAttribute('width', inner.scrollWidth); svg.setAttribute('height', inner.scrollHeight);
  svg.style.height = inner.scrollHeight + 'px';
  const GUT = 11, RR = 5;
  let fi = 0;
  const path = (A, B)=>{
    if(oneRow ? A.col === B.col : Math.abs(A.cx - B.cx) < 8){
      // same column: a loop out into the gutter on the right
      const [U, D] = A.cy < B.cy ? [A, B] : [B, A], x = Math.max(U.r, D.r), bend = 14;
      return `M${U.r} ${U.cy} C${x + bend} ${U.cy} ${x + bend} ${D.cy} ${D.r} ${D.cy}`;
    }
    const [P, Q] = (oneRow ? A.col < B.col : A.cx < B.cx) ? [A, B] : [B, A];
    if(!isFar(P, Q)){ const mx = (P.r + Q.l) / 2; return `M${P.r} ${P.cy} C${mx} ${P.cy} ${mx} ${Q.cy} ${Q.l} ${Q.cy}`; }
    // two or more columns apart: down the gutter, along the floor, up the gutter — never across a card
    const i = fi++, off = (i % 5 - 2) * 2;
    const x1 = P.r + GUT + off, x2 = Q.l - GUT - off, y = floor + 16 + i * 6;
    return `M${P.r} ${P.cy} H${x1 - RR} Q${x1} ${P.cy} ${x1} ${P.cy + RR} V${y - RR} Q${x1} ${y} ${x1 + RR} ${y} H${x2 - RR} Q${x2} ${y} ${x2} ${y - RR} V${Q.cy + RR} Q${x2} ${Q.cy} ${x2 + RR} ${Q.cy} H${Q.l}`;
  };
  let html = '';
  for(const [k, cls] of all){
    const [a, b] = k.split('|'); const A = box(a), B = box(b); if(!A || !B) continue;
    const hl = UI.sel && (a === UI.sel || b === UI.sel) ? ' hl' : ''; const fl = UI.flash && UI.flash.includes(k) ? ' flash' : '';
    html += `<path class="${cls}${hl}${fl}" d="${path(A, B)}"/>`;
  }
  svg.innerHTML = html;
  UI.flash = null;
}

function side(){
  const el = document.getElementById('ops-side'), o = V12.ops();
  if(UI.view === 'notes'){ el.innerHTML = `<div class="ops-h">CASE NOTES</div><p class="ops-p">Your personnel file, the case background, every piece of evidence and the calls you made. Tap NOTES again to go back to the table.</p>`; return; }
  if(UI.sel){
    const n = NODE[UI.sel];
    const mine = o.inked.filter(k => k.split('|').includes(n.id)).map(k => { const other = k.split('|').find(x => x !== n.id); return `<li class="ink"><b>${NODE[other] ? NODE[other].name : other}</b><span>${(LINK[k] || {}).hint || ''}</span></li>`; }).join('');
    const pens = o.pencils.filter(k => k.split('|').includes(n.id)).map(k => { const other = k.split('|').find(x => x !== n.id); return `<li class="pen">pencilled to ${NODE[other] ? NODE[other].name : other} <button class="ops-erase" data-k="${k}">erase</button></li>`; }).join('');
    const weak = V12.evQ(evIdOf(n)) === 'weak';
    el.innerHTML = `<div class="ops-kind k-${n.kind}">${n.tag}</div><div class="ops-name">${n.name}</div><p class="ops-p">${n.dossier}</p>
      ${weak ? '<p class="ops-weak">CONTESTED — the defence will attack how this was obtained.</p>' : ''}
      <div class="ops-h">LINKS</div><ul class="ops-ul">${mine}${pens}${!mine && !pens ? '<li class="none">Nothing yet.</li>' : ''}</ul>
      <p class="ops-tip">Tap another card to pencil a link from <b>${n.name}</b>. Tap this card again to put it down.</p>`;
    el.querySelectorAll('.ops-erase').forEach(b => b.addEventListener('click', ()=>{ const i = o.pencils.indexOf(b.dataset.k); if(i >= 0) o.pencils.splice(i, 1); render(); }));
    return;
  }
  const th = T.filter(t => o.theories[t.id] || t.links.every(([a, b]) => visible(NODE[a]) && visible(NODE[b])));
  const objs = (S.game.objectives || []);
  const mid = S.game.currentMission, mname = (MISSIONS.find(m => m.id === mid) || {}).name;
  el.innerHTML = `
    <div class="ops-h">THEORIES</div>
    ${th.length ? th.map(t => o.theories[t.id]
      ? `<div class="ops-th done"><b>✔ ${t.name}</b><span>${t.effect}</span></div>`
      : `<div class="ops-th"><b>${t.q}</b><span>Unconfirmed</span></div>`).join('') : '<p class="ops-p">No theories yet. Link what you\'ve found.</p>'}
    <div class="ops-h">HOW IT WORKS</div>
    <p class="ops-p">Tap two cards to pencil a link. Links only ink when <b>three</b> pencilled links are right${V12.has('money') ? ' (money links: <b>two</b>)' : ''}. Up to six pencils at a time.</p>
    ${mid && objs.length ? `<div class="ops-h">${(mname || 'OPERATION').toUpperCase()}</div><div id="ops-objs"><div>${objs.map(x => `<div class="so ${x.done ? 'done' : ''}">${x.text}</div>`).join('')}</div></div>` : ''}
    <div class="ops-h">REPUTATION</div>${V12.repBars()}
    <button class="ops-b gold wide" id="ops-caps">CAPABILITIES · ${S.player.skillPoints || 0} PT${(S.player.skillPoints || 0) === 1 ? '' : 'S'}</button>
    ${hintHTML()}`;
  const objHost = el.querySelector('#ops-objs'); if(objHost && typeof sideCaseFile === 'function') try{ sideCaseFile(objHost); }catch(e){}
  el.querySelector('#ops-caps').addEventListener('click', ()=>{ V12._returnOps = true; openSkillTree(); });
}
function hintHTML(){
  const o = V12.ops();
  if((o.sinceInk || 0) < 8) return '';
  const m = S.game.currentMission;
  const h = m === 'm2' ? 'Start with what you found today. Whose name is on KC\'s SIMs — and where do her SIMs sleep at night?'
    : m === 'm3n' ? 'Put Obi\'s notebook next to the courier\'s phone. Same night?'
    : ['m4','m5','m6'].includes(m) ? 'Follow the paper: where did each ledger say to go next?'
    : ['m7','m8'].includes(m) ? 'Every call pinged one tower. Where does the handset sleep?'
    : 'Pick one suspect and ask three things: where was he, what did he carry, who paid him?';
  return `<div class="ops-hint"><img src="${V12.art('uche_neutral')}" alt=""><div><b>SGT. UCHE</b>${h}</div></div>`;
}
function foot(){
  const el = document.getElementById('ops-foot'), o = V12.ops(), tier = V12.intelTier();
  const next = V12.INTEL_TIERS[tier];
  el.innerHTML = `<span class="f"><b>${o.pencils.length}</b>/6 PENCILLED</span><span class="f"><b>${o.inked.length}</b> INKED</span>
    <span class="f">INTEL <b>${S.game.intelScore || 0}</b>${next ? ` · next: ${next.name} at ${next.at}` : ''}</span>
    <span class="f ${V12.warrant() ? 'ok' : ''}">WARRANT <b>${V12.warrant() ? 'SIGNED' : 'PENDING'}</b></span>
    <button class="ops-b" id="ops-erase-all" ${o.pencils.length ? '' : 'disabled'}>ERASE PENCILS</button>`;
  el.querySelector('#ops-erase-all').addEventListener('click', ()=>{ o.pencils = []; render(); });
}

function notesHTML(){
  const rows = [...CASE_ENTRIES_BASE];
  for(const e of (S.game.evidence || [])) rows.push({ ico:'🔬', nm:'EVIDENCE — ' + e.name, ds: V12.evQ(e.id) === 'weak' ? 'Logged, but contested: the defence will attack how it was obtained.' : 'Logged in chain of custody.' });
  const mc = S.game.moralChoices || {};
  const ds = [
    mc.choice === 'detain' ? 'Detained KC.' : '', mc.choice === 'flip' ? 'Signed KC as an informant.' : '', mc.choice === 'force' ? 'Used force on KC.' : '',
    mc.market_runner === 'escaped' ? 'KC got away.' : '',
    mc.entry ? ({ knock:'Knock-and-announce at Lekki.', quiet:'Quiet breach at Lekki.', loud:'Loud breach at Lekki.' })[mc.entry] : '',
    mc.arrest ? ({ professional:'Arrested Obi with restraint.', forceful:'Forceful takedown of Obi.', informant:'Flipped Obi.', bribe:'Took Obi\'s money.' })[mc.arrest] : '',
    mc.checkpoint ? ({ arrest_driver:'Arrested Musa.', flip_driver:'Flipped Musa.', tail_driver:'Let Musa drive on under watch.' })[mc.checkpoint] : '',
    mc.asaba ? ({ rescue:'Pulled Tobi out of the fire.', chase:'Chased Ifeanyi.', failed:'Lost both at Asaba.' })[mc.asaba] || '' : '',
    mc.tower ? 'At Ugbowo: ' + mc.tower.replace('_', ' ') + '.' : '',
    S.game.sealed ? `Sealed accusation filed: ${(V12.CANDIDATES.find(c => c.id === S.game.sealed.who) || {}).name}.` : '',
  ].filter(Boolean).join(' ');
  if(ds) rows.push({ ico:'⚖', nm:'YOUR DECISIONS', ds });
  return `<div class="ops-notes">${rows.map(e => `<div class="case-row"><div class="ico">${e.ico}</div><div class="body"><div class="nm">${e.nm}</div><div class="ds">${e.ds}</div></div></div>`).join('')}</div>`;
}

/* ---------- the sealed accusation ---------- */
function sealModal(){
  const m = document.getElementById('ops-modal');
  if(S.game.sealed){
    const c = V12.CANDIDATES.find(x => x.id === S.game.sealed.who) || {};
    m.innerHTML = `<div class="ops-mbox"><div class="ops-h">SEALED REPORT · BENIN ZONAL</div><p class="ops-p">You named <b>${c.name}</b> as the Voice. Sealed reports can't be withdrawn.</p><button class="btn ghost" id="seal-ok">CLOSE</button></div>`;
    m.classList.add('show'); m.querySelector('#seal-ok').onclick = ()=>m.classList.remove('show'); return;
  }
  let pick = null;
  m.innerHTML = `<div class="ops-mbox wide">
    <div class="ops-h">WHO IS THE VOICE?</div>
    <p class="ops-p">A sealed report goes to Benin Zonal tonight, before anyone else knows what you think. You can't take it back. If you're right, it will matter.</p>
    <div class="acc-grid">${V12.CANDIDATES.map(c => `<button class="acc-card" data-id="${c.id}"><img src="${V12.art(c.art)}" alt=""><b>${c.name}</b><span>${c.role}</span></button>`).join('')}</div>
    <div class="ops-mact"><button class="btn ghost" id="seal-cancel">NOT YET</button><button class="btn primary" id="seal-go" disabled>SEAL IT</button></div></div>`;
  m.classList.add('show');
  m.querySelectorAll('.acc-card').forEach(b => b.addEventListener('click', ()=>{ pick = b.dataset.id; m.querySelectorAll('.acc-card').forEach(x => x.classList.toggle('sel', x === b)); m.querySelector('#seal-go').disabled = false; if(typeof sfxClick === 'function') sfxClick(); }));
  m.querySelector('#seal-cancel').onclick = ()=>m.classList.remove('show');
  m.querySelector('#seal-go').onclick = ()=>{
    if(!pick) return;
    const go = m.querySelector('#seal-go');
    if(!go.dataset.armed){ go.dataset.armed = '1'; go.textContent = 'TAP AGAIN TO SEAL'; return; }
    S.game.sealed = { who:pick, at:S.game.currentMission, before:!S.game._finOsas, t:Date.now() };
    m.classList.remove('show');
    toast('REPORT SEALED', 'It goes to Benin Zonal tonight.', 2400);
    if(typeof saveGame === 'function') saveGame(true);
    V12.log('sealed', { who:pick, m:S.game.currentMission });
    render();
  };
}

})();
