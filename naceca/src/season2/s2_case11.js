/* =========================================================================
   NACECA · v13 Case 11 — Black Rain (Ethiope creeks, 01:20)
   Pa Timi at his landing at dusk. Uche's chart of the three forks. The run
   in with the engine off, and a kpo-fire camp at work, watched by its own
   boys: samples at the cooling drum, the waybill book under Felix's lamp,
   Felix himself. The escort runs for the mangroves. Then what becomes of
   the camp and its boys, and of TEKENA 2, loaded at the far jetty.
   ========================================================================= */
(function(){
'use strict';
const V13 = window.V13, MC = V13.mc;
const KEY = 'creek', ID = 'm11', PI = Math.PI;
const RT = ()=>V13.rt;
const here = ()=>S.game && S.game.currentMission === ID;
const A = (n, d)=>V13.at(KEY, n, d);
const busy = ()=>(typeof isOverlayOpen === 'function' && isOverlayOpen()) || !!document.querySelector('#title-card.show');
const rec = ()=>V13.rec ? V13.rec() : (typeof isRecruit === 'function' && isRecruit());
/* our wayfinding (beta/wayfind.js): the route is chosen in Uche's chart, not in the world; on Senior the tracker
   shows the objective only (Recruit keeps the old pointer: a null row) */
if(window.WAY && WAY.OBJ_TARGETS){
  WAY.OBJ_TARGETS.m11 = Object.assign(WAY.OBJ_TARGETS.m11 || {}, { o11_route:()=>rec() ? null : { ui:true } });
}

/* A choice that carries a flag but no effect never reaches moralChoices
   (applyEffect returns early when there is no effect). This case's
   decisions are mostly like that, so while it runs the flag is applied. */
V13.wrap('applyEffect', orig => function(eff, flag){
  if(!eff && flag && typeof flag === 'object' && here()) return orig.call(this, {}, flag);
  return orig.apply(this, arguments);
});
/* the water under the camp: the river bed of sounds (lapping water, an engine far off, a generator) */
(function(){
  const SND = window.V12 && V12.SND; if(!SND || typeof SND.scene !== 'function' || SND._c11) return;
  const orig = SND.scene; SND._c11 = true;
  SND.scene = function(mid){ return orig.call(this, mid === ID ? 'm6' : mid); };
})();

/* ---------- people talk when they speak ----------
   The speaker of each line plays a talking clip (standing or sitting, as they are); the last
   speaker settles back when the next one starts or the conversation ends. */
const TALK_OF = { idle:'talk', folded:'talk', phone:'talk', talk:'talk', sit:'sit_talk', sit_talk:'sit_talk' };
const SPEAKER = { 'PA TIMI':'timi', 'FELIX UGBEKILE':'felix', 'SGT. UCHE':'uche', 'CAMP ESCORT':'escort', 'CAMP BOY':'tari', 'AGENT KELECHI':'player' };
const LINE_CUE = {
  // Kelechi takes the other end of the net
  'm11_timi_source:0':()=>{ const P = ENGINE.player; V13.once(P, 'pickup', 'crouch'); P.userData.c11before = null; },
};
function meshOf(k){ const R = RT(); return k === 'player' ? ENGINE.player : k === 'tari' ? (R.tari && R.tari.m) : R[k]; }
function speak(m){
  const a = m && m.userData && m.userData.anim; if(!a) return;
  const cur = a.curName, t = TALK_OF[cur]; if(!t) return;
  if(cur !== 'talk' && cur !== 'sit_talk') m.userData.c11before = cur;
  if(cur !== t) V13.play(m, t, { fade:0.25 });
}
function hush(m){
  const a = m && m.userData && m.userData.anim; if(!a) return;
  if((a.curName === 'talk' || a.curName === 'sit_talk') && m.userData.c11before) V13.play(m, m.userData.c11before, { fade:0.3 });
  m.userData.c11before = null;
}
V13.wrap('renderDialogueLine', orig => function(){
  try{
    if(here() && typeof DLG !== 'undefined' && DLG.script){
      const R = RT(), line = DLG.script[DLG.idx];
      if(line){
        const who = SPEAKER[line.speaker] || null;
        if(R.talking && R.talking !== who) hush(meshOf(R.talking));
        R.talking = who; if(who) speak(meshOf(who));
        const key = V13.dlgKey ? V13.dlgKey() : Object.keys(DIALOGUE).find(k => DIALOGUE[k] === DLG.script), cue = key && LINE_CUE[key + ':' + DLG.idx];
        if(cue) cue();
      }
    }
  }catch(e){ console.warn('[c11] line cue', e); }
  return orig.apply(this, arguments);
});
V13.wrap('endDialogue', orig => function(){
  try{ if(here()){ const R = RT(); if(R.talking){ hush(meshOf(R.talking)); R.talking = null; } } }catch(e){}
  return orig.apply(this, arguments);
});

/* ---------- the few lines the written scenes don't cover (m11_x_) ---------- */
const X = {
  m11_x_hint:"The cooling drum is past the pit, by the first fire. Stay low, and watch which way the boys are facing.",
  m11_x_hint_sr:"Stay low, sir.",                                   // Senior Agent: the rule, not the place
  m11_x_late:"They heard an engine on the wrong creek. Every boy in there is awake. Slower than slow, sir.",
  m11_x_samples_first:"Not yet, sir. Samples first. The minute that man looks up, this camp wakes.",
  m11_x_secured:"Camp's ours, sir. Eight boys on the boardwalk, and Felix hasn't moved from his chair.",
  m11_x_not_yet:"The drum, the book and the man first, sir. Once we decide about this camp, there's no coming back for any of it.",
  m11_x_samples_late:"Nobody left at the far drum to turn around, sir. Still your call.",
};

/* ---------- tuning ---------- */
const TUNE = {
  eyes:{ radius:6.6, fov:1.1, rate:0.34, decay:0.11 },
  eyesLate:{ radius:7.6, fov:1.2, rate:0.5, decay:0.07 },
  run:4.2, runLate:4.5,                                // the escort's top speed (the player sprints at 5.2)
  tari:{ away:6.2, back:2.8 }, tariLate:{ away:4.6, back:3.4 },
};
const SIT_Y = -0.42;                                   // a seat on the edge of the boardwalk: legs over the water
const ROW = Array.from({ length:8 }, (_, i)=>({ x:-13.9 + i * 0.45, z:5.33, rot:PI }));
const DRUM = { x:2.0, z:-0.3 };                        // cooling drum 1, by the first still
const CHAIR = { x:-7.1, z:6.2, rot:PI / 2 };           // Felix's chair under the tarp
const ESCAPE = [[12.2, -5.3], [8.6, -6.4], [4.2, -7.3], [2.0, -8.0], [2.0, -18.0], [14.0, -18.0], [15.4, -18.0]];
const LANDING = [[-13.0, 1.25, 17.9], [-15.3, 0.9, 15.2]];      // the landing shot: Pa Timi's canoe, looking away from the camp
const AT_LANDING = { kel:[-14.55, 14.9], uche:[-13.8, 14.2] };
const DECIDE = [[-11.3, 1.9, 2.2], [-11.6, 0.05, 6.0]];          // the boys in a row on the boardwalk, seen from the water
const NAME = { x:15.985, y:0.4, z:-0.2 };                          // TEKENA 2, painted on her side above the waterline
// on the jetty for her: Kelechi and Uche looking down her side, her name along the right of the frame
const AT_BARGE = { cam:[9.8, 2.6, 7.6], kel:[13.0, 3.0], uche:[12.2, 3.5] };

/* ---------- the boys of the camp ---------- */
const SKINS = ['#3e2618', '#4a2b1c', '#3a2216', '#5a3826', '#4e2e1e', '#3e2418', '#4a2b1c', '#3a2216'];
function boyLook(i){
  const bare = { torso:null, armA:null, armB:null, armC:null };
  const tops = [bare, { torso:'#6a5a48', armA:'#6a5a48', armB:'#6a5a48', armC:null }, bare, null, { torso:'#2a3a4a', armA:'#2a3a4a', armB:null, armC:null },
                { torso:'#7a3a2a', armA:'#7a3a2a', armB:'#7a3a2a', armC:null }, bare, { torso:'#3a3a36', armA:'#3a3a36', armB:'#3a3a36', armC:'#3a3a36' }];
  const legs = ['#2a2a2a', '#3a3a5a', '#4a3a2a', '#2a2a2a', '#1e1e22', '#5a4a3a', '#2a2a3a', '#3a2a22'];
  if(i === 3) return V13.look('campboy', { hips:'#2a2a2a', thigh:'#2a2a2a', shin:null, shoe:null });    // Tari
  return Object.assign({ body:'M', skin:SKINS[i], hair:'#0c0a09', beard:null, hips:legs[i], thigh:legs[i], shin:i % 3 === 0 ? legs[i] : null, shoe:i % 2 ? '#2a2420' : null, gear:i === 7 ? ['Gear_Fila'] : [], cap:'#8a2a1a' }, tops[i]);
}
/* where each one works, and what doing */
const WORK = [
  { clip:'crouch', gl:1.6 },              // 0 · feeding the first still
  { clip:'interact', gl:1.9 },            // 1 · the second still
  { clip:'fix', gl:1.5 },                 // 2 · the third still
  { clip:'interact', tari:true },         // 3 · Tari, at cooling drum 1's basin
  { clip:'interact', gl:1.7 },            // 4 · buckets at the crude pit
  { clip:'fix', gl:2.0 },                 // 5 · the drum stack
  { clip:'carry', gl:1.4 },               // 6 · the far drum stack
  { clip:'carry', gl:1.8 },               // 7 · jerrycans on the barge jetty
];
/* where they run when the camp is blown */
const SCATTER = [[-0.6, 9.3], [4.2, 9.5], [10.8, 7.6], [5.6, -2.6], [-3.8, 9.5], [-8.8, -6.0], [11.4, -1.2], [13.9, 3.5]];

/* ---------- small helpers ---------- */
/* a conversation's callback runs once, whatever happens to the dialogue box */
const once = fn => { let done = false; return function(){ if(done) return; done = true; if(fn) return fn.apply(this, arguments); }; };
const say = (key, cb)=>V13.say(key, once(cb));
const run = (name, parts, cb)=>V13.run(name, parts, once(cb));
const yawTo = (o, x, z)=>Math.atan2(x - o.position.x, z - o.position.z);
function turn(o, want, maxStep){
  let d = want - o.rotation.y; while(d > PI) d -= PI * 2; while(d < -PI) d += PI * 2;
  o.rotation.y += Math.max(-maxStep, Math.min(maxStep, d));
  return Math.abs(d) < 0.02;
}
/* a fixed shot. The camera only follows while the game is playing (not under a dialogue),
   so a shot is cut to at once: the camera is put there now. On a phone held sideways the
   dialogue box covers the lower half of the screen and the portrait sits at the top, so the
   camera tilts down a little and whoever the shot is about rides up into the band between them. */
function shot(pos, look, plain){
  const p = new THREE.Vector3(pos[0], pos[1], pos[2]), l = new THREE.Vector3(look[0], look[1], look[2]);
  if(!plain && window.innerHeight < 520) l.y -= 0.16 * Math.hypot(l.x - p.x, l.z - p.z);
  TPCAM.override = { pos:p, look:l };
  const c = ENGINE.camera; if(c){ c.position.copy(p); c.lookAt(l); }
  if(TPCAM.pos && TPCAM.look){ TPCAM.pos.copy(p); TPCAM.look.copy(l); TPCAM.cur = true; } else TPCAM.cur = null;
}
function unshot(){ TPCAM.override = null; }
/* over Kelechi's right shoulder, looking at someone; pushed back out from under a roof if need be */
const TARP = { x0:-8.05, x1:-3.95, z0:4.25, z1:7.95 };
function overShoulder(o, opt){
  opt = opt || {};
  const P = ENGINE.player.position, Q = o.position, dx = Q.x - P.x, dz = Q.z - P.z, L = Math.hypot(dx, dz) || 1, fx = dx / L, fz = dz / L;
  const rx = -fz, rz = fx;                                         // the right of the line of sight (as the follow camera has it)
  let back = opt.back || 1.9, x, z;
  const inBox = (x, z)=>opt.box && x > opt.box.x0 && x < opt.box.x1 && z > opt.box.z0 && z < opt.box.z1;
  do { x = P.x - fx * back + rx * 0.62; z = P.z - fz * back + rz * 0.62; back += 0.25; } while(inBox(x, z) && back < 4.5);
  frame([x, opt.h || 1.75, z], [Q.x, opt.lookH || 1.1, Q.z], opt.side);
}
/* a shot of a point, set to the right of the frame: the speaker's portrait sits in the middle of the
   screen during a conversation, and the dialogue box along the bottom */
function frame(cam, at, side){
  const dx = at[0] - cam[0], dz = at[2] - cam[2], L = Math.hypot(dx, dz) || 1;
  const rx = -dz / L, rz = dx / L, k = (side == null ? 0.42 : side) * L;   // ~23° to the right of the centre
  shot(cam, [at[0] - rx * k, at[1], at[2] - rz * k]);
}
/* two people side by side, from the side, a little way off */
function sideShot(o){
  const P = ENGINE.player.position, Q = o.position, mx = (P.x + Q.x) / 2, mz = (P.z + Q.z) / 2;
  let dx = Q.x - P.x, dz = Q.z - P.z; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
  frame([mx - dz * 3.4, 1.7, mz + dx * 3.4], [mx, 1.0, mz], 0.3);
}
/* a toast, a hint, a radio line or a stale [E] prompt must not sit on top of a conversation */
function quietToast(){
  for(const id of ['toast', 'hint-chip', 'radio-sub']){ const t = document.getElementById(id); if(t) t.classList.remove('show'); }
  if(typeof RADIO !== 'undefined' && RADIO.queue) RADIO.queue.length = 0;
  if(typeof showPrompt === 'function') showPrompt(null);
}
function placeAt(o, x, z, rot, y){ o.userData._c11w = 0; o.position.set(x, y || 0, z); if(rot != null) o.rotation.y = rot; }
function placePlayer(x, z, rot){
  const P = ENGINE.player; P.position.set(x, 0, z); P.rotation.y = rot;
  ENGINE.playerYaw = ENGINE.cameraYaw = rot; ENGINE.playerPitch = 0.42;
  if(!TPCAM.override){ TPCAM.cur = null; try{ updateCamera(); }catch(e){} }
}
/* the op's arrest count (the aftermath shows it, and adds 5 heat for each): Felix, and the escort if caught */
const arrest = n => { S.game.arrests = (S.game.arrests || 0) + (n || 1); };
/* removable obstacles (people standing at their work) */
function block(x, z, w){ const o = { minX:x - w / 2, maxX:x + w / 2, minZ:z - w / 2, maxZ:z + w / 2 }; (ENGINE.obstacles || (ENGINE.obstacles = [])).push(o); return o; }
function unblock(o){ const L = ENGINE.obstacles || []; const i = L.indexOf(o); if(i >= 0) L.splice(i, 1); }
/* a fail-forward and a solve both close with `true`: read the document's own outcome (s2_core.js V13.docFailed);
   without it, the document's own rule: 3 misses on Recruit casework, 2 on Senior (v12_docs.js), not the Action pace */
function failedDoc(key){
  if(V13.docFailed && V13._docRes && V13._docRes[key]) return V13.docFailed(key);
  return ((S.game._docMiss || {})[key] || 0) >= (rec() ? 3 : 2);
}
/* the flag a decision set (and set it, if the dialogue layer didn't) */
function decided(key, fk, dflt){
  if(MC()[fk] != null) return MC()[fk];
  const i = V13.picked(key), line = (DIALOGUE[key] || []).find(l => l.choices), c = line && i != null ? line.choices[i] : null;
  if(c && c.flag) for(const k in c.flag) V13.setFlag(k, c.flag[k]);
  if(MC()[fk] == null && dflt != null) V13.setFlag(fk, dflt);
  return MC()[fk];
}
/* a walk that a later walk (or a placement) cancels: go(ch, path, opt) → Promise (resolves only if it finishes) */
let walkId = 0;
function go(ch, path, opt){
  opt = opt || {}; const id = ++walkId, speed = opt.speed || 1.4; let seg = 0;
  ch.userData._c11w = id; V13.play(ch, opt.clip || 'walk', { fade:0.2 });
  return new Promise(res => V13.every(dt => {
    if(ch.userData._c11w !== id) return false;
    let step = speed * dt;
    while(step > 0 && seg < path.length){
      const b = path[seg], dx = b[0] - ch.position.x, dz = b[1] - ch.position.z, d = Math.hypot(dx, dz);
      if(d <= step){ ch.position.x = b[0]; ch.position.z = b[1]; step -= d; seg++; }
      else { ch.position.x += dx / d * step; ch.position.z += dz / d * step; ch.rotation.y = Math.atan2(dx, dz); step = 0; }
    }
    if(seg >= path.length){ ch.userData._c11w = 0; V13.play(ch, opt.end || 'idle', { fade:0.25 }); if(opt.face != null) ch.rotation.y = opt.face; res(); return false; }
  }));
}
/* run code once nothing is on screen (no dialogue, document, card or staged move) */
function whenFree(fn){ V13.every(()=>{ if(busy() || ENGINE.seq) return; fn(); return false; }); }
/* an objective at the top of the list (the HUD shows the first one not done) */
function objFront(id, text){
  const L = S.game.objectives || (S.game.objectives = []);
  if(L.some(o => o.id === id)) return;
  L.unshift({ id, text, done:false }); if(typeof renderObjectives === 'function') renderObjectives();
}

/* ---------- sky: dusk at the landing, dawn at the end ---------- */
let skyTex = {};
function skyTexture(kind){
  if(skyTex[kind]) return skyTex[kind];
  const c = document.createElement('canvas'); c.width = 4; c.height = 256; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 256);
  // the background is drawn screen-wide: the horizon sits a little above the middle of the frame
  if(kind === 'dusk'){ g.addColorStop(0, '#161a36'); g.addColorStop(0.22, '#33284e'); g.addColorStop(0.36, '#6a3456'); g.addColorStop(0.46, '#c2603e'); g.addColorStop(0.52, '#e08a4a'); g.addColorStop(0.62, '#4a2a2e'); g.addColorStop(1, '#1a1214'); }
  else { g.addColorStop(0, '#24345a'); g.addColorStop(0.24, '#4a5a82'); g.addColorStop(0.38, '#9a8aa0'); g.addColorStop(0.47, '#e0a882'); g.addColorStop(0.53, '#f4c896'); g.addColorStop(0.64, '#5a4a4c'); g.addColorStop(1, '#2a2226'); }
  x.fillStyle = g; x.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return (skyTex[kind] = t);
}
/* The scene's own hemisphere and key lights are re-coloured for dusk and dawn (and lifted a
   little at night so the people read against the dark). No light is ever added or removed:
   a change in the number of lights recompiles every lit material. */
const LOOK = {
  night:{ hemi:0.62, sky:null, key:null },
  dusk:{ hemi:0.8, sky:'#c89a98', ground:'#3a2420', key:'#ff9a5a', keyI:1.0, keyP:[-30, 6, 20], fog:'#5a3848', far:45 },
  dawn:{ hemi:0.8, sky:'#a8acc8', ground:'#3a3028', key:'#ffc89a', keyI:0.95, keyP:[30, 6, -14], fog:'#6a6070', far:60 },
};
function sky(kind){
  const R = RT(), sc = ENGINE.scene, D = (R.dr && R.dr.D) || {};
  if(!sc) return;
  if(!R.sky0){
    const hemi = sc.children.find(o => o.isHemisphereLight), key = sc.children.find(o => o.isDirectionalLight);
    R.sky0 = { bg:sc.background, fog:sc.fog ? sc.fog.color.clone() : null, near:sc.fog ? sc.fog.near : 0, far:sc.fog ? sc.fog.far : 0, hemi, key,
      hemiI:hemi ? hemi.intensity : 0, hemiSky:hemi ? hemi.color.clone() : null, hemiGround:hemi ? hemi.groundColor.clone() : null,
      keyI:key ? key.intensity : 0, keyC:key ? key.color.clone() : null, keyP:key ? key.position.clone() : null };
  }
  const Z = R.sky0, Lk = LOOK[kind || 'night'];
  if(Z.hemi){ Z.hemi.intensity = Lk.hemi; Z.hemi.color.copy(Lk.sky ? new THREE.Color(Lk.sky) : Z.hemiSky); Z.hemi.groundColor.copy(Lk.ground ? new THREE.Color(Lk.ground) : Z.hemiGround); }
  if(Z.key){ Z.key.intensity = Lk.key ? Lk.keyI : Z.keyI; Z.key.color.copy(Lk.key ? new THREE.Color(Lk.key) : Z.keyC); if(Lk.keyP) Z.key.position.set(Lk.keyP[0], Lk.keyP[1], Lk.keyP[2]); else Z.key.position.copy(Z.keyP); }
  if(!kind){
    sc.background = Z.bg; if(sc.fog && Z.fog){ sc.fog.color.copy(Z.fog); sc.fog.near = Z.near; sc.fog.far = Z.far; }
    if(D.Pano) D.Pano.visible = true; if(D.Wall) D.Wall.visible = true; return;
  }
  // the painted night sky and the near wall of mangroves give way to an open sky
  if(D.Pano) D.Pano.visible = false; if(D.Wall) D.Wall.visible = false;
  sc.background = skyTexture(kind);
  if(sc.fog){ sc.fog.color.set(Lk.fog); sc.fog.near = 5; sc.fog.far = Lk.far; }
}

/* ---------- fire and smoke of our own (they run through dialogue: the world's fx list) ---------- */
let glowTex = null;
function glowTexture(){
  if(glowTex) return glowTex;
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 1, 32, 32, 31); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64); return (glowTex = new THREE.CanvasTexture(c));
}
function fx(fn){ const L = V13.world && V13.world.live; if(L && L.fx) L.fx.push(fn); }
/* a burning heap: additive flame sprites and a black column leaning north-east */
function blaze(x, z, k){
  const sc = ENGINE.scene, parts = [], smoke = [], st = { k:k || 1, grow:0 };
  for(let i = 0; i < 12; i++){
    const m = new THREE.SpriteMaterial({ map:glowTexture(), color:new THREE.Color(i % 3 ? '#ff5a0e' : '#ff8a1e'), transparent:true, depthWrite:false, opacity:0 });
    const s = new THREE.Sprite(m); s.renderOrder = 4; sc.add(s); parts.push({ s, t:Math.random() * 1.2, ox:(Math.random() - 0.5) * 1.6, oz:(Math.random() - 0.5) * 1.6 });
  }
  for(let i = 0; i < 16; i++){
    const m = new THREE.SpriteMaterial({ map:glowTexture(), color:new THREE.Color(0.012, 0.011, 0.01), transparent:true, depthWrite:false, opacity:0 });
    const s = new THREE.Sprite(m); s.renderOrder = 3; sc.add(s); smoke.push({ s, t:(i / 16) * 7, ox:(Math.random() - 0.5) * 1.2, oz:(Math.random() - 0.5) * 1.2 });
  }
  fx((t, dt)=>{
    st.grow = Math.min(1, st.grow + dt / 18); const g = st.k * (0.65 + 0.55 * st.grow);
    for(const p of parts){
      p.t += dt; if(p.t > 1.2) p.t -= 1.2; const q = p.t / 1.2;
      p.s.position.set(x + p.ox * (1 - q * 0.6), 0.3 + q * 2.6 * g, z + p.oz * (1 - q * 0.6));
      const sz = (1.5 - q) * 1.5 * g; p.s.scale.set(sz, sz * 1.25, 1);
      p.s.material.opacity = 0.8 * Math.sin(PI * Math.min(1, q * 1.1)) * (0.8 + 0.2 * Math.sin(t * 17 + p.ox * 9));
    }
    for(const p of smoke){
      p.t += dt; if(p.t > 7) p.t -= 7; const q = p.t / 7;
      p.s.position.set(x + p.ox + q * 5.5 * g, 2.2 + q * 11 * g, z + p.oz - q * 3.5 * g);
      const sz = (1.4 + q * 5.5) * g; p.s.scale.set(sz, sz, 1);
      p.s.material.opacity = 0.75 * Math.sin(PI * Math.min(1, q * 1.15));
    }
  });
  return st;
}

