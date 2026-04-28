/* =========================================================================
   NACECA · scenes/asaba.js
   Mission 6 — "The Disappeared"
   Delta · Asaba commercial warehouse · interior + loading bay · late afternoon

   Core mechanic: forced choice. The runner (a fixer named Ifeanyi) sprints for
   the loading bay the moment the player breaches; the hostage (a kidnapped
   accountant named Tobi) is bound and gagged in a side office that's filling
   with smoke from a panicked arsonist's distraction. The player cannot do both.
   Whichever they pick changes the headline, the reputation hit, and which lead
   carries forward into Mission 7.
   ========================================================================= */

function buildSceneAsaba(){
  const scene = newScene({bg:'#1a1814', fog:'#2a2418'});
  scene.fog.near = 14; scene.fog.far = 50;
  // late-afternoon warm interior — light leaking from skylights and cracked roof panels
  scene.add(new THREE.AmbientLight('#5a4a3a', 0.55));
  const sun = addSun(scene, '#ffb878', 0.7, new THREE.Vector3(6, 12, 4));
  // single industrial overhead bulb — buzzy yellow
  const bulb = new THREE.PointLight('#ffd078', 1.1, 22);
  bulb.position.set(0, 6.5, 0); scene.add(bulb);
  // a second cooler one over the loading bay (cool exterior light bleeding in)
  const bayLight = new THREE.PointLight('#a8c0d8', 0.8, 18);
  bayLight.position.set(10, 5, -2); scene.add(bayLight);

  // ===== concrete floor =====
  addTexturedGround(scene, asphaltTexture(), 60, '#2a261e');

  // ===== warehouse shell — corrugated metal walls, crossbeam roof =====
  const wallMat = toonMat('#3a342a');
  // back wall (with a narrow band of high-up windows)
  const back = new THREE.Mesh(new THREE.BoxGeometry(28, 8, 0.4), wallMat);
  back.position.set(0, 4, -8); scene.add(back); outline(back, 1.02);
  // left side wall
  const leftW = new THREE.Mesh(new THREE.BoxGeometry(0.4, 8, 16), wallMat);
  leftW.position.set(-14, 4, 0); scene.add(leftW); outline(leftW, 1.02);
  // right wall — broken-open into the loading bay
  const rightW = new THREE.Mesh(new THREE.BoxGeometry(0.4, 8, 9), wallMat);
  rightW.position.set(14, 4, 3.5); scene.add(rightW); outline(rightW, 1.02);
  // roof beams (visible cross-trusses)
  for(let i=-12;i<=12;i+=4){
    const beam = new THREE.Mesh(new THREE.BoxGeometry(28, 0.2, 0.4), toonMat('#2a261e'));
    beam.position.set(0, 7.4, i*0.5);
    if(Math.abs(i)>10) continue;
    scene.add(beam); outline(beam, 1.04);
  }
  // skylight panels — bright planes, additive
  for(let i=-8;i<=8;i+=4){
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(2, 1.8), new THREE.MeshBasicMaterial({
      color:0xffd890, transparent:true, opacity:0.55, blending:THREE.AdditiveBlending, depthWrite:false
    }));
    sky.position.set(i, 7.55, 0);
    sky.rotation.x = -Math.PI/2;
    scene.add(sky);
    // god ray dropping from each
    addGodRay(scene, i, 6.5, 0, 1.6, 0, 6, '#ffd890', 0.16, Math.random()*Math.PI);
  }

  // ===== loading bay opening (right side) — bright outside =====
  // the broken-out section of right wall: just leave it open from z=-1 to z=8
  // backdrop "outside" plane — pale blue dusty sky
  const outside = new THREE.Mesh(new THREE.PlaneGeometry(20, 8), new THREE.MeshBasicMaterial({
    color:0xa8b8c8, transparent:true, opacity:0.85
  }));
  outside.position.set(14.2, 4, -2); outside.rotation.y = -Math.PI/2; scene.add(outside);

  // ===== central pallet stacks of crates (cover for the runner's path) =====
  function crateStack(x, z, h){
    for(let i=0;i<h;i++){
      const w = 1.2 + (Math.random()-0.5)*0.1;
      const d = 1.0 + (Math.random()-0.5)*0.1;
      const colors = ['#7a4a28', '#8a5a30', '#6a3818', '#7a3a18'];
      const c = new THREE.Mesh(new THREE.BoxGeometry(w, 0.95, d), toonMat(colors[i%colors.length]));
      c.position.set(x + (Math.random()-0.5)*0.05, 0.475 + i*0.96, z);
      c.castShadow = true; scene.add(c); outline(c, 1.04);
      // simple stencil — emissive plane on the front face
      if(Math.random()<0.6){
        const stencil = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.18), basicMat('#d8a64a'));
        stencil.position.set(c.position.x, c.position.y + 0.1, z + 0.51);
        scene.add(stencil);
      }
    }
  }
  crateStack(-6,  2, 3);
  crateStack(-3, -3, 2);
  crateStack( 1,  1, 4);
  crateStack( 4, -3, 3);
  crateStack( 7,  3, 2);
  crateStack(10, -1, 2);

  // a tipped-over crate (chaos)
  const tipped = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.95, 1.0), toonMat('#7a4a28'));
  tipped.position.set(-4, 0.5, 6); tipped.rotation.z = Math.PI/3;
  scene.add(tipped); outline(tipped, 1.04);
  // spilled SIM cards (scatter of small white slivers)
  for(let i=0;i<24;i++){
    const sim = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.18), basicMat('#fff0d8'));
    sim.position.set(-4 + (Math.random()-0.5)*2.4, 0.02, 6 + (Math.random()-0.5)*2.4);
    sim.rotation.x = -Math.PI/2; sim.rotation.z = Math.random()*Math.PI;
    scene.add(sim);
  }

  // ===== side office — where the hostage is =====
  // plywood-walled cube against the back-left corner
  const offMat = toonMat('#5a4a3a');
  const offW = 5, offD = 4, offH = 3.2;
  // back wall already covers; just need front face + side
  const offFront = new THREE.Mesh(new THREE.BoxGeometry(offW, offH, 0.2), offMat);
  offFront.position.set(-9.5, offH/2, -4); scene.add(offFront); outline(offFront, 1.03);
  const offSide = new THREE.Mesh(new THREE.BoxGeometry(0.2, offH, offD), offMat);
  offSide.position.set(-7, offH/2, -6); scene.add(offSide); outline(offSide, 1.03);
  // door — partly open (gap)
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, offH-0.2, 0.18), toonMat('#3a2818'));
  door.position.set(-8.4, offH/2, -3.92);
  door.rotation.y = Math.PI/8; // ajar
  scene.add(door); outline(door, 1.04);
  // smoke pouring out of the office (scripted — animated in atmosphere update)
  const smokeTex = makeSmokeTexture();
  const officeSmoke = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 4.5), new THREE.MeshBasicMaterial({
    map:smokeTex, transparent:true, opacity:0.6, depthWrite:false, blending:THREE.AdditiveBlending
  }));
  officeSmoke.position.set(-8.5, 3.5, -3.6); officeSmoke.userData._smoke = true;
  scene.add(officeSmoke);
  // glow inside the office (the fire)
  const fireGlow = new THREE.PointLight('#ff6028', 1.4, 8);
  fireGlow.position.set(-9.5, 1.5, -5.5); scene.add(fireGlow);

  // ===== loading bay van (the runner's getaway, parked outside) =====
  const van = new THREE.Group();
  // body
  const vanBody = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.8, 4.2), toonMat('#8a8a8a'));
  vanBody.position.set(0, 1.3, 0); van.add(vanBody); outline(vanBody, 1.04);
  // cab
  const vanCab = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.4, 1.4), toonMat('#7a7a7a'));
  vanCab.position.set(0, 1.6, 1.7); van.add(vanCab); outline(vanCab, 1.04);
  // windshield (dark)
  const vanWS = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.8), basicMat('#0a0a0a'));
  vanWS.position.set(0, 1.9, 2.41); van.add(vanWS);
  // wheels
  for(const wx of [-1.0, 1.0]){
    for(const wz of [-1.4, 1.4]){
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.32, 12), toonMat('#1a1a1a'));
      wheel.position.set(wx, 0.45, wz); wheel.rotation.z = Math.PI/2;
      van.add(wheel); outline(wheel, 1.05);
    }
  }
  van.position.set(17, 0, -1); van.rotation.y = -Math.PI/2;
  scene.add(van);

  // ===== player + NPCs =====
  ENGINE.player = buildPlayerMesh();
  ENGINE.player.position.set(-12, 0, 6);
  ENGINE.player.rotation.y = Math.PI/2;
  scene.add(ENGINE.player);

  // Sgt. Uche — at the breach point with the player
  const uche = buildNPCMesh('#5a3818', '#1a2a18', '#1a2a18', '#0a0a08');
  const vest = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.45, 0.36), toonMat('#0b1a3a'));
  vest.position.y = 1.1; uche.add(vest); outline(vest, 1.04);
  uche.position.set(-13, 0, 4.5);
  uche.rotation.y = Math.PI/2;
  uche.userData._patrolBase = new THREE.Vector3(-13, 0, 4.5);
  scene.add(uche); ENGINE.npcs.push(uche);

  // Ifeanyi — the runner. Initially behind the central crate stack, positioned to sprint to van.
  const runner = buildNPCMesh('#5a3818', '#c84a3a', '#1a1a1a', '#0a0a08');  // red shirt — visually pop
  runner.position.set(2, 0, 1);
  runner.rotation.y = -Math.PI/4;
  runner.userData._fled = false;
  runner.userData._caught = false;
  // give runner a unique walk update so it can sprint to the van once triggered
  runner.update = function(dt){
    const u = runner.userData;
    if(u._caught) return;
    if(u._fled){
      // sprint toward van
      const target = new THREE.Vector3(15.5, 0, -1);
      const dir = target.clone().sub(runner.position);
      const dist = dir.length();
      if(dist < 1.2){
        // reached van — disappears
        runner.visible = false;
        u._caught = false;
        u._escaped = true;
        return;
      }
      dir.normalize();
      const speed = 6.5;
      runner.position.x += dir.x * speed * dt;
      runner.position.z += dir.z * speed * dt;
      runner.rotation.y = Math.atan2(dir.x, dir.z);
      // animate run
      u.walkPhase = (u.walkPhase||0) + dt*16;
      const swing = Math.sin(u.walkPhase)*0.7;
      u.armL.rotation.x = swing;  u.armR.rotation.x = -swing;
      u.legL.rotation.x = -swing; u.legR.rotation.x =  swing;
    }
  };
  scene.add(runner); ENGINE.npcs.push(runner);

  // Tobi — the hostage, slumped in the office. Bound (dark rope at wrists/ankles).
  const tobi = buildNPCMesh('#5a3818', '#5a5a3a', '#3a3a2a', '#0a0a08');
  tobi.position.set(-10, 0, -5.5);
  tobi.rotation.y = -Math.PI/4;
  tobi.scale.y = 0.55;  // slumped
  // gag (red)
  const gag = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.16), toonMat('#c84a3a'));
  gag.position.set(0, 1.58, 0.13); tobi.add(gag);
  // ropes at wrists
  const rope = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 0.34), toonMat('#3a2818'));
  rope.position.set(0, 1.0, 0); tobi.add(rope); outline(rope, 1.05);
  tobi.userData._patrolBase = new THREE.Vector3(-10, 0, -5.5);
  tobi.userData._rescued = false;
  scene.add(tobi); ENGINE.npcs.push(tobi);

  // ===== INTERACTABLES =====
  // Sgt. Uche — pre-breach briefing
  ENGINE.interactables.push({
    mesh: uche, label:'Brief with Sgt. Uche', range:2.4,
    onInteract: ()=>{
      if(S.game._asabaBriefed){ toast('SGT. UCHE','Already briefed. Move when ready.'); return; }
      startDialogue('asaba_brief', ()=>{ S.game._asabaBriefed = true; });
    }
  });

  // Crate-stack centre — TRIGGER: stepping into the warehouse triggers the runner+fire chaos.
  // We do this via a proximity check in updateAtmosphere rather than an interactable.
  // (See updateAsabaTrigger below.)

  // Runner — chase him
  ENGINE.interactables.push({
    mesh: runner, label:'Apprehend the runner', range:3.0,
    onInteract: ()=>{
      if(!S.game._asabaTriggered){ toast('TARGET','He hasn\'t started moving yet.'); return; }
      if(runner.userData._escaped){ toast('LOST','He made the van. Gone.'); return; }
      if(runner.userData._caught){ toast('IFEANYI','Already in custody.'); return; }
      // CHOICE: this picks "chase" — Tobi is now on a timer to die from smoke
      makeAsabaChoice('chase', runner);
    }
  });

  // Tobi — rescue him
  ENGINE.interactables.push({
    mesh: tobi, label:'Rescue the hostage', range:2.4,
    onInteract: ()=>{
      if(!S.game._asabaTriggered){ toast('LOCKED','Survey the warehouse first.'); return; }
      if(tobi.userData._rescued){ toast('TOBI','Already in care of medics.'); return; }
      // CHOICE: this picks "rescue" — runner escapes
      makeAsabaChoice('rescue', tobi);
    }
  });

  // Tipped crate of SIMs — secondary evidence pickup
  ENGINE.interactables.push({
    mesh: tipped, label:'Bag spilled SIMs', range:2.0,
    onInteract: ()=>{
      if(S.game._asabaSIMs){ toast('SIMS','Already bagged.'); return; }
      S.game._asabaSIMs = true;
      collectEvidence({id:'asaba_sims', name:'24× Pre-Activated SIM Cards', xp:60});
      refreshEvidenceCount();
    }
  });

  // ===== bounds + camera + minimap =====
  ENGINE.bounds = { minX:-14, maxX:18, minZ:-7.5, maxZ:7.5 };
  ENGINE.cameraTarget = ENGINE.player;
  ENGINE.cameraYaw = -Math.PI/2;
  ENGINE.playerYaw = Math.PI/2;

  setMinimap(
    `<rect x="-14" y="-8" width="28" height="16" fill="#3a342a" stroke="#1a1814" stroke-width="0.5"/>
     <rect x="-12" y="-6" width="5" height="4" fill="#5a4a3a" stroke="#3a2a1a" stroke-width="0.4"/>
     <rect x="-7" y="0"   width="2" height="4" fill="#7a4a28"/>
     <rect x="-1" y="-1"  width="3" height="2" fill="#7a4a28"/>
     <rect x="4"  y="-3"  width="3" height="2" fill="#7a4a28"/>
     <rect x="14" y="-2"  width="6" height="3" fill="#a8b8c8" opacity="0.5"/>`,
    [
      {x:-13, z:4.5, color:'#5dd07a', r:1.4},  // uche
      {x:2,   z:1,   color:'#c84a3a', r:1.6},  // runner — pulses if triggered
      {x:-10, z:-5.5,color:'#ffd890', r:1.4},  // hostage
      {x:17,  z:-1,  color:'#a8a8a8', r:1.6},  // van
    ]
  );

  S.game.currentRegion = 'Delta';
  S.game.currentSubregion = 'Asaba · Commercial Warehouse';
  S.game.alertLevel = 1;
  refreshHUD();

  // store refs so the trigger logic can find them
  ENGINE._asabaRunner = runner;
  ENGINE._asabaHostage = tobi;
  ENGINE._asabaSmoke = officeSmoke;
  ENGINE._asabaFireLight = fireGlow;
}

