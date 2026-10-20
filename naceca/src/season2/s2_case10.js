/* =========================================================================
   NACECA · v13 Case 10 — The Night Market (Sapele waterside, Thursday 20:30)
   Plain clothes. The terminal in the UPSTREAM ledger, SPL-WSM-T4, is a POS
   kiosk beside an herb stall. Kelechi works the market without being made:
   how he greets Mama Karo decides what she tells him, the kiosk permits find
   T4, the buka and the stalls buy him cover. Lucky Edafe comes with sacks
   and two boys, makes four withdrawals under the cap with four cards, buys
   food and waits on the jetty for a boat. Watch him from the right distance
   and from two sides, name him from the BVN, decide about Ejiro, then decide
   at the jetty. Get made, and Lucky runs.
   ========================================================================= */
(function(){
'use strict';
const V13 = window.V13, MC = V13.mc;
const KEY = 'sapele', PI = Math.PI;
const RT = ()=>V13.rt;
const P = ()=>ENGINE.player;
const MINE = ['pos_t4_log', 'bvn_link', 'cash_bundles', 'lucky_statement'];

/* ---------- a fix the written choices need (scoped to this case) ----------
   A choice that carries a flag but no effect (here: m10_jetty "Take Lucky", m10_karo_trust /
   m10_karo_customer 'neutral', m10_ejiro 'left') reaches applyEffect(undefined, flag), which
   returns before it stores the flag. The same engine bug drops other cases' flag-only choices
   (and Season 1's cold-open plate): the general fix belongs in a shared file, see the hand-in.
   The callbacks below also read the choice taken (V13.picked) if a flag is still missing. */
if(typeof window.applyEffect === 'function' && !window.applyEffect._m10flag){
  V13.wrap('applyEffect', orig => { const f = function(eff, flag){ if(!eff && flag && S.game && S.game.currentMission === 'm10') eff = {}; return orig.call(this, eff, flag); }; f._m10flag = true; return f; });
}

/* ---------- the few lines the written scenes leave a gap for ---------- */
Object.assign(DIALOGUE, {
  // (sr: the Senior Agent line, without the next step; see s2_core.js "dialogue-line fields")
  m10_x_warn:[ { speaker:'SGT. UCHE', portrait:'sergeant', text:"Sir, people are looking at you. Buy something. Eat something.", sr:"Sir, people are looking at you." } ],
  m10_x_angle:[ { speaker:'SGT. UCHE', portrait:'sergeant', text:"Good. Now get round him, sir. I want to see those cards.", sr:"Four swipes so far, sir." } ],
  m10_x_covered:[ { speaker:'SGT. UCHE', portrait:'sergeant', text:"I had him from here, sir. Four cards, four swipes, back to back." } ],
  m10_x_boat:[ { speaker:'SGT. UCHE', portrait:'sergeant', text:"Boat's in at the jetty end. He's getting up." } ],
  m10_x_close:[ { speaker:'SGT. UCHE', portrait:'sergeant', text:"He's at the kiosk, sir, and so are you. Step away. Slowly." } ],
  m10_x_buka_friend:[ { speaker:'AGENT KELECHI', portrait:'kelechi', text:"Bole and fish, two. And pepper soup for my friend at the end table — he's shy." } ],
  m10_x_buka_again:[ { speaker:'MAMA TEGA · BUKA', portrait:'street:buka', text:"You again? Oya, siddon. Cold water na two hundred.", textEn:"You again? All right, sit down. Cold water is two hundred." } ],
});
const rec = ()=>V13.rec ? V13.rec() : (typeof isRecruit === 'function' && isRecruit());
const tobiAlive = ()=>V13.tobiAlive ? V13.tobiAlive() : (m => m.asaba === 'rescue' || (m.asaba === 'chase' && !S.game._asabaHostageLost))(MC());
// a radioed line: its Senior text (sr) on Senior Agent
const X = k => { const l = DIALOGUE[k] && DIALOGUE[k][0]; if(!l) return ''; return (!rec() && l.sr) ? l.sr : (l.text || ''); };
/* our wayfinding (beta/wayfind.js): on Senior, "Find terminal SPL-WSM-T4" and "Learn who uses it" would fall back to
   the one required kiosk of four. Senior gets the objective text only; Recruit keeps the pointer (a null row). */
if(window.WAY && WAY.OBJ_TARGETS){
  WAY.OBJ_TARGETS.m10 = Object.assign(WAY.OBJ_TARGETS.m10 || {}, { o10_t4:()=>rec() ? null : { ui:true }, o10_who:()=>rec() ? null : { ui:true } });
}

/* ---------- the market's geography (game coordinates, metres) ---------- */
const T4C = { x:-3.85, z:-1.75 };                                   // a customer at T4 stands here, facing the kiosk (−x)
const BOARDS = { t1:{ x:5.25, y:0.8, z:10.85 }, t2:{ x:5.25, y:0.8, z:5.85 }, t3:{ x:5.25, y:0.8, z:-5.15 }, t4:{ x:-4.42, y:0.8, z:-0.95 } };
const UCHE_CHARGE = { x:-4.3, z:9.3, rot:-PI / 2 };
const UCHE_SEAT = { x:4.4, z:-14.2, rot:0 };
const CRATE = { x:-2.15, z:-18.75 };
const JETTY_END = { x:0.05, z:-23.2 };
const BOAT_AT = { x:-0.35, z:-25.05 };
const BROWSE = [
  { x:-3.75, z:14.4, label:'Browse the tomatoes', say:'Tomatoes, ₦3,000 a basket. You say you\'ll come back for them.' },
  { x:-3.75, z:6.6, label:'Feel the ankara', say:'Six yards of ankara, ₦15,000. You rub the cloth between your fingers like an expert.' },
  { x:-3.75, z:-5.0, label:'Look over the plastic bowls', say:'Bowls, buckets, a red kettle. You turn a bowl over as if it matters.' },
  { x:-3.75, z:-8.3, label:'Look at the phone chargers', say:'Chargers, cases, earpieces. You ask about a charger. Everybody asks about chargers.' },
  { x:3.75, z:7.6, label:'Price the pepper', say:'Scotch bonnet and tatashe. Your eyes water from a metre away.' },
  { x:3.75, z:-2.4, label:'Browse the lace', say:'Lace by the yard. You price one you will never buy.' },
  { x:3.75, z:-8.7, label:'Price the smoked fish', say:'Smoked fish stacked like firewood. You price two and keep walking.' },
];

/* ---------- small helpers ---------- */
const free = ()=>!(typeof isOverlayOpen === 'function' && isOverlayOpen()) && !document.querySelector('#title-card.show');
function always(f){ const R = RT(); (R.always || (R.always = [])).push(f); }
/* run fn once nothing covers the screen (on the always-ticker: it also works while a shot is held) */
function whenFree(fn, delay){ let t = 0; always(dt => { if(!free()){ t = 0; return; } t += dt; if(t >= (delay || 0)){ fn(); return false; } }); }
function afterAlways(s, f){ let t = 0; always(dt => { t += dt; if(t >= s){ f(); return false; } }); }
const angDiff = (a, b)=>{ let d = a - b; while(d > PI) d -= 2 * PI; while(d < -PI) d += 2 * PI; return d; };
function turn(ch, want, dt, rate){ ch.rotation.y += angDiff(want, ch.rotation.y) * Math.min(1, dt * (rate || 9)); }
function faceTo(ch, rot){ if(!ch) return; let t = 0; always(dt => { t += dt; turn(ch, rot, dt, 7); if(t > 0.6){ ch.rotation.y = rot; return false; } }); }
const facing = (ch, x, z)=>Math.atan2(x - ch.position.x, z - ch.position.z);
const d2 = (a, b)=>Math.hypot(a.x - b.x, a.z - b.z);
function objText(id, text){ const o = (S.game.objectives || []).find(x => x.id === id); if(o){ o.text = text; if(typeof renderObjectives === 'function') renderObjectives(); } }
function radio(key){ const t = X(key); if(t) V13.radio('SGT. UCHE', t, Math.max(3400, t.length * 52)); }
function place(ch, x, z, rot){ ch.position.set(x, ch.position.y || 0, z); if(rot != null) ch.rotation.y = rot; }
const pose = (ch, clip)=>V13.play(ch, clip, { once:true, restart:true, fade:0.2 });
function stop(ch){ if(ch && ch.userData && ch.userData._mv) ch.userData._mv.off = true; }
function hide(ch){ if(!ch) return; stop(ch); ch.visible = false; if(ch.userData) ch.userData._gone = true; }

/* walk a path (paused under conversations unless opt.always); one move per character at a time */
function go(ch, path, opt){
  opt = opt || {};
  stop(ch);
  const h = { off:false, done:false };
  ch.userData._mv = h;
  const speed = opt.speed || 1.25; let seg = 0;
  V13.play(ch, opt.clip || (speed > 3.6 ? 'sprint' : speed > 2.1 ? 'jog' : 'walk'), { fade:0.2 });
  const f = dt => {
    if(h.off || !ch.parent) return false;
    let step = speed * dt;
    while(step > 0 && seg < path.length){
      const b = path[seg], dx = b[0] - ch.position.x, dz = b[1] - ch.position.z, d = Math.hypot(dx, dz);
      if(d <= step){ ch.position.x = b[0]; ch.position.z = b[1]; step -= d; seg++; }
      else { ch.position.x += dx / d * step; ch.position.z += dz / d * step; turn(ch, Math.atan2(dx, dz), dt); step = 0; }
    }
    if(seg >= path.length){
      h.done = true;
      if(opt.end !== false) V13.play(ch, opt.end || 'idle', { fade:0.25 });
      if(opt.face != null) faceTo(ch, opt.face);
      if(opt.then) opt.then();
      return false;
    }
  };
  if(opt.always) always(f); else V13.every(f);
  return h;
}
/* a scripted run of steps; each step gets `next` */
function seq(steps){
  const h = { off:false }; let i = 0;
  const run = ()=>{ if(h.off || i >= steps.length) return; const f = steps[i++]; f(run); };
  run(); return h;
}
const sGo = (ch, path, opt)=>next => go(ch, path, Object.assign({}, opt || {}, { then:next }));
const sWait = s => next => V13.after(s, next);
const sDo = f => next => { f(); next(); };
/* one character keeps a few steps behind another */
function trail(ch, lead, dist, speed){
  const h = { off:false }; let mode = null;
  stop(ch); ch.userData._mv = h;
  V13.every(dt => {
    if(h.off || !ch.parent || !lead.parent) return false;
    const dx = lead.position.x - ch.position.x, dz = lead.position.z - ch.position.z, d = Math.hypot(dx, dz);
    if(d > dist + 0.3){
      const st = Math.min(d - dist, (speed || 1.3) * dt * (d > dist + 2 ? 1.5 : 1));
      ch.position.x += dx / d * st; ch.position.z += dz / d * st; turn(ch, Math.atan2(dx, dz), dt);
      if(mode !== 'walk'){ mode = 'walk'; V13.play(ch, ch.userData._carry ? 'carry' : 'walk', { fade:0.2 }); }
    } else if(mode !== 'idle'){ mode = 'idle'; if(ch.userData._carry) V13.play(ch, 'carry', { speed:0.03 }); else V13.play(ch, 'idle', { fade:0.3 }); }
  });
  return h;
}
/* a guide-only target: the marker points at it, nothing to press */
function guideOn(mesh){ const it = { mesh, label:'', range:0, optional:false, onInteract(){} }; ENGINE.interactables.push(it); return it; }
/* an interaction that travels with the player (the analyst's message): only when nothing else is in reach */
function pocket(label, fn){
  const a = new THREE.Object3D(); ENGINE.scene.add(a);
  const it = { mesh:a, label, verb:'inspect', range:1.2, labelY:2.15, optional:true, priority:-1, onInteract:()=>fn(it) };
  ENGINE.interactables.push(it);
  V13.every(()=>{ if(!ENGINE.interactables.includes(it)) return false; const p = P().position; a.position.set(p.x, 0, p.z); });
  return it;
}
/* the camera holds a shot, also under a conversation (the follow camera rests then) */
function shot(pos, look, snap){
  const R = RT();
  R.cam = { pos:new THREE.Vector3(...pos), look:new THREE.Vector3(...look), snap:!!snap };
  TPCAM.override = { pos:R.cam.pos, look:R.cam.look };
}
function shotOff(){ const R = RT(); R.cam = null; TPCAM.override = null; }
function camStep(dt){
  const R = RT(), c = R.cam, cam = ENGINE.camera; if(!c || !cam) return;
  if(!TPCAM.pos){ TPCAM.pos = new THREE.Vector3(); TPCAM.look = new THREE.Vector3(); }
  if(c.snap){ TPCAM.pos.copy(c.pos); TPCAM.look.copy(c.look); c.snap = false; TPCAM.cur = true; }
  else { const k = 1 - Math.exp(-dt * 4); TPCAM.pos.lerp(c.pos, k); TPCAM.look.lerp(c.look, k); }
  cam.position.copy(TPCAM.pos); cam.lookAt(TPCAM.look);
}
/* a held beat: no walking, no HUD, no touch controls (they only hide under overlays otherwise) */
function cine(on){
  if(!document.getElementById('v13-c10-css')){ const st = document.createElement('style'); st.id = 'v13-c10-css'; st.textContent = '.touch-active.v13-cine .mobile-controls{display:none}'; document.head.appendChild(st); }
  document.body.classList.toggle('v13-cine', !!on);
  ENGINE.movementEnabled = !on; showHUD(!on);
  if(on){ if(typeof showPrompt === 'function') showPrompt(null); const wl = document.getElementById('world-label'); if(wl) wl.style.display = 'none'; }
}
function teleport(x, z, rot){ const p = P(); p.position.set(x, 0, z); p.rotation.y = rot; ENGINE.playerYaw = ENGINE.cameraYaw = rot; if(p.userData.anim) p.userData.anim.play('idle', { fade:0.1 }); }

/* ---------- props: rice sacks, Ghana-must-go bags, a crate, the boat ---------- */
let TEX = null;
function canvasTex(w, h, paint){ const c = document.createElement('canvas'); c.width = w; c.height = h; paint(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; }
function tex(){
  if(TEX) return TEX;
  TEX = {
    sack:canvasTex(128, 128, (x, w, h)=>{
      x.fillStyle = '#e4dfcf'; x.fillRect(0, 0, w, h);
      x.strokeStyle = 'rgba(110,100,80,0.22)'; x.lineWidth = 1;
      for(let i = 0; i < w; i += 4){ x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); }
      x.fillStyle = '#1d4aa0'; x.fillRect(0, 16, w, 7); x.fillRect(0, h - 23, w, 7);
      x.fillStyle = '#a82a20'; x.textAlign = 'center'; x.font = '700 24px Arial, sans-serif'; x.fillText('RICE', w / 2, 62); x.font = '700 16px Arial, sans-serif'; x.fillText('50 KG', w / 2, 86);
    }),
    plaid:canvasTex(128, 128, (x, w, h)=>{
      x.fillStyle = '#e8e4dc'; x.fillRect(0, 0, w, h);
      for(let i = 0; i < w; i += 32){ x.fillStyle = (i / 32) % 2 ? 'rgba(30,60,150,0.72)' : 'rgba(176,30,30,0.78)'; x.fillRect(i, 0, 14, h); x.fillRect(0, i, w, 14); }
      x.strokeStyle = 'rgba(0,0,0,0.3)'; x.lineWidth = 3; x.strokeRect(2, 2, w - 4, h - 4);
    }),
  };
  return TEX;
}
function sackMesh(){ return new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.24, 0.58, 8), new THREE.MeshStandardMaterial({ map:tex().sack, roughness:0.95 })); }
function bagMesh(){ return new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.3, 0.26), new THREE.MeshStandardMaterial({ map:tex().plaid, roughness:0.8 })); }
/* where a prop rides on a character */
const RIDE = {
  front:[0, 1.0, 0.38, 0, 0, PI / 2], front2:[0, 1.33, 0.38, 0, 0, PI / 2],
  shoulder:[0.19, 1.46, -0.04, PI / 2 - 0.25, 0, 0],             // slung over the right shoulder, front to back
};
function ride(prop, ch, where){
  const r = RIDE[where]; ch.add(prop); prop.position.set(r[0], r[1], r[2]); prop.rotation.set(r[3], r[4], r[5]); prop.visible = true;
}
function ground(prop, x, z, rot, upright){
  ENGINE.scene.attach(prop);
  if(upright){ prop.position.set(x, 0.29, z); prop.rotation.set(0, rot || 0, 0); }
  else { prop.position.set(x, prop.geometry.type === 'BoxGeometry' ? 0.15 : 0.21, z); prop.rotation.set(0, rot || 0, prop.geometry.type === 'BoxGeometry' ? 0 : PI / 2); }
}
function makeCrate(){
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.42, 0.42), new THREE.MeshStandardMaterial({ color:'#7a5a36', roughness:0.9 }));
  m.position.set(CRATE.x, 0.21, CRATE.z); m.rotation.y = 0.2; ENGINE.scene.add(m); return m;
}
/* a long wooden boat with an outboard; built along +z (stern, engine) .. −z (bow) */
function makeBoat(){
  const g = new THREE.Group(), L = 5.4, B = 1.1, n = 10, secs = [];
  for(let i = 0; i <= n; i++){
    const t = -1 + 2 * i / n, at = Math.abs(t);
    const w = B / 2 * Math.max(0.06, 1 - Math.pow(at, 2.4)), d = 0.34 * Math.max(0.25, 1 - Math.pow(at, 3)), top = 0.3 + 0.16 * Math.pow(at, 3);
    secs.push([[-w, top, t * L / 2], [-w * 0.84, -d * 0.55, t * L / 2], [0, -d, t * L / 2], [w * 0.84, -d * 0.55, t * L / 2], [w, top, t * L / 2]]);
  }
  const pos = [], idx = [];
  secs.forEach(s => s.forEach(p => pos.push(p[0], p[1], p[2])));
  for(let i = 0; i < n; i++) for(let k = 0; k < 4; k++){ const a = i * 5 + k, b = a + 5, c = a + 6, d = a + 1; idx.push(a, b, c, a, c, d); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  g.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color:'#5e3c22', roughness:0.85, side:THREE.DoubleSide })));
  const wood = new THREE.MeshStandardMaterial({ color:'#8a6238', roughness:0.9 });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(B * 0.62, 0.04, L * 0.7), wood); floor.position.set(0, -0.18, 0); g.add(floor);
  for(const t of [-0.5, 0, 0.5]){ const w = B * 0.92 * Math.max(0.06, 1 - Math.pow(Math.abs(t), 2.4)); const th = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, 0.2), wood); th.position.set(0, 0.2, t * L / 2); g.add(th); }
  const stripe = new THREE.MeshStandardMaterial({ color:'#1d4aa0', roughness:0.7 });
  for(const s of [-1, 1]){ const st = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.07, L * 0.62), stripe); st.position.set(s * B * 0.5, 0.24, 0); g.add(st); }
  const black = new THREE.MeshStandardMaterial({ color:'#18181a', roughness:0.5, metalness:0.3 });
  const eng = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.44, 0.4), black); eng.position.set(0, 0.5, L / 2 + 0.12); g.add(eng);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.36), new THREE.MeshStandardMaterial({ color:'#c8a020', roughness:0.6 })); cap.position.set(0, 0.76, L / 2 + 0.12); g.add(cap);
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.62, 0.12), black); shaft.position.set(0, 0.0, L / 2 + 0.18); g.add(shaft);
  const can = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.38, 0.17), new THREE.MeshStandardMaterial({ color:'#e0c020', roughness:0.7 })); can.position.set(0.22, -0.0, L / 2 - 0.55); g.add(can);
  g.position.set(BOAT_AT.x, -0.35, BOAT_AT.z); g.rotation.y = -PI / 2;        // stern towards −x, bow towards +x (upriver)
  g.userData.L = L;
  ENGINE.scene.add(g); return g;
}
/* the outboard: it coughs, catches, and fades upriver (it stops by itself) */
function engineSound(){
  if(typeof AUDIO === 'undefined' || !AUDIO.enabled || typeof ensureAudio !== 'function') return null;
  try{
    ensureAudio(); const ctx = AUDIO.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(38, t); o.frequency.linearRampToValueAtTime(52, t + 2.5);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
    const env = ctx.createGain(), far = ctx.createGain(); far.gain.value = 1;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 12; const lg = ctx.createGain(); lg.gain.value = 0.04; lfo.connect(lg); lg.connect(env.gain);
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.11, t + 0.07); env.gain.linearRampToValueAtTime(0, t + 0.3);
    env.gain.linearRampToValueAtTime(0.12, t + 0.62); env.gain.linearRampToValueAtTime(0.01, t + 0.9);
    env.gain.linearRampToValueAtTime(0.13, t + 1.35); env.gain.setValueAtTime(0.13, t + 11); env.gain.linearRampToValueAtTime(0, t + 15);
    o.connect(lp); lp.connect(env); env.connect(far); far.connect(AUDIO.sfxGain);
    o.start(t); lfo.start(t); o.stop(t + 15.5); lfo.stop(t + 15.5);
    return far;
  }catch(e){ return null; }
}