/* ---------- the case ---------- */
V13.defCase(ID, {
  title:'Black Rain', region:'Delta', sub:'Ethiope Creeks · 01:20', evMax:4, xp:360, ambient:'asaba',
  objectives:()=>[
    { id:'o11_timi', text:'Hear Pa Timi out at the landing' },
    { id:'o11_route', text:'Work out which fork hides the camp' },
    { id:'o11_samples', text:'Take product samples at the cooling drum' },
    { id:'o11_waybills', text:'Find the camp\'s paperwork' },
    { id:'o11_felix', text:'Find the man who runs the camp' },
    { id:'o11_camp', text:'Decide what happens to the camp' },
    { id:'o11_barge', text:'TEKENA 2, at the far jetty' },
  ],
  reset(){
    const g = S.game;
    for(const k of ['s2_timi', 's2_samples', 's2_felix', 's2_camp', 's2_barge']){ delete MC()[k]; if(g.flags) delete g.flags[k]; }
    for(const k of ['m11_route', 'm11_waybills']) for(const t of ['_docMiss', '_docFree', '_docLocked']) if(g[t]) delete g[t][k];
    // a replay starts the camp's evidence afresh
    const ids = ['fuel_samples', 'waybill_book', 'felix_phone', 'barge_track'];
    if(Array.isArray(g.evidence)) g.evidence = g.evidence.filter(e => !ids.includes(e.id));
    if(g.evQ) for(const id of ids) delete g.evQ[id];
    for(const k of ['m11_timi', 'm11_samples', 'm11_felix', 'm11_camp_decide', 'm11_barge', 'm11_x_samples_late']) delete V13._picks[k];
  },
  build(){
    const R = RT();
    V13.scene(KEY, { start:'start' });
    Object.assign(R, { phase:'landing', late:false, made:false, bolted:false, caught:null, workers:[], blocks:[] });
    // the landing: Pa Timi in his canoe, Uche on the boards
    const fm = A('fisherman');
    // (a grey beard rather than a white one: in the dark a white beard reads as a mask)
    R.timi = V13.person(V13.look('timi', { beard:'#4e4a46', hair:'#3e3a36' }), { x:fm.x, y:fm.a && fm.a.y != null ? fm.a.y : -0.1, z:fm.z, rot:fm.rot }, { clip:'sit', solid:false, id:'timi' });
    R.uche = V13.person({}, { x:AT_LANDING.uche[0], z:AT_LANDING.uche[1], rot:0 }, { kind:'uche', solid:false, id:'uche' });
    R.uche.rotation.y = yawTo(R.uche, fm.x, fm.z);
    const P = ENGINE.player; P.position.set(AT_LANDING.kel[0], 0, AT_LANDING.kel[1]);
    P.rotation.y = yawTo(P, fm.x, fm.z); ENGINE.playerYaw = ENGINE.cameraYaw = P.rotation.y;
    // the camp at work (out of sight from the landing shot)
    const spots = V13.list(KEY, 'workers');
    spots.forEach((s, i)=>{
      const w = WORK[i] || WORK[0];
      const base = w.tari ? PI / 2 : s[2];
      const m = V13.person(boyLook(i), { x:s[0], z:s[1], rot:base }, { clip:w.clip, solid:false, id:'boy' + i });
      R.workers.push({ m, i, home:{ x:s[0], z:s[1] }, base, want:base, clip:w.clip, gl:w.gl || 1.6, tari:!!w.tari, t:2 + Math.random() * 6, look:false, away:true, mode:'work' });
      R.blocks.push(block(s[0], s[1], 0.55));
    });
    R.tari = R.workers[3];
    const fx_ = A('felix', { x:-5.2, z:6.6, rot:-2.2 });
    R.felix = V13.person('felix', { x:fx_.x, z:fx_.z, rot:fx_.rot }, { clip:'interact', solid:false, id:'felix' });
    R.felixBlock = block(fx_.x, fx_.z, 0.55);
    const es = A('escort', { x:13.5, z:-4.5, rot:-PI / 2 });
    R.escort = V13.person(V13.look('campescort', { torso:'#33363e', armA:'#33363e', armB:'#33363e', armC:'#33363e' }), { x:es.x, z:es.z, rot:es.rot }, { clip:'phone', solid:false, id:'escort' });
    R.escBase = es.rot;
    // the camp keeps out of the landing shot (and out of the first frames' work) until the run in
    for(const o of [R.felix, R.escort].concat(R.workers.map(w => w.m))) o.visible = false;
    V13.every(dt => life(dt));
    // a soft, cool moonlight from above that keeps to Kelechi (or to whoever a cutscene is about), so the
    // people read against the dark; the camp itself stays baked. Added before the first frame: no recompiles.
    R.fill = new THREE.PointLight('#8ea8dc', 0.75, 7.5, 1.6); ENGINE.scene.add(R.fill);
    R.drumPt = new THREE.Object3D(); R.drumPt.position.set(DRUM.x, 0, DRUM.z); ENGINE.scene.add(R.drumPt);   // (the fill's mark at the drum)
    // the world's smoke takes its colour as linear light and shows pale grey: make it smoke
    ENGINE.scene.children.forEach(o => { if(o.isSprite && o.renderOrder === 3 && o.material && o.material.color) o.material.color.setRGB(0.022, 0.019, 0.016); });
    // water, fires and smoke keep moving under a conversation; the fill keeps its place
    ENGINE.sceneAlways = dt => {
      if(!(ENGINE.movementEnabled && !isOverlayOpen()) && V13.world && V13.world.update) V13.world.update(dt);
      const on = R.fillOn && R.fillOn.parent, t = on ? R.fillOn : ENGINE.player;
      if(t && R.fill){
        if(on){
          // between the camera and the subject of the shot, a little above: his face, not his back
          const c = (TPCAM.override && TPCAM.override.pos) || ENGINE.camera.position;
          let dx = c.x - t.position.x, dz = c.z - t.position.z; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
          R.fill.position.set(t.position.x + dx * 1.3, t.position.y + 1.9, t.position.z + dz * 1.3); R.fill.intensity = 1.5;
        }
        else { R.fill.position.set(t.position.x - 0.5, t.position.y + 2.9, t.position.z + 0.6); R.fill.intensity = 0.75; }
      }
    };
    // the landing is dusk, and a fixed shot: no camp in it
    sky('dusk');
    ENGINE.movementEnabled = false;
    shot(LANDING[0], LANDING[1]);
    V13._c11 = { R, X, bolt, made, secure, campDecide, theEnd };
  },
  start(){
    const R = RT();
    V13.skip(['DUSK', 'PA TIMI\'S LANDING · 19:05'], ()=>{
      ENGINE.movementEnabled = false; shot(LANDING[0], LANDING[1]);
      say('m11_timi', ()=>{
        decided('m11_timi', 's2_timi', 'cold');
        V13.play(R.timi, 'sit');
        V13.done('o11_timi');
        setTimeout(route, 500);
      });
    }, 2400);
  },
});

