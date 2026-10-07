/* =========================================================================
   NACECA · scenes/prologue.js
   Cold open — "THE TRANSFER" (Vertical Slice 0.1, 0:00–3:30). Lagos, night, rain.
     0:00  black · generator · rain on zinc · Adaeze: "You're late. He's already moving."
     0:15  under a shop awning. Blue shirt, brown folder, across the road.
     0:45  cross through traffic (vehicles brake and honk — the street is the tutorial)
     1:10  FOLLOW THE COURIER — suspicion eye, keep ~20 m, use people/stalls/shadow
     1:45  newspaper seller: hang back → "Engineer changed it" · get close → "The girl moves tonight"
     2:10  chained gate → climb the crates → crouch under the fallen pipe
     2:40  through the broken screen: VEHICLE · VICTIM · SECOND SUSPECT (look to record)
     3:00  "Who's that?" — the chase you can't win; he's gone on an okada
     3:20  "You get the plate?" · title · hard cut to daylight
   The girl being moved is the child Kelechi finds at the Lekki mansion (M3).
   ========================================================================= */

const CO = {};
function coRoute(){
  return [
    [-6,-6.2],[4,-6.2],[12.6,-6.2],                 // 0–2  north pavement, east
    [14,-10],[14,-15.5],                            // 3–4  into the commercial street (look-back)
    [12.4,-19],                                     // 5    stops at the kiosk
    [15.4,-24],                                     // 6    the newspaper seller (the choice)
    [14,-28.5],[17.6,-33],                          // 7–8  to the alley gate
    [21,-33],[27,-33],[33.8,-33],[33.8,-36.8],[31.6,-38.8],   // 9–13 alley → into the compound
  ];
}
const CO_STOPS = { 4:{t:2.6, look:true}, 5:{t:3.2, look:true}, 6:{t:8.5, seller:true}, 8:{t:2.4, gate:true} };
const CO_LAMPS = [[-26,6],[-12,-5.2],[2,6],[12,-5.2],[11,-20],[17,-27],[30,-33],[38.5,-20],[38.5,-10]];