/* ---------- who is in the market tonight ---------- */
/* plain clothes: the market shirt Uche bought ("parrots on it"), untucked */
function parrotShirt(){
  if(typeof ART === 'undefined' || !ART.ready || typeof PEOPLE === 'undefined') return V13.plainClothes();
  const g = '#2f8a4a';
  const k = PEOPLE.make('kelechi', { gear:[], vest:null, text:null, torso:g, armA:g, armB:g, armC:'#4a2b1c', hips:'#2a2622', thigh:'#2a2622', shin:'#2a2622', shoe:'#3a2a1c' });
  k.userData.isPlayer = true; return k;
}
const LOOK = {
  ucheplain:{ torso:'#2a6a8a', armA:'#2a6a8a', armB:'#2a6a8a', armC:'#2a6a8a', hips:'#2a2622', thigh:'#2a2622', shin:'#2a2622', gear:[], vest:null, text:null },
  lucky:()=>V13.look('lucky', { torso:'#1e46b0', armA:'#1e46b0', armB:'#1e46b0', armC:'#1e46b0', hips:'#1e46b0', thigh:'#1e46b0', shin:'#1e46b0', robe:'#1e46b0', gear:['Gear_Kaftan', 'Gear_Glasses'] }),
  boyA:{ body:'M', skin:'#3e2618', hair:'#0c0a09', torso:'#e8e4da', armA:null, armB:null, armC:null, hips:'#2a3a5a', thigh:'#2a3a5a', shin:'#2a3a5a', shoe:'#16120e', gear:[] },
  boyB:{ body:'M', skin:'#4a2b1c', hair:'#0c0a09', torso:'#161616', armA:'#161616', armB:null, armC:null, hips:'#3a3a3a', thigh:'#3a3a3a', shin:'#3a3a3a', shoe:'#16120e', gear:['Gear_Fila'], cap:'#8a1a1a' },
};
/* sellers behind their stalls, buyers at the front, a customer at T4 (indexes into the scene's crowd list) */
const SELLERS = [[0, 'talk'], [1, 'folded'], [2, 'idle'], [3, 'phone'], [4, 'idle'], [5, 'talk'], [6, 'folded'], [8, 'talk'], [9, 'idle']];
const BUYERS = [[10, 'talk'], [11, 'idle'], [12, 'idle'], [13, 'phone'], [16, 'talk'], [17, 'idle'], [18, 'idle'], [20, 'phone'], [22, 'idle'], [23, 'idle']];
const T4_CUSTOMER = 15;
const WALKS = [
  { look:0, speed:0.95, pts:[[-1.6, 17], [-1.9, 6.6, 3, -PI / 2], [-1.4, -4.5], [-1.0, -12.4, 2.5, PI / 2], [1.4, -11.0], [1.6, -2.0, 2, PI / 2], [1.4, 8.0], [1.2, 17.6, 2, PI]] },
  { look:7, speed:1.05, pts:[[1.5, 4], [1.8, 13, 2.5, PI / 2], [0.4, 18.6], [-1.5, 12], [-1.8, 1.5, 3, -PI / 2], [-1.4, -9], [0.8, -13.6, 2, PI], [1.6, -5]] },
  { look:9, speed:0.85, pts:[[-0.8, 16], [-0.6, 9, 2, -PI / 2], [0.9, 9.5], [1.0, 15.5, 2, PI / 2]] },
  { look:3, speed:0.9, pts:[[-1.3, -3], [-1.5, -10, 2, -PI / 2], [1.0, -14.4, 3, PI], [2.2, -9], [1.3, -1, 2, PI / 2]] },
];
function wander(ch, pts, speed, start){
  let i = start || 0;
  const leg = ()=>{
    if(ch.userData._stopWander || !ch.parent) return;
    const p = pts[i % pts.length]; i++;
    go(ch, [[p[0], p[1]]], { speed, end:false, then:()=>{
      if(p[2]){ V13.play(ch, 'idle', { fade:0.3 }); if(p[3] != null) faceTo(ch, p[3]); V13.after(p[2], leg); } else leg();
    } });
  };
  leg();
}

