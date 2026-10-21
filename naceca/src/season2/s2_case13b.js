/* =========================================================================
   NACECA · v13 Case 13½ — The Gateman's Book (Maitama, Abuja, 22:15)
   An interlude. Tea with the gatemen of Kainji Crescent at Baba Shayi's
   kiosk, then Sgt. (rtd.) Bitrus Gyang at the gatehouse of No. 19, the empty
   house the bank trail ends at. Tell him the truth and he opens his book —
   as a witness who will read it in court, or as pages you photograph. Lie
   to him or offer money and the window slides shut: the book can still be
   photographed through the glass while he walks his round, if he and the
   gateman across the road don't see you. Then the black Prado comes, the
   gate slides open, and its driver — Godwin Ereba — gets out under the
   street lights for as long as it takes to photograph him. Uche waits in
   the car down the street and talks on the radio.
   ========================================================================= */
(function(){
'use strict';
const V13 = window.V13, MC = V13.mc;
const KEY = 'maitama', PI = Math.PI;
const V3 = (x, y, z)=>new THREE.Vector3(x, y, z);
const RT = ()=>V13.rt;
const A = n => V13.at(KEY, n);
const BIT = 'SGT. (RTD.) BITRUS', UCHE = 'SGT. UCHE';

/* ---------- the few lines the staging needs (gaps only; the case's dialogue is v13_dlg_c.js) ---------- */
Object.assign(DIALOGUE, {
  // caught at his window while he walked his round
  m13b_x_caught:[
    { speaker:BIT, mood:'angry', text:"Step away from my window, young man." },
    { speaker:BIT, text:"Twice tonight you have come to my gate the wrong way. I have written you down both times." },
  ],
});
const SAYS = {
  intro1:"Kainji Crescent. No. 19 is the dark gate on the right, past the tea seller. I'm in the car with the engine off.",
  intro2:"In Maitama a stranger at night is a driver, a gateman or a problem, sir. Be a customer. Go and drink tea.",
  round:"He's walking his round, sir. If you want that book, it's now — and the gateman at No. 21 is watching the street.",
  back:"He's back in his box, sir. Leave the book. Come and sit with Baba Shayi — the car comes before eleven.",
  wait:"Good. Now go and sit with Baba Shayi, sir. If the gatemen are right, the black car comes before eleven.",
  caught:"Come away, sir. Slowly. Sit with the tea seller — the car comes before eleven.",
  made:"He saw you, sir. A man at a tea stand — that's all he saw. But we've got no face.",
  got:"Got him? Good. Godwin Ereba, at the gate of No. 19, on the second Friday.",
  // the book objective dropped because you sat down first (explaining why is allowed on Senior)
  book:"The book stays behind his glass tonight.",
};
/* Senior Agent: Uche says what happened, not what to do next (null: the line is Recruit only) */
const SAYS_SR = {
  intro2:"In Maitama a stranger at night is a driver, a gateman or a problem, sir.",
  round:"He's walking his round, sir.",
  back:"He's back in his box.",
  wait:null,
  caught:"Come away, sir. Slowly.",
};
/* casework mode and the countdown rate (V13.rec / V13.timeRate from s2_core.js when present, else the same rule) */
const rec = ()=>typeof V13.rec === 'function' ? !!V13.rec() : (typeof isRecruit === 'function' && isRecruit());
const rate = ()=>{ const r = typeof V13.timeRate === 'function' ? V13.timeRate() : (typeof timerRate === 'function' ? timerRate() : 1); return (typeof r === 'number' && isFinite(r) && r >= 0) ? r : 1; };
const line = k => (!rec() && Object.prototype.hasOwnProperty.call(SAYS_SR, k)) ? SAYS_SR[k] : SAYS[k];
const radio = (t, ms)=>{ if(t) V13.radio(UCHE, t, ms); };
/* what a replay clears (as Case 12 does): this case's flag, its exhibits, its documents' attempts */
const FLAGS = ['s2_bitrus'];
const EVIDS = ['visitor_book', 'visitor_book_photo', 'ereba_photo'];
const DOCKEYS = ['m13b_book', 'm13b_book_photo'];

/* ---------- looks ---------- */
const plainUche = { torso:'#2a6a8a', armA:'#2a6a8a', armB:'#2a6a8a', armC:'#2a6a8a', gear:[], vest:null, text:null, hips:'#2a2622', thigh:'#2a2622', shin:'#2a2622' };
const GATEMEN = [
  V13.look('gateman'),
  V13.look('gateman', { torso:'#6a3a2a', armA:'#6a3a2a', armB:'#6a3a2a', armC:'#6a3a2a', gear:['Gear_Fila'], cap:'#e8e4da' }),
  V13.look('gateman', { torso:'#e8e4da', armA:'#e8e4da', armB:'#e8e4da', armC:'#e8e4da', gear:['Gear_Kaftan'], robe:'#e8e4da', skin:'#3e2418' }),
  V13.look('gateman', { torso:'#2a4a3a', armA:'#2a4a3a', armB:'#2a4a3a', armC:'#2a4a3a', skin:'#5a3826' }),
];

/* ---------- shared hooks (the same block is in v13_case13.js; whichever loads first installs it) ---------- */
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
   flags. The same block is in v13_case13.js; whichever loads first installs it. */
if(typeof window.applyEffect === 'function' && !V13._c13flag){
  V13._c13flag = true;
  V13.wrap('applyEffect', orig => function(eff, flag){
    if(!eff && flag && typeof flag === 'object' && ('s2_wire' in flag || 's2_bitrus' in flag)) eff = {};
    return orig.call(this, eff, flag);
  });
}

/* ---------- styles: the viewfinder, the camera flash ---------- */
function css(){
  if(document.getElementById('c13b-css')) return;
  const s = document.createElement('style'); s.id = 'c13b-css';
  s.textContent = `
#c13b-vf{position:absolute;left:50%;top:44%;width:min(34vw,300px);height:min(22vw,190px);transform:translate(-50%,-50%);pointer-events:none;z-index:7;display:none}
#c13b-vf.show{display:block}
#c13b-vf i{position:absolute;width:26px;height:26px;border:2px solid var(--manila,#E9DCC0)}
#c13b-vf i:nth-child(1){left:0;top:0;border-right:0;border-bottom:0}#c13b-vf i:nth-child(2){right:0;top:0;border-left:0;border-bottom:0}
#c13b-vf i:nth-child(3){left:0;bottom:0;border-right:0;border-top:0}#c13b-vf i:nth-child(4){right:0;bottom:0;border-left:0;border-top:0}
#c13b-vf.on i{border-color:var(--green,#0B6E4F)}
#c13b-vf b{position:absolute;left:50%;top:50%;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;border:1.5px solid var(--manila,#E9DCC0)}
#c13b-vf.on b{border-color:var(--green,#0B6E4F);background:var(--green,#0B6E4F)}
#c13b-vf em{position:absolute;left:0;right:0;bottom:-22px;text-align:center;font-family:var(--font-mono,'JetBrains Mono',monospace);font-style:normal;font-size:10px;letter-spacing:.18em;color:var(--manila,#E9DCC0)}
#c13b-flash{position:absolute;inset:0;background:var(--manila,#E9DCC0);opacity:0;pointer-events:none;z-index:95;transition:opacity .35s ease-out}
#c13b-flash.go{opacity:.35;transition:none}
body.reduce-motion #c13b-flash.go{opacity:0}`;
  document.head.appendChild(s);
}
function flash(){
  let el = document.getElementById('c13b-flash');
  if(!el){ el = V13.el('div', '', ''); el.id = 'c13b-flash'; document.getElementById('game-root').appendChild(el); }
  el.classList.add('go'); setTimeout(()=>el.classList.remove('go'), 60);
  shutter();
}
function viewfinder(on, lit, text, top){
  let el = document.getElementById('c13b-vf');
  if(!el){ el = V13.el('div', '', '<i></i><i></i><i></i><i></i><b></b><em></em>'); el.id = 'c13b-vf'; (document.getElementById('hud') || document.getElementById('game-root')).appendChild(el); }
  el.classList.toggle('show', !!on); el.classList.toggle('on', !!lit);
  if(text != null) el.querySelector('em').textContent = text;
  el.style.top = top != null ? Math.round(top) + 'px' : '44%';               // the frame rides at his height on screen
}

/* ---------- sounds: a shutter, the generators of Kainji Crescent ---------- */
function shutter(){
  if(typeof AUDIO === 'undefined' || !AUDIO.enabled) return;
  try{
    ensureAudio(); const ctx = AUDIO.ctx, t = ctx.currentTime;
    for(const dt of [0, 0.07]){
      const b = ctx.createBuffer(1, 900, ctx.sampleRate), d = b.getChannelData(0);
      for(let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const s = ctx.createBufferSource(); s.buffer = b; const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1800;
      const g = ctx.createGain(); g.gain.value = 0.22; s.connect(f); f.connect(g); g.connect(AUDIO.sfxGain); s.start(t + dt);
    }
  }catch(e){}
}
let HUM = null;
function hum(on){
  if(!on){ if(HUM){ try{ HUM.forEach(n => n.stop()); }catch(e){} HUM = null; } return; }
  if(typeof AUDIO === 'undefined' || !AUDIO.enabled || HUM) return;
  try{
    ensureAudio(); const ctx = AUDIO.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 49;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 140;
    const g = ctx.createGain(); g.gain.value = 0.03;
    const l = ctx.createOscillator(); l.frequency.value = 6.2; const lg = ctx.createGain(); lg.gain.value = 0.012; l.connect(lg); lg.connect(g.gain);
    const o2 = ctx.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = 61; const g2 = ctx.createGain(); g2.gain.value = 0.4; o2.connect(g2); g2.connect(f);
    o.connect(f); f.connect(g); g.connect(AUDIO.ambientGain); o.start(t); l.start(t); o2.start(t);
    HUM = [o, l, o2];
  }catch(e){}
}

/* ---------- movers of our own (people and cars keep going under dialogue) ---------- */
const turnTo = (a, b, k)=>{ let d = b - a; while(d > PI) d -= 2 * PI; while(d < -PI) d += 2 * PI; return a + d * Math.min(1, k); };
function walk(ch, pts, opt){
  opt = opt || {};
  const R = RT(); R.movers = (R.movers || []).filter(m => m.ch !== ch);
  return new Promise(res => {
    R.movers.push({ ch, pts:pts.map(p => ({ x:p[0], z:p[1] })), i:0, speed:opt.speed || 1.3, end:opt.end || 'idle', face:opt.face, res, car:!!opt.car, slow:opt.slow || 0 });
    if(!opt.car) V13.play(ch, opt.clip || 'walk', { fade:0.25 });
  });
}
function faceTo(ch, rot){ const R = RT(); R.turns = (R.turns || []).filter(t => t.ch !== ch); R.turns.push({ ch, rot }); }
function moveStep(dt){
  const R = RT(), L = R.movers || [];
  for(let k = L.length - 1; k >= 0; k--){
    const m = L[k], ch = m.ch;
    let sp = m.speed;
    if(m.car && m.slow){                                                      // cars ease into their stop
      const e = m.pts[m.pts.length - 1], left = Math.hypot(e.x - ch.position.x, e.z - ch.position.z);
      sp = Math.max(1.2, Math.min(m.speed, left * m.slow));
    }
    let step = sp * dt;
    while(step > 0 && m.i < m.pts.length){
      const b = m.pts[m.i], dx = b.x - ch.position.x, dz = b.z - ch.position.z, d = Math.hypot(dx, dz);
      if(d <= step){ ch.position.x = b.x; ch.position.z = b.z; step -= d; m.i++; }
      else { ch.position.x += dx / d * step; ch.position.z += dz / d * step; step = 0; m.want = m.car ? Math.atan2(-dx, -dz) : Math.atan2(dx, dz); }
    }
    if(m.want != null) ch.rotation.y = turnTo(ch.rotation.y, m.want, dt * (m.car ? 3.2 : 9));
    if(m.i >= m.pts.length){ L.splice(k, 1); if(m.face != null) faceTo(ch, m.face); if(!m.car) V13.play(ch, m.end, { fade:0.3 }); m.res(); }
  }
  const T = R.turns || [];
  for(let k = T.length - 1; k >= 0; k--){
    const t = T[k]; t.ch.rotation.y = turnTo(t.ch.rotation.y, t.rot, dt * 7);
    if(Math.abs(turnTo(t.ch.rotation.y, t.rot, 1) - t.ch.rotation.y) < 0.01){ t.ch.rotation.y = t.rot; T.splice(k, 1); }
  }
}
const stop = ch => { const R = RT(); R.movers = (R.movers || []).filter(m => m.ch !== ch); };
const alive = R => RT() === R && R.id === 'm13b';
/* a mid-case objective goes ahead of the one it interrupts, so the HUD shows it as the task in hand */
function objAdd(id, text, before){
  V13.obj(id, text);
  const L = S.game.objectives || [], i = L.findIndex(o => o.id === id), j = L.findIndex(o => o.id === before);
  if(j >= 0 && i > j){ L.splice(j, 0, L.splice(i, 1)[0]); if(typeof renderObjectives === 'function') renderObjectives(); }
}
const later = (R, ms, f)=>setTimeout(()=>{ if(alive(R)) f(); }, ms);
const wait = (R, ms)=>new Promise(res => later(R, ms, res));

/* ---------- the camera ---------- */
const SH = {
  intro:[[2.4, 2.5, 27.6], [-1.2, 1.4, 6.0]],
  kiosk:[[3.65, 1.62, 6.35], [5.7, 1.12, 3.9]],
  window:[[-4.55, 1.72, -2.25], [-7.25, 1.42, -3.25]],                    // past Kelechi's shoulder, through the open window
  book:[[-5.9, 1.55, -3.05], [-6.75, 0.95, -3.2]],
  gate:[[4.3, 1.62, 5.0], [-3.4, 1.15, 1.6]],
  street:[[2.6, 2.1, -6.5], [-2.5, 1.0, 8.0]],
  gatehouse:[[-3.9, 1.6, -2.85], [-7.4, 1.25, -3.2]],
};
function shot(name, cut){
  const s = SH[name]; if(!s) return;
  const R = RT(); if(R.shotName === name && !cut) return; R.shotName = name;
  TPCAM.override = { pos:V3(...s[0]), look:V3(...s[1]) };
  if(cut) TPCAM.cur = null;
}
function freeCam(yaw){ const R = RT(); R.shotName = null; TPCAM.override = null; TPCAM.cur = null; if(ENGINE.player) ENGINE.cameraYaw = yaw != null ? yaw : ENGINE.player.rotation.y; }

/* ---------- sitting ---------- */
function seat(at, opt){
  opt = opt || {};
  const P = ENGINE.player, R = RT(); if(!P) return;
  R.seat = { x:at.x, z:at.z, rot:at.rot, clip:'sit', locked:!!opt.locked, release:opt.release || null };
  P.position.set(at.x, 0, at.z); P.rotation.y = at.rot; ENGINE.playerYaw = at.rot;
  V13.play(P, 'sit', { fade:0.35 });
}
function unseat(to){
  const P = ENGINE.player, R = RT(); if(!R.seat) return;
  R.seat = null;
  if(P && to){ P.position.x = to[0]; P.position.z = to[1]; }
  if(P) V13.play(P, 'idle', { fade:0.3 });
}

/* ---------- vehicles ---------- */
/* without the vehicle library (any device where the art failed: ART.failed) the Prado is a plain dark box of its
   size, so its arrival, the driver and the photograph (ereba_photo, a finale exhibit) still happen */
function standInCar(color, at, rot){
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.8, 4.8), new THREE.MeshStandardMaterial({ color:color || '#1e2125', roughness:0.6, metalness:0.2 }));
  body.position.set(0, 0.9, 0); g.add(body);
  g.position.set(at[0], 0, at[1]); g.rotation.y = rot || 0; g.userData.standIn = true;
  ENGINE.scene.add(g);
  return g;
}
function car(type, color, at, rot, lights){
  if(typeof VEH === 'undefined' || !VEH.ready) return null;
  const v = VEH.spawn(type, { color, lights:lights ? 'on' : 'off', glow:!!lights });
  if(!v) return null;
  v.position.set(at[0], 0, at[1]); v.rotation.y = rot || 0; ENGINE.scene.add(v);
  return v;
}

/* ---------- gate B: the art bakes its leaves in, so they are hidden and replaced by leaves that slide ----------
   (if the scene ever ships a 'Gate' node, v13_world slides that instead) */
function gateFix(){
  const R = RT(), D = (R.dr && R.dr.D) || {};
  if(V13.world.live && V13.world.live.gate){ R.gate = { world:true }; return; }
  const box = [-7.53, -7.36, 0.035, 2.95, -1.085, 3.085];
  let n = 0;
  const root = D.Env || (R.dr && R.dr.inst && R.dr.inst.root);
  if(root) root.traverse(m => { if(m.isMesh && m.geometry && m.geometry.attributes.position) n += collapse(m, box); });
  const g = new THREE.Group(); g.position.set(-7.44, 0, 0); ENGINE.scene.add(g);
  let tex = null; try{ tex = ENVART.texture('mt_gate'); }catch(e){}
  const face = new THREE.MeshStandardMaterial({ map:tex, color:'#ffffff', roughness:0.55, metalness:0.3 });
  const edge = new THREE.MeshStandardMaterial({ color:'#141518', roughness:0.6, metalness:0.3 });
  for(const zc of [-0.05, 2.05]){
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.85, 2.06), [face, face, edge, edge, edge, edge]);
    leaf.position.set(0, 1.475, zc); g.add(leaf);
  }
  R.gate = { g, open:0, want:0, baked:n };
}
function collapse(mesh, box){
  const g = mesh.geometry, pos = g.attributes.position;
  mesh.updateWorldMatrix(true, false);
  const den = a => !a.normalized ? 1 : (a.array instanceof Int16Array ? 1 / 32767 : a.array instanceof Uint16Array ? 1 / 65535 : a.array instanceof Int8Array ? 1 / 127 : a.array instanceof Uint8Array ? 1 / 255 : 1);
  const k = den(pos), v = new THREE.Vector3(), M = mesh.matrixWorld;
  const inside = i => { v.set(pos.getX(i) * k, pos.getY(i) * k, pos.getZ(i) * k).applyMatrix4(M); return v.x > box[0] && v.x < box[1] && v.y > box[2] && v.y < box[3] && v.z > box[4] && v.z < box[5]; };
  let n = 0;
  if(g.index){
    const I = g.index.array;
    for(let t = 0; t + 2 < I.length; t += 3) if(inside(I[t]) && inside(I[t + 1]) && inside(I[t + 2])){ I[t + 1] = I[t]; I[t + 2] = I[t]; n++; }
    if(n) g.index.needsUpdate = true;
  } else {
    for(let t = 0; t + 2 < pos.count; t += 3) if(inside(t) && inside(t + 1) && inside(t + 2)){
      for(const j of [t + 1, t + 2]) pos.setXYZ(j, pos.getX(t), pos.getY(t), pos.getZ(t));
      n++;
    }
    if(n){ if(pos.isInterleavedBufferAttribute) pos.data.needsUpdate = true; else pos.needsUpdate = true; }
  }
  return n;
}
function gate(open){
  const R = RT(), G = R.gate; if(!G) return;
  if(G.world){ V13.world.open('gate', open ? 1 : 0); return; }
  G.want = open ? 1 : 0;
}
function gateStep(dt){
  const G = RT().gate; if(!G || G.world || !G.g) return;
  G.open += (G.want - G.open) * Math.min(1, dt * 1.1);
  G.g.position.z = G.open * 4.25;                                           // slides north, behind the compound wall
}

