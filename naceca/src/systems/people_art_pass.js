/* =========================================================================
   NACECA · systems/people.js
   Skinned, animated characters built on Quaternius' Universal Base Character
   and Universal Animation Library (both CC0). One shared body + skeleton,
   per-character outfits painted at load time from a region mask and two
   detail maps, plus gear meshes (plate carrier, cap, puffs/skirt).
   ========================================================================= */
const PEOPLE = {
  ready:false, failed:false, gltf:null, clips:{}, tex:{}, outfits:{}, _imgs:{}, _promise:null,
  REG:['skin','hair','beard','torso','armA','armB','armC','hips','thigh','shin','shoe','eye'],
};
/* outfit palettes (sRGB). null = use the skin colour (bare). */
const OUTFITS = {
  kelechi:{ skin:'#4a2b1c', hair:'#0e0c0b', beard:null, torso:'#1d2b4c', armA:'#1d2b4c', armB:'#1d2b4c', armC:'#1d2b4c',
            hips:'#17213a', thigh:'#17213a', shin:'#17213a', shoe:'#111111', gear:'Gear_Tactical', vest:'#16181c', text:'NACECA', name:'KELECHI' },
  uche:   { skin:'#3f2418', hair:'#0c0a09', beard:'#120d0b', torso:'#1d2b4c', armA:'#1d2b4c', armB:'#1d2b4c', armC:'#1d2b4c',
            hips:'#17213a', thigh:'#17213a', shin:'#17213a', shoe:'#111111', gear:'Gear_Tactical', vest:'#16181c', text:'NACECA', name:'UCHE', scale:1.03 },
  obi:    { skin:'#5a3524', hair:'#141110', beard:'#1a1310', torso:'#b4532a', armA:'#b4532a', armB:'#b4532a', armC:'#b4532a',
            hips:'#b4532a', thigh:'#b4532a', shin:'#a54c27', shoe:'#3a2418', gear:['Gear_Fila','Gear_Kaftan'], cap:'#d8a64a', robe:'#b4532a', scale:1.04 },
  child:  { skin:'#5c3726', hair:'#0e0b0a', beard:null, torso:'#e8c547', armA:'#e8c547', armB:null, armC:null,
            hips:'#e8c547', thigh:'#e8c547', shin:null, shoe:null, gear:'Gear_Child', skirt:'#e8c547', puffs:'#0e0b0a', child:true },
};
function _b64ToBuf(b64){ const s = atob(b64); const u = new Uint8Array(s.length); for(let i=0;i<s.length;i++) u[i]=s.charCodeAt(i); return u.buffer; }
function _loadImg(src){ return new Promise((res,rej)=>{ const im = new Image(); im.onload=()=>res(im); im.onerror=()=>rej(new Error('image decode failed')); im.src=src; }); }
function _pixels(img){ const c=document.createElement('canvas'); c.width=img.width; c.height=img.height; const x=c.getContext('2d'); x.drawImage(img,0,0); return x.getImageData(0,0,img.width,img.height).data; }
function _hex(h){ const n=parseInt(h.slice(1),16); return [(n>>16)&255,(n>>8)&255,n&255]; }

/* loads from ART_INLINE (base64 GLB + animation binary + data-URI textures) */
PEOPLE.load = function(src){
  if(PEOPLE._promise) return PEOPLE._promise;
  src = src || { glb:ART_INLINE.people_glb, anims:ART_INLINE.people_anims, animsMeta:ART_INLINE.people_meta, regions:ART_INLINE.tex_regions,
                 cloth:ART_INLINE.tex_cloth, skin:ART_INLINE.tex_skin, eye:ART_INLINE.tex_eye, meta:ART_INLINE.people_tex_meta };
  PEOPLE._promise = (async ()=>{
    const glbBuf = _b64ToBuf(src.glb), animBuf = _b64ToBuf(src.anims);
    if(typeof MeshoptDecoder !== 'undefined' && MeshoptDecoder.ready) await MeshoptDecoder.ready;
    const loader = new THREE.GLTFLoader();
    if(typeof MeshoptDecoder !== 'undefined') loader.setMeshoptDecoder(MeshoptDecoder);
    PEOPLE.gltf = await new Promise((res,rej)=>loader.parse(glbBuf, '', res, rej));
    PEOPLE._buildClips(animBuf, src.animsMeta);
    const [reg, cloth, skin, eye] = await Promise.all([src.regions, src.cloth, src.skin, src.eye].map(_loadImg));
    PEOPLE._imgs = { reg:_pixels(reg), cloth:_pixels(cloth), skin:_pixels(skin), eye, R:reg.width };
    PEOPLE.meta = src.meta;
    // the female body shares the skeleton layout: same clips, corrected for her rest pose
    if(ART_INLINE.people_f_glb){
      try{
        PEOPLE.gltfF = await new Promise((res,rej)=>loader.parse(_b64ToBuf(ART_INLINE.people_f_glb), '', res, rej));
        const [rF, cF, sF] = await Promise.all([ART_INLINE.tex_regions_f, ART_INLINE.tex_cloth_f, ART_INLINE.tex_skin_f].map(_loadImg));
        PEOPLE._imgsF = { reg:_pixels(rF), cloth:_pixels(cF), skin:_pixels(sF), eye, R:rF.width };
        PEOPLE.metaF = ART_INLINE.people_f_meta;
        PEOPLE.clipsF = PEOPLE._retarget(PEOPLE.gltf.scene, PEOPLE.gltfF.scene);
      }catch(e){ console.warn('[NACECA] female body unavailable', e); PEOPLE.gltfF = null; }
    }
    PEOPLE.lodGeo = PEOPLE._makeLod(PEOPLE.gltf, ART_INLINE.people_lod_m);
    if(PEOPLE.gltfF) PEOPLE.lodGeoF = PEOPLE._makeLod(PEOPLE.gltfF, ART_INLINE.people_lod_f);
    PEOPLE.ready = true;
    return PEOPLE;
  })().catch(e=>{ PEOPLE.failed = true; console.warn('PEOPLE load failed', e); throw e; });
  return PEOPLE._promise;
};

