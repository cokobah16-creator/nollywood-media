/* =========================================================================
   NACECA · scenes/shrine.js
   Auto-extracted from game.js by split_modules.py
   Edit the modules; run build.py to rebuild naceca.html.
   ========================================================================= */
/* ===================== 13c. SCENE: OZALLA FOREST SHRINE COMPOUND (Mission 5, dawn) ===================== */
function buildSceneShrine(){
  const scene = newScene({bg:'#1a3028', fog:'#243f33'});
  scene.fog.near = 18; scene.fog.far = 70;
  // dawn ambient — soft green-gold
  scene.add(new THREE.AmbientLight('#9bbf8a', 0.45));
  const sun = addSun(scene, '#fff0b0', 0.85, new THREE.Vector3(8, 6, 5));

  // mossy ground with leaf texture
  const ground = addTexturedGround(scene, leafForestTexture(), 100, '#3a4a28');

  // ===== forest perimeter — dense ring of trees =====
  for(let i=0;i<70;i++){
    const ang = (i/70) * Math.PI*2 + Math.random()*0.1;
    const r = 22 + Math.random()*18;
    const x = Math.cos(ang)*r;
    const z = Math.sin(ang)*r;
    addTree(scene, x, z, 0.85 + Math.random()*0.7);
  }
  // a few scattered closer trees for depth, NOT on the path
  for(let i=0;i<20;i++){
    const ang = Math.random()*Math.PI*2;
    const r = 12 + Math.random()*8;
    const x = Math.cos(ang)*r;
    const z = Math.sin(ang)*r;
    // keep entrance path clear
    if(Math.abs(x) < 4 && z > 4) continue;
    addTree(scene, x, z, 0.7 + Math.random()*0.5);
  }

  // ===== sacred entrance path — pale stones =====
  const pathMat = toonMat('#ddc89a');
  for(let i=0;i<14;i++){
    const stone = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.85, 0.18, 6), pathMat);
    stone.position.set((Math.random()-0.5)*0.3, 0.09, 14 - i*1.6);
    stone.rotation.y = Math.random()*Math.PI;
    scene.add(stone);
  }

  // ===== shrine compound — at the back =====
  // perimeter wall of clay/mud bricks
  const wallMat = toonMat('#a87a52');
  const wallH = 2.4;
  for(let i=-7;i<=7;i+=1){
    if(Math.abs(i)<2) continue; // gap for entrance
    const block = new THREE.Mesh(new THREE.BoxGeometry(0.95, wallH, 0.7), wallMat);
    block.position.set(i, wallH/2, -3);
    block.castShadow = true; scene.add(block); outline(block, 1.04);
  }
  // side walls
  for(let i=0;i<6;i++){
    const block = new THREE.Mesh(new THREE.BoxGeometry(0.7, wallH, 0.95), wallMat);
    block.position.set(-7.5, wallH/2, -3 - i*1);
    block.castShadow = true; scene.add(block); outline(block, 1.04);
    const block2 = block.clone(); block2.position.x = 7.5; scene.add(block2); outline(block2, 1.04);
  }
  // back wall
  for(let i=-7;i<=7;i+=1){
    const block = new THREE.Mesh(new THREE.BoxGeometry(0.95, wallH, 0.7), wallMat);
    block.position.set(i, wallH/2, -9);
    scene.add(block); outline(block, 1.04);
  }

  // ===== entrance gate — two carved posts with a lintel =====
  const postL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.4, 0.8), toonMat('#3a2818'));
  postL.position.set(-1.6, 1.7, -3); scene.add(postL); outline(postL, 1.05);
  const postR = postL.clone(); postR.position.x = 1.6; scene.add(postR); outline(postR, 1.05);
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.6, 0.8), toonMat('#5a3a1e'));
  lintel.position.set(0, 3.7, -3); scene.add(lintel); outline(lintel, 1.04);
  // gate carving stripe
  const carve = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 0.4), basicMat('#d8a64a'));
  carve.position.set(0, 3.7, -2.59); scene.add(carve);

  // ===== the shrine itself — round mud structure with conical thatched roof =====
  const shrineBase = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.0, 2.2, 12), toonMat('#8a5a3a'));
  shrineBase.position.set(0, 1.1, -7);
  shrineBase.castShadow = true; scene.add(shrineBase); outline(shrineBase, 1.04);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(3.4, 2.6, 12), toonMat('#7a4a28'));
  roof.position.set(0, 3.5, -7); scene.add(roof); outline(roof, 1.04);
  // roof texture overlay (thatch-like rings)
  for(let i=0;i<5;i++){
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.2 - i*0.32, 0.06, 4, 16), basicMat('#5a3818'));
    ring.position.set(0, 2.6 + i*0.45, -7);
    ring.rotation.x = Math.PI/2;
    scene.add(ring);
  }
  // shrine doorway (dark)
  const doorway = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.6), basicMat('#0a0a0a'));
  doorway.position.set(0, 0.8, -4.4); scene.add(doorway);

  // ===== sacred objects inside the courtyard =====
  // central fire pit
  const pit = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.0, 0.22, 12), toonMat('#3a2818'));
  pit.position.set(0, 0.11, -5.5); scene.add(pit); outline(pit, 1.05);
  // smouldering wood — emissive
  const ember = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), new THREE.MeshBasicMaterial({color:0xff7028}));
  ember.position.set(0, 0.35, -5.5); scene.add(ember);
  // smoke column (additive plane)
  const smokeTex = makeSmokeTexture();
  const smoke = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 5), new THREE.MeshBasicMaterial({
    map:smokeTex, transparent:true, opacity:0.45, depthWrite:false, blending:THREE.AdditiveBlending
  }));
  smoke.position.set(0, 2.8, -5.5); smoke.userData._smoke = true;
  scene.add(smoke);

  // libation pots (the "evidence carrier" — cartel hid stuff in real ritual pots)
  const potMat = toonMat('#5a3a22');
  for(let i=-1;i<=1;i++){
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 0.7, 8), potMat);
    pot.position.set(i*1.2, 0.35, -6.8);
    pot.castShadow = true; scene.add(pot); outline(pot, 1.05);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.08, 8), toonMat('#3a2818'));
    lid.position.set(i*1.2, 0.74, -6.8); scene.add(lid);
  }

  // hanging masks on lintel
  for(let i=-1;i<=1;i++){
    const mask = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.15), toonMat('#3a2818'));
    mask.position.set(i*1.4, 3.1, -2.65); scene.add(mask); outline(mask, 1.05);
    const eyeL = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.08), basicMat('#d8a64a'));
    eyeL.position.set(i*1.4 - 0.1, 3.2, -2.55); scene.add(eyeL);
    const eyeR = eyeL.clone(); eyeR.position.x = i*1.4 + 0.1; scene.add(eyeR);
  }

  // ===== a stack of jerry-cans hidden behind the shrine — cartel cover, this is what makes the shrine "evidence" =====
  // initially hidden visually (only become salient after entry / negotiation)
  const cache = new THREE.Group(); cache.name = 'cache';
  for(let i=0;i<3;i++){
    for(let j=0;j<2;j++){
      const can = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.4), toonMat('#d8a64a'));
      can.position.set(-0.6 + j*0.6, 0.36 + i*0.7, -8.3);
      cache.add(can); outline(can, 1.05);
    }
  }
  // cash bundle on top
  const wad = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.18, 0.5), toonMat('#3a5a3a'));
  wad.position.set(-0.3, 2.55, -8.3); cache.add(wad); outline(wad, 1.05);
  // ledger book
  const ledger = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.06, 0.6), toonMat('#7a3818'));
  ledger.position.set(0.4, 2.55, -8.3); cache.add(ledger); outline(ledger, 1.05);
  scene.add(cache);

  // ===== player + NPCs =====
  // Player starts at the path entrance, facing the shrine
  ENGINE.player = buildPlayerMesh();
  ENGINE.player.position.set(0, 0, 12);
  ENGINE.player.rotation.y = Math.PI; // face the shrine
  scene.add(ENGINE.player);

  // Custodian — Pa Eze, the shrine's keeper. Standing in the gateway.
  // (skin, shirt, pants, hair) — off-white robe, dark hair under a black cap
  const custodian = buildNPCMesh('#5a3818', '#f4ead0', '#f4ead0', '#1a1408');
  // add a red sash overlay
  const sash = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.16, 0.34), toonMat('#c84a3a'));
  sash.position.y = 1.18; custodian.add(sash); outline(sash, 1.05);
  custodian.position.set(0, 0, -1.2);
  custodian.rotation.y = Math.PI; // facing player
  custodian.userData._patrolBase = new THREE.Vector3(0, 0, -1.2);
  scene.add(custodian);
  ENGINE.npcs.push(custodian);

  // Sgt. Uche — squad partner waiting near the entrance
  const uche = buildNPCMesh('#5a3818', '#1a2a18', '#1a2a18', '#0a0a08');
  // navy shoulder armor / vest
  const vest = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.45, 0.36), toonMat('#0b1a3a'));
  vest.position.y = 1.1; uche.add(vest); outline(vest, 1.04);
  uche.position.set(-3.5, 0, 8);
  uche.rotation.y = Math.PI*0.6;
  uche.userData._patrolBase = new THREE.Vector3(-3.5, 0, 8);
  scene.add(uche);
  ENGINE.npcs.push(uche);

  // ----- INTERACTABLES -----
  ENGINE.interactables.push({
    mesh: uche, label:'Brief with Sgt. Uche', range:2.4,
    onInteract: ()=>{
      if(S.game._shrineUcheBriefed){ toast('SGT. UCHE','Already briefed.'); return; }
      startDialogue('shrine_uche', ()=>{ S.game._shrineUcheBriefed = true; });
    }
  });
  ENGINE.interactables.push({
    mesh: custodian, label:'Speak with Pa Eze', range:2.4,
    onInteract: ()=>{
      if(!S.game._shrineUcheBriefed){ toast('PROTOCOL','Brief with Sgt. Uche first'); return; }
      if(S.game.flags && S.game.flags.shrine_access){
        toast('PA EZE','He has nothing more to say. Search what you came for.');
        return;
      }
      startDialogue('shrine_intro');
    }
  });
  ENGINE.interactables.push({
    mesh: shrineBase, label:'Search Libation Pots', range:2.6,
    onInteract: ()=>{
      const acc = S.game.flags && S.game.flags.shrine_access;
      if(acc!=='granted_negotiate' && acc!=='granted_force'){
        toast('LOCKED','You have no permission to enter this courtyard.');
        sfxFail();
        return;
      }
      if(S.game._shrinePotsSearched){ toast('SEARCHED','The pots are already inspected.'); return; }
      S.game._shrinePotsSearched = true;
      collectEvidence({id:'shrine_pots', name:'SIM Cards Hidden in Libation Pots', xp:80});
      ENGINE.evidenceMarkers.find(m=>m.id==='ev_shrine_pots')?.let_collected();
      refreshEvidenceCount();
      checkShrineComplete();
    }
  });
  ENGINE.interactables.push({
    mesh: cache, label:'Inspect Cartel Cache', range:3.2,
    onInteract: ()=>{
      const acc = S.game.flags && S.game.flags.shrine_access;
      if(acc!=='granted_negotiate' && acc!=='granted_force'){
        toast('LOCKED','You have no permission to enter this courtyard.');
        sfxFail();
        return;
      }
      if(S.game._shrineCacheSearched){ toast('SEARCHED','Cache already inventoried.'); return; }
      S.game._shrineCacheSearched = true;
      collectEvidence({id:'shrine_cache', name:'Jerry-Cans of Ransom Cash + Ledger', xp:140});
      collectEvidence({id:'e_shrine_ledger', name:'Forest Route Ledger', xp:80});
      ENGINE.evidenceMarkers.find(m=>m.id==='ev_shrine_cache')?.let_collected();
      refreshEvidenceCount();
      checkShrineComplete();
    }
  });

  // ===== evidence markers — added dynamically AFTER access is granted =====
  // (handled in dialogue completion logic — see 'shrine_intro' branches)

  // ===== bounds + cam target =====
  ENGINE.bounds = { minX:-22, maxX:22, minZ:-12, maxZ:18 };
  ENGINE.cameraTarget = ENGINE.player;
  ENGINE.cameraYaw = 0; ENGINE.playerYaw = Math.PI;

  // ===== minimap config =====
  setMinimap(
    `<polygon points="-7,-12 7,-12 7,-3 -7,-3" fill="#a87a52" stroke="#5a3818" stroke-width="0.5"/>
     <circle cx="0" cy="-7" r="3" fill="#7a4a28" stroke="#3a2818" stroke-width="0.5"/>
     <rect x="-3" y="-3" width="6" height="0.6" fill="#3a2818"/>
     <circle cx="0" cy="0" r="0.6" fill="#d8a64a" opacity="0.4"/>
     <circle cx="0" cy="-3" r="0.4" fill="#5dd07a"/>`,
    [
      {x:0,  z:-7,  color:'#d8a64a', r:1.6},   // shrine
      {x:0,  z:-1.2,color:'#f4ead0', r:1.2},   // custodian
      {x:-3.5,z:8,  color:'#5dd07a', r:1.2},   // uche
    ]
  );

  S.game.currentRegion = 'Edo';
  S.game.currentSubregion = 'Ozalla Forest · Shrine Compound';
  S.game.alertLevel = 0;
  refreshHUD();

  // gentle smoke animation registered in atmosphere update
  ENGINE._shrineSmoke = smoke;
  ENGINE._shrineCache = cache;
  cache.visible = false; // hidden until access granted
}

