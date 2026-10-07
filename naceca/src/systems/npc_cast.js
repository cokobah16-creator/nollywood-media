/* =========================================================================
   NACECA · systems/npc_cast.js
   Ambient townspeople, built from the 14 reference renders (11 distinct
   looks). All procedural — patterned ankara fabric is painted to small
   canvases at load, so the whole set costs only a few kilobytes of code.

   makeExtra(kind) returns a rigged character for any of:
     fila_man · gele_purple · fruit_seller · cap_guy · tank_guy · gele_handbag
     student · mechanic · office · guard · bread_seller
   ========================================================================= */

/* ---------- ankara fabric textures ---------- */
const _fabricCache = {};
function fabricTexture(kind){
  if(_fabricCache[kind]) return _fabricCache[kind];
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d');
  const P = {
    dots:    { bg:'#d8a838', fg:'#7a4a1e', hi:'#f4dc98' },   // yellow, brown-ringed spots
    chain:   { bg:'#d0401c', fg:'#e8a830' },                 // orange wrapper, yellow links
    sun:     { bg:'#d86a10', fg:'#eeb030', ac:'#b8301a' },   // orange, sun medallions
    flowers: { bg:'#24782a', fg:'#c8b830' },                 // green blouse, yellow florals
    sunred:  { bg:'#c8341c', fg:'#e8aa28' },                 // red-orange, yellow suns
    leaf:    { bg:'#1a78b8', fg:'#3a96d0' },                 // blue, faint leaf texture
  }[kind];
  x.fillStyle = P.bg; x.fillRect(0, 0, 256, 256);
  if(kind === 'dots'){
    for(let r=0;r<4;r++) for(let q=0;q<4;q++){
      const cx = q*64 + (r%2?32:0) + 16, cy = r*64 + 32;
      x.fillStyle = P.fg; x.beginPath(); x.ellipse(cx, cy, 15, 11, 0, 0, Math.PI*2); x.fill();
      x.fillStyle = P.hi; x.beginPath(); x.ellipse(cx, cy, 8, 5.5, 0, 0, Math.PI*2); x.fill();
    }
  } else if(kind === 'chain'){
    x.strokeStyle = P.fg; x.lineWidth = 7;
    for(let r=0;r<4;r++){ for(let q=0;q<4;q++){ x.strokeRect(q*64+14, r*64+12, 30, 26); } }
    x.lineWidth = 9; for(const y of [56, 184]){ x.beginPath(); for(let t=0;t<=256;t+=16) x.lineTo(t, y + Math.sin(t/16)*6); x.stroke(); }
  } else if(kind === 'sun' || kind === 'sunred'){
    for(let r=0;r<2;r++) for(let q=0;q<2;q++){
      const cx = q*128 + 64, cy = r*128 + 64;
      x.fillStyle = P.fg; for(let k=0;k<12;k++){ const a=k*Math.PI/6; x.beginPath(); x.moveTo(cx,cy); x.arc(cx,cy,40,a,a+0.18); x.fill(); }
      x.fillStyle = P.bg; x.beginPath(); x.arc(cx,cy,22,0,Math.PI*2); x.fill();
      x.fillStyle = P.ac || P.fg; x.beginPath(); x.arc(cx,cy,12,0,Math.PI*2); x.fill();
    }
    x.fillStyle = P.fg; x.fillRect(0, 122, 256, 12);
    for(let q=0;q<8;q++){ x.save(); x.translate(q*32+16, 128); x.rotate(Math.PI/4); x.fillStyle = P.ac || '#c83a1e'; x.fillRect(-6,-6,12,12); x.restore(); }
  } else if(kind === 'flowers'){
    for(let r=0;r<3;r++) for(let q=0;q<3;q++){
      const cx = q*86 + (r%2?43:0) + 20, cy = r*86 + 40;
      x.fillStyle = P.fg; for(let k=0;k<8;k++){ const a=k*Math.PI/4; x.beginPath(); x.ellipse(cx+Math.cos(a)*12, cy+Math.sin(a)*12, 7, 4, a, 0, Math.PI*2); x.fill(); }
      x.fillStyle = P.bg; x.beginPath(); x.arc(cx,cy,5,0,Math.PI*2); x.fill();
    }
  } else if(kind === 'leaf'){
    x.strokeStyle = P.fg; x.lineWidth = 3;
    for(let k=0;k<26;k++){ const px=(k*53)%256, py=(k*97)%256; x.beginPath(); x.moveTo(px,py); x.lineTo(px+22,py+12); x.lineTo(px+6,py+26); x.closePath(); x.stroke(); }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 1.5);
  return (_fabricCache[kind] = t);
}
function fabricMat(kind){ return toonMat('#ffffff', { map: fabricTexture(kind) }); }
/* swap the shirt (and/or long garment) of a built character to a fabric */
function dressFabric(g, shirtKind, robeKind){
  const u = g.userData;
  if(shirtKind){ const m = fabricMat(shirtKind); (u.shirtParts||[]).slice(0,1).forEach(p=>{ p.material = m; }); }
  if(robeKind && u.robe){ u.robe.material = fabricMat(robeKind); }
}