/* ---------- the route: which fork hides the camp ---------- */
function route(){
  const m = MC(), R = RT(); R.phase = 'route';
  if(m.s2_statement === 'car' || m.s2_jetty === 'both'){
    // the camp's creek is already named: no chart tonight
    V13.done('o11_route'); R.routeKnown = m.s2_statement === 'car' ? 'car' : 'boatman';
    V13.toast('EKRE CREEK', R.routeKnown === 'car' ? 'Lucky named it in the car: "Ekre side."' : 'The boatman named it at the jetty: "Past the second bend, Ekre side."', 2600);
    setTimeout(()=>runIn(false), 2300);
    return;
  }
  let resolved = false;
  const open = ()=>V13.doc('m11_route', ()=>{
    if(resolved) return;                                        // (the document's close can fire twice)
    resolved = true;
    const bad = failedDoc('m11_route');
    V13.done('o11_route');
    if(!bad){ runIn(false); return; }
    // the wrong water: the long way round, and a camp that heard an engine
    const sel = document.querySelector('#screen-puzzle .v12-opt.sel'), pick = sel ? sel.textContent.trim() : '';
    const fork = /ogho/i.test(pick) ? 'OGHO CHANNEL' : 'OKO WATERS';
    R.wrongFork = fork;
    V13.skip([fork, 'THE WRONG FORK · 00:35', 'Forty minutes of nothing, and the long way back'], ()=>runIn(true), 3000);
  });
  open();
  // backing out of the chart doesn't get the boat moving: Uche holds it out again. (A plain timer:
  // the landing is a held shot, and the case's per-frame ticks only run while Kelechi can move.)
  let away = 0;
  const watch = setInterval(()=>{
    if(resolved || !here()){ clearInterval(watch); return; }
    if(busy()){ away = 0; return; }
    if(++away === 1) V13.toast('UCHE\'S CHART', '"We can\'t paddle in blind, sir."', 1600);
    if(away >= 3){ away = 0; open(); }
  }, 500);
}