/* ---------- the case ---------- */
V13.defCase('m10', {
  title:'The Night Market', region:'Delta', sub:'Sapele Waterside Market · 20:30', evMax:4, xp:360, ambient:'market',
  objectives:()=>[
    { id:'o10_t4', text:'Find terminal SPL-WSM-T4' },
    { id:'o10_who', text:'Learn who uses it' },
    { id:'o10_watch', text:'Watch the changer without being made' },
    { id:'o10_id', text:'Identify the changer' },
    { id:'o10_jetty', text:'Decide at the jetty' },
  ],
  reset(){
    const m = MC(), f = S.game.flags || {};
    for(const k of ['s2_karo', 's2_ejiro', 's2_jetty', 's2_statement']){ delete m[k]; delete f[k]; }
    const s = V13.s2(); delete s.karo_source; delete s.m10_watched;
    // a replay starts this case's file afresh
    if(Array.isArray(S.game.evidence)) S.game.evidence = S.game.evidence.filter(e => !MINE.includes(e.id));
    if(S.game.evQ) for(const id of MINE) delete S.game.evQ[id];
    for(const k of ['_docMiss', '_docFree', '_docLocked']) if(S.game[k]) delete S.game[k].m10_who;
    for(const k of Object.keys(V13._picks || {})) if(k.indexOf('m10_') === 0) delete V13._picks[k];
  },
  build(){
    V13.scene(KEY, { player:parrotShirt });
    const R = RT();
    Object.assign(R, { phase:'intro', time:0, seen:0, sus:{ linger:0, stare:0, lookL:0 }, warnAt:-99, obsN:0, obsT:0, obsB:null, boatObsT:0, bukaN:0, browseAt:{}, always:[] });
    ENGINE.sceneAlways = dt => {
      const Rn = RT(); if(Rn !== R || R.over) return;
      const L = R.always;
      for(let i = L.length - 1; i >= 0; i--){ try{ if(L[i](dt) === false) L.splice(i, 1); }catch(e){ console.warn('[m10] always', e); L.splice(i, 1); } }
      camStep(dt);
    };
    stage(R);
    interactables(R);
    V13.every(dt => main(dt));
    // test hook: V13.c10speed = k runs the case's clock k times faster (probes only; 1 in play)
    const su = ENGINE.sceneUpdate, sa = ENGINE.sceneAlways;
    ENGINE.sceneUpdate = dt => su(dt * (V13.c10speed || 1));
    ENGINE.sceneAlways = dt => sa(dt * (V13.c10speed || 1));
  },
  start(){
    const R = RT();
    const key = tobiAlive() ? V13.pick('m10_intro_tobi', 'm10_intro') : V13.pick('m10_intro_igbinosa', 'm10_intro');
    V13.say(key, ()=>{
      R.phase = 'explore';
      // Uche peels off to the charging stand; he doesn't walk the market with you
      go(R.uche, [[-0.6, 15.5], [-2.8, 11.0], [UCHE_CHARGE.x, UCHE_CHARGE.z]], { speed:1.2, end:'phone', face:UCHE_CHARGE.rot, then:()=>{ R.ucheAt = 'charging'; } });
      V13.eyes({ label:'SUSPICION', watchers:[], rate:0.42, decay:0.05, extraFn:()=>RT().seen || 0, onMade:()=>made() });
      if(rec()) V13.toast('UNDERCOVER', 'Find kiosk T4. Don\'t stare at the POS — browse, eat, keep moving.', 3400);
      else V13.toast('UNDERCOVER', 'The market notices a man who stares at money.', 3400);
    });
  },
});

