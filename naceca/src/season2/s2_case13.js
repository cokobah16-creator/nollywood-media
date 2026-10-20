/* =========================================================================
   NACECA · v13 Case 13 — The Ninth Floor (NACECA Headquarters, Abuja, 09:50)
   Reception: Mr. Kuti takes Kelechi's phone and tells him to sit. When a
   call takes Kuti into the records room, the exhibit 14 docket on his desk
   can be read — for as long as the call lasts (a meter, Kuti's voice through
   the door, then his footsteps). Caught at the desk, Kuti goes cold. Then the
   double doors open and the Director-General talks: warm, cultured, and he
   knows everything. With the pen in Kelechi's pocket a RECORDING meter fills
   as he talks (Season 1's call-trace numbers, relabelled and clamped). He
   offers a Superintendent's badge for the Upstream file: accept and collect
   the letter, or refuse and leave your ID card on Kuti's desk. Downstairs,
   Uche.
   ========================================================================= */
(function(){
'use strict';
const V13 = window.V13, MC = V13.mc;
const KEY = 'abuja_office', PI = Math.PI;
const V3 = (x, y, z)=>new THREE.Vector3(x, y, z);
const RT = ()=>V13.rt;
const A = n => V13.at(KEY, n);
const KUTI = 'MR. KUTI', DG = 'DIRECTOR-GENERAL FASHINA', KEL = 'AGENT KELECHI';
const kel = (text, o)=>Object.assign({ speaker:KEL, portrait:'kelechi', text }, o || {});
/* casework mode and the countdown rate (V13.rec / V13.timeRate from s2_core.js when present, else the same rule) */
const rec = ()=>typeof V13.rec === 'function' ? !!V13.rec() : (typeof isRecruit === 'function' && isRecruit());
const rate = ()=>{ const r = typeof V13.timeRate === 'function' ? V13.timeRate() : (typeof timerRate === 'function' ? timerRate() : 1); return (typeof r === 'number' && isFinite(r) && r >= 0) ? r : 1; };
const ico = n => typeof icon === 'function' ? icon(n) : '';
/* what a replay clears (as Case 12 does): this case's flag, its exhibits, its documents' attempts */
const FLAGS = ['s2_ninth'];
const EVIDS = ['transfer_docket', 'dg_recording'];
const DOCKEYS = ['m13_docket', 'm13_docket_kept'];

/* ---------- the few lines the staging needs (gaps only; the case's dialogue is v13_dlg_c.js) ---------- */
Object.assign(DIALOGUE, {
  // Kuti back from his call, and Kelechi where he left him
  m13_x_ready:[ { speaker:KUTI, mood:'evasive', text:"Your water, Agent. He won't be long now. He never is, once he has decided." } ],
  // the double doors
  m13_x_doors:[ { speaker:KUTI, text:"The Director-General will see you now. Mind the carpet. It's new." } ],
  // the safe, while the DG is still at the window
  m13_x_safe_read:[ kel("(The safe. If that docket is true, Osas's drive is in there — eight metres from his chair.)"),
    { speaker:DG, text:"Older than you, Agent. Nobody has ever opened it but me. Come and sit." } ],
  m13_x_safe:[ kel("(An old safe in a new office. Whatever this floor keeps, it keeps in there.)"),
    { speaker:DG, text:"Older than you, Agent. Nobody has ever opened it but me. Come and sit." } ],
  // on the way out
  m13_x_card:[ { speaker:KUTI, text:"Received: one identity card, NACECA. Signed: A.K. And your phone, Agent — quite safe, as I promised." } ],
  m13_x_letter:[ { speaker:KUTI, mood:'evasive', text:"Congratulations, Superintendent. Your phone. I've taken the liberty of copying your notes for the file — to save you the trouble." } ],
});
/* Kuti's call, heard through the records-room door */
const HEARD = {
  answer:"Office of the Director-General… Yes, sir. One moment, sir — I'll take it inside.",
  a:"…landed at seven, sir. Seven-forty, by my own hand. Yes, sir — where you said.",
  a_kept:"…no, sir. Benin kept it. A retention order. Yes, sir — the posting order only wants your signature.",
  b:"…No, sir. Nobody has the combination but you.",
  b_kept:"…Maiduguri, sir. With immediate effect. She'll have three days.",
  end:"Very good, sir. I'll bring him in now.",
  door:"Agent. The sofa, please.",
  sit:"The sofa, Agent. He'll call you.",
};

/* ---------- look ---------- */
function suit(){
  if(!(typeof ART !== 'undefined' && ART.ready && typeof PEOPLE !== 'undefined')) return buildPlayerMesh();
  const c = '#1c2433';
  const k = PEOPLE.make('kelechi', { gear:[], vest:null, text:null, torso:c, armA:c, armB:c, armC:c, hips:c, thigh:c, shin:c, shoe:'#0e0e10' });
  k.userData.isPlayer = true; return k;
}

/* ---------- shared hooks (the same block is in v13_case13b.js; whichever loads first installs it) ----------
   V13.rt.seat      the player sits: held there until a move key or the stick stands him up (seat.release)
   V13.rt.onLine    called with each dialogue line as it renders (cameras and staging cue off the text)
   V13.rt.onChoices called when a line's choices appear
   V13.rt.rec       the Season 1 call-trace meter becomes the RECORDING meter (clamped 0..100)            */
if(!V13._c13hooks){
  V13._c13hooks = true;
  V13.wrap('updatePlayer', orig => function(dt){
    const R = V13.rt, s = R && R.seat, P = ENGINE.player;
    if(s && P && P.userData && P.userData._skinned && !ENGINE.seq){
      const k = ENGINE.keys || {}, t = ENGINE._touch;
      const want = !!(k.KeyW || k.KeyA || k.KeyS || k.KeyD || k.ArrowUp || k.ArrowDown || k.ArrowLeft || k.ArrowRight || (t && Math.hypot(t.x || 0, t.y || 0) > 0.3));
      if(!want || s.locked || !s.release){
        P.position.x = s.x; P.position.z = s.z; P.rotation.y = s.rot; ENGINE.playerYaw = s.rot; P.userData._speed = 0;
        const a = P.userData.anim; if(a && a.curName !== (s.clip || 'sit')) a.play(s.clip || 'sit', { fade:0.3 });
        return;
      }
      s.release();
    }
    return orig.apply(this, arguments);
  });
  V13.wrap('renderDialogueLine', orig => function(){
    try{ const R = V13.rt; if(R && R.onLine && typeof DLG !== 'undefined' && DLG.script){ const l = DLG.script[DLG.idx]; if(l) R.onLine(l); } }catch(e){ console.warn('[v13] onLine', e); }
    return orig.apply(this, arguments);
  });
  V13.wrap('renderChoices', orig => function(){
    const r = orig.apply(this, arguments);
    try{ const R = V13.rt; if(R && R.onChoices) R.onChoices(); }catch(e){ console.warn('[v13] onChoices', e); }
    return r;
  });
  V13.wrap('showMeter', orig => function(id, label, frac, tone, txt){
    const R = V13.rt;
    if(id === 'trace' && R && R.rec){
      // Season 1 adds line and choice traces to S.game._finTrace, capped at 100 but never floored: clamp it here
      const v = Math.max(0, Math.min(100, Math.round(S.game._finTrace || 0)));
      S.game._finTrace = v;
      const q = V13.C && V13.C.recordingQuality ? V13.C.recordingQuality(v) : (v >= 100 ? 'good' : v >= 60 ? 'contested' : 'weak');
      return orig.call(this, 'trace', 'RECORDING', v / 100, q === 'good' ? 'good' : q === 'contested' ? 'info' : 'danger', v + '%');
    }
    return orig.apply(this, arguments);
  });
}
/* flag-only choices (a flag, no effect) reach applyEffect(undefined, flag), which returns before it stores the flag
   (engine bug — the shared fix is in the hand-in). Every s2_bitrus choice is flag-only, and so is the wire offer in the
   hub before Case 13 (s2_wire: without it the hub's exit waits for an answer it never records). Scoped to those two
   flags. The same block is in v13_case13b.js; whichever loads first installs it. */
if(typeof window.applyEffect === 'function' && !V13._c13flag){
  V13._c13flag = true;
  V13.wrap('applyEffect', orig => function(eff, flag){
    if(!eff && flag && typeof flag === 'object' && ('s2_wire' in flag || 's2_bitrus' in flag)) eff = {};
    return orig.call(this, eff, flag);
  });
}
/* every new scene clears the HUD meters: the lifted RECORDING meter goes with them (quitting mid-meeting included) */
if(!V13._c13meters){
  V13._c13meters = true;
  V13.wrap('clearMeters', orig => function(){
    const host = document.getElementById('c13-rec-host'); if(host){ host.innerHTML = ''; host.style.display = 'none'; }
    return orig.apply(this, arguments);
  });
}

/* ---------- styles: the overheard caption, the docket chip, the car-park card, the recording meter up top ---------- */
function css(){
  if(document.getElementById('c13-css')) return;
  const s = document.createElement('style'); s.id = 'c13-css';
  s.textContent = `
#c13-over{position:absolute;left:50%;top:calc(96px + env(safe-area-inset-top,0px));transform:translate(-50%,-6px);width:min(92vw,500px);box-sizing:border-box;padding:8px 14px 9px;
  background:var(--hud-panel,rgba(28,28,26,.94));border:1px solid var(--rule-ink,rgba(233,220,192,.24));border-left:3px solid var(--manila,#E9DCC0);border-radius:2px;opacity:0;transition:opacity .25s,transform .25s;pointer-events:none;z-index:40}
#c13-over.show{opacity:1;transform:translate(-50%,0)}
#c13-over .w{font-family:var(--font-head,'Oswald','Arial Narrow',sans-serif);font-size:10.5px;letter-spacing:.22em;color:var(--manila,#E9DCC0)}
#c13-over .t{font-family:'Inter',sans-serif;font-size:14px;line-height:1.4;color:var(--manila,#E9DCC0);font-style:italic;margin-top:2px}
.touch-active #c13-over{top:calc(150px + env(safe-area-inset-top,0px))}
body.reduce-motion #c13-over{transition:none}
.c13-row{display:flex;flex-wrap:wrap;flex:0 0 auto;margin:0 0 10px}
.c13-chip{display:inline-flex;align-items:center;gap:6px;flex:0 0 auto;box-sizing:border-box;font-family:var(--font-mono,'JetBrains Mono',monospace);font-size:10px;letter-spacing:.14em;line-height:1.3;
  color:var(--ink,#1C1C1A);background:var(--manila,#E9DCC0);border:1px solid var(--ink,#1C1C1A);border-radius:var(--radius,3px);padding:4px 8px;white-space:nowrap}
.c13-chip.hot{border:2px solid var(--red,#B3261E);padding:3px 7px}
.c13-chip .ico{width:12px;height:12px;flex:0 0 12px}
@media (max-width:420px){ .c13-chip{flex:1 0 100%;justify-content:center} }
#c13-inter{position:absolute;inset:0;z-index:85;display:flex;align-items:flex-start;justify-content:center;pointer-events:none;opacity:0;transition:opacity .6s ease;background:var(--ink,#1C1C1A)}
#c13-inter.show{opacity:1}
#c13-inter .k{margin-top:15vh;padding:0 24px;font-family:var(--font-head,'Oswald','Arial Narrow',sans-serif);font-size:20px;letter-spacing:.3em;line-height:1.6;color:var(--manila,#E9DCC0);text-align:center}
#c13-inter .k small{display:block;font-size:12px;letter-spacing:.34em;color:var(--manila-2,#A89F8A)}
body.reduce-motion #c13-inter{transition:none}
#c13-rec-host{position:absolute;left:50%;top:calc(92px + env(safe-area-inset-top,0px));transform:translateX(-50%);width:min(340px,38vw);z-index:95;pointer-events:none}
.touch-active #c13-rec-host{left:calc(12px + env(safe-area-inset-left,0px));top:calc(8px + env(safe-area-inset-top,0px));transform:none;width:min(230px,40vw)}
@media(max-height:480px){ #c13-inter .k{margin-top:8vh;font-size:15px} }`;
  document.head.appendChild(s);
}
function overhear(who, text, ms){
  let el = document.getElementById('c13-over');
  if(!el){ el = V13.el('div', '', '<div class="w"></div><div class="t"></div>'); el.id = 'c13-over'; (document.getElementById('hud') || document.getElementById('game-root')).appendChild(el); }
  el.querySelector('.w').textContent = who;
  el.querySelector('.t').textContent = text;
  el.classList.add('show');
  clearTimeout(overhear._t); overhear._t = setTimeout(()=>el.classList.remove('show'), ms || Math.max(2800, text.length * 60));
}
/* the RECORDING meter rides above the conversation (on a phone the dialogue box fills the screen): the meter
   element showMeter made is moved into a host over the overlay; showMeter keeps updating it by id */
function liftMeter(on){
  let host = document.getElementById('c13-rec-host');
  if(!on){ if(host){ host.innerHTML = ''; host.style.display = 'none'; } return; }
  if(!host){ host = V13.el('div', '', ''); host.id = 'c13-rec-host'; document.getElementById('game-root').appendChild(host); }
  host.style.display = '';
  const m = document.getElementById('meter-trace'); if(m && m.parentNode !== host) host.appendChild(m);
}
function interlude(lines){
  let el = document.getElementById('c13-inter');
  if(!lines){ if(el) el.classList.remove('show'); return; }
  if(!el){ el = V13.el('div', '', '<div class="k"></div>'); el.id = 'c13-inter'; document.getElementById('game-root').appendChild(el); }
  el.querySelector('.k').innerHTML = lines;
  el.classList.add('show');
}

/* ---------- small sounds: a desk phone, the heavy doors ---------- */
function tone(freqs, dur, gain, type){
  if(typeof AUDIO === 'undefined' || !AUDIO.enabled) return;
  try{
    ensureAudio(); const ctx = AUDIO.ctx, t = ctx.currentTime;
    for(const f of freqs){
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type || 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + 0.02); g.gain.setValueAtTime(gain, t + dur - 0.05); g.gain.linearRampToValueAtTime(0, t + dur);
      o.connect(g); g.connect(AUDIO.sfxGain); o.start(t); o.stop(t + dur + 0.02);
    }
  }catch(e){}
}
function ring(n){ let k = 0; const once = ()=>{ tone([400, 450], 0.38, 0.05); setTimeout(()=>tone([400, 450], 0.38, 0.05), 560); if(++k < (n || 2)) setTimeout(once, 2600); }; once(); }
function thunk(){
  if(typeof AUDIO === 'undefined' || !AUDIO.enabled) return;
  try{
    ensureAudio(); const ctx = AUDIO.ctx, t = ctx.currentTime;
    const b = ctx.createBuffer(1, 4096, ctx.sampleRate), d = b.getChannelData(0);
    for(let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
    const s = ctx.createBufferSource(); s.buffer = b; const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 220;
    const g = ctx.createGain(); g.gain.value = 0.5; s.connect(f); f.connect(g); g.connect(AUDIO.sfxGain); s.start(t);
  }catch(e){}
}

/* ---------- people move (our own mover: it keeps going under dialogue and the docket screen) ---------- */
const turnTo = (a, b, k)=>{ let d = b - a; while(d > PI) d -= 2 * PI; while(d < -PI) d += 2 * PI; return a + d * Math.min(1, k); };
function walk(ch, pts, opt){
  opt = opt || {};
  const R = RT(); R.movers = (R.movers || []).filter(m => m.ch !== ch);
  return new Promise(res => {
    R.movers.push({ ch, pts:pts.map(p => ({ x:p[0], z:p[1] })), i:0, speed:opt.speed || 1.35, end:opt.end || 'idle', face:opt.face, res });
    V13.play(ch, 'walk', { fade:0.25 });
  });
}
function faceTo(ch, rot){ const R = RT(); R.turns = (R.turns || []).filter(t => t.ch !== ch); R.turns.push({ ch, rot }); }
function moveStep(dt){
  const R = RT(), L = R.movers || [];
  for(let k = L.length - 1; k >= 0; k--){
    const m = L[k], ch = m.ch;
    let step = m.speed * dt;
    while(step > 0 && m.i < m.pts.length){
      const b = m.pts[m.i], dx = b.x - ch.position.x, dz = b.z - ch.position.z, d = Math.hypot(dx, dz);
      if(d <= step){ ch.position.x = b.x; ch.position.z = b.z; step -= d; m.i++; }
      else { ch.position.x += dx / d * step; ch.position.z += dz / d * step; step = 0; m.want = Math.atan2(dx, dz); }
    }
    if(m.want != null) ch.rotation.y = turnTo(ch.rotation.y, m.want, dt * 9);
    if(m.i >= m.pts.length){ L.splice(k, 1); if(m.face != null) faceTo(ch, m.face); V13.play(ch, m.end, { fade:0.3 }); m.res(); }
  }
  const T = R.turns || [];
  for(let k = T.length - 1; k >= 0; k--){
    const t = T[k]; t.ch.rotation.y = turnTo(t.ch.rotation.y, t.rot, dt * 7);
    if(Math.abs(turnTo(t.ch.rotation.y, t.rot, 1) - t.ch.rotation.y) < 0.01){ t.ch.rotation.y = t.rot; T.splice(k, 1); }
  }
}
const stop = ch => { const R = RT(); R.movers = (R.movers || []).filter(m => m.ch !== ch); };
const alive = R => RT() === R && R.id === 'm13';
/* a mid-case objective goes ahead of the one it interrupts, so the HUD shows it as the task in hand */
function objAdd(id, text, before){
  V13.obj(id, text);
  const L = S.game.objectives || [], i = L.findIndex(o => o.id === id), j = L.findIndex(o => o.id === before);
  if(j >= 0 && i > j){ L.splice(j, 0, L.splice(i, 1)[0]); if(typeof renderObjectives === 'function') renderObjectives(); }
}
const later = (R, ms, f)=>setTimeout(()=>{ if(alive(R)) f(); }, ms);

/* ---------- the camera ---------- */
const SH = {
  intro:[[5.6, 2.35, 9.4], [-2.6, 0.95, 4.2]],
  wide:[[4.4, 2.35, -2.9], [-0.7, 0.95, -8.6]],
  ots:[[0.78, 1.45, -4.85], [-0.16, 1.12, -9.1]],
  dg:[[-0.26, 1.3, -7.55], [0.03, 1.2, -9.1]],
  kel:[[0.42, 1.3, -7.75], [0.0, 1.06, -6.4]],
  rev:[[-0.55, 1.75, -10.0], [0.08, 1.0, -6.3]],
  hand:[[2.4, 1.62, -5.0], [0.35, 1.12, -6.9]],
  board:[[0.4, 1.3, -6.75], [0.0, 0.95, -8.35]],
  doors:[[2.6, 1.75, 6.6], [-0.3, 1.25, 1.7]],
};
function shot(name, cut){
  const s = SH[name]; if(!s) return;
  const R = RT(); if(R.shotName === name && !cut) return; R.shotName = name;
  TPCAM.override = { pos:V3(...s[0]), look:V3(...s[1]) };
  if(cut) TPCAM.cur = null;
}
/* two people in reception: the camera off to the side of the line between them, always on the reception floor */
function twoShot(a, b){
  const ax = a.position.x, az = a.position.z, bx = b.position.x, bz = b.position.z;
  const mx = (ax + bx) / 2, mz = (az + bz) / 2; let dx = bx - ax, dz = bz - az; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
  const inRoom = (x, z)=>x > -6.5 && x < 6.2 && z > 2.4 && z < 9.5;
  let c = null;
  for(let dist = Math.min(6.5, 1.7 + L * 0.75); dist >= 1.4 && !c; dist -= 0.4){
    const c1 = [mx - dz * dist, mz + dx * dist], c2 = [mx + dz * dist, mz - dx * dist];
    const ok1 = inRoom(...c1), ok2 = inRoom(...c2);
    if(ok1 || ok2) c = ok1 && (!ok2 || c1[1] >= c2[1]) ? c1 : c2;
  }
  if(!c) c = [Math.max(-5, Math.min(4.5, mx)), 9.2];
  RT().shotName = 'two';
  TPCAM.override = { pos:V3(c[0], 1.62, c[1]), look:V3(mx, 1.3, mz) }; TPCAM.cur = null;
}
function freeCam(){
  const R = RT(); R.shotName = null; TPCAM.override = null; TPCAM.cur = null;
  if(ENGINE.player) ENGINE.cameraYaw = (R.seat && R.seat.camYaw != null) ? R.seat.camYaw : ENGINE.player.rotation.y;
}

/* ---------- sitting ---------- */
function seat(at, opt){
  opt = opt || {};
  const P = ENGINE.player, R = RT(); if(!P) return;
  R.seat = { x:at.x, z:at.z, rot:at.rot, clip:'sit', locked:!!opt.locked, release:opt.release || null, camYaw:opt.camYaw };
  P.position.set(at.x, 0, at.z); P.rotation.y = at.rot; ENGINE.playerYaw = at.rot;
  // the sofa backs onto a wall: look at him from the room, three-quarters on
  ENGINE.cameraYaw = opt.camYaw != null ? opt.camYaw : at.rot;
  if(TPCAM) TPCAM.cur = null;
  V13.play(P, 'sit', { fade:0.35 });
}
function unseat(to){
  const P = ENGINE.player, R = RT(); if(!R.seat) return;
  R.seat = null;
  if(P && to){ P.position.x = to[0]; P.position.z = to[1]; }
  if(P) V13.play(P, 'idle', { fade:0.3 });
}
/* a staged touch (the engine's own: step to a spot, face it, play the clip, the payoff at the contact frame) */
function touch(spot, face, target, onHit, done, dur){
  const R = RT(); if(R.seat && !R.seat.locked && R.seat.release) R.seat.release();
  if(typeof playInteraction !== 'function' || !ENGINE.player || !ENGINE.player.userData._skinned){ if(onHit) onHit(); if(done) done(); return; }
  playInteraction({ spot, face, target, clip:'interact', dur:dur || 1.15, hitAt:0.5, moveTime:0.35, onHit, done });
}

/* ---------- props: a draughts game half played, a highlife record turning, an envelope dated yesterday ---------- */
function props(){
  const sc = ENGINE.scene, R = RT();
  // the board: ten by ten, between his chair and yours
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#3a2210'; x.fillRect(0, 0, 256, 256);
  for(let r = 0; r < 10; r++) for(let q = 0; q < 10; q++){ x.fillStyle = (r + q) % 2 ? '#4a2a14' : '#d8c49a'; x.fillRect(8 + q * 24, 8 + r * 24, 24, 24); }
  x.strokeStyle = '#c8a040'; x.lineWidth = 2; x.strokeRect(7, 7, 242, 242);
  const tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding;
  const B = R.board = new THREE.Group(); B.position.set(0, 0.812, -8.02); sc.add(B);
  const edge = new THREE.MeshStandardMaterial({ color:'#3a2210', roughness:0.6 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.018, 0.4), [edge, edge, new THREE.MeshStandardMaterial({ map:tex, roughness:0.55 }), edge, edge, edge]);
  base.position.y = 0.009; B.add(base);
  const sq = 0.0375, at = (r, q)=>[-0.16875 + q * sq, -0.16875 + r * sq];          // row 0 is his side (−z)
  const geo = new THREE.CylinderGeometry(0.0155, 0.0155, 0.009, 14);
  const mDark = new THREE.MeshStandardMaterial({ color:'#1e1410', roughness:0.4 }), mLight = new THREE.MeshStandardMaterial({ color:'#efe4cc', roughness:0.4 });
  const dark = [[0, 1], [0, 5], [0, 9], [1, 0], [1, 4], [1, 6], [2, 3], [2, 7], [3, 2], [3, 4], [4, 5], [3, 8]];
  const light = [[9, 2], [9, 6], [8, 1], [8, 5], [8, 9], [7, 2], [7, 6], [6, 1], [6, 7], [5, 4]];
  R.pieces = {};
  for(const [r, q] of dark){ const m = new THREE.Mesh(geo, mDark); const p = at(r, q); m.position.set(p[0], 0.0225, p[1]); B.add(m); R.pieces[r + ':' + q] = m; }
  for(const [r, q] of light){ const m = new THREE.Mesh(geo, mLight); const p = at(r, q); m.position.set(p[0], 0.0225, p[1]); B.add(m); }
  // the record player on the console behind him
  const tt = new THREE.Group(); tt.position.set(-0.45, 0.62, -11.27); sc.add(tt);
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.3), new THREE.MeshStandardMaterial({ color:'#3a2214', roughness:0.5 })); box.position.y = 0.04; tt.add(box);
  const plat = R.platter = new THREE.Group(); plat.position.set(-0.03, 0.086, 0); tt.add(plat);
  const lc = document.createElement('canvas'); lc.width = lc.height = 128; const lx = lc.getContext('2d');
  lx.fillStyle = '#0c0c0e'; lx.beginPath(); lx.arc(64, 64, 63, 0, 7); lx.fill();
  lx.strokeStyle = 'rgba(255,255,255,0.06)'; for(let r = 22; r < 62; r += 3){ lx.beginPath(); lx.arc(64, 64, r, 0, 7); lx.stroke(); }
  lx.fillStyle = '#b8282a'; lx.beginPath(); lx.arc(64, 64, 20, 0, 7); lx.fill(); lx.fillStyle = '#f0c878'; lx.fillRect(52, 60, 24, 3); lx.fillStyle = '#111'; lx.beginPath(); lx.arc(64, 64, 2.5, 0, 7); lx.fill();
  const lt = new THREE.CanvasTexture(lc); lt.encoding = THREE.sRGBEncoding;
  const black = new THREE.MeshStandardMaterial({ color:'#0c0c0e' });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.125, 0.006, 28), [black, new THREE.MeshStandardMaterial({ map:lt, roughness:0.35 }), black]);
  plat.add(disc);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, 0.2), new THREE.MeshStandardMaterial({ color:'#c8c0a8', metalness:0.6, roughness:0.3 }));
  arm.position.set(0.13, 0.1, 0.03); arm.rotation.y = 0.35; tt.add(arm);
  // the promotion letter, on Kuti's desk from the start (it is dated yesterday)
  R.envelope = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.006, 0.12), new THREE.MeshStandardMaterial({ color:'#efe6cf', roughness:0.8 }));
  R.envelope.position.set(-2.72, 0.795, 4.95); R.envelope.rotation.y = 0.18; sc.add(R.envelope);
  const seal = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.004, 10), new THREE.MeshStandardMaterial({ color:'#9a1a1a', roughness:0.5 }));
  seal.position.set(0, 0.004, 0); R.envelope.add(seal);
}
function idCard(){
  const R = RT(); if(R.card) return;
  const c = document.createElement('canvas'); c.width = 128; c.height = 80; const x = c.getContext('2d');
  x.fillStyle = '#f2f0ea'; x.fillRect(0, 0, 128, 80); x.fillStyle = '#1d3f7a'; x.fillRect(0, 0, 128, 18); x.fillStyle = '#1f8a3e'; x.fillRect(0, 74, 128, 6);
  x.fillStyle = '#f0c878'; x.font = 'bold 11px sans-serif'; x.fillText('NACECA', 6, 13); x.fillStyle = '#8a8a8a'; x.fillRect(8, 26, 30, 38);
  x.fillStyle = '#1a1a1a'; x.font = 'bold 9px sans-serif'; x.fillText('KELECHI', 46, 36); x.font = '8px sans-serif'; x.fillText('AGENT · CYBER', 46, 50);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
  const side = new THREE.MeshStandardMaterial({ color:'#e8e6e0' });
  R.card = new THREE.Mesh(new THREE.BoxGeometry(0.086, 0.003, 0.054), [side, side, new THREE.MeshStandardMaterial({ map:t, roughness:0.5 }), side, side, side]);
  R.card.position.set(-2.5, 0.794, 4.84); R.card.rotation.y = -0.25; ENGINE.scene.add(R.card);
}
function movePiece(){
  const R = RT(), m = R.pieces && R.pieces['3:4']; if(!m || R.moved) return; R.moved = true;
  const from = m.position.clone(), to = V3(from.x + 0.0375, from.y, from.z + 0.0375); let t = 0;
  R.anims = R.anims || [];
  R.anims.push(dt => { t += dt / 0.7; const k = Math.min(1, t), e = k * k * (3 - 2 * k); m.position.lerpVectors(from, to, e); m.position.y = from.y + Math.sin(PI * k) * 0.03; return k < 1; });
}