/* ---------- the run in ---------- */
function runIn(late){
  const R = RT(); if(R.ranIn) return; R.ranIn = true;
  R.late = late; R.phase = 'runin';
  V13.skip(late ? ['01:55', 'EKRE CREEK', 'Below the second bend · thirty-five minutes late'] : ['01:20', 'EKRE CREEK', 'Below the second bend'], ()=>{
    ENGINE.movementEnabled = false;
    quietToast();
    shot([-8.2, 2.3, 1.2], [3.5, 0.7, 2.6]);                        // the camp from its edge: the pit, the three fires
    say('m11_arrive', ()=>{ unshot(); ENGINE.movementEnabled = true; sneak(); });
  }, 2800);
  setTimeout(()=>{
    // night again; the boat noses into the mangrove roots at the camp's edge
    sky(null); unshot();
    for(const o of [R.felix, R.escort].concat(R.workers.map(w => w.m))) o.visible = true;
    placePlayer(-9.3, 3.7, PI / 2);
    placeAt(R.uche, -10.1, 5.55, PI / 2); V13.play(R.uche, 'crouch');
    V13.play(ENGINE.player, 'crouch', { fade:0 });
    R.follow = follower(R.uche); R.follow.hold(true, 'crouch');
    V13.play(R.timi, 'sit');
  }, 700);
}

