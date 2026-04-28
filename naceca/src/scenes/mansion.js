/* =========================================================================
   NACECA · scenes/mansion.js
   Auto-extracted from game.js by split_modules.py
   Edit the modules; run build.py to rebuild naceca.html.
   ========================================================================= */
/* ===================== 13. SCENE: LEKKI MANSION RAID (NIGHT) ===================== */
function buildSceneMansion(){
  const scene = newScene({bg:'#0a0e1a', fog:'#0c1426'});
  scene.fog.near = 12; scene.fog.far = 45;

  const amb = new THREE.AmbientLight('#3a4878', 0.45); scene.add(amb);
  // moonlight
  const moon = addSun(scene, '#a8c0ff', 0.5, new THREE.Vector3(-6,9,-3));
  // warm interior lamps (point lights)
  const lamp1 = new THREE.PointLight('#ffb070', 1.6, 9); lamp1.position.set(-2, 2.0, -3); scene.add(lamp1);
  const lamp2 = new THREE.PointLight('#ffd58a', 1.2, 8); lamp2.position.set( 3, 2.0,  1); scene.add(lamp2);
  const lamp3 = new THREE.PointLight('#ff8050', 1.0, 7); lamp3.position.set( 6, 2.5, -5); scene.add(lamp3);

  // marble floor (interior) + asphalt drive (exterior)
  addTexturedGround(scene, marbleTexture(), 50, '#ffffff');
  // exterior ground (driveway with asphalt texture)
  const drive = new THREE.Mesh(new THREE.PlaneGeometry(14, 18), new THREE.MeshLambertMaterial({map: asphaltTexture(), color:'#aaaaaa'}));
  drive.rotation.x = -Math.PI/2; drive.position.set(0, 0.01, 18); drive.receiveShadow = true;
  scene.add(drive);

  // god rays slanting through the glass doors
  addGodRay(scene, -1.4, 5.5, 5.8, 1.6, 0, 7, '#a8c0ff', 0.22, 0.05);
  addGodRay(scene,  1.4, 5.5, 5.8, 1.6, 0, 7, '#a8c0ff', 0.18, -0.05);
  // warm interior god ray from the corner lamp
  addGodRay(scene, -3.5, 4.0, -2.5, 1.0, 0, 4.5, '#ffb070', 0.15, 0.3);

  // dust motes drifting in lamp light
  addDustMotes(scene, 90, 18, 4, 16, '#ffd58a');

  // police lights at the driveway — two cruisers parked behind the player, pulsing red+blue
  const redLight  = new THREE.PointLight('#ff2030', 0,  16);
  redLight.position.set(-3, 1.5, 18); scene.add(redLight);
  const blueLight = new THREE.PointLight('#3070ff', 0,  16);
  blueLight.position.set( 3, 1.5, 18); scene.add(blueLight);
  // simple cruiser silhouettes (visible from the player's POV when looking back)
  for(const cruiserX of [-3, 3]){
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, 4.0), toonMat('#1a1a1a'));
    body.position.set(cruiserX, 0.5, 19); scene.add(body); outline(body, 1.04);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.55, 1.6), toonMat('#0a0a0a'));
    cab.position.set(cruiserX, 1.05, 19.2); scene.add(cab); outline(cab, 1.04);
    // light bar on top
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.18, 0.5), toonMat('#3a3a3a'));
    bar.position.set(cruiserX, 1.42, 19.2); scene.add(bar); outline(bar, 1.05);
    // emissive bulbs in the bar
    const redB  = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.4), basicMat('#ff2030'));
    redB.position.set(cruiserX-0.4, 1.45, 19.2); scene.add(redB);
    redB.userData._policeBulbRed = true;
    const blueB = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.4), basicMat('#3070ff'));
    blueB.position.set(cruiserX+0.4, 1.45, 19.2); scene.add(blueB);
    blueB.userData._policeBulbBlue = true;
  }
  // expose lights to engine so atmosphere update can pulse them
  ENGINE._policeRed = redLight;
  ENGINE._policeBlue = blueLight;

  // mansion walls (warm clay)
  const wallC = '#6a5040';
  // back wall
  addBox(scene, 0,0,-12, 24,5,0.4, wallC);
  // side walls
  addBox(scene, -12,0,-3, 0.4,5,18, wallC);
  addBox(scene,  12,0,-3, 0.4,5,18, wallC);
  // front wall split (sliding glass door in middle)
  addBox(scene, -7, 0, 6, 10, 5, 0.4, wallC);
  addBox(scene,  7, 0, 6, 10, 5, 0.4, wallC);
  // roof beam
  for(let i=-10;i<=10;i+=4){
    addBox(scene, i, 4.7, -3, 0.3, 0.3, 18, '#3a2a1a');
  }

  // sliding glass doors (cool blue night reflection)
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(4, 4.5), new THREE.MeshBasicMaterial({color:'#2a4878', transparent:true, opacity:0.55}));
  glass.position.set(0, 2.25, 6); scene.add(glass);

  // outside palms + side street feel
  for(let i=0;i<5;i++){
    const trunk = addBox(scene, -8 + i*4, 0, 14, 0.3, 4, 0.3, '#3a2818');
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.9,8,6), toonMat('#1a4030'));
    top.position.set(-8 + i*4, 4.5, 14); scene.add(top);
  }
  // distant building lights
  addBuilding(scene, -18, 16, 4, 8, 4, '#1a2540', '#0a0e1a', '#ffd870');
  addBuilding(scene,  18, 16, 4, 7, 4, '#1a2540', '#0a0e1a', '#ffe080');

  // === interior furniture ===
  // sofa (against right wall area)
  addBox(scene, -5, 0, -1, 3, 1.0, 1.2, '#c8b890');
  // coffee table
  const ctable = addBox(scene, -3, 0.4, -2.5, 1.6, 0.1, 1.0, '#3a2a18');
  // CASH on coffee table — evidence
  for(let i=0;i<4;i++){
    const cash = addBox(scene, -3.6+i*0.4, 0.5, -2.5, 0.3, 0.06, 0.18, '#5db86a');
  }
  // desk (with computer monitors)
  addBox(scene, 6, 0, -5, 3.5, 0.1, 1.6, '#2a1d12');
  // monitors
  const mon1 = addBox(scene, 5, 0.95, -5.7, 1.0, 0.7, 0.05, '#0a0a14');
  const mon1Screen = new THREE.Mesh(new THREE.PlaneGeometry(0.92,0.6), basicMat('#3a8ad0'));
  mon1Screen.position.set(5, 0.95, -5.67); scene.add(mon1Screen);
  // candlestick chart effect (red/green bars)
  for(let i=0;i<8;i++){
    const c = addBox(scene, 4.6 + i*0.1, 0.95, -5.66, 0.06, 0.1+Math.random()*0.3, 0.01, i%2?'#5db86a':'#c84a3a');
  }
  const mon2 = addBox(scene, 7, 0.95, -5.7, 1.0, 0.7, 0.05, '#0a0a14');
  const mon2Screen = new THREE.Mesh(new THREE.PlaneGeometry(0.92,0.6), basicMat('#1a2540'));
  mon2Screen.position.set(7, 0.95, -5.67); scene.add(mon2Screen);

  // LAPTOP on coffee table — the wipe target
  const laptop = addBox(scene, -2.8, 0.5, -2.0, 0.5, 0.04, 0.4, '#a0a0a8');
  const laptopScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.45,0.3), basicMat('#1a2030'));
  laptopScreen.position.set(-2.8, 0.7, -2.0); laptopScreen.rotation.x = -0.3; scene.add(laptopScreen);

  // SAFE — back room evidence
  addBox(scene, 9, 0, -10, 1.0, 1.4, 0.7, '#1a1a1a');
  addBox(scene, 9, 0.5, -9.7, 0.6, 0.6, 0.05, '#3a3a3a');

  // portrait on wall (stylized politician portrait — fictional)
  const portraitFrame = addBox(scene, -10, 2.5, -11.78, 1.4, 1.8, 0.1, '#3a2a18');
  const portrait = new THREE.Mesh(new THREE.PlaneGeometry(1.2,1.6), basicMat('#a08a6a'));
  portrait.position.set(-10, 2.5, -11.72); scene.add(portrait);

  // === characters ===
  // SUSPECT — Chief Obi (orange shirt, wide build), at desk
  const obi = buildNPCMesh('#7a4a30', '#e07d4a', '#5a3020', '#0a0a14');
  obi.position.set(6, 0, -4); obi.rotation.y = Math.PI/4;
  // make him visibly bigger (mansion fat-cat like reference)
  obi.scale.set(1.15,1.0,1.15);
  scene.add(obi);
  // hands-up animation (until arrested)
  ENGINE.npcs.push({mesh:obi, update:(dt)=>{
    if(obi.userData._arrested){
      obi.userData.armL.rotation.x *= 0.85;
      obi.userData.armR.rotation.x *= 0.85;
      obi.userData.armL.rotation.z *= 0.85;
      obi.userData.armR.rotation.z *= 0.85;
      return;
    }
    if(!obi.userData._panic){ obi.userData._panic = 0; }
    obi.userData._panic = Math.min(1, obi.userData._panic + dt*0.5);
    const pa = obi.userData._panic;
    obi.userData.armL.rotation.x = -2.0*pa;
    obi.userData.armR.rotation.x = -2.0*pa;
    obi.userData.armL.rotation.z =  0.4*pa;
    obi.userData.armR.rotation.z = -0.4*pa;
  }});

  // CHILD — on floor
  const child = buildNPCMesh('#7a5238', '#f3ead2', '#3a4828', '#0a0a14');
  child.scale.set(0.7,0.7,0.7);
  child.position.set(2, 0, -3); child.rotation.y = Math.PI/3;
  scene.add(child);

  // SQUADMATE — Sgt. Uche, near the door (NACECA)
  const uche = buildNPCMesh('#5a3826', '#0b1a3a', '#0a1020', '#0a0a14');
  uche.position.set(0.5, 0, 6.5); uche.rotation.y = Math.PI;
  scene.add(uche);
  ENGINE.interactables.push({
    mesh: uche, label:'Brief with Sgt. Uche', range:2.5,
    onInteract: ()=>{
      if(S.game._mansionPreBriefed){ toast('READY','Move to the suspect when ready'); return; }
      startDialogue('mansion_pre_breach');
    }
  });

  // interactables: laptop, cash, child, suspect, safe
  ENGINE.interactables.push({
    mesh: laptop, label:'Stop laptop wipe', range:1.8,
    onInteract: ()=>{
      if(S.game._evLaptop){ toast('SECURED','Laptop wipe stopped'); return; }
      if(!S.game._mansionPreBriefed){ toast('PRE-BREACH','Brief with Sgt. Uche first'); return; }
      collectEvidence({id:'laptop', name:'Encrypted Laptop', xp:80});
      S.game._evLaptop = true;
      ENGINE.evidenceMarkers.find(m=>m.id==='ev_laptop')?.let_collected();
      completeObjective('o4_wipe');
      refreshEvidenceCount();
    }
  });
  ENGINE.interactables.push({
    mesh: ctable, label:'Bag cash evidence', range:1.8,
    onInteract: ()=>{
      if(S.game._evCash){ toast('BAGGED','Cash logged in chain of custody'); return; }
      collectEvidence({id:'cash', name:'Cash Bundles ₦12.4M', xp:60});
      S.game._evCash = true;
      ENGINE.evidenceMarkers.find(m=>m.id==='ev_cash')?.let_collected();
      refreshEvidenceCount();
    }
  });
  ENGINE.interactables.push({
    mesh: child, label:'Calm and escort the child', range:2.0,
    onInteract: ()=>{
      if(S.game._civChild){ toast('SAFE','Child handed off to family liaison'); return; }
      startDialogue('mansion_civilian', ()=>{
        S.game._civChild = true;
        completeObjective('o5_civ');
        // visually move child outside
        child.position.x = 0.5; child.position.z = 8.5;
      });
    }
  });
  ENGINE.interactables.push({
    mesh: obi, label:'Move on suspect', range:2.5,
    onInteract: ()=>{
      if(!S.game._mansionPreBriefed){ toast('PRE-BREACH','Brief with Sgt. Uche first'); return; }
      if(S.game.moralChoices.arrest){ toast('SUSPECT','Already in custody'); return; }
      startDialogue('mansion_arrest', ()=>{
        if(S.game.moralChoices.arrest && S.game.moralChoices.arrest!=='bribe'){
          S.game.arrests += 1;
          completeObjective('o6_arrest');
          obi.userData._arrested = true;
        } else if(S.game.moralChoices.arrest==='bribe'){
          completeObjective('o6_arrest');
          obi.userData._arrested = true;
        }
      });
    }
  });
  ENGINE.interactables.push({
    mesh: { position: new THREE.Vector3(9, 0, -10) }, label:'Crack the safe (quick puzzle)', range:2.0,
    onInteract: ()=>{
      if(S.game._evSafe){ toast('SAFE OPEN','Drives bagged'); return; }
      // simple bonus puzzle inline
      const code = '4-7-2';
      toast('SAFE COMBO',`Sequence: ${code} — tap to confirm`, 1400);
      setTimeout(()=>{
        collectEvidence({id:'safe_drives', name:'Encrypted Hard Drives', xp:120});
        S.game._evSafe = true;
        ENGINE.evidenceMarkers.find(m=>m.id==='ev_safe')?.let_collected();
        refreshEvidenceCount();
      }, 1100);
    }
  });

  // exit (extraction) — outside the mansion
  const extractionMarker = addBox(scene, 0, 0.05, 16, 3, 0.05, 3, '#d8a64a');
  ENGINE.interactables.push({
    mesh: extractionMarker, label:'Extract — End operation', range:2.5,
    onInteract: ()=>{
      const allReq = S.game.moralChoices.arrest && S.game._civChild;
      if(!allReq){ toast('OPERATION OPEN','Arrest suspect & secure civilian first'); return; }
      completeMission('m3');
    }
  });

  // floating evidence markers
  addEvidenceMarker(new THREE.Vector3(-2.8, 1.0, -2.0), 'EVIDENCE', 'LAPTOP', 'ev_laptop');
  ENGINE.evidenceMarkers.find(m=>m.id==='ev_laptop').let_collected = function(){ this.collected=true; };
  addEvidenceMarker(new THREE.Vector3(-3, 0.9, -2.5), 'EVIDENCE', 'CASH', 'ev_cash');
  ENGINE.evidenceMarkers.find(m=>m.id==='ev_cash').let_collected = function(){ this.collected=true; };
  addEvidenceMarker(new THREE.Vector3(9, 1.2, -10), 'EVIDENCE', 'SAFE', 'ev_safe');
  ENGINE.evidenceMarkers.find(m=>m.id==='ev_safe').let_collected = function(){ this.collected=true; };

  // player at front entry
  const p = buildPlayerMesh(); p.position.set(0,0,8); scene.add(p);
  ENGINE.player = p;
  ENGINE.cameraYaw = Math.PI; // looking inside
  ENGINE.bounds = {minX:-11.5, maxX:11.5, minZ:-11.5, maxZ:17.5};

  setMinimap(
    `<rect x="-12" y="-12" width="24" height="18" fill="#2a3550" opacity=".4"/>
     <rect x="-3" y="-30" width="6" height="60" fill="#2a3550" opacity=".25"/>`,
    [
      {x:6,  z:-4, color:'#e07d4a', r:1.8}, // suspect
      {x:2,  z:-3, color:'#f3ead2', r:1.4}, // child
      {x:0.5,z:6.5,color:'#3a8ad0', r:1.6}, // sgt
      {x:-3, z:-2.5,color:'#d8a64a', r:1.2}, // cash/laptop
      {x:9,  z:-10,color:'#d8a64a', r:1.2}, // safe
      {x:0,  z:16, color:'#5dd07a', r:2.0}, // extraction
    ]
  );

  S.game.currentRegion = 'Lagos';
  S.game.currentSubregion = 'Lekki Mansion · Old GRA';
  S.game.alertLevel = 2; // HIGH alert during raid
  refreshHUD();
}

function refreshEvidenceCount(){
  $('#ev-cur').textContent = S.game.evidence.length;
}