/* ---------- the door obstacle (closed doors block, open doors don't) ---------- */
function doorBlock(on){
  const L = ENGINE.obstacles || [];
  const i = L.findIndex(o => Math.abs(o.minX + 0.9) < 0.02 && Math.abs(o.maxX - 0.9) < 0.02 && Math.abs((o.minZ + o.maxZ) / 2 - 1.6) < 0.05);
  if(on && i < 0 && typeof addObstacle === 'function') addObstacle(0, 1.6, 1.8, 0.35);
  if(!on && i >= 0) L.splice(i, 1);
}
function doors(open){ V13.world.open('doors', open ? 1 : 0); doorBlock(!open); thunk(); }

/* ---------- every frame, playing or not ---------- */
function always(dt){
  const R = RT(); if(!R || R.id !== 'm13') return;
  let dlg = false, doc = false, other = false;
  document.querySelectorAll('.overlay.show').forEach(o => { if(o.id === 'screen-dialogue') dlg = true; else if(o.id === 'screen-puzzle') doc = true; else other = true; });
  const playing = ENGINE.movementEnabled && !dlg && !doc && !other;
  if(!other){
    moveStep(dt);
    if(R.anims) R.anims = R.anims.filter(f => { try{ return f(dt) !== false; }catch(e){ return false; } });
    if(R.win && (playing || doc)) windowStep(dt, doc);
    if(R.watch) R.watch(dt);
  }
  if(R.docOpen && !doc){ R.docOpen = false; dropChip(); }
  if(R.platter) R.platter.rotation.y -= dt * 3.49;
  if(!playing){
    if(V13.world && V13.world.update && (dlg || doc)) V13.world.update(dt);
    if(TPCAM.override && typeof updateCamera === 'function') updateCamera();
  }
}