/* ---------- the camp at work ---------- */
function sneak(){
  const R = RT(); if(R.sneakOn) return; R.sneakOn = true; R.phase = 'sneak';
  const cfg = Object.assign({}, R.late ? TUNE.eyesLate : TUNE.eyes);
  V13.eyes(Object.assign(cfg, { label:'SUSPICION', watchers:R.workers.map(w => w.m).concat([R.escort]), onMade:made }));
  R.itSamples = V13.spot({ x:DRUM.x, y:1.0, z:DRUM.z }, 'Take samples from the cooling drum', it => samples(it), { range:1.75, verb:'collect' });
  R.itBook = V13.spot({ x:-6.0, y:0.85, z:6.0 }, 'Read the waybill book', it => book(it), { range:1.9, verb:'inspect', labelY:0.35 });
  R.itFelix = V13.talk(R.felix, 'Talk to Felix', it => felixTalk(it), { range:2.3 });
  // the desktop hint follows the crouch setting (tactics: Auto and Hold hold C, Toggle presses it)
  const toggle = !!(window.TAC && TAC.crouch && typeof TAC.crouch.mode === 'function' && TAC.crouch.mode() === 'toggle');
  if(typeof showHint === 'function') showHint('c11_crouch', (toggle ? 'Press <b>C</b> to crouch.' : 'Hold <b>C</b> to crouch.') + ' The boys see what is in front of them.', 'Tap <b>CROUCH</b>. The boys see what is in front of them.', 5600);
  setTimeout(()=>{ if(R.phase === 'sneak') V13.radio('SGT. UCHE', R.late ? X.m11_x_late : (rec() ? X.m11_x_hint : X.m11_x_hint_sr), 4600); }, 900);
}

/* the boys at work: Tari turns round to his basin every few seconds; the others glance up now and then */
function life(dt){
  const R = RT(); if(!R.workers) return;
  const working = R.phase === 'runin' || R.phase === 'sneak';
  for(const w of R.workers){
    if(w.mode !== 'work') continue;
    if(working){
      w.t -= dt;
      if(w.t <= 0){
        if(w.tari){
          w.away = !w.away; const T = R.late ? TUNE.tariLate : TUNE.tari;
          w.want = w.away ? PI / 2 : -PI / 2; w.t = w.away ? T.away : T.back;
          V13.play(w.m, w.away ? w.clip : 'idle', { fade:0.3 });
        } else {
          w.look = !w.look;
          w.want = w.look ? w.base + w.gl * (Math.random() < 0.5 ? -1 : 1) : w.base;
          w.t = w.look ? 1.8 + Math.random() * 1.2 : (R.late ? 4 + Math.random() * 4 : 7 + Math.random() * 6);
          V13.play(w.m, w.look ? 'idle' : w.clip, { fade:0.3 });
        }
      }
    }
    turn(w.m, w.want, dt * 3.4);
  }
  // the escort on his phone by the speedboat, looking up now and then
  if(working && R.escort && !R.bolted){
    R.escT = (R.escT == null ? 9 : R.escT) - dt;
    if(R.escT <= 0){ R.escLook = !R.escLook; R.escT = R.escLook ? 2.2 : 9 + Math.random() * 6; V13.play(R.escort, R.escLook ? 'idle' : 'phone', { fade:0.3 }); }
    turn(R.escort, R.escLook ? R.escBase + 0.9 : R.escBase, dt * 2.6);
  }
  // who is looking: a mark over the head of the one who has seen you
  if(R.phase === 'sneak' && V13.rt.eyes) mark(); else mark(true);
}
/* the mark over whoever has seen you: the tactics layer's head marker (.tac-mark: icon('eye'), icon('alert') and a
   suspicion bar, tactics.css) when it is on the page, else a sprite: icon('eye') in manila on an ink disc */
let markSpr = null, markEl = null, markBest = null;
const EYE_D = 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z';
function markHTML(){
  if(!markEl || !markEl.isConnected){
    const layer = document.getElementById('markers-layer') || document.getElementById('game-root') || document.body;
    markEl = document.createElement('div'); markEl.className = 'tac-mark c11-mark';
    markEl.innerHTML = '<span class="tac-mark-ico"></span><span class="tac-mark-bar"><i></i></span>';
    markEl.style.display = 'none'; layer.appendChild(markEl); markEl._lv = null;
  }
  return markEl;
}
function markSprite(){
  if(markSpr) return markSpr;
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  x.fillStyle = '#1C1C1A'; x.beginPath(); x.arc(32, 32, 30, 0, Math.PI * 2); x.fill();
  x.strokeStyle = '#E9DCC0'; x.lineWidth = 2; x.stroke();
  // the same eye as icon('eye') (beta/icons.js), stroked in manila
  x.save(); x.translate(8, 8); x.scale(2, 2); x.strokeStyle = '#E9DCC0'; x.lineWidth = 1.75; x.lineCap = 'round'; x.lineJoin = 'round';
  try{ x.stroke(new Path2D(EYE_D)); }catch(e){}
  x.beginPath(); x.arc(12, 12, 3, 0, Math.PI * 2); x.stroke(); x.restore();
  markSpr = new THREE.Sprite(new THREE.SpriteMaterial({ map:new THREE.CanvasTexture(c), transparent:true, depthTest:false, depthWrite:false }));
  markSpr.scale.set(0.42, 0.42, 1); markSpr.renderOrder = 9;
  return markSpr;
}
function markHide(){ if(markSpr) markSpr.visible = false; if(markEl) markEl.style.display = 'none'; markBest = null; }
function mark(off){
  const e = V13.rt.eyes, P = ENGINE.player;
  if(off || !e || !P){ markHide(); return; }
  let best = null, bv = 0;
  for(const w of e.watchers || []){
    if(!w || !w.visible) continue;
    const dx = P.position.x - w.position.x, dz = P.position.z - w.position.z, d = Math.hypot(dx, dz);
    if(d > e.radius) continue;
    const ang = Math.abs(((Math.atan2(dx, dz) - w.rotation.y + PI * 3) % (PI * 2)) - PI);
    if(ang > e.fov) continue;
    const v = 1 - d / e.radius; if(v > bv){ bv = v; best = w; }
  }
  if(!best){ markHide(); return; }
  markBest = best;
  if(window.TAC){
    if(markSpr) markSpr.visible = false;
    const el = markHTML(), lv = e.v > 0.66 ? 'alarm' : 'notice';
    if(el._lv !== lv){ el._lv = lv; el.dataset.level = lv; el.querySelector('.tac-mark-ico').innerHTML = typeof icon === 'function' ? icon(lv === 'alarm' ? 'alert' : 'eye') : ''; }
    el.querySelector('.tac-mark-bar i').style.width = Math.round(Math.max(0, Math.min(1, e.v)) * 100) + '%';
    markPlace();
    return;
  }
  const spr = markSprite();
  if(spr.parent !== ENGINE.scene) ENGINE.scene.add(spr);
  spr.visible = true; spr.position.set(best.position.x, 2.15, best.position.z);
  spr.material.color.set(e.v > 0.66 ? '#B3261E' : '#ffffff');
}
/* the head marker follows the camera every frame (as tactics' own markers do) */
function markPlace(){
  const el = markEl, w = markBest; if(!el || !w) return;
  let p = null;
  try{
    if(window.WAY && WAY.project) p = WAY.project(w.position.x, 2.2, w.position.z);
    else if(ENGINE.camera){ const v = new THREE.Vector3(w.position.x, 2.2, w.position.z); v.project(ENGINE.camera); p = { x:(v.x * 0.5 + 0.5) * innerWidth, y:(-v.y * 0.5 + 0.5) * innerHeight, behind:v.z > 1 }; }
  }catch(err){ p = null; }
  if(!p || p.behind || !isFinite(p.x) || !isFinite(p.y)){ el.style.display = 'none'; return; }
  el.style.display = '';
  el.style.transform = 'translate(' + Math.round(p.x) + 'px, ' + Math.round(p.y) + 'px) translate(-50%, -100%)';
}
if(typeof window.updateMarkers === 'function') V13.wrap('updateMarkers', orig => function(){
  const r = orig.apply(this, arguments);
  try{
    if(!here() || (V13.rt && V13.rt.id !== ID)){ if(markEl && markEl.style.display !== 'none') markHide(); }      // the case is over
    else if(markEl && markBest && markEl.style.display !== 'none') markPlace();
  }catch(e){}
  return r;
});
V13.c11mark = ()=>({ el:markEl ? { shown:markEl.style.display !== 'none', level:markEl.dataset.level || null, ico:!!markEl.querySelector('.tac-mark-ico svg') } : null, sprite:!!markSpr });