/* distance LOD: a simplified index buffer over the body's own vertices (built offline), swapped in for far NPCs */
PEOPLE._makeLod = function(gltf, b64){
  if(!b64 || !gltf) return null;
  let body = null; gltf.scene.traverse(n=>{ if(n.isMesh && n.name === 'Body') body = n; });
  if(!body) return null;
  const g = new THREE.BufferGeometry();
  for(const k in body.geometry.attributes) g.setAttribute(k, body.geometry.attributes[k]);
  g.setIndex(new THREE.BufferAttribute(new Uint16Array(_b64ToBuf(b64)), 1));
  if(!body.geometry.boundingSphere) body.geometry.computeBoundingSphere();
  g.boundingSphere = body.geometry.boundingSphere;
  return g;
};
/* clips are local bone rotations (rest x pose). For another body on the same
   skeleton layout: q' = restB * inverse(restA) * q, pelvis height scaled. */
PEOPLE._retarget = function(sceneA, sceneB){
  const rest = sc=>{ const m = {}; sc.traverse(o=>{ if(o.isBone) m[o.name] = { q:o.quaternion.clone(), p:o.position.clone() }; }); return m; };
  const A = rest(sceneA), B = rest(sceneB), out = {};
  const ph = (A.pelvis && B.pelvis) ? B.pelvis.p.length() / Math.max(1e-6, A.pelvis.p.length()) : 1;
  const C = {}; for(const n in A){ if(B[n]) C[n] = B[n].q.clone().multiply(A[n].q.clone().invert()); }
  const q = new THREE.Quaternion();
  for(const name in PEOPLE.clips){
    const tracks = PEOPLE.clips[name].tracks.map(t=>{
      const bone = t.name.split('.')[0], v = t.values.slice();
      if(t.name.endsWith('.quaternion') && C[bone]){ for(let i=0;i<v.length;i+=4){ q.set(v[i],v[i+1],v[i+2],v[i+3]).premultiply(C[bone]); v[i]=q.x; v[i+1]=q.y; v[i+2]=q.z; v[i+3]=q.w; } }
      else if(t.name.endsWith('.position')){ for(let i=0;i<v.length;i++) v[i] *= ph; }
      return new t.constructor(t.name, t.times, v);
    });
    out[name] = new THREE.AnimationClip(name, PEOPLE.clips[name].duration, tracks);
  }
  return out;
};
PEOPLE._buildClips = function(buf, meta){
  const i16 = new Int16Array(buf); let p = 0;
  for(const c of meta.clips){
    const tracks = []; const n = c.keys; const times = new Float32Array(n);
    for(let k=0;k<n;k++) times[k] = Math.min(c.dur, k / c.fps);
    meta.bones.forEach((bn, bi)=>{
      const isConst = c.const[bi]; const cnt = isConst ? 1 : n;
      const v = new Float32Array(cnt*4);
      for(let k=0;k<cnt*4;k++) v[k] = i16[p++] / 32767;
      if(isConst){ tracks.push(new THREE.QuaternionKeyframeTrack(bn+'.quaternion', [0, c.dur], [...v, ...v])); }
      else tracks.push(new THREE.QuaternionKeyframeTrack(bn+'.quaternion', times, v));
    });
    if(c.pel !== null){
      const cnt = c.pel ? 1 : n; const v = new Float32Array(cnt*3);
      for(let k=0;k<cnt*3;k++) v[k] = i16[p++] / 10000;
      if(c.pel) tracks.push(new THREE.VectorKeyframeTrack('pelvis.position', [0, c.dur], [...v, ...v]));
      else tracks.push(new THREE.VectorKeyframeTrack('pelvis.position', times, v));
    }
    PEOPLE.clips[c.name] = new THREE.AnimationClip(c.name, c.dur, tracks);
  }
};

/* paint a body texture for one outfit */
PEOPLE._bodyTexture = function(o){
  const female = o.body === 'F' && PEOPLE._imgsF;
  const key = 'body:' + JSON.stringify([o.body, o.skin, o.hair, o.beard, o.torso, o.armA, o.armB, o.armC, o.hips, o.thigh, o.shin, o.shoe, o.res]);
  if(PEOPLE.tex[key]) return PEOPLE.tex[key];
  const I = female ? PEOPLE._imgsF : PEOPLE._imgs, SR = I.R, R = Math.min(SR, o.res || SR), st = SR / R, N = R*R;
  const cv = document.createElement('canvas'); cv.width = cv.height = R;
  const ctx = cv.getContext('2d'); const out = ctx.createImageData(R, R); const d = out.data;
  const pal = [], skinish = [];
  PEOPLE.REG.forEach((k,i)=>{
    let c = o[k]; let bare = (k==='skin');
    if(c === null || c === undefined){ c = o.skin; bare = true; }
    pal[i] = _hex(c); skinish[i] = bare ? 1 : 0;
  });
  const reg = I.reg, cl = I.cloth, sk = I.skin;
  for(let y=0;y<R;y++){ const sy = Math.floor(y*st)*SR;
    for(let x=0;x<R;x++){
      const j = (y*R + x)*4, si = (sy + Math.floor(x*st))*4;
      let r = Math.round(reg[si]/20); if(r > 11) r = 11;
      const det = (skinish[r] ? sk[si] : cl[si]) / 127.5;
      const c = pal[r];
      d[j]   = Math.min(255, c[0]*det); d[j+1] = Math.min(255, c[1]*det); d[j+2] = Math.min(255, c[2]*det); d[j+3] = 255;
    } }
  ctx.putImageData(out, 0, 0);
  const m = female ? PEOPLE.metaF : PEOPLE.meta; if(m && m.eye){ const k = R/SR; ctx.drawImage(I.eye, m.eye[0]*k, m.eye[1]*k, m.eye[2]*k, m.eye[2]*k); }
  const t = new THREE.CanvasTexture(cv); t.flipY = false; t.encoding = THREE.sRGBEncoding;
  t.anisotropy = 4;
  return (PEOPLE.tex[key] = t);
};