/* Wayfinding (RT04, Senior Agent). During Kuti's call the beta's last-resort pointer skips the optional docket and
   lands on the sofa, which is the "back to the sofa before he is" step, a Recruit-only line. On Senior the docket
   objective, and the Director-General one while the call lasts, point at nothing. Recruit keeps the pointer. The
   other objectives only ever point at the next required spot (Kuti, the sofa, the chair, the desk, the lift). */
if(window.WAY && WAY.OBJ_TARGETS){
  const inCall = ()=>{ const R = V13.rt; return !!(R && R.id === 'm13' && R.win); };
  WAY.OBJ_TARGETS.m13 = Object.assign(WAY.OBJ_TARGETS.m13 || {}, {
    o13_docket:()=>rec() ? null : { ui:true },
    o13_dg:()=>(rec() || !inCall()) ? null : { ui:true },
  });
}

/* ======================================================================
   THE CASE
   ====================================================================== */
V13.defCase('m13', {
  title:'The Ninth Floor', region:'FCT', sub:'NACECA Headquarters · 09:50', evMax:2, xp:340, ambient:'hq',
  objectives:()=>[
    { id:'o13_kuti', text:'Report to Mr. Kuti at reception' },
    { id:'o13_wait', text:'Wait on the sofa' },
    { id:'o13_dg', text:'See the Director-General' },
    { id:'o13_out', text:'Go downstairs. Uche is in the car park' },
  ],
  reset(){
    const m = MC(), f = S.game.flags || {};
    for(const k of FLAGS){ delete m[k]; delete f[k]; }
    // a replay is judged on the replay: this case's exhibits and document attempts start clean
    S.game.evidence = (S.game.evidence || []).filter(e => !e || !EVIDS.includes(e.id));
    if(S.game.evQ) for(const id of EVIDS) delete S.game.evQ[id];
    for(const store of ['_docMiss', '_docFree', '_docLocked']) if(S.game[store]) for(const k of DOCKEYS) delete S.game[store][k];
  },
  build(){
    css();
    liftMeter(false);
    V13.scene(KEY, { start:'start', player:suit });
    const R = RT();
    // a quieter floor: the baked reception tiles run hot under the filmic curve
    ENGINE.scene.traverse(o => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      for(const m of ms) if(m && m.lightMap && m.lightMapIntensity != null && !m._c13k){ m._c13k = 1; m.lightMapIntensity *= 0.86; } });
    R.wire = MC().s2_wire === true;
    ENGINE.sceneAlways = always;
    props();
    // Mr. Kuti at reception, hands folded; the Director-General at the glass, his back to the room
    const ka = A('kuti') || { x:-3, z:6.2, rot:0 };
    R.kuti = V13.person('kuti', { x:ka.x, z:ka.z, rot:ka.rot }, { clip:'folded', solid:false, id:'kuti' });
    const w = A('window') || { x:3.2, z:-11.2, rot:PI };
    R.dg = V13.person('dg', { x:w.x, z:w.z, rot:w.rot }, { clip:'folded', solid:false, id:'dg' });
    R.dgPose = 'stand';
    R.itKuti = V13.talk(R.kuti, 'Report to Mr. Kuti', it => { V13.drop(it); reception(); }, { range:2.8 });
  },
  start(){
    const R = RT();
    ENGINE.movementEnabled = false; showHUD(false);
    R.intro = true;
    shot('intro', true);
    later(R, 2600, endIntro);
  },
});

