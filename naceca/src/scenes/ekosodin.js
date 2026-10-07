/* =========================================================================
   NACECA · scenes/ekosodin.js
   Mission 8 — "The Voice" (Season 1 finale)
   Edo · Ekosodin, north of the UNIBEN fence · night

   One reveal, three approaches. The Mission 7 result decides how Kelechi
   finds the house; every route ends at the blue gate on Akintola Close,
   with Osas in the boys' quarters and the Voice on her way.
     A  hold                      → planned raid on the known house
     B  extract / backup          → tail the courier on foot, unseen
     C  cut_* / anything else     → take the evening call in the van and
                                    keep the Voice talking until the trace locks
   ========================================================================= */

function finaleRoute(){
  const t = S.game.moralChoices && S.game.moralChoices.tower;
  if(t === 'hold') return 'A';
  if(t === 'extract' || t === 'backup') return 'B';
  return 'C';
}
function kcIsFair(){ const m = S.game.moralChoices || {}; return m.market_runner === 'caught' && m.choice !== 'force'; }
function musaGaveTip(){ const f = S.game.flags || {}, m = S.game.moralChoices || {}; return !!f.musa_tip || m.checkpoint === 'flip_driver'; }

function buildSceneEkosodinLegacy(){
  const scene = newScene({bg:'#0a0f1e', fog:'#121a2e'});
  scene.fog.near = 16; scene.fog.far = 60;
  scene.add(new THREE.AmbientLight('#3a4a6a', 0.55));
  addSun(scene, '#7a8ab8', 0.35, new THREE.Vector3(6, 10, 4));   // moonlight
  scene.add(new THREE.HemisphereLight('#2a3450', '#1a140e', 0.3));

  addTexturedGround(scene, asphaltTexture(), 90, '#4a3426');      // laterite
  // the close: a paved strip with drains either side
  const road = new THREE.Mesh(new THREE.BoxGeometry(44, 0.02, 5.4), toonMat('#2a2a2e')); road.position.set(0, 0.01, 0); scene.add(road);
  for(const dz of [-2.95, 2.95]){ const d = new THREE.Mesh(new THREE.BoxGeometry(44, 0.05, 0.5), toonMat('#1a1a1a')); d.position.set(0, 0.03, dz); scene.add(d); }

  // ===== houses along the close (bungalows with zinc roofs) =====
  const houseCols = ['#c8b8a0','#a8b8a8','#d8c8b0','#b8a890','#c0b0c8','#a8a090'];
  function bungalow(x, z, w, d, col, faceNorth){
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, 2.8, d), toonMat(col)); b.position.set(x, 1.4, z); b.castShadow = true; scene.add(b); outline(b, 1.02);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(w+0.6, 0.18, d+0.6), toonMat('#7a8088')); roof.position.set(x, 2.95, z); roof.rotation.x = faceNorth ? 0.06 : -0.06; scene.add(roof); outline(roof, 1.02);
    const winZ = z + (faceNorth ? d/2+0.01 : -d/2-0.01);
    for(const wx of [-w/4, w/4]){ const win = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.7), basicMat(Math.random()<0.6 ? '#ffd890' : '#141c28')); win.position.set(x+wx, 1.6, winZ); if(!faceNorth) win.rotation.y = Math.PI; scene.add(win); }
    addObstacle(x, z, w, d);
  }
  bungalow(-14, -8, 6, 5, houseCols[0], true);
  bungalow(-6, -8.5, 6, 5, houseCols[1], true);
  bungalow(2, -8, 6, 5, houseCols[2], true);
  bungalow(-14, 8, 6, 5, houseCols[3], false);
  bungalow(-5, 8.5, 6, 5, houseCols[4], false);
  bungalow(4, 8, 6, 5, houseCols[5], false);
  bungalow(13, 8.5, 6, 5, houseCols[0], false);

  // ===== the blue-gate house (two storeys) + compound wall + boys' quarters =====
  const H = { x:14, z:-10 };
  const main = new THREE.Mesh(new THREE.BoxGeometry(7, 5.4, 5), toonMat('#b8b0a0')); main.position.set(H.x, 2.7, H.z); main.castShadow = true; scene.add(main); outline(main, 1.02);
  const mroof = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.2, 5.6), toonMat('#5a3a2a')); mroof.position.set(H.x, 5.5, H.z); scene.add(mroof); outline(mroof, 1.02);
  for(const [wx,wy] of [[-2,1.6],[2,1.6],[-2,4],[2,4]]){ const w = new THREE.Mesh(new THREE.PlaneGeometry(1,0.8), basicMat(wy>3 ? '#ffcf70' : '#141c28')); w.position.set(H.x+wx, wy, H.z+2.51); scene.add(w); }
  addObstacle(H.x, H.z, 7, 5);
  const wallMat = toonMat('#8a8478');
  const wall = (x,z,w,d)=>{ const m = new THREE.Mesh(new THREE.BoxGeometry(w, 2.2, d), wallMat); m.position.set(x, 1.1, z); m.castShadow = true; scene.add(m); outline(m, 1.02); addObstacle(x, z, w, d); return m; };
  // compound: x 9.5..19.5, z -15..-5.6 ; front gate gap at x 13..15 (z -5.6), back gate gap at x 18.5..19.5 side (z -13)
  wall(10.75, -5.6, 2.5, 0.3); wall(17.25, -5.6, 4.5, 0.3);      // front, gap 12..15
  wall(9.5, -10.3, 0.3, 9.4);                                     // west
  wall(19.5, -7.8, 0.3, 4.4); wall(19.5, -14.2, 0.3, 1.6);        // east, gap z -12.5..-10.0 (back gate)
  wall(14.5, -15, 10.3, 0.3);                                      // north
  const gateL = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.0, 0.12), toonMat('#2a5aa8')); gateL.position.set(12.75, 1.0, -5.6); scene.add(gateL); outline(gateL, 1.04);
  const gateR = gateL.clone(); gateR.position.x = 14.25; scene.add(gateR); outline(gateR, 1.04);
  const backGate = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.0, 2.4), toonMat('#4a4a4a')); backGate.position.set(19.5, 1.0, -11.25); scene.add(backGate); outline(backGate, 1.04);
  addObstacle(13.5, -5.6, 3, 0.3);     // gate leaves block until breached
  addObstacle(19.5, -11.25, 0.3, 2.5); // back gate blocks until opened
  // boys' quarters at the back of the yard
  const bq = new THREE.Mesh(new THREE.BoxGeometry(4, 2.4, 2.4), toonMat('#9a8a70')); bq.position.set(15.5, 1.2, -13.3); scene.add(bq); outline(bq, 1.03);
  const bqDoor = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.8), basicMat('#2a1a10')); bqDoor.position.set(15.5, 0.9, -12.09); scene.add(bqDoor);
  addObstacle(15.5, -13.3, 4, 2.4);
  // generator by the back gate (Musa's "Engineer" tip)
  const gen = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 0.8), toonMat('#3a5a3a')); gen.position.set(18.4, 0.45, -8.4); scene.add(gen); outline(gen, 1.04);

  // ===== street furniture: kiosk, lamps, okadas, church banner =====
  const kiosk = new THREE.Group();
  const kb = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 1.6), toonMat('#c84a3a')); kb.position.y = 1.1; kiosk.add(kb); outline(kb, 1.03);
  const ka = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.1, 1.2), toonMat('#f0d040')); ka.position.set(0, 2.3, 1.2); kiosk.add(ka);
  const kw = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.8), basicMat('#ffe8a0')); kw.position.set(0, 1.4, 0.81); kiosk.add(kw);
  kiosk.position.set(-6, 0, -4.4); scene.add(kiosk); addObstacle(-6, -4.4, 2.4, 1.6);
  const lamps = [];
  for(const [lx,lz] of [[-12,-3.6],[-2,3.6],[7,-3.6],[16,3.6]]){
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.1,5,8), toonMat('#3a3a3a')); pole.position.set(lx, 2.5, lz); scene.add(pole);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5,0.18,0.3), basicMat('#fff0c0')); head.position.set(lx, 5.05, lz); scene.add(head);
    const l = new THREE.PointLight('#ffd890', 0.9, 13); l.position.set(lx, 4.8, lz); scene.add(l); lamps.push(l);
  }
  for(const [ox,oz,r] of [[-9,2.4,0.3],[9.5,2.6,2.6]]){
    const bike = new THREE.Group();
    const fr = new THREE.Mesh(new THREE.BoxGeometry(1.4,0.3,0.25), toonMat('#1a1a1a')); fr.position.y = 0.6; bike.add(fr);
    for(const wx of [-0.6,0.6]){ const w = new THREE.Mesh(new THREE.CylinderGeometry(0.32,0.32,0.12,12), toonMat('#0a0a0a')); w.position.set(wx,0.32,0); w.rotation.x = Math.PI/2; bike.add(w); }
    bike.position.set(ox,0,oz); bike.rotation.y = r; scene.add(bike);
  }
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(4, 0.9), basicMat('#f0ece0')); banner.position.set(2, 3.4, -5.45); scene.add(banner);

  // ===== the NACECA van (west end) — Route C's field office =====
  const van = new THREE.Group();
  const vb = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.7, 4.4), toonMat('#0b1a3a')); vb.position.y = 1.0; van.add(vb); outline(vb, 1.03);
  const vs = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.3), basicMat('#d8a64a')); vs.position.set(1.11, 1.3, 0); vs.rotation.y = Math.PI/2; van.add(vs);
  for(const wx of [-1.0,1.0]) for(const wz of [-1.4,1.4]){ const w = new THREE.Mesh(new THREE.CylinderGeometry(0.36,0.36,0.25,12), toonMat('#141414')); w.position.set(wx,0.36,wz); w.rotation.z = Math.PI/2; van.add(w); }
  van.position.set(-20, 0, 1.2); van.rotation.y = Math.PI/2; scene.add(van); addObstacle(-20, 1.2, 4.4, 2.2);
  addDustMotes(scene, 50, 30, 4, 18, '#8090b0');

  // ===== people =====
  ENGINE.player = buildPlayerMesh();
  ENGINE.player.position.set(-11, 0, 0.6);   // clear of the van so the camera has room
  ENGINE.player.rotation.y = Math.PI/2;
  scene.add(ENGINE.player);
  const uche = buildNPCMesh('#5a3818', '#1a2a18', '#1a2a18', '#0a0a08', {hair:'crop', beard:true, longSleeve:true});
  addVest(uche, '#0b1a3a'); uche.position.set(-13.4, 0, -1.4); uche.rotation.y = Math.PI/2; scene.add(uche); ENGINE.npcs.push(uche);
  // guards at the blue gate
  const guards = [];
  for(const gx of [12.0, 15.2]){
    const g = buildNPCMesh('#3a2a1a', '#2a2a2a', '#1a1a1a', '#0a0a08', {hair:'cap', capColor:'#1a1a1a', longSleeve:true});
    g.position.set(gx, 0, -4.6); g.rotation.y = 0; scene.add(g); ENGINE.npcs.push(g); guards.push(g);
  }
  // Osas in the boys' quarters (visible through the open door once you're there)
  const osas = buildNPCMesh('#5a3818', '#2a4a8a', '#2a2a3a', '#0a0a08', {hair:'crop', longSleeve:true});
  osas.position.set(15.5, 0, -11.6); osas.rotation.y = 0; osas.scale.y = 0.62; scene.add(osas); ENGINE.npcs.push(osas);
  // the courier (Route B): burgundy jacket, phone to her ear
  const courier = buildNPCMesh('#5a3826', '#5a1a2a', '#1a1a2a', '#0a0a10', {female:true, hair:'afro', longSleeve:true});
  courier.position.set(-5, 0, 1.8); courier.rotation.y = Math.PI/2; scene.add(courier); ENGINE.npcs.push(courier);
  courier.userData.armR.rotation.x = -2.3;   // phone to ear
  courier.visible = finaleRoute() === 'B';
  // KC at the kiosk, if he was treated fairly in M2
  const kc = buildNPCMesh('#7a4a30', '#e07d4a', '#1a2030', '#0a0a14', {hair:'crop', scale:0.9});
  kc.position.set(-7.6, 0, -3.2); kc.rotation.y = Math.PI*0.8; kc.visible = kcIsFair(); scene.add(kc); ENGINE.npcs.push(kc);
  // the Voice's car (arrives for the reveal)
  const car = new THREE.Group();
  const cb = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.9, 4.2), toonMat('#0a0a0a')); cb.position.y = 0.75; car.add(cb); outline(cb, 1.03);
  const ct = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.7, 2.2), toonMat('#141414')); ct.position.set(0, 1.5, -0.2); car.add(ct); outline(ct, 1.03);
  car.position.set(30, 0, 1.2); car.rotation.y = -Math.PI/2; scene.add(car);
  const adaeze = buildNPCMesh('#5a3826', '#1a3050', '#0a1020', '#0a0a14', {female:true, hair:'beret', capColor:'#0b1a3a', longSleeve:true});
  adaeze.position.set(26, 0, 1.2); adaeze.visible = false; scene.add(adaeze); ENGINE.npcs.push(adaeze);

  // ===== interactables =====
  const R = finaleRoute();
  ENGINE.interactables.push({
    mesh: uche, label:'Brief with Sgt. Uche', range:2.4,
    onInteract: ()=>{
      if(S.game._finBriefed){ toast('SGT. UCHE', R==='C' ? 'The call comes in the van. Be ready.' : 'Akintola Close. The blue gate.'); return; }
      startDialogue({A:'fin_brief_hold', B:'fin_brief_tail', C:'fin_brief_call'}[R], ()=>{
        S.game._finBriefed = true; completeObjective('o1_brief');
        if(R==='A'){ S.game._finHouseKnown = true; completeObjective('o2_find'); showPrompt('<span class="opt"><span class="key">E</span> The blue gate, east end — choose your way in</span>'); }
        if(R==='B'){ showPrompt('<span class="opt"><span class="key">E</span> ' + (kcIsFair() ? 'KC is at the kiosk — he knows her face' : 'Find the courier — burgundy jacket, phone to her ear') + '</span>'); if(!kcIsFair()) finaleStartTail(); }
        if(R==='C'){ showPrompt('<span class="opt"><span class="key">E</span> Get in the van — the call comes at 21:00</span>'); }
      });
    }
  });
  if(R==='B'){
    ENGINE.interactables.push({
      mesh: kc, label:'Talk to KC', range:2.4,
      onInteract: ()=>{
        if(!kc.visible) return;
        if(!S.game._finBriefed){ toast('HOLD','Brief with Sgt. Uche first.'); return; }
        if(S.game._finKC){ toast('KC','"Burgundy jacket. Don\'t look at her direct."'); return; }
        startDialogue('fin_kc', ()=>{ S.game._finKC = true; finaleStartTail(); });
      }
    });
  }
  if(R==='C'){
    ENGINE.interactables.push({
      mesh: van, label:'Take the call in the van', range:3.2,
      onInteract: ()=>{
        if(!S.game._finBriefed){ toast('HOLD','Brief with Sgt. Uche first.'); return; }
        if(S.game._finCallDone){ toast('THE VAN','The line is dead. Akintola Close — move.'); return; }
        S.game._finTrace = 0;
        showMeter('trace', 'CALL TRACE', 0, 'info', '0%');
        startDialogue('fin_call', ()=>finaleCallEnded());
      }
    });
  }
  ENGINE.interactables.push({
    mesh: gateL, label:'Breach the front gate', range:2.8,
    onInteract: ()=>{
      if(!S.game._finHouseKnown){ toast('NOT YET', R==='B' ? 'Follow the courier. Find the house first.' : 'You don\'t know which house yet.'); return; }
      if(S.game._finInside){ toast('INSIDE','Get to the boys\' quarters.'); return; }
      startDialogue('fin_front', ()=>{
        S.game._finInside = 'front'; if(S.game._finWarned) S.game._finRisk = (S.game._finRisk||0) + 1;
        guards.forEach(g=>{ knockDown(g); g.userData._stayDown = true; }); gateL.rotation.y = -1.2; gateR.rotation.y = 1.2;
        ENGINE.obstacles = ENGINE.obstacles.filter(o => !(Math.abs((o.minX+o.maxX)/2-13.5)<0.1 && Math.abs((o.minZ+o.maxZ)/2+5.6)<0.1));
        S.game.alertLevel = 2; refreshHUD(); shakeCamera(0.35); sfxAlert(); haptic([60,40,60]);
        completeObjective('o3_entry');
        showPrompt('<span class="opt"><span class="key">E</span> The boys\' quarters — back of the yard</span>');
      });
    }
  });
  ENGINE.interactables.push({
    mesh: backGate, label:'Try the back gate', range:2.6,
    onInteract: ()=>{
      if(!S.game._finHouseKnown){ toast('NOT YET','You don\'t know which house yet.'); return; }
      if(S.game._finInside){ toast('INSIDE','Get to the boys\' quarters.'); return; }
      if(!musaGaveTip()){ toast('PADLOCKED','Heavy chain. You\'d need to know when the generator man leaves it open.', 2600); return; }
      startDialogue('fin_back', ()=>{
        S.game._finInside = 'back'; backGate.rotation.y = 1.3;
        ENGINE.obstacles = ENGINE.obstacles.filter(o => !(Math.abs((o.minX+o.maxX)/2-19.5)<0.1 && Math.abs((o.minZ+o.maxZ)/2+11.25)<0.1));
        completeObjective('o3_entry');
        if(typeof unlock==='function') unlock('quiet_way');
        showPrompt('<span class="opt"><span class="key">E</span> The boys\' quarters — straight ahead</span>');
      });
    }
  });
  ENGINE.interactables.push({
    mesh: osas, label:'Free Osas', range:2.6,
    onInteract: ()=>{
      if(!S.game._finInside){ toast('LOCKED IN','He\'s inside the compound. Find a way in first.'); return; }
      if(S.game._finOsas){ toast('OSAS','Stay behind me.'); return; }
      startDialogue('fin_osas', ()=>{
        S.game._finOsas = true; osas.scale.y = 1; completeObjective('o4_osas');
        collectEvidence({id:'fin_drive', name:"Osas's Flash Drive — Payroll Copies", xp:150});
        refreshEvidenceCount();
        setTimeout(()=>finaleArrival(), 900);
      });
    }
  });

  ENGINE.bounds = { minX:-21, maxX:21, minZ:-15.5, maxZ:11.5 };
  ENGINE.cameraTarget = ENGINE.player;
  setMinimap(
    `<rect x="-22" y="-2.7" width="44" height="5.4" fill="#2a2a2e"/>
     <rect x="9.5" y="-15" width="10" height="9.4" fill="none" stroke="#2a5aa8" stroke-width="0.6"/>
     <rect x="10.5" y="-12.5" width="7" height="5" fill="#b8b0a0"/>
     <rect x="13.5" y="-14.5" width="4" height="2.4" fill="#9a8a70"/>
     <rect x="-7.2" y="-5.2" width="2.4" height="1.6" fill="#c84a3a"/>
     <rect x="-22.2" y="0.1" width="4.4" height="2.2" fill="#0b1a3a"/>`,
    [ {x:-13.4, z:-1.4, color:'#5dd07a', r:1.4}, {x:13.5, z:-5.6, color:'#2a5aa8', r:1.4}, {x:19.5, z:-11.2, color:'#8a8a8a', r:1.2}, {x:15.5, z:-12, color:'#d8a64a', r:1.2} ]
  );
  S.game.currentRegion = 'Edo';
  S.game.currentSubregion = 'Ekosodin · Akintola Close';
  S.game.alertLevel = 1;
  refreshHUD();
  // the close is alive at night — none of these people know what's in the boys' quarters
  if(typeof placeExtra==='function'){
    placeExtra(scene, 'student', -3.6, -4.2, Math.PI*0.1);
    placeExtra(scene, 'bread_seller', 4.6, 4.1, Math.PI);
    placeExtra(scene, 'tank_guy', 10.6, 4.0, -Math.PI*0.7);
    placeExtra(scene, 'gele_handbag', -0.8, 4.3, Math.PI*0.9);
    placeExtra(scene, 'fila_man', 6.2, -4.3, Math.PI*0.15);
  }
  ENGINE._fin = { courier, kc, osas, adaeze, car, guards, uche, lamps };
  showPrompt('<span class="opt"><span class="key">E</span> Brief with Sgt. Uche by the van</span>');
}

