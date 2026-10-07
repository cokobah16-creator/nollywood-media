/* =========================================================================
   NACECA · systems/progression.js
   Mission grades (S–D), the press archive of every front page you earned,
   a real-world scam-safety tip per mission, achievements (kept across saves),
   the Case Records screen, and the "Previously on NACECA" recap.
   ========================================================================= */

/* ---------- scam-safety tips (real-world, shown after each mission) ---------- */
const SAFETY_TIPS = {
  m1: "NACECA is fictional. If you're targeted by fraud in Nigeria, report it to your bank using the number printed on your card, and to the EFCC through its official website.",
  m2: "Your bank will never ask for your BVN, PIN or OTP by phone, SMS or WhatsApp. A caller who 'verifies' your account and asks for a code is a scammer — hang up and call the number on your card.",
  m3: "Crypto 'account managers' who promise fixed weekly returns, or ask you to pay a fee to unlock a withdrawal, are running a scam. A real exchange never charges you to release your own money.",
  m4: "Fake job and travel offers often ask for 'processing' or 'medical' fees up front, or ask you to carry a package. Never carry goods for someone whose contents you haven't seen.",
  m5: "Fraudsters borrow the trust of faith, family and tradition. Urgency plus secrecy is the warning sign, whoever the request seems to come from.",
  m6: "SIM-swap fraud starts with your personal details. Set a SIM PIN, and if your phone suddenly loses all signal, call your network and your bank from another phone straight away.",
  m7: "If you get a ransom call, contact the police at once and try to reach the person directly. Many ransom calls are 'virtual kidnappings' — a recorded voice, and no one actually taken.",
};

/* ---------- achievements (device-wide, survive new games) ---------- */
const ACH_KEY = 'naceca_achievements_v1';
const ACHIEVEMENTS = [
  { id:'sworn_in',      name:'Sworn In',                   desc:'Finish your first briefing at Lagos HQ.' },
  { id:'not_one',       name:'Not One Bystander',          desc:'Catch KC without knocking anyone over.' },
  { id:'faster',        name:'Faster Than Computer Village', desc:'Catch KC in the Ikeja market chase.' },
  { id:'by_the_book',   name:'By the Book',                desc:'Arrest Chief Obi with professional restraint.' },
  { id:'pulled_plug',   name:'Pulled the Plug',            desc:'Stop the laptop wipe before 25%.' },
  { id:'five_years',    name:'Five Years? Lie.',           desc:'Catch Musa in his lie and turn him.' },
  { id:'elders',        name:'Respect the Elders',         desc:'Enter the shrine with Pa Eze\'s blessing.' },
  { id:'out_of_smoke',  name:'Out of the Smoke',           desc:'Rescue Tobi from the burning office.' },
  { id:'dust',          name:'Dust Before the Door',       desc:'Catch Ifeanyi before he reaches the van.' },
  { id:'sixty',         name:'Sixty Seconds',              desc:'Hold the cabinet under fire and finish the trace.' },
  { id:'everyone',      name:'Everyone Walks Out',         desc:'Get the civilians out of the Ugbowo compound.' },
  { id:'nothing_left',  name:'Nothing Left Behind',        desc:'Collect every piece of evidence in a mission.' },
  { id:'textbook',      name:'Textbook',                   desc:'Earn an S grade on any mission.' },
  { id:'incorruptible', name:'Incorruptible',              desc:'Reach 85 Integrity.' },
];
let _ach = {};
try{ _ach = JSON.parse(localStorage.getItem(ACH_KEY) || '{}') || {}; }catch(e){ _ach = {}; }
function unlock(id){
  if(_ach[id]) return;
  const a = ACHIEVEMENTS.find(x=>x.id===id); if(!a) return;
  _ach[id] = Date.now();
  try{ localStorage.setItem(ACH_KEY, JSON.stringify(_ach)); }catch(e){}
  setTimeout(()=>toast('🏅 ' + a.name.toUpperCase(), a.desc, 2600), 900);
  haptic([20,40,20]);
}