/* gear atlas: top half = vest unwrap (u: angle+90°, v: height), bottom half = swatches 8x4 of 128px */
PEOPLE._gearTexture = function(o){
  const gears = Array.isArray(o.gear) ? o.gear : (o.gear ? [o.gear] : []);
  const vest = gears.includes('Gear_Tactical');
  const key = 'gear:' + [gears.join(','),o.vest,o.text,o.cap,o.skirt,o.torso,o.trim,o.robe,o.beret,o.gele,o.wrapper,o.afro,o.braids,o.mask,o.hair].join('|');
  if(PEOPLE.tex[key]) return PEOPLE.tex[key];
  const RR = vest ? 1024 : 256, R = 1024, cv = document.createElement('canvas'); cv.width = cv.height = RR;
  const x = cv.getContext('2d'); if(RR !== R) x.scale(RR/R, RR/R);
  const vz = z => (1 - (0.5 + 0.5*(z-1.04)/0.46)) * R;      // vest height -> canvas y (flipY=false: v=0 at top row)
  // NOTE: glTF uv v is flipped vs Blender; Blender v=0.5+0.5*t maps to canvas y = (1-v)*R
  const nylon = o.vest || '#16181c';
  x.fillStyle = nylon; x.fillRect(0, 0, R, R/2);
  // cordura noise
  const img = x.getImageData(0,0,R,R/2), dd = img.data;
  for(let i=0;i<dd.length;i+=4){ const n = (Math.random()-0.5)*10; dd[i]+=n; dd[i+1]+=n; dd[i+2]+=n; }
  x.putImageData(img,0,0);
  // MOLLE webbing rows front (u .07-.43) and back (u .57-.93)
  for(const [u0,u1] of [[0.07,0.43],[0.57,0.93]]){
    for(let z=1.075; z<1.27; z+=0.026){
      const y = vz(z); x.fillStyle = 'rgba(0,0,0,0.55)'; x.fillRect(u0*R, y-5, (u1-u0)*R, 10);
      x.fillStyle = 'rgba(255,255,255,0.05)'; x.fillRect(u0*R, y-5, (u1-u0)*R, 2);
      x.fillStyle = 'rgba(0,0,0,0.35)'; for(let u=u0; u<u1; u+=0.025) x.fillRect(u*R, y-5, 2, 10);
    }
  }
  // stitched panel borders
  x.strokeStyle = 'rgba(255,255,255,0.07)'; x.setLineDash([6,5]); x.lineWidth = 2;
  x.strokeRect(0.045*R, vz(1.44), 0.41*R, vz(1.06)-vz(1.44));
  x.strokeRect(0.545*R, vz(1.475), 0.41*R, vz(1.06)-vz(1.475)); x.setLineDash([]);
  if(o.text){
    x.fillStyle = '#d8a64a'; x.textAlign = 'center'; x.textBaseline = 'middle';
    const fit = (txt, px, maxW)=>{ let s = px; do { x.font = `700 ${s}px Oswald, "Arial Narrow", Impact, sans-serif`; s -= 2; } while(x.measureText(txt).width > maxW && s > 10); };
    fit(o.text, 96, 0.25*R); x.fillText(o.text, 0.75*R, vz(1.39));
    fit(o.text, 42, 0.13*R); x.fillText(o.text, 0.25*R, vz(1.335));
    x.fillStyle = 'rgba(216,166,74,0.9)'; x.fillRect(0.66*R, vz(1.345), 0.18*R, 3);
  }
  // swatches
  const sw = (i, fill, fn)=>{ const c=i%8, r=(i/8)|0, x0=c*128, y0=R/2 + r*128; x.fillStyle=fill; x.fillRect(x0,y0,128,128); if(fn) fn(x0,y0); };
  const noise = (x0,y0,a)=>{ for(let k=0;k<500;k++){ x.fillStyle=`rgba(${Math.random()<.5?0:255},${Math.random()<.5?0:255},${Math.random()<.5?0:255},${a})`; x.fillRect(x0+Math.random()*128,y0+Math.random()*128,2,2);} };
  sw(0, nylon, (a,b)=>noise(a,b,0.04));                      // nylon
  sw(1, '#1c1e22', (a,b)=>noise(a,b,0.04));                  // flap
  sw(2, '#141210', (a,b)=>noise(a,b,0.03));                  // leather
  sw(3, '#0a0a0a');                                          // sole
  sw(4, '#8d9096');                                          // metal
  sw(5, '#d8a64a');                                          // gold
  sw(6, o.torso || '#1d2b4c', (a,b)=>noise(a,b,0.03));       // collar = shirt
  sw(7, '#101010');                                          // polymer
  sw(8, '#2a2c30');                                          // radio
  sw(9, o.cap || '#d8a64a', (a,b)=>{ x.strokeStyle='rgba(120,70,10,0.5)'; x.lineWidth=3; for(let k=0;k<6;k++){ x.beginPath(); x.moveTo(a, b+10+k*20); x.lineTo(a+128, b+18+k*20); x.stroke(); } });
  sw(10, o.skirt || '#e8c547', (a,b)=>noise(a,b,0.05));
  sw(11, o.puffs || '#0e0b0a', (a,b)=>noise(a,b,0.12));
  sw(12, '#1a1c20', (a,b)=>{ x.fillStyle='rgba(0,0,0,.5)'; for(let k=0;k<128;k+=12) x.fillRect(a,b+k,128,4); });   // strap webbing
  sw(13, '#2a2a2a');
  sw(14, o.robe || o.torso || '#b4532a', (a,b)=>noise(a,b,0.05));                         // kaftan body
  sw(15, o.robe || o.torso || '#b4532a', (a,b)=>{ x.fillStyle = o.trim || '#d8a64a'; x.fillRect(a, b+40, 128, 48); });   // kaftan hem
  sw(16, o.beret || '#1a1a1a', (a,b)=>noise(a,b,0.05));                                  // beret felt
  sw(17, o.gele || '#d8a64a', (a,b)=>{ x.strokeStyle='rgba(255,255,255,0.18)'; x.lineWidth=4; for(let k=-128;k<128;k+=14){ x.beginPath(); x.moveTo(a+k,b); x.lineTo(a+k+128,b+128); x.stroke(); } noise(a,b,0.05); });   // gele (stiff, ribbed)
  sw(18, o.wrapper || '#c84a3a', (a,b)=>{ x.fillStyle = 'rgba(0,0,0,0.28)'; for(let k=0;k<4;k++) for(let m=0;m<4;m++){ x.beginPath(); x.arc(a+16+k*32,b+16+m*32,9,0,7); x.fill(); }
      x.fillStyle = o.trim || 'rgba(255,220,140,0.55)'; for(let k=0;k<4;k++) for(let m=0;m<4;m++){ x.beginPath(); x.arc(a+16+k*32,b+16+m*32,4,0,7); x.fill(); } noise(a,b,0.05); });   // wax print wrapper
  sw(19, '#0c0c0c');                                                                      // glasses frame
  sw(20, o.mask || '#141414', (a,b)=>noise(a,b,0.08));                                    // knitted balaclava
  sw(21, o.braids || o.hair || '#0e0b0a', (a,b)=>{ x.strokeStyle='rgba(255,255,255,0.08)'; x.lineWidth=3; for(let k=0;k<128;k+=8){ x.beginPath(); x.moveTo(a+k,b); x.lineTo(a+k,b+128); x.stroke(); } });   // braids
  sw(22, o.afro || o.hair || '#0e0b0a', (a,b)=>noise(a,b,0.12));                          // afro / bun
  sw(23, o.wrapper || '#c84a3a', (a,b)=>{ x.fillStyle = o.trim || '#d8a64a'; x.fillRect(a, b+44, 128, 40); });  // wrapper hem
  const t = new THREE.CanvasTexture(cv); t.flipY = false; t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
  return (PEOPLE.tex[key] = t);
};

