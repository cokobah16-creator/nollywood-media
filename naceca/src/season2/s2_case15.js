/* =========================================================================
   NACECA · v13 Case 15 — The Barge (Rivers · Bonny River, Riverstone jetty, 23:30)
   Season 2 finale. Rain on the river; the Senator empties his strongroom onto
   TEKENA 2 before a forfeiture order lands at nine. The brief on the road,
   with whatever the sources say and whatever the court decided. Then the way
   in: Chairman Ibinabo's boats under the jetty (and a task force that has to
   come round by the road: a clock), or the front gate, where the Director-
   General's task force stands behind the bars and Okundaye holds them with
   paper. The jetty is watched: three Riverstone torches; be seen and the
   bags go into the river. The cash room on the barge. The Senator under his
   umbrella. The Director-General on the phone: truth or career.
   Monday, the ninth floor: put a name and three proofs in the blank, then
   walk through his double doors. The season's epilogue and the Season 3
   stinger follow the aftermath (V13.startEpilogueS2).
   ========================================================================= */
(function(){
'use strict';
const V12 = window.V12, V13 = window.V13;
if(!V13 || !V13.defCase) return;
const MC = V13.mc;
const K = 'tankfarm_n', KO = 'abuja_office', PI = Math.PI;
const V3 = (x, y, z)=>new THREE.Vector3(x, y, z);
const RT = ()=>V13.rt;
const S2 = ()=>V13.s2();
const KEL = 'AGENT KELECHI', UCHE = 'SGT. UCHE', SYS = 'NACECA SYSTEM', DG = 'DIRECTOR-GENERAL FASHINA', OSA = 'COMMANDER OKUNDAYE',
      HAU = 'BARRISTER DANLADI', SEN = 'SENATOR DOUGLAS-AKPAN', TFC = 'TASK FORCE COMMANDER', IBI = 'CHAIRMAN IBINABO';
const kel = (text, o)=>Object.assign({ speaker:KEL, portrait:'kelechi', text }, o || {});
const lang = l => (typeof SETTINGS !== 'undefined' && SETTINGS.lang === 'english' && l.textEn) ? l.textEn : l.text;
const esc = s => (V13.esc ? V13.esc(s) : String(s));
const ico = n => (typeof icon === 'function' ? icon(n) : '');
const rec = ()=>typeof isRecruit === 'function' && isRecruit();
const modal = (id, o)=>{ if(typeof v13Modal === 'function') try{ v13Modal(id, o); }catch(e){} };
const modalEnd = id => { if(typeof v13ModalEnd === 'function') try{ v13ModalEnd(id); }catch(e){} };
/* (CN10) the commander and the barrister by their names; the code ids (osagie, hauwa) stay. Until s2_core adds
   the OKUNDAYE portrait key and s2_dlg_c renames the candidates, this file does it (both are guarded no-ops after) */
if(typeof SPEAKER_ART !== 'undefined' && !SPEAKER_ART.some(([k]) => k === 'OKUNDAYE')) SPEAKER_ART.unshift(['OKUNDAYE', 'osagie']);
for(const c of (V13.S2_CANDIDATES || [])){
  if(c.id === 'osagie' && !/Okundaye/.test(c.name)) c.name = 'Cdr. Itohan Okundaye';
  if(c.id === 'danladi' && !/Zainab/.test(c.name)) c.name = 'Barr. Zainab Danladi';
}

/* ---------- the few lines the staging needs (gaps only; everything else is v13_dlg_c.js) ---------- */
Object.assign(DIALOGUE, {
  // the brief ends with Okundaye's envelope: Season 1's sealed accusation, carried by hand
  m15_x_seal_offer:[ { speaker:OSA, text:"And Kelechi — on Monday there'll be a warrant with a blank where a name goes. If you already know the name, seal it with me tonight. Before anyone tells you." } ],
  m15_x_seal_done:[ { speaker:OSA, text:"Sealed. It stays in my breast pocket, unopened, until Monday — whatever happens on that jetty." } ],
  // by water: the task force gets round by the road before the count is done
  m15_x_tf_jetty:[
    { speaker:SYS, text:"Boots on the berth. ACP Lawal comes up the jetty at a jog, twenty men behind him, rain running off their vests." },
    { speaker:TFC, mood:'angry', text:"NACECA! By order of the Director-General, step away from that barge!" },
    { speaker:OSA, text:"It's a warrant, ACP. Read it slowly. Your men can wait on the quay while you do." },
  ],
  // Monday: the envelope comes out of Okundaye's pocket
  m15_x_knew:[
    kel("Commander Okundaye has carried a sealed envelope since Friday night, sir. Your name is in it — written before the Senator said a word."),
    { speaker:DG, mood:'afraid', text:"…You knew." },
  ],
});
/* A choice that carries a flag but no effect never reaches moralChoices (applyEffect returns early when
   there is no effect): m15_entry's water/gate is like that. While this case runs the flag is applied.
   (Cases 10-12 carry the same scoped fix for themselves; the general fix belongs in core, see the hand-in.) */
V13.wrap('applyEffect', orig => function(eff, flag){
  if(!eff && flag && typeof flag === 'object' && S.game && S.game.currentMission === 'm15') return orig.call(this, {}, flag);
  return orig.apply(this, arguments);
});
/* the flag a choice carried, read back from the pick if it still didn't land */
const pickedFlag = (key, name)=>{ const lp = V13.lastPick; return lp && lp.key === key && lp.c && lp.c.flag ? lp.c.flag[name] : undefined; };
const RADIO = {
  kit:"Body-cameras in my bag, sir, charged. Whatever the Senator says tonight, his lawyers will swear he never said it.",
  low:"Three Riverstone guards on that jetty, sir. Stay low and keep the van between you and their torches. If they see a warrant before you're on the gangway, the bags go in the river.",
  made:{ text:"NACECA dey come! Throw am for water — quick quick!", textEn:"NACECA's coming! Throw it in the water — quick!" },
  wait:"He's still out there, Kelechi. Under his umbrella. Waiting for you.",
};
/* (R11) Senior Agent: the radio says what is there and what is at stake, never the method or the next step */
const RADIO_SR = {
  kit:"Body-cameras in my bag, sir, charged.",
  low:"Three Riverstone guards on that jetty, sir. If they see a warrant before you're on the gangway, the bags go in the river.",
  wait:null,                                                    // Recruit only
};
const radio = k => rec() ? RADIO[k] : RADIO_SR[k];

/* ---------- styles: s2.css (the sealed envelope and the accusation are the beta's paper sheet, CW.sheet) ---------- */

/* ---------- small sounds ---------- */
const live = ()=>typeof AUDIO !== 'undefined' && AUDIO.enabled && AUDIO.ctx && AUDIO.sfxGain;
function tone(freqs, at, dur, gain, type, lp){
  if(!live()) return;
  try{
    const ctx = AUDIO.ctx, t = ctx.currentTime + (at || 0);
    for(const f of freqs){
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type || 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + 0.02); g.gain.setValueAtTime(gain, t + dur - 0.04); g.gain.linearRampToValueAtTime(0, t + dur);
      let n = o; if(lp){ const b = ctx.createBiquadFilter(); b.type = 'lowpass'; b.frequency.value = lp; o.connect(b); n = b; }
      n.connect(g); g.connect(AUDIO.sfxGain); o.start(t); o.stop(t + dur + 0.03);
    }
  }catch(e){}
}
function hiss(f, dur, gain, type){
  if(!live()) return;
  try{
    const ctx = AUDIO.ctx, t = ctx.currentTime, n = Math.floor(ctx.sampleRate * dur), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    for(let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
    const s = ctx.createBufferSource(); s.buffer = b; const fl = ctx.createBiquadFilter(); fl.type = type || 'lowpass'; fl.frequency.value = f;
    const g = ctx.createGain(); g.gain.value = gain; s.connect(fl); fl.connect(g); g.connect(AUDIO.sfxGain); s.start(t);
  }catch(e){}
}
const buzz = ()=>{ for(let r = 0; r < 3; r++) tone([150], r * 0.55, 0.36, 0.05, 'square', 420); if(typeof haptic === 'function') haptic([80, 60, 80, 60, 80]); };
const clank = ()=>{ hiss(260, 0.35, 0.5); tone([92, 61], 0, 0.5, 0.03, 'triangle'); };
const splash = ()=>hiss(900, 0.5, 0.25, 'bandpass');

/* ---------- every frame, playing or not: movers, cues, the river, the camera under dialogue ---------- */
const AL = [];
const alw = f => { AL.push(f); return f; };
const DIR = { fn:null, last:null, spk:null };
const TALKERS = {};
function direct(fn){ DIR.fn = fn; DIR.last = null; }
/* a second camera beat inside one line: runs only if that line is still on screen */
function later(ms, fn){ const L = DIR.last; setTimeout(()=>{ const ov = document.getElementById('screen-dialogue'); if(DIR.last === L && ov && ov.classList.contains('show')) fn(); }, ms); }
function director(){
  if(!DIR.fn || typeof DLG === 'undefined' || !DLG.script) return;
  const ov = document.getElementById('screen-dialogue'); if(!ov || !ov.classList.contains('show')) return;
  const L = DLG.script[DLG.idx]; if(!L || L === DIR.last) return;
  DIR.last = L;
  try{ talkAnim(L); DIR.fn(L, String(L.speaker || '').toUpperCase(), L.text || ''); }catch(e){ console.warn('[m15] cue', e); }
}
function always(dt){
  for(let i = AL.length - 1; i >= 0; i--){
    let r; try{ r = AL[i](dt); }catch(e){ console.warn('[m15] tick', e); r = false; }
    if(r === false) AL.splice(i, 1);
  }
  director();
  const playing = ENGINE.movementEnabled && !(typeof isOverlayOpen === 'function' && isOverlayOpen());
  if(!playing){
    for(const t of TR.tails) if(t.mode === 'walk' || t.mode === 'jog'){ t.mode = '-'; if(!t.ch.userData._moving15) V13.play(t.ch, t.ch.userData.base15 || 'idle', { fade:0.3 }); }
    if(V13.world && V13.world.update) V13.world.update(dt);
    if(TPCAM.override && typeof updateCamera === 'function') updateCamera();
  }
}
/* the one speaking gestures; everyone else settles back into their pose */
function talkAnim(L){
  const sp = String(L.speaker || '').toUpperCase(), thought = /^\(/.test(L.text || '');
  const f = TALKERS[sp], ch = (!thought && !L.phone && f) ? f() : null;
  if(DIR.spk && DIR.spk !== ch) settle(DIR.spk);
  if(ch && ch.userData && !ch.userData._moving15){ const b = ch.userData.base15 || 'idle'; const c = b === 'sit' ? 'sit_talk' : (b === 'idle' || b === 'folded') ? 'talk' : null; if(c) V13.play(ch, c, { fade:0.25 }); }
  DIR.spk = ch;
}
/* 'carry' is a walking clip: held almost still it is a man holding his hands out in front of him */
const clipOpt = (clip, fade)=>clip === 'carry' ? { fade, speed:0.03 } : { fade };
function settle(ch){ if(ch && ch.userData && !ch.userData._moving15){ const c = ch.userData.base15 || 'idle'; V13.play(ch, c, clipOpt(c, 0.3)); } }
function pose(ch, clip){ if(!ch || !ch.userData) return; ch.userData.base15 = clip; V13.play(ch, clip, clipOpt(clip, 0.3)); }

/* ---------- people move (our own mover: it keeps going under dialogue) ---------- */
const turnTo = (a, b, k)=>{ let d = b - a; while(d > PI) d -= 2 * PI; while(d < -PI) d += 2 * PI; return a + d * Math.min(1, k); };
const yawTo = (ch, x, z)=>Math.atan2(x - ch.position.x, z - ch.position.z);
function go(ch, path, opt){
  opt = opt || {};
  if(!ch || !ch.userData || !path || !path.length) return Promise.resolve(false);
  const tok = ch.userData._go15 = (ch.userData._go15 || 0) + 1;
  ch.userData._turn15 = (ch.userData._turn15 || 0) + 1;
  const sp = opt.speed || 1.35; let seg = 0, want = null;
  V13.play(ch, opt.clip || (sp > 2.6 ? 'jog' : 'walk'), { fade:0.2 });
  ch.userData._moving15 = true;
  return new Promise(res => alw(dt => {
    if(ch.userData._go15 !== tok){ res(false); return false; }
    let step = sp * dt;
    while(step > 0 && seg < path.length){
      const b = path[seg], dx = b[0] - ch.position.x, dz = b[1] - ch.position.z, d = Math.hypot(dx, dz);
      if(d <= step){ ch.position.x = b[0]; ch.position.z = b[1]; step -= d; seg++; }
      else { ch.position.x += dx / d * step; ch.position.z += dz / d * step; want = Math.atan2(dx, dz); step = 0; }
    }
    if(want != null) ch.rotation.y = turnTo(ch.rotation.y, want, dt * 9);
    if(seg >= path.length){
      ch.userData._moving15 = false;
      if(opt.end) ch.userData.base15 = opt.end;
      V13.play(ch, ch.userData.base15 || 'idle', clipOpt(ch.userData.base15, 0.3));
      if(opt.face != null) turn(ch, opt.face);
      res(true); return false;
    }
  }));
}
function halt(ch){ if(ch && ch.userData){ ch.userData._go15 = (ch.userData._go15 || 0) + 1; ch.userData._moving15 = false; } }
function turn(ch, rot){
  if(!ch || !ch.userData) return;
  const tok = ch.userData._turn15 = (ch.userData._turn15 || 0) + 1;
  alw(dt => {
    if(ch.userData._turn15 !== tok) return false;
    ch.rotation.y = turnTo(ch.rotation.y, rot, dt * 7);
    if(Math.abs(turnTo(ch.rotation.y, rot, 1) - ch.rotation.y) < 0.01){ ch.rotation.y = rot; return false; }
  });
}
const faceCh = (ch, o)=>{ if(ch && o) turn(ch, yawTo(ch, o.position.x, o.position.z)); };
function put(ch, x, z, rot){ if(!ch) return; halt(ch); ch.position.x = x; ch.position.z = z; if(rot != null){ ch.rotation.y = rot; if(ch.userData) ch.userData._turn15 = (ch.userData._turn15 || 0) + 1; } }
/* walks to a mark that a scene depends on; snapMarks() puts anyone still on the way onto it (slow devices) */
function walkTo(list, ch, path, o){ if(!ch) return; o = o || {}; list.push([ch, path[path.length - 1], o]); return go(ch, path, o); }
function snapMarks(list){ for(const [ch, p, o] of (list || [])) if(ch.userData && ch.userData._moving15){ put(ch, p[0], p[1], o.face); pose(ch, o.end || 'idle'); } }
function placePlayer(x, z, rot){
  const P = ENGINE.player; if(!P) return;
  P.position.x = x; P.position.z = z; if(rot != null){ P.rotation.y = rot; ENGINE.playerYaw = rot; ENGINE.cameraYaw = rot; }
  if(P.userData && P.userData.anim) P.userData.anim.play('idle', { fade:0.2 });
}

/* ---------- companions who walk where Kelechi walked (so nobody cuts through a railing) ---------- */
const TR = { c:[], base:0, tails:[] };
function trailReset(pts){
  TR.c.length = 0; TR.base = 0;
  for(const p of (pts || [])) TR.c.push({ x:p[0], z:p[1] });
  const P = ENGINE.player && ENGINE.player.position; if(P) TR.c.push({ x:P.x, z:P.z });
  for(const t of TR.tails) t.at = 0;
}
function trailTick(){
  const P = ENGINE.player && ENGINE.player.position; if(!P) return;
  const L = TR.c[TR.c.length - 1];
  if(!L || Math.hypot(P.x - L.x, P.z - L.z) > 0.4){ TR.c.push({ x:P.x, z:P.z }); if(TR.c.length > 700){ TR.c.shift(); TR.base++; } }
}
function tail(ch, gap){ const t = { ch, gap, on:true, held:false, at:TR.base, mode:'-' }; TR.tails.push(t); return t; }
function tailStep(t, dt){
  const ch = t.ch, C = TR.c, P = ENGINE.player && ENGINE.player.position;
  if(!t.on || !ch || !ch.parent || !C.length || !P) return;
  const mode = m => { if(t.mode !== m){ t.mode = m; V13.play(ch, m || (ch.userData.base15 || 'idle'), { fade:0.25 }); } };
  if(t.held){ mode(null); return; }
  let acc = Math.hypot(P.x - C[C.length - 1].x, P.z - C[C.length - 1].z), k = C.length - 1;
  while(k > 0 && acc < t.gap){ acc += Math.hypot(C[k].x - C[k - 1].x, C[k].z - C[k - 1].z); k--; }
  const goal = k + TR.base;
  if(t.at < TR.base) t.at = TR.base;
  for(let i = goal; i > t.at; i--){ const c = C[i - TR.base]; if(Math.hypot(c.x - ch.position.x, c.z - ch.position.z) < 0.7){ t.at = i; break; } }
  const dP = Math.hypot(P.x - ch.position.x, P.z - ch.position.z);
  if(t.at >= goal || dP < t.gap * 0.8){ mode(null); ch.rotation.y = turnTo(ch.rotation.y, Math.atan2(P.x - ch.position.x, P.z - ch.position.z), dt * 4); return; }
  const c = C[t.at - TR.base], dx = c.x - ch.position.x, dz = c.z - ch.position.z, d = Math.hypot(dx, dz);
  if(d < 0.12){ t.at++; return; }
  const far = (goal - t.at) > 10 || dP > t.gap + 4, sp = far ? 4.3 : 2.1, st = Math.min(d, sp * dt);
  ch.position.x += dx / d * st; ch.position.z += dz / d * st;
  ch.rotation.y = turnTo(ch.rotation.y, Math.atan2(dx, dz), dt * 10);
  mode(far ? 'jog' : 'walk');
}
const tailsOn = on => { for(const t of TR.tails){ t.on = on; t.mode = '-'; } };

/* ---------- the camera ---------- */
function shot(p, l, cut){ TPCAM.override = { pos:V3(p[0], p[1], p[2]), look:V3(l[0], l[1], l[2]) }; if(cut !== false){ TPCAM.cur = null; cullNow(TPCAM.override.pos); } }
/* the dialogue's portrait sits in the middle of the screen: put the subject at (sx, sy) of the frame instead (-1..1, +y up) */
function aim(cam, at, sx, sy){
  const vx = at[0] - cam[0], vy = at[1] - cam[1], vz = at[2] - cam[2], hd = Math.hypot(vx, vz);
  const fov = ((ENGINE.camera && ENGINE.camera.fov) || 55) * PI / 180, asp = innerWidth / Math.max(1, innerHeight);
  const tV = Math.tan(fov / 2), tH = tV * asp;
  const yaw = Math.atan2(vx, vz) + Math.atan(sx * tH), pit = Math.atan2(vy, hd) - Math.atan(sy * tV);
  return [cam[0] + Math.sin(yaw) * Math.cos(pit) * 6, cam[1] + Math.sin(pit) * 6, cam[2] + Math.cos(yaw) * Math.cos(pit) * 6];
}
function frame(cam, at, sx, sy, cut){ shot(cam, aim(cam, at, sx, sy == null ? 0.34 : sy), cut); }
function freeCam(){ TPCAM.override = null; TPCAM.cur = null; const P = ENGINE.player; if(P){ ENGINE.cameraYaw = P.rotation.y; ENGINE.playerYaw = P.rotation.y; cullNow(P.position); } }
/* over the shoulder of `from`, looking at `to` */
function ots(to, from, o){
  if(!to || !from) return;
  o = o || {};
  const a = to.position, b = from.position, dx = a.x - b.x, dz = a.z - b.z, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d;
  const side = o.side || 1, back = o.back != null ? o.back : 1.15, lat = (o.lat != null ? o.lat : 0.5) * side;
  frame([b.x - ux * back - uz * lat, o.h || 1.74, b.z - uz * back + ux * lat], [a.x, (a.y || 0) + (o.lookH || 1.55), a.z], o.sx != null ? o.sx : side * 0.34, o.sy, o.cut);
}
/* a slow move of the held shot */
function dolly(p0, p1, look, secs){
  shot(p0, look); let t = 0;
  const tok = DIR.dolly = (DIR.dolly || 0) + 1;
  alw(dt => {
    if(DIR.dolly !== tok || !TPCAM.override) return false;
    t += dt / secs; const k = Math.min(1, t), e = k * k * (3 - 2 * k);
    TPCAM.override.pos.set(p0[0] + (p1[0] - p0[0]) * e, p0[1] + (p1[1] - p0[1]) * e, p0[2] + (p1[2] - p0[2]) * e);
    return k < 1;
  });
}
const stopDolly = ()=>{ DIR.dolly = (DIR.dolly || 0) + 1; };

/* ---------- props ---------- */
function boneOf(ch, name){ let b = null; if(ch) ch.traverse(o => { if(!b && o.isBone && o.name === name) b = o; }); return b; }
let GMG = null;
function gmgMat(){
  if(GMG) return GMG;
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  x.fillStyle = '#ece7dc'; x.fillRect(0, 0, 128, 128);
  const band = (col, a, p, w)=>{ x.globalAlpha = a; x.fillStyle = col; x.fillRect(p, 0, w, 128); x.fillRect(0, p, 128, w); };
  for(let k = 0; k < 2; k++){ const o = k * 64; band('#c4262a', 0.5, o + 4, 14); band('#1e3a8c', 0.55, o + 26, 20); band('#c4262a', 0.35, o + 52, 5); }
  x.globalAlpha = 1; x.strokeStyle = 'rgba(0,0,0,0.07)';
  for(let i = 0; i < 128; i += 3){ x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 128); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.encoding = THREE.sRGBEncoding;
  return (GMG = new THREE.MeshStandardMaterial({ map:t, roughness:0.78, metalness:0 }));
}
let BAG = null;
const bagGeo = ()=>BAG || (BAG = new THREE.BoxGeometry(0.6, 0.34, 0.36));
/* many bags, one draw call: [x, y, z, yaw] */
function bagHeap(spots, max){
  const im = new THREE.InstancedMesh(bagGeo(), gmgMat(), Math.max(max || 0, spots.length));
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = V3(1, 1, 1);
  im.userData.spots = spots.slice();
  im.userData.set = (i, s)=>{ e.set(0, s[3] || 0, (s[4] || 0)); q.setFromEuler(e); m4.compose(V3(s[0], s[1], s[2]), q, one); im.setMatrixAt(i, m4); im.instanceMatrix.needsUpdate = true; };
  spots.forEach((s, i)=>im.userData.set(i, s));
  im.count = spots.length; im.frustumCulled = false;
  ENGINE.scene.add(im); return im;
}
/* the strongroom on the barge: Ghana-must-go to the ceiling, naira in shrink-wrap, dollars in bank bands */
function cashRoom(){
  const sc = ENGINE.scene, S = [];
  for(let col = 0; col < 4; col++) for(let row = 0; row < 6; row++){
    S.push([15.28, 0.17 + row * 0.34, -28.85 + col * 0.6 + (row % 2) * 0.08, PI / 2 + ((row + col) % 3 - 1) * 0.06]);
    if(row < 5) S.push([14.9, 0.17 + row * 0.34, -28.6 + col * 0.6 - (row % 2) * 0.1, PI / 2 + ((row + col) % 2 - 0.5) * 0.08]);
  }
  for(let col = 0; col < 2; col++) for(let row = 0; row < 5; row++) S.push([12.92 + col * 0.62, 0.17 + row * 0.34, -30.08, ((row + col) % 2 - 0.5) * 0.06]);
  [[13.3, 0.17, -27.05, 0.3], [13.9, 0.17, -27.0, -0.25], [13.55, 0.51, -27.08, 0.12], [14.45, 0.17, -27.1, 0.45]].forEach(s => S.push(s));
  const heap = bagHeap(S);
  const brick = new THREE.BoxGeometry(0.3, 0.13, 0.15);
  const naira = new THREE.MeshStandardMaterial({ color:'#8a6aa0', roughness:0.22, metalness:0.05 }), naira2 = new THREE.MeshStandardMaterial({ color:'#4f74b0', roughness:0.22, metalness:0.05 });
  const usd = new THREE.MeshStandardMaterial({ color:'#7f9a7c', roughness:0.5 }), band = new THREE.MeshStandardMaterial({ color:'#f2efe6', roughness:0.6 });
  const g = new THREE.Group(); sc.add(g);
  let n = 0;
  for(let layer = 0; layer < 3; layer++) for(let i = 0; i < 4 - layer; i++) for(let j = 0; j < 3; j++){
    const m = new THREE.Mesh(brick, (i + j + layer) % 2 ? naira : naira2); m.position.set(13.85 + i * 0.32 + layer * 0.16, 0.865 + layer * 0.13, -29.72 + j * 0.16); g.add(m); n++;
  }
  for(let i = 0; i < 6; i++){
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.07, 0.07), usd); m.position.set(14.0 + (i % 3) * 0.2, 0.84 + Math.floor(i / 3) * 0.07, -29.25); g.add(m);
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.072, 0.072), band); b.position.copy(m.position); g.add(b);
  }
  return { heap, g };
}
/* the river, falling */
function rain(n){
  const sc = ENGINE.scene, pos = new Float32Array(n * 6), c = (ENGINE.camera ? ENGINE.camera.position : V3(0, 2, 0));
  const seed = (a, i, cx, cy, cz)=>{ const r = 1.6 + Math.sqrt(Math.random()) * 15, t = Math.random() * PI * 2, x = cx + Math.cos(t) * r, z = cz + Math.sin(t) * r, y = cy - 4 + Math.random() * 15; const o = i * 6; a[o] = x; a[o + 1] = y; a[o + 2] = z; a[o + 3] = x + 0.03; a[o + 4] = y - 0.45; a[o + 5] = z + 0.015; };
  for(let i = 0; i < n; i++) seed(pos, i, c.x, c.y, c.z);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color:0x9cb4d8, transparent:true, opacity:0.34, depthWrite:false }));
  m.frustumCulled = false; m.renderOrder = 4; sc.add(m);
  return { m, update(dt){
    const cam = ENGINE.camera; if(!cam || !m.parent) return;
    const p = cam.position, a = g.attributes.position.array, f = 17 * dt;
    for(let i = 0; i < n; i++){
      const o = i * 6; a[o + 1] -= f; a[o + 4] -= f;
      if(a[o + 4] < -1 || Math.abs(a[o] - p.x) > 18 || Math.abs(a[o + 2] - p.z) > 18 || a[o + 1] > p.y + 14){ seed(a, i, p.x, p.y + 6, p.z); a[o + 1] = p.y + 3 + Math.random() * 9; a[o + 4] = a[o + 1] - 0.45; }
    }
    g.attributes.position.needsUpdate = true;
  } };
}
/* blue and red across the wet yard, in time with the beacons */
function beacons(){
  const l = new THREE.PointLight('#3a64ff', 0, 17, 2); l.position.set(0.3, 2.6, 19.4); ENGINE.scene.add(l);
  const blue = new THREE.Color('#3a64ff'), red = new THREE.Color('#ff2a2a');
  alw(()=>{
    if(!l.parent) return false;
    const ph = (((typeof VEH !== 'undefined' ? VEH.t : performance.now() / 1000)) * 1.6) % 1;
    const b = (ph < 0.12) || (ph > 0.2 && ph < 0.32), r = (ph > 0.5 && ph < 0.62) || (ph > 0.7 && ph < 0.82);
    l.intensity = b || r ? 1.5 : 0.15; l.color.copy(r ? red : blue);
  });
}
/* Godwin Ereba's umbrella: it follows his right hand and covers whoever he is covering */
function umbrella(holder, cover){
  const g = new THREE.Group(); ENGINE.scene.add(g);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 1, 6), new THREE.MeshStandardMaterial({ color:'#c8c4b8', metalness:0.6, roughness:0.35 }));
  shaft.geometry.translate(0, 0.5, 0); g.add(shaft);
  const can = new THREE.Mesh(new THREE.ConeGeometry(0.74, 0.32, 12, 1, true), new THREE.MeshStandardMaterial({ color:'#09090b', roughness:0.75, metalness:0, side:THREE.DoubleSide }));
  g.add(can);
  const U = { g, holder, cover, hand:boneOf(holder, 'hand_r') }, v = V3(0, 0, 0), top = V3(0, 0, 0), up = V3(0, 1, 0), dir = V3(0, 0, 0);
  alw(()=>{
    if(!g.parent || !holder.parent){ if(g.parent) g.parent.remove(g); return false; }
    g.visible = holder.visible !== false; if(!g.visible) return;
    if(U.hand) U.hand.getWorldPosition(v); else v.set(holder.position.x, 1.05, holder.position.z);
    const c = U.cover || holder;
    top.set(c.position.x * 0.62 + v.x * 0.38, 2.14, c.position.z * 0.62 + v.z * 0.38);
    dir.copy(top).sub(v); const len = Math.max(0.3, dir.length()); dir.normalize();
    g.position.copy(v); g.quaternion.setFromUnitVectors(up, dir);
    shaft.scale.y = len; can.position.set(0, len, 0);
  });
  return U;
}
/* a child of a bone that stays upright the way it was in the idle pose (the Senator's bowler) */
function onBone(bone, obj, upOffset){
  if(!bone) return false;
  bone.updateWorldMatrix(true, false);
  const q = new THREE.Quaternion(), s = V3(1, 1, 1); bone.getWorldQuaternion(q); bone.getWorldScale(s);
  const upL = V3(0, 1, 0).applyQuaternion(q.clone().invert()).normalize();
  obj.quaternion.setFromUnitVectors(V3(0, 1, 0), upL);
  const k = 1 / (s.x || 1);
  obj.position.copy(upL).multiplyScalar(upOffset * k); obj.scale.setScalar(k);
  bone.add(obj); return true;
}
function bowler(ch){
  const mat = new THREE.MeshStandardMaterial({ color:'#121214', roughness:0.5 }), g = new THREE.Group();
  const crown = new THREE.Mesh(new THREE.SphereGeometry(0.102, 14, 8, 0, PI * 2, 0, PI / 2), mat); crown.scale.set(1, 0.92, 1.06); crown.position.y = 0.01; g.add(crown);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.152, 0.152, 0.012, 18), mat); g.add(brim);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.104, 0.104, 0.026, 18), new THREE.MeshStandardMaterial({ color:'#4a1416', roughness:0.6 })); band.position.y = 0.022; g.add(band);
  if(!onBone(boneOf(ch, 'Head'), g, 0.165)){ g.position.set(0, 1.86, 0); ch.add(g); }
  return g;
}
function stick(ch){
  const g = new THREE.Group(); ENGINE.scene.add(g);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.013, 1, 6), new THREE.MeshStandardMaterial({ color:'#2a1a10', roughness:0.5 })); rod.geometry.translate(0, 0.5, 0); g.add(rod);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), new THREE.MeshStandardMaterial({ color:'#dcdcd6', metalness:0.85, roughness:0.25 })); g.add(knob);
  const hand = boneOf(ch, 'hand_r'), v = V3(0, 0, 0), base = V3(0, 0, 0), up = V3(0, 1, 0), dir = V3(0, 0, 0);
  alw(()=>{
    if(!ch.parent){ if(g.parent) g.parent.remove(g); return false; }
    g.visible = ch.visible !== false && !g.userData.off; if(!g.visible) return;
    if(hand) hand.getWorldPosition(v); else v.set(ch.position.x, 0.9, ch.position.z);
    base.set(v.x + Math.sin(ch.rotation.y) * 0.12, 0.01, v.z + Math.cos(ch.rotation.y) * 0.12);
    dir.copy(v).sub(base); const len = Math.max(0.3, dir.length()); dir.normalize();
    g.position.copy(base); g.quaternion.setFromUnitVectors(up, dir); rod.scale.y = len; knob.position.set(0, len, 0);
  });
  return g;
}
/* a guard's torch: the beam shows where he is looking */
let POOL = null;
function torch(ch){
  const geo = new THREE.CylinderGeometry(0.5, 0.04, 3.6, 10, 1, true); geo.translate(0, 1.8, 0); geo.rotateX(PI / 2); geo.rotateX(0.3);
  const beam = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color:'#fff0c4', transparent:true, opacity:0.09, depthWrite:false, blending:THREE.AdditiveBlending, toneMapped:false }));
  beam.position.set(0.16, 1.2, 0.24); beam.renderOrder = 3; ch.add(beam);
  if(!POOL){ const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 1, 32, 32, 31); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.5, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); POOL = new THREE.CanvasTexture(c); }
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map:POOL, color:'#ffe9b8', transparent:true, opacity:0.55, depthWrite:false, blending:THREE.AdditiveBlending, toneMapped:false }));
  pool.rotation.x = -PI / 2; pool.scale.set(1.9, 3.0, 1); pool.position.set(0.1, 0.04, 4.3); pool.renderOrder = 2; ch.add(pool);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), new THREE.MeshBasicMaterial({ color:'#fff6dc', toneMapped:false })); bulb.position.copy(beam.position); ch.add(bulb);
  return { beam, bulb, pool, off(){ beam.visible = false; bulb.visible = false; pool.visible = false; } };
}
function vehicle(type, x, z, rot, o){
  if(typeof VEH === 'undefined' || !VEH.ready || !VEH.types[type]) return null;
  o = o || {};
  const v = VEH.spawn(type, { color:o.color, lights:o.lights || 'off', beacons:false, glow:o.glow }); if(!v) return null;
  v.position.set(x, 0, z); v.rotation.y = rot; ENGINE.scene.add(v);
  if(o.w && typeof addObstacle === 'function'){ const c = Math.abs(Math.cos(rot)), s = Math.abs(Math.sin(rot)); addObstacle(x, z, o.w * c + o.l * s, o.w * s + o.l * c); }
  return v;
}
/* a bag thrown over the north rail into the Bonny River */
function throwBag(from){
  const m = new THREE.Mesh(bagGeo(), gmgMat()); ENGINE.scene.add(m);
  const a = V3(from.x, 1.2, from.z), b = V3(from.x + (Math.random() - 0.5) * 1.6, -0.7, from.z - 2.6 - Math.random() * 1.4); let t = 0;
  alw(dt => {
    t += dt / 0.95; const k = Math.min(1, t);
    m.position.lerpVectors(a, b, k); m.position.y = a.y + (b.y - a.y) * k + Math.sin(PI * k) * 1.1; m.rotation.x += dt * 5; m.rotation.z += dt * 3;
    if(k >= 1){ m.parent && m.parent.remove(m); splash(); return false; }
  });
}
function rampLight(l, to, secs){
  if(!l) return; const from = l.intensity; let t = 0;
  alw(dt => { t += dt / secs; const k = Math.min(1, t); l.intensity = from + (to - from) * k * k * (3 - 2 * k); return k < 1; });
}
const cashDoor = v => { if(!V13.world) return; V13.world.open('cashdoor', v); V13.world.open('cash', v); };   // v13_world keys the barge door as 'cash'
function unblockGate(){
  ENGINE.obstacles = (ENGINE.obstacles || []).filter(o => !(Math.abs((o.minX + o.maxX) / 2 - 0.1) < 0.06 && Math.abs((o.minZ + o.maxZ) / 2 - 23.55) < 0.06));
}
function objText(id, text){ const o = (S.game.objectives || []).find(x => x.id === id); if(o){ o.text = text; if(typeof renderObjectives === 'function') renderObjectives(); } }
function controls(on){
  ENGINE.movementEnabled = !!on; showHUD(!!on);
  if(on) freeCam();
  else {
    const wl = document.getElementById('world-label'); if(wl) wl.style.display = 'none'; if(typeof showPrompt === 'function') showPrompt(null);
    const t = document.getElementById('toast'); if(t) t.classList.remove('show');      // a walking hint has no business over a cutscene
  }
}