function endIntro(){
  const R = RT(); if(!R.intro) return; R.intro = false;
  freeCam(); ENGINE.movementEnabled = true; showHUD(true);
  if(R.wire) V13.toast('THE PEN', 'In your breast pocket. You clicked it on in the lift.', 2600);
  else V13.toast('NINTH FLOOR', 'Mr. Kuti is expecting you.', 2200);
}

/* ---------- reception: Kuti, your phone, "Sit." ---------- */
function reception(){
  const R = RT();
  endIntro();
  V13.face(R.kuti, ENGINE.player.position.x, ENGINE.player.position.z);
  V13.face(ENGINE.player, R.kuti.position.x, R.kuti.position.z);
  twoShot(ENGINE.player, R.kuti);
  R.onLine = l => {
    if(l.speaker === KUTI && /Your phone, please/.test(l.text)){ V13.once(R.kuti, 'interact', 'folded'); later(R, 450, ()=>V13.once(ENGINE.player, 'interact', 'idle')); }
  };
  V13.say('m13_kuti', ()=>{
    R.onLine = null; freeCam();
    V13.done('o13_kuti');
    toKutiChair();
    const rs = V13.list(KEY, 'reception_seats'), s = rs[2] || [5.85, 4.25, -PI / 2];
    R.seatAt = { x:s[0], z:s[1], rot:s[2] };
    R.itSeat = V13.spot({ x:s[0] - 0.35, y:0.7, z:s[1] }, 'Sit on the sofa', ()=>sitDown(), { verb:'use', range:2.2 });
    V13.toast('MR. KUTI', '"Sit."', 1800);
    R.callIn = later(R, 40000, ()=>{ if(!R.called) theCall(); });          // nobody waits for ever on this floor
  });
}
function toKutiChair(){
  const R = RT(), ch = A('kuti_chair') || { x:-3, z:3.75, rot:0 };
  R.kutiAt = 'toDesk';
  return walk(R.kuti, [[-1.6, 6.0], [-1.6, 3.95], [ch.x, ch.z + 0.05]], { end:'sit', face:ch.rot }).then(()=>{ if(R.kutiAt === 'toDesk') R.kutiAt = 'desk'; });
}
function sitDown(){
  const R = RT(); if(R.seat) return;
  seat(R.seatAt, { release:standUp, camYaw:R.seatAt.rot + PI + 0.45 });
  if(R.itSeat) R.itSeat.mesh.visible = false;
  V13.done('o13_wait');
  if(!R.called && !R.callTimer) R.callTimer = later(R, 3800, theCall);
}
function standUp(){
  const R = RT();
  unseat([R.seatAt.x - 0.8, R.seatAt.z + 0.3]);
  if(R.itSeat) R.itSeat.mesh.visible = true;
  if(!R.called && R.kutiAt === 'desk') overhear(KUTI, HEARD.sit, 2400);
}