function buildScenePrologue(){
  const scene = newScene({bg:'#04070d', fog:'#0b1220'});
  scene.fog.near = 14; scene.fog.far = 58;
  scene.add(new THREE.AmbientLight('#2a3a5a', 0.55));
  addSun(scene, '#5a6a90', 0.2, new THREE.Vector3(-4, 10, 6));
  addTexturedGround(scene, asphaltTexture(), 120, '#17181c');

  const box = (x,y,z,w,h,d,c,obs=true,o=1.02)=>{ const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), toonMat(c)); m.position.set(x,y+h/2,z); m.castShadow = true; m.receiveShadow = true; scene.add(m); if(o) outline(m,o); if(obs) addObstacle(x,z,w,d); return m; };
  const flat = (x,z,w,d,c,y=0.012)=>{ const m = new THREE.Mesh(new THREE.BoxGeometry(w,0.02,d), toonMat(c)); m.position.set(x,y,z); m.receiveShadow = true; scene.add(m); return m; };
  const sign = (x,y,z,w,h,text,bg,fg,ry=0)=>{ const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d'); g.fillStyle = bg; g.fillRect(0,0,256,64); g.fillStyle = fg; g.font = 'bold 24px sans-serif'; g.textAlign = 'center'; g.fillText(text, 128, 41); const m = new THREE.Mesh(new THREE.PlaneGeometry(w,h), new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c)})); m.position.set(x,y,z); m.rotation.y = ry; scene.add(m); return m; };

  // ---- the main road (x -45..45), drains, pavements ----
  flat(0, 0, 100, 8, '#202126');
  for(const z of [-4.25, 4.25]) flat(0, z, 100, 0.5, '#0c0d10', 0.02);
  flat(0, -6, 100, 3.5, '#4a4640'); flat(0, 6, 100, 3.5, '#4a4640');
  for(let x=-44;x<44;x+=6){ const d = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.14), basicMat('#c8b878')); d.rotation.x = -Math.PI/2; d.position.set(x, 0.03, 0); scene.add(d); }
  // ---- south side: closed shops, an awning, a food stall, a parked car ----
  const shopCols = ['#b8a890','#8a9aa8','#c8b8a0','#9a8a7a','#a8b8a0','#b8a0a8'];
  for(let i=0;i<7;i++){ const x = -40 + i*12; box(x, 0, 11, 11.4, 4.2 + (i%3)*0.9, 5, shopCols[i%6]); box(x, 0, 8.7, 10.4, 2.6, 0.12, ['#4a5a6a','#6a4a3a','#3a4a3a'][i%3], false); }
  window._v12Awning = box(-24, 2.7, 7.4, 4.4, 0.12, 2.2, '#8a2a20', false);
  sign(-24, 3.3, 8.62, 3.6, 0.7, 'MAMA T PROVISIONS', '#1a5aa8', '#ffe8a0');
  sign(-12, 3.3, 8.62, 3.6, 0.7, "GOD'S TIME BARBING", '#c8342c', '#ffffff');
  sign(4, 3.3, 8.62, 3.6, 0.7, 'BLESSED PHARMACY', '#2a8a4a', '#ffffff');
  box(-20, 0, 5.6, 1.6, 0.85, 0.8, '#6a4a2a');
  const car = makeVehicle('saloon'); car.position.set(-12.6, 0, 5.2); scene.add(car); addObstacle(-12.6, 5.2, 4.2, 1.8);
  box(-8.5, 0, 7.4, 1.0, 0.8, 0.7, '#3a5a3a');
  // ---- north side: shops either side of the commercial street ----
  for(let i=0;i<4;i++){ const x = -40 + i*12; box(x, 0, -11, 11.4, 4.6 + (i%2)*1.2, 5, shopCols[(i+2)%6]); }
  box(4, 0, -11, 11.4, 4.2, 5, '#a89a84');
  box(5, 0, -26.5, 10, 4.6, 27, '#9a8a78');
  box(22, 0, -21.5, 8, 4.4, 17, '#a8988a');
  box(22, 0, -38.2, 8, 4.4, 6.2, '#8a7e70');
  box(14, 0, -43, 10, 4.4, 1, '#7a7064');
  for(const [x,z,t,bg] of [[9.95,-16,'BIG BROTHER PHONES','#1a1a1a'],[9.95,-22,'ICE COLD MINERALS','#c8342c'],[18.05,-18,'POS · TRANSFER · BILLS','#2a5aa8']]) sign(x, 3.0, z, 3.4, 0.6, t, bg, '#ffe8a0', x < 14 ? Math.PI/2 : -Math.PI/2);
  const kiosk = box(11.2, 0, -19, 1.6, 2.2, 1.4, '#c84a3a');
  const paper = box(16.8, 0, -24, 1.4, 1.0, 1.0, '#6a5a3a');
  for(let k=0;k<6;k++){ const pz = -23.85 + (k%3)*0.22; const pp = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.42), basicMat(['#f0ece0','#e8d8b0','#f4f0e6'][k%3])); pp.rotation.x = -Math.PI/2; pp.position.set(16.6 + Math.floor(k/3)*0.38, 1.02, pz); scene.add(pp); }
  const stall = box(16.9, 0, -15, 1.6, 0.9, 1.2, '#3a2a18');
  for(const [x,z,c] of [[12.2,-25.6,'#2a8a4a'],[16.6,-12.6,'#d8a64a']]){ const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,2.2,6), toonMat('#3a3a3a')); pole.position.set(x,1.1,z); scene.add(pole); const um = new THREE.Mesh(new THREE.ConeGeometry(1.2,0.5,8), toonMat(c)); um.position.set(x,2.3,z); scene.add(um); outline(um,1.03); }
  for(const [x,z] of [[11.0,-12.8],[11.2,-29.4]]){ const ok = makeVehicle('okada'); ok.position.set(x,0,z); ok.rotation.y = Math.PI/2; if(ok.userData.rider) ok.remove(ok.userData.rider); scene.add(ok); addObstacle(x,z,0.7,1.9); }
  for(const z of [-9.5,-21.5]){ const cab = new THREE.Mesh(new THREE.CylinderGeometry(0.015,0.015,9,4), basicMat('#0a0a0a')); cab.rotation.z = Math.PI/2; cab.position.set(14, 4.3, z); scene.add(cab); }
  // ---- the alley: chained gate, crates to climb, a fallen pipe, the broken screen ----
  box(26, 0, -30.8, 16, 3.0, 0.4, '#6a6258');
  box(23, 0, -35.2, 10, 3.0, 0.4, '#625a50'); box(35.5, 0, -35.2, 3, 3.0, 0.4, '#625a50');
  const screen = new THREE.Group();
  for(let i=0;i<9;i++){ if(i===4||i===5) continue; const pn = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.6, 0.22), toonMat('#7a7268')); pn.position.set(28.2 + i*0.45, 1.3, -35.2); screen.add(pn); }
  const rail = new THREE.Mesh(new THREE.BoxGeometry(4, 0.2, 0.24), toonMat('#7a7268')); rail.position.set(30, 2.7, -35.2); screen.add(rail);
  scene.add(screen); addObstacle(30, -35.2, 4, 0.4); CO._screenObs = ENGINE.obstacles[ENGINE.obstacles.length-1];
  box(34.5, 0, -33, 0.4, 3.0, 4.6, '#625a50');
  const gate = box(18.6, 0, -33, 0.14, 2.4, 4.0, '#2a3a4a');
  const chain = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 6, 10), toonMat('#9a9a9a')); chain.position.set(18.5, 1.1, -33.6); chain.rotation.y = Math.PI/2; scene.add(chain);
  const crates = box(16.9, 0, -30.2, 1.2, 1.1, 1.1, '#6a4a2a'); box(16.9, 1.1, -30.2, 0.9, 0.7, 0.9, '#7a5a32', true);
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 4.2, 10), toonMat('#5a6a7a')); pipe.rotation.x = Math.PI/2; pipe.position.set(25.5, 1.0, -33); scene.add(pipe); outline(pipe, 1.04);
  addObstacle(25.5, -33, 0.6, 4.2); ENGINE.obstacles[ENGINE.obstacles.length-1].crouchOnly = true;
  flat(26, -33, 16, 0.5, '#0c0d10', 0.02);
  // ---- the compound: the van, two men, the girl ----
  box(26, 0, -41, 0.4, 2.6, 11, '#7a7064'); box(31.5, 0, -46.5, 11, 2.6, 0.4, '#7a7064');
  box(37.2, 0, -43.2, 0.4, 2.6, 6.6, '#7a7064');
  const vanBody = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.8, 2.0), toonMat('#d8d4c8')); vanBody.position.set(31, 1.2, -42.4); scene.add(vanBody); outline(vanBody, 1.03); addObstacle(31, -42.4, 4.6, 2.0);
  for(const wx of [-1.5,1.5]) for(const wz of [-0.95,0.95]){ const w = new THREE.Mesh(new THREE.CylinderGeometry(0.36,0.36,0.24,12), toonMat('#141414')); w.position.set(31+wx,0.36,-42.4+wz); w.rotation.x = Math.PI/2; scene.add(w); }
  // ---- the back lane to the road: market tables, a crowd, a parked taxi ----
  box(36.6, 0, -24, 0.4, 3.0, 24, '#6a6258'); box(41.6, 0, -24, 0.4, 3.0, 26, '#625a50');
  box(38.0, 0, -28, 1.3, 0.85, 1.0, '#5a3a1e'); box(40.2, 0, -21, 1.3, 0.85, 1.0, '#5a3a1e');
  const parked = makeVehicle('taxi'); parked.position.set(37.9, 0, -13); parked.rotation.y = Math.PI/2; parked.scale.set(0.95,1,0.95); scene.add(parked); addObstacle(37.9, -13, 1.8, 4.0);
  // ---- lamps ----
  for(const [lx,lz] of CO_LAMPS){
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.08,4.6,6), toonMat('#3a3a3a')); pole.position.set(lx, 2.3, lz); scene.add(pole);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.45,0.14,0.25), basicMat('#ffd27a')); head.position.set(lx, 4.6, lz); scene.add(head);
    const l = new THREE.PointLight('#ffb050', 0.85, 11); l.position.set(lx, 4.3, lz); scene.add(l);
  }
  // ---- rain ----
  const N = 1100, pos = new Float32Array(N*6);
  for(let i=0;i<N;i++){ const x=(Math.random()-0.5)*40, y=Math.random()*12, z=(Math.random()-0.5)*40; pos.set([x,y,z, x+0.05,y-0.55,z], i*6); }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const rain = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({color:0x8ea8d0, transparent:true, opacity:0.42})); scene.add(rain);

  // ---- people ----
  ENGINE.player = buildPlayerMesh();
  ENGINE.player.position.set(-24, 0, 6.6); ENGINE.player.rotation.y = Math.PI*0.75;
  scene.add(ENGINE.player);
  const courier = buildNPCMesh('#5a3818', '#2a5aa8', '#2a2420', '#0a0a08', {hair:'crop', longSleeve:true});
  const folder = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.34, 0.26), toonMat('#8a5a2a')); folder.position.set(0.02, -0.27, 0.06); courier.userData.elbowL.add(folder);
  courier.position.set(-6, 0, -6.2); courier.rotation.y = Math.PI/2; scene.add(courier); ENGINE.npcs.push(courier);
  const seller = typeof makeExtra==='function' ? makeExtra('fila_man') : buildNPCMesh('#5a3826','#1a78b8','#3a2414','#0a0a0a');
  seller.position.set(17.6, 0, -24.4); seller.rotation.y = -Math.PI/2; scene.add(seller); ENGINE.npcs.push(seller);
  const driver = buildNPCMesh('#3a2a1a', '#2a2a2a', '#1a1a1a', '#0a0a08', {hair:'bcap', capColor:'#141414'});
  driver.position.set(33.4, 0, -40.6); driver.rotation.y = Math.PI*0.9; scene.add(driver); ENGINE.npcs.push(driver);
  const second = buildNPCMesh('#3a2a1a', '#1a1a1a', '#1a1a1a', '#0a0a08', {hair:'mask', capColor:'#141414', longSleeve:true});
  second.position.set(29.4, 0, -40.2); second.rotation.y = Math.PI*0.35; scene.add(second); ENGINE.npcs.push(second);
  const girl = buildNPCMesh('#7a5238', '#f3ead2', '#3a4828', '#0a0a14', {female:true, hair:'braids', scale:0.62});
  girl.position.set(30.4, 0, -39.4); girl.rotation.y = Math.PI; scene.add(girl); ENGINE.npcs.push(girl);
  const bike = makeVehicle('okada'); bike.position.set(39.6, 0, -6.4); bike.rotation.y = -Math.PI/2; scene.add(bike);
  if(typeof placeExtra === 'function'){
    const woman = placeExtra(scene, 'bread_seller', -20, 6.5, Math.PI); addBehaviour(woman, 'pack');
    const a1 = placeExtra(scene, 'cap_guy', -14.6, 6.9, 0), a2 = placeExtra(scene, 'tank_guy', -13.4, 7.3, Math.PI);
    addBehaviour(a1, 'argue', {face:a2.position}); addBehaviour(a2, 'argue', {face:a1.position});
    addBehaviour(placeExtra(scene, 'guard', 4.6, 7.2, Math.PI), 'wait');
    addBehaviour(placeExtra(scene, 'student', -2, -6.9, 0), 'phone');
    addBehaviour(placeExtra(scene, 'gele_handbag', 12.4, -18.2, Math.PI/2), 'wait');
    addBehaviour(placeExtra(scene, 'mechanic', 16.2, -15.6, -Math.PI/2), 'sell');
    const b1 = placeExtra(scene, 'office', 15.6, -12.0, Math.PI), b2 = placeExtra(scene, 'gele_purple', 15.6, -13.0, 0);
    addBehaviour(b1, 'gesture', {face:b2.position}); addBehaviour(b2, 'gesture', {face:b1.position});
    addBehaviour(placeExtra(scene, 'fruit_seller', 12.4, -27, Math.PI/2), 'sell');
    for(const [x,z,k] of [[38.6,-27,'cap_guy'],[39.6,-26.2,'fila_man'],[40.4,-20,'gele_purple'],[38.2,-16.5,'student']]) addBehaviour(placeExtra(scene, k, x, z, Math.random()*6), 'wait');
    addBehaviour(placeExtra(scene, 'tank_guy', -30, 5.6, 0), 'walk', {path:[[-30,5.6],[-2,5.6]], speed:1.0});
  }
  startTraffic(scene, { lanes:[{z:-1.8, dir:1, speed:6.2}, {z:1.8, dir:-1, speed:5.6}], xMin:-48, xMax:48, density:0.45 });

  // ---- interactables (route order) ----
  const browse = (mesh, label)=>({ mesh, label, verb:'inspect', range:1.9, onInteract: ()=>{ CO.browseT = 4.5; toast('JUST BROWSING', 'You pick something up and look busy.', 1400); } });
  ENGINE.interactables.push(browse(kiosk, 'Buy credit at the kiosk'));
  ENGINE.interactables.push(browse(stall, 'Look over the stall'));
  ENGINE.interactables.push({
    mesh: gate, label:'Open the gate', verb:'open', range:2.4,
    onInteract: ()=>{
      if(CO.phase < 3){ toast('NOT YET','Stay on him.'); return; }
      toast('CHAINED', 'A padlock and a fresh chain. Find another way round.', 2000);
      showHint('climb', 'The <b>crates</b> by the wall — climb over', 'The <b>crates</b> by the wall — climb over');
      CO.gateTried = true;
    }
  });
  ENGINE.interactables.push({
    mesh: crates, label:'Climb the crates', verb:'open', range:2.2,
    onInteract: ()=>{
      if(CO.phase < 3){ toast('NOT YET','Stay on him.'); return; }
      if(CO.climbed) return;
      CO.climbed = true; CO.vault = { t:0, from: ENGINE.player.position.clone(), to: new THREE.Vector3(20.6, 0, -32.4) };
      completeObjective('co_gate');
      showHint('crouch', 'A fallen pipe — hold <b>C</b> to crouch under it', 'A fallen pipe — tap <b>CROUCH</b> to get under it');
    }
  });

  ENGINE.bounds = { minX:-46, maxX:46, minZ:-46, maxZ:9 };
  ENGINE.cameraTarget = ENGINE.player;
  setMinimap(
    `<rect x="-46" y="-4" width="92" height="8" fill="#26272c"/><rect x="10" y="-43" width="8" height="35" fill="#2a2a2e"/>
     <rect x="18" y="-35" width="17" height="4" fill="#2a2a2e"/><rect x="26" y="-46" width="11" height="10.5" fill="#343434"/>
     <rect x="36.8" y="-36" width="4.6" height="28" fill="#2a2a2e"/>`,
    [ {x:14, z:-24, color:'#d8a64a', r:1.2} ]
  );
  S.game.currentRegion = 'Lagos'; S.game.currentSubregion = 'Mushin · 23:10';
  S.game.alertLevel = 0; refreshHUD();

  Object.assign(CO, { scene, courier, seller, driver, second, girl, bike, rain, screen, gate,
    phase:0, wp:0, stopT:0, lookT:0, nextLook:6, susp:0, farT:0, closeT:0, said:{}, heard:null, obs:{}, obsT:{}, chase:false, ended:false,
    browseT:0, gateTried:false, climbed:false, vault:null, revealT:0, revealed:false, bikeGo:0, plateDist:99, plateAsked:false, targets:null, crossed:false });
  S.game.flags = S.game.flags || {}; ['co_heard','co_plate','co_spotted','co_obs'].forEach(k=>delete S.game.flags[k]);
  // black screen, generator, rain on zinc — then the radio
  titleCard([' '], 1600, ()=>{
    radioLine('COMMANDER ADAEZE', "You're late. He's already moving.");
    radioLine('COMMANDER ADAEZE', "Blue shirt. Brown folder. Other side of the road. Don't stare at him.");
    showHint('move', '<b>MOVE</b> · WASD · mouse to look', '<b>MOVE</b> · left stick · drag to look');
    CO.phase = 1;
  });
}

