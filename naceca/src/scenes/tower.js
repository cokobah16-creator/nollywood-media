/* =========================================================================
   NACECA · scenes/tower.js
   Mission 7 — "No Signal Zone"
   Edo · Ugbowo telecom tower compound, behind the UNIBEN back gate · dusk

   Core mechanic: trace under pressure. The site was sabotaged (fibre cut,
   diesel drained) so the kidnappers' ransom calls pass through it blind.
   Restarting the generator restores the BTS cabinet — and switches on the
   floodlights that tell the ambush team you're there. From that moment the
   player has a shrinking window to reach the cabinet and run the call trace
   before the shooters cut the power again. Then a choice under fire:
   hold the cabinet, extract the civilians, or wait for Benin Zonal.
   ========================================================================= */

function buildSceneTower(){
  const scene = newScene({bg:'#2a1f3d', fog:'#3a2a44'});
  scene.fog.near = 22; scene.fog.far = 70;
  // dusk: low orange sun, violet ambient
  scene.add(new THREE.AmbientLight('#4a3a5a', 0.6));
  addSun(scene, '#ff9a5a', 0.55, new THREE.Vector3(-10, 4, 6));
  const hemi = new THREE.HemisphereLight('#5a4a7a', '#2a2018', 0.35); scene.add(hemi);

  // ===== ground — laterite gravel =====
  addTexturedGround(scene, asphaltTexture(), 90, '#6a4a34');

  // ===== compound wall (concrete, 2.2m) with a south gate gap =====
  const wallMat = toonMat('#8a8070');
  function wallSeg(x,z,w,d){ const m = new THREE.Mesh(new THREE.BoxGeometry(w,2.2,d), wallMat); m.position.set(x,1.1,z); m.castShadow=true; scene.add(m); outline(m,1.02); return m; }
  wallSeg(0,-12, 30.4, 0.4);          // north
  wallSeg(-15, 0, 0.4, 24);           // west
  wallSeg(15, 0, 0.4, 24);            // east (the ambush side)
  wallSeg(-8.75, 12, 12.5, 0.4);      // south-west of gate
  wallSeg(8.75, 12, 12.5, 0.4);       // south-east of gate
  // gate pillars + open gate leaf
  for(const gx of [-2.4, 2.4]){ const p = new THREE.Mesh(new THREE.BoxGeometry(0.6,2.8,0.6), toonMat('#6a6050')); p.position.set(gx,1.4,12); scene.add(p); outline(p,1.03); }
  const gateLeaf = new THREE.Mesh(new THREE.BoxGeometry(0.12,2.2,2.0), toonMat('#3a4a5a')); gateLeaf.position.set(-2.1,1.1,13.1); gateLeaf.rotation.y = Math.PI/2.6; scene.add(gateLeaf); outline(gateLeaf,1.04);
  // razor-wire hint along the top (thin dark cylinders)
  for(let x=-14;x<=14;x+=2){ const c = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,0.5,6), basicMat('#2a2a2a')); c.position.set(x,2.4,-12); c.rotation.x=Math.PI/2; scene.add(c); }

  // ===== the mast — four tapering legs, braces, paint bands, beacon =====
  const tower = new THREE.Group();
  const H = 24, segs = 8;
  for(let s=0;s<segs;s++){
    const y0 = s*(H/segs), y1 = (s+1)*(H/segs);
    const r0 = 1.7 - s*0.14, r1 = 1.7 - (s+1)*0.14;
    const col = (s%2===0) ? '#c84a3a' : '#f0ece0';     // aviation red/white bands
    for(const sx of [-1,1]) for(const sz of [-1,1]){
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, H/segs, 0.16), toonMat(col));
      leg.position.set(sx*(r0+r1)/2, (y0+y1)/2, sz*(r0+r1)/2);
      leg.rotation.z = sx * Math.atan((r0-r1)/(H/segs)) * -1;
      leg.rotation.x = sz * Math.atan((r0-r1)/(H/segs));
      tower.add(leg);
    }
    // horizontal braces at the top of each segment
    for(const side of [[1,0],[0,1],[-1,0],[0,-1]]){
      const br = new THREE.Mesh(new THREE.BoxGeometry(side[0]?0.08:r1*2, 0.08, side[1]?0.08:r1*2), toonMat('#3a3a3a'));
      br.position.set(side[0]*r1, y1, side[1]*r1); tower.add(br);
      const dg = new THREE.Mesh(new THREE.BoxGeometry(side[0]?0.06:r1*2.3, 0.06, side[1]?0.06:r1*2.3), toonMat('#3a3a3a'));
      dg.position.set(side[0]*(r0+r1)/2, (y0+y1)/2, side[1]*(r0+r1)/2);
      if(side[0]) dg.rotation.x = Math.PI/4; else dg.rotation.z = Math.PI/4;
      tower.add(dg);
    }
  }
  // antenna panels + dishes
  for(let i=0;i<3;i++){
    const a = i*(Math.PI*2/3);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.5,1.6,0.14), toonMat('#e8e8e0'));
    panel.position.set(Math.sin(a)*1.0, H-1.2, Math.cos(a)*1.0); panel.rotation.y = a; tower.add(panel); outline(panel,1.04);
  }
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.6,0.1,16), toonMat('#d8d8d0'));
  dish.position.set(0.9, H-5, 0.9); dish.rotation.z = Math.PI/2; dish.rotation.y = -Math.PI/4; tower.add(dish); outline(dish,1.04);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.28,10,8), new THREE.MeshBasicMaterial({color:0xff3030}));
  beacon.position.set(0, H+0.4, 0); beacon.visible = false; tower.add(beacon);
  const beaconLight = new THREE.PointLight('#ff4040', 0, 14); beaconLight.position.set(0,H+0.4,0); tower.add(beaconLight);
  tower.position.set(6, 0, -4); scene.add(tower);
  // concrete footing
  const footing = new THREE.Mesh(new THREE.BoxGeometry(4.6,0.3,4.6), toonMat('#9a9284')); footing.position.set(6,0.15,-4); scene.add(footing); outline(footing,1.02);

  // ===== generator hut + genset + drums =====
  const hut = new THREE.Mesh(new THREE.BoxGeometry(4.2,2.6,3.2), toonMat('#7a6a58')); hut.position.set(-9,1.3,-7); hut.castShadow=true; scene.add(hut); outline(hut,1.03);
  const hutRoof = new THREE.Mesh(new THREE.BoxGeometry(4.6,0.16,3.6), toonMat('#4a3a2a')); hutRoof.position.set(-9,2.68,-7); scene.add(hutRoof); outline(hutRoof,1.03);
  const hutDoor = new THREE.Mesh(new THREE.PlaneGeometry(1.0,2.0), basicMat('#1a1410')); hutDoor.position.set(-8.2,1.0,-5.38); scene.add(hutDoor);
  const gen = new THREE.Mesh(new THREE.BoxGeometry(1.7,1.2,2.4), toonMat('#3a5a3a')); gen.position.set(-9,0.6,-3.2); gen.castShadow=true; scene.add(gen); outline(gen,1.04);
  const genPanel = new THREE.Mesh(new THREE.PlaneGeometry(0.5,0.35), basicMat('#101410')); genPanel.position.set(-8.14,0.9,-3.2); genPanel.rotation.y = Math.PI/2; scene.add(genPanel);
  const genLamp = new THREE.Mesh(new THREE.CircleGeometry(0.06,8), new THREE.MeshBasicMaterial({color:0x40ff60})); genLamp.position.set(-8.13,1.0,-3.0); genLamp.rotation.y = Math.PI/2; genLamp.visible=false; scene.add(genLamp);
  const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.09,1.4,8), toonMat('#2a2a2a')); exhaust.position.set(-9.5,1.8,-4.2); scene.add(exhaust);
  for(const [dx,dz] of [[-12.5,-3],[-12.5,-1.6],[-11.3,-2.3]]){
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.42,0.42,1.0,12), toonMat(dx<-12?'#2a4a8a':'#c84a3a')); drum.position.set(dx,0.5,dz); drum.castShadow=true; scene.add(drum); outline(drum,1.04);
  }
  // a tipped drum — drained
  const spill = new THREE.Mesh(new THREE.CircleGeometry(1.2,16), new THREE.MeshBasicMaterial({color:0x1a1410, transparent:true, opacity:.7})); spill.position.set(-11.6,0.02,-0.2); spill.rotation.x=-Math.PI/2; scene.add(spill);
  const tipped = new THREE.Mesh(new THREE.CylinderGeometry(0.42,0.42,1.0,12), toonMat('#2a4a8a')); tipped.position.set(-11.2,0.42,0.4); tipped.rotation.z = Math.PI/2; tipped.rotation.y = 0.6; scene.add(tipped); outline(tipped,1.04);

  // ===== BTS cabinets (the trace point) =====
  const cab = new THREE.Group();
  for(const cx of [0, 1.5]){
    const c = new THREE.Mesh(new THREE.BoxGeometry(1.2,1.9,0.9), toonMat('#9aa0a8')); c.position.set(cx,0.95,0); c.castShadow=true; cab.add(c); outline(c,1.03);
    const vent = new THREE.Mesh(new THREE.PlaneGeometry(0.9,0.5), basicMat('#5a6068')); vent.position.set(cx,1.5,0.46); cab.add(vent);
  }
  const cabLed = new THREE.Mesh(new THREE.PlaneGeometry(0.5,0.08), new THREE.MeshBasicMaterial({color:0x40c0ff})); cabLed.position.set(0,0.5,0.46); cabLed.visible=false; cab.add(cabLed);
  cab.position.set(9,0,2); cab.rotation.y = -Math.PI/2; scene.add(cab);
  const cabPad = new THREE.Mesh(new THREE.BoxGeometry(2.2,0.2,3.6), toonMat('#9a9284')); cabPad.position.set(9,0.1,2.7); scene.add(cabPad); outline(cabPad,1.02);

  // ===== fibre junction box with cut cables =====
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.18,1.3,0.18), toonMat('#5a5a5a')); post.position.set(-12,0.65,5); scene.add(post);
  const jbox = new THREE.Mesh(new THREE.BoxGeometry(0.7,0.9,0.4), toonMat('#5a6a40')); jbox.position.set(-12,1.4,5); scene.add(jbox); outline(jbox,1.04);
  for(let i=0;i<5;i++){
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,1.6+Math.random(),6), basicMat(i%2?'#101010':'#e07020'));
    cable.position.set(-12+(Math.random()-0.5)*1.6, 0.04, 5.6+(Math.random()-0.5)*1.6); cable.rotation.z = Math.PI/2; cable.rotation.y = Math.random()*Math.PI; scene.add(cable);
  }

  // ===== security hut by the gate + service pickup =====
  const sec = new THREE.Mesh(new THREE.BoxGeometry(2.4,2.4,2.4), toonMat('#8a7a68')); sec.position.set(5,1.2,9.6); sec.castShadow=true; scene.add(sec); outline(sec,1.03);
  const secWin = new THREE.Mesh(new THREE.PlaneGeometry(1.2,0.7), basicMat('#141c28')); secWin.position.set(5,1.5,8.38); scene.add(secWin);
  const truck = new THREE.Group();
  const bed = new THREE.Mesh(new THREE.BoxGeometry(2.0,0.9,4.4), toonMat('#f0ece0')); bed.position.set(0,1.0,0); truck.add(bed); outline(bed,1.04);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.9,1.1,1.6), toonMat('#e8e4d8')); cabin.position.set(0,1.95,1.0); truck.add(cabin); outline(cabin,1.04);
  const ws = new THREE.Mesh(new THREE.PlaneGeometry(1.5,0.7), basicMat('#0a0a0a')); ws.position.set(0,2.1,1.81); truck.add(ws);
  for(const wx of [-0.95,0.95]) for(const wz of [-1.4,1.3]){ const w = new THREE.Mesh(new THREE.CylinderGeometry(0.42,0.42,0.3,12), toonMat('#1a1a1a')); w.position.set(wx,0.42,wz); w.rotation.z=Math.PI/2; truck.add(w); outline(w,1.05); }
  truck.position.set(-5,0,6); truck.rotation.y = Math.PI/9; scene.add(truck);

  // ===== floodlight poles (dead until the gen runs) =====
  const floods = [];
  for(const [fx,fz] of [[-12.5,-10.5],[12.5,9.5]]){
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.14,7,8), toonMat('#4a4a4a')); pole.position.set(fx,3.5,fz); scene.add(pole);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.6,0.3,0.4), toonMat('#2a2a2a')); head.position.set(fx,7.1,fz); scene.add(head);
    const lamp = new THREE.PointLight('#fff2cc', 0, 26); lamp.position.set(fx,6.8,fz); scene.add(lamp);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.6,0.3), new THREE.MeshBasicMaterial({color:0xfff2cc})); glow.position.set(fx,6.9,fz + (fz<0?0.22:-0.22)); glow.visible=false; glow.rotation.y = fz<0?0:Math.PI; scene.add(glow);
    floods.push({lamp, glow});
  }

  // ===== beyond the wall: UNIBEN blocks to the north, neem trees, bush =====
  addBuilding(scene, -18, -22, 10, 7, 8, '#8a7a6a', '#4a3a2a', '#ffd890');
  addBuilding(scene,  -4, -24, 12, 9, 8, '#9a8a78', '#4a3a2a', '#ffd890');
  addBuilding(scene,  12, -23, 9, 6, 8, '#8a7a6a', '#4a3a2a', '#ffd890');
  addBuilding(scene,  26, -16, 8, 5, 7, '#7a6a5a', '#4a3a2a', '#ffd890');
  addBuilding(scene, -26,  6, 7, 5, 7, '#7a6a5a', '#4a3a2a', '#ffd890');
  if(typeof addTree === 'function'){
    addTree(scene, -19, -4, 1.1); addTree(scene, -21, 8, 0.9); addTree(scene, 20, -10, 1.0); addTree(scene, 22, 4, 1.2); addTree(scene, -8, 17, 1.0); addTree(scene, 10, 17, 0.9);
  }
  addDustMotes(scene, 80, 26, 6, 22, '#d8b890');

  // ===== ambush team — east fence line, hidden until the lights come on =====
  const ambushers = [];
  for(const [ax,az] of [[17.5,-6],[18.5,0.5],[17.5,6]]){
    const a = buildNPCMesh('#3a2a1a', '#1a1a1a', '#1a1a1a', '#0a0a08', {hair:'mask', capColor:'#141414', longSleeve:true});
    a.position.set(ax,0,az); a.rotation.y = -Math.PI/2; a.visible = false; a.scale.y = 0.8;  // crouched
    const flash = new THREE.Mesh(new THREE.PlaneGeometry(0.5,0.5), new THREE.MeshBasicMaterial({color:0xffd080, transparent:true, opacity:.95, blending:THREE.AdditiveBlending, depthWrite:false}));
    flash.position.set(-0.5,1.25,0.1); flash.visible=false; a.add(flash);
    const fl = new THREE.PointLight('#ffb060', 0, 9); fl.position.set(-0.6,1.3,0); a.add(fl);
    a.userData._flash = flash; a.userData._fl = fl; a.userData._t = Math.random()*2;
    scene.add(a); ENGINE.npcs.push(a); ambushers.push(a);
  }
  // tracer rounds — reused thin boxes
  const tracers = [];
  for(let i=0;i<4;i++){
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.05,0.05,2.2), new THREE.MeshBasicMaterial({color:0xffe0a0, transparent:true, opacity:.9}));
    t.visible=false; scene.add(t); tracers.push(t);
  }

  // ===== people =====
  ENGINE.player = buildPlayerMesh();
  ENGINE.player.position.set(-1.5, 0, 9);
  ENGINE.player.rotation.y = Math.PI;
  scene.add(ENGINE.player);

  const uche = buildNPCMesh('#5a3818', '#1a2a18', '#1a2a18', '#0a0a08', {hair:'crop', beard:true, longSleeve:true});
  addVest(uche, '#0b1a3a');
  uche.position.set(-3.6,0,9.4); uche.rotation.y = Math.PI*0.8; uche.userData._patrolBase = uche.position.clone();
  scene.add(uche); ENGINE.npcs.push(uche);

  const osaro = buildNPCMesh('#5a3818', '#e8a030', '#2a3a5a', '#0a0a08', {hair:'crop', longSleeve:true});   // hi-vis vest
  const hardhat = new THREE.Mesh(new THREE.SphereGeometry(0.19,12,8,0,Math.PI*2,0,Math.PI/2), toonMat('#f0e020')); hardhat.position.y=1.71; osaro.add(hardhat); outline(hardhat,1.05);
  osaro.position.set(-6.8,0,-4.6); osaro.rotation.y = Math.PI/2; osaro.userData._patrolBase = osaro.position.clone();
  scene.add(osaro); ENGINE.npcs.push(osaro);

  const mother = buildNPCMesh('#5a3818', '#8a3a8a', '#d8a64a', '#0a0a08', {female:true, hair:'gele', capColor:'#d8a64a', robe:'#8a3a8a', robeTrim:'#d8a64a'});  // patterned wrapper + gold scarf
  
  mother.position.set(1.6,0,13.6); mother.rotation.y = Math.PI; mother.userData._patrolBase = mother.position.clone();
  scene.add(mother); ENGINE.npcs.push(mother);

  // ===== interactables =====
  ENGINE.interactables.push({
    mesh: uche, label:'Brief with Sgt. Uche', range:2.4,
    onInteract: ()=>{
      if(S.game._towerBriefed){ toast('SGT. UCHE','Briefed. Find the engineer — generator hut, north-west.'); return; }
      const asaba = S.game.moralChoices && S.game.moralChoices.asaba;
      const key = asaba==='rescue' ? 'tower_brief_rescue' : asaba==='chase' ? 'tower_brief_chase' : 'tower_brief_cold';
      startDialogue(key, ()=>{ S.game._towerBriefed = true; completeObjective('o1_brief'); showPrompt('<span class="opt"><span class="key">E</span> Find Engr. Osaro by the generator hut</span>'); });
    }
  });
  ENGINE.interactables.push({
    mesh: mother, label:'Speak with Mrs. Ehigie', range:2.4,
    onInteract: ()=>{
      if(S.game._towerMother){ toast('MRS. EHIGIE','She is watching the gate. She will not leave.'); return; }
      startDialogue('tower_mother', ()=>{ S.game._towerMother = true; });
    }
  });
  ENGINE.interactables.push({
    mesh: osaro, label:'Speak with Engr. Osaro', range:2.6,
    onInteract: ()=>{
      if(!S.game._towerBriefed){ toast('HOLD','Brief with Sgt. Uche first.'); return; }
      if(S.game._towerEngineer){ toast('ENGR. OSARO','Red lever, then the green button. I\'ll watch the battery readout.'); return; }
      startDialogue('tower_engineer', ()=>{ S.game._towerEngineer = true; });
    }
  });
  ENGINE.interactables.push({
    mesh: gen, label:'Restart the generator', range:2.4,
    onInteract: ()=>{
      if(!S.game._towerEngineer){ toast('GENERATOR','Dead panel. Get the site engineer to walk you through it.'); return; }
      if(S.game._towerPower){ toast('GENERATOR','Running. Diesel for maybe an hour.'); return; }
      towerPowerOn();
    }
  });
  ENGINE.interactables.push({
    mesh: jbox, label:'Photograph the cut fibre', range:2.2,
    onInteract: ()=>{
      if(!S.game._towerBriefed){ toast('HOLD','Brief with Sgt. Uche first.'); return; }
      if(S.game._towerFibre){ toast('FIBRE','Already logged. Clean cuts — a cutlass, not a fault.'); return; }
      S.game._towerFibre = true;
      collectEvidence({id:'tower_fibre', name:'Severed Fibre Backhaul — Cutlass Marks', xp:70});
      refreshEvidenceCount();
      applyEffect({intel:+6});
    }
  });
  ENGINE.interactables.push({
    mesh: cab, label:'Run the call trace', range:2.6,
    onInteract: ()=>{
      if(!S.game._towerPower){ toast('NO POWER','The cabinet is dark. Restart the generator first.'); return; }
      if(S.game._towerExpired){ toast('DEAD CABINET','They cut the power. The trace window is gone.'); return; }
      if(S.game._towerTraced){ toast('TRACE','Already logged. Decide with Uche.'); return; }
      openPuzzle('tower_call_trace', (ok)=>{
        if(!ok) return;
        S.game._towerTraced = true;
        completeObjective('o4_trace');
        refreshEvidenceCount();
        setTimeout(()=>{ if(!S.game._towerDecided) startDialogue('tower_ambush'); }, 900);
      });
    }
  });

  ENGINE.bounds = { minX:-14.4, maxX:14.4, minZ:-11.4, maxZ:15.5 };
  ENGINE.cameraTarget = ENGINE.player;
  ENGINE.cameraYaw = Math.PI;
  ENGINE.playerYaw = Math.PI;

  setMinimap(
    `<rect x="-15" y="-12" width="30" height="24" fill="#6a4a34" stroke="#f0ece0" stroke-width="0.6"/>
     <rect x="-11.2" y="-8.6" width="4.4" height="3.2" fill="#7a6a58"/>
     <rect x="8.2" y="1" width="1.8" height="3.6" fill="#9aa0a8"/>
     <rect x="3.8" y="8.4" width="2.4" height="2.4" fill="#8a7a68"/>
     <line x1="-2.4" y1="12" x2="2.4" y2="12" stroke="#3a4a5a" stroke-width="1.2"/>
     <polygon points="6,-6 8,-2 4,-2" fill="#c84a3a"/>`,
    [
      {x:-3.6, z:9.4,  color:'#5dd07a', r:1.4},   // uche
      {x:-6.8, z:-4.6, color:'#f0e020', r:1.4},   // engineer
      {x:-9,   z:-3.2, color:'#3a9a3a', r:1.4},   // generator
      {x:9,    z:2,    color:'#40c0ff', r:1.6},   // BTS cabinet
      {x:-12,  z:5,    color:'#e07020', r:1.2},   // cut fibre
      {x:1.6,  z:13.6, color:'#d8a64a', r:1.2},   // mrs ehigie
    ]
  );

  S.game.currentRegion = 'Edo';
  S.game.currentSubregion = 'Ugbowo · Telecom Tower';
  S.game.alertLevel = 1;
  refreshHUD();

  ENGINE._tower = { beacon, beaconLight, genLamp, cabLed, floods, ambushers, tracers, t:0, exhaust };
  showPrompt('<span class="opt"><span class="key">E</span> Brief with Sgt. Uche at the gate</span>');
}

