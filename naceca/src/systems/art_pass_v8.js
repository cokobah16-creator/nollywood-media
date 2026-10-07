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
      const el = document.createElement('div'); el.className = 'evidence-marker';
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
}


/* ---------------- flow: scenes, frame loop, mission start ---------------- */
function newScene(opts){
  const old = ENGINE.scene;
  ENGINE.sceneUpdate = null; ENGINE._mansion = null; ENGINE.ceilingY = undefined; ENGINE.inside = null; ENGINE.seq = null; ENGINE.extraSkinned = [];
  ENGINE._policeRed = null; ENGINE._policeBlue = null;
  setCameraSolids(null); resetCameraFollow();
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
    if(PEOPLE._mats) PEOPLE._mats.forEach((m, t)=>{ keepMat.add(m); keepTex.add(t); });
    if(PEOPLE.__bg) keepGeo.add(PEOPLE.__bg);
    if(PEOPLE.__bm){ keepMat.add(PEOPLE.__bm); keepTex.add(PEOPLE.__bm.map); }
  }
  if(typeof MANSION !== 'undefined'){
    if(MANSION.gltf) MANSION.gltf.scene.traverse(o=>{ if(o.geometry) keepGeo.add(o.geometry); });
    Object.values(MANSION.mats || {}).forEach(m=>{ keepMat.add(m); for(const k in m){ if(m[k] && m[k].isTexture) keepTex.add(m[k]); } });
    Object.values(MANSION.tex || {}).forEach(t=>keepTex.add(t));
    if(MANSION.lm) keepTex.add(MANSION.lm);
  }
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
  } else {
    updateAtmosphere(dt);
    if($('#screen-title').classList.contains('show')) updateTitleCam(dt);
    if(ENGINE.movementEnabled){ const wl = document.getElementById('world-label'); if(wl) wl.style.display = 'none'; }
  }
  // skinned characters keep breathing and talking under dialogue and menus
  if(ART.ready && typeof PEOPLE !== 'undefined') PEOPLE.updateAll(playing ? dt : dt*0.999);
  if(ENGINE.sceneUpdate && playing) ENGINE.sceneUpdate(dt);
  if(ENGINE.scanActive>0){ ENGINE.scanActive -= dt; if(ENGINE.scanActive<=0) $('#scan-fx').classList.remove('show'); }
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
function beginMission(id){
  if(!ART.ready && !ART.failed && ART.promise){
    toast('LOADING', 'Preparing the operation…', 1600);
    ART.promise.then(()=>beginMission(id));
    return;
  }
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
  m.userData._faceT = 1.4;
  const p = ENGINE.player.position;
  ENGINE.player.rotation.y = Math.atan2(m.position.x - p.x, m.position.z - p.z);
  ENGINE.playerYaw = ENGINE.player.rotation.y;
}
