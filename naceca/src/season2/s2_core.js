/* =========================================================================
   NACECA · v13 core — Season 2, "Operation Upstream"
   The Season 2 cards, state that carries over from Season 1, the faces of
   the new cast, and the small case framework every Season 2 case uses:
   a baked scene, people placed from the scene's anchors, conversations,
   documents, evidence with a quality the court will test, a watchful
   street, foot chases, time skips, and the walk from aftermath to the
   office to the next case.
   ========================================================================= */
(function(){
'use strict';
const V12 = window.V12, V13 = window.V13 = window.V13 || {};
V13.version = 'v13';
const MC = ()=>S.game.moralChoices || (S.game.moralChoices = {});
V13.mc = MC;
V13.el = V12.el; V13.esc = V12.esc;

/* ---------- the phone book: v12's own when it is exported (V12.PHONEBOOK), else Season 2's,
   which v13_merge.js shows on the phone (contacts the hub module can't see) ---------- */
V13._pb = V13._pb || {};
V13.phonebook = ()=>V12.PHONEBOOK || V13._pb;

/* ---------- Season 2 state (saved: plain data only) ---------- */
V13.s2 = ()=>{
  const g = S.game;
  if(!g.s2) g.s2 = { started:0, sources:{}, fixes:{}, trial:{}, finale:null, hubs:{}, seen:{}, notes:[] };
  return g.s2;
};
V13.flag = k => MC()[k];
V13.setFlag = (k, v)=>{ MC()[k] = v; (S.game.flags || (S.game.flags = {}))[k] = v; };

/* ---------- the shared helpers every Season 2 file reads (docs/season2/AGENT_PRIMER.md, "Shared contracts") ---------- */
// Recruit casework (the beta's mode). Anything that tells the player the next step or the answer is Recruit-only.
V13.rec = ()=>typeof isRecruit === 'function' && !!isRecruit();
// every Season 2 countdown advances by dt * V13.timeRate(): 0.75 Relaxed, 1.2 Hard, ÷1.6 extended, 0 = timed sequences off
V13.timeRate = ()=>typeof timerRate === 'function' ? timerRate() : 1;
// Season 2 state without creating it (a Season 1 save that never reaches Season 2 stays as it was)
const s2peek = ()=>(S.game && S.game.s2) || {};
/* Season 1 as Season 2 reads it. The snapshot is taken once, the first time a Season 2 case or office loads
   (V13.s1snapTake, from the loadMission wraps), and saved as plain data in S.game.s2.s1snap, so a Season 1
   replay in the middle of Season 2 changes nothing here. Before it exists, the live values are used. */
V13.s1live = function(){
  const g = S.game || {}, m = g.moralChoices || {};
  let wrong = null; try{ wrong = typeof _cwWrong === 'function' ? _cwWrong('lagos') : null; }catch(e){}
  let musa = false; try{ musa = !!(V12 && V12.who && typeof V12.who.musaTalked === 'function' && V12.who.musaTalked()); }catch(e){}   // V12.who (v12_mem.js); V12.mem() is the plain store
  return {
    tobiAlive: m.asaba === 'rescue' || (m.asaba === 'chase' && !g._asabaHostageLost),   // canon: systems/finale.js
    tobiTestifies: m.asaba === 'rescue',                                                 // only the deliberate rescue takes the stand
    bribe: m.arrest === 'bribe',
    kcFair: m.market_runner === 'caught' && m.choice !== 'force',
    kcWrong: wrong === 'kc', tundeWrong: wrong === 'tunde',
    musaTalked: musa,
  };
};
V13.s1snap = ()=>s2peek().s1snap || V13.s1live();
V13.s1snapTake = function(){ const s = V13.s2(); if(!s.s1snap) s.s1snap = V13.s1live(); return s.s1snap; };
V13.tobiAlive = ()=>!!V13.s1snap().tobiAlive;
V13.tobiTestifies = ()=>!!V13.s1snap().tobiTestifies;
// Adaeze's fate as Season 2 reads it: s2_merge's adaptS1Fate writes s2.s1fate; Season 1's own moralChoices.finale is never rewritten
V13.s1fate = ()=>s2peek().s1fate || MC().finale || 'unproven';
V13.s1 = ()=>({ finale:V13.s1fate(), tobi:V13.tobiAlive(), bribe:!!V13.s1snap().bribe });

/* ---------- dialogue-line fields (Season 2 lines only; Season 1's lines carry none of them) ----------
   rec:1        the line plays only on Recruit;
   sr:'…'       on Senior the line plays with this text instead (srEn:'…' is its English for a Pidgin line);
   cond:"<JS>"  the line plays only if the expression (over S) is true when the line is reached; an error is false.
   Skipped lines are stepped over, never removed, so indexes and choice jumps keep working. An sr line is swapped
   into a one-time shallow copy of the running script (DIALOGUE itself is never changed); V13.dlgKey() still names it. */
const condFn = new Map();
V13.lineOn = function(line){
  if(!line || typeof line !== 'object') return true;
  if(line.rec && !V13.rec()) return false;
  if(line.cond != null && line.cond !== ''){
    let f = condFn.get(line.cond);
    if(f === undefined){ try{ f = new Function('S', 'return (' + line.cond + ')'); }catch(e){ f = null; } condFn.set(line.cond, f); }
    if(!f) return false;
    try{ return !!f(S); }catch(e){ return false; }
  }
  return true;
};
/* the text a line shows now, for a line that is radioed, texted or toasted instead of played as a conversation
   (the same three fields): '' when V13.lineOn(line) is false; else its sr on Senior (srEn in English), else its
   text (textEn in English). A plain string is returned as it is. */
V13.lineText = function(line){
  if(typeof line === 'string') return line;
  if(!line || typeof line !== 'object' || !V13.lineOn(line)) return '';
  const en = typeof SETTINGS !== 'undefined' && SETTINGS.lang === 'english';
  if(line.sr != null && !V13.rec()) return (en && line.srEn) ? line.srEn : String(line.sr);
  return (en && line.textEn) ? line.textEn : (line.text || '');
};
function scriptKeyOf(arr){
  if(!arr) return null;
  if(arr._s2key) return arr._s2key;
  const src = arr._s2src || arr;
  for(const k in DIALOGUE) if(DIALOGUE[k] === src) return k;
  return null;
}
/* the key of the conversation (or the choice branch) on screen now; DLG.scriptKey stays the key it started with */
V13.dlgKey = ()=>(typeof DLG !== 'undefined' && DLG && DLG.script) ? (scriptKeyOf(DLG.script) || DLG.scriptKey || null) : null;
V13.lineFields = function(){
  if(typeof DLG === 'undefined' || !DLG || !Array.isArray(DLG.script)) return;
  let n = 0;
  while(DLG.idx < DLG.script.length && !V13.lineOn(DLG.script[DLG.idx]) && n++ < 2000) DLG.idx++;
  const line = DLG.script[DLG.idx];
  if(line && line.sr != null && !line._s2sr && !V13.rec()){
    if(!DLG.script._s2src){
      const src = DLG.script, c = Object.assign([], src);              // indexes and the script's own marks (_pick, _v13…)
      Object.defineProperty(c, '_s2src', { value:src }); Object.defineProperty(c, '_s2key', { value:scriptKeyOf(src) });
      DLG.script = c;
    }
    DLG.script[DLG.idx] = Object.assign({}, line, { text:line.sr, textEn:line.srEn || undefined, _s2sr:true });
  }
};
V13.wrap('renderDialogueLine', orig => function(){
  try{ V13.lineFields(); }catch(e){ console.warn('[v13] line fields', e); }
  return orig.apply(this, arguments);
});

/* ---------- a document's own outcome: V13.docFailed(key) is true when it failed forward (the misses ran out) ---------- */
V13._docRes = {};
V13.docFailed = key => V13._docRes[key] === 'failed';
if(V12 && typeof V12.openDoc === 'function' && !V12.openDoc._s2res){
  const od = V12.openDoc, seen = new WeakSet();
  V12.openDoc = function(spec){
    try{
      if(spec && spec.key && !seen.has(spec)){
        seen.add(spec); const k = spec.key, f0 = spec.onFailed, s0 = spec.onSolved;
        spec.onFailed = function(){ V13._docRes[k] = 'failed'; if(typeof f0 === 'function') return f0.apply(this, arguments); };
        spec.onSolved = function(){ V13._docRes[k] = 'solved'; if(typeof s0 === 'function') return s0.apply(this, arguments); };
      }
      if(spec && spec.key) delete V13._docRes[spec.key];
    }catch(e){}
    return od.apply(this, arguments);
  };
  V12.openDoc._s2res = true;
}

/* ---------- the Season 2 cards ---------- */
V13.CARDS = [
  { id:'m9',  num:'09',  name:'The Evidence Room', region:'EDO · BENIN ZONAL COMMAND, 21:40', env:'hq', music:'investigation',
    summary:'Abuja wants exhibit 14 on the six o\'clock flight. Commander Okundaye gives you the night.' },
  { id:'m10', num:'10',  name:'The Night Market', region:'DELTA · SAPELE WATERSIDE NIGHT MARKET', env:'sapele', music:'ambient_lagos',
    summary:'Plain clothes. A terminal number from the ledger, a changer with sacks of cash, and a market that notices strangers.' },
  { id:'m11', num:'11',  name:'Black Rain', region:'DELTA · ETHIOPE CREEKS, 01:20', env:'creek', music:'stealth',
    summary:'Read the soot, the wind and the tide. Find the camp that cooks stolen crude by night.' },
  { id:'m12', num:'12',  name:'Paper Oil', region:'RIVERS · PORT HARCOURT WATERFRONT', env:'tankfarm', music:'investigation',
    summary:'A tank farm that turns stolen diesel into clean paperwork. Warrant, or no warrant.' },
  { id:'m13', num:'13',  name:'The Ninth Floor', region:'ABUJA · NACECA HEADQUARTERS, 09:50', env:'abuja_office', music:'investigation',
    summary:'The Director-General will see you now. He has read your file, and he has an offer.' },
  { id:'m13b', num:'13½', name:'The Gateman\'s Book', region:'ABUJA · MAITAMA, 22:15', env:'maitama', music:'stealth', interlude:true,
    summary:'An empty mansion, a retired soldier on the gate, and a book where everything is written down.' },
  { id:'m14', num:'14',  name:'FRN v. Edafe & 2 Ors', region:'ABUJA · FEDERAL HIGH COURT, COURT 5', env:'court', music:'investigation',
    summary:'Your investigation goes on trial. A Senior Advocate has read every page of it.' },
  { id:'m15', num:'15',  name:'The Barge', region:'RIVERS · BONNY RIVER, RIVERSTONE JETTY, 23:30', env:'tankfarm_n', music:'stealth',
    summary:'Season 2 finale. Witnesses, a barge, the man who paid for it all. Career or truth.' },
];
V13.CARD = id => V13.CARDS.find(c => c.id === id);
V13.S2_IDS = V13.CARDS.map(c => c.id);
V13.isS2 = id => V13.S2_IDS.includes(id);
(function installCards(){
  // the Season 1 build teased Season 2 as four locked cards: replace them with the real season
  for(let i = MISSIONS.length - 1; i >= 0; i--) if(MISSIONS[i].season === 2) MISSIONS.splice(i, 1);
  for(const c of V13.CARDS) MISSIONS.push({ id:c.id, num:c.num, name:c.name, region:c.region, summary:c.summary, playable:false, season:2, interlude:!!c.interlude });
  for(const c of V13.CARDS) ENV_FOR[c.id] = c.env;
})();
/* Season 1 is closed once its epilogue has started (systems/finale.js startEpilogue), which is after the trial has
   sat: an M8-aftermath save that still owes the trial gets the trial first (v13_court.js ctFinalePending). */
V13.s1Done = ()=>!!(S.game && S.game.seasonOneComplete);
V13.unlocked = id => {
  if(!V13.s1Done()) return false;
  const i = V13.S2_IDS.indexOf(id); if(i <= 0) return i === 0;
  const done = S.game.completedMissions || [];
  return done.includes(V13.S2_IDS[i - 1]) || done.includes(id);
};
/* one place sets which Season 2 cards are playable: the mission select and Continue (nextPlayableMission) both read it */
V13.syncCards = ()=>{ for(const m of MISSIONS) if(m.season === 2) m.playable = V13.unlocked(m.id); };
V13.wrap('renderMissionSelect', orig => function(){
  V13.syncCards();
  const r = orig.apply(this, arguments);
  document.querySelectorAll('#mission-grid .mission-card.locked .stamp').forEach(st => {
    const id = st.closest('.mission-card').dataset.mid;
    if(V13.isS2(id)) st.textContent = V13.s1Done() ? 'LOCKED' : 'FINISH SEASON 1';
  });
  // the subtitle the Season 1 build wrote for its teaser cards
  const d = document.querySelector('#screen-missions .desc');
  if(d) d.textContent = 'Season 1, Operation Serpent’s Route: cases 00–08. Season 2, Operation Upstream: cases 09–15, open once Season 1 is closed.';
  return r;
});
// Continue after a reload: the Season 2 cards are current before resumeCampaign looks for the next case
// (an office that is owed still opens first: loadMission → V13.hubBefore)
// Before Season 2 has begun, a replayed M8 whose trial was cut off mid-sitting (The Case File's I().courtRun,
// v13_court.js ctRunFor) comes first: its ctFinalePending only resumes the trial and its epilogue when no case is next,
// so no Season 2 card is offered then. Once Season 2 has begun, Continue goes on with Season 2 (the M8 replay is in
// the mission select), as ctFinalePending does whenever a case is next.
V13.wrap('nextPlayableMission', orig => function(){
  try{
    const g = S.game || {}, o = (g.moralChoices || {}).finale, done = g.completedMissions || [];
    const s2begun = !!s2peek().started || V13.S2_IDS.some(id => done.includes(id));
    if(!s2begun && typeof ctRunFor === 'function' && done.includes('m8') && ctRunFor(o)){
      for(const m of MISSIONS) if(m.season === 2) m.playable = false;
      return orig.apply(this, arguments);
    }
  }catch(e){ console.warn('[v13] cards (trial)', e); }
  try{ V13.syncCards(); }catch(e){ console.warn('[v13] cards', e); }
  return orig.apply(this, arguments);
});

/* ---------- music, prefetch ---------- */
V13.wrap('musicForScene', orig => function(kind){
  const c = V13.CARD(kind);
  if(c && typeof playMusic === 'function'){ playMusic(c.music, { volume:c.music === 'ambient_lagos' ? 0.5 : c.music === 'stealth' ? 0.5 : 0.42 }); return; }
  if(V13.HUBMUSIC && V13.HUBMUSIC[kind]){ playMusic('investigation', { volume:0.26 }); return; }
  return orig.apply(this, arguments);
});
if(V13.MUSIC_FOR) for(const c of V13.CARDS) V13.MUSIC_FOR[c.id] = c.music;

/* ---------- faces: the new cast (stand-in portraits until the painted ones arrive) ---------- */
(function speakers(){
  // TOBI before OBI ("TOBI" contains "OBI"), and every new speaker ahead of the generic matches
  const i = SPEAKER_ART.findIndex(([k]) => k === 'TOBI'); if(i > 0){ const t = SPEAKER_ART.splice(i, 1)[0]; SPEAKER_ART.unshift(t); }
  const add = [
    ['OKUNDAYE','osagie'], ['IKPE','ikpe'], ['IGBINOSA','igbinosa'], ['KUTI','kuti'], ['ESCORT INSPECTOR','escort'],
    ['MAMA KARO','karo'], ['EJIRO','ejiro'], ['LUCKY','lucky'], ['LEGAL AID','legalaid'], ['BOATMAN','boatman'],
    ['ESUSU','esusu'], ['OGAGA','ogaga'], ['MAMA TEGA','mamaefe'], ['PA TIMI','timi'], ['FELIX','felix'], ['CAMP ESCORT','campescort'], ['CAMP BOY','campboy'],
    ['DANLADI','hauwa'], ['AMINA','amina'], ['SOTONYE','sotonye'], ['IBINABO','ibinabo'], ['TANK FARM SECURITY','security'],
    ['DIRECTOR-GENERAL','dg'], ['FASHINA','dg'], ['BABA SHAYI','shayi'], ['GATEMAN','gateman'], ['BITRUS','bitrus'], ['EREBA','ereba'],
    ['SENATOR','senator'], ['TASK FORCE','acp'], ['IFE ADEBAYO','ife'], ['JUSTICE','judge'], ['REGISTRAR','registrar'], ['OLANIRAN','san'],
  ];
  for(let k = add.length - 1; k >= 0; k--) SPEAKER_ART.unshift(add[k]);
})();
/* who looks like what (stand-in portraits are painted from this, and so are the 3D people) */
V13.CAST = {
  osagie:{ name:'COMMANDER OKUNDAYE', f:1, skin:'#5a3524', top:'#1b2a4c', hair:'#121010', hat:'beret', hatCol:'#1b2a4c' },
  ikpe:{ name:'SGT. IKPE', skin:'#4a2b1c', top:'#2c3a5a', hair:'#c8c4bc', beard:'#b8b4ac' },
  igbinosa:{ name:'MR. IGBINOSA', skin:'#4e2f20', top:'#d8d2c4', hair:'#141110', glasses:1 },
  // Season 1's Tobi (scenes/asaba.js: buildNPCMesh skin #5a3818, shirt #5a5a3a, hair #0a0a08, glasses)
  tobi:{ name:'TOBI ONUOHA', skin:'#5a3818', top:'#5a5a3a', hair:'#0a0a08', glasses:1 },
  kuti:{ name:'MR. KUTI', skin:'#5a3826', top:'#2a2a30', hair:'#0e0c0b', tie:'#7a1a1a' },
  escort:{ name:'ESCORT INSPECTOR', skin:'#3e2418', top:'#1d2b4c', hair:'#0c0a09', hat:'beret', hatCol:'#14141a' },
  karo:{ name:'MAMA KARO', f:1, skin:'#5a3826', top:'#7a2a6a', hair:'#0a0a0a', hat:'gele', hatCol:'#d8a020' },
  ejiro:{ name:'EJIRO', skin:'#4a2b1c', top:'#d8b020', hair:'#0c0a09' },
  lucky:{ name:'LUCKY EDAFE', skin:'#4e2e1e', top:'#1e46b0', hair:'#0c0a09', chain:1, glasses:1 },
  legalaid:{ name:'BARR. ESE OMOREGIE', f:1, skin:'#5a3826', top:'#151515', hair:'#141110', bands:1 },
  boatman:{ name:'BOATMAN', skin:'#3e2418', top:'#4a6a8a', hair:'#0c0a09' },
  esusu:{ name:'MAMA ESUSU', f:1, skin:'#5a3826', top:'#2a7a4a', hair:'#0a0a0a', hat:'wrap', hatCol:'#2a7a4a' },
  ogaga:{ name:'OGAGA', skin:'#4a2b1c', top:'#3a3a3a', hair:'#0c0a09' },
  mamaefe:{ name:'MAMA TEGA', f:1, skin:'#5a3826', top:'#c85a18', hair:'#0a0a0a', hat:'wrap', hatCol:'#c85a18' },
  timi:{ name:'PA TIMI', skin:'#3a2216', top:'#6a5a3a', hair:'#c8c4bc', beard:'#c8c4bc', hat:'cap', hatCol:'#3a3a3a' },
  felix:{ name:'FELIX UGBEKILE', skin:'#4a2b1c', top:'#3a4a3a', hair:'#3a3a38', beard:'#3a3a38', glasses:1 },
  campescort:{ name:'CAMP ESCORT', skin:'#3e2418', top:'#1a1a1a', hair:'#0c0a09', hat:'cap', hatCol:'#1a1a1a' },
  campboy:{ name:'CAMP BOY', skin:'#3e2418', top:'#5a5a5a', hair:'#0c0a09' },
  hauwa:{ name:'BARRISTER DANLADI', f:1, skin:'#6a4228', top:'#151515', hair:'#141110', hat:'wrap', hatCol:'#2a3a6a', bands:1 },
  amina:{ name:'CPL. AMINA', f:1, skin:'#5a3524', top:'#2c3a5a', hair:'#121010', hat:'beret', hatCol:'#14141a' },
  sotonye:{ name:'SOTONYE JUMBO', f:1, skin:'#5a3826', top:'#e8e2d4', hair:'#141110', glasses:1 },
  ibinabo:{ name:'CHAIRMAN IBINABO', f:1, skin:'#4e2e1e', top:'#2a6a8a', hair:'#0a0a0a', hat:'gele', hatCol:'#c83a2a' },
  security:{ name:'TANK FARM SECURITY', skin:'#3e2418', top:'#3a4a2a', hair:'#0c0a09', hat:'cap', hatCol:'#2a3a1a' },
  dg:{ name:'DIRECTOR-GENERAL FASHINA', skin:'#4a2b1c', top:'#1a1c22', hair:'#a8a49c', glasses:1, tie:'#1b2a4c' },
  shayi:{ name:'BABA SHAYI', skin:'#5a3826', top:'#e8e4da', hair:'#c8c4bc', beard:'#c8c4bc', hat:'cap', hatCol:'#e8e4da' },
  gateman:{ name:'GATEMAN', skin:'#4a2b1c', top:'#3a4a6a', hair:'#0c0a09' },
  bitrus:{ name:'SGT. (RTD.) BITRUS', skin:'#3e2418', top:'#4a5232', hair:'#a8a49c', hat:'beret', hatCol:'#4a2a1a' },
  ereba:{ name:'GODWIN EREBA', skin:'#4a2b1c', top:'#e8e8e4', hair:'#0c0a09', hat:'cap', hatCol:'#1a1a1a' },
  senator:{ name:'SENATOR DOUGLAS-AKPAN', skin:'#4e2e1e', top:'#e8e0c8', hair:'#7a7670', beard:'#7a7670', hat:'bowler', hatCol:'#1a1a1a' },
  acp:{ name:'ACP LAWAL', skin:'#4a2b1c', top:'#1a1a1a', hair:'#0c0a09', hat:'beret', hatCol:'#1a1a1a' },
  ife:{ name:'IFE ADEBAYO', f:1, skin:'#5a3826', top:'#c8a04a', hair:'#0a0a0a' },
  judge:{ name:'HON. JUSTICE BAKARE', skin:'#4a2b1c', top:'#151515', hair:'#f2f0ea', wig:1, bands:1, glasses:1 },
  registrar:{ name:'REGISTRAR', f:1, skin:'#5a3826', top:'#2a2a30', hair:'#141110' },
  san:{ name:'FEMI OLANIRAN-COLE, SAN', skin:'#5a3826', top:'#151515', hair:'#f2f0ea', wig:1, bands:1 },
};
/* a stand-in until the painted portrait arrives: a flat case-file silhouette on the paper identity's ink —
   the cast's headwear, glasses and clothing tone, a 2px rule round the figure, no face invented, no light effects.
   A painted PORTRAIT_ART[id + '_neutral'] always wins (V13.portraits). */
const PAL = { ink:'#1C1C1A', ink2:'#262623', manila:'#E9DCC0', manila2:'#A89F8A', manila3:'#8C8473' };
function hexRGB(h){ h = String(h || '#3a3a3a').replace('#', ''); if(h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16) || 0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function mix(a, b, t){ const A = hexRGB(a), B = hexRGB(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); }
function standIn(id){
  const C = V13.CAST[id]; if(!C) return null;
  const S_ = 256, c = document.createElement('canvas'); c.width = c.height = S_; const x = c.getContext('2d');
  const cx = S_ * 0.5;
  // ground: flat ink, ruled like a file card
  x.fillStyle = PAL.ink; x.fillRect(0, 0, S_, S_);
  x.save(); x.globalAlpha = 0.35; x.strokeStyle = PAL.manila3; x.lineWidth = 1;
  for(let y = 14; y < S_ - 30; y += 14){ x.beginPath(); x.moveTo(0, y + 0.5); x.lineTo(S_, y + 0.5); x.stroke(); }
  x.restore();
  const f = !!C.f, hw = f ? 40 : 43;
  // the silhouette as one path: shoulders, neck, head
  const P = new Path2D();
  P.moveTo(cx - 112, S_); P.quadraticCurveTo(cx - 106, 178, cx - 38, 166); P.lineTo(cx - 17, 160); P.lineTo(cx - 17, 138);
  P.ellipse(cx, 104, hw, 50, 0, Math.PI * 0.62, Math.PI * 2.38);
  P.lineTo(cx + 17, 160); P.lineTo(cx + 38, 166); P.quadraticCurveTo(cx + 106, 178, cx + 112, S_); P.closePath();
  const H = new Path2D();
  if(C.hat === 'gele'){ H.ellipse(cx, 58, 64, 36, -0.12, 0, Math.PI * 2); }
  else if(C.hat === 'wrap'){ H.ellipse(cx, 68, 50, 30, 0, Math.PI * 0.95, Math.PI * 2.05); H.rect(cx - 50, 64, 100, 12); }
  else if(C.hat === 'beret'){ H.ellipse(cx - 6, 62, 52, 19, -0.15, 0, Math.PI * 2); }
  else if(C.hat === 'cap'){ H.ellipse(cx, 64, 44, 25, 0, Math.PI, Math.PI * 2); H.rect(cx - 44, 60, 88, 9); H.ellipse(cx + 30, 66, 30, 6, 0.1, 0, Math.PI * 2); }
  else if(C.hat === 'bowler'){ H.ellipse(cx, 58, 39, 27, 0, Math.PI, Math.PI * 2); H.ellipse(cx, 60, 54, 9, 0, 0, Math.PI * 2); }
  else if(f){ H.ellipse(cx, 70, 52, 36, 0, Math.PI, Math.PI * 2); H.ellipse(cx, 60, 30, 22, 0, 0, Math.PI * 2); }
  const W = new Path2D();
  if(C.wig){ W.ellipse(cx, 72, 52, 34, 0, Math.PI, Math.PI * 2); for(let i = 0; i < 4; i++){ W.ellipse(cx - 47, 88 + i * 13, 9, 7, 0, 0, 7); W.ellipse(cx + 47, 88 + i * 13, 9, 7, 0, 0, 7); } }
  // the figure: flat ink-2, one flat clothing tone from the collar down
  x.fillStyle = PAL.ink2; x.fill(P);
  x.save(); x.clip(P);
  x.fillStyle = mix(C.top || '#3a3a3a', PAL.ink, 0.45); x.fillRect(0, 164, S_, S_ - 164);
  if(C.bands){ x.fillStyle = PAL.manila2; x.fillRect(cx - 9, 168, 7, 30); x.fillRect(cx + 2, 168, 7, 30); }
  if(C.tie){ x.fillStyle = PAL.manila2; x.beginPath(); x.moveTo(cx - 15, 166); x.lineTo(cx, 194); x.lineTo(cx + 15, 166); x.fill();
    x.fillStyle = mix(C.tie, PAL.ink, 0.3); x.beginPath(); x.moveTo(cx - 5, 172); x.lineTo(cx + 5, 172); x.lineTo(cx + 7, 232); x.lineTo(cx, 242); x.lineTo(cx - 7, 232); x.fill(); }
  if(C.chain){ x.strokeStyle = PAL.manila2; x.lineWidth = 3; x.beginPath(); x.arc(cx, 158, 30, 0.35, Math.PI - 0.35); x.stroke(); }
  x.restore();
  // the 2px rule round the figure
  x.strokeStyle = PAL.manila3; x.lineWidth = 2; x.stroke(P);
  // headwear in its own colour (flat), ruled the same; the wig in pale paper
  if(C.hat === 'gele' || C.hat === 'wrap' || C.hat === 'beret' || C.hat === 'cap' || C.hat === 'bowler'){ x.fillStyle = mix(C.hatCol || '#333333', PAL.ink, 0.4); x.fill(H); x.stroke(H); }
  else if(f){ x.fillStyle = PAL.ink; x.fill(H); x.stroke(H); }
  if(C.wig){ x.fillStyle = PAL.manila2; x.fill(W); x.stroke(W); }
  // glasses: two plain frames
  if(C.glasses){ x.strokeStyle = PAL.manila3; x.lineWidth = 2; x.strokeRect(cx - 30, 94, 18, 11); x.strokeRect(cx + 12, 94, 18, 11); x.beginPath(); x.moveTo(cx - 12, 99); x.lineTo(cx + 12, 99); x.stroke(); }
  // the name tab: manila on ink, in the head font
  x.fillStyle = PAL.ink; x.fillRect(0, S_ - 30, S_, 30);
  x.fillStyle = PAL.manila3; x.fillRect(0, S_ - 30, S_, 1);
  x.fillStyle = PAL.manila; x.font = '600 13px Oswald, "Arial Narrow", sans-serif'; x.textAlign = 'center'; x.fillText(C.name, cx, S_ - 11, S_ - 16);
  return c.toDataURL('image/webp', 0.86);
}
V13._standIn = standIn;     // (probes: the painter on its own)
V13.portraits = function(){
  if(typeof PORTRAIT_ART === 'undefined') return;
  for(const id in V13.CAST){
    if(PORTRAIT_ART[id + '_neutral']) continue;                 // a painted face arrived: keep it
    try{ const u = standIn(id); if(u) PORTRAIT_ART[id + '_neutral'] = u; }catch(e){}
  }
};
/* phone calls show a call card instead of a face */
V13._call = null;
V13.wrap('drawPortrait', orig => function(kind, speaker, mood){
  if(V13._call && speaker && V13._call.test(String(speaker).toUpperCase())) return orig.call(this, kind, 'CALLER', mood);
  return orig.apply(this, arguments);
});
V13.call = (re, key, cb)=>{ V13._call = re; V13.say(key, ()=>{ V13._call = null; if(cb) cb(); }); };

/* ---------- conversations, documents, evidence ---------- */
V13.has = k => !!DIALOGUE[k];
V13.say = function(key, cb){
  if(!DIALOGUE[key] || !DIALOGUE[key].length){ console.warn('[v13] missing dialogue', key); if(cb) setTimeout(cb, 0); return; }
  startDialogue(key, cb);
};
/* the first key that exists */
V13.pick = (...keys)=>keys.find(k => k && DIALOGUE[k]);
/* lines spliced together into a one-off run */
V13.run = function(name, parts, cb){
  const L = [];
  for(const p of parts){ if(!p) continue; if(typeof p === 'string'){ if(DIALOGUE[p]) L.push(...DIALOGUE[p]); } else if(Array.isArray(p)) L.push(...p); else L.push(p); }
  DIALOGUE[name] = L; V13.say(name, cb);
};
V13.doc = function(key, cb){
  if(!PUZZLES[key]){ console.warn('[v13] missing document', key); if(cb) setTimeout(()=>cb(false), 0); return; }
  openPuzzle(key, ok => { if(cb) cb(ok); });
};
V13.ev = function(id, name, q, xp){
  // a document's onCorrect may already have collected it this operation: collect (and log) it once
  if(!(S.game._opEv || []).includes(id)) collectEvidence({ id, name, xp:xp || 60 });
  S.game.evQ = S.game.evQ || {};
  if(q) S.game.evQ[id] = q; else if(!S.game.evQ[id]) S.game.evQ[id] = 'good';
  if(typeof refreshEvidenceCount === 'function') refreshEvidenceCount();
};
V13.hasEv = id => V12.hasEv(id);
V13.evQ = id => V12.evQ(id);
V13.obj = (id, text)=>V12.objAdd(id, text);
V13.done = id => { if(typeof completeObjective === 'function') completeObjective(id); };
V13.objDone = id => V12.objDone(id);
V13.toast = (a, b, ms)=>toast(a, b, ms || 2200);
V13.radio = (who, text, ms)=>V12.say(who, text, ms);
V13.text = (who, text, ms)=>V12.text(who, text, ms);

/* ---------- a scene from a baked environment ---------- */
V13.meta = key => (ENVART.sets[key] && ENVART.sets[key].meta) || (typeof ART_INLINE !== 'undefined' && ART_INLINE['env_' + key + '_meta']) || { anchors:{} };
V13.A = key => (V13.meta(key).anchors || {});
V13.at = (key, name, dflt)=>{ const a = V13.A(key)[name]; return a ? { x:a.pos[0], y:a.pos[1] || 0, z:a.pos[2], rot:a.rot || 0, a } : (dflt || null); };
V13.list = (key, name)=>((V13.A(key)[name] || {}).list || []);
V13.LIGHTS = {};   // per scene: dressScene config (filled by v13_world.js)
V13.scene = function(key, opt){
  opt = opt || {};
  const cfg = Object.assign({}, V13.LIGHTS[key] || {}, opt.dress || {});
  ENGINE._nextEnv = key;
  const scene = newScene({ bg:cfg.bg || '#05070f', fog:(cfg.fog && cfg.fog[0]) || '#0a0e16' });
  const p = opt.player ? opt.player() : buildPlayerMesh(); scene.add(p); ENGINE.player = p;
  const st = V13.at(key, opt.start || 'start') || { x:0, z:0, rot:0 };
  p.position.set(st.x, 0, st.z); p.rotation.y = st.rot;
  ENGINE.cameraYaw = ENGINE.playerYaw = st.rot;
  ENGINE.interactables = []; ENGINE.npcs = ENGINE.npcs || []; ENGINE.extraSkinned = ENGINE.extraSkinned || [];
  const dr = dressScene(key, cfg);
  if(!dr) console.warn('[v13] scene not dressed', key);
  V13.rt.dr = dr; V13.rt.key = key;
  if(V13.world && V13.world.dress) V13.world.dress(key, dr);
  V13.minimap(key);
  ENGINE.sceneUpdate = dt => V13.update(dt);
  return { scene, dr, p };
};
/* plain clothes for undercover work */
V13.plainClothes = ()=>{
  if(!ART.ready) return buildPlayerMesh();
  const k = PEOPLE.make('kelechi', { gear:[], vest:null, text:null, torso:'#3e5266', armA:'#3e5266', armB:'#3e5266', armC:'#4a2b1c', hips:'#2a2622', thigh:'#2a2622', shin:'#2a2622', shoe:'#3a2a1c' });
  k.userData.isPlayer = true; return k;
};
V13.minimap = function(key){
  if(typeof setMinimap !== 'function') return;
  const m = V13.meta(key), b = (m.anchors || {}).bounds;
  const rects = (m.obstacles || []).map(o => `<rect x="${(o[0] - o[2] / 2).toFixed(2)}" y="${(o[1] - o[3] / 2).toFixed(2)}" width="${o[2]}" height="${o[3]}" fill="#3a4a66" opacity=".55"/>`).join('');
  const frame = b ? `<rect x="${b.minX}" y="${b.minZ}" width="${b.maxX - b.minX}" height="${b.maxZ - b.minZ}" fill="#0b1426" opacity=".5"/>` : '';
  setMinimap(frame + rects, []);
  if(typeof MINIMAP !== 'undefined') MINIMAP.scale = b ? Math.max(4, Math.min(8, 120 / Math.max(b.maxX - b.minX, b.maxZ - b.minZ) * 6)) : 6;
};
/* the look of a person in 3D, from the cast table (or a crowd look) */
V13.look = function(id, extra){
  const C = V13.CAST[id] || {};
  const top = C.top || '#6a6a6a', f = !!C.f;
  const o = { body:f ? 'F' : 'M', skin:C.skin || '#4a2b1c', hair:C.hair || '#0c0a09', beard:C.beard || null, torso:top, armA:top, armB:top, armC:f ? null : top,
              hips:f ? (C.wrap || top) : '#2a2a2a', thigh:f ? (C.wrap || top) : '#2a2a2a', shin:f ? null : '#2a2a2a', shoe:'#16120e', gear:[] };
  if(f){ o.skirt = C.wrap || top; o.gear.push((C.hat === 'gele' || C.hat === 'wrap') ? 'Gear_F_Gele' : C.hat === 'beret' ? 'Gear_F_Beret' : 'Gear_F_Bun'); if(C.hat === 'gele' || C.hat === 'wrap') o.gele = C.hatCol || '#d8a64a'; }
  else { if(C.hat === 'cap') o.gear.push('Gear_Fila'); if(C.hat === 'beret') o.gear.push('Gear_Beret'); if(C.glasses) o.gear.push('Gear_Glasses'); }
  if(C.hatCol){ o.cap = C.hatCol; o.beret = C.hatCol; }
  return Object.assign(o, extra || {});
};
V13.CROWD = [
  { body:'F', torso:'#c8341c', skirt:'#c8341c', gear:['Gear_F_Wrapper'], cap:'#d04a1c' }, { body:'F', torso:'#2a7a4a', skirt:'#d8a020', gear:['Gear_F_Gele'], cap:'#2a7a4a' },
  { body:'F', torso:'#7a2a6a', skirt:'#3a2a5a', gear:['Gear_F_Braids'] }, { body:'F', torso:'#e0b020', skirt:'#2a4a8a', gear:['Gear_F_Afro'] },
  { body:'M', torso:'#1a78b8', hips:'#2a2622', thigh:'#2a2622', shin:'#2a2622', gear:['Gear_Fila'], cap:'#d8a020' }, { body:'M', torso:'#e8e4da', hips:'#3a3a3a', thigh:'#3a3a3a', shin:'#3a3a3a', gear:['Gear_Kaftan'], robe:'#e8e4da' },
  { body:'M', torso:'#3a3a3a', hips:'#1e2a5a', thigh:'#1e2a5a', shin:'#1e2a5a', gear:[] }, { body:'M', torso:'#c85a18', hips:'#2a2a2a', thigh:'#2a2a2a', shin:'#2a2a2a', gear:[] },
  { body:'M', torso:'#5a6a3a', hips:'#2a2622', thigh:'#2a2622', shin:'#2a2622', gear:['Gear_Glasses'] }, { body:'F', torso:'#e8e2d4', skirt:'#1e46b0', gear:['Gear_F_Bun'] },
];
V13.crowdLook = i => {
  const L = V13.CROWD[i % V13.CROWD.length], skins = ['#3e2618', '#4a2b1c', '#5a3826', '#6a4228'];
  return Object.assign({ skin:skins[(i * 7) % skins.length], hair:'#0c0a09', armA:L.torso, armB:L.torso, armC:L.body === 'F' ? null : L.torso, shoe:'#16120e' }, L, { hips:L.hips || L.skirt, thigh:L.thigh || L.skirt, shin:L.shin || null });
};
/* a person standing (or sitting) somewhere in the scene */
V13.person = function(look, at, opt){
  opt = opt || {};
  let ch;
  if(typeof PEOPLE !== 'undefined' && PEOPLE.make && ART.ready){
    ch = PEOPLE.make(opt.kind || 'npc', typeof look === 'string' ? V13.look(look) : look);
    ch.userData.anim.play(opt.clip || 'idle', { fade:0 }); ch.userData.anim.update(Math.random() * 3);
    ENGINE.extraSkinned.push(ch);
  } else {
    ch = buildNPCMesh('#5a3826', '#6a6a6a', '#2a2a2a', '#0a0a0a', {}); ENGINE.npcs.push(ch);
  }
  ch.position.set(at.x, at.y || 0, at.z); ch.rotation.y = at.rot || 0;
  ENGINE.scene.add(ch);
  if(opt.solid !== false && typeof addObstacle === 'function') addObstacle(at.x, at.z, opt.r || 0.6, opt.r || 0.6);
  if(opt.id) ch.userData.v13id = opt.id;
  return ch;
};
V13.play = (ch, clip, opt)=>{ if(ch && ch.userData && ch.userData.anim) ch.userData.anim.play(clip, opt || {}); };
V13.once = (ch, clip, then)=>{ if(ch && ch.userData && ch.userData.anim && ch.userData.anim.oneShot) ch.userData.anim.oneShot(clip, then || 'idle'); };
V13.face = (ch, x, z)=>{ if(ch) ch.rotation.y = Math.atan2(x - ch.position.x, z - ch.position.z); };
/* interactions */
V13.talk = function(mesh, label, fn, opt){
  opt = opt || {};
  const it = { mesh, label, verb:opt.verb || 'talk', range:opt.range || 2.5, labelY:opt.labelY || 1.6, optional:!!opt.optional, onInteract:()=>fn(it) };
  ENGINE.interactables.push(it); return it;
};
V13.spot = function(pos, label, fn, opt){
  opt = opt || {};
  const a = new THREE.Object3D(); a.position.set(pos.x, pos.y != null ? pos.y : 1.0, pos.z); ENGINE.scene.add(a);
  const it = { mesh:a, label, verb:opt.verb || 'inspect', range:opt.range || 2.2, labelY:opt.labelY || 0.4, optional:!!opt.optional, onInteract:()=>fn(it) };
  ENGINE.interactables.push(it); return it;
};
V13.used = it => { if(it) it._used = true; };
V13.drop = it => { const L = ENGINE.interactables; const i = L.indexOf(it); if(i >= 0) L.splice(i, 1); };
V13.marker = (id, pos, label)=>{ if(typeof addEvidenceMarker === 'function'){ addEvidenceMarker(new THREE.Vector3(pos.x, pos.y || 1.6, pos.z), 'EVIDENCE', label, id); const m = ENGINE.evidenceMarkers.find(x => x.id === id); if(m) m.let_collected = function(){ this.collected = true; }; return m; } return null; };
V13.markerDone = id => { const m = (ENGINE.evidenceMarkers || []).find(x => x.id === id); if(m && m.let_collected) m.let_collected(); };

/* ---------- runtime (not saved) + one update for the case ---------- */
V13.rt = { tick:[] };
V13.update = function(dt){
  if(V13.world && V13.world.update) V13.world.update(dt);
  if(typeof isOverlayOpen === 'function' && isOverlayOpen()) return;
  const T = V13.rt.tick || [];
  for(let i = T.length - 1; i >= 0; i--){ try{ if(T[i](dt) === false) T.splice(i, 1); }catch(e){ console.warn('[v13] tick', e); T.splice(i, 1); } }
  if(V13.rt.chase) V13.chaseStep(dt);
  if(V13.rt.eyes) V13.eyesStep(dt);
};
V13.every = f => V13.rt.tick.push(f);
V13.after = (s, f)=>{ let t = 0; V13.every(dt => { t += dt; if(t >= s){ f(); return false; } }); };
V13.near = (obj, r)=>{ const p = ENGINE.player; if(!p || !obj) return false; const o = obj.position || obj; return Math.hypot(p.position.x - o.x, p.position.z - o.z) <= r; };
V13.dist = obj => { const p = ENGINE.player; const o = obj.position || obj; return Math.hypot(p.position.x - o.x, p.position.z - o.z); };
/* is the player looking at it (camera forward within a cone) */
V13.looking = (obj, cone)=>{
  const cam = ENGINE.camera; if(!cam) return false;
  const o = obj.position || obj; const v = new THREE.Vector3(o.x, (o.y || 0) + 1.2, o.z).sub(cam.position).normalize();
  const f = new THREE.Vector3(); cam.getWorldDirection(f);
  return f.dot(v) > Math.cos(cone || 0.45);
};

/* ---------- the street is watching (undercover / stealth) ---------- */
V13.eyes = function(cfg){
  // cfg: { label, watchers:[mesh], radius, fov, rate, decay, onMade }
  V13.rt.eyes = Object.assign({ v:0, label:'SUSPICION', radius:6, fov:1.2, rate:0.32, decay:0.12, extra:0 }, cfg);
};
V13.eyesBump = n => { const e = V13.rt.eyes; if(e){ e.v = Math.min(1, Math.max(0, e.v + n)); } };
V13.eyesStep = function(dt){
  const e = V13.rt.eyes, P = ENGINE.player; if(!e || !P || e.off) return;
  let seen = 0;
  const crouch = !!(ENGINE.keys && ENGINE.keys['KeyC']) || ENGINE.crouch;
  const sprint = !!(ENGINE.keys && (ENGINE.keys['ShiftLeft'] || ENGINE.keys['ShiftRight']));
  for(const w of e.watchers || []){
    if(!w || !w.visible) continue;
    const dx = P.position.x - w.position.x, dz = P.position.z - w.position.z, d = Math.hypot(dx, dz);
    if(d > e.radius) continue;
    const fwd = w.rotation.y, ang = Math.abs(((Math.atan2(dx, dz) - fwd + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
    if(ang > e.fov) continue;
    seen = Math.max(seen, (1 - d / e.radius) * (crouch ? 0.45 : 1) * (sprint ? 1.8 : 1));
  }
  if(e.extraFn) seen = Math.max(seen, e.extraFn() || 0);
  e.v = seen > 0 ? Math.min(1, e.v + seen * e.rate * dt) : Math.max(0, e.v - e.decay * dt);
  if(typeof setEye === 'function') setEye(e.v, seen > 0 ? 'look' : '');
  if(typeof showMeter === 'function' && e.meter !== false) showMeter('eyes', e.label, e.v, e.v > 0.66 ? 'danger' : 'info', Math.round(e.v * 100) + '%');
  if(e.v >= 1 && !e.fired){ e.fired = true; if(e.onMade) e.onMade(); }
};
V13.eyesOff = ()=>{ if(V13.rt) V13.rt.eyes = null; if(typeof hideMeter === 'function') hideMeter('eyes'); if(typeof setEye === 'function') setEye(null); };

/* ---------- a foot chase with a skinned runner ---------- */
V13.chase = function(cfg){
  const c = Object.assign({ speed:4.7, catchDist:1.5, headStart:0.9, label:'SUSPECT', seg:0 }, cfg);
  c.speed *= (typeof chaseRate === 'function' ? chaseRate() : 1);
  V13.play(c.runner, PEOPLE.clips && PEOPLE.clips.sprint ? 'sprint' : 'jog', { fade:0.1 });
  V13.rt.chase = c; if(typeof sfxAlert === 'function') sfxAlert();
  return c;
};
V13.chaseStep = function(dt){
  const c = V13.rt.chase, P = ENGINE.player; if(!c || !P) return;
  const r = c.runner;
  if(c.headStart > 0){ c.headStart -= dt; }
  let step = c.speed * dt;
  while(step > 0 && c.seg < c.path.length - 1){
    const b = c.path[c.seg + 1], dx = b[0] - r.position.x, dz = b[1] - r.position.z, d = Math.hypot(dx, dz);
    if(d <= step){ r.position.x = b[0]; r.position.z = b[1]; step -= d; c.seg++; }
    else { r.position.x += dx / d * step; r.position.z += dz / d * step; r.rotation.y = Math.atan2(dx, dz); step = 0; }
  }
  const gap = Math.hypot(r.position.x - P.position.x, r.position.z - P.position.z);
  if(typeof showMeter === 'function') showMeter('chase', c.label + ' — GAP', Math.min(1, gap / 14), gap < 4 ? 'good' : 'danger', gap.toFixed(1) + ' m');
  if(gap < c.catchDist && c.headStart <= 0){
    V13.rt.chase = null; if(typeof hideMeter === 'function') hideMeter('chase');
    if(typeof tackle === 'function'){ try{ tackle(r); }catch(e){} }
    V13.play(r, 'handsup'); if(typeof sfxComplete === 'function') sfxComplete(); toast('GOT HIM', 'Hands where I can see them!', 1600);
    if(c.onCaught) c.onCaught(c); return;
  }
  if(c.seg >= c.path.length - 1){
    V13.rt.chase = null; if(typeof hideMeter === 'function') hideMeter('chase');
    r.visible = false; toast('LOST HIM', c.label + ' is gone.', 2200); if(typeof sfxFail === 'function') sfxFail();
    if(c.onEscaped) c.onEscaped(c);
  }
};
/* an NPC walks a path (a scripted move, not a chase) */
V13.walk = function(ch, path, opt){
  opt = opt || {}; const speed = opt.speed || 1.4; let seg = 0;
  V13.play(ch, opt.clip || 'walk');
  return new Promise(res => V13.every(dt => {
    let step = speed * dt;
    while(step > 0 && seg < path.length){
      const b = path[seg], dx = b[0] - ch.position.x, dz = b[1] - ch.position.z, d = Math.hypot(dx, dz);
      if(d <= step){ ch.position.x = b[0]; ch.position.z = b[1]; step -= d; seg++; }
      else { ch.position.x += dx / d * step; ch.position.z += dz / d * step; ch.rotation.y = Math.atan2(dx, dz); step = 0; }
    }
    if(seg >= path.length){ V13.play(ch, opt.end || 'idle'); if(opt.face != null) ch.rotation.y = opt.face; res(); return false; }
  }));
};

/* ---------- time passes ---------- */
V13.skip = function(lines, then, ms){
  ENGINE.movementEnabled = false; showHUD(false);
  titleCard(lines, ms || 2400, ()=>{ ENGINE.movementEnabled = true; showHUD(true); if(then) then(); });
};

/* ---------- the case framework ---------- */
V13.CASES = {};
V13.defCase = (id, def)=>{ V13.CASES[id] = def; };
V13.wrap('loadMission', orig => function(id){
  V13._pz = null;                                                // a pause held over the last scene is gone
  const C = V13.CASES[id];
  if(!C) return orig.apply(this, arguments);
  try{ V13.s1snapTake(); }catch(e){ console.warn('[v13] s1 snapshot', e); }   // Season 1 as it stood when Season 2 began
  if(V13.hubBefore && V13.hubBefore(id)) return;                 // the office comes first
  S.game.currentMission = id; S.game.alertLevel = 0;
  V13.s2().started = V13.s2().started || Date.now();
  if(C.reset) try{ C.reset(); }catch(e){ console.warn('[v13] reset', e); }
  showHUD(false); ENGINE.movementEnabled = false; showOverlay(null);
  if(typeof showStartMission === 'function') showStartMission(id); else beginMission(id);
});
V13.wrap('beginMissionCore', orig => function(id){
  const C = V13.CASES[id];
  if(!C) return orig.apply(this, arguments);
  S.game._opEv = [];
  S.game._opStart = { arrests:S.game.arrests || 0, civ:S.game.civiliansRescued || 0, force:S.game.forceUsed || 0, intel:S.game.intelScore || 0, xp:S.player.xp || 0, rep:Object.assign({}, S.player.reputation) };
  S.game._opBumps = 0;
  if(typeof fadeIn === 'function') fadeIn();
  if(typeof resetGuidance === 'function') resetGuidance();
  S.game.currentMission = id; S.game.flags = S.game.flags || {};
  showOverlay(null); showHUD(true); ENGINE.movementEnabled = true;
  V13.rt = { tick:[], id };
  V13.eyesOff(); if(typeof hideMeter === 'function') hideMeter('chase');
  setMissionTitle(C.title || (V13.CARD(id) || {}).name || id);
  setObjectives(C.objectives ? C.objectives() : []);
  setEvidenceMax(C.evMax || 0);
  V13.portraits();
  try{ C.build(); }catch(e){ console.error('[v13] build', id, e); }
  if(typeof startAmbient === 'function') startAmbient(C.ambient || 'market');
  musicForScene(id);
  S.game.currentRegion = C.region || 'Season 2'; S.game.currentSubregion = C.sub || ''; refreshHUD();
  if(ENGINE.player){ ENGINE.cameraYaw = ENGINE.player.rotation.y; ENGINE.playerYaw = ENGINE.player.rotation.y; }
  // (mission_start is logged once, by v12's beginMission wrap, for cases and offices alike)
  // The opening beat waits 700 ms. A QUIT or LOAD inside that window replaces the run (V13.rt) and the mission,
  // and then the beat belongs to a case that is no longer on screen: it must not play over the title or the loaded game.
  if(C.start){ const rt = V13.rt; setTimeout(()=>{
    if(V13.rt !== rt || S.game.currentMission !== id) return;
    try{ C.start(); }catch(e){ console.error('[v13] start', id, e); } }, 700); }
});
/* end of a case: XP, the aftermath screen */
V13.finish = function(id, xp){
  if(!S.game.completedMissions.includes(id)) S.game.completedMissions.push(id);
  V13.eyesOff(); V13.rt.chase = null;
  const C = V13.CASES[id] || {};
  S.game._opXP = xp || C.xp || 300; awardXP(S.game._opXP);
  if(typeof sfxComplete === 'function') sfxComplete();
  if(typeof stopAmbient === 'function') stopAmbient();
  // (mission_end is logged once, with the grade, by v12's showAftermath wrap)
  showAftermath();
};

/* ---------- aftermath: the Season 2 papers, tips and what comes next ---------- */
V13.wrap('generateHeadline', orig => function(){
  const A = V13.AFTER && V13.AFTER[S.game.currentMission];
  if(A && typeof A.headline === 'function'){ try{ const h = A.headline(S); if(h && h.head) return h; }catch(e){ console.warn('[v13] headline', e); } }
  return orig.apply(this, arguments);
});
V13.wrap('nextMissionPreview', orig => function(){
  const cur = S.game.currentMission, A = V13.AFTER && V13.AFTER[cur];
  if(V13.isS2(cur) && A && A.next){
    const hub = V13.HUB_AFTER && V13.HUB_AFTER[cur];
    const nx = String(A.next).replace(/^\s*Next\s*[—:-]\s*/i, '');
    if(cur === 'm15') return nx;
    const pre = hub && V13.HUBS && V13.HUBS[hub] ? `Next — <b>${V13.HUBS[hub].where}</b>, then: ` : 'Next — ';
    return pre + nx;
  }
  // M8: Season 1's own line (with The Case File's "to the trial, then the epilogue"), and Season 2 is next, not coming
  if(cur === 'm8') return String(orig.apply(this, arguments)).replace(/<span[^>]*>\s*SEASON 2 — COMING\s*<\/span>/, '<b>Season 2</b> next.');
  return orig.apply(this, arguments);
});
/* the base aftermath ends with its teaser line for the Season 1 build's four Season 2 cards: not true with this layer */
V13.wrap('showAftermath', orig => function(){
  const r = orig.apply(this, arguments);
  try{ document.querySelectorAll('#aftermath-grid .cw-next-sub').forEach(e => { if(/Season 2 \(missions/.test(e.textContent)) e.remove(); }); }catch(e){}
  return r;
});
setTimeout(()=>{ if(V13.AFTER && typeof SAFETY_TIPS !== 'undefined') for(const k in V13.AFTER) if(V13.AFTER[k].tip && !SAFETY_TIPS[k]) SAFETY_TIPS[k] = V13.AFTER[k].tip; }, 0);
/* the aftermath's continue button: Season 2 goes to the office, then the next case */
const cont = document.getElementById('btn-aftermath-continue');
if(cont) cont.addEventListener('click', e => {
  const cur = S.game.currentMission;
  if(!V13.isS2(cur) || !(S.game.completedMissions || []).includes(cur)) return;
  e.stopImmediatePropagation();
  showOverlay(null); showHUD(false);
  if(cur === 'm15'){ if(V13.startEpilogueS2) V13.startEpilogueS2(); return; }
  const i = V13.S2_IDS.indexOf(cur), nx = V13.S2_IDS[i + 1];
  if(nx) loadMission(nx);
}, true);

/* ---------- Season 1 → Season 2: the stinger card opens the next season ---------- */
V13.wrap('advanceEpilogue', orig => function(){
  if(typeof EPI !== 'undefined' && EPI.slides && EPI.i >= EPI.slides.length - 1 && !V13._s2Epi && S.game.seasonOneComplete && !V13.s2().started){
    showOverlay(null);
    if(typeof saveGame === 'function') saveGame(true);
    // the slide before this one is Season 1's own SEASON 2 card. Season 1's award comes as its own last slide gives
    // it (systems/finale.js advanceEpilogue: with the title), so after the case review: here, with the next title card
    const go = ()=>{
      if(typeof unlock === 'function') try{ unlock('season_one'); }catch(e){}
      titleCard(['OPERATION UPSTREAM', 'Six weeks later'], 3200, ()=>loadMission('m9'));
    };
    if(V13.reviewThenS2) V13.reviewThenS2(go); else go();      // The Case File's case review comes first
    return;
  }
  return orig.apply(this, arguments);
});

/* ---------- a choice that carries a flag but no effect still sets its flag (in Season 2 only) ----------
   Season 1's flag-only choices (the cold open's plate question) keep Season 1's behaviour: nothing is set. */
const inS2 = ()=>{ const cur = S.game && S.game.currentMission; return V13.isS2(cur) || !!(V13.HUBS && V13.HUBS[cur]) || !!(V13.court && V13.court.active); };
V13.inS2 = inS2;
V13.wrap('applyEffect', orig => function(eff, flag){
  if(!eff && flag && inS2()) return orig.call(this, {}, flag);
  return orig.apply(this, arguments);
});

/* ---------- the pause menu over a conversation or a document (Season 2 only) ----------
   Season 2 holds movement off through long conversations (Court 5) and documents. The base pause hides every
   overlay and its RESUME shows none, so the scene would wait for a callback that can't come. While the pause is
   open over one of the base overlays below, it is remembered with the HUD's state; RESUME (not LOAD) puts both back.
   Season 2's own screens are v13Modal's (v13_intel.js) and are left to it. */
const PAUSE_UNDER = ['screen-dialogue', 'screen-puzzle', 'screen-minigame', 'screen-phone'];
const shownOv = id => { const e = document.getElementById(id); return !!(e && e.classList.contains('show')); };
const modalHolds = id => { try{ return typeof V13NAV !== 'undefined' && !!V13NAV.modals && V13NAV.modals.some(m => m.id === id); }catch(e){ return false; } };
const hudHidden = ()=>{ const h = document.getElementById('hud'); return !!(h && h.style.display === 'none'); };
V13._pz = null;
// true while `id` is shown, or held under the pause menu by this wrap (a document watcher must not read that as closed)
V13.underPause = id => !!(V13._pz && V13._pz.ov === id && shownOv('screen-pause'));
V13.ovShown = id => shownOv(id) || V13.underPause(id);
V13.wrap('togglePause', orig => function(){
  const ev = window.event;
  if(!shownOv('screen-pause')){
    let rem = null;
    try{
      if(inS2()){
        const ov = PAUSE_UNDER.find(id => shownOv(id));
        if(ov && !modalHolds(ov)) rem = { ov, hudHidden:hudHidden() };
      }
    }catch(e){}
    const r = orig.apply(this, arguments);
    V13._pz = (rem && shownOv('screen-pause')) ? rem : null;
    return r;
  }
  const rem = V13._pz; V13._pz = null;
  const viaLoad = !!(ev && ev.type === 'click' && ev.target && ev.target.closest && ev.target.closest('#btn-load'));
  const r = orig.apply(this, arguments);
  if(rem && !viaLoad && !shownOv('screen-pause')){
    try{ showOverlay(rem.ov); showHUD(!rem.hudHidden); }catch(e){ console.warn('[v13] resume', e); }
  }
  return r;
});
// QUIT and ERASE drop what the pause holds. LOAD does not: a load that finds no save ("NO SAVE") leaves the pause up,
// and RESUME must still bring the conversation back; a load that works reaches togglePause from the #btn-load click
// (viaLoad above: nothing is put back) and then loadMission, which clears the hold too.
// They also end the run: a case's delayed opening beat (beginMissionCore, 700 ms) and its tick functions belong to the
// run that was quit, never to the title screen; any way back into play rebuilds V13.rt in beginMissionCore.
document.addEventListener('click', e => { try{ if(e.target && e.target.closest && e.target.closest('#btn-quit, #btn-erase')){ V13._pz = null; V13.rt = { tick:[] }; } }catch(err){} }, true);

/* ---------- which choice was picked (for choices that carry no flag) ----------
   V13.picked('m10_karo_source') → index of the choice taken the last time that
   conversation offered one (null if none). A choice may also carry onPick(). */
V13._picks = {};
V13.picked = key => (V13._picks[key] != null ? V13._picks[key] : null);
(function(){
  const wrap = document.getElementById('dlg-choices'); if(!wrap) return;
  wrap.addEventListener('click', e => {
    const b = e.target.closest('.dialogue-choice'); if(!b || typeof DLG === 'undefined' || !DLG.script) return;
    const line = DLG.script[DLG.idx]; if(!line || !line.choices) return;
    const shown = line.choices.filter(c => !(c.requires && !S.player.skills.includes(c.requires)));
    const c = shown[[...wrap.querySelectorAll('.dialogue-choice')].indexOf(b)]; if(!c) return;
    if(c.flag && !b.dataset.armed) return;                       // the first tap only arms a decision
    const key = V13.dlgKey();
    V13._picks[key] = line.choices.indexOf(c); V13.lastPick = { key, i:V13._picks[key], c };
    if(typeof c.onPick === 'function'){ try{ c.onPick(); }catch(err){ console.warn('[v13] onPick', err); } }
  }, true);
})();

/* ---------- a companion who keeps up (Uche in the field) ----------
   returns a handle: h.on = false stops following; h.hold(true) parks them */
V13.follow = function(ch, opt){
  opt = Object.assign({ dist:2.1, speed:2.6, run:5.4, far:16 }, opt || {});
  const h = { on:true, held:false, hold(v){ this.held = !!v; } };
  let mode = null;
  V13.every(dt => {
    if(!h.on || !ch || !ch.parent) return false;
    const P = ENGINE.player; if(!P) return;
    if(h.held){ if(mode){ mode = null; V13.play(ch, 'idle'); } return; }
    const dx = P.position.x - ch.position.x, dz = P.position.z - ch.position.z, d = Math.hypot(dx, dz);
    if(d > opt.far){                                              // left behind: catch up out of sight
      ch.position.x = P.position.x - Math.sin(P.rotation.y) * opt.dist; ch.position.z = P.position.z - Math.cos(P.rotation.y) * opt.dist;
      return;
    }
    if(d > opt.dist + 0.5){
      const run = d > 6, sp = run ? opt.run : opt.speed, step = Math.min(d - opt.dist, sp * dt);
      ch.position.x += dx / d * step; ch.position.z += dz / d * step; ch.rotation.y = Math.atan2(dx, dz);
      const want = run ? 'jog' : 'walk'; if(mode !== want){ mode = want; V13.play(ch, want, { fade:0.2 }); }
    } else if(mode){ mode = null; V13.play(ch, 'idle', { fade:0.25 }); }
  });
  return h;
};

/* ---------- small things ---------- */
V13.money = n => '₦' + Math.round(n).toLocaleString('en-NG');
V13.once_ = {};
V13.first = k => { const s = V13.s2().seen; if(s[k]) return false; s[k] = 1; return true; };
})();