/* Generator restart: lights, cabinet, then the ambush a few seconds later. */
function towerPowerOn(){
  const T = ENGINE._tower; if(!T) return;
  S.game._towerPower = true;
  S.game._towerAmbushDelay = 4.5;
  S.game._towerWindow = 75;
  sfxComplete();
  toast('GENERATOR RUNNING','Floodlights up. Cabinet booting. You are visible now.', 2600);
  completeObjective('o3_power');
  T.genLamp.visible = true; T.cabLed.visible = true; T.beacon.visible = true;
  T.floods.forEach(f=>{ f.lamp.intensity = 1.15; f.glow.visible = true; });
  if(ENGINE.scene){ ENGINE.scene.add(new THREE.AmbientLight('#404860', 0.15)); }
  showPrompt('<span class="opt"><span class="key">E</span> Run the call trace at the BTS cabinet — east side</span>');
}

/* Power cut: the window closed before the trace was written. */
function towerPowerCut(){
  const T = ENGINE._tower; if(!T) return;
  S.game._towerExpired = true;
  T.genLamp.visible = false; T.cabLed.visible = false; T.beacon.visible = false; T.beaconLight.intensity = 0;
  T.floods.forEach(f=>{ f.lamp.intensity = 0; f.glow.visible = false; });
  sfxFail();
  toast('POWER CUT','They hit the generator. The cabinet is dead.', 3000);
  setTimeout(()=>{ if(!S.game._towerDecided && !isOverlayOpen()) startDialogue('tower_power_cut'); else S.game._towerCutPending = true; }, 1400);
}