/* one material per texture, shared by everyone wearing that outfit */
PEOPLE._mats = new Map();
PEOPLE._mat = function(tex, rough){
  let m = PEOPLE._mats.get(tex);
  if(!m){ m = new THREE.MeshStandardMaterial({ map: tex, roughness: rough, metalness: 0, skinning: true }); PEOPLE._mats.set(tex, m); }
  PEOPLE._applyLook(m);
  return m;
};
/* The mansion renders with a proper sRGB pipeline, and so does any scene drawn
   straight to the screen. The older scenes' post-processing path skips the sRGB
   step (their toon palette was picked for that), so there the textures are read
   the same way — otherwise the navy uniform sinks to black next to the toon world. */
PEOPLE._srgb = true;
PEOPLE._applyLook = function(m){
  const enc = PEOPLE._srgb ? THREE.sRGBEncoding : THREE.LinearEncoding;
  if(m.map && m.map.encoding !== enc){ m.map.encoding = enc; m.map.needsUpdate = true; m.needsUpdate = true; }
};
PEOPLE.syncLook = function(){
  const want = (ENGINE._look && ENGINE._look !== 'default') || !!ENGINE._postOff || !(typeof POST !== 'undefined' && POST.rt);
  if(want === PEOPLE._srgb) return;
  PEOPLE._srgb = want; PEOPLE._mats.forEach(m=>PEOPLE._applyLook(m));
};
PEOPLE.setLook = function(){ PEOPLE.syncLook(); };

/* clone a skinned hierarchy (SkeletonUtils.clone, trimmed) */
PEOPLE._clone = function(source){
  const sourceLookup = new Map(), cloneLookup = new Map();
  const clone = source.clone();
  (function parallel(a, b, cb){ cb(a, b); for(let i=0;i<a.children.length;i++) parallel(a.children[i], b.children[i], cb); })(source, clone, (s, c)=>{ sourceLookup.set(c, s); cloneLookup.set(s, c); });
  clone.traverse(node=>{
    if(!node.isSkinnedMesh) return;
    const sm = sourceLookup.get(node), sb = sm.skeleton.bones;
    node.skeleton = sm.skeleton.clone();
    node.bindMatrix.copy(sm.bindMatrix);
    node.skeleton.bones = sb.map(b=>cloneLookup.get(b));
    node.bind(node.skeleton, node.bindMatrix);
  });
  return clone;
};

