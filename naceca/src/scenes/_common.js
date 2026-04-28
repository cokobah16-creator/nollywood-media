/* =========================================================================
   NACECA · scenes/_common.js
   Auto-extracted from game.js by split_modules.py
   Edit the modules; run build.py to rebuild naceca.html.
   ========================================================================= */
/* ===================== 10. SCENE BUILDERS ===================== */
function newScene(opts={}){
  clearMarkers();
  ENGINE.interactables = [];
  ENGINE.npcs = [];
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(opts.bg || '#0d1626');
  scene.fog = new THREE.Fog(opts.fog || opts.bg || '#0d1626', 18, 65);
  const cam = new THREE.PerspectiveCamera(55, window.innerWidth/window.innerHeight, 0.1, 200);
  ENGINE.scene = scene;
  ENGINE.camera = cam;
  return scene;
}

function addGround(scene, color='#1c2540', size=80){
  const geo = new THREE.PlaneGeometry(size,size,1,1);
  const mat = toonMat(color);
  const m = new THREE.Mesh(geo, mat);
  m.rotation.x = -Math.PI/2;
  m.receiveShadow = true;
  scene.add(m);
  return m;
}
function addTexturedGround(scene, texture, size=80, tint='#ffffff'){
  const mat = new THREE.MeshLambertMaterial({color: new THREE.Color(tint), map: texture});
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size,size,1,1), mat);
  m.rotation.x = -Math.PI/2;
  m.receiveShadow = true;
  scene.add(m);
  return m;
}

/* ---------- god rays (volumetric light shafts through windows) ---------- */
function addGodRay(scene, x,y,z, w,h,len, color='#ffd58a', opacity=0.18, rot=0){
  // a stretched plane with additive blending and gradient texture
  const c = document.createElement('canvas'); c.width=64; c.height=128;
  const cx = c.getContext('2d');
  const grad = cx.createLinearGradient(0,0,0,128);
  grad.addColorStop(0, 'rgba(255,255,255,0.7)');
  grad.addColorStop(0.4,'rgba(255,255,255,0.3)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  cx.fillStyle = grad; cx.fillRect(0,0,64,128);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.MeshBasicMaterial({
    map: tex, color: new THREE.Color(color),
    transparent: true, opacity, blending: THREE.AdditiveBlending,
    depthWrite: false, side: THREE.DoubleSide
  });
  const ray = new THREE.Mesh(new THREE.PlaneGeometry(w, len), mat);
  ray.position.set(x, y - len/2, z);
  ray.rotation.x = -Math.PI/8;
  ray.rotation.y = rot;
  ray.userData._godray = true;
  ray.userData._baseOp = opacity;
  ray.userData._phase = Math.random()*Math.PI*2;
  scene.add(ray);
  return ray;
}

/* ---------- dust motes (Points) ---------- */
function addDustMotes(scene, count=120, areaX=20, areaY=5, areaZ=20, color='#ffe8b0'){
  const pos = new Float32Array(count*3);
  for(let i=0;i<count;i++){
    pos[i*3]   = (Math.random()-0.5)*areaX;
    pos[i*3+1] = Math.random()*areaY;
    pos[i*3+2] = (Math.random()-0.5)*areaZ;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: new THREE.Color(color),
    size: 0.04, transparent: true, opacity: 0.55,
    blending: THREE.AdditiveBlending, depthWrite: false,
    sizeAttenuation: true
  });
  const points = new THREE.Points(geo, mat);
  points.userData._dust = true;
  scene.add(points);
  return points;
}

function addSun(scene, color='#fff5dc', intensity=1, dir=new THREE.Vector3(4,8,6)){
  const sun = new THREE.DirectionalLight(color, intensity);
  sun.position.copy(dir);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024,1024);
  sun.shadow.camera.left = -25;
  sun.shadow.camera.right = 25;
  sun.shadow.camera.top = 25;
  sun.shadow.camera.bottom = -25;
  scene.add(sun);
  return sun;
}

function addBox(scene, x,y,z, w,h,d, color, opts={}){
  const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), toonMat(color));
  m.position.set(x,y+h/2,z);
  m.castShadow = true; m.receiveShadow = true;
  if(opts.rotY) m.rotation.y = opts.rotY;
  scene.add(m);
  return m;
}

function addBuilding(scene, x,z, w,h,d, wallColor, roofColor, windowColor){
  const g = new THREE.Group();
  const walls = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), toonMat(wallColor));
  walls.position.y = h/2; walls.castShadow=true; walls.receiveShadow=true; g.add(walls);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(w*1.05,0.4,d*1.05), toonMat(roofColor));
  roof.position.y = h+0.2; roof.castShadow=true; g.add(roof);
  // windows — emissive yellow squares
  const winMat = basicMat(windowColor);
  for(let row=0; row<Math.max(1, Math.floor(h/2)); row++){
    for(let i=0; i<Math.floor(w/1.5); i++){
      const wm = new THREE.Mesh(new THREE.PlaneGeometry(0.8,0.6), winMat);
      wm.position.set(-w/2 + 0.9 + i*1.5, 1.2 + row*1.8, d/2+0.01);
      g.add(wm);
      const wb = wm.clone(); wb.position.z = -d/2-0.01; wb.rotation.y = Math.PI; g.add(wb);
    }
  }
  g.position.set(x,0,z);
  scene.add(g);
  return g;
}

