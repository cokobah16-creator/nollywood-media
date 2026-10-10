/* =========================================================================
   NACECA · v13 desk — the Case Desk: everything you know, in one place
   Tabs: Locker · Phones · Money · CAC · Statements · Warrants · the
   operations table (v12) · Review (after the season). Open it with J, the
   HUD's EVIDENCE button, the pause menu or the case files screen.
   ========================================================================= */

const DESK = { tab:'locker', ret:null, phone:null, sec:null, reg:null, st:null, regQ:'' };
const DESK_TABS = [
  ['locker','LOCKER'], ['phones','PHONES'], ['money','MONEY'], ['registry','CAC'],
  ['statements','STATEMENTS'], ['warrants','WARRANTS'], ['board','OPS TABLE ▸'],
];
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));

function ensureDesk(){
  if(document.getElementById('screen-desk')) return;
  const ov = document.createElement('div'); ov.className = 'overlay'; ov.id = 'screen-desk';
  ov.innerHTML = `<div class="overlay-bg"></div>
    <div class="settings-frame desk-frame">
      <div class="settings-head"><h2>CASE DESK</h2><button class="btn ghost" id="btn-desk-close">◀ BACK</button></div>
      <div class="seg desk-tabs" id="desk-tabs"></div>
      <div class="settings-body desk-body" id="desk-body"></div>
    </div>`;
  document.getElementById('game-root').appendChild(ov);
  document.getElementById('btn-desk-close').addEventListener('click', closeDesk);
  document.getElementById('desk-tabs').addEventListener('click', e=>{
    const b = e.target.closest('button[data-tab]'); if(!b) return;
    if(b.dataset.tab === 'board'){ closeDesk(); openEvidenceBoard(); return; }
    DESK.tab = b.dataset.tab; renderDesk();
  });
  document.getElementById('desk-body').addEventListener('click', deskClick);
  document.getElementById('desk-body').addEventListener('input', e=>{
    if(e.target.id === 'reg-q') DESK.regQ = e.target.value;
  });
  document.getElementById('desk-body').addEventListener('keydown', e=>{
    e.stopPropagation();
    if(e.target.id === 'reg-q' && e.key === 'Enter'){ e.preventDefault(); deskDo('reg-search'); }
  });
}
function openDesk(tab){
  ensureDesk();
  const cur = [...document.querySelectorAll('.overlay.show')].map(o=>o.id)[0] || null;
  DESK.ret = cur === 'screen-desk' ? DESK.ret : cur;
  if(tab) DESK.tab = tab;
  showOverlay('screen-desk');
  renderDesk();
}
function closeDesk(){
  if(DESK.ret === 'screen-plan' && window.V12 && typeof V12.planM3 === 'function' && DESK.planGo){ V12.planM3(DESK.planGo); return; }   // redraw the raid plan with the new warrant
  showOverlay(DESK.ret);
  if(!DESK.ret && S.game.currentMission && ENGINE.movementEnabled) showHUD(true);
  if(DESK.ret === 'screen-briefing' && typeof renderBriefing === 'function') renderBriefing();
}

