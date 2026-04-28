/* =========================================================================
   NACECA · systems/engine.js
   Auto-extracted from game.js by split_modules.py
   Edit the modules; run build.py to rebuild naceca.html.
   ========================================================================= */
/* ===================== 9. THREE.JS ENGINE ===================== */
const ENGINE = {
  renderer:null, scene:null, camera:null,
  player:null, playerYaw:0, playerPitch:0.25,
  cameraYaw:0, cameraDist:5.5,
  keys:{}, pointer:{dx:0,dy:0,locked:false},
  clock:null,
  interactables:[],   // {mesh, type, label, sub, onInteract, range}
  evidenceMarkers:[], // {worldPos, label, sub, id, collected, el}
  npcs:[],            // updateable npcs
  bounds:{minX:-30,maxX:30,minZ:-30,maxZ:30},
  movementEnabled:false,
  worldName:null,
  groundY:0,
  scanActive:0,       // ticks remaining
};

function initThree(){
  const canvas = $('#three-canvas');
  ENGINE.renderer = new THREE.WebGLRenderer({canvas, antialias:true, powerPreference:'high-performance'});
  ENGINE.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  ENGINE.renderer.setSize(window.innerWidth, window.innerHeight);
  ENGINE.renderer.shadowMap.enabled = true;
  ENGINE.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  ENGINE.renderer.outputEncoding = THREE.sRGBEncoding;
  ENGINE.clock = new THREE.Clock();
  initPost();
  window.addEventListener('resize', onResize);
}