/* ---------- every frame, playing or not ---------- */
function always(dt){
  const R = RT(); if(!R || R.id !== 'm13b') return;
  let dlg = false, doc = false, other = false;
  document.querySelectorAll('.overlay.show').forEach(o => { if(o.id === 'screen-dialogue') dlg = true; else if(o.id === 'screen-puzzle') doc = true; else other = true; });
  const playing = ENGINE.movementEnabled && !dlg && !doc && !other;
  if(!other){
    moveStep(dt); gateStep(dt);
    if(R.anims) R.anims = R.anims.filter(f => { try{ return f(dt, playing) !== false; }catch(e){ return false; } });
    if(R.watch) R.watch(dt, playing);
  }
  if(R.docOpen && !doc && !(V13.underPause && V13.underPause('screen-puzzle'))){ R.docOpen = false; if(R.onDocGone){ const f = R.onDocGone; R.onDocGone = null; f(); } }
  if(!playing){
    if(V13.world && V13.world.update && (dlg || doc)) V13.world.update(dt);
    if(TPCAM.override && typeof updateCamera === 'function') updateCamera();
  }
}

/* ---------- the phone: what came in after the ninth floor (no hub between m13 and m13b delivers it) ---------- */
function afterNinthPhone(){
  if(Object.values(V13.HUBS || {}).some(H => H.after === 'm13')) return;
  const s = V13.s2(); s.delivered = s.delivered || {}; if(s.delivered.after_m13) return; s.delivered.after_m13 = 1;
  if(!window.V12 || !V12.mem) return;
  const P = V12.mem().phone, tid = w => String(w).toLowerCase().replace(/[^a-z]/g, '');
  const lang = t => (typeof SETTINGS !== 'undefined' && SETTINGS.lang === 'english' && t.textEn) ? t.textEn : t.text;
  for(const m of (V13.PHONE && V13.PHONE.after_m13) || []){
    if(m.cond){ let ok = false; try{ ok = !!(new Function('S', 'return (' + m.cond + ')'))(S); }catch(e){} if(!ok) continue; }
    const th = P[tid(m.who)] = P[tid(m.who)] || { msgs:[], unread:0 };
    th.msgs.push({ f:'them', text:lang(m), at:'m13b' }); th.unread++; th.last = 'm13b';
  }
  if(V13.deliverTips) V13.deliverTips('m13');
  return ((V13.PHONE && V13.PHONE.after_m13) || []).find(m => m.who === 'MUM');
}