/* tree helper for forest scene */
function addTree(scene, x, z, scale){
  scale = scale || 1;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22*scale, 0.32*scale, 2.4*scale, 6), toonMat('#5a3818'));
  trunk.position.set(x, 1.2*scale, z);
  trunk.castShadow = true; scene.add(trunk); outline(trunk, 1.06);
  // canopy: 2-3 stacked dark green spheres
  const canopy = new THREE.Group();
  const greens = ['#2a4a28', '#1a3a1e', '#3a5a2a'];
  for(let i=0;i<3;i++){
    const blob = new THREE.Mesh(
      new THREE.SphereGeometry((1.0 + Math.random()*0.4)*scale, 6, 5),
      toonMat(greens[i])
    );
    blob.position.set(
      (Math.random()-0.5)*0.6*scale,
      2.5*scale + i*0.6*scale + (Math.random()-0.5)*0.3,
      (Math.random()-0.5)*0.6*scale
    );
    canopy.add(blob); outline(blob, 1.05);
  }
  canopy.position.set(x, 0, z);
  scene.add(canopy);
}

/* leaf-strewn forest ground texture */
function leafForestTexture(){
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const ctx = c.getContext('2d');
  // deep moss base
  const grad = ctx.createRadialGradient(128, 128, 20, 128, 128, 180);
  grad.addColorStop(0, '#3a5a32');
  grad.addColorStop(1, '#1e3020');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 256, 256);
  // mossy noise
  for(let i=0;i<400;i++){
    const x = Math.random()*256, y = Math.random()*256, r = 2 + Math.random()*5;
    ctx.fillStyle = `rgba(${30 + Math.random()*60}, ${60 + Math.random()*70}, ${30 + Math.random()*40}, ${0.2 + Math.random()*0.3})`;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
  }
  // scattered fallen leaves (reddish-brown ovals)
  for(let i=0;i<50;i++){
    const x = Math.random()*256, y = Math.random()*256;
    const w = 4 + Math.random()*5, h = 2 + Math.random()*3;
    const ang = Math.random()*Math.PI;
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.fillStyle = `rgba(${110 + Math.random()*60}, ${60 + Math.random()*30}, ${30 + Math.random()*20}, ${0.5 + Math.random()*0.3})`;
    ctx.beginPath(); ctx.ellipse(0, 0, w, h, 0, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  return tex;
}

/* simple smoke texture — soft radial gradient */
function makeSmokeTexture(){
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(64, 90, 4, 64, 64, 60);
  grad.addColorStop(0, 'rgba(255, 220, 180, 0.7)');
  grad.addColorStop(0.4, 'rgba(180, 160, 140, 0.3)');
  grad.addColorStop(1, 'rgba(80, 80, 80, 0)');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}