/* ---------- Uche: follows Kelechi's own footsteps (never through a still), low when he is low ---------- */
function follower(U){
  const crumbs = [], h = { on:true, held:true, heldClip:'crouch', mode:null };
  h.hold = (v, clip)=>{ h.held = !!v; if(clip) h.heldClip = clip; h.mode = null; if(!v){ crumbs.length = 0; } };
  V13.every(dt => {
    if(!h.on || !U.parent) return false;
    const P = ENGINE.player.position;
    const last = crumbs[crumbs.length - 1];
    if(!last || Math.hypot(P.x - last[0], P.z - last[1]) > 0.3) crumbs.push([P.x, P.z]);
    if(crumbs.length > 400) crumbs.shift();
    if(h.held){ if(h.mode !== 'held'){ h.mode = 'held'; V13.play(U, h.heldClip, { fade:0.25 }); } return; }
    const low = !!(ENGINE.keys && ENGINE.keys.KeyC);
    const d = Math.hypot(P.x - U.position.x, P.z - U.position.z), want = low ? 2.7 : 2.1;
    if(d > 14){
      // left far behind: catch up out of sight, a few steps back along the path
      let acc = 0, k = crumbs.length - 1;
      while(k > 0 && acc < 2.6){ acc += Math.hypot(crumbs[k][0] - crumbs[k - 1][0], crumbs[k][1] - crumbs[k - 1][1]); k--; }
      const c = crumbs[Math.max(0, k)] || [P.x, P.z]; U.position.x = c[0]; U.position.z = c[1]; crumbs.splice(0, Math.max(0, k));
      return;
    }
    while(crumbs.length && Math.hypot(crumbs[0][0] - U.position.x, crumbs[0][1] - U.position.z) < 0.3) crumbs.shift();
    if(d <= want || !crumbs.length){
      const clip = low ? 'crouch' : 'idle'; if(h.mode !== clip){ h.mode = clip; V13.play(U, clip, { fade:0.25 }); }
      turn(U, yawTo(U, P.x, P.z), dt * 4); return;
    }
    const t = crumbs[0], dx = t[0] - U.position.x, dz = t[1] - U.position.z, L = Math.hypot(dx, dz) || 1;
    const sp = low ? 1.5 : (d > 6 ? 4.6 : 2.1), step = Math.min(L, sp * dt);
    U.position.x += dx / L * step; U.position.z += dz / L * step; U.rotation.y = Math.atan2(dx, dz);
    const clip = low ? 'sneak' : (d > 6 ? 'jog' : 'walk'); if(h.mode !== clip){ h.mode = clip; V13.play(U, clip, { fade:0.2 }); }
  });
  return h;
}
/* Uche at Kelechi's shoulder for a conversation (he was never far) */
function ucheBeside(side, low){
  const R = RT(), P = ENGINE.player, U = R.uche, y = P.rotation.y, s = side || 1;
  const x = P.position.x - Math.sin(y) * 0.9 + Math.cos(y) * 0.9 * s, z = P.position.z - Math.cos(y) * 0.9 - Math.sin(y) * 0.9 * s;
  placeAt(U, x, z, y); if(R.follow) R.follow.hold(true, low ? 'crouch' : 'idle');
  V13.play(U, low ? 'crouch' : 'idle', { fade:0 });
}

/* ---------- the samples ---------- */
function samples(it){
  const R = RT(); if(busy() || ENGINE.seq || MC().s2_samples) return;
  const P = ENGINE.player, face = yawTo(P, DRUM.x, DRUM.z);
  P.rotation.y = face; ENGINE.playerYaw = face;
  if(R.phase === 'sneak'){
    ucheBeside(1, true);                                             // at his left: the camera looks over his right shoulder
    overShoulder({ position:{ x:DRUM.x + 0.4, z:DRUM.z } }, { back:2.1, h:1.6, lookH:0.7 }); quietToast();
    R.fillOn = R.drumPt;                                             // the drum, not just two backs in the dark
    say('m11_samples', ()=>{ unshot(); R.fillOn = null; takeSamples(it, true); });
  } else {
    // the camp is taken: nobody at the far drum now
    const L = DIALOGUE.m11_samples || [];
    const ask = Object.assign({}, L[2] || {}, { text:X.m11_x_samples_late, choices:((L[2] || {}).choices || []).map(c => { const o = Object.assign({}, c); delete o.next; return o; }) });
    run('m11_x_samples_late', [L[0], L[1], ask], ()=>{
      const v = decided('m11_x_samples_late', 's2_samples', 'grabbed');
      const S_ = DIALOGUE.m11_samples_sealed || [];
      run('m11_x_samples_after', v === 'sealed' ? [S_[0], S_[2]] : ['m11_samples_grabbed'], ()=>takeSamples(it, false));
    });
  }
}
function takeSamples(it, sneaking){
  const R = RT(), v = decided('m11_samples', 's2_samples', 'grabbed'), sealed = v === 'sealed';
  V13.drop(it);
  const P = ENGINE.player;
  // sealing is slow work with both hands: label, photograph, sign across the tape (low, if he came in low)
  if(sealed && sneaking){ V13.eyesBump(0.25); ENGINE.crouch = !!(ENGINE.keys && ENGINE.keys.KeyC); }
  playInteraction({ spot:[P.position.x, P.position.z], face:P.rotation.y, clip:sealed ? 'fix' : 'pickup', dur:sealed ? 4.2 : 1.3, hitAt:sealed ? 3.8 : 0.8,
    target:[DRUM.x, 0.9, DRUM.z], camBack:1.9, camSide:0.8, camUp:1.5,
    done:()=>{
      ENGINE.crouch = false;
      V13.ev('fuel_samples', 'Camp fuel samples', sealed ? 'good' : 'contested', 60);
      V13.done('o11_samples');
      if(R.follow && R.phase === 'sneak'){ R.follow.hold(false); }
      // (after the evidence note, not over it)
      if(R.phase === 'sneak') setTimeout(()=>{ if(R.phase === 'sneak' && !busy()) V13.toast(sealed ? 'SEALED' : 'ONE BOTTLE', sealed ? 'Three bottles, labelled and signed across the seal.' : 'Warm through the plastic. No label, no seal.', 1800); }, 1800);
      nextUp();
    } });
}

/* ---------- the waybill book ---------- */
function book(it){
  const R = RT(); if(busy() || ENGINE.seq) return;
  if(R.phase === 'sneak' && !MC().s2_samples){ V13.radio('SGT. UCHE', X.m11_x_samples_first, 3800); return; }
  V13.doc('m11_waybills', ()=>{
    if(R.bookDone) return; R.bookDone = true;
    const bad = failedDoc('m11_waybills');
    if(!V13.hasEv('waybill_book')) V13.ev('waybill_book', 'Forged Riverstone waybills', bad ? 'weak' : 'good', 40);
    S.game.evQ = S.game.evQ || {}; S.game.evQ.waybill_book = bad ? 'weak' : 'good';
    V13.drop(it); V13.done('o11_waybills');
    // he was standing right there: Felix looks up from his lamp (once the evidence note has had its moment)
    if(!MC().s2_felix && (R.phase === 'sneak' || R.phase === 'secured')) setTimeout(()=>{
      if(MC().s2_felix || R.felixBusy) return;
      if(V13.dist(R.felix) < 4.5) felixTalk(R.itFelix, true); else nextUp();
    }, 1900);
    else nextUp();
  });
}

/* ---------- Felix ---------- */
function felixTalk(it, fromBook){
  const R = RT(); if(MC().s2_felix || R.felixBusy) return;
  if(!fromBook && (busy() || ENGINE.seq)) return;
  if(R.phase === 'sneak' && !MC().s2_samples){ V13.radio('SGT. UCHE', X.m11_x_samples_first, 3800); return; }
  R.felixBusy = true;
  const F = R.felix, P = ENGINE.player;
  F.rotation.y = yawTo(F, P.position.x, P.position.z); P.rotation.y = yawTo(P, F.position.x, F.position.z); ENGINE.playerYaw = P.rotation.y;
  if(!F.userData.sitting) V13.play(F, 'idle', { fade:0.2 });           // he looks up from his book
  if(R.phase === 'sneak') ucheBeside(1, false);
  overShoulder(F, { box:TARP }); quietToast();
  say('m11_felix', ()=>{
    R.felixBusy = false;
    const v = decided('m11_felix', 's2_felix', 'arrested');
    unshot(); V13.drop(R.itFelix); V13.done('o11_felix'); arrest(1);
    if(!R.bolted){ V13.eyesOff(); mark(true); }                   // the talk is over: the camp is about to know anyway
    felixSits();
    if(v === 'cooperating') V13.toast('FELIX UGBEKILE', 'TEKENA 2 · the Riverstone tank farm · Thursdays', 2400);
    if(!R.bolted) setTimeout(()=>bolt('felix'), v === 'cooperating' ? 1900 : 700); else nextUp();
  });
}
function felixSits(){
  const R = RT(), F = R.felix; if(F.userData.sitting) return;
  F.userData.sitting = true; unblock(R.felixBlock);
  placeAt(F, CHAIR.x, CHAIR.z, CHAIR.rot); V13.play(F, 'sit', { fade:0.3 });
}