/* a held pose shows immediately, not just once the update loop runs */
function applyPoseNow(g){
  const u = g.userData, P = u._pose; if(!P) return;
  if(P.armL) u.armL.rotation.set(P.armL[0], P.armL[1], P.armL[2]);
  if(P.armR) u.armR.rotation.set(P.armR[0], P.armR[1], P.armR[2]);
  if(P.elbowL != null) u.elbowL.rotation.x = P.elbowL;
  if(P.elbowR != null) u.elbowR.rotation.x = P.elbowR;
}

/* ---------- accessories ---------- */
function _mesh(geo, color, parent, x, y, z, outl=1.05){
  const m = new THREE.Mesh(geo, rigMat(color)); m.position.set(x, y, z); m.castShadow = true; parent.add(m); if(outl) outline(m, outl); return m;
}
function addHeadTray(g, contents='fruit'){
  const u = g.userData;
  const tray = _mesh(new THREE.CylinderGeometry(0.34, 0.26, 0.09, 18), '#ece4d8', u.neck, 0, 0.36, 0);
  if(contents === 'fruit'){
    for(let k=0;k<3;k++){ const b = _mesh(new THREE.TorusGeometry(0.08, 0.025, 6, 10, Math.PI*0.8), '#f0cc30', u.neck, -0.16+k*0.05, 0.44, -0.05, 0); b.rotation.set(Math.PI/2, 0, 0.5); }
    for(const [fx,fz] of [[0.02,0.06],[0.1,0.0],[-0.04,0.12]]) _mesh(new THREE.SphereGeometry(0.06, 8, 6), '#e04030', u.neck, fx, 0.45, fz, 0);
    _mesh(new THREE.DodecahedronGeometry(0.11), '#9ad050', u.neck, 0.14, 0.48, 0.08, 1.04);
  } else {
    for(let k=0;k<5;k++){ const l = _mesh(new THREE.CylinderGeometry(0.05,0.05,0.24,8), '#d08a40', u.neck, -0.16+k*0.08, 0.44, (k%2)*0.06-0.03, 0); l.rotation.z = Math.PI/2; }
  }
  return tray;
}
function addCarryTray(g, contents='bread'){
  const u = g.userData;
  const tray = _mesh(new THREE.CylinderGeometry(0.36, 0.3, 0.07, 18), '#ece4d8', g, 0, 1.12, 0.36);
  for(let k=0;k<6;k++){ const l = _mesh(new THREE.CylinderGeometry(0.05,0.055,0.26,8), '#d89048', g, -0.18+(k%3)*0.18, 1.2, 0.28+Math.floor(k/3)*0.14, 1.04); l.rotation.z = Math.PI/2; l.rotation.y = 0.3*(k%2?1:-1); }
  u._pose = Object.assign(u._pose||{}, { armL:[-0.95, 0, 0.1], armR:[-0.95, 0, -0.1], elbowL:-0.55, elbowR:-0.55 });
  applyPoseNow(g);
  return tray;
}
function addHandBag(g, kind='handbag', side='R'){
  const u = g.userData, hand = side==='L' ? u.handL : u.handR;
  if(kind === 'plastic'){ _mesh(new THREE.DodecahedronGeometry(0.13), '#eeeae4', hand.parent, 0, -0.42, 0.02, 1.04).scale.set(0.9, 1.3, 0.8); }
  else { const b = _mesh(new THREE.BoxGeometry(0.2, 0.15, 0.08), '#1e1a18', hand.parent, 0, -0.42, 0.03); _mesh(new THREE.TorusGeometry(0.06,0.012,6,12,Math.PI), '#1e1a18', hand.parent, 0, -0.33, 0.03, 0); _mesh(new THREE.BoxGeometry(0.03,0.04,0.01), '#c8a040', hand.parent, 0, -0.4, 0.075, 0); }
}
function addSunglasses(g){
  const u = g.userData;
  for(const sx of [-1,1]) _mesh(new THREE.BoxGeometry(0.075, 0.035, 0.012), '#0a0a0a', u.neck, sx*0.05, 0.12, 0.152, 0);
  _mesh(new THREE.BoxGeometry(0.03, 0.01, 0.01), '#0a0a0a', u.neck, 0, 0.13, 0.152, 0);
}
function addChain(g){
  const u = g.userData;
  const ch = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.006, 6, 20), rigMat('#d8d8d8')); ch.position.set(0, 0.47, 0.04); ch.rotation.x = Math.PI/2.4; u.spine.add(ch);
}
function addSlingBag(g){
  const u = g.userData;
  const strap = _mesh(new THREE.BoxGeometry(0.035, 0.62, 0.02), '#141414', u.spine, -0.02, 0.24, 0.15, 0); strap.rotation.z = 0.75;
  _mesh(new THREE.BoxGeometry(0.22, 0.11, 0.08), '#1a1a1a', u.spine, 0.1, 0.06, 0.17);
}
function addBackpack(g){
  const u = g.userData;
  _mesh(new THREE.BoxGeometry(0.32, 0.4, 0.16), '#1e1e22', u.spine, 0, 0.26, -0.2);
  for(const sx of [-1,1]) _mesh(new THREE.BoxGeometry(0.04, 0.42, 0.02), '#1e1e22', u.spine, sx*0.11, 0.26, 0.15, 0);
}
function addToolBelt(g){
  const belt = _mesh(new THREE.CylinderGeometry(0.175, 0.175, 0.05, 14), '#4a3018', g, 0, 1.0, 0, 1.03); belt.scale.z = 0.76;
  _mesh(new THREE.BoxGeometry(0.14, 0.16, 0.07), '#5a3a1e', g, 0.13, 0.9, 0.12);
  const w = _mesh(new THREE.BoxGeometry(0.02, 0.16, 0.012), '#c8ccd2', g, 0.11, 1.02, 0.15, 0); w.rotation.z = 0.15;
  _mesh(new THREE.BoxGeometry(0.018, 0.1, 0.018), '#d83a20', g, 0.16, 1.0, 0.15, 0);
}
function addLanyardTablet(g){
  const u = g.userData;
  const ly = _mesh(new THREE.TorusGeometry(0.09, 0.008, 6, 16, Math.PI), '#2a5ad0', u.spine, 0, 0.46, 0.13, 0); ly.rotation.z = Math.PI;
  _mesh(new THREE.BoxGeometry(0.06, 0.08, 0.008), '#f4f4f4', u.spine, 0, 0.3, 0.155, 0);
  // tablet held against the chest with the left arm
  u._pose = Object.assign(u._pose||{}, { armL:[-0.35, 0, 0.3], elbowL:-1.7 });
  applyPoseNow(g);
  const t = _mesh(new THREE.BoxGeometry(0.03, 0.3, 0.22), '#1a1a1e', u.elbowL, 0.04, -0.24, 0.06); t.rotation.y = 0.3;
}
function addGuardKit(g){
  const u = g.userData;
  for(const sx of [-1,1]) _mesh(new THREE.BoxGeometry(0.09, 0.02, 0.12), '#141414', u.spine, sx*0.2, 0.46, 0, 0);
  _mesh(new THREE.BoxGeometry(0.035, 0.045, 0.01), '#d8a64a', u.neck, -0.06, 0.24, 0.13, 0);   // beret badge
  const belt = _mesh(new THREE.CylinderGeometry(0.172, 0.172, 0.06, 14), '#141414', g, 0, 1.0, 0, 1.03); belt.scale.z = 0.76;
  _mesh(new THREE.BoxGeometry(0.07, 0.05, 0.01), '#d8a64a', g, 0, 1.0, 0.135, 0);
  for(const sx of [-1,1]) _mesh(new THREE.BoxGeometry(0.08, 0.07, 0.01), '#c8b888', u.spine, sx*0.08, 0.32, 0.135, 0);  // breast pockets
}