/* Called from updateAtmosphere when M5 mission is currentMission and player crosses x>-8.
   Triggers the runner's flee + smoke intensification. */
function updateAsabaTrigger(dt){
  if(S.game.currentMission !== 'm6') return;
  if(!S.game._asabaBriefed) return;
  if(S.game._asabaTriggered) {
    // Hostage death timer: if player picks 'chase', a 35s smoke timer starts
    if(S.game._asabaChoice === 'chase' && !S.game._asabaHostageLost){
      S.game._asabaSmokeTimer = (S.game._asabaSmokeTimer||0) + dt;
      if(S.game._asabaSmokeTimer > 35){
        S.game._asabaHostageLost = true;
        toast('TOBI LOST','The smoke took him. The runner was the trade.', 3000);
        sfxFail();
      }
    }
    // Runner escape timer: if player picks 'rescue', runner sprints
    return;
  }
  if(!ENGINE.player) return;
  // Player has stepped past the breach point
  if(ENGINE.player.position.x > -8){
    S.game._asabaTriggered = true;
    sfxAlert();
    musicForScene('m6_chase');
    toast('CHAOS','Runner breaks for the bay. Smoke is pouring from the office.', 3000);
    // Intensify smoke
    if(ENGINE._asabaSmoke) ENGINE._asabaSmoke.material.opacity = 0.9;
    // Mark first chaos beat
    completeObjective('o1_breach');
  }
}