/* how well hidden Kelechi is right now */
function coConcealed(p){
  if(CO.browseT > 0) return true;
  const nearPerson = (ENGINE.npcs||[]).some(n=>{ const m = n.isObject3D ? n : n.mesh; return m && m !== CO.courier && m.visible && Math.hypot(m.position.x-p.x, m.position.z-p.z) < 1.7; });
  if(nearPerson) return true;
  const crouch = !!ENGINE.keys['KeyC'];
  const nearCover = crouch && (ENGINE.obstacles||[]).some(o => p.x > o.minX-1.4 && p.x < o.maxX+1.4 && p.z > o.minZ-1.4 && p.z < o.maxZ+1.4);
  if(nearCover) return true;
  const lit = CO_LAMPS.some(([lx,lz]) => Math.hypot(lx-p.x, lz-p.z) < 5.5);
  return !lit && crouch;
}
function coSay(key, speaker, text){ if(CO.said[key]) return; CO.said[key] = true; radioLine(speaker, text); }
function setObjectiveText(id, text){ const o = (S.game.objectives||[]).find(x=>x.id===id); if(o){ o.text = text; if(typeof renderObjectives==='function') renderObjectives(); } }
function onTrafficHonk(c){
  if(S.game.currentMission === 'm0' && CO.phase >= 1 && CO.phase < 3) coSay('cross', 'COMMANDER ADAEZE', 'Look before you cross, Agent. Wait for a gap.');
}