/* ---------- the call: Kuti takes it in the records room ---------- */
function theCall(){
  const R = RT(); if(R.called || R.id !== 'm13') return;
  if(R.kutiAt !== 'desk'){ later(R, 700, theCall); return; }             // he answers from his chair
  R.called = true; R.kutiAt = 'phone';
  ring(2);
  later(R, 1500, ()=>{
    V13.play(R.kuti, 'phone', { fade:0.3 });
    overhear(KUTI, HEARD.answer, 3400);
    later(R, 2200, ()=>{
      R.kutiAt = 'toRecords';
      walk(R.kuti, [[-1.6, 3.95], [-1.6, 6.0], [6.0, 6.05], [7.0, 6.0], [7.8, 5.8], [7.8, 5.0], [7.35, 3.3]], { end:'phone', face:PI }).then(()=>{ if(alive(R)){ R.kutiAt = 'records'; openWindow(); } });
    });
  });
}
function openWindow(){
  const R = RT();
  // 28 s (+8 on touch); Action pace scales how fast it runs (windowStep), not how long it is
  const tch = document.body.classList.contains('touch-active');
  const total = 28 + (tch ? 8 : 0);
  R.win = { t:total, total, said:{}, step:0 };
  const kept = MC().s2_original === 'kept';
  objAdd('o13_docket', 'Optional: read the docket on Kuti\'s desk', 'o13_dg');
  if(rec()) V13.toast('KUTI\'S DESK', 'A buff docket, "by hand". He\'s on the phone — read it, and be on the sofa before he is.', 3000);
  else V13.toast('KUTI\'S DESK', 'A buff docket, "by hand". He\'s on the phone in the records room.', 3000);
  R.itDocket = V13.spot({ x:-3.0, y:0.85, z:4.6 }, 'Read the docket on Kuti\'s desk', it => readDocket(it), { verb:'inspect', range:2.0, optional:true, labelY:0.35 });
  R.heard = kept ? [HEARD.a_kept, HEARD.b_kept] : [HEARD.a, HEARD.b];
}
/* The call window runs at the Action-pace rate (Relaxed 0.75, Hard 1.2, extended /1.6). It stands still while the
   docket is open, in both casework modes: reading is never timed (the footsteps go on as sound only). With timed
   sequences off it runs only while you sit on the sofa, so Kuti still comes back when you wait for him. */