/* ---------- looks ---------- */
const SKINS = ['#3e2418', '#4a2b1c', '#5a3826', '#4e2e1e', '#6a4228'];
const LOOK = {
  hauwa:()=>V13.look('hauwa', { gear:['Gear_F_Bun'], skirt:'#151515', hips:'#151515', thigh:'#151515' }),        // her cast 'wrap' is a head-tie, not a wrapper skirt
  ibinabo:()=>V13.look('ibinabo', { gele:'#c83a2a' }),
  acp:()=>V13.look('acp', { gear:['Gear_Tactical', 'Gear_Beret'], vest:'#141416', text:'TASK FORCE' }),
  tf:i=>V13.look('acp', { skin:SKINS[i % 5], gear:['Gear_Tactical', 'Gear_Beret'], vest:'#141416', text:'TASK FORCE', torso:'#20242c', armA:'#20242c', armB:'#20242c', armC:'#20242c' }),
  guard:i=>V13.look('security', { skin:SKINS[(i + 2) % 5] }),
  loader:i=>{ const c = ['#5a4a3a', '#2f5a6a', '#6a3a2a'][i % 3]; return { body:'M', skin:SKINS[(i + 1) % 5], hair:'#0c0a09', torso:c, armA:c, armB:c, armC:null, hips:'#2a2622', thigh:'#2a2622', shin:'#2a2622', shoe:'#16120e', gear:i === 1 ? ['Gear_Fila'] : [], cap:'#3a3a3a' }; },
  crew:()=>({ body:'M', skin:'#3e2418', hair:'#0c0a09', torso:'#c85a18', armA:'#c85a18', armB:'#c85a18', armC:'#c85a18', hips:'#c85a18', thigh:'#c85a18', shin:'#c85a18', shoe:'#16120e', gear:['Gear_Fila'], cap:'#c85a18' }),
  senator:()=>V13.look('senator', { gear:['Gear_Kaftan'], robe:'#ece6d2', trim:'#c8b88a', hips:'#ece6d2', thigh:'#ece6d2', shin:'#ece6d2' }),
  boatman:i=>i === 0 ? V13.look('boatman') : Object.assign(V13.crowdLook(i + 4), { body:'M', gear:[] }),
  police:i=>{ const c = '#1d2438'; return { body:'M', skin:SKINS[i % 5], hair:'#0c0a09', torso:c, armA:c, armB:c, armC:c, hips:c, thigh:c, shin:c, shoe:'#0e0e10', gear:['Gear_Beret'], beret:'#141418', cap:'#141418' }; },
};
function suit(){
  if(!(typeof ART !== 'undefined' && ART.ready && typeof PEOPLE !== 'undefined')) return buildPlayerMesh();
  const c = '#1c2433';
  const k = PEOPLE.make('kelechi', { gear:[], vest:null, text:null, torso:c, armA:c, armB:c, armC:c, hips:c, thigh:c, shin:c, shoe:'#0e0e10' });
  k.userData.isPlayer = true; return k;
}
const CAST = [];
function man(look, x, z, rot, clip, opt){
  const ch = V13.person(look, { x, z, rot }, Object.assign({ clip:clip || 'idle', solid:false }, opt || {}));
  if(ch && ch.userData) ch.userData.base15 = clip || 'idle';
  if(ch) CAST.push(ch);
  return ch;
}
/* people far from the lens are not drawn (software renderers choke on a crowd of skinned meshes) */
function cullNow(c){
  // where the lens is going, not where it was (a cut lands on the next camera update, after this tick)
  c = c || (TPCAM.override ? TPCAM.override.pos : (ENGINE.player && ENGINE.player.position) || (ENGINE.camera && ENGINE.camera.position)); if(!c) return;
  for(const ch of CAST){ if(!ch.parent) continue; const d = Math.hypot(ch.position.x - c.x, ch.position.z - c.z); ch.visible = d < (ch.visible ? 36 : 33); }
}
function cullTick(){
  let t = 0;
  alw(dt => { if((t += dt) < 0.25) return; t = 0; cullNow(); });
}