function updatePrologue(dt){
  if(S.game.currentMission !== 'm0' || !CO.courier) return;
  const p = ENGINE.player ? ENGINE.player.position : null; if(!p) return;
  const a = CO.rain.geometry.attributes.position, arr = a.array;
  for(let i=0;i<arr.length;i+=6){ arr[i+1]-=dt*16; arr[i+4]-=dt*16; if(arr[i+4] < 0){ const nx=p.x+(Math.random()-0.5)*40, nz=p.z+(Math.random()-0.5)*40, ny=10+Math.random()*3; arr[i]=nx; arr[i+1]=ny; arr[i+2]=nz; arr[i+3]=nx+0.05; arr[i+4]=ny-0.55; arr[i+5]=nz; } }
  a.needsUpdate = true;
  if(CO.ended) return;
  if(CO.bikeGo > 0){
    CO.bikeGo += dt; const b = CO.bike;
    if(b.position.z < -2){ b.position.z += dt*4; } else { b.rotation.y = 0; b.position.x += dt * Math.min(16, 4 + CO.bikeGo*6); }
    if(!CO.plateAsked && CO.bikeGo > 3.2){ CO.plateAsked = true; coPlateQuestion(); }
    return;
  }
  if(isOverlayOpen() || CO.phase === 0) return;
  dt *= (CO.debugSpeed || 1);   // test hook: the automated playthrough fast-forwards the walk
  if(CO.vault){ const v = CO.vault; v.t += dt/0.9; const k = Math.min(1, v.t); p.lerpVectors(v.from, v.to, k); p.y = Math.sin(k*Math.PI)*1.6; if(k >= 1){ p.y = 0; CO.vault = null; } return; }
  if(CO.browseT > 0) CO.browseT -= dt;

  const C = CO.courier, u = C.userData, route = coRoute();
  const dist = Math.hypot(C.position.x - p.x, C.position.z - p.z);
  if(CO.chase){
    if(!CHASE.active && !CO.bikeGo){ C.visible = false; CO.plateDist = dist; CO.bikeGo = 0.01; if(typeof hornSound==='function') hornSound(); setEye(null); }
    return;
  }
  if(CO.phase === 5){
    CO.revealT += dt; coObserve(dt);
    const n = Object.keys(CO.obs).length;
    if((n >= 3 && CO.revealT > 3) || CO.revealT > 20) coBeginChase();
    return;
  }
  const goal = route[Math.min(CO.wp, route.length-1)];
  const stop = CO_STOPS[CO.wp];
  let moving = false;
  if(CO.stopT > 0){
    CO.stopT -= dt;
    if(stop && stop.seller){ coSellerBeat(dist); C.rotation.y = Math.PI/2; }
    if(CO.stopT <= 0){ if(stop && stop.seller) coSellerEnd(dist); if(stop && stop.gate){ CO.gate.position.z = -33; } CO.wp++; }
  } else if(CO.wp < route.length){
    const waitForPlayer = dist > 30 && CO.wp >= 1;
    const dx = goal[0]-C.position.x, dz = goal[1]-C.position.z, d = Math.hypot(dx,dz);
    if(d < 0.15){
      const s = CO_STOPS[CO.wp];
      if(s){ CO.stopT = s.t; if(s.look) CO.lookT = 1.8; if(s.gate){ CO.gate.position.z = -36; } }
      else CO.wp++;
      if(CO.wp >= 3 && CO.phase < 2){ CO.phase = 2; completeObjective('co_cross'); setObjectiveText('co_follow', 'Follow the courier'); coSay('keep20', 'COMMANDER ADAEZE', 'Keep twenty metres. If he turns around, disappear.'); showHint('conceal', 'When he looks back: stand by people, browse a stall, or crouch in the dark', 'When he looks back: stand by people, browse a stall, or <b>CROUCH</b> in the dark'); }
      if(CO.wp >= 9 && CO.phase < 3){ CO.phase = 3; radioLine('COMMANDER ADAEZE', "He's gone into the alley. Don't lose him."); }
    } else if(!waitForPlayer){
      const sp = (CO.wp >= 9 ? 1.6 : 1.35) * dt; C.position.x += dx/d*Math.min(sp,d); C.position.z += dz/d*Math.min(sp,d); C.rotation.y = Math.atan2(dx,dz); moving = true;
    }
  }
  if(moving){ u.walkPhase = (u.walkPhase||0) + dt*6.5; const sw = Math.sin(u.walkPhase)*0.35; u.armR.rotation.x = -sw; u.legL.rotation.x = -sw*0.8; u.legR.rotation.x = sw*0.8; }
  if(CO.phase >= 2 && CO.phase < 4 && CO.wp >= 4 && CO.wp <= 8){ CO.nextLook -= dt; if(CO.nextLook <= 0 && CO.lookT <= 0){ CO.lookT = 1.6; CO.nextLook = 6 + Math.random()*4; } }
  let mode = 'idle';
  if(CO.lookT > 0){
    CO.lookT -= dt; mode = 'look';
    u.neck.rotation.y = Math.PI*0.85;
    const toP = Math.atan2(p.x - C.position.x, p.z - C.position.z);
    let dAng = toP - (C.rotation.y + Math.PI); while(dAng > Math.PI) dAng -= Math.PI*2; while(dAng < -Math.PI) dAng += Math.PI*2;
    if(dist < 17 && Math.abs(dAng) < 1.0 && !coConcealed(p)) CO.susp = Math.min(100, CO.susp + dt*62*(1 - dist/20));
  } else if(CO.susp > 0) CO.susp = Math.max(0, CO.susp - dt*8);
  const band = dist < 8 ? 'close' : dist > 28 ? 'far' : 'ok';
  if(band === 'close'){ CO.closeT += dt; CO.susp = Math.min(100, CO.susp + dt*14); if(CO.closeT > 1.6) coSay('autograph', 'COMMANDER ADAEZE', "Easy. You're following him, not collecting his autograph."); } else CO.closeT = 0;
  if(band === 'far'){ CO.farT += dt; if(CO.farT > 3) coSay('away'+Math.floor(CO.wp/3), 'COMMANDER ADAEZE', "He's getting away."); } else CO.farT = 0;
  if(CO.phase < 4){ setEye(CO.susp/100, mode); setFollow(dist, band); }
  if(CO.susp >= 100){
    CO.susp = 45; S.game.flags.co_spotted = (S.game.flags.co_spotted||0) + 1; CO.lookT = 0;
    radioLine('COMMANDER ADAEZE', "He's made you — break off, let him settle. Then pick him up again.");
    CO.stopT = Math.max(CO.stopT, 2.5);
  }
  if(CO.phase === 3 && CO.climbed && p.x > 27.2 && p.z < -32 && !CO.revealed){
    CO.revealed = true; CO.phase = 5; setEye(null); setFollow(null);
    completeObjective('co_follow');
    radioLine('COMMANDER ADAEZE', 'Tell me what you see.');
    showHint('observe', 'Look at each thing to record it', 'Look at each thing to record it');
    C.position.set(31.8, 0, -38.8); C.visible = true;
    coMarks();
  }
}