/* ---------- Route B: tail the courier ---------- */
function finaleStartTail(){
  const F = ENGINE._fin; if(!F || S.game._finTailing || S.game._finHouseKnown) return;
  S.game._finTailing = true;
  completeObjective('o2_find');
  if(!kcIsFair()) toast('THE COURIER','Burgundy jacket, phone to her ear, by the okada. Keep back — she checks behind her.', 3200);
  else toast('KC','"Na her. Burgundy jacket. She dey check her back every small time."', 3000);
  startTail({
    target: F.courier, label:'COURIER',
    path: [[-5,1.8],[-1,1.8],[2,-1.4],[6,-1.4],[9.5,-1.8],[12.4,-4.4],[13.5,-5.0]],
    speed: 1.45 * (typeof chaseRate==='function' ? chaseRate() : 1),
    near: 3.2, far: 15, lookEvery: 6.5, lookFor: 1.8,
    onArrive: ()=>{
      S.game._finHouseKnown = true; S.game._finCourierPhone = true;
      F.courier.userData.armR.rotation.x = 0;
      collectEvidence({id:'fin_courier_phone', name:"Courier's Phone — One Saved Number", xp:120});
      refreshEvidenceCount();
      startDialogue('fin_tail_done', ()=>{ completeObjective('o2b_tail'); showPrompt('<span class="opt"><span class="key">E</span> The blue gate — front, or try the back</span>'); });
    },
    onSpotted: ()=>{
      S.game._finHouseKnown = true; S.game._finWarned = true;
      F.courier.visible = false;
      startDialogue('fin_tail_spotted', ()=>{ completeObjective('o2b_tail'); showPrompt('<span class="opt"><span class="key">E</span> The blue gate — they know we\'re coming</span>'); });
    },
  });
}