/* ---------- the eleven looks ---------- */
function makeExtra(kind){
  let g;
  switch(kind){
    case 'fila_man':
      g = buildNPCMesh('#5a3820', '#1a78b8', '#3a2414', '#0a0a0a', { hair:'cap', capColor:'#d8a020', goatee:true });
      dressFabric(g, 'leaf'); break;
    case 'gele_purple':
      g = buildNPCMesh('#6a4228', '#b01e20', '#2a1a12', '#0a0a0a', { female:true, hair:'gelePuff', capColor:'#9a24b8', robe:'#d8a838' });
      dressFabric(g, null, 'dots'); break;
    case 'fruit_seller':
      g = buildNPCMesh('#5a3826', '#c85a18', '#2a1a12', '#0a0a0a', { female:true, hair:'wrap', capColor:'#d05018', robe:'#d0401c' });
      dressFabric(g, null, 'chain'); addHeadTray(g, 'fruit'); addHandBag(g, 'plastic', 'R'); break;
    case 'cap_guy':
      g = buildNPCMesh('#5a3826', '#e0b020', '#3a2414', '#0a0a0a', { hair:'bcap', capColor:'#2a46b8' }); break;
    case 'tank_guy':
      g = buildNPCMesh('#5a3820', '#e8e8e2', '#4a5a24', '#0a0a0a', { hair:'twists', tank:true, goatee:true, shoe:'#e8e4dc' });
      addSunglasses(g); addSlingBag(g); addChain(g); break;
    case 'gele_handbag':
      g = buildNPCMesh('#5a3826', '#24782a', '#2a1a12', '#0a0a0a', { female:true, hair:'gele', capColor:'#d86a10', robe:'#d86a10' });
      dressFabric(g, 'flowers', 'sun'); addHandBag(g, 'handbag', 'L'); break;
    case 'student':
      g = buildNPCMesh('#5a3826', '#e4d8b8', '#5a3418', '#0a0a0a', { hair:'twists' });
      addBackpack(g); break;
    case 'mechanic':
      g = buildNPCMesh('#5a3826', '#1e2a5a', '#1e2a5a', '#0a0a0a', { hair:'bcap', capColor:'#1e2a5a', goatee:true, shoe:'#2a2018' });
      addToolBelt(g); break;
    case 'office':
      g = buildNPCMesh('#6a4228', '#ecece6', '#6a4228', '#0a0a0a', { female:true, hair:'updo', longSleeve:true, skirt:'#1e46b0' });
      addLanyardTablet(g); break;
    case 'guard':
      g = buildNPCMesh('#5a3826', '#c8b07a', '#2a2014', '#0a0a0a', { hair:'beret', capColor:'#141414', goatee:true });
      addGuardKit(g); break;
    case 'bread_seller':
      g = buildNPCMesh('#5a3826', '#e0a818', '#2a1a12', '#0a0a0a', { female:true, hair:'wrap', capColor:'#d04a1c', robe:'#c8341c' });
      dressFabric(g, null, 'sunred'); addCarryTray(g, 'bread'); break;
    default:
      g = buildNPCMesh('#5a3826', '#888888', '#333333', '#0a0a0a');
  }
  g.userData._extra = kind;
  return g;
}
const EXTRA_KINDS = ['fila_man','gele_purple','fruit_seller','cap_guy','tank_guy','gele_handbag','student','mechanic','office','guard','bread_seller'];