function deskBadges(){
  const d = I(), b = {};
  b.locker = Object.values(d.items).filter(it => INTEL_ITEMS[it.id] && INTEL_ITEMS[it.id].e && !it.cert && certWindowOpen(it.id)).length;
  b.phones = PHONES.filter(p=>phoneUnlocked(p) && !p.items.some(c=>d.flagged[c.id] !== undefined)).length;
  b.money = Object.keys(d.money.unlocked).filter(k=>!d.money.traced[k]).length;
  b.statements = STATEMENTS.filter(s=>stAvailable(s) && s.claims.some(c=>!(d.st[s.id]||{})[c.id])).length;
  b.warrants = WARRANTS.filter(w=>warrantOpen(w)).length;
  return b;
}
function renderDesk(){
  const b = deskBadges();
  const tabs = DESK_TABS.slice();
  if(S.game.seasonOneComplete) tabs.push(['review','REVIEW']);
  document.getElementById('desk-tabs').innerHTML = tabs.map(([id,l])=>`<button data-tab="${id}" class="${DESK.tab===id?'on':''}">${l}${b[id]?`<i class="dk-badge">${b[id]}</i>`:''}</button>`).join('');
  const R = { locker:renderLocker, phones:renderPhones, money:renderMoney, registry:renderRegistry, statements:renderStatements, warrants:renderWarrants, review:()=>renderReviewHTML(true) }[DESK.tab] || renderLocker;
  document.getElementById('desk-body').innerHTML = R();
}
function deskClick(e){
  const el = e.target.closest('[data-act]'); if(!el) return;
  deskDo(el.dataset.act, el.dataset);
}
function deskDo(act, ds={}){
  const d = I();
  if(act === 'cert'){ certify(ds.id); }
  if(act === 'phone'){ DESK.phone = ds.id; DESK.sec = null; }
  if(act === 'phone-back'){ DESK.phone = null; }
  if(act === 'sec'){ DESK.sec = ds.sec; }
  if(act === 'flag'){ flagClue(ds.id, !d.flagged[ds.id]); (typeof sfxClick==='function' && sfxClick()); }
  if(act === 'trace'){ if(moneyTrace(ds.id)) (typeof sfxComplete==='function' && sfxComplete()); }
  if(act === 'reg-search'){ const q = (document.getElementById('reg-q')||{}).value || DESK.regQ; DESK.regQ = q; DESK.regHits = regSearch(q); if(!DESK.regHits.length) toast('NO RECORD', 'Nothing on the register matches "' + q + '"'); }
  if(act === 'reg-open'){ DESK.reg = ds.key; regFind([ds.key]); }
  if(act === 'reg-back'){ DESK.reg = null; }
  if(act === 'reg-addr'){ DESK.regAddrHits = regAtAddress(ds.addr); DESK.regAddr = ds.addr; DESK.reg = null; }
  if(act === 'reg-ctc'){ d.reg.ctc[ds.key] = true; toast('CERTIFIED TRUE COPY', 'Requested from the CAC — court-ready', 1800); }
  if(act === 'st'){ DESK.st = ds.id; }
  if(act === 'st-back'){ DESK.st = null; }
  if(act === 'verdict'){ const r = stJudge(ds.st, ds.c, ds.v); DESK.stMsg = { c:ds.c, ok:r.ok, msg:r.msg }; r.ok ? ((typeof sfxComplete==='function'&&sfxComplete())) : ((typeof sfxFail==='function'&&sfxFail())); }
  if(act === 'warrant'){ applyWarrant(ds.id, ds.route); }
  if(act === 'goto'){ DESK.tab = ds.tab; }
  renderDesk();
}

