/* =========================================================================
   NACECA · systems/boot.js
   Auto-extracted from game.js by split_modules.py
   Edit the modules; run build.py to rebuild naceca.html.
   ========================================================================= */
/* ===================== 23. BOOT ===================== */
/* ---------- cinematic title backdrop scene ---------- */
function buildTitleScene(){
  const scene = newScene({bg:'#06080f', fog:'#08101e'});
  scene.fog.near = 18; scene.fog.far = 80;

  scene.add(new THREE.AmbientLight('#3a4878', 0.5));
  const sun = addSun(scene, '#ff8050', 0.7, new THREE.Vector3(-8, 4, 6));
  // warm rim from the city
  const rim = new THREE.PointLight('#ff6a30', 1.2, 50);
  rim.position.set(0, 4, -25); scene.add(rim);

  // stylized Lagos skyline silhouette — rows of buildings at varying heights
  const city = new THREE.Group();
  for(let i=0;i<24;i++){
    const x = -28 + i*2.4 + (Math.random()-.5)*0.6;
    const h = 4 + Math.random()*9;
    const w = 1.6 + Math.random()*0.8;
    const d = 1.6 + Math.random()*0.8;
    const z = -16 - Math.random()*4;
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), toonMat('#0a1428'));
    b.position.set(x, h/2, z); b.castShadow=true; city.add(b); outline(b,1.04);
    // window grid — emissive
    const cnv = document.createElement('canvas'); cnv.width=32; cnv.height=64;
    const cx = cnv.getContext('2d');
    cx.fillStyle = '#0a1428'; cx.fillRect(0,0,32,64);
    for(let r=0;r<10;r++) for(let c=0;c<4;c++){
      cx.fillStyle = Math.random()<0.55 ? `rgba(${220+Math.random()*30},${170+Math.random()*40},${90+Math.random()*40},${0.6+Math.random()*0.4})` : 'rgba(0,0,0,0)';
      cx.fillRect(2 + c*7, 4 + r*5.5, 4, 2.5);
    }
    const tex = new THREE.CanvasTexture(cnv);
    const winFront = new THREE.Mesh(new THREE.PlaneGeometry(w*0.92, h*0.92), new THREE.MeshBasicMaterial({map:tex, transparent:true}));
    winFront.position.set(x, h/2, z + d/2 + 0.01); city.add(winFront);
  }
  // a closer mid-ground building (Third Mainland Bridge feel)
  for(let i=0;i<8;i++){
    const x = -10 + i*3 + (Math.random()-.5)*0.4;
    const h = 6 + Math.random()*4;
    const b = new THREE.Mesh(new THREE.BoxGeometry(2, h, 2), toonMat('#0a0e1a'));
    b.position.set(x, h/2, -8 - Math.random()*2); city.add(b); outline(b,1.04);
  }
  scene.add(city);

  // ground (faint reflection)
  addTexturedGround(scene, asphaltTexture(), 80, '#1a1d22');

  // moonlight god ray over the skyline
  addGodRay(scene, -2, 14, -16, 6, 0, 16, '#a8c0ff', 0.18, 0.1);
  addGodRay(scene, 6, 12, -14, 4, 0, 14, '#ffb070', 0.14, -0.05);

  // dust/embers
  addDustMotes(scene, 200, 60, 12, 30, '#ffd58a');

  // floating NACECA shield — uses the rendered badge image if available
  const shield = new THREE.Group();
  if(typeof ASSETS !== 'undefined' && ASSETS.title && ASSETS.title.naceca_badge){
    // Textured plane with the rendered badge
    const tex = new THREE.TextureLoader().load(ASSETS.title.naceca_badge);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    const badgePlane = new THREE.Mesh(
      new THREE.PlaneGeometry(4.4, 5.5),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
    );
    shield.add(badgePlane);
    // bigger, softer halo glow behind the badge
    const glow = new THREE.Mesh(new THREE.CircleGeometry(4.4, 32), new THREE.MeshBasicMaterial({
      color: 0xf0c878, transparent:true, opacity:0.35, blending:THREE.AdditiveBlending, depthWrite:false
    }));
    glow.position.z = -0.2; shield.add(glow);
    // a second outer ember halo
    const halo2 = new THREE.Mesh(new THREE.CircleGeometry(6.5, 32), new THREE.MeshBasicMaterial({
      color: 0xff8050, transparent:true, opacity:0.12, blending:THREE.AdditiveBlending, depthWrite:false
    }));
    halo2.position.z = -0.4; shield.add(halo2);
  } else {
    // Fallback — procedural hex shield (original)
    const sh1 = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.6, 0.3, 6), toonMat('#0b1426'));
    sh1.rotation.z = Math.PI/2; sh1.rotation.x = Math.PI/2; shield.add(sh1); outline(sh1,1.05);
    const sh2 = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.3, 0.32, 6), toonMat('#d8a64a'));
    sh2.rotation.z = Math.PI/2; sh2.rotation.x = Math.PI/2; sh2.position.z = 0.05; shield.add(sh2);
    const glow = new THREE.Mesh(new THREE.CircleGeometry(3.0, 24), new THREE.MeshBasicMaterial({
      color: 0xd8a64a, transparent:true, opacity:0.25, blending:THREE.AdditiveBlending, depthWrite:false
    }));
    glow.position.z = -0.5; shield.add(glow);
  }
  shield.position.set(0, 6, -3);
  shield.userData._title = true;
  scene.add(shield);

  // camera position — slow cinematic slow-pan
  ENGINE.camera.position.set(-3, 5, 10);
  ENGINE.camera.lookAt(0, 5, -5);
  ENGINE._titleCam = { t:0, baseY:5 };
}
function updateTitleCam(dt){
  if(!ENGINE._titleCam || !ENGINE.scene) return;
  ENGINE._titleCam.t += dt;
  const t = ENGINE._titleCam.t;
  // slow drift
  ENGINE.camera.position.x = Math.sin(t*0.08) * 4;
  ENGINE.camera.position.y = 5 + Math.sin(t*0.05) * 0.6;
  ENGINE.camera.position.z = 10 + Math.cos(t*0.07) * 1.5;
  ENGINE.camera.lookAt(0, 5, -5);
  // rotate the shield
  ENGINE.scene.traverse(obj=>{
    if(obj.userData && obj.userData._title){
      obj.rotation.y = Math.sin(t*0.4) * 0.25;
      obj.position.y = 6 + Math.sin(t*0.6) * 0.2;
    }
  });
}

window.addEventListener('load', ()=>{
  initThree();
  bindInput();
  bindMenuButtons();
  // build the cinematic title backdrop scene
  buildTitleScene();
  showOverlay('screen-title');
  $('#btn-continue').disabled = !hasSave();
  // start title ambient pad after first user interaction
  document.addEventListener('pointerdown', ()=>{ initAudio(); startAmbient('title'); musicForScene('title'); }, {once:true});
  tick();
});
