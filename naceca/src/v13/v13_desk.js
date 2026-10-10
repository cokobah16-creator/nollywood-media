/* =========================================================================
   NACECA · v13 desk — the Case Desk: everything you know, in one place
   Tabs: Locker · Phones · Money · Registry · Statements · Warrants · the
   operations table · Review (after the season). Ways in: J (desktop), the
   HUD's EVIDENCE button, the pause menu, the case files screen, the
   operations table's CASE DESK button and the briefing. BACK, Esc and J
   close it to wherever it was opened from.

   An ink frame holding manila documents (beta paper look, icon() line
   icons, palette only). Senior Agent (the default) shows no relevance
   markers, no 'why' lines, no badge counts, no key-node highlight, no
   completion meter and no right/wrong on statements; Recruit may.

   Reads the model through the v13 contract (v13_intel.js), every call
   guarded so the desk also runs on an older model:
     V12.warrantState(id) · intelAdmissibility(id) · intelVerdict(st, c, v)
     intelVerdictOf(st, c) · intelMoneyOpen() · intelSenior()
     v13OpenOps(group, back) · v13Modal(id, {onEsc, resume}) · v13ModalEnd(id)
   Exposes: openDesk(tab, {ret, back}) · closeDesk() · renderDesk() ·
   deskDo(act, data) · deskInit() · DESK (UI state, not saved).
   ========================================================================= */