/* ---------------- LOCKER ---------------- */
function tierChip(t){ return `<span class="tier t-${t}">${TIER_LABEL[t]||t}</span>`; }
function renderLocker(){
  const d = I();
  const items = Object.values(d.items).filter(it=>INTEL_ITEMS[it.id]).sort((a,b)=>midx(a.m)-midx(b.m));
  const known = Object.keys(d.known).map(f=>`<div class="dk-known"><b>${FACTS[f]||f}</b> — known to ${d.known[f].join(', ')}</div>`).join('');
  if(!items.length) return `<div class="set-note">The exhibit room is empty. Log evidence in the field and it lands here with its custody trail.</div>`;
  const pending = items.filter(it=>INTEL_ITEMS[it.id].e && !it.cert && certWindowOpen(it.id));
  let h = `<div class="dk-intro">Every exhibit, where it came from, who has touched it, and what a defence lawyer will say about it.${pending.length?` <b class="warn">${pending.length} electronic item${pending.length>1?'s':''} still need an s.84 certificate before the next operation.</b>`:''}</div>`;
  if(known) h += `<div class="set-group">WHO KNOWS WHAT</div>${known}`;
  let lastM = null;
  items.forEach(it=>{
    const meta = INTEL_ITEMS[it.id], m = MISSIONS.find(x=>x.id===it.m) || {};
    if(it.m !== lastM){ h += `<div class="set-group">CASE ${m.num||''} · ${esc((m.name||'').toUpperCase())}</div>`; lastM = it.m; }
    const flaws = intelItemFlaws(it.id), integ = intelIntegrity(it.id);
    const ev = (S.game.evidence||[]).find(e=>e.id===it.id);
    let cert = '';
    if(meta.e){
      if(it.cert) cert = `<span class="ok">✔ s.84 certificate on file</span>`;
      else if(certWindowOpen(it.id)) cert = `<button class="mini-btn" data-act="cert" data-id="${it.id}">SIGN s.84 CERTIFICATE · ${certSlotsLeft(it.m)} slot${certSlotsLeft(it.m)===1?'':'s'} left</button>`;
      else cert = `<span class="bad">✘ Never certified — the extraction wasn't hashed</span>`;
    }
    h += `<div class="dk-item">
      <div class="dk-row1"><span class="dk-name">${esc(ev ? ev.name : intelLabel(it.id))}</span>${tierChip(meta.tier)}</div>
      <div class="dk-meta">${meta.kind} · ${esc(meta.src)}</div>
      <div class="dk-integ"><span>INTEGRITY</span><div class="rb"><i style="width:${integ}%;background:${integ>=80?'#5dd07a':integ>=50?'#d8a64a':'#e84a5c'}"></i></div><b>${integ}</b></div>
      ${flaws.length?`<ul class="dk-flaws">${flaws.map(f=>`<li>${esc(f.txt)}</li>`).join('')}</ul>`:''}
      ${cert?`<div class="dk-cert">${cert}</div>`:''}
      <details class="dk-chain"><summary>Chain of custody (${it.custody.length})</summary>${it.custody.map(c=>`<div>• ${esc(c.t)}${c.at?` <span class="dim">· ${esc(c.at)}</span>`:''}</div>`).join('')}</details>
    </div>`;
  });
  return h;
}

/* ---------------- PHONES ---------------- */
function renderPhones(){
  const d = I();
  const avail = PHONES.filter(phoneUnlocked);
  if(!DESK.phone || !avail.some(p=>p.id===DESK.phone)){
    if(!avail.length) return `<div class="set-note">No handsets to read yet. Recover a phone in the field, then read it here.</div>`;
    return `<div class="dk-intro">A phone doesn't say "NEW CLUE". Read it like a life and flag what matters. Flagged items can back a warrant or test a witness.</div>` +
      avail.map(p=>{ const n = p.items.filter(c=>d.flagged[c.id]).length;
        return `<button class="dk-card" data-act="phone" data-id="${p.id}"><div class="dk-name">📱 ${esc(p.name)}</div><div class="dk-meta">${esc(p.model)} · ${p.items.length} items · ${n} flagged</div></button>`; }).join('') +
      PHONES.filter(p=>!phoneUnlocked(p)).map(p=>`<div class="dk-card locked"><div class="dk-name">🔒 ${p.id==='kc'?'A suspect handset':'Another handset'}</div><div class="dk-meta">${p.id==='musa'?'Comes with a proper sit-down with the driver.':p.id==='burner'?'Recovered somewhere in Delta — if you choose to dump it.':'Recover it in the field.'}</div></div>`).join('');
  }
  const p = PHONES.find(x=>x.id===DESK.phone);
  const secs = [...new Set(p.items.map(c=>c.sec))];
  const sec = DESK.sec && secs.includes(DESK.sec) ? DESK.sec : secs[0];
  return `<button class="mini-btn" data-act="phone-back">◀ ALL HANDSETS</button>
    <div class="phone-shell"><div class="phone-top">${esc(p.name.toUpperCase())}<span>${esc(p.model)}</span></div>
      <div class="seg phone-secs">${secs.map(s=>`<button class="${s===sec?'on':''}" data-act="sec" data-sec="${s}">${s}</button>`).join('')}</div>
      ${p.items.filter(c=>c.sec===sec).map(c=>`<div class="ph-item ${d.flagged[c.id]?'flagged':''}">
        <div class="ph-from">${esc(c.from)}</div><div class="ph-text">${esc(c.text)}</div>
        <button class="mini-btn ${d.flagged[c.id]?'on':''}" data-act="flag" data-id="${c.id}">${d.flagged[c.id]?'⚑ FLAGGED':'⚐ FLAG'}</button>
      </div>`).join('')}
    </div>`;
}