/* ---------- staging: the people, the props, the boat ---------- */
function stage(R){
  const at = n => V13.at(KEY, n), crowd = V13.list(KEY, 'crowd');
  const person = (look, x, z, rot, clip, opt)=>V13.person(look, { x, z, rot }, Object.assign({ clip:clip || 'idle', solid:false }, opt || {}));
  R.market = []; R.crowdWatch = [];
  const mk = (look, x, z, rot, clip, watch)=>{ const c = person(look, x, z, rot, clip); R.market.push(c); if(watch) R.crowdWatch.push(c); return c; };
  // Uche arrives with you, in a shirt nobody would arrest
  const us = at('uche_start');
  R.uche = V13.person(LOOK.ucheplain, { x:us.x, z:us.z, rot:us.rot }, { kind:'uche', solid:false });
  // the people the story needs
  const k = at('mama_karo'); R.karo = mk('karo', k.x, k.z, k.rot, 'folded');
  const e = at('pos_t4'); R.ejiro = mk('ejiro', e.x, e.z, e.rot, 'phone');
  const ef = at('buka'); R.efe = mk('mamaefe', ef.x, ef.z, ef.rot, 'idle');
  const es = at('esusu'); R.esusu = mk('esusu', es.x, es.z, es.rot, 'sit');
  const og = at('jerrycans'); R.ogaga = mk('ogaga', og.x, og.z, og.rot, 'folded');
  const bm = at('boatman'); R.boatman = person('boatman', bm.x, bm.z, bm.rot, 'phone');
  R.charger = mk(V13.crowdLook(6), -6.5, 9.6, PI / 2, 'sit');
  R.kiosks = ['pos_t1', 'pos_t2', 'pos_t3'].map((n, i) => { const a = at(n); return mk(V13.crowdLook(i * 3 + 1), a.x, a.z, a.rot, ['idle', 'phone', 'folded'][i]); });
  // sellers, buyers, the woman at T4 when you arrive (phones get a thinner crowd, so skinning stays cheap;
  // V13.c10lite is a probe switch that leaves only the people the story needs)
  const low = typeof currentGfx === 'function' && currentGfx() === 'low', lite = !!V13.c10lite;
  const thin = L => lite ? [] : low ? L.filter((x, i) => i % 2 === 0) : L;
  thin(SELLERS).forEach(([i, clip], j) => { const c = crowd[i]; if(c) mk(V13.crowdLook(j), c[0], c[1], c[2], clip); });
  thin(BUYERS).forEach(([i, clip], j) => { const c = crowd[i]; if(c) mk(V13.crowdLook(j + 3), c[0], c[1], c[2], clip, true); });
  const tc = crowd[T4_CUSTOMER]; R.t4cust = mk(V13.crowdLook(2), tc[0], tc[1], tc[2], 'interact', true);
  // people eating at the buka (the fourth chair is for Uche, later)
  const seats = V13.list(KEY, 'buka_seats');
  R.eaters = (lite ? [] : low ? [0, 3] : [0, 1, 3]).map((s, j) => { const c = seats[s]; return mk(V13.crowdLook(j + 5), c[0], c[1], c[2], j === 1 ? 'sit' : 'sit_talk', true); });
  // and people walking the aisles
  R.walkers = (lite ? [] : low ? WALKS.slice(0, 2) : WALKS).map((w, j) => { const p = w.pts[0]; const c = person(V13.crowdLook(w.look), p[0], p[1], 0, 'walk'); wander(c, w.pts, w.speed, 1); R.crowdWatch.push(c); return c; });
  // props
  R.crate = makeCrate();
  R.boat = makeBoat();
  R.sacks = [sackMesh(), sackMesh()]; R.bags = [bagMesh(), bagMesh()];
  R.sacks.concat(R.bags).forEach(m => { m.visible = false; ENGINE.scene.add(m); });
  // the point lights (dimmed at midnight, except the herb stall's lamp)
  R.lamps = []; ENGINE.scene.traverse(o => { if(o.isPointLight) R.lamps.push(o); });
}

/* ---------- what you can do in the market (route order drives the guide marker) ---------- */
function interactables(R){
  R.itKaro = V13.talk(R.karo, 'Greet Mama Karo', it => karoTalk(it), { range:2.9 });
  R.itT4 = V13.spot(BOARDS.t4, 'Read the permit on the blue kiosk', it => {
    if(R.t4Read){ V13.toast('SPL-WSM-T4', 'Ejiro\'s kiosk. The code from the ledger.', 1800); return; }
    V13.say('m10_sticker_t4', ()=>{ R.t4Read = true; V13.used(it); V13.done('o10_t4'); });
  }, { range:2.1, labelY:0.5 });
  [['t1', 'yellow'], ['t2', 'green'], ['t3', 'red']].forEach(([t, col]) => {
    V13.spot(BOARDS[t], `Read the permit on the ${col} kiosk`, it => { V13.say('m10_sticker_' + t, ()=>V13.used(it)); }, { range:2.1, labelY:0.5, optional:true });
  });
  V13.talk(R.esusu, 'Talk to the thrift collector', it => { faceTo(R.esusu, facing(R.esusu, P().position.x, P().position.z)); V13.say('m10_esusu', ()=>{ V13.used(it); faceTo(R.esusu, -PI / 2); }); }, { optional:true, range:2.4 });
  V13.talk(R.ogaga, 'Talk to the fuel seller', it => { faceTo(R.ogaga, facing(R.ogaga, P().position.x, P().position.z)); V13.say('m10_fuel', ()=>{ V13.used(it); faceTo(R.ogaga, PI / 2); }); }, { optional:true, range:2.5 });
  R.itBuka = V13.talk(R.efe, 'Buy food at the buka', it => bukaBuy(it), { optional:true, range:2.6 });
  BROWSE.forEach((b, i) => V13.spot({ x:b.x, y:0.95, z:b.z }, b.label, it => {
    const last = R.browseAt[i];
    if(last != null && R.time - last < 25){ V13.toast('BROWSING', 'You\'ve priced everything here. Move on.', 1500); return; }
    R.browseAt[i] = R.time; V13.eyesBump(-0.12);
    V13.toast('BROWSING', b.say, 2600);
  }, { optional:true, range:1.9, labelY:0.45 }));
}

/* ---------- Mama Karo ---------- */
function karoTalk(it){
  const R = RT();
  if(R.karoDone){
    const k = MC().s2_karo;
    V13.toast('MAMA KARO', k === 'trust' ? (V13.s2().karo_source ? '"Only bitter leaf, my son."' : '"The offer stays on the stall, my son."') : k === 'cold' ? '"I sell herbs. I don\'t count other people\'s money."' : '"Bitter leaf is five hundred."', 2200);
    return;
  }
  faceTo(R.karo, facing(R.karo, P().position.x, P().position.z));
  V13.say('m10_karo', ()=>{
    R.karoDone = true; V13.used(it);
    if(!MC().s2_karo){                                            // belt and braces: read the branch from the choices taken
      const a = V13.picked('m10_karo');
      const b = a === 0 ? V13.picked('m10_karo_trust') : a === 1 ? V13.picked('m10_karo_cold') : V13.picked('m10_karo_customer');
      V13.setFlag('s2_karo', a === 0 ? (b === 1 ? 'neutral' : 'trust') : (b === 1 ? 'cold' : 'neutral'));
    }
    const k = MC().s2_karo;
    if(V13.picked('m10_karo') === 1) V13.eyesBump(0.3);           // "NACECA", out loud, at a market stall
    if(k === 'cold') V13.eyesBump(0.15);
    if(k === 'trust'){
      V13.done('o10_who');
      V13.say('m10_karo_source', ()=>{
        const yes = V13.picked('m10_karo_source') === 0 || (V13.dlgKey ? V13.dlgKey() : null) === 'm10_karo_source_yes';
        if(yes) V13.s2().karo_source = 1; else delete V13.s2().karo_source;
        faceTo(R.karo, PI / 2);
      });
    } else faceTo(R.karo, PI / 2);
  });
}