/* ---------- state from earlier in the season ---------- */
function sources(){
  const m = MC(), quiet = c => !!(V13.src && V13.src(c) && V13.srcExposed && V13.srcExposed(c));
  return {
    ibinabo:m.s2_ibinabo === 'source',
    bitrus:(m.s2_bitrus === 'witness' || m.s2_bitrus === 'photo') && !quiet('GATE'),
    karo:m.s2_karo === 'trust' && !quiet('HERBS'),
    felix:m.s2_felix === 'cooperating',
  };
}
const EV_S2 = ()=>Object.keys(V13.S2_WHY_NOT || {});
const cand = id => (V13.S2_CANDIDATES || []).find(c => c.id === id) || { id, name:'someone else', role:'', art:'' };
function artFor(id){
  const P = (typeof PORTRAIT_ART !== 'undefined') ? PORTRAIT_ART : {};
  if(!id) return '';
  if(P[id]) return id;
  const base = String(id).replace(/_(neutral|afraid|angry|evasive|relieved)$/, '');
  if(P[base + '_neutral']) return base + '_neutral';
  if(V13.CAST && V13.CAST[base] && V13.portraits){ try{ V13.portraits(); }catch(e){} if(P[base + '_neutral']) return base + '_neutral'; }
  return id;
}
const artSrc = id => { const P = (typeof PORTRAIT_ART !== 'undefined') ? PORTRAIT_ART : {}; return P[artFor(id)] || ''; };

/* =========================================================================
   THE CASE
   ========================================================================= */
V13.defCase('m15', {
  title:'The Barge', region:'Rivers', sub:'Riverstone Jetty · 23:30', evMax:2, xp:500, ambient:'rain',
  objectives:()=>[
    { id:'o15_brief', text:'Hear the plan: Okundaye, Barrister Danladi and Uche' },
    { id:'o15_go', text:'Tell Uche how we go in' },
    { id:'o15_in', text:'Get onto the Riverstone jetty' },
    { id:'o15_board', text:'Reach TEKENA 2\'s gangway before they see a warrant' },
    { id:'o15_cash', text:'Find the cash on TEKENA 2' },
    { id:'o15_senator', text:'The Senator is on the jetty' },
    { id:'o15_name', text:'Monday: put a name in the blank' },
  ],
  reset(){
    const m = MC(), f = S.game.flags || {};
    for(const k of ['s2_raid_entry', 's2_end']){ delete m[k]; delete f[k]; }
    const s = S2(); delete s.finale; delete s.seal15; delete s.acc15;
    const drop = ['barge_cash', 'senator_words'];
    if(Array.isArray(S.game.evidence)) S.game.evidence = S.game.evidence.filter(e => !(e && drop.includes(e.id)));
    if(S.game.evQ) for(const id of drop) delete S.game.evQ[id];
    V13._s2Epi = false;
  },
  build(){
    AL.length = 0; DIR.fn = null; DIR.last = null; DIR.spk = null; TR.c.length = 0; TR.base = 0; TR.tails.length = 0; GMG = null; BAG = null; POOL = null; CAST.length = 0;
    for(const k in TALKERS) delete TALKERS[k];
    const m = MC(), R = RT();
    R.src = sources(); R.suspended = m.s2_ninth === 'refuse';
    R.recording = m.s2_wire === true;                       // the pen from the ninth floor is still in his pocket
    V13.scene(K, { start:'start', player:()=>R.suspended ? V13.plainClothes() : buildPlayerMesh() });
    ENGINE.sceneAlways = always;
    const gfx = typeof currentGfx === 'function' ? currentGfx() : 'medium';
    R.rain = rain(gfx === 'low' ? 300 : 650); alw(dt => { R.rain.update(dt); });
    beacons();
    const D = (R.dr && R.dr.D) || {};
    R.cashL = D.L_cash || null; if(R.cashL){ R.cashL.userData.i15 = R.cashL.intensity; R.cashL.intensity = 0; }
    // the yard is baked under sodium floodlights; people (lit live) would stand on it as black cut-outs, so warm the fill
    for(const o of ENGINE.scene.children) if(o.isHemisphereLight){ o.intensity = 0.78; o.color.set('#7a6a66'); o.groundColor.set('#2a1d14'); }
    stageRoad(); stageGate(); stageJetty();
    TALKERS[OSA] = ()=>R.osagie; TALKERS[HAU] = ()=>R.hauwa; TALKERS[UCHE] = ()=>R.uche; TALKERS[IBI] = ()=>R.ibi;
    TALKERS[TFC] = ()=>R.acp; TALKERS[SEN] = ()=>R.sen; TALKERS[KEL] = ()=>ENGINE.player;
    V13.every(dt => { trailTick(); for(const t of TR.tails) tailStep(t, dt); });
    cullTick();
    if(V13.prefetch) V13.prefetch(['env_' + KO]);
    V13._c15 = { R, AL, TR, DIR, go, put, shot, monday, sealScreen, accuseScreen, caseCard, judge, radio, byGate, clock };   // debug handles (probes)
  },
  start(){ brief(); },
});

/* ---------- the road outside the gate: the team, in the rain ---------- */
const ROAD = { k:[7.55, 29.35], osa:[5.95, 29.5], hau:[6.6, 28.3], uche:[7.15, 30.75], ibi:[5.6, 30.5], bag:[8.65, 31.0] };
function stageRoad(){
  const R = RT(), c = { x:6.65, z:29.45 };
  R.spare = new THREE.PointLight('#ffd6a0', 1.6, 13, 2); R.spare.position.set(7.4, 4.4, 32.3); ENGINE.scene.add(R.spare);     // a street lamp over the team; later the strongroom's light
  const face = p => Math.atan2(c.x - p[0], c.z - p[1]);
  placePlayer(ROAD.k[0], ROAD.k[1], -PI / 2);
  R.osagie = man('osagie', ROAD.osa[0], ROAD.osa[1], PI / 2, 'folded', { id:'osagie' });
  R.hauwa = man(LOOK.hauwa(), ROAD.hau[0], ROAD.hau[1], face(ROAD.hau), 'idle', { id:'hauwa' });
  R.uche = V13.person({}, { x:ROAD.uche[0], z:ROAD.uche[1], rot:face(ROAD.uche) }, { kind:'uche', clip:'idle', solid:false }); R.uche.userData.base15 = 'idle'; CAST.push(R.uche);
  if(R.src.ibinabo) R.ibi = man(LOOK.ibinabo(), ROAD.ibi[0], ROAD.ibi[1], face(ROAD.ibi), 'folded', { id:'ibinabo' });
  // Uche's kit bag on the kerb
  const bag = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.3, 0.34), new THREE.MeshStandardMaterial({ color:'#1e2430', roughness:0.8 }));
  bag.position.set(ROAD.bag[0], 0.15, ROAD.bag[1]); bag.rotation.y = 0.4; ENGINE.scene.add(bag); R.kitBag = bag;
}
/* ---------- the gate: the Director-General's task force, inside the bars ---------- */
function stageGate(){
  const R = RT();
  R.acp = man(LOOK.acp(), 0.05, 21.1, 0, 'folded', { id:'acp' });
  R.tf = [[-1.25, 21.7, 0.05], [1.35, 21.55, -0.05], [2.75, 21.1, -0.25], [-2.6, 21.2, 0.25]].map((p, i)=>man(LOOK.tf(i), p[0], p[1], p[2], i % 2 ? 'folded' : 'idle'));
  R.gateGuards = [[-5.4, 22.0, 0.5], [5.3, 21.6, -0.45]].map((p, i)=>man(LOOK.guard(i + 3), p[0], p[1], p[2], 'folded'));
}
/* ---------- the jetty: the barge, its cash, the loaders, the guards, the Senator ---------- */
const LOAD_PATH = [[2.6, -22.3], [5.6, -23.45], [6.95, -24.2], [6.95, -25.75], [7.5, -26.6], [10.2, -27.15], [10.75, -27.35]];
const PILE = [[10.95, 0.17, -26.95, 0.2], [11.55, 0.17, -27.05, -0.15], [11.2, 0.51, -27.0, 0.05], [10.9, 0.17, -27.55, PI / 2 + 0.1], [11.5, 0.17, -27.6, PI / 2 - 0.2],
              [11.25, 0.51, -27.55, PI / 2], [10.95, 0.85, -27.3, 0.3], [11.55, 0.51, -27.3, -0.3], [11.9, 0.17, -27.3, PI / 2], [11.25, 0.85, -27.05, -0.1]];