const winRate = R => { const r = rate(); return r > 0 ? r : (R.seat ? 1 : 0); };
function windowStep(dt, docOpen){
  const R = RT(), W = R.win; if(!W) return;
  if(!docOpen) W.t -= dt * winRate(R);
  const since = W.total - W.t;
  if(since > 5 && !W.said.a){ W.said.a = 1; overhear(KUTI + ' · RECORDS ROOM', R.heard[0], 3600); }
  if(since > 14 && !W.said.b && W.t > 8){ W.said.b = 1; overhear(KUTI + ' · RECORDS ROOM', R.heard[1], 3000); }
  if(W.t <= 6 && !W.said.end){ W.said.end = 1; overhear(KUTI + ' · RECORDS ROOM', HEARD.end, 2600); if(typeof sfxAlert === 'function') sfxAlert(); }
  if(W.t <= 6){ W.step -= dt; if(W.step <= 0){ W.step = 0.55; if(typeof sfxFootstep === 'function') sfxFootstep(); } }
  const left = Math.max(0, W.t), frac = left / W.total;
  if(typeof showMeter === 'function') showMeter('c13win', W.t > 6 ? 'MR. KUTI — ON THE PHONE' : 'MR. KUTI — FOOTSTEPS', frac, W.t > 6 ? 'info' : 'danger', Math.ceil(left) + 's');
  chip(docOpen, left);
  if(docOpen) return;
  // following him into the records room ends it
  const P = ENGINE.player.position;
  if(P.x > 6.3 && Math.abs(P.z - 6.0) < 1.6 && !W.seen){ W.seen = 1; overhear(KUTI, HEARD.door, 2400); W.t = 0; }
  if(W.t <= 0) kutiReturns();
}
/* the docket chip: its own row under the document's header (the header keeps its close button on screen at 390 px) */
function chip(docOpen, left){
  if(!docOpen) return;
  const frame = document.querySelector('#screen-puzzle .puzzle-frame.v12-doc'), body = frame && frame.querySelector('.v12-doc-body'); if(!body) return;
  let row = frame.querySelector('.c13-row');
  if(!row){ row = V13.el('div', 'c13-row', '<span class="c13-chip"></span>'); frame.insertBefore(row, body); }
  const c = row.querySelector('.c13-chip');
  const hot = !RT().win || left <= 6;
  const t = (hot ? 'FOOTSTEPS · ' : 'KUTI ON THE PHONE · ') + Math.ceil(Math.max(0, left)) + 's';
  if(c._t === t) return;
  c._t = t; c.classList.toggle('hot', hot);
  c.innerHTML = (hot ? ico('clock') : '') + '<span>' + t + '</span>';
}
const dropChip = ()=>{ document.querySelectorAll('#screen-puzzle .c13-row').forEach(r => r.remove()); };

/* ---------- the docket ---------- */
const docketName = key => ((PUZZLES[key] || {}).onCorrect || {}).evidenceName || 'Exhibit 14 transfer docket';
function readDocket(it){
  const R = RT(); if(R.docDone || R.docOpen || !R.win) return;
  const key = V13.C && V13.C.docket ? V13.C.docket() : 'm13_docket';
  const P = ENGINE.player.position, east = P.x > -1.9 && P.z < 5.6;
  const open = ()=>{
    if(!alive(R) || !R.win) return;
    R.docOpen = true; R.docKey = key;
    S.game.evQ = S.game.evQ || {}; delete S.game.evQ.transfer_docket;              // the document marks a failed read itself
    V13.doc(key, ()=>{
      R.docOpen = false; dropChip();
      if(R.glimpsed) return;                                                       // Kuti took it out of your hands
      // the document's own outcome (its misses follow casework: Recruit 3, Senior 2), as Case 12 reads it
      const failed = (S.game.evQ || {}).transfer_docket === 'weak';
      R.docDone = true;
      S.game.evQ = S.game.evQ || {};
      V13.ev('transfer_docket', docketName(key), failed ? 'weak' : 'good', 40);       // logged for this operation (the screen may already have)
      S.game.evQ.transfer_docket = failed ? 'weak' : 'good';
      V13.done('o13_docket');
      if(it) V13.drop(it); R.itDocket = null;
      if(R.win && !R.caught && rec()) V13.toast('NOW', 'Back to the sofa — before he is.', 2000);   // Recruit only: the next step
    });
    setTimeout(()=>chip(true, R.win ? R.win.t : 0), 30);
  };
  // lean over the desk, then read
  touch(east ? [-1.62, 4.6] : [-3.0, 5.78], east ? -PI / 2 : PI, [-3.0, 0.8, 4.6], open, null, 0.7);
}