/* ---------- made, or the escort hears the talk at the shelter: he bolts ---------- */
function made(){
  const R = RT(); if(R.bolted) return;
  R.made = true;
  if(typeof sfxAlert === 'function') sfxAlert();
  applyEffect({ heat:+3 });                                        // every boy in the camp has seen NACECA's faces
  V13.toast('MADE', 'A boy at the fires shouts. The whole camp turns round.', 2000);
  bolt('made');
}
function bolt(why){
  const R = RT(); if(R.bolted) return;
  if(busy() || ENGINE.seq){ whenFree(()=>bolt(why)); return; }
  R.bolted = true; R.phase = 'bolt'; R.boltWhy = why;
  // nothing else in the camp answers until the chase is over
  for(const it of [R.itSamples, R.itBook, R.itFelix]) if(it) it.consumed = true;
  V13.eyesOff(); mark(true);
  ENGINE.movementEnabled = false; ENGINE.crouch = false;
  if(typeof showPrompt === 'function') showPrompt(null);
  // the camp scatters; Felix sits down and waits; Uche keeps his place
  scatter(); felixSits();
  if(R.follow) R.follow.hold(true, 'idle');
  const E = R.escort;
  E.rotation.y = yawTo(E, 14.8, -4.9); V13.play(E, 'interact', { fade:0.15 });
  frame([10.9, 1.9, -1.5], [13.5, 0.9, -4.5]); R.fillOn = E;
  setTimeout(()=>{ V13.toast('THE SPEEDBOAT', 'The outboard coughs once, and dies.', 1800); cough(); }, 500);
  setTimeout(()=>{
    E.rotation.y = yawTo(E, 8, -6.4); V13.play(E, 'idle'); quietToast();
    say('m11_escort_runs', ()=>{ unshot(); R.fillOn = null; ENGINE.movementEnabled = true; chase(); });
  }, R.late ? 1500 : 2200);
}
/* a cold outboard: three wet coughs */
function cough(){
  try{
    if(typeof AUDIO === 'undefined' || !AUDIO.enabled || !AUDIO.ctx || !AUDIO.sfxGain) return;
    const ctx = AUDIO.ctx, t0 = ctx.currentTime;
    for(let k = 0; k < 3; k++){
      const t = t0 + k * 0.32, o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(70 + k * 6, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.22);
      f.type = 'lowpass'; f.frequency.value = 380; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.12 - k * 0.03, t + 0.03); g.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
      o.connect(f); f.connect(g); g.connect(AUDIO.sfxGain); o.start(t); o.stop(t + 0.3);
    }
  }catch(e){}
}
function scatter(){
  const R = RT();
  for(const b of R.blocks) unblock(b);
  R.workers.forEach((w, i)=>{
    w.mode = 'run'; const s = SCATTER[i] || [w.home.x, w.home.z];
    setTimeout(()=>{ if(w.mode === 'run') go(w.m, [s], { speed:3.4 + Math.random() * 0.6, clip:'jog', end:'crouch' }).then(()=>{ w.m.rotation.y = yawTo(w.m, 0, 2); }); }, Math.random() * 500);
  });
}
function chase(){
  const R = RT(); R.phase = 'chase';
  objFront('o11_chase', 'Catch the camp escort');
  const E = R.escort;
  // the gold marker rides on the runner
  R.itRun = { mesh:E, label:'The camp escort', verb:'arrest', range:0.01, onInteract(){} };
  ENGINE.interactables.unshift(R.itRun);
  if(typeof showHint === 'function') showHint('c11_sprint', 'Hold <b>SHIFT</b> to sprint.', 'Tap the sprint button to sprint.', 4200);
  const c = V13.chase({ runner:E, path:[[E.position.x, E.position.z]].concat(ESCAPE), speed:R.late ? TUNE.runLate : TUNE.run, label:'CAMP ESCORT',
    onCaught:()=>{ V13.drop(R.itRun); R.caught = true; arrest(1);
      setTimeout(()=>{ quietToast(); sideShot(E); R.fillOn = E; say('m11_chase_caught', ()=>{ unshot(); R.fillOn = null; V13.ev('felix_phone', 'The escort\'s phone', 'good', 70); afterChase(); }); }, 1500); },
    onEscaped:()=>{ V13.drop(R.itRun); R.caught = false;
      const o = (S.game.objectives || []).find(x => x.id === 'o11_chase'); if(o){ o.text = 'The camp escort got away'; if(typeof renderObjectives === 'function') renderObjectives(); }
      setTimeout(()=>{ quietToast(); say('m11_chase_lost', afterChase); }, 1600); } });
  /* He runs flat out while someone is close behind him. Well ahead, he looks back and eases to a
     jog (down to 65% of his top speed with nobody within 13 m): from the shelter it is a long way
     round the pit to his boardwalk, and a player who sets off at once should still have him there. */
  const top = c.speed; let gait = 'sprint';
  V13.every(()=>{
    if(V13.rt.chase !== c) return false;
    const P = ENGINE.player.position, gap = Math.hypot(E.position.x - P.x, E.position.z - P.z);
    c.speed = top * (1 - 0.35 * Math.max(0, Math.min(1, (gap - 7) / 6)));
    if(gait === 'sprint' && c.speed < 3.3) gait = 'jog'; else if(gait === 'jog' && c.speed > 3.5) gait = 'sprint';
    V13.play(E, gait, { fade:0.3, speed:Math.max(0.6, Math.min(1.4, c.speed / (gait === 'sprint' ? 5.3 : 3.1))) });
  });
}
function afterChase(){
  const R = RT(); V13.done('o11_chase');
  R.phase = 'secured';
  V13.skip(['01:58', 'THE CAMP IS QUIET'], ()=>{ V13.radio('SGT. UCHE', X.m11_x_secured, 3800); nextUp(); }, 2400);
  setTimeout(secure, 700);
}

/* ---------- the camp, taken: the fires out, the boys in a row on the boardwalk ---------- */
function secure(){
  const R = RT(), D = (R.dr && R.dr.D) || {};
  for(const it of [R.itSamples, R.itBook, R.itFelix]) if(it) it.consumed = false;
  // the fires: out (the baked glow stays on the mud like embers); the smoke thins
  if(D.Fire) D.Fire.visible = false;
  for(const n of ['L_oven1', 'L_oven2', 'L_oven3']) if(D[n]) D[n].color.multiplyScalar(0.22);
  let k = 0; ENGINE.scene.children.forEach(o => { if(o.isSprite && o.renderOrder === 3 && !o.userData.c11){ if(k++ % 3) o.visible = false; } });
  R.workers.forEach((w, i)=>{
    w.mode = 'row'; R.rowDone = true;
    const s = ROW[i]; placeAt(w.m, s.x, s.z, s.rot, SIT_Y); V13.play(w.m, 'sit', { fade:0 });
  });
  // Tari sits where he can be seen
  // Uche stands over them; Pa Timi has come up from his boat
  placeAt(R.uche, -9.9, 6.3, -PI / 2 - 0.35); if(R.follow) R.follow.hold(true, 'folded'); V13.play(R.uche, 'folded', { fade:0 });
  placeAt(R.timi, -12.4, 6.45, PI); V13.play(R.timi, 'idle', { fade:0 });
  if(R.caught){ R.escort.visible = true; placeAt(R.escort, -9.0, 4.25, -PI / 2 - 0.3); V13.play(R.escort, 'kneel', { fade:0 }); }
  else R.escort.visible = false;
  felixSits();
  placePlayer(-7.9, 2.9, -1.2);                                    // looking across to the boys and Uche
  // the camp decision is Uche's to bring up, when the work here is done
  R.itUche = V13.talk(R.uche, 'Talk to Uche about the boys', it => {
    if(busy() || ENGINE.seq) return;
    if(!(MC().s2_samples && V13.objDone('o11_waybills') && MC().s2_felix)){ V13.radio('SGT. UCHE', X.m11_x_not_yet, 4200); return; }
    V13.drop(it); campDecide();
  }, { range:2.6 });
  // the not-yet-done jobs come first in the list (the gold marker follows the first)
  const L = ENGINE.interactables, i = L.indexOf(R.itUche); if(i >= 0){ L.splice(i, 1); L.push(R.itUche); }
}
/* after any piece of work: point at what's left */
function nextUp(){
  const R = RT();
  if(R.phase === 'secured' && MC().s2_samples && V13.objDone('o11_waybills') && MC().s2_felix && !R.toldUche){
    R.toldUche = true; setTimeout(()=>{ if(rec() && R.phase === 'secured' && !busy()) V13.toast('THE CAMP', 'Uche is waiting with the boys on the boardwalk.', 2200); }, 600);
  }
}

