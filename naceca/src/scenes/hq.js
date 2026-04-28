/* =========================================================================
   NACECA · scenes/hq.js
   Auto-extracted from game.js by split_modules.py
   Edit the modules; run build.py to rebuild naceca.html.
   ========================================================================= */
/* ===================== 11. SCENE: HQ BRIEFING ROOM ===================== */
function buildSceneHQ(){
  const scene = newScene({bg:'#0e1626', fog:'#1a2540'});
  // warm interior lighting
  const amb = new THREE.AmbientLight('#3a3550', 0.55); scene.add(amb);
  const sun = addSun(scene, '#ffe6b8', 1.05, new THREE.Vector3(5,9,3));
  // warm desk lamp glow
  const lamp = new THREE.PointLight('#ffb070', 1.4, 12);
  lamp.position.set(-3.5, 2.2, -2);
  scene.add(lamp);
  const lamp2 = new THREE.PointLight('#ffd58a', 0.9, 14);
  lamp2.position.set(4, 2.4, 2);
  scene.add(lamp2);

  // floor — polished marble (procedural)
  const floor = addTexturedGround(scene, marbleTexture(), 24, '#ffffff');
  // dust motes catching the lamp light
  addDustMotes(scene, 60, 14, 4, 14, '#ffd58a');

  // walls (warm cream/clay)
  const wallC = '#7a6048';
  addBox(scene, 0,0,-10, 24,5,0.4, wallC);
  addBox(scene, 0,0, 10, 24,5,0.4, wallC);
  addBox(scene, -12,0,0, 0.4,5,20, wallC);
  addBox(scene,  12,0,0, 0.4,5,20, wallC);
  // ceiling beams
  for(let i=-10;i<=10;i+=4){
    addBox(scene, i,4.7,0, 0.3,0.3,20, '#3a2a1a');
  }

  // briefing table
  addBox(scene, 0, 0.4, 0,  6, 0.1, 2.4, '#2a1d12'); // tabletop (raised on legs)
  addBox(scene, -2.8,0,-1, 0.2,0.4,0.2, '#1a120a');
  addBox(scene,  2.8,0,-1, 0.2,0.4,0.2, '#1a120a');
  addBox(scene, -2.8,0, 1, 0.2,0.4,0.2, '#1a120a');
  addBox(scene,  2.8,0, 1, 0.2,0.4,0.2, '#1a120a');
  // case folder on table
  const folder = addBox(scene, 0, 0.5, 0, 1, 0.04, 0.7, '#d8a64a');
  folder.material = basicMat('#d8a64a');

  // commander's desk (back wall)
  addBox(scene, 0, 0.4, -7.5, 4, 0.1, 1.6, '#1a1208');
  // commander NPC
  const cmd = buildNPCMesh('#5a3826', '#1a3050', '#0a1020', '#0a0a14');
  cmd.position.set(0, 0, -8.0); cmd.rotation.y = Math.PI;
  scene.add(cmd);
  ENGINE.npcs.push({mesh:cmd, update:(dt)=>{ cmd.userData.walkPhase += dt*1.2; cmd.position.y = Math.sin(cmd.userData.walkPhase)*0.01; }});

  // NACECA crest on back wall
  const crestBg = new THREE.Mesh(new THREE.PlaneGeometry(3,2), basicMat('#0b1426'));
  crestBg.position.set(0, 3, -9.78); scene.add(crestBg);
  const crestGold = new THREE.Mesh(new THREE.PlaneGeometry(2.4,1.4), basicMat('#d8a64a'));
  crestGold.position.set(0,3,-9.77); scene.add(crestGold);

  // evidence boards on side walls (red string conspiracy boards)
  for(let s=-1;s<=1;s+=2){
    const board = new THREE.Mesh(new THREE.PlaneGeometry(3.5,2), toonMat('#3a2a18'));
    board.position.set(s*11.78, 2.5, 0); board.rotation.y = -s*Math.PI/2; scene.add(board);
    // pin papers
    for(let i=0;i<6;i++){
      const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.4,0.3), basicMat('#f3ead2'));
      paper.position.set(s*11.76, 1.7 + Math.random()*1.5, -1.3 + i*0.5);
      paper.rotation.y = -s*Math.PI/2;
      paper.rotation.z = (Math.random()-0.5)*0.1;
      scene.add(paper);
    }
  }

  // chairs around table
  for(let i=-1;i<=1;i+=2){
    addBox(scene, i*1.5, 0.5, 1.5, 0.5, 0.05, 0.5, '#1a1208');
    addBox(scene, i*1.5, 0.85, 1.7, 0.5, 0.7, 0.05, '#1a1208');
  }

  // player
  const p = buildPlayerMesh();
  p.position.set(0, 0, 4);
  scene.add(p);
  ENGINE.player = p;
  ENGINE.cameraYaw = Math.PI; // face inward
  ENGINE.bounds = {minX:-11.5, maxX:11.5, minZ:-9.5, maxZ:9.5};

  // briefing trigger — walk up to table
  ENGINE.interactables.push({
    mesh: folder, label:'Approach Commander', range:3.5,
    onInteract: ()=>{ if(!S.game._hqBriefed){ startDialogue('hq_intro'); } else { toast('BRIEFING COMPLETE','Move to the exit'); } }
  });

  // exit door — leaves to next mission
  const door = addBox(scene, 0, 0, 9.9, 1.6, 3, 0.2, '#d8a64a');
  ENGINE.interactables.push({
    mesh: door, label:'Deploy to Ikeja Market', range:3,
    onInteract: ()=>{
      if(!S.game._hqBriefed){ toast('BRIEFING REQUIRED','Approach the commander first'); return; }
      completeMission('m1', { silent:true });
      loadMission('m2');
    }
  });

  // minimap
  setMinimap(
    `<rect x="-30" y="-3" width="60" height="6" fill="#2a3550" opacity=".4"/>
     <rect x="-3" y="-30" width="6" height="60" fill="#2a3550" opacity=".4"/>`,
    [
      {x:0, z:-8, color:'#d8a64a', r:2.2},  // commander (gold)
      {x:0, z:9.9, color:'#5dd07a', r:1.8}, // exit door
    ]
  );

  S.game.currentRegion = 'Lagos';
  S.game.currentSubregion = 'NACECA HQ';
  refreshHUD();
}