/* ---------- Kuti comes back ---------- */
function kutiReturns(){
  const R = RT(); if(!R.win) return;
  R.win = null; if(typeof hideMeter === 'function') hideMeter('c13win');
  if(R.itDocket && !R.docOpen){ V13.drop(R.itDocket); R.itDocket = null; }
  if(!V13.objDone('o13_docket')){ S.game.objectives = (S.game.objectives || []).filter(o => o.id !== 'o13_docket'); if(typeof renderObjectives === 'function') renderObjectives(); }
  R.kutiAt = 'returning';
  let checked = false, foot = 0;
  walk(R.kuti, [[7.8, 5.0], [7.8, 5.8], [7.0, 6.0], [5.6, 6.1]], { end:'idle' }).then(()=>{ if(!alive(R)) return; R.kutiAt = 'back'; if(!R.caught){ R.watch = null; back(); } });
  R.watch = dt => {
    foot -= dt; if(foot <= 0 && R.kutiAt === 'returning'){ foot = 0.5; if(typeof sfxFootstep === 'function') sfxFootstep(); }
    if(R.kuti.position.x > 7.05 && !checked) return;                            // still inside the records room
    checked = true;
    const P = ENGINE.player.position;
    if((Math.hypot(P.x + 3.0, P.z - 4.6) < 2.35 || R.docOpen) && !R.caught) caught();
  };
}
function caught(){
  const R = RT(); R.caught = true; R.watch = null;
  stop(R.kuti); V13.play(R.kuti, 'idle', { fade:0.2 });
  const P = ENGINE.player.position;
  V13.face(R.kuti, P.x, P.z);
  const confront = ()=>{
    if(!alive(R)) return;
    if(R.seat) unseat();
    ENGINE.movementEnabled = false;
    if(ENGINE.seq){ ENGINE.seq = null; }
    // he walks up to you; you stay where he found you
    const k = R.kuti.position, dx = P.x - k.x, dz = P.z - k.z, d = Math.hypot(dx, dz) || 1;
    const to = [P.x - dx / d * 1.25, P.z - dz / d * 1.25];
    walk(R.kuti, [to], { end:'folded' });
    later(R, 1300, ()=>{
      V13.face(ENGINE.player, to[0], to[1]);
      V13.play(ENGINE.player, 'idle');
      twoShot(ENGINE.player, { position:{ x:to[0], z:to[1] } });
      V13.say('m13_kuti_caught', ()=>{
        applyEffect({ agencyFavour:-2 });
        freeCam();
        V13.toast('MR. KUTI', 'He mentions everything. The Director-General will hear about the desk.', 2600);
        ENGINE.movementEnabled = true;
        toDoors(true);
      });
    });
  };
  if(!R.docOpen){ confront(); return; }
  // he walks in on you reading it
  const msg = document.getElementById('v12-doc-msg');
  if(msg && msg.classList.contains('good')){
    // already on the record: the screen closes itself in a moment
    const wait = ()=>{ if(!alive(R)) return; if(R.docOpen) setTimeout(wait, 120); else confront(); }; wait(); return;
  }
  if(msg && /DEFENCE GETS/.test(msg.textContent)){
    const go = document.getElementById('v12-doc-go'); if(go) go.click();      // the misread stands
    setTimeout(confront, 200); return;
  }
  R.glimpsed = true;
  const x = document.getElementById('v12-doc-x'); if(x) x.click();
  setTimeout(()=>{
    if(!alive(R)) return;
    if(!R.docDone){
      const key = R.docKey || 'm13_docket';
      V13.ev('transfer_docket', docketName(key) + ' (glimpsed)', 'weak', 20);
      S.game.evQ.transfer_docket = 'weak';
      V13.toast('HALF-READ', 'You saw the shape of it before he walked in. Not the words.', 3000);
      if(R.itDocket){ V13.drop(R.itDocket); R.itDocket = null; }
    }
    R.docOpen = false; confront();
  }, 260);
}
function back(){
  const R = RT();
  const P = ENGINE.player.position;
  V13.face(R.kuti, P.x, P.z);
  if(!R.seat) V13.face(ENGINE.player, R.kuti.position.x, R.kuti.position.z);
  twoShot(ENGINE.player, R.kuti);
  V13.say('m13_x_ready', ()=>{
    R.kutiAt = 'doors'; freeCam();
    V13.skip(['10:40', 'FIFTY MINUTES ON THE SOFA'], ()=>{ if(alive(R)) toDoors(false); }, 2200);   // (not into a replay started under the card)
    // during the card: everyone where the next beat wants them
    later(R, 900, ()=>{
      if(!R.seat) seat(R.seatAt, { release:standUp, camYaw:R.seatAt.rot + PI + 0.45 });
      stop(R.kuti); R.kuti.position.set(-1.25, 0, 2.55); R.kuti.rotation.y = 0.9; V13.play(R.kuti, 'folded');
    });
  });
}

/* ---------- the double doors ---------- */
function toDoors(wasCaught){
  const R = RT();
  if(R.itSeat){ V13.drop(R.itSeat); R.itSeat = null; }
  const go = ()=>{
    if(!alive(R)) return;
    doors(true);
    V13.done('o13_wait');
    shot('doors', !wasCaught ? false : true);
    later(R, 1500, ()=>{ if(R.shotName === 'doors') freeCam(); });
    R.inOffice = false;
    const f = A('dg_chair_front') || { x:0, z:-6.4, rot:PI };
    R.itChair = V13.spot({ x:f.x, y:0.6, z:f.z + 0.1 }, 'Take the seat in front of his desk', ()=>meetingSeat(), { verb:'use', range:1.9 });
    const sf = A('safe') || { x:8.6, z:-6 };
    R.itSafe = V13.spot({ x:sf.x + 0.5, y:0.8, z:sf.z }, 'Look at the safe', it => {
      V13.drop(it);
      touch([sf.x - 0.2, sf.z], PI / 2, [9.2, 0.6, sf.z], null, ()=>{
        V13.face(R.dg, ENGINE.player.position.x, ENGINE.player.position.z);
        V13.say(R.docDone && MC().s2_original !== 'kept' ? 'm13_x_safe_read' : 'm13_x_safe');
      }, 0.9);
    }, { verb:'inspect', range:2.4, optional:true });
    // Kuti closes the doors behind you
    R.watch = ()=>{
      const P = ENGINE.player.position;
      if(!R.inOffice && P.z < 0.4){ R.inOffice = true; later(R, 900, ()=>{ if(ENGINE.player.position.z < 1.2 && !R.meeting){ doors(false); walk(R.kuti, [[-1.6, 3.95], [-3.0, 3.8]], { end:'sit', face:0 }); } }); }
    };
    if(R.wire) later(R, 1500, ()=>V13.toast('THE PEN', 'Still recording. Breathe.', 1800));
  };
  if(wasCaught){
    walk(R.kuti, [[-1.25, 2.55]], { end:'folded', face:0.9 });
    later(R, 700, go);
  } else {
    V13.face(R.kuti, ENGINE.player.position.x, ENGINE.player.position.z);
    shot('doors', true);
    V13.say('m13_x_doors', go);
  }
}