/* ---------- the buka: cover, twice ---------- */
function bukaBuy(it){
  const R = RT(); R.bukaN++;
  faceTo(R.efe, facing(R.efe, P().position.x, P().position.z));
  const back = ()=>faceTo(R.efe, -PI / 2);
  if(R.bukaN === 1){
    const done = ()=>{ back(); V13.eyesBump(-0.45); V13.toast('COVER', 'You eat like a man with nowhere to be. The lane stops looking.', 2600); };
    if(R.ucheAt === 'buka' || R.ucheAt === 'moving') V13.run('m10_x_buka_run', [[DIALOGUE.m10_buka[0], DIALOGUE.m10_x_buka_friend[0], DIALOGUE.m10_buka[2]]], done);
    else V13.say('m10_buka', done);
  } else if(R.bukaN === 2){
    V13.say('m10_x_buka_again', ()=>{ back(); V13.eyesBump(-0.25); });
  } else {
    V13.toast('BUKA', 'You\'ve eaten. Sitting here longer just looks like waiting.', 2000); V13.used(it); back();
  }
}

/* ---------- the frame: suspicion, Lucky's timeline, watching him ---------- */
function main(dt){
  const R = RT(); if(R.over) return false;
  R.time += dt;
  const p = P() && P().position; if(!p) return;
  const ph = R.phase;
  // he comes: once T4 is found and Karo has been met, or after three and a half minutes regardless
  if(ph === 'explore'){
    if(R.t4Read && R.karoDone && R.readyAt == null) R.readyAt = R.time + 9;
    if(R.time > 210 || (R.readyAt != null && R.time > R.readyAt)) arrive();
  }
  if(ph === 'cashout') cashStep(dt);
  if(ph === 'wait' && R.boatAt != null && R.time >= R.boatAt) jettyGo();
  if(ph === 'wait' && R.docDone && !R.ejiroOpen && !MC().s2_ejiro) openEjiro();
  // the boys keep scanning the lane
  for(const b of [R.boyA, R.boyB]) if(b && b.userData.scan && !b.userData._mv){ const s = b.userData.scan; b.rotation.y = s.base + s.amp * Math.sin(R.time * 0.8 + s.ph); }
  susStep(dt, p);
  obsStep(dt, p);
}

function susStep(dt, p){
  const R = RT(), e = V13.rt.eyes; if(!e) return;
  const S_ = R.sus; let seen = 0;
  const moving = !!(P().userData && P().userData.anim && /walk|jog|sprint|sneak/.test(P().userData.anim.curName || ''));
  const sprint = !!(ENGINE.keys && (ENGINE.keys.ShiftLeft || ENGINE.keys.ShiftRight)) && moving;
  // the market notices a man who hangs about the POS, or stares at people
  if(R.t4Read && d2(p, T4C) < 2.4 && R.phase !== 'cashout' && !R.ejiroOpen){ S_.linger += dt; if(S_.linger > 3.5) seen = Math.max(seen, 0.35); } else S_.linger = 0;
  let stared = false;
  if(!moving) for(const w of R.crowdWatch){ if(w.visible && V13.dist(w) < 3.0 && V13.looking(w, 0.22)){ stared = true; break; } }
  if(stared){ S_.stare += dt; if(S_.stare > 3) seen = Math.max(seen, 0.4); } else S_.stare = 0;
  // Lucky and his boys
  const L = R.lucky;
  if(R.armed && L && L.visible){
    const dl = V13.dist(L), look = V13.looking(L, 0.3);
    S_.lookL = look ? S_.lookL + dt : Math.max(0, S_.lookL - dt * 2);
    if(look && dl < 3.5) seen = Math.max(seen, 0.95);                       // staring at him from close
    else if(S_.lookL > 4.5 && dl < 11 && R.phase !== 'jetty') seen = Math.max(seen, 0.32);   // staring too long (at the jetty they're busy with the boat)
    if(R.phase === 'cashout' && d2(p, T4C) < 2.3) seen = Math.max(seen, 0.7); // breathing down his neck at the kiosk
    if(dl < 2.2) seen = Math.max(seen, 0.45);                                 // brushing past him
    for(const b of [R.boyA, R.boyB]){
      if(!b || !b.visible || b.userData._gone) continue;
      const db = V13.dist(b); if(db > 6.5) continue;
      const ang = Math.abs(angDiff(Math.atan2(p.x - b.position.x, p.z - b.position.z), b.rotation.y));
      if(ang < 0.95) seen = Math.max(seen, (1 - db / 6.5) * 0.55 * (sprint ? 1.8 : 1));
    }
    if(sprint) seen = Math.max(seen, 0.25);
  }
  R.seen = seen;
  // before he comes, the market can grow wary but can't "make" you: that needs Lucky
  if(!R.armed || R.time < (R.graceUntil || 0)) e.v = Math.min(e.v, 0.9);
  if(e.v > 0.6 && R.time - R.warnAt > 35){ R.warnAt = R.time; radio('m10_x_warn'); }
}

/* ---------- Lucky comes ---------- */
function arrive(){
  const R = RT(); if(R.phase !== 'explore') return;
  R.phase = 'arrive';
  for(const l of DIALOGUE.m10_lucky_arrives || []) V13.radio('SGT. UCHE', l.text, Math.max(3800, l.text.length * 55));
  if(rec()) V13.toast('THE CHANGER', 'Watch him from 4 to 10 metres, and keep him in view. Don\'t stare from close.', 3600);
  else V13.toast('SOMEONE ARRIVES', 'Rice sacks on a boy\'s head.', 3600);
  const person = (look, x, z, rot, clip)=>V13.person(look, { x, z, rot }, { clip:clip || 'walk', solid:false });
  const L = R.lucky = person(LOOK.lucky(), 0.8, 23.2, PI, 'walk');
  const A = R.boyA = person(LOOK.boyA, 1.7, 24.0, PI, 'carry');
  const B = R.boyB = person(LOOK.boyB, -0.4, 23.6, PI, 'walk');
  ride(R.sacks[0], A, 'front'); ride(R.sacks[1], A, 'front2'); A.userData._carry = true;
  // he greets the whole market on the way, like a man running for councillor
  R.luckySeq = seq([
    sGo(L, [[0.6, 16.5], [2.3, 12.7]], { speed:1.15 }),
    sDo(()=>{ faceTo(L, PI / 2); V13.play(L, 'talk'); }), sWait(1.8),
    sGo(L, [[0.3, 9.2], [-1.7, 6.4]], { speed:1.15 }),
    sDo(()=>{ faceTo(L, -PI / 2); V13.play(L, 'talk'); }), sWait(1.4),
    sGo(L, [[-2.4, 1.2], [T4C.x, T4C.z]], { speed:1.1, face:-PI / 2 }),
    sDo(()=>atT4()),
  ]);
  trail(A, L, 1.5, 1.25);
  R.guide = guideOn(L);
  for(const it of [R.itKaro, R.itT4]) if(it) it.optional = true;
  go(B, [[-0.2, 19.5], [0.9, 8.0], [1.3, -5.0], [1.5, -15.2]], { speed:1.3, face:0, then:()=>{ B.userData._mv = null; B.userData.scan = { base:0, amp:0.9, ph:1.7 }; } });
  // the woman at T4 finishes and goes home
  V13.after(9, ()=>{ R.t4cust.userData._stopWander = true; go(R.t4cust, [[-2.6, 0.5], [-1.8, 9.0], [-0.9, 18.5], [-0.6, 24.0]], { speed:1.1, then:()=>hide(R.t4cust) }); });
  // Uche moves to the buka: from there he has the kiosk and the jetty path
  V13.after(7, ()=>{
    R.ucheAt = 'moving';
    go(R.uche, [[-2.6, 6.0], [-0.6, -4.0], [1.4, -9.5], [3.3, -14.6], [UCHE_SEAT.x, UCHE_SEAT.z]], { speed:1.25, end:'sit', face:UCHE_SEAT.rot, then:()=>{ R.ucheAt = 'buka'; } });
  });
}
function atT4(){
  const R = RT(), L = R.lucky, A = R.boyA;
  R.phase = 'cashout'; R.armed = true; R.graceUntil = R.time + 5;     // a moment to step back if you're standing at the kiosk
  if(d2(P().position, T4C) < 3.5) radio('m10_x_close');
  if(!V13.objDone('o10_t4')) V13.done('o10_t4');
  V13.done('o10_who');
  objText('o10_watch', 'Watch the changer without being made (0/2)');
  V13.play(R.ejiro, 'idle'); faceTo(R.ejiro, PI / 2);
  V13.play(L, 'talk');
  R.cash = { i:0, t:0, stage:'greet' };
  // the porter sets the sacks down by the kiosk and takes up his post
  A.userData._mv && (A.userData._mv.off = true);
  go(A, [[-3.1, -2.9]], { speed:1.2, then:()=>{
    pose(A, 'pickup');
    ground(R.sacks[0], -3.35, -2.75, 0.4); ground(R.sacks[1], -3.0, -3.05, 1.2); A.userData._carry = false;
    V13.after(1.0, ()=>go(A, [[-2.5, -0.5]], { speed:1.1, face:0, then:()=>{ A.userData._mv = null; A.userData.scan = { base:0.2, amp:1.1, ph:0 }; } }));
  } });
}
/* four withdrawals, each just under the cap */
function cashStep(dt){
  const R = RT(), c = R.cash, L = R.lucky; if(!c || c.done || R.madeDone) return;
  c.t += dt;
  const swipe = ()=>{ c.stage = 'swipe'; c.t = 0; V13.play(L, 'interact'); V13.play(R.ejiro, 'interact'); };
  if(c.stage === 'greet' && c.t > 2.4) swipe();
  else if(c.stage === 'swipe' && c.t > 5.2){ c.stage = 'stash'; c.t = 0; c.i++; pose(L, 'pickup'); V13.play(R.ejiro, 'idle'); }
  else if(c.stage === 'stash' && c.t > 1.6){ if(c.i >= 4){ c.done = true; leaveT4(); } else swipe(); }
}