/* ---------------- MONEY ---------------- */
function renderMoney(){
  const m = I().money;
  if(!m.open) return `<div class="set-note">No money to follow yet. A bank alert, a ledger or a payroll line can open the trail.</div>`;
  const ids = Object.keys(MONEY_NODES).filter(k=>m.unlocked[k]);
  const tot = moneyTotal(), grand = moneyGrand();
  let h = `<div class="money-head"><div><span class="lbl">TRACED</span><b>${naira(tot)}</b></div><div><span class="lbl">NFIU REQUESTS</span><b>${m.req}</b></div></div>
    <div class="dk-intro">Each trace is one request to the Nigerian Financial Intelligence Unit. Some lines are school fees. Some are a ₦4bn network.</div>
    <div class="eb-meter money-meter"><div class="eb-fill" style="width:${Math.min(100, tot/grand*100)}%"></div></div>`;
  ids.forEach(k=>{
    const n = MONEY_NODES[k], tr = !!m.traced[k];
    const from = Object.keys(MONEY_NODES).filter(x=>MONEY_NODES[x].next.includes(k) && m.traced[x]).map(x=>MONEY_NODES[x].name);
    h += `<div class="mn ${tr?'traced':''} ${n.dead&&tr?'dead':''} ${n.key&&tr?'key':''}">
      <div class="dk-row1"><span class="dk-name">${esc(n.name)}</span><span class="mn-kind">${n.kind}</span></div>
      ${from.length?`<div class="dk-meta">← from ${esc(from.join(', '))}</div>`:''}
      ${tr?`<div class="mn-desc">${esc(n.desc)}</div><div class="mn-amt">${n.amt?naira(n.amt):'—'}${n.dead?' · DEAD END':''}</div>`
          :`<button class="mini-btn" data-act="trace" data-id="${k}">TRACE · 1 REQUEST</button>`}
    </div>`;
  });
  if(tot >= grand * 0.99 && typeof unlock==='function') unlock('four_billion');
  return h;
}