/* ---------- the meeting ---------- */
function meetingSeat(){
  const R = RT(); if(R.meeting) return;
  R.meeting = true;
  if(R.itChair) V13.drop(R.itChair); if(R.itSafe) V13.drop(R.itSafe);
  R.watch = null;
  doorBlock(true); V13.world.open('doors', 0);
  const f = A('dg_chair_front') || { x:0, z:-6.4, rot:PI };
  seat({ x:f.x, z:f.z, rot:f.rot }, { locked:true });
  ENGINE.movementEnabled = false;
  // Kuti, wherever he was, is back at his desk
  stop(R.kuti); const kc = A('kuti_chair') || { x:-3, z:3.75 }; R.kuti.position.set(kc.x, 0, kc.z + 0.05); R.kuti.rotation.y = 0; V13.play(R.kuti, 'sit');
  const registered = V13.registered ? V13.registered() : [];
  R.registered = registered;
  if(registered.length && V13.registerLeak) V13.registerLeak();          // he has read the register: they are exposed
  if(R.wire){
    S.game._finTrace = 0;
    R.rec = true;
    showMeter('trace', 'RECORDING', 0, 'danger', '0%');
    liftMeter(true);
  }
  R.onLine = meetingLine;
  R.onChoices = ()=>{ if(!R.shook) shot('dg'); talkPose(R.dg, false); talkPose(ENGINE.player, false); };
  const key = V13.C && V13.C.ninth ? V13.C.ninth(registered) : (R.wire ? 'm13_dg_wire' : 'm13_dg');
  shot('wide', true);
  // he turns from the glass as you sit, and takes his own chair before he says a word
  (dgToChair() || Promise.resolve()).then(()=>later(R, 300, ()=>V13.say(key, afterMeeting)));
}
function talkPose(ch, on){
  const R = RT();
  if(ch === ENGINE.player){ const s = R.seat; if(!s) return; const c = on ? 'sit_talk' : 'sit'; if(s.clip !== c){ s.clip = c; V13.play(ch, c, { fade:0.3 }); } return; }
  if(ch === R.dg && !R.dgWalking){ const c = R.dgPose === 'sit' ? (on ? 'sit_talk' : 'sit') : (on ? 'talk' : 'idle'); if(R.dgClip !== c){ R.dgClip = c; V13.play(ch, c, { fade:0.3 }); } }
}
function dgToChair(){
  const R = RT(); if(R.dgPose === 'sit') return Promise.resolve(); if(R.dgWalking) return R.dgWalking;
  const d = A('dg') || { x:0, z:-9.1 };
  R.dgWalking = walk(R.dg, [[2.1, -10.3], [0.9, -9.75], [d.x, d.z - 0.05]], { speed:1.45, end:'sit', face:0 }).then(()=>{ R.dgWalking = false; R.dgPose = 'sit'; R.dgClip = 'sit'; R.dg.position.z = d.z; });
  return R.dgWalking;
}
function meetingLine(l){
  const R = RT(), sp = l.speaker || '', t = l.text || '';
  if(sp === 'NACECA SYSTEM'){
    talkPose(R.dg, false); talkPose(ENGINE.player, false);
    if(/^10:41/.test(t)){ dgToChair(); shot('wide', true); return; }
    if(/comes around the desk/.test(t)){ handshake(); shot('hand', true); return; }
    if(/moves one piece/.test(t)){ movePiece(); if(!R.dgWalking) V13.once(R.dg, 'interact', R.dgPose === 'sit' ? 'sit' : 'idle'); R.dgClip = null; shot('board', true); return; }
    if(/uncaps it and writes/.test(t)){ if(!R.dgWalking) V13.once(R.dg, 'interact', 'sit'); R.dgClip = null; shot('dg'); return; }
    if(!R.shook) shot('wide');
    return;
  }
  if(/DIRECTOR-GENERAL/.test(sp)){
    if(R.dgPose !== 'sit' && !R.dgWalking && !R.shook) dgToChair();
    talkPose(R.dg, true); talkPose(ENGINE.player, false);
    if(R.shook) shot('hand');
    else shot(l.mood === 'evasive' || l.mood === 'angry' ? 'dg' : 'ots');
    return;
  }
  if(sp === KEL){
    const inner = /^\(/.test(t);
    talkPose(R.dg, false); talkPose(ENGINE.player, !inner);
    shot(R.shook ? 'hand' : inner ? 'kel' : 'rev');
  }
}
function handshake(){
  const R = RT(); if(R.shook) return; R.shook = true;
  stop(R.dg); R.dgWalking = true; R.dgPose = 'stand'; R.dgClip = null;
  const P = ENGINE.player;
  R.seat = null;                                                            // Kelechi stands to take it
  P.position.set(0.12, 0, -6.2); V13.play(P, 'idle', { fade:0.3 });
  V13.face(P, 1.2, -6.6);
  walk(R.dg, [[1.55, -9.0], [1.65, -7.1], [0.85, -6.45]], { speed:1.35, end:'idle' }).then(()=>{
    if(!alive(R)) return;
    R.dgWalking = false; R.dgClip = 'idle';
    V13.face(R.dg, P.position.x, P.position.z); V13.face(P, R.dg.position.x, R.dg.position.z);
    V13.once(R.dg, 'interact', 'idle'); V13.once(P, 'interact', 'idle');
  });
}
function afterMeeting(){
  const R = RT();
  R.onLine = null; R.onChoices = null;
  const ninth = MC().s2_ninth;
  // what the pen got
  if(R.wire){
    const pct = Math.max(0, Math.min(100, Math.round(S.game._finTrace || 0)));
    R.pct = pct; R.rec = false;
    if(typeof hideMeter === 'function') hideMeter('trace');
    liftMeter(false);
    const q = V13.C.recordingQuality(pct);
    V13.ev('dg_recording', 'Recording — the ninth floor', q, 90);
    S.game.evQ.dg_recording = q;
    delete S.game._finTrace;
    later(R, 600, ()=>V13.toast('THE PEN · ' + pct + '%', q === 'good' ? 'All of it. His voice, his offer.' : q === 'contested' ? 'Most of it. Not the parts where he went quiet.' : 'His voice — and nothing he would mind a court hearing.', 3000));
  }
  if(R.registered && R.registered.length) later(R, R.wire ? 3800 : 600, ()=>V13.toast('SOURCES EXPOSED', R.registered.join(' · ') + ' — the register is read on the ninth floor.', 3400));
  V13.done('o13_dg');
  // up and out: the doors open again
  const P = ENGINE.player;
  if(R.seat) unseat([0.25, -5.9]);
  if(R.shook){ walk(R.dg, [[1.9, -8.2], [3.2, -11.0]], { speed:1.2, end:'folded', face:PI }); }
  else { V13.play(R.dg, 'sit'); }
  freeCam();
  ENGINE.cameraYaw = ENGINE.playerYaw = P.rotation.y = 0;                     // facing the doors
  doors(true);
  ENGINE.movementEnabled = true; showHUD(true);
  const kd = { x:-3.0, y:0.85, z:4.6 };
  if(ninth === 'refuse'){
    objAdd('o13_card', 'Leave your ID card on Kuti\'s desk', 'o13_out');
    R.itDesk = V13.spot(kd, 'Leave your ID card on Kuti\'s desk', it => { V13.drop(it); deskBeat('card'); }, { verb:'use', range:2.4 });
  } else {
    objAdd('o13_letter', 'Collect your letter from Kuti\'s desk', 'o13_out');
    R.itDesk = V13.spot(kd, 'Collect your letter from Kuti\'s desk', it => { V13.drop(it); deskBeat('letter'); }, { verb:'collect', range:2.4 });
  }
}
function deskBeat(kind){
  const R = RT();
  V13.once(R.kuti, 'interact', 'sit');
  touch([-3.0, 5.8], PI, [-2.7, 0.8, 4.9], ()=>{
    if(kind === 'card'){ idCard(); V13.done('o13_card'); V13.toast('SUSPENDED', 'Pending an inquiry into Ekosodin. Your ID card stays on the ninth floor.', 2800); }
    else { if(R.envelope) R.envelope.visible = false; V13.done('o13_letter'); V13.toast('SUPERINTENDENT', 'Lagos Cyber & Financial Crimes. The letter is dated yesterday.', 2800); }
  }, ()=>{
    V13.say(kind === 'card' ? 'm13_x_card' : 'm13_x_letter', ()=>{
      R.itLift = V13.spot({ x:0, y:1.2, z:9.3 }, 'Take the lift down', it => { V13.drop(it); downstairs(); }, { verb:'exit', range:2.6 });
    });
  }, 1.2);
}

/* ---------- downstairs ---------- */
function downstairs(){
  const R = RT();
  ENGINE.movementEnabled = false; showHUD(false);
  V13.done('o13_out');
  interlude('11:58<small>THE CAR PARK BEHIND HEADQUARTERS</small>');
  const key = V13.C && V13.C.end13 ? V13.C.end13(R.wire ? R.pct : undefined) : 'm13_end';
  later(R, 1200, ()=>V13.say(key, ()=>{
    interlude(null);
    if(V13.recruitFromFlags) V13.recruitFromFlags();
    V13.finish('m13');
  }));
}
})();