/* ---------- watching him: distance band, two angles, the boat ---------- */
const touch = ()=>document.body.classList.contains('touch-active');
function watchMeter(label, frac, note){
  if(!touch()){ showMeter('obs', label, frac, 'good', note || ''); return; }
  const d = document.getElementById('eye-dist'); if(d) d.textContent += ' · ' + label.replace(/^WATCHING /, '') + ' ' + Math.round(frac * 100) + '%';
}
function obsStep(dt, p){
  const R = RT(), L = R.lucky;
  const band = d => d < 3.5 ? 'close' : d > 10 ? 'far' : 'good';
  if(R.phase === 'cashout' && L && R.obsN < 2){
    const d = V13.dist(L);
    if(typeof setFollow === 'function') setFollow(d, band(d));
    const bearing = Math.atan2(p.x - L.position.x, p.z - L.position.z);
    const newAngle = R.obsN === 0 || Math.abs(angDiff(bearing, R.obsB)) > 0.7;
    if(d >= 3.5 && d <= 10 && V13.looking(L, 0.32)){
      if(newAngle){
        R.obsT += dt;
        watchMeter('WATCHING LUCKY', Math.min(1, R.obsT / 2), R.obsN + '/2');
        if(R.obsT >= 2){ R.obsT = 0; observed(bearing); }
      } else {
        R.sameT = (R.sameT || 0) + dt;
        if(rec() && R.sameT > 1.5 && R.time - (R.sameHint || -99) > 12){ R.sameHint = R.time; V13.toast('SAME VIEW', 'You\'ve seen the swipes from here. Find another side of the kiosk for the cards.', 2600); }
      }
    } else { R.obsT = Math.max(0, R.obsT - dt * 1.5); R.sameT = 0; if(R.obsT <= 0) hideMeter('obs'); }
    return;
  }
  if(R.phase === 'jetty' && L && R.handing && !R.boatSeen){
    const d = V13.dist(L);
    if(typeof setFollow === 'function') setFollow(d, d > 16 ? 'far' : 'good');
    if(d <= 16 && V13.looking(L, 0.36)){ R.boatObsT += dt; watchMeter('WATCHING THE JETTY', Math.min(1, R.boatObsT / 1.2)); if(R.boatObsT >= 1.2){ R.boatSeen = true; hideMeter('obs'); boatSeen(); } }
    else if(R.handDoneAt != null && R.time - R.handDoneAt > 6){ R.boatSeen = true; hideMeter('obs'); jettyDecide(); }
  }
}
function observed(bearing){
  const R = RT();
  R.obsN++; R.obsB = bearing; hideMeter('obs');
  objText('o10_watch', `Watch the changer without being made (${R.obsN}/2)`);
  if(R.obsN === 1) V13.say('m10_obs_cashouts', ()=>radio('m10_x_angle'));
  else V13.say('m10_obs_cards', ()=>{ V13.done('o10_watch'); V13.s2().m10_watched = 1; if(typeof setFollow === 'function') setFollow(null); });
}

/* ---------- he leaves the kiosk: food, then the jetty to wait for a boat ---------- */
function leaveT4(){
  const R = RT(), L = R.lucky, A = R.boyA;
  if(R.madeDone) return;
  R.phase = 'eat';
  hideMeter('obs'); if(typeof setFollow === 'function') setFollow(null);
  V13.play(R.ejiro, 'phone');
  // the cash goes into the sack on his shoulder and two bags the boy carries
  ride(R.sacks[0], L, 'shoulder'); R.sacks[1].visible = false;
  ride(R.bags[0], A, 'front'); ride(R.bags[1], A, 'front2'); A.userData._carry = true; A.userData.scan = null;
  if(R.obsN < 2){ radio('m10_x_covered'); applyEffect({ agencyFavour:-1 }); }
  else V13.done('o10_watch');
  V13.after(R.obsN < 2 ? 6 : 3, ()=>whoDoc());
  R.luckySeq = seq([
    sGo(L, [[-2.2, -3.6], [1.2, -9.0], [3.4, -11.9], [4.85, -11.95]], { speed:1.1, face:PI / 2 }),
    sDo(()=>{ V13.play(L, 'talk'); V13.play(R.efe, 'interact'); }), sWait(2.2),
    sDo(()=>{ V13.play(L, 'idle'); }), sWait(3.2),
    sDo(()=>{ V13.play(R.efe, 'idle'); }),
    sGo(L, [[3.4, -12.3], [2.9, -14.9], [-0.6, -17.1], [CRATE.x, CRATE.z]], { speed:1.05, end:'sit', face:PI }),
    sDo(()=>{
      R.phase = 'wait';
      if(R.boatAt == null) R.boatAt = R.time + 150;              // the boat comes whatever you do
      if(R.docDone && !MC().s2_ejiro) openEjiro();
    }),
  ]);
  trail(A, L, 1.6, 1.2);
  V13.after(26, ()=>{                                              // the boy sets the bags down beside him on the jetty
    if(R.phase !== 'wait' && R.phase !== 'eat') return;
    stop(A); go(A, [[-0.9, -17.7]], { speed:1.2, face:0, then:()=>{
      ground(R.bags[0], -1.55, -18.35, 0.3); ground(R.bags[1], -1.2, -18.75, -0.2); A.userData._carry = false;
      V13.play(A, 'idle'); A.userData._mv = null; A.userData.scan = { base:0.15, amp:0.8, ph:0.6 };
    } });
  });
}

/* ---------- the analyst's message: who is the changer? ---------- */
function whoDoc(){
  const R = RT(); if(R.docDone || R.docAsked) return;
  R.docAsked = true;
  const who = tobiAlive() ? 'TOBI' : 'MR. IGBINOSA';
  whenFree(()=>{
    V13.toast('MESSAGE · ' + who, 'The BVN check on tonight\'s T4 pay-outs.', 2400);
    R.pocket = pocket('Read the forensic desk\'s message', ()=>openWho());
    whenFree(()=>openWho(), 1.6);
  }, 0.4);
}
function openWho(){
  const R = RT(); if(R.docDone || R.docOpen || !free()) return;
  R.docOpen = true;
  S.game.evQ = S.game.evQ || {}; delete S.game.evQ.bvn_link;
  V13.doc('m10_who', ()=>{
    R.docOpen = false; if(R.docDone) return;
    R.docDone = true; if(R.pocket) V13.drop(R.pocket);
    const failed = S.game.evQ.bvn_link === 'weak';
    if(!V13.hasEv('bvn_link')) V13.ev('bvn_link', 'Four accounts, one BVN', failed ? 'contested' : 'good', 40);
    S.game.evQ.bvn_link = failed ? 'contested' : 'good';
    V13.done('o10_id');
    if(R.afterDoc){ const f = R.afterDoc; R.afterDoc = null; f(); }
  });
  // backed off without an answer: the message stays in the pocket (or comes straight back if the story is waiting on it)
  // (a pause held over the document is not a back-off: V13.ovShown)
  always(()=>{ if(R.docDone) return false; const shown = V13.ovShown ? V13.ovShown('screen-puzzle') : !!document.querySelector('#screen-puzzle.show'); if(!shown){ R.docOpen = false; if(R.afterDoc) whenFree(()=>openWho(), 1.2); return false; } });
}