function stageJetty(){
  const R = RT();
  // the strongroom's last load, and the van it came in
  R.van = vehicle('vanP', -1.9, -21.3, PI / 2, { lights:'tail', w:2.1, l:5.2 });
  R.suv = vehicle('suv', 12.2, -21.4, PI, { color:'#141416', w:2.1, l:4.9 });
  R.vanPile = bagHeap([[1.05, 0.17, -20.85, 0.2], [1.6, 0.17, -21.3, -0.3], [1.1, 0.17, -21.5, PI / 2], [1.3, 0.51, -21.15, 0.1], [1.7, 0.17, -21.85, 0.4], [1.2, 0.51, -21.6, -0.2]]);
  R.pile = bagHeap(PILE.slice(0, 5), PILE.length);
  R.cash = cashRoom();
  // the Senator under his umbrella, watching the loading; his driver holding it
  R.sen = man(LOOK.senator(), 4.6, -24.8, PI, 'idle', { id:'senator', solid:true, r:0.5 });
  R.ereba = man('ereba', 4.02, -24.42, PI - 0.25, 'idle', { id:'ereba', solid:true, r:0.45 });
  R.hat = bowler(R.sen); R.stick = stick(R.sen); R.umb = umbrella(R.ereba, R.sen);
  // three torches on the jetty
  R.guards = [
    { ch:man(LOOK.guard(0), 8.4, -24.35, 0, 'idle'), kind:'post' },
    { ch:man(LOOK.guard(1), -3.4, -22.85, PI / 2, 'walk'), kind:'patrol', a:[-3.4, -22.85], b:[9.4, -22.85], dir:1, wait:0 },
    { ch:man(LOOK.guard(2), -7.6, -24.9, 0.55, 'idle'), kind:'pier' },
  ];
  R.guards.forEach(g => { g.torch = torch(g.ch); });
  // the loaders: van to barge and back
  R.loaders = [0, 1].map(i => {
    const ch = man(LOOK.loader(i), i ? LOAD_PATH[6][0] : 1.35, i ? LOAD_PATH[6][1] : -21.55, i ? -PI / 2 : 0, 'walk');
    const bag = new THREE.Mesh(bagGeo(), gmgMat()); bag.position.set(0, 1.0, 0.36); bag.rotation.y = PI / 2; ch.add(bag);
    return { ch, bag, i, leg:i ? 'back' : 'pick', t:i ? 0 : 0.8, seg:0 };
  });
  R.stacker = man(LOOK.loader(2), 11.1, -27.95, PI / 2, 'interact');
  R.crew = man(LOOK.crew(), 9.7, -30.6, PI, 'idle');
  alw(dt => jettyTick(dt));                                       // the loading goes on under the dialogue too
}
/* the loading runs, the guards look about (only while the jetty doesn't know) */
function jettyTick(dt){
  const R = RT(); if(R.boarded) return false;
  if(!R.made){
    for(const L of R.loaders) loaderStep(L, dt);
    R.stT = (R.stT || 0) + dt; if(R.stT > 3.4){ R.stT = 0; V13.once(R.stacker, 'pickup', 'interact'); }
  }
  R.gT = (R.gT || 0) + dt;
  const [A, B, C] = R.guards;
  if(!R.made){
    A.ch.rotation.y = turnTo(A.ch.rotation.y, (R.gT % 9) < 5 ? 0 : -PI / 2, dt * 2.4);
    C.ch.rotation.y = turnTo(C.ch.rotation.y, (R.gT % 12) < 6 ? 0.55 : PI - 0.35, dt * 1.9);
    patrol(B, dt);
  }
}
function patrol(G, dt){
  const ch = G.ch;
  if(G.wait > 0){ G.wait -= dt; ch.rotation.y = turnTo(ch.rotation.y, 0, dt * 2.5); if(G.wait <= 0) V13.play(ch, 'walk', { fade:0.25 }); return; }
  const tgt = G.dir > 0 ? G.b : G.a, dx = tgt[0] - ch.position.x, dz = tgt[1] - ch.position.z, d = Math.hypot(dx, dz);
  if(d < 0.05){ G.dir = -G.dir; G.wait = 2.4; V13.play(ch, 'idle', { fade:0.3 }); return; }
  const st = Math.min(d, 1.05 * dt); ch.position.x += dx / d * st; ch.position.z += dz / d * st;
  ch.rotation.y = turnTo(ch.rotation.y, Math.atan2(dx, dz), dt * 6);
}
function loaderStep(L, dt){
  const ch = L.ch;
  if(L.t > 0){ L.t -= dt; return; }
  const path = L.leg === 'carry' ? LOAD_PATH : L.leg === 'back' ? LOAD_PATH.slice().reverse().concat([[1.35, -21.55]]) : null;
  if(!path){                                                   // pick up a bag at the van
    L.leg = 'carry'; L.seg = 0; L.bag.visible = true; V13.once(ch, 'pickup', 'walk'); L.t = 1.0; return;
  }
  const b = path[L.seg], dx = b[0] - ch.position.x, dz = b[1] - ch.position.z, d = Math.hypot(dx, dz);
  if(L.anim !== 'walk' && L.t <= 0){ L.anim = 'walk'; V13.play(ch, 'walk', { fade:0.25 }); }
  if(d < 0.05){
    L.seg++;
    if(L.seg >= path.length){
      if(L.leg === 'carry'){                                   // drop it on the pile by the steel door
        L.bag.visible = false; L.leg = 'back'; L.seg = 0; L.t = 0.9; L.anim = null; V13.once(ch, 'pickup', 'idle');
        const R = RT(); if(R.pile && R.pile.count < PILE.length){ R.pile.userData.set(R.pile.count, PILE[R.pile.count]); R.pile.count++; }
      } else { L.leg = 'pick'; L.seg = 0; L.t = 0.4; L.anim = null; V13.play(ch, 'idle'); }
    }
    return;
  }
  const st = Math.min(d, 1.25 * dt); ch.position.x += dx / d * st; ch.position.z += dz / d * st;
  ch.rotation.y = turnTo(ch.rotation.y, Math.atan2(dx, dz), dt * 8);
}

/* =========================================================================
   23:30 — THE BRIEF
   ========================================================================= */
function brief(){
  const R = RT();
  controls(false);
  dolly([1.6, 4.4, -45], [3.4, 3.2, -38.5], [6.2, 0.7, -27.2], 9);
  const key = V13.C && V13.C.brief15 ? V13.C.brief15(R.src) : 'm15_brief';
  if(DIALOGUE[key] && DIALOGUE.m15_x_seal_offer) DIALOGUE[key] = DIALOGUE[key].concat(DIALOGUE.m15_x_seal_offer);
  V13._call = /BITRUS|MAMA KARO/;
  direct(briefCue);
  setTimeout(()=>V13.say(key, ()=>{
    V13._call = null; direct(null); stopDolly(); settle(ENGINE.player);
    V13.done('o15_brief');
    afterBrief();
  }), 1400);
}
function briefCue(l, sp, text){
  const R = RT(), P = ENGINE.player;
  if(sp === SYS && /Bonny River/.test(text)) return;                       // the establishing dolly holds
  stopDolly();
  if(l.phone){ pose(P, 'phone'); frame([9.4, 1.75, 31.1], [7.55, 1.6, 29.35], -0.3, 0.3); return; }
  if(P.userData.base15 === 'phone') pose(P, 'idle');
  if(sp === OSA) ots(R.osagie, P, { side:1 });
  else if(sp === HAU) ots(R.hauwa, P, { side:-1, back:1.0 });
  else if(sp === UCHE) ots(R.uche, P, { side:1, back:1.0 });
  else if(sp === IBI && R.ibi) ots(R.ibi, P, { side:-1 });
  else if(sp === KEL) ots(P, R.osagie, { side:-1 });
  else shot([10.8, 2.3, 31.6], [4.2, 1.2, 27.4]);
}
function afterBrief(){
  const R = RT();
  controls(true);
  R.itSeal = V13.talk(R.osagie, 'Seal a name with Commander Okundaye', it => {
    sealScreen(sealed => {
      if(!sealed) return;
      V13.drop(it); R.itSeal = null;
      direct((l, sp)=>{ if(sp === OSA) ots(R.osagie, ENGINE.player, { side:1, cut:true }); });
      controls(false); V13.once(R.osagie, 'interact', 'folded');
      V13.say('m15_x_seal_done', ()=>{ direct(null); controls(true); });
    });
  }, { optional:true, range:2.1 });
  R.itKit = V13.spot({ x:ROAD.bag[0], y:0.4, z:ROAD.bag[1] }, 'Take a body-camera from Uche\'s bag', it => {
    V13.drop(it); R.itKit = null; R.cam = true; R.recording = true;
    if(typeof sfxClick === 'function') sfxClick(); tone([1320], 0, 0.08, 0.04);
    V13.toast('BODY-CAMERA', (R.suspended ? 'Clipped to your shirt pocket' : 'Clipped to your vest') + '. The red light is on.', 2400);
  }, { optional:true, verb:'collect', range:1.9 });
  R.itGo = V13.talk(R.uche, 'Tell Uche how we go in', it => { V13.drop(it); entry(); }, { range:2.1 });
  if(MC().s2_wire === true) setTimeout(()=>{ if(RT() === R) V13.toast('THE PEN', 'Still in your breast pocket from the ninth floor. You click it on.', 2800); }, 700);
  else setTimeout(()=>{ if(RT() === R && !R.cam && R.itKit) V13.radio('SGT. UCHE', radio('kit'), 5200); }, 900);
}

/* ---------- Okundaye's envelope (the sealed accusation, Season 2) ---------- */
/* the kit's own probes find these sheets by the old .acc-* classes and button ids: give the paper sheet's buttons both */
function compat(ov, fileId, cancelId){
  if(!ov) return;
  ov.querySelectorAll('.cw-card[data-k="who"]').forEach(b => { b.dataset.id = b.dataset.v; b.classList.add('acc-card'); });
  ov.querySelectorAll('.cw-opt[data-k="ev"]').forEach(b => { b.dataset.id = b.dataset.v; b.classList.add('acc-item'); });
  const f = ov.querySelector('[data-act="file"]'); if(f && fileId) f.id = fileId;
  const c = ov.querySelector('[data-act="cancel"]'); if(c && cancelId) c.id = cancelId;
}
const candOpts = C => C.map(c => ({ id:c.id, name:c.name, line:c.role, img:artSrc(c.art) }));
function sealScreen(done){
  const C = V13.S2_CANDIDATES || [];
  let over = false;
  const close = ok => { if(over) return; over = true; modalEnd('screen-seal15'); showOverlay(null); controls(true); if(done) done(ok); };
  const seal = who => { S2().seal15 = { who, before:true, t:Date.now() }; if(V12 && V12.log) V12.log('seal15', { who }); close(true); };
  controls(false);
  if(window.CW && typeof CW.sheet === 'function'){
    // (R06) on the beta's paper sheet, as Season 1's accusation is: numbered sections, 44px targets, the two-tap arm
    const sh = CW.sheet({
      id:'screen-seal15', cls:'s2-seal15', title:'A SEALED ENVELOPE', meta:'FRIDAY · 23:41 · THE ROAD OUTSIDE RIVERSTONE',
      lead:'Okundaye holds out an envelope in the rain. <i>"Just the name. I won\'t open it until Monday."</i> If you\'re right, a court hears that you knew before anyone told you. If you\'re wrong, it counts against you. You don\'t have to: you can walk onto that jetty with an open mind.',
      sections:[{ key:'who', label:'THE NAME', q:'Who kept Adaeze safe for twenty years?', kind:'cards', options:candOpts(C) }],
      warn:'Once it is sealed, it stays sealed until Monday.', cancelLabel:'NOT TONIGHT', fileLabel:'SEAL IT', armLabel:'TAP AGAIN — SEALED FOR GOOD', stamp:'SEALED', stampMs:400,
      onCancel:()=>close(false), onFile:out => seal(out.who),
    });
    compat(sh && sh.ov, 's15-go', 's15-no');
  } else {
    // without the casework layer: the old markup, on our colours
    let ov = document.getElementById('screen-seal15');
    if(!ov){ ov = V13.el('div', 'overlay', ''); ov.id = 'screen-seal15'; document.getElementById('game-root').appendChild(ov); }
    let who = null;
    const draw = ()=>{
      ov.innerHTML = `<div class="overlay-bg"></div><div class="acc-frame" role="dialog" aria-label="A sealed envelope">
        <div class="acc-head"><div class="plan-k">FRIDAY · 23:41 · THE ROAD OUTSIDE RIVERSTONE</div><div class="plan-t">A SEALED ENVELOPE</div>
          <p class="acc-lead">Okundaye holds out an envelope in the rain. <i>"Just the name. I won't open it until Monday."</i> If you're right, a court hears that you knew before anyone told you. If you're wrong, it counts against you.</p></div>
        <div class="acc-body"><div class="acc-step"><div class="v12-step-h"><b>1</b> WHO KEPT ADAEZE SAFE FOR TWENTY YEARS?</div>
          <div class="acc-grid">${C.map(c => `<button class="acc-card ${who === c.id ? 'sel' : ''}" data-id="${c.id}"><img src="${artSrc(c.art)}" alt=""><b>${esc(c.name)}</b><span>${esc(c.role)}</span></button>`).join('')}</div></div></div>
        <div class="acc-foot"><span class="ops-p">You don't have to. You can walk onto that jetty with an open mind.</span>
          <span class="a15-foot2"><button class="btn ghost" id="s15-no">NOT TONIGHT</button><button class="btn primary" id="s15-go" ${who ? '' : 'disabled'}>SEAL IT</button></span></div>
      </div>`;
      ov.querySelectorAll('.acc-card').forEach(b => b.addEventListener('click', ()=>{ who = b.dataset.id; if(typeof sfxClick === 'function') sfxClick(); draw(); }));
      ov.querySelector('#s15-no').addEventListener('click', ()=>close(false));
      const go = ov.querySelector('#s15-go');
      go.addEventListener('click', ()=>{
        if(!who) return;
        if(!go.dataset.armed){ go.dataset.armed = '1'; go.textContent = 'TAP AGAIN — SEALED FOR GOOD'; return; }
        seal(who);
      });
    };
    draw(); showOverlay('screen-seal15');
  }
  // (R04) a decision: Esc does nothing here; if the pause menu opens over it, RESUME puts it back
  modal('screen-seal15', { onEsc:null });
}

