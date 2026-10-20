/* =========================================================================
   NACECA · v13 sources — informants
   People the player wins over in the field become sources. Each has
   trust (will they keep talking), exposure (how close the wrong people
   are to knowing), and a record of tips that held or didn't. Tips come in
   between cases; once a source is exposed, some of them are planted.
   Registering a source is the proper procedure and protects Kelechi in
   court — but in Case 13 the register turns out to be read on the ninth
   floor. Paying from the source fund is clean. Underworld Heat above 70
   and sources go quiet.
   ========================================================================= */
(function(){
'use strict';
const V12 = window.V12, V13 = window.V13, MC = V13.mc;

/* who can become a source, and how */
V13.SRC = {
  HERBS:{ name:'Mama Karo', role:'Herbal remedies, Sapele night market', col:'#7a2a6a', ini:'H', since:'m10' },
  TILL: { name:'Ejiro', role:'POS kiosk T4, Sapele', col:'#d8b020', ini:'T', since:'m10', accomplice:true },
  NETS: { name:'Pa Timi', role:'Fisherman, Ethiope creek', col:'#4a6a8a', ini:'N', since:'m11' },
  TIDE: { name:'Chairman Ibinabo', role:'Boat drivers\' union, Port Harcourt', col:'#2a6a8a', ini:'Ti', since:'m12' },
  GATE: { name:'Sgt. (rtd.) Bitrus Gyang', role:'Gateman, Maitama', col:'#4a5232', ini:'G', since:'m13b' },
  KC:   { name:'KC', role:'Data cards, Computer Village (Season 1)', col:'#e07d4a', ini:'KC', since:'m9' },
  TUNDE:{ name:'Tunde', role:'Ikeja informant (Season 1)', col:'#5db86a', ini:'Tu', since:'m9' },
};
const st = ()=>{ const s = V13.s2(); s.sources = s.sources || {}; if(s.fund == null) s.fund = 120000; return s; };
V13.src = code => st().sources[code] || null;
V13.srcList = ()=>Object.keys(st().sources).filter(k => st().sources[k].on);
V13.recruit = function(code, trust){
  const s = st().sources; if(s[code] && s[code].on) return s[code];
  s[code] = { on:true, trust:trust || 55, exp:10, reg:false, paid:0, met:0, burned:false, tips:[], since:S.game.currentMission };
  V12.log('source', { code });
  if(typeof toast === 'function' && !V13._quietRecruit) toast('NEW SOURCE', `${code} — ${V13.SRC[code] ? V13.SRC[code].name : code}`, 2400);
  return s[code];
};
V13.srcBump = (code, k, n)=>{ const x = V13.src(code); if(x){ x[k] = Math.max(0, Math.min(100, (x[k] || 0) + n)); } };
V13.srcExposed = code => { const x = V13.src(code); return !!x && (x.burned || x.exp >= 60); };

/* Season 1 people who trust Kelechi come back as sources at the start of Season 2 */
V13.s1Sources = function(){
  const m = MC();
  const kcFair = m.market_runner === 'caught' && m.choice !== 'force';
  if(kcFair && !V13.src('KC')) V13.recruit('KC', 50);
  if(!V13.src('TUNDE')) V13.recruit('TUNDE', 60);
};
/* the cases recruit through their flags (called at the end of each case) */
V13.recruitFromFlags = function(){
  const m = MC();
  if(m.s2_karo === 'trust' && V13.s2().karo_source) V13.recruit('HERBS', 65);
  if(m.s2_ejiro === 'source') V13.recruit('TILL', 45);
  if(m.s2_timi === 'source') V13.recruit('NETS', 60);
  if(m.s2_ibinabo === 'source') V13.recruit('TIDE', 55);
  if(m.s2_bitrus === 'witness') V13.recruit('GATE', 70);
};
/* the register is read on the ninth floor (Case 13): every registered source is exposed */
V13.registerLeak = function(){
  st().registerLeak = 1;
  for(const c of V13.srcList()){ const x = V13.src(c); if(x.reg){ x.exp = Math.max(x.exp, 75); } }
};
V13.registered = ()=>V13.srcList().filter(c => V13.src(c).reg);
V13.unregistered = ()=>V13.srcList().filter(c => !V13.src(c).reg);

/* tips for the hub after a case: true ones, and — if the source is exposed — the planted ones */
V13.tipsFor = function(after){
  const out = [];
  if(V12.heat() >= 70) return out;
  for(const c of V13.srcList()){
    const x = V13.src(c), L = (V13.TIPS && V13.TIPS[c]) || [];
    for(let i = 0; i < L.length; i++){
      const t = L[i]; if(t.after !== after) continue;
      if(t.true === false && !V13.srcExposed(c)) continue;
      if(t.true !== false && V13.srcExposed(c) && L.some(u => u.after === after && u.true === false)) continue;   // exposed: they get fed the planted one instead
      out.push({ code:c, i, t });
    }
  }
  return out;
};
const lang = t => (typeof SETTINGS !== 'undefined' && SETTINGS.lang === 'english' && t.textEn) ? t.textEn : t.text;
/* deliver this hub's tips into the phone and the sources board */
V13.deliverTips = function(after){
  const P = V12.mem().phone, s = st();
  s.tipLog = s.tipLog || [];
  for(const { code, i, t } of V13.tipsFor(after)){
    const key = code + ':' + i; if(s.tipLog.some(e => e.key === key)) continue;
    s.tipLog.push({ key, code, after, text:lang(t), truth:t.true !== false, state:'new' });
    const id = 'src_' + code.toLowerCase();
    const th = P[id] = P[id] || { msgs:[], unread:0 };
    th.msgs.push({ f:'them', text:lang(t), at:after }); th.unread++; th.last = after;
  }
};
/* phone book entries for the sources */
(function(){
  const B = V13.phonebook(); if(!B) return;
  for(const c in V13.SRC) B['src_' + c.toLowerCase()] = { name:`${c} (source)`, ini:V13.SRC[c].ini, col:V13.SRC[c].col };
})();

/* ---------- the sources board ---------- */
V13.openSources = function(onClose){
  let ov = document.getElementById('screen-sources');
  if(!ov){ ov = V13.el('div', 'overlay', ''); ov.id = 'screen-sources'; document.getElementById('game-root').appendChild(ov); }
  const s = st(); s.tipLog = s.tipLog || []; s.corrob = s.corrob || {};
  const hubKey = S.game.currentMission;
  const left = ()=>2 - (s.corrob[hubKey] || 0);
  const bar = (v, col)=>`<span class="src-bar"><i style="width:${Math.round(v)}%;background:${col}"></i></span>`;
  const draw = ()=>{
    const codes = V13.srcList();
    const cards = codes.map(c => {
      const x = V13.src(c), I = V13.SRC[c] || { name:c, role:'' };
      const tips = s.tipLog.filter(e => e.code === c).slice(-2).reverse();
      const quiet = V12.heat() >= 70;
      return `<article class="src-card ${x.burned ? 'burned' : ''}">
        <header><b class="src-code">${c}</b><span class="src-name">${V13.esc(I.name)}</span>${x.reg ? '<i class="src-chip reg">REGISTERED</i>' : '<i class="src-chip">UNREGISTERED</i>'}${I.accomplice ? '<i class="src-chip acc">ACCOMPLICE</i>' : ''}</header>
        <p class="src-role">${V13.esc(I.role)}</p>
        <div class="src-row"><span>TRUST</span>${bar(x.trust, '#5dd07a')}<span>EXPOSURE</span>${bar(x.exp, '#e84a5c')}</div>
        ${tips.length ? tips.map(e => `<div class="src-tip ${e.state}"><q>${V13.esc(e.text)}</q>
          <div class="src-tip-a">${e.state === 'new' ? `<button class="btn ghost src-corr" data-k="${e.key}" ${left() <= 0 ? 'disabled' : ''}>CHECK IT (${left()} left today)</button><button class="btn ghost src-file" data-k="${e.key}">FILE IT AS IS</button>`
            : e.state === 'held' ? '<span class="src-v ok">CHECKED — IT HOLDS</span>' : e.state === 'false' ? '<span class="src-v bad">CHECKED — IT DOESN\'T HOLD. SOMEONE FED THEM THIS.</span>' : '<span class="src-v">FILED, NOT CHECKED</span>'}</div></div>`).join('')
          : `<p class="src-none">${quiet ? 'Quiet. Too much heat on your name — nobody is answering.' : 'Nothing new.'}</p>`}
        <div class="src-acts">
          ${x.reg ? '' : `<button class="btn ghost src-reg" data-c="${c}">REGISTER</button>`}
          <button class="btn ghost src-pay" data-c="${c}" ${s.fund < 20000 ? 'disabled' : ''}>PAY ₦20,000 FROM THE FUND</button>
          <button class="btn ghost src-meet" data-c="${c}" ${x.met >= 3 ? 'disabled' : ''}>MEET SOMEWHERE QUIET</button>
        </div></article>`;
    }).join('');
    ov.innerHTML = `<div class="overlay-bg"></div><div class="src-frame">
      <div class="src-head"><div><div class="plan-k">SOURCES</div><div class="plan-t">WHO TALKS TO YOU</div></div>
        <div class="src-fund">SOURCE FUND <b>${V13.money(s.fund)}</b></div><button class="ph-x src-x" aria-label="Close">✕</button></div>
      <p class="src-lead">Registering a source is the proper procedure, and it protects you in court. Exposed sources get fed lies. Paying from the fund is clean; paying with silence about their own crimes is how Adaeze started.</p>
      <div class="src-grid">${cards || '<p class="ops-p">No sources yet. People talk to officers who treat them well.</p>'}</div>
      <div class="src-foot"><button class="btn primary src-done">BACK</button></div></div>`;
    const close = ()=>{ showOverlay(null); if(typeof onClose === 'function') onClose(); };
    ov.querySelector('.src-x').onclick = close; ov.querySelector('.src-done').onclick = close;
    ov.querySelectorAll('.src-corr').forEach(b => b.onclick = ()=>{
      const e = s.tipLog.find(t => t.key === b.dataset.k); if(!e || left() <= 0) return;
      s.corrob[hubKey] = (s.corrob[hubKey] || 0) + 1;
      e.state = e.truth ? 'held' : 'false';
      if(e.truth){ S.game.intelScore = (S.game.intelScore || 0) + 2; V13.srcBump(e.code, 'trust', 3); }
      else { V13.srcBump(e.code, 'exp', 10); s.plantedCaught = (s.plantedCaught || 0) + 1; }
      if(typeof sfxBlip === 'function') sfxBlip(); draw();
    });
    ov.querySelectorAll('.src-file').forEach(b => b.onclick = ()=>{
      const e = s.tipLog.find(t => t.key === b.dataset.k); if(!e) return;
      e.state = 'filed'; if(!e.truth) s.plantedFiled = (s.plantedFiled || 0) + 1; else S.game.intelScore = (S.game.intelScore || 0) + 1;
      draw();
    });
    ov.querySelectorAll('.src-reg').forEach(b => b.onclick = ()=>{
      const x = V13.src(b.dataset.c); if(!x) return; x.reg = true; x.trust = Math.min(100, x.trust + 4);
      if(st().registerLeak) x.exp = Math.max(x.exp, 75);
      applyEffect({ agencyFavour:+1 }); if(typeof sfxClick === 'function') sfxClick(); draw();
    });
    ov.querySelectorAll('.src-pay').forEach(b => b.onclick = ()=>{
      const x = V13.src(b.dataset.c); if(!x || s.fund < 20000) return; s.fund -= 20000; x.paid += 20000; x.trust = Math.min(100, x.trust + 8);
      if(typeof sfxClick === 'function') sfxClick(); draw();
    });
    ov.querySelectorAll('.src-meet').forEach(b => b.onclick = ()=>{
      const x = V13.src(b.dataset.c); if(!x) return; x.met++; x.trust = Math.min(100, x.trust + 5); x.exp = Math.min(100, x.exp + 4);
      if(typeof sfxClick === 'function') sfxClick(); draw();
    });
  };
  draw();
  showOverlay('screen-sources');
};
})();