/* ---------- Ejiro ---------- */
function openEjiro(){
  const R = RT(); if(R.ejiroOpen) return;
  R.ejiroOpen = true;
  V13.obj('o10_ejiro', 'Talk to Ejiro at T4, before the boat comes');
  if(R.guide){ V13.drop(R.guide); R.guide = null; }
  R.itEjiro = V13.talk(R.ejiro, 'Talk to Ejiro', it => ejiroTalk(it, false), { range:2.6 });
  if(R.phase === 'wait'){
    R.boatAt = Math.min(R.boatAt == null ? 1e9 : R.boatAt, R.time + 120);
    if(rec()) V13.toast('T4', 'Lucky is on the jetty, waiting for a boat. Ejiro is alone at the kiosk.', 2800);
  }
}
const EJ_LATE_ARREST = 'm10_x_ejiro_arrested_late';
function lateEjiroLines(){
  if(!DIALOGUE[EJ_LATE_ARREST]) DIALOGUE[EJ_LATE_ARREST] = (DIALOGUE.m10_ejiro_arrested || []).slice(0, 2);   // no jetty in this telling
  return (DIALOGUE.m10_ejiro || []).slice(1).map(l => l.choices ? Object.assign({}, l, { choices:l.choices.map(c => c.next === 'm10_ejiro_arrested' ? Object.assign({}, c, { next:EJ_LATE_ARREST }) : c) }) : l);
}
function ejiroTalk(it, late){
  const R = RT();
  if(MC().s2_ejiro && R.ejiroDone){ V13.toast('EJIRO', '"I\'ve told you everything, oga."', 1600); return; }
  faceTo(R.ejiro, facing(R.ejiro, P().position.x, P().position.z));
  const done = ()=>{
    R.ejiroDone = true; V13.drop(it);
    if(!MC().s2_ejiro){ const i = V13.picked(late ? 'm10_x_ejiro_late' : 'm10_ejiro'); V13.setFlag('s2_ejiro', ['source', 'arrested', 'left'][i] || 'left'); }
    const e = MC().s2_ejiro;
    V13.done('o10_ejiro');
    if(e === 'source'){
      V13.ev('pos_t4_log', 'Terminal T4 transaction log', 'good', 60);
      V13.once(R.ejiro, 'interact', 'idle'); faceTo(R.ejiro, PI / 2);
    } else if(e === 'arrested'){
      V13.ev('pos_t4_log', 'Terminal T4 transaction log', 'good', 60);
      stop(R.ejiro); place(R.ejiro, -6.0, -1.65, PI / 2); V13.play(R.ejiro, 'sit');
      go(R.karo, [[-4.75, -0.3]], { speed:0.9, face:facing({ position:{ x:-4.75, z:-0.3 } }, -5.4, -1.8) });
      R.itKaro && V13.drop(R.itKaro);
      if(!late && R.lucky && R.lucky.visible){                   // on the jetty, a man with a sack turns his head
        const L = R.lucky, base = L.rotation.y; faceTo(L, facing(L, -5.4, -1.8)); V13.eyesBump(0.3);
        V13.after(4, ()=>faceTo(L, base));
      }
    } else {
      go(R.ejiro, [[-3.6, -0.6], [-2.2, 6.0], [-1.0, 18.0], [-0.7, 24.0]], { speed:1.6, then:()=>hide(R.ejiro) });
    }
    if(late){ const f = R.lateEjiroCb; R.lateEjiroCb = null; if(f) f(); }
    else if(R.phase === 'wait') R.boatAt = Math.min(R.boatAt == null ? 1e9 : R.boatAt, R.time + 20);
  };
  if(late) V13.run('m10_x_ejiro_late', [lateEjiroLines()], done);
  else V13.say('m10_ejiro', done);
}

/* ---------- the boat comes ---------- */
function jettyGo(){
  const R = RT(), L = R.lucky, A = R.boyA, Bm = R.boatman;
  if(R.phase !== 'wait') return;
  R.phase = 'jetty';
  if(R.itEjiro && !MC().s2_ejiro){ V13.drop(R.itEjiro); R.itEjiro = null; }   // no quiet word now: after the jetty, maybe
  radio('m10_x_boat');
  if(!R.guide) R.guide = guideOn(L);
  // Uche comes down to the jetty head, slowly, like a man looking for his canoe
  go(R.uche, [[3.3, -14.6], [2.7, -16.4]], { speed:1.15, face:PI, then:()=>{ R.ucheAt = 'jetty'; } });
  // the boatman steps down into his boat
  go(Bm, [[-0.8, -23.4]], { speed:1.1, then:()=>{
    R.boat.attach(Bm); Bm.position.set(0.3, -0.15, -0.4); Bm.rotation.set(0, PI / 2, 0); V13.play(Bm, 'idle');
  } });
  // the boy picks up the bags
  stop(A); A.userData.scan = null;
  go(A, [[-1.35, -18.0]], { speed:1.2, then:()=>{ pose(A, 'pickup'); V13.after(0.8, ()=>{ ride(R.bags[0], A, 'front'); ride(R.bags[1], A, 'front2'); A.userData._carry = true; trail(A, L, 1.3, 1.1); }); } });
  R.luckySeq = seq([
    sDo(()=>V13.play(L, 'idle')), sWait(1.6),
    sGo(L, [[-1.0, -20.2], [JETTY_END.x, JETTY_END.z]], { speed:0.95, face:PI }),
    sWait(0.8),
    sDo(()=>{ R.handing = true; V13.play(L, 'interact'); stop(A); place(A, 0.95, -22.75, PI); V13.play(A, 'interact'); }),
    sWait(2.4),
    sDo(()=>{
      // two bags into the boat; the rice sack stays on his shoulder
      R.boat.attach(R.bags[0]); R.bags[0].position.set(0.05, -0.02, -0.2); R.bags[0].rotation.set(0, 0.3, 0);
      R.boat.attach(R.bags[1]); R.bags[1].position.set(-0.08, 0.02, 0.4); R.bags[1].rotation.set(0, -0.2, 0);
      A.userData._carry = false; V13.play(L, 'idle'); V13.play(A, 'idle');
      R.handDoneAt = R.time;
    }),
  ]);
}
function boatSeen(){
  V13.say('m10_obs_boat', ()=>jettyDecide());
}
function jettyDecide(){
  const R = RT(); if(R.phase !== 'jetty') return;
  R.phase = 'decide';
  V13.eyesOff(); hideMeter('obs'); if(typeof setFollow === 'function') setFollow(null);
  if(R.guide){ V13.drop(R.guide); R.guide = null; }
  whenFree(()=>V13.say('m10_jetty', ()=>{
    let j = MC().s2_jetty;
    if(!j){ j = ['lucky', 'both', 'follow'][V13.picked('m10_jetty')] || 'lucky'; V13.setFlag('s2_jetty', j); }
    V13.done('o10_jetty');
    if(j === 'follow') followScene(); else arrestScene(j === 'both');
  }), 0.2);
}

/* ---------- the arrest on the jetty ---------- */
function boysRun(){
  const R = RT();
  if(R.boyA && !R.boyA.userData._gone){ const A = R.boyA; A.userData.scan = null; A.userData._carry = false;
    go(A, [[2.0, -20.0], [2.3, -16.8], [1.2, -8.0], [0.6, 10.0], [0.4, 24.0]], { speed:5.2, clip:'sprint', always:true, then:()=>hide(A) }); }
  if(R.boyB && !R.boyB.userData._gone){ const B = R.boyB; B.userData.scan = null;
    go(B, [[5.5, -15.8], [10.5, -16.0], [14.6, -15.2]], { speed:5.0, clip:'sprint', always:true, then:()=>hide(B) }); }
}
function boatAway(){
  const R = RT(), B = R.boat; if(R.boatGone || !B) return;
  R.boatGone = true;
  const Bm = R.boatman; if(Bm && Bm.parent === B){ Bm.position.set(0, -0.2, 1.9); Bm.rotation.set(0, PI, 0); V13.play(Bm, 'sit'); }
  const far = engineSound(); let t = 0, v = 0;
  always(dt => {
    t += dt;
    if(t < 1.4) return;                                           // the cord, twice
    if(t < 4.5){ B.position.z -= dt * 0.9; B.rotation.y += dt * 0.12; v = 0.6; }
    else { v = Math.min(5.5, v + dt * 1.4); B.position.x += v * dt; B.position.z -= v * dt * 0.12; }
    B.position.y = -0.35 + Math.sin(t * 2.3) * 0.02;
    if(far){ const d = Math.hypot(B.position.x - P().position.x, B.position.z - P().position.z); far.gain.value = Math.max(0, Math.min(1, 1.25 - d / 40)); }
    if(B.position.x > 48 || t > 16){ B.visible = false; return false; }
  });
}
function arrestScene(both){
  const R = RT(), L = R.lucky;
  R.phase = 'arrest';
  if(R.luckySeq) R.luckySeq.off = true; stop(L);
  cine(true);
  // two steps behind him on the planks
  teleport(0.75, -21.55, PI);
  stop(R.uche); place(R.uche, -1.15, -21.35, PI - 0.25); V13.play(R.uche, 'idle');
  shot([4.2, 2.3, -21.6], [-0.4, 0.85, -22.8], true);       // from the side: Kelechi, Uche, Lucky on his knees, the boat
  faceTo(L, 0); V13.play(L, 'handsup');
  if(R.sacks[0].parent === L) ground(R.sacks[0], L.position.x + 0.45, L.position.z + 0.15, 0.5);
  afterAlways(1.4, ()=>V13.play(L, 'kneel'));
  boysRun();
  if(both){ const Bm = R.boatman; if(Bm) V13.play(Bm, 'handsup'); go(R.uche, [[-0.6, -23.1]], { speed:1.6, always:true, face:PI }); }
  else boatAway();
  afterAlways(2.6, ()=>V13.say('m10_arrest', ()=>{
    V13.ev('cash_bundles', '₦9.6m in POS bundles', 'good', 70);
    if(both) V13.say('m10_boatman', ()=>custody()); else custody();
  }));
}
/* ---------- or let them go and follow the money ---------- */
function followScene(){
  const R = RT(), L = R.lucky;
  R.phase = 'follow';
  if(R.luckySeq) R.luckySeq.off = true;
  cine(true);
  shot([-1.7, 2.1, -19.4], [5.5, 0.3, -27.0], false);
  const pz = P().position;
  const side = pz.x > 0.6 ? -1.6 : 1.7;                           // he walks round you, back up the market
  go(L, [[side, -21.4], [side, -17.6], [1.0, -8.0], [0.6, 8.0], [0.4, 24.5]], { speed:1.15, always:true, then:()=>hide(L) });
  if(R.boyA){ const A = R.boyA; A.userData._carry = false; go(A, [[side + 0.6, -21.0], [side + 0.6, -17.0], [1.6, -8.0], [1.0, 8.0], [0.9, 24.5]], { speed:1.2, always:true, then:()=>hide(A) }); }
  if(R.boyB){ go(R.boyB, [[1.2, -8.0], [0.0, 8.0], [-0.2, 24.5]], { speed:1.25, always:true, then:()=>hide(R.boyB) }); }
  boatAway();
  afterAlways(3.2, ()=>V13.say('m10_follow', ()=>freeWrap()));
}