/* ---------- the way in ---------- */
function entry(){
  const R = RT();
  controls(false);
  direct((l, sp)=>{ if(sp === UCHE) ots(R.uche, ENGINE.player, { side:1, cut:true }); else if(sp === KEL) ots(ENGINE.player, R.uche, { side:-1 }); });
  const key = V13.C && V13.C.entry15 ? V13.C.entry15(R.src.ibinabo) : (R.src.ibinabo ? 'm15_entry' : 'm15_entry_gate');
  V13.say(key, ()=>{
    direct(null);
    if(key === 'm15_entry' && !MC().s2_raid_entry && pickedFlag('m15_entry', 's2_raid_entry')) V13.setFlag('s2_raid_entry', pickedFlag('m15_entry', 's2_raid_entry'));
    if(key !== 'm15_entry' || !MC().s2_raid_entry) V13.setFlag('s2_raid_entry', 'gate');
    if(R.itSeal){ V13.drop(R.itSeal); R.itSeal = null; }
    if(R.itKit){ V13.drop(R.itKit); R.itKit = null; }
    if(R.spare){ R.spare.intensity = 0; R.spare.distance = 5.2; R.spare.color.set('#ffd27a'); R.spare.position.set(13.9, 1.85, -28.3); }
    V13.done('o15_go');
    if(MC().s2_raid_entry === 'water') byWater(); else byGate();
  });
}

/* =========================================================================
   THE GATE — the task force behind the bars
   ========================================================================= */
function byGate(){
  const R = RT();
  objText('o15_in', 'The gate: get past the Director-General\'s task force');
  controls(true);
  trailReset();
  R.tOsa = tail(R.osagie, 1.7); R.tHau = tail(R.hauwa, 2.5); R.tUche = tail(R.uche, 3.3);
  if(R.ibi) pose(R.ibi, 'folded');
  V13.toast('THE GATE', rec() ? 'West along the road. Blue lights behind the bars.' : 'Blue lights behind the bars.', 2400);
  V13.every(()=>{ const P = ENGINE.player.position; if(P.z < 27.4 && Math.abs(P.x) < 4.6){ standoff(); return false; } });
}
/* borrow the strongroom's lamp for the gate: the faces behind the bars, lit from the road (R.lampHome() puts it back) */
function lampAtGate(){
  const R = RT(), L = R.spare; if(!L || R.lampHome) return;
  const home = { p:L.position.clone(), i:L.intensity, d:L.distance, c:L.color.clone() };
  L.position.set(0.7, 2.9, 25.4); L.distance = 7.5; L.color.set('#ffe2bc'); L.intensity = 1.25;
  R.lampHome = ()=>{ L.position.copy(home.p); L.intensity = home.i; L.distance = home.d; L.color.copy(home.c); R.lampHome = null; };
}
function standoff(){
  const R = RT(), P = ENGINE.player;
  controls(false); tailsOn(false);
  placePlayer(0.35, 25.75, PI);
  put(R.osagie, -0.85, 25.5, PI); pose(R.osagie, 'idle');
  put(R.hauwa, 1.55, 25.95, PI - 0.15); pose(R.hauwa, 'folded');
  put(R.uche, 0.85, 26.75, PI); pose(R.uche, 'idle');
  const M = [];
  walkTo(M, R.acp, [[0.1, 23.1]], { face:0, end:'folded' });
  R.tf.forEach((ch, i)=>walkTo(M, ch, [[[-1.3, 1.4, 2.7, -2.6][i], 22.0 - (i > 1 ? 0.45 : 0)]], { face:0, end:ch.userData.base15 }));
  lampAtGate();
  frame([3.4, 2.6, 30.6], [0, 1.6, 21.6], 0, 0.22);
  const T = DIALOGUE.m15_taskforce || [];
  direct((l, sp, text)=>{
    if(l === T[0] || (sp === SYS && /Riverstone gate/.test(text))){ dolly([3.6, 2.7, 31.2], [1.8, 2.1, 28.4], [0, 1.3, 21.4], 7); return; }
    stopDolly(); snapMarks(M);
    if(sp === SYS && /holds up his phone/.test(text)){ pose(R.acp, 'phone'); frame([0.75, 1.62, 24.85], [0.1, 1.62, 23.1], -0.3, 0.3); return; }
    if(sp === TFC){ if(R.acp.userData.base15 === 'phone') pose(R.acp, 'folded'); frame([0.95, 1.7, 25.3], [0.1, 1.62, 23.1], 0.32, 0.32); return; }
    if(sp === OSA){ frame([0.75, 1.72, 22.35], [-0.85, 1.6, 25.5], -0.3, 0.32); return; }
    if(sp === KEL) frame([-0.2, 1.7, 22.45], [0.35, 1.62, 25.75], 0.3, 0.32);
  });
  V13.say('m15_taskforce', ()=>{
    direct(null);
    // the reply: the men shift, or hold, or look at their feet
    const pick = V13.picked ? V13.picked('m15_taskforce') : null;
    if(pick === 2) R.tf.forEach(ch => V13.once(ch, 'no', ch.userData.base15));
    shot([2.6, 1.9, 27.2], [-0.2, 1.3, 23.2]);
    V13.once(R.osagie, 'interact', 'idle');
    setTimeout(()=>{ V13.once(R.acp, 'interact', 'folded'); }, 900);
    setTimeout(()=>{
      if(V13.world){ V13.world.open('gate', 1); V13.world.open('boom', 1); }
      unblockGate(); clank();
      R.tf.forEach((ch, i)=>go(ch, [[i % 2 ? 4.6 + i * 0.4 : -4.4 - i * 0.4, 21.2 - i * 0.3]], { face:i % 2 ? -PI / 2 : PI / 2 }));
      go(R.acp, [[-0.9, 21.6]], { face:PI / 2 + 0.3 });
    }, 2300);
    setTimeout(()=>{
      if(R.lampHome) R.lampHome();
      go(R.osagie, [[-0.6, 24.6], [-0.2, 22.0]], { face:-PI / 2 - 0.3, end:'folded' });
      V13.done('o15_in');
      // (SC3) where the barge lies is Recruit's, in the objective as in the toast below
      objText('o15_board', rec() ? 'Reach TEKENA 2\'s gangway — the north end of the yard — before they see a warrant' : 'Reach TEKENA 2\'s gangway before they see a warrant');
      controls(true);
      trailReset(); R.tOsa.on = false; R.tHau.on = true; R.tUche.on = true;
      V13.toast('THE YARD', 'The task force steps aside. Okundaye stays with the ACP.' + (rec() ? ' The barge is at the north end.' : ''), 3200);
      V13.every(()=>{ const p = ENGINE.player.position; if(p.z < -10.5){ stealth(); return false; } });
    }, 4200);
  });
}

/* =========================================================================
   THE WATER — Ibinabo's boats under the jetty, and a clock
   ========================================================================= */
const LAND = { k:[-12.6, -22.3], uche:[-13.6, -21.7], hau:[-11.9, -21.75], osa:[-14.4, -21.35], ibi:[-15.4, -23.3] };
function byWater(){
  const R = RT();
  objText('o15_in', 'Land quietly at the union jetty');
  controls(false);
  titleCard(['BY WATER', '23:52 · UNDER THE OLD WHARF'], 2600, ()=>landing());
  setTimeout(()=>{
    placePlayer(LAND.k[0], LAND.k[1], PI / 2);
    put(R.uche, LAND.uche[0], LAND.uche[1], PI / 2 - 0.2); put(R.hauwa, LAND.hau[0], LAND.hau[1], PI / 2 + 0.3); put(R.osagie, LAND.osa[0], LAND.osa[1], PI / 2);
    if(!R.ibi) R.ibi = man(LOOK.ibinabo(), LAND.ibi[0], LAND.ibi[1], PI / 2, 'folded', { id:'ibinabo' }); else put(R.ibi, LAND.ibi[0], LAND.ibi[1], PI / 2 + 0.4);
    pose(R.ibi, 'folded'); pose(R.osagie, 'idle'); pose(R.hauwa, 'idle');
    R.boatmen = (V13.list(K, 'boatmen') || []).map((p, i)=>man(LOOK.boatman(i), p[0], p[1], p[2], i % 2 ? 'folded' : 'idle'));
    if(R.kitBag) R.kitBag.visible = false;
  }, 700);
}
function landing(){
  const R = RT(), P = ENGINE.player;
  controls(false);
  frame([-10.6, 1.2, -30.5], [-13.8, 1.2, -23.0], -0.22, 0.24);
  direct((l, sp, text)=>{
    if(sp === SYS) return;
    if(sp === TFC){ lampAtGate(); pose(R.acp, 'talk'); go(R.acp, [[0.1, 23.1]], { face:0 }); frame([1.05, 1.72, 25.4], [0.1, 1.65, 23.1], 0.3, 0.32); return; }
    if(R.lampHome) R.lampHome();
    if(R.acp.userData.base15 === 'talk') pose(R.acp, 'folded');
    if(sp === IBI) ots(R.ibi, P, { side:-1 });
    else if(sp === OSA) ots(R.osagie, P, { side:-1, back:1.0 });
    else if(sp === UCHE) ots(R.uche, P, { side:1, back:1.0 });
  });
  V13.say(V13.C && V13.C.taskforce15 ? V13.C.taskforce15() : 'm15_taskforce_water', ()=>{
    direct(null); if(R.lampHome) R.lampHome();
    V13.done('o15_in');
    objText('o15_board', 'Reach TEKENA 2\'s gangway before they see a warrant');
    controls(true);
    trailReset(); R.tHau = tail(R.hauwa, 2.2); R.tUche = tail(R.uche, 3.1);
    pose(R.osagie, 'folded');
    stealth();
    clock();
  });
}
/* "two minutes, maybe three": the task force comes round by the road */
function clock(){
  const R = RT(), T = 165; R.tfT = 0;
  V13.every(dt => {
    if(R.counted || R.cashOpen){ if(typeof hideMeter === 'function') hideMeter('tf15'); return false; }   // the count has begun: the race is over
    R.tfT += dt * (V13.timeRate ? V13.timeRate() : (typeof timerRate === 'function' ? timerRate() : 1));
    const left = Math.max(0, T - R.tfT), mm = Math.floor(left / 60), ss = Math.floor(left % 60);
    if(typeof showMeter === 'function') showMeter('tf15', 'TASK FORCE — ON THE ROAD', left / T, left < 45 ? 'danger' : 'info', mm + ':' + String(ss).padStart(2, '0'));
    if(R.tfT > T * 0.45 && !R.boomUp){ R.boomUp = true; if(V13.world){ V13.world.open('boom', 1); V13.world.open('gate', 1); } }
    if(left <= 0){ if(typeof hideMeter === 'function') hideMeter('tf15'); tfArrives(); return false; }
  });
}
function tfArrives(){
  const R = RT(), P = ENGINE.player;
  R.tfFirst = true;
  if(!R.boarded) made('tf');
  controls(false);
  const spots = [[2.4, -21.6], [4.2, -21.3], [0.8, -21.0], [5.8, -21.7]];
  put(R.acp, 0.2, -12.5, PI); R.tf.forEach((ch, i)=>put(ch, -1.5 + i * 1.2, -11.8 - (i % 2) * 0.6, PI));
  const M = [];
  walkTo(M, R.acp, [[3.2, -22.6]], { speed:3.4, face:PI, end:'idle' });
  R.tf.forEach((ch, i)=>walkTo(M, ch, [spots[i]], { speed:3.2, face:PI, end:'folded' }));
  put(R.osagie, -1.6, -16.5, PI); walkTo(M, R.osagie, [[2.0, -22.4]], { speed:3.0, face:PI / 2, end:'idle' });
  frame([8.6, 2.6, -18.6], [2.6, 1.3, -22.6], 0, 0.2);
  direct((l, sp)=>{
    if(sp !== SYS) snapMarks(M);                                    // the jog is over by the time anyone speaks
    if(sp === TFC) frame([4.6, 1.75, -24.0], [3.2, 1.62, -22.6], 0.3, 0.32); else if(sp === OSA) frame([3.9, 1.72, -23.6], [2.0, 1.6, -22.4], -0.3, 0.32);
  });
  setTimeout(()=>V13.say('m15_x_tf_jetty', ()=>{
    direct(null); pose(R.acp, 'folded'); controls(true);
    if(!R.boarded) V13.toast('THEY\'VE SEEN YOU', 'The bags are going into the river — get on that gangway!', 3000);
  }), 1400);
}

/* =========================================================================
   THE JETTY — three torches; the gangway; bags in the river if they see you
   ========================================================================= */
function stealth(){
  const R = RT(); if(R.stealth) return; R.stealth = true;
  for(const t of TR.tails) t.held = true;
  V13.radio('SGT. UCHE', radio('low'), 7400);
  const toggle = (()=>{ try{ return !!(window.TAC && TAC.crouch && TAC.crouch.mode() === 'toggle'); }catch(e){ return false; } })();
  if(typeof showHint === 'function') showHint('m15_low', (toggle ? 'Press' : 'Hold') + ' <b>C</b> to stay low. The torches show where the guards are looking.', 'Tap <b>CROUCH</b> to stay low. The torches show where the guards are looking.', 6200);
  V13.eyes({ label:'THE JETTY IS WATCHING', watchers:R.guards.map(g => g.ch), radius:8.5, fov:0.85, rate:0.55, decay:0.16, onMade:()=>made('seen') });
  V13.every(()=>{
    if(R.boarded) return false;
    const p = ENGINE.player.position;
    if(p.z < -25.3 && p.x > 6.15 && p.x < 7.85){ board(); return false; }
  });
}
function made(why){
  const R = RT(); if(R.made || R.boarded) return; R.made = why || 'seen';
  V13.eyesOff();
  if(typeof sfxAlert === 'function') sfxAlert(); if(typeof shakeCamera === 'function') shakeCamera(0.05);
  V13.radio('RIVERSTONE GUARD', lang(RADIO.made), 3600);
  V13.toast('THEY\'VE SEEN YOU', 'The bags are going into the river — get on that gangway!', 3000);
  for(const g of R.guards) V13.once(g.ch, 'no', 'idle');
  for(const L of R.loaders){ L.bag.visible = false; go(L.ch, [[6.95, -24.4], [6.95, -25.9], [9.0 + L.i * 1.4, -30.6]], { speed:3.6, face:PI, end:'idle' }); }
  go(R.stacker, [[11.6, -30.7]], { speed:3.0, face:PI, end:'idle' });
  for(const t of TR.tails) t.held = false;
  R.lost = 0; R.throwT = 1.1;
  if(typeof playMusic === 'function') playMusic('chase', { volume:0.7, loop:false });
  V13.every(dt => {
    if(R.boarded){ if(typeof hideMeter === 'function') hideMeter('bags15'); return false; }
    R.throwT -= dt;
    if(R.throwT <= 0 && R.lost < 24){                         // they run out of nerve (and of bags near the rail) after two dozen
      R.throwT = 1.5; R.lost++;
      const who = [R.crew, R.stacker, R.loaders[0].ch, R.loaders[1].ch][R.lost % 4];
      V13.once(who, 'pickup', 'idle'); const x = Math.max(8.6, Math.min(12.2, who.position.x)); setTimeout(()=>throwBag(V3(x, 0, -30.95)), 380);
    }
    if(typeof showMeter === 'function') showMeter('bags15', 'BAGS IN THE RIVER', Math.min(1, R.lost / 10), 'danger', String(R.lost));
  });
}
function board(){
  const R = RT(); if(R.boarded) return; R.boarded = true;
  V13.eyesOff(); if(typeof hideMeter === 'function') hideMeter('bags15');
  if(typeof sfxAlert === 'function') sfxAlert();
  V13.toast('NACECA!', 'Search warrant — everybody, hands where I can see them!', 2600);
  for(const g of R.guards){ halt(g.ch); pose(g.ch, 'handsup'); g.torch.off(); }
  for(const L of R.loaders){ halt(L.ch); L.bag.visible = false; pose(L.ch, 'handsup'); }
  halt(R.stacker); pose(R.stacker, 'handsup'); halt(R.crew); pose(R.crew, 'handsup');
  faceCh(R.sen, ENGINE.player);
  setTimeout(()=>{ if(RT() === R && !R.cashOpen) V13.toast('THE SENATOR', 'He watches you board from under his umbrella. He doesn\'t move. He smiles.', 3400); }, 2900);
  // Uche and the Barrister come up behind him
  const P = ENGINE.player.position;
  if(R.uche.position.distanceTo(P) > 9) put(R.uche, 5.7, -22.6);
  if(R.hauwa.position.distanceTo(P) > 9) put(R.hauwa, 8.0, -22.5);
  trailReset([[6.95, -23.7], [6.95, -24.6], [6.95, -25.5]]);
  for(const t of TR.tails){ t.held = false; t.on = true; }
  V13.done('o15_board');
  objText('o15_cash', R.src.felix ? 'The cash room: aft, behind the engine room — a steel door painted like a fuel tank' : 'Find where the bags are going on TEKENA 2');
  if(R.made && typeof musicForScene === 'function') musicForScene('m15');
  R.itDoor = V13.spot({ x:12.25, y:1.05, z:-28.5 }, R.src.felix ? 'Open the "fuel tank" door' : 'Inspect the painted steel door', it => openCash(it), { verb:'open', range:2.2 });
}