/* ---------- post-processing: bloom + vignette + grain + chromatic aberration ---------- */
const POST = {};
function initPost(){
  const w = window.innerWidth, h = window.innerHeight;
  POST.rt = new THREE.WebGLRenderTarget(w, h, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat
  });
  POST.scene = new THREE.Scene();
  POST.cam = new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  POST.mat = new THREE.ShaderMaterial({
    uniforms: {
      tDiffuse:  { value: null },
      time:      { value: 0 },
      resolution:{ value: new THREE.Vector2(w,h) },
      bloomStr:  { value: 0.65 },
      vignette:  { value: 0.55 },
      grainStr:  { value: 0.04 },
      tint:      { value: new THREE.Vector3(1.02, 1.0, 0.97) }, // warm/teal grade
    },
    vertexShader:`
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
    `,
    fragmentShader:`
      precision highp float;
      uniform sampler2D tDiffuse;
      uniform float time;
      uniform vec2 resolution;
      uniform float bloomStr;
      uniform float vignette;
      uniform float grainStr;
      uniform vec3 tint;
      varying vec2 vUv;

      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }

      vec3 sampleBright(vec2 uv, vec2 off){
        vec3 s = texture2D(tDiffuse, uv + off).rgb;
        // luma-keyed bright pass
        float l = max(s.r, max(s.g, s.b));
        float k = smoothstep(0.6, 1.0, l);
        return s * k;
      }

      void main(){
        vec2 uv = vUv;
        vec2 px = 1.0 / resolution;

        // chromatic aberration — radial, edges only
        vec2 dir = uv - 0.5;
        float d = length(dir);
        vec2 ca = dir * d * 0.012;
        float r = texture2D(tDiffuse, uv - ca).r;
        float g = texture2D(tDiffuse, uv).g;
        float b = texture2D(tDiffuse, uv + ca).b;
        vec3 col = vec3(r,g,b);

        // 13-tap separable-ish bloom (cheap)
        vec3 bloom = vec3(0.0);
        bloom += sampleBright(uv, vec2(0.0, 0.0));
        bloom += sampleBright(uv, px*vec2( 4.0,  0.0));
        bloom += sampleBright(uv, px*vec2(-4.0,  0.0));
        bloom += sampleBright(uv, px*vec2( 0.0,  4.0));
        bloom += sampleBright(uv, px*vec2( 0.0, -4.0));
        bloom += sampleBright(uv, px*vec2( 8.0,  0.0)) * 0.6;
        bloom += sampleBright(uv, px*vec2(-8.0,  0.0)) * 0.6;
        bloom += sampleBright(uv, px*vec2( 0.0,  8.0)) * 0.6;
        bloom += sampleBright(uv, px*vec2( 0.0, -8.0)) * 0.6;
        bloom += sampleBright(uv, px*vec2( 6.0,  6.0)) * 0.7;
        bloom += sampleBright(uv, px*vec2(-6.0,  6.0)) * 0.7;
        bloom += sampleBright(uv, px*vec2( 6.0, -6.0)) * 0.7;
        bloom += sampleBright(uv, px*vec2(-6.0, -6.0)) * 0.7;
        bloom /= 9.0;
        col += bloom * bloomStr;

        // vignette
        float vig = smoothstep(0.85, 0.35, d);
        col *= mix(1.0 - vignette, 1.0, vig);

        // film grain
        float g1 = hash(uv * resolution + vec2(time*60.0, 0.0));
        col += (g1 - 0.5) * grainStr;

        // color grade — warm shadows, cool highlights, slight tint
        float lum = dot(col, vec3(0.299, 0.587, 0.114));
        col = mix(col * vec3(1.05, 0.95, 0.85), col * vec3(0.92, 0.98, 1.08), smoothstep(0.3, 0.85, lum));
        col *= tint;

        // soft contrast lift
        col = pow(col, vec3(0.95));
        col = (col - 0.5) * 1.08 + 0.5;

        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
  POST.quad = new THREE.Mesh(new THREE.PlaneGeometry(2,2), POST.mat);
  POST.scene.add(POST.quad);
}
function resizePost(){
  if(!POST.rt) return;
  POST.rt.setSize(window.innerWidth, window.innerHeight);
  POST.mat.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
}
function onResize(){
  if(!ENGINE.renderer) return;
  ENGINE.renderer.setSize(window.innerWidth, window.innerHeight);
  if(ENGINE.camera){
    ENGINE.camera.aspect = window.innerWidth/window.innerHeight;
    ENGINE.camera.updateProjectionMatrix();
  }
  resizePost();
  if($('#screen-evidence').classList.contains('show')) redrawEBLinks();
}

/* ---------- material factory: cel-shaded toon look ---------- */
function gradientTexture(){
  // 5-step gradient for crisp toon shading
  const c = document.createElement('canvas'); c.width=5; c.height=1;
  const ctx = c.getContext('2d');
  const stops = ['#1a1a1a','#3a3a3a','#7a7a7a','#c8c8c8','#ffffff'];
  for(let i=0;i<5;i++){ ctx.fillStyle=stops[i]; ctx.fillRect(i,0,1,1); }
  const t = new THREE.CanvasTexture(c);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  return t;
}
let _gradTex = null;
function toonMat(color, opts={}){
  if(!_gradTex) _gradTex = gradientTexture();
  return new THREE.MeshToonMaterial({
    color: new THREE.Color(color),
    gradientMap: _gradTex,
    ...opts
  });
}
function basicMat(color, opts={}){
  return new THREE.MeshBasicMaterial({color: new THREE.Color(color), ...opts});
}

/* ---------- INVERTED-HULL OUTLINE (cel-shaded silhouette) ---------- */
const OUTLINE_MAT = new THREE.MeshBasicMaterial({color:0x000000, side:THREE.BackSide});
function outline(mesh, scale=1.06){
  if(!mesh.geometry) return mesh;
  const o = new THREE.Mesh(mesh.geometry, OUTLINE_MAT);
  o.scale.set(scale, scale, scale);
  // attach as CHILD so animations propagate
  mesh.add(o);
  o.userData._outline = true;
  return o;
}
function addOutlinedBox(scene, x,y,z, w,h,d, color, opts={}){
  const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), toonMat(color));
  m.position.set(x,y+h/2,z);
  m.castShadow = true; m.receiveShadow = true;
  if(opts.rotY) m.rotation.y = opts.rotY;
  scene.add(m);
  if(opts.outline !== false) outline(m, 1.04);
  return m;
}

/* ---------- procedural canvas textures ---------- */
const _TEX_CACHE = {};
function marbleTexture(){
  if(_TEX_CACHE.marble) return _TEX_CACHE.marble;
  const c = document.createElement('canvas'); c.width=c.height=256;
  const x = c.getContext('2d');
  // base warm beige-grey
  const grad = x.createLinearGradient(0,0,256,256);
  grad.addColorStop(0,'#3a2f24'); grad.addColorStop(.5,'#4a3a2a'); grad.addColorStop(1,'#322820');
  x.fillStyle = grad; x.fillRect(0,0,256,256);
  // veining
  x.strokeStyle = 'rgba(255,240,210,0.18)'; x.lineWidth = 1.2;
  for(let i=0;i<14;i++){
    x.beginPath();
    let px = Math.random()*256, py = Math.random()*256;
    x.moveTo(px,py);
    for(let s=0;s<28;s++){ px += (Math.random()-.5)*22; py += (Math.random()-.5)*22; x.lineTo(px,py); }
    x.stroke();
  }
  // dark speckles
  for(let i=0;i<200;i++){
    x.fillStyle = `rgba(0,0,0,${Math.random()*.15})`;
    x.fillRect(Math.random()*256, Math.random()*256, 1.5, 1.5);
  }
  // bright highlights
  for(let i=0;i<60;i++){
    x.fillStyle = `rgba(255,230,190,${Math.random()*.18})`;
    x.fillRect(Math.random()*256, Math.random()*256, 2, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(8,8);
  _TEX_CACHE.marble = t; return t;
}
function asphaltTexture(){
  if(_TEX_CACHE.asphalt) return _TEX_CACHE.asphalt;
  const c = document.createElement('canvas'); c.width=c.height=128;
  const x = c.getContext('2d');
  x.fillStyle = '#1a1d22'; x.fillRect(0,0,128,128);
  for(let i=0;i<400;i++){
    const v = Math.random()*40;
    x.fillStyle = `rgba(${v},${v},${v+5},${Math.random()*.5})`;
    x.fillRect(Math.random()*128, Math.random()*128, 2, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(20,20);
  _TEX_CACHE.asphalt = t; return t;
}
function woodTexture(){
  if(_TEX_CACHE.wood) return _TEX_CACHE.wood;
  const c = document.createElement('canvas'); c.width=128; c.height=256;
  const x = c.getContext('2d');
  const grad = x.createLinearGradient(0,0,128,0);
  grad.addColorStop(0,'#3a2818'); grad.addColorStop(.5,'#4a3220'); grad.addColorStop(1,'#2a1c10');
  x.fillStyle = grad; x.fillRect(0,0,128,256);
  for(let i=0;i<10;i++){
    x.strokeStyle = `rgba(0,0,0,${Math.random()*.4})`; x.lineWidth = 0.8 + Math.random()*1.5;
    x.beginPath(); const lx = Math.random()*128;
    x.moveTo(lx,0);
    for(let y=0;y<256;y+=4){ x.lineTo(lx + (Math.random()-.5)*8, y); }
    x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2,2);
  _TEX_CACHE.wood = t; return t;
}
function clayWallTexture(){
  if(_TEX_CACHE.clay) return _TEX_CACHE.clay;
  const c = document.createElement('canvas'); c.width=c.height=256;
  const x = c.getContext('2d');
  x.fillStyle = '#6a5040'; x.fillRect(0,0,256,256);
  for(let i=0;i<800;i++){
    const v = 80 + Math.random()*60;
    x.fillStyle = `rgba(${v},${v*.78},${v*.6},${Math.random()*.4})`;
    x.fillRect(Math.random()*256, Math.random()*256, 1.5, 1.5);
  }
  // faint horizontal grout lines
  x.strokeStyle = 'rgba(0,0,0,.15)'; x.lineWidth = 1;
  for(let y=20;y<256;y+=64){ x.beginPath(); x.moveTo(0,y); x.lineTo(256,y); x.stroke(); }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3,2);
  _TEX_CACHE.clay = t; return t;
}

/* ---------- player character (improved with sidearm + outlines) ---------- */
function buildPlayerMesh(){
  const g = new THREE.Group();
  // torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55,0.75,0.32), toonMat('#0b1a3a'));
  torso.position.y = 1.05; torso.castShadow=true; g.add(torso); outline(torso, 1.06);
  // tactical vest plate
  const vest = new THREE.Mesh(new THREE.BoxGeometry(0.62,0.58,0.38), toonMat('#0a1428'));
  vest.position.y = 1.02; g.add(vest); outline(vest, 1.05);
  // shoulder pads (NACECA)
  for(const sx of [-1,1]){
    const sh = new THREE.Mesh(new THREE.BoxGeometry(0.22,0.18,0.34), toonMat('#0b1a3a'));
    sh.position.set(sx*0.32, 1.32, 0); g.add(sh); outline(sh, 1.06);
  }
  // gold NACECA patch (front)
  const patch = new THREE.Mesh(new THREE.PlaneGeometry(0.22,0.08), basicMat('#d8a64a'));
  patch.position.set(0.18, 1.18, 0.193); g.add(patch);
  // belt with mag pouches
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.6,0.1,0.36), toonMat('#1a1208'));
  belt.position.y = 0.72; g.add(belt); outline(belt, 1.04);
  for(let i=-1;i<=1;i++){
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.1,0.18,0.06), toonMat('#0a0a0a'));
    mag.position.set(i*0.14, 0.66, 0.2); g.add(mag);
  }
  // head — better proportions
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16,16,14), toonMat('#5a3826'));
  head.position.y = 1.62; head.castShadow=true; g.add(head); outline(head, 1.07);
  // close-cropped hair
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.165,16,10,0,Math.PI*2,0,Math.PI/2.4), toonMat('#0a0a14'));
  hair.position.y = 1.66; g.add(hair); outline(hair, 1.05);
  // eye dots (face front)
  for(const sx of [-1,1]){
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.012,6,6), basicMat('#0a0a14'));
    eye.position.set(sx*0.045, 1.62, 0.155); g.add(eye);
  }
  // arms — slightly tapered
  const armGeo = new THREE.BoxGeometry(0.16,0.5,0.16);
  const armMat = toonMat('#1a2a52');
  const armL = new THREE.Mesh(armGeo, armMat); armL.position.set(-0.36,1.08,0); armL.castShadow=true; g.add(armL); outline(armL,1.06);
  const armR = new THREE.Mesh(armGeo, armMat); armR.position.set( 0.36,1.08,0); armR.castShadow=true; g.add(armR); outline(armR,1.06);
  // forearm + hand on right (holding sidearm low-ready)
  const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.14,0.28,0.14), toonMat('#5a3826'));
  forearm.position.set(0.36,0.78,0.08); g.add(forearm); outline(forearm,1.06);
  // sidearm
  const gun = new THREE.Group();
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.06,0.16,0.04), toonMat('#0a0a0a'));
  grip.position.y = -0.05; gun.add(grip); outline(grip,1.08);
  const slide = new THREE.Mesh(new THREE.BoxGeometry(0.06,0.05,0.18), toonMat('#1a1a1a'));
  slide.position.set(0,0.05,0.04); gun.add(slide); outline(slide,1.08);
  gun.position.set(0.36,0.66,0.22);
  g.add(gun);
  // legs
  const legGeo = new THREE.BoxGeometry(0.21,0.65,0.21);
  const legMat = toonMat('#1c2030');
  const legL = new THREE.Mesh(legGeo, legMat); legL.position.set(-0.14,0.4,0); legL.castShadow=true; g.add(legL); outline(legL,1.05);
  const legR = new THREE.Mesh(legGeo, legMat); legR.position.set( 0.14,0.4,0); legR.castShadow=true; g.add(legR); outline(legR,1.05);
  // boots
  for(const sx of [-1,1]){
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.22,0.12,0.28), toonMat('#0a0a0a'));
    boot.position.set(sx*0.14, 0.06, 0.04); g.add(boot); outline(boot,1.04);
  }
  g.userData = { armL, armR, legL, legR, walkPhase:0 };
  return g;
}
function buildNPCMesh(skin, shirt, pants, hair){
  const g = new THREE.Group();
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55,0.75,0.32), toonMat(shirt));
  torso.position.y = 1.05; torso.castShadow=true; g.add(torso); outline(torso,1.05);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16,14,12), toonMat(skin));
  head.position.y = 1.62; head.castShadow=true; g.add(head); outline(head,1.07);
  const hairMesh = new THREE.Mesh(new THREE.SphereGeometry(0.165,14,10,0,Math.PI*2,0,Math.PI/2.4), toonMat(hair));
  hairMesh.position.y = 1.66; g.add(hairMesh); outline(hairMesh,1.05);
  for(const sx of [-1,1]){
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.011,6,6), basicMat('#0a0a14'));
    eye.position.set(sx*0.045, 1.62, 0.155); g.add(eye);
  }
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.2,0.6,0.2), toonMat(pants));
  legL.position.set(-0.14,0.4,0); legL.castShadow=true; g.add(legL); outline(legL,1.05);
  const legR = legL.clone(); legR.position.x = 0.14; g.add(legR); outline(legR,1.05);
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.16,0.55,0.16), toonMat(shirt));
  armL.position.set(-0.36,1.05,0); armL.castShadow=true; g.add(armL); outline(armL,1.06);
  const armR = armL.clone(); armR.position.x = 0.36; g.add(armR); outline(armR,1.06);
  g.userData = { armL, armR, legL, legR, walkPhase:0, baseY:0 };
  return g;
}

/* ---------- input ---------- */
function bindInput(){
  document.addEventListener('keydown', e=>{
    ENGINE.keys[e.code] = true;
    // Start-mission overlay: Enter or Space begins the mission
    if($('#screen-controls').classList.contains('show')){
      if(e.code==='Enter' || e.code==='Space' || e.code==='NumpadEnter'){
        e.preventDefault();
        if(S.game.currentMission) beginMission(S.game.currentMission);
        return;
      }
    }
    if(e.code==='Escape'){ togglePause(); }
    if(e.code==='KeyK' && ENGINE.movementEnabled){ openSkillTree(); }
    if(e.code==='Tab'  && ENGINE.movementEnabled){ e.preventDefault(); openCaseFile(); }
    if(e.code==='KeyF' && ENGINE.movementEnabled){ triggerScan(); }
    if(e.code==='KeyE' && ENGINE.movementEnabled){ tryInteract(); }
    if(e.code==='Space'){
      if($('#screen-dialogue').classList.contains('show') && !$('#dlg-continue').classList.contains('hide')){
        advanceDialogue();
      }
    }
  });
  document.addEventListener('keyup',   e=>{ ENGINE.keys[e.code] = false; });

  const canvas = $('#three-canvas');
  canvas.addEventListener('click', ()=>{
    if(ENGINE.movementEnabled && !ENGINE.pointer.locked && !isOverlayOpen()){
      canvas.requestPointerLock?.();
    }
  });
  document.addEventListener('pointerlockchange', ()=>{
    ENGINE.pointer.locked = (document.pointerLockElement === canvas);
  });
  document.addEventListener('mousemove', e=>{
    if(ENGINE.pointer.locked){
      ENGINE.cameraYaw   -= e.movementX * 0.0025;
      ENGINE.playerPitch  = clamp(ENGINE.playerPitch + e.movementY*0.002, -0.2, 0.6);
    }
  });

  // mobile
  if('ontouchstart' in window){
    document.body.classList.add('touch-active');
    bindTouchControls();
  }

  // action button bindings
  $$('.action-btn').forEach(b=>b.addEventListener('click', ()=>{
    const a = b.dataset.act;
    if(a==='scan')  triggerScan();
    if(a==='cuff')  toast('CUFFS', 'Approach a suspect to cuff', 1500);
    if(a==='order') toast('SQUAD ORDER', 'Squad: Hold position', 1500);
    if(a==='squad') toast('SQUAD STATUS', 'Sgt. Uche: ready · Officer Kemi: ready', 1800);
  }));
  $('#btn-skills').addEventListener('click', openSkillTree);
  $('#btn-casefile').addEventListener('click', openCaseFile);
  $('#btn-pause').addEventListener('click', togglePause);
}

function bindTouchControls(){
  const j = $('#joystick'); const k = $('#joystick-knob');
  let touchId=null, cx=0, cy=0;
  j.addEventListener('touchstart', e=>{
    const t = e.changedTouches[0]; touchId = t.identifier;
    const r = j.getBoundingClientRect(); cx = r.left + r.width/2; cy = r.top + r.height/2;
  });
  j.addEventListener('touchmove', e=>{
    for(const t of e.changedTouches){
      if(t.identifier===touchId){
        const dx = clamp(t.clientX-cx, -50, 50);
        const dy = clamp(t.clientY-cy, -50, 50);
        k.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
        ENGINE._touch = {x:dx/50, y:dy/50};
      }
    }
    e.preventDefault();
  }, {passive:false});
  j.addEventListener('touchend', ()=>{ touchId=null; ENGINE._touch=null; k.style.transform='translate(-50%,-50%)';});

  $$('.touch-btn').forEach(b=>{
    b.addEventListener('touchstart', e=>{
      const a = b.dataset.tact;
      if(a==='interact') tryInteract();
      if(a==='scan')     triggerScan();
      if(a==='sprint')   ENGINE.keys['ShiftLeft']=true;
      if(a==='crouch')   ENGINE.keys['KeyC']=true;
    });
    b.addEventListener('touchend', ()=>{
      const a = b.dataset.tact;
      if(a==='sprint') ENGINE.keys['ShiftLeft']=false;
      if(a==='crouch') ENGINE.keys['KeyC']=false;
    });
  });

  // camera drag on right side of screen
  let camTouchId=null, camLastX=0, camLastY=0;
  document.addEventListener('touchstart', e=>{
    for(const t of e.changedTouches){
      if(t.clientX > window.innerWidth/2 && camTouchId===null){
        const inJoy = j.contains(e.target) || $('.touch-btns').contains(e.target);
        if(!inJoy){ camTouchId=t.identifier; camLastX=t.clientX; camLastY=t.clientY; }
      }
    }
  });
  document.addEventListener('touchmove', e=>{
    for(const t of e.changedTouches){
      if(t.identifier===camTouchId){
        ENGINE.cameraYaw  -= (t.clientX-camLastX)*0.005;
        ENGINE.playerPitch = clamp(ENGINE.playerPitch + (t.clientY-camLastY)*0.004, -0.2, 0.6);
        camLastX = t.clientX; camLastY = t.clientY;
      }
    }
  });
  document.addEventListener('touchend', e=>{
    for(const t of e.changedTouches){ if(t.identifier===camTouchId) camTouchId=null; }
  });
}

function isOverlayOpen(){ return $$('.overlay.show').length>0; }

/* ---------- update loop ---------- */
function tick(){
  requestAnimationFrame(tick);
  if(!ENGINE.scene) return;
  const dt = ENGINE.clock.getDelta();
  if(ENGINE.movementEnabled && !isOverlayOpen()){
    updatePlayer(dt);
    updateCamera();
    updateInteractPrompt();
    updateMarkers();
    updateNPCs(dt);
    updateMinimap();
    updateAtmosphere(dt);
  } else {
    // keep atmospheric particles + title cam alive even when paused
    updateAtmosphere(dt);
    if($('#screen-title').classList.contains('show')) updateTitleCam(dt);
  }
  if(ENGINE.scanActive>0){ ENGINE.scanActive -= dt; if(ENGINE.scanActive<=0) $('#scan-fx').classList.remove('show'); }
  // render scene -> RT, then full-screen quad with post FX
  if(POST.rt){
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

/* ---------- atmosphere: dust motes + god ray flicker ---------- */
function updateAtmosphere(dt){
  if(!ENGINE.scene) return;
  // Mission-specific atmosphere triggers
  if(typeof updateAsabaTrigger === 'function') updateAsabaTrigger(dt);

  ENGINE.scene.traverse(obj=>{
    if(obj.userData && obj.userData._dust){
      obj.userData._t = (obj.userData._t||0) + dt;
      const positions = obj.geometry.attributes.position;
      const arr = positions.array;
      for(let i=0;i<arr.length;i+=3){
        arr[i+1] += Math.sin(obj.userData._t + i*0.13) * dt * 0.08;
        arr[i]   += Math.cos(obj.userData._t*0.7 + i*0.21) * dt * 0.05;
        // wrap if drifted too far
        if(arr[i+1] > 6) arr[i+1] = 0.5;
      }
      positions.needsUpdate = true;
    }
    if(obj.userData && obj.userData._godray){
      const k = 0.85 + Math.sin(performance.now()*0.0008 + obj.userData._phase)*0.15;
      obj.material.opacity = obj.userData._baseOp * k;
    }
    if(obj.userData && obj.userData._smoke){
      // gentle sway + sine pulse, always face camera. Sway around the smoke's own base x.
      const t = performance.now()*0.001;
      if(obj.userData._baseX === undefined){ obj.userData._baseX = obj.position.x; obj.userData._baseOp = obj.material.opacity; }
      obj.material.opacity = obj.userData._baseOp * (0.85 + Math.sin(t*1.2)*0.15);
      obj.position.x = obj.userData._baseX + Math.sin(t*0.4)*0.3;
      if(ENGINE.camera) obj.lookAt(ENGINE.camera.position);
    }
  });

  // Police-light pulse for M3 mansion — alternating red/blue strobes
  if(ENGINE._policeRed && ENGINE._policeBlue){
    const t = performance.now() * 0.005;
    // Two-beat strobe: red flashes on the even beats, blue on the odd beats
    const redPulse  = Math.max(0, Math.sin(t*1.7)) ** 6;
    const bluePulse = Math.max(0, Math.sin(t*1.7 + Math.PI*0.7)) ** 6;
    ENGINE._policeRed.intensity  = redPulse * 2.4;
    ENGINE._policeBlue.intensity = bluePulse * 2.4;
    // and sync the visible bulbs (toggle their material brightness via traversing)
    ENGINE.scene.traverse(o=>{
      if(o.userData && o.userData._policeBulbRed){
        const c = 0.4 + redPulse * 0.6;
        if(o.material && o.material.color) o.material.color.setRGB(c, c*0.15, c*0.2);
      }
      if(o.userData && o.userData._policeBulbBlue){
        const c = 0.4 + bluePulse * 0.6;
        if(o.material && o.material.color) o.material.color.setRGB(c*0.2, c*0.45, c);
      }
    });
  }
}

function updatePlayer(dt){
  if(!ENGINE.player) return;
  const speed = (ENGINE.keys['ShiftLeft']||ENGINE.keys['ShiftRight']) ? 5.2 : 3.0;
  let mx=0, mz=0;
  if(ENGINE.keys['KeyW']||ENGINE.keys['ArrowUp']) mz -= 1;
  if(ENGINE.keys['KeyS']||ENGINE.keys['ArrowDown']) mz += 1;
  if(ENGINE.keys['KeyA']||ENGINE.keys['ArrowLeft']) mx -= 1;
  if(ENGINE.keys['KeyD']||ENGINE.keys['ArrowRight']) mx += 1;
  if(ENGINE._touch){ mx += ENGINE._touch.x; mz += ENGINE._touch.y; }
  const len = Math.hypot(mx,mz);
  if(len>0){
    mx/=Math.max(len,1); mz/=Math.max(len,1);
    // rotate by camera yaw
    const cy = ENGINE.cameraYaw;
    const wx = mx*Math.cos(cy) - mz*Math.sin(cy);
    const wz = mx*Math.sin(cy) + mz*Math.cos(cy);
    const nx = ENGINE.player.position.x + wx*speed*dt;
    const nz = ENGINE.player.position.z + wz*speed*dt;
    // bounds + obstacle check
    if(nx>ENGINE.bounds.minX && nx<ENGINE.bounds.maxX) ENGINE.player.position.x = nx;
    if(nz>ENGINE.bounds.minZ && nz<ENGINE.bounds.maxZ) ENGINE.player.position.z = nz;
    // face movement
    ENGINE.playerYaw = Math.atan2(wx, wz);
    ENGINE.player.rotation.y = ENGINE.playerYaw;
    // walk animation + footstep audio
    const u = ENGINE.player.userData;
    const prevPhase = u.walkPhase;
    u.walkPhase += dt*8 * (speed/3);
    const swing = Math.sin(u.walkPhase)*0.5;
    u.armL.rotation.x =  swing;
    u.armR.rotation.x = -swing;
    u.legL.rotation.x = -swing*0.8;
    u.legR.rotation.x =  swing*0.8;
    // step on zero-crossing of swing
    if(Math.sign(Math.sin(prevPhase)) !== Math.sign(Math.sin(u.walkPhase))){
      sfxFootstep();
    }
  } else {
    const u = ENGINE.player.userData;
    u.armL.rotation.x *= 0.85; u.armR.rotation.x *= 0.85;
    u.legL.rotation.x *= 0.85; u.legR.rotation.x *= 0.85;
  }
  // crouch
  const wantCrouch = !!ENGINE.keys['KeyC'];
  ENGINE.player.scale.y = THREE.MathUtils.lerp(ENGINE.player.scale.y, wantCrouch?0.7:1.0, dt*8);
}

function updateCamera(){
  if(!ENGINE.player||!ENGINE.camera) return;
  const p = ENGINE.player.position;
  const dist = ENGINE.cameraDist;
  const py = ENGINE.playerPitch;
  const cx = p.x - Math.sin(ENGINE.cameraYaw)*Math.cos(py)*dist;
  const cz = p.z - Math.cos(ENGINE.cameraYaw)*Math.cos(py)*dist;
  const cy = p.y + 1.6 + Math.sin(py)*dist;
  ENGINE.camera.position.set(cx, cy, cz);
  ENGINE.camera.lookAt(p.x, p.y+1.4, p.z);
}

function updateInteractPrompt(){
  const near = nearestInteractable();
  if(near){
    let promptHtml = `<span class="opt"><span class="key">E</span> ${near.label}</span>`;
    if(near.altLabel) promptHtml += ` <span class="opt"><span class="key">F</span> ${near.altLabel}</span>`;
    showPrompt(promptHtml);
  } else {
    showPrompt(null);
  }
}
function nearestInteractable(){
  if(!ENGINE.player) return null;
  let best=null, bd=Infinity;
  for(const it of ENGINE.interactables){
    if(it.consumed) continue;
    const dx = it.mesh.position.x - ENGINE.player.position.x;
    const dz = it.mesh.position.z - ENGINE.player.position.z;
    const d  = Math.hypot(dx,dz);
    if(d < (it.range||2.5) && d<bd){ best = it; bd = d; }
  }
  return best;
}
function tryInteract(){
  const it = nearestInteractable();
  if(it && it.onInteract){ it.onInteract(it); }
}
function triggerScan(){
  $('#scan-fx').classList.add('show');
  ENGINE.scanActive = 1.8;
  sfxScan();
  // amplify all evidence markers + briefly highlight any NPC interactables
  $$('.evidence-marker .pip').forEach(p=>{
    p.style.transform='scale(1.6)';
    p.style.filter = 'drop-shadow(0 0 14px rgba(216,166,74,0.9))';
    setTimeout(()=>{ p.style.transform=''; p.style.filter=''; }, 1600);
  });
  // pulse the screen edges (extra vignette flash)
  document.body.style.transition = 'box-shadow 0.2s ease-out';
  document.body.style.boxShadow = 'inset 0 0 200px 0 rgba(216,166,74,0.4)';
  setTimeout(()=>{ document.body.style.boxShadow = ''; }, 1600);
}

function updateNPCs(dt){
  for(const n of ENGINE.npcs){ if(n.update) n.update(dt); }
}

function updateMarkers(){
  if(!ENGINE.camera) return;
  const layer = $('#markers-layer');
  // ensure each marker has a DOM element
  for(const m of ENGINE.evidenceMarkers){
    if(!m.el){
      const el = document.createElement('div');
      el.className = 'evidence-marker';
      el.innerHTML = `<div class="pip">⊙</div><div class="lbl">${m.label}<span class="sub">${m.sub||''}</span></div>`;
      layer.appendChild(el);
      m.el = el;
    }
    if(m.collected) m.el.classList.add('collected');
    const v = m.worldPos.clone().project(ENGINE.camera);
    if(v.z>1 || v.z<-1){ m.el.style.display='none'; continue; }
    // distance fade
    const d = m.worldPos.distanceTo(ENGINE.player.position);
    if(d>14){ m.el.style.display='none'; continue; }
    m.el.style.display='flex';
    const x = (v.x*0.5+0.5)*window.innerWidth;
    const y = (-v.y*0.5+0.5)*window.innerHeight;
    m.el.style.left = x+'px';
    m.el.style.top  = y+'px';
    m.el.style.opacity = clamp(1.2 - d/14, 0.3, 1);
  }
}

function clearMarkers(){
  $('#markers-layer').innerHTML='';
  ENGINE.evidenceMarkers = [];
}
function addEvidenceMarker(worldPos, label, sub, id){
  ENGINE.evidenceMarkers.push({worldPos, label, sub, id, collected:false, el:null});
}

/* ---------- minimap ---------- */
const MINIMAP = { pois:[], scale:6 };
function updateMinimap(){
  if(!ENGINE.player) return;
  const arrow = $('#minimap-arrow');
  // arrow shows player heading
  arrow.setAttribute('transform', `rotate(${ -ENGINE.playerYaw*180/Math.PI } 0 0)`);
  // render pois relative to player (player at center)
  const g = $('#minimap-pois');
  g.innerHTML = MINIMAP.pois.map(p=>{
    const dx = (p.x - ENGINE.player.position.x) / MINIMAP.scale;
    const dz = (p.z - ENGINE.player.position.z) / MINIMAP.scale;
    const r = Math.hypot(dx,dz);
    if(r>45) return '';
    const col = p.color || '#ff5050';
    return `<circle cx="${dx}" cy="${dz}" r="${p.r||1.6}" fill="${col}" opacity="0.9"/>`;
  }).join('');
}
function setMinimap(streetsSvg, pois){
  $('#minimap-streets').innerHTML = streetsSvg;
  MINIMAP.pois = pois;
}