/* 1:45 the newspaper seller */
function coSellerBeat(dist){
  if(CO.heard) return;
  if(dist < 5.5){
    CO.heard = 'girl'; S.game.flags.co_heard = 'girl';
    CO.susp = Math.min(100, CO.susp + 45);
    radioLine('MAN IN BLUE', 'The girl moves tonight.', 2600);
    radioLine('COMMANDER ADAEZE', 'Girl?', 1600);
    radioLine('COMMANDER ADAEZE', '…Stay on him.', 2000);
  }
}
function coSellerEnd(dist){
  if(!CO.heard && dist < 17){
    CO.heard = 'engineer'; S.game.flags.co_heard = 'engineer';
    radioLine('NEWSPAPER SELLER', 'Same place?', 2000);
    radioLine('MAN IN BLUE', 'No. Engineer changed it.', 2600);
  }
  if(!CO.heard){ CO.heard = 'none'; S.game.flags.co_heard = 'none'; }
  setObjectiveText('co_follow', 'Do not lose the courier');
}

/* 2:40 observation markers */
function coMarks(){
  CO.targets = [
    { key:'vehicle', label:'VEHICLE', pos:()=>new THREE.Vector3(31, 1.4, -42.4), ev:{id:'co_vehicle', name:'Vehicle — white minivan, no rear plate light'} },
    { key:'victim',  label:'VICTIM',  pos:()=>new THREE.Vector3(CO.girl.position.x, 1.0, CO.girl.position.z), ev:{id:'co_victim', name:'Victim — a girl, about eight, cream dress'} },
    { key:'suspect', label:'SECOND SUSPECT', pos:()=>new THREE.Vector3(CO.second.position.x, 1.6, CO.second.position.z), ev:{id:'co_suspect', name:'Second suspect — masked, rifle sling'} },
  ];
  CO.targets.forEach(t=>{ const el = document.createElement('div'); el.className = 'obs-mark'; el.innerHTML = `<div class="om-fill"></div><div class="om-lbl">${t.label}</div>`; document.body.appendChild(el); t.el = el; CO.obsT[t.key] = 0; });
}
function coObserve(dt){
  const cam = ENGINE.camera; if(!cam || !CO.targets) return;
  const fwd = new THREE.Vector3(); cam.getWorldDirection(fwd);
  const W = window.innerWidth, H = window.innerHeight;
  for(const t of CO.targets){
    const w = t.pos(), v = w.clone().project(cam);
    const on = v.z < 1 && Math.abs(v.x) < 1 && Math.abs(v.y) < 1;
    t.el.style.display = on ? 'block' : 'none';
    if(on){ t.el.style.left = ((v.x*0.5+0.5)*W)+'px'; t.el.style.top = ((-v.y*0.5+0.5)*H)+'px'; }
    if(CO.obs[t.key]) continue;
    const to = w.clone().sub(cam.position).normalize();
    const looking = fwd.dot(to) > 0.94 && cam.position.distanceTo(w) < 26;
    if(looking){ CO.obsT[t.key] += dt; t.el.querySelector('.om-fill').style.height = Math.min(100, CO.obsT[t.key]/0.7*100)+'%'; }
    if(CO.obsT[t.key] >= 0.7){
      CO.obs[t.key] = true; t.el.classList.add('done');
      collectEvidence(Object.assign({xp:40}, t.ev)); refreshEvidenceCount();
      toast('RECORDED', t.ev.name, 1500);
    }
  }
}