/* ---------- the cash room ---------- */
function openCash(it){
  const R = RT();
  V13.drop(it); controls(false); tailsOn(false); R.cashOpen = true;
  placePlayer(11.35, -28.45, PI / 2);
  put(R.uche, 10.7, -27.55, PI / 2 + 0.35); pose(R.uche, 'idle');
  put(R.hauwa, 10.45, -29.3, PI / 2 - 0.3); pose(R.hauwa, 'folded');
  if(!R.made){ put(R.stacker, 9.9, -29.7, 0.6); }
  shot([10.2, 1.74, -27.55], [13.9, 1.0, -28.75]);
  clank();
  setTimeout(()=>{ cashDoor(1); rampLight(R.cashL, (R.cashL && R.cashL.userData.i15) ? R.cashL.userData.i15 * 2.0 : 1.4, 1.6); rampLight(R.spare, 1.6, 1.8); }, 450);
  const T = DIALOGUE.m15_cashroom || [];
  direct((l, sp)=>{
    if(l === T[0] || sp === SYS){ dolly([12.75, 1.85, -27.15], [12.9, 1.6, -27.45], [15.1, 0.9, -29.3], 6); return; }
    stopDolly();
    if(sp === UCHE) frame([13.3, 1.62, -28.2], [10.7, 1.62, -27.55], 0.3, 0.3);
    else if(sp === KEL) frame([13.3, 1.62, -28.85], [11.35, 1.62, -28.45], -0.3, 0.3);
  });
  setTimeout(()=>V13.say('m15_cashroom', counted), 2700);
}
function counted(){
  const R = RT();
  direct(null); stopDolly();
  R.counted = true; if(typeof hideMeter === 'function') hideMeter('tf15');
  const total = 64, lost = R.lost || 0;
  titleCard(['THE COUNT', '00:04 · ' + (total - lost) + ' BAGS' + (lost ? ' · ' + lost + ' MORE IN THE RIVER' : ''), 'NUMBERED · PHOTOGRAPHED · TWO SIGNATURES ON EVERY SEAL'], 3000, ()=>{
    let q = 'good', why = '';
    if(lost >= 3){ q = 'contested'; why = lost + ' bags went into the river before you were aboard. The defence will say they never existed.'; }
    if(R.tfFirst){ q = 'contested'; why = 'The task force stood on that barge before the count began. The defence will ask what they took.'; }
    V13.ev('barge_cash', 'Cash on the barge', q, 90);
    S.game.evQ = S.game.evQ || {}; S.game.evQ.barge_cash = q;
    if(why) setTimeout(()=>V13.toast('THE COUNT', why, 4200), 1900);
    V13.done('o15_cash');
    // Uche keeps the door; the Barrister comes with you
    put(R.uche, 11.25, -27.7, -PI / 2 + 0.2); pose(R.uche, 'folded');
    if(R.tUche) R.tUche.on = false;
    trailReset([[10.5, -28.9]]); if(R.tHau) R.tHau.on = true;
    controls(true);
    objText('o15_senator', 'The Senator is waiting on the jetty, under his umbrella');
    R.itSen = V13.talk(R.sen, 'Talk to the Senator', it => senator(it), { range:3.1 });
    R.itSen.priority = 2;
    setTimeout(()=>{ if(RT() === R && !R.senDone && radio('wait')) V13.radio('BARRISTER DANLADI', radio('wait'), 4400); }, 1600);
  });
}

/* =========================================================================
   THE SENATOR, AND THE CALL
   ========================================================================= */
function senator(it){
  const R = RT(), P = ENGINE.player;
  V13.drop(it); R.senDone = true; controls(false); tailsOn(false);
  // parse the ninth floor while the Senator talks, so Monday doesn't wait for it (ENVART.load is cached and idempotent)
  setTimeout(()=>{ try{ if(typeof ENVART !== 'undefined' && ENVART.load && !(typeof ART !== 'undefined' && ART.failed)) ENVART.load(KO); }catch(e){} }, 1800);
  placePlayer(6.3, -23.3, Math.atan2(4.6 - 6.3, -24.8 + 23.3));
  put(R.hauwa, 7.45, -23.0, Math.atan2(4.6 - 7.45, -24.8 + 23.0)); pose(R.hauwa, 'folded');
  turn(R.sen, Math.atan2(6.3 - 4.6, -23.3 + 24.8)); faceCh(R.ereba, P);
  // nobody frozen mid-patrol in the middle of this conversation: whoever stood here is rounded up on the barge's deck
  const SAFE = [[7.9, -30.4], [8.6, -29.8], [10.9, -30.1], [8.0, -29.1]];
  [...R.guards.map(g => g.ch), ...R.loaders.map(L => L.ch)].forEach((ch, i)=>{
    if(Math.hypot(ch.position.x - 5.7, ch.position.z + 23.6) < 3.4){ const s = SAFE[i % SAFE.length]; put(ch, s[0], s[1], 0); pose(ch, 'handsup'); }
  });
  frame([5.3, 1.62, -21.9], [4.6, 1.7, -24.8], -0.22, 0.26);
  direct((l, sp, text)=>{
    if(sp === SYS && /umbrella held by/.test(text)){ dolly([5.7, 1.75, -21.2], [5.25, 1.62, -21.95], aim([5.25, 1.62, -21.95], [4.6, 1.7, -24.8], -0.22, 0.26), 6); return; }
    stopDolly();
    if(sp === SYS && /phone buzzes/.test(text)){ buzz(); pose(P, 'phone'); frame([5.1, 1.65, -23.95], [6.3, 1.6, -23.3], -0.25, 0.3); return; }
    if(sp === SEN){
      if(/That will be for you/.test(text)){ frame([5.75, 1.62, -23.55], [4.6, 1.7, -24.8], -0.3, 0.3); return; }
      if(/Kolawole kept her/.test(text)) V13.once(R.sen, 'no', 'idle');
      ots(R.sen, P, { side:1 }); return;
    }
    if(sp === KEL) ots(P, R.sen, { side:-1 });
    else if(sp === HAU) frame([5.55, 1.66, -24.15], [7.45, 1.62, -23.0], 0.24, 0.3);
  });
  V13.say('m15_senator', ()=>{
    direct(callCue); DIR.call = 1;
    V13.call(/DIRECTOR-GENERAL/, 'm15_dg_call', afterCall);
  });
}
/* the call, and Friday's end (m15_dg_call → m15_end_truth | m15_end_career) */
function callCue(l, sp, text){
  const R = RT(), P = ENGINE.player;
  if(sp === DG){
    if(/God help you/.test(text)){ pose(P, 'idle'); frame([5.6, 1.62, -22.2], [6.3, 1.6, -23.35], -0.3, 0.3); return; }
    if(/Good\. Good man/.test(text)){ pose(P, 'idle'); frame([5.4, 1.58, -23.9], [6.3, 1.62, -23.3], -0.3, 0.3); return; }
    const k = (DIR.call = (DIR.call || 0) + 1) % 3;
    if(k === 0) frame([5.15, 1.62, -23.9], [6.3, 1.6, -23.3], -0.28, 0.3);
    else if(k === 1) ots(P, R.sen, { side:-1, back:0.9 });
    else frame([5.6, 1.62, -22.2], [6.3, 1.6, -23.35], -0.3, 0.3);
    return;
  }
  if(sp === SYS && /cash-room door/.test(text)){
    // Uche at the strongroom door, looking at you; then the Senator's wrists, held out
    pose(P, 'idle'); faceCh(R.uche, P); ots(R.uche, P, { side:1, back:0.9 });
    later(2300, ()=>{ pose(R.sen, 'carry'); if(R.stick) R.stick.userData.off = true; frame([6.4, 1.7, -26.0], [4.97, 1.5, -24.37], 0, 0.3); });
    return;
  }
  if(R.sen.userData.base15 === 'carry' && !R.cuffed) pose(R.sen, 'idle');
  // truth
  if(sp === KEL && /under arrest/.test(text)){ ots(R.sen, P, { side:1 }); go(R.uche, [[10.2, -27.2], [7.3, -26.4], [6.95, -25.4], [6.6, -24.4], [5.35, -23.95]], { speed:2.2, face:PI + 0.6 }); return; }
  if(sp === SEN && /Legal Aid/.test(text)){ pose(R.ereba, 'phone'); ots(R.sen, P, { side:-1 }); return; }
  if(sp === UCHE && /Hands in front/.test(text)){
    if(R.uche.position.distanceTo(V3(5.35, 0, -23.95)) > 0.6) put(R.uche, 5.35, -23.95);
    faceCh(R.uche, R.sen); V13.once(R.uche, 'interact', 'idle'); R.cuffed = true; pose(R.sen, 'carry'); if(R.stick) R.stick.userData.off = true; pose(P, 'idle');
    frame([6.4, 1.7, -26.0], [4.97, 1.5, -24.37], 0, 0.3); return;
  }
  if(sp === SYS && /walked off his own jetty/.test(text)){
    R.stick.userData.off = true;                                  // cuffed: he walks with his hands in front of him
    go(R.sen, [[4.0, -21.5], [2.2, -16.5], [0.4, -9.0]], { speed:1.05, end:'walk', clip:'carry' });
    go(R.uche, [[4.9, -21.4], [3.0, -16.4], [1.2, -9.1]], { speed:1.05, end:'walk' });
    go(R.ereba, [[3.0, -22.0], [1.6, -17.2]], { speed:1.0, end:'idle' });
    for(const ch of R.tf) turn(ch, ch.rotation.y + PI);
    frame([9.6, 3.2, -18.4], [3.0, 1.2, -20.8], 0, 0.2); return;
  }
  if(sp === OSA && /forfeiture order/.test(text)){
    if(R.osagie.position.distanceTo(P.position) > 6) put(R.osagie, 4.2, -19.6, PI);
    go(R.osagie, [[5.4, -22.1]], { face:Math.atan2(6.3 - 5.4, -23.3 + 22.1), end:'idle' });
    frame([7.6, 1.7, -24.2], [5.4, 1.62, -22.1], 0.3, 0.3); return;
  }
  // career
  if(sp === KEL && /Stand down/.test(text)){ frame([7.4, 1.6, -22.4], [6.3, 1.62, -23.3], -0.3, 0.3); return; }
  if(sp === SEN && /Sensible boy/.test(text)){ ots(R.sen, P, { side:1 }); go(R.ereba, [[5.6, -23.6]], { face:Math.atan2(6.3 - 5.6, -23.3 + 23.6) }); R.umb.cover = P; return; }
  if(sp === SYS && /come up the jetty at a jog/.test(text)){
    const at = [[1.5, -14.5], [3.0, -14.0], [0.2, -13.8], [4.4, -14.6]];
    R.tf.forEach((ch, i)=>{ put(ch, at[i][0], at[i][1], PI); go(ch, [[5.4 + (i % 2) * 0.9, -22.6], [6.95, -24.2], [6.95, -25.8], [8.4 + i * 0.9, -27.2 - (i % 2) * 0.9]], { speed:3.3, face:PI / 2, end:'folded' }); });
    put(R.acp, 2.2, -15.5, PI); go(R.acp, [[4.6, -22.0]], { speed:2.6, face:PI / 2 + 0.4, end:'folded' });
    frame([1.6, 2.6, -18.6], [6.6, 1.2, -25.4], 0, 0.2); return;
  }
  if(sp === UCHE && /car keys/.test(text)){
    if(R.uche.position.distanceTo(P.position) > 3){ put(R.uche, 6.95, -25.2); go(R.uche, [[6.95, -24.1]], { face:Math.atan2(6.3 - 6.95, -23.3 + 24.1) }); }
    setTimeout(()=>{ V13.once(R.uche, 'interact', 'idle'); setTimeout(()=>go(R.uche, [[6.0, -21.0], [3.5, -14.0], [1.0, -6.0]], { speed:1.3 }), 1500); }, 900);
    ots(R.uche, P, { side:1 }); return;
  }
  if(sp === HAU){ frame([8.7, 1.66, -22.3], [7.45, 1.62, -23.0], -0.26, 0.3); return; }
  if(sp === SYS && /slips her lines/.test(text)){ shot([13.5, 1.2, -23.6], [26, 0.2, -40]); return; }
  if(sp === KEL && /^\(/.test(text)){ frame([6.95, 1.58, -24.3], [6.3, 1.62, -23.3], 0.3, 0.3); return; }
  if(sp === KEL) ots(P, R.sen, { side:-1 });
}
function afterCall(){
  const R = RT(), m = MC();
  direct(null);
  if(!m.s2_end) V13.setFlag('s2_end', pickedFlag('m15_dg_call', 's2_end') || 'career');
  const q = R.recording ? 'good' : 'contested';
  V13.ev('senator_words', 'The Senator on the jetty', q, 90);
  S.game.evQ = S.game.evQ || {}; S.game.evQ.senator_words = q;
  if(MC().s2_end === 'truth') S.game.arrests = (S.game.arrests || 0) + 1;
  else if(V13.hasEv('barge_cash')){ S.game.evQ.barge_cash = 'contested'; }
  V13.done('o15_senator');
  setTimeout(()=>{ if(!R.recording) V13.toast('THE SENATOR\'S WORDS', 'Nothing recorded them. Your notebook and Zainab\'s — that\'s all a court will see.', 3800); }, 600);
  setTimeout(monday, R.recording ? 1400 : 3800);
}

/* =========================================================================
   MONDAY — THE NINTH FLOOR
   ========================================================================= */
/* a plain black layer under the title card, so the swap from the river to the ninth floor is never seen */
function black(on){
  let el = document.getElementById('c15-black');
  if(!el){ el = document.createElement('div'); el.id = 'c15-black'; el.style.cssText = 'position:fixed;inset:0;background:#000;z-index:69;opacity:0;pointer-events:none;transition:opacity .6s ease'; document.getElementById('game-root').appendChild(el); }
  el.style.opacity = on ? '1' : '0';
}
function monday(){
  const R = RT();
  controls(false); V13.eyesOff();
  ['tf15', 'bags15', 'eyes'].forEach(id => { if(typeof hideMeter === 'function') hideMeter(id); });
  let cardDone = false, built = false;
  // lift the black only once the ninth floor has been drawn (a first frame of a new scene can take a while)
  const both = ()=>{ if(cardDone && built) requestAnimationFrame(()=>requestAnimationFrame(()=>{ black(false); setTimeout(()=>lead(), 700); })); };
  titleCard(['MONDAY', 'NACECA HEADQUARTERS · ABUJA · THE NINTH FLOOR'], 3400, ()=>{ cardDone = true; both(); });
  setTimeout(()=>black(true), 500);
  // (D9) the ninth floor gets twelve seconds to decode; a hang, a failed decode or no art at all plays Monday over the river
  const artFailed = ()=>typeof ART !== 'undefined' && !!ART.failed;
  const load = (V13.loading ? V13.loading('THE NINTH FLOOR', ['env_' + KO]) : Promise.resolve(true))
    .then(()=>(artFailed() || typeof ENVART === 'undefined') ? null : Promise.race([ENVART.load(KO), new Promise(r => setTimeout(()=>r(null), 12000))]))
    .catch(()=>null);
  setTimeout(()=>load.then(set => {
    let ok = false;
    if(set && typeof ENVART !== 'undefined' && ENVART.ready(KO)){ try{ office(); ok = true; }catch(e){ console.error('[m15] office', e); } }
    if(!ok) officeFallback();
    built = true; both();
  }), 1000);
}
/* if the office could not load, Monday plays over the river at dawn */
function officeFallback(){
  const R = RT(); R.noOffice = true;
  shot([2, 6, -36], [8, 1, -60]);
}
function office(){
  const R = RT(), m = MC();
  AL.length = 0; DIR.fn = null; DIR.last = null; DIR.spk = null; TR.c.length = 0; TR.base = 0; TR.tails.length = 0; CAST.length = 0;
  V13.rt.tick = []; V13.eyesOff();
  for(const k in TALKERS) delete TALKERS[k];
  V13.scene(KO, { start:'start', player:suit });
  ENGINE.sceneAlways = always;
  officeProps();
  const truth = m.s2_end === 'truth';
  R.o = {};
  R.o.hauwa = man(LOOK.hauwa(), 1.15, 8.55, PI - 0.3, 'folded', { id:'hauwa' });
  R.o.osagie = man('osagie', -1.1, 8.4, PI + 0.25, 'idle', { id:'osagie' });
  if(truth) R.o.uche = (()=>{ const u = V13.person({}, { x:1.7, z:9.7, rot:PI }, { kind:'uche', clip:'folded', solid:false }); u.userData.base15 = 'folded'; return u; })();
  R.o.police = [[3.2, 6.6, -PI / 2], [3.3, 7.6, -PI / 2]].map((p, i)=>man(LOOK.police(i), p[0], p[1], p[2], 'folded'));
  const kc = V13.at(KO, 'kuti_chair') || { x:-3, z:3.75 };
  R.o.kuti = man('kuti', kc.x, kc.z + 0.05, 0, 'sit', { id:'kuti' });
  if(!truth){
    R.o.photo = man(V13.crowdLook(6), 3.0, 4.6, -PI / 2 - 0.4, 'idle');
    const cam = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.11, 0.12), new THREE.MeshStandardMaterial({ color:'#141416', roughness:0.4 }));
    cam.position.set(0, 1.5, 0.2); R.o.photo.add(cam);
  }
  R.o.dg = man('dg', 2.3, -10.6, PI, 'folded', { id:'dg' });                   // at the glass until he knows who has come
  TALKERS[OSA] = ()=>R.o.osagie; TALKERS[HAU] = ()=>R.o.hauwa; TALKERS[UCHE] = ()=>R.o.uche; TALKERS[DG] = ()=>R.o.dg; TALKERS[KEL] = ()=>ENGINE.player;
  V13.every(dt => { trailTick(); for(const t of TR.tails) tailStep(t, dt); });
  trailReset();
  shot([5.6, 2.35, 9.4], [-2.6, 0.95, 4.2]);
}
function officeProps(){
  const sc = ENGINE.scene, R = RT();
  // the draughts game, where it was
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#3a2210'; x.fillRect(0, 0, 256, 256);
  for(let r = 0; r < 10; r++) for(let q = 0; q < 10; q++){ x.fillStyle = (r + q) % 2 ? '#4a2a14' : '#d8c49a'; x.fillRect(8 + q * 24, 8 + r * 24, 24, 24); }
  x.strokeStyle = '#c8a040'; x.lineWidth = 2; x.strokeRect(7, 7, 242, 242);
  const tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding;
  const B = new THREE.Group(); B.position.set(0, 0.812, -8.02); sc.add(B);
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.018, 0.4), [0, 1, 2, 3, 4, 5].map(i => i === 2 ? new THREE.MeshStandardMaterial({ map:tex, roughness:0.55 }) : new THREE.MeshStandardMaterial({ color:'#3a2210', roughness:0.6 })));
  base.position.y = 0.009; B.add(base);
  const geo = new THREE.CylinderGeometry(0.0155, 0.0155, 0.009, 14), dk = new THREE.MeshStandardMaterial({ color:'#1e1410', roughness:0.4 }), lt = new THREE.MeshStandardMaterial({ color:'#efe4cc', roughness:0.4 });
  const at = (r, q)=>[-0.16875 + q * 0.0375, -0.16875 + r * 0.0375];
  [[0, 1], [0, 5], [1, 0], [1, 6], [2, 3], [3, 2], [3, 4], [4, 5], [3, 8]].forEach(([r, q])=>{ const m = new THREE.Mesh(geo, dk), p = at(r, q); m.position.set(p[0], 0.0225, p[1]); B.add(m); });
  [[9, 2], [8, 1], [8, 5], [7, 6], [6, 1], [6, 7], [5, 4]].forEach(([r, q])=>{ const m = new THREE.Mesh(geo, lt), p = at(r, q); m.position.set(p[0], 0.0225, p[1]); B.add(m); });
  // the good tea, two cups (only poured for the version of Monday where he isn't worried)
  R.cups = new THREE.Group(); R.cups.visible = false; sc.add(R.cups);
  const cupM = new THREE.MeshStandardMaterial({ color:'#f4f1ea', roughness:0.3 }), teaM = new THREE.MeshStandardMaterial({ color:'#7a3a12', roughness:0.2 });
  for(const [px, pz] of [[-0.42, -7.7], [0.48, -7.62]]){
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.034, 0.075, 12), cupM); cup.position.set(px, 0.85, pz); R.cups.add(cup);
    const tea = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.004, 12), teaM); tea.position.set(px, 0.885, pz); R.cups.add(tea);
    const sau = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.07, 0.01, 14), cupM); sau.position.set(px, 0.815, pz); R.cups.add(sau);
  }
}
/* the lift, the blank on the warrant */
function lead(){
  const R = RT(), O = R.o || {}, P = ENGINE.player;
  controls(false);
  const key = V13.C && V13.C.accuseLead ? V13.C.accuseLead() : 'm15_accuse_lead';
  if(typeof musicForScene === 'function') musicForScene('investigation');
  direct((l, sp)=>{
    if(R.noOffice) return;
    if(sp === SYS) shot([5.6, 2.35, 9.4], [-2.6, 0.95, 4.2]);
    else if(sp === HAU) ots(O.hauwa, P, { side:-1, back:1.0 });
    else if(sp === KEL) frame([0.15, 1.66, 6.9], [0.0, 1.62, 9.0], 0.3, 0.3);
  });
  V13.say(key, ()=>{
    direct(null);
    if(R.noOffice){ accuseScreen(); return; }
    // out of the lift lobby (the follow camera has no room with the wall at his back)
    placePlayer(0, 5.9, PI);
    put(O.hauwa, 0.95, 6.9, PI - 0.2); put(O.osagie, -0.95, 7.05, PI + 0.2); if(O.uche) put(O.uche, 1.55, 7.9, PI);
    trailReset();
    controls(true);
    objText('o15_name', 'Monday: the Director-General\'s door — put a name in the blank');
    R.tHau = tail(O.hauwa, 1.6); R.tOsa = tail(O.osagie, 2.4); if(O.uche) R.tUche = tail(O.uche, 3.2);
    R.itDoor = V13.spot({ x:0, y:1.3, z:2.15 }, 'The Director-General\'s door', it => { V13.drop(it); accuseScreen(); }, { verb:'open', range:2.6 });
  });
}

