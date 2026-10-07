/* =========================================================================
   NACECA · scenes/market.js
   Auto-extracted from game.js by split_modules.py
   Edit the modules; run build.py to rebuild naceca.html.
   ========================================================================= */
/* ===================== 12. SCENE: IKEJA MARKET ===================== */
function buildSceneMarketLegacy(){
  const scene = newScene({bg:'#1a2845', fog:'#2a3a5a'});
  scene.fog.near = 14; scene.fog.far = 50;

  const amb = new THREE.AmbientLight('#5060a0', 0.7); scene.add(amb);
  const sun = addSun(scene, '#ffe8b0', 0.85, new THREE.Vector3(-3, 6, 4));

  // ground
  addGround(scene, '#2a2e36', 60);
  // road strip
  addBox(scene, 0, 0.001, 0, 8, 0.01, 60, '#1a1d22');

  // market stalls — colorful canopies
  const stallColors = ['#c84a3a','#3a8ad0','#d8a64a','#5db86a','#a04acd','#e07d4a'];
  for(let i=-3; i<=3; i++){
    if(i===0) continue;
    for(let s=-1; s<=1; s+=2){
      const x = s*8 + (s<0? -2:2);
      const z = i*5;
      // canopy
      const can = addBox(scene, x, 2.2, z, 2.4, 0.12, 2.0, stallColors[Math.abs(i+3)%6]);
      // posts
      addBox(scene, x-1.0, 0, z-0.8, 0.1, 2.3, 0.1, '#1a1208');
      addBox(scene, x+1.0, 0, z-0.8, 0.1, 2.3, 0.1, '#1a1208');
      addBox(scene, x-1.0, 0, z+0.8, 0.1, 2.3, 0.1, '#1a1208');
      addBox(scene, x+1.0, 0, z+0.8, 0.1, 2.3, 0.1, '#1a1208');
      // counter
      addBox(scene, x, 0, z, 2.0, 0.9, 0.8, '#3a2a18');
      addObstacle(x, z, 2.1, 1.7);
      // wares
      for(let k=0; k<3; k++){
        addBox(scene, x-0.7+k*0.7, 0.9, z-0.1, 0.3, 0.3, 0.3, ['#c84a3a','#5db86a','#d8a64a'][k]);
      }
    }
  }

  // background buildings
  addBuilding(scene, -16, -10, 5, 7, 4, '#5a4838', '#2a1d12', '#ffe080');
  addBuilding(scene,  16, -10, 5, 8, 4, '#6a5040', '#2a1d12', '#ffd870');
  addBuilding(scene, -16,  10, 5, 6, 4, '#4a3828', '#2a1d12', '#ffe080');
  addBuilding(scene,  16,  10, 5, 7, 4, '#5a4030', '#2a1d12', '#ffd870');
  addBuilding(scene, -22,   0, 4, 9, 4, '#3a2818', '#1a0e08', '#ffd870');
  addBuilding(scene,  22,   0, 4, 8, 4, '#4a3020', '#1a0e08', '#ffe080');

  // crowd NPCs (background)
  const skinTones=['#8a5a3a','#5a3826','#a07a5a','#6a4a30'];
  const shirts = ['#c84a3a','#3a8ad0','#5db86a','#a04acd','#e07d4a','#d8a64a','#3a3a3a','#f3ead2'];
  const wanderers = [];
  for(let i=0;i<14;i++){
    const fem = i%2===0;
    const looks = fem
      ? [{female:true, hair:'gele', capColor:shirts[(i+3)%shirts.length], robe:shirts[(i+5)%shirts.length]},
         {female:true, hair:'braids'},
         {female:true, hair:'afro', robe:shirts[(i+2)%shirts.length]}][i%3]
      : [{hair:'crop'}, {hair:'cap', capColor:shirts[(i+4)%shirts.length], beard:i%4===1}, {hair:'afro'}, {hair:'bald', build:'heavy'}][i%4];
    const DESIGNED = ['fruit_seller','fila_man','gele_purple','cap_guy','gele_handbag','tank_guy','bread_seller','student'];
    const npc = i < DESIGNED.length && typeof makeExtra==='function' ? makeExtra(DESIGNED[i]) : buildNPCMesh(
      skinTones[i%4], shirts[i%shirts.length], ['#1a2030','#3a2a1a','#2a3a2a'][i%3], '#0a0a14', looks);
    const ang = Math.random()*Math.PI*2;
    npc.position.set(Math.cos(ang)*12 + (Math.random()-.5)*4, 0, Math.sin(ang)*12 + (Math.random()-.5)*4);
    npc.rotation.y = Math.random()*Math.PI*2;
    npc.userData.target = new THREE.Vector3(npc.position.x + (Math.random()-.5)*8, 0, npc.position.z + (Math.random()-.5)*8);
    npc.userData.speed = 0.6 + Math.random()*0.6;
    scene.add(npc);
    wanderers.push(npc);
    ENGINE.npcs.push({mesh:npc, update:(dt)=>{
      if(npc.userData._down) return;
      const t = npc.userData.target;
      const dx = t.x - npc.position.x, dz = t.z - npc.position.z;
      const d = Math.hypot(dx,dz);
      if(d<0.3){
        npc.userData.target.set(npc.position.x + (Math.random()-.5)*10, 0, npc.position.z + (Math.random()-.5)*10);
      }
      const sp = npc.userData.speed*dt;
      npc.position.x += (dx/d)*sp;
      npc.position.z += (dz/d)*sp;
      npc.rotation.y = Math.atan2(dx, dz);
      npc.userData.walkPhase += dt*8*npc.userData.speed;
      const sw = Math.sin(npc.userData.walkPhase)*0.4;
      npc.userData.armL.rotation.x =  sw;
      npc.userData.armR.rotation.x = -sw;
      npc.userData.legL.rotation.x = -sw*0.8;
      npc.userData.legR.rotation.x =  sw*0.8;
    }});
  }

  // traders with head-loads standing in the lanes — the chase has to weave through them
  const traders = [];
  for(const [tx,tz,col] of [[7.2,-1.5,'#d8a64a'],[8.4,-4.6,'#5db86a'],[7.4,-10.2,'#c84a3a'],[11.8,2.6,'#a04acd'],[12.2,-5.2,'#3a8ad0'],[11.6,-10.1,'#e07d4a']]){
    const t = buildNPCMesh('#6a4a30', col, '#2a1d12', '#0a0a14', {female:true, hair:'gele', capColor:col, robe:col});
    const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.34,0.3,0.08,14), toonMat('#8a6a3a')); tray.position.y = 1.98; t.add(tray); outline(tray,1.05);
    for(let k=0;k<3;k++){ const f = new THREE.Mesh(new THREE.SphereGeometry(0.08,8,6), toonMat(['#e8c040','#5db86a','#c84a3a'][k])); f.position.set(-0.12+k*0.12, 2.06, 0); t.add(f); }
    t.position.set(tx, 0, tz); t.rotation.y = Math.random()*Math.PI*2;
    scene.add(t); ENGINE.npcs.push(t); traders.push(t);
  }
  ENGINE._marketCrowd = traders.concat(wanderers);

  // INFORMANT — Tunde, by a specific stall (not wandering)
  const tunde = buildNPCMesh('#5a3826', '#5db86a', '#1a2030', '#0a0a14', {hair:'cap', capColor:'#d8a64a', beard:true});
  tunde.position.set(-6, 0, -2); tunde.rotation.y = Math.PI/2;
  scene.add(tunde);
  ENGINE.interactables.push({
    mesh: tunde, label:'Speak with Informant Tunde', range:2.5,
    onInteract: ()=>{
      if(S.game._marketTunde){ toast('TUNDE','He gave the tip — go scan the phone'); return; }
      startDialogue('market_intro');
    }
  });

  // SUSPECT — KC, in orange, at counter, holding phone
  const kc = buildNPCMesh('#7a4a30', '#e07d4a', '#1a2030', '#0a0a14', {hair:'crop', scale:0.9});
  kc.position.set(8, 0, 4); kc.rotation.y = -Math.PI/2; ENGINE._marketKC = kc;
  scene.add(kc);

  // The PHONE — evidence on counter
  const phone = addBox(scene, 7.5, 0.95, 4, 0.15, 0.04, 0.3, '#0a0a14');
  ENGINE.interactables.push({
    mesh: phone, label:'Scan suspect phone', range:2.0,
    onInteract: ()=>{
      if(!S.game._marketTunde){ toast('NEED INTEL','Talk to the informant first'); return; }
      if(S.game._marketScanned){ toast('ALREADY SCANNED','Confront the suspect'); return; }
      openPuzzle('market_phone_scan', (correct)=>{
        S.game._marketScanned = true;
        completeObjective('o2_scan');
        // floating evidence marker becomes "collected"
        ENGINE.evidenceMarkers.find(m=>m.id==='phone')?.let_collected();
      });
    }
  });

  ENGINE.interactables.push({
    mesh: kc, label:'Confront teen suspect', range:2.5,
    onInteract: ()=>{
      if(!S.game._marketScanned){ toast('NO EVIDENCE','Scan the phone first'); return; }
      if(S.game.moralChoices.market_runner){ toast('ALREADY DECIDED','Head back to the van'); return; }
      if(CHASE.active){ return; }
      // he sees the badge and bolts — shoving a trader's tray into your path
      ENGINE._stagger = 0.9;
      toast('HE\'S RUNNING','KC shoves a tray at you and breaks for the back of the stalls. Sprint — and mind the traders.', 2600);
      musicForScene && musicForScene('m6_chase');
      startChase({
        runner: kc, label:'KC', speed:4.9, catchDist:1.45, headStart:0.4,
        path: [[8,4],[8,7.4],[12.6,7.4],[12.6,-2.4],[12.6,-7.5],[7.6,-7.5],[7.6,-12.5],[12.6,-12.5],[12.6,-20.5]],
        crowd: ENGINE._marketCrowd || [],
        onCaught: ()=>{
          kc.rotation.y += Math.PI;
          startDialogue('market_runner', ()=>{
            S.game.moralChoices.market_runner = 'caught';
            completeObjective('o3_runner');
            toast('OBJECTIVE COMPLETE','Return to the NACECA van');
            musicForScene && musicForScene('m2');
          });
        },
        onEscaped: ()=>{
          applyEffect({agencyFavour:-4, intel:-5});
          startDialogue('market_runner_escaped', ()=>{
            S.game.moralChoices.market_runner = 'escaped';
            completeObjective('o3_runner');
            toast('OBJECTIVE CLOSED','He got away. Return to the NACECA van');
            musicForScene && musicForScene('m2');
          });
        },
      });
    }
  });

  // floating evidence marker
  addEvidenceMarker(new THREE.Vector3(7.5,1.5,4), 'EVIDENCE', 'PHONE', 'phone');
  // attach a tagged collect helper
  const phoneMarker = ENGINE.evidenceMarkers.find(m=>m.id==='phone');
  phoneMarker.let_collected = ()=>{ phoneMarker.collected=true; };

  // NACECA van as exit
  const van = new THREE.Group();
  const vbody = addBox(van, 0,0,0, 2.4, 1.6, 4.5, '#0b1a3a');
  vbody.position.y = 0.8;
  const vwin = addBox(van, 0,1.4,-1.0, 2.2, 0.9, 0.05, '#3a5a8a');
  // wheels
  for(const sx of [-1,1]) for(const sz of [-1.5,1.5]){
    addBox(van, sx*1.05, 0, sz, 0.3, 0.6, 0.6, '#1a1a1a');
  }
  van.position.set(0, 0, 14);
  scene.add(van);
  ENGINE.interactables.push({
    mesh: van, label:'Board NACECA van — proceed to Lekki mansion', range:3.5,
    onInteract: ()=>{
      if(!S.game._marketScanned){ toast('OBJECTIVES PENDING','Scan phone & decide on suspect'); return; }
      if(!S.game.moralChoices.market_runner){ toast('OBJECTIVES PENDING','Decide on the teen suspect'); return; }
      completeMission('m2', { silent:true });
      loadMission('m3');
    }
  });

  // player
  const p = buildPlayerMesh(); p.position.set(0,0,12); scene.add(p);
  ENGINE.player = p;
  ENGINE.cameraYaw = 0;
  ENGINE.bounds = {minX:-22, maxX:22, minZ:-22, maxZ:22};

  setMinimap(
    `<rect x="-3" y="-30" width="6" height="60" fill="#2a3550" opacity=".5"/>
     <rect x="-30" y="-12" width="60" height="3" fill="#2a3550" opacity=".3"/>
     <rect x="-30" y="9"  width="60" height="3" fill="#2a3550" opacity=".3"/>`,
    [
      {x:-6, z:-2, color:'#5db86a', r:1.6}, // tunde
      {x: 8, z: 4, color:'#e07d4a', r:1.6}, // suspect
      {x: 0, z:14, color:'#5dd07a', r:2.0}, // exit van
      {x: 7.5,z:4, color:'#d8a64a', r:1.2}, // phone evidence
    ]
  );

  S.game.currentRegion = 'Lagos';
  S.game.currentSubregion = 'Ikeja Market';
  refreshHUD();
}