/* place a standing extra in a scene (ambient: not an interactable, never blocks) */
function placeExtra(scene, kind, x, z, yaw){
  const g = makeExtra(kind);
  g.position.set(x, 0, z); g.rotation.y = yaw || 0;
  scene.add(g); ENGINE.npcs.push(g);
  return g;
}


/* =========================================================================
   NACECA · systems/npc_cast_skinned.js (v10 — merges npc_cast.js into the
   skinned cast). The eleven townspeople looks from npc_cast.js (fila_man …
   bread_seller), dressed on the skinned bodies whenever the character art is
   loaded: ankara prints become wax-print wrappers, caps / geles / berets /
   glasses come from the gear set, and the props (head trays, bags, backpack,
   tool belt, tablet, guard kit) ride on the skeleton so they move with the
   idle animation. Without the art, makeExtra keeps npc_cast.js's procedural
   rigs (see makeExtraLegacy).
   ========================================================================= */
const EXTRA_OUTFITS = {
  fila_man:     { body:'M', skin:'#5a3820', torso:'#1a78b8', armA:'#1a78b8', armB:'#1a78b8', hips:'#3a2414', thigh:'#3a2414', shin:'#3a2414', gear:['Gear_Fila'], cap:'#d8a020', beard:'#0a0a0a' },
  gele_purple:  { body:'F', skin:'#6a4228', torso:'#b01e20', armA:'#b01e20', armB:'#b01e20', hips:'#d8a838', thigh:'#d8a838', shin:'#d8a838', gear:['Gear_F_Gele','Gear_F_Wrapper'], gele:'#9a24b8', wrapper:'#d8a838', trim:'#7a4a1e' },
  fruit_seller: { body:'F', skin:'#5a3826', torso:'#c85a18', armA:'#c85a18', armB:'#c85a18', hips:'#d0401c', thigh:'#d0401c', shin:'#d0401c', gear:['Gear_F_Gele','Gear_F_Wrapper'], gele:'#d05018', wrapper:'#d0401c', trim:'#e8a830' },
  cap_guy:      { body:'M', skin:'#5a3826', torso:'#e0b020', armA:'#e0b020', armB:'#e0b020', hips:'#3a2414', thigh:'#3a2414', shin:'#3a2414', gear:['Gear_Fila'], cap:'#2a46b8' },
  tank_guy:     { body:'M', skin:'#5a3820', torso:'#e8e8e2', armA:null, armB:null, hips:'#4a5a24', thigh:'#4a5a24', shin:'#4a5a24', shoe:'#e8e4dc', gear:['Gear_Glasses'], beard:'#0a0a0a' },
  gele_handbag: { body:'F', skin:'#5a3826', torso:'#24782a', armA:'#24782a', armB:'#24782a', hips:'#d86a10', thigh:'#d86a10', shin:'#d86a10', gear:['Gear_F_Gele','Gear_F_Wrapper'], gele:'#d86a10', wrapper:'#d86a10', trim:'#eeb030' },
  student:      { body:'M', skin:'#5a3826', torso:'#e4d8b8', armA:'#e4d8b8', armB:'#e4d8b8', hips:'#5a3418', thigh:'#5a3418', shin:'#5a3418' },
  mechanic:     { body:'M', skin:'#5a3826', torso:'#1e2a5a', armA:'#1e2a5a', armB:'#1e2a5a', armC:'#1e2a5a', hips:'#1e2a5a', thigh:'#1e2a5a', shin:'#1e2a5a', shoe:'#2a2018', gear:['Gear_Fila'], cap:'#1e2a5a', beard:'#0a0a0a' },
  office:       { body:'F', skin:'#6a4228', torso:'#ecece6', armA:'#ecece6', armB:'#ecece6', armC:'#ecece6', hips:'#1e46b0', thigh:'#1e46b0', shin:null, gear:['Gear_F_Bun'] },
  guard:        { body:'M', skin:'#5a3826', torso:'#c8b07a', armA:'#c8b07a', armB:'#c8b07a', hips:'#2a2014', thigh:'#2a2014', shin:'#2a2014', gear:['Gear_Beret'], beret:'#141414', beard:'#0a0a0a' },
  bread_seller: { body:'F', skin:'#5a3826', torso:'#e0a818', armA:'#e0a818', armB:'#e0a818', hips:'#c8341c', thigh:'#c8341c', shin:'#c8341c', gear:['Gear_F_Gele','Gear_F_Wrapper'], gele:'#d04a1c', wrapper:'#c8341c', trim:'#e8aa28' },
};
const _xMats = {};
function _xMat(c, rough){ const k = c + '|' + (rough || 0.7); return _xMats[k] || (_xMats[k] = new THREE.MeshStandardMaterial({ color:new THREE.Color(c).convertSRGBToLinear(), roughness:rough || 0.7, metalness:0 })); }
/* a prop placed in the character's own space, then handed to a bone so it follows the animation */
function _xProp(ch, bone, geo, color, pos, rot, rough){
  const m = new THREE.Mesh(geo, _xMat(color, rough)); m.castShadow = true;
  m.position.copy(pos); if(rot) m.rotation.set(rot[0], rot[1], rot[2]);
  ch.add(m); ch.updateMatrixWorld(true);
  const b = ch.getObjectByName(bone); if(b) b.attach(m);
  return m;
}
function _xBone(ch, name){ const b = ch.getObjectByName(name), v = new THREE.Vector3(); if(b) b.getWorldPosition(v); return v; }
function _xDress(g, kind){
  const ch = g.userData._char; if(!ch) return;
  const V = (x, y, z)=>new THREE.Vector3(x, y, z);
  ch.updateMatrixWorld(true);
  const H = _xBone(ch, 'Head'), S = _xBone(ch, 'spine_03'), Pv = _xBone(ch, 'pelvis'), hr = _xBone(ch, 'hand_r'), hl = _xBone(ch, 'hand_l');
  const front = S.z + 0.13, back = S.z - 0.15;
  const tray = (contents)=>{
    const top = H.y + 0.34;                       // over the head-tie
    _xProp(ch, 'Head', new THREE.CylinderGeometry(0.32, 0.25, 0.07, 18), '#ece4d8', V(H.x, top, H.z));
    if(contents === 'fruit'){
      for(let k=0;k<3;k++) _xProp(ch, 'Head', new THREE.TorusGeometry(0.08, 0.025, 6, 10, Math.PI*0.8), '#f0cc30', V(H.x - 0.16 + k*0.05, top + 0.07, H.z - 0.05), [Math.PI/2, 0, 0.5]);
      for(const [fx, fz] of [[0.02, 0.06], [0.1, 0.0], [-0.04, 0.12]]) _xProp(ch, 'Head', new THREE.SphereGeometry(0.06, 8, 6), '#e04030', V(H.x + fx, top + 0.08, H.z + fz), null, 0.5);
      _xProp(ch, 'Head', new THREE.DodecahedronGeometry(0.11), '#9ad050', V(H.x + 0.14, top + 0.11, H.z + 0.08));
    } else {
      for(let k=0;k<5;k++) _xProp(ch, 'Head', new THREE.CylinderGeometry(0.05, 0.055, 0.26, 8), '#d89048', V(H.x - 0.16 + k*0.08, top + 0.07, H.z + (k%2)*0.06 - 0.03), [0, 0.3*(k%2 ? 1 : -1), Math.PI/2]);
    }
  };
  switch(kind){
    case 'fruit_seller': tray('fruit'); _xProp(ch, 'hand_r', new THREE.DodecahedronGeometry(0.13), '#eeeae4', V(hr.x, hr.y - 0.14, hr.z), null, 0.5).scale.set(0.9, 1.3, 0.8); break;
    case 'bread_seller': tray('bread'); break;
    case 'gele_handbag':
      _xProp(ch, 'hand_l', new THREE.BoxGeometry(0.2, 0.15, 0.08), '#1e1a18', V(hl.x, hl.y - 0.13, hl.z), null, 0.45);
      _xProp(ch, 'hand_l', new THREE.TorusGeometry(0.06, 0.012, 6, 12, Math.PI), '#1e1a18', V(hl.x, hl.y - 0.05, hl.z)); break;
    case 'tank_guy':
      _xProp(ch, 'spine_03', new THREE.BoxGeometry(0.035, 0.62, 0.02), '#141414', V(S.x, S.y - 0.12, front + 0.01), [0, 0, 0.75]);
      _xProp(ch, 'spine_03', new THREE.BoxGeometry(0.22, 0.11, 0.08), '#1a1a1a', V(S.x + 0.1, S.y - 0.3, front + 0.03));
      _xProp(ch, 'spine_03', new THREE.TorusGeometry(0.085, 0.006, 6, 20), '#d8d8d8', V(S.x, S.y + 0.1, S.z + 0.05), [Math.PI/2.4, 0, 0], 0.3); break;
    case 'student':
      _xProp(ch, 'spine_03', new THREE.BoxGeometry(0.32, 0.40, 0.16), '#1e1e22', V(S.x, S.y - 0.08, back - 0.05));
      for(const sx of [-1, 1]) _xProp(ch, 'spine_03', new THREE.BoxGeometry(0.04, 0.42, 0.02), '#1e1e22', V(S.x + sx*0.11, S.y - 0.06, front)); break;
    case 'mechanic':
      _xProp(ch, 'pelvis', new THREE.CylinderGeometry(0.175, 0.175, 0.05, 14, 1, true), '#4a3018', V(Pv.x, Pv.y + 0.06, Pv.z)).scale.z = 0.8;
      _xProp(ch, 'pelvis', new THREE.BoxGeometry(0.14, 0.16, 0.07), '#5a3a1e', V(Pv.x + 0.14, Pv.y - 0.04, Pv.z + 0.11));
      _xProp(ch, 'pelvis', new THREE.BoxGeometry(0.02, 0.16, 0.012), '#c8ccd2', V(Pv.x + 0.11, Pv.y + 0.06, Pv.z + 0.15), [0, 0, 0.15], 0.35); break;
    case 'office':
      _xProp(ch, 'spine_03', new THREE.TorusGeometry(0.09, 0.008, 6, 16, Math.PI), '#2a5ad0', V(S.x, S.y + 0.08, front - 0.01), [0, 0, Math.PI]);
      _xProp(ch, 'spine_03', new THREE.BoxGeometry(0.06, 0.08, 0.008), '#f4f4f4', V(S.x, S.y - 0.08, front + 0.01));
      _xProp(ch, 'hand_l', new THREE.BoxGeometry(0.03, 0.3, 0.22), '#1a1a1e', V(hl.x + 0.04, hl.y - 0.06, hl.z + 0.04), [0, 0.3, 0], 0.4); break;
    case 'guard':
      for(const sx of [-1, 1]) _xProp(ch, 'spine_03', new THREE.BoxGeometry(0.09, 0.02, 0.12), '#141414', V(S.x + sx*0.19, S.y + 0.14, S.z));
      _xProp(ch, 'Head', new THREE.BoxGeometry(0.035, 0.045, 0.01), '#d8a64a', V(H.x - 0.06, H.y + 0.17, H.z + 0.11), null, 0.35);
      _xProp(ch, 'pelvis', new THREE.CylinderGeometry(0.172, 0.172, 0.06, 14, 1, true), '#141414', V(Pv.x, Pv.y + 0.06, Pv.z)).scale.z = 0.8;
      _xProp(ch, 'pelvis', new THREE.BoxGeometry(0.07, 0.05, 0.01), '#d8a64a', V(Pv.x, Pv.y + 0.06, Pv.z + 0.14), null, 0.35);
      for(const sx of [-1, 1]) _xProp(ch, 'spine_03', new THREE.BoxGeometry(0.08, 0.07, 0.01), '#c8b888', V(S.x + sx*0.08, S.y - 0.02, front)); break;
  }
}
/* the skinned path: npc_cast's looks on the real bodies */
const makeExtraLegacy = makeExtra;
makeExtra = function(kind){
  if(typeof PROXY === 'undefined' || !PROXY.enabled() || !EXTRA_OUTFITS[kind]) return makeExtraLegacy(kind);
  const o = EXTRA_OUTFITS[kind];
  const g = buildNPCMesh(o.skin, o.torso, o.hips, '#0a0a0a', { female: o.body === 'F' });
  if(!(g.userData && g.userData._proxy)) return makeExtraLegacy(kind);
  PROXY.dress(g, Object.assign({ hair:'#0a0a0a', shoe:'#16120e', res:512 }, o));
  _xDress(g, kind);
  g.userData._extra = kind; g.userData._idle = (kind === 'office' || kind === 'guard') ? 'idle' : (Math.random() < 0.5 ? 'talk' : 'idle');
  return g;
};