/* Wayfinding (RT04). After a lie the beta's last-resort pointer skips the optional "Knock on the glass" and lands on
   the bench, which drops the book (D18), and during his round it still prefers the bench to the glass. So: on Senior
   the book and the photo objectives point at nothing; on Recruit the photo objective points at the glass, and the
   book objective on the cold branch points at nothing (there is nothing to do there until his round). The tea, the
   gatehouse and the gate objectives only ever point at the next required spot. */
if(window.WAY && WAY.OBJ_TARGETS){
  WAY.OBJ_TARGETS.m13b = Object.assign(WAY.OBJ_TARGETS.m13b || {}, {
    o13b_book:()=>(!rec() || MC().s2_bitrus === 'cold') ? { ui:true } : null,
    o13b_photo:()=>rec() ? 'Photograph the book through the glass' : { ui:true },
  });
}

/* ======================================================================
   THE CASE
   ====================================================================== */
V13.defCase('m13b', {
  title:'The Gateman\'s Book', region:'FCT', sub:'Maitama · Kainji Crescent · 22:15', evMax:2, xp:260, ambient:'mansion',
  objectives:()=>[
    { id:'o13b_tea', text:'Have tea with the gatemen at Baba Shayi\'s kiosk' },
    { id:'o13b_bitrus', text:'Talk to the gateman at No. 19' },
    { id:'o13b_book', text:'Get a look at the visitor book' },
    { id:'o13b_gate', text:'Watch the gate of No. 19' },
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
    V13.scene(KEY, { start:'start', player:()=>V13.plainClothes() });
    const R = RT();
    ENGINE.sceneAlways = always;
    gateFix();
    // Uche, in the car down the street
    R.ucheCar = car('sedan', '#4a5664', [4.75, 25.6], 0, false);
    R.uche = V13.person(plainUche, { x:4.38, z:25.45, rot:0 }, { kind:'uche', clip:'sit', solid:false });
    R.uche.position.y = 0.18;
    // the kiosk: Baba Shayi and four gatemen arguing about football
    const s = A('shayi') || { x:6.4, z:4.4, rot:-PI / 2 };
    R.shayi = V13.person('shayi', { x:s.x, z:s.z, rot:s.rot }, { clip:'idle', solid:false, id:'shayi' });
    R.gm = V13.list(KEY, 'gatemen').map((g, i) => V13.person(GATEMEN[i % 4], { x:g[0], z:g[1], rot:g[2] }, { clip:i === 3 ? 'sit' : 'sit', solid:false }));
    // No. 19's gatehouse: Sgt. Bitrus on his chair behind the lit window, the book on the counter
    R.bitrus = V13.person('bitrus', { x:-7.55, z:-3.1, rot:PI / 2 }, { clip:'sit', solid:false, id:'bitrus' });
    const lamp = new THREE.PointLight('#eef3ff', 0.9, 4.2, 2); lamp.position.set(-7.7, 2.45, -3.15); ENGINE.scene.add(lamp);
    // security floodlights: No. 19's on its gate pillar, and the house across the road's on its wall, both on the street
    // in front of No. 19's gate — whoever gets out of a car there is lit from both sides
    const flood = (col, i, dist, ang, decay, at, to)=>{ const s = new THREE.SpotLight(col, i, dist, ang, 0.7, decay); s.position.set(...at); s.target.position.set(...to); ENGINE.scene.add(s); ENGINE.scene.add(s.target); return s; };
    flood('#fff2dc', 1.5, 13, 0.62, 2, [-6.9, 3.6, 3.3], [-1.6, 0, 2.6]);
    flood('#f4f0ff', 1.8, 15, 0.45, 1, [6.95, 3.4, -0.5], [-1.6, 0.6, 2.8]);
    // the glass he can slide shut
    R.pane = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ color:'#a8c0d8', transparent:true, opacity:0.2, depthWrite:false, side:THREE.DoubleSide }));
    R.pane.rotation.y = PI / 2; R.pane.position.set(-6.49, 1.4, -2.3); ENGINE.scene.add(R.pane);
    // a little life at the kiosk: the argument goes round the bench
    let t = 0, who = 0;
    R.anims = [(dt)=>{ t -= dt; if(t > 0) return; t = 2.4 + Math.random() * 2.2;
      const live = R.gm.filter(g => g.userData.atBench !== false);
      live.forEach(g => V13.play(g, 'sit', { fade:0.3 }));
      const g = live[who++ % Math.max(1, live.length)]; if(g) V13.play(g, 'sit_talk', { fade:0.3 }); }];
    R.itShayi = V13.talk(R.shayi, 'Have tea at Baba Shayi\'s kiosk', it => { V13.drop(it); tea(); }, { range:2.6 });
  },
  start(){
    const R = RT();
    hum(true);
    const sc = ENGINE.scene;                                                   // the generators stop with the street: case over, or any other scene
    const guard = setInterval(()=>{ if(!alive(R) || ENGINE.scene !== sc){ hum(false); clearInterval(guard); } }, 1000);
    ENGINE.movementEnabled = false; showHUD(false);
    R.intro = true;
    shot('intro', true);
    later(R, 2800, endIntro);
  },
});
function endIntro(){
  const R = RT(); if(!R.intro) return; R.intro = false;
  freeCam(); ENGINE.movementEnabled = true; showHUD(true);
  radio(line('intro1'), 4200); radio(line('intro2'), 4200);
  const mum = afterNinthPhone();
  if(mum) later(R, 12000, ()=>V13.text('MUM', mum.text, 6000));
}