/* ---------------- REGISTRY ---------------- */
function regCard(k){
  const e = REGISTRY[k], r = I().reg;
  return `<div class="reg-card">
    <div class="reg-crest">CORPORATE AFFAIRS COMMISSION · PUBLIC SEARCH</div>
    <div class="dk-name">${esc(e.name)}</div>
    <table class="reg-tbl">
      <tr><td>Number</td><td>${esc(e.no)}</td></tr><tr><td>Type</td><td>${esc(e.type)}</td></tr>
      <tr><td>Registered</td><td>${esc(e.inc)}</td></tr><tr><td>${e.person?'Notes':'Officers'}</td><td>${e.people.map(esc).join('<br>')}</td></tr>
      <tr><td>Secretary</td><td>${esc(e.sec)}</td></tr><tr><td>Address</td><td>${esc(e.addr)}</td></tr><tr><td>Status</td><td>${esc(e.status)}</td></tr>
    </table>
    <div class="reg-acts">
      ${e.addr && e.addr !== '—' && !e.person ? `<button class="mini-btn" data-act="reg-addr" data-addr="${esc(e.addr)}">FIND EVERYONE AT THIS ADDRESS</button>` : ''}
      ${!e.person ? (r.ctc[k] ? '<span class="ok">✔ Certified true copy requested</span>' : `<button class="mini-btn" data-act="reg-ctc" data-key="${k}">REQUEST CERTIFIED TRUE COPY</button>`) : ''}
    </div></div>`;
}
function renderRegistry(){
  const r = I().reg;
  if(DESK.reg) return `<button class="mini-btn" data-act="reg-back">◀ SEARCH</button>` + regCard(DESK.reg);
  const known = Object.keys(r.found);
  let h = `<div class="dk-intro">Search the register by company, number or name. Directors change. Addresses rarely do.</div>
    <div class="reg-search"><input id="reg-q" type="text" placeholder="e.g. Bluewater" value="${esc(DESK.regQ||'')}" autocomplete="off"><button class="mini-btn" data-act="reg-search">SEARCH</button></div>`;
  if(DESK.regAddr && DESK.regAddrHits){ h += `<div class="set-group">AT ${esc(DESK.regAddr.toUpperCase())} · ${DESK.regAddrHits.length}</div>` + DESK.regAddrHits.map(k=>`<button class="dk-card" data-act="reg-open" data-key="${k}"><div class="dk-name">${esc(REGISTRY[k].name)}</div><div class="dk-meta">${esc(REGISTRY[k].no)} · ${esc(REGISTRY[k].people[0]||'')}</div></button>`).join(''); }
  else if(DESK.regHits && DESK.regHits.length){ h += `<div class="set-group">RESULTS</div>` + DESK.regHits.map(k=>`<button class="dk-card" data-act="reg-open" data-key="${k}"><div class="dk-name">${esc(REGISTRY[k].name)}</div><div class="dk-meta">${esc(REGISTRY[k].no)} · ${esc(REGISTRY[k].addr)}</div></button>`).join(''); }
  if(known.length) h += `<div class="set-group">ON FILE</div>` + known.map(k=>`<button class="chip" data-act="reg-open" data-key="${k}">${esc(REGISTRY[k].name)}</button>`).join('');
  return h;
}

/* ---------------- STATEMENTS ---------------- */
function renderStatements(){
  const d = I();
  const avail = STATEMENTS.filter(stAvailable);
  if(!DESK.st || !avail.some(s=>s.id===DESK.st)){
    if(!avail.length) return `<div class="set-note">No statements on file. Sit witnesses down — in the field or through the weekly briefing — and their words land here.</div>`;
    return `<div class="dk-intro">Witnesses lie, exaggerate, misremember and repeat rumours. None of them is labelled. Put each claim next to your exhibits and decide.</div>` +
      avail.map(s=>{ const done = s.claims.filter(c=>(d.st[s.id]||{})[c.id]).length;
        const src = (typeof PORTRAIT_ART!=='undefined' && PORTRAIT_ART[s.art]) || '';
        return `<button class="dk-card st-card" data-act="st" data-id="${s.id}">${src?`<img src="${src}" alt="">`:''}<div><div class="dk-name">${esc(s.who)}</div><div class="dk-meta">${esc(s.role)} · ${done}/${s.claims.length} weighed</div></div></button>`; }).join('');
  }
  const s = STATEMENTS.find(x=>x.id===DESK.st), mine = d.st[s.id] || {};
  return `<button class="mini-btn" data-act="st-back">◀ ALL STATEMENTS</button>
    <div class="dk-name st-who">${esc(s.who)} <span class="dim">· ${esc(s.role)}</span></div>
    ${s.claims.map(c=>{
      const fb = DESK.stMsg && DESK.stMsg.c === c.id ? DESK.stMsg : null;
      return `<div class="claim"><div class="claim-text">${esc(c.text)}</div>
        <div class="seg">${VERDICTS.map(v=>`<button class="${mine[c.id]===v.id?'on':''}" data-act="verdict" data-st="${s.id}" data-c="${c.id}" data-v="${v.id}">${v.lbl}</button>`).join('')}</div>
        ${fb?`<div class="claim-fb ${fb.ok?'ok':'bad'}">${fb.ok?'✔':'✘'} ${esc(fb.msg)}</div>`:''}
      </div>`; }).join('')}`;
}

