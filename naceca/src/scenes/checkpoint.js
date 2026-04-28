/* =========================================================================
   NACECA · scenes/checkpoint.js
   Auto-extracted from game.js by split_modules.py
   Edit the modules; run build.py to rebuild naceca.html.
   ========================================================================= */
/* ===================== 13b. SCENE: BENIN BYPASS CHECKPOINT (Mission 4, dusk) ===================== */
function buildSceneCheckpoint(){
  const scene = newScene({bg:'#2a1a18', fog:'#3a2a20'});
  scene.fog.near = 18; scene.fog.far = 60;

  // dusk amber lighting
  scene.add(new THREE.AmbientLight('#6a4838', 0.7));
  const sun = addSun(scene, '#ff9a4a', 1.2, new THREE.Vector3(-12, 8, 4));
  // headlight glow from a distant convoy
  const hl = new THREE.PointLight('#ffffff', 1.0, 25);
  hl.position.set(-22, 1.5, 0); scene.add(hl);
  // checkpoint floodlight
  const flood = new THREE.SpotLight('#ffd58a', 1.6, 30, Math.PI/4, 0.4, 1);
  flood.position.set(0, 9, -8); flood.target.position.set(0, 0, 2);
  scene.add(flood); scene.add(flood.target);

  // asphalt highway
  const road = new THREE.Mesh(new THREE.PlaneGeometry(60, 14), new THREE.MeshLambertMaterial({map: asphaltTexture(), color:'#888'}));
  road.rotation.x = -Math.PI/2; road.receiveShadow = true; scene.add(road);
  // road lane markings
  for(let x=-28; x<=28; x+=4){
    const lane = addBox(scene, x, 0.01, 0, 1.5, 0.005, 0.18, '#d8c898', {outline:false});
  }
  // road shoulders (laterite)
  addBox(scene, 0, 0, -8.5, 60, 0.02, 3, '#5a3a2a', {outline:false});
  addBox(scene, 0, 0,  8.5, 60, 0.02, 3, '#5a3a2a', {outline:false});

  // distant savanna horizon
  for(let i=0; i<14; i++){
    const tx = (Math.random()-0.5)*60;
    const tz = -25 - Math.random()*10;
    const trunk = addBox(scene, tx, 0, tz, 0.3, 3, 0.3, '#3a2818');
    const top = new THREE.Mesh(new THREE.SphereGeometry(1.4,8,6), toonMat('#3a4a28'));
    top.position.set(tx, 4.5, tz); scene.add(top); outline(top, 1.05);
  }

  // checkpoint barrel barricade
  for(let i=0; i<4; i++){
    addOutlinedBox(scene, -10 + i*2, 0, -2, 0.7, 1.2, 0.7, i%2?'#c84a3a':'#ffffff');
  }
  // sandbag wall
  for(let i=0; i<5; i++){
    addOutlinedBox(scene, 6 + (i%3)*0.6, 0 + Math.floor(i/3)*0.4, -3, 1.0, 0.4, 0.6, '#b8a070');
  }
  // checkpoint sign
  addOutlinedBox(scene, 4, 1.5, -7, 2.2, 1.5, 0.1, '#0b1426');
  const signFront = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.3), basicMat('#d8a64a'));
  signFront.position.set(4, 1.5+0.75, -6.94); scene.add(signFront);

  // === LIVESTOCK TRUCK (centerpiece) ===
  const truck = new THREE.Group();
  // cab
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.4, 2.2), toonMat('#3a5a8a'));
  cab.position.set(-2.6, 1.2, 0); cab.castShadow = true; truck.add(cab); outline(cab, 1.04);
  // cab windshield
  const wshield = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.0), basicMat('#1a2a40'));
  wshield.position.set(-2.6, 1.7, 1.11); truck.add(wshield);
  // wheels (cab)
  for(const sx of [-0.85, 0.85]) for(const sz of [-0.9, 0.9]){
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.3, 12), toonMat('#0a0a0a'));
    w.rotation.z = Math.PI/2; w.position.set(-2.6 + sx, 0.5, sz); truck.add(w); outline(w,1.06);
  }
  // cargo bed (ribbed wooden cattle truck)
  const bed = new THREE.Mesh(new THREE.BoxGeometry(5.0, 2.6, 2.4), new THREE.MeshLambertMaterial({map: woodTexture(), color:'#aa7a4a'}));
  bed.position.set(1.3, 1.5, 0); bed.castShadow = true; truck.add(bed); outline(bed, 1.03);
  // wooden slats (vertical) for visual ribbing
  for(let s=-2.3; s<=2.3; s+=0.6){
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.4, 2.5), toonMat('#1a0e08'));
    slat.position.set(1.3 + s, 1.5, 0); truck.add(slat);
  }
  // bed wheels
  for(const sx of [-1.4, 0, 1.4]) for(const sz of [-1.0, 1.0]){
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.3, 12), toonMat('#0a0a0a'));
    w.rotation.z = Math.PI/2; w.position.set(1.3 + sx, 0.5, sz); truck.add(w); outline(w,1.06);
  }
  // peeking cattle heads (white-fulani style)
  for(let i=0; i<4; i++){
    const ch = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.3, 0.5), toonMat('#f0e8d8'));
    ch.position.set(-0.8 + i*0.7, 2.2, 1.21); truck.add(ch); outline(ch,1.06);
    // horns
    for(const sx of [-1,1]){
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.18, 6), toonMat('#3a2818'));
      horn.position.set(-0.8 + i*0.7 + sx*0.13, 2.4, 1.21); horn.rotation.z = sx*0.5; truck.add(horn);
    }
    // eye dots
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03,6,6), basicMat('#0a0a14'));
    eye.position.set(-0.8 + i*0.7, 2.22, 1.46); truck.add(eye);
  }
  // documents on dashboard (interactable)
  const docs = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.4), basicMat('#f3ead2'));
  docs.position.set(-2.3, 1.4, 0.5); truck.add(docs);
  truck.position.set(0, 0, 4);
  scene.add(truck);

  // hidden compartment marker (back of truck) - revealed after manifest puzzle
  const compartment = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.2, 0.1), toonMat('#1a0e08'));
  compartment.position.set(3.8, 1.5, 4); compartment.userData._hidden = true;
  scene.add(compartment);

  // === NPCs ===
  // AKS Inspector Chidi (green camo, beret) - left of truck
  const chidi = buildNPCMesh('#5a3826', '#3a4a28', '#1a2010', '#0a0a14');
  chidi.position.set(-6, 0, 2); chidi.rotation.y = Math.PI/3;
  // beret
  const beret = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8, 0, Math.PI*2, 0, Math.PI/2.5), toonMat('#5a0a0a'));
  beret.position.set(0, 1.7, 0.02); chidi.add(beret); outline(beret,1.05);
  scene.add(chidi);
  ENGINE.interactables.push({
    mesh: chidi, label:'Brief with AKS Inspector Chidi', range:2.5,
    onInteract: ()=>{
      if(S.game._cpBriefed){ toast('AKS','Verify the manifest, then we open the truck'); return; }
      startDialogue('checkpoint_intro');
    }
  });

  // Driver Musa - sitting curbside, near the truck
  const musa = buildNPCMesh('#6a4528', '#a08a6a', '#3a2a18', '#1a0a04');
  musa.position.set(-4, 0, 2.5); musa.rotation.y = Math.PI/2;
  scene.add(musa);
  ENGINE.npcs.push({mesh:musa, update:(dt)=>{
    musa.userData.walkPhase = (musa.userData.walkPhase||0) + dt;
    // sweat-fidget animation: small head bob
    musa.rotation.y = Math.PI/2 + Math.sin(musa.userData.walkPhase*1.5)*0.08;
  }});
  ENGINE.interactables.push({
    mesh: musa, label:'Question driver Musa', range:2.3,
    onInteract: ()=>{
      if(!S.game._cpBriefed){ toast('PROTOCOL','Speak with AKS first'); return; }
      if(S.game._cpDriverInterviewed){ toast('MUSA','He has nothing more to say without a lawyer'); return; }
      startDialogue('checkpoint_driver', ()=>{ S.game._cpDriverInterviewed = true; completeObjective('o2_driver'); });
    }
  });

  // documents — manifest puzzle
  ENGINE.interactables.push({
    mesh: docs, label:'Verify cargo manifest', range:2.4,
    onInteract: ()=>{
      if(!S.game._cpBriefed){ toast('PROTOCOL','Brief with AKS first'); return; }
      if(S.game._cpManifestDone){ toast('MANIFEST','Documents already verified'); return; }
      openPuzzle('checkpoint_manifest', ()=>{
        S.game._cpManifestDone = true;
        completeObjective('o3_manifest');
        compartment.userData._hidden = false;
        toast('PROBABLE CAUSE','Open the rear compartment',1800);
        // reveal a glowing marker for the compartment
        addEvidenceMarker(new THREE.Vector3(3.8, 2.0, 4), 'EVIDENCE', 'COMPARTMENT', 'ev_compartment');
        const m = ENGINE.evidenceMarkers.find(x=>x.id==='ev_compartment');
        m.let_collected = function(){ this.collected=true; };
      });
    }
  });

  // hidden compartment - opens after manifest verified
  ENGINE.interactables.push({
    mesh: compartment, label:'Open rear compartment', range:2.5,
    onInteract: ()=>{
      if(compartment.userData._hidden){ toast('NO GROUNDS','Verify the manifest for probable cause first'); return; }
      if(S.game._cpCompartmentOpen){ toast('COMPARTMENT','Already searched'); return; }
      collectEvidence({id:'ransom_ledger', name:'Ransom Route Ledger', xp:140});
      collectEvidence({id:'concealed_arms', name:'Concealed Arms (2 × AK-pattern)', xp:80});
      S.game._cpCompartmentOpen = true;
      ENGINE.evidenceMarkers.find(m=>m.id==='ev_compartment')?.let_collected();
      completeObjective('o4_search');
      refreshEvidenceCount();
      // start resolve dialogue after a beat
      setTimeout(()=>{
        if(!S.game.moralChoices.checkpoint){
          startDialogue('checkpoint_resolve', ()=>{
            completeObjective('o5_decide');
            if(S.game.moralChoices.checkpoint==='arrest_driver'){ S.game.arrests += 1; }
          });
        }
      }, 900);
    }
  });

  // extraction point - back to NACECA convoy
  const ext = addOutlinedBox(scene, 14, 0.05, 0, 3, 0.05, 3, '#d8a64a');
  ENGINE.interactables.push({
    mesh: ext, label:'Extract — End operation', range:2.5,
    onInteract: ()=>{
      if(!S.game.moralChoices.checkpoint){ toast('OPERATION OPEN','Decide on the driver first'); return; }
      completeMission('m4');
    }
  });

  // dust + atmosphere — harmattan haze
  addDustMotes(scene, 80, 40, 6, 30, '#e0c89a');

  // floating evidence markers
  addEvidenceMarker(new THREE.Vector3(-2.3, 2.0, 4.5), 'EVIDENCE', 'MANIFEST', 'ev_manifest');
  ENGINE.evidenceMarkers.find(m=>m.id==='ev_manifest').let_collected = function(){ this.collected=true; };

  // player position — entering checkpoint from south
  const p = buildPlayerMesh(); p.position.set(-12, 0, 4); scene.add(p);
  ENGINE.player = p;
  ENGINE.cameraYaw = Math.PI/2; // looking east toward truck
  ENGINE.bounds = {minX:-25, maxX:18, minZ:-9, maxZ:8.5};

  setMinimap(
    `<rect x="-30" y="-3" width="60" height="6" fill="#2a3550" opacity=".6"/>
     <rect x="-30" y="-9" width="60" height="3" fill="#3a2a20" opacity=".5"/>
     <rect x="-30" y="6"  width="60" height="3" fill="#3a2a20" opacity=".5"/>
     <rect x="-3" y="-9" width="6" height="3" fill="#c84a3a" opacity=".7"/>`,
    [
      {x:0,  z:4,  color:'#3a5a8a', r:2.2}, // truck (blue)
      {x:-6, z:2,  color:'#3a4a28', r:1.6}, // chidi
      {x:-4, z:2.5,color:'#a08a6a', r:1.4}, // musa
      {x:-2.3,z:4.5,color:'#d8a64a', r:1.2}, // documents
      {x:14, z:0,  color:'#5dd07a', r:2.0}, // extraction
    ]
  );

  S.game.currentRegion = 'Edo';
  S.game.currentSubregion = 'Benin Bypass · Checkpoint';
  S.game.alertLevel = 1;
  refreshHUD();
}