/* Per-frame hook — called from updateAtmosphere while M7 is the current mission. */
function updateTowerTrigger(dt){
  if(S.game.currentMission !== 'm7') return;
  const T = ENGINE._tower; if(!T) return;
  T.t += dt;

  // beacon blink + generator shiver while powered
  if(S.game._towerPower && !S.game._towerExpired){
    const on = (T.t % 1.4) < 0.18;
    T.beacon.visible = on; T.beaconLight.intensity = on ? 1.4 : 0;
    T.exhaust.position.y = 1.8 + Math.sin(T.t*40)*0.006;
  }

  // a deferred power-cut dialogue (player was in another screen when it fired)
  if(S.game._towerCutPending && !isOverlayOpen() && !S.game._towerDecided){
    S.game._towerCutPending = false; startDialogue('tower_power_cut'); return;
  }

  if(isOverlayOpen()) return;   // the clock stops while a screen is open

  // lights on → ambush after a short delay
  if(S.game._towerPower && !S.game._towerAmbush){
    S.game._towerAmbushDelay -= dt;
    if(S.game._towerAmbushDelay <= 0){
      S.game._towerAmbush = true;
      S.game.alertLevel = 2; refreshHUD();
      sfxAlert();
      musicForScene('m7_ambush');
      toast('AMBUSH','Muzzle flashes along the east fence. They were waiting for the lights.', 3200);
      T.ambushers.forEach(a=>a.visible = true);
      if(typeof shakeCamera==='function') shakeCamera(0.3); if(typeof haptic==='function') haptic([60,40,60]);
    }
  }

  // the trace window
  if(S.game._towerAmbush && !S.game._towerTraced && !S.game._towerExpired){
    S.game._towerWindow -= dt * (typeof timerRate==='function' ? timerRate() : 1);
    if(S.game._towerWindow <= 30 && !S.game._towerWarn30){ S.game._towerWarn30 = true; toast('30 SECONDS','They are working toward the generator hut.', 2200); }
    if(S.game._towerWindow <= 10 && !S.game._towerWarn10){ S.game._towerWarn10 = true; toast('10 SECONDS','Get to the cabinet.', 1800); sfxAlert(); }
    if(S.game._towerWindow <= 0){ towerPowerCut(); }
  }

  // muzzle flashes + tracers while the fight is live
  const live = S.game._towerAmbush && !S.game._towerDecided;
  T.ambushers.forEach((a,i)=>{
    const u = a.userData;
    u._t -= dt;
    if(live && u._t <= 0){
      u._t = 0.25 + Math.random()*1.4;
      u._flash.visible = true; u._fl.intensity = 2.2;
      u._flashOff = 0.07;
      const tr = T.tracers[i % T.tracers.length];
      tr.visible = true; tr.position.set(a.position.x - 1.2, 1.25, a.position.z);
      tr.lookAt(ENGINE.player ? ENGINE.player.position.x : 0, 1.0, ENGINE.player ? ENGINE.player.position.z : 0);
      tr.userData._life = 0.22;
    }
    if(u._flashOff != null){ u._flashOff -= dt; if(u._flashOff <= 0){ u._flash.visible = false; u._fl.intensity = 0; u._flashOff = null; } }
    if(!live){ u._flash.visible = false; u._fl.intensity = 0; }
  });
  T.tracers.forEach(tr=>{
    if(!tr.visible) return;
    tr.userData._life -= dt;
    tr.translateZ(26*dt);
    if(tr.userData._life <= 0) tr.visible = false;
  });
}