/* Player has chosen which way to commit. */
function makeAsabaChoice(which, target){
  if(S.game._asabaChoice) return; // already decided
  S.game._asabaChoice = which;
  S.game.moralChoices.asaba = which;

  if(which === 'chase'){
    // Runner is caught; hostage clock ticks
    target.userData._caught = true;
    target.userData._fled = false;
    target.position.set(target.position.x, 0, target.position.z);
    target.rotation.y = Math.PI; // turned around (cuffed)
    target.scale.y = 0.92;
    completeObjective('o2_runner');
    sfxComplete();
    S.game.arrests = (S.game.arrests || 0) + 1;
    applyEffect({integrity:+2, agencyFavour:+6, publicTrust:-4, intel:+12});
    collectEvidence({id:'asaba_runner', name:'Ifeanyi (Cartel Fixer) — In Custody', xp:160});
    refreshEvidenceCount();
    // Schedule the resolve dialogue after ~6s when the smoke timer continues
    setTimeout(()=>{
      if(!S.game._asabaResolved){
        S.game._asabaResolved = true;
        startDialogue(S.game._asabaHostageLost ? 'asaba_resolve_chase_lost' : 'asaba_resolve_chase');
      }
    }, 5500);
  } else {
    // Rescue — hostage saved; runner escapes
    target.userData._rescued = true;
    target.scale.y = 0.95; // sat up
    target.rotation.y = 0;
    completeObjective('o3_hostage');
    sfxEvidence();
    sfxComplete();
    S.game.civiliansRescued = (S.game.civiliansRescued || 0) + 1;
    applyEffect({integrity:+5, publicTrust:+8, agencyFavour:-3, intel:+8});
    collectEvidence({id:'asaba_hostage', name:'Tobi Onuoha (Accountant) — Recovered', xp:160});
    refreshEvidenceCount();
    // Trigger runner's flee NOW, since the player chose hostage
    if(ENGINE._asabaRunner && !ENGINE._asabaRunner.userData._caught){
      ENGINE._asabaRunner.userData._fled = true;
    }
    setTimeout(()=>{
      if(!S.game._asabaResolved){
        S.game._asabaResolved = true;
        startDialogue('asaba_resolve_rescue');
      }
    }, 4500);
  }
}