/* ---------- tea at Baba Shayi's ---------- */
function tea(){
  const R = RT();
  endIntro();
  // at the kiosk already: Uche's "go and drink tea" is moot if it hasn't been said yet (the engine's radio queue)
  try{ if(typeof RADIO !== 'undefined' && RADIO.queue) for(let i = RADIO.queue.length - 1; i >= 0; i--){ const q = RADIO.queue[i]; if(q && [SAYS.intro1, SAYS.intro2, SAYS_SR.intro2].includes(q.text)) RADIO.queue.splice(i, 1); } }catch(e){}
  ENGINE.movementEnabled = false;
  const P = ENGINE.player;
  P.position.set(4.85, 0, 4.12); V13.face(P, R.shayi.position.x, R.shayi.position.z);
  V13.face(R.shayi, P.position.x, P.position.z);
  shot('kiosk', true);
  R.onLine = l => { if(l.speaker === 'BABA SHAYI'){ V13.once(R.shayi, 'talk', 'idle'); } };
  V13.say('m13b_shayi', ()=>{
    R.onLine = null; freeCam(); ENGINE.movementEnabled = true;
    R.teaPick = V13.picked('m13b_shayi');                                     // 0 treat · 1 greet · 2 ask
    R.watchWeight = R.teaPick === 0 ? 0.35 : R.teaPick === 1 ? 0.65 : 1.0;   // the man from No. 21 remembers how you came
    V13.done('o13b_tea');
    if(R.teaPick === 0) V13.toast('TEA FOR THE BENCH', 'Nine teas, four eggs, and four new friends on Kainji Crescent.', 2600);
    // two of them go back to their gates: one up the road, one across to No. 21
    const a = R.gm[1], b = R.gm[3];
    a.userData.atBench = false; b.userData.atBench = false;
    later(R, 1200, ()=>{
      walk(a, [[4.9, 6.5], [6.1, 12.0], [6.2, 20.5]], { end:'sit', face:-PI / 2 - 0.3 });
      walk(b, [[5.2, 1.6], [5.9, -6.0], [6.0, -9.45]], { end:'idle', face:-PI / 2 }).then(()=>{ R.nbAt = true; });
    });
    R.neighbour = b;
    const it = V13.talk(R.bitrus, 'Talk to the gateman at No. 19', it => { V13.drop(it); bitrus(); }, { range:2.7, labelY:1.25 });
    R.itBitrus = it;
  });
}