/* ---------- ambient behaviours: townspeople who do things ----------
   addBehaviour(g, kind, opts) — kinds: pack · argue · phone · sell · sit · wait · walk · gesture
   Each cycles small actions on its own timer, so a street of a dozen people reads as alive. */
const AMBIENT = [];
function addBehaviour(g, kind, opts={}){
  const b = { g, kind, t: Math.random()*5, step:0, next: 1+Math.random()*2, opts, base: g.position.clone(), yaw: g.rotation.y };
  g.userData._amb = b;
  if(kind === 'sit'){ const u = g.userData; u.legL.rotation.x = -1.45; u.legR.rotation.x = -1.45; g.position.y = -0.42; }
  if(kind === 'phone'){ g.userData._pose = Object.assign(g.userData._pose||{}, { armR:[-2.35, 0, -0.15], elbowR:-0.2 }); }
  AMBIENT.push(b); return b;
}
function clearBehaviours(){ AMBIENT.length = 0; }
function updateAmbientBehaviours(dt){
  for(const b of AMBIENT){
    const g = b.g, u = g.userData; if(!g.parent || u._down) continue;
    b.t += dt; b.next -= dt;
    const P = u._pose = u._pose || {};
    const s = Math.sin(b.t*3.2);
    switch(b.kind){
      case 'pack':      // folding up a food stall: reach, lift, set down
        P.armL = [-0.9 + s*0.35, 0, 0.1]; P.armR = [-0.9 - s*0.35, 0, -0.1]; P.elbowL = -0.6 - s*0.3; P.elbowR = -0.6 + s*0.3;
        u.spine.rotation.x = 0.25 + s*0.06; break;
      case 'argue':     // big hands, then a step back
        P.armR = [-0.8 + Math.sin(b.t*4.5)*0.6, 0, -0.25]; P.elbowR = -1.1 + Math.sin(b.t*4.5)*0.4;
        P.armL = b.step % 2 ? [-0.5 + Math.sin(b.t*3.7)*0.4, 0, 0.3] : [0, 0, 0.1]; P.elbowL = b.step % 2 ? -1.2 : -0.15;
        if(b.next < 0){ b.step++; b.next = 1.5 + Math.random()*2; }
        if(b.opts.face) g.rotation.y = Math.atan2(b.opts.face.x - g.position.x, b.opts.face.z - g.position.z);
        break;
      case 'phone':     // phone to the ear, weight shifting, turning to look up the road
        if(b.next < 0){ b.step++; b.next = 2 + Math.random()*3; }
        g.rotation.y = b.yaw + Math.sin(b.t*0.4)*0.5; break;
      case 'sell':      // wipes the table, then calls out to the road
        if(b.next < 0){ b.step = (b.step+1) % 3; b.next = 2.2 + Math.random()*2; }
        if(b.step === 0){ P.armR = [-0.7 + Math.sin(b.t*5)*0.15, Math.sin(b.t*5)*0.3, -0.1]; P.elbowR = -0.7; P.armL = [0,0,0.08]; P.elbowL = -0.15; }
        else if(b.step === 1){ P.armR = [-2.2 + Math.sin(b.t*6)*0.25, 0, -0.4]; P.elbowR = -0.4; }
        else { P.armR = [0,0,-0.08]; P.elbowR = -0.15; }
        break;
      case 'wait':      // checks watch → looks at the road → shifts weight
        if(b.next < 0){ b.step = (b.step+1) % 3; b.next = 2 + Math.random()*2.5; }
        if(b.step === 0){ P.armL = [-1.2, 0, 0.5]; P.elbowL = -1.4; } else { P.armL = [0,0,0.08]; P.elbowL = -0.15; }
        g.rotation.y = b.yaw + (b.step === 1 ? 0.9 : 0); g.position.x = b.base.x + (b.step === 2 ? 0.08 : 0); break;
      case 'gesture':   // talking with a friend
        P.armL = [-0.4 + Math.sin(b.t*2.6)*0.3, 0, 0.2]; P.elbowL = -0.9;
        if(b.opts.face) g.rotation.y = Math.atan2(b.opts.face.x - g.position.x, b.opts.face.z - g.position.z);
        break;
      case 'walk': {    // a loop between points
        const pts = b.opts.path; if(!pts) break;
        const tgt = pts[b.step % pts.length], dx = tgt[0]-g.position.x, dz = tgt[1]-g.position.z, d = Math.hypot(dx,dz);
        if(d < 0.2){ b.step++; break; }
        const sp = (b.opts.speed||1.1) * dt; g.position.x += dx/d*Math.min(sp,d); g.position.z += dz/d*Math.min(sp,d); g.rotation.y = Math.atan2(dx,dz);
        u.walkPhase = (u.walkPhase||0) + dt*6.5; const sw = Math.sin(u.walkPhase)*0.4;
        if(!u._pose || !u._pose.armL){ u.armL.rotation.x = sw; } if(!u._pose || !u._pose.armR){ u.armR.rotation.x = -sw; }
        u.legL.rotation.x = -sw*0.8; u.legR.rotation.x = sw*0.8; break; }
    }
  }
}