/* 3:00 "Who's that?" — the chase that can't be won */
function coBeginChase(){
  S.game.flags.co_obs = Object.keys(CO.obs);
  (CO.targets||[]).forEach(t=>t.el && t.el.remove());
  CO.girl.rotation.y = Math.atan2(ENGINE.player.position.x - CO.girl.position.x, ENGINE.player.position.z - CO.girl.position.z);
  radioLine('MAN IN BLUE', "Who's that?", 1600);
  setTimeout(()=>{ CO.girl.visible = false; CO.second.visible = false; CO.driver.visible = false; }, 900);
  ENGINE.obstacles = ENGINE.obstacles.filter(o => o !== CO._screenObs);
  completeObjective('co_reveal');
  showHint('sprint', 'Hold <b>SHIFT</b> to sprint', 'Hold <b>RUN</b> to sprint');
  CO.chase = true;
  startChase({
    runner: CO.courier, label:'COURIER', speed: 6.1, catchDist: -1, headStart: 0.6,
    path: [[31.8,-38.8],[36.2,-38.2],[38.6,-36],[38.4,-29.6],[39.4,-24],[38.8,-18],[39.6,-10],[39.6,-7]],
    crowd: [], onEscaped: ()=>{},
  });
}

/* 3:20 "You get the plate?" */
function coPlateQuestion(){
  const close = CO.plateDist < 24;
  DIALOGUE.co_plate_run = [{ speaker:'COMMANDER ADAEZE (RADIO)', text:'You get the plate?', choices:[
    ...(close ? [{ text:'Partial.', tag:'lawful', flag:{ co_plate:'partial' }, next:'co_plate_partial' }] : []),
    { text:'No.', tag:'lawful', flag:{ co_plate:'none' }, next:'co_plate_none' },
    { text:'I saw the driver.', tag:'savvy', flag:{ co_plate:'driver' }, next:'co_plate_driver' },
  ]}];
  startDialogue('co_plate_run', ()=>{
    const c = S.game.flags.co_plate;
    if(c === 'partial') collectEvidence({id:'co_plate', name:'Okada plate — partial: KJA-1··', xp:60});
    if(c === 'driver')  collectEvidence({id:'co_driver', name:'Okada rider — red cap, scar on the left cheek', xp:60});
    refreshEvidenceCount();
    completeObjective('co_chase');
    prologueEnd();
  });
}

function prologueEnd(){
  CO.ended = true; clearRadio(); clearHint(); setEye(null);
  if(!S.game.completedMissions.includes('m0')) S.game.completedMissions.push('m0');
  showHUD(false); stopAmbient();
  titleCard(['NACECA', "OPERATION SERPENT'S ROUTE"], 3600, ()=>{ loadMission('m1'); });
}