/* ---------- the accusation: one name, three things that prove it ---------- */
function accuseScreen(){
  const seal = S2().seal15, C = V13.S2_CANDIDATES || [], ids = EV_S2();
  const items = (S.game.evidence || []).filter(e => e && ids.includes(e.id)).sort((a, b)=>ids.indexOf(a.id) - ids.indexOf(b.id));
  const blank = who => `FEDERAL REPUBLIC OF NIGERIA v. <b>${who ? esc(cand(who).name.toUpperCase()) : '&nbsp;'.repeat(18)}</b> — abuse of office, and gratification for shielding Cdr. Adaeze from investigation.`;
  const lead = 'Zainab\'s application for an arrest warrant, typed at seven this morning. Someone protected Commander Adaeze for twenty years. One name — and three things that prove it.';
  let over = false;
  const file = (who, picks)=>{ if(over) return; over = true; modalEnd('screen-accuse15'); showOverlay(null); walkIn(judge(who, picks)); };
  controls(false);
  if(window.CW && typeof CW.sheet === 'function'){
    const qTag = id => { const q = V13.evQ(id); return q === 'weak' ? 'WEAK' : q === 'contested' ? 'CONTESTED' : ''; };
    const sh = CW.sheet({
      id:'screen-accuse15', cls:'s2-accuse15', title:'FILL THE BLANK', meta:'CASE 15 · MONDAY · THE NINTH FLOOR',
      lead:esc(lead) + `<span class="a15-blank">${blank(null)}</span>`,
      sections:[
        { key:'who', label:'WHO PROTECTED HER?', q:seal ? 'Your sealed envelope named ' + cand(seal.who).name + '.' : '', kind:'cards', options:candOpts(C) },
        { key:'ev', label:'THREE THINGS THAT PROVE IT', q:'Only evidence that ties a name to protecting her will hold.', kind:'multi', max:3, empty:'You carry nothing to put to a judge.',
          options:items.map(e => ({ id:e.id, name:e.name, tag:qTag(e.id) })) },
      ],
      warn:'A judge reads this once. It can\'t be withdrawn.', fileLabel:'FILE IT', armLabel:'TAP AGAIN — NO TAKING IT BACK', stamp:'FILED',
      onFile:out => file(out.who, (out.ev || []).slice()),
    });
    const ov = sh && sh.ov;
    compat(ov, 'a15-go');
    if(ov){
      // the blank fills in as a name is chosen; the name the envelope carried is marked on its card
      const bl = ov.querySelector('.a15-blank');
      ov.querySelectorAll('.cw-card[data-k="who"]').forEach(c => {
        if(seal && c.dataset.v === seal.who){ c.classList.add('a15-sealed'); c.insertAdjacentHTML('beforeend', '<span class="a15-sealtag">SEALED</span>'); }
        c.addEventListener('click', ()=>{ if(bl) bl.innerHTML = blank(c.dataset.v); });
      });
    }
  } else {
    let ov = document.getElementById('screen-accuse15');
    if(!ov){ ov = V13.el('div', 'overlay', ''); ov.id = 'screen-accuse15'; document.getElementById('game-root').appendChild(ov); }
    let who = null; const picks = [];
    const qTag = id => { const q = V13.evQ(id); return q === 'weak' ? ' <i class="a15-q weak">WEAK</i>' : q === 'contested' ? ' <i class="a15-q">CONTESTED</i>' : ''; };
    const need = Math.min(3, items.length);
    const draw = ()=>{
      const ready = who && picks.length === need;
      ov.innerHTML = `<div class="overlay-bg"></div><div class="acc-frame" role="dialog" aria-label="Fill the blank">
        <div class="acc-head"><div class="plan-k">CASE 15 · MONDAY · THE NINTH FLOOR</div><div class="plan-t">FILL THE BLANK</div>
          <p class="acc-lead">${esc(lead)}</p>
          <div class="a15-blank">${blank(who)}</div></div>
        <div class="acc-body">
          <div class="acc-step"><div class="v12-step-h"><b>1</b> WHO PROTECTED HER?${seal ? ` <em>your sealed envelope named ${esc(cand(seal.who).name)}</em>` : ''}</div>
            <div class="acc-grid">${C.map(c => `<button class="acc-card ${who === c.id ? 'sel' : ''} ${seal && seal.who === c.id ? 'a15-sealed' : ''}" data-id="${c.id}"><img src="${artSrc(c.art)}" alt=""><b>${esc(c.name)}</b><span>${esc(c.role)}</span></button>`).join('')}</div></div>
          <div class="acc-step"><div class="v12-step-h"><b>2</b> THREE THINGS THAT PROVE IT <em>${picks.length}/${need || 3}</em></div>
            <div class="acc-ev">${items.map(e => `<button class="acc-item ${picks.includes(e.id) ? 'sel' : ''}" data-id="${e.id}">${esc(e.name)}${qTag(e.id)}</button>`).join('') || '<p class="ops-p">You carry nothing to put to a judge.</p>'}</div></div>
        </div>
        <div class="acc-foot"><span class="ops-p">Only evidence that ties a name to protecting her will hold. A judge reads this once.</span>
          <button class="btn primary" id="a15-go" ${ready ? '' : 'disabled'}>FILE IT</button></div>
      </div>`;
      ov.querySelectorAll('.acc-card').forEach(b => b.addEventListener('click', ()=>{ who = b.dataset.id; if(typeof sfxClick === 'function') sfxClick(); draw(); }));
      ov.querySelectorAll('.acc-item').forEach(b => b.addEventListener('click', ()=>{
        const id = b.dataset.id, i = picks.indexOf(id);
        if(i >= 0) picks.splice(i, 1); else if(picks.length < 3) picks.push(id); else { V13.toast('THREE ONLY', 'Put one back first', 1400); return; }
        if(typeof sfxBlip === 'function') sfxBlip(); draw();
      }));
      const go = ov.querySelector('#a15-go');
      go.addEventListener('click', ()=>{
        if(!(who && picks.length === need)) return;
        if(!go.dataset.armed){ go.dataset.armed = '1'; go.textContent = 'TAP AGAIN — NO TAKING IT BACK'; return; }
        file(who, picks.slice());
      });
    };
    draw(); showOverlay('screen-accuse15');
  }
  // (R04) a decision: Esc does nothing; RESUME after a pause menu puts the sheet back
  modal('screen-accuse15', { onEsc:null });
}
/* what the case is worth: a strong piece counts only against the right name; the envelope counts either way */
function judge(who, picks){
  const strong = (V13.S2_STRONG ? V13.S2_STRONG() : {}) || {}, right = who === 'dg', seal = S2().seal15, career = MC().s2_end === 'career';
  if(strong.senator_words && V13.evQ('senator_words') !== 'good') strong.senator_words = 'The Senator, under arrest: "Kolawole kept her because I asked him to." Nothing recorded it — your notebook and Zainab\'s will have to carry it.';
  let s = right ? picks.filter(id => strong[id]).length : 0;
  if(seal) s += seal.who === 'dg' ? 1 : -1;
  s = Math.max(0, s);
  const outcome = s >= 3 ? 'proven' : s === 2 ? 'contested' : 'unproven';
  const name = id => ((S.game.evidence || []).find(e => e && e.id === id) || {}).name || id;
  const why = id => {
    if(id === 'senator_words' && career) return (V13.S2_WHY_NOT || {}).senator_words || 'Without an arrest, a boast.';
    return (V13.S2_WHY_NOT || {})[id] || 'It doesn\'t tie anyone to protecting her.';
  };
  const rows = picks.map(id => (right && strong[id]) ? { ok:true, t:name(id), d:strong[id] } : { ok:false, t:name(id), d:right ? why(id) : 'It was built against the wrong name.' });
  if(seal) rows.push(seal.who === 'dg' ? { ok:true, t:'Your sealed envelope', d:'Okundaye carried his name in her pocket from Friday night — before the Senator said a word.' }
                                       : { ok:false, t:'Your sealed envelope', d:'It named ' + cand(seal.who).name + '. Okundaye keeps it. So will the defence.' });
  const res = { who, picks, s, outcome, rows, knew:!!(seal && seal.who === 'dg' && right), t:Date.now() };
  S2().acc15 = { who, picks, s, outcome };
  if(V12 && V12.log) V12.log('accuse15', { who, picks, s, outcome });
  return res;
}