/* ---------- grade ---------- */
function computeGrade(op){
  const evMax = +((document.getElementById('ev-max')||{}).textContent || 0);
  const evRatio = evMax ? Math.min(1, op.ev / evMax) : 1;
  const o = S.game._opStart || {};
  const r = S.player.reputation, r0 = o.rep || r;
  const repDelta = (r.integrity - r0.integrity) + (r.publicTrust - r0.publicTrust);
  const objs = S.game.objectives || [];
  const objRatio = objs.length ? objs.filter(x=>x.done).length / objs.length : 1;
  let pts = evRatio*35 + objRatio*25 + Math.max(0, Math.min(30, 18 + repDelta)) + Math.min(10, op.civ*5);
  pts -= op.force * 8;
  pts -= (S.game._opBumps || 0) * 3;
  const g = pts >= 85 ? 'S' : pts >= 70 ? 'A' : pts >= 55 ? 'B' : pts >= 40 ? 'C' : 'D';
  return { g, pts: Math.round(pts), evRatio };
}

/* ---------- aftermath hook: grade, tip, archive, achievements ---------- */
function onAftermath(op, head){
  const mid = S.game.currentMission;
  const gr = computeGrade(op);
  S.game.grades = S.game.grades || {};
  const prev = S.game.grades[mid];
  if(!prev || 'SABCD'.indexOf(gr.g) < 'SABCD'.indexOf(prev)) S.game.grades[mid] = gr.g;
  // archive: newest edition per mission
  S.game.archive = (S.game.archive || []).filter(a=>a.mid !== mid);
  S.game.archive.push({ mid, pub:head.pub, head:head.head, ded:head.ded, grade:gr.g, at:Date.now() });
  const grid = document.getElementById('aftermath-grid');
  if(grid){
    const g = document.createElement('div');
    g.className = 'aftermath-block grade-block'; g.style.gridColumn = '1/-1';
    g.innerHTML = `<div class="grade-letter g-${gr.g}">${gr.g}</div>
      <div class="grade-copy"><h3>OPERATION GRADE</h3>
      <div>Evidence ${op.ev}/${(document.getElementById('ev-max')||{}).textContent||0} · Civilians ${op.civ} · Force ${op.force}${S.game._opBumps?` · Bystanders hit ${S.game._opBumps}`:''}</div>
      ${S.game.grades[mid]!==gr.g?`<div class="grade-best">Best: ${S.game.grades[mid]}</div>`:''}</div>`;
    grid.insertBefore(g, grid.firstChild);
    if(SAFETY_TIPS[mid]){
      const t = document.createElement('div');
      t.className = 'aftermath-block tip-block'; t.style.gridColumn = '1/-1';
      t.innerHTML = `<h3>STAY SAFE — FOR REAL</h3><div>${SAFETY_TIPS[mid]}</div>`;
      grid.appendChild(t);
    }
  }
  // achievements
  const mc = S.game.moralChoices || {}, fl = S.game.flags || {};
  if(gr.g === 'S') unlock('textbook');
  if(gr.evRatio >= 1 && op.ev > 0) unlock('nothing_left');
  if(S.player.reputation.integrity >= 85) unlock('incorruptible');
  if(mid==='m3' && mc.arrest==='professional') unlock('by_the_book');
  if(mid==='m4' && S.game._cpMusaFlipped) unlock('five_years');
  if(mid==='m5' && (fl.shrine_access==='granted_negotiate')) unlock('elders');
  if(mid==='m6' && mc.asaba==='rescue') unlock('out_of_smoke');
  if(mid==='m6' && mc.asaba==='chase') unlock('dust');
  if(mid==='m7' && mc.tower==='hold') unlock('sixty');
  if(mid==='m7' && (mc.tower==='extract' || mc.tower==='cut_extract')) unlock('everyone');
}

