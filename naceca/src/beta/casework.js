/* beta/casework.js — friends-beta pass (see docs/SYNC-2026-10-08-beta.md)
   =========================================================================
   NACECA · casework — "the investigation is too easy"
   1. Casework difficulty per investigation: RECRUIT (deduction hints on) or
      SENIOR AGENT (default). Chosen on the new-game sheet, editable in
      Settings, mirrored on <body> as cw-recruit / cw-senior.
   2. A paper CHARGE SHEET before each raid (Lagos before Lekki, the route
      before Asaba): SUSPECT, METHOD, MONEY TRAIL, filed with a two-tap
      confirm. Permanent for the save (S.game.accusations).
   3. The warrant is read at filing (V12.warrantFor from the board). Refused
      or unsigned → back to the table, or go in without one (exigent) at a
      real cost. Progress is never blocked.
   4. Wrong answers have consequences, not retries: wrongful detentions,
      headlines, phone and news lines, contested evidence, lost bonuses.
      Canon holds: Obi is still arrested at Lekki, Ifeanyi is still the fixer.
   ========================================================================= */
(function(){
'use strict';
const V12 = window.V12 = window.V12 || {};
const CW = window.CW = window.CW || {};
const ico = (n, c)=>typeof icon === 'function' ? icon(n, c) : '';
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const recruit = ()=>typeof isRecruit === 'function' && isRecruit();
const log = (t, d)=>{ try{ if(typeof V12.log === 'function') V12.log(t, d); }catch(e){} };
const save = ()=>{ try{ if(typeof saveGame === 'function') saveGame(true); }catch(e){} };
const wrap = (name, make)=>{
  if(typeof V12.wrap === 'function') return V12.wrap(name, make);
  const orig = window[name]; if(typeof orig !== 'function') return false;
  window[name] = make(orig); return true;
};
const AGENCY = 'NATIONAL ANTI-CORRUPTION &amp; ECONOMIC CRIMES AGENCY';
// a short trail of what the casework layer did, for tests and the playtest log
CW.trail = [];
const trail = (k, d)=>{ CW.trail.push([k, d == null ? null : d]); if(CW.trail.length > 120) CW.trail.shift(); };

/* =====================================================================
   1. Casework difficulty
   ===================================================================== */
const sync = ()=>{ if(typeof syncDifficultyClass === 'function') syncDifficultyClass(); };
wrap('loadGame', orig => function(){
  const ok = orig.apply(this, arguments);
  try{
    if(S && S.game){
      if(S.game.difficulty !== 'recruit') S.game.difficulty = 'senior';           // old saves → Senior
      if(!S.game.accusations || typeof S.game.accusations !== 'object') S.game.accusations = {};
    }
  }catch(e){}
  sync();
  return ok;
});
wrap('beginMission', orig => function(){ sync(); return orig.apply(this, arguments); });
// v12 rewrote the old Difficulty note at load; this row is Action pace now
try{
  const d = (typeof SETTINGS_UI !== 'undefined') && SETTINGS_UI.find(r => r.key === 'difficulty');
  if(d){ d.label = 'Action pace'; d.opts = [['story','Relaxed'], ['standard','Standard'], ['hard','Hard']]; d.note = 'Timers, chase speed and minigames. Deduction hints are set by Casework.'; }
}catch(e){}
sync();

/* =====================================================================
   2. Case data (canon-checked against docs/STORY-CANON.md and the
      content map). One correct line per section; the rest are the red
      herrings the player has actually met by the time the sheet opens.
   ===================================================================== */
const CASES = CW.CASES = {
  lagos: {
    label:'LAGOS', raid:'m3', group:'lagos',
    meta:'FILE NACECA-2026/0034 · LAGOS · RAID: LEKKI, OLD GRA',
    lead:'Before a magistrate signs for Lekki, the Commander wants it in writing. One line in each section. Your name goes at the bottom.',
    q:{ suspect:'Who runs the Lagos end of the ring?', method:'How do they take the money?', money:'Where does the money go?' },
    suspect:[
      { id:'kc',    name:'KC', line:'Sells data cards at the Ikeja market. Age 17. The phone was on his counter.' },
      { id:'tunde', name:'Tunde', line:'Your informant at the Ikeja market. Knew KC\'s bag and where the sleeves were dumped.' },
      { id:'obi',   name:'"Chief" E. Obi', line:'Lekki mansion, Old GRA. Titled Akaeze of Umuoji.', ok:true },
      { id:'pos',   name:'An Ikeja POS agent', line:'One of three agents cashing out more than ₦5M a day.' },
    ],
    method:[
      { id:'alerts',  name:'Fake credit alerts', line:'Traders shown a bogus "payment received" SMS hand over their goods before the money clears.' },
      { id:'insider', name:'A bank insider', line:'Someone inside Crestline Bank leaking customers\' BVNs and PINs to a crew that empties the accounts.' },
      { id:'ponzi',   name:'A "cooperative" Ponzi', line:'A cooperative promising thirty percent a month, paying old members out of new deposits.' },
      { id:'phish',   name:'BVN phishing on dead people\'s SIMs', line:'A spoofed Crestline Bank text and a cloned login page, sent from SIMs registered to a dead pensioner.', ok:true },
    ],
    money:[
      { id:'wallet',   name:'Wallet → OTC desks → Ikeja POS → Lekki', line:'0xE7…91A sends 0.62 BTC to three OTC desks; three Ikeja agents cash it out; the cash goes home to Lekki.', ok:true },
      { id:'transfer', name:'Direct transfers to Chief Obi', line:'Phished accounts wired straight into his personal account, a little each night.' },
      { id:'coop',     name:'Grace Divine Cooperative', line:'Allen Avenue. Members\' deposits pooled in one account and paid out in cash.' },
      { id:'kctake',   name:'KC\'s data-card takings', line:'Cash through the data-card stall at the Ikeja market, a little at a time.' },
    ],
    recruit:{ suspect:'Whose house do the dead woman\'s SIMs sleep in at night?', method:'What was being staged from KC\'s phone — not just sent to it?', money:'The wallet emptied the night before the cash-outs. Follow it.' },
    wrongEff:{ publicTrust:-8, agencyFavour:-3 },
    methodEv:['phishing_template', 'kc_sims'],
    moneyEv:['cash', 'obi_notebook'],
    exigentEv:['laptop', 'cash', 'safe_drives'],
    held:{
      kc:()=>(S.game.moralChoices || {}).market_runner === 'escaped'
        ? 'Your charge sheet named KC as "the ringleader". He was never found: his face went up on a NACECA wanted notice in Computer Village.'
        : 'KC was held as "the ringleader" on your charge sheet and released without charge.',
      tunde:'Tunde, your own informant, spent a night in a NACECA cell on your charge sheet.',
      pos:'An Ikeja POS agent spent the night in a cell as "the ringleader" on your charge sheet.',
    },
    headline:{
      kc:()=>(S.game.moralChoices || {}).market_runner === 'escaped'
        ? { pub:'WAVE24 NEWS', head:'Missing Teen Named as "Kingpin" Hours Before Lekki Chief\'s Arrest', ded:'NACECA put a 17-year-old from Ikeja market on a wanted notice as the ring\'s leader. By morning its officers had Chief Obi in cuffs. KC\'s mother wants to know who signed the sheet.' }
        : { pub:'WAVE24 NEWS', head:'Teen Data-Card Seller Held as "Kingpin" Hours Before Lekki Chief\'s Arrest', ded:'NACECA charged a 17-year-old from Ikeja market as the ring\'s leader. By morning its officers had Chief Obi in cuffs. KC\'s mother wants to know who signed the sheet.' },
      tunde:{ pub:'THE DAILY GONG', head:'NACECA Arrests Its Own Market Informant as Lekki Raid Nets a Chief', ded:'The man who pointed officers at Ikeja\'s SIM runners spent a night in their cells. Nobody at the market will talk to NACECA now.' },
      pos:{ pub:'THE LAGOS LEDGER', head:'POS Agent Detained as Ringleader — Then NACECA Arrests a Chief', ded:'An Ikeja cash-out agent was held overnight on a NACECA charge sheet. Traders say the agent only ran the machine.' },
    },
  },
  route: {
    label:'THE ROUTE', raid:'m6', group:'route',
    meta:'FILE NACECA-2026/0034 · EDO / DELTA · RAID: ASABA RIVERSIDE',
    lead:'Before Delta Command lets officers across the Niger, the Commander wants it in writing. One line in each section. Your name goes at the bottom.',
    q:{ suspect:'Who runs the route into Asaba?', method:'How does the route move the cash?', money:'Where does the route\'s money go next?' },
    suspect:[
      { id:'musa',    name:'Musa', line:'Drove the cattle lorry on the Benin Bypass. The ledger rode in his truck.' },
      { id:'tobi',    name:'Tobi Onuoha', line:'Accountant on the Asaba riverside. Keeps the books for several firms.' },
      { id:'ifeanyi', name:'Ifeanyi', line:'Asaba riverside. Books lorries and warehouse space for other people\'s cargo.', ok:true },
      { id:'agent',   name:'The Asaba Main Market SIM agent', line:'Activates SIM cards in bulk from a market stall.' },
    ],
    method:[
      { id:'route',     name:'Welded panels, shrine cover, ghost SIMs', line:'A false compartment behind the cattle, cash in padlocked jerry-cans at the Ozalla shrine, SIMs in a dead pensioner\'s name.', ok:true },
      { id:'feed',      name:'Guns and cash in the cattle feed', line:'A stolen lorry on fake Abuja plates, guns and cash under the feed, waved through at every checkpoint.' },
      { id:'offerings', name:'Cash laundered as shrine offerings', line:'The custodian takes the cash in as offerings, and the elders bank it as donations to the shrine.' },
      { id:'levy',      name:'A "levy" racket on the Bypass', line:'Fake union cards and hologram stickers sold to every lorry in the queue, five thousand a truck.' },
    ],
    money:[
      { id:'kano',     name:'Back to the Kano consignor', line:'Alh. Rabiu Mukhtar, the consignor named on the waybill, paid on delivery.' },
      { id:'abattoir', name:'Delta Riverside Abattoir Ltd', line:'The consignee on Musa\'s waybill, at the Sapele end of the route.' },
      { id:'asaba',    name:'Across the Niger to an Asaba warehouse', line:'From the shrine\'s jerry-cans to a commercial warehouse on the Asaba riverside.', ok:true },
      { id:'lagos',    name:'Back to Chief Obi in Lagos', line:'The ring\'s old paymaster, through the same Lekki accounts as before.' },
    ],
    recruit:{ suspect:'Musa drives. Who books the space at the other end?', method:'What did you actually find — in the lorry, and in the pots?', money:'Where did the forest ledger say the next leg goes?' },
    wrongEff:{ publicTrust:-6 },
    methodEv:['shrine_pots', 'asaba_sims'],
    moneyEv:['shrine_cache', 'e_shrine_ledger'],
    exigentEv:['asaba_sims', 'asaba_runner'],
    held:{
      tobi:()=>{ const a = (S.game.moralChoices || {}).asaba;
        return a === 'rescue' ? 'Tobi Onuoha was cuffed to a hospital bed at St. Theresa\'s on your charge sheet. The order was lifted by noon.'
          : (a === 'chase' && !S.game._asabaHostageLost) ? 'Tobi Onuoha was pulled from the fire, then held on your charge sheet until noon.'
          : 'Your charge sheet named Tobi Onuoha as the route\'s principal. His family read it in the papers.'; },
      agent:'A SIM agent was taken from a stall at Asaba Main Market on your charge sheet and released without charge.',
      musa:()=>{ const cp = (S.game.moralChoices || {}).checkpoint;
        return cp === 'arrest_driver' ? 'Musa, in a cell since the Bypass, was charged as "the route\'s principal" on your charge sheet.'
          : cp === 'tail_driver' ? 'Musa was pulled off the road and held as "the route\'s principal" on your charge sheet. The tail on him went with it.'
          : 'Musa was re-arrested as "the route\'s principal" on your charge sheet.'; },
    },
    headline:{
      tobi:()=>{ const a = (S.game.moralChoices || {}).asaba, alive = a === 'rescue' || (a === 'chase' && !S.game._asabaHostageLost);
        return alive ? { pub:'WAVE24 NEWS', head:'Rescued Accountant Held on NACECA Charge Sheet After Asaba Fire', ded:'Tobi Onuoha was named as the route\'s principal hours after officers pulled him from the smoke. The order was lifted by noon.' }
          : { pub:'WAVE24 NEWS', head:'Dead Accountant Named as Cartel Principal on NACECA Charge Sheet', ded:'Tobi Onuoha\'s family learned from the papers that the agency had charged him. They are asking for an apology.' }; },
      agent:{ pub:'THE DAILY GONG', head:'Asaba Market SIM Agent Held as Route Boss, Released Without Charge', ded:'Officers took the agent from a stall in front of customers. The fixer NACECA wanted was another man entirely.' },
      musa:()=>(S.game.moralChoices || {}).checkpoint === 'arrest_driver'
        ? { pub:'NATIONAL DISPATCH', head:'Jailed Lorry Driver Charged as "Route Principal" After Asaba Raid', ded:'Musa has been in a cell since the Benin Bypass. His family says he only drove, and the papers agree with them.' }
        : { pub:'NATIONAL DISPATCH', head:'Lorry Driver Re-Arrested as "Route Principal" After Asaba Raid', ded:'Musa drove cattle on the Benin Bypass. His family says he only drove, and the papers agree with them.' },
    },
  },
  voice: {
    label:'THE VOICE', raid:'m8', group:'voice',
    q:{ suspect:'Who is the Voice?', method:'Why take Osas — and how did it stay hidden?', money:'Where does the money go?' },
    method:[
      { id:'ransom',  name:'Kidnap for ransom', line:'Hold the student until the family pays, and keep the calls short so they can\'t be traced.' },
      { id:'rogue',   name:'A rogue Anti-Kidnapping Squad cell', line:'Officers on the Bypass running their own kidnap trade from behind the checkpoint.' },
      { id:'shield',  name:'Shielded the ring, silenced a witness', line:'Protected the ring from inside, blocked the mast watch and the backup, and took Osas for the payroll copies.', ok:true },
      { id:'custody', name:'Obi directing it from custody', line:'Calls placed for him from outside the cell, by people still on his payroll.' },
    ],
    money:[
      { id:'pos',    name:'Ransom through Ikeja POS agents', line:'The old Lagos cash-out route reopened: ransom split across Ikeja POS agents.' },
      { id:'ca',     name:'"C.A." — Obi\'s Fridays and the payroll', line:'₦2.5M a week in Obi\'s notebook, "C.A. — LAGOS — MONTHLY" on the payroll, paid out through student mule accounts.', ok:true },
      { id:'ikpoba', name:'Ikpoba Mast Services contracts', line:'Inflated tower maintenance invoices, billed through the mast contractor.' },
      { id:'grace',  name:'Grace Divine Cooperative', line:'Allen Avenue deposits moved east to pay the people who kept quiet.' },
    ],
    recruit:{ suspect:'Whose words keep coming back on the calls?', method:'Osas found a payroll. Was this ever about money for the family?', money:'Who does Obi\'s notebook pay every Friday?' },
    wrongEff:{ publicTrust:-10, integrity:-5 },
    held:{
      uche:'On your word, Sgt. Uche was arrested at HQ the next morning, in front of his own squad.',
      osaro:'On your word, Engr. Osaro was arrested at the Ugbowo mast, in front of his crew.',
      obi:'On your word, Chief Obi was charged again from his cell. His lawyers called it a stunt.',
      ifeanyi:'On your word, Ifeanyi was charged as the Voice. The papers ran his face for a week.',
      chidi:'On your word, Insp. Chidi was arrested at the Bypass checkpoint, in front of his men.',
    },
    epilogue:{
      uche:{ art:'uche_evasive', name:'SGT. UCHE', text:'Held two days on your accusation, then released. He came back to work on the Monday. He has not called you "sir" since.' },
      osaro:{ art:'osaro_neutral', name:'ENGR. OSARO', text:'Arrested in front of his crew on your word and released after four days. He still keeps the Ugbowo mast running. He does not take NACECA\'s calls.' },
      obi:{ art:'obi_neutral', name:'"CHIEF" OBI', text:'Your second charge against him was thrown out in a morning. His lawyers quote it at every hearing since.' },
      ifeanyi:{ art:'ifeanyi_neutral', name:'IFEANYI', text:'Charged as the Voice on your word. The charge collapsed; the route charges did not. He tells everyone NACECA can\'t read its own files.' },
      chidi:{ art:'chidi_neutral', name:'INSP. CHIDI', text:'Arrested at his own checkpoint on your word and released after four days. He still runs the Bypass. He no longer returns NACECA\'s calls.' },
    },
  },
};
const RAID = CW.RAID = { m3:'lagos', m6:'route' };
// missions whose aftermath settles a case's charge sheet (the raid, or anything later if the raid was skipped)
const SETTLE_AT = { lagos:['m3', 'm3n', 'm4', 'm5', 'm6', 'm7', 't7', 'm8'], route:['m6', 'm7', 't7', 'm8'] };
const LABEL = { suspect:'SUSPECT', method:'METHOD', money:'MONEY TRAIL' };
const optOf = (c, k, id)=>((CASES[c] || {})[k] || []).find(o => o.id === id) || null;
CW.optName = (c, k, id)=>{
  if(c === 'voice' && k === 'suspect'){ const x = (V12.CANDIDATES || []).find(o => o.id === id); return x ? x.name : id; }
  const o = optOf(c, k, id); return o ? o.name : (id || '—');
};
const val = (v, ...a)=>typeof v === 'function' ? v(...a) : v;

/* =====================================================================
   3. Records — S.game.accusations[case] = {suspect, method, money, ok, at, …}
   ===================================================================== */
CW.accs = ()=>{ if(!S.game.accusations || typeof S.game.accusations !== 'object') S.game.accusations = {}; return S.game.accusations; };
V12.accused = c => { const a = S && S.game && S.game.accusations; return (a && a[c]) || null; };
CW.needsGate = c => { const r = V12.accused(c); return !r || r.warrant === 'pending' || !r.warrant; };
CW.held = (c, rec)=>{ rec = rec || V12.accused(c); if(!rec || !rec.ok || rec.ok.suspect) return ''; return val(((CASES[c] || {}).held || {})[rec.suspect]) || ''; };
const contest = ids => { S.game.evQ = S.game.evQ || {}; (ids || []).forEach(id => { S.game.evQ[id] = 'weak'; }); };

/* file a charge sheet (also used directly by tests) */
CW.file = function(c, picks, extra){
  const C = CASES[c]; if(!C) return null;
  const ok = {};
  for(const k of ['suspect', 'method', 'money']){
    if(c === 'voice' && k === 'suspect') ok.suspect = picks.suspect === 'adaeze';
    else ok[k] = !!(optOf(c, k, picks[k]) || {}).ok;
  }
  const rec = Object.assign({ suspect:picks.suspect, method:picks.method, money:picks.money, ok, at:S.game.currentMission || null, t:Date.now(),
    diff:(typeof gameDifficulty === 'function' ? gameDifficulty() : 'senior') }, c === 'voice' ? {} : { warrant:'pending' }, extra || {});
  CW.accs()[c] = rec;
  trail('filed', { c, suspect:rec.suspect, ok });
  log('charge_sheet', { c, suspect:rec.suspect, method:rec.method, money:rec.money, ok, d:rec.diff });
  save();
  return rec;
};

/* =====================================================================
   4. The paper sheet (charge sheets, the finale accusation)
   ===================================================================== */
function overlay(id){
  let ov = document.getElementById(id);
  if(!ov){ ov = document.createElement('div'); ov.className = 'overlay cw-ov'; ov.id = id; (document.getElementById('game-root') || document.body).appendChild(ov); }
  ov.classList.add('cw-ov');
  return ov;
}
const click = ()=>{ if(typeof sfxClick === 'function') try{ sfxClick(); }catch(e){} };

/* o = { id, title, meta, lead, sections:[{key, label, q, kind:'opts'|'cards'|'multi', options, max, note}],
         fileLabel, armLabel, cancelLabel, stamp, onFile(picks), onCancel() } */
CW.sheet = function(o){
  const ov = overlay(o.id || 'screen-charge');
  const picks = {};
  for(const s of o.sections) picks[s.key] = s.kind === 'multi' ? (s.preset || []).slice() : (s.preset || null);
  const optHTML = (s, x)=>{
    if(s.kind === 'cards') return `<button class="cw-card" data-k="${s.key}" data-v="${esc(x.id)}" aria-pressed="false">${x.img ? `<img src="${x.img}" alt="">` : '<span class="cw-noimg"></span>'}<b>${esc(x.name)}</b><span class="cw-ol">${esc(x.line || '')}</span><span class="cw-box">${ico('check')}</span></button>`;
    return `<button class="cw-opt" data-k="${s.key}" data-v="${esc(x.id)}" aria-pressed="false"><span class="cw-box">${ico('check')}</span><span class="cw-ot"><b>${esc(x.name)}</b>${x.line ? `<span class="cw-ol">${esc(x.line)}</span>` : ''}${x.tag ? `<em class="cw-tag">${esc(x.tag)}</em>` : ''}</span></button>`;
  };
  ov.innerHTML = `<div class="overlay-bg cw-bg"></div>
    <div class="cw-sheet cw-paper ${o.cls || ''}" role="dialog" aria-modal="true" aria-labelledby="${ov.id}-t">
      <div class="cw-scroll">
        <header class="cw-head">
          <div class="cw-agency">${o.kicker || AGENCY}</div>
          <h2 class="cw-title" id="${ov.id}-t">${esc(o.title || 'CHARGE SHEET')}</h2>
          ${o.meta ? `<div class="cw-meta">${esc(o.meta)}</div>` : ''}
        </header>
        ${o.lead ? `<p class="cw-lead">${o.lead}</p>` : ''}
        ${o.sections.map((s, i) => `
        <section class="cw-sec" data-sec="${s.key}">
          <div class="cw-sec-h"><span class="cw-n">${i + 1}</span><span class="cw-l">${esc(s.label)}</span>${s.q ? `<span class="cw-q">${esc(s.q)}</span>` : ''}${s.kind === 'multi' ? `<span class="cw-count" data-count="${s.key}"></span>` : ''}</div>
          ${s.note ? `<div class="cw-margin">${ico('pin')}<span><b>UCHE'S NOTE</b> ${esc(s.note)}</span></div>` : ''}
          <div class="${s.kind === 'cards' ? 'cw-cards' : 'cw-opts'}">${(s.options || []).map(x => optHTML(s, x)).join('') || `<p class="cw-empty">${esc(s.empty || 'Nothing to choose.')}</p>`}</div>
        </section>`).join('')}
      </div>
      <footer class="cw-foot">
        <div class="cw-warn">${ico('warning')}<span>${esc(o.warn || 'This can\'t be withdrawn.')}</span></div>
        <div class="cw-acts">${o.cancelLabel ? `<button class="cw-btn ghost" data-act="cancel">${esc(o.cancelLabel)}</button>` : ''}<button class="cw-btn primary" data-act="file" disabled>${esc(o.fileLabel || 'FILE CHARGE SHEET')}</button></div>
      </footer>
      <div class="cw-stamp" aria-hidden="true">${esc(o.stamp || 'FILED')}</div>
    </div>`;
  const sheet = ov.querySelector('.cw-sheet'), fileB = ov.querySelector('[data-act="file"]');
  let armed = false, done = false;
  const complete = ()=>o.sections.every(s => {
    if(s.kind !== 'multi') return !!picks[s.key];
    const n = (s.options || []).length, need = Math.min(s.max || 3, n);
    return picks[s.key].length === need;
  });
  const disarm = ()=>{ armed = false; fileB.classList.remove('armed'); sheet.classList.remove('arming'); fileB.textContent = o.fileLabel || 'FILE CHARGE SHEET'; };
  const refresh = ()=>{
    ov.querySelectorAll('[data-k]').forEach(b => {
      const s = o.sections.find(x => x.key === b.dataset.k), v = b.dataset.v;
      const on = s.kind === 'multi' ? picks[s.key].includes(v) : picks[s.key] === v;
      b.classList.toggle('sel', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    o.sections.filter(s => s.kind === 'multi').forEach(s => { const el = ov.querySelector(`[data-count="${s.key}"]`); if(el) el.textContent = `${picks[s.key].length}/${Math.min(s.max || 3, (s.options || []).length)}`; });
    fileB.disabled = done || !complete();
  };
  ov.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', ()=>{
    if(done) return;
    const s = o.sections.find(x => x.key === b.dataset.k), v = b.dataset.v;
    if(s.kind === 'multi'){
      const arr = picks[s.key], i = arr.indexOf(v);
      if(i >= 0) arr.splice(i, 1);
      else if(arr.length < (s.max || 3)) arr.push(v);
      else { if(typeof toast === 'function') toast('THREE ONLY', 'Put one back first', 1400); return; }
    } else picks[s.key] = v;
    click(); disarm(); refresh();
  }));
  const close = ()=>{ ov.classList.remove('show'); if(S.game && S.game.currentMission && typeof showHUD === 'function') showHUD(true); };
  const cancel = ov.querySelector('[data-act="cancel"]');
  if(cancel) cancel.addEventListener('click', ()=>{ if(done) return; click(); close(); trail('sheet_cancel', o.id); if(typeof o.onCancel === 'function') o.onCancel(); });
  fileB.addEventListener('click', ()=>{
    if(done || fileB.disabled) return;
    if(!armed){ armed = true; fileB.classList.add('armed'); fileB.textContent = o.armLabel || 'TAP AGAIN TO FILE'; sheet.classList.add('arming'); click(); return; }
    done = true; refresh();
    fileB.classList.remove('armed'); fileB.textContent = o.stamp || 'FILED';
    if(cancel) cancel.disabled = true;
    sheet.classList.remove('arming'); sheet.classList.add('filed');
    if(typeof sfxComplete === 'function') try{ sfxComplete(); }catch(e){}
    if(typeof haptic === 'function') haptic([20, 40, 30]);
    const out = {}; for(const s of o.sections) out[s.key] = s.kind === 'multi' ? picks[s.key].slice() : picks[s.key];
    setTimeout(()=>{ close(); if(typeof o.onFile === 'function') o.onFile(out); }, o.stampMs == null ? 950 : o.stampMs);
  });
  refresh();
  if(typeof showHUD === 'function') showHUD(false);
  if(typeof showOverlay === 'function') showOverlay(ov.id); else ov.classList.add('show');
  const sc = ov.querySelector('.cw-scroll'); if(sc) sc.scrollTop = 0;
  trail('sheet_open', o.id);
  return { ov, picks, close };
};

/* the pre-raid charge sheet for a case */
CW.chargeSheet = function(c, onFiled, onCancel){
  const C = CASES[c]; if(!C) return null;
  const rec = recruit();
  return CW.sheet({
    id:'screen-charge', title:'CHARGE SHEET', meta:C.meta, lead:C.lead,
    sections:['suspect', 'method', 'money'].map(k => ({ key:k, label:LABEL[k], q:C.q[k], kind:'opts', options:C[k], note:rec ? C.recruit[k] : null })),
    cancelLabel:'NOT YET', fileLabel:'FILE CHARGE SHEET', stamp:'FILED',
    onFile:picks => { const r = CW.file(c, picks); if(typeof onFiled === 'function') onFiled(r); },
    onCancel,
  });
};

/* =====================================================================
   5. The warrant — read from the board at filing
   ===================================================================== */
CW.warrant = function(c){
  let w = null;
  try{ if(typeof V12.warrantFor === 'function') w = V12.warrantFor(c); }catch(e){ w = null; }
  if(!w || typeof w !== 'object'){
    let signed = true;
    try{ if(typeof V12.warrant === 'function') signed = !!V12.warrant(); }catch(e){ signed = (S.game.intelScore || 0) >= 50; }
    w = { strength:signed ? 100 : 40, signed, refused:false, strikes:0, need:signed ? '' : 'Ink more links' };
  }
  const signed = !!w.signed, refused = !signed && !!w.refused;
  const need = String(w.need || (refused ? 'Find new evidence' : 'Ink more links')).replace(/[.\s]+$/, '');
  return { strength:Math.max(0, Math.min(100, Math.round(+w.strength || 0))), signed, refused, strikes:w.strikes | 0, need };
};
CW.EXIGENT_COST = { agencyFavour:-5 };
CW.goExigent = function(c){
  const rec = V12.accused(c), C = CASES[c]; if(!rec || !C) return;
  if(rec.warrant === 'exigent') return;
  rec.warrant = 'exigent'; rec.exigentAt = S.game.currentMission || null;
  applyEffect(CW.EXIGENT_COST);
  contest(C.exigentEv);
  trail('exigent', c); log('warrant', { c, w:'exigent' });
  save();
};
CW.warrantPanel = function(c, w, h){
  const C = CASES[c] || {};
  const ov = overlay('screen-warrant');
  ov.innerHTML = `<div class="overlay-bg cw-bg"></div>
    <div class="cw-sheet cw-paper cw-warrant" role="dialog" aria-modal="true" aria-labelledby="screen-warrant-t">
      <div class="cw-scroll">
        <header class="cw-head"><div class="cw-agency">${AGENCY}</div><h2 class="cw-title" id="screen-warrant-t">SEARCH WARRANT</h2><div class="cw-meta">${esc(C.meta || '')}</div></header>
        <div class="cw-stamp show" aria-hidden="true">${w.refused ? 'REFUSED' : 'NOT SIGNED'}</div>
        <dl class="cw-facts">
          <div><dt>STATUS</dt><dd>${w.refused ? 'REFUSED' : 'NOT SIGNED'}</dd></div>
          <div><dt>CASE STRENGTH</dt><dd>${w.strength} / 100</dd></div>
          <div><dt>WRONG LINKS FILED</dt><dd>${w.strikes} / 3</dd></div>
          <div><dt>THE MAGISTRATE</dt><dd>${esc(w.need)}.</dd></div>
        </dl>
        <p class="cw-lead">${w.refused ? 'Refused until you bring something new: a new card on the table, or a new link that holds.' : 'Not enough on the table for a signature yet.'} Or go in without one, and carry the cost.</p>
        <ul class="cw-costs">
          <li>${ico('warning')}<span>Agency Standing −5</span></li>
          <li>${ico('warning')}<span>Evidence from the raid is logged as contested</span></li>
          <li>${ico('warning')}<span>The operation's grade is capped at B</span></li>
        </ul>
      </div>
      <footer class="cw-foot"><div class="cw-acts">
        <button class="cw-btn ghost" data-act="back">${ico('back')}<span>BACK TO THE TABLE</span></button>
        <button class="cw-btn danger" data-act="exigent">GO IN WITHOUT A WARRANT</button>
      </div></footer>
    </div>`;
  const ex = ov.querySelector('[data-act="exigent"]');
  let armed = false;
  const close = ()=>{ ov.classList.remove('show'); if(S.game && S.game.currentMission && typeof showHUD === 'function') showHUD(true); };
  ov.querySelector('[data-act="back"]').addEventListener('click', ()=>{ click(); close(); trail('warrant_back', c); if(h && h.onBack) h.onBack(); });
  ex.addEventListener('click', ()=>{
    if(!armed){ armed = true; ex.classList.add('armed'); ex.textContent = 'TAP AGAIN — NO WARRANT'; click(); return; }
    close();
    if(h && h.onExigent) h.onExigent();
  });
  if(typeof showHUD === 'function') showHUD(false);
  if(typeof showOverlay === 'function') showOverlay('screen-warrant'); else ov.classList.add('show');
  trail('warrant_panel', { c, refused:w.refused });
  return ov;
};

/* =====================================================================
   6. The raid gate — hub Commander call (h2, h5) and, when a raid is
      reached any other way, the M3 plan / the M6 briefing.
   ctx = { where:'hub'|'mission', video:bool }
   proceed(preLines) continues the caller's flow; preLines go in front of
   the Commander's briefing at the hub.
   ===================================================================== */
const CMD = ctx => ctx.video ? 'COMMANDER ADAEZE · VIDEO CALL' : 'COMMANDER ADAEZE';
const cmd = (ctx, text, mood)=>({ speaker:CMD(ctx), portrait:'commander', mood, text });
const uche = (text, mood)=>({ speaker:'SGT. UCHE', portrait:'sergeant', mood, text });
function introLines(c, ctx){
  if(ctx.where === 'hub'){
    return c === 'lagos'
      ? [cmd(ctx, 'Sit, Agent. Before I wake a magistrate at this hour, I want it on paper.'),
         cmd(ctx, 'Who runs the Lagos end, how they take the money, and where it goes. Your name goes at the bottom, and it doesn\'t come back out.')]
      : [cmd(ctx, 'Kelechi. Before I ask Delta Command to let my officers across the Niger, I want your charge sheet.'),
         cmd(ctx, 'Who runs that route, how it moves the cash, and where the money goes next. Sign it. It goes on the file tonight.')];
  }
  return c === 'lagos'
    ? [uche('Sir. The Commander won\'t sign off on Lekki without your charge sheet. Who, how, and where the money goes.')]
    : [uche('Before I brief you, sir: the Commander wants your charge sheet on the file. Who, how, and where the money goes.')];
}
function resumeHUD(){ if(S.game.currentMission && !document.querySelector('.overlay.show') && typeof showHUD === 'function') showHUD(true); }
function warrantStep(c, ctx, proceed){
  const rec = V12.accused(c), w = CW.warrant(c);
  trail('warrant', { c, signed:w.signed, refused:w.refused });
  if(w.signed){
    rec.warrant = 'signed'; rec.warrantAt = S.game.currentMission || null; save();
    log('warrant', { c, w:'signed', strength:w.strength });
    if(typeof toast === 'function') toast('WARRANT SIGNED', 'The charge sheet is on the file', 2000);
    proceed(ctx.where === 'hub' ? [cmd(ctx, 'The magistrate has signed. Your charge sheet holds — on paper, at least.')] : []);
    return;
  }
  log('warrant', { c, w:w.refused ? 'refused' : 'pending', strength:w.strength, strikes:w.strikes });
  const panel = ()=>CW.warrantPanel(c, w, {
    onBack:()=>{
      if(ctx.video && typeof V12.videoCall === 'function') V12.videoCall(false);
      if(typeof toast === 'function') toast('BACK TO THE TABLE', ctx.where === 'hub' ? 'Work the table, then call the Commander again.' : 'Work the table, then see Uche again.', 2600);
      if(typeof V12.openOps === 'function') V12.openOps(CASES[c].group); else resumeHUD();
    },
    onExigent:()=>{
      CW.goExigent(c);
      if(ctx.where === 'hub') proceed([cmd(ctx, 'Exigent circumstances. Your call — and your name on it. When the defence asks why, you answer them, not me.', 'evasive')]);
      else { if(typeof toast === 'function') toast('NO WARRANT', 'Exigent circumstances — it\'s on the record', 2400); proceed([]); }
    },
  });
  if(ctx.where === 'hub' && typeof startDialogue === 'function'){
    DIALOGUE.cw_gate_warrant = [cmd(ctx, w.refused ? `The magistrate sent it back, Agent. ${w.need}. I won't put officers through a door on that.` : `The magistrate won't sign on what's on your table yet. ${w.need}.`, 'evasive')];
    startDialogue('cw_gate_warrant', panel);
  } else panel();
}
V12.raidGate = function(c, ctx, proceed){
  ctx = ctx || {}; proceed = typeof proceed === 'function' ? proceed : ()=>{};
  if(!CASES[c] || c === 'voice'){ proceed([]); return; }
  const rec = V12.accused(c);
  if(rec && (rec.warrant === 'signed' || rec.warrant === 'exigent')){ proceed([]); return; }
  trail('gate', { c, where:ctx.where || 'mission', filed:!!rec });
  if(rec){ warrantStep(c, ctx, proceed); return; }
  const open = ()=>CW.chargeSheet(c, ()=>warrantStep(c, ctx, proceed), ()=>{
    if(ctx.video && typeof V12.videoCall === 'function') V12.videoCall(false);
    if(typeof toast === 'function') toast('NOT YET', ctx.where === 'hub' ? 'The Commander will wait. Call when your sheet is ready.' : 'Uche will wait. See him when your sheet is ready.', 2400);
    resumeHUD();
  });
  if(ctx.video && typeof V12.videoCall === 'function') V12.videoCall(true);
  if(typeof startDialogue === 'function'){ DIALOGUE.cw_gate_intro = introLines(c, ctx); startDialogue('cw_gate_intro', open); }
  else open();
};
/* tests and tools: file the right sheet with a signed warrant, no UI */
CW.autofile = function(c, picks, warrant){
  const C = CASES[c]; if(!C) return null;
  const p = picks || {};
  for(const k of ['suspect', 'method', 'money']) if(!p[k]) p[k] = c === 'voice' && k === 'suspect' ? 'adaeze' : (C[k].find(o => o.ok) || {}).id;
  return CW.file(c, p, c === 'voice' ? {} : { warrant:warrant || 'signed' });
};

/* M6 reached any other way: the charge sheet comes before Uche names the fixer */
wrap('startDialogue', orig => function(key){
  if(key === 'asaba_brief' && S && S.game && S.game.currentMission === 'm6' && CW.needsGate('route')){
    const self = this, args = arguments;
    V12.raidGate('route', { where:'mission' }, ()=>orig.apply(self, args));
    return;
  }
  return orig.apply(this, arguments);
});

/* =====================================================================
   7. Consequences
   ===================================================================== */
const WRONG_LINE_AF = CW.WRONG_LINE_AF = 2, WRONG_LINE_PTS = CW.WRONG_LINE_PTS = 5;
CW.settle = function(c){
  const rec = V12.accused(c), C = CASES[c];
  if(!rec || !C || rec.settled || c === 'voice') return false;
  rec.settled = S.game.currentMission || true;
  const ok = rec.ok || {}, eff = {};
  if(!ok.suspect) Object.assign(eff, C.wrongEff);
  if(!ok.method) contest(C.methodEv);
  if(!ok.money){
    contest(C.moneyEv);
    if(c === 'lagos'){
      // the money-trail theory's +15 intel is struck from the file
      const had = typeof V12.theory === 'function' && V12.theory('t_money');
      if(had && !rec.tmoneyLost) S.game.intelScore = Math.max(0, (S.game.intelScore || 0) - 15);
      rec.tmoneyLost = true;
    }
  }
  if(ok.suspect && ok.method && ok.money) eff.agencyFavour = (eff.agencyFavour || 0) + 3;
  // each wrong line the prosecutor has to walk back costs the agency standing (and the grade, below)
  const wrongLines = (ok.method ? 0 : 1) + (ok.money ? 0 : 1);
  if(wrongLines) eff.agencyFavour = (eff.agencyFavour || 0) - WRONG_LINE_AF * wrongLines;
  if(Object.keys(eff).length) applyEffect(eff);
  rec.eff = eff;
  trail('settle', { c, eff });
  log('charge_settled', { c, ok, eff });
  return true;
};
CW.settleAll = ()=>{ for(const c of ['lagos', 'route']){ const r = V12.accused(c); if(r && !r.settled) CW.settle(c); } };
// a later money-trail theory doesn't pay out once the Lagos money line has failed
try{
  const tm = (V12.OPS_THEORIES || []).find(t => t && t.id === 't_money');
  if(tm && !tm._cw){
    const on = tm.on; tm._cw = true;
    tm.on = function(){ const r = V12.accused('lagos'); if(r && r.settled && r.ok && !r.ok.money){ r.tmoneyLost = true; return; } return typeof on === 'function' ? on.apply(this, arguments) : undefined; };
  }
}catch(e){}

wrap('showAftermath', orig => function(){
  try{ const m = S.game.currentMission; for(const c of ['lagos', 'route']) if(SETTLE_AT[c].includes(m)) CW.settle(c); }catch(e){ console.warn('[casework] settle', e); }
  const r = orig.apply(this, arguments);
  try{ CW.review(S.game.currentMission); }catch(e){ console.warn('[casework] review', e); }
  return r;
});
wrap('generateHeadline', orig => function(){
  const h = orig.apply(this, arguments);
  try{
    const c = RAID[S.game.currentMission], rec = c && V12.accused(c);
    if(rec && rec.ok && !rec.ok.suspect){
      const w = val((CASES[c].headline || {})[rec.suspect]);
      if(w){
        if(c === 'lagos' && (S.game.moralChoices || {}).arrest === 'bribe') return Object.assign({}, h, { ded:h.ded + ' ' + CW.held(c, rec) });
        return Object.assign({}, w, { cw:'wrong_' + rec.suspect });
      }
    }
  }catch(e){}
  return h;
});
const gradeOf = pts => pts >= 85 ? 'S' : pts >= 70 ? 'A' : pts >= 55 ? 'B' : pts >= 40 ? 'C' : 'D';
wrap('computeGrade', orig => function(){
  const r = orig.apply(this, arguments);
  try{
    const c = RAID[S.game.currentMission], rec = c && V12.accused(c);
    if(rec && r){
      let pts = r.pts;
      if(rec.ok && rec.ok.suspect && rec.ok.method && rec.ok.money) pts += 5;
      if(rec.ok) pts -= WRONG_LINE_PTS * ((rec.ok.method ? 0 : 1) + (rec.ok.money ? 0 : 1));
      if(rec.warrant === 'exigent') pts = Math.min(pts, 69);
      r.pts = Math.round(pts); r.g = gradeOf(pts);
    }
  }catch(e){}
  return r;
});

/* the aftermath reviews the charge sheet */
CW.review = function(m){
  const c = RAID[m] || (m === 'm8' ? 'voice' : null), rec = c && V12.accused(c);
  const grid = document.getElementById('aftermath-grid'); if(!rec || !grid) return;
  const old = grid.querySelector('.cw-review'); if(old) old.remove();
  const ok = rec.ok || {};
  // in the finale a right motive or money trail argued against the wrong person is set aside, not upheld
  const aside = k => c === 'voice' && k !== 'suspect' && ok[k] && !ok.suspect;
  const row = (k)=>`<div class="cw-rv-row ${aside(k) ? 'aside' : ok[k] ? 'ok' : 'no'}"><span class="cw-rv-k">${LABEL[k]}</span><span class="cw-rv-v">${esc(CW.optName(c, k, rec[k]))}</span><span class="cw-rv-s">${aside(k) ? 'SET ASIDE' : ok[k] ? ico('check') + 'HOLDS' : ico('cross') + 'FAILS'}</span></div>`;
  const C = CASES[c], notes = [];
  if(!ok.suspect){ const held = c === 'voice' ? val((C.held || {})[rec.suspect]) : CW.held(c, rec); if(held) notes.push(held); }
  if(c !== 'voice'){
    if(!ok.method) notes.push(`The method on your sheet doesn't match the evidence: the defence will contest it. Agency Standing −${WRONG_LINE_AF}, grade −${WRONG_LINE_PTS}.`);
    if(!ok.money) notes.push((c === 'lagos' ? 'The money trail on your sheet is wrong: the cash and the notebook are contested, and the money-trail bonus is struck.' : 'The money trail on your sheet is wrong: the shrine cash and the forest ledger are contested.') + ` Agency Standing −${WRONG_LINE_AF}, grade −${WRONG_LINE_PTS}.`);
    if(ok.suspect && ok.method && ok.money) notes.push('Every line held. Agency Standing +3.');
    notes.push(rec.warrant === 'exigent' ? 'No warrant: you went in under exigent circumstances. The raid evidence is contested and the grade is capped at B.' : rec.warrant === 'signed' ? 'Warrant signed before the raid.' : '');
  } else {
    if(!ok.method) notes.push('Motive on your sheet doesn\'t hold: the defence takes it apart.');
    if(!ok.money) notes.push('Money trail on your sheet doesn\'t hold: the payroll goes unexplained.');
  }
  const el = document.createElement('div');
  el.className = 'cw-review';
  el.innerHTML = `<div class="cw-paper cw-rv">
      <div class="cw-agency">CHARGE SHEET · ${esc(C.label)} · REVIEWED BY THE PROSECUTOR</div>
      <div class="cw-stamp show ${ok.suspect && ok.method && ok.money ? 'good' : ''}" aria-hidden="true">${ok.suspect && ok.method && ok.money ? 'UPHELD' : 'REVIEWED'}</div>
      ${row('suspect')}${row('method')}${row('money')}
      ${notes.filter(Boolean).map(t => `<p class="cw-rv-note">${esc(t)}</p>`).join('')}
    </div>`;
  const nextBlock = [...grid.children].find(b => /NEXT IN THE INVESTIGATION/.test((b.querySelector('h3') || {}).textContent || ''));
  grid.insertBefore(el, nextBlock || null);
};

/* the board's notes: a line under "your decisions" */
V12.caseDecisions = function(){
  const out = [];
  for(const c of ['lagos', 'route', 'voice']){
    const r = V12.accused(c); if(!r) continue;
    const lbl = { lagos:'Lagos', route:'the Route', voice:'the Voice' }[c] || CASES[c].label;
    let t = `Charge sheet, ${lbl}: named ${CW.optName(c, 'suspect', r.suspect)}.`;
    if(c !== 'voice' && r.settled && r.ok && !r.ok.suspect) t += ' Wrongly held.';
    if(r.warrant === 'exigent') t += ' Went in without a warrant.';
    out.push(t);
  }
  return out;
};
function injectNotes(){
  const box = document.querySelector('#screen-ops .ops-notes'); if(!box || box.querySelector('[data-cw]')) return;
  const lines = V12.caseDecisions(); if(!lines.length) return;
  const rows = [...box.querySelectorAll('.case-row')];
  const dec = rows.find(r => /YOUR DECISIONS/.test((r.querySelector('.nm') || {}).textContent || ''));
  if(dec && dec.querySelector('.ds')){ const sp = document.createElement('span'); sp.dataset.cw = '1'; sp.textContent = ' ' + lines.join(' '); dec.querySelector('.ds').appendChild(sp); return; }
  const row = document.createElement('div'); row.className = 'case-row'; row.dataset.cw = '1';
  row.innerHTML = `<div class="ico">${ico('scales')}</div><div class="body"><div class="nm">YOUR DECISIONS</div><div class="ds">${esc(lines.join(' '))}</div></div>`;
  box.appendChild(row);
}
let _mo = null;
function watchOps(){
  if(_mo || typeof MutationObserver === 'undefined') return;
  const ov = document.getElementById('screen-ops'); if(!ov) return;
  _mo = new MutationObserver(injectNotes); _mo.observe(ov, { childList:true, subtree:true });
  injectNotes();
}
if(typeof V12.openOps === 'function' && !V12.openOps._cw){
  const oo = V12.openOps;
  V12.openOps = function(){ const r = oo.apply(this, arguments); try{ watchOps(); injectNotes(); }catch(e){} return r; };
  V12.openOps._cw = true;
}
CW.injectNotes = injectNotes;

/* =====================================================================
   8. The new-game sheet (NEW INVESTIGATION on the title screen)
   ===================================================================== */
window.openNewGameSheet = function(){
  const ov = overlay('screen-newgame');
  let pick = 'senior';
  const has = typeof hasSave === 'function' && hasSave();
  const modes = [
    { v:'recruit', name:'RECRUIT', line:'Deduction hints on: lines worth a second look, an extra miss on documents, Uche\'s notes on the charge sheet.' },
    { v:'senior',  name:'SENIOR AGENT', line:'No deduction hints. You read the papers and you sign for what you conclude. Recommended.' },
  ];
  ov.innerHTML = `<div class="overlay-bg cw-bg"></div>
    <div class="cw-sheet cw-paper cw-newgame" role="dialog" aria-modal="true" aria-labelledby="screen-newgame-t">
      <div class="cw-scroll">
        <header class="cw-head"><div class="cw-agency">${AGENCY}</div><h2 class="cw-title" id="screen-newgame-t">NEW INVESTIGATION</h2><div class="cw-meta">POSTING · AGENT KELECHI · LAGOS HQ · CASE NACECA-2026/0034</div></header>
        <section class="cw-sec">
          <div class="cw-sec-h"><span class="cw-l">CASEWORK</span><span class="cw-q">How much help do you want reading the evidence?</span></div>
          <div class="cw-opts">${modes.map(m => `<button class="cw-opt cw-mode" data-v="${m.v}" aria-pressed="false"><span class="cw-box">${ico('check')}</span><span class="cw-ot"><b>${m.name}</b><span class="cw-ol">${esc(m.line)}</span></span></button>`).join('')}</div>
          <p class="cw-note">Action pace (timers, chases, minigames) is separate, in Settings. You can switch casework there during the investigation.</p>
          ${has ? `<p class="cw-note cw-alert">${ico('warning')}<span>You have a saved investigation. It stays on this device until the new one saves for the first time, after the briefing.</span></p>` : ''}
        </section>
      </div>
      <footer class="cw-foot"><div class="cw-acts">
        <button class="cw-btn ghost" data-act="back">${ico('back')}<span>BACK</span></button>
        <button class="cw-btn primary" data-act="go">BEGIN</button>
      </div></footer>
    </div>`;
  const refresh = ()=>ov.querySelectorAll('.cw-mode').forEach(b => { const on = b.dataset.v === pick; b.classList.toggle('sel', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
  ov.querySelectorAll('.cw-mode').forEach(b => b.addEventListener('click', ()=>{ pick = b.dataset.v; click(); refresh(); }));
  ov.querySelector('[data-act="back"]').addEventListener('click', ()=>{ click(); if(typeof showOverlay === 'function') showOverlay('screen-title'); });
  ov.querySelector('[data-act="go"]').addEventListener('click', ()=>{
    click(); ov.classList.remove('show');
    log('new_game', { d:pick });
    if(typeof startNewInvestigation === 'function') startNewInvestigation(pick);
    else { S = defaultState(); S.game.difficulty = pick; sync(); if(typeof showHUD === 'function') showHUD(false); loadMission('m0'); }
  });
  refresh();
  if(typeof showOverlay === 'function') showOverlay('screen-newgame'); else ov.classList.add('show');
  trail('newgame_open', { save:has });
  return ov;
};

})();