/* ---------- the double doors ---------- */
function walkIn(res){
  const R = RT(), O = R.o || {}, P = ENGINE.player, career = MC().s2_end === 'career';
  R.res = res;
  controls(false); tailsOn(false);
  if(R.noOffice){ reveal(res); return; }
  // where he is when the doors open
  const dg = O.dg;
  if(res.outcome === 'proven'){ put(dg, 0.55, -9.05, 0); pose(dg, 'idle'); }
  else if(res.outcome === 'contested'){ put(dg, 2.3, -10.65, PI); pose(dg, 'phone'); }
  else { put(dg, 0, -9.1, 0); pose(dg, 'sit'); R.cups.visible = true; }
  placePlayer(0, 3.1, PI);
  put(O.osagie, -0.9, 3.5, PI); put(O.hauwa, 0.95, 3.6, PI); if(O.uche) put(O.uche, 1.4, 4.4, PI);
  O.police.forEach((ch, i)=>put(ch, -1.3 + i * 2.6, 4.6, PI));
  shot([1.7, 1.85, -6.4], [0, 1.35, 1.6]);
  if(V13.world) V13.world.open('doors', 1);
  ENGINE.obstacles = (ENGINE.obstacles || []).filter(o => !(Math.abs(o.minX + 0.9) < 0.03 && Math.abs(o.maxX - 0.9) < 0.03 && Math.abs((o.minZ + o.maxZ) / 2 - 1.6) < 0.06));
  hiss(300, 0.4, 0.3);
  // everyone walks to a mark; whoever hasn't reached it when the talking starts is put on it
  const W = R.walkTo = [], walk = (ch, path, o)=>walkTo(W, ch, path, o);
  setTimeout(()=>{
    walk(P, [[0, 0.6], [0.3, -5.55]], { speed:1.5, end:'idle', face:PI });
    walk(O.osagie, [[-0.6, 0.6], [-0.95, -5.3]], { speed:1.5, end:'idle', face:PI + 0.1 });
    walk(O.hauwa, [[0.6, 0.7], [1.75, -5.0]], { speed:1.45, end:'folded', face:PI - 0.3 });
    if(O.uche) walk(O.uche, [[0.9, 1.0], [2.5, -4.2]], { speed:1.45, end:'folded', face:PI - 0.4 });
    if(res.outcome !== 'unproven') O.police.forEach((ch, i)=>walk(ch, [[-0.5 + i, 1.0], [-2.0 + i * 4.6, -4.4]], { speed:1.4, end:'folded', face:PI + (i ? -0.5 : 0.5) }));
    if(res.outcome === 'contested') setTimeout(()=>turn(dg, -0.5), 2600);
  }, 700);
  setTimeout(()=>reveal(res), 6600);
}
function reveal(res){
  const R = RT(), O = R.o || {}, P = ENGINE.player, dg = O.dg;
  snapMarks(R.walkTo);
  const key = V13.C && V13.C.reveal ? V13.C.reveal(res.outcome, res.who) : 'm15_reveal_' + res.outcome;
  let L = (DIALOGUE[key] || []).slice();
  if(res.knew && DIALOGUE.m15_x_knew){
    const i = L.findIndex(l => l && l.mark === 'dg');
    const skip = (MC().s2_end === 'career' ? (DIALOGUE.m15_reveal_career_add || []).length : 0);
    if(i >= 0){ L.splice(i + 1 + skip, 0, ...DIALOGUE.m15_x_knew); R.knewLine = DIALOGUE.m15_x_knew[1]; }
  }
  DIALOGUE.m15_reveal_go = L;
  if(typeof musicForScene === 'function') musicForScene(res.outcome === 'proven' ? 'm8_reveal' : 'investigation');
  const sitting = res.outcome === 'unproven';
  direct((l, sp, text)=>{
    if(R.noOffice) return;
    if(l === R.knewLine){ frame([-0.3, 1.62, -6.9], [0.4, sitting ? 1.22 : 1.62, -9.0], 0.3, 0.3); if(typeof unlock === 'function') unlock('before_he_said_it'); return; }
    if(sp === SYS){
      if(/handcuffs/.test(text)){
        O.police.forEach((ch, i)=>go(ch, [[0.55 + (i ? 0.7 : -0.7), -8.6]], { speed:1.3, face:0 }));
        setTimeout(()=>{ go(dg, [[1.9, -8.4], [1.6, -3.0], [0.3, 1.0], [0.1, 6.5]], { speed:1.0, end:'walk', clip:'carry' });
          O.police.forEach((ch, i)=>go(ch, [[1.9 + (i ? 0.6 : -0.6), -7.6], [1.6 + (i ? 0.6 : -0.6), -2.4], [0.3 + (i ? 0.6 : -0.6), 1.6], [0.1 + (i ? 0.6 : -0.6), 7.0]], { speed:1.0 })); }, 1800);
        frame([4.4, 2.35, -2.9], [0.4, 1.2, -6.4], 0, 0.2); return;
      }
      if(/suspends the Director-General/.test(text)){ pose(dg, 'idle'); go(dg, [[1.2, -6.8], [0.4, 1.0], [0.0, 7.0]], { speed:1.2 }); shot([4.4, 2.35, -2.9], [-0.7, 0.95, -6.6]); return; }
      if(sitting && /tea is already poured/.test(text)){ frame([0.9, 1.74, -5.0], [0.0, 1.2, -9.1], 0.28, 0.26); return; }   // high enough to see over his monitor
      if(/still Director-General/.test(text)){ go(P, [[0.3, -3.0], [0, 1.4]], { speed:1.1 }); frame([-0.55, 1.75, -10.2], [0.3, 1.6, -5.5], 0.3, 0.25); return; }
      shot([4.4, 2.35, -2.9], [-0.7, 0.95, -8.2]); return;
    }
    if(sp === DG){
      if(res.outcome === 'contested' && dg.userData.base15 === 'phone' && !/Is this what/.test(text)) pose(dg, 'idle');
      if(sitting) frame([0.62, 1.72, -4.9], [0.0, 1.22, -9.1], 0.3, 0.3);
      else ots(dg, P, { side:1, back:1.0 });
      return;
    }
    if(sp === KEL) frame([-0.5, 1.78, -10.15], [0.3, 1.62, -5.55], 0.3, 0.32);
    else if(sp === OSA){ ots(O.osagie, dg, { side:-1, back:1.0, lookH:1.45 }); }
  });
  V13.say('m15_reveal_go', ()=>{ direct(null); setTimeout(()=>caseCard(res), 500); });
}
/* the case you put to him — then the papers */
function caseCard(res){
  let ov = document.getElementById('screen-case15');
  if(!ov){ ov = V13.el('div', 'overlay', ''); ov.id = 'screen-case15'; document.getElementById('game-root').appendChild(ov); }
  const c = cand(res.who), word = { proven:'PROVEN', contested:'CONTESTED', unproven:'UNPROVEN' }[res.outcome];
  const stamp = { proven:'good', contested:'plain', unproven:'' }[res.outcome];
  const sub = { proven:'Three things a court cannot explain away.', contested:'Enough to charge him. Not enough to be sure.', unproven:'A story. Courts are for evidence.' }[res.outcome];
  const foot = res.who !== 'dg' ? 'Zainab reads it twice, and says nothing.' : res.outcome === 'proven' ? 'Zainab initials every page.' : res.outcome === 'contested' ? 'Zainab initials every page, slowly.' : 'Zainab initials every page. She knows how it will read.';
  ov.innerHTML = `<div class="overlay-bg"></div><div class="acc-frame" role="dialog" aria-label="The case you put to him">
    <div class="acc-head"><div class="plan-k">THE CASE YOU PUT TO HIM</div>
      <div class="a15-head"><img src="${artSrc(c.art)}" alt=""><div><div class="plan-t">FRN v. ${esc(c.name.toUpperCase())}</div><span class="v13-stamp a15-stamp ${stamp} ${res.outcome}">${word}</span></div></div>
      <p class="acc-lead">${sub}</p></div>
    <ul class="a15-res">${res.rows.map(r => `<li class="${r.ok ? 'ok' : 'no'}"><span class="${r.ok ? 'v13-mark-ok' : 'v13-mark-bad'}">${ico(r.ok ? 'check' : 'cross')}</span><div><b>${esc(r.t)}<em>${r.ok ? 'HOLDS' : 'DOESN\'T HOLD'}</em></b>${esc(r.d)}</div></li>`).join('')}</ul>
    <div class="acc-foot"><span class="ops-p">${foot}</span><button class="btn primary" id="c15-done">CONTINUE</button></div>
  </div>`;
  let over = false;
  ov.querySelector('#c15-done').addEventListener('click', ()=>{ if(over) return; over = true; modalEnd('screen-case15'); showOverlay(null); finishCase(res); });
  controls(false); showOverlay('screen-case15');
  // (R04) CONTINUE is the only way on: Esc does nothing; RESUME puts the card back
  modal('screen-case15', { onEsc:null });
}
function finishCase(res){
  const R = RT();
  if(R.finished) return; R.finished = true;
  S2().finale = res.outcome;
  if(res.outcome !== 'unproven') S.game.arrests = (S.game.arrests || 0) + 1;
  if(res.outcome === 'proven' && typeof unlock === 'function') unlock('ninth_floor');
  V13.done('o15_name');
  if(V13.recruitFromFlags) V13.recruitFromFlags();
  TPCAM.override = null; TPCAM.cur = null;
  V13.finish('m15', res.outcome === 'proven' ? 500 : res.outcome === 'contested' ? 460 : 420);
}

/* =========================================================================
   THE SEASON'S END — where everyone ended up, then Kano at dawn
   ========================================================================= */
V13.startEpilogueS2 = function(){
  if(typeof ensureEpilogueScreen === 'function') ensureEpilogueScreen();
  if(typeof EPI === 'undefined' || typeof renderEpilogue !== 'function'){ endSeasonTwo(); return; }
  V13._s2Epi = true;
  try{ if(V13.portraits) V13.portraits(); }catch(e){}
  let people = [];
  try{ people = (V13.epilogueS2 ? V13.epilogueS2() : []) || []; }catch(e){ console.warn('[m15] epilogue', e); }
  const st = V13.STINGER_S2 || {};
  EPI.slides = people.map(p => ({ kind:'person', art:artFor(p.art), name:esc(p.name), text:esc(p.text) }));
  EPI.slides.push({ kind:'card', title:'NACECA', sub:'SEASON 2 — OPERATION UPSTREAM', text:'Thank you for playing.' });
  if(st.lines && st.lines.length) EPI.slides.push({ kind:'stinger', place:esc(st.place || ''), lines:st.lines.map(esc) });
  EPI.slides.push({ kind:'card', title:esc((st.card && st.card.title) || 'SEASON 3'), sub:esc((st.card && st.card.sub) || ''), text:'' });
  EPI.i = 0;
  S.game.seasonTwoComplete = true;
  S2().epiPending = 1;                                  // (D17) a quit mid-epilogue comes back here on Continue
  if(typeof saveGame === 'function') saveGame(true);
  ENGINE.movementEnabled = false; showHUD(false);
  if(typeof stopAmbient === 'function') stopAmbient();
  if(typeof musicForScene === 'function') musicForScene('victory');
  showOverlay('screen-epilogue');
  renderEpilogue();
};
function endSeasonTwo(){
  V13._s2Epi = false;
  S.game.seasonTwoComplete = true;
  delete S2().epiPending;
  if(typeof saveGame === 'function') saveGame(true);
  if(typeof unlock === 'function') unlock('season_two');
  ENGINE.movementEnabled = false; showHUD(false);
  showOverlay('screen-title');
  if(typeof musicForScene === 'function') musicForScene('title');
  setTimeout(()=>V13.toast('SEASON 2 COMPLETE', 'Every case is open in the files. Season 3 is coming.', 3200), 600);
}
/* the aftermath's "next" panel: v13_core prefixes every Season 2 case with "Next — "; the finale's line reads on its own */
V13.wrap('nextMissionPreview', orig => function(){
  if(S.game && S.game.currentMission === 'm15'){
    const A = V13.AFTER && V13.AFTER.m15;
    return `${A && A.next ? A.next : '<b>Season 2 is complete.</b>'} Continue for where everyone ended up.
      <span class="s2-badge">SEASON 3 — COMING</span>`;
  }
  return orig.apply(this, arguments);
});
/* the grade: like Season 1's finale, a case that didn't hold can't be a top grade */
V13.wrap('computeGrade', orig => function(op){
  const r = orig.apply(this, arguments);
  if(!(S.game && S.game.currentMission === 'm15') || !r) return r;
  const fin = S2().finale, cap = fin === 'contested' ? 78 : fin === 'unproven' ? 58 : 100;
  if(r.pts <= cap) return r;
  const pts = cap, g = pts >= 85 ? 'S' : pts >= 70 ? 'A' : pts >= 55 ? 'B' : pts >= 40 ? 'C' : 'D';
  return Object.assign({}, r, { g, pts });
});
/* (D17) Continue (or the pause menu's Load) after the tab closed on the season's epilogue: back to its first slide,
   then the stinger, the award and the title, not "CAMPAIGN UP TO DATE" with all of it lost */
V13.wrap('resumeCampaign', orig => function(){
  try{ const s = S.game && S.game.s2; if(s && s.epiPending && typeof V13.startEpilogueS2 === 'function'){ showOverlay(null); V13.startEpilogueS2(); return; } }catch(e){ console.warn('[m15] resume the epilogue', e); }
  return orig.apply(this, arguments);
});
/* the Season 1 path (v13_core: last slide → Season 2) is untouched; ours is guarded by V13._s2Epi */
V13.wrap('advanceEpilogue', orig => function(){
  if(!V13._s2Epi) return orig.apply(this, arguments);
  EPI.i++;
  if(EPI.i >= EPI.slides.length){ endSeasonTwo(); return; }
  renderEpilogue();
});

/* ---------- (RT04) wayfinding: on Senior the Monday objective is shown, not pointed at; Recruit keeps the pointer ---------- */
if(window.WAY && WAY.OBJ_TARGETS) WAY.OBJ_TARGETS.m15 = Object.assign(WAY.OBJ_TARGETS.m15 || {}, { o15_name:()=>rec() ? null : { ui:true } });

/* ---------- achievements ---------- */
(function(){
  if(typeof ACHIEVEMENTS === 'undefined') return;
  const add = [
    { id:'before_he_said_it', name:'Before He Said It', desc:'Seal the right name before anyone says it out loud.' },
    { id:'ninth_floor', name:'The Ninth Floor', desc:'Close Operation Upstream with the proof beyond doubt.' },
    { id:'season_two', name:'Season Two', desc:'Finish Operation Upstream.' },
  ];
  for(const a of add) if(!ACHIEVEMENTS.some(x => x.id === a.id)) ACHIEVEMENTS.push(a);
})();
})();