/* build a character. returns a THREE.Group positioned at the feet, facing +Z */
const NPC_BASE = { skin:'#5a3826', hair:'#0a0a0a', beard:null, torso:'#6a6a6a', armA:'#6a6a6a', armB:'#6a6a6a', armC:null, hips:'#2a2a2a', thigh:'#2a2a2a', shin:'#2a2a2a', shoe:'#16120e', gear:[] };
PEOPLE.evict = function(){
  // called between scenes: crowd textures (and their materials) are released from the GPU too
  for(const k of Object.keys(PEOPLE.tex)){ const t = PEOPLE.tex[k]; if(t && t._hero) continue; delete PEOPLE.tex[k];
    if(PEOPLE._mats.has(t)){ const m = PEOPLE._mats.get(t); PEOPLE._mats.delete(t); if(m && m.dispose) m.dispose(); }
    if(t && t.dispose) t.dispose(); }
};
PEOPLE.make = function(kind, extra){
  const o = Object.assign({}, OUTFITS[kind] || (kind === 'npc' ? NPC_BASE : OUTFITS.kelechi), extra || {});
  const female = o.body === 'F' && PEOPLE.gltfF;
  const gears = Array.isArray(o.gear) ? o.gear : (o.gear ? [o.gear] : []);
  const root = new THREE.Group(); root.name = 'char_' + kind;
  const model = PEOPLE._clone((female ? PEOPLE.gltfF : PEOPLE.gltf).scene);
  model.position.y = 0.012;                       // boots sit on the floor
  root.add(model);
  const bodyTex = PEOPLE._bodyTexture(o), gearTex = PEOPLE._gearTexture(o);
  if(OUTFITS[kind]){ bodyTex._hero = true; gearTex._hero = true; }
  const bodyMat = PEOPLE._mat(bodyTex, 0.78);
  const gearMat = PEOPLE._mat(gearTex, 0.72);
  model.traverse(n=>{
    if(!n.isMesh) return;
    n.castShadow = true; n.receiveShadow = false; n.frustumCulled = false;
    const nm = (n.name || '') + ' ' + (n.parent ? n.parent.name : '');
    if(/Gear_/.test(nm)){ n.visible = gears.includes(n.name) || !!(n.parent && gears.includes(n.parent.name)); n.material = gearMat; }
    else n.material = bodyMat;
  });
  if(o.child){
    model.scale.setScalar(0.66);
    const head = model.getObjectByName('Head'); if(head) head.scale.setScalar(1.28);
    const neck = model.getObjectByName('neck_01'); if(neck) neck.scale.setScalar(0.92);
  } else if(o.scale) model.scale.setScalar(o.scale);
  const mixer = new THREE.AnimationMixer(model);
  const ctl = { mixer, actions:{}, cur:null, curName:null, once:null };
  const clips = female ? PEOPLE.clipsF : PEOPLE.clips;
  for(const name in clips) ctl.actions[name] = mixer.clipAction(clips[name]);
  ctl.play = function(name, opt){
    opt = opt || {}; const a = ctl.actions[name]; if(!a) return;
    const fade = opt.fade !== undefined ? opt.fade : 0.25;
    if(ctl.curName === name && !opt.restart){ a.timeScale = opt.speed || 1; return; }
    a.reset(); a.enabled = true; a.setEffectiveWeight(1); a.timeScale = opt.speed || 1;
    a.setLoop(opt.once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity); a.clampWhenFinished = !!opt.once;
    if(ctl.cur && ctl.cur !== a) a.crossFadeFrom(ctl.cur, fade, false);
    a.play(); ctl.cur = a; ctl.curName = name;
  };
  /* play a one-shot, then return to `then` (default idle) */
  ctl.oneShot = function(name, then, opt){
    ctl.play(name, Object.assign({ once:true, restart:true, fade:0.2 }, opt||{}));
    const a = ctl.actions[name]; const back = then || 'idle';
    const onDone = e=>{ if(e.action === a){ mixer.removeEventListener('finished', onDone); ctl.play(back, { fade:0.3 }); if(opt && opt.done) opt.done(); } };
    mixer.addEventListener('finished', onDone);
  };
  ctl.update = dt=>mixer.update(dt);
  root.userData = { _skinned:true, _people:kind, anim:ctl, model, outfit:o, walkPhase:0 };
  const lodGeo = female ? PEOPLE.lodGeoF : PEOPLE.lodGeo;
  if(lodGeo && !OUTFITS[kind]){ let body = null; model.traverse(n=>{ if(n.isMesh && n.name === 'Body') body = n; }); if(body) root.userData.lod = { mesh:body, full:body.geometry, low:lodGeo, on:false }; }
  ctl.play('idle', { fade:0 });
  // soft contact shadow under the feet (cheap grounding on every graphics level)
  const blob = new THREE.Mesh(PEOPLE._blobGeo(), PEOPLE._blobMat());
  blob.rotation.x = -Math.PI/2; blob.position.y = 0.012; blob.scale.setScalar(o.child ? 0.65 : 1); blob.renderOrder = 1;
  root.add(blob); root.userData.blob = blob;
  return root;
};
PEOPLE._blobGeo = function(){ return PEOPLE.__bg || (PEOPLE.__bg = new THREE.PlaneGeometry(0.95, 0.95)); };
PEOPLE._blobMat = function(){
  if(PEOPLE.__bm) return PEOPLE.__bm;
  const [c,x] = (()=>{ const c=document.createElement('canvas'); c.width=c.height=64; return [c,c.getContext('2d')]; })();
  const g = x.createRadialGradient(32,32,2,32,32,31); g.addColorStop(0,'rgba(0,0,0,0.55)'); g.addColorStop(0.55,'rgba(0,0,0,0.25)'); g.addColorStop(1,'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0,0,64,64);
  return (PEOPLE.__bm = new THREE.MeshBasicMaterial({ map:new THREE.CanvasTexture(c), transparent:true, depthWrite:false, toneMapped:false }));
};
/* every skinned character in the scene advances its mixer once per frame */
PEOPLE.updateAll = function(dt){
  PEOPLE.syncLook();
  if(typeof PROXY !== 'undefined') PROXY.update(dt);
  const list = [];
  if(typeof PROXY !== 'undefined') for(const g of PROXY.list) if(g.parent && g.userData.anim) list.push(g);
  if(ENGINE.player && ENGINE.player.userData && ENGINE.player.userData._skinned) list.push(ENGINE.player);
  for(const n of (ENGINE.npcs||[])){ const o = (n && n.isObject3D) ? n : (n && n.mesh); if(o && o.userData && o.userData._skinned && list.indexOf(o) < 0) list.push(o); }
  for(const o of (ENGINE.extraSkinned||[])) if(list.indexOf(o) < 0) list.push(o);
  for(const o of list){ if(o.visible !== false) o.userData.anim.update(dt); }
  // far NPCs draw the simplified body
  const cam = ENGINE.camera; if(!cam) return;
  const far = PEOPLE.lodDist || ((typeof currentGfx === 'function' && currentGfx() === 'low') ? 4.5 : 6.5);
  const v = PEOPLE.__lv || (PEOPLE.__lv = new THREE.Vector3());
  for(const o of list){
    const c = (o.userData._char) || o, L = c.userData && c.userData.lod; if(!L) continue;
    v.setFromMatrixPosition(o.matrixWorld);
    const want = v.distanceTo(cam.position) > (L.on ? far - 0.8 : far);
    if(want !== L.on){ L.on = want; L.mesh.geometry = want ? L.low : L.full; }
  }
};


/* =========================================================================
   NACECA · systems/people_proxy.js  (v9)
   Every mission builds its cast through buildHumanoid(). When the character
   art is loaded, that call now returns a light "proxy": the same rig API the
   mission code poses (armL, legL, neck, spine…) with a skinned, animated
   person inside. Each frame the proxy reads what the mission asked for —
   walking, running, hands up, knocked down, slumped, phone to the ear,
   looking back — and plays the matching animation.
   ========================================================================= */
const PROXY = { list:[] };
PROXY.enabled = function(){ return typeof ART !== 'undefined' && ART.ready && typeof PEOPLE !== 'undefined' && PEOPLE.ready; };
PROXY.clear = function(){ PROXY.list = []; };
/* legacy appearance arguments -> PEOPLE outfit */
PROXY.outfit = function(skin, shirt, pants, hair, opts){
  opts = opts || {};
  const f = !!opts.female, hs = opts.hair || (f ? 'bun' : 'crop');
  const o = { body: f ? 'F' : 'M', skin, hair: hair || '#0a0a0a', beard: null, torso: shirt, armA: shirt, armB: shirt, armC: opts.longSleeve ? shirt : null,
              hips: pants, thigh: pants, shin: pants, shoe: opts.shoe || '#16120e', gear: [], res: 512 };
  if(opts.beard) o.beard = opts.beardColor || hair || '#0a0a0a';
  if(hs === 'bald') o.hair = null;
  if(hs === 'cap'){ o.gear.push('Gear_Fila'); o.cap = opts.capColor || '#d8a64a'; }
  if(hs === 'beret'){ o.gear.push(f ? 'Gear_F_Beret' : 'Gear_Beret'); o.beret = opts.capColor || '#1a1a1a'; if(f) o.gear.push('Gear_F_Bun'); }
  if(hs === 'mask'){ o.gear.push('Gear_Mask'); o.mask = opts.capColor || '#141414'; o.hair = o.mask; o.beard = null; }
  if(hs === 'gele'){ o.gear.push('Gear_F_Gele'); o.gele = opts.capColor || '#d8a64a'; }
  if(hs === 'afro'){ o.gear.push(f ? 'Gear_F_Afro' : 'Gear_Afro'); o.afro = hair || '#0a0a0a'; }
  if(hs === 'braids'){ o.gear.push('Gear_F_Braids'); o.braids = hair || '#0a0a0a'; }
  if(hs === 'bun' && f) o.gear.push('Gear_F_Bun');
  if(opts.robe){
    if(f){ o.gear.push('Gear_F_Wrapper'); o.wrapper = opts.robe; o.trim = opts.robeTrim || null; o.hips = opts.robe; o.thigh = opts.robe; o.shin = opts.robe; }
    else { o.gear.push('Gear_Kaftan'); o.robe = opts.robe; o.trim = opts.robeTrim || opts.robe; }
  }
  if(opts.glasses) o.gear.push('Gear_Glasses');
  if(opts.build === 'heavy') o.heavy = true;
  return o;
};
/* build the proxy rig: empty pivots in the legacy layout + the skinned person */
PROXY.build = function(skin, shirt, pants, hair, opts){
  opts = opts || {};
  const g = new THREE.Group();
  const P = (parent, x,y,z)=>{ const o = new THREE.Object3D(); o.position.set(x,y,z); parent.add(o); return o; };
  const legL = P(g, 0.11,0.92,0), legR = P(g,-0.11,0.92,0), kneeL = P(legL,0,-0.44,0), kneeR = P(legR,0,-0.44,0);
  const spine = P(g,0,1.0,0), neck = P(g,0,1.55,0);
  const armL = P(g,0.25,1.43,0), armR = P(g,-0.25,1.43,0), elbowL = P(armL,0,-0.29,0), elbowR = P(armR,0,-0.29,0), handR = P(elbowR,0,-0.285,0);
  g.userData = { _rig:true, _proxy:true, armL, armR, legL, legR, elbowL, elbowR, kneeL, kneeR, handR, spine, neck, eyes:[], walkPhase:0, baseY:0,
                 _seed:Math.random()*100, _last:null, _blink:3, _args:[skin, shirt, pants, hair, opts] };
  PROXY.dress(g, PROXY.outfit(skin, shirt, pants, hair, opts));
  if(opts.scale) g.scale.setScalar(opts.scale);
  g.userData._baseScale = opts.scale || 1;
  PROXY.list.push(g);
  return g;
};
PROXY.dress = function(g, outfit, kind){
  const u = g.userData;
  if(u._char){ g.remove(u._char); }
  const ch = PEOPLE.make(kind || 'npc', kind ? null : outfit);
  g.add(ch); u._char = ch; u.anim = ch.userData.anim; u._skinned = true; u._clip = 'idle';
  if(outfit && outfit.heavy) ch.userData.model.scale.set(1.12, 1, 1.1);
  ch.userData.anim.update(Math.random()*2);
  return ch;
};
/* the legacy plate carrier marks the squad sergeant: give him the NACECA kit */
PROXY.vest = function(g){ if(g.userData && g.userData._proxy){ PROXY.dress(g, null, 'uche'); return true; } return false; };
/* map what the mission asked of the rig to an animation */
PROXY.update = function(dt){
  if(!PROXY.list.length) return;
  const talkTo = (typeof isOverlayOpen === 'function' && isOverlayOpen()) ? ENGINE._talkTarget : null;
  for(const g of PROXY.list){
    const u = g.userData, ch = u._char; if(!ch) continue;
    if(!g.visible || !g.parent){ u._lastP = null; continue; }
    const p = g.position;
    let v = 0;
    if(u._lastP){ v = Math.hypot(p.x - u._lastP.x, p.z - u._lastP.z) / Math.max(dt, 1e-3); u._lastP.set(p.x, p.y, p.z); } else u._lastP = p.clone();
    u._vs = THREE.MathUtils.lerp(u._vs || 0, v, Math.min(1, dt*8));
    const base = u._baseScale || 1, ratio = g.scale.y / Math.max(0.01, g.scale.x);
    const down = !!u._down || Math.abs(g.rotation.x) > 0.25;
    let clip = 'idle', speed = 1, once = false;
    if(down){ clip = 'down'; once = true; }
    else if(u._wasDown){ clip = 'getup'; once = true; }
    else if(ratio < 0.97){ clip = ratio < 0.86 ? (ratio < 0.7 ? 'kneel' : 'crouch') : 'kneel'; }
    else if(u.armL.rotation.x < -1.6 && u.armR.rotation.x < -1.6) clip = 'handsup';
    else if(u.armR.rotation.x < -1.8) clip = 'phone';
    else if(u._vs > 3.9){ clip = 'sprint'; speed = THREE.MathUtils.clamp(u._vs/5.3, 0.7, 1.5); }
    else if(u._vs > 1.9){ clip = 'jog'; speed = THREE.MathUtils.clamp(u._vs/3.1, 0.7, 1.5); }
    else if(u._vs > 0.22){ clip = 'walk'; speed = THREE.MathUtils.clamp(u._vs/1.35, 0.6, 1.6); }
    else if(talkTo && (talkTo === g)) clip = 'talk';
    else clip = u._idle || 'idle';
    // counter the legacy pose tricks so the skinned body isn't squashed or tipped twice
    ch.rotation.x = down ? -g.rotation.x : 0;
    ch.scale.set(1, ratio < 0.97 ? 1/ratio : 1, 1);
    // looking back over the shoulder (tail missions): turn the whole body round
    const look = Math.abs(u.neck.rotation.y) > 1.2 ? u.neck.rotation.y : 0;
    ch.rotation.y += (look - ch.rotation.y) * Math.min(1, dt*6);
    if(u._getupT != null){ u._getupT -= dt; if(u._getupT <= 0){ u._getupT = null; u._wasDown = false; } }
    if(down) u._wasDown = true;
    if(clip === 'getup' && u._clip !== 'getup') u._getupT = (PEOPLE.clips.getup ? PEOPLE.clips.getup.duration : 1.2);
    if(!PEOPLE.clips[clip]) clip = clip === 'down' ? 'kneel' : (clip === 'getup' ? 'idle' : (PEOPLE.clips[clip] ? clip : 'idle'));
    if(clip !== u._clip){ u._clip = clip; u.anim.play(clip, { fade:0.25, speed, once, restart:once }); }
    else if(!once) u.anim.play(clip, { speed });
  }
};
/* hide anything legacy code bolts onto a proxy's pivots (old gun / vest meshes) */
PROXY.scrub = function(g){ g.traverse(o=>{ if(o.isMesh && !(o.parent && o.parent.isBone) && !PROXY._inChar(o, g)) o.visible = false; }); };
PROXY._inChar = function(o, g){ for(let p=o; p && p!==g; p=p.parent){ if(p === g.userData._char) return true; } return false; };
/* the mission builders call these; with the art loaded they get proxies */
function buildHumanoid(skin, shirt, pants, hairColor, opts){
  opts = opts || {};
  if(PROXY.enabled()) return PROXY.build(skin, shirt, pants, hairColor, opts);
  return buildHumanoidLegacy(skin, shirt, pants, hairColor, opts);
}
function addVest(g, color){ if(PROXY.vest(g)) return null; return addVestLegacy(g, color || '#0b1a3a'); }


/* =========================================================================
   NACECA · systems/art_pass.js  (v8 art pass)
   Skinned player + NPCs, third-person camera, contextual mobile controls,
   world-anchored prompts and staged interactions. Originals that this file
   replaces were renamed *Legacy so they stay available as fallbacks.
   ========================================================================= */
const ART = { ready:false, failed:false, promise:null };
function startArtLoad(){
  if(ART.promise) return ART.promise;
  if(typeof THREE === 'undefined' || !THREE.GLTFLoader || typeof ART_INLINE === 'undefined'){ ART.failed = true; return (ART.promise = Promise.resolve(false)); }
  ART.promise = Promise.all([PEOPLE.load(), MANSION.load()])
    .then(()=>{ ART.ready = true; return true; })
    .catch(e=>{ console.warn('[NACECA] art pass assets failed, using legacy rigs', e); ART.failed = true; return false; });
  return ART.promise;
}
/* renderer look per scene: the mansion is lit by a baked lightmap and wants
   filmic tone mapping + sRGB output; older scenes keep their original look. */
function sceneLook(kind){
  const r = ENGINE.renderer; if(!r) return;
  const film = kind !== 'default';
  r.toneMapping = film ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping;
  r.toneMappingExposure = film ? 1.12 : 1.0;
  if(POST.rt) POST.rt.texture.encoding = film ? THREE.sRGBEncoding : THREE.LinearEncoding;
  if(POST.mat){ POST.mat.uniforms.bloomStr.value = film ? 0.42 : 0.65; POST.mat.uniforms.grainStr.value = film ? 0.022 : 0.04; POST.mat.uniforms.vignette.value = film ? 0.5 : 0.55; }
  ENGINE._look = kind;
  if(typeof PEOPLE !== 'undefined' && PEOPLE.syncLook) PEOPLE.syncLook();
}

/* ---------------- player ---------------- */
function buildPlayerMesh(){
  if(ART.ready){ const k = PEOPLE.make('kelechi'); k.userData.isPlayer = true; return k; }
  return buildPlayerMeshLegacy();
}
const MOVE = { walk:1.55, jog:3.0, sprint:5.2, sneak:1.25, turn:11 };
function updatePlayer(dt){
  if(!ENGINE.player) return;
  const P = ENGINE.player, u = P.userData;
  if(!u._skinned) return updatePlayerLegacy(dt);
  const seq = ENGINE.seq;
  if(seq){ updateSequence(dt); return; }
  // input
  let mx=0, mz=0;
  if(ENGINE.keys['KeyW']||ENGINE.keys['ArrowUp']) mz -= 1;
  if(ENGINE.keys['KeyS']||ENGINE.keys['ArrowDown']) mz += 1;
  if(ENGINE.keys['KeyA']||ENGINE.keys['ArrowLeft']) mx -= 1;
  if(ENGINE.keys['KeyD']||ENGINE.keys['ArrowRight']) mx += 1;
  let analog = 1;
  if(ENGINE._touch){ mx += ENGINE._touch.x; mz += ENGINE._touch.y; analog = Math.min(1, Math.hypot(ENGINE._touch.x, ENGINE._touch.y)); }
  const mag = Math.min(1, Math.hypot(mx, mz));
  const crouch = !!ENGINE.keys['KeyC'];
  const sprint = !!(ENGINE.keys['ShiftLeft'] || ENGINE.keys['ShiftRight']);
  let speed = 0, clip = crouch ? 'crouch' : 'idle';
  if(mag > 0.08){
    const len = Math.hypot(mx, mz); mx /= len; mz /= len;
    // stick/keys are camera-relative: up = where the camera looks, right = screen-right
    const cy = ENGINE.cameraYaw;
    const wx = -mz*Math.sin(cy) - mx*Math.cos(cy);
    const wz = -mz*Math.cos(cy) + mx*Math.sin(cy);
    if(crouch){ speed = MOVE.sneak; clip = 'sneak'; }
    else if(sprint){ speed = MOVE.sprint; clip = 'sprint'; }
    else if(ENGINE._touch && analog < 0.62){ speed = MOVE.walk; clip = 'walk'; }
    else { speed = MOVE.jog; clip = 'jog'; }
    // touch: walk/jog follow the stick; a sprint is a full sprint once the stick is past half-way
    const touchK = !ENGINE._touch ? 1 : clip === 'sprint' ? Math.min(1, Math.max(0.55, analog / 0.5)) : Math.max(0.55, analog);
    speed *= (ENGINE.speedMul || 1) * touchK;
    const nx = P.position.x + wx*speed*dt, nz = P.position.z + wz*speed*dt;
    const b = ENGINE.bounds;
    if(!blockedAt(nx, P.position.z) && nx>b.minX && nx<b.maxX) P.position.x = nx;
    if(!blockedAt(P.position.x, nz) && nz>b.minZ && nz<b.maxZ) P.position.z = nz;
    // turn smoothly toward travel direction
    const want = Math.atan2(wx, wz);
    let d = want - P.rotation.y; while(d > Math.PI) d -= Math.PI*2; while(d < -Math.PI) d += Math.PI*2;
    P.rotation.y += Math.max(-MOVE.turn*dt, Math.min(MOVE.turn*dt, d));
    ENGINE.playerYaw = P.rotation.y;
    // footsteps by distance travelled
    u.walkPhase = (u.walkPhase||0) + speed*dt;
    const stride = clip==='sprint' ? 1.15 : clip==='jog' ? 0.95 : clip==='sneak' ? 0.6 : 0.72;
    if(u.walkPhase > stride){ u.walkPhase -= stride; if(typeof sfxFootstep==='function') sfxFootstep(); }
  }
  const ts = { walk: speed/1.35, jog: speed/3.1, sprint: speed/5.3, sneak: speed/1.15 }[clip] || 1;
  u.anim.play(clip, { fade: 0.22, speed: Math.max(0.6, Math.min(1.6, ts)) });
  u._speed = speed;
}
/* staged interactions: walk to a spot, face the object, play a clip, fire the
   payoff at the contact frame, frame it with the camera, then hand back control */
function playInteraction(o){
  const P = ENGINE.player; if(!P || !P.userData._skinned){ if(o.onHit) o.onHit(); if(o.done) o.done(); return; }
  ENGINE.seq = { o, t:0, phase:'move', from:P.position.clone(), fromYaw:P.rotation.y, hit:false };
  if(o.cam) TPCAM.override = { pos:new THREE.Vector3(...o.cam.pos), look:new THREE.Vector3(...o.cam.look) };
  else if(o.target && o.spot){
    // frame it over Kelechi's right shoulder, looking at the object
    const sx = o.spot[0], sz = o.spot[1], tx = o.target[0], ty = o.target[1], tz = o.target[2];
    let dx = tx - sx, dz = tz - sz; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
    const rx = -dz, rz = dx;                       // right of the facing direction
    const back = o.camBack || 1.45, side = o.camSide === undefined ? 0.62 : o.camSide, up = o.camUp || 1.62;
    TPCAM.override = { pos:new THREE.Vector3(sx - dx*back + rx*side, up, sz - dz*back + rz*side), look:new THREE.Vector3(tx + rx*0.05, ty + 0.05, tz + rz*0.05) };
  }
  showPrompt(null);
}
/* in-range interactables: highest priority first, then nearest */
function nearestInteractable(){
  if(!ENGINE.player) return null;
  let best = null, bp = -1e9, bd = Infinity;
  for(const it of ENGINE.interactables){
    if(it.consumed || !it.mesh || !it.mesh.position) continue;
    if(it.mesh.visible === false && !it.allowHidden) continue;
    const d = Math.hypot(it.mesh.position.x - ENGINE.player.position.x, it.mesh.position.z - ENGINE.player.position.z);
    if(d >= (it.range || 2.5)) continue;
    const pr = typeof it.priority === 'function' ? it.priority() : (it.priority || 0);
    if(pr > bp || (pr === bp && d < bd)){ best = it; bp = pr; bd = d; }
  }
  return best;
}
function updateSequence(dt){
  const s = ENGINE.seq, o = s.o, P = ENGINE.player, a = P.userData.anim;
  s.t += dt;
  if(s.phase === 'move'){
    const T = o.moveTime || 0.4, k = Math.min(1, s.t / T), e = k*k*(3-2*k);
    if(o.spot){ P.position.x = s.from.x + (o.spot[0]-s.from.x)*e; P.position.z = s.from.z + (o.spot[1]-s.from.z)*e; }
    if(o.face !== undefined){ let d = o.face - s.fromYaw; while(d > Math.PI) d -= Math.PI*2; while(d < -Math.PI) d += Math.PI*2; P.rotation.y = s.fromYaw + d*e; ENGINE.playerYaw = P.rotation.y; }
    a.play(k < 1 && o.spot ? 'walk' : 'idle', { fade:0.15 });
    if(k >= 1){ s.phase = 'act'; s.t = 0; if(o.clip) a.play(o.clip, { once:true, restart:true, fade:0.18, speed:o.speed||1 }); }
    return;
  }
  if(!s.hit && s.t >= (o.hitAt || 0.6)){ s.hit = true; try{ o.onHit && o.onHit(); }catch(e){ console.error(e); } }
  if(s.t >= (o.dur || 1.4)){
    ENGINE.seq = null; TPCAM.override = null; a.play('idle', { fade:0.3 });
    try{ o.done && o.done(); }catch(e){ console.error(e); }
  }
}