/* ---------- Sgt. Bitrus at the gatehouse ---------- */
function bitrus(){
  const R = RT();
  ENGINE.movementEnabled = false;
  const P = ENGINE.player, gh = A('gatehouse') || { x:-6.2, z:-3.2 };
  P.position.set(gh.x + 0.15, 0, gh.z); P.rotation.y = -PI / 2;
  // he stands to answer the window
  stop(R.bitrus); R.bitrus.position.set(-7.25, 0, -3.2); R.bitrus.rotation.y = PI / 2; V13.play(R.bitrus, 'idle', { fade:0.4 });
  shot('window', true);
  R.onLine = l => {
    if(/BITRUS/.test(l.speaker || '')) V13.once(R.bitrus, 'talk', 'idle');
    if(/opens a fat ledger|licks his pencil/.test(l.text || '')) V13.once(R.bitrus, 'interact', 'idle');
  };
  V13.say('m13b_bitrus', ()=>{
    R.onLine = null;
    V13.done('o13b_bitrus');
    const b = MC().s2_bitrus;
    if(b === 'witness' || b === 'photo') readBook(b);
    else shutWindow();
  });
}
/* the book: read under his lamp (witness), photographed with his blessing (photo), or through the glass (cold) */
function readBook(mode){
  const R = RT();
  const key = mode === 'cold' ? 'm13b_book_photo' : (V13.C && V13.C.book ? V13.C.book() : (mode === 'photo' ? 'm13b_book_photo' : 'm13b_book'));
  const id = key === 'm13b_book' ? 'visitor_book' : 'visitor_book_photo';
  const good = mode === 'witness' ? 'good' : mode === 'photo' ? 'contested' : 'weak';
  ENGINE.movementEnabled = false;
  shot('book', true);
  if(mode !== 'witness') flash();
  later(R, mode === 'witness' ? 500 : 900, ()=>{
    S.game.evQ = S.game.evQ || {}; delete S.game.evQ[id];                    // the document marks a failed read itself
    R.docOpen = true;
    R.onDocGone = ()=>{                                                      // backed off: the book is still there to read
      freeCam(); ENGINE.movementEnabled = true;
      const it = V13.spot({ x:-6.3, y:1.15, z:-3.2 }, mode === 'cold' ? 'Look through your photos of the book' : 'Read the visitor book', it2 => { V13.drop(it2); readBook(mode); }, { verb:'inspect', range:2.2 });
      R.itBookAgain = it;
    };
    V13.doc(key, ()=>{
      R.docOpen = false; R.onDocGone = null;
      // the document's own outcome (its misses follow casework: Recruit 3, Senior 2), as Case 12 reads it
      const failed = (S.game.evQ || {})[id] === 'weak';
      S.game.evQ = S.game.evQ || {};
      V13.ev(id, ((PUZZLES[key] || {}).onCorrect || {}).evidenceName || 'The Maitama visitor book', failed ? 'weak' : good, 40);
      S.game.evQ[id] = failed ? 'weak' : good;
      V13.done('o13b_book');
      freeCam(-PI / 2 + 0.6); ENGINE.movementEnabled = true;
      if(mode === 'witness') later(R, 600, ()=>{ V13.play(R.bitrus, 'idle'); V13.toast('A WITNESS', 'Sgt. (rtd.) Bitrus Gyang will bring his book to court — in uniform.', 3000); });
      if(mode === 'cold'){ R.watch = null; V13.eyesOff(); later(R, 800, ()=>radio(line('wait'), 4200)); }
      else later(R, 1200, ()=>radio(line('wait'), 4200));
      toTheBench();
    });
  });
}