/* ---------- Case Records: press archive + awards ---------- */
function ensureRecordsScreen(){
  if(document.getElementById('screen-records')) return;
  const ov = document.createElement('div'); ov.className = 'overlay'; ov.id = 'screen-records';
  ov.innerHTML = `<div class="overlay-bg"></div>
    <div class="settings-frame">
      <div class="settings-head"><h2>CASE RECORDS</h2><button class="btn ghost" id="btn-records-close">◀ BACK</button></div>
      <div class="seg rec-tabs"><button class="on" data-tab="archive">PRESS ARCHIVE</button><button data-tab="awards">AWARDS</button></div>
      <div class="settings-body" id="records-body"></div>
    </div>`;
  document.getElementById('game-root').appendChild(ov);
  document.getElementById('btn-records-close').addEventListener('click', ()=>showOverlay(_recordsReturn));
  ov.querySelectorAll('.rec-tabs button').forEach(b=>b.addEventListener('click', ()=>{
    ov.querySelectorAll('.rec-tabs button').forEach(x=>x.classList.toggle('on', x===b)); renderRecords(b.dataset.tab);
  }));
}
function renderRecords(tab){
  const body = document.getElementById('records-body');
  if(tab === 'awards'){
    const got = ACHIEVEMENTS.filter(a=>_ach[a.id]).length;
    body.innerHTML = `<div class="set-note" style="margin:4px 0 10px">${got} of ${ACHIEVEMENTS.length} unlocked</div>` +
      ACHIEVEMENTS.map(a=>`<div class="ach ${_ach[a.id]?'got':''}"><span class="ach-ico">${_ach[a.id]?'🏅':'🔒'}</span><div><div class="ach-name">${a.name}</div><div class="ach-desc">${a.desc}</div></div></div>`).join('');
    return;
  }
  const arc = (S.game.archive || []).slice().sort((a,b)=>b.at-a.at);
  if(!arc.length){ body.innerHTML = '<div class="set-note">No front pages yet. Finish an operation and the press will have something to say.</div>'; return; }
  body.innerHTML = arc.map(a=>{
    const m = MISSIONS.find(x=>x.id===a.mid) || {};
    return `<div class="headline-block arc"><div class="pub">${a.pub} · CASE ${m.num||''} · GRADE ${a.grade}</div><div class="head">${a.head}</div><div class="ded">${a.ded}</div></div>`;
  }).join('');
}
let _recordsReturn = null;
function openRecords(){
  ensureRecordsScreen();
  _recordsReturn = [...document.querySelectorAll('.overlay.show')].map(o=>o.id)[0] || null;
  renderRecords('archive');
  document.querySelectorAll('#screen-records .rec-tabs button').forEach((x,i)=>x.classList.toggle('on', i===0));
  showOverlay('screen-records');
}

/* ---------- Previously on NACECA (shown on Continue) ---------- */
function showRecap(then){
  const arc = (S.game.archive || []).slice().sort((a,b)=>b.at-a.at).slice(0,2);
  if(!arc.length){ then(); return; }
  let ov = document.getElementById('screen-recap');
  if(!ov){
    ov = document.createElement('div'); ov.className = 'overlay'; ov.id = 'screen-recap';
    document.getElementById('game-root').appendChild(ov);
  }
  const r = S.player.reputation;
  ov.innerHTML = `<div class="overlay-bg"></div><div class="settings-frame recap">
    <div class="aftermath-stamp">PREVIOUSLY ON NACECA</div>
    ${arc.map(a=>`<div class="headline-block arc"><div class="pub">${a.pub}</div><div class="head">${a.head}</div><div class="ded">${a.ded}</div></div>`).join('')}
    <div class="recap-rep">Integrity <b>${r.integrity}</b> · Public Trust <b>${r.publicTrust}</b> · Agency Favour <b>${r.agencyFavour}</b> · Level <b>${S.player.level}</b></div>
    <button class="btn primary" id="btn-recap-go">CONTINUE THE INVESTIGATION ▶</button></div>`;
  showOverlay('screen-recap');
  ov.querySelector('#btn-recap-go').addEventListener('click', ()=>{ then(); });
}