/* ---------- what happens to the camp ---------- */
function campDecide(){
  const R = RT(); R.phase = 'decide'; quietToast();
  placePlayer(-9.35, 5.55, -PI / 2);
  placeAt(R.uche, -10.0, 6.35); R.uche.rotation.y = yawTo(R.uche, -9.35, 5.55); V13.play(R.uche, 'idle');
  shot(DECIDE[0], DECIDE[1]);
  const tari = R.tari.m;
  say('m11_camp_decide', ()=>{
    const v = decided('m11_camp_decide', 's2_camp', 'felix_only');
    V13.done('o11_camp'); V13.play(tari, 'sit');
    if(v === 'felix_only'){
      // the boys get up and go home along the boards; at the landing the canoes take them
      R.workers.forEach((w, i)=>setTimeout(()=>{
        w.m.position.y = 0; go(w.m, [[w.m.position.x, 6.0], [-14.0, 6.0], [-13.6, 12.6], [-13.4, 14.6]], { speed:1.3 + Math.random() * 0.3 }).then(()=>{ w.m.visible = false; });
      }, 200 + i * 450));
    } else if(v === 'mass'){
      // on their feet on the boards, hands up, facing the officers. (Not added to the op's arrest count:
      // the aftermath adds 5 heat per arrest, and the choice already carries its own heat.)
      R.workers.forEach(w => { w.m.position.y = 0.03; w.m.rotation.y = PI; V13.play(w.m, 'handsup', { fade:0.3 }); });
    } else {
      V13.play(R.uche, 'phone');
    }
    // hold the shot a moment on what was decided (wider once they are on their feet), then on to the barge
    const P = ENGINE.player, hold = v === 'navy' ? DECIDE : [[-12.3, 2.5, 0.2], [-12.3, 1.0, 5.33]];
    shot(hold[0], hold[1], true);
    playInteraction({ spot:[P.position.x, P.position.z], face:P.rotation.y, clip:'idle', dur:3.6, cam:{ pos:hold[0], look:hold[1] },
      done:()=>{
        placePlayer(-9.35, 5.55, PI / 2 - 0.25);                     // facing the camp and the far jetty
        // Pa Timi goes back to his boat
        setTimeout(()=>{ const fm = A('fisherman'); placeAt(R.timi, fm.x, fm.z, fm.rot, -0.1); V13.play(R.timi, 'sit', { fade:0 }); }, 6000);
        barge();
      } });
  });
}

/* ---------- TEKENA 2 ---------- */
function barge(){
  const R = RT(); R.phase = 'barge';
  if(R.follow){ placeAt(R.uche, ENGINE.player.position.x - 1.2, ENGINE.player.position.z + 0.6, 0); R.follow.hold(false); }
  const bt = A('barge_tag', { x:15.2, z:1.5, rot:PI / 2 });
  setTimeout(()=>{ if(rec() && !busy() && !ENGINE.seq && R.itBarge && ENGINE.interactables.includes(R.itBarge)) V13.toast('TEKENA 2', 'Loaded, low in the water, at the far jetty.', 2200); }, 900);
  R.itBarge = V13.spot({ x:bt.x, y:0.9, z:bt.z }, 'Look over TEKENA 2', it => {
    if(busy() || ENGINE.seq) return;
    V13.drop(it);
    // a cut to the jetty: the two of them looking down her side, her name along the right of the frame
    const face = (x, z)=>Math.atan2(NAME.x - x, NAME.z - z);
    placePlayer(AT_BARGE.kel[0], AT_BARGE.kel[1], face(AT_BARGE.kel[0], AT_BARGE.kel[1]));
    if(R.follow) R.follow.hold(true, 'idle');
    placeAt(R.uche, AT_BARGE.uche[0], AT_BARGE.uche[1], face(AT_BARGE.uche[0], AT_BARGE.uche[1])); V13.play(R.uche, 'idle', { fade:0 });
    frame(AT_BARGE.cam, [NAME.x, NAME.y, NAME.z], 0.3); quietToast();
    say('m11_barge', ()=>{
      unshot();
      const v = decided('m11_barge', 's2_barge', 'seized');
      V13.done('o11_barge');
      if(v === 'tagged'){
        playInteraction({ spot:[15.0, 1.6], face:PI / 2, moveTime:1.2, clip:'interact', dur:1.6, hitAt:1.1, target:[16.0, 0.6, 1.6], camBack:1.6, camSide:0.7, camUp:1.3,
          onHit:()=>blink(), done:()=>{ V13.ev('barge_track', 'TEKENA 2 tracker log', 'good', 60); setTimeout(theEnd, 1600); } });
      } else {
        // three deckhands out of the deckhouse, on their knees on the deck
        deckhands();
        const P = ENGINE.player, cam = { pos:[12.9, 3.7, 1.4], look:[17.7, 0.9, 5.0] };
        playInteraction({ spot:[P.position.x, P.position.z], face:P.rotation.y, clip:'idle', dur:2.8, cam, done:()=>setTimeout(theEnd, 300) });
        shot(cam.pos, cam.look, true);                                  // cut to them (not a slow drift)
      }
    });
  }, { range:2.4, verb:'inspect' });
}
/* the tracker's light: two green blinks, then nothing */
function blink(){
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshBasicMaterial({ color:'#3aff6a', toneMapped:false }));
  m.position.set(15.96, 0.62, 1.6); ENGINE.scene.add(m);
  const g = new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTexture(), color:new THREE.Color('#3aff6a'), transparent:true, blending:THREE.AdditiveBlending, depthWrite:false }));
  g.scale.set(0.35, 0.35, 1); g.position.copy(m.position); ENGINE.scene.add(g);
  let t = 0; fx((_, dt)=>{ t += dt; const on = (t < 0.25) || (t > 0.55 && t < 0.8); m.visible = g.visible = on; if(t > 1) return; });
}
function deckhands(){
  const R = RT(); R.deck = [];                                     // (not counted as arrests: see the camp decision)
  [[17.3, 4.4], [17.3, 5.3], [18.0, 4.85]].forEach(([x, z], i)=>{
    const look = Object.assign({ body:'M', skin:SKINS[i + 2], hair:'#0c0a09', torso:['#4a4a52', '#7a5a2a', '#2a3a2a'][i], armA:['#4a4a52', '#7a5a2a', '#2a3a2a'][i], armB:null, armC:null, hips:'#2a2a2a', thigh:'#2a2a2a', shin:'#2a2a2a', shoe:'#1a1a1a', gear:[] });
    const d = V13.person(look, { x, y:0.9, z, rot:-PI / 2 }, { clip:'kneel', solid:false }); R.deck.push(d);
  });
}

/* ---------- dawn on the Ethiope ---------- */
function theEnd(){
  const R = RT(); R.phase = 'end';
  const navy = MC().s2_camp === 'navy';
  V13.skip(navy ? ['05:40', 'FIRST LIGHT', 'The Navy lights the camp'] : ['05:50', 'DAWN ON THE ETHIOPE'], ()=>{
    ENGINE.movementEnabled = false;
    say('m11_end', ()=>{ V13.recruitFromFlags(); V13.finish(ID); });
  }, 2800);
  setTimeout(()=>{
    const D = (R.dr && R.dr.D) || {};
    sky('dawn');
    if(R.follow) R.follow.hold(true, 'idle');
    // at the landing, Pa Timi in his canoe, the camp behind
    placePlayer(-13.7, 13.5, 2.2);
    placeAt(R.uche, -13.0, 14.3, 2.4); V13.play(R.uche, 'folded', { fade:0 });
    const fm = A('fisherman'); placeAt(R.timi, fm.x, fm.z, fm.rot, -0.1); V13.play(R.timi, 'sit', { fade:0 });
    ENGINE.scene.children.forEach(o => { if(o.isSprite && o.renderOrder === 3) o.visible = true; });
    // who is still here at dawn: under the Navy's plan the boys sit and watch their camp burn;
    // otherwise they have gone home, or gone to the Area Command in three boats
    R.workers.forEach((w, i)=>{
      if(navy){ const s = ROW[i]; placeAt(w.m, s.x, s.z, s.rot, SIT_Y); V13.play(w.m, 'sit', { fade:0 }); w.m.visible = true; }
      else { placeAt(w.m, w.home.x, w.home.z); w.m.visible = false; }
    });
    for(const o of [R.escort, R.felix].concat(R.deck || [])) if(o) o.visible = false;
    if(navy){
      if(D.Fire) D.Fire.visible = true;
      for(const n of ['L_oven1', 'L_oven2', 'L_oven3']) if(D[n]){ D[n].color.setRGB(1.9, 0.8, 0.28); D[n].distance = 16; }
      for(const p of [[2, 2], [5, 4.5], [8, 1], [-2, 4], [-5, -2], [9, -4]]) blaze(p[0], p[1], 1.1);
    }
    shot([-17.2, 1.35, 17.6], [-6.5, 2.6, 4.5]);
  }, 700);
}
})();
