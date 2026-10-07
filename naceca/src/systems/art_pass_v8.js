/* ---------------- third-person camera ----------------
   Slightly above and behind Kelechi with a shoulder offset so the view ahead
   stays clear. Smooth follow, wall collision (snaps in, eases out), a gentle
   re-centre behind him while he moves, and an override used to frame
   interactions. Wider lens in portrait so phones see the room. */
const TPCAM = { pos:null, look:null, dist:3.5, height:0.0, lookH:1.45, shoulder:0.38, override:null, solids:null, solidsScene:null, cur:null, fov:55 };
function setCameraSolids(list){ TPCAM.solids = list; TPCAM.solidsScene = ENGINE.scene; }
function updateCamera(){
  if(!ENGINE.player || !ENGINE.camera) return;
  if(!ENGINE.player.userData._skinned) return updateCameraLegacy();
  const cam = ENGINE.camera, p = ENGINE.player.position;
  const dt = Math.min(0.05, ENGINE._dt || 0.016);
  if(!TPCAM.pos){ TPCAM.pos = new THREE.Vector3(); TPCAM.look = new THREE.Vector3(); TPCAM._ray = new THREE.Raycaster(); TPCAM._v = new THREE.Vector3(); TPCAM._d = new THREE.Vector3(); TPCAM._piv = new THREE.Vector3(); }
  // auto re-centre behind the player while moving (not while the player is steering the camera)
  const sinceDrag = performance.now() - (ENGINE._lastCamDrag || 0);
  const moving = (ENGINE.player.userData._speed || 0) > 0.5;
  if(moving && sinceDrag > 1400 && !ENGINE.seq){
    let d = ENGINE.playerYaw - ENGINE.cameraYaw; while(d > Math.PI) d -= Math.PI*2; while(d < -Math.PI) d += Math.PI*2;
    if(Math.abs(d) < 2.4) ENGINE.cameraYaw += d * Math.min(1, dt*1.1);
  }
  const yaw = ENGINE.cameraYaw, pitch = Math.max(-0.05, Math.min(0.95, ENGINE.playerPitch));
  const fx = Math.sin(yaw), fz = Math.cos(yaw);          // view direction on the ground
  const rx = -Math.cos(yaw), rz = Math.sin(yaw);         // screen-right
  const portrait = innerHeight > innerWidth;
  const dist = TPCAM.dist * (portrait ? 1.08 : 1);
  const sh = TPCAM.shoulder * (portrait ? 0.55 : 1);
  const piv = TPCAM._piv.set(p.x + rx*sh, p.y + TPCAM.lookH, p.z + rz*sh);
  let want = TPCAM._v.set(piv.x - fx*Math.cos(pitch)*dist, piv.y + Math.sin(pitch)*dist + 0.25, piv.z - fz*Math.cos(pitch)*dist);
  // collision: pull in front of walls. The mansion registers its own blockers;
  // older scenes use the solid boxes gathered by the legacy camera.
  let solids = null;
  if(TPCAM.solids && TPCAM.solidsScene === ENGINE.scene) solids = TPCAM.solids;
  else if(typeof gatherCameraSolids === 'function'){ if(_camRay.scene !== ENGINE.scene) gatherCameraSolids(); solids = _camRay.solids; }
  if(solids && solids.length){
    // three rays (centre + either side) act like a fat probe so door frames don't clip the lens
    const dir = TPCAM._d.copy(want).sub(piv); const L = dir.length(); dir.normalize();
    let best = L + 0.3; const o = TPCAM._o || (TPCAM._o = new THREE.Vector3());
    for(const off of [0, -0.3, 0.3]){
      o.set(piv.x + rx*off, piv.y, piv.z + rz*off);
      TPCAM._ray.set(o, dir); TPCAM._ray.far = L + 0.3;
      const hit = TPCAM._ray.intersectObjects(solids, false)[0];
      if(hit && hit.distance < best) best = hit.distance;
    }
    if(best < L + 0.3){
      const k = Math.max(0.55, best - 0.32);
      want = TPCAM._v.copy(piv).addScaledVector(dir, k);
      want.y += (L - k) * 0.55;                    // rise over the obstacle instead of staring into it
    }
  }
  if(ENGINE.ceilingY !== undefined && ENGINE.inside && ENGINE.inside(p)) want.y = Math.min(want.y, ENGINE.ceilingY - 0.18);
  let lookAt = TPCAM._look2 || (TPCAM._look2 = new THREE.Vector3());
  lookAt.set(piv.x + fx*1.6, p.y + TPCAM.lookH - 0.15 + Math.sin(pitch)*0.2, piv.z + fz*1.6);
  if(TPCAM.override){ want = TPCAM.override.pos; lookAt = TPCAM.override.look; }
  // smoothing: snap in quickly when the wall pushes us, ease everywhere else
  if(!TPCAM.cur){ TPCAM.pos.copy(want); TPCAM.look.copy(lookAt); TPCAM.cur = true; }
  const k = 1 - Math.exp(-dt * (TPCAM.override ? 5 : 10));
  TPCAM.pos.lerp(want, k); TPCAM.look.lerp(lookAt, 1 - Math.exp(-dt * (TPCAM.override ? 5 : 14)));
  cam.position.copy(TPCAM.pos); cam.lookAt(TPCAM.look);
  const fov = portrait ? 68 : 55;
  if(Math.abs(cam.fov - fov) > 0.1){ cam.fov += (fov - cam.fov) * Math.min(1, dt*6); cam.updateProjectionMatrix(); }
  if(typeof applyShake==='function') applyShake();
}
function resetCameraFollow(){ TPCAM.cur = null; TPCAM.override = null; }


/* =========================================================================
   NACECA · systems/mansion_art.js
   The Lekki mansion living room (M3). Geometry and baked lighting come from
   an offline Blender pass (lightmap in uv2); surface detail is painted here
   on canvases so the textures cost nothing in file size.
   ========================================================================= */
const MANSION = { gltf:null, lm:null, lmMax:1, ready:false, tex:{}, mats:{}, _p:null };
function _rng(seed){ let s = seed >>> 0; return ()=>{ s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ t>>>15, t|1); t ^= t + Math.imul(t ^ t>>>7, t|61); return ((t ^ t>>>14) >>> 0) / 4294967296; }; }
function _cv(w,h){ const c=document.createElement('canvas'); c.width=w; c.height=h; return [c, c.getContext('2d')]; }
function _tex(c, repeat){ const t = new THREE.CanvasTexture(c); t.flipY = false; t.encoding = THREE.sRGBEncoding;
  if(repeat){ t.wrapS = t.wrapT = THREE.RepeatWrapping; } t.anisotropy = 4; return t; }
function _noise(x, w, h, amt, alpha, seed, size){ const r=_rng(seed); size=size||2;
  for(let i=0;i<amt;i++){ const v = r()<0.5 ? 0 : 255; x.fillStyle=`rgba(${v},${v},${v},${alpha*r()})`; x.fillRect(r()*w, r()*h, size, size); } }
const MTEX = {
  marble(){ // 4x4 large tiles over one repeat (3.2 m), polished warm grey-beige with veins
    const S=1024, [c,x]=_cv(S,S), r=_rng(11);
    for(let ty=0;ty<4;ty++) for(let tx=0;tx<4;tx++){
      const x0=tx*256, y0=ty*256, b=176+r()*16|0;
      const g=x.createLinearGradient(x0,y0,x0+256,y0+256);
      g.addColorStop(0,`rgb(${b},${b-6},${b-16})`); g.addColorStop(1,`rgb(${b-10},${b-16},${b-26})`);
      x.fillStyle=g; x.fillRect(x0,y0,256,256);
      x.save(); x.beginPath(); x.rect(x0,y0,256,256); x.clip();
      for(let v=0;v<6;v++){ x.strokeStyle=`rgba(96,88,78,${0.14+r()*0.22})`; x.lineWidth=0.6+r()*1.6; x.beginPath();
        let px=x0+r()*256, py=y0-10; x.moveTo(px,py);
        for(let k=0;k<14;k++){ px+= (r()-0.35)*40; py+= 22+r()*10; x.lineTo(px,py); } x.stroke(); }
      for(let v=0;v<3;v++){ x.strokeStyle=`rgba(255,250,240,${0.12+r()*0.12})`; x.lineWidth=0.8; x.beginPath(); let px=x0+r()*256, py=y0; x.moveTo(px,py);
        for(let k=0;k<10;k++){ px+=(r()-0.5)*50; py+=28; x.lineTo(px,py);} x.stroke(); }
      x.restore();
    }
    _noise(x,S,S,9000,0.05,12,1.5);
    x.fillStyle='rgba(70,60,50,0.55)'; for(let i=0;i<=4;i++){ x.fillRect(i*256-1,0,2,S); x.fillRect(0,i*256-1,S,2); }
    return _tex(c,true);
  },
  plaster(){ const S=512,[c,x]=_cv(S,S); x.fillStyle='#d2c0a3'; x.fillRect(0,0,S,S); _noise(x,S,S,14000,0.05,21,2); _noise(x,S,S,400,0.03,22,14); return _tex(c,true); },
  ceiling(){ const S=256,[c,x]=_cv(S,S); x.fillStyle='#ece5d8'; x.fillRect(0,0,S,S); _noise(x,S,S,3000,0.03,23,2); return _tex(c,true); },
  facade(){ const S=512,[c,x]=_cv(S,S); x.fillStyle='#ddd0b6'; x.fillRect(0,0,S,S); _noise(x,S,S,12000,0.06,24,2);
    x.fillStyle='rgba(90,75,55,0.12)'; for(let y=0;y<S;y+=128) x.fillRect(0,y,S,2); return _tex(c,true); },
  wood(dark){ const W=256,H=512,[c,x]=_cv(W,H), r=_rng(dark?31:32);
    x.fillStyle = dark ? '#3e2617' : '#4b2d1b'; x.fillRect(0,0,W,H);
    for(let i=0;i<70;i++){ const xx=r()*W, w=0.6+r()*2.4; x.strokeStyle=`rgba(${r()<0.5?20:110},${r()<0.5?10:70},${r()<0.5?5:40},${0.15+r()*0.25})`; x.lineWidth=w;
      x.beginPath(); x.moveTo(xx,0); let px=xx; for(let y=0;y<=H;y+=16){ px+= (r()-0.5)*3; x.lineTo(px,y);} x.stroke(); }
    _noise(x,W,H,3000,0.05,33,1.5); return _tex(c,true); },
  velvet(){ const S=256,[c,x]=_cv(S,S); x.fillStyle='#22305a'; x.fillRect(0,0,S,S); _noise(x,S,S,6000,0.06,41,2);
    const g=x.createLinearGradient(0,0,S,S); g.addColorStop(0,'rgba(255,255,255,0.04)'); g.addColorStop(0.5,'rgba(0,0,0,0.05)'); g.addColorStop(1,'rgba(255,255,255,0.03)'); x.fillStyle=g; x.fillRect(0,0,S,S); return _tex(c,true); },
  cushionGold(){ const S=256,[c,x]=_cv(S,S); x.fillStyle='#b8913c'; x.fillRect(0,0,S,S);
    x.strokeStyle='rgba(30,40,80,0.55)'; x.lineWidth=5; for(let i=-S;i<S*2;i+=36){ x.beginPath(); x.moveTo(i,0); x.lineTo(i+S,S); x.stroke(); x.beginPath(); x.moveTo(i,S); x.lineTo(i+S,0); x.stroke(); }
    _noise(x,S,S,3000,0.06,42,2); return _tex(c,true); },
  rug(){ const W=1024,H=800,[c,x]=_cv(W,H), r=_rng(51);
    x.fillStyle='#2c3b62'; x.fillRect(0,0,W,H);
    // distressed pale field with navy motifs (like a vintage-wash rug)
    x.fillStyle='#c9c3b3'; x.fillRect(60,60,W-120,H-120);
    for(let i=0;i<260;i++){ x.fillStyle=`rgba(44,59,98,${0.25+r()*0.5})`; const w=20+r()*90, h=6+r()*30; x.fillRect(80+r()*(W-200), 80+r()*(H-200), w, h); }
    x.strokeStyle='#2c3b62'; x.lineWidth=14; x.strokeRect(100,100,W-200,H-200); x.lineWidth=4; x.strokeRect(128,128,W-256,H-256);
    x.fillStyle='rgba(185,145,70,0.7)'; for(let i=0;i<24;i++){ const a=i/24*Math.PI*2; x.beginPath(); x.arc(W/2+Math.cos(a)*170,H/2+Math.sin(a)*120,10,0,7); x.fill(); }
    _noise(x,W,H,30000,0.12,52,2); return _tex(c,false); },
  marbleDark(){ const S=512,[c,x]=_cv(S,S), r=_rng(61); x.fillStyle='#1d1c1a'; x.fillRect(0,0,S,S);
    for(let v=0;v<16;v++){ x.strokeStyle=`rgba(230,225,215,${0.08+r()*0.25})`; x.lineWidth=0.5+r()*1.5; x.beginPath(); let px=r()*S,py=0; x.moveTo(px,py); for(let k=0;k<20;k++){ px+=(r()-0.5)*40; py+=S/20; x.lineTo(px,py);} x.stroke(); }
    return _tex(c,true); },
  leather(){ const S=256,[c,x]=_cv(S,S); x.fillStyle='#55301b'; x.fillRect(0,0,S,S); _noise(x,S,S,8000,0.08,71,2); return _tex(c,true); },
  art(){ const W=512,H=640,[c,x]=_cv(W,H);
    x.fillStyle='#e9e1cf'; x.fillRect(0,0,W,H);
    const tri=(pts,col)=>{ x.fillStyle=col; x.beginPath(); x.moveTo(...pts[0]); for(const p of pts.slice(1)) x.lineTo(...p); x.closePath(); x.fill(); };
    tri([[0,0],[300,0],[120,360]],'#1f6b4f'); tri([[512,0],[512,420],[250,180]],'#d8a64a'); tri([[0,640],[0,300],[280,520]],'#1b2747');
    tri([[512,640],[200,640],[420,330]],'#2a8a63'); tri([[120,360],[250,180],[300,420]],'#f0c878'); tri([[280,520],[420,330],[300,420]],'#0f1830');
    x.strokeStyle='rgba(20,20,20,0.8)'; x.lineWidth=6; x.beginPath(); x.arc(256,330,120,0.3,2.6); x.stroke();
    _noise(x,W,H,6000,0.08,81,2); return _tex(c,false); },
  art2(){ const W=640,H=440,[c,x]=_cv(W,H);
    x.fillStyle='#e6d9bf'; x.fillRect(0,0,W,H);
    x.fillStyle='#b5532c'; x.beginPath(); x.arc(220,240,150,0,7); x.fill();
    x.fillStyle='#1c1a18'; x.beginPath(); x.arc(390,190,110,0,7); x.fill();
    x.fillStyle='#d8a64a'; x.beginPath(); x.arc(470,300,70,0,7); x.fill();
    x.strokeStyle='#e6d9bf'; x.lineWidth=10; x.beginPath(); x.moveTo(60,380); x.bezierCurveTo(200,260,380,420,600,90); x.stroke();
    x.fillStyle='rgba(30,40,70,0.85)'; x.fillRect(80,60,90,90);
    _noise(x,W,H,5000,0.08,82,2); return _tex(c,false); },
  books(){ const W=1024,H=256,[c,x]=_cv(W,H), r=_rng(91);
    const cols=['#5a1f1b','#1d2f52','#2f4a2c','#6b4a23','#20201f','#7a6a4a','#3b2a4f','#8a2b22','#d7c9a7','#14324a'];
    let px=0; while(px<W){ const w=10+r()*22, h=H*(0.72+r()*0.28); const col=cols[r()*cols.length|0];
      x.fillStyle='#0e0b09'; x.fillRect(px,0,w,H); x.fillStyle=col; x.fillRect(px+1,H-h,w-2,h);
      x.fillStyle='rgba(216,166,74,0.8)'; if(r()<0.6){ x.fillRect(px+2,H-h+10,w-4,3); x.fillRect(px+2,H-h+18,w-4,2);} 
      x.fillStyle='rgba(255,255,255,0.08)'; x.fillRect(px+2,H-h,2,h); px+=w; }
    return _tex(c,false); },
  stone(){ const S=512,[c,x]=_cv(S,S), r=_rng(101); for(let ty=0;ty<4;ty++) for(let tx=0;tx<4;tx++){ const b=150+r()*24|0; x.fillStyle=`rgb(${b},${b-6},${b-14})`; x.fillRect(tx*128,ty*128,128,128);} _noise(x,S,S,12000,0.08,102,2);
    x.fillStyle='rgba(40,35,30,0.6)'; for(let i=0;i<=4;i++){ x.fillRect(i*128-1,0,2,S); x.fillRect(0,i*128-1,S,2);} return _tex(c,true); },
  paving(){ const S=512,[c,x]=_cv(S,S), r=_rng(111); x.fillStyle='#6a645d'; x.fillRect(0,0,S,S);
    for(let y=0;y<S;y+=64) for(let xx=(y/64%2)*32; xx<S; xx+=64){ const b=90+r()*30|0; x.fillStyle=`rgb(${b},${b-4},${b-8})`; x.fillRect(xx+2,y+2,60,60);} _noise(x,S,S,9000,0.07,112,2); return _tex(c,true); },
  hedge(){ const S=256,[c,x]=_cv(S,S), r=_rng(121); x.fillStyle='#203a26'; x.fillRect(0,0,S,S); for(let i=0;i<2500;i++){ const g=50+r()*70|0; x.fillStyle=`rgba(${g*0.45|0},${g},${g*0.5|0},0.7)`; x.beginPath(); x.arc(r()*S,r()*S,1+r()*3,0,7); x.fill(); } return _tex(c,true); },
  runner(){ const S=256,[c,x]=_cv(S,S); x.fillStyle='#5a2a24'; x.fillRect(0,0,S,S); x.strokeStyle='rgba(216,166,74,0.5)'; x.lineWidth=6; x.strokeRect(14,14,S-28,S-28); _noise(x,S,S,6000,0.1,131,2); return _tex(c,true); },
  cash(){ const S=128,[c,x]=_cv(S,S); x.fillStyle='#7b8f5e'; x.fillRect(0,0,S,S); x.fillStyle='#c9d1b0'; x.fillRect(0,48,S,32); x.fillStyle='#3d5a2a'; for(let i=0;i<S;i+=6) x.fillRect(i,0,2,S); return _tex(c,true); },
  photo(){ const S=128,[c,x]=_cv(S,S); x.fillStyle='#6a5a48'; x.fillRect(0,0,S,S); x.fillStyle='#e8dcc0'; x.fillRect(10,10,108,108); x.fillStyle='#8a6a40'; x.beginPath(); x.arc(64,52,22,0,7); x.fill(); x.fillStyle='#d8a64a'; x.fillRect(30,80,68,30); return _tex(c,false); },
  skyline(){ const W=2048,H=512,[c,x]=_cv(W,H), r=_rng(141);
    const g=x.createLinearGradient(0,0,0,H); g.addColorStop(0,'#05070f'); g.addColorStop(0.55,'#0b1428'); g.addColorStop(0.82,'#2a2338'); g.addColorStop(1,'#4a2f2a'); x.fillStyle=g; x.fillRect(0,0,W,H);
    for(let layer=0;layer<3;layer++){
      let px=0; while(px<W){ const w=30+r()*90, h=(layer===0?60:layer===1?120:180)*(0.4+r()*1.2)+ (r()<0.06?160:0); const top=H*0.86-h*(1-layer*0.15);
        x.fillStyle=['#0c1222','#0a0f1c','#070a14'][layer]; x.fillRect(px,top,w,H-top);
        for(let wy=top+6; wy<H*0.86; wy+=9) for(let wx=px+4; wx<px+w-4; wx+=7){ if(r()<0.38){ const warm=r()<0.75; x.fillStyle= warm ? `rgba(255,${190+r()*40|0},${110+r()*40|0},${0.35+r()*0.6})` : `rgba(160,200,255,${0.3+r()*0.5})`; x.fillRect(wx,wy,3,4);} }
        if(r()<0.1){ x.fillStyle='rgba(255,60,60,0.9)'; x.fillRect(px+w/2,top-6,3,3); }
        px+=w+r()*6; }
    }
    const hz=x.createLinearGradient(0,H*0.7,0,H); hz.addColorStop(0,'rgba(255,140,70,0)'); hz.addColorStop(1,'rgba(255,140,70,0.25)'); x.fillStyle=hz; x.fillRect(0,H*0.7,W,H*0.3);
    return _tex(c,false); },
  water(){ const W=256,H=1024,[c,x]=_cv(W,H), r=_rng(151); x.fillStyle='#050a14'; x.fillRect(0,0,W,H);
    for(let i=0;i<500;i++){ const warm=r()<0.8; x.fillStyle= warm?`rgba(255,180,100,${r()*0.35})`:`rgba(150,190,255,${r()*0.3})`; x.fillRect(r()*W, r()*H, 1+r()*2, 6+r()*30); } return _tex(c,false); },
};
const MDEF = {
  floor_marble:{t:'marble'}, wall_plaster:{t:'plaster'}, ceiling:{t:'ceiling'}, wood_dark:{t:'wood', a:true}, wood_trim:{t:'wood'},
  velvet_navy:{t:'velvet'}, cushion_gold:{t:'cushionGold'}, cushion_cream:{c:'#d9cdb4'}, rug:{t:'rug'}, marble_dark:{t:'marbleDark'}, brass:{c:'#b8903e'},
  leather:{t:'leather'}, art2:{t:'art2'}, plain:{vc:true}, plant:{c:'#2f5c34'}, pot_white:{c:'#ddd7cc'}, art:{t:'art'}, books:{t:'books'}, metal_black:{c:'#212328'}, curtain:{c:'#d6c8a8'},
  facade:{t:'facade'}, stone_porch:{t:'stone'}, paving:{t:'paving'}, hedge:{t:'hedge'}, car_navy:{c:'#1b2748'}, car_white:{c:'#dedfdb'}, tire:{c:'#151515'},
  car_glass:{c:'#0f141c'}, safe:{c:'#2e3036'}, paper:{c:'#ece7dc'}, ceramic_dark:{c:'#2f3b46'}, palm:{c:'#36612e'}, trunk:{c:'#5e4834'}, water:{c:'#ffffff'},
  cash:{t:'cash'}, laptop_body:{c:'#a6aab0'}, runner:{t:'runner'}, lamp_base:{c:'#dfd8cb'}, photo:{t:'photo'}, chrome:{c:'#bfc3c9'},
};
const MGLOW = { lampshade:'#ffe4bd', sconce_glow:'#ffdcae', downlight:'#fff6e4', lantern_glow:'#ffd89c', street_glow:'#ffb565', police_red:'#ff2a36', police_blue:'#2f6bff' };
MANSION.texture = function(name){ if(!MANSION.tex[name]){ const f = name==='woodTrim' ? ()=>MTEX.wood(false) : (name==='wood' ? ()=>MTEX.wood(true) : MTEX[name]); MANSION.tex[name] = f(); } return MANSION.tex[name]; };
MANSION.load = function(src){
  if(MANSION._p) return MANSION._p;
  src = src || { glb:ART_INLINE.mansion_glb, lightmap:ART_INLINE.mansion_lm, lmMax:ART_INLINE.mansion_lm_max };
  MANSION._p = (async ()=>{
    const buf = _b64ToBuf(src.glb);
    if(typeof MeshoptDecoder !== 'undefined' && MeshoptDecoder.ready) await MeshoptDecoder.ready;
    const loader = new THREE.GLTFLoader(); if(typeof MeshoptDecoder !== 'undefined') loader.setMeshoptDecoder(MeshoptDecoder);
    MANSION.gltf = await new Promise((res,rej)=>loader.parse(buf,'',res,rej));
    MANSION.lm = await new Promise((res,rej)=>new THREE.TextureLoader().load(src.lightmap,res,undefined,rej));
    MANSION.lm.flipY = false; MANSION.lm.encoding = THREE.sRGBEncoding;
    MANSION.lmMax = src.lmMax || 1; MANSION.ready = true; return MANSION;
  })(); return MANSION._p;
};
MANSION._baked = function(name){
  if(MANSION.mats[name]) return MANSION.mats[name];
  const d = MDEF[name] || { c:'#888888' };
  const m = new THREE.MeshBasicMaterial({ color: d.c ? new THREE.Color(d.c) : 0xffffff, map: d.t ? MANSION.texture(d.t) : null, lightMap: MANSION.lm, lightMapIntensity: MANSION.lmMax, vertexColors: !!d.vc });
  if(d.c && d.t) m.color = new THREE.Color(d.c);
  return (MANSION.mats[name] = m);
};
/* builds a fresh instance; returns {root, dyn:{name:mesh}} */
MANSION.instantiate = function(){
  const root = MANSION.gltf.scene.clone(true);
  const dyn = {};
  root.traverse(o=>{
    if(!o.isMesh) return;
    const mn = o.material && o.material.name || '';
    if(o.geometry.attributes.uv2){                     // baked room
      o.material = MANSION._baked(mn); o.castShadow = false; o.receiveShadow = false; o.matrixAutoUpdate = false; o.updateMatrix();
      return;
    }
    dyn[o.name] = o;
    if(mn === 'glow'){ o.material = new THREE.MeshBasicMaterial({ vertexColors:true, toneMapped:false }); o.material.color.setScalar(1.6); }
    else if(MGLOW[mn]) o.material = new THREE.MeshBasicMaterial({ color: new THREE.Color(MGLOW[mn]).multiplyScalar(mn.startsWith('police')?1:1.6), toneMapped:false });
    else if(mn === 'glass') o.material = new THREE.MeshBasicMaterial({ color:'#7f97bd', transparent:true, opacity:0.08, depthWrite:false, side:THREE.DoubleSide });
    else if(mn === 'skyline'){ o.material = new THREE.MeshBasicMaterial({ map: MANSION.texture('skyline'), toneMapped:false, fog:false }); }
    else if(mn === 'water'){ o.material = new THREE.MeshBasicMaterial({ map: MANSION.texture('water'), toneMapped:false, fog:false }); }
    else if(mn === 'screen'){ o.material = new THREE.MeshBasicMaterial({ color:'#ffffff', toneMapped:false }); }
    else {
      const d = MDEF[mn] || { c:'#888888' };
      o.material = new THREE.MeshStandardMaterial({ color: d.c ? new THREE.Color(d.c) : 0xffffff, map: d.t ? MANSION.texture(d.t) : null, roughness:0.7,
        metalness: (mn==='chrome'||mn==='safe')?0.4:0, flatShading: !o.geometry.attributes.normal });
      o.castShadow = true;
    }
  });
  // multi-material nodes load as a Group of primitives: expose the node itself by name
  for(const n of root.children[0] && root.children[0].isScene ? root.children[0].children : root.children){ if(n.name) dyn[n.name] = dyn[n.name] && dyn[n.name].isMesh && !n.isMesh ? n : (dyn[n.name] || n); }
  root.traverse(n=>{ if(n.isGroup && n.name && /^(SafeDoor|Drawer|Laptop|CashTable)$/.test(n.name)) dyn[n.name] = n; });
  return { root, dyn };
};


/* =========================================================================
   NACECA · systems/vehicles_paint.js (v10)
   Paints the one shared vehicle atlas (1024 x 2048) at load: side liveries
   for every body, front/rear "faces" (grilles, lamps, plates, tailgates),
   rims, the taxi sign, plates and colour swatches. The layout mirrors
   vehlib.py, which decided every UV in Blender.
   Side rects map vehicle space: s = (y + L/2)/L (right side; mirrored on the
   left), t = 1 - z/H. Fascias map s across the viewer's left->right,
   t from the top of the end panel down. Fascia pixels left transparent let
   the tinted body paint underneath show through.
   ========================================================================= */
const VEHPAINT = (function(){
  const AW = 1024, AH = 2048, SIDE_W = 512, SIDE_H = 128, FAS_W = 256, FAS_H = 128;
  const VARIANTS = ['pickupN','pickupP','vanN','vanP','sedan','suv','taxi','danfo','keke'];
  const sideRect = (v, side)=>{ const i = VARIANTS.indexOf(v)*2 + (side === 'R' ? 0 : 1); return [(i%2)*SIDE_W, ((i/2)|0)*SIDE_H]; };
  const fasRect = (v, end)=>{ const j = VARIANTS.indexOf(v)*2 + (end === 'F' ? 0 : 1); return [(j%4)*FAS_W, 1152 + ((j/4)|0)*FAS_H]; };
  const RIMS = { alloy5:0, alloy10:1, black6:2, steelcap:3, steel:4, spoke:5 };
  const SW = ['black','dgrey','grey','lgrey','chrome','white','red','amber','yellow','navy','gold','rubber','tan','brown','lens','blue','green','cream','seat','canvas','orange','silver','darkred','mirror'];
  const SWC = { black:'#0f1012', dgrey:'#2c2e32', grey:'#5d6066', lgrey:'#a7abb0', chrome:'#d0d4d8', white:'#ffffff', red:'#a01818', amber:'#e28a12', yellow:'#f2c20e',
    navy:'#1c2c78', gold:'#d8a64a', rubber:'#1b1b1b', tan:'#b08a5a', brown:'#6a4a2e', lens:'#d8dde0', blue:'#2a56a8', green:'#2e7a3a', cream:'#e8dcc0',
    seat:'#1e1e20', canvas:'#262626', orange:'#e06a1a', silver:'#a9adb2', darkred:'#6e1010', mirror:'#8fa0ae' };
  const MISC = { okplate:[512,1920,576,1952], kekeplate:[576,1920,640,1952], truckplate:[640,1920,704,1952], kekerear:[512,1952,640,2048], kekeside:[640,1952,768,2048], trucklamp:[704,1920,768,1952] };
  const TRUCK_SIDE = [0,1920,512,2048], TRUCK_F = [512,1664,768,1792], TRUCK_R = [768,1664,1024,1792], TAXI_SIGN = [768,1792,1024,1856];
  const FONT = (px, w)=>`${w||'bold'} ${px}px Oswald, Impact, 'Arial Narrow', sans-serif`;
  const NAVY = '#1d2b4e', GOLD = '#d4a24c', TAXI_Y = '#f0ac16', DANFO_Y = '#f0b00c', KEKE_Y = '#eea80c';

  /* ---------------------------------------------------------------- generic helpers */
  function rr(x, x0, y0, w, h, r){ x.beginPath(); x.moveTo(x0+r, y0); x.arcTo(x0+w, y0, x0+w, y0+h, r); x.arcTo(x0+w, y0+h, x0, y0+h, r); x.arcTo(x0, y0+h, x0, y0, r); x.arcTo(x0, y0, x0+w, y0, r); x.closePath(); }
  function grime(x, x0, y0, w, h, seed, amt, col){ const r = _rng(seed); for(let i=0;i<amt;i++){ x.fillStyle = col || `rgba(${60+r()*40|0},${50+r()*30|0},${35+r()*20|0},${0.04+r()*0.08})`; x.fillRect(x0 + r()*w, y0 + r()*h, 1 + r()*3, 1 + r()*2); } }
  /* a side panel drawn in vehicle metres. side 'R' or 'L'; L/H the body length/height */
  function sideCtx(x, v, side, L, H){
    const [x0, y0] = sideRect(v, side), kx = SIDE_W/L, ky = SIDE_H/H;
    const X = y=>x0 + (side === 'R' ? (y + L/2) : (L/2 - y))*kx, Y = z=>y0 + (1 - z/H)*SIDE_H;
    const S = { x, x0, y0, kx, ky, X, Y, side, L, H };
    S.clip = ()=>{ x.save(); x.beginPath(); x.rect(x0, y0, SIDE_W, SIDE_H); x.clip(); };
    S.fill = col=>{ x.fillStyle = col; x.fillRect(x0, y0, SIDE_W, SIDE_H); };
    S.band = (z0, z1, ya, yb, col)=>{ const a = X(ya), b = X(yb); x.fillStyle = col; x.fillRect(Math.min(a, b), Y(z1), Math.abs(b - a), Y(z0) - Y(z1)); };
    S.vline = (y, z0, z1, col, w)=>{ x.fillStyle = col || 'rgba(20,22,26,0.85)'; x.fillRect(X(y) - (w || 1.4)/2, Y(z1), w || 1.4, Y(z0) - Y(z1)); };
    S.hline = (z, ya, yb, col, w)=>{ const a = X(ya), b = X(yb); x.fillStyle = col || 'rgba(20,22,26,0.85)'; x.fillRect(Math.min(a, b), Y(z) - (w || 1.2)/2, Math.abs(b - a), w || 1.2); };
    S.handle = (y, z, col, w, h)=>{ w = (w || 0.13)*kx; h = Math.max(2.5, (h || 0.032)*ky); x.fillStyle = 'rgba(0,0,0,0.55)'; rr(x, X(y) - w/2 - 1, Y(z) - h/2 - 1, w + 2, h + 2, 2); x.fill(); x.fillStyle = col || '#b8bcc2'; rr(x, X(y) - w/2, Y(z) - h/2, w, h, 1.5); x.fill(); };
    S.circle = (y, z, r, col, stroke)=>{ x.save(); x.translate(X(y), Y(z)); x.scale(kx/ky, 1); x.beginPath(); x.arc(0, 0, r*ky, 0, 7); if(stroke){ x.strokeStyle = col; x.lineWidth = stroke; x.stroke(); } else { x.fillStyle = col; x.fill(); } x.restore(); };
    /* text at its true proportions on the body (the side rect is stretched differently in x and y) */
    S.text = (str, y, z, hM, col, opts)=>{ opts = opts || {}; x.save(); x.translate(X(y), Y(z)); x.scale(kx/ky, 1); x.font = (opts.font || FONT)(Math.max(4, hM*ky*1.3), opts.weight);
      x.textAlign = opts.align || 'center'; x.textBaseline = 'middle';
      if(opts.stroke){ x.lineWidth = opts.stroke; x.strokeStyle = opts.strokeCol || '#000'; x.strokeText(str, 0, 0); }
      x.fillStyle = col; x.fillText(str, 0, 0); x.restore(); };
    S.shield = (y, z, hM, fill, inner)=>{ x.save(); x.translate(X(y), Y(z)); x.scale(kx/ky, 1); shield(x, 0, 0, hM*ky/84, fill, inner); x.restore(); };
    S.shade = (z0, z1, a)=>{ const g = x.createLinearGradient(0, Y(z0), 0, Y(z1)); g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(x0, Y(z1), SIDE_W, Y(z0) - Y(z1)); };
    return S;
  }
  /* an end panel drawn in viewer metres: u from the viewer's left edge, v from the top edge */
  function fasCtx(x, rect, W, Hf){
    const [x0, y0] = rect, kx = FAS_W/W, ky = FAS_H/Hf;
    const F = { x, x0, y0, kx, ky, W, Hf, U: u=>x0 + u*kx, V: v=>y0 + v*ky };
    F.clear = ()=>x.clearRect(x0, y0, FAS_W, FAS_H);
    F.fill = col=>{ x.fillStyle = col; x.fillRect(x0, y0, FAS_W, FAS_H); };
    F.rect = (u, v, w, h, col, r)=>{ x.fillStyle = col; if(r){ rr(x, F.U(u), F.V(v), w*kx, h*ky, r); x.fill(); } else x.fillRect(F.U(u), F.V(v), w*kx, h*ky); };
    F.sym = (u, v, w, h, col, r)=>{ F.rect(u, v, w, h, col, r); F.rect(W - u - w, v, w, h, col, r); };
    F.text = (str, u, v, hM, col, opts)=>{ opts = opts || {}; x.save(); x.translate(F.U(u), F.V(v)); x.scale(kx/ky, 1); x.font = (opts.font || FONT)(Math.max(4, hM*ky*1.3), opts.weight);
      x.textAlign = 'center'; x.textBaseline = 'middle'; if(opts.stroke){ x.lineWidth = opts.stroke; x.strokeStyle = opts.strokeCol || '#000'; x.strokeText(str, 0, 0); } x.fillStyle = col; x.fillText(str, 0, 0); x.restore(); };
    F.grad = (u, v, w, h, stops, r)=>{ const g = x.createLinearGradient(0, F.V(v), 0, F.V(v + h)); stops.forEach(([o, c])=>g.addColorStop(o, c)); F.rect(u, v, w, h, g, r); };
    F.ell = (u, v, ru, rv, col)=>{ x.beginPath(); x.ellipse(F.U(u), F.V(v), ru*kx, rv*ky, 0, 0, 7); x.fillStyle = col; x.fill(); };
    /* light rect in the builder's normalised fascia coords (s0,t0,s1,t1) */
    F.nrect = (n, col, r)=>F.rect(n[0]*W, n[1]*Hf, (n[2] - n[0])*W, (n[3] - n[1])*Hf, col, r);
    F.nr = n=>[n[0]*W, n[1]*Hf, (n[2] - n[0])*W, (n[3] - n[1])*Hf];
    return F;
  }
  /* Nigerian number plate: white, coloured characters (blue private, red commercial, green government).
     (px,py,pw,ph) is the plate's pixel box; ax = kx/ky of the panel it sits on (text keeps its true shape) */
  function plate(x, px, py, pw, ph, num, kind, state, ax){
    ax = ax || 1;
    const ink = kind === 'gov' ? '#1d6b33' : kind === 'com' ? '#b3161b' : '#1f3f9a';
    x.fillStyle = '#f4f4ee'; rr(x, px, py, pw, ph, Math.min(3, ph*0.15)); x.fill();
    x.strokeStyle = 'rgba(30,30,30,0.6)'; x.lineWidth = 1; x.stroke();
    x.save(); x.translate(px + pw/2, py); x.scale(ax, 1); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = ink;
    const wI = pw/ax;                        // the plate's width in isotropic pixels
    x.font = FONT(Math.max(4, ph*0.22), '600'); x.fillText(state || (kind === 'gov' ? 'FEDERAL REPUBLIC OF NIGERIA' : 'LAGOS'), 0, ph*0.2, wI*0.9);
    x.font = FONT(Math.max(5, ph*0.55)); x.fillText(num, 0, ph*0.62, wI*0.92);
    x.fillStyle = 'rgba(30,110,50,0.75)'; x.fillRect(-wI*0.46, ph*0.42, wI*0.06, ph*0.4);
    x.restore();
  }
  const fplate = (F, uC, v, num, kind, w, h)=>{ w = w || 0.36; h = h || 0.11; plate(F.x, F.U(uC - w/2), F.V(v), w*F.kx, h*F.ky, num, kind, null, F.kx/F.ky); };
  /* a round or square lamp unit: chrome bezel, reflector, lens */
  function lamp(F, u, v, w, h, kind){
    const x = F.x, X0 = F.U(u), Y0 = F.V(v), PW = w*F.kx, PH = h*F.ky, r = Math.min(PW, PH)*0.25;
    x.fillStyle = '#7d8288'; rr(x, X0, Y0, PW, PH, r); x.fill();
    let g;
    if(kind === 'head'){ g = x.createLinearGradient(X0, Y0, X0, Y0 + PH); g.addColorStop(0, '#f2f4f5'); g.addColorStop(0.5, '#c3c9ce'); g.addColorStop(1, '#8c949b'); }
    else if(kind === 'tail'){ g = x.createLinearGradient(X0, Y0, X0, Y0 + PH); g.addColorStop(0, '#d0201a'); g.addColorStop(0.55, '#8e0f0c'); g.addColorStop(1, '#5a0907'); }
    else { g = '#e8961e'; }
    x.fillStyle = g; rr(x, X0 + 1.2, Y0 + 1.2, PW - 2.4, PH - 2.4, r*0.8); x.fill();
    if(kind === 'head'){ x.fillStyle = 'rgba(255,255,255,0.75)'; x.beginPath(); x.ellipse(X0 + PW*0.5, Y0 + PH*0.5, PW*0.2, PH*0.28, 0, 0, 7); x.fill();
      x.fillStyle = 'rgba(120,128,136,0.6)'; x.beginPath(); x.ellipse(X0 + PW*0.5, Y0 + PH*0.5, PW*0.09, PH*0.13, 0, 0, 7); x.fill(); }
    if(kind === 'tail'){ x.fillStyle = 'rgba(255,255,255,0.18)'; x.fillRect(X0 + 2, Y0 + 2, PW - 4, Math.max(1, PH*0.12)); }
  }
  /* NACECA shield (same mark as the van livery in mtex) */
  function shield(x, cx, cy, s, fill, inner){
    const P = (k)=>{ x.beginPath(); x.moveTo(cx, cy - 40*k); x.lineTo(cx + 32*k, cy - 28*k); x.lineTo(cx + 32*k, cy + 4*k); x.quadraticCurveTo(cx + 32*k, cy + 30*k, cx, cy + 44*k); x.quadraticCurveTo(cx - 32*k, cy + 30*k, cx - 32*k, cy + 4*k); x.lineTo(cx - 32*k, cy - 28*k); x.closePath(); };
    x.fillStyle = fill; P(s); x.fill(); x.fillStyle = inner; P(s*0.8); x.fill();
    x.fillStyle = fill; x.font = FONT(Math.max(5, 36*s)); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('N', cx, cy + 4*s);
  }

  /* ---------------------------------------------------------------- side liveries */
  const SIDES = {
    sedan(S){ S.fill('#ffffff');
      S.shade(0.27, 0.46, 0.38); S.band(0.572, 0.598, -1.02, 1.02, '#2f3238'); S.hline(0.79, -2.2, 2.2, 'rgba(0,0,0,0.12)', 1);
      for(const [y, z0] of [[-1.02, 0.30], [-0.12, 0.30], [1.02, 0.42]]) S.vline(y, z0, 0.94, 'rgba(25,27,31,0.8)');
      S.handle(0.02, 0.86); S.handle(-0.90, 0.86);
      if(S.side === 'R') S.circle(-1.60, 0.84, 0.075, 'rgba(25,27,31,0.7)', 1.2);
    },
    taxi(S){ S.fill(TAXI_Y);
      S.shade(0.28, 0.44, 0.35);
      S.band(0.28, 0.325, -1.30, 1.05, '#26272a');
      S.band(0.632, 0.738, -2.04, 1.99, '#151515');
      S.band(0.468, 0.49, -0.95, -0.07, '#151515'); S.band(0.468, 0.49, -0.01, 0.92, '#151515');
      for(const [y, z0] of [[-0.98, 0.30], [-0.04, 0.30], [0.95, 0.42]]) S.vline(y, z0, 0.915, 'rgba(25,20,10,0.85)');
      S.handle(0.08, 0.785, '#161616'); S.handle(-0.80, 0.785, '#161616');
      if(S.side === 'R') S.circle(-1.40, 0.81, 0.07, 'rgba(25,20,10,0.75)', 1.2);
      S.band(0.775, 0.80, 1.84, 1.93, '#e08a1a');
      grime(S.x, S.x0, S.y0 + 70, SIDE_W, 58, 7101 + (S.side === 'R' ? 0 : 1), 260);
    },
    pickup(S, nacecaLivery){ S.fill(nacecaLivery ? NAVY : '#ffffff');
      S.shade(0.48, 0.66, nacecaLivery ? 0.25 : 0.32);
      for(const [y, z0] of [[-0.62, 0.50], [0.24, 0.50], [1.10, 0.50], [-2.62, 0.55]]) S.vline(y, z0, 1.16, 'rgba(10,12,16,0.85)');
      S.vline(-0.68, 0.55, 1.15, 'rgba(10,12,16,0.9)', 2.2);
      S.handle(0.40, 1.03, '#141414'); S.handle(-0.44, 1.03, '#141414');
      S.band(0.79, 0.83, 2.30, 2.40, '#e08a1a'); S.band(0.95, 0.99, -2.55, -2.47, '#b01818');
      if(nacecaLivery){
        S.band(1.098, 1.122, -2.64, 2.36, GOLD);
        S.text('NACECA', 0.67, 0.86, 0.15, GOLD);
      } else {
        S.text('OSARO & SONS · SITE 03', 0.62, 0.97, 0.05, '#2a2a2a');
        grime(S.x, S.x0, S.y0 + 64, SIDE_W, 64, 7301 + (S.side === 'R' ? 0 : 1), 420);
      }
    },
    van(S, nacecaLivery){ S.fill(nacecaLivery ? NAVY : '#ffffff');
      S.shade(0.36, 0.58, nacecaLivery ? 0.22 : 0.3);
      S.vline(0.49, 0.40, 1.995, 'rgba(10,12,16,0.85)'); S.vline(1.12, 0.62, 1.10, 'rgba(10,12,16,0.85)');
      S.handle(0.62, 1.02, '#1a1a1a');
      if(S.side === 'R'){ S.vline(-0.70, 0.40, 1.10, 'rgba(10,12,16,0.85)'); S.vline(0.42, 0.40, 1.10, 'rgba(10,12,16,0.85)'); S.hline(1.115, -0.70, -2.05, 'rgba(10,12,16,0.9)', 2.4); S.handle(0.30, 1.0, '#1a1a1a'); }
      else S.circle(-1.75, 1.0, 0.07, 'rgba(10,12,16,0.7)', 1.2);
      if(nacecaLivery){
        S.band(1.035, 1.058, -2.33, 2.20, GOLD);
        S.text('NACECA', S.side === 'R' ? -0.15 : -0.35, 0.80, 0.19, GOLD);
      } else {
        grime(S.x, S.x0, S.y0 + 60, SIDE_W, 68, 7401 + (S.side === 'R' ? 0 : 1), 520);
        grime(S.x, S.x0, S.y0 + 96, SIDE_W, 32, 7411, 300, 'rgba(90,70,45,0.12)');
      }
    },
    suv(S){ S.fill('#ffffff');
      S.shade(0.42, 0.62, 0.4);
      for(const [y, z0] of [[-1.22, 0.52], [-0.17, 0.52], [1.05, 0.62]]) S.vline(y, z0, 1.29, 'rgba(10,12,16,0.9)');
      S.handle(-0.02, 1.20, '#d8dce0'); S.handle(-1.08, 1.22, '#d8dce0');
      S.hline(0.80, -2.4, 2.4, 'rgba(0,0,0,0.18)', 1.2); S.hline(1.06, -2.3, 1.05, 'rgba(255,255,255,0.06)', 1);
      if(S.side === 'L') S.circle(-1.85, 1.16, 0.07, 'rgba(10,12,16,0.7)', 1.2);
    },
    danfo(S){ S.fill(DANFO_Y);
      S.shade(0.38, 0.56, 0.3);
      S.band(0.99, 1.075, -2.30, 2.30, '#141414'); S.band(0.655, 0.715, -2.30, 2.30, '#141414');
      S.vline(1.0, 0.70, 1.10, 'rgba(25,18,8,0.85)'); S.vline(2.05, 0.75, 1.10, 'rgba(25,18,8,0.85)'); S.handle(1.15, 0.95, '#2a2a2a');
      if(S.side === 'R'){
        // the sliding door is open: the dark doorway and its step
        S.band(0.36, 1.10, -0.42, 0.86, '#0f0f10'); S.band(0.36, 0.47, -0.40, 0.84, '#3a3a38'); S.band(0.47, 0.50, -0.40, 0.84, '#202020');
        S.vline(-0.42, 0.36, 1.10, '#2a2a2a', 2); S.vline(0.86, 0.36, 1.10, '#2a2a2a', 2);
      } else { S.vline(-0.42, 0.40, 1.10, 'rgba(25,18,8,0.8)'); S.vline(0.86, 0.40, 1.10, 'rgba(25,18,8,0.8)'); S.circle(-1.85, 0.92, 0.07, 'rgba(25,18,8,0.7)', 1.2); }
      S.text('OBALENDE · OSHODI', -1.45, 0.86, 0.075, '#141414');
      S.text('LAGOS', 1.52, 0.85, 0.06, '#141414');
      // rust, dents and road dirt
      const r = _rng(7701 + (S.side === 'R' ? 0 : 1));
      for(let i=0;i<14;i++){ const y = -2.1 + r()*4.2, z = 0.38 + r()*0.5, R_ = 0.03 + r()*0.08;
        S.x.save(); S.x.translate(S.X(y), S.Y(z)); S.x.scale(S.kx/S.ky, 1); const g = S.x.createRadialGradient(0, 0, 0, 0, 0, R_*S.ky*1.6);
        g.addColorStop(0, `rgba(${110+r()*40|0},${50+r()*20|0},${20},0.75)`); g.addColorStop(1, 'rgba(110,50,20,0)'); S.x.fillStyle = g; S.x.beginPath(); S.x.arc(0, 0, R_*S.ky*1.6, 0, 7); S.x.fill(); S.x.restore(); }
      grime(S.x, S.x0, S.y0 + 72, SIDE_W, 56, 7711 + (S.side === 'R' ? 0 : 1), 700);
    },
    keke(S){ S.fill(KEKE_Y);
      S.shade(0.22, 0.42, 0.26);
      S.hline(1.022, 0.60, 1.14, 'rgba(70,45,0,0.6)', 1.2);
      S.band(0.902, 0.948, 1.00, 1.08, '#e8901a');
      for(const z of [0.73, 0.78, 0.83]){ S.hline(z + 0.008, -1.30, -0.70, 'rgba(255,236,170,0.7)', 1); S.hline(z - 0.008, -1.30, -0.70, 'rgba(110,70,0,0.55)', 1.2); }
      S.vline(-0.607, 0.34, 0.905, 'rgba(70,45,0,0.6)', 1.2); S.hline(0.337, -0.60, 0.58, 'rgba(70,45,0,0.5)', 1);
      grime(S.x, S.x0, S.y0 + 80, SIDE_W, 48, 7801 + (S.side === 'R' ? 0 : 1), 380);
    },
  };

  /* ---------------------------------------------------------------- fronts and backs */
  function fasFront_sedan(F){ F.clear(); const W = F.W, H = F.Hf;
    F.rect(0.50, 0.05, W - 1.0, 0.13, '#15171a', 3);
    for(let k=0;k<3;k++) F.rect(0.52, 0.075 + k*0.035, W - 1.04, 0.008, '#c9ccd0');
    F.ell(W/2, 0.125, 0.06, 0.035, '#d6d9dc'); F.ell(W/2, 0.125, 0.045, 0.024, '#1f2a44');
    for(const n of [[0.03, 0.10, 0.30, 0.40], [0.70, 0.10, 0.97, 0.40]]){ const [u, v, w, h] = F.nr(n); lamp(F, u, v, w, h, 'head'); }
    F.sym(0.03*W, 0.40*H, 0.08, 0.035, '#e8961e', 2);
    F.rect(0.45, 0.68*H - 0.02, W - 0.9, 0.06, '#1c1e21', 3);
    fplate(F, W/2, 0.62*H - 0.02, 'KJA 382 GH', 'pri');
    F.rect(0.1, H - 0.03, W - 0.2, 0.03, 'rgba(20,20,22,0.85)');
  }
  function fasRear_sedan(F){ F.clear(); const W = F.W, H = F.Hf;
    for(const n of [[0.0, 0.12, 0.27, 0.42], [0.73, 0.12, 1.0, 0.42]]){ const [u, v, w, h] = F.nr(n); lamp(F, u, v, w, h, 'tail');
      F.rect(u + w*0.62, v + h*0.25, w*0.3, h*0.5, 'rgba(240,240,240,0.55)', 2); F.rect(u + w*0.08, v + h*0.62, w*0.3, h*0.3, 'rgba(232,150,30,0.85)', 2); }
    const zt = 0.12*H, lidL = 0.27*W, lidR = 0.73*W;
    F.rect(lidL, 0.42*H, lidR - lidL, 0.006, 'rgba(15,15,18,0.8)');
    F.rect(lidL, 0.02, 0.006, 0.40*H, 'rgba(15,15,18,0.6)'); F.rect(lidR - 0.006, 0.02, 0.006, 0.40*H, 'rgba(15,15,18,0.6)');
    F.ell(W/2, 0.19*H, 0.05, 0.025, '#d6d9dc');
    fplate(F, W/2, 0.48*H, 'KJA 382 GH', 'pri');
  }
  function fasFront_taxi(F){ F.clear(); const W = F.W, H = F.Hf;
    for(const n of [[0.06, 0.12, 0.27, 0.42], [0.73, 0.12, 0.94, 0.42]]){ const [u, v, w, h] = F.nr(n); lamp(F, u, v, w, h, 'head'); }
    F.rect(0.27*W + 0.02, 0.14*H, 0.46*W - 0.04, 0.24*H, '#111214', 2);
    for(let k=0;k<4;k++) F.rect(0.27*W + 0.03, 0.17*H + k*0.05*H, 0.46*W - 0.06, 0.006, '#9a9ea3');
    F.sym(0.01*W, 0.14*H, 0.045, 0.24*H, '#e8961e', 2);
    // the dark grey bumper and its plate
    const zb = (0.755 - 0.47)/0.44*H; F.rect(0, zb, W, H - zb, '#2d2f33'); F.rect(0, zb, W, 0.012, '#45484d');
    fplate(F, W/2, zb + 0.03, 'LND 714 XA', 'com');
  }
  function fasRear_taxi(F){ F.clear(); const W = F.W, H = F.Hf;
    for(const n of [[0.02, 0.10, 0.30, 0.40], [0.70, 0.10, 0.98, 0.40]]){ const [u, v, w, h] = F.nr(n); lamp(F, u, v, w, h, 'tail'); F.rect(u + w*0.04, v + h*0.56, w*0.92, h*0.38, 'rgba(236,140,26,0.95)', 2); }
    F.rect(0.30*W, 0.10*H, 0.40*W, 0.30*H, '#151515');
    fplate(F, W/2, 0.135*H, 'LND 714 XA', 'com', 0.30, 0.11);
    F.rect(0.30*W, 0.08*H, 0.40*W, 0.006, 'rgba(15,15,18,0.8)');
    const zb = (0.89 - 0.50)/0.535*H; F.rect(0, zb, W, H - zb, '#2d2f33'); F.rect(0, zb, W, 0.012, '#45484d');
  }
  function fasFront_pickup(F, nacecaLivery){ F.clear(); const W = F.W, H = F.Hf;
    for(const n of [[0.03, 0.10, 0.26, 0.30], [0.74, 0.10, 0.97, 0.30]]){ const [u, v, w, h] = F.nr(n); lamp(F, u, v, w, h, 'head'); }
    F.rect(0.26*W + 0.02, 0.06*H, 0.48*W - 0.04, 0.42*H, '#0e0f11', 3);
    for(let k=0;k<5;k++) F.rect(0.26*W + 0.04, 0.10*H + k*0.075*H, 0.48*W - 0.08, 0.012, '#3a3d42');
    if(!nacecaLivery){ F.rect(0.26*W + 0.02, 0.24*H, 0.48*W - 0.04, 0.03, '#b9bdc2'); F.ell(W/2, 0.26*H, 0.07, 0.04, '#c9ccd0'); }
    F.sym(0.0, 0.32*H, 0.10, 0.05, '#e8961e', 2);
    const zb = (1.02 - 0.68)/0.525*H; F.rect(0, zb, W, H - zb, '#141516'); F.rect(0, zb, W, 0.012, '#2a2c30');
    F.sym(0.12, zb + 0.06, 0.12, 0.05, '#cfd3d6', 3);
    fplate(F, W/2, zb + 0.035, nacecaLivery ? 'FG 214 NC' : 'EPE 590 KJ', nacecaLivery ? 'gov' : 'pri');
  }
  function fasRear_pickup(F, nacecaLivery){ const W = F.W, H = F.Hf; F.fill(nacecaLivery ? NAVY : '#ffffff');
    if(!nacecaLivery){ F.clear(); }
    for(const n of [[0.0, 0.05, 0.09, 0.55], [0.91, 0.05, 1.0, 0.55]]){ const [u, v, w, h] = F.nr(n); lamp(F, u, v, w, h, 'tail'); F.rect(u + w*0.15, v + h*0.55, w*0.7, h*0.18, 'rgba(240,240,240,0.6)', 1); F.rect(u + w*0.15, v + h*0.76, w*0.7, h*0.16, 'rgba(232,150,30,0.85)', 1); }
    F.rect(0.10*W, 0.02*H, 0.80*W, 0.006, 'rgba(10,10,12,0.85)');
    F.rect(W/2 - 0.12, 0.07*H, 0.24, 0.05, '#141516', 3);
    if(nacecaLivery) F.text('NACECA', W/2, 0.32*H, 0.13, GOLD);
    else F.text('4x4', W*0.78, 0.30*H, 0.05, '#4a4d52');
    const zb = (1.12 - 0.66)/0.605*H; F.rect(0, zb, W, H - zb, '#141516'); F.rect(0, zb, W, 0.012, '#2a2c30');
    fplate(F, W/2, zb + 0.04, nacecaLivery ? 'FG 214 NC' : 'EPE 590 KJ', nacecaLivery ? 'gov' : 'pri');
  }
  function fasFront_van(F, nacecaLivery){ F.clear(); const W = F.W, H = F.Hf;
    for(const n of [[0.02, 0.10, 0.27, 0.36], [0.73, 0.10, 0.98, 0.36]]){ const [u, v, w, h] = F.nr(n); lamp(F, u, v, w, h, 'head'); F.rect(u + w*0.72, v + h*0.15, w*0.22, h*0.7, '#e8961e', 2); }
    F.rect(0.27*W + 0.02, 0.10*H, 0.46*W - 0.04, 0.24*H, '#121315', 3);
    for(let k=0;k<3;k++) F.rect(0.27*W + 0.04, 0.14*H + k*0.065*H, 0.46*W - 0.08, 0.012, nacecaLivery ? '#3a3d42' : '#a9adb2');
    F.ell(W/2, 0.22*H, 0.06, 0.035, '#d0d4d8');
    const zb = (1.05 - 0.58)/0.655*H; F.rect(0, zb, W, H - zb, '#2d2f33'); F.rect(0, zb, W, 0.012, '#45484d');
    fplate(F, W/2, zb + 0.05, nacecaLivery ? 'FG 207 NC' : 'KTU 118 BD', nacecaLivery ? 'gov' : 'pri');
  }
  function fasRear_van(F, nacecaLivery){ const W = F.W, H = F.Hf; F.fill(nacecaLivery ? NAVY : '#ffffff');
    // geometry: doors span x +-0.758 (u 0.072..1.588), z 0.58..1.88 (v 0.09..1.39) on a 1.66 x 1.57 panel
    const u0 = 0.072, u1 = 1.588, v0 = 0.09, v1 = 1.39, um = W/2;
    if(!nacecaLivery) grime(F.x, F.x0, F.y0 + 60, FAS_W, 68, 7421, 300);
    F.grad(u0 + 0.06, v0 + 0.06, um - u0 - 0.1, 0.42, [[0, '#2a3440'], [0.5, '#0d1218'], [1, '#05080b']], 4);
    F.grad(um + 0.04, v0 + 0.06, u1 - um - 0.1, 0.42, [[0, '#2a3440'], [0.5, '#0d1218'], [1, '#05080b']], 4);
    F.rect(um - 0.004, v0, 0.008, v1 - v0, 'rgba(8,10,12,0.9)');
    F.rect(u0, v0, 0.006, v1 - v0, 'rgba(8,10,12,0.6)'); F.rect(u1 - 0.006, v0, 0.006, v1 - v0, 'rgba(8,10,12,0.6)');
    F.rect(um - 0.17, 0.80, 0.12, 0.035, '#1a1a1a', 2); F.rect(um + 0.05, 0.80, 0.12, 0.035, '#1a1a1a', 2);
    if(nacecaLivery) F.text('NACECA', um, 0.98, 0.13, GOLD);
    fplate(F, um + 0.28, 1.24, nacecaLivery ? 'FG 207 NC' : 'KTU 118 BD', nacecaLivery ? 'gov' : 'pri');
  }
  function fasFront_suv(F){ F.clear(); const W = F.W, H = F.Hf, x = F.x;
    // slim lamp units with an LED line along the top edge
    for(const n of [[0.015, 0.08, 0.25, 0.20], [0.75, 0.08, 0.985, 0.20]]){ const [u, v, w, h] = F.nr(n);
      F.rect(u, v, w, h, '#16181b', 3); F.rect(u + w*0.06, v + h*0.12, w*0.88, Math.max(0.012, h*0.14), '#eef2f4', 1);
      F.ell(u + w*(n[0] < 0.5 ? 0.72 : 0.28), v + h*0.62, w*0.09, h*0.24, '#b9c2c9'); }
    // the grille: a tapering black shield of dark slats inside a thin chrome frame
    const gu0 = 0.255*W, gu1 = 0.745*W, gb0 = 0.29*W, gb1 = 0.71*W, gv0 = 0.10*H, gv1 = 0.59*H;
    const path = ()=>{ x.beginPath(); x.moveTo(F.U(gu0), F.V(gv0)); x.lineTo(F.U(gu1), F.V(gv0)); x.lineTo(F.U(gb1), F.V(gv1)); x.lineTo(F.U(gb0), F.V(gv1)); x.closePath(); };
    path(); x.fillStyle = '#0d0e10'; x.fill();
    x.save(); path(); x.clip();
    for(let k=0;k<7;k++){ x.fillStyle = '#2b2e33'; x.fillRect(F.U(0), F.V(gv0 + 0.03 + k*(gv1 - gv0 - 0.04)/7), FAS_W, Math.max(1.5, 0.014*F.ky)); }
    x.restore();
    path(); x.strokeStyle = '#c9cdd1'; x.lineWidth = 1.6; x.stroke();
    // lower intake, fog lamp stacks, plate, skid
    F.rect(0.28*W, 0.63*H, 0.44*W, 0.20*H, '#121315', 3);
    for(const u0 of [0.03*W, 0.87*W]){ F.rect(u0, 0.60*H, 0.10*W, 0.20*H, '#141518', 2); for(let k=0;k<3;k++) F.rect(u0 + 0.02, 0.63*H + k*0.05*H, 0.10*W - 0.04, 0.012, '#d9dde0', 1); }
    fplate(F, W/2, 0.645*H, 'ABC 777 LA', 'pri');
    const zb = (1.09 - 0.52)/0.625*H; F.rect(0.18*W, zb, 0.64*W, H - zb, '#b9bdc2'); F.rect(0.18*W, zb, 0.64*W, 0.01, '#e2e5e8');
  }
  function fasRear_suv(F){ F.clear(); const W = F.W, H = F.Hf, v = z=>1.21 - z;
    // the tall lamps come down the D-pillars to the tailgate shoulder
    for(const n of [[0.0, 0.0, 0.075, 0.28], [0.925, 0.0, 1.0, 0.28]]){ const [u, vv, w, h] = F.nr(n); lamp(F, u, vv, w, h, 'tail'); }
    F.rect(0.10*W, v(1.165), 0.80*W, 0.012, '#d6dade', 2);
    F.rect(0.32*W, v(1.01), 0.36*W, 0.022, '#d6dade', 2);
    F.rect(0.36*W, v(0.97), 0.28*W, 0.15, '#17181b', 3);
    fplate(F, W/2, v(0.955), 'ABC 777 LA', 'pri');
    const zb = v(0.78); F.rect(0, zb, W, H - zb, '#25272b'); F.rect(0, zb, W, 0.008, '#3a3d42');
    F.sym(0.04*W, v(0.62), 0.11, 0.03, '#8e1010', 2);
    const zs = v(0.54); F.rect(0.17*W, zs, 0.66*W, H - zs, '#b9bdc2');
  }
  function fasFront_danfo(F){ const W = F.W, H = F.Hf; F.fill(DANFO_Y);
    F.rect(0, 0.0, W, 0.07*H, 'rgba(0,0,0,0.12)');
    F.rect(0, 0.16*H, W, 0.21*H, '#121212');
    for(const n of [[0.05, 0.17, 0.21, 0.36], [0.79, 0.17, 0.95, 0.36]]){ const [u, v, w, h] = F.nr(n); lamp(F, u, v, w, h, 'head'); }
    for(let k=0;k<4;k++) F.rect(0.24*W, 0.20*H + k*0.04*H, 0.52*W, 0.008, '#3a3a3a');
    F.sym(0.0, 0.40*H, 0.10, 0.045, '#e8961e', 2);
    F.ell(W/2, 0.08*H, 0.06, 0.035, '#141414'); F.ell(W/2, 0.08*H, 0.045, 0.025, DANFO_Y);
    F.text('GOD DEY', W/2, 0.53*H, 0.09, '#141414');
    const zb = (1.10 - 0.58)/0.695*H; F.rect(0, zb, W, H - zb, '#151515'); F.rect(0, zb, W, 0.012, '#333');
    fplate(F, W/2, zb + 0.035, 'LND 553 XA', 'com');
    grime(F.x, F.x0, F.y0, FAS_W, FAS_H, 7731, 260);
  }
  function fasRear_danfo(F){ const W = F.W, H = F.Hf; F.fill(DANFO_Y);
    // T3 tailgate window, engine lid, bands, slogan
    F.grad(0.10*W, 0.12*H, 0.80*W, 0.33*H, [[0, '#2a3440'], [0.6, '#0b1016'], [1, '#05080b']], 6);
    F.rect(0, (1.88 - 1.075)/1.445*H, W, 0.085, '#141414'); F.rect(0, (1.88 - 0.715)/1.445*H, W, 0.06, '#141414');
    for(const n of [[0.01, 0.57, 0.095, 0.78], [0.905, 0.57, 0.99, 0.78]]){ const [u, v, w, h] = F.nr(n); lamp(F, u, v, w, h, 'tail'); F.rect(u + w*0.15, v + h*0.05, w*0.7, h*0.2, 'rgba(232,150,30,0.9)', 1); }
    F.text('NO CONDITION IS PERMANENT', W/2, 0.50*H, 0.075, '#a3160e', { font:(px)=>`italic bold ${px}px Georgia, 'Times New Roman', serif`, stroke:2, strokeCol:'#f6e6a0' });
    F.rect(0.18*W, 0.66*H, 0.64*W, 0.10*H, 'rgba(0,0,0,0.12)', 3);
    for(let k=0;k<5;k++) F.rect(0.22*W, 0.675*H + k*0.017*H, 0.56*W, 0.006, '#2a2a2a');
    fplate(F, W/2, 0.79*H, 'LND 553 XA', 'com');
    const zb = (1.88 - 0.60)/1.445*H; F.rect(0, zb, W, H - zb, '#151515');
    grime(F.x, F.x0, F.y0, FAS_W, FAS_H, 7741, 420);
  }
  function fasFront_keke(F){ const W = F.W, H = F.Hf, v = z=>1.08 - z; F.fill(KEKE_Y);
    // crease under the windscreen with its highlight, vent slot, indicators (3D lenses sit on them)
    F.rect(0, v(1.03), W, 0.007, 'rgba(70,45,0,0.65)'); F.rect(0, v(1.03) + 0.007, W, 0.005, 'rgba(255,240,170,0.6)');
    F.rect(W/2 - 0.13, v(0.945), 0.26, 0.03, '#161616', 2); F.rect(W/2 - 0.12, v(0.945) + 0.012, 0.24, 0.005, '#3a3a3a');
    F.sym(0.03, v(0.952), 0.14, 0.058, '#e8901a', 2);
    // soft shadows round the headlamp pods, the plate between them
    for(const s of [-1, 1]) F.ell(0.64 - s*0.37, v(0.775), 0.135, 0.135, 'rgba(70,45,0,0.28)');
    fplate(F, W/2, v(0.765), 'IKD 274 TC', 'com', 0.28, 0.095);
    F.grad(0, v(0.52), W, 0.30, [[0, 'rgba(70,45,10,0)'], [1, 'rgba(70,45,10,0.4)']]);
    grime(F.x, F.x0, F.y0, FAS_W, FAS_H, 7811, 220);
  }
  function fasRear_keke(F){ F.clear(); const W = F.W, H = F.Hf, x = F.x, u = X=>X + W/2, v = z=>0.909 - z;
    // the body's rear outline (loft end station) in paint; outside it stays clear
    const ring = [[0, 0.355], [0.54, 0.36], [0.62, 0.43], [0.70, 0.50], [0.70, 0.64], [0.635, 0.72], [0.627, 0.845], [0.545, 0.901], [0, 0.909]];
    x.beginPath(); ring.forEach(([X, z], i)=>i ? x.lineTo(F.U(u(X)), F.V(v(z))) : x.moveTo(F.U(u(X)), F.V(v(z))));
    for(let i = ring.length - 1; i >= 0; i--) x.lineTo(F.U(u(-ring[i][0])), F.V(v(ring[i][1])));
    x.closePath(); x.fillStyle = KEKE_Y; x.fill();
    // engine lid: recessed outline and three pressed ribs
    x.strokeStyle = 'rgba(80,50,0,0.85)'; x.lineWidth = 1.3; rr(x, F.U(u(-0.385)), F.V(v(0.893)), 0.77*F.kx, (0.893 - 0.555)*F.ky, 2); x.stroke();
    for(const z of [0.835, 0.76, 0.685]){ F.rect(u(-0.31), v(z) - 0.009, 0.62, 0.009, 'rgba(255,238,175,0.95)', 1); F.rect(u(-0.31), v(z), 0.62, 0.011, 'rgba(120,78,0,0.9)', 1); }
    fplate(F, W/2, v(0.525), 'IKD 274 TC', 'com', 0.30, 0.12);
    F.rect(u(-0.56), v(0.39), 1.12, 0.035, '#161616');
    grime(F.x, F.x0, F.y0 + 70, FAS_W, 58, 7821, 200);
  }

  /* ---------------------------------------------------------------- truck */
  function truckSide(x){ const [x0, y0, x1, y1] = TRUCK_SIDE, W = x1 - x0, H = y1 - y0;
    const g = x.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, '#c6c9cc'); g.addColorStop(1, '#a9adb1'); x.fillStyle = g; x.fillRect(x0, y0, W, H);
    // corrugations: a highlight and a shadow line per rib
    const n = 44, p = H/n;
    for(let k=0;k<n;k++){ const y = y0 + k*p; x.fillStyle = 'rgba(255,255,255,0.55)'; x.fillRect(x0, y, W, 1); x.fillStyle = 'rgba(70,74,80,0.28)'; x.fillRect(x0, y + p*0.55, W, 1); }
    for(let k=1;k<6;k++){ x.fillStyle = 'rgba(80,84,90,0.18)'; x.fillRect(x0 + k*W/6, y0, 1, H); }
    grime(x, x0, y0 + H*0.7, W, H*0.3, 7911, 260, 'rgba(90,80,60,0.10)');
    x.fillStyle = 'rgba(0,0,0,0.22)'; x.fillRect(x0, y1 - 3, W, 3);
  }
  function truckFront(x, dims){ const F = fasCtx(x, TRUCK_F, dims ? dims.x[1] - dims.x[0] : 1.69, dims ? dims.z[1] - dims.z[0] : 0.975); F.clear();
    const W = F.W, xm = W/2, zt = dims ? dims.z[1] : 1.53, v = z=>zt - z, u = X=>xm - X;
    // grille band between the lamps: black with three slats
    F.rect(u(0.55), v(1.02), 1.10, 0.17, '#141517', 2);
    for(let k=0;k<3;k++) F.rect(u(0.53), v(1.0) + k*0.05, 1.06, 0.016, '#3c3f44');
    // headlamps: clear lens inboard, amber indicator outboard
    for(const s of [-1, 1]){ const u0 = Math.min(u(s*0.80), u(s*0.56)), u1 = Math.max(u(s*0.80), u(s*0.56));
      if(s > 0){ F.rect(u0 - 0.01, v(1.025), 0.07, 0.17, '#e8901a', 2); lamp(F, u0 + 0.06, v(1.03), 0.19, 0.18, 'head'); }
      else { lamp(F, u0 + 0.0, v(1.03), 0.19, 0.18, 'head'); F.rect(u1 - 0.06, v(1.025), 0.07, 0.17, '#e8901a', 2); } }
    // panel shut line, cab badge plate
    F.rect(u(0.76), v(1.245), 1.52, 0.006, 'rgba(60,62,66,0.75)');
    F.rect(xm - 0.12, v(1.17), 0.24, 0.04, '#9da1a6', 2);
  }
  function truckRear(x, dims){ const F = fasCtx(x, TRUCK_R, dims ? dims.x[1] - dims.x[0] : 2.06, dims ? dims.z[1] - dims.z[0] : 1.98);
    const W = F.W, H = F.Hf; F.fill('#b9bcbf');
    // two door leaves in a dark frame
    F.rect(0.06, 0.025, W - 0.12, H - 0.07, '#3a3d42');
    F.rect(0.115, 0.075, W/2 - 0.14, H - 0.17, '#dcdddb'); F.rect(W/2 + 0.025, 0.075, W/2 - 0.14, H - 0.17, '#dcdddb');
    F.rect(W/2 - 0.012, 0.03, 0.024, H - 0.08, '#24272b');
    // locking bars with brackets, handles
    for(const uc of [W/2 - 0.13, W/2 + 0.14]){ F.rect(uc - 0.016, 0.05, 0.032, H - 0.10, '#9a9ea3'); F.rect(uc - 0.007, 0.05, 0.008, H - 0.10, '#c9ccd0');
      for(const vb of [0.12, 0.62, 1.30, 1.80]) F.rect(uc - 0.035, vb, 0.07, 0.06, '#6e7277', 1); }
    F.rect(W/2 - 0.52, 1.50, 0.38, 0.035, '#8e9297', 2); F.rect(W/2 + 0.14, 1.50, 0.38, 0.035, '#8e9297', 2);
    // hinge plates on the outer edges (the 3D hinges stand proud of them)
    for(const vv of [0.39, 0.96, 1.65]){ F.rect(0.0, vv, 0.16, 0.07, '#7c8085', 1); F.rect(W - 0.16, vv, 0.16, 0.07, '#7c8085', 1); }
    grime(F.x, F.x0, F.y0 + 96, FAS_W, 32, 7901, 160, 'rgba(90,80,60,0.12)');
  }

  /* ---------------------------------------------------------------- rims */
  function rims(x){
    const cell = k=>[k*128, 1792];
    const disc = (cx, cy, r, col)=>{ x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fillStyle = col; x.fill(); };
    const spokes = (cx, cy, n, r0, r1, w0, w1, col, rot)=>{ for(let i=0;i<n;i++){ const a = (rot || 0) + i*2*Math.PI/n, c = Math.cos(a), s = Math.sin(a), pc = -s, ps = c;
      x.beginPath(); x.moveTo(cx + c*r0 + pc*w0, cy + s*r0 + ps*w0); x.lineTo(cx + c*r1 + pc*w1, cy + s*r1 + ps*w1); x.lineTo(cx + c*r1 - pc*w1, cy + s*r1 - ps*w1); x.lineTo(cx + c*r0 - pc*w0, cy + s*r0 - ps*w0); x.closePath(); x.fillStyle = col; x.fill(); } };
    const nuts = (cx, cy, n, r, s, col)=>{ for(let i=0;i<n;i++){ const a = i*2*Math.PI/n; disc(cx + Math.cos(a)*r, cy + Math.sin(a)*r, s, col); } };
    let [X, Y] = cell(0), cx = X + 64, cy = Y + 64;
    disc(cx, cy, 63, '#3a3d42'); disc(cx, cy, 59, '#c9cdd1'); disc(cx, cy, 53, '#1c1e21');
    spokes(cx, cy, 5, 12, 54, 9, 13, '#c3c7cb', -Math.PI/2); disc(cx, cy, 17, '#b9bdc1'); disc(cx, cy, 9, '#8e9297'); nuts(cx, cy, 5, 13, 2.2, '#5d6166');
    [X, Y] = cell(1); cx = X + 64; cy = Y + 64;
    disc(cx, cy, 63, '#3a3d42'); disc(cx, cy, 59, '#b7bbc0'); disc(cx, cy, 54, '#17191c');
    spokes(cx, cy, 10, 14, 55, 4, 6, '#c5c9ce', 0); disc(cx, cy, 18, '#9da2a7'); disc(cx, cy, 10, '#2a2d31'); nuts(cx, cy, 6, 14, 2, '#d0d4d8');
    [X, Y] = cell(2); cx = X + 64; cy = Y + 64;
    disc(cx, cy, 63, '#202124'); disc(cx, cy, 59, '#141517'); disc(cx, cy, 52, '#070708');
    spokes(cx, cy, 6, 14, 54, 8, 11, '#1d1e21', 0.26); disc(cx, cy, 20, '#1a1b1e'); nuts(cx, cy, 6, 14, 2.6, '#a9adb2'); disc(cx, cy, 6, '#3a3c40');
    [X, Y] = cell(3); cx = X + 64; cy = Y + 64;
    disc(cx, cy, 63, '#2a2c2f'); disc(cx, cy, 58, '#c2c6ca'); disc(cx, cy, 50, '#aeb2b7');
    for(let i=0;i<12;i++){ const a = i*Math.PI/6; x.save(); x.translate(cx, cy); x.rotate(a); x.fillStyle = '#3e4146'; rr(x, 30, -4, 16, 8, 3); x.fill(); x.restore(); }
    disc(cx, cy, 20, '#d2d6da'); disc(cx, cy, 8, '#7e8288');
    [X, Y] = cell(4); cx = X + 64; cy = Y + 64;
    disc(cx, cy, 63, '#262729'); disc(cx, cy, 58, '#8e9298'); disc(cx, cy, 52, '#a2a6ab');
    for(let i=0;i<8;i++){ const a = i*Math.PI/4 + 0.39; disc(cx + Math.cos(a)*38, cy + Math.sin(a)*38, 6.5, '#151617'); }
    disc(cx, cy, 24, '#7b7f85'); disc(cx, cy, 13, '#5a5e63'); nuts(cx, cy, 6, 18, 2.4, '#c9cdd1');
    grime(x, X + 8, Y + 8, 112, 112, 7951, 160, 'rgba(120,70,30,0.18)');
    [X, Y] = cell(5); cx = X + 64; cy = Y + 64;
    x.clearRect(X, Y, 128, 128);
    x.beginPath(); x.arc(cx, cy, 63, 0, 7); x.arc(cx, cy, 55, 0, 7, true); x.fillStyle = '#a4a8ad'; x.fill();
    x.strokeStyle = '#b4b8bd'; x.lineWidth = 1.2;
    for(let i=0;i<36;i++){ const a = i*Math.PI/18, b = a + (i%2 ? 0.55 : -0.55); x.beginPath(); x.moveTo(cx + Math.cos(b)*13, cy + Math.sin(b)*13); x.lineTo(cx + Math.cos(a)*56, cy + Math.sin(a)*56); x.stroke(); }
    disc(cx, cy, 15, '#a9adb2'); disc(cx, cy, 6, '#6a6e73');
  }

  /* ---------------------------------------------------------------- small bits */
  function swatches(x){ SW.forEach((n, i)=>{ x.fillStyle = SWC[n]; x.fillRect(768 + (i%16)*16, 1856 + ((i/16)|0)*16, 16, 16); }); }
  function taxiSign(x){ const [x0, y0, x1, y1] = TAXI_SIGN, W = x1 - x0, H = y1 - y0;
    x.fillStyle = TAXI_Y; x.fillRect(x0, y0, W, H); x.fillStyle = '#141414'; x.fillRect(x0, y0 + H - 8, W, 8);
    for(let k=0;k<16;k++) x.fillRect(x0 + k*16 + (k%2)*0, y0 + H - 8 + (k%2)*4, 16, 4);
    x.font = FONT(38); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#141414'; x.fillText('TAXI', x0 + W/2, y0 + H*0.42); }
  function canvasPanel(x, r, seed){ const [x0, y0, x1, y1] = r, W = x1 - x0, H = y1 - y0;
    x.fillStyle = SWC.canvas; x.fillRect(x0, y0, W, H);
    const rnd = _rng(seed);
    for(let i=0;i<260;i++){ x.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.08)'; x.fillRect(x0 + rnd()*W, y0 + rnd()*H, 1 + rnd()*3, 1); }
  }
  function rivets(x, xa, xb, y, step){ for(let X = xa; X <= xb; X += step){ x.fillStyle = '#0c0c0c'; x.fillRect(X - 1.5, y - 1.5, 3, 3); x.fillStyle = '#9a9c9e'; x.fillRect(X - 1, y - 1, 2, 2); } }
  function misc(x){
    const P = (r, num, kind, ax)=>plate(x, r[0], r[1], r[2] - r[0], r[3] - r[1], num, kind, null, ax);
    P(MISC.okplate, 'AGL 61 QK', 'com', 1.2); P(MISC.kekeplate, 'IKD 274 TC', 'com', 1.0); P(MISC.truckplate, 'SWF 218 XB', 'com', 0.78);
    // keke hood, rear panel: x -0.665..0.665, z 0.90..1.75 (window is geometry); hem with rivets along the bottom
    { const r = MISC.kekerear, [x0, y0, x1, y1] = r, W = x1 - x0, H = y1 - y0, Y = z=>y0 + (1 - (z - 0.90)/0.85)*H, X = X_=>x0 + (X_ + 0.665)/1.33*W;
      canvasPanel(x, r, 7831);
      x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(x0, Y(0.95), W, Y(0.90) - Y(0.95));
      x.fillStyle = 'rgba(255,255,255,0.07)'; x.fillRect(x0, Y(0.955), W, 1);
      rivets(x, X(-0.60), X(0.61), Y(0.925), (X(0.10) - X(0)));
      x.fillStyle = 'rgba(255,255,255,0.05)'; x.fillRect(X(-0.50), Y(1.58), 1, Y(0.96) - Y(1.58)); x.fillRect(X(0.50), Y(1.58), 1, Y(0.96) - Y(1.58));
      x.fillStyle = 'rgba(0,0,0,0.3)'; x.fillRect(x0, Y(1.585), W, 1); }
    // keke hood, side panels: y -1.435..0.68, z 0.90..1.75; rivets on the closed rear section, a stitched hem on the valance
    { const r = MISC.kekeside, [x0, y0, x1, y1] = r, W = x1 - x0, H = y1 - y0, Y = z=>y0 + (1 - (z - 0.90)/0.85)*H, X = y=>x0 + (y + 1.435)/2.115*W;
      canvasPanel(x, r, 7841);
      x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(X(-1.435), Y(0.95), X(-0.60) - X(-1.435), Y(0.90) - Y(0.95));
      rivets(x, X(-1.38), X(-0.62), Y(0.925), X(0.10) - X(0));
      x.fillStyle = 'rgba(0,0,0,0.4)'; x.fillRect(X(-0.60), Y(1.535), X(0.68) - X(-0.60), Y(1.50) - Y(1.535));
      x.fillStyle = 'rgba(255,255,255,0.08)'; x.fillRect(X(-0.60), Y(1.54), X(0.68) - X(-0.60), 1);
      x.fillStyle = 'rgba(0,0,0,0.45)'; x.fillRect(X(-0.60) - 1, Y(1.75), 2, Y(0.90) - Y(1.75));
      x.strokeStyle = 'rgba(255,255,255,0.05)'; x.lineWidth = 1; x.beginPath(); x.moveTo(X(-0.75), Y(1.70)); x.lineTo(X(-1.30), Y(1.52)); x.stroke(); }
    // truck lamp clusters: amber outboard, red, white inboard
    { const [x0, y0, x1, y1] = MISC.trucklamp, W = x1 - x0, H = y1 - y0;
      x.fillStyle = '#141414'; x.fillRect(x0, y0, W, H);
      const seg = [['#e88a14', '#f4b04a'], ['#b0140f', '#e2382a'], ['#d8dcdf', '#ffffff']];
      seg.forEach(([a, b], i)=>{ const g = x.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, b); g.addColorStop(1, a); x.fillStyle = g; x.fillRect(x0 + 2 + i*(W - 4)/3, y0 + 3, (W - 4)/3 - 2, H - 6); }); }
  }

  /* ---------------------------------------------------------------- entry */
  function paint(spec){
    const [c, x] = _cv(AW, AH);
    x.fillStyle = '#808080'; x.fillRect(0, 0, AW, AH);
    const T = (spec && spec.types) || {};
    const dims = v=>T[v] || {};
    for(const v of VARIANTS){
      const d = dims(v); if(!d.L) continue;
      for(const side of ['R', 'L']){
        const S = sideCtx(x, v, side, d.L, d.H); S.clip();
        if(v === 'pickupN' || v === 'pickupP') SIDES.pickup(S, v === 'pickupN');
        else if(v === 'vanN' || v === 'vanP') SIDES.van(S, v === 'vanN');
        else SIDES[v](S);
        x.restore();
        // the top rows are the body's plain colour (roofs, bonnets and every face that is not a side)
        const [sx, sy] = sideRect(v, side), base = { pickupN:NAVY, vanN:NAVY, taxi:TAXI_Y, danfo:DANFO_Y, keke:KEKE_Y }[v] || '#ffffff';
        x.fillStyle = base; x.fillRect(sx, sy, SIDE_W, 7);
      }
      const fr = d.front, re = d.rear;
      const Ff = fr ? fasCtx(x, fasRect(v, 'F'), fr.x[1] - fr.x[0], fr.z[1] - fr.z[0]) : null;
      const Fr = re ? fasCtx(x, fasRect(v, 'R'), re.x[1] - re.x[0], re.z[1] - re.z[0]) : null;
      const clipped = (F, fn)=>{ if(!F) return; x.save(); x.beginPath(); x.rect(F.x0, F.y0, FAS_W, FAS_H); x.clip(); fn(F); x.restore(); };
      const nac = v === 'pickupN' || v === 'vanN';
      if(v.startsWith('pickup')){ clipped(Ff, F=>fasFront_pickup(F, nac)); clipped(Fr, F=>fasRear_pickup(F, nac)); }
      else if(v.startsWith('van')){ clipped(Ff, F=>fasFront_van(F, nac)); clipped(Fr, F=>fasRear_van(F, nac)); }
      else { clipped(Ff, { sedan:fasFront_sedan, taxi:fasFront_taxi, suv:fasFront_suv, danfo:fasFront_danfo, keke:fasFront_keke }[v]);
             clipped(Fr, { sedan:fasRear_sedan, taxi:fasRear_taxi, suv:fasRear_suv, danfo:fasRear_danfo, keke:fasRear_keke }[v]); }
    }
    x.save(); x.beginPath(); x.rect(...TRUCK_SIDE.slice(0, 2), 512, 128); x.clip(); truckSide(x); x.restore();
    x.save(); x.beginPath(); x.rect(TRUCK_F[0], TRUCK_F[1], 256, 128); x.clip(); truckFront(x, dims('truck').front); x.restore();
    x.save(); x.beginPath(); x.rect(TRUCK_R[0], TRUCK_R[1], 256, 128); x.clip(); truckRear(x, dims('truck').rear); x.restore();
    rims(x); swatches(x); taxiSign(x); misc(x);
    return c;
  }
  return { paint, VARIANTS };
})();


/* =========================================================================
   NACECA · systems/vehicles.js (v10)
   The shared vehicle library. Every car, bus, keke, okada and truck in the
   game is an instance of one of eleven Blender-modelled types (one meshopt
   GLB), surfaced from a single canvas-painted atlas (VEHPAINT). Instances
   share geometry; body colour is a material tint. Environments place them
   through anchors ({veh, rot, color, lights, beacons, doors}) and bake their
   ground shadows from proxies, so a vehicle costs no lightmap of its own.
   ========================================================================= */
const VEH = { types:{}, spec:null, ready:false, mats:{}, list:[], env:null, envRT:null, t:0 };
VEH.TINT = { sedan:'#36495f', taxi:'#ffffff', pickupN:'#ffffff', pickupP:'#d3d5d0', suv:'#1e2125', keke:'#ffffff', vanN:'#ffffff',
             vanP:'#d8dad5', danfo:'#ffffff', okada:'#a8191f', truck:'#e2e3df' };
VEH.TL_ALWAYS = { vanN:1, vanP:1, truck:1, okada:1, keke:1 };       // tail lamps that are not painted on a fascia
VEH.has = ()=>typeof ART_INLINE !== 'undefined' && !!ART_INLINE.veh_glb;
VEH.load = function(){
  if(VEH.p) return VEH.p;
  if(!VEH.has()) return (VEH.p = Promise.resolve(null));
  VEH.p = (async ()=>{
    const buf = _b64ToBuf(ART_INLINE.veh_glb);
    if(typeof MeshoptDecoder !== 'undefined' && MeshoptDecoder.ready) await MeshoptDecoder.ready;
    const loader = new THREE.GLTFLoader(); if(typeof MeshoptDecoder !== 'undefined') loader.setMeshoptDecoder(MeshoptDecoder);
    const gltf = await new Promise((res, rej)=>loader.parse(buf, '', res, rej));
    VEH.spec = ART_INLINE.veh_spec || { types:{} };
    try{ if(document.fonts && document.fonts.load) await Promise.race([document.fonts.load('700 48px Oswald'), new Promise(r=>setTimeout(r, 1500))]); }catch(e){}
    gltf.scene.updateMatrixWorld(true);
    for(const root of gltf.scene.children.slice()){
      const m = /^veh_([A-Za-z]+)$/.exec(root.name); if(!m) continue;
      const T = { root, hl:[] };
      root.traverse(o=>{
        if(/_HL$/.test(o.name) && o.isMesh){
          const pos = o.geometry.attributes.position, v = new THREE.Vector3(), pts = [];
          for(let i=0;i<pos.count;i++){ v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld); pts.push(v.clone()); }
          const L = pts.filter(p=>p.x < -0.15), R = pts.filter(p=>p.x > 0.15), C = pts.filter(p=>Math.abs(p.x) <= 0.15);
          const mid = a=>a.reduce((s, p)=>s.add(p), new THREE.Vector3()).multiplyScalar(1/a.length);
          for(const g of [L, R, C]) if(g.length) T.hl.push(mid(g));
        }
      });
      VEH.types[m[1]] = T;
    }
    VEH.ready = true; return VEH;
  })().catch(e=>{ console.warn('[NACECA] vehicles failed to load', e); VEH.failed = true; return null; });
  return VEH.p;
};
VEH.atlas = function(){
  if(VEH._atlas) return VEH._atlas;
  const c = VEHPAINT.paint(VEH.spec);
  const t = new THREE.CanvasTexture(c); t.flipY = false; t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
  return (VEH._atlas = t);
};
const _vcol = h=>new THREE.Color(h).convertSRGBToLinear();
VEH.mat = function(name, tint){
  const paint = name === 'veh_paint' || name === 'veh_paintx';
  const k = paint ? 'paint|' + tint : name; if(VEH.mats[k]) return VEH.mats[k];
  const A = VEH.atlas(), env = VEH.env;
  let m;
  switch(name){
    case 'veh_paint': case 'veh_paintx':
      m = new THREE.MeshStandardMaterial({ map:A, color:_vcol(tint), roughness:0.56, metalness:0.0, envMap:env, envMapIntensity:0.38 }); m.userData.env = 1; break;
    case 'veh_decal': m = new THREE.MeshStandardMaterial({ map:A, alphaTest:0.5, roughness:0.45, metalness:0.05, envMap:env, envMapIntensity:0.5 }); m.userData.env = 1; break;
    case 'veh_detail': m = new THREE.MeshStandardMaterial({ map:A, roughness:0.72, metalness:0, envMap:env, envMapIntensity:0.25 }); m.userData.env = 1; break;
    case 'veh_glass': m = new THREE.MeshStandardMaterial({ color:_vcol('#10171e'), roughness:0.14, metalness:0.2, envMap:env, envMapIntensity:0.8 }); m.userData.env = 1; break;
    case 'veh_chrome': m = new THREE.MeshStandardMaterial({ color:_vcol('#d8dce0'), roughness:0.15, metalness:1, envMap:env, envMapIntensity:1.15 }); m.userData.env = 1; break;
    case 'veh_tyre': m = new THREE.MeshStandardMaterial({ color:_vcol('#1a1a1a'), roughness:0.92, metalness:0 }); break;
    case 'veh_hl': m = new THREE.MeshBasicMaterial({ color:new THREE.Color('#fff4da').multiplyScalar(1.7), toneMapped:false, side:THREE.DoubleSide }); break;
    case 'veh_tl': m = new THREE.MeshBasicMaterial({ color:new THREE.Color('#ff2414').multiplyScalar(1.5), toneMapped:false, side:THREE.DoubleSide }); break;
    case 'veh_tl_off': m = new THREE.MeshStandardMaterial({ color:_vcol('#5c0a08'), roughness:0.25, metalness:0.1, envMap:env, envMapIntensity:0.8, side:THREE.DoubleSide }); m.userData.env = 1; break;
    case 'veh_bb': m = new THREE.MeshBasicMaterial({ color:new THREE.Color('#3a64ff').multiplyScalar(1.9), toneMapped:false, side:THREE.DoubleSide }); break;
    case 'veh_br': m = new THREE.MeshBasicMaterial({ color:new THREE.Color('#ff2a2a').multiplyScalar(1.9), toneMapped:false, side:THREE.DoubleSide }); break;
    default: m = new THREE.MeshStandardMaterial({ color:_vcol('#777777'), roughness:0.7 });
  }
  m.name = name; return (VEH.mats[k] = m);
};
/* a soft reflection environment that matches the scene's sky, ground and key light */
VEH.makeEnv = function(cfg){
  VEH.release();
  const gfx = (typeof currentGfx === 'function') ? currentGfx() : 'medium';
  if(gfx === 'low' || !ENGINE.renderer){ VEH.setEnv(null); return; }
  const L = (cfg && cfg.lights) || {}, sky = new THREE.Color(L.sky || '#9fb4d8'), ground = new THREE.Color(L.ground || '#3a3028');
  const hor = new THREE.Color((cfg && cfg.fog && cfg.fog[0]) || (cfg && cfg.bg) || '#c8c8c0');
  const sc = new THREE.Scene(), geo = new THREE.SphereGeometry(50, 32, 16), pos = geo.attributes.position, col = new Float32Array(pos.count*3), c = new THREE.Color();
  for(let i=0;i<pos.count;i++){ const y = pos.getY(i)/50;
    if(y > 0) c.copy(hor).lerp(sky, Math.min(1, y*1.6)); else c.copy(hor).lerp(ground, Math.min(1, -y*4));
    col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mats = [new THREE.MeshBasicMaterial({ vertexColors:true, side:THREE.BackSide })];
  sc.add(new THREE.Mesh(geo, mats[0]));
  const blob = (dir, color, k, r)=>{ const m = new THREE.MeshBasicMaterial({ color:new THREE.Color(color).multiplyScalar(k) }); mats.push(m);
    const s = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), m); s.position.copy(dir).normalize().multiplyScalar(40); sc.add(s); };
  if(L.key){ const d = new THREE.Vector3(...L.key[2]).sub(new THREE.Vector3(...(L.key[3] || [0, 0, 0]))); blob(d, L.key[0], 0.9 + 0.9*(L.key[1] || 0.5), 4); }
  for(const p of (L.points || []).slice(0, 4)){ blob(new THREE.Vector3(p.pos[0], Math.max(2, p.pos[1]), p.pos[2]), p.c, 0.8, 2.0); }
  // a soft overhead panel so glass and paint always catch a highlight
  blob(new THREE.Vector3(0.3, 1, 0.2), '#ffffff', 0.12, 12);
  let rt = null;
  try{ const pm = new THREE.PMREMGenerator(ENGINE.renderer); rt = pm.fromScene(sc, 0.03); pm.dispose(); }
  catch(e){ console.warn('[NACECA] vehicle reflections unavailable', e); rt = null; }
  sc.traverse(o=>{ if(o.geometry) o.geometry.dispose(); }); mats.forEach(m=>m.dispose());
  VEH.envRT = rt; VEH.setEnv(rt ? rt.texture : null);
};
VEH.setEnv = function(tex){
  VEH.env = tex;
  for(const k in VEH.mats){ const m = VEH.mats[k]; if(!m.userData.env) continue; const had = !!m.envMap; m.envMap = tex; if(had !== !!tex) m.needsUpdate = true; }
};
VEH.release = function(){ if(VEH.envRT){ VEH.setEnv(null); VEH.envRT.dispose(); VEH.envRT = null; } };
/* what the scene cleanup must not free (shared by every scene) */
VEH.keep = function(keepGeo, keepMat, keepTex){
  for(const k in VEH.types) VEH.types[k].root.traverse(o=>{ if(o.geometry) keepGeo.add(o.geometry); });
  for(const k in VEH.mats) keepMat.add(VEH.mats[k]);
  if(VEH._atlas) keepTex.add(VEH._atlas); if(VEH._glowTex) keepTex.add(VEH._glowTex);
  if(VEH._glowMat) keepMat.add(VEH._glowMat); if(VEH._poolMat) keepMat.add(VEH._poolMat); if(VEH._poolGeo) keepGeo.add(VEH._poolGeo);
};
/* ------------------------------------------------------------------------
   spawn(type, {color, lights:'off'|'on'|'tail', beacons, doors:0..1, lean, glow})
   returns a Group facing local -z, origin on the ground under its centre
   ------------------------------------------------------------------------ */
VEH.spawn = function(type, o){
  o = o || {};
  const T = VEH.types[type]; if(!T) return null;
  const sp = (VEH.spec.types && VEH.spec.types[type]) || {};
  const tint = o.color || VEH.TINT[type] || '#ffffff';
  const g = new THREE.Group(); g.name = 'veh:' + type;
  const body = T.root.clone(true); body.position.set(0, 0, 0); g.add(body);
  const st = { type, g, body, HL:[], TL:[], BB:[], BR:[], doors:{}, beacons:!!o.beacons, lights:'off', t:Math.random()*3 };
  body.traverse(m=>{
    if(/_HL$/.test(m.name)) st.HL.push(m); else if(/_TL$/.test(m.name)) st.TL.push(m);
    else if(/_BeaconB$/.test(m.name)) st.BB.push(m); else if(/_BeaconR$/.test(m.name)) st.BR.push(m);
    if(!m.isMesh) return;
    m.material = VEH.mat(m.material.name, tint); m.castShadow = false; m.receiveShadow = false;
  });
  // doors swing on hinge pivots (their meshes carry the dequantisation in their own transform)
  if(sp.doors) for(const side of ['L', 'R']){
    let d = null; body.traverse(m=>{ if(!d && new RegExp('_Door' + side + '$').test(m.name)) d = m; });
    if(!d) continue;
    const h = sp.doors[side], pv = new THREE.Group(); pv.position.set(h[0], 0, -h[1]); body.add(pv); body.updateMatrixWorld(true); pv.updateMatrixWorld(true); pv.attach(d);
    st.doors[side] = pv;
  }
  if(type === 'okada'){ const lean = o.lean != null ? o.lean : (sp.lean != null ? sp.lean : 0); body.rotation.z = lean; }
  g.userData.veh = st;
  VEH.setLights(g, o.lights || 'off');
  VEH.setDoors(g, o.doors || 0);
  if(o.glow && o.lights === 'on') VEH.addGlow(g);
  [...st.BB, ...st.BR].forEach(b=>{ b.visible = false; });
  VEH.list.push(st);
  return g;
};
VEH.setLights = function(g, mode){
  const st = g && g.userData.veh; if(!st) return;
  st.lights = mode;
  st.HL.forEach(m=>{ m.visible = mode === 'on'; });
  const tlOn = mode === 'on' || mode === 'tail';
  st.TL.forEach(m=>{ if(VEH.TL_ALWAYS[st.type]){ m.visible = true; m.traverse(k=>{ if(k.isMesh) k.material = VEH.mat(tlOn ? 'veh_tl' : 'veh_tl_off'); }); } else m.visible = tlOn; });
  if(st.glow) st.glow.visible = mode === 'on';
};
VEH.setDoors = function(g, a){
  const st = g && g.userData.veh; if(!st) return;
  if(st.doors.L) st.doors.L.rotation.y = -1.75*a;
  if(st.doors.R) st.doors.R.rotation.y = 1.75*a;
};
/* headlamp glare + a pool of light on the road (night scenes) */
VEH.addGlow = function(g){
  const st = g.userData.veh, T = VEH.types[st.type]; if(!T || !T.hl.length) return;
  if(!VEH._glowTex){ const [c, x] = _cv(128, 128), gr = x.createRadialGradient(64, 64, 2, 64, 64, 63); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); VEH._glowTex = new THREE.CanvasTexture(c); }
  if(!VEH._glowMat) VEH._glowMat = new THREE.SpriteMaterial({ map:VEH._glowTex, color:new THREE.Color('#fff0d0').multiplyScalar(1.3), blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false, transparent:true, opacity:0.75 });
  if(!VEH._poolMat) VEH._poolMat = new THREE.MeshBasicMaterial({ map:VEH._glowTex, color:new THREE.Color('#ffe6b8').multiplyScalar(0.5), blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false, transparent:true });
  if(!VEH._poolGeo){ VEH._poolGeo = new THREE.PlaneGeometry(1, 1); VEH._poolGeo.rotateX(-Math.PI/2); }
  const grp = new THREE.Group(); let front = -1e9;
  for(const p of T.hl){ const s = new THREE.Sprite(VEH._glowMat); s.position.copy(p); s.position.z -= 0.05; s.scale.setScalar(st.type === 'okada' || st.type === 'keke' ? 0.5 : 0.75); s.renderOrder = 3; grp.add(s); front = Math.max(front, -p.z); }
  const pool = new THREE.Mesh(VEH._poolGeo, VEH._poolMat); pool.scale.set(st.type === 'okada' ? 1.6 : 3.2, 1, st.type === 'okada' ? 3 : 6); pool.position.set(0, 0.03, -(front + (st.type === 'okada' ? 1.6 : 3.2))); pool.renderOrder = 1; grp.add(pool);
  st.body.add(grp); st.glow = grp; grp.visible = st.lights === 'on';
};
/* beacons: blue / red double flash (the same rhythm the missions always used) */
VEH.update = function(dt){
  if(!VEH.list.length) return;
  VEH.t += dt;
  for(const st of VEH.list){
    if(!st.beacons || !(st.BB.length || st.BR.length)) continue;
    const ph = ((VEH.t + st.t)*1.6) % 1, blue = (ph < 0.12) || (ph > 0.2 && ph < 0.32), red = (ph > 0.5 && ph < 0.62) || (ph > 0.7 && ph < 0.82);
    st.BB.forEach(b=>{ b.visible = blue; }); st.BR.forEach(b=>{ b.visible = red; });
  }
};
VEH.clear = function(){ VEH.list.length = 0; };
/* ------------------------------------------------------------------------
   static batching: parked vehicles that never change are merged per
   material (a dozen draw calls for a whole street instead of ~6 each)
   ------------------------------------------------------------------------ */
VEH._den = a=>!a.normalized ? 1 : (a.array instanceof Int16Array ? 1/32767 : a.array instanceof Uint16Array ? 1/65535 : a.array instanceof Int8Array ? 1/127 : a.array instanceof Uint8Array ? 1/255 : 1);
VEH._merge = function(list){
  let nv = 0, ni = 0;
  for(const { geo } of list){ nv += geo.attributes.position.count; ni += geo.index ? geo.index.count : geo.attributes.position.count; }
  const P = new Float32Array(nv*3), N = new Float32Array(nv*3), U = new Float32Array(nv*2), I = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
  const v = new THREE.Vector3(), nm = new THREE.Matrix3(); let vo = 0, io = 0;
  for(const { geo, M } of list){
    const p = geo.attributes.position, n = geo.attributes.normal, u = geo.attributes.uv, c = p.count;
    const dp = VEH._den(p), dn = n ? VEH._den(n) : 1, du = u ? VEH._den(u) : 1; nm.getNormalMatrix(M);
    for(let i=0;i<c;i++){
      const o3 = (vo + i)*3;
      v.set(p.getX(i)*dp, p.getY(i)*dp, p.getZ(i)*dp).applyMatrix4(M); P[o3] = v.x; P[o3+1] = v.y; P[o3+2] = v.z;
      if(n){ v.set(n.getX(i)*dn, n.getY(i)*dn, n.getZ(i)*dn).applyMatrix3(nm).normalize(); N[o3] = v.x; N[o3+1] = v.y; N[o3+2] = v.z; } else N[o3+1] = 1;
      if(u){ U[(vo + i)*2] = u.getX(i)*du; U[(vo + i)*2+1] = u.getY(i)*du; }
    }
    if(geo.index){ const ix = geo.index; for(let k=0;k<ix.count;k++) I[io + k] = ix.getX(k) + vo; io += ix.count; }
    else { for(let k=0;k<c;k++) I[io + k] = vo + k; io += c; }
    vo += c;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N, 3)); g.setAttribute('uv', new THREE.BufferAttribute(U, 2));
  g.setIndex(new THREE.BufferAttribute(I, 1)); g.computeBoundingSphere(); g.computeBoundingBox();
  return g;
};
VEH.batch = function(root, groups){
  if(!groups.length) return [];
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), by = new Map();
  for(const g of groups){
    g.updateMatrixWorld(true);
    const st = g.userData.veh, live = new Set(st ? [...st.BB, ...st.BR] : []);
    g.traverse(m=>{
      if(!m.isMesh) return;
      for(let q=m; q; q=q.parent){ if(live.has(q)) return; if(!q.visible && !live.has(q)) return; if(q === g) break; }
      const M = new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld);
      if(!by.has(m.material)) by.set(m.material, []);
      by.get(m.material).push({ geo:m.geometry, M });
    });
    // flashing beacons stay live: lift them out (same world placement) before the body goes
    live.forEach(n=>root.attach(n));
    if(g.parent) g.parent.remove(g);
    if(!live.size){ const i = VEH.list.indexOf(st); if(i >= 0) VEH.list.splice(i, 1); }
  }
  const out = [];
  for(const [mat, list] of by){
    const mesh = new THREE.Mesh(VEH._merge(list), mat); mesh.name = 'vehBatch:' + mat.name; mesh.matrixAutoUpdate = false; mesh.updateMatrix();
    mesh.castShadow = false; mesh.receiveShadow = false; root.add(mesh); out.push(mesh);
  }
  return out;
};
/* environments carry vehicle anchors: spawn them into the scene instance */
VEH.populate = function(inst, cfg){
  if(!VEH.ready || !inst || !inst.meta) return;
  const A = inst.meta.anchors || {}; let any = false;
  for(const name in A){ if(A[name].veh) { any = true; break; } }
  if(!any) return;
  VEH.makeEnv(cfg);
  const still = [];
  for(const name in A){
    const a = A[name]; if(!a.veh) continue;
    const v = VEH.spawn(a.veh, { color:a.color, lights:a.lights, beacons:a.beacons, doors:a.doors, lean:a.lean, glow:a.glow });
    if(!v) continue;
    v.position.set(a.pos[0], a.pos[1] || 0, a.pos[2]); v.rotation.y = a.rot || 0; v.name = name;
    if(a.shadow === 'live') v.traverse(m=>{ if(m.isMesh && !m.material.isMeshBasicMaterial) m.castShadow = true; });
    inst.root.add(v);
    // vehicles the story moves, flashes or lights stay live objects; everything else is merged
    if(a.glow || a.shadow === 'live' || a.keep) inst.dyn[name] = v; else still.push(v);
  }
  VEH.batch(inst.root, still);
};


/* =========================================================================
   NACECA · systems/envart.js  (v9)
   Generic loader for the light-baked mission environments. Each scene ships
   as a meshopt GLB (geometry + lightmap UVs + vertex colours) and a WebP
   lightmap; surface detail comes from the shared canvas textures (MTEX), so
   the textures cost nothing in file size. Loaded per mission, on demand.
   ========================================================================= */
const ENVART = { sets:{}, mats:{}, invisible:null };
ENVART.has = function(key){ return typeof ART_INLINE !== 'undefined' && !!ART_INLINE['env_'+key+'_glb']; };
ENVART.ready = function(key){ const s = ENVART.sets[key]; return !!(s && s.ready); };
ENVART.load = function(key){
  if(!ENVART.has(key)) return Promise.resolve(null);
  if(ENVART.sets[key] && ENVART.sets[key].p) return ENVART.sets[key].p;
  const S = ENVART.sets[key] = { ready:false };
  S.p = (async ()=>{
    if(typeof VEH !== 'undefined') await VEH.load();          // the shared vehicle library (once)
    const buf = _b64ToBuf(ART_INLINE['env_'+key+'_glb']);
    if(typeof MeshoptDecoder !== 'undefined' && MeshoptDecoder.ready) await MeshoptDecoder.ready;
    const loader = new THREE.GLTFLoader(); if(typeof MeshoptDecoder !== 'undefined') loader.setMeshoptDecoder(MeshoptDecoder);
    S.gltf = await new Promise((res,rej)=>loader.parse(buf,'',res,rej));
    S.lm = await new Promise((res,rej)=>new THREE.TextureLoader().load(ART_INLINE['env_'+key+'_lm'],res,undefined,rej));
    S.lm.flipY = false; S.lm.encoding = THREE.sRGBEncoding;
    S.max = ART_INLINE['env_'+key+'_max'] || 1;
    S.meta = ART_INLINE['env_'+key+'_meta'] || { obstacles:[], blockers:[], anchors:{} };
    S.ready = true; return S;
  })().catch(e=>{ console.warn('[NACECA] environment '+key+' failed to load', e); S.failed = true; return null; });
  return S.p;
};
ENVART.texture = function(name){ return MANSION.texture(name); };
ENVART.baked = function(key, name){
  const id = key+'/'+name; if(ENVART.mats[id]) return ENVART.mats[id];
  const S = ENVART.sets[key], d = MDEF[name] || { c:'#888888' };
  const m = new THREE.MeshBasicMaterial({ color: d.c ? new THREE.Color(d.c) : 0xffffff, map: d.t ? ENVART.texture(d.t) : null,
    lightMap: S.lm, lightMapIntensity: S.max, vertexColors: !!d.vc || name === 'plain' });
  return (ENVART.mats[id] = m);
};
/* material for a separate (non-baked) object, by its material name */
ENVART.dynMat = function(key, name, src){
  const id = key+'#'+name; if(ENVART.mats[id]) return ENVART.mats[id];
  let m;
  if(name === 'glow') { m = new THREE.MeshBasicMaterial({ vertexColors:true, toneMapped:false }); m.color.setScalar(1.6); }
  else if(name === 'screen') { m = new THREE.MeshBasicMaterial({ vertexColors:true, toneMapped:false, map: ENVART.texture('screenUI') }); m.color.setScalar(1.25); }
  else if(name === 'glass') m = new THREE.MeshBasicMaterial({ color:'#7f97bd', transparent:true, opacity:0.09, depthWrite:false, side:THREE.DoubleSide });
  else if(name === 'glass_dark') m = new THREE.MeshBasicMaterial({ color:'#1a2634', transparent:true, opacity:0.42, depthWrite:false, side:THREE.DoubleSide });
  else if(!MDEF[name] && !MGLOW[name] && !MGLOWTEX[name] && src && src.color){
    // flat-coloured prop (its colour travels in the GLB material)
    m = new THREE.MeshStandardMaterial({ color: src.color.clone().convertLinearToSRGB(), roughness:0.7, metalness:0 });
  }
  else if(MGLOWTEX[name]){ const g = MGLOWTEX[name]; m = new THREE.MeshBasicMaterial({ map: ENVART.texture(g.t), toneMapped:false, fog: g.fog !== false, transparent: !!g.alpha, depthWrite: !g.alpha }); if(g.k) m.color.setScalar(g.k);
    if(g.test){ m.alphaTest = g.test; m.transparent = false; m.depthWrite = true; m.side = THREE.DoubleSide; m.toneMapped = true; m.color.set('#8a9098'); } }
  else if(MGLOW[name]) m = new THREE.MeshBasicMaterial({ color: new THREE.Color(MGLOW[name]).multiplyScalar(1.5), toneMapped:false });
  else { const d = MDEF[name] || { c:'#888888' }; m = new THREE.MeshStandardMaterial({ color: d.c ? new THREE.Color(d.c) : 0xffffff, map: d.t ? ENVART.texture(d.t) : null, roughness:0.65, metalness: d.metal || 0 }); }
  return (ENVART.mats[id] = m);
};
/* de-indexed float copy with flat normals (reads through interleaved, quantised attributes) */
ENVART.flatGeo = function(g){
  const idx = g.index, n = idx ? idx.count : g.attributes.position.count, out = new THREE.BufferGeometry();
  const den = a=>!a.normalized ? 1 : (a.array instanceof Int16Array ? 1/32767 : a.array instanceof Uint16Array ? 1/65535 : a.array instanceof Int8Array ? 1/127 : a.array instanceof Uint8Array ? 1/255 : 1);
  for(const name of ['position', 'uv']){
    const a = g.attributes[name]; if(!a) continue;
    const k = den(a), sz = a.itemSize, A = new Float32Array(n*sz);
    for(let i=0;i<n;i++){ const v = idx ? idx.getX(i) : i; A[i*sz] = a.getX(v)*k; A[i*sz+1] = a.getY(v)*k; if(sz > 2) A[i*sz+2] = a.getZ(v)*k; }
    out.setAttribute(name, new THREE.BufferAttribute(A, sz));
  }
  out.computeVertexNormals(); return out;
};
/* a soft round glow (radial alpha) on a flat marker quad: re-maps its UVs to 0..1 over its two widest axes */
ENVART.softGlow = function(o, color, strength){
  if(!o) return null;
  if(!ENVART._glowTex){ const [c,x] = _cv(128,128), g = x.createRadialGradient(64,64,2,64,64,63); g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(0.35,'rgba(255,255,255,0.55)'); g.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0,0,128,128); ENVART._glowTex = new THREE.CanvasTexture(c); }
  o.traverse(m=>{
    if(!m.isMesh) return;
    const pos = m.geometry.attributes.position, n = pos.count; m.geometry.computeBoundingBox();
    const bb = m.geometry.boundingBox, sz = [bb.max.x-bb.min.x, bb.max.y-bb.min.y, bb.max.z-bb.min.z], mn = [bb.min.x, bb.min.y, bb.min.z];
    const ax = [0,1,2].sort((a,b)=>sz[b]-sz[a]).slice(0,2), uv = new Float32Array(n*2), get = [i=>pos.getX(i), i=>pos.getY(i), i=>pos.getZ(i)];
    for(let i=0;i<n;i++){ uv[i*2] = (get[ax[0]](i)-mn[ax[0]])/Math.max(1e-6, sz[ax[0]]); uv[i*2+1] = (get[ax[1]](i)-mn[ax[1]])/Math.max(1e-6, sz[ax[1]]); }
    m.geometry = m.geometry.clone(); m.geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    m.material = new THREE.MeshBasicMaterial({ map:ENVART._glowTex, color:new THREE.Color(color).multiplyScalar(strength || 1.4), transparent:true, opacity:0.5,
      blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false, side:THREE.DoubleSide });
    m.renderOrder = 2;
  });
  return o;
};
/* builds a fresh instance of a scene: {root, dyn:{name:object}, meta} */
ENVART.instantiate = function(key){
  const S = ENVART.sets[key]; const root = S.gltf.scene.clone(true); const dyn = {};
  root.traverse(o=>{
    if(o.name) dyn[o.name] = dyn[o.name] || o;
    if(!o.isMesh) return;
    const mn = (o.material && o.material.name) || '';
    if(o.geometry.attributes.uv2){ o.material = ENVART.baked(key, mn); o.castShadow = false; o.receiveShadow = false; o.matrixAutoUpdate = false; o.updateMatrix(); return; }
    o.material = ENVART.dynMat(key, mn, o.material);
    if(o.material.isMeshStandardMaterial && !o.geometry.attributes.normal) o.geometry = ENVART.flatGeo(o.geometry);   // moving props ship without normals
    if(mn === 'glass' || mn === 'glass_dark' || mn === 'glow' || mn === 'screen') o.renderOrder = (mn === 'glass' || mn === 'glass_dark') ? 2 : 1;
  });
  return { root, dyn, meta:S.meta };
};
/* ------------------------------------------------------------------------
   dressScene: the mission's original builder has already placed the
   gameplay (interactables, NPCs, triggers, minimap). This swaps its block
   geometry and toon lighting for the baked environment, keeps every object
   the mission logic references (hidden), and sets up collision + camera.
   ------------------------------------------------------------------------ */
function dressScene(key, cfg){
  cfg = cfg || {};
  const scene = ENGINE.scene, S = ENVART.sets[key];
  if(!scene || !S || !S.ready) return null;
  if(!ENVART.invisible){ ENVART.invisible = new THREE.MeshBasicMaterial({ visible:false }); }
  const anchors = new Set();
  // interactables nested in moving groups were measured in their parent's space: pin them to world positions
  scene.updateMatrixWorld(true);
  const isCharObj = o=>{ for(let p=o; p; p=p.parent){ if(p.userData && (p.userData._rig || p.userData._skinned)) return true; } return false; };
  for(const it of ENGINE.interactables){
    const m = it.mesh; if(!m) continue;
    if(m.parent && m.parent !== scene && !isCharObj(m) && !(cfg.keepNested)){
      const a = new THREE.Object3D(); m.getWorldPosition(a.position); a.userData._for = m; it._orig = m; it.mesh = a; anchors.add(m);
    } else anchors.add(m);
  }
  const keep = new Set(cfg.keep || []);
  const isChar = o=>{ for(let p=o; p; p=p.parent){ if(p.userData && (p.userData._rig || p.userData._skinned)) return true; } return false; };
  const removeLights = [];
  scene.traverse(o=>{
    if(o === scene || isChar(o) || keep.has(o)) return;
    if(o.isLight){ if(!(cfg.keepLight && cfg.keepLight(o))) removeLights.push(o); return; }
    if(cfg.dust && o.isPoints && o.userData && o.userData._dust) return;   // harmattan haze stays
    if(o.isMesh || o.isPoints || o.isSprite || o.isLine){
      if(anchors.has(o)) o.material = ENVART.invisible;      // still the interaction anchor
      else o.visible = false;
    }
  });
  removeLights.forEach(l=>{ l.intensity = 0; l.visible = false; if(l.parent) l.parent.remove(l); });
  const inst = ENVART.instantiate(key); scene.add(inst.root);
  if(typeof VEH !== 'undefined') VEH.populate(inst, cfg);    // parked and story vehicles from the scene's anchors
  sceneLook(key);
  if(cfg.bg) scene.background = new THREE.Color(cfg.bg);
  if(cfg.fog) scene.fog = new THREE.Fog(cfg.fog[0], cfg.fog[1], cfg.fog[2]);
  // lights for characters and loose props (the environment itself is baked)
  const gfx = (typeof currentGfx==='function') ? currentGfx() : 'medium';
  const L = cfg.lights || {};
  let followKey = null, keyOff = null;
  scene.add(new THREE.HemisphereLight(L.sky || '#c9d4ee', L.ground || '#2a2420', L.hemi != null ? L.hemi : 0.55));
  if(L.key){
    const k = new THREE.DirectionalLight(L.key[0], L.key[1]); k.position.set(...L.key[2]); k.target.position.set(...(L.key[3] || [0,0,0]));
    scene.add(k, k.target);
    if(L.shadow && L.shadow.follow){ followKey = k; keyOff = new THREE.Vector3().subVectors(k.position, k.target.position); }
    if(gfx !== 'low' && L.shadow){
      k.castShadow = true; const r = L.shadow.r || 12; k.shadow.mapSize.set(gfx==='high'?2048:1024, gfx==='high'?2048:1024);
      Object.assign(k.shadow.camera, { left:-r, right:r, top:r, bottom:-r, near:0.5, far:L.shadow.far || 40 }); k.shadow.bias = -0.0006; k.shadow.normalBias = 0.02;
      const c = L.shadow.catcher || [0,0,40,40];
      const catcher = new THREE.Mesh(new THREE.PlaneGeometry(c[2], c[3]), new THREE.ShadowMaterial({ opacity:L.shadow.opacity || 0.3 }));
      catcher.rotation.x = -Math.PI/2; catcher.position.set(c[0], 0.004, c[1]); catcher.receiveShadow = true; scene.add(catcher);
    }
  }
  for(const p of (L.points || [])){
    if(p.hi && gfx === 'low') continue;
    const pl = new THREE.PointLight(p.c, p.i, p.d || 8, 2); pl.position.set(...p.pos); scene.add(pl);
    if(p.name) inst.dyn['L_'+p.name] = pl;
  }
  // collision + camera
  const meta = inst.meta || {};
  for(const o of (meta.obstacles || [])) addObstacle(o[0], o[1], o[2], o[3]);
  const solids = [];
  const inv = new THREE.MeshBasicMaterial({ visible:false, side:THREE.DoubleSide });
  for(const b of (meta.blockers || [])){
    const m = new THREE.Mesh(new THREE.BoxGeometry(b[3], b[4], b[5]), inv); m.position.set(b[0], b[1], b[2]); m.updateMatrixWorld(); scene.add(m); solids.push(m);
  }
  setCameraSolids(solids);
  const bA = meta.anchors && meta.anchors.bounds;
  if(bA && cfg.useBounds !== false) ENGINE.bounds = { minX:bA.minX, maxX:bA.maxX, minZ:bA.minZ, maxZ:bA.maxZ };
  if(cfg.ceilingY){ ENGINE.ceilingY = cfg.ceilingY; ENGINE.inside = cfg.inside || (()=>true); }
  ENGINE.camera.near = 0.15; ENGINE.camera.updateProjectionMatrix();
  ENGINE._dress = { key, inst, D:inst.dyn, meta, t:0, sun:followKey, sunOff:keyOff };
  return ENGINE._dress;
}
/* the shadow-casting key light rides along with the player so its small shadow map stays sharp */
ENVART.follow = function(){
  const d = ENGINE._dress, k = d && d.sun, p = ENGINE.player; if(!k || !p) return;
  k.target.position.set(p.position.x, 0, p.position.z); k.position.copy(k.target.position).add(d.sunOff); k.target.updateMatrixWorld();
};


/* =========================================================================
   NACECA · systems/mtex_v9.js — canvas-painted surfaces for the v9 scenes.
   Painted at load time, so they add nothing to the download.
   ========================================================================= */
(function(){
  const N = (x,w,h,a,al,seed,sz)=>_noise(x,w,h,a,al,seed,sz);
  const T = (c,rep)=>_tex(c,rep);
  const txt = (x, s, X, Y, font, col, align)=>{ x.font = font; x.fillStyle = col; x.textAlign = align || 'left'; x.textBaseline = 'alphabetic'; x.fillText(s, X, Y); };
  Object.assign(MTEX, {
    /* ---------- HQ ---------- */
    carpet(){ const S=512,[c,x]=_cv(S,S), r=_rng(201);
      for(let ty=0;ty<4;ty++) for(let tx=0;tx<4;tx++){
        const b=58+r()*8|0, rot=(tx+ty)%2; x.fillStyle=`rgb(${b-4},${b+2},${b+16})`; x.fillRect(tx*128,ty*128,128,128);
        x.strokeStyle=`rgba(${rot?20:120},${rot?26:132},${rot?40:150},0.18)`; x.lineWidth=1;
        for(let k=0;k<128;k+=3){ x.beginPath(); if(rot){ x.moveTo(tx*128+k,ty*128); x.lineTo(tx*128+k,ty*128+128);} else { x.moveTo(tx*128,ty*128+k); x.lineTo(tx*128+128,ty*128+k);} x.stroke(); }
      }
      N(x,S,S,26000,0.10,202,1.5); x.fillStyle='rgba(0,0,0,0.18)'; for(let i=0;i<=4;i++){ x.fillRect(i*128-1,0,1.5,S); x.fillRect(0,i*128-1,S,1.5); }
      return T(c,true); },
    vinyl(){ const W=512,H=512,[c,x]=_cv(W,H), r=_rng(211); const pw=W/6;
      for(let i=0;i<6;i++){ let y0=-(r()*H); while(y0<H){ const L=H*0.62+r()*H*0.3, b=150+r()*28|0; x.fillStyle=`rgb(${b},${b-10},${b-24})`; x.fillRect(i*pw,y0,pw,L);
          for(let k=0;k<14;k++){ x.strokeStyle=`rgba(80,60,40,${0.05+r()*0.08})`; x.lineWidth=0.6+r(); x.beginPath(); const xx=i*pw+r()*pw; x.moveTo(xx,y0); x.lineTo(xx+(r()-0.5)*6,y0+L); x.stroke(); }
          x.fillStyle='rgba(30,22,14,0.45)'; x.fillRect(i*pw,y0,pw,1.5); y0+=L; } }
      x.fillStyle='rgba(30,22,14,0.35)'; for(let i=0;i<=6;i++) x.fillRect(i*pw-0.75,0,1.5,H);
      N(x,W,H,9000,0.05,212,1.5); return T(c,true); },
    paint(){ const S=256,[c,x]=_cv(S,S); x.fillStyle='#c4c7cb'; x.fillRect(0,0,S,S); N(x,S,S,9000,0.035,221,2); N(x,S,S,500,0.02,222,10); return T(c,true); },
    fabricPanel(){ const S=256,[c,x]=_cv(S,S); x.fillStyle='#22304e'; x.fillRect(0,0,S,S); x.strokeStyle='rgba(255,255,255,0.025)'; for(let i=0;i<S;i+=2){ x.beginPath(); x.moveTo(i,0); x.lineTo(i,S); x.stroke(); } N(x,S,S,7000,0.06,231,1.5); return T(c,true); },
    ceilingTile(){ const S=512,[c,x]=_cv(S,S), r=_rng(241); x.fillStyle='#dcdcd6'; x.fillRect(0,0,S,S);
      for(let i=0;i<3000;i++){ x.fillStyle=`rgba(90,90,85,${0.08+r()*0.18})`; x.fillRect(r()*S,r()*S,1+r()*3,1); }
      x.fillStyle='#e9e9e4'; for(let i=0;i<=2;i++){ x.fillRect(i*256-3,0,6,S); x.fillRect(0,i*256-3,S,6); }
      x.fillStyle='rgba(0,0,0,0.12)'; for(let i=0;i<=2;i++){ x.fillRect(i*256+3,0,1,S); x.fillRect(0,i*256+3,S,1); } return T(c,true); },
    concrete(){ const S=512,[c,x]=_cv(S,S), r=_rng(251); x.fillStyle='#9d9b96'; x.fillRect(0,0,S,S); N(x,S,S,30000,0.07,252,1.5); N(x,S,S,800,0.04,253,18);
      for(let i=0;i<6;i++){ x.fillStyle=`rgba(60,58,54,${0.05+r()*0.06})`; x.beginPath(); x.arc(r()*S,r()*S,20+r()*60,0,7); x.fill(); }
      x.fillStyle='rgba(50,48,44,0.25)'; x.fillRect(0,S/2-1,S,2); x.fillRect(S/2-1,0,2,S); for(const [px,py] of [[64,64],[448,64],[64,448],[448,448]]){ x.beginPath(); x.arc(px,py,4,0,7); x.fill(); } return T(c,true); },
    woodLight(){ const W=256,H=512,[c,x]=_cv(W,H), r=_rng(261); x.fillStyle='#8a5c38'; x.fillRect(0,0,W,H);
      for(let i=0;i<60;i++){ const xx=r()*W; x.strokeStyle=`rgba(${r()<0.5?60:150},${r()<0.5?36:100},${r()<0.5?18:60},${0.12+r()*0.2})`; x.lineWidth=0.6+r()*2; x.beginPath(); x.moveTo(xx,0); let px=xx; for(let y=0;y<=H;y+=16){ px+=(r()-0.5)*3; x.lineTo(px,y);} x.stroke(); }
      N(x,W,H,3000,0.05,262,1.5); return T(c,true); },
    blinds(){ const S=128,[c,x]=_cv(S,S); for(let y=0;y<S;y+=8){ const g=x.createLinearGradient(0,y,0,y+8); g.addColorStop(0,'#e6e8ea'); g.addColorStop(0.7,'#b9bcbf'); g.addColorStop(1,'#8e9295'); x.fillStyle=g; x.fillRect(0,y,S,8);} return T(c,true); },
    corkboard(seed){ seed = seed || 271; const W=1024,H=480,[c,x]=_cv(W,H), r=_rng(seed);
      x.fillStyle='#9c7448'; x.fillRect(0,0,W,H);
      for(let i=0;i<26000;i++){ const b=r(); x.fillStyle=`rgba(${b<0.5?70:190},${b<0.5?45:140},${b<0.5?20:90},${0.18+r()*0.3})`; x.fillRect(r()*W,r()*H,1+r()*2.5,1+r()*2.5); }
      const items=[]; const names=['OBI "CHIEF"','MUSA','KC','IFEANYI','THE COURIER','TUNDE (CI)','UNKNOWN','OSARO'];
      for(let i=0;i<11;i++){
        const w = 80+r()*70, h = w*(r()<0.5?1.25:0.8), X = 40+r()*(W-w-80), Y = 30+r()*(H-h-50), rot=(r()-0.5)*0.16;
        items.push([X+w/2,Y+12]);
        x.save(); x.translate(X+w/2,Y+h/2); x.rotate(rot); x.translate(-w/2,-h/2);
        x.fillStyle='rgba(0,0,0,0.35)'; x.fillRect(4,5,w,h);
        if(i%3===0){ x.fillStyle='#f1ede2'; x.fillRect(0,0,w,h); x.fillStyle='#2a2a30'; x.fillRect(8,8,w-16,h*0.62);
          x.fillStyle='#4a3a30'; x.beginPath(); x.arc(w/2,h*0.3,w*0.16,0,7); x.fill(); x.fillRect(w*0.3,h*0.42,w*0.4,h*0.25);
          txt(x,names[(i/3|0)%names.length],w/2,h*0.86,'bold 11px Arial','#1a1a1a','center'); }
        else if(i%3===1){ x.fillStyle='#ece6d6'; x.fillRect(0,0,w,h); x.fillStyle='rgba(30,30,40,0.55)'; for(let k=14;k<h-8;k+=7) x.fillRect(8,k,(w-16)*(0.5+r()*0.5),2);
          x.fillStyle='#b02020'; x.fillRect(8,6,w*0.4,4); }
        else { x.fillStyle='#f0d860'; x.fillRect(0,0,w*0.8,w*0.8); x.fillStyle='rgba(40,40,60,0.7)'; for(let k=14;k<w*0.7;k+=8) x.fillRect(6,k,w*0.6*(0.4+r()*0.6),2); }
        x.restore();
      }
      x.strokeStyle='rgba(190,20,25,0.9)'; x.lineWidth=2.2;
      for(let i=0;i<9;i++){ const a=items[(r()*items.length)|0], b=items[(r()*items.length)|0]; if(a===b) continue; x.beginPath(); x.moveTo(...a); x.quadraticCurveTo((a[0]+b[0])/2,(a[1]+b[1])/2+18,...b); x.stroke(); }
      for(const p of items){ x.fillStyle=r()<0.6?'#d42020':'#e8c020'; x.beginPath(); x.arc(p[0],p[1],5,0,7); x.fill(); x.fillStyle='rgba(255,255,255,0.6)'; x.beginPath(); x.arc(p[0]-1.5,p[1]-1.5,1.6,0,7); x.fill(); }
      return T(c,false); },
    corkboard2(){ return MTEX.corkboard(281); },
    crest(){ const W=512,H=300,[c,x]=_cv(W,H); x.fillStyle='#14203a'; x.fillRect(0,0,W,H);
      const cx=W/2, cy=128; x.fillStyle='#d8a64a'; x.beginPath(); x.moveTo(cx,cy-96); x.lineTo(cx+78,cy-66); x.lineTo(cx+78,cy+10); x.quadraticCurveTo(cx+78,cy+70,cx,cy+104); x.quadraticCurveTo(cx-78,cy+70,cx-78,cy+10); x.lineTo(cx-78,cy-66); x.closePath(); x.fill();
      x.fillStyle='#14203a'; x.beginPath(); x.moveTo(cx,cy-80); x.lineTo(cx+64,cy-56); x.lineTo(cx+64,cy+8); x.quadraticCurveTo(cx+64,cy+58,cx,cy+88); x.quadraticCurveTo(cx-64,cy+58,cx-64,cy+8); x.lineTo(cx-64,cy-56); x.closePath(); x.fill();
      txt(x,'NACECA',cx,cy+14,'bold 34px Oswald, Impact, Arial Narrow, sans-serif','#d8a64a','center');
      x.strokeStyle='#d8a64a'; x.lineWidth=4; x.beginPath(); x.moveTo(cx-34,cy+38); x.lineTo(cx,cy+56); x.lineTo(cx+34,cy+38); x.stroke(); x.beginPath(); x.arc(cx,cy-40,7,0,7); x.fillStyle='#d8a64a'; x.fill();
      txt(x,'NATIONAL ANTI-CYBERCRIME & ECONOMIC CRIMES AGENCY',cx,H-26,'bold 15px Arial','#c9b48a','center');
      return T(c,false); },

    /* ---------- outdoor / market ---------- */
    laterite(){ const S=512,[c,x]=_cv(S,S), r=_rng(401); x.fillStyle='#b07a52'; x.fillRect(0,0,S,S);
      for(let i=0;i<40;i++){ x.fillStyle=`rgba(${r()<0.5?90:200},${r()<0.5?50:140},${r()<0.5?30:100},${0.06+r()*0.1})`; x.beginPath(); x.ellipse(r()*S,r()*S,20+r()*90,10+r()*40,r()*3,0,7); x.fill(); }
      N(x,S,S,40000,0.10,402,1.5); for(let i=0;i<500;i++){ x.fillStyle=`rgba(40,28,20,${0.2+r()*0.3})`; x.fillRect(r()*S,r()*S,1+r()*3,1+r()*2); }
      for(let i=0;i<60;i++){ x.fillStyle=`rgba(${r()<0.5?230:60},${r()<0.5?220:90},${r()<0.5?200:200},${0.3+r()*0.4})`; x.fillRect(r()*S,r()*S,2+r()*4,1+r()*3); }
      return T(c,true); },
    asphalt(){ const S=512,[c,x]=_cv(S,S), r=_rng(411); x.fillStyle='#4a4a4c'; x.fillRect(0,0,S,S); N(x,S,S,60000,0.12,412,1.2);
      for(let i=0;i<30;i++){ x.fillStyle=`rgba(20,20,22,${0.04+r()*0.08})`; x.beginPath(); x.ellipse(r()*S,r()*S,10+r()*44,6+r()*22,r()*3,0,7); x.fill(); }
      for(let i=0;i<300;i++){ x.fillStyle=`rgba(${r()<0.5?160:20},${r()<0.5?160:20},${r()<0.5?150:22},${0.12+r()*0.2})`; x.fillRect(r()*S,r()*S,1+r()*2,1+r()*2); }
      x.strokeStyle='rgba(20,20,20,0.35)'; x.lineWidth=1; for(let i=0;i<8;i++){ x.beginPath(); let px=r()*S,py=r()*S; x.moveTo(px,py); for(let k=0;k<8;k++){ px+=(r()-0.5)*40; py+=(r()-0.5)*40; x.lineTo(px,py);} x.stroke(); }
      x.fillStyle='rgba(220,200,120,0.55)'; for(let y=0;y<S;y+=128) x.fillRect(S/2-4,y,8,64);
      return T(c,true); },
    plasterAged(){ const S=512,[c,x]=_cv(S,S), r=_rng(421); x.fillStyle='#e6e0d6'; x.fillRect(0,0,S,S); N(x,S,S,20000,0.06,422,2); N(x,S,S,600,0.04,423,16);
      for(let i=0;i<26;i++){ const X=r()*S; const g=x.createLinearGradient(0,0,0,S); g.addColorStop(0,'rgba(60,50,40,0)'); g.addColorStop(1,`rgba(60,50,40,${0.1+r()*0.15})`); x.fillStyle=g; x.fillRect(X,r()*S*0.5,2+r()*10,S); }
      const gb=x.createLinearGradient(0,S*0.78,0,S); gb.addColorStop(0,'rgba(90,60,40,0)'); gb.addColorStop(1,'rgba(90,60,40,0.35)'); x.fillStyle=gb; x.fillRect(0,S*0.78,S,S*0.22);
      return T(c,true); },
    shutter(){ const S=256,[c,x]=_cv(S,S); for(let y=0;y<S;y+=12){ const g=x.createLinearGradient(0,y,0,y+12); g.addColorStop(0,'#b8bcc0'); g.addColorStop(0.5,'#8a8e92'); g.addColorStop(1,'#5e6266'); x.fillStyle=g; x.fillRect(0,y,S,12);} N(x,S,S,4000,0.08,431,2);
      x.fillStyle='rgba(120,70,30,0.25)'; for(let i=0;i<8;i++) x.fillRect(Math.random()*S,0,3,S); return T(c,true); },
    corrugated(){ const S=256,[c,x]=_cv(S,S); for(let i=0;i<S;i+=16){ const g=x.createLinearGradient(i,0,i+16,0); g.addColorStop(0,'#9aa0a6'); g.addColorStop(0.5,'#d8dce0'); g.addColorStop(1,'#7a8086'); x.fillStyle=g; x.fillRect(i,0,16,S);} N(x,S,S,3000,0.06,441,2); return T(c,true); },
    corrugatedRust(){ const S=256,[c,x]=_cv(S,S), r=_rng(451); for(let i=0;i<S;i+=16){ const g=x.createLinearGradient(i,0,i+16,0); g.addColorStop(0,'#7a5a44'); g.addColorStop(0.5,'#b08a6a'); g.addColorStop(1,'#5a3a28'); x.fillStyle=g; x.fillRect(i,0,16,S);}
      for(let i=0;i<30;i++){ x.fillStyle=`rgba(${120+r()*60|0},${50+r()*30|0},20,${0.2+r()*0.3})`; x.beginPath(); x.ellipse(r()*S,r()*S,6+r()*30,4+r()*20,0,0,7); x.fill(); } return T(c,true); },
    signsMarket(){ const W=1024,H=1024,[c,x]=_cv(W,H), r=_rng(461), RH=H/16;
      const rows=[['NACECA','#0b1a3a','#d8a64a'],['PHONES · SIM · RECHARGE','#1a3a8a','#ffffff'],['IKEJA MARKET — BUY NAIJA, GROW NAIJA','#1d6a3a','#ffffff'],
        ['IYA BOLA PROVISIONS','#c8382a','#fff4d0'],['GOD’S GRACE ELECTRONICS','#1a4aa0','#ffffff'],['ADEX PHONES & ACCESSORIES','#f0c020','#1a1a1a'],['MAMA T KITCHEN','#2a7a3a','#fff4d0'],
        ['BLESSED FABRICS & LACE','#8a2a8a','#ffffff'],['OLUWASEUN CHEMIST','#e8e8e0','#1a5a2a'],['NO WAHALA BARBING SALON','#1a1a1a','#f0c040'],['FAITH POS · TRANSFER','#d06020','#ffffff'],
        ['ALHAJI SALISU & SONS','#e0d0a0','#5a2a1a'],['TOPMOST CHOPS & DRINKS','#c02030','#ffffff'],['EMEKA SPARE PARTS','#2a2a6a','#ffd040'],['JESUS IS LORD AUTOS','#f2efe6','#a01818'],['IFE PRINTS & COPIES','#1a8a8a','#ffffff']];
      // row 0 = bottom of the atlas (uv v 0..1/16) in uv space; canvas y is flipped (flipY false => v=0 at the top row)
      const ordered = rows.slice(3).concat([rows[2], rows[1], rows[0]]);   // canvas rows 0-12 shops, 13 banner, 14 phone stand, 15 van
      ordered.forEach((rw,i)=>{ const y=i*RH; x.fillStyle=rw[1]; x.fillRect(0,y,W,RH); x.strokeStyle='rgba(0,0,0,0.35)'; x.lineWidth=4; x.strokeRect(2,y+2,W-4,RH-4);
        const fs = i===15 ? 46 : (rw[0].length>24 ? 34 : 40); x.font=`bold ${fs}px Oswald, Impact, Arial Narrow, sans-serif`; x.fillStyle=rw[2]; x.textAlign='center'; x.textBaseline='middle'; x.fillText(rw[0],W/2,y+RH/2+2);
        N(x,W,RH,800,0.08,470+i,2); });
      return T(c,false); },
    tarp(){ const S=256,[c,x]=_cv(S,S); x.fillStyle='#f0f0f0'; x.fillRect(0,0,S,S); x.fillStyle='rgba(0,0,0,0.06)'; for(let i=0;i<S;i+=32) x.fillRect(i,0,16,S); N(x,S,S,5000,0.06,481,2); return T(c,true); },
    planks(){ const W=256,H=256,[c,x]=_cv(W,H), r=_rng(491); for(let i=0;i<8;i++){ const b=110+r()*40|0; x.fillStyle=`rgb(${b},${b*0.72|0},${b*0.48|0})`; x.fillRect(0,i*32,W,31); x.fillStyle='rgba(30,20,10,0.5)'; x.fillRect(0,i*32+31,W,1);
        for(let k=0;k<6;k++){ x.strokeStyle=`rgba(60,40,20,${0.1+r()*0.15})`; x.beginPath(); x.moveTo(0,i*32+r()*30); x.lineTo(W,i*32+r()*30); x.stroke(); } } N(x,W,H,3000,0.06,492,2); return T(c,true); },
    weave(){ const S=128,[c,x]=_cv(S,S); x.fillStyle='#c8b080'; x.fillRect(0,0,S,S); for(let i=0;i<S;i+=8) for(let j=0;j<S;j+=8){ x.fillStyle=((i+j)/8)%2?'rgba(120,90,40,0.35)':'rgba(255,240,200,0.2)'; x.fillRect(i,j,8,8);} return T(c,true); },
    wax(){ const S=256,[c,x]=_cv(S,S), r=_rng(501); x.fillStyle='#d8a040'; x.fillRect(0,0,S,S);
      for(let i=0;i<5;i++) for(let j=0;j<5;j++){ x.fillStyle=['#1a3a8a','#b02020','#1a6a3a'][(i+j)%3]; x.beginPath(); x.arc(i*52+26,j*52+26,18,0,7); x.fill(); x.fillStyle='#f0e0b0'; x.beginPath(); x.arc(i*52+26,j*52+26,7,0,7); x.fill(); }
      return T(c,true); },
    blockWall(){ const S=256,[c,x]=_cv(S,S), r=_rng(511); x.fillStyle='#a8a49c'; x.fillRect(0,0,S,S);
      for(let y=0;y<S;y+=32) for(let k=(y/32%2)*32; k<S+64; k+=64){ x.strokeStyle='rgba(60,58,54,0.45)'; x.lineWidth=2; x.strokeRect(k-64,y,64,32);} N(x,S,S,6000,0.08,512,2); return T(c,true); },
    skylineDusk(){ const W=2048,H=512,[c,x]=_cv(W,H), r=_rng(521);
      const g=x.createLinearGradient(0,0,0,H); g.addColorStop(0,'#1a2448'); g.addColorStop(0.5,'#4a3a68'); g.addColorStop(0.78,'#c86a4a'); g.addColorStop(1,'#e8955a'); x.fillStyle=g; x.fillRect(0,0,W,H);
      for(let layer=0;layer<2;layer++){ let px=0; while(px<W){ const w=40+r()*120, h=(layer?110:60)*(0.5+r()*1.0); const top=H*0.9-h;
        x.fillStyle=layer?'#1a1420':'#2a2030'; x.fillRect(px,top,w,H-top);
        if(r()<0.4){ x.fillStyle='#1a1420'; x.fillRect(px+w*0.4,top-30,4,30); }
        for(let wy=top+6; wy<H*0.9; wy+=10) for(let wx=px+4; wx<px+w-4; wx+=8){ if(r()<0.18){ x.fillStyle=`rgba(255,${180+r()*60|0},${100+r()*50|0},${0.4+r()*0.5})`; x.fillRect(wx,wy,3,4);} }
        px+=w+r()*10; } }
      x.fillStyle='#120e14'; x.fillRect(0,H*0.9,W,H*0.1); return T(c,false); },
    screenUI(){ const S=256,[c,x]=_cv(S,S), r=_rng(291); x.fillStyle='#0d1830'; x.fillRect(0,0,S,S);
      x.fillStyle='#1d3a6a'; x.fillRect(0,0,S,14); for(let i=0;i<5;i++){ x.fillStyle=`rgba(120,170,255,${0.25+r()*0.4})`; x.fillRect(8,24+i*44,S*0.42,30); }
      for(let k=24;k<S-6;k+=7){ x.fillStyle=`rgba(${r()<0.2?255:150},${r()<0.2?200:190},255,${0.3+r()*0.4})`; x.fillRect(S*0.5,k,(S*0.45)*(0.3+r()*0.7),3); }
      return T(c,true); },
    screenMap(){ const W=1024,H=576,[c,x]=_cv(W,H), r=_rng(301);
      const g=x.createRadialGradient(W*0.5,H*0.55,40,W*0.5,H*0.55,W*0.7); g.addColorStop(0,'#0f2446'); g.addColorStop(1,'#050b18'); x.fillStyle=g; x.fillRect(0,0,W,H);
      x.strokeStyle='rgba(80,140,230,0.12)'; x.lineWidth=1; for(let i=0;i<W;i+=32){ x.beginPath(); x.moveTo(i,0); x.lineTo(i,H); x.stroke(); } for(let j=0;j<H;j+=32){ x.beginPath(); x.moveTo(0,j); x.lineTo(W,j); x.stroke(); }
      // Nigeria (stylised outline)
      const ng=[[300,470],[262,420],[268,330],[300,250],[350,170],[440,120],[560,96],[660,104],[730,150],[770,230],[760,300],[700,350],[640,380],[620,440],[560,470],[470,480],[400,500],[340,500]];
      x.beginPath(); x.moveTo(...ng[0]); for(const p of ng.slice(1)) x.lineTo(...p); x.closePath();
      x.fillStyle='rgba(40,90,170,0.35)'; x.fill(); x.strokeStyle='rgba(120,190,255,0.9)'; x.lineWidth=2.5; x.stroke();
      x.strokeStyle='rgba(120,190,255,0.25)'; x.lineWidth=1; for(let i=0;i<9;i++){ x.beginPath(); x.moveTo(300+r()*420,140+r()*300); x.lineTo(300+r()*420,140+r()*300); x.stroke(); }
      // the Niger & Benue
      x.strokeStyle='rgba(90,170,255,0.55)'; x.lineWidth=3; x.beginPath(); x.moveTo(300,200); x.quadraticCurveTo(400,300,470,330); x.quadraticCurveTo(500,400,470,470); x.stroke();
      x.beginPath(); x.moveTo(470,330); x.quadraticCurveTo(600,300,740,280); x.stroke();
      const C={LAGOS:[296,452],IKEJA:[302,436],LEKKI:[322,462],'BENIN CITY':[410,420],ASABA:[462,432],UNIBEN:[398,408],ABUJA:[520,300]};
      const route=['IKEJA','LEKKI','BENIN CITY','UNIBEN','ASABA'];
      x.strokeStyle='#ffcf6a'; x.lineWidth=4; x.setLineDash([12,8]); x.beginPath(); x.moveTo(...C[route[0]]); for(const k of route.slice(1)) x.lineTo(...C[k]); x.stroke(); x.setLineDash([]);
      for(const [k,p] of Object.entries(C)){ const hot = route.includes(k); x.fillStyle= hot?'#ffcf6a':'#8fc2ff'; x.beginPath(); x.arc(p[0],p[1],hot?8:5,0,7); x.fill();
        if(hot){ x.strokeStyle='rgba(255,207,106,0.5)'; x.lineWidth=2; x.beginPath(); x.arc(p[0],p[1],16,0,7); x.stroke(); }
        txt(x,k,p[0]+(k==='LEKKI'?14:-12),p[1]+(k==='IKEJA'?-12:(k==='LEKKI'?18:-14)),'bold 15px Arial',hot?'#ffe2a0':'#a8ccff',k==='LEKKI'?'left':'right'); }
      x.fillStyle='rgba(8,16,32,0.85)'; x.fillRect(0,0,W,52); txt(x,'OPERATION SERPENT’S ROUTE',24,36,'bold 26px Oswald, Impact, Arial Narrow, sans-serif','#ffd27a');
      txt(x,'CASE #NACECA-2026/0034  ·  LIVE',W-24,34,'bold 16px Arial','#8fc2ff','right');
      x.fillStyle='rgba(8,16,32,0.8)'; x.fillRect(W-300,H-150,280,130); x.strokeStyle='rgba(120,190,255,0.6)'; x.strokeRect(W-300,H-150,280,130);
      ['SIM CLUSTER  ·  7 HANDSETS','RANSOM CALLS  ·  23','FUNDS TRACED  ·  ₦12.4M','STATUS  ·  ACTIVE'].forEach((s,i)=>txt(x,s,W-284,H-118+i*28,'bold 15px Arial',i===3?'#ff7a7a':'#cfe2ff'));
      return T(c,false); },
    screenPhotos(){ const W=768,H=444,[c,x]=_cv(W,H), r=_rng(311); x.fillStyle='#0a1426'; x.fillRect(0,0,W,H);
      x.fillStyle='rgba(8,16,32,0.9)'; x.fillRect(0,0,W,40); txt(x,'PERSONS OF INTEREST',18,28,'bold 21px Oswald, Impact, Arial Narrow, sans-serif','#ffd27a');
      const names=['"CHIEF" OBI','MUSA K.','IFEANYI O.','UNKNOWN F.','KC (17)','THE VOICE'];
      for(let i=0;i<6;i++){ const X=18+(i%3)*250, Y=56+(i/3|0)*192, w=232, h=176;
        x.fillStyle='#12233f'; x.fillRect(X,Y,w,h); x.strokeStyle= i===5?'#ff6a6a':'rgba(120,190,255,0.6)'; x.lineWidth=2; x.strokeRect(X,Y,w,h);
        x.fillStyle='#1c2f52'; x.fillRect(X+10,Y+10,92,118);
        x.fillStyle= i===5 ? '#0a0f1a' : '#3a2a22'; x.beginPath(); x.arc(X+56,Y+52,24,0,7); x.fill(); x.fillRect(X+28,Y+80,56,48);
        if(i===5){ txt(x,'?',X+56,Y+66,'bold 36px Arial','#ff6a6a','center'); }
        txt(x,names[i],X+112,Y+32,'bold 17px Arial','#e6efff');
        for(let k=0;k<4;k++){ x.fillStyle='rgba(150,190,255,0.45)'; x.fillRect(X+112,Y+48+k*16,90*(0.4+r()*0.6),6); }
        x.fillStyle= i<3 ? 'rgba(255,207,106,0.9)' : 'rgba(255,106,106,0.9)'; x.fillRect(X+10,Y+140,w-20,22);
        txt(x, i<3?'LINKED':'AT LARGE', X+w/2, Y+156,'bold 14px Arial','#0a1426','center'); }
      return T(c,false); },
    screenData(){ const W=768,H=444,[c,x]=_cv(W,H), r=_rng(321); x.fillStyle='#08121f'; x.fillRect(0,0,W,H);
      x.fillStyle='rgba(8,16,32,0.9)'; x.fillRect(0,0,W,40); txt(x,'CALL DATA  ·  CELL 0742 UNIBEN',18,28,'bold 21px Oswald, Impact, Arial Narrow, sans-serif','#ffd27a');
      for(let i=0;i<12;i++){ const y=64+i*22; x.fillStyle=i%2?'rgba(40,70,120,0.25)':'rgba(40,70,120,0.12)'; x.fillRect(14,y-15,W*0.56,20);
        const hh=(r()*24|0), mm=(r()*60|0); txt(x,`${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}  +234 80${(r()*9|0)}${(r()*1e7|0)}  →  +234 70${(r()*1e8|0)}  ${(r()*240|0)}s`,22,y,'14px monospace', i===3||i===7?'#ffcf6a':'#a8c8ff'); }
      x.strokeStyle='#5aa0ff'; x.lineWidth=2; x.beginPath(); for(let i=0;i<300;i++){ const X=W*0.6+i*0.98, Y=120+Math.sin(i*0.2)*30*Math.sin(i*0.031)+(r()-0.5)*16; i?x.lineTo(X,Y):x.moveTo(X,Y);} x.stroke();
      for(let i=0;i<9;i++){ const h=40+r()*150; x.fillStyle= i===6?'#ff7a5a':'#3a7ad8'; x.fillRect(W*0.62+i*30,H-30-h,20,h); }
      txt(x,'HANDSET 7  ·  LAST SEEN EKOSODIN',W*0.6,H-8,'bold 13px Arial','#ff9a7a');
      return T(c,false); },
  });
  Object.assign(MDEF, {
    carpet:{t:'carpet'}, vinyl_floor:{t:'vinyl'}, wall_paint:{t:'paint'}, wall_panel:{t:'fabricPanel'}, ceiling_tile:{t:'ceilingTile'},
    corkboard:{t:'corkboard'}, corkboard2:{t:'corkboard2'}, concrete_col:{t:'concrete'}, crest:{t:'crest'}, blinds:{t:'blinds'},
    lectern_wood:{t:'wood', a:true}, bench_wood:{t:'woodLight'}, wood_slat:{t:'woodLight'},
    flag_ng:{c:'#2f8a4a'}, flag_naceca:{c:'#1b2a4c'},
    metal_grey:{c:'#71767e', metal:0.3}, plastic_white:{c:'#dcded9'}, plastic_black:{c:'#1a1b1d'}, plastic_grey:{c:'#5e6268'}, fabric_navy:{t:'velvet'},
    gold:{c:'#caa04a', metal:0.4}, red_paint:{c:'#9a2a22'}, blue_paint:{c:'#2a4f8a'}, green_paint:{c:'#2f6a3a'}, yellow_paint:{c:'#d8a63a'},
    laterite:{t:'laterite'}, asphalt:{t:'asphalt'}, kerb:{t:'concrete'}, drain:{c:'#2a2622'}, shutter:{t:'shutter'}, corrugated:{t:'corrugated'}, corrugated_rust:{t:'corrugatedRust'},
    facade_a:{t:'plasterAged', c:'#d9c09a'}, facade_b:{t:'plasterAged', c:'#c99a7a'}, facade_c:{t:'plasterAged', c:'#b9c6b0'}, facade_d:{t:'plasterAged', c:'#e6d6b6'}, facade_e:{t:'plasterAged', c:'#aab6c6'},
    signs:{t:'signsMarket'}, tarp_red:{t:'tarp', c:'#c04a3a'}, tarp_blue:{t:'tarp', c:'#3a6ab8'}, tarp_yellow:{t:'tarp', c:'#e0b04a'}, tarp_green:{t:'tarp', c:'#4aa05a'},
    tarp_purple:{t:'tarp', c:'#9050b0'}, tarp_orange:{t:'tarp', c:'#d8824a'}, planks:{t:'planks'}, mat_weave:{t:'weave'}, van_navy:{c:'#15233f'}, danfo_yellow:{c:'#e4b42c'},
    balcony_rail:{c:'#2a2c30'}, fabric_print:{t:'wax'}, block_wall:{t:'blockWall'}, phone_case:{c:'#1a1a1e'},
  });
  Object.assign(MGLOW, { shop_glow:'#ffd8a0', shop_glow_cool:'#d0e4ff', phone_screen:'#6ab0ff', exit_green:'#3cff7a', led_strip:'#f2f4ff', folder_glow:'#ffd27a', screen_glow:'#6f9cff', window_warm:'#ffcf8a', window_cool:'#a8c8ff', led_red:'#ff3030', led_green:'#40ff70', fire_glow:'#ff8a30', bulb_glow:'#ffe0b0' });
})();
const MGLOWTEX = {
  screen_map:{ t:'screenMap', k:1.0 }, screen_photos:{ t:'screenPhotos', k:1.0 }, screen_data:{ t:'screenData', k:1.0 },
  skyline:{ t:'skyline', fog:false }, skyline_dusk:{ t:'skylineDusk', fog:false },
};


/* =========================================================================
   NACECA · systems/mtex_v9b.js — painted surfaces for the exterior scenes
   (checkpoint, shrine, warehouse, tower, Ekosodin). Canvas-made at load.
   ========================================================================= */
(function(){
  const N = (x,w,h,a,al,seed,sz)=>_noise(x,w,h,a,al,seed,sz);
  const T = (c,rep)=>_tex(c,rep);
  const txt = (x, s, X, Y, font, col, align)=>{ x.font = font; x.fillStyle = col; x.textAlign = align || 'center'; x.textBaseline = 'alphabetic'; x.fillText(s, X, Y); };
  // draw f at every wrapped copy of (X,Y) that touches the tile (margin m) so repeating textures stay seamless
  const W9 = (S, X, Y, m, f)=>{ for(const dx of [-S,0,S]) for(const dy of [-S,0,S]){ const x=X+dx, y=Y+dy; if(x<-m || x>S+m || y<-m || y>S+m) continue; f(x,y); } };
  const font = (px, w)=>`${w||'bold'} ${px}px Oswald, Impact, 'Arial Narrow', sans-serif`;
  Object.assign(MTEX, {
    savanna(){ const S=512,[c,x]=_cv(S,S), r=_rng(601); x.fillStyle='#9a8656'; x.fillRect(0,0,S,S);
      for(let i=0;i<50;i++){ const red=r()<0.4, X=r()*S, Y=r()*S, a=15+r()*70, b=8+r()*40, rot=r()*3;
        x.fillStyle = red ? `rgba(160,96,58,${0.12+r()*0.2})` : `rgba(${70+r()*40|0},${60+r()*30|0},${30+r()*20|0},${0.08+r()*0.15})`;
        W9(S,X,Y,a,(px,py)=>{ x.beginPath(); x.ellipse(px,py,a,b,rot,0,7); x.fill(); }); }
      N(x,S,S,30000,0.10,602,1.5);
      for(let i=0;i<2600;i++){ const X=r()*S, Y=r()*S, L=3+r()*9, a=-Math.PI/2+(r()-0.5)*1.2, b=r();
        x.strokeStyle = b<0.6 ? `rgba(${200+r()*40|0},${170+r()*40|0},${90+r()*40|0},${0.35+r()*0.4})` : `rgba(${90+r()*30|0},${80+r()*20|0},40,${0.3+r()*0.3})`; x.lineWidth=0.8+r()*0.8;
        W9(S,X,Y,12,(px,py)=>{ x.beginPath(); x.moveTo(px,py); x.lineTo(px+Math.cos(a)*L, py+Math.sin(a)*L); x.stroke(); }); }
      for(let i=0;i<120;i++){ x.fillStyle=`rgba(${r()<0.5?220:60},${r()<0.5?200:50},${r()<0.5?170:40},${0.3+r()*0.4})`; x.fillRect(r()*S,r()*S,1.5+r()*3,1+r()*2); }
      return T(c,true); },
    burlap(){ const S=256,[c,x]=_cv(S,S), r=_rng(611); x.fillStyle='#c4ab80'; x.fillRect(0,0,S,S);
      for(let y=0;y<S;y+=4){ x.fillStyle=`rgba(${(y/4)%2?255:60},${(y/4)%2?240:45},${(y/4)%2?200:25},0.12)`; x.fillRect(0,y,S,2); }
      for(let X=0;X<S;X+=4){ x.fillStyle='rgba(70,50,25,0.14)'; x.fillRect(X,0,1.5,S); }
      N(x,S,S,6000,0.08,612,1.5);
      for(let i=0;i<10;i++){ const X=r()*S, Y=r()*S, a=10+r()*30; x.fillStyle=`rgba(90,60,30,${0.06+r()*0.1})`; W9(S,X,Y,a,(px,py)=>{ x.beginPath(); x.ellipse(px,py,a,a*0.6,0,0,7); x.fill(); }); }
      return T(c,true); },
    signsCP(){ const W=1024,H=1024,[c,x]=_cv(W,H), r=_rng(621); x.fillStyle='#2a2a2c'; x.fillRect(0,0,W,H);
      const weather=(x0,y0,w,h,seed)=>{ const rr=_rng(seed); for(let i=0;i<Math.floor(w/14);i++){ const X=x0+rr()*w; const g=x.createLinearGradient(0,y0,0,y0+h); g.addColorStop(0,'rgba(90,50,20,0)'); g.addColorStop(1,`rgba(90,50,20,${0.12+rr()*0.18})`); x.fillStyle=g; x.fillRect(X,y0+rr()*h*0.4,1+rr()*4,h); } };
      // A: AKS checkpoint board (2.4:1)
      x.fillStyle='#9a1c16'; x.fillRect(0,0,614,256); x.strokeStyle='#f4efe6'; x.lineWidth=9; x.strokeRect(14,14,586,228);
      txt(x,'AKS',307,118,font(118),'#ffffff'); txt(x,'CHECKPOINT',307,190,font(62),'#ffffff'); txt(x,'EDO STATE COMMAND · BENIN BYPASS',307,228,font(24,'600'),'#ffd8c8');
      weather(0,0,614,256,622); N(x,614,256,3000,0.06,623,2);
      // B: STOP · CHECK · GO (6.8:1)
      x.fillStyle='#f0c020'; x.fillRect(614,0,410,60); x.strokeStyle='#141414'; x.lineWidth=5; x.strokeRect(617,3,404,54); txt(x,'STOP · CHECK · GO',819,44,font(36),'#141414');
      // C: lorry header, hand-painted (7:1)
      x.fillStyle='#a4241a'; x.fillRect(614,64,410,58); x.strokeStyle='#ffd860'; x.lineWidth=3; x.strokeRect(618,68,402,50);
      x.save(); x.font=`italic bold 27px Georgia, 'Times New Roman', serif`; x.textAlign='center'; x.lineWidth=4; x.strokeStyle='#3a0a06'; x.strokeText('No Condition Is Permanent',819,103); x.fillStyle='#ffd860'; x.fillText('No Condition Is Permanent',819,103); x.restore();
      // D: Kano plate (3.1:1)
      x.fillStyle='#f2f2ea'; x.fillRect(614,128,200,64); x.strokeStyle='#1a5a2a'; x.lineWidth=4; x.strokeRect(617,131,194,58);
      txt(x,'KANO',714,146,font(13,'600'),'#1a5a2a'); txt(x,'KN 482 DAL',714,182,font(32),'#1a5a2a');
      // E: km stone (1.64:1)
      x.fillStyle='#f0eee6'; x.fillRect(824,128,200,122); txt(x,'BENIN',924,180,font(44),'#141414'); txt(x,'12 KM',924,236,font(46),'#a01a14');
      // F: GO SLOW board (2.75:1)
      x.fillStyle='#1a5a2a'; x.fillRect(0,256,704,256); x.strokeStyle='#f2f2ea'; x.lineWidth=9; x.strokeRect(14,270,676,228);
      txt(x,'GO SLOW',352,372,font(104),'#ffffff'); txt(x,'CHECKPOINT AHEAD · 200 M',352,452,font(46),'#ffffff'); weather(0,256,704,256,624);
      return T(c,false); },
    livery(){ const W=512,H=128,[c,x]=_cv(W,H); x.fillStyle='#13203c'; x.fillRect(0,0,W,H);
      x.fillStyle='#d8a64a'; x.fillRect(0,104,W,7); x.fillStyle='#b0882e'; x.fillRect(0,113,W,2);
      const cx=58, cy=56; x.fillStyle='#d8a64a'; x.beginPath(); x.moveTo(cx,cy-40); x.lineTo(cx+32,cy-28); x.lineTo(cx+32,cy+4); x.quadraticCurveTo(cx+32,cy+30,cx,cy+44); x.quadraticCurveTo(cx-32,cy+30,cx-32,cy+4); x.lineTo(cx-32,cy-28); x.closePath(); x.fill();
      x.fillStyle='#13203c'; x.beginPath(); x.moveTo(cx,cy-32); x.lineTo(cx+25,cy-22); x.lineTo(cx+25,cy+3); x.quadraticCurveTo(cx+25,cy+24,cx,cy+36); x.quadraticCurveTo(cx-25,cy+24,cx-25,cy+3); x.lineTo(cx-25,cy-22); x.closePath(); x.fill();
      txt(x,'N',cx,cy+14,font(36),'#d8a64a');
      txt(x,'NACECA',112+150,78,font(70),'#d8a64a','center'); txt(x,'NATIONAL ANTI-CYBERCRIME & ECONOMIC CRIMES AGENCY',112+150,98,font(13,'600'),'#c9b48a','center');
      return T(c,false); },
    panoSavanna(){ const W=2048,H=512,[c,x]=_cv(W,H), r=_rng(631), HZ=443, SX=W/2;
      const g=x.createLinearGradient(0,0,0,HZ); g.addColorStop(0,'#1b2150'); g.addColorStop(0.4,'#2e2f62'); g.addColorStop(0.7,'#5e4672'); g.addColorStop(0.9,'#a8625e'); g.addColorStop(1,'#d88452');
      x.fillStyle=g; x.fillRect(0,0,W,HZ);
      // warm glow toward the low sun, cool dusk on the far side
      x.save(); x.translate(SX,HZ); x.scale(2.2,1); let rg=x.createRadialGradient(0,0,4,0,0,300); rg.addColorStop(0,'rgba(255,200,120,0.95)'); rg.addColorStop(0.25,'rgba(255,150,90,0.5)'); rg.addColorStop(1,'rgba(255,120,80,0)'); x.fillStyle=rg; x.fillRect(-470,-300,940,320); x.restore();
      for(const ex of [0,W]){ x.save(); x.translate(ex,HZ); x.scale(2.4,1); rg=x.createRadialGradient(0,0,10,0,0,340); rg.addColorStop(0,'rgba(18,22,58,0.55)'); rg.addColorStop(1,'rgba(18,22,58,0)'); x.fillStyle=rg; x.fillRect(-470,-340,940,360); x.restore(); }
      // clouds: thin streaks, lit from below near the sun
      for(let i=0;i<16;i++){ const X=r()*W, Y=300+r()*120, w=80+r()*260, h=3+r()*7, d=Math.min(Math.abs(X-SX), W-Math.abs(X-SX))/(W/2);
        const col = d<0.35 ? `rgba(255,${150+r()*60|0},${100+r()*40|0},${0.25+r()*0.3})` : `rgba(${110+r()*30|0},${100+r()*30|0},${150+r()*30|0},${0.2+r()*0.25})`;
        for(const ox of [-W,0,W]){ x.fillStyle=col; x.beginPath(); x.ellipse(X+ox,Y,w,h,0,0,7); x.fill(); } }
      // sun sitting on the hills
      rg=x.createRadialGradient(SX,HZ-12,2,SX,HZ-12,70); rg.addColorStop(0,'rgba(255,244,210,1)'); rg.addColorStop(0.2,'rgba(255,220,150,0.8)'); rg.addColorStop(1,'rgba(255,180,100,0)'); x.fillStyle=rg; x.fillRect(SX-80,HZ-90,160,100);
      x.fillStyle='#fff3d0'; x.beginPath(); x.arc(SX,HZ-12,15,0,7); x.fill();
      const ridge=(base, amps, col)=>{ x.fillStyle=col; x.beginPath(); x.moveTo(0,H); for(let X=0;X<=W;X+=8){ let y=base; for(const [a,f,p] of amps) y+=a*Math.sin(2*Math.PI*f*X/W+p); x.lineTo(X,y); } x.lineTo(W,H); x.closePath(); x.fill(); };
      const hg=x.createLinearGradient(0,0,W,0); hg.addColorStop(0,'#363250'); hg.addColorStop(0.5,'#6a4658'); hg.addColorStop(1,'#363250');
      ridge(408, [[14,2,1.3],[9,5,0.4],[5,11,2.1]], hg);
      const ng=x.createLinearGradient(0,0,W,0); ng.addColorStop(0,'#211c2a'); ng.addColorStop(0.5,'#33242c'); ng.addColorStop(1,'#211c2a');
      ridge(430, [[6,3,0.7],[4,7,1.9],[2,17,0.2]], ng);
      // acacia silhouettes along the near ridge
      const ry = X=>430+6*Math.sin(2*Math.PI*3*X/W+0.7)+4*Math.sin(2*Math.PI*7*X/W+1.9)+2*Math.sin(2*Math.PI*17*X/W+0.2);
      for(let i=0;i<46;i++){ const X=r()*W, y=ry(X)+2, h=10+r()*16, w=14+r()*30, round=r()<0.3;
        for(const ox of [-W,0,W]){ const px=X+ox; if(px<-60||px>W+60) continue; x.fillStyle='#1a1318'; x.fillRect(px-1,y-h,2.2,h);
          x.beginPath(); if(round) x.arc(px,y-h-3,w*0.3,0,7); else x.ellipse(px,y-h,w/2,3+r()*3,0,0,7); x.fill(); } }
      // distant mast with its red light
      const MX=W*0.78; x.strokeStyle='#1a1318'; x.lineWidth=2; x.beginPath(); x.moveTo(MX,ry(MX)); x.lineTo(MX,300); x.stroke(); x.fillStyle='#ff3a2a'; x.beginPath(); x.arc(MX,300,2.5,0,7); x.fill();
      const gg=x.createLinearGradient(0,HZ,0,H); gg.addColorStop(0,'#2a2026'); gg.addColorStop(1,'#141014'); x.fillStyle=gg; x.fillRect(0,HZ+6,W,H-HZ-6);
      return T(c,false); },
  });
  /* ---------- Ozalla forest shrine ---------- */
  const mudBase = (x, S, r)=>{
    x.fillStyle='#a0623e'; x.fillRect(0,0,S,S);
    for(let i=0;i<70;i++){ const Y=r()*S, X=r()*S, w=60+r()*180, h=6+r()*16, l=r()<0.5; x.fillStyle=l?`rgba(220,150,100,${0.05+r()*0.08})`:`rgba(70,30,15,${0.05+r()*0.08})`; W9(S,X,Y,w,(px,py)=>{ x.beginPath(); x.ellipse(px,py,w,h,(r()-0.5)*0.15,0,7); x.fill(); }); }
    N(x,S,S,26000,0.08,701,1.5);
    for(let i=0;i<14;i++){ let X=r()*S, Y=r()*S*0.85; x.strokeStyle=`rgba(50,22,10,${0.25+r()*0.25})`; x.lineWidth=0.8+r(); x.beginPath(); x.moveTo(X,Y); for(let k=0;k<6;k++){ X+=(r()-0.5)*16; Y+=6+r()*12; x.lineTo(X,Y);} x.stroke(); }
    for(let i=0;i<30;i++){ const X=r()*S; const g=x.createLinearGradient(0,0,0,S*0.5); g.addColorStop(0,`rgba(60,30,15,${0.08+r()*0.1})`); g.addColorStop(1,'rgba(60,30,15,0)'); x.fillStyle=g; x.fillRect(X,0,2+r()*6,S*0.5); }
    const gb=x.createLinearGradient(0,S*0.84,0,S); gb.addColorStop(0,'rgba(60,32,18,0)'); gb.addColorStop(1,'rgba(60,32,18,0.55)'); x.fillStyle=gb; x.fillRect(0,S*0.84,S,S*0.16);
  };
  Object.assign(MTEX, {
    forestFloor(){ const S=512,[c,x]=_cv(S,S), r=_rng(711); x.fillStyle='#3b3826'; x.fillRect(0,0,S,S);
      for(let i=0;i<40;i++){ const X=r()*S, Y=r()*S, a=20+r()*70; x.fillStyle = r()<0.5 ? `rgba(70,90,40,${0.12+r()*0.15})` : `rgba(30,24,16,${0.12+r()*0.18})`; W9(S,X,Y,a,(px,py)=>{ x.beginPath(); x.ellipse(px,py,a,a*0.6,r()*3,0,7); x.fill(); }); }
      N(x,S,S,30000,0.08,712,1.5);
      const pal=['#7a4a22','#9a6a2a','#5a4a2a','#b08a3a','#6a5a30','#8a3a1a','#a07a3a'];
      for(let i=0;i<1100;i++){ const X=r()*S, Y=r()*S, w=3+r()*6, h=1.5+r()*3, a=r()*3.14, col=pal[(r()*pal.length)|0], al=0.55+r()*0.4;
        W9(S,X,Y,10,(px,py)=>{ x.save(); x.translate(px,py); x.rotate(a); x.globalAlpha=al; x.fillStyle=col; x.beginPath(); x.ellipse(0,0,w,h,0,0,7); x.fill(); x.globalAlpha=al*0.5; x.strokeStyle='rgba(40,25,10,1)'; x.lineWidth=0.5; x.beginPath(); x.moveTo(-w,0); x.lineTo(w,0); x.stroke(); x.restore(); }); }
      x.globalAlpha=1;
      for(let i=0;i<90;i++){ const X=r()*S, Y=r()*S, L=8+r()*24, a=r()*3.14; x.strokeStyle=`rgba(40,28,16,${0.5+r()*0.4})`; x.lineWidth=1+r()*1.2; W9(S,X,Y,30,(px,py)=>{ x.beginPath(); x.moveTo(px,py); x.lineTo(px+Math.cos(a)*L,py+Math.sin(a)*L); x.stroke(); }); }
      return T(c,true); },
    mudWall(){ const S=512,[c,x]=_cv(S,S), r=_rng(721); mudBase(x,S,r); return T(c,true); },
    mudChalk(){ const S=512,[c,x]=_cv(S,S), r=_rng(731); mudBase(x,S,r);
      x.strokeStyle='rgba(236,232,222,0.85)'; x.fillStyle='rgba(236,232,222,0.85)'; x.lineWidth=5;
      // zigzag band, dotted rows, chevrons and short dashes near the plinth
      const yb=S*0.36; x.beginPath(); for(let X=0;X<=S;X+=32){ x.lineTo(X,yb+((X/32)%2?14:-14)); } x.stroke();
      x.lineWidth=3; x.beginPath(); x.moveTo(0,yb-26); x.lineTo(S,yb-26); x.moveTo(0,yb+26); x.lineTo(S,yb+26); x.stroke();
      for(let X=8;X<S;X+=16){ x.beginPath(); x.arc(X,yb-40,3,0,7); x.fill(); x.beginPath(); x.arc(X+8,yb+40,3,0,7); x.fill(); }
      for(let X=0;X<S;X+=64){ x.beginPath(); x.moveTo(X+8,S*0.62); x.lineTo(X+32,S*0.54); x.lineTo(X+56,S*0.62); x.stroke(); }
      for(let X=10;X<S;X+=20){ x.fillRect(X,S*0.74,4,18); }
      N(x,S,S,8000,0.08,732,2); return T(c,true); },
    thatch(){ const S=512,[c,x]=_cv(S,S), r=_rng(741); x.fillStyle='#8a6c3c'; x.fillRect(0,0,S,S);
      for(let row=0; row<S; row+=48){
        for(let i=0;i<520;i++){ const X=r()*S, Y=row+r()*44, L=18+r()*34, a=Math.PI/2+(r()-0.5)*0.25, b=150+r()*70|0;
          x.strokeStyle=`rgba(${b},${b*0.8|0},${b*0.5|0},${0.5+r()*0.4})`; x.lineWidth=0.8+r()*1.2;
          W9(S,X,Y,40,(px,py)=>{ x.beginPath(); x.moveTo(px,py); x.lineTo(px+Math.cos(a)*L, py+Math.sin(a)*L); x.stroke(); }); }
        const g=x.createLinearGradient(0,row+30,0,row+48); g.addColorStop(0,'rgba(40,28,12,0)'); g.addColorStop(1,'rgba(40,28,12,0.45)'); x.fillStyle=g; x.fillRect(0,row+30,S,18); }
      N(x,S,S,9000,0.06,742,2); return T(c,true); },
    carvedWood(){ const S=256,[c,x]=_cv(S,S), r=_rng(751); x.fillStyle='#4a3020'; x.fillRect(0,0,S,S);
      for(let i=0;i<60;i++){ const X=r()*S; x.strokeStyle=`rgba(${r()<0.5?30:110},${r()<0.5?18:75},${r()<0.5?10:45},${0.15+r()*0.2})`; x.lineWidth=0.7+r()*1.5; x.beginPath(); x.moveTo(X,0); x.bezierCurveTo(X+(r()-0.5)*10,S*0.3,X+(r()-0.5)*10,S*0.7,X,S); x.stroke(); }
      for(let y=16;y<S;y+=64){ for(let X=0;X<S;X+=32){ x.lineWidth=3; x.strokeStyle='rgba(20,12,6,0.7)'; x.beginPath(); x.moveTo(X,y+2); x.lineTo(X+16,y+22); x.lineTo(X+32,y+2); x.stroke(); x.strokeStyle='rgba(150,105,65,0.55)'; x.beginPath(); x.moveTo(X,y); x.lineTo(X+16,y+20); x.lineTo(X+32,y); x.stroke(); }
        x.fillStyle='rgba(20,12,6,0.6)'; x.fillRect(0,y+30,S,3); x.fillStyle='rgba(150,105,65,0.4)'; x.fillRect(0,y+28,S,2);
        for(let X=8;X<S;X+=32){ x.fillStyle='rgba(230,225,210,0.35)'; x.beginPath(); x.arc(X+8,y+44,3,0,7); x.fill(); } }
      N(x,S,S,4000,0.08,752,2); return T(c,true); },
    bark(){ const S=256,[c,x]=_cv(S,S), r=_rng(761); x.fillStyle='#5a4c3e'; x.fillRect(0,0,S,S);
      for(let i=0;i<70;i++){ let X=r()*S; x.strokeStyle=`rgba(${r()<0.5?28:120},${r()<0.5?22:105},${r()<0.5?16:88},${0.3+r()*0.4})`; x.lineWidth=1+r()*3; x.beginPath(); x.moveTo(X,0); let Y=0; while(Y<S){ Y+=10+r()*20; X+=(r()-0.5)*6; x.lineTo(X,Y);} x.stroke(); }
      for(let i=0;i<40;i++){ const X=r()*S, Y=r()*S, a=3+r()*10; x.fillStyle=`rgba(${150+r()*40|0},${160+r()*40|0},${130+r()*30|0},${0.12+r()*0.2})`; W9(S,X,Y,a,(px,py)=>{ x.beginPath(); x.arc(px,py,a,0,7); x.fill(); }); }
      N(x,S,S,5000,0.08,762,1.5); return T(c,true); },
    panoForest(){ const W=2048,H=512,[c,x]=_cv(W,H), r=_rng(771), SX=W*0.931, GY=475;
      const g=x.createLinearGradient(0,0,0,GY); g.addColorStop(0,'#9cb0c6'); g.addColorStop(0.55,'#c8cec8'); g.addColorStop(1,'#e8dcc0'); x.fillStyle=g; x.fillRect(0,0,W,H);
      for(const ox of [-W,0,W]){ const rg=x.createRadialGradient(SX+ox,250,10,SX+ox,250,420); rg.addColorStop(0,'rgba(255,232,180,0.95)'); rg.addColorStop(0.3,'rgba(255,214,150,0.45)'); rg.addColorStop(1,'rgba(255,200,140,0)'); x.fillStyle=rg; x.fillRect(SX+ox-420,0,840,H); }
      const canopy=(base, amp, bumps, col, trunkCol, trunkW, seed, mist)=>{
        const rr=_rng(seed); const ys=[]; for(let X=0;X<=W;X+=4){ let y=base; for(const [a,f,p] of amp) y+=a*Math.sin(2*Math.PI*f*X/W+p); ys.push(y); }
        x.fillStyle=col; x.beginPath(); x.moveTo(0,H); ys.forEach((y,i)=>x.lineTo(i*4,y)); x.lineTo(W,H); x.closePath(); x.fill();
        for(let i=0;i<bumps;i++){ const X=rr()*W, y=ys[Math.min(ys.length-1,(X/4)|0)], R=14+rr()*38; for(const ox of [-W,0,W]){ x.beginPath(); x.arc(X+ox,y+R*0.4,R,0,7); x.fill(); } }
        if(trunkCol){ x.fillStyle=trunkCol; for(let i=0;i<bumps*0.6;i++){ const X=rr()*W, y=ys[Math.min(ys.length-1,(X/4)|0)]+20; const w=trunkW*(0.6+rr()*0.8); x.fillRect(X,y,w,GY-y); x.fillRect(X+(X<w?W:-W),y,w,GY-y); } }
        if(mist){ const mg=x.createLinearGradient(0,base-40,0,GY); mg.addColorStop(0,'rgba(232,236,226,0)'); mg.addColorStop(1,`rgba(232,236,226,${mist})`); x.fillStyle=mg; x.fillRect(0,base-40,W,GY-base+40); }
      };
      canopy(215, [[18,3,0.4],[10,7,1.2],[6,13,2.2]], 60, '#8fa29a', '#7d9088', 4, 772, 0.55);
      canopy(165, [[24,2,1.1],[12,5,0.3],[8,11,1.7]], 70, '#5e7662', '#4e6252', 8, 773, 0.45);
      canopy(95, [[30,3,2.0],[16,6,0.9],[10,9,0.1]], 55, '#33452f', '#2c3527', 16, 774, 0.25);
      for(const ox of [-W,0,W]){ const rg=x.createRadialGradient(SX+ox,300,10,SX+ox,300,300); rg.addColorStop(0,'rgba(255,226,170,0.55)'); rg.addColorStop(1,'rgba(255,226,170,0)'); x.fillStyle=rg; x.fillRect(SX+ox-300,0,600,H); }
      x.fillStyle='#2a2a1e'; x.fillRect(0,GY,W,H-GY);
      return T(c,false); },
    lightShaft(){ const W=64,H=256,[c,x]=_cv(W,H); const img=x.createImageData(W,H);
      for(let y=0;y<H;y++) for(let X=0;X<W;X++){ const v=y/H, ax=Math.exp(-Math.pow((X-W/2)/(W*0.22),2)), av=Math.min(1,v/0.35)*Math.min(1,(1-v)/0.15), a=ax*av*0.5, i=(y*W+X)*4;
        img.data[i]=255; img.data[i+1]=236; img.data[i+2]=196; img.data[i+3]=Math.round(a*255); }
      x.putImageData(img,0,0); const t=T(c,false); return t; },
  });
  /* ---------- Asaba warehouse ---------- */
  Object.assign(MTEX, {
    smokePuff(){ const S=128,[c,x]=_cv(S,S), r=_rng(831); x.clearRect(0,0,S,S);
      for(let i=0;i<26;i++){ const X=S/2+(r()-0.5)*S*0.5, Y=S*0.55+(r()-0.5)*S*0.45, R=S*(0.12+r()*0.18); const g=x.createRadialGradient(X,Y,1,X,Y,R); const a=0.18+r()*0.2; g.addColorStop(0,`rgba(255,255,255,${a})`); g.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=g; x.fillRect(0,0,S,S); }
      const t=T(c,false); return t; },
    whFloor(){ const S=512,[c,x]=_cv(S,S), r=_rng(801); x.fillStyle='#8e8a84'; x.fillRect(0,0,S,S);
      for(let i=0;i<40;i++){ const X=r()*S, Y=r()*S, a=20+r()*80; x.fillStyle=r()<0.5?`rgba(255,250,240,${0.03+r()*0.05})`:`rgba(40,36,30,${0.04+r()*0.07})`; W9(S,X,Y,a,(px,py)=>{ x.beginPath(); x.ellipse(px,py,a,a*0.7,r()*3,0,7); x.fill(); }); }
      N(x,S,S,36000,0.08,802,1.5);
      for(let i=0;i<7;i++){ const X=r()*S, Y=r()*S, a=8+r()*26; x.fillStyle=`rgba(20,18,16,${0.18+r()*0.2})`; W9(S,X,Y,a,(px,py)=>{ x.beginPath(); x.ellipse(px,py,a,a*0.6,r()*3,0,7); x.fill(); }); }
      for(let i=0;i<5;i++){ const Y0=r()*S, bend=(r()-0.5)*200; x.strokeStyle=`rgba(25,22,20,${0.1+r()*0.12})`; x.lineWidth=10+r()*6; x.beginPath(); x.moveTo(-20,Y0); x.quadraticCurveTo(S/2,Y0+bend,S+20,Y0+(r()-0.5)*80); x.stroke(); }
      for(let i=0;i<8;i++){ let X=r()*S, Y=r()*S; x.strokeStyle=`rgba(30,28,26,${0.35+r()*0.3})`; x.lineWidth=0.8; x.beginPath(); x.moveTo(X,Y); for(let k=0;k<7;k++){ X+=(r()-0.5)*30; Y+=(r()-0.5)*30; x.lineTo(X,Y);} x.stroke(); }
      x.fillStyle='rgba(30,28,26,0.5)'; x.fillRect(0,0,S,2); x.fillRect(0,0,2,S);
      return T(c,true); },
    crateBox(){ const S=256,[c,x]=_cv(S,S), r=_rng(811); x.fillStyle='#a8865a'; x.fillRect(0,0,S,S);
      for(let i=0;i<5;i++){ const b=150+r()*30|0; x.fillStyle=`rgb(${b},${b*0.78|0},${b*0.52|0})`; x.fillRect(0,i*51+2,S,48);
        for(let k=0;k<8;k++){ x.strokeStyle=`rgba(90,60,30,${0.12+r()*0.15})`; x.lineWidth=0.8; x.beginPath(); x.moveTo(0,i*51+4+r()*44); x.bezierCurveTo(S*0.3,i*51+r()*50,S*0.6,i*51+r()*50,S,i*51+4+r()*44); x.stroke(); } }
      x.fillStyle='rgba(50,32,16,0.75)'; for(let i=0;i<=5;i++) x.fillRect(0,i*51,S,3);
      x.fillStyle='#7a5a34'; x.fillRect(0,0,S,18); x.fillRect(0,S-18,S,18); x.fillRect(0,0,18,S); x.fillRect(S-18,0,18,S);
      x.strokeStyle='#6a4a28'; x.lineWidth=14; x.beginPath(); x.moveTo(18,18); x.lineTo(S-18,S-18); x.stroke();
      x.fillStyle='rgba(40,30,20,0.9)'; for(const [X,Y] of [[9,9],[S-9,9],[9,S-9],[S-9,S-9],[S/2,9],[S/2,S-9]]){ x.beginPath(); x.arc(X,Y,2.5,0,7); x.fill(); }
      x.save(); x.globalAlpha=0.55; txt(x,'FRAGILE',S/2,S*0.42,font(34),'#1a1410'); x.font=font(20); x.fillText('THIS WAY UP',S/2,S*0.62); x.restore();
      N(x,S,S,5000,0.08,812,1.5); return T(c,true); },
    signsWH(){ const W=1024,H=1024,[c,x]=_cv(W,H); x.fillStyle='#2a2a2c'; x.fillRect(0,0,W,H);
      x.fillStyle='#1d3a6a'; x.fillRect(0,0,1024,128); x.fillStyle='#e8a830'; x.fillRect(0,104,1024,10);
      txt(x,'DELTALINK LOGISTICS',420,74,font(64),'#ffffff'); txt(x,'ASABA · WAREHOUSE 3',860,74,font(34,'600'),'#e8c070');
      x.fillStyle='#f0c020'; x.fillRect(0,128,768,128); x.fillStyle='#141414'; for(let X=-40;X<768;X+=60){ x.beginPath(); x.moveTo(X,256); x.lineTo(X+30,256); x.lineTo(X+70,216); x.lineTo(X+40,216); x.fill(); x.beginPath(); x.moveTo(X,128); x.lineTo(X+30,128); x.lineTo(X+70,168); x.lineTo(X+40,168); x.fill(); }
      x.fillStyle='#f0c020'; x.fillRect(0,170,768,44); txt(x,'LOADING BAY 1  ·  MIND THE FORKLIFT',384,204,font(34),'#141414');
      x.fillStyle='#e8e6e0'; x.fillRect(768,128,256,85); txt(x,'OFFICE',896,186,font(46),'#1d3a6a');
      x.fillStyle='#1a8a3a'; x.fillRect(768,256,256,128); txt(x,'EXIT',896,344,font(72),'#ffffff');
      x.fillStyle='#f0eee8'; x.fillRect(0,256,512,256); x.strokeStyle='#c01818'; x.lineWidth=14; x.beginPath(); x.arc(128,384,88,0,7); x.stroke();
      x.fillStyle='#2a2a2a'; x.fillRect(66,372,104,22); x.fillStyle='#d86a2a'; x.fillRect(170,372,18,22);
      x.beginPath(); x.moveTo(66,320); x.lineTo(190,448); x.lineWidth=14; x.stroke(); txt(x,'NO',360,370,font(70),'#c01818'); txt(x,'SMOKING',360,450,font(56),'#c01818');
      return T(c,false); },
    skylineDay(){ const W=2048,H=512,[c,x]=_cv(W,H), r=_rng(821);
      const g=x.createLinearGradient(0,0,0,H); g.addColorStop(0,'#b8cce0'); g.addColorStop(0.55,'#e8dcc4'); g.addColorStop(1,'#f4d8a8'); x.fillStyle=g; x.fillRect(0,0,W,H);
      for(let layer=0;layer<2;layer++){ let px=0; while(px<W){ const w=60+r()*160, h=(layer?120:70)*(0.5+r()*1.0), top=H*0.62-h+(layer?60:0);
          x.fillStyle=layer?`rgb(${150+r()*30|0},${150+r()*25|0},${150+r()*20|0})`:`rgb(${175+r()*20|0},${178+r()*20|0},${185+r()*20|0})`; x.fillRect(px,top,w,H-top);
          for(let wy=top+8; wy<H*0.9; wy+=14) for(let wx=px+6; wx<px+w-8; wx+=12){ if(r()<0.5){ x.fillStyle=`rgba(60,70,80,${layer?0.45:0.25})`; x.fillRect(wx,wy,6,7);} }
          if(r()<0.3){ x.fillStyle=layer?'#8a8a86':'#a8acb0'; x.fillRect(px+w*0.3,top-24,w*0.3,24); }
          px+=w+r()*20; } }
      for(let i=0;i<14;i++){ const X=r()*W, Y=H*0.55+r()*60; x.strokeStyle='#4a5a3a'; x.lineWidth=4; x.beginPath(); x.moveTo(X,H); x.lineTo(X+(r()-0.5)*20,Y); x.stroke();
        for(let k=0;k<8;k++){ const a=k/8*6.28; x.fillStyle='#4a6a3a'; x.beginPath(); x.ellipse(X+Math.cos(a)*22,Y+Math.sin(a)*8,26,6,a,0,7); x.fill(); } }
      const hz=x.createLinearGradient(0,H*0.4,0,H); hz.addColorStop(0,'rgba(240,226,200,0)'); hz.addColorStop(1,'rgba(240,226,200,0.55)'); x.fillStyle=hz; x.fillRect(0,H*0.4,W,H*0.6);
      return T(c,false); },
  });
  /* ---------- Ugbowo telecom site ---------- */
  Object.assign(MTEX, {
    gravel(){ const S=512,[c,x]=_cv(S,S), r=_rng(901); x.fillStyle='#86807a'; x.fillRect(0,0,S,S);
      for(let i=0;i<30;i++){ const X=r()*S, Y=r()*S, a=20+r()*70; x.fillStyle=r()<0.5?`rgba(150,110,80,${0.06+r()*0.1})`:`rgba(40,36,32,${0.05+r()*0.1})`; W9(S,X,Y,a,(px,py)=>{ x.beginPath(); x.ellipse(px,py,a,a*0.7,r()*3,0,7); x.fill(); }); }
      for(let i=0;i<5200;i++){ const X=r()*S, Y=r()*S, a=1+r()*3.2, b=110+r()*110|0; x.fillStyle=`rgba(${b},${b*0.96|0},${b*0.9|0},${0.6+r()*0.4})`; W9(S,X,Y,5,(px,py)=>{ x.beginPath(); x.ellipse(px,py,a,a*(0.6+r()*0.4),r()*3,0,7); x.fill(); }); }
      for(let i=0;i<2500;i++){ x.fillStyle=`rgba(20,18,16,${0.25+r()*0.3})`; x.fillRect(r()*S,r()*S,1.2,1.2); }
      return T(c,true); },
    signsTW(){ const W=1024,H=1024,[c,x]=_cv(W,H); x.fillStyle='#2a2a2c'; x.fillRect(0,0,W,H);
      x.fillStyle='#f2f0ea'; x.fillRect(0,0,512,256); x.fillStyle='#1d3a6a'; x.fillRect(0,0,512,70);
      txt(x,'SITE 0417 · UGBOWO',256,48,font(38),'#ffffff'); txt(x,'TELECOM INSTALLATION',256,118,font(36),'#1d3a6a');
      txt(x,'AUTHORISED PERSONNEL ONLY',256,168,font(30),'#a01818'); txt(x,'TAMPERING IS A CRIME',256,214,font(26,'600'),'#3a3a3a');
      x.fillStyle='#f0c020'; x.fillRect(512,0,512,256); x.fillStyle='#141414'; x.beginPath(); x.moveTo(600,200); x.lineTo(660,60); x.lineTo(720,200); x.closePath(); x.fill();
      x.fillStyle='#f0c020'; x.beginPath(); x.moveTo(668,90); x.lineTo(648,140); x.lineTo(666,140); x.lineTo(652,184); x.lineTo(690,124); x.lineTo(672,124); x.lineTo(684,90); x.closePath(); x.fill();
      txt(x,'DANGER',870,120,font(64),'#141414'); txt(x,'HIGH VOLTAGE',870,190,font(40),'#141414');
      return T(c,false); },
    panoTown(){ const W=2048,H=512,[c,x]=_cv(W,H), r=_rng(911), HZ=448, SX=W*0.586;
      const g=x.createLinearGradient(0,0,0,HZ); g.addColorStop(0,'#262a50'); g.addColorStop(0.55,'#45386a'); g.addColorStop(0.85,'#a85a58'); g.addColorStop(1,'#d8784c'); x.fillStyle=g; x.fillRect(0,0,W,H);
      for(const ox of [-W,0,W]){ x.save(); x.translate(SX+ox,HZ); x.scale(2.4,1); const rg=x.createRadialGradient(0,0,4,0,0,280); rg.addColorStop(0,'rgba(255,170,100,0.8)'); rg.addColorStop(0.35,'rgba(255,130,90,0.35)'); rg.addColorStop(1,'rgba(255,110,80,0)'); x.fillStyle=rg; x.fillRect(-470,-280,940,300); x.restore(); }
      for(let i=0;i<12;i++){ const X=r()*W, Y=320+r()*90, w=90+r()*240, h=3+r()*6; for(const ox of [-W,0,W]){ x.fillStyle=`rgba(${200+r()*40|0},${120+r()*40|0},${110+r()*30|0},${0.18+r()*0.2})`; x.beginPath(); x.ellipse(X+ox,Y,w,h,0,0,7); x.fill(); } }
      // town silhouette: two layers of low roofs, water tanks, trees, masts
      for(let layer=0;layer<2;layer++){ let px=0; const col=layer?'#1c1724':'#2c2438';
        while(px<W){ const w=30+r()*90, h=(layer?26:16)*(0.6+r()*1.0), top=HZ-h+(layer?4:-6);
          x.fillStyle=col; x.fillRect(px,top,w,HZ-top+10);
          if(r()<0.12){ x.fillRect(px+w*0.4,top-22,3,22); x.fillRect(px+w*0.4-8,top-34,19,13); }
          if(layer && r()<0.5) for(let k=0;k<3;k++){ if(r()<0.5){ x.fillStyle=`rgba(255,${190+r()*50|0},${110+r()*40|0},${0.6+r()*0.4})`; x.fillRect(px+4+r()*(w-8),top+5+r()*(h-8),2.5,2.5); x.fillStyle=col; } }
          px+=w+r()*6; } }
      for(let i=0;i<40;i++){ const X=r()*W, y=HZ-10-r()*14, R=8+r()*16; for(const ox of [-W,0,W]){ x.fillStyle='#1a1520'; x.beginPath(); x.arc(X+ox,y,R,0,7); x.fill(); } }
      for(let i=0;i<9;i++){ const X=r()*W, y=HZ-6; x.strokeStyle='#1a1520'; x.lineWidth=2; for(const ox of [-W,0,W]){ x.beginPath(); x.moveTo(X+ox,y); x.lineTo(X+ox+(r()-0.5)*8,y-34-r()*16); x.stroke(); for(let k=0;k<6;k++){ const a=k/6*6.28; x.fillStyle='#1a1520'; x.beginPath(); x.ellipse(X+ox+Math.cos(a)*10,y-44+Math.sin(a)*4,12,3,a,0,7); x.fill(); } } }
      for(const MX of [W*0.12, W*0.44, W*0.81]){ x.strokeStyle='#15121c'; x.lineWidth=2; x.beginPath(); x.moveTo(MX,HZ); x.lineTo(MX,HZ-120); x.stroke(); x.beginPath(); x.moveTo(MX-6,HZ); x.lineTo(MX,HZ-120); x.lineTo(MX+6,HZ); x.stroke(); x.fillStyle='#ff3a2a'; x.beginPath(); x.arc(MX,HZ-122,2.6,0,7); x.fill(); }
      const gg=x.createLinearGradient(0,HZ,0,H); gg.addColorStop(0,'#1c1622'); gg.addColorStop(1,'#120e14'); x.fillStyle=gg; x.fillRect(0,HZ+8,W,H-HZ-8);
      return T(c,false); },
    chainLink(){ const S=64,[c,x]=_cv(S,S); x.clearRect(0,0,S,S); x.strokeStyle='rgba(170,176,182,1)'; x.lineWidth=3.2;
      x.beginPath(); x.moveTo(0,0); x.lineTo(S,S); x.moveTo(S,0); x.lineTo(0,S); x.moveTo(-S/2,S/2); x.lineTo(S/2,S*1.5); x.moveTo(S/2,-S/2); x.lineTo(S*1.5,S/2); x.moveTo(S/2,-S/2); x.lineTo(-S/2,S/2); x.moveTo(S*1.5,S/2); x.lineTo(S/2,S*1.5); x.stroke();
      const t=T(c,true); t.repeat.set(26,20); return t; },
    lightPool(){ const S=256,[c,x]=_cv(S,S); const g=x.createRadialGradient(S/2,S/2,4,S/2,S/2,S/2); g.addColorStop(0,'rgba(255,244,214,0.9)'); g.addColorStop(0.4,'rgba(255,236,200,0.45)'); g.addColorStop(1,'rgba(255,230,190,0)'); x.fillStyle=g; x.fillRect(0,0,S,S); return T(c,false); },
  });
  /* ---------- Ekosodin at night ---------- */
  Object.assign(MTEX, {
    signsEK(){ const W=1024,H=1024,[c,x]=_cv(W,H), r=_rng(951); x.fillStyle='#2a2a2c'; x.fillRect(0,0,W,H);
      // A: painted on the compound wall
      x.fillStyle='#d8ccb4'; x.fillRect(0,0,1024,128); N(x,1024,128,6000,0.08,952,2);
      x.save(); x.font=`bold 50px 'Arial Black', Impact, sans-serif`; x.textAlign='center'; x.fillStyle='#b01818'; x.fillText('THIS HOUSE IS NOT FOR SALE',512,62); x.font=`bold 34px 'Arial Black', Impact, sans-serif`; x.fillText('BEWARE OF 419 !!',512,108);
      x.globalAlpha=0.35; for(let i=0;i<14;i++){ const X=60+r()*900; x.fillRect(X,62+r()*4,3,10+r()*24); } x.restore();
      // B, C: lodge boards
      x.fillStyle='#f2f0ea'; x.fillRect(0,128,512,128); x.strokeStyle='#1d3a8a'; x.lineWidth=6; x.strokeRect(6,134,500,116); txt(x,'DIVINE FAVOUR LODGE',256,196,font(44),'#1d3a8a'); txt(x,'SELF-CONTAIN · STUDENTS ONLY',256,236,font(22,'600'),'#a01818');
      x.fillStyle='#1d6a3a'; x.fillRect(512,128,512,128); x.strokeStyle='#f2f0ea'; x.lineWidth=6; x.strokeRect(518,134,500,116); txt(x,'PEACE COURT LODGE',768,196,font(46),'#ffffff'); txt(x,'NO VACANCY',768,236,font(24,'600'),'#ffd860');
      // D, E: kiosk
      x.fillStyle='#b02a20'; x.fillRect(0,256,512,128); txt(x,'MAMA CHIOMA PROVISIONS',256,334,font(42),'#ffd040');
      x.fillStyle='#1a4aa0'; x.fillRect(512,256,512,128); txt(x,'RECHARGE CARD · POS',768,312,font(40),'#ffffff'); txt(x,'COLD DRINKS · BREAD · INDOMIE',768,360,font(26,'600'),'#ffd040');
      // F: house number, G: street sign
      x.fillStyle='#1d3a8a'; x.fillRect(0,384,256,128); x.strokeStyle='#ffffff'; x.lineWidth=5; x.strokeRect(8,392,240,112); txt(x,'No. 14',128,470,font(58),'#ffffff');
      x.fillStyle='#1d6a3a'; x.fillRect(256,384,512,128); x.strokeStyle='#ffffff'; x.lineWidth=6; x.strokeRect(264,392,496,112); txt(x,'AKINTOLA CLOSE',512,466,font(56),'#ffffff');
      // H: crusade banner
      x.fillStyle='#f4f2ec'; x.fillRect(0,512,1024,128); x.fillStyle='#b01818'; x.fillRect(0,512,1024,12); x.fillRect(0,628,1024,12);
      txt(x,'GREAT DELIVERANCE NIGHT',512,582,font(54),'#1d3a8a'); txt(x,'FRIDAY 9PM · ALL ARE WELCOME',512,622,font(28,'600'),'#b01818');
      return T(c,false); },
    panoNight(){ const W=2048,H=512,[c,x]=_cv(W,H), r=_rng(961), HZ=448, MX=W*0.906, CX=W*0.25;
      const g=x.createLinearGradient(0,0,0,HZ); g.addColorStop(0,'#070b18'); g.addColorStop(0.6,'#101a34'); g.addColorStop(1,'#26304e'); x.fillStyle=g; x.fillRect(0,0,W,H);
      for(const ox of [-W,0,W]){ x.save(); x.translate(CX+ox,HZ); x.scale(2.6,1); const rg=x.createRadialGradient(0,0,4,0,0,240); rg.addColorStop(0,'rgba(200,120,60,0.55)'); rg.addColorStop(1,'rgba(200,120,60,0)'); x.fillStyle=rg; x.fillRect(-470,-240,940,260); x.restore(); }
      for(let i=0;i<700;i++){ const X=r()*W, Y=r()*HZ*0.75, a=r(); x.fillStyle=`rgba(255,255,${220+r()*35|0},${0.25+a*0.7})`; x.fillRect(X,Y,a<0.92?1.2:2.2,a<0.92?1.2:2.2); }
      for(const ox of [-W,0,W]){ const rg=x.createRadialGradient(MX+ox,74,6,MX+ox,74,90); rg.addColorStop(0,'rgba(220,230,255,0.55)'); rg.addColorStop(1,'rgba(220,230,255,0)'); x.fillStyle=rg; x.fillRect(MX+ox-90,0,180,170);
        x.fillStyle='#eef2ff'; x.beginPath(); x.arc(MX+ox,74,15,0,7); x.fill(); x.fillStyle='rgba(180,190,215,0.6)'; x.beginPath(); x.arc(MX+ox-4,70,4,0,7); x.fill(); x.beginPath(); x.arc(MX+ox+5,80,3,0,7); x.fill(); }
      for(let layer=0;layer<2;layer++){ let px=0; const col=layer?'#05070d':'#0c1220';
        while(px<W){ const w=36+r()*80, h=(layer?24:14)*(0.6+r()), top=HZ-h+(layer?4:-4);
          x.fillStyle=col; x.beginPath(); x.moveTo(px,HZ+10); x.lineTo(px,top+6); x.lineTo(px+w/2,top-6); x.lineTo(px+w,top+6); x.lineTo(px+w,HZ+10); x.fill();
          if(layer && r()<0.55){ x.fillStyle=`rgba(255,${180+r()*60|0},${100+r()*40|0},${0.7+r()*0.3})`; x.fillRect(px+6+r()*(w-12),top+10+r()*(h-12),3,3); }
          if(r()<0.1){ x.fillStyle=col; x.fillRect(px+w*0.6,top-24,3,20); x.fillRect(px+w*0.6-7,top-34,17,11); }
          px+=w+r()*8; } }
      for(let i=0;i<34;i++){ const X=r()*W, y=HZ-8-r()*10, R=9+r()*15; for(const ox of [-W,0,W]){ x.fillStyle='#04060b'; x.beginPath(); x.arc(X+ox,y,R,0,7); x.fill(); } }
      for(const PX of [W*0.33, W*0.71]){ x.strokeStyle='#04060b'; x.lineWidth=2; x.beginPath(); x.moveTo(PX,HZ); x.lineTo(PX,HZ-110); x.stroke(); x.fillStyle='#ff3a2a'; x.beginPath(); x.arc(PX,HZ-112,2.6,0,7); x.fill(); }
      x.fillStyle='#05060a'; x.fillRect(0,HZ+8,W,H-HZ-8);
      return T(c,false); },
  });
  Object.assign(MDEF, {
    savanna:{t:'savanna'}, burlap:{t:'burlap'}, truck_planks:{t:'planks', c:'#e0b888'}, canvas_olive:{t:'tarp', c:'#6a7a44'}, booth_wall:{t:'plasterAged', c:'#ece6d8'},
    concrete:{t:'concrete'}, signs_cp:{t:'signsCP'}, livery:{t:'livery'},
    forest_floor:{t:'forestFloor'}, mudwall:{t:'mudWall'}, mudwall_chalk:{t:'mudChalk'}, thatch:{t:'thatch'}, carved_wood:{t:'carvedWood'}, bark:{t:'bark'},
    path_dirt:{t:'laterite', c:'#c8a488'},
    wh_floor:{t:'whFloor'}, block_paint:{t:'blockWall', c:'#c4c8bc'}, roof_sheet:{t:'corrugated', c:'#a4a49e'}, crate_box:{t:'crateBox'}, signs_wh:{t:'signsWH'},
    container:{t:'corrugated', c:'#c0503a'},
    gravel:{t:'gravel'}, signs_tw:{t:'signsTW'},
    signs_ek:{t:'signsEK'}, roof_red:{t:'corrugated', c:'#9a4632'}, roof_blue:{t:'corrugated', c:'#46669a'}, roof_grey:{t:'corrugated', c:'#8a8a86'},
  });
  Object.assign(MGLOW, { osas_glow:'#ffd27a', led_blue:'#40c0ff', evidence_glow:'#ffd27a', skylight:'#fff4dc', lamp_bay:'#fff0d0', sim_glow:'#ffd27a', ember_glow:'#e8501a', lamp_glow:'#ffb060', cache_glow:'#ffd27a', pot_glow:'#ffd27a', headlight:'#fff2d6', taillight:'#ff2a1a', beacon_blue:'#3a6aff', beacon_red:'#ff3030', flood_glow:'#fff0d0', seam_glow:'#ffb050' });
  Object.assign(MGLOWTEX, { pano_savanna:{ t:'panoSavanna', fog:false }, pano_forest:{ t:'panoForest', fog:false }, light_shaft:{ t:'lightShaft', alpha:true }, skyline_day:{ t:'skylineDay', fog:false },
    pano_town:{ t:'panoTown', fog:false }, pano_night:{ t:'panoNight', fog:false }, chainlink:{ t:'chainLink', test:0.4 }, light_pool:{ t:'lightPool', alpha:true } });
})();


/* =========================================================================
   NACECA · scenes/mansion.js  (v8 — art-pass vertical slice)
   Lekki mansion living room + study, baked lighting, skinned cast, staged
   evidence interactions. Mission logic (objectives, wipe clock, dialogue,
   puzzle, arrest, escort, extraction) is unchanged from v7.
   ========================================================================= */
function _anchor(x,y,z){ const o = new THREE.Object3D(); o.position.set(x,y,z); return o; }
function buildSceneMansion(){
  if(!ART.ready) return buildSceneMansionLegacy();
  // per-operation state (also reset by mission select)
  Object.assign(S.game, { _wipeTotal:0, _wipeT:0, _wipeDone:false, _wipeLost:false, _mansionPreBriefed:false, _evLaptop:false, _evCash:false, _evSafe:false, _civChild:false, _drawerSearched:false, _obiPanic:false });
  if(S.game.moralChoices){ S.game.moralChoices.arrest = null; }
  const scene = newScene({bg:'#03050b', fog:'#060a14'});
  scene.fog.near = 30; scene.fog.far = 150;
  sceneLook('mansion');
  const inst = MANSION.instantiate(); scene.add(inst.root);
  const D = inst.dyn;
  const M = ENGINE._mansion = { inst, D, t:0, screenState:'locked', screenT:0 };
  const gfx = (typeof currentGfx==='function') ? currentGfx() : 'medium';
  // ---------- lights for characters and moving props (the room itself is baked) ----------
  scene.add(new THREE.HemisphereLight('#d9b78f', '#2a1d14', 0.55));
  const moon = new THREE.DirectionalLight('#a9c1ff', 0.6); moon.position.set(-9, 10, 1.5); moon.target.position.set(0, 0, 0);
  scene.add(moon, moon.target);
  if(gfx !== 'low'){
    moon.castShadow = true; moon.shadow.mapSize.set(gfx==='high'?2048:1024, gfx==='high'?2048:1024);
    Object.assign(moon.shadow.camera, { left:-9, right:9, top:9, bottom:-9, near:1, far:30 }); moon.shadow.bias = -0.0006; moon.shadow.normalBias = 0.02;
    const catcher = new THREE.Mesh(new THREE.PlaneGeometry(26, 34), new THREE.ShadowMaterial({ opacity:0.32 }));
    catcher.rotation.x = -Math.PI/2; catcher.position.set(0, 0.004, 3); catcher.receiveShadow = true; scene.add(catcher);
  }
  const pl = (x,y,z,c,i,d)=>{ const p = new THREE.PointLight(c, i, d, 2); p.position.set(x,y,z); scene.add(p); return p; };
  pl(-4.15,1.05,1.3,'#ffc27a',1.7,6.5);          // sofa lamp
  pl(3.28,1.05,-0.4,'#ffd59a',1.2,4.0);           // banker's lamp
  pl(-2.35,2.45,-0.4,'#ffd6a0',1.1,7.5);          // chandelier
  if(gfx !== 'low'){ pl(0,2.5,2.8,'#ffd9a8',0.9,7); pl(0,3.0,6.0,'#ffd9a8',1.2,8); pl(4.7,1.2,2.4,'#ffc27a',0.8,5); }
  M.screenLight = pl(2.88,0.98,-1.05,'#ff4458',0.0,2.6);
  // police strobes on the drive
  const red = new THREE.PointLight('#ff2030', 0, 18); red.position.set(-2.7, 1.8, 11.0); scene.add(red);
  const blue = new THREE.PointLight('#3070ff', 0, 18); blue.position.set(2.9, 1.8, 11.7); scene.add(blue);
  ENGINE._policeRed = red; ENGINE._policeBlue = blue;
  if(D.PoliceRed) D.PoliceRed.userData._policeBulbRed = true;
  if(D.PoliceBlue) D.PoliceBlue.userData._policeBulbBlue = true;
  // laptop screen
  M.screen = laptopScreenCanvas();
  if(D.LaptopScreen){ D.LaptopScreen.material = new THREE.MeshBasicMaterial({ map:M.screen.tex, toneMapped:false }); }
  drawLaptopScreen('locked', 0);
  // the safe door swings on its hinge (bookshelf side)
  if(D.SafeDoor){
    const hinge = new THREE.Group(); hinge.position.set(5.03, 1.26, -3.1); inst.root.add(hinge);
    D.SafeDoor.position.set(-5.03, -1.26, 3.1); hinge.add(D.SafeDoor); M.safeHinge = hinge;
  }
  // ---------- cast ----------
  const p = buildPlayerMesh(); p.position.set(0, 0, 8.6); p.rotation.y = Math.PI; scene.add(p); ENGINE.player = p;
  ENGINE.camera.near = 0.15; ENGINE.camera.updateProjectionMatrix();
  const uche = PEOPLE.make('uche'); uche.position.set(1.0, 0, 6.55); uche.rotation.y = -0.15; scene.add(uche);
  uche.userData.anim.play('folded', { fade:0 });
  const obi = PEOPLE.make('obi'); obi.position.set(4.12, 0, -1.0); obi.rotation.y = -Math.PI/2; scene.add(obi);
  obi.userData.anim.play('talk', { fade:0 });
  const child = PEOPLE.make('child'); child.position.set(-1.35, 0, 1.45); child.rotation.y = 0.55; scene.add(child);
  child.userData.anim.play('crouch', { fade:0 });
  M.uche = uche; M.obi = obi; M.child = child;
  ENGINE.npcs.push({ mesh:uche, update:dt=>{} });
  ENGINE.npcs.push({ mesh:obi, update:dt=>{
    // the principal throws his hands up the moment the squad is inside
    if(!S.game._obiPanic && S.game._mansionPreBriefed && ENGINE.player && ENGINE.player.position.z < 4.2){ S.game._obiPanic = true; obi.userData.anim.play('handsup', { fade:0.35 }); }
  }});
  ENGINE.npcs.push({ mesh:child, update:dt=>updateWalker(child, dt) });
  // ---------- interactables (scene order drives the guidance marker) ----------
  const laptopA = _anchor(3.05, 0.78, -1.05), cashA = _anchor(-2.35, 0.45, -0.4), drawerA = _anchor(2.5, 0.62, -0.28), safeA = _anchor(4.92, 1.0, -3.4);
  ENGINE.interactables.push({
    mesh: uche, label:'Brief with Sgt. Uche', verb:'talk', range:2.6,
    onInteract: ()=>{
      if(S.game._mansionPreBriefed){ toast('READY','Move to the suspect when ready'); return; }
      uche.userData.anim.play('talk', { fade:0.3 });
      startDialogue('mansion_pre_breach', ()=>{ uche.userData.anim.oneShot('yes', 'idle'); });
    }
  });
  const laptopIt = {
    mesh: laptopA, label:'Inspect laptop', verb:'inspect', range:2.0, labelY:0.32,
    priority: ()=> (S.game._mansionPreBriefed && !S.game._evLaptop && !S.game._wipeLost) ? 2 : 0,
    onInteract: ()=>{
      if(S.game._evLaptop){ toast('SECURED','Laptop wipe stopped'); return; }
      if(S.game._wipeLost){ toast('WIPED','The drive is blank. Too slow.'); return; }
      if(!S.game._mansionPreBriefed){ toast('PRE-BREACH','Brief with Sgt. Uche first'); return; }
      playInteraction({ spot:[2.38,-1.02], face:Math.PI/2, clip:'interact', hitAt:0.95, dur:1.9,
        target:[3.05,0.86,-1.05], camBack:1.35, camSide:0.7, camUp:1.68,
        onHit:()=>{
          const pct = Math.round(100 * (S.game._wipeT||0) / (S.game._wipeTotal||60));
          S.game._wipeDone = true; hideMeter('wipe');
          drawLaptopScreen('halted', pct);
          toast('WIPE HALTED', `Pulled the power at ${pct}%. ${pct<40?'Drive mostly intact.':pct<75?'Partial recovery possible.':'Barely anything left.'}`, 2200);
          applyEffect({intel: pct<40 ? +12 : pct<75 ? +5 : 0});
          if(pct < 25 && typeof unlock==='function') unlock('pulled_plug');
          collectEvidence({id:'laptop', name:'Encrypted Laptop', xp:80});
          S.game._evLaptop = true;
          ENGINE.evidenceMarkers.find(m=>m.id==='ev_laptop')?.let_collected();
          completeObjective('o4_wipe');
          refreshEvidenceCount();
          if(typeof shakeCamera==='function') shakeCamera(0.05);
          laptopIt.consumed = true;
        }
      });
    }
  };
  ENGINE.interactables.push(laptopIt);
  ENGINE.interactables.push({
    mesh: child, label:'Calm and escort the child', verb:'help', range:2.1,
    onInteract: ()=>{
      if(S.game._civChild){ toast('SAFE','Child handed off to family liaison'); return; }
      startDialogue('mansion_civilian', ()=>{
        S.game._civChild = true; completeObjective('o5_civ');
        if(S.game.moralChoices && S.game.moralChoices.rescued){
          child.userData.anim.play('idle', { fade:0.3 });
          setTimeout(()=>startWalker(child, [[-0.6,2.6],[0,3.6],[0,4.7],[-0.9,6.3],[-1.4,6.9]], 1.05, ()=>{ child.rotation.y = 0.2; }), 500);
        }
      });
    }
  });
  ENGINE.interactables.push({
    mesh: obi, label:'Move on suspect', verb:'arrest', range:2.7,
    onInteract: ()=>{
      if(!S.game._mansionPreBriefed){ toast('PRE-BREACH','Brief with Sgt. Uche first'); return; }
      if(S.game.moralChoices.arrest){ toast('SUSPECT','Already in custody'); return; }
      startDialogue('mansion_arrest', ()=>{
        const a = S.game.moralChoices.arrest;
        if(a && a !== 'bribe'){ S.game.arrests += 1; completeObjective('o6_arrest'); obi.userData._arrested = true; obi.userData.anim.play('kneel', { fade:0.5 }); }
        else if(a === 'bribe'){ completeObjective('o6_arrest'); obi.userData._arrested = true; obi.userData.anim.play('idle', { fade:0.4 }); }
      });
    }
  });
  ENGINE.interactables.push({
    mesh: cashA, label:'Bag cash evidence', verb:'collect', range:2.0, labelY:0.2,
    onInteract: ()=>{
      if(S.game._evCash){ toast('BAGGED','Cash logged in chain of custody'); return; }
      playInteraction({ spot:[-1.62,-0.55], face:-Math.PI/2, clip:'pickup', hitAt:0.42, dur:1.05,
        target:[-2.3,0.45,-0.45], camBack:1.5, camSide:-0.75, camUp:1.75,
        onHit:()=>{
          if(D.CashTable) D.CashTable.visible = false;
          collectEvidence({id:'cash', name:'Cash Bundles ₦12.4M', xp:60});
          S.game._evCash = true;
          ENGINE.evidenceMarkers.find(m=>m.id==='ev_cash')?.let_collected();
          refreshEvidenceCount();
          const ci = ENGINE.interactables.find(x=>x.label==='Bag cash evidence'); if(ci) ci.consumed = true;
        }
      });
    }
  });
  ENGINE.interactables.push({
    mesh: safeA, label:'Crack the safe', verb:'open', range:2.0, labelY:0.55,
    onInteract: ()=>{
      if(S.game._evSafe){ toast('SAFE OPEN','Drives bagged'); return; }
      playInteraction({ spot:[4.3,-3.4], face:Math.PI/2, clip:'interact', hitAt:0.7, dur:1.0,
        target:[4.98,1.25,-3.4], camBack:1.35, camSide:-0.65, camUp:1.7,
        done:()=>{
          openPuzzle('mansion_safe', ok=>{
            if(!ok) return;
            S.game._evSafe = true;
            ENGINE.evidenceMarkers.find(m=>m.id==='ev_safe')?.let_collected();
            refreshEvidenceCount();
            if(M.safeHinge) M.safeSwing = 0.001;
            const si = ENGINE.interactables.find(x=>x.label==='Crack the safe'); if(si) si.consumed = true;
          });
        }
      });
    }
  });
  ENGINE.interactables.push({
    mesh: drawerA, label:'Search the open drawer', verb:'search', range:1.45, labelY:0.25,
    onInteract: ()=>{
      if(S.game._drawerSearched){ toast('LOGGED','Drawer cash is in the custody bag'); return; }
      playInteraction({ spot:[2.12,-0.3], face:Math.PI/2, clip:'open', hitAt:0.75, dur:1.35,
        target:[2.6,0.6,-0.3], camBack:1.3, camSide:-0.7, camUp:1.6,
        onHit:()=>{
          S.game._drawerSearched = true; M.drawerSlide = 0.001;
          const di = ENGINE.interactables.find(x=>x.label==='Search the open drawer'); if(di) di.consumed = true;
          applyEffect({intel:+4});
          toast('BRIBE STASH', 'The cash Obi offered you — ₦2.1M, logged with the seized funds. +4 INTEL', 2400);
          if(typeof sfxEvidence==='function') sfxEvidence();
        }
      });
    }
  });
  const exitA = _anchor(0, 0, 13.3);
  ENGINE.interactables.push({
    mesh: exitA, label:'Extract — End operation', verb:'exit', range:2.3, labelY:0.6,
    onInteract: ()=>{
      const allReq = S.game.moralChoices.arrest && S.game._civChild;
      if(!allReq){ toast('OPERATION OPEN','Arrest suspect & secure civilian first'); return; }
      completeMission('m3');
    }
  });
  // evidence markers
  addEvidenceMarker(new THREE.Vector3(3.05, 1.18, -1.05), 'EVIDENCE', 'LAPTOP', 'ev_laptop');
  ENGINE.evidenceMarkers.find(m=>m.id==='ev_laptop').let_collected = function(){ this.collected=true; };
  addEvidenceMarker(new THREE.Vector3(-2.35, 0.85, -0.4), 'EVIDENCE', 'CASH', 'ev_cash');
  ENGINE.evidenceMarkers.find(m=>m.id==='ev_cash').let_collected = function(){ this.collected=true; };
  addEvidenceMarker(new THREE.Vector3(4.9, 1.75, -3.4), 'EVIDENCE', 'SAFE', 'ev_safe');
  ENGINE.evidenceMarkers.find(m=>m.id==='ev_safe').let_collected = function(){ this.collected=true; };
  // ---------- collision ----------
  const ob = (x,z,w,d)=>addObstacle(x,z,w,d);
  ob(-5.12,-0.25,0.25,8.6); ob(5.12,-0.25,0.25,8.6);                       // side walls
  ob(-2.97,-4.62,4.05,0.25); ob(2.97,-4.62,4.05,0.25);                      // back wall either side of the corridor
  ob(-3.1,4.12,4.3,0.25); ob(3.1,4.12,4.3,0.25);                            // front wall either side of the door
  ob(-0.97,3.55,0.08,0.9); ob(0.97,3.55,0.08,0.9);                          // open door leaves
  ob(-1.1,-6.7,0.2,4.0); ob(1.1,-6.7,0.2,4.0); ob(0,-8.68,2.4,0.2); ob(0.62,-7.2,0.38,1.0);   // corridor
  ob(-3.92,-0.4,0.95,2.6); ob(-2.35,-0.4,0.8,1.4); ob(-1.72,0.32,0.45,0.66); ob(-1.05,-2.35,0.95,0.95);
  ob(-4.15,1.3,0.56,0.56); ob(-4.4,-2.55,0.5,0.5); ob(-1.65,-4.15,0.55,0.55); ob(4.45,3.45,0.45,0.45); ob(0,-3.3,0.32,0.32);
  ob(2.75,-4.27,1.8,0.44); ob(4.82,-1.0,0.4,3.5); ob(3.2,-1.0,0.86,1.8); ob(2.2,-1.82,0.62,0.62); ob(4.75,2.55,0.46,1.22);
  ob(4.12,-1.0,0.5,0.5);                                                    // Obi
  ob(-2.3,7.1,0.42,0.42); ob(2.3,7.1,0.42,0.42); ob(-3.1,5.0,0.66,0.66); ob(3.1,5.0,0.66,0.66);          // porch
  ob(-2.7,11.2,2.3,4.7); ob(2.9,11.9,2.3,4.7); ob(-7.6,11.8,0.9,8.7); ob(7.6,11.8,0.9,8.7); ob(0,16.2,16,0.35);
  for(const [x,z] of [[-6.4,9.0],[6.5,13.5],[-6.6,14.2]]) ob(x,z,0.4,0.4);
  ENGINE.bounds = { minX:-7.3, maxX:7.3, minZ:-8.55, maxZ:15.9 };
  ENGINE.ceilingY = 3.3;
  ENGINE.inside = pos => pos.z < 4.0 && pos.z > -8.6 && Math.abs(pos.x) < 5.0;
  // invisible camera blockers (walls + tall furniture)
  const solids = [], inv = new THREE.MeshBasicMaterial({ visible:false });
  const blk = (x,y,z,w,h,d)=>{ const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), inv); m.position.set(x,y,z); m.updateMatrixWorld(); scene.add(m); solids.push(m); };
  blk(-5.12,1.65,-0.25,0.25,3.3,8.6); blk(5.12,1.65,-0.25,0.25,3.3,8.6);
  blk(-2.97,1.65,-4.62,4.05,3.3,0.25); blk(2.97,1.65,-4.62,4.05,3.3,0.25);
  blk(-3.1,1.65,4.12,4.3,3.3,0.25); blk(3.1,1.65,4.12,4.3,3.3,0.25); blk(0,2.98,4.12,1.9,0.66,0.25);
  blk(-1.1,1.45,-6.7,0.2,2.9,4.0); blk(1.1,1.45,-6.7,0.2,2.9,4.0); blk(4.82,1.25,-1.0,0.4,2.5,3.5);
  blk(0,3.36,5.95,7.4,0.22,3.4); blk(0,3.35,-0.25,10.5,0.1,8.6);
  setCameraSolids(solids);
  // ---------- minimap ----------
  setMinimap(
    `<rect x="-5" y="-4.5" width="10" height="8.5" fill="#2a3550" opacity=".55"/>
     <rect x="-1" y="-8.6" width="2" height="4.1" fill="#2a3550" opacity=".45"/>
     <rect x="-3.6" y="4.2" width="7.2" height="3.2" fill="#2a3550" opacity=".3"/>
     <rect x="-8" y="7.4" width="16" height="8.8" fill="#2a3550" opacity=".18"/>`,
    [ {x:4.12,z:-1.0,color:'#e07d4a',r:1.6}, {x:-1.35,z:1.45,color:'#f3ead2',r:1.3}, {x:1.0,z:6.55,color:'#3a8ad0',r:1.5},
      {x:3.05,z:-1.05,color:'#d8a64a',r:1.2}, {x:-2.35,z:-0.4,color:'#d8a64a',r:1.2}, {x:4.9,z:-3.4,color:'#d8a64a',r:1.2}, {x:0,z:13.3,color:'#5dd07a',r:1.8} ]
  );
  MINIMAP.scale = 4;
  S.game.currentRegion = 'Lagos';
  S.game.currentSubregion = 'Lekki Mansion · Old GRA';
  S.game.alertLevel = 2;
  refreshHUD();
  ENGINE.sceneUpdate = mansionUpdate;
}
/* per-frame scene life: laptop screen, drawer slide, safe door, screen glow */
function mansionUpdate(dt){
  const M = ENGINE._mansion; if(!M || S.game.currentMission !== 'm3') return;
  M.t += dt;
  if(M.screenLight){
    const st = M.screenState;
    const base = st==='wiping' ? 0.55 + Math.sin(M.t*9)*0.12 + (Math.random()<0.04?0.25:0) : st==='halted' ? 0.35 : st==='locked' ? 0.25 : 0.12;
    M.screenLight.intensity = base;
    M.screenLight.color.set(st==='wiping' ? '#ff4458' : st==='halted' ? '#4adf7c' : '#5a8cff');
  }
  if(M.screenState === 'wiping' || M.screenState === 'locked'){ M.screenT += dt; if(M.screenT > 0.12){ M.screenT = 0; drawLaptopScreen(M.screenState, S.game._wipeTotal ? Math.round(100*S.game._wipeT/S.game._wipeTotal) : 0); } }
  if(S.game._mansionPreBriefed && !S.game._wipeDone && !S.game._wipeLost && M.screenState === 'locked') drawLaptopScreen('wiping', 0);
  if(S.game._wipeLost && M.screenState !== 'wiped') drawLaptopScreen('wiped', 100);
  if(M.drawerSlide && M.D.Drawer){ M.drawerSlide = Math.min(1, M.drawerSlide + dt*3); M.D.Drawer.position.x = -0.13 * (1 - Math.pow(1 - M.drawerSlide, 3)); if(M.drawerSlide >= 1) M.drawerSlide = 0; }
  if(M.safeSwing && M.safeHinge){ M.safeSwing = Math.min(1, M.safeSwing + dt*1.4); M.safeHinge.rotation.y = 1.75 * (1 - Math.pow(1 - M.safeSwing, 3)); if(M.safeSwing >= 1) M.safeSwing = 0; }
}
function laptopScreenCanvas(){
  const c = document.createElement('canvas'); c.width = 512; c.height = 336;
  const tex = new THREE.CanvasTexture(c); tex.flipY = false; tex.encoding = THREE.sRGBEncoding;
  return { c, x:c.getContext('2d'), tex };
}
/* UV of the screen quad is fitted with v pointing up in Blender; flipY=false means row 0 is the top edge */
function drawLaptopScreen(state, pct){
  const M = ENGINE._mansion; if(!M || !M.screen) return; M.screenState = state;
  const { x, c, tex } = M.screen, W = c.width, H = c.height, t = performance.now()/1000;
  x.save(); x.translate(W, 0); x.scale(-1, 1);      // the quad faces -x; mirror so text reads correctly
  x.fillStyle = state==='wiped' ? '#05060a' : '#0a1020'; x.fillRect(0,0,W,H);
  x.font = '700 26px Oswald, Arial Narrow, sans-serif'; x.textBaseline = 'top';
  if(state === 'locked'){
    x.fillStyle = '#1b2a4a'; x.fillRect(0,0,W,H);
    x.fillStyle = '#cfe0ff'; x.font = '600 40px Inter, Arial, sans-serif'; x.textAlign = 'center'; x.fillText(new Date().toTimeString().slice(0,5), W/2, 70);
    x.font = '500 18px Inter, Arial, sans-serif'; x.fillText('CHIEF E. OBI', W/2, 150);
    x.strokeStyle = 'rgba(255,255,255,.6)'; x.strokeRect(W/2-110, 190, 220, 34); x.fillStyle = '#fff'; x.fillText('•'.repeat(1 + ((t*4)|0)%8), W/2, 196);
  } else if(state === 'wiping'){
    x.fillStyle = '#ff3b4e'; x.fillRect(0,0,W,52); x.fillStyle = '#fff'; x.textAlign = 'left'; x.fillText('SECURE ERASE IN PROGRESS', 20, 12);
    x.fillStyle = 'rgba(255,255,255,.12)'; x.fillRect(20, 92, W-40, 26); x.fillStyle = '#ff3b4e'; x.fillRect(20, 92, (W-40)*Math.min(1,pct/100), 26);
    x.fillStyle = '#fff'; x.font = '700 22px JetBrains Mono, monospace'; x.fillText(pct + '%', 20, 128);
    x.font = '500 15px JetBrains Mono, monospace'; x.fillStyle = 'rgba(160,200,255,.75)';
    const files = ['ledger_q3.xlsx','wallet_seed.txt','pos_agents.csv','sim_batch_07.db','obi_contacts.vcf','transfers_lekki.pdf','burner_logs.zip'];
    for(let i=0;i<7;i++) x.fillText('shred  ' + files[(i + ((t*3)|0)) % files.length], 20, 170 + i*21);
  } else if(state === 'halted'){
    x.fillStyle = '#21c063'; x.fillRect(0,0,W,52); x.fillStyle = '#04140a'; x.textAlign = 'left'; x.fillText('WIPE HALTED · POWER CUT', 20, 12);
    x.fillStyle = '#e8f6ee'; x.font = '700 64px Oswald, Arial Narrow, sans-serif'; x.fillText(pct + '%', 20, 84);
    x.font = '500 18px Inter, Arial, sans-serif'; x.fillText('Drive imaged by NACECA forensics', 20, 170); x.fillText(pct < 40 ? 'Most of the ledger survived.' : pct < 75 ? 'Partial recovery possible.' : 'Barely anything left.', 20, 200);
  } else {
    x.fillStyle = '#b5202e'; x.textAlign = 'center'; x.font = '700 40px Oswald, Arial Narrow, sans-serif'; x.fillText('NO BOOTABLE DEVICE', W/2, H/2 - 24);
  }
  x.restore();
  tex.needsUpdate = true;
}
/* tiny path follower for NPCs (the child walking out) */
function startWalker(m, pts, speed, done){ m.userData._walk = { pts, i:0, speed, done }; m.userData.anim.play('walk', { fade:0.25, speed:speed/1.35 }); }
function updateWalker(m, dt){
  const w = m.userData._walk; if(!w) return;
  const tgt = w.pts[w.i]; const dx = tgt[0]-m.position.x, dz = tgt[1]-m.position.z, d = Math.hypot(dx,dz);
  const step = w.speed*dt;
  if(d <= step){ m.position.x = tgt[0]; m.position.z = tgt[1]; w.i++; if(w.i >= w.pts.length){ m.userData._walk = null; m.userData.anim.play('idle', { fade:0.3 }); if(w.done) w.done(); return; } }
  else { m.position.x += dx/d*step; m.position.z += dz/d*step; }
  const want = Math.atan2(dx, dz); let a = want - m.rotation.y; while(a > Math.PI) a -= Math.PI*2; while(a < -Math.PI) a += Math.PI*2; m.rotation.y += a*Math.min(1, dt*8);
}


/* =========================================================================
   NACECA · scenes/hq.js  (v9) — Lagos HQ operations & briefing room.
   The original builder still places the gameplay (commander, briefing
   trigger, exit, minimap); dressScene swaps in the light-baked room.
   ========================================================================= */
function buildSceneHQ(){
  buildSceneHQLegacy();
  if(!ENVART.ready('hq')) return;
  const dr = dressScene('hq', {
    bg:'#05080f', fog:['#070b14', 30, 90],
    lights:{ sky:'#c4cfe8', ground:'#2a2622', hemi:0.62, key:['#ffe8cc', 0.75, [3, 7, 5], [0, 0, -2]],
             points:[ { pos:[0, 2.5, 0], c:'#ffe3bf', i:1.0, d:7.5 }, { pos:[0, 2.1, -9.2], c:'#7a9cff', i:0.9, d:6.5 },
                      { pos:[6.4, 1.4, -3], c:'#86a6ff', i:0.5, d:5, hi:true }, { pos:[0, 2.6, 8.6], c:'#ffd9a8', i:0.6, d:6, hi:true } ] },
    ceilingY: 3.6,
  });
  if(!dr) return;
  const D = dr.D, meta = dr.meta;
  if(typeof hqFixCaseBoard==='function') hqFixCaseBoard();   // v11: the board was outside the baked room
  // Commander Adaeze stands in front of the video wall, facing the room
  const npcMesh = n => (n && n.isObject3D) ? n : (n && n.mesh);
  const cmd = ENGINE.npcs.map(npcMesh).find(m=>m && m.userData && m.userData._proxy);
  if(cmd){ cmd.position.set(0, 0, -8.0); cmd.rotation.y = 0; cmd.userData._idle = 'folded'; }
  // analysts working the phones under the windows
  const an = (meta.anchors && meta.anchors.analysts && meta.anchors.analysts.list) || [];
  const looks = [
    { body:'M', skin:'#4a2b1c', hair:'#0c0a09', torso:'#d9dde6', armA:'#d9dde6', armB:'#d9dde6', armC:'#d9dde6', hips:'#1f2633', thigh:'#1f2633', shin:'#1f2633', shoe:'#111111', gear:['Gear_Glasses'] },
    { body:'F', skin:'#5a3826', hair:'#0c0a09', torso:'#1d2b4c', armA:'#1d2b4c', armB:'#1d2b4c', armC:'#1d2b4c', hips:'#17213a', thigh:'#17213a', shin:'#17213a', shoe:'#111111', gear:['Gear_F_Bun'] },
  ];
  ENGINE.extraSkinned = ENGINE.extraSkinned || [];
  an.forEach((a, i)=>{
    const o = Object.assign({ res:512 }, looks[i % looks.length]);
    const ch = PEOPLE.make('npc', o); ch.position.set(a[0], 0, a[1]); ch.rotation.y = a[2]; ENGINE.scene.add(ch);
    ch.userData.anim.play(PEOPLE.clips.sit ? (i ? 'sit' : 'sit_talk') : 'idle', { fade:0 }); ch.userData.anim.update(Math.random()*3);
    ENGINE.extraSkinned.push(ch);
  });
  // the case folder glows until the briefing is done
  const glow = D.CaseGlow;
  if(glow){ glow.material = glow.material.clone(); glow.material.transparent = true; glow.material.blending = THREE.AdditiveBlending; glow.material.depthWrite = false; }
  ENGINE.sceneUpdate = dt=>{
    dr.t += dt;
    if(glow){ const on = !S.game._hqBriefed; glow.visible = on; if(on) glow.material.opacity = 0.35 + 0.35*Math.sin(dr.t*3.2); }
  };
  if(typeof MINIMAP !== 'undefined') MINIMAP.scale = 4.5;
}


/* =========================================================================
   NACECA · scenes/market.js (v9) — Ikeja street market at dusk.
   Original builder keeps the patrol, the informant, the phone scan, the
   chase path and the crowd; the dressing swaps in the baked street.
   ========================================================================= */
function buildSceneMarket(){
  buildSceneMarketLegacy();
  if(!ENVART.ready('market')) return;
  const gfx = (typeof currentGfx==='function') ? currentGfx() : 'medium';
  const dr = dressScene('market', {
    bg:'#24325a', fog:['#3a3a5a', 22, 75],
    lights:{ sky:'#a8b4e0', ground:'#5a3a26', hemi:0.66, key:['#ffb070', 0.85, [-14, 6, 4], [0, 0, 0]],
             points:[ { pos:[7.5, 2.2, 4.2], c:'#ffd08a', i:0.9, d:6 }, { pos:[-6.2, 2.4, -2], c:'#ffc070', i:0.7, d:6 },
                      { pos:[0, 4, 12], c:'#ffd9a8', i:0.6, d:9, hi:true }, { pos:[10, 2.2, -8], c:'#ffc070', i:0.6, d:7, hi:true } ] },
  });
  if(!dr) return;
  const D = dr.D;
  // head-loads: the old trays sit on top of the gele, in proper materials
  for(const g of PROXY.list){
    for(const c of g.children){
      if(!c.isMesh) continue;
      c.position.y -= 0.07;
      const col = c.material && c.material.color ? c.material.color.clone() : new THREE.Color('#8a6a3a');
      c.material = new THREE.MeshStandardMaterial({ color:col, roughness:0.8 });
      c.children.forEach(o=>{ if(o.userData && o.userData._outline) o.visible = false; });
    }
  }
  // phones: thin the wandering crowd so skinning stays cheap
  if(gfx === 'low'){
    const wander = PROXY.list.filter(g=>g.userData && g.userData.target);
    const drop = new Set(wander.filter((g,i)=>i%2===1));
    drop.forEach(g=>{ if(g.parent) g.parent.remove(g); });
    ENGINE.npcs = ENGINE.npcs.filter(n=>!drop.has((n && n.isObject3D) ? n : (n && n.mesh)));
    if(ENGINE._marketCrowd) ENGINE._marketCrowd = ENGINE._marketCrowd.filter(g=>!drop.has(g));
    PROXY.list = PROXY.list.filter(g=>!drop.has(g));
  }
  // traders stand and chat; Tunde waits by the stall with his arms folded
  for(const g of PROXY.list){ if(!g.userData.target) g.userData._idle = Math.random() < 0.5 ? 'talk' : 'idle'; }
  const scr = D.EvPhoneScr;
  if(scr){ scr.material = scr.material.clone(); scr.material.transparent = true; }
  const beacons = [D.VanBeaconB, D.VanBeaconR];
  ENGINE.sceneUpdate = dt=>{
    dr.t += dt;
    if(scr){ const live = !S.game._marketScanned; scr.material.opacity = live ? 0.65 + 0.35*Math.sin(dr.t*4) : 0.25; }
    const ph = (dr.t*1.6) % 1;
    if(beacons[0]) beacons[0].visible = (ph < 0.12) || (ph > 0.2 && ph < 0.32);
    if(beacons[1]) beacons[1].visible = (ph > 0.5 && ph < 0.62) || (ph > 0.7 && ph < 0.82);
  };
  if(typeof MINIMAP !== 'undefined') MINIMAP.scale = 5;
}


/* =========================================================================
   NACECA · scenes/checkpoint.js (v9) — AKS checkpoint on the Benin Bypass
   at dusk. The original builder keeps the briefing, the manifest puzzle,
   Musa's interview and the compartment search; the dressing swaps in the
   light-baked highway, the cattle lorry and the checkpoint crew.
   ========================================================================= */
function buildSceneCheckpoint(){
  buildSceneCheckpointLegacy();
  if(!ENVART.ready('checkpoint')) return;
  const gfx = (typeof currentGfx==='function') ? currentGfx() : 'medium';
  const dr = dressScene('checkpoint', {
    bg:'#1b2150', fog:['#3a3048', 30, 100], dust:true,
    lights:{ sky:'#a898c8', ground:'#5a3a26', hemi:0.62, key:['#ffa060', 0.95, [-14, 5, 4], [0, 0, 0]],
             shadow:{ r:9, far:40, follow:true, opacity:0.3, catcher:[-3, 0, 52, 22] },
             points:[ { pos:[0, 7, -5], c:'#ffe2b0', i:0.8, d:16 }, { pos:[-4.2, 1.2, -8.0], c:'#ff8a30', i:0.9, d:6, name:'fire' },
                      { pos:[-2.4, 2.6, 4.0], c:'#ffd9a8', i:0.35, d:4, hi:true } ] },
  });
  if(!dr) return;
  const D = dr.D;
  // the cast's legacy hats and bolt-ons are part of their outfits now
  PROXY.list.forEach(g=>PROXY.scrub(g));
  const byLabel = l=>{ const it = ENGINE.interactables.find(i=>i.label === l); return it && it.mesh; };
  const chidi = byLabel('Brief with AKS Inspector Chidi'), musa = byLabel('Question driver Musa');
  if(chidi && chidi.userData && chidi.userData._proxy){ chidi.position.set(-6, 0, 2); chidi.rotation.y = -1.25; chidi.userData._idle = 'folded'; }
  if(musa && musa.userData && musa.userData._proxy){
    // Musa waits on two crates by his cab, fidgeting
    musa.position.set(-4.6, 0, 2.3); musa.userData._idle = 'sit';
    const e = ENGINE.npcs.find(n=>n && n.mesh === musa);
    if(e) e.update = dt=>{ musa.userData.walkPhase = (musa.userData.walkPhase||0) + dt; musa.rotation.y = -1.35 + Math.sin(musa.userData.walkPhase*0.9)*0.07; };
  }
  // the checkpoint crew
  const aks = (f, top)=>({ body: f ? 'F' : 'M', skin: f ? '#5a3826' : '#3e2418', hair:'#0c0a09', torso: top || '#4a5632', armA: top || '#4a5632', armB: top || '#4a5632', armC: top ? null : '#4a5632',
                           hips:'#2c3420', thigh:'#2c3420', shin:'#2c3420', shoe:'#141414', gear: f ? ['Gear_F_Beret','Gear_F_Bun'] : ['Gear_Beret'], beret:'#5a0e0e', res:512 });
  const crew = [ { o:aks(false), p:[-8.6, -5.9], r:0, clip:'sit_talk' }, { o:aks(false, '#1c1d20'), p:[-7.3, -3.5], r:-Math.PI/2, clip:'folded' },
                 { o:aks(true), p:[-3.9, -7.0], r:Math.PI, clip:'sit', hi:true }, { o:aks(false), p:[6.3, -4.25], r:-1.4, clip:'idle', hi:true } ];
  ENGINE.extraSkinned = ENGINE.extraSkinned || [];
  for(const c of crew){
    if(c.hi && gfx === 'low') continue;
    const ch = PEOPLE.make('npc', c.o); ch.position.set(c.p[0], 0, c.p[1]); ch.rotation.y = c.r; ENGINE.scene.add(ch);
    ch.userData.anim.play(PEOPLE.clips[c.clip] ? c.clip : 'idle', { fade:0 }); ch.userData.anim.update(Math.random()*3);
    ENGINE.extraSkinned.push(ch);
  }
  // the hidden compartment door drops open on its bottom hinge
  let pivot = null;
  if(D.CompDoor){ D.CompDoor.traverse(m=>{ if(m.isMesh && m.material && m.material.color){ m.material = m.material.clone(); m.material.color.set('#5e1e14'); m.material.roughness = 0.8; } });
    pivot = new THREE.Group(); pivot.position.set(3.875, 1.15, 4.0); D.CompDoor.parent.add(pivot); pivot.updateMatrixWorld(true); pivot.attach(D.CompDoor); }
  const pulse = o=>{ if(!o) return null; o.traverse(m=>{ if(m.isMesh){ m.material = m.material.clone(); m.material.transparent = true; m.material.blending = THREE.AdditiveBlending; m.material.depthWrite = false; } }); return o; };
  const seam = pulse(D.CompSeam), manifest = ENVART.softGlow(D.ManifestGlow, '#ffd27a', 1.5);
  const setOp = (o, v)=>o.traverse(m=>{ if(m.isMesh) m.material.opacity = v; });
  const beacons = [D.NVanBeaconB, D.NSuvBeaconB, D.NVanBeaconR, D.NSuvBeaconR];
  // (dynamic meshes carry their dequantisation in their own transform: animate through pivots)
  let fire = null; const fireL = D.L_fire;
  if(D.Fire){ fire = new THREE.Group(); fire.position.set(-4.2, 0.7, -8.0); D.Fire.parent.add(fire); fire.updateMatrixWorld(true); fire.attach(D.Fire); }
  ENGINE.sceneUpdate = dt=>{
    dr.t += dt; const t = dr.t, g = S.game;
    if(pivot){ const want = g._cpCompartmentOpen ? -1.75 : 0; pivot.rotation.z += (want - pivot.rotation.z) * Math.min(1, dt*3.2); }
    if(seam){ const on = !!g._cpManifestDone && !g._cpCompartmentOpen; seam.visible = on; if(on) setOp(seam, 0.45 + 0.45*Math.sin(t*4.2)); }
    if(manifest){ const on = !g._cpManifestDone; manifest.visible = on; if(on) setOp(manifest, 0.45 + 0.3*Math.sin(t*3.2)); }
    // convoy beacons: blue / red double flash
    const ph = (t*1.6) % 1, blue = (ph < 0.12) || (ph > 0.2 && ph < 0.32), red = (ph > 0.5 && ph < 0.62) || (ph > 0.7 && ph < 0.82);
    beacons.forEach((b,i)=>{ if(b) b.visible = i < 2 ? blue : red; });
    if(fire){ fire.scale.y = 0.85 + 0.25*Math.abs(Math.sin(t*9.1) + 0.5*Math.sin(t*13.7)); }
    if(fireL) fireL.intensity = 0.75 + 0.25*Math.sin(t*11.3) + 0.12*Math.sin(t*23.1);
  };
  if(typeof MINIMAP !== 'undefined') MINIMAP.scale = 5;
}


/* =========================================================================
   NACECA · scenes/shrine.js (v9) — Ozalla forest shrine compound at dawn.
   The original builder keeps Pa Eze, Sgt Uche, the access negotiation and
   the two searches; the dressing swaps in the baked forest compound and
   moves the searches onto the altar and the cache you can actually reach.
   ========================================================================= */
function buildSceneShrine(){
  buildSceneShrineLegacy();
  if(!ENVART.ready('shrine')) return;
  const gfx = (typeof currentGfx==='function') ? currentGfx() : 'medium';
  const smoke = ENGINE._shrineSmoke;
  const dr = dressScene('shrine', {
    bg:'#9cb0c6', fog:['#a9b5aa', 16, 64], keep: smoke ? [smoke] : [],
    lights:{ sky:'#e2e8ee', ground:'#3a4a2a', hemi:0.6, key:['#ffd090', 1.0, [12, 5, 6], [0, 0, 0]],
             shadow:{ r:9, far:40, follow:true, opacity:0.3, catcher:[0, 3, 50, 36] },
             points:[ { pos:[3.0, 0.8, -5.4], c:'#ff8a30', i:0.8, d:5, name:'pit' }, { pos:[0, 0.9, -4.6], c:'#ffb060', i:0.35, d:3, hi:true } ] },
  });
  if(!dr) return;
  const D = dr.D, sc = ENGINE.scene;
  if(typeof shrineOpenCourtyard==='function') shrineOpenCourtyard(dr);   // v11: the altar no longer blocks the gate
  PROXY.list.forEach(g=>PROXY.scrub(g));          // Pa Eze's sash is part of his robe now
  if(smoke){ smoke.position.set(3.0, 2.5, -5.4); smoke.visible = true; smoke.material.blending = THREE.NormalBlending; smoke.material.color.set('#d8d2c6'); smoke.material.opacity = 0.32; smoke.userData._baseOp = undefined; smoke.userData._baseX = undefined; }
  // the searches sit where the pots and the cache really are
  const anchorAt = (x, y, z)=>{ const a = new THREE.Object3D(); a.position.set(x, y, z); sc.add(a); return a; };
  const its = ENGINE.interactables;
  const pots = its.find(i=>i.label === 'Search Libation Pots'), cache = its.find(i=>i.label === 'Inspect Cartel Cache');
  const AX = (typeof SHRINE_ALTAR_DX !== 'undefined') ? SHRINE_ALTAR_DX : 0;
  if(pots) pots.mesh = anchorAt(AX, 0.6, -3.9);
  let cacheA = null; if(cache){ cacheA = anchorAt(0, 0.6, -10.3); cache.mesh = cacheA; cacheA.visible = false; }
  const fixMarker = (id, x, y, z)=>{ const m = ENGINE.evidenceMarkers.find(m=>m.id === id); if(m && !m._v9){ m.worldPos.set(x, y, z); m._v9 = true; } };
  // glows that steer the search once access is granted
  const pulse = o=>{ if(!o) return null; o.traverse(m=>{ if(m.isMesh){ m.material = m.material.clone(); m.material.transparent = true; m.material.blending = THREE.AdditiveBlending; m.material.depthWrite = false; } }); return o; };
  const setOp = (o, v)=>o.traverse(m=>{ if(m.isMesh) m.material.opacity = v; });
  const potG = ENVART.softGlow(D.PotGlow, '#ffd27a', 1.4), cacheG = ENVART.softGlow(D.CacheGlow, '#ffd27a', 1.4);
  if(potG) potG.visible = false; if(cacheG) cacheG.visible = false;
  const shafts = D.Shafts;
  if(shafts) shafts.traverse(m=>{ if(m.isMesh){ m.material.blending = THREE.AdditiveBlending; m.material.depthWrite = false; m.material.side = THREE.DoubleSide; m.material.opacity = 0.55; m.renderOrder = 3; } });
  const fireMat = D.Fire && D.Fire.isMesh ? D.Fire.material : null, fireBase = new THREE.Color('#b8380c'), pitL = D.L_pit;
  ENGINE.sceneUpdate = dt=>{
    dr.t += dt; const t = dr.t, g = S.game;
    const acc = g.flags && g.flags.shrine_access, open = acc === 'granted_negotiate' || acc === 'granted_force';
    if(cacheA) cacheA.visible = !!(ENGINE._shrineCache && ENGINE._shrineCache.visible);
    fixMarker('ev_shrine_pots', AX, 1.25, -4.15); fixMarker('ev_shrine_cache', 0, 1.9, -10.75);
    if(potG){ const on = open && !g._shrinePotsSearched; potG.visible = on; if(on) setOp(potG, 0.4 + 0.3*Math.sin(t*3.0)); }
    if(cacheG){ const on = open && !g._shrineCacheSearched; cacheG.visible = on; if(on) setOp(cacheG, 0.4 + 0.3*Math.sin(t*3.0 + 1.3)); }
    if(shafts) shafts.traverse(m=>{ if(m.isMesh) m.material.opacity = 0.45 + 0.12*Math.sin(t*0.5); });
    const f = 1.2 + 0.35*Math.sin(t*7.3) + 0.2*Math.sin(t*12.1);
    if(fireMat) fireMat.color.copy(fireBase).multiplyScalar(f/1.2);
    if(pitL) pitL.intensity = 0.65 + 0.2*Math.sin(t*9.7) + 0.1*Math.sin(t*17.3);
  };
  if(typeof MINIMAP !== 'undefined') MINIMAP.scale = 5;
}


/* =========================================================================
   NACECA · scenes/asaba.js (v9) — Asaba commercial warehouse, late
   afternoon. The original builder keeps the breach trigger, the runner's
   chase, the smoke timer and the forced choice; the dressing swaps in the
   baked warehouse, its office (Tobi tied to a chair) and the loading yard.
   ========================================================================= */
function buildSceneAsaba(){
  buildSceneAsabaLegacy();
  if(!ENVART.ready('warehouse')) return;
  const smoke = ENGINE._asabaSmoke;
  const dr = dressScene('warehouse', {
    bg:'#e0cca8', fog:['#6a5a48', 20, 75], keep: smoke ? [smoke] : [],
    lights:{ sky:'#f0e2cc', ground:'#4a4034', hemi:0.62, key:['#ffd8a8', 0.55, [-6, 12, 6], [0, 0, 0]],
             points:[ { pos:[-12.7, 1.2, -4.75], c:'#ff7030', i:1.1, d:7, name:'fire' }, { pos:[0, 5.5, 0], c:'#ffe0b0', i:0.6, d:15 },
                      { pos:[16, 2.5, -3], c:'#e8d8c0', i:0.5, d:10, hi:true } ] },
    ceilingY: 6.95, inside: p=>p.x < 14 && p.z > -8 && p.z < 8,
  });
  if(!dr) return;
  const D = dr.D, sc = ENGINE.scene;
  PROXY.list.forEach(g=>PROXY.scrub(g));          // the old gag / rope meshes
  // smoke rolling out of the office door and window (the legacy plane + two companions)
  const puffs = [];
  if(smoke){
    const tune = (o, x, y, z, s)=>{ o.position.set(x, y, z); o.scale.setScalar(s); o.material.map = ENVART.texture('smokePuff'); o.material.blending = THREE.NormalBlending; o.material.color.set('#6e6862'); o.material.opacity = 0.85; o.userData._baseX = undefined; o.userData._baseOp = undefined; o.visible = true; };
    tune(smoke, -8.4, 2.3, -3.5, 0.9);
    for(const [x, y, z, s] of [[-11.2, 2.5, -3.4, 0.75], [-8.0, 3.8, -2.9, 1.2], [-7.0, 5.6, -1.8, 1.7]]){
      const p = smoke.clone(); p.material = smoke.material.clone(); tune(p, x, y, z, s); p.userData._smoke = true; sc.add(p); puffs.push(p);
    }
  }
  // Tobi is tied to the office chair until he is cut free
  const tobi = ENGINE._asabaTobi;
  if(tobi){ tobi.position.set(-10.0, 0, -5.5); tobi.rotation.y = 0.82; tobi.scale.set(1, 1, 1); tobi.userData._idle = 'sit'; }
  const pulse = o=>{ if(!o) return null; o.traverse(m=>{ if(m.isMesh){ m.material = m.material.clone(); m.material.transparent = true; m.material.blending = THREE.AdditiveBlending; m.material.depthWrite = false; } }); return o; };
  const setOp = (o, v)=>o.traverse(m=>{ if(m.isMesh) m.material.opacity = v; });
  const simG = ENVART.softGlow(D.SimGlow, '#ffd27a', 1.5);
  const shafts = D.Shafts;
  if(shafts) shafts.traverse(m=>{ if(m.isMesh){ m.material.blending = THREE.AdditiveBlending; m.material.depthWrite = false; m.material.side = THREE.DoubleSide; m.material.opacity = 0.5; m.renderOrder = 3; } });
  let fire = null; if(D.Fire){ fire = new THREE.Group(); fire.position.set(-12.7, 0.6, -4.75); D.Fire.parent.add(fire); fire.updateMatrixWorld(true); fire.attach(D.Fire); }
  const fireL = D.L_fire;
  let freed = 0;
  ENGINE.sceneUpdate = dt=>{
    dr.t += dt; const t = dr.t, g = S.game;
    if(simG){ const on = !g._asabaSIMs; simG.visible = on; if(on) setOp(simG, 0.4 + 0.3*Math.sin(t*3.0)); }
    if(shafts) shafts.traverse(m=>{ if(m.isMesh) m.material.opacity = 0.42 + 0.1*Math.sin(t*0.6); });
    if(fire) fire.scale.y = 0.8 + 0.3*Math.abs(Math.sin(t*8.3) + 0.5*Math.sin(t*13.1));
    if(fireL) fireL.intensity = 0.95 + 0.3*Math.sin(t*10.7) + 0.15*Math.sin(t*21.3);
    if(smoke) puffs.forEach(p=>{ p.material.opacity = smoke.material.opacity * 0.75; });
    if(tobi){
      const u = tobi.userData;
      if(u._rescued){ freed += dt; if(freed > 0.6 && u._idle !== 'idle'){ tobi.scale.set(1, 1, 1); u._idle = 'idle'; tobi.position.set(-9.5, 0, -5.0); } }
      else { tobi.scale.set(1, 1, 1); }
    }
  };
  if(typeof MINIMAP !== 'undefined') MINIMAP.scale = 5;
}


/* =========================================================================
   NACECA · scenes/tower.js (v9) — Ugbowo telecom tower compound at dusk.
   The original builder keeps the briefing, the engineer, the generator
   restart, the cabinet trace and the ambush along the east fence; the
   dressing swaps in the baked site, which wakes up when the power returns:
   floodlights and their pools, the aviation beacon, cabinet and panel LEDs.
   ========================================================================= */
function buildSceneTower(){
  buildSceneTowerLegacy();
  if(!ENVART.ready('tower')) return;
  const T = ENGINE._tower;
  const dr = dressScene('tower', {
    bg:'#262a50', fog:['#3a3048', 26, 92], dust:true,
    lights:{ sky:'#8a80b0', ground:'#3a2a20', hemi:0.55, key:['#ff9a6a', 0.7, [-14, 5, 8], [0, 0, 0]],
             shadow:{ r:9, far:40, follow:true, opacity:0.28, catcher:[0, 2, 34, 32] },
             points:[ { pos:[5, 2.0, 9.6], c:'#ffd9a0', i:0.45, d:5 }, { pos:[-7, 5.5, 14.5], c:'#ffa040', i:0.7, d:14, hi:true },
                      { pos:[-12.5, 6.5, -10.0], c:'#fff2cc', i:0, d:28, name:'floodA' }, { pos:[12.5, 6.5, 9.0], c:'#fff2cc', i:0, d:28, name:'floodB' } ] },
  });
  if(!dr) return;
  const D = dr.D;
  // the baked site carries its own beacon, LEDs and lamp glows: retire the old ones
  if(T){ [T.beacon, T.genLamp, T.cabLed].forEach(o=>{ if(o && o.parent) o.parent.remove(o); }); T.floods.forEach(f=>{ if(f.glow && f.glow.parent) f.glow.parent.remove(f.glow); }); }
  const byLabel = l=>{ const it = ENGINE.interactables.find(i=>i.label === l); return it && it.mesh; };
  const osaro = byLabel('Speak with Engr. Osaro');
  PROXY.list.forEach(g=>PROXY.scrub(g));
  if(osaro && osaro.userData && osaro.userData._proxy){
    // site engineer: hi-vis orange, yellow cap
    PROXY.dress(osaro, PROXY.outfit('#5a3818', '#e8902a', '#2a3a5a', '#0a0a08', { hair:'cap', capColor:'#f0d020', longSleeve:true }));
    osaro.userData._idle = 'folded';
  }
  if(T) T.ambushers.forEach(a=>{ if(a.userData && a.userData._flash) a.userData._flash.visible = false; });
  const fib = ENVART.softGlow(D.FibreGlow, '#ffd27a', 1.5);
  const setOp = (o, v)=>o.traverse(m=>{ if(m.isMesh) m.material.opacity = v; });
  const pools = D.Pools;
  if(pools) pools.traverse(m=>{ if(m.isMesh){ m.material = m.material.clone(); m.material.blending = THREE.AdditiveBlending; m.material.depthWrite = false; m.material.opacity = 0; m.renderOrder = 2; } });
  const show = (o, v)=>{ if(o) o.visible = v; };
  let lit = 0;
  ENGINE.sceneUpdate = dt=>{
    dr.t += dt; const t = dr.t, g = S.game, on = !!g._towerPower && !g._towerExpired;
    lit += ((on ? 1 : 0) - lit) * Math.min(1, dt * (on ? 2.5 : 6));
    show(D.Beacon, on && ((t % 1.4) < 0.18));
    show(D.CabLeds, on && ((t % 0.9) < 0.75)); show(D.GenLamp, on); show(D.GenScreen, !!g._towerPower);
    show(D.FloodGlows, lit > 0.05);
    if(pools){ pools.visible = lit > 0.02; setOp(pools, 0.55 * lit); }
    if(D.L_floodA) D.L_floodA.intensity = 1.25 * lit; if(D.L_floodB) D.L_floodB.intensity = 1.25 * lit;
    if(fib){ const live = !g._towerFibre; fib.visible = live; if(live) setOp(fib, 0.4 + 0.3*Math.sin(t*3.0)); }
  };
  if(typeof MINIMAP !== 'undefined') MINIMAP.scale = 5;
}


/* =========================================================================
   NACECA · scenes/ekosodin.js (v9) — Akintola Close, Ekosodin, at night.
   The original builder keeps the three finale routes (hold, tail, call),
   the two ways into the compound, Osas and the reveal; the dressing swaps
   in the baked street: lodges, the kiosk, sodium lamps, the blue gate and
   the boys' quarters, with gates that really swing and the car that comes.
   ========================================================================= */
function buildSceneEkosodin(){
  buildSceneEkosodinLegacy();
  if(!ENVART.ready('ekosodin')) return;
  const F = ENGINE._fin;
  const dr = dressScene('ekosodin', {
    bg:'#070b18', fog:['#121a2e', 18, 74], dust:true,
    lights:{ sky:'#3a4a70', ground:'#1a140e', hemi:0.5, key:['#8a9ac8', 0.42, [6, 10, 4], [0, 0, 0]],
             shadow:{ r:9, far:40, follow:true, opacity:0.3, catcher:[0, -2, 46, 30] },
             points:[ { pos:[-12, 4.6, -2.75], c:'#ffb860', i:0.85, d:13, name:'lamp0' }, { pos:[-2, 4.6, 2.75], c:'#ffb860', i:0.85, d:13, name:'lamp1' },
                      { pos:[7, 4.6, -2.75], c:'#ffb860', i:0.85, d:13, name:'lamp2', hi:true }, { pos:[16, 4.6, 2.75], c:'#ffb860', i:0.85, d:13, name:'lamp3', hi:true },
                      { pos:[11.85, 2.6, -4.9], c:'#ffe0b0', i:0.7, d:8, name:'gate' }, { pos:[-6, 1.9, -3.7], c:'#ffe0a0', i:0.5, d:6, hi:true } ] },
  });
  if(!dr) return;
  const D = dr.D, sc = ENGINE.scene;
  PROXY.list.forEach(g=>PROXY.scrub(g));
  // the old block house filled the yard: open the passage beside it to the boys' quarters
  const legacyBox = (o, x, z, w)=>Math.abs((o.minX+o.maxX)/2 - x) < 0.05 && Math.abs((o.minZ+o.maxZ)/2 - z) < 0.05 && Math.abs(o.maxX-o.minX-w) < 0.05;
  ENGINE.obstacles = ENGINE.obstacles.filter(o=>!legacyBox(o, 14, -10, 7) && !legacyBox(o, 15.5, -13.3, 4));
  // Osas is held at the boys' quarters door, in the side yard
  if(F && F.osas){ F.osas.position.set(17.65, 0, -11.85); F.osas.rotation.y = 0; }
  // hinged gates and the boss's car, driven by the story state
  const pivotAt = (o, x, z)=>{ if(!o) return null; const p = new THREE.Group(); p.position.set(x, 0, z); o.parent.add(p); p.updateMatrixWorld(true); p.attach(o); return p; };
  const gL = pivotAt(D.GateL, 12.08, -5.6), gR = pivotAt(D.GateR, 14.92, -5.6), gB = pivotAt(D.BackGate, 19.5, -12.45);
  const car = pivotAt(D.BossCar, 30.0, 1.2);
  const osasG = ENVART.softGlow(D.OsasGlow, '#ffd27a', 1.4);
  const setOp = (o, v)=>o.traverse(m=>{ if(m.isMesh) m.material.opacity = v; });
  const lamps = [D.L_lamp0, D.L_lamp1, D.L_lamp2, D.L_lamp3];
  const ease = (p, want, dt)=>{ if(p) p.rotation.y += (want - p.rotation.y) * Math.min(1, dt*2.2); };
  ENGINE.sceneUpdate = dt=>{
    dr.t += dt; const t = dr.t, g = S.game;
    ease(gL, g._finInside === 'front' ? 1.65 : 0, dt); ease(gR, g._finInside === 'front' ? -1.65 : 0, dt); ease(gB, g._finInside === 'back' ? -1.5 : 0, dt);
    if(osasG){ const on = !!g._finInside && !g._finOsas; osasG.visible = on; if(on) setOp(osasG, 0.4 + 0.3*Math.sin(t*3.0)); }
    lamps.forEach((l, i)=>{ if(l) l.intensity = 0.82 + Math.sin(t*(7+i)+i)*0.05 + (Math.random() < 0.004 ? -0.5 : 0); });
  };
  let staged = false;
  ENGINE.sceneAlways = ()=>{
    if(car && F && F.car) car.position.set(F.car.position.x, 0, F.car.position.z);
    // the reveal: she walks in through the blue gate; Kelechi and Uche turn to face her from the side passage
    if(!staged && S.game._finArrived && F){
      staged = true;
      const face = (o, x, z)=>{ o.rotation.y = Math.atan2(13.5 - x, -6.4 - z); };
      if(ENGINE.player){ ENGINE.player.position.set(16.4, 0, -8.6); face(ENGINE.player, 16.4, -8.6); ENGINE.playerYaw = ENGINE.player.rotation.y; ENGINE.cameraYaw = ENGINE.player.rotation.y; }
      if(F.uche){ F.uche.position.set(17.4, 0, -9.7); face(F.uche, 17.4, -9.7); }
      if(F.adaeze) F.adaeze.rotation.y = Math.atan2(16.4 - 13.5, -8.6 + 6.4);
      if(typeof resetCameraFollow === 'function') resetCameraFollow();
      if(typeof updateCamera === 'function') updateCamera();
    }
  };
  if(typeof MINIMAP !== 'undefined') MINIMAP.scale = 5;
}


/* ---------------- v8 HUD ---------------- */
const ICON = {
  inspect:'<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg>',
  talk:'<svg viewBox="0 0 24 24"><path d="M4 5h16v10H9l-5 4z"/><path d="M8 9h8M8 12h5"/></svg>',
  collect:'<svg viewBox="0 0 24 24"><path d="M5 8h14l-1.4 12H6.4z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
  open:'<svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="10" rx="1.5"/><path d="M8 10V7a4 4 0 0 1 7.6-1.7"/><circle cx="12" cy="15" r="1.4"/></svg>',
  search:'<svg viewBox="0 0 24 24"><path d="M3 9h18v11H3z"/><path d="M3 9l2-4h14l2 4"/><path d="M10 13h4"/></svg>',
  help:'<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
  arrest:'<svg viewBox="0 0 24 24"><circle cx="7.5" cy="14" r="4.5"/><circle cx="16.5" cy="14" r="4.5"/><path d="M12 14h0M7.5 9.5V6h9v3.5"/></svg>',
  exit:'<svg viewBox="0 0 24 24"><path d="M10 4H5v16h5"/><path d="M14 8l4 4-4 4M18 12H9"/></svg>',
  use:'<svg viewBox="0 0 24 24"><path d="M9 11V5a1.5 1.5 0 0 1 3 0v6M12 10V4a1.5 1.5 0 0 1 3 0v7M15 9.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-2.7L3.5 14a1.6 1.6 0 0 1 2.6-1.8L9 15"/></svg>',
  scan:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="2"/><path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7M5.6 5.6a9 9 0 0 0 0 12.8M18.4 5.6a9 9 0 0 1 0 12.8"/></svg>',
  crouch:'<svg viewBox="0 0 24 24"><circle cx="13" cy="4.5" r="2"/><path d="M12 8l-3 4 4 2-2 6M9 12l-3 2M13 14l5 1"/></svg>',
  run:'<svg viewBox="0 0 24 24"><circle cx="15" cy="4" r="2"/><path d="M13 7l-4 4 3 3-2 6M9 11l-4 1M12 14l5 1 2 4M13 7l4 3 3-1"/></svg>',
  folder:'<svg viewBox="0 0 24 24"><path d="M3 6h7l2 2h9v11H3z"/></svg>',
  doc:'<svg viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6z"/><path d="M9 11h6M9 14h6M9 17h4"/></svg>',
};
const VERB_LABEL = { inspect:'INSPECT', talk:'TALK', collect:'COLLECT', open:'OPEN', search:'SEARCH', help:'HELP', arrest:'ARREST', exit:'EXIT', use:'USE' };
function verbFor(it){
  if(!it) return null;
  if(it.verb) return it.verb;
  const l = (it.label||'').toLowerCase();
  if(/brief|talk|speak|question|ask|confront|negotiat|meet|interview|approach commander|greet/.test(l)) return 'talk';
  if(/scan|inspect|stop|verify|check|examine|trace|read/.test(l)) return 'inspect';
  if(/bag|collect|recover|take|seize|pick/.test(l)) return 'collect';
  if(/search/.test(l)) return 'search';
  if(/open|crack|unlock|breach/.test(l)) return 'open';
  if(/calm|escort|help|rescue|free|treat/.test(l)) return 'help';
  if(/arrest|cuff|move on|detain|apprehend/.test(l)) return 'arrest';
  if(/extract|deploy|board|leave|exit|end operation/.test(l)) return 'exit';
  return 'use';
}
function ensureHudV8(){
  if(document.getElementById('hud-ctx')) return;
  const hud = document.getElementById('hud');
  const add = html => { const t = document.createElement('div'); t.innerHTML = html.trim(); const el = t.firstChild; hud.appendChild(el); return el; };
  add(`<div class="hud-ctx" id="hud-ctx">
        <button class="ctx-main idle" id="ctx-main" aria-label="Interact"><span id="ctx-ico">${ICON.use}</span><span id="ctx-lbl">INTERACT</span></button>
        <div class="ctx-row"><button class="ctx-small" id="ctx-scan" aria-label="Scan">${ICON.scan}<span>SCAN</span></button><button class="ctx-small" id="ctx-crouch" aria-label="Crouch">${ICON.crouch}<span>CROUCH</span></button></div>
      </div>`);
  add(`<button class="hud-sprint" id="hud-sprint" aria-label="Sprint">${ICON.run}</button>`);
  add(`<div class="hud-casebar" id="hud-casebar"><button id="cb-case">${ICON.folder}CASE FILE</button><span class="sep"></span><button id="cb-ev">${ICON.doc}EVIDENCE <b><span id="cb-ev-cur">0</span>/<span id="cb-ev-max">0</span></b></button></div>`);
  add(`<button class="hud-pausebtn" id="hud-pausebtn" aria-label="Pause"><span><i></i><i></i></span></button>`);
  const wl = document.createElement('div'); wl.id = 'world-label';
  wl.innerHTML = '<span class="wl-key">E</span><span class="wl-dia"></span><span class="wl-txt"></span>';
  document.getElementById('game-root').appendChild(wl);
  const tap = (id, fn) => { const el = document.getElementById(id); el.addEventListener('click', e=>{ e.stopPropagation(); fn(); }); el.addEventListener('touchstart', e=>{ e.stopPropagation(); }, {passive:true}); };
  tap('ctx-main', ()=>{ if(ENGINE.movementEnabled && !isOverlayOpen()) tryInteract(); });
  tap('ctx-scan', ()=>{ if(ENGINE.movementEnabled) triggerScan(); });
  tap('ctx-crouch', ()=>{ ENGINE.keys['KeyC'] = !ENGINE.keys['KeyC']; document.getElementById('ctx-crouch').classList.toggle('on', !!ENGINE.keys['KeyC']); if(ENGINE.keys['KeyC']) setSprint(false); haptic(10); });
  tap('hud-sprint', ()=>{ setSprint(!ENGINE.keys['ShiftLeft']); haptic(10); });
  tap('cb-case', ()=>{ if(ENGINE.movementEnabled) openCaseFile(); });
  tap('cb-ev', ()=>{ if(ENGINE.movementEnabled) openCaseFile(); });
  tap('hud-pausebtn', ()=>togglePause());
  // start card: touch instructions instead of keys
  const grid = document.querySelector('#screen-controls .controls-grid');
  if(grid && !document.querySelector('.touch-tips')){
    const tips = document.createElement('div'); tips.className = 'touch-tips';
    tips.innerHTML = '<div><b>LEFT STICK</b>Move · push further to jog</div><div><b>DRAG RIGHT SIDE</b>Look around</div><div><b>ACTION BUTTON</b>Talk · inspect · collect</div><div><b>SCAN · CROUCH · SPRINT</b>Buttons by your thumbs</div>';
    grid.parentNode.insertBefore(tips, grid);
  }
  const tip = document.querySelector('#screen-controls .controls-tip');
  if(tip && document.body.classList.contains('touch-active')) tip.textContent = 'Follow the gold marker to your next objective. The action button changes to Talk, Inspect, Collect or Open when something is in reach.';
}
function setSprint(on){
  ENGINE.keys['ShiftLeft'] = !!on;
  if(on){ ENGINE.keys['KeyC'] = false; const c = document.getElementById('ctx-crouch'); if(c) c.classList.remove('on'); }
  const b = document.getElementById('hud-sprint'); if(b) b.classList.toggle('on', !!on);
}
/* one active objective on the HUD; the full list sits in the Case File */
function renderObjectives(){
  const objs = S.game.objectives || [];
  const act = objs.find(o=>!o.done);
  const done = objs.filter(o=>o.done).length;
  const el = $('#hud-mission-objs'); if(!el) return;
  if(!objs.length){ el.innerHTML = ''; return; }
  el.innerHTML = act
    ? `<div class="obj active" style="display:flex">${act.text}<span class="obj-count">${done+1}/${objs.length}</span></div>`
    : `<div class="obj allclear" style="display:flex">All clear — extract<span class="obj-count">${objs.length}/${objs.length}</span></div>`;
}
function refreshHUD(){
  refreshHUDCore();
  const c = document.getElementById('cb-ev-cur'); if(c) c.textContent = missionEvidenceCount();
}
function setEvidenceMax(n){ setEvidenceMaxCore(n); const m = document.getElementById('cb-ev-max'); if(m) m.textContent = n; }
/* world-anchored prompt + contextual action button */
const _wl = { v:null };
function updateInteractPrompt(){
  ensureHudV8();
  placeMetersTouch();
  const near = ENGINE.seq ? null : nearestInteractable();
  const wl = document.getElementById('world-label');
  const btn = document.getElementById('ctx-main');
  const verb = verbFor(near);
  if(btn){
    btn.classList.toggle('idle', !near); btn.classList.toggle('ready', !!near);
    const key = near ? verb : 'none';
    if(btn._v !== key){ btn._v = key; document.getElementById('ctx-ico').innerHTML = ICON[verb||'use'] || ICON.use; document.getElementById('ctx-lbl').textContent = near ? (VERB_LABEL[verb]||'USE') : 'INTERACT'; }
  }
  if(!near || !ENGINE.camera){ if(wl) wl.style.display = 'none'; ENGINE._nearIt = null; return; }
  ENGINE._nearIt = near;
  if(!_wl.v) _wl.v = new THREE.Vector3();
  const m = near.mesh, pos = m.position;
  let h = near.labelY;
  if(h === undefined) h = (m.userData && (m.userData._skinned || m.userData._rig)) ? 2.05 : 0.9;
  _wl.v.set(pos.x, (pos.y||0) + h, pos.z).project(ENGINE.camera);
  if(_wl.v.z > 1){ wl.style.display = 'none'; return; }
  const W = innerWidth, H = innerHeight;
  // phones get the short form of long labels ("Board NACECA van — proceed to…" → "Board NACECA van")
  let txt = near.label.replace(/\s*\(.*?\)\s*/g,' ').trim();
  if(W < 600 && txt.length > 26 && txt.indexOf(' — ') > 6) txt = txt.slice(0, txt.indexOf(' — '));
  const t = wl.querySelector('.wl-txt');
  if(t.textContent !== txt){ t.textContent = txt; wl._w = 0; }
  wl.style.display = 'flex';
  if(!wl._w) wl._w = wl.offsetWidth || 220;
  let x = (_wl.v.x*0.5+0.5)*W + 18, y = (-_wl.v.y*0.5+0.5)*H;
  // keep clear of the mission panel and, on touch, of the thumb controls
  const touch = document.body.classList.contains('touch-active');
  x = Math.max(8, Math.min(W - wl._w - 8, x)); y = Math.max(touch ? 140 : 80, Math.min(H - (touch ? 300 : 220), y));
  wl.style.transform = `translate(${x}px, ${y}px) translate(0,-50%)`;
}
/* phones: pressure meters (wipe countdown, chase gap) sit right under the mission panel */
function placeMetersTouch(){
  const m = document.getElementById('hud-meters'); if(!m) return;
  if(!document.body.classList.contains('touch-active')){ if(m.style.top){ m.style.top = ''; m.style.width = ''; } return; }
  if(!m.childElementCount) return;
  const panel = document.querySelector('.hud-topleft .hud-mission'); if(!panel) return;
  const r = panel.getBoundingClientRect(); if(!r.height) return;
  m.style.top = Math.round(r.bottom + 8) + 'px';
  m.style.width = Math.round(Math.max(200, r.width)) + 'px';
}
/* evidence markers: diamond pips; label only when close (and not under the action label) */
function updateMarkers(){
  if(!ENGINE.camera || !ENGINE.player) return;
  const layer = $('#markers-layer');
  for(const m of ENGINE.evidenceMarkers){
    if(!m.el){
      const el = document.createElement('div'); el.className = 'evidence-marker' + (m.cls ? ' ' + m.cls : '');
      el.innerHTML = `<div class="pip"></div><div class="lbl">${m.label}<span class="sub">${m.sub||''}</span></div>`;
      layer.appendChild(el); m.el = el;
    }
    if(m.collected) m.el.classList.add('collected');
    const v = m.worldPos.clone().project(ENGINE.camera);
    const d = m.worldPos.distanceTo(ENGINE.player.position);
    if(v.z > 1 || v.z < -1 || d > 16){ m.el.style.display = 'none'; continue; }
    m.el.style.display = 'flex';
    m.el.style.left = ((v.x*0.5+0.5)*innerWidth) + 'px';
    m.el.style.top = ((-v.y*0.5+0.5)*innerHeight) + 'px';
    m.el.style.opacity = m.collected ? 0.35 : Math.max(0.45, Math.min(1, 1.25 - d/14));
    const nearIt = ENGINE._nearIt;
    const under = nearIt && nearIt.mesh && nearIt.mesh.position && m.worldPos.distanceTo(nearIt.mesh.position) < 1.6;
    m.el.classList.toggle('near', d < 4.5 && !under);
    m.el.classList.toggle('hide-lbl', !!under);
  }
}
/* touch controls: stick + right-side look; HUD buttons stop propagation */
function bindTouchControls(){
  const j = $('#joystick'), k = $('#joystick-knob');
  let touchId = null, cx = 0, cy = 0;
  j.addEventListener('touchstart', e=>{ const t = e.changedTouches[0]; touchId = t.identifier; const r = j.getBoundingClientRect(); cx = r.left + r.width/2; cy = r.top + r.height/2; e.preventDefault(); }, {passive:false});
  j.addEventListener('touchmove', e=>{
    for(const t of e.changedTouches){ if(t.identifier !== touchId) continue;
      let dx = t.clientX - cx, dy = t.clientY - cy; const R = 52, L = Math.hypot(dx, dy);
      if(L > R){ dx *= R/L; dy *= R/L; }
      k.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      ENGINE._touch = { x:dx/R, y:dy/R };
    }
    e.preventDefault();
  }, {passive:false});
  const end = e=>{ for(const t of e.changedTouches){ if(t.identifier === touchId){ touchId = null; ENGINE._touch = null; k.style.transform = 'translate(-50%,-50%)'; } } };
  j.addEventListener('touchend', end); j.addEventListener('touchcancel', end);
  let camId = null, lx = 0, ly = 0;
  const isUI = el => el && el.closest && el.closest('#joystick, .hud-ctx, .hud-sprint, .hud-casebar, .hud-pausebtn, .hud-topleft, .hud-topright, .overlay, .touch-btns');
  document.addEventListener('touchstart', e=>{
    if(isOverlayOpen() || !ENGINE.movementEnabled) return;
    for(const t of e.changedTouches){
      if(camId === null && t.clientX > innerWidth*0.38 && !isUI(t.target)){ camId = t.identifier; lx = t.clientX; ly = t.clientY; }
    }
  }, {passive:true});
  document.addEventListener('touchmove', e=>{
    if(camId === null) return; if(isOverlayOpen()){ camId = null; return; }
    for(const t of e.changedTouches){ if(t.identifier !== camId) continue;
      ENGINE.cameraYaw -= (t.clientX - lx) * 0.0055;
      ENGINE.playerPitch = clamp(ENGINE.playerPitch + (t.clientY - ly) * 0.0035, -0.05, 0.95);
      lx = t.clientX; ly = t.clientY; ENGINE._lastCamDrag = performance.now();
    }
  }, {passive:true});
  const camEnd = e=>{ for(const t of e.changedTouches) if(t.identifier === camId) camId = null; };
  document.addEventListener('touchend', camEnd); document.addEventListener('touchcancel', camEnd);
  // sprint switches itself off when the stick is released
  setInterval(()=>{ if(ENGINE.keys['ShiftLeft'] && !ENGINE._touch && document.body.classList.contains('touch-active')){ ENGINE._sprintIdle = (ENGINE._sprintIdle||0) + 1; if(ENGINE._sprintIdle > 4) { setSprint(false); ENGINE._sprintIdle = 0; } } else ENGINE._sprintIdle = 0; }, 200);
}
/* Case File: operation status (all objectives + reputation) above the board */
function openEvidenceBoard(){
  openEvidenceBoardCore();
  const frame = document.querySelector('.evidence-board-frame'); if(!frame) return;
  let st = document.getElementById('eb-status');
  if(!st){ st = document.createElement('div'); st.id = 'eb-status'; st.className = 'eb-status'; frame.insertBefore(st, document.getElementById('eb-canvas-wrap')); }
  const objs = S.game.objectives || [], r = S.player.reputation;
  const bar = (lbl, v, col)=>`<div class="rr"><span>${lbl}</span><div class="rb"><i style="width:${v}%;background:${col}"></i></div><span class="rv">${v}</span></div>`;
  st.innerHTML = `<div><h4>${(MISSIONS.find(m=>m.id===S.game.currentMission)||{name:'OPERATION'}).name.toUpperCase()}</h4>${objs.map(o=>`<div class="so ${o.done?'done':''}">${o.text}</div>`).join('') || '<div class="so">No active operation</div>'}</div>
    <div><h4>REPUTATION</h4>${bar('INTEGRITY', r.integrity, '#5dd07a')}${bar('PUBLIC TRUST', r.publicTrust, '#4aa3e8')}${bar('AGENCY FAVOUR', r.agencyFavour, '#b07be8')}
    <button class="skills-link" id="eb-skills">SKILL TREE · ${S.player.skillPoints||0} PTS</button></div>`;
  const sk = document.getElementById('eb-skills'); if(sk) sk.onclick = ()=>openSkillTree();
  if(typeof sideCaseFile==='function') sideCaseFile(st);
}


/* ---------------- flow: scenes, frame loop, mission start ---------------- */
function newScene(opts){
  const old = ENGINE.scene;
  ENGINE.sceneUpdate = null; ENGINE.sceneAlways = null; ENGINE._mansion = null; ENGINE.ceilingY = undefined; ENGINE.inside = null; ENGINE.seq = null; ENGINE.extraSkinned = [];
  ENGINE._policeRed = null; ENGINE._policeBlue = null;
  setCameraSolids(null); resetCameraFollow(); ENGINE._dress = null; ENGINE._talkTarget = null;
  if(typeof PROXY !== 'undefined') PROXY.clear();
  if(typeof VEH !== 'undefined') VEH.clear();
  sceneLook('default');
  if(typeof MINIMAP !== 'undefined') MINIMAP.scale = 6;
  const s = newSceneCore(opts);
  try{ disposeScene(old); }catch(e){ console.warn('[NACECA] scene cleanup skipped', e); }
  return s;
}
/* Free the previous scene's GPU memory (geometry, materials, textures, shadow
   maps, bone textures) so phones don't fill up across missions. The shared
   character and mansion assets stay resident. */
function disposeScene(old){
  if(!old || old === ENGINE.scene) return;
  const keepGeo = new Set(), keepMat = new Set(), keepTex = new Set();
  if(typeof PEOPLE !== 'undefined'){
    if(PEOPLE.gltf) PEOPLE.gltf.scene.traverse(o=>{ if(o.geometry) keepGeo.add(o.geometry); });
    if(PEOPLE.gltfF) PEOPLE.gltfF.scene.traverse(o=>{ if(o.geometry) keepGeo.add(o.geometry); });
    if(PEOPLE.lodGeo) keepGeo.add(PEOPLE.lodGeo); if(PEOPLE.lodGeoF) keepGeo.add(PEOPLE.lodGeoF);
    if(PEOPLE._mats) PEOPLE._mats.forEach((m, t)=>{ keepMat.add(m); keepTex.add(t); });
    if(PEOPLE.__bg) keepGeo.add(PEOPLE.__bg);
    if(PEOPLE.__bm){ keepMat.add(PEOPLE.__bm); keepTex.add(PEOPLE.__bm.map); }
  }
  // the vehicle library (geometry, atlas, materials) is shared by every exterior scene; its reflection map is per scene
  if(typeof VEH !== 'undefined'){ VEH.keep(keepGeo, keepMat, keepTex); VEH.release(); }
  // (environment geometry, lightmaps and painted textures are freed too: three.js re-uploads them if a later scene uses them)
  const geos = new Set(), mats = new Set(), texs = new Set();
  old.traverse(o=>{
    if(o.isLight && o.shadow && o.shadow.map){ o.shadow.map.dispose(); o.shadow.map = null; }
    if(o.isSkinnedMesh && o.skeleton && o.skeleton.dispose) o.skeleton.dispose();
    if(o.geometry && !keepGeo.has(o.geometry)) geos.add(o.geometry);
    const ms = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
    for(const m of ms){
      if(keepMat.has(m)) continue;
      mats.add(m);
      for(const k in m){ const v = m[k]; if(v && v.isTexture && !keepTex.has(v)) texs.add(v); }
      if(m.uniforms) for(const k in m.uniforms){ const v = m.uniforms[k] && m.uniforms[k].value; if(v && v.isTexture && !keepTex.has(v)) texs.add(v); }
    }
  });
  if(old.background && old.background.isTexture && !keepTex.has(old.background)) texs.add(old.background);
  geos.forEach(g=>g.dispose()); mats.forEach(m=>m.dispose()); texs.forEach(t=>t.dispose());
  if(typeof PEOPLE !== 'undefined' && PEOPLE.evict) PEOPLE.evict();
  // drop decoded environments, their materials and the painted canvases the next scene will not use
  // (phones, iOS Safari above all, cap total canvas memory); anything needed again is re-made on demand
  const next = ENGINE._nextEnv || null;
  if(typeof ENVART !== 'undefined'){
    for(const k of Object.keys(ENVART.sets)){
      const S = ENVART.sets[k]; if(k === next || !S || !S.ready) continue;
      if(S.lm) S.lm.dispose(); if(S.gltf) S.gltf.scene.traverse(o=>{ if(o.geometry) o.geometry.dispose(); });
      delete ENVART.sets[k];
    }
    for(const id of Object.keys(ENVART.mats)){ if(next && (id.startsWith(next+'/') || id.startsWith(next+'#'))) continue; const m = ENVART.mats[id]; if(m && m.dispose) m.dispose(); delete ENVART.mats[id]; }
  }
  if(typeof MANSION !== 'undefined' && MANSION.tex && !MANSION._inUse){
    for(const k of Object.keys(MANSION.tex)){ const t = MANSION.tex[k]; if(t && t.dispose) t.dispose(); delete MANSION.tex[k]; }
  }
}
function tick(){
  requestAnimationFrame(tick);
  if(!ENGINE.scene) return;
  const dt = Math.min(0.1, ENGINE.clock.getDelta()); ENGINE._dt = dt;
  const playing = ENGINE.movementEnabled && !isOverlayOpen();
  if(playing){
    updatePlayer(dt);
    updateCamera();
    updateInteractPrompt();
    updateMarkers();
    updateNPCs(dt);
    updateMinimap();
    updateAtmosphere(dt);
    if(typeof sideTick==='function') sideTick(dt);
  } else {
    updateAtmosphere(dt);
    if($('#screen-title').classList.contains('show')) updateTitleCam(dt);
    if(ENGINE.movementEnabled){ const wl = document.getElementById('world-label'); if(wl) wl.style.display = 'none'; }
  }
  // skinned characters keep breathing and talking under dialogue and menus
  if(ART.ready && typeof PEOPLE !== 'undefined') PEOPLE.updateAll(playing ? dt : dt*0.999);
  if(ENGINE.sceneUpdate && playing) ENGINE.sceneUpdate(dt);
  if(ENGINE.sceneAlways) ENGINE.sceneAlways(dt);          // story-driven props that move under dialogue
  if(typeof VEH !== 'undefined') VEH.update(dt);           // beacons keep flashing under dialogue too
  if(ENGINE._dress && ENGINE._dress.sun) ENVART.follow();
  if(ENGINE.scanActive>0){ ENGINE.scanActive -= dt; if(ENGINE.scanActive<=0) $('#scan-fx').classList.remove('show'); }
  if(typeof MINI !== 'undefined' && MINI.active && !MINI.active.paused) return;   // v11: a field skill covers the screen
  if(POST.rt && !ENGINE._postOff){
    ENGINE.renderer.setRenderTarget(POST.rt);
    ENGINE.renderer.render(ENGINE.scene, ENGINE.camera);
    ENGINE.renderer.setRenderTarget(null);
    POST.mat.uniforms.tDiffuse.value = POST.rt.texture;
    POST.mat.uniforms.time.value += dt;
    ENGINE.renderer.render(POST.scene, POST.cam);
  } else {
    ENGINE.renderer.render(ENGINE.scene, ENGINE.camera);
  }
}
/* mission start waits (briefly) for the character + mansion art the first time */
const ENV_FOR = { m1:'hq', m2:'market', m4:'checkpoint', m5:'shrine', m6:'warehouse', m7:'tower', m8:'ekosodin' };
function beginMission(id){
  if(!ART.ready && !ART.failed && ART.promise){
    toast('LOADING', 'Preparing the operation…', 1600);
    ART.promise.then(()=>beginMission(id));
    return;
  }
  // the cold open's street traffic is drawn from the vehicle library: make sure it is decoded first
  if(ART.ready && typeof VEH !== 'undefined' && VEH.has() && !VEH.ready && !VEH.failed && !ENV_FOR[id]){
    if(ENGINE._pendingBegin === id) return;
    ENGINE._pendingBegin = id;
    VEH.load().then(()=>{ ENGINE._pendingBegin = null; beginMission(id); });
    return;
  }
  const ek = ENV_FOR[id];
  if(ART.ready && ek && ENVART.has(ek) && !ENVART.ready(ek) && !(ENVART.sets[ek] && ENVART.sets[ek].failed)){
    if(ENGINE._pendingBegin === id) return;
    ENGINE._pendingBegin = id;
    toast('LOADING', 'Preparing the operation…', 1600);
    ENVART.load(ek).then(()=>{ ENGINE._pendingBegin = null; beginMission(id); });
    return;
  }
  ENGINE._nextEnv = ek || (id === 'm3' ? 'mansion' : null);
  ENGINE.playerPitch = 0.42; ENGINE._lastCamDrag = 0;
  setSprint(false); ENGINE.keys['KeyC'] = false; const cc = document.getElementById('ctx-crouch'); if(cc) cc.classList.remove('on');
  beginMissionCore(id);
  // M2 used to start Kelechi half inside the van, facing away from the market:
  // step him out of the back doors and look down the market street instead.
  if(id === 'm2' && ENGINE.player && ENGINE.player.position.z > 11){
    ENGINE.player.position.set(0, 0, 9.4); ENGINE.player.rotation.y = Math.PI;
    ENGINE.playerYaw = ENGINE.cameraYaw = Math.PI;
  }
  // the first two operations had furniture Kelechi could walk straight through
  (EXTRA_OBSTACLES[id] || []).forEach(o=>addObstacle(o[0], o[1], o[2], o[3]));
  faceFirstObjective();
  resetCameraFollow();
  ensureHudV8(); renderObjectives(); refreshHUD();
  if(typeof sideSetup==='function') sideSetup(id);
}
const EXTRA_OBSTACLES = {
  m1: [[0,0,6.1,2.5], [-1.5,1.6,0.6,0.6], [1.5,1.6,0.6,0.6], [0,-7.5,4.1,1.7]],   // briefing table, chairs, commander's desk
  m2: [[0,14,2.5,4.6]],                                                           // NACECA van
};
/* every operation opens with the camera behind Kelechi, facing the first thing to do */
function faceFirstObjective(){
  const P = ENGINE.player; if(!P || typeof guideTarget !== 'function') return;
  const t = guideTarget(); if(!t || !t.mesh || !t.mesh.position) return;
  const dx = t.mesh.position.x - P.position.x, dz = t.mesh.position.z - P.position.z;
  if(Math.hypot(dx, dz) < 2.5) return;               // already next to it: keep the authored framing
  P.rotation.y = Math.atan2(dx, dz);
  ENGINE.playerYaw = ENGINE.cameraYaw = P.rotation.y;
}
/* skinned NPCs turn to face Kelechi when he talks to them, like the old rigs */
function faceEachOther(it){
  const m = it && it.mesh; if(!m || !ENGINE.player) return;
  if(!(m.userData && (m.userData._rig || m.userData._skinned)) || m.userData._down || m.userData._arrested) return;
  if(CHASE && CHASE.active && CHASE.active.runner === m) return;
  m.userData._faceT = 1.4; ENGINE._talkTarget = m;
  const p = ENGINE.player.position;
  ENGINE.player.rotation.y = Math.atan2(m.position.x - p.x, m.position.z - p.z);
  ENGINE.playerYaw = ENGINE.player.rotation.y;
}



/* =========================================================================
   NACECA · systems/minigames.js (v11)
   Field skills: short, touch-first mini-games that sit on top of the key
   moments of each case. Every game can be failed and failing costs
   something (reputation, time, evidence quality), but it never blocks the
   story: after a failure the player can try again, force it at a price,
   or back off and come back.
     dial     padlock tumblers — tap as the needle crosses the gold arc
     steady   lift / trace along a path without touching the edges
     wires    reconnect coloured leads to the right terminals
     spot     tap the red flags in a message or document
     procs    kill the processes that are wiping a disk
     pattern  repeat an unlock pattern you saw once
     tune     match a drifting signal and hold the lock
     sort     bag items by type before the clock runs out
     mash     rapid taps against decay
   All world timers already pause while an overlay is open; the games that
   should keep the pressure on (wipe clock, smoke, trace window) push their
   own time back into the world through cfg.onTick.
   ========================================================================= */
const MINI = { active:null };
const MG_TYPES = {};
const MG_TAU = Math.PI * 2;

function miniDiff(){
  const d = (typeof SETTINGS !== 'undefined' && SETTINGS.difficulty) || 'standard';
  const T = {
    story:    { key:'story',    strikes:5, speed:0.78, tol:1.4,  time:1.5 },
    standard: { key:'standard', strikes:3, speed:1.0,  tol:1.0,  time:1.0 },
    hard:     { key:'hard',     strikes:2, speed:1.22, tol:0.76, time:0.82 },
  };
  return T[d] || T.standard;
}
function miniIsOpen(){ return !!MINI.active; }

function miniScreen(){
  let ov = document.getElementById('screen-minigame');
  if(ov) return ov;
  ov = document.createElement('div'); ov.className = 'overlay'; ov.id = 'screen-minigame';
  ov.innerHTML = `<div class="overlay-bg mg-bg"></div>
    <div class="mg-frame" id="mg-frame">
      <div class="mg-head">
        <div><div class="mg-kicker" id="mg-kicker"></div><div class="mg-title" id="mg-title"></div></div>
        <div style="display:flex;gap:12px;align-items:flex-start"><div class="mg-strikes" id="mg-strikes"></div>
          <button class="mg-x" id="mg-x" aria-label="Back off" style="background:none;border:0;color:#9ba8bd;font-size:20px;line-height:1;cursor:pointer;padding:0 2px">✕</button></div>
      </div>
      <div class="mg-timer" id="mg-timer"><i id="mg-timer-fill"></i></div>
      <div class="mg-sub" id="mg-sub"></div>
      <div class="mg-meter mg-world" id="mg-world" style="display:none"><span class="lbl"></span><div class="bar"><i></i></div><span class="val"></span></div>
      <div class="mg-stage" id="mg-stage"></div>
      <div class="mg-msg" id="mg-msg"></div>
      <div class="mg-actions" id="mg-actions"></div>
    </div>`;
  (document.getElementById('game-root') || document.body).appendChild(ov);
  ov.querySelector('#mg-x').addEventListener('click', ()=>{ if(MINI.active) miniBackOff(); });
  return ov;
}

/* ---------- small helpers shared by the games ---------- */
function mgCanvas(host, w, h){
  const c = document.createElement('canvas');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = Math.round(w*dpr); c.height = Math.round(h*dpr);
  c.style.width = w + 'px'; c.style.height = h + 'px';
  const x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0);
  host.appendChild(c);
  return { c, x, w, h };
}
function mgAngDist(a, b){ let d = Math.abs(a - b) % MG_TAU; return Math.min(d, MG_TAU - d); }
function mgShuffle(a){ const r = a.slice(); for(let i=r.length-1;i>0;i--){ const j = (Math.random()*(i+1))|0; [r[i], r[j]] = [r[j], r[i]]; } return r; }
function mgEl(tag, cls, html){ const e = document.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; }
function mgPointerPos(c, e){ const r = c.getBoundingClientRect(); return { x:(e.clientX - r.left) * (parseFloat(c.style.width)/r.width), y:(e.clientY - r.top) * (parseFloat(c.style.height)/r.height) }; }
function mgSfx(kind){
  try{
    if(kind === 'good' && typeof sfxClick === 'function') sfxClick();
    if(kind === 'bad' && typeof sfxFail === 'function') sfxFail();
    if(kind === 'win' && typeof sfxComplete === 'function') sfxComplete();
    if(kind === 'tick' && typeof sfxBlip === 'function') sfxBlip();
    if(kind === 'pick' && typeof sfxEvidence === 'function') sfxEvidence();
  }catch(e){}
}
function mgHaptic(p){ if(typeof haptic === 'function') haptic(p); }

/* ---------- the runner ---------- */
function miniPlay(cfg, done){
  if(MINI.active || !MG_TYPES[cfg.type]) return false;
  const ov = miniScreen();
  const diff = miniDiff();
  const run = MINI.active = {
    cfg, done, diff, phase:'intro', strikes:0, t:0, attempts:1, paused:false,
    strikesMax: cfg.noStrikes ? 0 : (cfg.strikes != null ? cfg.strikes : diff.strikes),
    timeMax: cfg.time ? cfg.time * diff.time : 0,
    game:null, raf:0, last:performance.now(), keysDown:{},
  };
  if(typeof duckMusic === 'function') duckMusic(true);
  ENGINE._touch = null; if(ENGINE.keys){ ENGINE.keys['KeyW'] = ENGINE.keys['KeyA'] = ENGINE.keys['KeyS'] = ENGINE.keys['KeyD'] = false; }
  if(typeof showOverlay === 'function') showOverlay('screen-minigame'); else ov.classList.add('show');
  $('#mg-kicker').textContent = cfg.kicker || 'FIELD SKILL';
  $('#mg-title').textContent = cfg.title || 'FIELD SKILL';
  miniBuild(run);
  miniIntro(run);
  const step = now=>{
    if(MINI.active !== run) return;
    run.raf = requestAnimationFrame(step);
    const dt = Math.min(0.05, Math.max(0, (now - run.last) / 1000)); run.last = now;
    // watchdog: another screen (pause, settings) may have taken over — wait, then come back
    if(!ov.classList.contains('show')){
      const other = document.querySelector('.overlay.show');
      if(other){ run.paused = true; return; }
      ov.classList.add('show');
    }
    run.paused = false;
    if(run.phase === 'play'){
      run.t += dt;
      if(cfg.onTick){ try{ cfg.onTick(dt, run); }catch(e){ console.error(e); } }
      if(cfg.abortIf && cfg.abortIf()){ miniAbort(run, cfg.abortText || 'Too late.'); return; }
      if(run.timeMax){
        const f = Math.max(0, 1 - run.t / run.timeMax);
        $('#mg-timer-fill').style.width = (f*100).toFixed(1) + '%';
        $('#mg-timer').classList.toggle('low', f < 0.25);
        if(run.t >= run.timeMax){ miniFail(run, cfg.timeText || 'Out of time.'); return; }
      }
    }
    if(run.game && run.game.update) run.game.update(run.phase === 'play' ? dt : 0, run.phase);
    if(cfg.meter) miniWorldMeter(cfg.meter());
  };
  run.raf = requestAnimationFrame(step);
  return true;
}

function miniApi(run){
  const stage = $('#mg-stage');
  return {
    stage, diff:run.diff, cfg:run.cfg, P:run.cfg.params || {},
    width(){ return Math.max(240, Math.min(stage.clientWidth || 320, 460)); },
    strike(text){ miniStrike(run, text); },
    success(extra){ miniSuccess(run, extra || {}); },
    fail(text){ miniFail(run, text); },
    msg(text, cls){ const m = $('#mg-msg'); m.textContent = text || ''; m.className = 'mg-msg' + (cls ? ' ' + cls : ''); },
    actions(list){ miniActions(list); },
    flash(good){ const f = $('#mg-frame'); f.classList.remove('mg-flash-good','mg-flash-bad'); void f.offsetWidth; f.classList.add(good ? 'mg-flash-good' : 'mg-flash-bad'); },
    addTime(s){ run.t = Math.min(run.timeMax || 1e9, run.t + s); },
    timeFrac(){ return run.timeMax ? run.t / run.timeMax : 0; },
    playing(){ return run.phase === 'play' && !run.paused; },
  };
}
function miniBuild(run){
  if(run.game && run.game.destroy){ try{ run.game.destroy(); }catch(e){} }
  const stage = $('#mg-stage'); stage.innerHTML = '';
  $('#mg-sub').innerHTML = run.cfg.sub || '';
  miniWorldMeter(run.cfg.meter ? run.cfg.meter() : null);
  $('#mg-timer').classList.toggle('off', !run.timeMax);
  $('#mg-timer-fill').style.width = '100%'; $('#mg-timer').classList.remove('low');
  run.strikes = 0; run.t = 0;
  miniPips(run);
  run.api = miniApi(run);
  run.game = MG_TYPES[run.cfg.type](run.api, run.cfg.params || {});
}
/* the world clock that keeps running while you work (wipe, smoke, trace window) */
function miniWorldMeter(m){
  const el = document.getElementById('mg-world'); if(!el) return;
  if(!m){ el.style.display = 'none'; return; }
  el.style.display = 'flex';
  el.querySelector('.lbl').textContent = m.label;
  const f = Math.max(0, Math.min(1, m.frac));
  const i = el.querySelector('i'); i.style.width = (f*100).toFixed(1) + '%'; i.classList.toggle('good', !!m.good);
  el.querySelector('.val').textContent = m.text || '';
}
function miniPips(run){
  const el = $('#mg-strikes'); if(!el) return;
  el.innerHTML = run.strikesMax ? Array.from({length:run.strikesMax}, (_, i)=>`<i class="${i < run.strikes ? 'lost' : ''}"></i>`).join('') : '';
}
function miniActions(list){
  const host = $('#mg-actions'); host.innerHTML = '';
  (list || []).forEach(a=>{
    const b = mgEl('button', 'btn ' + (a.cls || '') + (a.big ? ' big' : ''), a.label + (a.note ? `<small>${a.note}</small>` : ''));
    b.addEventListener('click', e=>{ e.stopPropagation(); a.onClick && a.onClick(); });
    if(a.primary) b.dataset.primary = '1';
    host.appendChild(b);
  });
}
function miniIntro(run){
  run.phase = 'intro';
  run.api.msg(run.attempts > 1 ? `ATTEMPT ${run.attempts}` : (run.cfg.introMsg || ''), '');
  miniActions([
    { label:(run.cfg.startLabel || 'START') + ' ▶', cls:'primary', big:true, primary:true, onClick:()=>miniStart(run) },
    { label:'BACK OFF', cls:'ghost', onClick:()=>miniBackOff() },
  ]);
}
function miniStart(run){
  if(run.phase !== 'intro') return;
  run.phase = 'play'; run.t = 0; run.api.msg('', '');
  miniActions([]);
  if(run.game && run.game.start) run.game.start();
  if(typeof sfxScan === 'function' && run.cfg.startSfx !== false){ try{ sfxScan(); }catch(e){} }
}
function miniStrike(run, text){
  if(run.phase !== 'play') return;
  run.strikes++;
  miniPips(run); mgSfx('bad'); mgHaptic(60);
  const st = $('#mg-stage'); st.classList.remove('mg-shake'); void st.offsetWidth; st.classList.add('mg-shake');
  run.api.flash(false);
  if(text) run.api.msg(text, 'bad');
  if(run.cfg.onStrike){ try{ run.cfg.onStrike(run); }catch(e){} }
  if(run.strikesMax && run.strikes >= run.strikesMax) miniFail(run, run.cfg.strikeText || 'Too many mistakes.');
}
function miniStars(run, extra){
  if(extra && extra.stars != null) return Math.max(1, Math.min(3, extra.stars));
  const tf = run.timeMax ? run.t / run.timeMax : 0.5;
  if(run.strikes === 0) return tf < 0.78 ? 3 : 2;
  if(run.strikes === 1) return 2;
  return 1;
}
function miniSuccess(run, extra){
  if(run.phase !== 'play') return;
  run.phase = 'result';
  const stars = miniStars(run, extra);
  run.result = { ok:true, stars, strikes:run.strikes, time:run.t, attempts:run.attempts };
  // bookkeeping: per operation and best-ever
  const id = run.cfg.id || run.cfg.type;
  S.game._mg = S.game._mg || {};
  const prev = S.game._mg[id] || {};
  const first = !prev.ok;
  S.game._mg[id] = Object.assign(prev, { ok:true, stars:Math.max(stars, prev.stars || 0), forced:false });
  S.game.mgBest = S.game.mgBest || {};
  S.game.mgBest[id] = Math.max(S.game.mgBest[id] || 0, stars);
  const xp = first ? (run.cfg.xp != null ? run.cfg.xp : 5 + stars*10) : 0;
  if(xp && typeof awardXP === 'function') awardXP(xp);
  mgSfx('win'); mgHaptic([20,40,20]);
  run.api.flash(true);
  const verdict = run.cfg.winText || ({3:'FLAWLESS', 2:'CLEAN WORK', 1:'GOT IT'}[stars]);
  $('#mg-msg').className = 'mg-msg';
  $('#mg-msg').innerHTML = `<div class="mg-result"><div class="mg-stars">${'★'.repeat(stars)}<span class="off">${'★'.repeat(3-stars)}</span></div>
    <div class="mg-verdict">${verdict}</div>${run.cfg.winNote ? `<div class="mg-note">${run.cfg.winNote}</div>` : ''}${xp ? `<div class="mg-note" style="color:var(--naceca-gold-bright)">+${xp} XP</div>` : ''}</div>`;
  miniActions([{ label:'CONTINUE ▶', cls:'primary', big:true, primary:true, onClick:()=>miniClose({ ok:true, stars, strikes:run.strikes, time:run.t }) }]);
  if(typeof sideOnMini === 'function') sideOnMini(id, stars);
}
function miniFail(run, text){
  if(run.phase !== 'play') return;
  run.phase = 'result';
  mgSfx('bad'); mgHaptic([80,40,80]);
  S.game._mg = S.game._mg || {};
  const id = run.cfg.id || run.cfg.type;
  const rec = S.game._mg[id] = S.game._mg[id] || { ok:false, stars:0 };
  rec.fails = (rec.fails || 0) + 1;
  if(run.cfg.onFail){ try{ run.cfg.onFail(run); }catch(e){ console.error(e); } }
  $('#mg-msg').className = 'mg-msg';
  $('#mg-msg').innerHTML = `<div class="mg-result"><div class="mg-verdict bad">${run.cfg.failTitle || 'FAILED'}</div><div class="mg-note">${text || ''}${run.cfg.failNote ? ' ' + run.cfg.failNote : ''}</div></div>`;
  if(run.game && run.game.reveal) run.game.reveal();
  const acts = [];
  if(run.cfg.allowRetry !== false){
    acts.push({ label:'TRY AGAIN', cls:'primary', primary:true, note:run.cfg.retryNote || '', onClick:()=>{
      if(run.cfg.onRetry){ try{ run.cfg.onRetry(run); }catch(e){} }
      run.attempts++; miniBuild(run); miniIntro(run);
    }});
  }
  if(run.cfg.force){
    acts.push({ label:run.cfg.force.label || 'FORCE IT', cls:'danger', note:run.cfg.force.note || '', onClick:()=>{
      if(run.cfg.force.apply){ try{ run.cfg.force.apply(); }catch(e){ console.error(e); } }
      const r = S.game._mg[id]; r.forced = true;
      miniClose({ ok:true, forced:true, stars:0 });
    }});
  }
  acts.push({ label:'BACK OFF', cls:'ghost', note:run.cfg.backNote || 'Come back to it', onClick:()=>miniBackOff() });
  miniActions(acts);
}
/* the world moved on while you were busy (wipe finished, smoke took him) */
function miniAbort(run, text){
  run.phase = 'result';
  mgSfx('bad');
  $('#mg-msg').className = 'mg-msg';
  $('#mg-msg').innerHTML = `<div class="mg-result"><div class="mg-verdict bad">${run.cfg.abortTitle || 'TOO LATE'}</div><div class="mg-note">${text}</div></div>`;
  miniActions([{ label:'CONTINUE', cls:'primary', big:true, primary:true, onClick:()=>miniClose({ ok:false, lost:true }) }]);
}
function miniBackOff(){
  const run = MINI.active; if(!run) return;
  if(run.cfg.onBackOff){ try{ run.cfg.onBackOff(run); }catch(e){} }
  miniClose({ ok:false, aborted:true });
}
function miniClose(result){
  const run = MINI.active; if(!run) return;
  MINI.active = null;
  cancelAnimationFrame(run.raf);
  if(run.game && run.game.destroy){ try{ run.game.destroy(); }catch(e){} }
  $('#mg-stage').innerHTML = ''; $('#mg-actions').innerHTML = ''; $('#mg-msg').innerHTML = '';
  const ov = document.getElementById('screen-minigame'); if(ov) ov.classList.remove('show');
  if(typeof duckMusic === 'function') duckMusic(false);
  try{ run.done && run.done(result); }catch(e){ console.error(e); }
  // a conversation that tried to start while we were busy goes now
  if(typeof DLG !== 'undefined' && DLG.queue && DLG.queue.length && !document.querySelector('.overlay.show')){
    const [k2, cb2] = DLG.queue.shift(); setTimeout(()=>startDialogue(k2, cb2), 350);
  }
}
/* keyboard: the game owns the keys while it is open */
window.addEventListener('keydown', e=>{
  const run = MINI.active; if(!run) return;
  if(run.paused) return;                       // the pause menu has the keys
  e.stopPropagation();
  const k = e.code;
  if(k === 'Escape'){ e.preventDefault(); miniBackOff(); return; }
  if(k === 'Space' || k === 'Enter' || k === 'NumpadEnter'){
    e.preventDefault();
    if(e.repeat) return;
    if(run.phase !== 'play'){ const p = document.querySelector('#mg-actions [data-primary]'); if(p) p.click(); return; }
    if(run.game && run.game.key) run.game.key('act', true);
    return;
  }
  const map = { ArrowLeft:'left', KeyA:'left', ArrowRight:'right', KeyD:'right', ArrowUp:'up', KeyW:'up', ArrowDown:'down', KeyS:'down' };
  if(map[k]){ e.preventDefault(); if(run.phase === 'play' && run.game && run.game.key) run.game.key(map[k], true); return; }
  const n = /^Digit([1-9])$/.exec(k); if(n && run.phase === 'play' && run.game && run.game.key) run.game.key('n' + n[1], true);
}, true);
window.addEventListener('keyup', e=>{
  const run = MINI.active; if(!run || !run.game || !run.game.key) return;
  const map = { ArrowLeft:'left', KeyA:'left', ArrowRight:'right', KeyD:'right', ArrowUp:'up', KeyW:'up', ArrowDown:'down', KeyS:'down', Space:'act' };
  if(map[e.code]) run.game.key(map[e.code], false);
}, true);

/* =========================================================================
   DIAL — a padlock (or a pry bar, or a cuff key): the needle sweeps, tap
   while it crosses the gold arc. Each pin narrows the arc and speeds the
   needle; misses cost a strike and move the arc.
   params: pins, arc (rad), speed (rad/s), reverse, actLabel, skin
   ========================================================================= */
MG_TYPES.dial = function(api, P){
  const D = api.diff;
  const size = Math.min(290, api.width() - 16);
  const wrap = mgEl('div'); wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center';
  api.stage.appendChild(wrap);
  const cv = mgCanvas(wrap, size, size);
  const pinRow = mgEl('div', 'mg-sort-count'); pinRow.style.marginTop = '8px'; wrap.appendChild(pinRow);
  const pins = P.pins || 3;
  let set = 0, ang = Math.random()*MG_TAU, dir = 1, running = false;
  let speed = (P.speed || 2.3) * D.speed, width = (P.arc || 0.62) * D.tol;
  let arcAt = ang + Math.PI, fl = 0, flGood = true;
  const place = ()=>{ let a, n = 0; do { a = Math.random()*MG_TAU; n++; } while(mgAngDist(a, ang) < 1.7 && n < 40); arcAt = a; };
  const pinsTxt = ()=>{ pinRow.textContent = (P.pinWord || 'PIN') + 'S  ' + Array.from({length:pins}, (_, i)=> i < set ? '■' : '□').join(' '); };
  pinsTxt();
  const hit = ()=>{
    if(!running || !api.playing()) return;
    if(mgAngDist(ang, arcAt) <= width/2 + 0.035){
      set++; mgSfx('good'); mgHaptic(25); fl = 1; flGood = true; pinsTxt();
      if(set >= pins){ running = false; api.success(); return; }
      width *= 0.86; speed *= 1.12; if(P.reverse !== false) dir *= -1; place();
      api.msg((P.pinWord || 'PIN') + ` ${set} SET`, 'good');
    } else { fl = 1; flGood = false; place(); api.strike(P.missText || 'Slipped.'); }
  };
  cv.c.addEventListener('pointerdown', e=>{ e.preventDefault(); hit(); });
  const draw = ()=>{
    const x = cv.x, s = size, c = s/2, R = s*0.42;
    x.clearRect(0, 0, s, s);
    // body
    const g = x.createRadialGradient(c, c*0.85, R*0.1, c, c, R*1.15);
    g.addColorStop(0, P.face || '#1d2a44'); g.addColorStop(1, '#070b14');
    x.fillStyle = g; x.beginPath(); x.arc(c, c, R*1.12, 0, MG_TAU); x.fill();
    x.strokeStyle = 'rgba(216,166,74,.55)'; x.lineWidth = 2; x.stroke();
    // ticks
    for(let i=0;i<60;i++){
      const a = i/60*MG_TAU, r0 = R*(i%5 ? 0.93 : 0.86);
      x.strokeStyle = i%5 ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,.42)'; x.lineWidth = i%5 ? 1 : 2;
      x.beginPath(); x.moveTo(c + Math.cos(a)*r0, c + Math.sin(a)*r0); x.lineTo(c + Math.cos(a)*R, c + Math.sin(a)*R); x.stroke();
    }
    // sweet spot
    if(set < pins){
      x.strokeStyle = '#f0c878'; x.lineWidth = 15; x.lineCap = 'butt';
      x.shadowColor = 'rgba(240,200,120,.8)'; x.shadowBlur = 12;
      x.beginPath(); x.arc(c, c, R*0.78, arcAt - width/2, arcAt + width/2); x.stroke();
      x.shadowBlur = 0;
    }
    // needle
    x.strokeStyle = '#ffffff'; x.lineWidth = 4; x.lineCap = 'round';
    x.beginPath(); x.moveTo(c, c); x.lineTo(c + Math.cos(ang)*R*0.9, c + Math.sin(ang)*R*0.9); x.stroke();
    x.fillStyle = '#e84a5c'; x.beginPath(); x.arc(c + Math.cos(ang)*R*0.9, c + Math.sin(ang)*R*0.9, 5, 0, MG_TAU); x.fill();
    // hub with shackle glyph
    x.fillStyle = '#0b1426'; x.beginPath(); x.arc(c, c, R*0.3, 0, MG_TAU); x.fill();
    x.strokeStyle = 'rgba(216,166,74,.8)'; x.lineWidth = 2; x.stroke();
    x.fillStyle = '#f3ead2'; x.font = `700 ${Math.round(s*0.09)}px Oswald, Arial Narrow, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(`${set}/${pins}`, c, c);
    if(fl > 0){
      x.strokeStyle = flGood ? `rgba(93,208,122,${fl})` : `rgba(232,74,92,${fl})`; x.lineWidth = 6;
      x.beginPath(); x.arc(c, c, R*1.1, 0, MG_TAU); x.stroke();
    }
  };
  return {
    start(){ running = true; place(); api.actions([{ label:P.actLabel || 'SET PIN', big:true, cls:'primary', onClick:hit }]); },
    update(dt){ if(running && dt) ang = (ang + dir*speed*dt + MG_TAU) % MG_TAU; fl = Math.max(0, fl - (dt || 0.016)*3); draw(); },
    key(k, down){ if(k === 'act' && down) hit(); },
    dbg(){ return { ang, arcAt, width, set, pins, inArc: mgAngDist(ang, arcAt) <= width/2 }; },
  };
};

/* =========================================================================
   STEADY — drag the marker along the channel from start to finish, picking
   up every item on the way. Leaving the channel builds a meter (spill,
   noise, cut) — fill it and you fail.
   params: width (fraction of canvas), items, meterLabel, skin:'pot'|'plate'|'ties', itemWord
   ========================================================================= */
MG_TYPES.steady = function(api, P){
  const D = api.diff;
  const W = Math.min(340, api.width() - 8), H = Math.round(W * (P.aspect || 0.9));
  const meter = mgEl('div', 'mg-meter', `<span>${P.meterLabel || 'SPILL'}</span><div class="bar"><i></i></div><span class="val">0%</span>`);
  api.stage.appendChild(meter);
  const fill = meter.querySelector('i'), val = meter.querySelector('.val');
  const cv = mgCanvas(api.stage, W, H);
  const cnt = mgEl('div', 'mg-sort-count'); cnt.style.marginTop = '8px'; api.stage.appendChild(cnt);
  const hw = Math.max(9, (P.width || 0.085) * W * D.tol / 2);
  // a winding channel, fresh every attempt
  const ctrl = [];
  const n = P.bends || 6;
  for(let i=0;i<=n;i++){
    const t = i/n;
    ctrl.push([ W*(0.09 + 0.82*t), H*(i===0 || i===n ? 0.5 : 0.18 + Math.random()*0.64) ]);
  }
  const path = [];
  const cr = (p0, p1, p2, p3, t)=>{ const t2 = t*t, t3 = t2*t; return 0.5*((2*p1) + (-p0 + p2)*t + (2*p0 - 5*p1 + 4*p2 - p3)*t2 + (-p0 + 3*p1 - 3*p2 + p3)*t3); };
  for(let i=0;i<ctrl.length-1;i++){
    const p0 = ctrl[Math.max(0, i-1)], p1 = ctrl[i], p2 = ctrl[i+1], p3 = ctrl[Math.min(ctrl.length-1, i+2)];
    for(let k=0;k<14;k++){ const t = k/14; path.push([cr(p0[0], p1[0], p2[0], p3[0], t), cr(p0[1], p1[1], p2[1], p3[1], t)]); }
  }
  path.push(ctrl[ctrl.length-1]);
  // cumulative length → item positions along the channel
  const cum = [0]; for(let i=1;i<path.length;i++) cum.push(cum[i-1] + Math.hypot(path[i][0]-path[i-1][0], path[i][1]-path[i-1][1]));
  const L = cum[cum.length-1];
  const at = f=>{ const d = f*L; let i = 1; while(i < cum.length-1 && cum[i] < d) i++; const k = (d - cum[i-1]) / Math.max(1e-6, cum[i]-cum[i-1]); return [path[i-1][0] + (path[i][0]-path[i-1][0])*k, path[i-1][1] + (path[i][1]-path[i-1][1])*k]; };
  const items = (P.items || [0.3, 0.55, 0.8]).map(f=>({ p:at(f), got:false }));
  const start = path[0], end = path[path.length-1];
  let tok = { x:start[0], y:start[1] }, drag = false, running = false, noise = 0, hot = 0, vx = 0, vy = 0, kx = 0, ky = 0, pid = null;
  const distPath = (x, y)=>{
    let best = 1e9;
    for(let i=1;i<path.length;i++){
      const ax = path[i-1][0], ay = path[i-1][1], bx = path[i][0], by = path[i][1];
      const dx = bx-ax, dy = by-ay, l2 = dx*dx + dy*dy || 1;
      let t = ((x-ax)*dx + (y-ay)*dy) / l2; t = Math.max(0, Math.min(1, t));
      const d = Math.hypot(x - (ax + dx*t), y - (ay + dy*t)); if(d < best) best = d;
    }
    return best;
  };
  const got = ()=>items.filter(i=>i.got).length;
  const cntTxt = ()=>{ cnt.textContent = `${(P.itemWord || 'ITEMS').toUpperCase()}  ${got()}/${items.length}` + (got() === items.length ? '  ·  NOW OUT TO THE RING' : ''); };
  cntTxt();
  const moveTo = (x, y)=>{
    const dx = x - tok.x, dy = y - tok.y, d = Math.hypot(dx, dy), max = 24;
    if(d > max){ tok.x += dx/d*max; tok.y += dy/d*max; } else { tok.x = x; tok.y = y; }
    tok.x = Math.max(4, Math.min(W-4, tok.x)); tok.y = Math.max(4, Math.min(H-4, tok.y));
  };
  const onDown = e=>{
    if(!running || !api.playing()) return;
    const p = mgPointerPos(cv.c, e);
    if(Math.hypot(p.x - tok.x, p.y - tok.y) < Math.max(34, hw*2.6)){ drag = true; pid = e.pointerId; try{ cv.c.setPointerCapture(e.pointerId); }catch(_){} }
    e.preventDefault();
  };
  const onMove = e=>{ if(!drag || e.pointerId !== pid || !api.playing()) return; const p = mgPointerPos(cv.c, e); moveTo(p.x, p.y); e.preventDefault(); };
  const onUp = e=>{ if(e.pointerId === pid){ drag = false; pid = null; } };
  cv.c.addEventListener('pointerdown', onDown); cv.c.addEventListener('pointermove', onMove);
  cv.c.addEventListener('pointerup', onUp); cv.c.addEventListener('pointercancel', onUp);
  const pal = P.palette || { bg:'#1c120c', rim:'#5a3a22', chan:'rgba(120,180,200,.20)', edge:'rgba(160,210,230,.35)' };
  const draw = ()=>{
    const x = cv.x; x.clearRect(0, 0, W, H);
    if(P.skin === 'pot'){
      const g = x.createRadialGradient(W/2, H/2, 10, W/2, H/2, Math.max(W, H)*0.62);
      g.addColorStop(0, '#2a1a10'); g.addColorStop(0.75, pal.bg); g.addColorStop(1, '#0b0705');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      x.strokeStyle = pal.rim; x.lineWidth = 10; x.beginPath(); x.ellipse(W/2, H/2, W/2-6, H/2-6, 0, 0, MG_TAU); x.stroke();
      // ritual clutter: cowries + kola, the things you must not disturb
      x.fillStyle = 'rgba(240,230,210,.22)';
      for(let i=0;i<26;i++){ const a = (i*137.5)%360*Math.PI/180, r = (0.15 + ((i*53)%100)/100*0.33); x.beginPath(); x.ellipse(W/2 + Math.cos(a)*W*r, H/2 + Math.sin(a)*H*r, 4, 2.6, a, 0, MG_TAU); x.fill(); }
    } else if(P.skin === 'ties'){
      x.fillStyle = '#2a1c14'; x.fillRect(0, 0, W, H);
      x.fillStyle = '#6a4630'; x.fillRect(0, H*0.32, W, H*0.36);
      x.fillStyle = 'rgba(255,255,255,.05)'; for(let i=0;i<8;i++) x.fillRect(0, H*0.32 + i*H*0.045, W, 1);
    } else {
      const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#2a2e36'); g.addColorStop(1, '#14171c');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      x.strokeStyle = 'rgba(255,255,255,.05)'; for(let i=0;i<W;i+=14){ x.beginPath(); x.moveTo(i, 0); x.lineTo(i-30, H); x.stroke(); }
      for(const [rx, ry] of [[12,12],[W-12,12],[12,H-12],[W-12,H-12]]){ x.fillStyle = '#4a4f58'; x.beginPath(); x.arc(rx, ry, 4, 0, MG_TAU); x.fill(); }
    }
    // channel
    x.lineCap = 'round'; x.lineJoin = 'round';
    x.strokeStyle = pal.edge; x.lineWidth = hw*2 + 4; x.beginPath(); path.forEach((p, i)=> i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.stroke();
    x.strokeStyle = pal.chan; x.lineWidth = hw*2; x.stroke();
    x.setLineDash([4, 6]); x.strokeStyle = 'rgba(255,255,255,.18)'; x.lineWidth = 1; x.stroke(); x.setLineDash([]);
    // items
    for(const it of items){
      if(it.got) continue;
      x.save(); x.translate(it.p[0], it.p[1]); x.rotate(-0.25);
      x.fillStyle = P.itemColor || '#d8a64a'; x.fillRect(-7, -5, 14, 10);
      x.fillStyle = '#5a3a10'; x.fillRect(-3, -2, 6, 4); x.restore();
    }
    // start + goal
    x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 2; x.beginPath(); x.arc(start[0], start[1], hw+3, 0, MG_TAU); x.stroke();
    const ready = got() === items.length;
    x.strokeStyle = ready ? '#5dd07a' : 'rgba(93,208,122,.35)'; x.lineWidth = 3; x.beginPath(); x.arc(end[0], end[1], hw+6, 0, MG_TAU); x.stroke();
    // marker
    x.fillStyle = hot > 0 ? '#e84a5c' : '#f0c878';
    x.shadowColor = hot > 0 ? 'rgba(232,74,92,.9)' : 'rgba(240,200,120,.9)'; x.shadowBlur = 14;
    x.beginPath(); x.arc(tok.x, tok.y, 8, 0, MG_TAU); x.fill(); x.shadowBlur = 0;
    x.strokeStyle = '#0b1426'; x.lineWidth = 2; x.beginPath(); x.arc(tok.x, tok.y, 3, 0, MG_TAU); x.stroke();
    if(!drag && running && noise === 0 && got() === 0){
      x.fillStyle = 'rgba(255,255,255,.75)'; x.font = '600 11px Oswald, sans-serif'; x.textAlign = 'center';
      x.fillText(_isTouchMG() ? 'DRAG THE GOLD MARKER' : 'DRAG THE MARKER · OR ARROW KEYS', tok.x + 60 > W ? W - 70 : tok.x + 62, tok.y - 16);
    }
  };
  return {
    start(){ running = true; },
    update(dt){
      if(running && dt){
        if(kx || ky){ moveTo(tok.x + kx*130*dt, tok.y + ky*130*dt); }
        const d = distPath(tok.x, tok.y);
        if(d > hw){ noise += ((d - hw)/hw*1.1 + 0.7) * 36 * D.speed * dt * (P.harsh || 1); hot = 0.25; } else hot = Math.max(0, hot - dt);
        for(const it of items){ if(!it.got && Math.hypot(tok.x - it.p[0], tok.y - it.p[1]) < hw*1.25 + 5){ it.got = true; mgSfx('tick'); mgHaptic(15); cntTxt(); } }
        const nf = Math.min(100, noise);
        fill.style.width = nf.toFixed(1) + '%'; val.textContent = Math.round(nf) + '%';
        if(noise >= 100){ running = false; api.fail(P.failText || 'Too careless.'); }
        else if(got() === items.length && Math.hypot(tok.x - end[0], tok.y - end[1]) < hw + 8){
          running = false; api.success({ stars: noise < 12 ? 3 : noise < 45 ? 2 : 1, noise });
        }
      }
      draw();
    },
    key(k, down){ const v = down ? 1 : 0; if(k === 'left') kx = -v; if(k === 'right') kx = v; if(k === 'up') ky = -v; if(k === 'down') ky = v; },
    dbg(){ return { path, tok, end, hw, noise, items:items.map(i=>({ p:i.p, got:i.got })), canvas:cv.c, W, H }; },
    destroy(){},
  };
};
function _isTouchMG(){ return document.body.classList.contains('touch-active'); }

/* =========================================================================
   WIRES — reconnect each coloured lead to its terminal from the notes.
   Tap a lead, then its terminal (or drag across). Wrong pairs spark.
   params: pairs [{lead, color, term}], notesTitle, memorize (s, 0 = always shown)
   ========================================================================= */
MG_TYPES.wires = function(api, P){
  const D = api.diff;
  const pairs = P.pairs;
  const memo = P.memorize != null ? P.memorize : (D.key === 'hard' ? 6 : 0);
  const card = mgEl('div', 'mg-card', `<b>${P.notesTitle || 'NOTES'}</b>` + pairs.map(p=>`<div class="ln">${p.lead.padEnd(7,' ').replace(/ /g,'&nbsp;')} → ${p.term}</div>`).join(''));
  api.stage.appendChild(card);
  const box = mgEl('div', 'mg-wires'); api.stage.appendChild(box);
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg'); box.appendChild(svg);
  const leads = mgShuffle(pairs), terms = mgShuffle(pairs);
  const leadEls = [], termEls = [];
  const rows = Math.max(leads.length, terms.length);
  for(let i=0;i<rows;i++){
    const l = leads[i], t = terms[i];
    const le = mgEl('div', 'mg-lead', `<span class="sw" style="background:${l.color}"></span>${l.lead}`); le._p = l; box.appendChild(le); leadEls.push(le);
    const te = mgEl('div', 'mg-term', t.term); te._p = t; box.appendChild(te); termEls.push(te);
  }
  let sel = null, running = false, doneN = 0, peekT = 0, hidden = false;
  const line = (a, b, col, dash)=>{
    const r0 = box.getBoundingClientRect(), ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    const ln = document.createElementNS(svgNS, 'line');
    ln.setAttribute('x1', ra.right - r0.left - 6); ln.setAttribute('y1', ra.top + ra.height/2 - r0.top);
    ln.setAttribute('x2', rb.left - r0.left + 6); ln.setAttribute('y2', rb.top + rb.height/2 - r0.top);
    ln.setAttribute('stroke', col); ln.setAttribute('stroke-width', '4'); ln.setAttribute('stroke-linecap', 'round');
    if(dash) ln.setAttribute('stroke-dasharray', '6 6');
    svg.appendChild(ln); return ln;
  };
  const pick = le=>{ if(!running || le.classList.contains('done')) return; leadEls.forEach(x=>x.classList.remove('sel')); sel = le; le.classList.add('sel'); mgSfx('tick'); };
  const join = te=>{
    if(!running || !sel || te.classList.contains('done')) return;
    if(sel._p.term === te._p.term){
      sel.classList.remove('sel'); sel.classList.add('done'); te.classList.add('done');
      line(sel, te, sel._p.color); doneN++; mgSfx('good'); mgHaptic(20); sel = null;
      api.msg(`${doneN}/${pairs.length} CONNECTED`, 'good');
      if(doneN === pairs.length){ running = false; api.success(); }
    } else {
      te.classList.add('bad'); const ln = line(sel, te, '#e84a5c', true);
      setTimeout(()=>{ te.classList.remove('bad'); ln.remove(); }, 450);
      api.strike(P.missText || 'Spark! Wrong terminal.');
    }
  };
  leadEls.forEach(le=>{
    le.addEventListener('pointerdown', e=>{ e.preventDefault(); pick(le); });
  });
  termEls.forEach(te=>{ te.addEventListener('pointerdown', e=>{ e.preventDefault(); join(te); }); });
  // drag: release over a terminal
  const up = e=>{ if(!sel || !running) return; const el = document.elementFromPoint(e.clientX, e.clientY); const te = el && el.closest && el.closest('.mg-term'); if(te && termEls.includes(te)) join(te); };
  box.addEventListener('pointerup', up);
  const setHidden = h=>{ hidden = h; card.classList.toggle('hidden-notes', h); };
  let peekBtn = null;
  return {
    start(){
      running = true;
      if(memo > 0){
        api.msg(`MEMORISE — NOTES HIDE IN ${memo}s`, '');
        peekT = memo;
        peekBtn = mgEl('button', 'mg-peek', 'PEEK −3s'); card.appendChild(peekBtn);
        peekBtn.addEventListener('click', e=>{ e.stopPropagation(); if(!hidden || !running) return; api.addTime(3); setHidden(false); peekT = 2; });
      }
    },
    update(dt){ if(running && memo > 0 && peekT > 0){ peekT -= dt; if(peekT <= 0){ setHidden(true); if(!doneN) api.msg('FROM MEMORY NOW', ''); } } },
    key(k, down){ if(!down) return; const m = /^n(\d)$/.exec(k); if(m){ const i = +m[1]-1; if(sel && termEls[i]) join(termEls[i]); else if(leadEls[i]) pick(leadEls[i]); } },
    destroy(){},
  };
};

/* =========================================================================
   SPOT — tap the red flags in a message or document. Benign words cost a
   strike. params: header, parts [string | {t, flag, note}]
   ========================================================================= */
MG_TYPES.spot = function(api, P){
  const doc = mgEl('div', 'mg-doc');
  if(P.header) doc.appendChild(mgEl('div', 'hdr', P.header));
  const body = mgEl('div'); doc.appendChild(body);
  api.stage.appendChild(doc);
  const segs = [];
  let found = 0, running = false;
  const total = P.parts.filter(p=>p && p.flag).length;
  const cnt = mgEl('div', 'mg-sort-count'); cnt.style.marginTop = '8px'; api.stage.appendChild(cnt);
  const cntTxt = ()=>{ cnt.textContent = `${(P.flagWord || 'RED FLAGS').toUpperCase()} FOUND  ${found}/${total}`; };
  cntTxt();
  P.parts.forEach(p=>{
    if(typeof p === 'string'){ body.appendChild(document.createTextNode(p)); return; }
    const s = mgEl('span', 'mg-seg'); s.textContent = p.t; s._p = p; body.appendChild(s); segs.push(s);
    s.addEventListener('pointerdown', e=>{
      e.preventDefault();
      if(!running || !api.playing() || s.classList.contains('flag') || s.classList.contains('clean')) return;
      if(p.flag){
        s.classList.add('flag'); found++; mgSfx('good'); mgHaptic(20); cntTxt();
        if(p.note){ const n = mgEl('span', 'mg-flagnote', '⚑ ' + p.note); s.after(n); }
        if(found === total){ running = false; api.success(); }
      } else { s.classList.add('clean'); api.strike(p.why || 'That part is normal.'); }
    });
  });
  return {
    start(){ running = true; },
    update(){},
    reveal(){ segs.forEach(s=>{ if(s._p.flag && !s.classList.contains('flag')) s.classList.add('missed'); }); },
    destroy(){},
  };
};

/* =========================================================================
   PROCS — a task manager under pressure: kill the processes writing the
   wipe, leave the system alone. Rows reshuffle; read the disk column.
   params: targets [{n, cpu, w}], benign [{n, cpu, w}], shuffle (s), onMistake
   ========================================================================= */
MG_TYPES.procs = function(api, P){
  const D = api.diff;
  const box = mgEl('div', 'mg-procs'); api.stage.appendChild(box);
  const head = mgEl('div', 'row head', '<span>PROCESS</span><span class="w">CPU</span><span class="w">DISK W</span>'); box.appendChild(head);
  const list = mgEl('div'); box.appendChild(list);
  const procs = P.targets.map(t=>Object.assign({ bad:true, killed:false }, t)).concat(mgShuffle(P.benign).slice(0, P.benignCount || 6).map(b=>Object.assign({ bad:false, killed:false }, b)));
  let order = mgShuffle(procs), running = false, tShuf = 0, killed = 0;
  const total = P.targets.length;
  const fmt = p=>{ const j = p.killed ? 0 : (Math.random()-0.5)*0.25; return { cpu: p.killed ? '0.0' : Math.max(0.1, p.cpu*(1+j)).toFixed(1), w: p.killed ? '0' : Math.max(0, Math.round(p.w*(1+j))) }; };
  const render = ()=>{
    list.innerHTML = '';
    const live = order.filter(p=>!p.killed), dead = order.filter(p=>p.killed);
    live.concat(dead).forEach(p=>{
      const f = fmt(p);
      const r = mgEl('div', 'row' + (p.killed ? ' killed' : '') + (!p.killed && p.w >= 50 ? ' hot' : ''), `<span>${p.n}</span><span class="w">${f.cpu}</span><span class="w">${f.w} MB/s</span>`);
      r.addEventListener('pointerdown', e=>{
        e.preventDefault();
        if(!running || !api.playing() || p.killed) return;
        if(p.bad){ p.killed = true; killed++; mgSfx('good'); mgHaptic(25); api.msg(`KILLED ${p.n}  ·  ${killed}/${total}`, 'good'); render(); if(killed === total){ running = false; api.success(); } }
        else { r.classList.add('oops'); if(P.onMistake) P.onMistake(p); api.strike(P.missText || `${p.n} is a system process.`); }
      });
      list.appendChild(r);
    });
  };
  render();
  return {
    start(){ running = true; },
    update(dt){ if(!running || !dt) return; tShuf += dt; if(tShuf >= (P.shuffle || 1.5) / D.speed){ tShuf = 0; order = mgShuffle(order); render(); } },
    destroy(){},
  };
};

/* =========================================================================
   PATTERN — the unlock pattern plays once; draw it back (drag across the
   dots, or tap them in order). A wrong dot costs a strike and replays it.
   params: len, rounds
   ========================================================================= */
MG_TYPES.pattern = function(api, P){
  const D = api.diff;
  const len = P.len || ({ story:4, standard:5, hard:6 })[D.key] || 5;
  const rounds = P.rounds || 1;
  if(P.caption) api.stage.appendChild(mgEl('div', 'mg-phone-cap', P.caption));
  const pad = mgEl('div', 'mg-pattern'); api.stage.appendChild(pad);
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg'); svg.setAttribute('viewBox', '0 0 300 300'); pad.appendChild(svg);
  const pos = i=>[60 + (i%3)*90, 60 + Math.floor(i/3)*90];
  const dots = [];
  for(let i=0;i<9;i++){
    const [x, y] = pos(i);
    const ring = document.createElementNS(svgNS, 'circle'); ring.setAttribute('cx', x); ring.setAttribute('cy', y); ring.setAttribute('r', 22); ring.setAttribute('fill', 'none'); ring.setAttribute('stroke', 'rgba(255,255,255,.08)'); ring.setAttribute('stroke-width', 2); svg.appendChild(ring);
    const d = document.createElementNS(svgNS, 'circle'); d.setAttribute('cx', x); d.setAttribute('cy', y); d.setAttribute('r', 8); d.setAttribute('fill', '#55627a'); svg.appendChild(d);
    dots.push({ d, ring });
  }
  const pl = document.createElementNS(svgNS, 'polyline'); pl.setAttribute('fill', 'none'); pl.setAttribute('stroke-width', '7'); pl.setAttribute('stroke-linecap', 'round'); pl.setAttribute('stroke-linejoin', 'round'); svg.insertBefore(pl, svg.firstChild);
  const live = document.createElementNS(svgNS, 'line'); live.setAttribute('stroke', 'rgba(240,200,120,.5)'); live.setAttribute('stroke-width', '5'); live.setAttribute('stroke-linecap', 'round'); svg.insertBefore(live, svg.firstChild);
  const cnt = mgEl('div', 'mg-sort-count'); cnt.style.marginTop = '8px'; api.stage.appendChild(cnt);
  const neighbours = i=>{ const r = Math.floor(i/3), c = i%3, out = []; for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){ if(!dr && !dc) continue; const rr = r+dr, cc = c+dc; if(rr>=0 && rr<3 && cc>=0 && cc<3) out.push(rr*3+cc); } return out; };
  const make = ()=>{
    const seq = [Math.floor(Math.random()*9)];
    while(seq.length < len){ const opts = neighbours(seq[seq.length-1]).filter(j=>!seq.includes(j)); const pool = opts.length ? opts : [0,1,2,3,4,5,6,7,8].filter(j=>!seq.includes(j)); seq.push(pool[Math.floor(Math.random()*pool.length)]); }
    return seq;
  };
  let pattern = make(), input = [], round = 0, phase = 'idle', wt = 0, wi = 0, drawing = false, pid = null;
  const paint = (seq, col)=>{
    dots.forEach((o, i)=>{ const on = seq.includes(i); o.d.setAttribute('fill', on ? col : '#55627a'); o.d.setAttribute('r', on ? 11 : 8); o.ring.setAttribute('stroke', on ? col : 'rgba(255,255,255,.08)'); });
    pl.setAttribute('stroke', col); pl.setAttribute('points', seq.map(i=>pos(i).join(',')).join(' '));
  };
  const cntTxt = ()=>{ cnt.textContent = phase === 'watch' ? 'WATCH THE PATTERN…' : phase === 'input' ? `YOUR TURN  ·  ${input.length}/${len}` + (rounds > 1 ? `  ·  ROUND ${round+1}/${rounds}` : '') : ''; };
  const watch = ()=>{ phase = 'watch'; wt = 0; wi = 0; input = []; paint([], '#f0c878'); cntTxt(); };
  const addDot = i=>{
    if(phase !== 'input' || input.includes(i)) return;
    input.push(i);
    if(pattern[input.length-1] !== i){
      paint(input, '#e84a5c'); drawing = false; phase = 'idle';
      api.strike(P.missText || 'Wrong dot — the phone buzzes.');
      setTimeout(()=>{ if(api.playing()) watch(); }, 700);
      return;
    }
    mgSfx('tick'); paint(input, '#f0c878'); cntTxt();
    if(input.length === len){
      drawing = false; phase = 'idle'; paint(input, '#5dd07a'); mgSfx('good');
      round++;
      if(round >= rounds){ api.success(); }
      else { api.msg(P.roundText || 'UNLOCKED — NEXT SCREEN', 'good'); setTimeout(()=>{ if(api.playing()){ pattern = make(); watch(); } }, 800); }
    }
  };
  const hitDot = e=>{
    const r = pad.getBoundingClientRect(); const x = (e.clientX - r.left)/r.width*300, y = (e.clientY - r.top)/r.height*300;
    for(let i=0;i<9;i++){ const [px, py] = pos(i); if(Math.hypot(px-x, py-y) < 30) return { i, x, y }; }
    return { i:-1, x, y };
  };
  pad.addEventListener('pointerdown', e=>{ e.preventDefault(); if(phase !== 'input' || !api.playing()) return; drawing = true; pid = e.pointerId; try{ pad.setPointerCapture(e.pointerId); }catch(_){} const h = hitDot(e); if(h.i >= 0) addDot(h.i); });
  pad.addEventListener('pointermove', e=>{
    if(!drawing || e.pointerId !== pid) return; const h = hitDot(e);
    if(h.i >= 0) addDot(h.i);
    if(input.length && phase === 'input'){ const [lx, ly] = pos(input[input.length-1]); live.setAttribute('x1', lx); live.setAttribute('y1', ly); live.setAttribute('x2', h.x); live.setAttribute('y2', h.y); }
  });
  const end = e=>{ if(e.pointerId === pid){ drawing = false; pid = null; live.setAttribute('x2', live.getAttribute('x1') || 0); live.setAttribute('y2', live.getAttribute('y1') || 0); } };
  pad.addEventListener('pointerup', end); pad.addEventListener('pointercancel', end);
  paint([], '#f0c878');
  return {
    start(){ watch(); api.actions([{ label:'CLEAR', cls:'ghost', onClick:()=>{ if(phase === 'input'){ input = []; paint([], '#f0c878'); cntTxt(); } } }, { label:'SHOW AGAIN', cls:'ghost', note:'costs a strike', onClick:()=>{ if(phase === 'input'){ api.strike('Peeked.'); if(api.playing()) watch(); } } }]); },
    update(dt){
      if(phase !== 'watch' || !dt) return;
      wt += dt;
      const step = (P.showStep || 0.5) / D.speed;
      const k = Math.min(len, Math.floor(wt / step) + 1);
      if(k !== wi){ wi = k; paint(pattern.slice(0, k), '#f0c878'); mgSfx('tick'); }
      if(wt > step*len + 0.7){ phase = 'input'; input = []; paint([], '#f0c878'); cntTxt(); }
    },
    reveal(){ paint(pattern, 'rgba(93,208,122,.6)'); },
    dbg(){ return { pattern:pattern.slice(), phase, input:input.slice(), len, pad, pos:[0,1,2,3,4,5,6,7,8].map(pos) }; },
    destroy(){},
  };
};

/* =========================================================================
   TUNE — match the drifting target signal (frequency + gain) and hold it
   until the lock meter fills. params: hold (s), drift, labelA, labelB
   ========================================================================= */
MG_TYPES.tune = function(api, P){
  const D = api.diff;
  const meter = mgEl('div', 'mg-meter', `<span>${P.meterLabel || 'LOCK'}</span><div class="bar"><i class="good"></i></div><span class="val">0%</span>`);
  api.stage.appendChild(meter);
  const fill = meter.querySelector('i'), val = meter.querySelector('.val');
  const W = Math.min(380, api.width() - 8), H = 150;
  const cv = mgCanvas(api.stage, W, H);
  const sl = mgEl('div', 'mg-sliders', `
    <label class="mg-slider"><span>${P.labelA || 'FREQ'}</span><input type="range" min="0" max="1000" value="500" id="mg-ta"></label>
    <label class="mg-slider"><span>${P.labelB || 'GAIN'}</span><input type="range" min="0" max="1000" value="500" id="mg-tb"></label>`);
  api.stage.appendChild(sl);
  const ia = sl.querySelector('#mg-ta'), ib = sl.querySelector('#mg-tb');
  let fa = 0.5, fb = 0.5, ta = 0.15 + Math.random()*0.7, tb = 0.2 + Math.random()*0.6, va = 0, vb = 0, wa = 0, wb = 0, retarget = 0;
  while(Math.abs(ta - 0.5) < 0.2) ta = 0.15 + Math.random()*0.7;
  let lock = 0, running = false, phase = 0, ka = 0, kb = 0;
  const tolA = 0.05 * D.tol, tolB = 0.08 * D.tol, hold = (P.hold || 2.6);
  ia.addEventListener('input', ()=>{ fa = ia.value/1000; }); ib.addEventListener('input', ()=>{ fb = ib.value/1000; });
  [ia, ib].forEach(el=>el.addEventListener('pointerdown', e=>e.stopPropagation()));
  const wave = (x, f, a, ph)=> a * Math.sin((2 + f*10) * x * MG_TAU / W * 1.0 * 1.4 + ph);
  const draw = (inBand)=>{
    const x = cv.x; x.clearRect(0, 0, W, H);
    x.fillStyle = '#05080f'; x.fillRect(0, 0, W, H);
    x.strokeStyle = 'rgba(122,220,208,.08)'; x.lineWidth = 1;
    for(let i=0;i<W;i+=W/10){ x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke(); }
    for(let j=0;j<H;j+=H/6){ x.beginPath(); x.moveTo(0, j); x.lineTo(W, j); x.stroke(); }
    const line = (f, a, col, w, dash)=>{ x.strokeStyle = col; x.lineWidth = w; x.setLineDash(dash || []); x.beginPath(); for(let i=0;i<=W;i+=2){ const y = H/2 - wave(i, f, 0.1 + a*0.9, phase) * (H*0.42); i ? x.lineTo(i, y) : x.moveTo(i, y); } x.stroke(); x.setLineDash([]); };
    line(ta, tb, 'rgba(240,200,120,.85)', 2, [5, 5]);
    line(fa, fb, inBand ? '#5dd07a' : '#7adcd0', 2.6);
    x.fillStyle = 'rgba(255,255,255,.55)'; x.font = '600 10px JetBrains Mono, monospace'; x.textAlign = 'left';
    x.fillText(P.screenLabel || 'TARGET ---   YOU ───', 8, 14);
  };
  return {
    start(){ running = true; },
    update(dt){
      phase += dt * 3;
      if(running && dt){
        // the target drifts — keep adjusting (a new heading every second or two)
        const dr = (P.drift || 0.055) * D.speed;
        retarget -= dt;
        if(retarget <= 0){ retarget = 1.1 + Math.random()*1.1; wa = (Math.random()*2-1)*dr; wb = (Math.random()*2-1)*dr*1.2; }
        va += (wa - va) * Math.min(1, dt*2.5); vb += (wb - vb) * Math.min(1, dt*2.5);
        ta += va*dt; tb += vb*dt;
        if(ta < 0.1 || ta > 0.9){ ta = Math.max(0.1, Math.min(0.9, ta)); wa = -wa; va = -va; }
        if(tb < 0.15 || tb > 0.88){ tb = Math.max(0.15, Math.min(0.88, tb)); wb = -wb; vb = -vb; }
        if(ka){ fa = Math.max(0, Math.min(1, fa + ka*0.35*dt)); ia.value = fa*1000; }
        if(kb){ fb = Math.max(0, Math.min(1, fb + kb*0.35*dt)); ib.value = fb*1000; }
        const inBand = Math.abs(fa - ta) < tolA && Math.abs(fb - tb) < tolB;
        lock = Math.max(0, Math.min(1, lock + (inBand ? dt/hold : -dt/(hold*1.7))));
        fill.style.width = (lock*100).toFixed(1) + '%'; val.textContent = Math.round(lock*100) + '%';
        api.msg(inBand ? (P.lockText || 'HOLD IT…') : (Math.abs(fa - ta) >= tolA ? (fa < ta ? `${P.labelA || 'FREQ'} ↑` : `${P.labelA || 'FREQ'} ↓`) : (fb < tb ? `${P.labelB || 'GAIN'} ↑` : `${P.labelB || 'GAIN'} ↓`)), inBand ? 'good' : '');
        if(lock >= 1){ running = false; const tf = api.timeFrac(); api.success({ stars: tf < 0.5 ? 3 : tf < 0.8 ? 2 : 1 }); }
        draw(inBand);
      } else draw(false);
    },
    key(k, down){ const v = down ? 1 : 0; if(k === 'left') ka = -v; if(k === 'right') ka = v; if(k === 'down') kb = -v; if(k === 'up') kb = v; },
    dbg(){ return { ta, tb, fa, fb, lock, ia, ib }; },
    destroy(){},
  };
};

/* =========================================================================
   SORT — one item at a time: tap the right bag before its clock runs out.
   params: bins [{id, label}], items [{ic, nm, ds, bin}], perItem (s)
   ========================================================================= */
MG_TYPES.sort = function(api, P){
  const D = api.diff;
  const items = mgShuffle(P.items).slice(0, P.count || P.items.length);
  const counter = mgEl('div', 'mg-sort-count'); api.stage.appendChild(counter);
  const card = mgEl('div', 'mg-sort-item'); api.stage.appendChild(card);
  const it = mgEl('div', 'mg-itimer', '<i></i>'); api.stage.appendChild(it);
  const bar = it.querySelector('i');
  const bins = mgEl('div', 'mg-bins'); api.stage.appendChild(bins);
  let i = 0, t = 0, running = false, good = 0;
  const per = (P.perItem || 3.6) * D.time;
  const show = ()=>{
    const x = items[i]; t = 0;
    counter.textContent = `ITEM ${Math.min(i+1, items.length)} / ${items.length}`;
    card.innerHTML = x ? `<div class="ic">${x.ic}</div><div class="nm">${x.nm}</div>${x.ds ? `<div class="ds">${x.ds}</div>` : ''}` : '';
    card.classList.remove('pop'); void card.offsetWidth; card.classList.add('pop');
  };
  const next = ()=>{ i++; if(i >= items.length){ running = false; api.success(); return; } show(); };
  const choose = id=>{
    if(!running || !api.playing()) return;
    const x = items[i]; if(!x) return;
    if(x.bin === id){ good++; mgSfx('good'); mgHaptic(15); api.msg(P.goodText || 'BAGGED', 'good'); next(); }
    else { const b = P.bins.find(b=>b.id === x.bin); api.strike(x.why || `That goes in ${b ? b.label : 'another bag'}.`); if(api.playing()) next(); }
  };
  P.bins.forEach((b, k)=>{ const el = mgEl('button', 'mg-bin', b.label); el.addEventListener('pointerdown', e=>{ e.preventDefault(); choose(b.id); }); bins.appendChild(el); });
  card.innerHTML = `<div class="ic">${P.coverIc || '🧤'}</div><div class="nm">${P.coverText || 'READY'}</div>`;
  counter.textContent = `${items.length} ITEMS`;
  return {
    start(){ running = true; show(); },
    update(dt){ if(!running || !dt) return; t += dt; bar.style.width = Math.max(0, 100 - t/per*100) + '%'; if(t >= per){ api.strike('Too slow — it got trampled.'); if(api.playing()) next(); } },
    key(k, down){ if(!down) return; const m = /^n(\d)$/.exec(k); if(m && P.bins[+m[1]-1]) choose(P.bins[+m[1]-1].id); },
    dbg(){ return { item: items[i], i, n: items.length, bins: P.bins.map(b=>b.id) }; },
    destroy(){},
  };
};

/* =========================================================================
   MASH — rapid taps against decay. params: gain, decay, label, sub
   ========================================================================= */
MG_TYPES.mash = function(api, P){
  const D = api.diff;
  const btn = mgEl('button', 'mg-mash');
  btn.innerHTML = `<svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="86" fill="rgba(11,20,38,.95)" stroke="rgba(216,166,74,.35)" stroke-width="14"/>
      <circle id="mg-mash-ring" cx="100" cy="100" r="86" fill="none" stroke="#f0c878" stroke-width="14" stroke-linecap="round" transform="rotate(-90 100 100)" stroke-dasharray="540" stroke-dashoffset="540"/></svg>
    <div class="lbl">${P.label || 'TAP!'}<small>${P.small || 'AS FAST AS YOU CAN'}</small></div>`;
  api.stage.appendChild(btn);
  const ring = btn.querySelector('#mg-mash-ring');
  let p = 0, running = false;
  const gain = (P.gain || 7.5) * (D.key === 'story' ? 1.25 : 1), decay = (P.decay || 15) * D.speed;
  const tap = ()=>{ if(!running || !api.playing()) return; p = Math.min(100, p + gain); mgHaptic(8); if(Math.random() < 0.35) mgSfx('tick'); if(p >= 100){ running = false; const tf = api.timeFrac(); api.success({ stars: tf < 0.55 ? 3 : tf < 0.8 ? 2 : 1 }); } };
  btn.addEventListener('pointerdown', e=>{ e.preventDefault(); tap(); });
  return {
    start(){ running = true; },
    update(dt){ if(running && dt) p = Math.max(0, p - decay*dt); ring.setAttribute('stroke-dashoffset', String(540 - 540*p/100)); },
    key(k, down){ if(k === 'act' && down) tap(); },
    destroy(){},
  };
};


/* =========================================================================
   NACECA · systems/sidequests.js (v11)
   Side quests: two or three optional goals per case, listed on the start
   card, tracked on the HUD and in the Case File, paid out in XP and
   reputation, and counted in the operation grade. Three kinds:
     · traces   hidden clues revealed by SCAN, walked to and logged
     · skills   a field mini-game finished cleanly enough
     · conduct  how the operation was run (no force, no sprinting on
                sacred ground, a trace with time to spare…)
   Also the mission hooks that put a field skill in front of the key
   interactions (MQ_HOOKS), wired in without touching the scene builders.
   ========================================================================= */
const SIDE = { mid:null, list:[], traces:[], clock:0, t0:null, rings:[] };

const SIDE_QUESTS = {
  m1: [
    { id:'m1_drill', title:'Ace the phishing drill', desc:"Run the drill at the analysts' desk and flag every red flag.", xp:60, rep:{ integrity:+2 }, mini:'m1_drill', minStars:2 },
    { id:'m1_prep',  title:'Do your homework', desc:'Check the case board and read your phone before you report to the Commander.', xp:40, rep:{ agencyFavour:+2 },
      poll:()=> S.game._hqBriefed ? ((S.game._hqBoard && S.game._hqPhone) ? 'done' : 'fail') : null },
  ],
  m2: [
    { id:'m2_alert', title:"Mama Bisi's 'credit alert'", desc:'A trader is about to hand over goods for a fake bank alert. Show her the red flags.', xp:60, rep:{ publicTrust:+4 }, mini:'m2_alert', minStars:1 },
    { id:'m2_clean', title:'Not one bystander', desc:'Catch KC without knocking a single trader over.', xp:50, rep:{ publicTrust:+2 },
      poll:()=> (S.game._opBumps||0) > 0 ? 'fail' : (S.game.moralChoices && S.game.moralChoices.market_runner === 'caught') ? 'done' : (S.game.moralChoices && S.game.moralChoices.market_runner === 'escaped') ? 'fail' : null },
    { id:'m2_sims', title:'Forensic sweep: SIM sleeves', desc:'SCAN around the stalls for the packaging KC dumped (2).', xp:50, rep:{ agencyFavour:+2 },
      traces:[ { id:'m2a', pos:[12.4, 1.0],  label:'SIM SLEEVES', name:'Torn SIM sleeves, same batch' },
               { id:'m2b', pos:[-11.8, -6.6], label:'SIM TRAY', name:'Empty 50-SIM dealer tray' } ] },
  ],
  m3: [
    { id:'m3_plug', title:'Pull the plug early', desc:'Stop the laptop wipe before it reaches 30%.', xp:60, rep:{ agencyFavour:+3 },
      poll:()=>{ const g = S.game; if(g._wipeLost) return 'fail'; if(g._wipeDone && g._wipeTotal){ return (100*g._wipeT/g._wipeTotal) < 30 ? 'done' : 'fail'; } return null; } },
    { id:'m3_book', title:'By the book', desc:'Arrest Chief Obi with professional restraint and no force.', xp:50, rep:{ integrity:+2 },
      poll:()=>{ const a = S.game.moralChoices && S.game.moralChoices.arrest; if(!a) return null; return (a === 'professional' && sideOpForce() === 0) ? 'done' : 'fail'; } },
    { id:'m3_burners', title:'Forensic sweep: burner phones', desc:"SCAN the house for the burners Obi didn't have time to hide (2).", xp:50, rep:{ agencyFavour:+2 },
      traces:[ { id:'m3a', pos:[-4.3, 2.75], label:'BURNER', name:'Burner phone in the sofa cushions' },
               { id:'m3b', pos:[-0.35, -6.3], label:'BURNER', name:'Burner taped under the hall console' } ] },
  ],
  m4: [
    { id:'m4_turn', title:'Turn Musa', desc:'Catch the driver in a lie his own papers contradict.', xp:60, rep:{ agencyFavour:+3 },
      poll:()=> S.game._cpMusaFlipped ? 'done' : null, final:()=> !!S.game._cpMusaFlipped },
    { id:'m4_weld', title:'Forensic sweep: the lorry', desc:'SCAN around the truck for who built the hidden compartment (2).', xp:50, rep:{ integrity:+1 },
      traces:[ { id:'m4a', pos:[2.2, 6.6],  label:'FRESH WELD', name:'Fresh welds on the chassis rail' },
               { id:'m4b', pos:[-6.4, 6.0], label:'RECEIPT', name:'Welder\'s receipt — Sapele Haulage' } ] },
    { id:'m4_calm', title:'Keep the checkpoint calm', desc:'Finish the operation without using force.', xp:40, rep:{ publicTrust:+2 },
      poll:()=> sideOpForce() > 0 ? 'fail' : null, final:()=> sideOpForce() === 0 },
  ],
  m5: [
    { id:'m5_respect', title:'Walk softly', desc:"Inside the compound: no sprinting, and never step into the fire's circle.", xp:60, rep:{ publicTrust:+3 },
      final:()=> !SIDE.violated && !!sideShrineOpen() },
    { id:'m5_traces', title:'Forensic sweep: the night visitors', desc:"SCAN the grounds for what the cartel's couriers left behind (3).", xp:70, rep:{ agencyFavour:+2 },
      traces:[ { id:'m5a', pos:[-5.6, -11.1], label:'BOOT PRINTS', name:'Boot prints by the back wall' },
               { id:'m5b', pos:[4.2, -10.9],  label:'CIGARETTES', name:'Imported cigarettes, fresh ash' },
               { id:'m5c', pos:[-5.2, 3.2],   label:'TYRE TRACKS', name:'Heavy tyre tracks off the path' } ] },
    { id:'m5_blessing', title:"With Pa Eze's blessing", desc:'Enter the shrine with the custodian\'s permission.', xp:50, rep:{ integrity:+2 },
      poll:()=>{ const a = S.game.flags && S.game.flags.shrine_access; return !a ? null : a === 'granted_negotiate' ? 'done' : 'fail'; } },
  ],
  m6: [
    { id:'m6_chain', title:'Clean chain of custody', desc:'Bag the spilled SIMs with two stars or better.', xp:50, rep:{ integrity:+2 }, mini:'m6_sims', minStars:2 },
    { id:'m6_route', title:"Forensic sweep: Ifeanyi's route", desc:"SCAN the warehouse for the fixer's paper trail (2).", xp:60, rep:{ agencyFavour:+2 },
      traces:[ { id:'m6a', pos:[12.7, -5.4], label:'ROUTE SHEET', name:'Route sheet: Asaba → Ugbowo' },
               { id:'m6b', pos:[5.6, 6.3],   label:'RECEIPT', name:'Fuel receipt, Ugbowo filling station' } ] },
    { id:'m6_decide', title:'No hesitation', desc:'Commit — chase or rescue — within 12 seconds of the breach.', xp:50, rep:{ agencyFavour:+2 },
      poll:()=>{ if(SIDE.t0 == null) return null; const went = !!(SIDE.committed || S.game._asabaChoice); if(went) return (SIDE.commitT - SIDE.t0) <= 12 ? 'done' : 'fail'; return (SIDE.clock - SIDE.t0) > 12 ? 'fail' : null; } },
  ],
  m7: [
    { id:'m7_mother', title:'Hear Mrs. Ehigie out', desc:"Talk to the missing student's mother at the gate.", xp:40, rep:{ publicTrust:+3 },
      poll:()=> S.game._towerMother ? 'done' : null },
    { id:'m7_fibre', title:'Document the sabotage', desc:'Photograph the cut fibre backhaul.', xp:40, rep:{ integrity:+1 },
      poll:()=> S.game._towerFibre ? 'done' : null },
    { id:'m7_margin', title:'With time to spare', desc:'Finish the call trace with 30 seconds or more on the window.', xp:60, rep:{ agencyFavour:+3 },
      poll:()=>{ const g = S.game; if(g._towerExpired) return 'fail'; if(g._towerTraced) return (g._towerWindow||0) >= 30 ? 'done' : 'fail'; return null; } },
  ],
  m8: [
    { id:'m8_ghost', title:'Ghost', desc:'Get Osas out without the house being warned.', xp:70, rep:{ integrity:+2 },
      poll:()=> S.game._finOsas ? (!S.game._finWarned ? 'done' : 'fail') : null },
    { id:'m8_quiet', title:'The back way', desc:"Use Musa's tip and come in through the back gate.", xp:50, rep:{ agencyFavour:+2 },
      available:()=> typeof musaGaveTip === 'function' && musaGaveTip(),
      poll:()=> S.game._finInside ? (S.game._finInside === 'back' ? 'done' : 'fail') : null },
    { id:'m8_payroll', title:'Forensic sweep: the payroll pages', desc:'Inside the compound, SCAN for the pages Osas hid before they moved him (2).', xp:60, rep:{ agencyFavour:+2 },
      traces:[ { id:'m8a', pos:[15.7, -11.4], label:'PAYROLL', name:'Payroll page in the gutter' },
               { id:'m8b', pos:[17.6, -8.0],  label:'PAYROLL', name:'Payroll page under the water tank stand' } ] },
  ],
};

/* ---------- helpers ---------- */
function sideOpForce(){ return (S.game.forceUsed||0) - ((S.game._opStart && S.game._opStart.force) || 0); }
function sideShrineOpen(){ const a = S.game.flags && S.game.flags.shrine_access; return a === 'granted_negotiate' || a === 'granted_force'; }
function sideState(){ return (S.game._sq && S.game._sq.mid === SIDE.mid) ? S.game._sq : (S.game._sq = { mid:SIDE.mid, st:{} }); }
function sideCounts(){ const st = sideState().st; return { done: SIDE.list.filter(q=>st[q.id] === 'done').length, total: SIDE.list.length }; }
function mgPassed(id){ return !!(S.game._mg && S.game._mg[id] && S.game._mg[id].ok); }

/* ---------- lifecycle ---------- */
function sideSetup(mid){
  SIDE.mid = mid; SIDE.clock = 0; SIDE.t0 = null; SIDE.committed = false; SIDE.commitT = null; SIDE.violated = false;
  SIDE.traces = []; SIDE.rings = [];
  S.game._mg = {};
  S.game._sq = { mid, st:{} };
  SIDE.list = (SIDE_QUESTS[mid] || []).filter(q=>!q.available || q.available());
  for(const q of SIDE.list) for(const t of (q.traces || [])) sideAddTrace(q, t);
  if(SIDE_SETUP[mid]){ try{ SIDE_SETUP[mid](); }catch(e){ console.warn('[NACECA] side setup', e); } }
  mqAttach(mid);
  sideChip();
  if(SIDE.traces.length && typeof showHint === 'function'){
    setTimeout(()=>{ if(S.game.currentMission === mid) showHint('traces', 'This case hides <b>traces</b> — press <b>F</b> to SCAN near anything suspicious', 'This case hides <b>traces</b> — tap <b>SCAN</b> near anything suspicious', 5600); }, 9000);
  }
}
function sideTick(dt){
  if(!SIDE.mid || S.game.currentMission !== SIDE.mid) return;
  SIDE.clock += dt;
  const st = sideState().st;
  // mission-specific trackers
  if(SIDE.mid === 'm6' && S.game._asabaTriggered && SIDE.t0 == null) SIDE.t0 = SIDE.clock;
  if(SIDE.mid === 'm6' && S.game._asabaChoice && SIDE.commitT == null){ SIDE.committed = true; SIDE.commitT = SIDE.clock; }
  if(SIDE.mid === 'm5' && !st.m5_respect && ENGINE.player && sideShrineOpen()) sideShrineConduct();
  for(const q of SIDE.list){
    if(st[q.id] || !q.poll) continue;
    let r = null; try{ r = q.poll(); }catch(e){}
    if(r === 'done') sideComplete(q.id); else if(r === 'fail') sideFail(q.id);
  }
  // pulse the revealed trace rings
  const t = performance.now()/1000;
  for(const tr of SIDE.traces){ if(tr.ring && tr.ring.visible){ const k = 0.5 + 0.5*Math.sin(t*4 + tr.ph); tr.ring.material.opacity = 0.35 + 0.45*k; tr.ring.scale.setScalar(0.9 + 0.2*k); } }
}
/* Pa Eze's rules, checked while Kelechi is inside the compound walls */
function sideShrineConduct(){
  const p = ENGINE.player.position;
  const inside = p.x > -7.2 && p.x < 7.2 && p.z < -3.35 && p.z > -12.1;
  if(!inside) return;
  const sp = ENGINE.player.userData && ENGINE.player.userData._speed || 0;
  if(sp > 4.2){ SIDE.violated = true; sideFail('m5_respect', 'you ran on sacred ground'); return; }
  if(Math.hypot(p.x - 3.0, p.z - (-5.4)) < 1.15){ SIDE.violated = true; sideFail('m5_respect', "you stepped into the fire's circle"); }
}
function sideComplete(qid){
  const q = SIDE.list.find(x=>x.id === qid); if(!q) return;
  const s = sideState(); if(s.st[qid]) return;
  s.st[qid] = 'done';
  if(q.xp && typeof awardXP === 'function') awardXP(q.xp);
  if(q.rep) applyEffect(q.rep);
  S.game.sideBest = S.game.sideBest || {};
  (S.game.sideBest[SIDE.mid] = S.game.sideBest[SIDE.mid] || {})[qid] = true;
  setTimeout(()=>toast('◆ SIDE QUEST COMPLETE', `${q.title} · +${q.xp||0} XP`, 2300), 250);
  if(typeof sfxEvidence === 'function') sfxEvidence();
  if(typeof haptic === 'function') haptic([15,30,15]);
  sideChip(true);
  const c = sideCounts();
  if(c.total && c.done === c.total){
    setTimeout(()=>{ toast('ABOVE AND BEYOND', `Every side quest in this case · +60 XP`, 2600); if(typeof awardXP === 'function') awardXP(60); if(typeof unlock === 'function') unlock('side_all'); }, 2700);
  }
}
function sideFail(qid, why){
  const q = SIDE.list.find(x=>x.id === qid); if(!q) return;
  const s = sideState(); if(s.st[qid]) return;
  s.st[qid] = 'failed';
  toast('SIDE QUEST FAILED', q.title + (why ? ' — ' + why : ''), 2200);
  sideChip(true);
}
/* a field skill finished: some side quests ask for a clean one */
function sideOnMini(id, stars){
  for(const q of SIDE.list){
    if(q.mini !== id) continue;
    if(stars >= (q.minStars || 1)) setTimeout(()=>sideComplete(q.id), 900);
    else setTimeout(()=>sideFail(q.id, `needed ${'★'.repeat(q.minStars||1)}`), 900);
  }
  if(id === 'm5_pots' && stars >= 3 && typeof unlock === 'function') unlock('steady_hands');
  const best = S.game.mgBest || {};
  if(Object.keys(best).filter(k=>best[k] >= 3).length >= 8 && typeof unlock === 'function') unlock('field_ace');
}
/* end of operation: settle the conduct quests, mark the rest missed */
function sideFinalize(){
  if(!SIDE.mid || S.game.currentMission !== SIDE.mid) return;
  const s = sideState();
  for(const q of SIDE.list){
    if(s.st[q.id]) continue;
    // a last look: the final beat may have landed under a cutscene, with no frame to notice it
    if(q.poll){ let r = null; try{ r = q.poll(); }catch(e){} if(r === 'done'){ sideComplete(q.id); continue; } if(r === 'fail'){ s.st[q.id] = 'failed'; continue; } }
    if(q.final){ let ok = false; try{ ok = !!q.final(); }catch(e){} if(ok) sideComplete(q.id); else s.st[q.id] = 'missed'; }
    else s.st[q.id] = 'missed';
  }
}
/* grade: side quests and field-skill stars move the score both ways */
function sideGradeAdjust(){
  let adj = 0;
  const c = sideCounts();
  if(c.total) adj += (c.done / c.total - 0.5) * 12;
  const mg = S.game._mg || {};
  const runs = Object.keys(mg).map(k=>mg[k]).filter(r=>r.ok || r.fails);
  if(runs.length){ const avg = runs.reduce((a, r)=>a + (r.ok && !r.forced ? r.stars : 0), 0) / runs.length; adj += (avg/3 - 0.5) * 8; }
  return adj;
}

/* ---------- traces (revealed by SCAN) ---------- */
function sideAddTrace(q, t){
  const a = new THREE.Object3D(); a.position.set(t.pos[0], 0.25, t.pos[1]); a.visible = false;
  ENGINE.scene.add(a);
  const tr = { q, t, a, revealed:false, found:false, ring:null, marker:null, ph:Math.random()*6 };
  tr.it = { mesh:a, label:'Log trace: ' + t.name, verb:'collect', range:1.9, labelY:0.35, optional:true, onInteract:()=>sideCollect(tr) };
  ENGINE.interactables.push(tr.it);
  SIDE.traces.push(tr);
}
function sideReveal(tr){
  if(tr.revealed) return;
  tr.revealed = true; tr.a.visible = true;
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.6, 32), new THREE.MeshBasicMaterial({ color:'#7adcd0', transparent:true, opacity:0.6, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide, toneMapped:false }));
  ring.rotation.x = -Math.PI/2; ring.position.set(tr.t.pos[0], 0.04, tr.t.pos[1]); ring.renderOrder = 4;
  ENGINE.scene.add(ring); tr.ring = ring;
  addEvidenceMarker(new THREE.Vector3(tr.t.pos[0], 0.95, tr.t.pos[1]), 'TRACE', tr.t.label, 'tr_' + tr.t.id);
  const m = ENGINE.evidenceMarkers[ENGINE.evidenceMarkers.length - 1];
  m.cls = 'trace'; m.let_collected = function(){ this.collected = true; }; tr.marker = m;
}
function sideCollect(tr){
  if(tr.found) return;
  tr.found = true; tr.it.consumed = true;
  if(tr.ring){ tr.ring.visible = false; }
  if(tr.marker) tr.marker.let_collected();
  applyEffect({ intel:+3 });
  if(typeof awardXP === 'function') awardXP(15);
  if(typeof sfxEvidence === 'function') sfxEvidence();
  if(typeof evidenceFlash === 'function') evidenceFlash();
  const mine = SIDE.traces.filter(x=>x.q === tr.q), got = mine.filter(x=>x.found).length;
  toast('TRACE LOGGED', `${tr.t.name} · ${got}/${mine.length}`, 1900);
  if(got === mine.length) setTimeout(()=>sideComplete(tr.q.id), 1200);
}
function sideScan(){
  if(!SIDE.traces.length || !ENGINE.player || S.game.currentMission !== SIDE.mid) return;
  const p = ENGINE.player.position;
  const R = ({ story:9, standard:7, hard:5.5 })[(typeof SETTINGS !== 'undefined' && SETTINGS.difficulty) || 'standard'] || 7;
  let n = 0, near = null, nd = 1e9;
  for(const tr of SIDE.traces){
    if(tr.found || tr.revealed) continue;
    const d = Math.hypot(tr.t.pos[0] - p.x, tr.t.pos[1] - p.z);
    if(d <= R){ sideReveal(tr); n++; }
    else if(d < nd){ nd = d; near = tr; }
  }
  if(n) setTimeout(()=>toast('TRACE DETECTED', n > 1 ? `${n} traces close by — walk over and log them` : 'Walk over and log it', 1900), 350);
  else if(near) sidePing(near, nd);
  else if(SIDE.traces.some(t=>!t.found)) sidePing(null, 0);
}
function sidePing(tr, d){
  let el = document.getElementById('scan-ping');
  if(!el){ el = document.createElement('div'); el.id = 'scan-ping'; (document.getElementById('hud') || document.body).appendChild(el); }
  if(!tr){ el.innerHTML = 'ALL TRACES MARKED — GO LOG THEM'; }
  else {
    const p = ENGINE.player.position, dx = tr.t.pos[0] - p.x, dz = tr.t.pos[1] - p.z;
    const yaw = ENGINE.cameraYaw, fx = Math.sin(yaw), fz = Math.cos(yaw), rx = -Math.cos(yaw), rz = Math.sin(yaw);
    const f = dx*fx + dz*fz, r = dx*rx + dz*rz;
    const deg = Math.atan2(-f, r) * 180 / Math.PI;
    el.innerHTML = `FAINT TRACE · ${Math.round(d)} m <span class="arr" style="transform:rotate(${deg.toFixed(0)}deg)">➤</span>`;
  }
  el.classList.add('show'); clearTimeout(el._t); el._t = setTimeout(()=>el.classList.remove('show'), 2400);
}

/* ---------- HUD chip, start card, case file, aftermath, mission cards ---------- */
function sideChip(pop){
  let el = document.getElementById('side-chip');
  if(!el){
    const host = document.querySelector('#hud-mission > div:last-child'); if(!host) return;
    el = document.createElement('div'); el.id = 'side-chip'; host.appendChild(el);
    el.addEventListener('click', e=>{ e.stopPropagation(); if(ENGINE.movementEnabled && typeof openCaseFile === 'function') openCaseFile(); });
  }
  const c = sideCounts();
  if(!c.total){ el.classList.remove('show'); return; }
  el.innerHTML = `<span class="d"></span>SIDE QUESTS <b>${c.done}/${c.total}</b>`;
  el.classList.add('show');
  if(pop){ el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
}
function sideStartCard(mid){
  const scr = document.getElementById('screen-controls'); if(!scr) return;
  let box = document.getElementById('start-sq');
  if(!box){ box = document.createElement('div'); box.id = 'start-sq'; box.className = 'start-sq'; const b = document.getElementById('btn-start-mission'); scr.insertBefore(box, b); }
  const qs = (SIDE_QUESTS[mid] || []).filter(q=>!q.available || q.available());
  if(!qs.length){ box.style.display = 'none'; return; }
  const best = (S.game.sideBest && S.game.sideBest[mid]) || {};
  box.style.display = '';
  box.innerHTML = `<h4>SIDE QUESTS · OPTIONAL · COUNT TOWARD YOUR GRADE</h4>` + qs.map(q=>`<div class="q">${q.title}${best[q.id] ? ' ✓' : ''} <span>— ${q.desc}</span></div>`).join('');
}
function sideCaseFile(st){
  if(!st || !SIDE.list.length || S.game.currentMission !== SIDE.mid) return;
  const col = st.firstElementChild; if(!col) return;
  const s = sideState().st;
  const wrap = document.createElement('div'); wrap.className = 'sq-list';
  wrap.innerHTML = `<h4>SIDE QUESTS</h4>` + SIDE.list.map(q=>{
    const k = s[q.id];
    const traces = q.traces ? ` (${SIDE.traces.filter(t=>t.q === q && t.found).length}/${q.traces.length})` : '';
    return `<div class="so side ${k === 'done' ? 'done' : k === 'failed' ? 'failed' : ''}">${q.title}${traces}<span class="xp">+${q.xp} XP</span></div>`;
  }).join('');
  col.appendChild(wrap);
}
function sideAftermath(grid){
  if(!grid || !SIDE.list.length || S.game.currentMission !== SIDE.mid) return;
  const s = sideState().st, c = sideCounts();
  const mg = S.game._mg || {};
  const names = { m1_drill:'Phishing drill', m2_unlock:'Phone unlock', m2_alert:'Credit alert', m3_wipe:'Kill the wipe', m3_cash:'Bag the table', m4_panel:'False panel', m5_pots:'Libation pots',
                  m5_cache:'Padlock', m6_ropes:'Cut Tobi free', m6_sims:'Bag the SIMs', m7_gen:'Generator wiring', m7_trace:'Handset lock', m8_gate:'Back-gate padlock', m8_free:'Cut the ties' };
  const skills = Object.keys(mg).filter(k=>mg[k].ok || mg[k].fails).map(k=>{
    const r = mg[k]; const v = r.ok && !r.forced ? '★'.repeat(r.stars) + '☆'.repeat(3 - r.stars) : r.forced ? 'FORCED' : 'FAILED';
    return `<div class="stat-row"><span class="lbl">${names[k] || k}</span><span class="val ${r.ok && !r.forced ? 'ok' : 'fail'}">${v}</span></div>`;
  }).join('');
  const b = document.createElement('div');
  b.className = 'aftermath-block sq-block'; b.style.gridColumn = '1/-1';
  b.innerHTML = `<h3>SIDE QUESTS · ${c.done}/${c.total}</h3>` + SIDE.list.map(q=>{
      const k = s[q.id];
      return `<div class="stat-row"><span class="lbl">${q.title}</span><span class="val ${k === 'done' ? 'ok' : k === 'failed' ? 'fail' : 'no'}">${k === 'done' ? '✓ +' + q.xp + ' XP' : k === 'failed' ? 'FAILED' : 'MISSED'}</span></div>`;
    }).join('') + (skills ? `<h3 style="margin-top:14px">FIELD SKILLS</h3>${skills}` : '');
  // after the operational stats + reputation blocks
  const blocks = grid.querySelectorAll('.aftermath-block:not(.grade-block)');
  if(blocks[1] && blocks[1].nextSibling) grid.insertBefore(b, blocks[1].nextSibling); else grid.appendChild(b);
}
function sideCardLine(mid){
  const qs = (SIDE_QUESTS[mid] || []); if(!qs.length) return '';
  const best = (S.game.sideBest && S.game.sideBest[mid]) || {};
  const n = qs.filter(q=>best[q.id]).length;
  return `<div class="region" style="margin:8px 0 0;color:${n === qs.length ? '#5dd07a' : '#d8a64a'}">◆ SIDE QUESTS ${n}/${qs.length}</div>`;
}

/* ---------- per-case extras: the drill terminal, Mama Bisi ---------- */
const SIDE_SETUP = {
  m1(){
    const a = new THREE.Object3D(); a.position.set(6.85, 0.95, -5.85); ENGINE.scene.add(a);   // the spare monitor on Bola's desk
    ENGINE.interactables.push({ mesh:a, label:'Run the phishing drill', verb:'inspect', range:2.2, labelY:0.3, optional:true,
      onInteract:()=>{
        if(mgPassed('m1_drill')){ toast('DRILL LOGGED', 'Your score is on the training board.'); return; }
        miniPlay(MG_CFG.m1_drill(), ()=>{});
      } });
    if(typeof MINIMAP !== 'undefined' && MINIMAP.pois) MINIMAP.pois.push({ x:6.85, z:-5.85, color:'#7adcd0', r:1.2 });
  },
  m2(){
    const crowd = ENGINE._marketCrowd || [];
    const bisi = crowd.find(m=>m && Math.abs(m.position.x - 7.2) < 0.6 && Math.abs(m.position.z + 1.5) < 0.6) || crowd[0];
    if(!bisi) return;
    bisi.userData._idle = 'talk';
    ENGINE.interactables.push({ mesh:bisi, label:'Help Mama Bisi', verb:'help', range:2.3, optional:true,
      onInteract:()=>{
        if(mgPassed('m2_alert')){ toast('MAMA BISI', '"God bless you, officer. I almost gave that boy everything."'); return; }
        if(bisi.userData && bisi.userData._down){ toast('MAMA BISI', 'Give her a moment to get up.'); return; }
        miniPlay(MG_CFG.m2_alert(), ()=>{});
      } });
    if(typeof MINIMAP !== 'undefined' && MINIMAP.pois) MINIMAP.pois.push({ x:bisi.position.x, z:bisi.position.z, color:'#7adcd0', r:1.2 });
  },
};

/* =========================================================================
   Field-skill configs (text + tuning) and the hooks that put them in front
   of an existing interaction. A hook only fires when the original action
   would actually go ahead; once passed, the original runs as before.
   ========================================================================= */
const MG_CFG = {
  m1_drill:()=>({ id:'m1_drill', type:'spot', kicker:'CASE 01 · TRAINING', title:'PHISHING DRILL', time:30,
    sub:'A live scam text captured yesterday. <b>Tap every red flag</b> — and only the red flags.',
    winNote:'Analyst Bola marks you up on the training board.',
    params:{ header:'SMS · from "Crestline-Alert" · 07:42', parts:[
      'Dear Customer, your account ', { t:'has been SUSPENDED', flag:true, note:'Panic hook' },
      ' due to a ', { t:'BVN mismatch', flag:true, note:'Banks never fix a BVN by text' },
      '. To avoid ', { t:'permanent closure within 2 hours', flag:true, note:'Fake deadline' },
      ', verify at ', { t:'crestline-secure-verify.co/login', flag:true, note:'Look-alike web address' },
      ' and confirm your ', { t:'card PIN + OTP', flag:true, note:'No bank ever asks for these' },
      '. ', { t:'Thank you for banking with us.', why:'A normal sign-off — not the tell.' },
      ' ', { t:'(Ref: 4471)', why:'A reference number proves nothing either way.' } ] } }),
  m2_alert:()=>({ id:'m2_alert', type:'spot', kicker:'CASE 02 · MAMA BISI', title:"THE 'CREDIT ALERT'", time:35,
    sub:'A "customer" showed Mama Bisi this alert for ₦185,000 of lace and is waiting for his goods. <b>Show her the red flags.</b>',
    winNote:'Mama Bisi checks her banking app: nothing came in. The "customer" is already gone.',
    params:{ header:'SMS · received 16:58', parts:[
      { t:'From: +234 803 114 2207', flag:true, note:'Banks text from their name, not a mobile number' }, '\n',
      'Acct: 30******14\n', { t:'Acct Credited Sucessfully', flag:true, note:'Misspelt — a copied template' }, '\n',
      'Amt: NGN185,000.00\n', { t:'Date: 06-Oct-2026 16:57', why:'The date is fine.' }, '\n',
      { t:'Desc: TRF/pls release goods to bearer', flag:true, note:'Banks don\'t add sales talk' }, '\n',
      { t:'Avail Bal: NGN185,000.00', flag:true, note:'Balance equals the credit — her account wasn\'t empty' }, '\n',
      { t:'Ref: CRB/2210/88', why:'A reference number proves nothing either way.' } ] } }),
  m2_unlock:()=>({ id:'m2_unlock', type:'pattern', kicker:'CASE 02 · PHONE UNLOCK', title:"KC'S PHONE", time:30,
    sub:'Tunde watched KC unlock it at the counter. The pattern plays once — <b>draw it back</b> before the screen sleeps.',
    winNote:'Unlocked. Now find the phishing template.',
    params:{ caption:'TECNO SP-7 · LOCKED · WRONG TRIES WIPE IT' },
    force:{ label:'FORENSIC BYPASS', note:'−6 intel · slow and noisy', apply:()=>applyEffect({ intel:-6 }) } }),
  m3_wipe:()=>({ id:'m3_wipe', type:'procs', kicker:'CASE 03 · LIVE WIPE', title:'KILL THE WIPE',
    sub:"Obi's laptop is shredding itself. Kill the three processes hammering the disk — <b>read the DISK W column</b>. The wipe keeps running while you work.",
    winNote:'Wipe processes dead. Pull the power and image the drive.',
    params:{ shuffle:1.5, benignCount:6,
      targets:[ { n:'shredd -z /dev/sda', cpu:31, w:214 }, { n:'wipe_sched.exe', cpu:12, w:188 }, { n:'zerofill --fast', cpu:24, w:241 } ],
      benign:[ { n:'explorer.exe', cpu:2.1, w:0.4 }, { n:'audiodg.exe', cpu:0.8, w:0 }, { n:'chrome.exe', cpu:6.4, w:3 }, { n:'OneDrive.exe', cpu:1.2, w:12 }, { n:'svchost.exe', cpu:3.3, w:6 },
               { n:'WhatsApp.exe', cpu:1.9, w:2 }, { n:'backup_agent', cpu:4.0, w:38 }, { n:'MsMpEng.exe', cpu:9.5, w:22 }, { n:'spoolsv.exe', cpu:0.3, w:0 }, { n:'dwm.exe', cpu:2.6, w:0 } ],
      onMistake:()=>{ if(S.game._wipeTotal) S.game._wipeT += 0.05 * S.game._wipeTotal; } },
    onTick:dt=>{ if(S.game._wipeTotal && !S.game._wipeDone) S.game._wipeT += dt * (typeof timerRate === 'function' ? timerRate() : 1); },
    meter:()=>{ if(!S.game._wipeTotal) return null; const f = Math.min(1, S.game._wipeT/S.game._wipeTotal); return { label:'LAPTOP WIPE', frac:f, text:Math.round(f*100) + '%' }; },
    abortIf:()=> S.game._wipeTotal && S.game._wipeT >= S.game._wipeTotal, abortText:'The wipe finished. The drive is blank.',
    force:{ label:'YANK THE BATTERY', note:'Dirty shutdown · −8 intel', apply:()=>applyEffect({ intel:-8 }) } }),
  m3_cash:()=>({ id:'m3_cash', type:'sort', kicker:'CASE 03 · CHAIN OF CUSTODY', title:'BAG THE TABLE',
    sub:"Everything on Obi's table goes somewhere. <b>Seize</b> the money, <b>bag</b> the evidence, <b>leave</b> what's personal — his lawyer will check every item.",
    params:{ perItem:3.8, count:7, coverIc:'🧤', coverText:'GLOVES ON',
      bins:[ { id:'cash', label:'SEIZE · CASH' }, { id:'ev', label:'BAG · EVIDENCE' }, { id:'leave', label:'LEAVE · PERSONAL' } ],
      items:[ { ic:'💵', nm:'₦1,000 bundles ×40', ds:'bank bands torn off', bin:'cash' }, { ic:'💵', nm:'US$100 notes', ds:'rubber-banded, unsorted', bin:'cash' },
              { ic:'🧾', nm:'POS agent receipts', ds:'three agents, same afternoon', bin:'ev' }, { ic:'📒', nm:'Spiral notebook', ds:'initials and amounts', bin:'ev' },
              { ic:'💳', nm:'Six ATM cards', ds:'six different names — none of them his', bin:'ev' }, { ic:'🔌', nm:'Hardware crypto wallet', ds:'taped under the table', bin:'ev' },
              { ic:'🖼️', nm:'Title-conferment photo', ds:'family keepsake', bin:'leave' }, { ic:'📿', nm:'Rosary', ds:"his late mother's", bin:'leave' },
              { ic:'🎒', nm:"Child's school bag", ds:'not part of the case', bin:'leave' } ] } }),
  m4_panel:()=>({ id:'m4_panel', type:'steady', kicker:'CASE 04 · FALSE PANEL', title:'FIND THE LATCH', time:35,
    sub:'The compartment is a welded false wall. Run the probe along the seam to trip the hidden latches — <b>stay in the seam</b>; scraping spooks the cattle.',
    winNote:'Two clicks. The panel drops on its hinge.',
    params:{ skin:'plate', meterLabel:'NOISE', itemWord:'LATCHES', items:[0.38, 0.74], width:0.09, aspect:0.78, failText:'The cattle panic and kick the panel. Start again.',
      palette:{ chan:'rgba(30,30,34,.85)', edge:'rgba(200,170,110,.45)' }, itemColor:'#c8b090' },
    force:{ label:'CROWBAR IT', note:'−8 intel · the ledger tears', apply:()=>applyEffect({ intel:-8 }) } }),
  m5_pots:()=>({ id:'m5_pots', type:'steady', kicker:'CASE 05 · SACRED GROUND', title:'LIFT THE SIM CARDS', time:40,
    sub:'The cartel sank SIM packs into the libation pots. Fish them out <b>without spilling</b> — Pa Eze is watching.',
    winNote:'Three SIM packs in cling film. Pa Eze nods once.',
    params:{ skin:'pot', meterLabel:'SPILL', itemWord:'SIM PACKS', items:[0.28, 0.56, 0.84], width:0.085, failText:'The pot tips — palm wine across the altar.',
      palette:{ bg:'#1c120c', rim:'#5a3a22', chan:'rgba(120,180,200,.20)', edge:'rgba(160,210,230,.35)' } },
    onFail:()=>{ S.game._shrineSpills = (S.game._shrineSpills||0) + 1; if(S.game._shrineSpills <= 2){ applyEffect({ publicTrust:-2 }); setTimeout(()=>toast('PA EZE', '"Gently, my child. Gently."', 2000), 300); } },
    force:{ label:'TIP THE POT OUT', note:'−5 Public Trust', apply:()=>applyEffect({ publicTrust:-5 }) } }),
  m5_cache:()=>({ id:'m5_cache', type:'dial', kicker:'CASE 05 · CARTEL CACHE', title:'PICK THE PADLOCK', time:30,
    sub:'A chain through the jerry-can handles and a cheap brass padlock. <b>Tap as the needle crosses the gold arc</b> to set each pin.',
    winNote:'The shackle drops. Cash, a ledger — and the smell of diesel.',
    params:{ pins:3, actLabel:'SET PIN', missText:'The pick slips.' },
    force:{ label:'BOLT-CUTTERS', note:'Loud · −2 Public Trust', apply:()=>applyEffect({ publicTrust:-2 }) } }),
  m6_ropes:()=>({ id:'m6_ropes', type:'mash', kicker:'CASE 06 · THE OFFICE', title:'CUT TOBI FREE', time:7, noStrikes:true,
    sub:'Cable ties at his wrists and ankles, and the smoke is pouring under the door. <b>Saw — fast.</b> The smoke clock keeps running.',
    winNote:'Free. Get him low and get him out.',
    params:{ label:'SAW', small:'TAP · TAP · TAP', gain:7, decay:14 },
    onTick:dt=>{ const tb = ENGINE._asabaTobi; if(!(tb && tb.userData._rescued) && !S.game._asabaHostageLost) S.game._asabaSmokeTimer = (S.game._asabaSmokeTimer||0) + dt * (typeof timerRate === 'function' ? timerRate() : 1); },
    abortIf:()=> (S.game._asabaSmokeTimer||0) > 35, abortText:'The smoke took him before the ties gave.',
    meter:()=>{ if(!S.game._asabaTriggered) return null; const t = S.game._asabaSmokeTimer||0; return { label:'TOBI — SMOKE', frac:t/35, text:Math.max(0, 35 - t).toFixed(0) + ' s' }; },
    timeText:'The blade skids off the tie.',
    force:{ label:'DRAG HIM OUT, CHAIR AND ALL', note:'He\'s hurt · −3 Public Trust', apply:()=>applyEffect({ publicTrust:-3 }) } }),
  m6_sims:()=>({ id:'m6_sims', type:'sort', kicker:'CASE 06 · SPILLED CRATE', title:'BAG THE SIMS',
    sub:"Ifeanyi's crate split open. <b>Bag</b> what proves the scheme, <b>log</b> the paper, <b>leave</b> the rubbish — fast.",
    params:{ perItem:3.2, count:7, coverIc:'📦', coverText:'CRATE SPLIT OPEN',
      bins:[ { id:'sim', label:'SIM BAG' }, { id:'doc', label:'DOC BAG' }, { id:'junk', label:'LEAVE' } ],
      items:[ { ic:'📶', nm:'Pre-activated SIMs ×24', ds:'same batch number', bin:'sim' }, { ic:'📶', nm:'SIMs ×12', ds:'registered to "Mama Florence"', bin:'sim' },
              { ic:'📶', nm:'SIM carrier cards ×30', ds:'serials still attached', bin:'sim' }, { ic:'🧾', nm:'Activation slips', ds:'agent stamp: Asaba Main Market', bin:'doc' },
              { ic:'📒', nm:'Dispatch notebook', ds:'routes, dates, initials', bin:'doc' }, { ic:'🥤', nm:'Empty Malta can', ds:'', bin:'junk' },
              { ic:'🧻', nm:'Packing tissue', ds:'', bin:'junk' }, { ic:'🍪', nm:'Half a packet of biscuits', ds:'', bin:'junk' } ] },
    onFail:()=>applyEffect({ intel:-4 }),
    force:{ label:'SWEEP IT ALL IN', note:'Contaminated bag · −6 intel', apply:()=>applyEffect({ intel:-6 }) } }),
  m7_gen:()=>{
    const pairs = [ { lead:'RED', color:'#d8343f', term:'BATT +' }, { lead:'BROWN', color:'#8a5a2a', term:'BATT −' }, { lead:'YELLOW', color:'#e8c020', term:'FUEL SOL' },
                    { lead:'BLUE', color:'#2f6fd0', term:'GLOW PLUG' }, { lead:'GREEN', color:'#2fae5a', term:'START' } ];
    return { id:'m7_gen', type:'wires', kicker:'CASE 07 · GENERATOR', title:"OSARO'S WIRING", time:30,
      sub:'The saboteurs pulled the starter harness. Osaro called the leads out — <b>tap a lead, then its terminal</b>. A wrong one sparks.',
      winNote:'The generator catches on the first crank.',
      params:{ notesTitle:"OSARO'S NOTES", pairs: miniDiff().key === 'story' ? pairs.slice(0, 4) : pairs },
      force:{ label:'LET OSARO DO IT', note:'−3 Agency Favour · slower', apply:()=>applyEffect({ agencyFavour:-3 }) } };
  },
  m7_trace:()=>({ id:'m7_trace', type:'tune', kicker:'CASE 07 · BTS CABINET', title:'LOCK THE HANDSET', time:40, noStrikes:true,
    sub:'The handset is hopping channels. <b>Match the gold trace</b> with FREQ and GAIN and hold it until the lock fills — the trace window is still closing.',
    winNote:'Lock held. Now read the sectors.',
    params:{ labelA:'FREQ', labelB:'GAIN', hold:2.6, meterLabel:'LOCK', lockText:'HOLDING LOCK…', screenLabel:'HANDSET ---   CABINET ───' },
    onTick:dt=>{ const g = S.game; if(g._towerAmbush && !g._towerTraced && !g._towerExpired) g._towerWindow -= dt * (typeof timerRate === 'function' ? timerRate() : 1); },
    abortIf:()=> S.game._towerAmbush && !S.game._towerTraced && S.game._towerWindow <= 0, abortText:'They hit the generator. The cabinet is dead.',
    meter:()=>{ if(!S.game._towerAmbush) return null; const w = Math.max(0, S.game._towerWindow||0); return { label:'TRACE WINDOW', frac:1 - w/75, text:w.toFixed(0) + ' s' }; },
    timeText:'The handset hopped away.' }),
  m8_gate:()=>({ id:'m8_gate', type:'dial', kicker:'CASE 08 · BACK GATE', title:"THE GENERATOR MAN'S PADLOCK", time:28,
    sub:'Musa said he leaves it hanging, not clicked shut — it still needs coaxing. <b>Quietly.</b> Every slip rattles the chain.',
    winNote:'The padlock opens without a sound.',
    params:{ pins:3, actLabel:'SET PIN', missText:'The chain rattles.' },
    onStrike:run=>{ if(run.strikes >= 2 && !S.game._finWarned){ S.game._finWarned = true; setTimeout(()=>toast('A LIGHT GOES ON', 'Someone in the main house heard the chain.', 2200), 200); } },
    force:{ label:'RIP THE HASP', note:'Loud — the house will know', apply:()=>{ S.game._finWarned = true; } } }),
  m8_free:()=>({ id:'m8_free', type:'steady', kicker:"CASE 08 · BOYS' QUARTERS", title:'CUT THE TIES', time:30,
    sub:"Osas's wrists are zip-tied to the bed frame. Slide the blade along the ties — <b>don't nick his skin</b>.",
    winNote:'"Officer… thank you. The drive — I still have it."',
    params:{ skin:'ties', meterLabel:'NICKS', itemWord:'TIES CUT', items:[0.3, 0.62, 0.9], width:0.08, aspect:0.62, failText:'He flinches — you nicked him. Steady now.',
      palette:{ chan:'rgba(240,235,225,.30)', edge:'rgba(255,255,255,.4)' }, itemColor:'#f0ece0' },
    force:{ label:'CUT FAST', note:'He gets hurt · −2 Public Trust', apply:()=>applyEffect({ publicTrust:-2 }) } }),
};

const MQ_HOOKS = {
  m2: [ { label:'Scan suspect phone', id:'m2_unlock', ready:()=> S.game._marketTunde && !S.game._marketScanned } ],
  m3: [ { label:'Inspect laptop', id:'m3_wipe', ready:()=> S.game._mansionPreBriefed && !S.game._evLaptop && !S.game._wipeLost && !S.game._wipeDone },
        { label:'Bag cash evidence', id:'m3_cash', ready:()=> !S.game._evCash } ],
  m4: [ { label:'Open rear compartment', id:'m4_panel', ready:()=> S.game._cpManifestDone && !S.game._cpCompartmentOpen } ],
  m5: [ { label:'Search Libation Pots', id:'m5_pots', ready:()=> sideShrineOpen() && !S.game._shrinePotsSearched },
        { label:'Inspect Cartel Cache', id:'m5_cache', ready:()=> sideShrineOpen() && !S.game._shrineCacheSearched } ],
  m6: [ { label:'Rescue the hostage', id:'m6_ropes', ready:()=>{ const tb = ENGINE._asabaTobi; return S.game._asabaTriggered && !S.game._asabaChoice && !S.game._asabaHostageLost && !(tb && tb.userData._rescued); },
          before:()=>{ if(SIDE.commitT == null){ SIDE.committed = true; SIDE.commitT = SIDE.clock; } } },
        { label:'Bag spilled SIMs', id:'m6_sims', ready:()=> !S.game._asabaSIMs } ],
  m7: [ { label:'Restart the generator', id:'m7_gen', ready:()=> S.game._towerEngineer && !S.game._towerPower },
        { label:'Run the call trace', id:'m7_trace', ready:()=> S.game._towerPower && !S.game._towerExpired && !S.game._towerTraced } ],
  m8: [ { label:'Try the back gate', id:'m8_gate', ready:()=> S.game._finHouseKnown && !S.game._finInside && typeof musaGaveTip === 'function' && musaGaveTip() },
        { label:'Free Osas', id:'m8_free', ready:()=> !!S.game._finInside && !S.game._finOsas } ],
};
function mqAttach(mid){
  for(const h of (MQ_HOOKS[mid] || [])){
    const it = ENGINE.interactables.find(i=>i.label === h.label && !i._mq);
    if(!it || typeof it.onInteract !== 'function') continue;
    it._mq = h.id;
    const orig = it.onInteract;
    it.onInteract = function(self){
      let go = false; try{ go = h.ready() && !mgPassed(h.id) && !miniIsOpen(); }catch(e){}
      if(!go) return orig.call(it, self);
      if(h.before) h.before();
      miniPlay(MG_CFG[h.id](), res=>{
        if(res && res.ok){ it._used = true; try{ orig.call(it, self); }catch(e){ console.error(e); } }
      });
    };
  }
}

/* new awards — registered once the page has loaded, so this module can sit
   anywhere in the bundle order (ACHIEVEMENTS lives in systems/progression.js) */
const SIDE_AWARDS = [
  { id:'side_all',     name:'Above and Beyond', desc:'Complete every side quest in a case.' },
  { id:'steady_hands', name:'Steady Hands',     desc:'Lift the SIMs from the libation pots without spilling a drop.' },
  { id:'field_ace',    name:'Field Ace',        desc:'Earn three stars on eight different field skills.' },
];
function sideRegisterAwards(){
  try{ for(const a of SIDE_AWARDS) if(!ACHIEVEMENTS.some(x=>x.id === a.id)) ACHIEVEMENTS.push(a); }catch(e){}
}
window.addEventListener('load', sideRegisterAwards);

/* =========================================================================
   NACECA · scenes/level_fixes_v11.js (v11)
   Level fixes for the baked (v9) scenes:
   · Case 05: the baked altar sat right behind the shrine gate — with
     Kelechi's collision radius there was no way into the courtyard, so the
     cartel cache could never be reached. The altar (plinth + libation
     pots) now stands to the left of the shrine door, and the searches,
     glows and markers follow it.
   · Case 01: the case-board interaction still pointed at the old blockout
     wall outside the baked room; it now sits on the cork board.
   ========================================================================= */
const SHRINE_ALTAR_DX = -1.5;
function _shiftWorld(o, dx, dz){
  if(!o || !o.parent) return;
  o.parent.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(o.parent.matrixWorld).invert();
  const a = new THREE.Vector3(0, 0, 0).applyMatrix4(inv), b = new THREE.Vector3(dx, 0, dz).applyMatrix4(inv);
  o.position.add(b.sub(a)); o.updateMatrix(); o.updateMatrixWorld(true);
}
function shrineOpenCourtyard(dr){
  const root = dr && dr.inst && dr.inst.root; if(!root) return 0;
  root.updateMatrixWorld(true);
  const box = { x0:-1.15, x1:1.15, z0:-4.65, z1:-3.65, y0:-0.012, y1:1.4 };   // the plinth's bevel skirt sits on y = 0
  const v = new THREE.Vector3();
  let moved = 0;
  root.traverse(o=>{
    if(!o.isMesh || !o.geometry || !o.geometry.attributes.uv2) return;
    const g = o.geometry;
    if(g.userData && g.userData._altarShifted){ moved++; return; }
    const a = g.attributes.position, idx = g.index, arr = a.array;
    const intArr = !(arr instanceof Float32Array);
    const den = !a.normalized ? 1 : (arr instanceof Int16Array ? 1/32767 : arr instanceof Uint16Array ? 1/65535 : arr instanceof Int8Array ? 1/127 : arr instanceof Uint8Array ? 1/255 : 1);
    const n = idx ? idx.count : a.count;
    const sel = new Set(), keep = new Set();
    for(let i=0;i<n;i+=3){
      let all = true; const vs = [];
      for(let k=0;k<3;k++){
        const vi = idx ? idx.getX(i+k) : i+k; vs.push(vi);
        v.set(a.getX(vi)*den, a.getY(vi)*den, a.getZ(vi)*den).applyMatrix4(o.matrixWorld);
        if(!(v.x > box.x0 && v.x < box.x1 && v.z > box.z0 && v.z < box.z1 && v.y > box.y0 && v.y < box.y1)) all = false;
      }
      vs.forEach(vi=>(all ? sel : keep).add(vi));
    }
    if(!sel.size) return;
    // flat ground pieces inside the box stay where they are; only raised geometry (plinth, pots) moves
    let maxY = -1; for(const vi of sel){ v.set(a.getX(vi)*den, a.getY(vi)*den, a.getZ(vi)*den).applyMatrix4(o.matrixWorld); if(v.y > maxY) maxY = v.y; }
    if(maxY < 0.05) return;
    for(const vi of sel) if(keep.has(vi)){ console.warn('[NACECA] altar shares vertices with', o.name); return; }
    const inv = new THREE.Matrix4().copy(o.matrixWorld).invert();
    const p0 = new THREE.Vector3(0, 0, 0).applyMatrix4(inv), p1 = new THREE.Vector3(SHRINE_ALTAR_DX, 0, 0).applyMatrix4(inv);
    const dl = p1.sub(p0);
    const lim = arr instanceof Int16Array ? 32767 : arr instanceof Uint16Array ? 65535 : arr instanceof Int8Array ? 127 : arr instanceof Uint8Array ? 255 : Infinity;
    const lo = (arr instanceof Int16Array || arr instanceof Int8Array) ? -lim : 0;
    const nx = vi=>{ const r = a.getX(vi) + dl.x/den; return intArr ? Math.round(r) : r; };
    const ny = vi=>{ const r = a.getY(vi) + dl.y/den; return intArr ? Math.round(r) : r; };
    const nz = vi=>{ const r = a.getZ(vi) + dl.z/den; return intArr ? Math.round(r) : r; };
    for(const vi of sel){ for(const f of [nx, ny, nz]){ const r = f(vi); if(r < lo || r > lim){ console.warn('[NACECA] altar shift out of range in', o.name); return; } } }
    for(const vi of sel){ const X = nx(vi), Y = ny(vi), Z = nz(vi); a.setXYZ(vi, X, Y, Z); }
    a.needsUpdate = true;
    g.computeBoundingBox(); g.computeBoundingSphere();
    g.userData = g.userData || {}; g.userData._altarShifted = true;
    moved++;
  });
  // its glow marker, its collision box
  if(dr.D && dr.D.PotGlow && !dr.D.PotGlow.userData._altarShifted){ _shiftWorld(dr.D.PotGlow, SHRINE_ALTAR_DX, 0); dr.D.PotGlow.userData._altarShifted = true; }
  for(const o of (ENGINE.obstacles || [])){
    const cx = (o.minX + o.maxX)/2, cz = (o.minZ + o.maxZ)/2;
    if(Math.abs(cx) < 0.05 && Math.abs(cz + 4.15) < 0.05 && Math.abs(o.maxX - o.minX - 1.9) < 0.05){ o.minX += SHRINE_ALTAR_DX; o.maxX += SHRINE_ALTAR_DX; }
  }
  return moved;
}
function hqFixCaseBoard(){
  const it = ENGINE.interactables.find(i=>i.label === 'Check the case board'); if(!it) return;
  const a = new THREE.Object3D(); a.position.set(-7.25, 1.45, 0.45); ENGINE.scene.add(a);
  it.mesh = a; it.labelY = 0.35; it.range = 2.6;
  if(typeof MINIMAP !== 'undefined' && MINIMAP.pois) MINIMAP.pois.push({ x:-7.25, z:0.45, color:'#d8a64a', r:1.2 });
}