(function(){
'use strict';

const DESK = window.DESK = Object.assign(window.DESK || {}, {
  tab:'locker', open:false, susp:false, ret:null, back:null, prev:null, opsCap:null,
  phone:null, sec:null, reg:null, st:null, regQ:'', regHits:null, regMsg:'', regAddr:null, regAddrHits:null,
  arm:null, stMsg:null, note:null,
});

/* ---------- small helpers ---------- */
const ico = (n, c) => (typeof icon === 'function' ? icon(n, c) : '');
const h = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
// the briefing and the court print through the desk's escaper; keep it global unless someone else already has one
if(typeof esc === 'undefined') window.esc = h;
// canon in anything the desk prints from data: the squad is always spelled out
const canon = s => String(s == null ? '' : s).replace(/\bwith AKS\b/g, 'with the Anti-Kidnapping Squad').replace(/\bAKS\b/g, 'the Anti-Kidnapping Squad');
const t = s => h(canon(s));
const V = () => window.V12 || {};
const shown = id => { const el = document.getElementById(id); return !!(el && el.classList.contains('show')); };
const safe = (f, d) => { try{ return f(); }catch(e){ console.warn('[v13 desk]', e); return d; } };
const senior = () => {
  if(typeof intelSenior === 'function'){ const r = safe(() => intelSenior(), null); if(r !== null) return !!r; }
  return !(typeof isRecruit === 'function' && isRecruit());
};
const midxOf = id => (typeof midx === 'function' ? midx(id) : 0);
const sfx = n => { try{ if(typeof window[n] === 'function') window[n](); }catch(e){} };
const missionName = id => { const m = (typeof MISSIONS !== 'undefined' ? MISSIONS : []).find(x => x.id === id); return m || {}; };

/* ---------- music: remember what was playing so the desk can put it back ---------- */
const MUS = { last:null };
if(V().wrap && typeof window.musicForScene === 'function' && !window.musicForScene._v13desk){
  V().wrap('musicForScene', orig => { const f = function(kind){ MUS.last = kind; return orig.apply(this, arguments); }; f._v13desk = true; return f; });
}
const missionMusic = () => { const m = S.game.currentMission; return m === 'm3n' ? 'investigation' : m; };
const playKind = k => { if(k && MUS.last !== k && typeof musicForScene === 'function') safe(() => musicForScene(k)); };

/* ---------- toasts become a status line while the desk is open (a toast would cover the tabs) ---------- */
if(typeof window.toast === 'function' && !window.toast._v13desk){
  const orig = window.toast;
  const f = function(big, small, ms){
    if(DESK.open && !DESK.susp && shown('screen-desk')){
      DESK.note = { big:String(big == null ? '' : big), small:String(small == null ? '' : small), until:Date.now() + Math.max(2200, ms || 2200) };
      drawNote();
      clearTimeout(f._t); f._t = setTimeout(drawNote, Math.max(2200, ms || 2200) + 50);
      return;
    }
    return orig.apply(this, arguments);
  };
  f._v13desk = true; f._v12orig = orig; window.toast = f;
}
function drawNote(){
  const el = document.getElementById('desk-note'); if(!el) return;
  const n = DESK.note && DESK.note.until > Date.now() ? DESK.note : null;
  el.innerHTML = n ? `<b>${n.big}</b>${n.small ? `<span>${n.small}</span>` : ''}` : '';
  el.classList.toggle('on', !!n);
}

/* ---------- the overlay ---------- */
function ensureDesk(){
  if(document.getElementById('screen-desk')) return;
  const ov = document.createElement('div'); ov.className = 'overlay v13-desk'; ov.id = 'screen-desk';
  ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-labelledby', 'desk-title');
  ov.innerHTML = `<div class="overlay-bg"></div>
    <div class="settings-frame desk-frame">
      <div class="settings-head desk-head"><h2 id="desk-title">CASE DESK</h2>
        <button class="btn ghost" id="btn-desk-close">${ico('back')}<span>BACK</span><span class="k dk-key" title="J or Esc closes the desk">J</span></button></div>
      <div class="seg desk-tabs" id="desk-tabs" role="tablist" aria-label="Case Desk sections"></div>
      <div class="dk-note" id="desk-note" role="status" aria-live="polite"></div>
      <div class="settings-body desk-body" id="desk-body" role="tabpanel"></div>
    </div>`;
  (document.getElementById('game-root') || document.body).appendChild(ov);
  // something else took the screen (a cutscene, a title card, the game's own flow): the desk is no longer open.
  // The pause menu over the desk is the exception: its Resume (the model's v13Modal resume) brings the desk back.
  new MutationObserver(() => {
    if(!DESK.open || DESK.susp || ov.classList.contains('show')) return;
    if(shown('screen-pause')){ if(typeof ENGINE !== 'undefined' && DESK.prev) ENGINE.movementEnabled = DESK.prev.move; return; }
    DESK.open = false; DESK.back = null; DESK.arm = null; DESK.note = null; modalOff();
  }).observe(ov, { attributes:true, attributeFilter:['class'] });
  document.getElementById('btn-desk-close').addEventListener('click', closeDesk);
  document.getElementById('desk-tabs').addEventListener('click', e => {
    const b = e.target.closest('button[data-tab]'); if(!b) return;
    sfx('sfxClick');
    if(b.dataset.tab === 'board'){ deskOpsTable(); return; }
    DESK.tab = b.dataset.tab; DESK.arm = null; DESK.stMsg = null; renderDesk();
  });
  const body = document.getElementById('desk-body');
  body.addEventListener('click', e => { const el = e.target.closest('[data-act]'); if(!el || el.disabled) return; deskDo(el.dataset.act, el.dataset); });
  body.addEventListener('input', e => { if(e.target.id === 'reg-q') DESK.regQ = e.target.value; });
  body.addEventListener('keydown', e => {
    if(e.target.id === 'reg-q' && e.key === 'Enter'){ e.preventDefault(); e.stopPropagation(); deskDo('reg-search'); return; }
    // typing in the search box must not reach the game's keys; Escape still closes the desk
    if(e.target.matches && e.target.matches('input, textarea, select') && e.key !== 'Escape') e.stopPropagation();
  });
}
const firstShown = () => { const o = [...document.querySelectorAll('.overlay.show')].find(x => x.id && x.id !== 'screen-desk'); return o ? o.id : null; };
const hudShown = () => { const el = document.getElementById('hud'); return !!el && el.style.display !== 'none' && getComputedStyle(el).display !== 'none'; };
const modalOn = () => { if(typeof v13Modal === 'function') safe(() => v13Modal('screen-desk', { onEsc:closeDesk, resume:reshowDesk })); };
const modalOff = () => { if(typeof v13ModalEnd === 'function') safe(() => v13ModalEnd('screen-desk')); };
const freeze = () => { if(typeof ENGINE !== 'undefined') ENGINE.movementEnabled = false; if(typeof showHUD === 'function') showHUD(false); };

function openDesk(tab, opts){
  opts = opts || {};
  ensureDesk();
  if(typeof tab === 'string' && tab && tab !== 'board') DESK.tab = tab;
  // the desk is waiting under an operations table it opened: closing that table brings it back
  if(DESK.open && DESK.susp){
    if(shown('screen-ops') && typeof V().closeOps === 'function'){ V().closeOps(); if(DESK.open && !DESK.susp){ renderDesk(); return; } }
    DESK.susp = false;
  }
  if(DESK.open && shown('screen-desk')){ DESK.arm = null; renderDesk(); return; }
  DESK.ret = Object.prototype.hasOwnProperty.call(opts, 'ret') ? opts.ret : firstShown();
  DESK.back = typeof opts.back === 'function' ? opts.back : null;
  DESK.opsCap = DESK.ret === 'screen-ops' ? (V()._onOpsClose || null) : null;
  DESK.prev = { move:typeof ENGINE !== 'undefined' ? ENGINE.movementEnabled : true, hud:hudShown(), music:MUS.last };
  DESK.open = true; DESK.susp = false; DESK.arm = null; DESK.stMsg = null; DESK.note = null;
  freeze();
  showOverlay('screen-desk');
  modalOn();
  renderDesk();
  if(typeof V().log === 'function') safe(() => V().log('desk_open', { tab:DESK.tab, from:DESK.ret || 'game', m:S.game.currentMission || null }));
}
// back from the operations table the desk opened: same tab, same way out
function reshowDesk(){
  if(!DESK.open){ return; }
  DESK.susp = false;
  freeze();
  showOverlay('screen-desk');
  modalOn();
  playKind(DESK.prev && DESK.prev.music);
  renderDesk();
}
function closeDesk(){
  const ov = document.getElementById('screen-desk');
  if(!DESK.open || (!DESK.susp && !(ov && ov.classList.contains('show')))){   // not on screen: nothing to return from
    DESK.open = false; modalOff(); if(ov) ov.classList.remove('show'); return;
  }
  const ret = DESK.ret, back = DESK.back, prev = DESK.prev || { move:true, hud:false, music:null }, cap = DESK.opsCap;
  DESK.open = false; DESK.susp = false; DESK.back = null; DESK.arm = null; DESK.stMsg = null; DESK.note = null; DESK.opsCap = null;
  modalOff();
  if(ov) ov.classList.remove('show');
  if(typeof ENGINE !== 'undefined') ENGINE.movementEnabled = prev.move;
  if(back){ safe(back); }
  else if(ret === 'screen-ops' && typeof V().openOps === 'function'){
    // back to the table it was opened from, keeping whatever that table was going to return to
    if(cap && V()._onOpsClose !== cap) opsOpen(undefined, () => cap());
    else V().openOps();
  }
  else if(ret && document.getElementById(ret)){
    showOverlay(ret);
    if(ret === 'screen-briefing' && typeof renderBriefing === 'function') safe(renderBriefing);
  }
  else showOverlay(null);
  if(!document.querySelector('.overlay.show')){
    if(S.game.currentMission && prev.hud && prev.move !== false && typeof showHUD === 'function') showHUD(true);
    if(S.game.currentMission && prev.move !== false) playKind(missionMusic());
    else playKind(prev.music);
  } else if(ret !== 'screen-ops') playKind(prev.music);
}

/* ---------- the operations table from the desk, and back ---------- */
const OPSF = { stack:[] };   // used only when the model has no v13OpenOps
function opsPop(){ const f = OPSF.stack.pop(); if(OPSF.stack.length) V()._onOpsClose = opsPop; if(typeof f === 'function') safe(f); }
function opsOpen(group, back){
  if(typeof v13OpenOps === 'function'){ v13OpenOps(group, back); return; }
  OPSF.stack.push(back); V()._onOpsClose = opsPop;
  V().openOps(group);
}
function deskOpsTable(){
  if(typeof V().openOps !== 'function') return;
  if(!DESK.open){ opsOpen(undefined, () => openDesk()); return; }
  DESK.susp = true; DESK.arm = null;
  modalOff();
  const ov = document.getElementById('screen-desk'); if(ov) ov.classList.remove('show');
  opsOpen(undefined, reshowDesk);
}

/* ---------- keys: J toggles the desk (desktop), Esc closes it ---------- */
function onKey(e){
  if(e.code !== 'KeyJ' || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
  if(e.target && e.target.matches && e.target.matches('input, textarea, select')) return;
  if(DESK.open && shown('screen-desk')){ e.preventDefault(); closeDesk(); return; }
  if(typeof ENGINE !== 'undefined' && ENGINE.movementEnabled && !(typeof isOverlayOpen === 'function' && isOverlayOpen())){ e.preventDefault(); openDesk(); }
}
// without the model's Esc registry: the desk and a table it opened handle Esc themselves
function onEscFallback(e){
  if(e.code !== 'Escape' || typeof v13Modal === 'function') return;
  if(DESK.open && shown('screen-desk')){ e.preventDefault(); e.stopImmediatePropagation(); closeDesk(); return; }
  if(DESK.open && DESK.susp && shown('screen-ops') && typeof V().closeOps === 'function'){ e.preventDefault(); e.stopImmediatePropagation(); V().closeOps(); }
}

/* ---------- tabs ---------- */
function deskTabs(){
  const tabs = [['locker','LOCKER'], ['phones','PHONES'], ['money','MONEY'], ['registry','REGISTRY'], ['statements','STATEMENTS'], ['warrants','WARRANTS'], ['board','OPS TABLE']];
  if(S.game.seasonOneComplete) tabs.push(['review','REVIEW']);
  return tabs;
}
// Recruit only: counts of things still to do. Senior shows none (a count tells you what is left).
function deskBadges(){
  if(senior()) return {};
  const d = I(), b = {};
  b.locker = Object.values(d.items || {}).filter(it => INTEL_ITEMS[it.id] && INTEL_ITEMS[it.id].e && !it.cert && safe(() => certWindowOpen(it.id), false)).length;
  b.phones = PHONES.filter(p => phoneOpen(p) && !p.items.some(c => d.flagged[c.id])).length;
  if(moneyGate() && d.money && d.money.open) b.money = Object.keys(d.money.unlocked || {}).filter(k => MONEY_NODES[k] && !d.money.traced[k]).length;
  b.statements = STATEMENTS.filter(s => stOpen(s) && s.claims.some(c => !verdictOf(s.id, c.id))).length;
  return b;
}
function renderDesk(){
  ensureDesk();
  const b = deskBadges(), tabs = deskTabs();
  if(!tabs.some(x => x[0] === DESK.tab) || DESK.tab === 'board') DESK.tab = 'locker';
  const strip = document.getElementById('desk-tabs');
  const keep = strip.scrollLeft;
  strip.innerHTML = tabs.map(([id, l]) => {
    const on = DESK.tab === id;
    return `<button type="button" role="tab" data-tab="${id}" class="${on ? 'on' : ''}${id === 'board' ? ' dk-tab-ops' : ''}" aria-selected="${on}">${l}${id === 'board' ? ico('next') : ''}${b[id] ? `<b class="dk-badge" aria-label="${b[id]} to do">${b[id]}</b>` : ''}</button>`;
  }).join('');
  strip.scrollLeft = keep;
  const act = strip.querySelector('button.on');
  if(act){ const l = act.offsetLeft, r = l + act.offsetWidth; if(l < strip.scrollLeft) strip.scrollLeft = l - 8; else if(r > strip.scrollLeft + strip.clientWidth) strip.scrollLeft = r - strip.clientWidth + 8; }
  const R = { locker:renderLocker, phones:renderPhones, money:renderMoney, registry:renderRegistry, statements:renderStatements, warrants:renderWarrants,
    review:() => (typeof renderReviewHTML === 'function' ? renderReviewHTML(true) : '<p class="dk-intro">The case review opens when the season is closed.</p>') }[DESK.tab] || renderLocker;
  const body = document.getElementById('desk-body');
  body.innerHTML = safe(R, '<p class="dk-intro">This section could not be drawn.</p>');
  body.setAttribute('data-tab', DESK.tab);
  drawNote();
}

/* ---------- actions ---------- */
function deskDo(act, ds){
  ds = ds || {};
  const d = I();
  if(act === 'cert'){ if(safe(() => certify(ds.id), false)) sfx('sfxComplete'); }
  if(act === 'phone'){ DESK.phone = ds.id; DESK.sec = null; }
  if(act === 'phone-back'){ DESK.phone = null; }
  if(act === 'sec'){ DESK.sec = ds.sec; }
  if(act === 'flag') flagOne(ds.id, !d.flagged[ds.id]);
  if(act === 'trace'){ if(safe(() => moneyTrace(ds.id), false)) sfx('sfxComplete'); }
  if(act === 'reg-search'){
    const q = ((document.getElementById('reg-q') || {}).value || DESK.regQ || '').trim(); DESK.regQ = q;
    DESK.regHits = q.length < 3 ? [] : safe(() => regSearch(q), []); DESK.regAddr = null; DESK.regAddrHits = null;
    DESK.regMsg = q.length < 3 ? 'Type at least three letters.' : (DESK.regHits.length ? '' : `Nothing on the register matches "${q}".`);
  }
  if(act === 'reg-open'){ DESK.reg = ds.key; safe(() => regFind([ds.key])); }
  if(act === 'reg-back'){ DESK.reg = null; }
  if(act === 'reg-addr'){ DESK.regAddrHits = safe(() => regAtAddress(ds.addr), []); DESK.regAddr = ds.addr; DESK.reg = null; DESK.regMsg = ''; }
  if(act === 'reg-ctc'){ if(d.reg && d.reg.ctc) d.reg.ctc[ds.key] = true; sfx('sfxClick'); }
  if(act === 'st'){ DESK.st = ds.id; DESK.arm = null; DESK.stMsg = null; }
  if(act === 'st-back'){ DESK.st = null; DESK.arm = null; DESK.stMsg = null; }
  if(act === 'verdict') verdictTap(ds.st, ds.c, ds.v);
  if(act === 'goto'){ DESK.tab = ds.tab; }
  if(act === 'board'){ deskOpsTable(); return; }
  renderDesk();
}

/* ======================= LOCKER ======================= */
function admissibility(id){
  if(typeof intelAdmissibility === 'function'){
    const a = safe(() => intelAdmissibility(id), null);
    if(a && typeof a.score === 'number') return { score:a.score, flaws:(a.flaws || []).map(f => ({ k:f.k, label:f.label || f.txt || '', pts:f.pts != null ? f.pts : (f.w || 0) })) };
  }
  const fl = typeof intelItemFlaws === 'function' ? safe(() => intelItemFlaws(id), []) : [];
  const score = typeof intelIntegrity === 'function' ? safe(() => intelIntegrity(id), 100) : Math.max(0, 100 - fl.reduce((a, f) => a + (f.w || 0), 0));
  return { score, flaws:fl.map(f => ({ k:f.k, label:f.txt || '', pts:f.w || 0 })) };
}
const tierTag = tr => `<span class="v13-tier t-${h(tr)}">${h((typeof TIER_LABEL !== 'undefined' && TIER_LABEL[tr]) || tr || '')}</span>`;
function renderLocker(){
  const d = I();
  const items = Object.values(d.items || {}).filter(it => it && INTEL_ITEMS[it.id]).sort((a, b) => midxOf(a.m) - midxOf(b.m));
  if(!items.length) return `<p class="dk-intro">The exhibit room is empty. Log evidence in the field and it lands here with its custody trail.</p>`;
  const pending = items.filter(it => INTEL_ITEMS[it.id].e && !it.cert && safe(() => certWindowOpen(it.id), false));
  let o = `<p class="dk-intro">Every exhibit, where it came from, who has touched it, and what a defence lawyer will say about it. <b>ADMISSIBILITY</b> is how much of it survives the defence: 100, less each flaw.</p>`;
  if(pending.length) o += `<p class="dk-intro v13-warn">${pending.length} electronic item${pending.length > 1 ? 's' : ''} still need${pending.length > 1 ? '' : 's'} an s.84 certificate before the next operation.</p>`;
  const facts = Object.keys(d.known || {});
  if(facts.length){
    // before the reveal her name is never listed: she is her unit, like every other office on the file
    const who = w => (w === 'Cdr. Adaeze' && !(S.game.moralChoices || {}).finale) ? 'Lagos HQ' : w;
    o += `<h3 class="dk-group">WHO KNOWS WHAT</h3><div class="dk-known">` + facts.map(f => `<div><b>${t((typeof FACTS !== 'undefined' && FACTS[f]) || f)}</b><span>${t((d.known[f] || []).map(who).join(', '))}</span></div>`).join('') + `</div>`;
  }
  let lastM = null;
  items.forEach(it => {
    const meta = INTEL_ITEMS[it.id], m = missionName(it.m);
    if(it.m !== lastM){ o += `<h3 class="dk-group">CASE ${h(m.num || '')}${m.name ? ' · ' + h(String(m.name).toUpperCase()) : ''}</h3>`; lastM = it.m; }
    const a = admissibility(it.id), ev = (S.game.evidence || []).find(e => e.id === it.id);
    const custody = Array.isArray(it.custody) ? it.custody : [];
    const exNo = (custody.map(c => (String(c.t || '').match(/NAC\/EX\/[\w/]+/) || [])[0]).find(Boolean)) || '';
    let cert = '';
    if(meta.e){
      if(it.cert) cert = `<span class="v13-mark-ok">${ico('check')}s.84 certificate on file</span>`;
      else if(safe(() => certWindowOpen(it.id), false)){ const n = safe(() => certSlotsLeft(it.m), 0); cert = `<button type="button" class="v13-btn" data-act="cert" data-id="${h(it.id)}">${ico('stamp')}SIGN s.84 CERTIFICATE · ${n} SLOT${n === 1 ? '' : 'S'} LEFT</button>`; }
      else cert = `<span class="v13-mark-bad">${ico('cross')}Never certified. The extraction wasn't hashed.</span>`;
    }
    o += `<article class="v13-sheet dk-ex" data-id="${h(it.id)}">
      <div class="v13-sheet-h dk-ex-h"><span class="v13-mono">${h(exNo || 'EXHIBIT')}</span><span>${h(meta.kind || '')}</span></div>
      <div class="dk-row1"><span class="dk-name">${t(ev ? ev.name : (typeof intelLabel === 'function' ? intelLabel(it.id) : it.id))}</span>${tierTag(meta.tier)}</div>
      <div class="dk-src">${t(meta.src || '')}</div>
      <div class="dk-adm"><span class="dk-lbl">ADMISSIBILITY</span><div class="v13-meter" aria-hidden="true"><i style="width:${Math.max(0, Math.min(100, a.score))}%"></i></div><b class="v13-mono">${a.score}<small>/100</small></b></div>
      ${a.flaws.length ? `<ul class="dk-flaws">${a.flaws.map(f => `<li>${ico('warning')}<span>${t(f.label)}</span><b class="v13-mono">−${h(f.pts)}</b></li>`).join('')}</ul>` : ''}
      ${cert ? `<div class="dk-cert">${cert}</div>` : ''}
      <details class="dk-chain"><summary>${ico('down')}<span>Chain of custody</span><b class="v13-mono">${custody.length}</b></summary><ol>${custody.map(c => `<li><span>${t(c.t)}</span>${c.at ? `<i>${t(c.at)}</i>` : ''}</li>`).join('')}</ol></details>
    </article>`;
  });
  return o;
}

/* ======================= PHONES ======================= */
const phoneOpen = p => (typeof phoneUnlocked === 'function' ? !!safe(() => phoneUnlocked(p), false) : !!safe(() => intelHas(p.needs), false));
// a handset you know about but haven't been able to read yet (nothing is listed for cases you haven't reached)
const LOCKED_TXT = {
  musa:"Musa's phone stays with his property until you sit down with him properly.",
  burner:'Bagged with the SIM packs. Nobody has read it yet.',
};
function flagOne(cid, on){
  const d = I();
  // without the v13 model's Senior rules, Senior flags quietly (no money unlock, no toast); the model does this itself when present
  if(typeof intelSenior !== 'function' && senior()){ d.flagged[cid] = !!on; }
  else if(typeof flagClue === 'function') safe(() => flagClue(cid, on));
  else d.flagged[cid] = !!on;
  sfx('sfxClick');
}
function renderPhones(){
  const d = I();
  const avail = PHONES.filter(phoneOpen);
  if(!DESK.phone || !avail.some(p => p.id === DESK.phone)){
    const locked = PHONES.filter(p => !phoneOpen(p) && LOCKED_TXT[p.id] && safe(() => intelHas(p.needs), false));
    if(!avail.length && !locked.length) return `<p class="dk-intro">No handsets to read yet. Recover a phone in the field, then read it here.</p>`;
    return `<p class="dk-intro">A phone doesn't say "NEW CLUE". Read it like a life and flag what matters. What you flag goes on the file: it can open a money trail or test a witness.</p>` +
      avail.map(p => { const n = p.items.filter(c => d.flagged[c.id]).length;
        return `<button type="button" class="dk-card dk-phone-card" data-act="phone" data-id="${h(p.id)}"><span class="dk-ico">${ico('phone')}</span><span class="dk-card-t"><span class="dk-name">${t(p.name)}</span><span class="dk-meta v13-mono">${t(p.model)} · ${p.items.length} items · ${n} flagged</span></span>${ico('next')}</button>`; }).join('') +
      locked.map(p => `<div class="dk-card dk-locked"><span class="dk-ico">${ico('lock')}</span><span class="dk-card-t"><span class="dk-name">${t(p.name)}</span><span class="dk-meta">${t(LOCKED_TXT[p.id])}</span></span></div>`).join('');
  }
  const p = PHONES.find(x => x.id === DESK.phone);
  const secs = [...new Set(p.items.map(c => c.sec))];
  const sec = DESK.sec && secs.includes(DESK.sec) ? DESK.sec : secs[0];
  const coach = !senior();
  return `<button type="button" class="v13-btn dk-back" data-act="phone-back">${ico('back')}ALL HANDSETS</button>
    <div class="dk-device">
      <div class="dk-device-top"><span>${t(p.name.toUpperCase())}</span><span class="v13-mono">${t(p.model)}</span></div>
      <div class="seg dk-secs" role="tablist">${secs.map(s => `<button type="button" role="tab" aria-selected="${s === sec}" class="${s === sec ? 'on' : ''}" data-act="sec" data-sec="${h(s)}">${h(s)}</button>`).join('')}</div>
      ${p.items.filter(c => c.sec === sec).map(c => { const f = !!d.flagged[c.id];
        return `<div class="dk-ph ${f ? 'flagged' : ''}" data-id="${h(c.id)}">
          <div class="dk-ph-t"><div class="dk-ph-from">${t(c.from)}</div><div class="dk-ph-text">${t(c.text)}</div></div>
          <button type="button" class="v13-btn dk-flag ${f ? 'on' : ''}" data-act="flag" data-id="${h(c.id)}" aria-pressed="${f}">${ico('flag', f ? 'fill' : '')}${f ? 'FLAGGED' : 'FLAG'}</button>
          ${coach && f ? `<div class="dk-coach ${c.rel ? 'rel' : 'norel'}">${ico(c.rel ? 'check' : 'cross')}<span><b>UCHE:</b> ${c.rel ? t(c.why || 'Worth following, sir.') : "That one looks like somebody's life, sir. I wouldn't spend time on it."}</span></div>` : ''}
        </div>`; }).join('')}
    </div>`;
}

/* ======================= MONEY ======================= */
function moneyGate(){
  if(typeof intelMoneyOpen === 'function'){ const r = safe(() => intelMoneyOpen(), null); if(r !== null) return !!r; }
  const acc = typeof V().accused === 'function' ? safe(() => V().accused('lagos'), null) : null;
  return !!acc || (S.game.completedMissions || []).includes('m3');
}
const naira$ = v => (typeof naira === 'function' ? naira(v) : '₦' + Number(v || 0).toLocaleString('en-NG'));
function renderMoney(){
  if(!moneyGate()) return `<p class="dk-intro">The NFIU won't open a line on this case until your Lagos charge sheet is on the file.</p>`;
  const m = I().money || {};
  if(!m.open) return `<p class="dk-intro">No money to follow yet. A bank alert, a ledger or a payroll line can open the trail.</p>`;
  const ids = Object.keys(MONEY_NODES).filter(k => m.unlocked && m.unlocked[k]);
  const tot = safe(() => moneyTotal(), 0), grand = safe(() => moneyGrand(), 0), coach = !senior();
  let o = `<p class="dk-intro">Each trace is one request to the Nigerian Financial Intelligence Unit. Some lines are school fees. Some are a network.</p>
    <section class="v13-sheet dk-ledger">
      <div class="v13-sheet-h">NFIU · FINANCIAL INTELLIGENCE RETURNS</div>
      <dl class="dk-facts"><div><dt>REQUESTS IN HAND</dt><dd class="v13-mono">${m.req | 0}</dd></div><div><dt>TRACED SO FAR</dt><dd class="v13-mono">${naira$(tot)}</dd></div></dl>
      ${coach && grand > 0 ? `<div class="dk-adm dk-money-meter"><span class="dk-lbl">OF THE NETWORK</span><div class="v13-meter"><i style="width:${Math.min(100, tot / grand * 100)}%"></i></div><b class="v13-mono">${Math.round(Math.min(100, tot / grand * 100))}%</b></div>` : ''}
      ${!(m.req > 0) ? `<p class="dk-src">No requests left. More come with the next briefing.</p>` : ''}`;
  // a line the NFIU won't open yet (the model's per-node gate): said plainly, with no hint of what it holds
  const gateOpen = k => (typeof intelMoneyGate === 'function' ? !!safe(() => intelMoneyGate(k), true) : true);
  const gateNote = k => (MONEY_NODES[k].gate === 'ca' && safe(() => { const r = typeof V().accused === 'function' ? V().accused('route') : null; return !!r || (S.game.completedMissions || []).includes('m6'); }, false))
    ? 'The NFIU will take this line at the next briefing.' : "The NFIU won't open this line until your route charge sheet is on the file.";
  ids.forEach(k => {
    const n = MONEY_NODES[k], tr = !!(m.traced && m.traced[k]);
    const from = Object.keys(MONEY_NODES).filter(x => (MONEY_NODES[x].next || []).includes(k) && m.traced && m.traced[x]).map(x => MONEY_NODES[x].name);
    const key = coach && n.key, dead = coach && n.dead && tr;
    o += `<div class="dk-mn ${tr ? 'traced' : ''} ${key ? 'key' : ''} ${dead ? 'dead' : ''}" data-id="${h(k)}">
      <div class="dk-row1"><span class="dk-name">${t(n.name)}</span><span class="v13-tier">${t(n.kind)}</span>${key ? '<span class="v13-stamp dk-keytag">KEY</span>' : ''}</div>
      ${from.length ? `<div class="dk-src">${ico('link')}<span>via ${t(from.join(', '))}</span></div>` : ''}
      ${tr ? `<div class="dk-mn-desc">${t(n.desc)}</div><div class="dk-mn-amt v13-mono">${n.amt ? naira$(n.amt) : 'NO FIGURE'}${dead ? ' · DEAD END' : ''}</div>`
           : !gateOpen(k) ? `<div class="dk-src dk-mn-wait">${ico('clock')}<span>${t(gateNote(k))}</span></div>`
           : `<button type="button" class="v13-btn" data-act="trace" data-id="${h(k)}" ${m.req > 0 ? '' : 'disabled'}>${ico('search')}TRACE · 1 REQUEST</button>`}
    </div>`;
  });
  o += `</section>`;
  if(grand > 0 && tot >= grand * 0.99 && typeof unlock === 'function') safe(() => unlock('four_billion'));
  return o;
}

/* ======================= REGISTRY ======================= */
function regCard(k){
  const e = REGISTRY[k], r = I().reg || { ctc:{} };
  const row = (a, b) => `<tr><th scope="row">${a}</th><td>${b}</td></tr>`;
  return `<article class="v13-sheet dk-reg">
    <div class="v13-sheet-h">CORPORATE AFFAIRS COMMISSION · PUBLIC SEARCH</div>
    <div class="dk-name">${t(e.name)}</div>
    <table class="dk-reg-tbl">
      ${row('NUMBER', `<span class="v13-mono">${t(e.no)}</span>`)}${row('TYPE', t(e.type))}${row('REGISTERED', `<span class="v13-mono">${t(e.inc)}</span>`)}
      ${row(e.person ? 'NOTES' : 'OFFICERS', (e.people || []).map(t).join('<br>'))}${row('SECRETARY', t(e.sec))}${row('ADDRESS', t(e.addr))}${row('STATUS', t(e.status))}
    </table>
    <div class="dk-acts">
      ${e.addr && e.addr !== '—' && !e.person ? `<button type="button" class="v13-btn" data-act="reg-addr" data-addr="${h(e.addr)}">${ico('pin')}FIND EVERYONE AT THIS ADDRESS</button>` : ''}
      ${!e.person ? (r.ctc && r.ctc[k] ? `<span class="v13-mark-ok">${ico('check')}Certified true copy requested</span>` : `<button type="button" class="v13-btn" data-act="reg-ctc" data-key="${h(k)}">${ico('stamp')}REQUEST CERTIFIED TRUE COPY</button>`) : ''}
    </div></article>`;
}
const regSlip = (k, line) => `<button type="button" class="dk-card dk-slip" data-act="reg-open" data-key="${h(k)}"><span class="dk-ico">${ico('doc')}</span><span class="dk-card-t"><span class="dk-name">${t(REGISTRY[k].name)}</span><span class="dk-meta v13-mono">${t(line)}</span></span>${ico('next')}</button>`;
function renderRegistry(){
  const r = I().reg || { found:{} };
  if(DESK.reg && REGISTRY[DESK.reg]) return `<button type="button" class="v13-btn dk-back" data-act="reg-back">${ico('back')}SEARCH</button>` + regCard(DESK.reg);
  const known = Object.keys(r.found || {}).filter(k => REGISTRY[k]);
  let o = `<p class="dk-intro">Search the register by company, number or name. Directors change. Addresses rarely do.</p>
    <div class="dk-search"><label class="dk-lbl" for="reg-q">COMPANY, NUMBER OR NAME</label>
      <div class="dk-search-row"><input id="reg-q" type="text" inputmode="search" enterkeyhint="search" placeholder="e.g. Bluewater" value="${h(DESK.regQ || '')}" autocomplete="off" spellcheck="false"><button type="button" class="v13-btn" data-act="reg-search">${ico('search')}SEARCH</button></div></div>`;
  if(DESK.regMsg) o += `<p class="dk-src dk-regmsg" role="status">${h(DESK.regMsg)}</p>`;
  if(DESK.regAddr && DESK.regAddrHits){ o += `<h3 class="dk-group">AT ${t(String(DESK.regAddr).toUpperCase())} · <span class="v13-mono">${DESK.regAddrHits.length}</span></h3>` + DESK.regAddrHits.filter(k => REGISTRY[k]).map(k => regSlip(k, `${REGISTRY[k].no} · ${(REGISTRY[k].people || [])[0] || ''}`)).join(''); }
  else if(DESK.regHits && DESK.regHits.length){ o += `<h3 class="dk-group">RESULTS</h3>` + DESK.regHits.filter(k => REGISTRY[k]).map(k => regSlip(k, `${REGISTRY[k].no} · ${REGISTRY[k].addr}`)).join(''); }
  if(known.length) o += `<h3 class="dk-group">ON FILE</h3><div class="dk-chips">` + known.map(k => `<button type="button" class="v13-chip" data-act="reg-open" data-key="${h(k)}">${t(REGISTRY[k].name)}</button>`).join('') + `</div>`;
  return o;
}

/* ======================= STATEMENTS ======================= */
const stOpen = s => (typeof stAvailable === 'function' ? !!safe(() => stAvailable(s), false) : false);
const claimOf = (stId, cid) => { const s = STATEMENTS.find(x => x.id === stId); return s && s.claims.find(c => c.id === cid); };
function verdictOf(stId, cid){
  if(typeof intelVerdictOf === 'function') return safe(() => intelVerdictOf(stId, cid), null) || null;
  const r = ((I().st || {})[stId] || {})[cid];
  if(!r) return null;
  return typeof r === 'string' ? { verdict:r, locked:false, held:null } : r;
}
// file one verdict. With the v13 model: intelVerdict. Without it: the same rules, kept here (Senior: two taps, locked,
// +2 for every filing, UNVERIFIED stays open for one replacement; Recruit: judged now, retries allowed).
function fileVerdict(stId, cid, v){
  if(typeof intelVerdict === 'function') return safe(() => intelVerdict(stId, cid, v), null);
  const d = I(), c = claimOf(stId, cid); if(!c) return null;
  if(!senior()){ const r = typeof stJudge === 'function' ? safe(() => stJudge(stId, cid, v), null) : null; return r ? { locked:false, ok:r.ok, msg:r.msg } : null; }
  const cur = verdictOf(stId, cid);
  if(cur && cur.locked) return { locked:true, ok:null };
  const replacing = !!(cur && cur.verdict === 'unverified');
  const rec = { verdict:v, locked:v !== 'unverified' || replacing, held:!!safe(() => intelHas(c.proof), false) };
  if(replacing) rec.replaced = true;
  d.st[stId] = d.st[stId] || {}; d.st[stId][cid] = rec;
  if(typeof applyEffect === 'function') applyEffect({ intel:+2 });
  if(typeof saveGame === 'function') safe(() => saveGame(true));
  return { locked:rec.locked, ok:null };
}
function verdictTap(stId, cid, v){
  const cur = verdictOf(stId, cid);
  if(senior()){
    if(cur && cur.locked) return;
    const k = `${stId}|${cid}|${v}`;
    if(DESK.arm !== k){ DESK.arm = k; sfx('sfxClick'); return; }       // first tap: pencil it in
    DESK.arm = null;
    const r = fileVerdict(stId, cid, v);                                   // second tap: it goes on the file
    if(r) sfx('sfxComplete');
    return;
  }
  const r = fileVerdict(stId, cid, v);
  const c = claimOf(stId, cid);
  if(r && r.ok !== null && r.ok !== undefined){
    DESK.stMsg = { c:cid, ok:!!r.ok, msg:r.msg || (r.ok ? (c && c.why) || 'That holds against your exhibits.' : 'Read it against your exhibits again.') };
    sfx(r.ok ? 'sfxComplete' : 'sfxFail');
  }
}
const VLBL = v => ((typeof VERDICTS !== 'undefined' ? VERDICTS : []).find(x => x.id === v) || { lbl:String(v || '').toUpperCase() }).lbl;
function renderStatements(){
  const avail = STATEMENTS.filter(stOpen);
  const sen = senior();
  if(!DESK.st || !avail.some(s => s.id === DESK.st)){
    if(!avail.length) return `<p class="dk-intro">No statements on file. Sit witnesses down, in the field or through a briefing, and their words land here.</p>`;
    return `<p class="dk-intro">Witnesses lie, exaggerate, misremember and repeat rumours. None of them is labelled. Put each claim next to your exhibits and decide. ${sen
      ? 'Each verdict takes two taps and goes on the file. You see how they held up at the case review.'
      : 'Recruit: Uche checks each verdict against your exhibits as you go.'}</p>` +
      avail.map(s => { const n = s.claims.filter(c => verdictOf(s.id, c.id)).length;
        const src = (typeof PORTRAIT_ART !== 'undefined' && PORTRAIT_ART[s.art]) || '';
        return `<button type="button" class="dk-card dk-st-card" data-act="st" data-id="${h(s.id)}">${src ? `<img src="${src}" alt="">` : `<span class="dk-ico">${ico('people')}</span>`}<span class="dk-card-t"><span class="dk-name">${t(s.who)}</span><span class="dk-meta">${t(s.role)} · <span class="v13-mono">${n}/${s.claims.length}</span> filed</span></span>${ico('next')}</button>`; }).join('');
  }
  const s = STATEMENTS.find(x => x.id === DESK.st);
  const vs = typeof VERDICTS !== 'undefined' ? VERDICTS : [];
  return `<button type="button" class="v13-btn dk-back" data-act="st-back">${ico('back')}ALL STATEMENTS</button>
    <article class="v13-sheet dk-statement">
      <div class="v13-sheet-h">STATEMENT OF WITNESS</div>
      <div class="dk-name">${t(s.who)}</div><div class="dk-src">${t(s.role)}</div>
      ${s.claims.map((c, i) => {
        const cur = verdictOf(s.id, c.id), locked = !!(cur && cur.locked);
        const fb = !sen && DESK.stMsg && DESK.stMsg.c === c.id ? DESK.stMsg : null;
        const armedV = sen && DESK.arm && DESK.arm.startsWith(`${s.id}|${c.id}|`) ? DESK.arm.split('|')[2] : null;
        let foot = '';
        if(sen && locked) foot = `<div class="dk-filed"><span class="v13-stamp plain">FILED · ${h(VLBL(cur.verdict))}</span><span class="dk-src">On the file. It's read at the case review.</span></div>`;
        else if(sen && cur) foot = `<div class="dk-filed"><span class="v13-stamp plain">FILED · ${h(VLBL(cur.verdict))}</span><span class="dk-src">Left open. You can replace it once, if new evidence comes in.</span></div>`;
        const btns = (sen && locked) ? '' : `<div class="seg dk-verdicts" role="group" aria-label="Verdict on claim ${i + 1}">${vs.map(v => {
            const on = !sen ? (cur && cur.verdict === v.id) : (armedV === v.id);
            return `<button type="button" class="${on ? 'on' : ''}${armedV === v.id ? ' armed' : ''}" data-act="verdict" data-st="${h(s.id)}" data-c="${h(c.id)}" data-v="${h(v.id)}" aria-pressed="${!!on}">${armedV === v.id ? 'TAP AGAIN · FILE' : h(v.lbl)}</button>`; }).join('')}</div>`;
        const armNote = armedV ? `<p class="dk-src dk-armnote">${ico('stamp')}Tap ${h(VLBL(armedV))} again to file it.${armedV === 'unverified' ? ' UNVERIFIED stays open: you can replace it once.' : ' A filed verdict stays on the file.'}</p>` : '';
        return `<div class="dk-claim" data-c="${h(c.id)}"><div class="dk-claim-n v13-mono">CLAIM ${i + 1}</div><blockquote class="dk-claim-text">${t(c.text)}</blockquote>${foot}${btns}${armNote}
          ${fb ? `<div class="dk-fb ${fb.ok ? 'v13-mark-ok' : 'v13-mark-bad'}">${ico(fb.ok ? 'check' : 'cross')}${t(fb.msg)}</div>` : ''}</div>`;
      }).join('')}
    </article>`;
}

/* ======================= WARRANTS ======================= */
// read-only: one stamped sheet per warrant or order that has been decided. Decisions are made at the
// Commander's call and in the briefings, never here; nothing is listed before it is decided.
const WSPEC = [
  { id:'w_lekki', c:'lagos', title:'SEARCH WARRANT · OBI RESIDENCE, LEKKI', court:'Magistrate, Lagos' },
  { id:'w_asaba', c:'route', title:'SEARCH WARRANT · THE ASABA WAREHOUSE', court:'Magistrate, Delta' },
  { id:'w_cdr',   c:'route', title:'PRODUCTION ORDER · UGBOWO CELL RECORDS', court:'Federal High Court, Benin' },
  { id:'w_eko',   c:'voice', title:'SEARCH & ARREST WARRANT · EKOSODIN', court:'Magistrate, Benin' },
];
const CASE_LBL = { lagos:'LAGOS', route:'THE ROUTE', voice:'THE VOICE' };
function warrantOf(w){
  if(typeof V().warrantState === 'function'){ const r = safe(() => V().warrantState(w.id), null); if(r && r.status) return r; }
  // without the model's reader: the beta's charge-sheet warrant for the raids, the v13 record for the orders
  if(w.id === 'w_lekki' || w.id === 'w_asaba'){
    const a = typeof V().accused === 'function' ? safe(() => V().accused(w.c), null) : null;
    return { id:w.id, case:w.c, status:a ? (a.warrant === 'signed' || a.warrant === 'exigent' ? a.warrant : 'pending') : 'none', at:a && (a.warrantAt || a.exigentAt) };
  }
  const rec = (I().warrants || {})[w.id];
  const st = rec && (rec.status === 'granted' ? 'signed' : rec.status);
  return { id:w.id, case:w.c, status:['signed', 'none', 'exigent'].includes(st) ? st : 'pending', route:rec && rec.route, at:rec && rec.at };
}
const decided = (w, s) => (w.id === 'w_cdr' ? ['signed', 'none'] : ['signed', 'exigent']).includes(s.status);
function renderWarrants(){
  const list = WSPEC.map(w => ({ w, s:warrantOf(w) })).filter(x => decided(x.w, x.s));
  let o = `<p class="dk-intro">Warrants and court orders on this file, as they were decided. They are put to the magistrate at the Commander's call, from what holds on the operations table. Nothing is applied for from this desk.</p>`;
  if(!list.length) return o + `<p class="dk-intro">Nothing has been decided yet.</p>`;
  return o + list.map(({ w, s }) => {
    const signed = s.status === 'signed', none = s.status === 'none';
    const stamp = signed ? (w.id === 'w_cdr' ? 'ORDER GRANTED' : 'SIGNED') : none ? 'NO ORDER' : 'NO WARRANT';
    const status = signed ? (w.id === 'w_cdr' ? 'Granted before the tower' : 'Signed before the entry')
      : none ? 'Went in without a production order' : 'Exigent entry, without a warrant';
    const route = w.id === 'w_eko' && signed && s.route && s.route !== 'legacy' ? (s.route === 'commander' ? 'Lagos HQ' : s.route === 'zonal' ? 'Benin Zonal Command' : '') : '';
    const line = signed ? (s.route === 'legacy' ? 'On the file from before the Case Desk existed.' : 'On paper before anyone went through a door.')
      : none ? 'The tower data carries no court order. The defence will challenge it.'
      : 'Lawful on exigent circumstances, but the defence will test it in court.';
    return `<article class="v13-sheet dk-warrant" data-id="${h(w.id)}">
      <div class="v13-sheet-h">NACECA · ${h(CASE_LBL[w.c] || '')}</div>
      <div class="dk-w-head"><h3 class="dk-w-title">${h(s.label ? canon(s.label).toUpperCase() : w.title)}</h3><span class="v13-stamp ${signed ? 'good' : ''}">${stamp}</span></div>
      <dl class="dk-facts">
        <div><dt>STATUS</dt><dd>${h(status)}</dd></div>
        <div><dt>COURT</dt><dd>${h(s.court || w.court)}</dd></div>
        ${route ? `<div><dt>CARRIED BY</dt><dd>${h(route)}</dd></div>` : ''}
      </dl>
      <p class="dk-src">${ico(signed ? 'shield' : 'warning')}<span>${h(line)}</span></p>
    </article>`;
  }).join('');
}