/* ---------- cold: the window slides shut; the book through the glass while he walks his round ---------- */
function shutWindow(){
  const R = RT();
  V13.once(R.bitrus, 'interact', 'idle');
  // the glass slides across
  let t = 0; R.anims.push(dt => { t += dt / 0.8; const k = Math.min(1, t); R.pane.position.z = -2.3 - 0.9 * k * k * (3 - 2 * k); return k < 1; });
  later(R, 700, ()=>{ V13.play(R.bitrus, 'sit', { fade:0.4 }); R.bitrus.position.set(-7.55, 0, -3.1); });
  freeCam(-PI / 2 + 0.8); ENGINE.movementEnabled = true;
  V13.toast('THE WINDOW', 'Bitrus slides the glass shut. The book stays open on the counter, under his lamp.', 3000);
  R.itShut = V13.spot({ x:-6.3, y:1.3, z:-3.2 }, 'Knock on the glass', it => { V13.toast('SGT. BITRUS', 'He doesn\'t look up. He writes something down.', 2000); V13.once(R.bitrus, 'interact', 'sit'); }, { verb:'talk', range:1.8, optional:true });
  // the bench is always there: leave it, wait for the car
  toTheBench(true);
  later(R, 9000, theRound);
}
function theRound(){
  const R = RT(); if(R.roundDone || R.carComing) return;
  R.round = true;
  // out of the box, through the wicket by the gate, and up the road
  walk(R.bitrus, [[-8.6, -3.1]], { speed:1.1 }).then(()=>{
    if(!alive(R)) return;
    R.bitrus.visible = false;
    later(R, 2200, ()=>{
      R.bitrus.visible = true; R.bitrus.position.set(-6.75, 0, 3.45);
      radio(line('round'), 4600);
      objAdd('o13b_photo', 'Optional: photograph the book through the glass', 'o13b_book');
      if(R.itShut){ V13.drop(R.itShut); R.itShut = null; }
      R.itPhoto = V13.spot({ x:-6.3, y:1.2, z:-3.2 }, 'Photograph the book through the glass', ()=>startPhoto(), { verb:'inspect', range:1.7 });
      watchers();
      const legs = [
        [[[-6.2, 4.5], [-6.2, 10.5]], PI / 2, 3600],
        [[[-6.2, -0.6], [-6.1, -5.6]], PI, 3400],
        [[[-6.2, -0.6], [-6.75, 3.45]], null, 0],
      ];
      const over = ()=>!alive(R) || R.caught || R.roundDone;
      const leg = i => {
        if(over()) return;
        if(i >= legs.length){ endRound(); return; }
        const [pts, face, pause] = legs[i];
        walk(R.bitrus, pts, { speed:1.05, end:'idle', face }).then(()=>{ if(over()) return; if(pause) later(R, pause, ()=>leg(i + 1)); else leg(i + 1); });
      };
      leg(0);
    });
  });
}
/* who's watching: Bitrus on his round, and the gateman across the road at No. 21 — it only matters at No. 19's window */
const nearWindow = (P, r)=>Math.hypot(P.x + 6.45, P.z + 3.2) < r;
function watchers(){
  const R = RT();
  const nb = R.neighbour; let cyc = 0;
  R.nbLook = true;
  const crouching = ()=>!!(ENGINE.keys && ENGINE.keys['KeyC']) || !!ENGINE.crouch;
  V13.eyes({ label:'SEEN', watchers:[], rate:1.1, decay:0.18,
    extraFn:()=>{
      const P = ENGINE.player.position; if(!nearWindow(P, 4.2)) return 0;
      let seen = 0;
      // Bitrus: close, and looking your way
      const B = R.bitrus;
      if(B && B.visible){
        const dx = P.x - B.position.x, dz = P.z - B.position.z, d = Math.hypot(dx, dz);
        const ang = Math.abs(((Math.atan2(dx, dz) - B.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
        if(d < 9 && ang < 1.1) seen = (1 - d / 9) * (crouching() ? 0.45 : 1);
      }
      // the man at No. 21: across the road, when he isn't on his phone
      if(nb && R.nbAt && R.nbLook && nearWindow(P, 3.2)) seen = Math.max(seen, (R.watchWeight || 0.65) * 0.4 * (crouching() ? 0.4 : 1));
      return seen;
    },
    onMade:()=>caughtAtWindow() });
  // he looks across the road for a while, then at his phone
  R.anims.push(dt => {
    if(!R.round) return false;
    if(!R.nbAt) return;
    cyc -= dt; if(cyc > 0) return;
    R.nbLook = !R.nbLook; cyc = R.nbLook ? 4.5 + Math.random() * 2 : 3.5 + Math.random() * 2;
    if(R.nbLook){ V13.play(nb, 'idle', { fade:0.3 }); faceTo(nb, -PI / 2); }
    else { V13.play(nb, 'phone', { fade:0.3 }); faceTo(nb, PI - 0.4); }
  });
  if(!R.crouchHint){ R.crouchHint = 1; if(typeof showHint === 'function') showHint('c13b_crouch', 'Crouch (C) to keep low at the window. Watch the SEEN meter.', 'Crouch to keep low at the window. Watch the SEEN meter.', 5200); }
}
function startPhoto(){
  const R = RT(); if(R.photo || R.caught) return;
  R.photo = { t:0, need:2.4 };
  if(R.itPhoto){ R.itPhoto.mesh.visible = false; }
  const steady = (dt, playing)=>{
    if(!R.photo || R.caught) return false;
    if(!playing) return;
    const P = ENGINE.player.position, near = Math.hypot(P.x + 6.45, P.z + 3.2) < 1.7;
    R.photo.t = near ? R.photo.t + dt : Math.max(0, R.photo.t - dt * 1.5);
    if(typeof showMeter === 'function') showMeter('c13bphoto', near ? 'PHOTO — HOLD STEADY' : 'PHOTO — BACK TO THE GLASS', R.photo.t / R.photo.need, 'good', Math.round(100 * R.photo.t / R.photo.need) + '%');
    if(!near && R.photo.t <= 0){ R.photo = null; if(typeof hideMeter === 'function') hideMeter('c13bphoto'); if(R.itPhoto) R.itPhoto.mesh.visible = true; return false; }
    if(R.photo.t >= R.photo.need){
      R.photo = null; if(typeof hideMeter === 'function') hideMeter('c13bphoto');
      if(R.itPhoto){ V13.drop(R.itPhoto); R.itPhoto = null; }
      V13.eyesOff(); R.photoDone = true;
      V13.done('o13b_photo');
      readBook('cold');
      return false;
    }
  };
  R.anims.push(steady);
}
function caughtAtWindow(){
  const R = RT(); if(R.caught) return; R.caught = true;
  V13.eyesOff();
  R.photo = null; if(typeof hideMeter === 'function') hideMeter('c13bphoto');
  if(R.itPhoto){ V13.drop(R.itPhoto); R.itPhoto = null; }
  S.game.objectives = (S.game.objectives || []).filter(o => o.id !== 'o13b_photo' && o.id !== 'o13b_book'); if(typeof renderObjectives === 'function') renderObjectives();
  ENGINE.movementEnabled = false;
  const P = ENGINE.player.position, B = R.bitrus;
  stop(B);
  const dx = P.x - B.position.x, dz = P.z - B.position.z, d = Math.hypot(dx, dz) || 1;
  walk(B, [[P.x - dx / d * 1.3, P.z - dz / d * 1.3]], { speed:1.6, end:'idle' });
  later(R, 900, ()=>{
    V13.face(ENGINE.player, B.position.x, B.position.z);
    shot('gatehouse', true);
    V13.say('m13b_x_caught', ()=>{
      freeCam(); ENGINE.movementEnabled = true;
      radio(line('caught'), 4000);
      endRound(true);
    });
  });
}
function endRound(wasCaught){
  const R = RT(); if(R.roundDone) return; R.roundDone = true; R.round = false;
  V13.eyesOff();
  if(R.itPhoto){ V13.drop(R.itPhoto); R.itPhoto = null; }
  if(!R.photoDone){
    S.game.objectives = (S.game.objectives || []).filter(o => o.id !== 'o13b_photo' && o.id !== 'o13b_book'); if(typeof renderObjectives === 'function') renderObjectives();
    if(!wasCaught) radio(line('back'), 4400);
  }
  // back into his box, back on his chair
  walk(R.bitrus, [[-6.75, 3.45]], { speed:1.1 }).then(()=>{
    if(!alive(R)) return;
    R.bitrus.visible = false;
    later(R, 1500, ()=>{ R.bitrus.visible = true; R.bitrus.position.set(-7.55, 0, -3.1); R.bitrus.rotation.y = PI / 2; V13.play(R.bitrus, 'sit'); });
  });
}

/* ---------- the bench: wait for the car ---------- */
function toTheBench(quiet){
  const R = RT(); if(R.itBench) return;
  R.itBench = V13.spot({ x:5.5, y:0.7, z:3.3 }, 'Sit with Baba Shayi and watch the gate', ()=>benchWait(), { verb:'use', range:2.0 });
}
function benchWait(){
  const R = RT(); if(R.carComing) return;
  let bookLeft = false;
  if(R.round && !R.roundDone){ R.roundDone = true; R.round = false; V13.eyesOff(); if(R.itPhoto){ V13.drop(R.itPhoto); R.itPhoto = null; }
    if(!R.photoDone){ S.game.objectives = (S.game.objectives || []).filter(o => o.id !== 'o13b_photo' && o.id !== 'o13b_book'); if(typeof renderObjectives === 'function') renderObjectives(); bookLeft = true; } }
  if(MC().s2_bitrus === 'cold' && !R.photoDone && !R.roundDone){
    // left before his round: the book stays behind the glass
    S.game.objectives = (S.game.objectives || []).filter(o => o.id !== 'o13b_book'); if(typeof renderObjectives === 'function') renderObjectives();
    bookLeft = true;
  }
  R.carComing = true;
  if(R.itBench){ V13.drop(R.itBench); R.itBench = null; }
  if(R.itShut){ V13.drop(R.itShut); R.itShut = null; }
  if(R.itBookAgain){ V13.drop(R.itBookAgain); R.itBookAgain = null; }
  seat({ x:5.48, z:3.22, rot:0 }, { release:()=>{ unseat([5.45, 3.9]); } });
  // Uche says why the book objective went (after the card, while the Prado comes up the crescent)
  V13.skip(['22:58', 'THE SECOND FRIDAY'], ()=>{ if(!alive(R)) return; if(bookLeft) radio(SAYS.book, 3600); theCar(); }, 2200);
  // during the card: Bitrus back on his chair, the gate shut, the SUV at the top of the crescent
  later(R, 900, ()=>{
    stop(R.bitrus); R.bitrus.visible = true; R.bitrus.position.set(-7.55, 0, -3.1); R.bitrus.rotation.y = PI / 2; V13.play(R.bitrus, 'sit');
    const sa = A('suv_arrive') || { x:2, z:26 };
    R.suv = car('suv', '#1e2125', [sa.x, sa.z + 6], 0, true) || standInCar('#1e2125', [sa.x, sa.z + 6], 0);
  });
}

/* ---------- the black Prado ---------- */
function theCar(){
  const R = RT();
  ENGINE.movementEnabled = false;
  shot('gate', true);
  const st = A('suv_stop') || { x:-2.5, z:2 };
  if(!R.suv){ afterCar(); return; }
  if(typeof sfxAlert === 'function') sfxAlert();
  let opened = false;
  R.anims.push(()=>{ if(!opened && R.suv.position.z < 11){ opened = true; gate(true); } return !opened; });
  walk(R.suv, [[2.0, 18.0], [0.6, 9.0], [-1.6, 4.4], [st.x, st.z]], { car:true, speed:7.5, slow:1.6 }).then(()=>{
    if(!alive(R)) return;
    R.onLine = l => {
      if(l.speaker === UCHE && /Driver's out/.test(l.text)) driverOut();
    };
    later(R, 400, ()=>V13.say('m13b_suv', ()=>{ R.onLine = null; photoWindow(); }));
  });
}
/* a point beside the parked Prado in its own frame (it stops turned off the kerb): +x its right — the street side — and +z its tail */
function bySuv(lx, lz){
  const v = RT().suv, r = v.rotation.y, c = Math.cos(r), s = Math.sin(r);
  return [v.position.x + lx * c + lz * s, v.position.z - lx * s + lz * c];
}
const streetSide = ()=>{ const r = RT().suv.rotation.y; return Math.atan2(Math.cos(r), -Math.sin(r)); };   // facing out of its right side
function driverOut(){
  const R = RT(); if(R.ereba) return;
  const v = R.suv, r = v.rotation.y;
  try{ VEH.setDoors(v, 0.55); }catch(e){}
  // out of the driver's door, round the back, to the rear door on the street side: the passenger's side
  const out = bySuv(-1.25, -0.45);
  R.ereba = V13.person('ereba', { x:out[0], z:out[1], rot:Math.atan2(-Math.cos(r), Math.sin(r)) }, { clip:'idle', solid:false, id:'ereba' });
  walk(R.ereba, [bySuv(-1.3, 2.9), bySuv(1.35, 2.9), bySuv(1.4, 0.75)], { speed:1.5, end:'idle', face:streetSide() });
}
function photoWindow(){
  const R = RT();
  if(!R.ereba) driverOut();
  // the camera starts on the nose of the Prado: he is in the picture, off to one side, and his walk round the back never
  // crosses the middle of it — centring him is the player's job
  const P0 = ENGINE.player.position, door = R.suv ? bySuv(1.4, 0.75) : [R.ereba.position.x, R.ereba.position.z];
  freeCam(Math.atan2(door[0] - P0.x, door[1] - P0.z) - 0.5);
  ENGINE.playerPitch = 0.16; ENGINE._lastCamDrag = performance.now();
  ENGINE.movementEnabled = true;
  objAdd('o13b_ereba', 'Photograph the driver — keep him in frame', 'o13b_gate');
  if(typeof showHint === 'function') showHint('c13b_photo', 'Turn the camera onto the driver and hold him in the frame.', 'Drag to turn the camera onto the driver and hold him in the frame.', 5200);
  R.shot = { t:0, need:1.5, left:14 };
  V13.eyes({ label:'THE DRIVER', watchers:[R.ereba], radius:5.6, fov:1.3, rate:1.0, decay:0.2, onMade:()=>{ if(R.shot) endWindow('made'); } });
  // he looks up and down the crescent while the back door is open
  let look = 0;
  R.anims.push((dt, playing)=>{
    const S_ = R.shot; if(!S_) { viewfinder(false); return false; }
    if(!playing) return;
    look -= dt; if(look <= 0 && !(R.movers || []).some(m => m.ch === R.ereba)){ look = 1.6 + Math.random() * 1.4; faceTo(R.ereba, streetSide() + (Math.random() - 0.5) * 1.8); }
    S_.left -= dt * rate();                                                    // Action pace (0 = timed sequences off: no limit)
    const d = V13.dist(R.ereba), inRange = d < 19, aim = inRange && aimed(R.ereba, 0.2), behind = aim && hidden(R.ereba), on = aim && !behind;
    // the third-person camera always looks down a little: aim is left-right only, and the frame follows him up and down
    let top = null;
    if(ENGINE.camera){
      const p = V3(R.ereba.position.x, 1.3, R.ereba.position.z).project(ENGINE.camera);
      if(p.z > -1 && p.z < 1){ const H = innerHeight, h2 = Math.min(0.22 * innerWidth, 190) / 2; top = Math.max(h2 + 8, Math.min(H - h2 - 40, (1 - p.y) / 2 * H)); }
    }
    viewfinder(inRange, on, inRange ? (on ? 'HOLD STEADY' : behind ? 'BEHIND THE CAR' : 'FIND HIM') : 'TOO FAR', top);
    S_.t = on ? S_.t + dt : Math.max(0, S_.t - dt * 0.8);
    if(typeof showMeter === 'function') showMeter('c13bereba', 'PHOTO — GODWIN EREBA', S_.t / S_.need, on ? 'good' : 'info', Math.ceil(Math.max(0, S_.left)) + 's');
    if(S_.t >= S_.need){ endWindow('photo'); return false; }
    if(S_.left <= 0){ endWindow('gone'); return false; }
  });
}
/* is he in the middle of the frame (left-right: in a third-person camera nobody aims up and down) */
function aimed(ch, cone){
  const cam = ENGINE.camera; if(!cam) return false;
  const f = new THREE.Vector3(); cam.getWorldDirection(f);
  const dx = ch.position.x - cam.position.x, dz = ch.position.z - cam.position.z;
  const a = Math.atan2(dx, dz) - Math.atan2(f.x, f.z);
  return Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < cone;
}
/* is the Prado between the lens and his face (its body and its tinted glass; not its headlamp glow or the light pool) */
let RAY = null;
function hidden(ch){
  const R = RT(), cam = ENGINE.camera, v = R.suv; if(!cam || !v || !v.visible) return false;
  if(!R.suvSolids){
    R.suvSolids = [];
    v.traverse(m => { if(!m.isMesh || !m.visible) return; const ms = Array.isArray(m.material) ? m.material : [m.material]; if(ms.some(x => !x || x.blending === THREE.AdditiveBlending)) return; R.suvSolids.push(m); });
  }
  RAY = RAY || new THREE.Raycaster();
  const to = V3(ch.position.x, 1.3, ch.position.z), d = cam.position.distanceTo(to);
  RAY.set(cam.position, to.sub(cam.position).normalize()); RAY.far = d;
  return RAY.intersectObjects(R.suvSolids, false).length > 0;
}
function endWindow(how){
  const R = RT(); if(!R.shot) return;
  R.shot = null; viewfinder(false); V13.eyesOff();
  if(typeof hideMeter === 'function') hideMeter('c13bereba');
  if(how === 'photo'){
    flash();
    V13.ev('ereba_photo', 'Godwin Ereba at the gate', 'good', 60);
    S.game.evQ.ereba_photo = 'good';
    V13.done('o13b_ereba');
    later(R, 900, ()=>radio(SAYS.got, 3800));
  } else {
    S.game.objectives = (S.game.objectives || []).filter(o => o.id !== 'o13b_ereba'); if(typeof renderObjectives === 'function') renderObjectives();
    if(how === 'made'){ faceTo(R.ereba, Math.atan2(ENGINE.player.position.x - R.ereba.position.x, ENGINE.player.position.z - R.ereba.position.z)); radio(SAYS.made, 4200); }
    else radio('He\'s getting back in, sir. Too late for his face.', 3200);
  }
  // he shuts the door, gets back in, and the Prado rolls through the gate
  later(R, how === 'made' ? 1200 : 1600, ()=>{
    const v = R.suv;
    walk(R.ereba, [bySuv(1.35, 2.9), bySuv(-1.3, 2.9), bySuv(-1.25, -0.45)], { speed:1.6, end:'idle' }).then(()=>{
      if(!alive(R)) return;
      R.ereba.visible = false;
      try{ VEH.setDoors(v, 0); }catch(e){}
      walk(v, [[-4.2, 1.4], [-6.0, 1.05], [-9.0, 1.0], [-12.5, 1.0]], { car:true, speed:3.0 }).then(()=>{
        if(!alive(R)) return;
        v.visible = false; gate(false);
        later(R, 1600, afterCar);
      });
    });
  });
}

/* ---------- 23:14: the green Peugeot, the book, the end ---------- */
function afterCar(){
  const R = RT();
  V13.done('o13b_gate');
  ENGINE.movementEnabled = false;
  if(R.seat){ R.seat.locked = true; }
  const sa = A('suv_arrive') || { x:2, z:26 };
  R.saloon = car('sedan', '#2f5a3c', [sa.x, sa.z + 4], 0, true);              // the DG's small green Peugeot
  shot('street', true);
  R.onLine = l => {
    const t = l.text || '';
    if(/^23:14/.test(t) && R.saloon && !R.saloonGo){
      R.saloonGo = true;
      let opened = false;
      R.anims.push(()=>{ if(!opened && R.saloon.position.z < 13){ opened = true; gate(true); } return !opened; });
      walk(R.saloon, [[2.0, 18.0], [0.4, 8.0], [-2.2, 2.6], [-4.6, 1.2], [-8.0, 1.0], [-12.5, 1.0]], { car:true, speed:6.5 }).then(()=>{
        if(!alive(R)) return; R.saloon.visible = false; gate(false);
      });
      return;
    }
    if(/licks his pencil/.test(t)){ shot('gatehouse', true); R.bitrus.visible = true; V13.once(R.bitrus, 'interact', 'sit'); return; }
    if(l.speaker === UCHE || /KELECHI/.test(l.speaker || '')) shot('gate');
  };
  later(R, 700, ()=>V13.say('m13b_end', ()=>{
    R.onLine = null;
    hum(false);
    if(V13.recruitFromFlags) V13.recruitFromFlags();
    V13.finish('m13b');
  }));
}
})();