/* ---------- Route C: the call ---------- */
function finaleCallEnded(){
  S.game._finCallDone = true; hideMeter('trace');
  const ok = (S.game._finTrace||0) >= 100 && !S.game._finHungUp;
  S.game._finHouseKnown = true;
  if(ok){
    S.game._finRecording = true;
    collectEvidence({id:'fin_recording', name:'Recorded Ransom Call — Full Trace', xp:120});
    refreshEvidenceCount();
  } else {
    S.game._finWarned = true;
  }
  startDialogue(ok ? 'fin_call_locked' : 'fin_call_partial', ()=>{
    completeObjective('o2_find'); completeObjective('o2c_call');
    showPrompt('<span class="opt"><span class="key">E</span> Akintola Close — the blue gate</span>');
  });
}

/* ---------- the reveal: she comes for the drive herself ---------- */
function finaleArrival(){
  const F = ENGINE._fin; if(!F || S.game._finArrived) return;
  S.game._finArrived = true;
  musicForScene('m8_reveal');
  F.car.position.set(13.5, 0, 1.4);
  F.adaeze.visible = true; F.adaeze.position.set(13.5, 0, -6.4); F.adaeze.rotation.y = Math.PI;
  F.uche.position.set(14.6, 0, -9); F.uche.rotation.y = Math.PI*0.75;
  if(ENGINE.player){ ENGINE.player.position.set(15.2, 0, -10.6); ENGINE.player.rotation.y = Math.PI; ENGINE.cameraYaw = Math.PI; ENGINE.playerYaw = Math.PI; }
  shakeCamera(0.12);
  startDialogue(finaleRevealScript(), ()=>finaleResolve());
}

/* ---------- per-frame: lamp flicker ---------- */
function updateEkosodin(dt){
  if(S.game.currentMission !== 'm8') return;
  const F = ENGINE._fin; if(!F) return;
  const t = performance.now()/1000;
  F.lamps.forEach((l,i)=>{ l.intensity = 0.85 + Math.sin(t*(7+i)+i)*0.06 + (Math.random()<0.006 ? -0.6 : 0); });
}