/* ---------- desk shortcuts: J, pause menu, case files ---------- */
function deskInit(){
  if(deskInit._done) return; deskInit._done = true;
  ensureDesk();
  document.addEventListener('keydown', onKey);
  window.addEventListener('keydown', onEscFallback, true);
  const add = (parent, id, html, cls, fn, before) => {
    if(!parent || document.getElementById(id)) return null;
    const b = document.createElement('button'); b.type = 'button'; b.className = cls; b.id = id; b.innerHTML = html;
    b.addEventListener('click', fn);
    before && before.parentNode === parent ? parent.insertBefore(b, before) : parent.appendChild(b);
    return b;
  };
  const ms = document.getElementById('screen-missions');
  add(ms, 'btn-missions-desk', `${ico('folder')}CASE DESK`, 'btn ghost', () => openDesk(), document.getElementById('btn-missions-back'));
  const pa = document.querySelector('#screen-pause .title-actions');
  add(pa, 'btn-pause-desk', `${ico('folder')}CASE DESK`, 'btn', () => openDesk(), document.getElementById('btn-save'));
  // the case files screen offers the desk only when there is an investigation to show
  const sync = () => { const b = document.getElementById('btn-missions-desk'); if(!b) return;
    const any = !!(S && S.game && ((S.game.completedMissions || []).length || S.game.currentMission || (S.game.evidence || []).length));
    b.style.display = any ? '' : 'none'; };
  if(V().wrap && typeof window.renderMissionSelect === 'function') V().wrap('renderMissionSelect', orig => function(){ const r = orig.apply(this, arguments); safe(sync); return r; });
  sync();
  // desktop HUD: a "J · CASE DESK" pill beside TAB · CASE FILE (the pill row is hidden on touch; touch uses EVIDENCE)
  const pills = document.querySelector('#hud .hud-topleft-controls');
  if(pills && !document.getElementById('btn-desk')){
    const p = document.createElement('span'); p.className = 'pill'; p.id = 'btn-desk'; p.setAttribute('role', 'button'); p.tabIndex = -1;
    p.innerHTML = '<span class="k">J · </span>CASE DESK';
    p.addEventListener('click', e => { e.stopPropagation(); if(typeof ENGINE !== 'undefined' && ENGINE.movementEnabled) openDesk(); });
    const cf = document.getElementById('btn-casefile');
    cf && cf.parentNode === pills ? pills.insertBefore(p, cf.nextSibling) : pills.appendChild(p);
  }
}

window.openDesk = openDesk; window.closeDesk = closeDesk; window.renderDesk = renderDesk; window.deskDo = deskDo;
window.deskInit = deskInit; window.ensureDesk = ensureDesk; window.deskOpsTable = deskOpsTable;
})();