/* ---------------- WARRANTS ---------------- */
function basisList(w){
  const have = w.basis.filter(intelHas), miss = w.basis.length - have.length;
  return `<ul class="basis">${have.map(b=>`<li class="have">✔ ${esc(intelLabel(b))}</li>`).join('')}${miss?`<li>· ${miss} more thing${miss>1?'s':''} a magistrate would want to see</li>`:''}</ul>`;
}
function renderWarrants(){
  const d = I();
  return `<div class="dk-intro">You decide when you have enough. Ask too early and the refusal leaks. Wait too long and you go in without one.</div>` +
    WARRANTS.map(w=>{
      const rec = d.warrants[w.id], sc = warrantScore(w), m = MISSIONS.find(x=>x.id===w.before)||{};
      const state = warrantGranted(w.id) ? '<span class="ok">GRANTED</span>' : rec && rec.status==='missed' ? '<span class="bad">NOT OBTAINED — went in without it</span>' : rec && rec.status==='refused' ? '<span class="bad">REFUSED — you can apply again</span>' : '<span class="dim">NOT YET APPLIED</span>';
      const open = warrantOpen(w);
      const pct = Math.min(100, sc / w.need * 100);
      return `<div class="dk-item">
        <div class="dk-row1"><span class="dk-name">${esc(w.name)}</span></div>
        <div class="dk-meta">${esc(w.court)} · needed before Case ${m.num} · ${state}</div>
        <div class="dk-integ"><span>BASIS</span><div class="rb"><i style="width:${pct}%;background:${sc>=w.need?'#5dd07a':'#d8a64a'}"></i></div><b>${sc}/${w.need}</b></div>
        ${basisList(w)}
        ${open && !warrantGranted(w.id) ? (w.routed
          ? `<div class="w-acts"><button class="mini-btn" data-act="warrant" data-id="${w.id}" data-route="commander">APPLY · VIA THE COMMANDER'S OFFICE</button><button class="mini-btn" data-act="warrant" data-id="${w.id}" data-route="zonal">APPLY · STRAIGHT TO ZONAL COMMAND (−6 FAVOUR)</button></div><div class="set-note">Through the commander is standard procedure. Zonal is faster — and she won't see it.</div>`
          : `<div class="w-acts"><button class="mini-btn" data-act="warrant" data-id="${w.id}" data-route="standard">APPLY NOW</button></div>`) : ''}
        <div class="set-note">${esc(sc >= w.need ? 'Enough to satisfy a magistrate.' : 'If refused: ' + w.leak)} ${esc(rec && rec.status==='missed' ? w.without : '')}</div>
      </div>`;
    }).join('');
}

/* desk shortcuts: HUD evidence button, J key, mission select, pause menu */
function deskInit(){
  ensureDesk();
  document.addEventListener('keydown', e=>{
    if(e.code === 'KeyJ' && ENGINE.movementEnabled && !isOverlayOpen()){ e.preventDefault(); openDesk(); }
  });
  const add = (parent, id, label, cls, fn, before)=>{
    if(!parent || document.getElementById(id)) return;
    const b = document.createElement('button'); b.className = cls; b.id = id; b.textContent = label;
    b.addEventListener('click', fn);
    before ? parent.insertBefore(b, before) : parent.appendChild(b);
  };
  const ms = document.getElementById('screen-missions');
  add(ms, 'btn-missions-desk', 'CASE DESK', 'btn', ()=>openDesk(), document.getElementById('btn-missions-back'));
  const pa = document.querySelector('#screen-pause .title-actions');
  add(pa, 'btn-pause-desk', 'CASE DESK', 'btn', ()=>openDesk(), document.getElementById('btn-save'));
}