/* ---------- made: Lucky bolts ---------- */
function chasePath(from){
  const x = from.x, z = from.z, path = [[x, z]];
  if(z < -17.6) path.push([0.4, -17.3]);
  else {
    if(x < -2.6) path.push([-2.0, Math.min(z, -2.4) - 1.6]);
    if(z > -8) path.push([1.6, -8.0]);
    if(z > -12) path.push([3.1, -12.3]);
  }
  path.push([2.4, -15.6], [6.2, -15.9], [10.2, -16.0], [14.6, -15.3]);
  return path;
}
function made(){
  const R = RT(), L = R.lucky;
  if(R.madeDone || !R.armed || !L || !L.visible || ['decide', 'arrest', 'follow', 'end'].includes(R.phase)) { const e = V13.rt.eyes; if(e && !R.madeDone){ e.fired = false; e.v = 0.88; } return; }
  R.madeDone = true; R.phase = 'made';
  if(R.luckySeq) R.luckySeq.off = true; stop(L);
  if(R.itEjiro && !MC().s2_ejiro){ V13.drop(R.itEjiro); R.itEjiro = null; }   // Ejiro waits until it's over
  V13.eyesOff(); hideMeter('obs'); if(typeof setFollow === 'function') setFollow(null);
  if(R.guide){ V13.drop(R.guide); R.guide = null; }
  faceTo(L, facing(L, P().position.x, P().position.z)); V13.play(L, 'idle');
  // the lane turns to look
  for(const c of R.market){ if(c.visible && c !== R.ejiro && d2(c.position, L.position) < 9){ faceTo(c, facing(c, L.position.x, L.position.z)); if(/talk|phone|folded/.test((c.userData.anim && c.userData.anim.curName) || '')) V13.play(c, 'idle'); } }
  V13.say('m10_made', ()=>{
    // he drops a sack and runs; the boys scatter; the boatman casts off
    if(R.sacks[0].parent === L) ground(R.sacks[0], L.position.x + 0.4, L.position.z + 0.2, 0.7);
    boysRun();
    if(R.boatman && R.boatman.parent !== R.boat){ R.boat.attach(R.boatman); R.boatman.position.set(0, -0.2, 1.9); }
    boatAway();
    R.guide = guideOn(L);
    V13.chase({ runner:L, path:chasePath(L.position), speed:4.25, catchDist:1.5, headStart:0.8, label:'LUCKY EDAFE',
      onCaught:()=>{ if(R.guide){ V13.drop(R.guide); R.guide = null; } caught(); },
      onEscaped:()=>{ if(R.guide){ V13.drop(R.guide); R.guide = null; } escaped(); } });
  });
}
function caught(){
  const R = RT(), L = R.lucky;
  R.phase = 'arrest';
  V13.after(0.9, ()=>V13.say('m10_caught', ()=>{
    V13.setFlag('s2_jetty', 'lucky'); V13.done('o10_jetty');
    V13.play(L, 'kneel');
    if(R.sacks[0].parent === L) ground(R.sacks[0], L.position.x + 0.45, L.position.z + 0.15, 0.5);
    const p = P().position; stop(R.uche); place(R.uche, p.x - 1.1, p.z + 0.6, facing(R.uche, L.position.x, L.position.z)); V13.play(R.uche, 'idle');
    V13.say('m10_arrest', ()=>{
      V13.ev('cash_bundles', '₦9.6m in POS bundles', 'contested', 50);     // the sack he dropped, picked up off a market floor
      custody();
    });
  }));
}
function escaped(){
  const R = RT();
  R.phase = 'follow';
  V13.setFlag('s2_jetty', 'follow'); V13.done('o10_jetty');
  V13.after(0.8, ()=>V13.say('m10_follow', ()=>freeWrap()));
}

/* ---------- after Lucky: the BVN, Ejiro, his statement, midnight ---------- */
function needDoc(then){
  const R = RT();
  if(R.docDone){ then(); return; }
  R.afterDoc = then;
  if(!R.docAsked) whoDoc(); else whenFree(()=>openWho(), 0.6);
}
function needEjiro(then){
  const R = RT();
  if(MC().s2_ejiro){ then(); return; }
  if(!R.ejiro || !R.ejiro.visible){ V13.setFlag('s2_ejiro', 'left'); then(); return; }
  cine(false); shotOff();
  V13.obj('o10_ejiro', 'Talk to Ejiro at T4');
  objText('o10_ejiro', 'Talk to Ejiro at T4 — he\'s still at the kiosk');
  if(R.itEjiro) V13.drop(R.itEjiro);
  R.lateEjiroCb = ()=>V13.after(1.2, then);
  R.itEjiro = V13.talk(R.ejiro, 'Talk to Ejiro', it => ejiroTalk(it, true), { range:2.6 });
  if(rec()) V13.toast('T4', 'Ejiro hasn\'t moved from his kiosk. Before you go, talk to him.', 2800);
}
function statement(then){
  V13.say('m10_statement_choice', ()=>{
    let s = MC().s2_statement;
    if(!s){ s = ['proper', 'car', 'threat'][V13.picked('m10_statement_choice')] || 'proper'; V13.setFlag('s2_statement', s); }
    V13.ev('lucky_statement', 'Lucky Edafe\'s statement', s === 'proper' ? 'good' : 'weak', 60);
    then();
  });
}
/* Lucky is in custody */
function custody(){
  const R = RT();
  needDoc(()=>whenFree(()=>statement(()=>{
    // Uche takes him to the car; the boatman too
    for(const c of [R.lucky, R.boatman]) if(c && c.visible) hide(c);
    hide(R.uche);
    needEjiro(()=>ending());
  }), 0.3));
}
/* Lucky walked (or ran) */
function freeWrap(){
  const R = RT();
  cine(false); shotOff();
  needDoc(()=>needEjiro(()=>ending()));
}

/* ---------- midnight ---------- */
function ending(){
  const R = RT(); if(R.ended) return; R.ended = true;
  whenFree(()=>{
    R.phase = 'end'; V13.eyesOff(); hideMeter('obs'); if(typeof setFollow === 'function') setFollow(null);
    if(typeof fadeIn === 'function') fadeIn();
    // the market folds itself away; one lamp still burns
    const keep = new Set([R.karo, R.uche]);
    for(const c of (ENGINE.extraSkinned || [])){ if(!keep.has(c) && c !== P()){ c.userData._stopWander = true; stop(c); c.visible = false; } }
    for(const m of R.sacks.concat(R.bags)) if(m.parent !== R.boat) m.visible = false;
    for(const l of R.lamps){ if(!(Math.abs(l.position.x + 5) < 1 && Math.abs(l.position.z - 1) < 1)) l.intensity *= 0.35; }
    stop(R.karo); place(R.karo, -7.2, 2.2, PI / 2); V13.play(R.karo, 'sit');
    // the two of them in the empty lane, looking at the one lamp still burning
    const look = (x, z)=>Math.atan2(-6.4 - x, 1.4 - z);
    R.uche.visible = true; R.uche.userData._gone = false; stop(R.uche); place(R.uche, -0.3, -3.7, look(-0.3, -3.7)); V13.play(R.uche, 'folded');
    teleport(-1.45, -3.25, look(-1.45, -3.25));
    cine(true);
    shot([0.9, 2.0, -7.6], [-5.9, 1.2, 1.6], true);
    afterAlways(7.5, ()=>{ const far = engineSound(); if(far) far.gain.value = 0.22; });     // out on the river an outboard starts
    afterAlways(1.3, ()=>V13.say('m10_end', ()=>{
      shotOff(); cine(false);
      V13.recruitFromFlags();
      R.over = true; R.always.length = 0;
      V13.finish('m10');
    }));
  }, 0.5);
}

/* for probes: what the case is doing */
V13.c10 = ()=>{ const R = RT(); return { phase:R.phase, t:Math.round(R.time), obs:R.obsN, armed:!!R.armed, doc:!!R.docDone, ejiro:!!R.ejiroOpen, sus:V13.rt.eyes ? +V13.rt.eyes.v.toFixed(2) : null, seen:+(R.seen || 0).toFixed(2), uche:R.ucheAt || '', cash:R.cash ? R.cash.i : -1 }; };
})();
